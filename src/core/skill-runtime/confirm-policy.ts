/**
 * confirm_policy Evaluator
 * 基于四维输入自动判定确认策略
 */
import { join } from 'node:path';
import { appendFileSync } from 'node:fs';
import type { Mode, Size } from '../../shared/types.js';

export type ConfirmPolicy = 'auto' | 'assisted' | 'strict';

export interface PolicyInput {
  mode: Mode;
  size: Size;
  hasNfrSec: boolean;
  hasNewExternalApi: boolean;
}

/**
 * 四维判定矩阵:
 * - Mode N → strict
 * - Mode I + Size S + 无 NFR-SEC + 无新外部接口 → auto
 * - Mode I + Size S + 有 NFR-SEC 或新外部接口 → strict
 * - Mode I + Size M/L → assisted
 */
export function evaluatePolicy(input: PolicyInput): ConfirmPolicy {
  if (input.mode === 'N') return 'strict';

  // Mode I
  if (input.size === 'S') {
    if (input.hasNfrSec || input.hasNewExternalApi) return 'strict';
    return 'auto';
  }

  // Size M or L
  return 'assisted';
}

/** auto 执行时写审计记录到 findings.md */
export function writeAutoAudit(
  featureId: string,
  projectRoot: string,
  action: string,
): void {
  const findingsPath = join(projectRoot, 'specs', featureId, 'findings.md');
  const timestamp = new Date().toISOString();
  const entry = `\n- [${timestamp}] AUTO_CONFIRM: ${action}\n`;
  appendFileSync(findingsPath, entry);
}
