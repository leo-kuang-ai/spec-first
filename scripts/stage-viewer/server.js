#!/usr/bin/env node

import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { METRIC_DEFS, getDefaultMetrics, calcHealthScore } from './health-utils.js';

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

function getMetrics(projectRoot, featureId) {
  // 先校验 featureId 格式（防御命令注入）
  if (!FEATURE_ID_PATTERN.test(featureId)) {
    return getDefaultMetrics(featureId, projectRoot);
  }

  try {
    // 使用 execFileSync + 参数数组，避免 shell 注入
    const output = execFileSync('npx', ['spec-first', 'metrics', 'coverage', featureId, '--json'], {
      cwd: projectRoot,
      encoding: 'utf-8',
      timeout: 10000,
      // npx 可能不存在，优雅降级
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const parsed = JSON.parse(String(output));
    return parsed;
  } catch {
    // CLI 不可用时返回模拟数据（从 stage-state.json 推断）
    return getDefaultMetrics(featureId, projectRoot);
  }
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
    if (defect.status === 'open') stats.open += 1;
    else if (defect.status === 'fixing') stats.fixing += 1;
    else if (defect.status === 'fixed' || defect.status === 'verified') stats.fixed += 1;
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

function getGateStatus(projectRoot, featureId) {
  const historyPath = join(projectRoot, 'specs', featureId, 'gate-history.jsonl');
  if (!existsSync(historyPath)) {
    return { currentStage: null, status: null, conditions: [], lastCheck: null };
  }

  try {
    const content = readFileSync(historyPath, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    if (lines.length === 0) {
      return { currentStage: null, status: null, conditions: [], lastCheck: null };
    }

    // 获取最新的 Gate 检查结果
    const lastEntry = JSON.parse(lines[lines.length - 1]);
    return {
      currentStage: lastEntry.stage || null,
      status: lastEntry.status || null,
      conditions: (lastEntry.conditions || []).map(c => ({
        id: c.id,
        description: c.description,
        status: c.status,
        detail: c.detail,
      })),
      lastCheck: lastEntry.timestamp || null,
    };
  } catch {
    return { currentStage: null, status: null, conditions: [], lastCheck: null };
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
    const stageOrder = ['00_init', '01_specify', '02_design', '03_plan', '04_implement', '05_verify', '06_wrap_up'];
    const stageNames = {
      '00_init': '初始化',
      '01_specify': '需求规格',
      '02_design': '技术设计',
      '03_plan': '任务拆解',
      '04_implement': '代码实现',
      '05_verify': '验证测试',
      '06_wrap_up': '归档复盘'
    };

    // 按阶段分组，取每个阶段的第一个 PASS 事件作为进入时间
    const stageEntries = {};
    for (const event of events) {
      if (event.stage && !stageEntries[event.stage]) {
        stageEntries[event.stage] = {
          stage: event.stage,
          stageName: stageNames[event.stage] || event.stage,
          startTime: event.timestamp,
          status: event.status || 'UNKNOWN',
          conditions: event.conditions || []
        };
      }
    }

    // 按预定义顺序构建时间线
    for (const stage of stageOrder) {
      if (stageEntries[stage]) {
        stageTimeline.push(stageEntries[stage]);
      }
    }

    // 计算每个阶段的持续时间
    let totalDuration = 0;
    for (let i = 0; i < stageTimeline.length; i++) {
      const current = stageTimeline[i];
      const startTime = new Date(current.startTime);

      let endTime;
      if (i < stageTimeline.length - 1) {
        endTime = new Date(stageTimeline[i + 1].startTime);
      } else {
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

function parseTaskPlan(projectRoot, featureId) {
  const taskPath = join(projectRoot, 'specs', featureId, 'task_plan.md');
  if (!existsSync(taskPath)) return null;

  const content = readFileSync(taskPath, 'utf-8');
  const tasks = [];
  const phases = [];

  // 解析阶段 (### Phase N: Title)
  const phaseRegex = /### (Phase \d+):\s*(.+?)\n([\s\S]*?)(?=### Phase|\n## |$)/g;
  let phaseMatch;
  while ((phaseMatch = phaseRegex.exec(content)) !== null) {
    const phaseId = phaseMatch[1];
    const phaseTitle = phaseMatch[2].trim();
    const phaseContent = phaseMatch[3];

    // 提取阶段状态
    const statusMatch = phaseContent.match(/\*\*Status:\*\*\s*(\w+)/);
    const phaseStatus = statusMatch ? statusMatch[1] : 'pending';

    // 提取阶段内的任务
    const taskRegex = /-\s*\[([ x])\]\s*(TASK-\w+-\d+)\s+(.+)/g;
    let taskMatch;
    const phaseTasks = [];
    while ((taskMatch = taskRegex.exec(phaseContent)) !== null) {
      const checked = taskMatch[1] === 'x';
      const taskId = taskMatch[2];
      const taskTitle = taskMatch[3].trim();
      phaseTasks.push({
        id: taskId,
        title: taskTitle,
        status: checked ? 'complete' : 'pending',
      });
    }

    phases.push({
      id: phaseId,
      title: phaseTitle,
      status: phaseStatus,
      tasks: phaseTasks,
    });
  }

  // 解析任务明细表格
  const tableRegex = /\|\s*TASK ID\s*\|[\s\S]*?\n([\s\S]*?)(?=\n## |\n$)/;
  const tableMatch = content.match(tableRegex);
  if (tableMatch) {
    const rows = tableMatch[1].trim().split('\n').filter(row => row.includes('TASK-'));
    for (const row of rows) {
      const cols = row.split('|').map(c => c.trim()).filter(c => c);
      if (cols.length >= 8) {
        const taskId = cols[0];
        const title = cols[1];
        const owner = cols[2];
        const effort = cols[3];
        const traces = cols[4];
        const dependsOn = cols[5];
        const acceptance = cols[6];
        const status = cols[7] || 'pending';

        tasks.push({
          id: taskId,
          title,
          owner,
          effort,
          traces: traces ? traces.split(',').map(t => t.trim()) : [],
          dependsOn: dependsOn && dependsOn !== '-' ? dependsOn.split(',').map(d => d.trim()) : [],
          acceptance,
          status: normalizeTaskStatus(status),
        });
      }
    }
  }

  // 计算统计
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'complete').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const pending = tasks.filter(t => t.status === 'pending').length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  // 找出当前进行中的任务
  const currentTasks = tasks.filter(t => t.status === 'in_progress');

  return {
    phases,
    tasks,
    stats: {
      total,
      completed,
      inProgress,
      pending,
      progress,
    },
    currentTasks,
  };
}

function normalizeTaskStatus(status) {
  const s = status.toLowerCase().trim();
  if (s === 'complete' || s === 'completed' || s === 'done') return 'complete';
  if (s === 'in_progress' || s === 'in-progress' || s === 'in progress' || s === 'wip') return 'in_progress';
  return 'pending';
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

  // Metrics API - 必须在 feature 详情路由之前匹配
  if (url.pathname.match(/^\/api\/feature\/[^/]+\/metrics$/)) {
    const rawFeatureId = url.pathname.split('/')[3];
    const featureId = sanitizeFeatureId(rawFeatureId);
    if (!featureId) {
      sendJson(res, 400, { error: 'Invalid feature ID' });
      return;
    }
    const coverage = getMetrics(projectRoot, featureId);
    const defectStats = getDefectStats(projectRoot, featureId);
    const escapeRate = defectStats.total > 0 ? 0 : 0; // 简化：实际应从缺陷发现阶段计算
    const health = calcHealthScore(coverage, escapeRate);

    sendJson(res, 200, {
      featureId,
      coverage,
      health,
      metricDefs: METRIC_DEFS,
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
    const currentGate = getGateStatus(projectRoot, featureId);
    const allStageGates = getAllStageGateStatus(projectRoot, featureId);

    sendJson(res, 200, {
      featureId,
      current: currentGate,
      stages: allStageGates,
      now: new Date().toISOString(),
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

  // Serve JavaScript file
  if (url.pathname === '/app.js') {
    const jsPath = join(__dirname, 'app.js');
    if (!existsSync(jsPath)) {
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
