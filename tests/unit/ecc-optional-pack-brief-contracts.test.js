'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { validateAgainstSchema } = require('../../src/contracts/schema-validator');
const { routeCandidates } = require('../../scripts/route-ecc-agent-candidates');
const {
  prepareOptionalPackBrief,
} = require('../../scripts/prepare-ecc-optional-pack-brief');

const REPO_ROOT = path.join(__dirname, '..', '..');
const CONTRACT_DIR = path.join(REPO_ROOT, 'src', 'cli', 'contracts', 'agent-registry');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function pack(output, packId) {
  return output.optional_pack_context.find((entry) => entry.pack_id === packId);
}

describe('ECC Optional Capability Pack brief', () => {
  test('keeps optional packs disabled by default without selecting agents', () => {
    const outputSchema = readJson(path.join(CONTRACT_DIR, 'optional-pack-brief.schema.json'));
    const output = prepareOptionalPackBrief({
      workflow: 'spec-doc-review',
      changed_files: ['docs/design/figma.md'],
      risk_signals: ['figma'],
    });

    expect(validateAgainstSchema(outputSchema, output).errors).toEqual([]);
    expect(output).not.toHaveProperty('selected_agents');
    expect(output).not.toHaveProperty('final_verdict');
    expect(output.optional_pack_policy).toMatchObject({
      default_baseline_enabled: false,
      explicit_activation_required: true,
      router_candidate_is_not_activation: true,
      runtime_delivery: 'none_in_v1',
      connector_queries_allowed: false,
    });
    expect(pack(output, 'external-design-pack')).toMatchObject({
      workflow_allowed: true,
      default_enabled: false,
      baseline_eligible: false,
      explicit_activation_required: true,
      activation_state: 'inactive',
      allowed_use: 'unavailable',
    });
    expect(pack(output, 'external-design-pack').required_disclosures).toContain('explicit_activation_missing');
    expect(output.forbidden_actions).toEqual(expect.arrayContaining([
      'activate_optional_pack_without_explicit_request',
      'query_external_connector',
      'write_generated_runtime_mirror',
    ]));
  });

  test('activates team context only when explicitly enabled with connector evidence', () => {
    const outputSchema = readJson(path.join(CONTRACT_DIR, 'optional-pack-brief.schema.json'));
    const output = prepareOptionalPackBrief({
      workflow: 'spec-plan',
      enabled_packs: ['team-context-pack'],
      evidence_types: ['slack', 'issues'],
      risk_signals: ['team_context'],
    });
    const teamPack = pack(output, 'team-context-pack');

    expect(validateAgainstSchema(outputSchema, output).errors).toEqual([]);
    expect(teamPack).toMatchObject({
      activation_state: 'activated',
      activation_basis: ['explicit_pack'],
      allowed_use: 'connector_evidence_context',
      confidence_ceiling: 'medium',
      max_severity: 'medium',
    });
    expect(teamPack.connector_requirements).toMatchObject({
      connector_mode: 'optional_connector',
      provided_evidence_types: ['issues', 'slack'],
      missing_evidence_types: [],
      evidence_satisfied: true,
    });
    expect(teamPack.agents.map((agent) => agent.agent_id)).toEqual(expect.arrayContaining([
      'spec-slack-researcher',
      'spec-issue-intelligence-analyst',
      'spec-previous-comments-reviewer',
      'spec-pr-comment-resolver',
    ]));
    expect(teamPack.forbidden_claims).toContain('implicit_optional_pack_activation');
  });

  test('explicit external design without Figma evidence stays reference-only', () => {
    const output = prepareOptionalPackBrief({
      workflow: 'spec-doc-review',
      enabled_packs: ['external-design-pack'],
      risk_signals: ['explicit_figma'],
    });
    const designPack = pack(output, 'external-design-pack');

    expect(designPack).toMatchObject({
      activation_state: 'activated_reference_only',
      activation_basis: ['explicit_pack', 'explicit_signal'],
      allowed_use: 'reference_only',
      confidence_ceiling: 'low',
    });
    expect(designPack.connector_requirements).toMatchObject({
      required_any_evidence_types: ['figma'],
      provided_evidence_types: [],
      missing_evidence_types: ['figma'],
      evidence_satisfied: false,
    });
    expect(designPack.required_disclosures).toEqual(expect.arrayContaining([
      'connector_evidence_missing',
      'missing_evidence:figma',
    ]));
    expect(designPack.forbidden_claims).toEqual(expect.arrayContaining([
      'connector_evidence_claim',
      'hard_context_from_optional_pack',
    ]));
  });

  test('style profiles are explicit advisory-only and cannot produce blockers', () => {
    const output = prepareOptionalPackBrief({
      workflow: 'spec-code-review',
      enabled_agents: ['spec-dhh-rails-reviewer'],
      risk_signals: ['explicit_style_profile'],
    });
    const stylePack = pack(output, 'style-profile-pack');

    expect(stylePack).toMatchObject({
      activation_state: 'activated',
      activation_basis: ['explicit_agent', 'explicit_signal'],
      allowed_use: 'style_advisory',
      confidence_ceiling: 'medium',
      max_severity: 'note',
    });
    expect(stylePack.connector_requirements).toMatchObject({
      connector_mode: 'none',
      required_any_evidence_types: [],
      evidence_satisfied: true,
    });
    expect(stylePack.forbidden_claims).toEqual(expect.arrayContaining([
      'style_profile_blocker',
      'style_profile_required_fix',
    ]));
    expect(stylePack.agents.every((agent) => agent.max_severity === 'note')).toBe(true);
  });

  test('router candidates make optional packs eligible but do not activate them', () => {
    const routerCandidates = routeCandidates({
      workflow: 'spec-plan',
      changed_files: ['docs/issue-notes.md'],
      risk_signals: ['team_context'],
    });
    const output = prepareOptionalPackBrief({
      workflow: 'spec-plan',
      router_candidates: routerCandidates,
    });
    const teamPack = pack(output, 'team-context-pack');

    expect(output.router_context.available).toBe(true);
    expect(output.router_context.optional_candidate_agents).toEqual(expect.arrayContaining([
      'spec-slack-researcher',
      'spec-issue-intelligence-analyst',
    ]));
    expect(teamPack.activation_state).toBe('eligible');
    expect(teamPack.activation_basis).toEqual(['router_candidate']);
    expect(teamPack.allowed_use).toBe('activation_candidate_only');
    expect(teamPack.required_disclosures).toEqual(expect.arrayContaining([
      'explicit_activation_missing',
      'router_candidate_not_activation',
    ]));
  });

  test('rejects router workflow mismatch and unsupported workflows', () => {
    const routerCandidates = routeCandidates({
      workflow: 'spec-plan',
      changed_files: ['docs/issue-notes.md'],
      risk_signals: ['team_context'],
    });

    expect(() => prepareOptionalPackBrief({
      workflow: 'spec-doc-review',
      router_candidates: routerCandidates,
    })).toThrow('router candidate workflow mismatch');

    expect(() => prepareOptionalPackBrief({
      workflow: 'spec-work',
    })).toThrow('unsupported workflow');
  });
});
