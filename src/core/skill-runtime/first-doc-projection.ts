import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { loadFirstContext, type FirstContext } from './first-context.js';
import {
  CANONICAL_PROJECTION_DOCS,
  FIRST_RUNTIME_ARTIFACTS,
  getProjectionDocsForRuntimeArtifact,
} from './first-artifact-mapping.js';
import {
  readFirstChangeMap,
  readFirstConventions,
  readFirstCriticalFlows,
  readFirstEntryGuide,
  readFirstRebootGuide,
  getFirstRoleViewsPath,
  getFirstRuntimeIndexPath,
  getFirstRuntimeSummaryPath,
  getFirstStageViewsPath,
} from './first-runtime-store.js';
import type {
  FirstChangeMap,
  FirstConventions,
  FirstCriticalFlows,
  FirstEntryGuide,
  FirstRebootGuide,
  FirstSteering,
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
  conventions: FirstConventions;
  criticalFlows: FirstCriticalFlows;
  changeMap: FirstChangeMap;
  entryGuide: FirstEntryGuide;
  rebootGuide: FirstRebootGuide;
}

function buildSyntheticSteering(
  summary: FirstRuntimeSummary,
  artifactDocs: string[] = []
): FirstSteering {
  return {
    product: {
      overview: summary.project.overview ?? `${summary.project.name} project cognition`,
      coreScenarios: summary.capabilities.slice(0, 3),
      nonGoals: artifactDocs.length > 0 ? ['legacy docs as canonical truth'] : [],
      glossary: summary.dataModels.slice(0, 5),
    },
    tech: {
      stack: summary.techStack ?? [],
      constraints: summary.risks.slice(0, 3),
      forbiddenPatterns: ['docs-only truth'],
    },
    structure: {
      modules: summary.modules,
      boundaries: summary.entryPoints,
      entryRules: ['read runtime truth first'],
    },
  };
}

function buildSyntheticConventions(summary: FirstRuntimeSummary): FirstConventions {
  return {
    api: {
      observedPatterns: summary.apiSurface.length > 0 ? summary.apiSurface : ['CLI surface not explicitly detected'],
      deviations: [],
      recommendedConvention: 'Expose command surfaces through stable spec-first CLI verbs.',
      evidence: [...summary.entryPoints, ...summary.evidence].slice(0, 5),
    },
    module: {
      observedPatterns: summary.modules.length > 0 ? summary.modules : ['module boundaries not explicitly detected'],
      deviations: [],
      recommendedConvention: 'Keep runtime logic under src/core and entry orchestration near src/cli.',
      evidence: [...summary.modules, ...summary.entryPoints].slice(0, 5),
    },
    testing: {
      observedPatterns:
        summary.techStack?.filter((item) => item.toLowerCase().includes('test')) ?? ['testing stack not explicitly detected'],
      deviations: [],
      recommendedConvention: 'Use Vitest-style automated regression coverage and keep test evidence alongside runtime changes.',
      evidence: [...(summary.techStack ?? []), ...summary.evidence].slice(0, 5),
    },
    projectRules: {
      observedPatterns: ['runtime truth first', ...summary.risks.slice(0, 2)],
      deviations: [],
      recommendedConvention:
        'Treat .spec-first/runtime/first as canonical truth before projecting docs/first views.',
      evidence: [...summary.evidence, '.spec-first/runtime/first'].slice(0, 5),
    },
  };
}

function buildSyntheticCriticalFlows(summary: FirstRuntimeSummary): FirstCriticalFlows {
  const primaryEntryPoint = summary.entryPoints[0] ?? 'src/cli/index.ts';
  const runtimeModule =
    summary.modules.find((item) => item.includes('skill-runtime')) ?? 'src/core/skill-runtime';

  return [
    {
      flowId: 'flow-cli-entry',
      name: 'CLI Entry Flow',
      entryPoints: [primaryEntryPoint],
      coreModules: [runtimeModule],
      invariants: ['runtime truth first'],
      verificationHooks: ['refresh docs from runtime truth'],
    },
    {
      flowId: 'flow-doc-projection',
      name: 'Docs Projection Flow',
      entryPoints: ['src/core/skill-runtime/first-doc-projection.ts'],
      coreModules: [runtimeModule],
      invariants: ['canonical projection docs must reflect runtime truth'],
      verificationHooks: ['refresh docs from runtime truth'],
    },
  ];
}

function buildSyntheticChangeMap(summary: FirstRuntimeSummary): FirstChangeMap {
  const runtimeModule =
    summary.modules.find((item) => item.includes('skill-runtime')) ?? 'src/core/skill-runtime';

  return [
    {
      changeType: 'runtime-asset-extension',
      likelyModules: [runtimeModule],
      likelyCommands: ['src/cli/commands/first.ts'],
      likelyConfigs: ['package.json'],
      likelyTests: ['tests/unit/first-runtime-store.test.ts'],
      riskPoints: ['runtime index drift'],
    },
    {
      changeType: 'docs-projection-adjustment',
      likelyModules: ['src/core/skill-runtime/first-doc-projection.ts'],
      likelyCommands: [],
      likelyConfigs: [],
      likelyTests: ['tests/unit/first-doc-projection.test.ts'],
      riskPoints: ['canonical docs mismatch'],
    },
  ];
}

function buildSyntheticEntryGuide(): FirstEntryGuide {
  return [
    {
      taskCategory: 'runtime-extension',
      readFirst: ['.spec-first/runtime/first/summary.json', '.spec-first/runtime/first/steering.json'],
      thenRead: ['src/core/skill-runtime/first-runtime-store.ts'],
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
  ];
}

function buildSyntheticRebootGuide(summary: FirstRuntimeSummary): FirstRebootGuide {
  return {
    projectWhat: summary.project.overview ?? `${summary.project.name} project cognition`,
    whereToStart: ['.spec-first/runtime/first/summary.json', 'docs/first/README.md'],
    currentCriticalAreas: ['runtime truth first', ...summary.risks.slice(0, 2)],
    commonChangePaths: [...summary.modules.slice(0, 3), ...summary.entryPoints.slice(0, 2)],
    verifyChecklist: ['refresh docs from runtime truth'],
  };
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
  return Array.from(new Set(groups.flatMap((group) => group ?? []).filter(Boolean)));
}

function toDocRefs(entries: string[]): string[] {
  return entries.map((entry) => (entry.startsWith('docs/') ? entry : `docs/first/${entry}`));
}

function isLegacyRuntimeIndex(value: unknown): value is LegacyFirstRuntimeIndex {
  return (
    isRecord(value) &&
    typeof value.version === 'string' &&
    Array.isArray(value.artifacts) &&
    isRecord(value.project)
  );
}

function isLegacyRuntimeSummary(value: unknown): value is LegacyFirstRuntimeSummary {
  return (
    isRecord(value) &&
    typeof value.generated_at === 'string' &&
    typeof value.project_type === 'string' &&
    Array.isArray(value.core_modules)
  );
}

function isLegacyRoleViews(value: unknown): value is LegacyFirstRoleViews {
  return isRecord(value) && typeof value.generated_at === 'string' && isRecord(value.roles);
}

function isLegacyStageViews(value: unknown): value is LegacyFirstStageViews {
  return isRecord(value) && typeof value.generated_at === 'string' && isRecord(value.stages);
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

function readLegacyProjectionHints(
  projectRoot: string
): Pick<ProjectionContext, 'artifactDocs' | 'techStack'> {
  const rawIndex = readRawRuntimeJson(getFirstRuntimeIndexPath(projectRoot));
  const rawSummary = readRawRuntimeJson(getFirstRuntimeSummaryPath(projectRoot));

  const artifactDocs = isLegacyRuntimeIndex(rawIndex)
    ? uniqueStrings(
        rawIndex.artifacts
          ?.map((artifact) => artifact.path)
          .filter((path): path is string => typeof path === 'string')
      )
    : [];
  const techStack = isLegacyRuntimeSummary(rawSummary)
    ? Object.entries(rawSummary.tech_stack ?? {}).map(([key, value]) => `${key}: ${value}`)
    : [];

  return { artifactDocs, techStack };
}

function normalizeLegacyRoleView(
  role: FirstRoleView['role'],
  descriptor?: LegacyFirstRoleDescriptor
): FirstRoleView {
  const priorityDocs = toDocRefs(asStringArray(descriptor?.priority_docs));
  const entryPoints = asStringArray(descriptor?.entry_points).map(
    (entryPoint) => `entry: ${entryPoint}`
  );
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
      warnings: initFiles.map((file) => `00_init: ${file}`),
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
      callPathHints: planFiles.map((file) => `03_plan -> ${file}`),
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

  if (
    !isLegacyRuntimeIndex(rawIndex) ||
    !isLegacyRuntimeSummary(rawSummary) ||
    !isLegacyRoleViews(rawRoleViews) ||
    !isLegacyStageViews(rawStageViews)
  ) {
    return null;
  }

  const generatedAt =
    rawSummary.generated_at ??
    rawRoleViews.generated_at ??
    rawStageViews.generated_at ??
    rawIndex.generated_at ??
    'unknown';
  const projectName = rawIndex.project?.name ?? basename(projectRoot);
  const artifactDocs = uniqueStrings(
    rawIndex.artifacts
      ?.map((artifact) => artifact.path)
      .filter((path): path is string => typeof path === 'string')
  );
  const techStack = Object.entries(rawSummary.tech_stack ?? {}).map(
    ([key, value]) => `${key}: ${value}`
  );
  const entryPoints = uniqueStrings(
    asStringArray(rawRoleViews.roles?.developer?.entry_points),
    asStringArray(rawRoleViews.roles?.product_manager?.entry_points),
    asStringArray(rawRoleViews.roles?.tester?.entry_points),
    asStringArray(rawRoleViews.roles?.architect?.entry_points)
  );
  const apiSurface = toDocRefs(
    rawIndex.artifacts
      ?.filter((artifact) => artifact.type?.includes('api'))
      .map((artifact) => artifact.path)
      .filter((path): path is string => typeof path === 'string') ?? []
  );
  const dataModels = toDocRefs(
    rawIndex.artifacts
      ?.filter((artifact) => artifact.type?.includes('domain'))
      .map((artifact) => artifact.path)
      .filter((path): path is string => typeof path === 'string') ?? []
  );
  const capabilities = uniqueStrings(
    rawSummary.project_type ? [`project type: ${rawSummary.project_type}`] : [],
    typeof rawSummary.commands_count === 'number' ? [`commands: ${rawSummary.commands_count}`] : [],
    [rawSummary.has_database ? 'database: detected' : 'database: not detected']
  );
  const risks =
    rawIndex.database?.detected === false && rawIndex.database.reason
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
      roleViews: makeSyntheticAsset(
        '.spec-first/runtime/first/role-views.json',
        rawRoleViews.generated_at ?? generatedAt
      ),
      stageViews: makeSyntheticAsset(
        '.spec-first/runtime/first/stage-views.json',
        rawStageViews.generated_at ?? generatedAt
      ),
      steering: makeSyntheticAsset('.spec-first/runtime/first/steering.json', generatedAt),
      conventions: makeSyntheticAsset('.spec-first/runtime/first/conventions.json', generatedAt),
      criticalFlows: makeSyntheticAsset(
        '.spec-first/runtime/first/critical-flows.json',
        generatedAt
      ),
      changeMap: makeSyntheticAsset('.spec-first/runtime/first/change-map.json', generatedAt),
      entryGuide: makeSyntheticAsset('.spec-first/runtime/first/entry-guide.json', generatedAt),
      rebootGuide: makeSyntheticAsset('.spec-first/runtime/first/reboot-guide.json', generatedAt),
      docsProjection: {},
      status: 'current',
    },
    summary,
    roleViews: normalizeLegacyRoleViews(rawRoleViews),
    stageViews: normalizeLegacyStageViews(rawStageViews),
    steering: buildSyntheticSteering(summary, artifactDocs),
    conventions: buildSyntheticConventions(summary),
    criticalFlows: buildSyntheticCriticalFlows(summary),
    changeMap: buildSyntheticChangeMap(summary),
    entryGuide: buildSyntheticEntryGuide(),
    rebootGuide: buildSyntheticRebootGuide(summary),
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
      artifactDocs:
        legacyHints.artifactDocs.length > 0
          ? legacyHints.artifactDocs
          : Object.keys(context.index.docsProjection ?? {}).sort(),
      techStack: context.summary.techStack ?? legacyHints.techStack,
      conventions: readFirstConventions(projectRoot) ?? buildSyntheticConventions(context.summary),
      criticalFlows:
        readFirstCriticalFlows(projectRoot) ?? buildSyntheticCriticalFlows(context.summary),
      changeMap: readFirstChangeMap(projectRoot) ?? buildSyntheticChangeMap(context.summary),
      entryGuide: readFirstEntryGuide(projectRoot) ?? buildSyntheticEntryGuide(),
      rebootGuide: readFirstRebootGuide(projectRoot) ?? buildSyntheticRebootGuide(context.summary),
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
  return items.length > 0 ? items.map((item) => `- ${item}`) : [`- ${emptyLabel}`];
}

function renderSection(title: string, items: string[], emptyLabel?: string): string[] {
  return ['', `## ${title}`, ...renderList(items, emptyLabel)];
}

function renderSubsection(title: string, items: string[], emptyLabel?: string): string[] {
  return ['', `### ${title}`, ...renderList(items, emptyLabel)];
}

function renderOverviewDoc(context: ProjectionContext): string {
  const legacyDocs = context.artifactDocs.filter((doc) => !CANONICAL_PROJECTION_DOCS.includes(doc));
  const lines = [
    '# 项目认知投影视图',
    '',
    '> `docs/first/` 是 `.spec-first/runtime/first/` 的人类可读投影视图层，不作为 runtime 真源；其中只有 canonical projection docs 受 runtime 自动刷新保障。',
    '',
    '## 项目概览',
    `- project: ${context.summary.project.name}`,
    `- mode: ${context.summary.mode}`,
    `- generatedAt: ${context.summary.generatedAt}`,
    '',
    '## Runtime Canonical Truth',
    '',
    '- .spec-first/runtime/first/index.json',
    '- .spec-first/runtime/first/summary.json',
    '- .spec-first/runtime/first/role-views.json',
    '- .spec-first/runtime/first/stage-views.json',
    '',
    '## Canonical Projection Docs',
    ...renderList([...CANONICAL_PROJECTION_DOCS]),
    '',
    '## Legacy / Reference Docs',
    ...renderList(legacyDocs, '无'),
    '- 当前不受 runtime 真源自动刷新保障。',
    '',
    '## Skill Consumption Contract',
    '- 后续 skill 的正式输入优先读取 `.spec-first/runtime/first/`。',
    '- 列出的 `Canonical Projection Docs` 全部受 runtime 自动刷新保障。',
    '- 其他 `docs/first/*` 文档只作为 legacy/reference docs 提供人工参考，不作为 canonical truth。',
    '',
    '## 使用约定',
    '- 读取机器真相时优先使用 `.spec-first/runtime/first/` runtime truth。',
    '- 阅读面向人的摘要时使用 canonical projection docs。',
    '- 当 runtime truth 变化时，应重新刷新 canonical projection docs。'
  ];

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
    ...renderSection(
      'Tech Stack',
      context.techStack.length > 0 ? context.techStack : (context.summary.techStack ?? [])
    ),
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

function renderSteeringDoc(context: ProjectionContext): string {
  return [
    '# First Runtime Steering',
    '',
    '## Product Steering',
    `- Overview: ${context.steering.product.overview}`,
    ...renderSubsection('Core Scenarios', context.steering.product.coreScenarios),
    ...renderSubsection('Non Goals', context.steering.product.nonGoals),
    ...renderSubsection('Glossary', context.steering.product.glossary),
    ...renderSection('Tech Stack', context.steering.tech.stack),
    ...renderSection('Constraints', context.steering.tech.constraints),
    ...renderSection('Forbidden Patterns', context.steering.tech.forbiddenPatterns),
    ...renderSection('Modules', context.steering.structure.modules),
    ...renderSection('Boundaries', context.steering.structure.boundaries),
    ...renderSection('Entry Rules', context.steering.structure.entryRules),
  ].join('\n');
}

function renderConventionsDoc(context: ProjectionContext): string {
  return [
    '# First Runtime Conventions',
    '',
    '## API',
    ...renderSubsection('Observed Patterns', context.conventions.api.observedPatterns),
    ...renderSubsection('Deviations', context.conventions.api.deviations, '无'),
    '',
    `- Recommended Convention: ${context.conventions.api.recommendedConvention}`,
    ...renderSubsection('Evidence', context.conventions.api.evidence),
    '',
    '## Module',
    ...renderSubsection('Observed Patterns', context.conventions.module.observedPatterns),
    ...renderSubsection('Deviations', context.conventions.module.deviations, '无'),
    '',
    `- Recommended Convention: ${context.conventions.module.recommendedConvention}`,
    ...renderSubsection('Evidence', context.conventions.module.evidence),
    '',
    '## Testing',
    ...renderSubsection('Observed Patterns', context.conventions.testing.observedPatterns),
    ...renderSubsection('Deviations', context.conventions.testing.deviations, '无'),
    '',
    `- Recommended Convention: ${context.conventions.testing.recommendedConvention}`,
    ...renderSubsection('Evidence', context.conventions.testing.evidence),
    '',
    '## Project Rules',
    ...renderSubsection('Observed Patterns', context.conventions.projectRules.observedPatterns),
    ...renderSubsection('Deviations', context.conventions.projectRules.deviations, '无'),
    '',
    `- Recommended Convention: ${context.conventions.projectRules.recommendedConvention}`,
    ...renderSubsection('Evidence', context.conventions.projectRules.evidence),
  ].join('\n');
}

function renderCriticalFlowsDoc(context: ProjectionContext): string {
  const lines = ['# First Runtime Critical Flows'];

  for (const flow of context.criticalFlows) {
    lines.push('', `## ${flow.name}`, '', `- Flow ID: ${flow.flowId}`);
    lines.push(...renderSubsection('Entry Points', flow.entryPoints));
    lines.push(...renderSubsection('Core Modules', flow.coreModules));
    lines.push(...renderSubsection('Invariants', flow.invariants));
    lines.push(...renderSubsection('Verification Hooks', flow.verificationHooks));
  }

  return lines.join('\n');
}

function renderChangeMapDoc(context: ProjectionContext): string {
  const lines = ['# First Runtime Change Map'];

  for (const entry of context.changeMap) {
    lines.push('', `## ${entry.changeType}`);
    lines.push(...renderSubsection('Likely Modules', entry.likelyModules));
    lines.push(...renderSubsection('Likely Commands', entry.likelyCommands, '无'));
    lines.push(...renderSubsection('Likely Configs', entry.likelyConfigs, '无'));
    lines.push(...renderSubsection('Likely Tests', entry.likelyTests, '无'));
    lines.push(...renderSubsection('Risk Points', entry.riskPoints));
  }

  return lines.join('\n');
}

function renderEntryGuideDoc(context: ProjectionContext): string {
  const lines = ['# First Runtime Entry Guide'];

  for (const entry of context.entryGuide) {
    lines.push('', `## ${entry.taskCategory}`);
    lines.push(...renderSubsection('Read First', entry.readFirst));
    lines.push(...renderSubsection('Then Read', entry.thenRead, '无'));
    lines.push(...renderSubsection('Avoid Entry', entry.avoidEntry, '无'));
    lines.push(...renderSubsection('Related Flows', entry.relatedFlows, '无'));
  }

  return lines.join('\n');
}

function renderCommonPlaybooksDoc(context: ProjectionContext): string {
  const lines = ['# Common Playbooks'];

  for (const entry of context.entryGuide) {
    const matchingChangeMap = context.changeMap.find(
      (item) => item.changeType.includes(entry.taskCategory) || entry.taskCategory.includes(item.changeType)
    );

    lines.push('', `## ${entry.taskCategory}`);
    lines.push(...renderSubsection('Read First', entry.readFirst));
    lines.push(...renderSubsection('Then Read', entry.thenRead, '无'));
    lines.push(...renderSubsection('Avoid Entry', entry.avoidEntry, '无'));
    lines.push(...renderSubsection('Related Flows', entry.relatedFlows, '无'));

    if (matchingChangeMap) {
      lines.push(...renderSubsection('Likely Modules', matchingChangeMap.likelyModules, '无'));
      lines.push(...renderSubsection('Likely Tests', matchingChangeMap.likelyTests, '无'));
      lines.push(...renderSubsection('Risk Points', matchingChangeMap.riskPoints, '无'));
    }

    const matchingConvention = Object.values(context.conventions).find((bucket) =>
      bucket.observedPatterns.some((pattern: string) =>
        [...entry.readFirst, ...entry.thenRead].some((target) => target.includes(pattern))
      )
    );
    if (matchingConvention) {
      lines.push('', `- Recommended Convention: ${matchingConvention.recommendedConvention}`);
      lines.push(...renderSubsection('Evidence', matchingConvention.evidence, '无'));
    }
  }

  return lines.join('\n');
}

function renderKnownRisksAndTrapsDoc(context: ProjectionContext): string {
  const lines = [
    '# Known Risks And Traps',
    '',
    '## Current Critical Areas',
    ...renderList(context.rebootGuide.currentCriticalAreas, '无'),
    '',
    '## Summary Risks',
    ...renderList(context.summary.risks, '无'),
  ];

  for (const flow of context.criticalFlows) {
    lines.push('', `## ${flow.name}`);
    lines.push(...renderSubsection('Invariants', flow.invariants, '无'));
    lines.push(...renderSubsection('Verification Hooks', flow.verificationHooks, '无'));

    const relatedRiskPoints = context.changeMap
      .filter((entry) => flow.coreModules.some((module) => entry.likelyModules.includes(module)))
      .flatMap((entry) => entry.riskPoints);
    lines.push(...renderSubsection('Risk Points', Array.from(new Set(relatedRiskPoints)), '无'));
  }

  return lines.join('\n');
}

function renderRebootGuideDoc(context: ProjectionContext): string {
  return [
    '# First Runtime Reboot Guide',
    '',
    `- Project What: ${context.rebootGuide.projectWhat}`,
    ...renderSection('Where To Start', context.rebootGuide.whereToStart),
    ...renderSection('Current Critical Areas', context.rebootGuide.currentCriticalAreas),
    ...renderSection('Common Change Paths', context.rebootGuide.commonChangePaths),
    ...renderSection('Verify Checklist', context.rebootGuide.verifyChecklist),
  ].join('\n');
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
  if (docPath.endsWith('steering.md')) {
    return renderSteeringDoc(context);
  }
  if (docPath.endsWith('conventions.md')) {
    return renderConventionsDoc(context);
  }
  if (docPath.endsWith('critical-flows.md')) {
    return renderCriticalFlowsDoc(context);
  }
  if (docPath.endsWith('change-map.md')) {
    return renderChangeMapDoc(context);
  }
  if (docPath.endsWith('entry-guide.md')) {
    return renderEntryGuideDoc(context);
  }
  if (docPath.endsWith('common-playbooks.md')) {
    return renderCommonPlaybooksDoc(context);
  }
  if (docPath.endsWith('known-risks-and-traps.md')) {
    return renderKnownRisksAndTrapsDoc(context);
  }
  if (docPath.endsWith('reboot-guide.md')) {
    return renderRebootGuideDoc(context);
  }

  return renderGenericProjectedDoc(docPath, context);
}

export function refreshFirstDocsFromRuntime(
  projectRoot: string,
  runtimeArtifacts: string[] = [...FIRST_RUNTIME_ARTIFACTS]
): string[] {
  const context = loadProjectionContext(projectRoot);
  const docs = Array.from(
    new Set(
      runtimeArtifacts
        .filter((artifact): artifact is (typeof FIRST_RUNTIME_ARTIFACTS)[number] =>
          FIRST_RUNTIME_ARTIFACTS.includes(artifact as (typeof FIRST_RUNTIME_ARTIFACTS)[number])
        )
        .flatMap((artifact) => getProjectionDocsForRuntimeArtifact(artifact))
    )
  );

  for (const relativeDocPath of docs) {
    const fullPath = join(projectRoot, relativeDocPath);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, renderProjectedDoc(relativeDocPath, context), 'utf-8');
  }

  return docs;
}

export { getProjectionDocsForRuntimeArtifact };
