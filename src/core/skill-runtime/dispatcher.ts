/**
 * Skill Command Parsing & Route Dispatch
 * 解析 /spec-first:* 命令，分发到 Skill 路由或 Runtime 路由
 */
import { dirname, join } from 'node:path';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { exists, readJson } from '../../shared/fs-utils.js';
import { loadConfig } from '../../shared/config-schema.js';
import {
  assemblePrompt,
  resolvePromptAssemblyContext,
  validateKvCacheStability,
} from './prompt-assembler.js';
import {
  buildScopeGuardRuntimeNotice,
  evaluateRuntimeScopeGuard,
  ScopeGuardBlockedError,
} from './scope-guard.js';
import {
  assessHighRiskChanges,
  buildHardGateRuntimeNotice,
  evaluateSkillHardGate,
  HardGateBlockedError,
  type HighRiskAssessment,
} from './hard-gate.js';
import { loadEnabledExtensions } from '../process-engine/extensions.js';
import {
  buildBackgroundInputGuidance,
  validateOrchestrateArgs,
  type BackgroundInputGuidance,
  type DependencyStrength,
  type OrchestrateArgs,
} from './orchestrate-args.js';
import {
  generateResumeRecommendation,
  formatResumePrompt,
  formatProductSummary,
} from './first-resume.js';
import {
  formatHealthStatus,
  formatChangeAnalysis,
  checkFirstUpdateContext,
} from './first-change-detector.js';
import {
  resolveCurrentFeatureId,
  resolveSkillContext,
  type ResolvedSkillContext,
} from './context-resolver.js';
import { type SkillExecutionContext } from './execution-context.js';
import { REMOVED_SKILLS } from '../rules/truth-source.js';
import type {
  BackgroundInputStatus as OrchestrateBackgroundInputStatus,
  FeatureState,
} from '../../shared/types.js';

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
  'id',
  'docs',
  'stage',
  'rfc',
  'defect',
  'metrics',
  'gate',
  'golive',
  'ai',
  'commit',
  'feature',
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

function parseExtensionSkillName(
  skillName: string
): { namespace: string; skill: string } | undefined {
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
  args: string[]
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
  highRiskAssessment?: HighRiskAssessment
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
  highRiskAssessment?: HighRiskAssessment
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
  featureId: string
): HighRiskAssessment | undefined {
  try {
    return assessHighRiskChanges(projectRoot, featureId);
  } catch {
    return undefined;
  }
}

function resolveOrchestrateBackgroundGuidance(executionContext: SkillExecutionContext) {
  const { projectRoot } = executionContext;
  const featureId = resolveCurrentFeatureId(projectRoot, executionContext.featureId);
  if (!featureId) return undefined;

  const statePath = join(projectRoot, 'specs', featureId, 'stage-state.json');
  if (!exists(statePath)) return undefined;

  try {
    const state = readJson<
      FeatureState & { backgroundInputStatus?: OrchestrateBackgroundInputStatus }
    >(statePath);
    const backgroundStatus = state.backgroundInputStatus ?? 'blind';
    const highRiskAssessment = resolveOrchestrateHighRiskAssessment(projectRoot, featureId);
    const dependencyStrength = resolveOrchestrateDependencyStrength(
      state.currentStage,
      highRiskAssessment
    );
    const riskCategory = resolveOrchestrateRiskCategory(state.currentStage, highRiskAssessment);
    return buildBackgroundInputGuidance(
      backgroundStatus,
      dependencyStrength,
      highRiskAssessment?.reasons ?? [],
      riskCategory
    );
  } catch {
    return undefined;
  }
}

export function dispatchCommand(input: string, projectRoot: string): DispatchResult {
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

  if (REMOVED_SKILLS.includes(skillName as (typeof REMOVED_SKILLS)[number])) {
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
        const orchestrateBackgroundGuidance = resolveOrchestrateBackgroundGuidance({
          projectRoot,
        });
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
export function resolveSkillPath(skillName: string, projectRoot: string): string | undefined {
  const extReq = parseExtensionSkillName(skillName);
  if (extReq) {
    const ext = loadEnabledExtensions(projectRoot).find(
      (item) => item.namespace === extReq.namespace
    );
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

  // 包级 skills/ 回退：从当前模块位置向上搜索可用的 skills/spec-first
  const pkgPattern = resolveBundledSkillsRoot();
  const pkgPath = pkgPattern ? findSkillFile(pkgPattern, skillName) : undefined;
  if (pkgPath) return pkgPath;

  return undefined;
}

/** 在目录中查找匹配的 Skill 文件 */
function findSkillFile(baseDir: string, skillName: string): string | undefined {
  if (!exists(baseDir)) return undefined;

  const exact = join(baseDir, skillName, 'SKILL.md');
  if (exists(exact)) return exact;

  try {
    const entries = readdirSync(baseDir);
    for (const entry of entries) {
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

function resolveBundledSkillsRoot(): string | undefined {
  // 兼容源码执行（src/core/skill-runtime）与发布包执行（dist/cli/index.js）
  // 不再依赖固定的 ../.. 层级，而是从当前模块位置逐级向上查找 skills/spec-first。
  let currentDir = dirname(fileURLToPath(import.meta.url));

  while (true) {
    const candidate = join(currentDir, 'skills', 'spec-first');
    if (exists(candidate)) {
      return candidate;
    }

    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) {
      return undefined;
    }

    currentDir = parentDir;
  }
}

/** 加载 Skill 文件内容（可选动态组装） */
export function loadSkill(
  skillPath: string,
  options?: { projectRoot?: string; featureId?: string; enableAssembly?: boolean }
): string {
  let content = ensureNextStepsPolicy(loadSkillTemplate(skillPath));
  const projectRoot = options?.projectRoot;
  const enableAssembly = options?.enableAssembly ?? Boolean(projectRoot);
  const executionContext: SkillExecutionContext | undefined = projectRoot
    ? { projectRoot, featureId: options?.featureId }
    : undefined;

  if (enableAssembly && executionContext) {
    const ctx = resolvePromptAssemblyContext(executionContext);
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

  const skillContextNotice = buildSkillFileContextNotice(skillPath);
  if (skillContextNotice) {
    content = `${skillContextNotice}\n\n${content}`;
  }

  if (!projectRoot) return content;

  const skillName = inferSkillNameFromPath(skillPath);
  const runtimeContext = executionContext as SkillExecutionContext;
  const hardGateDecision = evaluateSkillHardGate(skillName, runtimeContext);
  if (hardGateDecision.severity === 'BLOCKED') {
    throw new HardGateBlockedError(skillName, hardGateDecision);
  }

  const scopeGuardDecision = evaluateRuntimeScopeGuard(skillName, runtimeContext);
  if (scopeGuardDecision.blocked) {
    throw new ScopeGuardBlockedError(skillName, scopeGuardDecision.unmatchedFiles);
  }

  const scopeGuardNotice = buildScopeGuardRuntimeNotice(scopeGuardDecision);
  if (scopeGuardNotice) {
    content = `${scopeGuardNotice}\n\n${content}`;
  }

  const hardGateNotice = buildHardGateRuntimeNotice(skillName, runtimeContext);
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
    const orchestrateNotice = buildOrchestrateRuntimeNotice(runtimeContext);
    if (orchestrateNotice) {
      content = `${orchestrateNotice}\n\n${content}`;
    }
  }

  if (skillName === 'onboarding') {
    const onboardingNotice = buildOnboardingRuntimeNotice(runtimeContext);
    if (onboardingNotice) {
      content = `${onboardingNotice}\n\n${content}`;
    }
  }

  if (skillName === 'spec') {
    const specNotice = buildSpecRuntimeNotice(runtimeContext);
    if (specNotice) {
      content = `${specNotice}\n\n${content}`;
    }
  }

  if (skillName === 'design') {
    const designNotice = buildDesignRuntimeNotice(runtimeContext);
    if (designNotice) {
      content = `${designNotice}\n\n${content}`;
    }
  }

  if (skillName === 'task') {
    const taskNotice = buildTaskRuntimeNotice(runtimeContext);
    if (taskNotice) {
      content = `${taskNotice}\n\n${content}`;
    }
  }

  if (skillName === 'code') {
    const codeNotice = buildCodeRuntimeNotice(runtimeContext);
    if (codeNotice) {
      content = `${codeNotice}\n\n${content}`;
    }
  }

  if (skillName === 'review') {
    const reviewNotice = buildReviewRuntimeNotice(runtimeContext);
    if (reviewNotice) {
      content = `${reviewNotice}\n\n${content}`;
    }
  }

  if (skillName === 'plan') {
    const planNotice = buildPlanRuntimeNotice(runtimeContext);
    if (planNotice) {
      content = `${planNotice}\n\n${content}`;
    }
  }

  if (skillName === 'verify') {
    const verifyNotice = buildVerifyRuntimeNotice(runtimeContext);
    if (verifyNotice) {
      content = `${verifyNotice}\n\n${content}`;
    }
  }

  if (skillName === 'spec-review') {
    const specReviewNotice = buildSpecReviewRuntimeNotice(runtimeContext);
    if (specReviewNotice) {
      content = `${specReviewNotice}\n\n${content}`;
    }
  }

  return content;
}

function formatStageRuntimeNotice(
  marker: string,
  title: string,
  summaryKey: string,
  context: ResolvedSkillContext,
  extraLines: string[] = []
): string | undefined {
  if (context.source === 'none' || !context.contextSummary) return undefined;

  const parts = [`<!-- ${marker} -->`, `## ${title}`];
  parts.push(`backgroundInputStatus: ${context.backgroundInputStatus}`);
  parts.push(`data_source: ${context.source}`);
  parts.push(`${summaryKey}: ${context.contextSummary}`);
  if (context.requiredAssetNames.length > 0) {
    parts.push(`required_assets: ${context.requiredAssetNames.join(', ')}`);
  }
  if (context.optionalAssetNames.length > 0) {
    parts.push(`optional_assets: ${context.optionalAssetNames.join(', ')}`);
  }

  if (context.firstSummaryLite?.projectName) {
    parts.push(`project_name: ${context.firstSummaryLite.projectName}`);
  }

  appendDocsIndexHints(parts, context);

  parts.push(...extraLines);

  if (context.missingAssets.length > 0 && context.backgroundInputStatus !== 'full') {
    parts.push(`missing_assets: ${context.missingAssets.join(', ')}`);
  }

  if (context.missingRequiredAssets.length > 0) {
    parts.push(`missing_required_assets: ${context.missingRequiredAssets.join(', ')}`);
  }

  if (context.fallback.warning) {
    parts.push(`warning: ${context.fallback.warning}`);
  }

  if (context.recommendedAction) {
    parts.push('recommendation: 建议先运行 /spec-first:first 补全背景数据');
  }

  parts.push(`<!-- /${marker} -->`);
  return parts.join('\n');
}

function buildSkillFileContextNotice(skillPath: string): string {
  if (!isSpecFirstSkillPath(skillPath)) {
    return '';
  }

  const skillDir = dirname(skillPath);
  const referencesRoot = join(skillDir, 'references');
  const referencesStatus = exists(referencesRoot) ? 'present' : 'missing';

  return [
    '<!-- skill-files-context -->',
    '## Skill File Context',
    `skill_path: ${skillPath}`,
    `skill_dir: ${skillDir}`,
    `references_root: ${referencesRoot}`,
    `references_status: ${referencesStatus}`,
    'reference_resolution: resolve relative references against references_root',
    ...(referencesStatus === 'missing'
      ? ['warning: references directory missing; run spec-first update to resync skill assets']
      : []),
    '<!-- /skill-files-context -->',
  ].join('\n');
}

function isSpecFirstSkillPath(skillPath: string): boolean {
  const normalized = skillPath.replace(/\\/g, '/');
  return /\/skills\/spec-first\/\d+-[^/]+\/SKILL\.md$/.test(normalized);
}

function appendDocsIndexHints(parts: string[], context: ResolvedSkillContext): void {
  const docsIndex = context.docsIndex;
  if (!docsIndex || docsIndex.entries.length === 0) return;

  if (docsIndex.quickStart.length > 0) {
    parts.push(`docs_quick_start: ${docsIndex.quickStart.join(', ')}`);
  }

  const primaryDocs = docsIndex.entries.filter((entry) => entry.priority === 'primary').slice(0, 4);
  if (primaryDocs.length === 0) return;

  parts.push('docs_reference_index:');
  for (const entry of primaryDocs) {
    const relatedAssets =
      entry.relatedRuntimeAssets.length > 0
        ? ` | assets: ${entry.relatedRuntimeAssets.join(', ')}`
        : '';
    const recommendedWhen =
      entry.recommendedWhen.length > 0 ? ` | when: ${entry.recommendedWhen.join(' / ')}` : '';
    parts.push(`- ${entry.path} | ${entry.title} | ${entry.purpose}${relatedAssets}${recommendedWhen}`);
  }
}

/**
 * 构建 first skill 运行时上下文通知
 * 检测已有产物、变更状态、会话恢复建议，注入到 skill prompt 前部
 */
function buildOrchestrateRuntimeNotice(
  executionContext: SkillExecutionContext
): string | undefined {
  const guidance = resolveOrchestrateBackgroundGuidance(executionContext);
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

  try {
    const firstContext = resolveSkillContext(
      executionContext.projectRoot,
      'orchestrate',
      executionContext.featureId
    );
    if (firstContext.firstSummaryLite?.projectName) {
      parts.push(`project_name: ${firstContext.firstSummaryLite.projectName}`);
    }
    appendDocsIndexHints(parts, firstContext);
    if (firstContext.optional.apiContracts?.interfaces.length) {
      parts.push(
        `api_interfaces: ${firstContext.optional.apiContracts.interfaces.map((entry) => entry.name).join(', ')}`
      );
    }
    if (firstContext.optional.criticalFlows?.length) {
      parts.push(
        `critical_flows: ${firstContext.optional.criticalFlows.map((entry) => entry.name).join(', ')}`
      );
    }
    if (firstContext.optional.entryGuide?.length) {
      parts.push(
        `entry_categories: ${firstContext.optional.entryGuide.map((entry) => entry.taskCategory).join(', ')}`
      );
    }
    if (firstContext.missingRequiredAssets.length > 0) {
      parts.push(`missing_required_assets: ${firstContext.missingRequiredAssets.join(', ')}`);
    }
    if (firstContext.fallback.warning) {
      parts.push(`first_context_warning: ${firstContext.fallback.warning}`);
    }
  } catch {
    // ignore first context enrichment when runtime context cannot be resolved
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

function buildOnboardingRuntimeNotice(executionContext: SkillExecutionContext): string | undefined {
  try {
    const context = resolveSkillContext(
      executionContext.projectRoot,
      'onboarding',
      executionContext.featureId
    );

    if (context.source === 'runtime') {
      const steeringOverview = context.required.steering?.product.overview;
      const recommendedReads = context.optional.entryGuide?.flatMap((entry) => entry.readFirst).slice(0, 4).join(', ');
      return [
        '<!-- onboarding-runtime-context -->',
        '## Onboarding Background Available',
        `data_source: ${context.source}`,
        `required_assets: ${context.requiredAssetNames.join(', ')}`,
        ...(context.optionalAssetNames.length > 0
          ? [`optional_assets: ${context.optionalAssetNames.join(', ')}`]
          : []),
        ...(context.onboardingSummary ? [`project_summary: ${context.onboardingSummary}`] : []),
        ...(steeringOverview ? [`steering_overview: ${steeringOverview}`] : []),
        ...(recommendedReads ? [`recommended_reads: ${recommendedReads}`] : []),
        ...(context.docsIndex?.quickStart?.length
          ? [`docs_quick_start: ${context.docsIndex.quickStart.join(', ')}`]
          : []),
        'recommendation_mode: project-based',
        ...(context.missingAssets.length > 0 && context.backgroundInputStatus !== 'full'
          ? [`missing_assets: ${context.missingAssets.join(', ')}`]
          : []),
        ...(context.missingRequiredAssets.length > 0
          ? [`missing_required_assets: ${context.missingRequiredAssets.join(', ')}`]
          : []),
        '<!-- /onboarding-runtime-context -->',
      ].join('\n');
    }

    if (context.source === 'docs' && context.onboardingSummary) {
      return [
        '<!-- onboarding-runtime-context -->',
        '## Onboarding Background Available',
        `data_source: ${context.source}`,
        `project_summary: ${context.onboardingSummary}`,
        ...(context.docsIndex?.quickStart?.length
          ? [`docs_quick_start: ${context.docsIndex.quickStart.join(', ')}`]
          : []),
        ...(context.fallback.warning ? [`warning: ${context.fallback.warning}`] : []),
        'recommendation_mode: generic',
        'recommendation: 建议先运行 /spec-first:first 补全背景数据',
        '<!-- /onboarding-runtime-context -->',
      ].join('\n');
    }

    return undefined;
  } catch {
    return undefined;
  }
}

function buildSpecRuntimeNotice(executionContext: SkillExecutionContext): string | undefined {
  try {
    return formatStageRuntimeNotice(
      'spec-runtime-context',
      'Spec View Available',
      'specViewSummary',
      resolveSkillContext(executionContext.projectRoot, 'spec', executionContext.featureId),
      (() => {
        const context = resolveSkillContext(
          executionContext.projectRoot,
          'spec',
          executionContext.featureId
        );
        const convention = context.optional.conventions?.projectRules.recommendedConvention;
        return convention ? [`convention_rule: ${convention}`] : [];
      })()
    );
  } catch {
    return undefined;
  }
}

function buildDesignRuntimeNotice(executionContext: SkillExecutionContext): string | undefined {
  try {
    const { projectRoot } = executionContext;
    const context = resolveSkillContext(projectRoot, 'design', executionContext.featureId);
    const notice = formatStageRuntimeNotice(
      'design-runtime-context',
      'Design View Available',
      'designViewSummary',
      context,
      [
        ...(context.optional.steering?.tech.constraints.length
          ? [`design_constraints: ${context.optional.steering.tech.constraints.join('；')}`]
          : []),
        ...(context.optional.criticalFlows?.length
          ? [
              `critical_flows: ${context.optional.criticalFlows.map((flow) => flow.name).join(', ')}`,
            ]
          : []),
      ]
    );
    if (!notice) return undefined;

    const featureId = resolveCurrentFeatureId(projectRoot, executionContext.featureId);
    if (!featureId) return notice;

    const highRiskAssessment = resolveOrchestrateHighRiskAssessment(projectRoot, featureId);
    if (!highRiskAssessment?.isHighRisk) {
      return notice;
    }

    return notice.replace(
      '<!-- /design-runtime-context -->',
      `risk_category: formal-design-review\nrisk_signals: ${highRiskAssessment.reasons.join('；')}\n<!-- /design-runtime-context -->`
    );
  } catch {
    return undefined;
  }
}

function buildTaskRuntimeNotice(executionContext: SkillExecutionContext): string | undefined {
  try {
    const context = resolveSkillContext(
      executionContext.projectRoot,
      'task',
      executionContext.featureId
    );
    const parts = ['<!-- task-runtime-context -->', '## Task Planning Context'];
    parts.push(`backgroundInputStatus: ${context.backgroundInputStatus}`);
    parts.push(`data_source: ${context.source}`);
    parts.push('required_inputs: spec.md + design.md + document-links.yaml');
    if (context.requiredAssetNames.length > 0) {
      parts.push(`required_assets: ${context.requiredAssetNames.join(', ')}`);
    }
    if (context.optionalAssetNames.length > 0) {
      parts.push(`optional_assets: ${context.optionalAssetNames.join(', ')}`);
    }

    if (context.firstSummaryLite?.projectName) {
      parts.push(`project_name: ${context.firstSummaryLite.projectName}`);
    }
    appendDocsIndexHints(parts, context);

    if (context.optional.apiContracts?.interfaces.length) {
      parts.push(
        `api_interfaces: ${context.optional.apiContracts.interfaces.map((entry) => entry.name).join(', ')}`
      );
    }
    if (context.optional.criticalFlows?.length) {
      parts.push(
        `critical_flows: ${context.optional.criticalFlows.map((entry) => entry.name).join(', ')}`
      );
    }
    if (context.optional.entryGuide?.length) {
      parts.push(
        `entry_categories: ${context.optional.entryGuide.map((entry) => entry.taskCategory).join(', ')}`
      );
    }

    if (context.missingAssets.length > 0 && context.backgroundInputStatus !== 'full') {
      parts.push(`missing_assets: ${context.missingAssets.join(', ')}`);
    }

    if (context.missingRequiredAssets.length > 0) {
      parts.push(`missing_required_assets: ${context.missingRequiredAssets.join(', ')}`);
    }

    if (context.fallback.warning) {
      parts.push(`warning: ${context.fallback.warning}`);
    }

    if (context.recommendedAction) {
      parts.push('recommendation: 建议先运行 /spec-first:first 补全背景数据');
    }

    parts.push('<!-- /task-runtime-context -->');
    return parts.join('\n');
  } catch {
    return undefined;
  }
}

function buildCodeRuntimeNotice(executionContext: SkillExecutionContext): string | undefined {
  try {
    return formatStageRuntimeNotice(
      'code-runtime-context',
      'Code View Available',
      'codeViewSummary',
      resolveSkillContext(executionContext.projectRoot, 'code', executionContext.featureId),
      (() => {
        const context = resolveSkillContext(
          executionContext.projectRoot,
          'code',
          executionContext.featureId
        );
        return [
          ...(context.optional.entryGuide?.length
            ? [
                `entry_categories: ${context.optional.entryGuide.map((entry) => entry.taskCategory).join(', ')}`,
              ]
            : []),
          ...(context.optional.apiContracts?.interfaces.length
            ? [
                `api_interfaces: ${context.optional.apiContracts.interfaces.map((entry) => entry.name).join(', ')}`,
              ]
            : []),
        ];
      })()
    );
  } catch {
    return undefined;
  }
}

function buildReviewRuntimeNotice(executionContext: SkillExecutionContext): string | undefined {
  try {
    const { projectRoot } = executionContext;
    const context = resolveSkillContext(projectRoot, 'review', executionContext.featureId);
    const notice = formatStageRuntimeNotice(
      'review-runtime-context',
      'Review Context',
      'codeViewSummary',
      context,
      [
        ...(context.optional.entryGuide?.length
          ? [
              `entryCategories: ${context.optional.entryGuide.map((entry) => entry.taskCategory).join(', ')}`,
            ]
          : []),
        ...(context.optional.apiContracts?.interfaces.length
          ? [
              `apiInterfaces: ${context.optional.apiContracts.interfaces.map((entry) => entry.name).join(', ')}`,
            ]
          : []),
      ]
    );
    if (!notice) return undefined;

    const featureId = resolveCurrentFeatureId(projectRoot, executionContext.featureId);
    if (featureId) {
      const highRiskAssessment = resolveOrchestrateHighRiskAssessment(projectRoot, featureId);
      if (highRiskAssessment?.isHighRisk) {
        const statePath = join(projectRoot, 'specs', featureId, 'stage-state.json');
        if (exists(statePath)) {
          const state = readJson<FeatureState>(statePath);
          const riskCategory = resolveOrchestrateRiskCategory(
            state.currentStage,
            highRiskAssessment
          );
          if (riskCategory) {
            return notice.replace(
              '<!-- /review-runtime-context -->',
              `riskCategory: ${riskCategory}\nriskSignals: ${highRiskAssessment.reasons.join('；')}\n<!-- /review-runtime-context -->`
            );
          }
        }
      }
    }

    return notice;
  } catch {
    return undefined;
  }
}

function buildPlanRuntimeNotice(executionContext: SkillExecutionContext): string | undefined {
  try {
    const { projectRoot } = executionContext;
    const featureId = resolveCurrentFeatureId(projectRoot, executionContext.featureId);
    if (!featureId) return undefined;

    const statePath = join(projectRoot, 'specs', featureId, 'stage-state.json');
    if (!exists(statePath)) return undefined;

    const state = readJson<
      FeatureState & { backgroundInputStatus?: OrchestrateBackgroundInputStatus }
    >(statePath);
    const context = resolveSkillContext(projectRoot, 'plan', featureId);
    const parts = ['<!-- plan-runtime-context -->', '## Plan Context'];

    parts.push(`backgroundInputStatus: ${context.backgroundInputStatus}`);
    parts.push(`data_source: ${context.source}`);
    if (context.requiredAssetNames.length > 0) {
      parts.push(`required_assets: ${context.requiredAssetNames.join(', ')}`);
    }
    if (context.optionalAssetNames.length > 0) {
      parts.push(`optional_assets: ${context.optionalAssetNames.join(', ')}`);
    }

    if (context.firstSummaryLite?.projectName) {
      parts.push(`project_name: ${context.firstSummaryLite.projectName}`);
    }
    appendDocsIndexHints(parts, context);

    if (context.optional.apiContracts?.interfaces.length) {
      parts.push(
        `apiInterfaces: ${context.optional.apiContracts.interfaces.map((entry) => entry.name).join(', ')}`
      );
    }
    if (context.optional.criticalFlows?.length) {
      parts.push(
        `criticalFlows: ${context.optional.criticalFlows.map((entry) => entry.name).join(', ')}`
      );
    }
    if (context.optional.entryGuide?.length) {
      parts.push(
        `entryCategories: ${context.optional.entryGuide.map((entry) => entry.taskCategory).join(', ')}`
      );
    }

    const highRiskAssessment = resolveOrchestrateHighRiskAssessment(projectRoot, featureId);
    const dependencyStrength = resolveOrchestrateDependencyStrength(
      state.currentStage,
      highRiskAssessment
    );
    parts.push(`dependencyStrength: ${dependencyStrength}`);

    if (highRiskAssessment?.isHighRisk) {
      const riskCategory = resolveOrchestrateRiskCategory(state.currentStage, highRiskAssessment);
      if (riskCategory) {
        parts.push(`riskCategory: ${riskCategory}`);
        parts.push(`riskSignals: ${highRiskAssessment.reasons.join('；')}`);
      }
    }

    if (context.missingAssets.length > 0 && context.backgroundInputStatus !== 'full') {
      parts.push(`missing_assets: ${context.missingAssets.join(', ')}`);
    }

    if (context.missingRequiredAssets.length > 0) {
      parts.push(`missing_required_assets: ${context.missingRequiredAssets.join(', ')}`);
    }

    if (context.fallback.warning) {
      parts.push(`warning: ${context.fallback.warning}`);
    }

    if (context.recommendedAction) {
      parts.push('recommendation: 建议先运行 /spec-first:first 补全背景数据');
    }

    parts.push('<!-- /plan-runtime-context -->');
    return parts.join('\n');
  } catch {
    return undefined;
  }
}

function buildVerifyRuntimeNotice(executionContext: SkillExecutionContext): string | undefined {
  try {
    const { projectRoot } = executionContext;
    const context = resolveSkillContext(projectRoot, 'verify', executionContext.featureId);
    const notice = formatStageRuntimeNotice(
      'verify-runtime-context',
      'Verify View Available',
      'verifyViewSummary',
      context,
      [
        ...(context.optional.criticalFlows?.length
          ? [
              `critical_flows: ${context.optional.criticalFlows.map((entry) => entry.name).join(', ')}`,
            ]
          : []),
        ...(context.optional.conventions?.testing.recommendedConvention
          ? [`testing_convention: ${context.optional.conventions.testing.recommendedConvention}`]
          : []),
      ]
    );
    if (!notice) return undefined;

    const featureId = resolveCurrentFeatureId(projectRoot, executionContext.featureId);
    if (!featureId) return notice;

    const highRiskAssessment = resolveOrchestrateHighRiskAssessment(projectRoot, featureId);
    if (!highRiskAssessment?.isHighRisk) {
      return notice;
    }

    const statePath = join(projectRoot, 'specs', featureId, 'stage-state.json');
    if (!exists(statePath)) return notice;

    const state = readJson<FeatureState>(statePath);
    if (state.currentStage !== '05_verify') return notice;

    return notice.replace(
      '<!-- /verify-runtime-context -->',
      `risk_category: pre-release-verification\nrisk_signals: ${highRiskAssessment.reasons.join('；')}\n<!-- /verify-runtime-context -->`
    );
  } catch {
    return undefined;
  }
}

function buildSpecReviewRuntimeNotice(executionContext: SkillExecutionContext): string | undefined {
  try {
    return formatStageRuntimeNotice(
      'spec-review-runtime-context',
      'Spec Review Context',
      'specViewSummary',
      resolveSkillContext(executionContext.projectRoot, 'spec', executionContext.featureId)
    );
  } catch {
    return undefined;
  }
}

export function getFirstRuntimeNotice(projectRoot: string): string | undefined {
  return buildFirstRuntimeNotice(projectRoot);
}

export function getOrchestrateRuntimeNotice(projectRoot: string): string | undefined {
  return buildOrchestrateRuntimeNotice({ projectRoot });
}

function loadSkillTemplate(skillPath: string): string {
  const content = readFileSync(skillPath, 'utf-8').trimEnd();
  const sharedPath = resolveSharedSkillPath(skillPath);
  if (!sharedPath) return content;

  const shared = readFileSync(sharedPath, 'utf-8').trimEnd();
  if (!shared) return content;
  return `${shared}\n\n${content}`;
}

function resolveSharedSkillPath(skillPath: string): string | undefined {
  const normalized = skillPath.replace(/\\/g, '/');
  if (normalized.endsWith('/SHARED.md')) return undefined;
  const match = normalized.match(/^(.*\/skills\/spec-first)\/\d+-[^/]+\/SKILL\.md$/);
  if (!match) return undefined;
  const sharedPath = join(match[1], 'SHARED.md');
  return exists(sharedPath) ? sharedPath : undefined;
}

function inferSkillNameFromPath(skillPath: string): string {
  const normalized = skillPath.replace(/\\/g, '/');
  const match = normalized.match(/\/\d+-([^/]+)\/SKILL\.md$/);
  if (!match) return '';
  return match[1] ?? '';
}
