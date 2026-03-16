import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { loadFirstContext, type FirstContext } from './first-context.js';
import {
  CANONICAL_PROJECTION_DOCS,
  FIRST_RUNTIME_ARTIFACTS,
  getProjectionDocsForRuntimeArtifact,
} from './first-artifact-mapping.js';
import {
  readFirstApiContracts,
  readFirstChangeMap,
  readFirstConventions,
  readFirstCriticalFlows,
  readFirstDatabaseSchema,
  readFirstDomainModel,
  readFirstEntryGuide,
  readFirstRebootGuide,
  readFirstStructureOverview,
} from './first-runtime-store.js';
import type {
  FirstApiContracts,
  FirstChangeMap,
  FirstConventions,
  FirstCriticalFlows,
  FirstDatabaseSchema,
  FirstDomainModel,
  FirstEntryGuide,
  FirstRebootGuide,
  FirstRuntimeSummary,
  FirstStructureOverview,
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

interface ProjectionContext extends FirstContext {
  artifactDocs: string[];
  techStack: string[];
  apiContracts: FirstApiContracts;
  structureOverview: FirstStructureOverview;
  domainModel: FirstDomainModel;
  databaseSchema: FirstDatabaseSchema | null;
  conventions: FirstConventions;
  criticalFlows: FirstCriticalFlows;
  changeMap: FirstChangeMap;
  entryGuide: FirstEntryGuide;
  rebootGuide: FirstRebootGuide;
}

function buildSyntheticConventions(summary: FirstRuntimeSummary): FirstConventions {
  return {
    api: {
      observedPatterns:
        summary.apiSurface.length > 0
          ? summary.apiSurface
          : ['CLI surface not explicitly detected'],
      deviations: [],
      recommendedConvention: 'Expose command surfaces through stable spec-first CLI verbs.',
      evidence: [...summary.entryPoints, ...summary.evidence].slice(0, 5),
    },
    module: {
      observedPatterns:
        summary.modules.length > 0
          ? summary.modules
          : ['module boundaries not explicitly detected'],
      deviations: [],
      recommendedConvention:
        'Keep runtime logic under src/core and entry orchestration near src/cli.',
      evidence: [...summary.modules, ...summary.entryPoints].slice(0, 5),
    },
    testing: {
      observedPatterns: summary.techStack?.filter((item) =>
        item.toLowerCase().includes('test')
      ) ?? ['testing stack not explicitly detected'],
      deviations: [],
      recommendedConvention:
        'Use Vitest-style automated regression coverage and keep test evidence alongside runtime changes.',
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
      readFirst: [
        '.spec-first/runtime/first/summary.json',
        '.spec-first/runtime/first/steering.json',
      ],
      thenRead: ['src/core/skill-runtime/first-runtime-store.ts'],
      avoidEntry: ['docs/first/tech-stack.md'],
      relatedFlows: ['flow-cli-entry'],
    },
    {
      taskCategory: 'docs-projection',
      readFirst: ['docs/first/README.md', '.spec-first/runtime/first/change-map.json'],
      thenRead: ['src/core/skill-runtime/first-doc-projection.ts'],
      avoidEntry: ['unregistered docs as truth'],
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

function buildSyntheticApiContracts(summary: FirstRuntimeSummary): FirstApiContracts {
  return {
    interfaces:
      summary.apiSurface.length > 0
        ? summary.apiSurface.map((surface) => ({
            interfaceType: surface.startsWith('CLI:') ? 'cli-command' : 'other',
            name: surface.replace(/^CLI:\s*/, ''),
            path: surface.replace(/^CLI:\s*/, ''),
            method: 'run',
            handler: summary.entryPoints[0] ?? 'src/cli/index.ts',
            request: [],
            response: ['自动生成 runtime 认知资产'],
            auth: [],
            evidence: uniqueStrings(summary.entryPoints, summary.evidence).slice(0, 6),
          }))
        : [],
    integrationPoints: uniqueStrings(summary.entryPoints, summary.modules).slice(0, 8),
    notes: ['当缺少细粒度接口证据时，这里展示最小接口面摘要。'],
  };
}

function buildSyntheticStructureOverview(summary: FirstRuntimeSummary): FirstStructureOverview {
  return {
    topology: ['entry -> modules -> runtime projection'],
    modules: summary.modules.map((modulePath) => ({
      name: modulePath.split('/').at(-1) ?? modulePath,
      purpose: `${modulePath} 是项目结构中的关键模块`,
      keyPaths: [modulePath],
      entryPoints: summary.entryPoints.filter((entryPoint) => entryPoint.startsWith(modulePath)),
      dependencies: [],
    })),
    readingOrder: uniqueStrings(summary.entryPoints, summary.modules).slice(0, 10),
    evidence: summary.evidence,
  };
}

function buildSyntheticDomainModel(summary: FirstRuntimeSummary): FirstDomainModel {
  return {
    entities: summary.dataModels.map((modelName) => ({
      name: modelName,
      kind: 'concept',
      description: `${modelName} 是项目认知中的核心概念`,
      invariants: ['需要与 runtime truth 保持一致'],
      relationships: summary.apiSurface.map((surface) => `关联接口: ${surface}`).slice(0, 5),
      evidence: summary.evidence,
    })),
    glossary: uniqueStrings(summary.dataModels, summary.capabilities).slice(0, 10),
    evidence: summary.evidence,
  };
}

function uniqueStrings(...groups: Array<string[] | undefined>): string[] {
  return Array.from(new Set(groups.flatMap((group) => group ?? []).filter(Boolean)));
}

function loadProjectionContext(projectRoot: string): ProjectionContext {
  const context = loadFirstContext(projectRoot);
  return {
    ...context,
    artifactDocs: Object.keys(context.index.docsProjection ?? {}).sort(),
    techStack: context.summary.techStack ?? [],
    apiContracts: readFirstApiContracts(projectRoot) ?? buildSyntheticApiContracts(context.summary),
    structureOverview:
      readFirstStructureOverview(projectRoot) ?? buildSyntheticStructureOverview(context.summary),
    domainModel: readFirstDomainModel(projectRoot) ?? buildSyntheticDomainModel(context.summary),
    databaseSchema: readFirstDatabaseSchema(projectRoot),
    conventions: readFirstConventions(projectRoot) ?? buildSyntheticConventions(context.summary),
    criticalFlows: readFirstCriticalFlows(projectRoot) ?? buildSyntheticCriticalFlows(context.summary),
    changeMap: readFirstChangeMap(projectRoot) ?? buildSyntheticChangeMap(context.summary),
    entryGuide: readFirstEntryGuide(projectRoot) ?? buildSyntheticEntryGuide(),
    rebootGuide: readFirstRebootGuide(projectRoot) ?? buildSyntheticRebootGuide(context.summary),
  };
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
  const unregisteredDocs = context.artifactDocs.filter((doc) => !CANONICAL_PROJECTION_DOCS.includes(doc));
  const lines = [
    '# 项目认知投影视图',
    '',
    '> `docs/first/` 是 `.spec-first/runtime/first/` 的人类可读投影视图层，不作为 runtime 真源；其中只有 canonical projection docs 受 runtime 自动刷新保障。',
    '',
    '## 项目概览',
    `- project: ${context.summary.project.name}`,
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
    '## Unregistered Docs',
    ...renderList(unregisteredDocs, '无'),
    '- 当前不在正式 projection registry 中，不受 runtime 自动刷新保障。',
    '',
    '## Skill Consumption Contract',
    '- 后续 skill 的正式输入优先读取 `.spec-first/runtime/first/`。',
    '- 列出的 `Canonical Projection Docs` 全部受 runtime 自动刷新保障。',
    '- 未注册的 `docs/first/*` 文档不参与 canonical truth 与自动治理。',
    '',
    '## 使用约定',
    '- 读取机器真相时优先使用 `.spec-first/runtime/first/` runtime truth。',
    '- 阅读面向人的摘要时使用 canonical projection docs。',
    '- 当 runtime truth 变化时，应重新刷新 canonical projection docs。',
  ];

  return lines.join('\n');
}

function renderSummaryDoc(context: ProjectionContext): string {
  return [
    '# First Runtime Summary',
    '',
    '## 项目概览',
    `- 项目: ${context.summary.project.name}`,
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

function renderTechStackDoc(context: ProjectionContext): string {
  return [
    '# Tech Stack',
    '',
    ...renderSection('Stack', context.techStack.length > 0 ? context.techStack : context.steering.tech.stack),
    ...renderSection('Constraints', context.steering.tech.constraints, '无'),
    ...renderSection('Forbidden Patterns', context.steering.tech.forbiddenPatterns, '无'),
    ...renderSection('Evidence', context.summary.evidence, '无'),
  ].join('\n');
}

function renderApiDocsDoc(context: ProjectionContext): string {
  const lines = ['# API Docs'];
  for (const item of context.apiContracts.interfaces) {
    lines.push('', `## ${item.name}`);
    lines.push('', `- Type: ${item.interfaceType}`);
    lines.push(`- Handler: ${item.handler}`);
    if (item.method) lines.push(`- Method: ${item.method}`);
    if (item.path) lines.push(`- Path: ${item.path}`);
    lines.push(...renderSubsection('Request', item.request, '无'));
    lines.push(...renderSubsection('Response', item.response, '无'));
    lines.push(...renderSubsection('Auth', item.auth, '无'));
    lines.push(...renderSubsection('Evidence', item.evidence, '无'));
  }
  lines.push(...renderSection('Integration Points', context.apiContracts.integrationPoints, '无'));
  lines.push(...renderSection('Notes', context.apiContracts.notes, '无'));
  return lines.join('\n');
}

function renderCodebaseOverviewDoc(context: ProjectionContext): string {
  const lines = ['# Codebase Overview'];
  lines.push(...renderSection('Topology', context.structureOverview.topology, '无'));
  for (const module of context.structureOverview.modules) {
    lines.push('', `## ${module.name}`);
    lines.push('', `- Purpose: ${module.purpose}`);
    lines.push(...renderSubsection('Key Paths', module.keyPaths, '无'));
    lines.push(...renderSubsection('Entry Points', module.entryPoints, '无'));
    lines.push(...renderSubsection('Dependencies', module.dependencies ?? [], '无'));
  }
  lines.push(...renderSection('Reading Order', context.structureOverview.readingOrder, '无'));
  lines.push(...renderSection('Evidence', context.structureOverview.evidence, '无'));
  return lines.join('\n');
}

function renderDomainModelDoc(context: ProjectionContext): string {
  const lines = ['# Domain Model'];
  for (const entity of context.domainModel.entities) {
    lines.push('', `## ${entity.name}`);
    lines.push('', `- Kind: ${entity.kind}`);
    lines.push(`- Description: ${entity.description}`);
    lines.push(...renderSubsection('Invariants', entity.invariants, '无'));
    lines.push(...renderSubsection('Relationships', entity.relationships, '无'));
    lines.push(...renderSubsection('Evidence', entity.evidence, '无'));
  }
  lines.push(...renderSection('Glossary', context.domainModel.glossary, '无'));
  lines.push(...renderSection('Evidence', context.domainModel.evidence, '无'));
  return lines.join('\n');
}

function renderArchitectureDoc(context: ProjectionContext): string {
  return [
    '# Architecture',
    '',
    ...renderSection('Topology', context.structureOverview.topology, '无'),
    ...renderSection('Modules', context.steering.structure.modules, '无'),
    ...renderSection('Boundaries', context.steering.structure.boundaries, '无'),
    ...renderSection('Entry Rules', context.steering.structure.entryRules, '无'),
    ...renderSection('Critical Flows', context.criticalFlows.map((flow) => flow.name), '无'),
  ].join('\n');
}

function renderCallGraphDoc(context: ProjectionContext): string {
  const lines = ['# Call Graph'];
  for (const flow of context.criticalFlows) {
    lines.push('', `## ${flow.name}`);
    lines.push(...renderSubsection('Entry Points', flow.entryPoints, '无'));
    lines.push(...renderSubsection('Core Modules', flow.coreModules, '无'));
    lines.push(...renderSubsection('Verification Hooks', flow.verificationHooks, '无'));
  }
  return lines.join('\n');
}

function renderExternalDepsDoc(context: ProjectionContext): string {
  return [
    '# External Dependencies',
    '',
    ...renderSection(
      'Dependency Surface',
      context.techStack.filter((item) =>
        /runtime:|package-manager:|testing:|build:/i.test(item)
      ),
      '无'
    ),
    ...renderSection('Integration Points', context.apiContracts.integrationPoints, '无'),
    ...renderSection('Evidence', context.summary.evidence, '无'),
  ].join('\n');
}

function renderLocalSetupDoc(context: ProjectionContext): string {
  return [
    '# Local Setup',
    '',
    ...renderSection('Entry Paths', context.entryGuide.flatMap((entry) => entry.readFirst), '无'),
    ...renderSection('Then Read', context.entryGuide.flatMap((entry) => entry.thenRead), '无'),
    ...renderSection('Recommended Rules', [context.conventions.testing.recommendedConvention], '无'),
    ...renderSection('Verify Checklist', context.rebootGuide.verifyChecklist, '无'),
  ].join('\n');
}

function renderDevelopmentGuidelinesDoc(context: ProjectionContext): string {
  return [
    '# Development Guidelines',
    '',
    `- API: ${context.conventions.api.recommendedConvention}`,
    `- Module: ${context.conventions.module.recommendedConvention}`,
    `- Testing: ${context.conventions.testing.recommendedConvention}`,
    `- Project Rules: ${context.conventions.projectRules.recommendedConvention}`,
  ].join('\n');
}

function renderDatabaseErDoc(context: ProjectionContext): string {
  if (!context.databaseSchema || context.databaseSchema.status !== 'healthy') {
    return ['# Database ER', '', '- 当前项目不适用数据库 ER 视图。'].join('\n');
  }

  const lines = ['# Database ER', '', `- Provider: ${context.databaseSchema.provider ?? 'unknown'}`];
  for (const table of context.databaseSchema.tables) {
    lines.push('', `## ${table.name}`);
    if (table.purpose) lines.push('', `- Purpose: ${table.purpose}`);
    lines.push(...renderSubsection('Fields', table.fields, '无'));
    lines.push(...renderSubsection('Relations', table.relations, '无'));
    lines.push(...renderSubsection('Evidence', table.evidence, '无'));
  }
  lines.push(...renderSection('Risks', context.databaseSchema.risks, '无'));
  return lines.join('\n');
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
      (item) =>
        item.changeType.includes(entry.taskCategory) || entry.taskCategory.includes(item.changeType)
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
  if (docPath.endsWith('tech-stack.md')) {
    return renderTechStackDoc(context);
  }
  if (docPath.endsWith('api-docs.md')) {
    return renderApiDocsDoc(context);
  }
  if (docPath.endsWith('codebase-overview.md')) {
    return renderCodebaseOverviewDoc(context);
  }
  if (docPath.endsWith('domain-model.md')) {
    return renderDomainModelDoc(context);
  }
  if (docPath.endsWith('architecture.md')) {
    return renderArchitectureDoc(context);
  }
  if (docPath.endsWith('call-graph.md')) {
    return renderCallGraphDoc(context);
  }
  if (docPath.endsWith('external-deps.md')) {
    return renderExternalDepsDoc(context);
  }
  if (docPath.endsWith('local-setup.md')) {
    return renderLocalSetupDoc(context);
  }
  if (docPath.endsWith('development-guidelines.md')) {
    return renderDevelopmentGuidelinesDoc(context);
  }
  if (docPath.endsWith('database-er.md')) {
    return renderDatabaseErDoc(context);
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

  const generatedDocs: string[] = [];

  for (const relativeDocPath of docs) {
    const fullPath = join(projectRoot, relativeDocPath);
    const shouldGenerate =
      !relativeDocPath.endsWith('database-er.md') || context.databaseSchema?.status === 'healthy';

    if (!shouldGenerate) {
      if (existsSync(fullPath)) {
        rmSync(fullPath, { force: true });
      }
      continue;
    }

    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, renderProjectedDoc(relativeDocPath, context), 'utf-8');
    generatedDocs.push(relativeDocPath);
  }

  return generatedDocs;
}

export { getProjectionDocsForRuntimeArtifact };
