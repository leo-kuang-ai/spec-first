/**
 * feature CLI 命令
 * spec-first feature list | current | switch <featureId>
 */
import { join } from 'node:path';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { ExitCode } from '../../shared/types.js';
import { exists, ensureDir, readJson } from '../../shared/fs-utils.js';
import type { StageState } from '../../shared/types.js';
import { currentFeature, getFeatureState, resolveFeatureId } from '../../core/process-engine/feature.js';

export function handleFeature(args: string[]): number {
  const sub = args[0];
  const rest = args.slice(1);

  switch (sub) {
    case 'list':
      return handleList();
    case 'current':
      return handleCurrent();
    case 'switch':
      return handleSwitch(rest);
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

  const entries = readdirSync(specsDir, { withFileTypes: true }).filter(
    (e) => e.isDirectory() && e.name.startsWith('FSREQ-')
  );

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
        (state.updatedAt ?? '')
    );
  }

  return ExitCode.SUCCESS;
}

function handleCurrent(): number {
  const projectRoot = process.cwd();
  const currentFile = join(projectRoot, '.spec-first', 'current');

  if (!exists(currentFile)) {
    console.log('尚未设置当前 Feature。');
    console.log('建议先执行：spec-first feature switch <featureId> --yes');
    return ExitCode.SUCCESS;
  }

  const featureId = currentFeature(projectRoot) ?? readFileSync(currentFile, 'utf-8').trim();
  if (!featureId) {
    console.log('当前需求定位指针为空。');
    console.log('建议重新执行：spec-first feature switch <featureId> --yes');
    return ExitCode.SUCCESS;
  }

  const statePath = join(projectRoot, 'specs', featureId, 'stage-state.json');
  if (!exists(statePath)) {
    console.log(`当前 Feature：${featureId}`);
    console.log('  定位来源：.spec-first/current');
    console.log('  警告：未找到 stage-state.json，建议回切到有效 Feature 后执行 /spec-first:catchup');
    return ExitCode.SUCCESS;
  }

  const state = readJson<StageState>(statePath);
  console.log(`当前 Feature：${state.featureId}`);
  console.log('  定位来源：.spec-first/current');
  console.log(`  标题：${state.title ?? 'N/A'}`);
  console.log(`  阶段：${state.currentStage}`);
  console.log(`  模式：${state.mode}  规模：${state.size}`);
  console.log(`  平台：${state.platforms.join(', ')}`);
  console.log('  如需重载上下文：/spec-first:catchup');

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
    console.error('失败时未改写 .spec-first/current');
    return ExitCode.VALIDATION_ERROR;
  }

  let state: StageState;
  try {
    state = getFeatureState(resolved.featureId, projectRoot);
  } catch (error) {
    const statePath = join(projectRoot, 'specs', resolved.featureId, 'stage-state.json');
    console.error(`错误：feature "${resolved.featureId}" 不存在或未初始化`);
    console.error(`  预期路径：${statePath}`);
    console.error(error instanceof Error ? `  详情：${error.message}` : `  详情：${String(error)}`);
    console.error('失败时不得改写 current 指针');
    return ExitCode.VALIDATION_ERROR;
  }

  const configDir = join(projectRoot, '.spec-first');
  ensureDir(configDir);
  writeFileSync(join(configDir, 'current'), resolved.featureId, 'utf-8');
  console.log(`已切换到：${resolved.featureId}`);
  console.log(`  标题：${state.title ?? 'N/A'}`);
  console.log(`  当前阶段：${state.currentStage}`);
  console.log(`  .spec-first/current 已更新${resolved.source === 'exact' ? '' : `（解析来源：${resolved.source}）`}`);
  console.log('  建议下一步：/spec-first:catchup');

  return ExitCode.SUCCESS;
}

function printFeatureHelp(): void {
  console.log(`用法：spec-first feature <subcommand>

子命令：
  list      列出所有 Feature
  current   查看当前 Feature 详情
  switch    切换当前 Feature`);
}
