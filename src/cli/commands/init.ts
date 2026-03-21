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
import { resolveHostAdapterStatuses } from '../../core/host-adapters/registry.js';
import { ensureHostBootstrap } from '../../shared/host-bootstrap.js';
import { detectHostPaths, formatHostPathSummary } from '../../shared/host-paths.js';
import { ensureSkillCommands } from '../../shared/skill-commands.js';
import { renderDefaultConfigYaml } from '../../shared/config-schema.js';
import { installHooks } from '../../core/tool-integration/hook-installer.js';
import { parseFlag } from '../parse-utils.js';
import { registerAIHooks } from '../../core/tool-integration/ai-runtime-hook.js';
import { classifyProjectMaturity } from '../../core/skill-runtime/first-platform-detector.js';
import {
  getFirstRuntimeDir,
  readFirstApiContracts,
  readFirstConventions,
  readFirstCriticalFlows,
  readFirstDatabaseSchema,
  readFirstDomainModel,
  readFirstEntryGuide,
  readFirstRuntimeIndex,
  readFirstRuntimeSummary,
  readFirstSteering,
  readFirstStructureOverview,
} from '../../core/skill-runtime/first-runtime-store.js';

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
  indexExistsButIncomplete: boolean;
  projectInitialized: boolean;
  projectMissing: string[];
}

interface FirstSummary {
  mode: 'deep' | 'unknown';
  techStack: string;
  codeVolume: string;
  apiSurface: string;
}

// ─────────────────────────────────────────────
// Init Router Types (Task 1 scaffold → Task 2/3 implementations)
// ─────────────────────────────────────────────

export type ProjectMaturity = 'greenfield' | 'brownfield';

export type InitTrack =
  | 'project-onboarding'
  | 'brownfield-baseline'
  | 'feature-init';

export interface InitProjectState {
  specFirstDirExists: boolean;
  metaConfigExists: boolean;
  firstRuntimeHealthy: boolean;
  hasAnyFeature: boolean;
  hasLegacyBaseline: boolean;
  baselineSkipped: boolean;
  projectMaturity: ProjectMaturity;
  discoveredPlatforms: string[];
}

/**
 * Detect current project initialization state.
 */
export function detectInitProjectState(projectRoot: string): InitProjectState {
  // 1. Check .spec-first directory
  const specFirstDirExists = existsSync(join(projectRoot, '.spec-first'));

  // 2. Check meta/config.yaml
  const metaConfigPath = join(projectRoot, '.spec-first', 'meta', 'config.yaml');
  const metaConfigExists = existsSync(metaConfigPath);

  // 3. Check first runtime health (index.json must exist and all sub-records healthy)
  let firstRuntimeHealthy = false;
  const runtimeIndexPath = join(projectRoot, '.spec-first', 'runtime', 'first', 'index.json');
  if (existsSync(runtimeIndexPath)) {
    try {
      const idx = JSON.parse(readFileSync(runtimeIndexPath, 'utf-8'));
      firstRuntimeHealthy = Boolean(
        idx?.summary?.healthy &&
          idx?.steering?.healthy &&
          idx?.conventions?.healthy &&
          idx?.criticalFlows?.healthy &&
          idx?.entryGuide?.healthy &&
          idx?.apiContracts?.healthy &&
          idx?.structureOverview?.healthy &&
          idx?.domainModel?.healthy &&
          (idx?.databaseSchema?.status === 'healthy' || idx?.databaseSchema?.status === 'not_applicable')
      );
    } catch {
      firstRuntimeHealthy = false;
    }
  }

  // 4. Detect legacy baseline directory
  const legacyBaselinePath = join(projectRoot, 'specs', LEGACY_BASELINE_FEATURE_ID);
  const hasLegacyBaseline = existsSync(legacyBaselinePath);

  // 5. Detect any non-legacy feature directories under specs/
  const specsDir = join(projectRoot, 'specs');
  let hasAnyFeature = false;
  if (existsSync(specsDir)) {
    try {
      hasAnyFeature = readdirSync(specsDir, { withFileTypes: true }).some(
        (entry) =>
          entry.isDirectory() &&
          /^FSREQ-/.test(entry.name) &&
          entry.name !== LEGACY_BASELINE_FEATURE_ID
      );
    } catch {
      hasAnyFeature = false;
    }
  }

  // 6. Read baselineSkipped flag from meta/config.yaml
  let baselineSkipped = false;
  if (metaConfigExists) {
    try {
      const configContent = readFileSync(metaConfigPath, 'utf-8');
      const match = /^baselineSkipped:\s*(true|false)/m.exec(configContent);
      if (match) baselineSkipped = match[1] === 'true';
    } catch {
      baselineSkipped = false;
    }
  }

  // 7. Classify project maturity (reuse first-platform-detector logic)
  const projectMaturity = classifyProjectMaturity(projectRoot);

  // 8. Discover available platforms from layer2
  const discoveredPlatforms = discoverPlatforms(projectRoot);

  return {
    specFirstDirExists,
    metaConfigExists,
    firstRuntimeHealthy,
    hasAnyFeature,
    hasLegacyBaseline,
    baselineSkipped,
    projectMaturity,
    discoveredPlatforms,
  };
}

/**
 * Determine which initialization track to follow based on project state.
 *
 * Routing priority (highest first):
 *   1. Explicit --track flag override
 *   2. .spec-first missing or meta/config missing → project-onboarding
 *   3. Brownfield with no legacy baseline, not skipped, no existing features → brownfield-baseline
 *   4. Default → feature-init
 */
export function detectInitTrack(state: InitProjectState, args: string[]): InitTrack {
  // 1. Explicit --track override takes highest priority
  const trackFlagIdx = args.indexOf('--track');
  if (trackFlagIdx !== -1) {
    const trackValue = args[trackFlagIdx + 1];
    if (trackValue === 'feature') return 'feature-init';
    if (trackValue === 'project') return 'project-onboarding';
    if (trackValue === 'baseline') return 'brownfield-baseline';
    // Unknown or missing value: fall through to auto-routing with a warning
    if (trackValue && !trackValue.startsWith('--')) {
      // Non-empty and not another flag — invalid value, warn and fall through
      console.warn(`警告：--track 值 "${trackValue}" 无效，有效值为 feature/project/baseline，已忽略并使用自动路由`);
    }
  }

  // 2. Project not yet onboarded (.spec-first or meta/config missing)
  if (!state.specFirstDirExists || !state.metaConfigExists) return 'project-onboarding';

  // 3. Brownfield with no baseline captured yet and user hasn't explicitly skipped it
  if (
    state.projectMaturity === 'brownfield' &&
    !state.hasLegacyBaseline &&
    !state.baselineSkipped &&
    !state.hasAnyFeature
  ) {
    return 'brownfield-baseline';
  }

  // 6. Everything else: proceed to feature init
  return 'feature-init';
}

// ─────────────────────────────────────────────
// Brownfield-baseline track
// ─────────────────────────────────────────────

/**
 * Canonical Feature ID for brownfield baseline captures.
 *
 * Current implementation constraint:
 * - the system supports exactly one canonical legacy baseline
 * - baseline semantics are identified via this fixed Feature ID
 *
 * This is an internal marker for the current single-baseline model, not the ideal
 * long-term representation of baseline semantics. If baseline variants or multiple
 * baselines are introduced later, migrate the semantic check to explicit metadata
 * (for example, `featureKind`) instead of relying on the ID literal alone.
 */
export const LEGACY_BASELINE_FEATURE_ID = 'FSREQ-19700101-LEGACY-BASELINE';

export interface LegacyBaselinePreset {
  featureId: string;
  feat: string;
  mode: 'I';
  size: 'M';
  title: string;
}

/**
 * Return the fixed parameters for the legacy baseline Feature.
 * The Feature ID FSREQ-19700101-LEGACY-BASELINE is the canonical marker
 * used throughout the system to identify brownfield baseline captures.
 */
export function buildLegacyBaselinePreset(): LegacyBaselinePreset {
  return {
    featureId: LEGACY_BASELINE_FEATURE_ID,
    feat: 'LEGACY',
    mode: 'I',
    size: 'M',
    title: '存量系统可分析基线',
  };
}

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

function printBootstrapHostStatus(): void {
  const statuses = resolveHostAdapterStatuses();
  const stableHosts = statuses.filter((entry) => entry.id === 'claude' || entry.id === 'codex');
  const experimentalHosts = statuses.filter(
    (entry) =>
      (entry.id === 'gemini' || entry.id === 'cursor') &&
      (entry.detected || entry.baselineState !== 'unknown')
  );

  if (stableHosts.length === 0 && experimentalHosts.length === 0) return;

  if (stableHosts.length > 0) {
    console.log('宿主基线状态：');
    for (const entry of stableHosts) {
      const missing = entry.missingBaseline.length > 0 ? entry.missingBaseline.join('+') : '(none)';
      console.log(
        `  ${entry.id}: ${entry.detected ? 'detected' : 'planned'}, baseline=${entry.baselineState}, missing=${missing}`
      );
      if (entry.baselineState !== 'ready') {
        console.log(`  - ${entry.remediation}`);
      }
    }
    console.log('');
  }

  if (experimentalHosts.length > 0) {
    console.log('实验宿主提示：');
    for (const entry of experimentalHosts) {
      const missing = entry.missingBaseline.length > 0 ? entry.missingBaseline.join('+') : '(none)';
      console.log(
        `  ${entry.id}: ${entry.detected ? 'detected' : 'planned'}, baseline=${entry.baselineState}, missing=${missing}`
      );
      console.log(`  - ${entry.remediation}`);
    }
    console.log('');
  }
}

async function resolveInitCliInput(
  args: string[],
  initial: InitCliInput
): Promise<InitCliInput | undefined> {
  const hasRequiredArgs = Boolean(
    initial.feat && initial.mode && initial.size && initial.platforms
  );
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
    console.warn(
      `警告：检测到重复 platforms，已自动去重并排序：${parsedPlatforms.values.join(', ')}`
    );
  }

  const discovered = discoverPlatforms(cwd);
  if (discovered.length > 0) {
    const platformValidationError = validatePlatformSelection(parsedPlatforms.values, cwd);
    if (platformValidationError) {
      console.error(platformValidationError);
      return undefined;
    }
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

function ensureStableHostSkillsForBootstrap(projectRoot: string): void {
  try {
    ensureSkillCommands(projectRoot, {
      global: true,
      hosts: ['claude', 'codex'],
    });
  } catch (e) {
    console.warn(`警告：宿主级 Skill 同步失败：${(e as Error).message}`);
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

/**
 * Write baselineSkipped: true into .spec-first/meta/config.yaml.
 * If the file doesn't exist yet, create it with the flag.
 * If it exists, append / update the flag.
 */
function writeBaselineSkipped(projectRoot: string): void {
  const metaDir = join(projectRoot, '.spec-first', 'meta');
  const metaConfigPath = join(metaDir, 'config.yaml');
  try {
    mkdirSync(metaDir, { recursive: true });
    let content = existsSync(metaConfigPath) ? readFileSync(metaConfigPath, 'utf-8') : '';
    if (/^baselineSkipped:/m.test(content)) {
      content = content.replace(/^baselineSkipped:.*$/m, 'baselineSkipped: true');
    } else {
      content = content.trimEnd() + '\nbaselineSkipped: true\n';
    }
    writeFileSync(metaConfigPath, content, 'utf-8');
  } catch (e) {
    console.warn('警告：无法写入 baselineSkipped：' + (e as Error).message);
  }
}

export function checkInitReadiness(projectRoot: string): InitReadinessStatus {
  const firstMissing: string[] = [];
  let indexExistsButIncomplete = false;
  const runtimeDir = getFirstRuntimeDir(projectRoot);
  if (!existsSync(runtimeDir)) {
    firstMissing.push('.spec-first/runtime/first/');
  } else {
    const runtimeIndex = readFirstRuntimeIndex(projectRoot);
    const runtimeSummary = readFirstRuntimeSummary(projectRoot);
    const runtimeSteering = readFirstSteering(projectRoot);
    const runtimeConventions = readFirstConventions(projectRoot);
    const runtimeCriticalFlows = readFirstCriticalFlows(projectRoot);
    const runtimeEntryGuide = readFirstEntryGuide(projectRoot);
    const runtimeApiContracts = readFirstApiContracts(projectRoot);
    const runtimeStructureOverview = readFirstStructureOverview(projectRoot);
    const runtimeDomainModel = readFirstDomainModel(projectRoot);
    const runtimeDatabaseSchema = readFirstDatabaseSchema(projectRoot);

    if (!runtimeIndex) {
      firstMissing.push('.spec-first/runtime/first/index.json');
    } else {
      // index.json 存在但字段不完整
      if (!runtimeIndex.summary?.healthy) {
        firstMissing.push('.spec-first/runtime/first/summary.json');
        indexExistsButIncomplete = true;
      }
      if (!runtimeIndex.steering?.healthy) {
        firstMissing.push('.spec-first/runtime/first/steering.json');
        indexExistsButIncomplete = true;
      }
      if (!runtimeIndex.conventions?.healthy) {
        firstMissing.push('.spec-first/runtime/first/conventions.json');
        indexExistsButIncomplete = true;
      }
      if (!runtimeIndex.criticalFlows?.healthy) {
        firstMissing.push('.spec-first/runtime/first/critical-flows.json');
        indexExistsButIncomplete = true;
      }
      if (!runtimeIndex.entryGuide?.healthy) {
        firstMissing.push('.spec-first/runtime/first/entry-guide.json');
        indexExistsButIncomplete = true;
      }
      if (!runtimeIndex.apiContracts?.healthy) {
        firstMissing.push('.spec-first/runtime/first/api-contracts.json');
        indexExistsButIncomplete = true;
      }
      if (!runtimeIndex.structureOverview?.healthy) {
        firstMissing.push('.spec-first/runtime/first/structure-overview.json');
        indexExistsButIncomplete = true;
      }
      if (!runtimeIndex.domainModel?.healthy) {
        firstMissing.push('.spec-first/runtime/first/domain-model.json');
        indexExistsButIncomplete = true;
      }
      if (
        runtimeIndex.databaseSchema?.status !== 'healthy' &&
        runtimeIndex.databaseSchema?.status !== 'not_applicable'
      ) {
        firstMissing.push('.spec-first/runtime/first/database-schema.json');
        indexExistsButIncomplete = true;
      }
    }
    // 单独检查各 JSON 文件是否存在（即使 index 完整）
    if (!runtimeSummary && !firstMissing.includes('.spec-first/runtime/first/summary.json')) {
      firstMissing.push('.spec-first/runtime/first/summary.json');
    }
    if (!runtimeSteering && !firstMissing.includes('.spec-first/runtime/first/steering.json')) {
      firstMissing.push('.spec-first/runtime/first/steering.json');
    }
    if (!runtimeConventions && !firstMissing.includes('.spec-first/runtime/first/conventions.json')) {
      firstMissing.push('.spec-first/runtime/first/conventions.json');
    }
    if (!runtimeCriticalFlows && !firstMissing.includes('.spec-first/runtime/first/critical-flows.json')) {
      firstMissing.push('.spec-first/runtime/first/critical-flows.json');
    }
    if (!runtimeEntryGuide && !firstMissing.includes('.spec-first/runtime/first/entry-guide.json')) {
      firstMissing.push('.spec-first/runtime/first/entry-guide.json');
    }
    if (!runtimeApiContracts && !firstMissing.includes('.spec-first/runtime/first/api-contracts.json')) {
      firstMissing.push('.spec-first/runtime/first/api-contracts.json');
    }
    if (
      !runtimeStructureOverview &&
      !firstMissing.includes('.spec-first/runtime/first/structure-overview.json')
    ) {
      firstMissing.push('.spec-first/runtime/first/structure-overview.json');
    }
    if (!runtimeDomainModel && !firstMissing.includes('.spec-first/runtime/first/domain-model.json')) {
      firstMissing.push('.spec-first/runtime/first/domain-model.json');
    }
    if (
      !runtimeDatabaseSchema &&
      !firstMissing.includes('.spec-first/runtime/first/database-schema.json')
    ) {
      firstMissing.push('.spec-first/runtime/first/database-schema.json');
    }
  }

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
    indexExistsButIncomplete,
    projectInitialized: projectMissing.length === 0,
    projectMissing,
  };
}

export function summarizeFirstArtifacts(projectRoot: string): FirstSummary {
  const runtimeIndex = readFirstRuntimeIndex(projectRoot);
  const runtimeSummary = readFirstRuntimeSummary(projectRoot);
  if (runtimeIndex && runtimeSummary) {
    return {
      mode: 'deep',
      techStack: runtimeSummary.project?.platformType ?? '待确认',
      codeVolume:
        runtimeSummary.modules?.length > 0 ? `${runtimeSummary.modules.length} 个模块` : '待确认',
      apiSurface:
        runtimeSummary.apiSurface?.length > 0
          ? `${runtimeSummary.apiSurface.length}+ 个`
          : '待确认',
    };
  }

  return {
    mode: 'unknown',
    techStack: '待确认',
    codeVolume: '待确认',
    apiSurface: '待确认',
  };
}

export async function handleInit(args: string[]): Promise<number> {
  if (args.includes('--help') || args.includes('-h')) {
    printInitHelp();
    return ExitCode.SUCCESS;
  }

  const cwd = process.cwd();

  // ── Step 1: Detect project state ────────────────────────────────────────
  const state = detectInitProjectState(cwd);

  // ── Step 2: Determine track ──────────────────────────────────────────────
  const track = detectInitTrack(state, args);

  // ── Step 3: Dispatch to track handler ───────────────────────────────────
  switch (track) {
    case 'project-onboarding':
      return await runProjectOnboardingTrack(state, cwd, args);

    case 'brownfield-baseline':
      return await runBrownfieldBaselineTrack(args, cwd);

    case 'feature-init':
    default:
      return await runFeatureInitTrack(args, cwd);
  }
}

// ─────────────────────────────────────────────
// Track handlers
// ─────────────────────────────────────────────

async function runProjectOnboardingTrack(
  state: InitProjectState,
  cwd: string,
  args: string[]
): Promise<number> {
  ensureProjectMetaConfig(cwd);

  if (!state.specFirstDirExists || !state.metaConfigExists) {
    console.log('✅ 项目 meta 配置已创建');
    console.log('');
  }

  console.log('继续进入 Feature 初始化（first runtime 可降级）...');
  return await runFeatureInitTrack(args, cwd);
}

async function runBrownfieldBaselineTrack(args: string[], cwd: string): Promise<number> {
  const preset = buildLegacyBaselinePreset();
  const discoveredPlatforms = discoverPlatforms(cwd);
  if (discoveredPlatforms.length === 0) {
    console.error('⚠️  检测到存量项目但未发现平台模板');
    console.error('');
    console.error('平台模板属于 Skill/工作流决策，请先运行 `spec-first skill render init` 补齐 .spec-first/layer2/*.yaml 后再继续。');
    return ExitCode.VALIDATION_ERROR;
  }

  console.log('📦 检测到存量项目，建议先创建系统基线');
  console.log('');
  console.log(`将自动创建以下 Feature：`);
  console.log(`  Feature ID: ${preset.featureId}`);
  console.log(`  标题:       ${preset.title}`);
  console.log(`  模式:       ${preset.mode} (Iteration)`);
  console.log(`  规模:       ${preset.size} (Medium)`);
  console.log('');

  // Check if user wants to skip baseline
  if (isInteractiveTerminal()) {
    const rl = createInterface({ input, output });
    try {
      const answer = await rl.question(
        '是否创建基线 Feature？[y/跳过(s)/n-退出]: '
      );
      const normalized = answer.trim().toLowerCase();

      if (normalized === 's' || normalized === 'skip' || normalized === '跳过') {
        // Write baselineSkipped: true to meta/config.yaml
        writeBaselineSkipped(cwd);
        console.log('');
        console.log('✅ 已跳过基线创建，写入 .spec-first/meta/config.yaml');
        console.log('');
        console.log('下次运行 /spec-first:init 将直接进入 Feature 初始化。');
        return ExitCode.SUCCESS;
      }

      if (normalized === 'n' || normalized === 'no' || normalized === '否') {
        console.log('');
        console.log('已取消。');
        return ExitCode.SUCCESS;
      }
      // y / yes / 是 / '' → proceed
    } finally {
      rl.close();
    }
  } else {
    // Non-interactive (CI/pipe): do not silently create baseline.
    // Require explicit --track baseline or --track feature to proceed.
    console.error('⚠️  检测到存量项目需要创建基线，但当前为非交互式终端');
    console.error('');
    console.error('请显式指定操作：');
    console.error('  spec-first init --track baseline    创建存量系统基线 Feature');
    console.error('  spec-first init --track feature     跳过基线，直接创建业务 Feature');
    return ExitCode.VALIDATION_ERROR;
  }

  ensureProjectMetaConfig(cwd);

  let result: ReturnType<typeof init>;
  try {
    result = init({
      feat: preset.feat,
      title: preset.title,
      mode: preset.mode,
      size: preset.size,
      platforms: discoveredPlatforms,
      author: 'cli',
      featureId: preset.featureId,
      projectRoot: cwd,
    });
  } catch (e) {
    console.error(`错误：${(e as Error).message}`);
    return ExitCode.VALIDATION_ERROR;
  }

  runPostInitSetup(cwd);
  console.log(`✅ 基线 Feature 已创建：${result.featureId}`);
  console.log(`目录：${result.featureDir}`);
  console.log('');
  console.log('请在 prd.md 中完成现状能力盘点后，再运行 /spec-first:init 创建业务 Feature。');
  return ExitCode.SUCCESS;
}

async function runFeatureInitTrack(args: string[], cwd: string): Promise<number> {
  const parsedInput = parseInitCliInput(args);

  // Show first runtime summary
  const summary = summarizeFirstArtifacts(cwd);
  console.log('✅ 前置检查通过');
  console.log('');
  if (summary.mode === 'deep') {
    console.log('00-first Skill 已完成 (deep 模式)');
    console.log(`- 技术栈: ${summary.techStack}`);
    console.log(`- 代码量: ${summary.codeVolume}`);
    console.log(`- API 端点: ${summary.apiSurface}`);
  } else {
    console.log('当前背景信息不足，按降级模式继续');
    console.log(`- 技术栈: ${summary.techStack}`);
    console.log(`- 代码量: ${summary.codeVolume}`);
    console.log(`- API 端点: ${summary.apiSurface}`);
  }
  console.log('');
  console.log('继续初始化需求工作区...');

  const resolvedInput = await resolveInitCliInput(args, parsedInput);
  if (!resolvedInput) return ExitCode.VALIDATION_ERROR;

  const shouldBootstrap = Boolean(
    resolvedInput.bootstrap || process.env.SPEC_FIRST_INIT_BOOTSTRAP === '1'
  );
  const bootstrapCode = runBootstrapIfEnabled(shouldBootstrap);
  if (typeof bootstrapCode === 'number') return bootstrapCode;

  const normalized = normalizeInitInput(resolvedInput, cwd);
  if (!normalized) return ExitCode.VALIDATION_ERROR;
  const createdPlatforms = ensureLayer2PlatformTemplates(cwd, normalized.platforms);
  if (createdPlatforms.length > 0) {
    console.log(`✅ 已创建平台模板：${createdPlatforms.join(', ')}`);
  }
  ensureProjectMetaConfig(cwd);

  const postFixReadiness = checkInitReadiness(cwd);
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
  if (shouldBootstrap) {
    ensureStableHostSkillsForBootstrap(cwd);
    printBootstrapHostStatus();
  }
  console.log(`background_input_status: ${result.backgroundInputStatus}`);
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
  console.log(
    '用法：spec-first init --feat <abbr> --mode <N|I> --size <S|M|L> --platforms <p1,p2,...> [--feature-id <id>] [--title <title>] [--bootstrap]\n'
  );
  console.log('参数说明：');
  console.log('  --feat       FEAT 缩写（必须匹配 ^[A-Z][A-Z0-9]{0,15}$，例如 AUTH、REPORT）');
  console.log('  --mode       开发模式：N（新功能）| I（增量迭代）');
  console.log('  --size       规模：S | M | L');
  console.log('  --platforms  平台列表（逗号分隔），必须来自 .spec-first/layer2/*.yaml');
  console.log('  --title      Feature 标题（可选）');
  console.log('  --feature-id 指定 Feature ID（可选，默认自动生成）');
  console.log('  --bootstrap  执行宿主环境自修复（MCP/skills/binaries）');
}

function parsePlatforms(platforms: string | undefined): {
  values: string[];
  hadDuplicates: boolean;
} {
  if (!platforms) return { values: [], hadDuplicates: false };
  const list = platforms
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
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
      .filter(
        (entry) => entry.isFile() && (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml'))
      )
      .map((entry) => entry.name.replace(/\.ya?ml$/i, ''))
      .sort();
  } catch {
    return [];
  }
}

function renderPlatformTemplate(platform: string): string {
  return [
    `platform: ${platform}`,
    `label: ${platform}`,
    `description: Auto-generated platform template for ${platform}`,
    '',
  ].join('\n');
}

function ensureLayer2PlatformTemplates(projectRoot: string, platforms: string[]): string[] {
  const unique = uniquePlatforms(platforms);
  if (unique.length === 0) return [];

  const layerDir = join(projectRoot, '.spec-first', 'layer2');
  mkdirSync(layerDir, { recursive: true });
  const created: string[] = [];
  for (const platform of unique) {
    const templatePath = join(layerDir, `${platform}.yaml`);
    if (!existsSync(templatePath)) {
      writeFileSync(templatePath, renderPlatformTemplate(platform), 'utf-8');
      created.push(platform);
    }
  }
  return created;
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
  if (
    !normalized ||
    normalized === '1' ||
    normalized === 'N' ||
    normalized === '新' ||
    normalized === '新功能'
  ) {
    return 'N';
  }
  if (normalized === '2' || normalized === 'I' || normalized === '增量' || normalized === '迭代') {
    return 'I';
  }
  return undefined;
}

function normalizeSizeInput(value: string): 'S' | 'M' | 'L' | undefined {
  const normalized = value.trim().toUpperCase();
  if (normalized === '' || normalized === '2' || normalized === 'M' || normalized === '中')
    return 'M';
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

function applyPlatformAction(
  rawInput: string,
  discovered: string[],
  selected: Set<string>
): PlatformActionResult {
  const raw = rawInput.trim();
  const normalized = raw.toLowerCase();

  const isDone =
    raw === '' ||
    normalized === 'd' ||
    normalized === 'done' ||
    normalized === 'ok' ||
    normalized === '完成';
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
  if (
    normalized === 'n' ||
    normalized === 'none' ||
    normalized === 'clear' ||
    normalized === '清空'
  ) {
    selected.clear();
    return { done: false };
  }

  const tokens = raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  if (tokens.length === 0) {
    return { done: false, error: '平台输入为空，请输入编号/平台名，或输入 d 完成' };
  }

  const resolved: string[] = [];
  for (const token of tokens) {
    if (/^\d+$/.test(token)) {
      const idx = Number.parseInt(token, 10);
      if (!Number.isInteger(idx) || idx < 1 || idx > discovered.length) {
        return {
          done: false,
          error: `平台编号超出范围：${token}（有效范围 1-${discovered.length}）`,
        };
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
  discovered: string[]
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

    let discovered = discoverPlatforms(process.cwd());
    if (discovered.length === 0) {
      console.log('  未发现 .spec-first/layer2/*.yaml 平台模板，将先创建最小模板。');
      const rawPlatforms = await askUntilValid(rl, '\n请输入要创建的平台（逗号分隔）: ', (value) => {
        const platforms = parsePlatforms(value).values;
        return platforms.length > 0 ? null : '❌ 至少需要输入一个平台，例如 h5 或 java-backend';
      });
      discovered = parsePlatforms(rawPlatforms).values;
      ensureLayer2PlatformTemplates(process.cwd(), discovered);
      console.log(`\n✅ 已创建平台模板：${discovered.join(', ')}`);
    }

    // Step 1/7: FEAT 缩写
    printStepHeader(1, 7, 'Feature 缩写');
    console.log('  格式：大写字母开头，仅包含大写字母和数字，长度 1-16 字符');
    console.log('  示例：DASHBOARD、AUTH、REPORT');
    const feat = await askUntilValid(rl, '\n你的输入: ', (value) =>
      /^[A-Z][A-Z0-9]{0,15}$/.test(value) ? null : '❌ FEAT 格式错误：需匹配 ^[A-Z][A-Z0-9]{0,15}$'
    );
    printStepConfirm('Feature 缩写', feat);

    // Step 2/7: 开发模式
    printStepHeader(2, 7, '开发模式');
    console.log('  1. N (New) - 全新功能开发');
    console.log('  2. I (Iteration) - 迭代优化现有功能');
    const modeInput = await askUntilValid(rl, '\n请输入 [1/2]（默认：1）: ', (value) =>
      normalizeModeInput(value) ? null : '❌ 模式无效，请输入 1/2 或 N/I'
    );
    const mode = normalizeModeInput(modeInput) as 'N' | 'I';
    printStepConfirm('开发模式', mode === 'N' ? 'N (New)' : 'I (Iteration)');

    // Step 3/7: 项目规模
    printStepHeader(3, 7, '项目规模');
    console.log('  1. S (Small) - 小型改动（1-3 天）');
    console.log('  2. M (Medium) - 中型功能（1-2 周）');
    console.log('  3. L (Large) - 大型项目（2+ 周）');
    const sizeInput = await askUntilValid(rl, '\n请输入 [1/2/3]（默认：2）: ', (value) =>
      normalizeSizeInput(value) ? null : '❌ 规模无效，请输入 1/2/3 或 S/M/L'
    );
    const size = normalizeSizeInput(sizeInput) as 'S' | 'M' | 'L';
    printStepConfirm(
      '项目规模',
      `${size} (${size === 'S' ? 'Small' : size === 'M' ? 'Medium' : 'Large'})`
    );

    // Step 4/7: 平台选择
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
    console.log('  1. 否 - 仅项目内初始化');
    console.log('  2. 是 - 包含宿主环境检查（推荐）');
    const bootstrapInput = (await rl.question('\n请输入 [1/2]（默认：2）: ')).trim();
    const bootstrap =
      bootstrapInput === '' || bootstrapInput === '2' || isConfirmed(bootstrapInput);
    printStepConfirm(
      'Bootstrap',
      bootstrap ? '是 - 包含宿主环境检查（推荐）' : '否（仅项目内初始化）'
    );

    // 最终确认
    console.log('\n  ---');
    console.log('  参数确认\n');
    console.log(`  Feature 缩写:    ${feat}`);
    console.log(`  开发模式:        ${mode} (${mode === 'N' ? 'New' : 'Iteration'})`);
    console.log(
      `  项目规模:        ${size} (${size === 'S' ? 'Small' : size === 'M' ? 'Medium' : 'Large'})`
    );
    console.log(`  平台:            ${platforms}`);
    console.log(`  标题:            ${title}`);
    console.log(`  Feature ID:      ${featureIdInput || '自动生成'}`);
    console.log(`  Bootstrap:       ${bootstrap ? '是' : '否'}`);
    const confirm = await rl.question('\n是否继续？[y/n]: ');
    if (!isConfirmed(confirm)) {
      console.error('\n❌ 已取消初始化。');
      return null;
    }

    return {
      feat,
      mode,
      size,
      platforms,
      title,
      featureId: featureIdInput || undefined,
      bootstrap,
    };
  } finally {
    rl.close();
  }
}

async function askUntilValid(
  rl: ReturnType<typeof createInterface>,
  prompt: string,
  validate: (value: string) => string | null
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
