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
      'skills/spec-commit/SKILL.md',
      'skills/spec-compound/SKILL.md',
      'skills/spec-ideate/SKILL.md',
      'skills/spec-plan/SKILL.md',
      'skills/spec-product-pulse/SKILL.md',
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

  test('routes plan execution through spec-work as the recommended layered entry', () => {
    const plan = read('skills/spec-plan/SKILL.md');
    const handoff = read('skills/spec-plan/references/plan-handoff.md');
    const work = read('skills/spec-work/SKILL.md');

    expect(work).toContain('first pick the **engine** that runs implementation');
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

  test('keeps Claude Fable elevation as an intentional upstream divergence', () => {
    const plan = read('skills/spec-plan/SKILL.md');
    const brainstorm = read('skills/spec-brainstorm/SKILL.md');
    const setup = read('skills/spec-mcp-setup/references/config-template.yaml');

    expect(fs.existsSync('skills/spec-plan/references/reasoning-elevation.md')).toBe(false);
    expect(fs.existsSync('skills/spec-brainstorm/references/reasoning-elevation.md')).toBe(false);
    expect(plan).not.toContain('Fable');
    expect(brainstorm).not.toContain('Fable');
    expect(setup).toContain('work_delegate: codex');
    expect(setup).not.toContain('plan_use_fable');
    expect(setup).not.toContain('brainstorm_use_fable');
  });
});
