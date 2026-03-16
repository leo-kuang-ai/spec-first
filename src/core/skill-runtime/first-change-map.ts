import type { FirstChangeMap, FirstRuntimeSummary } from './first-runtime-types.js';

function uniqueStrings(...groups: Array<string[] | undefined>): string[] {
  return Array.from(new Set(groups.flatMap((group) => group ?? []).filter(Boolean)));
}

export function buildFirstChangeMap(summary: FirstRuntimeSummary): FirstChangeMap {
  const runtimeModule =
    summary.modules.find((item) => item.includes('skill-runtime')) ?? 'src/core/skill-runtime';
  const cliModule = summary.modules.find((item) => item.includes('cli')) ?? 'src/cli/commands';

  return [
    {
      changeType: 'runtime-asset-extension',
      likelyModules: [runtimeModule],
      likelyCommands: ['src/cli/commands/first.ts'],
      likelyConfigs: ['package.json'],
      likelyTests: ['tests/unit/first-runtime-store.test.ts', 'tests/unit/first-runtime-types.test.ts'],
      riskPoints: ['runtime index drift', 'legacy compatibility regression'],
    },
    {
      changeType: 'docs-projection-adjustment',
      likelyModules: ['src/core/skill-runtime/first-doc-projection.ts', runtimeModule],
      likelyCommands: [],
      likelyConfigs: [],
      likelyTests: ['tests/unit/first-doc-projection.test.ts'],
      riskPoints: ['canonical docs mismatch', 'legacy projection fallback drift'],
    },
    {
      changeType: 'cli-entry-orchestration',
      likelyModules: [cliModule, runtimeModule],
      likelyCommands: ['src/cli/commands/first.ts'],
      likelyConfigs: uniqueStrings(summary.evidence.filter((item) => item.endsWith('.json'))),
      likelyTests: ['tests/unit/first-command.test.ts', 'tests/unit/first-refresh.test.ts'],
      riskPoints: ['runtime truth refresh gap', 'half-switch state'],
    },
  ];
}
