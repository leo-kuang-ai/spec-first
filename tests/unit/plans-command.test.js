'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '../..');
const cliPath = path.join(repoRoot, 'bin', 'spec-first.js');

function runCli(args, cwd) {
  return spawnSync(process.execPath, [cliPath, ...args], { cwd, encoding: 'utf8' });
}

function writePlan(root, name, frontmatter, body = '# Plan\n') {
  const planPath = path.join(root, 'docs', 'plans', name);
  fs.mkdirSync(path.dirname(planPath), { recursive: true });
  fs.writeFileSync(planPath, `---\n${frontmatter}\n---\n${body}`, 'utf8');
  return planPath;
}

function snapshotMarkdownPlans(root) {
  const plansDir = path.join(root, 'docs', 'plans');
  return fs.readdirSync(plansDir)
    .filter((name) => name.endsWith('.md') && fs.lstatSync(path.join(plansDir, name)).isFile())
    .map((name) => [name, fs.readFileSync(path.join(plansDir, name), 'utf8')]);
}

describe('spec-first plans audit command', () => {
  let tempRoot;

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-plans-audit-'));
    fs.mkdirSync(path.join(tempRoot, 'docs', 'plans'), { recursive: true });
  });

  afterEach(() => fs.rmSync(tempRoot, { recursive: true, force: true }));

  test('audits unified code and compatible legacy Markdown plans with stable validity mapping', () => {
    writePlan(tempRoot, '01-active.md', [
      'artifact_contract: spec-unified-plan/v1',
      'execution: code',
      'artifact_readiness: implementation-ready',
      'status: active',
    ].join('\n'));
    writePlan(tempRoot, '02-completed.md', [
      'artifact_contract: spec-unified-plan/v1',
      'execution: code',
      'artifact_readiness: requirements-only',
      'status: completed',
    ].join('\n'));
    writePlan(tempRoot, '03-partial.md', 'type: feat\nstatus: partially-shipped');
    writePlan(tempRoot, '04-superseded.md', 'type: refactor\nexecution: code\nstatus: superseded');
    writePlan(tempRoot, '05-missing.md', 'type: fix\nartifact_readiness: implementation-ready');
    writePlan(tempRoot, '06-closed.md', 'type: feat\nstatus: closed');
    writePlan(tempRoot, '07-invalid.md', 'type: fix\nstatus: done\nartifact_readiness: draft');
    writePlan(tempRoot, '08-duplicate.md', [
      'type: refactor',
      'status: active',
      'status: completed',
      'artifact_readiness: implementation-ready',
      'artifact_readiness: requirements-only',
    ].join('\n'));
    fs.writeFileSync(path.join(tempRoot, 'docs', 'plans', '09-malformed.md'), [
      '---',
      'type: feat',
      'status: active',
      'artifact_readiness: implementation-ready',
      '# missing closing delimiter',
      '',
    ].join('\n'), 'utf8');

    writePlan(tempRoot, '10-unified-without-execution.md', [
      'artifact_contract: spec-unified-plan/v1',
      'artifact_readiness: implementation-ready',
      'status: active',
    ].join('\n'));
    writePlan(tempRoot, '11-legacy-knowledge.md', 'type: feat\nexecution: knowledge-work\nstatus: completed');
    fs.writeFileSync(path.join(tempRoot, 'docs', 'plans', '12-plan.html'), '<p>completed</p>\n', 'utf8');
    fs.mkdirSync(path.join(tempRoot, 'docs', 'plans', 'nested'), { recursive: true });
    writePlan(path.join(tempRoot, 'docs', 'plans', 'nested'), 'nested.md', 'type: feat\nstatus: completed');
    fs.mkdirSync(path.join(tempRoot, 'docs', 'plans', '13-directory.md'));
    try {
      fs.symlinkSync(
        path.join(tempRoot, 'docs', 'plans', '01-active.md'),
        path.join(tempRoot, 'docs', 'plans', '14-link.md'),
      );
    } catch (error) {
      if (!error || !['EACCES', 'EPERM'].includes(error.code)) throw error;
    }

    const before = snapshotMarkdownPlans(tempRoot);
    const result = runCli(['plans', 'audit', '--json'], tempRoot);

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(JSON.parse(result.stdout)).toEqual({
      schema_version: 'plan-status-audit/v1',
      plans: [
        { path: 'docs/plans/01-active.md', status: 'active', readiness: 'implementation-ready', validity: 'valid' },
        { path: 'docs/plans/02-completed.md', status: 'completed', readiness: 'requirements-only', validity: 'valid' },
        { path: 'docs/plans/03-partial.md', status: 'partially-shipped', readiness: null, validity: 'valid' },
        { path: 'docs/plans/04-superseded.md', status: 'superseded', readiness: null, validity: 'valid' },
        { path: 'docs/plans/05-missing.md', status: null, readiness: 'implementation-ready', validity: 'legacy-missing' },
        { path: 'docs/plans/06-closed.md', status: 'closed', readiness: null, validity: 'legacy-closed' },
        { path: 'docs/plans/07-invalid.md', status: 'done', readiness: 'draft', validity: 'invalid' },
        { path: 'docs/plans/08-duplicate.md', status: null, readiness: null, validity: 'invalid' },
        { path: 'docs/plans/09-malformed.md', status: 'active', readiness: 'implementation-ready', validity: 'invalid' },
      ],
    });
    expect(snapshotMarkdownPlans(tempRoot)).toEqual(before);
  });

  test('--status accepts only canonical values and matches only valid records', () => {
    writePlan(tempRoot, 'completed.md', 'type: feat\nstatus: completed');
    writePlan(tempRoot, 'closed.md', 'type: fix\nstatus: closed');
    writePlan(tempRoot, 'duplicate.md', 'type: refactor\nstatus: completed\nstatus: completed');

    const filtered = runCli(['plans', 'audit', '--status', 'completed', '--json'], tempRoot);
    expect(filtered.status).toBe(0);
    expect(JSON.parse(filtered.stdout).plans).toEqual([
      { path: 'docs/plans/completed.md', status: 'completed', readiness: null, validity: 'valid' },
    ]);

    const invalid = runCli(['plans', 'audit', '--status', 'closed', '--json'], tempRoot);
    expect(invalid.status).toBe(2);
    expect(JSON.parse(invalid.stdout)).toEqual(expect.objectContaining({
      schema_version: 'plan-status-audit/v1',
      plans: [],
      error: expect.objectContaining({ code: 'plans-status-invalid' }),
    }));
  });

  test('human output labels completed as a marker rather than delivery proof', () => {
    writePlan(tempRoot, 'completed.md', 'type: feat\nstatus: completed');

    const result = runCli(['plans', 'audit'], tempRoot);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('docs/plans/completed.md');
    expect(result.stdout).toContain('completed');
    expect(result.stdout).toContain('not proof of tests, CI, merge, release, or field outcome');
    expect(result.stdout).toContain('HTML plans are not scanned');
  });

  test('human output escapes terminal control characters from repository data', () => {
    writePlan(tempRoot, 'escape-\u001b[31m.md', 'type: feat\nstatus: "completed\u001b[2J"');

    const result = runCli(['plans', 'audit'], tempRoot);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('escape-\\x1b[31m.md');
    expect(result.stdout).toContain('status=completed\\x1b[2J');
    expect(result.stdout).not.toContain('\u001b');
  });

  test('rejects a docs/plans directory symlink that resolves outside the repository', () => {
    const external = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-external-plans-'));
    try {
      fs.writeFileSync(path.join(external, 'outside.md'), '---\ntype: feat\nstatus: completed\n---\n', 'utf8');
      fs.rmSync(path.join(tempRoot, 'docs', 'plans'), { recursive: true, force: true });
      try {
        fs.symlinkSync(external, path.join(tempRoot, 'docs', 'plans'), 'dir');
      } catch (error) {
        if (error && ['EACCES', 'EPERM'].includes(error.code)) return;
        throw error;
      }

      const result = runCli(['plans', 'audit', '--json'], tempRoot);
      expect(result.status).toBe(2);
      expect(JSON.parse(result.stdout)).toEqual(expect.objectContaining({
        plans: [],
        error: expect.objectContaining({ code: 'plans-audit-read-failed' }),
      }));
    } finally {
      fs.rmSync(external, { recursive: true, force: true });
    }
  });

  test('returns exit 2 for unknown, incomplete, and duplicate arguments', () => {
    expect(runCli(['plans', 'unknown'], tempRoot).status).toBe(2);
    expect(runCli(['plans', 'audit', '--status'], tempRoot).status).toBe(2);
    expect(runCli(['plans', 'audit', '--status', 'active', '--status', 'completed'], tempRoot).status).toBe(2);
    expect(runCli(['plans', 'audit', '--bad'], tempRoot).status).toBe(2);
  });
});
