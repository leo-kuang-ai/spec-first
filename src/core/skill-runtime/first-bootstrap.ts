import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { sha256Hex } from '../../shared/crypto-utils.js';
import { FIRST_RUNTIME_ARTIFACTS } from './first-artifact-mapping.js';
import { refreshFirstDocsFromRuntime } from './first-doc-projection.js';
import type { FirstMode, PlatformType } from './first-args.js';
import { detectPlatformType, classifyProjectMaturity } from './first-platform-detector.js';
import { buildRoleViews } from './first-role-views.js';
import { buildFirstConventions } from './first-conventions.js';
import { buildFirstChangeMap } from './first-change-map.js';
import { buildFirstCriticalFlows } from './first-critical-flows.js';
import { buildFirstEntryGuide } from './first-entry-guide.js';
import { buildFirstRebootGuide } from './first-reboot-guide.js';
import {
  getFirstChangeMapPath,
  getFirstConventionsPath,
  getFirstCriticalFlowsPath,
  getFirstEntryGuidePath,
  getFirstApiContractsPath,
  getFirstStructureOverviewPath,
  getFirstDomainModelPath,
  getFirstDatabaseSchemaPath,
  getFirstRebootGuidePath,
  getFirstRoleViewsPath,
  getFirstRuntimeSummaryPath,
  getFirstSteeringPath,
  getFirstStageViewsPath,
  writeFirstApiContracts,
  writeFirstDatabaseSchema,
  writeFirstDomainModel,
  writeFirstRoleViews,
  writeFirstRuntimeIndex,
  writeFirstRuntimeSummary,
  writeFirstStructureOverview,
  writeFirstConventions,
  writeFirstChangeMap,
  writeFirstCriticalFlows,
  writeFirstEntryGuide,
  writeFirstRebootGuide,
  writeFirstSteering,
  writeFirstStageViews,
} from './first-runtime-store.js';
import type {
  FirstApiContracts,
  FirstDatabaseSchema,
  FirstDomainModel,
  FirstSteering,
  FirstRuntimeAssetIndexEntry,
  FirstRuntimeIndex,
  FirstRuntimeSummary,
  FirstStructureOverview,
} from './first-runtime-types.js';
import { buildStageViews } from './first-stage-views.js';
import { buildFirstSummary } from './first-summary.js';

export interface BootstrapFirstRuntimeOptions {
  mode?: FirstMode;
  platformType?: PlatformType;
}

export interface BootstrapFirstRuntimeResult {
  summary: FirstRuntimeSummary;
  runtimeArtifacts: string[];
  docsProjections: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function uniqueStrings(...groups: Array<string[] | undefined>): string[] {
  return Array.from(new Set(groups.flatMap((group) => group ?? []).filter(Boolean)));
}

function readPackageJson(projectRoot: string): Record<string, unknown> | undefined {
  const path = join(projectRoot, 'package.json');
  if (!existsSync(path)) return undefined;

  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function readPackageBinPaths(pkg?: Record<string, unknown>): string[] {
  if (!pkg) return [];
  const bin = pkg.bin;
  if (typeof bin === 'string' && bin.trim() !== '') {
    return [bin];
  }
  if (!isRecord(bin)) return [];
  return Object.values(bin).filter(
    (value): value is string => typeof value === 'string' && value.trim().length > 0
  );
}

function readPackageBinNames(pkg?: Record<string, unknown>): string[] {
  if (!pkg) return [];
  const bin = pkg.bin;
  if (typeof bin === 'string' && typeof pkg.name === 'string' && pkg.name.trim() !== '') {
    return [pkg.name];
  }
  if (!isRecord(bin)) return [];
  return Object.keys(bin).filter((value) => value.trim().length > 0);
}

function detectTechStack(projectRoot: string, pkg?: Record<string, unknown>): string[] {
  const techStack: string[] = [];
  const engines = isRecord(pkg?.engines) ? pkg?.engines : undefined;
  const nodeVersion = typeof engines?.node === 'string' ? engines.node : undefined;

  if (nodeVersion) {
    techStack.push(`runtime: Node.js ${nodeVersion}`);
  }

  if (
    existsSync(join(projectRoot, 'tsconfig.json')) ||
    existsSync(join(projectRoot, 'tsconfig.base.json'))
  ) {
    techStack.push('language: TypeScript');
  } else if (pkg) {
    techStack.push('language: JavaScript');
  }

  const packageManager = typeof pkg?.packageManager === 'string' ? pkg.packageManager : undefined;
  if (
    packageManager?.startsWith('pnpm@') ||
    existsSync(join(projectRoot, 'pnpm-lock.yaml')) ||
    existsSync(join(projectRoot, 'pnpm-workspace.yaml'))
  ) {
    techStack.push('package-manager: pnpm');
  }

  const deps = isRecord(pkg?.dependencies) ? pkg.dependencies : {};
  const devDeps = isRecord(pkg?.devDependencies) ? pkg.devDependencies : {};
  const mergedDeps = { ...deps, ...devDeps };
  if ('vitest' in mergedDeps || existsSync(join(projectRoot, 'vitest.config.ts'))) {
    techStack.push('testing: Vitest');
  }
  if ('tsup' in mergedDeps) {
    techStack.push('build: tsup');
  }

  return uniqueStrings(techStack);
}

function detectModules(projectRoot: string): string[] {
  const srcRoot = join(projectRoot, 'src');
  if (existsSync(srcRoot)) {
    try {
      const modules = readdirSync(srcRoot, { withFileTypes: true })
        .filter((entry) => !entry.name.startsWith('.'))
        .map((entry) => `src/${entry.name}`)
        .sort();
      if (modules.length > 0) {
        return modules.slice(0, 8);
      }
    } catch {
      // ignore and fallback
    }
  }

  try {
    return readdirSync(projectRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .filter((entry) => !entry.name.startsWith('.'))
      .filter((entry) => !['node_modules', 'dist', 'coverage'].includes(entry.name))
      .map((entry) => entry.name)
      .sort()
      .slice(0, 8);
  } catch {
    return [];
  }
}

function detectEntryPoints(projectRoot: string, pkg?: Record<string, unknown>): string[] {
  const declaredEntryPoints = readPackageBinPaths(pkg);
  const existingEntryPoints = ['src/cli/index.ts', 'src/index.ts', 'index.ts', 'main.ts'].filter(
    (relativePath) => existsSync(join(projectRoot, relativePath))
  );

  return uniqueStrings(declaredEntryPoints, existingEntryPoints);
}

function detectApiSurface(pkg?: Record<string, unknown>): string[] {
  return readPackageBinNames(pkg).map((name) => `CLI: ${name}`);
}

function detectDataModels(projectRoot: string): string[] {
  const dataModels: string[] = [];
  if (existsSync(join(projectRoot, 'specs'))) {
    dataModels.push('Feature');
  }
  if (existsSync(join(projectRoot, '.spec-first'))) {
    dataModels.push('StageState');
  }
  return dataModels;
}

function detectCapabilities(pkg?: Record<string, unknown>): string[] {
  if (typeof pkg?.description === 'string' && pkg.description.trim() !== '') {
    return [pkg.description.trim()];
  }
  return readPackageBinNames(pkg).map((name) => `提供 ${name} CLI 能力`);
}

function detectEvidence(projectRoot: string, entryPoints: string[], modules: string[]): string[] {
  const priority = [
    'package.json',
    'pnpm-workspace.yaml',
    'tsconfig.json',
    'vitest.config.ts',
    ...entryPoints,
    ...modules,
  ];

  return Array.from(
    new Set(priority.filter((relativePath) => existsSync(join(projectRoot, relativePath))))
  ).slice(0, 8);
}

function detectOverview(projectRoot: string, pkg: Record<string, unknown> | undefined): string {
  if (typeof pkg?.description === 'string' && pkg.description.trim() !== '') {
    return pkg.description.trim();
  }

  const maturity = classifyProjectMaturity(projectRoot);
  return `${basename(projectRoot)} 项目认知摘要（${maturity}）`;
}

function resolvePlatformType(projectRoot: string, override?: PlatformType): string | undefined {
  if (override) return override;
  const detected = detectPlatformType(projectRoot);
  return detected.type === 'unknown' ? undefined : detected.type;
}

function detectRisks(projectRoot: string, platformType?: string): string[] {
  const risks: string[] = [];
  if (!platformType) {
    risks.push('项目端类型待确认');
  }
  if (classifyProjectMaturity(projectRoot) === 'greenfield') {
    risks.push('项目仍处于早期阶段，建议后续重新刷新 first 认知');
  }
  return risks;
}

function buildBootstrapSummary(
  projectRoot: string,
  options: BootstrapFirstRuntimeOptions
): FirstRuntimeSummary {
  const pkg = readPackageJson(projectRoot);
  const projectName =
    typeof pkg?.name === 'string' && pkg.name.trim() !== ''
      ? pkg.name.trim()
      : basename(projectRoot);
  const platformType = resolvePlatformType(projectRoot, options.platformType);
  const modules = detectModules(projectRoot);
  const entryPoints = detectEntryPoints(projectRoot, pkg);
  const apiSurface = detectApiSurface(pkg);
  const capabilities = detectCapabilities(pkg);
  const dataModels = detectDataModels(projectRoot);
  const techStack = detectTechStack(projectRoot, pkg);
  const risks = detectRisks(projectRoot, platformType);
  const evidence = detectEvidence(projectRoot, entryPoints, modules);

  return buildFirstSummary({
    generatedAt: new Date().toISOString(),
    mode: options.mode ?? 'deep',
    projectName,
    platformType,
    overview: detectOverview(projectRoot, pkg),
    techStack,
    modules,
    capabilities,
    entryPoints,
    dataModels,
    apiSurface,
    risks,
    evidence,
  });
}

function buildBootstrapSteering(summary: FirstRuntimeSummary): FirstSteering {
  return {
    product: {
      overview: summary.project.overview ?? `${summary.project.name} project cognition`,
      coreScenarios: summary.capabilities.slice(0, 3),
      nonGoals: ['unregistered docs as canonical truth'],
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

function buildBootstrapApiContracts(summary: FirstRuntimeSummary): FirstApiContracts {
  return {
    interfaces:
      summary.apiSurface.length > 0
        ? summary.apiSurface.map((surface, _index) => ({
            interfaceType: surface.startsWith('CLI:') ? 'cli-command' : 'other',
            name: surface.replace(/^CLI:\s*/, ''),
            path: surface.replace(/^CLI:\s*/, ''),
            method: 'run',
            handler: summary.entryPoints[0] ?? 'src/cli/commands/first.ts',
            request: [],
            response: ['更新 first runtime assets', '刷新 docs/first'],
            auth: [],
            evidence: uniqueStrings(summary.entryPoints, summary.evidence).slice(0, 6),
          }))
        : [
            {
              interfaceType: 'other',
              name: `${summary.project.name}-project-entry`,
              handler: summary.entryPoints[0] ?? 'src/index.ts',
              request: [],
              response: ['项目入口待进一步识别'],
              auth: [],
              evidence: summary.evidence.slice(0, 6),
            },
          ],
    integrationPoints: uniqueStrings(summary.entryPoints, summary.modules).slice(0, 8),
    notes: ['当前资产由 bootstrap 基于项目入口与命令面自动归纳'],
  };
}

function buildBootstrapStructureOverview(summary: FirstRuntimeSummary): FirstStructureOverview {
  return {
    topology: ['entry -> runtime assets -> docs projection'],
    modules: summary.modules.map((modulePath) => ({
      name: modulePath.split('/').at(-1) ?? modulePath,
      purpose: `${modulePath} 承载项目结构的一部分`,
      keyPaths: [modulePath],
      entryPoints: summary.entryPoints.filter((entryPoint) => entryPoint.startsWith(modulePath)),
      dependencies: summary.entryPoints.filter((entryPoint) => !entryPoint.startsWith(modulePath)),
    })),
    readingOrder: uniqueStrings(summary.entryPoints, summary.modules).slice(0, 10),
    evidence: summary.evidence,
  };
}

function buildBootstrapDomainModel(summary: FirstRuntimeSummary): FirstDomainModel {
  return {
    entities: summary.dataModels.map((modelName) => ({
      name: modelName,
      kind: 'concept',
      description: `${modelName} 是项目认知中的核心概念`,
      invariants: ['必须与 runtime truth 保持一致'],
      relationships: summary.apiSurface.slice(0, 3).map((surface) => `关联接口: ${surface}`),
      evidence: summary.evidence,
    })),
    glossary: uniqueStrings(summary.dataModels, summary.capabilities).slice(0, 10),
    evidence: summary.evidence,
  };
}

function buildBootstrapDatabaseSchema(projectRoot: string): FirstDatabaseSchema {
  const schemaPaths = ['prisma/schema.prisma', 'schema.prisma'].filter((relativePath) =>
    existsSync(join(projectRoot, relativePath))
  );

  if (schemaPaths.length === 0) {
    return {
      status: 'not_applicable',
      tables: [],
      risks: [],
      evidence: [],
    };
  }

  return {
    status: 'healthy',
    provider: 'prisma',
    tables: [
      {
        name: 'schema',
        purpose: '数据库结构入口',
        fields: [],
        relations: [],
        evidence: schemaPaths,
      },
    ],
    risks: [],
    evidence: schemaPaths,
  };
}

function buildIndexEntry(
  fullPath: string,
  relativePath: string,
  now: string
): FirstRuntimeAssetIndexEntry {
  const content = readFileSync(fullPath, 'utf-8');
  return {
    path: relativePath,
    fileHash: sha256Hex(content),
    lastUpdated: now,
    healthy: true,
  };
}

function getCurrentSourceCommit(projectRoot: string): string | undefined {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return undefined;
  }
}

export function bootstrapFirstRuntime(
  projectRoot: string,
  options: BootstrapFirstRuntimeOptions
): BootstrapFirstRuntimeResult {
  const summary = buildBootstrapSummary(projectRoot, options);
  const roleViews = buildRoleViews(summary);
  const stageViews = buildStageViews(summary);
  const steering = buildBootstrapSteering(summary);
  const apiContracts = buildBootstrapApiContracts(summary);
  const structureOverview = buildBootstrapStructureOverview(summary);
  const domainModel = buildBootstrapDomainModel(summary);
  const databaseSchema = buildBootstrapDatabaseSchema(projectRoot);
  const conventions = buildFirstConventions(summary);
  const criticalFlows = buildFirstCriticalFlows(summary);
  const changeMap = buildFirstChangeMap(summary);
  const entryGuide = buildFirstEntryGuide(summary);
  const rebootGuide = buildFirstRebootGuide(summary);
  const now = new Date().toISOString();

  writeFirstRuntimeSummary(projectRoot, summary);
  writeFirstApiContracts(projectRoot, apiContracts);
  writeFirstStructureOverview(projectRoot, structureOverview);
  writeFirstDomainModel(projectRoot, domainModel);
  writeFirstRoleViews(projectRoot, roleViews);
  writeFirstStageViews(projectRoot, stageViews);
  writeFirstSteering(projectRoot, steering);
  writeFirstConventions(projectRoot, conventions);
  writeFirstCriticalFlows(projectRoot, criticalFlows);
  writeFirstChangeMap(projectRoot, changeMap);
  writeFirstEntryGuide(projectRoot, entryGuide);
  writeFirstRebootGuide(projectRoot, rebootGuide);
  if (databaseSchema.status === 'healthy') {
    writeFirstDatabaseSchema(projectRoot, databaseSchema);
  }

  const initialIndex: FirstRuntimeIndex = {
    version: '1.0.0',
    lastRun: now,
    mode: summary.mode,
    sourceCommit: getCurrentSourceCommit(projectRoot),
    summary: buildIndexEntry(
      getFirstRuntimeSummaryPath(projectRoot),
      '.spec-first/runtime/first/summary.json',
      now
    ),
    roleViews: buildIndexEntry(
      getFirstRoleViewsPath(projectRoot),
      '.spec-first/runtime/first/role-views.json',
      now
    ),
    stageViews: buildIndexEntry(
      getFirstStageViewsPath(projectRoot),
      '.spec-first/runtime/first/stage-views.json',
      now
    ),
    steering: buildIndexEntry(
      getFirstSteeringPath(projectRoot),
      '.spec-first/runtime/first/steering.json',
      now
    ),
    conventions: buildIndexEntry(
      getFirstConventionsPath(projectRoot),
      '.spec-first/runtime/first/conventions.json',
      now
    ),
    criticalFlows: buildIndexEntry(
      getFirstCriticalFlowsPath(projectRoot),
      '.spec-first/runtime/first/critical-flows.json',
      now
    ),
    changeMap: buildIndexEntry(
      getFirstChangeMapPath(projectRoot),
      '.spec-first/runtime/first/change-map.json',
      now
    ),
    entryGuide: buildIndexEntry(
      getFirstEntryGuidePath(projectRoot),
      '.spec-first/runtime/first/entry-guide.json',
      now
    ),
    rebootGuide: buildIndexEntry(
      getFirstRebootGuidePath(projectRoot),
      '.spec-first/runtime/first/reboot-guide.json',
      now
    ),
    apiContracts: buildIndexEntry(
      getFirstApiContractsPath(projectRoot),
      '.spec-first/runtime/first/api-contracts.json',
      now
    ),
    structureOverview: buildIndexEntry(
      getFirstStructureOverviewPath(projectRoot),
      '.spec-first/runtime/first/structure-overview.json',
      now
    ),
    domainModel: buildIndexEntry(
      getFirstDomainModelPath(projectRoot),
      '.spec-first/runtime/first/domain-model.json',
      now
    ),
    databaseSchema: {
      ...(databaseSchema.status === 'healthy'
        ? buildIndexEntry(
            getFirstDatabaseSchemaPath(projectRoot),
            '.spec-first/runtime/first/database-schema.json',
            now
          )
        : {
            path: '.spec-first/runtime/first/database-schema.json',
            fileHash: 'conditional-not-applicable',
            lastUpdated: now,
            healthy: false,
            issues: undefined,
          }),
      healthy: databaseSchema.status === 'healthy',
      status: databaseSchema.status,
      issues:
        databaseSchema.status === 'healthy'
          ? undefined
          : ['database schema not applicable for current project'],
    },
    docsProjection: {},
    status: 'current',
  };
  writeFirstRuntimeIndex(projectRoot, initialIndex);

  const docsProjections = refreshFirstDocsFromRuntime(projectRoot, [...FIRST_RUNTIME_ARTIFACTS]);

  writeFirstRuntimeIndex(projectRoot, {
    ...initialIndex,
    docsProjection: Object.fromEntries(
      docsProjections.map((relativePath) => [
        relativePath,
        buildIndexEntry(join(projectRoot, relativePath), relativePath, now),
      ])
    ),
  });

  return {
    summary,
    runtimeArtifacts: [...FIRST_RUNTIME_ARTIFACTS],
    docsProjections,
  };
}
