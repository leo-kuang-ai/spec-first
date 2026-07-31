'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  formatFrontmatterScalar,
  parseFrontmatterScalars,
  splitMarkdownFrontmatter,
} = require('../../src/cli/helpers/markdown-frontmatter');
const QoderAdapter = require('../../src/cli/adapters/qoder');
const { applyOperationPlan } = require('../../src/cli/state');

describe('CLI frontmatter and containment calibration', () => {
  test.each([
    ['null', '"null"'],
    ['true', '"true"'],
    ['42', '"42"'],
    ['1.25', '"1.25"'],
    ['2026-07-30', '"2026-07-30"'],
    ['a:b', '"a:b"'],
    ['ordinary-value', 'ordinary-value'],
    ['', '""'],
  ])('serializes the string scalar %p without YAML implicit-type drift', (value, expected) => {
    expect(formatFrontmatterScalar(value)).toBe(expected);
  });

  test('rejects multiline scalar values instead of emitting an unsupported YAML shape', () => {
    expect(() => formatFrontmatterScalar('line one\nline two')).toThrow(/single-line/);
  });

  test.each([
    'quoted "description"',
    'Windows C:\\Program Files\\spec-first',
    'tab\tinside',
  ])('round-trips escaped JSON-style string scalars: %p', (value) => {
    const serialized = formatFrontmatterScalar(value);
    expect(parseFrontmatterScalars(`description: ${serialized}`).description).toBe(value);
  });

  test('decodes YAML single-quote escaping without treating backslashes as escapes', () => {
    expect(parseFrontmatterScalars("description: 'owner''s C:\\\\path'")).toEqual({
      description: "owner's C:\\\\path",
    });
  });

  test('parses only top-of-file frontmatter and leaves body YAML untouched', () => {
    const source = [
      '---',
      'name: sample',
      'description: "true"',
      '---',
      '',
      '```yaml',
      'status: false',
      '---',
      '```',
    ].join('\n');
    const split = splitMarkdownFrontmatter(source);
    expect(parseFrontmatterScalars(split.frontmatter)).toEqual({
      name: 'sample',
      description: 'true',
    });
    expect(split.body).toContain('status: false');
    expect(split.body).toContain('---');
  });

  test('uses the shared scalar serializer in a production runtime projection writer', () => {
    const rendered = new QoderAdapter().renderCommandContent(
      { name: 'sample', filename: 'sample.md', description: 'true' },
      '',
      {
        skillContent: '---\nname: sample\ndescription: source\n---\n\n# Sample\n',
        skillName: 'sample',
      },
    );

    expect(rendered).toContain('description: "true"');
  });

  test('checks managed-write containment again after directory creation and replace', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-cli-containment-'));
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-cli-outside-'));
    const managed = path.join(root, '.managed');
    fs.symlinkSync(outside, managed, 'dir');

    expect(() => applyOperationPlan(root, {
      operations: [{
        kind: 'write_file',
        path: '.managed/file.md',
        contents: 'unsafe',
      }],
    })).toThrow(/escapes project root through symlink/);
    expect(fs.existsSync(path.join(outside, 'file.md'))).toBe(false);
  });
});
