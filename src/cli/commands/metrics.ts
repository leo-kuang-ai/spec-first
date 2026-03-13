/**
 * metrics CLI 命令组
 * spec-first metrics coverage <featureId>
 */
import { ExitCode, type StageState } from '../../shared/types.js';
import { getCoverage } from '../../core/trace-engine/coverage.js';
import { calcHealthScore } from '../../core/metrics-engine/health-score.js';
import { detectBottlenecks } from '../../core/metrics-engine/bottleneck.js';
import { exists, readJson } from '../../shared/fs-utils.js';
import { join } from 'node:path';
import { getStageMetricTargets, getAllCoreMetricDefs } from '../../core/metrics-engine/core-metric-thresholds.js';

export function handleMetrics(args: string[]): number {
  const sub = args[0];
  const rest = args.slice(1);

  switch (sub) {
    case 'coverage':
      return handleCoverage(rest);
    case 'report':
      return handleReport(rest);
    case 'health':
      return handleHealth(rest);
    default:
      if (sub) console.error(`未知 metrics 子命令：${sub}`);
      printMetricsHelp();
      return ExitCode.VALIDATION_ERROR;
  }
}

function handleCoverage(args: string[]): number {
  const jsonFlag = args.includes('--json');
  const allFlag = args.includes('--all');
  const featureId = args.find((a) => !a.startsWith('--'));

  if (!featureId) {
    console.error('用法：spec-first metrics coverage <featureId> [--json] [--all]');
    return ExitCode.VALIDATION_ERROR;
  }
  if (!featureExists(featureId, process.cwd())) {
    console.error(`未找到 Feature：${featureId}`);
    return ExitCode.VALIDATION_ERROR;
  }

  try {
    const metrics = getCoverage(featureId, process.cwd());
    const record = metrics as unknown as Record<string, number>;

    if (jsonFlag) {
      console.log(JSON.stringify(metrics, null, 2));
      return ExitCode.SUCCESS;
    }

    const state = readJson(join(process.cwd(), 'specs', featureId, 'stage-state.json')) as StageState;
    const stageTargets = getStageMetricTargets(state.currentStage);

    console.log(`覆盖率报告 — ${featureId} (${state.currentStage})\n`);

    if (allFlag) {
      const allMetrics = getAllCoreMetricDefs();
      console.log('指标'.padEnd(25) + '当前值');
      console.log('-'.repeat(35));
      for (const def of allMetrics) {
        const current = record[def.key] ?? 0;
        console.log(`${def.key} ${def.name}`.padEnd(25) + `${(current * 100).toFixed(1)}%`);
      }
      console.log('\n提示：--all 仅展示原始值，不做阶段判定');
    } else {
      console.log('指标'.padEnd(25) + '当前值'.padEnd(10) + '目标值'.padEnd(10) + '状态');
      console.log('-'.repeat(55));
      let allPass = true;
      for (const def of stageTargets) {
        const current = record[def.key] ?? 0;
        const pass = current >= def.target;
        if (!pass && def.blocking) allPass = false;
        const status = pass ? '通过' : def.blocking ? '失败 *' : '警告';
        console.log(
          `${def.key} ${def.name}`.padEnd(25) +
            `${(current * 100).toFixed(1)}%`.padEnd(10) +
            `${(def.target * 100).toFixed(0)}%`.padEnd(10) +
            status
        );
      }
      if (!allPass) {
        console.log('\n* 未达标指标需要关注');
      }
    }
    return ExitCode.SUCCESS;
  } catch (e) {
    console.error(`错误：${(e as Error).message}`);
    return ExitCode.IO_ERROR;
  }
}

function printMetricsHelp(): void {
  console.log(`用法：spec-first metrics <subcommand>

子命令：
  coverage  展示 Feature 的核心覆盖率指标 (C3/C4/C6/C8/C9)
  report    生成完整度量报告
  health    展示健康分与关键风险`);
}

function handleReport(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('用法：spec-first metrics report <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }
  const cwd = process.cwd();
  if (!featureExists(featureId, cwd)) {
    console.error(`未找到 Feature：${featureId}`);
    return ExitCode.VALIDATION_ERROR;
  }

  const statePath = join(cwd, 'specs', featureId, 'stage-state.json');
  const state = readJson<StageState>(statePath);
  const profile = state.mergedRules?.profile ?? 'default-simplified';
  const currentStage = state.currentStage;

  const coverage = getCoverage(featureId, cwd);
  const health = calcHealthScore(coverage, 0, 0);
  const bottlenecks = detectBottlenecks(coverage);
  const allMetrics = getAllCoreMetricDefs();
  const stageTargets = getStageMetricTargets(currentStage as any);
  const record = coverage as unknown as Record<string, number>;

  // ① 健康分
  console.log(`度量报告 — ${featureId} (${currentStage})\n`);
  console.log(`健康分：${health.H1}（${health.grade}） [profile=${profile}]`);
  console.log(`提示：健康分基于全量覆盖率快照，不等于当前阶段 Gate 判定\n`);

  // ② Coverage Snapshot — 全量原始值
  console.log('Coverage Snapshot：');
  for (const def of allMetrics) {
    const val = record[def.key] ?? 0;
    console.log(`  ${def.key} ${def.name.padEnd(22)} ${(val * 100).toFixed(1)}%`);
  }

  // ③ Current Stage Targets — 仅当前阶段纳入判定的指标
  if (stageTargets.length > 0) {
    console.log(`\nCurrent Stage Targets (${currentStage})：`);
    for (const t of stageTargets) {
      const current = record[t.key] ?? 0;
      const targetPct = (t.target * 100).toFixed(0);
      const currentPct = (current * 100).toFixed(1);
      const pass = current >= t.target;
      const icon = pass ? '✓' : '✗';
      console.log(`  ${icon} ${t.key} ${t.name.padEnd(22)} target=${targetPct}%  current=${currentPct}%`);
    }
  } else {
    console.log(`\nCurrent Stage Targets (${currentStage})：当前阶段无指标判定`);
  }

  // ④ Bottlenecks
  if (bottlenecks.length > 0) {
    console.log(`\n瓶颈项（${bottlenecks.length}）：`);
    for (const b of bottlenecks) {
      console.log(`  [${b.severity.toUpperCase()}] ${b.rule}: ${b.description}`);
      console.log(`         → ${b.suggestion}`);
    }
  } else {
    console.log('\n未检测到瓶颈。');
  }

  return ExitCode.SUCCESS;
}

function handleHealth(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('用法：spec-first metrics health <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }
  const cwd = process.cwd();
  if (!featureExists(featureId, cwd)) {
    console.error(`未找到 Feature：${featureId}`);
    return ExitCode.VALIDATION_ERROR;
  }

  const coverage = getCoverage(featureId, cwd);
  const health = calcHealthScore(coverage, 0, 0);
  const bottlenecks = detectBottlenecks(coverage);

  console.log(`健康分 — ${featureId}\n`);
  console.log(`分数：${health.H1} / 100  等级：${health.grade}`);
  console.log(`提示：健康分不等于当前阶段 Gate 判定，仅供参考\n`);

  if (bottlenecks.length > 0) {
    console.log(`\n关键风险（${bottlenecks.length}）：`);
    for (const b of bottlenecks) {
      console.log(`  ${b.rule}: ${b.description}`);
    }
  } else {
    console.log('\n未识别到风险。');
  }

  return ExitCode.SUCCESS;
}

function featureExists(featureId: string, projectRoot: string): boolean {
  const statePath = join(projectRoot, 'specs', featureId, 'stage-state.json');
  return exists(statePath);
}
