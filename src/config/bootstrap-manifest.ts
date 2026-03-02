/**
 * Bootstrap 必需组件清单（manifest）。
 *
 * 该文件是单一事实来源（Single Source of Truth），集中维护：
 * - 必需 MCP 列表（Codex + Claude Code）
 * - 必需 Skill 列表及安装目标
 * - 深度诊断可选的 binary probe 命令
 */

/** MCP 启动命令定义 */
export interface McpCommandSpec {
  command: string;
  args: string[];
}

/** 二进制探测命令（可选超时） */
export interface BinaryProbeCommand extends McpCommandSpec {
  timeoutMs?: number;
}

/** 必需 MCP 的跨宿主定义 */
export interface RequiredMcpServer {
  name: string;
  codex: McpCommandSpec;
  claude: McpCommandSpec;
  binaryProbes?: BinaryProbeCommand[];
}

/** Skill 来源位置（用于本地查找优先级） */
export type SkillSourceLocation = 'agents' | 'codex' | 'codex-system' | 'claude';

/** Skill 缺失时的 clone 兜底来源 */
export interface SkillCloneSpec {
  repoDir: string;
  repoUrl: string;
}

/** 必需 Skill 定义 */
export interface RequiredSkill {
  name: string;
  codexTarget: 'root' | 'system';
  sourcePriority: SkillSourceLocation[];
  clone?: SkillCloneSpec;
}

// Serena 默认仓库与运行上下文
const SERENA_REPO_URL = 'git+https://github.com/oraios/serena';
const SERENA_CONTEXT = 'ide-assistant';
// 探测命令默认超时（毫秒）
const DEFAULT_TIMEOUT_MS = 60_000;
const SERENA_TIMEOUT_MS = 180_000;

/** 必需 MCP 清单 */
export const REQUIRED_MCP_SERVERS: readonly RequiredMcpServer[] = [
  {
    name: 'sequential-thinking',
    codex: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
    },
    claude: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
    },
    binaryProbes: [
      {
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-sequential-thinking', '--help'],
        timeoutMs: DEFAULT_TIMEOUT_MS,
      },
    ],
  },
  {
    name: 'context7',
    codex: {
      command: 'npx',
      args: ['-y', '@upstash/context7-mcp'],
    },
    claude: {
      command: 'npx',
      args: ['-y', 'context7-mcp-server'],
    },
    binaryProbes: [
      {
        command: 'npx',
        args: ['-y', '@upstash/context7-mcp', '--help'],
        timeoutMs: DEFAULT_TIMEOUT_MS,
      },
      {
        command: 'npx',
        args: ['-y', 'context7-mcp-server', '--help'],
        timeoutMs: DEFAULT_TIMEOUT_MS,
      },
    ],
  },
  {
    name: 'serena',
    codex: {
      command: 'uvx',
      args: ['--from', SERENA_REPO_URL, 'serena', 'start-mcp-server', '--context', SERENA_CONTEXT],
    },
    claude: {
      command: 'uvx',
      args: ['--from', SERENA_REPO_URL, 'serena', 'start-mcp-server', '--context', SERENA_CONTEXT],
    },
    binaryProbes: [
      {
        command: 'uvx',
        args: ['--from', SERENA_REPO_URL, 'serena', 'start-mcp-server', '--help'],
        timeoutMs: SERENA_TIMEOUT_MS,
      },
      {
        command: 'uvx',
        args: ['--from', SERENA_REPO_URL, 'serena-mcp-server', '--help'],
        timeoutMs: SERENA_TIMEOUT_MS,
      },
      {
        command: 'npx',
        args: ['-y', 'mcp-server-serena', '--help'],
        timeoutMs: DEFAULT_TIMEOUT_MS,
      },
    ],
  },
  {
    name: 'fetch',
    codex: {
      command: 'uvx',
      args: ['mcp-server-fetch'],
    },
    claude: {
      command: 'uvx',
      args: ['mcp-server-fetch'],
    },
    binaryProbes: [
      {
        command: 'uvx',
        args: ['mcp-server-fetch', '--help'],
        timeoutMs: DEFAULT_TIMEOUT_MS,
      },
    ],
  },
  {
    name: 'playwright-mcp',
    codex: {
      command: 'npx',
      args: ['-y', '@playwright/mcp@latest'],
    },
    claude: {
      command: 'npx',
      args: ['-y', '@playwright/mcp@latest'],
    },
    binaryProbes: [
      {
        command: 'npx',
        args: ['-y', '@playwright/mcp', '--version'],
        timeoutMs: DEFAULT_TIMEOUT_MS,
      },
    ],
  },
];

/** 必需 Skill 清单 */
export const REQUIRED_SKILLS: readonly RequiredSkill[] = [
  {
    name: 'find-skills',
    codexTarget: 'root',
    sourcePriority: ['agents', 'codex', 'claude'],
    clone: {
      repoDir: 'vercel-labs-skills',
      repoUrl: 'https://github.com/vercel-labs/skills.git',
    },
  },
  {
    name: 'skill-creator',
    codexTarget: 'system',
    sourcePriority: ['codex-system', 'codex', 'claude', 'agents'],
    clone: {
      repoDir: 'anthropics-skills',
      repoUrl: 'https://github.com/anthropics/skills.git',
    },
  },
];
