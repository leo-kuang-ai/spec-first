/**
 * required_mcps 声明链路与 doctor 检查
 * @see TASK-ORCH-019 执行前能提示 MCP 可用性与缺失项
 */

// ─── 类型定义 ───────────────────────────────────────────

/** MCP 检查结果 */
export interface McpCheckResult {
  name: string;
  available: boolean;
}

/** 整体检查报告 */
export interface McpCheckReport {
  passed: boolean;
  results: McpCheckResult[];
  missing: string[];
}

// ─── 可用 MCP 注册表（运行时注入） ─────────────────────

const availableMcps = new Set<string>();

/** 注册一个可用的 MCP（由宿主环境在启动时调用） */
export function registerAvailableMcp(name: string): void {
  availableMcps.add(name);
}

/** 批量注册可用 MCP */
export function registerAvailableMcps(names: string[]): void {
  for (const n of names) availableMcps.add(n);
}

/** 清空注册表（测试用） */
export function clearAvailableMcps(): void {
  availableMcps.clear();
}

/** 获取当前已注册的可用 MCP 列表 */
export function getAvailableMcps(): string[] {
  return [...availableMcps];
}

// ─── 检查逻辑 ───────────────────────────────────────────

/**
 * 检查 required_mcps 声明的 MCP 是否全部可用
 * @param requiredMcps Skill front matter 中声明的 required_mcps
 */
export function checkRequiredMcps(requiredMcps: string[]): McpCheckReport {
  const results: McpCheckResult[] = requiredMcps.map(name => ({
    name,
    available: availableMcps.has(name),
  }));

  const missing = results.filter(r => !r.available).map(r => r.name);

  return {
    passed: missing.length === 0,
    results,
    missing,
  };
}

/** 格式化 MCP 检查报告为人类可读文本 */
export function formatMcpReport(report: McpCheckReport): string {
  if (report.passed) {
    return `MCP 检查通过：${report.results.length} 个 MCP 全部可用`;
  }
  const lines = [`MCP 检查失败：缺失 ${report.missing.length} 个`];
  for (const r of report.results) {
    lines.push(`  ${r.available ? '✓' : '✗'} ${r.name}`);
  }
  return lines.join('\n');
}
