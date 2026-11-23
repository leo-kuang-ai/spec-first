'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');

describe('spec-runtime-setup runner contracts', () => {
  test('keeps the unified Node setup sources available for the npm test:mcp-setup suite', () => {
    for (const relativePath of [
      'skills/spec-runtime-setup/setup-registry.json',
      'skills/spec-runtime-setup/setup-registry.schema.json',
      'skills/spec-runtime-setup/scripts/check-health',
      'skills/spec-runtime-setup/scripts/setup.cjs',
      'skills/spec-runtime-setup/scripts/lib/args.cjs',
      'skills/spec-runtime-setup/scripts/lib/configured-dependencies.cjs',
      'skills/spec-runtime-setup/scripts/lib/facts.cjs',
      'skills/spec-runtime-setup/scripts/lib/git-path.cjs',
      'skills/spec-runtime-setup/scripts/lib/host-authority.cjs',
      'skills/spec-runtime-setup/scripts/lib/host-config.cjs',
      'skills/spec-runtime-setup/scripts/lib/human-output.cjs',
      'skills/spec-runtime-setup/scripts/lib/installation-executor.cjs',
      'skills/spec-runtime-setup/scripts/lib/mode-policy.cjs',
      'skills/spec-runtime-setup/scripts/lib/path-safety.cjs',
      'skills/spec-runtime-setup/scripts/lib/preflight.cjs',
      'skills/spec-runtime-setup/scripts/lib/process-runner.cjs',
      'skills/spec-runtime-setup/scripts/lib/project-config.cjs',
      'skills/spec-runtime-setup/scripts/lib/project-target.cjs',
      'skills/spec-runtime-setup/scripts/lib/registry.cjs',
      'skills/spec-runtime-setup/scripts/lib/renderer.cjs',
      'skills/spec-runtime-setup/scripts/lib/runtime-executor.cjs',
      'skills/spec-runtime-setup/scripts/lib/scenario-fingerprint.cjs',
      'skills/spec-runtime-setup/scripts/lib/toml-section-editor.cjs',
      'skills/spec-runtime-setup/scripts/lib/workspace-executor.cjs',
      'skills/spec-runtime-setup/scripts/lib/worktree-health.cjs',
      'skills/spec-runtime-setup/scripts/providers/codegraph.cjs',
      'skills/spec-runtime-setup/scripts/providers/common.cjs',
      'skills/spec-runtime-setup/scripts/providers/graphify.cjs',
      'skills/spec-runtime-setup/scripts/providers/registry.cjs',
    ]) {
      expect(fs.existsSync(path.join(repoRoot, relativePath))).toBe(true);
    }
  });

  test('明确 verify-only 会刷新 setup-owned facts，而不是伪装成纯读取', () => {
    const reference = fs.readFileSync(
      path.join(repoRoot, 'skills', 'spec-runtime-setup', 'references', 'supported-mcp-tools.md'),
      'utf8',
    );

    expect(reference).toContain(
      '`--verify-only` / `--refresh-facts` will re-verify and refresh setup-owned facts, but will not perform installation or host config writes.',
    );
    expect(reference).not.toContain('`--verify-only` only reads facts');
  });

  test('标准 setup 默认包含 required providers，local override 缺失表示 defaults-active', () => {
    const skill = fs.readFileSync(
      path.join(repoRoot, 'skills', 'spec-runtime-setup', 'SKILL.md'),
      'utf8',
    );
    const registry = JSON.parse(fs.readFileSync(
      path.join(repoRoot, 'skills', 'spec-runtime-setup', 'setup-registry.json'),
      'utf8',
    ));

    expect(skill).toContain('## Default Diagnostic Flow');
    expect(skill).toContain('--only codegraph,graphify');
    expect(skill).toContain('defaults-active');
    expect(skill).toContain('a pure non-Git directory with no child repos becomes the single folder target');
    expect(skill).toContain('Parent directory bare / bare --all-repos / --check are all read-only diagnostics; batch installation uses `--installation-only --all-repos`, batch capability uses `--only codegraph,graphify --all-repos`.');
    expect(skill).toContain('--installation-only --all-repos');
    expect(skill).toContain('`--folder <path>` selects the exact logical project directory and does not require Git');
    expect(skill).toContain('`--repo <path>` must resolve to the exact Git repository root');
    expect(skill).toContain('the folder is never passed to Git-only `init --repo`');
    expect(skill).toContain('`next_action_command={cwd,command,args}`');
    expect(skill).toContain('`first_generation.scope_provenance`');
    expect(skill).toContain('When there is no target, the existing resolver distinguishes between single-directory and multi-repo parent directories, and scope expansion is prohibited.');
    expect(registry.providers.filter((entry) => entry.setup_required).map((entry) => entry.id).sort())
      .toEqual(['codegraph', 'graphify']);
    expect(registry.tools.find((entry) => entry.id === 'codegraph')).toMatchObject({ setup_required: true });
    expect(registry.helpers.find((entry) => entry.id === 'ffmpeg')).toMatchObject({
      baseline_blocking: false,
      readiness_policy: 'workflow-required',
      detection: { args: ['-version'] },
    });
  });

  test('单项目裸调用收敛基线，父目录诊断，配置修复需显式授权', () => {
    const skill = fs.readFileSync(
      path.join(repoRoot, 'skills', 'spec-runtime-setup', 'SKILL.md'),
      'utf8',
    );

    expect(skill).toContain('bare invocation converges the baseline declared in the registry');
    expect(skill).not.toContain('自动携带 `--repair-host-config`');
    expect(skill).toContain('Subset / Repair Flow');
    expect(skill).toContain('Host conflict still requires independent `--repair-host-config` authorization');
    expect(skill).not.toContain('只有用户明确要求自动修复时，才追加 `--repair-host-config`');
  });

  test('provider readiness v2 keeps project-local hook blocking separate from core readiness', () => {
    const schema = JSON.parse(fs.readFileSync(
      path.join(repoRoot, 'docs', 'contracts', 'provider-readiness.schema.json'),
      'utf8',
    ));
    const contract = fs.readFileSync(
      path.join(repoRoot, 'docs', 'contracts', 'provider-readiness.md'),
      'utf8',
    );

    expect(schema.properties.steady_state.properties.hook_status.enum).toContain('blocked');
    expect(schema.properties.steady_state.properties.refresh_mode.enum).toContain('manual-only');
    expect(contract).toContain('`readiness_status` is the only provider readiness field that enters setup decision health');
    expect(contract).toContain('hook blocked/failed/skipped 不得单独把这些成功事实改写为 Provider `degraded`');
    expect(contract).toContain('只有 `post-commit` marker 存在且两个文件均无 legacy override');
    expect(contract).toContain('graphify-external-hook-legacy-artifact-override + manual-only');
    expect(contract).toContain('从「不读」改为「限定文件只读验证、绝不写」');
    expect(schema.properties.steady_state.properties.hook_status.enum).toContain('verified-external');
    expect(schema.properties.steady_state.properties.refresh_mode.enum).toContain('commit-hook-external-verified');
  });

  test('Runtime Setup docs describe Graphify commit refresh as an explicit project-owner choice', () => {
    const skill = fs.readFileSync(path.join(repoRoot, 'skills', 'spec-runtime-setup', 'SKILL.md'), 'utf8');
    const manual = fs.readFileSync(path.join(repoRoot, 'docs', 'user-guide', '12-gitignore参考.md'), 'utf8');
    const boundary = fs.readFileSync(path.join(repoRoot, 'docs', 'contracts', 'source-runtime-customization-boundary.md'), 'utf8');

    for (const contents of [skill, manual, boundary]) {
      expect(contents).toContain('git rev-parse --git-path hooks');
      expect(contents).toContain('manual-only');
    }
    const external = skill.split('\n').find((line) => line.startsWith('- **External hooks:**'));
    expect(external).toContain('inspect only `post-commit` and `post-checkout` (regular files, at most 1 MiB each)');
    expect(external).toContain('A post-commit marker and no detected legacy override permit `verified-external` only if inspection is complete');
    expect(external).toContain('Missing markers, incomplete reads, or a checkout marker alone leave refresh `manual-only`');
    expect(external).toContain('a detected `GRAPHIFY_OUT=.graphify` override reports `graphify-external-hook-legacy-artifact-override`');
    expect(external).toContain('Never run `graphify hook status`, execute, modify, copy or chain external hooks, or change `core.hooksPath`');
    expect(external).toContain('External execution is unverified; `hook_installed` and `hook_verified` stay false');
    expect(external).toContain('Do not report an absent marker as an absent hook, a failed installation, or proof that Git will not run it');
    expect(skill).toContain('Never append or run `--refresh` solely because the status is unknown');
    expect(manual).toContain('git config --local core.hooksPath .githooks');
    expect(manual).toContain('仓库级 `core.hooksPath` 会覆盖全局值');
    expect(boundary).toContain('不得把它描述成外部 hook 不存在/安装失败');
    expect(boundary).toContain('不得仅因 core-ready `unknown` 自动执行 `--refresh`');
    expect(skill).not.toContain('Graphify graph/query/hook、host config');
    expect(skill).not.toContain('Graphify hook install 仍失败时，报告带 `next_actions` 的 `readiness_status=degraded`');
  });
});
