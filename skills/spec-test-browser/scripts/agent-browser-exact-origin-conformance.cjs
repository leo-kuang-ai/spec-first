#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const SCHEMA_VERSION = 'agent-browser-exact-origin-conformance/v1';
const BLOCKED_ERROR = /ERR_BLOCKED_BY_CLIENT|ERR_ABORTED|does not match exact origin/i;

function sha256(value) {
  return `sha256:${crypto.createHash('sha256').update(value).digest('hex')}`;
}

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--binary') options.binary = argv[++index];
    else if (argv[index] === '--expected-sha256') options.expectedSha256 = argv[++index];
    else return null;
  }
  return options.binary && options.expectedSha256 ? options : null;
}

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

function closeServer(server) {
  return new Promise((resolve) => server.close(resolve));
}

function cleanEnv(env) {
  const clean = {};
  for (const [key, value] of Object.entries(env)) {
    const upper = key.toUpperCase();
    if (upper.startsWith('AGENT_BROWSER_')
      || ['HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'NO_PROXY'].includes(upper)) continue;
    clean[key] = value;
  }
  return clean;
}

function run(binary, globalArgs, args, env, timeout = 30000) {
  return new Promise((resolve) => {
    const child = spawn(binary, [...globalArgs, ...args], {
      env,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeout);
    child.on('error', (error) => {
      clearTimeout(timer);
      resolve({ ok: false, status: null, stdout, stderr, error: error.message, timed_out: false });
    });
    child.on('close', (status, signal) => {
      clearTimeout(timer);
      resolve({
        ok: !timedOut && status === 0,
        status,
        signal,
        stdout,
        stderr,
        error: null,
        timed_out: timedOut,
      });
    });
  });
}

function compactAction(action) {
  return {
    exit_code: action.status,
    timed_out: action.timed_out,
    stdout: action.stdout,
    stderr: action.stderr,
    error: action.error,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options) throw new Error('conformance-arguments-invalid');
  const binary = fs.realpathSync.native(options.binary);
  const stat = fs.statSync(binary);
  if (!stat.isFile()) throw new Error('conformance-binary-invalid');
  const identity = { path: binary, sha256: sha256(fs.readFileSync(binary)), size: stat.size };
  if (identity.sha256 !== options.expectedSha256) throw new Error('conformance-binary-identity-mismatch');

  const runRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-agent-browser-conformance-'));
  fs.chmodSync(runRoot, 0o700);
  const configPath = path.join(runRoot, 'config.json');
  const policyPath = path.join(runRoot, 'action-policy.json');
  const screenshotDir = path.join(runRoot, 'screenshots');
  fs.mkdirSync(screenshotDir, { mode: 0o700 });
  fs.writeFileSync(configPath, '{}\n', { mode: 0o600 });
  fs.writeFileSync(policyPath, `${JSON.stringify({
    default: 'deny',
    allow: ['launch', 'navigate', 'open', 'get', 'gettext', 'geturl', 'url', 'click', 'close'],
  })}\n`, { mode: 0o600 });

  let blockedHits = 0;
  const blockedServer = http.createServer((_request, response) => {
    blockedHits += 1;
    response.writeHead(200, { 'content-type': 'text/html' });
    response.end('<!doctype html><title>blocked-origin</title>');
  });
  const blockedPort = await listen(blockedServer);
  const blockedOrigin = `http://127.0.0.1:${blockedPort}`;

  const allowedServer = http.createServer((request, response) => {
    if (request.url === '/redirect-same') {
      response.writeHead(302, { location: '/ok' });
      response.end();
      return;
    }
    if (request.url === '/redirect-cross') {
      response.writeHead(302, { location: `${blockedOrigin}/redirect-target` });
      response.end();
      return;
    }
    response.writeHead(200, { 'content-type': 'text/html' });
    response.end(`<!doctype html>
      <title>allowed-origin</title>
      <h1 id="status">ALLOWED ORIGIN</h1>
      <a id="same-link" href="/ok">same</a>
      <a id="cross-link" href="${blockedOrigin}/link-target">cross</a>
      <form id="cross-form" action="${blockedOrigin}/form-target" method="post">
        <button type="submit">submit</button>
      </form>
      <button id="script-cross" onclick="location.href='${blockedOrigin}/script-target'">script</button>
      <button id="popup-cross" onclick="window.open('${blockedOrigin}/popup-target', '_blank')">popup</button>
      <iframe id="cross-frame" src="${blockedOrigin}/frame-target"></iframe>`);
  });
  const allowedPort = await listen(allowedServer);
  const allowedOrigin = `http://127.0.0.1:${allowedPort}`;
  const token = crypto.randomBytes(4).toString('hex');
  const session = `sfc-${token}`;
  const namespace = `sfo-${token}`;
  const globalArgs = [
    '--session', session,
    '--namespace', namespace,
    '--config', configPath,
    '--content-boundaries',
    '--max-output', '20000',
    '--allowed-domains', '127.0.0.1',
    '--exact-origin', allowedOrigin,
    '--action-policy', policyPath,
    '--screenshot-dir', screenshotDir,
    '--json',
  ];
  const env = cleanEnv(process.env);
  const cases = [];
  const record = (name, status, actions, before) => {
    cases.push({
      name,
      status: status && blockedHits === before ? 'passed' : 'failed',
      blocked_origin_hits_before: before,
      blocked_origin_hits_after: blockedHits,
      actions: actions.map(compactAction),
    });
  };
  const invoke = (args) => run(binary, globalArgs, args, env);
  const openAllowed = async () => {
    const action = await invoke(['open', `${allowedOrigin}/`]);
    const text = action.ok ? await invoke(['get', 'text', '#status']) : null;
    return { ok: action.ok && text && text.ok && text.stdout.includes('ALLOWED ORIGIN'), actions: [action, ...(text ? [text] : [])] };
  };
  const checkStayedAllowed = async (action) => {
    if (!action.ok) {
      return {
        ok: BLOCKED_ERROR.test(`${action.stdout}\n${action.stderr}\n${action.error || ''}`),
        actions: [action],
      };
    }
    const url = await invoke(['get', 'url']);
    return {
      ok: url.ok && (url.stdout.includes(allowedOrigin) || url.stdout.includes('chrome-error://chromewebdata/')),
      actions: [action, url],
    };
  };

  let positiveControlPassed = false;
  try {
    let before = blockedHits;
    const initial = await openAllowed();
    await new Promise((resolve) => setTimeout(resolve, 200));
    record('initial-open-and-frame', initial.ok, initial.actions, before);

    before = blockedHits;
    const redirect = await invoke(['open', `${allowedOrigin}/redirect-same`]);
    const redirectUrl = redirect.ok ? await invoke(['get', 'url']) : null;
    const redirectOk = redirect.ok && redirectUrl && redirectUrl.ok && redirectUrl.stdout.includes(`${allowedOrigin}/ok`);
    record('same-origin-redirect', redirectOk, [redirect, ...(redirectUrl ? [redirectUrl] : [])], before);

    before = blockedHits;
    const crossRedirect = await invoke(['open', `${allowedOrigin}/redirect-cross`]);
    record('cross-origin-redirect', !crossRedirect.ok && BLOCKED_ERROR.test(`${crossRedirect.stdout}\n${crossRedirect.stderr}`), [crossRedirect], before);

    const sameLinkSetup = await openAllowed();
    before = blockedHits;
    const sameLink = sameLinkSetup.ok ? await invoke(['click', '#same-link']) : { ok: false, status: null, stdout: '', stderr: '', error: 'positive-control-setup-failed', timed_out: false };
    const sameLinkUrl = sameLink.ok ? await invoke(['get', 'url']) : null;
    const sameLinkOk = sameLink.ok && sameLinkUrl && sameLinkUrl.ok && sameLinkUrl.stdout.includes(`${allowedOrigin}/ok`);
    record('same-origin-link', sameLinkOk, [...sameLinkSetup.actions, sameLink, ...(sameLinkUrl ? [sameLinkUrl] : [])], before);
    positiveControlPassed = initial.ok && redirectOk && sameLinkOk;

    for (const [name, selector] of [
      ['cross-origin-link', '#cross-link'],
      ['cross-origin-form', '#cross-form button'],
      ['cross-origin-script', '#script-cross'],
      ['cross-origin-popup', '#popup-cross'],
    ]) {
      const setup = await openAllowed();
      before = blockedHits;
      const action = setup.ok ? await invoke(['click', selector]) : { ok: false, status: null, stdout: '', stderr: '', error: 'positive-control-setup-failed', timed_out: false };
      const stayedAllowed = setup.ok
        ? await checkStayedAllowed(action)
        : { ok: false, actions: [action] };
      record(name, stayedAllowed.ok, [...setup.actions, ...stayedAllowed.actions], before);
    }

    before = blockedHits;
    const direct = await invoke(['open', `${blockedOrigin}/direct-open`]);
    record('cross-origin-direct-open', !direct.ok && BLOCKED_ERROR.test(`${direct.stdout}\n${direct.stderr}`), [direct], before);
  } finally {
    await invoke(['close']);
    await Promise.all([closeServer(allowedServer), closeServer(blockedServer)]);
    fs.rmSync(runRoot, { recursive: true, force: true });
  }

  const result = {
    schema_version: SCHEMA_VERSION,
    status: positiveControlPassed && blockedHits === 0 && cases.every((item) => item.status === 'passed')
      ? 'passed'
      : 'failed',
    binary_identity: identity,
    positive_control: { status: positiveControlPassed ? 'passed' : 'failed' },
    blocked_origin_total_hits: blockedHits,
    cases,
  };
  process.stdout.write(`${JSON.stringify(result)}\n`);
  process.exitCode = result.status === 'passed' ? 0 : 1;
}

main().catch((error) => {
  process.stdout.write(`${JSON.stringify({
    schema_version: SCHEMA_VERSION,
    status: 'failed',
    error: error.message,
  })}\n`);
  process.exitCode = 1;
});
