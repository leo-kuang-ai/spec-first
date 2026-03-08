import type { FirstRoleViews, FirstRuntimeSummary } from './first-runtime-types.js';

export function buildRoleViews(summary: FirstRuntimeSummary): FirstRoleViews {
  return {
    product: {
      role: 'product',
      summary: summary.project.overview ?? '项目背景待补充',
      focus: [...summary.capabilities],
      warnings: [...summary.risks],
    },
    dev: {
      role: 'dev',
      summary: summary.project.overview ?? '研发背景待补充',
      focus: [...summary.modules],
      warnings: [...summary.risks],
    },
    qa: {
      role: 'qa',
      summary: summary.project.overview ?? '验证背景待补充',
      focus: [...summary.risks],
      warnings: [...summary.evidence],
    },
    architect: {
      role: 'architect',
      summary: summary.project.overview ?? '架构背景待补充',
      focus: [summary.project.platformType ?? 'unknown-platform', ...summary.entryPoints],
      warnings: [...summary.risks],
    },
  };
}
