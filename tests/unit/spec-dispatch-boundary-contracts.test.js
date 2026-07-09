'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { getAdapter } = require('../../src/cli/adapters');

const REPO_ROOT = path.join(__dirname, '..', '..');

function read(relativePath) {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');
}

function readMarkdownFiles(relativeDir) {
  const dir = path.join(REPO_ROOT, relativeDir);
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs.readdirSync(dir)
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => ({
      fileName,
      content: fs.readFileSync(path.join(dir, fileName), 'utf8'),
    }));
}

function stripSupersededDecisionSections(content) {
  return content.replace(/^## Superseded Decision[^\n]*\n[\s\S]*?(?=^## |$(?![\s\S]))/gm, '');
}

describe('CE-lineage dispatch boundary contracts', () => {
  test('audit matrix covers required dispatch-bearing skills with actions', () => {
    const matrix = read('docs/validation/2026-05-05-ce-dispatch-boundary-audit-matrix.md');
    const requiredSkills = [
      'spec-doc-review',
      'spec-code-review',
      'spec-plan',
      'spec-ideate',
      'spec-debug',
      'spec-optimize',
      'spec-resolve-pr-feedback',
      'spec-work',
      'spec-compound',
      'spec-compound-refresh',
      'spec-brainstorm',
    ];

    expect(matrix).toContain('CE Dispatch Boundary Audit Matrix');
    expect(matrix).toContain('CE is lineage evidence only');
    expect(matrix).toContain('Fixed Reference Quadrants');
    expect(matrix).toContain('repair_priority');
    expect(matrix).toContain('action');

    for (const skill of requiredSkills) {
      expect(matrix).toContain(skill);
    }
  });

  test('high-risk skills do not retain stale Codex anti-dispatch assumptions', () => {
    const combined = [
      'skills/spec-doc-review/SKILL.md',
      'skills/spec-code-review/SKILL.md',
      'skills/spec-plan/SKILL.md',
      'skills/spec-ideate/SKILL.md',
      'skills/spec-resolve-pr-feedback/SKILL.md',
      'skills/spec-work/SKILL.md',
      'skills/spec-optimize/SKILL.md',
    ].map(read).join('\n');

    expect(combined).not.toMatch(/Codex cannot dispatch/i);
    expect(combined).not.toMatch(/Codex does not support agents/i);
    expect(combined).not.toContain('do not call `spawn_agent` merely because this skill mentions reviewer personas');
    expect(combined).not.toMatch(/Codex should inline reviewer personas/i);
    expect(read('skills/using-spec-first/SKILL.md')).toContain('进入公开 workflow 只授权该 workflow 本身');
    expect(read('skills/using-spec-first/SKILL.md')).toContain('明示 subagents/personas/delegated/parallel/reviewer dispatch');
    expect(read('skills/using-spec-first/SKILL.md')).toContain('dispatch_authorization_missing');
  });

  test('dispatch-boundary durable learnings keep old admission model only as superseded provenance', () => {
    const docs = readMarkdownFiles('docs/solutions/workflow-issues')
      .filter(({ fileName, content }) => (
        fileName.includes('dispatch')
        || /\bdispatch\b|spawn_agent|subagent|sub-agent/i.test(content)
      ));
    const liveCombined = docs
      .map(({ fileName, content }) => `\n--- ${fileName} ---\n${stripSupersededDecisionSections(content)}`)
      .join('\n');
    const supersededLearning = read(
      'docs/solutions/workflow-issues/doc-review-codex-multi-agent-dispatch-boundary-2026-05-05.md',
    );

    expect(docs.length).toBeGreaterThan(0);
    expect(supersededLearning).toContain('## Superseded Decision (Historical Only)');
    expect(supersededLearning).toContain('fc3d43c1');
    expect(supersededLearning).toContain('2026-05-24');
    expect(supersededLearning).toContain('dispatch_authorization_missing');
    expect(supersededLearning).toContain('Public workflow invocation does not automatically authorize host-level `spawn_agent`.');
    expect(supersededLearning).toContain('String-based drift guards are a secondary backstop');
    expect(liveCombined).not.toMatch(/session authorization/i);
    expect(liveCombined).not.toContain('current session rules permit workflow-owned reviewer dispatch');
    expect(liveCombined).not.toContain('Codex dispatch is authorized');
    expect(liveCombined).not.toContain('unavailable or disallowed');
    expect(liveCombined).not.toContain('treat that invocation as admission for the documented persona-reviewer phase');
    expect(liveCombined).not.toContain('do not require another subagent confirmation');
  });

  test('dispatch planning docs do not reintroduce user-confirmation gates', () => {
    const docs = readMarkdownFiles('docs/plans')
      .filter(({ fileName, content }) => (
        fileName.includes('dispatch')
        || /\bdispatch\b|spawn_agent|subagent|sub-agent|reviewer subagents/i.test(content)
      ));
    const combined = docs.map(({ fileName, content }) => `\n--- ${fileName} ---\n${content}`).join('\n');

    expect(docs.length).toBeGreaterThan(0);
    expect(combined).not.toMatch(/session authorization/i);
    expect(combined).not.toMatch(/current session authorization/i);
    expect(combined).not.toContain('当前用户没有显式授权 reviewer subagents');
    expect(combined).not.toContain('因为当前用户没有显式授权 reviewer subagents');
    expect(combined).not.toContain('cannot dispatch because the user did not ask for subagents');
    expect(combined).not.toContain('Codex should inline reviewer personas');
    expect(combined).not.toContain('Codex cannot dispatch');
    expect(combined).not.toContain('when dispatch is authorized');
    expect(combined).not.toContain('unavailable or disallowed');
  });

  test('Codex runtime never silently rewrites legacy Task dispatch to inline-only profile application', () => {
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
    expect(rendered).not.toContain('Read `.codex/agents/spec-repo-research-analyst.agent.md` and apply that agent profile to');
  });

  test('mutating dispatch skills state isolation, serialization, and orchestrator ownership', () => {
    const resolveFeedback = read('skills/spec-resolve-pr-feedback/SKILL.md');
    const work = read('skills/spec-work/SKILL.md');
    const optimize = read('skills/spec-optimize/SKILL.md');

    expect(resolveFeedback).toContain('Mutating resolver dispatch boundary');
    expect(resolveFeedback).toContain('The orchestrator owns final integration');
    expect(resolveFeedback).toContain('serialize the affected units or stop for orchestration');

    expect(work).toContain('Parallel Safety Check');
    expect(work).toContain('Codex `spawn_agent` / forked workspace');
    expect(work).toContain('The orchestrator owns final integration, staging, commits, and project-level verification.');
    expect(work).toContain('Shared-directory fallback constraints');

    expect(optimize).toContain('Dispatch And Backend Boundary');
    expect(optimize).toContain('Serial local/worktree execution remains the safe fallback');
    expect(optimize).toContain('The orchestrator owns final integration');
  });

  test('phase 2 dispatch-bearing workflows reject hidden implement-check lifecycles', () => {
    const codeReview = read('skills/spec-code-review/SKILL.md');
    const plan = read('skills/spec-plan/SKILL.md');

    expect(plan).toContain('Planning may recommend later worker delegation, but it must not dispatch implementation workers or create a hidden implement/check lifecycle.');
    expect(plan).toContain('A worker is suitable only when the scope is clear, the write set can be bounded, verification commands are known, no product/architecture blocker remains, and no sensitive/security-critical ambiguity is unresolved.');
    expect(plan).toContain('Review autofix and mutation are off unless a documented workflow mode or explicit user choice authorizes them.');

    expect(`${codeReview}\n${plan}`).not.toMatch(/always[- ]on worker delegation/i);
    expect(`${codeReview}\n${plan}`).not.toMatch(/hidden implementation worker/i);
  });
});
