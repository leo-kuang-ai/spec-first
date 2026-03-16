import { describe, expect, it } from 'vitest';
import { buildFirstChangeMap } from '../../src/core/skill-runtime/first-change-map.js';
import type { FirstRuntimeSummary } from '../../src/core/skill-runtime/first-runtime-types.js';

describe('first change map', () => {
  it('builds at least three high-frequency brownfield change scenarios', () => {
    const summary: FirstRuntimeSummary = {
      generatedAt: '2026-03-16T00:00:00.000Z',
      mode: 'quick',
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

    const changeMap = buildFirstChangeMap(summary);

    expect(changeMap.length).toBeGreaterThanOrEqual(3);
    expect(changeMap.every((item) => item.riskPoints.length > 0)).toBe(true);
    expect(changeMap.some((item) => item.changeType === 'runtime-asset-extension')).toBe(true);
  });
});
