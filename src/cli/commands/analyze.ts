/**
 * analyze CLI 命令
 * spec-first analyze <featureId> [--out <path>]
 */
import { join } from 'node:path';
import { ExitCode } from '../../shared/types.js';
import { exists, writeMarkdown } from '../../shared/fs-utils.js';
import { analyzeArtifacts, renderAnalysisReport } from '../../core/gate-engine/sca.js';
import { parseFlag } from '../parse-utils.js';

export function handleAnalyze(args: string[]): number {
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    return ExitCode.SUCCESS;
  }

  const featureId = args[0];
  if (!featureId) {
    console.error('用法：spec-first analyze <featureId> [--out <path>]');
    return ExitCode.VALIDATION_ERROR;
  }

  const projectRoot = process.cwd();
  const featureDir = join(projectRoot, 'specs', featureId);
  if (!exists(featureDir)) {
    console.error(`未找到 Feature：${featureId}`);
    return ExitCode.VALIDATION_ERROR;
  }

  const out = parseFlag(args, '--out') ?? join('specs', featureId, 'reports', 'analysis-report.md');
  const outputPath = isAbsolutePath(out) ? out : join(projectRoot, out);

  const result = analyzeArtifacts(featureId, projectRoot);
  writeMarkdown(outputPath, renderAnalysisReport(result));

  console.log(`分析完成：${featureId}`);
  console.log(`报告：${outputPath}`);
  console.log(`CRITICAL=${result.summary.CRITICAL}, HIGH=${result.summary.HIGH}, MEDIUM=${result.summary.MEDIUM}, LOW=${result.summary.LOW}`);

  return result.summary.CRITICAL > 0 ? ExitCode.GATE_FAILED : ExitCode.SUCCESS;
}

function isAbsolutePath(input: string): boolean {
  return input.startsWith('/') || /^[A-Za-z]:\\/.test(input);
}

function printHelp(): void {
  console.log('用法：spec-first analyze <featureId> [--out <path>]');
  console.log('');
  console.log('说明：');
  console.log('  执行跨产物一致性分析并生成 analysis-report.md');
  console.log('  当存在 CRITICAL 发现时返回非 0（ExitCode=1）');
}
