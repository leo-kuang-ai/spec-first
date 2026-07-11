'use strict';

const SOURCE_TRUTH_MARKERS = [
  /\bsource[- ]of[- ]truth\b/i,
  /\bsource of truth\b/i,
  /\bcurrent source\b/i,
  /\bsource directory\b/i,
  /\bnot source\b/i,
  /\bsource fixes?\b/i,
];

function commandSkillLocalResourcePathPattern() {
  return /(^|[^A-Za-z0-9_./@\\-])(@?\.\/)?(references|scripts|assets|prompts|schemas|rule-packs)\//gm;
}

function rewriteCommandSkillLocalResourcePaths(content, runtimeSkillRoot) {
  if (typeof content !== 'string' || typeof runtimeSkillRoot !== 'string') {
    return content;
  }

  const normalizedRuntimeRoot = runtimeSkillRoot
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/\/+$/, '');
  if (normalizedRuntimeRoot.length === 0) {
    return content;
  }

  return content.replace(
    commandSkillLocalResourcePathPattern(),
    (_match, boundary, relativePrefix, resourceRoot) => (
      `${boundary}${relativePrefix || ''}${normalizedRuntimeRoot}/${resourceRoot}/`
    ),
  );
}

function findUnresolvedCommandSkillLocalResourcePaths(content) {
  if (typeof content !== 'string') {
    return [];
  }

  return [...content.matchAll(commandSkillLocalResourcePathPattern())]
    .map((match) => match[3]);
}

function rewriteSourceSkillRuntimePaths(content, skillName, runtimeSkillRoot) {
  if (typeof skillName !== 'string' || skillName.length === 0) {
    return content;
  }

  const sourcePathPattern = new RegExp(
    `(^|[^A-Za-z0-9_./-])skills/${escapeRegExp(skillName)}/`,
    'g',
  );

  return content
    .split(/(\r?\n)/)
    .map((segment) => {
      if (segment === '\n' || segment === '\r\n') {
        return segment;
      }
      if (shouldPreserveSourceSkillPathLine(segment, skillName)) {
        return segment;
      }
      return segment.replace(sourcePathPattern, (_match, prefix) => `${prefix}${runtimeSkillRoot}/`);
    })
    .join('');
}

function shouldPreserveSourceSkillPathLine(line, skillName) {
  if (typeof line !== 'string' || typeof skillName !== 'string' || skillName.length === 0) {
    return false;
  }

  const sourcePath = `skills/${skillName}/`;
  if (!line.includes(sourcePath)) {
    return false;
  }

  if (isOperationalSourceSkillPathLine(line, skillName)) {
    return false;
  }

  return SOURCE_TRUTH_MARKERS.some((marker) => marker.test(line));
}

function isOperationalSourceSkillPathLine(line, skillName) {
  const sourcePath = `skills/${skillName}/`;
  const index = line.indexOf(sourcePath);
  if (index < 0) {
    return false;
  }

  const beforePath = line.slice(0, index);
  if (/\b(Read|Run|Execute|Invoke|Open|Load)\b/i.test(beforePath)) {
    return true;
  }

  if (/^\s*(?:[-*]\s*)?(?:bash|sh|node|python3?|pwsh|powershell|npx|npm)\s+/i.test(line)) {
    return true;
  }

  return /\bfrom\s+the\s+`?$/i.test(beforePath);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  SOURCE_TRUTH_MARKERS,
  findUnresolvedCommandSkillLocalResourcePaths,
  rewriteCommandSkillLocalResourcePaths,
  rewriteSourceSkillRuntimePaths,
  shouldPreserveSourceSkillPathLine,
};
