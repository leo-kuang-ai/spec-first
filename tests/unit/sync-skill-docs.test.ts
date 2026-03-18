import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const SYNC_ROOT = join(import.meta.dirname, '../../skills/spec-first/16-sync');
const SKILL_MD = join(SYNC_ROOT, 'SKILL.md');

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('16-sync skill docs consistency', () => {
  it('should declare first project cognition inputs for sync', () => {
    expect(existsSync(SKILL_MD)).toBe(true);
    const skill = read(SKILL_MD);

    expect(skill).toContain('First 项目认知资产接入');
    expect(skill).toContain('index.json');
    expect(skill).toContain('summary.json');
  });
});
