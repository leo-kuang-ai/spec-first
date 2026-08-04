'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { getAdapter } = require('../../src/cli/adapters');
const plugin = require('../../src/cli/plugin');
const {
  findUnresolvedCommandSkillLocalResourcePaths,
  rewriteCommandSkillLocalResourcePaths,
  rewriteSourceSkillRuntimePaths,
} = require('../../src/cli/skill-path-rewrite-markers');

const projectRoots = new Set();

afterEach(() => {
  for (const projectRoot of projectRoots) {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  }
  projectRoots.clear();
});

function tempProject(platform) {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), `spec-first-${platform}-command-paths-`));
  projectRoots.add(projectRoot);
  return projectRoot;
}

function commandDefinition(skillName) {
  return plugin.listBundledCommands().find((command) => command.skill === skillName);
}

function readRuntimeCommand(projectRoot, adapter, skillName) {
  const command = commandDefinition(skillName);
  return fs.readFileSync(
    path.join(projectRoot, adapter.commandRoot, adapter.commandFilename(command)),
    'utf8',
  );
}

function unresolvedPhysicalCommandResources(projectRoot, runtimeRoot, content) {
  const rootedPattern = new RegExp(
    `${runtimeRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/(?:references|scripts|assets|prompts|schemas|rule-packs)/[^\`\\s)>,;'\"]+`,
    'g',
  );
  const skillDirPattern = /\$SKILL_DIR\/(?:references|scripts|assets|prompts|schemas|rule-packs)\/[^\`\s)>,;'\"]+/g;
  const candidates = [
    ...(content.match(rootedPattern) || []),
    ...(content.match(skillDirPattern) || [])
      .map((candidate) => candidate.replace('$SKILL_DIR', runtimeRoot)),
  ];
  return candidates
    .map((candidate) => candidate.replace(/[.:]+$/, ''))
    .filter((candidate) => !/[<*>]/.test(candidate))
    .filter((candidate) => !fs.existsSync(path.join(projectRoot, candidate)));
}

describe('command companion resource paths', () => {
  test.each(['claude', 'qoder'])(
    '%s commands resolve inlined skill-local resources from the companion runtime skill',
    (platform) => {
      const projectRoot = tempProject(platform);
      const adapter = getAdapter(platform);
      plugin.syncBundledAssets(projectRoot, adapter);

      const docReviewRoot = `${adapter.workflowsRoot}/spec-doc-review`;
      const docReview = readRuntimeCommand(projectRoot, adapter, 'spec-doc-review');
      expect(docReview).toContain(
        `Command support root: \`${docReviewRoot}\`. Treat it as the loaded skill directory whenever this inlined workflow refers to \`SKILL_DIR\` or the directory containing \`SKILL.md\`.`,
      );
      expect(docReview).toContain(
        `read \`${docReviewRoot}/references/synthesis-and-presentation.md\``,
      );
      expect(docReview).toContain(
        `@./${docReviewRoot}/references/subagent-template.md`,
      );
      expect(fs.existsSync(path.join(
        projectRoot,
        docReviewRoot,
        'references',
        'subagent-template.md',
      ))).toBe(true);

      const prdRoot = `${adapter.workflowsRoot}/spec-prd`;
      const prd = readRuntimeCommand(projectRoot, adapter, 'spec-prd');
      expect(prd).toContain(`\`${prdRoot}/assets/templates/00-generic.md\``);
      expect(fs.existsSync(path.join(
        projectRoot,
        prdRoot,
        'assets',
        'templates',
        '00-generic.md',
      ))).toBe(true);

      const auditRoot = `${adapter.workflowsRoot}/spec-app-consistency-audit`;
      const audit = readRuntimeCommand(projectRoot, adapter, 'spec-app-consistency-audit');
      expect(audit).toContain(`\`${auditRoot}/scripts/run-audit.js\``);
      expect(fs.existsSync(path.join(
        projectRoot,
        auditRoot,
        'scripts',
        'run-audit.js',
      ))).toBe(true);

      const writeSkillRoot = `${adapter.workflowsRoot}/spec-write-skill`;
      const writeSkill = readRuntimeCommand(projectRoot, adapter, 'spec-write-skill');
      expect(writeSkill).toContain('## Conditional Sources');
      expect(writeSkill).toContain(`${writeSkillRoot}/references/authoring-workbench.md`);
      expect(writeSkill).toContain(`${writeSkillRoot}/references/evaluation-design.md`);
      expect(writeSkill).toContain(`${writeSkillRoot}/references/optimization-and-lifecycle.md`);
      expect(writeSkill).toContain(`${writeSkillRoot}/references/target-profiles.md`);
      expect(writeSkill).toContain(`${writeSkillRoot}/references/project-profiles.md`);
      expect(writeSkill).toContain(`${writeSkillRoot}/references/delivery-gates.md`);
      expect(fs.existsSync(path.join(projectRoot, writeSkillRoot, 'scripts', 'inspect-context.cjs'))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, writeSkillRoot, 'scripts', 'validate-authoring-preview.cjs'))).toBe(true);
      expect(fs.existsSync(path.join(projectRoot, writeSkillRoot, 'scripts', 'validate-skill.cjs'))).toBe(true);

      for (const skillName of ['spec-optimize', 'spec-polish']) {
        const commandContent = readRuntimeCommand(projectRoot, adapter, skillName);
        expect(commandContent).toContain('bare `scripts/<name>` path will not resolve');
        expect(commandContent).not.toContain(
          `bare \`${adapter.workflowsRoot}/${skillName}/scripts/<name>\` path will not resolve`,
        );
      }

      for (const command of plugin.listBundledCommands()) {
        const content = readRuntimeCommand(projectRoot, adapter, command.skill);
        expect(findUnresolvedCommandSkillLocalResourcePaths(content)).toEqual([]);
        expect(unresolvedPhysicalCommandResources(
          projectRoot,
          `${adapter.workflowsRoot}/${command.skill}`,
          content,
        )).toEqual([]);
      }

      expect(plugin.inspectInstalledAssets(projectRoot, adapter).commands.drifted).toEqual([]);
    },
  );

  test('rewrites only command-local resource tokens and preserves rooted or non-delivered paths', () => {
    const lines = [
      'Read `references/a.md` and `./scripts/run.sh`.',
      '@./assets/template.md',
      'Load prompts/prompt.md, schemas/schema.json, and rule-packs/base.yaml.',
      'Keep `skills/spec-doc-review/references/source.md`.',
      'Keep `.agents/skills/spec-doc-review/references/runtime.md`.',
      'Keep `.kiro/settings/mcp.json` and `.qoder/settings.local.json`.',
      'Keep `$SKILL_DIR/scripts/run.sh` and `../references/parent.md`.',
      'Keep `/opt/tool/references/absolute.md` and `https://example.test/references/web.md`.',
      'Keep `C:\\scripts/mixed.sh`, `@references/literal.md`, and `evals/examples.json`.',
      'Read `references/personas/<reviewer>.md` after selecting a reviewer.',
      'Support files are `references/`, `scripts/`, `assets/`, `prompts/`, `schemas/`, and `rule-packs/`.',
      'Keep conceptual glob `references/**` unchanged.',
      'A bare `scripts/<name>` path will not resolve.',
      'End with bare references/',
    ];
    const input = lines.join('\r\n');
    const runtimeRoot = '.claude/spec-first/workflows/spec-doc-review';

    const rewritten = rewriteCommandSkillLocalResourcePaths(input, runtimeRoot);

    expect(rewritten).toContain(
      'Read `.claude/spec-first/workflows/spec-doc-review/references/a.md` and `./.claude/spec-first/workflows/spec-doc-review/scripts/run.sh`.',
    );
    expect(rewritten).toContain(
      '@./.claude/spec-first/workflows/spec-doc-review/assets/template.md',
    );
    expect(rewritten).toContain(
      'Load .claude/spec-first/workflows/spec-doc-review/prompts/prompt.md, .claude/spec-first/workflows/spec-doc-review/schemas/schema.json, and .claude/spec-first/workflows/spec-doc-review/rule-packs/base.yaml.',
    );
    expect(rewritten).toContain('`skills/spec-doc-review/references/source.md`');
    expect(rewritten).toContain('`.agents/skills/spec-doc-review/references/runtime.md`');
    expect(rewritten).toContain('`.kiro/settings/mcp.json` and `.qoder/settings.local.json`');
    expect(rewritten).toContain('`$SKILL_DIR/scripts/run.sh` and `../references/parent.md`');
    expect(rewritten).toContain('`/opt/tool/references/absolute.md`');
    expect(rewritten).toContain('`https://example.test/references/web.md`');
    expect(rewritten).toContain('`C:\\scripts/mixed.sh`');
    expect(rewritten).toContain('`@references/literal.md`');
    expect(rewritten).toContain('`evals/examples.json`');
    expect(rewritten).toContain(
      '`.claude/spec-first/workflows/spec-doc-review/references/personas/<reviewer>.md`',
    );
    expect(rewritten).toContain(
      'Support files are `references/`, `scripts/`, `assets/`, `prompts/`, `schemas/`, and `rule-packs/`.',
    );
    expect(rewritten).toContain('Keep conceptual glob `references/**` unchanged.');
    expect(rewritten).toContain('A bare `scripts/<name>` path will not resolve.');
    expect(rewritten.endsWith('End with bare references/')).toBe(true);
    expect(rewritten.split('\r\n')).toHaveLength(lines.length);
    expect(rewriteCommandSkillLocalResourcePaths(rewritten, runtimeRoot)).toBe(rewritten);
    expect(findUnresolvedCommandSkillLocalResourcePaths(rewritten)).toEqual([]);
    expect(unresolvedPhysicalCommandResources(
      '/tmp/command-resource-probe',
      runtimeRoot,
      'Run "$SKILL_DIR/scripts/missing.sh".',
    )).toEqual([`${runtimeRoot}/scripts/missing.sh`]);
    expect(findUnresolvedCommandSkillLocalResourcePaths(
      'Support files are `references/`, `scripts/`, and `assets/`.',
    )).toEqual([]);
  });

  test('preserves explicit source-of-truth pointers but does not treat Inputs rows as source authority', () => {
    const content = [
      'The canonical source-of-truth is `skills/spec-prd/scripts/check-prd-artifact.js`.',
      '| Inputs | `skills/spec-prd/scripts/check-prd-artifact.js` |',
      'Run `skills/spec-prd/scripts/check-prd-artifact.js`.',
    ].join('\n');

    expect(rewriteSourceSkillRuntimePaths(
      content,
      'spec-prd',
      '.qoder/skills/spec-prd',
    )).toBe([
      'The canonical source-of-truth is `skills/spec-prd/scripts/check-prd-artifact.js`.',
      '| Inputs | `.qoder/skills/spec-prd/scripts/check-prd-artifact.js` |',
      'Run `.qoder/skills/spec-prd/scripts/check-prd-artifact.js`.',
    ].join('\n'));
  });

  test.each(['claude', 'qoder'])(
    '%s command integrity reports a reintroduced unresolved companion path',
    (platform) => {
      const projectRoot = tempProject(`${platform}-integrity`);
      const adapter = getAdapter(platform);
      plugin.syncBundledAssets(projectRoot, adapter);
      const command = commandDefinition('spec-doc-review');
      const commandPath = path.join(
        projectRoot,
        adapter.commandRoot,
        adapter.commandFilename(command),
      );
      fs.appendFileSync(commandPath, '\nRead `references/missing.md`.\n');

      const drift = plugin.inspectInstalledAssets(projectRoot, adapter).commands.drifted
        .find((entry) => entry.commandName === command.name);

      expect(drift).toMatchObject({
        issues: expect.arrayContaining([
          'unresolved_command_skill_local_resource:references',
          'content_mismatch',
        ]),
      });
    },
  );
});
