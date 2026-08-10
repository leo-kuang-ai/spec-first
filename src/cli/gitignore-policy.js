'use strict';

const SPEC_FIRST_GITIGNORE_START = '# spec-first:start';
const SPEC_FIRST_GITIGNORE_END = '# spec-first:end';

const SPEC_FIRST_GITIGNORE_SECTIONS = [
  {
    title: 'host-local scratch and settings',
    patterns: [
      '.claude/tasks/',
      '.claude/worktrees/',
      '.qoder/settings.local.json',
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
      'graphify-out/',
      '.graphify/',
    ],
  },
];

function getSpecFirstGitignorePatterns() {
  return SPEC_FIRST_GITIGNORE_SECTIONS.flatMap((section) => section.patterns);
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
  getSpecFirstGitignorePatterns,
};
