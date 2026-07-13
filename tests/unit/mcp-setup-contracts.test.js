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
      '`--verify-only` / `--refresh-facts` 会重新验证并刷新 setup-owned facts，但不执行安装或 host config 写入。',
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

    expect(skill).toContain('## Default Full Setup Flow');
    expect(skill).toContain('--only codegraph,graphify');
    expect(skill).toContain('defaults-active');
    expect(skill).toContain('default to all discovered supported child repos');
    expect(skill).toContain('`--repo <child>` is the explicit narrowing control');
    expect(skill).toContain('默认 parent-workspace batch 则从 parent 运行');
    expect(registry.providers.filter((entry) => entry.setup_required).map((entry) => entry.id).sort())
      .toEqual(['codegraph', 'graphify']);
    expect(registry.tools.find((entry) => entry.id === 'codegraph')).toMatchObject({ setup_required: true });
    expect(registry.helpers.find((entry) => entry.id === 'ffmpeg')).toMatchObject({
      baseline_blocking: true,
      detection: { args: ['-version'] },
    });
  });

  test('裸完整 setup 自动修复 registry managed drift，子集修复仍需显式授权', () => {
    const skill = fs.readFileSync(
      path.join(repoRoot, 'skills', 'spec-runtime-setup', 'SKILL.md'),
      'utf8',
    );

    expect(skill).toContain('Bare workflow invocation 本身已授权自动修复 selected target 中 registry 管理的 `host-config-conflict`');
    expect(skill).toContain('自动携带 `--repair-host-config` 重新 preview 并继续 apply');
    expect(skill).toContain('Subset / Repair Flow');
    expect(skill).toContain('Host conflict 仍需独立 `--repair-host-config` 授权');
    expect(skill).not.toContain('只有用户明确要求自动修复时，才追加 `--repair-host-config`');
  });
});
