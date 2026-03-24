#!/usr/bin/env node

/**
 * spec-first CLI 入口
 * 解析 process.argv，分发到子命令路由
 */
import { dispatch, registerCommand } from './router.js';
import { handleInit } from './commands/init.js';
import { handleStage } from './commands/stage.js';
import { handleRfc } from './commands/rfc.js';
import { handleDefect } from './commands/defect.js';
import { handleMetrics } from './commands/metrics.js';
import { handleDoctor } from './commands/doctor.js';
import { handleGoLive } from './commands/gate.js';
import { handleAi } from './commands/ai.js';
import { handleCommit } from './commands/commit.js';
import { handleFeature } from './commands/feature.js';
import { handleSetup } from './commands/setup.js';
import { handleHooks } from './commands/hooks.js';
import { handleViewer } from './commands/viewer.js';
import { handleUpdate } from './commands/update.js';
import { handleUninstall } from './commands/uninstall.js';
import { handleAnalyze } from './commands/analyze.js';
import { handleValidate } from './commands/validate.js';
import { handleDone } from './commands/done.js';
import { handleOrchestrate } from './commands/orchestrate.js';
import { handleFirst } from './commands/first.js';
import { handleBatchTest } from './commands/batch-test.js';
import { handleOnboarding } from './commands/onboarding.js';
import { handleSkill } from './commands/skill.js';
import { handleStatus } from './commands/status.js';
import { handleTransition } from './commands/transition.js';

registerCommand('init', '初始化 Feature 工作区', handleInit, {
  requiresConfirmation: false,
});
registerCommand('stage', '阶段查看与推进建议（current/suggest）', handleStage, {
  requiresConfirmation: false,
});
registerCommand('transition', '节点流转与取消入口', handleTransition, {
  requiresConfirmation: (args) => args[0] === 'cancel' || args[0] !== undefined,
});
registerCommand('rfc', 'RFC 变更请求与状态管理', handleRfc, {
  requiresConfirmation: true,
});
registerCommand('defect', '缺陷跟踪与状态管理', handleDefect, {
  requiresConfirmation: true,
});
registerCommand('metrics', '覆盖率度量与健康评分', handleMetrics);
registerCommand('doctor', '环境诊断与修复', handleDoctor, {
  requiresConfirmation: (args) => args.includes('--fix'),
});
registerCommand('golive', '上线就绪检查与批准', handleGoLive);
registerCommand('done', '将 Feature 从 07_release 收口到 08_done', handleDone, {
  requiresConfirmation: true,
});
registerCommand(
  'orchestrate',
  '受控编排协调入口（支持 --auto/--resume/--auto-advance）',
  handleOrchestrate,
  {
    requiresConfirmation: true,
  }
);
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
registerCommand('validate', '产物格式校验', handleValidate);
registerCommand('first', '项目首轮认知 runtime/docs 校验', handleFirst, {
  requiresConfirmation: false,
});
registerCommand('onboarding', '新手引导 - 交互式场景识别与学习路径推荐', handleOnboarding);
registerCommand('batch-test', '批量执行测试（临时命令）', handleBatchTest);
registerCommand('skill', '动态渲染 skill 内容', handleSkill);
registerCommand('status', '当前 Feature 状态概览与风险快照', handleStatus);

const code = await dispatch(process.argv.slice(2));
process.exit(code);
