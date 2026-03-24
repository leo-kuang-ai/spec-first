/**
 * stage CLI 命令组
 * spec-first stage current|suggest
 */
import { join } from 'node:path';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { ExitCode } from '../../shared/types.js';
import { Stage } from '../../shared/types.js';
import { getFeatureState } from '../../core/process-engine/feature.js';
import { checkReadiness } from '../../core/process-engine/readiness-check.js';
import { getNextStages } from '../../core/process-engine/stage-machine.js';
import { checkHooks } from '../../core/tool-integration/hook-installer.js';

/** AI Runtime Hook 类型常量 */
const AI_HOOK_TYPES = ['PreToolUse', 'PostToolUse', 'Stop'] as const;
type AIHookType = (typeof AI_HOOK_TYPES)[number];

/** AI Hooks 状态检查结果 */
interface AIHooksStatus {
  registered: AIHookType[];
}

export function handleStage(args: string[]): number {
  const sub = args[0];
  const rest = args.slice(1);

  switch (sub) {
    case 'current':
      return handleCurrent(rest);
    case 'suggest':
      return handleSuggest(rest);
    case 'advance':
      console.error('`spec-first stage advance` 已移除；请改用 `spec-first transition <featureId>`。');
      return ExitCode.VALIDATION_ERROR;
    case 'cancel':
      console.error(
        '`spec-first stage cancel` 已移除；请改用 `spec-first transition cancel <featureId> --reason "<reason>"`。'
      );
      return ExitCode.VALIDATION_ERROR;
    default:
      console.error(`未知 stage 子命令：${sub}`);
      printStageHelp();
      return ExitCode.VALIDATION_ERROR;
  }
}

/**
 * 检查 AI Hooks 注册状态
 */
function checkAIHooksStatus(projectRoot: string): AIHooksStatus {
  const settingsPath = join(projectRoot, '.claude', 'settings.json');
  const registered: AIHookType[] = [];

  if (!existsSync(settingsPath)) {
    return { registered };
  }

  try {
    const settings = JSON.parse(readFileSync(settingsPath, 'utf-8')) as Record<string, unknown>;
    const hooksRoot = settings.hooks;
    if (!hooksRoot || typeof hooksRoot !== 'object' || Array.isArray(hooksRoot)) {
      return { registered };
    }
    const hooksObj = hooksRoot as Record<string, unknown>;

    for (const type of AI_HOOK_TYPES) {
      const entries = hooksObj[type];
      if (Array.isArray(entries) && entries.length > 0) {
        const hasSpecFirst = entries.some((entry: unknown) => {
          const hookEntries = (entry as { hooks?: unknown } | undefined)?.hooks;
          if (!Array.isArray(hookEntries)) return false;
          return hookEntries.some((hook: unknown) => {
            const command = (hook as { command?: unknown } | undefined)?.command;
            return typeof command === 'string' && command.includes('spec-first');
          });
        });
        if (hasSpecFirst) {
          registered.push(type);
        }
      }
    }
  } catch (e) {
    console.warn(`警告：解析 .claude/settings.json 失败：${(e as Error).message}`);
  }

  return { registered };
}

/**
 * 检查 Skill 命令注册数量
 */
function countSkillCommands(projectRoot: string): number {
  const commandsDir = join(projectRoot, '.claude', 'commands', 'spec-first');
  if (!existsSync(commandsDir)) {
    return 0;
  }
  const entries = readdirSync(commandsDir, { withFileTypes: true });
  return entries.filter((e) => e.isFile() && e.name.endsWith('.md')).length;
}

function handleCurrent(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('用法：spec-first stage current <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }

  try {
    const projectRoot = process.cwd();
    const state = getFeatureState(featureId, projectRoot);
    const featureDir = join(projectRoot, 'specs', featureId);

    console.log(`Feature：${state.featureId}`);
    console.log(`目录：  ${featureDir}`);
    console.log(`阶段：   ${state.currentStage}`);
    console.log(`平台：   ${state.platforms?.join(', ') || '(无)'}`);
    console.log(`模式：   ${state.mode ?? 'N/A'}  规模：${state.size ?? 'N/A'}`);
    console.log(`终态：${state.terminal}`);

    const hookStatuses = checkHooks(projectRoot);
    const installedHooks = hookStatuses
      .filter((h) => h.installed && h.isSpecFirst)
      .map((h) => h.name);
    const missingHooks = hookStatuses
      .filter((h) => !h.installed || !h.isSpecFirst)
      .map((h) => h.name);
    console.log(`\nHooks：`);
    console.log(`  已安装: ${installedHooks.length > 0 ? installedHooks.join(', ') : '(无)'}`);
    if (missingHooks.length > 0) {
      console.log(`  未安装: ${missingHooks.join(', ')}`);
    }

    const aiHooksStatus = checkAIHooksStatus(projectRoot);
    console.log(`\nAI Hooks：`);
    console.log(
      `  已注册: ${aiHooksStatus.registered.length > 0 ? aiHooksStatus.registered.join(', ') : '(无)'}`
    );

    const skillCount = countSkillCommands(projectRoot);
    console.log(`\nSkill 命令：`);
    console.log(`  已注册: ${skillCount > 0 ? `${skillCount} 个` : '(无)'}`);

    return ExitCode.SUCCESS;
  } catch (e) {
    console.error(`错误：${(e as Error).message}`);
    return ExitCode.IO_ERROR;
  }
}

function handleSuggest(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('用法：spec-first stage suggest <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }

  try {
    const projectRoot = process.cwd();
    const state = getFeatureState(featureId, projectRoot);
    const targetStage = getNextWorkStage(state.currentStage);
    if (!targetStage) {
      console.log(`Feature：${state.featureId}`);
      console.log(`当前阶段：${state.currentStage}`);
      console.log('决策：BLOCKED');
      return ExitCode.SUCCESS;
    }
    const readiness = checkReadiness({
      currentStage: state.currentStage,
      targetStage,
      nodes: state.nodes,
      artifacts: collectArtifacts(projectRoot, featureId),
      terminal: state.terminal,
    });

    console.log(`Feature：${state.featureId}`);
    console.log(`当前阶段：${state.currentStage}`);
    console.log(`目标阶段：${readiness.targetStage}`);
    console.log(`决策：${readiness.decision}`);
    if (!readiness.checks.previousNodeComplete) {
      console.log('原因：当前节点未完成，先继续收口本节点。');
    } else if (!readiness.checks.requiredArtifactsExist) {
      console.log('原因：目标节点所需产物未齐全。');
    } else if (!readiness.checks.noActiveWork) {
      console.log('原因：存在其他活跃中的节点工作。');
    }

    return ExitCode.SUCCESS;
  } catch (e) {
    console.error(`错误：${(e as Error).message}`);
    return ExitCode.IO_ERROR;
  }
}

function getNextWorkStage(stage: Stage): Stage | undefined {
  return getNextStages(stage).find((candidate) => candidate !== Stage.CANCELLED);
}

function collectArtifacts(projectRoot: string, featureId: string): string[] {
  const featureDir = join(projectRoot, 'specs', featureId);
  if (!existsSync(featureDir)) return [];
  return readdirSync(featureDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name);
}

function printStageHelp(): void {
  console.log(`用法：spec-first stage <subcommand>

子命令：
  current   查看当前阶段
  suggest   输出当前阶段建议与阻塞原因
  advance   推进到下一阶段
  cancel    取消 Feature`);
}
