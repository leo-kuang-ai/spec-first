import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '../../skills/spec-first');
const README = join(ROOT, 'README.md');

describe('v2 flow governance', () => {
  it('uses review instead of code-review', () => {
    expect(existsSync(join(ROOT, '08-review', 'SKILL.md'))).toBe(true);
    expect(existsSync(join(ROOT, '08-code-review', 'SKILL.md'))).toBe(false);
  });

  it('removes independent 09-test skill', () => {
    expect(existsSync(join(ROOT, '09-test', 'SKILL.md'))).toBe(false);
  });

  it('removes split feature skills', () => {
    expect(existsSync(join(ROOT, '17-feature', 'SKILL.md'))).toBe(true);
    expect(existsSync(join(ROOT, '17-feature-list', 'SKILL.md'))).toBe(false);
    expect(existsSync(join(ROOT, '18-feature-switch', 'SKILL.md'))).toBe(false);
    expect(existsSync(join(ROOT, '19-feature-current', 'SKILL.md'))).toBe(false);
  });

  it('documents canonical stage flow and command flow', () => {
    const content = readFileSync(README, 'utf-8');
    expect(content).toContain('05_verify → 06_wrap_up → 07_release → 08_done');
    expect(content).toContain('verify → archive → golive → done');
  });

  it('removes legacy /spec-first:test references from core docs', () => {
    const readme = readFileSync(join(ROOT, 'README.md'), 'utf-8');
    const verify = readFileSync(join(ROOT, '12-verify', 'SKILL.md'), 'utf-8');
    const status = readFileSync(join(ROOT, '14-status', 'SKILL.md'), 'utf-8');
    expect(readme).not.toContain('/spec-first:test');
    expect(verify).not.toContain('/spec-first:test');
    expect(status).not.toContain('/spec-first:test');
  });
});
