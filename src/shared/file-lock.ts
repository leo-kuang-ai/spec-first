import { closeSync, openSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { ensureDir } from './fs-utils.js';

const DEFAULT_TIMEOUT_MS = 2_000;
const DEFAULT_RETRY_MS = 10;

function sleepMs(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

export function withFileLock<T>(
  lockPath: string,
  action: () => T,
  options?: { timeoutMs?: number; retryMs?: number }
): T {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retryMs = options?.retryMs ?? DEFAULT_RETRY_MS;
  ensureDir(dirname(lockPath));
  const startedAt = Date.now();

  while (true) {
    try {
      const fd = openSync(lockPath, 'wx');
      try {
        writeFileSync(lockPath, `${process.pid}\n`, 'utf-8');
        return action();
      } finally {
        closeSync(fd);
        unlinkSync(lockPath);
      }
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== 'EEXIST') throw error;
      if (Date.now() - startedAt >= timeoutMs) {
        throw new Error(`获取文件锁超时：${lockPath}`, { cause: error });
      }
      sleepMs(retryMs);
    }
  }
}
