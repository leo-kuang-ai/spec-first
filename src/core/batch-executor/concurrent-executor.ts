/**
 * 并发执行器（阶段 3）
 */
import type { ExecutionPlan, BatchExecutionResult, TaskResult, LayerResult, TaskNode } from './types.js';
import { saveCheckpoint } from './checkpoint.js';
import { generateReport } from './report-generator.js';
import { ProgressTracker } from './progress-tracker.js';
import { packContext } from './context-packer.js';
import { loadConfig } from '../../shared/config-schema.js';

export async function executeConcurrent(
  plan: ExecutionPlan,
  projectRoot: string,
): Promise<BatchExecutionResult> {
  const cfg = loadConfig(projectRoot);
  const maxParallel = cfg.runtime?.auto_orchestrate?.max_parallel || 2;

  const layerResults: LayerResult[] = [];
  const completedTasks: string[] = [];
  const failedTasks: string[] = [];
  let halted = false;
  let haltReason: string | undefined;

  const startTime = new Date().toISOString();
  const tracker = new ProgressTracker(plan.layers.length, plan.totalTasks);

  for (const layer of plan.layers) {
    tracker.startLayer(layer.layer);

    const results = layer.concurrent
      ? await executeLayerConcurrent(layer.tasks, maxParallel, plan.featureId, projectRoot, tracker)
      : await executeLayerSerial(layer.tasks, plan.featureId, projectRoot, tracker);

    const failureCount = results.filter(r => !r.success).length;
    const failureRate = failureCount / results.length;

    layerResults.push({
      layer: layer.layer,
      results,
      failureRate,
    });

    for (const result of results) {
      if (result.success) {
        completedTasks.push(result.taskId);
      } else {
        failedTasks.push(result.taskId);
      }
    }

    saveCheckpoint({
      featureId: plan.featureId,
      currentLayer: layer.layer,
      completedTasks,
      failedTasks,
      startTime,
      lastUpdateTime: new Date().toISOString(),
      layerResults,
    }, projectRoot);

    if (failureRate > 0.5) {
      halted = true;
      haltReason = `Layer ${layer.layer} 失败率 ${(failureRate * 100).toFixed(1)}% > 50%`;
      break;
    }
  }

  const allResults = layerResults.flatMap(l => l.results);
  const result: BatchExecutionResult = {
    featureId: plan.featureId,
    totalTasks: plan.totalTasks,
    successCount: allResults.filter(r => r.success).length,
    failureCount: allResults.filter(r => !r.success).length,
    blockedCount: 0,
    layers: layerResults,
    halted,
    haltReason,
  };

  generateReport(result, projectRoot);
  return result;
}

async function executeLayerConcurrent(
  tasks: TaskNode[],
  maxParallel: number,
  featureId: string,
  projectRoot: string,
  tracker: ProgressTracker,
): Promise<TaskResult[]> {
  const results: TaskResult[] = [];
  const chunks = chunkArray(tasks, maxParallel);

  for (const chunk of chunks) {
    const promises = chunk.map(task => {
      tracker.startTask(task.id);
      return executeTask(task, featureId, projectRoot);
    });

    const chunkResults = await Promise.all(promises);
    chunkResults.forEach((r) => {
      tracker.completeTask(r.success);
      results.push(r);
    });
  }

  return results;
}

async function executeLayerSerial(
  tasks: TaskNode[],
  featureId: string,
  projectRoot: string,
  tracker: ProgressTracker,
): Promise<TaskResult[]> {
  const results: TaskResult[] = [];

  for (const task of tasks) {
    tracker.startTask(task.id);
    const result = await executeTask(task, featureId, projectRoot);
    tracker.completeTask(result.success);
    results.push(result);
  }

  return results;
}

async function executeTask(
  task: TaskNode,
  featureId: string,
  projectRoot: string,
): Promise<TaskResult> {
  const startTime = Date.now();

  try {
    packContext(task, featureId, projectRoot);

    // TODO: 调用 Agent tool
    // Agent({
    //   subagent_type: "implement",
    //   prompt: JSON.stringify(contextPack),
    //   run_in_background: true
    // });

    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      taskId: task.id,
      success: true,
      message: '执行成功',
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

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
