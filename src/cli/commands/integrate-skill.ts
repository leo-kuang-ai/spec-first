import { ExitCode } from '../../shared/types.js';
import { hasFlag, parseFlag } from '../parse-utils.js';
import { runIntegrateSkill } from '../../core/skill-integration/service.js';
import type { IntegrateSkillCliOptions } from '../../core/skill-integration/service.js';

function parseIntegrateSkillArgs(args: string[]): IntegrateSkillCliOptions | null {
  const skillName = args[0];
  if (!skillName || skillName.startsWith('-')) return null;

  if (args.some((arg) => arg.startsWith('--') && !isSupportedFlag(arg))) {
    return null;
  }

  return {
    skillName,
    source: parseFlag(args, '--source'),
    target: parseTarget(parseFlag(args, '--target')),
    category: parseCategory(parseFlag(args, '--category')),
    reportOnly: hasFlag(args, '--report-only'),
    allowMissingSource: hasFlag(args, '--allow-missing-source'),
    dryRun: hasFlag(args, '--dry-run'),
    rename: parseFlag(args, '--rename'),
  };
}

function isSupportedFlag(arg: string): boolean {
  return [
    '--source',
    '--target',
    '--category',
    '--report-only',
    '--allow-missing-source',
    '--dry-run',
    '--rename',
    '--yes',
    '--help',
    '-h',
  ].includes(arg);
}

function parseTarget(value?: string): 'guideline' | 'draft' | 'both' | undefined {
  if (value === 'guideline' || value === 'draft' || value === 'both') return value;
  return undefined;
}

function parseCategory(
  value?: string
): 'frontend' | 'backend' | 'testing' | 'documentation' | 'workflow' | 'generic' | undefined {
  if (
    value === 'frontend' ||
    value === 'backend' ||
    value === 'testing' ||
    value === 'documentation' ||
    value === 'workflow' ||
    value === 'generic'
  ) {
    return value;
  }
  return undefined;
}

export function handleIntegrateSkill(args: string[]): number {
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    return ExitCode.SUCCESS;
  }

  const parsed = parseIntegrateSkillArgs(args);
  if (!parsed) {
    printHelp();
    return ExitCode.VALIDATION_ERROR;
  }

  if (!parsed.reportOnly) {
    console.error('integrate-skill 当前仅支持 report-only MVP；请补 `--report-only`');
    return ExitCode.VALIDATION_ERROR;
  }

  const result = runIntegrateSkill(parsed);
  if (result.output) {
    console.log(result.output);
  }

  return result.exitCode === 0 ? ExitCode.SUCCESS : ExitCode.VALIDATION_ERROR;
}

function printHelp(): void {
  console.log(`用法：spec-first integrate-skill <skill-name> [options]

选项：
  --source <path>              外部 skill 来源路径
  --target <guideline|draft|both>
  --category <frontend|backend|testing|documentation|workflow|generic>
  --report-only                仅生成报告（MVP 唯一支持模式）
  --allow-missing-source       允许 source 缺失时生成空报告骨架
  --dry-run                    只预览，不落盘
  --rename <new-name>          冲突时改名
  --yes                        跳过路由确认（全局确认参数）
  -h, --help                   显示帮助`);
}
