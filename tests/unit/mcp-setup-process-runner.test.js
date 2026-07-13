'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  commandSucceeded,
  runProcess,
  runProcessSync,
} = require('../../skills/spec-runtime-setup/scripts/lib/process-runner.cjs');

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function processExists(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error.code === 'ESRCH') return false;
    throw error;
  }
}

function restoreEnv(name, value) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

describe('process-runner security and timeout isolation', () => {
  test('accepts only an integer zero exit without signal, error, or timeout', () => {
    expect(commandSucceeded({ exit_code: 0, signal: null, error: null, timed_out: false })).toBe(true);
    expect(commandSucceeded({ exit_code: null, signal: 'SIGTERM', error: null, timed_out: false })).toBe(false);
    expect(commandSucceeded({ exit_code: 0, signal: 'SIGTERM', error: null, timed_out: false })).toBe(false);
    expect(commandSucceeded({ exit_code: '0', signal: null, error: null, timed_out: false })).toBe(false);
  });

  test('redacts inherited credentials and Basic/Bearer headers from async and sync facts', async () => {
    const inheritedName = 'SPEC_FIRST_RUNNER_INHERITED_TOKEN';
    const basicName = 'SPEC_FIRST_RUNNER_BASIC_FIXTURE';
    const bearerName = 'SPEC_FIRST_RUNNER_BEARER_FIXTURE';
    const previous = {
      inherited: process.env[inheritedName],
      basic: process.env[basicName],
      bearer: process.env[bearerName],
    };
    const inheritedSecret = 'inherited-token-fixture-7349';
    const basicSecret = 'dXNlcjpwYXNzLWZpeHR1cmU=';
    const bearerSecret = 'bearer-fixture-9462';
    process.env[inheritedName] = inheritedSecret;
    process.env[basicName] = basicSecret;
    process.env[bearerName] = bearerSecret;

    const script = [
      `process.stdout.write(process.env.${inheritedName} + "\\n");`,
      `process.stdout.write("Authorization: Basic " + process.env.${basicName} + "\\n");`,
      `process.stderr.write(JSON.stringify({ Authorization: "Bearer " + process.env.${bearerName} }));`,
    ].join('');

    try {
      const asyncResult = await runProcess({
        command: process.execPath,
        args: ['-e', script],
        invocationSource: `fixture-${inheritedSecret}`,
      });
      const syncResult = runProcessSync({
        command: process.execPath,
        args: ['-e', script],
        timeoutMs: 10000,
      });
      const missingResult = await runProcess({
        command: `missing-command-${inheritedSecret}`,
      });

      for (const result of [asyncResult, syncResult, missingResult]) {
        const serialized = JSON.stringify(result);
        expect(serialized).not.toContain(inheritedSecret);
        expect(serialized).not.toContain(basicSecret);
        expect(serialized).not.toContain(bearerSecret);
      }
      expect(asyncResult.stdout).toContain('Authorization: Basic [REDACTED]');
      expect(asyncResult.stderr).toContain('Bearer [REDACTED]');
      expect(syncResult.stdout).toContain('[REDACTED]');
      expect(missingResult.error.code).toBe('ENOENT');
    } finally {
      restoreEnv(inheritedName, previous.inherited);
      restoreEnv(basicName, previous.basic);
      restoreEnv(bearerName, previous.bearer);
    }
  });

  test('supports a complete allowlisted environment without inheriting host credentials', async () => {
    const previous = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = 'runner-isolation-sentinel';
    const env = {
      PATH: process.env.PATH,
      HOME: os.homedir(),
      TMPDIR: os.tmpdir(),
      GRAPHIFY_OUT: '.graphify',
    };
    const script = 'process.stdout.write(JSON.stringify({secret:process.env.OPENAI_API_KEY||null,path:!!process.env.PATH,home:!!process.env.HOME,tmp:!!process.env.TMPDIR,out:process.env.GRAPHIFY_OUT}))';
    try {
      for (const result of [
        await runProcess({ command: process.execPath, args: ['-e', script], env, inheritEnv: false }),
        runProcessSync({ command: process.execPath, args: ['-e', script], env, inheritEnv: false }),
      ]) {
        expect(JSON.parse(result.stdout)).toEqual({ secret: null, path: true, home: true, tmp: true, out: '.graphify' });
      }
    } finally {
      restoreEnv('OPENAI_API_KEY', previous);
    }
  });

  const posixTest = process.platform === 'win32' ? test.skip : test;

  posixTest('runProcessSync force-kills and confirms a SIGTERM-resistant grandchild', async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-runner-sync-'));
    const pidFile = path.join(directory, 'grandchild.pid');
    const marker = path.join(directory, 'grandchild-survived');
    const grandchild = [
      'const fs = require("node:fs");',
      'process.on("SIGTERM", () => {});',
      `fs.writeFileSync(${JSON.stringify(pidFile)}, String(process.pid));`,
      `setTimeout(() => fs.writeFileSync(${JSON.stringify(marker)}, "alive"), 900);`,
      'setTimeout(() => process.exit(0), 2500);',
    ].join('');
    const parent = [
      'const { spawn } = require("node:child_process");',
      `spawn(process.execPath, ["-e", ${JSON.stringify(grandchild)}], { stdio: "ignore" });`,
      'setTimeout(() => {}, 3000);',
    ].join('');
    let grandchildPid = null;

    try {
      const result = runProcessSync({
        command: process.execPath,
        args: ['-e', parent],
        timeoutMs: 350,
        terminationGraceMs: 100,
      });

      expect(result.timed_out).toBe(true);
      expect(result.termination).toMatchObject({
        attempted: true,
        method: 'posix-process-group',
        graceful_signal: 'SIGTERM',
        forced_signal: 'SIGKILL',
        error: null,
      });
      expect(fs.existsSync(pidFile)).toBe(true);
      grandchildPid = Number(fs.readFileSync(pidFile, 'utf8'));
      const aliveWhenSyncCallReturned = processExists(grandchildPid);
      await delay(1100);

      expect(aliveWhenSyncCallReturned).toBe(false);
      expect(fs.existsSync(marker)).toBe(false);
    } finally {
      if (grandchildPid && processExists(grandchildPid)) {
        process.kill(grandchildPid, 'SIGKILL');
      }
      fs.rmSync(directory, { force: true, recursive: true });
    }
  }, 10000);
});
