'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('spec-work review consumer chain contracts', () => {
  const followup = read('skills/spec-work/references/review-findings-followup.md');
  const shipping = read('skills/spec-work/references/shipping-workflow.md');
  const tracker = read('skills/spec-work/references/tracker-defer.md');
  const lfgTracker = read('skills/spec-lfg/references/tracker-defer.md');
  const lfgSkill = read('skills/spec-lfg/SKILL.md');

  test('run-local consumers reuse the returned artifact_path and never guess a temp path', () => {
    for (const source of [followup, shipping, tracker]) {
      expect(source).toContain('artifact_path');
      expect(source).not.toContain('/tmp/spec-first/spec-code-review');
    }
    expect(followup).toMatch(/do not re-run the review/i);
    expect(followup).toContain('in-band JSON');
  });

  test('durable handoffs use materialized repo-local evidence or a structured summary', () => {
    expect(followup).toContain('session-temp');
    expect(shipping).toContain('repo-local review evidence');
    expect(tracker).toContain('structured finding summary');
    expect(tracker).toContain('must not link to a session-temp artifact_path');
  });

  test('required task review blocks dependent waves and reuses bounded followup output', () => {
    expect(followup).toContain('required task review');
    expect(followup).toContain('task-context:<path>');
    expect(followup).toContain('two review rounds total');
    expect(followup).toContain('affected verification');
    expect(followup).toContain('dependent wave');
  });

  test('shipping separates evidence authority from source binding and reconciles every required proof', () => {
    expect(shipping).toContain('## Required-Proof Reconciliation');
    expect(shipping).toContain('`transcribed`');
    expect(shipping).toContain('`provider-confirmed`');
    expect(shipping).toContain('`source-bound`');
    expect(shipping).toMatch(/source-bound.*不等于.*provider-confirmed/is);
    expect(shipping).toMatch(/全部 required proof intent.*result.*not applicable.*deferred.*unbound limitation/is);
    expect(shipping).toMatch(/完全遗漏.*阻断.*complete.*verified/is);
    expect(shipping).toMatch(/semantic exit gate.*不是.*schema.*hard enforcement/is);
    expect(shipping).toMatch(/authority.*source binding.*不写入.*verification-run-summary\.v1/is);
    expect(shipping).toContain('`claim_limitations`');
    expect(shipping).toContain('`verified_worktree_fingerprint`');
    expect(shipping).toContain('`spec-work-run-artifact/v2`');
  });

  test('keeps spec-work as the tracker-defer owner and projects one byte-identical LFG copy', () => {
    expect(tracker).toContain("Canonical owner: the `spec-work` package's co-located `references/tracker-defer.md` source");
    expect(tracker).toContain('package-local projection');
    expect(lfgTracker).toBe(tracker);
    expect(lfgSkill).toContain('Load `references/tracker-defer.md` in **non-interactive mode**');
    expect(lfgTracker).not.toContain('/tmp/spec-first/spec-code-review');
  });
});
