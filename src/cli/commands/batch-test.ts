/**
 * 批量执行测试命令（临时）
 */
import { ExitCode } from '../../shared/types.js';
import { resolveFeatureId, currentFeature } from '../../core/process-engine/feature.js';
import { generateExecutionPlan, executeConcurrent } from '../../core/batch-executor/index.js';
import { readTaskPlan, toTaskNodes } from '../../core/task-plan/parser.js';

export async function handleBatchTest(args: string[]): Promise<number> {
  try {
    const projectRoot = process.cwd();
    const featureId = args[0] || currentFeature(projectRoot);

    if (!featureId) {
      console.error('请提供 featureId 或设置当前 Feature');
      return ExitCode.INVALID_ARGS;
    }

    const { featureId: resolvedId } = resolveFeatureId(featureId, projectRoot);

    // 读取 task_plan.md 解析 TASK
    const parsedPlan = readTaskPlan(projectRoot, resolvedId);
    const tasks = parsedPlan ? toTaskNodes(parsedPlan) : [];

    console.log(`\n📋 批量执行计划`);
    console.log(`Feature: ${resolvedId}`);
    console.log(`总任务数: ${tasks.length}\n`);

    const plan = generateExecutionPlan(tasks, resolvedId, projectRoot);

    console.log(`分层结果:`);
    for (const layer of plan.layers) {
      const mode = layer.concurrent ? '并发' : '串行';
      console.log(`  Layer ${layer.layer} (${mode}): ${layer.tasks.map(t => t.id).join(', ')}`);
    }

    if (plan.tddWarnings.length > 0) {
      console.log(`\n⚠️  TDD 警告:`);
      plan.tddWarnings.forEach(w => console.log(`  - ${w}`));
    }

    if (plan.riskWarnings.length > 0) {
      console.log(`\n⚠️  风险警告:`);
      plan.riskWarnings.forEach(w => console.log(`  - ${w}`));
    }

    console.log(`\n开始执行...\n`);

    const result = await executeConcurrent(plan, projectRoot);

    console.log(`\n✅ 执行完成`);
    console.log(`成功: ${result.successCount}/${result.totalTasks}`);
    console.log(`失败: ${result.failureCount}`);
    console.log(`报告: specs/${resolvedId}/batch-report.md`);

    return result.failureCount > 0 ? ExitCode.GENERAL_ERROR : ExitCode.SUCCESS;
  } catch (error) {
    console.error('批量执行失败:', error instanceof Error ? error.message : error);
    return ExitCode.GENERAL_ERROR;
  }
}
