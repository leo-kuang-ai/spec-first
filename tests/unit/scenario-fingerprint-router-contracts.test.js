'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..', '..');
const USING_SPEC_FIRST = path.join(REPO_ROOT, 'skills', 'using-spec-first', 'SKILL.md');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function expectContainsAll(content, snippets) {
  for (const snippet of snippets) {
    expect(content).toContain(snippet);
  }
}

describe('scenario fingerprint router contract', () => {
  test('using-spec-first consumes scenario fingerprints as advisory routing facts in the lean source file', () => {
    const skill = read(USING_SPEC_FIRST);

    expectContainsAll(skill, [
      '## Scenario Fingerprints',
      '.spec-first/workspace/scenario-fingerprint.json',
      '.spec-first/workspace/scenario-fingerprint-setup.json',
      'advisory deterministic context',
      '不是 gate、approval 或 source scope authority',
      '不要为了创建 fingerprint 而从本 skill 运行 setup、clean、external-tool command 或 runtime regeneration',
    ]);
  });

  test('scenario guidance stays advisory and intent-first', () => {
    const skill = read(USING_SPEC_FIRST);

    expectContainsAll(skill, [
      'state_class=foreign-residual-workspace',
      'spec-first clean --workspace-orphans',
      '只有用户明确要删除时才使用 confirm 形态',
      'first-time git repo',
      '推荐 `spec-mcp-setup`',
      '只作为 blind spot disclosure',
      '重要结论仍要回源确认',
      '不要让 stale setup evidence 劫持当前意图',
    ]);
  });
});
