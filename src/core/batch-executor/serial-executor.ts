/**
 * 串行执行器（阶段 1+2）
 */
import type {
  ExecutionPlan,
  BatchExecutionResult,
  TaskResult,
  LayerResult,
  TaskNode,
} from './types.js';
import { saveCheckpoint } from './checkpoint.js';
import { generateReport } from './report-generator.js';
import { ProgressTracker } from './progress-tracker.js';

export async function executeSerial(
  plan: ExecutionPlan,
  projectRoot: string
): Promise<BatchExecutionResult> {
  const layerResults: LayerResult[] = [];
  const completedTasks: string[] = [];
  const failedTasks: string[] = [];
  let halted = false;
  let haltReason: string | undefined;

  const startTime = new Date().toISOString();
  const tracker = new ProgressTracker(plan.layers.length, plan.totalTasks);

  for (const layer of plan.layers) {
    tracker.startLayer(layer.layer);
    const results: TaskResult[] = [];

    for (const task of layer.tasks) {
      tracker.startTask(task.id);

      const result = await executeTask(task, plan.featureId, projectRoot);
      results.push(result);

      tracker.completeTask(result.success);

      if (result.success) {
        completedTasks.push(task.id);
      } else {
        failedTasks.push(task.id);
      }
    }

    const failureCount = results.filter((r) => !r.success).length;
    const failureRate = failureCount / results.length;

    layerResults.push({
      layer: layer.layer,
      results,
      failureRate,
    });

    // Checkpoint
    saveCheckpoint(
      {
        featureId: plan.featureId,
        currentLayer: layer.layer,
        completedTasks,
        failedTasks,
        startTime,
        lastUpdateTime: new Date().toISOString(),
        layerResults,
      },
      projectRoot
    );

    // 失败率控制
    if (failureRate > 0.5) {
      halted = true;
      haltReason = `Layer ${layer.layer} 失败率 ${(failureRate * 100).toFixed(1)}% > 50%`;
      break;
    }
  }

  const allResults = layerResults.flatMap((l) => l.results);
  const successCount = allResults.filter((r) => r.success).length;
  const failureCount = allResults.filter((r) => !r.success).length;

  const result: BatchExecutionResult = {
    featureId: plan.featureId,
    totalTasks: plan.totalTasks,
    successCount,
    failureCount,
    blockedCount: 0,
    layers: layerResults,
    halted,
    haltReason,
  };

  // 生成报告
  generateReport(result, projectRoot);

  return result;
}

async function executeTask(
  task: TaskNode,
  _featureId: string,
  _projectRoot: string
): Promise<TaskResult> {
  const startTime = Date.now();

  try {
    // TODO: 实际执行逻辑（调用 Agent tool）
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      taskId: task.id,
      success: true,
      message: '执行成功（占位）',
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      taskId: task.id,
      success: false,
      message: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    };
  }
}
