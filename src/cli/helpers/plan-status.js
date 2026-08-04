'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { writeFileAtomic } = require('../atomic-write');
const { inspectMarkdownFrontmatter } = require('./markdown-frontmatter');

const PLAN_STATUS_SCHEMA_VERSION = 'plan-status-result/v1';
const CANONICAL_PLAN_STATUSES = Object.freeze([
  'active',
  'partially-shipped',
  'completed',
  'superseded',
]);
const CANONICAL_PLAN_STATUS_SET = new Set(CANONICAL_PLAN_STATUSES);

function inspectPlanStatus(options = {}, dependencies = {}) {
  const resolved = resolvePlanTarget(options);
  if (!resolved.ok) return failure('inspect', options.plan, resolved.reasonCode, resolved.message);
  const state = readStatusState(resolved, dependencies);
  if (!state.ok) return failure('inspect', resolved.plan, state.reasonCode, state.message);
  return success('inspect', resolved.plan, 'plan-status-inspected', state.status, false);
}

function completePlanStatus(options = {}, dependencies = {}) {
  const resolved = resolvePlanTarget(options);
  if (!resolved.ok) return failure('complete', options.plan, resolved.reasonCode, resolved.message);

  // Mutation deliberately re-reads the file now. The following atomic replacement is
  // not a cross-process compare-and-swap; shipping-tail ownership remains the guardrail.
  const state = readStatusState(resolved, dependencies);
  if (!state.ok) return failure('complete', resolved.plan, state.reasonCode, state.message);
  if (state.status === 'completed') {
    return success('complete', resolved.plan, 'plan-status-already-completed', 'completed', false, {
      previous_status: 'completed',
    });
  }
  if (state.status !== 'active') {
    return failure(
      'complete',
      resolved.plan,
      'plan-status-status-not-active',
      `Plan status must be active to complete; got ${state.status}.`,
      { status: state.status },
    );
  }

  const next = `${state.content.slice(0, state.occurrence.value_start)}completed${state.content.slice(state.occurrence.value_end)}`;
  const atomicWrite = dependencies.writeFileAtomic || writeFileAtomic;
  try {
    atomicWrite(resolved.absolutePath, next, 'utf8');
  } catch (error) {
    return failure('complete', resolved.plan, 'plan-status-write-failed', error.message);
  }
  return success('complete', resolved.plan, 'plan-status-completed', 'completed', true, {
    previous_status: 'active',
  });
}

function runCli(argv, io = {}) {
  const parsed = parseArgs(Array.isArray(argv) ? argv : []);
  const output = io.stdout || process.stdout;
  if (parsed.errors.length > 0) {
    writeJson(failure(
      parsed.action || 'unknown',
      parsed.options.plan,
      'plan-status-invalid-arguments',
      parsed.errors.join('; '),
    ), output);
    return 2;
  }

  const result = parsed.action === 'inspect'
    ? inspectPlanStatus(parsed.options, io.dependencies)
    : completePlanStatus(parsed.options, io.dependencies);
  writeJson(result, output);
  return result.ok ? 0 : 2;
}

function parseArgs(args) {
  const action = args[0] || '';
  const parsed = {
    action,
    options: { targetRepo: '', plan: '' },
    errors: [],
    json: false,
  };
  if (!['inspect', 'complete'].includes(action)) {
    parsed.errors.push('action must be inspect or complete');
    return parsed;
  }

  for (let index = 1; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--json') {
      parsed.json = true;
      continue;
    }
    if (arg === '--target-repo' || arg === '--plan') {
      const value = args[index + 1];
      if (value === undefined || value.startsWith('--')) {
        parsed.errors.push(`${arg} requires a value`);
      } else {
        parsed.options[arg === '--target-repo' ? 'targetRepo' : 'plan'] = value;
        index += 1;
      }
      continue;
    }
    parsed.errors.push(`unknown argument: ${arg}`);
  }

  if (!parsed.options.targetRepo) parsed.errors.push('--target-repo is required');
  if (!parsed.options.plan) parsed.errors.push('--plan is required');
  if (!parsed.json) parsed.errors.push('--json is required');
  return parsed;
}

function resolvePlanTarget(options) {
  if (!options || typeof options.targetRepo !== 'string' || options.targetRepo.trim() === '') {
    return rejectedTarget('plan-status-target-repo-invalid', 'Target repository is required.');
  }
  if (typeof options.plan !== 'string' || !/^docs\/plans\/[^/]+\.md$/.test(options.plan) || options.plan.includes('\\')) {
    return rejectedTarget('plan-status-unsafe-path', 'Plan must be a repo-relative docs/plans/*.md path.');
  }

  let repoRoot;
  try {
    repoRoot = fs.realpathSync(path.resolve(options.targetRepo));
    if (!fs.statSync(repoRoot).isDirectory()) {
      return rejectedTarget('plan-status-target-repo-invalid', 'Target repository is not a directory.');
    }
  } catch (error) {
    return rejectedTarget('plan-status-target-repo-invalid', error.message);
  }

  const absolutePath = path.join(repoRoot, options.plan);
  let stat;
  try {
    stat = fs.lstatSync(absolutePath);
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return rejectedTarget('plan-status-plan-missing', 'Plan file does not exist.');
    }
    return rejectedTarget('plan-status-read-failed', error.message);
  }
  if (stat.isSymbolicLink() || !stat.isFile()) {
    return rejectedTarget('plan-status-unsafe-path', 'Plan must be a non-symlink regular file.');
  }

  let realPlanPath;
  try {
    realPlanPath = fs.realpathSync(absolutePath);
  } catch (error) {
    return rejectedTarget('plan-status-read-failed', error.message);
  }
  if (path.dirname(realPlanPath) !== path.join(repoRoot, 'docs', 'plans')) {
    return rejectedTarget('plan-status-unsafe-path', 'Plan resolves outside target repository docs/plans.');
  }
  return { ok: true, plan: options.plan, absolutePath: realPlanPath };
}

function rejectedTarget(reasonCode, message) {
  return { ok: false, reasonCode, message };
}

function readStatusState(resolved, dependencies) {
  const readFileSync = dependencies.readFileSync || fs.readFileSync;
  let content;
  try {
    content = readFileSync(resolved.absolutePath, 'utf8');
  } catch (error) {
    return { ok: false, reasonCode: 'plan-status-read-failed', message: error.message };
  }

  const parsed = inspectMarkdownFrontmatter(content);
  if (parsed.error) {
    return { ok: false, reasonCode: 'plan-status-frontmatter-invalid', message: parsed.error.message };
  }
  const occurrences = parsed.occurrences.filter((entry) => entry.key === 'status');
  if (occurrences.length === 0) {
    return { ok: false, reasonCode: 'plan-status-status-missing', message: 'Plan status is missing.' };
  }
  if (occurrences.length !== 1) {
    return { ok: false, reasonCode: 'plan-status-status-duplicate', message: 'Plan status must occur exactly once.' };
  }
  const occurrence = occurrences[0];
  if (!CANONICAL_PLAN_STATUS_SET.has(occurrence.value)) {
    return {
      ok: false,
      reasonCode: 'plan-status-status-invalid',
      message: `Plan status is not canonical: ${occurrence.value || '<empty>'}.`,
    };
  }
  return { ok: true, content, occurrence, status: occurrence.value };
}

function success(action, plan, reasonCode, status, changed, extra = {}) {
  return {
    schema_version: PLAN_STATUS_SCHEMA_VERSION,
    ok: true,
    action,
    reason_code: reasonCode,
    plan,
    status,
    changed,
    ...extra,
  };
}

function failure(action, plan, reasonCode, message, extra = {}) {
  return {
    schema_version: PLAN_STATUS_SCHEMA_VERSION,
    ok: false,
    action,
    reason_code: reasonCode,
    plan: typeof plan === 'string' && plan !== '' ? plan : null,
    message,
    changed: false,
    ...extra,
  };
}

function writeJson(payload, output) {
  output.write(`${JSON.stringify(payload, null, 2)}\n`);
}

module.exports = {
  CANONICAL_PLAN_STATUSES,
  PLAN_STATUS_SCHEMA_VERSION,
  completePlanStatus,
  inspectPlanStatus,
  runCli,
};
