'use strict';

// 宿主 flag 解析面与 platform registry 的同步契约。
// 背景：clean/doctor/startup-reminder 的宿主枚举曾分散硬编码，新增宿主需要
// 同步修改多处，漏改表现为 flag 不被识别。收敛后解析面由 registry 派生，
// 本测试锁定派生关系本身，防止未来回退成第二份清单。

const {
  getPlatformDisplayName,
  getStartupReminderHosts,
  getSupportedPlatforms,
} = require('../../src/cli/adapters');
const { PLATFORM_REGISTRY: REGISTRY } = require('../../src/cli/adapters/platform-registry');
const { parseCleanArgs } = require('../../src/cli/commands/clean');
const { parseDoctorArgs } = require('../../src/cli/commands/doctor');
const { parseStartupReminderArgs } = require('../../src/cli/index');
const {
  INIT_PLATFORM_CHOICES,
  defaultInitPlatforms,
  parseInitArgs,
} = require('../../src/cli/commands/init-args');

function readSource(relativePath) {
  return require('node:fs').readFileSync(require('node:path').join(__dirname, '../..', relativePath), 'utf8');
}

describe('host flag parsing stays registry-driven', () => {
  test('every supported platform declares a non-empty displayName', () => {
    for (const platform of getSupportedPlatforms()) {
      const display = getPlatformDisplayName(platform);
      expect(typeof display).toBe('string');
      expect(display.length).toBeGreaterThan(0);
      expect(display).not.toBe(platform);
      expect(display).toBe(REGISTRY[platform].displayName);
    }
  });

  test('startup reminder hosts are exactly the platforms with a session-start hook', () => {
    const derived = getSupportedPlatforms().filter((platform) => {
      const sessionStart = REGISTRY[platform]
        && REGISTRY[platform].capabilities
        && REGISTRY[platform].capabilities.hooks
        && REGISTRY[platform].capabilities.hooks.sessionStart;
      return Boolean(sessionStart) && sessionStart.status !== 'not-supported';
    });

    expect(getStartupReminderHosts()).toEqual(derived);
    // 锁定当前集合：新增 startup 宿主应通过 registry 声明，并有意更新此断言。
    expect(getStartupReminderHosts()).toEqual(['claude', 'codex', 'qoder']);
  });

  test('clean accepts a --flag for every supported platform without marking it unknown', () => {
    for (const platform of getSupportedPlatforms()) {
      const parsed = parseCleanArgs([`--${platform}`]);
      expect(parsed[platform]).toBe(true);
      expect(parsed.unknown).toEqual([]);
    }
  });

  test('clean still rejects non-host flags as unknown', () => {
    const parsed = parseCleanArgs(['--not-a-host']);
    expect(parsed.unknown).toEqual(['--not-a-host']);
  });

  test('doctor accepts a --flag for every supported platform without marking it unknown', () => {
    for (const platform of getSupportedPlatforms()) {
      const parsed = parseDoctorArgs([`--${platform}`]);
      expect(parsed[platform]).toBe(true);
      expect(parsed.unknown).toEqual([]);
    }
  });

  test('adapters and the platform registry stay in one-to-one correspondence', () => {
    // adapters 键集驱动 flag 派生，registry 键集驱动 displayName/hooks 派生；
    // 两份清单漂移时 displayName 会静默回退成裸 id，必须显式锁死。
    expect(Object.keys(REGISTRY)).toEqual(getSupportedPlatforms());
  });

  test('startup reminder accepts only derived startup hosts', () => {
    for (const host of getStartupReminderHosts()) {
      expect(parseStartupReminderArgs([`--${host}`]).error).toBe('');
    }
    const nonStartupHosts = getSupportedPlatforms()
      .filter((platform) => !getStartupReminderHosts().includes(platform));
    expect(nonStartupHosts.length).toBeGreaterThan(0);
    for (const host of nonStartupHosts) {
      expect(parseStartupReminderArgs([`--${host}`]).error).toContain(`unknown option "--${host}"`);
    }
  });

  test('usage strings mention a flag for every supported platform', () => {
    // 解析面随 registry 扩展后，usage/help 文本是最后一份静态宿主清单；
    // 锁定同步关系，防止新宿主"parser 认识但 help 不提"。
    const usageSurfaces = [
      'src/cli/commands/clean.js',
      'src/cli/commands/doctor.js',
      'src/cli/commands/init.js',
      'src/cli/index.js',
    ];
    for (const surface of usageSurfaces) {
      const source = readSource(surface);
      for (const platform of getSupportedPlatforms()) {
        expect(source).toContain(`--${platform}`);
      }
    }
  });

  test('init platform choices derive ids and labels from the registry', () => {
    expect(INIT_PLATFORM_CHOICES.map((choice) => choice.id)).toEqual(getSupportedPlatforms());
    for (const choice of INIT_PLATFORM_CHOICES) {
      expect(choice.flag).toBe(choice.id);
      expect(choice.label).toBe(getPlatformDisplayName(choice.id));
      expect(typeof choice.defaultChecked).toBe('boolean');
      expect(typeof choice.defaultForYes).toBe('boolean');
    }
    // -y 模式至少需要一个默认宿主兜底（runInit 对空 default 会直接拒绝）。
    expect(defaultInitPlatforms().length).toBeGreaterThan(0);
  });

  test('init parses a --flag for every supported platform', () => {
    for (const platform of getSupportedPlatforms()) {
      const parsed = parseInitArgs([`--${platform}`]);
      expect(parsed.error).toBe('');
      expect(parsed.platforms).toEqual([platform]);
    }
  });
});
