'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { validateAgainstSchema } = require('../../src/contracts/schema-validator');
const {
  inferRiskSignalsFromFiles,
  routeCandidates,
} = require('../../scripts/route-ecc-agent-candidates');

const REPO_ROOT = path.join(__dirname, '..', '..');
const CONTRACT_DIR = path.join(REPO_ROOT, 'src', 'cli', 'contracts', 'agent-registry');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function candidateIds(output) {
  return output.candidate_agents.map((candidate) => candidate.id);
}

describe('ECC router candidate projector', () => {
  test('infers risk signals from changed file paths', () => {
    expect(inferRiskSignalsFromFiles([
      'src/auth/session.ts',
      'openapi.yaml',
      'migrations/20260505.sql',
      'src/ui/Widget.tsx',
    ])).toEqual(expect.arrayContaining([
      'auth',
      'authorization',
      'openapi_changed',
      'migration',
      'sql',
      'tsx',
      'typescript',
      'ui',
    ]));
  });

  test('routes auth code-review facts without selecting final agents', () => {
    const input = {
      schema_version: 'spec-first.agent-router-input.v1',
      workflow: 'spec-code-review',
      changed_files: ['src/auth/session.ts'],
      risk_signals: ['runtime_code_changed'],
      available_evidence: {
        diff: true,
      },
    };
    const inputSchema = readJson(path.join(CONTRACT_DIR, 'router-candidate-input.schema.json'));
    const outputSchema = readJson(path.join(CONTRACT_DIR, 'router-candidate-output.schema.json'));
    const output = routeCandidates(input);
    const ids = candidateIds(output);

    expect(validateAgainstSchema(inputSchema, input).errors).toEqual([]);
    expect(validateAgainstSchema(outputSchema, output).errors).toEqual([]);
    expect(output).not.toHaveProperty('selected_agents');
    expect(output.requires_skill_decision).toBe(true);
    expect(output.reason_code).toBe('candidate_facts_ready');
    expect(ids).toEqual(expect.arrayContaining([
      'spec-security-reviewer',
      'spec-correctness-reviewer',
      'spec-testing-reviewer',
    ]));
    expect(output.candidate_agents.length).toBeLessThanOrEqual(5);
    expect(output.forbidden_fields).toContain('selected_agents');
  });

  test('routes API contract changes as candidate facts only', () => {
    const output = routeCandidates({
      workflow: 'spec-code-review',
      changed_files: ['openapi.yaml'],
      risk_signals: [],
    });
    const ids = candidateIds(output);

    expect(ids).toContain('spec-api-contract-reviewer');
    expect(ids).toContain('spec-testing-reviewer');
    expect(output.requires_skill_decision).toBe(true);
    expect(output.candidate_agents.find((candidate) => candidate.id === 'spec-api-contract-reviewer').reason_codes)
      .toEqual(expect.arrayContaining(['risk_signal:openapi_changed']));
  });

  test('short-circuits explicit low-risk typo changes', () => {
    const output = routeCandidates({
      workflow: 'spec-doc-review',
      changed_files: ['docs/typo.md'],
      risk_signals: ['low_risk_typo'],
    });

    expect(output.reason_code).toBe('low_risk_short_circuit');
    expect(output.candidate_agents).toEqual([]);
    expect(output.budget_hint).toBe('tiny');
    expect(output.requires_skill_decision).toBe(true);
  });

  test('skill-audit routes harness governance candidates but keeps final decision with the skill', () => {
    const output = routeCandidates({
      workflow: 'spec-skill-audit',
      changed_files: ['skills/spec-plan/SKILL.md', 'src/cli/contracts/example.schema.json'],
      risk_signals: [],
    });
    const ids = candidateIds(output);

    expect(ids).toEqual(expect.arrayContaining([
      'spec-agent-native-reviewer',
      'spec-cli-readiness-reviewer',
      'spec-project-standards-reviewer',
    ]));
    expect(output.requires_skill_decision).toBe(true);
    expect(output).not.toHaveProperty('final_verdict');
  });
});
