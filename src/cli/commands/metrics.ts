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
  { key: 'C1', name: 'Design Coverage', target: 0.8 },
  { key: 'C2', name: 'API Coverage', target: 0.8 },
  { key: 'C3', name: 'Task Coverage', target: 0.8 },
  { key: 'C4', name: 'Test Coverage (FR)', target: 0.8 },
  { key: 'C5', name: 'Test Coverage (AC)', target: 0.6 },
  { key: 'C6', name: 'Impl Coverage', target: 0.8 },
  { key: 'C7', name: 'PR Compliance', target: 0.9 },
  { key: 'C8', name: 'Task Compliance', target: 0.8 },
  { key: 'C9', name: 'TC Compliance', target: 0.8 },
];

export function handleMetrics(args: string[]): number {
  const sub = args[0];
  const rest = args.slice(1);

  switch (sub) {
    case 'coverage': return handleCoverage(rest);
    case 'report': return handleReport(rest);
    case 'health': return handleHealth(rest);
    default:
      if (sub) console.error(`Unknown metrics subcommand: ${sub}`);
      printMetricsHelp();
      return ExitCode.VALIDATION_ERROR;
  }
}

function handleCoverage(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('Usage: spec-first metrics coverage <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }
  if (!featureExists(featureId, process.cwd())) {
    console.error(`Feature not found: ${featureId}`);
    return ExitCode.VALIDATION_ERROR;
  }

  try {
    const metrics = getCoverage(featureId, process.cwd());
    const record = metrics as unknown as Record<string, number>;

    console.log(`Coverage Report — ${featureId}\n`);
    console.log('Metric'.padEnd(25) + 'Current'.padEnd(10) + 'Target'.padEnd(10) + 'Status');
    console.log('-'.repeat(55));

    let allPass = true;
    for (const def of METRIC_DEFS) {
      const current = record[def.key] ?? 0;
      const pass = current >= def.target;
      if (!pass) allPass = false;
      const status = pass ? 'PASS' : 'FAIL *';
      console.log(
        `${def.key} ${def.name}`.padEnd(25) +
        `${(current * 100).toFixed(1)}%`.padEnd(10) +
        `${(def.target * 100).toFixed(0)}%`.padEnd(10) +
        status,
      );
    }

    if (!allPass) {
      console.log('\n* 未达标指标需要关注');
    }
    return ExitCode.SUCCESS;
  } catch (e) {
    console.error(`Error: ${(e as Error).message}`);
    return ExitCode.IO_ERROR;
  }
}

function printMetricsHelp(): void {
  console.log(`Usage: spec-first metrics <subcommand>

Subcommands:
  coverage  Show C1-C9 coverage metrics for a Feature
  report    Generate complete metrics report
  health    Show health score and key risks`);
}

function handleReport(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('Usage: spec-first metrics report <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }
  if (!featureExists(featureId, process.cwd())) {
    console.error(`Feature not found: ${featureId}`);
    return ExitCode.VALIDATION_ERROR;
  }

  const coverage = getCoverage(featureId, process.cwd());
  const health = calcHealthScore(coverage, 0, 0);
  const bottlenecks = detectBottlenecks(coverage);

  console.log(`Metrics Report — ${featureId}\n`);
  console.log(`Health Score: ${health.H1} (${health.grade})\n`);

  console.log('Coverage:');
  const record = coverage as unknown as Record<string, number>;
  for (const def of METRIC_DEFS) {
    const val = record[def.key] ?? 0;
    console.log(`  ${def.key} ${def.name.padEnd(22)} ${(val * 100).toFixed(1)}%`);
  }

  if (bottlenecks.length > 0) {
    console.log(`\nBottlenecks (${bottlenecks.length}):`);
    for (const b of bottlenecks) {
      console.log(`  [${b.severity.toUpperCase()}] ${b.rule}: ${b.description}`);
      console.log(`         → ${b.suggestion}`);
    }
  } else {
    console.log('\nNo bottlenecks detected.');
  }

  return ExitCode.SUCCESS;
}

function handleHealth(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('Usage: spec-first metrics health <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }
  if (!featureExists(featureId, process.cwd())) {
    console.error(`Feature not found: ${featureId}`);
    return ExitCode.VALIDATION_ERROR;
  }

  const coverage = getCoverage(featureId, process.cwd());
  const health = calcHealthScore(coverage, 0, 0);
  const bottlenecks = detectBottlenecks(coverage);

  console.log(`Health — ${featureId}\n`);
  console.log(`Score: ${health.H1} / 100  Grade: ${health.grade}`);

  if (bottlenecks.length > 0) {
    console.log(`\nKey Risks (${bottlenecks.length}):`);
    for (const b of bottlenecks) {
      console.log(`  ${b.rule}: ${b.description}`);
    }
  } else {
    console.log('\nNo risks identified.');
  }

  return ExitCode.SUCCESS;
}

function featureExists(featureId: string, projectRoot: string): boolean {
  const statePath = join(projectRoot, 'specs', featureId, 'stage-state.json');
  return exists(statePath);
}
