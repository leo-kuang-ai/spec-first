'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..', '..');
const SKILL_PATH = path.join(REPO_ROOT, 'skills', 'spec-commit-push-pr', 'SKILL.md');
const PR_DESCRIPTION_SKILL_PATH = path.join(REPO_ROOT, 'skills', 'spec-pr-description', 'SKILL.md');
const PR_DESCRIPTION_COMMAND_PATH = path.join(REPO_ROOT, 'templates', 'claude', 'commands', 'spec', 'pr-description.md');
const WRITING_REFERENCE_PATH = path.join(
  REPO_ROOT,
  'skills',
  'spec-commit-push-pr',
  'references',
  'pr-description-writing.md',
);
const BRANCH_CREATION_REFERENCE_PATH = path.join(
  REPO_ROOT,
  'skills',
  'spec-commit-push-pr',
  'references',
  'branch-creation.md',
);

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

describe('spec-commit-push-pr PR description contracts', () => {
  test('description-only intent does not run commit or push gates', () => {
    const text = read(SKILL_PATH);

    expect(text).toContain('"write a PR description"');
    expect(text).toContain('"draft a PR description"');
    expect(text).toContain('"refresh the PR description"');
    expect(text).toContain('"describe this PR"');
    expect(text).toContain('generate a description without touching git state');
    expect(text).toContain('Description-only generation');
    expect(text).toContain('skip Steps 4-5 AND Step 1\'s decision tree');
    expect(text).toContain('pass it to Step 6 as the PR ref so Pre-A resolves the right commit range');
    expect(text).toContain('Print the result back to the user');
  });

  test('keeps PR description writing inside spec-commit-push-pr after CE deletion', () => {
    const text = read(SKILL_PATH);
    const reference = read(WRITING_REFERENCE_PATH);

    expect(text).toContain('**Read `references/pr-description-writing.md` once now**');
    expect(text).toContain('the core principle at the top governs every step');
    expect(text).toContain('Run Step Pre-A from the reference');
    expect(text).toContain('Step 6 walks through it in order (Pre-A through H)');
    expect(text).toContain('the Spec-First badge');
    expect(text).toContain('BODY_FILE=$(mktemp "${TMPDIR:-/tmp}/spec-pr-body.XXXXXX")');
    expect(text).toContain('Use the platform\'s file-write tool to write the composed body markdown to `$BODY_FILE` verbatim.');
    expect(text).toContain('test -s "$BODY_FILE"');
    expect(text).toContain('PR body placeholder was not replaced');
    expect(text).toContain('gh pr view "$PR_URL" --json body --jq \'.body\'');
    expect(text).toContain('gh pr view --json body --jq \'.body\'');
    expect(text).toContain('gh pr create --title "<TITLE>" --body-file "$BODY_FILE"');
    expect(text).toContain('gh pr edit --title "<TITLE>" --body-file "$BODY_FILE"');
    expect(text).not.toContain('--body "$(cat "$BODY_FILE")"');
    expect(text).toContain('evidence capture is not available in this workflow');
    expect(reference).toContain('## Step Pre-A: Resolve the PR commit range and diff');
    expect(reference).toContain('Spec-First badge');
    expect(reference).toContain('Built_with-Spec_First');
    expect(text).not.toContain('ce-pr-description');
    expect(text).not.toContain('spec-pr-description');
    expect(text).not.toContain('__CE_PR_BODY_END__');
    expect(text).not.toContain('__SPEC_PR_BODY_END__');
    expect(text).not.toContain('ce-pr-body');
    expect(text).not.toContain('ce-demo-reel');
    expect(reference).not.toContain('ce-commit-push-pr');
    expect(reference).not.toContain('Compound Engineering');
    expect(reference).not.toContain('ce-demo-reel');
    expect(text).not.toContain('ask_user` in Gemini');
    expect(text).not.toContain('ask_user` in Pi');
    expect(text).not.toContain('Compound Engineering badge');
  });

  test('PR description writing leads with value and user-visible bug before-after', () => {
    const reference = read(WRITING_REFERENCE_PATH);

    expect(reference).toContain('## Core principle');
    expect(reference).toContain('The diff is already visible on GitHub.');
    expect(reference).toContain('Cut any sentence a reader could reconstruct from the diff itself.');
    expect(reference).toContain('If the lead sentence describes what was moved, renamed, or added rather than what is now possible or fixed, rewrite it.');
    expect(reference).toContain('For user-facing bugs, run an extra before/after pass before writing the mechanism');
    expect(reference).toContain('name what the user would have seen before and what they now see instead');
    expect(reference).toContain('Only then mention the technical cause or fix');
    expect(reference).not.toContain('Adds `evidence-decider.ts`');
  });

  test('creates feature branches from an explicit fresh-base decision flow', () => {
    const text = read(SKILL_PATH);
    const reference = read(BRANCH_CREATION_REFERENCE_PATH);

    expect(fs.existsSync(BRANCH_CREATION_REFERENCE_PATH)).toBe(true);
    expect(text).toContain('Read `references/branch-creation.md` and follow its decision flow');
    expect(text).toContain('If yes, read `references/branch-creation.md`, follow its decision flow, then continue from Step 5');
    expect(reference).toContain('git check-ref-format --branch "$BASE"');
    expect(reference).toContain('git check-ref-format --branch "$BRANCH_NAME"');
    expect(reference).toContain('git fetch --no-tags origin "$BASE"');
    expect(reference).toContain('Stale-base contamination');
    expect(reference).toContain('Forgot-to-branch');
    expect(reference).toContain('git log "origin/$BASE"..HEAD --oneline');
    expect(reference).toContain('Carry forward');
    expect(reference).toContain('Leave on `<base>`');
    expect(reference).toContain('git stash push -u -m "spec-commit-push-pr: pre-branch $BRANCH_NAME"');
    expect(reference).toContain('git stash pop');
    expect(reference).toContain('Do not attempt to auto-resolve conflicts');
    expect(reference).toContain('Do not silently branch from local HEAD.');
    expect(reference).toContain('explicitly request a local-HEAD branch after acknowledging base freshness was not verified');
    expect(reference).toContain('git checkout -b "$BRANCH_NAME" HEAD');
    expect(reference).toContain('base freshness was not verified');
    expect(reference).not.toContain('git checkout -b <branch-name>');
  });

  test('applies PR bodies only through explicit body files', () => {
    const text = read(SKILL_PATH);
    const commandBlocks = Array.from(text.matchAll(/```(?:bash)?\n([\s\S]*?)```/g))
      .map((match) => match[1])
      .join('\n');

    expect(text).toContain('gh pr create --title "<TITLE>" --body-file "$BODY_FILE"');
    expect(text).toContain('gh pr edit --title "<TITLE>" --body-file "$BODY_FILE"');
    expect(text).toContain('Never use `--body-file -`, stdin pipes, heredoc-to-stdin, or `--body "$(cat ...)"`');
    expect(text).toContain('Do not embed the body in a shell heredoc');
    expect(text).toContain('PR body was empty after create');
    expect(text).toContain('PR body was empty after edit');
    expect(commandBlocks).not.toContain('--body "$(cat "$BODY_FILE")"');
    expect(commandBlocks).not.toContain('--body-file -');
    expect(commandBlocks).not.toContain('__SPEC_PR_BODY_END__');
    expect(commandBlocks).not.toMatch(/\|\s*gh pr (create|edit)\b/);
  });

  test('badge model slug examples URL-encode literal parentheses', () => {
    const reference = read(WRITING_REFERENCE_PATH);

    expect(reference).toContain('Opus_4.6_%281M,_Extended_Thinking%29');
    expect(reference).toContain('Sonnet_4.6_%28200K%29');
    expect(reference).not.toContain('Opus_4.6_(1M,_Extended_Thinking)');
    expect(reference).not.toContain('Sonnet_4.6_(200K)');
  });

  test('standalone spec-pr-description workflow is removed', () => {
    expect(fs.existsSync(PR_DESCRIPTION_SKILL_PATH)).toBe(false);
    expect(fs.existsSync(PR_DESCRIPTION_COMMAND_PATH)).toBe(false);
  });
});
