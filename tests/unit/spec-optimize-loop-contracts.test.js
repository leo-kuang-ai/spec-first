'use strict';

const fs = require('node:fs');

const read = (filePath) => fs.readFileSync(filePath, 'utf8');

describe('spec-optimize loop contract', () => {
  test('resuming cannot manufacture approval or change a protocol with existing experiments', () => {
    const entry = read('skills/spec-optimize/SKILL.md');
    const persistence = read('skills/spec-optimize/references/persistence.md');
    const measurement = read('skills/spec-optimize/references/measurement.md');
    const wrapUp = read('skills/spec-optimize/references/wrap-up.md');

    expect(entry.indexOf('1. Read `references/persistence.md`')).toBeLessThan(entry.indexOf('2. Read `references/spec.md`'));
    expect(persistence).toContain('never infer approval from CP-1 or an iteration number');
    expect(measurement).toContain('both the hypothesis backlog and experiments are empty');
    expect(measurement).toContain('invalidate the old baseline, and rerun Phase 1');
    expect(measurement).not.toContain('Continue from the last iteration number');
    expect(wrapUp).toContain('do not finalize CP-5 or clean up state needed for that continuation');
    expect(wrapUp).toContain('write and read back the final experiment log at CP-5 before cleanup');
  });

  test('unavailable independent judging remains unmeasured and never enters comparison', () => {
    const loop = read('skills/spec-optimize/references/loop.md');
    const measurement = read('skills/spec-optimize/references/measurement.md');

    expect(loop).toContain('judges must not author the hypothesis, run the experiment they score, or see other judges\' results');
    expect(loop).toContain('Skip scoring and comparison, then persist and verify the error at CP-3');
    expect(loop).toContain('cannot become `best`');
    expect(loop).not.toContain('serially inline');
    expect(measurement).toContain('stop Phase 1 without an inline substitute or invented baseline score');
  });

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
