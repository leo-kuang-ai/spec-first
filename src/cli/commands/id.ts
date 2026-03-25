import { ExitCode } from '../../shared/types.js';

export function handleId(args: string[]): number {
  const sub = args[0];
  if (sub) {
    console.error(`spec-first id 已退场，请改用 spec-first status / transition / validate。`);
  } else {
    console.error('spec-first id 已退场，请改用 spec-first status / transition / validate。');
  }
  return ExitCode.VALIDATION_ERROR;
}
