import { ExitCode } from '../../shared/types.js';

export function handleDocsLinks(args: string[]): number {
  const sub = args[0];
  if (sub) {
    console.error(`spec-first docs links 已退场，请改用 spec-first validate links。`);
  } else {
    console.error('spec-first docs links 已退场，请改用 spec-first validate links。');
  }
  return ExitCode.VALIDATION_ERROR;
}

export function handleDocs(args: string[]): number {
  void args;
  console.error('spec-first docs 已退场，请改用 spec-first validate links。');
  return ExitCode.VALIDATION_ERROR;
}
