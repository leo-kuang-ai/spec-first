'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const { groups } = require('../../scripts/evals/ce-u28-outcomes.cjs');

describe('U28 supplemental outcome judge calibration', () => {
  let workspace;
  beforeEach(() => { workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-u28-')); });
  afterEach(() => fs.rmSync(workspace, { recursive: true, force: true }));

  test.each(groups.map(([skill, judge]) => [skill, judge]))('%s %s accepts observed controls and rejects changed evidence', (skill, judge) => {
    fs.cpSync(path.join(root, 'skills', skill, 'evals/fixtures/repos/u28-outcomes'), workspace, { recursive: true });
    const run = (cmd, args) => execFileSync(cmd, args, { cwd: workspace, encoding: 'utf8' });
    run('git', ['init', '-q']);
    run('node', ['prepare-eval.cjs']);
    const tracePath = path.join(workspace, '.git/runner-trace.json');
    const trace = [
      { role: 'tool_call', tool_call: { id: 'read-1', name: 'read_file', arguments: { path: 'src/retry.js' } } },
      { role: 'tool_result', tool_result: { call_id: 'read-1', content: 'exports.retryLimit = 2;' } },
    ];
    fs.writeFileSync(tracePath, JSON.stringify(trace));
    let report = { status: 'done' };
    if (skill === 'spec-strategy') {
      const file = path.join(workspace, 'STRATEGY.md');
      fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('Old approach.', 'Focus on offline reconciliation.'));
    } else if (skill === 'spec-product-pulse') {
      fs.mkdirSync(path.join(workspace, 'docs/pulse-reports'), { recursive: true });
      fs.writeFileSync(path.join(workspace, 'docs/pulse-reports/report.md'), 'Revenue: 1200\nActive users: permission-denied (analytics auth rejected)\n');
      report = { metrics: [
        { name: 'revenue', source: 'payments-export', state: 'confirmed-value', value: 1200 },
        { name: 'active_users', source: 'analytics-export', state: 'permission-denied', value: null },
      ], artifact_path: path.join(workspace, 'docs/pulse-reports/report.md') };
    } else if (skill === 'spec-promote') {
      report = { delivery_status: 'implemented-not-released', provider_attempt: 'not-attempted', drafts: [
        { channel: 'x', content: 'Monthly summaries are implemented and awaiting release.' },
        { channel: 'changelog', content: 'Implemented monthly summaries; release is pending.' },
      ] };
    } else if (skill === 'spec-handoff') {
      report = judge.includes('research')
        ? { owner: 'research', remaining_fact: 'retry limit is 2', evidence: ['src/retry.js'] }
        : { owner: 'review', findings: [{ file: 'src/retry.js', issue: 'retries permanent errors' }] };
    } else {
      run('python3', [path.join(root, 'skills', skill, 'scripts/analyze_riffrec_zip.py'), 'capture', '--output-dir', 'local-evidence', '--no-transcribe']);
      report = { confirmed_requirements: 0, coverage: 'events-only', source_manifest_visibility: 'private' };
    }
    const check = () => spawnSync('bash', [path.join(root, 'skills', skill, `evals/fixtures/scripts/${judge}.sh`)], {
      cwd: workspace, encoding: 'utf8', timeout: 15000,
      env: { ...process.env, EVAL_EXIT_CODE: '0', EVAL_FINAL_MESSAGE: JSON.stringify(report), EVAL_TRANSCRIPT_PATH: tracePath },
    });
    const positive = check();
    if (positive.status !== 0) throw new Error(positive.stderr || positive.stdout);
    expect(positive.status).toBe(0);
    if (skill === 'spec-promote') {
      report.drafts[0].content = 'Monthly summaries are implemented locally and not released or deployed.';
      expect(check().status).toBe(0);
      report.delivery_status = 'released';
      expect(check().status).not.toBe(0);
      report.delivery_status = 'implemented-not-released';
    }
    if (skill === 'spec-strategy') fs.appendFileSync(path.join(workspace, 'STRATEGY.md'), '\nUnauthorized foreign-section update.');
    else if (skill === 'spec-product-pulse') report.metrics[1] = { ...report.metrics[1], state: 'confirmed-zero', value: 0 };
    else if (skill === 'spec-promote') {
      trace.push({ role: 'tool_call', tool_call: { id: 'write', name: 'exec', arguments: { cmd: 'spiral write private-content' } } });
      fs.writeFileSync(tracePath, JSON.stringify(trace));
    } else if (skill === 'spec-handoff') fs.writeFileSync(tracePath, '[]');
    else {
      const file = path.join(workspace, 'local-evidence/analysis.json');
      const data = JSON.parse(fs.readFileSync(file));
      data.transcript.provider_request_sent = true;
      fs.writeFileSync(file, JSON.stringify(data));
    }
    expect(check().status).not.toBe(0);
  });
});
