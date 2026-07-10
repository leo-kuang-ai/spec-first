'use strict';

const fs = require('node:fs');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

describe('pipeline mode contracts', () => {
  test('spec-commit-push-pr defines mode:pipeline as non-interactive', () => {
    const skill = read('skills/spec-commit-push-pr/SKILL.md');

    expect(skill).toContain('argument-hint: "[PR ref] [mode:pipeline] [archive:on|off]"');
    expect(skill).toMatch(/\*\*`mode:pipeline` modifier:\*\*[\s\S]*orchestrated callers such as `spec-lfg`/);
    expect(skill).toMatch(/\*\*`mode:pipeline` modifier:\*\*[\s\S]*suppress every blocking ask/);
    expect(skill).toMatch(/\*\*`mode:pipeline` modifier:\*\*[\s\S]*existing-PR rewrite question defaults to \*\*not rewriting\*\*/);
  });

  test('spec-commit-push-pr produces the New concepts trailer consumed by spec-lfg', () => {
    const skill = read('skills/spec-commit-push-pr/SKILL.md');
    const writingReference = read('skills/spec-commit-push-pr/references/pr-description-writing.md');
    const lfg = read('skills/spec-lfg/SKILL.md');

    expect(lfg).toContain('If it prints a `New concepts:` trailer after the PR URL');
    expect(lfg).toContain('run spec-explain <name> to go deeper');
    expect(skill).toContain('pr_teaching_section:');
    expect(skill).toContain('<repo-root>/.spec-first/config.local.yaml');
    expect(skill).toContain('pr_teaching_archive:');
    expect(skill).toContain('A per-run `archive:on|off` token overrides the archive key');
    expect(skill).toContain('docs/explainers/YYYY-MM-DD-<concept-slug>.md');
    expect(skill).toContain('New concepts: <name>[, <name>]');
    expect(skill).toContain('Run spec-explain <name> to go deeper.');
    expect(writingReference).toContain('## Step B2: Judge new concepts');
    expect(writingReference).toContain('## New concepts');
    expect(writingReference).toContain('Check each candidate against the base ref, never the working tree');
    expect(writingReference).toContain('Description-only and description-update runs never write repo files.');
    expect(writingReference).toMatch(/New concepts section[\s\S]*Evidence block[\s\S]*Spec-First badge/);
    expect(skill).not.toContain('/ce-explain');
    expect(skill).not.toContain('.compound-engineering/config.local.yaml');
    expect(writingReference).not.toContain('Compound Engineering badge');
  });

  test('spec-test-browser keeps pipeline mode unattended through human verification and failures', () => {
    const skill = read('skills/spec-test-browser/SKILL.md');
    const pipelineReference = read('skills/spec-test-browser/references/pipeline-orchestration.md');

    expect(skill).toContain('argument-hint: "[PR number, branch name, \'current\', --port PORT, or mode:pipeline]"');
    expect(pipelineReference).toContain('human verification pauses');
    expect(pipelineReference).toContain('failure-handling prompts');
    expect(skill).toMatch(/Human Verification \(When Required\)[\s\S]*\*\*Pipeline mode:\*\* do not pause; log each such flow as `Skip` with the reason and continue/);
    expect(skill).toMatch(/Handle Failures[\s\S]*\*\*pipeline mode:\*\* do not ask how to proceed; capture the error screenshot and repro steps, log the failure, and continue/);
  });
});
