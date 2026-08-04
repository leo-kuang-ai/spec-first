#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const CONTRACT = 'spec-handoff/v1';
const MAX_INPUT_BYTES = 256 * 1024;
const MAX_FRONTMATTER_BYTES = 16 * 1024;
const MAX_DISCOVERY_LIMIT = 20;

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function slugify(value, fallback = 'handoff') {
  const slug = String(value || '')
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 64);
  return slug || fallback;
}

function isInside(candidate, root) {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function assertNoSymlinkSegments(root, target) {
  const relative = path.relative(root, target);
  if (!isInside(target, root)) throw reasonError('artifact-path-escape', 'Artifact path escapes target root.');
  let current = root;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    try {
      if (fs.lstatSync(current).isSymbolicLink()) {
        throw reasonError('artifact-symlink-segment', `Artifact path traverses a symlink: ${toPosix(path.relative(root, current))}`);
      }
    } catch (error) {
      if (error && error.code === 'ENOENT') continue;
      throw error;
    }
  }
}

function reasonError(reasonCode, message) {
  const error = new Error(message);
  error.reason_code = reasonCode;
  return error;
}

function readJsonNoFollow(filePath) {
  const absolute = path.resolve(filePath);
  const stat = fs.lstatSync(absolute);
  if (!stat.isFile() || stat.isSymbolicLink()) throw reasonError('input-not-regular-file', 'Input must be a regular non-symlink file.');
  if (stat.size > MAX_INPUT_BYTES) throw reasonError('input-too-large', `Input exceeds ${MAX_INPUT_BYTES} bytes.`);
  try {
    return JSON.parse(fs.readFileSync(absolute, 'utf8'));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw reasonError('invalid-payload', 'Input must contain valid JSON.');
    }
    throw error;
  }
}

function validateString(value, field, { required = true, max = 2000 } = {}) {
  if ((!required && (value === undefined || value === null || value === ''))) return null;
  if (typeof value !== 'string' || value.trim() === '' || value.length > max) {
    throw reasonError('invalid-payload', `${field} must be a non-empty string no longer than ${max} characters.`);
  }
  return value;
}

function validateSingleLine(value, field, options = {}) {
  const result = validateString(value, field, options);
  if (result !== null && /[\r\n\u0000]/.test(result)) {
    throw reasonError('invalid-payload', `${field} must be a single-line string.`);
  }
  return result;
}

function validateAbsolutePath(value, field, { required = true } = {}) {
  const result = validateString(value, field, { required, max: 2000 });
  if (result !== null && !path.isAbsolute(result) && !path.win32.isAbsolute(result)) {
    throw reasonError('invalid-payload', `${field} must be an absolute path.`);
  }
  return result;
}

function validateSourceRef(value, field) {
  const result = validateSingleLine(value, field, { max: 1000 });
  const segments = result.replace(/\\/g, '/').split('/');
  if (path.isAbsolute(result)
    || path.win32.isAbsolute(result)
    || /^[A-Za-z][A-Za-z0-9+.-]*:/.test(result)
    || segments.includes('..')) {
    throw reasonError('invalid-payload', `${field} must be a repository-relative path without parent traversal.`);
  }
  return result;
}

function validateStringArray(value, field, { min = 0, maxItems = 30, itemMax = 500 } = {}) {
  if (!Array.isArray(value) || value.length < min || value.length > maxItems) {
    throw reasonError('invalid-payload', `${field} must contain between ${min} and ${maxItems} strings.`);
  }
  return value.map((entry, index) => validateString(entry, `${field}[${index}]`, { max: itemMax }));
}

function validatePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw reasonError('invalid-payload', 'Payload must be an object.');
  const sections = payload.sections;
  if (!Array.isArray(sections) || sections.length === 0 || sections.length > 30) {
    throw reasonError('invalid-payload', 'sections must contain between 1 and 30 entries.');
  }
  return {
    title: validateSingleLine(payload.title, 'title', { max: 160 }),
    summary: validateString(payload.summary, 'summary', { max: 500 }),
    keywords: validateStringArray(payload.keywords, 'keywords', { min: 1, maxItems: 20, itemMax: 80 })
      .map((entry, index) => validateSingleLine(entry, `keywords[${index}]`, { max: 80 })),
    cwd: validateAbsolutePath(payload.cwd, 'cwd'),
    resume_focus: validateString(payload.resume_focus, 'resume_focus', { max: 1000 }),
    repository: validateSingleLine(payload.repository, 'repository', { required: false, max: 300 }),
    branch: validateSingleLine(payload.branch, 'branch', { required: false, max: 500 }),
    head: validateSingleLine(payload.head, 'head', { required: false, max: 100 }),
    worktree_path: validateAbsolutePath(payload.worktree_path, 'worktree_path', { required: false }),
    source_refs: validateStringArray(payload.source_refs, 'source_refs', { min: 1, maxItems: 50, itemMax: 1000 })
      .map((entry, index) => validateSourceRef(entry, `source_refs[${index}]`)),
    freshness: validateStringArray(payload.freshness, 'freshness', { min: 1, maxItems: 30, itemMax: 1000 }),
    limitations: validateStringArray(payload.limitations, 'limitations', { min: 1, maxItems: 30, itemMax: 1000 }),
    sections: sections.map((section, index) => {
      if (!section || typeof section !== 'object' || Array.isArray(section)) throw reasonError('invalid-payload', `sections[${index}] must be an object.`);
      return {
        heading: validateSingleLine(section.heading, `sections[${index}].heading`, { max: 160 }),
        body: validateString(section.body, `sections[${index}].body`, { max: 30000 }),
      };
    }),
  };
}

function yamlLine(key, value) {
  return `${key}: ${JSON.stringify(value)}`;
}

function renderArtifact(payload, createdAt) {
  const metadata = [
    yamlLine('artifact_contract', CONTRACT),
    yamlLine('created_at', createdAt),
    yamlLine('title', payload.title),
    yamlLine('summary', payload.summary),
    yamlLine('keywords', payload.keywords),
    yamlLine('cwd', payload.cwd),
    yamlLine('resume_focus', payload.resume_focus),
  ];
  for (const field of ['repository', 'branch', 'head', 'worktree_path']) {
    if (payload[field]) metadata.push(yamlLine(field, payload[field]));
  }
  metadata.push(yamlLine('source_refs', payload.source_refs));
  metadata.push(yamlLine('freshness', payload.freshness));
  metadata.push(yamlLine('limitations', payload.limitations));
  const body = payload.sections.map((section) => `## ${section.heading}\n\n${section.body.trim()}\n`).join('\n');
  return `---\n${metadata.join('\n')}\n---\n\n# ${payload.title}\n\n${body}`;
}

function resolveTargetRoot(targetRepo) {
  const root = fs.realpathSync(path.resolve(targetRepo));
  const stat = fs.lstatSync(root);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw reasonError('target-root-unsafe', 'Target root must be a real directory.');
  return root;
}

function managedRoot(root, workspaceSlug) {
  const result = path.join(root, '.spec-first', 'workflows', 'spec-handoff', slugify(workspaceSlug || path.basename(root), 'workspace'));
  assertNoSymlinkSegments(root, result);
  fs.mkdirSync(result, { recursive: true, mode: 0o700 });
  assertNoSymlinkSegments(root, result);
  try { fs.chmodSync(result, 0o700); } catch { /* Best effort on non-POSIX hosts. */ }
  return result;
}

function timestampSlug(createdAt) {
  return createdAt.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z').toLowerCase();
}

function writeArtifact({ inputPath, targetRepo, workspaceSlug }) {
  const root = resolveTargetRoot(targetRepo);
  const payload = validatePayload(readJsonNoFollow(inputPath));
  const outputRoot = managedRoot(root, workspaceSlug);
  const createdAt = new Date().toISOString();
  const content = renderArtifact(payload, createdAt);
  const base = `${timestampSlug(createdAt)}-${slugify(payload.title)}`;
  let outputPath = null;
  for (let suffix = 0; suffix < 1000; suffix += 1) {
    const fileName = `${base}${suffix === 0 ? '' : `-${suffix}`}.md`;
    const candidate = path.join(outputRoot, fileName);
    assertNoSymlinkSegments(root, candidate);
    try {
      fs.writeFileSync(candidate, content, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
      outputPath = candidate;
      break;
    } catch (error) {
      if (error && error.code === 'EEXIST') continue;
      throw error;
    }
  }
  if (!outputPath) throw reasonError('artifact-collision-exhausted', 'Unable to reserve an immutable handoff path.');
  return {
    status: 'written',
    reason_code: 'artifact-written',
    artifact_contract: CONTRACT,
    artifact_path: toPosix(path.relative(root, outputPath)),
    sha256: crypto.createHash('sha256').update(content).digest('hex'),
    created_at: createdAt,
    warnings: ['artifact is machine-local unless separately transferred or published'],
  };
}

function parseFrontmatter(filePath) {
  const stat = fs.lstatSync(filePath);
  if (!stat.isFile() || stat.isSymbolicLink()) return null;
  const fd = fs.openSync(filePath, 'r');
  const buffer = Buffer.alloc(Math.min(stat.size, MAX_FRONTMATTER_BYTES));
  try { fs.readSync(fd, buffer, 0, buffer.length, 0); } finally { fs.closeSync(fd); }
  const source = buffer.toString('utf8');
  if (!source.startsWith('---\n')) return null;
  const end = source.indexOf('\n---\n', 4);
  if (end < 0) return null;
  const metadata = {};
  for (const line of source.slice(4, end).split('\n')) {
    const match = line.match(/^([a-z_]+):\s*(.+)$/);
    if (!match) continue;
    try { metadata[match[1]] = JSON.parse(match[2]); } catch { return null; }
  }
  return metadata;
}

function discoverArtifacts({ targetRepo, workspaceSlug, keywords, limit }) {
  const root = resolveTargetRoot(targetRepo);
  const outputRoot = path.join(root, '.spec-first', 'workflows', 'spec-handoff', slugify(workspaceSlug || path.basename(root), 'workspace'));
  assertNoSymlinkSegments(root, outputRoot);
  if (!fs.existsSync(outputRoot)) return { status: 'discovered', reason_code: 'no-managed-root', candidates: [], searched_root: toPosix(path.relative(root, outputRoot)) };
  const terms = String(keywords || '').toLowerCase().split(/\s+/).filter(Boolean);
  const safeLimit = Math.max(1, Math.min(Number(limit) || 5, MAX_DISCOVERY_LIMIT));
  const candidates = [];
  for (const entry of fs.readdirSync(outputRoot, { withFileTypes: true })) {
    if (!entry.isFile() || entry.isSymbolicLink() || !entry.name.endsWith('.md')) continue;
    const filePath = path.join(outputRoot, entry.name);
    assertNoSymlinkSegments(root, filePath);
    const metadata = parseFrontmatter(filePath);
    if (!metadata) continue;
    const haystack = [metadata.title, metadata.summary, ...(Array.isArray(metadata.keywords) ? metadata.keywords : [])].filter(Boolean).join(' ').toLowerCase();
    const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
    if (terms.length > 0 && score === 0) continue;
    candidates.push({
      artifact_path: toPosix(path.relative(root, filePath)),
      title: metadata.title || entry.name,
      summary: metadata.summary || '',
      created_at: metadata.created_at || null,
      resume_focus: metadata.resume_focus || '',
      score,
      mtime_ms: fs.statSync(filePath).mtimeMs,
    });
  }
  candidates.sort((left, right) => right.score - left.score || right.mtime_ms - left.mtime_ms || left.artifact_path.localeCompare(right.artifact_path));
  return {
    status: 'discovered',
    reason_code: candidates.length > 0 ? 'candidates-found' : 'no-candidates',
    candidates: candidates.slice(0, safeLimit).map(({ mtime_ms: _mtime, ...candidate }) => candidate),
    searched_root: toPosix(path.relative(root, outputRoot)),
  };
}

function parseArgs(argv) {
  const command = argv[0];
  const options = { command, inputPath: null, targetRepo: null, workspaceSlug: null, keywords: '', limit: 5, json: false };
  for (let index = 1; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--json') options.json = true;
    else if (arg === '--input') options.inputPath = argv[++index] || null;
    else if (arg === '--target-repo') options.targetRepo = argv[++index] || null;
    else if (arg === '--workspace-slug') options.workspaceSlug = argv[++index] || null;
    else if (arg === '--keywords') options.keywords = argv[++index] || '';
    else if (arg === '--limit') options.limit = argv[++index] || 5;
    else throw reasonError('invalid-arguments', `Unknown or incomplete argument: ${arg}`);
  }
  if (!['write', 'discover'].includes(command) || !options.targetRepo || (command === 'write' && !options.inputPath)) {
    throw reasonError('invalid-arguments', 'Usage: handoff-artifact.cjs <write|discover> --target-repo <root> [--input <payload.json>] [--workspace-slug <slug>] [--keywords <terms>] [--limit <n>] [--json]');
  }
  return options;
}

function run(argv) {
  try {
    const options = parseArgs(argv);
    return options.command === 'write' ? writeArtifact(options) : discoverArtifacts(options);
  } catch (error) {
    return {
      status: 'rejected',
      reason_code: error && error.reason_code ? error.reason_code : 'handoff-artifact-error',
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}

if (require.main === module) {
  const result = run(process.argv.slice(2));
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exitCode = result.status === 'rejected' ? 1 : 0;
}

module.exports = {
  CONTRACT,
  discoverArtifacts,
  parseArgs,
  renderArtifact,
  run,
  slugify,
  validatePayload,
  writeArtifact,
};
