/**
 * Skill Command Parsing & Route Dispatch
 * 解析 /spec-first:* 命令，分发到 Skill 路由或 Runtime 路由
 */
import { join } from 'node:path';
import { readFileSync, readdirSync } from 'node:fs';
import { exists, readJson } from '../../shared/fs-utils.js';
import { loadConfig } from '../../shared/config-schema.js';
import { assemblePrompt, resolvePromptAssemblyContext, validateKvCacheStability } from './prompt-assembler.js';
import { assessHighRiskChanges, buildHardGateRuntimeNotice, evaluateSkillHardGate, HardGateBlockedError, type HighRiskAssessment } from './hard-gate.js';
import { readFirstRuntimeIndex, readFirstRoleViews, readFirstStageViews } from './first-runtime-store.js';
import { loadEnabledExtensions } from '../process-engine/extensions.js';
import { buildBackgroundInputGuidance, validateOrchestrateArgs, type BackgroundInputGuidance, type DependencyStrength, type OrchestrateArgs } from './orchestrate-args.js';
import { validateFirstArgs, resolveFirstConfirmPolicy, resolveFirstModePolicy, type FirstArgs } from './first-args.js';
import { generateResumeRecommendation, formatResumePrompt, formatProductSummary } from './first-resume.js';
import { formatHealthStatus, formatChangeAnalysis, checkFirstUpdateContext } from './first-change-detector.js';
import { REMOVED_SKILLS } from '../rules/truth-source.js';
import type { BackgroundInputStatus as OrchestrateBackgroundInputStatus, StageState } from '../../shared/types.js';

export interface DispatchResult {
  route: 'skill' | 'runtime' | 'error';
  skillName?: string;
  command?: string;
  args?: string[];
  skillPath?: string;
  error?: string;
  /** orchestrate 专用：解析后的参数（仅 skillName=orchestrate 时存在） */
  orchestrateArgs?: OrchestrateArgs;
  /** orchestrate 专用：按当前 Feature 阶段推导的背景治理建议 */
  orchestrateBackgroundGuidance?: BackgroundInputGuidance;
  /** first 专用：解析后的参数（仅 skillName=first 时存在） */
  firstArgs?: FirstArgs;
  /** first 专用：确认策略（仅 skillName=first 时存在） */
  firstConfirmPolicy?: 'skip' | 'require';
  /** first 专用：模式策略（仅 skillName=first 时存在） */
  firstModePolicy?: 'auto' | 'manual';
}

/** 语义子命令映射表 */
const SEMANTIC_MAP: Record<string, { command: string; argTemplate: string }> = {
  'rfc approve': { command: 'rfc', argTemplate: 'transition {0} approved' },
  'rfc reject': { command: 'rfc', argTemplate: 'transition {0} rejected' },
  'rfc close': { command: 'rfc', argTemplate: 'transition {0} closed' },
  'defect fix': { command: 'defect', argTemplate: 'update {0} {1} --status fixing' },
  'defect verify': { command: 'defect', argTemplate: 'update {0} {1} --status verified' },
};

/** Runtime 路由命令列表（直接映射 CLI 原子命令） */
const RUNTIME_COMMANDS = new Set([
  'id', 'matrix', 'stage', 'rfc', 'defect',
  'metrics', 'gate', 'golive', 'ai',
  'commit', 'feature',
]);

const NEXT_STEPS_POLICY_MARKER = '## Next Steps（Required Handoff）';
const REVIEW_LAYERS = new Set(['single', 'cross', 'completion']);
const VERIFY_LAYERS = new Set(['completion']);

function ensureNextStepsPolicy(content: string): string {
  if (content.includes(NEXT_STEPS_POLICY_MARKER) || /##\s*Next Steps/i.test(content)) {
    return content;
  }
  return `${content.trimEnd()}\n\n${NEXT_STEPS_POLICY_MARKER}

输出时必须包含 \`Next Steps\` 小节，且至少给出：
- 下一条可执行命令（1 条，含完整命令）
- 触发条件（何时执行）
- 若存在阻塞项，先决修复命令
`;
}

function parseExtensionSkillName(skillName: string): { namespace: string; skill: string } | undefined {
  const match = skillName.match(/^ext\.([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_-]+)$/);
  if (!match) return undefined;
  return { namespace: match[1], skill: match[2] };
}

function normalizeLayerArgs(args: string[], layer: string): string[] {
  const normalized: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const token = args[i];
    if (token === '--layer') {
      i++;
      continue;
    }
    normalized.push(token);
  }
  normalized.push('--layer', layer);
  return normalized;
}

function validateLayerArgs(
  skillName: string,
  args: string[],
): { ok: true; args: string[] } | { ok: false; error: string } {
  if (skillName !== 'review' && skillName !== 'verify') {
    return { ok: true, args };
  }

  const idx = args.indexOf('--layer');
  const defaultLayer = skillName === 'review' ? 'cross' : 'completion';
  if (idx === -1) {
    return { ok: true, args: normalizeLayerArgs(args, defaultLayer) };
  }

  const value = args[idx + 1];
  if (!value || value.startsWith('--')) {
    return { ok: false, error: `Invalid --layer value for ${skillName}: missing layer name` };
  }
  const layer = value.toLowerCase();
  const allowed = skillName === 'review' ? REVIEW_LAYERS : VERIFY_LAYERS;
  if (!allowed.has(layer)) {
    return {
      ok: false,
      error: `Invalid --layer "${value}" for ${skillName}. Allowed: ${[...allowed].join(', ')}`,
    };
  }
  return { ok: true, args: normalizeLayerArgs(args, layer) };
}

/**
 * 解析并分发命令
 * 格式: namespace:subcommand [args]
 * 例: spec-first:code → Skill 路由
 * 例: spec-first:rfc approve RFC-001 → 语义映射 → Runtime 路由
 */
function resolveOrchestrateDependencyStrength(
  currentStage?: string,
  highRiskAssessment?: HighRiskAssessment,
): DependencyStrength {
  let baseStrength: DependencyStrength;

  switch (currentStage) {
    case '02_design':
    case '04_implement':
    case '05_verify':
      baseStrength = 'L2';
      break;
    case '01_specify':
    case '03_plan':
    case '06_wrap_up':
    case '07_release':
    case '08_done':
    case '09_cancelled':
    case '00_init':
    default:
      baseStrength = 'L1';
      break;
  }

  if (baseStrength === 'L2' && highRiskAssessment?.isHighRisk) {
    return 'L3';
  }

  return baseStrength;
}

function resolveOrchestrateRiskCategory(
  currentStage?: string,
  highRiskAssessment?: HighRiskAssessment,
): BackgroundInputGuidance['riskCategory'] {
  if (!highRiskAssessment?.isHighRisk) return undefined;

  switch (currentStage) {
    case '02_design':
      return 'formal-design-review';
    case '04_implement':
      return 'high-risk-implementation';
    case '05_verify':
      return 'pre-release-verification';
    default:
      return undefined;
  }
}

function resolveOrchestrateHighRiskAssessment(
  projectRoot: string,
  featureId: string,
): HighRiskAssessment | undefined {
  try {
    return assessHighRiskChanges(projectRoot, featureId);
  } catch {
    return undefined;
  }
}

function readCurrentFeatureId(projectRoot: string): string | undefined {
  const currentPath = join(projectRoot, '.spec-first', 'current');
  if (!exists(currentPath)) return undefined;
  const featureId = readFileSync(currentPath, 'utf-8').trim();
  return featureId || undefined;
}

function resolveOrchestrateBackgroundGuidance(projectRoot: string) {
  const featureId = readCurrentFeatureId(projectRoot);
  if (!featureId) return undefined;

  const statePath = join(projectRoot, 'specs', featureId, 'stage-state.json');
  if (!exists(statePath)) return undefined;

  try {
    const state = readJson<StageState & { backgroundInputStatus?: OrchestrateBackgroundInputStatus }>(statePath);
    const backgroundStatus = state.backgroundInputStatus ?? 'blind';
    const highRiskAssessment = resolveOrchestrateHighRiskAssessment(projectRoot, featureId);
    const dependencyStrength = resolveOrchestrateDependencyStrength(state.currentStage, highRiskAssessment);
    const riskCategory = resolveOrchestrateRiskCategory(state.currentStage, highRiskAssessment);
    return buildBackgroundInputGuidance(
      backgroundStatus,
      dependencyStrength,
      highRiskAssessment?.reasons ?? [],
      riskCategory,
    );
  } catch {
    return undefined;
  }
}

export function dispatchCommand(
  input: string,
  projectRoot: string,
): DispatchResult {
  const parts = input.trim().split(/\s+/);
  const first = parts[0];
  const rest = parts.slice(1);

  let skillName: string;
  if (first.includes(':')) {
    skillName = first.split(':')[1];
  } else {
    skillName = first;
  }

  if (!skillName) {
    return { route: 'error', error: 'Empty command' };
  }

  if (REMOVED_SKILLS.includes(skillName as typeof REMOVED_SKILLS[number])) {
    return { route: 'error', error: `REMOVED_SKILL: ${skillName}` };
  }

  const semanticKey = `${skillName} ${rest[0] ?? ''}`.trim();
  if (SEMANTIC_MAP[semanticKey]) {
    const mapping = SEMANTIC_MAP[semanticKey];
    const mappedArgs = mapping.argTemplate
      .replace('{0}', rest[1] ?? '')
      .replace('{1}', rest[2] ?? '')
      .split(/\s+/);
    return {
      route: 'runtime',
      command: mapping.command,
      args: mappedArgs,
    };
  }

  if (RUNTIME_COMMANDS.has(skillName)) {
    return {
      route: 'runtime',
      command: skillName,
      args: rest,
    };
  }

  const skillPath = resolveSkillPath(skillName, projectRoot);
  if (skillPath) {
    const layerValidation = validateLayerArgs(skillName, rest);
    if (!layerValidation.ok) {
      return {
        route: 'error',
        error: layerValidation.error,
      };
    }
    const normalizedRest = layerValidation.args;

    if (skillName === 'orchestrate') {
      try {
        const orchestrateArgs = validateOrchestrateArgs(normalizedRest);
        const orchestrateBackgroundGuidance = resolveOrchestrateBackgroundGuidance(projectRoot);
        return {
          route: 'skill',
          skillName,
          args: normalizedRest,
          skillPath,
          orchestrateArgs,
          orchestrateBackgroundGuidance,
        };
      } catch (e) {
        return {
          route: 'error',
          error: e instanceof Error ? e.message : String(e),
        };
      }
    }

    if (skillName === 'first') {
      try {
        const firstArgs = validateFirstArgs(normalizedRest);
        const firstConfirmPolicy = resolveFirstConfirmPolicy(firstArgs);
        const firstModePolicy = resolveFirstModePolicy(firstArgs);
        return {
          route: 'skill',
          skillName,
          args: normalizedRest,
          skillPath,
          firstArgs,
          firstConfirmPolicy,
          firstModePolicy,
        };
      } catch (e) {
        return {
          route: 'error',
          error: e instanceof Error ? e.message : String(e),
        };
      }
    }

    return {
      route: 'skill',
      skillName,
      args: normalizedRest,
      skillPath,
    };
  }

  return { route: 'error', error: `SKILL_NOT_FOUND: ${skillName}` };
}

/**
 * 解析 Skill 文件路径
 * 优先级: 项目本地 skills/ → 包级 skills/ → 未找到
 */
export function resolveSkillPath(
  skillName: string,
  projectRoot: string,
): string | undefined {
  const extReq = parseExtensionSkillName(skillName);
  if (extReq) {
    const ext = loadEnabledExtensions(projectRoot).find((item) => item.namespace === extReq.namespace);
    if (!ext) return undefined;

    const direct = join(ext.skillsDir, extReq.skill, 'SKILL.md');
    if (exists(direct)) return direct;

    const prefixed = join(ext.skillsDir, 'spec-first');
    const byPrefixed = findSkillFile(prefixed, extReq.skill);
    if (byPrefixed) return byPrefixed;

    return findSkillFile(ext.skillsDir, extReq.skill);
  }

  // 项目本地 skills/ 优先
  const localPattern = join(projectRoot, 'skills', 'spec-first');
  const localPath = findSkillFile(localPattern, skillName);
  if (localPath) return localPath;

  // 包级 skills/ 回退（ESM 使用 import.meta.dirname）
  const pkgPattern = join(import.meta.dirname, '..', '..', '..', 'skills', 'spec-first');
  const pkgPath = findSkillFile(pkgPattern, skillName);
  if (pkgPath) return pkgPath;

  return undefined;
}

/** 在目录中查找匹配的 Skill 文件 */
function findSkillFile(baseDir: string, skillName: string): string | undefined {
  // 尝试 NN-skillName/SKILL.md 格式
  if (!exists(baseDir)) return undefined;

  try {
    const entries = readdirSync(baseDir);
    for (const entry of entries) {
      // 匹配 NN-skillName 格式
      if (entry.endsWith(`-${skillName}`)) {
        const skillFile = join(baseDir, entry, 'SKILL.md');
        if (exists(skillFile)) return skillFile;
      }
    }
  } catch {
    // 目录不存在
  }
  return undefined;
}

/** 加载 Skill 文件内容（可选动态组装） */
export function loadSkill(
  skillPath: string,
  options?: { projectRoot?: string; enableAssembly?: boolean },
): string {
  let content = ensureNextStepsPolicy(readFileSync(skillPath, 'utf-8'));
  const projectRoot = options?.projectRoot;
  const enableAssembly = options?.enableAssembly ?? Boolean(projectRoot);

  if (enableAssembly && projectRoot) {
    const ctx = resolvePromptAssemblyContext(projectRoot);
    content = assemblePrompt(content, ctx);
  }

  if (projectRoot) {
    const kvCheck = validateKvCacheStability(content);
    if (!kvCheck.stable) {
      const cfg = loadConfig(projectRoot);
      const issueSummary = kvCheck.issues.join('; ');
      if (cfg.runtime.kv_cache_hard_gate) {
        throw new Error(`KV-CACHE-HARD-GATE: ${issueSummary}`);
      }
      console.warn(`[spec-first] KV-Cache 稳定性告警: ${issueSummary}`);
    }
  }

  if (!projectRoot) return content;

  const skillName = inferSkillNameFromPath(skillPath);
  const hardGateDecision = evaluateSkillHardGate(skillName, projectRoot);
  if (hardGateDecision.severity === 'BLOCKED') {
    throw new HardGateBlockedError(skillName, hardGateDecision);
  }
  const hardGateNotice = buildHardGateRuntimeNotice(skillName, projectRoot);
  if (hardGateNotice) {
    content = `${hardGateNotice}\n\n${content}`;
  }

  if (skillName === 'first') {
    const firstNotice = buildFirstRuntimeNotice(projectRoot);
    if (firstNotice) {
      content = `${firstNotice}\n\n${content}`;
    }
  }

  if (skillName === 'orchestrate') {
    const orchestrateNotice = buildOrchestrateRuntimeNotice(projectRoot);
    if (orchestrateNotice) {
      content = `${orchestrateNotice}\n\n${content}`;
    }
  }

  if (skillName === 'onboarding') {
    const onboardingNotice = buildOnboardingRuntimeNotice(projectRoot);
    if (onboardingNotice) {
      content = `${onboardingNotice}\n\n${content}`;
    }
  }

  if (skillName === 'spec') {
    const specNotice = buildSpecRuntimeNotice(projectRoot);
    if (specNotice) {
      content = `${specNotice}\n\n${content}`;
    }
  }

  if (skillName === 'design') {
    const designNotice = buildDesignRuntimeNotice(projectRoot);
    if (designNotice) {
      content = `${designNotice}\n\n${content}`;
    }
  }

  if (skillName === 'task') {
    const taskNotice = buildTaskRuntimeNotice(projectRoot);
    if (taskNotice) {
      content = `${taskNotice}\n\n${content}`;
    }
  }

  if (skillName === 'code') {
    const codeNotice = buildCodeRuntimeNotice(projectRoot);
    if (codeNotice) {
      content = `${codeNotice}\n\n${content}`;
    }
  }

  if (skillName === 'review') {
    const reviewNotice = buildReviewRuntimeNotice(projectRoot);
    if (reviewNotice) {
      content = `${reviewNotice}\n\n${content}`;
    }
  }

  return content;
}

/**
 * 构建 first skill 运行时上下文通知
 * 检测已有产物、变更状态、会话恢复建议，注入到 skill prompt 前部
 */
function buildOrchestrateRuntimeNotice(projectRoot: string): string | undefined {
  const guidance = resolveOrchestrateBackgroundGuidance(projectRoot);
  if (!guidance) return undefined;

  const parts = [
    '<!-- orchestrate-runtime-context -->',
    '## Orchestrate Background Guidance',
    `background_status: ${guidance.backgroundStatus}`,
    `dependency_strength: ${guidance.dependencyStrength}`,
    `recommended_action: ${guidance.recommendedAction}`,
  ];

  if (guidance.riskCategory) {
    parts.push(`risk_category: ${guidance.riskCategory}`);
  }

  if (guidance.riskSignals?.length) {
    parts.push(`risk_signals: ${guidance.riskSignals.join('；')}`);
  }

  if (guidance.warning) {
    parts.push(`warning: ${guidance.warning}`);
  }

  parts.push('<!-- /orchestrate-runtime-context -->');
  return parts.join('\n');
}

function buildFirstRuntimeNotice(projectRoot: string): string | undefined {
  const resume = generateResumeRecommendation(projectRoot);

  if (!resume.hasExistingProducts) return undefined;

  const parts: string[] = [];
  parts.push('<!-- first-runtime-context -->');

  // 会话恢复提示
  parts.push(formatResumePrompt(resume));

  // 变更分析（如有已有产物）
  const ctx = checkFirstUpdateContext(projectRoot);
  if (ctx.hasExistingOutput) {
    parts.push('');
    parts.push(formatHealthStatus(ctx));
    if (ctx.changeAnalysis && ctx.changeAnalysis.changedFiles > 0) {
      parts.push(formatChangeAnalysis(ctx.changeAnalysis));
    }
  }

  // 产物摘要
  const summary = formatProductSummary(projectRoot);
  if (summary && !summary.startsWith('❌')) {
    parts.push('');
    parts.push(summary);
  }

  parts.push('<!-- /first-runtime-context -->');
  return parts.join('\n');
}

function buildOnboardingRuntimeNotice(projectRoot: string): string | undefined {
  try {
    const index = readFirstRuntimeIndex(projectRoot);
    if (!index?.roleViews) return undefined;

    const roleViews = readFirstRoleViews(projectRoot);
    if (!roleViews) return undefined;

    const roles = Object.keys(roleViews);
    return [
      '<!-- onboarding-runtime-context -->',
      '## Role Views Available',
      `data_source: role-views (${roles.length} roles)`,
      `available_roles: ${roles.join(', ')}`,
      'recommendation_mode: project-based',
      '<!-- /onboarding-runtime-context -->',
    ].join('\n');
  } catch {
    return undefined;
  }
}

function buildSpecRuntimeNotice(projectRoot: string): string | undefined {
  try {
    const index = readFirstRuntimeIndex(projectRoot);
    const stageViews = readFirstStageViews(projectRoot);

    if (!index || !stageViews?.spec) return undefined;

    const parts = [
      '<!-- spec-runtime-context -->',
      '## Spec View Available',
    ];

    // 背景状态
    const backgroundStatus = index.summary.healthy && index.stageViews.healthy ? 'full' : 'degraded';
    parts.push(`background_input_status: ${backgroundStatus}`);

    // spec-view 摘要
    if (stageViews.spec.summary) {
      parts.push(`spec_view_summary: ${stageViews.spec.summary}`);
    }

    // P1: degraded 模式列出缺失源
    if (backgroundStatus === 'degraded') {
      const missing: string[] = [];
      if (!index.summary.healthy) missing.push('summary');
      if (!index.roleViews.healthy) missing.push('role-views');
      if (!index.stageViews.healthy) missing.push('stage-views');
      if (missing.length > 0) {
        parts.push(`missing_assets: ${missing.join(', ')}`);
        parts.push('recommendation: 建议先运行 /spec-first:first 补全背景数据');
      }
    }

    parts.push('<!-- /spec-runtime-context -->');
    return parts.join('\n');
  } catch {
    return undefined;
  }
}

function buildDesignRuntimeNotice(projectRoot: string): string | undefined {
  try {
    const index = readFirstRuntimeIndex(projectRoot);
    const stageViews = readFirstStageViews(projectRoot);

    if (!index || !stageViews?.design) return undefined;

    const parts = [
      '<!-- design-runtime-context -->',
      '## Design View Available',
    ];

    const backgroundStatus = index.summary.healthy && index.stageViews.healthy ? 'full' : 'degraded';
    parts.push(`background_input_status: ${backgroundStatus}`);

    if (stageViews.design.summary) {
      parts.push(`design_view_summary: ${stageViews.design.summary}`);
    }

    const featureId = readCurrentFeatureId(projectRoot);
    if (featureId) {
      const highRiskAssessment = resolveOrchestrateHighRiskAssessment(projectRoot, featureId);
      if (highRiskAssessment?.isHighRisk) {
        parts.push('risk_category: formal-design-review');
        parts.push(`risk_signals: ${highRiskAssessment.reasons.join('；')}`);
      }
    }

    if (backgroundStatus === 'degraded') {
      const missing: string[] = [];
      if (!index.summary.healthy) missing.push('summary');
      if (!index.roleViews.healthy) missing.push('role-views');
      if (!index.stageViews.healthy) missing.push('stage-views');
      if (missing.length > 0) {
        parts.push(`missing_assets: ${missing.join(', ')}`);
        parts.push('recommendation: 建议先运行 /spec-first:first 补全背景数据');
      }
    }

    parts.push('<!-- /design-runtime-context -->');
    return parts.join('\n');
  } catch {
    return undefined;
  }
}

function buildTaskRuntimeNotice(projectRoot: string): string | undefined {
  try {
    const index = readFirstRuntimeIndex(projectRoot);
    if (!index) return undefined;

    const parts = [
      '<!-- task-runtime-context -->',
      '## Task Planning Context',
    ];

    const backgroundStatus = index.summary.healthy && index.stageViews.healthy ? 'full' : 'degraded';
    parts.push(`backgroundInputStatus: ${backgroundStatus}`);
    parts.push('required_inputs: spec.md + design.md + traceability-matrix.md');

    if (backgroundStatus === 'degraded') {
      const missing: string[] = [];
      if (!index.summary.healthy) missing.push('summary');
      if (!index.roleViews.healthy) missing.push('role-views');
      if (!index.stageViews.healthy) missing.push('stage-views');
      if (missing.length > 0) {
        parts.push(`missing_assets: ${missing.join(', ')}`);
        parts.push('recommendation: 建议先运行 /spec-first:first 补全背景数据');
      }
    }

    parts.push('<!-- /task-runtime-context -->');
    return parts.join('\n');
  } catch {
    return undefined;
  }
}

function buildCodeRuntimeNotice(projectRoot: string): string | undefined {
  try {
    const index = readFirstRuntimeIndex(projectRoot);
    const stageViews = readFirstStageViews(projectRoot);

    if (!index || !stageViews?.code) return undefined;

    const parts = [
      '<!-- code-runtime-context -->',
      '## Code View Available',
    ];

    const backgroundStatus = index.summary.healthy && index.stageViews.healthy ? 'full' : 'degraded';
    parts.push(`backgroundInputStatus: ${backgroundStatus}`);

    if (stageViews.code.summary) {
      parts.push(`codeViewSummary: ${stageViews.code.summary}`);
    }

    if (backgroundStatus === 'degraded') {
      const missing: string[] = [];
      if (!index.summary.healthy) missing.push('summary');
      if (!index.roleViews.healthy) missing.push('role-views');
      if (!index.stageViews.healthy) missing.push('stage-views');
      if (missing.length > 0) {
        parts.push(`missing_assets: ${missing.join(', ')}`);
        parts.push('recommendation: 建议先运行 /spec-first:first 补全背景数据');
      }
    }

    parts.push('<!-- /code-runtime-context -->');
    return parts.join('\n');
  } catch {
    return undefined;
  }
}

function buildReviewRuntimeNotice(projectRoot: string): string | undefined {
  try {
    const index = readFirstRuntimeIndex(projectRoot);
    const stageViews = readFirstStageViews(projectRoot);

    if (!index || !stageViews?.code) return undefined;

    const parts = [
      '<!-- review-runtime-context -->',
      '## Review Context',
    ];

    const backgroundStatus = index.summary.healthy && index.stageViews.healthy ? 'full' : 'degraded';
    parts.push(`backgroundInputStatus: ${backgroundStatus}`);

    if (stageViews.code.summary) {
      parts.push(`codeViewSummary: ${stageViews.code.summary}`);
    }

    const featureId = readCurrentFeatureId(projectRoot);
    if (featureId) {
      const highRiskAssessment = resolveOrchestrateHighRiskAssessment(projectRoot, featureId);
      if (highRiskAssessment?.isHighRisk) {
        const statePath = join(projectRoot, 'specs', featureId, 'stage-state.json');
        if (exists(statePath)) {
          const state = readJson<StageState>(statePath);
          const riskCategory = resolveOrchestrateRiskCategory(state.currentStage, highRiskAssessment);
          if (riskCategory) {
            parts.push(`riskCategory: ${riskCategory}`);
            parts.push(`riskSignals: ${highRiskAssessment.reasons.join('；')}`);
          }
        }
      }
    }

    if (backgroundStatus === 'degraded') {
      const missing: string[] = [];
      if (!index.summary.healthy) missing.push('summary');
      if (!index.roleViews.healthy) missing.push('role-views');
      if (!index.stageViews.healthy) missing.push('stage-views');
      if (missing.length > 0) {
        parts.push(`missing_assets: ${missing.join(', ')}`);
        parts.push('recommendation: 建议先运行 /spec-first:first 补全背景数据');
      }
    }

    parts.push('<!-- /review-runtime-context -->');
    return parts.join('\n');
  } catch {
    return undefined;
  }
}

export function getFirstRuntimeNotice(projectRoot: string): string | undefined {
  return buildFirstRuntimeNotice(projectRoot);
}

export function getOrchestrateRuntimeNotice(projectRoot: string): string | undefined {
  return buildOrchestrateRuntimeNotice(projectRoot);
}

function inferSkillNameFromPath(skillPath: string): string {
  const normalized = skillPath.replace(/\\/g, '/');
  const match = normalized.match(/\/\d+-([^/]+)\/SKILL\.md$/);
  if (!match) return '';
  return match[1] ?? '';
}
