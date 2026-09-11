#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const SCHEMA_VERSION = 'spec-lfg-pr-watch-state/v1';
const FAILING = new Set(['FAILURE', 'TIMED_OUT', 'CANCELLED', 'ACTION_REQUIRED', 'STARTUP_FAILURE', 'STALE']);

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function fail(reasonCode, errors, exitCode = 1) {
  process.stdout.write(JSON.stringify({ status: 'rejected', reason_code: reasonCode, errors }, null, 2) + '\n');
  process.exit(exitCode);
}

function parseArgs(argv) {
  const parsed = { input: '', stateDir: '', expectedGeneration: null, expectedSha256: '', budgetSeconds: 10800 };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const value = argv[index + 1] || '';
    if (arg === '--input') parsed.input = value;
    else if (arg === '--state-dir') parsed.stateDir = value;
    else if (arg === '--expected-generation') parsed.expectedGeneration = Number(value);
    else if (arg === '--expected-sha256') parsed.expectedSha256 = value;
    else if (arg === '--budget-seconds') parsed.budgetSeconds = Number(value);
    else fail('invalid-arguments', ['unknown argument: ' + arg], 2);
    index += 1;
  }
  if (!parsed.input || !parsed.stateDir || !Number.isInteger(parsed.expectedGeneration)
    || parsed.expectedGeneration < 0 || !/^[a-f0-9]{64}$/.test(parsed.expectedSha256)
    || !Number.isFinite(parsed.budgetSeconds) || parsed.budgetSeconds <= 0) {
    fail('invalid-arguments', ['input, state-dir, expected generation/hash, and positive budget are required'], 2);
  }
  return parsed;
}

function readInput(file) {
  try {
    const stat = fs.lstatSync(file);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('not a regular file');
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    fail('input-invalid', [error.message]);
  }
}

function stable(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value))].sort();
}

function normalizePrUrl(value) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || value.length > 500) {
    fail('snapshot-invalid', ['pr_url must be a valid HTTPS URL without credentials']);
  }
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
      throw new Error('unsafe URL');
    }
  } catch (_error) {
    fail('snapshot-invalid', ['pr_url must be a valid HTTPS URL without credentials']);
  }
  return value;
}

function inspectPrivateDirectory(directory, label) {
  let stat;
  try {
    stat = fs.lstatSync(directory);
  } catch (error) {
    fail('state-path-unsafe', [`${label} must already exist as a private directory: ${error.code || error.message}`]);
  }
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    fail('state-path-unsafe', [`${label} must be a real directory`]);
  }
  if (typeof process.getuid === 'function') {
    if (stat.uid !== process.getuid()) fail('state-path-unsafe', [`${label} must be owned by the current user`]);
    if ((stat.mode & 0o077) !== 0) {
      fail('state-path-unsafe', [`${label} permissions must not allow group or other access`]);
    }
  }
  return { dev: stat.dev, ino: stat.ino };
}

function inspectPrivateFile(file) {
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink()) fail('state-path-unsafe', ['state snapshot must be a real file']);
  if (typeof process.getuid === 'function') {
    if (stat.uid !== process.getuid()) fail('state-path-unsafe', ['state snapshot must be owned by the current user']);
    if ((stat.mode & 0o077) !== 0) {
      fail('state-path-unsafe', ['state snapshot permissions must not allow group or other access']);
    }
  }
}

function inspectStateLocation(stateDir) {
  const parent = path.dirname(stateDir);
  const parentIdentity = inspectPrivateDirectory(parent, 'state-dir parent');
  if (fs.existsSync(stateDir)) inspectPrivateDirectory(stateDir, 'state-dir');
  return { parent, parentIdentity };
}

function ensureStateDirectory(stateDir, expectedParent) {
  try {
    fs.mkdirSync(stateDir, { mode: 0o700 });
  } catch (error) {
    if (error.code !== 'EEXIST') fail('pr-watch-state-write-failed', [error.message]);
  }
  const currentParent = inspectPrivateDirectory(expectedParent.parent, 'state-dir parent');
  if (currentParent.dev !== expectedParent.parentIdentity.dev || currentParent.ino !== expectedParent.parentIdentity.ino) {
    fail('state-path-unsafe', ['state-dir parent changed during state update']);
  }
  inspectPrivateDirectory(stateDir, 'state-dir');
}

function normalize(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('snapshot-invalid', ['snapshot must be an object']);
  for (const field of ['pr_number', 'head_sha', 'base_ref', 'base_oid', 'pr_state', 'mergeable', 'merge_state_status', 'observed_at']) {
    if (!(field in input)) fail('snapshot-invalid', ['missing field: ' + field]);
  }
  if (!Number.isInteger(input.pr_number) || input.pr_number < 1) fail('snapshot-invalid', ['invalid pr_number']);
  if (!/^[a-f0-9]{40}$/.test(input.head_sha || '') || !/^[a-f0-9]{40}$/.test(input.base_oid || '')) {
    fail('snapshot-invalid', ['head_sha and base_oid must be full lowercase commit SHAs']);
  }
  if (!Number.isFinite(Date.parse(input.observed_at))) fail('snapshot-invalid', ['observed_at must be an ISO timestamp']);
  const identityText = value => typeof value === 'string' ? value.slice(0, 500) : null;
  const checks = (Array.isArray(input.checks) ? input.checks : []).map((check) => ({
    key: String(check.key || check.name || 'unknown').slice(0, 200),
    status: String(check.status || 'UNKNOWN').toUpperCase(),
    conclusion: check.conclusion == null ? null : String(check.conclusion).toUpperCase(),
    run_id: check.run_id == null ? null : String(check.run_id),
    created_at: identityText(check.created_at),
    started_at: identityText(check.started_at),
    completed_at: identityText(check.completed_at),
    details_url: normalizePrUrl(check.details_url),
  })).sort((a, b) => a.key.localeCompare(b.key));
  const reviewItems = (Array.isArray(input.review_items) ? input.review_items : [])
    .filter((item) => item && /^[A-Za-z0-9][A-Za-z0-9._-]{0,120}$/.test(String(item.id || '')))
    .map((item) => ({
      id: String(item.id),
      kind: ['thread', 'comment', 'review'].includes(item.kind) ? item.kind : 'comment',
      updated_at: typeof item.updated_at === 'string' ? item.updated_at : null,
      last_comment_id: item.last_comment_id == null ? null : String(item.last_comment_id),
      url: normalizePrUrl(item.url),
      disposition: 'open',
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
  if (new Set(checks.map(check => check.key)).size !== checks.length
    || new Set(reviewItems.map(sourceKey)).size !== reviewItems.length) {
    fail('snapshot-invalid', ['ambiguous duplicate source identity']);
  }
  return {
    pr_number: input.pr_number,
    pr_url: normalizePrUrl(input.pr_url),
    remote_available: input.remote_available !== false,
    head_sha: input.head_sha,
    base_ref: String(input.base_ref).slice(0, 200),
    base_oid: input.base_oid,
    pr_state: String(input.pr_state).toUpperCase(),
    mergeable: String(input.mergeable).toUpperCase(),
    merge_state_status: String(input.merge_state_status).toUpperCase(),
    review_decision: String(input.review_decision || 'UNKNOWN').toUpperCase(),
    observed_at: input.observed_at,
    checks,
    review_items: reviewItems,
    repo_policy: {
      branch_currency_update: input.repo_policy && input.repo_policy.branch_currency_update === 'non-rewriting'
        ? 'non-rewriting' : 'unspecified',
    },
    limitations: stable(Array.isArray(input.limitations) ? input.limitations : []),
  };
}

function observationIdentity(snapshot) {
  return sha256(JSON.stringify({
    remote_available: snapshot.remote_available,
    head_sha: snapshot.head_sha,
    base_oid: snapshot.base_oid,
    pr_state: snapshot.pr_state,
    mergeable: snapshot.mergeable,
    merge_state_status: snapshot.merge_state_status,
    review_decision: snapshot.review_decision,
    checks: snapshot.checks,
    review_items: snapshot.review_items,
  }));
}

function decisionError(message) {
  fail('decision-invalid', [message]);
}

function readDecisionArtifact(ref) {
  if (!ref || typeof ref.path !== 'string' || !path.isAbsolute(ref.path)
    || !/^[a-f0-9]{64}$/.test(ref.sha256 || '')) decisionError('private artifact path and SHA-256 required');
  inspectPrivateDirectory(path.dirname(ref.path), 'decision artifact parent');
  inspectPrivateFile(ref.path);
  const raw = fs.readFileSync(ref.path, 'utf8');
  if (sha256(raw) !== ref.sha256) decisionError('artifact hash mismatch');
  try { return JSON.parse(raw); } catch (_error) { decisionError('artifact must be JSON'); }
}

function sourceKey(source) {
  return JSON.stringify([source.kind, source.id]);
}

function currencyKey(current) {
  return 'currency:' + sha256(JSON.stringify([
    current.pr_url, current.pr_number, current.head_sha, current.base_ref,
    current.base_oid, current.merge_state_status,
  ]));
}

function sourceObservation(current, source) {
  if (!current) return null;
  const scope = [current.pr_url, current.pr_number, current.head_sha];
  if (source.kind === 'check') {
    const check = current.checks.find(item => item.key === source.id);
    return check && (check.run_id || check.created_at || check.started_at || check.completed_at || check.details_url)
      && FAILING.has(check.conclusion || check.status) ? [...scope, check] : null;
  }
  if (source.kind === 'currency') {
    return source.id === currencyKey(current) && ['BEHIND', 'DIRTY'].includes(current.merge_state_status)
      ? [...scope, current.base_oid, current.merge_state_status, current.repo_policy] : null;
  }
  const item = current.review_items.find(entry => entry.kind === source.kind && entry.id === source.id);
  return item && (item.updated_at || item.last_comment_id) ? [...scope, item] : null;
}

function validateResidual(value, current) {
  const text = item => typeof item === 'string' && item.trim().length > 0;
  const context = value && value.decision_context;
  if (!value || value.type !== 'needs-human' || !Array.isArray(value.sources) || !value.sources.length
    || !context || !['quoted_feedback', 'investigation', 'decision_reason'].every(key => text(context[key]))
    || !Array.isArray(context.options) || !context.options.length
    || !context.options.every(option => option && text(option.option) && text(option.tradeoff))
    || !(context.recommendation === null || text(context.recommendation))
    || !Array.isArray(value.thread_urls) || !value.thread_urls.every(text)) decisionError('incomplete typed residual');
  const seen = new Set();
  const urls = [];
  for (const source of value.sources) {
    if (!source || !text(source.id) || !['thread', 'comment', 'review', 'check', 'currency'].includes(source.kind)
      || seen.has(sourceKey(source))) decisionError('invalid or duplicate decision source');
    seen.add(sourceKey(source));
    if (!sourceObservation(current, source)) decisionError('decision source is missing or lacks identity');
    if (source.kind === 'thread') {
      const url = current.review_items.find(item => item.id === source.id && item.kind === 'thread').url;
      if (!url) decisionError('thread source has no authoritative URL');
      urls.push(url);
    }
  }
  if (new Set(value.thread_urls).size !== value.thread_urls.length
    || JSON.stringify([...value.thread_urls].sort()) !== JSON.stringify(urls.sort())) {
    decisionError('thread URLs must match every owned thread');
  }
}

function reconcileDecisions(previous, current, input) {
  if ((input.decision_answers !== undefined && !Array.isArray(input.decision_answers))
    || (input.decision_residuals !== undefined && !Array.isArray(input.decision_residuals))) {
    decisionError('decision requests must be arrays');
  }
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const matches = source => sourceObservation(current, source) !== null
    && same(source.observation, sourceObservation(current, source));
  // Payloads stay in hash-bound private artifacts; the journal stores only identities and refs.
  let decisions = (previous && previous.human_decisions || []).filter(record => record.sources.every(matches));
  const answers = (previous && previous.answered_human_decisions || []).filter(record => record.sources.some(matches));
  for (const request of input.decision_answers || []) {
    const record = decisions.find(item => item.decision_id === request.decision_id);
    const answer = readDecisionArtifact(request);
    if (!answer || typeof answer.answer !== 'string' || !answer.answer.trim()) decisionError('an exact human answer is required');
    if (!record) {
      const existing = answers.find(item => item.decision_id === request.decision_id);
      if (existing && same(readDecisionArtifact(existing.answer_ref), answer)) continue;
      decisionError('answer must name a current decision');
    }
    answers.push({ ...record, answer_ref: { path: request.path, sha256: request.sha256 } });
    decisions = decisions.filter(item => item !== record);
  }
  for (const ref of input.decision_residuals || []) {
    const payload = readDecisionArtifact(ref);
    validateResidual(payload, current);
    const sources = payload.sources.map(source => ({
      kind: source.kind, id: source.id, observation: sourceObservation(current, source),
    })).sort((a, b) => sourceKey(a).localeCompare(sourceKey(b)));
    if (!previous || !sources.every(source => same(source.observation, sourceObservation(previous, source)))) {
      decisionError('source changed since the caller observation; investigate again');
    }
    if (answers.some(answer => answer.sources.some(source => matches(source)
      && sources.some(item => sourceKey(item) === sourceKey(source))))) decisionError('source already has a recorded answer');
    const decisionId = 'decision:' + sha256(JSON.stringify([ref.sha256, sources]));
    if (decisions.some(record => record.decision_id === decisionId)) continue;
    if (decisions.some(record => record.sources.some(source => sources.some(item => sourceKey(item) === sourceKey(source))))) {
      decisionError('source already belongs to a current decision');
    }
    decisions.push({ decision_id: decisionId, residual_ref: { path: ref.path, sha256: ref.sha256 }, sources });
  }
  const payloads = decisions.map(record => {
    const payload = readDecisionArtifact(record.residual_ref);
    validateResidual(payload, current);
    return payload;
  });
  const answered = answers.map(record => ({
    decision_id: record.decision_id,
    residual: readDecisionArtifact(record.residual_ref),
    answer: readDecisionArtifact(record.answer_ref).answer,
    sources: record.sources.filter(matches).map(({ kind, id }) => ({ kind, id })),
  }));
  return { decisions, answers, payloads, answered };
}

function readChain(stateDir) {
  const rootHash = sha256('spec-lfg-pr-watch-state/v1:root\n');
  inspectStateLocation(stateDir);
  if (!fs.existsSync(stateDir)) return { generation: 0, sha256: rootHash, state: null, warnings: [] };
  let generation = 0;
  let digest = rootHash;
  let state = null;
  const warnings = [];
  const entries = fs.readdirSync(stateDir).filter((entry) => /^\d{6}\.json$/.test(entry)).sort();
  for (const entry of entries) {
    const expected = String(generation + 1).padStart(6, '0') + '.json';
    if (entry !== expected) {
      warnings.push('ignored non-contiguous state snapshot: ' + entry);
      break;
    }
    try {
      const file = path.join(stateDir, entry);
      inspectPrivateFile(file);
      const raw = fs.readFileSync(file, 'utf8');
      const candidate = JSON.parse(raw);
      if (candidate.schema_version !== SCHEMA_VERSION || candidate.generation !== generation + 1
        || candidate.previous_generation !== generation || candidate.previous_sha256 !== digest) {
        throw new Error('invalid chain');
      }
      normalizePrUrl(candidate.pr_url);
      generation = candidate.generation;
      digest = sha256(raw);
      state = candidate;
    } catch (_error) {
      warnings.push('ignored invalid state snapshot: ' + entry);
      break;
    }
  }
  return { generation, sha256: digest, state, warnings };
}

function derive(previous, current, budgetSeconds, decisions) {
  const now = Date.parse(current.observed_at);
  const firstObservedAt = previous ? Date.parse(previous.first_observed_at) : now;
  const elapsedSeconds = Math.max(0, Math.floor((now - firstObservedAt) / 1000));
  const identity = observationIdentity(current);
  const changed = !previous || previous.observation_identity !== identity;
  const lastChangedAt = changed ? current.observed_at : previous.last_changed_at;
  const quietSeconds = Math.max(0, Math.floor((now - Date.parse(lastChangedAt)) / 1000));
  const failingChecks = current.checks.filter((check) => FAILING.has(check.conclusion || check.status)).map((check) => check.key);
  const pendingChecks = current.checks.filter((check) => ['QUEUED', 'IN_PROGRESS', 'PENDING', 'WAITING'].includes(check.status)).map((check) => check.key);
  const allChecksOk = current.checks.length > 0 && current.checks.every(check =>
    check.status === 'COMPLETED' && ['SUCCESS', 'NEUTRAL', 'SKIPPED'].includes(check.conclusion));
  const covered = new Set(decisions.flatMap(record => record.sources.map(sourceKey)));
  const actionableChecks = failingChecks.filter(id => !covered.has(sourceKey({ kind: 'check', id })));
  const needsHuman = stable(decisions.flatMap(record => record.sources.map(source => source.id)));
  const openReview = current.review_items.filter(item => !covered.has(sourceKey(item))).map(item => item.id);
  const baseAdvanced = Boolean(previous && previous.base_oid !== current.base_oid);
  const headChanged = Boolean(previous && previous.head_sha !== current.head_sha);
  const baseStale = ['BEHIND', 'DIRTY'].includes(current.merge_state_status) || baseAdvanced;
  let terminal = 'watching';
  let reasonCode = 'no-terminal';
  if (current.pr_state !== 'OPEN') [terminal, reasonCode] = ['terminal', current.pr_state === 'MERGED' ? 'pr-merged' : 'pr-closed'];
  else if (!current.remote_available) [terminal, reasonCode] = ['local-only', 'no-remote'];
  else if (elapsedSeconds >= budgetSeconds) [terminal, reasonCode] = ['budget-exhausted', 'active-budget-exhausted'];
  else if (needsHuman.length > 0 && openReview.length === 0 && actionableChecks.length === 0
    && pendingChecks.length === 0 && (!baseStale || covered.has(sourceKey({ kind: 'currency', id: currencyKey(current) })))) {
    [terminal, reasonCode] = ['manual-blocker', 'needs-human'];
  } else if (baseStale && current.repo_policy.branch_currency_update !== 'non-rewriting'
    && openReview.length === 0 && actionableChecks.length === 0 && pendingChecks.length === 0) {
    [terminal, reasonCode] = ['manual-blocker', 'branch-currency-update-required'];
  } else if (decisions.length === 0 && allChecksOk && openReview.length === 0
    && !baseStale && current.mergeable === 'MERGEABLE' && current.merge_state_status === 'CLEAN'
    && quietSeconds >= 300) {
    [terminal, reasonCode] = ['looks-ready', 'green-review-clear-current'];
  }
  return {
    first_observed_at: previous ? previous.first_observed_at : current.observed_at,
    last_changed_at: lastChangedAt,
    observation_identity: identity,
    elapsed_seconds: elapsedSeconds,
    quiet_seconds: quietSeconds,
    changed_this_tick: changed,
    head_changed: headChanged,
    base_advanced: baseAdvanced,
    base_stale: baseStale,
    failing_checks: failingChecks,
    actionable_checks: actionableChecks,
    pending_checks: pendingChecks,
    open_review_items: openReview,
    needs_human_items: needsHuman,
    terminal,
    reason_code: reasonCode,
  };
}

function main() {
  const argv = process.argv.slice(2);
  const command = argv[0] === 'read' || argv[0] === 'snapshot' ? argv.shift() : 'snapshot';
  if (command === 'read') {
    const stateDirIndex = argv.indexOf('--state-dir');
    const stateDir = stateDirIndex >= 0 ? argv[stateDirIndex + 1] : '';
    if (!stateDir) fail('invalid-arguments', ['read requires --state-dir'], 2);
    const chain = readChain(path.resolve(stateDir));
    process.stdout.write(JSON.stringify({
      status: 'read',
      reason_code: chain.generation === 0 ? 'generation-zero' : 'read',
      schema_version: SCHEMA_VERSION,
      generation: chain.generation,
      snapshot_sha256: chain.sha256,
      state: chain.state,
      warnings: chain.warnings,
    }, null, 2) + '\n');
    return;
  }
  const args = parseArgs(argv);
  const input = readInput(path.resolve(args.input));
  const current = normalize(input);
  const stateDir = path.resolve(args.stateDir);
  const stateLocation = inspectStateLocation(stateDir);
  const chain = readChain(stateDir);
  if (chain.generation !== args.expectedGeneration || chain.sha256 !== args.expectedSha256) {
    fail('pr-watch-state-conflict', [
      'expected ' + args.expectedGeneration + '/' + args.expectedSha256
        + ', actual ' + chain.generation + '/' + chain.sha256,
    ]);
  }
  if (chain.state && (chain.state.pr_number !== current.pr_number || chain.state.pr_url !== current.pr_url)) {
    fail('snapshot-invalid', ['state belongs to another PR']);
  }
  const decisionState = reconcileDecisions(chain.state, current, input);
  const derived = derive(chain.state, current, args.budgetSeconds, decisionState.decisions);
  const generation = chain.generation + 1;
  const state = {
    schema_version: SCHEMA_VERSION,
    generation,
    previous_generation: chain.generation,
    previous_sha256: chain.sha256,
    captured_at: new Date().toISOString(),
    ...current,
    ...derived,
    human_decisions: decisionState.decisions,
    answered_human_decisions: decisionState.answers,
  };
  ensureStateDirectory(stateDir, stateLocation);
  const file = path.join(stateDir, String(generation).padStart(6, '0') + '.json');
  const serialized = JSON.stringify(state, null, 2) + '\n';
  try {
    fs.writeFileSync(file, serialized, { flag: 'wx', mode: 0o600 });
  } catch (error) {
    fail(error.code === 'EEXIST' ? 'pr-watch-state-conflict' : 'pr-watch-state-write-failed', [error.message]);
  }
  process.stdout.write(JSON.stringify({
    status: 'written',
    reason_code: state.reason_code,
    schema_version: SCHEMA_VERSION,
    generation,
    snapshot_sha256: sha256(serialized),
    events: {
      review: state.open_review_items,
      ci: state.actionable_checks,
      branch_currency: state.base_stale && !state.human_decisions.some(record =>
        record.sources.some(source => source.kind === 'currency' && source.id === currencyKey(current))),
      head_changed: state.head_changed,
      base_advanced: state.base_advanced,
    },
    terminal: state.terminal,
    branch_currency_key: state.base_stale ? currencyKey(current) : null,
    needs_human_residuals: decisionState.payloads,
    human_decisions: state.human_decisions.map((record, index) => ({
      decision_id: record.decision_id, residual: decisionState.payloads[index],
    })),
    answered_human_decisions: decisionState.answered,
    quiet_seconds: state.quiet_seconds,
    elapsed_seconds: state.elapsed_seconds,
    limitations: state.limitations,
    warnings: chain.warnings,
  }, null, 2) + '\n');
}

main();
