'use strict';

const fs = require('node:fs');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

describe('spec-compound-refresh CE reference migration contracts', () => {
  test('entrypoint delegates phase mechanics to required-read references', () => {
    const skill = read('skills/spec-compound-refresh/SKILL.md');
    for (const reference of [
      'modes.md',
      'scope.md',
      'investigate.md',
      'classify.md',
      'concepts-vocabulary.md',
      'report.md',
      'commit.md',
      'discoverability.md',
    ]) {
      expect(fs.existsSync(`skills/spec-compound-refresh/references/${reference}`)).toBe(true);
      expect(skill).toContain(`references/${reference}`);
    }
    expect(skill).toContain('mode:non-interactive');
    expect(skill).toContain('commit_reason: commit_authorization_missing');
    expect(skill).toContain('without landing authorization');
  });

  test('migrated references preserve current-source and safety boundaries', () => {
    const modes = read('skills/spec-compound-refresh/references/modes.md');
    const investigate = read('skills/spec-compound-refresh/references/investigate.md');
    const classify = read('skills/spec-compound-refresh/references/classify.md');
    const concepts = read('skills/spec-compound-refresh/references/concepts-vocabulary.md');
    const report = read('skills/spec-compound-refresh/references/report.md');
    const commit = read('skills/spec-compound-refresh/references/commit.md');
    const discoverability = read('skills/spec-compound-refresh/references/discoverability.md');

    expect(modes).toContain('mode:non-interactive');
    expect(modes).toContain('mutation_authorization');
    expect(investigate).toContain('current codebase');
    expect(investigate).toContain('guidance file');
    expect(classify).toContain('Auto-delete only when all three hold');
    expect(concepts).toContain('Vocabulary capture during a refresh');
    expect(report).toContain('Applied');
    expect(report).toContain('Recommended');
    expect(commit).toContain('Stage only compound-refresh-owned verified paths');
    expect(discoverability).toContain('Discoverability recommendation');
  });
});
