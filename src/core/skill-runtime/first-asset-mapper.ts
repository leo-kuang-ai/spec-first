import {
  getProjectionDocsForRuntimeArtifact,
  type FIRST_RUNTIME_ARTIFACTS,
} from './first-artifact-mapping.js';
import type { StructuralChange } from './first-change-detection.js';

export type RuntimeAssetFile = (typeof FIRST_RUNTIME_ARTIFACTS)[number];

export interface AffectedAssets {
  runtimeAssets: RuntimeAssetFile[];
  docsProjections: string[];
}

const CHANGE_TYPE_TO_RUNTIME_ASSETS: Record<StructuralChange['type'], RuntimeAssetFile[]> = {
  module: ['summary.json', 'structure-overview.json'],
  api: ['summary.json', 'api-contracts.json'],
  risk: ['summary.json'],
  flow: ['critical-flows.json', 'entry-guide.json'],
  convention: ['conventions.json'],
  'tech-stack': ['summary.json'],
};

export function mapChangesToAssets(changes: StructuralChange[]): AffectedAssets {
  const runtimeAssets = Array.from(
    new Set(changes.flatMap((change) => CHANGE_TYPE_TO_RUNTIME_ASSETS[change.type]))
  );
  const docsProjections = Array.from(
    new Set(runtimeAssets.flatMap((asset) => getProjectionDocsForRuntimeArtifact(asset)))
  );

  return {
    runtimeAssets,
    docsProjections,
  };
}
