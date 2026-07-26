const CODING_GUIDELINES_START = '<!-- spec-first:coding-guidelines:start -->';
const CODING_GUIDELINES_END = '<!-- spec-first:coding-guidelines:end -->';

function removeManagedCodingGuidelinesBlock(existing) {
  const startIdx = existing.indexOf(CODING_GUIDELINES_START);
  const endIdx = existing.indexOf(CODING_GUIDELINES_END);

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const before = existing.slice(0, startIdx);
    const after = existing.slice(endIdx + CODING_GUIDELINES_END.length);
    return normalizeRemovalResult(`${before}${after}`);
  }

  if (startIdx !== -1 || endIdx !== -1) {
    return normalizeRemovalResult(stripStandaloneMarkerLines(existing));
  }

  // Nothing was removed, so there is no seam to normalize. Reformatting here would rewrite
  // unrelated user prose in CLAUDE.md / AGENTS.md on every init and clean.
  return existing;
}

function stripStandaloneMarkerLines(content) {
  return content
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      return trimmed !== CODING_GUIDELINES_START && trimmed !== CODING_GUIDELINES_END;
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
  CODING_GUIDELINES_END,
  CODING_GUIDELINES_START,
  removeManagedCodingGuidelinesBlock,
};
