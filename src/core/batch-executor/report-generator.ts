/**
 * 执行报告生成器
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { BatchExecutionResult } from './types.js';

export function generateReport(
  result: BatchExecutionResult,
  projectRoot: string,
): void {
  const report = buildReportContent(result);
  const path = join(projectRoot, 'specs', result.featureId, 'batch-report.md');
  writeFileSync(path, report, 'utf-8');
}

function buildReportContent(result: BatchExecutionResult): string {
  const duration = result.layers.reduce((sum, l) =>
    sum + l.results.reduce((s, r) => s + r.duration, 0), 0
  );
  const successRate = ((result.successCount / result.totalTasks) * 100).toFixed(1);

  let content = `# 批量执行报告

**Feature**: ${result.featureId}
**总任务数**: ${result.totalTasks}
**成功**: ${result.successCount} | **失败**: ${result.failureCount} | **阻塞**: ${result.blockedCount}
**成功率**: ${successRate}%
**总耗时**: ${(duration / 1000).toFixed(1)}s

`;

  if (result.halted) {
    content += `⚠️ **执行已停止**: ${result.haltReason}\n\n`;
  }

  content += `## 分层详情\n\n`;
  for (const layer of result.layers) {
    content += `### Layer ${layer.layer}\n\n`;
    for (const task of layer.results) {
      const icon = task.success ? '✅' : '❌';
      content += `- ${icon} ${task.taskId}: ${task.message} (${task.duration}ms)\n`;
    }
    content += `\n失败率: ${(layer.failureRate * 100).toFixed(1)}%\n\n`;
  }

  const failures = result.layers.flatMap(l =>
    l.results.filter(r => !r.success)
  );

  if (failures.length > 0) {
    content += `## 失败详情\n\n`;
    for (const fail of failures) {
      content += `**${fail.taskId}**: ${fail.message}\n\n`;
    }
  }

  content += `## 下一步建议\n\n`;
  if (result.failureCount > 0) {
    content += `- 检查失败任务的错误信息\n`;
    content += `- 修复后重新执行 \`/spec-first:code\`（自动跳过已完成任务）\n`;
  } else {
    content += `- 所有任务已完成，可以执行 \`/spec-first:review\` 进行代码审查\n`;
  }

  return content;
}
