/** 比例（0~1，保留 4 位小数） */
export function pct(numerator: number, denominator: number): number {
  // 规范定义：分母为 0 视为无需覆盖，指标记为 100%
  if (denominator === 0) return 1;
  return Math.round((numerator / denominator) * 10000) / 10000;
}
