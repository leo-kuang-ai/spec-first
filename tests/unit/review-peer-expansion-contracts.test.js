const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(repoRoot, file), 'utf8');

describe('review peer expansion contracts', () => {
  test('doc review owns one whole-document peer and the shared rendering floor', () => {
    const skill = read('skills/spec-doc-review/SKILL.md');
    const peer = read('skills/spec-doc-review/references/personas/whole-doc-reviewer.md');
    const floor = read('skills/spec-doc-review/references/rendering-floor.md');
    expect(skill).toContain('exactly one report-only whole-document peer');
    expect(skill).toContain('never carries `safe_auto` or mutation authority');
    expect(peer).toContain('entire document');
    expect(floor).toContain('Decision-first field order');
    for (const file of [
      'synthesis-and-presentation.md',
      'walkthrough.md',
      'bulk-preview.md',
      'review-output-template.md',
      'open-questions-defer.md',
    ]) {
      expect(read(`skills/spec-doc-review/references/${file}`))
        .toContain('references/rendering-floor.md');
    }
  });

  test('answered findings are withdrawn without turning staged Apply into durable rejection', () => {
    const walkthrough = read('skills/spec-doc-review/references/walkthrough.md');
    const preview = read('skills/spec-doc-review/references/bulk-preview.md');
    expect(walkthrough).toContain("Withdrawing findings the user's earlier answers resolved");
    expect(walkthrough).toContain('Apply-triggered withdrawal never carries forward');
    expect(preview).toContain('Withdrawal revalidation');
    expect(preview).toContain('Withdrawing (N):');
  });

  test('POV freezes a complete approach set and keeps peers non-voting', () => {
    const skill = read('skills/spec-pov/SKILL.md');
    const panel = read('skills/spec-pov/references/cross-model-panel.md');
    expect(skill).toContain('Freeze an explicit approach set');
    expect(skill).toContain('never decide by vote');
    expect(panel).toContain('peers are evidence, not votes');
    expect(panel).toContain('reject the framing or all candidates');
    expect(panel).toContain('starts no peer process');
  });

  test.each([
    'skills/spec-doc-review/scripts/cross-model-doc-review.sh',
    'skills/spec-pov/scripts/cross-model-pov.sh',
  ])('%s starts no peer job without explicit receipt arguments', (file) => {
    const temp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'spec-first-zero-peer-'));
    const env = {
      ...process.env,
      SPEC_FIRST_PEER_JOBS_ROOT: path.join(temp, 'jobs'),
    };
    const result = spawnSync('bash', [path.join(repoRoot, file), 'start'], {
      cwd: repoRoot,
      env,
      encoding: 'utf8',
    });
    expect(result.status).not.toBe(0);
    expect(fs.existsSync(env.SPEC_FIRST_PEER_JOBS_ROOT)).toBe(false);
    fs.rmSync(temp, { recursive: true, force: true });
  });
});
