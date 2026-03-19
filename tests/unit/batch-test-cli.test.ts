import { afterEach, describe, expect, it, vi } from 'vitest';
import { ExitCode } from '../../src/shared/types.js';

vi.mock('../../src/core/process-engine/feature.js', () => ({
  resolveFeatureId: (featureId: string) => ({ featureId }),
  currentFeature: () => 'FSREQ-TEST-001',
}));

vi.mock('../../src/core/task-plan/parser.js', () => ({
  readTaskPlan: () => null,
  toTaskNodes: () => [],
}));

vi.mock('../../src/core/batch-executor/index.js', () => ({
  generateExecutionPlan: vi.fn(),
  executeConcurrent: vi.fn(),
}));

const { handleBatchTest } = await import('../../src/cli/commands/batch-test.js');

afterEach(() => {
  vi.restoreAllMocks();
});

describe('batch-test command', () => {
  it('should return error and warn that batch executor is experimental', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const code = await handleBatchTest(['FSREQ-TEST-001']);

    expect(code).toBe(ExitCode.GENERAL_ERROR);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('experimental'));
  });
});
