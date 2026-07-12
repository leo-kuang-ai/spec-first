'use strict';

const { buildAuditReport } = require('../../skills/spec-app-consistency-audit/scripts/merge-contracts');
const { validateArtifact } = require('../../skills/spec-app-consistency-audit/scripts/validate-artifacts');

describe('App Assurance journey report', () => {
  test('distinguishes completed zero findings from semantic-not-run and keeps U5 status not_run', () => {
    const completed = buildAuditReport({
      artifactsData: [{ artifact_id: 'app-behavior-model', entities: { journeys: [{ id: 'journey-checkout', label: 'Checkout', platform_scope: 'multi' }] }, coverage: { conclusion_caps: [], limitations: [] } },
        { artifact_id: 'proof-obligations', obligations: [{ id: 'obligation-checkout', model_refs: ['journey-checkout'], assessment: 'proven' }], coverage: { omitted_obligations: [] } }],
      issueArtifactsData: [{ issue_synthesis_status: 'llm_provided', semantic_adjudication_status: 'complete', critical_obligations_processed: true, issues: [], rejected_issues: [] }],
      finalFreshnessStatus: 'current',
    });
    expect(completed).toMatchObject({
      semantic_adjudication_status: 'complete', verification_compiler_status: 'not_run',
      result_interpretation: 'no_findings_after_completed_adjudication', verification_task_refs: [],
    });
    expect(completed.changed_journeys[0]).toMatchObject({ journey_ref: 'journey-checkout' });
    expect(validateArtifact(completed).valid).toBe(true);

    const notRun = buildAuditReport({ artifactsData: [], issueArtifactsData: [], finalFreshnessStatus: 'current' });
    expect(notRun.result_interpretation).toBe('semantic_not_run');
  });

  test('coverage limits are visible and fixed domain sections are not materialized as empty report sections', () => {
    const report = buildAuditReport({
      artifactsData: [{ artifact_id: 'app-behavior-model', entities: { journeys: [{ id: 'journey-checkout', label: 'Checkout', platform_scope: 'android' }] }, coverage: { conclusion_caps: ['ios:not_evaluable'], limitations: ['Only Android source is available.'] } }],
      issueArtifactsData: [{ issue_synthesis_status: 'llm_provided', semantic_adjudication_status: 'degraded', critical_obligations_processed: false, issues: [], rejected_issues: [] }],
      finalFreshnessStatus: 'current',
    });
    expect(report.result_interpretation).toBe('coverage_limited');
    expect(report.coverage_caps).toContain('ios:not_evaluable');
    expect(report).not.toHaveProperty('domain_sections');
  });
});
