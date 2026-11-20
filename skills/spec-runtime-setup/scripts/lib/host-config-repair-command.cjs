'use strict';

const { renderCommand } = require('./command-display.cjs');

// --repair-host-config the only implementation of the repair command (lane finding DR-015: previously in setup.cjs the
// plan previews the route and the runtime-executor.cjs mutation results each maintain an independent, character-by-character copy, evolving separately.
// will drift). Both side context shapes are identical: { actionPlan: { args, selected_ids, mode } }.
function hostConfigRepairArgs(context) {
  const args = ['spec-runtime-setup'];
  if (context.actionPlan.args.installationOnly) args.push('--installation-only');
  if (context.actionPlan.selected_ids.length > 0) {
    args.push('--only', context.actionPlan.selected_ids.join(','));
  }
  if (context.actionPlan.mode === 'graphify-refresh' || context.actionPlan.args.refresh) args.push('--refresh');
  if (context.actionPlan.args.repo) args.push('--repo', context.actionPlan.args.repo);
  if (context.actionPlan.args.folder) args.push('--folder', context.actionPlan.args.folder);
  if (context.actionPlan.args.allRepos) args.push('--all-repos');
  if (context.actionPlan.args.userScope) args.push('--user-scope');
  if (context.actionPlan.args.requirementWorkspace) {
    args.push('--requirement-workspace', context.actionPlan.args.requirementWorkspace);
  }
  args.push('--repair-host-config');
  return args;
}

function hostConfigRepairCommand(context, options) {
  return renderCommand(hostConfigRepairArgs(context), options);
}

module.exports = { hostConfigRepairArgs, hostConfigRepairCommand };
