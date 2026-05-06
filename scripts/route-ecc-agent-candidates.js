#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..');
const GENERATED_DIR = path.join(REPO_ROOT, 'docs', '02-架构设计', 'ECC集成', 'generated');

const DEFAULT_REGISTRY_PATH = path.join(GENERATED_DIR, 'agent-registry.json');
const DEFAULT_PACKS_PATH = path.join(GENERATED_DIR, 'agent-packs.json');
const DEFAULT_POLICY_PATH = path.join(GENERATED_DIR, 'router-candidate-policy.json');

const BASELINE_AGENTS_BY_WORKFLOW = {
  'spec-code-review': [
    'spec-correctness-reviewer',
    'spec-testing-reviewer',
    'spec-maintainability-reviewer',
    'spec-code-simplicity-reviewer',
    'spec-project-standards-reviewer',
  ],
  'spec-plan': [
    'spec-architecture-strategist',
    'spec-repo-research-analyst',
    'spec-feasibility-reviewer',
    'spec-code-simplicity-reviewer',
  ],
  'spec-doc-review': [
    'spec-coherence-reviewer',
    'spec-feasibility-reviewer',
    'spec-scope-guardian-reviewer',
  ],
  'spec-skill-audit': [
    'spec-agent-native-reviewer',
    'spec-project-standards-reviewer',
    'spec-cli-readiness-reviewer',
    'spec-code-simplicity-reviewer',
    'spec-security-sentinel',
  ],
};

const SIGNAL_RULES = [
  [/auth|session|permission|authorization/i, ['auth', 'authorization', 'permission']],
  [/token|secret|credential/i, ['token', 'secret']],
  [/pii|personal.?data|privacy/i, ['pii']],
  [/api|route|endpoint/i, ['api_changed']],
  [/openapi|swagger/i, ['openapi_changed']],
  [/dto|serializer|schema/i, ['dto_changed', 'schema']],
  [/migration|migrations/i, ['migration']],
  [/\bsql\b|database|db\//i, ['sql', 'database']],
  [/cache|memo/i, ['cache', 'performance']],
  [/loop|render|concurr|async/i, ['loop', 'render', 'concurrency', 'frontend_async']],
  [/\.(tsx)$/i, ['tsx', 'typescript', 'ui']],
  [/\.(ts)$/i, ['typescript']],
  [/\.(py)$/i, ['python']],
  [/rails|gemfile|app\/models|app\/controllers/i, ['rails']],
  [/swift|ios|kmp|android/i, ['ios', 'mobile', 'kmp']],
  [/figma|design/i, ['figma', 'design']],
  [/slack|issue|jira|comment/i, ['team_context', 'issues']],
  [/skills\/|agents\/|src\/cli\/|templates\/|contracts\//i, ['harness_governance']],
  [/docs\/.*typo|readme.*typo/i, ['docs_low_risk']],
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function toRepoRelative(filePath) {
  return path.relative(REPO_ROOT, filePath).split(path.sep).join('/');
}

function normalizeList(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim()) : [];
}

function uniqueSorted(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function inferRiskSignalsFromFiles(changedFiles = []) {
  const inferred = [];
  for (const filePath of changedFiles) {
    for (const [pattern, signals] of SIGNAL_RULES) {
      if (pattern.test(filePath)) inferred.push(...signals);
    }
  }
  return uniqueSorted(inferred);
}

function loadDefaultFacts(options = {}) {
  const registryPath = options.registryPath || DEFAULT_REGISTRY_PATH;
  const packsPath = options.packsPath || DEFAULT_PACKS_PATH;
  const policyPath = options.policyPath || DEFAULT_POLICY_PATH;
  return {
    registry: readJson(registryPath),
    packs: readJson(packsPath),
    policy: readJson(policyPath),
    sourceArtifacts: {
      registry: toRepoRelative(registryPath),
      packs: toRepoRelative(packsPath),
      policy: toRepoRelative(policyPath),
    },
  };
}

function priorityWeight(priority) {
  if (priority === 'P0') return 30;
  if (priority === 'P1') return 20;
  if (priority === 'P2') return 10;
  return 0;
}

function budgetHint(score) {
  if (score >= 90) return 'high';
  if (score >= 55) return 'medium';
  if (score >= 20) return 'small';
  return 'tiny';
}

function packMap(packs) {
  return new Map((packs.packs || []).map((pack) => [pack.id, pack]));
}

function packDefaultEnabled(entry, packsById) {
  return (entry.packs || []).some((packId) => {
    const pack = packsById.get(packId);
    return pack && pack.default_enabled;
  });
}

function triggerHits(entry, signals) {
  const triggerSignals = new Set(entry.trigger_signals || []);
  return [...signals].filter((signal) =>
    (triggerSignals.has(signal) || impliedSignalForAgent(signal, entry)) && signalAppliesToAgent(signal, entry),
  );
}

function impliedSignalForAgent(signal, entry) {
  const id = `${entry.id} ${entry.canonical_id}`.toLowerCase();
  if (signal === 'api_changed' || signal === 'openapi_changed' || signal === 'dto_changed') {
    return id.includes('api-contract');
  }
  return false;
}

function signalAppliesToAgent(signal, entry) {
  const id = `${entry.id} ${entry.canonical_id}`.toLowerCase();
  if (signal === 'typescript') return id.includes('typescript');
  if (signal === 'python') return id.includes('python');
  if (signal === 'rails') return id.includes('rails');
  if (signal === 'tsx' || signal === 'frontend_async') return id.includes('frontend') || id.includes('typescript') || id.includes('design');
  if (signal === 'ios' || signal === 'mobile' || signal === 'kmp') return id.includes('swift') || id.includes('ios') || id.includes('design');
  if (signal === 'figma') return id.includes('figma') || id.includes('design');
  if (signal === 'team_context' || signal === 'issues') return id.includes('slack') || id.includes('issue') || id.includes('comment');
  return true;
}

function baselineBonus(entryId, workflow) {
  const baseline = BASELINE_AGENTS_BY_WORKFLOW[workflow] || [];
  const index = baseline.indexOf(entryId);
  return index === -1 ? 0 : baseline.length - index;
}

function routeCandidates(input, facts = loadDefaultFacts()) {
  const workflow = input && input.workflow;
  if (!workflow || typeof workflow !== 'string') {
    throw new Error('router candidate input requires workflow');
  }

  const changedFiles = normalizeList(input.changed_files);
  const explicitSignals = normalizeList(input.risk_signals);
  const inferredSignals = inferRiskSignalsFromFiles(changedFiles);
  const signals = new Set([...explicitSignals, ...inferredSignals]);
  const packsById = packMap(facts.packs);
  const policyCap = facts.policy.workflow_caps && facts.policy.workflow_caps[workflow];
  const candidateLimit = input.max_candidates || policyCap || 5;
  const baseline = new Set(BASELINE_AGENTS_BY_WORKFLOW[workflow] || []);
  const lowRisk = signals.has('low_risk_typo') || (signals.has('docs_low_risk') && changedFiles.length <= 1);

  if (lowRisk) {
    return buildOutput({
      workflow,
      sourceArtifacts: facts.sourceArtifacts,
      changedFiles,
      explicitSignals,
      inferredSignals,
      candidateLimit,
      candidateAgents: [],
      excludedByPolicy: [],
      reasonCode: 'low_risk_short_circuit',
      forbiddenFields: facts.policy.forbidden_fields || [],
    });
  }

  const candidates = [];
  for (const entry of facts.registry.entries || []) {
    if (!(entry.allowed_workflows || []).includes(workflow)) continue;

    let score = priorityWeight(entry.priority);
    const reasonCodes = [];
    const hits = triggerHits(entry, signals);

    if (baseline.has(entry.id)) {
      score += 45 + baselineBonus(entry.id, workflow);
      reasonCodes.push('workflow_baseline_candidate');
    }
    if (hits.length > 0) {
      score += 70 + hits.length * 5;
      reasonCodes.push(...hits.map((signal) => `risk_signal:${signal}`));
    }
    if (packDefaultEnabled(entry, packsById)) {
      score += 10;
      reasonCodes.push('default_pack_candidate');
    }

    if (baseline.has(entry.id) || hits.length > 0) {
      candidates.push({
        id: entry.id,
        canonical_id: entry.canonical_id,
        priority: entry.priority,
        packs: entry.packs || [],
        reason_codes: uniqueSorted(reasonCodes),
        score,
        budget_hint: budgetHint(score),
      });
    }
  }

  candidates.sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    const priorityDiff = priorityWeight(right.priority) - priorityWeight(left.priority);
    if (priorityDiff !== 0) return priorityDiff;
    return left.id.localeCompare(right.id);
  });

  const candidateAgents = candidates.slice(0, candidateLimit);
  const excludedByPolicy = candidates.slice(candidateLimit).map((candidate) => ({
    id: candidate.id,
    reason_code: 'candidate_limit_applied',
  }));

  return buildOutput({
    workflow,
    sourceArtifacts: facts.sourceArtifacts,
    changedFiles,
    explicitSignals,
    inferredSignals,
    candidateLimit,
    candidateAgents,
    excludedByPolicy,
    reasonCode: candidateAgents.length > 0 ? 'candidate_facts_ready' : 'no_candidate_after_policy',
    forbiddenFields: facts.policy.forbidden_fields || [],
  });
}

function buildOutput({
  workflow,
  sourceArtifacts,
  changedFiles,
  explicitSignals,
  inferredSignals,
  candidateLimit,
  candidateAgents,
  excludedByPolicy,
  reasonCode,
  forbiddenFields,
}) {
  const outputBudgetHint = aggregateBudgetHint(candidateAgents);
  return {
    schema_version: 'spec-first.agent-router-candidates.v1',
    generated_from: 'scripts/route-ecc-agent-candidates.js',
    workflow,
    source_artifacts: sourceArtifacts,
    input_summary: {
      changed_files: changedFiles,
      risk_signals: uniqueSorted(explicitSignals),
      inferred_signals: inferredSignals,
    },
    candidate_limit: candidateLimit,
    candidate_agents: candidateAgents,
    reason_code: reasonCode,
    budget_hint: outputBudgetHint,
    degraded_mode: {
      enabled: false,
      reasons: [],
    },
    excluded_by_policy: excludedByPolicy,
    requires_skill_decision: true,
    forbidden_fields: forbiddenFields,
  };
}

function aggregateBudgetHint(candidateAgents) {
  const hints = candidateAgents.map((candidate) => candidate.budget_hint);
  if (hints.includes('high')) return 'high';
  if (hints.includes('medium')) return 'medium';
  if (hints.includes('small')) return 'small';
  return 'tiny';
}

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--input') {
      result.inputPath = argv[index + 1];
      index += 1;
    } else if (arg === '--registry') {
      result.registryPath = argv[index + 1];
      index += 1;
    } else if (arg === '--packs') {
      result.packsPath = argv[index + 1];
      index += 1;
    } else if (arg === '--policy') {
      result.policyPath = argv[index + 1];
      index += 1;
    } else if (arg === '--help' || arg === '-h') {
      result.help = true;
    }
  }
  return result;
}

function usage() {
  return [
    'Usage: node scripts/route-ecc-agent-candidates.js --input <router-input.json>',
    '',
    'Produces advisory candidate facts only. Skills/LLMs still decide selected experts.',
  ].join('\n');
}

function readInput(inputPath) {
  if (!inputPath) {
    throw new Error('missing --input <router-input.json>');
  }
  return readJson(inputPath);
}

function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  const input = readInput(args.inputPath);
  const facts = loadDefaultFacts(args);
  const output = routeCandidates(input, facts);
  console.log(`${JSON.stringify(output, null, 2)}\n`);
  return 0;
}

if (require.main === module) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  BASELINE_AGENTS_BY_WORKFLOW,
  DEFAULT_PACKS_PATH,
  DEFAULT_POLICY_PATH,
  DEFAULT_REGISTRY_PATH,
  inferRiskSignalsFromFiles,
  loadDefaultFacts,
  routeCandidates,
};
