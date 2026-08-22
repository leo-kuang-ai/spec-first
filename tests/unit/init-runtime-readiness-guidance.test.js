'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  printInitNextSteps,
  printInitNextStepsForPlatforms,
} = require('../../src/cli/commands/init-output');

function captureOutput(render) {
  const lines = [];
  const logSpy = jest.spyOn(console, 'log').mockImplementation((line) => {
    lines.push(String(line));
  });
  try {
    render();
  } finally {
    logSpy.mockRestore();
  }
  return lines;
}

describe('init runtime readiness guidance', () => {
  test.each([
    ['zh', [
      '初始化完成。下一步:',
      '  状态：已写入 Codex runtime projection；宿主加载与 runtime readiness 尚未验证。',
      '  必做：重启 Codex 或新开会话，然后运行 `spec-runtime-setup`。',
      '  可选：如需排查或审计 projection health，运行 `spec-first doctor --codex`。',
    ]],
    ['en', [
      'Initialization complete. Next steps:',
      '  Status: The Codex runtime projection was written; host loading and runtime readiness are not verified yet.',
      '  Required: Restart Codex or open a new session, then run `spec-runtime-setup`.',
      '  Optional: To troubleshoot or audit projection health, run `spec-first doctor --codex`.',
    ]],
  ])('renders one selected host with the same %s action hierarchy', (lang, expected) => {
    expect(captureOutput(() => printInitNextSteps('codex', lang))).toEqual(expected);
  });

  test.each([
    ['zh', [
      '初始化完成。下一步:',
      '  状态：已写入 Claude Code、Codex runtime projections；各宿主加载与 runtime readiness 尚未验证。',
      '  必做：重启 Claude Code、Codex 或分别新开会话，然后在每个计划使用的宿主中运行 `spec-runtime-setup`。',
      '  可选：如需排查或审计 projection health，分别运行 `spec-first doctor --claude`、`spec-first doctor --codex`。',
    ]],
    ['en', [
      'Initialization complete. Next steps:',
      '  Status: The Claude Code and Codex runtime projections were written; host loading and runtime readiness are not verified yet.',
      '  Required: Restart Claude Code and Codex or open new sessions, then run `spec-runtime-setup` in each host you plan to use.',
      '  Optional: To troubleshoot or audit projection health, run `spec-first doctor --claude` and `spec-first doctor --codex`.',
    ]],
  ])('renders multiple selected hosts with per-host %s readiness ownership', (lang, expected) => {
    expect(captureOutput(() => printInitNextStepsForPlatforms(['claude', 'codex'], lang)))
      .toEqual(expected);
  });

  test('keeps guidance independent of workflow history and within the compact output contract', () => {
    const originalCwd = process.cwd();
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-init-guidance-'));
    try {
      process.chdir(projectRoot);
      const withoutHistory = captureOutput(() => printInitNextSteps('cursor', 'en'));
      fs.mkdirSync(path.join(projectRoot, '.spec-first', 'workflows'), { recursive: true });
      const withHistory = captureOutput(() => printInitNextSteps('cursor', 'en'));

      expect(withHistory).toEqual(withoutHistory);
      expect(withHistory.filter((line) => line.trim())).toHaveLength(4);
      expect(withHistory.join('\n')).not.toMatch(/prd|plan|work|brainstorm|review|debug/i);
      expect(withHistory.join('\n')).not.toContain('--verify-only');
      expect(withHistory.join('\n')).not.toContain('<describe your requirement or problem>');
    } finally {
      process.chdir(originalCwd);
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('covers every supported host with a host-specific optional doctor command', () => {
    for (const platform of ['claude', 'codex', 'cursor', 'kiro', 'qoder', 'opencode']) {
      const output = captureOutput(() => printInitNextSteps(platform, 'en'));
      expect(output).toHaveLength(4);
      expect(output[3]).toContain(`spec-first doctor --${platform}`);
    }
  });
});
