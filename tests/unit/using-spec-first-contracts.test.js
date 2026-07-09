'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ClaudeAdapter = require('../../src/cli/adapters/claude');
const CodexAdapter = require('../../src/cli/adapters/codex');
const { inspectInstalledAssets, syncSkills } = require('../../src/cli/plugin');

const REPO_ROOT = path.join(__dirname, '..', '..');
const SKILL_PATH = path.join(REPO_ROOT, 'skills', 'using-spec-first', 'SKILL.md');
const GOVERNANCE_PATH = path.join(
  REPO_ROOT,
  'src',
  'cli',
  'contracts',
  'dual-host-governance',
  'skills-governance.json',
);
const CLAUDE_SPEC_COMMANDS_DIR = path.join(REPO_ROOT, 'templates', 'claude', 'commands', 'spec');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function expectContainsAll(content, snippets) {
  for (const snippet of snippets) {
    expect(content).toContain(snippet);
  }
}

describe('using-spec-first contracts', () => {
  test('source skill defines a lean entry-governor contract', () => {
    const skill = read(SKILL_PATH);

    expectContainsAll(skill, [
      'name: using-spec-first',
      'standalone entry governor',
      '它只负责把当前请求分到一个公开 `spec-*` workflow',
      '它的立场是 admission / routing',
      '入口判断的组织方式，不是刚性状态机',
      '## Flow Map',
      '### Main Flow: Idea -> Governed Change',
      '### On-Ramps',
      '### Side Paths',
      '### Underneath Boundaries',
      '## Routing Rules',
      '## Direct Outcomes',
      '## User Next-Step Guide Mode',
      '推荐入口: <spec-* 或 terminal command>',
      '## Hard Rules',
      'workflow-first 不等于 brainstorming-first',
      '不把轻量请求强制 workflow 化',
      '`using-spec-first` 描述成 command-backed workflow',
      '公开 workflow 标识统一使用 `spec-*`',
      '`spec-worktree`',
      'dispatch_authorization_missing',
      'scripts/tools 只准备确定性事实；LLM 在事实地板之上判断语义充分性和入口选择',
      '`skills/using-spec-first/SKILL.md` 是 routing policy source of truth',
      '`spec-first:lang` managed block 同时承载最小入口锚点',
      'docs/contracts/context-governance.md',
      'generated mirrors',
      'spec-first startup-reminder --codex',
      '## Scenario Fingerprints',
      'Scenario Fingerprints',
      '不是 gate、approval 或 source scope authority',
    ]);

    expect(skill).not.toContain('skills/using-spec-first/references/');
    expect(skill).not.toContain('skills/using-spec-first/evals/');
    expect(skill).not.toContain('/spec:');
    expect(skill).not.toContain('$spec-');
    expect(skill).not.toContain('using-superpowers');
    expect(skill).not.toContain('借鉴');
  });

  test('source route map does not expose the retired spec-intake entrypoint', () => {
    const skill = read(SKILL_PATH);
    const governance = read(GOVERNANCE_PATH);
    const commandTemplateNames = fs.readdirSync(CLAUDE_SPEC_COMMANDS_DIR)
      .filter((fileName) => fileName.endsWith('.md'))
      .join('\n');
    const checkedSurfaces = [skill, governance, commandTemplateNames];
    const retiredTokens = [
      'spec-intake',
      '/spec:intake',
      '$spec-intake',
      'intake-brief',
      'intake-notes',
      'ready-for-agent',
    ];

    for (const content of checkedSurfaces) {
      for (const token of retiredTokens) {
        expect(content).not.toContain(token);
      }
    }
    expect(commandTemplateNames).not.toContain('intake.md');
  });

  test('using-spec-first is a single-file source package after the entry-governor rewrite', () => {
    for (const childDir of ['references', 'evals']) {
      const absolutePath = path.join(REPO_ROOT, 'skills', 'using-spec-first', childDir);
      const files = fs.existsSync(absolutePath)
        ? fs.readdirSync(absolutePath, { recursive: true }).filter((entry) => {
          const fullPath = path.join(absolutePath, entry.toString());
          return fs.statSync(fullPath).isFile();
        })
        : [];

      expect(files).toEqual([]);
    }
  });

  test('skills governance exposes using-spec-first as a standalone meta skill on all hosts', () => {
    const governance = JSON.parse(read(GOVERNANCE_PATH));

    expect(governance.skills).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          skill_name: 'using-spec-first',
          entry_surface: 'standalone_skill',
          command_name: null,
          host_scope: 'dual_host',
          owner_host: null,
          host_delivery: {
            claude: 'skill',
            codex: 'skill',
            cursor: 'skill',
            kiro: 'skill',
            qoder: 'skill',
          },
        }),
      ]),
    );
  });

  test('runtime transforms preserve the lean governor boundaries', () => {
    const sourceSkill = read(SKILL_PATH);
    const claude = new ClaudeAdapter();
    const codex = new CodexAdapter();
    const claudeRuntime = claude.transformSkillContent(sourceSkill, { skillName: 'using-spec-first' });
    const codexRuntime = codex.transformSkillContent(sourceSkill, { skillName: 'using-spec-first' });

    for (const runtime of [claudeRuntime, codexRuntime]) {
      expect(runtime).toContain('name: using-spec-first');
      expect(runtime).toContain('standalone entry governor');
      expect(runtime).toContain('公开 workflow 标识统一使用 `spec-*`');
      expect(runtime).toContain('dispatch_authorization_missing');
      expect(runtime).toContain('spec-first startup-reminder --codex');
      expect(runtime).toContain('`spec-first:lang` managed block 同时承载最小入口锚点');
      expect(runtime).not.toContain('using-superpowers');
      expect(runtime).not.toContain('spec-intake');
    }
  });

  test('runtime install keeps using-spec-first source-of-truth path stable', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'using-spec-first-runtime-'));

    try {
      for (const [adapter, runtimePath] of [
        [new ClaudeAdapter(), path.join(projectRoot, '.claude', 'skills', 'using-spec-first', 'SKILL.md')],
        [new CodexAdapter(), path.join(projectRoot, '.agents', 'skills', 'using-spec-first', 'SKILL.md')],
      ]) {
        syncSkills(projectRoot, adapter);
        const status = inspectInstalledAssets(projectRoot, adapter).skills;
        const usingSpecFirstDrift = status.drifted.find((entry) => entry.skillName === 'using-spec-first');
        const runtime = read(runtimePath);

        expect(usingSpecFirstDrift).toBeUndefined();
        expect(runtime).toContain('`skills/using-spec-first/SKILL.md` 是 routing policy source of truth');
        expect(runtime).not.toContain('`.claude/skills/using-spec-first/SKILL.md` 是 routing policy source of truth');
        expect(runtime).not.toContain('`.agents/skills/using-spec-first/SKILL.md` 是 routing policy source of truth');
      }
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('Codex adapter preserves dual-host init guidance while rewriting source runtime paths', () => {
    const codex = new CodexAdapter();
    const rendered = codex.transformSkillContent(
      [
        'Repair with spec-first init and choose the target host.',
        'See `.claude/commands/spec/work.md` for the command path.',
      ].join('\n'),
      {
        skillName: 'using-spec-first',
        isWorkflowSkill: true,
      },
    );

    expect(rendered).toContain('spec-first init and choose the target host');
    expect(rendered).not.toMatch(/spec-first init --codex.*spec-first init --codex/);
    expect(rendered).toContain('`.agents/skills/spec-work/SKILL.md`');
  });

  test('using-spec-first itself does not expose internal helpers as user entrypoints', () => {
    const skill = read(SKILL_PATH);

    expect(skill).toContain('不暴露 internal helper 作为用户入口，例如 `spec-worktree`');
    expect(skill).not.toContain('`spec-worktree` ->');
    expect(skill).not.toContain('spec-worktree 作为入口');
  });
});
