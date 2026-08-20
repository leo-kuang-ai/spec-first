'use strict';

const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawn, spawnSync } = require('node:child_process');

const server = path.resolve('skills/spec-prototype/scripts/light-webserver.js');

function run(args, cwd) {
  return execFileSync(process.execPath, [server, ...args], { cwd, encoding: 'utf8' });
}

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body: Buffer.concat(chunks).toString('utf8') }));
    }).on('error', reject);
  });
}

describe('spec-prototype preview lifecycle', () => {
  test('starts, serves the newest screen, rejects traversal, and stops cleanly', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-prototype-'));
    fs.mkdirSync(path.join(root, 'screens'));
    fs.writeFileSync(path.join(root, 'screens', 'screen.html'), '<!doctype html><title>prototype</title>');
    fs.symlinkSync('/etc/passwd', path.join(root, 'screens', 'escape.txt'));
    try {
      const info = JSON.parse(run(['start', '--root', root], root));
      expect(info.status).toBe('started');
      const page = await get(info.url);
      expect(page.status).toBe(200);
      expect(page.body).toContain('prototype');
      expect(page.headers['content-security-policy']).toContain("connect-src 'self'");
      expect(page.headers['content-security-policy']).toContain("object-src 'none'");
      expect(page.headers['referrer-policy']).toBe('no-referrer');
      const traversal = await get(`${info.url}/%2e%2e/%2e%2e/etc/passwd`);
      expect(traversal.status).toBe(404);
      const symlink = await get(`${info.url}/escape.txt`);
      expect(symlink.status).toBe(404);
      expect(JSON.parse(run(['status', '--root', root])).status).toBe('running');
      expect(JSON.parse(run(['stop', '--root', root])).status).toBe('stopped');
      expect(JSON.parse(run(['status', '--root', root])).status).toBe('stopped');
    } finally {
      try { run(['stop', '--root', root], root); } catch {}
      fs.rmSync(root, { recursive: true, force: true });
    }
  }, 15000);

  test('unattended callers do not get a running server from the contract', () => {
    const skill = fs.readFileSync('skills/spec-prototype/SKILL.md', 'utf8');
    expect(skill).toContain('blocked-human-experience-required');
    expect(skill).toMatch(/unattended\/pipeline mode/i);
  });

  test('rejects non-loopback binding and fails closed on an unverified live PID', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-prototype-security-'));
    fs.mkdirSync(path.join(root, 'state'), { recursive: true });
    const rejected = spawnSync(process.execPath, [server, 'start', '--root', root, '--host', '0.0.0.0'], {
      encoding: 'utf8',
    });
    expect(rejected.status).not.toBe(0);
    expect(rejected.stderr).toContain('explicit loopback');

    const unrelated = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
    try {
      fs.writeFileSync(path.join(root, 'state', 'server.pid'), `${unrelated.pid}\n`);
      fs.writeFileSync(path.join(root, 'state', 'display-info.json'), JSON.stringify({
        pid: unrelated.pid,
        root,
        instance_token: 'a'.repeat(48),
      }));
      const stop = spawnSync(process.execPath, [server, 'stop', '--root', root], { encoding: 'utf8' });
      expect(stop.status).toBe(2);
      expect(JSON.parse(stop.stdout)).toEqual(expect.objectContaining({
        status: 'blocked',
        reason_code: 'preview-process-identity-unverified',
      }));
      expect(() => process.kill(unrelated.pid, 0)).not.toThrow();
    } finally {
      unrelated.kill();
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('rejects screens and state directory symlinks before writing or serving', () => {
    for (const directory of ['screens', 'state']) {
      const root = fs.mkdtempSync(path.join(os.tmpdir(), `spec-prototype-${directory}-symlink-`));
      const outside = fs.mkdtempSync(path.join(os.tmpdir(), `spec-prototype-${directory}-outside-`));
      fs.symlinkSync(outside, path.join(root, directory), 'dir');
      if (directory === 'screens') fs.writeFileSync(path.join(outside, 'outside.html'), '<title>outside</title>');
      try {
        const result = spawnSync(process.execPath, [server, 'start', '--root', root], { encoding: 'utf8' });
        expect(result.status).not.toBe(0);
        expect(result.stderr).toContain(`preview ${directory} directory must be a real owner-controlled directory`);
        expect(fs.existsSync(path.join(outside, 'server.pid'))).toBe(false);
        expect(fs.existsSync(path.join(outside, 'display-info.json'))).toBe(false);
      } finally {
        fs.rmSync(root, { recursive: true, force: true });
        fs.rmSync(outside, { recursive: true, force: true });
      }
    }
  });

  test('uses token-bound HTTP identity when ps is unavailable', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-prototype-no-ps-'));
    let pid = null;
    try {
      const started = spawnSync(process.execPath, [server, 'start', '--root', root], {
        encoding: 'utf8',
        env: { ...process.env, PATH: '' },
        timeout: 10000,
      });
      expect(started.status).toBe(0);
      expect(JSON.parse(started.stdout).status).toBe('started');
      pid = Number(fs.readFileSync(path.join(root, 'state', 'server.pid'), 'utf8').trim());
      const stopped = spawnSync(process.execPath, [server, 'stop', '--root', root], {
        encoding: 'utf8',
        env: { ...process.env, PATH: '' },
        timeout: 10000,
      });
      expect(stopped.status).toBe(0);
      expect(JSON.parse(stopped.stdout).status).toBe('stopped');
      pid = null;
    } finally {
      if (pid) { try { process.kill(pid); } catch {} }
      fs.rmSync(root, { recursive: true, force: true });
    }
  }, 20000);
});
