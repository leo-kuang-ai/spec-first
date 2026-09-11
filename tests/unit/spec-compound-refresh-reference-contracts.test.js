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
      'publication.md',
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

  test('preserves evidence gaps and blocks dependent destructive work', () => {
    const classify = read('skills/spec-compound-refresh/references/classify.md');
    const modes = read('skills/spec-compound-refresh/references/modes.md');
    const report = read('skills/spec-compound-refresh/references/report.md');
    const scope = read('skills/spec-compound-refresh/references/scope.md');
    expect(classify).toContain('Unverifiable is not false');
    expect(classify).toContain('Topical overlap is not coverage');
    expect(classify).toContain('never edit a skill, runbook, or root instruction file');
    expect(classify).toContain('all four conditions must hold');
    expect(modes).toContain('Splits are always recommend-only');
    expect(modes).toMatch(/failed successor write never permits deleting the original/);
    expect(report).toContain('recommend-only work even when all attempted writes succeeded');
    expect(scope).toMatch(/READMEs are excluded only as review candidates/);
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

  test('implementation conflict cannot silently replace independently supported guidance', () => {
    const skill = read('skills/spec-compound-refresh/SKILL.md');
    const investigate = read('skills/spec-compound-refresh/references/investigate.md');
    const classify = read('skills/spec-compound-refresh/references/classify.md');
    expect(skill).not.toContain('If the code changed, the doc should match');
    expect(investigate).not.toContain('the learning is actively misleading. Classify as Replace');
    expect(classify).toContain('independent evidence');
    expect(classify).toContain('potential implementation regression');
  });

  test('refresh routes every mutation through candidate publication before reporting applied work', () => {
    const skill = read('skills/spec-compound-refresh/SKILL.md');
    const flows = read('skills/spec-compound-refresh/references/per-action-flows.md');
    expect(skill).toContain('references/publication.md');
    expect(flows).toContain('references/publication.md');
    const publication = read('skills/spec-compound-refresh/references/publication.md');
    expect(publication).toContain('existence/SHA-256');
    expect(publication).toContain('validate-frontmatter.py" --promotion <candidate-path>');
    expect(publication).toContain('--repo-root <target-repo> --target-path <final-learning-path>');
    expect(publication.indexOf('## Validate Candidates')).toBeLessThan(publication.indexOf('## Publish'));
    expect(publication).toContain('partial publication');
    expect(publication).toMatch(/not a multi-file\s+transaction/);
    expect(flows).not.toContain('The orchestrator writes the new tracked learning');
  });

  test('replacement and split preserve successor identity and inbound content', () => {
    const flows = read('skills/spec-compound-refresh/references/per-action-flows.md');
    expect(flows).toContain('Same-path Replace');
    expect(flows).toContain('never enqueue that path for deletion');
    expect(flows).toContain('Different-path Replace');
    expect(flows).toContain('each citation to the successor that contains its referenced content');
    expect(flows).toContain('exactly one catalog row');
    expect(flows).toContain('outgoing relative links');
  });

  test('scoped vocabulary maintenance cannot become a full sweep or hide folds', () => {
    const concepts = read('skills/spec-compound-refresh/references/concepts-vocabulary.md');
    const report = read('skills/spec-compound-refresh/references/report.md');
    expect(concepts).not.toContain('The full sweep is appropriate here because refresh is an audit');
    expect(concepts).toContain('private candidate');
    expect(concepts).toContain('out-of-scope entries unchanged');
    expect(report).toContain('N folded');
    expect(report).toContain('N retired');
  });

  test('worth audit requires positive recovery evidence and a distinct write decision', () => {
    const skill = read('skills/spec-compound-refresh/SKILL.md');
    expect(skill).toContain('references/worth-audit.md');
    const worth = read('skills/spec-compound-refresh/references/worth-audit.md');
    expect(worth).toContain('recommended-only');
    expect(worth).toContain('quoted reasoning');
    expect(worth).toContain('Substantive inbound citations');
    expect(worth).toContain('references/publication.md');
    expect(read('skills/spec-compound-refresh/references/report.md')).toContain('Worth lens:');
  });

  test('explicit non-interactive glossary bootstrap does not widen into solutions maintenance', () => {
    const modes = read('skills/spec-compound-refresh/references/modes.md');
    expect(modes.includes('default to the refresh cycle')).toBe(false);
    expect(modes).toContain('In every mode, an explicit');
    expect(modes).toContain('skip learning discovery and classification');
    expect(modes).toContain('existing docs/solutions/ does not change this route');
    expect(modes).toContain('references/publication.md');
  });
});
