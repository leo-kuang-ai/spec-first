'use strict';

const fs = require('node:fs');

const read = (filePath) => fs.readFileSync(filePath, 'utf8');

describe('spec-commit-push-pr context reference contract', () => {
  test('keeps context probes and consequential rechecks in a required-read reference', () => {
    const skill = read('skills/spec-commit-push-pr/SKILL.md');
    const context = read('skills/spec-commit-push-pr/references/context.md');
    const commit = read('skills/spec-commit-push-pr/references/commit-and-push.md');
    const compose = read('skills/spec-commit-push-pr/references/compose.md');

    expect(skill).toContain('Read `references/context.md` before Step 1');
    expect(skill).toContain('Read `references/commit-and-push.md`');
    expect(skill).toContain('`references/compose.md`');
    expect(context).toContain('exit-0 `[]` means none; non-zero is unknown');
    expect(context).toContain('Pass the branch name only');
    expect(context.toLowerCase()).toContain('re-check the live branch');
    expect(commit).toContain('Never use `git add -A` or `git add .`');
    expect(commit).toContain('commit_authorization: authorized');
    expect(compose).toContain('Classify evidence by runtime purpose');
    expect(compose).toContain('`--body-file`');
  });

  test('requires apply-time identity, body read-back, and scoped commit semantics', () => {
    const skill = read('skills/spec-commit-push-pr/SKILL.md');
    const context = read('skills/spec-commit-push-pr/references/context.md');
    const commit = read('skills/spec-commit-push-pr/references/commit-and-push.md');
    const apply = read('skills/spec-commit-push-pr/references/apply-and-handoff.md');
    expect(skill).toContain('Read `references/apply-and-handoff.md` before any PR or archive write');
    expect(context).toContain('Do not take index 0');
    expect(context).toContain('do not assume `main`');
    expect(commit).toMatch(/does not preserve hunk\s+selection/);
    expect(commit).toContain('git commit -F <message-file> -- <owned-file-1> <owned-file-2>');
    expect(apply).toContain('Non-zero, malformed, or ambiguous results block creation');
    expect(apply).toContain('Identical content is a no-op');
    expect(apply).toContain('verify that the remote title/body match the intended content');
    expect(apply).toContain('query the\nPR state before any retry');
    expect(apply).toContain('`spec-explain` skill and the concept as input');
    expect(apply).toContain('do not invent a command entrypoint for a standalone skill');
  });
});
