const fs = require('node:fs');
const path = require('node:path');
const {
  buildManagedBlock,
  inspectMarkerStructure,
  LANG_END,
  LANG_START,
} = require('./lang-policy');

const BOOTSTRAP_START = '<!-- spec-first:bootstrap:start -->';
const BOOTSTRAP_END = '<!-- spec-first:bootstrap:end -->';
const LEGACY_BOOTSTRAP_BODIES = [
  `## Workflow 入口治理

- 本 block 只提供 \`using-spec-first\` source pointer；完整入口路由与边界在 \`skills/using-spec-first/SKILL.md\``,
  `## Workflow Entry Governance

- This block is only a \`using-spec-first\` source pointer; the full entry routing map and boundaries live in \`skills/using-spec-first/SKILL.md\``,
];

function inspectInstructionBootstrap(projectRoot, adapter) {
  const filePath = path.join(projectRoot, adapter.instructionFile);
  if (!fs.existsSync(filePath)) {
    return {
      status: 'missing',
      message: `${adapter.instructionFile} is missing`,
    };
  }

  const existing = fs.readFileSync(filePath, 'utf8');
  const legacyMarkers = inspectMarkerStructure(existing, BOOTSTRAP_START, BOOTSTRAP_END);

  if (!legacyMarkers.absent) {
    if (!legacyMarkers.valid) {
      return {
        status: 'partial',
        message: 'legacy bootstrap markers must form exactly one balanced pair',
      };
    }

    return {
      status: 'drifted',
      message: 'standalone bootstrap block should be merged into the spec-first:lang block',
    };
  }

  const langMarkers = inspectMarkerStructure(existing, LANG_START, LANG_END);

  if (langMarkers.absent) {
    return {
      status: 'missing',
      message: 'managed language/governance block missing',
    };
  }

  if (!langMarkers.valid) {
    return {
      status: 'partial',
      message: 'managed language/governance markers must form exactly one balanced pair',
    };
  }

  const actual = existing.slice(langMarkers.startIdx, langMarkers.endIdx + LANG_END.length);
  const comparableActual = actual.replace(/\r\n/g, '\n');
  if (![buildManagedBlock('zh'), buildManagedBlock('en')].includes(comparableActual)) {
    return {
      status: 'drifted',
      message: 'managed language/governance block drifted from expected content',
    };
  }

  const runtimeSkillPath = path.posix.join(
    adapter.skillsRoot,
    'using-spec-first',
    'SKILL.md',
  );
  const runtimeSkillAbsolutePath = path.join(projectRoot, runtimeSkillPath);
  if (!isFile(runtimeSkillAbsolutePath)) {
    return {
      status: 'missing',
      message: `${runtimeSkillPath} is missing`,
    };
  }

  return {
    status: 'installed',
    message: 'workflow entry guidance and installed using-spec-first runtime are present',
  };
}

function isFile(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
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

  return normalizeRemovalResult(stripKnownBootstrapBodies(existing, { legacyHeadingsOnly: true }));
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
  for (const body of LEGACY_BOOTSTRAP_BODIES) {
    next = next
      .replace(`\n${body}\n`, '\n')
      .replace(`\n${body}`, '\n')
      .replace(`${body}\n`, '')
      .replace(body, '');
  }
  return stripManagedBootstrapSections(next, { legacyHeadingsOnly });
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

module.exports = {
  inspectInstructionBootstrap,
  removeManagedBootstrapBlock,
};
