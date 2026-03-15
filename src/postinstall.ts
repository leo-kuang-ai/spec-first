/**
 * postinstall 入口
 * 全局安装时自动调用 spec-first update --from-postinstall
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
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
  const codexPath = join(hostPaths.codexSkillsDir, 'spec-first');

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
    console.error('❌ 基线能力自动补齐失败，请手动执行: spec-first update');
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

  console.log('\n📦 spec-first 安装完成！\n');

  // skills 未注册的情况
  console.log('⚠️  基线能力尚未完整注册到 Claude Code/Codex');
  console.log('\n请执行以下命令完成注册：');
  console.log('   spec-first update\n');

  // CC Switch 检测
  if (ccSwitchInstalled.installed) {
    console.log('✅ 检测到 CC Switch 安装');
    console.log(`   数据目录: ${ccSwitchInstalled.dataDir}`);
    console.log(`   Skills 目录: ${ccSwitchInstalled.skillsDir}`);
    console.log('   提示: CC Switch 会自动同步 skills 到各个 CLI 工具\n');
  }

  // Claude Code 安装检测
  if (!claudeInstalled.installed) {
    console.log('💡 提示：未检测到 Claude Code 安装');
    console.log('   - 如果您使用 Claude Code，请先安装：https://claude.ai/code');
    console.log(
      '   - 或使用 CC Switch 统一管理多个 CLI 工具：https://github.com/farion1231/cc-switch'
    );
    console.log('   - 安装后重新运行 spec-first update\n');
  } else if (!ccSwitchInstalled.installed) {
    console.log('✅ 检测到 Claude Code 安装');
    console.log(`   配置目录: ${claudeInstalled.configDir}`);
    console.log(`   命令目录: ${claudeInstalled.commandsDir}\n`);
  }

  console.log('💡 提示：spec-first 的必备 Skills + 核心 MCP 属于基线能力。');
  console.log('   如未自动补齐，请优先执行 spec-first update\n');

  const stableHosts = hostStatuses.filter(
    (entry) => entry.id === 'claude' || entry.id === 'codex'
  );
  const experimentalHosts = hostStatuses.filter(
    (entry) =>
      (entry.id === 'gemini' || entry.id === 'cursor') &&
      (entry.detected || entry.baselineState !== 'unknown')
  );

  if (stableHosts.length > 0) {
    console.log('宿主基线状态：');
    for (const entry of stableHosts) {
      const missing =
        entry.missingBaseline.length > 0 ? `missing=${entry.missingBaseline.join('+')}` : 'missing=(none)';
      console.log(
        `   ${entry.id}: ${entry.detected ? 'detected' : 'planned'}, baseline=${entry.baselineState}, ${missing}`
      );
      if (entry.baselineState !== 'ready') {
        console.log(`   - ${entry.remediation}`);
      }
    }
    console.log('');
  }

  if (experimentalHosts.length > 0) {
    console.log('实验宿主提示：');
    for (const entry of experimentalHosts) {
      const missing =
        entry.missingBaseline.length > 0 ? `missing=${entry.missingBaseline.join('+')}` : 'missing=(none)';
      console.log(
        `   ${entry.id}: ${entry.detected ? 'detected' : 'planned'}, baseline=${entry.baselineState}, ${missing}`
      );
      console.log(`   - ${entry.remediation}`);
    }
    console.log('');
  }

  // 显示检测到的路径信息（调试用）
  if (process.env.SPEC_FIRST_DEBUG) {
    console.log('🔍 调试信息：');
    console.log(`   全局安装检测: ${isGlobal ? '是' : '否'}`);
    console.log(`   Claude skills: ${skillsRegistered.claude ? '已注册' : '未注册'}`);
    console.log(`   Codex skills: ${skillsRegistered.codex ? '已注册' : '未注册'}`);
    console.log(`   CC Switch: ${ccSwitchInstalled.installed ? '已安装' : '未安装'}`);
    console.log('');
  }
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
