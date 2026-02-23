/**
 * init CLI 命令
 * spec-first init --feat <abbr> --mode <N|I> --size <S|M|L> --platforms <p1,p2,...> [--feature-id <id>]
 */
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { ExitCode } from '../../shared/types.js';
import type { Mode, Size } from '../../shared/types.js';
import { init } from '../../core/process-engine/init.js';
import { ensureHostBootstrap } from '../../shared/host-bootstrap.js';
import { detectHostPaths, formatHostPathSummary } from '../../shared/host-paths.js';
import { ensureSkillCommands } from '../../shared/skill-commands.js';
import { installHooks } from '../../core/tool-integration/hook-installer.js';
import { registerAIHooks } from '../../core/tool-integration/ai-runtime-hook.js';

const VALID_MODES: ReadonlySet<string> = new Set(['N', 'I']);
const VALID_SIZES: ReadonlySet<string> = new Set(['S', 'M', 'L']);

export async function handleInit(args: string[]): Promise<number> {
  if (args.includes('--help') || args.includes('-h')) {
    printInitHelp();
    return ExitCode.SUCCESS;
  }

  const bootstrap = ensureHostBootstrap();
  if (!bootstrap.ok) {
    for (const item of bootstrap.results.filter((entry) => entry.level === 'ERROR')) {
      console.error(`[bootstrap] [${item.host}] ${item.category}/${item.name}: ${item.detail}`);
    }
    return ExitCode.CONFIG_ERROR;
  }

  const feat = parseFlag(args, '--feat');
  const mode = parseFlag(args, '--mode');
  const size = parseFlag(args, '--size');
  const platforms = parseFlag(args, '--platforms');
  const featureId = parseFlag(args, '--feature-id');
  const title = parseFlag(args, '--title');

  const hasRequiredArgs = !!(feat && mode && size);
  const interactive = isInteractiveTerminal();

  let finalFeat = feat;
  let finalMode = mode;
  let finalSize = size;
  let finalPlatforms = platforms;
  let finalFeatureId = featureId;
  let finalTitle = title;

  if (!hasRequiredArgs) {
    if (!interactive) {
      printInitHelp();
      return ExitCode.VALIDATION_ERROR;
    }
    const hostPaths = detectHostPaths();
    console.log('检测到宿主路径：');
    for (const line of formatHostPathSummary(hostPaths)) {
      console.log(`  ${line}`);
    }
    console.log('');
    const guided = await runGuidedInit();
    if (!guided) return ExitCode.VALIDATION_ERROR;
    finalFeat = guided.feat;
    finalMode = guided.mode;
    finalSize = guided.size;
    finalPlatforms = guided.platforms;
    finalFeatureId = guided.featureId;
    finalTitle = guided.title;
  }

  if (!finalFeat || !finalMode || !finalSize) {
    printInitHelp();
    return ExitCode.VALIDATION_ERROR;
  }

  if (!VALID_MODES.has(finalMode)) {
    console.error(`无效 mode "${finalMode}"：必须是 N 或 I`);
    return ExitCode.VALIDATION_ERROR;
  }

  if (!VALID_SIZES.has(finalSize)) {
    console.error(`无效 size "${finalSize}"：必须是 S、M 或 L`);
    return ExitCode.VALIDATION_ERROR;
  }

  const platformList = parsePlatforms(finalPlatforms);
  if (platformList.length === 0) {
    console.error('无效 platforms：至少需要一个平台（使用 --platforms p1,p2,...）');
    return ExitCode.VALIDATION_ERROR;
  }

  const platformValidationError = validatePlatformSelection(platformList, process.cwd());
  if (platformValidationError) {
    console.error(platformValidationError);
    return ExitCode.VALIDATION_ERROR;
  }

  let result: ReturnType<typeof init>;
  try {
    result = init({
      feat: finalFeat,
      title: finalTitle ?? finalFeat,
      mode: finalMode as Mode,
      size: finalSize as Size,
      platforms: platformList,
      author: 'cli',
      featureId: finalFeatureId ?? undefined,
      projectRoot: process.cwd(),
    });
  } catch (e) {
    console.error(`错误：${(e as Error).message}`);
    return ExitCode.VALIDATION_ERROR;
  }

  ensureProjectHooks(process.cwd());

  try {
    const aiResult = registerAIHooks(process.cwd());
    if (aiResult.registered.length > 0) {
      console.log('AI Runtime Hooks 已注册：' + aiResult.registered.join(', '));
    }
    for (const w of aiResult.warnings) console.warn('警告：' + w);
  } catch (e) {
    console.warn('警告：AI Runtime Hooks 注册失败：' + (e as Error).message);
  }

  try {
    const cmds = ensureSkillCommands(process.cwd());
    if (cmds.claude.length > 0) {
      console.log(`Skill 命令已注册：${cmds.claude.length} 个（${cmds.claude.join(', ')}）`);
    }
  } catch (e) {
    console.warn(`警告：Feature 已初始化，但 Skill 命令注册失败：${(e as Error).message}`);
  }

  console.log(`Feature 初始化完成：${result.featureId}`);
  console.log(`目录：${result.featureDir}`);
  return ExitCode.SUCCESS;
}

function ensureProjectHooks(projectRoot: string): void {
  if (!existsSync(join(projectRoot, '.git'))) return;
  try {
    const hooks = installHooks(projectRoot);
    if (hooks.length > 0) {
      console.log('Git hooks 已安装/更新：' + hooks.join(', '));
    }
  } catch (e) {
    console.warn('警告：Feature 已初始化，但 Git hooks 安装失败：' + (e as Error).message);
  }
}

function printInitHelp(): void {
  console.log('用法：spec-first init --feat <abbr> --mode <N|I> --size <S|M|L> --platforms <p1,p2,...> [--feature-id <id>] [--title <title>]\n');
  console.log('参数说明：');
  console.log('  --feat       FEAT 缩写（必须匹配 ^[A-Z][A-Z0-9]{0,15}$，例如 AUTH、REPORT）');
  console.log('  --mode       开发模式：N（新功能）| I（增量迭代）');
  console.log('  --size       规模：S | M | L');
  console.log('  --platforms  平台列表（逗号分隔），必须来自 .spec-first/layer2/*.yaml');
  console.log('  --title      Feature 标题（可选）');
  console.log('  --feature-id 指定 Feature ID（可选，默认自动生成）');
}

function parseFlag(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}

function parsePlatforms(platforms: string | undefined): string[] {
  if (!platforms) return [];
  return platforms.split(',').map((p) => p.trim()).filter(Boolean);
}

function isInteractiveTerminal(): boolean {
  return Boolean(input.isTTY && output.isTTY);
}

function discoverPlatforms(projectRoot: string): string[] {
  const layerDir = join(projectRoot, '.spec-first', 'layer2');
  try {
    return readdirSync(layerDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml')))
      .map((entry) => entry.name.replace(/\.ya?ml$/i, ''))
      .sort();
  } catch {
    return [];
  }
}

function validatePlatformSelection(platforms: string[], projectRoot: string): string | null {
  const discovered = discoverPlatforms(projectRoot);
  if (discovered.length === 0) {
    return '未发现平台模板：请先创建 .spec-first/layer2/*.yaml（例如 h5.yaml、java-backend.yaml），再执行 init。';
  }
  const missing = platforms.filter((platform) => !discovered.includes(platform));
  if (missing.length > 0) {
    return `无效 platforms：${missing.join(', ')}。可选平台：${discovered.join(', ')}`;
  }
  return null;
}

interface GuidedInitInput {
  feat: string;
  mode: 'N' | 'I';
  size: 'S' | 'M' | 'L';
  platforms: string;
  featureId?: string;
  title?: string;
}

function normalizeModeInput(value: string): 'N' | 'I' | undefined {
  const normalized = value.trim().toUpperCase();
  if (!normalized || normalized === '1' || normalized === 'N' || normalized === '新' || normalized === '新功能') {
    return 'N';
  }
  if (normalized === '2' || normalized === 'I' || normalized === '增量' || normalized === '迭代') {
    return 'I';
  }
  return undefined;
}

function normalizeSizeInput(value: string): 'S' | 'M' | 'L' | undefined {
  const normalized = value.trim().toUpperCase();
  if (normalized === '' || normalized === '2' || normalized === 'M' || normalized === '中') return 'M';
  if (normalized === '1' || normalized === 'S' || normalized === '小') return 'S';
  if (normalized === '3' || normalized === 'L' || normalized === '大') return 'L';
  return undefined;
}

function uniquePlatforms(items: string[]): string[] {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

function normalizePlatformsInput(value: string, discovered: string[]): string[] {
  const raw = value.trim();
  if (!raw) return [];
  if (discovered.length === 0) return [];

  if (/^[\d,\s]+$/.test(raw)) {
    const indexes = raw.split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => Number.parseInt(item, 10));
    if (indexes.length === 0) return [];
    if (indexes.some((idx) => !Number.isInteger(idx) || idx < 1 || idx > discovered.length)) {
      return [];
    }
    return uniquePlatforms(indexes.map((idx) => discovered[idx - 1]));
  }

  const selected = uniquePlatforms(parsePlatforms(raw));
  if (selected.length === 0) return [];
  if (selected.some((item) => !discovered.includes(item))) return [];
  return selected;
}

function isConfirmed(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === 'y' || normalized === 'yes' || normalized === '是' || normalized === '确认';
}

async function runGuidedInit(): Promise<GuidedInitInput | null> {
  const rl = createInterface({ input, output });
  try {
    console.log('初始化向导（交互模式）');
    console.log('请按清单填写参数：');
    console.log('  1. FEAT 缩写');
    console.log('  2. 模式（新功能/增量）');
    console.log('  3. 规模（S/M/L）');
    console.log('  4. 平台（可多选）');
    console.log('  5. 标题（可选）');
    console.log('  6. Feature ID（可选）\n');

    const feat = await askUntilValid(rl, '1) FEAT 缩写（例如 AUTH）: ', (value) =>
      /^[A-Z][A-Z0-9]{0,15}$/.test(value) ? null : 'FEAT 格式错误：需匹配 ^[A-Z][A-Z0-9]{0,15}$',
    );
    console.log('2) 请选择模式:');
    console.log('   1. N（新功能，默认）');
    console.log('   2. I（增量迭代）');
    const modeInput = await askUntilValid(rl, '请输入 1/2 或 N/I（默认 1）: ', (value) =>
      normalizeModeInput(value) ? null : '模式无效，请输入 1/2 或 N/I',
    );
    const mode = normalizeModeInput(modeInput) as 'N' | 'I';

    console.log('3) 请选择规模:');
    console.log('   1. S（小变更）');
    console.log('   2. M（中等，默认）');
    console.log('   3. L（大规模）');
    const sizeInput = await askUntilValid(rl, '请输入 1/2/3 或 S/M/L（默认 2）: ', (value) =>
      normalizeSizeInput(value) ? null : '规模无效，请输入 1/2/3 或 S/M/L',
    );
    const size = normalizeSizeInput(sizeInput) as 'S' | 'M' | 'L';

    const discovered = discoverPlatforms(process.cwd());
    if (discovered.length === 0) {
      console.error('未发现 .spec-first/layer2 平台模板。请先创建 *.yaml 后再执行初始化。');
      return null;
    }

    console.log('4) 可选平台列表（必须从以下列表选择）:');
    discovered.forEach((platform, idx) => {
      console.log(`   ${idx + 1}. ${platform}`);
    });
    console.log('   输入示例：1,3 或 web-admin,api');

    const platformsInput = await askUntilValid(
      rl,
      '请输入平台（编号或名称，逗号分隔）: ',
      (value) => normalizePlatformsInput(value, discovered).length > 0 ? null : '平台无效：必须从可选平台列表中选择',
    );
    const platforms = normalizePlatformsInput(platformsInput, discovered).join(',');

    const titleInput = (await rl.question(`5) 标题（可选，默认 ${feat}）: `)).trim();
    const featureIdInput = (await rl.question('6) Feature ID（可选，留空自动生成）: ')).trim();
    const title = titleInput || feat;

    console.log('\n参数确认（列表）:');
    console.log(`  - feat: ${feat}`);
    console.log(`  - mode: ${mode}`);
    console.log(`  - size: ${size}`);
    console.log(`  - platforms: ${platforms}`);
    console.log(`  - title: ${title}`);
    console.log(`  - feature-id: ${featureIdInput || '(auto)'}`);
    const confirm = await rl.question('确认执行初始化？[y/N]: ');
    if (!isConfirmed(confirm)) {
      console.error('已取消初始化。');
      return null;
    }

    return {
      feat,
      mode,
      size,
      platforms,
      title,
      featureId: featureIdInput || undefined,
    };
  } finally {
    rl.close();
  }
}

async function askUntilValid(
  rl: ReturnType<typeof createInterface>,
  prompt: string,
  validate: (value: string) => string | null,
): Promise<string> {
  while (true) {
    const value = (await rl.question(prompt)).trim();
    const error = validate(value);
    if (!error) return value;
    console.error(error);
  }
}
