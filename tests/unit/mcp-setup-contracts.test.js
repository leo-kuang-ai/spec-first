'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');

describe('spec-mcp-setup runner contracts', () => {
  test('keeps the unified Node setup sources available for the npm test:mcp-setup suite', () => {
    for (const relativePath of [
      'skills/spec-mcp-setup/setup-registry.json',
      'skills/spec-mcp-setup/setup-registry.schema.json',
      'skills/spec-mcp-setup/scripts/check-health',
      'skills/spec-mcp-setup/scripts/setup.cjs',
      'skills/spec-mcp-setup/scripts/lib/args.cjs',
      'skills/spec-mcp-setup/scripts/lib/configured-dependencies.cjs',
      'skills/spec-mcp-setup/scripts/lib/facts.cjs',
      'skills/spec-mcp-setup/scripts/lib/host-authority.cjs',
      'skills/spec-mcp-setup/scripts/lib/host-config.cjs',
      'skills/spec-mcp-setup/scripts/lib/human-output.cjs',
      'skills/spec-mcp-setup/scripts/lib/installation-executor.cjs',
      'skills/spec-mcp-setup/scripts/lib/mode-policy.cjs',
      'skills/spec-mcp-setup/scripts/lib/path-safety.cjs',
      'skills/spec-mcp-setup/scripts/lib/preflight.cjs',
      'skills/spec-mcp-setup/scripts/lib/process-runner.cjs',
      'skills/spec-mcp-setup/scripts/lib/project-config.cjs',
      'skills/spec-mcp-setup/scripts/lib/project-target.cjs',
      'skills/spec-mcp-setup/scripts/lib/registry.cjs',
      'skills/spec-mcp-setup/scripts/lib/renderer.cjs',
      'skills/spec-mcp-setup/scripts/lib/runtime-executor.cjs',
      'skills/spec-mcp-setup/scripts/lib/scenario-fingerprint.cjs',
      'skills/spec-mcp-setup/scripts/lib/toml-section-editor.cjs',
      'skills/spec-mcp-setup/scripts/lib/workspace-executor.cjs',
      'skills/spec-mcp-setup/scripts/lib/worktree-health.cjs',
      'skills/spec-mcp-setup/scripts/providers/codegraph.cjs',
      'skills/spec-mcp-setup/scripts/providers/common.cjs',
      'skills/spec-mcp-setup/scripts/providers/graphify.cjs',
      'skills/spec-mcp-setup/scripts/providers/registry.cjs',
    ]) {
      expect(fs.existsSync(path.join(repoRoot, relativePath))).toBe(true);
    }
  });

  test('明确 verify-only 会刷新 setup-owned facts，而不是伪装成纯读取', () => {
    const reference = fs.readFileSync(
      path.join(repoRoot, 'skills', 'spec-mcp-setup', 'references', 'supported-mcp-tools.md'),
      'utf8',
    );

    expect(reference).toContain(
      '`--verify-only` / `--refresh-facts` 会重新验证并刷新 setup-owned facts，但不执行安装或 host config 写入。',
    );
    expect(reference).not.toContain('`--verify-only` only reads facts');
  });

  test('标准 setup 默认包含 required providers，local override 缺失表示 defaults-active', () => {
    const skill = fs.readFileSync(
      path.join(repoRoot, 'skills', 'spec-mcp-setup', 'SKILL.md'),
      'utf8',
    );
    const registry = JSON.parse(fs.readFileSync(
      path.join(repoRoot, 'skills', 'spec-mcp-setup', 'setup-registry.json'),
      'utf8',
    ));

    expect(skill).toContain('## Default Full Setup Flow');
    expect(skill).toContain('--only codegraph,graphify');
    expect(skill).toContain('defaults-active');
    expect(registry.providers.filter((entry) => entry.setup_required).map((entry) => entry.id).sort())
      .toEqual(['codegraph', 'graphify']);
    expect(registry.tools.find((entry) => entry.id === 'codegraph')).toMatchObject({ setup_required: true });
    expect(registry.helpers.find((entry) => entry.id === 'ffmpeg')).toMatchObject({
      baseline_blocking: true,
      detection: { args: ['-version'] },
    });
  });
});
