import { ExitCode } from '../../shared/types.js';

export function handleTrace(args: string[]): number {
  const sub = args[0];
  if (sub === 'fix' || sub === 'validate') {
    console.error('spec-first trace 已退场，请改用 spec-first validate links。');
    return ExitCode.VALIDATION_ERROR;
  }

  console.error('spec-first trace 已退场，请改用 spec-first validate links。');
  return ExitCode.VALIDATION_ERROR;
}
