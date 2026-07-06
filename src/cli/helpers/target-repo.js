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
  '.kiro/skills/',
  '.kiro/agents/',
  '.kiro/spec-first/',
  '.kiro/settings/',
  '.qoder/commands/spec-',
  '.qoder/commands/spec/',
  '.qoder/skills/',
  '.qoder/agents/',
  '.qoder/spec-first/',
]);
const GENERATED_RUNTIME_ROOTS = Object.freeze([
  '.claude',
  '.codex',
  '.agents/skills',
  '.cursor/skills',
  '.cursor/spec-first',
  '.cursor/mcp.json',
  '.kiro/skills',
  '.kiro/agents',
  '.kiro/spec-first',
  '.kiro/settings',
  '.qoder/commands/spec',
  '.qoder/skills',
  '.qoder/agents',
  '.qoder/spec-first',
  '.qoder/settings.local.json',
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
    const topLevel = execFileSync('git', ['-C', root, 'rev-parse', '--show-toplevel'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
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

function validateOutputContainment(targetRepoRoot, absoluteArtifactPath) {
  const errors = [];
  const rootPath = path.resolve(targetRepoRoot);
  let realRepoRoot;
  try {
    realRepoRoot = fs.realpathSync(rootPath);
  } catch (error) {
    return { errors: [`target repo realpath failed: ${error.message}`] };
  }

  let current = path.dirname(absoluteArtifactPath);
  while (current && path.resolve(current) !== path.dirname(path.resolve(current))) {
    if (fs.existsSync(current)) {
      let stat;
      let realAncestor;
      try {
        stat = fs.lstatSync(current);
        realAncestor = fs.realpathSync(current);
      } catch (error) {
        errors.push(`artifact output ancestor cannot be inspected: ${path.relative(rootPath, current) || '.'}`);
      }
      if (stat && realAncestor) {
        const isTargetRoot = path.resolve(current) === rootPath;
        const relative = path.relative(realRepoRoot, realAncestor);
        if ((!isTargetRoot && stat.isSymbolicLink()) || relative.startsWith('..') || path.isAbsolute(relative)) {
          errors.push(`artifact output ancestor escapes target repo: ${path.relative(rootPath, current) || '.'}`);
        }
      }
    }
    if (path.resolve(current) === rootPath) break;
    current = path.dirname(current);
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
  if (normalized === '.git' || normalized.startsWith('.git/')) {
    errors.push(`${field} must not point at Git internals`);
  }
  if (isSecretDeniedPath(normalized)) {
    errors.push(`${field} must not point at secret-denied paths`);
  }
  if (
    GENERATED_RUNTIME_ROOTS.includes(normalized)
    || GENERATED_RUNTIME_PREFIXES.some((prefix) => normalized.startsWith(prefix))
  ) {
    errors.push(`${field} must not point at generated runtime mirrors`);
  }
  if (normalized.startsWith('.spec-first/') && !(options.allowSpecFirstWorkflows && normalized.startsWith('.spec-first/workflows/'))) {
    errors.push(`${field} uses unsupported .spec-first artifact path`);
  }
}

module.exports = {
  GENERATED_RUNTIME_PREFIXES,
  resolveTargetRepoRoot,
  validateOutputContainment,
  validateRepoRelativeField,
};
