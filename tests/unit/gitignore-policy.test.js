'use strict';

const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  SPEC_FIRST_GITIGNORE_END,
  SPEC_FIRST_GITIGNORE_START,
  applySpecFirstGitignoreBlock,
  buildSpecFirstGitignoreBlock,
  getSpecFirstGitignorePatterns,
  getSpecFirstRuntimeUntrackPatterns,
} = require('../../src/cli/gitignore-policy');
const { loadPluginManifest } = require('../../src/cli/plugin-manifest');

const REPO_ROOT = path.join(__dirname, '..', '..');

describe('spec-first gitignore policy', () => {
  test('ignores only spec-first-managed names inside shareable host roots', () => {
    const patterns = getSpecFirstGitignorePatterns();

    expect(patterns).toEqual(expect.arrayContaining([
      '.claude/skills/spec-*/',
      '.agents/skills/source-command-spec-*/',
      '.agents/skills/using-spec-first/',
      '.cursor/rules/spec-first.mdc',
      '.kiro/steering/spec-first.md',
      '.qoder/rules/spec-first.md',
      '.opencode/commands/spec/',
      '.opencode/commands/spec-*.md',
      '.opencode/skills/spec-*/',
      '.opencode/spec-first/',
    ]));
    expect(patterns).not.toEqual(expect.arrayContaining([
      '.claude/skills/',
      '.claude/agents/',
      '.codex/',
      '.agents/skills/',
      '.cursor/skills/',
      '.kiro/skills/',
      '.qoder/skills/',
      '.opencode/skills/',
    ]));
  });

  test('keeps team-owned host assets visible while ignoring generated runtime', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-gitignore-'));

    try {
      execFileSync('git', ['init', '-q'], { cwd: repoRoot });
      fs.writeFileSync(path.join(repoRoot, '.gitignore'), `${buildSpecFirstGitignoreBlock()}\n`, 'utf8');
      writeFile(repoRoot, '.agents/skills/spec-plan/SKILL.md');
      writeFile(repoRoot, '.agents/skills/source-command-spec-plan/SKILL.md');
      writeFile(repoRoot, '.agents/skills/my-team-skill/SKILL.md');
      writeFile(repoRoot, '.codex/spec-first/state.json');
      writeFile(repoRoot, '.codex/config.toml');
      writeFile(repoRoot, '.opencode/skills/spec-plan/SKILL.md');
      writeFile(repoRoot, '.opencode/spec-first/state.json');
      writeFile(repoRoot, 'opencode.json');

      expect(isIgnored(repoRoot, '.agents/skills/spec-plan/SKILL.md')).toBe(true);
      expect(isIgnored(repoRoot, '.agents/skills/source-command-spec-plan/SKILL.md')).toBe(true);
      expect(isIgnored(repoRoot, '.agents/skills/my-team-skill/SKILL.md')).toBe(false);
      expect(isIgnored(repoRoot, '.codex/spec-first/state.json')).toBe(true);
      expect(isIgnored(repoRoot, '.codex/config.toml')).toBe(false);
      expect(isIgnored(repoRoot, '.opencode/skills/spec-plan/SKILL.md')).toBe(true);
      expect(isIgnored(repoRoot, '.opencode/spec-first/state.json')).toBe(true);
      expect(isIgnored(repoRoot, 'opencode.json')).toBe(false);
    } finally {
      fs.rmSync(repoRoot, { recursive: true, force: true });
    }
  });

  test('refuses unmatched or duplicate markers instead of guessing a replacement range', () => {
    expect(() => applySpecFirstGitignoreBlock([
      'dist/',
      SPEC_FIRST_GITIGNORE_START,
      'keep-this-user-rule/',
    ].join('\n'))).toThrow('Invalid spec-first .gitignore managed block');

    expect(() => applySpecFirstGitignoreBlock([
      SPEC_FIRST_GITIGNORE_START,
      SPEC_FIRST_GITIGNORE_START,
      SPEC_FIRST_GITIGNORE_END,
    ].join('\n'))).toThrow('Invalid spec-first .gitignore managed block');

    expect(() => applySpecFirstGitignoreBlock(
      `${SPEC_FIRST_GITIGNORE_START} trailing-text\n`,
    )).toThrow('Invalid spec-first .gitignore managed block');
  });

  test('updates one valid managed block while preserving surrounding user rules', () => {
    const result = applySpecFirstGitignoreBlock([
      'node_modules/',
      SPEC_FIRST_GITIGNORE_START,
      '.old-runtime/',
      SPEC_FIRST_GITIGNORE_END,
      'dist/',
      '',
    ].join('\n'));

    expect(result.status).toBe('updated');
    expect(result.content).toContain('node_modules/\n');
    expect(result.content).toContain(`${SPEC_FIRST_GITIGNORE_END}\ndist/\n`);
    expect(result.content).not.toContain('.old-runtime/');
  });

  test('does not auto-untrack team-policy files even when they are ignored by default', () => {
    const untrackPatterns = getSpecFirstRuntimeUntrackPatterns();

    expect(untrackPatterns).not.toEqual(expect.arrayContaining([
      '.codex/hooks.json',
      '.cursor/mcp.json',
      '.kiro/settings/',
      '.qoder/hooks/session-start',
      '.qoder/hooks/prd-prewrite-guard',
      '.qoder/hooks/prd-readiness-guard',
      '.qoder/settings.local.json',
      'graphify-out/',
      '.graphify/',
    ]));
    expect(untrackPatterns).toEqual(expect.arrayContaining([
      '.agents/skills/spec-*/**',
      '.agents/skills/source-command-spec-*/**',
      '.codex/spec-first/',
      '.opencode/skills/spec-*/**',
      '.opencode/spec-first/',
      '.spec-first/workflows/',
    ]));
  });

  test('keeps the repo block and user manual synchronized with the generated policy', () => {
    const block = buildSpecFirstGitignoreBlock();
    const rootGitignore = normalizeLineEndings(
      fs.readFileSync(path.join(REPO_ROOT, '.gitignore'), 'utf8'),
    );
    const manual = normalizeLineEndings(
      fs.readFileSync(
        path.join(REPO_ROOT, 'docs', '05-用户手册', '12-gitignore参考.md'),
        'utf8',
      ),
    );

    expect(rootGitignore).toContain(`${block}\n`);
    expect(manual).toContain(`\`\`\`gitignore\n${block}\n\`\`\``);
  });

  test('keeps source-checkout Claude settings local without hiding target-repo team policy', () => {
    const rootGitignore = normalizeLineEndings(
      fs.readFileSync(path.join(REPO_ROOT, '.gitignore'), 'utf8'),
    );
    expect(rootGitignore).toContain('/.claude/settings.json');
    expect(getSpecFirstGitignorePatterns()).not.toContain('.claude/settings.json');
  });

  test('keeps bundled runtime names inside the reserved ignore namespace', () => {
    const manifest = loadPluginManifest();

    expect(manifest.skills.filter((name) => (
      name !== 'using-spec-first' && !name.startsWith('spec-')
    ))).toEqual([]);
    expect(manifest.agents.filter((agentPath) => (
      !agentPath.split('/').pop().startsWith('spec-')
    ))).toEqual([]);
  });
});

function writeFile(repoRoot, relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, 'test\n', 'utf8');
}

function normalizeLineEndings(content) {
  return content.replace(/\r\n?/g, '\n');
}

function isIgnored(repoRoot, relativePath) {
  return spawnSync('git', ['check-ignore', '-q', '--', relativePath], { cwd: repoRoot }).status === 0;
}
