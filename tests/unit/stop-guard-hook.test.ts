import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-stop-guard');
const FEAT = 'FSREQ-20260226-AUTH-001';
const SCRIPT = join(import.meta.dirname, '../../.spec-first/hooks/stop-guard.sh');

function writeTaskPlan(rows: string[], stage = '04_implement'): void {
  const content = [
    '# Task Plan',
    '',
    '| Task ID | 标题 | Owner | 预计工期 | traces | depends_on | 验收标准 | 状态 |',
    '|---|---|---|---|---|---|---|---|',
    ...rows,
    '',
  ].join('\n');

  mkdirSync(join(TMP, 'specs', FEAT), { recursive: true });
  writeFileSync(join(TMP, '.spec-first', 'current'), `${FEAT}\n`, 'utf-8');
  writeFileSync(join(TMP, 'specs', FEAT, 'task_plan.md'), content, 'utf-8');
  writeFileSync(
    join(TMP, 'specs', FEAT, 'stage-state.json'),
    JSON.stringify({ currentStage: stage }),
    'utf-8',
  );
}

beforeEach(() => {
  mkdirSync(join(TMP, '.spec-first'), { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('stop-guard hook', () => {
  it('should exit 0 and print reminder when in_progress tasks exist in 04_implement', () => {
    writeTaskPlan([
      '| TASK-AUTH-001 | 登录页 | FE | 1d | FR-AUTH-001 | - | 完成页面渲染 | complete |',
      '| TASK-AUTH-002 | 登录 API | BE | 1d | FR-AUTH-001 | TASK-AUTH-001 | 返回 token | in_progress |',
    ]);

    const result = spawnSync('sh', [SCRIPT], { cwd: TMP, encoding: 'utf-8' });

    expect(result.status).toBe(0);
    expect(result.stderr).toContain('提示');
    expect(result.stderr).toContain('TASK-AUTH-002');
  });

  it('should exit 0 when all tasks are complete/verified', () => {
    writeTaskPlan([
      '| TASK-AUTH-001 | 登录页 | FE | 1d | FR-AUTH-001 | - | 完成页面渲染 | complete |',
      '| TASK-AUTH-002 | 登录 API | BE | 1d | FR-AUTH-001 | TASK-AUTH-001 | 返回 token | verified |',
    ]);

    const result = spawnSync('sh', [SCRIPT], { cwd: TMP, encoding: 'utf-8' });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
  });

  it('should exit 0 and skip check in 00_init stage', () => {
    writeTaskPlan(
      [
        '| TASK-AUTH-001 | 登录页 | FE | 1d | FR-AUTH-001 | - | 完成页面渲染 | todo |',
        '| TASK-AUTH-002 | 登录 API | BE | 1d | FR-AUTH-001 | TASK-AUTH-001 | 返回 token | todo |',
      ],
      '00_init',
    );

    const result = spawnSync('sh', [SCRIPT], { cwd: TMP, encoding: 'utf-8' });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
  });

  it('should exit 0 when todo tasks exist in 04_implement', () => {
    writeTaskPlan([
      '| TASK-AUTH-001 | 登录页 | FE | 1d | FR-AUTH-001 | - | 完成页面渲染 | todo |',
      '| TASK-AUTH-002 | 登录 API | BE | 1d | FR-AUTH-001 | TASK-AUTH-001 | 返回 token | todo |',
    ]);

    const result = spawnSync('sh', [SCRIPT], { cwd: TMP, encoding: 'utf-8' });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
  });
});
