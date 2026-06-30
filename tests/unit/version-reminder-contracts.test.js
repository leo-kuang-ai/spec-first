'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  clearCliVersionReminderCooldown,
  clearStartupVersionReminderCooldown,
  maybeShowStartupVersionReminder,
  maybeShowVersionReminder,
} = require('../../src/cli/version-reminder');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-version-reminder-'));
}

function writeRuntimeState(projectRoot, host, manifestVersion = '1.6.1') {
  fs.mkdirSync(path.join(projectRoot, `.${host}`, 'spec-first'), { recursive: true });
  fs.writeFileSync(
    path.join(projectRoot, `.${host}`, 'spec-first', 'state.json'),
    `${JSON.stringify({ manifestVersion })}\n`,
    'utf8',
  );
}

describe('version reminder attempt gate contracts', () => {
  test('cli package gate records already-latest attempts and suppresses repeated lookup', async () => {
    const homeRoot = makeTempDir();
    const nowMs = Date.parse('2026-06-21T06:00:00.000Z');
    let calls = 0;

    try {
      const firstPrinted = await maybeShowVersionReminder({
        packageName: 'spec-first',
        currentVersion: '1.4.0',
        homeRoot,
        nowMs,
        cooldownMs: 1000,
        lookupLatestVersion: async () => {
          calls += 1;
          return '1.4.0';
        },
        output: { write() { return true; } },
      });

      const secondPrinted = await maybeShowVersionReminder({
        packageName: 'spec-first',
        currentVersion: '1.4.0',
        homeRoot,
        nowMs: nowMs + 100,
        cooldownMs: 1000,
        lookupLatestVersion: async () => {
          calls += 1;
          return '9.9.9';
        },
        output: { write() { return true; } },
      });

      expect(firstPrinted).toBe(false);
      expect(secondPrinted).toBe(false);
      expect(calls).toBe(1);
      expect(fs.readFileSync(path.join(homeRoot, '.spec-first', 'version-reminder.json'), 'utf8'))
        .toContain('"cli.package"');
    } finally {
      fs.rmSync(homeRoot, { recursive: true, force: true });
    }
  });

  test('startup gate records already-latest attempts and suppresses repeated lookup', async () => {
    const homeRoot = makeTempDir();
    const projectRoot = makeTempDir();
    const nowMs = Date.parse('2026-06-21T07:00:00.000Z');
    let calls = 0;

    try {
      writeRuntimeState(projectRoot, 'codex', '1.6.1');

      const firstPrinted = await maybeShowStartupVersionReminder({
        host: 'codex',
        projectRoot,
        homeRoot,
        nowMs,
        cooldownMs: 1000,
        lookupLatestVersion: async () => {
          calls += 1;
          return '1.6.1';
        },
        output: { write() { return true; } },
      });

      const secondPrinted = await maybeShowStartupVersionReminder({
        host: 'codex',
        projectRoot,
        homeRoot,
        nowMs: nowMs + 100,
        cooldownMs: 1000,
        lookupLatestVersion: async () => {
          calls += 1;
          return '1.6.2';
        },
        output: { write() { return true; } },
      });

      expect(firstPrinted).toBe(false);
      expect(secondPrinted).toBe(false);
      expect(calls).toBe(1);
      expect(fs.readFileSync(path.join(homeRoot, '.codex', 'spec-first', 'startup-version-reminder.json'), 'utf8'))
        .toContain('"startup.codex"');
    } finally {
      fs.rmSync(homeRoot, { recursive: true, force: true });
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('corrupt cli reminder state fails open and rewrites attempt state', async () => {
    const homeRoot = makeTempDir();
    const statePath = path.join(homeRoot, '.spec-first', 'version-reminder.json');
    let calls = 0;

    try {
      fs.mkdirSync(path.dirname(statePath), { recursive: true });
      fs.writeFileSync(statePath, '{not-json', 'utf8');

      const printed = await maybeShowVersionReminder({
        packageName: 'spec-first',
        currentVersion: '1.4.0',
        homeRoot,
        nowMs: Date.parse('2026-06-21T08:00:00.000Z'),
        cooldownMs: 1000,
        lookupLatestVersion: async () => {
          calls += 1;
          return '1.4.1';
        },
        output: { write() { return true; } },
      });

      expect(printed).toBe(true);
      expect(calls).toBe(1);
      expect(JSON.parse(fs.readFileSync(statePath, 'utf8')).attempts['cli.package']).toBeTruthy();
    } finally {
      fs.rmSync(homeRoot, { recursive: true, force: true });
    }
  });

  test('corrupt startup reminder state fails open and rewrites attempt state', async () => {
    const homeRoot = makeTempDir();
    const projectRoot = makeTempDir();
    const statePath = path.join(homeRoot, '.codex', 'spec-first', 'startup-version-reminder.json');
    let calls = 0;

    try {
      writeRuntimeState(projectRoot, 'codex', '1.6.1');
      fs.mkdirSync(path.dirname(statePath), { recursive: true });
      fs.writeFileSync(statePath, '{not-json', 'utf8');

      const printed = await maybeShowStartupVersionReminder({
        host: 'codex',
        projectRoot,
        homeRoot,
        nowMs: Date.parse('2026-06-21T09:00:00.000Z'),
        cooldownMs: 1000,
        lookupLatestVersion: async () => {
          calls += 1;
          return '1.6.2';
        },
        output: { write() { return true; } },
      });

      expect(printed).toBe(true);
      expect(calls).toBe(1);
      expect(JSON.parse(fs.readFileSync(statePath, 'utf8')).attempts['startup.codex']).toBeTruthy();
    } finally {
      fs.rmSync(homeRoot, { recursive: true, force: true });
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('busy cli attempt lock suppresses duplicate lookup', async () => {
    const homeRoot = makeTempDir();
    const statePath = path.join(homeRoot, '.spec-first', 'version-reminder.json');
    let calls = 0;

    try {
      fs.mkdirSync(`${statePath}.cli.package.lock`, { recursive: true });

      const printed = await maybeShowVersionReminder({
        packageName: 'spec-first',
        currentVersion: '1.4.0',
        homeRoot,
        nowMs: Date.parse('2026-06-21T10:00:00.000Z'),
        cooldownMs: 1000,
        lookupLatestVersion: async () => {
          calls += 1;
          return '1.4.1';
        },
        output: { write() { return true; } },
      });

      expect(printed).toBe(false);
      expect(calls).toBe(0);
    } finally {
      fs.rmSync(homeRoot, { recursive: true, force: true });
    }
  });

  test('cli opt-out skips lookup and attempt state writes', async () => {
    const homeRoot = makeTempDir();
    const statePath = path.join(homeRoot, '.spec-first', 'version-reminder.json');
    let calls = 0;

    try {
      const printed = await maybeShowVersionReminder({
        packageName: 'spec-first',
        currentVersion: '1.4.0',
        homeRoot,
        env: { SPEC_FIRST_NO_UPDATE_NOTIFIER: '1' },
        lookupLatestVersion: async () => {
          calls += 1;
          return '1.4.1';
        },
        output: { write() { return true; } },
      });

      expect(printed).toBe(false);
      expect(calls).toBe(0);
      expect(fs.existsSync(statePath)).toBe(false);
    } finally {
      fs.rmSync(homeRoot, { recursive: true, force: true });
    }
  });

  test('cli automation surfaces skip lookup and attempt state writes', async () => {
    const cases = [
      {
        name: 'ci',
        env: { CI: 'true' },
        output: { write() { return true; }, isTTY: true },
      },
      {
        name: 'non-tty',
        env: {},
        output: { write() { return true; }, isTTY: false },
      },
    ];

    for (const testCase of cases) {
      const homeRoot = makeTempDir();
      const statePath = path.join(homeRoot, '.spec-first', 'version-reminder.json');
      let calls = 0;

      try {
        const printed = await maybeShowVersionReminder({
          packageName: 'spec-first',
          currentVersion: '1.4.0',
          homeRoot,
          env: testCase.env,
          lookupLatestVersion: async () => {
            calls += 1;
            return '1.4.1';
          },
          output: testCase.output,
        });

        expect(`${testCase.name}:${printed}`).toBe(`${testCase.name}:false`);
        expect(`${testCase.name}:${calls}`).toBe(`${testCase.name}:0`);
        expect(fs.existsSync(statePath)).toBe(false);
      } finally {
        fs.rmSync(homeRoot, { recursive: true, force: true });
      }
    }
  });

  test('cli cooldown reset removes the package attempt lock', () => {
    const homeRoot = makeTempDir();
    const statePath = path.join(homeRoot, '.spec-first', 'version-reminder.json');
    const lockPath = `${statePath}.cli.package.lock`;

    try {
      fs.mkdirSync(lockPath, { recursive: true });

      expect(clearCliVersionReminderCooldown({ homeRoot })).toBe(true);
      expect(fs.existsSync(lockPath)).toBe(false);
    } finally {
      fs.rmSync(homeRoot, { recursive: true, force: true });
    }
  });

  test('busy startup attempt lock suppresses duplicate lookup', async () => {
    const homeRoot = makeTempDir();
    const projectRoot = makeTempDir();
    const statePath = path.join(homeRoot, '.codex', 'spec-first', 'startup-version-reminder.json');
    let calls = 0;

    try {
      writeRuntimeState(projectRoot, 'codex', '1.6.1');
      fs.mkdirSync(`${statePath}.startup.codex.lock`, { recursive: true });

      const printed = await maybeShowStartupVersionReminder({
        host: 'codex',
        projectRoot,
        homeRoot,
        nowMs: Date.parse('2026-06-21T11:00:00.000Z'),
        cooldownMs: 1000,
        lookupLatestVersion: async () => {
          calls += 1;
          return '1.6.2';
        },
        output: { write() { return true; } },
      });

      expect(printed).toBe(false);
      expect(calls).toBe(0);
    } finally {
      fs.rmSync(homeRoot, { recursive: true, force: true });
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('startup opt-out skips lookup and attempt state writes', async () => {
    const homeRoot = makeTempDir();
    const projectRoot = makeTempDir();
    const statePath = path.join(homeRoot, '.codex', 'spec-first', 'startup-version-reminder.json');
    let calls = 0;

    try {
      writeRuntimeState(projectRoot, 'codex', '1.6.1');

      const printed = await maybeShowStartupVersionReminder({
        host: 'codex',
        projectRoot,
        homeRoot,
        env: { SPEC_FIRST_NO_UPDATE_NOTIFIER: 'true' },
        lookupLatestVersion: async () => {
          calls += 1;
          return '1.6.2';
        },
        output: { write() { return true; }, isTTY: false },
      });

      expect(printed).toBe(false);
      expect(calls).toBe(0);
      expect(fs.existsSync(statePath)).toBe(false);
    } finally {
      fs.rmSync(homeRoot, { recursive: true, force: true });
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('startup reminder does not treat non-tty output as automation skip', async () => {
    const homeRoot = makeTempDir();
    const projectRoot = makeTempDir();
    let calls = 0;
    let captured = '';

    try {
      writeRuntimeState(projectRoot, 'codex', '1.6.1');

      const printed = await maybeShowStartupVersionReminder({
        host: 'codex',
        projectRoot,
        homeRoot,
        env: {},
        lookupLatestVersion: async () => {
          calls += 1;
          return '1.6.2';
        },
        output: {
          isTTY: false,
          write(message) {
            captured += message;
            return true;
          },
        },
      });

      expect(printed).toBe(true);
      expect(calls).toBe(1);
      expect(captured).toContain('spec-first update');
    } finally {
      fs.rmSync(homeRoot, { recursive: true, force: true });
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('startup cooldown reset removes the host attempt lock', () => {
    const homeRoot = makeTempDir();
    const statePath = path.join(homeRoot, '.codex', 'spec-first', 'startup-version-reminder.json');
    const lockPath = `${statePath}.startup.codex.lock`;

    try {
      fs.mkdirSync(lockPath, { recursive: true });

      expect(clearStartupVersionReminderCooldown({ host: 'codex', homeRoot })).toBe(true);
      expect(fs.existsSync(lockPath)).toBe(false);
    } finally {
      fs.rmSync(homeRoot, { recursive: true, force: true });
    }
  });
});
