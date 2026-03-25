import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  readFirstApiContracts,
  readFirstConventions,
  readFirstCriticalFlows,
  readFirstRuntimeSummary,
  readFirstStructureOverview,
} from './first-runtime-store.js';

export type StructuralChangeType =
  | 'module'
  | 'api'
  | 'risk'
  | 'flow'
  | 'convention'
  | 'tech-stack';

export interface StructuralChange {
  type: StructuralChangeType;
  action: 'add';
  target: string;
  evidence: string;
  featureId: string;
}

interface ParsedSection {
  title: string;
  startLine: number;
  lines: string[];
}

interface CandidateItem {
  value: string;
  evidence: string;
}

const FEATURE_ARTIFACTS = ['spec.md', 'design.md', 'task_plan.md', 'wrap_up.md'] as const;

const MODULE_SECTION_PATTERNS = [/模块/, /module/, /架构/, /architecture/, /组件/, /component/];
const API_SECTION_PATTERNS = [/api/i, /接口/, /endpoint/i, /route/i];
const FLOW_SECTION_PATTERNS = [/流程/, /flow/i, /场景/, /scenario/i, /journey/i];
const RISK_SECTION_PATTERNS = [/风险/, /risk/i, /trap/i];
const CONVENTION_SECTION_PATTERNS = [/约定/, /规范/, /convention/i, /lesson/i, /经验/];
const TECH_STACK_SECTION_PATTERNS = [/技术栈/, /tech/i, /stack/i, /依赖/, /dependency/i, /选型/];
const HTTP_METHOD_PATTERN = /\b(GET|POST|PUT|PATCH|DELETE)\s+(\/[A-Za-z0-9/_:.-]*)\b/g;

function normalizeValue(value: string): string {
  return value
    .trim()
    .replace(/^[`"'“”]+|[`"'“”]+$/g, '')
    .replace(/\s+/g, ' ');
}

function slugify(value: string): string {
  return normalizeValue(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function matchesSection(title: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(title));
}

function parseSections(markdown: string): ParsedSection[] {
  const lines = markdown.split(/\r?\n/);
  const sections: ParsedSection[] = [];
  let current: ParsedSection | null = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    const heading = line.match(/^#{1,6}\s+(.+?)\s*$/);
    if (heading) {
      if (current) sections.push(current);
      current = {
        title: heading[1].trim(),
        startLine: index + 1,
        lines: [],
      };
      continue;
    }
    if (!current) {
      current = {
        title: '__root__',
        startLine: 1,
        lines: [],
      };
    }
    current.lines.push(line);
  }

  if (current) sections.push(current);
  return sections;
}

function extractListCandidates(
  sections: ParsedSection[],
  patterns: RegExp[],
  evidencePath: string
): CandidateItem[] {
  const items: CandidateItem[] = [];
  for (const section of sections) {
    if (!matchesSection(section.title, patterns)) continue;
    section.lines.forEach((line, index) => {
      const match = line.match(/^\s*(?:[-*+]|\d+\.)\s+(.+?)\s*$/);
      if (!match) return;
      const value = normalizeValue(match[1]);
      if (!value) return;
      items.push({
        value,
        evidence: `${evidencePath}#L${section.startLine + index}`,
      });
    });
  }
  return items;
}

function extractApiCandidates(
  sections: ParsedSection[],
  evidencePath: string
): CandidateItem[] {
  const items: CandidateItem[] = [];
  const matchedSections = sections.filter((section) => matchesSection(section.title, API_SECTION_PATTERNS));
  const sourceSections = matchedSections.length > 0 ? matchedSections : sections;

  for (const section of sourceSections) {
    section.lines.forEach((line, index) => {
      let match: RegExpExecArray | null;
      HTTP_METHOD_PATTERN.lastIndex = 0;
      while ((match = HTTP_METHOD_PATTERN.exec(line)) !== null) {
        const value = `${match[1]} ${match[2]}`;
        items.push({
          value,
          evidence: `${evidencePath}#L${section.startLine + index}`,
        });
      }
    });
  }

  return items;
}

function readArtifact(projectRoot: string, featureId: string, fileName: string): string | null {
  const fullPath = join(projectRoot, 'specs', featureId, fileName);
  if (!existsSync(fullPath)) return null;
  return readFileSync(fullPath, 'utf-8');
}

function buildExistingValueSets(projectRoot: string): Record<StructuralChangeType, Set<string>> {
  const summary = readFirstRuntimeSummary(projectRoot);
  const apiContracts = readFirstApiContracts(projectRoot);
  const structureOverview = readFirstStructureOverview(projectRoot);
  const criticalFlows = readFirstCriticalFlows(projectRoot);
  const conventions = readFirstConventions(projectRoot);

  return {
    module: new Set(
      [
        ...(summary?.modules ?? []),
        ...(structureOverview?.modules.map((item) => item.name) ?? []),
      ].map((item) => normalizeValue(item).toLowerCase())
    ),
    api: new Set(
      [
        ...(summary?.apiSurface ?? []),
        ...(apiContracts?.interfaces.flatMap((item) => [
          item.name,
          item.path ?? '',
          item.method && item.path ? `${item.method} ${item.path}` : '',
        ]) ?? []),
      ]
        .map((item) => normalizeValue(item).toLowerCase())
        .filter(Boolean)
    ),
    risk: new Set((summary?.risks ?? []).map((item) => normalizeValue(item).toLowerCase())),
    flow: new Set(
      (criticalFlows ?? [])
        .flatMap((item) => [item.name, item.flowId])
        .map((item) => normalizeValue(item).toLowerCase())
    ),
    convention: new Set(
      [
        ...(conventions?.api.observedPatterns ?? []),
        ...(conventions?.module.observedPatterns ?? []),
        ...(conventions?.testing.observedPatterns ?? []),
        ...(conventions?.projectRules.observedPatterns ?? []),
      ].map((item) => normalizeValue(item).toLowerCase())
    ),
    'tech-stack': new Set((summary?.techStack ?? []).map((item) => normalizeValue(item).toLowerCase())),
  };
}

function dedupeCandidates(
  type: StructuralChangeType,
  featureId: string,
  candidates: CandidateItem[],
  existingValues: Record<StructuralChangeType, Set<string>>
): StructuralChange[] {
  const seen = new Set<string>();
  const changes: StructuralChange[] = [];
  for (const candidate of candidates) {
    const normalized = normalizeValue(candidate.value);
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key) || existingValues[type].has(key)) continue;
    seen.add(key);
    changes.push({
      type,
      action: 'add',
      target: normalized,
      evidence: candidate.evidence,
      featureId,
    });
  }
  return changes;
}

export function detectStructuralChanges(projectRoot: string, featureId: string): StructuralChange[] {
  const existingValues = buildExistingValueSets(projectRoot);
  const changes: StructuralChange[] = [];

  for (const fileName of FEATURE_ARTIFACTS) {
    const markdown = readArtifact(projectRoot, featureId, fileName);
    if (!markdown) continue;

    const evidencePath = `specs/${featureId}/${fileName}`;
    const sections = parseSections(markdown);

    changes.push(
      ...dedupeCandidates(
        'module',
        featureId,
        extractListCandidates(sections, MODULE_SECTION_PATTERNS, evidencePath),
        existingValues
      )
    );
    changes.push(
      ...dedupeCandidates('api', featureId, extractApiCandidates(sections, evidencePath), existingValues)
    );
    changes.push(
      ...dedupeCandidates(
        'risk',
        featureId,
        extractListCandidates(sections, RISK_SECTION_PATTERNS, evidencePath),
        existingValues
      )
    );
    changes.push(
      ...dedupeCandidates(
        'flow',
        featureId,
        extractListCandidates(sections, FLOW_SECTION_PATTERNS, evidencePath),
        existingValues
      )
    );
    changes.push(
      ...dedupeCandidates(
        'convention',
        featureId,
        extractListCandidates(sections, CONVENTION_SECTION_PATTERNS, evidencePath),
        existingValues
      )
    );
    changes.push(
      ...dedupeCandidates(
        'tech-stack',
        featureId,
        extractListCandidates(sections, TECH_STACK_SECTION_PATTERNS, evidencePath),
        existingValues
      )
    );
  }

  return changes.sort((left, right) => {
    const leftKey = `${left.type}:${slugify(left.target)}`;
    const rightKey = `${right.type}:${slugify(right.target)}`;
    return leftKey.localeCompare(rightKey);
  });
}
