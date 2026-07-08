'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const REPO_ROOT = path.join(__dirname, '..', '..');
const SCRIPTS_DIR = path.join(REPO_ROOT, 'skills', 'spec-resolve-pr-feedback', 'scripts');
const GET_PR_COMMENTS = path.join(SCRIPTS_DIR, 'get-pr-comments');
const GET_THREAD_FOR_COMMENT = path.join(SCRIPTS_DIR, 'get-thread-for-comment');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spec-pr-feedback-pagination-'));
}

function writeFakeGh(binDir) {
  const fakeGh = path.join(binDir, 'gh');
  fs.writeFileSync(fakeGh, `#!/usr/bin/env node
const args = process.argv.slice(2).join('\\n');
const scenario = process.env.FAKE_GH_SCENARIO || 'full';

const author = { login: 'pr-author' };
const pageInfo = (hasNextPage, endCursor = null) => ({ hasNextPage, endCursor });
const comment = (id, body = 'body', login = 'reviewer', createdAt = '2026-05-09T00:00:00Z') => ({
  id,
  author: { login },
  body,
  createdAt,
  url: 'https://example.test/' + id,
});
const thread = (id, isResolved, commentIds, opts = {}) => ({
  id,
  isResolved,
  isOutdated: Boolean(opts.isOutdated),
  path: opts.path || 'src/example.js',
  line: opts.line ?? 10,
  originalLine: opts.originalLine ?? 10,
  startLine: opts.startLine ?? null,
  originalStartLine: opts.originalStartLine ?? null,
  comments: {
    nodes: commentIds.map((commentId, index) => comment(commentId, 'comment ' + commentId, 'reviewer', '2026-05-09T00:0' + index + ':00Z')),
    pageInfo: pageInfo(Boolean(opts.commentsHasNextPage), opts.commentsHasNextPage ? 'nested-cursor' : null),
  },
});
const prWithThreads = (nodes, hasNextPage) => ({
  data: {
    repository: {
      pullRequest: {
        author,
        reviewThreads: {
          nodes,
          pageInfo: pageInfo(hasNextPage, hasNextPage ? 'cursor' : null),
        },
      },
    },
  },
});
const prWithComments = (nodes, hasNextPage) => ({
  data: {
    repository: {
      pullRequest: {
        comments: { nodes, pageInfo: pageInfo(hasNextPage, hasNextPage ? 'cursor' : null) },
      },
    },
  },
});
const prWithReviews = (nodes, hasNextPage) => ({
  data: {
    repository: {
      pullRequest: {
        reviews: { nodes, pageInfo: pageInfo(hasNextPage, hasNextPage ? 'cursor' : null) },
      },
    },
  },
});

if (args.includes('query Threads')) {
  if (scenario === 'truncated') {
    console.log(JSON.stringify([
      prWithThreads([thread('thread-truncated', false, ['first'], { commentsHasNextPage: true })], false),
    ]));
    process.exit(0);
  }

  console.log(JSON.stringify([
    prWithThreads([
      thread('thread-unresolved-1', false, ['c1']),
      thread('thread-resolved-1', true, ['r1'], { path: 'src/resolved.js' }),
    ], true),
    prWithThreads([
      thread('thread-unresolved-2', false, ['target-comment'], { isOutdated: true, commentsHasNextPage: true }),
    ], false),
  ]));
  process.exit(0);
}

if (args.includes('query Comments')) {
  console.log(JSON.stringify([
    prWithComments([
      comment('issue-1', 'actionable issue comment'),
      comment('issue-author', 'author should be filtered', 'pr-author'),
      comment('issue-codecov', 'coverage summary', 'codecov'),
    ], true),
    prWithComments([
      comment('issue-2', 'second page issue comment'),
      comment('issue-blank', '   '),
    ], false),
  ]));
  process.exit(0);
}

if (args.includes('query Reviews')) {
  console.log(JSON.stringify([
    prWithReviews([
      { id: 'review-1', author: { login: 'reviewer' }, body: 'please check this', state: 'COMMENTED' },
      { id: 'review-author', author: { login: 'pr-author' }, body: 'self review', state: 'COMMENTED' },
      { id: 'review-empty', author: { login: 'reviewer' }, body: '', state: 'COMMENTED' },
    ], true),
    prWithReviews([
      { id: 'review-2', author: { login: 'reviewer-2' }, body: 'second page review', state: 'CHANGES_REQUESTED' },
      { id: 'review-codecov', author: { login: 'codecov' }, body: 'coverage bot', state: 'COMMENTED' },
    ], false),
  ]));
  process.exit(0);
}

console.error('unexpected fake gh args: ' + args);
process.exit(2);
`, 'utf8');
  fs.chmodSync(fakeGh, 0o755);
}

function fakeEnv(binDir, scenario = 'full') {
  return {
    ...process.env,
    PATH: `${binDir}${path.delimiter}${process.env.PATH || ''}`,
    FAKE_GH_SCENARIO: scenario,
  };
}

describe('spec-resolve-pr-feedback paginated GraphQL scripts', () => {
  let tmpDir;
  let binDir;

  beforeEach(() => {
    tmpDir = makeTempDir();
    binDir = path.join(tmpDir, 'bin');
    fs.mkdirSync(binDir);
    writeFakeGh(binDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('get-pr-comments merges slurped reviewThreads, issue comments, and reviews without resolved-thread dispatch inputs', () => {
    const output = execFileSync('bash', [GET_PR_COMMENTS, '123', 'OWNER/REPO'], {
      encoding: 'utf8',
      env: fakeEnv(binDir),
    });
    const result = JSON.parse(output);

    expect(result.review_threads.map((entry) => entry.node.id)).toEqual([
      'thread-unresolved-1',
      'thread-unresolved-2',
    ]);
    expect(result.review_threads[1].node.isOutdated).toBe(true);
    expect(result.pr_comments.map((entry) => entry.id)).toEqual(['issue-1', 'issue-2']);
    expect(result.review_bodies.map((entry) => entry.id)).toEqual(['review-1', 'review-2']);
    expect(result.cross_invocation).toBeUndefined();
    expect(JSON.stringify(result)).not.toContain('thread-resolved-1');
    expect(JSON.stringify(result)).not.toContain('src/resolved.js');
    expect(result.fetch_warnings).toEqual([
      expect.objectContaining({
        code: 'thread_comments_truncated',
        threads: [expect.objectContaining({ thread_id: 'thread-unresolved-2' })],
      }),
    ]);
  });

  test('get-thread-for-comment locates a target comment from the second reviewThreads page', () => {
    const output = execFileSync('bash', [GET_THREAD_FOR_COMMENT, '123', 'target-comment', 'OWNER/REPO'], {
      encoding: 'utf8',
      env: fakeEnv(binDir),
    });

    expect(JSON.parse(output)).toEqual(expect.objectContaining({
      id: 'thread-unresolved-2',
      isOutdated: true,
    }));
  });

  test('get-thread-for-comment does not report confirmed absence when nested thread comments are truncated', () => {
    const result = spawnSync('bash', [GET_THREAD_FOR_COMMENT, '123', 'missing-comment', 'OWNER/REPO'], {
      encoding: 'utf8',
      env: fakeEnv(binDir, 'truncated'),
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('nested thread comment pagination is unsupported');
    expect(result.stderr).toContain('absence is incomplete evidence');
  });

  test('scripts use strict shell mode and paginated slurp queries', () => {
    const getPrComments = fs.readFileSync(GET_PR_COMMENTS, 'utf8');
    const getThreadForComment = fs.readFileSync(GET_THREAD_FOR_COMMENT, 'utf8');

    for (const script of [getPrComments, getThreadForComment]) {
      expect(script).toContain('set -euo pipefail');
      expect(script).toContain('gh api graphql --paginate --slurp');
      expect(script).not.toContain('reviewThreads(first: 50)');
    }
    expect(getPrComments).toContain('query Comments');
    expect(getPrComments).toContain('query Reviews');
    expect(getThreadForComment).toContain('${3:-}');
  });
});
