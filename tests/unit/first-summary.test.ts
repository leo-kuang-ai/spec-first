import { describe, expect, it } from 'vitest';
import { buildFirstSummary, type FirstSummarySource } from '../../src/core/skill-runtime/first-summary.js';

describe('first summary builder', () => {
  it('builds a normalized runtime summary from source facts', () => {
    const source: FirstSummarySource = {
      generatedAt: '2026-03-08T12:00:00.000Z',
      mode: 'deep',
      projectName: 'spec-first',
      platformType: 'backend',
      overview: 'Runtime truth-source migration',
      techStack: ['runtime: Node.js ≥20.0.0', 'language: TypeScript 5.4+'],
      modules: ['src/core/skill-runtime', 'src/cli/commands'],
      capabilities: ['runtime truth source', 'docs projection'],
      entryPoints: ['src/cli/commands/init.ts'],
      dataModels: ['Feature', 'StageState'],
      apiSurface: ['spec-first init'],
      risks: ['half-switch state'],
      evidence: ['src/core/skill-runtime/dispatcher.ts:1'],
    };

    const summary = buildFirstSummary(source);

    expect(summary).toEqual({
      generatedAt: '2026-03-08T12:00:00.000Z',
      mode: 'deep',
      project: {
        name: 'spec-first',
        platformType: 'backend',
        overview: 'Runtime truth-source migration',
      },
      techStack: ['runtime: Node.js ≥20.0.0', 'language: TypeScript 5.4+'],
      modules: ['src/core/skill-runtime', 'src/cli/commands'],
      capabilities: ['runtime truth source', 'docs projection'],
      entryPoints: ['src/cli/commands/init.ts'],
      dataModels: ['Feature', 'StageState'],
      apiSurface: ['spec-first init'],
      risks: ['half-switch state'],
      evidence: ['src/core/skill-runtime/dispatcher.ts:1'],
    });
  });

  it('falls back to an empty project name when source name is missing', () => {
    const summary = buildFirstSummary({ mode: 'deep' });

    expect(summary.project.name).toBe('');
    expect(summary.modules).toEqual([]);
    expect(summary.apiSurface).toEqual([]);
  });
});
