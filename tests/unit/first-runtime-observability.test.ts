import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  logFirstRuntimeError,
  logFirstRuntimeWarning,
  toErrorMessage,
} from '../../src/core/skill-runtime/first-runtime-observability.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('first-runtime-observability', () => {
  it('toErrorMessage 支持 Error/字符串/对象', () => {
    expect(toErrorMessage(new Error('boom'))).toBe('boom');
    expect(toErrorMessage('plain')).toBe('plain');
    expect(toErrorMessage({ code: 500 })).toContain('500');
  });

  it('warning 日志统一前缀', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logFirstRuntimeWarning('scope-a', 'message-a', new Error('warn-boom'));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toContain('[first-runtime][scope-a]');
    expect(spy.mock.calls[0][0]).toContain('warn-boom');
  });

  it('error 日志统一前缀', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logFirstRuntimeError('scope-b', 'message-b', 'error-raw');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toContain('[first-runtime][scope-b]');
    expect(spy.mock.calls[0][0]).toContain('error-raw');
  });
});
