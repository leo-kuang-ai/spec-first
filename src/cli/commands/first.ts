import { ExitCode } from '../../shared/types.js';
import {
  formatHealthStatus,
  checkFirstUpdateContext,
} from '../../core/skill-runtime/first-change-detector.js';
import { bootstrapFirstRuntime } from '../../core/skill-runtime/first-bootstrap.js';
import { formatProductSummary } from '../../core/skill-runtime/first-resume.js';

function printFirstHelp(): void {
  console.log('用法：spec-first first [--check-health]');
  console.log('');
  console.log('说明：');
  console.log('  first 只负责检查项目级认知最终产物是否已由 Skill 写入，属于最小支撑层');
  console.log('  - runtime 真源位于 .spec-first/runtime/first/');
  console.log('  - docs 输出位于 docs/first/');
  console.log('  - 工作流、多 Agent 编排、约束和成功标准由 skill 定义');
  console.log('');
  console.log('选项：');
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

function validateArgs(args: string[]): { checkHealth: boolean } {
  const allowed = new Set(['--check-health']);
  for (const arg of args) {
    if (!allowed.has(arg)) {
      throw new Error(`未知参数: ${arg}。有效参数: --check-health`);
    }
  }

  return {
    checkHealth: args.includes('--check-health'),
  };
}

export function handleFirst(args: string[]): number {
  if (args.includes('--help') || args.includes('-h')) {
    printFirstHelp();
    return ExitCode.SUCCESS;
  }

  let parsed;
  try {
    parsed = validateArgs(args);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    printFirstHelp();
    return ExitCode.VALIDATION_ERROR;
  }

  const projectRoot = process.cwd();

  if (parsed.checkHealth) {
    return handleCheckHealth(projectRoot);
  }

  try {
    const result = bootstrapFirstRuntime(projectRoot);
    console.log(
      `✓ 已验证 first runtime (${result.runtimeArtifacts.length} 项) 与 docs 输出 (${result.docsOutputs.length} 项)，来源=${result.source}`
    );
    console.log(formatProductSummary(projectRoot));
    return ExitCode.SUCCESS;
  } catch (error) {
    console.error(`first 执行失败：${error instanceof Error ? error.message : String(error)}`);
    return ExitCode.IO_ERROR;
  }
}
