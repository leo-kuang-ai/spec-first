/**
 * init CLI 命令
 * spec-first init --feat <abbr> --mode <N|I> --size <S|M|L> --platforms <p1,p2,...> [--feature-id <id>]
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { ExitCode } from '../../shared/types.js';
import type { Mode, Size } from '../../shared/types.js';
import { init } from '../../core/process-engine/init.js';
import { ensureHostBootstrap } from '../../shared/host-bootstrap.js';
import { detectHostPaths, formatHostPathSummary } from '../../shared/host-paths.js';
import { ensureSkillCommands } from '../../shared/skill-commands.js';
import { renderDefaultConfigYaml } from '../../shared/config-schema.js';
import { installHooks } from '../../core/tool-integration/hook-installer.js';
import { parseFlag } from '../parse-utils.js';
import { registerAIHooks } from '../../core/tool-integration/ai-runtime-hook.js';

const VALID_MODES: ReadonlySet<string> = new Set(['N', 'I']);
const VALID_SIZES: ReadonlySet<string> = new Set(['S', 'M', 'L']);

interface InitCliInput {
  feat?: string;
  mode?: string;
  size?: string;
  platforms?: string;
  featureId?: string;
  title?: string;
  bootstrap?: boolean;
}

interface NormalizedInitInput {
  feat: string;
  mode: Mode;
  size: Size;
  platforms: string[];
  featureId?: string;
  title: string;
}

interface InitReadinessStatus {
  firstCompleted: boolean;
  firstMissing: string[];
  projectInitialized: boolean;
  projectMissing: string[];
}

interface FirstSummary {
  mode: 'quick' | 'deep' | 'unknown';
  techStack: string;
  codeVolume: string;
  apiSurface: string;
}

const FIRST_REQUIRED_PRODUCTS = [
  'tech-stack.md',
  'codebase-overview.md',
  'domain-model.md',
  'api-docs.md',
] as const;

function parseInitCliInput(args: string[]): InitCliInput {
  return {
    feat: parseFlag(args, '--feat'),
    mode: parseFlag(args, '--mode'),
    size: parseFlag(args, '--size'),
    platforms: parseFlag(args, '--platforms'),
    featureId: parseFlag(args, '--feature-id'),
    title: parseFlag(args, '--title'),
    bootstrap: args.includes('--bootstrap'),
  };
}

function runBootstrapIfEnabled(shouldBootstrap: boolean): number | undefined {
  if (!shouldBootstrap) return undefined;

  const bootstrap = ensureHostBootstrap();
  if (bootstrap.ok) return undefined;

  for (const item of bootstrap.results.filter((entry) => entry.level === 'ERROR')) {
    console.error(`[bootstrap] [${item.host}] ${item.category}/${item.name}: ${item.detail}`);
  }
  return ExitCode.CONFIG_ERROR;
}

async function resolveInitCliInput(args: string[], initial: InitCliInput): Promise<InitCliInput | undefined> {
  const hasRequiredArgs = Boolean(initial.feat && initial.mode && initial.size && initial.platforms);
  if (hasRequiredArgs) return initial;

  if (!isInteractiveTerminal()) {
    printInitHelp();
    return undefined;
  }

  const hostPaths = detectHostPaths();
  console.log('检测到宿主路径：');
  for (const line of formatHostPathSummary(hostPaths)) {
    console.log(`  ${line}`);
  }
  console.log('');

  const guided = await runGuidedInit();
  if (!guided) return undefined;
  return {
    feat: guided.feat,
    mode: guided.mode,
    size: guided.size,
    platforms: guided.platforms,
    featureId: guided.featureId,
    title: guided.title,
    bootstrap: guided.bootstrap,
  };
}

function normalizeInitInput(input: InitCliInput, cwd: string): NormalizedInitInput | undefined {
  if (!input.feat || !input.mode || !input.size) {
    printInitHelp();
    return undefined;
  }

  if (!VALID_MODES.has(input.mode)) {
    console.error(`无效 mode "${input.mode}"：必须是 N 或 I`);
    return undefined;
  }
  if (!VALID_SIZES.has(input.size)) {
    console.error(`无效 size "${input.size}"：必须是 S、M 或 L`);
    return undefined;
  }

  const parsedPlatforms = parsePlatforms(input.platforms);
  if (parsedPlatforms.values.length === 0) {
    console.error('无效 platforms：至少需要一个平台（使用 --platforms p1,p2,...）');
    return undefined;
  }
  if (parsedPlatforms.hadDuplicates) {
    console.warn(`警告：检测到重复 platforms，已自动去重并排序：${parsedPlatforms.values.join(', ')}`);
  }

  const platformValidationError = validatePlatformSelection(parsedPlatforms.values, cwd);
  if (platformValidationError) {
    console.error(platformValidationError);
    return undefined;
  }

  return {
    feat: input.feat,
    mode: input.mode as Mode,
    size: input.size as Size,
    platforms: parsedPlatforms.values,
    featureId: input.featureId ?? undefined,
    title: input.title ?? input.feat,
  };
}

function runPostInitSetup(cwd: string): void {
  ensureProjectHooks(cwd);
  ensureProjectClaudeSettings(cwd);

  try {
    const aiResult = registerAIHooks(cwd);
    if (aiResult.registered.length > 0) {
      console.log('AI Runtime Hooks 已注册：' + aiResult.registered.join(', '));
    }
    for (const w of aiResult.warnings) console.warn('警告：' + w);
  } catch (e) {
    console.warn('警告：AI Runtime Hooks 注册失败：' + (e as Error).message);
  }

  try {
    const cmds = ensureSkillCommands(cwd);
    if (cmds.claude.length > 0) {
      console.log(`Skill 命令已注册：${cmds.claude.length} 个（${cmds.claude.join(', ')}）`);
    }
  } catch (e) {
    console.warn(`警告：Feature 已初始化，但 Skill 命令注册失败：${(e as Error).message}`);
  }
}

function ensureProjectMetaConfig(projectRoot: string): void {
  const metaDir = join(projectRoot, '.spec-first', 'meta');
  const metaConfigPath = join(metaDir, 'config.yaml');
  if (existsSync(metaConfigPath)) return;
  try {
    mkdirSync(metaDir, { recursive: true });
    if (!existsSync(metaConfigPath)) {
      writeFileSync(metaConfigPath, renderDefaultConfigYaml(), 'utf-8');
    }
  } catch (e) {
    console.warn('警告：无法创建 .spec-first/meta/config.yaml：' + (e as Error).message);
  }
}

function checkInitReadiness(projectRoot: string): InitReadinessStatus {
  const firstDir = join(projectRoot, 'docs', 'first');
  const firstMissing: string[] = [];
  if (!existsSync(firstDir)) {
    firstMissing.push('docs/first/');
  } else {
    const indexPath = join(firstDir, '.index.yaml');
    if (!existsSync(indexPath)) {
      firstMissing.push('docs/first/.index.yaml');
    }
    for (const name of FIRST_REQUIRED_PRODUCTS) {
      if (!existsSync(join(firstDir, name))) {
        firstMissing.push(`docs/first/${name}`);
      }
    }
  }

  // 项目初始化状态检查（提示用途，不阻断 init）
  const projectMissing: string[] = [];
  if (!existsSync(join(projectRoot, '.spec-first'))) {
    projectMissing.push('.spec-first/');
  }
  if (!existsSync(join(projectRoot, '.spec-first', 'layer2'))) {
    projectMissing.push('.spec-first/layer2/');
  }
  if (!existsSync(join(projectRoot, '.spec-first', 'meta', 'config.yaml'))) {
    projectMissing.push('.spec-first/meta/config.yaml');
  }

  return {
    firstCompleted: firstMissing.length === 0,
    firstMissing,
    projectInitialized: projectMissing.length === 0,
    projectMissing,
  };
}

function summarizeFirstArtifacts(projectRoot: string): FirstSummary {
  const firstDir = join(projectRoot, 'docs', 'first');

  const readIfExists = (path: string): string => {
    if (!existsSync(path)) return '';
    try {
      return readFileSync(path, 'utf-8');
    } catch {
      return '';
    }
  };

  const indexRaw = readIfExists(join(firstDir, '.index.yaml'));
  const techStackRaw = readIfExists(join(firstDir, 'tech-stack.md'));
  const overviewRaw = readIfExists(join(firstDir, 'codebase-overview.md'));
  const apiRaw = readIfExists(join(firstDir, 'api-docs.md'));

  const modeMatch = indexRaw.match(/^\s*mode:\s*(quick|deep)\s*$/m);
  const mode = (modeMatch?.[1] as FirstSummary['mode'] | undefined) ?? 'unknown';

  const lowerStack = techStackRaw.toLowerCase();
  let techStack = '待确认';
  if (lowerStack.includes('node.js') && lowerStack.includes('typescript')) {
    techStack = 'Node.js + TypeScript';
  } else if (lowerStack.includes('java') && lowerStack.includes('spring')) {
    techStack = 'Java + Spring';
  } else if (lowerStack.includes('python') && lowerStack.includes('django')) {
    techStack = 'Python + Django';
  } else if (lowerStack.includes('go') && lowerStack.includes('gin')) {
    techStack = 'Go + Gin';
  } else if (lowerStack.includes('typescript')) {
    techStack = 'TypeScript';
  }

  const codeVolumeMatch = overviewRaw.match(/代码量\s*[:：]\s*[~约]?\s*([0-9][0-9,]*)(\+)?\s*行?/);
  const codeVolume = codeVolumeMatch
    ? `~${codeVolumeMatch[1]}${codeVolumeMatch[2] ? '+' : ''} 行`
    : '待确认';

  const apiCountMatch = apiRaw.match(/([0-9][0-9,]*)\+?\s*个\s*API/);
  let apiSurface = apiCountMatch
    ? `${apiCountMatch[1]}+ 个`
    : '待确认';
  if (apiSurface === '待确认') {
    const sectionCount = (apiRaw.match(/^###\s+/gm) || []).length;
    if (sectionCount > 0) {
      apiSurface = `${sectionCount}+ 个`;
    }
  }

  return {
    mode,
    techStack,
    codeVolume,
    apiSurface,
  };
}

export async function handleInit(args: string[]): Promise<number> {
  if (args.includes('--help') || args.includes('-h')) {
    printInitHelp();
    return ExitCode.SUCCESS;
  }

  const cwd = process.cwd();
  const parsedInput = parseInitCliInput(args);

  // 在交互式收集参数前先检查 00-first 是否完成（避免用户填完问题后才被告知需要先运行 first）
  const readiness = checkInitReadiness(cwd);
  if (!readiness.firstCompleted) {
    console.error('⚠️  前置检查失败');
    console.error('');
    console.error('00-first Skill 尚未执行，无法初始化需求工作区。');
    console.error('');
    console.error('建议操作：');
    console.error('  1. 运行 /spec-first:first --quick    快速认知项目（<5min）');
    console.error('  2. 运行 /spec-first:first --deep     完整分析项目（<10min）');
    console.error('');
    console.error('缺失项：');
    for (const item of readiness.firstMissing) console.error(`  - ${item}`);
    console.error('');
    console.error('完成后再运行 /spec-first:init');
    return ExitCode.VALIDATION_ERROR;
  }

  const resolvedInput = await resolveInitCliInput(args, parsedInput);
  if (!resolvedInput) return ExitCode.VALIDATION_ERROR;

  const shouldBootstrap = Boolean(
    resolvedInput.bootstrap || process.env.SPEC_FIRST_INIT_BOOTSTRAP === '1',
  );
  const bootstrapCode = runBootstrapIfEnabled(shouldBootstrap);
  if (typeof bootstrapCode === 'number') return bootstrapCode;

  // 先校验参数，再检查前置依赖（避免参数非法时先显示成功）
  const normalized = normalizeInitInput(resolvedInput, cwd);
  if (!normalized) return ExitCode.VALIDATION_ERROR;
  ensureProjectMetaConfig(cwd);
  const postFixReadiness = checkInitReadiness(cwd);

  // 00-first 已确认完成，显示摘要信息
  const summary = summarizeFirstArtifacts(cwd);
  const modeLabel = summary.mode === 'unknown' ? 'unknown' : summary.mode;
  console.log('✅ 前置检查通过');
  console.log('');
  console.log(`00-first Skill 已完成 (${modeLabel} 模式)`);
  console.log(`- 技术栈: ${summary.techStack}`);
  console.log(`- 代码量: ${summary.codeVolume}`);
  console.log(`- API 端点: ${summary.apiSurface}`);
  console.log('');
  console.log('继续初始化需求工作区...');

  if (postFixReadiness.projectMissing.length > 0) {
    console.warn('警告：检测到项目初始化文件不完整（建议先运行 spec-first setup）：');
    for (const item of postFixReadiness.projectMissing) {
      console.warn(`  - ${item}`);
    }
  }

  let result: ReturnType<typeof init>;
  try {
    result = init({
      feat: normalized.feat,
      title: normalized.title,
      mode: normalized.mode,
      size: normalized.size,
      platforms: normalized.platforms,
      author: 'cli',
      featureId: normalized.featureId,
      projectRoot: cwd,
    });
  } catch (e) {
    console.error(`错误：${(e as Error).message}`);
    return ExitCode.VALIDATION_ERROR;
  }

  runPostInitSetup(cwd);
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

function ensureProjectClaudeSettings(projectRoot: string): void {
  const claudeDir = join(projectRoot, '.claude');
  const settingsPath = join(claudeDir, 'settings.json');
  if (existsSync(settingsPath)) return;
  try {
    mkdirSync(claudeDir, { recursive: true });
    if (!existsSync(settingsPath)) {
      writeFileSync(settingsPath, `${JSON.stringify({ hooks: {} }, null, 2)}\n`, 'utf-8');
    }
  } catch (e) {
    console.warn('警告：无法创建 .claude/settings.json：' + (e as Error).message);
  }
}

function printInitHelp(): void {
  console.log('用法：spec-first init --feat <abbr> --mode <N|I> --size <S|M|L> --platforms <p1,p2,...> [--feature-id <id>] [--title <title>] [--bootstrap]\n');
  console.log('参数说明：');
  console.log('  --feat       FEAT 缩写（必须匹配 ^[A-Z][A-Z0-9]{0,15}$，例如 AUTH、REPORT）');
  console.log('  --mode       开发模式：N（新功能）| I（增量迭代）');
  console.log('  --size       规模：S | M | L');
  console.log('  --platforms  平台列表（逗号分隔），必须来自 .spec-first/layer2/*.yaml');
  console.log('  --title      Feature 标题（可选）');
  console.log('  --feature-id 指定 Feature ID（可选，默认自动生成）');
  console.log('  --bootstrap  执行宿主环境自修复（MCP/skills/binaries）');
}

function parsePlatforms(platforms: string | undefined): { values: string[]; hadDuplicates: boolean } {
  if (!platforms) return { values: [], hadDuplicates: false };
  const list = platforms.split(',').map((p) => p.trim()).filter(Boolean);
  const deduped = [...new Set(list)];
  const values = deduped.sort((a, b) => a.localeCompare(b));
  return { values, hadDuplicates: deduped.length !== list.length };
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
  bootstrap: boolean;
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
  const deduped = [...new Set(items.map((item) => item.trim()).filter(Boolean))];
  return deduped.sort((a, b) => a.localeCompare(b));
}

interface PlatformActionResult {
  done: boolean;
  error?: string;
}

function applyPlatformAction(rawInput: string, discovered: string[], selected: Set<string>): PlatformActionResult {
  const raw = rawInput.trim();
  const normalized = raw.toLowerCase();

  const isDone = raw === '' || normalized === 'd' || normalized === 'done' || normalized === 'ok' || normalized === '完成';
  if (isDone) {
    if (selected.size === 0) {
      return { done: false, error: '至少选择一个平台后才能继续（可输入 a 全选）' };
    }
    return { done: true };
  }

  if (normalized === 'a' || normalized === 'all' || normalized === '*' || normalized === '全选') {
    discovered.forEach((item) => selected.add(item));
    return { done: false };
  }
  if (normalized === 'n' || normalized === 'none' || normalized === 'clear' || normalized === '清空') {
    selected.clear();
    return { done: false };
  }

  const tokens = raw.split(',').map((item) => item.trim()).filter(Boolean);
  if (tokens.length === 0) {
    return { done: false, error: '平台输入为空，请输入编号/平台名，或输入 d 完成' };
  }

  const resolved: string[] = [];
  for (const token of tokens) {
    if (/^\d+$/.test(token)) {
      const idx = Number.parseInt(token, 10);
      if (!Number.isInteger(idx) || idx < 1 || idx > discovered.length) {
        return { done: false, error: `平台编号超出范围：${token}（有效范围 1-${discovered.length}）` };
      }
      resolved.push(discovered[idx - 1]);
      continue;
    }

    if (!discovered.includes(token)) {
      return { done: false, error: `无效平台：${token}（可选：${discovered.join(', ')}）` };
    }
    resolved.push(token);
  }

  for (const item of uniquePlatforms(resolved)) {
    if (selected.has(item)) {
      selected.delete(item);
    } else {
      selected.add(item);
    }
  }

  return { done: false };
}

function formatSelectedPlatforms(selected: Set<string>): string {
  if (selected.size === 0) return '(空)';
  return uniquePlatforms([...selected]).join(', ');
}

async function askPlatformsInteractively(
  rl: ReturnType<typeof createInterface>,
  discovered: string[],
): Promise<string[] | null> {
  const selected = new Set<string>();
  console.log('4) 请选择平台（多选）:');
  console.log('   - 输入编号或平台名切换选中，支持逗号分隔（例如 1,3 或 h5,backend）');
  console.log('   - 输入 a 全选，n 清空，直接回车或输入 d 完成\n');

  while (true) {
    discovered.forEach((platform, idx) => {
      const marker = selected.has(platform) ? '[x]' : '[ ]';
      console.log(`   ${idx + 1}. ${marker} ${platform}`);
    });
    const answer = await rl.question(`选择操作（当前：${formatSelectedPlatforms(selected)}）: `);
    const action = applyPlatformAction(answer, discovered, selected);
    if (action.error) {
      console.error(action.error);
      console.log('');
      continue;
    }
    if (action.done) {
      return uniquePlatforms([...selected]);
    }
    console.log(`当前选择：${formatSelectedPlatforms(selected)}\n`);
  }
}

function isConfirmed(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === 'y' || normalized === 'yes' || normalized === '是' || normalized === '确认';
}

async function runGuidedInit(): Promise<GuidedInitInput | null> {
  const rl = createInterface({ input, output });
  try {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║          Spec-First Feature 初始化                             ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // Step 1/7: FEAT 缩写
    printStepHeader(1, 7, 'Feature 缩写');
    console.log('  格式：大写字母开头，仅包含大写字母和数字，长度 1-16 字符');
    console.log('  示例：DASHBOARD、AUTH、REPORT');
    const feat = await askUntilValid(rl, '\n你的输入: ', (value) =>
      /^[A-Z][A-Z0-9]{0,15}$/.test(value) ? null : '❌ FEAT 格式错误：需匹配 ^[A-Z][A-Z0-9]{0,15}$',
    );
    printStepConfirm('Feature 缩写', feat);

    // Step 2/7: 开发模式
    printStepHeader(2, 7, '开发模式');
    console.log('  1. N (New) - 全新功能开发');
    console.log('  2. I (Iteration) - 迭代优化现有功能');
    const modeInput = await askUntilValid(rl, '\n请输入 [1/2]（默认：1）: ', (value) =>
      normalizeModeInput(value) ? null : '❌ 模式无效，请输入 1/2 或 N/I',
    );
    const mode = normalizeModeInput(modeInput) as 'N' | 'I';
    printStepConfirm('开发模式', mode === 'N' ? 'N (New)' : 'I (Iteration)');

    // Step 3/7: 项目规模
    printStepHeader(3, 7, '项目规模');
    console.log('  1. S (Small) - 小型改动（1-3 天）');
    console.log('  2. M (Medium) - 中型功能（1-2 周）');
    console.log('  3. L (Large) - 大型项目（2+ 周）');
    const sizeInput = await askUntilValid(rl, '\n请输入 [1/2/3]（默认：2）: ', (value) =>
      normalizeSizeInput(value) ? null : '❌ 规模无效，请输入 1/2/3 或 S/M/L',
    );
    const size = normalizeSizeInput(sizeInput) as 'S' | 'M' | 'L';
    printStepConfirm('项目规模', `${size} (${size === 'S' ? 'Small' : size === 'M' ? 'Medium' : 'Large'})`);

    // Step 4/7: 平台选择
    const discovered = discoverPlatforms(process.cwd());
    if (discovered.length === 0) {
      console.error('\n❌ 未发现 .spec-first/layer2 平台模板。请先创建 *.yaml 后再执行初始化。');
      return null;
    }
    printStepHeader(4, 7, '平台选择');
    console.log('  检测到以下可用平台（来自 .spec-first/layer2/*.yaml）：\n');
    const selectedPlatforms = await askPlatformsInteractively(rl, discovered);
    if (!selectedPlatforms || selectedPlatforms.length === 0) {
      console.error('\n❌ 未选择任何平台，已取消初始化。');
      return null;
    }
    const platforms = selectedPlatforms.join(',');
    printStepConfirm('平台选择', selectedPlatforms.join(', '));

    // Step 5/7: Feature 标题
    printStepHeader(5, 7, 'Feature 标题');
    console.log('  示例：仪表盘数据可视化优化、Dashboard Data Visualization Enhancement');
    console.log(`  默认：${feat}`);
    const titleInput = (await rl.question('\n你的输入: ')).trim();
    const title = titleInput || feat;
    printStepConfirm('Feature 标题', title);

    // Step 6/7: Feature ID（可选）
    printStepHeader(6, 7, 'Feature ID（可选）');
    console.log('  系统将自动生成 Feature ID，格式：FSREQ-YYYYMMDD-<FEAT>-NNN');
    console.log('  可输入自定义 ID 或直接回车使用自动生成');
    const featureIdInput = (await rl.question('\n你的输入（回车=自动生成）: ')).trim();
    printStepConfirm('Feature ID', featureIdInput || '自动生成');

    // Step 7/7: Bootstrap 选项
    printStepHeader(7, 7, 'Bootstrap 选项');
    console.log('  是否需要执行宿主环境检查（MCP + skills 检查/自动修复）？');
    console.log('  1. 否 - 仅项目内初始化（推荐）');
    console.log('  2. 是 - 包含宿主环境检查');
    const bootstrapInput = (await rl.question('\n请输入 [1/2]（默认：1）: ')).trim();
    const bootstrap = bootstrapInput === '2' || isConfirmed(bootstrapInput);
    printStepConfirm('Bootstrap', bootstrap ? '是 - 包含宿主环境检查' : '否（仅项目内初始化）');

    // 最终确认
    console.log('\n  ---');
    console.log('  参数确认\n');
    console.log(`  Feature 缩写:    ${feat}`);
    console.log(`  开发模式:        ${mode} (${mode === 'N' ? 'New' : 'Iteration'})`);
    console.log(`  项目规模:        ${size} (${size === 'S' ? 'Small' : size === 'M' ? 'Medium' : 'Large'})`);
    console.log(`  平台:            ${platforms}`);
    console.log(`  标题:            ${title}`);
    console.log(`  Feature ID:      ${featureIdInput || '自动生成'}`);
    console.log(`  Bootstrap:       ${bootstrap ? '是' : '否'}`);
    const confirm = await rl.question('\n是否继续？[y/n]: ');
    if (!isConfirmed(confirm)) {
      console.error('\n❌ 已取消初始化。');
      return null;
    }

    return { feat, mode, size, platforms, title, featureId: featureIdInput || undefined, bootstrap };
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

// ─── 引导式交互辅助函数 ──────────────────────────────────

function printStepHeader(current: number, total: number, title: string): void {
  console.log(`\n  Step ${current}/${total}: ${title}\n`);
}

function printStepConfirm(label: string, value: string): void {
  console.log(`\n✅ ${label}：${value}\n`);
}
