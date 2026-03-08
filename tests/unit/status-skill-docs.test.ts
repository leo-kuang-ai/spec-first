import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const STATUS_ROOT = join(import.meta.dirname, '../../skills/spec-first/14-status');
const SKILL_MD = join(STATUS_ROOT, 'SKILL.md');
const DASHBOARD = join(STATUS_ROOT, 'references/status-dashboard-template.md');

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('14-status skill docs consistency', () => {
  it('should display background_input_status and source layers', () => {
    expect(existsSync(SKILL_MD)).toBe(true);
    expect(existsSync(DASHBOARD)).toBe(true);

    const skill = read(SKILL_MD);
    const dashboard = read(DASHBOARD);

    expect(skill).toContain('background_input_status');
    expect(skill).toContain('runtime 真源');
    expect(dashboard).toContain('background_input_status');
    expect(dashboard).toContain('docs 投影视图');
  });

  it('should distinguish runtime truth source from docs projection state', () => {
    const skill = read(SKILL_MD);
    const dashboard = read(DASHBOARD);

    expect(skill).toContain('docs 投影视图');
    expect(dashboard).toContain('runtime 真源');
    expect(dashboard).toContain('同步状态');
  });
});
