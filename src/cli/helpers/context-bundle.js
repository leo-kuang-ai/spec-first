'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const DEFAULT_MAX_FILES = 20;
const DEFAULT_MAX_TOKENS = 60000;

const EXCLUDED_PREFIXES = [
  {
    prefix: '.spec-first/audits',
    kind: 'runtime_audit_artifact',
    reason_code: 'runtime_audit_artifact_excluded',
    reason: 'runtime audit artifacts are excluded from ordinary context',
  },
  {
    prefix: '.spec-first/governance',
    kind: 'runtime_governance_artifact',
    reason_code: 'runtime_governance_artifact_excluded',
    reason: 'runtime governance artifacts are excluded from ordinary context',
  },
  {
    prefix: '.spec-first/workspace',
    kind: 'runtime_context_artifact',
    reason_code: 'runtime_context_artifact_excluded',
    reason: 'runtime context artifacts are excluded from ordinary context',
  },
  {
    prefix: '.spec-first/app-audit',
    kind: 'runtime_context_artifact',
    reason_code: 'runtime_context_artifact_excluded',
    reason: 'runtime context artifacts are excluded from ordinary context',
  },
  {
    prefix: '.spec-first/workflows',
    kind: 'runtime_context_artifact',
    reason_code: 'runtime_context_artifact_excluded',
    reason: 'runtime context artifacts are excluded from ordinary context',
  },
  {
    prefix: '.spec-first/sessions',
    kind: 'runtime_context_artifact',
    reason_code: 'runtime_context_artifact_excluded',
    reason: 'runtime context artifacts are excluded from ordinary context',
  },
  {
    prefix: '.claude',
    kind: 'generated_runtime_mirror',
    reason_code: 'generated_runtime_mirror_excluded',
    reason: 'generated runtime mirrors are excluded from ordinary context',
  },
  {
    prefix: '.codex',
    kind: 'generated_runtime_mirror',
    reason_code: 'generated_runtime_mirror_excluded',
    reason: 'generated runtime mirrors are excluded from ordinary context',
  },
  {
    prefix: '.agents/skills',
    kind: 'generated_runtime_mirror',
    reason_code: 'generated_runtime_mirror_excluded',
    reason: 'generated runtime mirrors are excluded from ordinary context',
  },
  {
    prefix: '.cursor/skills',
    kind: 'generated_runtime_mirror',
    reason_code: 'generated_runtime_mirror_excluded',
    reason: 'generated runtime mirrors are excluded from ordinary context',
  },
  {
    prefix: '.cursor/spec-first',
    kind: 'generated_runtime_mirror',
    reason_code: 'generated_runtime_mirror_excluded',
    reason: 'generated runtime mirrors are excluded from ordinary context',
  },
  {
    prefix: '.cursor/mcp.json',
    kind: 'host_local_config',
    reason_code: 'host_local_config_excluded',
    reason: 'host-local config is excluded from ordinary context',
  },
  {
    prefix: '.kiro/skills',
    kind: 'generated_runtime_mirror',
    reason_code: 'generated_runtime_mirror_excluded',
    reason: 'generated runtime mirrors are excluded from ordinary context',
  },
  {
    prefix: '.kiro/agents',
    kind: 'generated_runtime_mirror',
    reason_code: 'generated_runtime_mirror_excluded',
    reason: 'generated runtime mirrors are excluded from ordinary context',
  },
  {
    prefix: '.kiro/spec-first',
    kind: 'generated_runtime_mirror',
    reason_code: 'generated_runtime_mirror_excluded',
    reason: 'generated runtime mirrors are excluded from ordinary context',
  },
  {
    prefix: '.kiro/settings',
    kind: 'generated_runtime_mirror',
    reason_code: 'generated_runtime_mirror_excluded',
    reason: 'generated runtime mirrors are excluded from ordinary context',
  },
  {
    prefix: '.qoder/commands/spec-',
    match: 'starts_with',
    kind: 'generated_runtime_mirror',
    reason_code: 'generated_runtime_mirror_excluded',
    reason: 'generated runtime mirrors are excluded from ordinary context',
  },
  {
    prefix: '.qoder/commands/spec',
    kind: 'generated_runtime_mirror',
    reason_code: 'generated_runtime_mirror_excluded',
    reason: 'generated runtime mirrors are excluded from ordinary context',
  },
  {
    prefix: '.qoder/skills',
    kind: 'generated_runtime_mirror',
    reason_code: 'generated_runtime_mirror_excluded',
    reason: 'generated runtime mirrors are excluded from ordinary context',
  },
  {
    prefix: '.qoder/agents',
    kind: 'generated_runtime_mirror',
    reason_code: 'generated_runtime_mirror_excluded',
    reason: 'generated runtime mirrors are excluded from ordinary context',
  },
  {
    prefix: '.qoder/spec-first',
    kind: 'generated_runtime_mirror',
    reason_code: 'generated_runtime_mirror_excluded',
    reason: 'generated runtime mirrors are excluded from ordinary context',
  },
  {
    prefix: '.qoder/hooks/session-start',
    kind: 'managed_runtime_hook',
    reason_code: 'managed_runtime_hook_excluded',
    reason: 'managed runtime hooks are excluded from ordinary context',
  },
  {
    prefix: '.qoder/hooks/prd-prewrite-guard',
    kind: 'managed_runtime_hook',
    reason_code: 'managed_runtime_hook_excluded',
    reason: 'managed runtime hooks are excluded from ordinary context',
  },
  {
    prefix: '.qoder/hooks/prd-readiness-guard',
    kind: 'managed_runtime_hook',
    reason_code: 'managed_runtime_hook_excluded',
    reason: 'managed runtime hooks are excluded from ordinary context',
  },
  {
    prefix: '.qoder/settings.local.json',
    kind: 'host_local_config',
    reason_code: 'host_local_config_excluded',
    reason: 'host-local config is excluded from ordinary context',
  },
];

const OUTSIDE_REPO_EXCLUSION = {
  kind: 'outside_repo_context',
  reason_code: 'outside_repo_context_excluded',
  reason: 'paths outside the current repo are excluded from ordinary context',
};

function runContextBundle(argv, io = {}) {
  const stdout = io.stdout || process.stdout;
  const cwd = path.resolve(io.cwd || process.cwd());
  const parsed = parseArgs(argv);

  if (parsed.help) {
    stdout.write(contextBundleHelp());
    return 0;
  }

  if (parsed.error) {
    writeJson(stdout, {
      ok: false,
      error: parsed.error,
    });
    return 2;
  }

  const bundle = buildContextBundle(parsed.options, { cwd });
  writeJson(stdout, {
    ok: true,
    context_bundle: bundle,
  });
  return 0;
}

function parseArgs(argv) {
  const args = Array.isArray(argv) ? [...argv] : [];
  const options = {
    stage: '',
    intent: '',
    relatedPaths: [],
    changedFiles: [],
    artifactSummaries: [],
    evidencePaths: [],
    fullReadTriggers: [],
    maxFiles: DEFAULT_MAX_FILES,
    maxTokens: DEFAULT_MAX_TOKENS,
    allowRuntimeContext: false,
    json: false,
  };

  const readValue = (arg, index) => {
    const equalsIndex = arg.indexOf('=');
    if (equalsIndex !== -1) {
      return { value: arg.slice(equalsIndex + 1), nextIndex: index };
    }
    if (index + 1 >= args.length || args[index + 1].startsWith('--')) {
      return { error: `missing value for ${arg}` };
    }
    return { value: args[index + 1], nextIndex: index + 1 };
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      return { help: true };
    }
    if (arg === '--json') {
      options.json = true;
      continue;
    }
    if (arg === '--allow-runtime-context') {
      options.allowRuntimeContext = true;
      continue;
    }

    const key = arg.includes('=') ? arg.slice(0, arg.indexOf('=')) : arg;
    const valueArgs = new Set([
      '--stage',
      '--intent',
      '--related-path',
      '--changed-file',
      '--artifact-summary',
      '--evidence-path',
      '--full-read-trigger',
      '--max-files',
      '--max-tokens',
    ]);

    if (!valueArgs.has(key)) {
      return {
        error: {
          code: 'unknown_option',
          message: `Unknown option: ${arg}`,
        },
      };
    }

    const next = readValue(arg, i);
    if (next.error) {
      return {
        error: {
          code: 'missing_required_option',
          message: next.error,
        },
      };
    }
    i = next.nextIndex;

    if (key === '--stage') {
      options.stage = next.value;
    } else if (key === '--intent') {
      options.intent = next.value;
    } else if (key === '--related-path') {
      options.relatedPaths.push(next.value);
    } else if (key === '--changed-file') {
      options.changedFiles.push(next.value);
    } else if (key === '--artifact-summary') {
      options.artifactSummaries.push(next.value);
    } else if (key === '--evidence-path') {
      options.evidencePaths.push(next.value);
    } else if (key === '--full-read-trigger') {
      options.fullReadTriggers.push(next.value);
    } else if (key === '--max-files') {
      options.maxFiles = Number(next.value);
    } else if (key === '--max-tokens') {
      options.maxTokens = Number(next.value);
    }
  }

  if (!options.stage) {
    return {
      error: {
        code: 'missing_required_option',
        message: 'Missing required option: --stage',
      },
    };
  }
  if (!Number.isInteger(options.maxFiles) || options.maxFiles < 0) {
    return {
      error: {
        code: 'invalid_option',
        message: '--max-files must be a non-negative integer',
      },
    };
  }
  if (!Number.isInteger(options.maxTokens) || options.maxTokens < 0) {
    return {
      error: {
        code: 'invalid_option',
        message: '--max-tokens must be a non-negative integer',
      },
    };
  }

  return { options };
}

function contextBundleHelp() {
  return [
    'Usage: spec-first internal context-bundle --json --stage <stage> [options]',
    '',
    'Options:',
    '  --stage <stage>                 Required workflow stage.',
    '  --intent <intent>               Optional short intent label.',
    '  --changed-file <path>           Add a changed source path.',
    '  --related-path <path>           Add an explicit related path.',
    '  --artifact-summary <path>       Add a summary-first artifact path.',
    '  --evidence-path <path>          Add path-backed evidence.',
    '  --full-read-trigger <reason>    Add a full-read trigger.',
    '  --max-files <n>                 Maximum included paths.',
    '  --max-tokens <n>                Maximum estimated tokens.',
    '  --allow-runtime-context         Include otherwise excluded runtime context.',
    '  --json                          Emit the context bundle as JSON.',
    '  -h, --help                      Show this help.',
    '',
  ].join('\n');
}

function buildContextBundle(options, env = {}) {
  const cwd = path.resolve(env.cwd || process.cwd());
  const repoRoot = path.resolve(env.repoRoot || resolveRepoRoot(cwd));
  const excluded = [];
  const included = [];

  for (const value of options.changedFiles) {
    classifyPath({
      value,
      source: 'changed_file',
      reason: 'directly changed by current task',
      cwd,
      repoRoot,
      allowRuntimeContext: options.allowRuntimeContext,
      included,
      excluded,
    });
  }
  for (const value of options.relatedPaths) {
    classifyPath({
      value,
      source: 'related_path',
      reason: 'explicitly provided related path',
      cwd,
      repoRoot,
      allowRuntimeContext: options.allowRuntimeContext,
      included,
      excluded,
    });
  }

  const artifactSummaries = [];
  for (const value of options.artifactSummaries) {
    classifyPath({
      value,
      source: 'artifact_summary',
      reason: 'summary-first handoff',
      cwd,
      repoRoot,
      allowRuntimeContext: options.allowRuntimeContext,
      included: artifactSummaries,
      excluded,
    });
  }

  const evidencePaths = [];
  for (const value of options.evidencePaths) {
    classifyPath({
      value,
      source: 'evidence_path',
      reason: 'path-backed evidence',
      cwd,
      repoRoot,
      allowRuntimeContext: options.allowRuntimeContext,
      included: evidencePaths,
      excluded,
    });
  }

  const allIncluded = [...included, ...artifactSummaries, ...evidencePaths];
  const budgetLimited = applyFileBudget(allIncluded, excluded, options.maxFiles);
  const estimatedTokens = estimatePathTokens(budgetLimited.included);
  const budgetUsed = {
    files: budgetLimited.included.length,
    estimated_tokens: estimatedTokens,
  };
  const budgetExceeded = budgetLimited.exceeded || estimatedTokens > options.maxTokens;

  return {
    schema_version: 'spec-first.context-bundle.v1',
    request: {
      schema_version: 'spec-first.context-request.v1',
      stage: options.stage,
      intent: options.intent || null,
      changed_files: options.changedFiles.map((value) => normalizeDisplayPath(value, cwd, repoRoot)),
      budget: {
        max_files: options.maxFiles,
        max_tokens: options.maxTokens,
        prefer_symbols: true,
        allow_full_file: false,
      },
    },
    related_paths: budgetLimited.included.filter((entry) => (
      entry.source === 'changed_file' || entry.source === 'related_path'
    )),
    artifact_summaries: budgetLimited.included.filter((entry) => entry.source === 'artifact_summary'),
    evidence_paths: budgetLimited.included.filter((entry) => entry.source === 'evidence_path'),
    full_read_triggers: [...options.fullReadTriggers],
    excluded_context: excluded,
    budget_used: budgetUsed,
    confidence: budgetExceeded ? 'low' : 'medium',
    degraded: budgetExceeded,
    reason_code: budgetExceeded ? 'context_budget_exceeded' : null,
  };
}

function classifyPath({ value, source, reason, cwd, repoRoot, allowRuntimeContext, included, excluded }) {
  const pathInfo = normalizeContextPath(value, cwd, repoRoot);
  const displayPath = pathInfo.displayPath;
  if (pathInfo.outsideRepo) {
    excluded.push({
      kind: OUTSIDE_REPO_EXCLUSION.kind,
      path: displayPath,
      reason_code: OUTSIDE_REPO_EXCLUSION.reason_code,
      reason: OUTSIDE_REPO_EXCLUSION.reason,
    });
    return;
  }

  const exclusion = findExclusion(displayPath);
  if (exclusion && !allowRuntimeContext) {
    excluded.push({
      kind: exclusion.kind,
      path: displayPath,
      reason_code: exclusion.reason_code,
      reason: exclusion.reason,
    });
    return;
  }

  included.push({
    path: displayPath,
    source,
    reason: exclusion ? `${reason}; runtime context explicitly allowed` : reason,
    tokens_estimated: estimateFileTokens(pathInfo.absolutePath, cwd),
  });
}

function applyFileBudget(entries, excluded, maxFiles) {
  const included = [];
  let exceeded = false;

  for (const entry of entries) {
    if (included.length >= maxFiles) {
      exceeded = true;
      excluded.push({
        kind: entry.source,
        path: entry.path,
        reason_code: 'context_budget_exceeded',
        reason: `excluded because max_files=${maxFiles} was reached`,
      });
      continue;
    }
    included.push(entry);
  }

  return { included, exceeded };
}

function normalizeDisplayPath(value, cwd, repoRoot) {
  return normalizeContextPath(value, cwd, repoRoot).displayPath;
}

function normalizeContextPath(value, cwd, repoRootInput) {
  const repoRoot = path.resolve(repoRootInput || cwd);
  const invocationCwd = path.resolve(cwd || repoRoot);

  if (!value) {
    return {
      displayPath: '',
      absolutePath: repoRoot,
      outsideRepo: false,
    };
  }

  const absolutePath = resolveContextAbsolutePath(value, invocationCwd, repoRoot);
  const relative = path.relative(repoRoot, absolutePath);
  const outsideRepo = relative === '..'
    || relative.startsWith(`..${path.sep}`)
    || path.isAbsolute(relative)
    || realPathEscapesRepo(repoRoot, absolutePath);
  const displayPath = normalizeSlashes(relative || '.').replace(/\/$/, '');

  return {
    displayPath,
    absolutePath,
    outsideRepo,
  };
}

function resolveContextAbsolutePath(value, cwd, repoRoot) {
  if (path.isAbsolute(value)) {
    return path.resolve(value);
  }

  const repoRelative = path.resolve(repoRoot, value);
  const cwdRelative = path.resolve(cwd, value);
  if (isInsidePath(repoRoot, repoRelative) && fs.existsSync(repoRelative)) {
    return repoRelative;
  }
  if (isInsidePath(repoRoot, cwdRelative) && fs.existsSync(cwdRelative)) {
    return cwdRelative;
  }
  if (isInsidePath(repoRoot, repoRelative)) {
    return repoRelative;
  }
  return cwdRelative;
}

function isInsidePath(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function realPathEscapesRepo(repoRoot, candidate) {
  const repoReal = safeRealpath(repoRoot);
  if (!repoReal) return false;
  const inspectPath = fs.existsSync(candidate)
    ? candidate
    : findExistingAncestor(path.dirname(candidate), repoRoot);
  const candidateReal = safeRealpath(inspectPath);
  if (!candidateReal) return false;
  return !isInsidePath(repoReal, candidateReal);
}

function safeRealpath(value) {
  try {
    return fs.realpathSync(value);
  } catch (_error) {
    return '';
  }
}

function findExistingAncestor(candidate, stopAt) {
  let current = path.resolve(candidate);
  const stop = path.resolve(stopAt);
  while (!fs.existsSync(current)) {
    if (current === stop) return stop;
    const parent = path.dirname(current);
    if (parent === current) return stop;
    current = parent;
  }
  return current;
}

function resolveRepoRoot(cwd) {
  try {
    const output = execFileSync('git', ['-C', cwd, 'rev-parse', '--show-toplevel'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (output) {
      return output;
    }
  } catch (_error) {
    return cwd;
  }
  return cwd;
}

function normalizeSlashes(value) {
  return String(value).replace(/\\/g, '/');
}

function findExclusion(displayPath) {
  return EXCLUDED_PREFIXES.find((entry) => {
    if (entry.match === 'starts_with') {
      return displayPath.startsWith(entry.prefix);
    }
    return displayPath === entry.prefix || displayPath.startsWith(`${entry.prefix}/`);
  });
}

function estimateFileTokens(value, cwd) {
  const candidate = path.isAbsolute(value) ? value : path.join(cwd, value);
  try {
    const stat = fs.statSync(candidate);
    if (!stat.isFile()) {
      return 0;
    }
    return Math.ceil(stat.size / 4);
  } catch (_error) {
    return 0;
  }
}

function estimatePathTokens(entries) {
  return entries.reduce((sum, entry) => sum + (entry.tokens_estimated || 0), 0);
}

function writeJson(stream, payload) {
  stream.write(`${JSON.stringify(payload, null, 2)}\n`);
}

module.exports = {
  buildContextBundle,
  runContextBundle,
};
