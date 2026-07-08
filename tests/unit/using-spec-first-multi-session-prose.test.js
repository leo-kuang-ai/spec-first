'use strict';

const fs = require('node:fs');
const path = require('node:path');

const SKILL_PATH = path.join(__dirname, '..', '..', 'skills', 'using-spec-first', 'SKILL.md');

describe('using-spec-first multi-session disclosure prose contract', () => {
  let body;

  beforeAll(() => {
    body = fs.readFileSync(SKILL_PATH, 'utf8');
  });

  test('contains a "Multi-Session Awareness" section after Scope Guards', () => {
    expect(body).toMatch(/## Multi-Session Awareness/);
    const scopeIdx = body.indexOf('## Scope Guards');
    const multiIdx = body.indexOf('## Multi-Session Awareness');
    const decisionIdx = body.indexOf('## Decision Output Contract');
    expect(scopeIdx).toBeGreaterThan(0);
    expect(multiIdx).toBeGreaterThan(scopeIdx);
    expect(decisionIdx).toBeGreaterThan(multiIdx);
  });

  test('references the opt-in CLI primitive for read-only check', () => {
    expect(body).toMatch(/spec-first session list/);
    expect(body).toMatch(/active_count/);
  });

  test('makes it explicit that the check is advisory and not a hard gate', () => {
    expect(body).toMatch(/never.*hard gate|advisory|不阻塞|不锁/);
    expect(body).toMatch(/Do not block|do not block|不要阻塞|do not auto-defer/);
  });

  test('points at the contract doc for protocol details', () => {
    expect(body).toMatch(/docs\/contracts\/sessions\/spec-first-session\.md/);
  });

  test('mentions spec-worktree as a stronger isolation alternative', () => {
    expect(body).toMatch(/spec-worktree/);
  });

  test('treats missing protocol or empty list as single-actor mode', () => {
    expect(body).toMatch(/single-actor mode|opt-in|register is opt-in/);
  });

  test('does not introduce a hard lock or required register call', () => {
    // 防止后续误改成强约束
    expect(body).not.toMatch(/必须\s*register|MUST register|required to register/);
    expect(body).not.toMatch(/lock\s+the worktree|hard lock/i);
  });
});
