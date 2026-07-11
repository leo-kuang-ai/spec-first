'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const CursorAdapter = require('../../src/cli/adapters/cursor');
const { inspectCursorDuplicateSkillRoots } = require('../../src/cli/adapters/cursor');

function tempRoot(label) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `spec-first-${label}-`));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeState(projectRoot, relativePath, platform, skills = [], workflowSkills = []) {
  writeJson(path.join(projectRoot, relativePath), {
    manifestVersion: 'test-manifest',
    platform,
    commands: [],
    skills,
    workflowSkills,
    agents: [],
    agentSupportFiles: [],
  });
}

function writeSkill(rootPath, skillName, content) {
  const skillPath = path.join(rootPath, skillName, 'SKILL.md');
  fs.mkdirSync(path.dirname(skillPath), { recursive: true });
  fs.writeFileSync(skillPath, content, 'utf8');
}

describe('Cursor duplicate skill root inspection', () => {
  let previousHome;
  let projectRoot;
  let homeRoot;

  beforeEach(() => {
    previousHome = process.env.HOME;
    projectRoot = tempRoot('cursor-duplicates-project');
    homeRoot = tempRoot('cursor-duplicates-home');
    process.env.HOME = homeRoot;
  });

  afterEach(() => {
    process.env.HOME = previousHome;
    fs.rmSync(projectRoot, { recursive: true, force: true });
    fs.rmSync(homeRoot, { recursive: true, force: true });
  });

  test('aggregates divergent current spec-first projections into one non-drift warning', () => {
    writeSkill(path.join(projectRoot, '.cursor', 'skills'), 'spec-explain', 'cursor projection\n');
    writeSkill(path.join(projectRoot, '.agents', 'skills'), 'spec-explain', 'codex projection\n');
    writeSkill(path.join(projectRoot, '.claude', 'skills'), 'spec-explain', 'claude projection\n');
    writeState(projectRoot, '.cursor/spec-first/state.json', 'cursor', ['spec-explain']);
    writeState(projectRoot, '.codex/spec-first/state.json', 'codex', ['spec-explain']);
    writeState(projectRoot, '.claude/spec-first/state.json', 'claude', ['spec-explain']);

    const checks = inspectCursorDuplicateSkillRoots(projectRoot, new CursorAdapter());

    expect(checks).toEqual([expect.objectContaining({
      level: 'WARNING',
      name: 'Cursor managed skill projection precedence',
      drift: false,
      degradedByDesign: true,
      reasonCode: 'cursor_managed_projection_precedence_unverified',
      message: expect.stringContaining('1 same-name skill projection(s)'),
    })]);
    expect(checks[0].message).toContain('.cursor/skills (1)');
    expect(checks[0].message).toContain('.agents/skills (1)');
    expect(checks[0].message).toContain('.claude/skills (1)');
  });

  test('keeps user, legacy, and wrong-root duplicates actionable', () => {
    writeSkill(path.join(projectRoot, '.cursor', 'skills'), 'spec-explain', 'cursor projection\n');
    writeSkill(path.join(homeRoot, '.agents', 'skills'), 'spec-explain', 'user projection\n');
    writeSkill(path.join(projectRoot, '.cursor', 'skills'), 'spec-work', 'cursor workflow\n');
    writeSkill(path.join(projectRoot, '.claude', 'skills'), 'spec-work', 'wrong Claude root\n');
    writeSkill(path.join(projectRoot, '.cursor', 'skills'), 'spec-plan', 'cursor plan\n');
    writeSkill(path.join(projectRoot, '.codex', 'skills'), 'spec-plan', 'legacy Codex root\n');
    writeState(
      projectRoot,
      '.cursor/spec-first/state.json',
      'cursor',
      ['spec-explain', 'spec-plan', 'spec-work'],
    );
    writeState(projectRoot, '.codex/spec-first/state.json', 'codex', ['spec-plan']);
    writeState(projectRoot, '.claude/spec-first/state.json', 'claude', [], ['spec-work']);

    const checks = inspectCursorDuplicateSkillRoots(projectRoot, new CursorAdapter());
    const actionable = checks.filter((check) =>
      check.reasonCode === 'cursor_external_skill_precedence_unverified'
    );

    expect(actionable).toHaveLength(3);
    expect(actionable.map((check) => check.name)).toEqual([
      'Cursor duplicate skill discovery: spec-explain',
      'Cursor duplicate skill discovery: spec-plan',
      'Cursor duplicate skill discovery: spec-work',
    ]);
    expect(actionable.every((check) => check.drift === false)).toBe(true);
    expect(actionable.find((check) => check.name.endsWith('spec-explain')).message)
      .toContain('~/.agents/skills');
    expect(actionable.find((check) => check.name.endsWith('spec-plan')).message)
      .toContain('.codex/skills');
    expect(actionable.find((check) => check.name.endsWith('spec-work')).message)
      .toContain('.claude/skills');
  });

  test('suppresses byte-identical current managed projections', () => {
    const content = 'identical projection\n';
    writeSkill(path.join(projectRoot, '.cursor', 'skills'), 'spec-explain', content);
    writeSkill(path.join(projectRoot, '.agents', 'skills'), 'spec-explain', content);
    writeState(projectRoot, '.cursor/spec-first/state.json', 'cursor', ['spec-explain']);
    writeState(projectRoot, '.codex/spec-first/state.json', 'codex', ['spec-explain']);

    expect(inspectCursorDuplicateSkillRoots(projectRoot, new CursorAdapter())).toEqual([]);
  });

  test('finds deep nested duplicates without max-depth noise', () => {
    writeSkill(path.join(projectRoot, '.cursor', 'skills'), 'spec-explain', 'cursor projection\n');
    writeSkill(path.join(projectRoot, '.agents', 'skills'), 'spec-explain', 'codex projection\n');
    fs.mkdirSync(path.join(
      projectRoot,
      '.agents',
      'skills',
      'spec-explain',
      'references',
      'deep',
      'nested',
      'content',
    ), { recursive: true });
    fs.mkdirSync(path.join(
      projectRoot,
      'src',
      'features',
      'account',
      'components',
      'forms',
      'fields',
    ), { recursive: true });
    writeSkill(path.join(
      projectRoot,
      'packages',
      'product',
      'features',
      'account',
      'deep',
      'nested',
      '.cursor',
      'skills',
    ), 'spec-explain', 'deep external projection\n');
    for (let index = 0; index < 450; index += 1) {
      fs.mkdirSync(path.join(
        projectRoot,
        'large-source-tree',
        `directory-${String(index).padStart(3, '0')}`,
      ), { recursive: true });
    }
    writeState(projectRoot, '.cursor/spec-first/state.json', 'cursor', ['spec-explain']);
    writeState(projectRoot, '.codex/spec-first/state.json', 'codex', ['spec-explain']);

    const checks = inspectCursorDuplicateSkillRoots(projectRoot, new CursorAdapter());
    const external = checks.find((check) =>
      check.reasonCode === 'cursor_external_skill_precedence_unverified'
    );

    expect(external).toBeDefined();
    expect(external.message).toContain(
      'packages/product/features/account/deep/nested/.cursor/skills',
    );
    expect(checks.find((check) => check.name === 'Cursor nested skill root scan')).toBeUndefined();
  });

  test('reports a partial scan when the bounded directory budget is exceeded', () => {
    for (let index = 0; index < 1050; index += 1) {
      fs.mkdirSync(path.join(
        projectRoot,
        'oversized-source-tree',
        `directory-${String(index).padStart(4, '0')}`,
      ), { recursive: true });
    }

    const originalExistsSync = fs.existsSync;
    let nestedCandidateProbes = 0;
    const existsSyncSpy = jest.spyOn(fs, 'existsSync').mockImplementation((candidatePath) => {
      const normalized = String(candidatePath).replace(/\\/g, '/');
      if (
        normalized.includes('/oversized-source-tree/directory-')
        && /\/(?:\.cursor|\.agents)\/skills$/.test(normalized)
      ) {
        nestedCandidateProbes += 1;
        return false;
      }
      return originalExistsSync(candidatePath);
    });
    const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);

    let checks;
    try {
      checks = inspectCursorDuplicateSkillRoots(projectRoot, new CursorAdapter());
    } finally {
      dateNowSpy.mockRestore();
      existsSyncSpy.mockRestore();
    }

    expect(checks).toContainEqual(expect.objectContaining({
      name: 'Cursor nested skill root scan',
      drift: false,
      reasonCode: 'cursor_nested_skill_roots_partial',
      message: 'nested_roots_not_fully_enumerated (max-directory-count)',
    }));
    expect(nestedCandidateProbes).toBeLessThanOrEqual(2000);
  });
});
