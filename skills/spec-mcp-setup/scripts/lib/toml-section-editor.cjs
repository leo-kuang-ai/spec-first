'use strict';

const MANAGED_FIELDS = [
  'command',
  'args',
  'type',
  'env',
  'envFile',
  'cwd',
  'enabled',
  'startup_timeout_sec',
  'startup_timeout_ms',
];
const MANAGED_FIELD_SET = new Set(MANAGED_FIELDS);

function splitLines(text) {
  const lines = [];
  let offset = 0;
  const matcher = /.*?(?:\r\n|\n|\r|$)/g;
  let match;
  while ((match = matcher.exec(text)) !== null) {
    if (match[0] === '' && matcher.lastIndex === text.length) break;
    const raw = match[0];
    const newlineMatch = raw.match(/(\r\n|\n|\r)$/);
    const newline = newlineMatch ? newlineMatch[1] : '';
    const content = newline ? raw.slice(0, -newline.length) : raw;
    lines.push({ raw, content, newline, start: offset, end: offset + raw.length });
    offset += raw.length;
    if (offset >= text.length) break;
  }
  return lines;
}

function detectEol(text) {
  const match = text.match(/\r\n|\n|\r/);
  return match ? match[0] : '\n';
}

function decodeDoubleQuoted(raw) {
  try {
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
}

function parseDottedKey(raw) {
  const parts = [];
  let cursor = 0;
  const skipSpace = () => {
    while (cursor < raw.length && /[ \t]/.test(raw[cursor])) cursor += 1;
  };
  skipSpace();
  while (cursor < raw.length) {
    let value;
    if (raw[cursor] === '"') {
      const start = cursor;
      cursor += 1;
      let escaped = false;
      while (cursor < raw.length) {
        const char = raw[cursor];
        cursor += 1;
        if (escaped) {
          escaped = false;
        } else if (char === '\\') {
          escaped = true;
        } else if (char === '"') {
          break;
        }
      }
      if (raw[cursor - 1] !== '"') return null;
      value = decodeDoubleQuoted(raw.slice(start, cursor));
      if (value === null) return null;
    } else if (raw[cursor] === "'") {
      const end = raw.indexOf("'", cursor + 1);
      if (end === -1) return null;
      value = raw.slice(cursor + 1, end);
      cursor = end + 1;
    } else {
      const match = raw.slice(cursor).match(/^[A-Za-z0-9_-]+/);
      if (!match) return null;
      value = match[0];
      cursor += match[0].length;
    }
    parts.push(value);
    skipSpace();
    if (cursor >= raw.length) break;
    if (raw[cursor] !== '.') return null;
    cursor += 1;
    skipSpace();
    if (cursor >= raw.length) return null;
  }
  return parts.length > 0 ? parts : null;
}

function parseHeaderLine(content) {
  let text = content;
  if (text.startsWith('\uFEFF')) text = text.slice(1);
  const trimmed = text.trimStart();
  if (!trimmed.startsWith('[')) return { headerLike: false };
  const array = trimmed.startsWith('[[');
  const openLength = array ? 2 : 1;
  const closeToken = array ? ']]' : ']';
  let cursor = openLength;
  let quote = null;
  let escaped = false;
  let closeIndex = -1;
  while (cursor < trimmed.length) {
    const char = trimmed[cursor];
    if (escaped) {
      escaped = false;
      cursor += 1;
      continue;
    }
    if (quote === '"' && char === '\\') {
      escaped = true;
      cursor += 1;
      continue;
    }
    if (quote) {
      if (char === quote) quote = null;
      cursor += 1;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      cursor += 1;
      continue;
    }
    if (trimmed.startsWith(closeToken, cursor)) {
      closeIndex = cursor;
      break;
    }
    cursor += 1;
  }
  if (closeIndex === -1 || quote) return { headerLike: true, ok: false };
  const trailing = trimmed.slice(closeIndex + closeToken.length).trim();
  if (trailing !== '' && !trailing.startsWith('#')) return { headerLike: true, ok: false };
  const parts = parseDottedKey(trimmed.slice(openLength, closeIndex));
  if (!parts) return { headerLike: true, ok: false };
  return { headerLike: true, ok: true, array, parts };
}

function scanStringState(content, initialState = null) {
  let state = initialState;
  let cursor = 0;
  let quote = null;
  let escaped = false;
  while (cursor < content.length) {
    if (state) {
      const delimiter = state === 'basic' ? '"""' : "'''";
      const index = content.indexOf(delimiter, cursor);
      if (index === -1) return state;
      if (state === 'basic') {
        let slashes = 0;
        for (let pos = index - 1; pos >= 0 && content[pos] === '\\'; pos -= 1) slashes += 1;
        if (slashes % 2 === 1) {
          cursor = index + 3;
          continue;
        }
      }
      state = null;
      cursor = index + 3;
      continue;
    }

    const char = content[cursor];
    if (escaped) {
      escaped = false;
      cursor += 1;
      continue;
    }
    if (quote === '"' && char === '\\') {
      escaped = true;
      cursor += 1;
      continue;
    }
    if (quote) {
      if (char === quote) quote = null;
      cursor += 1;
      continue;
    }
    if (content.startsWith('"""', cursor)) {
      state = 'basic';
      cursor += 3;
      continue;
    }
    if (content.startsWith("'''", cursor)) {
      state = 'literal';
      cursor += 3;
      continue;
    }
    if (char === '#') break;
    if (char === '"' || char === "'") quote = char;
    cursor += 1;
  }
  return state;
}

function analyzeToml(text) {
  if (typeof text !== 'string') {
    return { ok: false, reason_code: 'toml-input-invalid' };
  }
  const lines = splitLines(text);
  const headers = [];
  let multilineState = null;
  for (const line of lines) {
    if (!multilineState) {
      const parsed = parseHeaderLine(line.content);
      if (parsed.headerLike) {
        if (!parsed.ok) return { ok: false, reason_code: 'toml-grammar-ambiguous' };
        headers.push({
          ...parsed,
          start: line.start,
          header_end: line.end,
          header_text: line.content,
        });
      }
    }
    multilineState = scanStringState(line.content, multilineState);
  }
  if (multilineState) return { ok: false, reason_code: 'toml-grammar-ambiguous' };
  for (let index = 0; index < headers.length; index += 1) {
    headers[index].end = index + 1 < headers.length ? headers[index + 1].start : text.length;
  }
  return {
    ok: true,
    reason_code: 'toml-parsed',
    text,
    eol: detectEol(text),
    bom: text.startsWith('\uFEFF'),
    headers,
  };
}

function targetTables(analysis, key) {
  return analysis.headers.filter((header) =>
    !header.array
    && header.parts.length === 2
    && header.parts[0] === 'mcp_servers'
    && header.parts[1] === key
  );
}

function targetSubtables(analysis, key) {
  return analysis.headers.filter((header) =>
    header.parts.length > 2
    && header.parts[0] === 'mcp_servers'
    && header.parts[1] === key
  );
}

function extractMcpSection(text, key) {
  const analysis = analyzeToml(text);
  if (!analysis.ok) return analysis;
  const matches = targetTables(analysis, key);
  if (matches.length > 1) {
    return { ok: false, reason_code: 'toml-target-table-duplicate' };
  }
  if (matches.length === 0) {
    return { ok: true, found: false, reason_code: 'toml-target-table-missing', section: '' };
  }
  const target = matches[0];
  return {
    ok: true,
    found: true,
    reason_code: 'toml-target-table-found',
    section: text.slice(target.header_end, target.end),
    header: target.header_text,
    range: { start: target.start, header_end: target.header_end, end: target.end },
    analysis,
  };
}

class TomlValueParser {
  constructor(raw) {
    this.raw = raw;
    this.cursor = 0;
  }

  skip() {
    while (this.cursor < this.raw.length) {
      if (/\s/.test(this.raw[this.cursor])) {
        this.cursor += 1;
        continue;
      }
      if (this.raw[this.cursor] === '#') {
        while (this.cursor < this.raw.length && !/[\r\n]/.test(this.raw[this.cursor])) this.cursor += 1;
        continue;
      }
      break;
    }
  }

  parse() {
    this.skip();
    const value = this.parseValue();
    this.skip();
    if (this.cursor !== this.raw.length) throw new Error('TOML value 末尾存在多余内容');
    return value;
  }

  parseValue() {
    this.skip();
    const char = this.raw[this.cursor];
    if (char === '"') return this.parseDoubleString();
    if (char === "'") return this.parseLiteralString();
    if (char === '[') return this.parseArray();
    if (char === '{') return this.parseInlineTable();
    const match = this.raw.slice(this.cursor).match(/^[^\s,\]}#]+/);
    if (!match) throw new Error('缺少 TOML value');
    this.cursor += match[0].length;
    if (match[0] === 'true') return true;
    if (match[0] === 'false') return false;
    if (/^[+-]?(?:\d+(?:_\d+)*(?:\.\d+(?:_\d+)*)?|inf|nan)$/i.test(match[0])) {
      return Number(match[0].replaceAll('_', ''));
    }
    throw new Error('不支持的 TOML scalar');
  }

  parseDoubleString() {
    const start = this.cursor;
    this.cursor += 1;
    let escaped = false;
    while (this.cursor < this.raw.length) {
      const char = this.raw[this.cursor];
      this.cursor += 1;
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') {
        const value = decodeDoubleQuoted(this.raw.slice(start, this.cursor));
        if (value === null) throw new Error('无效的 TOML basic string');
        return value;
      }
    }
    throw new Error('TOML basic string 未终止');
  }

  parseLiteralString() {
    const end = this.raw.indexOf("'", this.cursor + 1);
    if (end === -1) throw new Error('TOML literal string 未终止');
    const value = this.raw.slice(this.cursor + 1, end);
    this.cursor = end + 1;
    return value;
  }

  parseArray() {
    const result = [];
    this.cursor += 1;
    this.skip();
    while (this.raw[this.cursor] !== ']') {
      result.push(this.parseValue());
      this.skip();
      if (this.raw[this.cursor] === ',') {
        this.cursor += 1;
        this.skip();
        if (this.raw[this.cursor] === ']') break;
      } else if (this.raw[this.cursor] !== ']') {
        throw new Error('无效的 TOML array delimiter');
      }
    }
    if (this.raw[this.cursor] !== ']') throw new Error('TOML array 未终止');
    this.cursor += 1;
    return result;
  }

  parseInlineTable() {
    const result = {};
    this.cursor += 1;
    this.skip();
    while (this.raw[this.cursor] !== '}') {
      const keyStart = this.cursor;
      let quote = null;
      while (this.cursor < this.raw.length) {
        const char = this.raw[this.cursor];
        if (quote) {
          if (char === quote && this.raw[this.cursor - 1] !== '\\') quote = null;
        } else if (char === '"' || char === "'") {
          quote = char;
        } else if (char === '=') {
          break;
        }
        this.cursor += 1;
      }
      if (this.raw[this.cursor] !== '=') throw new Error('无效的 TOML inline table key');
      const parts = parseDottedKey(this.raw.slice(keyStart, this.cursor).trim());
      if (!parts || parts.length !== 1) throw new Error('不支持的 TOML inline table key');
      this.cursor += 1;
      const value = this.parseValue();
      result[parts[0]] = value;
      this.skip();
      if (this.raw[this.cursor] === ',') {
        this.cursor += 1;
        this.skip();
      } else if (this.raw[this.cursor] !== '}') {
        throw new Error('无效的 TOML inline table delimiter');
      }
    }
    if (this.raw[this.cursor] !== '}') throw new Error('TOML inline table 未终止');
    this.cursor += 1;
    return result;
  }
}

function assignmentKey(line) {
  let quote = null;
  let escaped = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (quote === '"' && char === '\\') {
      escaped = true;
      continue;
    }
    if (quote) {
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === '#') return null;
    if (char === '=') {
      const parts = parseDottedKey(line.slice(0, index).trim());
      return parts ? { parts, valueIndex: index + 1 } : null;
    }
  }
  return null;
}

function scanValueCompletion(raw) {
  let quote = null;
  let multiline = null;
  let escaped = false;
  let square = 0;
  let curly = 0;
  for (let cursor = 0; cursor < raw.length; cursor += 1) {
    if (multiline) {
      const delimiter = multiline === 'basic' ? '"""' : "'''";
      if (raw.startsWith(delimiter, cursor)) {
        multiline = null;
        cursor += 2;
      }
      continue;
    }
    const char = raw[cursor];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (quote === '"' && char === '\\') {
      escaped = true;
      continue;
    }
    if (quote) {
      if (char === quote) quote = null;
      continue;
    }
    if (raw.startsWith('"""', cursor)) {
      multiline = 'basic';
      cursor += 2;
      continue;
    }
    if (raw.startsWith("'''", cursor)) {
      multiline = 'literal';
      cursor += 2;
      continue;
    }
    if (char === '#') {
      while (cursor < raw.length && !/[\r\n]/.test(raw[cursor])) cursor += 1;
      continue;
    }
    if (char === '"' || char === "'") quote = char;
    else if (char === '[') square += 1;
    else if (char === ']') square -= 1;
    else if (char === '{') curly += 1;
    else if (char === '}') curly -= 1;
    if (square < 0 || curly < 0) return { ok: false };
  }
  return { ok: !quote && !multiline && square === 0 && curly === 0 };
}

function parseManagedAssignments(section, sectionOffset) {
  const lines = splitLines(section);
  const assignments = new Map();
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    const key = assignmentKey(line.content);
    if (!key || key.parts.length !== 1 || !MANAGED_FIELD_SET.has(key.parts[0])) continue;
    if (assignments.has(key.parts[0])) {
      return { ok: false, reason_code: 'toml-target-key-duplicate' };
    }
    let endIndex = lineIndex;
    let rawValue = line.content.slice(key.valueIndex);
    while (!scanValueCompletion(rawValue).ok && endIndex + 1 < lines.length) {
      endIndex += 1;
      rawValue += lines[endIndex - 1].newline + lines[endIndex].content;
    }
    if (!scanValueCompletion(rawValue).ok) {
      return { ok: false, reason_code: 'toml-target-value-ambiguous' };
    }
    let value;
    try {
      value = new TomlValueParser(rawValue).parse();
    } catch (_error) {
      return { ok: false, reason_code: 'toml-target-value-unsupported' };
    }
    assignments.set(key.parts[0], {
      value,
      start: sectionOffset + line.start,
      end: sectionOffset + lines[endIndex].end,
    });
    lineIndex = endIndex;
  }
  return { ok: true, assignments };
}

function normalizeExpected(expected = {}) {
  const result = {};
  for (const field of MANAGED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(expected, field) && expected[field] !== undefined) {
      result[field] = expected[field];
    }
  }
  if (!Array.isArray(result.args)) result.args = [];
  return result;
}

function valuesEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function compareMcpSection(text, key, expected) {
  const extracted = extractMcpSection(text, key);
  if (!extracted.ok) return extracted;
  if (!extracted.found) {
    return { ok: true, matches: false, reason_code: 'toml-target-table-missing' };
  }
  const parsed = parseManagedAssignments(extracted.section, extracted.range.header_end);
  if (!parsed.ok) return parsed;
  const normalized = normalizeExpected(expected);
  for (const [field, value] of Object.entries(normalized)) {
    if (!parsed.assignments.has(field) || !valuesEqual(parsed.assignments.get(field).value, value)) {
      return { ok: true, matches: false, reason_code: 'toml-target-config-drift' };
    }
  }
  for (const field of MANAGED_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(normalized, field) && parsed.assignments.has(field)) {
      return { ok: true, matches: false, reason_code: 'toml-target-config-drift' };
    }
  }
  return { ok: true, matches: true, reason_code: 'toml-target-config-match' };
}

function renderKey(key) {
  return /^[A-Za-z0-9_-]+$/.test(key) ? key : JSON.stringify(key);
}

function renderValue(value) {
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (Array.isArray(value)) return `[${value.map((item) => renderValue(item)).join(', ')}]`;
  if (value && typeof value === 'object') {
    return `{ ${Object.keys(value).sort().map((key) => `${renderKey(key)} = ${renderValue(value[key])}`).join(', ')} }`;
  }
  throw new Error('不支持的 TOML render value');
}

function renderManagedFields(expected, eol) {
  const normalized = normalizeExpected(expected);
  return MANAGED_FIELDS
    .filter((field) => Object.prototype.hasOwnProperty.call(normalized, field))
    .map((field) => `${renderKey(field)} = ${renderValue(normalized[field])}`)
    .join(eol);
}

function upsertMcpSection(text, key, expected) {
  const extracted = extractMcpSection(text, key);
  if (!extracted.ok) return extracted;
  const analysis = extracted.analysis || analyzeToml(text);
  if (!analysis.ok) return analysis;
  if (targetSubtables(analysis, key).length > 0) {
    return { ok: false, reason_code: 'toml-target-subtable-unsupported' };
  }
  const eol = analysis.eol;
  let managed;
  try {
    managed = renderManagedFields(expected, eol);
  } catch (_error) {
    return { ok: false, reason_code: 'toml-target-value-unsupported' };
  }

  if (!extracted.found) {
    const prefix = text.length === 0 || /(?:\r\n|\n|\r)$/.test(text) ? text : `${text}${eol}`;
    const separator = prefix.length === 0 || prefix.endsWith(`${eol}${eol}`) ? '' : eol;
    const header = `[mcp_servers.${renderKey(key)}]`;
    const resultText = `${prefix}${separator}${header}${eol}${managed}${eol}`;
    return { ok: true, changed: true, reason_code: 'toml-target-table-added', text: resultText };
  }

  const parsed = parseManagedAssignments(extracted.section, extracted.range.header_end);
  if (!parsed.ok) return parsed;
  let body = extracted.section;
  const ranges = [...parsed.assignments.values()]
    .map(({ start, end }) => ({
      start: start - extracted.range.header_end,
      end: end - extracted.range.header_end,
    }))
    .sort((left, right) => right.start - left.start);
  for (const range of ranges) {
    body = body.slice(0, range.start) + body.slice(range.end);
  }
  body = body.replace(/^(?:\r\n|\n|\r)+/, '');
  const replacementBody = `${managed}${eol}${body}`;
  const resultText = text.slice(0, extracted.range.header_end)
    + replacementBody
    + text.slice(extracted.range.end);
  const comparison = compareMcpSection(resultText, key, expected);
  if (!comparison.ok || !comparison.matches) {
    return { ok: false, reason_code: comparison.reason_code || 'toml-post-write-verify-failed' };
  }
  return {
    ok: true,
    changed: resultText !== text,
    reason_code: resultText === text ? 'toml-target-config-current' : 'toml-target-table-updated',
    text: resultText,
  };
}

function removeMcpSection(text, key) {
  const extracted = extractMcpSection(text, key);
  if (!extracted.ok) return extracted;
  if (!extracted.found) {
    return { ok: true, changed: false, reason_code: 'toml-target-table-missing', text };
  }
  if (targetSubtables(extracted.analysis, key).length > 0) {
    return { ok: false, reason_code: 'toml-target-subtable-unsupported' };
  }
  let prefix = text.slice(0, extracted.range.start);
  let suffix = text.slice(extracted.range.end);
  const bom = text.startsWith('\uFEFF');
  if (extracted.range.start === 0 && bom && !suffix.startsWith('\uFEFF')) suffix = `\uFEFF${suffix}`;
  const eol = extracted.analysis.eol;
  if (prefix.endsWith(`${eol}${eol}`) && suffix.startsWith(eol)) suffix = suffix.slice(eol.length);
  const resultText = prefix + suffix;
  return { ok: true, changed: true, reason_code: 'toml-target-table-removed', text: resultText };
}

module.exports = {
  compareMcpSection,
  extractMcpSection,
  removeMcpSection,
  upsertMcpSection,
};
