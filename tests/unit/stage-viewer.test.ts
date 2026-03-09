import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  parseTaskPlan,
  normalizeTaskStatus,
  getDefaultMetrics,
  calcHealthScore,
  type TaskItem,
} from '../../scripts/stage-viewer/task-parser.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-stage-viewer');
const FEAT = 'FSREQ-TEST-001';

beforeEach(() => {
  mkdirSync(join(TMP, 'specs', FEAT), { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

// ─── normalizeTaskStatus 测试 ─────────────────────────────────────

describe('normalizeTaskStatus', () => {
  it('should normalize complete variants', () => {
    expect(normalizeTaskStatus('complete')).toBe('complete');
    expect(normalizeTaskStatus('completed')).toBe('complete');
    expect(normalizeTaskStatus('done')).toBe('complete');
    expect(normalizeTaskStatus('DONE')).toBe('complete');
    expect(normalizeTaskStatus(' Complete ')).toBe('complete');
  });

  it('should normalize in_progress variants', () => {
    expect(normalizeTaskStatus('in_progress')).toBe('in_progress');
    expect(normalizeTaskStatus('in-progress')).toBe('in_progress');
    expect(normalizeTaskStatus('in progress')).toBe('in_progress');
    expect(normalizeTaskStatus('wip')).toBe('in_progress');
    expect(normalizeTaskStatus('WIP')).toBe('in_progress');
    expect(normalizeTaskStatus(' In_Progress ')).toBe('in_progress');
  });

  it('should normalize doing to in_progress', () => {
    expect(normalizeTaskStatus('doing')).toBe('in_progress');
    expect(normalizeTaskStatus('DOING')).toBe('in_progress');
  });

  it('should normalize blocked/skipped/cancelled to pending', () => {
    expect(normalizeTaskStatus('blocked')).toBe('pending');
    expect(normalizeTaskStatus('skipped')).toBe('pending');
    expect(normalizeTaskStatus('cancelled')).toBe('pending');
  });

  it('should default to pending for unknown status', () => {
    expect(normalizeTaskStatus('pending')).toBe('pending');
    expect(normalizeTaskStatus('todo')).toBe('pending');
    expect(normalizeTaskStatus('')).toBe('pending');
    expect(normalizeTaskStatus('unknown')).toBe('pending');
  });
});

// ─── parseTaskPlan 测试 ───────────────────────────────────────────

describe('parseTaskPlan', () => {
  it('should return null when task_plan.md not found', () => {
    const result = parseTaskPlan(TMP, FEAT);
    expect(result).toBeNull();
  });

  it('should parse phases with checkbox tasks', () => {
    const taskPlan = `---
featureId: ${FEAT}
---

# Task Plan

### Phase 1: Requirements
- **Status:** complete
- [x] TASK-TEST-001 First task
- [x] TASK-TEST-002 Second task

### Phase 2: Implementation
- **Status:** in_progress
- [ ] TASK-TEST-003 Third task
`;
    writeFileSync(join(TMP, 'specs', FEAT, 'task_plan.md'), taskPlan, 'utf-8');

    const result = parseTaskPlan(TMP, FEAT);
    expect(result).not.toBeNull();
    expect(result!.phases).toHaveLength(2);

    // Phase 1
    expect(result!.phases[0].id).toBe('Phase 1');
    expect(result!.phases[0].title).toBe('Requirements');
    expect(result!.phases[0].status).toBe('complete');
    expect(result!.phases[0].tasks).toHaveLength(2);
    expect(result!.phases[0].tasks[0].status).toBe('complete');

    // Phase 2
    expect(result!.phases[1].status).toBe('in_progress');
    expect(result!.phases[1].tasks).toHaveLength(1);
    expect(result!.phases[1].tasks[0].status).toBe('pending');
  });

  it('should parse task detail table', () => {
    const taskPlan = `---
featureId: ${FEAT}
---

# Task Plan

| TASK ID | Title | Owner | Effort | Traces | Depends | Acceptance | Status |
|---|---|---|---|---|---|---|---|
| TASK-TEST-001 | Task One | FE | 1d | FR-001 | - | AC1 | complete |
| TASK-TEST-002 | Task Two | BE | 2d | FR-002 | TASK-TEST-001 | AC2 | in_progress |
| TASK-TEST-003 | Task Three | QA | 1d | FR-003 | - | AC3 | pending |
`;
    writeFileSync(join(TMP, 'specs', FEAT, 'task_plan.md'), taskPlan, 'utf-8');

    const result = parseTaskPlan(TMP, FEAT);
    expect(result).not.toBeNull();
    expect(result!.tasks).toHaveLength(3);

    expect(result!.tasks[0].id).toBe('TASK-TEST-001');
    expect(result!.tasks[0].title).toBe('Task One');
    expect(result!.tasks[0].status).toBe('complete');

    expect(result!.tasks[1].status).toBe('in_progress');
    expect(result!.tasks[2].status).toBe('pending');
  });

  it('should calculate stats correctly', () => {
    const taskPlan = `---
featureId: ${FEAT}
---

| TASK ID | Title | Owner | Effort | Traces | Depends | Acceptance | Status |
|---|---|---|---|---|---|---|---|
| TASK-TEST-001 | Task One | FE | 1d | FR-001 | - | AC1 | complete |
| TASK-TEST-002 | Task Two | BE | 2d | FR-002 | - | AC2 | complete |
| TASK-TEST-003 | Task Three | QA | 1d | FR-003 | - | AC3 | in_progress |
| TASK-TEST-004 | Task Four | QA | 1d | FR-004 | - | AC4 | pending |
`;
    writeFileSync(join(TMP, 'specs', FEAT, 'task_plan.md'), taskPlan, 'utf-8');

    const result = parseTaskPlan(TMP, FEAT);
    expect(result!.stats.total).toBe(4);
    expect(result!.stats.completed).toBe(2);
    expect(result!.stats.inProgress).toBe(1);
    expect(result!.stats.pending).toBe(1);
    expect(result!.stats.progress).toBe(50); // 2/4 = 50%
  });

  it('should identify current tasks (in_progress)', () => {
    const taskPlan = `---
featureId: ${FEAT}
---

| TASK ID | Title | Owner | Effort | Traces | Depends | Acceptance | Status |
|---|---|---|---|---|---|---|---|
| TASK-TEST-001 | Task One | FE | 1d | FR-001 | - | AC1 | complete |
| TASK-TEST-002 | Task Two | BE | 2d | FR-002 | - | AC2 | in_progress |
| TASK-TEST-003 | Task Three | QA | 1d | FR-003 | - | AC3 | in_progress |
`;
    writeFileSync(join(TMP, 'specs', FEAT, 'task_plan.md'), taskPlan, 'utf-8');

    const result = parseTaskPlan(TMP, FEAT);
    expect(result!.currentTasks).toHaveLength(2);
    expect(result!.currentTasks.map(t => t.id)).toContain('TASK-TEST-002');
    expect(result!.currentTasks.map(t => t.id)).toContain('TASK-TEST-003');
  });

  it('should handle empty task plan', () => {
    const taskPlan = `---
featureId: ${FEAT}
---

# Task Plan

No tasks defined yet.
`;
    writeFileSync(join(TMP, 'specs', FEAT, 'task_plan.md'), taskPlan, 'utf-8');

    const result = parseTaskPlan(TMP, FEAT);
    expect(result!.tasks).toHaveLength(0);
    expect(result!.phases).toHaveLength(0);
    expect(result!.stats.total).toBe(0);
    expect(result!.stats.progress).toBe(0);
  });

  it('should parse table with 7 columns (missing status)', () => {
    const taskPlan = `---
featureId: ${FEAT}
---

| TASK ID | Title | Owner | Effort | Traces | Depends | Acceptance |
|---|---|---|---|---|---|---|
| TASK-TEST-001 | Task One | FE | 1d | FR-001 | - | AC1 |
`;
    writeFileSync(join(TMP, 'specs', FEAT, 'task_plan.md'), taskPlan, 'utf-8');

    const result = parseTaskPlan(TMP, FEAT);
    expect(result!.tasks).toHaveLength(1);
    expect(result!.tasks[0].status).toBe('pending');
  });
});

// ─── getDefaultMetrics 测试 ───────────────────────────────────────

describe('getDefaultMetrics', () => {
  it('should return default metrics when no matrix file', () => {
    const metrics = getDefaultMetrics(FEAT, TMP);
    expect(metrics.C1).toBe(0);
    expect(metrics.C7).toBe(1); // 默认合规率为 1
  });

  it('should calculate coverage from traceability matrix', () => {
    const matrix = `# Traceability Matrix

| FR ID | DS | TASK | TC |
|---|---|---|---|
| FR-001 | DS-001 | TASK-001 | TC-001 |
| FR-002 | DS-002 | TASK-002, TASK-003 | TC-002 |
| FR-003 | DS-003 | TASK-004 | - |
`;
    writeFileSync(join(TMP, 'specs', FEAT, 'traceability-matrix.md'), matrix, 'utf-8');

    const metrics = getDefaultMetrics(FEAT, TMP);

    // FR: 3, DS: 3, TASK: 4, TC: 2
    expect(metrics.C1).toBe(1); // 3/3 DS/FR
    expect(metrics.C3).toBe(1); // 4/3 TASK/FR = 1.33 -> capped at 1
    expect(metrics.C4).toBeCloseTo(2/3, 2); // 2/3 TC/FR
  });

  it('should detect implementation status for C6', () => {
    const matrix = `# Traceability Matrix

| TASK ID | Status |
|---|---|
| TASK-001 | Implemented |
| TASK-002 | Verified |
| TASK-003 | Pending |
`;
    writeFileSync(join(TMP, 'specs', FEAT, 'traceability-matrix.md'), matrix, 'utf-8');

    const metrics = getDefaultMetrics(FEAT, TMP);
    expect(metrics.C6).toBeCloseTo(2/3, 2); // 2 implemented out of 3 tasks
  });
});

// ─── calcHealthScore 测试 ─────────────────────────────────────────

describe('calcHealthScore', () => {
  it('should calculate H1 with all metrics at 100%', () => {
    const coverage = {
      C1: 1, C2: 1, C3: 1, C4: 1,
      C5: 1, C6: 1, C7: 1, C8: 1, C9: 1,
    };
    const result = calcHealthScore(coverage);
    expect(result.H1).toBe(100);
    expect(result.grade).toBe('A');
  });

  it('should calculate H1 with all metrics at 80%', () => {
    const coverage = {
      C1: 0.8, C2: 0.8, C3: 0.8, C4: 0.8,
      C5: 0.8, C6: 0.8, C7: 0.8, C8: 0.8, C9: 0.8,
    };
    const result = calcHealthScore(coverage);
    expect(result.H1).toBe(80);
    expect(result.grade).toBe('B');
  });

  it('should calculate grade C at 70%', () => {
    const coverage = {
      C1: 0.7, C2: 0.7, C3: 0.7, C4: 0.7,
      C5: 0.7, C6: 0.7, C7: 0.7, C8: 0.7, C9: 0.7,
    };
    const result = calcHealthScore(coverage);
    expect(result.H1).toBe(70);
    expect(result.grade).toBe('C');
  });

  it('should calculate grade D at 60%', () => {
    const coverage = {
      C1: 0.6, C2: 0.6, C3: 0.6, C4: 0.6,
      C5: 0.6, C6: 0.6, C7: 0.6, C8: 0.6, C9: 0.6,
    };
    const result = calcHealthScore(coverage);
    expect(result.H1).toBe(60);
    expect(result.grade).toBe('D');
  });

  it('should calculate grade F below 60%', () => {
    const coverage = {
      C1: 0.5, C2: 0.5, C3: 0.5, C4: 0.5,
      C5: 0.5, C6: 0.5, C7: 0.5, C8: 0.5, C9: 0.5,
    };
    const result = calcHealthScore(coverage);
    expect(result.H1).toBe(50);
    expect(result.grade).toBe('F');
  });

  it('should apply escape rate penalty', () => {
    const coverage = {
      C1: 1, C2: 1, C3: 1, C4: 1,
      C5: 1, C6: 1, C7: 1, C8: 1, C9: 1,
    };
    const result = calcHealthScore(coverage, 0.1); // 10% escape rate
    // penalty = 0.1 * 200 = 20
    expect(result.H1).toBe(80); // 100 - 20 = 80
    expect(result.grade).toBe('B');
  });

  it('should cap penalty at 50', () => {
    const coverage = {
      C1: 1, C2: 1, C3: 1, C4: 1,
      C5: 1, C6: 1, C7: 1, C8: 1, C9: 1,
    };
    const result = calcHealthScore(coverage, 0.5); // 50% escape rate
    // penalty = min(0.5 * 200, 50) = 50
    expect(result.H1).toBe(50); // 100 - 50 = 50
    expect(result.grade).toBe('F');
  });

  it('should handle partial coverage data', () => {
    const coverage = { C1: 1, C4: 1 }; // only 2 metrics
    const result = calcHealthScore(coverage);
    // C1: 1 * 0.12 = 0.12
    // C4: 1 * 0.15 = 0.15
    // others: 0
    // total = 0.27 * 100 = 27
    expect(result.H1).toBe(27);
    expect(result.grade).toBe('F');
  });

  it('should include breakdown', () => {
    const coverage = {
      C1: 1, C2: 1, C3: 1, C4: 1,
      C5: 1, C6: 1, C7: 1, C8: 1, C9: 1,
    };
    const result = calcHealthScore(coverage);
    expect(result.breakdown.C1).toBe(12); // 1 * 0.12 * 100
    expect(result.breakdown.C4).toBe(15); // 1 * 0.15 * 100
    expect(result.breakdown.C6).toBe(13); // 1 * 0.13 * 100
  });
});
