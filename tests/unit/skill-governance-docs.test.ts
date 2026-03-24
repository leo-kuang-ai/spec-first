import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '../../skills');

function read(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf-8');
}

describe('project-level skill governance docs', () => {
  it('should not leave unresolved date placeholders in core docs', () => {
    const files = ['README.md', 'SHARED.md', '14-status/SKILL.md', 'AGENTS.md'];

    for (const file of files) {
      expect(read(file), file).not.toContain('{{DATE}}');
    }
  });

  it('should document shared execution model as default template with explicit exceptions', () => {
    const shared = read('SHARED.md');

    expect(shared).toContain('默认模板');
    expect(shared).toContain('例外');
    expect(shared).toContain('路由控制型');
    expect(shared).toContain('宿主修复型');
  });

  it('should document project-level discovery governance in README', () => {
    const readme = read('README.md');

    expect(readme).toContain('Discovery Governance');
    expect(readme).toContain('spec-first:*');
    expect(readme).toContain('Use when...');
    expect(readme).toContain('description');
  });

  it('should document where shared contracts must be declared inside skills', () => {
    const shared = read('SHARED.md');

    expect(shared).toContain('声明位置约定');
    expect(shared).toContain('confirm_policy');
    expect(shared).toContain('Skill 类型与确认策略');
    expect(shared).toContain('最小示例');
  });
});
