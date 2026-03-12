/**
 * metrics CLI 命令组
 * spec-first metrics coverage <featureId>
 */
import { ExitCode } from '../../shared/types.js';
import { getCoverage } from '../../core/trace-engine/coverage.js';
import { calcHealthScore } from '../../core/metrics-engine/health-score.js';
import { detectBottlenecks } from '../../core/metrics-engine/bottleneck.js';
import { exists } from '../../shared/fs-utils.js';
import { join } from 'node:path';

/** C1-C9 指标名称与目标值 */
const METRIC_DEFS: readonly { key: string; name: string; target: number }[] = [
  { key: 'C1', name: '设计覆盖率', target: 0.8 },
  { key: 'C2', name: 'API 覆盖率', target: 0.8 },
  { key: 'C3', name: '任务覆盖率', target: 0.8 },
  { key: 'C4', name: '测试覆盖率 (FR)', target: 0.8 },
  { key: 'C5', name: '测试覆盖率 (AC)', target: 0.6 },
  { key: 'C6', name: '实现覆盖率', target: 0.8 },
  { key: 'C7', name: 'PR 合规率', target: 0.9 },
  { key: 'C8', name: '任务合规率', target: 0.8 },
  { key: 'C9', name: 'TC 合规率', target: 0.8 },
];

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
  const featureId = args.find((a) => !a.startsWith('--'));

  if (!featureId) {
    console.error('用法：spec-first metrics coverage <featureId> [--json]');
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

    console.log(`覆盖率报告 — ${featureId}\n`);
    console.log('指标'.padEnd(25) + '当前值'.padEnd(10) + '目标值'.padEnd(10) + '状态');
    console.log('-'.repeat(55));

    let allPass = true;
    for (const def of METRIC_DEFS) {
      const current = record[def.key] ?? 0;
      const pass = current >= def.target;
      if (!pass) allPass = false;
      const status = pass ? '通过' : '失败 *';
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
    return ExitCode.SUCCESS;
  } catch (e) {
    console.error(`错误：${(e as Error).message}`);
    return ExitCode.IO_ERROR;
  }
}

function printMetricsHelp(): void {
  console.log(`用法：spec-first metrics <subcommand>

子命令：
  coverage  展示 Feature 的 C1-C9 覆盖率
  report    生成完整度量报告
  health    展示健康分与关键风险`);
}

function handleReport(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('用法：spec-first metrics report <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }
  if (!featureExists(featureId, process.cwd())) {
    console.error(`未找到 Feature：${featureId}`);
    return ExitCode.VALIDATION_ERROR;
  }

  const coverage = getCoverage(featureId, process.cwd());
  const health = calcHealthScore(coverage, 0, 0);
  const bottlenecks = detectBottlenecks(coverage);

  console.log(`度量报告 — ${featureId}\n`);
  console.log(`健康分：${health.H1}（${health.grade}）\n`);

  console.log('覆盖率：');
  const record = coverage as unknown as Record<string, number>;
  for (const def of METRIC_DEFS) {
    const val = record[def.key] ?? 0;
    console.log(`  ${def.key} ${def.name.padEnd(22)} ${(val * 100).toFixed(1)}%`);
  }

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
  if (!featureExists(featureId, process.cwd())) {
    console.error(`未找到 Feature：${featureId}`);
    return ExitCode.VALIDATION_ERROR;
  }

  const coverage = getCoverage(featureId, process.cwd());
  const health = calcHealthScore(coverage, 0, 0);
  const bottlenecks = detectBottlenecks(coverage);

  console.log(`健康分 — ${featureId}\n`);
  console.log(`分数：${health.H1} / 100  等级：${health.grade}`);

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
