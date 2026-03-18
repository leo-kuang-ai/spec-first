import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { bootstrapFirstRuntime } from '../../src/core/skill-runtime/first-bootstrap.js';
import { detectStructuralChanges } from '../../src/core/skill-runtime/first-change-detection.js';

const TMP = join(import.meta.dirname, '../fixtures/.tmp-first-change-detection');
const FEATURE_ID = 'FSREQ-20260318-FIRST-DET-001';

function initRepo(): void {
  execSync('git -c core.hooksPath=/dev/null init', { cwd: TMP, stdio: 'ignore' });
  execSync('git config user.email "dev@example.com"', { cwd: TMP, stdio: 'ignore' });
  execSync('git config user.name "Dev"', { cwd: TMP, stdio: 'ignore' });
}

beforeEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(join(TMP, 'specs', FEATURE_ID), { recursive: true });
  writeFileSync(
    join(TMP, 'package.json'),
    JSON.stringify({ name: 'first-detection-fixture', version: '1.0.0' }, null, 2),
    'utf-8'
  );
  initRepo();
  bootstrapFirstRuntime(TMP, { mode: 'deep' });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('first-change-detection', () => {
  it('detects structural changes from feature artifacts', () => {
    writeFileSync(
      join(TMP, 'specs', FEATURE_ID, 'design.md'),
      [
        '# Design',
        '## 模块划分',
        '- Payment Gateway',
        '',
        '## API 设计',
        '- GET /payments',
        '',
        '## 核心流程',
        '- Payment Retry Flow',
        '',
        '## 技术栈',
        '- Redis Streams',
        '',
      ].join('\n'),
      'utf-8'
    );
    writeFileSync(
      join(TMP, 'specs', FEATURE_ID, 'retro.md'),
      [
        '# Retro',
        '## 风险',
        '- Duplicate payment on retry',
        '',
        '## 新约定',
        '- Always attach idempotency key',
      ].join('\n'),
      'utf-8'
    );

    const changes = detectStructuralChanges(TMP, FEATURE_ID);
    expect(changes.map((change) => change.type)).toEqual([
      'api',
      'convention',
      'flow',
      'module',
      'risk',
      'tech-stack',
    ]);
    expect(changes.map((change) => change.target)).toContain('Payment Gateway');
    expect(changes.map((change) => change.target)).toContain('GET /payments');
    expect(changes.map((change) => change.target)).toContain('Payment Retry Flow');
    expect(changes.map((change) => change.target)).toContain('Duplicate payment on retry');
    expect(changes.map((change) => change.target)).toContain('Always attach idempotency key');
    expect(changes.map((change) => change.target)).toContain('Redis Streams');
    expect(changes.every((change) => change.evidence.includes(`specs/${FEATURE_ID}/`))).toBe(true);
  });

  it('dedupes values already present in runtime truth', () => {
    writeFileSync(
      join(TMP, 'specs', FEATURE_ID, 'design.md'),
      [
        '# Design',
        '## API 设计',
        '- CLI: first-detection-fixture',
        '- GET /new-endpoint',
      ].join('\n'),
      'utf-8'
    );

    const changes = detectStructuralChanges(TMP, FEATURE_ID);
    expect(changes.map((change) => change.target)).not.toContain('CLI: first-detection-fixture');
    expect(changes.map((change) => change.target)).toContain('GET /new-endpoint');
  });
});
