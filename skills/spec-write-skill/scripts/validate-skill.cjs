#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const STANDARD_FIELDS = new Set([
  'name',
  'description',
  'license',
  'allowed-tools',
  'metadata',
  'compatibility',
]);
const STATUS_ORDER = { error: 0, warning: 1, not_checked: 2 };
const MAX_DEPTH = 8;
const MAX_FILES = 500;
const MAX_BYTES = 2 * 1024 * 1024;
const SECRET_NAME = /(^|[._-])(env|secret|secrets|credential|credentials|token|tokens|private|key|keys)([._-]|$)/i;
const TEXT_EXTENSIONS = new Set(['.md', '.txt', '.json', '.yaml', '.yml', '.js', '.cjs', '.mjs', '.py', '.sh']);

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

function normalizeRelative(value) {
  return value.split(path.sep).join('/');
}

function isInside(candidate, root) {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function finding(reasonCode, check, status, relativePath, message) {
  return { reason_code: reasonCode, check, status, path: relativePath, message };
}

function parseQuoted(value, lineNumber) {
  if (value.startsWith('"')) {
    if (!value.endsWith('"')) throw new Error(`line ${lineNumber}: unterminated double-quoted scalar`);
    try {
      return JSON.parse(value);
    } catch {
      throw new Error(`line ${lineNumber}: unsupported double-quoted scalar`);
    }
  }
  if (value.startsWith("'")) {
    if (!value.endsWith("'")) throw new Error(`line ${lineNumber}: unterminated single-quoted scalar`);
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
    if (/^\s/.test(raw)) throw new Error(`line ${index + 1}: unexpected nested content`);
    const match = raw.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/);
    if (!match) throw new Error(`line ${index + 1}: unsupported frontmatter syntax`);
    const key = match[1];
    let value = match[2] || '';
    if (Object.prototype.hasOwnProperty.call(fields, key)) {
      throw new Error(`line ${index + 1}: duplicate frontmatter field ${key}`);
    }
    if (/^(?:&|\*|!|\[|\{)/.test(value.trim())) {
      throw new Error(`line ${index + 1}: YAML anchors, tags, aliases, and flow collections are unsupported`);
    }
    if (key === 'metadata' && value.trim() === '') {
      const metadata = {};
      while (index + 1 < lines.length && /^\s+/.test(lines[index + 1])) {
        index += 1;
        const nested = lines[index].match(/^\s{2,}([A-Za-z0-9_.-]+):\s*(.*)$/);
        if (!nested || /^(?:&|\*|!|\[|\{)/.test(nested[2].trim())) {
          throw new Error(`line ${index + 1}: unsupported metadata syntax`);
        }
        if (Object.prototype.hasOwnProperty.call(metadata, nested[1])) {
          throw new Error(`line ${index + 1}: duplicate metadata field ${nested[1]}`);
        }
        metadata[nested[1]] = parseQuoted(nested[2].trim(), index + 1);
      }
      fields[key] = metadata;
      continue;
    }
    if (key === 'metadata') {
      throw new Error(`line ${index + 1}: metadata must be a one-level string map`);
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

function collectMarkdownReferences(content) {
  const references = [];
  const pattern = /\[[^\]]*\]\(([^)]+)\)/g;
  for (const match of content.matchAll(pattern)) {
    const raw = match[1].trim().replace(/^<|>$/g, '').split(/\s+["']/)[0];
    if (!raw || /^(?:https?:|mailto:|#)/i.test(raw)) continue;
    references.push(raw.split('#')[0]);
  }
  return references;
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
  let totalBytes = 0;
  let rootStat;

  try {
    rootStat = fs.lstatSync(requestedRoot);
  } catch (error) {
    return {
      schema_version: 'spec-write-skill.validator/v1',
      skill_root: requestedRoot,
      result: 'incomplete',
      ok: false,
      findings: [finding('skill_root_unreadable', 'input', 'not_checked', null, error.message)],
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

  if (options.authorizedRoot) {
    try {
      const authorized = fs.realpathSync(path.resolve(options.authorizedRoot));
      if (!isInside(realRoot, authorized)) {
        findings.push(finding('skill_root_outside_authorized_root', 'path-safety', 'error', '.', 'Skill root is outside the authorized root.'));
      }
    } catch (error) {
      incomplete = true;
      findings.push(finding('authorized_root_unavailable', 'path-safety', 'not_checked', null, error.message));
    }
  }

  function walk(directory, depth) {
    if (depth > MAX_DEPTH) {
      incomplete = true;
      findings.push(finding('inventory_depth_exceeded', 'inventory', 'not_checked', normalizeRelative(path.relative(realRoot, directory)) || '.', `Inventory depth exceeds ${MAX_DEPTH}.`));
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
        inventory.directories.push(relative);
        walk(absolute, depth + 1);
        continue;
      }
      if (!stat.isFile()) {
        findings.push(finding('special_file_not_allowed', 'path-safety', 'error', relative, 'FIFO, socket, device, or other special files are not allowed.'));
        continue;
      }
      fileCount += 1;
      totalBytes += stat.size;
      inventory.files.push(relative);
      if (relative.startsWith('scripts/')) inventory.scripts.push(relative);
      if (fileCount > MAX_FILES || totalBytes > MAX_BYTES) {
        incomplete = true;
        findings.push(finding('inventory_budget_exceeded', 'inventory', 'not_checked', relative, `Inventory exceeds ${MAX_FILES} files or ${MAX_BYTES} bytes.`));
        return;
      }
      if (SECRET_NAME.test(entry.name)) {
        findings.push(finding('secret_like_file_not_read', 'privacy', 'warning', relative, 'Secret-like file was inventoried without reading its contents.'));
        continue;
      }
      if (!TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;
      let content;
      try {
        content = fs.readFileSync(absolute, 'utf8');
      } catch (error) {
        incomplete = true;
        findings.push(finding('text_file_unreadable', 'inventory', 'not_checked', relative, error.message));
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
      const content = fs.readFileSync(skillMdPath, 'utf8');
      const frontmatter = extractFrontmatter(content);
      if (frontmatter === null) {
        findings.push(finding('frontmatter_missing_or_unclosed', 'frontmatter', 'error', 'SKILL.md', 'SKILL.md requires closed YAML frontmatter.'));
      } else {
        let fields;
        try {
          fields = parseFrontmatterSubset(frontmatter);
        } catch (error) {
          incomplete = true;
          findings.push(finding('frontmatter_subset_unsupported', 'frontmatter', 'not_checked', 'SKILL.md', error.message));
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
    skill_root: realRoot,
    result,
    ok: result === 'pass',
    findings,
    inventory,
  };
}

function renderHuman(report) {
  const lines = [`Skill validation: ${report.result}`, `Root: ${report.skill_root}`];
  for (const item of report.findings) {
    lines.push(`[${item.status}] ${item.reason_code}${item.path ? ` (${item.path})` : ''}: ${item.message}`);
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

module.exports = { parseFrontmatterSubset, validateSkill };
