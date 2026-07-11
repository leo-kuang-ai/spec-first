'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { buildManagedBlock } = require('../../src/cli/lang-policy');

const repoRoot = path.join(__dirname, '..', '..');

function tempProject(host) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `spec-first-${host}-session-start-`));
}

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
}

describe('SessionStart using-spec-first entry pointer', () => {
  test.each([
    {
      host: 'claude',
      instructionFile: 'CLAUDE.md',
      runtimeSkill: '.claude/skills/using-spec-first/SKILL.md',
      envName: 'CLAUDE_PROJECT_DIR',
      input: undefined,
    },
    {
      host: 'codex',
      instructionFile: 'AGENTS.md',
      runtimeSkill: '.agents/skills/using-spec-first/SKILL.md',
      envName: 'CODEX_PROJECT_DIR',
      input: '{}',
    },
    {
      host: 'qoder',
      instructionFile: 'AGENTS.md',
      runtimeSkill: '.qoder/skills/using-spec-first/SKILL.md',
      envName: 'QODER_PROJECT_DIR',
      input: '{}',
    },
  ])('$host recognizes the new managed block and emits its runtime path', ({
    host,
    instructionFile,
    runtimeSkill,
    envName,
    input,
  }) => {
    const projectRoot = tempProject(host);
    const hookPath = path.join(repoRoot, 'templates', host, 'hooks', 'session-start');
    writeText(path.join(projectRoot, instructionFile), buildManagedBlock('en'));
    writeText(path.join(projectRoot, runtimeSkill), '---\nname: using-spec-first\n---\n');

    const result = spawnSync(process.execPath, [hookPath], {
      cwd: projectRoot,
      input,
      encoding: 'utf8',
      env: { ...process.env, [envName]: projectRoot },
    });

    expect(result.status).toBe(0);
    const output = JSON.parse(result.stdout);
    expect(output.hookSpecificOutput.additionalContext).toContain(
      `Full routing policy: ${runtimeSkill}.`,
    );
    expect(output.hookSpecificOutput.additionalContext).not.toContain(
      'Full routing policy: skills/using-spec-first/SKILL.md.',
    );
  });
});
