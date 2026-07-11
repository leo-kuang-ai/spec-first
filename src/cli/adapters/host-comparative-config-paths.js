'use strict';

const {
  extractCandidateRuntimePaths,
  findUnrewrittenRuntimePathReferences,
} = require('./platform-registry');

const HOST_COMPARATIVE_CONFIG_SKILLS = new Set([
  'spec-mcp-setup',
]);

const HOST_COMPARATIVE_CONFIG_PATHS = [
  '$HOME/.kiro/settings/mcp.json',
  '~/.kiro/settings/mcp.json',
  '.kiro/settings/mcp.json',
  '$HOME/.qoder/settings.json',
  '~/.qoder/settings.json',
  '.qoder/settings.local.json',
  '$HOME/.cursor/mcp.json',
  '~/.cursor/mcp.json',
  '.cursor/mcp.json',
].sort((left, right) => right.length - left.length);

const HOST_COMPARATIVE_CONFIG_REPLACEMENTS = HOST_COMPARATIVE_CONFIG_PATHS.map(
  (configPath, index) => ({
    configPath,
    placeholder: `__SPEC_FIRST_HOST_COMPARATIVE_CONFIG_PATH_${index}__`,
  }),
);
const NORMALIZED_HOST_COMPARATIVE_CONFIG_PATHS = new Set(
  extractCandidateRuntimePaths(HOST_COMPARATIVE_CONFIG_PATHS.join('\n')),
);

function rewritePreservingHostComparativeConfigPaths(content, context, rewriteContent) {
  if (!isHostComparativeConfigSkill(context)) {
    return rewriteContent(content);
  }

  const original = String(content || '');
  const replacements = HOST_COMPARATIVE_CONFIG_REPLACEMENTS.filter(({ configPath }) =>
    original.includes(configPath)
  );
  if (replacements.length === 0) {
    return rewriteContent(original);
  }

  let masked = original;
  for (const { configPath, placeholder } of replacements) {
    masked = masked.replaceAll(configPath, placeholder);
  }

  let rewritten = rewriteContent(masked);
  for (const { configPath, placeholder } of replacements) {
    rewritten = rewritten.replaceAll(placeholder, configPath);
  }
  return rewritten;
}

function contentHasUnexpectedRuntimePathReferences(platformId, content, context = {}) {
  const references = findUnrewrittenRuntimePathReferences(platformId, content);
  if (!isHostComparativeConfigSkill(context)) {
    return references.length > 0;
  }

  return references.some((reference) =>
    !NORMALIZED_HOST_COMPARATIVE_CONFIG_PATHS.has(reference)
  );
}

function isHostComparativeConfigSkill(context = {}) {
  return HOST_COMPARATIVE_CONFIG_SKILLS.has(context.skillName);
}

module.exports = {
  contentHasUnexpectedRuntimePathReferences,
  rewritePreservingHostComparativeConfigPaths,
};
