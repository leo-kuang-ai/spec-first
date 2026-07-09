'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..', '..');

const WORKFLOW_SKILLS = [
  'skills/spec-plan/SKILL.md',
  'skills/spec-debug/SKILL.md',
  'skills/spec-prd/SKILL.md',
];

function readRepo(relativePath) {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');
}

function readWorkflowSurface(relativePath) {
  if (relativePath === 'skills/spec-plan/SKILL.md') {
    return [
      readRepo(relativePath),
      readRepo('skills/spec-plan/references/governance-boundaries.md'),
    ].join('\n');
  }

  return readRepo(relativePath);
}

describe('capability-aware provider contracts', () => {
  test.each(WORKFLOW_SKILLS)('%s consumes provider evidence by capability class only', (relativePath) => {
    const source = readWorkflowSurface(relativePath);
    const lower = source.toLowerCase();

    expect(source).toContain('Capability-Class Evidence Boundary');
    expect(source).toContain('docs/contracts/project-graph-consumption.md');
    expect(source).toContain('capability-class');
    expect(source).toContain('code-graph');
    expect(source).toContain('project-graph');
    expect(source).toContain('readiness_status');
    expect(source).toContain('provider_untrusted');
    expect(source).toContain('never-block');
    expect(source).toContain('lifecycle.fallback_used');

    expect(lower).not.toContain('codegraph_');
    expect(lower).not.toContain('graphify');
    expect(source).not.toContain('缺失即 warn/降级/阻断');
    expect(source).not.toContain('absent, stale, unknown, or unverified');
  });

  test('provider readiness contract preserves setup-vs-consumption fallback split', () => {
    const contract = readRepo('docs/contracts/provider-readiness.md');

    expect(contract).toContain('Provider self-reported `fresh` is not trusted');
    expect(contract).toContain('Provider self-reported `stale` may map to `stale`');
    expect(contract).toContain('Lifecycle fields are display/passthrough bits');
    expect(contract).toContain('Setup-side `lifecycle.fallback_used` is not the same thing as a workflow using fallback');
    expect(contract).toContain('Consumption-side fallback is recorded with `provider_untrusted`');
  });
});
