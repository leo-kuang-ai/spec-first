'use strict';

const fs = require('node:fs');
const path = require('node:path');

const SPEC_FIRST_DIR = '.spec-first';
const WORKFLOWS_SUBDIR = 'workflows';
const WINDOWS_RESERVED_BASENAMES = new Set([
  'CON',
  'PRN',
  'AUX',
  'NUL',
  'COM1',
  'COM2',
  'COM3',
  'COM4',
  'COM5',
  'COM6',
  'COM7',
  'COM8',
  'COM9',
  'LPT1',
  'LPT2',
  'LPT3',
  'LPT4',
  'LPT5',
  'LPT6',
  'LPT7',
  'LPT8',
  'LPT9',
]);
const WINDOWS_ILLEGAL_FILENAME_CHARS = /[<>:"|?*\x00-\x1F]/;

/**
 * Returns the absolute path to a workflow-scoped artifact directory.
 *
 * Layout: <repoRoot>/.spec-first/workflows/<workflow>/<slug>/
 *
 * @param {string} repoRoot Absolute path to the repository root.
 * @param {string} workflow Workflow name. Must be non-empty.
 * @param {string} slug Project/context slug. Must be non-empty.
 * @param {{ artifactAnchorRoot?: string }} [options]
 * @returns {string}
 */
function resolveWorkflowArtifactDir(repoRoot, workflow, slug, options = {}) {
  validateArtifactPathSegment('workflow', workflow);
  validateArtifactPathSegment('slug', slug);
  const artifactAnchorRoot = options.artifactAnchorRoot || repoRoot;
  const artifactDir = path.join(artifactAnchorRoot, SPEC_FIRST_DIR, WORKFLOWS_SUBDIR, workflow, slug);
  validateArtifactContainment(artifactAnchorRoot, artifactDir);
  return artifactDir;
}

function validateArtifactPathSegment(name, value) {
  if (!value || typeof value !== 'string') {
    throw new Error(`resolveWorkflowArtifactDir: ${name} must be a non-empty string`);
  }

  if (
    value === '.' ||
    value === '..' ||
    value.includes('/') ||
    value.includes('\\') ||
    path.isAbsolute(value) ||
    path.win32.isAbsolute(value)
  ) {
    throw new Error(`resolveWorkflowArtifactDir: ${name} must be a safe path segment`);
  }

  if (
    WINDOWS_ILLEGAL_FILENAME_CHARS.test(value) ||
    /[ .]$/.test(value) ||
    WINDOWS_RESERVED_BASENAMES.has(value.split('.')[0].toUpperCase())
  ) {
    throw new Error(`resolveWorkflowArtifactDir: ${name} must be Windows-compatible`);
  }
}

function slugifyArtifactPathSegment(value, fallback = 'workspace') {
  const fallbackSlug = String(fallback || 'workspace')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'workspace';
  const slug = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^[.-]+|[ .-]+$/g, '')
    .slice(0, 80) || fallbackSlug;
  return WINDOWS_RESERVED_BASENAMES.has(slug.split('.')[0].toUpperCase())
    ? `${fallbackSlug}-${slug}`
    : slug;
}

function validateArtifactContainment(artifactAnchorRoot, artifactDir) {
  const anchor = path.resolve(artifactAnchorRoot);
  if (!fs.existsSync(anchor)) return;

  const realAnchor = safeRealpath(anchor);
  if (!realAnchor) {
    throw new Error('resolveWorkflowArtifactDir: artifact anchor root cannot be inspected');
  }

  const existingAncestor = findExistingAncestor(path.dirname(artifactDir), anchor);
  const realAncestor = safeRealpath(existingAncestor);
  if (!realAncestor || !isInsidePath(realAnchor, realAncestor)) {
    throw new Error('resolveWorkflowArtifactDir: artifact path must stay inside artifact anchor root');
  }
}

function safeRealpath(value) {
  try {
    return fs.realpathSync.native(value);
  } catch (_error) {
    return '';
  }
}

function findExistingAncestor(candidate, stopAt) {
  let current = path.resolve(candidate);
  const stop = path.resolve(stopAt);
  while (!fs.existsSync(current)) {
    if (current === stop) return stop;
    const parent = path.dirname(current);
    if (parent === current) return stop;
    current = parent;
  }
  return current;
}

function isInsidePath(parentPath, childPath) {
  const relative = path.relative(parentPath, childPath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

module.exports = {
  resolveWorkflowArtifactDir,
  slugifyArtifactPathSegment,
};
