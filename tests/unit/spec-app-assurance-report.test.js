'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { buildAuditReport } = require('../../skills/spec-app-consistency-audit/scripts/merge-contracts');
const { buildArtifactManifest } = require('../../skills/spec-app-consistency-audit/scripts/build-artifact-manifest');
const { renderHeadlessEnvelope } = require('../../skills/spec-app-consistency-audit/scripts/render-headless-envelope');
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
      verification_execution_status: 'not_run', verification_plan_ref: null,
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

  test('integrates generated verification tasks without claiming execution', () => {
    const verificationPlan = {
      artifact_id: 'verification-plan', schema_version: 'verification-plan.v1', run_id: 'run-1',
      prepare_fingerprint: `sha256:${'a'.repeat(64)}`, verification_compiler_status: 'degraded',
      tasks: [
        { id: 'task-ready', status: 'not_run', verification_kind: 'static_proof', target_platform: 'shared' },
        { id: 'task-human', status: 'blocked', verification_kind: 'human_judgment', target_platform: 'ios' },
      ], limitations: ['One human checkpoint remains.'],
    };
    const report = buildAuditReport({ artifactsData: [], issueArtifactsData: [], verificationPlanData: verificationPlan });
    expect(report).toMatchObject({
      verification_compiler_status: 'degraded', verification_execution_status: 'not_run',
      verification_summary: { task_count: 2, blocked_count: 1, human_checkpoint_count: 1 },
      verification_task_refs: ['task-ready', 'task-human'],
    });
    expect(validateArtifact(report).valid).toBe(true);

    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'verification-report-'));
    const metadataPath = path.join(dir, 'metadata.json');
    const reportPath = path.join(dir, 'audit-report.json');
    fs.writeFileSync(metadataPath, JSON.stringify({ status: 'degraded', run_id: 'run-1' }));
    fs.writeFileSync(reportPath, JSON.stringify(report));
    const envelope = renderHeadlessEnvelope({ metadata: metadataPath, report: reportPath });
    expect(envelope).toContain('Verification compiler: degraded');
    expect(envelope).toContain('Verification execution: not_run');
    expect(envelope).not.toContain('Verification passed');
  });

  test('manifest attributes verification plan to compiler and validator', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'verification-manifest-'));
    const runDir = path.join(repoRoot, '.spec-first/app-audit/runs/run-1');
    fs.mkdirSync(runDir, { recursive: true });
    fs.writeFileSync(path.join(runDir, 'verification-plan.json'), JSON.stringify({
      schema_version: 'verification-plan.v1', artifact_id: 'verification-plan', consumers: ['report-writer'],
      data_sensitivity: 'internal', contract_status: 'candidate', source_inputs: [{ freshness: 'current-run' }],
    }));
    const manifest = buildArtifactManifest({ repoRoot, runDir, runId: 'run-1' });
    expect(manifest.artifacts[0].producer).toBe('verification-compiler+validate-verification-plan.js');
  });
});
