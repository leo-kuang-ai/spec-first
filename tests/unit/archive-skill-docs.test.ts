import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ARCHIVE_ROOT = join(import.meta.dirname, '../../skills/spec-first/10-archive');
const SKILL_MD = join(ARCHIVE_ROOT, 'SKILL.md');
const RETRO_TEMPLATE = join(ARCHIVE_ROOT, 'references/retro-template.md');

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('10-archive skill docs consistency', () => {
  it('should keep retro template file and link from SKILL.md', () => {
    expect(existsSync(SKILL_MD)).toBe(true);
    expect(existsSync(RETRO_TEMPLATE)).toBe(true);
    expect(read(SKILL_MD)).toContain('references/retro-template.md');
  });

  it('should keep coverage metrics wording aligned with current implementation', () => {
    const retro = read(RETRO_TEMPLATE);
    expect(retro).toContain('C1: Design Coverage');
    expect(retro).toContain('C2: API Coverage');
    expect(retro).toContain('FR → DS（当前实现与 C1 同口径）');
    expect(retro).toContain('C3: Task Coverage');
    expect(retro).toContain('C4: Test Coverage (FR)');
    expect(retro).toContain('C5: Test Coverage (AC)');
    expect(retro).toContain('FR → TC（当前实现暂与 C4 同口径）');
  });

  it('should keep break-loop five-dimension sections in retro template', () => {
    const retro = read(RETRO_TEMPLATE);
    expect(retro).toContain('## 三、5 维度失败分析');
    expect(retro).toContain('### 3.1 根因分类');
    expect(retro).toContain('### 3.2 修复失败分析');
    expect(retro).toContain('### 3.3 预防机制');
    expect(retro).toContain('### 3.4 系统性扩展');
    expect(retro).toContain('### 3.5 知识捕获');
  });
});
