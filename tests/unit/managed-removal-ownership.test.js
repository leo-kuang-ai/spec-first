'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { getAdapter, getSupportedPlatforms } = require('../../src/cli/adapters');
const CodexAdapter = require('../../src/cli/adapters/codex');
const { removeManagedCodingGuidelinesBlock } = require('../../src/cli/coding-guidelines');
const { removeManagedBootstrapBlock } = require('../../src/cli/instruction-bootstrap');
const { LANG_END, LANG_START } = require('../../src/cli/lang-policy');
const {
  RUNTIME_TOOLS_END,
  RUNTIME_TOOLS_START,
  removeManagedRuntimeToolsBlock,
} = require('../../src/cli/runtime-tools-index');
const {
  applyOperationPlan,
  planHardResetManagedAssets,
  planObsoleteManagedAssetRemoval,
} = require('../../src/cli/state');

const repoRoot = path.resolve(__dirname, '..', '..');
const cliPath = path.join(repoRoot, 'bin', 'spec-first.js');
const lifecycleSandboxes = new Set();

function tempProjectRoot() {
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-removal-ownership-')));
}

function writeFile(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, 'utf8');
}

function removeDirTargets(projectRoot) {
  return new CodexAdapter()
    .planRuntimeFilesRemoval(projectRoot)
    .operations.filter((operation) => operation.kind === 'remove_dir')
    .map((operation) => operation.path);
}

function tempLifecycleSandbox(prefix) {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const home = path.join(projectRoot, 'home');
  fs.mkdirSync(home, { recursive: true });
  lifecycleSandboxes.add(projectRoot);
  return { projectRoot, home };
}

function runSpecFirst(args, sandbox) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: sandbox.projectRoot,
    env: { ...process.env, HOME: sandbox.home },
    encoding: 'utf8',
    timeout: 120000,
  });
}

function initHosts(hosts, sandbox) {
  return runSpecFirst([
    'init',
    ...hosts.map((host) => `--${host}`),
    '-y',
    '-u',
    'managed-removal-test',
    '--lang',
    'en',
  ], sandbox);
}

afterEach(() => {
  for (const projectRoot of lifecycleSandboxes) {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  }
  lifecycleSandboxes.clear();
});

// Managed-block and managed-directory removal must delete only what spec-first can prove it
// generated. These contracts pin the ownership boundary so cleanup never eats user content.
describe('managed runtime-tools block removal ownership', () => {
  test('removes a balanced managed block and keeps the user tail', () => {
    const result = removeManagedRuntimeToolsBlock(
      `# Project\n\nintro\n\n${RUNTIME_TOOLS_START}\nMANAGED BODY\n${RUNTIME_TOOLS_END}\n\nuser tail\n`,
    );

    expect(result).not.toContain('MANAGED BODY');
    expect(result).toContain('intro');
    expect(result).toContain('user tail');
  });

  test('keeps unattributable content when only an orphaned start marker remains', () => {
    const result = removeManagedRuntimeToolsBlock(
      `# Project\n\nintro\n\n${RUNTIME_TOOLS_START}\nuser paragraph A\n\nuser paragraph B\n`,
    );

    expect(result).toContain('user paragraph A');
    expect(result).toContain('user paragraph B');
    expect(result).not.toContain(RUNTIME_TOOLS_START);
  });

  test.each([
    ['Runtime Tools'],
    ['Runtime Code Intelligence Tools'],
    ['代码智能与运行时工具'],
  ])('removes an orphaned block that still opens with the generated heading %s', (heading) => {
    const result = removeManagedRuntimeToolsBlock(
      `# Project\n\nintro\n\n${RUNTIME_TOOLS_START}\n## ${heading}\n\ngenerated body\n`,
    );

    expect(result).not.toContain(heading);
    expect(result).not.toContain('generated body');
    expect(result).toContain('intro');
  });

  test('bounds orphaned-marker removal at the next user heading', () => {
    const result = removeManagedRuntimeToolsBlock(
      `# Project\n\n${RUNTIME_TOOLS_START}\nstale managed line\n\n## User Section\n\nuser body\n`,
    );

    expect(result).not.toContain('stale managed line');
    expect(result).toContain('## User Section');
    expect(result).toContain('user body');
  });

  test('keeps all content when only an orphaned end marker remains', () => {
    const result = removeManagedRuntimeToolsBlock(
      `# Project\n\nuser body\n${RUNTIME_TOOLS_END}\nmore user content\n`,
    );

    expect(result).toContain('user body');
    expect(result).toContain('more user content');
    expect(result).not.toContain(RUNTIME_TOOLS_END);
  });

  test('leaves a file without markers untouched apart from normalization', () => {
    const result = removeManagedRuntimeToolsBlock('# Project\n\nuser body\n');

    expect(result).toContain('user body');
  });
});

// Whitespace normalization is there to close the seam a removed block leaves behind. With no
// managed block present there is no seam, so the user's instruction file must come back verbatim.
describe('managed block removal leaves marker-free instruction files verbatim', () => {
  const userDoc = '\n\n# My Project\n\n\n\nIntentional triple blank lines above.\n\n\n\n## Another\n\nbody';

  test.each([
    ['coding guidelines', removeManagedCodingGuidelinesBlock],
    ['runtime tools', removeManagedRuntimeToolsBlock],
    ['bootstrap', removeManagedBootstrapBlock],
  ])('%s removal does not reformat a document without its markers', (_label, remove) => {
    expect(remove(userDoc)).toBe(userDoc);
  });
});

describe('single-host clean characterization', () => {
  test('removes host runtime and state without changing user-owned AGENTS.md bytes', () => {
    const sandbox = tempLifecycleSandbox('spec-first-single-consumer-clean-');
    const init = initHosts(['qoder'], sandbox);
    expect(init.status).toBe(0);

    const instructionPath = path.join(sandbox.projectRoot, 'AGENTS.md');
    const userBytes = '\n# Team-owned guidance\n\nKeep this byte sequence.\n';
    fs.appendFileSync(instructionPath, userBytes);

    const clean = runSpecFirst(['clean', '--qoder'], sandbox);
    expect(clean.status).toBe(0);
    expect(fs.readFileSync(instructionPath, 'utf8')).toContain(userBytes);
    expect(fs.existsSync(path.join(sandbox.projectRoot, '.qoder', 'spec-first', 'state.json'))).toBe(false);
    expect(fs.existsSync(path.join(sandbox.projectRoot, '.qoder', 'skills', 'spec-work'))).toBe(false);
  }, 120000);

  test('preserves shared AGENTS.md when another confirmed consumer remains', () => {
    const sandbox = tempLifecycleSandbox('spec-first-shared-consumer-clean-');
    const init = initHosts(['codex', 'qoder'], sandbox);
    expect(init.status).toBe(0);

    const instructionPath = path.join(sandbox.projectRoot, 'AGENTS.md');
    const before = fs.readFileSync(instructionPath, 'utf8');
    const preview = runSpecFirst(['clean', '--qoder', '--dry-run'], sandbox);
    expect(preview.status).toBe(0);
    expect(preview.stdout).toContain('shared_instruction_consumer_present');
    expect(fs.readFileSync(instructionPath, 'utf8')).toBe(before);

    const clean = runSpecFirst(['clean', '--qoder'], sandbox);
    expect(clean.status).toBe(0);
    expect(clean.stdout).toContain('shared_instruction_consumer_present');
    expect(fs.readFileSync(instructionPath, 'utf8')).toBe(before);
    expect(fs.existsSync(path.join(sandbox.projectRoot, '.codex', 'spec-first', 'state.json'))).toBe(true);
  }, 120000);

  test('preserves shared AGENTS.md when another consumer state is uncertain', () => {
    const sandbox = tempLifecycleSandbox('spec-first-uncertain-consumer-clean-');
    const init = initHosts(['qoder'], sandbox);
    expect(init.status).toBe(0);

    const instructionPath = path.join(sandbox.projectRoot, 'AGENTS.md');
    const before = fs.readFileSync(instructionPath, 'utf8');
    const codexStatePath = path.join(sandbox.projectRoot, '.codex', 'spec-first', 'state.json');
    fs.mkdirSync(path.dirname(codexStatePath), { recursive: true });
    fs.writeFileSync(codexStatePath, '{ invalid json\n', 'utf8');

    const clean = runSpecFirst(['clean', '--qoder'], sandbox);
    expect(clean.status).toBe(0);
    expect(clean.stdout).toContain('shared_instruction_consumer_uncertain');
    expect(fs.readFileSync(instructionPath, 'utf8')).toBe(before);
  }, 120000);

  test('preserves shared AGENTS.md when another managed runtime remains without state', () => {
    const sandbox = tempLifecycleSandbox('spec-first-state-missing-consumer-clean-');
    const init = initHosts(['codex', 'qoder'], sandbox);
    expect(init.status).toBe(0);

    const instructionPath = path.join(sandbox.projectRoot, 'AGENTS.md');
    const before = fs.readFileSync(instructionPath, 'utf8');
    fs.rmSync(path.join(sandbox.projectRoot, '.codex', 'spec-first', 'state.json'));

    const clean = runSpecFirst(['clean', '--qoder'], sandbox);
    expect(clean.status).toBe(0);
    expect(clean.stdout).toContain('shared_instruction_consumer_uncertain');
    expect(fs.readFileSync(instructionPath, 'utf8')).toBe(before);
    expect(fs.existsSync(path.join(sandbox.projectRoot, '.agents', 'skills', 'spec-work'))).toBe(true);
  }, 120000);

  test('removes shared managed blocks only for the final confirmed consumer', () => {
    const sandbox = tempLifecycleSandbox('spec-first-final-consumer-clean-');
    const init = initHosts(['qoder'], sandbox);
    expect(init.status).toBe(0);

    const instructionPath = path.join(sandbox.projectRoot, 'AGENTS.md');
    const userBytes = '\n# Team-owned guidance\n\nKeep this byte sequence.\n';
    fs.appendFileSync(instructionPath, userBytes);

    const clean = runSpecFirst(['clean', '--qoder'], sandbox);
    expect(clean.status).toBe(0);
    const cleaned = fs.readFileSync(instructionPath, 'utf8');
    expect(cleaned).not.toContain(LANG_START);
    expect(cleaned).not.toContain(LANG_END);
    expect(cleaned).toContain(userBytes);
  }, 120000);
});

describe('retired managed skill upgrade ownership', () => {
  const baseState = {
    manifestVersion: 'test',
    platform: 'test',
    commands: [],
    workflowSkills: [],
    agents: [],
    agentSupportFiles: [],
  };

  test.each(getSupportedPlatforms())(
    '%s removes only the previously managed retired skill and is idempotent',
    (platform) => {
      const projectRoot = tempProjectRoot();
      const adapter = getAdapter(platform);
      const previousState = { ...baseState, platform, skills: ['spec-proof', 'spec-work'] };
      const nextState = { ...baseState, platform, skills: ['spec-work'] };
      const retiredRoot = path.join(projectRoot, adapter.skillsRoot, 'spec-proof');
      const siblingSentinel = path.join(
        projectRoot,
        adapter.skillsRoot,
        'user-owned-sibling',
        'sentinel.txt',
      );
      writeFile(path.join(retiredRoot, 'SKILL.md'), 'previously managed\n');
      writeFile(siblingSentinel, 'keep\n');

      const plan = planObsoleteManagedAssetRemoval(
        projectRoot,
        previousState,
        nextState,
        adapter,
      );
      expect(plan.operations).toEqual([
        expect.objectContaining({
          kind: 'remove_dir',
          path: path.posix.join(adapter.skillsRoot, 'spec-proof'),
          reason: 'obsolete_managed_skill',
        }),
      ]);

      applyOperationPlan(projectRoot, plan);
      expect(fs.existsSync(retiredRoot)).toBe(false);
      expect(fs.readFileSync(siblingSentinel, 'utf8')).toBe('keep\n');
      expect(planObsoleteManagedAssetRemoval(
        projectRoot,
        nextState,
        nextState,
        adapter,
      ).operations).toEqual([]);
    },
  );

  test.each(getSupportedPlatforms())(
    '%s does not guess ownership when previous managed state is missing',
    (platform) => {
      const projectRoot = tempProjectRoot();
      const adapter = getAdapter(platform);
      const sameNameUserFile = path.join(
        projectRoot,
        adapter.skillsRoot,
        'spec-proof',
        'user-owned.txt',
      );
      writeFile(sameNameUserFile, 'keep\n');

      const plan = planObsoleteManagedAssetRemoval(
        projectRoot,
        null,
        { ...baseState, platform, skills: ['spec-work'] },
        adapter,
      );
      expect(plan.operations).toEqual([]);
      applyOperationPlan(projectRoot, plan);
      expect(fs.readFileSync(sameNameUserFile, 'utf8')).toBe('keep\n');
    },
  );
});

describe('managed hard reset ownership', () => {
  test.each(getSupportedPlatforms())(
    '%s hard reset removes exact state entries and preserves custom siblings',
    (platform) => {
      const projectRoot = tempProjectRoot();
      const adapter = getAdapter(platform);
      const state = {
        manifestVersion: 'test',
        platform,
        commands: adapter.hasCommands ? ['spec-work.md'] : [],
        skills: ['spec-work'],
        workflowSkills: adapter.workflowsRoot !== adapter.skillsRoot ? ['spec-plan'] : [],
        agents: adapter.supportsAgents === false ? [] : ['spec-review.md'],
        agentSupportFiles: [],
      };

      if (adapter.hasCommands) {
        writeFile(path.join(projectRoot, adapter.commandRoot, 'spec-work.md'), 'managed\n');
        writeFile(path.join(projectRoot, adapter.commandRoot, 'spec-company-policy.md'), 'keep\n');
      }
      writeFile(path.join(projectRoot, adapter.skillsRoot, 'spec-work', 'SKILL.md'), 'managed\n');
      writeFile(path.join(projectRoot, adapter.skillsRoot, 'spec-company-skill', 'SKILL.md'), 'keep\n');
      if (state.workflowSkills.length > 0) {
        writeFile(path.join(projectRoot, adapter.workflowsRoot, 'spec-plan', 'SKILL.md'), 'managed\n');
        writeFile(path.join(projectRoot, adapter.workflowsRoot, 'spec-company-workflow', 'SKILL.md'), 'keep\n');
      }
      if (state.agents.length > 0) {
        writeFile(path.join(projectRoot, adapter.agentsRoot, 'spec-review.md'), 'managed\n');
        writeFile(path.join(projectRoot, adapter.agentsRoot, 'spec-company-agent.md'), 'keep\n');
      }

      const plan = planHardResetManagedAssets(projectRoot, state, adapter);
      expect(plan.operations).not.toEqual(expect.arrayContaining([
        expect.objectContaining({ kind: 'remove_dir', path: adapter.commandRoot }),
        expect.objectContaining({ kind: 'remove_dir', path: adapter.workflowsRoot }),
      ]));
      applyOperationPlan(projectRoot, plan);

      if (adapter.hasCommands) {
        expect(fs.readFileSync(
          path.join(projectRoot, adapter.commandRoot, 'spec-company-policy.md'),
          'utf8',
        )).toBe('keep\n');
      }
      expect(fs.readFileSync(
        path.join(projectRoot, adapter.skillsRoot, 'spec-company-skill', 'SKILL.md'),
        'utf8',
      )).toBe('keep\n');
      if (state.workflowSkills.length > 0) {
        expect(fs.readFileSync(
          path.join(projectRoot, adapter.workflowsRoot, 'spec-company-workflow', 'SKILL.md'),
          'utf8',
        )).toBe('keep\n');
      }
      if (state.agents.length > 0) {
        expect(fs.readFileSync(
          path.join(projectRoot, adapter.agentsRoot, 'spec-company-agent.md'),
          'utf8',
        )).toBe('keep\n');
      }
    },
  );

});

describe('codex legacy runtime root removal ownership', () => {
  test('skips a generically named user directory that holds no spec-first asset', () => {
    const projectRoot = tempProjectRoot();
    writeFile(path.join(projectRoot, 'plugins', 'spec', 'src', 'index.js'), 'module.exports = {};\n');
    writeFile(path.join(projectRoot, 'plugins', 'spec', 'README.md'), 'my own build plugin\n');

    expect(removeDirTargets(projectRoot)).not.toContain('plugins/spec');

    new CodexAdapter().removeRuntimeFiles(projectRoot);

    expect(fs.existsSync(path.join(projectRoot, 'plugins', 'spec', 'src', 'index.js'))).toBe(true);
    expect(fs.existsSync(path.join(projectRoot, 'plugins', 'spec', 'README.md'))).toBe(true);
  });

  test('preserves ambiguous legacy plugin roots even when names resemble spec-first assets', () => {
    const projectRoot = tempProjectRoot();
    writeFile(
      path.join(projectRoot, 'plugins', 'spec-first', 'skills', 'spec-work', 'SKILL.md'),
      '---\nname: spec-work\n---\n',
    );
    writeFile(path.join(projectRoot, '.agents', 'plugins', 'spec', 'using-spec-first.md'), 'x\n');

    const targets = removeDirTargets(projectRoot);
    expect(targets).not.toContain('plugins/spec-first');
    expect(targets).not.toContain('.agents/plugins');

    new CodexAdapter().removeRuntimeFiles(projectRoot);

    expect(fs.existsSync(path.join(projectRoot, 'plugins', 'spec-first', 'skills', 'spec-work', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(projectRoot, '.agents', 'plugins', 'spec', 'using-spec-first.md'))).toBe(true);
  });

  test('never targets unprefixed legacy skill names but still clears the spec-first namespace', () => {
    const projectRoot = tempProjectRoot();
    writeFile(path.join(projectRoot, '.codex', 'skills', 'plan', 'SKILL.md'), 'my own plan skill\n');
    writeFile(path.join(projectRoot, '.codex', 'skills', 'spec-work', 'SKILL.md'), 'generated\n');

    const targets = removeDirTargets(projectRoot);
    // Managed legacy-cleanup names mirror codex.js legacyCodexSpecFirstSkillNames():
    // every bundled skill except graphify — prefixed or not (autoresearch is unprefixed).
    const managedNames = new Set(
      require('../../src/cli/plugin').listBundledSkills().filter((name) => name !== 'graphify'),
    );
    const unprefixed = targets.filter(
      (target) => target.startsWith('.codex/skills/')
        && !managedNames.has(target.slice('.codex/skills/'.length)),
    );
    expect(unprefixed).toEqual([]);
    expect(targets).toContain('.codex/skills/spec-work');

    new CodexAdapter().removeRuntimeFiles(projectRoot);

    expect(fs.existsSync(path.join(projectRoot, '.codex', 'skills', 'plan', 'SKILL.md'))).toBe(true);
    expect(fs.existsSync(path.join(projectRoot, '.codex', 'skills', 'spec-work'))).toBe(false);
  });
});
