#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const http = require('node:http');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const path = require('node:path');

const argv = process.argv.slice(2);
const command = argv[0];
const value = (name, fallback) => {
  const index = argv.indexOf(name);
  return index === -1 ? fallback : argv[index + 1];
};
const rootArg = value('--root', null);
let root = rootArg ? path.resolve(rootArg) : null;
const host = value('--host', '127.0.0.1');
const instanceTokenValue = value('--instance-token', null);
const instanceToken = instanceTokenValue || crypto.randomBytes(24).toString('hex');
const port = Number(value('--port', '0'));
const foreground = argv.includes('--foreground') || command === 'serve';
const ownerPidValue = value('--owner-pid', null);
const ownerPid = ownerPidValue === null ? null : Number(ownerPidValue);

function fail(message) { process.stderr.write(`${message}\n`); process.exit(1); }
function ensureRoot() {
  if (!root || !Number.isInteger(port) || port < 0 || port > 65535) fail('unsafe or missing --root/--port');
  if (!['127.0.0.1', '::1'].includes(host)) fail('preview host must be an explicit loopback address');
  if (!/^[a-f0-9]{48}$/.test(instanceToken)) fail('invalid --instance-token');
  let stat;
  try { stat = fs.lstatSync(root); } catch { fail('unsafe or missing --root'); }
  if (!stat.isDirectory() || stat.isSymbolicLink()) fail('unsafe or missing --root');
  if (typeof process.getuid === 'function' && stat.uid !== process.getuid()) fail('preview root must be owned by the current user');
  root = fs.realpathSync(root);
}
ensureRoot();

const screens = path.join(root, 'screens');
const state = path.join(root, 'state');
const pidFile = path.join(state, 'server.pid');
const infoFile = path.join(state, 'display-info.json');
const scriptPath = __filename;
const idleMs = Number(process.env.SPEC_FIRST_PROTOTYPE_IDLE_MS || 30 * 60 * 1000);
const checkMs = Number(process.env.SPEC_FIRST_PROTOTYPE_CHECK_MS || 60 * 1000);

function ensureDirs() {
  fs.mkdirSync(screens, { recursive: true, mode: 0o700 });
  fs.mkdirSync(state, { recursive: true, mode: 0o700 });
  assertPrivateDirectory(screens, 'screens');
  assertPrivateDirectory(state, 'state');
}
function assertPrivateDirectory(directory, label) {
  let stat;
  try { stat = fs.lstatSync(directory); } catch { fail(`preview ${label} directory must be a real owner-controlled directory`); }
  if (!stat.isDirectory() || stat.isSymbolicLink()) fail(`preview ${label} directory must be a real owner-controlled directory`);
  if (typeof process.getuid === 'function' && stat.uid !== process.getuid()) fail(`preview ${label} directory must be a real owner-controlled directory`);
  const relative = path.relative(root, fs.realpathSync(directory));
  if (relative !== label || relative.startsWith('..') || path.isAbsolute(relative)) fail(`preview ${label} directory must be a real owner-controlled directory`);
}
function fileFlags(base) {
  return typeof fs.constants.O_NOFOLLOW === 'number' ? base | fs.constants.O_NOFOLLOW : base;
}
function readOwnedFile(file) {
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('unsafe state file');
  if (typeof process.getuid === 'function' && stat.uid !== process.getuid()) throw new Error('unsafe state file owner');
  return fs.readFileSync(file, 'utf8');
}
function writeAtomic(file, content) {
  assertPrivateDirectory(state, 'state');
  const temporary = path.join(state, `.${path.basename(file)}.${process.pid}.${crypto.randomBytes(8).toString('hex')}.tmp`);
  let descriptor;
  try {
    descriptor = fs.openSync(temporary, fileFlags(fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_WRONLY), 0o600);
    fs.writeFileSync(descriptor, content);
    fs.fsyncSync(descriptor);
    fs.closeSync(descriptor);
    descriptor = null;
    fs.renameSync(temporary, file);
  } finally {
    if (descriptor !== null && descriptor !== undefined) fs.closeSync(descriptor);
    fs.rmSync(temporary, { force: true });
  }
}
function openAppendOnly(file) {
  assertPrivateDirectory(state, 'state');
  try {
    const stat = fs.lstatSync(file);
    if (!stat.isFile() || stat.isSymbolicLink()) fail('preview log must be a real owner-controlled file');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const descriptor = fs.openSync(file, fileFlags(fs.constants.O_CREAT | fs.constants.O_APPEND | fs.constants.O_WRONLY), 0o600);
  const stat = fs.fstatSync(descriptor);
  if (!stat.isFile() || (typeof process.getuid === 'function' && stat.uid !== process.getuid())) {
    fs.closeSync(descriptor);
    fail('preview log must be a real owner-controlled file');
  }
  return descriptor;
}
function json(value) { process.stdout.write(`${JSON.stringify(value)}\n`); }
function alive(pid) {
  if (!Number.isInteger(pid) || pid <= 1) return false;
  try { process.kill(pid, 0); return true; } catch (error) { return error.code === 'EPERM'; }
}
function validInfo(pid, info = null) {
  return info
    && info.pid === pid
    && info.root === root
    && /^[a-f0-9]{48}$/.test(info.instance_token || '')
    && ['127.0.0.1', '::1'].includes(info.host)
    && Number.isInteger(info.port)
    && info.port > 0
    && info.port <= 65535;
}
function publicInfo(info) {
  const { instance_token: _instanceToken, ...visible } = info;
  return visible;
}
function readPid() {
  try { const pid = Number(readOwnedFile(pidFile).trim()); return Number.isInteger(pid) ? pid : null; } catch { return null; }
}
function requestIdentity(info, pathname, method = 'GET') {
  return new Promise((resolve) => {
    const request = http.request({
      host: info.host,
      port: info.port,
      path: pathname,
      method,
      headers: { 'X-Spec-First-Instance-Token': info.instance_token },
      timeout: 500,
      agent: false,
    }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        try { resolve({ status: response.statusCode, body: JSON.parse(Buffer.concat(chunks).toString('utf8')) }); } catch { resolve(null); }
      });
    });
    request.on('timeout', () => request.destroy());
    request.on('error', () => resolve(null));
    request.end();
  });
}
async function runningInfo() {
  const pid = readPid();
  if (!alive(pid)) return null;
  try {
    const info = JSON.parse(readOwnedFile(infoFile));
    if (!validInfo(pid, info)) return { unverified: true, pid };
    const identity = await requestIdentity(info, '/.spec-first/identity');
    if (!(identity && identity.status === 200 && identity.body.pid === pid && identity.body.root === root)) return { unverified: true, pid };
    return info;
  } catch { return { unverified: true, pid }; }
}
function realContained(candidate) {
  try {
    const base = fs.realpathSync(screens);
    const resolved = fs.realpathSync(candidate);
    return resolved === base || resolved.startsWith(`${base}${path.sep}`) ? resolved : null;
  } catch { return null; }
}
function contentType(file) {
  return ({ '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' })[path.extname(file).toLowerCase()] || 'application/octet-stream';
}
function responseHeaders(contentTypeValue) {
  return {
    'Content-Type': contentTypeValue,
    'Cache-Control': 'no-store',
    'Content-Security-Policy': "default-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
  };
}
function respond(res, status, body, contentTypeValue = 'text/plain; charset=utf-8') {
  res.writeHead(status, responseHeaders(contentTypeValue));
  res.end(body);
}
function screenCandidates() {
  const candidates = [];
  try {
    for (const name of fs.readdirSync(screens)) {
      const top = path.join(screens, name);
      if (name.endsWith('.html')) { const file = realContained(top); if (file) candidates.push(file); }
      else {
        try {
          if (!fs.statSync(top).isDirectory()) continue;
          for (const child of fs.readdirSync(top).sort()) {
            if (child.endsWith('.html')) { const file = realContained(path.join(top, child)); if (file) candidates.push(file); }
          }
        } catch { continue; }
      }
    }
  } catch { return candidates; }
  return candidates;
}
function newestScreen() {
  try {
    return screenCandidates().map((file) => ({ file, mtime: fs.statSync(file).mtimeMs })).sort((a, b) => b.mtime - a.mtime)[0]?.file || null;
  } catch { return null; }
}
function newestScreenRelativePath() {
  const file = newestScreen();
  if (!file) return null;
  // SUP-12 fix: 返回相对于 screens 目录的路径（不含文件名），用于 <base> 标签
  const rel = path.relative(screens, path.dirname(file));
  return rel ? '/' + rel.replace(/\\/g, '/') + '/' : '/';
}
function render() {
  const file = newestScreen();
  if (!file) return '<!doctype html><html><body><h1>Waiting for a page...</h1></body></html>';
  const html = fs.readFileSync(file, 'utf8');
  // SUP-12 fix: 注入 <base> 标签，让浏览器基于正确的目录解析相对资源
  const basePath = newestScreenRelativePath();
  if (basePath === '/') return html; // 根目录文件不需要 <base>
  // 在 <head> 后或 <html> 后注入 <base href="...">
  const baseTag = `<base href="${basePath}">`;
  if (/<head[\s>]/i.test(html)) {
    return html.replace(/<head([\s>])/i, `<head$1${baseTag}`);
  }
  if (/<html[\s>]/i.test(html)) {
    return html.replace(/<html([\s>])/i, `<html$1${baseTag}`);
  }
  // 没有 <head> 或 <html>，在开头插入
  return baseTag + html;
}
function safeFile(req, res) {
  let requestPath;
  try { requestPath = decodeURIComponent(req.url.split('?')[0].split('#')[0]).replace(/^\/+/, ''); } catch { respond(res, 400, 'Bad request'); return; }
  const file = realContained(path.resolve(screens, requestPath));
  try {
    if (!file || !fs.statSync(file).isFile()) { respond(res, 404, 'Not found'); return; }
  } catch {
    respond(res, 404, 'Not found'); return;
  }
  res.writeHead(200, responseHeaders(contentType(file)));
  res.end(fs.readFileSync(file));
}
function serve() {
  ensureDirs();
  let touched = Date.now();
  const server = http.createServer((req, res) => {
    const pathname = req.url.split('?')[0].split('#')[0];
    const authenticated = req.headers['x-spec-first-instance-token'] === instanceToken;
    if (pathname === '/.spec-first/identity' && req.method === 'GET' && authenticated) {
      respond(res, 200, `${JSON.stringify({ status: 'running', root, pid: process.pid })}\n`, 'application/json; charset=utf-8');
      return;
    }
    if (pathname === '/.spec-first/stop' && req.method === 'POST' && authenticated) {
      res.setHeader('Connection', 'close');
      res.shouldKeepAlive = false;
      res.on('finish', () => {
        server.close(() => process.exit(0));
        if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
      });
      respond(res, 200, `${JSON.stringify({ status: 'stopping', root, pid: process.pid })}\n`, 'application/json; charset=utf-8');
      return;
    }
    if (req.method !== 'GET') { respond(res, 404, 'Not found'); return; }
    touched = Date.now();
    if (pathname === '/') { res.writeHead(200, responseHeaders('text/html; charset=utf-8')); res.end(render()); return; }
    if (pathname === '/version') { res.writeHead(200, responseHeaders('application/json; charset=utf-8')); res.end(JSON.stringify({ screen: newestScreen() ? path.basename(newestScreen()) : null }) + '\n'); return; }
    safeFile(req, res);
  });
  server.listen(port, host, () => {
    const actualPort = server.address().port;
    const address = host === '::1' ? '[::1]' : host;
    const info = { status: 'running', root, host, port: actualPort, url: `http://${address}:${actualPort}`, pid: process.pid, owner_pid: ownerPid, instance_token: instanceToken };
    writeAtomic(pidFile, `${process.pid}\n`);
    writeAtomic(infoFile, `${JSON.stringify(info, null, 2)}\n`);
    process.stdout.write(`${JSON.stringify(publicInfo(info))}\n`);
  });
  const timer = setInterval(() => {
    if ((ownerPid && !alive(ownerPid)) || Date.now() - touched > idleMs) server.close(() => process.exit(0));
  }, checkMs);
  timer.unref();
  process.on('exit', () => {
    try {
      if (fs.readFileSync(pidFile, 'utf8').trim() !== String(process.pid)) return;
      const recorded = JSON.parse(fs.readFileSync(infoFile, 'utf8'));
      if (recorded.instance_token !== instanceToken || recorded.pid !== process.pid) return;
      fs.rmSync(pidFile, { force: true }); fs.rmSync(infoFile, { force: true });
    } catch {}
  });
}
async function start() {
  ensureDirs();
  const existing = await runningInfo();
  if (existing && existing.unverified) { json({ status: 'blocked', reason_code: 'preview-process-identity-unverified', root, pid: existing.pid }); process.exitCode = 2; return; }
  if (existing) { json({ ...publicInfo(existing), status: 'running' }); return; }
  if (foreground) { serve(); return; }
  const log = openAppendOnly(path.join(state, 'server.log'));
  const child = spawn(process.execPath, [scriptPath, 'serve', '--root', root, '--host', host, '--port', String(port), '--instance-token', instanceToken, ...(ownerPid ? ['--owner-pid', String(ownerPid)] : [])], { detached: true, stdio: ['ignore', log, log] });
  child.unref(); fs.closeSync(log);
  for (let i = 0; i < 100; i += 1) { const info = await runningInfo(); if (info && !info.unverified) { json({ ...publicInfo(info), status: 'started' }); return; } await new Promise((resolve) => setTimeout(resolve, 50)); }
  fail(`server failed to start; see ${path.join(state, 'server.log')}`);
}
async function stop() {
  ensureDirs();
  const pid = readPid();
  if (!alive(pid)) { fs.rmSync(pidFile, { force: true }); fs.rmSync(infoFile, { force: true }); json({ status: 'stopped', root }); return; }
  let info;
  try { info = JSON.parse(readOwnedFile(infoFile)); } catch { info = null; }
  const probe = await runningInfo();
  if (!validInfo(pid, info) || !probe || probe.unverified) {
    json({ status: 'blocked', reason_code: 'preview-process-identity-unverified', root, pid });
    process.exitCode = 2;
    return;
  }
  const result = await requestIdentity(info, '/.spec-first/stop', 'POST');
  if (!result || result.status !== 200 || result.body.pid !== pid || result.body.root !== root) {
    json({ status: 'blocked', reason_code: 'preview-process-identity-unverified', root, pid });
    process.exitCode = 2;
    return;
  }
  let stillServing = true;
  for (let i = 0; i < 20 && stillServing; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    stillServing = Boolean(await requestIdentity(info, '/.spec-first/identity'));
  }
  if (stillServing) {
    json({ status: 'blocked', reason_code: 'preview-stop-timeout', root, pid });
    process.exitCode = 2;
    return;
  }
  fs.rmSync(pidFile, { force: true }); fs.rmSync(infoFile, { force: true }); json({ status: 'stopped', root });
}
if (command === 'start') start().catch((error) => fail(error.message));
else if (command === 'serve') serve();
else if (command === 'status') { ensureDirs(); runningInfo().then((info) => { if (info && info.unverified) { json({ status: 'blocked', reason_code: 'preview-process-identity-unverified', root, pid: info.pid }); process.exitCode = 2; return; } json(info ? { ...publicInfo(info), status: 'running' } : { status: 'stopped', root }); }).catch((error) => fail(error.message)); }
else if (command === 'stop') stop().catch((error) => fail(error.message));
else fail('usage: light-webserver.js start|status|stop --root <dir>');
