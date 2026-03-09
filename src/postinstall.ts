/**
 * postinstall 入口
 * 全局安装时自动调用 spec-first update --from-postinstall
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectHostPaths } from './shared/host-paths.js';

/**
 * 检测当前包是否安装在全局 node_modules 中
 * 通过检查当前文件路径是否包含全局 node_modules 路径特征
 */
function isInGlobalNodeModules(): boolean {
  // 获取当前文件所在目录（dist/ 或 src/）
  const currentDir = dirname(fileURLToPath(import.meta.url));

  // 全局 node_modules 的路径特征
  const globalPatterns = [
    '/lib/node_modules/',
    '/node_modules/',  // 通用模式
    '\\node_modules\\', // Windows
  ];

  // 检查是否包含全局路径特征
  for (const pattern of globalPatterns) {
    if (currentDir.includes(pattern)) {
      // 进一步检查是否在全局目录下（而非项目 node_modules）
      // 全局安装通常路径为：/usr/local/lib/node_modules/ 或 ~/.npm-global/lib/node_modules/
      const lowerPath = currentDir.toLowerCase();
      if (
        lowerPath.includes('/usr/local/') ||
        lowerPath.includes('/usr/lib/') ||
        lowerPath.includes('.npm-global') ||
        lowerPath.includes('.npm/lib') ||
        lowerPath.includes('appdata') || // Windows
        lowerPath.includes('program files') // Windows
      ) {
        return true;
      }
    }
  }

  return false;
}

function isGlobalInstall(): boolean {
  // 1. npm 官方标记（最可靠）
  if (process.env.npm_config_global === 'true') return true;

  // 2. pnpm global
  if (process.env.PNPM_HOME && process.execPath.includes(process.env.PNPM_HOME)) return true;

  // 3. yarn global (yarn 设置 npm_config_global 不一定为 true)
  if (process.env.npm_config_prefix && process.env.npm_config_prefix.includes('.yarn')) return true;

  // 4. volta managed
  if (process.env.VOLTA_HOME && process.execPath.includes(process.env.VOLTA_HOME)) return true;

  // 5. 通用检测：npm prefix --global 路径包含在安装路径中
  if (process.env.npm_config_prefix && process.argv[1]?.includes(process.env.npm_config_prefix)) return true;

  // 6. 检测 INIT_CWD（npm 7+ 设置的初始工作目录）
  // 全局安装时 INIT_CWD 通常是用户 home 目录或全局 node_modules 路径
  const initCwd = process.env.INIT_CWD;
  if (initCwd) {
    const home = homedir();
    // 如果 INIT_CWD 不包含项目特征（package.json），很可能是全局安装
    const hasProjectPkg = existsSync(join(initCwd, 'package.json'));
    if (!hasProjectPkg && initCwd === home) {
      return true;
    }
  }

  // 7. 检测当前包是否在全局 node_modules 路径中
  if (isInGlobalNodeModules()) return true;

  // 8. 通过 npm_config_root 检测（某些 npm 版本设置）
  if (process.env.npm_config_root && process.argv[1]?.includes(process.env.npm_config_root)) {
    return true;
  }

  return false;
}

/**
 * 检测 skills 是否已注册
 */
function checkSkillsRegistered(): {
  claude: boolean;
  codex: boolean;
  claudePath: string;
  codexPath: string;
} {
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
function detectClaudeInstallation(): {
  installed: boolean;
  configDir: string;
  commandsDir: string;
} {
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
function detectCCSwitchInstallation(): {
  installed: boolean;
  dataDir: string;
  skillsDir: string;
} {
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
function runUpdate(): void {
  const entry = join(fileURLToPath(new URL('.', import.meta.url)), 'cli', 'index.js');
  try {
    execFileSync(process.execPath, [entry, 'update', '--from-postinstall', '--yes'], { stdio: 'inherit' });
  } catch {
    console.error('❌ 自动注册失败，请手动执行: spec-first update --yes');
  }
}

/**
 * 打印安装完成提示
 */
function printInstallGuide(options: {
  isGlobal: boolean;
  skillsRegistered: ReturnType<typeof checkSkillsRegistered>;
  claudeInstalled: ReturnType<typeof detectClaudeInstallation>;
  ccSwitchInstalled: ReturnType<typeof detectCCSwitchInstallation>;
}): void {
  const { isGlobal, skillsRegistered, claudeInstalled, ccSwitchInstalled } = options;

  // 如果 skills 已注册，不需要提示
  if (skillsRegistered.claude || skillsRegistered.codex) {
    return;
  }

  console.log('\n📦 spec-first 安装完成！\n');

  // skills 未注册的情况
  console.log('⚠️  Skills 尚未注册到 Claude Code/Codex');
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
    console.log('   - 或使用 CC Switch 统一管理多个 CLI 工具：https://github.com/farion1231/cc-switch');
    console.log('   - 安装后重新运行 spec-first update\n');
  } else if (!ccSwitchInstalled.installed) {
    console.log('✅ 检测到 Claude Code 安装');
    console.log(`   配置目录: ${claudeInstalled.configDir}`);
    console.log(`   命令目录: ${claudeInstalled.commandsDir}\n`);
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

// 主逻辑
const globalInstall = isGlobalInstall();
const skillsRegistered = checkSkillsRegistered();
const claudeInstalled = detectClaudeInstallation();
const ccSwitchInstalled = detectCCSwitchInstallation();

if (globalInstall) {
  // 全局安装：自动执行 update
  runUpdate();
} else {
  // 非全局安装或检测失败：给出友好提示
  printInstallGuide({
    isGlobal: globalInstall,
    skillsRegistered,
    claudeInstalled,
    ccSwitchInstalled,
  });
}
