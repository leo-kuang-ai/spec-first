import { ExitCode } from '../../shared/types.js';
import {
  formatHealthStatus,
  checkFirstUpdateContext,
} from '../../core/skill-runtime/first-change-detector.js';
import { bootstrapFirstRuntime } from '../../core/skill-runtime/first-bootstrap.js';
import {
  refreshFirstArtifacts,
} from '../../core/skill-runtime/first-context.js';
import { FirstArgsError, validateFirstArgs } from '../../core/skill-runtime/first-args.js';
import { formatProductSummary } from '../../core/skill-runtime/first-resume.js';
import { readFirstRuntimeIndex } from '../../core/skill-runtime/first-runtime-store.js';

function printFirstHelp(): void {
  console.log('用法：spec-first first [选项]');
  console.log('');
  console.log('说明：');
  console.log('  生成项目级认知真源（.spec-first/runtime/first/）与投影文档（docs/first/）');
  console.log('  - 无 runtime 真源时：执行 bootstrap 生成');
  console.log('  - 有 runtime 真源时：执行增量刷新');
  console.log('');
  console.log('选项：');
  console.log('  --type=<value>      指定平台类型（backend/frontend/mobile/cross-platform/desktop/monorepo）');
  console.log('  --force             强制重新生成（忽略现有 runtime）');
  console.log('  --check-health      检查 first 健康状态');
  console.log('  --help, -h          显示帮助信息');
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


export function handleFirst(args: string[]): number {
  if (args.includes('--help') || args.includes('-h')) {
    printFirstHelp();
    return ExitCode.SUCCESS;
  }

  let firstArgs;
  try {
    firstArgs = validateFirstArgs(args, (warning) => console.warn(warning));
  } catch (error) {
    const message =
      error instanceof FirstArgsError || error instanceof Error ? error.message : String(error);
    console.error(message);
    printFirstHelp();
    return ExitCode.VALIDATION_ERROR;
  }

  const projectRoot = process.cwd();

  if (firstArgs.checkHealth) {
    return handleCheckHealth(projectRoot);
  }

  try {
    const index = readFirstRuntimeIndex(projectRoot);
    const hasHealthyRuntime =
      index?.summary?.healthy &&
      index?.steering?.healthy &&
      index?.conventions?.healthy &&
      index?.criticalFlows?.healthy &&
      index?.entryGuide?.healthy &&
      index?.apiContracts?.healthy &&
      index?.structureOverview?.healthy &&
      index?.domainModel?.healthy &&
      (index?.databaseSchema?.status === 'healthy' || index?.databaseSchema?.status === 'not_applicable');

    if (hasHealthyRuntime && !firstArgs.force) {
      const result = refreshFirstArtifacts(projectRoot, 'refresh-docs-from-runtime');
      console.log(
        `✓ 已刷新 first runtime (${result.runtimeArtifacts.length} 项) 与 canonical projection docs (${result.docsProjections.length} 项)`
      );
    } else {
      const bootstrap = bootstrapFirstRuntime(projectRoot, {
        platformType: firstArgs.type,
      });
      console.log(
        `✓ 已生成 first runtime (${bootstrap.runtimeArtifacts.length} 项) 与 canonical projection docs (${bootstrap.docsProjections.length} 项)`
      );
    }

    console.log(formatProductSummary(projectRoot));
    return ExitCode.SUCCESS;
  } catch (error) {
    console.error(`first 执行失败：${error instanceof Error ? error.message : String(error)}`);
    return ExitCode.IO_ERROR;
  }
}
