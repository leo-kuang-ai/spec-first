'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');
const fixturePaths = [
  'skills/spec-prd/evals/examples.json',
  'skills/spec-write-skill/evals/trigger-cases.json',
  'skills/spec-write-tasks/evals/output-quality-cases.json',
];
const governanceReferenceDocs = [
  'docs/11-业界调研/README.md',
  'docs/11-业界调研/2026-06-21-spec-first-综合优先级建议-源码级深度解读.md',
  'docs/solutions/architecture-patterns/front-controller-triggered-references-gates-eval-regression-2026-07-01.md',
];

describe('active eval fixture references', () => {
  test.each(fixturePaths)('%s has no missing current source references', (relativePath) => {
    const fixture = JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
    const refs = [
      ...(fixture.source_refs || []),
      ...(fixture.cases || []).flatMap((entry) => [
        ...(entry.source_refs || []),
        ...(entry.input_files || []).map((input) => input.path),
        ...(entry.deterministic_assertions || []).map((assertion) => assertion.target_file),
      ]),
    ];
    const currentRefs = refs.filter((ref) => typeof ref === 'string' && ref && !ref.includes('*'));
    expect(currentRefs.filter((ref) => !fs.existsSync(path.join(repoRoot, ref)))).toEqual([]);
  });

  test.each(governanceReferenceDocs)('%s points at the current source-only PRD governance note', (relativePath) => {
    const contents = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    expect(contents).toContain('skills/spec-prd/evals/evaluation-governance.md');
    expect(contents).not.toContain('skills/spec-prd/references/evaluation-governance.md');
    expect(fs.existsSync(path.join(
      repoRoot,
      'skills/spec-prd/evals/evaluation-governance.md',
    ))).toBe(true);
  });

  test('spec-prd degraded finalize fixture uses the loaded runtime skill root', () => {
    const fixture = JSON.parse(fs.readFileSync(path.join(
      repoRoot,
      'skills/spec-prd/evals/examples.json',
    ), 'utf8'));
    const finalizeCase = fixture.cases.find((entry) =>
      entry.id === 'codex-degraded-producer-finalize'
    );

    expect(finalizeCase).toBeDefined();
    expect(finalizeCase.input_shape).toContain(
      'producer-local finalize command from the loaded spec-prd skill root',
    );
    expect(finalizeCase.input_shape).not.toContain(
      'current-source producer finalize command',
    );
  });

  test('spec-write-skill route fixtures declare structural evidence and executable expectations', () => {
    const fixture = JSON.parse(fs.readFileSync(path.join(
      repoRoot,
      'skills/spec-write-skill/evals/trigger-cases.json',
    ), 'utf8'));

    expect(fixture.schema_version).toBe('spec-first.spec-write-skill-trigger-cases.v3');
    expect(fixture.evidence_scope).toBe('structural-only');
    expect(fixture).not.toHaveProperty('evidence_level');
    expect(fixture.cases).toHaveLength(8);
    expect(fixture.route_queries.length).toBeGreaterThanOrEqual(12);
    expect(fixture.route_queries.length).toBeLessThanOrEqual(16);
    expect(new Set(fixture.cases.map((entry) => entry.id)).size).toBe(fixture.cases.length);
    expect(new Set(fixture.route_queries.map((entry) => entry.id)).size)
      .toBe(fixture.route_queries.length);

    for (const entry of fixture.cases) {
      expect(typeof entry.expected_trigger).toBe('boolean');
      expect(entry.prompt).toEqual(expect.any(String));
      expect(entry.expected_base_operation === null || ['create', 'revise'].includes(entry.expected_base_operation)).toBe(true);
      expect(['apply', 'validate-only', 'not-entered']).toContain(entry.expected_effect);
      expect(['migrate', 'audit-remediation', 'none']).toContain(entry.expected_modifier);
      expect(entry.expected_layer_result).toEqual(expect.any(String));
      expect(entry.reason_code).toEqual(expect.any(String));
      expect(entry.forbidden_signals).toEqual(expect.any(Array));
      expect(entry.forbidden_signals.length).toBeGreaterThan(0);
    }

    for (const entry of fixture.route_queries) {
      expect(entry.query).toEqual(expect.any(String));
      expect(typeof entry.expected_trigger).toBe('boolean');
      expect(entry.expected_route).toEqual(expect.any(String));
      expect(entry.reason_code).toEqual(expect.any(String));
      expect(entry.forbidden_signals).toEqual(expect.any(Array));
    }

    expect([...new Set(fixture.route_queries.map((entry) => entry.expected_route))]).toEqual(
      expect.arrayContaining([
        'spec-write-skill',
        'bounded-source-review',
        'direct-answer',
        'skill-installer',
        'runtime-maintenance',
        'spec-debug',
      ]),
    );

    expect(fixture.cases).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'malicious-external-package',
        expected_effect: 'validate-only',
        expected_layer_result: 'trust-preflight-blocked',
      }),
      expect.objectContaining({
        id: 'portable-create-non-spec-first',
        expected_base_operation: 'create',
        expected_effect: 'apply',
        expected_layer_result: 'portable-core-only',
      }),
    ]));
  });
});
