'use strict';

const childProcess = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const templatePath = path.join(repoRoot, 'skills', 'spec-runtime-setup', 'references', 'config-template.yaml');
const cliPath = path.join(repoRoot, 'bin', 'spec-first.js');

function tempRepo(label) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `spec-first-${label}-`));
  childProcess.execFileSync('git', ['init', '-q', root]);
  return root;
}

function readRepairFixture(platform) {
  return JSON.parse(fs.readFileSync(
    path.join(repoRoot, 'tests', 'fixtures', 'mcp-setup', 'repair-worktree', `${platform}.json`),
    'utf8',
  ));
}

function runRepairWorktreeCli(cwd, argv) {
  return childProcess.spawnSync(
    process.execPath,
    [cliPath, 'repair-worktree', ...argv],
    { cwd, encoding: 'utf8', windowsHide: true },
  );
}

describe('spec-runtime-setup project config', () => {
  test('inspects, plans, applies, and re-applies project-local actions idempotently', () => {
    const {
      inspectProjectConfig,
      planProjectConfig,
      applyProjectConfig,
    } = require('../../skills/spec-runtime-setup/scripts/lib/project-config.cjs');
    const target = tempRepo('project-config');

    expect(inspectProjectConfig({ repoRoot: target, templatePath })).toMatchObject({
      schema_version: 'project-local-config-status.v1',
      status: 'action-required',
      repo_root: target,
      example_config: { status: 'missing', next_action: expect.stringContaining('--refresh-example') },
      local_config: { status: 'defaults-active', next_action: null },
      local_config_gitignore: { status: 'not-applicable', next_action: null },
      legacy_markdown_config: { status: 'missing', next_action: null },
      legacy_local_config: { path: '', status: 'retired', next_action: null },
    });

    const plan = planProjectConfig({
      repoRoot: target,
      refreshExample: true,
      createLocal: true,
      ensureGitignore: true,
    });
    expect(plan).toMatchObject({
      schema_version: 'project-config-action-plan.v1',
      mutation: true,
      blocked: false,
    });
    expect(plan.actions.map((entry) => entry.kind)).toEqual([
      'refresh-example',
      'create-local',
      'ensure-gitignore',
    ]);

    const first = applyProjectConfig({ plan, templatePath });
    expect(first).toMatchObject({
      schema_version: 'project-config-bootstrap.v1',
      overall_status: 'ready',
      project: {
        example_config_status: 'refreshed',
        local_config_status: 'created',
        local_config_gitignore_status: 'added',
      },
    });
    expect(fs.readFileSync(path.join(target, '.spec-first', 'config.local.example.yaml'), 'utf8'))
      .toBe(fs.readFileSync(templatePath, 'utf8'));
    expect(fs.readFileSync(path.join(target, '.gitignore'), 'utf8')).toContain('.spec-first/*.local.yaml');
    expect(inspectProjectConfig({ repoRoot: target, templatePath })).toMatchObject({
      status: 'ready',
      example_config: { status: 'current', next_action: null },
      local_config: { status: 'present', next_action: null },
      local_config_gitignore: { status: 'ignored', next_action: null },
    });

    const second = applyProjectConfig({ plan, templatePath });
    expect(second).toMatchObject({
      overall_status: 'ready',
      project: {
        example_config_status: 'unchanged',
        local_config_status: 'already-exists',
        local_config_gitignore_status: 'already-present',
      },
    });
  });

  test('preserves the not-applicable project-local-config-status v1 shape', () => {
    const { inspectProjectConfig } = require('../../skills/spec-runtime-setup/scripts/lib/project-config.cjs');

    expect(inspectProjectConfig({ repoRoot: '', templatePath })).toEqual({
      schema_version: 'project-local-config-status.v1',
      status: 'not-applicable',
      reason_code: 'target-root-unavailable',
      example_config: { status: 'not-applicable', next_action: null },
      local_config: { status: 'not-applicable', next_action: null },
      local_config_gitignore: { status: 'not-applicable', next_action: null },
      legacy_markdown_config: { status: 'not-applicable', next_action: null },
      legacy_local_config: { status: 'not-applicable', next_action: null },
    });
  });

  test('reports current, outdated, ready-for-local-config, and legacy residue with v1 vocabulary', () => {
    const { inspectProjectConfig } = require('../../skills/spec-runtime-setup/scripts/lib/project-config.cjs');
    const target = tempRepo('project-config-status');
    const specDir = path.join(target, '.spec-first');
    fs.mkdirSync(specDir, { recursive: true });
    fs.writeFileSync(path.join(specDir, 'config.local.example.yaml'), 'outdated\n');
    fs.writeFileSync(path.join(target, '.gitignore'), '.spec-first/*.local.yaml\n');
    fs.writeFileSync(path.join(target, 'compound-engineering.local.md'), 'legacy\n');

    expect(inspectProjectConfig({ repoRoot: target, templatePath })).toMatchObject({
      status: 'action-required',
      example_config: { status: 'outdated', next_action: expect.stringContaining('--refresh-example') },
      local_config: { status: 'defaults-active', next_action: null },
      local_config_gitignore: { status: 'ready-for-local-config', next_action: null },
      legacy_markdown_config: {
        status: 'present',
        next_action: '需要人工审查；仅在显式批准后删除',
      },
    });

    fs.copyFileSync(templatePath, path.join(specDir, 'config.local.example.yaml'));
    expect(inspectProjectConfig({ repoRoot: target, templatePath })).toMatchObject({
      status: 'ready',
      example_config: { status: 'current', next_action: null },
      local_config_gitignore: { status: 'ready-for-local-config', next_action: null },
    });
  });

  test('fails closed when a managed ancestor or leaf is a symlink', () => {
    const { planProjectConfig, applyProjectConfig } = require('../../skills/spec-runtime-setup/scripts/lib/project-config.cjs');
    const target = tempRepo('project-config-symlink');
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-project-config-outside-'));
    fs.symlinkSync(outside, path.join(target, '.spec-first'));

    const plan = planProjectConfig({ repoRoot: target, refreshExample: true });
    expect(() => applyProjectConfig({ plan, templatePath })).toThrow(
      expect.objectContaining({ reason_code: 'project-config-symlink-escape' }),
    );
    expect(fs.readdirSync(outside)).toEqual([]);
  });

  test('does not delete legacy markdown without an explicit action', () => {
    const { planProjectConfig, applyProjectConfig } = require('../../skills/spec-runtime-setup/scripts/lib/project-config.cjs');
    const target = tempRepo('project-config-legacy');
    const legacy = path.join(target, 'compound-engineering.local.md');
    fs.writeFileSync(legacy, 'legacy\n');

    applyProjectConfig({
      plan: planProjectConfig({ repoRoot: target, refreshExample: true }),
      templatePath,
    });
    expect(fs.existsSync(legacy)).toBe(true);

    const deleted = applyProjectConfig({
      plan: planProjectConfig({ repoRoot: target, deleteLegacyMarkdown: true }),
      templatePath,
    });
    expect(deleted.legacy.legacy_markdown_status).toBe('deleted');
    expect(fs.existsSync(legacy)).toBe(false);
  });

  test('summarizes parent batches without writing child artifacts at the parent root', () => {
    const {
      planProjectConfig,
      applyProjectConfigBatch,
    } = require('../../skills/spec-runtime-setup/scripts/lib/project-config.cjs');
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-project-config-batch-'));
    const childA = path.join(workspace, 'a');
    const childB = path.join(workspace, 'b');
    childProcess.execFileSync('git', ['init', '-q', childA]);
    childProcess.execFileSync('git', ['init', '-q', childB]);

    const summary = applyProjectConfigBatch({
      workspaceRoot: workspace,
      selectionSource: 'workspace-default-all-repos',
      plans: [
        planProjectConfig({ repoRoot: childA, refreshExample: true }),
        planProjectConfig({ repoRoot: childB, refreshExample: true }),
      ],
      templatePath,
    });

    expect(summary).toMatchObject({
      schema_version: 'workspace-project-config-bootstrap-summary.v1',
      overall_status: 'ready',
      selection_source: 'workspace-default-all-repos',
      parent_writes_repo_local_artifacts: false,
      counts: { total: 2, ready: 2, action_required: 0 },
      summary_write_status: 'ready',
      summary_write_reason_code: null,
    });
    expect(fs.existsSync(path.join(workspace, '.spec-first', 'config.local.example.yaml'))).toBe(false);
    expect(fs.existsSync(path.join(workspace, '.spec-first', 'workspace', 'project-config-bootstrap-summary.json'))).toBe(true);
  });

  test('preserves child outcomes when the workspace summary path is symlinked', () => {
    const {
      planProjectConfig,
      applyProjectConfigBatch,
    } = require('../../skills/spec-runtime-setup/scripts/lib/project-config.cjs');
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-project-config-summary-failure-'));
    const childA = path.join(workspace, 'a');
    const childB = path.join(workspace, 'b');
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-project-config-summary-outside-'));
    childProcess.execFileSync('git', ['init', '-q', childA]);
    childProcess.execFileSync('git', ['init', '-q', childB]);
    fs.symlinkSync(outside, path.join(workspace, '.spec-first'), process.platform === 'win32' ? 'junction' : 'dir');

    const summary = applyProjectConfigBatch({
      workspaceRoot: workspace,
      selectionSource: 'workspace-default-all-repos',
      plans: [
        planProjectConfig({ repoRoot: childA, refreshExample: true }),
        planProjectConfig({ repoRoot: childB, refreshExample: true }),
      ],
      templatePath,
    });

    expect(summary).toMatchObject({
      schema_version: 'workspace-project-config-bootstrap-summary.v1',
      overall_status: 'failed',
      reason_code: 'workspace-summary-symlink-escape',
      counts: { total: 2, ready: 2, action_required: 0 },
      summary_write_status: 'failed',
      summary_write_reason_code: 'workspace-summary-symlink-escape',
      results: [
        expect.objectContaining({ workspace_relative_path: 'a', overall_status: 'ready', exit_code: 0 }),
        expect.objectContaining({ workspace_relative_path: 'b', overall_status: 'ready', exit_code: 0 }),
      ],
    });
    expect(fs.existsSync(path.join(childA, '.spec-first', 'config.local.example.yaml'))).toBe(true);
    expect(fs.existsSync(path.join(childB, '.spec-first', 'config.local.example.yaml'))).toBe(true);
    expect(fs.readdirSync(outside)).toEqual([]);
  });
});

describe('spec-first repair-worktree Node backend', () => {
  test('保留 legacy Git health reason code 与 ancestor 探测语义', () => {
    const {
      inspectGitHealth,
    } = require('../../skills/spec-runtime-setup/scripts/lib/worktree-health.cjs');
    const repo = tempRepo('worktree-health-legacy');
    const nested = path.join(repo, 'nested');
    fs.mkdirSync(nested, { recursive: true });
    expect(inspectGitHealth(nested)).toMatchObject({
      status: 'ok',
      reason_code: 'git-ok',
      git_entry_type: 'ancestor',
    });

    const malformed = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-worktree-malformed-'));
    fs.writeFileSync(path.join(malformed, '.git'), 'not-a-gitdir-pointer\n');
    expect(inspectGitHealth(malformed)).toMatchObject({
      status: 'corrupted-gitdir',
      reason_code: 'gitdir-file-unparseable',
      git_entry_type: 'file',
    });

    const invalidPointer = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-worktree-invalid-'));
    const admin = path.join(path.dirname(invalidPointer), 'existing-admin', 'worktrees', 'demo');
    fs.mkdirSync(admin, { recursive: true });
    fs.writeFileSync(path.join(invalidPointer, '.git'), `gitdir: ${admin}\n`);
    expect(inspectGitHealth(invalidPointer)).toMatchObject({
      status: 'broken-worktree',
      reason_code: 'broken-worktree-pointer-invalid',
      git_entry_type: 'file',
      worktree_pointer: { raw: admin, path: admin, exists: true },
    });

    const symlinked = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-worktree-symlink-'));
    const linkedGitDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-worktree-linked-gitdir-'));
    fs.symlinkSync(
      linkedGitDir,
      path.join(symlinked, '.git'),
      process.platform === 'win32' ? 'junction' : 'dir',
    );
    expect(inspectGitHealth(symlinked)).toMatchObject({
      status: 'corrupted-gitdir',
      reason_code: 'gitdir-directory-invalid',
      git_entry_type: 'directory',
    });
  });

  test('keeps apply and unlink fail-closed and returns a dry-run preview', () => {
    const {
      buildRepairWorktreePreview,
      inspectGitHealth,
    } = require('../../skills/spec-runtime-setup/scripts/lib/worktree-health.cjs');
    const target = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-worktree-health-'));
    fs.writeFileSync(path.join(target, '.git'), 'gitdir: ../missing-admin/worktrees/demo\n');

    expect(inspectGitHealth(target)).toMatchObject({
      status: 'broken-worktree',
      reason_code: 'broken-worktree',
      git_entry_type: 'file',
    });
    expect(buildRepairWorktreePreview({ cwd: target, argv: ['--apply'] })).toMatchObject({
      exit_code: 1,
      reason_code: 'repair-worktree-apply-deferred',
    });
    expect(buildRepairWorktreePreview({ cwd: target, argv: ['--unlink'] })).toMatchObject({
      exit_code: 1,
      reason_code: 'repair-worktree-apply-deferred',
    });
    expect(buildRepairWorktreePreview({ cwd: target, argv: ['--dry-run'] })).toMatchObject({
      exit_code: 0,
      schema_version: 'repair-worktree-preview.v1',
      mutation: false,
      git_health: { status: 'broken-worktree' },
    });
    expect(fs.existsSync(path.join(target, '.git'))).toBe(true);
  });

  test('保持 POSIX 与 Windows fixture 的 help、channel、reason code 和 dry-run 语义等价', () => {
    const posix = readRepairFixture('posix');
    const windows = readRepairFixture('windows');
    const fixture = process.platform === 'win32' ? windows : posix;

    expect(posix.contract).toEqual(windows.contract);

    const help = runRepairWorktreeCli(repoRoot, fixture.contract.help.argv);
    expect(help.status).toBe(fixture.contract.help.exit_code);
    for (const marker of fixture.contract.help.stdout_contains) expect(help.stdout).toContain(marker);
    expect(help.stderr).toBe('');

    for (const scenarioName of ['apply', 'unlink', 'unknown']) {
      const scenario = fixture.contract[scenarioName];
      const observed = runRepairWorktreeCli(repoRoot, scenario.argv);
      expect(observed.status).toBe(scenario.exit_code);
      expect(observed.stdout).toBe('');
      expect(observed.stderr).toContain(`reason_code=${scenario.reason_code}`);
    }

    const broken = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-repair-worktree-broken-'));
    const gitEntry = path.join(broken, '.git');
    fs.writeFileSync(gitEntry, 'gitdir: ../missing-admin/worktrees/demo\n');
    const dryRun = runRepairWorktreeCli(broken, fixture.contract.dry_run.argv);
    expect(dryRun.status).toBe(fixture.contract.dry_run.exit_code);
    expect(dryRun.stdout).toContain(`reason_code=${fixture.contract.dry_run.reason_code}`);
    for (const marker of fixture.contract.dry_run.stdout_contains) expect(dryRun.stdout).toContain(marker);
    expect(dryRun.stderr).toBe('');
    expect(fs.existsSync(gitEntry)).toBe(fixture.contract.dry_run.preserves_git_entry);

    const healthy = tempRepo('repair-worktree-healthy');
    const notBroken = runRepairWorktreeCli(healthy, fixture.contract.not_broken.argv);
    expect(notBroken.status).toBe(fixture.contract.not_broken.exit_code);
    expect(notBroken.stdout).toBe('');
    expect(notBroken.stderr).toContain(`reason_code=${fixture.contract.not_broken.reason_code}`);
  });
});
