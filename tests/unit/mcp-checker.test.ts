/**
 * required_mcps 声明链路与 doctor 检查测试
 * @see TASK-ORCH-019
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerAvailableMcp,
  registerAvailableMcps,
  clearAvailableMcps,
  getAvailableMcps,
  checkRequiredMcps,
  formatMcpReport,
} from '../../src/core/ai-orchestrator/mcp-checker.js';

beforeEach(() => {
  clearAvailableMcps();
});

describe('registerAvailableMcp', () => {
  it('注册单个 MCP', () => {
    registerAvailableMcp('memory');
    expect(getAvailableMcps()).toEqual(['memory']);
  });

  it('批量注册 MCP', () => {
    registerAvailableMcps(['memory', 'fetch', 'serena']);
    expect(getAvailableMcps()).toHaveLength(3);
  });
});

describe('checkRequiredMcps', () => {
  it('全部可用 → passed', () => {
    registerAvailableMcps(['memory', 'fetch']);
    const report = checkRequiredMcps(['memory', 'fetch']);
    expect(report.passed).toBe(true);
    expect(report.missing).toHaveLength(0);
  });

  it('部分缺失 → 不通过', () => {
    registerAvailableMcp('memory');
    const report = checkRequiredMcps(['memory', 'serena']);
    expect(report.passed).toBe(false);
    expect(report.missing).toEqual(['serena']);
  });

  it('空 required → 通过', () => {
    const report = checkRequiredMcps([]);
    expect(report.passed).toBe(true);
  });

  it('全部缺失', () => {
    const report = checkRequiredMcps(['a', 'b']);
    expect(report.passed).toBe(false);
    expect(report.missing).toEqual(['a', 'b']);
  });
});

describe('formatMcpReport', () => {
  it('通过时显示数量', () => {
    registerAvailableMcps(['memory']);
    const report = checkRequiredMcps(['memory']);
    expect(formatMcpReport(report)).toContain('通过');
  });

  it('失败时显示缺失项', () => {
    const report = checkRequiredMcps(['missing-mcp']);
    const text = formatMcpReport(report);
    expect(text).toContain('失败');
    expect(text).toContain('missing-mcp');
  });
});
