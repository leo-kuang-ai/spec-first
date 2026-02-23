/**
 * setup CLI 命令
 * spec-first setup [--global]
 *
 * 注册 Skill 命令入口到 Claude Code + Codex（路径由系统探测）。
 * --global: 写入全局 Claude/Codex 目录（所有项目可见）
 * 默认: 仅写入当前目录 .claude/commands/（当前项目）
 */
import { handleUpdate } from './update.js';

/** @deprecated 使用 spec-first update 替代 */
export function handleSetup(args: string[]): number {
  console.warn('⚠️ setup 已废弃，请使用 spec-first update');
  return handleUpdate(args.filter(a => a !== '--global'));
}
