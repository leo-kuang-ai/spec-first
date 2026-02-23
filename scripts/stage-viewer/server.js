#!/usr/bin/env node

import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_HOST = process.env.SPEC_FIRST_VIEWER_HOST ?? '127.0.0.1';
const DEFAULT_PORT = parsePort(process.env.SPEC_FIRST_VIEWER_PORT, 0);

function parsePort(value, fallback) {
  const port = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isInteger(port) || port < 0) {
    return fallback;
  }
  return port;
}

function parseArgs(argv) {
  const args = {
    host: DEFAULT_HOST,
    port: DEFAULT_PORT,
    projectRoot: process.cwd(),
    stateFile: null,
    source: process.env.SPEC_FIRST_VIEWER_SOURCE ?? 'manual',
  };

  for (let index = 2; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === '--host' && argv[index + 1]) {
      args.host = argv[index + 1];
      index += 1;
      continue;
    }
    if (item === '--port' && argv[index + 1]) {
      args.port = parsePort(argv[index + 1], args.port);
      index += 1;
      continue;
    }
    if (item === '--project-root' && argv[index + 1]) {
      args.projectRoot = argv[index + 1];
      index += 1;
      continue;
    }
    if (item === '--state-file' && argv[index + 1]) {
      args.stateFile = argv[index + 1];
      index += 1;
      continue;
    }
    if (item === '--source' && argv[index + 1]) {
      args.source = argv[index + 1];
      index += 1;
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
    if (parent === current) return resolve(startDir);
    current = parent;
  }
}

function safeReadJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function listFeatures(projectRoot) {
  const specsDir = join(projectRoot, 'specs');
  if (!existsSync(specsDir)) return [];

  const result = [];
  for (const entry of readdirSync(specsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const featureId = entry.name;
    const statePath = join(specsDir, featureId, 'stage-state.json');
    if (!existsSync(statePath)) continue;
    const state = safeReadJson(statePath);
    if (!state) continue;

    result.push({
      featureId,
      title: state.title ?? '',
      currentStage: state.currentStage ?? 'unknown',
      mode: state.mode ?? '',
      size: state.size ?? '',
      platforms: Array.isArray(state.platforms) ? state.platforms : [],
      terminal: Boolean(state.terminal),
      updatedAt: state.updatedAt ?? '',
      createdAt: state.createdAt ?? '',
    });
  }

  return result.sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)));
}

function loadFeature(projectRoot, featureId) {
  const statePath = join(projectRoot, 'specs', featureId, 'stage-state.json');
  if (!existsSync(statePath)) return null;
  return safeReadJson(statePath);
}

function sendJson(res, code, data) {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(data));
}

function writeStateFile(stateFilePath, state) {
  mkdirSync(dirname(stateFilePath), { recursive: true });
  writeFileSync(stateFilePath, `${JSON.stringify(state, null, 2)}\n`, 'utf-8');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const indexHtmlPath = join(__dirname, 'index.html');
const args = parseArgs(process.argv);
const projectRoot = findProjectRoot(args.projectRoot);
const runtimeStateFile = args.stateFile ?? join(projectRoot, '.spec-first', 'runtime', 'viewer-state.json');

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');

  if (url.pathname === '/health') {
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : args.port;
    sendJson(res, 200, {
      ok: true,
      projectRoot,
      host: args.host,
      port,
      url: `http://${args.host}:${port}`,
      pid: process.pid,
      source: args.source,
    });
    return;
  }

  if (url.pathname === '/api/features') {
    sendJson(res, 200, {
      projectRoot,
      features: listFeatures(projectRoot),
      now: new Date().toISOString(),
    });
    return;
  }

  if (url.pathname.startsWith('/api/feature/')) {
    const featureId = decodeURIComponent(url.pathname.replace('/api/feature/', ''));
    const state = loadFeature(projectRoot, featureId);
    if (!state) {
      sendJson(res, 404, { error: `feature not found: ${featureId}` });
      return;
    }
    sendJson(res, 200, {
      projectRoot,
      featureId,
      state,
      now: new Date().toISOString(),
    });
    return;
  }

  if (url.pathname === '/' || url.pathname === '/index.html') {
    if (!existsSync(indexHtmlPath)) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('stage viewer index.html missing');
      return;
    }
    const html = readFileSync(indexHtmlPath, 'utf-8');
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.end(html);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
});

server.listen(args.port, args.host, () => {
  const address = server.address();
  const actualPort = typeof address === 'object' && address ? address.port : args.port;
  const startedAt = new Date().toISOString();
  const state = {
    host: args.host,
    port: actualPort,
    url: `http://${args.host}:${actualPort}`,
    pid: process.pid,
    source: args.source,
    projectRoot,
    stateFile: runtimeStateFile,
    startedAt,
    updatedAt: startedAt,
  };

  writeStateFile(runtimeStateFile, state);

  console.log(`[spec-first-stage-viewer] listening on ${state.url}`);
  console.log(`[spec-first-stage-viewer] projectRoot=${projectRoot}`);
  console.log(`[spec-first-stage-viewer] stateFile=${runtimeStateFile}`);
});
