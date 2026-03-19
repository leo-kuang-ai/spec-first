#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process';
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  statSync,
  unlinkSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';

const DEFAULT_HOST = process.env.SPEC_FIRST_VIEWER_HOST ?? '127.0.0.1';
const DEFAULT_PORT = parsePort(process.env.SPEC_FIRST_VIEWER_PORT, null);

function parsePort(value, fallback) {
  const port = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isInteger(port) || port < 0) {
    return fallback;
  }
  return port;
}

function parseArgs(argv) {
  const args = {
    port: DEFAULT_PORT,
    host: DEFAULT_HOST,
    open: false,
    printUrl: false,
    projectRoot: process.cwd(),
    source: 'manual',
  };

  for (let index = 2; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === '--port' && argv[index + 1]) {
      args.port = parsePort(argv[index + 1], args.port);
      index += 1;
      continue;
    }
    if (item === '--host' && argv[index + 1]) {
      args.host = argv[index + 1];
      index += 1;
      continue;
    }
    if (item === '--project-root' && argv[index + 1]) {
      args.projectRoot = argv[index + 1];
      index += 1;
      continue;
    }
    if (item === '--source' && argv[index + 1]) {
      args.source = argv[index + 1];
      index += 1;
      continue;
    }
    if (item === '--open') {
      args.open = true;
      continue;
    }
    if (item === '--print-url') {
      args.printUrl = true;
    }
  }

  return args;
}

function findProjectRoot(startDir) {
  let current = resolve(startDir);
  while (true) {
    if (existsSync(join(current, '.spec-first')) && existsSync(join(current, 'specs'))) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

function getRuntimePaths(projectRoot) {
  const runtimeDir = join(projectRoot, '.spec-first', 'runtime');
  return {
    runtimeDir,
    stateFile: join(runtimeDir, 'viewer-state.json'),
    lockFile: join(runtimeDir, 'viewer.lock'),
  };
}

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

function isPortOpen(host, port, timeoutMs = 450) {
  return new Promise((resolvePromise) => {
    const socket = new net.Socket();
    let resolved = false;

    const done = (value) => {
      if (resolved) return;
      resolved = true;
      socket.destroy();
      resolvePromise(value);
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
    socket.connect(port, host);
  });
}

function openBrowser(url) {
  // Use python webbrowser module (same as serena) — reliable across all environments
  // including Claude hook subprocess chains where macOS 'open' command fails silently.
  // IMPORTANT: Use spawnSync to ensure browser is actually opened before parent exits.
  // spawn + unref() can cause the subprocess to be terminated before browser launches.
  try {
    spawnSync('python3', ['-c', `import webbrowser; webbrowser.open(${JSON.stringify(url)})`], {
      stdio: ['ignore', 'ignore', 'ignore'],
      timeout: 5000, // 5 second timeout to prevent hanging
    });
  } catch {
    // Silently ignore errors - browser opening is best-effort
  }
}

function launchServer(projectRoot, host, port, stateFile, source) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const serverPath = join(__dirname, 'server.js');

  const child = spawn(
    process.execPath,
    [
      serverPath,
      '--host',
      host,
      '--port',
      String(port),
      '--project-root',
      projectRoot,
      '--state-file',
      stateFile,
      '--source',
      source,
    ],
    {
      cwd: projectRoot,
      detached: true,
      stdio: 'ignore',
      env: {
        ...process.env,
        SPEC_FIRST_VIEWER_PORT: String(port),
        SPEC_FIRST_VIEWER_HOST: host,
        SPEC_FIRST_VIEWER_SOURCE: source,
      },
    },
  );
  child.unref();
}

async function isStateHealthy(state, projectRoot) {
  if (!state || typeof state !== 'object') return false;
  if (state.projectRoot !== projectRoot) return false;
  if (typeof state.host !== 'string' || !state.host) return false;
  if (!Number.isInteger(state.port) || state.port <= 0) return false;
  return isPortOpen(state.host, state.port);
}

async function waitForStateFile(stateFile, projectRoot, host, retries = 40, intervalMs = 120) {
  for (let index = 0; index < retries; index += 1) {
    const state = readJson(stateFile);
    if (state && state.projectRoot === projectRoot && state.host === host && Number.isInteger(state.port) && state.port > 0) {
      const ready = await isPortOpen(state.host, state.port);
      if (ready) {
        return state;
      }
    }
    await sleep(intervalMs);
  }
  return null;
}

async function acquireLock(lockFile, timeoutMs = 4000, staleMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const fd = openSync(lockFile, 'wx');
      return fd;
    } catch (error) {
      const err = error;
      if (err?.code !== 'EEXIST') {
        throw error;
      }

      try {
        const stat = statSync(lockFile);
        if (Date.now() - stat.mtimeMs > staleMs) {
          unlinkSync(lockFile);
          continue;
        }
      } catch {
        // lock file disappeared, retry immediately
        continue;
      }

      await sleep(120);
    }
  }

  throw new Error(`failed to acquire lock: ${lockFile}`);
}

function releaseLock(fd, lockFile) {
  try {
    closeSync(fd);
  } catch {
    // ignore
  }
  try {
    unlinkSync(lockFile);
  } catch {
    // ignore
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const projectRoot = findProjectRoot(args.projectRoot);
  if (!projectRoot) {
    return;
  }

  const runtime = getRuntimePaths(projectRoot);
  mkdirSync(runtime.runtimeDir, { recursive: true });

  let lockFd = null;
  let activeState = null;

  try {
    lockFd = await acquireLock(runtime.lockFile);

    const state = readJson(runtime.stateFile);
    if (await isStateHealthy(state, projectRoot)) {
      activeState = state;
    } else {
      const preferredPort = Number.isInteger(args.port) ? args.port : 0;
      launchServer(projectRoot, args.host, preferredPort, runtime.stateFile, args.source);

      activeState = await waitForStateFile(runtime.stateFile, projectRoot, args.host);
      if (!activeState && preferredPort > 0 && (await isPortOpen(args.host, preferredPort))) {
        activeState = {
          host: args.host,
          port: preferredPort,
          url: `http://${args.host}:${preferredPort}`,
          projectRoot,
        };
      }
    }
  } finally {
    if (lockFd !== null) {
      releaseLock(lockFd, runtime.lockFile);
    }
  }

  if (!activeState) {
    return;
  }

  const url = activeState.url ?? `http://${activeState.host}:${activeState.port}`;
  const shouldOpenBrowser = args.open || process.env.SPEC_FIRST_VIEWER_AUTO_OPEN === '1';

  if (args.printUrl) {
    process.stdout.write(`${url}\n`);
  }

  if (shouldOpenBrowser) {
    openBrowser(url);
  }
}

main().catch(() => process.exit(0));
