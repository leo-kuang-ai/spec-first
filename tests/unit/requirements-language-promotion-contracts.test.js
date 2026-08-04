'use strict';

const fs = require('node:fs');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

const brainstorm = read('skills/spec-brainstorm/SKILL.md');
const plan = read('skills/spec-plan/SKILL.md');
const prd = read('skills/spec-prd/SKILL.md');
const domain = read('skills/spec-prd/references/domain-language-and-decision-ledger.md');
const grill = read('skills/spec-prd/references/grill-with-docs-integration.md');
const output = read('skills/spec-prd/references/prd-output-template.md');
const readiness = read('skills/spec-prd/references/prd-readiness-lens.md');
const glossary = read('docs/contracts/domain-glossary.md');
const evaluation = read(
  'docs/validation/requirements-clarification/2026-07-11-clarification-integration-current-source-evaluation.md',
);

describe('requirements language promotion boundary', () => {
  test('brainstorm and plan never silently write CONCEPTS.md', () => {
    expect(brainstorm).not.toContain('Apply edits silently');
    expect(plan).not.toContain('Apply silently');
    expect(brainstorm).toContain('project-level promotion candidate');
    expect(plan).toContain('project-level promotion candidate');
    expect(brainstorm).toContain('not written by this workflow');
    expect(plan).toContain('not written by this workflow');
  });

  test('uses project language as advisory calibration instead of filename authority', () => {
    expect(brainstorm).toContain('advisory calibration source');
    expect(plan).toContain('advisory calibration source');
    expect(glossary).toContain('does not automatically override');
    expect(glossary).toContain('PRD-local meaning');
  });

  test('spec-prd closes locally and emits candidates without project mutation', () => {
    for (const source of [prd, domain, grill, output, readiness]) {
      expect(source).toContain('candidate-only');
      expect(source).toContain('PRD-local');
    }
    expect(prd).toContain('never creates or modifies `CONTEXT.md`, `CONTEXT-MAP.md`, project glossary, or ADR files');
    expect(grill).toContain('The embedded upstream snapshot is historical input, not mutation authorization');
    for (const forbiddenImperative of [
      /Update CONTEXT\.md inline/i,
      /create one when the first term is resolved/i,
      /if no `docs\/adr\/` exists, create it/i,
      /update `CONTEXT\.md` right there/i,
      /create the ADR inline/i,
    ]) {
      expect(grill).not.toMatch(forbiddenImperative);
    }
    expect(output).toContain('not written by this workflow');
    expect(readiness).toContain('project-level files remain unchanged');
  });

  test('requires durable promotion qualification', () => {
    const requiredFields = [
      'target kind/path',
      'proposed meaning',
      'provenance',
      'applicability scope',
      'real consumer',
      'reuse rationale',
      'invalidation condition',
    ];
    for (const field of requiredFields) {
      expect(domain).toContain(field);
    }
    expect(domain).toContain('hard to reverse, surprising without context, and a real tradeoff');
  });

  test('records a reproducible U5 protected-file sentinel without claiming workflow replay', () => {
    expect(evaluation).toContain('## U5 deterministic no-mutation sentinel');
    expect(evaluation).toContain('deterministic fixture window');
    expect(evaluation).toContain('it is not a historical replay');
    expect(evaluation).toContain('does not attribute the existing contents of concurrently owned files to this task');
    expect(evaluation).toContain('Sentinel result: passed');

    const sentinelRows = [...evaluation.matchAll(
      /^\| `([^`]+)` \| `([^`]+)` \| `([^`]+)` \|$/gm,
    )].map((match) => ({
      filePath: match[1],
      before: match[2],
      after: match[3],
    }));

    expect(sentinelRows.map((row) => row.filePath)).toEqual([
      'CONCEPTS.md',
      'docs/contracts/domain-glossary.md',
      'CONTEXT.md',
      'CONTEXT-MAP.md',
      'docs/adr/0001-init-owns-limited-user-language-sync.md',
      'docs/adr/0002-init-team-knowledge-network-access.md',
      'docs/adr/0002-spec-prd-stays-workflow-not-agent-collection.md',
    ]);

    for (const row of sentinelRows) {
      expect(row.after).toBe(row.before);
      if (row.before === 'absent') {
        expect(fs.existsSync(row.filePath)).toBe(false);
      } else {
        expect(row.before).toMatch(/^present:[a-f0-9]{64}$/);
      }
    }
  });
});
