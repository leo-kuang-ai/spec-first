/**
 * AI CLI 命令组
 * ai context / ai catchup / ai stats
 */
import { ExitCode } from '../../shared/types.js';
import { buildContextPack, validateControlSize } from '../../core/ai-orchestrator/context-pack.js';
import { catchup } from '../../core/ai-orchestrator/catchup.js';
import { readStats, summarizeStats } from '../../core/ai-orchestrator/ai-stats.js';

export function handleAi(args: string[]): number {
  const sub = args[0];
  switch (sub) {
    case 'context': return handleContext(args.slice(1));
    case 'catchup': return handleCatchup(args.slice(1));
    case 'stats': return handleStats(args.slice(1));
    default:
      printAiHelp();
      if (sub) console.error(`Unknown ai subcommand: ${sub}`);
      return ExitCode.VALIDATION_ERROR;
  }
}

function handleContext(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('Usage: spec-first ai context <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }

  try {
    const pack = buildContextPack(featureId, process.cwd());
    const valid = validateControlSize(pack);

    console.log(`Context Pack — ${featureId} (v${pack.version})\n`);
    console.log(`Phase: ${pack.control.current_phase}`);
    console.log(`Control size: ${pack.budget.controlSize} bytes ${valid ? '(OK)' : '(EXCEEDED 2KB!)'}`);
    console.log(`References: ${pack.budget.refsCount}`);

    if (pack.references.length > 0) {
      console.log('\nReferences:');
      for (const ref of pack.references) {
        console.log(`  ${ref.path} [${ref.reason}] ${ref.checksum.slice(0, 8)}...`);
      }
    }

    return valid ? ExitCode.SUCCESS : ExitCode.VALIDATION_ERROR;
  } catch {
    console.error(`Failed to build context pack for ${featureId}`);
    return ExitCode.IO_ERROR;
  }
}

function handleCatchup(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('Usage: spec-first ai catchup <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }

  try {
    const result = catchup(featureId, process.cwd());
    console.log(result.summary);
    return ExitCode.SUCCESS;
  } catch {
    console.error(`Failed to run catchup for ${featureId}`);
    return ExitCode.IO_ERROR;
  }
}

function handleStats(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('Usage: spec-first ai stats <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }

  const entries = readStats(featureId, process.cwd());
  if (entries.length === 0) {
    console.log('No AI statistics recorded.');
    return ExitCode.SUCCESS;
  }

  const summary = summarizeStats(entries);
  console.log(`AI Statistics — ${featureId}\n`);
  console.log(`Total calls: ${summary.totalCalls}`);
  console.log(`Total tokens: ${summary.totalTokensIn} in / ${summary.totalTokensOut} out`);
  console.log(`Total duration: ${summary.totalDuration}s\n`);

  console.log('By Skill:');
  for (const [skill, data] of Object.entries(summary.bySkill)) {
    console.log(`  ${skill.padEnd(20)} ${data.calls} calls  ${data.tokensIn}/${data.tokensOut} tokens`);
  }

  return ExitCode.SUCCESS;
}

function printAiHelp(): void {
  console.log('Usage: spec-first ai <subcommand>\n');
  console.log('Subcommands:');
  console.log('  context   Build and display Context Pack');
  console.log('  catchup   Execute 7-step session recovery');
  console.log('  stats     View AI call statistics');
}
