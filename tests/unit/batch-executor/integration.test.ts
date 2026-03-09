import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateExecutionPlan } from '../../../src/core/batch-executor/plan-generator.js';
import { executeSerial } from '../../../src/core/batch-executor/serial-executor.js';
import { loadCheckpoint } from '../../../src/core/batch-executor/checkpoint.js';
import type { TaskNode } from '../../../src/core/batch-executor/types.js';

describe('batch-executor integration', () => {
  const testRoot = join(process.cwd(), 'tests/fixtures/batch-test');
  const featureId = 'TEST-FEATURE-001';

  beforeEach(() => {
    const specsDir = join(testRoot, 'specs', featureId);
    mkdirSync(specsDir, { recursive: true });

    // 创建 findings.md 包含 TDD 证据
    const findings = `### [TDD-RED] TASK-A
**测试命令**: npm test
**退出码**: 1
**失败原因**: 功能缺失

### [TDD-RED] TASK-B
**测试命令**: npm test
**退出码**: 1
**失败原因**: 功能缺失
`;
    writeFileSync(join(specsDir, 'findings.md'), findings, 'utf-8');
  });

  afterEach(() => {
    if (existsSync(testRoot)) {
      rmSync(testRoot, { recursive: true, force: true });
    }
  });

  const mockTasks: TaskNode[] = [
    {
      id: 'TASK-A',
      title: 'Task A',
      description: '',
      acceptanceCriteria: [],
      dependsOn: [],
      status: 'todo',
      relatedFR: [],
      relatedDS: [],
    },
    {
      id: 'TASK-B',
      title: 'Task B',
      description: '',
      acceptanceCriteria: [],
      dependsOn: ['TASK-A'],
      status: 'todo',
      relatedFR: [],
      relatedDS: [],
    },
  ];

  it('should execute and generate checkpoint', async () => {
    const plan = generateExecutionPlan(mockTasks, featureId, testRoot);
    const result = await executeSerial(plan, testRoot);

    expect(result.successCount).toBe(2);
    expect(result.halted).toBe(false);

    const checkpoint = loadCheckpoint(featureId, testRoot);
    expect(checkpoint).not.toBeNull();
    expect(checkpoint!.completedTasks).toHaveLength(2);
  });

  it('should generate report', async () => {
    const plan = generateExecutionPlan(mockTasks, featureId, testRoot);
    await executeSerial(plan, testRoot);

    const reportPath = join(testRoot, 'specs', featureId, 'batch-report.md');
    expect(existsSync(reportPath)).toBe(true);
  });
});
