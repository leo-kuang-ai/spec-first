'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { getAdapter } = require('../../src/cli/adapters');
const SPEC_PLAN_PATH = path.join(__dirname, '..', '..', 'skills', 'spec-plan', 'SKILL.md');
const SPEC_PLAN_PLANNING_FLOW_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-plan',
  'references',
  'planning-flow.md',
);

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-runtime-plan-'));
}

describe('runtime plan contracts', () => {
  test('Claude runtime sync plan writes managed hook scripts with executable mode', () => {
    const projectRoot = makeTempDir();

    try {
      const adapter = getAdapter('claude');
      const plan = adapter.planRuntimeFilesSync(projectRoot);
      const sessionStart = plan.operations.find((operation) => operation.path === '.claude/hooks/session-start');
      const specPlanGuard = plan.operations.find((operation) => operation.path === '.claude/hooks/spec-plan-guard');
      const prdPrewriteGuard = plan.operations.find((operation) => operation.path === '.claude/hooks/prd-prewrite-guard');
      const prdReadinessGuard = plan.operations.find((operation) => operation.path === '.claude/hooks/prd-readiness-guard');

      expect(plan.operations).toHaveLength(4);
      expect(sessionStart).toMatchObject({
        kind: 'write_file',
        path: '.claude/hooks/session-start',
        reason: 'managed_runtime_hook',
        mode: 0o755,
      });
      expect(specPlanGuard).toMatchObject({
        kind: 'write_file',
        path: '.claude/hooks/spec-plan-guard',
        reason: 'managed_runtime_hook',
        mode: 0o755,
      });
      expect(prdPrewriteGuard).toMatchObject({
        kind: 'write_file',
        path: '.claude/hooks/prd-prewrite-guard',
        reason: 'managed_runtime_hook',
        mode: 0o755,
      });
      expect(prdReadinessGuard).toMatchObject({
        kind: 'write_file',
        path: '.claude/hooks/prd-readiness-guard',
        reason: 'managed_runtime_hook',
        mode: 0o755,
      });
      expect(typeof sessionStart.contents).toBe('string');
      expect(sessionStart.contents).toContain('using-spec-first SessionStart injection');
      expect(sessionStart.contents).toContain('startup-reminder');
      expect(sessionStart.contents).toContain('--claude');
      expect(sessionStart.contents).toContain('process.execPath');
      expect(sessionStart.contents).toContain(path.join(__dirname, '..', '..', 'bin', 'spec-first.js'));
      expect(sessionStart.contents).not.toContain("spawnSync('spec-first'");
      expect(sessionStart.contents).not.toContain('const SPEC_FIRST_CLI_PATH = "__SPEC_FIRST_CLI_PATH__";');
      expect(specPlanGuard.contents).toContain('UserPromptExpansion');
      expect(specPlanGuard.contents).toContain('additionalContext');
      expect(specPlanGuard.contents).toContain('planning-only attention guard');
      expect(specPlanGuard.contents).toContain("fs.readFileSync(0, 'utf8')");
      expect(specPlanGuard.contents).not.toContain('SPEC_FIRST_HOOK_INPUT');
      expect(specPlanGuard.contents).not.toContain('"decision"');
      expect(prdPrewriteGuard.contents).toContain("['Write', 'Edit', 'MultiEdit']");
      expect(prdPrewriteGuard.contents).toContain('PRD prewrite guard blocked ${toolName}');
      expect(prdPrewriteGuard.contents).toContain('reconstruction_status: degraded');
      expect(prdPrewriteGuard.contents).toContain('write_mode: checkpoint-prd');
      expect(prdPrewriteGuard.contents).toContain('check-prd-artifact.js');
      expect(prdReadinessGuard.contents).toContain('PRD readiness guard blocked closeout');
      expect(prdReadinessGuard.contents).toContain('finalize-prd-artifact.js');
      expect(prdReadinessGuard.contents).toContain("decision: 'block'");
      expect(plan.summary).toEqual({ write_file: 4 });
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('Claude runtime sync plan switches to update_file when the hook already exists', () => {
    const projectRoot = makeTempDir();
    const hookPath = path.join(projectRoot, '.claude', 'hooks', 'session-start');

    try {
      fs.mkdirSync(path.dirname(hookPath), { recursive: true });
      fs.writeFileSync(hookPath, '#!/bin/bash\n', 'utf8');

      const adapter = getAdapter('claude');
      const plan = adapter.planRuntimeFilesSync(projectRoot);

      expect(plan.operations).toHaveLength(4);
      expect(plan.operations.find((operation) => operation.path === '.claude/hooks/session-start').kind).toBe('update_file');
      expect(plan.operations.find((operation) => operation.path === '.claude/hooks/spec-plan-guard').kind).toBe('write_file');
      expect(plan.operations.find((operation) => operation.path === '.claude/hooks/prd-prewrite-guard').kind).toBe('write_file');
      expect(plan.operations.find((operation) => operation.path === '.claude/hooks/prd-readiness-guard').kind).toBe('write_file');
      expect(plan.summary).toEqual({ update_file: 1, write_file: 3 });
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('Claude runtime removal plan removes managed hook scripts', () => {
    const adapter = getAdapter('claude');
    const plan = adapter.planRuntimeFilesRemoval('/tmp/unused');

    expect(plan.operations).toEqual([
      {
        kind: 'remove_file',
        path: '.claude/hooks/session-start',
        reason: 'managed_runtime_hook',
      },
      {
        kind: 'remove_file',
        path: '.claude/hooks/spec-plan-guard',
        reason: 'managed_runtime_hook',
      },
      {
        kind: 'remove_file',
        path: '.claude/hooks/prd-prewrite-guard',
        reason: 'managed_runtime_hook',
      },
      {
        kind: 'remove_file',
        path: '.claude/hooks/prd-readiness-guard',
        reason: 'managed_runtime_hook',
      },
    ]);
    expect(plan.summary).toEqual({ remove_file: 4 });
  });

  test('Codex runtime plans retain legacy cleanup while adding SessionStart hook assets', () => {
    const adapter = getAdapter('codex');
    const expectedCleanupPaths = [
      '.codex/commands/spec',
      '.codex/spec-first/commands',
      '.agents/plugins',
      'plugins/spec',
      'plugins/spec-first',
    ];

    const syncPlan = adapter.planRuntimeFilesSync('/tmp/unused');
    const syncCleanupOps = syncPlan.operations.filter((entry) => entry.reason === 'managed_runtime_cleanup'
      || entry.reason === 'legacy_codex_spec_first_skill_cleanup');
    expect(expectedCleanupPaths.every((expectedPath) =>
      syncCleanupOps.some((entry) => entry.path === expectedPath)
    )).toBe(true);
    expect(syncCleanupOps.some((entry) => entry.path === '.codex/skills/work')).toBe(true);
    expect(syncPlan.operations.slice(-3).map((entry) => entry.path)).toEqual([
      '.codex/hooks/session-start',
      '.codex/hooks/session-start.cmd',
      '.codex/hooks.json',
    ]);
    expect(syncCleanupOps.every((entry) => entry.kind === 'remove_dir')).toBe(true);
    expect(syncPlan.operations.slice(-3).map((entry) => entry.kind)).toEqual(['write_file', 'write_file', 'write_file']);
    expect(syncPlan.summary).toEqual({ remove_dir: syncCleanupOps.length, write_file: 3 });

    const removalPlan = adapter.planRuntimeFilesRemoval('/tmp/unused');
    const removalCleanupOps = removalPlan.operations.filter((entry) => entry.reason === 'managed_runtime_cleanup'
      || entry.reason === 'legacy_codex_spec_first_skill_cleanup');
    expect(expectedCleanupPaths.every((expectedPath) =>
      removalCleanupOps.some((entry) => entry.path === expectedPath)
    )).toBe(true);
    expect(removalCleanupOps.some((entry) => entry.path === '.codex/skills/work')).toBe(true);
    expect(removalPlan.operations.slice(-3).map((entry) => entry.path)).toEqual([
      '.codex/hooks/session-start',
      '.codex/hooks/session-start.cmd',
      '.codex/hooks.json',
    ]);
    expect(removalCleanupOps.every((entry) => entry.kind === 'remove_dir')).toBe(true);
    expect(removalPlan.operations.slice(-3).map((entry) => entry.kind)).toEqual(['remove_file', 'remove_file', 'remove_file']);
    expect(removalPlan.summary).toEqual({ remove_dir: removalCleanupOps.length, remove_file: 3 });
  });

  test('Codex-rendered spec-plan preserves research dispatch semantics', () => {
    const adapter = getAdapter('codex');
    const renderedSkill = adapter.transformSkillContent(fs.readFileSync(SPEC_PLAN_PATH, 'utf8'), {
      skillName: 'spec-plan',
      isWorkflowSkill: true,
    });
    const renderedPlanningFlow = adapter.transformSkillContent(fs.readFileSync(SPEC_PLAN_PLANNING_FLOW_PATH, 'utf8'), {
      skillName: 'spec-plan',
      isWorkflowSkill: true,
    });
    const combined = `${renderedSkill}\n${renderedPlanningFlow}`;

    expect(renderedSkill).toContain('read `.agents/skills/spec-plan/references/planning-flow.md`');
    expect(combined).toContain('dispatch authorization is present for this run');
    expect(combined).toContain('a public `$spec-plan` invocation authorizes the workflow itself; it does not by itself authorize `spawn_agent`');
    expect(combined).toContain('record `dispatch_authorization_missing`');
    expect(combined).toContain('explicit fallback');
    expect(combined).toContain('Plan generation must still complete when research dispatch is unavailable');
    expect(combined).toContain('`.codex/agents/spec-repo-research-analyst.agent.md`');
    expect(combined).toContain('`.codex/agents/spec-learnings-researcher.agent.md`');
    expect(combined).not.toContain('including `spawn_agent` where provided');
    expect(combined).not.toContain('Do not downgrade solely because the host is Codex.');
    expect(combined).not.toContain('Read `.codex/agents/spec-repo-research-analyst.agent.md` and apply that agent profile to');
    expect(combined).not.toContain('Read `.codex/agents/spec-learnings-researcher.agent.md` and apply that agent profile to');
  });

  test('legacy Task shorthand renders as Codex dispatch with explicit inline fallback', () => {
    const adapter = getAdapter('codex');
    const rendered = adapter.transformSkillContent(
      '- Task spec-repo-research-analyst(Scope: technology, architecture, patterns.)',
      {
        skillName: 'spec-plan',
        isWorkflowSkill: true,
      },
    );

    expect(rendered).toContain('Dispatch `.codex/agents/spec-repo-research-analyst.agent.md` with `spawn_agent`');
    expect(rendered).toContain('fallback: read the profile and apply it inline in the current agent only when `spawn_agent` is unavailable, explicitly disabled, or unsafe');
    expect(rendered).not.toContain('when `spawn_agent` is unavailable or explicitly disabled');
    expect(rendered).toContain('Task: Scope: technology, architecture, patterns.');
    expect(rendered).not.toContain('Read `.codex/agents/spec-repo-research-analyst.agent.md` and apply that agent profile to');
  });

});
