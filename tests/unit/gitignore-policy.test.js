'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  SPEC_FIRST_GITIGNORE_END,
  SPEC_FIRST_GITIGNORE_START,
  applySpecFirstGitignoreBlock,
  buildSpecFirstGitignoreBlock,
  getSpecFirstGitignorePatternMetadata,
  getSpecFirstGitignorePatterns,
} = require('../../src/cli/gitignore-policy');

const REPO_ROOT = path.join(__dirname, '..', '..');
const USER_MANUAL_GITIGNORE_PATH = path.join(REPO_ROOT, 'docs', '05-用户手册', '12-gitignore参考.md');
const ROOT_GITIGNORE_PATH = path.join(REPO_ROOT, '.gitignore');

describe('spec-first gitignore policy', () => {
  test('renders one managed block with narrow default patterns', () => {
    const block = buildSpecFirstGitignoreBlock();
    const patterns = getSpecFirstGitignorePatterns();

    expect(block).toContain(SPEC_FIRST_GITIGNORE_START);
    expect(block).toContain(SPEC_FIRST_GITIGNORE_END);
    expect(patterns).toContain('.claude/commands/spec/');
    expect(patterns).toContain('.claude/commands/spec-*.md');
    expect(patterns).toContain('.claude/hooks/session-start');
    expect(patterns).toContain('.claude/hooks/spec-plan-guard');
    expect(patterns).toContain('.claude/hooks/prd-prewrite-guard');
    expect(patterns).toContain('.claude/hooks/prd-readiness-guard');
    expect(patterns).toContain('.codex/');
    expect(patterns).toContain('.agents/skills/');
    expect(patterns).toContain('.cursor/skills/');
    expect(patterns).toContain('.cursor/spec-first/');
    expect(patterns).toContain('.cursor/mcp.json');
    expect(patterns).toContain('.kiro/skills/');
    expect(patterns).toContain('.kiro/agents/');
    expect(patterns).toContain('.kiro/spec-first/');
    expect(patterns).toContain('.kiro/settings/');
    expect(patterns).toContain('.qoder/commands/spec/');
    expect(patterns).toContain('.qoder/commands/spec-*.md');
    expect(patterns).toContain('.qoder/skills/');
    expect(patterns).toContain('.qoder/agents/');
    expect(patterns).toContain('.qoder/spec-first/');
    expect(patterns).toContain('.qoder/settings.local.json');
    expect(getSpecFirstGitignorePatternMetadata()).toEqual({});
    expect(patterns).toContain('.spec-first/config/*.json');
    expect(patterns).toContain('.spec-first/governance/');
    expect(patterns).toContain('.codegraph/');
    expect(patterns).toContain('.graphify/');
    expect(patterns).toContain('graphify-out/');
    expect(patterns).not.toContain('graphify-out/cost.json');
    expect(patterns).not.toContain('graphify-out/.graphify_python');
    expect(patterns).not.toContain('.spec-first/standards/');
    expect(patterns).toContain('.spec-first/sessions/');
    expect(patterns).not.toContain('.claude/');
    expect(patterns).not.toContain('.codex/commands/spec/');
    expect(patterns).not.toContain('.codex/spec-first/');
    expect(patterns).not.toContain('.codex/agents/');
    expect(patterns).not.toContain('.agents/');
    expect(patterns).not.toContain('.cursor/');
    expect(patterns).not.toContain('.cursor/rules/');
    expect(patterns).not.toContain('.cursor/agents/');
    expect(patterns).not.toContain('.kiro/');
    expect(patterns).not.toContain('.kiro/specs/');
    expect(patterns).not.toContain('.qoder/');
    expect(patterns).not.toContain('.qoder/rules/');
    expect(patterns).not.toContain('.qoder/settings.json');
    expect(patterns).not.toContain('.qoder/hooks/');
    expect(patterns).not.toContain('.spec-first/');
    expect(patterns).not.toContain('*.tgz');
    expect(block).toContain([
      '# spec-first local setup and workflow runtime artifacts',
      '.spec-first/*.local.yaml',
      '.spec-first/config.local.yaml',
      '.spec-first/config/*.json',
      '.spec-first/audits/',
      '.spec-first/governance/',
      '.spec-first/app-audit/',
    ].join('\n'));
  });

  test('adds a managed block to empty content', () => {
    const result = applySpecFirstGitignoreBlock('');

    expect(result.status).toBe('added');
    expect(result.content).toBe(`${buildSpecFirstGitignoreBlock()}\n`);
    expect(countStartMarkers(result.content)).toBe(1);
  });

  test('preserves existing user content before and after the managed block', () => {
    const existing = [
      'node_modules/',
      '',
      SPEC_FIRST_GITIGNORE_START,
      '# old policy',
      '.old-spec-first/',
      SPEC_FIRST_GITIGNORE_END,
      '',
      'dist/',
      '',
    ].join('\n');

    const result = applySpecFirstGitignoreBlock(existing);

    expect(result.status).toBe('updated');
    expect(result.content.startsWith('node_modules/\n\n')).toBe(true);
    expect(result.content).toContain(`${SPEC_FIRST_GITIGNORE_END}\n\ndist/\n`);
    expect(result.content).not.toContain('.old-spec-first/');
    expect(countStartMarkers(result.content)).toBe(1);
  });

  test('adds a separating newline when existing content has no trailing newline', () => {
    const result = applySpecFirstGitignoreBlock('dist/');

    expect(result.status).toBe('added');
    expect(result.content.startsWith('dist/\n\n# spec-first:start')).toBe(true);
    expect(result.content.endsWith('\n')).toBe(true);
  });

  test('leaves an already-current block unchanged', () => {
    const existing = `# user rule\n\n${buildSpecFirstGitignoreBlock()}\n`;
    const result = applySpecFirstGitignoreBlock(existing);

    expect(result.status).toBe('already-current');
    expect(result.content).toBe(existing);
    expect(countStartMarkers(result.content)).toBe(1);
  });

  test('does not suppress duplicate standalone rules outside the managed block', () => {
    const result = applySpecFirstGitignoreBlock('.spec-first/*.local.yaml\n');

    expect(result.status).toBe('added');
    expect(result.content.match(/^\.spec-first\/\*\.local\.yaml$/gm)).toHaveLength(2);
    expect(countStartMarkers(result.content)).toBe(1);
  });

  test('rejects non-string content', () => {
    expect(() => applySpecFirstGitignoreBlock(null)).toThrow('existingContent must be a string');
  });

  test('user manual mirrors the generated managed block and does not revive retired provider paths', () => {
    const manual = fs.readFileSync(USER_MANUAL_GITIGNORE_PATH, 'utf8');
    const block = buildSpecFirstGitignoreBlock();

    expect(manual).toContain(`\`\`\`gitignore\n${block}\n\`\`\``);
    expect(manual).toContain('Graphify provider-native 项目图谱运行时目录，默认不提交');
    expect(manual).toContain('`graphify-out/` 是旧版 Graphify artifact 目录，默认继续忽略');
    expect(manual).toContain('默认整体忽略，不提交');
    expect(block).not.toContain('.direct-source-evidence/');
    expect(block).not.toContain('.code-review-graph/');
    expect(block).not.toContain('.spec-first-graph/');
    expect(manual).toContain('不属于当前 `init` managed block');
  });

  test('repo-local ignore covers CI and host-local config without exporting them to user managed block', () => {
    const rootGitignore = fs.readFileSync(ROOT_GITIGNORE_PATH, 'utf8');
    const block = buildSpecFirstGitignoreBlock();

    expect(rootGitignore).toContain('.spec-first/ci/');
    expect(rootGitignore).toContain('.claude/settings.local.json');
    expect(rootGitignore).not.toContain('\n.agents/\n');
    expect(block).not.toContain('.spec-first/ci/');
    expect(block).not.toContain('.claude/settings.local.json');
  });
});

function countStartMarkers(content) {
  return (content.match(new RegExp(SPEC_FIRST_GITIGNORE_START, 'g')) || []).length;
}
