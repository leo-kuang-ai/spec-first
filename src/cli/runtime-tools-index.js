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

  return normalizeRemovalResult(existing);
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

  if (nextSectionIdx === -1) {
    return before;
  }

  return `${before}${lines.slice(nextSectionIdx).join('\n')}`;
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
