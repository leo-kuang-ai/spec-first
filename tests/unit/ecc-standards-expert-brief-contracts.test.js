'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { validateAgainstSchema } = require('../../src/contracts/schema-validator');
const { routeCandidates } = require('../../scripts/route-ecc-agent-candidates');
const {
  prepareStandardsExpertBrief,
} = require('../../scripts/prepare-ecc-standards-expert-brief');

const REPO_ROOT = path.join(__dirname, '..', '..');
const CONTRACT_DIR = path.join(REPO_ROOT, 'src', 'cli', 'contracts', 'agent-registry');
const FIXTURE_DIR = path.join(REPO_ROOT, 'tests', 'fixtures', 'spec-standards', 'valid-baseline');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(repoRoot, relativePath, value) {
  const fullPath = path.join(repoRoot, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(repoRoot, relativePath, value) {
  const fullPath = path.join(repoRoot, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, value);
}

function createRepo() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ecc-standards-brief-'));
}

function copyStandardsFixture(repoRoot, files = [
  'project-shape.json',
  'standards-plan.json',
  'glue-map.json',
  'standards-candidates.json',
  'standards-preview.md',
]) {
  for (const fileName of files) {
    const source = path.join(FIXTURE_DIR, fileName);
    const target = path.join(repoRoot, '.spec-first', 'standards', fileName);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
  }
}

describe('ECC Standards-aware Expert brief', () => {
  test('prepares trusted standards context without writing repo-profile or selecting agents', () => {
    const repoRoot = createRepo();
    copyStandardsFixture(repoRoot);
    writeText(repoRoot, '.spec-first/specs/repo-profile.yaml', 'standards:\n  preview_first: true\n');
    const outputSchema = readJson(path.join(CONTRACT_DIR, 'standards-expert-brief.schema.json'));

    const output = prepareStandardsExpertBrief({
      workflow: 'spec-code-review',
      changed_files: ['src/cli/index.js'],
      risk_signals: ['runtime_code_changed'],
    }, { repoRoot });

    expect(validateAgainstSchema(outputSchema, output).errors).toEqual([]);
    expect(output).not.toHaveProperty('selected_agents');
    expect(output).not.toHaveProperty('final_verdict');
    expect(output.standards_readiness).toMatchObject({
      status: 'trusted',
      confidence: 'high',
      limitations_required: false,
      effective_hard_context_enabled: true,
    });
    expect(output.validation_result).toMatchObject({
      available: true,
      status: 'pass',
      trust_level: 'trusted',
      errors_count: 0,
    });
    expect(output.candidate_summary.hard_context_candidate_ids).toEqual(['standards.confirmed.preview-first']);
    expect(output.candidate_summary.advisory_context_candidate_ids).toEqual(expect.arrayContaining([
      'standards.imported.service-boundary',
      'standards.observed.artifacts',
      'standards.suggested.cli-contracts',
    ]));
    expect(output.candidate_summary.risk_context_candidate_ids).toEqual(['standards.conflict.runtime-mirror']);
    expect(output.candidate_summary.question_context_candidate_ids).toEqual(['standards.unknown.owner']);
    expect(output.expert_standards_context.find((context) => context.agent_id === 'spec-project-standards-reviewer'))
      .toMatchObject({
        standards_use_case: 'project_standard_compliance',
        confidence_ceiling: 'high',
        hard_context_candidate_ids: ['standards.confirmed.preview-first'],
        forbidden_claims: expect.arrayContaining([
          'confirmed_standards_write',
          'hard_constraint_from_observed_or_imported_candidate',
          'repo_profile_modified',
        ]),
      });
    expect(output.forbidden_actions).toEqual(expect.arrayContaining([
      'modify_repo_profile',
      'write_standards_artifacts',
      'confirmed_standards_write',
    ]));
  });

  test('degraded validation turns confirmed candidates into advisory context only', () => {
    const repoRoot = createRepo();
    copyStandardsFixture(repoRoot, ['standards-candidates.json', 'standards-preview.md']);

    const output = prepareStandardsExpertBrief({
      workflow: 'spec-plan',
      allow_fallback_vocabulary: true,
    }, { repoRoot, allowFallbackVocabulary: true });

    expect(output.standards_readiness.status).toBe('degraded');
    expect(output.standards_readiness.effective_hard_context_enabled).toBe(false);
    expect(output.validation_result).toMatchObject({
      available: true,
      status: 'pass',
      trust_level: 'degraded',
    });
    expect(output.candidate_summary.hard_context_candidate_ids).toEqual([]);
    expect(output.candidate_summary.advisory_context_candidate_ids).toContain('standards.confirmed.preview-first');
    expect(output.expert_standards_context[0].required_disclosures).toContain('validation_trust_level:degraded');
  });

  test('update decision recommendation marks otherwise valid standards as stale', () => {
    const repoRoot = createRepo();
    copyStandardsFixture(repoRoot);
    writeJson(repoRoot, '.spec-first/standards/standards-update-decision.json', {
      schema_version: 'spec-first.standards-update-decision.v1',
      mode: 'quick',
      scope: {
        type: 'repo',
        root: '.',
        domains: [],
        modules: [],
      },
      recommendation: 'refresh',
      reason_codes: ['inventory-hash-changed'],
      current_inventory_hash: 'sha256:current',
      existing_inventory_hash: 'sha256:previous',
      current_inventory_hash_reliability: 'complete',
      existing_inventory_hash_reliability: 'complete',
      existing_artifacts: [],
      missing_artifacts: [],
      next_actions: ['Run spec-standards --refresh.'],
    });

    const output = prepareStandardsExpertBrief({
      workflow: 'spec-plan',
    }, { repoRoot });

    expect(output.standards_readiness.status).toBe('stale');
    expect(output.standards_readiness.confidence).toBe('low');
    expect(output.standards_readiness.effective_hard_context_enabled).toBe(false);
    expect(output.standards_readiness.reason_codes).toContain('standards_update_recommendation:refresh');
    expect(output.expert_standards_context[0].confidence_ceiling).toBe('low');
  });

  test('missing standards artifacts do not create hard constraints', () => {
    const repoRoot = createRepo();
    const outputSchema = readJson(path.join(CONTRACT_DIR, 'standards-expert-brief.schema.json'));

    const output = prepareStandardsExpertBrief({
      workflow: 'spec-code-review',
    }, { repoRoot });

    expect(validateAgainstSchema(outputSchema, output).errors).toEqual([]);
    expect(output.standards_readiness.status).toBe('missing');
    expect(output.validation_result.available).toBe(false);
    expect(output.candidate_summary.hard_context_candidate_ids).toEqual([]);
    expect(output.expert_standards_context[0].allowed_standards_artifacts[0].allowed_use).toBe('unavailable');
    expect(output.expert_standards_context[0].forbidden_claims).toContain('hard_constraint_from_standards_candidate');
  });

  test('invalid standards artifacts stay invalid and advisory-only', () => {
    const repoRoot = createRepo();
    copyStandardsFixture(repoRoot);
    const candidatesPath = path.join(repoRoot, '.spec-first/standards/standards-candidates.json');
    const candidates = readJson(candidatesPath);
    candidates.candidates[0].source_type = 'graph_observed';
    fs.writeFileSync(candidatesPath, `${JSON.stringify(candidates, null, 2)}\n`);

    const output = prepareStandardsExpertBrief({
      workflow: 'spec-code-review',
    }, { repoRoot });

    expect(output.standards_readiness.status).toBe('invalid');
    expect(output.validation_result.status).toBe('fail');
    expect(output.validation_result.errors_count).toBeGreaterThan(0);
    expect(output.standards_readiness.effective_hard_context_enabled).toBe(false);
    expect(output.candidate_summary.hard_context_candidate_ids).toEqual([]);
  });

  test('router candidates restrict standards-aware expert context and preserve Skill decision boundary', () => {
    const repoRoot = createRepo();
    copyStandardsFixture(repoRoot);
    const routerCandidates = routeCandidates({
      workflow: 'spec-code-review',
      changed_files: ['src/auth/session.ts'],
      risk_signals: ['runtime_code_changed'],
    });

    const output = prepareStandardsExpertBrief({
      workflow: 'spec-code-review',
      router_candidates: routerCandidates,
    }, { repoRoot });

    expect(output.router_context.available).toBe(true);
    expect(output.router_context.requires_skill_decision).toBe(true);
    expect(output.router_context.candidate_agents).toEqual(
      routerCandidates.candidate_agents.map((candidate) => candidate.id).sort(),
    );
    expect(output.router_context.standards_aware_candidate_agents.length).toBeGreaterThan(0);
    expect(output.expert_standards_context.map((context) => context.agent_id)).toEqual(
      output.router_context.standards_aware_candidate_agents,
    );
    expect(output.non_standards_agents.map((agent) => agent.agent_id)).toEqual(
      output.router_context.non_standards_candidate_agents,
    );
  });

  test('rejects router workflow mismatch and unsupported workflows', () => {
    const repoRoot = createRepo();
    copyStandardsFixture(repoRoot);
    const routerCandidates = routeCandidates({
      workflow: 'spec-code-review',
      changed_files: ['src/auth/session.ts'],
      risk_signals: [],
    });

    expect(() => prepareStandardsExpertBrief({
      workflow: 'spec-plan',
      router_candidates: routerCandidates,
    }, { repoRoot })).toThrow('router candidate workflow mismatch');

    expect(() => prepareStandardsExpertBrief({
      workflow: 'spec-brainstorm',
    }, { repoRoot })).toThrow('unsupported workflow');
  });
});
