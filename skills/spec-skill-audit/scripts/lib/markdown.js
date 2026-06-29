'use strict';

const path = require('node:path');

const { parseSimpleFrontmatterFields, splitMarkdownFrontmatter } = require('./frontmatter');
const { repoRelative, toPosixPath } = require('./path-rules');

const LOCAL_LINK_PATTERN = /\[[^\]]+\]\(([^)]+)\)/g;
const CODE_BLOCK_PATTERN = /```([^\n`]*)\n([\s\S]*?)```/g;
const CODE_SPAN_PATTERN = /`([^`\n]+)`/g;
const PATH_REFERENCE_PATTERN = /(?:^|[\s(["'`])((?:\.{1,2}\/|[A-Za-z0-9_.-]+\/)[A-Za-z0-9_./-]+\.[A-Za-z0-9_-]+|\.spec-first\/[A-Za-z0-9_./-]+|skills\/[A-Za-z0-9_./-]+|templates\/[A-Za-z0-9_./-]+|src\/[A-Za-z0-9_./-]+)/g;

function parseSkillMarkdown(content, options = {}) {
  const skillDir = options.skillDir || process.cwd();
  const repoRoot = options.repoRoot || process.cwd();
  const warnings = [];
  const split = splitMarkdownFrontmatter(content);
  const parsedFrontmatter = parseSimpleFrontmatterFields(split.frontmatter);

  if (!split.hasFrontmatter) {
    warnings.push({ code: split.warning || 'MISSING_FRONTMATTER' });
  }
  warnings.push(...parsedFrontmatter.warnings);

  const body = split.body;
  const headings = extractHeadings(body);
  const sections = extractSections(body, headings);
  const codeBlocks = extractCodeBlocks(body);
  const links = extractLocalLinks(body, skillDir, repoRoot, codeBlocks);
  const pathReferences = extractPathReferences(content);

  return {
    frontmatter: parsedFrontmatter.fields,
    has_frontmatter: split.hasFrontmatter,
    body,
    headings,
    sections,
    links,
    code_blocks: codeBlocks,
    path_references: pathReferences,
    declared_inputs: extractDeclaredPaths(sections, 'inputs'),
    declared_outputs: extractDeclaredPaths(sections, 'outputs'),
    estimated_tokens: estimateTokens(content),
    parser_warnings: warnings,
  };
}

function extractHeadings(body) {
  const headings = [];
  const lines = String(body || '').split(/\r?\n/);

  for (const [index, line] of lines.entries()) {
    const match = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (!match) continue;

    headings.push({
      level: match[1].length,
      title: match[2].trim(),
      normalized: normalizeHeading(match[2]),
      line: index + 1,
    });
  }

  return headings;
}

function extractSections(body, headings) {
  const lines = String(body || '').split(/\r?\n/);
  const sections = [];

  for (let index = 0; index < headings.length; index += 1) {
    const heading = headings[index];
    const next = headings.slice(index + 1).find((candidate) => candidate.level <= heading.level);
    const startLine = heading.line;
    const endLine = next ? next.line - 1 : lines.length;
    sections.push({
      title: heading.title,
      normalized: heading.normalized,
      level: heading.level,
      start_line: startLine,
      end_line: endLine,
      text: lines.slice(startLine, endLine).join('\n').trim(),
    });
  }

  return sections;
}

function extractLocalLinks(body, skillDir, repoRoot, codeBlocks = []) {
  const links = [];
  const text = String(body || '');
  let match;

  // 代码块行区间集合:落在其中的 markdown 链接不算真实本地链接(R-40)
  const codeBlockLineRanges = (codeBlocks || []).map((block) => {
    const startLine = block.line;
    const blockLineCount = String(block.text || '').split(/\r?\n/).length;
    // block.line 是 ``` 起始行;块体加首尾围栏约占 blockLineCount + 2 行
    return { start: startLine, end: startLine + blockLineCount + 1 };
  });
  const isInCodeBlock = (line) => codeBlockLineRanges.some((r) => line >= r.start && line <= r.end);

  while ((match = LOCAL_LINK_PATTERN.exec(text)) !== null) {
    const rawTarget = match[1].trim();
    if (isExternalLink(rawTarget) || rawTarget.startsWith('#')) continue;

    // 跳过 {url}/{older_url} 等 placeholder:含 {...} 占位的 target 不是本地路径(R-40)
    if (/\{[^}]*\}/.test(rawTarget)) continue;

    // 跳过代码块内链接:示例代码里的 markdown 链接不是真实本地引用(R-40)
    const line = text.slice(0, match.index).split(/\r?\n/).length;
    if (isInCodeBlock(line)) continue;

    const cleanTarget = rawTarget.split('#')[0].trim();
    if (!cleanTarget) continue;

    const absoluteTarget = path.resolve(skillDir, cleanTarget);
    links.push({
      target: toPosixPath(rawTarget),
      resolved_path: repoRelative(repoRoot, absoluteTarget),
      exists: false,
    });
  }

  return links;
}

function extractCodeBlocks(body) {
  const blocks = [];
  let match;

  while ((match = CODE_BLOCK_PATTERN.exec(String(body || ''))) !== null) {
    blocks.push({
      language: match[1].trim(),
      text: match[2],
      line: String(body || '').slice(0, match.index).split(/\r?\n/).length,
    });
  }

  return blocks;
}

function extractPathReferences(content) {
  const found = new Set();
  let match;
  const text = String(content || '');

  while ((match = PATH_REFERENCE_PATTERN.exec(text)) !== null) {
    found.add(toPosixPath(match[1]));
  }

  while ((match = CODE_SPAN_PATTERN.exec(text)) !== null) {
    const value = match[1].trim();
    if (/^(?:\.spec-first|skills|templates|src|docs|tests)\//.test(value)) {
      found.add(toPosixPath(value));
    }
  }

  return [...found].sort((a, b) => a.localeCompare(b));
}

function extractDeclaredPaths(sections, sectionName) {
  const normalizedName = normalizeHeading(sectionName);
  const matchedSections = Array.isArray(sections)
    ? sections.filter((section) => section.normalized === normalizedName)
    : Object.values(sections || {}).filter((section) => section.normalized === normalizedName);
  if (matchedSections.length === 0) return [];
  return [...new Set(matchedSections.flatMap((section) => extractPathReferences(section.text)))].sort((left, right) =>
    left.localeCompare(right),
  );
}

function estimateTokens(content) {
  const text = String(content || '').trim();
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

function normalizeHeading(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[`*_]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function hasSection(parsed, names) {
  const normalizedNames = names.map(normalizeHeading);
  const sections = Array.isArray(parsed.sections) ? parsed.sections : Object.values(parsed.sections || {});
  return normalizedNames.some((name) => sections.some((section) => section.normalized === name));
}

function getSectionText(parsed, names) {
  const normalizedNames = names.map(normalizeHeading);
  const sections = Array.isArray(parsed.sections) ? parsed.sections : Object.values(parsed.sections || {});
  return sections
    .filter((section) => normalizedNames.includes(section.normalized))
    .map((section) => section.text)
    .join('\n\n');
}

function isExternalLink(target) {
  return /^(?:https?:|mailto:|tel:)/i.test(target);
}

module.exports = {
  estimateTokens,
  extractDeclaredPaths,
  extractHeadings,
  extractLocalLinks,
  extractPathReferences,
  getSectionText,
  hasSection,
  normalizeHeading,
  parseSkillMarkdown,
};
