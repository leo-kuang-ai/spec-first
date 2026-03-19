import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Stage } from '../../src/shared/types.js';
import { bootstrapFirstRuntime } from '../../src/core/skill-runtime/first-bootstrap.js';
import { seedFirstRuntimeOutputs } from '../helpers/first-runtime-fixture.js';
import {
  analyzeProjectCognitionDiff,
  applyProjectCognitionWriteback,
  formatProjectCognitionWritebackFinding,
  getProjectCognitionUpdateRecords,
} from '../../src/core/skill-runtime/first-governance.js';
import { getFirstProjectCognitionUpdatesPath } from '../../src/core/skill-runtime/first-runtime-store.js';

const TMP = join(import.meta.dirname, '../fixtures/.tmp-first-governance');
const FEATURE_ID = 'FSREQ-20260316-FIRST-001';

function initRepo(): void {
  execSync('git -c core.hooksPath=/dev/null init', { cwd: TMP, stdio: 'ignore' });
  execSync('git config user.email "dev@example.com"', { cwd: TMP, stdio: 'ignore' });
  execSync('git config user.name "Dev"', { cwd: TMP, stdio: 'ignore' });
  execSync('git config core.hooksPath /dev/null', { cwd: TMP, stdio: 'ignore' });
  execSync('git config commit.gpgsign false', { cwd: TMP, stdio: 'ignore' });
}

function seedProject(): void {
  mkdirSync(join(TMP, 'src', 'core', 'skill-runtime'), { recursive: true });
  mkdirSync(join(TMP, 'src', 'cli', 'commands'), { recursive: true });
  mkdirSync(join(TMP, 'specs', FEATURE_ID), { recursive: true });
  writeFileSync(
    join(TMP, 'package.json'),
    JSON.stringify({ name: 'first-governance-fixture', version: '1.0.0' }, null, 2) + '\n',
    'utf-8'
  );
  writeFileSync(
    join(TMP, 'src', 'core', 'skill-runtime', 'first-conventions.ts'),
    'export const marker = "baseline";\n',
    'utf-8'
  );
  writeFileSync(
    join(TMP, 'src', 'core', 'skill-runtime', 'first-summary.ts'),
    'export const summaryMarker = "baseline";\n',
    'utf-8'
  );
  writeFileSync(
    join(TMP, 'src', 'cli', 'commands', 'first.ts'),
    'export const commandMarker = "baseline";\n',
    'utf-8'
  );
  writeFileSync(join(TMP, 'specs', FEATURE_ID, 'spec.md'), '# Spec\n', 'utf-8');
}

beforeEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });
  initRepo();
  seedProject();
  execSync('git -c core.hooksPath=/dev/null add .', { cwd: TMP, stdio: 'ignore' });
  execSync('git -c core.hooksPath=/dev/null -c commit.gpgsign=false commit -m "seed"', {
    cwd: TMP,
    stdio: 'ignore',
  });
  seedFirstRuntimeOutputs(TMP, 'first-governance-fixture');
  bootstrapFirstRuntime(TMP);
  execSync('git -c core.hooksPath=/dev/null add .', { cwd: TMP, stdio: 'ignore' });
  execSync('git -c core.hooksPath=/dev/null -c commit.gpgsign=false commit -m "bootstrap"', {
    cwd: TMP,
    stdio: 'ignore',
  });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('first governance', () => {
  it('classifies runtime source changes as must_update and marks governance blocked for skill regeneration', () => {
    writeFileSync(
      join(TMP, 'src', 'core', 'skill-runtime', 'first-conventions.ts'),
      'export const marker = "changed";\n',
      'utf-8'
    );

    const diff = analyzeProjectCognitionDiff(TMP, Stage.WRAP_UP);
    expect(diff.decision).toBe('must_update');
    expect(diff.suggestedAssets).toContain('conventions.json');

    const result = applyProjectCognitionWriteback(FEATURE_ID, TMP, Stage.WRAP_UP);
    expect(result.gateStatus).toBe('blocked');
    expect(result.updatedAssets).toEqual([]);

    const records = getProjectCognitionUpdateRecords(TMP);
    expect(records).toHaveLength(1);
    expect(records[0]?.featureId).toBe(FEATURE_ID);
    expect(records[0]?.decision).toBe('must_update');
    expect(records[0]?.topicKey).toBe('project-cognition/first');
    expect(records[0]?.assetId).toBe('conventions.json');
    expect(records[0]?.updateSource).toBe('governance-wrap-up');
  });

  it('classifies structural feature changes as must_update and records a blocked governance result', () => {
    writeFileSync(
      join(TMP, 'specs', FEATURE_ID, 'design.md'),
      [
        '# Design',
        '## 模块划分',
        '- Billing Core',
        '',
        '## API 设计',
        '- POST /billing/invoices',
      ].join('\n'),
      'utf-8'
    );

    const diff = analyzeProjectCognitionDiff(TMP, Stage.WRAP_UP, FEATURE_ID);
    expect(diff.decision).toBe('must_update');
    expect(diff.structuralChanges).toHaveLength(2);
    expect(diff.suggestedAssets).toEqual(
      expect.arrayContaining(['summary.json', 'structure-overview.json', 'api-contracts.json'])
    );

    const result = applyProjectCognitionWriteback(FEATURE_ID, TMP, Stage.WRAP_UP);
    expect(result.gateStatus).toBe('blocked');
    expect(result.updatedAssets).toEqual([]);

    const records = getProjectCognitionUpdateRecords(TMP);
    expect(records[0]?.decision).toBe('must_update');
    expect(JSON.stringify(records[0])).toContain('Billing Core');
  });

  it('classifies docs outputs change as must_not_update and skips writeback', () => {
    writeFileSync(join(TMP, 'docs', 'first', 'README.md'), '# Drifted README\n', 'utf-8');

    const result = applyProjectCognitionWriteback(FEATURE_ID, TMP, Stage.DONE);
    expect(result.diff.decision).toBe('must_not_update');
    expect(result.gateStatus).toBe('skipped');
    expect(result.updatedAssets).toEqual([]);
    expect(readFileSync(join(TMP, 'docs', 'first', 'README.md'), 'utf-8')).toContain(
      'Drifted README'
    );
    expect(formatProjectCognitionWritebackFinding(result)).toContain('updated=none');
  });

  it('skips writeback when only feature-local files changed', () => {
    writeFileSync(join(TMP, 'specs', FEATURE_ID, 'spec.md'), '# Updated Spec\n', 'utf-8');

    const result = applyProjectCognitionWriteback(FEATURE_ID, TMP, Stage.WRAP_UP);
    expect(result.diff.decision).toBe('must_not_update');
    expect(result.gateStatus).toBe('skipped');

    const logPath = getFirstProjectCognitionUpdatesPath(TMP);
    expect(existsSync(logPath)).toBe(true);
    expect(readFileSync(logPath, 'utf-8')).toContain('"gateStatus":"skipped"');
  });

  it('records skipped writeback metadata when only docs outputs changed', () => {
    writeFileSync(join(TMP, 'docs', 'first', 'README.md'), '# Drifted README\n', 'utf-8');

    const result = applyProjectCognitionWriteback(FEATURE_ID, TMP, Stage.DONE);
    expect(result.gateStatus).toBe('skipped');

    const records = getProjectCognitionUpdateRecords(TMP);
    expect(records).toHaveLength(1);
    expect(records[0]?.topicKey).toBe('project-cognition/first');
    expect(records[0]?.assetId).toBe('docs/first/README.md');
    expect(records[0]?.updateSource).toBe('governance-done');
  });

  it('does not treat support-layer changes as project cognition source changes', () => {
    writeFileSync(
      join(TMP, 'src', 'core', 'skill-runtime', 'first-context.ts'),
      'export const supportLayerMarker = "changed";\n',
      'utf-8'
    );
    writeFileSync(
      join(TMP, 'src', 'core', 'skill-runtime', 'first-bootstrap.ts'),
      'export const bootstrapMarker = "changed";\n',
      'utf-8'
    );

    const diff = analyzeProjectCognitionDiff(TMP, Stage.WRAP_UP);
    expect(diff.decision).toBe('must_not_update');
  });

  it('does not treat first consumption-layer changes as project cognition source changes', () => {
    writeFileSync(
      join(TMP, 'src', 'core', 'skill-runtime', 'context-resolver.ts'),
      'export const resolverMarker = "changed";\n',
      'utf-8'
    );

    const diff = analyzeProjectCognitionDiff(TMP, Stage.WRAP_UP);
    expect(diff.decision).toBe('must_not_update');
    expect(diff.reasons).toContain('detected first consumption or support-layer changes only');
  });

  it('classifies governance source changes as must_update', () => {
    mkdirSync(join(TMP, 'src', 'core', 'process-engine'), { recursive: true });
    writeFileSync(
      join(TMP, 'src', 'core', 'skill-runtime', 'first-governance.ts'),
      'export const governanceMarker = "changed";\n',
      'utf-8'
    );
    writeFileSync(
      join(TMP, 'src', 'core', 'process-engine', 'advance.ts'),
      'export const advanceMarker = "changed";\n',
      'utf-8'
    );

    const diff = analyzeProjectCognitionDiff(TMP, Stage.WRAP_UP);
    expect(diff.decision).toBe('must_update');
  });
});
