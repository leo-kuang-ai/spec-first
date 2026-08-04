'use strict';

const fs = require('node:fs');
const path = require('node:path');

const skill = fs.readFileSync(
  path.resolve(__dirname, '../../skills/spec-debug/SKILL.md'),
  'utf8',
);

describe('spec-debug current safety contracts', () => {
  test('locks repo, source/runtime, and dirty overlap before fix mutation', () => {
    expect(skill).toContain('single `target_repo`');
    expect(skill).toMatch(/parent workspace.*before.*test.*fix/is);
    expect(skill).toMatch(/generated runtime.*not.*source/is);
    expect(skill).toMatch(/pre-existing dirty.*overlap/is);
    expect(skill).toMatch(/Fix it now.*local fix mutation/is);
  });

  test('parallel probes require authorization and degrade to ranked serial investigation', () => {
    expect(skill).toContain('worker_dispatch_authorization');
    expect(skill).toContain('capability_probe');
    expect(skill).toContain('worker_dispatch_capability');
    expect(skill).toContain('worker_capability_unproven');
    expect(skill).toContain('provider_untrusted');
    expect(skill).toContain('dispatch_authorization_missing');
    expect(skill).toContain('subagent_capability_missing');
    expect(skill).toMatch(/permission settings.*not.*dispatch authorization/is);
    expect(skill).toMatch(/ranked-likelihood.*sequential/is);
  });

  test('commit and outward landing are separate from fix authorization', () => {
    expect(skill).toContain('commit_authorization');
    expect(skill).toContain('landing_authorization');
    expect(skill).toMatch(/Fix it now.*does not authorize.*commit.*push.*PR/is);
    expect(skill).toMatch(/without commit authorization.*verified uncommitted/is);
    expect(skill).toMatch(/without landing authorization.*do not push.*do not open.*PR/is);
    expect(skill).not.toContain('default to commit-and-PR without prompting');
  });

  test('diagnosis-only reports structured closeout as not run instead of inventing a verdict', () => {
    expect(skill).toContain('`honest_closeout_verdict: not-run`');
    expect(skill).toContain('diagnosis-only-no-post-fix-verification');
    expect(skill).toMatch(/do not fabricate.*validator verdict/is);
  });
});
