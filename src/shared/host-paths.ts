import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface HostPathOptions {
  env?: NodeJS.ProcessEnv;
  homeDir?: string;
  platform?: NodeJS.Platform;
}

export interface HostPaths {
  homeDir: string;
  codexRoot: string;
  codexConfigPath: string;
  codexSkillsDir: string;
  codexSystemSkillsDir: string;
  claudeHomeDir: string;
  claudeSkillsDir: string;
  claudeCommandsDir: string;
  claudeConfigDir: string;
  claudeConfigFiles: string[];
  agentsSkillsDir: string;
  genericHomeDir: string;
  genericSkillsDir: string;
  specFirstSkillsDir: string;
  bootstrapCacheDir: string;
  /** CC Switch 安装检测 */
  ccSwitchInstalled: boolean;
  /** CC Switch 数据目录 */
  ccSwitchDataDir: string;
  /** CC Switch skills 目录 */
  ccSwitchSkillsDir: string;
}

export function formatHostPathSummary(paths: HostPaths): string[] {
  return [
    `Codex 配置: ${paths.codexConfigPath}`,
    `Codex skills: ${paths.codexSkillsDir}`,
    `Claude 配置目录: ${paths.claudeConfigDir}`,
    `Claude 命令目录: ${paths.claudeCommandsDir}`,
    `Claude skills: ${paths.claudeSkillsDir}`,
    `Generic skills: ${paths.genericSkillsDir}`,
    `spec-first skills: ${paths.specFirstSkillsDir}`,
    `CC Switch: ${paths.ccSwitchInstalled ? '已安装' : '未安装'} (${paths.ccSwitchDataDir})`,
  ];
}

function normalizeCandidates(candidates: Array<string | undefined>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    if (!candidate) continue;
    const trimmed = candidate.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

function pickDirectoryByMarkers(candidates: string[], markers: string[]): string | undefined {
  for (const candidate of candidates) {
    if (markers.some((marker) => existsSync(join(candidate, marker)))) {
      return candidate;
    }
  }
  return candidates[0];
}

function buildCodexRootCandidates(
  env: NodeJS.ProcessEnv,
  homeDir: string,
  platform: NodeJS.Platform,
): string[] {
  const appData = env.APPDATA;
  const localAppData = env.LOCALAPPDATA;
  const xdg = env.XDG_CONFIG_HOME;
  return normalizeCandidates([
    env.CODEX_HOME,
    env.CODEX_ROOT,
    platform === 'win32' && appData ? join(appData, 'codex') : undefined,
    platform === 'win32' && localAppData ? join(localAppData, 'codex') : undefined,
    xdg ? join(xdg, 'codex') : undefined,
    join(homeDir, '.codex'),
  ]);
}

function buildClaudeConfigCandidates(
  env: NodeJS.ProcessEnv,
  homeDir: string,
  platform: NodeJS.Platform,
): string[] {
  const appData = env.APPDATA;
  const localAppData = env.LOCALAPPDATA;
  const xdg = env.XDG_CONFIG_HOME;
  return normalizeCandidates([
    env.CLAUDE_CODE_CONFIG_DIR,
    env.CLAUDE_CONFIG_DIR,
    platform === 'win32' && appData ? join(appData, 'claude-code') : undefined,
    platform === 'win32' && localAppData ? join(localAppData, 'claude-code') : undefined,
    xdg ? join(xdg, 'claude-code') : undefined,
    platform === 'darwin' ? join(homeDir, 'Library', 'Application Support', 'claude-code') : undefined,
    platform === 'darwin' ? join(homeDir, 'Library', 'Application Support', 'Claude Code') : undefined,
    join(homeDir, '.config', 'claude-code'),
  ]);
}

function buildClaudeHomeCandidates(
  env: NodeJS.ProcessEnv,
  homeDir: string,
  platform: NodeJS.Platform,
): string[] {
  const appData = env.APPDATA;
  return normalizeCandidates([
    env.CLAUDE_HOME,
    env.CLAUDE_USER_HOME,
    platform === 'win32' && appData ? join(appData, 'claude') : undefined,
    join(homeDir, '.claude'),
  ]);
}

export function detectHostPaths(options?: HostPathOptions): HostPaths {
  const env = options?.env ?? process.env;
  const homeDir = options?.homeDir ?? homedir();
  const platform = options?.platform ?? process.platform;

  // CC Switch 检测（优先级最高）
  const ccSwitchDataDir = env.CC_SWITCH_DATA_DIR?.trim() || join(homeDir, '.cc-switch');
  const ccSwitchSkillsDir = env.CC_SWITCH_SKILLS_DIR?.trim() || join(ccSwitchDataDir, 'skills');
  const ccSwitchInstalled = existsSync(join(ccSwitchDataDir, 'cc-switch.db'));

  const codexRoot = pickDirectoryByMarkers(
    buildCodexRootCandidates(env, homeDir, platform),
    ['config.toml', 'skills'],
  ) ?? join(homeDir, '.codex');

  const codexConfigPath = env.CODEX_CONFIG_PATH?.trim() || join(codexRoot, 'config.toml');
  const codexSkillsDir = env.CODEX_SKILLS_DIR?.trim() || join(codexRoot, 'skills');
  const codexSystemSkillsDir = join(codexSkillsDir, '.system');

  const claudeConfigDir = pickDirectoryByMarkers(
    buildClaudeConfigCandidates(env, homeDir, platform),
    ['mcp.json', 'settings.json'],
  ) ?? join(homeDir, '.config', 'claude-code');

  const claudeConfigFiles = [
    join(claudeConfigDir, 'mcp.json'),
    join(claudeConfigDir, 'settings.json'),
  ];

  const claudeHomeDir = pickDirectoryByMarkers(
    buildClaudeHomeCandidates(env, homeDir, platform),
    ['skills', 'commands'],
  ) ?? join(homeDir, '.claude');

  const claudeSkillsDir = env.CLAUDE_SKILLS_DIR?.trim() || join(claudeHomeDir, 'skills');
  const claudeCommandsDir = env.CLAUDE_COMMANDS_DIR?.trim() || join(claudeHomeDir, 'commands');
  const agentsSkillsDir = env.AGENTS_HOME?.trim()
    ? join(env.AGENTS_HOME.trim(), 'skills')
    : join(homeDir, '.agents', 'skills');
  const genericHomeDir = env.SPEC_FIRST_GENERIC_HOME?.trim()
    || join(homeDir, '.spec-first', 'generic');
  const genericSkillsDir = env.SPEC_FIRST_GENERIC_SKILLS_DIR?.trim()
    || join(genericHomeDir, 'skills');
  const specFirstSkillsDir = env.SPEC_FIRST_SKILLS_DIR?.trim()
    || join(homeDir, '.spec-first', 'skills');
  const bootstrapCacheDir = env.SPEC_FIRST_BOOTSTRAP_CACHE?.trim()
    || join(homeDir, '.spec-first', 'bootstrap-cache');

  return {
    homeDir,
    codexRoot,
    codexConfigPath,
    codexSkillsDir,
    codexSystemSkillsDir,
    claudeHomeDir,
    claudeSkillsDir,
    claudeCommandsDir,
    claudeConfigDir,
    claudeConfigFiles,
    agentsSkillsDir,
    genericHomeDir,
    genericSkillsDir,
    specFirstSkillsDir,
    bootstrapCacheDir,
    ccSwitchInstalled,
    ccSwitchDataDir,
    ccSwitchSkillsDir,
  };
}
