import { describe, expect, it } from 'vitest';
import { buildFirstRebootGuide } from '../../src/core/skill-runtime/first-reboot-guide.js';
import type { FirstRuntimeSummary } from '../../src/core/skill-runtime/first-runtime-types.js';

describe('first reboot guide', () => {
  it('builds a stable reboot snapshot from runtime truth', () => {
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

    const guide = buildFirstRebootGuide(summary);

    expect(guide.projectWhat).toContain('Specification-driven development');
    expect(guide.whereToStart.length).toBeGreaterThan(0);
    expect(guide.verifyChecklist.length).toBeGreaterThan(0);
  });
});
