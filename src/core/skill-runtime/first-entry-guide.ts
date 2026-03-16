import type { FirstEntryGuide, FirstRuntimeSummary } from './first-runtime-types.js';

export function buildFirstEntryGuide(summary: FirstRuntimeSummary): FirstEntryGuide {
  const runtimeModule =
    summary.modules.find((item) => item.includes('skill-runtime')) ?? 'src/core/skill-runtime';
  const cliModule = summary.modules.find((item) => item.includes('cli')) ?? 'src/cli/commands';

  return [
    {
      taskCategory: 'runtime-extension',
      readFirst: [
        '.spec-first/runtime/first/summary.json',
        '.spec-first/runtime/first/steering.json',
      ],
      thenRead: [runtimeModule, 'src/core/skill-runtime/first-runtime-store.ts'],
      avoidEntry: ['docs/first/tech-stack.md'],
      relatedFlows: ['flow-cli-entry'],
    },
    {
      taskCategory: 'docs-projection',
      readFirst: ['docs/first/README.md', '.spec-first/runtime/first/change-map.json'],
      thenRead: ['src/core/skill-runtime/first-doc-projection.ts'],
      avoidEntry: ['legacy docs as truth'],
      relatedFlows: ['flow-doc-projection'],
    },
    {
      taskCategory: 'cli-orchestration',
      readFirst: ['src/cli/index.ts', '.spec-first/runtime/first/critical-flows.json'],
      thenRead: [cliModule, 'src/cli/commands/first.ts'],
      avoidEntry: ['docs-only truth'],
      relatedFlows: ['flow-cli-entry'],
    },
  ];
}
