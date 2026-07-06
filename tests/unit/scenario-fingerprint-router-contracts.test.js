'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..', '..');
const USING_SPEC_FIRST = path.join(REPO_ROOT, 'skills', 'using-spec-first', 'SKILL.md');
const SCENARIO_ROUTING_REFERENCE = path.join(
  REPO_ROOT,
  'skills',
  'using-spec-first',
  'references',
  'scenario-fingerprint-routing.md',
);

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function expectContainsAll(content, snippets) {
  for (const snippet of snippets) {
    expect(content).toContain(snippet);
  }
}

describe('scenario fingerprint router contract', () => {
  test('using-spec-first consumes scenario fingerprints as advisory routing facts', () => {
    const skill = read(USING_SPEC_FIRST);
    const routingReference = read(SCENARIO_ROUTING_REFERENCE);

    expectContainsAll(skill, [
      '## Scenario Fingerprint Routing',
      '.spec-first/workspace/scenario-fingerprint.json',
      '.spec-first/workspace/scenario-fingerprint-setup.json',
      'skills/using-spec-first/references/scenario-fingerprint-routing.md',
    ]);
    expectContainsAll(routingReference, [
      'Prefer the bootstrap layer (`developer-scenario-fingerprint.v1`) over the setup layer (`developer-scenario-fingerprint-setup.v1`)',
      'Scenario fingerprints are not gates, approvals, or source scope authority.',
      'do not collapse them into a single risk score',
      'one entrypoint, one reason, and one next action',
      'Do not run setup, clean, external-tool commands, or runtime regeneration just to create a fingerprint',
    ]);
  });

  test('router documents setup-artifact and no-artifact setup guidance', () => {
    const routingReference = read(SCENARIO_ROUTING_REFERENCE);

    expectContainsAll(routingReference, [
      'If the fingerprint is missing and setup artifacts exist',
      'rerunning `spec-mcp-setup` will refresh the workspace scenario fingerprint',
      'then continue normal routing by user intent',
      'If the fingerprint is missing and no setup artifacts exist',
      'recommend `spec-mcp-setup`',
      'For clearly lightweight work, route by intent',
    ]);
  });

  test('router keeps the priority checks independent and advisory', () => {
    const routingReference = read(SCENARIO_ROUTING_REFERENCE);

    expectContainsAll(routingReference, [
      'Apply these scenario-aware checks in priority order',
      '1. `state_class=foreign-residual-workspace` or non-empty `foreign_residual_indicators[]`',
      '2. `state_class=first-time-git-repo`',
      '3. `complexity_dimensions.git_alignment_broken=true`',
      '4. `complexity_dimensions.worktree_dirty_source_affecting=true`',
      '5. None of the above: route normally by the user\'s immediate intent.',
      'If `freshness.stale_setup_layer=true`',
    ]);
  });

  test('foreign residual repair guidance uses preview-first workspace orphan cleanup', () => {
    const routingReference = read(SCENARIO_ROUTING_REFERENCE);

    expectContainsAll(routingReference, [
      'route to the current repair owner before downstream work',
      'Recommend `spec-first clean --workspace-orphans` as the preview-first inspection step',
      'spec-first clean --workspace-orphans --confirm',
      'only when the user explicitly wants to delete the quarantined parent artifacts',
      'pair cleanup with `spec-first init` or `spec-mcp-setup`',
    ]);
  });
});
