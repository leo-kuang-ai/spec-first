import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { loadFirstContext, type FirstContext } from './first-context.js';
import { FIRST_RUNTIME_ARTIFACTS, getProjectionDocsForRuntimeArtifact } from './first-artifact-mapping.js';
import {
  getFirstRoleViewsPath,
  getFirstRuntimeIndexPath,
  getFirstRuntimeSummaryPath,
  getFirstStageViewsPath,
} from './first-runtime-store.js';
import type {
  FirstRoleView,
  FirstRoleViews,
  FirstRuntimeAssetIndexEntry,
  FirstRuntimeSummary,
  FirstStageViews,
} from './first-runtime-types.js';

const ROLE_LABELS = {
  product: 'Product',
  dev: 'Developer',
  qa: 'QA',
  architect: 'Architect',
} as const;

const STAGE_LABELS = {
  spec: 'Spec View',
  design: 'Design View',
  code: 'Code View',
  verify: 'Verify View',
} as const;

interface LegacyFirstRuntimeIndexArtifact {
  id?: string;
  path?: string;
  type?: string;
  status?: string;
}

interface LegacyFirstRuntimeIndex {
  version?: string;
  mode?: 'quick' | 'deep';
  generated_at?: string;
  project?: {
    name?: string;
    version?: string;
    type?: string;
    description?: string;
  };
  artifacts?: LegacyFirstRuntimeIndexArtifact[];
  database?: {
    detected?: boolean;
    reason?: string;
  };
}

interface LegacyFirstRuntimeSummary {
  mode?: 'quick' | 'deep';
  generated_at?: string;
  tech_stack?: Record<string, string>;
  project_type?: string;
  core_modules?: string[];
  commands_count?: number;
  has_database?: boolean;
}

interface LegacyFirstRoleDescriptor {
  priority_docs?: string[];
  entry_points?: string[];
  key_concepts?: string[];
}

interface LegacyFirstRoleViews {
  generated_at?: string;
  roles?: {
    developer?: LegacyFirstRoleDescriptor;
    product_manager?: LegacyFirstRoleDescriptor;
    tester?: LegacyFirstRoleDescriptor;
    architect?: LegacyFirstRoleDescriptor;
  };
}

interface LegacyFirstStageDescriptor {
  relevant_docs?: string[];
  key_files?: string[];
}

interface LegacyFirstStageViews {
  generated_at?: string;
  stages?: Record<string, LegacyFirstStageDescriptor>;
}

interface ProjectionContext extends FirstContext {
  artifactDocs: string[];
  techStack: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];
}

function uniqueStrings(...groups: Array<string[] | undefined>): string[] {
  return Array.from(new Set(groups.flatMap(group => group ?? []).filter(Boolean)));
}

function toDocRefs(entries: string[]): string[] {
  return entries.map(entry => entry.startsWith('docs/') ? entry : `docs/first/${entry}`);
}

function isLegacyRuntimeIndex(value: unknown): value is LegacyFirstRuntimeIndex {
  return isRecord(value)
    && typeof value.version === 'string'
    && Array.isArray(value.artifacts)
    && isRecord(value.project);
}

function isLegacyRuntimeSummary(value: unknown): value is LegacyFirstRuntimeSummary {
  return isRecord(value)
    && typeof value.generated_at === 'string'
    && typeof value.project_type === 'string'
    && Array.isArray(value.core_modules);
}

function isLegacyRoleViews(value: unknown): value is LegacyFirstRoleViews {
  return isRecord(value)
    && typeof value.generated_at === 'string'
    && isRecord(value.roles);
}

function isLegacyStageViews(value: unknown): value is LegacyFirstStageViews {
  return isRecord(value)
    && typeof value.generated_at === 'string'
    && isRecord(value.stages);
}

function makeSyntheticAsset(path: string, lastUpdated: string): FirstRuntimeAssetIndexEntry {
  return {
    path,
    fileHash: 'legacy-runtime',
    lastUpdated,
    healthy: true,
  };
}
function readRawRuntimeJson(path: string): unknown | null {
  if (!existsSync(path)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return null;
  }
}

function readLegacyProjectionHints(projectRoot: string): Pick<ProjectionContext, 'artifactDocs' | 'techStack'> {
  const rawIndex = readRawRuntimeJson(getFirstRuntimeIndexPath(projectRoot));
  const rawSummary = readRawRuntimeJson(getFirstRuntimeSummaryPath(projectRoot));

  const artifactDocs = isLegacyRuntimeIndex(rawIndex)
    ? uniqueStrings(rawIndex.artifacts?.map(artifact => artifact.path).filter((path): path is string => typeof path === 'string'))
    : [];
  const techStack = isLegacyRuntimeSummary(rawSummary)
    ? Object.entries(rawSummary.tech_stack ?? {}).map(([key, value]) => `${key}: ${value}`)
    : [];

  return { artifactDocs, techStack };
}

function normalizeLegacyRoleView(role: FirstRoleView['role'], descriptor?: LegacyFirstRoleDescriptor): FirstRoleView {
  const priorityDocs = toDocRefs(asStringArray(descriptor?.priority_docs));
  const entryPoints = asStringArray(descriptor?.entry_points).map(entryPoint => `entry: ${entryPoint}`);
  const keyConcepts = asStringArray(descriptor?.key_concepts);
  const focus = uniqueStrings(priorityDocs, entryPoints, keyConcepts);

  return {
    role,
    summary: priorityDocs[0] ? `Prioritize ${priorityDocs[0]}` : 'No summary available',
    focus,
    warnings: [],
  };
}

function normalizeLegacyRoleViews(rawRoleViews: LegacyFirstRoleViews): FirstRoleViews {
  return {
    product: normalizeLegacyRoleView('product', rawRoleViews.roles?.product_manager),
    dev: normalizeLegacyRoleView('dev', rawRoleViews.roles?.developer),
    qa: normalizeLegacyRoleView('qa', rawRoleViews.roles?.tester),
    architect: normalizeLegacyRoleView('architect', rawRoleViews.roles?.architect),
  };
}

function normalizeLegacyStageViews(rawStageViews: LegacyFirstStageViews): FirstStageViews {
  const initStage = rawStageViews.stages?.['00_init'];
  const specStage = rawStageViews.stages?.['01_specify'] ?? initStage;
  const designStage = rawStageViews.stages?.['02_design'] ?? specStage;
  const planStage = rawStageViews.stages?.['03_plan'];
  const codeStage = rawStageViews.stages?.['04_implement'] ?? planStage ?? designStage;
  const verifyStage = rawStageViews.stages?.['05_verify'] ?? codeStage;

  const specDocs = toDocRefs(asStringArray(specStage?.relevant_docs));
  const designDocs = toDocRefs(asStringArray(designStage?.relevant_docs));
  const planDocs = toDocRefs(asStringArray(planStage?.relevant_docs));
  const codeDocs = toDocRefs(asStringArray(codeStage?.relevant_docs));
  const verifyDocs = toDocRefs(asStringArray(verifyStage?.relevant_docs));

  const specFiles = asStringArray(specStage?.key_files);
  const designFiles = asStringArray(designStage?.key_files);
  const planFiles = asStringArray(planStage?.key_files);
  const codeFiles = asStringArray(codeStage?.key_files);
  const verifyFiles = asStringArray(verifyStage?.key_files);
  const initFiles = asStringArray(initStage?.key_files);

  return {
    spec: {
      stage: 'spec',
      summary: 'Derived from 01_specify runtime stage',
      businessCapabilities: specDocs,
      coreEntities: [],
      dependencies: specFiles,
      warnings: initFiles.map(file => `00_init: ${file}`),
    },
    design: {
      stage: 'design',
      summary: 'Derived from 02_design runtime stage',
      moduleBoundaries: designFiles,
      integrationPoints: designDocs,
      technicalConstraints: [],
      risks: [],
    },
    code: {
      stage: 'code',
      summary: 'Derived from 04_implement runtime stage',
      entryPoints: codeFiles,
      likelyChangeAreas: uniqueStrings(planFiles, codeDocs),
      callPathHints: planFiles.map(file => `03_plan -> ${file}`),
      couplingPoints: uniqueStrings(planDocs, designFiles),
      changeHazards: [],
      verificationHooks: verifyFiles,
    },
    verify: {
      stage: 'verify',
      summary: 'Derived from 05_verify runtime stage',
      criticalFlows: verifyFiles,
      validationFocus: verifyDocs,
      testFocus: verifyFiles.length > 0 ? verifyFiles : verifyDocs,
      riskAreas: [],
      recommendedChecks: verifyDocs,
      validationHooks: [],
      releaseBlockers: [],
    },
  };
}

function loadLegacyProjectionContext(projectRoot: string): ProjectionContext | null {
  const rawIndex = readRawRuntimeJson(getFirstRuntimeIndexPath(projectRoot));
  const rawSummary = readRawRuntimeJson(getFirstRuntimeSummaryPath(projectRoot));
  const rawRoleViews = readRawRuntimeJson(getFirstRoleViewsPath(projectRoot));
  const rawStageViews = readRawRuntimeJson(getFirstStageViewsPath(projectRoot));

  if (!isLegacyRuntimeIndex(rawIndex) || !isLegacyRuntimeSummary(rawSummary) || !isLegacyRoleViews(rawRoleViews) || !isLegacyStageViews(rawStageViews)) {
    return null;
  }

  const generatedAt = rawSummary.generated_at ?? rawRoleViews.generated_at ?? rawStageViews.generated_at ?? rawIndex.generated_at ?? 'unknown';
  const projectName = rawIndex.project?.name ?? basename(projectRoot);
  const artifactDocs = uniqueStrings(
    rawIndex.artifacts?.map(artifact => artifact.path).filter((path): path is string => typeof path === 'string'),
  );
  const techStack = Object.entries(rawSummary.tech_stack ?? {}).map(([key, value]) => `${key}: ${value}`);
  const entryPoints = uniqueStrings(
    asStringArray(rawRoleViews.roles?.developer?.entry_points),
    asStringArray(rawRoleViews.roles?.product_manager?.entry_points),
    asStringArray(rawRoleViews.roles?.tester?.entry_points),
    asStringArray(rawRoleViews.roles?.architect?.entry_points),
  );
  const apiSurface = toDocRefs(
    rawIndex.artifacts
      ?.filter(artifact => artifact.type?.includes('api'))
      .map(artifact => artifact.path)
      .filter((path): path is string => typeof path === 'string') ?? [],
  );
  const dataModels = toDocRefs(
    rawIndex.artifacts
      ?.filter(artifact => artifact.type?.includes('domain'))
      .map(artifact => artifact.path)
      .filter((path): path is string => typeof path === 'string') ?? [],
  );
  const capabilities = uniqueStrings(
    rawSummary.project_type ? [`project type: ${rawSummary.project_type}`] : [],
    typeof rawSummary.commands_count === 'number' ? [`commands: ${rawSummary.commands_count}`] : [],
    [rawSummary.has_database ? 'database: detected' : 'database: not detected'],
  );
  const risks = rawIndex.database?.detected === false && rawIndex.database.reason
    ? [`database: ${rawIndex.database.reason}`]
    : [];
  const summary: FirstRuntimeSummary = {
    generatedAt,
    mode: rawSummary.mode === 'deep' ? 'deep' : 'quick',
    project: {
      name: projectName,
      platformType: rawSummary.project_type ?? rawIndex.project?.type,
      overview: rawIndex.project?.description,
    },
    modules: asStringArray(rawSummary.core_modules),
    capabilities,
    entryPoints,
    dataModels,
    apiSurface,
    risks,
    evidence: [
      '.spec-first/runtime/first/index.json',
      '.spec-first/runtime/first/summary.json',
      '.spec-first/runtime/first/role-views.json',
      '.spec-first/runtime/first/stage-views.json',
    ],
  };

  return {
    index: {
      version: rawIndex.version ?? 'legacy-runtime',
      lastRun: generatedAt,
      mode: summary.mode,
      summary: makeSyntheticAsset('.spec-first/runtime/first/summary.json', generatedAt),
      roleViews: makeSyntheticAsset('.spec-first/runtime/first/role-views.json', rawRoleViews.generated_at ?? generatedAt),
      stageViews: makeSyntheticAsset('.spec-first/runtime/first/stage-views.json', rawStageViews.generated_at ?? generatedAt),
      docsProjection: {},
      status: 'current',
    },
    summary,
    roleViews: normalizeLegacyRoleViews(rawRoleViews),
    stageViews: normalizeLegacyStageViews(rawStageViews),
    artifactDocs,
    techStack,
  };
}

function loadProjectionContext(projectRoot: string): ProjectionContext {
  const legacyHints = readLegacyProjectionHints(projectRoot);

  try {
    const context = loadFirstContext(projectRoot);
    return {
      ...context,
      artifactDocs: legacyHints.artifactDocs.length > 0
        ? legacyHints.artifactDocs
        : Object.keys(context.index.docsProjection ?? {}).sort(),
      techStack: context.summary.techStack ?? legacyHints.techStack,
    };
  } catch (error) {
    const legacyContext = loadLegacyProjectionContext(projectRoot);
    if (legacyContext !== null) {
      return legacyContext;
    }
    throw error;
  }
}

function renderList(items: string[], emptyLabel: string = '无'): string[] {
  return items.length > 0 ? items.map(item => `- ${item}`) : [`- ${emptyLabel}`];
}

function renderSection(title: string, items: string[], emptyLabel?: string): string[] {
  return ['', `## ${title}`, ...renderList(items, emptyLabel)];
}

function renderSubsection(title: string, items: string[], emptyLabel?: string): string[] {
  return ['', `### ${title}`, ...renderList(items, emptyLabel)];
}

function renderOverviewDoc(context: ProjectionContext): string {
  const summaryDoc = 'docs/first/summary.md';
  const roleViewsDoc = 'docs/first/role-views.md';
  const stageViewsDoc = 'docs/first/stage-views.md';
  const lines = [
    '# 项目认知投影视图',
    '',
    '> `docs/first/` 是 `.spec-first/runtime/first/` 的人类可读投影视图层，不作为 runtime 真源。',
    '',
    '## 项目概览',
    `- project: ${context.summary.project.name}`,
    `- mode: ${context.summary.mode}`,
    `- generatedAt: ${context.summary.generatedAt}`,
    '',
    '## 文档投影视图',
    `- ${summaryDoc}`,
    `- ${roleViewsDoc}`,
    `- ${stageViewsDoc}`,
  ];

  if (context.artifactDocs.length > 0) {
    lines.push('', '## Skill 初始化文档', ...renderList(context.artifactDocs));
  }

  lines.push(
    '',
    '## Runtime 真源',
    '- .spec-first/runtime/first/index.json',
    '- .spec-first/runtime/first/summary.json',
    '- .spec-first/runtime/first/role-views.json',
    '- .spec-first/runtime/first/stage-views.json',
    '',
    '## 使用约定',
    '- 读取机器真相时优先使用 `.spec-first/runtime/first/`。',
    '- 阅读面向人的摘要时使用 `docs/first/` 投影视图。',
    '- 当 runtime 真源变化时，应重新刷新 docs 投影视图。',
  );

  return lines.join('\n');
}

function renderSummaryDoc(context: ProjectionContext): string {
  return [
    '# First Runtime Summary',
    '',
    '## 项目概览',
    `- 项目: ${context.summary.project.name}`,
    `- 模式: ${context.summary.mode}`,
    `- 平台: ${context.summary.project.platformType ?? 'unknown'}`,
    `- 生成时间: ${context.summary.generatedAt}`,
    `- 概述: ${context.summary.project.overview ?? '未提供'}`,
    ...renderSection('Tech Stack', context.techStack.length > 0 ? context.techStack : (context.summary.techStack ?? [])),
    ...renderSection('Capabilities', context.summary.capabilities),
    ...renderSection('Modules', context.summary.modules),
    ...renderSection('Entry Points', context.summary.entryPoints),
    ...renderSection('Data Models', context.summary.dataModels),
    ...renderSection('API Surface', context.summary.apiSurface),
    ...renderSection('Risks', context.summary.risks),
    ...renderSection('Evidence', context.summary.evidence),
  ].join('\n');
}

function renderRoleViewsDoc(context: ProjectionContext): string {
  const lines = ['# First Runtime Role Views'];

  for (const role of Object.keys(context.roleViews) as Array<keyof typeof context.roleViews>) {
    const view = context.roleViews[role];
    lines.push('', `## ${ROLE_LABELS[role]}`, '', `- Summary: ${view.summary}`);
    lines.push(...renderSubsection('Focus', view.focus));
    lines.push(...renderSubsection('Warnings', view.warnings));
  }

  return lines.join('\n');
}

function renderStageViewsDoc(context: ProjectionContext): string {
  const lines = ['# First Runtime Stage Views'];

  for (const stage of Object.keys(context.stageViews) as Array<keyof typeof context.stageViews>) {
    if (stage === 'spec') {
      const view = context.stageViews.spec;
      lines.push('', `## ${STAGE_LABELS[stage]}`, '', `- Summary: ${view.summary}`);
      lines.push(...renderSubsection('Business Capabilities', view.businessCapabilities));
      lines.push(...renderSubsection('Core Entities', view.coreEntities));
      lines.push(...renderSubsection('Dependencies', view.dependencies));
      lines.push(...renderSubsection('Warnings', view.warnings));
      continue;
    }

    if (stage === 'design') {
      const view = context.stageViews.design;
      lines.push('', `## ${STAGE_LABELS[stage]}`, '', `- Summary: ${view.summary}`);
      lines.push(...renderSubsection('Module Boundaries', view.moduleBoundaries));
      lines.push(...renderSubsection('Integration Points', view.integrationPoints));
      lines.push(...renderSubsection('Technical Constraints', view.technicalConstraints));
      lines.push(...renderSubsection('Risks', view.risks));
      continue;
    }

    if (stage === 'code') {
      const view = context.stageViews.code;
      lines.push('', `## ${STAGE_LABELS[stage]}`, '', `- Summary: ${view.summary}`);
      lines.push(...renderSubsection('Entry Points', view.entryPoints));
      lines.push(...renderSubsection('Likely Change Areas', view.likelyChangeAreas));
      lines.push(...renderSubsection('Call Path Hints', view.callPathHints ?? []));
      lines.push(...renderSubsection('Coupling Points', view.couplingPoints ?? []));
      lines.push(...renderSubsection('Change Hazards', view.changeHazards));
      lines.push(...renderSubsection('Verification Hooks', view.verificationHooks));
      continue;
    }

    const view = context.stageViews.verify;
    lines.push('', `## ${STAGE_LABELS[stage]}`, '', `- Summary: ${view.summary}`);
    lines.push(...renderSubsection('Critical Flows', view.criticalFlows ?? []));
    lines.push(...renderSubsection('Validation Focus', view.validationFocus ?? []));
    lines.push(...renderSubsection('Test Focus', view.testFocus));
    lines.push(...renderSubsection('Risk Areas', view.riskAreas));
    lines.push(...renderSubsection('Recommended Checks', view.recommendedChecks ?? []));
    lines.push(...renderSubsection('Validation Hooks', view.validationHooks));
    lines.push(...renderSubsection('Release Blockers', view.releaseBlockers));
  }

  return lines.join('\n');
}

function renderGenericProjectedDoc(docPath: string, context: ProjectionContext): string {
  const fileName = docPath.split('/').at(-1) ?? 'first-doc';

  return [
    `# ${fileName}`,
    '',
    `- project: ${context.summary.project.name}`,
    `- generatedAt: ${context.summary.generatedAt}`,
    '- projection: runtime-derived document',
    '- canonical-docs:',
    '  - docs/first/summary.md',
    '  - docs/first/role-views.md',
    '  - docs/first/stage-views.md',
    '',
    '## Notes',
    '- This document is projected from the current first runtime assets.',
    '- Prefer canonical docs for detailed review and stage-specific decisions.',
  ].join('\n');
}

export function renderProjectedDoc(docPath: string, context: ProjectionContext): string {
  if (docPath.endsWith('README.md')) {
    return renderOverviewDoc(context);
  }
  if (docPath.endsWith('summary.md')) {
    return renderSummaryDoc(context);
  }
  if (docPath.endsWith('role-views.md')) {
    return renderRoleViewsDoc(context);
  }
  if (docPath.endsWith('stage-views.md')) {
    return renderStageViewsDoc(context);
  }

  return renderGenericProjectedDoc(docPath, context);
}

export function refreshFirstDocsFromRuntime(projectRoot: string, runtimeArtifacts: string[] = [...FIRST_RUNTIME_ARTIFACTS]): string[] {
  const context = loadProjectionContext(projectRoot);
  const docs = Array.from(new Set(
    runtimeArtifacts
      .filter((artifact): artifact is (typeof FIRST_RUNTIME_ARTIFACTS)[number] => FIRST_RUNTIME_ARTIFACTS.includes(artifact as (typeof FIRST_RUNTIME_ARTIFACTS)[number]))
      .flatMap(artifact => getProjectionDocsForRuntimeArtifact(artifact)),
  ));

  for (const relativeDocPath of docs) {
    const fullPath = join(projectRoot, relativeDocPath);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, renderProjectedDoc(relativeDocPath, context), 'utf-8');
  }

  return docs;
}

export { getProjectionDocsForRuntimeArtifact };
