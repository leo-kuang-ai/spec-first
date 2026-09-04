'use strict';

const PLATFORM_REGISTRY = {
  claude: {
    displayName: 'Claude Code',
    runtimeRoot: '.claude',
    surfaces: {
      managedRoot: { kind: 'dir', path: '.claude/spec-first/', ownership: 'generated-runtime' },
      skillsRoot: { kind: 'dir', path: '.claude/skills/', ownership: 'generated-runtime' },
      workflowsRoot: { kind: 'dir', path: '.claude/spec-first/workflows/', ownership: 'generated-runtime' },
      agentsRoot: { kind: 'dir', path: '.claude/agents/', ownership: 'generated-runtime' },
      commandFiles: { kind: 'glob', path: '.claude/commands/spec/*.md', ownership: 'generated-runtime' },
      legacyFlatCommandFiles: { kind: 'glob', path: '.claude/commands/spec-*.md', ownership: 'generated-runtime' },
      hooksDir: { kind: 'dir', path: '.claude/hooks/', ownership: 'generated-runtime' },
      settingsFile: {
        kind: 'managed-slice',
        path: '.claude/settings.json',
        ownership: 'host-user-owned',
        managedIdentity: 'spec-first-managed-hook-matchers',
        rewriteExclude: false,
      },
    },
    capabilities: {
      hooks: {
        shellCommand: { status: 'confirmed' },
        sessionStart: { status: 'confirmed' },
        preToolUse: { status: 'confirmed' },
        stopBlocking: { status: 'confirmed' },
      },
    },
  },
  codex: {
    displayName: 'Codex',
    runtimeRoot: '.codex',
    surfaces: {
      managedRoot: { kind: 'dir', path: '.codex/spec-first/', ownership: 'generated-runtime' },
      skillsRoot: { kind: 'dir', path: '.agents/skills/', ownership: 'generated-runtime', crossRuntimeRoot: true },
      workflowsRoot: { kind: 'dir', path: '.agents/skills/', ownership: 'generated-runtime', crossRuntimeRoot: true },
      legacySkillsRoot: { kind: 'dir', path: '.codex/skills/', ownership: 'generated-runtime', compatibilityDelta: 'legacy-codex-skills-root' },
      agentsRoot: { kind: 'dir', path: '.codex/agents/', ownership: 'generated-runtime' },
      commandFiles: { kind: 'glob', path: '.codex/commands/spec/*.md', ownership: 'generated-runtime' },
      legacyFlatCommandFiles: { kind: 'glob', path: '.codex/commands/spec-*.md', ownership: 'generated-runtime' },
      hooksDir: { kind: 'dir', path: '.codex/hooks/', ownership: 'generated-runtime' },
      hooksJsonFile: { kind: 'file', path: '.codex/hooks.json', ownership: 'generated-runtime' },
    },
    capabilities: {
      hooks: {
        shellCommand: { status: 'confirmed' },
        sessionStart: { status: 'confirmed' },
        preToolUse: { status: 'not-supported', reasonCode: 'spec-first-scope' },
        stopBlocking: { status: 'not-supported', reasonCode: 'spec-first-scope' },
      },
    },
  },
  cursor: {
    displayName: 'Cursor',
    runtimeRoot: '.cursor',
    surfaces: {
      managedRoot: { kind: 'dir', path: '.cursor/spec-first/', ownership: 'generated-runtime' },
      skillsRoot: { kind: 'dir', path: '.cursor/skills/', ownership: 'generated-runtime' },
      agentsRoot: { kind: 'dir', path: '.cursor/agents/', ownership: 'generated-runtime' },
      pointerPath: {
        kind: 'managed-slice',
        path: '.cursor/rules/spec-first.mdc',
        ownership: 'host-user-owned',
        rewriteExclude: false,
        format: {
          markdown: 'mdc',
          frontmatter: { alwaysApply: true },
        },
      },
      mcpConfig: { kind: 'file', path: '.cursor/mcp.json', ownership: 'host-local', rewriteExclude: true },
    },
    capabilities: {
      hooks: {
        shellCommand: { status: 'not-supported', reasonCode: 'platform-unsupported' },
      },
    },
  },
  kiro: {
    displayName: 'Kiro',
    runtimeRoot: '.kiro',
    surfaces: {
      managedRoot: { kind: 'dir', path: '.kiro/spec-first/', ownership: 'generated-runtime' },
      skillsRoot: { kind: 'dir', path: '.kiro/skills/', ownership: 'generated-runtime' },
      agentsRoot: { kind: 'dir', path: '.kiro/agents/', ownership: 'generated-runtime' },
      legacyCommandFiles: { kind: 'glob', path: '.kiro/commands/spec/*.md', ownership: 'generated-runtime', compatibilityDelta: 'legacy-kiro-command-namespace' },
      legacyFlatCommandFiles: { kind: 'glob', path: '.kiro/commands/spec-*.md', ownership: 'generated-runtime', compatibilityDelta: 'legacy-kiro-flat-command' },
      pointerPath: {
        kind: 'managed-slice',
        path: '.kiro/steering/spec-first.md',
        ownership: 'host-user-owned',
        rewriteExclude: false,
        format: {
          markdown: 'md',
          frontmatter: null,
          loading: 'steering-default-always-included',
        },
      },
      settingsDir: { kind: 'dir', path: '.kiro/settings/', ownership: 'host-local', rewriteExclude: true },
    },
    capabilities: {
      hooks: {
        shellCommand: { status: 'not-supported', reasonCode: 'platform-unsupported' },
      },
    },
  },
  qoder: {
    displayName: 'Qoder',
    runtimeRoot: '.qoder',
    surfaces: {
      managedRoot: { kind: 'dir', path: '.qoder/spec-first/', ownership: 'generated-runtime' },
      skillsRoot: { kind: 'dir', path: '.qoder/skills/', ownership: 'generated-runtime' },
      agentsRoot: { kind: 'dir', path: '.qoder/agents/', ownership: 'generated-runtime' },
      commandFiles: { kind: 'glob', path: '.qoder/commands/spec-*.md', ownership: 'generated-runtime' },
      retiredCommandNamespace: { kind: 'dir', path: '.qoder/commands/spec/', ownership: 'generated-runtime', compatibilityDelta: 'retired-qoder-command-namespace' },
      pointerPath: {
        kind: 'managed-slice',
        path: '.qoder/rules/spec-first.md',
        ownership: 'host-user-owned',
        rewriteExclude: false,
        format: {
          markdown: 'md',
          frontmatter: { trigger: 'always_on' },
        },
      },
      settingsFile: {
        kind: 'managed-slice',
        path: '.qoder/settings.json',
        ownership: 'host-user-owned',
        managedIdentity: 'spec-first-managed-hook-entries',
        rewriteExclude: true,
      },
      settingsLocalFile: { kind: 'file', path: '.qoder/settings.local.json', ownership: 'host-local', rewriteExclude: true },
      sessionStartHook: { kind: 'managed-slice', path: '.qoder/hooks/session-start', ownership: 'host-user-owned', rewriteExclude: true },
      prdPrewriteGuardHook: { kind: 'managed-slice', path: '.qoder/hooks/prd-prewrite-guard', ownership: 'host-user-owned', rewriteExclude: true },
      prdReadinessGuardHook: { kind: 'managed-slice', path: '.qoder/hooks/prd-readiness-guard', ownership: 'host-user-owned', rewriteExclude: true },
    },
    capabilities: {
      hooks: {
        shellCommand: { status: 'confirmed' },
        sessionStart: { status: 'degraded', reasonCode: 'activation-unverified' },
        preToolUse: { status: 'degraded', reasonCode: 'activation-unverified' },
        stopBlocking: { status: 'degraded', reasonCode: 'activation-unverified' },
      },
    },
  },
  opencode: {
    displayName: 'OpenCode',
    runtimeRoot: '.opencode',
    surfaces: {
      managedRoot: { kind: 'dir', path: '.opencode/spec-first/', ownership: 'generated-runtime' },
      skillsRoot: { kind: 'dir', path: '.opencode/skills/', ownership: 'generated-runtime' },
      workflowsRoot: { kind: 'dir', path: '.opencode/skills/', ownership: 'generated-runtime' },
      agentsRoot: { kind: 'dir', path: '.opencode/agents/', ownership: 'generated-runtime' },
      commandFiles: { kind: 'glob', path: '.opencode/commands/spec-*.md', ownership: 'generated-runtime' },
      retiredCommandNamespace: { kind: 'dir', path: '.opencode/commands/spec/', ownership: 'generated-runtime', compatibilityDelta: 'retired-opencode-command-namespace' },
      projectConfig: { kind: 'file', path: 'opencode.json', ownership: 'host-local', rewriteExclude: true },
      projectConfigJsonc: { kind: 'file', path: 'opencode.jsonc', ownership: 'host-local', rewriteExclude: true },
    },
    capabilities: {
      hooks: {
        shellCommand: { status: 'not-supported', reasonCode: 'spec-first-scope' },
      },
    },
  },
  zcode: {
    displayName: 'ZCode',
    runtimeRoot: '.zcode',
    surfaces: {
      managedRoot: { kind: 'dir', path: '.zcode/spec-first/', ownership: 'generated-runtime' },
      skillsRoot: { kind: 'dir', path: '.agents/skills/', ownership: 'generated-runtime', crossRuntimeRoot: true },
      workflowsRoot: { kind: 'dir', path: '.agents/skills/', ownership: 'generated-runtime', crossRuntimeRoot: true },
    },
    capabilities: {
      hooks: {
        shellCommand: { status: 'confirmed' },
        sessionStart: { status: 'confirmed' },
        preToolUse: { status: 'not-supported', reasonCode: 'spec-first-scope' },
        stopBlocking: { status: 'not-supported', reasonCode: 'spec-first-scope' },
      },
    },
  },
};

function widenDelta(platform, fixture, candidatePath, reasonCode, ownership = 'generated-runtime') {
  return {
    platform,
    fixture,
    candidatePath,
    direction: 'widen',
    reasonCode,
    ownership,
  };
}

const EXCLUSION_COMPATIBILITY_DELTAS = [
  widenDelta('cursor', 'cursor-claude-managed-root', '.claude/spec-first/state.json', 'registry-declares-complete-managed-root'),
  widenDelta('cursor', 'cursor-claude-hooks', '.claude/hooks/session-start', 'registry-declares-generated-hook-surface'),
  widenDelta('cursor', 'cursor-codex-managed-root', '.codex/spec-first/state.json', 'registry-declares-complete-managed-root'),
  widenDelta('cursor', 'cursor-codex-flat-command', '.codex/commands/spec-work.md', 'registry-normalizes-flat-command-surface'),
  widenDelta('cursor', 'cursor-codex-hooks', '.codex/hooks/session-start', 'registry-declares-generated-hook-surface'),
  widenDelta('cursor', 'cursor-codex-hooks-json', '.codex/hooks.json', 'registry-declares-generated-hook-surface'),
  widenDelta('cursor', 'cursor-kiro-flat-command', '.kiro/commands/spec-work.md', 'registry-preserves-legacy-command-surface'),
  widenDelta('cursor', 'cursor-qoder-session-hook', '.qoder/hooks/session-start', 'phase-0-added-managed-qoder-hook-scripts', 'host-user-owned'),
  widenDelta('cursor', 'cursor-qoder-prewrite-hook', '.qoder/hooks/prd-prewrite-guard', 'phase-0-added-managed-qoder-hook-scripts', 'host-user-owned'),
  widenDelta('cursor', 'cursor-qoder-readiness-hook', '.qoder/hooks/prd-readiness-guard', 'phase-0-added-managed-qoder-hook-scripts', 'host-user-owned'),
  widenDelta('kiro', 'kiro-claude-managed-root', '.claude/spec-first/state.json', 'registry-declares-complete-managed-root'),
  widenDelta('kiro', 'kiro-claude-flat-command', '.claude/commands/spec-work.md', 'legacy-kiro-omitted-claude-flat-command'),
  widenDelta('kiro', 'kiro-claude-hooks', '.claude/hooks/session-start', 'registry-declares-generated-hook-surface'),
  widenDelta('kiro', 'kiro-codex-managed-root', '.codex/spec-first/state.json', 'registry-declares-complete-managed-root'),
  widenDelta('kiro', 'kiro-codex-flat-command', '.codex/commands/spec-work.md', 'registry-normalizes-flat-command-surface'),
  widenDelta('kiro', 'kiro-codex-hooks', '.codex/hooks/session-start', 'registry-declares-generated-hook-surface'),
  widenDelta('kiro', 'kiro-codex-hooks-json', '.codex/hooks.json', 'registry-declares-generated-hook-surface'),
  widenDelta('kiro', 'kiro-cursor-agents', '.cursor/agents/reviewer.md', 'legacy-kiro-omitted-cursor-agents'),
  widenDelta('kiro', 'kiro-qoder-settings-json', '.qoder/settings.json', 'legacy-kiro-only-covered-qoder-settings-local', 'host-user-owned'),
  widenDelta('kiro', 'kiro-qoder-session-hook', '.qoder/hooks/session-start', 'phase-0-added-managed-qoder-hook-scripts', 'host-user-owned'),
  widenDelta('kiro', 'kiro-qoder-prewrite-hook', '.qoder/hooks/prd-prewrite-guard', 'phase-0-added-managed-qoder-hook-scripts', 'host-user-owned'),
  widenDelta('kiro', 'kiro-qoder-readiness-hook', '.qoder/hooks/prd-readiness-guard', 'phase-0-added-managed-qoder-hook-scripts', 'host-user-owned'),
  widenDelta('qoder', 'qoder-claude-managed-root', '.claude/spec-first/state.json', 'registry-declares-complete-managed-root'),
  widenDelta('qoder', 'qoder-claude-hooks', '.claude/hooks/session-start', 'registry-declares-generated-hook-surface'),
  widenDelta('qoder', 'qoder-codex-managed-root', '.codex/spec-first/state.json', 'registry-declares-complete-managed-root'),
  widenDelta('qoder', 'qoder-codex-flat-command', '.codex/commands/spec-work.md', 'registry-normalizes-flat-command-surface'),
  widenDelta('qoder', 'qoder-codex-hooks', '.codex/hooks/session-start', 'registry-declares-generated-hook-surface'),
  widenDelta('qoder', 'qoder-codex-hooks-json', '.codex/hooks.json', 'registry-declares-generated-hook-surface'),
  widenDelta('qoder', 'qoder-kiro-flat-command', '.kiro/commands/spec-work.md', 'registry-preserves-legacy-command-surface'),
];

const EXCLUSION_OWNERSHIPS = new Set([
  'generated-runtime',
]);
const SURFACE_OWNERSHIPS = new Set([
  'generated-runtime',
  'host-local',
  'host-user-owned',
]);

function deriveUnrewrittenPatterns(platformId, registry = PLATFORM_REGISTRY) {
  if (!registry[platformId]) {
    throw new Error(`Unknown platform for runtime path exclusion derivation: ${platformId}`);
  }

  return Object.entries(registry)
    .filter(([id]) => id !== platformId)
    .flatMap(([, config]) => Object.values(config.surfaces || {}))
    .filter(shouldIncludeSurfaceInRewriteExclusions)
    .map((surface) => surface.rewriteScope
      ? compilePathRule({
        kind: 'glob',
        path: surface.rewriteScope,
        ownership: surface.ownership,
      })
      : compilePathRule(surface));
}

function shouldIncludeSurfaceInRewriteExclusions(surface) {
  if (surface.rewriteExclude === false) {
    return false;
  }
  if (surface.rewriteExclude === true) {
    return true;
  }
  return EXCLUSION_OWNERSHIPS.has(surface.ownership)
    || surface.kind === 'managed-slice'
    || surface.kind === 'managed-slice-dir';
}

function contentHasOtherRuntimePathReferences(platformId, content, registry = PLATFORM_REGISTRY) {
  return findUnrewrittenRuntimePathReferences(platformId, content, registry).length > 0;
}

function findUnrewrittenRuntimePathReferences(platformId, content, registry = PLATFORM_REGISTRY) {
  const patterns = deriveUnrewrittenPatterns(platformId, registry);
  return extractCandidateRuntimePaths(content, registry)
    .filter((candidatePath) => patterns.some((pattern) => pattern.test(candidatePath)));
}

function extractCandidateRuntimePaths(content, registry = PLATFORM_REGISTRY) {
  const candidates = [];
  const seen = new Set();
  const runtimePathPrefixes = deriveRuntimePathPrefixes(registry);
  if (runtimePathPrefixes.length === 0) {
    return candidates;
  }
  const runtimePathPattern = new RegExp(
    `(?:^|[\\s\`"'([{<])((?:\\$HOME\\/|~\\/)?(?:${runtimePathPrefixes
      .map(escapeForRegex)
      .join('|')})\\/[^\\s\`"'<>]*)`,
    'g',
  );
  let match;
  while ((match = runtimePathPattern.exec(String(content || ''))) !== null) {
    const normalized = normalizeCandidatePath(match[1]);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    candidates.push(normalized);
  }
  return candidates;
}

function deriveRuntimePathPrefixes(registry) {
  const prefixes = new Set();

  for (const config of Object.values(registry || {})) {
    const declaredPaths = [
      config.runtimeRoot,
      ...Object.values(config.surfaces || {}).flatMap((surface) => [surface.path, surface.rewriteScope]),
    ];
    for (const declaredPath of declaredPaths) {
      const normalized = String(declaredPath || '')
        .replace(/\\/g, '/')
        .replace(/^\.\//, '');
      const prefixMatch = normalized.match(/^(\.[A-Za-z0-9_-]+)(?:\/|$)/);
      if (prefixMatch) {
        prefixes.add(prefixMatch[1]);
      }
    }
  }

  return [...prefixes].sort((left, right) => right.length - left.length);
}

function compilePathRule(rule) {
  if (!rule || typeof rule !== 'object') {
    throw new Error('Platform registry path rule must be an object');
  }
  if (!rule.ownership) {
    throw new Error('Platform registry path rule must declare ownership');
  }
  if (!SURFACE_OWNERSHIPS.has(rule.ownership)) {
    throw new Error(`Unsupported platform registry surface ownership: ${rule.ownership}`);
  }

  const normalized = normalizeRepoRelativePath(rule.path);
  if (rule.kind === 'file' || rule.kind === 'managed-slice') {
    return new RegExp(`^${escapeForRegex(normalized)}$`);
  }
  if (rule.kind === 'dir' || rule.kind === 'managed-slice-dir') {
    const directoryPath = normalized.endsWith('/') ? normalized : `${normalized}/`;
    return new RegExp(`^${escapeForRegex(directoryPath)}.*$`);
  }
  if (rule.kind === 'glob') {
    return new RegExp(`^${globToRegexSource(normalized)}$`);
  }
  throw new Error(`Unsupported platform registry path rule kind: ${rule.kind}`);
}

function normalizeRepoRelativePath(value) {
  const normalized = String(value || '')
    .replace(/\\/g, '/')
    .replace(/^\.\//, '');
  if (!normalized) {
    throw new Error('Platform registry path rule path is required');
  }
  if (normalized.startsWith('/') || /^[A-Za-z]:\//.test(normalized)) {
    throw new Error('Platform registry path rule must be repo-relative');
  }
  if (
    normalized.includes('/../')
    || normalized.endsWith('/..')
    || normalized === '..'
    || normalized.startsWith('../')
  ) {
    throw new Error('Platform registry path rule must not traverse outside the repo');
  }
  if (normalized.includes('//') || normalized.includes('/./') || normalized.endsWith('/.')) {
    throw new Error('Platform registry path rule must be normalized');
  }
  return normalized;
}

function normalizeCandidatePath(value) {
  return String(value || '')
    .replace(/\\/g, '/')
    .replace(/^\$HOME\//, '')
    .replace(/^~\//, '')
    .replace(/[),.;!?\]]+$/g, '')
    .replace(/#.*$/g, '')
    .replace(/:\d+(?::\d+)?$/g, '')
    .replace(/[),.;:!?\]]+$/g, '')
    .replace(/^\.\//, '.');
}

function globToRegexSource(globPattern) {
  let output = '';
  for (let index = 0; index < globPattern.length; index += 1) {
    const char = globPattern[index];
    const next = globPattern[index + 1];
    if (char === '*' && next === '*') {
      output += '.*';
      index += 1;
      continue;
    }
    if (char === '*') {
      output += '[^/]*';
      continue;
    }
    output += escapeForRegex(char);
  }
  return output;
}

function escapeForRegex(value) {
  return String(value).replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}

module.exports = {
  EXCLUSION_COMPATIBILITY_DELTAS,
  PLATFORM_REGISTRY,
  compilePathRule,
  contentHasOtherRuntimePathReferences,
  deriveUnrewrittenPatterns,
  extractCandidateRuntimePaths,
  findUnrewrittenRuntimePathReferences,
};
