'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const OpenCodeAdapter = require('../../src/cli/adapters/opencode');
const { getAdapter, getSupportedPlatforms } = require('../../src/cli/adapters');
const {
  defaultInitPlatforms,
  parseInitArgs,
  resolveRememberedHosts,
} = require('../../src/cli/commands/init-args');
const { parseCleanArgs } = require('../../src/cli/commands/clean');
const { detectPlatforms } = require('../../src/cli/commands/doctor');
const { detectInstalledRuntimePlatforms } = require('../../src/cli/commands/update');

function tempProject(label) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `spec-first-opencode-${label}-`));
}

function writeText(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

describe('OpenCode adapter', () => {
  test('is the sixth canonical adapter with preview-only support metadata', () => {
    expect(getSupportedPlatforms()).toEqual([
      'claude',
      'codex',
      'cursor',
      'kiro',
      'qoder',
      'opencode',
    ]);

    const adapter = getAdapter('opencode');
    expect(adapter).toBeInstanceOf(OpenCodeAdapter);
    expect(adapter).toMatchObject({
      id: 'opencode',
      runtimeRoot: '.opencode',
      managedRoot: '.opencode/spec-first',
      commandRoot: '.opencode/commands/spec',
      skillsRoot: '.opencode/skills',
      workflowsRoot: '.opencode/skills',
      agentsRoot: '.opencode/agents',
      stateFile: '.opencode/spec-first/state.json',
      instructionFile: 'AGENTS.md',
      hasCommands: true,
      supportsAgents: false,
      supportState: 'preview',
      evidenceClaim: 'generated_runtime_preview',
      testedVersions: [],
    });
    expect('workerPrimitive' in adapter).toBe(false);
    expect('workerCapabilities' in adapter).toBe(false);
  });

  test('keeps OpenCode opt-in across init, clean, and update detection', () => {
    expect(parseInitArgs(['--opencode', '-y']).platforms).toEqual(['opencode']);
    expect(defaultInitPlatforms()).toEqual(['claude', 'codex']);
    expect(resolveRememberedHosts({ hosts: ['codex', 'opencode'] })).toEqual(['codex', 'opencode']);
    expect(parseCleanArgs(['--opencode'])).toMatchObject({ opencode: true, unknown: [] });

    const projectRoot = tempProject('managed-detection');
    fs.mkdirSync(path.join(projectRoot, '.opencode'), { recursive: true });
    expect(detectPlatforms(projectRoot)).not.toContain('opencode');
    expect(detectInstalledRuntimePlatforms(projectRoot)).not.toContain('opencode');
    writeText(path.join(projectRoot, '.opencode', 'spec-first', 'state.json'), '{}\n');
    expect(detectPlatforms(projectRoot)).toContain('opencode');
    expect(detectInstalledRuntimePlatforms(projectRoot)).toContain('opencode');
  });

  test('renders command and skill entrypoints from one canonical skill body', () => {
    const adapter = new OpenCodeAdapter();
    const template = [
      '---',
      'description: "Run the workflow"',
      'argument-hint: "[plan]"',
      '---',
      '',
      'Template-only explanation.',
    ].join('\n');
    const skill = [
      '---',
      'name: spec-work',
      'description: "Execute a plan"',
      '---',
      '',
      'Canonical workflow body.',
      'Use `.agents/skills/spec-work/scripts/check.cjs`.',
    ].join('\n');

    const command = adapter.renderCommandContent(
      { name: 'work', filename: 'work.md', description: 'Run the workflow' },
      template,
      {
        commandName: 'work',
        skillName: 'spec-work',
        skillContent: skill,
        runtimeSkillRoot: '.opencode/skills/spec-work',
      },
    );
    const projectedSkill = adapter.transformSkillContent(skill, {
      skillName: 'spec-work',
      relativePath: 'SKILL.md',
    });

    expect(command).toContain('description: "Run the workflow"');
    expect(command).toContain('Canonical workflow body.');
    expect(command).not.toContain('Template-only explanation.');
    expect(command).toContain('.opencode/skills/spec-work/scripts/check.cjs');
    expect(projectedSkill).toContain('Canonical workflow body.');
    expect(projectedSkill).toContain('.opencode/skills/spec-work/scripts/check.cjs');
  });

  test('normalizes generated-runtime context lists without leaving foreign host drift', () => {
    const adapter = new OpenCodeAdapter();
    const source = fs.readFileSync(
      path.join(__dirname, '../../skills/spec-optimize/SKILL.md'),
      'utf8',
    );
    const projected = adapter.transformSkillContent(source, {
      skillName: 'spec-optimize',
      relativePath: 'SKILL.md',
      isWorkflowSkill: false,
    });
    const projectRoot = tempProject('runtime-context');
    writeText(
      path.join(projectRoot, '.opencode', 'skills', 'spec-optimize', 'SKILL.md'),
      projected,
    );

    expect(projected).toContain(
      'generated mirrors (`.opencode/commands/spec/**`, `.opencode/skills/**`, `.opencode/spec-first/**`)',
    );
    expect(adapter.inspectRuntimeFiles(projectRoot)).toEqual(expect.arrayContaining([
      expect.objectContaining({
        name: '.opencode/skills/spec-optimize/SKILL.md',
        level: 'PASS',
      }),
    ]));
  });

  test('reports missing, partial, loader-unverified, collision, and unsupported-agent diagnostics', () => {
    const adapter = new OpenCodeAdapter();
    const projectRoot = tempProject('diagnostics');

    expect(adapter.inspectRuntimeFiles(projectRoot)).toEqual(expect.arrayContaining([
      expect.objectContaining({ reasonCode: 'opencode_runtime_root_missing' }),
      expect.objectContaining({ reasonCode: 'opencode_generated_runtime_loader_unverified' }),
    ]));

    writeText(
      path.join(projectRoot, '.opencode', 'commands', 'spec', 'work.md'),
      '---\ndescription: "work"\n---\n\nbody\n',
    );
    expect(adapter.inspectRuntimeFiles(projectRoot)).toEqual(expect.arrayContaining([
      expect.objectContaining({ reasonCode: 'opencode_runtime_projection_partial' }),
    ]));

    writeText(
      path.join(projectRoot, '.opencode', 'skills', 'spec-work', 'SKILL.md'),
      '---\nname: spec-work\ndescription: "work"\n---\n\nbody\n',
    );
    writeText(
      path.join(projectRoot, '.agents', 'skills', 'spec-work', 'SKILL.md'),
      '---\nname: spec-work\ndescription: "other"\n---\n\nbody\n',
    );
    writeText(path.join(projectRoot, '.opencode', 'agents', 'reviewer.md'), 'unexpected\n');

    expect(adapter.inspectRuntimeFiles(projectRoot)).toEqual(expect.arrayContaining([
      expect.objectContaining({ reasonCode: 'opencode_external_skill_precedence_unverified' }),
      expect.objectContaining({ reasonCode: 'opencode_bundled_agents_unsupported' }),
      expect.objectContaining({ reasonCode: 'opencode_generated_runtime_loader_unverified' }),
    ]));
  });
});
