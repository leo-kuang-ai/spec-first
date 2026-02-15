/**
 * id CLI 命令组
 * spec-first id next|validate|search|list
 */
import type { NextIdType, TcLevel, IdType } from '../../shared/types.js';
import { ExitCode } from '../../shared/types.js';
import { nextId } from '../../core/trace-engine/id-generator.js';
import { validateId } from '../../core/trace-engine/id-validator.js';
import { searchId, listIds } from '../../core/trace-engine/id-search.js';

export function handleId(args: string[]): number {
  const sub = args[0];
  const rest = args.slice(1);

  switch (sub) {
    case 'next':    return handleNext(rest);
    case 'validate': return handleValidate(rest);
    case 'search':  return handleSearch(rest);
    case 'list':    return handleList(rest);
    default:
      console.error(`Unknown id subcommand: ${sub}`);
      printIdHelp();
      return ExitCode.VALIDATION_ERROR;
  }
}

function handleNext(args: string[]): number {
  const type = args[0] as NextIdType | undefined;
  const abbr = args[1];
  const feature = parseFlag(args, '--feature');
  const tcLevel = parseFlag(args, '--level') as TcLevel | undefined;

  if (!type || !abbr || !feature) {
    console.error('Usage: spec-first id next <type> <abbr> --feature <featureId> [--level <UT|IT|E2E|ST>]');
    return ExitCode.VALIDATION_ERROR;
  }

  try {
    const result = nextId({ type, abbr, featureId: feature, projectRoot: process.cwd(), tcLevel });
    console.log(`Generated: ${result.id}`);
    return ExitCode.SUCCESS;
  } catch (e) {
    console.error(`Error: ${(e as Error).message}`);
    return ExitCode.VALIDATION_ERROR;
  }
}

function handleValidate(args: string[]): number {
  const id = args[0];
  if (!id) {
    console.error('Usage: spec-first id validate <id>');
    return ExitCode.VALIDATION_ERROR;
  }

  const result = validateId(id);
  if (result.valid) {
    console.log(`Valid ${result.type} ID: ${id}`);
    return ExitCode.SUCCESS;
  }
  console.error(`Invalid: ${result.error}`);
  return ExitCode.VALIDATION_ERROR;
}

function handleSearch(args: string[]): number {
  const query = args[0];
  const feature = parseFlag(args, '--feature');
  const type = parseFlag(args, '--type') as IdType | undefined;

  if (!query || !feature) {
    console.error('Usage: spec-first id search <query> --feature <featureId> [--type <type>]');
    return ExitCode.VALIDATION_ERROR;
  }

  const results = searchId(query, feature, process.cwd(), type);
  if (results.length === 0) {
    console.log('No matching IDs found.');
    return ExitCode.SUCCESS;
  }
  for (const r of results) {
    console.log(`${r.id}  (${r.type})`);
  }
  return ExitCode.SUCCESS;
}

function handleList(args: string[]): number {
  const feature = parseFlag(args, '--feature');
  const type = parseFlag(args, '--type') as IdType | undefined;

  if (!feature) {
    console.error('Usage: spec-first id list --feature <featureId> [--type <type>]');
    return ExitCode.VALIDATION_ERROR;
  }

  const results = listIds(feature, process.cwd(), type);
  if (results.length === 0) {
    console.log('No IDs found.');
    return ExitCode.SUCCESS;
  }
  for (const r of results) {
    console.log(`${r.id}  (${r.type})`);
  }
  return ExitCode.SUCCESS;
}

function printIdHelp(): void {
  console.log(`Usage: spec-first id <subcommand>

Subcommands:
  next      Generate next ID
  validate  Validate ID format
  search    Search IDs by query
  list      List all IDs`);
}

function parseFlag(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}
