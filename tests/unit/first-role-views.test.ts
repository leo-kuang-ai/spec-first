import { describe, expect, it } from 'vitest';
import { buildRoleViews } from '../../src/core/skill-runtime/first-role-views.js';
import type { FirstRuntimeSummary } from '../../src/core/skill-runtime/first-runtime-types.js';

const summary: FirstRuntimeSummary = {
  generatedAt: '2026-03-08T12:00:00.000Z',
  mode: 'deep',
  project: {
    name: 'spec-first',
    platformType: 'backend',
    overview: 'Runtime truth-source migration',
  },
  modules: ['src/core/skill-runtime', 'src/cli/commands'],
  capabilities: ['runtime truth source', 'docs projection'],
  entryPoints: ['src/cli/commands/init.ts'],
  dataModels: ['Feature', 'StageState'],
  apiSurface: ['spec-first init'],
  risks: ['half-switch state'],
  evidence: ['src/core/skill-runtime/dispatcher.ts:1'],
};

describe('first role views builder', () => {
  it('builds role-specific views from summary', () => {
    const views = buildRoleViews(summary);

    expect(views.product.role).toBe('product');
    expect(views.product.focus).toEqual(['runtime truth source', 'docs projection']);
    expect(views.dev.role).toBe('dev');
    expect(views.dev.focus).toEqual(['src/core/skill-runtime', 'src/cli/commands']);
    expect(views.qa.role).toBe('qa');
    expect(views.qa.focus).toEqual(['half-switch state']);
    expect(views.architect.role).toBe('architect');
    expect(views.architect.focus).toEqual(['backend', 'src/cli/commands/init.ts']);
  });
});
