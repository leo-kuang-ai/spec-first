/**
 * Skill Command Parsing & Route Dispatch
 * 解析 /spec-first:* 命令，分发到 Skill 路由或 Runtime 路由
 */
import { join } from 'node:path';
import { readFileSync, readdirSync } from 'node:fs';
import { exists } from '../../shared/fs-utils.js';
import { loadConfig } from '../../shared/config-schema.js';
import { assemblePrompt, resolvePromptAssemblyContext, validateKvCacheStability } from './prompt-assembler.js';
import { buildHardGateRuntimeNotice } from './hard-gate.js';
import { loadEnabledExtensions } from '../process-engine/extensions.js';
import { validateOrchestrateArgs, type OrchestrateArgs } from './orchestrate-args.js';
import { validateFirstArgs, resolveFirstConfirmPolicy, resolveFirstModePolicy, type FirstArgs } from './first-args.js';
import { generateResumeRecommendation, formatResumePrompt, formatProductSummary } from './first-resume.js';
import { formatHealthStatus, formatChangeAnalysis, checkFirstUpdateContext } from './first-change-detector.js';

export interface DispatchResult {
  route: 'skill' | 'runtime' | 'error';
  skillName?: string;
  command?: string;
  args?: string[];
  skillPath?: string;
  error?: string;
  /** orchestrate 专用：解析后的参数（仅 skillName=orchestrate 时存在） */
  orchestrateArgs?: OrchestrateArgs;
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
  if (skillName !== 'code-review' && skillName !== 'verify') {
    return { ok: true, args };
  }

  const idx = args.indexOf('--layer');
  const defaultLayer = skillName === 'code-review' ? 'cross' : 'completion';
  if (idx === -1) {
    return { ok: true, args: normalizeLayerArgs(args, defaultLayer) };
  }

  const value = args[idx + 1];
  if (!value || value.startsWith('--')) {
    return { ok: false, error: `Invalid --layer value for ${skillName}: missing layer name` };
  }
  const layer = value.toLowerCase();
  const allowed = skillName === 'code-review' ? REVIEW_LAYERS : VERIFY_LAYERS;
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
export function dispatchCommand(
  input: string,
  projectRoot: string,
): DispatchResult {
  const parts = input.trim().split(/\s+/);
  const first = parts[0];
  const rest = parts.slice(1);

  // 解析 namespace:subcommand
  let skillName: string;
  if (first.includes(':')) {
    skillName = first.split(':')[1];
  } else {
    skillName = first;
  }

  if (!skillName) {
    return { route: 'error', error: 'Empty command' };
  }

  // 检查语义映射
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

  // 检查 Runtime 路由
  if (RUNTIME_COMMANDS.has(skillName)) {
    return {
      route: 'runtime',
      command: skillName,
      args: rest,
    };
  }

  // Skill 路由：查找 Skill 文件
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

    // orchestrate 专用参数校验（V2-13§4.5）
    if (skillName === 'orchestrate') {
      try {
        const orchestrateArgs = validateOrchestrateArgs(normalizedRest);
        return {
          route: 'skill',
          skillName,
          args: normalizedRest,
          skillPath,
          orchestrateArgs,
        };
      } catch (e) {
        return {
          route: 'error',
          error: e instanceof Error ? e.message : String(e),
        };
      }
    }

    // first 专用参数校验（quick/deep 模式）
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
  const hardGateNotice = buildHardGateRuntimeNotice(skillName, projectRoot);
  if (hardGateNotice) {
    content = `${hardGateNotice}\n\n${content}`;
  }

  // first skill: 注入会话恢复 + 变更检测上下文
  if (skillName === 'first') {
    const firstNotice = buildFirstRuntimeNotice(projectRoot);
    if (firstNotice) {
      content = `${firstNotice}\n\n${content}`;
    }
  }

  return content;
}

/**
 * 构建 first skill 运行时上下文通知
 * 检测已有产物、变更状态、会话恢复建议，注入到 skill prompt 前部
 */
function buildFirstRuntimeNotice(projectRoot: string): string | undefined {
  const firstDir = join(projectRoot, 'docs', 'first');
  const resume = generateResumeRecommendation(firstDir, projectRoot);

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
  const summary = formatProductSummary(firstDir);
  if (summary && !summary.startsWith('❌')) {
    parts.push('');
    parts.push(summary);
  }

  parts.push('<!-- /first-runtime-context -->');
  return parts.join('\n');
}

export function getFirstRuntimeNotice(projectRoot: string): string | undefined {
  return buildFirstRuntimeNotice(projectRoot);
}

function inferSkillNameFromPath(skillPath: string): string {
  const normalized = skillPath.replace(/\\/g, '/');
  const match = normalized.match(/\/\d+-([^/]+)\/SKILL\.md$/);
  if (!match) return '';
  return match[1] ?? '';
}
