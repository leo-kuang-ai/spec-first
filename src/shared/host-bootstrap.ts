import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { detectHostPaths, type HostPaths } from './host-paths.js';

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

interface McpServerEntry {
  command: string;
  args: string[];
}

interface BinaryCommand {
  command: string;
  args: string[];
  timeoutMs?: number;
}

const SKILL_FIND = 'find-skills';
const SKILL_CREATOR = 'skill-creator';
const SERENA_REPO_URL = 'git+https://github.com/oraios/serena';
const SERENA_CONTEXT = 'ide-assistant';
const COMMAND_TIMEOUT_MS = 60_000;
const GIT_CLONE_TIMEOUT_MS = 120_000;
const SERENA_FALLBACK_TIMEOUT_MS = 180_000;

const CODEX_REQUIRED_MCP_BLOCKS: readonly { name: string; block: string }[] = [
  {
    name: 'sequential-thinking',
    block: `[mcp_servers.sequential-thinking]
type = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-sequential-thinking"]`,
  },
  {
    name: 'context7',
    block: `[mcp_servers.context7]
type = "stdio"
command = "npx"
args = ["-y", "@upstash/context7-mcp"]`,
  },
  {
    name: 'serena',
    block: `[mcp_servers.serena]
type = "stdio"
command = "uvx"
args = ["--from", "${SERENA_REPO_URL}", "serena", "start-mcp-server", "--context", "${SERENA_CONTEXT}"]`,
  },
  {
    name: 'fetch',
    block: `[mcp_servers.fetch]
type = "stdio"
command = "uvx"
args = ["mcp-server-fetch"]`,
  },
  {
    name: 'playwright-mcp',
    block: `[mcp_servers.playwright-mcp]
type = "stdio"
command = "npx"
args = ["-y", "@playwright/mcp@latest"]`,
  },
];

const CLAUDE_REQUIRED_MCP: Readonly<Record<string, McpServerEntry>> = {
  'sequential-thinking': {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
  },
  context7: {
    command: 'npx',
    args: ['-y', 'context7-mcp-server'],
  },
  serena: {
    command: 'uvx',
    args: ['--from', SERENA_REPO_URL, 'serena', 'start-mcp-server', '--context', SERENA_CONTEXT],
  },
  fetch: {
    command: 'uvx',
    args: ['mcp-server-fetch'],
  },
  'playwright-mcp': {
    command: 'npx',
    args: ['-y', '@playwright/mcp@latest'],
  },
};

export function ensureHostBootstrap(options?: { dryRun?: boolean }): BootstrapSummary {
  if (process.env.SPEC_FIRST_SKIP_BOOTSTRAP === '1') {
    return { ok: true, results: [] };
  }
  if (process.env.VITEST || process.env.NODE_ENV === 'test') {
    return { ok: true, results: [] };
  }

  const dryRun = options?.dryRun ?? false;
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
  results.push(...ensureMcpBinaries());

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

function ensureCodexMcpConfig(paths: HostPaths, dryRun: boolean): BootstrapResult[] {
  const codexConfig = paths.codexConfigPath;
  if (!dryRun) mkdirSync(dirname(codexConfig), { recursive: true });

  const original = existsSync(codexConfig) ? readFileSync(codexConfig, 'utf-8') : '';
  let content = original;
  const results: BootstrapResult[] = [];

  if (!/\[mcp_servers\]/.test(content)) {
    content += `${content.endsWith('\n') || content.length === 0 ? '' : '\n'}\n[mcp_servers]\n`;
  }

  for (const entry of CODEX_REQUIRED_MCP_BLOCKS) {
    if (!content.includes(`[mcp_servers.${entry.name}]`)) {
      content += `\n${entry.block}\n`;
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

  for (const filePath of files) {
    if (!dryRun) mkdirSync(dirname(filePath), { recursive: true });
    const root = readJsonObject(filePath);
    const currentServers = root.mcpServers;
    const mcpServers =
      typeof currentServers === 'object' && currentServers && !Array.isArray(currentServers)
        ? { ...(currentServers as Record<string, unknown>) }
        : {};

    let changed = false;
    for (const [name, required] of Object.entries(CLAUDE_REQUIRED_MCP)) {
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
      writeFileSync(filePath, `${JSON.stringify(root, null, 2)}\n`, 'utf-8');
    }
  }

  for (const name of Object.keys(CLAUDE_REQUIRED_MCP)) {
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
  const findSkillsSource = resolveSkillSource(paths, SKILL_FIND) ?? cloneSkillSource(paths, SKILL_FIND, results, dryRun);
  const creatorSource = resolveSkillSource(paths, SKILL_CREATOR) ?? cloneSkillSource(paths, SKILL_CREATOR, results, dryRun);

  results.push(copySkill(findSkillsSource, join(paths.codexSkillsDir, SKILL_FIND), 'Codex', SKILL_FIND, dryRun));
  results.push(copySkill(findSkillsSource, join(paths.claudeSkillsDir, SKILL_FIND), 'Claude Code', SKILL_FIND, dryRun));
  results.push(copySkill(creatorSource, join(paths.codexSystemSkillsDir, SKILL_CREATOR), 'Codex', SKILL_CREATOR, dryRun));
  results.push(copySkill(creatorSource, join(paths.claudeSkillsDir, SKILL_CREATOR), 'Claude Code', SKILL_CREATOR, dryRun));

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

function resolveSkillSource(paths: HostPaths, skillName: string): string | undefined {
  const candidates = skillName === SKILL_FIND
    ? [
      join(paths.agentsSkillsDir, SKILL_FIND),
      join(paths.codexSkillsDir, SKILL_FIND),
      join(paths.claudeSkillsDir, SKILL_FIND),
    ]
    : [
      join(paths.codexSystemSkillsDir, SKILL_CREATOR),
      join(paths.codexSkillsDir, SKILL_CREATOR),
      join(paths.claudeSkillsDir, SKILL_CREATOR),
      join(paths.agentsSkillsDir, SKILL_CREATOR),
    ];
  return candidates.find((candidate) => existsSync(candidate));
}

function cloneSkillSource(
  paths: HostPaths,
  skillName: string,
  results: BootstrapResult[],
  dryRun: boolean = false,
): string | undefined {
  if (dryRun) return undefined;

  const cacheRoot = paths.bootstrapCacheDir;
  mkdirSync(cacheRoot, { recursive: true });

  const repoDir = skillName === SKILL_FIND
    ? join(cacheRoot, 'vercel-labs-skills')
    : join(cacheRoot, 'anthropics-skills');
  const repoUrl = skillName === SKILL_FIND
    ? 'https://github.com/vercel-labs/skills.git'
    : 'https://github.com/anthropics/skills.git';
  const skillSubDir = join(repoDir, 'skills', skillName);

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
      name: skillName,
      level: 'ERROR',
      detail: `克隆失败：${(e as Error).message}`,
    });
    return undefined;
  }
}

function ensureMcpBinaries(): BootstrapResult[] {
  const results: BootstrapResult[] = [];

  results.push(checkBinary(
    'sequential-thinking',
    { command: 'npx', args: ['-y', '@modelcontextprotocol/server-sequential-thinking', '--help'] },
  ));

  const context7 = checkBinary(
    'context7',
    { command: 'npx', args: ['-y', '@upstash/context7-mcp', '--help'] },
    { command: 'npx', args: ['-y', 'context7-mcp-server', '--help'] },
  );
  results.push(context7);

  results.push(checkBinary(
    'fetch',
    { command: 'uvx', args: ['mcp-server-fetch', '--help'] },
  ));

  let serena = checkBinary(
    'serena',
    {
      command: 'uvx',
      args: ['--from', SERENA_REPO_URL, 'serena', 'start-mcp-server', '--help'],
      timeoutMs: SERENA_FALLBACK_TIMEOUT_MS,
    },
  );
  if (serena.level === 'ERROR') {
    serena = checkBinary(
      'serena',
      {
        command: 'uvx',
        args: ['--from', SERENA_REPO_URL, 'serena-mcp-server', '--help'],
        timeoutMs: SERENA_FALLBACK_TIMEOUT_MS,
      },
      {
        command: 'npx',
        args: ['-y', 'mcp-server-serena', '--help'],
      },
    );
  }
  results.push(serena);

  results.push(checkBinary(
    'playwright-mcp',
    { command: 'npx', args: ['-y', '@playwright/mcp', '--version'] },
  ));

  return results;
}

function checkBinary(
  name: string,
  checkCmd: BinaryCommand,
  fallbackCmd?: BinaryCommand,
): BootstrapResult {
  if (tryCommand(checkCmd)) {
    return {
      host: 'Common',
      category: 'Binary',
      name,
      level: 'PASS',
      detail: '可执行命令可用',
    };
  }

  if (fallbackCmd && tryCommand(fallbackCmd)) {
    return {
      host: 'Common',
      category: 'Binary',
      name,
      level: 'FIXED',
      detail: '回退可执行命令可用',
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

function readJsonObject(filePath: string): Record<string, unknown> {
  if (!existsSync(filePath)) return {};
  const content = readFileSync(filePath, 'utf-8').trim();
  if (!content) return {};

  try {
    const parsed = JSON.parse(content) as unknown;
    if (typeof parsed === 'object' && parsed && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

function sameStringArray(a: unknown, b: readonly string[]): boolean {
  return Array.isArray(a) && a.length === b.length && a.every((v, index) => v === b[index]);
}

function runCommand(command: BinaryCommand): void {
  execFileSync(command.command, command.args, {
    stdio: 'ignore',
    timeout: command.timeoutMs ?? COMMAND_TIMEOUT_MS,
  });
}

function tryCommand(command: BinaryCommand): boolean {
  try {
    runCommand(command);
    return true;
  } catch {
    return false;
  }
}
