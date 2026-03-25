import { ExitCode } from '../../shared/types.js';

export function handleGate(args: string[]): number {
  const sub = args[0];
  if (sub) {
    console.error('spec-first gate 已退场，请改用 spec-first status / orchestrate / transition。');
  } else {
    console.error('spec-first gate 已退场，请改用 spec-first status / orchestrate / transition。');
  }
  return ExitCode.VALIDATION_ERROR;
}

export function handleGoLive(args: string[]): number {
  void args;
  console.error('spec-first golive 已退场，请改用 spec-first done。');
  return ExitCode.VALIDATION_ERROR;
}
