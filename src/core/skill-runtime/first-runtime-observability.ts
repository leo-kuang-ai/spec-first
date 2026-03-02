/**
 * First Runtime 错误与观测工具
 * 统一降级路径的日志格式，避免各模块各写一套。
 */

type FirstRuntimeLogLevel = 'warn' | 'error';

function stringifyUnknown(value: unknown): string {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return stringifyUnknown(error);
}

function emit(level: FirstRuntimeLogLevel, scope: string, message: string, error?: unknown): void {
  const payload = error ? `${message} | error=${toErrorMessage(error)}` : message;
  const text = `[first-runtime][${scope}] ${payload}`;
  if (level === 'error') {
    console.error(text);
    return;
  }
  console.warn(text);
}

export function logFirstRuntimeWarning(scope: string, message: string, error?: unknown): void {
  emit('warn', scope, message, error);
}

export function logFirstRuntimeError(scope: string, message: string, error?: unknown): void {
  emit('error', scope, message, error);
}
