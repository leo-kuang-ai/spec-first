/**
 * Spec-First Skill dual-host registrar
 *
 * - Claude Code: <detected claude commands dir>/spec-first/<skill>.md  (=> /spec-first:<skill>)
 * - Codex: <detected codex skills dir>/spec-first/<skill> (symlinks to package skill dirs)
 * - Project-level: {projectRoot}/.claude/commands/ (Claude Code only)
 *
 * Command files reference absolute SKILL.md paths inside the spec-first package.
 */
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, readlinkSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
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

const SKILL_DESCRIPTION_ZH: Readonly<Record<string, string>> = {
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
};

interface SkillEntry {
  /** 命令文件名（兼容旧逻辑） */
  commandName: string;
  /** SKILL.md 绝对路径 */
  skillPath: string;
  /** skill 目录绝对路径（用于 Codex 符号链接） */
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

/** 从 SKILL.md 提取简短描述：取 Phases 第一条作为摘要 */
function extractDescription(content: string): string {
  const match = content.match(/^- P0:\s*(.+)$/m);
  if (match) return match[1].trim();
  const trigger = content.match(/^- Command:\s*`([^`]+)`/m);
  return trigger ? trigger[1] : 'Spec-First Skill';
}

/** 扫描 skills/spec-first/ 目录，返回需要生成命令入口的 Skill 列表 */
export function discoverSkills(): SkillEntry[] {
  const skillsRoot = resolveSkillsRoot();
  if (!skillsRoot) return [];

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
}

export interface SkillCommandOptions {
  /** true = 全局（~/.claude/commands/ + ~/.codex/skills/），false = 项目级（仅 .claude/commands/） */
  global?: boolean;
  /** true = 仅收集待注册列表，不执行任何文件写入 */
  dryRun?: boolean;
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

function ensureCodexSkills(skills: SkillEntry[], codexSkillsDir: string, dryRun?: boolean): string[] {
  if (!dryRun) {
    mkdirSync(codexSkillsDir, { recursive: true });
    cleanupLegacyCodexSkills(codexSkillsDir, skills);
  }
  const namespaceDir = join(codexSkillsDir, 'spec-first');
  if (!dryRun) {
    mkdirSync(namespaceDir, { recursive: true });
  }
  const created: string[] = [];

  for (const entry of skills) {
    if (dryRun) {
      created.push(`spec-first:${entry.skillName}`);
      continue;
    }
    const target = join(namespaceDir, entry.skillName);
    try {
      const st = lstatSync(target);
      if (st.isSymbolicLink()) {
        if (readlinkSync(target) === entry.skillDir) {
          created.push(`spec-first:${entry.skillName}`);
          continue;
        }
        unlinkSync(target);
      } else {
        rmSync(target, { recursive: true, force: true });
      }
    } catch {
      // target path does not exist
    }

    try {
      symlinkSync(entry.skillDir, target);
    } catch (e) {
      const error = e as NodeJS.ErrnoException;
      if (error.code === 'EEXIST') {
        created.push(`spec-first:${entry.skillName}`);
        continue;
      }
      throw e;
    }
    created.push(`spec-first:${entry.skillName}`);
  }

  return created;
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
 * - global=true：写入 ~/.claude/commands/ + ~/.codex/skills/（全局安装）
 * - global=false：仅写入 {projectRoot}/.claude/commands/（项目 init）
 */
export function ensureSkillCommands(projectRoot: string, options?: SkillCommandOptions): SkillCommandResult {
  const skills = discoverSkills();
  const isGlobal = options?.global ?? false;
  const dryRun = options?.dryRun;
  const hostPaths = detectHostPaths();

  const claudeDir = isGlobal
    ? hostPaths.claudeCommandsDir
    : join(projectRoot, '.claude', 'commands');

  const claude = ensureClaudeCommands(claudeDir, skills, dryRun);
  const codex = isGlobal ? ensureCodexSkills(skills, hostPaths.codexSkillsDir, dryRun) : [];

  return { claude, codex };
}
