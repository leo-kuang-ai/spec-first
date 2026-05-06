'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { validateAgainstSchema } = require('../../src/contracts/schema-validator');
const { routeCandidates } = require('../../scripts/route-ecc-agent-candidates');
const {
  prepareCodeReviewPilotBrief,
} = require('../../scripts/prepare-ecc-code-review-pilot-brief');

const REPO_ROOT = path.join(__dirname, '..', '..');
const CONTRACT_DIR = path.join(REPO_ROOT, 'src', 'cli', 'contracts', 'agent-registry');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function guidance(output, agentId) {
  return output.reviewer_candidate_guidance.find((entry) => entry.agent_id === agentId);
}

describe('ECC code-review pilot brief', () => {
  test('combines router, graph, standards, and optional pack facts without selecting reviewers', () => {
    const outputSchema = readJson(path.join(CONTRACT_DIR, 'code-review-pilot-brief.schema.json'));
    const output = prepareCodeReviewPilotBrief({
      changed_files: ['src/auth/session.ts'],
      risk_signals: ['runtime_code_changed'],
      mode: 'report-only',
      base: 'origin/main',
    });
    const securityGuidance = guidance(output, 'spec-security-reviewer');

    expect(validateAgainstSchema(outputSchema, output).errors).toEqual([]);
    expect(output).not.toHaveProperty('selected_agents');
    expect(output).not.toHaveProperty('final_verdict');
    expect(output.workflow).toBe('spec-code-review');
    expect(output.router_candidate_facts).not.toHaveProperty('selected_agents');
    expect(output.router_candidate_facts.requires_skill_decision).toBe(true);
    expect(output.decision_boundary).toMatchObject({
      requires_skill_decision: true,
      requires_reviewer_selection_by_skill: true,
      router_candidate_is_not_selection: true,
      optional_candidate_is_not_activation: true,
      component_failure_is_degraded_mode: true,
      connector_queries_allowed: false,
      runtime_delivery: 'none_in_v9a',
    });
    expect(output.forbidden_actions).toEqual(expect.arrayContaining([
      'replace_workflow_reviewer_selection',
      'write_generated_runtime_mirror',
      'query_external_connector',
    ]));
    expect(securityGuidance).toMatchObject({
      agent_id: 'spec-security-reviewer',
      candidate_only: true,
      requires_skill_decision: true,
      standards_context_available: true,
    });
    expect(securityGuidance.forbidden_claims).toEqual(expect.arrayContaining([
      'selected_agents',
      'final_verdict',
    ]));
  });

  test('keeps optional packs advisory and explicit even when pilot receives enable flags', () => {
    const output = prepareCodeReviewPilotBrief({
      changed_files: ['app/controllers/users_controller.rb'],
      risk_signals: ['rails', 'explicit_style_profile'],
      enabled_agents: ['spec-dhh-rails-reviewer'],
    });
    const optionalBrief = output.optional_pack_brief;
    const stylePack = optionalBrief.optional_pack_context.find((pack) => pack.pack_id === 'style-profile-pack');

    expect(stylePack).toMatchObject({
      activation_state: 'activated',
      allowed_use: 'style_advisory',
      max_severity: 'note',
      explicit_activation_required: true,
    });
    expect(output.decision_boundary.optional_candidate_is_not_activation).toBe(true);
    expect(output.forbidden_actions).toContain('runtime_pack_activation');
    expect(output).not.toHaveProperty('runtime_pack_activation');
  });

  test('degrades instead of failing when supplied router candidates do not match code-review', () => {
    const outputSchema = readJson(path.join(CONTRACT_DIR, 'code-review-pilot-brief.schema.json'));
    const planRouterCandidates = routeCandidates({
      workflow: 'spec-plan',
      changed_files: ['docs/plans/api.md'],
      risk_signals: ['api_changed'],
    });
    const output = prepareCodeReviewPilotBrief({
      workflow: 'spec-code-review',
      router_candidates: planRouterCandidates,
      changed_files: ['src/api/users.ts'],
    });

    expect(validateAgainstSchema(outputSchema, output).errors).toEqual([]);
    expect(output.router_candidate_facts).toBeNull();
    expect(output.reviewer_candidate_guidance).toEqual([]);
    expect(output.component_status.router_candidates).toMatchObject({
      available: false,
      candidate_count: 0,
    });
    expect(output.component_status.router_candidates.error).toContain('router candidate workflow mismatch');
    expect(output.degraded_mode.enabled).toBe(true);
    expect(output.degraded_mode.reasons).toContain('router_candidate_unavailable');
    expect(output.decision_boundary.component_failure_is_degraded_mode).toBe(true);
  });

  test('rejects non-code-review workflow at the pilot boundary', () => {
    expect(() => prepareCodeReviewPilotBrief({
      workflow: 'spec-plan',
    })).toThrow('unsupported workflow for code-review pilot brief');
  });
});
