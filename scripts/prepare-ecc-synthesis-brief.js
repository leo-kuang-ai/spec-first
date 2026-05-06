#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { validateAgainstSchema } = require('../src/contracts/schema-validator');

const REPO_ROOT = path.join(__dirname, '..');
const FINDING_CORE_SCHEMA = 'src/cli/contracts/agent-registry/finding-core.schema.json';
const SYNTHESIS_BRIEF_SCHEMA = 'src/cli/contracts/agent-registry/synthesis-brief.schema.json';
const ROUTER_CANDIDATE_SCHEMA = 'src/cli/contracts/agent-registry/router-candidate-output.schema.json';

const SUPPORTED_WORKFLOWS = ['spec-code-review', 'spec-doc-review'];
const TITLE_STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'in',
  'is',
  'it',
  'lacks',
  'missing',
  'of',
  'on',
  'or',
  'the',
  'to',
  'with',
  'without',
]);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadSchema(relativePath) {
  return readJson(path.join(REPO_ROOT, relativePath));
}

function normalizeList(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim()) : [];
}

function uniqueSorted(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function validateOrThrow(schemaPath, value, label) {
  const result = validateAgainstSchema(loadSchema(schemaPath), value);
  if (!result.valid) {
    throw new Error(`${label} failed schema validation: ${result.errors.join('; ')}`);
  }
}

function assertSupportedWorkflow(workflow) {
  if (!SUPPORTED_WORKFLOWS.includes(workflow)) {
    throw new Error(`unsupported workflow for synthesis brief: ${workflow}`);
  }
}

function normalizeProjectionInput(input) {
  if (Array.isArray(input)) return input;
  if (input && Array.isArray(input.projections)) return input.projections;
  if (input && input.schema_version === 'spec-first.finding-core-projection.v1') return [input];
  throw new Error('input must be a Finding Core projection, an array of projections, or { projections: [...] }');
}

function validateProjection(workflow, projection, index) {
  validateOrThrow(FINDING_CORE_SCHEMA, projection, `finding core projection #${index + 1}`);
  if (projection.workflow !== workflow) {
    throw new Error(`finding core projection #${index + 1} workflow mismatch: expected ${workflow}, received ${projection.workflow}`);
  }
}

function validateRouterContext(workflow, routerCandidates) {
  if (!routerCandidates) return null;
  validateOrThrow(ROUTER_CANDIDATE_SCHEMA, routerCandidates, 'router candidate facts');
  if (routerCandidates.workflow !== workflow) {
    throw new Error(`router candidate workflow mismatch: expected ${workflow}, received ${routerCandidates.workflow}`);
  }
  return routerCandidates;
}

function routerSummary(routerCandidates) {
  if (!routerCandidates) {
    return {
      available: false,
      reason_code: null,
      candidate_agents: [],
      requires_skill_decision: false,
    };
  }

  return {
    available: true,
    reason_code: routerCandidates.reason_code,
    candidate_agents: (routerCandidates.candidate_agents || []).map((candidate) => ({
      id: candidate.id,
      budget_hint: candidate.budget_hint,
      reason_codes: normalizeList(candidate.reason_codes),
    })),
    requires_skill_decision: routerCandidates.requires_skill_decision === true,
  };
}

function canonicalText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((word) => word && !TITLE_STOP_WORDS.has(word))
    .slice(0, 12)
    .join('-') || 'untitled';
}

function firstEvidenceValue(finding) {
  const first = Array.isArray(finding.evidence) ? finding.evidence[0] : null;
  return first && typeof first.value === 'string' ? first.value : '';
}

function targetForFinding(finding) {
  const native = finding.native_preserved || {};
  if (native.file && native.line) {
    return {
      kind: 'file_line',
      value: `${native.file}:${native.line}`,
    };
  }
  if (native.file) {
    return {
      kind: 'file',
      value: native.file,
    };
  }
  if (native.section) {
    return {
      kind: 'section',
      value: native.section,
    };
  }
  const evidenceValue = firstEvidenceValue(finding);
  if (evidenceValue) {
    return {
      kind: 'evidence',
      value: evidenceValue,
    };
  }
  return {
    kind: 'title',
    value: finding.title,
  };
}

function mergeHintKey(finding, target) {
  return [
    finding.workflow,
    target.kind,
    canonicalText(target.value),
    canonicalText(finding.title),
  ].join('::');
}

function attentionFlags(finding, routerCandidateIds) {
  const native = finding.native_preserved || {};
  const flags = [];
  if (finding.projection_status !== 'projected') flags.push('projection_degraded');
  if (finding.projection_status === 'degraded_missing_evidence') flags.push('missing_evidence');
  if (finding.projection_status === 'rejected_by_native_confidence') flags.push('rejected_by_native_confidence');
  if (finding.evidence.length === 0) flags.push('missing_evidence');
  if (native.pre_existing) flags.push('pre_existing');
  if (native.requires_verification) flags.push('verification_required');
  if (finding.recommendation == null) flags.push('missing_recommendation');
  if (routerCandidateIds && !routerCandidateIds.has(finding.agent_id)) flags.push('finding_agent_outside_router_candidates');
  return uniqueSorted(flags);
}

function rankHint(finding, flags) {
  const reasonCodes = [
    `severity:${finding.severity_display}`,
    `confidence:${finding.confidence_display}`,
    `projection:${finding.projection_status}`,
  ];

  if (flags.includes('pre_existing')) reasonCodes.push('attention:pre_existing');
  if (flags.includes('projection_degraded')) reasonCodes.push('attention:projection_degraded');
  if (flags.includes('missing_evidence')) reasonCodes.push('attention:missing_evidence');
  if (flags.includes('rejected_by_native_confidence')) reasonCodes.push('attention:rejected_by_native_confidence');

  if (
    finding.confidence_display === 'reject' ||
    finding.projection_status !== 'projected' ||
    flags.includes('pre_existing')
  ) {
    return {
      bucket: 'advisory_attention',
      reason_codes: uniqueSorted(reasonCodes),
    };
  }
  if (finding.severity_display === 'blocker') {
    return {
      bucket: 'blocking_attention',
      reason_codes: uniqueSorted(reasonCodes),
    };
  }
  if (finding.severity_display === 'high') {
    return {
      bucket: 'high_attention',
      reason_codes: uniqueSorted(reasonCodes),
    };
  }
  if (finding.severity_display === 'medium') {
    return {
      bucket: 'medium_attention',
      reason_codes: uniqueSorted(reasonCodes),
    };
  }
  return {
    bucket: 'advisory_attention',
    reason_codes: uniqueSorted(reasonCodes),
  };
}

function flattenFindings(workflow, projections, routerCandidateIds) {
  const facts = [];
  let counter = 0;
  for (const projection of projections) {
    for (const finding of projection.finding_core || []) {
      counter += 1;
      const target = targetForFinding(finding);
      const flags = attentionFlags(finding, routerCandidateIds);
      facts.push({
        ref: `F${counter}`,
        workflow,
        agent_id: finding.agent_id,
        native_finding_ref: finding.native_finding_ref,
        category: finding.category,
        title: finding.title,
        severity_display: finding.severity_display,
        confidence_display: finding.confidence_display,
        projection_status: finding.projection_status,
        evidence_count: Array.isArray(finding.evidence) ? finding.evidence.length : 0,
        target,
        merge_hint_key: mergeHintKey(finding, target),
        rank_hint: rankHint(finding, flags),
        attention_flags: flags,
        native_preserved: finding.native_preserved || {},
        adapter_notes: normalizeList(finding.adapter_notes),
      });
    }
  }
  return facts;
}

function mergeCandidateGroups(findingFacts) {
  const groups = new Map();
  for (const fact of findingFacts) {
    const current = groups.get(fact.merge_hint_key) || [];
    current.push(fact);
    groups.set(fact.merge_hint_key, current);
  }

  return [...groups.entries()]
    .filter(([, facts]) => facts.length > 1)
    .map(([mergeHintKey, facts]) => ({
      merge_hint_key: mergeHintKey,
      reason_code: 'same_target_and_title_fingerprint',
      finding_refs: facts.map((fact) => fact.ref),
      agent_ids: uniqueSorted(facts.map((fact) => fact.agent_id)),
      requires_skill_decision: true,
    }));
}

function rankBucketHints(findingFacts) {
  const buckets = {
    blocking_attention_refs: [],
    high_attention_refs: [],
    medium_attention_refs: [],
    advisory_attention_refs: [],
  };
  for (const fact of findingFacts) {
    buckets[`${fact.rank_hint.bucket}_refs`].push(fact.ref);
  }
  return buckets;
}

function refsWithFlag(findingFacts, flag) {
  return findingFacts.filter((fact) => fact.attention_flags.includes(flag)).map((fact) => fact.ref);
}

function attentionHints(findingFacts, routerCandidateIds) {
  const findingAgentIds = new Set(findingFacts.map((fact) => fact.agent_id));
  return {
    degraded_refs: refsWithFlag(findingFacts, 'projection_degraded'),
    rejected_by_native_confidence_refs: refsWithFlag(findingFacts, 'rejected_by_native_confidence'),
    missing_evidence_refs: refsWithFlag(findingFacts, 'missing_evidence'),
    pre_existing_refs: refsWithFlag(findingFacts, 'pre_existing'),
    verification_required_refs: refsWithFlag(findingFacts, 'verification_required'),
    missing_recommendation_refs: refsWithFlag(findingFacts, 'missing_recommendation'),
    router_candidate_without_finding_refs: routerCandidateIds
      ? [...routerCandidateIds].filter((agentId) => !findingAgentIds.has(agentId))
      : [],
    finding_agent_outside_router_refs: refsWithFlag(findingFacts, 'finding_agent_outside_router_candidates'),
  };
}

function prepareSynthesisBrief(input, options = {}) {
  const workflow = options.workflow || input.workflow;
  assertSupportedWorkflow(workflow);

  const projections = normalizeProjectionInput(input.projections || input);
  projections.forEach((projection, index) => validateProjection(workflow, projection, index));

  const routerCandidates = validateRouterContext(workflow, options.routerCandidates || input.router_candidates);
  const router = routerSummary(routerCandidates);
  const routerCandidateIds = router.available ? new Set(router.candidate_agents.map((candidate) => candidate.id)) : null;
  const findingFacts = flattenFindings(workflow, projections, routerCandidateIds);

  return {
    schema_version: 'spec-first.synthesis-brief.v1',
    generated_from: 'scripts/prepare-ecc-synthesis-brief.js',
    workflow,
    source_artifacts: {
      finding_core_schema: FINDING_CORE_SCHEMA,
      synthesis_brief_schema: SYNTHESIS_BRIEF_SCHEMA,
      router_candidate_schema: router.available ? ROUTER_CANDIDATE_SCHEMA : null,
    },
    input_summary: {
      projection_count: projections.length,
      finding_count: findingFacts.length,
      workflows: uniqueSorted(projections.map((projection) => projection.workflow)),
      agents: uniqueSorted(findingFacts.map((fact) => fact.agent_id)),
    },
    router_context: router,
    finding_facts: findingFacts,
    merge_candidate_groups: mergeCandidateGroups(findingFacts),
    rank_bucket_hints: rankBucketHints(findingFacts),
    attention_hints: attentionHints(findingFacts, routerCandidateIds),
    synthesis_decision_slots: {
      must_be_filled_by_skill: true,
      merge: [],
      adopt: [],
      reject: [],
      downgrade: [],
      upgrade: [],
      final_summary: null,
    },
    requires_skill_synthesis: true,
    forbidden_actions: [
      'selected_agents',
      'final_verdict',
      'confirmed_standards_write',
      'rewrite_native_schema',
      'write_workflow_runtime',
      'semantic_adopt_reject_without_skill',
    ],
  };
}

function parseArgs(argv) {
  const result = {
    inputPaths: [],
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--input') {
      result.inputPaths.push(argv[index + 1]);
      index += 1;
    } else if (arg === '--workflow') {
      result.workflow = argv[index + 1];
      index += 1;
    } else if (arg === '--router-candidates') {
      result.routerCandidatesPath = argv[index + 1];
      index += 1;
    } else if (arg === '--help' || arg === '-h') {
      result.help = true;
    }
  }
  return result;
}

function usage() {
  return [
    'Usage: node scripts/prepare-ecc-synthesis-brief.js --workflow <spec-code-review|spec-doc-review> --input <finding-core-projection.json> [--input <finding-core-projection.json> ...] [--router-candidates <router-candidates.json>]',
    '',
    'Prepares read-only synthesis briefing facts. Skills still own merge/adopt/reject/downgrade/final summary decisions.',
  ].join('\n');
}

function readInputs(inputPaths) {
  if (!inputPaths || inputPaths.length === 0) {
    throw new Error('missing --input <finding-core-projection.json>');
  }
  return inputPaths.map((inputPath) => readJson(inputPath));
}

function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    console.log(usage());
    return 0;
  }
  if (!args.workflow) {
    throw new Error('missing --workflow <spec-code-review|spec-doc-review>');
  }
  const inputs = readInputs(args.inputPaths);
  const routerCandidates = args.routerCandidatesPath ? readJson(args.routerCandidatesPath) : null;
  const output = prepareSynthesisBrief({
    workflow: args.workflow,
    projections: inputs,
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
  prepareSynthesisBrief,
  targetForFinding,
};
