/**
 * feature CLI 命令
 * spec-first feature list | current | switch <featureId>
 */
import { join } from 'node:path';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { ExitCode } from '../../shared/types.js';
import { exists, ensureDir, readJson } from '../../shared/fs-utils.js';
import type { StageState } from '../../shared/types.js';
import { resolveFeatureId } from '../../core/process-engine/feature.js';

export function handleFeature(args: string[]): number {
  const sub = args[0];
  const rest = args.slice(1);

  switch (sub) {
    case 'list': return handleList();
    case 'current': return handleCurrent();
    case 'switch': return handleSwitch(rest);
    default:
      if (sub) console.error(`未知 feature 子命令：${sub}`);
      printFeatureHelp();
      return ExitCode.VALIDATION_ERROR;
  }
}

function handleList(): number {
  const projectRoot = process.cwd();
  const specsDir = join(projectRoot, 'specs');
  if (!exists(specsDir)) {
    console.log('未找到 specs/ 目录。');
    return ExitCode.SUCCESS;
  }

  const entries = readdirSync(specsDir, { withFileTypes: true })
    .filter(e => e.isDirectory() && e.name.startsWith('FSREQ-'));

  if (entries.length === 0) {
    console.log('未找到 Feature。');
    return ExitCode.SUCCESS;
  }

  console.log('Feature 列表：\n');
  console.log('ID'.padEnd(35) + '标题'.padEnd(25) + '阶段'.padEnd(18) + '更新时间');
  console.log('-'.repeat(90));

  for (const entry of entries) {
    const statePath = join(specsDir, entry.name, 'stage-state.json');
    if (!exists(statePath)) continue;
    const state = readJson<StageState>(statePath);
    console.log(
      state.featureId.padEnd(35) +
      (state.title ?? '').padEnd(25) +
      state.currentStage.padEnd(18) +
      (state.updatedAt ?? ''),
    );
  }

  return ExitCode.SUCCESS;
}

function handleCurrent(): number {
  const projectRoot = process.cwd();
  const currentFile = join(projectRoot, '.spec-first', 'current');

  if (!exists(currentFile)) {
    console.log('尚未设置当前 Feature。请使用：spec-first feature switch <featureId>');
    return ExitCode.SUCCESS;
  }

  const featureId = readFileSync(currentFile, 'utf-8').trim();
  const statePath = join(projectRoot, 'specs', featureId, 'stage-state.json');

  if (!exists(statePath)) {
    console.log(`当前 Feature：${featureId}（未找到 stage-state.json）`);
    return ExitCode.SUCCESS;
  }

  const state = readJson<StageState>(statePath);
  console.log(`当前 Feature：${state.featureId}`);
  console.log(`  标题：${state.title ?? 'N/A'}`);
  console.log(`  阶段：${state.currentStage}`);
  console.log(`  模式：${state.mode}  规模：${state.size}`);
  console.log(`  平台：${state.platforms.join(', ')}`);

  return ExitCode.SUCCESS;
}

function handleSwitch(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('用法：spec-first feature switch <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }

  const projectRoot = process.cwd();
  let resolved: { featureId: string; source: 'exact' | 'prefix' | 'env' };
  try {
    resolved = resolveFeatureId(featureId, projectRoot);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return ExitCode.VALIDATION_ERROR;
  }

  // 验证 feature 目录存在且包含必要文件
  const statePath = join(projectRoot, 'specs', resolved.featureId, 'stage-state.json');
  if (!exists(statePath)) {
    console.error(`错误：feature "${resolved.featureId}" 不存在或未初始化`);
    console.error(`  预期路径：${statePath}`);
    return ExitCode.VALIDATION_ERROR;
  }

  const configDir = join(projectRoot, '.spec-first');
  ensureDir(configDir);
  writeFileSync(join(configDir, 'current'), resolved.featureId, 'utf-8');
  console.log(`已切换到：${resolved.featureId}${resolved.source === 'exact' ? '' : `（来源: ${resolved.source}）`}`);

  return ExitCode.SUCCESS;
}

function printFeatureHelp(): void {
  console.log(`用法：spec-first feature <subcommand>

子命令：
  list      列出所有 Feature
  current   查看当前 Feature 详情
  switch    切换当前 Feature`);
}
