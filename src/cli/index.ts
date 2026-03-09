#!/usr/bin/env node

/**
 * spec-first CLI 入口
 * 解析 process.argv，分发到子命令路由
 */
import { dispatch, registerCommand } from './router.js';
import { handleId } from './commands/id.js';
import { handleMatrix } from './commands/matrix.js';
import { handleInit } from './commands/init.js';
import { handleStage } from './commands/stage.js';
import { handleRfc } from './commands/rfc.js';
import { handleDefect } from './commands/defect.js';
import { handleMetrics } from './commands/metrics.js';
import { handleDoctor } from './commands/doctor.js';
import { handleGate, handleGoLive } from './commands/gate.js';
import { handleAi } from './commands/ai.js';
import { handleCommit } from './commands/commit.js';
import { handleFeature } from './commands/feature.js';
import { handleSetup } from './commands/setup.js';
import { handleHooks } from './commands/hooks.js';
import { handleViewer } from './commands/viewer.js';
import { handleUpdate } from './commands/update.js';
import { handleUninstall } from './commands/uninstall.js';
import { handleAnalyze } from './commands/analyze.js';
import { handleTrace } from './commands/trace.js';
import { handleValidate } from './commands/validate.js';
import { handleDone } from './commands/done.js';
import { handleOrchestrate } from './commands/orchestrate.js';

registerCommand('id', '追溯 ID 生成、校验与检索', handleId);
registerCommand('matrix', '同步追踪矩阵', handleMatrix, {
  requiresConfirmation: (args) => args[0] === 'update',
});
registerCommand('init', '初始化 Feature 工作区', handleInit, {
  requiresConfirmation: true,
});
registerCommand('stage', '阶段流转管理（current/suggest/advance/cancel）', handleStage, {
  requiresConfirmation: (args) => args[0] === 'advance' || args[0] === 'cancel',
});
registerCommand('rfc', 'RFC 变更请求与状态管理', handleRfc, {
  requiresConfirmation: true,
});
registerCommand('defect', '缺陷跟踪与状态管理', handleDefect, {
  requiresConfirmation: true,
});
registerCommand('metrics', '覆盖率度量与健康评分', handleMetrics);
registerCommand('doctor', '环境诊断与修复', handleDoctor);
registerCommand('gate', '阶段质量门禁评估', handleGate);
registerCommand('golive', '上线就绪检查与批准', handleGoLive);
registerCommand('done', '将 Feature 从 07_release 收口到 08_done', handleDone, {
  requiresConfirmation: true,
});
registerCommand('orchestrate', '受控编排协调入口（支持 --auto/--resume/--auto-advance）', handleOrchestrate, {
  requiresConfirmation: true,
});
registerCommand('ai', '会话恢复与上下文摘要', handleAi);
registerCommand('commit', '规范提交并关联追溯 ID', handleCommit, {
  requiresConfirmation: true,
});
registerCommand('feature', 'Feature 列表、切换与查看', handleFeature, {
  requiresConfirmation: (args) => args[0] === 'switch',
});
registerCommand('setup', '注册 Claude Code + Codex Skill 命令', handleSetup, {
  requiresConfirmation: true,
});
registerCommand('hooks', 'Git Hooks 安装与状态管理', handleHooks, {
  requiresConfirmation: (args) => args[0] === 'install' || args[0] === 'uninstall',
});
registerCommand('viewer', 'Stage Viewer 可视化面板', handleViewer);
registerCommand('update', '升级后刷新 Skill/MCP/Hooks', handleUpdate, {
  requiresConfirmation: true,
});
registerCommand('uninstall', '清理宿主配置（卸载前执行）', handleUninstall, {
  requiresConfirmation: true,
});
registerCommand('analyze', '跨产物一致性分析', handleAnalyze);
registerCommand('trace', '追溯链修复与校验', handleTrace, {
  requiresConfirmation: (args) => args[0] === 'repair',
});
registerCommand('validate', '产物格式校验', handleValidate);

const code = await dispatch(process.argv.slice(2));
process.exit(code);
