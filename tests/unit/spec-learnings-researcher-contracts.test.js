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

    expect(text).toContain('Step 0: Ground in CONCEPTS.md (if present)');
    expect(text).toContain('check whether `CONCEPTS.md` exists at the repo root');
    expect(text).toContain('shared vocabulary');
    expect(text).toContain('domain entities, named processes, status concepts');
    expect(text).toContain('ground keyword extraction (Step 1)');
    expect(text).toContain('distill findings using the project\'s actual terminology');
    expect(text).toContain('Research agents can be confidently wrong');
    expect(text).toContain('never let a past learning silently override present evidence');
    expect(text).toContain('If `CONCEPTS.md` does not exist, skip this step entirely and proceed to Step 1.');
    expect(text).toContain('never let a past learning silently override present evidence');
    expect(text).not.toContain('ce-learnings-researcher');
    expect(text).not.toContain('/ce-compound');
  });
});
