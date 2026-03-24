import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { handleStatus } from '../../src/cli/commands/status.js';

const TMP = join(import.meta.dirname, '../fixtures/.tmp-status-node-runtime');
const FEAT = 'FSREQ-20260324-STATUS-001';
const ORIGINAL_CWD = process.cwd;

function capture(fn: () => number): { code: number; output: string } {
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => logs.push(args.map((arg) => String(arg)).join(' '));
  try {
    return { code: fn(), output: logs.join('\n') };
  } finally {
    console.log = originalLog;
  }
}

beforeEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(join(TMP, 'specs', FEAT), { recursive: true });
  mkdirSync(join(TMP, '.spec-first'), { recursive: true });
  process.cwd = () => TMP;
  writeFileSync(join(TMP, '.spec-first', 'current'), `${FEAT}\n`, 'utf-8');
  writeFileSync(
    join(TMP, 'specs', FEAT, 'document-links.yaml'),
    ['version: 1', `featureId: ${FEAT}`, 'documents: []', ''].join('\n'),
    'utf-8'
  );
});

afterEach(() => {
  process.cwd = ORIGINAL_CWD;
  rmSync(TMP, { recursive: true, force: true });
});

describe('status node runtime', () => {
  it('prints blocked recovery guidance from node state and task table', () => {
    writeFileSync(
      join(TMP, 'specs', FEAT, 'stage-state.json'),
      JSON.stringify({
        featureId: FEAT,
        currentStage: '03_plan',
        terminal: false,
        backgroundInputStatus: 'degraded',
        nodes: {
          '03_plan': {
            status: 'blocked',
            summary: '关键任务被外部依赖阻塞',
            checklistStatus: 'partial',
            canMarkDone: false,
          },
        },
        createdAt: '2026-03-24T00:00:00.000Z',
        updatedAt: '2026-03-24T00:00:00.000Z',
      }),
      'utf-8'
    );
    writeFileSync(
      join(TMP, 'specs', FEAT, 'task_plan.md'),
      '| title | status | summary | next_step |\n|---|---|---|---|\n| 外部接口确认 | blocked | 等待外部团队确认 | 确认后恢复 |\n',
      'utf-8'
    );

    const { code, output } = capture(() => handleStatus([]));
    expect(code).toBe(0);
    expect(output).toContain('节点状态: blocked');
    expect(output).toContain('恢复建议:');
    expect(output).toContain('task_plan.md');
  });
});
