import { ExitCode } from '../../shared/types.js';
import { advance, cancel } from '../../core/process-engine/advance.js';
import { parseFlag } from '../parse-utils.js';

function printHelp(): void {
  console.log('用法：spec-first transition <featureId>');
  console.log('     spec-first transition cancel <featureId> --reason "<reason>"');
}

export function handleTransition(args: string[]): number {
  const sub = args[0];

  if (!sub) {
    printHelp();
    return ExitCode.VALIDATION_ERROR;
  }

  if (sub === 'cancel') {
    const featureId = args[1];
    const reason = parseFlag(args.slice(2), '--reason');
    if (!featureId || !reason) {
      console.error('用法：spec-first transition cancel <featureId> --reason "<reason>"');
      return ExitCode.VALIDATION_ERROR;
    }

    try {
      const result = cancel(featureId, process.cwd(), reason);
      console.log(`已流转：${result.from} → ${result.to}`);
      console.log(`原因：${reason}`);
      return ExitCode.SUCCESS;
    } catch (error) {
      console.error(`错误：${(error as Error).message}`);
      return ExitCode.VALIDATION_ERROR;
    }
  }

  const featureId = sub;
  try {
    const result = advance(featureId, process.cwd());
    console.log(`已流转：${result.from} → ${result.to}`);
    return ExitCode.SUCCESS;
  } catch (error) {
    console.error(`错误：${(error as Error).message}`);
    return ExitCode.VALIDATION_ERROR;
  }
}
