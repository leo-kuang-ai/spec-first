import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  BASE_PROJECTION_DOCS,
  CANONICAL_PROJECTION_DOCS,
  FIRST_RUNTIME_ARTIFACTS,
  FORMAL_TOPIC_PROJECTION_DOCS,
  CONDITIONAL_PROJECTION_DOCS,
  getProjectionDocsForRuntimeArtifact,
} from './first-artifact-mapping.js';
import {
  readFirstApiContracts,
  readFirstConventions,
  readFirstCriticalFlows,
  readFirstDatabaseSchema,
  readFirstDomainModel,
  readFirstEntryGuide,
  readFirstRuntimeIndex,
  readFirstRuntimeSummary,
  readFirstSteering,
  readFirstStructureOverview,
} from './first-runtime-store.js';
import type {
  FirstApiContracts,
  FirstConventions,
  FirstCriticalFlows,
  FirstDatabaseSchema,
  FirstDomainModel,
  FirstEntryGuide,
  FirstRuntimeIndex,
  FirstRuntimeSummary,
  FirstSteering,
  FirstStructureOverview,
} from './first-runtime-types.js';
import { assertValidFirstRuntime } from './first-runtime-validator.js';

interface ProjectionContext {
  index: FirstRuntimeIndex;
  summary: FirstRuntimeSummary;
  steering: FirstSteering;
  artifactDocs: string[];
  techStack: string[];
  apiContracts: FirstApiContracts;
  structureOverview: FirstStructureOverview;
  domainModel: FirstDomainModel;
  databaseSchema: FirstDatabaseSchema | null;
  conventions: FirstConventions;
  criticalFlows: FirstCriticalFlows;
  entryGuide: FirstEntryGuide;
}

function requireRuntimeAsset<T>(asset: T | null, label: string): T {
  if (asset === null) {
    throw new Error(`Missing first runtime asset: ${label}`);
  }
  return asset;
}

function uniqueStrings(...groups: Array<string[] | undefined>): string[] {
  return Array.from(new Set(groups.flatMap((group) => group ?? []).filter(Boolean)));
}

function loadProjectionContext(projectRoot: string): ProjectionContext {
  assertValidFirstRuntime(projectRoot);
  const index = readFirstRuntimeIndex(projectRoot);
  const summary = readFirstRuntimeSummary(projectRoot);
  const steering = readFirstSteering(projectRoot);
  if (!index || !summary || !steering) {
    throw new Error('Missing first runtime asset: summary/steering/index');
  }
  return {
    index,
    summary,
    steering,
    artifactDocs: Object.keys(index.docsProjection ?? {}).sort(),
    techStack: summary.techStack ?? [],
    apiContracts: requireRuntimeAsset(readFirstApiContracts(projectRoot), 'api-contracts'),
    structureOverview: requireRuntimeAsset(
      readFirstStructureOverview(projectRoot),
      'structure-overview'
    ),
    domainModel: requireRuntimeAsset(readFirstDomainModel(projectRoot), 'domain-model'),
    databaseSchema: readFirstDatabaseSchema(projectRoot),
    conventions: requireRuntimeAsset(readFirstConventions(projectRoot), 'conventions'),
    criticalFlows: requireRuntimeAsset(readFirstCriticalFlows(projectRoot), 'critical-flows'),
    entryGuide: requireRuntimeAsset(readFirstEntryGuide(projectRoot), 'entry-guide'),
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

function renderDocHeader(title: string, truthSources: string[]): string[] {
  return [
    `# ${title}`,
    '',
    '> 标准模式：deep',
    '> 文档层级：docs/first 阅读产物',
    `> 真源依赖：${truthSources.join('、')}`,
  ];
}

function renderOverviewDoc(context: ProjectionContext): string {
  const unregisteredDocs = context.artifactDocs.filter((doc) => !CANONICAL_PROJECTION_DOCS.includes(doc));
  const runtimeTruthFiles = [
    '.spec-first/runtime/first/index.json',
    ...FIRST_RUNTIME_ARTIFACTS.map((artifact) => `.spec-first/runtime/first/${artifact}`),
  ];
  const conditionalStatus = CONDITIONAL_PROJECTION_DOCS.map((docPath) => {
    if (docPath.endsWith('database-er.md')) {
      const status = context.databaseSchema?.status ?? 'not_applicable';
      return `${docPath} -> ${status === 'healthy' ? '生成' : '不生成'} (${status})`;
    }
    return `${docPath} -> [待确认]`;
  });
  const lines = [
    ...renderDocHeader('项目认知输出总览', ['.spec-first/runtime/first/index.json', ...FIRST_RUNTIME_ARTIFACTS.map((artifact) => `.spec-first/runtime/first/${artifact}`)]),
    '',
    '> `docs/first/` 是供人阅读的输出层，不参与 machine truth，不反向参与上下文注入。',
    '',
    '## 项目摘要',
    `- project: ${context.summary.project.name}`,
    `- generatedAt: ${context.summary.generatedAt}`,
    `- platform: ${context.summary.project.platformType ?? 'unknown'}`,
    `- overview: ${context.summary.project.overview ?? '未提供'}`,
    '',
    '## Runtime 真源导航',
    ...renderList(runtimeTruthFiles),
    '',
    '## 基础 docs 输出',
    ...renderList([...BASE_PROJECTION_DOCS]),
    '',
    '## 专题 docs 输出',
    ...renderList([...FORMAL_TOPIC_PROJECTION_DOCS]),
    '',
    '## 条件型 docs 状态',
    ...renderList(conditionalStatus, '无'),
    '',
    '## Runtime Truth',
    ...renderList(runtimeTruthFiles),
    '',
    '## Docs Outputs',
    ...renderList([...CANONICAL_PROJECTION_DOCS]),
    '',
    '## Unregistered Docs',
    ...renderList(unregisteredDocs, '无'),
    '- 当前不在正式 docs 集合中，不受最小支撑层输出约束。',
    '',
    '## 使用建议',
    '- 后续 skill 的正式输入优先读取 `.spec-first/runtime/first/`。',
    '- 新同学先读 `summary.md`、`entry-guide.md`、`codebase-overview.md`。',
    '- 涉及实现定位时优先使用 `critical-flows.md`、`architecture.md`、`codebase-overview.md`。',
    '- 涉及数据库理解时先检查条件型资产状态，再决定是否消费 `database-er.md`。',
    '',
    '## Skill Consumption Contract',
    '- 后续 skill 的正式输入优先读取 `.spec-first/runtime/first/`。',
    '- `docs/first/*` 是阅读输出，不参与 machine truth。',
    '- 未注册的 `docs/first/*` 文档不参与正式上下文注入与治理。',
  ];

  return lines.join('\n');
}

function renderSummaryDoc(context: ProjectionContext): string {
  return [
    ...renderDocHeader('项目摘要', ['.spec-first/runtime/first/summary.json']),
    '',
    '## 项目是什么',
    `- 项目: ${context.summary.project.name}`,
    `- 平台: ${context.summary.project.platformType ?? 'unknown'}`,
    `- 生成时间: ${context.summary.generatedAt}`,
    `- 概述: ${context.summary.project.overview ?? '未提供'}`,
    ...renderSection('技术栈', context.techStack, '无'),
    ...renderSection('主要能力', context.summary.capabilities),
    ...renderSection('入口', context.summary.entryPoints),
    ...renderSection('关键模块', context.summary.modules),
    ...renderSection('核心数据模型', context.summary.dataModels),
    ...renderSection('接口面', context.summary.apiSurface),
    ...renderSection('风险', context.summary.risks),
    ...renderSection('证据摘要', context.summary.evidence),
  ].join('\n');
}

function renderApiDocsDoc(context: ProjectionContext): string {
  const lines = renderDocHeader('接口文档', ['.spec-first/runtime/first/api-contracts.json']);
  lines.push(
    '',
    '## 接口清单',
    ...renderList(
      context.apiContracts.interfaces.map(
        (item) => `${item.name} -> ${item.interfaceType}${item.path ? ` (${item.path})` : ''}`
      ),
      '无'
    )
  );
  for (const item of context.apiContracts.interfaces) {
    lines.push('', `## ${item.name}`);
    lines.push('', `- 类型: ${item.interfaceType}`);
    lines.push(`- 处理入口: ${item.handler}`);
    if (item.method) lines.push(`- 请求方法: ${item.method}`);
    if (item.path) lines.push(`- 接口路径: ${item.path}`);
    lines.push(...renderSubsection('请求规范', item.request, '无'));
    lines.push(...renderSubsection('响应规范', item.response, '无'));
    lines.push(...renderSubsection('鉴权要求', item.auth, '无'));
    lines.push(...renderSubsection('错误语义', item.errors ?? [], '无'));
    lines.push(...renderSubsection('证据', item.evidence, '无'));
  }
  return lines.join('\n');
}

function renderCodebaseOverviewDoc(context: ProjectionContext): string {
  const lines = renderDocHeader('代码库总览', ['.spec-first/runtime/first/structure-overview.json']);
  lines.push(...renderSection('结构拓扑', context.structureOverview.topology, '无'));
  for (const module of context.structureOverview.modules) {
    lines.push('', `## ${module.name}`);
    lines.push('', `- 作用: ${module.purpose}`);
    lines.push(...renderSubsection('关键路径', module.keyPaths, '无'));
    lines.push(...renderSubsection('入口点', module.entryPoints, '无'));
    lines.push(...renderSubsection('依赖', module.dependencies ?? [], '无'));
  }
  lines.push(...renderSection('建议阅读顺序', context.structureOverview.readingOrder, '无'));
  lines.push(...renderSection('证据', context.structureOverview.evidence, '无'));
  return lines.join('\n');
}

function renderDomainModelDoc(context: ProjectionContext): string {
  const lines = renderDocHeader('领域模型', ['.spec-first/runtime/first/domain-model.json']);
  for (const entity of context.domainModel.entities) {
    lines.push('', `## ${entity.name}`);
    lines.push('', `- 类型: ${entity.kind}`);
    lines.push(`- 描述: ${entity.description}`);
    lines.push(...renderSubsection('不变量', entity.invariants, '无'));
    lines.push(...renderSubsection('关系', entity.relationships, '无'));
    lines.push(...renderSubsection('证据', entity.evidence, '无'));
  }
  lines.push(...renderSection('术语表', context.domainModel.glossary, '无'));
  lines.push(...renderSection('证据', context.domainModel.evidence, '无'));
  return lines.join('\n');
}

function renderArchitectureDoc(context: ProjectionContext): string {
  return [
    ...renderDocHeader('架构总览', [
      '.spec-first/runtime/first/structure-overview.json',
      '.spec-first/runtime/first/steering.json',
      '.spec-first/runtime/first/critical-flows.json',
    ]),
    '',
    ...renderSection('系统概览', context.structureOverview.topology, '无'),
    ...renderSection('技术边界', context.steering.tech.constraints, '无'),
    ...renderSection('结构边界', context.steering.structure.boundaries, '无'),
    ...renderSection(
      '关键协作关系',
      context.criticalFlows.map((flow) => `${flow.name} -> ${flow.coreModules.join(' / ')}`),
      '无'
    ),
    ...renderSection('架构风险', context.steering.tech.forbiddenPatterns, '无'),
  ].join('\n');
}

function renderCallGraphDoc(context: ProjectionContext): string {
  const lines = renderDocHeader('调用链路', [
    '.spec-first/runtime/first/critical-flows.json',
    '.spec-first/runtime/first/structure-overview.json',
  ]);
  lines.push(
    ...renderSection(
      '入口清单',
      Array.from(new Set(context.criticalFlows.flatMap((flow) => flow.entryPoints))),
      '无'
    )
  );
  for (const flow of context.criticalFlows) {
    lines.push('', `## ${flow.name}`);
    lines.push(...renderSubsection('入口点', flow.entryPoints, '无'));
    lines.push(...renderSubsection('核心模块', flow.coreModules, '无'));
    lines.push(...renderSubsection('验证钩子', flow.verificationHooks, '无'));
    lines.push(...renderSubsection('高风险扩散点', flow.invariants, '无'));
  }
  return lines.join('\n');
}

function renderExternalDepsDoc(context: ProjectionContext): string {
  const thirdPartyDeps = context.techStack.filter((item) =>
    /runtime:|package-manager:|testing:|build:/i.test(item)
  );
  return [
    ...renderDocHeader('外部依赖', [
      '.spec-first/runtime/first/api-contracts.json',
      '.spec-first/runtime/first/summary.json',
      '.spec-first/runtime/first/steering.json',
      '.spec-first/runtime/first/conventions.json',
    ]),
    '',
    ...renderSection('第三方依赖', thirdPartyDeps, '无'),
    ...renderSection('外部服务', context.apiContracts.integrationPoints, '无'),
    ...renderSection('风险提示', uniqueStrings(context.summary.risks, context.steering.tech.forbiddenPatterns), '无'),
    ...renderSection('证据', context.summary.evidence, '无'),
  ].join('\n');
}

function renderDevelopmentGuidelinesDoc(context: ProjectionContext): string {
  const runtimeRequirements = context.steering.tech.stack.filter((item) =>
    /runtime:|language:|package-manager:|build:/i.test(item)
  );
  const packageManager =
    context.steering.tech.stack.find((item) => item.toLowerCase().includes('package-manager:')) ??
    '[待确认] package-manager';
  const installCommands =
    packageManager.includes('pnpm')
      ? ['pnpm install']
      : packageManager.includes('yarn')
        ? ['yarn install']
        : packageManager.includes('npm')
          ? ['npm install']
          : ['[待确认] 安装命令'];
  const startupCommands = context.entryGuide
    .flatMap((entry) => entry.thenRead)
    .filter((item) => /src\/|spec-first\s+/i.test(item));

  return [
    ...renderDocHeader('开发规范', ['.spec-first/runtime/first/conventions.json']),
    '',
    '## API 规范',
    ...renderSubsection('观察到的模式', context.conventions.api.observedPatterns, '无'),
    ...renderSubsection('偏差', context.conventions.api.deviations, '无'),
    '',
    `- 推荐规则: ${context.conventions.api.recommendedConvention}`,
    ...renderSubsection('证据', context.conventions.api.evidence, '无'),
    '',
    '## 模块规范',
    ...renderSubsection('观察到的模式', context.conventions.module.observedPatterns, '无'),
    ...renderSubsection('偏差', context.conventions.module.deviations, '无'),
    '',
    `- 推荐规则: ${context.conventions.module.recommendedConvention}`,
    ...renderSubsection('证据', context.conventions.module.evidence, '无'),
    '',
    '## 测试规范',
    ...renderSubsection('观察到的模式', context.conventions.testing.observedPatterns, '无'),
    ...renderSubsection('偏差', context.conventions.testing.deviations, '无'),
    '',
    `- 推荐规则: ${context.conventions.testing.recommendedConvention}`,
    ...renderSubsection('证据', context.conventions.testing.evidence, '无'),
    '',
    '## 项目规范',
    ...renderSubsection('观察到的模式', context.conventions.projectRules.observedPatterns, '无'),
    ...renderSubsection('偏差', context.conventions.projectRules.deviations, '无'),
    '',
    `- 推荐规则: ${context.conventions.projectRules.recommendedConvention}`,
    ...renderSubsection('证据', context.conventions.projectRules.evidence, '无'),
    '',
    '## 本地环境配置',
    ...renderSubsection('环境要求', runtimeRequirements, '[待确认]'),
    ...renderSubsection('安装步骤', installCommands, '[待确认]'),
    ...renderSubsection(
      '启动步骤',
      startupCommands.length > 0 ? startupCommands : ['[待确认] 启动命令'],
      '[待确认]'
    ),
    ...renderSubsection('优先阅读', context.entryGuide.flatMap((entry) => entry.readFirst), '无'),
  ].join('\n');
}

function renderDatabaseErDoc(context: ProjectionContext): string {
  if (!context.databaseSchema || context.databaseSchema.status !== 'healthy') {
    return [
      ...renderDocHeader('数据库 ER', ['.spec-first/runtime/first/database-schema.json']),
      '',
      '- 当前项目不适用数据库 ER 视图。',
    ].join('\n');
  }

  const lines = [
    ...renderDocHeader('数据库 ER', ['.spec-first/runtime/first/database-schema.json']),
    '',
    `- Provider: ${context.databaseSchema.provider ?? 'unknown'}`,
  ];
  for (const table of context.databaseSchema.tables) {
    lines.push('', `## ${table.name}`);
    if (table.purpose) lines.push('', `- 用途: ${table.purpose}`);
    lines.push(...renderSubsection('字段', table.fields, '无'));
    lines.push(...renderSubsection('关系', table.relations, '无'));
    lines.push(...renderSubsection('证据', table.evidence, '无'));
  }
  lines.push(...renderSection('风险', context.databaseSchema.risks, '无'));
  return lines.join('\n');
}

function renderSteeringDoc(context: ProjectionContext): string {
  return [
    ...renderDocHeader('项目导向与边界', ['.spec-first/runtime/first/steering.json']),
    '',
    '## 项目导向',
    `- 概述: ${context.steering.product.overview}`,
    ...renderSubsection('核心场景', context.steering.product.coreScenarios),
    ...renderSubsection('非目标', context.steering.product.nonGoals),
    ...renderSubsection('术语表', context.steering.product.glossary),
    ...renderSection('技术约束', uniqueStrings(context.steering.tech.stack, context.steering.tech.constraints), '无'),
    ...renderSection('结构边界', uniqueStrings(context.steering.structure.modules, context.steering.structure.boundaries, context.steering.structure.entryRules), '无'),
    ...renderSection(
      '权威顺序',
      [
        '.spec-first/runtime/first/*.json -> docs/first/*.md',
        'runtime truth 优先于 docs outputs',
        '未注册 docs 不参与 canonical truth',
      ],
      '无'
    ),
  ].join('\n');
}

function renderConventionsDoc(context: ProjectionContext): string {
  return [
    ...renderDocHeader('项目规范', ['.spec-first/runtime/first/conventions.json']),
    '',
    '## API 规范',
    ...renderSubsection('观察到的模式', context.conventions.api.observedPatterns),
    ...renderSubsection('偏差', context.conventions.api.deviations, '无'),
    '',
    `- 推荐规则: ${context.conventions.api.recommendedConvention}`,
    ...renderSubsection('证据', context.conventions.api.evidence),
    '',
    '## 代码规范',
    ...renderSubsection('观察到的模式', context.conventions.module.observedPatterns),
    ...renderSubsection('偏差', context.conventions.module.deviations, '无'),
    '',
    `- 推荐规则: ${context.conventions.module.recommendedConvention}`,
    ...renderSubsection('证据', context.conventions.module.evidence),
    '',
    '## 测试规范',
    ...renderSubsection('观察到的模式', context.conventions.testing.observedPatterns),
    ...renderSubsection('偏差', context.conventions.testing.deviations, '无'),
    '',
    `- 推荐规则: ${context.conventions.testing.recommendedConvention}`,
    ...renderSubsection('证据', context.conventions.testing.evidence),
    '',
    '## 交付约束',
    `- 推荐规则: ${context.conventions.projectRules.recommendedConvention}`,
    ...renderSubsection('证据', context.conventions.projectRules.evidence),
  ].join('\n');
}

function renderCriticalFlowsDoc(context: ProjectionContext): string {
  const lines = renderDocHeader('关键流', ['.spec-first/runtime/first/critical-flows.json']);

  for (const flow of context.criticalFlows) {
    lines.push('', `## ${flow.name}`, '', `- 流程标识: ${flow.flowId}`);
    lines.push(...renderSubsection('核心流程', flow.entryPoints));
    lines.push(...renderSubsection('不可轻易破坏路径', flow.coreModules));
    lines.push(...renderSubsection('风险点', flow.invariants));
    lines.push(...renderSubsection('验证钩子', flow.verificationHooks));
  }

  return lines.join('\n');
}

function renderEntryGuideDoc(context: ProjectionContext): string {
  const lines = renderDocHeader('新手入口指南', ['.spec-first/runtime/first/entry-guide.json']);

  for (const entry of context.entryGuide) {
    lines.push('', `## ${entry.taskCategory}`);
    lines.push(...renderSubsection('从哪里开始', entry.readFirst));
    lines.push(...renderSubsection('先改什么', entry.thenRead, '无'));
    lines.push(...renderSubsection('避免误入', entry.avoidEntry, '无'));
    lines.push(...renderSubsection('关联关键流', entry.relatedFlows, '无'));
  }

  return lines.join('\n');
}

function renderGenericProjectedDoc(docPath: string, context: ProjectionContext): string {
  const fileName = docPath.split('/').at(-1) ?? 'first-doc';

  return [
    ...renderDocHeader(fileName, ['.spec-first/runtime/first/index.json']),
    '',
    `- project: ${context.summary.project.name}`,
    `- generatedAt: ${context.summary.generatedAt}`,
    '- projection: runtime-derived document',
    '- canonical-docs:',
    '  - docs/first/summary.md',
    '  - docs/first/architecture.md',
    '  - docs/first/development-guidelines.md',
    '',
    '## 说明',
    '- This document is projected from the current first runtime assets.',
    '- Prefer canonical docs for detailed review and project-level cognition decisions.',
  ].join('\n');
}

export function renderProjectedDoc(docPath: string, context: ProjectionContext): string {
  if (docPath.endsWith('README.md')) {
    return renderOverviewDoc(context);
  }
  if (docPath.endsWith('summary.md')) {
    return renderSummaryDoc(context);
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
  if (docPath.endsWith('entry-guide.md')) {
    return renderEntryGuideDoc(context);
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
