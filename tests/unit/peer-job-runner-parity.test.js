const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../..');
const runners = [
  'skills/spec-code-review/scripts/peer-job-runner.py',
  'skills/spec-doc-review/scripts/peer-job-runner.py',
  'skills/spec-pov/scripts/peer-job-runner.py',
];

describe('peer job runner source parity', () => {
  test('all activated Skill-local runners are byte-identical', () => {
    const sources = runners.map((file) => fs.readFileSync(path.join(repoRoot, file)));
    expect(sources[1].equals(sources[0])).toBe(true);
    expect(sources[2].equals(sources[0])).toBe(true);
  });

  test('brainstorm and plan do not receive orphan peer runtimes', () => {
    for (const skill of ['spec-brainstorm', 'spec-plan']) {
      expect(fs.existsSync(path.join(
        repoRoot,
        'skills',
        skill,
        'scripts',
        'peer-job-runner.py',
      ))).toBe(false);
    }
  });
});
