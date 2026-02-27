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

export interface DispatchResult {
  route: 'skill' | 'runtime' | 'error';
  skillName?: string;
  command?: string;
  args?: string[];
  skillPath?: string;
  error?: string;
  /** orchestrate 专用：解析后的参数（仅 skillName=orchestrate 时存在） */
  orchestrateArgs?: OrchestrateArgs;
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
    // orchestrate 专用参数校验（V2-13§4.5）
    if (skillName === 'orchestrate') {
      try {
        const orchestrateArgs = validateOrchestrateArgs(rest);
        return {
          route: 'skill',
          skillName,
          args: rest,
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

    return {
      route: 'skill',
      skillName,
      args: rest,
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

  return content;
}

function inferSkillNameFromPath(skillPath: string): string {
  const normalized = skillPath.replace(/\\/g, '/');
  const match = normalized.match(/\/\d+-([^/]+)\/SKILL\.md$/);
  if (!match) return '';
  return match[1] ?? '';
}
