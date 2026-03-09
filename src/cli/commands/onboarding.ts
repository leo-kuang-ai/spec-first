/**
 * onboarding CLI 命令
 * spec-first onboarding [--role=<role>] [--task=<task>] [--size=<size>]
 *
 * 注意：onboarding 是纯 AI 交互式 skill，CLI 仅提供引导信息
 * 实际功能通过 /spec-first:onboarding 调用
 */
import { ExitCode } from '../../shared/types.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

function parseArgs(args: string[]): { role?: string; task?: string; size?: string } {
  const result: { role?: string; task?: string; size?: string } = {};
  for (const arg of args) {
    if (arg.startsWith('--role=')) result.role = arg.slice(7);
    else if (arg.startsWith('--task=')) result.task = arg.slice(7);
    else if (arg.startsWith('--size=')) result.size = arg.slice(7);
  }
  return result;
}

export function handleOnboarding(args: string[]): number {
  const projectRoot = process.cwd();
  const hasFirstAssets = existsSync(join(projectRoot, '.spec-first', 'runtime', 'first', 'index.json'));
  const params = parseArgs(args);

  if (params.role || params.task || params.size) {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    🎉 欢迎使用 Spec-First！                    ║
╚═══════════════════════════════════════════════════════════════╝

检测到快速启动参数：
${params.role ? `  角色: ${params.role}` : ''}
${params.task ? `  任务: ${params.task}` : ''}
${params.size ? `  规模: ${params.size}` : ''}

⚠️ CLI 不支持参数化启动，请通过 AI 助手调用：

    /spec-first:onboarding

AI 助手会根据你的选择生成个性化学习路径。
`);
    return ExitCode.SUCCESS;
  }

  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    🎉 欢迎使用 Spec-First！                    ║
╚═══════════════════════════════════════════════════════════════╝

onboarding 是一个交互式新手引导 skill，需要通过 AI 助手调用。

${hasFirstAssets
    ? '📊 检测到项目已有 first 资产，将提供基于项目分析的个性化推荐'
    : '⚠️ 未检测到 first 资产，建议先运行 /spec-first:first 获取更好的体验'}

🚀 启动方式：

    在 Claude Code 中输入：

    /spec-first:onboarding

📚 快速开始：

    1. 项目认知：/spec-first:first
    2. 初始化 Feature：/spec-first:init
    3. 查看状态：/spec-first:status
    4. 环境诊断：/spec-first:doctor

💡 提示：运行 /spec-first:onboarding 获取个性化学习路径推荐
`);

  return ExitCode.SUCCESS;
}
