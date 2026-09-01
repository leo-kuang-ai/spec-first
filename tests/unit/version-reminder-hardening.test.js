'use strict';

// 通知引擎优化（P1 结果分级冷却 / P1b 环境跳过 / P2 渠道感知 / P3 源统一）
// 的行为测试 + 对抗性测评：并发、状态伪造、注入、边界版本、网络异常。

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  detectInstallChannels,
  formatUpgradeGuidance,
  formatVersionReminder,
  maybeShowVersionReminder,
  parseVersion,
  shouldSkipCliVersionReminder,
} = require('../../src/cli/version-reminder');

const HOUR = 60 * 60 * 1000;

function makeStateHome() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-reminder-'));
}

function statePathOf(homeRoot) {
  return path.join(homeRoot, '.spec-first', 'version-reminder.json');
}

function ttyOutput() {
  const chunks = [];
  return {
    isTTY: true,
    write: (chunk) => chunks.push(String(chunk)),
    joined: () => chunks.join(''),
  };
}

async function runReminder(options) {
  const output = ttyOutput();
  const shown = await maybeShowVersionReminder({
    packageName: 'spec-first',
    currentVersion: '1.0.0',
    // jest 进程自带 NODE_ENV=test：非环境断言用例必须显式传干净 env。
    env: {},
    ...options,
    output,
  });
  return { shown, output: output.joined() };
}

describe('P1 outcome-graded cooldown', () => {
  test('failed lookup only blocks the short retry window, not 24h', async () => {
    const dir = makeStateHome();
    const t0 = Date.parse('2026-09-01T10:00:00Z');

    const failing = await runReminder({
      homeRoot: dir,
      nowMs: t0,
      lookupLatestVersion: async () => { throw new Error('network down'); },
    });
    expect(failing.shown).toBe(false);

    // 1 小时内：短重试窗口仍在，不重复查询。
    const quickRetry = await runReminder({
      homeRoot: dir,
      nowMs: t0 + 30 * 60 * 1000,
      lookupLatestVersion: async () => '2.0.0',
    });
    expect(quickRetry.shown).toBe(false);

    // 超过 1 小时：可以重试并正常提醒。
    const retry = await runReminder({
      homeRoot: dir,
      nowMs: t0 + HOUR + 1000,
      lookupLatestVersion: async () => '2.0.0',
    });
    expect(retry.shown).toBe(true);
    expect(retry.output).toContain('1.0.0 -> 2.0.0');
  });

  test('successful lookup (even without a newer version) consumes the full window', async () => {
    const dir = makeStateHome();
    const t0 = Date.parse('2026-09-01T10:00:00Z');

    const upToDate = await runReminder({
      homeRoot: dir,
      nowMs: t0,
      lookupLatestVersion: async () => '1.0.0',
    });
    expect(upToDate.shown).toBe(false);

    const withinDay = await runReminder({
      homeRoot: dir,
      nowMs: t0 + 23 * HOUR,
      lookupLatestVersion: async () => '2.0.0',
    });
    expect(withinDay.shown).toBe(false);

    const nextDay = await runReminder({
      homeRoot: dir,
      nowMs: t0 + 25 * HOUR,
      lookupLatestVersion: async () => '2.0.0',
    });
    expect(nextDay.shown).toBe(true);
  });

  test('legacy attempt state without outcome keeps the old 24h semantics', async () => {
    const dir = makeStateHome();
    const sp = statePathOf(dir);
    fs.mkdirSync(path.dirname(sp), { recursive: true });
    const t0 = Date.parse('2026-09-01T10:00:00Z');
    fs.writeFileSync(sp, JSON.stringify({
      attempts: {
        'cli.package': {
          scope: 'cli.package',
          attemptedAt: new Date(t0).toISOString(),
        },
      },
    }));

    const withinDay = await runReminder({
      homeRoot: path.dirname(path.dirname(sp)),
      nowMs: t0 + 2 * HOUR,
      lookupLatestVersion: async () => '2.0.0',
    });
    expect(withinDay.shown).toBe(false);
  });
});

describe('P1b environment skips', () => {
  const cases = [
    ['CI=true', { CI: 'true' }],
    ['NODE_ENV=test', { NODE_ENV: 'test' }],
    ['SUDO_UID set', { SUDO_UID: '501' }],
    ['opt-out env', { SPEC_FIRST_NO_UPDATE_NOTIFIER: '1' }],
  ];
  test.each(cases)('%s skips the reminder entirely', async (_label, env) => {
    const dir = makeStateHome();
    const lookup = jest.fn(async () => '2.0.0');
    const result = await runReminder({
      homeRoot: dir,
      env,
      lookupLatestVersion: lookup,
    });
    expect(result.shown).toBe(false);
    expect(lookup).not.toHaveBeenCalled();
  });

  test('skip predicate covers the same set synchronously', () => {
    expect(shouldSkipCliVersionReminder({ env: { NODE_ENV: 'test' } })).toBe(true);
    // SUDO_UID 按存在性判断：值为 '0'（root 提权）同样跳过。
    expect(shouldSkipCliVersionReminder({ env: { SUDO_UID: '0' }, output: ttyOutput() })).toBe(true);
    expect(shouldSkipCliVersionReminder({ env: {}, output: ttyOutput() })).toBe(false);
  });
});

describe('P2 install-channel aware guidance', () => {
  test('self path under .claude/plugins switches to claude plugin update', () => {
    const channels = detectInstallChannels({
      selfPath: '/home/u/.claude/plugins/spec-first/bin/spec-first.js',
    });
    expect(channels).toEqual({ npm: false, claudePlugin: true });
    const guidance = formatUpgradeGuidance(channels);
    expect(guidance).toContain('claude plugin update');
    expect(guidance).toContain('separate npm copy');
  });

  test('regular npm install path keeps spec-first update guidance', () => {
    const channels = detectInstallChannels({
      selfPath: '/usr/local/lib/node_modules/spec-first/bin/spec-first.js',
    });
    expect(channels).toEqual({ npm: true, claudePlugin: false });
    expect(formatUpgradeGuidance(channels)).toContain('spec-first update');
  });

  test('reminder output carries the channel guidance end to end', async () => {
    const result = await runReminder({
      homeRoot: makeStateHome(),
      selfPath: '/home/u/.claude/plugins/spec-first/bin/spec-first.js',
      lookupLatestVersion: async () => '2.0.0',
    });
    expect(result.shown).toBe(true);
    expect(result.output).toContain('claude plugin update');
  });
});

describe('adversarial: injection and malformed payloads', () => {
  test('ANSI/control-character versions never reach the output', async () => {
    const result = await runReminder({
      homeRoot: makeStateHome(),
      lookupLatestVersion: async () => '\x1b[31m9.9.9\x1b[0m',
    });
    expect(result.shown).toBe(false);
    expect(result.output).not.toContain('\x1b');
  });

  test('garbage version payloads are treated as lookup failure (short retry window)', async () => {
    const dir = makeStateHome();
    const t0 = Date.parse('2026-09-01T10:00:00Z');
    await runReminder({
      homeRoot: dir,
      nowMs: t0,
      lookupLatestVersion: async () => 'not-a-version',
    });
    // 垃圾响应不应消耗 24h：短窗口后可以再次查询。
    const retry = await runReminder({
      homeRoot: dir,
      nowMs: t0 + HOUR + 1000,
      lookupLatestVersion: async () => '2.0.0',
    });
    expect(retry.shown).toBe(true);
  });

  test('parseVersion rejects malformed shapes', () => {
    expect(parseVersion('1.2')).toBeNull();
    expect(parseVersion('1.2.x')).toBeNull();
    expect(parseVersion('')).toBeNull();
    expect(parseVersion('1.2.3-beta.1')).not.toBeNull();
    expect(parseVersion('1.2.3+build.5')).not.toBeNull();
  });

  test('numeric (not lexicographic) patch comparison: 1.0.9 < 1.0.10', async () => {
    const result = await runReminder({
      homeRoot: makeStateHome(),
      currentVersion: '1.0.9',
      lookupLatestVersion: async () => '1.0.10',
    });
    expect(result.shown).toBe(true);
  });
});

describe('adversarial: corrupted or forged cooldown state', () => {
  test('corrupt JSON state never blocks the command path', async () => {
    const sp = statePathOf(makeStateHome());
    fs.mkdirSync(path.dirname(sp), { recursive: true });
    fs.writeFileSync(sp, '{ broken');
    const result = await runReminder({
      homeRoot: path.dirname(path.dirname(sp)),
      lookupLatestVersion: async () => '2.0.0',
    });
    expect(result.shown).toBe(true);
  });

  test('future-timestamped attempts do not wedge the cooldown forever', async () => {
    const sp = statePathOf(makeStateHome());
    fs.mkdirSync(path.dirname(sp), { recursive: true });
    const future = new Date(Date.now() + 30 * 24 * HOUR).toISOString();
    fs.writeFileSync(sp, JSON.stringify({
      attempts: { 'cli.package': { scope: 'cli.package', attemptedAt: future, lastOutcome: 'success', lastOutcomeAt: future } },
    }));
    const result = await runReminder({
      homeRoot: path.dirname(path.dirname(sp)),
      lookupLatestVersion: async () => '2.0.0',
    });
    // 未来时间戳按"不冷却"处理：宁可多查一次，不被伪造状态长期静音。
    expect(result.shown).toBe(true);
  });

  test('future lastOutcomeAt alone does not wedge the cooldown (claim-time anchor wins)', async () => {
    const sp = statePathOf(makeStateHome());
    fs.mkdirSync(path.dirname(sp), { recursive: true });
    const now = Date.now();
    fs.writeFileSync(sp, JSON.stringify({
      attempts: {
        'cli.package': {
          scope: 'cli.package',
          attemptedAt: new Date(now - 2 * HOUR).toISOString(),
          lastOutcome: 'success',
          lastOutcomeAt: new Date(now + 30 * 24 * HOUR).toISOString(),
        },
      },
    }));
    const result = await runReminder({
      homeRoot: path.dirname(path.dirname(sp)),
      lookupLatestVersion: async () => '2.0.0',
    });
    expect(result.shown).toBe(true);
  });

  test('back-to-back invocations without time progress only notify once', async () => {
    const sp = statePathOf(makeStateHome());
    const t0 = Date.parse('2026-09-01T10:00:00Z');
    const lookup = jest.fn(async () => '2.0.0');
    const first = await runReminder({ homeRoot: path.dirname(path.dirname(sp)), nowMs: t0, lookupLatestVersion: lookup });
    const second = await runReminder({ homeRoot: path.dirname(path.dirname(sp)), nowMs: t0 + 1000, lookupLatestVersion: lookup });
    expect(first.shown).toBe(true);
    expect(second.shown).toBe(false);
    expect(lookup).toHaveBeenCalledTimes(1);
  });
});
