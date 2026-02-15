/**
 * init CLI 命令
 * spec-first init --feat <abbr> --mode <N|I> --size <S|M|L> --platforms <p1,p2,...> [--feature-id <id>]
 */
import { ExitCode } from '../../shared/types.js';
import type { Mode, Size } from '../../shared/types.js';
import { init } from '../../core/process-engine/init.js';

const VALID_MODES: ReadonlySet<string> = new Set(['N', 'I']);
const VALID_SIZES: ReadonlySet<string> = new Set(['S', 'M', 'L']);

export function handleInit(args: string[]): number {
  const feat = parseFlag(args, '--feat');
  const mode = parseFlag(args, '--mode');
  const size = parseFlag(args, '--size');
  const platforms = parseFlag(args, '--platforms');
  const featureId = parseFlag(args, '--feature-id');
  const title = parseFlag(args, '--title') ?? feat ?? '';

  if (!feat || !mode || !size) {
    console.error('Usage: spec-first init --feat <abbr> --mode <N|I> --size <S|M|L> --platforms <p1,p2,...> [--feature-id <id>] [--title <title>]');
    return ExitCode.VALIDATION_ERROR;
  }

  if (!VALID_MODES.has(mode)) {
    console.error(`Invalid mode "${mode}": must be N or I`);
    return ExitCode.VALIDATION_ERROR;
  }

  if (!VALID_SIZES.has(size)) {
    console.error(`Invalid size "${size}": must be S, M, or L`);
    return ExitCode.VALIDATION_ERROR;
  }

  const platformList = platforms ? platforms.split(',').map((p) => p.trim()).filter(Boolean) : [];

  try {
    const result = init({
      feat,
      title,
      mode: mode as Mode,
      size: size as Size,
      platforms: platformList,
      author: 'cli',
      featureId: featureId ?? undefined,
      projectRoot: process.cwd(),
    });
    console.log(`Feature initialized: ${result.featureId}`);
    console.log(`Directory: ${result.featureDir}`);
    return ExitCode.SUCCESS;
  } catch (e) {
    console.error(`Error: ${(e as Error).message}`);
    return ExitCode.VALIDATION_ERROR;
  }
}

function parseFlag(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}
