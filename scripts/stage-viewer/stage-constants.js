/**
 * Stage Constants - 阶段常量定义
 * 前后端共享，确保一致性
 */

export const FLOW_STAGES = [
  { id: '00_init', label: '初始化', desc: '创建 Feature 目录与基础上下文文件。' },
  { id: '01_specify', label: '需求规格', desc: '明确需求范围、FR/NFR 与验收标准。' },
  { id: '02_design', label: '技术设计', desc: '输出技术方案、接口契约与关键设计。' },
  { id: '03_plan', label: '任务拆解', desc: '拆分任务并确定执行顺序与优先级。' },
  { id: '04_implement', label: '编码实现', desc: '完成编码并通过实现阶段质量门禁。' },
  { id: '05_verify', label: '验证测试', desc: '执行测试与回归，确认需求达成。' },
  { id: '06_wrap_up', label: '归档复盘', desc: '沉淀文档关联、归档交付物与结论。' },
  { id: '07_release', label: '发布', desc: '发布到测试环境（预留扩展，当前自动跳过）。' },
  { id: '08_done', label: '完成', desc: 'Feature 开发完成，进入终态。' },
];

export const STAGE_ORDER = FLOW_STAGES.map(s => s.id);

export const STAGE_NAMES = Object.fromEntries(
  FLOW_STAGES.map(s => [s.id, s.label])
);

export const STAGE_LABEL_MAP = {
  ...STAGE_NAMES,
  '07_release': '发布',
  '08_done': '完成',
  '09_cancelled': '取消',
};
