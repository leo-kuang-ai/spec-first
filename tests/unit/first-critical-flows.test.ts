import { describe, expect, it } from 'vitest';
import { buildFirstCriticalFlows } from '../../src/core/skill-runtime/first-critical-flows.js';
import type { FirstRuntimeSummary } from '../../src/core/skill-runtime/first-runtime-types.js';

describe('first critical flows', () => {
  it('builds at least two project-level critical flows with hooks', () => {
    const summary: FirstRuntimeSummary = {
      generatedAt: '2026-03-16T00:00:00.000Z',
      mode: 'deep',
      project: {
        name: 'spec-first',
        platformType: 'backend',
        overview: 'Specification-driven development process engine',
      },
      techStack: ['language: TypeScript', 'testing: Vitest'],
      modules: ['src/core/skill-runtime', 'src/cli/commands'],
      capabilities: ['runtime truth source', 'docs projection'],
      entryPoints: ['src/cli/index.ts'],
      dataModels: ['Feature'],
      apiSurface: ['CLI: spec-first'],
      risks: ['legacy docs coupling'],
      evidence: ['package.json', 'vitest.config.ts'],
    };

    const flows = buildFirstCriticalFlows(summary);

    expect(flows.length).toBeGreaterThanOrEqual(2);
    expect(flows.every((flow) => flow.verificationHooks.length > 0)).toBe(true);
    expect(flows.some((flow) => flow.invariants.includes('runtime truth first'))).toBe(true);
  });
});
