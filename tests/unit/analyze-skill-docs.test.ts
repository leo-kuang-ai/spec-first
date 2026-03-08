import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ANALYZE_ROOT = join(import.meta.dirname, '../../skills/spec-first/21-analyze');
const SKILL_MD = join(ANALYZE_ROOT, 'SKILL.md');
const RULES = join(ANALYZE_ROOT, 'references/analysis-rules.md');

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('21-analyze skill docs consistency', () => {
  it('should include background input status in analysis scope', () => {
    expect(existsSync(SKILL_MD)).toBe(true);
    expect(existsSync(RULES)).toBe(true);

    const skill = read(SKILL_MD);
    const rules = read(RULES);

    expect(skill).toContain('background_input_status');
    expect(skill).toContain('背景质量');
    expect(rules).toContain('background_input_status');
  });

  it('should analyze runtime truth source and docs projection drift', () => {
    const skill = read(SKILL_MD);
    const rules = read(RULES);

    expect(skill).toContain('runtime 真源');
    expect(rules).toContain('docs 投影视图');
    expect(rules).toContain('漂移');
  });
});
