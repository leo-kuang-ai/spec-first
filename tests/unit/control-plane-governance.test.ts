import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { extractFiveQuestions } from '../../src/core/ai-orchestrator/catchup-summary.js';

const ROOT = join(import.meta.dirname, '../../');

describe('control plane governance', () => {
  it('routes catchup next actions to archive and golive in late stages', () => {
    const wrap = extractFiveQuestions('FSREQ-20260307-AUTH-001', '06_wrap_up', undefined, '', []);
    expect(wrap.nextAction.answer).toBe('执行 /spec-first:archive');

    const release = extractFiveQuestions('FSREQ-20260307-AUTH-001', '07_release', undefined, '', []);
    expect(release.nextAction.answer).toBe('执行 spec-first golive check FSREQ-20260307-AUTH-001');
  });

  it('routes done stage to status-style confirmation instead of further advance', () => {
    const done = extractFiveQuestions('FSREQ-20260307-AUTH-001', '08_done', undefined, '', []);
    expect(done.nextAction.answer).toBe('执行 spec-first stage current FSREQ-20260307-AUTH-001 确认已完成状态');
  });

  it('keeps session-start routing table aligned with v2 commands', () => {
    const sessionHook = readFileSync(join(ROOT, 'src/core/tool-integration/session-hook.ts'), 'utf-8');
    expect(sessionHook).toContain('init→spec→design→task→code→review→verify→archive→feature→catchup');
    expect(sessionHook).not.toContain('/spec-first:test');
  });

  it('removes legacy split feature commands from control docs', () => {
    const docs = [
      readFileSync(join(ROOT, 'skills/spec-first/11-plan/SKILL.md'), 'utf-8'),
      readFileSync(join(ROOT, 'skills/spec-first/13-orchestrate/SKILL.md'), 'utf-8'),
      readFileSync(join(ROOT, 'skills/spec-first/14-status/SKILL.md'), 'utf-8'),
    ].join('\n');

    expect(docs).not.toContain('/spec-first:test');
    expect(docs).not.toContain('feature-list');
    expect(docs).not.toContain('feature-switch');
    expect(docs).not.toContain('feature-current');
  });
});
