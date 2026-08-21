'use strict';

// Freeze test for the finding extra-field shapes named in
// docs/solutions/architecture-patterns/spec-prd-finding-schema-freeze-deferred-2026-06-28.md.
//
// That doc deferred freezing extra fields ("当前消费者不依赖细节字段") until a real
// consumer read them. `finalize-prd-artifact.js:254-260` now filters on
// `expected_shape`/`remediation_hint`, which triggers the doc's own "When to Apply"
// condition 1. This test freezes the shape of the 9 reason_codes that
// `REMEDIATION_BY_REASON_CODE` currently enriches, so a future edit to
// `check-prd-artifact.js` that silently drops or renames one of these fields fails
// loudly instead of degrading `finalize-prd-artifact.js`'s filter silently.
//
// Scope: only the enriched reason_codes (the ones a real consumer reads today).
// The other ~30 reason_codes still carry no cross-checker contract and remain
// intentionally unfrozen, per the deferred doc's own guidance not to freeze
// unconsumed detail.

const { buildReport } = require('../../skills/spec-prd/scripts/check-prd-artifact');

function readinessFixture({
  oqRow = '',
  designBlock = [
    'design_source_inventory:',
    '- none',
    'design_sources_read:',
    '- none',
    'design_sources_unread:',
    '- none',
    'design_source_coverage: not-applicable',
    'design_degraded_owner_acceptance_ref: none',
  ],
  writeMode = 'final-prd',
  nextAction = 'final-prd',
  canEnterSpecPlan = 'yes',
  includeDecisionCard = true,
} = {}) {
  return [
    '---',
    'spec_id: 2026-08-21-finding-schema-freeze',
    'artifact_kind: prd-requirements',
    'target_surface: generic',
    'status: draft',
    'evidence_grade: mixed',
    'source_authority: mixed',
    'readiness_authority: engineering-owned',
    'created: 2026-08-21',
    '---',
    '# Finding Schema Freeze Fixture',
    '',
    '## Summary',
    'x',
    '',
    '## Change Delta',
    '| item | current | target | delta | evidence |',
    '| --- | --- | --- | --- | --- |',
    '| x | x | x | extend | confirmed-source |',
    '',
    '## Requirements',
    '| id | priority | requirement | rationale/source |',
    '| --- | --- | --- | --- |',
    '| R-01 | P0 | x | confirmed-source |',
    '',
    '## Acceptance Examples',
    'AE-01（对应 R-01）',
    'Given x',
    'When x',
    'Then x',
    '',
    '## Scope Boundaries',
    'In scope: x.',
    'Out of scope: x.',
    '',
    '## Evidence And Assumptions',
    '| claim | tag | source | note |',
    '| --- | --- | --- | --- |',
    '| x | confirmed-source | checker source | none |',
    '',
    '## Outstanding Questions',
    '| id | question | PRD write target | owner_status | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended_default/deferred_reason |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...(oqRow ? [oqRow] : []),
    '',
    '## Owner Decision Trace',
    '| question | owner_answer/source | chosen_answer | PRD write target | consequence | closure_state |',
    '| --- | --- | --- | --- | --- |',
    '',
    '## Design Source Coverage',
    ...designBlock,
    '',
    '## Readiness Self-Check',
    `write_mode: ${writeMode}`,
    'clarification_evidence: source-proven-no-ask',
    'preflight_sweep_closure: closed',
    ...(includeDecisionCard ? [
      'decision_card_highest_risk_gap: x',
      `decision_card_next_action: ${nextAction}`,
      'decision_card_why_no_invention: x',
    ] : []),
    'design_source_coverage: not-applicable',
    `can_enter_spec_plan: ${canEnterSpecPlan}`,
    'why_not: none',
    '',
  ].join('\n');
}

function findingFor(report, reasonCode) {
  return report.findings.find((finding) => finding.reason_code === reasonCode);
}

// Every case is a minimal, targeted mutation of the readiness fixture that trips
// exactly one enriched reason_code, verified by direct execution before being
// committed here (not derived from reading the source alone).
const ENRICHED_CASES = [
  {
    reasonCode: 'decision_card_undeclared',
    build: () => readinessFixture({ includeDecisionCard: false }),
    expectedKeys: ['expected_shape', 'reason_code', 'remediation_hint'],
  },
  {
    reasonCode: 'decision_card_path_mismatch',
    build: () => readinessFixture({ nextAction: 'checkpoint-prd' }),
    expectedKeys: [
      'decision_card_next_action',
      'decision_card_next_action_values',
      'expected_shape',
      'reason_code',
      'remediation_hint',
      'write_mode',
      'write_mode_values',
    ],
  },
  {
    reasonCode: 'open_oq_without_owner_closure',
    build: () => readinessFixture({
      oqRow: '| OQ-01 | 需要澄清什么 | Readiness Self-Check | asked-owner | no | owner-resolved | none | open | none |',
    }),
    expectedKeys: ['expected_shape', 'reason_code', 'remediation_hint'],
  },
  {
    reasonCode: 'owner_decision_trace_required_but_absent',
    build: () => readinessFixture({
      oqRow: '| OQ-01 | q | Readiness Self-Check | answered | no | owner-resolved | none | closed | none |',
    }),
    expectedKeys: ['expected_shape', 'reason_code', 'remediation_hint'],
  },
  {
    reasonCode: 'design_source_coverage_undeclared',
    build: () => readinessFixture({
      designBlock: ['design_source_inventory:', '- docs/design/x.md'],
    }),
    expectedKeys: ['expected_shape', 'reason_code', 'remediation_hint'],
  },
  {
    reasonCode: 'design_sources_unread_undeclared',
    build: () => readinessFixture({
      designBlock: [
        'design_source_inventory:',
        '- docs/design/x.md',
        'design_source_coverage: read',
        'design_sources_read:',
        '- docs/design/x.md',
      ],
    }),
    expectedKeys: ['expected_shape', 'reason_code', 'remediation_hint'],
  },
  {
    reasonCode: 'design_partial_coverage_unaccepted',
    build: () => readinessFixture({
      designBlock: [
        'design_source_inventory:',
        '- docs/design/x.md',
        'design_source_coverage: partial',
        'design_sources_read:',
        '- docs/design/x.md',
        'design_sources_unread:',
        '- docs/design/y.md',
      ],
    }),
    expectedKeys: ['expected_shape', 'reason_code', 'remediation_hint'],
  },
  {
    reasonCode: 'input_refs_unavailable',
    build: () => readinessFixture(),
    options: { inputs: ['/nonexistent/path/that/does/not/exist.md'] },
    expectedKeys: ['expected_shape', 'reason_code', 'remediation_hint'],
  },
  {
    reasonCode: 'ready_receipt_stale',
    build: () => [
      '---',
      'spec_id: 2026-08-21-finding-schema-freeze-ready-receipt',
      'artifact_kind: prd-requirements',
      'status: draft',
      'readiness_verified_by: check-prd-artifact.js',
      'readiness_checker_schema: spec-prd-artifact-check.v1',
      'readiness_prd_hash: deadbeef',
      'readiness_inputs_hash: deadbeef',
      '---',
      '# Ready Receipt Fixture',
      '',
      '## Summary',
      'x',
      '',
      '## Requirements',
      '| id | requirement |',
      '| --- | --- |',
      '| R-01 | x |',
      '',
      '## Acceptance Examples',
      'AE-01',
      '',
      '## Scope Boundaries',
      'x',
      '',
      '## Readiness Self-Check',
      'write_mode: final-prd',
      'clarification_evidence: source-proven-no-ask',
      'preflight_sweep_closure: closed',
      'decision_card_highest_risk_gap: x',
      'decision_card_next_action: final-prd',
      'decision_card_why_no_invention: x',
      'can_enter_spec_plan: yes',
      'why_not: none',
      '',
    ].join('\n'),
    // readiness_prd_hash/readiness_inputs_hash are deliberately wrong ("deadbeef"),
    // so the current text/inputs never match the stored receipt hashes.
    expectedKeys: ['expected_shape', 'reason_code', 'remediation_hint'],
  },
];

describe('spec-prd finding schema freeze (enriched reason_codes only)', () => {
  test.each(ENRICHED_CASES.map(({ reasonCode }) => [reasonCode]))(
    '%s carries exactly its frozen field set',
    (reasonCode) => {
      const testCase = ENRICHED_CASES.find((entry) => entry.reasonCode === reasonCode);
      const report = buildReport(
        'docs/brainstorms/finding-schema-freeze.md',
        testCase.build(),
        testCase.options || {},
      );
      const finding = findingFor(report, reasonCode);

      expect(finding).toBeDefined();
      expect(Object.keys(finding).sort()).toEqual(testCase.expectedKeys);
      expect(finding.expected_shape).toEqual(expect.any(String));
      expect(finding.expected_shape.length).toBeGreaterThan(0);
      expect(finding.remediation_hint).toEqual(expect.any(String));
      expect(finding.remediation_hint.length).toBeGreaterThan(0);
    },
  );

  test('covers every reason_code currently enriched with expected_shape/remediation_hint', () => {
    // Guards against silent drift the other direction: if check-prd-artifact.js
    // grows a 10th enriched reason_code, this fails loudly instead of leaving it
    // permanently unfrozen. Each declared case's own fixture is re-run (not a
    // shared combined probe) since several cases need mutually exclusive
    // frontmatter/section shapes (e.g. ready_receipt_stale needs a receipt
    // frontmatter block the others must not carry).
    const declaredReasonCodes = new Set(ENRICHED_CASES.map((entry) => entry.reasonCode));
    const observedEnrichedReasonCodes = new Set();

    for (const testCase of ENRICHED_CASES) {
      const report = buildReport(
        'docs/brainstorms/finding-schema-freeze.md',
        testCase.build(),
        testCase.options || {},
      );
      for (const finding of report.findings) {
        if ('expected_shape' in finding) observedEnrichedReasonCodes.add(finding.reason_code);
      }
    }

    expect([...observedEnrichedReasonCodes].sort()).toEqual([...declaredReasonCodes].sort());
  });
});
