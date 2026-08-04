'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { TextDecoder } = require('node:util');

const INSPECTION_LIMITS = Object.freeze({
  maxDepth: 16,
  maxFiles: 1000,
  maxTextFileBytes: 1024 * 1024,
  maxTextBytes: 10 * 1024 * 1024,
});
const SECRET_NAME = /(^|[._-])(env|secret|secrets|credential|credentials|token|tokens|private|key|keys)([._-]|$)/i;
const TEXT_EXTENSIONS = new Set(['.md', '.txt', '.json', '.yaml', '.yml', '.js', '.cjs', '.mjs', '.py', '.sh', '.cfg', '.ini', '.cert', '.pem', '.key']);
const UNSAFE_PATH_CHARACTERS = /[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u;
const UNSAFE_PATH_CHARACTERS_GLOBAL = /[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/gu;
const SENSITIVE_CONTENT_PATTERNS = [
  /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/,
  /\bAuthorization\s*:\s*(?:Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{12,}/i,
  /\bBearer\s+[A-Za-z0-9._~+/=-]{20,}/i,
  /\bsk-[A-Za-z0-9]{20,}\b/,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
  /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\b(?:api[_-]?key|access[_-]?token|secret[_-]?key|client[_-]?secret|password)\b\s*[:=]\s*["']?[^\s"']{12,}/i,
];

function normalizeRelative(value) {
  return value.split(path.sep).join('/');
}

function escapeUntrustedText(value) {
  return String(value).replace(UNSAFE_PATH_CHARACTERS_GLOBAL, (character) => {
    const codePoint = character.codePointAt(0).toString(16).padStart(4, '0');
    return `\\u${codePoint}`;
  });
}

function finding(reasonCode, check, status, relativePath, message) {
  return {
    reason_code: reasonCode,
    check,
    status,
    path: relativePath === null ? null : escapeUntrustedText(relativePath),
    message: escapeUntrustedText(message),
  };
}

function isInside(candidate, root) {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function isSecretLikePath(relativePath) {
  return relativePath.split('/').some((segment) => SECRET_NAME.test(segment));
}

function containsSensitiveContent(content) {
  return SENSITIVE_CONTENT_PATTERNS.some((pattern) => pattern.test(content));
}

function findSymlinkSegment(absolutePath) {
  const parsed = path.parse(absolutePath);
  const segments = path.relative(parsed.root, absolutePath).split(path.sep).filter(Boolean);
  let current = parsed.root;
  for (const segment of segments) {
    current = path.join(current, segment);
    try {
      if (fs.lstatSync(current).isSymbolicLink()) return current;
    } catch (error) {
      if (error && error.code === 'ENOENT') return null;
      throw error;
    }
  }
  return null;
}

function* collectMarkdownReferences(content) {
  const pattern = /\[[^\]]*\]\(([^)]+)\)/g;
  for (const match of content.matchAll(pattern)) {
    if (match.index > 0 && content[match.index - 1] === '!') continue;
    const raw = match[1].trim().replace(/^<|>$/g, '').split(/\s+["']/)[0];
    if (!raw || /^(?:https?:|mailto:|#)/i.test(raw)) continue;
    yield raw.split('#')[0];
  }
}

function sameIdentity(before, after) {
  return before.dev === after.dev && before.ino === after.ino && before.size === after.size && before.mtimeMs === after.mtimeMs;
}

function readStableRegularFile(absolutePath) {
  if (findSymlinkSegment(absolutePath)) throw new Error('path traverses a symbolic-link segment');
  const flags = fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW;
  const descriptor = fs.openSync(absolutePath, flags);
  try {
    const before = fs.fstatSync(descriptor);
    if (!before.isFile()) throw new Error('not a regular file');
    const bytes = fs.readFileSync(descriptor);
    const after = fs.fstatSync(descriptor);
    if (!sameIdentity(before, after)) throw new Error('file changed during read');
    return bytes;
  } finally {
    fs.closeSync(descriptor);
  }
}

function inspectPackage(skillDir, options = {}) {
  const limits = { ...INSPECTION_LIMITS, ...(options.limits || {}) };
  const maxReferenceEdges = options.limits && Number.isInteger(options.limits.maxReferenceEdges)
    ? options.limits.maxReferenceEdges
    : 10000;
  const requestedRoot = path.resolve(skillDir);
  const findings = [];
  const regularFiles = [];
  const markdown = new Map();
  const directReferenceEdges = [];
  let incomplete = false;
  let halted = false;
  let fileCount = 0;
  let textBytes = 0;
  let referenceHalted = false;
  let referenceEdgesChecked = 0;
  let root;

  function addFinding(...args) {
    findings.push(finding(...args));
  }

  if (findSymlinkSegment(requestedRoot)) {
    addFinding('skill_root_symlink_segment', 'path-safety', 'error', '.', 'Skill root path must not traverse a symbolic-link segment.');
    return finalize();
  }
  try {
    const rootStat = fs.lstatSync(requestedRoot);
    if (rootStat.isSymbolicLink()) {
      addFinding('skill_root_symlink', 'path-safety', 'error', '.', 'Skill root must not be a symbolic link.');
      return finalize();
    }
    if (!rootStat.isDirectory()) {
      addFinding('skill_root_not_directory', 'input', 'error', '.', 'Skill root must be a directory.');
      return finalize();
    }
    root = fs.realpathSync(requestedRoot);
  } catch (error) {
    addFinding('skill_root_unreadable', 'input', 'not_checked', null, error.message);
    return finalize();
  }

  function inspectFile(absolute, relative, stat) {
    regularFiles.push(relative);
    if (!TEXT_EXTENSIONS.has(path.extname(relative).toLowerCase())) return;
    if (stat.size > limits.maxTextFileBytes) {
      incomplete = true;
      addFinding('text_file_budget_exceeded', 'inventory', 'not_checked', relative, `Readable text exceeds ${limits.maxTextFileBytes} bytes.`);
      return;
    }
    if (textBytes + stat.size > limits.maxTextBytes) {
      incomplete = true;
      halted = true;
      addFinding('inventory_text_budget_exceeded', 'inventory', 'not_checked', relative, `Readable text exceeds ${limits.maxTextBytes} total bytes.`);
      return;
    }
    let content;
    try {
      const bytes = readStableRegularFile(absolute);
      content = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      textBytes += bytes.length;
      if (containsSensitiveContent(content)) {
        addFinding('sensitive_content_detected', 'privacy', 'error', relative, 'High-confidence sensitive content detected; value was not returned.');
        return;
      }
      if (relative.endsWith('.md')) {
        markdown.set(relative, {
          path: relative,
          bytes: bytes.length,
          lines: content.split('\n').length,
          sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
          content,
        });
      }
    } catch (error) {
      incomplete = true;
      const reasonCode = error && error.code === 'ERR_ENCODING_INVALID_ENCODED_DATA'
        ? 'text_file_invalid_utf8'
        : 'text_file_unreadable';
      addFinding(reasonCode, 'inventory', 'not_checked', relative, reasonCode === 'text_file_invalid_utf8' ? 'Text file is not valid UTF-8.' : error.message);
    }
  }

  function walk(directory, depth) {
    if (halted) return;
    if (depth > limits.maxDepth) {
      incomplete = true;
      addFinding('inventory_depth_exceeded', 'inventory', 'not_checked', normalizeRelative(path.relative(root, directory)) || '.', `Inventory depth exceeds ${limits.maxDepth}.`);
      return;
    }
    let entries;
    try {
      entries = fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      incomplete = true;
      addFinding('directory_unreadable', 'inventory', 'not_checked', normalizeRelative(path.relative(root, directory)) || '.', error.message);
      return;
    }
    for (const entry of entries) {
      if (halted) return;
      const absolute = path.join(directory, entry.name);
      const relative = normalizeRelative(path.relative(root, absolute));
      if (UNSAFE_PATH_CHARACTERS.test(relative)) {
        addFinding('unsafe_path_characters', 'path-safety', 'error', relative, 'Package path contains control or bidirectional override characters.');
        continue;
      }
      let stat;
      try {
        stat = fs.lstatSync(absolute);
      } catch (error) {
        incomplete = true;
        addFinding('path_unreadable', 'inventory', 'not_checked', relative, error.message);
        continue;
      }
      if (stat.isSymbolicLink()) {
        addFinding('symlink_not_allowed', 'path-safety', 'error', relative, 'Symbolic links are not followed or accepted.');
        continue;
      }
      if (isSecretLikePath(relative)) {
        addFinding(stat.isDirectory() ? 'secret_like_directory_not_read' : 'secret_like_file_not_read', 'privacy', 'warning', null, 'A secret-like path was not read or returned.');
        continue;
      }
      if (stat.isDirectory()) {
        walk(absolute, depth + 1);
      } else if (stat.isFile()) {
        fileCount += 1;
        if (fileCount > limits.maxFiles) {
          incomplete = true;
          halted = true;
          addFinding('inventory_file_budget_exceeded', 'inventory', 'not_checked', relative, `Inventory exceeds ${limits.maxFiles} files.`);
          return;
        }
        inspectFile(absolute, relative, stat);
      } else {
        addFinding('special_file_not_allowed', 'path-safety', 'error', relative, 'FIFO, socket, device, or other special files are not allowed.');
      }
    }
  }

  walk(root, 0);

  for (const entry of markdown.values()) {
    if (referenceHalted) break;
    for (const rawReference of collectMarkdownReferences(entry.content)) {
      if (referenceEdgesChecked >= maxReferenceEdges) {
        incomplete = true;
        referenceHalted = true;
        addFinding('reference_budget_exceeded', 'references', 'not_checked', entry.path, `Reference inventory exceeds ${maxReferenceEdges} edges.`);
        break;
      }
      referenceEdgesChecked += 1;
      const targetAbsolute = path.resolve(path.dirname(path.join(root, entry.path)), rawReference);
      const target = normalizeRelative(path.relative(root, targetAbsolute));
      if (!isInside(targetAbsolute, root)) {
        addFinding('reference_escapes_skill_root', 'references', 'error', entry.path, `Reference escapes Skill root: ${rawReference}`);
        continue;
      }
      let targetStat;
      try {
        targetStat = fs.lstatSync(targetAbsolute);
      } catch {
        addFinding('reference_target_missing', 'references', 'error', entry.path, `Reference target does not exist: ${rawReference}`);
        continue;
      }
      if (targetStat.isSymbolicLink() || !targetStat.isFile()) {
        addFinding('reference_target_unsafe', 'references', 'error', entry.path, `Reference target is not a regular file: ${rawReference}`);
        continue;
      }
      if (isSecretLikePath(target)) continue;
      directReferenceEdges.push({ source: entry.path, target });
    }
  }

  return finalize();

  function finalize() {
    const statuses = { error: 0, warning: 1, not_checked: 2 };
    findings.sort((a, b) => statuses[a.status] - statuses[b.status]
      || a.reason_code.localeCompare(b.reason_code)
      || String(a.path || '').localeCompare(String(b.path || '')));
    regularFiles.sort();
    directReferenceEdges.sort((a, b) => a.source.localeCompare(b.source) || a.target.localeCompare(b.target));
    const reachable = new Set();
    const stack = markdown.has('SKILL.md') ? [{ path: 'SKILL.md', depth: 0 }] : [];
    let maxDepth = 0;
    const edgesBySource = new Map();
    for (const edge of directReferenceEdges) {
      if (!edgesBySource.has(edge.source)) edgesBySource.set(edge.source, []);
      edgesBySource.get(edge.source).push(edge.target);
    }
    while (stack.length > 0) {
      const current = stack.pop();
      if (reachable.has(current.path) || !markdown.has(current.path)) continue;
      reachable.add(current.path);
      maxDepth = Math.max(maxDepth, current.depth);
      for (const target of edgesBySource.get(current.path) || []) {
        if (target.endsWith('.md')) stack.push({ path: target, depth: current.depth + 1 });
      }
    }
    const hasErrors = findings.some((entry) => entry.status === 'error');
    const result = hasErrors ? 'fail' : incomplete ? 'incomplete' : 'pass';
    return {
      schema_version: 'spec-write-skill.context-facts/v1',
      skill_root: root ? escapeUntrustedText(root) : escapeUntrustedText(requestedRoot),
      result,
      ok: result === 'pass',
      regular_file_inventory: regularFiles,
      markdown_files: [...markdown.values()].map(({ content, ...entry }) => entry).sort((a, b) => a.path.localeCompare(b.path)),
      direct_reference_edges: directReferenceEdges,
      reachable_markdown: [...reachable].sort(),
      unreferenced_markdown_candidates: [...markdown.keys()].filter((file) => file !== 'SKILL.md' && !reachable.has(file)).sort(),
      reference_depth: maxDepth,
      budget: { limits: { ...limits, maxReferenceEdges }, files_seen: fileCount, text_bytes_read: textBytes, reference_edges_checked: referenceEdgesChecked, exhausted: incomplete },
      findings,
      limitations: [
        'These are source-shape facts only; they do not prove runtime loading, billed tokens, semantic adequacy, or deletion safety.',
        'Unreferenced Markdown entries are candidates for human review, not orphan findings or delete instructions.',
      ],
    };
  }
}

module.exports = {
  INSPECTION_LIMITS,
  TEXT_EXTENSIONS,
  UNSAFE_PATH_CHARACTERS,
  collectMarkdownReferences,
  containsSensitiveContent,
  escapeUntrustedText,
  finding,
  findSymlinkSegment,
  inspectPackage,
  isInside,
  isSecretLikePath,
  normalizeRelative,
  readStableRegularFile,
};
