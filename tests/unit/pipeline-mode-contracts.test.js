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
    expect(skill).toContain('archive_authorization: authorized');
    expect(skill).toContain('config, teaching-section eligibility, commit authority, and landing authority do not');
    expect(skill).toContain('show the exact repo-relative');
    expect(skill).toContain('docs/explainers/YYYY-MM-DD-<concept-slug>.md');
    expect(skill).toContain('New concepts: <name>[, <name>]');
    expect(skill).toContain('Run spec-explain <name> to go deeper.');
    expect(writingReference).toContain('## Step B2: Judge new concepts');
    expect(writingReference).toContain('## New concepts');
    expect(writingReference).toContain('Check each candidate against the base ref, never the working tree');
    expect(writingReference).toContain('Description-only and description-update runs never write repo files.');
    expect(writingReference).toMatch(/New concepts section[\s\S]*Evidence block[\s\S]*Spec-First footer/);
    expect(writingReference).not.toContain('img.shields.io');
    expect(writingReference).not.toContain('MODEL_SLUG');
    expect(skill).not.toContain('/ce-explain');
    expect(skill).not.toContain('.compound-engineering/config.local.yaml');
    expect(writingReference).not.toContain('Compound Engineering badge');
  });

  test('spec-lfg passes explicit commit and landing authority instead of treating mode:pipeline as permission', () => {
    const helper = read('skills/spec-commit-push-pr/SKILL.md');
    const lfg = read('skills/spec-lfg/SKILL.md');
    const landingStep = lfg.match(/8\. Invoke the `spec-commit-push-pr`[\s\S]*?\n9\./);

    expect(landingStep).not.toBeNull();
    expect(landingStep[0]).toContain('commit_authorization: authorized');
    expect(landingStep[0]).toContain('landing_authorization: authorized');
    expect(landingStep[0]).toContain('authorization_source: current-user-explicit-spec-lfg');
    expect(landingStep[0]).toContain('authorization_scope: pipeline-owned paths and the current branch PR');
    expect(landingStep[0]).toContain('`mode:pipeline` only selects unattended execution and never grants authority');
    expect(lfg).not.toContain('它不授权任意 worker dispatch、实现 mutation、commit、push、PR');
    expect(helper).toContain('workflow invocation does not authorize commit, push, or PR creation');
  });

  test('spec-test-browser keeps pipeline unattended and preserves caller-owned server boundaries', () => {
    const skill = read('skills/spec-test-browser/SKILL.md');
    const pipelineReference = read('skills/spec-test-browser/references/pipeline-orchestration.md');

    expect(skill).toContain('argument-hint: "[PR number, branch name, \'current\'] [mode:pipeline] [target-origin:<origin>]"');
    expect(pipelineReference).toContain('不暂停等待');
    expect(pipelineReference).toContain('failure-handling prompt');
    expect(pipelineReference).toContain('caller-owned server');
    expect(pipelineReference).toContain('target-origin-missing');
    expect(pipelineReference).toContain('navigation/interaction subprocess 为 0');
    expect(pipelineReference).toContain('browser-mutation-authorization-required');
    expect(pipelineReference).not.toMatch(/Starting dev server|bin\/dev >|rails server -p|npm run dev >/);
    expect(skill).not.toMatch(/Starting dev server|Auto-start in pipeline|bin\/dev >|rails server -p|npm run dev >/);
    expect(skill).toContain('caller-owned server');
    expect(skill).toContain('workflow-level loud convention');
    expect(skill).not.toContain('browser_runtime_profile_path');
    expect(skill).not.toContain('dev-server-run-context.cjs');
  });
});
