#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { validateAgainstSchema } = require('../src/contracts/schema-validator');
const { validateArtifacts } = require('../skills/spec-standards/scripts/validate-artifacts');

const REPO_ROOT = path.join(__dirname, '..');
const STANDARDS_DIR = '.spec-first/standards';
const PROJECT_SHAPE_PATH = '.spec-first/standards/project-shape.json';
const STANDARDS_PLAN_PATH = '.spec-first/standards/standards-plan.json';
const GLUE_MAP_PATH = '.spec-first/standards/glue-map.json';
const STANDARDS_CANDIDATES_PATH = '.spec-first/standards/standards-candidates.json';
const STANDARDS_PREVIEW_PATH = '.spec-first/standards/standards-preview.md';
const STANDARDS_UPDATE_DECISION_PATH = '.spec-first/standards/standards-update-decision.json';
const IMPORTED_STANDARDS_PATH = '.spec-first/standards/imported-standards.json';
const REPO_PROFILE_PATH = '.spec-first/specs/repo-profile.yaml';
const STANDARDS_VALIDATOR_PATH = 'skills/spec-standards/scripts/validate-artifacts.js';
const STANDARDS_EXPERT_BRIEF_SCHEMA = 'src/cli/contracts/agent-registry/standards-expert-brief.schema.json';
const ROUTER_CANDIDATE_SCHEMA = 'src/cli/contracts/agent-registry/router-candidate-output.schema.json';

const SUPPORTED_WORKFLOWS = ['spec-plan', 'spec-code-review', 'spec-doc-review', 'spec-skill-audit', 'spec-work'];

const CONSUMPTION_MODES = {
  confirmed: 'hard',
  observed: 'advisory',
  imported: 'advisory',
  suggested: 'advisory',
  conflict: 'risk',
  unknown: 'question',
  deprecated: 'risk',
  drifted: 'risk',
};

const STANDARDS_AWARE_AGENTS = {
  'spec-project-standards-reviewer': {
    workflows: ['spec-plan', 'spec-code-review', 'spec-doc-review', 'spec-skill-audit', 'spec-work'],
    standards_use_case: 'project_standard_compliance',
  },
  'spec-architecture-strategist': {
    workflows: ['spec-plan'],
    standards_use_case: 'architecture_boundary_standards',
  },
  'spec-api-contract-reviewer': {
    workflows: ['spec-plan', 'spec-code-review'],
    standards_use_case: 'api_contract_standards',
  },
  'spec-testing-reviewer': {
    workflows: ['spec-code-review'],
    standards_use_case: 'verification_standards',
  },
  'spec-code-simplicity-reviewer': {
    workflows: ['spec-plan', 'spec-code-review', 'spec-skill-audit', 'spec-work'],
    standards_use_case: 'simplicity_and_reuse_standards',
  },
  'spec-correctness-reviewer': {
    workflows: ['spec-code-review'],
    standards_use_case: 'behavioral_standard_regression',
  },
  'spec-security-reviewer': {
    workflows: ['spec-code-review'],
    standards_use_case: 'security_standard_compliance',
  },
  'spec-coherence-reviewer': {
    workflows: ['spec-doc-review'],
    standards_use_case: 'document_standard_coherence',
  },
  'spec-feasibility-reviewer': {
    workflows: ['spec-plan', 'spec-doc-review'],
    standards_use_case: 'implementation_feasibility_standards',
  },
  'spec-scope-guardian-reviewer': {
    workflows: ['spec-doc-review'],
    standards_use_case: 'scope_boundary_standards',
  },
  'spec-agent-native-reviewer': {
    workflows: ['spec-skill-audit'],
    standards_use_case: 'agent_native_standards',
  },
  'spec-cli-readiness-reviewer': {
    workflows: ['spec-skill-audit'],
    standards_use_case: 'cli_delivery_standards',
  },
  'spec-cli-agent-readiness-reviewer': {
    workflows: ['spec-skill-audit'],
    standards_use_case: 'agent_delivery_standards',
  },
  'spec-security-sentinel': {
    workflows: ['spec-skill-audit'],
    standards_use_case: 'governance_security_standards',
  },
};

const DEFAULT_STANDARDS_AWARE_AGENTS_BY_WORKFLOW = {
  'spec-plan': [
    'spec-project-standards-reviewer',
    'spec-architecture-strategist',
    'spec-api-contract-reviewer',
    'spec-code-simplicity-reviewer',
    'spec-feasibility-reviewer',
  ],
  'spec-code-review': [
    'spec-project-standards-reviewer',
    'spec-correctness-reviewer',
    'spec-testing-reviewer',
    'spec-api-contract-reviewer',
    'spec-security-reviewer',
    'spec-code-simplicity-reviewer',
  ],
  'spec-doc-review': [
    'spec-project-standards-reviewer',
    'spec-coherence-reviewer',
    'spec-feasibility-reviewer',
    'spec-scope-guardian-reviewer',
  ],
  'spec-skill-audit': [
    'spec-agent-native-reviewer',
    'spec-project-standards-reviewer',
    'spec-cli-readiness-reviewer',
    'spec-cli-agent-readiness-reviewer',
    'spec-code-simplicity-reviewer',
    'spec-security-sentinel',
  ],
  'spec-work': [
    'spec-project-standards-reviewer',
    'spec-code-simplicity-reviewer',
  ],
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadSchema(relativePath) {
  return readJson(path.join(REPO_ROOT, relativePath));
}

function validateOrThrow(schemaPath, value, label) {
  const result = validateAgainstSchema(loadSchema(schemaPath), value);
  if (!result.valid) {
    throw new Error(`${label} failed schema validation: ${result.errors.join('; ')}`);
  }
}

function normalizeList(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim()) : [];
}

function uniqueSorted(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function assertSupportedWorkflow(workflow) {
  if (!SUPPORTED_WORKFLOWS.includes(workflow)) {
    throw new Error(`unsupported workflow for standards expert brief: ${workflow}`);
  }
}

function artifactFullPath(repoRoot, relativePath) {
  if (relativePath.startsWith('skills/') || relativePath.startsWith('src/')) {
    return path.join(REPO_ROOT, relativePath);
  }
  return path.join(repoRoot, relativePath);
}

function artifactStatus(repoRoot) {
  return [
    [PROJECT_SHAPE_PATH, 'json'],
    [STANDARDS_PLAN_PATH, 'json'],
    [GLUE_MAP_PATH, 'json'],
    [STANDARDS_CANDIDATES_PATH, 'json'],
    [STANDARDS_PREVIEW_PATH, 'markdown'],
    [STANDARDS_UPDATE_DECISION_PATH, 'json'],
    [IMPORTED_STANDARDS_PATH, 'json'],
    [REPO_PROFILE_PATH, 'yaml'],
    [STANDARDS_VALIDATOR_PATH, 'script'],
  ].map(([relativePath, kind]) => {
    const fullPath = artifactFullPath(repoRoot, relativePath);
    const exists = fs.existsSync(fullPath);
    return {
      path: relativePath,
      exists,
      kind,
      size_bytes: exists ? fs.statSync(fullPath).size : null,
    };
  });
}

function readOptionalJson(repoRoot, relativePath) {
  const fullPath = artifactFullPath(repoRoot, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  try {
    return readJson(fullPath);
  } catch (_error) {
    return null;
  }
}

function hasArtifact(statuses, relativePath) {
  const item = statuses.find((entry) => entry.path === relativePath);
  return item && item.exists;
}

function runValidation(repoRoot, statuses, allowFallbackVocabulary) {
  if (!hasArtifact(statuses, STANDARDS_CANDIDATES_PATH) || !hasArtifact(statuses, STANDARDS_PREVIEW_PATH)) {
    return {
      available: false,
      status: null,
      trust_level: null,
      errors_count: 0,
      warnings_count: 0,
      reason_codes: ['standards_candidates_or_preview_missing'],
      raw: null,
    };
  }

  const raw = validateArtifacts({
    standardsDir: STANDARDS_DIR,
    json: true,
    allowFallbackVocabulary,
  }, repoRoot);
  return {
    available: true,
    status: raw.status || null,
    trust_level: raw.trust_level || null,
    errors_count: Array.isArray(raw.errors) ? raw.errors.length : 0,
    warnings_count: Array.isArray(raw.warnings) ? raw.warnings.length : 0,
    reason_codes: uniqueSorted([
      ...normalizeList((raw.errors || []).map((issue) => issue.reason_code)),
      ...normalizeList((raw.warnings || []).map((issue) => issue.reason_code)),
    ]),
    raw,
  };
}

function updateDecision(repoRoot) {
  return readOptionalJson(repoRoot, STANDARDS_UPDATE_DECISION_PATH);
}

function updateNeedsRefresh(decision) {
  if (!decision || typeof decision.recommendation !== 'string') return false;
  return !['keep', 'current', 'no-op', 'none'].includes(decision.recommendation);
}

function resolveReadiness(statuses, validation, decision) {
  const reasonCodes = [...validation.reason_codes];
  const limitations = [];
  const missingRequired = [
    STANDARDS_CANDIDATES_PATH,
    STANDARDS_PREVIEW_PATH,
  ].filter((relativePath) => !hasArtifact(statuses, relativePath));

  for (const relativePath of missingRequired) {
    reasonCodes.push(`${path.basename(relativePath).replace(/[^a-z0-9]+/gi, '_').toLowerCase()}_missing`);
  }

  if (missingRequired.length > 0) {
    limitations.push('Standards candidates or preview artifacts are missing; downstream experts must not treat standards as hard constraints.');
    return buildReadiness('missing', reasonCodes, limitations);
  }

  if (!validation.available || validation.status !== 'pass') {
    reasonCodes.push('standards_validation_failed');
    limitations.push('Standards artifact validation did not pass; use candidates only as degraded context after inspecting errors.');
    return buildReadiness('invalid', reasonCodes, limitations);
  }

  if (validation.trust_level === 'degraded') {
    reasonCodes.push('standards_validation_degraded');
    limitations.push('Standards validation passed only in degraded mode; confirmed candidates are not hard context.');
    return buildReadiness('degraded', reasonCodes, limitations);
  }

  if (updateNeedsRefresh(decision)) {
    reasonCodes.push(`standards_update_recommendation:${decision.recommendation}`);
    limitations.push('Standards update decision recommends refresh; use existing candidates as advisory context until refreshed.');
    return buildReadiness('stale', reasonCodes, limitations);
  }

  reasonCodes.push('standards_validation_trusted');
  return buildReadiness('trusted', reasonCodes, limitations);
}

function buildReadiness(status, reasonCodes, limitations) {
  return {
    status,
    confidence: status === 'trusted' ? 'high' : status === 'degraded' ? 'medium' : status === 'stale' ? 'low' : 'unknown',
    limitations_required: status !== 'trusted',
    reason_codes: uniqueSorted(reasonCodes),
    effective_hard_context_enabled: status === 'trusted',
    limitations: uniqueSorted(limitations),
  };
}

function candidateRefs(candidatesDoc) {
  const candidates = candidatesDoc && Array.isArray(candidatesDoc.candidates) ? candidatesDoc.candidates : [];
  return candidates.map((candidate) => ({
    id: String(candidate.id || ''),
    domain: String(candidate.domain || ''),
    type: String(candidate.type || ''),
    status: String(candidate.status || 'unknown'),
    consumption_mode: CONSUMPTION_MODES[candidate.status] || 'question',
    confidence: String(candidate.confidence || 'unknown'),
    source_type: String(candidate.source_type || 'unknown'),
    evidence_count: Array.isArray(candidate.evidence) ? candidate.evidence.length : 0,
    downstream_usage: normalizeList(candidate.downstream_usage),
  })).filter((candidate) => candidate.id);
}

function candidateSummary(candidatesDoc, readiness) {
  const refs = candidateRefs(candidatesDoc);
  const confirmed = refs.filter((candidate) => candidate.status === 'confirmed').map((candidate) => candidate.id);
  const advisory = refs
    .filter((candidate) => candidate.consumption_mode === 'advisory')
    .map((candidate) => candidate.id);
  const risk = refs
    .filter((candidate) => candidate.consumption_mode === 'risk')
    .map((candidate) => candidate.id);
  const question = refs
    .filter((candidate) => candidate.consumption_mode === 'question')
    .map((candidate) => candidate.id);

  const hardContextEnabled = readiness.effective_hard_context_enabled;
  return {
    status_counts: candidatesDoc && candidatesDoc.status_counts && typeof candidatesDoc.status_counts === 'object' ? candidatesDoc.status_counts : {},
    candidate_refs: refs,
    hard_context_candidate_ids: hardContextEnabled ? uniqueSorted(confirmed) : [],
    advisory_context_candidate_ids: uniqueSorted(hardContextEnabled ? advisory : [...confirmed, ...advisory]),
    risk_context_candidate_ids: uniqueSorted(risk),
    question_context_candidate_ids: uniqueSorted(question),
  };
}

function validateRouterContext(workflow, routerCandidates) {
  if (!routerCandidates) return null;
  validateOrThrow(ROUTER_CANDIDATE_SCHEMA, routerCandidates, 'router candidate facts');
  if (routerCandidates.workflow !== workflow) {
    throw new Error(`router candidate workflow mismatch: expected ${workflow}, received ${routerCandidates.workflow}`);
  }
  return routerCandidates;
}

function isStandardsAwareForWorkflow(agentId, workflow) {
  const entry = STANDARDS_AWARE_AGENTS[agentId];
  return entry && entry.workflows.includes(workflow);
}

function routerSummary(workflow, routerCandidates) {
  const candidateAgents = routerCandidates
    ? (routerCandidates.candidate_agents || []).map((candidate) => candidate.id)
    : DEFAULT_STANDARDS_AWARE_AGENTS_BY_WORKFLOW[workflow] || [];
  const standardsAware = candidateAgents.filter((agentId) => isStandardsAwareForWorkflow(agentId, workflow));
  const nonStandards = candidateAgents.filter((agentId) => !isStandardsAwareForWorkflow(agentId, workflow));
  return {
    available: routerCandidates != null,
    reason_code: routerCandidates ? routerCandidates.reason_code : null,
    candidate_agents: uniqueSorted(candidateAgents),
    standards_aware_candidate_agents: uniqueSorted(standardsAware),
    non_standards_candidate_agents: uniqueSorted(nonStandards),
    requires_skill_decision: routerCandidates ? routerCandidates.requires_skill_decision === true : true,
  };
}

function readinessCeiling(status) {
  if (status === 'trusted') return 'high';
  if (status === 'degraded') return 'medium';
  if (status === 'stale') return 'low';
  return 'unknown';
}

function allowedUse(readiness) {
  if (readiness.status === 'trusted') return 'hard_context';
  if (readiness.status === 'missing' || readiness.status === 'invalid') return 'unavailable';
  return 'advisory_context';
}

function allowedStandardsArtifacts(readiness) {
  return [
    STANDARDS_CANDIDATES_PATH,
    STANDARDS_PREVIEW_PATH,
    STANDARDS_PLAN_PATH,
    GLUE_MAP_PATH,
    REPO_PROFILE_PATH,
  ].map((artifactPath) => ({
    path: artifactPath,
    allowed_use: allowedUse(readiness),
  }));
}

function requiredDisclosures(readiness, validation) {
  const disclosures = [];
  if (readiness.status !== 'trusted') disclosures.push(`standards_readiness:${readiness.status}`);
  disclosures.push(...readiness.reason_codes.filter((code) => (
    code.includes('missing') || code.includes('failed') || code.includes('degraded') || code.includes('recommendation')
  )));
  if (validation.available && validation.status !== 'pass') disclosures.push(`validation_status:${validation.status}`);
  if (validation.trust_level === 'degraded') disclosures.push('validation_trust_level:degraded');
  return uniqueSorted(disclosures);
}

function fallbackGuidance(readiness) {
  if (readiness.status === 'trusted') {
    return [
      'Use confirmed candidates as hard context and use observed/imported/suggested candidates only as advisory context.',
    ];
  }
  if (readiness.status === 'stale') {
    return [
      'Refresh standards artifacts before treating confirmed candidates as hard constraints.',
    ];
  }
  if (readiness.status === 'degraded') {
    return [
      'Disclose degraded standards validation and use all candidates as advisory context only.',
    ];
  }
  if (readiness.status === 'invalid') {
    return [
      'Run the spec-standards validator and inspect errors before using standards findings as authoritative evidence.',
    ];
  }
  return [
    'Run spec-standards to generate standards-candidates.json and standards-preview.md before standards-aware expert review.',
  ];
}

function forbiddenClaims(readiness) {
  const claims = [
    'selected_agents',
    'final_verdict',
    'confirmed_standards_write',
    'repo_profile_modified',
    'hard_constraint_from_non_confirmed_candidate',
    'hard_constraint_from_observed_or_imported_candidate',
  ];
  if (readiness.status !== 'trusted') {
    claims.push('hard_constraint_from_standards_candidate');
    claims.push('blocker_based_only_on_degraded_standards');
  }
  return uniqueSorted(claims);
}

function expertStandardsContext(router, readiness, validation, summary) {
  return router.standards_aware_candidate_agents.map((agentId) => {
    const agent = STANDARDS_AWARE_AGENTS[agentId];
    return {
      agent_id: agentId,
      standards_use_case: agent.standards_use_case,
      confidence_ceiling: readinessCeiling(readiness.status),
      hard_context_candidate_ids: summary.hard_context_candidate_ids,
      advisory_context_candidate_ids: summary.advisory_context_candidate_ids,
      risk_context_candidate_ids: summary.risk_context_candidate_ids,
      question_context_candidate_ids: summary.question_context_candidate_ids,
      required_disclosures: requiredDisclosures(readiness, validation),
      fallback_guidance: fallbackGuidance(readiness),
      allowed_standards_artifacts: allowedStandardsArtifacts(readiness),
      forbidden_claims: forbiddenClaims(readiness),
      requires_expert_judgment: true,
    };
  });
}

function normalizeInputSummary(input, routerCandidates, allowFallbackVocabulary) {
  const routerInput = routerCandidates && routerCandidates.input_summary ? routerCandidates.input_summary : {};
  return {
    changed_files: uniqueSorted([
      ...normalizeList(input.changed_files),
      ...normalizeList(routerInput.changed_files),
    ]),
    risk_signals: uniqueSorted([
      ...normalizeList(input.risk_signals),
      ...normalizeList(routerInput.risk_signals),
      ...normalizeList(routerInput.inferred_signals),
    ]),
    standards_dir: STANDARDS_DIR,
    router_candidates_available: routerCandidates != null,
    allow_fallback_vocabulary: allowFallbackVocabulary,
  };
}

function prepareStandardsExpertBrief(input = {}, options = {}) {
  const workflow = options.workflow || input.workflow;
  assertSupportedWorkflow(workflow);

  const repoRoot = path.resolve(options.repoRoot || input.repo_root || REPO_ROOT);
  const allowFallbackVocabulary = options.allowFallbackVocabulary === true || input.allow_fallback_vocabulary === true;
  const routerCandidates = validateRouterContext(workflow, options.routerCandidates || input.router_candidates || null);
  const statuses = artifactStatus(repoRoot);
  const validation = runValidation(repoRoot, statuses, allowFallbackVocabulary);
  const decision = updateDecision(repoRoot);
  const readiness = resolveReadiness(statuses, validation, decision);
  const candidatesDoc = readOptionalJson(repoRoot, STANDARDS_CANDIDATES_PATH);
  const summary = candidateSummary(candidatesDoc, readiness);
  const router = routerSummary(workflow, routerCandidates);

  return {
    schema_version: 'spec-first.standards-expert-brief.v1',
    generated_from: 'scripts/prepare-ecc-standards-expert-brief.js',
    workflow,
    source_artifacts: {
      project_shape: PROJECT_SHAPE_PATH,
      standards_plan: STANDARDS_PLAN_PATH,
      glue_map: GLUE_MAP_PATH,
      standards_candidates: STANDARDS_CANDIDATES_PATH,
      standards_preview: STANDARDS_PREVIEW_PATH,
      standards_update_decision: STANDARDS_UPDATE_DECISION_PATH,
      imported_standards: IMPORTED_STANDARDS_PATH,
      repo_profile: REPO_PROFILE_PATH,
      standards_validator: STANDARDS_VALIDATOR_PATH,
      standards_expert_brief_schema: STANDARDS_EXPERT_BRIEF_SCHEMA,
      router_candidate_schema: routerCandidates ? ROUTER_CANDIDATE_SCHEMA : null,
    },
    input_summary: normalizeInputSummary(input, routerCandidates, allowFallbackVocabulary),
    artifact_status: statuses,
    standards_readiness: readiness,
    validation_result: {
      available: validation.available,
      status: validation.status,
      trust_level: validation.trust_level,
      errors_count: validation.errors_count,
      warnings_count: validation.warnings_count,
      reason_codes: validation.reason_codes,
    },
    candidate_summary: summary,
    router_context: router,
    expert_standards_context: expertStandardsContext(router, readiness, validation, summary),
    non_standards_agents: router.non_standards_candidate_agents.map((agentId) => ({
      agent_id: agentId,
      reason_code: 'not_standards_aware_for_workflow',
    })),
    decision_boundary: {
      requires_skill_decision: true,
      requires_expert_judgment: true,
      forbidden_outputs: [
        'selected_agents',
        'final_verdict',
        'confirmed_standards_write',
        'repo_profile_writeback',
      ],
    },
    forbidden_actions: [
      'selected_agents',
      'final_verdict',
      'confirmed_standards_write',
      'repo_profile_writeback',
      'modify_repo_profile',
      'write_standards_artifacts',
      'semantic_adopt_reject_without_skill',
    ],
  };
}

function parseArgs(argv) {
  const result = {
    changed_files: [],
    risk_signals: [],
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--workflow') {
      result.workflow = argv[index + 1];
      index += 1;
    } else if (arg === '--repo-root') {
      result.repo_root = argv[index + 1];
      index += 1;
    } else if (arg === '--router-candidates') {
      result.routerCandidatesPath = argv[index + 1];
      index += 1;
    } else if (arg === '--changed-file') {
      result.changed_files.push(argv[index + 1]);
      index += 1;
    } else if (arg === '--risk-signal') {
      result.risk_signals.push(argv[index + 1]);
      index += 1;
    } else if (arg === '--allow-fallback-vocabulary') {
      result.allow_fallback_vocabulary = true;
    } else if (arg === '--help' || arg === '-h') {
      result.help = true;
    }
  }
  return result;
}

function usage() {
  return [
    'Usage: node scripts/prepare-ecc-standards-expert-brief.js --workflow <spec-plan|spec-code-review|spec-doc-review|spec-skill-audit|spec-work> [--repo-root <path>] [--router-candidates <router-candidates.json>] [--changed-file <path> ...] [--risk-signal <signal> ...] [--allow-fallback-vocabulary]',
    '',
    'Prepares read-only standards evidence-use briefing facts. It does not write standards artifacts, modify repo-profile.yaml, select final agents, or make semantic review decisions.',
  ].join('\n');
}

function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  if (!args.workflow) {
    throw new Error('missing --workflow <spec-plan|spec-code-review|spec-doc-review|spec-skill-audit|spec-work>');
  }
  const routerCandidates = args.routerCandidatesPath ? readJson(args.routerCandidatesPath) : null;
  const output = prepareStandardsExpertBrief({
    workflow: args.workflow,
    repo_root: args.repo_root,
    changed_files: args.changed_files,
    risk_signals: args.risk_signals,
    allow_fallback_vocabulary: args.allow_fallback_vocabulary === true,
    router_candidates: routerCandidates,
  });
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
  CONSUMPTION_MODES,
  DEFAULT_STANDARDS_AWARE_AGENTS_BY_WORKFLOW,
  STANDARDS_AWARE_AGENTS,
  candidateSummary,
  prepareStandardsExpertBrief,
  resolveReadiness,
};
