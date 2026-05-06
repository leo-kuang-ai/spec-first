'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { validateAgainstSchema } = require('../../src/contracts/schema-validator');
const {
  projectFindingCore,
} = require('../../scripts/project-ecc-finding-core');

const REPO_ROOT = path.join(__dirname, '..', '..');
const CONTRACT_DIR = path.join(REPO_ROOT, 'src', 'cli', 'contracts', 'agent-registry');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

describe('ECC Finding Core compatibility projection', () => {
  test('projects code-review native findings without replacing native schema fields', () => {
    const nativeSchema = readJson(path.join(REPO_ROOT, 'skills/spec-code-review/references/findings-schema.json'));
    const outputSchema = readJson(path.join(CONTRACT_DIR, 'finding-core.schema.json'));
    const native = {
      reviewer: 'security',
      findings: [
        {
          title: 'Session refresh lacks boundary',
          severity: 'P1',
          file: 'src/auth/session.ts',
          line: 42,
          why_it_matters: 'Session refresh may bypass permission checks.',
          autofix_class: 'gated_auto',
          owner: 'human',
          requires_verification: true,
          suggested_fix: 'Add an explicit permission check before refresh.',
          confidence: 75,
          evidence: ['src/auth/session.ts:42 refresh proceeds before permission evidence'],
          pre_existing: false,
        },
      ],
      residual_risks: ['middleware behavior was not executed'],
      testing_gaps: ['missing revoked-permission refresh test'],
    };

    const output = projectFindingCore(native, {
      workflow: 'spec-code-review',
      agentId: 'spec-security-reviewer',
    });
    const finding = output.finding_core[0];

    expect(validateAgainstSchema(nativeSchema, native).errors).toEqual([]);
    expect(validateAgainstSchema(outputSchema, output).errors).toEqual([]);
    expect(output.requires_skill_synthesis).toBe(true);
    expect(output).not.toHaveProperty('final_verdict');
    expect(finding.native_schema).toBe('skills/spec-code-review/references/findings-schema.json');
    expect(finding.severity_display).toBe('high');
    expect(finding.confidence_display).toBe('high');
    expect(finding.projection_status).toBe('projected');
    expect(finding.native_preserved).toMatchObject({
      autofix_class: 'gated_auto',
      owner: 'human',
      requires_verification: true,
      pre_existing: false,
    });
    expect(finding.not_reviewed).toContain('native finding requires verification; reviewer did not execute fix validation');
  });

  test('projects doc-review native findings and preserves finding_type and deferred questions', () => {
    const nativeSchema = readJson(path.join(REPO_ROOT, 'skills/spec-doc-review/references/findings-schema.json'));
    const outputSchema = readJson(path.join(CONTRACT_DIR, 'finding-core.schema.json'));
    const native = {
      reviewer: 'coherence',
      findings: [
        {
          title: 'Plan omits rollback boundary',
          severity: 'P2',
          section: 'Rollout',
          why_it_matters: 'Implementers cannot tell when to stop or revert.',
          finding_type: 'omission',
          autofix_class: 'manual',
          suggested_fix: null,
          confidence: 50,
          evidence: ['Rollout section lists deploy steps but no rollback condition.'],
        },
      ],
      residual_risks: ['deployment owner not confirmed'],
      deferred_questions: ['Who owns rollback approval?'],
    };

    const output = projectFindingCore(native, {
      workflow: 'spec-doc-review',
      agentId: 'spec-coherence-reviewer',
    });
    const finding = output.finding_core[0];

    expect(validateAgainstSchema(nativeSchema, native).errors).toEqual([]);
    expect(validateAgainstSchema(outputSchema, output).errors).toEqual([]);
    expect(output.native_summary.deferred_questions).toEqual(['Who owns rollback approval?']);
    expect(finding.severity_display).toBe('medium');
    expect(finding.confidence_display).toBe('medium');
    expect(finding.recommendation).toBeNull();
    expect(finding.native_preserved).toMatchObject({
      section: 'Rollout',
      finding_type: 'omission',
      autofix_class: 'manual',
      suggested_fix: null,
    });
    expect(finding.adapter_notes).toContain('native finding did not provide suggested_fix; recommendation remains null');
  });

  test('keeps low-confidence native findings as compatibility facts for Skill synthesis', () => {
    const output = projectFindingCore({
      reviewer: 'correctness',
      findings: [
        {
          title: 'Edge case may be stale',
          severity: 'P3',
          file: 'src/example.ts',
          line: 7,
          why_it_matters: 'The edge case might confuse future maintainers.',
          autofix_class: 'advisory',
          owner: 'human',
          requires_verification: false,
          suggested_fix: null,
          confidence: 25,
          evidence: ['Pattern differs from adjacent helper.'],
          pre_existing: false,
        },
      ],
      residual_risks: [],
      testing_gaps: [],
    }, {
      workflow: 'spec-code-review',
    });

    expect(output.finding_core[0]).toMatchObject({
      confidence_display: 'low',
      projection_status: 'projected',
    });
    expect(output.requires_skill_synthesis).toBe(true);
  });

  test('rejects unsupported workflows instead of inventing a native schema', () => {
    expect(() => projectFindingCore({
      reviewer: 'planner',
      findings: [],
    }, {
      workflow: 'spec-plan',
    })).toThrow('unsupported workflow');
  });
});
