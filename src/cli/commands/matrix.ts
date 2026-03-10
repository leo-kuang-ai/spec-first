/**
 * matrix CLI 命令组
 * spec-first matrix check|export|update
 */
import { ExitCode } from '../../shared/types.js';
import { checkMatrix, exportMatrix, updateMatrixRow } from '../../core/trace-engine/matrix.js';

export function handleMatrix(args: string[]): number {
  const sub = args[0];
  const rest = args.slice(1);

  // 支持 --help
  if (sub === '--help' || sub === '-h' || !sub) {
    printMatrixHelp();
    return ExitCode.SUCCESS;
  }

  switch (sub) {
    case 'check':  return handleCheck(rest);
    case 'export': return handleExport(rest);
    case 'update': return handleUpdate(rest);
    default:
      console.error(`未知 matrix 子命令：${sub}`);
      console.log('子命令：check, export, update');
      console.log('使用 spec-first matrix --help 查看详细帮助');
      return ExitCode.VALIDATION_ERROR;
  }
}

function printMatrixHelp(): void {
  console.log(`用法：spec-first matrix <subcommand> <featureId> [options]

子命令：
  check   检查追踪矩阵完整性
  export  导出追踪矩阵为 JSON/YAML
  update  更新追踪矩阵条目

更新选项：
  --status <value>    状态值，有效选项：
                      - Planned (默认，已规划)
                      - Implemented (已实现)
                      - Verified (已验证)
                      - Accepted (已验收)
                      - Deferred (已延期)
                      - Cancelled (已取消)
                      - Exception (例外处理)
  --title <text>      标题
  --upstream <ids>    上游依赖 ID（逗号分隔）
  --downstream <ids>  下游影响 ID（逗号分隔）
  --yes               确认执行（必需）

示例：
  spec-first matrix check FSREQ-20260309-AUTH-001
  spec-first matrix export FSREQ-20260309-AUTH-001 --format yaml
  spec-first matrix update FSREQ-001 FR-001 --status Implemented --yes
`);
}

function handleCheck(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('用法：spec-first matrix check <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }

  try {
    const result = checkMatrix(featureId, process.cwd());
    console.log(`矩阵检查：${featureId}`);
    console.log(`  总条目：${result.total}`);
    console.log(`  孤儿项：${result.orphans.length}`);
    console.log(`  断链数：${result.brokenChains.length}`);
    if (result.warnings.length > 0) {
      console.log('\n警告：');
      for (const w of result.warnings) {
        console.log(`  - ${w}`);
      }
    }
    return result.warnings.length > 0 ? ExitCode.GATE_FAILED : ExitCode.SUCCESS;
  } catch (e) {
    console.error(`错误：${(e as Error).message}`);
    return ExitCode.IO_ERROR;
  }
}

function handleExport(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('用法：spec-first matrix export <featureId> [--format markdown|yaml]');
    return ExitCode.VALIDATION_ERROR;
  }

  const formatIdx = args.indexOf('--format');
  const format = (formatIdx !== -1 && args[formatIdx + 1]) as 'markdown' | 'yaml' || 'markdown';

  try {
    const output = exportMatrix(featureId, process.cwd(), format);
    console.log(output);
    return ExitCode.SUCCESS;
  } catch (e) {
    console.error(`错误：${(e as Error).message}`);
    return ExitCode.IO_ERROR;
  }
}

function handleUpdate(args: string[]): number {
  const featureId = args[0];
  const id = args[1];
  if (!featureId || !id) {
    console.error('用法：spec-first matrix update <featureId> <id> [--status <status>] [--title <title>] [--upstream <ids>] [--downstream <ids>]');
    return ExitCode.VALIDATION_ERROR;
  }

  const updates: Record<string, unknown> = {};
  for (let i = 2; i < args.length; i++) {
    const flag = args[i];
    const val = args[i + 1];
    if (!val) break;
    switch (flag) {
      case '--status':   updates.status = val; i++; break;
      case '--title':    updates.title = val; i++; break;
      case '--upstream': updates.upstream = val.split(',').map(s => s.trim()); i++; break;
      case '--downstream': updates.downstream = val.split(',').map(s => s.trim()); i++; break;
    }
  }

  if (Object.keys(updates).length === 0) {
    console.error('至少需要一个更新参数：--status、--title、--upstream、--downstream');
    return ExitCode.VALIDATION_ERROR;
  }

  try {
    updateMatrixRow(featureId, process.cwd(), id, updates);
    console.log(`已更新矩阵条目：${id}（${featureId}）`);
    return ExitCode.SUCCESS;
  } catch (e) {
    console.error(`错误：${(e as Error).message}`);
    return ExitCode.IO_ERROR;
  }
}
