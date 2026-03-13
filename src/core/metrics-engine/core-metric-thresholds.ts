/**
 * 核心指标阈值统一真源
 * 从 Gate 条件定义中抽取的阶段化指标阈值
 */
import { Stage } from '../../shared/types.js';

export interface MetricTargetDef {
  key: 'C3' | 'C4' | 'C6' | 'C8' | 'C9';
  name: string;
  target: number;
  blocking: boolean;
}

/** 核心指标集合 */
export const CORE_METRICS = ['C3', 'C4', 'C6', 'C8', 'C9'] as const;

/** 获取指定阶段的核心指标阈值 */
export function getStageMetricTargets(stage: Stage): MetricTargetDef[] {
  switch (stage) {
    case Stage.PLAN:
      return [
        { key: 'C3', name: '任务覆盖率', target: 1.0, blocking: true },
        { key: 'C8', name: '任务合规率', target: 1.0, blocking: true },
      ];
    case Stage.IMPLEMENT:
      return [{ key: 'C4', name: '测试覆盖率 (FR)', target: 0.6, blocking: true }];
    case Stage.VERIFY:
      return [
        { key: 'C4', name: '测试覆盖率 (FR)', target: 0.8, blocking: true },
        { key: 'C9', name: 'TC 合规率', target: 1.0, blocking: true },
      ];
    case Stage.WRAP_UP:
      return [{ key: 'C6', name: '实现覆盖率', target: 1.0, blocking: true }];
    default:
      return [];
  }
}

/** 判断是否为核心指标 */
export function isCoreMetric(key: string): key is 'C3' | 'C4' | 'C6' | 'C8' | 'C9' {
  return CORE_METRICS.includes(key as any);
}

/** 获取所有核心指标的展示定义（用于全量展示，不含 target） */
export function getAllCoreMetricDefs(): Omit<MetricTargetDef, 'target' | 'blocking'>[] {
  return [
    { key: 'C3', name: '任务覆盖率' },
    { key: 'C4', name: '测试覆盖率 (FR)' },
    { key: 'C6', name: '实现覆盖率' },
    { key: 'C8', name: '任务合规率' },
    { key: 'C9', name: 'TC 合规率' },
  ];
}
