/**
 * onboarding CLI 命令
 * spec-first onboarding
 *
 * 注意：onboarding 是纯 AI 交互式 skill，CLI 仅提供引导信息
 * 实际功能通过 /spec-first:onboarding 调用
 */
import { ExitCode } from '../../shared/types.js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export function handleOnboarding(): number {
  const projectRoot = process.cwd();
  const hasFirstAssets = existsSync(join(projectRoot, '.spec-first', 'runtime', 'first', 'index.json'));

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
