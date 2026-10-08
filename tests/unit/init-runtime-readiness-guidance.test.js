'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { getSupportedPlatforms } = require('../../src/cli/adapters');
const { printInitNextSteps, printInitNextStepsForPlatforms, printInitApplySummaries } = require('../../src/cli/commands/init-output');

function captureOutput(render) {
  const lines = [];
  const spy = jest.spyOn(console, 'log').mockImplementation((line) => lines.push(String(line)));
  try { render(); } finally { spy.mockRestore(); }
  return lines;
}

describe('init runtime readiness guidance', () => {
  test.each(['zh', 'en'])('binds activation, task input, conditional setup and recovery to scope (%s)', (lang) => {
    const target = path.resolve('/tmp/project with spaces');
    const lines = captureOutput(() => printInitNextSteps('codex', lang, { target }));
    const output = lines.join('\n');
    expect(output).toContain(target);
    expect(output).toContain('Codex');
    expect(output).toContain('spec-brainstorm');
    expect(output).toContain('spec-first doctor --codex');
    expect(output).toMatch(/未验证|not verified/);
    expect(output).toMatch(/仅当|Only when/);
    expect(output).not.toMatch(/Required:.*spec-runtime-setup|必做：.*spec-runtime-setup/);
    expect(lines.length).toBeLessThanOrEqual(9);
  });

  test('gives each host its own primary action without duplicates', () => {
    const output = captureOutput(() => printInitNextStepsForPlatforms(['claude', 'codex', 'codex'], 'en')).join('\n');
    expect(output.match(/Next:/g)).toHaveLength(2);
    expect(output).toContain('Claude Code');
    expect(output).toContain('Codex');
  });

  test('keeps guidance independent of historical directories', () => {
    const target = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-guidance-'));
    try {
      const before = captureOutput(() => printInitNextSteps('cursor', 'en', { target }));
      fs.mkdirSync(path.join(target, '.spec-first', 'workflows'), { recursive: true });
      expect(captureOutput(() => printInitNextSteps('cursor', 'en', { target }))).toEqual(before);
    } finally { fs.rmSync(target, { recursive: true, force: true }); }
  });

  test('covers all supported hosts including preview and trust limits', () => {
    for (const platform of getSupportedPlatforms()) {
      const output = captureOutput(() => printInitNextSteps(platform, 'en')).join('\n');
      expect(output).toContain(`spec-first doctor --${platform}`);
      if (['cursor', 'opencode', 'zcode', 'pi'].includes(platform)) expect(output).toContain('preview');
      if (platform === 'pi') expect(output).toContain('trust');
    }
  });

  test('preserves successful hosts and limits failed-host repair', () => {
    const target = path.resolve('/tmp/partial');
    const output = captureOutput(() => printInitApplySummaries([
      { platform: 'codex', projectRoot: target },
      { platform: 'claude', projectRoot: target },
    ], [{ exit_code: 0 }, { exit_code: 1 }], { lang: 'en' })).join('\n');
    expect(output).toContain('Next:');
    expect(output).toContain('Codex');
    expect(output).toContain('spec-first init --claude');
    expect(output).not.toContain('spec-first init --codex');
    expect(output).toContain(target);
  });

  test('keeps first-task guidance when only a child scope succeeded', () => {
    const workspaceRoot = path.resolve('/tmp/workspace');
    const childRoot = path.join(workspaceRoot, 'child');
    const output = captureOutput(() => printInitApplySummaries([
      { platform: 'codex', mode: 'all-repos', workspaceRoot },
    ], [{
      exit_code: 1,
      workspace_summary: {
        parent_host_runtime: { overall_status: 'action-required' },
        results: [{ git_root: childRoot, exit_code: 0, overall_status: 'ready' }],
      },
    }], { lang: 'en' })).join('\n');
    expect(output).toContain(`Target: ${workspaceRoot}`);
    expect(output).toContain(`Target: ${childRoot}`);
    expect(output.match(/Next:/g)).toHaveLength(1);
    expect(output.match(/spec-brainstorm/g)).toHaveLength(1);
    expect(output).toContain('Repair: in this target, preview spec-first init --codex');
  });
});
