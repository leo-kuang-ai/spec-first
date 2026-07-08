'use strict';

const fs = require('node:fs');
const path = require('node:path');

const PROOF_SKILL_PATH = path.join(__dirname, '..', '..', 'skills', 'spec-proof', 'SKILL.md');
const HITL_REVIEW_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-proof',
  'references',
  'hitl-review.md',
);

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

describe('Proof skill API resilience contract', () => {
  test('shared doc reads and HITL ingest avoid broad mark reads', () => {
    const skill = read(PROOF_SKILL_PATH);
    const hitl = read(HITL_REVIEW_PATH);

    expect(skill).toContain('Accept: application/json');
    expect(skill).toContain('Accept: text/markdown');
    expect(skill).toContain('/state?kinds=comment');
    expect(skill).toContain('state.marks` is a union of comments, suggestions, and provenance/authorship marks');

    expect(hitl).toContain('GET /api/agent/{slug}/state?kinds=comment');
    expect(hitl).toContain('`kind` is `comment`');
    expect(hitl).toContain('non-comment marks');
    expect(hitl).not.toContain('GET /api/agent/{slug}/state\nHeaders: x-share-token: <token>');
  });

  test('HITL replies batch existing-thread mutations instead of parallelizing separate resolve calls', () => {
    const hitl = read(HITL_REVIEW_PATH);

    expect(hitl).toContain('Batch thread replies and resolves');
    expect(hitl).toContain('`comment.reply` accepts `resolve: true`');
    expect(hitl).toContain('{"type":"comment.reply","markId":"<id-1>","text":"Updated the terminology.","resolve":true}');
    expect(hitl).toContain('Only include existing-thread comment mutations in a batch');
    expect(hitl).not.toContain('Parallelize independent thread ops');
  });

  test('content edits prefer narrow edit/v2 operations over whole-doc rewrites', () => {
    const combined = [read(PROOF_SKILL_PATH), read(HITL_REVIEW_PATH)].join('\n');

    expect(combined).toContain('Edit Strategy: Avoid Whole-Doc Rewrite');
    expect(combined).toContain('find_replace_in_doc');
    expect(combined).toContain('/edit/v2?dryRun=1');
    expect(combined).toContain('/edit/v2?return=minimal');
    expect(combined).toContain('Default: `/edit/v2` for agent-applied content changes');
    expect(combined).toContain('rewrite.apply` only as a last resort');
    expect(combined).not.toContain('Default: `suggestion.add` with `status: "accepted"`');
  });

  test('baseToken and idempotency guidance stays spec-first attributed and retry-safe', () => {
    const combined = [read(PROOF_SKILL_PATH), read(HITL_REVIEW_PATH)].join('\n');

    expect(combined).toContain('update it from successful mutation responses (`.mutationBase.token`)');
    expect(combined).toContain('Successful mutation responses include the next `mutationBase.token`');
    expect(combined).toContain('Use the same key only when resending the exact same serialized request body');
    expect(combined).toContain('IDEMPOTENCY_KEY_REUSED');
    expect(combined).toContain('X-Agent-Id: ai:spec-first');
    expect(combined).toContain('by: "ai:spec-first"');
    expect(combined).toContain('These values are fixed for HITL review');
    expect(combined).toContain('callers pass source path, title, and recommended next step, but they do not override identity');
    expect(combined).toContain('Agent identity is fixed, not a parameter');
    expect(combined).toContain('Callers do not override this');
    expect(combined).not.toContain('may pass a different `identity` pair');
    expect(combined).not.toContain('identity stays uniform unless a caller explicitly overrides it');
    expect(combined).not.toContain('ai:compound-engineering');
    expect(combined).not.toContain('Compound Engineering');
    expect(combined).not.toContain('X-Agent-Id: claude');
  });
});
