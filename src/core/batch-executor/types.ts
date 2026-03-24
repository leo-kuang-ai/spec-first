/**
 * 批量执行器类型定义
 * @see skills/07-code v2.0.0
 */

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';

export interface TaskNode {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  dependsOn: string[];
  status: TaskStatus;
  relatedFR: string[];
  relatedDS: string[];
}

export interface DependencyGraph {
  nodes: Map<string, TaskNode>;
  adjacencyList: Map<string, string[]>; // taskId -> [依赖的 taskId]
}

export interface TaskLayer {
  layer: number;
  tasks: TaskNode[];
  concurrent: boolean; // 是否可并发
  conflictReason?: string; // 冲突原因（如文件重叠）
}

export interface ExecutionPlan {
  featureId: string;
  totalTasks: number;
  layers: TaskLayer[];
  riskWarnings: string[]; // 风险警告
}

export interface TaskResult {
  taskId: string;
  success: boolean;
  message: string;
  duration: number;
}

export interface LayerResult {
  layer: number;
  results: TaskResult[];
  failureRate: number;
}

export interface BatchExecutionResult {
  featureId: string;
  totalTasks: number;
  successCount: number;
  failureCount: number;
  blockedCount: number;
  layers: LayerResult[];
  halted: boolean;
  haltReason?: string;
}
