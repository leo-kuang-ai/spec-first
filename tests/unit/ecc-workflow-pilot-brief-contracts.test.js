'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { validateAgainstSchema } = require('../../src/contracts/schema-validator');
const { routeCandidates } = require('../../scripts/route-ecc-agent-candidates');
const {
  prepareWorkflowPilotBrief,
} = require('../../scripts/prepare-ecc-workflow-pilot-brief');

const REPO_ROOT = path.join(__dirname, '..', '..');
const CONTRACT_DIR = path.join(REPO_ROOT, 'src', 'cli', 'contracts', 'agent-registry');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function guidance(output, agentId) {
  return output.expert_candidate_guidance.find((entry) => entry.agent_id === agentId);
}

describe('ECC workflow pilot brief', () => {
  test('prepares spec-plan pilot facts without selecting final experts', () => {
    const outputSchema = readJson(path.join(CONTRACT_DIR, 'workflow-pilot-brief.schema.json'));
    const output = prepareWorkflowPilotBrief({
      workflow: 'spec-plan',
      target_path: 'docs/plans/auth-api.md',
      context_paths: ['src/api/users.ts'],
      risk_signals: ['api_changed', 'auth'],
    });

    expect(validateAgainstSchema(outputSchema, output).errors).toEqual([]);
    expect(output).not.toHaveProperty('selected_agents');
    expect(output).not.toHaveProperty('final_verdict');
    expect(output.workflow).toBe('spec-plan');
    expect(output.router_candidate_facts.requires_skill_decision).toBe(true);
    expect(output.decision_boundary).toMatchObject({
      requires_skill_decision: true,
      requires_expert_selection_by_skill: true,
      router_candidate_is_not_selection: true,
      optional_candidate_is_not_activation: true,
      runtime_delivery: 'none_in_v9b',
    });
    expect(output.component_status.graph_expert_brief.skipped).toBe(false);
    expect(output.component_status.standards_expert_brief.skipped).toBe(false);
    expect(guidance(output, 'spec-api-contract-reviewer')).toMatchObject({
      candidate_only: true,
      requires_skill_decision: true,
      graph_context_available: true,
      standards_context_available: true,
    });
  });

  test('prepares spec-doc-review optional design context as explicit reference-only facts', () => {
    const output = prepareWorkflowPilotBrief({
      workflow: 'spec-doc-review',
      target_path: 'docs/plans/mobile-design.md',
      risk_signals: ['explicit_figma', 'design'],
      enabled_packs: ['external-design-pack'],
    });
    const designPack = output.optional_pack_brief.optional_pack_context.find((pack) => pack.pack_id === 'external-design-pack');

    expect(designPack).toMatchObject({
      activation_state: 'activated_reference_only',
      allowed_use: 'reference_only',
      explicit_activation_required: true,
    });
    expect(output.decision_boundary.optional_candidate_is_not_activation).toBe(true);
    expect(output.forbidden_actions).toEqual(expect.arrayContaining([
      'query_external_connector',
      'write_generated_runtime_mirror',
      'replace_workflow_expert_selection',
    ]));
  });

  test('prepares spec-skill-audit facts and skips unsupported graph or optional components without degrading', () => {
    const outputSchema = readJson(path.join(CONTRACT_DIR, 'workflow-pilot-brief.schema.json'));
    const output = prepareWorkflowPilotBrief({
      workflow: 'spec-skill-audit',
      context_paths: ['skills/spec-plan/SKILL.md', 'src/cli/contracts/example.schema.json'],
      risk_signals: ['harness_governance'],
    });

    expect(validateAgainstSchema(outputSchema, output).errors).toEqual([]);
    expect(output.component_status.router_candidates.available).toBe(true);
    expect(output.component_status.graph_expert_brief).toMatchObject({
      available: false,
      skipped: true,
      reason_code: 'unsupported_for_workflow',
    });
    expect(output.component_status.optional_pack_brief).toMatchObject({
      available: false,
      skipped: true,
      reason_code: 'unsupported_for_workflow',
    });
    expect(output.expert_candidate_guidance.map((entry) => entry.agent_id)).toEqual(expect.arrayContaining([
      'spec-agent-native-reviewer',
      'spec-project-standards-reviewer',
    ]));
    expect(output.degraded_mode.reasons).not.toContain('graph_expert_brief_unavailable');
    expect(output.degraded_mode.reasons).not.toContain('optional_pack_brief_unavailable');
  });

  test('degrades instead of failing when supplied router candidates target another workflow', () => {
    const planRouterCandidates = routeCandidates({
      workflow: 'spec-plan',
      changed_files: ['docs/plans/api.md'],
      risk_signals: ['api_changed'],
    });
    const output = prepareWorkflowPilotBrief({
      workflow: 'spec-doc-review',
      target_path: 'docs/plans/api.md',
      router_candidates: planRouterCandidates,
    });

    expect(output.router_candidate_facts).toBeNull();
    expect(output.expert_candidate_guidance).toEqual([]);
    expect(output.component_status.router_candidates).toMatchObject({
      available: false,
      skipped: false,
      item_count: 0,
    });
    expect(output.component_status.router_candidates.error).toContain('router candidate workflow mismatch');
    expect(output.degraded_mode.enabled).toBe(true);
    expect(output.degraded_mode.reasons).toContain('router_candidate_unavailable');
  });

  test('rejects unsupported workflows at the pilot boundary', () => {
    expect(() => prepareWorkflowPilotBrief({
      workflow: 'spec-code-review',
    })).toThrow('unsupported workflow for ECC workflow pilot brief');
  });
});
