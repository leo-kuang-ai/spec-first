'use strict';

const {
  EXCLUSION_COMPATIBILITY_DELTAS,
  PLATFORM_REGISTRY,
  compilePathRule,
  contentHasOtherRuntimePathReferences,
  deriveUnrewrittenPatterns,
  extractCandidateRuntimePaths,
} = require('../../src/cli/adapters/platform-registry');

const LEGACY_UNREWRITTEN_PATH_PATTERNS = {
  cursor: [
    /\.claude\/commands\/spec\/[a-z-]+\.md/,
    /\.claude\/commands\/spec-[a-z-]+\.md/,
    /\.claude\/commands\/spec-\*\.md/,
    /\.claude\/spec-first\/workflows\//,
    /\.claude\/skills\//,
    /\.claude\/agents\//,
    /\.codex\/commands\/spec\/[a-z-]+\.md/,
    /\.codex\/commands\/spec-\*\.md/,
    /\.codex\/skills\//,
    /\.codex\/agents\//,
    /\.agents\/skills\//,
    /\.kiro\/commands\/spec\/[a-z-]+\.md/,
    /\.kiro\/commands\/spec-\*\.md/,
    /\.kiro\/skills\//,
    /\.kiro\/agents\//,
    /\.kiro\/spec-first\//,
    /\.kiro\/settings\//,
    /\.qoder\/commands\/spec\/[a-z-]+\.md/,
    /\.qoder\/commands\/spec-[a-z-]+\.md/,
    /\.qoder\/commands\/spec-\*\.md/,
    /\.qoder\/skills\//,
    /\.qoder\/agents\//,
    /\.qoder\/spec-first\//,
    /\.qoder\/settings(?:\.local)?\.json/,
  ],
  kiro: [
    /\.claude\/commands\/spec\/[a-z-]+\.md/,
    /\.claude\/commands\/spec-\*\.md/,
    /\.claude\/spec-first\/workflows\//,
    /\.claude\/skills\//,
    /\.claude\/agents\//,
    /\.codex\/commands\/spec\/[a-z-]+\.md/,
    /\.codex\/commands\/spec-\*\.md/,
    /\.codex\/skills\//,
    /\.codex\/agents\//,
    /\.agents\/skills\//,
    /\.cursor\/skills\//,
    /\.cursor\/spec-first\//,
    /\.cursor\/mcp\.json/,
    /\.qoder\/commands\/spec-[a-z-]+\.md/,
    /\.qoder\/commands\/spec-\*\.md/,
    /\.qoder\/commands\/spec\//,
    /\.qoder\/skills\//,
    /\.qoder\/agents\//,
    /\.qoder\/spec-first\//,
    /\.qoder\/settings\.local\.json/,
  ],
  qoder: [
    /\.claude\/commands\/spec\/[a-z-]+\.md/,
    /\.claude\/commands\/spec-[a-z-]+\.md/,
    /\.claude\/commands\/spec-\*\.md/,
    /\.claude\/spec-first\/workflows\//,
    /\.claude\/skills\//,
    /\.claude\/agents\//,
    /\.codex\/commands\/spec\/[a-z-]+\.md/,
    /\.codex\/commands\/spec-\*\.md/,
    /\.codex\/skills\//,
    /\.codex\/agents\//,
    /\.agents\/skills\//,
    /\.cursor\/skills\//,
    /\.cursor\/spec-first\//,
    /\.cursor\/mcp\.json/,
    /\.cursor\/agents\//,
    /\.kiro\/commands\/spec\/[a-z-]+\.md/,
    /\.kiro\/commands\/spec-\*\.md/,
    /\.kiro\/skills\//,
    /\.kiro\/agents\//,
    /\.kiro\/spec-first\//,
    /\.kiro\/settings\//,
  ],
};

const EXCLUSION_CANDIDATE_PATHS = [
  '.claude/spec-first/state.json',
  '.claude/spec-first/workflows/spec-work.md',
  '.claude/skills/spec-work/SKILL.md',
  '.claude/agents/reviewer.md',
  '.claude/commands/spec/work.md',
  '.claude/commands/spec-work.md',
  '.claude/commands/spec-*.md',
  '.claude/hooks/session-start',
  '.codex/spec-first/state.json',
  '.agents/skills/spec-work/SKILL.md',
  '.codex/skills/spec-work/SKILL.md',
  '.codex/agents/reviewer.md',
  '.codex/commands/spec/work.md',
  '.codex/commands/spec-work.md',
  '.codex/commands/spec-*.md',
  '.codex/hooks/session-start',
  '.codex/hooks.json',
  '.cursor/spec-first/state.json',
  '.cursor/skills/spec-work/SKILL.md',
  '.cursor/agents/reviewer.md',
  '.cursor/mcp.json',
  '.kiro/spec-first/state.json',
  '.kiro/skills/spec-work/SKILL.md',
  '.kiro/agents/reviewer.md',
  '.kiro/commands/spec/work.md',
  '.kiro/commands/spec-work.md',
  '.kiro/commands/spec-*.md',
  '.kiro/settings/mcp.json',
  '.qoder/spec-first/state.json',
  '.qoder/skills/spec-work/SKILL.md',
  '.qoder/agents/reviewer.md',
  '.qoder/commands/spec-work.md',
  '.qoder/commands/spec-*.md',
  '.qoder/commands/spec/legacy.md',
  '.qoder/settings.json',
  '.qoder/settings.local.json',
  '.qoder/hooks/session-start',
  '.qoder/hooks/prd-prewrite-guard',
  '.qoder/hooks/prd-readiness-guard',
];

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
    expect(() => compilePathRule({ kind: 'file', path: '.x', ownership: 'unknown' }))
      .toThrow('Unsupported platform registry surface ownership');
    expect(() => compilePathRule({ kind: 'file', path: '/absolute', ownership: 'generated-runtime' }))
      .toThrow('Platform registry path rule must be repo-relative');
    expect(() => compilePathRule({ kind: 'file', path: '.x/..', ownership: 'generated-runtime' }))
      .toThrow('Platform registry path rule must not traverse outside the repo');
    expect(() => compilePathRule({ kind: 'file', path: '.x//nested', ownership: 'generated-runtime' }))
      .toThrow('Platform registry path rule must be normalized');
  });

  test('derives other-host exclusions without including the target host', () => {
    const cursorPatterns = deriveUnrewrittenPatterns('cursor');

    expect(cursorPatterns.some((pattern) => pattern.test('.qoder/skills/spec-work/SKILL.md'))).toBe(true);
    expect(cursorPatterns.some((pattern) => pattern.test('.cursor/skills/spec-work/SKILL.md'))).toBe(false);

    const opencodePatterns = deriveUnrewrittenPatterns('opencode');
    expect(opencodePatterns.some((pattern) => pattern.test('.agents/skills/spec-work/SKILL.md'))).toBe(true);
    expect(opencodePatterns.some((pattern) => pattern.test('.opencode/skills/spec-work/SKILL.md'))).toBe(false);
  });

  test('uses rewriteScope and accepts a pointer-only fixture host declaration', () => {
    const fixtureRegistry = {
      existing: {
        runtimeRoot: '.existing',
        surfaces: {},
        capabilities: {},
      },
      windsurf: {
        runtimeRoot: '.windsurf',
        surfaces: {
          commandRoot: {
            kind: 'dir',
            path: '.windsurf/commands/',
            ownership: 'generated-runtime',
            rewriteScope: '.windsurf/commands/spec-*.md',
          },
          pointerPath: {
            kind: 'managed-slice',
            path: '.windsurf/rules/spec-first.md',
            ownership: 'host-user-owned',
            rewriteExclude: false,
          },
        },
        capabilities: {
          hooks: {
            shellCommand: { status: 'not-supported', reasonCode: 'platform-unsupported' },
          },
        },
      },
    };

    const patterns = deriveUnrewrittenPatterns('existing', fixtureRegistry);
    expect(patterns.some((pattern) => pattern.test('.windsurf/commands/spec-work.md'))).toBe(true);
    expect(patterns.some((pattern) => pattern.test('.windsurf/commands/custom.md'))).toBe(false);
    expect(patterns.some((pattern) => pattern.test('.windsurf/rules/spec-first.md'))).toBe(false);
  });
});

describe('platform registry runtime path consumer', () => {
  test('declares OpenCode generated runtime separately from host-local config', () => {
    expect(PLATFORM_REGISTRY.opencode).toMatchObject({
      runtimeRoot: '.opencode',
      surfaces: {
        managedRoot: { ownership: 'generated-runtime' },
        skillsRoot: { ownership: 'generated-runtime' },
        commandFiles: { ownership: 'generated-runtime' },
        projectConfig: { ownership: 'host-local', rewriteExclude: true },
        projectConfigJsonc: { ownership: 'host-local', rewriteExclude: true },
      },
    });
    expect(contentHasOtherRuntimePathReferences(
      'opencode',
      'see `.agents/skills/spec-work/SKILL.md`',
    )).toBe(true);
    expect(contentHasOtherRuntimePathReferences(
      'opencode',
      'see `.opencode/skills/spec-work/SKILL.md`',
    )).toBe(false);
  });

  test('records confirmed Qoder command protocol separately from unverified hook activation', () => {
    expect(PLATFORM_REGISTRY.qoder.capabilities.hooks).toEqual({
      shellCommand: { status: 'confirmed' },
      sessionStart: { status: 'degraded', reasonCode: 'activation-unverified' },
      preToolUse: { status: 'degraded', reasonCode: 'activation-unverified' },
      stopBlocking: { status: 'degraded', reasonCode: 'activation-unverified' },
    });
  });

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

  test('extracts a sixth host from the supplied registry before anchored matching', () => {
    const fixtureRegistry = {
      ...PLATFORM_REGISTRY,
      windsurf: {
        runtimeRoot: '.windsurf',
        surfaces: {
          settingsFile: {
            kind: 'file',
            path: '.windsurf/settings.json',
            ownership: 'host-local',
            rewriteExclude: true,
          },
        },
        capabilities: {},
      },
    };
    const candidates = extractCandidateRuntimePaths(
      'see `$HOME/.windsurf/settings.json`',
      fixtureRegistry,
    );
    const patterns = deriveUnrewrittenPatterns('claude', fixtureRegistry);

    expect(candidates).toEqual(['.windsurf/settings.json']);
    expect(candidates.some((candidatePath) => (
      patterns.some((pattern) => pattern.test(candidatePath))
    ))).toBe(true);
  });

  test('strips Markdown fragments and numeric locations before anchored matching', () => {
    const fileRule = compilePathRule({
      kind: 'file',
      path: '.cursor/mcp.json',
      ownership: 'host-local',
    });
    const sliceRule = compilePathRule({
      kind: 'managed-slice',
      path: '.qoder/settings.json',
      ownership: 'host-user-owned',
    });
    const globRule = compilePathRule({
      kind: 'glob',
      path: '.qoder/commands/spec-*.md',
      ownership: 'generated-runtime',
    });
    const candidates = extractCandidateRuntimePaths([
      '.cursor/mcp.json#configuration',
      '.cursor/mcp.json.bak#configuration',
      '.qoder/settings.json:12:4',
      '.qoder/settings.local.json:12:4',
      '.qoder/commands/spec-work.md:8',
      '.qoder/commands/spec/nested.md:8',
    ].join(' '));

    expect(candidates).toEqual([
      '.cursor/mcp.json',
      '.cursor/mcp.json.bak',
      '.qoder/settings.json',
      '.qoder/settings.local.json',
      '.qoder/commands/spec-work.md',
      '.qoder/commands/spec/nested.md',
    ]);
    expect(fileRule.test(candidates[0])).toBe(true);
    expect(fileRule.test(candidates[1])).toBe(false);
    expect(sliceRule.test(candidates[2])).toBe(true);
    expect(sliceRule.test(candidates[3])).toBe(false);
    expect(globRule.test(candidates[4])).toBe(true);
    expect(globRule.test(candidates[5])).toBe(false);
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

  test('matches every legacy candidate verdict modulo the complete explicit delta table', () => {
    const actualDeltas = [];

    for (const [platform, legacyPatterns] of Object.entries(LEGACY_UNREWRITTEN_PATH_PATTERNS)) {
      const derivedPatterns = deriveUnrewrittenPatterns(platform);
      for (const candidatePath of EXCLUSION_CANDIDATE_PATHS) {
        const legacyMatched = legacyPatterns.some((pattern) => pattern.test(candidatePath));
        const derivedMatched = derivedPatterns.some((pattern) => pattern.test(candidatePath));
        if (legacyMatched === derivedMatched) {
          continue;
        }
        actualDeltas.push({
          platform,
          candidatePath,
          direction: derivedMatched ? 'widen' : 'narrow',
        });
      }
    }

    const documentedDeltas = EXCLUSION_COMPATIBILITY_DELTAS.map((delta) => ({
      platform: delta.platform,
      candidatePath: delta.candidatePath,
      direction: delta.direction,
    }));
    const sortByIdentity = (left, right) => (
      `${left.platform}:${left.candidatePath}`.localeCompare(`${right.platform}:${right.candidatePath}`)
    );

    expect(actualDeltas.sort(sortByIdentity)).toEqual(documentedDeltas.sort(sortByIdentity));
    for (const delta of EXCLUSION_COMPATIBILITY_DELTAS) {
      expect(delta.fixture).toEqual(expect.any(String));
      expect(delta.reasonCode).toEqual(expect.any(String));
      expect(delta.ownership).toMatch(/^(generated-runtime|host-local|host-user-owned)$/);
    }
  });
});
