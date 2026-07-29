'use strict';

const SPEC_FIRST_GITIGNORE_START = '# spec-first:start';
const SPEC_FIRST_GITIGNORE_END = '# spec-first:end';

const SPEC_FIRST_GITIGNORE_SECTIONS = [
  {
    title: 'spec-first generated runtime assets',
    patterns: [
      '.claude/commands/spec/',
      '.claude/commands/spec-*.md',
      '.claude/skills/spec-*/',
      '.claude/skills/using-spec-first/',
      '.claude/skills/graphify/',
      '.claude/spec-first/',
      '.claude/agents/spec-*',
      '.claude/hooks/session-start',
      '.claude/hooks/spec-plan-guard',
      '.claude/hooks/prd-prewrite-guard',
      '.claude/hooks/prd-readiness-guard',
      '.claude/tasks/',
      '.claude/worktrees/',
      '.codex/commands/spec/',
      '.codex/commands/spec-*.md',
      '.codex/skills/spec-*/',
      '.codex/skills/using-spec-first/',
      '.codex/skills/graphify/',
      '.codex/spec-first/',
      '.codex/agents/spec-*',
      '.codex/hooks/session-start',
      '.codex/hooks/session-start.cmd',
      '.codex/hooks.json',
      '.agents/skills/spec-*/',
      '.agents/skills/source-command-spec-*/',
      '.agents/skills/using-spec-first/',
      '.agents/skills/graphify/',
      '.cursor/skills/spec-*/',
      '.cursor/skills/using-spec-first/',
      '.cursor/spec-first/',
      '.cursor/mcp.json',
      '.cursor/rules/spec-first.mdc',
      '.kiro/commands/spec/',
      '.kiro/commands/spec-*.md',
      '.kiro/skills/spec-*/',
      '.kiro/skills/using-spec-first/',
      '.kiro/skills/graphify/',
      '.kiro/agents/spec-*',
      '.kiro/spec-first/',
      '.kiro/settings/',
      '.kiro/steering/spec-first.md',
      '.qoder/commands/spec/',
      '.qoder/commands/spec-*.md',
      '.qoder/skills/spec-*/',
      '.qoder/skills/using-spec-first/',
      '.qoder/skills/graphify/',
      '.qoder/agents/spec-*',
      '.qoder/spec-first/',
      '.qoder/hooks/session-start',
      '.qoder/hooks/prd-prewrite-guard',
      '.qoder/hooks/prd-readiness-guard',
      '.qoder/rules/spec-first.md',
      '.qoder/settings.local.json',
      '.opencode/commands/spec/',
      '.opencode/skills/spec-*/',
      '.opencode/skills/using-spec-first/',
      '.opencode/skills/graphify/',
      '.opencode/agents/spec-*',
      '.opencode/spec-first/',
      '.context/spec-first/',
    ],
  },
  {
    title: 'spec-first local setup and workflow runtime artifacts',
    patterns: [
      '.spec-first/*.local.yaml',
      '.spec-first/config.local.yaml',
      '.spec-first/config/*.json',
      '.spec-first/audits/',
      '.spec-first/governance/',
      '.spec-first/app-audit/',
      '.spec-first/workflows/',
      '.spec-first/workspace/',
      '.spec-first/sessions/',
    ],
  },
  {
    title: 'optional provider local artifacts',
    patterns: [
      '.codegraph/',
      '.graphify/',
      'graphify-out/',
    ],
  },
];

const SPEC_FIRST_GITIGNORE_PATTERN_METADATA = {
  '.codex/hooks.json': { runtimeUntrack: false, shareability: 'team-policy' },
  '.cursor/mcp.json': { runtimeUntrack: false, shareability: 'team-policy' },
  '.cursor/rules/spec-first.mdc': { runtimeUntrack: false, shareability: 'generated-pointer' },
  '.kiro/settings/': { runtimeUntrack: false, shareability: 'team-policy' },
  '.kiro/steering/spec-first.md': { runtimeUntrack: false, shareability: 'generated-pointer' },
  '.qoder/hooks/session-start': { runtimeUntrack: false, shareability: 'managed-slice' },
  '.qoder/hooks/prd-prewrite-guard': { runtimeUntrack: false, shareability: 'managed-slice' },
  '.qoder/hooks/prd-readiness-guard': { runtimeUntrack: false, shareability: 'managed-slice' },
  '.qoder/rules/spec-first.md': { runtimeUntrack: false, shareability: 'generated-pointer' },
  '.qoder/settings.local.json': { runtimeUntrack: false, shareability: 'team-policy' },
  '.graphify/': { runtimeUntrack: false, shareability: 'team-policy' },
  'graphify-out/': { runtimeUntrack: false, shareability: 'team-policy' },
};

function getSpecFirstGitignorePatterns() {
  return SPEC_FIRST_GITIGNORE_SECTIONS.flatMap((section) => section.patterns);
}

function getSpecFirstGitignorePatternMetadata() {
  return { ...SPEC_FIRST_GITIGNORE_PATTERN_METADATA };
}

function getSpecFirstRuntimeUntrackPatterns() {
  return getSpecFirstGitignorePatterns()
    .filter((pattern) => SPEC_FIRST_GITIGNORE_PATTERN_METADATA[pattern]?.runtimeUntrack !== false)
    .map(toRuntimeUntrackPathspec);
}

function toRuntimeUntrackPathspec(pattern) {
  if (pattern.includes('*') && pattern.endsWith('/')) {
    return `${pattern}**`;
  }
  return pattern;
}

function buildSpecFirstGitignoreBlock() {
  const lines = [SPEC_FIRST_GITIGNORE_START];
  for (const section of SPEC_FIRST_GITIGNORE_SECTIONS) {
    lines.push(`# ${section.title}`);
    lines.push(...section.patterns);
    lines.push('');
  }
  lines.pop();
  lines.push(SPEC_FIRST_GITIGNORE_END);
  return lines.join('\n');
}

function applySpecFirstGitignoreBlock(existingContent) {
  if (typeof existingContent !== 'string') {
    throw new TypeError('existingContent must be a string');
  }

  const block = buildSpecFirstGitignoreBlock();
  const startMarkers = findLineMarkers(existingContent, SPEC_FIRST_GITIGNORE_START);
  const endMarkers = findLineMarkers(existingContent, SPEC_FIRST_GITIGNORE_END);
  const hasNoBlock = !existingContent.includes(SPEC_FIRST_GITIGNORE_START)
    && !existingContent.includes(SPEC_FIRST_GITIGNORE_END);
  const hasValidBlock = startMarkers.length === 1
    && endMarkers.length === 1
    && endMarkers[0].index > startMarkers[0].index;
  let updated;
  let status;

  if (hasValidBlock) {
    const startIdx = startMarkers[0].index;
    const endIdx = endMarkers[0].index;
    const endLength = endMarkers[0].length;
    const before = existingContent.slice(0, startIdx);
    const after = existingContent.slice(endIdx + endLength);
    updated = `${before}${block}${after}`;
    status = updated === existingContent ? 'already-current' : 'updated';
  } else if (!hasNoBlock) {
    throw new Error(
      'Invalid spec-first .gitignore managed block: expected no markers or exactly one ordered start/end pair. Repair duplicate or unmatched markers before rerunning init.',
    );
  } else if (existingContent.length === 0) {
    updated = `${block}\n`;
    status = 'added';
  } else {
    const separator = existingContent.endsWith('\n') ? '\n' : '\n\n';
    updated = `${existingContent}${separator}${block}\n`;
    status = 'added';
  }

  const finalContent = ensureFinalNewline(updated);
  if (status === 'already-current' && finalContent !== existingContent) {
    status = 'updated';
  }

  return {
    content: finalContent,
    status,
  };
}

function findLineMarkers(content, marker) {
  const escapedMarker = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [...content.matchAll(new RegExp(`^${escapedMarker}\\r?$`, 'gm'))]
    .map((match) => ({ index: match.index, length: match[0].length }));
}

function ensureFinalNewline(content) {
  return content.endsWith('\n') ? content : `${content}\n`;
}

module.exports = {
  SPEC_FIRST_GITIGNORE_END,
  SPEC_FIRST_GITIGNORE_START,
  applySpecFirstGitignoreBlock,
  buildSpecFirstGitignoreBlock,
  getSpecFirstGitignorePatternMetadata,
  getSpecFirstGitignorePatterns,
  getSpecFirstRuntimeUntrackPatterns,
};
