'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const scripts = path.resolve(__dirname, '../../skills/spec-resolve-pr-feedback/scripts');
let root;
let env;
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-pr-reply-'));
  env = { ...process.env, PATH: root + path.delimiter + process.env.PATH, FIXTURE_ROOT: root };
  fs.writeFileSync(path.join(root, 'gh'), `#!/usr/bin/env node
const fs = require('node:fs'), path = require('node:path');
const args = process.argv.slice(2);
fs.appendFileSync(path.join(process.env.FIXTURE_ROOT, 'calls.jsonl'), JSON.stringify(args) + '\\n');
const route = args.find(arg => arg.startsWith('repos/')) || '';
if (route.endsWith('/replies') && args.includes('POST')) {
  if (process.env.POST_FAIL) process.exit(1);
  console.log(JSON.stringify({ id: 2002, html_url: 'https://github.com/o/r/pull/42#discussion_r2002', pull_request_review_id: 3003 }));
} else if (route.endsWith('/reviews') && !args.includes('POST')) {
  if (process.env.REVIEW_FAIL) process.exit(1);
  if (process.env.PENDING) console.log('3003');
} else if (args.includes('graphql')) {
  const query = args.find(arg => arg.startsWith('query='));
  if (!query) process.exit(91);
  const fixture = JSON.parse(fs.readFileSync(path.join(process.env.FIXTURE_ROOT, 'pages.json'), 'utf8'));
  const kind = /query Threads/.test(query) ? 'threads' : /query Comments/.test(query) ? 'comments' : 'reviews';
  console.log(JSON.stringify(fixture[kind]));
} else {
  console.error('Unexpected gh invocation');
  process.exit(92);
}
`, { mode: 0o755 });
});
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

function run(name, args, body = '> Original\n\nFixed: `$literal` and $(not-executed).') {
  return spawnSync('bash', [path.join(scripts, name), ...args], { cwd: root, env, input: body, encoding: 'utf8' });
}
function calls() {
  const file = path.join(root, 'calls.jsonl');
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim().split('\n').map(JSON.parse) : [];
}

test('reply posts once to the root REST endpoint and preserves multiline Markdown', () => {
  const body = '> reviewer\n\nFixed `$foo` and $(false).';
  const result = run('reply-to-pr-thread', ['42', '1001', 'o/r'], body);
  expect(result.status).toBe(0);
  expect(JSON.parse(result.stdout).id).toBe(2002);
  const observed = calls();
  expect(observed[0]).toEqual(['api', '--method', 'POST', 'repos/o/r/pulls/42/comments/1001/replies', '-f', 'body=' + body]);
  expect(observed[1]).toContain('repos/o/r/pulls/42/reviews');
  expect(observed[1]).toContain('--paginate');
  expect(observed.flat()).not.toContain('graphql');
});

test('pending review after POST preserves the reply receipt and prevents successful completion', () => {
  env.PENDING = '1';
  const result = run('reply-to-pr-thread', ['42', '1001', 'o/r']);
  expect(result.status).toBe(2);
  expect(JSON.parse(result.stdout).id).toBe(2002);
  expect(result.stderr).toMatch(/pending review/i);
  expect(calls()).toHaveLength(2);
  expect(calls().filter(args => args.includes('POST'))).toHaveLength(1);
});

test.each(['POST_FAIL', 'REVIEW_FAIL'])('%s never retries or resolves the thread', failure => {
  env[failure] = '1';
  const result = run('reply-to-pr-thread', ['42', '1001', 'o/r']);
  expect(result.status).not.toBe(0);
  expect(calls().filter(args => args.includes('POST'))).toHaveLength(1);
  expect(calls().flat().join(' ')).not.toContain('resolveReviewThread');
});

test.each([
  ['x', '1001', 'o/r'],
  ['42', 'PRRT_thread', 'o/r'],
  ['42', '1001', 'o/r/extra'],
])('invalid identity %j makes no provider call', (...args) => {
  expect(run('reply-to-pr-thread', args).status).not.toBe(0);
  expect(calls()).toEqual([]);
});

function seedPages() {
  const thread = (id, url) => ({ id, isResolved: false, comments: { nodes: [{ id: 'comment-' + id, url }], pageInfo: { hasNextPage: false } } });
  const page = (key, nodes) => ({ data: { viewer: { login: 'me' }, repository: { pullRequest: { author: { login: 'author' }, [key]: { nodes } } } } });
  fs.writeFileSync(path.join(root, 'pages.json'), JSON.stringify({
    threads: [
      page('reviewThreads', [thread('first', 'https://github.com/o/r/pull/42#discussion_r1001')]),
      page('reviewThreads', [thread('second', 'https://github.com/o/r/pull/42#discussion_r2001'), thread('missing-url', null)]),
    ],
    comments: [page('comments', [])],
    reviews: [page('reviews', [])],
  }));
}

test('fetch carries root REST IDs across pages without dropping threads whose ID is unavailable', () => {
  seedPages();
  const result = run('get-pr-comments', ['42', 'o/r']);
  expect(result.status).toBe(0);
  const threads = JSON.parse(result.stdout).review_threads;
  expect(threads.map(item => item.root_comment_id)).toEqual([1001, 2001, null]);
  expect(threads.map(item => item.node.id)).toEqual(['first', 'second', 'missing-url']);
});

test('thread lookup returns authoritative GraphQL and root REST identities from later pages', () => {
  seedPages();
  const result = run('get-thread-for-comment', ['42', 'comment-second', 'o/r']);
  expect(result.status).toBe(0);
  expect(JSON.parse(result.stdout)).toMatchObject({ id: 'second', root_comment_id: 2001 });
});
