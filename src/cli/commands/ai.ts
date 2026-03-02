/**
 * AI CLI 命令组
 * ai context / ai catchup / ai stats
 */
import { ExitCode } from '../../shared/types.js';
import { buildContextPack, validateControlSize } from '../../core/ai-orchestrator/context-pack.js';
import { catchup } from '../../core/ai-orchestrator/catchup.js';
import { readStats, summarizeStats } from '../../core/ai-orchestrator/ai-stats.js';
import { parseFlag } from '../parse-utils.js';
import { getFirstRuntimeNotice } from '../../core/skill-runtime/dispatcher.js';

export function handleAi(args: string[]): number {
  const sub = args[0];
  switch (sub) {
    case 'context': return handleContext(args.slice(1));
    case 'catchup': return handleCatchup(args.slice(1));
    case 'stats': return handleStats(args.slice(1));
    default:
      printAiHelp();
      if (sub) console.error(`未知 ai 子命令：${sub}`);
      return ExitCode.VALIDATION_ERROR;
  }
}

function handleContext(args: string[]): number {
  const featureId = args.find((arg) => !arg.startsWith('--'));
  if (!featureId) {
    console.error('用法：spec-first ai context <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }
  const fullDetail = args.includes('--full');
  const expandArg = parseFlag(args, '--expand');
  const expandPaths = expandArg
    ? expandArg.split(',').map((item) => item.trim()).filter(Boolean)
    : [];

  try {
    const pack = buildContextPack(featureId, process.cwd(), { fullDetail, expandPaths });
    const valid = validateControlSize(pack);

    console.log(`上下文包 — ${featureId} (v${pack.version})\n`);
    console.log(`阶段：${pack.control.current_phase}`);
    console.log(`控制区大小：${pack.budget.controlSize} bytes ${valid ? '(通过)' : '(超出 2KB!)'}`);
    console.log(`引用数：${pack.budget.refsCount}`);
    console.log(`Token 预算：${pack.budget.tokenBudget}`);
    console.log(`Token 估算：${pack.budget.estimatedTokensRaw} -> ${pack.budget.estimatedTokens}`);
    if (pack.slicing.degradationLevel > 0 && pack.slicing.warning) {
      console.log(`裁剪级别：L${pack.slicing.degradationLevel} (${pack.slicing.warning})`);
    }

    if (pack.references.length > 0) {
      console.log('\n引用列表：');
      for (const ref of pack.references) {
        console.log(`  ${ref.path}#${ref.selector ?? 'n/a'} [${ref.reason}] ${ref.checksum.slice(0, 8)}...`);
      }
    }

    if (!fullDetail && expandPaths.length === 0) {
      console.log('\n提示：默认摘要模式。需要详细上下文时可用 `--expand spec.md,design.md` 或 `--full`。');
    }

    return valid ? ExitCode.SUCCESS : ExitCode.VALIDATION_ERROR;
  } catch (e) {
    console.error(`构建上下文包失败：${featureId}`);
    console.error(`  原因：${(e as Error).message}`);
    return ExitCode.IO_ERROR;
  }
}

function handleCatchup(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('用法：spec-first ai catchup <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }

  try {
    const result = catchup(featureId, process.cwd());
    console.log(result.summary);

    const firstNotice = getFirstRuntimeNotice(process.cwd());
    if (firstNotice) {
      const cleaned = firstNotice
        .replace(/<!--\s*\/?first-runtime-context\s*-->/g, '')
        .trim();
      if (cleaned) {
        console.log(`\n${cleaned}`);
      }
    }

    return ExitCode.SUCCESS;
  } catch (e) {
    console.error(`执行会话恢复失败：${featureId}`);
    console.error(`  原因：${(e as Error).message}`);
    return ExitCode.IO_ERROR;
  }
}

function handleStats(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('用法：spec-first ai stats <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }

  const entries = readStats(featureId, process.cwd());
  if (entries.length === 0) {
    console.log('暂无 AI 统计记录。');
    return ExitCode.SUCCESS;
  }

  const summary = summarizeStats(entries);
  console.log(`AI 统计 — ${featureId}\n`);
  console.log(`总调用次数：${summary.totalCalls}`);
  console.log(`总 Token：输入 ${summary.totalTokensIn} / 输出 ${summary.totalTokensOut}`);
  console.log(`总耗时：${summary.totalDuration}s\n`);

  console.log('按 Skill 统计：');
  for (const [skill, data] of Object.entries(summary.bySkill)) {
    console.log(`  ${skill.padEnd(20)} ${data.calls} 次  ${data.tokensIn}/${data.tokensOut} tokens`);
  }

  return ExitCode.SUCCESS;
}

function printAiHelp(): void {
  console.log('用法：spec-first ai <subcommand>\n');
  console.log('子命令：');
  console.log('  context   生成并展示上下文包（支持 --full / --expand <path1,path2>）');
  console.log('  catchup   执行 6 步会话恢复');
  console.log('  stats     查看 AI 调用统计');
}
