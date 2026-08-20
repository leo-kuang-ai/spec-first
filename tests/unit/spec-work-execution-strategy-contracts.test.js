'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('spec-work execution strategy contracts', () => {
  const skill = read('skills/spec-work/SKILL.md');
  const strategy = read('skills/spec-work/references/execution-strategy.md');
  const engines = read('skills/spec-work/references/execution-engines.md');
  const shipping = read('skills/spec-work/references/shipping-workflow.md');

  test('keeps repo, scope, source/runtime, and authorization anchors on the spine', () => {
    expect(skill).toContain('references/execution-strategy.md');
    expect(skill).toMatch(/target_repo/i);
    expect(skill).toMatch(/generated runtime/i);
    expect(skill).toMatch(/scope-changing discovery/i);
    expect(skill).toMatch(/commit_authorization/i);
    expect(skill).toMatch(/landing_authorization/i);
  });

  test('strategy owns target-repo, dirty overlap, and scope expansion posture', () => {
    expect(strategy).toContain('## Owned');
    expect(strategy).toContain('## Not Owned');
    expect(strategy).toContain('## Trigger');
    expect(strategy).toContain('## Fallback');
    expect(strategy).toContain('single `target_repo`');
    expect(strategy).toContain('pre-existing dirty');
    expect(strategy).toContain('generated runtime');
    expect(strategy).toContain('source of truth');
    expect(strategy).toContain('necessary discovered file');
    expect(strategy).toContain('scope-changing discovery');
    expect(strategy).toContain('acceptance');
    expect(strategy).toContain('public contract');
    expect(strategy).toContain('source ownership');
  });

  test('separates dispatch authorization, capability, and isolation', () => {
    expect(strategy).toContain('worker_dispatch_authorization');
    expect(strategy).toContain('dispatch_authorization_missing');
    expect(strategy).toContain('subagent_capability_missing');
    expect(strategy).toContain('workspace_isolation');
    expect(strategy).toMatch(/permission settings.*not.*dispatch authorization/is);
    expect(strategy).toMatch(/unknown isolation.*shared directory/is);
    expect(strategy).toMatch(/disjoint.*bounded parallel/is);
    expect(strategy).toMatch(/same-file|same file/i);
    expect(strategy).toMatch(/environment singleton/i);
  });

  test('keeps worker, commit, and landing ownership singular', () => {
    expect(strategy).toMatch(/worker.*never commit/is);
    expect(strategy).toContain('commit_authorization');
    expect(strategy).toContain('landing_authorization');
    expect(strategy).toMatch(/without commit authorization.*leave.*uncommitted/is);
    expect(strategy).toMatch(/without landing authorization.*do not push.*do not open.*PR/is);
    expect(strategy).toMatch(/do not promise.*upload/is);
    expect(strategy).not.toContain('edits its forked workspace');
  });

  test('fails closed when the host cannot enforce Git index and credential isolation', () => {
    expect(strategy).toContain('git rev-parse --git-common-dir');
    expect(strategy).toContain('git rev-parse --git-path index');
    expect(strategy).toContain('worker_git_index_enforcement: unavailable');
    expect(strategy).toContain('worker_git_index_enforcement_unavailable');
    expect(strategy).toContain('worker_git_index_mutation_detected');
    expect(strategy).toContain('worker_cleanup_unconfirmed');
    expect(strategy).toContain('credential allowlist');
    expect(strategy).toMatch(/do not start the mutation-capable worker/i);
    expect(strategy).toMatch(/cannot be used to claim an independently completed worker unit/i);
  });

  test('engines preserve checkpoints without hard-coding host guarantees', () => {
    expect(engines).toContain('runtime capability facts');
    expect(engines).toContain('examples are advisory');
    expect(engines).toContain('does not grant worker dispatch authorization');
    expect(engines).not.toContain('Claude Code reality');
    expect(engines).not.toContain('Codex specifically');
  });

  test('shipping requires separate commit and outward landing authorization', () => {
    expect(shipping).toContain('commit_authorization');
    expect(shipping).toContain('landing_authorization');
    expect(shipping).toContain('verified handoff');
    expect(shipping).toMatch(/Return-to-Caller.*never commits.*pushes.*opens a PR/is);
    expect(shipping).toMatch(/no commit authorization.*uncommitted/is);
    expect(shipping).toMatch(/no landing authorization.*do not push.*do not open a PR/is);
  });
});
