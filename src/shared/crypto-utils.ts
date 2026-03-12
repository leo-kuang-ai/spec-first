import { createHash } from 'node:crypto';

/**
 * 计算字符串的 SHA256 十六进制摘要
 */
export function sha256Hex(data: string): string {
  return createHash('sha256').update(data, 'utf-8').digest('hex');
}
