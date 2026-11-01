'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { isExactRepoRelativePath, isSecretDeniedPath } = require('./secret-deny-patterns');

// 冻结:该数组同时作为路径安全校验(validateRepoRelativeField)的 denylist 被多处按引用复用,
// 冻结可防止下游消费者就地修改而悄悄削弱安全校验。
const GENERATED_RUNTIME_PREFIXES = Object.freeze([
  '.claude/',
  '.codex/',
  '.agents/skills/',
  '.cursor/skills/',
  '.cursor/spec-first/',
  '.cursor/rules/spec-first.mdc',
  '.kiro/skills/',
  '.kiro/agents/',
  '.kiro/spec-first/',
  '.kiro/settings/',
  '.kiro/steering/spec-first.md',
  '.qoder/commands/spec-',
  '.qoder/commands/spec/',
  '.qoder/skills/',
  '.qoder/agents/',
  '.qoder/spec-first/',
  '.qoder/hooks/session-start/',
  '.qoder/hooks/prd-prewrite-guard/',
  '.qoder/hooks/prd-readiness-guard/',
  '.qoder/rules/spec-first.md',
  '.opencode/commands/spec-',
  '.opencode/commands/spec/',
  '.opencode/skills/',
  '.opencode/agents/',
  '.opencode/spec-first/',
  '.zcode/spec-first/',
  '.pi/spec-first/',
]);
const GENERATED_RUNTIME_ROOTS = Object.freeze([
  '.claude',
  '.codex',
  '.agents/skills',
  '.cursor/skills',
  '.cursor/spec-first',
  '.cursor/rules/spec-first.mdc',
  '.cursor/mcp.json',
  '.kiro/skills',
  '.kiro/agents',
  '.kiro/spec-first',
  '.kiro/settings',
  '.kiro/steering/spec-first.md',
  '.qoder/commands/spec',
  '.qoder/skills',
  '.qoder/agents',
  '.qoder/spec-first',
  '.qoder/hooks/session-start',
  '.qoder/hooks/prd-prewrite-guard',
  '.qoder/hooks/prd-readiness-guard',
  '.qoder/rules/spec-first.md',
  '.qoder/settings.local.json',
  '.qoder/settings.json',
  '.opencode/commands/spec',
  '.opencode/skills',
  '.opencode/agents',
  '.opencode/spec-first',
  'opencode.json',
  'opencode.jsonc',
  '.zcode/spec-first',
  '.zcode/hooks/session-start',
  '.zcode/config.json',
  '.pi/spec-first',
]);

function resolveTargetRepoRoot(targetRepo) {
  if (typeof targetRepo !== 'string' || targetRepo.trim() === '') {
    return { ok: false, errors: ['target repo is required'] };
  }
  const root = path.resolve(targetRepo);
  try {
    if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
      return { ok: false, errors: ['target repo does not exist or is not a directory'] };
    }
    const env = { ...process.env };
    for (const key of Object.keys(env)) if (key.startsWith('GIT_')) delete env[key];
    env.GIT_OPTIONAL_LOCKS = '0';
    const topLevel = execFileSync('git', ['-c', 'core.fsmonitor=false', '-C', root, 'rev-parse', '--show-toplevel'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      env,
      timeout: 5000,
    }).trim();
    const realRoot = fs.realpathSync(root);
    const realTopLevel = fs.realpathSync(path.resolve(topLevel));
    if (realRoot !== realTopLevel) {
      return { ok: false, errors: ['target repo must be a Git repository root'] };
    }
  } catch (error) {
    return { ok: false, errors: [`target repo must be a Git repository root: ${error.message}`] };
  }
  return { ok: true, root };
}

function validateOutputContainment(targetRepoRoot, absoluteArtifactPath, options = {}) {
  const errors = [];
  const rootPath = path.resolve(targetRepoRoot);
  const candidate = path.resolve(absoluteArtifactPath);
  const within = (root, child) => {
    const relative = path.relative(root, child);
    return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
  };
  if (!within(rootPath, candidate)) return { errors: ['artifact output escapes target repo'] };
  let realRepoRoot;
  try {
    realRepoRoot = fs.realpathSync(rootPath);
  } catch (error) {
    return { errors: [`target repo realpath failed: ${error.message}`] };
  }

  // Existing artifact consumers own leaf/type diagnostics; task ownership opts into the full path.
  const inspectedTarget = options.includeLeaf || candidate === rootPath ? candidate : path.dirname(candidate);
  // Inspect ancestors before descendants so dangling links cannot look absent.
  let current = rootPath;
  for (const segment of path.relative(rootPath, inspectedTarget).split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    try {
      const stat = fs.lstatSync(current);
      if (stat.isSymbolicLink() || !within(realRepoRoot, fs.realpathSync(current))) {
        errors.push(`artifact output ancestor escapes target repo: ${path.relative(rootPath, current) || '.'}`);
        break;
      }
      if (current !== candidate && !stat.isDirectory()) {
        if (options.includeLeaf) errors.push(`artifact output ancestor is not a directory: ${path.relative(rootPath, current)}`);
        break;
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        errors.push(`artifact output ancestor cannot be inspected: ${path.relative(rootPath, current) || '.'}`);
        break;
      }
    }
  }

  return { errors };
}

function validateRepoRelativeField(value, field, errors, options = {}) {
  if ((value === null || value === undefined || value === '') && options.nullable) return;
  if (!isExactRepoRelativePath(value)) {
    errors.push(`${field} must be a concrete repo-relative path`);
    return;
  }
  const normalized = String(value).replace(/\\/g, '/');
  const portable = normalized.toLowerCase();
  if (portable === '.git' || portable.startsWith('.git/')) {
    errors.push(`${field} must not point at Git internals`);
  }
  if (isSecretDeniedPath(normalized)) {
    errors.push(`${field} must not point at secret-denied paths`);
  }
  if (
    GENERATED_RUNTIME_ROOTS.includes(portable)
    || GENERATED_RUNTIME_PREFIXES.some((prefix) => portable.startsWith(prefix))
  ) {
    errors.push(`${field} must not point at generated runtime mirrors`);
  }
  if (normalized.startsWith('.spec-first/') && !(options.allowSpecFirstWorkflows && normalized.startsWith('.spec-first/workflows/'))) {
    errors.push(`${field} uses unsupported .spec-first artifact path`);
  }
}

module.exports = {
  GENERATED_RUNTIME_PREFIXES,
  GENERATED_RUNTIME_ROOTS,
  resolveTargetRepoRoot,
  validateOutputContainment,
  validateRepoRelativeField,
};
