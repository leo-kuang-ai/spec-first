import type { FirstRebootGuide, FirstRuntimeSummary } from './first-runtime-types.js';

export function buildFirstRebootGuide(summary: FirstRuntimeSummary): FirstRebootGuide {
  return {
    projectWhat:
      summary.project.overview ?? `${summary.project.name} project cognition`,
    whereToStart: ['.spec-first/runtime/first/summary.json', 'docs/first/README.md'],
    currentCriticalAreas: ['runtime truth first', ...summary.risks.slice(0, 2)],
    commonChangePaths: [...summary.modules.slice(0, 3), ...summary.entryPoints.slice(0, 2)],
    verifyChecklist: [
      'pnpm vitest run tests/unit/first-*.test.ts',
      'pnpm typecheck',
    ],
  };
}
