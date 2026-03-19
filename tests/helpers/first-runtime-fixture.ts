import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  writeFirstApiContracts,
  writeFirstConventions,
  writeFirstCriticalFlows,
  writeFirstDatabaseSchema,
  writeFirstDocsIndex,
  writeFirstDomainModel,
  writeFirstEntryGuide,
  writeFirstRuntimeIndex,
  writeFirstRuntimeSummary,
  writeFirstSteering,
  writeFirstStructureOverview,
} from '../../src/core/skill-runtime/first-runtime-store.js';

function ensureDocsOutputs(projectRoot: string, projectName: string): void {
  const docsDir = join(projectRoot, 'docs', 'first');
  mkdirSync(docsDir, { recursive: true });

  writeFileSync(
    join(docsDir, 'README.md'),
    `# ${projectName}\n\n## 项目概览\n\n${projectName}\n`,
    'utf-8'
  );
  writeFileSync(join(docsDir, 'summary.md'), `## 项目是什么\n\n${projectName}\n`, 'utf-8');
  writeFileSync(join(docsDir, 'steering.md'), '## Steering\n\nruntime truth first\n', 'utf-8');
  writeFileSync(join(docsDir, 'conventions.md'), '## 项目规范\n\nruntime truth first\n', 'utf-8');
  writeFileSync(join(docsDir, 'critical-flows.md'), '## Critical Flows\n\nflow-cli-entry\n', 'utf-8');
  writeFileSync(join(docsDir, 'entry-guide.md'), '## Entry Guide\n\nread runtime truth first\n', 'utf-8');
  writeFileSync(join(docsDir, 'api-docs.md'), '## API Docs\n\nspec-first\n', 'utf-8');
  writeFileSync(join(docsDir, 'codebase-overview.md'), '## Codebase Overview\n\nruntime truth first\n', 'utf-8');
  writeFileSync(join(docsDir, 'domain-model.md'), '## Domain Model\n\nFeature\n', 'utf-8');
  writeFileSync(join(docsDir, 'architecture.md'), '## Architecture\n\nruntime truth first\n', 'utf-8');
  writeFileSync(join(docsDir, 'call-graph.md'), '## Call Graph\n\nflow-cli-entry\n', 'utf-8');
  writeFileSync(join(docsDir, 'development-guidelines.md'), '## 开发规范\n\nruntime truth first\n', 'utf-8');
  writeFileSync(join(docsDir, 'external-deps.md'), '## External Deps\n\nNode.js\n', 'utf-8');
  writeFileSync(join(docsDir, 'database-er.md'), '## Database ER\n\nnot applicable\n', 'utf-8');
}

function ensureDocsIndex(projectRoot: string, projectName: string): void {
  writeFirstDocsIndex(projectRoot, {
    generatedAt: '2026-03-19T12:00:00.000Z',
    mode: 'deep',
    quickStart: [
      'docs/first/README.md',
      'docs/first/summary.md',
      'docs/first/entry-guide.md',
      'docs/first/codebase-overview.md',
    ],
    entries: [
      {
        path: 'docs/first/README.md',
        title: '项目认知输出总览',
        purpose: '快速导航 runtime 真源、docs 输出与阅读顺序。',
        relatedRuntimeAssets: ['.spec-first/runtime/first/index.json', '.spec-first/runtime/first/summary.json'],
        recommendedWhen: ['首次进入项目', '需要快速判断从哪些文档开始读'],
        priority: 'primary',
      },
      {
        path: 'docs/first/summary.md',
        title: '项目摘要',
        purpose: '提供项目名、平台、能力、入口与风险的高密度摘要。',
        relatedRuntimeAssets: ['.spec-first/runtime/first/summary.json'],
        recommendedWhen: ['需要快速建立项目背景', '需要确认项目范围和风险'],
        priority: 'primary',
      },
      {
        path: 'docs/first/entry-guide.md',
        title: '新手入口指南',
        purpose: '告诉后续 skill 或研发人员先读什么、后读什么、避免什么。',
        relatedRuntimeAssets: ['.spec-first/runtime/first/entry-guide.json'],
        recommendedWhen: ['需要建立阅读顺序', '需要快速找到某类任务的起点'],
        priority: 'primary',
      },
      {
        path: 'docs/first/codebase-overview.md',
        title: '代码库总览',
        purpose: '按模块和结构梳理项目整体骨架。',
        relatedRuntimeAssets: ['.spec-first/runtime/first/structure-overview.json'],
        recommendedWhen: ['需要定位模块归属', '需要了解代码库结构'],
        priority: 'primary',
      },
      {
        path: 'docs/first/steering.md',
        title: '项目导向与边界',
        purpose: '收敛产品目标、技术约束与结构边界。',
        relatedRuntimeAssets: ['.spec-first/runtime/first/steering.json'],
        recommendedWhen: ['需要确认项目边界', '需要识别不能做的事情'],
        priority: 'secondary',
      },
      {
        path: 'docs/first/conventions.md',
        title: '项目规范',
        purpose: '沉淀 API、模块、测试与交付约束。',
        relatedRuntimeAssets: ['.spec-first/runtime/first/conventions.json'],
        recommendedWhen: ['需要确认编码约束', '需要理解交付约束'],
        priority: 'secondary',
      },
      {
        path: 'docs/first/development-guidelines.md',
        title: '开发规范',
        purpose: '给研发人员提供本地环境、安装和启动指导。',
        relatedRuntimeAssets: ['.spec-first/runtime/first/conventions.json', '.spec-first/runtime/first/entry-guide.json'],
        recommendedWhen: ['需要本地开发指导', '需要确认运行命令'],
        priority: 'secondary',
      },
      {
        path: 'docs/first/critical-flows.md',
        title: '关键流',
        purpose: '描述必须保持稳定的主流程与验证钩子。',
        relatedRuntimeAssets: ['.spec-first/runtime/first/critical-flows.json'],
        recommendedWhen: ['需要分析主流程', '需要确认验证路径'],
        priority: 'secondary',
      },
      {
        path: 'docs/first/call-graph.md',
        title: '调用链路',
        purpose: '展开关键流的入口、模块和验证点。',
        relatedRuntimeAssets: ['.spec-first/runtime/first/critical-flows.json', '.spec-first/runtime/first/structure-overview.json'],
        recommendedWhen: ['需要追踪调用关系', '需要定位影响面'],
        priority: 'secondary',
      },
      {
        path: 'docs/first/api-docs.md',
        title: '接口文档',
        purpose: '列出可识别的接口、入口和约束。',
        relatedRuntimeAssets: ['.spec-first/runtime/first/api-contracts.json'],
        recommendedWhen: ['需要理解接口面', '需要确认 handler 与入参出参'],
        priority: 'secondary',
      },
      {
        path: 'docs/first/architecture.md',
        title: '架构总览',
        purpose: '从边界、协作关系和风险角度概览系统。',
        relatedRuntimeAssets: ['.spec-first/runtime/first/structure-overview.json', '.spec-first/runtime/first/steering.json', '.spec-first/runtime/first/critical-flows.json'],
        recommendedWhen: ['需要做设计评审', '需要理解系统边界和风险'],
        priority: 'secondary',
      },
      {
        path: 'docs/first/domain-model.md',
        title: '领域模型',
        purpose: '梳理核心概念、实体与关系。',
        relatedRuntimeAssets: ['.spec-first/runtime/first/domain-model.json'],
        recommendedWhen: ['需要确认领域术语', '需要理解核心实体'],
        priority: 'secondary',
      },
      {
        path: 'docs/first/external-deps.md',
        title: '外部依赖',
        purpose: '说明外部依赖、服务和风险提示。',
        relatedRuntimeAssets: ['.spec-first/runtime/first/api-contracts.json', '.spec-first/runtime/first/summary.json', '.spec-first/runtime/first/steering.json', '.spec-first/runtime/first/conventions.json'],
        recommendedWhen: ['需要排查外部依赖', '需要识别集成风险'],
        priority: 'optional',
      },
      {
        path: 'docs/first/database-er.md',
        title: '数据库 ER',
        purpose: '仅在数据库配置健康时提供关系图阅读入口。',
        relatedRuntimeAssets: ['.spec-first/runtime/first/database-schema.json'],
        recommendedWhen: ['需要理解数据库结构', '数据库 schema 健康时'],
        priority: 'optional',
      },
    ],
    notes: [
      'docs/first/ 是给研发人员阅读的输出层，不参与 machine truth。',
      `项目: ${projectName}`,
    ],
  });
}

export function seedFirstRuntimeOutputs(projectRoot: string, projectName = 'runtime-first'): void {
  mkdirSync(join(projectRoot, '.spec-first', 'runtime', 'first'), { recursive: true });
  mkdirSync(join(projectRoot, 'docs', 'first'), { recursive: true });

  writeFirstRuntimeSummary(projectRoot, {
    generatedAt: '2026-03-19T12:00:00.000Z',
    mode: 'deep',
    project: { name: projectName, platformType: 'backend', overview: 'runtime payload' },
    techStack: ['runtime: Node.js >=20.0.0'],
    modules: ['src/from-runtime'],
    capabilities: ['runtime truth source'],
    entryPoints: ['src/runtime.ts'],
    dataModels: ['Feature'],
    apiSurface: ['CLI: spec-first'],
    risks: [],
    evidence: ['runtime'],
  });
  writeFirstSteering(projectRoot, {
    product: { overview: 'runtime payload', coreScenarios: ['runtime first'], nonGoals: [], glossary: ['Feature'] },
    tech: { stack: ['runtime: Node.js >=20.0.0'], constraints: [], forbiddenPatterns: ['docs-only truth'] },
    structure: { modules: ['src/from-runtime'], boundaries: ['src/runtime.ts'], entryRules: ['read runtime truth first'] },
  });
  writeFirstConventions(projectRoot, {
    api: { observedPatterns: [], deviations: [], recommendedConvention: 'Use runtime truth first.', evidence: ['runtime'] },
    module: { observedPatterns: [], deviations: [], recommendedConvention: 'Use runtime truth first.', evidence: ['runtime'] },
    testing: { observedPatterns: [], deviations: [], recommendedConvention: 'Use Vitest.', evidence: ['runtime'] },
    projectRules: { observedPatterns: [], deviations: [], recommendedConvention: 'Read runtime truth first.', evidence: ['runtime'] },
  });
  writeFirstCriticalFlows(projectRoot, [
    {
      flowId: 'flow-runtime',
      name: 'Runtime Flow',
      entryPoints: ['src/runtime.ts'],
      coreModules: ['src/from-runtime'],
      invariants: ['runtime truth first'],
      verificationHooks: ['pnpm vitest'],
    },
  ]);
  writeFirstEntryGuide(projectRoot, [
    {
      taskCategory: 'runtime-extension',
      readFirst: ['.spec-first/runtime/first/summary.json', '.spec-first/runtime/first/steering.json'],
      thenRead: ['src/core/skill-runtime/first-runtime-store.ts'],
      avoidEntry: ['docs/first/summary.md'],
      relatedFlows: ['flow-runtime'],
    },
  ]);
  writeFirstApiContracts(projectRoot, {
    interfaces: [
      {
        interfaceType: 'cli-command',
        name: 'spec-first',
        path: 'spec-first',
        method: 'run',
        handler: 'src/cli/index.ts',
        request: [],
        response: ['runtime truth source'],
        auth: [],
        errors: [],
        evidence: ['runtime'],
      },
    ],
    integrationPoints: ['src/cli/index.ts'],
    notes: [],
  });
  writeFirstStructureOverview(projectRoot, {
    topology: ['entry -> modules -> runtime truth'],
    modules: [
      {
        name: 'skill-runtime',
        purpose: 'runtime truth source',
        keyPaths: ['src/core/skill-runtime'],
        entryPoints: ['src/cli/index.ts'],
        dependencies: [],
      },
    ],
    readingOrder: ['src/cli/index.ts', 'src/core/skill-runtime'],
    evidence: ['runtime'],
  });
  writeFirstDomainModel(projectRoot, {
    entities: [
      {
        name: 'Feature',
        kind: 'concept',
        description: 'runtime entity',
        invariants: ['runtime truth first'],
        relationships: ['关联 CLI: spec-first'],
        evidence: ['runtime'],
      },
    ],
    glossary: ['Feature'],
    evidence: ['runtime'],
  });
  writeFirstDatabaseSchema(projectRoot, {
    status: 'not_applicable',
    tables: [],
    risks: [],
    evidence: [],
  });
  writeFirstRuntimeIndex(projectRoot, {
    version: '1.0.0',
    lastRun: '2026-03-19T12:00:00.000Z',
    summary: {
      path: '.spec-first/runtime/first/summary.json',
      fileHash: 'runtime-summary',
      lastUpdated: '2026-03-19T12:00:00.000Z',
      healthy: true,
    },
    steering: {
      path: '.spec-first/runtime/first/steering.json',
      fileHash: 'runtime-steering',
      lastUpdated: '2026-03-19T12:00:00.000Z',
      healthy: true,
    },
    conventions: {
      path: '.spec-first/runtime/first/conventions.json',
      fileHash: 'runtime-conventions',
      lastUpdated: '2026-03-19T12:00:00.000Z',
      healthy: true,
    },
    criticalFlows: {
      path: '.spec-first/runtime/first/critical-flows.json',
      fileHash: 'runtime-critical-flows',
      lastUpdated: '2026-03-19T12:00:00.000Z',
      healthy: true,
    },
    entryGuide: {
      path: '.spec-first/runtime/first/entry-guide.json',
      fileHash: 'runtime-entry-guide',
      lastUpdated: '2026-03-19T12:00:00.000Z',
      healthy: true,
    },
    apiContracts: {
      path: '.spec-first/runtime/first/api-contracts.json',
      fileHash: 'runtime-api-contracts',
      lastUpdated: '2026-03-19T12:00:00.000Z',
      healthy: true,
    },
    structureOverview: {
      path: '.spec-first/runtime/first/structure-overview.json',
      fileHash: 'runtime-structure-overview',
      lastUpdated: '2026-03-19T12:00:00.000Z',
      healthy: true,
    },
    domainModel: {
      path: '.spec-first/runtime/first/domain-model.json',
      fileHash: 'runtime-domain-model',
      lastUpdated: '2026-03-19T12:00:00.000Z',
      healthy: true,
    },
    databaseSchema: {
      path: '.spec-first/runtime/first/database-schema.json',
      fileHash: 'runtime-database-schema',
      lastUpdated: '2026-03-19T12:00:00.000Z',
      healthy: false,
      status: 'not_applicable',
    },
    docsProjection: {
      'docs/first/README.md': {
        path: 'docs/first/README.md',
        fileHash: 'docs-readme',
        lastUpdated: '2026-03-19T12:00:00.000Z',
        healthy: true,
      },
    },
    status: 'current',
  });

  ensureDocsOutputs(projectRoot, projectName);
  ensureDocsIndex(projectRoot, projectName);
}
