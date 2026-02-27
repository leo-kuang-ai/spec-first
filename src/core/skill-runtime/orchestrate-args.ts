/**
 * Orchestrate 参数协议与校验
 * 统一 /spec-first:orchestrate --auto/--resume 参数入口
 * @see V2-13§4.5 参数入口协议
 */

// ─── 类型定义 ───────────────────────────────────────────

export type OrchestrateMode = 'single' | 'auto';

export interface OrchestrateArgs {
  mode: OrchestrateMode;
  resume: boolean;
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

const ALLOWED_FLAGS = new Set(['--auto', '--resume']);

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
