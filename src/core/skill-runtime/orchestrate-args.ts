/**
 * Orchestrate 参数协议与校验
 * 统一 /spec-first:orchestrate --auto/--resume 参数入口
 * @see V2-13§4.5 参数入口协议
 */

import type { BackgroundInputStatus } from '../../shared/types.js';

// ─── 类型定义 ───────────────────────────────────────────

export type OrchestrateMode = 'single' | 'auto';

export interface OrchestrateArgs {
  mode: OrchestrateMode;
  resume: boolean;
  /**
   * 自动推进阶段标志
   *
   * 语义：当决策为 READY_TO_ADVANCE 或 AUTO_ADVANCE 且所有安全条件满足时，
   * 自动调用 advance() 推进到下一阶段
   *
   * 注意：此标志只控制"阶段推进"，不控制"skill 执行"
   * 不会自动执行 /spec-first:code 或 /spec-first:verify
   */
  autoAdvance?: true;
}

// ─── 错误码 ─────────────────────────────────────────────

export const E_ORCH_ARGS_UNKNOWN = 'E_ORCH_ARGS_UNKNOWN';
export const E_ORCH_ARGS_RESUME_WITHOUT_AUTO = 'E_ORCH_ARGS_RESUME_WITHOUT_AUTO';

export class OrchestrateArgsError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'OrchestrateArgsError';
  }
}

// ─── 参数白名单 ─────────────────────────────────────────

const ALLOWED_FLAGS = new Set(['--auto', '--resume', '--auto-advance']);

// ─── 校验函数 ───────────────────────────────────────────

/**
 * 校验并解析 orchestrate 参数
 * 规则：
 * 1. 仅允许 --auto、--resume
 * 2. 未知参数返回 E_ORCH_ARGS_UNKNOWN
 * 3. --resume 仅在 mode=auto 合法，否则返回 E_ORCH_ARGS_RESUME_WITHOUT_AUTO
 * 4. 重复参数按一次处理，记录 warning
 */
export function validateOrchestrateArgs(
  args: string[],
  onWarn?: (msg: string) => void,
): OrchestrateArgs {
  const seen = new Set<string>();
  const flags: string[] = [];

  for (const arg of args) {
    // 跳过非 flag 参数（如 featureId），只校验 -- 开头的
    if (!arg.startsWith('--')) continue;

    // 未知参数检查
    if (!ALLOWED_FLAGS.has(arg)) {
      throw new OrchestrateArgsError(
        E_ORCH_ARGS_UNKNOWN,
        `Unknown orchestrate flag: ${arg}. Allowed: ${[...ALLOWED_FLAGS].join(', ')}`,
      );
    }

    // 重复参数去重 + warning
    if (seen.has(arg)) {
      onWarn?.(`Duplicate flag ignored: ${arg}`);
      continue;
    }

    seen.add(arg);
    flags.push(arg);
  }

  const hasAuto = flags.includes('--auto');
  const hasResume = flags.includes('--resume');
  const hasAutoAdvance = flags.includes('--auto-advance');

  // --resume 必须搭配 --auto
  if (hasResume && !hasAuto) {
    throw new OrchestrateArgsError(
      E_ORCH_ARGS_RESUME_WITHOUT_AUTO,
      '--resume requires --auto mode',
    );
  }

  return {
    mode: hasAuto ? 'auto' : 'single',
    resume: hasResume,
    ...(hasAutoAdvance ? { autoAdvance: true as const } : {}),
  };
}

// ─── Confirm Policy 强制 ────────────────────────────────

/**
 * orchestrate 的 confirm policy 始终为 strict
 * --auto 只控制"是否自动循环调度"，不改变风险策略
 * @see V2-13§4.4
 */
export function resolveOrchestrateConfirmPolicy(_args: OrchestrateArgs): 'strict' {
  return 'strict';
}


export type DependencyStrength = 'L1' | 'L2' | 'L3';

export interface BackgroundInputGuidance {
  backgroundStatus: BackgroundInputStatus;
  dependencyStrength: DependencyStrength;
  warning?: string;
  riskSignals?: string[];
  riskCategory?: 'formal-design-review' | 'high-risk-implementation' | 'pre-release-verification';
  recommendedAction: 'proceed' | 'review-risk' | 'backfill-first';
}

export function buildBackgroundInputGuidance(
  backgroundStatus: BackgroundInputStatus,
  dependencyStrength: DependencyStrength,
  riskSignals: string[] = [],
  riskCategory?: BackgroundInputGuidance['riskCategory'],
): BackgroundInputGuidance {
  const normalizedRiskSignals = [...new Set(riskSignals.filter(signal => signal.trim().length > 0))];
  const riskCategoryHint = riskCategory === 'formal-design-review'
    ? '，且当前属于正式设计评审门槛'
    : riskCategory === 'high-risk-implementation'
      ? '，且当前属于高风险改动门槛'
      : riskCategory === 'pre-release-verification'
        ? '，且当前属于上线前 / 高风险验证门槛'
        : '';
  const riskHint = normalizedRiskSignals.length > 0
    ? `${riskCategory ? '，并' : '，且'}存在高风险信号（${normalizedRiskSignals.join('；')}）`
    : '';

  if (backgroundStatus === 'blind') {
    return {
      backgroundStatus,
      dependencyStrength,
      ...(normalizedRiskSignals.length > 0 ? { riskSignals: normalizedRiskSignals } : {}),
      ...(riskCategory ? { riskCategory } : {}),
      warning: `缺少足够背景输入${riskCategoryHint}${riskHint}，建议先执行 /spec-first:first 补齐 runtime 真源`,
      recommendedAction: 'backfill-first',
    };
  }

  if (backgroundStatus === 'degraded' && dependencyStrength !== 'L1') {
    return {
      backgroundStatus,
      dependencyStrength,
      ...(normalizedRiskSignals.length > 0 ? { riskSignals: normalizedRiskSignals } : {}),
      ...(riskCategory ? { riskCategory } : {}),
      warning: `背景输入不完整${riskCategoryHint}${riskHint}，建议显式评估风险后再继续当前阶段`,
      recommendedAction: 'review-risk',
    };
  }

  return {
    backgroundStatus,
    dependencyStrength,
    ...(normalizedRiskSignals.length > 0 ? { riskSignals: normalizedRiskSignals } : {}),
    ...(riskCategory ? { riskCategory } : {}),
    warning: undefined,
    recommendedAction: 'proceed',
  };
}
