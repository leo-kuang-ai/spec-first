/**
 * Spec-First Skill dual-host registrar
 *
 * - Claude Code: <detected claude commands dir>/spec-first/<skill>.md  (=> /spec-first:<skill>)
 * - Codex: <detected codex skills dir>/spec-first/<skill> (copy from user-level dir)
 * - Project-level: {projectRoot}/.claude/commands/ (Claude Code only)
 *
 * Skills 先从 npm 包同步到用户级固定目录 ~/.spec-first/skills/spec-first/，
 * 命令文件和 Codex skills 统一引用该固定路径，避免 npm 全局路径漂移。
 */
import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectHostPaths } from './host-paths.js';

/** spec-first 包根目录（兼容 dist 产物路径与 src 源码路径） */
const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function resolveSkillsRoot(): string | undefined {
  const candidates = [
    join(PKG_ROOT, 'skills', 'spec-first'),
    join(PKG_ROOT, '..', 'skills', 'spec-first'),
  ];
  return candidates.find((candidate) => existsSync(candidate));
}

/**
 * 将 skills 从 npm 包目录同步到用户级固定目录。
 * 幂等覆盖：每次 update 时用包内最新版本覆盖。
 * 返回用户级 skills 根目录路径（如 ~/.spec-first/skills/spec-first）。
 */
function syncSkillsToUserDir(userSkillsDir: string, dryRun?: boolean): string | undefined {
  const pkgSkillsRoot = resolveSkillsRoot();
  if (!pkgSkillsRoot) return undefined;

  const targetRoot = join(userSkillsDir, 'spec-first');
  if (dryRun) return targetRoot;

  mkdirSync(targetRoot, { recursive: true });

  for (const dir of readdirSync(pkgSkillsRoot, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    const src = join(pkgSkillsRoot, dir.name);
    const dest = join(targetRoot, dir.name);
    // 覆盖式复制，确保与包内版本一致
    rmSync(dest, { recursive: true, force: true });
    cpSync(src, dest, { recursive: true });
  }

  // 同步 AGENTS.md（如存在）
  const agentsMd = join(pkgSkillsRoot, 'AGENTS.md');
  if (existsSync(agentsMd)) {
    cpSync(agentsMd, join(targetRoot, 'AGENTS.md'));
  }

  return targetRoot;
}

const SKILL_DESCRIPTION_ZH: Readonly<Record<string, string>> = {
  first: '项目快速认知：分析技术栈、代码结构、架构、API、调用链等，生成 10 份认知文档',
  init: '定位项目根目录并执行初始化预检（MCP 与 skills 检查/安装）',
  catchup: '定位当前 Feature 并恢复上下文',
  spec: '定位 Feature 并校验阶段为需求规格（01_specify）',
  design: '定位 Feature 并校验阶段为技术设计（02_design）',
  research: '定位 Feature 上下文并生成调研结论',
  task: '定位 Feature 并校验阶段为任务拆解（03_plan）',
  code: '定位进行中的 TASK 并执行代码实现',
  'code-review': '定位变更范围并执行代码审查',
  test: '定位 Feature 并校验阶段为验证测试（05_verify）',
  archive: '定位 Feature 并校验阶段为归档复盘（06_wrap_up）',
  plan: '定位 Feature 并加载当前阶段计划',
  verify: '定位 Feature 并执行阶段验收校验',
  orchestrate: '定位 Feature 并加载当前状态执行编排',
  status: '定位当前 Feature 并输出状态概览',
  doctor: '定位项目与宿主配置并执行环境诊断',
  sync: '定位 Feature 并同步追踪矩阵与状态',
  'feature-list': '列出当前项目全部 Feature',
  'feature-switch': '切换当前 Feature 上下文（更新 .spec-first/current）',
  'feature-current': '查看当前 Feature 与阶段信息',
  'spec-review': '定位 Feature 并执行需求规格质量审查（C10）',
  analyze: '执行跨产物一致性分析并生成分析报告',
};

/** 验证 Codex SKILL.md 是否包含有效 YAML frontmatter（name + description） */
function validateCodexFrontmatter(skillMdPath: string): string | undefined {
  if (!existsSync(skillMdPath)) return `SKILL.md 不存在: ${skillMdPath}`;
  const content = readFileSync(skillMdPath, 'utf-8');
  if (!content.startsWith('---')) return `缺少 YAML frontmatter 起始分隔符 ---`;
  const endIdx = content.indexOf('---', 3);
  if (endIdx < 0) return `缺少 YAML frontmatter 结束分隔符 ---`;
  const yaml = content.slice(3, endIdx);
  if (!/name\s*:/.test(yaml)) return `frontmatter 缺少 name 字段`;
  if (!/description\s*:/.test(yaml)) return `frontmatter 缺少 description 字段`;
  return undefined; // 验证通过
}

interface SkillEntry {
  /** 命令文件名（兼容旧逻辑） */
  commandName: string;
  /** SKILL.md 绝对路径 */
  skillPath: string;
  /** skill 目录绝对路径（用于 Codex 复制） */
  skillDir: string;
  /** 从 SKILL.md 第一行提取的 Skill 名称 */
  skillName: string;
  /** 命令描述 */
  description: string;
}

function sanitizeDescription(value: string): string {
  return value.replace(/`/g, '').replace(/\s+/g, ' ').trim();
}

function quoteYamlString(value: string): string {
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
  return `"${escaped}"`;
}

/** 从 SKILL.md 提取简短描述：取执行阶段第一条（P0）作为摘要 */
function extractDescription(content: string): string {
  const match = content.match(/^- P0:\s*(.+)$/m);
  if (match) return match[1].trim();
  const trigger = content.match(/^- Command:\s*`([^`]+)`/m);
  return trigger ? trigger[1] : 'Spec-First Skill';
}

/** 扫描 skills 目录，返回需要生成命令入口的 Skill 列表 */
export function discoverSkills(overrideRoot?: string): SkillEntry[] {
  const skillsRoot = overrideRoot ?? resolveSkillsRoot();
  if (!skillsRoot || !existsSync(skillsRoot)) return [];

  const entries: SkillEntry[] = [];

  for (const dir of readdirSync(skillsRoot, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;

    const skillDir = join(skillsRoot, dir.name);
    const skillMd = join(skillDir, 'SKILL.md');
    if (!existsSync(skillMd)) continue;

    const content = readFileSync(skillMd, 'utf-8');
    const nameMatch = content.match(/^#\s*Skill:\s*(\S+)/m);
    const skillName = nameMatch ? nameMatch[1] : dir.name.replace(/^\d+-/, '');

    entries.push({
      commandName: `spec-first-${skillName}`,
      skillPath: skillMd,
      skillDir,
      skillName,
      description: SKILL_DESCRIPTION_ZH[skillName] ?? extractDescription(content),
    });
  }

  return entries.sort((a, b) => a.commandName.localeCompare(b.commandName));
}

/** 生成 Claude Code 命令文件内容 */
function renderCommandFile(entry: SkillEntry): string {
  const description = quoteYamlString(sanitizeDescription(entry.description));
  return `---
description: ${description}
---

读取并执行以下完整 Skill 定义：${entry.skillPath}

用户输入：$ARGUMENTS
`;
}

export interface SkillCommandResult {
  claude: string[];
  codex: string[];
  generic: string[];
  /** Codex skill 验证警告（frontmatter 缺失或无效） */
  codexWarnings: string[];
}

export type SkillHostTarget = 'claude' | 'codex' | 'generic' | 'all';

export interface SkillCommandOptions {
  /** true = 全局（~/.claude/commands/ + ~/.codex/skills/），false = 项目级（仅 .claude/commands/） */
  global?: boolean;
  /** true = 仅收集待注册列表，不执行任何文件写入 */
  dryRun?: boolean;
  /** 指定要刷新的宿主。默认：global=claude+codex，local=claude */
  hosts?: SkillHostTarget[];
}

/**
 * 注册 Claude Code 命令入口文件。
 * 幂等覆盖：始终写入最新内容。
 */
function ensureClaudeCommands(commandsDir: string, skills: SkillEntry[], dryRun?: boolean): string[] {
  if (!dryRun) {
    mkdirSync(commandsDir, { recursive: true });
    cleanupLegacyClaudeCommands(commandsDir, skills);
  }
  const created: string[] = [];

  for (const entry of skills) {
    if (!dryRun) {
      const target = join(commandsDir, 'spec-first', `${entry.skillName}.md`);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, renderCommandFile(entry), 'utf-8');
    }
    created.push(`spec-first:${entry.skillName}`);
  }

  return created;
}

interface CodexSkillResult {
  created: string[];
  warnings: string[];
}

function ensureCodexSkills(skills: SkillEntry[], codexSkillsDir: string, dryRun?: boolean): CodexSkillResult {
  if (!dryRun) {
    mkdirSync(codexSkillsDir, { recursive: true });
    cleanupLegacyCodexSkills(codexSkillsDir, skills);
  }
  const namespaceDir = join(codexSkillsDir, 'spec-first');
  if (!dryRun) {
    mkdirSync(namespaceDir, { recursive: true });
  }
  const created: string[] = [];
  const warnings: string[] = [];

  for (const entry of skills) {
    if (dryRun) {
      created.push(`spec-first:${entry.skillName}`);
      continue;
    }
    const target = join(namespaceDir, entry.skillName);
    // 清理旧的 symlink 或目录，统一用 copy 覆盖
    try {
      const st = lstatSync(target);
      if (st.isSymbolicLink()) {
        unlinkSync(target);
      } else {
        rmSync(target, { recursive: true, force: true });
      }
    } catch {
      // target 不存在，忽略
    }
    cpSync(entry.skillDir, target, { recursive: true });
    created.push(`spec-first:${entry.skillName}`);

    // 验证复制后的 SKILL.md frontmatter
    const err = validateCodexFrontmatter(join(target, 'SKILL.md'));
    if (err) {
      warnings.push(`${entry.skillName}: ${err}`);
    }
  }

  return { created, warnings };
}

function ensureGenericSkills(skills: SkillEntry[], genericSkillsDir: string, dryRun?: boolean): string[] {
  if (!dryRun) {
    mkdirSync(genericSkillsDir, { recursive: true });
  }
  const namespaceDir = join(genericSkillsDir, 'spec-first');
  if (!dryRun) {
    mkdirSync(namespaceDir, { recursive: true });
  }

  const created: string[] = [];
  for (const entry of skills) {
    if (!dryRun) {
      const target = join(namespaceDir, entry.skillName);
      rmSync(target, { recursive: true, force: true });
      cpSync(entry.skillDir, target, { recursive: true });
    }
    created.push(`spec-first:${entry.skillName}`);
  }

  return created;
}

function resolveHosts(isGlobal: boolean, hosts?: SkillHostTarget[]): Set<'claude' | 'codex' | 'generic'> {
  if (!hosts || hosts.length === 0) {
    return new Set(isGlobal ? ['claude', 'codex'] : ['claude']);
  }

  const resolved = new Set<'claude' | 'codex' | 'generic'>();
  for (const host of hosts) {
    if (host === 'all') {
      resolved.add('claude');
      resolved.add('codex');
      resolved.add('generic');
      continue;
    }
    resolved.add(host);
  }
  return resolved;
}

function cleanupLegacyClaudeCommands(commandsDir: string, skills: SkillEntry[]): void {
  for (const entry of skills) {
    const legacy = join(commandsDir, `${entry.commandName}.md`);
    if (!existsSync(legacy)) continue;
    rmSync(legacy, { force: true });
  }
}

function cleanupLegacyCodexSkills(codexSkillsDir: string, skills: SkillEntry[]): void {
  for (const entry of skills) {
    const legacy = join(codexSkillsDir, entry.commandName);
    if (!existsSync(legacy)) continue;
    rmSync(legacy, { recursive: true, force: true });
  }
}

/**
 * 将 spec-first Skill 注册到 Claude Code 和 Codex。
 *
 * 流程：先将 skills 从 npm 包同步到 ~/.spec-first/skills/，
 * 再从该固定目录发现 skills 并注册命令入口。
 *
 * - global=true：写入 ~/.claude/commands/ + ~/.codex/skills/（全局安装）
 * - global=false：仅写入 {projectRoot}/.claude/commands/（项目 init）
 */
export function ensureSkillCommands(projectRoot: string, options?: SkillCommandOptions): SkillCommandResult {
  const isGlobal = options?.global ?? false;
  const dryRun = options?.dryRun;
  const hostPaths = detectHostPaths();
  const hosts = resolveHosts(isGlobal, options?.hosts);

  // 同步 skills 到用户级固定目录
  const userSkillsRoot = syncSkillsToUserDir(hostPaths.specFirstSkillsDir, dryRun);

  // dry-run 不执行实际复制，用户目录可能为空，回退到包源目录发现
  const skills = discoverSkills(
    dryRun && userSkillsRoot && !existsSync(userSkillsRoot) ? undefined : userSkillsRoot,
  );

  const claudeDir = isGlobal
    ? hostPaths.claudeCommandsDir
    : join(projectRoot, '.claude', 'commands');

  const claude = hosts.has('claude')
    ? ensureClaudeCommands(claudeDir, skills, dryRun)
    : [];

  const codexResult = (isGlobal && hosts.has('codex'))
    ? ensureCodexSkills(skills, hostPaths.codexSkillsDir, dryRun)
    : { created: [], warnings: [] };

  const generic = (isGlobal && hosts.has('generic'))
    ? ensureGenericSkills(skills, hostPaths.genericSkillsDir, dryRun)
    : [];

  return {
    claude,
    codex: codexResult.created,
    generic,
    codexWarnings: codexResult.warnings,
  };
}
