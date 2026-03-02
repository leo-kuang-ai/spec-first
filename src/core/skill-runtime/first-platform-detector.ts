/**
 * First Skill 端类型检测与项目成熟度识别（Phase 2）
 *
 * 目标：
 * - 提供可复用的端类型检测（backend/frontend/mobile/cross-platform/desktop/monorepo/mixed）
 * - 提供 Greenfield/Brownfield 判定，支撑首跑提示策略
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { PlatformType } from './first-args.js';

export type DetectedPlatformType = PlatformType | 'unknown';
export type ProjectMaturity = 'greenfield' | 'brownfield';

export interface PlatformDetectionResult {
  type: DetectedPlatformType;
  subType?: string;
  evidence: string[];
}

const MONOREPO_MARKERS = [
  'turbo.json',
  'nx.json',
  'lerna.json',
  'pnpm-workspace.yaml',
];

const BACKEND_MARKERS = [
  'pom.xml',
  'build.gradle',
  'build.gradle.kts',
  'go.mod',
  'requirements.txt',
  'pyproject.toml',
  'setup.py',
  'Cargo.toml',
  'composer.json',
  'Gemfile',
];

const FRONTEND_FRAMEWORKS = ['react', 'vue', 'angular', 'svelte', 'next', 'nuxt'];
const ADMIN_LIBS = ['antd', 'ant-design', 'element-plus', 'arco-design', '@alifd/next'];
const H5_LIBS = ['vant', 'nutui', 'mint-ui', 'vux'];
const BACKEND_JS_LIBS = ['express', 'koa', 'fastify', '@nestjs/core', 'hono'];
const CROSS_PLATFORM_LIBS = ['react-native', 'electron'];

const IGNORE_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.next',
  '.nuxt',
  '.turbo',
  'coverage',
  'vendor',
  'target',
]);

function readPackageJson(projectRoot: string): Record<string, unknown> | undefined {
  const packageJsonPath = join(projectRoot, 'package.json');
  if (!existsSync(packageJsonPath)) return undefined;
  try {
    return JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function mergePackageDeps(pkg?: Record<string, unknown>): Record<string, string> {
  if (!pkg) return {};
  const keys = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
  const merged: Record<string, string> = {};
  for (const key of keys) {
    const value = pkg[key];
    if (value && typeof value === 'object') {
      Object.assign(merged, value as Record<string, string>);
    }
  }
  return merged;
}

function hasAnyDependency(deps: Record<string, string>, names: string[]): boolean {
  return names.some(name => name in deps);
}

function hasAnyMarker(projectRoot: string, markers: string[]): string | undefined {
  for (const marker of markers) {
    if (existsSync(join(projectRoot, marker))) return marker;
  }
  return undefined;
}

function scanFiles(
  root: string,
  predicate: (name: string) => boolean,
  maxDepth: number = 4,
): string | undefined {
  const stack: Array<{ dir: string; depth: number }> = [{ dir: root, depth: 0 }];

  while (stack.length > 0) {
    const current = stack.pop()!;
    let entries: Array<{ name: string; isDirectory: () => boolean }>;
    try {
      entries = readdirSync(current.dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (predicate(entry.name)) {
        return join(current.dir, entry.name);
      }

      if (!entry.isDirectory() || current.depth >= maxDepth) continue;
      if (IGNORE_DIRS.has(entry.name)) continue;
      stack.push({ dir: join(current.dir, entry.name), depth: current.depth + 1 });
    }
  }

  return undefined;
}

function countCodeFiles(projectRoot: string, maxDepth: number = 4, stopAt: number = 60): number {
  const codeExt = new Set([
    '.ts', '.tsx', '.js', '.jsx', '.java', '.kt', '.go', '.py', '.rs', '.php', '.rb',
    '.swift', '.dart', '.cs', '.c', '.cc', '.cpp', '.h', '.hpp',
  ]);
  let count = 0;
  const stack: Array<{ dir: string; depth: number }> = [{ dir: projectRoot, depth: 0 }];

  while (stack.length > 0) {
    const current = stack.pop()!;
    let entries: Array<{ name: string; isDirectory: () => boolean }>;
    try {
      entries = readdirSync(current.dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (current.depth < maxDepth && !IGNORE_DIRS.has(entry.name)) {
          stack.push({ dir: join(current.dir, entry.name), depth: current.depth + 1 });
        }
        continue;
      }

      const dot = entry.name.lastIndexOf('.');
      if (dot < 0) continue;
      const ext = entry.name.slice(dot);
      if (codeExt.has(ext)) {
        count += 1;
        if (count >= stopAt) return count;
      }
    }
  }

  return count;
}

function getGitCommitCount(projectRoot: string): number | undefined {
  if (!existsSync(join(projectRoot, '.git'))) return undefined;
  try {
    const output = execFileSync('git', ['rev-list', '--count', 'HEAD'], {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 5_000,
    }).trim();
    const count = Number.parseInt(output, 10);
    return Number.isNaN(count) ? undefined : count;
  } catch {
    return undefined;
  }
}

export function classifyProjectMaturity(projectRoot: string): ProjectMaturity {
  const codeFileCount = countCodeFiles(projectRoot);
  if (codeFileCount > 50) return 'brownfield';

  const gitCommits = getGitCommitCount(projectRoot);
  if (gitCommits !== undefined && gitCommits > 10) return 'brownfield';

  const hasPackageManager = Boolean(
    hasAnyMarker(projectRoot, [
      'package.json', 'pom.xml', 'build.gradle', 'build.gradle.kts', 'go.mod',
      'requirements.txt', 'pyproject.toml', 'Cargo.toml', 'composer.json', 'Gemfile',
    ]),
  );
  const hasDepsInstalled = existsSync(join(projectRoot, 'node_modules'))
    || existsSync(join(projectRoot, 'venv'))
    || existsSync(join(projectRoot, '.venv'))
    || existsSync(join(projectRoot, 'target'));
  if (hasPackageManager && hasDepsInstalled) return 'brownfield';

  let rootEntries: Array<{ name: string; isDirectory: () => boolean }>;
  try {
    rootEntries = readdirSync(projectRoot, { withFileTypes: true });
  } catch {
    return 'brownfield';
  }

  const visibleEntries = rootEntries.filter(entry => !entry.name.startsWith('.'));
  if (visibleEntries.length === 0) return 'greenfield';
  if (
    visibleEntries.length === 1
    && !visibleEntries[0].isDirectory()
    && visibleEntries[0].name.toLowerCase().startsWith('readme')
  ) {
    return 'greenfield';
  }

  return 'brownfield';
}

export function detectPlatformType(projectRoot: string): PlatformDetectionResult {
  const evidence: string[] = [];
  const pkg = readPackageJson(projectRoot);
  const deps = mergePackageDeps(pkg);

  const monorepoMarker = hasAnyMarker(projectRoot, MONOREPO_MARKERS);
  const hasWorkspaceField = Boolean(pkg && Array.isArray(pkg.workspaces));
  if (monorepoMarker || hasWorkspaceField) {
    if (monorepoMarker) evidence.push(monorepoMarker);
    if (hasWorkspaceField) evidence.push('package.json#workspaces');
    return { type: 'monorepo', evidence };
  }

  const backendMarker = hasAnyMarker(projectRoot, BACKEND_MARKERS);
  const hasBackendJs = hasAnyDependency(deps, BACKEND_JS_LIBS);
  const hasBackend = Boolean(backendMarker || hasBackendJs);
  if (backendMarker) evidence.push(backendMarker);
  if (hasBackendJs) evidence.push('package.json#backend-deps');

  const hasFrontendFramework = hasAnyDependency(deps, FRONTEND_FRAMEWORKS);
  const hasFrontendStructure = existsSync(join(projectRoot, 'src')) && existsSync(join(projectRoot, 'index.html'));
  const hasFrontend = hasFrontendFramework || hasFrontendStructure;
  if (hasFrontendFramework) evidence.push('package.json#frontend-framework');
  if (hasFrontendStructure) evidence.push('src/ + index.html');

  if (hasBackend && hasFrontend) {
    return { type: 'mixed', evidence };
  }

  if (hasBackend) {
    return { type: 'backend', evidence };
  }

  if (hasFrontend) {
    const isAdmin = hasAnyDependency(deps, ADMIN_LIBS);
    const isH5 = hasAnyDependency(deps, H5_LIBS);
    const subType = isAdmin ? 'admin' : isH5 ? 'h5' : 'general';
    if (isAdmin) evidence.push('package.json#admin-ui');
    if (isH5) evidence.push('package.json#h5-ui');
    return { type: 'frontend', subType, evidence };
  }

  const androidMarker = scanFiles(projectRoot, name => name === 'AndroidManifest.xml');
  const iosMarker = scanFiles(
    projectRoot,
    name => name.endsWith('.xcodeproj') || name.endsWith('.xcworkspace') || name === 'Podfile',
  );
  if (androidMarker || iosMarker) {
    if (androidMarker) evidence.push('AndroidManifest.xml');
    if (iosMarker) evidence.push('*.xcodeproj/*.xcworkspace/Podfile');
    const subType = androidMarker && iosMarker ? 'ios+android' : androidMarker ? 'android' : 'ios';
    return { type: 'mobile', subType, evidence };
  }

  const crossByFile = hasAnyMarker(projectRoot, ['pubspec.yaml', 'tauri.conf.json']);
  const hasCrossDeps = hasAnyDependency(deps, CROSS_PLATFORM_LIBS);
  if (crossByFile || hasCrossDeps) {
    if (crossByFile) evidence.push(crossByFile);
    if (hasCrossDeps) evidence.push('package.json#cross-platform-deps');
    return { type: 'cross-platform', evidence };
  }

  const desktopByFile = scanFiles(
    projectRoot,
    name => name.endsWith('.sln') || name.endsWith('.csproj') || name === 'CMakeLists.txt',
  );
  if (desktopByFile) {
    evidence.push('desktop-marker');
    return { type: 'desktop', evidence };
  }

  return { type: 'unknown', evidence };
}
