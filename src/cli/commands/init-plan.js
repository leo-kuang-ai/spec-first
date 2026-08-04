
'use strict';

const { getAdapter } = require('../adapters');
const { normalizeInitPlatform } = require('./init-args');
const { canonicalizeExistingPath } = require('./init-paths');
const {
  buildWorkspaceInitPlan,
  discoverChildGitRepos,
} = require('./init-workspace');
const {
  buildInitWritePlan,
  buildProjectInitPlan,
} = require('./init-project-plan');

function buildInitPlan(input = {}) {
  const platform = normalizeInitPlatform(input.platform);
  const adapter = input.adapter || getAdapter(platform);
  const target = input.target && typeof input.target === 'object'
    ? input.target
    : {
      mode: 'single-repo',
      projectRoot: input.projectRoot || process.cwd(),
    };

  if (target.mode === 'all-repos') {
    const workspaceRoot = canonicalizeExistingPath(target.workspaceRoot || input.projectRoot || process.cwd());
    const candidates = Array.isArray(target.candidates) && target.candidates.length > 0
      ? target.candidates
      : discoverChildGitRepos(workspaceRoot);
    return buildWorkspaceInitPlan({
      ...input,
      platform,
      adapter,
      workspaceRoot,
      candidates,
      selectionSource: target.selectionSource || input.selectionSource || 'programmatic-all-repos',
    });
  }

  return buildProjectInitPlan({
    ...input,
    platform,
    adapter,
    projectRoot: target.projectRoot || input.projectRoot || process.cwd(),
    gitRootTopology: input.gitRootTopology || target.gitRootTopology || 'single-repo',
  });
}

module.exports = {
  buildInitPlan,
  buildInitWritePlan,
  buildProjectInitPlan,
};
