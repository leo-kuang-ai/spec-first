/**
 * metrics CLI 命令组
 * spec-first metrics report|health <featureId>
 */
import { ExitCode, type StageState } from '../../shared/types.js';
import { exists, readJson } from '../../shared/fs-utils.js';
import { join } from 'node:path';
import {
  findBrokenDocumentReferences,
  listMissingDocumentFiles,
  loadDocumentLinks,
} from '../../core/document-links.js';
import { calcHealthScore, type DocumentMetrics } from '../../core/metrics-engine/health-score.js';
import { detectBottlenecks } from '../../core/metrics-engine/bottleneck.js';

export function handleMetrics(args: string[]): number {
  const sub = args[0];
  const rest = args.slice(1);

  switch (sub) {
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

  const metrics = getDocumentMetrics(featureId, cwd);
  const state = readJson<StageState>(join(cwd, 'specs', featureId, 'stage-state.json'));
  const health = calcHealthScore(metrics, 0, 0);
  const bottlenecks = detectBottlenecks(metrics);

  console.log(`度量报告 — ${featureId} (${state.currentStage})\n`);
  console.log(`健康分：${health.H1}（${health.grade}）`);
  console.log('');
  console.log(`声明文档数: ${metrics.declaredDocCount}`);
  console.log(`已存在文档数: ${metrics.existingDocCount}`);
  console.log(`已建立引用文档数: ${metrics.linkedDocCount}`);
  console.log(`坏引用数: ${metrics.brokenReferenceCount}`);

  if (bottlenecks.length > 0) {
    console.log(`\n瓶颈项（${bottlenecks.length}）：`);
    for (const bottleneck of bottlenecks) {
      console.log(`  [${bottleneck.severity.toUpperCase()}] ${bottleneck.rule}: ${bottleneck.description}`);
      console.log(`         → ${bottleneck.suggestion}`);
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

  const metrics = getDocumentMetrics(featureId, cwd);
  const health = calcHealthScore(metrics, 0, 0);
  console.log(`健康分 — ${featureId}\n`);
  console.log(`分数：${health.H1} / 100  等级：${health.grade}`);
  return ExitCode.SUCCESS;
}

function printMetricsHelp(): void {
  console.log(`用法：spec-first metrics <subcommand>

子命令：
  report    生成文档关联度量报告
  health    展示文档流健康分`);
}

function featureExists(featureId: string, projectRoot: string): boolean {
  const statePath = join(projectRoot, 'specs', featureId, 'stage-state.json');
  return exists(statePath);
}

export function getDocumentMetrics(featureId: string, projectRoot: string): DocumentMetrics {
  const links = loadDocumentLinks(featureId, projectRoot);
  const missingFiles = listMissingDocumentFiles(links, featureId, projectRoot);
  const brokenReferences = findBrokenDocumentReferences(links);

  return {
    declaredDocCount: links.documents.length,
    existingDocCount: links.documents.length - missingFiles.length,
    linkedDocCount: links.documents.filter((doc) => doc.references.length > 0).length,
    brokenReferenceCount: brokenReferences.length,
  };
}
