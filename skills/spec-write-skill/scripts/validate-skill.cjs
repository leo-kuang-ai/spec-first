#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { TextDecoder } = require('node:util');
const {
  INSPECTION_LIMITS: VALIDATION_LIMITS,
  TEXT_EXTENSIONS,
  UNSAFE_PATH_CHARACTERS,
  collectMarkdownReferences,
  containsSensitiveContent,
  escapeUntrustedText,
  finding,
  findSymlinkSegment,
  isInside,
  isSecretLikePath,
  normalizeRelative,
  readStableRegularFile,
} = require('./lib/package-inspection.cjs');

const STANDARD_FIELDS = new Set([
  'name',
  'description',
  'license',
  'allowed-tools',
  'metadata',
  'compatibility',
]);
const STATUS_ORDER = { error: 0, warning: 1, not_checked: 2 };

class FrontmatterParseError extends Error {
  constructor(kind, message) {
    super(message);
    this.kind = kind;
  }
}

function parseArgs(argv) {
  const args = { skillDir: null, json: false, strictPortable: false, authorizedRoot: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--json') args.json = true;
    else if (arg === '--strict-portable') args.strictPortable = true;
    else if (arg === '--authorized-root') args.authorizedRoot = argv[++index] || null;
    else if (!arg.startsWith('-') && !args.skillDir) args.skillDir = arg;
    else throw new Error(`Unknown or incomplete argument: ${arg}`);
  }
  if (!args.skillDir) throw new Error('Usage: validate-skill.cjs <skill-dir> [--json] [--strict-portable] [--authorized-root <dir>]');
  return args;
}


function invalidFrontmatter(message) {
  return new FrontmatterParseError('invalid', message);
}

function unsupportedFrontmatter(message) {
  return new FrontmatterParseError('unsupported', message);
}


function nearestExistingAncestor(absolutePath) {
  let current = absolutePath;
  while (true) {
    try {
      fs.lstatSync(current);
      return current;
    } catch {
      const parent = path.dirname(current);
      if (parent === current) return null;
      current = parent;
    }
  }
}


function parseQuoted(value, lineNumber) {
  if (value.startsWith('"')) {
    if (!value.endsWith('"')) throw invalidFrontmatter(`line ${lineNumber}: unterminated double-quoted scalar`);
    try {
      return JSON.parse(value);
    } catch {
      throw invalidFrontmatter(`line ${lineNumber}: invalid double-quoted scalar`);
    }
  }
  if (value.startsWith("'")) {
    if (!value.endsWith("'")) throw invalidFrontmatter(`line ${lineNumber}: unterminated single-quoted scalar`);
    return value.slice(1, -1).replace(/''/g, "'");
  }
  return value;
}

function parseFrontmatterSubset(frontmatter) {
  const fields = {};
  const lines = frontmatter.split('\n');
  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index];
    if (!raw.trim() || raw.trimStart().startsWith('#')) continue;
    if (/^\s/.test(raw)) throw unsupportedFrontmatter(`line ${index + 1}: nested YAML is outside the supported subset`);
    const match = raw.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/);
    if (!match) throw unsupportedFrontmatter(`line ${index + 1}: YAML form is outside the supported subset`);
    const key = match[1];
    let value = match[2] || '';
    if (Object.prototype.hasOwnProperty.call(fields, key)) {
      throw invalidFrontmatter(`line ${index + 1}: duplicate frontmatter field ${key}`);
    }
    if (/^(?:&|\*|!|\[|\{)/.test(value.trim())) {
      throw unsupportedFrontmatter(`line ${index + 1}: YAML anchors, tags, aliases, and flow collections are unsupported`);
    }
    if (key === 'metadata' && value.trim() === '') {
      const metadata = {};
      while (index + 1 < lines.length && /^\s+/.test(lines[index + 1])) {
        index += 1;
        const nested = lines[index].match(/^\s{2,}([A-Za-z0-9_.-]+):\s*(.*)$/);
        if (!nested || /^(?:&|\*|!|\[|\{)/.test(nested[2].trim())) {
          throw unsupportedFrontmatter(`line ${index + 1}: metadata YAML is outside the supported subset`);
        }
        if (Object.prototype.hasOwnProperty.call(metadata, nested[1])) {
          throw invalidFrontmatter(`line ${index + 1}: duplicate metadata field ${nested[1]}`);
        }
        metadata[nested[1]] = parseQuoted(nested[2].trim(), index + 1);
      }
      fields[key] = metadata;
      continue;
    }
    if (key === 'metadata') {
      throw unsupportedFrontmatter(`line ${index + 1}: metadata must be a one-level string map`);
    }
    if (value === '|' || value === '>') {
      const folded = value === '>';
      const chunks = [];
      while (index + 1 < lines.length && (/^\s+/.test(lines[index + 1]) || lines[index + 1] === '')) {
        index += 1;
        chunks.push(lines[index].replace(/^\s{2}/, ''));
      }
      value = folded ? chunks.join(' ').replace(/\s+/g, ' ').trim() : chunks.join('\n');
    } else {
      value = parseQuoted(value.trim(), index + 1);
    }
    fields[key] = value;
  }
  return fields;
}

function extractFrontmatter(content) {
  const normalized = content.replace(/\r\n/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  return match ? match[1] : null;
}

function validateSkill(options) {
  const requestedRoot = path.resolve(options.skillDir);
  const findings = [];
  const inventory = {
    files: [],
    directories: [],
    standard_fields: [],
    extension_fields: [],
    references: [],
    symlinks: [],
    scripts: [],
  };
  let incomplete = false;
  let fileCount = 0;
  let totalTextBytes = 0;
  let secretLikeCount = 0;
  let inventoryHalted = false;
  let rootStat;
  let authorizedReal = null;

  const symlinkSegment = findSymlinkSegment(requestedRoot);
  if (symlinkSegment) {
    findings.push(finding('skill_root_symlink_segment', 'path-safety', 'error', '.', 'Skill root path must not traverse a symbolic-link segment.'));
  }

  if (options.authorizedRoot) {
    const requestedAuthorizedRoot = path.resolve(options.authorizedRoot);
    try {
      authorizedReal = fs.realpathSync(requestedAuthorizedRoot);
      if (!isInside(requestedRoot, requestedAuthorizedRoot)) {
        findings.push(finding('skill_root_outside_authorized_root', 'path-safety', 'error', '.', 'Skill root is lexically outside the authorized root.'));
      }
      const nearest = nearestExistingAncestor(requestedRoot);
      if (nearest) {
        const nearestReal = fs.realpathSync(nearest);
        if (!isInside(nearestReal, authorizedReal)) {
          findings.push(finding('skill_root_outside_authorized_root', 'path-safety', 'error', '.', 'Nearest existing Skill ancestor resolves outside the authorized root.'));
        }
      }
    } catch (error) {
      incomplete = true;
      findings.push(finding('authorized_root_unavailable', 'path-safety', 'not_checked', null, error.message));
    }
  }

  try {
    rootStat = fs.lstatSync(requestedRoot);
  } catch (error) {
    incomplete = true;
    findings.push(finding('skill_root_unreadable', 'input', 'not_checked', null, error.message));
    findings.sort((a, b) => (
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
      || a.reason_code.localeCompare(b.reason_code)
      || String(a.path || '').localeCompare(String(b.path || ''))
    ));
    const result = findings.some((item) => item.status === 'error') ? 'fail' : 'incomplete';
    return {
      schema_version: 'spec-write-skill.validator/v1',
      skill_root: escapeUntrustedText(requestedRoot),
      result,
      ok: false,
      findings,
      inventory,
    };
  }

  if (rootStat.isSymbolicLink()) {
    findings.push(finding('skill_root_symlink', 'path-safety', 'error', '.', 'Skill root must not be a symbolic link.'));
  } else if (!rootStat.isDirectory()) {
    findings.push(finding('skill_root_not_directory', 'input', 'error', '.', 'Skill root must be a directory.'));
  }

  let realRoot = requestedRoot;
  try {
    realRoot = fs.realpathSync(requestedRoot);
  } catch (error) {
    incomplete = true;
    findings.push(finding('skill_root_realpath_unavailable', 'path-safety', 'not_checked', '.', error.message));
  }

  if (authorizedReal) {
    try {
      if (!isInside(realRoot, authorizedReal)) {
        findings.push(finding('skill_root_outside_authorized_root', 'path-safety', 'error', '.', 'Skill root is outside the authorized root.'));
      }
    } catch (error) {
      incomplete = true;
      findings.push(finding('authorized_root_unavailable', 'path-safety', 'not_checked', null, error.message));
    }
  }

  function walk(directory, depth) {
    if (inventoryHalted) return;
    if (depth > VALIDATION_LIMITS.maxDepth) {
      incomplete = true;
      findings.push(finding('inventory_depth_exceeded', 'inventory', 'not_checked', normalizeRelative(path.relative(realRoot, directory)) || '.', `Inventory depth exceeds ${VALIDATION_LIMITS.maxDepth}.`));
      return;
    }
    let entries;
    try {
      entries = fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      incomplete = true;
      findings.push(finding('directory_unreadable', 'inventory', 'not_checked', normalizeRelative(path.relative(realRoot, directory)) || '.', error.message));
      return;
    }
    for (const entry of entries) {
      const absolute = path.join(directory, entry.name);
      const relative = normalizeRelative(path.relative(realRoot, absolute));
      if (UNSAFE_PATH_CHARACTERS.test(relative)) {
        findings.push(finding('unsafe_path_characters', 'path-safety', 'error', relative, 'Package path contains control or bidirectional override characters.'));
        continue;
      }
      let stat;
      try {
        stat = fs.lstatSync(absolute);
      } catch (error) {
        incomplete = true;
        findings.push(finding('path_unreadable', 'inventory', 'not_checked', relative, error.message));
        continue;
      }
      if (stat.isSymbolicLink()) {
        inventory.symlinks.push(relative);
        findings.push(finding('symlink_not_allowed', 'path-safety', 'error', relative, 'Symbolic links are not followed or accepted in the portable package.'));
        continue;
      }
      if (stat.isDirectory()) {
        if (isSecretLikePath(relative)) {
          secretLikeCount += 1;
          inventory.directories.push(`[redacted-secret-like-path-${secretLikeCount}]`);
          findings.push(finding('secret_like_directory_not_read', 'privacy', 'warning', null, 'A secret-like directory was inventoried without reading or returning its path.'));
          continue;
        }
        inventory.directories.push(relative);
        walk(absolute, depth + 1);
        if (inventoryHalted) return;
        continue;
      }
      if (!stat.isFile()) {
        findings.push(finding('special_file_not_allowed', 'path-safety', 'error', relative, 'FIFO, socket, device, or other special files are not allowed.'));
        continue;
      }
      fileCount += 1;
      if (fileCount > VALIDATION_LIMITS.maxFiles) {
        incomplete = true;
        inventoryHalted = true;
        findings.push(finding('inventory_file_budget_exceeded', 'inventory', 'not_checked', relative, `Inventory exceeds ${VALIDATION_LIMITS.maxFiles} files.`));
        return;
      }
      if (isSecretLikePath(relative)) {
        secretLikeCount += 1;
        inventory.files.push(`[redacted-secret-like-path-${secretLikeCount}]`);
        findings.push(finding('secret_like_file_not_read', 'privacy', 'warning', null, 'A secret-like file was inventoried without reading or returning its path.'));
        continue;
      }
      inventory.files.push(relative);
      if (relative.startsWith('scripts/')) inventory.scripts.push(relative);
      if (!TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;
      if (stat.size > VALIDATION_LIMITS.maxTextFileBytes) {
        incomplete = true;
        findings.push(finding('text_file_budget_exceeded', 'inventory', 'not_checked', relative, `Readable text exceeds ${VALIDATION_LIMITS.maxTextFileBytes} bytes.`));
        continue;
      }
      if (totalTextBytes + stat.size > VALIDATION_LIMITS.maxTextBytes) {
        incomplete = true;
        inventoryHalted = true;
        findings.push(finding('inventory_text_budget_exceeded', 'inventory', 'not_checked', relative, `Readable text exceeds ${VALIDATION_LIMITS.maxTextBytes} total bytes.`));
        return;
      }
      let content;
      try {
        const bytes = readStableRegularFile(absolute);
        content = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        totalTextBytes += bytes.length;
      } catch (error) {
        incomplete = true;
        const reasonCode = error && error.code === 'ERR_ENCODING_INVALID_ENCODED_DATA'
          ? 'text_file_invalid_utf8'
          : 'text_file_unreadable';
        findings.push(finding(reasonCode, 'inventory', 'not_checked', relative, reasonCode === 'text_file_invalid_utf8' ? 'Text file is not valid UTF-8.' : error.message));
        continue;
      }
      if (containsSensitiveContent(content)) {
        findings.push(finding('sensitive_content_detected', 'privacy', 'error', relative, 'High-confidence sensitive content detected; value was not returned and file is excluded from semantic review.'));
        continue;
      }
      if (relative.endsWith('.md')) {
        for (const reference of collectMarkdownReferences(content)) {
          const target = path.resolve(path.dirname(absolute), reference);
          const record = `${relative} -> ${normalizeRelative(path.relative(realRoot, target))}`;
          inventory.references.push(record);
          if (!isInside(target, realRoot)) {
            findings.push(finding('reference_escapes_skill_root', 'references', 'error', relative, `Reference escapes Skill root: ${reference}`));
          } else if (!fs.existsSync(target)) {
            findings.push(finding('reference_target_missing', 'references', 'error', relative, `Reference target does not exist: ${reference}`));
          }
        }
      }
    }
  }

  if (rootStat.isDirectory() && !rootStat.isSymbolicLink()) walk(realRoot, 0);

  const skillMdPath = path.join(realRoot, 'SKILL.md');
  if (!fs.existsSync(skillMdPath)) {
    findings.push(finding('skill_md_missing', 'frontmatter', 'error', 'SKILL.md', 'SKILL.md is required.'));
  } else {
    try {
      const content = new TextDecoder('utf-8', { fatal: true }).decode(readStableRegularFile(skillMdPath));
      const frontmatter = extractFrontmatter(content);
      if (frontmatter === null) {
        findings.push(finding('frontmatter_missing_or_unclosed', 'frontmatter', 'error', 'SKILL.md', 'SKILL.md requires closed YAML frontmatter.'));
      } else {
        let fields;
        try {
          fields = parseFrontmatterSubset(frontmatter);
        } catch (error) {
          if (error instanceof FrontmatterParseError && error.kind === 'invalid') {
            findings.push(finding('frontmatter_invalid', 'frontmatter', 'error', 'SKILL.md', error.message));
          } else {
            incomplete = true;
            findings.push(finding('frontmatter_subset_unsupported', 'frontmatter', 'not_checked', 'SKILL.md', error.message));
          }
          fields = null;
        }
        if (fields) {
          inventory.standard_fields = Object.keys(fields).filter((key) => STANDARD_FIELDS.has(key)).sort();
          inventory.extension_fields = Object.keys(fields).filter((key) => !STANDARD_FIELDS.has(key)).sort();
          for (const key of inventory.extension_fields) {
            findings.push(finding('unknown_frontmatter_extension', 'frontmatter-fields', options.strictPortable ? 'error' : 'warning', 'SKILL.md', `Target-owned field preserved: ${key}`));
          }
          if (typeof fields.name !== 'string' || !fields.name) {
            findings.push(finding('name_missing', 'frontmatter', 'error', 'SKILL.md', 'Frontmatter name is required.'));
          } else {
            if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fields.name) || fields.name.length > 64) {
              findings.push(finding('name_invalid', 'frontmatter', 'error', 'SKILL.md', 'Name must be kebab-case and at most 64 characters.'));
            }
            if (path.basename(realRoot) !== fields.name) {
              findings.push(finding('name_directory_mismatch', 'frontmatter', 'error', 'SKILL.md', 'Frontmatter name must match the Skill directory name.'));
            }
          }
          if (typeof fields.description !== 'string' || !fields.description.trim()) {
            findings.push(finding('description_missing', 'frontmatter', 'error', 'SKILL.md', 'Frontmatter description is required.'));
          } else {
            if (fields.description.length > 1024) {
              findings.push(finding('description_too_long', 'frontmatter', 'error', 'SKILL.md', 'Description must be at most 1024 characters.'));
            }
            if (/[<>]/.test(fields.description)) {
              findings.push(finding('description_angle_brackets', 'frontmatter', 'error', 'SKILL.md', 'Description must not contain angle brackets.'));
            }
          }
        }
      }
    } catch (error) {
      incomplete = true;
      findings.push(finding('skill_md_unreadable', 'frontmatter', 'not_checked', 'SKILL.md', error.message));
    }
  }

  for (const key of Object.keys(inventory)) inventory[key].sort();
  findings.sort((a, b) => (
    STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    || a.reason_code.localeCompare(b.reason_code)
    || String(a.path || '').localeCompare(String(b.path || ''))
  ));
  const hasErrors = findings.some((item) => item.status === 'error');
  const result = hasErrors ? 'fail' : incomplete ? 'incomplete' : 'pass';
  return {
    schema_version: 'spec-write-skill.validator/v1',
    skill_root: escapeUntrustedText(realRoot),
    result,
    ok: result === 'pass',
    findings,
    inventory,
  };
}

function renderHuman(report) {
  const lines = [`Skill validation: ${escapeUntrustedText(report.result)}`, `Root: ${escapeUntrustedText(report.skill_root)}`];
  for (const item of report.findings) {
    const safePath = item.path ? ` (${escapeUntrustedText(item.path)})` : '';
    lines.push(`[${escapeUntrustedText(item.status)}] ${escapeUntrustedText(item.reason_code)}${safePath}: ${escapeUntrustedText(item.message)}`);
  }
  if (report.findings.length === 0) lines.push('No mechanical findings.');
  return lines.join('\n');
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }
  const report = validateSkill(options);
  process.stdout.write(`${options.json ? JSON.stringify(report, null, 2) : renderHuman(report)}\n`);
  process.exit(report.result === 'pass' ? 0 : report.result === 'fail' ? 1 : 2);
}

if (require.main === module) main();

module.exports = {
  VALIDATION_LIMITS,
  parseFrontmatterSubset,
  renderHuman,
  validateSkill,
};
