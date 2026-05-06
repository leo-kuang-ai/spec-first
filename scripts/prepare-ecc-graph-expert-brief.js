#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { validateAgainstSchema } = require('../src/contracts/schema-validator');

const REPO_ROOT = path.join(__dirname, '..');
const GRAPH_FACTS_PATH = '.spec-first/graph/graph-facts.json';
const PROVIDER_STATUS_PATH = '.spec-first/graph/provider-status.json';
const IMPACT_CAPABILITIES_PATH = '.spec-first/impact/bootstrap-impact-capabilities.json';
const GRAPH_EXPERT_BRIEF_SCHEMA = 'src/cli/contracts/agent-registry/graph-expert-brief.schema.json';
const ROUTER_CANDIDATE_SCHEMA = 'src/cli/contracts/agent-registry/router-candidate-output.schema.json';

const SUPPORTED_WORKFLOWS = ['spec-plan', 'spec-code-review', 'spec-doc-review'];

const GRAPH_AWARE_AGENTS = {
  'spec-architecture-strategist': {
    workflows: ['spec-plan', 'spec-code-review'],
    graph_use_case: 'architecture_impact',
    required_capabilities: ['query_global_graph', 'impact_context', 'context_selection'],
  },
  'spec-repo-research-analyst': {
    workflows: ['spec-plan'],
    graph_use_case: 'repo_research',
    required_capabilities: ['query_global_graph', 'context_selection'],
  },
  'spec-api-contract-reviewer': {
    workflows: ['spec-plan', 'spec-code-review'],
    graph_use_case: 'api_contract_impact',
    required_capabilities: ['query_global_graph', 'impact_context'],
  },
  'spec-testing-reviewer': {
    workflows: ['spec-code-review'],
    graph_use_case: 'test_impact',
    required_capabilities: ['impact_context', 'review_support'],
  },
  'spec-correctness-reviewer': {
    workflows: ['spec-code-review'],
    graph_use_case: 'behavior_regression_impact',
    required_capabilities: ['impact_context', 'review_support'],
  },
  'spec-code-simplicity-reviewer': {
    workflows: ['spec-plan', 'spec-code-review'],
    graph_use_case: 'reuse_or_simplification',
    required_capabilities: ['context_selection'],
  },
  'spec-git-history-analyzer': {
    workflows: ['spec-plan'],
    graph_use_case: 'history_context_selection',
    required_capabilities: ['context_selection'],
  },
  'spec-feasibility-reviewer': {
    workflows: ['spec-doc-review', 'spec-plan'],
    graph_use_case: 'implementation_feasibility_orientation',
    required_capabilities: ['context_selection'],
  },
};

const DEFAULT_GRAPH_AWARE_AGENTS_BY_WORKFLOW = {
  'spec-plan': [
    'spec-architecture-strategist',
    'spec-repo-research-analyst',
    'spec-api-contract-reviewer',
    'spec-code-simplicity-reviewer',
    'spec-git-history-analyzer',
    'spec-feasibility-reviewer',
  ],
  'spec-code-review': [
    'spec-api-contract-reviewer',
    'spec-testing-reviewer',
    'spec-correctness-reviewer',
    'spec-code-simplicity-reviewer',
  ],
  'spec-doc-review': [
    'spec-feasibility-reviewer',
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
    throw new Error(`unsupported workflow for graph expert brief: ${workflow}`);
  }
}

function hashStatusText(statusText) {
  return `sha256:${crypto.createHash('sha256').update(statusText || '').digest('hex')}`;
}

function gitOutput(repoRoot, args) {
  try {
    return execFileSync('git', ['-C', repoRoot, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trimEnd();
  } catch (_error) {
    return null;
  }
}

function gitSnapshot(repoRoot) {
  const currentRevision = gitOutput(repoRoot, ['rev-parse', '--verify', 'HEAD^{commit}']);
  const statusText = gitOutput(repoRoot, ['status', '--porcelain']);
  if (!currentRevision || statusText === null) {
    return {
      current_revision: currentRevision || null,
      current_worktree_dirty: null,
      current_worktree_status_hash: null,
    };
  }
  return {
    current_revision: currentRevision,
    current_worktree_dirty: statusText.length > 0,
    current_worktree_status_hash: hashStatusText(statusText),
  };
}

function readOptionalArtifact(repoRoot, relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    return {
      path: relativePath,
      available: false,
      data: null,
      error: null,
    };
  }
  try {
    return {
      path: relativePath,
      available: true,
      data: readJson(fullPath),
      error: null,
    };
  } catch (error) {
    return {
      path: relativePath,
      available: true,
      data: null,
      error: error.message,
    };
  }
}

function loadGraphArtifacts(repoRoot) {
  return {
    graphFacts: readOptionalArtifact(repoRoot, GRAPH_FACTS_PATH),
    providerStatus: readOptionalArtifact(repoRoot, PROVIDER_STATUS_PATH),
    impactCapabilities: readOptionalArtifact(repoRoot, IMPACT_CAPABILITIES_PATH),
  };
}

function statusHashFromGraphFacts(graphFacts) {
  if (!graphFacts) return null;
  return graphFacts.worktree_status_hash || (graphFacts.staleness_hints && graphFacts.staleness_hints.worktree_status_hash) || null;
}

function confidenceForStatus(status, graphFacts) {
  if (status === 'primary') {
    return ['high', 'medium', 'low'].includes(graphFacts && graphFacts.confidence) ? graphFacts.confidence : 'high';
  }
  if (status === 'degraded-fallback') return 'medium';
  if (status === 'no-source' || status === 'stale' || status === 'dirty-uncertain') return 'low';
  return 'unknown';
}

function reasonCodesForMissingArtifacts(artifacts) {
  const reasonCodes = [];
  if (!artifacts.graphFacts.available) reasonCodes.push('graph_facts_missing');
  if (!artifacts.providerStatus.available) reasonCodes.push('provider_status_missing');
  if (!artifacts.impactCapabilities.available) reasonCodes.push('impact_capabilities_missing');
  if (artifacts.graphFacts.error) reasonCodes.push('graph_facts_unreadable');
  if (artifacts.providerStatus.error) reasonCodes.push('provider_status_unreadable');
  if (artifacts.impactCapabilities.error) reasonCodes.push('impact_capabilities_unreadable');
  return reasonCodes;
}

function resolveGraphReadiness(artifacts, snapshot) {
  const missingReasonCodes = reasonCodesForMissingArtifacts(artifacts);
  const graphFacts = artifacts.graphFacts.data;
  const providerStatus = artifacts.providerStatus.data;
  const impactCapabilities = artifacts.impactCapabilities.data;
  const reasonCodes = [...missingReasonCodes];

  if (missingReasonCodes.length > 0 || !graphFacts || !providerStatus || !impactCapabilities) {
    return buildReadiness({
      status: 'missing',
      graphFacts,
      snapshot,
      reasonCodes,
      limitations: [
        'Canonical graph readiness artifacts are missing or unreadable; graph-aware experts must not make graph-backed impact claims.',
      ],
    });
  }

  if (graphFacts.schema_version !== 'graph-facts.v1') reasonCodes.push('graph_facts_schema_unsupported');
  if (providerStatus.schema_version !== 'graph-provider-status.v1') reasonCodes.push('provider_status_schema_unsupported');
  if (impactCapabilities.schema_version !== 'bootstrap-impact-capabilities.v1') reasonCodes.push('impact_capabilities_schema_unsupported');
  if (reasonCodes.some((code) => code.endsWith('_schema_unsupported'))) {
    return buildReadiness({
      status: 'blocked',
      graphFacts,
      snapshot,
      reasonCodes,
      limitations: [
        'One or more graph readiness artifacts use unsupported schemas; refresh graph bootstrap before relying on them.',
      ],
    });
  }

  if (!snapshot.current_revision || !snapshot.current_worktree_status_hash) {
    reasonCodes.push('repo_snapshot_unavailable');
    return buildReadiness({
      status: 'blocked',
      graphFacts,
      snapshot,
      reasonCodes,
      limitations: [
        'Current git snapshot is unavailable; graph readiness freshness cannot be verified.',
      ],
    });
  }

  const recordedRevision = graphFacts.source_revision || null;
  const recordedStatusHash = statusHashFromGraphFacts(graphFacts);
  const sourceRevisionMatches = !recordedRevision || recordedRevision === snapshot.current_revision;
  const worktreeStatusHashMatches = !recordedStatusHash || recordedStatusHash === snapshot.current_worktree_status_hash;

  if (!sourceRevisionMatches) {
    reasonCodes.push('source_revision_mismatch');
    return buildReadiness({
      status: 'stale',
      graphFacts,
      snapshot,
      reasonCodes,
      limitations: [
        'Graph facts were generated for a different HEAD; use them as orientation only and verify against current source.',
      ],
    });
  }

  if (!worktreeStatusHashMatches) {
    reasonCodes.push('worktree_status_hash_mismatch');
    return buildReadiness({
      status: 'dirty-uncertain',
      graphFacts,
      snapshot,
      reasonCodes,
      limitations: [
        'Graph facts do not match the current worktree fingerprint; graph-dependent confidence must be downgraded.',
      ],
    });
  }

  const workflowMode = graphFacts.workflow_mode || providerStatus.workflow_mode || impactCapabilities.workflow_mode || 'blocked';
  reasonCodes.push(`workflow_mode:${workflowMode}`);
  if (workflowMode === 'primary' || workflowMode === 'degraded-fallback' || workflowMode === 'no-source') {
    return buildReadiness({
      status: workflowMode,
      graphFacts,
      snapshot,
      reasonCodes,
      limitations: normalizeList(graphFacts.limitations),
    });
  }

  return buildReadiness({
    status: 'blocked',
    graphFacts,
    snapshot,
    reasonCodes,
    limitations: normalizeList(graphFacts.limitations).concat([
      'Graph readiness workflow mode is not query-ready for downstream expert evidence use.',
    ]),
  });
}

function buildReadiness({ status, graphFacts, snapshot, reasonCodes, limitations }) {
  const recordedRevision = graphFacts && graphFacts.source_revision ? graphFacts.source_revision : null;
  const recordedStatusHash = statusHashFromGraphFacts(graphFacts);
  const currentRevision = snapshot.current_revision;
  const currentStatusHash = snapshot.current_worktree_status_hash;
  return {
    status,
    confidence: confidenceForStatus(status, graphFacts),
    limitations_required: status !== 'primary',
    reason_codes: uniqueSorted(reasonCodes),
    freshness: {
      source_revision: recordedRevision,
      source_revision_matches: recordedRevision && currentRevision ? recordedRevision === currentRevision : null,
      worktree_dirty_at_bootstrap: graphFacts && typeof graphFacts.worktree_dirty === 'boolean' ? graphFacts.worktree_dirty : null,
      worktree_status_hash: recordedStatusHash,
      worktree_status_hash_matches: recordedStatusHash && currentStatusHash ? recordedStatusHash === currentStatusHash : null,
    },
    limitations: uniqueSorted(limitations),
  };
}

function normalizeProviderReadiness(providerStatus) {
  if (!providerStatus || !Array.isArray(providerStatus.providers)) return [];
  return providerStatus.providers.map((provider) => ({
    provider: provider.provider || 'unknown',
    graph_ready: provider.graph_ready === true,
    query_ready: provider.query_ready === true,
    status: provider.status || 'unknown',
    confidence: provider.query_ready === true ? 'high' : provider.graph_ready === true ? 'medium' : 'low',
    limitations: normalizeList(provider.limitations),
  }));
}

function supportLevel(impactCapabilities, capabilityName) {
  const value = impactCapabilities
    && impactCapabilities.capabilities
    && impactCapabilities.capabilities[capabilityName]
    && impactCapabilities.capabilities[capabilityName].support_level;
  return ['full', 'partial', 'none'].includes(value) ? value : 'unknown';
}

function capabilitySummary(graphFacts, providerStatus, impactCapabilities) {
  const providers = providerStatus && Array.isArray(providerStatus.providers) ? providerStatus.providers : [];
  return {
    query_global_graph: graphFacts && graphFacts.capabilities ? graphFacts.capabilities.query_global_graph === true : false,
    impact_context: graphFacts && graphFacts.capabilities ? graphFacts.capabilities.impact_context === true : false,
    context_selection: supportLevel(impactCapabilities, 'context_selection'),
    impact_radius: supportLevel(impactCapabilities, 'impact_radius'),
    review_support: supportLevel(impactCapabilities, 'review_support'),
    primary_providers: uniqueSorted(providers.filter((provider) => provider.query_ready === true).map((provider) => provider.provider || 'unknown')),
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

function routerSummary(workflow, routerCandidates) {
  const candidateAgents = routerCandidates
    ? (routerCandidates.candidate_agents || []).map((candidate) => candidate.id)
    : DEFAULT_GRAPH_AWARE_AGENTS_BY_WORKFLOW[workflow] || [];
  const graphAware = candidateAgents.filter((agentId) => isGraphAwareForWorkflow(agentId, workflow));
  const nonGraph = candidateAgents.filter((agentId) => !isGraphAwareForWorkflow(agentId, workflow));
  return {
    available: routerCandidates != null,
    reason_code: routerCandidates ? routerCandidates.reason_code : null,
    candidate_agents: uniqueSorted(candidateAgents),
    graph_aware_candidate_agents: uniqueSorted(graphAware),
    non_graph_candidate_agents: uniqueSorted(nonGraph),
    requires_skill_decision: routerCandidates ? routerCandidates.requires_skill_decision === true : true,
  };
}

function isGraphAwareForWorkflow(agentId, workflow) {
  const entry = GRAPH_AWARE_AGENTS[agentId];
  return entry && entry.workflows.includes(workflow);
}

function capabilityAvailable(summary, capabilityName) {
  if (capabilityName === 'query_global_graph') return summary.query_global_graph;
  if (capabilityName === 'impact_context') return summary.impact_context;
  const support = summary[capabilityName];
  return support === 'full' || support === 'partial';
}

function readinessCeiling(status) {
  if (status === 'primary') return 'high';
  if (status === 'degraded-fallback') return 'medium';
  if (status === 'no-source' || status === 'stale' || status === 'dirty-uncertain') return 'low';
  return 'unknown';
}

function lowerConfidence(left, right) {
  const order = ['unknown', 'low', 'medium', 'high'];
  return order[Math.min(order.indexOf(left), order.indexOf(right))];
}

function confidenceCeiling(agent, readiness, summary) {
  let ceiling = readinessCeiling(readiness.status);
  for (const capability of agent.required_capabilities) {
    if (!capabilityAvailable(summary, capability)) {
      ceiling = lowerConfidence(ceiling, readiness.status === 'primary' ? 'medium' : 'low');
    }
    if (summary[capability] === 'partial') {
      ceiling = lowerConfidence(ceiling, 'medium');
    }
  }
  return ceiling;
}

function allowedUseForStatus(status) {
  if (status === 'primary') return 'primary_evidence';
  if (status === 'missing' || status === 'blocked') return 'unavailable';
  return 'orientation_only';
}

function allowedGraphArtifacts(readiness) {
  const allowedUse = allowedUseForStatus(readiness.status);
  return [
    GRAPH_FACTS_PATH,
    PROVIDER_STATUS_PATH,
    IMPACT_CAPABILITIES_PATH,
  ].map((artifactPath) => ({
    path: artifactPath,
    allowed_use: allowedUse,
  }));
}

function requiredDisclosures(readiness, summary, agent) {
  const disclosures = [];
  if (readiness.status !== 'primary') disclosures.push(`graph_readiness:${readiness.status}`);
  for (const reasonCode of readiness.reason_codes) {
    if (reasonCode.includes('mismatch') || reasonCode.includes('missing') || reasonCode.includes('unsupported')) {
      disclosures.push(reasonCode);
    }
  }
  const missingCapabilities = agent.required_capabilities.filter((capability) => !capabilityAvailable(summary, capability));
  for (const capability of missingCapabilities) disclosures.push(`missing_capability:${capability}`);
  return uniqueSorted(disclosures);
}

function fallbackGuidance(readiness) {
  if (readiness.status === 'primary') {
    return [
      'Use graph artifacts as bounded evidence and still cite current files, diffs, or docs before making final judgments.',
    ];
  }
  if (readiness.status === 'degraded-fallback') {
    return [
      'Disclose degraded graph readiness and use local source, diff, tests, or workflow artifacts as primary evidence.',
    ];
  }
  if (readiness.status === 'stale' || readiness.status === 'dirty-uncertain') {
    return [
      'Treat graph artifacts as orientation only; refresh graph bootstrap or verify impact claims against current source before high-confidence findings.',
    ];
  }
  if (readiness.status === 'no-source') {
    return [
      'Do not use GitNexus process-routing claims; rely on bounded source and documentation evidence.',
    ];
  }
  return [
    'Do not make graph-backed impact claims; use bounded direct reads or session-local live MCP evidence if available and disclose it separately.',
  ];
}

function forbiddenClaims(readiness) {
  const claims = [
    'selected_agents',
    'final_verdict',
    'confirmed_standards_write',
    'semantic_impact_conclusion',
    'provider_query_ready_after_live_mcp_probe',
  ];
  if (readiness.status !== 'primary') {
    claims.push('high_confidence_graph_impact_claim');
    claims.push('graph_proves_no_callers');
  }
  return uniqueSorted(claims);
}

function expertGraphContext(workflow, router, readiness, summary) {
  return router.graph_aware_candidate_agents.map((agentId) => {
    const agent = GRAPH_AWARE_AGENTS[agentId];
    return {
      agent_id: agentId,
      graph_use_case: agent.graph_use_case,
      required_capabilities: agent.required_capabilities,
      confidence_ceiling: confidenceCeiling(agent, readiness, summary),
      required_disclosures: requiredDisclosures(readiness, summary, agent),
      fallback_guidance: fallbackGuidance(readiness),
      allowed_graph_artifacts: allowedGraphArtifacts(readiness),
      forbidden_claims: forbiddenClaims(readiness),
      requires_expert_judgment: true,
    };
  });
}

function normalizeInputSummary(input, routerCandidates) {
  const routerSummaryInput = routerCandidates && routerCandidates.input_summary ? routerCandidates.input_summary : {};
  return {
    changed_files: uniqueSorted([
      ...normalizeList(input.changed_files),
      ...normalizeList(routerSummaryInput.changed_files),
    ]),
    risk_signals: uniqueSorted([
      ...normalizeList(input.risk_signals),
      ...normalizeList(routerSummaryInput.risk_signals),
      ...normalizeList(routerSummaryInput.inferred_signals),
    ]),
    router_candidates_available: routerCandidates != null,
  };
}

function prepareGraphExpertBrief(input = {}, options = {}) {
  const workflow = options.workflow || input.workflow;
  assertSupportedWorkflow(workflow);

  const repoRoot = path.resolve(options.repoRoot || input.repo_root || REPO_ROOT);
  const routerCandidates = validateRouterContext(workflow, options.routerCandidates || input.router_candidates || null);
  const artifacts = loadGraphArtifacts(repoRoot);
  const snapshot = gitSnapshot(repoRoot);
  const readiness = resolveGraphReadiness(artifacts, snapshot);
  const summary = capabilitySummary(artifacts.graphFacts.data, artifacts.providerStatus.data, artifacts.impactCapabilities.data);
  const router = routerSummary(workflow, routerCandidates);
  const experts = expertGraphContext(workflow, router, readiness, summary);

  return {
    schema_version: 'spec-first.graph-expert-brief.v1',
    generated_from: 'scripts/prepare-ecc-graph-expert-brief.js',
    workflow,
    source_artifacts: {
      graph_facts: GRAPH_FACTS_PATH,
      provider_status: PROVIDER_STATUS_PATH,
      impact_capabilities: IMPACT_CAPABILITIES_PATH,
      graph_expert_brief_schema: GRAPH_EXPERT_BRIEF_SCHEMA,
      router_candidate_schema: routerCandidates ? ROUTER_CANDIDATE_SCHEMA : null,
    },
    input_summary: normalizeInputSummary(input, routerCandidates),
    git_snapshot: snapshot,
    graph_readiness: readiness,
    provider_readiness: normalizeProviderReadiness(artifacts.providerStatus.data),
    capability_summary: summary,
    router_context: router,
    expert_graph_context: experts,
    non_graph_agents: router.non_graph_candidate_agents.map((agentId) => ({
      agent_id: agentId,
      reason_code: 'not_graph_aware_for_workflow',
    })),
    decision_boundary: {
      requires_skill_decision: true,
      requires_expert_judgment: true,
      forbidden_outputs: [
        'selected_agents',
        'final_verdict',
        'confirmed_standards_write',
        'semantic_impact_conclusion',
      ],
    },
    forbidden_actions: [
      'selected_agents',
      'final_verdict',
      'confirmed_standards_write',
      'write_graph_artifacts',
      'run_provider_commands',
      'semantic_impact_conclusion',
      'rewrite_provider_readiness',
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
    } else if (arg === '--help' || arg === '-h') {
      result.help = true;
    }
  }
  return result;
}

function usage() {
  return [
    'Usage: node scripts/prepare-ecc-graph-expert-brief.js --workflow <spec-plan|spec-code-review|spec-doc-review> [--repo-root <path>] [--router-candidates <router-candidates.json>] [--changed-file <path> ...] [--risk-signal <signal> ...]',
    '',
    'Prepares read-only graph evidence-use briefing facts. It does not call graph providers, write graph artifacts, select final agents, or make semantic impact conclusions.',
  ].join('\n');
}

function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  if (!args.workflow) {
    throw new Error('missing --workflow <spec-plan|spec-code-review|spec-doc-review>');
  }
  const routerCandidates = args.routerCandidatesPath ? readJson(args.routerCandidatesPath) : null;
  const output = prepareGraphExpertBrief({
    workflow: args.workflow,
    repo_root: args.repo_root,
    changed_files: args.changed_files,
    risk_signals: args.risk_signals,
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
  DEFAULT_GRAPH_AWARE_AGENTS_BY_WORKFLOW,
  GRAPH_AWARE_AGENTS,
  hashStatusText,
  prepareGraphExpertBrief,
  resolveGraphReadiness,
};
