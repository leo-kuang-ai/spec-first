'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { getAdapter } = require('../../src/cli/adapters');
const plugin = require('../../src/cli/plugin');
const {
  findUnresolvedCommandSkillLocalResourcePaths,
  rewriteCommandSkillLocalResourcePaths,
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

      for (const command of plugin.listBundledCommands()) {
        const content = readRuntimeCommand(projectRoot, adapter, command.skill);
        expect(findUnresolvedCommandSkillLocalResourcePaths(content)).toEqual([]);
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
    expect(rewritten.split('\r\n')).toHaveLength(lines.length);
    expect(rewriteCommandSkillLocalResourcePaths(rewritten, runtimeRoot)).toBe(rewritten);
    expect(findUnresolvedCommandSkillLocalResourcePaths(rewritten)).toEqual([]);
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
