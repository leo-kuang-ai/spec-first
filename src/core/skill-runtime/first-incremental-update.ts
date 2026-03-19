import { readFirstRuntimeSummary, readFirstApiContracts, readFirstConventions, readFirstCriticalFlows, readFirstEntryGuide, readFirstStructureOverview, writeFirstRuntimeSummary, writeFirstApiContracts, writeFirstConventions, writeFirstCriticalFlows, writeFirstEntryGuide, writeFirstStructureOverview } from './first-runtime-store.js';
import { assertFirstDocsExist } from './first-docs-check.js';
import { refreshFirstDocsFromRuntime } from './first-doc-projection.js';
import { assertValidFirstRuntime } from './first-runtime-validator.js';
import { mapChangesToAssets } from './first-asset-mapper.js';
import type { StructuralChange } from './first-change-detection.js';
import { syncFirstRuntimeIndexEntries } from './first-context.js';
import type { FirstApiContract, FirstApiContracts, FirstConventions, FirstCriticalFlow, FirstEntryGuide, FirstRuntimeSummary, FirstStructureModule, FirstStructureOverview } from './first-runtime-types.js';

export interface ConflictRecord {
  asset: string;
  target: string;
  reason: string;
}

export interface IncrementalUpdateResult {
  updatedRuntimeAssets: string[];
  docsOutputs: string[];
  conflicts: ConflictRecord[];
  skipped: string[];
}

function normalizeValue(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function slugify(value: string): string {
  return normalizeValue(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function evidencePath(evidence: string): string {
  return evidence.split('#')[0] ?? evidence;
}

function ensureSummary(projectRoot: string): FirstRuntimeSummary {
  const summary = readFirstRuntimeSummary(projectRoot);
  if (!summary) throw new Error('Missing first runtime summary for incremental update');
  return summary;
}

function ensureApiContracts(projectRoot: string): FirstApiContracts {
  const apiContracts = readFirstApiContracts(projectRoot);
  if (!apiContracts) throw new Error('Missing first api-contracts for incremental update');
  return apiContracts;
}

function ensureStructureOverview(projectRoot: string): FirstStructureOverview {
  const structureOverview = readFirstStructureOverview(projectRoot);
  if (!structureOverview) throw new Error('Missing first structure-overview for incremental update');
  return structureOverview;
}

function ensureConventions(projectRoot: string): FirstConventions {
  const conventions = readFirstConventions(projectRoot);
  if (!conventions) throw new Error('Missing first conventions for incremental update');
  return conventions;
}

function ensureCriticalFlows(projectRoot: string): FirstCriticalFlow[] {
  const flows = readFirstCriticalFlows(projectRoot);
  if (!flows) throw new Error('Missing first critical-flows for incremental update');
  return flows;
}

function ensureEntryGuide(projectRoot: string): FirstEntryGuide {
  const entryGuide = readFirstEntryGuide(projectRoot);
  if (!entryGuide) throw new Error('Missing first entry-guide for incremental update');
  return entryGuide;
}

function hasValue(items: string[], value: string): boolean {
  const normalized = normalizeValue(value).toLowerCase();
  return items.some((item) => normalizeValue(item).toLowerCase() === normalized);
}

function parseApi(change: StructuralChange): Pick<FirstApiContract, 'interfaceType' | 'name' | 'path' | 'method'> {
  const match = change.target.match(/^(GET|POST|PUT|PATCH|DELETE)\s+(\/\S+)$/i);
  if (match) {
    return {
      interfaceType: 'http',
      name: `${match[1].toUpperCase()} ${match[2]}`,
      method: match[1].toUpperCase(),
      path: match[2],
    };
  }
  return {
    interfaceType: 'other',
    name: change.target,
  };
}

export function incrementalUpdateRuntimeAssets(
  projectRoot: string,
  featureId: string,
  changes: StructuralChange[]
): IncrementalUpdateResult {
  if (changes.length === 0) {
    return {
      updatedRuntimeAssets: [],
      docsOutputs: [],
      conflicts: [],
      skipped: [],
    };
  }

  const affected = mapChangesToAssets(changes);
  const updatedRuntimeAssets = new Set<string>();
  const skipped: string[] = [];
  const conflicts: ConflictRecord[] = [];

  if (affected.runtimeAssets.includes('summary.json')) {
    const summary = ensureSummary(projectRoot);
    for (const change of changes) {
      if (change.type === 'module' && !hasValue(summary.modules, change.target)) {
        summary.modules.push(change.target);
        summary.evidence = Array.from(new Set([...summary.evidence, evidencePath(change.evidence)]));
        updatedRuntimeAssets.add('summary.json');
      }
      if (change.type === 'api' && !hasValue(summary.apiSurface, change.target)) {
        summary.apiSurface.push(change.target);
        summary.evidence = Array.from(new Set([...summary.evidence, evidencePath(change.evidence)]));
        updatedRuntimeAssets.add('summary.json');
      }
      if (change.type === 'risk' && !hasValue(summary.risks, change.target)) {
        summary.risks.push(change.target);
        updatedRuntimeAssets.add('summary.json');
      }
      if (change.type === 'tech-stack') {
        summary.techStack = summary.techStack ?? [];
        if (!hasValue(summary.techStack, change.target)) {
          summary.techStack.push(change.target);
          updatedRuntimeAssets.add('summary.json');
        }
      }
    }
    if (updatedRuntimeAssets.has('summary.json')) {
      writeFirstRuntimeSummary(projectRoot, summary);
    }
  }

  if (affected.runtimeAssets.includes('structure-overview.json')) {
    const structureOverview = ensureStructureOverview(projectRoot);
    for (const change of changes.filter((item) => item.type === 'module')) {
      const exists = structureOverview.modules.some(
        (module) => normalizeValue(module.name).toLowerCase() === normalizeValue(change.target).toLowerCase()
      );
      if (exists) {
        skipped.push(`module:${change.target}`);
        continue;
      }
      const moduleEntry: FirstStructureModule = {
        name: change.target,
        purpose: `Derived from feature ${featureId} structural change`,
        keyPaths: [evidencePath(change.evidence)],
        entryPoints: [],
        dependencies: [],
      };
      structureOverview.modules.push(moduleEntry);
      structureOverview.readingOrder = Array.from(
        new Set([...structureOverview.readingOrder, evidencePath(change.evidence)])
      );
      structureOverview.evidence = Array.from(
        new Set([...structureOverview.evidence, evidencePath(change.evidence)])
      );
      updatedRuntimeAssets.add('structure-overview.json');
    }
    if (updatedRuntimeAssets.has('structure-overview.json')) {
      writeFirstStructureOverview(projectRoot, structureOverview);
    }
  }

  if (affected.runtimeAssets.includes('api-contracts.json')) {
    const apiContracts = ensureApiContracts(projectRoot);
    for (const change of changes.filter((item) => item.type === 'api')) {
      const parsed = parseApi(change);
      const exists = apiContracts.interfaces.some((api) => {
        const left = `${api.method ?? ''} ${api.path ?? api.name}`.trim().toLowerCase();
        const right = `${parsed.method ?? ''} ${parsed.path ?? parsed.name}`.trim().toLowerCase();
        return left === right;
      });
      if (exists) {
        skipped.push(`api:${change.target}`);
        continue;
      }
      apiContracts.interfaces.push({
        interfaceType: parsed.interfaceType,
        name: parsed.name,
        path: parsed.path,
        method: parsed.method,
        handler: evidencePath(change.evidence),
        request: [],
        response: [`Derived from feature ${featureId}`],
        auth: [],
        errors: [],
        evidence: [change.evidence],
      });
      apiContracts.integrationPoints = Array.from(
        new Set([...apiContracts.integrationPoints, evidencePath(change.evidence)])
      );
      updatedRuntimeAssets.add('api-contracts.json');
    }
    if (updatedRuntimeAssets.has('api-contracts.json')) {
      writeFirstApiContracts(projectRoot, apiContracts);
    }
  }

  if (affected.runtimeAssets.includes('critical-flows.json')) {
    const criticalFlows = ensureCriticalFlows(projectRoot);
    for (const change of changes.filter((item) => item.type === 'flow')) {
      const flowId = `feature-${featureId.toLowerCase()}-${slugify(change.target)}`;
      const exists = criticalFlows.some(
        (flow) =>
          normalizeValue(flow.name).toLowerCase() === normalizeValue(change.target).toLowerCase() ||
          flow.flowId === flowId
      );
      if (exists) {
        skipped.push(`flow:${change.target}`);
        continue;
      }
      criticalFlows.push({
        flowId,
        name: change.target,
        entryPoints: [evidencePath(change.evidence)],
        coreModules: [],
        invariants: [`Derived from feature ${featureId}`],
        verificationHooks: ['archive project cognition writeback'],
      });
      updatedRuntimeAssets.add('critical-flows.json');
    }
    if (updatedRuntimeAssets.has('critical-flows.json')) {
      writeFirstCriticalFlows(projectRoot, criticalFlows);
    }
  }

  if (affected.runtimeAssets.includes('entry-guide.json')) {
    const entryGuide = ensureEntryGuide(projectRoot);
    for (const change of changes.filter((item) => item.type === 'flow')) {
      const taskCategory = `feature-flow:${slugify(change.target)}`;
      const exists = entryGuide.some((entry) => entry.taskCategory === taskCategory);
      if (exists) continue;
      entryGuide.push({
        taskCategory,
        readFirst: [evidencePath(change.evidence)],
        thenRead: ['.spec-first/runtime/first/critical-flows.json'],
        avoidEntry: ['docs-only assumptions'],
        relatedFlows: [`feature-${featureId.toLowerCase()}-${slugify(change.target)}`],
      });
      updatedRuntimeAssets.add('entry-guide.json');
    }
    if (updatedRuntimeAssets.has('entry-guide.json')) {
      writeFirstEntryGuide(projectRoot, entryGuide);
    }
  }

  if (affected.runtimeAssets.includes('conventions.json')) {
    const conventions = ensureConventions(projectRoot);
    for (const change of changes.filter((item) => item.type === 'convention')) {
      if (hasValue(conventions.projectRules.observedPatterns, change.target)) {
        skipped.push(`convention:${change.target}`);
        continue;
      }
      conventions.projectRules.observedPatterns.push(change.target);
      conventions.projectRules.evidence = Array.from(
        new Set([...conventions.projectRules.evidence, change.evidence])
      );
      updatedRuntimeAssets.add('conventions.json');
    }
    if (updatedRuntimeAssets.has('conventions.json')) {
      writeFirstConventions(projectRoot, conventions);
    }
  }

  if (conflicts.length > 0) {
    return {
      updatedRuntimeAssets: Array.from(updatedRuntimeAssets),
      docsOutputs: [],
      conflicts,
      skipped,
    };
  }

  const docsOutputs =
    updatedRuntimeAssets.size > 0
      ? (assertValidFirstRuntime(projectRoot),
        refreshFirstDocsFromRuntime(projectRoot, Array.from(updatedRuntimeAssets)))
      : [];

  if (updatedRuntimeAssets.size > 0 || docsOutputs.length > 0) {
    assertFirstDocsExist(projectRoot);
    syncFirstRuntimeIndexEntries(projectRoot, Array.from(updatedRuntimeAssets), docsOutputs);
  }

  return {
    updatedRuntimeAssets: Array.from(updatedRuntimeAssets),
    docsOutputs,
    conflicts,
    skipped,
  };
}
