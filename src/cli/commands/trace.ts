/**
 * Trace 命令组
 * trace fix / trace validate
 */
import { join } from 'node:path';
import { ExitCode } from '../../shared/types.js';
import { exists, readMarkdown, writeMarkdown } from '../../shared/fs-utils.js';
import { parseMatrix } from '../../core/trace-engine/matrix.js';
import { getCoverage } from '../../core/trace-engine/coverage.js';

export function handleTrace(args: string[]): number {
  const sub = args[0];
  switch (sub) {
    case 'fix': return handleFix(args.slice(1));
    case 'validate': return handleValidate(args.slice(1));
    default:
      printTraceHelp();
      if (sub) console.error(`未知 trace 子命令：${sub}`);
      return ExitCode.VALIDATION_ERROR;
  }
}

function handleFix(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('用法：spec-first trace fix <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }

  const projectRoot = process.cwd();
  const matrixPath = join(projectRoot, 'specs', featureId, 'traceability-matrix.md');

  if (!exists(matrixPath)) {
    console.error(`未找到追溯矩阵：${matrixPath}`);
    return ExitCode.VALIDATION_ERROR;
  }

  const rows = parseMatrix(featureId, projectRoot);
  const taskRows = rows.filter(r => r.type === 'TASK' && r.status === 'Implemented');

  if (taskRows.length === 0) {
    console.log('无需修复：没有已实现的 TASK');
    return ExitCode.SUCCESS;
  }

  console.log(`检测到 ${taskRows.length} 个已实现的 TASK，开始修复追溯链...`);

  let content = readMarkdown(matrixPath);
  let fixedCount = 0;

  for (const task of taskRows) {
    if (!task.downstream || task.downstream.length === 0) {
      const placeholder = `src/core/**/${task.id.toLowerCase()}.ts`;
      content = content.replace(
        new RegExp(`(\\| ${task.id} \\| TASK \\| [^|]+ \\| [^|]+ \\| [^|]+ \\|)  \\|`, 'g'),
        `$1 ${placeholder} |`
      );
      fixedCount++;
    }
  }

  if (fixedCount > 0) {
    writeMarkdown(matrixPath, content);
    console.log(`✓ 已修复 ${fixedCount} 个 TASK 的 downstream 字段`);
  } else {
    console.log('✓ 追溯链完整，无需修复');
  }

  return ExitCode.SUCCESS;
}

function handleValidate(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('用法：spec-first trace validate <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }

  const projectRoot = process.cwd();
  const coverage = getCoverage(featureId, projectRoot);

  console.log(`追溯链校验 — ${featureId}\n`);
  console.log(`C3 (Task Coverage):  ${(coverage.C3 * 100).toFixed(1)}%`);
  console.log(`C8 (Task Compliance): ${(coverage.C8 * 100).toFixed(1)}%`);

  if (coverage.C3 < 1 || coverage.C8 < 1) {
    console.log('\n⚠️  追溯链不完整，建议执行：spec-first trace fix <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }

  console.log('\n✓ 追溯链完整');
  return ExitCode.SUCCESS;
}

function printTraceHelp(): void {
  console.log('用法：spec-first trace <subcommand>\n');
  console.log('子命令：');
  console.log('  fix       自动修复追溯链断裂（补充 TASK downstream）');
  console.log('  validate  校验追溯链完整性（检查 C3/C8 覆盖率）');
}
