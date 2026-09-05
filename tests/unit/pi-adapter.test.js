'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  getAdapter,
  getPlatformDisplayName,
  getSupportedPlatforms,
} = require('../../src/cli/adapters');
const {
  INIT_PLATFORM_CHOICES,
} = require('../../src/cli/commands/init-args');
const { loadSkillsGovernance } = require('../../src/cli/plugin-manifest');

const GOVERNANCE_PATH = path.join(
  __dirname, '..', '..', 'src', 'cli', 'contracts', 'dual-host-governance', 'skills-governance.json',
);

// 形如真实投影的入口 skill 源：跨宿主路径（共享 transform 的重写点）、
// Workflow Modes 锚（pin 注入点）与 frontmatter（skill 名重写点）。
const WORKFLOW_SKILL_SOURCE = [
  '---',
  'name: spec-work',
  'description: "work skill"',
  '---',
  '',
  'Refer to `.claude/commands/spec/work.md` and `.claude/spec-first/workflows/spec-work/`.',
  '',
  '## Workflow Modes',
  '',
  'One mode.',
  '',
].join('\n');

const RUNTIME_SETUP_SOURCE = [
  '---',
  'name: spec-runtime-setup',
  'description: "runtime setup"',
  '---',
  '',
  'Invokes scripts under `skills/spec-runtime-setup/scripts/`.',
  '',
  '## Workflow Modes',
  '',
  'Setup mode.',
  '',
].join('\n');

function entrypointContext(overrides = {}) {
  return {
    relativePath: 'SKILL.md',
    ...overrides,
  };
}

describe('pi adapter registration', () => {
  test('registers pi as a supported platform with a display name', () => {
    expect(getSupportedPlatforms()).toContain('pi');
    expect(getAdapter('pi').id).toBe('pi');
    expect(getPlatformDisplayName('pi')).toBe('Pi');
  });

  test('opts out of init defaults (explicit opt-in host)', () => {
    const choice = INIT_PLATFORM_CHOICES.find((entry) => entry.id === 'pi');
    expect(choice).toBeDefined();
    expect(choice.defaultChecked).toBe(false);
    expect(choice.defaultForYes).toBe(false);
  });

  test('governance host_delivery keys equal the supported platform set exactly', () => {
    const governance = JSON.parse(fs.readFileSync(GOVERNANCE_PATH, 'utf8'));
    const expectedPlatforms = getSupportedPlatforms().sort();
    expect(governance.skills.length).toBeGreaterThan(0);
    for (const record of governance.skills) {
      expect(Object.keys(record.host_delivery).sort()).toEqual(expectedPlatforms);
    }
  });

  test('governance host_delivery.pi mirrors the codex column for every record', () => {
    const governance = JSON.parse(fs.readFileSync(GOVERNANCE_PATH, 'utf8'));
    for (const record of governance.skills) {
      expect(record.host_delivery.pi).toBe(record.host_delivery.codex);
    }
  });

  test('governance loads through the manifest validator with pi registered', () => {
    const loaded = loadSkillsGovernance();
    expect(loaded.skills.length).toBeGreaterThan(0);
    for (const record of loaded.skills) {
      expect(Object.keys(record.host_delivery)).toContain('pi');
    }
  });
});

describe('pi shared projection contract', () => {
  const codex = getAdapter('codex');
  const pi = getAdapter('pi');

  test('projects skills from the shared .agents/skills root like codex', () => {
    expect(pi.skillsRoot).toBe('.agents/skills');
    expect(pi.workflowsRoot).toBe('.agents/skills');
    expect(pi.skillsRoot).toBe(codex.skillsRoot);
    expect(pi.workflowsRoot).toBe(codex.workflowsRoot);
    expect(pi.hasCommands).toBe(false);
    expect(pi.instructionFile).toBe('AGENTS.md');
    expect(pi.supportsAgents).toBe(false);
    expect(pi.supportState).toBe('preview');
    expect(pi.evidenceClaim).toBe('skills_discovery_and_trust_live_verified');
    expect(pi.testedVersions).toEqual(['0.85.0']);
  });

  test('keeps pi-specific state under .pi/spec-first/', () => {
    expect(pi.runtimeRoot).toBe('.pi');
    expect(pi.managedRoot).toBe('.pi/spec-first');
    expect(pi.stateFile).toBe('.pi/spec-first/state.json');
    expect(pi.stateFile).not.toBe(codex.stateFile);
  });

  test('commandRoot placeholder stays inside the managed namespace, never .pi/prompts', () => {
    // clean 的 hasManagedRuntimeSurface 无 hasCommands 守卫地探查 commandRoot
    // 存在性，占位值若在受管命名空间之外会把用户自有的 .pi/prompts/ 误报为
    // spec-first 安装。
    expect(pi.commandRoot).toBe('.pi/spec-first/commands');
    expect(pi.commandRoot.startsWith('.pi/prompts')).toBe(false);
    expect(pi.commandRoot.startsWith(`${pi.managedRoot}/`)).toBe(true);
  });

  // 共享 .agents/skills 目录一次写入、由 codex/zcode/pi 三方消费；任何 transform
  // 分歧都会在 re-init 时重现「最后写入者胜出」风险。本契约逐字节锁定投影。
  test.each([
    ['workflow skill', WORKFLOW_SKILL_SOURCE, { skillName: 'spec-work', isWorkflowSkill: true }],
    ['runtime-setup surface', RUNTIME_SETUP_SOURCE, { skillName: 'spec-runtime-setup', isWorkflowSkill: false }],
  ])('transforms %s identically to the codex adapter', (_label, source, overrides) => {
    const context = entrypointContext(overrides);
    expect(pi.transformSkillContent(source, context))
      .toBe(codex.transformSkillContent(source, context));
  });

  test('the shared setup host pin stays unchanged for pi (known limitation, not rewritten)', () => {
    const context = entrypointContext({ skillName: 'spec-runtime-setup', isWorkflowSkill: false });
    const projected = pi.transformSkillContent(RUNTIME_SETUP_SOURCE, context);
    expect(projected).toBe(codex.transformSkillContent(RUNTIME_SETUP_SOURCE, context));
    expect(projected).toContain('## Shared Setup Host Pin');
    expect(projected).not.toContain('MCP_SETUP_HOST=pi');
  });
});

describe('pi runtime file planning', () => {
  const pi = getAdapter('pi');

  test('plans no runtime file operations: the state file is owned by shared init logic', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-adapter-plan-'));
    try {
      const syncPlan = pi.planRuntimeFilesSync(projectRoot);
      expect(syncPlan.operations).toEqual([]);
      expect(syncPlan.summary).toEqual({});

      const removalPlan = pi.planRuntimeFilesRemoval(projectRoot);
      expect(removalPlan.operations).toEqual([]);

      // no-op 必须显式：CodexAdapter 的继承实现会计划 `.codex/hooks/*` 与
      // `.codex/hooks.json` 写入，对 pi 是错误的副作用面。
      const syncPaths = JSON.stringify(syncPlan);
      expect(syncPaths).not.toContain('.codex/');
      expect(syncPaths).not.toContain('.pi/');
      expect(pi.inspectRuntimeFiles(projectRoot)).toEqual([]);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('removeRuntimeFiles is a no-op without touching the filesystem', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-adapter-remove-'));
    try {
      fs.mkdirSync(path.join(projectRoot, '.agents', 'skills', 'spec-work'), { recursive: true });
      expect(() => pi.removeRuntimeFiles(projectRoot)).not.toThrow();
      expect(fs.existsSync(path.join(projectRoot, '.agents', 'skills', 'spec-work'))).toBe(true);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('inspects the shared skills root and the pi-specific state file', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-adapter-'));
    try {
      fs.mkdirSync(path.join(projectRoot, '.agents', 'skills', 'spec-work'), { recursive: true });
      const beforeInstall = pi.inspect(projectRoot);
      expect(beforeInstall).toMatchObject({
        platform: 'pi',
        skills: true,
        state: false,
        commands: false,
      });

      fs.mkdirSync(path.join(projectRoot, '.pi', 'spec-first'), { recursive: true });
      fs.writeFileSync(path.join(projectRoot, '.pi', 'spec-first', 'state.json'), '{}\n');
      const afterInstall = pi.inspect(projectRoot);
      expect(afterInstall.state).toBe(true);
      expect(afterInstall.runtimeExists).toBe(true);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });
});

describe('pi runtime detection semantics (KTD9)', () => {
  const { detectPlatforms } = require('../../src/cli/commands/doctor');

  test('a bare shared .agents/skills projection alone must not detect pi', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-detect-shared-'));
    try {
      fs.mkdirSync(path.join(projectRoot, '.agents', 'skills', 'spec-work'), { recursive: true });
      expect(detectPlatforms(projectRoot)).not.toContain('pi');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('user-owned .pi/ content without the managed state file must not detect pi', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-detect-user-'));
    try {
      fs.mkdirSync(path.join(projectRoot, '.pi', 'prompts'), { recursive: true });
      fs.writeFileSync(path.join(projectRoot, '.pi', 'settings.json'), '{}\n');
      expect(detectPlatforms(projectRoot)).not.toContain('pi');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('the managed .pi/spec-first/state.json is the sole positive detection signal', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-detect-state-'));
    try {
      fs.mkdirSync(path.join(projectRoot, '.pi', 'spec-first'), { recursive: true });
      fs.writeFileSync(path.join(projectRoot, '.pi', 'spec-first', 'state.json'), '{}\n');
      expect(detectPlatforms(projectRoot)).toContain('pi');
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });
});

describe('CodexAdapter inheritance exhaustiveness guard', () => {
  const CodexAdapter = require('../../src/cli/adapters/codex');
  const PiAdapter = require('../../src/cli/adapters/pi');

  // PiAdapter 有意继承的 CodexAdapter 成员，分三类：
  // 1) 内容 transform 与只读 inspect 面（行为面共享，KTD1/KTD2 的复用核心）；
  // 2) 共享投影 getters（hasCommands/skillsRoot/workflowsRoot/instructionFile
  //    ——pi 与 codex 同值，继承即契约）；
  // 3) codex legacy 根 getters——仅被 buildRuntimeCleanupOperations 等清理逻辑
  //    消费，而那些逻辑只存在于 planRuntimeFilesSync/planRuntimeFilesRemoval/
  //    removeRuntimeFiles 内，三者均被 pi 显式 no-op 覆盖，故对 pi 不可达。
  // 其余任何成员（尤其未来新增的 lifecycle/写面方法）都必须被 PiAdapter 显式
  // 覆盖，否则本测试失败——防止新增方法把 `.codex/` 副作用静默带给 pi。
  const INHERIT_SAFE = new Set([
    'constructor',
    'transformSkillContent',
    'transformAgentContent',
    'inspect',
    'commandFilename',
    'renderCommandContent',
    'hasCommands',
    'skillsRoot',
    'workflowsRoot',
    'instructionFile',
    'legacyCommandRoot',
    'legacyCodexSkillsRoot',
    'legacyMarketplaceRoot',
    'legacyPluginRoot',
    'legacyPluginRootAlt',
  ]);

  test('every CodexAdapter prototype member is overridden by pi or explicitly allowlisted', () => {
    const piOwn = new Set(Object.getOwnPropertyNames(PiAdapter.prototype));
    const unhandled = Object.getOwnPropertyNames(CodexAdapter.prototype)
      .filter((name) => !INHERIT_SAFE.has(name) && !piOwn.has(name));
    expect(unhandled).toEqual([]);
  });
});

describe('shared skills root protection on per-host removal', () => {
  const { hasSharedSkillsRootConsumer, planManagedAssetRemoval } = require('../../src/cli/state');

  function writeInstalledState(projectRoot, adapter) {
    const statePath = path.join(projectRoot, adapter.stateFile);
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    fs.writeFileSync(statePath, `${JSON.stringify({
      platform: adapter.id,
      manifestVersion: 'managed-state/v1',
      commands: [],
      skills: ['spec-work'],
      workflowSkills: [],
      agents: [],
      agentSupportFiles: [],
    })}\n`, 'utf8');
  }

  test('clean --pi planning keeps the shared .agents/skills projection while codex still consumes it', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-shared-clean-'));
    try {
      writeInstalledState(projectRoot, getAdapter('codex'));
      writeInstalledState(projectRoot, getAdapter('pi'));

      expect(hasSharedSkillsRootConsumer(projectRoot, getAdapter('pi'))).toBe(true);

      const managedState = {
        platform: 'pi',
        manifestVersion: 'managed-state/v1',
        commands: [],
        skills: ['spec-work'],
        workflowSkills: ['spec-plan'],
        agents: [],
        agentSupportFiles: [],
      };
      const plan = planManagedAssetRemoval(projectRoot, managedState, getAdapter('pi'));
      expect(plan.skippedSharedSkills).toBe(true);
      expect(plan.operations.some((operation) => String(operation.path || '').includes('.agents/skills'))).toBe(false);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('the last shared-root consumer still removes the projection', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'pi-last-clean-'));
    try {
      writeInstalledState(projectRoot, getAdapter('pi'));

      expect(hasSharedSkillsRootConsumer(projectRoot, getAdapter('pi'))).toBe(false);

      const managedState = {
        platform: 'pi',
        manifestVersion: 'managed-state/v1',
        commands: [],
        skills: ['spec-work'],
        workflowSkills: [],
        agents: [],
        agentSupportFiles: [],
      };
      const plan = planManagedAssetRemoval(projectRoot, managedState, getAdapter('pi'));
      expect(plan.skippedSharedSkills).toBe(false);
      expect(plan.operations.some((operation) => String(operation.path || '').includes('.agents/skills'))).toBe(true);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });
});
