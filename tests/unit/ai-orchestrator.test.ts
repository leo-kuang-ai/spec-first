/**
 * M5 AIOrchestrator 单元测试
 * Context Pack + Slicing + Catchup + AI Stats + AI CLI
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildContextPack, validateControlSize } from '../../src/core/ai-orchestrator/context-pack.js';
import { sliceContext, getStrategy } from '../../src/core/ai-orchestrator/context-slicing.js';
import { catchup, resetLocks } from '../../src/core/ai-orchestrator/catchup.js';
import { recordStat, readStats, summarizeStats } from '../../src/core/ai-orchestrator/ai-stats.js';
import { handleAi } from '../../src/cli/commands/ai.js';
import { ExitCode } from '../../src/shared/types.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-ai-orchestrator');
const FEAT = 'FSREQ-20260211-AUTH-001';

function withCwd(dir: string, fn: () => number): number {
  const orig = process.cwd;
  process.cwd = () => dir;
  try { return fn(); } finally { process.cwd = orig; }
}

function writeState(stage: string) {
  writeFileSync(join(TMP, 'specs', FEAT, 'stage-state.json'), JSON.stringify({
    featureId: FEAT, mode: 'N', size: 'M', platforms: ['h5'],
    currentStage: stage, history: [], terminal: false,
    title: 'Auth Module', createdAt: '2026-02-11T00:00:00Z',
  }));
}

beforeEach(() => {
  mkdirSync(join(TMP, 'specs', FEAT), { recursive: true });
  resetLocks();
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

// ─── Context Pack Tests ──────────────────────────────────

describe('buildContextPack', () => {
  it('should build pack with control zone', () => {
    writeState('04_implement');
    const pack = buildContextPack(FEAT, TMP);
    expect(pack.version).toBe('2.0');
    expect(pack.control.feature_meta.id).toBe(FEAT);
    expect(pack.control.current_phase).toBe('04_implement');
  });

  it('should include references for existing files', () => {
    writeState('04_implement');
    writeFileSync(join(TMP, 'specs', FEAT, 'constitution.md'), '# Constitution');
    const pack = buildContextPack(FEAT, TMP);
    expect(pack.references.length).toBeGreaterThan(0);
    expect(pack.references[0].checksum).toBeDefined();
    expect(pack.references[0].selector).toBe('summary');
  });

  it('should include detail refs only when expanded', () => {
    writeState('04_implement');
    writeFileSync(join(TMP, 'specs', FEAT, 'spec.md'), '# Spec\n## FR\n- A\n', 'utf-8');

    const summaryOnly = buildContextPack(FEAT, TMP);
    expect(summaryOnly.references.some((ref) => ref.selector === 'detail')).toBe(false);

    const expanded = buildContextPack(FEAT, TMP, { expandPaths: ['spec.md'] });
    expect(expanded.references.some((ref) => ref.path === 'spec.md' && ref.selector === 'detail')).toBe(true);
  });

  it('should validate control size under 2KB', () => {
    writeState('00_init');
    const pack = buildContextPack(FEAT, TMP);
    expect(validateControlSize(pack)).toBe(true);
  });
});

// ─── Context Slicing Tests ───────────────────────────────

describe('sliceContext', () => {
  it('should return all refs when under budget', () => {
    const refs = [{ path: 'a.md', reason: 'test', checksum: 'abc', mtime: '2026-01-01' }];
    const result = sliceContext(refs);
    expect(result.degradationLevel).toBe(0);
    expect(result.refs).toHaveLength(1);
  });

  it('should degrade when over budget', () => {
    const refs = Array.from({ length: 200 }, (_, i) => ({
      path: `file-${i}.md`, reason: 'test', checksum: 'abc', mtime: '2026-01-01',
    }));
    const result = sliceContext(refs, { budgetTokens: 1000, l1Ratio: 0.2, l2Ratio: 0.3, l3Ratio: 0.5 });
    expect(result.degradationLevel).toBeGreaterThan(0);
    expect(result.warning).toContain('CONTEXT_BUDGET_EXCEEDED');
    expect(result.tokensBefore).toBeGreaterThan(result.tokensAfter);
  });

  it('should preserve summary refs before detail refs when over budget', () => {
    const refs = [
      {
        path: 'spec.md',
        selector: 'summary',
        reason: 'stage_context_summary',
        checksum: 'sum-1',
        mtime: '2026-01-01',
        granularity: 'summary' as const,
        estimatedTokens: 100,
      },
      {
        path: 'spec.md',
        selector: 'detail',
        reason: 'stage_context_detail',
        checksum: 'det-1',
        mtime: '2026-01-01',
        granularity: 'detail' as const,
        estimatedTokens: 1200,
      },
    ];
    const result = sliceContext(refs, { budgetTokens: 200, l1Ratio: 0.2, l2Ratio: 0.3, l3Ratio: 0.5 });
    expect(result.refs.some((ref) => ref.selector === 'summary')).toBe(true);
    expect(result.refs.some((ref) => ref.selector === 'detail')).toBe(false);
  });
});

describe('getStrategy', () => {
  it('should return inline-first for S', () => {
    expect(getStrategy('S')).toBe('inline-first');
  });
  it('should return hybrid for M', () => {
    expect(getStrategy('M')).toBe('hybrid');
  });
  it('should return references-first for L', () => {
    expect(getStrategy('L')).toBe('references-first');
  });
});

// ─── Catchup Tests ───────────────────────────────────────

describe('catchup', () => {
  it('should report missing files when feature is empty', () => {
    writeState('04_implement');
    const result = catchup(FEAT, TMP);
    expect(result.currentPhase).toBe('04_implement');
    expect(result.missingFiles.length).toBeGreaterThan(0);
  });

  it('should detect current task from task_plan.md', () => {
    writeState('04_implement');
    writeFileSync(join(TMP, 'specs', FEAT, 'task_plan.md'),
      '| title | status | summary | next_step |\n|---|---|---|---|\n| Login | in_progress | 正在收口登录接口 | 完成接口实现 |\n');
    writeFileSync(join(TMP, 'specs', FEAT, 'constitution.md'), '# Constitution');
    writeFileSync(join(TMP, 'specs', FEAT, 'document-links.yaml'), 'version: 1\nfeatureId: FSREQ-20260211-AUTH-001\ndocuments: []\n');
    const result = catchup(FEAT, TMP);
    expect(result.currentTask).toBe('Login');
  });

  it('should include task context summary for current task', () => {
    writeState('04_implement');
    writeFileSync(
      join(TMP, 'specs', FEAT, 'task_plan.md'),
      '| title | status | summary | next_step |\n|---|---|---|---|\n| Login API spec.md design.md | in_progress | 收口接口实现 | 回补验证 |\n',
      'utf-8',
    );
    writeFileSync(
      join(TMP, 'specs', FEAT, 'document-links.yaml'),
      `version: 1
featureId: ${FEAT}
documents:
  - path: spec.md
    kind: spec
    stage: 01_specify
    references: []
  - path: design.md
    kind: design
    stage: 02_design
    references: [spec.md]
  - path: task_plan.md
    kind: task-plan
    stage: 03_plan
    references: [spec.md, design.md]
`,
      'utf-8',
    );
    writeFileSync(join(TMP, 'specs', FEAT, 'constitution.md'), '# Constitution');
    writeFileSync(join(TMP, 'specs', FEAT, 'spec.md'), '# Spec');
    writeFileSync(join(TMP, 'specs', FEAT, 'design.md'), '# Design\nspec.md');

    const result = catchup(FEAT, TMP);
    expect(result.taskContextSummary?.taskId).toBe('Login API spec.md design.md');
    expect(result.taskContextSummary?.relatedDocumentCount).toBeGreaterThan(0);
    expect(result.summary).toContain('TaskContextPack: Login API spec.md design.md');
  });

  it('should include todo runner summary when todo-state exists', () => {
    writeState('04_implement');
    writeFileSync(
      join(TMP, 'specs', FEAT, 'todo-state.json'),
      JSON.stringify({
        featureId: FEAT,
        iteration: 1,
        maxIterations: 3,
        halted: false,
        items: [{ id: 'TASK-AUTH-001', title: 'Login', status: 'pending' }],
      }),
      'utf-8',
    );

    const result = catchup(FEAT, TMP);
    expect(result.todoSummary).toContain('Todo续航');
    expect(result.summary).toContain('Todo续航');
  });

  it('should include autoLoopSummary when runtime.autoLoop exists (ORCH-008)', () => {
    writeState('04_implement');
    writeFileSync(
      join(TMP, 'specs', FEAT, 'todo-state.json'),
      JSON.stringify({
        featureId: FEAT,
        iteration: 0,
        maxIterations: 3,
        halted: false,
        items: [],
        updatedAt: '2026-02-28T00:00:00Z',
        runtime: {
          autoLoop: {
            currentTaskId: 'TASK-AUTH-001',
            taskStartedAt: '2026-02-28T00:00:00Z',
            heartbeatAt: '2026-02-28T00:01:00Z',
            watchdogCheckedAt: null,
            retry: {
              regenerateCount: 1,
              autoRetryCount: 0,
              manualRevisionCount: 0,
              totalRetryDurationMs: 2000,
              lastFailureReason: 'timeout',
            },
            lastResult: null,
          },
        },
      }),
      'utf-8',
    );
    const result = catchup(FEAT, TMP);
    expect(result.autoLoopSummary).toBeDefined();
    expect(result.autoLoopSummary!.currentTaskId).toBe('TASK-AUTH-001');
    expect(result.autoLoopSummary!.heartbeatAt).toBe('2026-02-28T00:01:00Z');
    // default budget 900_000 - 2000 used = 898_000
    expect(result.autoLoopSummary!.retryBudgetRemaining).toBe(898_000);
  });

  it('should not include autoLoopSummary when no autoLoop state', () => {
    writeState('04_implement');
    const result = catchup(FEAT, TMP);
    expect(result.autoLoopSummary).toBeUndefined();
  });

  it('should skip if called within 60s (concurrency protection)', () => {
    writeState('00_init');
    catchup(FEAT, TMP);
    const result2 = catchup(FEAT, TMP);
    expect(result2.summary).toContain('跳过');
    expect(result2.skipped).toBe(true);  // I5: verify skipped flag
  });

  it('should set skipped to false for normal calls', () => {
    writeState('00_init');
    const result = catchup(FEAT, TMP);
    expect(result.skipped).toBe(false);  // I5: normal execution is not skipped
  });

  it('should report missing stage-state.json', () => {
    // No writeState call
    const result = catchup(FEAT, TMP);
    expect(result.currentPhase).toBe('unknown');
    expect(result.missingFiles).toContain('stage-state.json');
  });

  it('should build Q4 blocker from final required-file scan result', () => {
    writeState('04_implement');
    // task_plan/findings/constitution/matrix are all missing
    const result = catchup(FEAT, TMP);

    expect(result.fiveQuestions.currentBlocker.gap).toBe(true);
    expect(result.fiveQuestions.currentBlocker.answer).toContain('缺失文件');
    expect(result.fiveQuestions.currentBlocker.answer).toContain('task_plan.md');
  });

  it('should deduplicate missingFiles entries', () => {
    writeState('04_implement');
    const result = catchup(FEAT, TMP);
    const taskPlanMissingCount = result.missingFiles.filter((f) => f === 'task_plan.md').length;
    expect(taskPlanMissingCount).toBe(1);
  });
});

// ─── AI Stats Tests ──────────────────────────────────────

describe('AI Stats', () => {
  it('should record and read stats', () => {
    recordStat(FEAT, TMP, {
      timestamp: '2026-02-11T10:00:00Z', skill: 'code',
      taskId: 'TASK-AUTH-001', tokensIn: 2400, tokensOut: 1800, duration: 45,
    });
    const entries = readStats(FEAT, TMP);
    expect(entries).toHaveLength(1);
    expect(entries[0].skill).toBe('code');
  });

  it('should return empty when no stats file', () => {
    expect(readStats(FEAT, TMP)).toEqual([]);
  });

  it('should skip corrupted stats lines', () => {
    const statsPath = join(TMP, 'specs', FEAT, 'ai-stats.jsonl');
    writeFileSync(
      statsPath,
      '{"timestamp":"2026-02-11T10:00:00Z","skill":"code","tokensIn":10,"tokensOut":20,"duration":1}\n{oops}\n',
      'utf-8',
    );
    const entries = readStats(FEAT, TMP);
    expect(entries).toHaveLength(1);
    expect(entries[0].skill).toBe('code');
  });

  it('should summarize stats by skill', () => {
    const entries = [
      { timestamp: '', skill: 'code', tokensIn: 100, tokensOut: 50, duration: 10 },
      { timestamp: '', skill: 'code', tokensIn: 200, tokensOut: 100, duration: 20 },
      { timestamp: '', skill: 'review', tokensIn: 300, tokensOut: 150, duration: 30 },
    ];
    const summary = summarizeStats(entries);
    expect(summary.totalCalls).toBe(3);
    expect(summary.bySkill['code'].calls).toBe(2);
    expect(summary.bySkill['review'].tokensIn).toBe(300);
  });
});

// ─── AI CLI Tests ────────────────────────────────────────

describe('handleAi', () => {
  it('should return VALIDATION_ERROR without subcommand', () => {
    const code = withCwd(TMP, () => handleAi([]));
    expect(code).toBe(ExitCode.VALIDATION_ERROR);
  });

  it('should return VALIDATION_ERROR for unknown subcommand', () => {
    const code = withCwd(TMP, () => handleAi(['unknown']));
    expect(code).toBe(ExitCode.VALIDATION_ERROR);
  });

  it('should return SUCCESS for ai context', () => {
    writeState('04_implement');
    const code = withCwd(TMP, () => handleAi(['context', FEAT]));
    expect(code).toBe(ExitCode.SUCCESS);
  });

  it('should return SUCCESS for ai context with --expand', () => {
    writeState('04_implement');
    writeFileSync(join(TMP, 'specs', FEAT, 'spec.md'), '# Spec\n', 'utf-8');
    const code = withCwd(TMP, () => handleAi(['context', FEAT, '--expand', 'spec.md']));
    expect(code).toBe(ExitCode.SUCCESS);
  });

  it('should return SUCCESS for ai catchup', () => {
    writeState('04_implement');
    const code = withCwd(TMP, () => handleAi(['catchup', FEAT]));
    expect(code).toBe(ExitCode.SUCCESS);
  });

  it('should return SUCCESS for ai stats (empty)', () => {
    const code = withCwd(TMP, () => handleAi(['stats', FEAT]));
    expect(code).toBe(ExitCode.SUCCESS);
  });
});
