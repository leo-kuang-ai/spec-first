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
  test('keeps top 5 and latency percentiles fixed instead of inventing config', () => {
    const skill = read('skills/spec-product-pulse/SKILL.md');
    const interview = read('skills/spec-product-pulse/references/interview.md');
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
    const reportTemplate = read('skills/spec-product-pulse/references/report-template.md');

    expect(interview).toContain('enters the current agent/model context');
    expect(skill).toContain('provider-side projection');
    expect(skill).toContain('quality-source-minimization-unavailable');
    expect(skill).toContain('do not attempt local redaction after the content has already entered context');
    expect(reportTemplate).toContain('Quality scoring blocked before access is `not-run`');
  });
});
