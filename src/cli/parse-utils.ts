/**
 * CLI 参数解析工具函数
 */
/**
 * 解析 --flag value 风格的参数
 * @param args - 命令行参数数组
 * @param flag - 要查找的 flag（如 '--feature'）
 * @returns flag 的值，或 undefined（flag 不存在或无值）
 */
export function parseFlag(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  const value = args[idx + 1];
  // 拒绝以 - 开头的值（避免将下一个 flag 误认为是当前 flag 的值）
  if (value.startsWith('-')) return undefined;
  return value;
}

/**
 * 解析多次出现的 --flag value 风格参数
 * @param args - 命令行参数数组
 * @param flag - 要查找的 flag（如 '--tag'）
 * @returns 所有匹配的值数组
 */
export function parseFlagAll(args: string[], flag: string): string[] {
  const values: string[] = [];
  let i = 0;
  while ((i = args.indexOf(flag, i)) !== -1) {
    if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
      values.push(args[i + 1]);
    }
    i += 2;
  }
  return values;
}

/**
 * 检查布尔 flag 是否存在（如 --force, --verbose）
 * @param args - 命令行参数数组
 * @param flag - 要检查的 flag（如 '--force'）
 * @returns flag 是否存在
 */
export function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}
