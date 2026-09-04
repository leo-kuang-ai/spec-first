'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const CursorAdapter = require('../../src/cli/adapters/cursor');
const KiroAdapter = require('../../src/cli/adapters/kiro');
const QoderAdapter = require('../../src/cli/adapters/qoder');
const OpenCodeAdapter = require('../../src/cli/adapters/opencode');

const REPO_ROOT = path.join(__dirname, '..', '..');
const SETUP_SOURCE = fs.readFileSync(
  path.join(REPO_ROOT, 'skills', 'spec-runtime-setup', 'SKILL.md'),
  'utf8',
);
const SETUP_REGISTRY_SOURCE = fs.readFileSync(
  path.join(REPO_ROOT, 'skills', 'spec-runtime-setup', 'setup-registry.json'),
  'utf8',
);
const WORKER_DISPATCH_PRIMITIVE_PATTERN = /\bspawn_agent\b|\bAgent tool\b|\bTask tool\b|OpenCode[^\n]{0,120}\btask\b/i;

const ADAPTER_CASES = [
  {
    id: 'cursor',
    hostLabel: 'Cursor',
    adapter: new CursorAdapter(),
    skillsRoot: '.cursor/skills',
    foreignRuntimePath: '.kiro/skills/spec-work/SKILL.md',
    projectedRuntimePath: '.cursor/skills/spec-work/SKILL.md',
    comparativeConfigPath: '.kiro/settings/mcp.json',
  },
  {
    id: 'kiro',
    hostLabel: 'Kiro',
    adapter: new KiroAdapter(),
    skillsRoot: '.kiro/skills',
    foreignRuntimePath: '.qoder/skills/spec-work/SKILL.md',
    projectedRuntimePath: '.kiro/skills/spec-work/SKILL.md',
    comparativeConfigPath: '.qoder/settings.local.json',
  },
  {
    id: 'qoder',
    hostLabel: 'Qoder',
    adapter: new QoderAdapter(),
    skillsRoot: '.qoder/skills',
    foreignRuntimePath: '.kiro/skills/spec-work/SKILL.md',
    projectedRuntimePath: '.qoder/skills/spec-work/SKILL.md',
    comparativeConfigPath: '.kiro/settings/mcp.json',
  },
  {
    id: 'opencode',
    hostLabel: 'OpenCode',
    adapter: new OpenCodeAdapter(),
    skillsRoot: '.opencode/skills',
    foreignRuntimePath: '.agents/skills/spec-work/SKILL.md',
    projectedRuntimePath: '.opencode/skills/spec-work/SKILL.md',
    comparativeConfigPath: '.kiro/settings/mcp.json',
  },
];

function tempProject(label) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `spec-first-${label}-`));
}

function writeText(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function setupTransformContext(relativePath = 'SKILL.md') {
  return {
    skillName: 'spec-runtime-setup',
    isWorkflowSkill: true,
    relativePath,
  };
}

function findSkillCheck(adapter, projectRoot, skillsRoot, skillName) {
  const relativePath = `${skillsRoot}/${skillName}/SKILL.md`;
  return adapter.inspectRuntimeFiles(projectRoot)
    .find((check) => check.name === relativePath);
}

describe('host runtime projection contracts', () => {
  test.each(ADAPTER_CASES)(
    '$id does not inject a worker primitive mapping into semantic-port projection',
    ({ adapter }) => {
      const semanticSource = fs.readFileSync(
        path.join(REPO_ROOT, 'skills', 'using-spec-first', 'references', 'conditional-routing-boundaries.md'),
        'utf8',
      );
      const transformed = adapter.transformSkillContent(semanticSource, {
        skillName: 'using-spec-first',
        isWorkflowSkill: false,
        relativePath: 'references/conditional-routing-boundaries.md',
      });

      expect(transformed).not.toMatch(WORKER_DISPATCH_PRIMITIVE_PATTERN);
      expect(transformed).toContain('provider_untrusted');
      expect(transformed).toContain('capability_probe');
    },
  );

  test.each(ADAPTER_CASES)(
    '$id keeps retired brainstorm visual helper assets out of projection',
    ({ adapter, skillsRoot }) => {
      const projectRoot = tempProject('visual-retirement');
      const brainstormSource = fs.readFileSync(
        path.join(REPO_ROOT, 'skills', 'spec-brainstorm', 'SKILL.md'),
        'utf8',
      );
      const transformed = adapter.transformSkillContent(brainstormSource, {
        skillName: 'spec-brainstorm',
        isWorkflowSkill: true,
        relativePath: 'SKILL.md',
      });

      expect(transformed).not.toMatch(/visual-probe|visual-probes|text-vs-visual/i);
      expect(fs.existsSync(path.join(
        projectRoot,
        skillsRoot,
        'spec-brainstorm',
        'references',
        'visual-probes.md',
      ))).toBe(false);
    },
  );

  test.each(ADAPTER_CASES)(
    '$id preserves the public cross-host MCP config mapping in spec-runtime-setup',
    ({ adapter }) => {
      const transformed = adapter.transformSkillContent(SETUP_SOURCE, setupTransformContext());

      expect(transformed).toContain(
        '绝不能仅依据 prose 手动选择 `.kiro/settings/mcp.json`、`.qoder/settings.local.json`、`.cursor/mcp.json`、Codex TOML 或 Claude managed/user config。',
      );
      expect(transformed).toContain(
        'write Kiro MCP config to workspace `.kiro/settings/mcp.json` by default, and to `~/.kiro/settings/mcp.json` only after explicit user-scope opt-in;',
      );
      expect(transformed).toContain(
        'write Qoder MCP config to local `.qoder/settings.local.json` by default, and to `~/.qoder/settings.json` only after explicit user-scope opt-in;',
      );
      expect(transformed).toContain(
        'write Cursor MCP config to project `.cursor/mcp.json` by default, and to `~/.cursor/mcp.json` only after explicit user-scope opt-in;',
      );
    },
  );

  test.each(ADAPTER_CASES)(
    '$id preserves the machine registry host-to-config-path mapping',
    ({ adapter }) => {
      const registry = JSON.parse(
        adapter.transformSkillContent(
          SETUP_REGISTRY_SOURCE,
          setupTransformContext('setup-registry.json'),
        ),
      );
      const hostConfig = Object.fromEntries(
        Object.entries(registry.hosts).map(([host, definition]) => [
          host,
          definition.defaults.tool.host_config,
        ]),
      );

      expect(registry.schema_version).toBe('setup-registry.v10');
      expect(hostConfig.kiro.targets).toMatchObject({
        workspace: { config_path: '.kiro/settings/mcp.json' },
        user: { config_path: '$HOME/.kiro/settings/mcp.json' },
      });
      expect(hostConfig.qoder.targets).toMatchObject({
        local: { config_path: '.qoder/settings.local.json' },
        user: { config_path: '$HOME/.qoder/settings.json' },
      });
      expect(hostConfig.cursor.targets).toMatchObject({
        project: { config_path: '.cursor/mcp.json' },
        user: { config_path: '$HOME/.cursor/mcp.json' },
      });
    },
  );

  test.each(ADAPTER_CASES)(
    '$id protects only comparative config paths while retaining host-local runtime projection',
    ({ adapter, foreignRuntimePath, projectedRuntimePath, comparativeConfigPath }) => {
      const transformed = adapter.transformSkillContent(
        [
          `Comparative config: \`${comparativeConfigPath}\`.`,
          `Foreign runtime: \`${foreignRuntimePath}\`.`,
        ].join('\n'),
        setupTransformContext(),
      );

      expect(transformed).toContain(`Comparative config: \`${comparativeConfigPath}\`.`);
      expect(transformed).toContain(`Foreign runtime: \`${projectedRuntimePath}\`.`);
      expect(transformed).not.toContain(`Foreign runtime: \`${foreignRuntimePath}\`.`);
    },
  );

  test.each(ADAPTER_CASES)(
    '$id validator allows the setup comparative mapping but still reports other runtime residue',
    ({ adapter, hostLabel, id, skillsRoot }) => {
      const projectRoot = tempProject(`${id}-comparative-validator`);
      const skillPath = path.join(projectRoot, skillsRoot, 'spec-runtime-setup', 'SKILL.md');
      const comparativeContent = adapter.transformSkillContent([
        '---',
        'name: spec-runtime-setup',
        'description: "Runtime setup"',
        '---',
        '',
        '## Comparative host configuration',
        '',
        '- Kiro: `.kiro/settings/mcp.json` or `~/.kiro/settings/mcp.json`.',
        '- Qoder: `.qoder/settings.local.json` or `~/.qoder/settings.json`.',
        '- Cursor: `.cursor/mcp.json` or `~/.cursor/mcp.json`.',
        '',
        '## Workflow Modes',
        '',
      ].join('\n'), setupTransformContext());
      writeText(skillPath, comparativeContent);

      expect(findSkillCheck(adapter, projectRoot, skillsRoot, 'spec-runtime-setup'))
        .toMatchObject({ level: 'PASS' });

      writeText(skillPath, `${comparativeContent}\nUnexpected residue: \`.claude/skills/spec-work/SKILL.md\`.\n`);
      expect(findSkillCheck(adapter, projectRoot, skillsRoot, 'spec-runtime-setup'))
        .toMatchObject({
          level: 'WARNING',
          message: expect.stringContaining(`contains non-${hostLabel} runtime path references`),
        });
    },
  );

  test('Cursor classifies workflow skills from governance instead of the spec- prefix', () => {
    const projectRoot = tempProject('cursor-governance');
    const adapter = new CursorAdapter();
    const standaloneSkillPath = path.join(projectRoot, '.cursor', 'skills', 'spec-explain', 'SKILL.md');
    const workflowSkillPath = path.join(projectRoot, '.cursor', 'skills', 'spec-work', 'SKILL.md');
    const standaloneContent = [
      '---',
      'name: spec-explain',
      'description: "Explain a concept"',
      '---',
      '',
      '# Explain',
      '',
    ].join('\n');
    const workflowContent = standaloneContent
      .replace('spec-explain', 'spec-work')
      .replace('Explain a concept', 'Execute a plan');

    writeText(standaloneSkillPath, standaloneContent);
    writeText(workflowSkillPath, workflowContent);

    expect(findSkillCheck(adapter, projectRoot, '.cursor/skills', 'spec-explain'))
      .toMatchObject({ level: 'PASS' });
    expect(findSkillCheck(adapter, projectRoot, '.cursor/skills', 'spec-work'))
      .toMatchObject({
        level: 'WARNING',
        message: expect.stringContaining('workflow skill must set disable-model-invocation: true'),
      });
  });

  test('Qoder command validation applies the same narrow setup mapping exception', () => {
    const projectRoot = tempProject('qoder-command-comparative-validator');
    const adapter = new QoderAdapter();
    const commandPath = path.join(projectRoot, '.qoder', 'commands', 'spec-runtime-setup.md');
    const comparativeContent = adapter.transformSkillContent([
      '---',
      'name: spec-runtime-setup',
      'description: "Runtime setup"',
      '---',
      '',
      '- Kiro: `.kiro/settings/mcp.json` or `~/.kiro/settings/mcp.json`.',
      '- Qoder: `.qoder/settings.local.json` or `~/.qoder/settings.json`.',
      '- Cursor: `.cursor/mcp.json` or `~/.cursor/mcp.json`.',
      '',
      '## Workflow Modes',
      '',
    ].join('\n'), {
      ...setupTransformContext(),
      runtimeName: 'spec-runtime-setup',
    });
    writeText(commandPath, comparativeContent);

    expect(adapter.inspectRuntimeFiles(projectRoot).find((check) =>
      check.name === '.qoder/commands/spec-runtime-setup.md'
    )).toMatchObject({ level: 'PASS' });

    writeText(commandPath, `${comparativeContent}\nUnexpected residue: \`.claude/skills/spec-work/SKILL.md\`.\n`);
    expect(adapter.inspectRuntimeFiles(projectRoot).find((check) =>
      check.name === '.qoder/commands/spec-runtime-setup.md'
    )).toMatchObject({
      level: 'WARNING',
      message: expect.stringContaining('contains non-Qoder runtime path references'),
    });
  });

  test('Cursor preview warning is explicit degraded-by-design evidence, not drift', () => {
    const adapter = new CursorAdapter();
    const projectRoot = tempProject('cursor-preview');

    expect(adapter.inspectRuntimeFiles(projectRoot).find((check) =>
      check.name === 'Cursor generated-runtime preview'
    )).toMatchObject({
      level: 'WARNING',
      degradedByDesign: true,
      drift: false,
      reasonCode: 'cursor_generated_runtime_loader_unverified',
    });
  });
});
