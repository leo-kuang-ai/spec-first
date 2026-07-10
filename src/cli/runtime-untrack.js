'use strict';

const { spawnSync } = require('node:child_process');
const { getSpecFirstRuntimeUntrackPatterns } = require('./gitignore-policy');

const SUCCESS_REASON = 'untracked-runtime';
const NONE_TRACKED_REASON = 'none-tracked';

function planRuntimeUntrack({ projectRoot, runGit = defaultRunGit } = {}) {
  const repoCheck = checkGitRepo(projectRoot, runGit);
  if (!repoCheck.ok) {
    return emptyPlan(repoCheck.reason_code, repoCheck.diagnostic);
  }

  const result = runGit(['ls-files', '-z', '--', ...getSpecFirstRuntimeUntrackPatterns()], {
    projectRoot,
    literalPathspecs: false,
  });
  if (!result.ok) {
    return emptyPlan(result.reason_code, result.diagnostic);
  }

  const paths = uniqueSorted(splitNulPaths(result.stdout));
  if (paths.length === 0) {
    return emptyPlan(NONE_TRACKED_REASON);
  }

  const operations = paths.map((filePath) => ({
    kind: 'untrack_index',
    path: filePath,
    reason: 'managed_runtime_untrack',
  }));

  return {
    operations,
    count: operations.length,
    reason_code: SUCCESS_REASON,
    diagnostic: '',
    sample_paths: samplePaths(paths),
  };
}

function applyOne({ projectRoot, operation, runGit = defaultRunGit } = {}) {
  const filePath = operation && operation.path ? operation.path : '';
  if (!filePath) {
    return {
      applied: false,
      reason_code: 'invalid-operation',
      diagnostic: 'operation.path is required',
    };
  }

  const tracked = runGit(['ls-files', '--', filePath], {
    projectRoot,
    literalPathspecs: true,
  });
  if (!tracked.ok) {
    return {
      applied: false,
      reason_code: tracked.reason_code,
      diagnostic: tracked.diagnostic,
    };
  }
  if (!String(tracked.stdout || '').trim()) {
    return {
      applied: false,
      reason_code: 'skipped-now-untracked',
      diagnostic: '',
    };
  }

  const result = runGit(['rm', '--cached', '--quiet', '-f', '--', filePath], {
    projectRoot,
    literalPathspecs: true,
  });
  if (!result.ok) {
    return {
      applied: false,
      reason_code: result.reason_code,
      diagnostic: result.diagnostic,
    };
  }

  return {
    applied: true,
    reason_code: SUCCESS_REASON,
    diagnostic: '',
  };
}

function applyRuntimeUntrack({ projectRoot, operations = [], runGit = defaultRunGit } = {}) {
  const results = [];
  for (const operation of operations) {
    results.push(applyOne({ projectRoot, operation, runGit }));
  }

  const appliedCount = results.filter((result) => result.applied).length;
  const skippedCount = results.length - appliedCount;
  const reasonCodes = uniqueSorted(results.map((result) => result.reason_code).filter(Boolean));
  const diagnostic = results
    .map((result) => result.diagnostic)
    .filter(Boolean)
    .join('\n');

  return {
    applied_count: appliedCount,
    skipped_count: skippedCount,
    reason_codes: reasonCodes,
    reason_code: appliedCount > 0 ? SUCCESS_REASON : (reasonCodes[0] || NONE_TRACKED_REASON),
    diagnostic,
  };
}

function checkGitRepo(projectRoot, runGit) {
  const result = runGit(['rev-parse', '--is-inside-work-tree'], {
    projectRoot,
    literalPathspecs: true,
  });
  if (!result.ok) {
    return {
      ok: false,
      reason_code: result.reason_code,
      diagnostic: result.diagnostic,
    };
  }

  if (String(result.stdout || '').trim() !== 'true') {
    return {
      ok: false,
      reason_code: 'not-a-git-repo',
      diagnostic: '',
    };
  }

  return {
    ok: true,
    reason_code: null,
    diagnostic: '',
  };
}

function defaultRunGit(args, options = {}) {
  const env = { ...process.env };
  if (options.literalPathspecs !== false) {
    env.GIT_LITERAL_PATHSPECS = '1';
  } else {
    delete env.GIT_LITERAL_PATHSPECS;
  }

  const result = spawnSync('git', args, {
    cwd: options.projectRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    env,
  });

  if (result.error && result.error.code === 'ENOENT') {
    return {
      ok: false,
      reason_code: 'git-binary-missing',
      diagnostic: result.error.message,
      stdout: '',
      stderr: '',
    };
  }

  if (result.error) {
    return {
      ok: false,
      reason_code: 'git-command-failed',
      diagnostic: result.error.message,
      stdout: '',
      stderr: '',
    };
  }

  const stdout = result.stdout || Buffer.alloc(0);
  const stderr = result.stderr || Buffer.alloc(0);
  if (result.status !== 0) {
    return {
      ok: false,
      reason_code: classifyGitFailure(stderr),
      diagnostic: summarizeStderr(stderr),
      stdout,
      stderr,
    };
  }

  return {
    ok: true,
    reason_code: null,
    diagnostic: '',
    stdout,
    stderr,
  };
}

function classifyGitFailure(stderr) {
  const message = Buffer.isBuffer(stderr) ? stderr.toString('utf8') : String(stderr || '');
  if (/not a git repository/i.test(message)) {
    return 'not-a-git-repo';
  }
  return 'git-command-failed';
}

function summarizeStderr(stderr) {
  const message = Buffer.isBuffer(stderr) ? stderr.toString('utf8') : String(stderr || '');
  return message.trim().replace(/\s+/g, ' ').slice(0, 500);
}

function splitNulPaths(stdout) {
  const buffer = Buffer.isBuffer(stdout) ? stdout : Buffer.from(String(stdout || ''), 'utf8');
  return buffer
    .toString('utf8')
    .split('\0')
    .filter(Boolean);
}

function uniqueSorted(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function samplePaths(paths) {
  return uniqueSorted(paths).slice(0, 10);
}

function emptyPlan(reasonCode, diagnostic = '') {
  return {
    operations: [],
    count: 0,
    reason_code: reasonCode,
    diagnostic,
    sample_paths: [],
  };
}

module.exports = {
  applyOne,
  applyRuntimeUntrack,
  planRuntimeUntrack,
};
