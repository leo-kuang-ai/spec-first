/**
 * Gate CLI 命令组
 * gate check / gate history / gate conditions / golive check
 */
import { ExitCode } from '../../shared/types.js';
import {
  evaluateGate,
  getConditions,
  getGateHistory,
  getProjectTypeFromConstitution,
} from '../../core/gate-engine/gate-evaluator.js';
import { checkGoLive } from '../../core/gate-engine/golive.js';
import { getStageMetricTargets } from '../../core/metrics-engine/core-metric-thresholds.js';
import { readJson, exists } from '../../shared/fs-utils.js';
import { join } from 'node:path';
import { appendFileSync, writeFileSync } from 'node:fs';
import type { ConditionResult, StageState } from '../../shared/types.js';

export function handleGate(args: string[]): number {
  const sub = args[0];
  switch (sub) {
    case 'check':
      return handleCheck(args.slice(1));
    case 'history':
      return handleHistory(args.slice(1));
    case 'conditions':
      return handleConditions(args.slice(1));
    case 'validate-config':
      return handleValidateConfig(args.slice(1));
    default:
      printGateHelp();
      if (sub) console.error(`未知 gate 子命令：${sub}`);
      return ExitCode.VALIDATION_ERROR;
  }
}

export function handleGoLive(args: string[]): number {
  const sub = args[0];
  if (sub !== 'check') {
    console.log('用法：spec-first golive check [featureId]');
    return ExitCode.VALIDATION_ERROR;
  }
  return handleGoLiveCheck(args.slice(1));
}

// ─── Subcommand Handlers ─────────────────────────────────

function formatConditionStatus(condition: ConditionResult): string {
  if (condition.status === 'PASS') return '\x1b[32m[OK]\x1b[0m';
  if (condition.status === 'WAIVER') return '\x1b[36m[WVR]\x1b[0m';
  if (condition.status === 'FAIL' && condition.blocking === false) {
    return '\x1b[33m[WARN]\x1b[0m';
  }
  return '\x1b[31m[FAIL]\x1b[0m';
}

function addSmartHint(condition: ConditionResult): void {
  const detail = condition.detail || '';

  // 环境问题：工具未安装
  if (/command not found|not found/i.test(detail)) {
    console.log(`          \x1b[36m💡 提示：工具未安装，这是环境问题\x1b[0m`);
    console.log(`             - 安装工具，或`);
    console.log(`             - 在 Profile 中设置 blocking: false`);
    return;
  }

  // 一般警告
  console.log(`          \x1b[33m⚠️  非阻断警告，可推进但建议修复\x1b[0m`);
}

function handleCheck(args: string[]): number {
  const jsonFlag = args.includes('--json');
  const noPersist = args.includes('--no-persist');
  const featureId = args.find((a) => !a.startsWith('--'));
  if (!featureId) {
    console.error('用法：spec-first gate check <featureId> [--json] [--no-persist]');
    return ExitCode.VALIDATION_ERROR;
  }

  const cwd = process.cwd();
  try {
    const result = evaluateGate(featureId, cwd, { persist: !noPersist });

    if (jsonFlag) {
      const effectiveGates = result.conditions.filter((c) => c.blocking !== false);
      const warnings = result.conditions.filter(
        (c) => c.status === 'FAIL' && c.blocking === false
      );
      const targets = getStageMetricTargets(result.stage as any, cwd);
      const metricTargets: Record<string, number> = {};
      for (const t of targets) {
        metricTargets[t.key] = t.target;
      }
      console.log(
        JSON.stringify(
          {
            ...result,
            effectiveGates,
            warnings,
            statusSummary: {
              status: result.status,
              blockingCount: effectiveGates.filter((c) => c.status === 'FAIL').length,
              warningCount: warnings.length,
            },
            metricTargets,
          },
          null,
          2
        )
      );
      return result.status === 'FAIL' ? ExitCode.VALIDATION_ERROR : ExitCode.SUCCESS;
    }

    console.log(`Gate 检查 — ${featureId} (${result.stage})\n`);
    console.log(`结果：${result.status}\n`);

    for (const c of result.conditions) {
      const icon = formatConditionStatus(c);
      console.log(`  ${icon.padEnd(16)} ${c.description}`);
      if (c.detail) {
        console.log(`          ${c.detail}`);
        // 智能提示：仅对 non-blocking 失败添加
        if (c.status === 'FAIL' && c.blocking === false) {
          addSmartHint(c);
        }
      }
    }

    if (result.suggestions && result.suggestions.length > 0) {
      console.log('\n建议：');
      for (const s of result.suggestions) console.log(`  - ${s}`);
    }

    const fixSteps = collectFixSteps(result.conditions);
    if (fixSteps.length > 0) {
      console.log('\n可执行修复步骤：');
      for (let i = 0; i < fixSteps.length; i++) {
        console.log(`  ${i + 1}. ${fixSteps[i]}`);
      }
    }

    if (fixSteps.length > 0) {
      appendFixStepsToFindings(featureId, cwd, result.conditions, fixSteps);
      console.log(`\n审计留痕：已同步修复步骤到 specs/${featureId}/findings.md`);
    }

    return result.status === 'FAIL' ? ExitCode.VALIDATION_ERROR : ExitCode.SUCCESS;
  } catch (e) {
    console.error(`Gate 评估失败：${featureId}`);
    console.error(`  原因：${(e as Error).message}`);
    return ExitCode.IO_ERROR;
  }
}

function handleHistory(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('用法：spec-first gate history <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }

  const history = getGateHistory(featureId, process.cwd());
  if (history.length === 0) {
    console.log('未找到 gate 历史记录。');
    return ExitCode.SUCCESS;
  }

  console.log(`Gate 历史 — ${featureId}\n`);
  for (const entry of history) {
    const icon = entry.status === 'PASS' ? '✓' : entry.status === 'PASS_WITH_WAIVER' ? '~' : '✗';
    const warnings = (entry.conditions || []).filter(c => c.status === 'FAIL' && c.blocking === false).length;
    const warningSuffix = warnings > 0 ? ` (${warnings} warnings)` : '';
    console.log(`  ${icon} ${entry.timestamp}  ${entry.stage}  ${entry.status}${warningSuffix}`);
  }

  return ExitCode.SUCCESS;
}

function handleConditions(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('用法：spec-first gate conditions <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }

  const cwd = process.cwd();
  const statePath = join(cwd, 'specs', featureId, 'stage-state.json');
  if (!exists(statePath)) {
    console.error(`未找到 stage-state.json：${featureId}`);
    return ExitCode.IO_ERROR;
  }

  const state = readJson<StageState>(statePath);
  const projectType = getProjectTypeFromConstitution(featureId, cwd);
  const profile = state.mergedRules?.profile ?? 'default-simplified';
  const defs = getConditions(state.currentStage, projectType, profile, cwd);

  console.log(`Gate 条件 — ${featureId} (${state.currentStage})\n`);
  for (const d of defs) {
    console.log(`  ${d.id}  ${d.description}`);
  }

  if (defs.length === 0) {
    console.log('  当前阶段未定义条件。');
  }

  return ExitCode.SUCCESS;
}

function handleGoLiveCheck(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('用法：spec-first golive check <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }

  const cwd = process.cwd();
  try {
    const result = checkGoLive(featureId, cwd);
    console.log(`上线检查 — ${featureId}\n`);

    for (const c of result.checks) {
      const icon = c.pass ? '[通过]' : '[失败]';
      console.log(`  ${icon.padEnd(7)} ${c.id}: ${c.description}`);
      if (c.detail) console.log(`          ${c.detail}`);
    }

    console.log(`\n结果：${result.pass ? '可上线' : '未就绪'}`);
    if (result.degraded) {
      console.log(`confirm_policy 已降级为：${result.confirmPolicy}`);
    }

    return result.pass ? ExitCode.SUCCESS : ExitCode.VALIDATION_ERROR;
  } catch (e) {
    console.error(`上线检查执行失败：${featureId}`);
    console.error(`  原因：${(e as Error).message}`);
    return ExitCode.IO_ERROR;
  }
}

function handleValidateConfig(_args: string[]): number {
  const cwd = process.cwd();
  const profilePath = join(cwd, '.spec-first/profile.yaml');

  if (!exists(profilePath)) {
    console.error('❌ 未找到 Profile 配置');
    console.log('提示：复制模板');
    console.log('  cp .spec-first/profiles/frontend.yaml .spec-first/profile.yaml');
    return ExitCode.CONFIG_ERROR;
  }

  console.log('✓ Profile 配置存在\n');
  console.log('提示：配置验证功能开发中');
  console.log('当前可用：手工检查 .spec-first/profile.yaml');

  return ExitCode.SUCCESS;
}

function printGateHelp(): void {
  console.log('用法：spec-first gate <subcommand>\n');
  console.log('子命令：');
  console.log('  check           校验当前阶段 Gate 条件 [--json] [--no-persist]');
  console.log('  history         查看 Gate 评估历史');
  console.log('  conditions      列出当前阶段 Gate 条件');
  console.log('  validate-config 验证 Profile 配置');
}

function collectFixSteps(conditions: ConditionResult[]): string[] {
  const steps: string[] = [];
  for (const condition of conditions) {
    if (condition.status !== 'FAIL' || !condition.detail) continue;
    const match = condition.detail.match(/fix:\s*(.+)$/i);
    if (!match) continue;

    const candidates = match[1]
      .split('|')
      .map((item) => item.trim())
      .filter(Boolean);

    for (const candidate of candidates) {
      if (!steps.includes(candidate)) {
        steps.push(candidate);
      }
    }
  }
  return steps;
}

function appendFixStepsToFindings(
  featureId: string,
  projectRoot: string,
  conditions: ConditionResult[],
  fixSteps: string[]
): void {
  const findingsPath = join(projectRoot, 'specs', featureId, 'findings.md');
  const failedConditions = conditions
    .filter((condition) => condition.status === 'FAIL' && condition.blocking !== false)
    .map(
      (condition) =>
        `${condition.id}: ${condition.description}${condition.detail ? ` (${condition.detail})` : ''}`
    );

  const warnings = conditions
    .filter((condition) => condition.status === 'FAIL' && condition.blocking === false)
    .map(
      (condition) =>
        `${condition.id}: ${condition.description}${condition.detail ? ` (${condition.detail})` : ''}`
    );

  const section = [
    '',
    `## Gate Check Remediation (${new Date().toISOString()})`,
    '',
    '### Failed Conditions',
    ...(failedConditions.length > 0 ? failedConditions.map((item) => `- ${item}`) : ['- (none)']),
    '',
    ...(warnings.length > 0
      ? ['### Warnings', ...warnings.map((item) => `- ${item}`), '']
      : []),
    '### Actionable Fix Steps',
    ...fixSteps.map((step, index) => `${index + 1}. ${step}`),
    '',
  ].join('\n');

  if (exists(findingsPath)) {
    appendFileSync(findingsPath, section, 'utf-8');
    return;
  }

  const initial = ['# Findings', section, ''].join('\n');
  writeFileSync(findingsPath, initial, 'utf-8');
}
