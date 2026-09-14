'use strict';

// --repair-host-config 修复命令的唯一实现(lane finding DR-015:此前 setup.cjs 的
// plan 预览路与 runtime-executor.cjs 的 mutation 结果路各持一份逐字副本,独立演化
// 会漂移)。两侧 context 形状相同:{ actionPlan: { args, selected_ids, mode } }。
function hostConfigRepairCommand(context) {
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
  return args.join(' ');
}

module.exports = { hostConfigRepairCommand };
