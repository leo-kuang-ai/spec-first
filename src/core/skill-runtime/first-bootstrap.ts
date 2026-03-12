import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { sha256Hex } from '../../shared/crypto-utils.js';
import { FIRST_RUNTIME_ARTIFACTS } from './first-artifact-mapping.js';
import { refreshFirstDocsFromRuntime } from './first-doc-projection.js';
import type { PlatformType } from './first-args.js';
import { detectPlatformType, classifyProjectMaturity } from './first-platform-detector.js';
import { buildRoleViews } from './first-role-views.js';
import {
  getFirstRoleViewsPath,
  getFirstRuntimeSummaryPath,
  getFirstStageViewsPath,
  writeFirstRoleViews,
  writeFirstRuntimeIndex,
  writeFirstRuntimeSummary,
  writeFirstStageViews,
} from './first-runtime-store.js';
import type {
  FirstRuntimeAssetIndexEntry,
  FirstRuntimeIndex,
  FirstRuntimeMode,
  FirstRuntimeSummary,
} from './first-runtime-types.js';
import { buildStageViews } from './first-stage-views.js';
import { buildFirstSummary } from './first-summary.js';

export interface BootstrapFirstRuntimeOptions {
  mode: FirstRuntimeMode;
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
    mode: options.mode,
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
  const now = new Date().toISOString();

  writeFirstRuntimeSummary(projectRoot, summary);
  writeFirstRoleViews(projectRoot, roleViews);
  writeFirstStageViews(projectRoot, stageViews);

  const initialIndex: FirstRuntimeIndex = {
    version: '1.0.0',
    lastRun: now,
    sourceCommit: getCurrentSourceCommit(projectRoot),
    mode: options.mode,
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
