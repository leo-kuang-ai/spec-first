import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { handleFirst } from '../../src/cli/commands/first.js';
import { sha256Hex } from '../../src/shared/crypto-utils.js';
import {
  readFirstRuntimeIndex,
  writeFirstRuntimeIndex,
} from '../../src/core/skill-runtime/first-runtime-store.js';
import { seedFirstRuntimeOutputs } from '../helpers/first-runtime-fixture.js';

const TMP = join(import.meta.dirname, '../fixtures/.tmp-first-command');
const origCwd = process.cwd;

function alignRuntimeHashes(projectRoot: string): void {
  const index = readFirstRuntimeIndex(projectRoot);
  if (!index) return;

  const runtimeDir = join(projectRoot, '.spec-first', 'runtime', 'first');
  const nextIndex = structuredClone(index);
  nextIndex.summary.fileHash = sha256Hex(readFileSync(join(runtimeDir, 'summary.json'), 'utf-8'));
  nextIndex.steering.fileHash = sha256Hex(readFileSync(join(runtimeDir, 'steering.json'), 'utf-8'));
  nextIndex.conventions.fileHash = sha256Hex(
    readFileSync(join(runtimeDir, 'conventions.json'), 'utf-8')
  );
  nextIndex.criticalFlows.fileHash = sha256Hex(
    readFileSync(join(runtimeDir, 'critical-flows.json'), 'utf-8')
  );
  nextIndex.entryGuide.fileHash = sha256Hex(readFileSync(join(runtimeDir, 'entry-guide.json'), 'utf-8'));
  nextIndex.apiContracts.fileHash = sha256Hex(
    readFileSync(join(runtimeDir, 'api-contracts.json'), 'utf-8')
  );
  nextIndex.structureOverview.fileHash = sha256Hex(
    readFileSync(join(runtimeDir, 'structure-overview.json'), 'utf-8')
  );
  nextIndex.domainModel.fileHash = sha256Hex(readFileSync(join(runtimeDir, 'domain-model.json'), 'utf-8'));
  nextIndex.databaseSchema.fileHash = sha256Hex(
    readFileSync(join(runtimeDir, 'database-schema.json'), 'utf-8')
  );
  writeFirstRuntimeIndex(projectRoot, nextIndex);
}

beforeEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });
  process.cwd = () => TMP;
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  process.cwd = origCwd;
  vi.restoreAllMocks();
});

describe('handleFirst', () => {
  it('验证已有 runtime 与 docs 输出', () => {
    seedFirstRuntimeOutputs(TMP, 'final-first');

    const code = handleFirst([]);

    expect(code).toBe(0);
    expect(vi.mocked(console.log).mock.calls.flat().join('\n')).toContain('来源=validated');
    expect(vi.mocked(console.warn).mock.calls.flat().join('\n')).toBe('');
  });

  it('check-health 在缺失 runtime 时返回校验失败', () => {
    expect(handleFirst(['--check-health'])).toBe(2);
  });

  it('check-health 在 final runtime 与 docs 文件齐备时通过，即使 docsProjection 未同步完整', () => {
    seedFirstRuntimeOutputs(TMP, 'health-check');
    alignRuntimeHashes(TMP);

    const code = handleFirst(['--check-health']);

    expect(code).toBe(0);
  });

  it('help 输出明确 runtime 与 docs 输出边界', () => {
    handleFirst(['--help']);

    const logOutput = vi.mocked(console.log).mock.calls.flat().join('\n');

    expect(logOutput).toContain('.spec-first/runtime/first/');
    expect(logOutput).toContain('docs/first/');
    expect(logOutput).toContain('最小支撑层');
  });

  it('拒绝未知参数', () => {
    expect(handleFirst(['--force'])).toBe(2);
    expect(vi.mocked(console.error).mock.calls.flat().join('\n')).toContain('未知参数');
  });
});
