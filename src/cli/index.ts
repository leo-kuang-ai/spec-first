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

registerCommand('id', 'ID generation, validation, and search', handleId);
registerCommand('matrix', 'Traceability matrix management', handleMatrix);
registerCommand('init', 'Initialize a new Feature', handleInit);
registerCommand('stage', 'Stage management (current/advance/cancel)', handleStage);
registerCommand('rfc', 'RFC change request management', handleRfc);
registerCommand('defect', 'Defect tracking and management', handleDefect);
registerCommand('metrics', 'Coverage and quality metrics', handleMetrics);
registerCommand('doctor', 'Project health diagnostics', handleDoctor);
registerCommand('gate', 'Quality gate evaluation', handleGate);
registerCommand('golive', 'Go-live readiness check', handleGoLive);
registerCommand('ai', 'AI context, catchup, and statistics', handleAi);
registerCommand('commit', 'Standardized commit with TASK ID', handleCommit);
registerCommand('feature', 'Feature list, current, and switch', handleFeature);

const code = await dispatch(process.argv.slice(2));
process.exit(code);
