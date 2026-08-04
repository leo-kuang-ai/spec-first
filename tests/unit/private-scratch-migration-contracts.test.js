'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');
const deletedOwners = [
  'spec-brainstorm', 'spec-code-review', 'spec-compound', 'spec-debug', 'spec-explain',
  'spec-ideate', 'spec-optimize', 'spec-plan', 'spec-pov',
];
const durable = [
  'skills/spec-ideate/SKILL.md',
  'skills/spec-ideate/references/post-ideation-workflow.md',
  'skills/spec-ideate/references/universal-ideation.md',
  'skills/spec-ideate/references/web-research-cache.md',
  'skills/spec-sweep/references/interview.md',
];
const ephemeral = [
  'skills/spec-brainstorm/SKILL.md',
  'skills/spec-brainstorm/references/handoff.md',
  'skills/spec-brainstorm/references/universal-brainstorming.md',
  'skills/spec-compound/SKILL.md',
  'skills/spec-compound/references/agents/session-historian.md',
  'skills/spec-explain/SKILL.md',
  'skills/spec-plan/references/universal-planning.md',
  'skills/spec-pov/SKILL.md',
  'skills/spec-sweep/SKILL.md',
];

describe('private scratch migration', () => {
  test('all 32 baseline source files have exactly one migration class', () => {
    expect(deletedOwners.length * 2 + durable.length + ephemeral.length).toBe(32);
    expect(new Set([...durable, ...ephemeral]).size).toBe(durable.length + ephemeral.length);
  });

  test('retired cache files are absent', () => {
    for (const owner of deletedOwners) {
      expect(exists(`skills/${owner}/references/repo-profile-cache.md`)).toBe(false);
      expect(exists(`skills/${owner}/scripts/repo-profile-cache.py`)).toBe(false);
    }
  });

  test('durable migrations no longer use fixed temp roots or temp-only recovery', () => {
    const sources = durable.map(read).join('\n');
    expect(sources).not.toContain('/tmp/spec-first');
    expect(sources).toContain('.spec-first/workflows/spec-ideate/');
    expect(sources).toContain('.spec-first/workflows/spec-sweep/');
    expect(sources).toMatch(/user-selected durable destination/i);
    expect(sources).toMatch(/never reused by another invocation|no later invocation may depend/i);
  });

  test('ephemeral owners use private scratch and keep durable evidence elsewhere', () => {
    const sources = ephemeral.map(read).join('\n');
    expect(sources).not.toContain('/tmp/spec-first');
    expect(sources).toMatch(/umask 077/);
    expect(sources).toMatch(/mktemp/);
    expect(sources).toMatch(/non-symlink|\[ ! -L/);
    expect(sources).toMatch(/atomic/);
    expect(sources).toMatch(/never the only durable|not the durable|not the only recoverable/i);
  });
});

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}
