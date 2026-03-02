/**
 * First Args Parser 单元测试
 * @see 00-first skill quick/deep 模式参数解析
 */
import { describe, it, expect, vi } from 'vitest';
import {
  validateFirstArgs,
  FirstArgsError,
  E_FIRST_ARGS_UNKNOWN,
  E_FIRST_ARGS_INVALID_TYPE,
  resolveFirstConfirmPolicy,
  resolveFirstModePolicy,
  PRODUCT_NAMES,
  type FirstArgs,
} from '../../src/core/skill-runtime/first-args.js';

describe('validateFirstArgs', () => {
  // ─── 正常路径 ─────────────────────────────────────────

  it('无参数 → mode=quick, auto=false, force=false', () => {
    const result = validateFirstArgs([]);
    expect(result).toEqual({ mode: 'quick', modeExplicit: false, auto: false, force: false, skip: false });
  });

  it('--auto → auto=true', () => {
    const result = validateFirstArgs(['--auto']);
    expect(result).toEqual({ mode: 'quick', modeExplicit: false, auto: true, force: false, skip: false });
  });

  it('--quick → mode=quick', () => {
    const result = validateFirstArgs(['--quick']);
    expect(result).toEqual({ mode: 'quick', modeExplicit: true, auto: false, force: false, skip: false });
  });

  it('--deep → mode=deep', () => {
    const result = validateFirstArgs(['--deep']);
    expect(result).toEqual({ mode: 'deep', modeExplicit: true, auto: false, force: false, skip: false });
  });

  it('--force → force=true', () => {
    const result = validateFirstArgs(['--force']);
    expect(result).toEqual({ mode: 'quick', modeExplicit: false, auto: false, force: true, skip: false });
  });

  it('--skip → skip=true', () => {
    const result = validateFirstArgs(['--skip']);
    expect(result).toEqual({ mode: 'quick', modeExplicit: false, auto: false, force: false, skip: true });
  });

  it('--deep --force → mode=deep, force=true', () => {
    const result = validateFirstArgs(['--deep', '--force']);
    expect(result).toEqual({ mode: 'deep', modeExplicit: true, auto: false, force: true, skip: false });
  });

  it('--force --deep（顺序无关）', () => {
    const result = validateFirstArgs(['--force', '--deep']);
    expect(result).toEqual({ mode: 'deep', modeExplicit: true, auto: false, force: true, skip: false });
  });

  // ─── --type 参数 ───────────────────────────────────────

  it('--type=backend → type=backend', () => {
    const result = validateFirstArgs(['--type=backend']);
    expect(result).toEqual({ mode: 'quick', modeExplicit: false, type: 'backend', auto: false, force: false, skip: false });
  });

  it('--type=frontend → type=frontend', () => {
    const result = validateFirstArgs(['--type=frontend']);
    expect(result).toEqual({ mode: 'quick', modeExplicit: false, type: 'frontend', auto: false, force: false, skip: false });
  });

  it('--type=mobile → type=mobile', () => {
    const result = validateFirstArgs(['--type=mobile']);
    expect(result).toEqual({ mode: 'quick', modeExplicit: false, type: 'mobile', auto: false, force: false, skip: false });
  });

  it('--type=cross-platform → type=cross-platform', () => {
    const result = validateFirstArgs(['--type=cross-platform']);
    expect(result).toEqual({ mode: 'quick', modeExplicit: false, type: 'cross-platform', auto: false, force: false, skip: false });
  });

  it('--type=desktop → type=desktop', () => {
    const result = validateFirstArgs(['--type=desktop']);
    expect(result).toEqual({ mode: 'quick', modeExplicit: false, type: 'desktop', auto: false, force: false, skip: false });
  });

  it('--type=monorepo → type=monorepo', () => {
    const result = validateFirstArgs(['--type=monorepo']);
    expect(result).toEqual({ mode: 'quick', modeExplicit: false, type: 'monorepo', auto: false, force: false, skip: false });
  });

  it('--type=mixed → type=mixed', () => {
    const result = validateFirstArgs(['--type=mixed']);
    expect(result).toEqual({ mode: 'quick', modeExplicit: false, type: 'mixed', auto: false, force: false, skip: false });
  });

  it('--type=backend --deep → type=backend, mode=deep', () => {
    const result = validateFirstArgs(['--type=backend', '--deep']);
    expect(result).toEqual({ mode: 'deep', modeExplicit: true, type: 'backend', auto: false, force: false, skip: false });
  });

  it('--deep --type=frontend --force → 完整参数', () => {
    const result = validateFirstArgs(['--deep', '--type=frontend', '--force']);
    expect(result).toEqual({ mode: 'deep', modeExplicit: true, type: 'frontend', auto: false, force: true, skip: false });
  });

  it('--auto --type=backend → auto=true, type=backend', () => {
    const result = validateFirstArgs(['--auto', '--type=backend']);
    expect(result).toEqual({ mode: 'quick', modeExplicit: false, type: 'backend', auto: true, force: false, skip: false });
  });

  // ─── 错误路径 ─────────────────────────────────────────

  it('未知 flag → E_FIRST_ARGS_UNKNOWN', () => {
    expect(() => validateFirstArgs(['--unknown']))
      .toThrow(FirstArgsError);

    try {
      validateFirstArgs(['--unknown']);
    } catch (e) {
      expect((e as FirstArgsError).code).toBe(E_FIRST_ARGS_UNKNOWN);
    }
  });

  it('--type=invalid → E_FIRST_ARGS_INVALID_TYPE', () => {
    expect(() => validateFirstArgs(['--type=invalid']))
      .toThrow(FirstArgsError);

    try {
      validateFirstArgs(['--type=invalid']);
    } catch (e) {
      expect((e as FirstArgsError).code).toBe(E_FIRST_ARGS_INVALID_TYPE);
    }
  });

  it('--type= → E_FIRST_ARGS_INVALID_TYPE（空值）', () => {
    expect(() => validateFirstArgs(['--type=']))
      .toThrow(FirstArgsError);
  });

  it('无效的 type 值（大写）→ E_FIRST_ARGS_INVALID_TYPE', () => {
    expect(() => validateFirstArgs(['--type=Backend']))
      .toThrow(FirstArgsError);
  });

  it('--verbose → E_FIRST_ARGS_UNKNOWN', () => {
    expect(() => validateFirstArgs(['--verbose']))
      .toThrow(FirstArgsError);
  });

  // ─── 重复参数 ─────────────────────────────────────────

  it('重复 --deep 按一次处理，触发 warning', () => {
    const warn = vi.fn();
    const result = validateFirstArgs(['--deep', '--deep'], warn);
    expect(result).toEqual({ mode: 'deep', modeExplicit: true, auto: false, force: false, skip: false });
    expect(warn).toHaveBeenCalledWith('重复的参数: --deep');
  });

  it('重复 --force 按一次处理', () => {
    const warn = vi.fn();
    const result = validateFirstArgs(['--force', '--force'], warn);
    expect(result).toEqual({ mode: 'quick', modeExplicit: false, auto: false, force: true, skip: false });
    expect(warn).toHaveBeenCalledWith('重复的参数: --force');
  });

  it('重复 --auto 按一次处理', () => {
    const warn = vi.fn();
    const result = validateFirstArgs(['--auto', '--auto'], warn);
    expect(result).toEqual({ mode: 'quick', modeExplicit: false, auto: true, force: false, skip: false });
    expect(warn).toHaveBeenCalledWith('重复的参数: --auto');
  });

  it('重复 --type 按一次处理', () => {
    const warn = vi.fn();
    const result = validateFirstArgs(['--type=backend', '--type=frontend'], warn);
    expect(result).toEqual({ mode: 'quick', modeExplicit: false, type: 'frontend', auto: false, force: false, skip: false });
    expect(warn).toHaveBeenCalledWith('重复的参数: --type=frontend');
  });

  // ─── 混合场景 ─────────────────────────────────────────

  it('所有参数组合：--deep --type=monorepo --force', () => {
    const result = validateFirstArgs(['--deep', '--type=monorepo', '--force']);
    expect(result).toEqual({
      mode: 'deep',
      modeExplicit: true,
      type: 'monorepo',
      auto: false,
      force: true,
      skip: false,
    });
  });

  it('所有参数组合：--auto --type=backend --force', () => {
    const result = validateFirstArgs(['--auto', '--type=backend', '--force']);
    expect(result).toEqual({
      mode: 'quick',
      modeExplicit: false,
      type: 'backend',
      auto: true,
      force: true,
      skip: false,
    });
  });

  it('未知 flag 在合法 flag 之后仍报错', () => {
    expect(() => validateFirstArgs(['--deep', '--verbose']))
      .toThrow(FirstArgsError);
  });

  it('--type 参数后跟未知 flag 仍报错', () => {
    expect(() => validateFirstArgs(['--type=backend', '--unknown']))
      .toThrow(FirstArgsError);
  });
});

describe('resolveFirstConfirmPolicy', () => {
  it('force=true → skip 确认', () => {
    const args: FirstArgs = { mode: 'deep', modeExplicit: true, type: 'backend', auto: false, force: true, skip: false };
    expect(resolveFirstConfirmPolicy(args)).toBe('skip');
  });

  it('force=false → require 确认', () => {
    const args: FirstArgs = { mode: 'quick', modeExplicit: false, auto: false, force: false, skip: false };
    expect(resolveFirstConfirmPolicy(args)).toBe('require');
  });

  it('auto=true → skip 确认（跳过交互）', () => {
    const args: FirstArgs = { mode: 'quick', modeExplicit: false, auto: true, force: false, skip: false };
    expect(resolveFirstConfirmPolicy(args)).toBe('skip');
  });

  it('quick 模式 + auto=false + force=false → require 确认', () => {
    const args: FirstArgs = { mode: 'quick', modeExplicit: false, auto: false, force: false, skip: false };
    expect(resolveFirstConfirmPolicy(args)).toBe('require');
  });

  it('deep 模式 + force=true → skip 确认', () => {
    const args: FirstArgs = { mode: 'deep', modeExplicit: true, type: 'mobile', auto: false, force: true, skip: false };
    expect(resolveFirstConfirmPolicy(args)).toBe('skip');
  });

  it('auto=true + force=true → skip 确认', () => {
    const args: FirstArgs = { mode: 'quick', modeExplicit: false, auto: true, force: true, skip: false };
    expect(resolveFirstConfirmPolicy(args)).toBe('skip');
  });

  it('skip=true → skip 确认', () => {
    const args: FirstArgs = { mode: 'quick', modeExplicit: false, auto: false, force: false, skip: true };
    expect(resolveFirstConfirmPolicy(args)).toBe('skip');
  });
});

describe('resolveFirstModePolicy', () => {
  it('auto=true → auto 模式', () => {
    const args: FirstArgs = { mode: 'quick', modeExplicit: false, auto: true, force: false, skip: false };
    expect(resolveFirstModePolicy(args)).toBe('auto');
  });

  it('auto=false → manual 模式', () => {
    const args: FirstArgs = { mode: 'quick', modeExplicit: false, auto: false, force: false, skip: false };
    expect(resolveFirstModePolicy(args)).toBe('manual');
  });

  it('--deep 标志 → manual 模式', () => {
    const args: FirstArgs = { mode: 'deep', modeExplicit: true, auto: false, force: false, skip: false };
    expect(resolveFirstModePolicy(args)).toBe('manual');
  });

  it('--quick 标志 → manual 模式', () => {
    const args: FirstArgs = { mode: 'quick', modeExplicit: true, auto: false, force: false, skip: false };
    expect(resolveFirstModePolicy(args)).toBe('manual');
  });
});

// ─── Phase 3: 增量更新参数 ─────────────────────────────────────

describe('Phase 3: 增量更新参数', () => {
  describe('--update 参数', () => {
    it('--update=api-docs 单个产物', () => {
      const result = validateFirstArgs(['--update=api-docs']);
      expect(result.update).toEqual(['api-docs']);
    });

    it('--update=api-docs,architecture 多个产物（逗号分隔）', () => {
      const result = validateFirstArgs(['--update=api-docs,architecture']);
      expect(result.update).toEqual(['api-docs', 'architecture']);
    });

    it('--update 支持 .md 后缀', () => {
      const result = validateFirstArgs(['--update=tech-stack.md,domain-model.md']);
      expect(result.update).toEqual(['tech-stack', 'domain-model']);
    });

    it('--update=tech-stack,nonexistent 无效产物名抛错', () => {
      expect(() => validateFirstArgs(['--update=tech-stack,nonexistent']))
        .toThrow(FirstArgsError);
    });

    it('--update 空值返回空数组', () => {
      const result = validateFirstArgs(['--update=']);
      expect(result.update).toEqual([]);
    });

    it('--update 与 --deep 组合', () => {
      const result = validateFirstArgs(['--deep', '--update=api-docs,call-graph']);
      expect(result).toEqual({
        mode: 'deep',
        modeExplicit: true,
        auto: false,
        force: false,
        skip: false,
        update: ['api-docs', 'call-graph'],
      });
    });
  });

  describe('--since 参数', () => {
    it('--since=v1.2.0 版本号', () => {
      const result = validateFirstArgs(['--since=v1.2.0']);
      expect(result.since).toBe('v1.2.0');
    });

    it('--since=abc1234 commit hash', () => {
      const result = validateFirstArgs(['--since=abc1234']);
      expect(result.since).toBe('abc1234');
    });

    it('--since 与 --deep 组合', () => {
      const result = validateFirstArgs(['--deep', '--since=main']);
      expect(result).toEqual({
        mode: 'deep',
        modeExplicit: true,
        auto: false,
        force: false,
        skip: false,
        since: 'main',
      });
    });
  });

  describe('--check-health 参数', () => {
    it('--check-health 设置标志', () => {
      const result = validateFirstArgs(['--check-health']);
      expect(result.checkHealth).toBe(true);
    });

    it('--check-health 与 --update 组合', () => {
      const result = validateFirstArgs(['--check-health', '--update=api-docs']);
      expect(result).toEqual({
        mode: 'quick',
        modeExplicit: false,
        auto: false,
        force: false,
        skip: false,
        checkHealth: true,
        update: ['api-docs'],
      });
    });
  });

  describe('PRODUCT_NAMES 常量', () => {
    it('包含所有 11 个产物名称', () => {
      expect(PRODUCT_NAMES).toEqual([
        'tech-stack',
        'codebase-overview',
        'domain-model',
        'api-docs',
        'database-er',
        'call-graph',
        'architecture',
        'external-deps',
        'local-setup',
        'development-guidelines',
        'README',
      ]);
    });

    it('PRODUCT_NAMES 是 readonly tuple', () => {
      expect(PRODUCT_NAMES.length).toBe(11);
    });
  });

  describe('增量更新参数组合', () => {
    it('--update --since --check-health 完整组合', () => {
      const result = validateFirstArgs([
        '--update=api-docs,architecture',
        '--since=v1.2.0',
        '--check-health',
      ]);
      expect(result).toEqual({
        mode: 'quick',
        modeExplicit: false,
        auto: false,
        force: false,
        skip: false,
        update: ['api-docs', 'architecture'],
        since: 'v1.2.0',
        checkHealth: true,
      });
    });

    it('--deep --update --since 深度增量更新', () => {
      const result = validateFirstArgs([
        '--deep',
        '--update=call-graph',
        '--since=abc1234',
      ]);
      expect(result).toEqual({
        mode: 'deep',
        modeExplicit: true,
        auto: false,
        force: false,
        skip: false,
        update: ['call-graph'],
        since: 'abc1234',
      });
    });
  });
});
