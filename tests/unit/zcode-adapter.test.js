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

const GOVERNANCE_PATH = path.join(
  __dirname, '..', '..', 'src', 'cli', 'contracts', 'dual-host-governance', 'skills-governance.json',
);

// Entry-point skill sources shaped like the real projections: cross-host paths
// (rewritten by the shared transform), a Workflow Modes anchor (pin injection
// site), and frontmatter (skill-name rewrite site).
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

describe('zcode adapter registration', () => {
  test('registers zcode as a supported platform with a display name', () => {
    expect(getSupportedPlatforms()).toContain('zcode');
    expect(getAdapter('zcode').id).toBe('zcode');
    expect(getPlatformDisplayName('zcode')).toBe('ZCode');
  });

  test('opts out of init defaults (explicit opt-in host)', () => {
    const choice = INIT_PLATFORM_CHOICES.find((entry) => entry.id === 'zcode');
    expect(choice).toBeDefined();
    expect(choice.defaultChecked).toBe(false);
    expect(choice.defaultForYes).toBe(false);
  });

  test('governance host_delivery.zcode mirrors the codex column for every record', () => {
    const governance = JSON.parse(fs.readFileSync(GOVERNANCE_PATH, 'utf8'));
    expect(governance.skills.length).toBeGreaterThan(0);
    for (const record of governance.skills) {
      expect(record.host_delivery.zcode).toBe(record.host_delivery.codex);
    }
  });
});

describe('zcode shared projection contract', () => {
  const codex = getAdapter('codex');
  const zcode = getAdapter('zcode');

  test('projects skills from the shared .agents/skills root like codex', () => {
    expect(zcode.skillsRoot).toBe('.agents/skills');
    expect(zcode.workflowsRoot).toBe('.agents/skills');
    expect(zcode.skillsRoot).toBe(codex.skillsRoot);
    expect(zcode.workflowsRoot).toBe(codex.workflowsRoot);
    expect(zcode.hasCommands).toBe(false);
    expect(zcode.instructionFile).toBe('AGENTS.md');
    expect(zcode.supportsAgents).toBe(false);
  });

  test('keeps zcode-specific state under .zcode/spec-first/', () => {
    expect(zcode.runtimeRoot).toBe('.zcode');
    expect(zcode.managedRoot).toBe('.zcode/spec-first');
    expect(zcode.stateFile).toBe('.zcode/spec-first/state.json');
    expect(zcode.stateFile).not.toBe(codex.stateFile);
  });

  // The shared .agents/skills directory is written once and consumed by both
  // hosts; any transform divergence reintroduces a last-writer-wins hazard on
  // re-init. This contract locks the two projections byte-for-byte.
  test.each([
    ['workflow skill', WORKFLOW_SKILL_SOURCE, { skillName: 'spec-work', isWorkflowSkill: true }],
    ['runtime-setup surface', RUNTIME_SETUP_SOURCE, { skillName: 'spec-runtime-setup', isWorkflowSkill: false }],
  ])('transforms %s identically to the codex adapter', (_label, source, overrides) => {
    const context = entrypointContext(overrides);
    expect(zcode.transformSkillContent(source, context))
      .toBe(codex.transformSkillContent(source, context));
  });

  test('the shared setup host pin stays host-neutral for both hosts', () => {
    const context = entrypointContext({ skillName: 'spec-runtime-setup', isWorkflowSkill: false });
    const projected = zcode.transformSkillContent(RUNTIME_SETUP_SOURCE, context);
    expect(projected).toContain('## Shared Setup Host Pin');
    expect(projected).toContain('`MCP_SETUP_HOST=codex` under Codex');
    expect(projected).toContain('`MCP_SETUP_HOST=zcode` under ZCode');
    expect(projected).not.toContain('## Codex Host Pin');
  });
});

describe('zcode runtime file planning', () => {
  const zcode = getAdapter('zcode');

  test('plans the SessionStart hook script plus the .zcode/config.json managed slice', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'zcode-adapter-plan-'));
    try {
      const plan = zcode.planRuntimeFilesSync(projectRoot);
      const paths = plan.operations.map((operation) => operation.path);
      expect(paths).toContain('.zcode/hooks/session-start');
      expect(paths).toContain('.zcode/config.json');

      const removal = zcode.planRuntimeFilesRemoval(projectRoot);
      expect(removal.operations.length).toBeGreaterThan(0);
      expect(zcode.inspectRuntimeFiles(projectRoot).length).toBeGreaterThan(0);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('inspects the shared skills root and the zcode-specific state file', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'zcode-adapter-'));
    try {
      fs.mkdirSync(path.join(projectRoot, '.agents', 'skills', 'spec-work'), { recursive: true });
      const beforeInstall = zcode.inspect(projectRoot);
      expect(beforeInstall).toMatchObject({
        platform: 'zcode',
        skills: true,
        state: false,
        commands: false,
      });

      fs.mkdirSync(path.join(projectRoot, '.zcode', 'spec-first'), { recursive: true });
      fs.writeFileSync(path.join(projectRoot, '.zcode', 'spec-first', 'state.json'), '{}\n');
      const afterInstall = zcode.inspect(projectRoot);
      expect(afterInstall.state).toBe(true);
      expect(afterInstall.runtimeExists).toBe(true);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
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

  test('clean --zcode planning keeps the shared .agents/skills projection while codex still consumes it', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'zcode-shared-clean-'));
    try {
      writeInstalledState(projectRoot, getAdapter('codex'));
      writeInstalledState(projectRoot, getAdapter('zcode'));

      expect(hasSharedSkillsRootConsumer(projectRoot, getAdapter('zcode'))).toBe(true);

      const managedState = {
        platform: 'zcode',
        manifestVersion: 'managed-state/v1',
        commands: [],
        skills: ['spec-work'],
        workflowSkills: ['spec-plan'],
        agents: [],
        agentSupportFiles: [],
      };
      const plan = planManagedAssetRemoval(projectRoot, managedState, getAdapter('zcode'));
      expect(plan.skippedSharedSkills).toBe(true);
      expect(plan.operations.some((operation) => String(operation.path || '').includes('.agents/skills'))).toBe(false);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('the last shared-root consumer still removes the projection', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'zcode-last-clean-'));
    try {
      writeInstalledState(projectRoot, getAdapter('zcode'));

      expect(hasSharedSkillsRootConsumer(projectRoot, getAdapter('zcode'))).toBe(false);

      const managedState = {
        platform: 'zcode',
        manifestVersion: 'managed-state/v1',
        commands: [],
        skills: ['spec-work'],
        workflowSkills: [],
        agents: [],
        agentSupportFiles: [],
      };
      const plan = planManagedAssetRemoval(projectRoot, managedState, getAdapter('zcode'));
      expect(plan.skippedSharedSkills).toBe(false);
      expect(plan.operations.some((operation) => String(operation.path || '').includes('.agents/skills'))).toBe(true);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });
});
