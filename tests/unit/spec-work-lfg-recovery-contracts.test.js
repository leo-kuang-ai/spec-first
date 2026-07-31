'use strict';

const fs = require('node:fs');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

describe('spec-work and LFG recovery contracts', () => {
  const workStrategy = read('skills/spec-work/references/execution-strategy.md');
  const workShipping = read('skills/spec-work/references/shipping-workflow.md');
  const worktree = read('skills/spec-worktree/SKILL.md');
  const lfg = read('skills/spec-lfg/SKILL.md');
  const watch = read('skills/spec-lfg/references/pr-watch-loop.md');
  const reviewFollowup = read('skills/spec-lfg/references/review-followup.md');
  const landing = read('skills/spec-commit-push-pr/SKILL.md');

  test('documents append-only recovery state and confirmed verification', () => {
    expect(workStrategy).toContain('state/<generation>.json');
    expect(workStrategy).toContain('expected_generation');
    expect(workStrategy).toContain('expected_sha256');
    expect(workStrategy).toContain('run-state-conflict');
    expect(workStrategy).toContain('run-source-drifted');
    expect(workShipping).toContain('append-only state contract');
    expect(workShipping).toContain('CAS conflict or source drift');
    expect(workStrategy).toMatch(/Only a confirmed result.*passed/is);
    expect(workStrategy).toMatch(/started.*unknown/is);
  });

  test('keeps worktree ownership with the caller', () => {
    expect(worktree).toContain('Governed callers are spec-dogfood and spec-work');
    expect(worktree).toContain('caller-owned isolation contract');
    expect(worktree).toMatch(/never selects an execution engine, dispatches a worker/i);
    expect(worktree).toMatch(/never selects an execution engine, dispatches a worker, stages, commits, pushes, opens a PR/i);
    expect(worktree).toContain('run-source-drifted');
  });

  test('returns a bounded watch handoff only in an authorized pipeline', () => {
    expect(landing).toContain('watch_handoff');
    expect(landing).toContain('Ordinary standalone and description-only runs do not start or recommend a watch by default');
    expect(landing).toContain('branch-currency-update-required');
    expect(lfg).toContain('spec-resolve-pr-feedback mode:pipeline-return');
    expect(lfg).toContain('spec-debug mode:pipeline-return');
    expect(reviewFollowup).toContain('re-read current source');
    expect(watch).toContain('looks ready — your call');
  });

  test('never grants destructive branch or merge authority', () => {
    for (const source of [lfg, watch, landing]) {
      expect(source).toMatch(/does not merge|never authorizes or performs merge|never merge authority/i);
      expect(source).toMatch(/force-push|force\/history rewrite/i);
      expect(source).toMatch(/rebase|history rewrite/i);
    }
    expect(landing).toContain('This handoff lets the pipeline owner');
    expect(landing).toContain('it grants no new authority');
  });
});
