/**
 * doctor CLI 命令
 * spec-first doctor [featureId]
 */
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { ExitCode } from '../../shared/types.js';
import { checkHooks } from '../../core/tool-integration/hook-installer.js';
import { ensureHostBootstrap } from '../../shared/host-bootstrap.js';
import { loadConfig, resetConfigCache } from '../../shared/config-schema.js';
import { isManagedSessionStartEntry } from '../../core/tool-integration/session-hook-managed.js';

type Level = 'PASS' | 'WARNING' | 'ERROR';

interface CheckResult {
  name: string;
  level: Level;
  message: string;
  fix?: string;
}

interface SessionHookCommandEntry {
  command?: unknown;
}

interface SessionHookEntry {
  hooks?: unknown;
}

interface ClaudeSettingsShape {
  hooks?: {
    SessionStart?: unknown;
  };
}

export function handleDoctor(args: string[]): number {
  const featureId = args[0];
  const projectRoot = process.cwd();
  const results: CheckResult[] = [];

  const bootstrap = ensureHostBootstrap();
  results.push(...bootstrap.results.map(mapBootstrapResult));

  // 项目级检查
  results.push(checkNodeVersion());
  results.push(checkGit());
  results.push(checkSpecFirstDir(projectRoot));
  results.push(checkSpecsDir(projectRoot));
  results.push(checkConfig(projectRoot));

  // Hook 状态检查
  results.push(...checkHookStatus(projectRoot));

  // Session Hook 可达性检查（Superpowers P1-4）
  results.push(checkSessionHook());

  // Feature 级检查
  if (featureId) {
    results.push(checkFeatureDir(projectRoot, featureId));
    results.push(checkStageState(projectRoot, featureId));
    results.push(checkGateDegradation(projectRoot, featureId));
    results.push(...checkRuntimeFiles(projectRoot, featureId));
  }

  // 输出报告
  printReport(results);

  const hasError = results.some((r) => r.level === 'ERROR');
  return hasError ? ExitCode.CONFIG_ERROR : ExitCode.SUCCESS;
}

// ─── 检查函数 ────────────────────────────────────────

function checkNodeVersion(): CheckResult {
  try {
    const ver = process.version; // e.g. v20.11.0
    const major = parseInt(ver.slice(1).split('.')[0], 10);
    if (major >= 20) {
      return { name: 'Node.js', level: 'PASS', message: `${ver} (≥ 20)` };
    }
    return { name: 'Node.js', level: 'ERROR', message: `${ver} (< 20)`, fix: '请升级到 Node.js ≥ 20' };
  } catch {
    return { name: 'Node.js', level: 'ERROR', message: '未找到', fix: '请安装 Node.js ≥ 20' };
  }
}

function checkGit(): CheckResult {
  try {
    const ver = execFileSync('git', ['--version'], {
      encoding: 'utf-8',
      timeout: 5_000,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return { name: 'Git', level: 'PASS', message: ver };
  } catch {
    return { name: 'Git', level: 'ERROR', message: '未找到', fix: '请安装 Git' };
  }
}

function checkSpecFirstDir(root: string): CheckResult {
  const dir = join(root, '.spec-first');
  if (existsSync(dir)) {
    return { name: '.spec-first/', level: 'PASS', message: '已找到' };
  }
  return { name: '.spec-first/', level: 'WARNING', message: '未找到', fix: '运行 spec-first init 创建项目配置' };
}

function checkSpecsDir(root: string): CheckResult {
  const dir = join(root, 'specs');
  if (existsSync(dir)) {
    return { name: 'specs/', level: 'PASS', message: '已找到' };
  }
  return { name: 'specs/', level: 'WARNING', message: '未找到', fix: '运行 spec-first init 创建 specs 目录' };
}

function checkConfig(root: string): CheckResult {
  const metaPath = join(root, '.spec-first', 'meta', 'config.yaml');
  if (existsSync(metaPath)) {
    return { name: 'config.yaml', level: 'PASS', message: '已找到' };
  }
  return {
    name: 'config.yaml',
    level: 'WARNING',
    message: '未找到（使用内置默认值）',
    fix: '可选：创建 .spec-first/meta/config.yaml 自定义 gate/context/health 设置',
  };
}

function checkFeatureDir(root: string, featureId: string): CheckResult {
  const dir = join(root, 'specs', featureId);
  if (existsSync(dir)) {
    return { name: `Feature ${featureId}`, level: 'PASS', message: '目录已找到' };
  }
  return { name: `Feature ${featureId}`, level: 'ERROR', message: '目录未找到', fix: '运行 spec-first init --feat ... 创建 Feature' };
}

function checkStageState(root: string, featureId: string): CheckResult {
  const p = join(root, 'specs', featureId, 'stage-state.json');
  if (existsSync(p)) {
    return { name: 'stage-state.json', level: 'PASS', message: '已找到' };
  }
  return { name: 'stage-state.json', level: 'ERROR', message: '缺失', fix: '请重新初始化 Feature' };
}

/** Hook 安装状态检查 */
function checkHookStatus(root: string): CheckResult[] {
  if (!existsSync(join(root, '.git'))) {
    return [{
      name: 'Git Hooks',
      level: 'PASS',
      message: '未检测到 .git（非 Git 仓库，已跳过）',
    }];
  }

  try {
    const statuses = checkHooks(root);
    return statuses.map(s => {
      if (s.installed && s.isSpecFirst) {
        return { name: `Hook: ${s.name}`, level: 'PASS' as Level, message: '已安装' };
      }
      if (s.installed) {
        return { name: `Hook: ${s.name}`, level: 'WARNING' as Level, message: '已存在但非 spec-first', fix: '运行 spec-first hooks install' };
      }
      return { name: `Hook: ${s.name}`, level: 'WARNING' as Level, message: '未安装', fix: '运行 spec-first hooks install' };
    });
  } catch {
    return [{ name: 'Git Hooks', level: 'WARNING', message: '无法检查（缺少 .git?）', fix: '请先初始化 Git 仓库' }];
  }
}

/** Session Hook 可达性检查（Superpowers P1-4） */
function checkSessionHook(): CheckResult {
  const homeDir = process.env.HOME?.trim() || homedir();
  const claudeSettingsPath = join(homeDir, '.claude', 'settings.json');

  if (!existsSync(claudeSettingsPath)) {
    return {
      name: 'Session Hook',
      level: 'WARNING',
      message: '~/.claude/settings.json 不存在',
      fix: '运行 spec-first update 安装 Session Hook',
    };
  }

  try {
    const settings = JSON.parse(readFileSync(claudeSettingsPath, 'utf-8')) as ClaudeSettingsShape;
    const sessionStart = Array.isArray(settings?.hooks?.SessionStart)
      ? settings.hooks.SessionStart
      : [];

    if (sessionStart.length === 0) {
      return {
        name: 'Session Hook',
        level: 'WARNING',
        message: 'hooks.SessionStart 为空',
        fix: '运行 spec-first update 安装 Session Hook',
      };
    }

    // 1) 优先复用统一托管识别，避免与注册/卸载逻辑漂移
    // 2) 诊断场景允许降级到 "spec-first" 字面量匹配，以识别“条目存在但内容缺失”的历史配置
    const managedEntry = sessionStart.find((entry: unknown) => isManagedSessionStartEntry(entry));
    const fallbackEntry = sessionStart.find((entry: unknown) => {
      const hooks = (entry as SessionHookEntry | undefined)?.hooks;
      if (!Array.isArray(hooks)) return false;
      return hooks.some((hook) => {
        const command = (hook as SessionHookCommandEntry | undefined)?.command;
        return typeof command === 'string' && command.includes('spec-first');
      });
    });
    const specFirstEntry = managedEntry ?? fallbackEntry;

    if (!specFirstEntry) {
      return {
        name: 'Session Hook',
        level: 'WARNING',
        message: 'Session Hook 内容不完整（缺少：技能路由表、1%规则、catchup 提示、viewer 启动）',
        fix: '未找到 spec-first SessionStart 条目；运行 spec-first update 重新安装 Session Hook',
      };
    }

    // 检查首轮注入关键内容（路由表 + 1% 规则 + catchup + viewer）
    const entry = specFirstEntry as SessionHookEntry;
    const firstHook = Array.isArray(entry.hooks) ? entry.hooks[0] as SessionHookCommandEntry | undefined : undefined;
    const firstCommand = firstHook?.command;
    const command = typeof firstCommand === 'string' ? firstCommand : '';
    const hasRouteMap = command.includes('技能路由表') || command.includes('route');
    const hasOnePercentRule = command.includes('1%规则') || command.includes('1%');
    const hasCatchup = command.includes('catchup');
    const hasViewer = command.includes('viewer open');

    const missingParts: string[] = [];
    if (!hasRouteMap) missingParts.push('技能路由表');
    if (!hasOnePercentRule) missingParts.push('1%规则');
    if (!hasCatchup) missingParts.push('catchup 提示');
    if (!hasViewer) missingParts.push('viewer 启动');

    if (missingParts.length > 0) {
      return {
        name: 'Session Hook',
        level: 'WARNING',
        message: `Session Hook 内容不完整（缺少：${missingParts.join('、')}）`,
        fix: '运行 spec-first update 重新安装 Session Hook',
      };
    }

    return {
      name: 'Session Hook',
      level: 'PASS',
      message: '已配置 (路由表+1%规则+恢复+viewer)',
    };
  } catch (e) {
    return {
      name: 'Session Hook',
      level: 'WARNING',
      message: `解析失败: ${(e as Error).message}`,
      fix: '检查 ~/.claude/settings.json 格式或重新运行 spec-first update',
    };
  }
}

/** Gate 降级状态检测 */
function checkGateDegradation(root: string, _featureId: string): CheckResult {
  const metaConfigPath = join(root, '.spec-first', 'meta', 'config.yaml');
  const localConfigPath = join(root, '.spec-first', 'local', 'config.yaml');
  if (!existsSync(metaConfigPath) && !existsSync(localConfigPath)) {
    return { name: 'Gate Degradation', level: 'PASS', message: '无配置（默认模式）' };
  }
  try {
    resetConfigCache();
    const config = loadConfig(root);
    if (config.gate.pilot_mode) {
      return { name: 'Gate Degradation', level: 'WARNING', message: 'pilot_mode 已开启 — gate 仅提示不阻断', fix: '准备强校验时请设置 pilot_mode: false' };
    }
    return { name: 'Gate Degradation', level: 'PASS', message: '强校验模式' };
  } catch (e) {
    return {
      name: 'Gate Degradation',
      level: 'WARNING',
      message: `配置解析失败（${(e as Error).message}）`,
      fix: '修复 .spec-first/meta/config.yaml 或重新运行 spec-first init',
    };
  }
}

/** 运行态文件容量检查 (>500行提示归档) */
function checkRuntimeFiles(root: string, featureId: string): CheckResult[] {
  const results: CheckResult[] = [];
  const files = ['findings.md', 'task_plan.md'];
  const THRESHOLD = 500;

  for (const file of files) {
    const p = join(root, 'specs', featureId, file);
    if (!existsSync(p)) continue;
    const content = readFileSync(p, 'utf-8');
    const lines = content.split('\n').length;
    if (lines > THRESHOLD) {
      results.push({
        name: file,
        level: 'WARNING',
        message: `${lines} 行（>${THRESHOLD}）`,
        fix: `建议归档历史内容：${file.replace('.md', '')}-YYYY-MM.md，并保留最近 200 行`,
      });
    }
  }
  return results;
}

// ─── 输出 ────────────────────────────────────────────

function printReport(results: CheckResult[]): void {
  console.log('Spec-First 环境诊断\n');
  for (const r of results) {
    const icon = r.level === 'PASS' ? '[OK]' : r.level === 'WARNING' ? '[WARN]' : '[ERR]';
    console.log(`  ${icon.padEnd(7)} ${r.name.padEnd(22)} ${r.message}`);
    if (r.fix) {
      console.log(`          修复建议：${r.fix}`);
    }
  }

  const errors = results.filter((r) => r.level === 'ERROR').length;
  const warnings = results.filter((r) => r.level === 'WARNING').length;
  console.log(`\n结果：${errors} 个错误，${warnings} 个警告`);
}

function mapBootstrapResult(entry: {
  host: string;
  category: string;
  name: string;
  level: 'PASS' | 'FIXED' | 'WARNING' | 'ERROR';
  detail: string;
}): CheckResult {
  if (entry.level === 'ERROR') {
    return {
      name: `${entry.host} ${entry.category}:${entry.name}`,
      level: 'ERROR',
      message: entry.detail,
      fix: '检查网络和权限后重试 bootstrap',
    };
  }
  if (entry.level === 'FIXED') {
    return {
      name: `${entry.host} ${entry.category}:${entry.name}`,
      level: 'WARNING',
      message: `已自动修复（${entry.detail}）`,
    };
  }
  if (entry.level === 'WARNING') {
    return {
      name: `${entry.host} ${entry.category}:${entry.name}`,
      level: 'WARNING',
      message: entry.detail,
    };
  }
  return {
    name: `${entry.host} ${entry.category}:${entry.name}`,
    level: 'PASS',
    message: entry.detail,
  };
}
