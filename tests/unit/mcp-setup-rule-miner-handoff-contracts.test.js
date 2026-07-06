'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..', '..');

function read(relativePath) {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');
}

describe('spec-mcp-setup rule-miner handoff contract', () => {
  test('prepares CodeGraph and Graphify before suggesting spec-rule-miner as a separate follow-up', () => {
    const setupSkill = read('skills/spec-mcp-setup/SKILL.md');

    expect(setupSkill).toContain('After CodeGraph/Graphify readiness is prepared');
    expect(setupSkill).toContain('recommend `spec-rule-miner` as a next step');
    expect(setupSkill).toContain('no automatic `spec-rule-miner` invocation');
    expect(setupSkill).toContain('If CodeGraph/Graphify readiness is ready or degraded-but-usable');
    expect(setupSkill).toContain('must not call `spec-rule-miner` automatically');
    expect(setupSkill).toContain('must not invoke rule mining, synthesize rules, or write `docs/ai/project-rules.md`');
    expect(setupSkill).toContain('invoke `spec-rule-miner`, synthesize project rules, or write `docs/ai/project-rules.md`');
  });
});
