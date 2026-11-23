'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const run = '.spec-first/workflows/spec-debug/spec-first/phase-three-complete-20261123';
const report = path.relative(process.cwd(), __dirname);
const names = 'spec-strategy spec-promote spec-product-pulse spec-explain spec-sweep spec-riffrec-feedback-analysis spec-runtime-setup spec-compound-refresh spec-write-skill'.split(' ');
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });
const save = (file, value) => fs.writeFileSync(path.join(run, file), JSON.stringify(value, null, 2) + '\n');
const fingerprint = () => JSON.parse(execFileSync('node', ['skills/spec-work/scripts/working-tree-fingerprint.cjs'])).fingerprint;
if (process.argv[2] === 'whitespace') {
  execFileSync('git', ['diff', '--check', 'HEAD'], { stdio: 'inherit' });
  for (const file of git('ls-files', '--others', '--exclude-standard', '-z').split('\0').filter(Boolean)) {
    const result = spawnSync('git', ['diff', '--no-index', '--check', '/dev/null', file], { encoding: 'utf8' });
    assert.ok([0, 1].includes(result.status) && !result.stdout && !result.stderr, file + result.stdout + result.stderr);
  }
} else if (process.argv[2] === 'regression') {
  const suites = fs.readdirSync('tests/unit').filter(file => /^(runtime-(setup-|lib-scope-consistency)|spec-(runtime-setup|riffrec|write-skill|sweep|ideate|compound-refresh|strategy|product-pulse|promote)-|sweep-state-|settled-decisions-contracts|shared-reference-contracts|compound-promotion-contracts|knowledge-publication-judges|ce-u28-outcome-calibration|ce-localization-round-1-remediation-contracts|sup-judge-hardening|sync-instruction-files|skill-source-language|skill-script-mirror-parity|frontmatter-validator-utf8)/.test(file) && file.endsWith('.test.js')).map(file => `tests/unit/${file}`);
  console.log(suites.join('\n'));
  execFileSync('node_modules/.bin/jest', ['--runInBand', '--runTestsByPath', ...suites], { stdio: 'inherit', env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' } });
} else {
  const before = fingerprint();
  fs.mkdirSync(path.join(run, 'logs'), { recursive: true });
  const commands = [
    ['baseline', 'node', [report + '/replay.cjs']], ['reproducer', 'node', [report + '/replay.cjs', '--current']],
    ['coverage', 'node', [report + '/verify-coverage.cjs', '--current']],
    ...names.flatMap(name => ['eval', 'semantic'].filter(kind => fs.existsSync(`skills/${name}/evals/${kind}.yaml`)).map(kind => [`${name}-${kind}`, 'skill-up', ['validate', `evals/${kind}.yaml`], `skills/${name}`])),
    ['regression', 'node', [report + '/verify-run.cjs', 'regression']],
    ['runtime', 'npm', ['run', 'test:mcp-setup']], ['generation', 'node', ['scripts/evals/build-outcome-judges.cjs', '--check']],
    ...['check:shared-references', 'lint:skill-entrypoints', 'sync:instructions', 'typecheck'].map(script => [script.replace(':','-'), 'npm', ['run', script]]),
    ['whitespace', 'node', [report + '/verify-run.cjs', 'whitespace']],
    ['coverage-after-tests', 'node', [report + '/verify-coverage.cjs', '--current']],
  ];
  const checks = commands.map(([id, bin, args, cwd = '.']) => {
    const result = spawnSync(bin, args, { cwd, env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' }, encoding: 'utf8', timeout: 600000, maxBuffer: 16000000 });
    if (result.error || result.status === null) throw result.error || Error(id + ': no exit status');
    const command = [bin, ...args].join(' ');
    const log = `${run}/logs/${id}.log`;
    fs.writeFileSync(log, `cwd: ${cwd}\n${command}\n${result.stdout}${result.stderr}\nExit: ${result.status}\n`);
    console.log(id, result.status);
    return { id, service: id, command: cwd === '.' ? command : `(cd ${cwd} && ${command})`, status: result.status ? 'failed' : 'passed', exit_code: result.status, ran: true, required_tools: [bin], missing_tools: [], log_path: log, reason_code: 'executed', redaction_status: 'none-required' };
  });
  assert.equal(before, fingerprint(), '工作树变化，请按最终版本验证');
  save('input.json', { profile: { source: 'local', name: 'phase-three-complete', path: null }, checked_worktree_fingerprint: before, checks });
  save('claims.json', { run_summary_ref: `${run}/verification-run-summary.json`, validation_scope: 'current-worktree', claims: checks.map(check => ({ claim_type: 'validation', asserted_status: check.status, evidence_refs: ['verification-run-summary:' + check.id] })) });
  assert.ok(checks.every(check => check.status === 'passed'));
}
