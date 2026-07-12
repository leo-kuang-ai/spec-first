'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  VALIDATION_LIMITS,
  renderHuman,
  validateSkill,
} = require('../../skills/spec-write-skill/scripts/validate-skill.cjs');
const {
  exportCases,
  loadCases,
} = require('../../skills/spec-write-skill/evals/export-trigger-evals.cjs');

const repoRoot = path.resolve(__dirname, '../..');
const tempRoots = [];

afterEach(() => {
  for (const root of tempRoots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

function tempSkill(name = 'example-skill', description = 'Use for a reusable example workflow.') {
  const parent = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'spec-write-skill-validator-'));
  tempRoots.push(parent);
  const skillRoot = path.join(parent, name);
  fs.mkdirSync(skillRoot);
  fs.writeFileSync(path.join(skillRoot, 'SKILL.md'), [
    '---',
    `name: ${name}`,
    `description: ${description}`,
    '---',
    '',
    '# Example',
    '',
  ].join('\n'));
  return { parent, skillRoot };
}

test('current spec-write-skill passes strict portable mechanical validation', () => {
  const report = validateSkill({
    skillDir: path.join(repoRoot, 'skills/spec-write-skill'),
    json: true,
    strictPortable: true,
    authorizedRoot: path.join(repoRoot, 'skills'),
  });

  expect(report.result).toBe('pass');
  expect(report.ok).toBe(true);
  expect(report.findings).toEqual([]);
  expect(report.inventory.scripts).toEqual(expect.arrayContaining([
    'scripts/validate-skill.cjs',
  ]));
  expect(report.inventory.files).toContain('evals/export-trigger-evals.cjs');
});

test('reports angle brackets and directory mismatch as confirmed failures', () => {
  const { skillRoot } = tempSkill('wrong-directory', 'Use skills/<name>/ for authoring.');
  fs.writeFileSync(path.join(skillRoot, 'SKILL.md'), [
    '---',
    'name: another-name',
    'description: Use skills/<name>/ for authoring.',
    '---',
    '',
  ].join('\n'));

  const report = validateSkill({ skillDir: skillRoot, strictPortable: true, authorizedRoot: null });
  expect(report.result).toBe('fail');
  expect(report.findings.map((entry) => entry.reason_code)).toEqual(expect.arrayContaining([
    'description_angle_brackets',
    'name_directory_mismatch',
  ]));
});

test('does not follow symlinks or read secret-like files', () => {
  const { parent, skillRoot } = tempSkill();
  fs.writeFileSync(path.join(skillRoot, '.env'), 'TOP_SECRET_VALUE=never-print-this\n');
  fs.mkdirSync(path.join(skillRoot, '.secrets'));
  fs.writeFileSync(path.join(skillRoot, '.secrets', 'config.md'), 'NESTED_SECRET=never-print-this-either\n');
  fs.symlinkSync(path.join(parent, 'outside'), path.join(skillRoot, 'linked-outside'));

  const report = validateSkill({ skillDir: skillRoot, strictPortable: false, authorizedRoot: null });
  expect(report.result).toBe('fail');
  expect(report.inventory.symlinks).toEqual(['linked-outside']);
  expect(report.findings).toEqual(expect.arrayContaining([
    expect.objectContaining({ reason_code: 'secret_like_file_not_read', status: 'warning' }),
    expect.objectContaining({ reason_code: 'symlink_not_allowed', status: 'error' }),
  ]));
  expect(JSON.stringify(report)).not.toContain('never-print-this');
  expect(JSON.stringify(report)).not.toContain('.env');
  expect(JSON.stringify(report)).not.toContain('.secrets');
});

test('returns incomplete for unsupported YAML constructs', () => {
  const { skillRoot } = tempSkill();
  fs.writeFileSync(path.join(skillRoot, 'SKILL.md'), [
    '---',
    'name: example-skill',
    'description: [unsupported, flow]',
    '---',
    '',
  ].join('\n'));

  const report = validateSkill({ skillDir: skillRoot, strictPortable: false, authorizedRoot: null });
  expect(report.result).toBe('incomplete');
  expect(report.findings).toEqual(expect.arrayContaining([
    expect.objectContaining({ reason_code: 'frontmatter_subset_unsupported', status: 'not_checked' }),
  ]));
});

test('returns fail for duplicate frontmatter authority', () => {
  const { skillRoot } = tempSkill();
  fs.writeFileSync(path.join(skillRoot, 'SKILL.md'), [
    '---',
    'name: example-skill',
    'name: conflicting-name',
    'description: Use for a reusable example workflow.',
    '---',
  ].join('\n'));

  const report = validateSkill({ skillDir: skillRoot, strictPortable: false, authorizedRoot: null });
  expect(report.result).toBe('fail');
  expect(report.findings).toEqual(expect.arrayContaining([
    expect.objectContaining({ reason_code: 'frontmatter_invalid', status: 'error' }),
  ]));
});

test('uses the plan-owned bounded inventory limits', () => {
  expect(VALIDATION_LIMITS).toEqual({
    maxDepth: 16,
    maxFiles: 1000,
    maxTextFileBytes: 1024 * 1024,
    maxTextBytes: 10 * 1024 * 1024,
  });
});

test('blocks high-confidence sensitive content without returning the matched value', () => {
  const { skillRoot } = tempSkill();
  const token = `Bearer ${'a'.repeat(40)}`;
  fs.writeFileSync(path.join(skillRoot, 'notes.md'), `Authorization: ${token}\n`);

  const report = validateSkill({ skillDir: skillRoot, strictPortable: false, authorizedRoot: null });
  expect(report.result).toBe('fail');
  expect(report.findings).toEqual(expect.arrayContaining([
    expect.objectContaining({ reason_code: 'sensitive_content_detected', status: 'error', path: 'notes.md' }),
  ]));
  expect(JSON.stringify(report)).not.toContain(token);
});

test('rejects control-character paths and escapes human output', () => {
  const { skillRoot } = tempSkill();
  fs.writeFileSync(path.join(skillRoot, 'bad\nname\tfile.md'), '# unsafe path\n');

  const report = validateSkill({ skillDir: skillRoot, strictPortable: false, authorizedRoot: null });
  const human = renderHuman(report);
  expect(report.result).toBe('fail');
  expect(report.findings).toEqual(expect.arrayContaining([
    expect.objectContaining({ reason_code: 'unsafe_path_characters', status: 'error' }),
  ]));
  expect(human).toContain('bad\\u000aname\\u0009file.md');
  expect(human).not.toContain('bad\nname\tfile.md');
});

test('rejects bidirectional override paths without returning the raw character', () => {
  const { skillRoot } = tempSkill();
  const unsafeName = `bad\u202ename.md`;
  fs.writeFileSync(path.join(skillRoot, unsafeName), '# unsafe path\n');

  const report = validateSkill({ skillDir: skillRoot, strictPortable: false, authorizedRoot: null });
  expect(report.result).toBe('fail');
  expect(report.findings).toEqual(expect.arrayContaining([
    expect.objectContaining({ reason_code: 'unsafe_path_characters', path: 'bad\\u202ename.md' }),
  ]));
  expect(JSON.stringify(report)).not.toContain('\u202e');
});

test('returns incomplete for invalid UTF-8 text without exposing bytes', () => {
  const { skillRoot } = tempSkill();
  fs.writeFileSync(path.join(skillRoot, 'invalid.md'), Buffer.from([0xff, 0xfe, 0xfd]));

  const report = validateSkill({ skillDir: skillRoot, strictPortable: false, authorizedRoot: null });
  expect(report.result).toBe('incomplete');
  expect(report.findings).toEqual(expect.arrayContaining([
    expect.objectContaining({ reason_code: 'text_file_invalid_utf8', status: 'not_checked', path: 'invalid.md' }),
  ]));
});

test('enforces per-file readable text budget', () => {
  const { skillRoot } = tempSkill();
  fs.writeFileSync(
    path.join(skillRoot, 'large.md'),
    Buffer.alloc(VALIDATION_LIMITS.maxTextFileBytes + 1, 0x61),
  );

  const report = validateSkill({ skillDir: skillRoot, strictPortable: false, authorizedRoot: null });
  expect(report.result).toBe('incomplete');
  expect(report.findings).toEqual(expect.arrayContaining([
    expect.objectContaining({ reason_code: 'text_file_budget_exceeded', status: 'not_checked' }),
  ]));
});

test('halts the whole inventory after the file-count budget is exhausted', () => {
  const { skillRoot } = tempSkill();
  const crowded = path.join(skillRoot, 'a-crowded');
  fs.mkdirSync(crowded);
  for (let index = 0; index <= VALIDATION_LIMITS.maxFiles; index += 1) {
    fs.writeFileSync(path.join(crowded, `${String(index).padStart(4, '0')}.bin`), 'x');
  }
  fs.writeFileSync(path.join(skillRoot, 'z-after.md'), '# must not be scanned\n');

  const report = validateSkill({ skillDir: skillRoot, strictPortable: false, authorizedRoot: null });
  expect(report.result).toBe('incomplete');
  expect(report.findings.filter((entry) => entry.reason_code === 'inventory_file_budget_exceeded')).toHaveLength(1);
  expect(report.inventory.files).not.toContain('z-after.md');
});

test('halts the whole inventory after the total readable-text budget is exhausted', () => {
  const { skillRoot } = tempSkill();
  const crowded = path.join(skillRoot, 'a-crowded');
  fs.mkdirSync(crowded);
  for (let index = 0; index < 11; index += 1) {
    fs.writeFileSync(
      path.join(crowded, `${String(index).padStart(2, '0')}.md`),
      Buffer.alloc(VALIDATION_LIMITS.maxTextFileBytes, 0x61),
    );
  }
  fs.writeFileSync(path.join(skillRoot, 'z-after.md'), '# must not be scanned\n');

  const report = validateSkill({ skillDir: skillRoot, strictPortable: false, authorizedRoot: null });
  expect(report.result).toBe('incomplete');
  expect(report.findings.filter((entry) => entry.reason_code === 'inventory_text_budget_exceeded')).toHaveLength(1);
  expect(report.inventory.files).not.toContain('z-after.md');
});

test('confirmed errors outrank incomplete checks during aggregation', () => {
  const { parent, skillRoot } = tempSkill();
  fs.symlinkSync(path.join(parent, 'outside'), path.join(skillRoot, 'linked-outside'));
  fs.writeFileSync(
    path.join(skillRoot, 'large.md'),
    Buffer.alloc(VALIDATION_LIMITS.maxTextFileBytes + 1, 0x61),
  );

  const report = validateSkill({ skillDir: skillRoot, strictPortable: false, authorizedRoot: null });
  expect(report.result).toBe('fail');
  expect(report.findings.map((entry) => entry.status)).toEqual(expect.arrayContaining([
    'error',
    'not_checked',
  ]));
});

test('enforces the authorized root without mutating the package', () => {
  const { skillRoot } = tempSkill();
  const authorizedRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-write-skill-authorized-'));
  tempRoots.push(authorizedRoot);
  const before = fs.readFileSync(path.join(skillRoot, 'SKILL.md'), 'utf8');

  const report = validateSkill({ skillDir: skillRoot, strictPortable: false, authorizedRoot });
  expect(report.result).toBe('fail');
  expect(report.findings).toEqual(expect.arrayContaining([
    expect.objectContaining({ reason_code: 'skill_root_outside_authorized_root' }),
  ]));
  expect(fs.readFileSync(path.join(skillRoot, 'SKILL.md'), 'utf8')).toBe(before);
});

test('rejects an existing skill reached through a symlinked ancestor', () => {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-write-skill-symlink-ancestor-'));
  tempRoots.push(parent);
  const realParent = path.join(parent, 'real');
  const skillRoot = path.join(realParent, 'example-skill');
  fs.mkdirSync(skillRoot, { recursive: true });
  fs.writeFileSync(path.join(skillRoot, 'SKILL.md'), [
    '---',
    'name: example-skill',
    'description: Use for a reusable example workflow.',
    '---',
    '',
  ].join('\n'));
  fs.symlinkSync(realParent, path.join(parent, 'alias'));

  const report = validateSkill({
    skillDir: path.join(parent, 'alias', 'example-skill'),
    strictPortable: false,
    authorizedRoot: parent,
  });
  expect(report.result).toBe('fail');
  expect(report.findings).toEqual(expect.arrayContaining([
    expect.objectContaining({ reason_code: 'skill_root_symlink_segment', status: 'error' }),
  ]));
});

test('rejects a missing destination outside authorized root before creation', () => {
  const authorizedRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-write-skill-authorized-'));
  tempRoots.push(authorizedRoot);
  const outsideRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-write-skill-outside-'));
  tempRoots.push(outsideRoot);

  const report = validateSkill({
    skillDir: path.join(outsideRoot, 'not-created'),
    strictPortable: false,
    authorizedRoot,
  });
  expect(report.result).toBe('fail');
  expect(report.findings).toEqual(expect.arrayContaining([
    expect.objectContaining({ reason_code: 'skill_root_outside_authorized_root', status: 'error' }),
  ]));
});

test('exports one canonical trigger fixture to skill-creator and Yao shapes', () => {
  const source = loadCases();
  const creator = exportCases('skill-creator', source);
  const yao = exportCases('yao', source);

  expect(source.cases).toHaveLength(9);
  expect(source.route_queries).toHaveLength(15);
  expect(creator.evals).toHaveLength(source.cases.length);
  expect(creator.evals.every((entry) => entry.prompt && entry.expected_output)).toBe(true);
  expect(
    yao.should_trigger.length + yao.should_not_trigger.length + yao.near_neighbor.length,
  ).toBe(source.route_queries.length);
  expect(yao.near_neighbor).toEqual(expect.arrayContaining([
    expect.objectContaining({ family: 'audit-only-neighbor' }),
    expect.objectContaining({ family: 'generated-runtime-neighbor' }),
  ]));
});
