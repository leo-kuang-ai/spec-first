/**
 * Orchestrate Args Parser 单元测试
 * @see TASK-ORCH-001 参数协议与 strict 策略一致性落地
 */
import { describe, it, expect, vi } from 'vitest';
import {
  validateOrchestrateArgs,
  OrchestrateArgsError,
  E_ORCH_ARGS_UNKNOWN,
  E_ORCH_ARGS_RESUME_WITHOUT_AUTO,
} from '../../src/core/skill-runtime/orchestrate-args.js';

describe('validateOrchestrateArgs', () => {
  // ─── 正常路径 ─────────────────────────────────────────

  it('无参数 → mode=single, resume=false', () => {
    const result = validateOrchestrateArgs([]);
    expect(result).toEqual({ mode: 'single', resume: false });
  });

  it('--auto → mode=auto, resume=false', () => {
    const result = validateOrchestrateArgs(['--auto']);
    expect(result).toEqual({ mode: 'auto', resume: false });
  });

  it('--auto --resume → mode=auto, resume=true', () => {
    const result = validateOrchestrateArgs(['--auto', '--resume']);
    expect(result).toEqual({ mode: 'auto', resume: true });
  });

  it('--resume --auto（顺序无关）→ mode=auto, resume=true', () => {
    const result = validateOrchestrateArgs(['--resume', '--auto']);
    expect(result).toEqual({ mode: 'auto', resume: true });
  });

  // ─── 非 flag 参数透传 ────────────────────────────────

  it('非 flag 参数（featureId）被忽略，不报错', () => {
    const result = validateOrchestrateArgs(['FSREQ-001', '--auto']);
    expect(result).toEqual({ mode: 'auto', resume: false });
  });

  it('仅 featureId → mode=single', () => {
    const result = validateOrchestrateArgs(['FSREQ-001']);
    expect(result).toEqual({ mode: 'single', resume: false });
  });

  // ─── 错误路径 ─────────────────────────────────────────

  it('未知 flag → E_ORCH_ARGS_UNKNOWN', () => {
    expect(() => validateOrchestrateArgs(['--unknown']))
      .toThrow(OrchestrateArgsError);

    try {
      validateOrchestrateArgs(['--unknown']);
    } catch (e) {
      expect((e as OrchestrateArgsError).code).toBe(E_ORCH_ARGS_UNKNOWN);
    }
  });

  it('--resume 无 --auto → E_ORCH_ARGS_RESUME_WITHOUT_AUTO', () => {
    expect(() => validateOrchestrateArgs(['--resume']))
      .toThrow(OrchestrateArgsError);

    try {
      validateOrchestrateArgs(['--resume']);
    } catch (e) {
      expect((e as OrchestrateArgsError).code).toBe(E_ORCH_ARGS_RESUME_WITHOUT_AUTO);
    }
  });

  it('--unattended → E_ORCH_ARGS_UNKNOWN（明确不支持）', () => {
    expect(() => validateOrchestrateArgs(['--unattended']))
      .toThrow(OrchestrateArgsError);
  });

  // ─── 重复参数 ─────────────────────────────────────────

  it('重复 --auto 按一次处理，触发 warning', () => {
    const warn = vi.fn();
    const result = validateOrchestrateArgs(['--auto', '--auto'], warn);
    expect(result).toEqual({ mode: 'auto', resume: false });
    expect(warn).toHaveBeenCalledWith('Duplicate flag ignored: --auto');
  });

  it('重复 --resume 按一次处理', () => {
    const warn = vi.fn();
    const result = validateOrchestrateArgs(['--auto', '--resume', '--resume'], warn);
    expect(result).toEqual({ mode: 'auto', resume: true });
    expect(warn).toHaveBeenCalledOnce();
  });

  // ─── 混合场景 ─────────────────────────────────────────

  it('featureId + --auto + --resume 混合', () => {
    const result = validateOrchestrateArgs(['FSREQ-001', '--auto', '--resume']);
    expect(result).toEqual({ mode: 'auto', resume: true });
  });

  it('未知 flag 在合法 flag 之后仍报错', () => {
    expect(() => validateOrchestrateArgs(['--auto', '--verbose']))
      .toThrow(OrchestrateArgsError);
  });
});
