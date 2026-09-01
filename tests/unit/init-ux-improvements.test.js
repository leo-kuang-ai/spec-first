'use strict';

// init UX 三项改进的单元测试：
// P1-A 宿主勾选融合本机探测；P1-B 刷新差异摘要（plan 层统计 + 渲染）；
// P2-C 交互问题微文案。

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  getInitMessages,
} = require('../../src/cli/init-i18n');

function captureLogs(render) {
  const lines = [];
  const spy = jest.spyOn(console, 'log').mockImplementation((line) => lines.push(String(line)));
  try {
    render();
  } finally {
    spy.mockRestore();
  }
  return lines;
}

describe('P1-A host checkbox preselects detected hosts', () => {
  async function collectWithDetected(detectedMap) {
    // 确定性要求：doctor 探测与 developer profile 都必须 mock，且在任何
    // require 之前注册——否则测试读到执行机器的真实 profile（remembered
    // hosts），宿主预勾选断言随机器状态漂移。
    jest.resetModules();
    jest.doMock('../../src/cli/commands/doctor', () => ({
      checkPlatformCli: (platform) => ({ level: detectedMap[platform] || 'ERROR' }),
    }));
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-ux-p1a-'));
    jest.doMock('../../src/cli/developer', () => ({
      ...jest.requireActual('../../src/cli/developer'),
      getGlobalDeveloperPath: () => path.join(home, 'none-developer'),
    }));

    let checkboxChoices = null;
    const promptApi = {
      requireTty: () => ({ ok: true }),
      textInput: async () => 'tester',
      select: async () => 'zh',
      checkbox: async (_label, choices) => {
        checkboxChoices = choices;
        return choices.filter((choice) => choice.checked).map((choice) => choice.value);
      },
      confirm: async () => true,
    };
    let collected = null;
    const projectRoot = path.join(home, 'repo');
    fs.mkdirSync(projectRoot, { recursive: true });
    const originalCwd = process.cwd();
    try {
      process.chdir(projectRoot);
      const { collectInitInput } = require('../../src/cli/commands/init-input');
      collected = await collectInitInput({
        workspaceRoot: projectRoot,
        promptApi,
        parsed: { platforms: [], yes: false, name: '', lang: '', repo: '', allRepos: false },
        defaults: { name: 'tester', lang: 'zh' },
        defaultLang: 'zh',
        messages: getInitMessages('zh'),
      });
    } finally {
      // 恢复进入时的 cwd：恢复到 os.tmpdir() 会污染同轮运行中依赖
      // process.cwd() 读仓库文件的后续测试套件。
      process.chdir(originalCwd);
      jest.dontMock('../../src/cli/commands/doctor');
      jest.dontMock('../../src/cli/developer');
    }
    return { checkboxChoices, collected };
  }

  test('hosts detected on PATH are prechecked; undetected stay unchecked', async () => {
    const { checkboxChoices, collected } = await collectWithDetected({
      codex: 'PASS',
      claude: 'PASS',
      cursor: 'ERROR',
      kiro: 'ERROR',
      qoder: 'ERROR',
      opencode: 'ERROR',
    });
    const byId = new Map(checkboxChoices.map((choice) => [choice.value, choice.checked]));
    expect(byId.get('claude')).toBe(true);
    expect(byId.get('codex')).toBe(true);
    expect(byId.get('cursor')).toBe(false);
    expect(byId.get('kiro')).toBe(false);
    expect(byId.get('qoder')).toBe(false);
    expect(byId.get('opencode')).toBe(false);
    // 预勾选即默认选择：单测 promptApi 直接返回勾选项。
    expect(collected.platforms).toEqual(['claude', 'codex']);
  });

  test('probe failure falls back to unchecked without blocking interaction', async () => {
    const { checkboxChoices } = await collectWithDetected({
      codex: 'WARNING',
    });
    expect(checkboxChoices.every((choice) => choice.checked === false)).toBe(true);
  });
});

describe('P1-B change summary', () => {
  const { printInitPreviews } = require('../../src/cli/commands/init-output');

  function planWithChangeSummary(changeSummary) {
    return {
      mode: 'single-repo',
      platform: 'codex',
      projectRoot: '/workspace/app',
      operationPlan: { operations: [], summary: {} },
      changeSummary,
    };
  }

  test('summary preview renders the aggregated change line', () => {
    const lines = captureLogs(() => printInitPreviews(
      [planWithChangeSummary({ unchanged: 10, updated: 3, added: 2, removed: 1 })],
      { lang: 'zh', view: 'summary' },
    ));
    const changeLine = lines.find((line) => line.includes('内容变更'));
    expect(changeLine).toContain('不变 10');
    expect(changeLine).toContain('将更新 3');
    expect(changeLine).toContain('新增 2');
    expect(changeLine).toContain('移除 1');
  });

  test('plans without changeSummary keep the legacy output shape', () => {
    const lines = captureLogs(() => printInitPreviews(
      [planWithChangeSummary(null)],
      { lang: 'zh', view: 'summary' },
    ));
    expect(lines.some((line) => line.includes('内容变更'))).toBe(false);
  });

  test('multiple targets aggregate their counts', () => {
    const lines = captureLogs(() => printInitPreviews([
      planWithChangeSummary({ unchanged: 5, updated: 1, added: 0, removed: 0 }),
      planWithChangeSummary({ unchanged: 2, updated: 0, added: 4, removed: 2 }),
    ], { lang: 'zh', view: 'summary' }));
    const changeLine = lines.find((line) => line.includes('内容变更'));
    expect(changeLine).toContain('不变 7');
    expect(changeLine).toContain('将更新 1');
    expect(changeLine).toContain('新增 4');
    expect(changeLine).toContain('移除 2');
  });

  test('buffer-encoded operations compare by content, not string coercion', () => {
    const { summarizeWritePlanChanges } = require('../../src/cli/commands/init-project-plan');
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-ux-p1b-'));
    try {
      fs.writeFileSync(path.join(root, 'bin-asset'), Buffer.from([1, 2, 3, 0, 255]));
      const plan = {
        writePlan: {
          operations: [
            { kind: 'write_file', path: 'bin-asset', contents: Buffer.from([1, 2, 3, 0, 255]), encoding: 'buffer' },
            { kind: 'write_file', path: 'bin-asset-changed', contents: Buffer.from([9]), encoding: 'buffer' },
            { kind: 'write_file', path: 'text-same.md', contents: 'hello\n' },
            { kind: 'write_file', path: 'text-new.md', contents: 'new\n' },
          ],
        },
        preSyncPlan: {
          operations: [
            { kind: 'remove_file', path: 'obsolete.txt' },
            { kind: 'ensure_dir', path: 'dir' },
          ],
        },
      };
      fs.writeFileSync(path.join(root, 'bin-asset-changed'), Buffer.from([1, 2, 3]));
      fs.writeFileSync(path.join(root, 'text-same.md'), 'hello\n');
      const summary = summarizeWritePlanChanges(root, plan);
      expect(summary).toEqual({ unchanged: 2, updated: 1, added: 1, removed: 1 });
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('P2-C prompt microcopy explains its purpose', () => {
  test('name and language prompts state what they are used for', () => {
    expect(getInitMessages('zh').developerName).toContain('CHANGELOG');
    expect(getInitMessages('zh').languageSelect).toContain('AI');
    expect(getInitMessages('en').developerName).toContain('CHANGELOG');
    expect(getInitMessages('en').languageSelect).toContain('language');
  });
});
