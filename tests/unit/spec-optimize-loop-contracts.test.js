'use strict';

const fs = require('node:fs');

const read = (filePath) => fs.readFileSync(filePath, 'utf8');

describe('spec-optimize loop contract', () => {
  test('retuning keeps measurement, attribution, and stop boundaries explicit', () => {
    const loop = read('skills/spec-optimize/references/loop.md');

    expect(loop).toContain('measurement problem before a wording problem');
    expect(loop).toContain('A/A noise-floor check');
    expect(loop).toContain('followed the workflow');
    expect(loop).toContain('Broken runs, timeouts, and harness errors');
    expect(loop).toContain('independent contexts');
    expect(loop).toContain('disjoint file ownership');
    expect(loop).toMatch(/Do not\s+edit tests merely to make a refactor green/);
    expect(loop).toMatch(/Inspect phases the harness\s+cannot reach/);
    expect(loop).toContain('separately attributable in the experiment log');
  });
});
