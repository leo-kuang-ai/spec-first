'use strict';

const fs = require('node:fs');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function section(text, startHeading, endHeading) {
  const start = text.indexOf(startHeading);
  const end = text.indexOf(endHeading, start + startHeading.length);
  if (start === -1 || end === -1) throw new Error(`section not found: ${startHeading}`);
  return text.slice(start, end);
}

describe('spec-product-pulse system performance contract', () => {
  test('loads phase owners and closes every report through the scheduling boundary', () => {
    const skill = read('skills/spec-product-pulse/SKILL.md');
    const setup = read('skills/spec-product-pulse/references/setup.md');
    const run = read('skills/spec-product-pulse/references/run.md');
    const interview = read('skills/spec-product-pulse/references/interview.md');

    expect(skill).toContain('before parsing the window');
    expect(skill).toContain('Every completed report proceeds here');
    expect(skill).toContain('do not repeat that offer in the same run');
    expect(skill).toContain('Any scheduling handoff requires explicit confirmation');
    expect(setup).toContain('Read `references/interview.md`');
    expect(interview).toContain('Loaded by `references/setup.md`');
    expect(run).toContain('`setup`/`reconfigure`/`edit config`');
    expect(run).toContain('Read `references/config.md` when interpreting values');
    expect(run).toContain('Then return to `SKILL.md` Phase 3');
    expect(run).toContain('explicit `pulse_db_enabled === true` gate');
  });

  test('keeps top 5 and latency percentiles fixed instead of inventing config', () => {
    const skill = read('skills/spec-product-pulse/SKILL.md');
    const interview = read('skills/spec-product-pulse/references/interview.md');
    const run = read('skills/spec-product-pulse/references/run.md');
    const reportTemplate = read('skills/spec-product-pulse/references/report-template.md');
    const performanceInterview = section(interview, '## 7. System Performance', '## 8. Default Lookback Window');

    expect(skill).toContain('latency (p50/p95/p99) and top 5 errors by count');
    expect(performanceInterview).toContain('Fixed report shape (not configurable in this version)');
    expect(performanceInterview).toContain('Top-error count remains 5 and latency remains p50/p95/p99 by contract.');
    expect(performanceInterview).toContain('include that section or omit it');
    expect(performanceInterview).not.toContain('top 3 instead of 5');
    expect(performanceInterview).not.toContain('skip latency');
    expect(performanceInterview).not.toContain('top-error count (default 5)');
    expect(reportTemplate).toContain('Top 5 errors, not top 10.');
    expect(reportTemplate).not.toContain('configured count');
    expect(reportTemplate).not.toContain('Error count customized at setup');
    expect(interview).not.toContain('pulse_error_count');
    expect(interview).not.toContain('pulse_latency');
  });

  test('minimizes quality-scoring content before it enters the agent context', () => {
    const skill = read('skills/spec-product-pulse/SKILL.md');
    const interview = read('skills/spec-product-pulse/references/interview.md');
    const run = read('skills/spec-product-pulse/references/run.md');
    const reportTemplate = read('skills/spec-product-pulse/references/report-template.md');

    expect(interview).toContain('enters the current agent/model context');
    expect(skill).toContain('provider-side projection');
    expect(skill).toContain('quality-source-minimization-unavailable');
    expect(run).toContain('do not attempt local redaction after the content has already entered context');
    expect(reportTemplate).toContain('Quality scoring blocked before access is `not-run`');
  });
});
