'use strict';

const {
  EXCLUSION_COMPATIBILITY_DELTAS,
  PLATFORM_REGISTRY,
  compilePathRule,
  contentHasOtherRuntimePathReferences,
  deriveUnrewrittenPatterns,
  extractCandidateRuntimePaths,
} = require('../../src/cli/adapters/platform-registry');

describe('platform registry path-rule compiler', () => {
  test('declares ownership for every registered surface', () => {
    for (const [platformId, config] of Object.entries(PLATFORM_REGISTRY)) {
      expect(config.runtimeRoot).toEqual(expect.any(String));
      for (const [surfaceName, surface] of Object.entries(config.surfaces)) {
        expect(surface.ownership).toEqual(expect.any(String));
        expect(surface.path).toEqual(expect.any(String));
        expect(surfaceName).toEqual(expect.any(String));
      }
    }
  });

  test('compiles anchored file, dir, glob, and managed-slice rules', () => {
    const fileRule = compilePathRule({
      kind: 'file',
      path: '.cursor/mcp.json',
      ownership: 'host-local',
    });
    expect(fileRule.test('.cursor/mcp.json')).toBe(true);
    expect(fileRule.test('.cursor/mcp.json.bak')).toBe(false);

    const dirRule = compilePathRule({
      kind: 'dir',
      path: '.qoder/skills/',
      ownership: 'generated-runtime',
    });
    expect(dirRule.test('.qoder/skills/spec-work/SKILL.md')).toBe(true);
    expect(dirRule.test('.qoder/skills-backup/spec-work/SKILL.md')).toBe(false);

    const globRule = compilePathRule({
      kind: 'glob',
      path: '.qoder/commands/spec-*.md',
      ownership: 'generated-runtime',
    });
    expect(globRule.test('.qoder/commands/spec-work.md')).toBe(true);
    expect(globRule.test('.qoder/commands/spec/nested.md')).toBe(false);

    const sliceRule = compilePathRule({
      kind: 'managed-slice',
      path: '.qoder/settings.json',
      ownership: 'host-user-owned',
    });
    expect(sliceRule.test('.qoder/settings.json')).toBe(true);
    expect(sliceRule.test('.qoder/settings.local.json')).toBe(false);
  });

  test('rejects unsupported or underspecified surface rules', () => {
    expect(() => compilePathRule({ kind: 'socket', path: '.x', ownership: 'generated-runtime' }))
      .toThrow('Unsupported platform registry path rule kind');
    expect(() => compilePathRule({ kind: 'file', path: '.x' }))
      .toThrow('Platform registry path rule must declare ownership');
    expect(() => compilePathRule({ kind: 'file', path: '/absolute', ownership: 'generated-runtime' }))
      .toThrow('Platform registry path rule must be repo-relative');
  });

  test('derives other-host exclusions without including the target host', () => {
    const cursorPatterns = deriveUnrewrittenPatterns('cursor');

    expect(cursorPatterns.some((pattern) => pattern.test('.qoder/skills/spec-work/SKILL.md'))).toBe(true);
    expect(cursorPatterns.some((pattern) => pattern.test('.cursor/skills/spec-work/SKILL.md'))).toBe(false);
  });
});

describe('platform registry runtime path consumer', () => {
  test('extracts normalized candidate runtime paths before anchored matching', () => {
    expect(extractCandidateRuntimePaths([
      '`$HOME/.kiro/settings/mcp.json`,',
      'and ".qoder/commands/spec-work.md".',
      'same prefix .qoder/hooks/session-start-backup stays exact.',
    ].join(' '))).toEqual([
      '.kiro/settings/mcp.json',
      '.qoder/commands/spec-work.md',
      '.qoder/hooks/session-start-backup',
    ]);
  });

  test('flags non-Cursor runtime paths while preserving same-prefix hook negatives', () => {
    expect(contentHasOtherRuntimePathReferences('cursor', 'see `.claude/commands/spec/work.md`')).toBe(true);
    expect(contentHasOtherRuntimePathReferences('cursor', 'see `.qoder/settings.json`')).toBe(true);
    expect(contentHasOtherRuntimePathReferences('cursor', 'see `.qoder/hooks/session-start`')).toBe(true);
    expect(contentHasOtherRuntimePathReferences('cursor', 'see `.qoder/hooks/session-start-backup`')).toBe(false);
    expect(contentHasOtherRuntimePathReferences('cursor', 'see `.cursor/skills/spec-work/SKILL.md`')).toBe(false);
  });

  test('captures documented Kiro deltas from legacy asymmetry', () => {
    expect(contentHasOtherRuntimePathReferences('kiro', 'see `.cursor/agents/reviewer.agent.md`')).toBe(true);
    expect(contentHasOtherRuntimePathReferences('kiro', 'see `.qoder/settings.json`')).toBe(true);
    expect(contentHasOtherRuntimePathReferences('kiro', 'see `.qoder/commands/spec/legacy.md`')).toBe(true);
    expect(contentHasOtherRuntimePathReferences('kiro', 'see `.kiro/skills/spec-work/SKILL.md`')).toBe(false);
  });

  test('flags non-Qoder runtime paths without flagging Qoder runtime itself', () => {
    expect(contentHasOtherRuntimePathReferences('qoder', 'see `.cursor/mcp.json`')).toBe(true);
    expect(contentHasOtherRuntimePathReferences('qoder', 'see `.kiro/settings/mcp.json`')).toBe(true);
    expect(contentHasOtherRuntimePathReferences('qoder', 'see `.qoder/skills/spec-work/SKILL.md`')).toBe(false);
  });

  test('records explicit compatibility deltas instead of hiding changed coverage', () => {
    expect(EXCLUSION_COMPATIBILITY_DELTAS).toEqual(expect.arrayContaining([
      expect.objectContaining({
        platform: 'kiro',
        fixture: 'kiro-derived-cursor-agents',
        direction: 'widen',
      }),
      expect.objectContaining({
        platform: 'kiro',
        fixture: 'kiro-qoder-settings-json',
        direction: 'widen',
      }),
      expect.objectContaining({
        platform: 'all',
        fixture: 'qoder-managed-hooks-exact',
        direction: 'widen',
      }),
    ]));
  });
});
