import { describe, expect, it } from 'vitest';
import { buildFirstConventions } from '../../src/core/skill-runtime/first-conventions.js';
import type { FirstRuntimeSummary } from '../../src/core/skill-runtime/first-runtime-types.js';

describe('first conventions', () => {
  it('builds non-empty convention buckets with evidence', () => {
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
      capabilities: ['runtime truth source'],
      entryPoints: ['src/cli/index.ts'],
      dataModels: ['Feature'],
      apiSurface: ['CLI: spec-first'],
      risks: ['legacy docs coupling'],
      evidence: ['package.json', 'vitest.config.ts'],
    };

    const conventions = buildFirstConventions(summary);

    expect(conventions.api.observedPatterns.length).toBeGreaterThan(0);
    expect(conventions.module.evidence.length).toBeGreaterThan(0);
    expect(conventions.testing.recommendedConvention).toContain('Vitest');
    expect(conventions.projectRules.recommendedConvention).toContain('runtime/first');
  });
});
