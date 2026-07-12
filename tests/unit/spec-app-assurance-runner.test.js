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
});
