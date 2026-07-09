const fs = require('node:fs');
const path = require('node:path');
const { writeFileAtomic } = require('./atomic-write');
const { LANG_END, LANG_START } = require('./lang-policy');

const BOOTSTRAP_START = '<!-- spec-first:bootstrap:start -->';
const BOOTSTRAP_END = '<!-- spec-first:bootstrap:end -->';

function writeInstructionBootstrap(projectRoot, adapter, lang = 'zh') {
  const filePath = path.join(projectRoot, adapter.instructionFile);
  const block = buildBootstrapBlock(adapter, lang);

  let existing = '';
  if (fs.existsSync(filePath)) {
    existing = fs.readFileSync(filePath, 'utf8');
  }

  const updated = applyManagedBootstrapBlock(existing, block);
  writeAtomically(filePath, updated);
  console.log(`🧭 Wrote using-spec-first bootstrap to ${adapter.instructionFile}`);
}

function removeInstructionBootstrap(projectRoot, adapter) {
  const filePath = path.join(projectRoot, adapter.instructionFile);
  if (!fs.existsSync(filePath)) {
    return false;
  }

  const existing = fs.readFileSync(filePath, 'utf8');
  const updated = removeManagedBootstrapBlock(existing);
  if (updated === existing) {
    return false;
  }

  writeAtomically(filePath, updated);
  return true;
}

function inspectInstructionBootstrap(projectRoot, adapter) {
  const filePath = path.join(projectRoot, adapter.instructionFile);
  if (!fs.existsSync(filePath)) {
    return {
      status: 'missing',
      message: `${adapter.instructionFile} is missing`,
    };
  }

  const existing = fs.readFileSync(filePath, 'utf8');
  const legacyStartIdx = existing.indexOf(BOOTSTRAP_START);
  const legacyEndIdx = existing.indexOf(BOOTSTRAP_END);

  if (legacyStartIdx !== -1 || legacyEndIdx !== -1) {
    if (legacyStartIdx === -1 || legacyEndIdx === -1 || legacyEndIdx <= legacyStartIdx) {
      return {
        status: 'partial',
        message: 'legacy bootstrap markers are incomplete',
      };
    }

    return {
      status: 'drifted',
      message: 'standalone bootstrap block should be merged into the spec-first:lang block',
    };
  }

  const langStartIdx = existing.indexOf(LANG_START);
  const langEndIdx = existing.indexOf(LANG_END);

  if (langStartIdx === -1 && langEndIdx === -1) {
    return {
      status: 'missing',
      message: 'managed language/governance block missing',
    };
  }

  if (langStartIdx === -1 || langEndIdx === -1 || langEndIdx <= langStartIdx) {
    return {
      status: 'partial',
      message: 'managed language/governance markers are incomplete',
    };
  }

  const actual = existing.slice(langStartIdx, langEndIdx + LANG_END.length);
  if (actual.includes('`using-spec-first`') &&
    actual.includes('skills/using-spec-first/SKILL.md')) {
    return {
      status: 'installed',
      message: 'workflow entry guidance present in the spec-first:lang block',
    };
  }

  return {
    status: 'drifted',
    message: 'workflow entry guidance missing from the spec-first:lang block',
  };
}

function applyManagedBootstrapBlock(existing, block) {
  const startIdx = existing.indexOf(BOOTSTRAP_START);
  const endIdx = existing.indexOf(BOOTSTRAP_END);

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const before = existing.slice(0, startIdx);
    const after = existing.slice(endIdx + BOOTSTRAP_END.length);
    return `${before}${block}${after}`;
  }

  // Strip spec-first's own prior content before appending, so a legacy managed section is
  // not duplicated by the freshly appended block on re-init. How aggressively depends on
  // the evidence that the file was spec-first-managed:
  // - A dangling marker (corrupted) proves prior management, so the full heuristic is safe
  //   (exact bodies + explicit legacy heading + generic governance heading with >=2 anchors).
  // - With NO markers there is no such proof, so only remove unambiguous spec-first content
  //   (exact known bodies and the explicit "(managed by spec-first)" heading). A generic
  //   heading like "## Workflow Entry Governance" that merely shares anchor phrases is left
  //   alone: a possible duplicate is recoverable, but deleting a user-authored section is not.
  const corrupted = startIdx !== -1 || endIdx !== -1;
  const cleaned = corrupted
    ? stripKnownBootstrapBodies(stripStandaloneMarkerLines(existing))
    : stripKnownBootstrapBodies(existing, { legacyHeadingsOnly: true });
  if (cleaned.length === 0) {
    return block;
  }

  const separator = cleaned.endsWith('\n') ? '\n' : '\n\n';
  return `${cleaned}${separator}${block}\n`;
}

function removeManagedBootstrapBlock(existing) {
  const startIdx = existing.indexOf(BOOTSTRAP_START);
  const endIdx = existing.indexOf(BOOTSTRAP_END);

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const before = existing.slice(0, startIdx);
    const after = existing.slice(endIdx + BOOTSTRAP_END.length);
    return normalizeRemovalResult(`${before}${after}`);
  }

  if (startIdx !== -1 || endIdx !== -1) {
    return normalizeRemovalResult(stripKnownBootstrapBodies(stripStandaloneMarkerLines(existing)));
  }

  return normalizeRemovalResult(existing);
}

function buildBootstrapBlock(adapterOrId, lang = 'zh') {
  const hostId = typeof adapterOrId === 'string' ? adapterOrId : adapterOrId.id;
  const body = lang === 'en'
    ? buildEnBootstrapBody(hostId)
    : buildZhBootstrapBody(hostId);
  return `${BOOTSTRAP_START}\n${body}\n${BOOTSTRAP_END}`;
}

function buildZhBootstrapBody(hostId) {
  return `## Workflow 入口治理

- 本 block 只提供 \`using-spec-first\` source pointer；完整入口路由与边界在 \`skills/using-spec-first/SKILL.md\``;
}

function buildEnBootstrapBody(hostId) {
  return `## Workflow Entry Governance

- This block is only a \`using-spec-first\` source pointer; the full entry routing map and boundaries live in \`skills/using-spec-first/SKILL.md\``;
}

function stripStandaloneMarkerLines(content) {
  return content
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      return trimmed !== BOOTSTRAP_START && trimmed !== BOOTSTRAP_END;
    })
    .join('\n');
}

function stripKnownBootstrapBodies(content, { legacyHeadingsOnly = false } = {}) {
  let next = content;
  for (const body of buildKnownBootstrapBodies()) {
    next = next
      .replace(`\n${body}\n`, '\n')
      .replace(`\n${body}`, '\n')
      .replace(`${body}\n`, '')
      .replace(body, '');
  }
  return stripManagedBootstrapSections(next, { legacyHeadingsOnly });
}

function buildKnownBootstrapBodies() {
  const bodies = [];
  for (const hostId of ['claude', 'codex', 'cursor', 'kiro', 'qoder']) {
    bodies.push(buildZhBootstrapBody(hostId));
    bodies.push(buildEnBootstrapBody(hostId));
  }
  return [...new Set(bodies)];
}

function stripManagedBootstrapSections(content, { legacyHeadingsOnly = false } = {}) {
  const lines = content.split('\n');
  const next = [];

  for (let index = 0; index < lines.length; index += 1) {
    const skipTo = matchManagedBootstrapSection(lines, index, { legacyHeadingsOnly });
    if (skipTo !== -1) {
      index = skipTo - 1;
      continue;
    }

    next.push(lines[index]);
  }

  return next.join('\n');
}

function matchManagedBootstrapSection(lines, startIndex, { legacyHeadingsOnly = false } = {}) {
  const heading = lines[startIndex] ? lines[startIndex].trim() : '';
  const knownHeadings = [
    '## Workflow 入口治理',
    '## Workflow 入口治理（由 spec-first 管理）',
    '## Workflow Entry Governance',
    '## Workflow Entry Governance (managed by spec-first)',
  ];
  if (!knownHeadings.includes(heading)) {
    return -1;
  }

  // No-marker callers (legacyHeadingsOnly) only strip the unambiguous explicit
  // "(managed by spec-first)" headings; a generic governance heading is left for the user.
  if (legacyHeadingsOnly && !isLegacyManagedBootstrapHeading(heading)) {
    return -1;
  }

  let index = startIndex + 1;
  if (index < lines.length && lines[index].trim() === '') {
    index += 1;
  }

  let bulletCount = 0;
  let managedAnchorCount = 0;
  while (index < lines.length && lines[index].trim().startsWith('- ')) {
    if (isManagedBootstrapAnchor(lines[index])) {
      managedAnchorCount += 1;
    }
    bulletCount += 1;
    index += 1;
  }

  if (isLegacyManagedBootstrapHeading(heading)) {
    return bulletCount >= 1 ? index : -1;
  }

  return (bulletCount >= 4 && managedAnchorCount >= 2) || hasCurrentBootstrapAnchor(lines, startIndex + 1, index)
    ? index
    : -1;
}

function isLegacyManagedBootstrapHeading(heading) {
  return heading === '## Workflow 入口治理（由 spec-first 管理）' ||
    heading === '## Workflow Entry Governance (managed by spec-first)';
}

function isManagedBootstrapAnchor(line) {
  return line.includes('using-spec-first') ||
    line.includes('spec-brainstorm') ||
    line.includes('Common entry anchors') ||
    line.includes('常见入口锚点') ||
    line.includes('minimal entry anchor') ||
    line.includes('最小入口锚点') ||
    line.includes('L0 startup anchor') ||
    line.includes('L0 启动锚点') ||
    line.includes('source pointer') ||
    line.includes('spec-write-tasks') ||
    line.includes('internal-only skills') ||
    line.includes('workflow entry reminder') ||
    line.includes('workflow 入口提醒') ||
    line.includes('外部 issue/PR 输入') ||
    line.includes('External issue/PR inputs');
}

function hasCurrentBootstrapAnchor(lines, startIndex, endIndex) {
  for (let index = startIndex; index < endIndex; index += 1) {
    const line = lines[index] || '';
    if (line.includes('L0 startup anchor') ||
      line.includes('L0 启动锚点') ||
      line.includes('source pointer')) {
      return true;
    }
  }
  return false;
}

function normalizeRemovalResult(content) {
  return content
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\n+/, '')
    .replace(/\n+$/, '\n');
}

function writeAtomically(filePath, contents) {
  writeFileAtomic(filePath, contents);
}

module.exports = {
  BOOTSTRAP_END,
  BOOTSTRAP_START,
  applyManagedBootstrapBlock,
  buildBootstrapBlock,
  inspectInstructionBootstrap,
  removeInstructionBootstrap,
  removeManagedBootstrapBlock,
  writeInstructionBootstrap,
};
