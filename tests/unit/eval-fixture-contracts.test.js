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
});
