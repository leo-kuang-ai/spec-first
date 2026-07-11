'use strict';

const fs = require('node:fs');
const { spawn, spawnSync } = require('node:child_process');

const DEFAULT_TIMEOUT_MS = 120000;
const DEFAULT_MAX_OUTPUT_BYTES = 256 * 1024;
const DEFAULT_TERMINATION_GRACE_MS = 250;
const DEFAULT_TERMINATION_CONFIRM_MS = 1000;
const PROCESS_GROUP_POLL_MS = 10;
const REDACTED = '[REDACTED]';
const SENSITIVE_KEY_PATTERN = /(?:token|secret|password|passphrase|api[_-]?key|authorization|credential|private[_-]?key|access[_-]?key)/i;
const AUTHORIZATION_CREDENTIAL_PATTERN = /authorization["']?\s*[:=]\s*["']?\s*(?:basic|bearer)\s+([^\s,;"'}]+)/i;
const AUTHORIZATION_REDACTION_PATTERN = /(authorization["']?\s*[:=]\s*["']?\s*(?:basic|bearer)\s+)[^\s,;"'}]+/gi;

function uniqueSecrets(values) {
  return [...new Set((values || [])
    .filter((value) => typeof value === 'string' && value.length > 0)
    .sort((left, right) => right.length - left.length))];
}

function collectRedactionValues(envOverlay = {}, explicitValues = []) {
  const values = [...explicitValues];
  for (const [key, value] of Object.entries(envOverlay || {})) {
    if (SENSITIVE_KEY_PATTERN.test(key) && value !== undefined && value !== null) {
      values.push(String(value));
    }
  }
  return uniqueSecrets(values);
}

function collectArgRedactionValues(args = []) {
  const values = [];
  const input = Array.isArray(args) ? args.map(String) : [];
  for (let index = 0; index < input.length; index += 1) {
    const token = input[index];
    const inline = /^(?:--?)?([^=:\s]+)[=:](.+)$/.exec(token);
    if (inline && SENSITIVE_KEY_PATTERN.test(inline[1])) values.push(inline[2]);
    const flagName = token.replace(/^--?/, '');
    if (SENSITIVE_KEY_PATTERN.test(flagName) && !token.includes('=') && input[index + 1] !== undefined) {
      values.push(input[index + 1]);
      index += 1;
    }
    const authorization = AUTHORIZATION_CREDENTIAL_PATTERN.exec(token);
    if (authorization) values.push(authorization[1]);
    const credentialUrl = /\b(?:https?|ssh):\/\/[^\s:/@]+:([^\s/@]+)@/i.exec(token);
    if (credentialUrl) values.push(credentialUrl[1]);
  }
  return uniqueSecrets(values);
}

function redactText(value, secrets = []) {
  if (value === undefined || value === null) return value;
  let text = String(value);
  for (const secret of uniqueSecrets(secrets)) {
    text = text.split(secret).join(REDACTED);
  }
  text = text
    .replace(AUTHORIZATION_REDACTION_PATTERN, `$1${REDACTED}`)
    .replace(/((?:token|secret|password|passphrase|api[_-]?key|credential|private[_-]?key|access[_-]?key)\s*[=:]\s*)[^\s,;"']+/gi, `$1${REDACTED}`)
    .replace(/(\b(?:https?|ssh):\/\/[^\s:/@]+:)[^\s/@]+@/gi, `$1${REDACTED}@`);
  return text;
}

function redactEnvOverlay(envOverlay, secrets) {
  const result = {};
  for (const [key, value] of Object.entries(envOverlay || {})) {
    result[key] = SENSITIVE_KEY_PATTERN.test(key)
      ? REDACTED
      : redactText(value, secrets);
  }
  return result;
}

function sanitizeError(error, secrets) {
  if (!error) return null;
  return {
    name: redactText(error.name || 'Error', secrets),
    code: error.code === undefined || error.code === null
      ? null
      : redactText(error.code, secrets),
    message: redactText(error.message || String(error), secrets),
    syscall: redactText(error.syscall || '', secrets) || null,
    path: redactText(error.path || '', secrets) || null,
  };
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function processGroupExists(pid) {
  try {
    process.kill(-pid, 0);
    return true;
  } catch (error) {
    if (error.code === 'ESRCH') return false;
    if (error.code === 'EPERM') return true;
    throw error;
  }
}

async function waitForProcessGroupExit(pid, timeoutMs) {
  const deadline = Date.now() + Math.max(0, timeoutMs);
  while (processGroupExists(pid)) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) return false;
    await delay(Math.min(PROCESS_GROUP_POLL_MS, remaining));
  }
  return true;
}

function withTerminationCompletion(facts, completion) {
  Object.defineProperty(facts, 'completion', {
    configurable: false,
    enumerable: false,
    value: completion,
    writable: false,
  });
  return facts;
}

function appendBounded(state, chunk, maxBytes, lookaheadBytes) {
  const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
  state.totalBytes += buffer.length;
  const captureLimit = maxBytes + lookaheadBytes;
  if (state.capturedBytes >= captureLimit) {
    state.truncated = true;
    return;
  }
  const remaining = captureLimit - state.capturedBytes;
  const slice = buffer.subarray(0, remaining);
  state.chunks.push(slice);
  state.capturedBytes += slice.length;
  if (slice.length < buffer.length || state.totalBytes > maxBytes) state.truncated = true;
}

function finalizeOutput(state, maxBytes, secrets) {
  const captured = Buffer.concat(state.chunks).toString('utf8');
  const redacted = redactText(captured, secrets);
  const output = Buffer.from(redacted).subarray(0, maxBytes).toString('utf8');
  return {
    output,
    truncated: state.truncated || Buffer.byteLength(redacted) > maxBytes,
    totalBytes: state.totalBytes,
  };
}

function terminateProcessTree(child, options = {}) {
  const platform = options.platform || process.platform;
  const secrets = options.secrets || [];
  const graceMs = Number.isFinite(options.graceMs)
    ? Math.max(0, options.graceMs)
    : DEFAULT_TERMINATION_GRACE_MS;
  const confirmationMs = Number.isFinite(options.confirmationMs)
    ? Math.max(0, options.confirmationMs)
    : DEFAULT_TERMINATION_CONFIRM_MS;
  const facts = {
    attempted: Boolean(child && child.pid),
    method: platform === 'win32' ? 'taskkill-tree' : 'posix-process-group',
    graceful_signal: platform === 'win32' ? null : 'SIGTERM',
    forced_signal: platform === 'win32' ? null : 'SIGKILL',
    error: null,
  };
  if (!child || !child.pid) return withTerminationCompletion(facts, Promise.resolve());

  if (platform === 'win32') {
    try {
      const taskkill = options.taskkill || spawnSync;
      const result = taskkill('taskkill.exe', ['/pid', String(child.pid), '/T', '/F'], {
        shell: false,
        windowsHide: true,
        stdio: 'ignore',
      });
      if (result && result.error) throw result.error;
      if (result && typeof result.status === 'number' && result.status !== 0) {
        const error = new Error(`taskkill 退出状态为 ${result.status}`);
        error.code = 'TASKKILL_FAILED';
        throw error;
      }
    } catch (error) {
      facts.error = sanitizeError(error, secrets);
      try {
        child.kill('SIGKILL');
      } catch (_ignored) {
        // 进程可能已经退出。
      }
    }
    return withTerminationCompletion(facts, Promise.resolve());
  }

  let gracefulSignalFailed = false;
  try {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch (error) {
      if (error.code !== 'ESRCH') throw error;
      return withTerminationCompletion(facts, Promise.resolve());
    }
  } catch (error) {
    gracefulSignalFailed = true;
    facts.error = sanitizeError(error, secrets);
  }

  const completion = (async () => {
    try {
      if (!gracefulSignalFailed && await waitForProcessGroupExit(child.pid, graceMs)) return;

      try {
        process.kill(-child.pid, 'SIGKILL');
      } catch (error) {
        if (error.code === 'ESRCH') return;
        facts.error = sanitizeError(error, secrets);
        try {
          child.kill('SIGKILL');
        } catch (_ignored) {
          // 进程可能已经退出。
        }
      }

      if (!await waitForProcessGroupExit(child.pid, confirmationMs)) {
        const error = new Error(`process group ${child.pid} 在 SIGKILL 后仍存活`);
        error.code = 'PROCESS_GROUP_STILL_RUNNING';
        facts.error = sanitizeError(error, secrets);
      }
    } catch (error) {
      facts.error = sanitizeError(error, secrets);
    }
  })();
  return withTerminationCompletion(facts, completion);
}

function runProcess(options = {}) {
  const command = options.command;
  const args = Array.isArray(options.args) ? options.args.map((arg) => String(arg)) : [];
  const envOverlay = options.env && typeof options.env === 'object' ? { ...options.env } : {};
  const effectiveEnv = { ...process.env, ...envOverlay };
  const secrets = collectRedactionValues(effectiveEnv, [
    ...(options.redactValues || []),
    ...collectArgRedactionValues(args),
  ]);
  const timeoutMs = Number.isFinite(options.timeoutMs) && options.timeoutMs > 0
    ? options.timeoutMs
    : DEFAULT_TIMEOUT_MS;
  const maxOutputBytes = Number.isFinite(options.maxOutputBytes) && options.maxOutputBytes >= 0
    ? options.maxOutputBytes
    : DEFAULT_MAX_OUTPUT_BYTES;
  const lookaheadBytes = Math.max(4096, ...secrets.map((secret) => Buffer.byteLength(secret) * 2), 0);
  const stdoutState = { chunks: [], capturedBytes: 0, totalBytes: 0, truncated: false };
  const stderrState = { chunks: [], capturedBytes: 0, totalBytes: 0, truncated: false };
  const startedAt = Date.now();

  if (typeof command !== 'string' || command.length === 0) {
    return Promise.resolve({
      command: '',
      argv: [],
      cwd: redactText(options.cwd || process.cwd(), secrets),
      env_overlay: redactEnvOverlay(envOverlay, secrets),
      exit_code: null,
      signal: null,
      timed_out: false,
      stdout: '',
      stderr: '',
      stdout_truncated: false,
      stderr_truncated: false,
      stdout_bytes: 0,
      stderr_bytes: 0,
      duration_ms: 0,
      invocation_source: redactText(options.invocationSource || 'direct', secrets),
      mirror_attempted: Boolean(options.mirrorAttempt),
      termination: { attempted: false, method: null, graceful_signal: null, forced_signal: null, error: null },
      error: { name: 'TypeError', code: 'INVALID_COMMAND', message: 'command 必须是非空字符串', syscall: null, path: null },
    });
  }

  return new Promise((resolve) => {
    let settled = false;
    let spawnError = null;
    let timedOut = false;
    let termination = { attempted: false, method: null, graceful_signal: null, forced_signal: null, error: null };
    let terminationCompletion = Promise.resolve();
    const child = spawn(command, args, {
      cwd: options.cwd || process.cwd(),
      env: effectiveEnv,
      shell: false,
      detached: (options.platform || process.platform) !== 'win32',
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    if (child.stdout) {
      child.stdout.on('data', (chunk) => appendBounded(stdoutState, chunk, maxOutputBytes, lookaheadBytes));
    }
    if (child.stderr) {
      child.stderr.on('data', (chunk) => appendBounded(stderrState, chunk, maxOutputBytes, lookaheadBytes));
    }

    const timer = setTimeout(() => {
      timedOut = true;
      termination = terminateProcessTree(child, {
        platform: options.platform,
        graceMs: options.terminationGraceMs,
        confirmationMs: options.terminationConfirmationMs,
        secrets,
        taskkill: options.taskkill,
      });
      terminationCompletion = termination.completion;
    }, timeoutMs);
    if (typeof timer.unref === 'function') timer.unref();

    child.on('error', (error) => {
      spawnError = error;
    });

    child.on('close', async (code, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      await terminationCompletion;
      const stdout = finalizeOutput(stdoutState, maxOutputBytes, secrets);
      const stderr = finalizeOutput(stderrState, maxOutputBytes, secrets);
      resolve({
        command: redactText(command, secrets),
        argv: args.map((arg) => redactText(arg, secrets)),
        cwd: redactText(options.cwd || process.cwd(), secrets),
        env_overlay: redactEnvOverlay(envOverlay, secrets),
        exit_code: spawnError ? null : (Number.isInteger(code) ? code : null),
        signal: signal || null,
        timed_out: timedOut,
        stdout: stdout.output,
        stderr: stderr.output,
        stdout_truncated: stdout.truncated,
        stderr_truncated: stderr.truncated,
        stdout_bytes: stdout.totalBytes,
        stderr_bytes: stderr.totalBytes,
        duration_ms: Date.now() - startedAt,
        invocation_source: redactText(options.invocationSource || 'direct', secrets),
        mirror_attempted: Boolean(options.mirrorAttempt),
        termination,
        error: sanitizeError(spawnError, secrets),
      });
    });
  });
}

async function runProcessWithMirror({ primary, mirror } = {}) {
  const primaryResult = await runProcess({ ...(primary || {}), mirrorAttempt: false });
  const failed = primaryResult.timed_out
    || primaryResult.error !== null
    || primaryResult.exit_code !== 0;
  if (!failed || !mirror) {
    return {
      ...primaryResult,
      mirror_attempted: false,
      attempts: [primaryResult],
    };
  }

  const mirrorResult = await runProcess({ ...mirror, mirrorAttempt: true });
  return {
    ...mirrorResult,
    mirror_attempted: true,
    attempts: [primaryResult, mirrorResult],
  };
}

function runProcessSync(options = {}) {
  const timeoutMs = Number.isFinite(options.timeoutMs) && options.timeoutMs > 0
    ? options.timeoutMs
    : DEFAULT_TIMEOUT_MS;
  const serializable = Object.fromEntries(
    Object.entries(options).filter(([, value]) => typeof value !== 'function'),
  );
  const terminationGraceMs = Number.isFinite(options.terminationGraceMs)
    ? Math.max(0, options.terminationGraceMs)
    : DEFAULT_TERMINATION_GRACE_MS;
  const terminationConfirmationMs = Number.isFinite(options.terminationConfirmationMs)
    ? Math.max(0, options.terminationConfirmationMs)
    : DEFAULT_TERMINATION_CONFIRM_MS;
  const worker = spawnSync(process.execPath, [__filename, '--sync-worker'], {
    input: JSON.stringify(serializable),
    encoding: 'utf8',
    shell: false,
    windowsHide: true,
    timeout: timeoutMs + terminationGraceMs + terminationConfirmationMs + 1000,
    maxBuffer: Math.max(DEFAULT_MAX_OUTPUT_BYTES * 4, 1024 * 1024),
  });
  if (worker.status === 0) {
    try {
      return JSON.parse(worker.stdout);
    } catch (_error) {
      // 继续落入结构化 runner failure。
    }
  }
  const envOverlay = options.env && typeof options.env === 'object' ? options.env : {};
  const secrets = collectRedactionValues({ ...process.env, ...envOverlay }, [
    ...(options.redactValues || []),
    ...collectArgRedactionValues(options.args),
  ]);
  return {
    command: redactText(options.command || '', secrets),
    argv: (options.args || []).map((arg) => redactText(arg, secrets)),
    cwd: redactText(options.cwd || process.cwd(), secrets),
    env_overlay: redactEnvOverlay(envOverlay, secrets),
    exit_code: Number.isInteger(worker.status) ? worker.status : null,
    signal: worker.signal || null,
    timed_out: Boolean(worker.error && worker.error.code === 'ETIMEDOUT'),
    stdout: '',
    stderr: redactText(worker.stderr || '', secrets),
    stdout_truncated: false,
    stderr_truncated: false,
    stdout_bytes: 0,
    stderr_bytes: Buffer.byteLength(worker.stderr || ''),
    duration_ms: 0,
    invocation_source: redactText(options.invocationSource || 'direct', secrets),
    mirror_attempted: Boolean(options.mirrorAttempt),
    termination: {
      attempted: Boolean(worker.error && worker.error.code === 'ETIMEDOUT'),
      method: 'sync-worker',
      graceful_signal: null,
      forced_signal: null,
      error: null,
    },
    error: sanitizeError(worker.error || new Error('process runner sync worker 失败'), secrets),
  };
}

function runCommandSync(command, args, options = {}) {
  return runProcessSync({ command, args, ...options });
}

function commandSucceeded(result) {
  return Boolean(result
    && Number.isInteger(result.exit_code)
    && result.exit_code === 0
    && !result.signal
    && result.timed_out !== true
    && result.timeout !== true
    && !result.error);
}

async function runSyncWorker() {
  try {
    const raw = fs.readFileSync(0, 'utf8');
    const options = raw ? JSON.parse(raw) : {};
    const result = await runProcess(options);
    process.stdout.write(JSON.stringify(result));
  } catch (error) {
    process.stderr.write(`${error && error.stack ? error.stack : String(error)}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  collectRedactionValues,
  commandSucceeded,
  redactText,
  runCommandSync,
  runProcess,
  runProcessSync,
  runProcessWithMirror,
};

if (require.main === module && process.argv[2] === '--sync-worker') {
  runSyncWorker();
}
