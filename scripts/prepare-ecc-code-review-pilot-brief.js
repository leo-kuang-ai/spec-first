#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { validateAgainstSchema } = require('../src/contracts/schema-validator');
const { routeCandidates } = require('./route-ecc-agent-candidates');
const { prepareGraphExpertBrief } = require('./prepare-ecc-graph-expert-brief');
const { prepareStandardsExpertBrief } = require('./prepare-ecc-standards-expert-brief');
const { prepareOptionalPackBrief } = require('./prepare-ecc-optional-pack-brief');

const REPO_ROOT = path.join(__dirname, '..');
const CODE_REVIEW_PILOT_BRIEF_SCHEMA = 'src/cli/contracts/agent-registry/code-review-pilot-brief.schema.json';
const ROUTER_CANDIDATE_SCHEMA = 'src/cli/contracts/agent-registry/router-candidate-output.schema.json';
const GRAPH_EXPERT_BRIEF_SCHEMA = 'src/cli/contracts/agent-registry/graph-expert-brief.schema.json';
const STANDARDS_EXPERT_BRIEF_SCHEMA = 'src/cli/contracts/agent-registry/standards-expert-brief.schema.json';
const OPTIONAL_PACK_BRIEF_SCHEMA = 'src/cli/contracts/agent-registry/optional-pack-brief.schema.json';

const WORKFLOW = 'spec-code-review';
const CONFIDENCE_ORDER = ['unknown', 'low', 'medium', 'high'];

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

function normalizeWorkflow(value) {
  const workflow = value || WORKFLOW;
  if (workflow !== WORKFLOW) {
    throw new Error(`unsupported workflow for code-review pilot brief: ${workflow}`);
  }
  return workflow;
}

function normalizeMode(value) {
  if (['interactive', 'autofix', 'report-only', 'headless'].includes(value)) return value;
  return 'interactive';
}

function normalizeInput(input = {}, options = {}) {
  const workflow = normalizeWorkflow(options.workflow || input.workflow);
  return {
    workflow,
    repo_root: path.resolve(options.repoRoot || input.repo_root || REPO_ROOT),
    mode: normalizeMode(options.mode || input.mode),
    base: typeof (options.base || input.base) === 'string' && (options.base || input.base).trim() ? (options.base || input.base).trim() : null,
    changed_files: uniqueSorted([
      ...normalizeList(input.changed_files),
      ...normalizeList(options.changedFiles),
    ]),
    risk_signals: uniqueSorted([
      ...normalizeList(input.risk_signals),
      ...normalizeList(options.riskSignals),
    ]),
    enabled_packs: uniqueSorted([
      ...normalizeList(input.enabled_packs),
      ...normalizeList(options.enabledPacks),
    ]),
    enabled_agents: uniqueSorted([
      ...normalizeList(input.enabled_agents),
      ...normalizeList(options.enabledAgents),
    ]),
    evidence_types: uniqueSorted([
      ...normalizeList(input.evidence_types),
      ...normalizeList(options.evidenceTypes),
    ]),
    allow_fallback_vocabulary: options.allowFallbackVocabulary === true || input.allow_fallback_vocabulary === true,
    router_candidates: options.routerCandidates || input.router_candidates || null,
  };
}

function validateRouterCandidates(workflow, routerCandidates) {
  validateOrThrow(ROUTER_CANDIDATE_SCHEMA, routerCandidates, 'router candidate facts');
  if (routerCandidates.workflow !== workflow) {
    throw new Error(`router candidate workflow mismatch: expected ${workflow}, received ${routerCandidates.workflow}`);
  }
}

function safeCompute(name, producer) {
  try {
    return {
      name,
      available: true,
      output: producer(),
      error: null,
    };
  } catch (error) {
    return {
      name,
      available: false,
      output: null,
      error: error.message,
    };
  }
}

function resolveRouterCandidates(input) {
  if (input.router_candidates) {
    validateRouterCandidates(input.workflow, input.router_candidates);
    return input.router_candidates;
  }
  return routeCandidates({
    workflow: input.workflow,
    changed_files: input.changed_files,
    risk_signals: input.risk_signals,
  });
}

function optionalAgentContexts(optionalBrief) {
  const byAgent = new Map();
  for (const pack of optionalBrief && optionalBrief.optional_pack_context ? optionalBrief.optional_pack_context : []) {
    for (const agent of pack.agents || []) {
      const contexts = byAgent.get(agent.agent_id) || [];
      contexts.push({
        pack_id: pack.pack_id,
        activation_state: pack.activation_state,
        allowed_use: agent.allowed_use || pack.allowed_use,
        confidence_ceiling: pack.confidence_ceiling,
        required_disclosures: pack.required_disclosures || [],
        fallback_guidance: pack.fallback_guidance || [],
        forbidden_claims: pack.forbidden_claims || [],
      });
      byAgent.set(agent.agent_id, contexts);
    }
  }
  return byAgent;
}

function mapByAgent(items, key = 'agent_id') {
  return new Map((items || []).map((item) => [item[key], item]));
}

function lowerConfidence(values) {
  const normalized = values.filter((value) => CONFIDENCE_ORDER.includes(value));
  if (normalized.length === 0) return 'unknown';
  return CONFIDENCE_ORDER[Math.min(...normalized.map((value) => CONFIDENCE_ORDER.indexOf(value)))];
}

function graphAllowedUse(graphContext) {
  return graphContext ? uniqueSorted((graphContext.allowed_graph_artifacts || []).map((artifact) => `graph:${artifact.allowed_use}`)) : [];
}

function standardsAllowedUse(standardsContext) {
  return standardsContext ? uniqueSorted((standardsContext.allowed_standards_artifacts || []).map((artifact) => `standards:${artifact.allowed_use}`)) : [];
}

function buildReviewerCandidateGuidance({ router, graphBrief, standardsBrief, optionalBrief }) {
  const candidateAgents = router && router.candidate_agents ? router.candidate_agents : [];
  const graphByAgent = mapByAgent(graphBrief && graphBrief.expert_graph_context);
  const standardsByAgent = mapByAgent(standardsBrief && standardsBrief.expert_standards_context);
  const optionalByAgent = optionalAgentContexts(optionalBrief);

  return candidateAgents.map((candidate) => {
    const graphContext = graphByAgent.get(candidate.id) || null;
    const standardsContext = standardsByAgent.get(candidate.id) || null;
    const optionalContexts = optionalByAgent.get(candidate.id) || [];
    const optionalAllowedUse = optionalContexts.map((context) => `optional:${context.allowed_use}`);
    const requiredDisclosures = [
      ...(graphContext ? graphContext.required_disclosures || [] : []),
      ...(standardsContext ? standardsContext.required_disclosures || [] : []),
      ...optionalContexts.flatMap((context) => context.required_disclosures),
    ];
    const fallbackGuidance = [
      ...(graphContext ? graphContext.fallback_guidance || [] : []),
      ...(standardsContext ? standardsContext.fallback_guidance || [] : []),
      ...optionalContexts.flatMap((context) => context.fallback_guidance),
    ];
    const forbiddenClaims = [
      'selected_agents',
      'final_verdict',
      ...(graphContext ? graphContext.forbidden_claims || [] : []),
      ...(standardsContext ? standardsContext.forbidden_claims || [] : []),
      ...optionalContexts.flatMap((context) => context.forbidden_claims),
    ];

    return {
      agent_id: candidate.id,
      canonical_id: candidate.canonical_id,
      priority: candidate.priority,
      reason_codes: candidate.reason_codes || [],
      budget_hint: candidate.budget_hint,
      candidate_only: true,
      requires_skill_decision: true,
      graph_context_available: graphContext != null,
      standards_context_available: standardsContext != null,
      optional_context_available: optionalContexts.length > 0,
      confidence_ceiling: lowerConfidence([
        graphContext && graphContext.confidence_ceiling,
        standardsContext && standardsContext.confidence_ceiling,
        ...optionalContexts.map((context) => context.confidence_ceiling),
      ]),
      allowed_use: uniqueSorted([
        ...graphAllowedUse(graphContext),
        ...standardsAllowedUse(standardsContext),
        ...optionalAllowedUse,
      ]),
      required_disclosures: uniqueSorted(requiredDisclosures),
      fallback_guidance: uniqueSorted(fallbackGuidance),
      forbidden_claims: uniqueSorted(forbiddenClaims),
    };
  });
}

function componentStatus({ routerResult, graphResult, standardsResult, optionalResult }) {
  const router = routerResult.output;
  const graph = graphResult.output;
  const standards = standardsResult.output;
  const optional = optionalResult.output;
  const optionalContexts = optional && optional.optional_pack_context ? optional.optional_pack_context : [];

  return {
    router_candidates: {
      available: routerResult.available,
      reason_code: router ? router.reason_code : null,
      candidate_count: router && router.candidate_agents ? router.candidate_agents.length : 0,
      error: routerResult.error,
    },
    graph_expert_brief: {
      available: graphResult.available,
      reason_code: graph && graph.graph_readiness && graph.graph_readiness.reason_codes ? graph.graph_readiness.reason_codes.join(',') : null,
      readiness_status: graph && graph.graph_readiness ? graph.graph_readiness.status : null,
      confidence: graph && graph.graph_readiness ? graph.graph_readiness.confidence : null,
      error: graphResult.error,
    },
    standards_expert_brief: {
      available: standardsResult.available,
      reason_code: standards && standards.standards_readiness && standards.standards_readiness.reason_codes ? standards.standards_readiness.reason_codes.join(',') : null,
      readiness_status: standards && standards.standards_readiness ? standards.standards_readiness.status : null,
      confidence: standards && standards.standards_readiness ? standards.standards_readiness.confidence : null,
      error: standardsResult.error,
    },
    optional_pack_brief: {
      available: optionalResult.available,
      reason_code: optional && optional.router_context ? optional.router_context.reason_code : null,
      activated_or_eligible_pack_count: optionalContexts.filter((pack) => ['activated', 'activated_reference_only', 'eligible'].includes(pack.activation_state)).length,
      error: optionalResult.error,
    },
  };
}

function degradedMode(status) {
  const reasons = [];
  if (!status.router_candidates.available) reasons.push('router_candidate_unavailable');
  if (!status.graph_expert_brief.available) reasons.push('graph_expert_brief_unavailable');
  if (!status.standards_expert_brief.available) reasons.push('standards_expert_brief_unavailable');
  if (!status.optional_pack_brief.available) reasons.push('optional_pack_brief_unavailable');
  if (status.graph_expert_brief.available && status.graph_expert_brief.readiness_status !== 'primary') {
    reasons.push(`graph_readiness:${status.graph_expert_brief.readiness_status || 'unknown'}`);
  }
  if (status.standards_expert_brief.available && status.standards_expert_brief.readiness_status !== 'trusted') {
    reasons.push(`standards_readiness:${status.standards_expert_brief.readiness_status || 'unknown'}`);
  }
  return {
    enabled: reasons.length > 0,
    reasons: uniqueSorted(reasons),
  };
}

function sourceArtifacts(router) {
  return {
    registry: router && router.source_artifacts ? router.source_artifacts.registry : 'docs/02-架构设计/ECC集成/generated/agent-registry.json',
    packs: router && router.source_artifacts ? router.source_artifacts.packs : 'docs/02-架构设计/ECC集成/generated/agent-packs.json',
    policy: router && router.source_artifacts ? router.source_artifacts.policy : 'docs/02-架构设计/ECC集成/generated/router-candidate-policy.json',
    code_review_pilot_brief_schema: CODE_REVIEW_PILOT_BRIEF_SCHEMA,
    router_candidate_schema: ROUTER_CANDIDATE_SCHEMA,
    graph_expert_brief_schema: GRAPH_EXPERT_BRIEF_SCHEMA,
    standards_expert_brief_schema: STANDARDS_EXPERT_BRIEF_SCHEMA,
    optional_pack_brief_schema: OPTIONAL_PACK_BRIEF_SCHEMA,
  };
}

function prepareCodeReviewPilotBrief(input = {}, options = {}) {
  const normalized = normalizeInput(input, options);
  const routerResult = safeCompute('router_candidates', () => resolveRouterCandidates(normalized));
  const routerCandidates = routerResult.output;
  const graphResult = safeCompute('graph_expert_brief', () => prepareGraphExpertBrief(normalized, {
    workflow: normalized.workflow,
    repoRoot: normalized.repo_root,
    routerCandidates,
  }));
  const standardsResult = safeCompute('standards_expert_brief', () => prepareStandardsExpertBrief(normalized, {
    workflow: normalized.workflow,
    repoRoot: normalized.repo_root,
    routerCandidates,
    allowFallbackVocabulary: normalized.allow_fallback_vocabulary,
  }));
  const optionalResult = safeCompute('optional_pack_brief', () => prepareOptionalPackBrief({
    workflow: normalized.workflow,
    changed_files: normalized.changed_files,
    risk_signals: normalized.risk_signals,
    enabled_packs: normalized.enabled_packs,
    enabled_agents: normalized.enabled_agents,
    evidence_types: normalized.evidence_types,
    router_candidates: routerCandidates,
  }));
  const status = componentStatus({
    routerResult,
    graphResult,
    standardsResult,
    optionalResult,
  });
  const output = {
    schema_version: 'spec-first.code-review-pilot-brief.v1',
    generated_from: 'scripts/prepare-ecc-code-review-pilot-brief.js',
    workflow: normalized.workflow,
    source_artifacts: sourceArtifacts(routerCandidates),
    input_summary: {
      mode: normalized.mode,
      base: normalized.base,
      changed_files: normalized.changed_files,
      risk_signals: normalized.risk_signals,
      enabled_packs: normalized.enabled_packs,
      enabled_agents: normalized.enabled_agents,
      evidence_types: normalized.evidence_types,
      router_candidates_supplied: normalized.router_candidates != null,
      allow_fallback_vocabulary: normalized.allow_fallback_vocabulary,
    },
    component_status: status,
    router_candidate_facts: routerCandidates,
    graph_expert_brief: graphResult.output,
    standards_expert_brief: standardsResult.output,
    optional_pack_brief: optionalResult.output,
    reviewer_candidate_guidance: buildReviewerCandidateGuidance({
      router: routerCandidates,
      graphBrief: graphResult.output,
      standardsBrief: standardsResult.output,
      optionalBrief: optionalResult.output,
    }),
    decision_boundary: {
      requires_skill_decision: true,
      requires_reviewer_selection_by_skill: true,
      router_candidate_is_not_selection: true,
      optional_candidate_is_not_activation: true,
      component_failure_is_degraded_mode: true,
      connector_queries_allowed: false,
      runtime_delivery: 'none_in_v9a',
      forbidden_outputs: [
        'selected_agents',
        'final_verdict',
        'confirmed_standards_write',
        'runtime_pack_activation',
        'connector_query_result',
      ],
    },
    degraded_mode: degradedMode(status),
    forbidden_actions: [
      'selected_agents',
      'final_verdict',
      'confirmed_standards_write',
      'runtime_pack_activation',
      'write_generated_runtime_mirror',
      'write_runtime_assets',
      'query_external_connector',
      'run_graph_provider_commands',
      'modify_repo_profile',
      'replace_workflow_reviewer_selection',
    ],
  };

  validateOrThrow(CODE_REVIEW_PILOT_BRIEF_SCHEMA, output, 'code-review pilot brief');
  return output;
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
    if (arg === '--input') {
      result.inputPath = argv[index + 1];
      index += 1;
    } else if (arg === '--workflow') {
      result.workflow = argv[index + 1];
      index += 1;
    } else if (arg === '--repo-root') {
      result.repoRoot = argv[index + 1];
      index += 1;
    } else if (arg === '--base') {
      result.base = argv[index + 1];
      index += 1;
    } else if (arg === '--mode') {
      result.mode = argv[index + 1];
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
    } else if (arg === '--allow-fallback-vocabulary') {
      result.allowFallbackVocabulary = true;
    } else if (arg === '--help' || arg === '-h') {
      result.help = true;
    }
  }
  return result;
}

function usage() {
  return [
    'Usage: node scripts/prepare-ecc-code-review-pilot-brief.js [--input <input.json>] [--base <ref>] [--mode <interactive|autofix|report-only|headless>] [--changed-file <path> ...] [--risk-signal <signal> ...] [--router-candidates <router-candidates.json>] [--enable-pack <pack-id> ...] [--enable-agent <agent-id> ...] [--evidence <slack|issues|pr_comments|figma> ...]',
    '',
    'Prepares read-only ECC governance pilot facts for spec-code-review. It does not select reviewers, activate optional packs, query connectors, write runtime assets, or make final review verdicts.',
  ].join('\n');
}

function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  const input = args.inputPath ? readJson(args.inputPath) : {};
  const routerCandidates = args.routerCandidatesPath ? readJson(args.routerCandidatesPath) : null;
  const output = prepareCodeReviewPilotBrief(input, {
    workflow: args.workflow,
    repoRoot: args.repoRoot,
    base: args.base,
    mode: args.mode,
    changedFiles: args.changed_files,
    riskSignals: args.risk_signals,
    enabledPacks: args.enabled_packs,
    enabledAgents: args.enabled_agents,
    evidenceTypes: args.evidence_types,
    allowFallbackVocabulary: args.allowFallbackVocabulary,
    routerCandidates,
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
  prepareCodeReviewPilotBrief,
};
