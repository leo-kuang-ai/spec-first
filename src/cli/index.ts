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

registerCommand('id', 'ID 生成、校验与检索', handleId);
registerCommand('matrix', '追踪矩阵管理', handleMatrix);
registerCommand('init', '初始化新 Feature', handleInit);
registerCommand('stage', '阶段管理（current/advance/cancel）', handleStage);
registerCommand('rfc', 'RFC 变更请求管理', handleRfc);
registerCommand('defect', '缺陷跟踪与管理', handleDefect);
registerCommand('metrics', '覆盖率与质量度量', handleMetrics);
registerCommand('doctor', '项目健康诊断', handleDoctor);
registerCommand('gate', '质量门禁评估', handleGate);
registerCommand('golive', '上线就绪检查', handleGoLive);
registerCommand('ai', 'AI 上下文、恢复与统计', handleAi);
registerCommand('commit', '按规范提交并关联 TASK ID', handleCommit);
registerCommand('feature', 'Feature 列表、当前项与切换', handleFeature);
registerCommand('setup', '注册 Claude Code + Codex Skill 命令', handleSetup);
registerCommand('hooks', 'Git hooks 安装与状态管理', handleHooks);
registerCommand('viewer', '可视化面板启动与地址输出', handleViewer);
registerCommand('update', '升级后刷新 Skill/MCP/Hooks', handleUpdate);
registerCommand('uninstall', '清理 spec-first 宿主配置（卸载前执行）', handleUninstall);
registerCommand('analyze', '跨产物一致性分析并生成报告', handleAnalyze);

const code = await dispatch(process.argv.slice(2));
process.exit(code);
