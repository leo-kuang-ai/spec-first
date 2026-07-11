'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  validateSkill,
} = require('../../skills/spec-write-skill/scripts/validate-skill.cjs');
const {
  exportCases,
  loadCases,
} = require('../../skills/spec-write-skill/scripts/export-trigger-evals.cjs');

const repoRoot = path.resolve(__dirname, '../..');
const tempRoots = [];

afterEach(() => {
  for (const root of tempRoots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

function tempSkill(name = 'example-skill', description = 'Use for a reusable example workflow.') {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-write-skill-validator-'));
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
    'scripts/export-trigger-evals.cjs',
  ]));
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
  fs.symlinkSync(path.join(parent, 'outside'), path.join(skillRoot, 'linked-outside'));

  const report = validateSkill({ skillDir: skillRoot, strictPortable: false, authorizedRoot: null });
  expect(report.result).toBe('fail');
  expect(report.inventory.symlinks).toEqual(['linked-outside']);
  expect(report.findings).toEqual(expect.arrayContaining([
    expect.objectContaining({ reason_code: 'secret_like_file_not_read', status: 'warning' }),
    expect.objectContaining({ reason_code: 'symlink_not_allowed', status: 'error' }),
  ]));
  expect(JSON.stringify(report)).not.toContain('never-print-this');
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

test('returns incomplete for duplicate frontmatter authority', () => {
  const { skillRoot } = tempSkill();
  fs.writeFileSync(path.join(skillRoot, 'SKILL.md'), [
    '---',
    'name: example-skill',
    'name: conflicting-name',
    'description: Use for a reusable example workflow.',
    '---',
  ].join('\n'));

  const report = validateSkill({ skillDir: skillRoot, strictPortable: false, authorizedRoot: null });
  expect(report.result).toBe('incomplete');
  expect(report.findings).toEqual(expect.arrayContaining([
    expect.objectContaining({ reason_code: 'frontmatter_subset_unsupported' }),
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

test('exports one canonical trigger fixture to skill-creator and Yao shapes', () => {
  const source = loadCases();
  const creator = exportCases('skill-creator', source);
  const yao = exportCases('yao', source);

  expect(source.cases).toHaveLength(8);
  expect(creator.evals).toHaveLength(source.cases.length);
  expect(creator.evals.every((entry) => entry.prompt && entry.expected_output)).toBe(true);
  expect(
    yao.should_trigger.length + yao.should_not_trigger.length + yao.near_neighbor.length,
  ).toBe(source.cases.length);
  expect(yao.near_neighbor).toEqual(expect.arrayContaining([
    expect.objectContaining({ family: 'audit-not-remediation' }),
    expect.objectContaining({ family: 'generated-runtime-not-source' }),
  ]));
});
