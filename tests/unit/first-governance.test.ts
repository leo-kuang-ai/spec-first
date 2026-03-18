import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Stage } from '../../src/shared/types.js';
import { bootstrapFirstRuntime } from '../../src/core/skill-runtime/first-bootstrap.js';
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
  bootstrapFirstRuntime(TMP, { mode: 'deep' });
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
  it('classifies runtime source changes as must_update and refreshes canonical truth', () => {
    writeFileSync(
      join(TMP, 'src', 'core', 'skill-runtime', 'first-conventions.ts'),
      'export const marker = "changed";\n',
      'utf-8'
    );

    const diff = analyzeProjectCognitionDiff(TMP, Stage.WRAP_UP);
    expect(diff.decision).toBe('must_update');
    expect(diff.suggestedAssets).toContain('conventions.json');

    const result = applyProjectCognitionWriteback(FEATURE_ID, TMP, Stage.WRAP_UP);
    expect(result.gateStatus).toBe('approved');
    expect(result.writebackMode).toBe('refresh-all');
    expect(result.updatedAssets).toContain('conventions.json');

    const records = getProjectCognitionUpdateRecords(TMP);
    expect(records).toHaveLength(1);
    expect(records[0]?.featureId).toBe(FEATURE_ID);
    expect(records[0]?.decision).toBe('must_update');
    expect(records[0]?.topicKey).toBe('project-cognition/first');
    expect(records[0]?.assetId).toBe('conventions.json');
    expect(records[0]?.updateSource).toBe('governance-wrap-up');
  });

  it('classifies canonical docs drift as should_update and refreshes docs from runtime', () => {
    writeFileSync(join(TMP, 'docs', 'first', 'README.md'), '# Drifted README\n', 'utf-8');

    const result = applyProjectCognitionWriteback(FEATURE_ID, TMP, Stage.DONE);
    expect(result.diff.decision).toBe('should_update');
    expect(result.gateStatus).toBe('approved');
    expect(result.writebackMode).toBe('refresh-docs-from-runtime');
    expect(result.updatedAssets).toContain('docs/first/README.md');
    expect(result.refreshResult?.docsProjections).toContain('docs/first/README.md');
    expect(readFileSync(join(TMP, 'docs', 'first', 'README.md'), 'utf-8')).not.toContain(
      'Drifted README'
    );
    expect(formatProjectCognitionWritebackFinding(result)).toContain('updated=docs/first/README.md');
  });

  it('skips writeback when only feature-local files changed', () => {
    writeFileSync(join(TMP, 'specs', FEATURE_ID, 'spec.md'), '# Updated Spec\n', 'utf-8');

    const result = applyProjectCognitionWriteback(FEATURE_ID, TMP, Stage.WRAP_UP);
    expect(result.diff.decision).toBe('must_not_update');
    expect(result.gateStatus).toBe('skipped');
    expect(result.writebackPerformed).toBe(false);

    const logPath = getFirstProjectCognitionUpdatesPath(TMP);
    expect(existsSync(logPath)).toBe(true);
    expect(readFileSync(logPath, 'utf-8')).toContain('"gateStatus":"skipped"');
  });

  it('reserves long-term memory metadata when docs-only refresh is approved', () => {
    writeFileSync(join(TMP, 'docs', 'first', 'README.md'), '# Drifted README\n', 'utf-8');

    applyProjectCognitionWriteback(FEATURE_ID, TMP, Stage.DONE);

    const records = getProjectCognitionUpdateRecords(TMP);
    expect(records).toHaveLength(1);
    expect(records[0]?.topicKey).toBe('project-cognition/first');
    expect(records[0]?.assetId).toBe('docs/first/README.md');
    expect(records[0]?.updateSource).toBe('governance-done');
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
