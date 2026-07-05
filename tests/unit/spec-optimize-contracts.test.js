'use strict';

const fs = require('node:fs');
const path = require('node:path');

const SKILL_PATH = path.join(__dirname, '..', '..', 'skills', 'spec-optimize', 'SKILL.md');
const SCHEMA_PATH = path.join(__dirname, '..', '..', 'skills', 'spec-optimize', 'references', 'optimize-spec-schema.yaml');
const README_PATH = path.join(__dirname, '..', '..', 'skills', 'spec-optimize', 'README.md');

describe('spec-optimize host entrypoint contract', () => {
  test('post-completion options use current host workflow entrypoints', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('current host\'s code-review entrypoint');
    expect(text).toContain('current host\'s compound entrypoint');
    expect(text).not.toContain('**Run `/spec:code-review`**');
    expect(text).not.toContain('**Run `/spec:compound`**');
    expect(text).not.toContain('/spec:code-review` on Claude Code');
    expect(text).not.toContain('$spec-code-review` on Codex');
    expect(text).not.toContain('/spec:compound` on Claude Code');
    expect(text).not.toContain('$spec-compound` on Codex');
  });

  test('uses valid workflow scratch path and skill-relative helper scripts', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('mkdir -p .spec-first/workflows/spec-optimize/<spec-name>/');
    expect(text).not.toContain('.spec-first/workflowsspec-optimize');
    expect(text).toContain('Resolve `scripts/measure.sh`, `scripts/parallel-probe.sh`, and `scripts/experiment-worktree.sh` relative to this skill');
  });

  test('requires measurable goals and bounded first-run optimization budgets', () => {
    const skill = fs.readFileSync(SKILL_PATH, 'utf8');
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
    const readme = fs.readFileSync(README_PATH, 'utf8');

    expect(skill).toContain('Do not run `spec-optimize` as an expensive substitute for ordinary work.');
    expect(skill).toContain('A repeatable measurement target: `metric.primary.type`, `metric.primary.name`, and `metric.primary.direction`');
    expect(skill).toContain('At least one cheap degenerate gate');
    expect(skill).toContain('Explicit experiment budget: `stopping.max_iterations`, `stopping.max_hours`, and `stopping.plateau_iterations`');
    expect(skill).toContain('First-run specs should default to `execution.mode: serial`, `execution.max_concurrent: 1`, `stopping.max_iterations: 4`, `stopping.max_hours: 1`, `stopping.plateau_iterations: 3`, and `max_runner_up_merges_per_batch: 0`.');
    expect(skill).toContain('High-throughput settings are called out for explicit user approval before baseline');

    expect(schema).toContain('default: { mode: "serial", backend: "worktree", max_concurrent: 1 }');
    expect(schema).toContain('default: { max_iterations: 4, max_hours: 1, plateau_iterations: 3, target_reached: true }');
    expect(schema).toContain('default: 0');
    expect(schema).toContain('uncapped judge spend requires explicit user approval before baseline');

    expect(readme).toContain('Give every run an explicit experiment budget');
  });

  test('dispatch backends are optional and orchestrator-owned', () => {
    const skill = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(skill).toContain('Dispatch And Backend Boundary');
    expect(skill).toContain('Optimization dispatch is an optional capability');
    expect(skill).toContain('Serial local/worktree execution remains the safe fallback');
    expect(skill).toContain('Parallel experiments require explicit `execution.mode`, bounded `execution.max_concurrent`');
    expect(skill).toContain('Worktree-backed mutation happens in experiment worktrees');
    expect(skill).toContain('Codex delegation must fall back after repeated failures');
    expect(skill).toContain('The orchestrator owns final integration');
    expect(skill).toContain('selecting kept experiments, merging or cherry-picking winners, reverting non-winners');
    expect(skill).toContain('Codex failure cascade');
    expect(skill).toContain('After 3 consecutive failures, auto-disable Codex for remaining experiments and fall back to subagent dispatch.');
  });

  test('direct diagnostics can inform measurement but not own optimization decisions', () => {
    const skill = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(skill).toContain('Evidence Utilization Boundary');
    expect(skill).toContain('prior direct-read summaries, degraded reason counts, source-confirmed session evidence');
    expect(skill).toContain('The optimization target, metric, winner selection, mutable scope, and final integration remain owned by the approved optimization spec and measured results');
    expect(skill).toContain('not by an external tool');
    expect(skill).toContain('must not run external-tool refresh, hooks, watchers, or daemons');
  });

  test('Codex security schema prefers explicit sandbox wording while preserving compatibility values', () => {
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');

    expect(schema).toContain('full-auto');
    expect(schema).toContain('compatibility value; invoke explicit workspace-write sandbox with -s workspace-write');
    expect(schema).toContain('yolo');
    expect(schema).toContain('invoke --dangerously-bypass-approvals-and-sandbox');
    expect(schema).toContain('Workspace-write network access depends on the user\'s Codex config.');
    expect(schema).not.toContain('--full-auto');
    expect(schema).not.toContain('--yolo');
  });
});
