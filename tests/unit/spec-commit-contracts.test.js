'use strict';

const fs = require('node:fs');
const path = require('node:path');

const SKILL_PATH = path.join(__dirname, '..', '..', 'skills', 'spec-commit', 'SKILL.md');

describe('spec-commit default branch contract', () => {
  test('creates a feature branch before committing on the default branch', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('automatically create a feature branch before staging or committing');
    expect(text).toContain('Committing directly on the default branch is not an option in this workflow.');
    expect(text).toContain('create it from the current HEAD so uncommitted work and any local-only commits stay attached to the new branch');
    expect(text).toContain('git check-ref-format --branch "$BRANCH_NAME"');
    expect(text).toContain('git checkout -b "$BRANCH_NAME"');
    expect(text).toContain('git branch --show-current');
    expect(text).toContain('If branch creation still fails, stop before staging and report the failure; do not commit on the default branch.');

    expect(text).not.toContain('warn the user and ask whether to continue committing here or create a feature branch first');
  });

  test('preserves separated context reads and commit-message temp-file safety', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('Run these commands separately to gather context without interleaving unrelated output:');
    expect(text).toContain('COMMIT_MSG=$(mktemp "${TMPDIR:-/tmp}/spec-commit-message.XXXXXX")');
    expect(text).toContain('git commit -F "$COMMIT_MSG"');
    expect(text).toContain('stage specific files by name over `git add -A` or `git add .`');

    expect(text).not.toContain('printf \'=== STATUS ===\\n\'; git status;');
    expect(text).not.toContain('git add file1 file2 file3 && git commit -m "$(cat <<');
  });
});
