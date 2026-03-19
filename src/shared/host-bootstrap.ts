import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
  renameSync,
} from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { detectHostPaths, type HostPaths } from './host-paths.js';
import type { HostId } from '../core/tool-integration/tool-types.js';
import {
  REQUIRED_MCP_SERVERS,
  REQUIRED_SKILLS,
  type BootstrapCapabilityRole,
  type BinaryProbeCommand,
  type McpCommandSpec,
  type RequiredSkill,
  type SkillSourceLocation,
} from '../config/bootstrap-manifest.js';

export type BootstrapLevel = 'PASS' | 'FIXED' | 'WARNING' | 'ERROR';

export interface BootstrapResult {
  host: 'Codex' | 'Claude Code' | 'Gemini CLI' | 'Cursor' | 'Common';
  category: 'MCP' | 'Skill' | 'Binary';
  name: string;
  level: BootstrapLevel;
  detail: string;
  role?: BootstrapCapabilityRole;
  impact?: string;
  requiredByDefault?: boolean;
}

export interface BootstrapSummary {
  ok: boolean;
  results: BootstrapResult[];
}

export interface BootstrapOptions {
  dryRun?: boolean;
  hosts?: HostId[];
  /**
   * 是否执行 MCP 二进制可运行性探测。
   * 默认关闭：update 场景仅做“存在性检查 + 缺失补齐”，避免网络探测导致阻塞。
   */
  checkBinaries?: boolean;
}

function shouldIncludeHost(hosts: readonly HostId[] | undefined, host: HostId): boolean {
  return !hosts || hosts.length === 0 || hosts.includes(host);
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
    try {
      unlinkSync(tmpPath);
    } catch {}
    throw e;
  }
}

function backupFileIfExists(filePath: string): string | undefined {
  if (!existsSync(filePath)) return undefined;
  const backupPath = `${filePath}.bak`;
  writeFileSync(backupPath, readFileSync(filePath, 'utf-8'), 'utf-8');
  return backupPath;
}

function atomicWriteText(filePath: string, content: string): void {
  const dir = dirname(filePath);
  mkdirSync(dir, { recursive: true });
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  const tmpPath = join(tmpdir(), `spec-first-text-${randomSuffix}.tmp`);

  try {
    writeFileSync(tmpPath, content, 'utf-8');
    renameSync(tmpPath, filePath);
  } catch (e) {
    try {
      unlinkSync(tmpPath);
    } catch {}
    throw e;
  }
}

const GIT_CLONE_TIMEOUT_MS = 120_000;
const DEFAULT_BOOTSTRAP_HOSTS: HostId[] = ['claude', 'codex'];

export function ensureHostBootstrap(options?: BootstrapOptions): BootstrapSummary {
  if (process.env.SPEC_FIRST_SKIP_BOOTSTRAP === '1') {
    return { ok: true, results: [] };
  }
  if (process.env.VITEST || process.env.NODE_ENV === 'test') {
    return { ok: true, results: [] };
  }

  const dryRun = options?.dryRun ?? false;
  const selectedHosts = options?.hosts ?? DEFAULT_BOOTSTRAP_HOSTS;
  const checkBinaries = options?.checkBinaries ?? false;
  const hostPaths = detectHostPaths();
  const results: BootstrapResult[] = [];
  results.push(...collectPathResolutionWarnings(hostPaths, process.env));

  if (shouldIncludeHost(selectedHosts, 'codex')) {
    try {
      results.push(...ensureCodexMcpConfig(hostPaths, dryRun));
    } catch (e) {
      results.push({
        host: 'Codex',
        category: 'MCP',
        name: 'config.toml',
        level: 'ERROR',
        detail: `更新 Codex MCP 配置失败：${(e as Error).message}`,
        impact: '会导致 Codex 宿主缺失核心 MCP 配置',
        requiredByDefault: true,
      });
    }
  }

  if (shouldIncludeHost(selectedHosts, 'claude')) {
    try {
      results.push(...ensureClaudeMcpConfig(hostPaths, dryRun));
    } catch (e) {
      results.push({
        host: 'Claude Code',
        category: 'MCP',
        name: 'mcp config',
        level: 'ERROR',
        detail: `更新 Claude MCP 配置失败：${(e as Error).message}`,
        impact: '会导致 Claude Code 宿主缺失核心 MCP 配置',
        requiredByDefault: true,
      });
    }
  }

  if (shouldIncludeHost(selectedHosts, 'gemini')) {
    try {
      results.push(...ensureGeminiMcpConfig(hostPaths, dryRun));
    } catch (e) {
      results.push({
        host: 'Gemini CLI',
        category: 'MCP',
        name: 'settings.json',
        level: 'ERROR',
        detail: `更新 Gemini MCP 配置失败：${(e as Error).message}`,
        impact: '会导致 Gemini CLI 宿主缺失核心 MCP 配置',
        requiredByDefault: false,
      });
    }
  }

  if (shouldIncludeHost(selectedHosts, 'cursor')) {
    try {
      results.push(...ensureCursorMcpConfig(hostPaths, dryRun));
    } catch (e) {
      results.push({
        host: 'Cursor',
        category: 'MCP',
        name: 'mcp.json',
        level: 'ERROR',
        detail: `更新 Cursor MCP 配置失败：${(e as Error).message}`,
        impact: '会导致 Cursor 宿主缺失核心 MCP 配置',
        requiredByDefault: false,
      });
    }
  }

  results.push(...ensureRequiredSkills(hostPaths, dryRun, selectedHosts));
  if (checkBinaries) {
    results.push(...ensureMcpBinaries());
  }

  const ok = !results.some((item) => item.level === 'ERROR');
  return { ok, results };
}

function collectPathResolutionWarnings(
  paths: HostPaths,
  env: NodeJS.ProcessEnv
): BootstrapResult[] {
  const warnings: BootstrapResult[] = [];
  const checks: Array<{
    host: BootstrapResult['host'];
    category: BootstrapResult['category'];
    envKey: string;
    selected: string;
  }> = [
    { host: 'Codex', category: 'MCP', envKey: 'CODEX_HOME', selected: paths.codexRoot },
    { host: 'Codex', category: 'MCP', envKey: 'CODEX_ROOT', selected: paths.codexRoot },
    {
      host: 'Codex',
      category: 'MCP',
      envKey: 'CODEX_CONFIG_PATH',
      selected: paths.codexConfigPath,
    },
    {
      host: 'Codex',
      category: 'Skill',
      envKey: 'CODEX_SKILLS_DIR',
      selected: paths.codexSkillsDir,
    },
    {
      host: 'Claude Code',
      category: 'MCP',
      envKey: 'CLAUDE_CODE_CONFIG_DIR',
      selected: paths.claudeConfigDir,
    },
    {
      host: 'Claude Code',
      category: 'MCP',
      envKey: 'CLAUDE_CONFIG_DIR',
      selected: paths.claudeConfigDir,
    },
    {
      host: 'Claude Code',
      category: 'Skill',
      envKey: 'CLAUDE_HOME',
      selected: paths.claudeHomeDir,
    },
    {
      host: 'Claude Code',
      category: 'Skill',
      envKey: 'CLAUDE_USER_HOME',
      selected: paths.claudeHomeDir,
    },
    {
      host: 'Claude Code',
      category: 'Skill',
      envKey: 'CLAUDE_SKILLS_DIR',
      selected: paths.claudeSkillsDir,
    },
    {
      host: 'Claude Code',
      category: 'Skill',
      envKey: 'CLAUDE_COMMANDS_DIR',
      selected: paths.claudeCommandsDir,
    },
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
        role: entry.role,
        impact: entry.impact,
        requiredByDefault: entry.requiredByDefault,
      });
    } else {
      results.push({
        host: 'Codex',
        category: 'MCP',
        name: entry.name,
        level: 'PASS',
        detail: '已配置',
        role: entry.role,
        impact: entry.impact,
        requiredByDefault: entry.requiredByDefault,
      });
    }
  }

  if (content !== original && !dryRun) {
    const backupPath = backupFileIfExists(codexConfig);
    try {
      atomicWriteText(codexConfig, content);
    } catch (e) {
      if (backupPath && existsSync(backupPath)) {
        atomicWriteText(codexConfig, readFileSync(backupPath, 'utf-8'));
      }
      throw e;
    }
    results.push({
      host: 'Codex',
      category: 'MCP',
      name: 'config.toml.backup',
      level: 'PASS',
      detail: backupPath ? `已创建备份 ${backupPath}` : '首次写入，无需备份',
      impact: '支持配置写入失败时回滚',
      requiredByDefault: true,
    });
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
        impact: '会导致 Claude Code 无法稳定读取 MCP 配置',
        requiredByDefault: true,
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
      const backupPath = backupFileIfExists(filePath);
      try {
        atomicWriteJson(filePath, root);
      } catch (e) {
        if (backupPath && existsSync(backupPath)) {
          atomicWriteText(filePath, readFileSync(backupPath, 'utf-8'));
        }
        throw e;
      }
      results.push({
        host: 'Claude Code',
        category: 'MCP',
        name: `${filePath}.backup`,
        level: 'PASS',
        detail: backupPath ? `已创建备份 ${backupPath}` : '首次写入，无需备份',
        impact: '支持配置写入失败时回滚',
        requiredByDefault: true,
      });
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
      role: REQUIRED_MCP_SERVERS.find((entry) => entry.name === name)?.role,
      impact: REQUIRED_MCP_SERVERS.find((entry) => entry.name === name)?.impact,
      requiredByDefault: REQUIRED_MCP_SERVERS.find((entry) => entry.name === name)
        ?.requiredByDefault,
    });
  }

  return results;
}

function ensureRequiredSkills(
  paths: HostPaths,
  dryRun: boolean,
  hosts?: readonly HostId[]
): BootstrapResult[] {
  const results: BootstrapResult[] = [];
  for (const skill of REQUIRED_SKILLS) {
    const source =
      resolveSkillSource(paths, skill) ?? cloneSkillSource(paths, skill, results, dryRun);
    const codexTarget =
      skill.codexTarget === 'system'
        ? join(paths.codexSystemSkillsDir, skill.name)
        : join(paths.codexSkillsDir, skill.name);

    if (shouldIncludeHost(hosts, 'codex')) {
      results.push(copySkill(source, codexTarget, 'Codex', skill.name, dryRun));
    }
    if (shouldIncludeHost(hosts, 'claude')) {
      results.push(
        copySkill(
          source,
          join(paths.claudeSkillsDir, skill.name),
          'Claude Code',
          skill.name,
          dryRun
        )
      );
    }
  }

  return results;
}

function shouldManageGemini(paths: HostPaths): boolean {
  return Boolean(
    process.env.GEMINI_HOME?.trim() ||
    process.env.GEMINI_CONFIG_DIR?.trim() ||
    process.env.GEMINI_CLI_HOME?.trim() ||
    process.env.GEMINI_CLI_CONFIG_DIR?.trim() ||
    existsSync(paths.geminiHomeDir) ||
    existsSync(paths.geminiConfigDir)
  );
}

function shouldManageCursor(paths: HostPaths): boolean {
  return Boolean(
    process.env.CURSOR_HOME?.trim() ||
    process.env.CURSOR_CONFIG_DIR?.trim() ||
    process.env.CURSOR_USER_HOME?.trim() ||
    existsSync(paths.cursorHomeDir) ||
    existsSync(paths.cursorConfigDir)
  );
}

function ensureGeminiMcpConfig(paths: HostPaths, dryRun: boolean): BootstrapResult[] {
  if (!shouldManageGemini(paths)) return [];

  const filePath = paths.geminiSettingsPath;
  if (!dryRun) mkdirSync(dirname(filePath), { recursive: true });
  const loaded = readJsonObject(filePath, { dryRun });
  if (!loaded.ok) {
    return [
      {
        host: 'Gemini CLI',
        category: 'MCP',
        name: filePath,
        level: 'ERROR',
        detail: loaded.backupPath
          ? `${loaded.error}；原文件已备份到 ${loaded.backupPath}`
          : loaded.error,
        impact: '会导致 Gemini CLI 无法稳定读取 MCP 配置',
        requiredByDefault: false,
      },
    ];
  }

  const root = loaded.value;
  const { mcpServers, normalizedRoot } = resolveHostMcpServers(root, ['mcpServers', 'mcp_servers']);
  const rootChanged = normalizedRoot !== root;

  let changed = false;
  const fixedNames = new Set<string>();
  const warningNames = new Set<string>();
  for (const entry of REQUIRED_MCP_SERVERS) {
    const existing = mcpServers[entry.name] as Record<string, unknown> | undefined;
    const required = entry.claude;
    const state = classifyJsonMcpEntry(existing, required);
    if (state === 'missing') {
      mcpServers[entry.name] = required;
      changed = true;
      fixedNames.add(entry.name);
    } else if (state === 'conflict') {
      warningNames.add(entry.name);
    }
  }

  if (changed && !dryRun) {
    normalizedRoot.mcpServers = mcpServers;
    const backupPath = backupFileIfExists(filePath);
    try {
      atomicWriteJson(filePath, normalizedRoot);
    } catch (e) {
      if (backupPath && existsSync(backupPath)) {
        atomicWriteText(filePath, readFileSync(backupPath, 'utf-8'));
      }
      throw e;
    }
  }

  if (rootChanged && !changed && !dryRun) {
    const backupPath = backupFileIfExists(filePath);
    try {
      atomicWriteJson(filePath, normalizedRoot);
    } catch (e) {
      if (backupPath && existsSync(backupPath)) {
        atomicWriteText(filePath, readFileSync(backupPath, 'utf-8'));
      }
      throw e;
    }
  }

  return REQUIRED_MCP_SERVERS.map((entry) => ({
    host: 'Gemini CLI' as const,
    category: 'MCP' as const,
    name: entry.name,
    level: fixedNames.has(entry.name) ? 'FIXED' : warningNames.has(entry.name) ? 'WARNING' : 'PASS',
    detail: fixedNames.has(entry.name)
      ? '缺失配置已自动补齐'
      : warningNames.has(entry.name)
        ? '检测到宿主已有同名自定义配置，已保留现有条目'
        : '已配置',
    role: entry.role,
    impact: entry.impact,
    requiredByDefault: false,
  }));
}

function ensureCursorMcpConfig(paths: HostPaths, dryRun: boolean): BootstrapResult[] {
  if (!shouldManageCursor(paths)) return [];

  const filePath = paths.cursorMcpConfigPath;
  if (!dryRun) mkdirSync(dirname(filePath), { recursive: true });
  const loaded = readJsonObject(filePath, { dryRun });
  if (!loaded.ok) {
    return [
      {
        host: 'Cursor',
        category: 'MCP',
        name: filePath,
        level: 'ERROR',
        detail: loaded.backupPath
          ? `${loaded.error}；原文件已备份到 ${loaded.backupPath}`
          : loaded.error,
        impact: '会导致 Cursor 无法稳定读取 MCP 配置',
        requiredByDefault: false,
      },
    ];
  }

  const root = loaded.value;
  const { mcpServers, normalizedRoot } = resolveHostMcpServers(root, ['mcpServers', 'servers']);
  const rootChanged = normalizedRoot !== root;

  let changed = false;
  const fixedNames = new Set<string>();
  const warningNames = new Set<string>();
  for (const entry of REQUIRED_MCP_SERVERS) {
    const existing = mcpServers[entry.name] as Record<string, unknown> | undefined;
    const required = entry.claude;
    const state = classifyJsonMcpEntry(existing, required);
    if (state === 'missing') {
      mcpServers[entry.name] = required;
      changed = true;
      fixedNames.add(entry.name);
    } else if (state === 'conflict') {
      warningNames.add(entry.name);
    }
  }

  if (changed && !dryRun) {
    normalizedRoot.mcpServers = mcpServers;
    const backupPath = backupFileIfExists(filePath);
    try {
      atomicWriteJson(filePath, normalizedRoot);
    } catch (e) {
      if (backupPath && existsSync(backupPath)) {
        atomicWriteText(filePath, readFileSync(backupPath, 'utf-8'));
      }
      throw e;
    }
  }

  if (rootChanged && !changed && !dryRun) {
    const backupPath = backupFileIfExists(filePath);
    try {
      atomicWriteJson(filePath, normalizedRoot);
    } catch (e) {
      if (backupPath && existsSync(backupPath)) {
        atomicWriteText(filePath, readFileSync(backupPath, 'utf-8'));
      }
      throw e;
    }
  }

  return REQUIRED_MCP_SERVERS.map((entry) => ({
    host: 'Cursor' as const,
    category: 'MCP' as const,
    name: entry.name,
    level: fixedNames.has(entry.name) ? 'FIXED' : warningNames.has(entry.name) ? 'WARNING' : 'PASS',
    detail: fixedNames.has(entry.name)
      ? '缺失配置已自动补齐'
      : warningNames.has(entry.name)
        ? '检测到宿主已有同名自定义配置，已保留现有条目'
        : '已配置',
    role: entry.role,
    impact: entry.impact,
    requiredByDefault: false,
  }));
}

function copySkill(
  source: string | undefined,
  target: string,
  host: 'Codex' | 'Claude Code',
  skillName: string,
  dryRun: boolean = false
): BootstrapResult {
  if (!source || !existsSync(source)) {
    return {
      host,
      category: 'Skill',
      name: skillName,
      level: 'ERROR',
      detail: `未找到技能源目录（${source ?? 'undefined'}）`,
      impact: REQUIRED_SKILLS.find((skill) => skill.name === skillName)?.impact,
      requiredByDefault: REQUIRED_SKILLS.find((skill) => skill.name === skillName)
        ?.requiredByDefault,
    };
  }
  if (existsSync(target)) {
    return {
      host,
      category: 'Skill',
      name: skillName,
      level: 'PASS',
      detail: '已安装',
      role: REQUIRED_SKILLS.find((skill) => skill.name === skillName)?.role,
      impact: REQUIRED_SKILLS.find((skill) => skill.name === skillName)?.impact,
      requiredByDefault: REQUIRED_SKILLS.find((skill) => skill.name === skillName)
        ?.requiredByDefault,
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
    role: REQUIRED_SKILLS.find((skill) => skill.name === skillName)?.role,
    impact: REQUIRED_SKILLS.find((skill) => skill.name === skillName)?.impact,
    requiredByDefault: REQUIRED_SKILLS.find((skill) => skill.name === skillName)?.requiredByDefault,
  };
}

function resolveSourcePath(
  paths: HostPaths,
  source: SkillSourceLocation,
  skillName: string
): string {
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
  const candidates = skill.sourcePriority.map((source) =>
    resolveSourcePath(paths, source, skill.name)
  );
  return candidates.find((candidate) => existsSync(candidate));
}

function cloneSkillSource(
  paths: HostPaths,
  skill: RequiredSkill,
  results: BootstrapResult[],
  dryRun: boolean = false
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
      role: skill.role,
      impact: skill.impact,
      requiredByDefault: skill.requiredByDefault,
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

function checkBinary(name: string, probes: readonly BinaryProbeCommand[]): BootstrapResult {
  if (probes.length === 0) {
    return {
      host: 'Common',
      category: 'Binary',
      name,
      level: 'WARNING',
      detail: '未配置 binary probes，已跳过',
      impact: '无法验证 MCP 二进制是否可执行',
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
      impact: 'MCP 二进制可执行性已验证',
    };
  }

  return {
    host: 'Common',
    category: 'Binary',
    name,
    level: 'ERROR',
    detail: '可执行命令检查失败',
    impact: 'MCP 已配置但运行时可能无法启动',
  };
}

function readJsonObject(
  filePath: string,
  options?: { dryRun?: boolean }
):
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; error: string; backupPath?: string } {
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

function resolveHostMcpServers(
  root: Record<string, unknown>,
  keys: readonly string[]
): { mcpServers: Record<string, unknown>; normalizedRoot: Record<string, unknown> } {
  const collected: Record<string, unknown> = {};

  for (const key of keys) {
    const value = root[key];
    if (typeof value !== 'object' || !value || Array.isArray(value)) continue;
    Object.assign(collected, value as Record<string, unknown>);
  }

  const normalizedRoot =
    keys.length > 1 && keys.some((key) => key !== 'mcpServers' && key in root)
      ? Object.fromEntries(
          Object.entries({
            ...root,
            mcpServers: collected,
          }).filter(([key]) => !keys.includes(key) || key === 'mcpServers')
        )
      : root;

  return {
    mcpServers: { ...collected },
    normalizedRoot,
  };
}

function backupInvalidJson(
  filePath: string,
  content: string,
  dryRun?: boolean
): string | undefined {
  const backupPath = `${filePath}.invalid-${Date.now()}.bak`;
  if (!dryRun) {
    writeFileSync(backupPath, `${content}\n`, 'utf-8');
  }
  return backupPath;
}

function sameStringArray(a: unknown, b: readonly string[]): boolean {
  return Array.isArray(a) && a.length === b.length && a.every((v, index) => v === b[index]);
}

function classifyJsonMcpEntry(
  existing: Record<string, unknown> | undefined,
  _required: McpCommandSpec
): 'missing' | 'same' | 'conflict' {
  if (!existing) return 'missing';
  return 'same';
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
