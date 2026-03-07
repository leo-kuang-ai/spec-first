/**
 * done CLI 命令
 * spec-first done <featureId>
 *
 * 作为 07_release → 08_done 的显式运行时别名，内部复用 stage advance。
 */
import { ExitCode } from '../../shared/types.js';
import { handleStage } from './stage.js';

export function handleDone(args: string[]): number {
  const featureId = args[0];
  if (!featureId) {
    console.error('用法：spec-first done <featureId>');
    return ExitCode.VALIDATION_ERROR;
  }

  return handleStage(['advance', featureId]);
}
