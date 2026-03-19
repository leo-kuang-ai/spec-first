/**
 * 进度追踪器
 */
export interface ProgressState {
  currentLayer: number;
  totalLayers: number;
  currentTask: string;
  completedTasks: number;
  totalTasks: number;
}

export class ProgressTracker {
  private state: ProgressState;

  constructor(totalLayers: number, totalTasks: number) {
    this.state = {
      currentLayer: 0,
      totalLayers,
      currentTask: '',
      completedTasks: 0,
      totalTasks,
    };
  }

  startLayer(layer: number): void {
    this.state.currentLayer = layer;
    this.log(`开始 Layer ${layer}/${this.state.totalLayers - 1}`);
  }

  startTask(taskId: string): void {
    this.state.currentTask = taskId;
    this.log(`  执行 ${taskId} (${this.state.completedTasks + 1}/${this.state.totalTasks})`);
  }

  completeTask(success: boolean): void {
    this.state.completedTasks++;
    const icon = success ? '✅' : '❌';
    this.log(`  ${icon} ${this.state.currentTask}`);
  }

  private log(message: string): void {
    console.log(message);
  }

  getProgress(): number {
    return (this.state.completedTasks / this.state.totalTasks) * 100;
  }
}
