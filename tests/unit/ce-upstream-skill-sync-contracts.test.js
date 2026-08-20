'use strict';

const fs = require('node:fs');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

describe('CE upstream skill sync contracts', () => {
  test('keeps pre-resolved git commands shell-portable', () => {
    const files = [
      'skills/spec-brainstorm/SKILL.md',
      'skills/spec-commit-push-pr/SKILL.md',
      'skills/spec-compound/SKILL.md',
      'skills/spec-ideate/SKILL.md',
      'skills/spec-plan/SKILL.md',
      'skills/spec-sweep/SKILL.md',
    ];

    for (const file of files) {
      const preResolvedLines = read(file)
        .split('\n')
        .filter((line) => line.includes('!`git rev-parse'));

      expect(preResolvedLines.length).toBeGreaterThan(0);
      for (const line of preResolvedLines) {
        expect(line).not.toContain('2>/dev/null');
        expect(line).not.toContain('|| true');
        expect(line).not.toContain('|| echo');
      }
    }
  });

  test('gathers commit and product-pulse context at runtime without host pre-resolution', () => {
    const commit = read('skills/spec-commit/SKILL.md');
    const pulse = read('skills/spec-product-pulse/SKILL.md');

    expect(commit).toContain('each command as its own argv-style shell tool');
    expect(commit).toContain('Re-read the branch and staged paths immediately');
    expect(commit).not.toContain('!`git status`');
    expect(commit).not.toContain('Context fallback');
    expect(pulse).toContain('Resolve `<repo-root>` at runtime');
    expect(pulse).toContain('fixed `docs/pulse-reports/` contract');
    expect(pulse).not.toContain('!`git rev-parse');
  });

  test('routes plan execution through spec-work as the recommended layered entry', () => {
    const plan = read('skills/spec-plan/SKILL.md');
    const handoff = read('skills/spec-plan/references/plan-handoff.md');
    const work = read('skills/spec-work/SKILL.md');
    const engines = read('skills/spec-work/references/execution-engines.md');

    expect(work).toContain('[Execution engines](references/execution-engines.md)');
    expect(engines).toContain('The engine is chosen once');
    expect(engines).toContain('The engine decides *how* implementation runs; it never changes *who* owns the shipping tail');
    expect(plan).toContain('**Recommended marker:** `spec-work` (option 1) always carries *(recommended)*');
    expect(handoff).toContain('**Recommended marker:** `spec-work` (option 1) always carries *(recommended)*');
    expect(plan).not.toContain('**Recommended marker (dynamic):** Goal mode is the recommended default');
    expect(handoff).not.toContain('**Recommended marker (dynamic):** Goal mode is the recommended default');
  });

  test('fails document review before persona dispatch when paths are unreadable', () => {
    const review = read('skills/spec-doc-review/SKILL.md');

    expect(review).toContain('**Missing-document gate — verify before any dispatch.**');
    expect(review).toContain('If any path is unreadable, do not dispatch personas');
    expect(review).toContain('Review failed: document(s) not found on disk: <paths>');
    expect(review).toContain('`security-lens-reviewer`, `feasibility-reviewer`, `product-lens-reviewer`, `adversarial-document-reviewer`: inherit the parent model');
  });

  test('sizes PR descriptions by reviewer decision cost and runtime purpose', () => {
    const skill = read('skills/spec-commit-push-pr/SKILL.md');
    const writing = read('skills/spec-commit-push-pr/references/pr-description-writing.md');

    expect(writing).toContain('## Step D: Size by reviewer decision cost');
    expect(writing).toContain("name the change's **material claims**");
    expect(writing).toContain('Classify files by runtime purpose, not extension.');
    expect(writing).toContain('audit the body against the material claims from Step D');
    expect(skill).toContain('Classify by runtime purpose, not extension');
    expect(skill).toContain('ranking/scoring logic, deployment/config behavior');
  });

  test('replaces generic reviewer exhortations with checkable output criteria', () => {
    const exactCriteria = [
      'skills/spec-code-review/references/personas/deployment-verification-agent.md',
      'skills/spec-plan/references/agents/deployment-verification-agent.md',
    ];

    for (const file of exactCriteria) {
      expect(read(file)).toContain('Every checklist item must name the command or observable signal that proves the step succeeded.');
    }

    expect(read('skills/spec-plan/references/agents/data-integrity-guardian.md')).toContain('name the concrete integrity invariant, the failure path, and the verification or rollback');
    expect(read('skills/spec-plan/references/agents/security-sentinel.md')).toContain('Report only credible threat paths supported by the proposed surface');
    expect(read('skills/spec-compound/references/agents/best-practices-researcher.md')).toContain('Return only guidance that changes implementation, sequencing, or validation');
  });

  test('keeps compound mode selection local and session-history reads authorization-gated', () => {
    const compound = read('skills/spec-compound/SKILL.md');

    expect(compound).toContain('**Mode selection (Full vs Lightweight) — decide it, don\'t ask it.**');
    expect(compound).toContain('**Session history — an authorization-gated probe in Full mode.**');
    expect(compound).toContain('restricted_read_authorization_missing');
    expect(compound).toContain('do not inspect session roots or tool schemas');
    expect(compound).toContain('only when explicit restricted-read authorization exists');
    expect(compound).toContain('**Escalation gate.**');
    expect(compound).toContain('Ran Full mode.');
    expect(compound).toContain('does not present a "What\'s next?" menu');
    expect(compound).not.toContain('Full mode always runs the cheap discovery+metadata probe');
    expect(compound).not.toContain('automatic in Full mode');
    expect(compound).not.toContain('cheap discovery+metadata probe always runs');
    expect(compound).not.toContain('In Full mode it always runs as a two-stage probe');
    expect(compound).not.toContain('If the user chooses Full');
  });

  test('keeps Claude Fable elevation as an intentional upstream divergence', () => {
    const plan = read('skills/spec-plan/SKILL.md');
    const brainstorm = read('skills/spec-brainstorm/SKILL.md');
    const setup = read('skills/spec-runtime-setup/references/config-template.yaml');

    expect(fs.existsSync('skills/spec-plan/references/reasoning-elevation.md')).toBe(false);
    expect(fs.existsSync('skills/spec-brainstorm/references/reasoning-elevation.md')).toBe(false);
    expect(plan).not.toContain('Fable');
    expect(brainstorm).not.toContain('Fable');
    expect(setup).not.toContain('work_delegate: codex');
    expect(setup).not.toContain('plan_use_fable');
    expect(setup).not.toContain('brainstorm_use_fable');
  });
});
