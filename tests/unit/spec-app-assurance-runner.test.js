'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..', '..');
const RUNNER = path.join(ROOT, 'skills/spec-app-consistency-audit/scripts/run-audit.js');

function git(cwd, args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr);
  return result.stdout.trim();
}

describe('App Assurance 当前 runner characterization', () => {
  test('无 staged raw issues 时明确输出 not_run，而不是零问题通过', () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'app-assurance-runner-'));
    try {
      fs.writeFileSync(path.join(temp, 'README.md'), '# fixture\n');
      git(temp, ['init']);
      git(temp, ['config', 'user.email', 'spec-first@example.test']);
      git(temp, ['config', 'user.name', 'Spec First Test']);
      git(temp, ['add', '.']);
      git(temp, ['commit', '--no-verify', '-m', 'test: fixture']);
      fs.appendFileSync(path.join(temp, 'README.md'), 'changed\n');
      const base = git(temp, ['rev-parse', 'HEAD']);
      const runId = 'characterization-no-issues';
      const result = spawnSync(process.execPath, [RUNNER, 'mode:headless', `base:${base}`, `run-id:${runId}`, '--source', temp], {
        cwd: ROOT,
        encoding: 'utf8',
      });

      expect(result.status).toBe(0);
      const runDir = path.join(temp, '.spec-first/app-audit/runs', runId);
      const latest = JSON.parse(fs.readFileSync(path.join(runDir, 'latest-summary.json'), 'utf8'));
      const report = JSON.parse(fs.readFileSync(path.join(runDir, 'audit-report.json'), 'utf8'));
      expect(latest.run_id).toBe(runId);
      expect(report.issue_synthesis_status).toBe('not_run');
      expect(report.issues).toEqual([]);
      const envelope = fs.readFileSync(path.join(runDir, 'headless-envelope.txt'), 'utf8');
      expect(envelope).toContain('Awaiting LLM audit');
    } finally {
      fs.rmSync(temp, { recursive: true, force: true });
    }
  }, 30000);

  test('prepare 只生成 facts-ready 产物，finalize 在无语义输入时兼容输出 not_run', () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'app-assurance-phases-'));
    try {
      fs.writeFileSync(path.join(temp, 'README.md'), '# fixture\n');
      git(temp, ['init']);
      git(temp, ['config', 'user.email', 'spec-first@example.test']);
      git(temp, ['config', 'user.name', 'Spec First Test']);
      git(temp, ['add', '.']);
      git(temp, ['commit', '--no-verify', '-m', 'test: fixture']);
      fs.appendFileSync(path.join(temp, 'README.md'), 'changed\n');
      const base = git(temp, ['rev-parse', 'HEAD']);
      const runId = 'two-phase-no-semantic';
      const common = ['mode:headless', `base:${base}`, `run-id:${runId}`, '--source', temp];

      const prepared = spawnSync(process.execPath, [RUNNER, 'phase:prepare', ...common], {
        cwd: ROOT,
        encoding: 'utf8',
      });
      expect(prepared.status).toBe(0);
      expect(prepared.stdout).toContain('Facts ready');
      const runDir = path.join(temp, '.spec-first/app-audit/runs', runId);
      expect(fs.existsSync(path.join(runDir, 'app-audit-context.json'))).toBe(true);
      expect(fs.existsSync(path.join(runDir, 'receipts/prepare.json'))).toBe(true);
      expect(fs.existsSync(path.join(runDir, 'issues.json'))).toBe(false);
      expect(fs.existsSync(path.join(runDir, 'audit-report.json'))).toBe(false);

      const finalized = spawnSync(process.execPath, [RUNNER, 'phase:finalize', ...common], {
        cwd: ROOT,
        encoding: 'utf8',
      });
      expect(finalized.status).toBe(0);
      const report = JSON.parse(fs.readFileSync(path.join(runDir, 'audit-report.json'), 'utf8'));
      const metadata = JSON.parse(fs.readFileSync(path.join(runDir, 'metadata.json'), 'utf8'));
      const manifest = JSON.parse(fs.readFileSync(path.join(runDir, 'artifact-manifest.json'), 'utf8'));
      expect(report.issue_synthesis_status).toBe('not_run');
      expect(metadata.stage_receipts.map((entry) => entry.stage)).toEqual(expect.arrayContaining(['prepare', 'cleanup', 'finalize']));
      expect(manifest.cleanup_receipt.status).toBe('complete');
      expect(fs.existsSync(path.join(runDir, 'input'))).toBe(false);
    } finally {
      fs.rmSync(temp, { recursive: true, force: true });
    }
  }, 30000);

  test('finalize 拒绝 prepare 后发生变化的 source，并清理 staged ephemeral input', () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'app-assurance-stale-'));
    try {
      fs.writeFileSync(path.join(temp, 'README.md'), '# fixture\n');
      git(temp, ['init']);
      git(temp, ['config', 'user.email', 'spec-first@example.test']);
      git(temp, ['config', 'user.name', 'Spec First Test']);
      git(temp, ['add', '.']);
      git(temp, ['commit', '--no-verify', '-m', 'test: fixture']);
      const base = git(temp, ['rev-parse', 'HEAD']);
      const runId = 'two-phase-stale';
      const common = ['mode:headless', `base:${base}`, `run-id:${runId}`, '--source', temp];
      expect(spawnSync(process.execPath, [RUNNER, 'phase:prepare', ...common], { cwd: ROOT }).status).toBe(0);
      const runDir = path.join(temp, '.spec-first/app-audit/runs', runId);
      fs.writeFileSync(path.join(runDir, 'input/raw-issues.json'), '{"issues":[],"rejected_issues":[]}\n');
      fs.appendFileSync(path.join(temp, 'README.md'), 'stale\n');

      const finalized = spawnSync(process.execPath, [RUNNER, 'phase:finalize', ...common, '--issue-synthesis-status', 'fixture_provided'], {
        cwd: ROOT,
        encoding: 'utf8',
      });
      expect(finalized.status).toBe(1);
      expect(fs.readFileSync(path.join(runDir, 'headless-envelope.txt'), 'utf8')).toContain('source_fingerprint_stale');
      expect(fs.existsSync(path.join(runDir, 'input'))).toBe(false);
      const cleanup = JSON.parse(fs.readFileSync(path.join(runDir, 'receipts/cleanup.json'), 'utf8'));
      expect(cleanup.status).toBe('complete');
    } finally {
      fs.rmSync(temp, { recursive: true, force: true });
    }
  }, 30000);

  test('abort cleanup 可重复执行且保持幂等', () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'app-assurance-abort-'));
    try {
      fs.writeFileSync(path.join(temp, 'README.md'), '# fixture\n');
      git(temp, ['init']);
      git(temp, ['config', 'user.email', 'spec-first@example.test']);
      git(temp, ['config', 'user.name', 'Spec First Test']);
      git(temp, ['add', '.']);
      git(temp, ['commit', '--no-verify', '-m', 'test: fixture']);
      const base = git(temp, ['rev-parse', 'HEAD']);
      const runId = 'two-phase-abort';
      const common = ['mode:headless', `base:${base}`, `run-id:${runId}`, '--source', temp];
      expect(spawnSync(process.execPath, [RUNNER, 'phase:prepare', ...common], { cwd: ROOT }).status).toBe(0);
      const runDir = path.join(temp, '.spec-first/app-audit/runs', runId);
      fs.writeFileSync(path.join(runDir, 'input/transient-prompt.txt'), 'ephemeral');
      expect(spawnSync(process.execPath, [RUNNER, 'phase:abort', ...common], { cwd: ROOT }).status).toBe(0);
      expect(spawnSync(process.execPath, [RUNNER, 'phase:abort', ...common], { cwd: ROOT }).status).toBe(0);
      const receipt = JSON.parse(fs.readFileSync(path.join(runDir, 'receipts/cleanup.json'), 'utf8'));
      expect(receipt.status).toBe('complete');
      expect(receipt.reason_codes).toContain('ephemeral_inputs_already_absent');
    } finally {
      fs.rmSync(temp, { recursive: true, force: true });
    }
  }, 30000);

  test('cleanup helper 拒绝 run root 之外的递归删除目标', () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'app-assurance-cleanup-boundary-'));
    try {
      fs.mkdirSync(path.join(temp, 'input'));
      fs.writeFileSync(path.join(temp, 'input/keep.txt'), 'keep');
      const cleanup = path.join(ROOT, 'skills/spec-app-consistency-audit/scripts/cleanup-run-inputs.js');
      const result = spawnSync(process.execPath, [cleanup, '--source', temp, '--run-dir', temp], { cwd: ROOT, encoding: 'utf8' });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('cleanup_run_dir_outside_boundary');
      expect(fs.existsSync(path.join(temp, 'input/keep.txt'))).toBe(true);
    } finally {
      fs.rmSync(temp, { recursive: true, force: true });
    }
  });

  test('cleanup helper 拒绝 symlink run-dir 逃逸', () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'app-assurance-cleanup-symlink-'));
    try {
      git(temp, ['init']);
      const realTemp = fs.realpathSync(temp);
      const managed = path.join(realTemp, '.spec-first/app-audit/runs');
      const victim = path.join(realTemp, 'victim');
      fs.mkdirSync(path.join(victim, 'input'), { recursive: true });
      fs.mkdirSync(managed, { recursive: true });
      fs.writeFileSync(path.join(victim, 'input/keep.txt'), 'keep');
      fs.symlinkSync(victim, path.join(managed, 'escape'), 'dir');
      const cleanup = path.join(ROOT, 'skills/spec-app-consistency-audit/scripts/cleanup-run-inputs.js');
      const result = spawnSync(process.execPath, [cleanup, '--run-dir', path.join(managed, 'escape')], { cwd: realTemp, encoding: 'utf8' });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('cleanup_run_dir_symlink_rejected');
      expect(fs.existsSync(path.join(victim, 'input/keep.txt'))).toBe(true);
    } finally {
      fs.rmSync(temp, { recursive: true, force: true });
    }
  });

  test('cleanup helper 拒绝 managed runs root 的 symlink 逃逸', () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'app-assurance-cleanup-root-symlink-'));
    try {
      git(temp, ['init']);
      const realTemp = fs.realpathSync(temp);
      const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'app-assurance-cleanup-victim-'));
      fs.mkdirSync(path.join(realTemp, '.spec-first/app-audit'), { recursive: true });
      fs.mkdirSync(path.join(outside, 'run-1/input'), { recursive: true });
      fs.writeFileSync(path.join(outside, 'run-1/input/keep.txt'), 'keep');
      fs.symlinkSync(outside, path.join(realTemp, '.spec-first/app-audit/runs'), 'dir');
      const cleanup = path.join(ROOT, 'skills/spec-app-consistency-audit/scripts/cleanup-run-inputs.js');
      const result = spawnSync(process.execPath, [cleanup, '--run-dir', path.join(realTemp, '.spec-first/app-audit/runs/run-1')], { cwd: realTemp, encoding: 'utf8' });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('cleanup_managed_root_realpath_escape');
      expect(fs.existsSync(path.join(outside, 'run-1/input/keep.txt'))).toBe(true);
      fs.rmSync(outside, { recursive: true, force: true });
    } finally {
      fs.rmSync(temp, { recursive: true, force: true });
    }
  });

  test('finalize 拒绝未绑定 prepare fingerprint 的 semantic artifact', () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'app-assurance-semantic-binding-'));
    try {
      fs.writeFileSync(path.join(temp, 'README.md'), '# fixture\n');
      git(temp, ['init']);
      git(temp, ['config', 'user.email', 'spec-first@example.test']);
      git(temp, ['config', 'user.name', 'Spec First Test']);
      git(temp, ['add', '.']);
      git(temp, ['commit', '--no-verify', '-m', 'test: fixture']);
      const base = git(temp, ['rev-parse', 'HEAD']);
      const runId = 'semantic-binding';
      const common = ['mode:headless', `base:${base}`, `run-id:${runId}`, '--source', temp];
      expect(spawnSync(process.execPath, [RUNNER, 'phase:prepare', ...common], { cwd: ROOT }).status).toBe(0);
      const runDir = path.join(temp, '.spec-first/app-audit/runs', runId);
      fs.writeFileSync(path.join(runDir, 'input/raw-issues.json'), `${JSON.stringify({
        run_id: runId,
        prepare_fingerprint: 'sha256:wrong',
        producer_receipt: { producer_kind: 'host_llm' },
        issues: [],
        rejected_issues: [],
      })}\n`);
      const result = spawnSync(process.execPath, [RUNNER, 'phase:finalize', ...common, '--issue-synthesis-status', 'llm_provided'], { cwd: ROOT, encoding: 'utf8' });
      expect(result.status).toBe(1);
      expect(fs.readFileSync(path.join(runDir, 'headless-envelope.txt'), 'utf8')).toContain('semantic_prepare_fingerprint_mismatch');
      expect(fs.existsSync(path.join(runDir, 'input'))).toBe(false);
    } finally {
      fs.rmSync(temp, { recursive: true, force: true });
    }
  }, 30000);
});
