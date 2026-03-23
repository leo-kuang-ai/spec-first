import { getSuggestedCommandForStage } from '../rules/truth-source.js';

/** 5-Question Reboot Test 结构（Planning-with-Files P0-2） */
export interface FiveQuestions {
  /** Q1: 当前 Feature 与阶段是什么？ */
  featureAndStage: { answer: string; gap: boolean };
  /** Q2: 当前 in_progress TASK 是什么？ */
  currentTask: { answer: string; gap: boolean };
  /** Q3: 上次中断前最后一个有效结论是什么？ */
  lastConclusion: { answer: string; gap: boolean };
  /** Q4: 当前最大阻塞是什么？ */
  currentBlocker: { answer: string; gap: boolean };
  /** Q5: 下一步最小可执行命令是什么？ */
  nextAction: { answer: string; gap: boolean };
}

export function buildCatchupSummary(
  featureId: string,
  phase: string,
  task: string | undefined,
  completed: number,
  total: number,
  missing: string[],
  todoSummary?: string,
  fiveQuestions?: FiveQuestions,
  taskContextSummary?: {
    taskId: string;
    contextSize: number;
    relatedDocumentCount: number;
  },
  backgroundInputStatus?: 'full' | 'degraded' | 'blind'
): string {
  const lines = [
    `会话恢复 — ${featureId}`,
    `阶段：${phase}`,
    task ? `当前任务：${task}` : '当前任务：无',
    `进度：${completed}/${total} 个任务`,
  ];
  if (backgroundInputStatus) {
    lines.push(`背景状态：${backgroundInputStatus}`);
  }
  if (missing.length > 0) {
    lines.push(`缺失文件（${missing.length}）：${missing.join(', ')}`);
  } else {
    lines.push('缺失文件：无');
  }
  if (todoSummary) {
    lines.push(todoSummary);
  }
  if (taskContextSummary) {
    lines.push(
      `TaskContextPack: ${taskContextSummary.taskId} ` +
        `(size=${taskContextSummary.contextSize}b, ` +
        `documents=${taskContextSummary.relatedDocumentCount})`
    );
  }

  // 5-Question Reboot Test 输出（Planning-with-Files P0-2）
  if (fiveQuestions) {
    lines.push('');
    lines.push('=== 5-Question Reboot Test ===');
    const questions = [
      ['Q1: Feature与阶段', fiveQuestions.featureAndStage],
      ['Q2: 当前TASK', fiveQuestions.currentTask],
      ['Q3: 最后结论', fiveQuestions.lastConclusion],
      ['Q4: 当前阻塞', fiveQuestions.currentBlocker],
      ['Q5: 下一步命令', fiveQuestions.nextAction],
    ] as const;
    for (const [label, q] of questions) {
      const gapMark = q.gap ? ' [GAP]' : '';
      lines.push(`${label}: ${q.answer}${gapMark}`);
    }
  }

  return lines.join('\n');
}

/** 提取 5-Question Reboot Test 答案（Planning-with-Files P0-2） */
export function extractFiveQuestions(
  featureId: string,
  phase: string,
  task: string | undefined,
  findingsContent: string,
  missingFiles: string[]
): FiveQuestions {
  // Q1: Feature 与阶段
  const featureAndStage = {
    answer: `${featureId} @ ${phase}`,
    gap: phase === 'unknown' || missingFiles.includes('stage-state.json'),
  };

  // Q2: 当前 TASK
  const currentTaskAnswer = task ?? '无 in_progress 任务';
  const currentTaskQ = {
    answer: currentTaskAnswer,
    gap: !task,
  };

  // Q3: 最后结论（从 findings.md 提取最后非空行）
  let lastConclusion = '未找到';
  let lastConclusionGap = true;
  if (findingsContent) {
    const nonEmptyLines = findingsContent
      .split('\n')
      .filter((line) => line.trim() && !line.startsWith('#'));
    if (nonEmptyLines.length > 0) {
      lastConclusion = nonEmptyLines[nonEmptyLines.length - 1].trim().slice(0, 100);
      lastConclusionGap = false;
    }
  }
  const lastConclusionQ = { answer: lastConclusion, gap: lastConclusionGap };

  // Q4: 当前阻塞（从 findings.md 提取阻塞标记，或根据 missingFiles 判断）
  let blocker = '无明确阻塞';
  let blockerGap = false;
  if (missingFiles.length > 0) {
    blocker = `缺失文件: ${missingFiles.slice(0, 3).join(', ')}${missingFiles.length > 3 ? '...' : ''}`;
    blockerGap = true;
  } else if (findingsContent) {
    const blockerMatch = findingsContent.match(/\[BLOCKED\]|\[阻塞\]|阻塞[:：]\s*(.+)/i);
    if (blockerMatch) {
      blocker = blockerMatch[1] ?? blockerMatch[0];
      blockerGap = true;
    }
  }
  const currentBlockerQ = { answer: blocker, gap: blockerGap };

  // Q5: 下一步命令（必须给出有效可执行命令）
  let nextAction = getSuggestedCommandForStage(phase, featureId);
  let nextActionGap =
    !task &&
    ![
      '01_specify',
      '02_design',
      '03_plan',
      '04_implement',
      '05_verify',
      '06_wrap_up',
      '07_release',
      '08_done',
    ].includes(phase);
  if (task) {
    nextAction = `/spec-first:code --task ${task}`;
    nextActionGap = false;
  }
  const nextActionQ = { answer: `执行 ${nextAction}`, gap: nextActionGap };

  return {
    featureAndStage,
    currentTask: currentTaskQ,
    lastConclusion: lastConclusionQ,
    currentBlocker: currentBlockerQ,
    nextAction: nextActionQ,
  };
}
