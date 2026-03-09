import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateExecutionPlan } from '../../../src/core/batch-executor/plan-generator.js';
import { executeConcurrent } from '../../../src/core/batch-executor/concurrent-executor.js';
import type { TaskNode } from '../../../src/core/batch-executor/types.js';

describe('concurrent-executor', () => {
  const testRoot = join(process.cwd(), 'tests/fixtures/concurrent-test');
  const featureId = 'TEST-CONCURRENT-001';

  beforeEach(() => {
    const specsDir = join(testRoot, 'specs', featureId);
    mkdirSync(specsDir, { recursive: true });

    const findings = `### [TDD-RED] TASK-A
### [TDD-RED] TASK-B
### [TDD-RED] TASK-C
`;
    writeFileSync(join(specsDir, 'findings.md'), findings, 'utf-8');

    // 创建 config.yaml
    const config = `runtime:
  code:
    max_parallel: 2
`;
    writeFileSync(join(testRoot, 'config.yaml'), config, 'utf-8');
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
    {
      id: 'TASK-C',
      title: 'Task C',
      description: '',
      acceptanceCriteria: [],
      dependsOn: ['TASK-A'],
      status: 'todo',
      relatedFR: [],
      relatedDS: [],
    },
  ];

  it('should execute with concurrency', async () => {
    const plan = generateExecutionPlan(mockTasks, featureId, testRoot);
    const result = await executeConcurrent(plan, testRoot);

    expect(result.successCount).toBe(3);
    expect(result.layers[1].results.length).toBe(2); // TASK-B, TASK-C 并发
    expect(result.layers.length).toBe(2); // Layer 0 + Layer 1
  });
});
