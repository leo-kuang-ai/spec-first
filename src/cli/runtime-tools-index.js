const RUNTIME_TOOLS_START = '<!-- spec-first:runtime-tools:start -->';
const RUNTIME_TOOLS_END = '<!-- spec-first:runtime-tools:end -->';

function removeManagedRuntimeToolsBlock(existing) {
  const startIdx = existing.indexOf(RUNTIME_TOOLS_START);
  const endIdx = existing.indexOf(RUNTIME_TOOLS_END);

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const before = existing.slice(0, startIdx);
    const after = existing.slice(endIdx + RUNTIME_TOOLS_END.length);
    return normalizeRemovalResult(`${before}${after}`);
  }

  if (startIdx !== -1) {
    return normalizeRemovalResult(removePartialBlockFromStart(existing, startIdx));
  }

  if (endIdx !== -1) {
    return normalizeRemovalResult(stripStandaloneMarkerLines(existing));
  }

  // Nothing was removed, so there is no seam to normalize. Reformatting here would rewrite
  // unrelated user prose in CLAUDE.md / AGENTS.md on every init and clean.
  return existing;
}

function removePartialBlockFromStart(content, startIdx) {
  const before = content.slice(0, startIdx);
  const afterStart = content.slice(startIdx + RUNTIME_TOOLS_START.length);
  const lines = afterStart.split('\n');
  const nextSectionIdx = lines.findIndex((line, index) => {
    if (index === 0) return false;
    const trimmed = line.trim();
    return /^#{1,6}\s+/.test(trimmed) && !isRetiredRuntimeToolsHeading(trimmed);
  });

  // No following heading means the managed region has no provable end. Only delete the
  // tail when the block still opens with a heading we generated; otherwise the content is
  // unattributable and stays with the user, with just the orphaned marker stripped.
  if (nextSectionIdx === -1) {
    return startsWithRetiredRuntimeToolsHeading(lines) ? before : `${before}${afterStart}`;
  }

  return `${before}${lines.slice(nextSectionIdx).join('\n')}`;
}

function startsWithRetiredRuntimeToolsHeading(linesAfterStart) {
  const firstContentLine = linesAfterStart.find((line) => line.trim() !== '');
  return firstContentLine !== undefined && isRetiredRuntimeToolsHeading(firstContentLine.trim());
}

function isRetiredRuntimeToolsHeading(line) {
  return /^#{1,6}\s+(Runtime Code Intelligence Tools|Runtime Tools|代码智能与运行时工具)\s*$/.test(line);
}

function stripStandaloneMarkerLines(content) {
  return content
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      return trimmed !== RUNTIME_TOOLS_START && trimmed !== RUNTIME_TOOLS_END;
    })
    .join('\n');
}

function normalizeRemovalResult(content) {
  return content
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\n+/, '')
    .replace(/\n+$/, '\n');
}

module.exports = {
  RUNTIME_TOOLS_END,
  RUNTIME_TOOLS_START,
  removeManagedRuntimeToolsBlock,
};
