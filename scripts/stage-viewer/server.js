#!/usr/bin/env node

import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDefaultMetrics, calcHealthScore } from './health-utils.js';
import { parseTaskPlan, normalizeTaskStatus } from './task-parser.js';
import { STAGE_ORDER, STAGE_NAMES } from './stage-constants.js';

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

// ─── Security: featureId 校验 ─────────────────────────────────────────────
// FSREQ-YYYY-MM-DD-XXX 格式或纯字母数字下划线短横线
const FEATURE_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

/**
 * 安全地提取并校验 featureId
 * @param {string} raw - 从 URL 解析的原始字符串
 * @returns {string|null} 校验通过的 featureId，或 null（校验失败）
 */
function sanitizeFeatureId(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const decoded = decodeURIComponent(raw);
  if (!FEATURE_ID_PATTERN.test(decoded)) return null;
  // 额外检查：拒绝包含路径遍历模式的字符串
  if (decoded.includes('..') || decoded.includes('/') || decoded.includes('\\')) {
    return null;
  }
  return decoded;
}

// ─── Metrics API ─────────────────────────────────────────────────────

// metricTargets 由 getRealtimeGateStatus() 从核心 evaluator 获取，不再本地维护

function getMetrics(projectRoot, featureId) {
  // 先校验 featureId 格式（防御命令注入）
  if (!FEATURE_ID_PATTERN.test(featureId)) {
    return getDefaultMetrics(featureId, projectRoot);
  }

  return getDefaultMetrics(featureId, projectRoot);
}


function getDefectStats(projectRoot, featureId) {
  const defectsDir = join(projectRoot, 'specs', featureId, 'defects');
  const stats = { total: 0, S1: 0, S2: 0, S3: 0, S4: 0, open: 0, fixing: 0, fixed: 0 };

  if (!existsSync(defectsDir)) return stats;

  for (const entry of readdirSync(defectsDir)) {
    if (!entry.endsWith('.json')) continue;
    const defect = safeReadJson(join(defectsDir, entry));
    if (!defect) continue;

    stats.total += 1;
    if (defect.severity && stats[defect.severity] !== undefined) {
      stats[defect.severity] += 1;
    }
    const status = defect.status?.toLowerCase().trim();
    if (status === 'open') stats.open += 1;
    else if (status === 'fixing') stats.fixing += 1;
    else if (status === 'fixed' || status === 'verified') stats.fixed += 1;
  }

  return stats;
}

function getDefects(projectRoot, featureId) {
  const defectsDir = join(projectRoot, 'specs', featureId, 'defects');
  const defects = [];

  if (!existsSync(defectsDir)) return defects;

  for (const entry of readdirSync(defectsDir)) {
    if (!entry.endsWith('.json')) continue;
    const defect = safeReadJson(join(defectsDir, entry));
    if (!defect) continue;

    defects.push({
      seq: defect.seq,
      severity: defect.severity,
      title: defect.title,
      description: defect.description,
      status: defect.status,
      reporter: defect.reporter,
      discoveredIn: defect.discoveredIn,
      createdAt: defect.createdAt,
      updatedAt: defect.updatedAt,
    });
  }

  // 按严重级别排序，然后按序号排序
  const severityOrder = { S1: 1, S2: 2, S3: 3, S4: 4 };
  defects.sort((a, b) => {
    const sevA = severityOrder[a.severity] || 5;
    const sevB = severityOrder[b.severity] || 5;
    if (sevA !== sevB) return sevA - sevB;
    return (a.seq || 0) - (b.seq || 0);
  });

  return defects;
}

// ─── Gate Status API ─────────────────────────────────────────────────

// 从历史快照读取（fallback + 历史聚合用）
function getGateStatusFromHistory(projectRoot, featureId) {
  const historyPath = join(projectRoot, 'specs', featureId, 'gate-history.jsonl');
  if (!existsSync(historyPath)) {
    return { currentStage: null, status: null, conditions: [], effectiveGates: [], warnings: [], statusSummary: { status: null, blockingCount: 0, warningCount: 0 }, lastCheck: null };
  }

  try {
    const content = readFileSync(historyPath, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    if (lines.length === 0) {
      return { currentStage: null, status: null, conditions: [], effectiveGates: [], warnings: [], statusSummary: { status: null, blockingCount: 0, warningCount: 0 }, lastCheck: null };
    }

    const lastEntry = JSON.parse(lines[lines.length - 1]);
    const conditions = (lastEntry.conditions || []).map(c => ({
      id: c.id,
      description: c.description,
      status: c.status,
      detail: c.detail,
      blocking: c.blocking !== false,
    }));
    const effectiveGates = conditions.filter(c => c.blocking !== false);
    const warnings = conditions.filter(c => c.status === 'FAIL' && c.blocking === false);

    return {
      currentStage: lastEntry.stage || null,
      status: lastEntry.status || null,
      conditions,
      effectiveGates,
      warnings,
      statusSummary: {
        status: lastEntry.status || null,
        blockingCount: effectiveGates.filter(c => c.status === 'FAIL').length,
        warningCount: warnings.length,
      },
      lastCheck: lastEntry.timestamp || null,
    };
  } catch {
    return { currentStage: null, status: null, conditions: [], effectiveGates: [], warnings: [], statusSummary: { status: null, blockingCount: 0, warningCount: 0 }, lastCheck: null };
  }
}

// 实时 Gate 评估：通过 CLI subprocess 调用核心 evaluator，带缓存
const gateCache = new Map();
const GATE_CACHE_TTL = 30000; // 30s

function getRealtimeGateStatus(projectRoot, featureId) {
  const cacheKey = `gate:${featureId}`;
  const cached = gateCache.get(cacheKey);
  if (cached && Date.now() - cached.time < GATE_CACHE_TTL) {
    return cached.data;
  }

  const cliPath = join(projectRoot, 'dist/cli/index.js');
  if (!existsSync(cliPath)) {
    // 未构建，fallback 到历史快照
    return getGateStatusFromHistory(projectRoot, featureId);
  }

  try {
    const output = execFileSync('node', [cliPath, 'gate', 'check', featureId, '--json', '--no-persist'], {
      cwd: projectRoot,
      encoding: 'utf-8',
      timeout: 15000,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const result = JSON.parse(output);
    const data = {
      currentStage: result.stage,
      status: result.status,
      conditions: result.conditions || [],
      effectiveGates: result.effectiveGates || [],
      warnings: result.warnings || [],
      statusSummary: result.statusSummary || { status: result.status, blockingCount: 0, warningCount: 0 },
      metricTargets: result.metricTargets || {},
      lastCheck: result.timestamp,
    };
    gateCache.set(cacheKey, { time: Date.now(), data });
    return data;
  } catch {
    // CLI 失败，fallback 到历史快照
    return getGateStatusFromHistory(projectRoot, featureId);
  }
}

// 获取所有阶段的历史 Gate 状态
function getAllStageGateStatus(projectRoot, featureId) {
  const historyPath = join(projectRoot, 'specs', featureId, 'gate-history.jsonl');
  const stageStatus = {};

  if (!existsSync(historyPath)) {
    return stageStatus;
  }

  try {
    const content = readFileSync(historyPath, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);

    // 从最新到最旧遍历，保留每个阶段最新的状态
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const entry = JSON.parse(lines[i]);
        const stage = entry.stage;
        if (stage && !stageStatus[stage]) {
          // 支持 status 和 verdict 两种格式
          const status = entry.status || entry.verdict || 'UNKNOWN';
          const conditions = entry.conditions || [];
          stageStatus[stage] = {
            status,
            timestamp: entry.timestamp || null,
            conditions,
            passCount: conditions.filter(c => c.status === 'PASS').length || (status === 'PASS' ? 1 : 0),
            totalCount: conditions.length || 1,
          };
        }
      } catch {
        // 跳过损坏行
      }
    }
  } catch {
    // 忽略读取错误
  }

  return stageStatus;
}

// ─── Timeline API ──────────────────────────────────────────────────────

function getTimelineData(projectRoot, featureId) {
  const historyPath = join(projectRoot, 'specs', featureId, 'gate-history.jsonl');
  if (!existsSync(historyPath)) {
    return { stages: [], totalDuration: 0 };
  }

  try {
    const content = readFileSync(historyPath, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    if (lines.length === 0) {
      return { stages: [], totalDuration: 0 };
    }

    // 解析所有 Gate 事件
    const events = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);

    // 按时间排序
    events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // 计算每个阶段的时间
    const stageTimeline = [];

    // 按阶段分组，优先用 stage_advance 的 to 时间作为进入时间（更准确）
    const stageEntries = {};

    // 先从 stage_advance 事件提取阶段进入时间
    for (const event of events) {
      if (event.event === 'stage_advance' && event.to && !stageEntries[event.to]) {
        stageEntries[event.to] = {
          stage: event.to,
          stageName: STAGE_NAMES[event.to] || event.to,
          startTime: event.timestamp,
          status: 'PASS',
          conditions: []
        };
      }
    }

    // 再从 gate_eval 事件补充（stage_advance 未覆盖的阶段，如初始阶段）
    for (const event of events) {
      if (event.stage && !stageEntries[event.stage]) {
        stageEntries[event.stage] = {
          stage: event.stage,
          stageName: STAGE_NAMES[event.stage] || event.stage,
          startTime: event.timestamp,
          status: event.status || 'UNKNOWN',
          conditions: event.conditions || []
        };
      }
    }

    // 按预定义顺序构建时间线
    for (const stage of STAGE_ORDER) {
      if (stageEntries[stage]) {
        stageTimeline.push(stageEntries[stage]);
      }
    }

    // 计算每个阶段的持续时间
    // 判断 Feature 是否已到达终态
    const lastAdvance = [...events].reverse().find(e => e.event === 'stage_advance');
    const featureTerminal = lastAdvance && (lastAdvance.to === '08_done' || lastAdvance.to === '09_cancelled');

    let totalDuration = 0;
    for (let i = 0; i < stageTimeline.length; i++) {
      const current = stageTimeline[i];
      const startTime = new Date(current.startTime);
      const isTerminal = current.stage === '08_done' || current.stage === '09_cancelled';

      let endTime;
      if (isTerminal) {
        // 终态阶段持续时间为 0
        endTime = startTime;
      } else if (i < stageTimeline.length - 1) {
        endTime = new Date(stageTimeline[i + 1].startTime);
      } else if (featureTerminal) {
        // Feature 已完成，但该阶段是 timeline 最后一项（缺少终态 gate_eval）
        // 使用终态 advance 事件的时间
        endTime = new Date(lastAdvance.timestamp);
      } else {
        // 非终态的最后阶段且 Feature 仍在进行中：计算到当前时间
        endTime = new Date();
      }

      const durationMs = endTime - startTime;
      const durationHours = Math.round(durationMs / (1000 * 60 * 60) * 10) / 10;
      const durationDays = Math.round(durationMs / (1000 * 60 * 60 * 24) * 10) / 10;

      current.durationMs = durationMs;
      current.durationHours = durationHours;
      current.durationDays = durationDays;
      current.endTime = endTime.toISOString();

      totalDuration += durationMs;
    }

    // 计算总时长
    const totalHours = Math.round(totalDuration / (1000 * 60 * 60) * 10) / 10;
    const totalDays = Math.round(totalDuration / (1000 * 60 * 60 * 24) * 10) / 10;

    return {
      stages: stageTimeline,
      totalDuration,
      totalHours,
      totalDays,
      startTime: stageTimeline.length > 0 ? stageTimeline[0].startTime : null,
      endTime: stageTimeline.length > 0 ? stageTimeline[stageTimeline.length - 1].endTime : null
    };
  } catch {
    return { stages: [], totalDuration: 0 };
  }
}

// ─── Tasks API ──────────────────────────────────────────────────────
// parseTaskPlan 和 normalizeTaskStatus 已移至 task-parser.js

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


  // Timeline API - 必须在 feature 详情路由之前匹配
  if (url.pathname.match(/^\/api\/feature\/[^/]+\/timeline$/)) {
    const rawFeatureId = url.pathname.split('/')[3];
    const featureId = sanitizeFeatureId(rawFeatureId);
    if (!featureId) {
      sendJson(res, 400, { error: 'Invalid feature ID' });
      return;
    }
    const timeline = getTimelineData(projectRoot, featureId);

    sendJson(res, 200, {
      featureId,
      ...timeline,
      now: new Date().toISOString(),
    });
    return;
  }

  // Defects API - 必须在 feature 详情路由之前匹配
  if (url.pathname.match(/^\/api\/feature\/[^/]+\/defects$/)) {
    const rawFeatureId = url.pathname.split('/')[3];
    const featureId = sanitizeFeatureId(rawFeatureId);
    if (!featureId) {
      sendJson(res, 400, { error: 'Invalid feature ID' });
      return;
    }
    const stats = getDefectStats(projectRoot, featureId);
    const defects = getDefects(projectRoot, featureId);

    sendJson(res, 200, {
      featureId,
      stats,
      defects,
      now: new Date().toISOString(),
    });
    return;
  }

  // Tasks API - 必须在 feature 详情路由之前匹配
  if (url.pathname.match(/^\/api\/feature\/[^/]+\/tasks$/)) {
    const rawFeatureId = url.pathname.split('/')[3];
    const featureId = sanitizeFeatureId(rawFeatureId);
    if (!featureId) {
      sendJson(res, 400, { error: 'Invalid feature ID' });
      return;
    }
    const taskData = parseTaskPlan(projectRoot, featureId);

    if (!taskData) {
      sendJson(res, 200, {
        featureId,
        phases: [],
        tasks: [],
        stats: { total: 0, completed: 0, inProgress: 0, pending: 0, progress: 0 },
        currentTasks: [],
        now: new Date().toISOString(),
      });
      return;
    }

    sendJson(res, 200, {
      featureId,
      phases: taskData.phases,
      tasks: taskData.tasks,
      stats: taskData.stats,
      currentTasks: taskData.currentTasks,
      now: new Date().toISOString(),
    });
    return;
  }

  // Gate Status API - 必须在 feature 详情路由之前匹配
  if (url.pathname.match(/^\/api\/feature\/[^/]+\/gate-status$/)) {
    const rawFeatureId = url.pathname.split('/')[3];
    const featureId = sanitizeFeatureId(rawFeatureId);
    if (!featureId) {
      sendJson(res, 400, { error: 'Invalid feature ID' });
      return;
    }
    const currentGate = getRealtimeGateStatus(projectRoot, featureId);
    const allStageGates = getAllStageGateStatus(projectRoot, featureId);

    sendJson(res, 200, {
      featureId,
      current: currentGate,
      stages: allStageGates,
      now: new Date().toISOString(),
    });
    return;
  }

  if (url.pathname.startsWith('/api/feature/') && url.pathname.endsWith('/metrics')) {
    const rawFeatureId = url.pathname.replace('/api/feature/', '').replace('/metrics', '');
    const featureId = sanitizeFeatureId(rawFeatureId);
    if (!featureId) {
      sendJson(res, 400, { error: 'Invalid feature ID' });
      return;
    }
    const state = loadFeature(projectRoot, featureId);
    if (!state) {
      sendJson(res, 404, { error: `feature not found: ${featureId}` });
      return;
    }
    const coverage = getMetrics(projectRoot, featureId);
    const health = calcHealthScore(coverage, 0);
    const profile = state.mergedRules?.profile ?? 'default-simplified';
    const currentStage = state.currentStage;
    // metricTargets 从实时 Gate 评估结果获取（核心真源）
    const gateResult = getRealtimeGateStatus(projectRoot, featureId);
    let metricTargets = gateResult.metricTargets || {};

    // 终态阶段 fallback：所有核心指标标记为已达标
    const isTerminal = currentStage === '08_done' || currentStage === '09_cancelled';
    if (isTerminal && Object.keys(metricTargets).length === 0) {
      metricTargets = { C3: 1.0, C4: 0.8, C6: 1.0, C8: 1.0, C9: 1.0 };
    }

    sendJson(res, 200, {
      coverage,
      health,
      profile,
      currentStage,
      metricTargets,
    });
    return;
  }

  if (url.pathname.startsWith('/api/feature/')) {
    const rawFeatureId = url.pathname.replace('/api/feature/', '');
    const featureId = sanitizeFeatureId(rawFeatureId);
    if (!featureId) {
      sendJson(res, 400, { error: 'Invalid feature ID' });
      return;
    }
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

  // Serve CSS file
  if (url.pathname === '/styles.css') {
    const cssPath = join(__dirname, 'styles.css');
    if (!existsSync(cssPath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('CSS file not found');
      return;
    }
    const css = readFileSync(cssPath, 'utf-8');
    res.writeHead(200, {
      'Content-Type': 'text/css; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.end(css);
    return;
  }

  // Serve JavaScript files
  if (url.pathname.endsWith('.js')) {
    const jsPath = resolve(__dirname, '.' + url.pathname);
    if (!jsPath.startsWith(__dirname) || !existsSync(jsPath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('JavaScript file not found');
      return;
    }
    const js = readFileSync(jsPath, 'utf-8');
    res.writeHead(200, {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.end(js);
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
