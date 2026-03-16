import type { FirstCriticalFlows, FirstRuntimeSummary } from './first-runtime-types.js';

export function buildFirstCriticalFlows(summary: FirstRuntimeSummary): FirstCriticalFlows {
  const primaryEntryPoint = summary.entryPoints[0] ?? 'src/cli/index.ts';
  const primaryRuntimeModule = summary.modules.find((item) => item.includes('skill-runtime'));
  const primaryCliModule =
    summary.modules.find((item) => item.includes('cli')) ?? 'src/cli/commands';
  const runtimeModule = primaryRuntimeModule ?? 'src/core/skill-runtime';

  return [
    {
      flowId: 'flow-cli-entry',
      name: 'CLI Entry Flow',
      entryPoints: [primaryEntryPoint],
      coreModules: [primaryCliModule, runtimeModule],
      invariants: ['runtime truth first', 'CLI orchestration must preserve canonical runtime assets'],
      verificationHooks: [
        'pnpm vitest run tests/unit/first-*.test.ts',
        'pnpm typecheck',
      ],
    },
    {
      flowId: 'flow-doc-projection',
      name: 'Docs Projection Flow',
      entryPoints: ['src/core/skill-runtime/first-doc-projection.ts'],
      coreModules: [runtimeModule],
      invariants: [
        'runtime truth first',
        'canonical projection docs must reflect runtime truth',
      ],
      verificationHooks: [
        'pnpm vitest run tests/unit/first-doc-projection.test.ts',
        'pnpm lint',
      ],
    },
  ];
}
