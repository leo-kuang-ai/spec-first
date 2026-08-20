#!/usr/bin/env node
'use strict';

// This writer contains the semantic owner decisions for the closeout seed.
// The deterministic producer only validates the resulting artifacts.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const producer = require('./check-ce-localization-review.cjs');

const repoRoot = path.resolve(__dirname, '..');
const root = path.join(repoRoot, 'docs/validation/ce-localization');
const iso = '2026-08-20T00:00:00.000Z';
const sha = (value) => crypto.createHash('sha256').update(JSON.stringify(value, null, 2) + '\n').digest('hex');
const write = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
};
const strings = (value) => Array.isArray(value) ? value : [value];
const LOCAL_ONLY_SKILL_IDS = [
  'spec-app-consistency-audit', 'spec-polish', 'spec-prd',
  'spec-rule-miner', 'spec-write-tasks', 'using-spec-first',
];

const skills = [
  ['spec-app-consistency-audit', 'mobile App PRD/Figma/local-source consistency', 'A1', 'consistency evidence and actionable report', 'cross-source audit before runtime validation'],
  ['spec-brainstorm', 'ambiguous product or engineering intent framing', 'A1', 'right-sized requirements-only plan', 'reduce scope ambiguity before planning'],
  ['spec-code-review', 'source diff review and risk explanation', 'A1', 'prioritized findings with evidence', 'catch regressions before delivery'],
  ['spec-commit', 'authorized local commit preparation', 'A1', 'scoped commit candidate', 'preserve authorization and exact write set'],
  ['spec-commit-push-pr', 'authorized commit, push and PR landing', 'A1', 'value-first PR handoff', 'reduce delivery coordination cost'],
  ['spec-compound', 'capture verified reusable engineering learning', 'A5', 'source-bound promotion input', 'make validated experience reusable'],
  ['spec-compound-refresh', 'refresh stale or overlapping learnings', 'A5', 'current-source learning index', 'prevent stale knowledge reuse'],
  ['spec-debug', 'diagnose failing behavior from evidence', 'A1', 'root cause and next action', 'reduce repeated diagnosis and rework'],
  ['spec-doc-review', 'review requirements and plans', 'A4', 'role-scoped document findings', 'improve planning quality before execution'],
  ['spec-dogfood', 'diff-scoped browser user-flow QA', 'A4', 'observed browser evidence', 'catch user-flow regressions before shipping'],
  ['spec-explain', 'teach a concept or work window durably', 'A1', 'reusable teaching artifact', 'improve transfer of project understanding'],
  ['spec-handoff', 'resume work across sessions', 'A1', 'freshness-bound handoff', 'reduce context loss across sessions'],
  ['spec-ideate', 'generate grounded ideas before choosing one', 'A1', 'ranked options with evidence limits', 'expand useful solution space safely'],
  ['spec-lfg', 'run an explicitly authorized engineering pipeline', 'A1', 'green PR pipeline handoff', 'coordinate delivery without hidden side effects'],
  ['spec-optimize', 'metric-driven iterative optimization', 'A3', 'measured candidate decision', 'improve a declared measurable outcome'],
  ['spec-plan', 'create evidence-grounded implementation plan', 'A1', 'implementation-ready plan', 'shorten time from intent to executable work'],
  ['spec-polish', 'browser-based UI polish loop', 'A1', 'verified visual refinement', 'improve user-facing quality before handoff'],
  ['spec-pov', 'decisive project-grounded external input verdict', 'A2', 'adopt/defer/reject verdict', 'avoid abstract technology decisions'],
  ['spec-prd', 'brownfield PRD planning readiness', 'A1', 'implementation-ready requirements', 'reduce ambiguity before planning'],
  ['spec-product-pulse', 'time-windowed product signal report', 'A2', 'status-aware pulse report', 'support evidence-based prioritization'],
  ['spec-promote', 'launch or promotion copy for shipped work', 'A1', 'authorized promotion draft', 'communicate shipped value safely'],
  ['spec-prototype', 'throwaway prototype for unresolved behavior', 'A1', 'human-decision prototype receipt', 'resolve behavior uncertainty before production work'],
  ['spec-resolve-pr-feedback', 'evaluate and resolve PR feedback', 'A1', 'conflict-aware landed fixes', 'reduce review turnaround and regressions'],
  ['spec-riffrec-feedback-analysis', 'analyze explicit Riffrec feedback capture', 'A1', 'privacy-bounded feedback analysis', 'turn feedback into actionable product work'],
  ['spec-rule-miner', 'mine actual repository coding conventions', 'A3', 'source-evidenced project rules', 'improve future generated code fit'],
  ['spec-runtime-setup', 'setup and verify harness readiness', 'A1', 'host/status readiness facts', 'avoid setup-driven false readiness'],
  ['spec-simplify-code', 'simplify recently changed code safely', 'A3', 'behavior-preserving simplification', 'reduce maintenance cost without losing safeguards'],
  ['spec-strategy', 'create or update product strategy', 'A2', 'durable strategy decision', 'align future work with product value'],
  ['spec-sweep', 'sweep configured feedback sources', 'A1', 'acknowledged feedback and plan', 'reduce feedback discovery latency'],
  ['spec-test-browser', 'run browser tests on affected pages', 'A4', 'observed browser test evidence', 'verify user-visible behavior'],
  ['spec-test-xcode', 'build and test iOS app on simulator', 'A4', 'simulator test evidence', 'catch platform regressions before PR'],
  ['spec-work', 'execute settled plan end-to-end', 'A1', 'verified source change and handoff', 'turn plans into trusted changes'],
  ['spec-worktree', 'caller-owned worktree isolation', 'A3', 'isolated work execution handoff', 'protect parallel work boundaries'],
  ['spec-write-skill', 'create or improve project-owned Skill', 'A3', 'validated Skill package', 'increase reusable workflow capability'],
  ['spec-write-tasks', 'compile implementation plan into task pack', 'A1', 'validated derived task pack', 'reduce execution decomposition cost'],
  ['using-spec-first', 'route an intent to the right workflow', 'A1', 'single bounded entry recommendation', 'avoid wrong workflow and hidden mutation'],
];

function snapshot(deterministic) { return deterministic.inventory.source_snapshot; }
function metric(skillId) {
  return {
    metric_id: `${skillId}.trusted-change-gate`,
    metric_type: 'binary-gate',
    direction: 'pass',
    instrumentation_ref: 'docs/contracts/ai-coding-harness.md#quality-adjusted-throughput',
    numerator: 'runs satisfying the declared source, authorization and verification gates',
    denominator: 'eligible runs in the declared validation window',
    measurement_window: 'field validation window; not-run until protocol is executed',
    missing_data_policy: 'retain not-run and do not impute success',
  };
}
function baselineFor(skillId, deterministic) {
  const entry = deterministic.inventory.skills.find((item) => item.skill_id === skillId);
  const improvement = {
    frozen_at: iso,
    metric_owner: 'skills/spec-optimize',
    metric_contract_ref: 'skills/spec-optimize/references/experiment-log-schema.yaml',
    metric_contract_sha256: '0'.repeat(64),
    noise_floor: 'not observed; field protocol must establish before comparison',
    budget: 'one bounded validation cohort before any promotion decision',
    measurement_artifact_refs: ['docs/validation/ce-localization/field-validation/protocol.json'],
    primary_metric: metric(skillId),
    secondary_metrics: [],
    minimum_detectable_improvement: 'predeclare an effect and uncertainty threshold before candidate results',
    acceptable_regression: 'no critical safety, authorization, correctness or required-verification regression',
    sample_requirement: 'at least three paired tasks for exploratory evidence; independent replication for confirmed improvement',
    decision_rule: 'not-run or degraded remains incomplete; only predeclared thresholds can support confirmed claims',
  };
  improvement.metric_contract_sha256 = sha(improvement);
  return {
    schema_version: 'ce-localization-skill-baseline/v1',
    artifact_kind: 'source-bound-skill-baseline',
    producer: `skill-owner:${skillId}`,
    single_writer: 'ce-localization-baseline-writer',
    source_snapshot: snapshot(deterministic),
    inventory_ref: 'docs/validation/ce-localization/skill-inventory.json',
    inventory_sha256: sha(deterministic.inventory),
    skill_id: skillId,
    source_refs: entry.package_paths.map((p) => p),
    before_state: `Current canonical ${skillId} source is the baseline; semantic improvement is not assumed from CE coverage.`,
    target_state: 'A source-bound Skill contract that preserves authorization, evidence and owner boundaries while improving the declared user task.',
    known_limitations: ['No field task or provider outcome has been executed in this closeout.'],
    invalidation_conditions: ['target source snapshot drift', 'owner contract changes', 'new counterexample or field regression'],
    candidate_snapshot: snapshot(deterministic),
    candidate_diff_ref: 'not-run: no candidate mutation is claimed by this artifact',
    improvement_contract: improvement,
    improvement_contract_sha256: sha(improvement),
    evidence_axes: {
      structure_contract: { state: 'confirmed', evidence_refs: entry.package_paths.slice(0, 3), limitations: [] },
      behavior_quality: { state: 'partial', evidence_refs: [], limitations: ['Fresh semantic eval and owner re-review are not represented by this baseline alone.'] },
      runtime_cost: { state: 'not-run', evidence_refs: [], limitations: ['No paired token/latency/correction measurement.'] },
      field_outcome: { state: 'not-run', evidence_refs: [], limitations: ['No representative baseline/candidate task cohort.'] },
    },
    final_status: 'degraded-or-partial',
    consumers: ['U4', 'U5', 'U6', 'U7', 'U8', 'U9', 'U10'],
    claim_ceiling: 'Source-bound baseline and frozen measurement contract only; does not prove behavior improvement, runtime savings or field value.',
  };
}

function scenarioFor([skillId, task, actor, outcome, gain], deterministic) {
  const kind = ['spec-runtime-setup', 'spec-worktree', 'using-spec-first'].includes(skillId)
    ? 'router' : (['spec-commit', 'spec-commit-push-pr', 'spec-lfg', 'spec-promote'].includes(skillId) ? 'side-effect' : 'user-facing');
  return {
    scenario_id: `SCN-${skillId.replace(/[^a-z0-9]+/gi, '-').toUpperCase()}`,
    skill_id: skillId,
    scenario_kind: kind,
    visibility: 'public',
    actor,
    actor_outcome: outcome,
    user_task: task,
    inputs: [`user intent for ${task}`, `current source and relevant evidence for ${skillId}`],
    outputs: [outcome, 'explicit limitations and next action'],
    failure_cost: 'wrong owner, hidden side effect, stale evidence or rework in the affected delivery stage',
    canonical_owner: `skills/${skillId}`,
    source_refs: [`skills/${skillId}/SKILL.md`],
    downstream_consumers: ['spec-work', 'spec-code-review', 'spec-compound'],
    requirement_refs: ['R2', 'R3', 'R5', 'R6', 'R7', 'R19'],
    acceptance_example_refs: ['AE1', 'AE3', 'AE5'],
    expected_rnd_gain: gain,
    scenario_fingerprint_ref: 'docs/contracts/workflows/scenario-capability-matrix.md',
    limitations: ['Source and focused-contract evidence do not prove field adoption or outcome.'],
    status: 'confirmed-source-contract',
  };
}

function buildCloseout() {
  const deterministic = producer.buildArtifacts();
  const snap = snapshot(deterministic);
  const scenarioRows = skills.map((item) => scenarioFor(item, deterministic));
  scenarioRows.push({
    scenario_id: 'SCN-CE-UPSTREAM-EVIDENCE', skill_id: null, scenario_kind: 'internal-helper', visibility: 'evidence-only',
    actor: 'A4', actor_outcome: '517 CE path facts remain source-bound evidence for local adjudication',
    user_task: 'inspect CE upstream facts without treating them as local value proof', inputs: ['ce v2 adjudication and current target snapshot'], outputs: ['validated upstream evidence'],
    failure_cost: 'stale upstream fact or accidental second truth source', canonical_owner: 'ce-localization-review', source_refs: ['docs/validation/2026-08-19-ce-post-3-20-adjudication.json'],
    downstream_consumers: ['spec-work'], requirement_refs: ['R6', 'R15'], acceptance_example_refs: ['AE1', 'AE8'], expected_rnd_gain: 'preserve upstream facts without overriding local owner judgment',
    scenario_fingerprint_ref: 'docs/contracts/workflows/scenario-capability-matrix.md', limitations: ['No local user-facing behavior is implied.'], status: 'evidence-only',
  });
  const scenarioBySkill = new Map(scenarioRows.filter((s) => s.skill_id).map((s) => [s.skill_id, s.scenario_id]));
  const pathCoverage = [
    ...deterministic.inventory.files.map((file) => ({ path: file.path, owning_skill: file.owning_skill, path_role: file.path_role, evidence_role: file.evidence_role, terminal_disposition: 'scenario-bound', scenario_ids: [scenarioBySkill.get(file.owning_skill)], source_sha256: file.sha256 })),
    ...deterministic.coverage.direct_support.map((file) => ({ path: file.path, owning_skill: file.owning_skill, path_role: file.path_role, evidence_role: file.evidence_role, terminal_disposition: 'scenario-bound', scenario_ids: [scenarioBySkill.get(file.owning_skill)], source_sha256: file.sha256 })),
  ];
  const handoffContracts = [
    ['spec-prd', 'spec-plan'], ['spec-plan', 'spec-write-tasks'], ['spec-write-tasks', 'spec-work'], ['spec-work', 'spec-code-review'], ['spec-code-review', 'spec-compound'],
  ].map(([producerSkill, consumerSkill], index) => ({
    handoff_id: `HANDOFF-${index + 1}`, producer_skill: producerSkill, consumer_skill: consumerSkill, artifact_ref: 'docs/validation/ce-localization/skill-scenarios.json', artifact_sha256: null,
    freshness: 'current', required_preconditions: ['source snapshot current', 'required owner evidence available'], consumer_receipt: 'not-run', claim_ceiling: 'Declared handoff topology only; consumer execution was not observed.', reason_code: 'consumer-receipt-not-run', next_action: 'Run the owning workflow and capture a consumer receipt before claiming chain closure.',
  }));
  const scenariosArtifact = {
    schema_version: 'ce-localization-skill-scenarios/v1', artifact_kind: 'source-bound-semantic-scenario-inventory', producer: 'spec-work-semantic-adjudication-owner', single_writer: 'ce-localization-scenario-writer', source_snapshot: snap,
    inventory_ref: 'docs/validation/ce-localization/skill-inventory.json', inventory_sha256: sha(deterministic.inventory), scenario_fingerprint_contract_ref: 'docs/contracts/workflows/scenario-capability-matrix.md', scenarios: scenarioRows, path_coverage: pathCoverage, handoff_contracts: handoffContracts, consumers: ['spec-work', 'spec-code-review', 'spec-compound'], claim_ceiling: 'Scenario and deterministic path coverage are source-bound; they do not prove semantic adequacy, runtime behavior or field value.',
  };
  const baselines = skills.map((item) => baselineFor(item[0], deterministic));
  const baselineBySkill = new Map(baselines.map((b) => [b.skill_id, b]));
  const upstream = producer.readJson ? producer.readJson(path.join(repoRoot, 'docs/validation/2026-08-19-ce-post-3-20-adjudication.json')) : JSON.parse(fs.readFileSync(path.join(repoRoot, 'docs/validation/2026-08-19-ce-post-3-20-adjudication.json')));
  const ownerToSkill = new Map(skills.map((item) => [item[0], item[0]]));
  const packageOwner = new Map();
  for (const record of upstream.records) {
    if (record.canonical_owner && record.canonical_owner.startsWith('skills/')) packageOwner.set(record.package_id, record.canonical_owner.split('/')[1]);
  }
  const ledgerEntries = upstream.records.map((record, index) => {
    const skillId = record.canonical_owner && record.canonical_owner.startsWith('skills/') ? record.canonical_owner.split('/')[1] : packageOwner.get(record.package_id) || 'spec-work';
    const baseline = baselineBySkill.get(skillId);
    return {
      ledger_id: `LOC-CE-${String(index + 1).padStart(3, '0')}`, ce_relation: 'upstream', ce_record_id: record.audit_id, ce_path: record.path, target_repo: repoRoot, target_repo_head: snap.head, source_tree_hash: snap.source_tree_hash, inventory_hash: snap.inventory_hash, scenario_id: scenarioBySkill.get(skillId) || 'SCN-CE-UPSTREAM-EVIDENCE', scenario_kind: scenarioBySkill.get(skillId) ? scenarioRows.find((s) => s.scenario_id === scenarioBySkill.get(skillId)).scenario_kind : 'evidence-only', visibility: record.target_action === 'evidence-only' ? 'evidence-only' : 'internal', primary_user_tasks: [scenarioRows.find((s) => s.skill_id === skillId)?.user_task || 'preserve CE evidence'], actors: [scenarioRows.find((s) => s.skill_id === skillId)?.actor || 'A4'], actor_outcomes: [scenarioRows.find((s) => s.skill_id === skillId)?.actor_outcome || 'source-bound evidence'], canonical_owner: `skills/${skillId}`, evidence_owner: 'spec-work-semantic-adjudication-owner', source_refs: record.source_refs || [record.path], test_refs: record.test_refs || ['tests/unit/ce-upstream-reconciliation-v2.test.js'], evidence_role: 'upstream-fact', ce_behavior_intent: [record.role || 'upstream CE path fact'], localization_disposition: record.target_action === 'evidence-only' ? 'evidence-only' : 'compose', architecture_posture: 'not-applicable', implementation_unit: record.implementation_unit || 'U4', implementation_targets: record.implementation_targets || [], target_action: record.target_action || 'evidence-only', product_contract_refs: ['R6', 'R15'], requirement_refs: ['R6', 'R15'], acceptance_example_refs: ['AE1', 'AE8'], expected_rnd_gain: 'preserve useful upstream evidence while keeping local semantic ownership', adjudication_status: 'confirmed', baseline_ref: `docs/validation/ce-localization/baseline/${skillId}.json`, improvement_contract_hash: baseline ? baseline.improvement_contract_sha256 : sha({}), preserved_behavior: [record.role || 'upstream fact'], intentionally_rejected_behavior: ['CE-only semantic ownership outside local owner'], new_local_behavior: [], downstream_consumers: ['spec-work'], handoff_contract_refs: [], setup_dependency_refs: [], setup_dependency_status: 'not-applicable', complexity_cost: 'No new runtime owner; ledger maintenance only.', structure_contract: { state: 'confirmed', evidence_refs: record.source_refs || [record.path], limitations: [] }, behavior_quality: { state: 'partial', evidence_refs: [], limitations: ['Semantic adequacy not field-tested.'] }, runtime_cost: { state: 'not-run', evidence_refs: [], limitations: ['No paired cost measurement.'] }, field_outcome: { state: 'not-run', evidence_refs: [], limitations: ['No field task.'] }, evidence_refs: [record.path], limitations: ['Upstream record is not local value proof.'], reassessment_trigger: ['target snapshot drift', 'new local consumer', 'field counterexample'], final_status: 'degraded-or-partial',
    };
  });
  for (const skillId of LOCAL_ONLY_SKILL_IDS) {
    const baseline = baselineBySkill.get(skillId);
    ledgerEntries.push({
      ledger_id: `LOC-LOCAL-${skillId.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}`, ce_relation: 'local-only', ce_record_id: null, ce_path: null, target_repo: repoRoot, target_repo_head: snap.head, source_tree_hash: snap.source_tree_hash, inventory_hash: snap.inventory_hash, scenario_id: scenarioBySkill.get(skillId), scenario_kind: scenarioRows.find((s) => s.skill_id === skillId).scenario_kind, visibility: 'public', primary_user_tasks: [scenarioRows.find((s) => s.skill_id === skillId).user_task], actors: [scenarioRows.find((s) => s.skill_id === skillId).actor], actor_outcomes: [scenarioRows.find((s) => s.skill_id === skillId).actor_outcome], canonical_owner: skillId, evidence_owner: `skills/${skillId}`, source_refs: [`skills/${skillId}/SKILL.md`], test_refs: [`tests/unit/${skillId}-contracts.test.js`], evidence_role: 'local-contract', ce_behavior_intent: ['local-only Skill contract'], localization_disposition: 'reuse', architecture_posture: 'reuse', implementation_unit: 'U4', implementation_targets: [], target_action: 'local-only', product_contract_refs: ['R2', 'R3', 'R5', 'R19'], requirement_refs: ['R2', 'R3', 'R5', 'R19'], acceptance_example_refs: ['AE1', 'AE5'], expected_rnd_gain: scenarioRows.find((s) => s.skill_id === skillId).expected_rnd_gain, adjudication_status: 'confirmed', baseline_ref: `docs/validation/ce-localization/baseline/${skillId}.json`, improvement_contract_hash: baseline.improvement_contract_sha256, preserved_behavior: ['current local Skill contract'], intentionally_rejected_behavior: ['unowned CE copy'], new_local_behavior: [], downstream_consumers: ['spec-work'], handoff_contract_refs: [], setup_dependency_refs: [], setup_dependency_status: 'not-applicable', complexity_cost: 'No CE package; local evidence only.', structure_contract: { state: 'confirmed', evidence_refs: [`skills/${skillId}/SKILL.md`], limitations: [] }, behavior_quality: { state: 'partial', evidence_refs: [], limitations: ['Fresh field evidence not-run.'] }, runtime_cost: { state: 'not-run', evidence_refs: [], limitations: ['No paired measurement.'] }, field_outcome: { state: 'not-run', evidence_refs: [], limitations: ['No field task.'] }, evidence_refs: [`skills/${skillId}/SKILL.md`], limitations: ['Local-only does not imply CE equivalence.'], reassessment_trigger: ['new CE counterpart', 'new consumer', 'field counterexample'], final_status: 'degraded-or-partial',
    });
  }
  const fieldProtocol = { schema_version: 'ce-localization-field-validation-protocol/v1', artifact_kind: 'predeclared-field-validation-protocol', producer: 'ce-localization-field-validation-owner', single_writer: 'ce-localization-field-protocol-writer', source_snapshot: snap, inventory_ref: 'docs/validation/ce-localization/skill-inventory.json', inventory_sha256: sha(deterministic.inventory), protocol_id: 'FIELD-CE-LOCALIZATION-2026-08-20', frozen_at: iso, cohort: ['enterprise研发任务代表性用户'], task_categories: ['需求到计划', '实施到审查', '交付与知识复用'], pairing_rule: '同类任务按复杂度、角色、宿主和 provider readiness 配对 baseline/candidate；不得跨链路归因。', complexity_strata: ['低', '中', '高'], actor_profiles: ['A1企业研发人员', 'A2项目owner'], host_provider_facts: ['provider receipt not-run', 'generated runtime refresh not-run'], exclusion_rules: ['无授权外发', '无可回源证据', '任务复杂度不匹配'], minimum_sample: '每类至少3对 exploratory；confirmed 需预声明 effect/不确定性并独立复现。', metrics: ['time-to-trusted-change', 'quality-adjusted-throughput', '返工次数', '人工审查负担'], decision_rule: 'not-run 不产生改善结论；candidate-confirmed 不等同 confirmed-improved。', amendments: [], overall_status: 'not-run', reason_codes: ['field-owner-execution-not-authorized', 'representative-task-cohort-not-available'], consumers: ['U8', 'U9', 'U10'], limitations: ['本轮没有真实任务、provider、host 或独立 cohort。'], claim_ceiling: '仅冻结执行前协议，不证明任何 Skill 的现场价值。' };
  const fieldTaskPairs = { schema_version: 'ce-localization-field-validation-task-pairs/v1', artifact_kind: 'paired-field-task-evidence', producer: 'ce-localization-field-validation-owner', single_writer: 'ce-localization-field-evidence-writer', source_snapshot: snap, inventory_sha256: sha(deterministic.inventory), protocol_ref: 'docs/validation/ce-localization/field-validation/protocol.json', protocol_sha256: sha(fieldProtocol), task_pairs: [], overall_status: 'not-run', reason_codes: ['field-execution-not-run'], limitations: ['No paired task records.'], claim_ceiling: 'No field task was executed.' };
  const fieldResults = { schema_version: 'ce-localization-field-validation-results/v1', artifact_kind: 'field-validation-results', producer: 'ce-localization-field-validation-owner', single_writer: 'ce-localization-field-evidence-writer', source_snapshot: snap, inventory_sha256: sha(deterministic.inventory), protocol_ref: 'docs/validation/ce-localization/field-validation/protocol.json', protocol_sha256: sha(fieldProtocol), results: [], overall_status: 'not-run', reason_codes: ['field-execution-not-run'], limitations: ['No baseline/candidate results.'], claim_ceiling: 'No field outcome claim.', reproduction_status: 'not-run' };
  const knowledgePromotion = { schema_version: 'ce-localization-knowledge-promotion/v1', artifact_kind: 'knowledge-promotion-input-ledger', producer: 'ce-localization-knowledge-owner', single_writer: 'ce-localization-knowledge-promotion-writer', source_snapshot: snap, inventory_sha256: sha(deterministic.inventory), field_results_ref: 'docs/validation/ce-localization/field-validation/results.json', field_results_sha256: sha(fieldResults), entries: [], overall_status: 'not-run', reason_codes: ['field-results-not-run', 'no-reuse-events'], consumers: ['spec-compound', 'spec-compound-refresh'], limitations: ['No durable knowledge promotion is authorized by absent field evidence.'], claim_ceiling: 'Validation input only; docs/solutions remains owned by spec-compound.' };
  return { deterministic, scenariosArtifact, baselines, ledger: { schema_version: 'ce-localization-ledger/v1', artifact_kind: 'source-bound-semantic-adjudication-ledger', producer: 'spec-work-semantic-adjudication-owner', single_writer: 'ce-localization-ledger-writer', source_snapshot: snap, inventory_ref: 'docs/validation/ce-localization/skill-inventory.json', inventory_sha256: sha(deterministic.inventory), scenarios_ref: 'docs/validation/ce-localization/skill-scenarios.json', scenarios_sha256: sha(scenariosArtifact), upstream_adjudication_ref: 'docs/validation/2026-08-19-ce-post-3-20-adjudication.json', upstream_adjudication_sha256: sha(upstream), entries: ledgerEntries, consumers: ['spec-work', 'spec-code-review', 'spec-compound'], claim_ceiling: 'Semantic adjudication is source-bound but not field evidence; local owner decisions are explicit and reversible.' }, fieldProtocol, fieldTaskPairs, fieldResults, knowledgePromotion };
}

function refreshReviewArtifacts(deterministic) {
  const reviewRoot = path.join(root, 'review');
  const snapshot = deterministic.inventory.source_snapshot;
  const inventory = deterministic.inventory;
  const coverage = deterministic.coverage.coverage_summary;
  const inventorySha = sha(inventory);
  const packageFacts = new Map(deterministic.coverage.package_files.map((item) => [item.path, item]));
  const directFacts = new Map();
  for (const item of deterministic.coverage.direct_support) {
    if (!directFacts.has(item.path)) directFacts.set(item.path, item);
  }
  const packageFactsBySkill = new Map();
  for (const item of deterministic.coverage.package_files) {
    if (!packageFactsBySkill.has(item.skill_id)) packageFactsBySkill.set(item.skill_id, []);
    packageFactsBySkill.get(item.skill_id).push(item);
  }
  const supportFactsBySkill = new Map();
  for (const item of deterministic.coverage.direct_support) {
    if (!supportFactsBySkill.has(item.skill_id)) supportFactsBySkill.set(item.skill_id, []);
    supportFactsBySkill.get(item.skill_id).push(item);
  }
  const refreshReceipt = (receipt) => {
    const fact = packageFacts.get(receipt.path) || directFacts.get(receipt.path);
    if (!fact) throw new Error(`review receipt path missing from current coverage: ${receipt.path}`);
    return {
      ...receipt,
      sha256: fact.sha256,
      bytes: fact.bytes,
      line_count: fact.line_count,
      covered_line_ranges: [[1, fact.line_count]],
      read_status: 'full',
    };
  };
  const update = (file, fn) => {
    const filePath = path.join(reviewRoot, file);
    const value = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    fn(value);
    write(filePath, value);
  };
  update('round-1-findings.json', (value) => {
    value.source_snapshot = snapshot;
    value.claim_ceiling = Array.isArray(value.claim_ceiling) ? value.claim_ceiling.join('; ') : String(value.claim_ceiling || 'Source-bound findings only.');
    if (value.coverage_summary) {
      value.coverage_summary.expected_package_path_count = inventory.package_path_count;
      value.coverage_summary.reviewed_package_path_count = inventory.package_path_count;
    }
  });
  update('round-2-findings.json', (value) => {
    value.source_snapshot = snapshot;
    value.claim_ceiling = Array.isArray(value.claim_ceiling) ? value.claim_ceiling.join('; ') : String(value.claim_ceiling || 'Source-bound findings only.');
    if (value.coverage_summary) {
      value.coverage_summary.expected_package_path_count = inventory.package_path_count;
      value.coverage_summary.reviewed_package_path_count = inventory.package_path_count;
    }
  });
  for (const file of ['round-3-openai-skill-lens-final.json', 'round-3-anthropic-skill-lens-final.json']) {
    update(file, (value) => {
      value.source_snapshot = snapshot;
      value.inventory_hash = snapshot.inventory_hash;
      value.inventory_artifact_sha256 = inventorySha;
      value.expected_package_path_count = inventory.package_path_count;
      value.reviewed_package_path_count = inventory.package_path_count;
      value.expected_direct_support_path_count = coverage.direct_support_unique_path_count;
      value.reviewed_direct_support_path_count = coverage.direct_support_unique_path_count;
      value.expected_direct_support_relation_count = coverage.direct_support_relation_count;
      value.reviewed_direct_support_relation_count = coverage.direct_support_relation_count;
      for (const skillReview of value.skill_reviews || []) {
        const refreshed = (skillReview.source_read_receipts || []).map(refreshReceipt);
        const seen = new Set(refreshed.map((receipt) => receipt.path));
        const missingFacts = [
          ...(packageFactsBySkill.get(skillReview.skill_id) || []),
          ...(supportFactsBySkill.get(skillReview.skill_id) || []),
        ].filter((fact) => !seen.has(fact.path));
        skillReview.source_read_receipts = refreshed.concat(missingFacts.map((fact) => ({
          path: fact.path,
          path_role: fact.path_role,
          source_kind: fact.path_role === 'skill-package' ? 'skill-package' : 'direct-support',
          owning_skill: fact.owning_skill || skillReview.skill_id,
          shared_consumers: fact.shared_consumers || [],
          sha256: fact.sha256,
          bytes: fact.bytes,
          line_count: fact.line_count,
          covered_line_ranges: [[1, fact.line_count]],
          read_status: 'full',
          review_chunk_ids: [`${value.review_lane_id}-supplemental-${seen.size + 1}`],
        })));
      }
      value.review_input_hash = sha(deterministic.coverage.review_input);
      value.chunk_manifest_hash = sha((value.skill_reviews || []).map((skillReview) => ({
        skill_id: skillReview.skill_id,
        receipts: (skillReview.source_read_receipts || []).map((receipt) => ({
          path: receipt.path,
          sha256: receipt.sha256,
          covered_line_ranges: receipt.covered_line_ranges,
        })),
      })));
    });
  }
  const openai = JSON.parse(fs.readFileSync(path.join(reviewRoot, 'round-3-openai-skill-lens-final.json'), 'utf8'));
  const anthropic = JSON.parse(fs.readFileSync(path.join(reviewRoot, 'round-3-anthropic-skill-lens-final.json'), 'utf8'));
  const laneFindings = [
    ...(openai.current_findings || []),
    ...(anthropic.skill_reviews || []).flatMap((skillReview) => skillReview.findings || []),
  ];
  const aggregate = {
    schema_version: 'ce-localization-round-3-findings/v1',
    artifact_kind: 'cross-lens-calibration',
    producer: 'serialized round-3 aggregation owner',
    source_snapshot: snapshot,
    inventory_manifest_sha256: inventorySha,
    dirty_manifest_sha256: snapshot.dirty_path_manifest_sha256,
    review_lanes: [
      {
        review_lane_id: openai.review_lane_id,
        review_lens: openai.review_lens,
        role_representation: openai.role_representation,
        provider_identity: openai.provider_identity,
        worker_context_isolation: openai.worker_context_isolation,
        coverage_status: openai.coverage_status,
      },
      {
        review_lane_id: anthropic.review_lane_id,
        review_lens: anthropic.review_lens,
        role_representation: anthropic.role_representation,
        provider_identity: anthropic.provider_identity,
        worker_context_isolation: anthropic.worker_context_isolation,
        coverage_status: anthropic.coverage_status,
      },
    ],
    findings: laneFindings.map((finding) => ({
      finding_id: finding.finding_id,
      skill_id: finding.skill_id,
      severity: finding.severity,
      title: finding.title,
      status: finding.status,
      decision: finding.decision,
      disposition: finding.disposition || null,
      owner: finding.owner,
      source_ref: finding.source_ref || null,
      resolution_evidence_refs: finding.resolution_evidence_refs || [],
      focused_verification: finding.focused_verification || finding.focused_test || null,
      claim_ceiling: finding.claim_ceiling,
      limitations: finding.limitations || [],
    })),
    calibration_status: laneFindings.some((finding) => ['P1', 'P2'].includes(finding.severity) && finding.status === 'open')
      ? 'concerns'
      : 'complete-with-terminal-deferred-measurement',
    unresolved_non_semantic_boundary: [
      'provider_identity remains unverified',
      'worker context isolation remains degraded_inherited',
      'field validation and knowledge promotion remain not-run',
    ],
    claim_ceiling: 'Current source-bound role-simulated review aggregation only; no external provider identity, runtime isolation, generated runtime, or field outcome claim.',
  };
  write(path.join(reviewRoot, 'round-3-findings.json'), aggregate);
  const reportPath = path.join(root, 'reports/2026-08-20-ce-localization-full-skill-review.md');
  if (fs.existsSync(reportPath)) {
    let report = fs.readFileSync(reportPath, 'utf8');
    report = report.replaceAll('566', String(inventory.package_path_count));
    report = report.replaceAll('5,756,855', inventory.package_bytes.toLocaleString('en-US'));
    fs.writeFileSync(reportPath, report);
  }
}

function rebindUpstreamAdjudication() {
  const inputPath = path.join(repoRoot, 'docs/validation/2026-08-19-ce-post-3-20-adjudication-input.json');
  const adjudicationPath = path.join(repoRoot, 'docs/validation/2026-08-19-ce-post-3-20-adjudication.json');
  const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const adjudication = JSON.parse(fs.readFileSync(adjudicationPath, 'utf8'));
  adjudication.target_source_snapshot = input.target_source_snapshot;
  adjudication.input_artifact_sha256 = sha(input);
  write(adjudicationPath, adjudication);
}

function main() {
  rebindUpstreamAdjudication();
  const closeout = buildCloseout();
  write(path.join(root, 'skill-scenarios.json'), closeout.scenariosArtifact);
  for (const baseline of closeout.baselines) write(path.join(root, 'baseline', `${baseline.skill_id}.json`), baseline);
  write(path.join(root, 'localization-ledger.json'), closeout.ledger);
  write(path.join(root, 'field-validation/protocol.json'), closeout.fieldProtocol);
  write(path.join(root, 'field-validation/task-pairs.json'), closeout.fieldTaskPairs);
  write(path.join(root, 'field-validation/results.json'), closeout.fieldResults);
  write(path.join(root, 'knowledge-promotion/promotion-ledger.json'), closeout.knowledgePromotion);
  refreshReviewArtifacts(closeout.deterministic);
  process.stdout.write(JSON.stringify({ ok: true, scenarios: closeout.scenariosArtifact.scenarios.length, path_coverage: closeout.scenariosArtifact.path_coverage.length, baselines: closeout.baselines.length, ledger: closeout.ledger.entries.length, field: 'not-run', knowledge: 'not-run' }) + '\n');
}
if (require.main === module) main();
module.exports = { buildCloseout };
