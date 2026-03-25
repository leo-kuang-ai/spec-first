import { ExitCode } from '../../shared/types.js';
import { loadSkill, resolveSkillPath } from '../../core/skill-runtime/dispatcher.js';
import {
  injectInputContextToAllSkills,
} from '../../core/skill-runtime/skill-input-injector.js';
import { resolveSkillsRoot } from '../../core/skill-runtime/skill-input-contracts.js';

interface RenderOptions {
  featureId?: string;
  input?: string;
}

interface InjectContextOptions {
  force?: boolean;
  skills?: string[];
}

function printUsage(): void {
  console.error(
    '用法：spec-first skill <subcommand> [options]\n' +
    '\n' +
    '子命令：\n' +
    '  render <skill-name>  渲染 skill prompt\n' +
    '  inject-context       注入输入上下文到 SKILL.md\n' +
    '\n' +
    'inject-context 选项：\n' +
    '  -f, --force           强制覆盖已有章节\n' +
    '  -s, --skills <names>  指定要注入的 skill（逗号分隔）'
  );
}

const FEATURE_ID_RE = /\bFSREQ-\d{8}-[A-Z][A-Z0-9]{1,15}-\d{3}\b/i;

function inferFeatureIdFromInput(input?: string): string | undefined {
  if (!input) return undefined;
  const match = input.match(FEATURE_ID_RE);
  return match?.[0]?.toUpperCase();
}

function parseRenderArgs(args: string[]): { skillName?: string; options: RenderOptions } | null {
  const options: RenderOptions = {};
  let skillName: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--feature') {
      const value = args[i + 1];
      if (!value || value.startsWith('--')) {
        return null;
      }
      options.featureId = value;
      i++;
      continue;
    }

    if (arg.startsWith('--feature=')) {
      const value = arg.slice('--feature='.length);
      if (!value) return null;
      options.featureId = value;
      continue;
    }

    if (arg === '--input') {
      const value = args[i + 1];
      if (value === undefined) {
        return null;
      }
      options.input = value || undefined;
      i++;
      continue;
    }

    if (arg.startsWith('--input=')) {
      const value = arg.slice('--input='.length);
      options.input = value || undefined;
      continue;
    }

    if (arg.startsWith('--')) {
      return null;
    }

    if (!skillName) {
      skillName = arg;
      continue;
    }

    return null;
  }

  return { skillName, options };
}

export function handleSkill(args: string[]): number {
  const subcommand = args[0];

  if (subcommand === 'render') {
    return handleRender(args.slice(1));
  }

  if (subcommand === 'inject-context') {
    return handleInjectContext(args.slice(1));
  }

  printUsage();
  return ExitCode.VALIDATION_ERROR;
}

function handleRender(args: string[]): number {
  const parsed = parseRenderArgs(args);
  if (!parsed?.skillName) {
    printUsage();
    return ExitCode.VALIDATION_ERROR;
  }

  const projectRoot = process.cwd();
  const skillPath = resolveSkillPath(parsed.skillName, projectRoot);
  if (!skillPath) {
    console.error(`SKILL_NOT_FOUND: ${parsed.skillName}`);
    return ExitCode.VALIDATION_ERROR;
  }

  const rendered = loadSkill(skillPath, {
    projectRoot,
    featureId: parsed.options.featureId ?? inferFeatureIdFromInput(parsed.options.input),
  });
  console.log(rendered);
  return ExitCode.SUCCESS;
}

function parseInjectContextArgs(args: string[]): InjectContextOptions | null {
  const options: InjectContextOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-f' || arg === '--force') {
      options.force = true;
      continue;
    }

    if (arg === '-s' || arg === '--skills') {
      const value = args[i + 1];
      if (!value || value.startsWith('-')) {
        console.error('参数错误：--skills 需要一个值（逗号分隔的 skill 名称）');
        return null;
      }
      options.skills = value.split(',').map((s) => s.trim()).filter(Boolean);
      i++;
      continue;
    }

    if (arg.startsWith('--skills=')) {
      const value = arg.slice('--skills='.length);
      if (!value) {
        console.error('参数错误：--skills= 需要一个值');
        return null;
      }
      options.skills = value.split(',').map((s) => s.trim()).filter(Boolean);
      continue;
    }

    // 未知参数报错
    if (arg.startsWith('-')) {
      console.error(`参数错误：未知选项 "${arg}"`);
      return null;
    }
  }

  return options;
}

function handleInjectContext(args: string[]): number {
  const parsed = parseInjectContextArgs(args);
  if (!parsed) {
    return ExitCode.VALIDATION_ERROR;
  }

  const skillsRoot = resolveSkillsRoot();

  if (!skillsRoot) {
    console.error('Skills root not found - looking for a skill collection root');
    console.error('Tip: Run this command from spec-first package root or installation directory');
    return ExitCode.VALIDATION_ERROR;
  }

  // 即使 YAML 不存在，也使用默认配置继续执行
  console.log(`Using skills root: ${skillsRoot}`);

  const results = injectInputContextToAllSkills(skillsRoot, {
    force: parsed.force,
    skills: parsed.skills,
  });

  console.log('\nInject Results:');
  console.log('================');

  const injected = results.filter((r) => r.injected);
  const skipped = results.filter((r) => !r.injected);

  if (injected.length > 0) {
    console.log('\n✅ Injected:');
    injected.forEach((r) => console.log(`  - ${r.skillName}`));
  }

  if (skipped.length > 0) {
    console.log('\n⏭️  Skipped:');
    skipped.forEach((r) => console.log(`  - ${r.skillName}: ${r.reason}`));
  }

  console.log(`\nTotal: ${injected.length} injected, ${skipped.length} skipped`);
  return ExitCode.SUCCESS;
}
