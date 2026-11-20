'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const { getAdapter } = require('../../src/cli/adapters');

const repoRoot = path.resolve(__dirname, '../..');
const baseline = '6708eee4180e39c363416038d6459daf6b3e6f68';
const minerBaseline = '2c2bdfb754d9c01fa4f533ad0b1bf8dae88990f2';
function testWithCommit(commit) {
  const probe = spawnSync('git', ['rev-parse', '--verify', '--quiet', `${commit}^{commit}`], { cwd: repoRoot });
  if (probe.error) throw probe.error;
  if (![0, 1].includes(probe.status)) throw new Error(probe.stderr.toString());
  return probe.status === 0 ? test : test.skip;
}
const testWithBaseline = testWithCommit(baseline);
const miner = 'spec-rule-miner';
const audit = 'spec-app-consistency-audit';
const rules = 'spec-project-rules';
const originalFiles = ['SKILL.md', 'references/pattern-categories.md', 'references/write-targets.md'];
let sandbox;
let project;

beforeEach(() => {
  sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'retired-skills-'));
  project = path.join(sandbox, 'project');
  fs.mkdirSync(project);
});

afterEach(() => fs.rmSync(sandbox, { recursive: true, force: true }));

function init(...platforms) {
  const home = path.join(sandbox, 'home');
  fs.mkdirSync(home, { recursive: true });
  const result = spawnSync(process.execPath, [path.join(repoRoot, 'bin/spec-first.js'), 'init',
    ...platforms.map(platform => `--${platform}`), '-y', '-u', 'migration-test', '--lang', 'en'], {
    cwd: project,
    env: { ...process.env, HOME: home, USERPROFILE: home, CODEX_HOME: path.join(home, '.codex'),
      CLAUDE_CONFIG_DIR: path.join(home, '.claude'), XDG_CONFIG_HOME: path.join(home, '.config') },
    encoding: 'utf8', timeout: 120000,
  });
  if (result.error) throw result.error;
  const output = `${result.stdout}\n${result.stderr}`;
  if (result.status !== 0) throw new Error(`init 失败 (${result.signal || result.status}): ${output}`);
  return output;
}

function statePath(platform) {
  return path.join(project, getAdapter(platform).stateFile);
}

function recordOldOwner(platform, skills, workflows = []) {
  const file = statePath(platform);
  const state = JSON.parse(fs.readFileSync(file, 'utf8'));
  delete state.sharedSkillRetirementV1;
  state.skills.push(...skills);
  state.workflowSkills.push(...workflows);
  fs.writeFileSync(file, JSON.stringify(state));
}

function seedOriginalMiner(platform, commit = baseline) {
  const root = path.join(project, getAdapter(platform).skillsRoot, miner);
  fs.mkdirSync(path.join(root, 'references'), { recursive: true });
  for (const file of originalFiles) {
    const bytes = execFileSync('git', ['show', `${commit}:skills/${miner}/${file}`], { cwd: repoRoot });
    fs.writeFileSync(path.join(root, file), bytes);
  }
  return root;
}

test('独占宿主保留同名自建目录', () => {
  init('claude');
  recordOldOwner('claude', [], [audit]);
  const custom = path.join(project, getAdapter('claude').workflowsRoot, audit);
  fs.mkdirSync(custom, { recursive: true });
  fs.writeFileSync(path.join(custom, 'SKILL.md'), '团队自建内容\n');

  init('claude');
  expect(fs.readFileSync(path.join(custom, 'SKILL.md'), 'utf8')).toBe('团队自建内容\n');
  expect(JSON.parse(fs.readFileSync(statePath('claude'), 'utf8')).workflowSkills).not.toContain(audit);

  const output = init('claude');
  expect(fs.readFileSync(path.join(custom, 'SKILL.md'), 'utf8')).toBe('团队自建内容\n');
  expect(output).toContain(path.relative(project, custom).split(path.sep).join('/'));
});

for (const platform of ['claude', 'qoder', 'opencode']) {
  const relative = `.${platform}/commands/spec/app-consistency-audit.md`;
  testWithBaseline.each([false, true])(`${platform} 迁移旧命令（用户已修改：%s）`, modified => {
    const original = execFileSync('git', ['show', `${baseline}:templates/claude/commands/spec/app-consistency-audit.md`], { cwd: repoRoot });
    const expected = modified ? Buffer.concat([original, Buffer.from('\n团队补充\n')]) : original;
    const target = path.join(project, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, expected);

    init(platform);
    if (!modified) {
      expect(fs.existsSync(target)).toBe(false);
      return;
    }
    expect(fs.readFileSync(target)).toEqual(expected);
    const output = init(platform);
    expect(fs.readFileSync(target)).toEqual(expected);
    expect(output).toContain(relative);
  });
}

testWithCommit(minerBaseline)('有所有权时清理 2c2bdfb75 的原版 spec-rule-miner', () => {
  init('claude');
  recordOldOwner('claude', [miner]);
  const original = seedOriginalMiner('claude', minerBaseline);

  init('claude');
  expect(fs.existsSync(original)).toBe(false);
});

testWithBaseline('独占宿主只清理可确认的旧投影，保留用户修改', () => {
  init('claude');
  const adapter = getAdapter('claude');
  recordOldOwner('claude', [miner, rules]);
  const original = seedOriginalMiner('claude');
  const modified = path.join(project, adapter.skillsRoot, rules);
  for (const file of ['SKILL.md', 'references/knowledge-format.md', 'references/mining-method.md', 'scripts/extract-deps.cjs']) {
    const target = path.join(modified, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, execFileSync('git', ['show', `${baseline}:skills/${rules}/${file}`], { cwd: repoRoot }));
  }
  const edited = path.join(modified, 'references/mining-method.md');
  fs.appendFileSync(edited, '\n团队补充规则\n');
  const expected = fs.readFileSync(edited);

  init('claude');
  expect(fs.existsSync(original)).toBe(false);
  expect(fs.readFileSync(edited)).toEqual(expected);
});

testWithBaseline('共享投影在未选宿主仍声明所有权时保持原样，最后一个宿主迁移后才清理', () => {
  init('codex', 'zcode');
  for (const platform of ['codex', 'zcode']) recordOldOwner(platform, [miner]);
  const original = seedOriginalMiner('codex');
  const snapshot = () => originalFiles.map(file => fs.readFileSync(path.join(original, file)));
  const bytes = snapshot();
  const otherState = fs.readFileSync(statePath('zcode'));

  init('codex');
  expect(JSON.parse(fs.readFileSync(statePath('codex'), 'utf8')).skills).not.toContain(miner);
  expect(fs.readFileSync(statePath('zcode'))).toEqual(otherState);
  expect(snapshot()).toEqual(bytes);

  init('zcode');
  expect(JSON.parse(fs.readFileSync(statePath('zcode'), 'utf8')).skills).not.toContain(miner);
  expect(fs.existsSync(original)).toBe(false);
});
