'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const script = path.resolve(__dirname, '../../skills/spec-resolve-pr-feedback/scripts/inspect-fix-publication.cjs');
const { inspectFixPublication } = require(script);
const fix = 'a'.repeat(40);
const head = 'b'.repeat(40);
const input = { host: 'github.enterprise.example', base_repo: 'upstream/project', number: 42, head_repo: 'fork/project', head_ref: 'fix/review', fix_commit: fix };
const pr = () => ({ number: 42, html_url: 'https://github.enterprise.example/upstream/project/pull/42', base: { repo: { full_name: 'upstream/project' } }, head: { repo: { full_name: 'fork/project' }, ref: 'fix/review', sha: head } });

test.each(['ahead', 'identical'])('publication accepts %s only against the actual fork head and exact fix merge base', (status) => {
  const calls = [];
  const result = inspectFixPublication(input, (host, endpoint) => {
    calls.push({ host, endpoint });
    return calls.length === 1 ? pr() : { status, merge_base_commit: { sha: fix } };
  });
  expect(result.verified).toBe(true);
  expect(calls).toEqual([
    { host: input.host, endpoint: 'repos/upstream/project/pulls/42' },
    { host: input.host, endpoint: `repos/fork/project/compare/${fix}...${head}` },
  ]);
});

test.each([
  ['behind', fix], ['diverged', fix], ['ahead', head], ['identical', null], [null, fix],
])('publication refuses unproven ancestry: %s %s', (status, sha) => {
  const result = inspectFixPublication(input, (_host, endpoint) => endpoint.includes('/pulls/') ? pr() : { status, merge_base_commit: { sha } });
  expect(result).toMatchObject({ verified: false, reason_code: 'fix-not-proven-reachable' });
});

test.each(['host', 'base', 'head', 'ref', 'number'])('changed %s identity never reaches the comparison', (changed) => {
  const value = pr();
  if (changed === 'host') value.html_url = value.html_url.replace(input.host, 'github.com');
  if (changed === 'base') value.base.repo.full_name = 'other/project';
  if (changed === 'head') value.head.repo.full_name = 'other/project';
  if (changed === 'ref') value.head.ref = 'different';
  if (changed === 'number') value.number = 43;
  const read = jest.fn(() => value);
  expect(inspectFixPublication(input, read).reason_code).toBe('publication-pr-identity-changed');
  expect(read).toHaveBeenCalledTimes(1);
});

test.each([null, { ...input, fix_commit: 'HEAD' }, { ...input, host: '-bad' }, { ...input, base_repo: 'o/r/other' }])('invalid input makes zero provider calls: %j', (value) => {
  const read = jest.fn();
  expect(inspectFixPublication(value, read).verified).toBe(false);
  expect(read).not.toHaveBeenCalled();
});

test('provider errors do not become success or disclose arbitrary diagnostics', () => {
  const result = inspectFixPublication(input, () => { throw new Error('secret sentinel'); });
  expect(result).toMatchObject({ verified: false, reason_code: 'publication-read-unavailable' });
  expect(JSON.stringify(result)).not.toContain('secret sentinel');
});

test('the executable uses only exact-host GET requests with a fake gh recorder', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'publication-read-'));
  try {
    fs.writeFileSync(path.join(root, 'gh'), `#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
fs.appendFileSync(process.env.CALLS, JSON.stringify(args) + '\\n');
console.log(JSON.stringify(args.at(-1).includes('/pulls/') ? ${JSON.stringify(pr())} : ${JSON.stringify({ status: 'ahead', merge_base_commit: { sha: fix } })}));
`, { mode: 0o755 });
    const result = spawnSync(process.execPath, [script, '--host', input.host, '--base-repo', input.base_repo, '--pr', '42', '--head-repo', input.head_repo, '--head-ref', input.head_ref, '--fix-sha', fix], { encoding: 'utf8', env: { ...process.env, PATH: root + path.delimiter + process.env.PATH, CALLS: path.join(root, 'calls') } });
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout).verified).toBe(true);
    const calls = fs.readFileSync(path.join(root, 'calls'), 'utf8').trim().split('\n').map(JSON.parse);
    expect(calls).toHaveLength(2);
    for (const args of calls) expect(args.slice(0, 5)).toEqual(['api', '--hostname', input.host, '--method', 'GET']);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
