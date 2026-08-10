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
} = require('../../src/cli/gitignore-policy');

const REPO_ROOT = path.join(__dirname, '..', '..');

describe('spec-first gitignore policy', () => {
  test('ignores only definite local, scratch, and provider artifacts in target repos', () => {
    const patterns = getSpecFirstGitignorePatterns();

    expect(patterns).toEqual([
      '.claude/tasks/',
      '.claude/worktrees/',
      '.qoder/settings.local.json',
      '.spec-first/*.local.yaml',
      '.spec-first/config.local.yaml',
      '.spec-first/config/*.json',
      '.spec-first/audits/',
      '.spec-first/governance/',
      '.spec-first/app-audit/',
      '.spec-first/workflows/',
      '.spec-first/workspace/',
      '.spec-first/sessions/',
      '.codegraph/',
      'graphify-out/',
      '.graphify/',
    ]);
  });

  test('keeps generated runtime and team-configurable host files visible', () => {
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
      writeFile(repoRoot, '.cursor/mcp.json');
      writeFile(repoRoot, '.kiro/settings/mcp.json');
      writeFile(repoRoot, '.qoder/settings.local.json');
      writeFile(repoRoot, '.spec-first/config.local.yaml');
      writeFile(repoRoot, '.claude/tasks/task.json');
      writeFile(repoRoot, 'opencode.json');

      expect(isIgnored(repoRoot, '.agents/skills/spec-plan/SKILL.md')).toBe(false);
      expect(isIgnored(repoRoot, '.agents/skills/source-command-spec-plan/SKILL.md')).toBe(false);
      expect(isIgnored(repoRoot, '.agents/skills/my-team-skill/SKILL.md')).toBe(false);
      expect(isIgnored(repoRoot, '.codex/spec-first/state.json')).toBe(false);
      expect(isIgnored(repoRoot, '.codex/config.toml')).toBe(false);
      expect(isIgnored(repoRoot, '.opencode/skills/spec-plan/SKILL.md')).toBe(false);
      expect(isIgnored(repoRoot, '.opencode/spec-first/state.json')).toBe(false);
      expect(isIgnored(repoRoot, '.cursor/mcp.json')).toBe(false);
      expect(isIgnored(repoRoot, '.kiro/settings/mcp.json')).toBe(false);
      expect(isIgnored(repoRoot, '.qoder/settings.local.json')).toBe(true);
      expect(isIgnored(repoRoot, '.spec-first/config.local.yaml')).toBe(true);
      expect(isIgnored(repoRoot, '.claude/tasks/task.json')).toBe(true);
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

  test('keeps source-checkout runtime mirrors outside the target managed block', () => {
    const rootGitignore = normalizeLineEndings(
      fs.readFileSync(path.join(REPO_ROOT, '.gitignore'), 'utf8'),
    );
    const block = buildSpecFirstGitignoreBlock();

    expect(rootGitignore).toContain('/.agents/skills/spec-*/');
    expect(rootGitignore).toContain('/.claude/spec-first/');
    expect(rootGitignore).toContain('/.codex/spec-first/');
    expect(rootGitignore).toContain('/.cursor/spec-first/');
    expect(rootGitignore).toContain('/.kiro/spec-first/');
    expect(rootGitignore).toContain('/.qoder/spec-first/');
    expect(rootGitignore).toContain('/.opencode/spec-first/');
    expect(block).not.toContain('.agents/skills/spec-*/');
    expect(block).not.toContain('.codex/spec-first/');
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
