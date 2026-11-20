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
  test('按结果、实际配置变更、下一步排序，不把语言同步失败显示为整体完成', () => {
    const output = captureOutput(() => printInitApplySummaries([
      { platform: 'codex', projectRoot: '/tmp/example' },
    ], [{ exit_code: 0 }], {
      lang: 'zh', userLanguageSyncResult: { exit_code: 1, status: 'action-required', reason_code: 'sync-failed' },
    })).join('\n');
    expect(output).toMatch(/初始化需处理[^\n]*1\/1[\s\S]*配置与文件[\s\S]*sync-failed[\s\S]*下一步[\s\S]*目标目录/);
  });

  test('失败计划不宣称创建文件，也不输出空的配置分区', () => {
    const output = captureOutput(() => printInitApplySummaries([
      { platform: 'codex', projectRoot: '/tmp/example', changelogCreated: true },
    ], [{ exit_code: 1 }], { lang: 'zh' })).join('\n');
    expect(output).toContain('初始化需处理');
    expect(output).not.toMatch(/已创建 CHANGELOG|配置与文件/);
  });
  test.each(['zh', 'en'])('binds activation, task input, conditional setup and recovery to scope (%s)', (lang) => {
    const target = path.resolve('/tmp/project with spaces');
    const lines = captureOutput(() => printInitNextSteps('codex', lang, { target }));
    const output = lines.join('\n');
    expect(output).toContain(target);
    expect(output).toContain('Codex');
    expect(output).toContain(lang === 'en' ? 'restart Codex or open a new session' : '重启 Codex 或新开会话');
    expect(output).toContain('spec-brainstorm');
    expect(output).toContain('spec-first doctor --codex');
    expect(output).toMatch(/未验证|not verified/);
    expect(output).toMatch(/仅当|Only when/);
    expect(output).toContain(lang === 'en'
      ? 'a greeting or recommendation is not success'
      : '欢迎语或推荐入口不算成功');
    expect(output).not.toMatch(/Required:.*spec-runtime-setup|必做：.*spec-runtime-setup/);
    expect(lines.length).toBeLessThanOrEqual(9);
  });

  test('consolidates multi-host single-root guidance to one target line and one primary action', () => {
    const output = captureOutput(() => printInitNextStepsForPlatforms(['claude', 'codex', 'codex'], 'en')).join('\n');
    expect(output.match(/Target:/g)).toHaveLength(1);
    expect(output.match(/Next:/g)).toHaveLength(1);
    expect(output).toContain('Claude Code');
    expect(output).toContain('Codex');
    expect(output).toContain('spec-first doctor --claude --codex');
    expect(output).toMatch(/not verified/);
  });

  test('multi-host zh output groups preview and trust differences once', () => {
    const lines = captureOutput(() => printInitNextStepsForPlatforms(getSupportedPlatforms(), 'zh', { explainTask: false }));
    const output = lines.join('\n');
    expect(output.match(/目标目录：/g)).toHaveLength(1);
    expect(output.match(/主行动：/g)).toHaveLength(1);
    expect(output.match(/spec-first doctor/g)).toHaveLength(1);
    expect(output).toContain('宿主差异：');
    expect(output).toContain('打开 Pi 并完成项目信任；未信任时不会加载项目 skill');
    expect(output).toContain('Cursor / OpenCode / ZCode');
    expect(lines.length).toBeLessThanOrEqual(10);
  });

  test('multi-host guidance omits the difference section for uniform hosts', () => {
    const output = captureOutput(() => printInitNextStepsForPlatforms(['claude', 'codex'], 'zh')).join('\n');
    expect(output).not.toContain('宿主差异：');
    expect(output).not.toContain('preview');
  });

  test('result summary suppresses preserve-profile line but keeps applied profiles', () => {
    const plans = [{ platform: 'codex', projectRoot: '/tmp/preserve-check' }];
    const results = [{ exit_code: 0 }];
    const preserved = captureOutput(() => printInitApplySummaries(plans, results, {
      lang: 'en',
      globalDeveloperWriteResult: {
        action: 'preserve',
        status: 'unchanged',
        resolvedPath: '/home/tester/.spec-first/.developer',
        developer: { name: 'Ada', lang: 'en' },
      },
    })).join('\n');
    expect(preserved).not.toContain('Global developer profile:');
    const overwritten = captureOutput(() => printInitApplySummaries(plans, results, {
      lang: 'en',
      globalDeveloperWriteResult: {
        action: 'overwrite',
        status: 'applied',
        resolvedPath: '/home/tester/.spec-first/.developer',
        developer: { name: 'Ada', lang: 'en' },
      },
    })).join('\n');
    expect(overwritten.match(/Global developer profile:/g)).toHaveLength(1);
  });

  test('binds the primary action to a target containing unicode characters', () => {
    const target = path.resolve('/tmp/项目 目录-α');
    const output = captureOutput(() => printInitNextSteps('codex', 'zh', { target })).join('\n');
    expect(output).toContain(`目标目录：${target}`);
    expect(output).toMatch(/若宿主未加载配置[^\n]*\n\s+spec-first doctor --codex$/m);
  });

  test('keeps guidance independent of historical directories', () => {
    const target = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-guidance-'));
    try {
      const before = captureOutput(() => printInitNextSteps('cursor', 'en', { target }));
      fs.mkdirSync(path.join(target, '.spec-first', 'workflows'), { recursive: true });
      expect(captureOutput(() => printInitNextSteps('cursor', 'en', { target }))).toEqual(before);
    } finally { fs.rmSync(target, { recursive: true, force: true }); }
  });

  test.each(['en', 'zh'])('covers all supported hosts including preview and trust limits (%s)', (lang) => {
    for (const platform of getSupportedPlatforms()) {
      const output = captureOutput(() => printInitNextSteps(platform, lang)).join('\n');
      expect(output).toContain(`spec-first doctor --${platform}`);
      if (['cursor', 'opencode', 'zcode', 'pi'].includes(platform)) expect(output).toContain('preview');
      if (platform === 'pi') {
        expect(output).toContain(lang === 'en'
          ? 'open Pi and complete project trust; without trust, project skills are not loaded'
          : '打开 Pi 并完成项目信任；未信任时不会加载项目 skill');
      }
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
