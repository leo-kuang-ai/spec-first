'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { getAdapter } = require('../../src/cli/adapters');
const { runCli } = require('../../src/cli');
const {
  formatStartupVersionReminder,
  maybeShowStartupVersionReminder,
  shouldSkipCliVersionReminder,
} = require('../../src/cli/version-reminder');

function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-qoder-reminder-'));
}

describe('Qoder startup version reminder', () => {
  const tempRoots = [];
  const originalOptOut = process.env.SPEC_FIRST_NO_UPDATE_NOTIFIER;

  afterEach(() => {
    for (const root of tempRoots.splice(0)) {
      fs.rmSync(root, { recursive: true, force: true });
    }
    if (originalOptOut === undefined) {
      delete process.env.SPEC_FIRST_NO_UPDATE_NOTIFIER;
    } else {
      process.env.SPEC_FIRST_NO_UPDATE_NOTIFIER = originalOptOut;
    }
  });

  test('formats a Qoder-specific startup reminder', () => {
    expect(formatStartupVersionReminder({
      host: 'qoder',
      currentVersion: '1.0.0',
      latestVersion: '1.1.0',
    })).toContain('Update available for Qoder runtime: 1.0.0 -> 1.1.0');
  });

  test('skips CLI registry lookup for every non-TTY output stream', () => {
    expect(shouldSkipCliVersionReminder({ env: {}, output: { isTTY: undefined } })).toBe(true);
    expect(shouldSkipCliVersionReminder({ env: {}, output: { isTTY: false } })).toBe(true);
    expect(shouldSkipCliVersionReminder({ env: {}, output: { isTTY: true } })).toBe(false);
  });

  test('shows the Qoder runtime reminder once within the host cooldown window', async () => {
    const root = tempRoot();
    tempRoots.push(root);
    const projectRoot = path.join(root, 'project');
    const homeRoot = path.join(root, 'home');
    const adapter = getAdapter('qoder');
    const statePath = path.join(projectRoot, adapter.stateFile);
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    fs.writeFileSync(statePath, JSON.stringify({ manifestVersion: '1.0.0' }));

    let lookupCount = 0;
    let output = '';
    const options = {
      host: 'qoder',
      projectRoot,
      homeRoot,
      nowMs: Date.UTC(2026, 6, 10),
      lookupLatestVersion: async () => {
        lookupCount += 1;
        return '1.2.0';
      },
      output: {
        write(value) {
          output += value;
        },
      },
    };

    await expect(maybeShowStartupVersionReminder(options)).resolves.toBe(true);
    await expect(maybeShowStartupVersionReminder({
      ...options,
      nowMs: options.nowMs + 1000,
    })).resolves.toBe(false);

    expect(lookupCount).toBe(1);
    expect(output).toContain('Qoder runtime: 1.0.0 -> 1.2.0');
    expect(fs.existsSync(path.join(
      homeRoot,
      '.qoder',
      'spec-first',
      'startup-version-reminder.json',
    ))).toBe(true);
  });

  test('accepts the internal startup-reminder --qoder command', async () => {
    process.env.SPEC_FIRST_NO_UPDATE_NOTIFIER = '1';
    await expect(runCli(['startup-reminder', '--qoder'])).resolves.toBe(0);
  });
});
