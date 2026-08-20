'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  computeSourcePlanHash,
  inspectSourcePlanExecutionEligibility,
  validateTaskPack,
} = require('../task-pack');

function runTasks(argv) {
  const args = Array.isArray(argv) ? [...argv] : [];
  const subcommand = args[0];

  if (!subcommand || subcommand === '--help' || subcommand === '-h') {
    printTasksHelp();
    return 0;
  }

  if (subcommand === 'hash') {
    return runHash(args.slice(1));
  }

  if (subcommand === 'validate') {
    return runValidate(args.slice(1));
  }

  if (args.includes('--json')) {
    writeJsonError('tasks-subcommand-unknown', `Unknown tasks subcommand: ${subcommand}`);
    return 2;
  }
  console.error(`Unknown tasks subcommand: ${subcommand}`);
  printTasksHelp(true);
  return 2;
}

function runHash(args) {
  const planPath = getPositionalArgs(args)[0];
  const json = args.includes('--json');
  const repoArg = resolveRepoArg(args);
  const unknown = getUnknownArgs(args, new Set(['--json', '--repo']));

  if (unknown.length > 0) {
    return writeCliError({
      json,
      code: 'tasks-unknown-option',
      message: `unknown option: ${unknown[0]}`,
    });
  }

  if (repoArg.error) {
    return writeCliError({
      json,
      code: repoArg.error.code,
      message: repoArg.error.message,
    });
  }

  if (!planPath) {
    if (json) {
      writeJsonError('tasks-plan-path-required', 'plan path is required');
      return 2;
    }
    console.error('error: plan path is required');
    return 2;
  }

  const resolvedPlan = resolveArtifactOperand(planPath, repoArg.repoRoot, 'plan');
  if (resolvedPlan.error) {
    return writeCliError({
      json,
      code: resolvedPlan.error.code,
      message: resolvedPlan.error.message,
    });
  }

  const result = computeSourcePlanHash(resolvedPlan.absolutePath);
  if (!result.ok) {
    if (json) {
      process.stdout.write(`${JSON.stringify({
        ok: false,
        error: result.error,
      }, null, 2)}\n`);
    } else {
      console.error(`error: ${result.error.message}`);
    }
    return 1;
  }
  const lifecycle = inspectSourcePlanExecutionEligibility(fs.readFileSync(resolvedPlan.absolutePath, 'utf8'));
  if (!lifecycle.eligible) {
    return writeCliError({
      json,
      code: 'tasks-source-plan-non-active',
      message: lifecycle.message,
    });
  }

  const payload = {
    schema_version: 'task-plan-hash/v1',
    artifact_root: repoArg.repoRoot,
    source_plan: resolvedPlan.relativePath,
    plan_path: resolvedPlan.absolutePath,
    hash: result.hash,
    canonicalization_version: result.canonicalization_version,
    removed_frontmatter: result.removed_frontmatter,
    canonical_body_bytes: result.canonical_body_bytes,
  };

  if (json) {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  } else {
    process.stdout.write(`${payload.hash}\n`);
  }

  return 0;
}

function runValidate(args) {
  const taskPackPath = getPositionalArgs(args)[0];
  const json = args.includes('--json');
  const repoArg = resolveRepoArg(args);
  const unknown = getUnknownArgs(args, new Set(['--json', '--repo']));

  if (unknown.length > 0) {
    return writeCliError({
      json,
      code: 'tasks-unknown-option',
      message: `unknown option: ${unknown[0]}`,
    });
  }

  if (repoArg.error) {
    return writeCliError({
      json,
      code: repoArg.error.code,
      message: repoArg.error.message,
    });
  }

  if (!taskPackPath) {
    if (json) {
      writeJsonError('tasks-task-pack-path-required', 'task pack path is required');
      return 2;
    }
    console.error('error: task pack path is required');
    return 2;
  }

  const resolvedTaskPack = resolveArtifactOperand(taskPackPath, repoArg.repoRoot, 'task-pack');
  if (resolvedTaskPack.error) {
    return writeCliError({
      json,
      code: resolvedTaskPack.error.code,
      message: resolvedTaskPack.error.message,
    });
  }

  const result = validateTaskPack(resolvedTaskPack.absolutePath, { repoRoot: repoArg.repoRoot });

  if (json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else if (result.deterministic_handoff) {
    process.stdout.write('task pack valid\n');
  } else {
    console.error(`task pack invalid: ${result.task_pack_validity}`);
    for (const error of result.errors) {
      console.error(`- ${error.code}: ${error.message}`);
    }
  }

  return result.deterministic_handoff ? 0 : 1;
}

function getPositionalArgs(args) {
  const positionals = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--repo') {
      index += 1;
      continue;
    }
    if (arg.startsWith('-')) continue;
    positionals.push(arg);
  }
  return positionals;
}

function getUnknownArgs(args, allowedFlags) {
  const unknown = [];
  for (const arg of args) {
    if (!arg.startsWith('-')) continue;
    if (allowedFlags.has(arg)) continue;
    const [flag] = arg.split('=');
    if (allowedFlags.has(flag)) continue;
    unknown.push(arg);
  }
  return unknown;
}

function resolveRepoArg(args) {
  const equalsArg = args.find((arg) => arg.startsWith('--repo='));
  if (equalsArg) {
    const value = equalsArg.slice('--repo='.length);
    return value
      ? resolveArtifactRoot(value)
      : { repoRoot: null, error: { code: 'tasks-repo-path-required', message: 'repo path is required after --repo' } };
  }

  const repoFlagIndex = args.indexOf('--repo');
  if (repoFlagIndex !== -1) {
    const value = args[repoFlagIndex + 1];
    return value && !value.startsWith('-')
      ? resolveArtifactRoot(value)
      : { repoRoot: null, error: { code: 'tasks-repo-path-required', message: 'repo path is required after --repo' } };
  }

  return resolveArtifactRoot(process.cwd());
}

function resolveArtifactRoot(value) {
  const resolved = path.resolve(value);
  let stat;
  try {
    stat = fs.statSync(resolved);
  } catch (_error) {
    return {
      repoRoot: null,
      error: {
        code: 'tasks-repo-not-found',
        message: `artifact root does not exist: ${resolved}`,
      },
    };
  }
  if (!stat.isDirectory()) {
    return {
      repoRoot: null,
      error: {
        code: 'tasks-repo-not-directory',
        message: `artifact root is not a directory: ${resolved}`,
      },
    };
  }
  return { repoRoot: realpath(resolved), error: null };
}

function resolveArtifactOperand(value, artifactRoot, kind) {
  const candidate = path.isAbsolute(value)
    ? path.resolve(value)
    : path.resolve(artifactRoot, value);
  const existingCandidate = fs.existsSync(candidate) ? realpath(candidate) : candidate;
  if (!isInsidePath(artifactRoot, existingCandidate)) {
    return {
      absolutePath: null,
      relativePath: null,
      error: {
        code: `tasks-${kind}-outside-artifact-root`,
        message: `${kind} path must resolve inside artifact root`,
      },
    };
  }
  return {
    absolutePath: existingCandidate,
    relativePath: toPosixPath(path.relative(artifactRoot, existingCandidate)),
    error: null,
  };
}

function isInsidePath(parentPath, childPath) {
  const relative = path.relative(parentPath, childPath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function realpath(value) {
  const resolver = fs.realpathSync.native || fs.realpathSync;
  return resolver(value);
}

function toPosixPath(value) {
  return value.split(path.sep).join('/');
}

function printTasksHelp(withErrorPrefix = false) {
  const lines = [
    'Usage: spec-first tasks <subcommand> [options]',
    '',
    'Subcommands:',
    '  hash <plan-path> [--json] [--repo=<path>|--repo <path>]  Compute canonical source plan hash',
    '  validate <task-pack-path> [--json] [--repo=<path>|--repo <path>]  Validate a derived task pack',
    '',
    'Notes:',
    '  --repo is the artifact/source resolution root, not the mutation target repository.',
    '  validate only checks identity, freshness, and structure.',
    '  It does not judge task splitting quality or business scope.',
  ];

  if (withErrorPrefix) {
    console.error(lines.join('\n'));
    return;
  }

  process.stdout.write(`${lines.join('\n')}\n`);
}

function writeJsonError(code, message) {
  process.stdout.write(`${JSON.stringify({
    ok: false,
    error: {
      code,
      message,
    },
  }, null, 2)}\n`);
}

function writeCliError({ json, code, message }) {
  if (json) {
    writeJsonError(code, message);
  } else {
    console.error(`error: ${message}`);
  }
  return 2;
}

module.exports = {
  runTasks,
};
