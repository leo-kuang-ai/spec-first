import type { SkillExecutionContext } from './execution-context.js';
import {
  assessHighRiskChanges,
  assessSafety,
  buildSafetyNotice,
  type HighRiskAssessment,
} from './safety-guard.js';

export type { HighRiskAssessment } from './safety-guard.js';

export interface HardGateDecision {
  allowed: boolean;
  severity: 'PASS' | 'WARN';
  reason: string;
  remediation: string;
  highRiskAssessment?: HighRiskAssessment;
}

/** @deprecated 不再用于阻断 skill，仅保留内部兼容 shim。 */
export class HardGateBlockedError extends Error {
  constructor(skillName: string, decision: HardGateDecision) {
    super(`HARD-GATE DEPRECATED for ${skillName}: ${decision.reason}. ${decision.remediation}`);
    this.name = 'HardGateBlockedError';
  }
}

/** @deprecated 改用 assessSafety。 */
export function evaluateSkillHardGate(
  skillName: string,
  projectRootOrContext: string | SkillExecutionContext
): HardGateDecision {
  const executionContext =
    typeof projectRootOrContext === 'string'
      ? { projectRoot: projectRootOrContext }
      : projectRootOrContext;
  const assessment = assessSafety(skillName, executionContext.projectRoot, executionContext.featureId);

  return {
    allowed: true,
    severity: assessment.level === 'safe' ? 'PASS' : 'WARN',
    reason:
      assessment.signals.length > 0
        ? assessment.signals.join('; ')
        : 'hard-gate 已降级为非阻断兼容提示',
    remediation:
      assessment.recommendedActions?.join('；') ?? '改用 safety-guard / skill-checklist / readiness-check',
    highRiskAssessment: assessment.highRiskAssessment,
  };
}

/** @deprecated 改用 buildSafetyNotice。 */
export function buildHardGateRuntimeNotice(
  skillName: string,
  projectRootOrContext: string | SkillExecutionContext
): string | undefined {
  const executionContext =
    typeof projectRootOrContext === 'string'
      ? { projectRoot: projectRootOrContext }
      : projectRootOrContext;
  const assessment = assessSafety(skillName, executionContext.projectRoot, executionContext.featureId);
  const safetyNotice = buildSafetyNotice(assessment, skillName);
  if (!safetyNotice) return undefined;

  return ['<!-- hard-gate-deprecated -->', safetyNotice, '<!-- /hard-gate-deprecated -->'].join('\n');
}

export { assessHighRiskChanges };
