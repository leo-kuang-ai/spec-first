'use strict';

const fs = require('node:fs');
const path = require('node:path');

const SKILL_PATH = path.join(__dirname, '..', '..', 'skills', 'spec-work', 'SKILL.md');

describe('spec-work CRG hook contract', () => {
  test('uses before-work and after-work anchors without Stage-0 fallback', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');
    expect(text).toContain('spec-first crg hook before-work --plan=<plan.md>');
    expect(text).toContain('spec-first crg hook before-work --task-pack=<tasks.md>');
    expect(text).toContain('spec-first crg workspace context');
    expect(text).toContain('require an explicit child repo choice');
    expect(text).toContain('decompose into explicit sequential repo-local work runs');
    expect(text).toContain('spec-first crg hook after-work --work-run=<id>');
    expect(text).toContain('Hook output is advisory context');
    expect(text).not.toContain('stage0-context');
    expect(text).not.toContain('selected_assets');
  });
});

describe('spec-work standards resolve contract', () => {
  test('consumes implement.jsonl from specs resolve without turning standards into a gate', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('Standards Resolve Anchors');
    expect(text).toContain('spec-first specs resolve --target=<repo> --task="<work task or plan summary>" --files="<planned or changed files>" --consumer spec-work --task-id=<task-or-plan-id>');
    expect(text).toContain('docs/specs/_index/specs-index.json');
    expect(text).toContain('generated `implement.jsonl`');
    expect(text).toContain('Do not read all of `docs/specs/**`');
    expect(text).toContain('Treat `metadata.hard_gate=false` as binding');
    expect(text).toContain('Missing standards never blocks work');
  });
});

describe('spec-work task-pack identity contract', () => {
  test('rejects missing or mismatched spec_id before creating execution tasks', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('read `spec_id` from the task pack and source plan');
    expect(text).toContain('If the task pack lacks `spec_id`, stop as missing identity');
    expect(text).toContain('reject the task pack as wrong-chain handoff before implementation');
    expect(text).toContain('missing-spec-id, spec-id-mismatch');
    expect(text).toContain('Do not treat it as execution state or completion status');
  });
});

describe('spec-work subagent isolation contract', () => {
  test('uses a host capability matrix instead of assuming shared-directory or worktree behavior', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('Host capability matrix');
    expect(text).toContain('Claude Code `Agent` with worktree isolation');
    expect(text).toContain('Pass `isolation: "worktree"` and `run_in_background: true`');
    expect(text).toContain('Codex `spawn_agent` / forked workspace');
    expect(text).toContain('Do not pass or claim Claude\'s `isolation: "worktree"` parameter');
    expect(text).toContain('If files overlap, dispatch serially');
    expect(text).toContain('Shared-directory fallback constraints');
    expect(text).toContain('worktree-isolated mode');
    expect(text).toContain('git worktree remove <absolute-path>');
    expect(text).toContain('Shared-directory fallback or Codex fork-workspace handoff');
  });
});
