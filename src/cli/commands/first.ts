import { ExitCode } from '../../shared/types.js';
import { formatHealthStatus, checkFirstUpdateContext } from '../../core/skill-runtime/first-change-detector.js';
import { bootstrapFirstRuntime } from '../../core/skill-runtime/first-bootstrap.js';
import { refreshFirstArtifacts } from '../../core/skill-runtime/first-context.js';
import { FirstArgsError, validateFirstArgs } from '../../core/skill-runtime/first-args.js';
import { formatProductSummary } from '../../core/skill-runtime/first-resume.js';
import {
  readFirstRoleViews,
  readFirstRuntimeIndex,
  readFirstRuntimeSummary,
  readFirstStageViews,
} from '../../core/skill-runtime/first-runtime-store.js';

function hasHealthyRuntimeTruth(projectRoot: string): boolean {
  const index = readFirstRuntimeIndex(projectRoot);
  if (!index?.summary.healthy || !index.roleViews.healthy || !index.stageViews.healthy) {
    return false;
  }

  return Boolean(
    readFirstRuntimeSummary(projectRoot)
    && readFirstRoleViews(projectRoot)
    && readFirstStageViews(projectRoot),
  );
}

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
  if (!hasHealthyRuntimeTruth(projectRoot)) {
    console.error('未找到可复用的 first runtime 真源，无法执行 --skip。');
    return ExitCode.VALIDATION_ERROR;
  }

  console.log(formatProductSummary(projectRoot));
  return ExitCode.SUCCESS;
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
    if (hasHealthyRuntimeTruth(projectRoot)) {
      const runtimeRefresh = refreshFirstArtifacts(projectRoot, 'refresh-all');
      const docsRefresh = refreshFirstArtifacts(projectRoot, 'refresh-docs-from-runtime');
      console.log(`✓ 已刷新 first runtime (${runtimeRefresh.runtimeArtifacts.length} 项) 与 docs 投影 (${docsRefresh.docsProjections.length} 项)`);
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
