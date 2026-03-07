import { describe, it, expect } from 'vitest';
import {
  DELIVERY_ROUTE,
  PRIMARY_STAGE_SKILL,
  RELEASE_REQUIRED_ARTIFACTS,
  REMOVED_SKILLS,
} from '../../src/core/rules/truth-source.js';

describe('truth source governance', () => {
  it('defines canonical primary stage routing for v2 flow', () => {
    expect(PRIMARY_STAGE_SKILL['00_init']).toBe('init');
    expect(PRIMARY_STAGE_SKILL['01_specify']).toBe('spec');
    expect(PRIMARY_STAGE_SKILL['02_design']).toBe('design');
    expect(PRIMARY_STAGE_SKILL['03_plan']).toBe('task');
    expect(PRIMARY_STAGE_SKILL['04_implement']).toBe('code');
    expect(PRIMARY_STAGE_SKILL['05_verify']).toBe('verify');
    expect(PRIMARY_STAGE_SKILL['06_wrap_up']).toBe('archive');
    expect(PRIMARY_STAGE_SKILL['07_release']).toBe('golive');
  });

  it('tracks removed legacy skills explicitly', () => {
    expect(REMOVED_SKILLS).toEqual(expect.arrayContaining([
      'code-review',
      'test',
      'feature-list',
      'feature-switch',
      'feature-current',
    ]));
    expect(REMOVED_SKILLS).not.toContain('review');
    expect(REMOVED_SKILLS).not.toContain('feature');
  });

  it('defines canonical delivery route and release evidence', () => {
    expect(DELIVERY_ROUTE.slice(-4)).toEqual([
      { stage: '05_verify', command: 'verify', route: 'skill' },
      { stage: '06_wrap_up', command: 'archive', route: 'skill' },
      { stage: '07_release', command: 'golive', route: 'runtime' },
      { stage: '08_done', command: 'done', route: 'runtime' },
    ]);
    expect(RELEASE_REQUIRED_ARTIFACTS).toEqual([
      'reports/smoke-test-report.md',
      'reports/release-note.md',
    ]);
  });
});
