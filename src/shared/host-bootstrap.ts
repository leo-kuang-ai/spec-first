import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, renameSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { detectHostPaths, type HostPaths } from './host-paths.js';
import {
  REQUIRED_MCP_SERVERS,
  REQUIRED_SKILLS,
  type BinaryProbeCommand,
  type McpCommandSpec,
  type RequiredSkill,
  type SkillSourceLocation,
} from '../config/bootstrap-manifest.js';

export type BootstrapLevel = 'PASS' | 'FIXED' | 'WARNING' | 'ERROR';

export interface BootstrapResult {
  host: 'Codex' | 'Claude Code' | 'Common';
  category: 'MCP' | 'Skill' | 'Binary';
  name: string;
  level: BootstrapLevel;
  detail: string;
}

export interface BootstrapSummary {
  ok: boolean;
  results: BootstrapResult[];
}

export interface BootstrapOptions {
  dryRun?: boolean;
  /**
   * 是否执行 MCP 二进制可运行性探测。
   * 默认关闭：update 场景仅做“存在性检查 + 缺失补齐”，避免网络探测导致阻塞。
   */
  checkBinaries?: boolean;
}

/**
 * 原子写入 JSON 文件
 * 通过写入临时文件然后重命名来确保原子性，避免崩溃时损坏原文件
 */
function atomicWriteJson(filePath: string, data: unknown): void {
  const dir = dirname(filePath);
  mkdirSync(dir, { recursive: true });

  // 在系统临时目录创建临时文件（跨平台）
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  const tmpPath = join(tmpdir(), `spec-first-atomic-${randomSuffix}.tmp`);

  try {
    writeFileSync(tmpPath, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
    renameSync(tmpPath, filePath); // 原子操作
  } catch (e) {
    // 失败时清理临时文件
    try { unlinkSync(tmpPath); } catch {}
    throw e;
  }
}

const GIT_CLONE_TIMEOUT_MS = 120_000;

export function ensureHostBootstrap(options?: BootstrapOptions): BootstrapSummary {
  if (process.env.SPEC_FIRST_SKIP_BOOTSTRAP === '1') {
    return { ok: true, results: [] };
  }
  if (process.env.VITEST || process.env.NODE_ENV === 'test') {
    return { ok: true, results: [] };
  }

  const dryRun = options?.dryRun ?? false;
  const checkBinaries = options?.checkBinaries ?? false;
  const hostPaths = detectHostPaths();
  const results: BootstrapResult[] = [];
  results.push(...collectPathResolutionWarnings(hostPaths, process.env));

  try {
    results.push(...ensureCodexMcpConfig(hostPaths, dryRun));
  } catch (e) {
    results.push({
      host: 'Codex',
      category: 'MCP',
      name: 'config.toml',
      level: 'ERROR',
      detail: `更新 Codex MCP 配置失败：${(e as Error).message}`,
    });
  }

  try {
    results.push(...ensureClaudeMcpConfig(hostPaths, dryRun));
  } catch (e) {
    results.push({
      host: 'Claude Code',
      category: 'MCP',
      name: 'mcp config',
      level: 'ERROR',
      detail: `更新 Claude MCP 配置失败：${(e as Error).message}`,
    });
  }

  results.push(...ensureRequiredSkills(hostPaths, dryRun));
  if (checkBinaries) {
    results.push(...ensureMcpBinaries());
  }

  const ok = !results.some((item) => item.level === 'ERROR');
  return { ok, results };
}

function collectPathResolutionWarnings(paths: HostPaths, env: NodeJS.ProcessEnv): BootstrapResult[] {
  const warnings: BootstrapResult[] = [];
  const checks: Array<{
    host: BootstrapResult['host'];
    category: BootstrapResult['category'];
    envKey: string;
    selected: string;
  }> = [
    { host: 'Codex', category: 'MCP', envKey: 'CODEX_HOME', selected: paths.codexRoot },
    { host: 'Codex', category: 'MCP', envKey: 'CODEX_ROOT', selected: paths.codexRoot },
    { host: 'Codex', category: 'MCP', envKey: 'CODEX_CONFIG_PATH', selected: paths.codexConfigPath },
    { host: 'Codex', category: 'Skill', envKey: 'CODEX_SKILLS_DIR', selected: paths.codexSkillsDir },
    { host: 'Claude Code', category: 'MCP', envKey: 'CLAUDE_CODE_CONFIG_DIR', selected: paths.claudeConfigDir },
    { host: 'Claude Code', category: 'MCP', envKey: 'CLAUDE_CONFIG_DIR', selected: paths.claudeConfigDir },
    { host: 'Claude Code', category: 'Skill', envKey: 'CLAUDE_HOME', selected: paths.claudeHomeDir },
    { host: 'Claude Code', category: 'Skill', envKey: 'CLAUDE_USER_HOME', selected: paths.claudeHomeDir },
    { host: 'Claude Code', category: 'Skill', envKey: 'CLAUDE_SKILLS_DIR', selected: paths.claudeSkillsDir },
    { host: 'Claude Code', category: 'Skill', envKey: 'CLAUDE_COMMANDS_DIR', selected: paths.claudeCommandsDir },
  ];

  for (const item of checks) {
    const raw = env[item.envKey];
    const expected = typeof raw === 'string' ? raw.trim() : '';
    if (!expected) continue;
    if (expected === item.selected) continue;
    warnings.push({
      host: item.host,
      category: item.category,
      name: item.envKey,
      level: 'WARNING',
      detail: `${item.envKey}=${expected} 已忽略，使用探测路径 ${item.selected}`,
    });
  }
  return warnings;
}

function quoteTomlString(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function renderCodexMcpBlock(name: string, spec: McpCommandSpec): string {
  const args = spec.args.map((arg) => quoteTomlString(arg)).join(', ');
  return `[mcp_servers.${name}]
type = "stdio"
command = ${quoteTomlString(spec.command)}
args = [${args}]`;
}

function ensureCodexMcpConfig(paths: HostPaths, dryRun: boolean): BootstrapResult[] {
  const codexConfig = paths.codexConfigPath;
  if (!dryRun) mkdirSync(dirname(codexConfig), { recursive: true });

  const original = existsSync(codexConfig) ? readFileSync(codexConfig, 'utf-8') : '';
  let content = original;
  const results: BootstrapResult[] = [];

  if (!/\[mcp_servers\]/.test(content)) {
    content += `${content.endsWith('\n') || content.length === 0 ? '' : '\n'}\n[mcp_servers]\n`;
  }

  for (const entry of REQUIRED_MCP_SERVERS) {
    if (!content.includes(`[mcp_servers.${entry.name}]`)) {
      content += `\n${renderCodexMcpBlock(entry.name, entry.codex)}\n`;
      results.push({
        host: 'Codex',
        category: 'MCP',
        name: entry.name,
        level: 'FIXED',
        detail: `已补齐缺失配置块到 ${codexConfig}`,
      });
    } else {
      results.push({
        host: 'Codex',
        category: 'MCP',
        name: entry.name,
        level: 'PASS',
        detail: '已配置',
      });
    }
  }

  if (content !== original && !dryRun) {
    writeFileSync(codexConfig, content, 'utf-8');
  }

  return results;
}

function ensureClaudeMcpConfig(paths: HostPaths, dryRun: boolean): BootstrapResult[] {
  const files = paths.claudeConfigFiles;
  const fixedNames = new Set<string>();
  const results: BootstrapResult[] = [];
  let validConfigCount = 0;

  for (const filePath of files) {
    if (!dryRun) mkdirSync(dirname(filePath), { recursive: true });
    const loaded = readJsonObject(filePath, { dryRun });
    if (!loaded.ok) {
      results.push({
        host: 'Claude Code',
        category: 'MCP',
        name: filePath,
        level: 'ERROR',
        detail: loaded.backupPath
          ? `${loaded.error}；原文件已备份到 ${loaded.backupPath}`
          : loaded.error,
      });
      continue;
    }
    validConfigCount += 1;
    const root = loaded.value;
    const currentServers = root.mcpServers;
    const mcpServers =
      typeof currentServers === 'object' && currentServers && !Array.isArray(currentServers)
        ? { ...(currentServers as Record<string, unknown>) }
        : {};

    let changed = false;
    for (const entry of REQUIRED_MCP_SERVERS) {
      const { name } = entry;
      const required = entry.claude;
      const existing = mcpServers[name] as Record<string, unknown> | undefined;
      const command = typeof existing?.command === 'string' ? existing.command : undefined;
      const args = Array.isArray(existing?.args) ? existing?.args : undefined;
      const same = command === required.command && sameStringArray(args, required.args);
      if (!same) {
        mcpServers[name] = required;
        changed = true;
        fixedNames.add(name);
      }
    }

    if (changed && !dryRun) {
      root.mcpServers = mcpServers;
      atomicWriteJson(filePath, root);
    }
  }

  if (validConfigCount === 0 && results.some((item) => item.level === 'ERROR')) {
    return results;
  }

  for (const { name } of REQUIRED_MCP_SERVERS) {
    results.push({
      host: 'Claude Code',
      category: 'MCP',
      name,
      level: fixedNames.has(name) ? 'FIXED' : 'PASS',
      detail: fixedNames.has(name) ? '缺失/错误配置已自动修复' : '已配置',
    });
  }

  return results;
}

function ensureRequiredSkills(paths: HostPaths, dryRun: boolean): BootstrapResult[] {
  const results: BootstrapResult[] = [];
  for (const skill of REQUIRED_SKILLS) {
    const source = resolveSkillSource(paths, skill) ?? cloneSkillSource(paths, skill, results, dryRun);
    const codexTarget = skill.codexTarget === 'system'
      ? join(paths.codexSystemSkillsDir, skill.name)
      : join(paths.codexSkillsDir, skill.name);

    results.push(copySkill(source, codexTarget, 'Codex', skill.name, dryRun));
    results.push(copySkill(source, join(paths.claudeSkillsDir, skill.name), 'Claude Code', skill.name, dryRun));
  }

  return results;
}

function copySkill(
  source: string | undefined,
  target: string,
  host: 'Codex' | 'Claude Code',
  skillName: string,
  dryRun: boolean = false,
): BootstrapResult {
  if (!source || !existsSync(source)) {
    return {
      host,
      category: 'Skill',
      name: skillName,
      level: 'ERROR',
      detail: `未找到技能源目录（${source ?? 'undefined'}）`,
    };
  }
  if (existsSync(target)) {
    return {
      host,
      category: 'Skill',
      name: skillName,
      level: 'PASS',
      detail: '已安装',
    };
  }

  if (!dryRun) {
    mkdirSync(dirname(target), { recursive: true });
    cpSync(source, target, { recursive: true });
  }
  return {
    host,
    category: 'Skill',
    name: skillName,
    level: 'FIXED',
    detail: `已从 ${source} 复制安装`,
  };
}

function resolveSourcePath(paths: HostPaths, source: SkillSourceLocation, skillName: string): string {
  switch (source) {
    case 'agents':
      return join(paths.agentsSkillsDir, skillName);
    case 'codex':
      return join(paths.codexSkillsDir, skillName);
    case 'codex-system':
      return join(paths.codexSystemSkillsDir, skillName);
    case 'claude':
      return join(paths.claudeSkillsDir, skillName);
  }
}

function resolveSkillSource(paths: HostPaths, skill: RequiredSkill): string | undefined {
  const candidates = skill.sourcePriority.map((source) => resolveSourcePath(paths, source, skill.name));
  return candidates.find((candidate) => existsSync(candidate));
}

function cloneSkillSource(
  paths: HostPaths,
  skill: RequiredSkill,
  results: BootstrapResult[],
  dryRun: boolean = false,
): string | undefined {
  if (dryRun) return undefined;
  if (!skill.clone) return undefined;

  const cacheRoot = paths.bootstrapCacheDir;
  mkdirSync(cacheRoot, { recursive: true });

  const repoDir = join(cacheRoot, skill.clone.repoDir);
  const repoUrl = skill.clone.repoUrl;
  const skillSubDir = join(repoDir, 'skills', skill.name);

  try {
    if (!existsSync(repoDir)) {
      execFileSync('git', ['clone', '--depth=1', repoUrl, repoDir], {
        stdio: 'ignore',
        timeout: GIT_CLONE_TIMEOUT_MS,
      });
    }
    if (!existsSync(skillSubDir)) {
      throw new Error(`缺失目录 ${skillSubDir}`);
    }
    return skillSubDir;
  } catch (e) {
    results.push({
      host: 'Common',
      category: 'Skill',
      name: skill.name,
      level: 'ERROR',
      detail: `克隆失败：${(e as Error).message}`,
    });
    return undefined;
  }
}

function ensureMcpBinaries(): BootstrapResult[] {
  const results: BootstrapResult[] = [];
  for (const entry of REQUIRED_MCP_SERVERS) {
    const probes = entry.binaryProbes ?? [];
    results.push(checkBinary(entry.name, probes));
  }

  return results;
}

function checkBinary(
  name: string,
  probes: readonly BinaryProbeCommand[],
): BootstrapResult {
  if (probes.length === 0) {
    return {
      host: 'Common',
      category: 'Binary',
      name,
      level: 'WARNING',
      detail: '未配置 binary probes，已跳过',
    };
  }

  for (let i = 0; i < probes.length; i += 1) {
    if (!tryCommand(probes[i])) continue;
    return {
      host: 'Common',
      category: 'Binary',
      name,
      level: i === 0 ? 'PASS' : 'FIXED',
      detail: i === 0 ? '可执行命令可用' : '回退可执行命令可用',
    };
  }

  return {
    host: 'Common',
    category: 'Binary',
    name,
    level: 'ERROR',
    detail: '可执行命令检查失败',
  };
}

function readJsonObject(
  filePath: string,
  options?: { dryRun?: boolean },
): { ok: true; value: Record<string, unknown> } | { ok: false; error: string; backupPath?: string } {
  if (!existsSync(filePath)) return { ok: true, value: {} };
  const content = readFileSync(filePath, 'utf-8').trim();
  if (!content) return { ok: true, value: {} };

  try {
    const parsed = JSON.parse(content) as unknown;
    if (typeof parsed === 'object' && parsed && !Array.isArray(parsed)) {
      return { ok: true, value: parsed as Record<string, unknown> };
    }
    const backupPath = backupInvalidJson(filePath, content, options?.dryRun);
    return {
      ok: false,
      error: `${filePath} 顶层必须是 JSON 对象`,
      backupPath,
    };
  } catch {
    const backupPath = backupInvalidJson(filePath, content, options?.dryRun);
    return {
      ok: false,
      error: `${filePath} 包含无效 JSON`,
      backupPath,
    };
  }
}

function backupInvalidJson(filePath: string, content: string, dryRun?: boolean): string | undefined {
  const backupPath = `${filePath}.invalid-${Date.now()}.bak`;
  if (!dryRun) {
    writeFileSync(backupPath, `${content}\n`, 'utf-8');
  }
  return backupPath;
}

function sameStringArray(a: unknown, b: readonly string[]): boolean {
  return Array.isArray(a) && a.length === b.length && a.every((v, index) => v === b[index]);
}

function runCommand(command: BinaryProbeCommand): void {
  execFileSync(command.command, command.args, {
    stdio: 'ignore',
    timeout: command.timeoutMs ?? 60_000,
  });
}

function tryCommand(command: BinaryProbeCommand): boolean {
  try {
    runCommand(command);
    return true;
  } catch {
    return false;
  }
}
