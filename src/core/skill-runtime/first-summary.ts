import type { FirstRuntimeMode, FirstRuntimeSummary } from './first-runtime-types.js';

export interface FirstSummarySource {
  generatedAt?: string;
  mode: FirstRuntimeMode;
  projectName?: string;
  platformType?: string;
  overview?: string;
  modules?: string[];
  capabilities?: string[];
  entryPoints?: string[];
  dataModels?: string[];
  apiSurface?: string[];
  risks?: string[];
  evidence?: string[];
}

export function buildFirstSummary(source: FirstSummarySource): FirstRuntimeSummary {
  return {
    generatedAt: source.generatedAt ?? new Date().toISOString(),
    mode: source.mode,
    project: {
      name: source.projectName ?? '',
      platformType: source.platformType,
      overview: source.overview,
    },
    modules: source.modules ?? [],
    capabilities: source.capabilities ?? [],
    entryPoints: source.entryPoints ?? [],
    dataModels: source.dataModels ?? [],
    apiSurface: source.apiSurface ?? [],
    risks: source.risks ?? [],
    evidence: source.evidence ?? [],
  };
}
