/**
 * setup CLI 命令
 * spec-first setup [--global]
 *
 * 注册 Skill 命令入口到 Claude Code + Codex（路径由系统探测）。
 * --global: 写入全局 Claude/Codex 目录（所有项目可见）
 * 默认: 仅写入当前目录 .claude/commands/（当前项目）
 */
import { ExitCode } from '../../shared/types.js';
import { detectHostPaths } from '../../shared/host-paths.js';
import { ensureSkillCommands } from '../../shared/skill-commands.js';

export function handleSetup(args: string[]): number {
  const hostPaths = detectHostPaths();
  if (args.includes('--help') || args.includes('-h')) {
    console.log('用法: spec-first setup [--global]\n');
    console.log('将 Skill 命令注册到 Claude Code 与 Codex。\n');
    console.log('选项:');
    console.log(`  --global    写入 ${hostPaths.claudeCommandsDir} + ${hostPaths.codexSkillsDir}（全局生效）`);
    console.log('              默认: 仅写入 .claude/commands/（当前项目）');
    return ExitCode.SUCCESS;
  }

  const isGlobal = args.includes('--global');
  const result = ensureSkillCommands(process.cwd(), { global: isGlobal });

  if (result.claude.length === 0 && result.codex.length === 0) {
    console.log('未发现可注册的 Skill 命令。');
    return ExitCode.SUCCESS;
  }

  if (result.claude.length > 0) {
    const target = isGlobal ? hostPaths.claudeCommandsDir : '.claude/commands/';
    console.log(`Claude Code：已注册 ${result.claude.length} 个命令 → ${target}`);
  }
  if (result.codex.length > 0) {
    console.log(`Codex：已注册 ${result.codex.length} 个技能 → ${hostPaths.codexSkillsDir}`);
  }

  return ExitCode.SUCCESS;
}
