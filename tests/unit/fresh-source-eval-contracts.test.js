'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..', '..');
const CHECKLIST_PATH = path.join(REPO_ROOT, 'docs', 'contracts', 'workflows', 'fresh-source-eval-checklist.md');
const SOURCE_RUNTIME_BOUNDARY_PATH = path.join(REPO_ROOT, 'docs', 'contracts', 'source-runtime-customization-boundary.md');
const AGENTS_PATH = path.join(REPO_ROOT, 'AGENTS.md');
const CLAUDE_PATH = path.join(REPO_ROOT, 'CLAUDE.md');

describe('fresh-source eval checklist contract', () => {
  test('documents source-first semantic eval without relying on cached runtime mirrors', () => {
    const checklist = fs.readFileSync(CHECKLIST_PATH, 'utf8');
    const agents = fs.readFileSync(AGENTS_PATH, 'utf8');
    const claude = fs.readFileSync(CLAUDE_PATH, 'utf8');

    expect(checklist).toContain('checks the current source files on disk');
    expect(checklist).toContain('not runtime mirrors or definitions cached by the current session');
    expect(checklist).toContain('It must not treat `.claude/`, `.codex/`, or `.agents/skills/` as source.');
    expect(checklist).toContain('If the current host lacks a dispatch primitive, the runtime cannot call it, or the user explicitly disabled helper agents, do not fake a fresh reviewer.');
    expect(checklist).toContain('Record `fresh_source_eval: not_run` with the reason.');
    expect(checklist).toContain('Do not claim fresh-source eval passed.');
    expect(checklist).toContain('Do not validate changed skill prose by invoking the same typed skill in the current session');
    expect(checklist).toContain('Do not use the checklist to require subagent dispatch when the host lacks a dispatch primitive or the user explicitly disabled helper agents.');
    expect(checklist).toContain('deterministic_vs_semantic_boundary');
    expect(checklist).toContain('## Cadence');
    expect(checklist).toContain('passed`: a fresh read-only reviewer or equivalent fresh source review actually ran');
    expect(checklist).toContain('concerns');
    expect(checklist).toContain('not_run');
    expect(checklist).toContain('N/A');
    expect(checklist).toContain('not a deterministic CI gate');
    expect(checklist).toContain('Do not require PRs to pass a model judge in CI.');

    for (const entryDoc of [agents, claude]) {
      expect(entryDoc).toContain('docs/contracts/workflows/fresh-source-eval-checklist.md');
      expect(entryDoc).toContain('如果宿主缺少 dispatch primitive、runtime 无法调用，或用户显式禁用 helper agents，必须记录未执行原因，不能声称通过。');
    }
  });

  test('source-runtime boundary exposes advisory fresh-source status with N/A', () => {
    const boundary = fs.readFileSync(SOURCE_RUNTIME_BOUNDARY_PATH, 'utf8');

    expect(boundary).toContain('Fresh-source eval: passed | concerns | not_run | N/A');
    expect(boundary).toContain('Runtime impact');
    expect(boundary).toContain('N/A');
  });
});
