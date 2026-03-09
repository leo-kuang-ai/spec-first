import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { handleFirst } from '../../src/cli/commands/first.js';
import {
  readFirstRuntimeIndex,
  readFirstRuntimeSummary,
  writeFirstRoleViews,
  writeFirstRuntimeIndex,
  writeFirstRuntimeSummary,
  writeFirstStageViews,
} from '../../src/core/skill-runtime/first-runtime-store.js';

const TMP = join(import.meta.dirname, '../fixtures/.tmp-first-command');
const origCwd = process.cwd;

function seedProject(): void {
  mkdirSync(join(TMP, 'src', 'cli'), { recursive: true });
  writeFileSync(
    join(TMP, 'package.json'),
    JSON.stringify({
      name: 'demo-first',
      description: 'Specification-driven development process engine',
      engines: { node: '>=20.0.0' },
      bin: { 'spec-first': 'dist/cli/index.js' },
      dependencies: { express: '^4.0.0' },
      devDependencies: { typescript: '^5.4.0', vitest: '^1.6.1', tsup: '^8.5.1' },
    }, null, 2),
    'utf-8',
  );
  writeFileSync(join(TMP, 'tsconfig.json'), JSON.stringify({ compilerOptions: { target: 'ES2022' } }, null, 2), 'utf-8');
  writeFileSync(join(TMP, 'vitest.config.ts'), 'export default {}\n', 'utf-8');
  writeFileSync(join(TMP, 'src', 'cli', 'index.ts'), 'export const cli = true;\n', 'utf-8');
  mkdirSync(join(TMP, 'specs'), { recursive: true });
}

function seedRuntimeTruthOnly(): void {
  writeFirstRuntimeSummary(TMP, {
    generatedAt: '2026-03-09T12:00:00.000Z',
    mode: 'quick',
    project: { name: 'runtime-truth', platformType: 'backend', overview: 'runtime summary only' },
    techStack: ['runtime: Node.js >=20.0.0', 'language: TypeScript'],
    modules: ['src/core/skill-runtime'],
    capabilities: ['runtime truth source'],
    entryPoints: ['src/cli/index.ts'],
    dataModels: ['Feature'],
    apiSurface: ['CLI: spec-first'],
    risks: [],
    evidence: ['package.json', 'src/cli/index.ts'],
  });
  writeFirstRoleViews(TMP, {
    product: { role: 'product', summary: 'product', focus: ['runtime truth source'], warnings: [] },
    dev: { role: 'dev', summary: 'dev', focus: ['src/core/skill-runtime'], warnings: [] },
    qa: { role: 'qa', summary: 'qa', focus: ['runtime truth source'], warnings: [] },
    architect: { role: 'architect', summary: 'architect', focus: ['backend'], warnings: [] },
  });
  writeFirstStageViews(TMP, {
    spec: { stage: 'spec', summary: 'spec', businessCapabilities: ['runtime truth source'], coreEntities: ['Feature'], dependencies: ['CLI: spec-first'], warnings: [] },
    design: { stage: 'design', summary: 'design', moduleBoundaries: ['src/core/skill-runtime'], integrationPoints: ['CLI: spec-first'], technicalConstraints: ['平台类型: backend'], risks: [] },
    code: { stage: 'code', summary: 'code', entryPoints: ['src/cli/index.ts'], likelyChangeAreas: ['src/core/skill-runtime'], changeHazards: [], verificationHooks: ['tests/unit/first-command.test.ts'] },
    verify: { stage: 'verify', summary: 'verify', testFocus: ['runtime truth source'], riskAreas: [], validationHooks: ['pnpm vitest'], releaseBlockers: [] },
  });
  writeFirstRuntimeIndex(TMP, {
    version: '1.0.0',
    lastRun: '2026-03-09T12:00:00.000Z',
    mode: 'quick',
    summary: { path: '.spec-first/runtime/first/summary.json', fileHash: 'summary', lastUpdated: '2026-03-09T12:00:00.000Z', healthy: true },
    roleViews: { path: '.spec-first/runtime/first/role-views.json', fileHash: 'role', lastUpdated: '2026-03-09T12:00:00.000Z', healthy: true },
    stageViews: { path: '.spec-first/runtime/first/stage-views.json', fileHash: 'stage', lastUpdated: '2026-03-09T12:00:00.000Z', healthy: true },
    docsProjection: {},
    status: 'current',
  });
}

beforeEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });
  process.cwd = () => TMP;
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  process.cwd = origCwd;
  vi.restoreAllMocks();
});

describe('handleFirst', () => {
  it('首次运行生成 canonical runtime 与 docs 投影视图', () => {
    seedProject();

    const code = handleFirst(['--quick']);

    expect(code).toBe(0);
    expect(existsSync(join(TMP, '.spec-first', 'runtime', 'first', 'index.json'))).toBe(true);
    expect(existsSync(join(TMP, 'docs', 'first', 'summary.md'))).toBe(true);

    const summary = readFirstRuntimeSummary(TMP);
    const index = readFirstRuntimeIndex(TMP);

    expect(summary?.mode).toBe('quick');
    expect(summary?.project.name).toBe('demo-first');
    expect(summary?.project.platformType).toBe('backend');
    expect(summary?.techStack).toContain('language: TypeScript');
    expect(summary?.entryPoints).toContain('dist/cli/index.js');
    expect(index?.docsProjection['docs/first/summary.md']?.healthy).toBe(true);
  });

  it('已有 runtime 真源时恢复 docs/first 投影视图', () => {
    seedProject();
    seedRuntimeTruthOnly();
    rmSync(join(TMP, 'docs'), { recursive: true, force: true });

    const code = handleFirst([]);

    expect(code).toBe(0);
    const summaryDoc = join(TMP, 'docs', 'first', 'summary.md');
    const readmeDoc = join(TMP, 'docs', 'first', 'README.md');
    expect(existsSync(summaryDoc)).toBe(true);
    expect(readFileSync(summaryDoc, 'utf-8')).toContain('runtime-truth');
    expect(readFileSync(readmeDoc, 'utf-8')).toContain('.spec-first/runtime/first/');
  });

  it('check-health 在缺失 runtime 时返回校验失败', () => {
    seedProject();

    const code = handleFirst(['--check-health']);

    expect(code).toBe(2);
  });
});
