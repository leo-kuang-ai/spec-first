'use strict';

function normalizeNewlines(text) {
  return String(text).replace(/\r\n?/g, '\n');
}

function splitMarkdownFrontmatter(content) {
  const normalized = normalizeNewlines(content);
  const lines = normalized.split('\n');

  if (lines[0] !== '---') {
    return {
      frontmatter: '',
      body: normalized,
      removedFrontmatter: false,
      error: null,
    };
  }

  const closingIndex = lines.findIndex((line, index) => index > 0 && line === '---');
  if (closingIndex === -1) {
    return {
      frontmatter: '',
      body: '',
      removedFrontmatter: false,
      error: {
        code: 'frontmatter-invalid',
        message: 'Frontmatter starts with --- but has no closing --- line.',
      },
    };
  }

  return {
    frontmatter: lines.slice(1, closingIndex).join('\n'),
    body: lines.slice(closingIndex + 1).join('\n'),
    removedFrontmatter: true,
    error: null,
  };
}

function inspectMarkdownFrontmatter(content) {
  const text = String(content);
  const lines = lineRecords(text);
  if (lines.length === 0 || lines[0].content !== '---') {
    return {
      text,
      frontmatter: '',
      body: text,
      removedFrontmatter: false,
      occurrences: [],
      error: null,
    };
  }

  const closingIndex = lines.findIndex((line, index) => index > 0 && line.content === '---');
  if (closingIndex === -1) {
    return {
      text,
      frontmatter: '',
      body: '',
      removedFrontmatter: false,
      occurrences: [],
      error: {
        code: 'frontmatter-invalid',
        message: 'Frontmatter starts with --- but has no closing --- line.',
      },
    };
  }

  const frontmatterStart = lines[0].end;
  const frontmatterEnd = lines[closingIndex].start;
  const bodyStart = lines[closingIndex].end;
  const frontmatter = text.slice(frontmatterStart, frontmatterEnd);
  return {
    text,
    frontmatter,
    body: text.slice(bodyStart),
    removedFrontmatter: true,
    occurrences: parseFrontmatterScalarOccurrences(frontmatter, { offset: frontmatterStart }),
    error: null,
  };
}

function parseFrontmatterScalarOccurrences(frontmatter, options = {}) {
  const text = String(frontmatter || '');
  const offset = Number.isInteger(options.offset) ? options.offset : 0;
  const occurrences = [];

  for (const line of lineRecords(text)) {
    const match = /^([A-Za-z0-9_-]+)([ \t]*):([ \t]*)(.*)$/.exec(line.content);
    if (!match) continue;

    const key = match[1];
    const rawScalar = match[4];
    const scalarStart = line.start + match[1].length + match[2].length + 1 + match[3].length;
    const parsed = parseScalar(rawScalar, scalarStart, match[3].length > 0);
    occurrences.push({
      key,
      value: parsed.value,
      raw_value: rawScalar,
      quote: parsed.quote,
      comment: parsed.comment,
      line_start: offset + line.start,
      line_end: offset + line.contentEnd,
      value_start: offset + parsed.valueStart,
      value_end: offset + parsed.valueEnd,
    });
  }

  return occurrences;
}

function parseFrontmatterScalars(frontmatter) {
  const metadata = {};
  for (const occurrence of parseFrontmatterScalarOccurrences(frontmatter)) {
    metadata[occurrence.key] = occurrence.value;
  }
  return metadata;
}

function parseScalar(rawScalar, scalarStart, hasSeparator = false) {
  if (hasSeparator && rawScalar.startsWith('#')) {
    return {
      value: '',
      quote: null,
      comment: rawScalar,
      valueStart: scalarStart,
      valueEnd: scalarStart,
    };
  }

  const quoted = /^("|')([\s\S]*?)\1([ \t]*)(#.*)?$/.exec(rawScalar);
  if (quoted) {
    return {
      value: quoted[2],
      quote: quoted[1],
      comment: quoted[4] || null,
      valueStart: scalarStart + 1,
      valueEnd: scalarStart + 1 + quoted[2].length,
    };
  }

  const commentMatch = /[ \t]+#/.exec(rawScalar);
  const withoutComment = commentMatch ? rawScalar.slice(0, commentMatch.index) : rawScalar;
  const value = withoutComment.trim();
  const leadingLength = withoutComment.length - withoutComment.trimStart().length;
  return {
    value,
    quote: null,
    comment: commentMatch ? rawScalar.slice(commentMatch.index).trimStart() : null,
    valueStart: scalarStart + leadingLength,
    valueEnd: scalarStart + leadingLength + value.length,
  };
}

function lineRecords(text) {
  if (text.length === 0) return [];
  const lines = [];
  let start = 0;
  while (start < text.length) {
    let contentEnd = start;
    while (contentEnd < text.length && text[contentEnd] !== '\n' && text[contentEnd] !== '\r') {
      contentEnd += 1;
    }
    let end = contentEnd;
    if (text[end] === '\r' && text[end + 1] === '\n') end += 2;
    else if (text[end] === '\r' || text[end] === '\n') end += 1;
    lines.push({
      content: text.slice(start, contentEnd),
      start,
      contentEnd,
      end,
    });
    start = end;
  }
  return lines;
}

module.exports = {
  inspectMarkdownFrontmatter,
  normalizeNewlines,
  parseFrontmatterScalarOccurrences,
  parseFrontmatterScalars,
  splitMarkdownFrontmatter,
};
