/**
 * Canonical relationship graph helpers.
 * 统一描述 trace row 维度上的主链路、补充链路和关系标签，供 trace / task / report 侧共享。
 */
import { validateId } from './id-validator.js';

export const MAIN_CHAIN_NODE_TYPES = ['Feature', 'REQ', 'FR', 'DS', 'TASK'] as const;
export type MainChainNodeType = (typeof MAIN_CHAIN_NODE_TYPES)[number];

export const SUPPLEMENTARY_NODE_TYPES = ['TC', 'RFC'] as const;
export type SupplementaryNodeType = (typeof SUPPLEMENTARY_NODE_TYPES)[number];

export const RELATION_LABELS = ['upstream', 'downstream', 'link', 'waiver'] as const;
export type RelationLabel = (typeof RELATION_LABELS)[number];

export type RelationshipTier = 'main_chain' | 'supplementary' | 'untracked';

export interface RelationshipTierPartitions<T> {
  mainChainRows: T[];
  supplementaryRows: T[];
  untrackedRows: T[];
}

export interface CanonicalTracePartitions {
  mainChainIds: string[];
  supplementaryIds: string[];
  untrackedIds: string[];
  relatedFRIds: string[];
  relatedDSIds: string[];
}

export function isMainChainNodeType(value: string): value is MainChainNodeType {
  return (MAIN_CHAIN_NODE_TYPES as readonly string[]).includes(value);
}

export function isSupplementaryNodeType(value: string): value is SupplementaryNodeType {
  return (SUPPLEMENTARY_NODE_TYPES as readonly string[]).includes(value);
}

export function isRelationLabel(value: string): value is RelationLabel {
  return (RELATION_LABELS as readonly string[]).includes(value);
}

export function classifyNodeType(value: string): RelationshipTier {
  if (isMainChainNodeType(value)) return 'main_chain';
  if (isSupplementaryNodeType(value)) return 'supplementary';
  return 'untracked';
}

export function splitByRelationshipTier<T extends { type: string }>(
  rows: readonly T[]
): RelationshipTierPartitions<T> {
  const partitions: RelationshipTierPartitions<T> = {
    mainChainRows: [],
    supplementaryRows: [],
    untrackedRows: [],
  };

  for (const row of rows) {
    const tier = classifyNodeType(row.type);
    if (tier === 'main_chain') {
      partitions.mainChainRows.push(row);
    } else if (tier === 'supplementary') {
      partitions.supplementaryRows.push(row);
    } else {
      partitions.untrackedRows.push(row);
    }
  }

  return partitions;
}

export function splitCanonicalTraceIds(traces: readonly string[]): CanonicalTracePartitions {
  const partitions: CanonicalTracePartitions = {
    mainChainIds: [],
    supplementaryIds: [],
    untrackedIds: [],
    relatedFRIds: [],
    relatedDSIds: [],
  };

  for (const trace of traces) {
    const validation = validateId(trace);
    if (!validation.valid || !validation.type) {
      partitions.untrackedIds.push(trace);
      continue;
    }

    const tier = classifyNodeType(validation.type);
    if (tier === 'main_chain') {
      partitions.mainChainIds.push(trace);
      if (validation.type === 'FR') {
        partitions.relatedFRIds.push(trace);
      } else if (validation.type === 'DS') {
        partitions.relatedDSIds.push(trace);
      }
      continue;
    }

    if (tier === 'supplementary') {
      partitions.supplementaryIds.push(trace);
      continue;
    }

    partitions.untrackedIds.push(trace);
  }

  return partitions;
}
