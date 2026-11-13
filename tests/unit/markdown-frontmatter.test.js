'use strict';

const {
  formatFrontmatterScalar,
  inspectMarkdownFrontmatter,
  normalizeNewlines,
  parseFrontmatterScalarOccurrences,
  parseFrontmatterScalars,
  splitMarkdownFrontmatter,
} = require('../../src/cli/helpers/markdown-frontmatter');

describe('markdown-frontmatter splitMarkdownFrontmatter', () => {
  test('parses a normal frontmatter block and returns the body after the closing delimiter', () => {
    const source = '---\nname: sample\ndescription: plain\n---\n\n# Body\n';

    expect(splitMarkdownFrontmatter(source)).toEqual({
      frontmatter: 'name: sample\ndescription: plain',
      body: '\n# Body\n',
      removedFrontmatter: true,
      error: null,
    });
  });

  test('treats content without a leading --- line as pure body', () => {
    const source = 'Intro text\n---\nkey: not-frontmatter\n';

    expect(splitMarkdownFrontmatter(source)).toEqual({
      frontmatter: '',
      body: source,
      removedFrontmatter: false,
      error: null,
    });
  });

  test('does not accept ---- or body-level --- lines as the opening delimiter', () => {
    const source = '----\nname: sample\n---\nbody';

    expect(splitMarkdownFrontmatter(source)).toEqual({
      frontmatter: '',
      body: source,
      removedFrontmatter: false,
      error: null,
    });
  });

  test('returns frontmatter-invalid when the opening --- is never closed', () => {
    const result = splitMarkdownFrontmatter('---\nname: sample\n# body without closing fence');

    expect(result.error).toEqual({
      code: 'frontmatter-invalid',
      message: 'Frontmatter starts with --- but has no closing --- line.',
    });
    expect(result.frontmatter).toBe('');
    expect(result.body).toBe('');
    expect(result.removedFrontmatter).toBe(false);
  });

  test('normalizes CRLF and lone CR newlines before splitting', () => {
    const expected = {
      frontmatter: 'name: sample',
      body: 'Body',
      removedFrontmatter: true,
      error: null,
    };

    expect(splitMarkdownFrontmatter('---\r\nname: sample\r\n---\r\nBody')).toEqual(expected);
    expect(splitMarkdownFrontmatter('---\rname: sample\r---\rBody')).toEqual(expected);
  });

  test('accepts the closing --- as the final line and returns an empty body', () => {
    expect(splitMarkdownFrontmatter('---\nname: sample\n---')).toEqual({
      frontmatter: 'name: sample',
      body: '',
      removedFrontmatter: true,
      error: null,
    });
  });

  test('returns an empty body without error for an empty document', () => {
    expect(splitMarkdownFrontmatter('')).toEqual({
      frontmatter: '',
      body: '',
      removedFrontmatter: false,
      error: null,
    });
  });

  // A leading UTF-8 BOM is consumed at module entry so BOM-saved Markdown
  // files keep their frontmatter; callers hand us raw utf8 reads.
  test('strips a leading BOM and still detects frontmatter', () => {
    const source = '\uFEFF---\nname: sample\n---\nBody';
    const result = splitMarkdownFrontmatter(source);

    expect(result.removedFrontmatter).toBe(true);
    expect(result.error).toBeNull();
    expect(result.frontmatter).toBe('name: sample');
    expect(result.body).toBe('Body');
  });
});

describe('markdown-frontmatter inspectMarkdownFrontmatter', () => {
  test('returns byte-accurate occurrence records whose offsets slice the original text', () => {
    const doc = '---\nname: sample\n---\n\n# Body';
    const result = inspectMarkdownFrontmatter(doc);

    expect(result.text).toBe(doc);
    expect(result.removedFrontmatter).toBe(true);
    expect(result.error).toBeNull();
    expect(result.frontmatter).toBe('name: sample\n');
    expect(result.body).toBe('\n# Body');
    expect(result.occurrences).toEqual([
      {
        key: 'name',
        value: 'sample',
        raw_value: 'sample',
        quote: null,
        comment: null,
        line_start: 4,
        line_end: 16,
        value_start: 10,
        value_end: 16,
      },
    ]);
    expect(doc.slice(result.occurrences[0].value_start, result.occurrences[0].value_end)).toBe('sample');
  });

  test('decodes quoted values and points value offsets inside the quotes', () => {
    const doc = '---\nname: "spec-first"\nowner: \'owner\'\'s\'\n---\n# Title';
    const result = inspectMarkdownFrontmatter(doc);
    const occurrences = result.occurrences;

    expect(occurrences.map((entry) => [entry.key, entry.value])).toEqual([
      ['name', 'spec-first'],
      ['owner', "owner's"],
    ]);
    expect(doc.slice(occurrences[0].value_start, occurrences[0].value_end)).toBe('spec-first');
    expect(doc.slice(occurrences[1].value_start, occurrences[1].value_end)).toBe("owner''s");
    expect(occurrences[1].quote).toBe("'");
  });

  test('preserves original CRLF text while keeping offsets valid', () => {
    const doc = '---\r\nname: sample\r\n---\r\nBody';
    const result = inspectMarkdownFrontmatter(doc);

    expect(result.text).toBe(doc);
    expect(result.frontmatter).toBe('name: sample\r\n');
    expect(result.body).toBe('Body');
    expect(result.occurrences).toEqual([
      {
        key: 'name',
        value: 'sample',
        raw_value: 'sample',
        quote: null,
        comment: null,
        line_start: 5,
        line_end: 17,
        value_start: 11,
        value_end: 17,
      },
    ]);
  });

  test('returns no occurrences and no error for an empty document', () => {
    expect(inspectMarkdownFrontmatter('')).toEqual({
      text: '',
      frontmatter: '',
      body: '',
      removedFrontmatter: false,
      occurrences: [],
      error: null,
    });
  });

  test('reports frontmatter-invalid for an unclosed block', () => {
    const result = inspectMarkdownFrontmatter('---\nname: sample');

    expect(result.error).toEqual({
      code: 'frontmatter-invalid',
      message: 'Frontmatter starts with --- but has no closing --- line.',
    });
    expect(result.occurrences).toEqual([]);
    expect(result.removedFrontmatter).toBe(false);
  });

  test('strips a leading BOM and still detects frontmatter (inspect)', () => {
    const result = inspectMarkdownFrontmatter('\uFEFF---\nname: sample\n---\nBody');

    expect(result.removedFrontmatter).toBe(true);
    expect(result.frontmatter).toContain('name: sample');
    expect(result.occurrences.length).toBe(1);
    expect(result.error).toBeNull();
  });
});

describe('markdown-frontmatter parseFrontmatterScalarOccurrences', () => {
  test('shifts line and value offsets by the requested integer offset', () => {
    const occurrences = parseFrontmatterScalarOccurrences('name: sample\nnext: other', { offset: 100 });

    expect(occurrences.map((entry) => [entry.line_start, entry.line_end, entry.value_start, entry.value_end]))
      .toEqual([
        [100, 112, 106, 112],
        [113, 124, 119, 124],
      ]);
  });

  test('skips non-standard keys: spaces, dots, non-ASCII, indented keys, and list items', () => {
    const frontmatter = [
      'foo bar: 1',
      '中文: 2',
      'nested.key: 3',
      '  indented: 4',
      '- item: 5',
      'ok_key-2: 6',
    ].join('\n');

    expect(parseFrontmatterScalarOccurrences(frontmatter).map((entry) => entry.key)).toEqual(['ok_key-2']);
  });

  test('keeps every occurrence for duplicate keys', () => {
    expect(parseFrontmatterScalarOccurrences('key: first\nkey: second').map((entry) => entry.value))
      .toEqual(['first', 'second']);
  });

  test.each([
    ['key: # note', '', '# note'],
    ['key: value # note', 'value', '# note'],
    ['key: value#kept', 'value#kept', null],
    ['key:#kept', '#kept', null],
    ["key: 'value' # note", 'value', '# note'],
  ])('parses comment handling for %p as value %p and comment %p', (line, value, comment) => {
    expect(parseFrontmatterScalarOccurrences(line)).toEqual([
      expect.objectContaining({ key: 'key', value, comment }),
    ]);
  });

  test('falls back to the raw text when a quoted value is never closed', () => {
    expect(parseFrontmatterScalarOccurrences('key: "unclosed')).toEqual([
      expect.objectContaining({ key: 'key', value: '"unclosed', quote: null }),
    ]);
  });

  test('falls back to the raw text when a double-quoted value has an invalid escape', () => {
    expect(parseFrontmatterScalarOccurrences('key: "bad\\xescape"')).toEqual([
      expect.objectContaining({ key: 'key', value: 'bad\\xescape', quote: '"' }),
    ]);
  });
});

describe('markdown-frontmatter parseFrontmatterScalars', () => {
  test('decodes double-quoted JSON escapes and single-quote doubling', () => {
    expect(parseFrontmatterScalars('name: "a\\"b"\nowner: \'owner\'\'s\'')).toEqual({
      name: 'a"b',
      owner: "owner's",
    });
  });

  test('parses empty and whitespace-only values as empty strings', () => {
    expect(parseFrontmatterScalars('key:\nother:   ')).toEqual({
      key: '',
      other: '',
    });
  });

  test('keeps number-, boolean-, and date-like scalars as strings without type coercion', () => {
    expect(parseFrontmatterScalars('port: 8080\nenabled: true\nwhen: 2026-07-30')).toEqual({
      port: '8080',
      enabled: 'true',
      when: '2026-07-30',
    });
  });

  test('lets the last duplicate key win in the metadata map', () => {
    expect(parseFrontmatterScalars('key: first\nkey: second')).toEqual({ key: 'second' });
  });
});

describe('markdown-frontmatter formatFrontmatterScalar', () => {
  test.each([
    ['plain-value', 'plain-value'],
    ['x_y.z', 'x_y.z'],
    ['', '""'],
    [' x ', '" x "'],
    ['true', '"true"'],
    ['TRUE', '"TRUE"'],
    ['42', '"42"'],
    ['1_000', '"1_000"'],
    ['2026-07-30', '"2026-07-30"'],
    ['2026-7-30', '"2026-7-30"'],
    ['2026-07-30T10:00:00Z', '"2026-07-30T10:00:00Z"'],
    ['~', '"~"'],
    ['.inf', '".inf"'],
    ['-.nan', '"-.nan"'],
    ['key: v', '"key: v"'],
    ['a#b', '"a#b"'],
    ['x,y', '"x,y"'],
    ['a[b', '"a[b"'],
    ['100%', '"100%"'],
    ['name@x', '"name@x"'],
    ["it's", '"it\'s"'],
    ['-', '"-"'],
    ['?', '"?"'],
    ['- item', '"- item"'],
  ])('serializes %p as %p', (value, expected) => {
    expect(formatFrontmatterScalar(value)).toBe(expected);
  });

  test.each([
    ['null', null],
    ['undefined', undefined],
  ])('serializes %p as an empty quoted scalar', (_label, value) => {
    expect(formatFrontmatterScalar(value)).toBe('""');
  });

  test('throws on multiline values instead of emitting a multi-line YAML scalar', () => {
    expect(() => formatFrontmatterScalar('line one\nline two')).toThrow(/single-line/);
  });
});

describe('markdown-frontmatter normalizeNewlines', () => {
  test('normalizes CRLF and lone CR to LF and coerces non-string input', () => {
    expect(normalizeNewlines('a\r\nb\rc\nd')).toBe('a\nb\nc\nd');
    expect(normalizeNewlines(42)).toBe('42');
  });
});
