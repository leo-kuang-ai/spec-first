'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');
const fixturePaths = [
  'skills/spec-prd/evals/examples.json',
  'skills/spec-write-tasks/evals/output-quality-cases.json',
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
});
