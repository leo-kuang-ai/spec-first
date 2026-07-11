'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { getAdapter, getSupportedPlatforms } = require('../../src/cli/adapters');

const repoRoot = path.resolve(__dirname, '..', '..');
const cliPath = path.join(repoRoot, 'bin', 'spec-first.js');
const sandboxRoots = new Set();

afterEach(() => {
  for (const root of sandboxRoots) {
    fs.rmSync(root, { recursive: true, force: true });
  }
  sandboxRoots.clear();
});

function tempSandbox(platform) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `spec-first-${platform}-lifecycle-`));
  sandboxRoots.add(root);
  const projectRoot = path.join(root, 'project');
  const home = path.join(root, 'home');
  fs.mkdirSync(projectRoot, { recursive: true });
  fs.mkdirSync(home, { recursive: true });
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

function parseJsonOutput(result) {
  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`failed to parse JSON output: ${error.message}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  }
}

const pointerPlatforms = getSupportedPlatforms().filter((platform) =>
  Boolean(getAdapter(platform).pointerPath)
);

describe('five-host init lifecycle', () => {
  test.each(getSupportedPlatforms())(
    '%s fresh init is self-consistent and immediately idempotent',
    (platform) => {
      const sandbox = tempSandbox(platform);
      const adapter = getAdapter(platform);
      const initArgs = [
        'init',
        `--${platform}`,
        '-y',
        '-u',
        'lifecycle-test',
        '--lang',
        'en',
      ];

      const firstInit = runSpecFirst(initArgs, sandbox);
      expect(firstInit.status).toBe(0);

      const instruction = fs.readFileSync(
        path.join(sandbox.projectRoot, adapter.instructionFile),
        'utf8',
      );
      expect(instruction).toContain('`using-spec-first`');
      expect(instruction).not.toContain('skills/using-spec-first/SKILL.md');
      expect(instruction).not.toContain('CHANGELOG.md');
      expect(instruction).not.toContain('### Changelog');

      const runtimeSkillPath = path.join(
        sandbox.projectRoot,
        adapter.skillsRoot,
        'using-spec-first',
        'SKILL.md',
      );
      expect(fs.existsSync(runtimeSkillPath)).toBe(true);
      const changelog = fs.readFileSync(
        path.join(sandbox.projectRoot, 'CHANGELOG.md'),
        'utf8',
      );
      expect(changelog).toContain('使用 spec-first 初始化项目');

      if (adapter.pointerPath) {
        const pointer = fs.readFileSync(
          path.join(sandbox.projectRoot, adapter.pointerPath),
          'utf8',
        );
        expect(pointer).toContain(`${adapter.skillsRoot}/using-spec-first/SKILL.md`);
        expect(pointer).not.toContain('Workflow entry routing lives in `skills/using-spec-first/SKILL.md`.');
      }

      if (platform === 'qoder') {
        expect(firstInit.stderr).toContain('qoder_hook_activation_unverified');
        expect(firstInit.stderr).toContain('qodercli 1.0.41 evidence baseline confirms the hook settings and command protocol');
        expect(firstInit.stderr).toContain('inactive');
      }

      const doctor = runSpecFirst(['doctor', `--${platform}`, '--json'], sandbox);
      expect(doctor.status).toBe(0);
      const report = parseJsonOutput(doctor);
      const instructionCheck = report.checks.find((check) =>
        check.name === `${adapter.instructionFile} workflow entry guidance`
      );
      expect(instructionCheck).toMatchObject({ level: 'PASS' });
      expect(report.checks.filter((check) => check.drift === true)).toEqual([]);
      if (platform === 'qoder') {
        const degradedHookChecks = report.checks.filter((check) =>
          check.reasonCode === 'qoder_hook_activation_unverified'
        );
        expect(degradedHookChecks).toHaveLength(3);
        expect(degradedHookChecks).toEqual(expect.arrayContaining([
          expect.objectContaining({
            level: 'WARNING',
            degradedByDesign: true,
            drift: false,
          }),
        ]));
      }

      const secondInit = runSpecFirst([...initArgs, '--dry-run'], sandbox);
      expect(secondInit.status).toBe(0);
      const secondOutput = `${secondInit.stdout}\n${secondInit.stderr}`;
      expect(secondOutput).not.toContain('current_runtime_drift');
      expect(secondOutput).not.toContain('managed hard reset before regenerating runtime assets (current runtime drift detected)');
    },
    120000,
  );

  test.each(getSupportedPlatforms())(
    '%s preserves an existing CHANGELOG byte-for-byte',
    (platform) => {
      const sandbox = tempSandbox(`${platform}-changelog`);
      const changelogPath = path.join(sandbox.projectRoot, 'CHANGELOG.md');
      const sentinel = '# User-owned changelog\n\n- keep this byte-for-byte\n';
      fs.writeFileSync(changelogPath, sentinel);

      const init = runSpecFirst([
        'init',
        `--${platform}`,
        '-y',
        '-u',
        'lifecycle-test',
        '--lang',
        'en',
      ], sandbox);

      expect(init.status).toBe(0);
      expect(fs.readFileSync(changelogPath, 'utf8')).toBe(sentinel);
    },
    120000,
  );

  test.each(pointerPlatforms)(
    '%s preserves a user-owned pointer and keeps immediate re-init stable',
    (platform) => {
      const sandbox = tempSandbox(`${platform}-pointer-collision`);
      const adapter = getAdapter(platform);
      const pointerPath = path.join(sandbox.projectRoot, adapter.pointerPath);
      const userOwnedContents = '# User-owned host rule\n';
      fs.mkdirSync(path.dirname(pointerPath), { recursive: true });
      fs.writeFileSync(pointerPath, userOwnedContents);
      const initArgs = [
        'init',
        `--${platform}`,
        '-y',
        '-u',
        'lifecycle-test',
        '--lang',
        'en',
      ];

      const firstInit = runSpecFirst(initArgs, sandbox);
      expect(firstInit.status).toBe(0);
      expect(firstInit.stderr).toContain('host_native_pointer_user_owned_collision');
      expect(fs.readFileSync(pointerPath, 'utf8')).toBe(userOwnedContents);

      const secondInit = runSpecFirst([...initArgs, '--dry-run'], sandbox);
      expect(secondInit.status).toBe(0);
      expect(secondInit.stderr).toContain('host_native_pointer_user_owned_collision');
      const secondOutput = `${secondInit.stdout}\n${secondInit.stderr}`;
      expect(secondOutput).not.toContain('current_runtime_drift');
      expect(secondOutput).not.toContain('managed hard reset before regenerating runtime assets');
    },
    120000,
  );

  test('same-project five-host init stays coherent and removes stale maintainer-only assets', () => {
    const sandbox = tempSandbox('all-hosts-coexistence');
    const initArgs = [
      'init',
      ...getSupportedPlatforms().map((platform) => `--${platform}`),
      '-y',
      '-u',
      'lifecycle-test',
      '--lang',
      'en',
    ];

    const firstInit = runSpecFirst(initArgs, sandbox);
    expect(firstInit.status).toBe(0);

    for (const platform of getSupportedPlatforms()) {
      const adapter = getAdapter(platform);
      const prdRoot = path.join(
        sandbox.projectRoot,
        adapter.workflowsRoot,
        'spec-prd',
      );
      const appAuditRoot = path.join(
        sandbox.projectRoot,
        adapter.workflowsRoot,
        'spec-app-consistency-audit',
      );
      fs.mkdirSync(path.join(prdRoot, 'evals'), { recursive: true });
      fs.writeFileSync(path.join(prdRoot, 'evals', 'stale.json'), '{}\n');
      fs.writeFileSync(path.join(appAuditRoot, 'README.md'), '# stale runtime maintainer README\n');
    }

    const secondInit = runSpecFirst(initArgs, sandbox);
    expect(secondInit.status).toBe(0);

    for (const platform of getSupportedPlatforms()) {
      const adapter = getAdapter(platform);
      expect(fs.existsSync(path.join(
        sandbox.projectRoot,
        adapter.workflowsRoot,
        'spec-prd',
        'evals',
      ))).toBe(false);
      expect(fs.existsSync(path.join(
        sandbox.projectRoot,
        adapter.workflowsRoot,
        'spec-app-consistency-audit',
        'README.md',
      ))).toBe(false);

      const doctor = runSpecFirst(['doctor', `--${platform}`, '--json'], sandbox);
      expect(doctor.status).toBe(0);
      const report = parseJsonOutput(doctor);
      expect(report.checks.filter((check) => check.drift === true)).toEqual([]);

      if (platform === 'claude') {
        expect(report.checks.find((check) => check.name === '.claude/skills')).toMatchObject({
          level: 'PASS',
          message: 'found 12 standalone/internal skill directory(ies) in .claude/skills and 17 workflow mirror directory(ies) in .claude/spec-first/workflows',
        });
      }
      if (platform === 'cursor') {
        expect(report.checks.filter((check) =>
          check.reasonCode === 'cursor_managed_projection_precedence_unverified'
        )).toHaveLength(1);
        expect(report.checks.filter((check) =>
          check.reasonCode === 'cursor_external_skill_precedence_unverified'
        )).toEqual([]);
      }
      if (platform === 'qoder') {
        expect(report.checks.filter((check) =>
          check.reasonCode === 'qoder_hook_activation_unverified'
        )).toHaveLength(3);
      }
    }
  }, 120000);

  test('doctor reports managed pointer body drift', () => {
    const platform = 'kiro';
    const sandbox = tempSandbox(`${platform}-pointer-drift`);
    const adapter = getAdapter(platform);
    const initArgs = [
      'init',
      `--${platform}`,
      '-y',
      '-u',
      'lifecycle-test',
      '--lang',
      'en',
    ];
    const firstInit = runSpecFirst(initArgs, sandbox);
    expect(firstInit.status).toBe(0);

    const pointerPath = path.join(sandbox.projectRoot, adapter.pointerPath);
    const pointer = fs.readFileSync(pointerPath, 'utf8');
    fs.writeFileSync(
      pointerPath,
      pointer.replace(
        `${adapter.skillsRoot}/using-spec-first/SKILL.md`,
        'skills/using-spec-first/SKILL.md',
      ),
    );

    const doctor = runSpecFirst(['doctor', `--${platform}`, '--json'], sandbox);
    expect(doctor.status).toBe(0);
    const report = parseJsonOutput(doctor);
    const pointerCheck = report.checks.find((check) => check.name === adapter.pointerPath);
    expect(pointerCheck).toMatchObject({
      level: 'WARNING',
      drift: true,
      reasonCode: 'host_native_pointer_content_drift',
    });

    const secondInit = runSpecFirst([...initArgs, '--dry-run'], sandbox);
    expect(secondInit.status).toBe(0);
    expect(`${secondInit.stdout}\n${secondInit.stderr}`).toContain('current runtime drift detected');
  }, 120000);
});
