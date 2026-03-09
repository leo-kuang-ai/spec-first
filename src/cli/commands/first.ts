import { ExitCode } from '../../shared/types.js';
import { formatHealthStatus, checkFirstUpdateContext } from '../../core/skill-runtime/first-change-detector.js';
import { bootstrapFirstRuntime } from '../../core/skill-runtime/first-bootstrap.js';
import { executeFirst } from '../../core/skill-runtime/first-context.js';
import { FirstArgsError, validateFirstArgs } from '../../core/skill-runtime/first-args.js';
import { formatProductSummary } from '../../core/skill-runtime/first-resume.js';
import {
  readFirstRuntimeIndex,
} from '../../core/skill-runtime/first-runtime-store.js';

function printFirstHelp(): void {
  console.log('用法：spec-first first [--quick|--deep] [--type=<value>] [--force] [--skip] [--check-health]');
  console.log('');
  console.log('说明：');
  console.log('  - 无 runtime 真源时，生成最小 canonical `.spec-first/runtime/first/` 与 `docs/first/` 投影视图');
  console.log('  - 已有 runtime 真源时，优先刷新 runtime，再强制从 runtime 恢复 docs/first 投影');
}

function handleCheckHealth(projectRoot: string): number {
  const context = checkFirstUpdateContext(projectRoot);
  console.log(formatHealthStatus(context));

  if (!context.hasExistingOutput) {
    return ExitCode.VALIDATION_ERROR;
  }

  return context.productStatus.some((product) => product.issues.length > 0)
    ? ExitCode.VALIDATION_ERROR
    : ExitCode.SUCCESS;
}

function handleSkip(projectRoot: string): number {
  try {
    const result = executeFirst(projectRoot);
    if (result.docsProjections.length > 0) {
      console.log(`✓ 已从 runtime 恢复 docs 投影 (${result.docsProjections.length} 项)`);
    }
    console.log(formatProductSummary(projectRoot));
    return ExitCode.SUCCESS;
  } catch (error) {
    console.error(`--skip 执行失败：${error instanceof Error ? error.message : String(error)}`);
    return ExitCode.VALIDATION_ERROR;
  }
}

export function handleFirst(args: string[]): number {
  if (args.includes('--help') || args.includes('-h')) {
    printFirstHelp();
    return ExitCode.SUCCESS;
  }

  let firstArgs;
  try {
    firstArgs = validateFirstArgs(args, (warning) => console.warn(warning));
  } catch (error) {
    const message = error instanceof FirstArgsError || error instanceof Error
      ? error.message
      : String(error);
    console.error(message);
    printFirstHelp();
    return ExitCode.VALIDATION_ERROR;
  }

  const projectRoot = process.cwd();

  if (firstArgs.checkHealth) {
    return handleCheckHealth(projectRoot);
  }

  if (firstArgs.skip) {
    return handleSkip(projectRoot);
  }

  try {
    const index = readFirstRuntimeIndex(projectRoot);
    if (index?.summary.healthy && index.roleViews.healthy && index.stageViews.healthy) {
      const result = executeFirst(projectRoot);
      console.log(`✓ 已刷新 first runtime (${result.runtimeArtifacts.length} 项) 与 docs 投影 (${result.docsProjections.length} 项)`);
    } else {
      const bootstrap = bootstrapFirstRuntime(projectRoot, {
        mode: firstArgs.mode,
        platformType: firstArgs.type,
      });
      console.log(`✓ 已生成 first runtime (${bootstrap.runtimeArtifacts.length} 项) 与 docs 投影 (${bootstrap.docsProjections.length} 项)`);
    }

    console.log(formatProductSummary(projectRoot));
    return ExitCode.SUCCESS;
  } catch (error) {
    console.error(`first 执行失败：${error instanceof Error ? error.message : String(error)}`);
    return ExitCode.IO_ERROR;
  }
}
