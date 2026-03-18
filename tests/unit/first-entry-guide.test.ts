import { describe, expect, it } from 'vitest';
import { buildFirstEntryGuide } from '../../src/core/skill-runtime/first-entry-guide.js';
import type { FirstRuntimeSummary } from '../../src/core/skill-runtime/first-runtime-types.js';

describe('first entry guide', () => {
  it('builds at least two stable reading paths for common task categories', () => {
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

    const guide = buildFirstEntryGuide(summary);

    expect(guide.length).toBeGreaterThanOrEqual(2);
    expect(guide.every((item) => item.readFirst.length > 0)).toBe(true);
    expect(guide.some((item) => item.taskCategory === 'runtime-extension')).toBe(true);
  });
});
