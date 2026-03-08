import type {
  FirstCodeView,
  FirstDesignView,
  FirstRuntimeSummary,
  FirstSpecView,
  FirstStageViews,
  FirstVerifyView,
} from './first-runtime-types.js';

function countLabel(count: number, unit: string): string {
  return `${count} ${unit}`;
}

function buildSpecView(summary: FirstRuntimeSummary): FirstSpecView {
  return {
    stage: 'spec',
    summary: `${summary.project.name} 需求视图：${countLabel(summary.capabilities.length, '项能力')}，${countLabel(summary.dataModels.length, '个核心实体')}，${countLabel(summary.risks.length, '个风险点')}`,
    businessCapabilities: [...summary.capabilities],
    coreEntities: [...summary.dataModels],
    dependencies: summary.apiSurface.map(item => `接口: ${item}`),
    warnings: [...summary.risks],
  };
}

function buildDesignView(summary: FirstRuntimeSummary): FirstDesignView {
  return {
    stage: 'design',
    summary: `${summary.project.name} 设计视图：${countLabel(summary.modules.length, '个模块边界')}，${countLabel(summary.apiSurface.length, '个集成点')}，${countLabel(summary.risks.length, '个风险点')}`,
    moduleBoundaries: [...summary.modules],
    integrationPoints: [...summary.apiSurface],
    technicalConstraints: [`平台类型: ${summary.project.platformType ?? 'unknown'}`],
    risks: [...summary.risks],
  };
}

function buildCodeView(summary: FirstRuntimeSummary): FirstCodeView {
  return {
    stage: 'code',
    summary: `${summary.project.name} 代码视图：${countLabel(summary.entryPoints.length, '个入口')}，${countLabel(summary.modules.length, '个潜在改动区')}，${countLabel(summary.risks.length, '个变更风险')}`,
    entryPoints: [...summary.entryPoints],
    likelyChangeAreas: [...summary.modules],
    callPathHints: summary.entryPoints.map(item => `入口 -> ${item}`),
    couplingPoints: summary.modules.map(item => `模块耦合: ${item}`),
    changeHazards: [...summary.risks],
    verificationHooks: [...summary.evidence],
  };
}

function buildVerifyView(summary: FirstRuntimeSummary): FirstVerifyView {
  return {
    stage: 'verify',
    summary: `${summary.project.name} 验证视图：${countLabel(summary.capabilities.length, '项能力')}，${countLabel(summary.entryPoints.length, '条关键链路')}，${countLabel(summary.risks.length, '个发布风险')}`,
    criticalFlows: summary.entryPoints.map(item => `入口链路: ${item}`),
    validationFocus: [
      ...summary.capabilities.map(item => `能力验证: ${item}`),
      ...summary.risks.map(item => `风险验证: ${item}`),
    ],
    testFocus: [...summary.capabilities],
    riskAreas: [...summary.risks],
    recommendedChecks: summary.evidence.map(item => `证据核对: ${item}`),
    validationHooks: [...summary.evidence],
    releaseBlockers: [...summary.risks],
  };
}

export function buildStageViews(summary: FirstRuntimeSummary): FirstStageViews {
  return {
    spec: buildSpecView(summary),
    design: buildDesignView(summary),
    code: buildCodeView(summary),
    verify: buildVerifyView(summary),
  };
}
