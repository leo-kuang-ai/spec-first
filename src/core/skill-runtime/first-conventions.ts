import type { FirstConventions, FirstRuntimeSummary } from './first-runtime-types.js';

function uniqueStrings(...groups: Array<string[] | undefined>): string[] {
  return Array.from(new Set(groups.flatMap((group) => group ?? []).filter(Boolean)));
}

export function buildFirstConventions(summary: FirstRuntimeSummary): FirstConventions {
  return {
    api: {
      observedPatterns:
        summary.apiSurface.length > 0 ? summary.apiSurface : ['CLI surface not explicitly detected'],
      deviations: [],
      recommendedConvention: 'Expose command surfaces through stable spec-first CLI verbs.',
      evidence: uniqueStrings(summary.apiSurface, summary.entryPoints, summary.evidence).slice(0, 5),
    },
    module: {
      observedPatterns: summary.modules.length > 0 ? summary.modules : ['module boundaries not explicitly detected'],
      deviations: [],
      recommendedConvention: 'Keep runtime logic under src/core and entry orchestration near src/cli.',
      evidence: uniqueStrings(summary.modules, summary.entryPoints).slice(0, 5),
    },
    testing: {
      observedPatterns:
        summary.techStack?.filter((item) => item.toLowerCase().includes('test')) ?? ['testing stack not explicitly detected'],
      deviations: [],
      recommendedConvention: 'Use Vitest-style automated regression coverage and keep test evidence alongside runtime changes.',
      evidence: uniqueStrings(summary.techStack, summary.evidence).slice(0, 5),
    },
    projectRules: {
      observedPatterns: ['runtime truth first', ...summary.risks.slice(0, 2)],
      deviations: [],
      recommendedConvention:
        'Treat .spec-first/runtime/first as canonical truth before projecting docs/first views.',
      evidence: uniqueStrings(summary.evidence, ['.spec-first/runtime/first']).slice(0, 5),
    },
  };
}
