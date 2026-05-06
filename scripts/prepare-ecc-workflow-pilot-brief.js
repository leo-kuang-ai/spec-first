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
const WORKFLOW_PILOT_BRIEF_SCHEMA = 'src/cli/contracts/agent-registry/workflow-pilot-brief.schema.json';
const ROUTER_CANDIDATE_SCHEMA = 'src/cli/contracts/agent-registry/router-candidate-output.schema.json';
const GRAPH_EXPERT_BRIEF_SCHEMA = 'src/cli/contracts/agent-registry/graph-expert-brief.schema.json';
const STANDARDS_EXPERT_BRIEF_SCHEMA = 'src/cli/contracts/agent-registry/standards-expert-brief.schema.json';
const OPTIONAL_PACK_BRIEF_SCHEMA = 'src/cli/contracts/agent-registry/optional-pack-brief.schema.json';

const SUPPORTED_WORKFLOWS = ['spec-plan', 'spec-doc-review', 'spec-skill-audit'];
const GRAPH_WORKFLOWS = ['spec-plan', 'spec-doc-review'];
const OPTIONAL_PACK_WORKFLOWS = ['spec-plan', 'spec-doc-review'];
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
  if (!SUPPORTED_WORKFLOWS.includes(value)) {
    throw new Error(`unsupported workflow for ECC workflow pilot brief: ${value || 'missing'}`);
  }
  return value;
}

function normalizeInput(input = {}, options = {}) {
  const workflow = normalizeWorkflow(options.workflow || input.workflow);
  return {
    workflow,
    repo_root: path.resolve(options.repoRoot || input.repo_root || REPO_ROOT),
    mode: typeof (options.mode || input.mode) === 'string' && (options.mode || input.mode).trim()
      ? (options.mode || input.mode).trim()
      : 'default',
    target_path: typeof (options.targetPath || input.target_path) === 'string' && (options.targetPath || input.target_path).trim()
      ? (options.targetPath || input.target_path).trim()
      : null,
    changed_files: uniqueSorted([
      ...normalizeList(input.changed_files),
      ...normalizeList(options.changedFiles),
    ]),
    context_paths: uniqueSorted([
      ...normalizeList(input.context_paths),
      ...normalizeList(options.contextPaths),
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

function routingPaths(input) {
  return uniqueSorted([
    ...input.changed_files,
    ...input.context_paths,
    ...(input.target_path ? [input.target_path] : []),
  ]);
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
      skipped: false,
      output: producer(),
      reason_code: null,
      error: null,
    };
  } catch (error) {
    return {
      name,
      available: false,
      skipped: false,
      output: null,
      reason_code: 'component_error',
      error: error.message,
    };
  }
}

function skippedComponent(name, reasonCode) {
  return {
    name,
    available: false,
    skipped: true,
    output: null,
    reason_code: reasonCode,
    error: null,
  };
}

function resolveRouterCandidates(input) {
  if (input.router_candidates) {
    validateRouterCandidates(input.workflow, input.router_candidates);
    return input.router_candidates;
  }
  return routeCandidates({
    workflow: input.workflow,
    changed_files: routingPaths(input),
    risk_signals: input.risk_signals,
  });
}

function computeGraphBrief(input, routerCandidates) {
  if (!GRAPH_WORKFLOWS.includes(input.workflow)) {
    return skippedComponent('graph_expert_brief', 'unsupported_for_workflow');
  }
  return safeCompute('graph_expert_brief', () => prepareGraphExpertBrief({
    workflow: input.workflow,
    repo_root: input.repo_root,
    changed_files: routingPaths(input),
    risk_signals: input.risk_signals,
    router_candidates: routerCandidates,
  }, {
    workflow: input.workflow,
    repoRoot: input.repo_root,
    routerCandidates,
  }));
}

function computeStandardsBrief(input, routerCandidates) {
  return safeCompute('standards_expert_brief', () => prepareStandardsExpertBrief({
    workflow: input.workflow,
    repo_root: input.repo_root,
    changed_files: routingPaths(input),
    risk_signals: input.risk_signals,
    allow_fallback_vocabulary: input.allow_fallback_vocabulary,
    router_candidates: routerCandidates,
  }, {
    workflow: input.workflow,
    repoRoot: input.repo_root,
    routerCandidates,
    allowFallbackVocabulary: input.allow_fallback_vocabulary,
  }));
}

function computeOptionalPackBrief(input, routerCandidates) {
  if (!OPTIONAL_PACK_WORKFLOWS.includes(input.workflow)) {
    return skippedComponent('optional_pack_brief', 'unsupported_for_workflow');
  }
  return safeCompute('optional_pack_brief', () => prepareOptionalPackBrief({
    workflow: input.workflow,
    changed_files: routingPaths(input),
    risk_signals: input.risk_signals,
    enabled_packs: input.enabled_packs,
    enabled_agents: input.enabled_agents,
    evidence_types: input.evidence_types,
    router_candidates: routerCandidates,
  }));
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

function buildExpertCandidateGuidance({ router, graphBrief, standardsBrief, optionalBrief }) {
  const candidateAgents = router && router.candidate_agents ? router.candidate_agents : [];
  const graphByAgent = mapByAgent(graphBrief && graphBrief.expert_graph_context);
  const standardsByAgent = mapByAgent(standardsBrief && standardsBrief.expert_standards_context);
  const optionalByAgent = optionalAgentContexts(optionalBrief);

  return candidateAgents.map((candidate) => {
    const graphContext = graphByAgent.get(candidate.id) || null;
    const standardsContext = standardsByAgent.get(candidate.id) || null;
    const optionalContexts = optionalByAgent.get(candidate.id) || [];
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
        ...optionalContexts.map((context) => `optional:${context.allowed_use}`),
      ]),
      required_disclosures: uniqueSorted(requiredDisclosures),
      fallback_guidance: uniqueSorted(fallbackGuidance),
      forbidden_claims: uniqueSorted(forbiddenClaims),
    };
  });
}

function componentItem(result, output, resolver) {
  if (result.skipped) {
    return {
      available: false,
      skipped: true,
      reason_code: result.reason_code,
      readiness_status: null,
      confidence: null,
      item_count: 0,
      error: null,
    };
  }
  const details = output ? resolver(output) : {};
  return {
    available: result.available,
    skipped: false,
    reason_code: result.reason_code || details.reason_code || null,
    readiness_status: details.readiness_status || null,
    confidence: details.confidence || null,
    item_count: details.item_count || 0,
    error: result.error,
  };
}

function componentStatus({ routerResult, graphResult, standardsResult, optionalResult }) {
  return {
    router_candidates: componentItem(routerResult, routerResult.output, (router) => ({
      reason_code: router.reason_code,
      item_count: router.candidate_agents ? router.candidate_agents.length : 0,
    })),
    graph_expert_brief: componentItem(graphResult, graphResult.output, (graph) => ({
      reason_code: graph.graph_readiness && graph.graph_readiness.reason_codes ? graph.graph_readiness.reason_codes.join(',') : null,
      readiness_status: graph.graph_readiness ? graph.graph_readiness.status : null,
      confidence: graph.graph_readiness ? graph.graph_readiness.confidence : null,
      item_count: graph.expert_graph_context ? graph.expert_graph_context.length : 0,
    })),
    standards_expert_brief: componentItem(standardsResult, standardsResult.output, (standards) => ({
      reason_code: standards.standards_readiness && standards.standards_readiness.reason_codes ? standards.standards_readiness.reason_codes.join(',') : null,
      readiness_status: standards.standards_readiness ? standards.standards_readiness.status : null,
      confidence: standards.standards_readiness ? standards.standards_readiness.confidence : null,
      item_count: standards.expert_standards_context ? standards.expert_standards_context.length : 0,
    })),
    optional_pack_brief: componentItem(optionalResult, optionalResult.output, (optional) => ({
      reason_code: optional.router_context ? optional.router_context.reason_code : null,
      item_count: optional.optional_pack_context
        ? optional.optional_pack_context.filter((pack) => ['activated', 'activated_reference_only', 'eligible'].includes(pack.activation_state)).length
        : 0,
    })),
  };
}

function degradedMode(status) {
  const reasons = [];
  if (!status.router_candidates.available && !status.router_candidates.skipped) reasons.push('router_candidate_unavailable');
  if (!status.graph_expert_brief.available && !status.graph_expert_brief.skipped) reasons.push('graph_expert_brief_unavailable');
  if (!status.standards_expert_brief.available && !status.standards_expert_brief.skipped) reasons.push('standards_expert_brief_unavailable');
  if (!status.optional_pack_brief.available && !status.optional_pack_brief.skipped) reasons.push('optional_pack_brief_unavailable');
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
    workflow_pilot_brief_schema: WORKFLOW_PILOT_BRIEF_SCHEMA,
    router_candidate_schema: ROUTER_CANDIDATE_SCHEMA,
    graph_expert_brief_schema: GRAPH_EXPERT_BRIEF_SCHEMA,
    standards_expert_brief_schema: STANDARDS_EXPERT_BRIEF_SCHEMA,
    optional_pack_brief_schema: OPTIONAL_PACK_BRIEF_SCHEMA,
  };
}

function prepareWorkflowPilotBrief(input = {}, options = {}) {
  const normalized = normalizeInput(input, options);
  const routerResult = safeCompute('router_candidates', () => resolveRouterCandidates(normalized));
  const routerCandidates = routerResult.output;
  const graphResult = computeGraphBrief(normalized, routerCandidates);
  const standardsResult = computeStandardsBrief(normalized, routerCandidates);
  const optionalResult = computeOptionalPackBrief(normalized, routerCandidates);
  const status = componentStatus({
    routerResult,
    graphResult,
    standardsResult,
    optionalResult,
  });
  const output = {
    schema_version: 'spec-first.workflow-pilot-brief.v1',
    generated_from: 'scripts/prepare-ecc-workflow-pilot-brief.js',
    workflow: normalized.workflow,
    source_artifacts: sourceArtifacts(routerCandidates),
    input_summary: {
      mode: normalized.mode,
      target_path: normalized.target_path,
      changed_files: normalized.changed_files,
      context_paths: normalized.context_paths,
      routing_paths: routingPaths(normalized),
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
    expert_candidate_guidance: buildExpertCandidateGuidance({
      router: routerCandidates,
      graphBrief: graphResult.output,
      standardsBrief: standardsResult.output,
      optionalBrief: optionalResult.output,
    }),
    decision_boundary: {
      requires_skill_decision: true,
      requires_expert_selection_by_skill: true,
      router_candidate_is_not_selection: true,
      optional_candidate_is_not_activation: true,
      component_failure_is_degraded_mode: true,
      connector_queries_allowed: false,
      runtime_delivery: 'none_in_v9b',
      forbidden_outputs: [
        'selected_agents',
        'final_verdict',
        'confirmed_standards_write',
        'runtime_pack_activation',
        'connector_query_result',
        'semantic_plan_conclusion',
        'document_review_verdict',
        'skill_audit_verdict',
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
      'replace_workflow_expert_selection',
      'replace_workflow_synthesis',
    ],
  };

  validateOrThrow(WORKFLOW_PILOT_BRIEF_SCHEMA, output, 'workflow pilot brief');
  return output;
}

function parseArgs(argv) {
  const result = {
    changed_files: [],
    context_paths: [],
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
    } else if (arg === '--mode') {
      result.mode = argv[index + 1];
      index += 1;
    } else if (arg === '--target-path') {
      result.targetPath = argv[index + 1];
      index += 1;
    } else if (arg === '--router-candidates') {
      result.routerCandidatesPath = argv[index + 1];
      index += 1;
    } else if (arg === '--changed-file') {
      result.changed_files.push(argv[index + 1]);
      index += 1;
    } else if (arg === '--context-path') {
      result.context_paths.push(argv[index + 1]);
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
    'Usage: node scripts/prepare-ecc-workflow-pilot-brief.js --workflow <spec-plan|spec-doc-review|spec-skill-audit> [--target-path <path>] [--context-path <path> ...] [--changed-file <path> ...] [--risk-signal <signal> ...] [--router-candidates <router-candidates.json>] [--enable-pack <pack-id> ...] [--enable-agent <agent-id> ...] [--evidence <slack|issues|pr_comments|figma> ...]',
    '',
    'Prepares read-only ECC governance pilot facts for plan, document review, and skill audit workflows. It does not select experts, activate optional packs, query connectors, write runtime assets, or make final semantic judgments.',
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
  const output = prepareWorkflowPilotBrief(input, {
    workflow: args.workflow,
    repoRoot: args.repoRoot,
    mode: args.mode,
    targetPath: args.targetPath,
    changedFiles: args.changed_files,
    contextPaths: args.context_paths,
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
  prepareWorkflowPilotBrief,
};
