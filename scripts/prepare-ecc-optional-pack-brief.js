#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { validateAgainstSchema } = require('../src/contracts/schema-validator');

const REPO_ROOT = path.join(__dirname, '..');
const GENERATED_DIR = path.join(REPO_ROOT, 'docs', '02-架构设计', 'ECC集成', 'generated');

const DEFAULT_REGISTRY_PATH = path.join(GENERATED_DIR, 'agent-registry.json');
const DEFAULT_PACKS_PATH = path.join(GENERATED_DIR, 'agent-packs.json');
const OPTIONAL_PACK_BRIEF_SCHEMA = 'src/cli/contracts/agent-registry/optional-pack-brief.schema.json';
const ROUTER_CANDIDATE_SCHEMA = 'src/cli/contracts/agent-registry/router-candidate-output.schema.json';

const SUPPORTED_WORKFLOWS = [
  'spec-brainstorm',
  'spec-plan',
  'spec-doc-review',
  'spec-code-review',
  'spec-app-consistency-audit',
];

const PACK_EXPLICIT_SIGNALS = {
  'team-context-pack': [
    'explicit_slack',
    'explicit_issues',
    'explicit_team_context',
    'explicit_pr_comments',
  ],
  'external-design-pack': [
    'explicit_figma',
    'explicit_external_design',
  ],
  'style-profile-pack': [
    'explicit_style_profile',
  ],
};

const PACK_EVIDENCE_REQUIREMENTS = {
  'team-context-pack': {
    connector_mode: 'optional_connector',
    required_any_evidence_types: ['slack', 'issues', 'pr_comments'],
  },
  'external-design-pack': {
    connector_mode: 'optional_connector',
    required_any_evidence_types: ['figma'],
  },
  'style-profile-pack': {
    connector_mode: 'none',
    required_any_evidence_types: [],
  },
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function toRepoRelative(filePath) {
  return path.relative(REPO_ROOT, filePath).split(path.sep).join('/');
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
    throw new Error(`unsupported workflow for optional pack brief: ${workflow}`);
  }
}

function loadDefaultFacts(options = {}) {
  const registryPath = options.registryPath || DEFAULT_REGISTRY_PATH;
  const packsPath = options.packsPath || DEFAULT_PACKS_PATH;
  return {
    registry: readJson(registryPath),
    packs: readJson(packsPath),
    sourceArtifacts: {
      registry: toRepoRelative(registryPath),
      packs: toRepoRelative(packsPath),
    },
  };
}

function packEntries(registry) {
  return new Map((registry.entries || []).map((entry) => [entry.id, entry]));
}

function optionalPacks(facts) {
  return (facts.packs.packs || []).filter((pack) => (
    pack.default_enabled === false &&
    (pack.type === 'optional' || pack.type === 'style_profile' || pack.priority === 'P2' || pack.priority === 'P3')
  ));
}

function validateRouterContext(workflow, routerCandidates) {
  if (!routerCandidates) return null;
  validateOrThrow(ROUTER_CANDIDATE_SCHEMA, routerCandidates, 'router candidate facts');
  if (routerCandidates.workflow !== workflow) {
    throw new Error(`router candidate workflow mismatch: expected ${workflow}, received ${routerCandidates.workflow}`);
  }
  return routerCandidates;
}

function routerSummary(workflow, routerCandidates, optionalAgentIds) {
  const candidateAgents = routerCandidates
    ? (routerCandidates.candidate_agents || []).map((candidate) => candidate.id)
    : [];
  const excludedOptionalAgents = routerCandidates
    ? (routerCandidates.excluded_by_policy || [])
      .filter((candidate) => optionalAgentIds.has(candidate.id))
      .map((candidate) => ({
        agent_id: candidate.id,
        reason_code: candidate.reason_code || 'router_excluded_by_policy',
      }))
    : [];
  const optionalCandidateAgents = candidateAgents.filter((agentId) => optionalAgentIds.has(agentId));
  return {
    available: routerCandidates != null,
    workflow,
    reason_code: routerCandidates ? routerCandidates.reason_code : null,
    candidate_agents: uniqueSorted(candidateAgents),
    optional_candidate_agents: uniqueSorted(optionalCandidateAgents),
    non_optional_candidate_agents: uniqueSorted(candidateAgents.filter((agentId) => !optionalAgentIds.has(agentId))),
    excluded_optional_agents: excludedOptionalAgents,
    requires_skill_decision: routerCandidates ? routerCandidates.requires_skill_decision === true : true,
  };
}

function triggerHits(pack, signals) {
  const packSignals = new Set([
    ...normalizeList(pack.trigger_signals),
    ...(PACK_EXPLICIT_SIGNALS[pack.id] || []),
  ]);
  return uniqueSorted([...signals].filter((signal) => packSignals.has(signal)));
}

function explicitActivationSignals(pack, signals) {
  const explicitSignals = new Set(PACK_EXPLICIT_SIGNALS[pack.id] || []);
  return uniqueSorted([...signals].filter((signal) => explicitSignals.has(signal)));
}

function packWorkflowAllowed(pack, workflow) {
  return normalizeList(pack.default_workflows).includes(workflow);
}

function packAgentIdsForWorkflow(pack, entriesById, workflow) {
  return normalizeList(pack.agents).filter((agentId) => {
    const entry = entriesById.get(agentId);
    return entry && normalizeList(entry.allowed_workflows).includes(workflow);
  });
}

function connectorRequirements(pack, evidenceTypes) {
  const policy = PACK_EVIDENCE_REQUIREMENTS[pack.id] || {
    connector_mode: 'unknown',
    required_any_evidence_types: [],
  };
  const provided = uniqueSorted(evidenceTypes.filter((evidenceType) => policy.required_any_evidence_types.includes(evidenceType)));
  const missing = provided.length > 0 ? [] : policy.required_any_evidence_types;
  return {
    connector_mode: policy.connector_mode,
    required_any_evidence_types: policy.required_any_evidence_types,
    provided_evidence_types: provided,
    missing_evidence_types: missing,
    evidence_satisfied: policy.required_any_evidence_types.length === 0 || provided.length > 0,
  };
}

function activationBasis(pack, enabledPacks, enabledAgents, signals, packAgentIds, routerOptionalAgents) {
  const basis = [];
  if (enabledPacks.includes(pack.id)) basis.push('explicit_pack');
  if (packAgentIds.some((agentId) => enabledAgents.includes(agentId))) basis.push('explicit_agent');
  if (explicitActivationSignals(pack, signals).length > 0) basis.push('explicit_signal');
  if (packAgentIds.some((agentId) => routerOptionalAgents.includes(agentId))) basis.push('router_candidate');
  return uniqueSorted(basis);
}

function hasExplicitActivation(basis) {
  return basis.includes('explicit_pack') || basis.includes('explicit_agent') || basis.includes('explicit_signal');
}

function resolveActivationState({ workflowAllowed, basis, requirements }) {
  if (!workflowAllowed) return 'inactive';
  if (!hasExplicitActivation(basis)) {
    return basis.includes('router_candidate') ? 'eligible' : 'inactive';
  }
  if (requirements.connector_mode === 'none' || requirements.evidence_satisfied) {
    return 'activated';
  }
  return 'activated_reference_only';
}

function allowedUse(pack, activationState, requirements) {
  if (activationState === 'activated' && pack.type === 'style_profile') return 'style_advisory';
  if (activationState === 'activated' && requirements.connector_mode === 'optional_connector') return 'connector_evidence_context';
  if (activationState === 'activated_reference_only') return 'reference_only';
  if (activationState === 'eligible') return 'activation_candidate_only';
  return 'unavailable';
}

function confidenceCeiling(activationState, requirements) {
  if (activationState === 'activated' && requirements.evidence_satisfied) return 'medium';
  if (activationState === 'activated' && requirements.connector_mode === 'none') return 'medium';
  if (activationState === 'activated_reference_only' || activationState === 'eligible') return 'low';
  return 'unknown';
}

function maxSeverity(pack) {
  if (pack.type === 'style_profile') return 'note';
  return 'medium';
}

function requiredDisclosures(pack, activationState, basis, requirements) {
  const disclosures = [];
  if (pack.default_enabled === false) disclosures.push('optional_pack_default_disabled');
  if (!hasExplicitActivation(basis)) disclosures.push('explicit_activation_missing');
  if (activationState === 'eligible') disclosures.push('router_candidate_not_activation');
  if (activationState === 'activated_reference_only') disclosures.push('connector_evidence_missing');
  if (!requirements.evidence_satisfied && requirements.required_any_evidence_types.length > 0) {
    disclosures.push(`missing_evidence:${requirements.required_any_evidence_types.join('|')}`);
  }
  if (pack.type === 'style_profile') disclosures.push('style_profile_advisory_only');
  return uniqueSorted(disclosures);
}

function fallbackGuidance(pack, activationState, requirements) {
  if (activationState === 'activated') {
    return [
      'Use this optional pack only for the explicitly requested workflow context and keep Skill Synthesis as final judge.',
    ];
  }
  if (activationState === 'activated_reference_only') {
    return [
      `Use ${pack.id} as reference-only context until one of these evidence types is available: ${requirements.required_any_evidence_types.join(', ')}.`,
    ];
  }
  if (activationState === 'eligible') {
    return [
      'Router facts make this pack relevant, but explicit opt-in is still required before using optional-pack context.',
    ];
  }
  return [
    'Do not use this optional pack unless the user or workflow explicitly enables it.',
  ];
}

function forbiddenClaims(pack, activationState) {
  const claims = [
    'selected_agents',
    'final_verdict',
    'baseline_enabled',
    'runtime_asset_written',
    'connector_queried',
    'implicit_optional_pack_activation',
  ];
  if (activationState !== 'activated') {
    claims.push('connector_evidence_claim');
    claims.push('hard_context_from_optional_pack');
  }
  if (pack.type === 'style_profile') {
    claims.push('style_profile_blocker');
    claims.push('style_profile_required_fix');
  }
  return uniqueSorted(claims);
}

function optionalAgentContext(pack, entriesById, agentIds, activationState, use) {
  return agentIds.map((agentId) => {
    const entry = entriesById.get(agentId);
    return {
      agent_id: agentId,
      canonical_id: entry.canonical_id,
      priority: entry.priority,
      allowed_workflows: normalizeList(entry.allowed_workflows),
      allowed_use: use,
      activation_state: activationState,
      max_severity: maxSeverity(pack),
    };
  });
}

function optionalPackContext({ facts, workflow, input, router }) {
  const signals = new Set(input.risk_signals);
  const enabledPacks = input.enabled_packs;
  const enabledAgents = input.enabled_agents;
  const evidenceTypes = input.evidence_types;
  const entriesById = packEntries(facts.registry);
  return optionalPacks(facts).map((pack) => {
    const workflowAllowed = packWorkflowAllowed(pack, workflow);
    const agentIds = packAgentIdsForWorkflow(pack, entriesById, workflow);
    const requirements = connectorRequirements(pack, evidenceTypes);
    const hits = triggerHits(pack, signals);
    const basis = activationBasis(pack, enabledPacks, enabledAgents, signals, agentIds, router.optional_candidate_agents);
    const activationState = resolveActivationState({
      workflowAllowed,
      basis,
      requirements,
    });
    const use = allowedUse(pack, activationState, requirements);
    return {
      pack_id: pack.id,
      name: pack.name,
      priority: pack.priority,
      type: pack.type,
      workflow_allowed: workflowAllowed,
      default_enabled: pack.default_enabled === true,
      baseline_eligible: false,
      explicit_activation_required: true,
      activation_state: activationState,
      activation_basis: basis,
      trigger_hits: hits,
      router_candidate_agent_ids: agentIds.filter((agentId) => router.optional_candidate_agents.includes(agentId)),
      enabled_agent_ids: agentIds.filter((agentId) => enabledAgents.includes(agentId)),
      allowed_use: use,
      confidence_ceiling: confidenceCeiling(activationState, requirements),
      max_severity: maxSeverity(pack),
      connector_requirements: requirements,
      required_disclosures: requiredDisclosures(pack, activationState, basis, requirements),
      fallback_guidance: fallbackGuidance(pack, activationState, requirements),
      forbidden_claims: forbiddenClaims(pack, activationState),
      agents: optionalAgentContext(pack, entriesById, agentIds, activationState, use),
    };
  });
}

function normalizeInput(input, routerCandidates) {
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
    enabled_packs: uniqueSorted(normalizeList(input.enabled_packs)),
    enabled_agents: uniqueSorted(normalizeList(input.enabled_agents)),
    evidence_types: uniqueSorted(normalizeList(input.evidence_types)),
    router_candidates_available: routerCandidates != null,
  };
}

function prepareOptionalPackBrief(input = {}, options = {}) {
  const workflow = options.workflow || input.workflow;
  assertSupportedWorkflow(workflow);

  const facts = options.facts || loadDefaultFacts(options);
  const routerCandidates = validateRouterContext(workflow, options.routerCandidates || input.router_candidates || null);
  const optionalAgentIds = new Set(optionalPacks(facts).flatMap((pack) => normalizeList(pack.agents)));
  const router = routerSummary(workflow, routerCandidates, optionalAgentIds);
  const normalizedInput = normalizeInput(input, routerCandidates);
  const packs = optionalPackContext({
    facts,
    workflow,
    input: normalizedInput,
    router,
  });

  return {
    schema_version: 'spec-first.optional-pack-brief.v1',
    generated_from: 'scripts/prepare-ecc-optional-pack-brief.js',
    workflow,
    source_artifacts: {
      registry: facts.sourceArtifacts.registry,
      packs: facts.sourceArtifacts.packs,
      optional_pack_brief_schema: OPTIONAL_PACK_BRIEF_SCHEMA,
      router_candidate_schema: routerCandidates ? ROUTER_CANDIDATE_SCHEMA : null,
    },
    input_summary: normalizedInput,
    optional_pack_policy: {
      default_baseline_enabled: false,
      explicit_activation_required: true,
      router_candidate_is_not_activation: true,
      runtime_delivery: 'none_in_v1',
      connector_queries_allowed: false,
      requires_skill_decision: true,
    },
    router_context: router,
    optional_pack_context: packs,
    decision_boundary: {
      requires_skill_decision: true,
      requires_expert_judgment: true,
      forbidden_outputs: [
        'selected_agents',
        'final_verdict',
        'runtime_pack_activation',
        'connector_query_result',
      ],
    },
    forbidden_actions: [
      'selected_agents',
      'final_verdict',
      'activate_optional_pack_without_explicit_request',
      'write_runtime_assets',
      'write_generated_runtime_mirror',
      'query_external_connector',
      'generate_ecc_command',
      'style_profile_blocker',
    ],
  };
}

function parseArgs(argv) {
  const result = {
    changed_files: [],
    risk_signals: [],
    enabled_packs: [],
    enabled_agents: [],
    evidence_types: [],
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--workflow') {
      result.workflow = argv[index + 1];
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
    } else if (arg === '--enable-pack') {
      result.enabled_packs.push(argv[index + 1]);
      index += 1;
    } else if (arg === '--enable-agent') {
      result.enabled_agents.push(argv[index + 1]);
      index += 1;
    } else if (arg === '--evidence') {
      result.evidence_types.push(argv[index + 1]);
      index += 1;
    } else if (arg === '--help' || arg === '-h') {
      result.help = true;
    }
  }
  return result;
}

function usage() {
  return [
    'Usage: node scripts/prepare-ecc-optional-pack-brief.js --workflow <spec-brainstorm|spec-plan|spec-doc-review|spec-code-review|spec-app-consistency-audit> [--router-candidates <router-candidates.json>] [--enable-pack <pack-id> ...] [--enable-agent <agent-id> ...] [--evidence <slack|issues|pr_comments|figma> ...] [--changed-file <path> ...] [--risk-signal <signal> ...]',
    '',
    'Prepares read-only optional capability pack briefing facts. It does not activate runtime packs, query external connectors, select final agents, or generate ECC commands.',
  ].join('\n');
}

function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  if (!args.workflow) {
    throw new Error('missing --workflow <spec-brainstorm|spec-plan|spec-doc-review|spec-code-review|spec-app-consistency-audit>');
  }
  const routerCandidates = args.routerCandidatesPath ? readJson(args.routerCandidatesPath) : null;
  const output = prepareOptionalPackBrief({
    workflow: args.workflow,
    changed_files: args.changed_files,
    risk_signals: args.risk_signals,
    enabled_packs: args.enabled_packs,
    enabled_agents: args.enabled_agents,
    evidence_types: args.evidence_types,
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
  PACK_EVIDENCE_REQUIREMENTS,
  PACK_EXPLICIT_SIGNALS,
  prepareOptionalPackBrief,
};
