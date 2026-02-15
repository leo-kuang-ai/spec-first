/**
 * doctor CLI 命令
 * spec-first doctor [featureId]
 */
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { ExitCode } from '../../shared/types.js';
import { checkHooks } from '../../core/tool-integration/hook-installer.js';

type Level = 'PASS' | 'WARNING' | 'ERROR';

interface CheckResult {
  name: string;
  level: Level;
  message: string;
  fix?: string;
}

export function handleDoctor(args: string[]): number {
  const featureId = args[0];
  const projectRoot = process.cwd();
  const results: CheckResult[] = [];

  // 项目级检查
  results.push(checkNodeVersion());
  results.push(checkGit());
  results.push(checkSpecFirstDir(projectRoot));
  results.push(checkSpecsDir(projectRoot));
  results.push(checkConfig(projectRoot));

  // Hook 状态检查
  results.push(...checkHookStatus(projectRoot));

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
    return { name: 'Node.js', level: 'ERROR', message: `${ver} (< 20)`, fix: 'Upgrade to Node.js ≥ 20' };
  } catch {
    return { name: 'Node.js', level: 'ERROR', message: 'Not found', fix: 'Install Node.js ≥ 20' };
  }
}

function checkGit(): CheckResult {
  try {
    const ver = execSync('git --version', { encoding: 'utf-8' }).trim();
    return { name: 'Git', level: 'PASS', message: ver };
  } catch {
    return { name: 'Git', level: 'ERROR', message: 'Not found', fix: 'Install Git' };
  }
}

function checkSpecFirstDir(root: string): CheckResult {
  const dir = join(root, '.spec-first');
  if (existsSync(dir)) {
    return { name: '.spec-first/', level: 'PASS', message: 'Found' };
  }
  return { name: '.spec-first/', level: 'WARNING', message: 'Not found', fix: 'Run spec-first init to create project config' };
}

function checkSpecsDir(root: string): CheckResult {
  const dir = join(root, 'specs');
  if (existsSync(dir)) {
    return { name: 'specs/', level: 'PASS', message: 'Found' };
  }
  return { name: 'specs/', level: 'WARNING', message: 'Not found', fix: 'Run spec-first init to create specs directory' };
}

function checkConfig(root: string): CheckResult {
  const p = join(root, '.spec-first', 'config.yaml');
  if (existsSync(p)) {
    return { name: 'config.yaml', level: 'PASS', message: 'Found' };
  }
  return { name: 'config.yaml', level: 'WARNING', message: 'Not found', fix: 'Create .spec-first/config.yaml' };
}

function checkFeatureDir(root: string, featureId: string): CheckResult {
  const dir = join(root, 'specs', featureId);
  if (existsSync(dir)) {
    return { name: `Feature ${featureId}`, level: 'PASS', message: 'Directory found' };
  }
  return { name: `Feature ${featureId}`, level: 'ERROR', message: 'Directory not found', fix: `Run spec-first init --feat ... to create Feature` };
}

function checkStageState(root: string, featureId: string): CheckResult {
  const p = join(root, 'specs', featureId, 'stage-state.json');
  if (existsSync(p)) {
    return { name: 'stage-state.json', level: 'PASS', message: 'Found' };
  }
  return { name: 'stage-state.json', level: 'ERROR', message: 'Missing', fix: 'Re-initialize Feature' };
}

/** Hook 安装状态检查 */
function checkHookStatus(root: string): CheckResult[] {
  try {
    const statuses = checkHooks(root);
    return statuses.map(s => {
      if (s.installed && s.isSpecFirst) {
        return { name: `Hook: ${s.name}`, level: 'PASS' as Level, message: 'Installed' };
      }
      if (s.installed) {
        return { name: `Hook: ${s.name}`, level: 'WARNING' as Level, message: 'Exists but not spec-first', fix: 'Run spec-first hooks install' };
      }
      return { name: `Hook: ${s.name}`, level: 'WARNING' as Level, message: 'Not installed', fix: 'Run spec-first hooks install' };
    });
  } catch {
    return [{ name: 'Git Hooks', level: 'WARNING', message: 'Cannot check (no .git?)', fix: 'Initialize git repository' }];
  }
}

/** Gate 降级状态检测 */
function checkGateDegradation(root: string, featureId: string): CheckResult {
  const configPath = join(root, '.spec-first', 'config.yaml');
  if (!existsSync(configPath)) {
    return { name: 'Gate Degradation', level: 'PASS', message: 'No config (default mode)' };
  }
  const content = readFileSync(configPath, 'utf-8');
  if (content.includes('pilot_mode: true') || content.includes('pilot_mode:true')) {
    return { name: 'Gate Degradation', level: 'WARNING', message: 'pilot_mode enabled — gates are advisory only', fix: 'Set pilot_mode: false when ready for enforcement' };
  }
  return { name: 'Gate Degradation', level: 'PASS', message: 'Enforcement mode' };
}

/** 运行时三文件容量检查 (>500行提示归档) */
function checkRuntimeFiles(root: string, featureId: string): CheckResult[] {
  const results: CheckResult[] = [];
  const files = ['progress.md', 'findings.md', 'task_plan.md'];
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
        message: `${lines} lines (>${THRESHOLD})`,
        fix: `Archive old content: ${file.replace('.md', '')}-YYYY-MM.md, keep last 200 lines`,
      });
    }
  }
  return results;
}

// ─── 输出 ────────────────────────────────────────────

function printReport(results: CheckResult[]): void {
  console.log('Spec-First Doctor\n');
  for (const r of results) {
    const icon = r.level === 'PASS' ? '[OK]' : r.level === 'WARNING' ? '[WARN]' : '[ERR]';
    console.log(`  ${icon.padEnd(7)} ${r.name.padEnd(22)} ${r.message}`);
    if (r.fix) {
      console.log(`          Fix: ${r.fix}`);
    }
  }

  const errors = results.filter((r) => r.level === 'ERROR').length;
  const warnings = results.filter((r) => r.level === 'WARNING').length;
  console.log(`\nResult: ${errors} error(s), ${warnings} warning(s)`);
}
