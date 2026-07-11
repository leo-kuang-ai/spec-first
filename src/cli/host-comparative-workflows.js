'use strict';

const HOST_COMPARATIVE_RUNTIME_SKILLS = new Set([
  'spec-code-review',
]);

const CODEX_ALLOWED_OTHER_HOST_PATHS = {
  'spec-code-review': [
    '.claude/spec-first/workflows/spec-mcp-setup/scripts/setup.cjs',
  ],
};

function isHostComparativeRuntimeSkill(skillName) {
  return HOST_COMPARATIVE_RUNTIME_SKILLS.has(skillName);
}

function maskAllowedCodexOtherHostPaths(content, skillName) {
  let masked = content;
  for (const allowedPath of CODEX_ALLOWED_OTHER_HOST_PATHS[skillName] || []) {
    masked = masked.split(allowedPath).join(`[allowed ${skillName} other-host path]`);
  }
  return masked;
}

module.exports = {
  isHostComparativeRuntimeSkill,
  maskAllowedCodexOtherHostPaths,
};
