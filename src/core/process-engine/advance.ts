/**
 * @deprecated 使用 transition.ts 作为正式节点推进入口。
 * 此文件仅保留内部过渡包装，不再承担 gate / dependency 主路径语义。
 */
import { join } from 'node:path';
import { Stage, type FeatureState } from '../../shared/types.js';
import { exists, readJson, writeJson, writeMarkdown } from '../../shared/fs-utils.js';
import { isTerminal } from './stage-machine.js';
import { getNextStage } from './next-step-decider.js';
import { applyTransition } from './transition.js';
import { checkReadiness } from './readiness-check.js';
import { readdirSync } from 'node:fs';

export class GateUnavailableError extends Error {
  constructor(message = 'GateEngine 不可用') {
    super(message);
    this.name = 'GateUnavailableError';
  }
}

export class GateFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GateFailedError';
  }
}

export interface AdvanceOptions {
  skipProjectCognitionGovernance?: boolean;
}

export interface AdvanceResult {
  from: Stage;
  to: Stage;
  gateResult: string;
}

function getStatePath(featureId: string, root: string): string {
  return join(root, 'specs', featureId, 'stage-state.json');
}

function loadState(featureId: string, root: string): FeatureState {
  const path = getStatePath(featureId, root);
  if (!exists(path)) throw new Error(`未找到 Feature：${featureId}`);
  return readJson<FeatureState>(path);
}

function saveState(featureId: string, root: string, state: FeatureState): void {
  writeJson(getStatePath(featureId, root), state);
}

function collectArtifacts(featureId: string, root: string): string[] {
  const featureDir = join(root, 'specs', featureId);
  if (!exists(featureDir)) return [];
  return readdirSync(featureDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name);
}

export function advance(
  featureId: string,
  projectRoot: string,
  _options: AdvanceOptions = {}
): AdvanceResult {
  const state = loadState(featureId, projectRoot);
  const from = state.currentStage;

  if (isTerminal(from)) {
    throw new Error(`Feature ${featureId} 已处于终态阶段 ${from}`);
  }

  const to = getNextStage(from);
  if (!to) {
    throw new Error(`阶段 ${from} 之后不存在下一阶段`);
  }

  const readiness = checkReadiness({
    currentStage: from,
    targetStage: to,
    nodes: state.nodes,
    artifacts: collectArtifacts(featureId, projectRoot),
    terminal: state.terminal,
  });
  if (readiness.decision !== 'READY_TO_ADVANCE') {
    throw new Error(
      `节点未就绪，无法推进：decision=${readiness.decision}, previousNodeComplete=${readiness.checks.previousNodeComplete}, requiredArtifactsExist=${readiness.checks.requiredArtifactsExist}`
    );
  }

  const nextState = applyTransition(state, to);
  saveState(featureId, projectRoot, nextState);

  if (nextState.terminal) {
    const currentFile = join(projectRoot, '.spec-first/current');
    if (exists(currentFile)) {
      writeMarkdown(currentFile, '');
    }
  }

  return { from, to, gateResult: 'TRANSITIONED' };
}

export function cancel(featureId: string, projectRoot: string, reason: string): AdvanceResult {
  if (!reason) {
    throw new Error('取消原因不能为空');
  }

  const state = loadState(featureId, projectRoot);
  const from = state.currentStage;

  if (isTerminal(from)) {
    throw new Error(`Feature ${featureId} 已处于终态阶段 ${from}`);
  }

  const nextState = applyTransition(state, Stage.CANCELLED, { reason });
  saveState(featureId, projectRoot, nextState);

  const currentFile = join(projectRoot, '.spec-first/current');
  if (exists(currentFile)) {
    writeMarkdown(currentFile, '');
  }

  return { from, to: Stage.CANCELLED, gateResult: `CANCELLED: ${reason}` };
}
