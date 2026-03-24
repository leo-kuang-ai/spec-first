import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const SYNC_ROOT = join(import.meta.dirname, '../../skills/16-sync');
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

  it('should keep sync truth source aligned with its reference rules', () => {
    const skill = read(SKILL_MD);
    const rules = readFileSync(join(SYNC_ROOT, 'references/sync-rules.md'), 'utf-8');

    expect(skill).toContain('当前阶段产物、验证证据与 findings');
    expect(rules).toContain('当前阶段产物与验证证据');
    expect(skill).not.toContain('spec-first rfc list');
    expect(rules).toContain('不依赖独立 `RFC` 列表作为状态真源');
  });
});
