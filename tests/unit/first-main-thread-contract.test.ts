import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const FIRST_REFS = join(import.meta.dirname, '../../skills/spec-first/00-first/references');

const MAIN_THREAD_CONTRACT = join(FIRST_REFS, 'main-thread-contract.md');
const EVIDENCE_PACK_SPEC = join(FIRST_REFS, 'evidence-pack-spec.md');
const AGENT_OUTPUT_SCHEMA = join(FIRST_REFS, 'agent-output-schema.md');

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('00-first main-thread canonical contracts', () => {
  it('keeps the canonical contract files in the references tree', () => {
    expect(existsSync(MAIN_THREAD_CONTRACT)).toBe(true);
    expect(existsSync(EVIDENCE_PACK_SPEC)).toBe(true);
    expect(existsSync(AGENT_OUTPUT_SCHEMA)).toBe(true);
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
    const spec = read(EVIDENCE_PACK_SPEC);
    expect(spec).toContain('Evidence Pack 目录结构');
    expect(spec).toContain('runtime wave 可读范围');
    expect(spec).toContain('docs wave 可读范围');
    expect(spec).toContain('主线程只发包，不发长证据');
  });

  it('documents Serena activation and shared evidence pack handoff in execution flow', () => {
    const flow = read(join(FIRST_REFS, 'execution-flow.md'));
    expect(flow).toContain('### -1. 激活项目（Serena LSP）');
    expect(flow).toContain('serena_status');
    expect(flow).toContain('shared/summary.json');
    expect(flow).toContain('shared/context.json');
  });

  it('defines the agent output schema', () => {
    const schema = read(AGENT_OUTPUT_SCHEMA);
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
