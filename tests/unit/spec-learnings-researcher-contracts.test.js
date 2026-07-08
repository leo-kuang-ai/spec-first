'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..', '..');
const LEARNINGS_AGENT = path.join(
  REPO_ROOT,
  'skills/spec-plan/references/agents/learnings-researcher.md',
);

describe('spec learnings researcher contracts', () => {
  test('uses CONCEPTS.md as optional advisory vocabulary for learning search', () => {
    const text = fs.readFileSync(LEARNINGS_AGENT, 'utf8');

    expect(text).toContain('Step 0: Ground In CONCEPTS.md If Present');
    expect(text).toContain('repo-root `CONCEPTS.md` exists');
    expect(text).toContain('repo-local advisory vocabulary');
    expect(text).toContain('project-specific terms, named workflow concepts, artifact types');
    expect(text).toContain('ground keyword extraction in Step 1');
    expect(text).toContain('distill findings with the current project\'s terminology');
    expect(text).toContain('`CONCEPTS.md` is not a source-of-truth override.');
    expect(text).toContain('Direct source reads, current plans, checked-in contracts, user decisions, and deterministic command results win');
    expect(text).toContain('If `CONCEPTS.md` does not exist, skip this step entirely and proceed to Step 1.');
    expect(text).toContain('Past learnings are advisory until checked against current source and task scope.');
    expect(text).not.toContain('ce-learnings-researcher');
    expect(text).not.toContain('/ce-compound');
  });
});
