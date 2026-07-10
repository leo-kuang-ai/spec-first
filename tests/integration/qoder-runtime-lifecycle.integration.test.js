'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..', '..');
const cliPath = path.join(repoRoot, 'bin', 'spec-first.js');

function tempSandbox() {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-qoder-integration-'));
  const home = path.join(projectRoot, 'home');
  fs.mkdirSync(home, { recursive: true });
  return { projectRoot, home };
}

function runSpecFirst(args, sandbox) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: sandbox.projectRoot,
    env: { ...process.env, HOME: sandbox.home },
    encoding: 'utf8',
    timeout: 120000,
  });
}

function parseJsonOutput(result) {
  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`failed to parse JSON output: ${error.message}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  }
}

describe('Qoder runtime lifecycle integration', () => {
  test('init installs degraded hook files, doctor reports degraded settings, and clean removes managed files', () => {
    const sandbox = tempSandbox();

    const init = runSpecFirst([
      'init',
      '--qoder',
      '-y',
      '-u',
      'qoder-integration',
      '--lang',
      'zh',
    ], sandbox);
    expect(init.status).toBe(0);

    const pointerPath = path.join(sandbox.projectRoot, '.qoder', 'rules', 'spec-first.md');
    expect(fs.readFileSync(pointerPath, 'utf8')).toMatch(/^---\ntrigger: always_on\n---\n/);
    for (const relativePath of [
      '.qoder/hooks/session-start',
      '.qoder/hooks/prd-prewrite-guard',
      '.qoder/hooks/prd-readiness-guard',
    ]) {
      expect(fs.existsSync(path.join(sandbox.projectRoot, relativePath))).toBe(true);
    }
    expect(fs.existsSync(path.join(sandbox.projectRoot, '.qoder', 'settings.json'))).toBe(false);

    const doctor = runSpecFirst(['doctor', '--qoder', '--json'], sandbox);
    expect(doctor.status).toBe(0);
    const report = parseJsonOutput(doctor);
    const settingsChecks = report.checks.filter((check) =>
      String(check.name || '').startsWith('.qoder/settings.json ')
    );
    expect(settingsChecks).toHaveLength(3);
    expect(settingsChecks.every((check) =>
      check.level === 'WARNING' && check.degradedByDesign === true && check.drift === false
    )).toBe(true);

    const clean = runSpecFirst(['clean', '--qoder'], sandbox);
    expect(clean.status).toBe(0);
    expect(fs.existsSync(pointerPath)).toBe(false);
    for (const relativePath of [
      '.qoder/hooks/session-start',
      '.qoder/hooks/prd-prewrite-guard',
      '.qoder/hooks/prd-readiness-guard',
    ]) {
      expect(fs.existsSync(path.join(sandbox.projectRoot, relativePath))).toBe(false);
    }
  });
});
