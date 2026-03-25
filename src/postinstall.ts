/**
 * postinstall 入口
 * 全局安装时自动调用 spec-first update --from-postinstall
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  formatBullet,
  formatKeyValue,
  formatSubBullet,
  icon,
  joinSections,
  renderBrandBanner,
  renderSection,
} from './shared/cli-output.js';
import { detectHostPaths } from './shared/host-paths.js';
import { detectGlobalInstall, type InstallDetectionContext } from './shared/install-detection.js';
import { resolveHostAdapterStatuses } from './core/host-adapters/registry.js';
import type { HostAdapterStatus } from './core/host-adapters/types.js';

export interface SkillRegistrationStatus {
  claude: boolean;
  codex: boolean;
  claudePath: string;
  codexPath: string;
}

export interface ClaudeInstallationStatus {
  installed: boolean;
  configDir: string;
  commandsDir: string;
}

export interface CCSwitchInstallationStatus {
  installed: boolean;
  dataDir: string;
  skillsDir: string;
}

export interface PostinstallContext {
  env?: NodeJS.ProcessEnv;
  argv?: string[];
  onGlobalInstall?: () => boolean;
  skillStatus?: SkillRegistrationStatus;
  claudeInstallation?: ClaudeInstallationStatus;
  ccSwitchInstallation?: CCSwitchInstallationStatus;
  hostStatuses?: HostAdapterStatus[];
}

export function isGlobalInstall(context: InstallDetectionContext = {}): boolean {
  return detectGlobalInstall(context, import.meta.url);
}

/**
 * 检测 skills 是否已注册
 */
export function checkSkillsRegistered(): SkillRegistrationStatus {
  const hostPaths = detectHostPaths();
  const claudePath = join(hostPaths.claudeCommandsDir, 'spec-first');
  const codexPath = hostPaths.codexSkillsDir;

  return {
    claude: existsSync(claudePath),
    codex: existsSync(codexPath),
    claudePath,
    codexPath,
  };
}

/**
 * 检测 Claude Code 是否已安装
 */
export function detectClaudeInstallation(): ClaudeInstallationStatus {
  const hostPaths = detectHostPaths();
  const configExists = existsSync(hostPaths.claudeConfigDir);
  const commandsExists = existsSync(hostPaths.claudeCommandsDir);

  return {
    installed: configExists || commandsExists,
    configDir: hostPaths.claudeConfigDir,
    commandsDir: hostPaths.claudeCommandsDir,
  };
}

/**
 * 检测 CC Switch 是否已安装
 */
export function detectCCSwitchInstallation(): CCSwitchInstallationStatus {
  const hostPaths = detectHostPaths();
  return {
    installed: hostPaths.ccSwitchInstalled,
    dataDir: hostPaths.ccSwitchDataDir,
    skillsDir: hostPaths.ccSwitchSkillsDir,
  };
}

/**
 * 执行 spec-first update
 */
export function runUpdate(): void {
  const entry = join(fileURLToPath(new URL('.', import.meta.url)), 'cli', 'index.js');
  try {
    execFileSync(process.execPath, [entry, 'update', '--from-postinstall'], {
      stdio: 'inherit',
    });
  } catch {
    console.error(`${icon('warn')} 基线补齐失败，请运行: spec-first update`);
  }
}

/**
 * 打印安装完成提示
 */
export function printInstallGuide(options: {
  isGlobal: boolean;
  skillsRegistered: SkillRegistrationStatus;
  claudeInstalled: ClaudeInstallationStatus;
  ccSwitchInstalled: CCSwitchInstallationStatus;
  hostStatuses: HostAdapterStatus[];
}): void {
  const { isGlobal, skillsRegistered, claudeInstalled, ccSwitchInstalled, hostStatuses } = options;

  if (getMissingStableHostRegistrations(skillsRegistered).length === 0) {
    return;
  }

  const sections: string[] = [
    renderBrandBanner('安装后提示'),
    renderSection(`${icon('warn')} 安装状态:`, [
      formatBullet('基线能力尚未完整注册到 Claude Code / Codex。'),
      formatBullet(`建议命令: spec-first update`),
    ]),
  ];

  if (ccSwitchInstalled.installed) {
    sections.push(
      renderSection(`${icon('ok')} CC Switch:`, [
        formatKeyValue('数据目录', ccSwitchInstalled.dataDir),
        formatKeyValue('Skills 目录', ccSwitchInstalled.skillsDir),
        formatSubBullet('CC Switch 可以自动同步 Skills 到支持的 CLI。'),
      ])
    );
  }

  if (!claudeInstalled.installed) {
    sections.push(
      renderSection(`${icon('info')} Claude Code:`, [
        formatBullet('当前机器未检测到 Claude Code。'),
        formatSubBullet('如果你会用 Claude Code，先安装它: https://claude.ai/code'),
        formatSubBullet('也可以用 CC Switch 统一管理多个 CLI: https://github.com/farion1231/cc-switch'),
        formatSubBullet('安装后执行: spec-first update'),
      ])
    );
  } else if (!ccSwitchInstalled.installed) {
    sections.push(
      renderSection(`${icon('ok')} Claude Code:`, [
        formatKeyValue('配置目录', claudeInstalled.configDir),
        formatKeyValue('命令目录', claudeInstalled.commandsDir),
      ])
    );
  }

  sections.push(
    renderSection(`${icon('info')} 为什么要更新:`, [
      formatBullet('必备 Skills + 核心 MCP 服务都算基线能力。'),
      formatBullet('如果注册不完整，请运行: spec-first update'),
    ])
  );

  const stableHosts = hostStatuses.filter((entry) => entry.id === 'claude' || entry.id === 'codex');
  const experimentalHosts = hostStatuses.filter(
    (entry) =>
      (entry.id === 'gemini' || entry.id === 'cursor') &&
      (entry.detected || entry.baselineState !== 'unknown')
  );

  if (stableHosts.length > 0) {
    const stableLines: string[] = [];
    for (const entry of stableHosts) {
      const missing =
        entry.missingBaseline.length > 0
          ? `missing=${entry.missingBaseline.join('+')}`
          : 'missing=(none)';
      stableLines.push(
        formatBullet(
          `${entry.id}: ${entry.detected ? 'detected' : 'planned'}, baseline=${entry.baselineState}, ${missing}`
        )
      );
      if (entry.baselineState !== 'ready') {
        stableLines.push(formatSubBullet(entry.remediation));
      }
    }
    sections.push(renderSection(`${icon('info')} 稳定宿主状态:`, stableLines));
  }

  if (experimentalHosts.length > 0) {
    const experimentalLines: string[] = [];
    for (const entry of experimentalHosts) {
      const missing =
        entry.missingBaseline.length > 0
          ? `missing=${entry.missingBaseline.join('+')}`
          : 'missing=(none)';
      experimentalLines.push(
        formatBullet(
          `${entry.id}: ${entry.detected ? 'detected' : 'planned'}, baseline=${entry.baselineState}, ${missing}`
        )
      );
      experimentalLines.push(formatSubBullet(entry.remediation));
    }
    sections.push(renderSection(`${icon('info')} 实验宿主提示:`, experimentalLines));
  }

  if (process.env.SPEC_FIRST_DEBUG) {
    sections.push(
      renderSection(`${icon('info')} 调试信息:`, [
        formatKeyValue('全局安装', isGlobal ? 'yes' : 'no'),
        formatKeyValue('Claude Skills', skillsRegistered.claude ? 'registered' : 'not registered'),
        formatKeyValue('Codex Skills', skillsRegistered.codex ? 'registered' : 'not registered'),
        formatKeyValue('CC Switch', ccSwitchInstalled.installed ? 'installed' : 'not installed'),
      ])
    );
  }

  console.log(joinSections(...sections));
}

function getMissingStableHostRegistrations(skillsRegistered: SkillRegistrationStatus): string[] {
  const missing: string[] = [];
  if (!skillsRegistered.claude) missing.push('claude');
  if (!skillsRegistered.codex) missing.push('codex');
  return missing;
}

function isDirectExecution(argv: string[] = process.argv): boolean {
  const currentFile = fileURLToPath(import.meta.url);
  return Boolean(argv[1] && argv[1] === currentFile);
}

export function runPostinstallMain(context: PostinstallContext = {}): void {
  const globalInstall = context.onGlobalInstall?.() ?? isGlobalInstall();
  const skillsRegistered = context.skillStatus ?? checkSkillsRegistered();
  const claudeInstalled = context.claudeInstallation ?? detectClaudeInstallation();
  const ccSwitchInstalled = context.ccSwitchInstallation ?? detectCCSwitchInstallation();
  const hostStatuses = context.hostStatuses ?? resolveHostAdapterStatuses();

  if (globalInstall) {
    runUpdate();
    return;
  }

  printInstallGuide({
    isGlobal: globalInstall,
    skillsRegistered,
    claudeInstalled,
    ccSwitchInstalled,
    hostStatuses,
  });
}

if (isDirectExecution()) {
  runPostinstallMain();
}
