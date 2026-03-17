/**
 * First Args Parser 单元测试
 * @see 00-first skill 单模式参数解析
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
  it('无参数 → 默认 deep', () => {
    const result = validateFirstArgs([]);
    expect(result).toEqual({ mode: 'deep', auto: false, force: false, skip: false });
  });

  it('--auto → auto=true，mode 仍为 deep', () => {
    const result = validateFirstArgs(['--auto']);
    expect(result).toEqual({ mode: 'deep', auto: true, force: false, skip: false });
  });

  it('--force → force=true', () => {
    const result = validateFirstArgs(['--force']);
    expect(result).toEqual({ mode: 'deep', auto: false, force: true, skip: false });
  });

  it('--skip → skip=true', () => {
    const result = validateFirstArgs(['--skip']);
    expect(result).toEqual({ mode: 'deep', auto: false, force: false, skip: true });
  });

  it('--type=backend → type=backend', () => {
    const result = validateFirstArgs(['--type=backend']);
    expect(result).toEqual({
      mode: 'deep',
      type: 'backend',
      auto: false,
      force: false,
      skip: false,
    });
  });

  it('--auto --type=backend --force → 合法组合', () => {
    const result = validateFirstArgs(['--auto', '--type=backend', '--force']);
    expect(result).toEqual({
      mode: 'deep',
      type: 'backend',
      auto: true,
      force: true,
      skip: false,
    });
  });

  it('拒绝旧参数 --quick', () => {
    expect(() => validateFirstArgs(['--quick'])).toThrow(FirstArgsError);
    try {
      validateFirstArgs(['--quick']);
    } catch (e) {
      expect((e as FirstArgsError).code).toBe(E_FIRST_ARGS_UNKNOWN);
    }
  });

  it('拒绝旧参数 --deep', () => {
    expect(() => validateFirstArgs(['--deep'])).toThrow(FirstArgsError);
    try {
      validateFirstArgs(['--deep']);
    } catch (e) {
      expect((e as FirstArgsError).code).toBe(E_FIRST_ARGS_UNKNOWN);
    }
  });

  it('--type=invalid → E_FIRST_ARGS_INVALID_TYPE', () => {
    expect(() => validateFirstArgs(['--type=invalid'])).toThrow(FirstArgsError);
    try {
      validateFirstArgs(['--type=invalid']);
    } catch (e) {
      expect((e as FirstArgsError).code).toBe(E_FIRST_ARGS_INVALID_TYPE);
    }
  });

  it('重复 --force 按一次处理', () => {
    const warn = vi.fn();
    const result = validateFirstArgs(['--force', '--force'], warn);
    expect(result).toEqual({ mode: 'deep', auto: false, force: true, skip: false });
    expect(warn).toHaveBeenCalledWith('重复的参数: --force');
  });

  it('重复 --auto 按一次处理', () => {
    const warn = vi.fn();
    const result = validateFirstArgs(['--auto', '--auto'], warn);
    expect(result).toEqual({ mode: 'deep', auto: true, force: false, skip: false });
    expect(warn).toHaveBeenCalledWith('重复的参数: --auto');
  });

  it('--update 参数支持多个产物', () => {
    const result = validateFirstArgs(['--update=api-docs,architecture']);
    expect(result.update).toEqual(['api-docs', 'architecture']);
  });

  it('--update 支持 .md 后缀', () => {
    const result = validateFirstArgs(['--update=tech-stack.md,domain-model.md']);
    expect(result.update).toEqual(['tech-stack', 'domain-model']);
  });

  it('--since 参数保留', () => {
    const result = validateFirstArgs(['--since=main']);
    expect(result.since).toBe('main');
  });

  it('--check-health 与 --update 组合', () => {
    const result = validateFirstArgs(['--check-health', '--update=api-docs']);
    expect(result).toEqual({
      mode: 'deep',
      auto: false,
      force: false,
      skip: false,
      checkHealth: true,
      update: ['api-docs'],
    });
  });

  it('增量更新参数组合', () => {
    const result = validateFirstArgs([
      '--update=api-docs,architecture',
      '--since=v1.2.0',
      '--check-health',
    ]);
    expect(result).toEqual({
      mode: 'deep',
      auto: false,
      force: false,
      skip: false,
      update: ['api-docs', 'architecture'],
      since: 'v1.2.0',
      checkHealth: true,
    });
  });
});

describe('resolveFirstConfirmPolicy', () => {
  it('默认需要确认', () => {
    const args: FirstArgs = { mode: 'deep', auto: false, force: false, skip: false };
    expect(resolveFirstConfirmPolicy(args)).toBe('require');
  });

  it('auto=true → skip', () => {
    const args: FirstArgs = { mode: 'deep', auto: true, force: false, skip: false };
    expect(resolveFirstConfirmPolicy(args)).toBe('skip');
  });

  it('force=true → skip', () => {
    const args: FirstArgs = { mode: 'deep', auto: false, force: true, skip: false };
    expect(resolveFirstConfirmPolicy(args)).toBe('skip');
  });

  it('skip=true → skip', () => {
    const args: FirstArgs = { mode: 'deep', auto: false, force: false, skip: true };
    expect(resolveFirstConfirmPolicy(args)).toBe('skip');
  });
});

describe('resolveFirstModePolicy', () => {
  it('auto=true → auto', () => {
    const args: FirstArgs = { mode: 'deep', auto: true, force: false, skip: false };
    expect(resolveFirstModePolicy(args)).toBe('auto');
  });

  it('auto=false → manual', () => {
    const args: FirstArgs = { mode: 'deep', auto: false, force: false, skip: false };
    expect(resolveFirstModePolicy(args)).toBe('manual');
  });
});

describe('PRODUCT_NAMES', () => {
  it('保持 11 个产物名称', () => {
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
});
