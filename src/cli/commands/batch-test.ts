/**
 * 批量执行测试命令（临时）
 */
import { ExitCode } from '../../shared/types.js';

export async function handleBatchTest(args: string[]): Promise<number> {
  void args;
  console.error(
    'batch-test 当前仍为 experimental：执行器尚未接入真实 Agent，已禁止继续运行以避免产出误导性成功结果。'
  );
  return ExitCode.GENERAL_ERROR;
}
