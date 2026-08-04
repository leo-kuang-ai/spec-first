'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  inspectContext,
} = require('../../skills/spec-write-skill/scripts/inspect-context.cjs');

const tempRoots = [];

afterEach(() => {
  for (const root of tempRoots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

function tempSkill() {
  const parent = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'spec-write-skill-context-'));
  tempRoots.push(parent);
  const skillRoot = path.join(parent, 'example-skill');
  fs.mkdirSync(path.join(skillRoot, 'references'), { recursive: true });
  fs.writeFileSync(path.join(skillRoot, 'SKILL.md'), [
    '---',
    'name: example-skill',
    'description: Use for a reusable example workflow.',
    '---',
    '',
    '[Reference](references/one.md)',
    '',
  ].join('\n'));
  fs.writeFileSync(path.join(skillRoot, 'references', 'one.md'), '[Second](two.md)\n');
  fs.writeFileSync(path.join(skillRoot, 'references', 'two.md'), '# Reachable\n');
  fs.writeFileSync(path.join(skillRoot, 'references', 'dynamic.md'), '# Script-consumed candidate\n');
  return { parent, skillRoot };
}

test('reports stable source-shape facts without turning orphan candidates into deletion findings', () => {
  const { skillRoot } = tempSkill();
  const before = JSON.stringify([...fs.readdirSync(path.join(skillRoot, 'references'))].sort());
  const first = inspectContext({ skillDir: skillRoot });
  const second = inspectContext({ skillDir: skillRoot });

  expect(first).toEqual(second);
  expect(first).toMatchObject({
    schema_version: 'spec-write-skill.context-facts/v1',
    result: 'pass',
    reachable_markdown: ['SKILL.md', 'references/one.md', 'references/two.md'],
    unreferenced_markdown_candidates: ['references/dynamic.md'],
    reference_depth: 2,
  });
  expect(first.regular_file_inventory).toEqual([...first.regular_file_inventory].sort());
  expect(first.markdown_files.map((entry) => entry.path)).toEqual([
    'references/dynamic.md',
    'references/one.md',
    'references/two.md',
    'SKILL.md',
  ]);
  expect(first.markdown_files.every((entry) => entry.bytes > 0 && entry.lines > 0 && /^[a-f0-9]{64}$/.test(entry.sha256))).toBe(true);
  expect(first.direct_reference_edges).toEqual([
    { source: 'references/one.md', target: 'references/two.md' },
    { source: 'SKILL.md', target: 'references/one.md' },
  ]);
  expect(first.findings).toEqual([]);
  expect(before).toBe(JSON.stringify([...fs.readdirSync(path.join(skillRoot, 'references'))].sort()));
  expect(first.limitations.join(' ')).toMatch(/source-shape/i);
  expect(first.limitations.join(' ')).toMatch(/do not prove runtime loading, billed tokens/i);
});

test('fails closed for symlink and broken references while redacting secret-like paths', () => {
  const { parent, skillRoot } = tempSkill();
  fs.writeFileSync(path.join(skillRoot, '.env'), 'DO_NOT_EXPOSE=secret\n');
  fs.writeFileSync(path.join(skillRoot, 'references', 'one.md'), '[Outside](../../outside.md)\n');
  fs.symlinkSync(path.join(parent, 'outside'), path.join(skillRoot, 'linked'));

  const report = inspectContext({ skillDir: skillRoot });

  expect(report.result).toBe('fail');
  expect(report.findings.map((entry) => entry.reason_code)).toEqual(expect.arrayContaining([
    'symlink_not_allowed',
    'reference_escapes_skill_root',
    'secret_like_file_not_read',
  ]));
  expect(JSON.stringify(report)).not.toContain('DO_NOT_EXPOSE');
  expect(JSON.stringify(report)).not.toContain('.env');
});

test('does not inspect a Skill root reached through a symbolic link', () => {
  const { parent, skillRoot } = tempSkill();
  const linkedRoot = path.join(parent, 'linked-skill');
  fs.symlinkSync(skillRoot, linkedRoot);

  const report = inspectContext({ skillDir: linkedRoot });

  expect(report.result).toBe('fail');
  expect(report.regular_file_inventory).toEqual([]);
  expect(report.markdown_files).toEqual([]);
  expect(report.findings).toEqual(expect.arrayContaining([
    expect.objectContaining({ reason_code: 'skill_root_symlink_segment', status: 'error' }),
  ]));
});

test('returns incomplete rather than reading invalid UTF-8 or exceeding a caller budget', () => {
  const { skillRoot } = tempSkill();
  fs.writeFileSync(path.join(skillRoot, 'references', 'invalid.md'), Buffer.from([0xff, 0xfe]));

  const invalid = inspectContext({ skillDir: skillRoot });
  expect(invalid.result).toBe('incomplete');
  expect(invalid.findings).toEqual(expect.arrayContaining([
    expect.objectContaining({ reason_code: 'text_file_invalid_utf8', status: 'not_checked' }),
  ]));

  fs.rmSync(path.join(skillRoot, 'references', 'invalid.md'));
  const budget = inspectContext({ skillDir: skillRoot, limits: { maxFiles: 1 } });
  expect(budget.result).toBe('incomplete');
  expect(budget.findings).toEqual(expect.arrayContaining([
    expect.objectContaining({ reason_code: 'inventory_file_budget_exceeded', status: 'not_checked' }),
  ]));

  const references = inspectContext({ skillDir: skillRoot, limits: { maxReferenceEdges: 1 } });
  expect(references.result).toBe('incomplete');
  expect(references.direct_reference_edges).toHaveLength(1);
  expect(references.findings).toEqual(expect.arrayContaining([
    expect.objectContaining({ reason_code: 'reference_budget_exceeded', status: 'not_checked' }),
  ]));
});
