import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const FIRST_REFS = join(import.meta.dirname, '../../skills/spec-first/00-first/references');

const MAIN_THREAD_CONTRACT = join(FIRST_REFS, 'main-thread-and-evidence-contract.md');
const EXECUTION_AND_ARCH = join(FIRST_REFS, 'execution-and-agent-architecture.md');

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('00-first main-thread canonical contracts', () => {
  it('keeps the canonical contract files in the references tree', () => {
    expect(existsSync(MAIN_THREAD_CONTRACT)).toBe(true);
    expect(existsSync(EXECUTION_AND_ARCH)).toBe(true);
  });

  it('defines the main-thread minimal contract', () => {
    const contract = read(MAIN_THREAD_CONTRACT);
    expect(contract).toContain('当前 Feature');
    expect(contract).toContain('当前波次');
    expect(contract).toContain('资产目标');
    expect(contract).toContain('并发上限');
    expect(contract).toContain('重试规则');
    // Keep the contract aligned with runtime config knobs (no magic numbers).
    expect(contract).toContain('runtime.auto_orchestrate.max_parallel');
    expect(contract).toContain('runtime.auto_orchestrate.max_retry_per_task');
    expect(contract).toContain('验收条件');
    expect(contract).toContain('禁止保留原始证据正文');
  });

  it('defines the evidence pack routing contract', () => {
    const spec = read(MAIN_THREAD_CONTRACT);
    expect(spec).toContain('Evidence Pack 目录结构');
    expect(spec).toContain('runtime wave 可读范围');
    expect(spec).toContain('docs wave 可读范围');
    expect(spec).toContain('主线程只发包,不发长证据');
  });

  it('documents Serena activation and shared evidence pack handoff in execution flow', () => {
    const flow = read(EXECUTION_AND_ARCH);
    expect(flow).toContain('激活项目(Serena LSP)');
    expect(flow).toContain('serena_status');
    expect(flow).toContain('shared/summary.json');
    expect(flow).toContain('shared/context.json');
  });

  it('defines the agent output schema', () => {
    const schema = read(MAIN_THREAD_CONTRACT);
    expect(schema).toContain('status');
    expect(schema).toContain('artifacts');
    expect(schema).toContain('evidence_paths');
    expect(schema).toContain('gaps');
    expect(schema).toContain('next_action');
    expect(schema).toContain('blocked');
    expect(schema).toContain('retryable');
    expect(schema).toContain('[待确认]');
  });
});
