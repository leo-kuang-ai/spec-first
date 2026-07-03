const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');
const pkg = require('../../../package.json');
const {
  buildFilteredAssetSet,
  inspectInstalledAssets,
  listBundledAgentSupportFiles,
  listBundledAgents,
  listBundledSkills,
  loadPluginManifest,
  planBundledAssetSync,
} = require('../plugin');
const {
  getGlobalDeveloperPath,
  readDeveloperFile,
  readGitUserName,
  resolveChangelogAuthor,
  resolveDeveloperIdentity,
  writeGlobalDeveloperFile,
} = require('../developer');
const {
  applyOperationPlan,
  buildState,
  buildFileWriteOperation,
  isLegacyManagedState,
  mergeOperationPlans,
  planCommandNamespacePrune,
  planHardResetManagedAssets,
  planObsoleteManagedAssetRemoval,
  planRetiredRuntimeAssetPrune,
  readStateFileRaw,
  readState,
  summarizeOperationPlan,
} = require('../state');
const { planRuntimeUntrack } = require('../runtime-untrack');
const { writeFileAtomic } = require('../atomic-write');
const { getAdapter } = require('../adapters');
const { detectGlobalCodexHookPollution } = require('../adapters/codex');
const { applyManagedBlock, buildManagedBlock } = require('../lang-policy');
const { removeManagedCodingGuidelinesBlock } = require('../coding-guidelines');
const { buildInitialChangelog, formatChangelogTimestamp } = require('../changelog');
const { applySpecFirstGitignoreBlock } = require('../gitignore-policy');
const {
  applyUserLanguageSyncPlan,
  buildUserLanguageSyncPlan,
} = require('../user-language-sync');
const {
  applyManagedBootstrapBlock,
  buildBootstrapBlock,
  inspectInstructionBootstrap,
} = require('../instruction-bootstrap');
const { removeManagedRuntimeToolsBlock } = require('../runtime-tools-index');
const {
  getClaudeSettingsPath,
  inspectManagedClaudeHooks,
  renderManagedClaudeHooksUpsert,
  validateClaudeSettingsFile,
} = require('../claude-settings');
const {
  PromptCancelled,
  checkbox,
  confirm,
  requireTty,
  select,
  textInput,
} = require('../prompts');
const {
  BrandColors,
  colorize,
  detectColorSupport,
  renderFullArt,
  renderWordmark,
} = require('../brand');
const { getInitMessages } = require('../init-i18n');

const INIT_PLATFORM_CHOICES = [
  {
    id: 'claude',
    flag: 'claude',
    label: 'Claude Code',
    defaultChecked: false,
    defaultForYes: true,
  },
  {
    id: 'codex',
    flag: 'codex',
    label: 'Codex',
    defaultChecked: false,
    defaultForYes: true,
  },
  {
    id: 'kiro',
    flag: 'kiro',
    label: 'Kiro',
    defaultChecked: false,
    defaultForYes: false,
  },
];

async function runInit(argv, promptOverrides = {}) {
  const args = [...argv];
  const promptApi = {
    checkbox,
    confirm,
    requireTty,
    select,
    textInput,
    ...promptOverrides,
  };

  const parsed = parseInitArgs(args);
  if (parsed.help) {
    printHelp();
    return 0;
  }

  if (parsed.error) {
    console.error(parsed.error);
    console.error('Usage: spec-first init [--claude] [--codex] [--kiro] [-y] [--all-repos|--repo <path>] [-u <name>] [--lang <zh|en>] [--sync-user-language|--no-sync-user-language]');
    return 2;
  }

  if (!parsed.yes) {
    const tty = promptApi.requireTty();
    if (!tty.ok) {
      console.error('spec-first init requires an interactive terminal unless `-y/--yes` is used with defaults or explicit host flags.');
      console.error('spec-first init 需要交互式终端；如需跳过引导，请使用 `-y/--yes` 并按需指定 `--claude` / `--codex` / `--kiro`。');
      return 2;
    }
  }

  if (parsed.yes && parsed.platforms.length === 0 && defaultInitPlatforms().length === 0) {
    console.error('spec-first init -y requires at least one default host runtime.');
    return 2;
  }

  const workspaceRoot = process.cwd();
  const defaults = resolveDeveloperDefaults(workspaceRoot);
  const defaultLang = parsed.lang || defaults.lang;
  const messages = getInitMessages(defaultLang);
  let activeLang = defaultLang;
  const useColor = detectColorSupport();

  if (!parsed.yes) {
    printInitBrandBanner({
      root: resolveInitBannerRoot(workspaceRoot),
      version: pkg.version,
      useColor,
    });
  }

  try {
    const interactiveInput = await collectInitInput({
      workspaceRoot,
      promptApi,
      parsed,
      defaults,
      defaultLang,
      messages,
      onLangSelected: (lang) => {
        activeLang = lang;
      },
    });
    if (interactiveInput && interactiveInput.error) {
      console.error(interactiveInput.error);
      return interactiveInput.exitCode || 2;
    }
    if (!interactiveInput || interactiveInput.cancelled) {
      console.log(getInitMessages(activeLang).cancelled);
      return 0;
    }

    const plans = buildInitPlans(interactiveInput);
    const userLanguageSyncPlan = buildUserLanguageSyncPlan({
      projectRoot: resolveUserLanguageSyncProjectRoot(interactiveInput),
      platforms: interactiveInput.platforms,
      lang: interactiveInput.lang,
      preference: interactiveInput.userLanguageSyncPreference,
    });
    for (const plan of plans) {
      printInitDiagnostics(plan);
    }
    const errors = plans.flatMap((plan) => collectInitErrors(plan));
    if (errors.length > 0) {
      for (const error of errors) {
        console.error(error.message || String(error));
      }
      return 1;
    }

    if (parsed.dryRun) {
      printInitPreviews(plans, { lang: interactiveInput.lang, useColor, userLanguageSyncPlan });
      return 0;
    }

    if (!parsed.yes) {
      const activeMessages = getInitMessages(interactiveInput.lang);
      printInitPreviews(plans, { lang: interactiveInput.lang, useColor, userLanguageSyncPlan });
      const confirmed = await promptApi.confirm(activeMessages.confirmApply, { default: true });
      if (!confirmed) {
        console.log(activeMessages.cancelled);
        return 0;
      }
    }

    const results = [];
    for (const [index, plan] of plans.entries()) {
      const result = applyInitPlan(plan.mode === 'all-repos' ? plan.workspaceRoot : plan.projectRoot, plan);
      results.push(result);
      if (plan.mode === 'all-repos') {
        printWorkspaceInitApplySuccess(plan, result);
      } else {
        printInitApplySuccess(plan, result, {
          showNextSteps: false,
          suppressChangelogCreated: plans.length > 1 && index > 0,
        });
      }
    }

    const userLanguageSyncResult = applyUserLanguageSyncPlan(userLanguageSyncPlan);
    const summaryUpdateFailures = persistWorkspaceUserLanguageSyncSummaries(plans, results, userLanguageSyncResult);
    printUserLanguageSyncApplySummary(userLanguageSyncResult, { lang: interactiveInput.lang });
    for (const failure of summaryUpdateFailures) {
      console.error(`Error: could not update workspace init summary with user-language sync result (${failure.reason_code}).`);
    }

    const exitCode = results.some((result) => result.exit_code !== 0)
      || userLanguageSyncResult.exit_code !== 0
      || summaryUpdateFailures.length > 0
      ? 1
      : 0;

    if (exitCode === 0 && (plans.length > 1 || plans[0].mode !== 'all-repos')) {
      console.log('');
      printInitNextStepsForPlatforms(interactiveInput.platforms, interactiveInput.lang);
    }

    return exitCode;
  } catch (error) {
    if (error instanceof PromptCancelled || error.code === 'prompt_cancelled') {
      console.log(getInitMessages(activeLang).cancelled);
      return 0;
    }
    throw error;
  }
}

function parseInitArgs(args) {
  const parsed = {
    help: false,
    yes: false,
    dryRun: false,
    allRepos: false,
    repo: '',
    platforms: [],
    name: '',
    lang: '',
    syncUserLanguage: null,
    syncUserLanguageExplicit: false,
    error: '',
  };
  const platforms = new Set();

  const readValue = (index, optionName) => {
    const value = args[index + 1];
    if (!value || value.startsWith('-')) {
      parsed.error = `init: missing value for ${optionName}`;
      return '';
    }
    return value;
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '-h' || arg === '--help') {
      parsed.help = true;
      continue;
    }
    if (arg === '-y' || arg === '--yes') {
      parsed.yes = true;
      continue;
    }
    if (arg === '--dry-run') {
      parsed.dryRun = true;
      continue;
    }
    if (arg === '--sync-user-language') {
      parsed.syncUserLanguage = true;
      parsed.syncUserLanguageExplicit = true;
      continue;
    }
    if (arg === '--no-sync-user-language') {
      parsed.syncUserLanguage = false;
      parsed.syncUserLanguageExplicit = true;
      continue;
    }
    if (arg === '--all-repos') {
      parsed.allRepos = true;
      continue;
    }
    if (arg === '--repo') {
      const value = readValue(index, arg);
      if (parsed.error) break;
      parsed.repo = value;
      index += 1;
      continue;
    }
    if (arg.startsWith('--repo=')) {
      parsed.repo = arg.slice('--repo='.length);
      if (!parsed.repo) parsed.error = 'init: missing value for --repo';
      if (parsed.error) break;
      continue;
    }
    if (arg === '-u' || arg === '--user') {
      const value = readValue(index, arg);
      if (parsed.error) break;
      parsed.name = value;
      index += 1;
      continue;
    }
    if (arg.startsWith('--user=')) {
      parsed.name = arg.slice('--user='.length);
      if (!parsed.name) parsed.error = 'init: missing value for --user';
      if (parsed.error) break;
      continue;
    }
    if (arg === '--lang') {
      const value = readValue(index, arg);
      if (parsed.error) break;
      parsed.lang = value;
      index += 1;
      continue;
    }
    if (arg.startsWith('--lang=')) {
      parsed.lang = arg.slice('--lang='.length);
      if (!parsed.lang) parsed.error = 'init: missing value for --lang';
      if (parsed.error) break;
      continue;
    }
    const platformChoice = INIT_PLATFORM_CHOICES.find((choice) => arg === `--${choice.flag}`);
    if (platformChoice) {
      platforms.add(platformChoice.id);
      continue;
    }
    parsed.error = `init: unknown option ${arg}`;
    break;
  }

  if (!parsed.error && parsed.lang && parsed.lang !== 'zh' && parsed.lang !== 'en') {
    parsed.error = 'init: --lang must be zh or en';
  }
  if (!parsed.error && parsed.allRepos && parsed.repo) {
    parsed.error = 'init: Cannot combine --repo and --all-repos.';
  }
  if (!parsed.error && args.includes('--sync-user-language') && args.includes('--no-sync-user-language')) {
    parsed.error = 'init: Cannot combine --sync-user-language and --no-sync-user-language.';
  }

  parsed.platforms = [...platforms];
  return parsed;
}

async function collectInitInput({
  workspaceRoot,
  promptApi,
  parsed,
  defaults = null,
  defaultLang = '',
  messages = null,
  onLangSelected = null,
}) {
  const root = canonicalizeExistingPath(workspaceRoot);
  const resolvedDefaults = defaults || resolveDeveloperDefaults(root);
  const initMessages = messages || getInitMessages(defaultLang || parsed.lang || resolvedDefaults.lang);

  const existingGlobal = readDeveloperFile(getGlobalDeveloperPath());
  const hasGlobalProfile = Boolean(existingGlobal && existingGlobal.name);
  const hasExplicitIdentity = Boolean(parsed.name) || Boolean(parsed.lang);
  // 全局 profile 已存在且未显式覆盖时,默认沿用,不再无条件先弹语言/名字提问。
  const reuseGlobalProfile = hasGlobalProfile && !parsed.yes && !hasExplicitIdentity;

  const promptLang = async () => promptApi.select(initMessages.languageSelect, [
    { label: 'Chinese / 中文 (zh)', value: 'zh' },
    { label: 'English (en)', value: 'en' },
  ], {
    defaultIndex: resolvedDefaults.lang === 'en' ? 1 : 0,
    hint: initMessages.selectHint,
  });

  let lang;
  if (parsed.lang) {
    lang = parsed.lang;
  } else if (parsed.yes) {
    lang = resolvedDefaults.lang;
  } else if (reuseGlobalProfile) {
    // 延后到沿用确认分支决定;先用全局值,选 No 时再弹语言选择。
    lang = resolvedDefaults.lang;
  } else {
    lang = await promptLang();
  }
  if (typeof onLangSelected === 'function') {
    onLangSelected(lang);
  }
  let activeMessages = getInitMessages(lang);
  // 交互多选框按上次记录预勾选(R3/R4/R5);--yes 与显式 flag 路径不经过多选框,天然不受影响(R6/R7)。
  const rememberedHosts = resolveRememberedHosts(existingGlobal);
  const platforms = parsed.platforms.length > 0
    ? parsed.platforms
    : parsed.yes
      ? defaultInitPlatforms()
      : await promptApi.checkbox(activeMessages.selectHosts, INIT_PLATFORM_CHOICES.map((choice) => ({
        label: choice.label,
        value: choice.id,
        checked: choice.defaultChecked || rememberedHosts.includes(choice.id),
      })), {
        minSelected: 1,
        hint: activeMessages.checkboxHint,
        onMinError: activeMessages.minSelectedError,
      });

  if (!Array.isArray(platforms) || platforms.length === 0) {
    return null;
  }

  const adapters = platforms.map((platform) => getAdapter(platform));

  let name;
  if (parsed.name) {
    name = parsed.name;
  } else if (parsed.yes) {
    name = resolvedDefaults.name;
  } else if (reuseGlobalProfile) {
    const confirmedReuse = await promptApi.confirm(
      activeMessages.reuseGlobalProfile(existingGlobal.name, existingGlobal.lang),
      { default: true },
    );
    if (confirmedReuse) {
      name = existingGlobal.name;
      lang = existingGlobal.lang;
    } else {
      // 选择不沿用:补回语言选择,再确认名字。
      lang = await promptLang();
      activeMessages = getInitMessages(lang);
      name = await promptApi.textInput(activeMessages.developerName, {
        default: resolvedDefaults.name,
        validate: (value) => (String(value || '').trim().length > 0 ? true : activeMessages.nameRequired),
      });
    }
    if (typeof onLangSelected === 'function') {
      onLangSelected(lang);
    }
  } else {
    name = await promptApi.textInput(activeMessages.developerName, {
      default: resolvedDefaults.name,
      validate: (value) => (String(value || '').trim().length > 0 ? true : activeMessages.nameRequired),
    });
  }
  const userLanguageSyncPreference = await resolveUserLanguageSyncPreference({
    parsed,
    promptApi,
    messages: activeMessages,
    existingGlobal,
  });
  const target = parsed.allRepos || parsed.repo
    ? collectExplicitInitTarget(root, parsed)
    : parsed.yes
      ? collectDefaultInitTarget(root)
      : await collectInteractiveInitTarget(root, promptApi, activeMessages);
  if (!target) {
    return { cancelled: true, lang };
  }
  if (target.error) {
    return { error: target.error, exitCode: 2, lang };
  }

  const globalProfileConfirmed = await maybeConfirmGlobalProfileOverwrite({
    parsed,
    promptApi,
    name,
    lang,
    messages: activeMessages,
  });

  return {
    projectRoot: target.projectRoot || root,
    workspaceRoot: target.workspaceRoot || root,
    platforms,
    name,
    lang,
    dryRun: parsed.dryRun,
    target,
    globalProfileConfirmed,
    userLanguageSyncPreference,
  };
}

async function resolveUserLanguageSyncPreference({
  parsed,
  promptApi,
  messages = getInitMessages('zh'),
  existingGlobal = null,
}) {
  if (parsed.syncUserLanguageExplicit) {
    return {
      value: parsed.syncUserLanguage,
      source: 'explicit',
    };
  }

  if (existingGlobal && typeof existingGlobal.syncUserLanguage === 'boolean') {
    return {
      value: existingGlobal.syncUserLanguage,
      source: 'stored',
    };
  }

  if (parsed.yes) {
    return {
      value: null,
      source: 'unset',
    };
  }

  const confirmed = await promptApi.confirm(messages.syncUserLanguageConsent, { default: false });
  return {
    value: Boolean(confirmed),
    source: 'interactive',
  };
}

async function maybeConfirmGlobalProfileOverwrite({ parsed, promptApi, name, lang, messages = getInitMessages(lang) }) {
  const existing = readDeveloperFile(getGlobalDeveloperPath());
  if (!existing || !existing.name) {
    return false;
  }
  const sameName = !name || name === existing.name;
  const sameLang = !lang || lang === existing.lang;
  if (sameName && sameLang) {
    return false;
  }
  if (parsed.yes) {
    return Boolean(parsed.name) || Boolean(parsed.lang);
  }
  const display = `${existing.name} (${existing.lang})`;
  return promptApi.confirm(
    messages.globalProfileOverwrite(display, name, lang),
    { default: false },
  );
}

function defaultInitPlatforms() {
  return INIT_PLATFORM_CHOICES
    .filter((choice) => choice.defaultForYes)
    .map((choice) => choice.id);
}

// 受支持 host id 的单一事实源,供读/写两侧过滤未知/已停用标识(R5)。
const SUPPORTED_HOST_IDS = new Set(INIT_PLATFORM_CHOICES.map((choice) => choice.id));

// 上次记录的 host 选择,过滤到当前受支持的 host id(忽略未知/已停用标识,R5)。
function resolveRememberedHosts(existingGlobal) {
  const recorded = Array.isArray(existingGlobal && existingGlobal.hosts)
    ? existingGlobal.hosts
    : [];
  return recorded.filter((host) => SUPPORTED_HOST_IDS.has(host));
}

// 本次勾选要持久化的 host 列表,过滤到受支持 host id,并规范化为
// 与持久化文件一致的 canonical 形式(去重 + 排序)。排序是为了让 sameHosts
// 与文件读回的 existing.hosts(同样排序)做位置比较,避免误判与无谓覆写。
function resolveSelectedHosts(platforms) {
  const selected = Array.isArray(platforms) ? platforms : [];
  const filtered = selected.filter((host) => SUPPORTED_HOST_IDS.has(host));
  return [...new Set(filtered)].sort((a, b) => a.localeCompare(b));
}

function buildInitPlans(input) {
  return input.platforms.map((platform) => buildInitPlan({
    ...input,
    platformCount: input.platforms.length,
    platform,
    adapter: getAdapter(platform),
  }));
}

function resolveUserLanguageSyncProjectRoot(input = {}) {
  if (input.target && input.target.mode === 'all-repos') {
    return input.workspaceRoot || input.projectRoot || process.cwd();
  }
  return input.projectRoot || input.workspaceRoot || process.cwd();
}

function collectDefaultInitTarget(workspaceRoot) {
  const cwdGitRoot = findGitRoot(workspaceRoot);
  if (cwdGitRoot) {
    return {
      mode: 'single-repo',
      projectRoot: cwdGitRoot,
      selectionSource: 'cwd-git-or-monorepo',
    };
  }

  return {
    mode: 'single-repo',
    projectRoot: workspaceRoot,
    selectionSource: 'cwd-directory-non-interactive',
  };
}

function collectExplicitInitTarget(workspaceRoot, parsed) {
  if (parsed.allRepos) {
    if (findGitRoot(workspaceRoot)) {
      return { error: 'Error: --all-repos must be run from a parent workspace, not inside a Git repo.' };
    }
    const candidates = discoverChildGitRepos(workspaceRoot);
    if (candidates.length === 0) {
      return { error: 'Error: --all-repos requires a parent workspace containing child Git repos.' };
    }
    return {
      mode: 'all-repos',
      workspaceRoot,
      candidates,
      selectionSource: 'explicit-all-repos',
    };
  }

  if (parsed.repo) {
    const targetPath = path.resolve(workspaceRoot, parsed.repo);
    if (!fs.existsSync(targetPath)) {
      return { error: `Error: --repo target does not exist: ${parsed.repo}` };
    }
    const realWorkspace = canonicalizeExistingPath(workspaceRoot);
    const realTarget = canonicalizeExistingPath(targetPath);
    if (!isPathWithin(realTarget, realWorkspace)) {
      return { error: 'Error: --repo target must be inside the current workspace.' };
    }
    const gitRoot = findGitRoot(realTarget);
    if (!gitRoot || !isPathWithin(gitRoot, realWorkspace)) {
      return { error: 'Error: --repo target must resolve to a Git repo inside the current workspace.' };
    }
    return {
      mode: 'single-repo',
      projectRoot: gitRoot,
      selectionSource: 'explicit-repo',
    };
  }

  return null;
}

async function collectInteractiveInitTarget(workspaceRoot, promptApi, messages = getInitMessages('zh')) {
  const cwdGitRoot = findGitRoot(workspaceRoot);
  if (cwdGitRoot) {
    return {
      mode: 'single-repo',
      projectRoot: cwdGitRoot,
      selectionSource: 'cwd-git-or-monorepo',
    };
  }

  const candidates = discoverChildGitRepos(workspaceRoot);
  if (candidates.length === 0) {
    return {
      mode: 'single-repo',
      projectRoot: workspaceRoot,
      selectionSource: 'cwd-directory',
    };
  }

  return promptApi.select(messages.workspaceTarget, [
    {
      label: messages.workspaceAllRepos(candidates.length),
      value: {
        mode: 'all-repos',
        workspaceRoot,
        candidates,
        selectionSource: 'workspace-interactive-all-repos',
      },
    },
    ...candidates.map((candidate) => ({
      label: candidate.workspace_relative_path,
      value: {
        mode: 'single-repo',
        projectRoot: candidate.git_root,
        selectionSource: 'workspace-interactive-single-repo',
      },
    })),
    {
      label: messages.workspaceCancel,
      value: null,
    },
  ], { requireExplicit: true, hint: messages.selectHint });
}

function resolveDeveloperDefaults(projectRoot) {
  const globalDeveloper = readDeveloperFile(getGlobalDeveloperPath());
  const gitUserName = readGitUserName(projectRoot);
  const name =
    (globalDeveloper && globalDeveloper.name) ||
    gitUserName ||
    '';
  const lang =
    normalizeSupportedLang(globalDeveloper && globalDeveloper.lang) ||
    'zh';

  return {
    name,
    lang,
  };
}

function normalizeSupportedLang(value) {
  return value === 'zh' || value === 'en' ? value : '';
}

function resolveInitBannerRoot(root) {
  return findGitRoot(root) || root;
}

function printInitBrandBanner({ root, version, useColor }) {
  const banner = hasAnyManagedState(root)
    ? renderWordmark(version, { useColor })
    : renderFullArt(version, { useColor }).trimEnd();
  console.log(banner);
}

function hasAnyManagedState(root) {
  return [
    path.join(root, '.claude', 'spec-first', 'state.json'),
    path.join(root, '.codex', 'spec-first', 'state.json'),
  ].some((statePath) => fs.existsSync(statePath));
}

function printInitPreview(plan, options = {}) {
  const { lang = 'en', useColor = false } = options;
  if (plan.mode === 'all-repos') {
    console.log(`Workspace preview: spec-first init (${plan.platform})`);
    console.log(`  workspace_root: ${plan.workspaceRoot}`);
    console.log(`  selection_source: ${plan.selectionSource}`);
    console.log(`  child_repos: ${plan.childPlans.length}`);
    console.log('');
    console.log('Parent runtime assets:');
    printInitDryRun({
      platform: plan.platform,
      plan: plan.parentPlan.operationPlan,
      untrackDiagnostic: plan.parentPlan.untrackDiagnostic,
      legacyStateDetected: plan.parentPlan.legacyStateDetected,
      destructiveResetReason: plan.parentPlan.destructiveResetReason,
      showPathSamples: false,
      lang,
      useColor,
    });
    plan.childPlans.forEach((entry, index) => {
      console.log('');
      console.log(`Child ${index + 1}/${plan.childPlans.length}: ${entry.candidate.workspace_relative_path}`);
      printInitDryRun({
        platform: plan.platform,
        plan: entry.plan.operationPlan,
        untrackDiagnostic: entry.plan.untrackDiagnostic,
        legacyStateDetected: entry.plan.legacyStateDetected,
        destructiveResetReason: entry.plan.destructiveResetReason,
        showPathSamples: false,
        lang,
        useColor,
      });
    });
    return;
  }

  printInitDryRun({
    platform: plan.platform,
    plan: plan.operationPlan,
    untrackDiagnostic: plan.untrackDiagnostic,
    legacyStateDetected: plan.legacyStateDetected,
    destructiveResetReason: plan.destructiveResetReason,
    showPathSamples: false,
    lang,
    useColor,
  });
}

function printInitPreviews(plans, options = {}) {
  const { lang = 'en', useColor = false, userLanguageSyncPlan = null } = options;
  const messages = getInitMessages(lang);
  if (plans.length === 1) {
    printInitPreview(plans[0], { lang, useColor });
    printUserLanguageSyncPreview(userLanguageSyncPlan, { lang });
    return;
  }

  console.log(messages.previewSelectedHosts(plans.map((plan) => initPlatformLabel(plan.platform)).join(', ')));
  plans.forEach((plan, index) => {
    console.log('');
    console.log(messages.previewHostRuntime(index + 1, plans.length, initPlatformLabel(plan.platform)));
    printInitPreview(plan, { lang, useColor });
  });
  printUserLanguageSyncPreview(userLanguageSyncPlan, { lang });
}

function printWorkspaceInitApplySuccess(plan, result) {
  const summary = result.workspace_summary || {};
  const counts = summary.counts || {};
  console.log(`Workspace init summary: ${summary.overall_status || 'unknown'} (${counts.ready || 0}/${counts.total || 0} ready)`);
  if (result.exit_code === 0) {
    const paths = Array.isArray(result.workspace_summary_paths) && result.workspace_summary_paths.length > 0
      ? result.workspace_summary_paths
      : ['.spec-first/workspace/init-summary.json'];
    console.log(`🧭 Wrote parent advisory summary: ${paths.join(', ')}`);
  }
}

function runInitForProject({
  parsed,
  platform,
  adapter,
  projectRoot,
  gitRootTopology = 'single-repo',
}) {
  const plan = buildInitPlan({
    projectRoot,
    platform,
    adapter,
    name: parsed.name,
    lang: parsed.lang,
    gitRootTopology,
    dryRun: parsed.dryRun,
  });

  printInitDiagnostics(plan);
  if (Array.isArray(plan.errors) && plan.errors.length > 0) {
    for (const error of plan.errors) {
      console.error(error.message || String(error));
    }
    return buildProjectInitResult(1, plan.untrackDiagnostic);
  }

  if (parsed.dryRun) {
    printInitDryRun({
      platform,
      plan: plan.operationPlan,
      untrackDiagnostic: plan.untrackDiagnostic,
      legacyStateDetected: plan.legacyStateDetected,
      destructiveResetReason: plan.destructiveResetReason,
    });
    return buildProjectInitResult(0, plan.untrackDiagnostic);
  }

  const result = applyInitPlan(projectRoot, plan);
  printInitApplySuccess(plan, result);
  return result;
}

function buildInitPlan(input = {}) {
  const platform = normalizeInitPlatform(input.platform);
  const adapter = input.adapter || getAdapter(platform);
  const target = input.target && typeof input.target === 'object'
    ? input.target
    : {
      mode: 'single-repo',
      projectRoot: input.projectRoot || process.cwd(),
    };

  if (target.mode === 'all-repos') {
    const workspaceRoot = canonicalizeExistingPath(target.workspaceRoot || input.projectRoot || process.cwd());
    const candidates = Array.isArray(target.candidates) && target.candidates.length > 0
      ? target.candidates
      : discoverChildGitRepos(workspaceRoot);
    return buildWorkspaceInitPlan({
      ...input,
      platform,
      adapter,
      workspaceRoot,
      candidates,
      selectionSource: target.selectionSource || input.selectionSource || 'programmatic-all-repos',
    });
  }

  return buildProjectInitPlan({
    ...input,
    platform,
    adapter,
    projectRoot: target.projectRoot || input.projectRoot || process.cwd(),
    gitRootTopology: input.gitRootTopology || target.gitRootTopology || 'single-repo',
  });
}

function applyInitPlan(projectRoot, plan) {
  if (!plan || typeof plan !== 'object') {
    throw new Error('applyInitPlan requires an init plan object.');
  }

  if (plan.mode === 'all-repos') {
    return applyWorkspaceInitPlan(projectRoot || plan.workspaceRoot, plan);
  }

  return applyProjectInitPlan(projectRoot || plan.projectRoot, plan);
}

function buildProjectInitPlan({
  projectRoot,
  platform,
  adapter,
  name = '',
  user = '',
  lang = '',
  platforms = [],
  gitRootTopology = 'single-repo',
  dryRun = false,
  globalProfileConfirmed = false,
}) {
  const normalizedRoot = canonicalizeExistingPath(projectRoot);
  const errors = [];
  const diagnostics = [];
  const bundledAgentPaths = listBundledAgents();
  const bundledAgentSupportFiles = listBundledAgentSupportFiles();

  if (platform === 'claude') {
    const duplicateBareNames = findDuplicateClaudeAgentNames(bundledAgentPaths);
    if (duplicateBareNames.length > 0) {
      errors.push({
        code: 'duplicate_claude_agent_names',
        message: `Error: Claude runtime requires unique bare agent names, but found duplicates: ${duplicateBareNames.join(', ')}`,
      });
      return buildErroredProjectInitPlan({
        projectRoot: normalizedRoot,
        platform,
        adapter,
        dryRun,
        gitRootTopology,
        errors,
        diagnostics,
      });
    }
  }

  const commandDir = adapter.hasCommands ? path.join(normalizedRoot, adapter.commandRoot) : '';
  let previousState = null;
  let legacyStateDetected = false;
  let rawManagedState = null;
  let destructiveResetPlan = null;
  let destructiveResetReason = '';
  try {
    previousState = readState(normalizedRoot, adapter);
  } catch (error) {
    rawManagedState = tryReadRawManagedState(normalizedRoot, adapter);
    if (isLegacyManagedState(rawManagedState)) {
      legacyStateDetected = true;
    } else {
      diagnostics.push({
        level: 'warn',
        code: 'managed_state_unreadable',
        message: `Warning: could not read existing spec-first state; continuing with a fresh sync. (${error instanceof Error ? error.message : String(error)})`,
      });
    }
  }
  const manifest = loadPluginManifest();
  const filteredAssetSet = buildFilteredAssetSet(adapter.id);
  const runtimeCommands = adapter.hasCommands
    ? filteredAssetSet.commands.map((command) => ({
      ...command,
      filename: adapter.commandFilename(command),
    }))
    : [];
  let developer;
  try {
    developer = resolveDeveloperIdentity(normalizedRoot, {
      user: user || name,
      lang,
    });
    // 持久化用户本次勾选的 host 列表(数据源是勾选列表,非磁盘 runtime 状态,R2)。
    developer = { ...developer, hosts: resolveSelectedHosts(platforms) };
  } catch (error) {
    errors.push({
      code: 'developer_identity_unresolved',
      message: error instanceof Error ? error.message : String(error),
    });
    return buildErroredProjectInitPlan({
      projectRoot: normalizedRoot,
      platform,
      adapter,
      dryRun,
      gitRootTopology,
      errors,
      diagnostics,
    });
  }

  const commandSkillNames = new Set(manifest.commands.map((cmd) => cmd.skill));
  const assetSync = planBundledAssetSync(normalizedRoot, adapter, filteredAssetSet);
  const runtimeSyncPlan = adapter.planRuntimeFilesSync(normalizedRoot, { manifest, filteredAssetSet });
  if (runtimeSyncPlan && runtimeSyncPlan.skippedHookWrite) {
    diagnostics.push({
      level: 'warn',
      code: 'codex_home_hook_write_skipped',
      message: 'This directory\'s .codex is the Codex global hook location (CODEX_HOME). '
        + 'Skipping SessionStart hook install here to avoid double-injecting into every project. '
        + 'skills/agents/AGENTS.md were still installed. Run init inside an actual project to install the project hook.',
    });
  } else if (platform === 'codex') {
    // High-touch existing-pollution bridge (U2b): a normal project init is a frequent action,
    // so surface a pre-existing global SessionStart pollution here instead of waiting for the
    // user to remember to run doctor. Read-only advisory; never auto-deletes.
    try {
      const pollution = detectGlobalCodexHookPollution();
      if (pollution && pollution.polluted) {
        diagnostics.push({
          level: 'warn',
          code: 'codex_global_hook_pollution_detected',
          message: `A spec-first SessionStart hook exists in the Codex global hook location (${pollution.hooksJsonPath}); `
            + 'it double-injects into every project. Run `spec-first doctor --codex` for details, or remove that entry / '
            + `run \`spec-first clean --codex\` in ${pollution.codexHome}.`,
        });
      }
    } catch {
      // Advisory only; never block init on detection failure.
    }
  }
  const previewState = buildState(manifest.version, {
    ...assetSync.syncedAssets,
    platform,
  });

  if (platform === 'claude') {
    try {
      validateClaudeSettingsFile(normalizedRoot);
    } catch (error) {
      errors.push({
        code: 'invalid_claude_settings_json',
        message: `Could not read Claude settings before init. ${error instanceof Error ? error.message : String(error)}`,
      });
      errors.push({
        code: 'invalid_claude_settings_fix',
        message: 'Fix `.claude/settings.json` so it contains valid JSON, then rerun `spec-first init` and choose Claude Code when prompted.',
      });
      return buildErroredProjectInitPlan({
        projectRoot: normalizedRoot,
        platform,
        adapter,
        dryRun,
        gitRootTopology,
        errors,
        diagnostics,
      });
    }
  }

  if (legacyStateDetected) {
    diagnostics.push({
      level: 'warn',
      code: 'legacy_state_detected',
      message: 'Detected legacy spec-first state; performing managed hard reset before re-init.',
    });
    const legacyResetState = buildLegacyHardResetState({
      adapter,
      rawManagedState,
      runtimeCommands,
      bundledSkillNames: listBundledSkills(),
      commandSkillNames: [...commandSkillNames],
      bundledAgentPaths,
      bundledAgentSupportFiles,
    });
    destructiveResetPlan = planHardResetManagedAssets(normalizedRoot, legacyResetState, adapter);
    destructiveResetReason = 'legacy_state_detected';
    previousState = null;
  } else if (previousState) {
    const currentRuntimeDrift = inspectCurrentRuntimeDrift(normalizedRoot, adapter);
    if (currentRuntimeDrift.detected) {
      diagnostics.push({
        level: 'warn',
        code: 'current_runtime_drift',
        message: `Detected current spec-first runtime drift; performing managed hard reset before re-init. (${currentRuntimeDrift.reasons.join(', ')})`,
        reasons: currentRuntimeDrift.reasons,
      });
      destructiveResetPlan = planHardResetManagedAssets(normalizedRoot, previousState, adapter);
      destructiveResetReason = 'current_runtime_drift';
      previousState = null;
    }
  }

  const preSyncPlan = mergeOperationPlans(
    planObsoleteManagedAssetRemoval(normalizedRoot, previousState, previewState, adapter),
    planCommandNamespacePrune(normalizedRoot, previewState.commands, adapter),
    planRetiredRuntimeAssetPrune(normalizedRoot, adapter),
    planLegacyDeveloperProfileCleanup(normalizedRoot),
  );
  const initWritePlan = buildInitWritePlan({
    projectRoot: normalizedRoot,
    adapter,
    developer,
    nextState: previewState,
    platform,
    assetPlan: assetSync.plan,
    runtimePlan: runtimeSyncPlan,
    gitRootTopology,
  });

  const operationPlan = mergeOperationPlans(destructiveResetPlan, preSyncPlan, initWritePlan.plan);
  const globalDeveloperWrite = resolveGlobalDeveloperWriteAction(developer, {
    explicitName: !!user || !!name,
    explicitLang: !!lang,
    confirmedOverwrite: !!globalProfileConfirmed,
  });
  return {
    schema_version: 'spec-first-init-plan.v1',
    mode: 'single-repo',
    projectRoot: normalizedRoot,
    platform,
    gitRootTopology,
    dryRun: Boolean(dryRun),
    adapterId: adapter.id,
    commandDir,
    developer,
    previousState,
    previewState,
    destructiveResetPlan,
    destructiveResetReason,
    legacyStateDetected,
    preSyncPlan,
    writePlan: initWritePlan.plan,
    operationPlan,
    untrackDiagnostic: initWritePlan.untrackDiagnostic,
    syncedAssets: assetSync.syncedAssets,
    changelogCreated: !fs.existsSync(path.join(normalizedRoot, 'CHANGELOG.md')),
    diagnostics,
    errors,
    summary: operationPlan.summary,
    globalDeveloperWrite,
  };
}

function applyProjectInitPlan(projectRoot, plan) {
  const normalizedRoot = canonicalizeExistingPath(projectRoot || plan.projectRoot);
  if (Array.isArray(plan.errors) && plan.errors.length > 0) {
    return {
      exit_code: 1,
      runtime_untrack: buildRuntimeUntrackSummary(plan.untrackDiagnostic),
    };
  }

  let untrackApplyResult = null;
  if (plan.destructiveResetPlan) {
    const destructiveBackup = createRuntimeRollbackBackup({
      projectRoot: normalizedRoot,
      plans: [plan.destructiveResetPlan, plan.preSyncPlan, plan.writePlan],
    });
    try {
      applyOperationPlan(normalizedRoot, plan.destructiveResetPlan);
      applyOperationPlan(normalizedRoot, plan.preSyncPlan);
      untrackApplyResult = applyOperationPlan(normalizedRoot, plan.writePlan);
      removeRuntimeRollbackBackup(destructiveBackup);
    } catch (error) {
      restoreRuntimeRollbackBackup(normalizedRoot, destructiveBackup);
      removeRuntimeRollbackBackup(destructiveBackup);
      throw error;
    }
  } else {
    applyOperationPlan(normalizedRoot, plan.preSyncPlan);
    untrackApplyResult = applyOperationPlan(normalizedRoot, plan.writePlan);
  }

  applyGlobalDeveloperProfileWrite(plan.globalDeveloperWrite);

  return {
    exit_code: 0,
    runtime_untrack: buildRuntimeUntrackSummary(plan.untrackDiagnostic, untrackApplyResult),
  };
}

function applyGlobalDeveloperProfileWrite(globalWrite) {
  if (!globalWrite || !globalWrite.developer) {
    return;
  }
  if (globalWrite.action === 'create' || globalWrite.action === 'overwrite') {
    writeGlobalDeveloperFile(globalWrite.developer);
  }
}

function printInitApplySuccess(plan, result, options = {}) {
  const adapter = getAdapter(plan.platform);
  const messages = getInitMessages((plan.developer && plan.developer.lang) || 'zh');
  if (plan.platform === 'claude') {
    console.log(messages.applyInstalledClaudeHook);
  } else if (plan.platform === 'codex') {
    console.log(hasInitDiagnostic(plan, 'codex_home_hook_write_skipped')
      ? messages.applySkippedCodexHook
      : messages.applyInstalledCodexHook);
  }
  const synced = plan.syncedAssets || {
    commands: [],
    skills: [],
    workflowSkills: [],
    internalSkills: [],
    agents: [],
    agentSupportFiles: [],
  };
  const written = synced.commands.map((command) => command.filename);
  const skillNames = adapter.workflowsRoot === adapter.skillsRoot
    ? mergeStringArrays(synced.skills, synced.workflowSkills, synced.internalSkills)
    : mergeStringArrays(synced.skills, synced.internalSkills);
  const agentPaths = synced.agents;
  const agentSupportFiles = synced.agentSupportFiles || [];

  if (adapter.hasCommands) {
    console.log(messages.applyGeneratedCommands(written.length, path.relative(plan.projectRoot, plan.commandDir)));
  }
  console.log(messages.applyGeneratedSkills(skillNames.length, adapter.skillsRoot));
  console.log(messages.applyGeneratedAgents(agentPaths.length, adapter.agentsRoot));
  if (agentSupportFiles.length > 0) {
    console.log(messages.applyGeneratedAgentSupport(agentSupportFiles.length, adapter.agentsRoot));
  }
  const gitignoreOperation = plan.writePlan.operations.find((operation) => operation.reason === 'managed_gitignore_policy');
  if (gitignoreOperation) {
    console.log(gitignoreOperation.gitignoreStatus === 'added'
      ? messages.applyGitignoreAdded
      : messages.applyGitignoreUpdated);
  }
  const runtimeUntrack = result.runtime_untrack;
  printRuntimeUntrackApplySummary(runtimeUntrack, messages);
  printGlobalDeveloperWriteSummary(plan.globalDeveloperWrite, messages);
  if (plan.changelogCreated && !options.suppressChangelogCreated) {
    console.log(messages.applyBootstrappedChangelog);
  }

  if (options.showNextSteps !== false) {
    console.log('');
    printInitNextSteps(plan.platform, (plan.developer && plan.developer.lang) || 'zh');
  }
}

function printGlobalDeveloperWriteSummary(globalWrite, messages = getInitMessages('zh')) {
  if (!globalWrite || !globalWrite.developer) {
    return;
  }
  const action = globalWrite.action;
  if (action === 'create') {
    console.log(messages.applyDeveloperProfileCreate);
  } else if (action === 'overwrite') {
    console.log(messages.applyDeveloperProfileOverwrite);
  } else {
    console.log(messages.applyDeveloperProfilePreserve);
  }
  console.log(`  📍 path: ${globalWrite.globalPath}`);
  console.log(`  👤 name: ${globalWrite.developer.name}`);
  console.log(`  🈯 lang: ${globalWrite.developer.lang}`);
  if (globalWrite.developer.initializedAt) {
    console.log(`  ⏱ initialized_at: ${globalWrite.developer.initializedAt}`);
  }
  if (globalWrite.developer.version) {
    console.log(`  🔖 version: ${globalWrite.developer.version}`);
  }
}

function printUserLanguageSyncPreview(plan, options = {}) {
  if (!plan || plan.mode === 'skipped') {
    return;
  }
  const messages = getInitMessages(options.lang || 'zh');
  console.log('');
  console.log(messages.previewUserLanguageSyncHeader);
  printUserLanguageSyncDetails(plan);
  if (plan.profileOperation) {
    printUserLanguageProfileOperation(plan.profileOperation);
  }
  console.log(messages.previewUserLanguageSyncDryRun);
}

function printUserLanguageSyncApplySummary(result, options = {}) {
  if (!result || result.status === 'skipped') {
    return;
  }
  const messages = getInitMessages(options.lang || 'zh');
  console.log('');
  console.log(messages.applyUserLanguageSyncHeader(result.status, result.reason_code || 'none'));
  printUserLanguageSyncDetails(result);
  if (result.profileOperation) {
    printUserLanguageProfileOperation(result.profileOperation);
  }
}

function printUserLanguageSyncDetails(planOrResult) {
  const operations = Array.isArray(planOrResult.operations) ? planOrResult.operations : [];
  for (const operation of operations) {
    console.log(`  - ${operation.host}: ${operation.action} (${operation.status})`);
    console.log(`    path: ${operation.displayPath}`);
    if (operation.reason) {
      console.log(`    reason_code: ${operation.reason}`);
    }
    if (operation.overrideDisplayPath) {
      console.log(`    override_path: ${operation.overrideDisplayPath}`);
    }
    if (operation.error) {
      console.log(`    error: ${operation.error}`);
    }
  }
}

function printUserLanguageProfileOperation(operation) {
  console.log(`  - profile: ${operation.action} (${operation.status})`);
  console.log(`    path: ${operation.globalPath}`);
  console.log(`    sync_user_language: ${operation.value}`);
  if (operation.reason) {
    console.log(`    reason_code: ${operation.reason}`);
  }
  if (operation.error) {
    console.log(`    error: ${operation.error}`);
  }
}

function hasInitDiagnostic(plan, code) {
  return Array.isArray(plan && plan.diagnostics)
    && plan.diagnostics.some((diagnostic) => diagnostic && diagnostic.code === code);
}

function runInitForWorkspace({
  parsed,
  platform,
  adapter,
  workspaceRoot,
  candidates,
  selectionSource,
}) {
  const results = [];
  const workspaceMessages = getInitMessages(parsed.lang || 'zh');
  console.log(`Workspace init: spec-first init (${platform})`);
  console.log(`  workspace_root: ${workspaceRoot}`);
  console.log(`  selection_source: ${selectionSource}`);
  console.log(`  child_repos: ${candidates.length}`);

  console.log('');
  console.log(workspaceMessages.applyRefreshParentRuntime);
  let parentRuntime = {
    exit_code: 0,
    overall_status: 'ready',
    reason_code: null,
    diagnostic: '',
    runtime_untrack: buildRuntimeUntrackSummary(),
  };
  try {
    const projectResult = normalizeProjectInitResult(runInitForProject({
      parsed,
      platform,
      adapter,
      projectRoot: workspaceRoot,
      gitRootTopology: 'multi-repo-workspace',
    }));
    parentRuntime = {
      exit_code: projectResult.exit_code,
      overall_status: projectResult.exit_code === 0 ? 'ready' : 'action-required',
      reason_code: projectResult.exit_code === 0 ? null : 'parent-runtime-init-failed',
      diagnostic: '',
      runtime_untrack: projectResult.runtime_untrack,
    };
  } catch (error) {
    parentRuntime = {
      exit_code: 1,
      overall_status: 'action-required',
      reason_code: 'parent-runtime-init-exception',
      diagnostic: error instanceof Error ? error.message : String(error),
      runtime_untrack: buildRuntimeUntrackSummary(),
    };
    console.error(`Parent runtime init failed: ${parentRuntime.diagnostic}`);
  }

  candidates.forEach((candidate, index) => {
    console.log('');
    console.log(`▶ Init child ${index + 1}/${candidates.length}: ${candidate.workspace_relative_path}`);
    let exitCode = 0;
    let reasonCode = null;
    let diagnostic = '';
    try {
      const projectResult = normalizeProjectInitResult(runInitForProject({
        parsed,
        platform,
        adapter,
        projectRoot: candidate.git_root,
      }));
      exitCode = projectResult.exit_code;
      if (exitCode !== 0) {
        reasonCode = 'init-failed';
      }
      results.push({
        repo_label: candidate.repo_label,
        workspace_relative_path: candidate.workspace_relative_path,
        git_root: candidate.git_root,
        exit_code: exitCode,
        overall_status: exitCode === 0 ? 'ready' : 'action-required',
        reason_code: reasonCode,
        diagnostic,
        runtime_untrack: projectResult.runtime_untrack,
      });
      return;
    } catch (error) {
      exitCode = 1;
      reasonCode = 'init-exception';
      diagnostic = error instanceof Error ? error.message : String(error);
      console.error(`Child init failed for ${candidate.workspace_relative_path}: ${diagnostic}`);
    }
    results.push({
      repo_label: candidate.repo_label,
      workspace_relative_path: candidate.workspace_relative_path,
      git_root: candidate.git_root,
      exit_code: exitCode,
      overall_status: exitCode === 0 ? 'ready' : 'action-required',
      reason_code: reasonCode,
      diagnostic,
      runtime_untrack: buildRuntimeUntrackSummary(),
    });
  });

  const readyCount = results.filter((result) => result.overall_status === 'ready').length;
  const childActionRequiredCount = results.length - readyCount;
  const parentActionRequiredCount = parentRuntime.overall_status === 'ready' ? 0 : 1;
  const actionRequiredCount = childActionRequiredCount + parentActionRequiredCount;
  const overallStatus = actionRequiredCount === 0
    ? 'ready'
    : readyCount > 0
      ? 'partial'
      : 'action-required';
  const summary = {
    schema_version: 'workspace-init-summary.v1',
    generated_at: new Date().toISOString(),
    advisory: true,
    workflow_mode: 'all-repos',
    selection_source: selectionSource,
    workspace_root: workspaceRoot,
    parent_writes_repo_local_artifacts: false,
    parent_writes_host_runtime_assets: true,
    parent_host_runtime: parentRuntime,
    dry_run: parsed.dryRun,
    platform,
    platforms: Array.isArray(parsed.platforms) && parsed.platforms.length > 0
      ? [...new Set(parsed.platforms)].sort((left, right) => left.localeCompare(right))
      : [platform],
    platform_count: Array.isArray(parsed.platforms) && parsed.platforms.length > 0
      ? parsed.platforms.length
      : 1,
    results,
    counts: {
      total: results.length,
      ready: readyCount,
      action_required: childActionRequiredCount,
      parent_runtime_ready: parentRuntime.overall_status === 'ready' ? 1 : 0,
      parent_runtime_action_required: parentActionRequiredCount,
      runtime_untrack_total: results.reduce((total, result) => (
        total + (result.runtime_untrack && Number.isFinite(result.runtime_untrack.count)
          ? result.runtime_untrack.count
          : 0)
      ), 0),
    },
    overall_status: overallStatus,
    reason_code: actionRequiredCount === 0 ? null : 'all-repos-partial-or-action-required',
    next_action: actionRequiredCount === 0
      ? 'Parent host runtime and all child repos completed init.'
      : 'Inspect per-child reason_code and rerun init for action-required repos.',
  };

  console.log('');
  console.log(`Workspace init summary: ${overallStatus} (${readyCount}/${results.length} ready)`);
  if (parsed.dryRun) {
    console.log('Dry run: no parent advisory summary was written.');
  } else {
    const writeResult = writeWorkspaceInitSummaryFiles(workspaceRoot, summary);
    if (!writeResult.ok) {
      console.error(`Error: workspace init summary path is unsafe (${writeResult.reason_code}).`);
      return 1;
    }
    console.log(`🧭 Wrote parent advisory summary: ${writeResult.paths.join(', ')}`);
  }

  return actionRequiredCount === 0 ? 0 : 1;
}

function buildWorkspaceInitPlan({
  platform,
  adapter,
  workspaceRoot,
  candidates,
  selectionSource = 'programmatic-all-repos',
  platformCount = 1,
  name = '',
  user = '',
  lang = '',
  platforms = [],
  dryRun = false,
}) {
  const normalizedWorkspaceRoot = canonicalizeExistingPath(workspaceRoot);
  const parentPlan = buildProjectInitPlan({
    projectRoot: normalizedWorkspaceRoot,
    platform,
    adapter,
    name,
    user,
    lang,
    platforms,
    dryRun,
    gitRootTopology: 'multi-repo-workspace',
  });
  const childPlans = candidates.map((candidate) => ({
    candidate,
    plan: buildProjectInitPlan({
      projectRoot: candidate.git_root,
      platform,
      adapter,
      name,
      user,
      lang,
      platforms,
      dryRun,
      gitRootTopology: 'single-repo',
    }),
  }));

  return {
    schema_version: 'spec-first-init-plan.v1',
    mode: 'all-repos',
    workspaceRoot: normalizedWorkspaceRoot,
    platform,
    platformCount,
    platforms,
    adapterId: adapter.id,
    dryRun: Boolean(dryRun),
    selectionSource,
    candidates,
    parentPlan,
    childPlans,
    errors: [
      ...(parentPlan.errors || []),
      ...childPlans.flatMap((entry) => entry.plan.errors || []),
    ],
    diagnostics: [
      ...(parentPlan.diagnostics || []),
      ...childPlans.flatMap((entry) => entry.plan.diagnostics || []),
    ],
    summary: {
      parent: parentPlan.summary || {},
      children: childPlans.map((entry) => ({
        repo_label: entry.candidate.repo_label,
        summary: entry.plan.summary || {},
      })),
    },
  };
}

function applyWorkspaceInitPlan(workspaceRoot, plan) {
  const normalizedWorkspaceRoot = canonicalizeExistingPath(workspaceRoot || plan.workspaceRoot);
  let parentRuntime = {
    exit_code: 0,
    overall_status: 'ready',
    reason_code: null,
    diagnostic: '',
    runtime_untrack: buildRuntimeUntrackSummary(),
  };

  try {
    const parentResult = normalizeProjectInitResult(applyProjectInitPlan(
      plan.parentPlan.projectRoot,
      plan.parentPlan,
    ));
    parentRuntime = {
      exit_code: parentResult.exit_code,
      overall_status: parentResult.exit_code === 0 ? 'ready' : 'action-required',
      reason_code: parentResult.exit_code === 0 ? null : 'parent-runtime-init-failed',
      diagnostic: collectPlanErrorMessages(plan.parentPlan),
      runtime_untrack: parentResult.runtime_untrack,
    };
  } catch (error) {
    parentRuntime = {
      exit_code: 1,
      overall_status: 'action-required',
      reason_code: 'parent-runtime-init-exception',
      diagnostic: error instanceof Error ? error.message : String(error),
      runtime_untrack: buildRuntimeUntrackSummary(),
    };
  }

  const results = [];
  for (const entry of plan.childPlans) {
    const { candidate } = entry;
    try {
      const projectResult = normalizeProjectInitResult(applyProjectInitPlan(
        entry.plan.projectRoot,
        entry.plan,
      ));
      results.push({
        repo_label: candidate.repo_label,
        workspace_relative_path: candidate.workspace_relative_path,
        git_root: candidate.git_root,
        exit_code: projectResult.exit_code,
        overall_status: projectResult.exit_code === 0 ? 'ready' : 'action-required',
        reason_code: projectResult.exit_code === 0 ? null : 'init-failed',
        diagnostic: collectPlanErrorMessages(entry.plan),
        runtime_untrack: projectResult.runtime_untrack,
      });
    } catch (error) {
      results.push({
        repo_label: candidate.repo_label,
        workspace_relative_path: candidate.workspace_relative_path,
        git_root: candidate.git_root,
        exit_code: 1,
        overall_status: 'action-required',
        reason_code: 'init-exception',
        diagnostic: error instanceof Error ? error.message : String(error),
        runtime_untrack: buildRuntimeUntrackSummary(),
      });
    }
  }

  const summary = buildWorkspaceInitSummary({
    workspaceRoot: normalizedWorkspaceRoot,
    plan,
    parentRuntime,
    results,
  });

  if (!plan.dryRun) {
    const writeResult = writeWorkspaceInitSummaryFiles(normalizedWorkspaceRoot, summary);
    if (!writeResult.ok) {
      return {
        exit_code: 1,
        workspace_summary: summary,
        runtime_untrack: buildRuntimeUntrackSummary(),
        error: `workspace init summary path is unsafe (${writeResult.reason_code})`,
      };
    }
    summary.workspace_summary_index = writeResult.index_summary || null;
    summary.workspace_summary_paths = writeResult.paths;
  }

  const actionRequiredCount = summary.counts.action_required + summary.counts.parent_runtime_action_required;
  return {
    exit_code: actionRequiredCount === 0 ? 0 : 1,
    workspace_summary: summary,
    workspace_summary_paths: summary.workspace_summary_paths || [],
    runtime_untrack: parentRuntime.runtime_untrack,
  };
}

function buildWorkspaceInitSummary({
  workspaceRoot,
  plan,
  parentRuntime,
  results,
}) {
  const readyCount = results.filter((result) => result.overall_status === 'ready').length;
  const childActionRequiredCount = results.length - readyCount;
  const parentActionRequiredCount = parentRuntime.overall_status === 'ready' ? 0 : 1;
  const actionRequiredCount = childActionRequiredCount + parentActionRequiredCount;
  const overallStatus = actionRequiredCount === 0
    ? 'ready'
    : readyCount > 0
      ? 'partial'
      : 'action-required';

  return {
    schema_version: 'workspace-init-summary.v1',
    generated_at: new Date().toISOString(),
    advisory: true,
    workflow_mode: 'all-repos',
    selection_source: plan.selectionSource,
    workspace_root: workspaceRoot,
    parent_writes_repo_local_artifacts: false,
    parent_writes_host_runtime_assets: true,
    parent_host_runtime: parentRuntime,
    dry_run: Boolean(plan.dryRun),
    platform: plan.platform,
    platforms: Array.isArray(plan.platforms) && plan.platforms.length > 0
      ? [...new Set(plan.platforms)].sort((left, right) => left.localeCompare(right))
      : [plan.platform],
    platform_count: Number.isInteger(plan.platformCount) && plan.platformCount > 0
      ? plan.platformCount
      : 1,
    results,
    counts: {
      total: results.length,
      ready: readyCount,
      action_required: childActionRequiredCount,
      parent_runtime_ready: parentRuntime.overall_status === 'ready' ? 1 : 0,
      parent_runtime_action_required: parentActionRequiredCount,
      runtime_untrack_total: results.reduce((total, result) => (
        total + (result.runtime_untrack && Number.isFinite(result.runtime_untrack.count)
          ? result.runtime_untrack.count
          : 0)
      ), 0),
    },
    overall_status: overallStatus,
    reason_code: actionRequiredCount === 0 ? null : 'all-repos-partial-or-action-required',
    next_action: actionRequiredCount === 0
      ? 'Parent host runtime and all child repos completed init.'
      : 'Inspect per-child reason_code and rerun init for action-required repos.',
  };
}

function persistWorkspaceUserLanguageSyncSummaries(plans, results, userLanguageSyncResult) {
  const failures = [];
  const summary = buildUserLanguageSyncSummary(userLanguageSyncResult);
  plans.forEach((plan, index) => {
    const result = results[index];
    if (!plan || plan.mode !== 'all-repos' || !result || !result.workspace_summary) {
      return;
    }
    result.workspace_summary.user_language_sync = summary;
    const writeResult = writeWorkspaceInitSummaryFiles(plan.workspaceRoot, result.workspace_summary);
    if (!writeResult.ok) {
      failures.push({
        platform: plan.platform,
        reason_code: writeResult.reason_code,
      });
      return;
    }
    result.workspace_summary.workspace_summary_index = writeResult.index_summary || null;
    result.workspace_summary.workspace_summary_paths = writeResult.paths;
    result.workspace_summary_paths = writeResult.paths;
  });
  return failures;
}

function buildUserLanguageSyncSummary(result) {
  if (!result || typeof result !== 'object') {
    return {
      schema_version: 'user-language-sync-summary.v1',
      status: 'skipped',
      reason_code: 'user-language-sync-unset',
      operations: [],
      profile: null,
    };
  }
  return {
    schema_version: 'user-language-sync-summary.v1',
    status: result.status || 'unknown',
    reason_code: result.reason_code || null,
    operations: (Array.isArray(result.operations) ? result.operations : []).map((operation) => ({
      host: operation.host,
      action: operation.action,
      status: operation.status,
      reason_code: operation.reason || null,
      display_path: operation.displayPath,
      basis: operation.basis || null,
      override_display_path: operation.overrideDisplayPath || null,
      error: operation.error || null,
    })),
    profile: result.profileOperation ? {
      action: result.profileOperation.action,
      status: result.profileOperation.status,
      reason_code: result.profileOperation.reason || null,
      path: result.profileOperation.globalPath,
      value: result.profileOperation.value,
      error: result.profileOperation.error || null,
    } : null,
  };
}

function writeWorkspaceInitSummaryFiles(workspaceRoot, summary) {
  const workspaceDir = path.join(workspaceRoot, '.spec-first', 'workspace');
  const platformSummaryPath = path.join(workspaceDir, workspaceInitSummaryFileName(summary.platform));
  const summaryPath = path.join(workspaceDir, 'init-summary.json');

  for (const candidatePath of [platformSummaryPath, summaryPath]) {
    const guard = validateContainedWorkspaceWritePath(workspaceRoot, candidatePath);
    if (!guard.ok) {
      return { ok: false, reason_code: guard.reason_code, paths: [] };
    }
  }

  writeJsonFileAtomic(platformSummaryPath, summary);
  const platformRelativePath = toWorkspaceRelativePath(platformSummaryPath, workspaceRoot);
  const multiPlatform = (Array.isArray(summary.platforms) && summary.platforms.length > 1)
    || (Number.isInteger(summary.platform_count) && summary.platform_count > 1);

  if (!multiPlatform) {
    writeJsonFileAtomic(summaryPath, summary);
    return {
      ok: true,
      paths: [
        toWorkspaceRelativePath(summaryPath, workspaceRoot),
        platformRelativePath,
      ],
      index_summary: null,
    };
  }

  const indexSummary = buildWorkspaceInitSummaryIndex({
    workspaceRoot,
    summaryPath,
    currentSummary: summary,
    currentSummaryRelativePath: platformRelativePath,
  });
  writeJsonFileAtomic(summaryPath, indexSummary);
  return {
    ok: true,
    paths: [
      toWorkspaceRelativePath(summaryPath, workspaceRoot),
      platformRelativePath,
    ],
    index_summary: indexSummary,
  };
}

function workspaceInitSummaryFileName(platform) {
  const safePlatform = SUPPORTED_HOST_IDS.has(platform) ? platform : 'unknown';
  return `init-summary-${safePlatform}.json`;
}

function buildWorkspaceInitSummaryIndex({
  workspaceRoot,
  summaryPath,
  currentSummary,
  currentSummaryRelativePath,
}) {
  const existing = readWorkspaceInitSummaryIndex(summaryPath, workspaceRoot);
  const platforms = {
    ...(existing.platforms || {}),
    [currentSummary.platform]: buildWorkspaceInitPlatformEntry(currentSummary, currentSummaryRelativePath),
  };
  const entries = Object.values(platforms).sort((left, right) => (
    String(left.platform || '').localeCompare(String(right.platform || ''))
  ));
  const readyCount = entries.filter((entry) => entry.overall_status === 'ready').length;
  const actionRequiredCount = entries.length - readyCount;
  const childTotal = entries.reduce((total, entry) => total + entry.counts.total, 0);
  const childReady = entries.reduce((total, entry) => total + entry.counts.ready, 0);
  const childActionRequired = entries.reduce((total, entry) => total + entry.counts.action_required, 0);
  const parentRuntimeReady = entries.reduce((total, entry) => total + entry.counts.parent_runtime_ready, 0);
  const parentRuntimeActionRequired = entries.reduce((total, entry) => total + entry.counts.parent_runtime_action_required, 0);
  const runtimeUntrackTotal = entries.reduce((total, entry) => total + entry.counts.runtime_untrack_total, 0);

  return {
    schema_version: 'workspace-init-summary-index.v1',
    generated_at: new Date().toISOString(),
    advisory: true,
    workflow_mode: 'all-repos',
    selection_source: currentSummary.selection_source,
    workspace_root: workspaceRoot,
    parent_writes_repo_local_artifacts: false,
    parent_writes_host_runtime_assets: true,
    platforms: entries.reduce((memo, entry) => {
      memo[entry.platform] = entry;
      return memo;
    }, {}),
    user_language_sync: currentSummary.user_language_sync || null,
    counts: {
      platform_total: entries.length,
      platform_ready: readyCount,
      platform_action_required: actionRequiredCount,
      total: childTotal,
      ready: childReady,
      action_required: childActionRequired,
      parent_runtime_ready: parentRuntimeReady,
      parent_runtime_action_required: parentRuntimeActionRequired,
      runtime_untrack_total: runtimeUntrackTotal,
    },
    overall_status: actionRequiredCount === 0
      ? 'ready'
      : readyCount > 0
        ? 'partial'
        : 'action-required',
    reason_code: actionRequiredCount === 0 ? null : 'all-repos-partial-or-action-required',
    next_action: actionRequiredCount === 0
      ? 'Parent host runtime and all child repos completed init for all selected platforms.'
      : 'Inspect per-platform reason_code and rerun init for action-required platforms.',
  };
}

function readWorkspaceInitSummaryIndex(summaryPath, workspaceRoot) {
  if (!fs.existsSync(summaryPath)) {
    return { platforms: {} };
  }
  try {
    const payload = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    if (payload && payload.schema_version === 'workspace-init-summary-index.v1' && payload.platforms && typeof payload.platforms === 'object') {
      return { platforms: payload.platforms };
    }
    if (payload && payload.schema_version === 'workspace-init-summary.v1' && payload.platform) {
      return {
        platforms: {
          [payload.platform]: buildWorkspaceInitPlatformEntry(
            payload,
            toWorkspaceRelativePath(summaryPath, workspaceRoot),
          ),
        },
      };
    }
  } catch (_error) {
    return { platforms: {} };
  }
  return { platforms: {} };
}

function buildWorkspaceInitPlatformEntry(summary, summaryRelativePath) {
  const counts = summary.counts || {};
  return {
    platform: summary.platform,
    path: summaryRelativePath,
    generated_at: summary.generated_at,
    overall_status: summary.overall_status,
    reason_code: summary.reason_code,
    user_language_sync: summary.user_language_sync || null,
    counts: {
      total: numberOrZero(counts.total),
      ready: numberOrZero(counts.ready),
      action_required: numberOrZero(counts.action_required),
      parent_runtime_ready: numberOrZero(counts.parent_runtime_ready),
      parent_runtime_action_required: numberOrZero(counts.parent_runtime_action_required),
      runtime_untrack_total: numberOrZero(counts.runtime_untrack_total),
    },
  };
}

function numberOrZero(value) {
  return Number.isFinite(value) ? value : 0;
}

function buildErroredProjectInitPlan({
  projectRoot,
  platform,
  adapter,
  dryRun = false,
  gitRootTopology = 'single-repo',
  errors = [],
  diagnostics = [],
}) {
  const emptyPlan = mergeOperationPlans();
  return {
    schema_version: 'spec-first-init-plan.v1',
    mode: 'single-repo',
    projectRoot,
    platform,
    gitRootTopology,
    dryRun: Boolean(dryRun),
    adapterId: adapter.id,
    commandDir: adapter.hasCommands ? path.join(projectRoot, adapter.commandRoot) : '',
    developer: null,
    previousState: null,
    previewState: null,
    destructiveResetPlan: null,
    destructiveResetReason: '',
    legacyStateDetected: false,
    preSyncPlan: emptyPlan,
    writePlan: emptyPlan,
    operationPlan: emptyPlan,
    untrackDiagnostic: buildRuntimeUntrackSummary(),
    syncedAssets: {
      commands: [],
      skills: [],
      workflowSkills: [],
      internalSkills: [],
      agents: [],
      agentSupportFiles: [],
    },
    changelogCreated: false,
    diagnostics,
    errors,
    summary: emptyPlan.summary,
  };
}

function normalizeInitPlatform(platform) {
  if (SUPPORTED_HOST_IDS.has(platform)) {
    return platform;
  }
  throw new Error(`Unknown init platform: ${platform || ''}`);
}

function initPlatformLabel(platform) {
  const choice = INIT_PLATFORM_CHOICES.find((entry) => entry.id === platform);
  return choice ? choice.label : platform;
}

function printInitDiagnostics(plan) {
  const diagnostics = collectInitDiagnostics(plan);
  for (const diagnostic of diagnostics) {
    const message = diagnostic && diagnostic.message ? diagnostic.message : String(diagnostic);
    if (diagnostic.level === 'warn') {
      console.warn(message);
    } else {
      console.log(message);
    }
  }
}

function collectInitDiagnostics(plan) {
  if (!plan || typeof plan !== 'object') {
    return [];
  }
  if (plan.mode === 'all-repos') {
    return [
      ...(plan.parentPlan ? collectInitDiagnostics(plan.parentPlan) : []),
      ...(Array.isArray(plan.childPlans)
        ? plan.childPlans.flatMap((entry) => collectInitDiagnostics(entry.plan))
        : []),
    ];
  }
  return Array.isArray(plan.diagnostics) ? plan.diagnostics : [];
}

function collectInitErrors(plan) {
  if (!plan || typeof plan !== 'object') {
    return [];
  }
  if (plan.mode === 'all-repos') {
    return [
      ...(plan.parentPlan ? collectInitErrors(plan.parentPlan) : []),
      ...(Array.isArray(plan.childPlans)
        ? plan.childPlans.flatMap((entry) => collectInitErrors(entry.plan))
        : []),
    ];
  }
  return Array.isArray(plan.errors) ? plan.errors : [];
}

function collectPlanErrorMessages(plan) {
  return (Array.isArray(plan.errors) ? plan.errors : [])
    .map((error) => error.message || String(error))
    .filter(Boolean)
    .join('\n');
}

function hostDisplayName(platform) {
  if (platform === 'claude') return 'Claude Code';
  if (platform === 'codex') return 'Codex';
  if (platform === 'kiro') return 'Kiro';
  return platform;
}

function hostEntrypointLabel(platform) {
  if (platform === 'claude') return '/spec:* commands';
  if (platform === 'codex') return '$spec-* skills';
  if (platform === 'kiro') return 'Kiro Agent Skills';
  return 'host workflow entrypoints';
}

function hostMcpSetupCommand(platform) {
  if (platform === 'claude') return '/spec:mcp-setup';
  if (platform === 'codex') return '$spec-mcp-setup';
  if (platform === 'kiro') return 'Kiro Agent Skill `spec-mcp-setup`';
  return 'the host MCP setup workflow';
}

function printInitNextSteps(platform, lang = 'zh') {
  const hostDisplay = hostDisplayName(platform);
  const entryKind = hostEntrypointLabel(platform);
  const mcpSetupCommand = hostMcpSetupCommand(platform);

  if (lang === 'en') {
    console.log('Setup complete. Next steps:');
    console.log(`  1. Restart ${hostDisplay} or open a new session so it loads the generated ${entryKind}.`);
    console.log(`  2. Start with the matching ${entryKind} for lightweight docs, small fixes, first trials, plan, work, review, or debug.`);
    console.log(`  3. For stronger readiness, run ${mcpSetupCommand} to install and verify the required MCP/helper runtime.`);
    console.log('  4. Then choose the workflow by user intent. Project guidance comes from AGENTS.md, CLAUDE.md, docs/contracts, direct source evidence, tests, and logs.');
    return;
  }

  console.log('初始化完成。下一步:');
  console.log(`  1. 重启 ${hostDisplay} 或新开会话，让宿主加载刚生成的 ${entryKind}。`);
  console.log(`  2. docs、小修复、首次试用、plan、work、review 或 debug，可直接启动匹配的 ${entryKind}。`);
  console.log(`  3. 需要更完整的 readiness 时，运行 ${mcpSetupCommand} 安装并验证必装 MCP/helper runtime。`);
  console.log('  4. 然后按用户意图选择 workflow；项目指导来自 AGENTS.md、CLAUDE.md、docs/contracts、直接源码证据、测试和日志。');
}

function printInitNextStepsForPlatforms(platforms, lang = 'zh') {
  const uniquePlatforms = [...new Set(platforms)];
  if (uniquePlatforms.length === 1) {
    printInitNextSteps(uniquePlatforms[0], lang);
    return;
  }

  if (lang === 'en') {
    console.log('Setup complete. Next steps:');
    console.log(`  1. Restart ${uniquePlatforms.map(hostDisplayName).join(', ')} or open new sessions so each host loads the generated entrypoints.`);
    console.log('  2. Use the host-specific workflow entrypoints (/spec:* commands, $spec-* skills, or Kiro Agent Skills) for lightweight docs, small fixes, first trials, plan, work, review, or debug.');
    console.log('  3. For stronger readiness, run the matching MCP setup workflow in the host you plan to use.');
    console.log('  4. Then choose the workflow by user intent: brainstorm/plan/work/review/debug.');
    return;
  }

  console.log('初始化完成。下一步:');
  console.log(`  1. 重启 ${uniquePlatforms.map(hostDisplayName).join('、')} 或分别新开会话，让宿主加载刚生成的入口。`);
  console.log('  2. docs、小修复、首次试用、plan、work、review 或 debug，可在对应宿主启动 /spec:* command、$spec-* skill 或 Kiro Agent Skill。');
  console.log('  3. 需要更完整的 readiness 时，在计划使用的宿主里运行匹配的 MCP setup workflow。');
  console.log('  4. 然后按用户意图进入 brainstorm/plan/work/review/debug 等 workflow。');
}

function printHelp() {
  console.log([
    '🚀 spec-first init',
    '',
    '📘 Usage:',
    '  spec-first init [--claude] [--codex] [--kiro] [-y] [--all-repos|--repo <path>] [-u <name>] [--lang <zh|en>] [--sync-user-language|--no-sync-user-language]',
    '',
    'Host selection:',
    '  spec-first init                         Select one or more host runtimes interactively',
    '  spec-first init --codex                 Initialize only Codex after the remaining prompts',
    '  spec-first init --kiro                  Initialize only Kiro after the remaining prompts',
    '  spec-first init --claude --codex --kiro Initialize all supported hosts',
    '  spec-first init -y                      Skip prompts and initialize default hosts (Claude Code + Codex; Kiro requires explicit --kiro)',
    '  spec-first init --kiro -y -u <name> --lang zh',
    '',
    'Interactive steps:',
    '  1. Select Claude Code, Codex, and/or Kiro',
    '  2. Confirm developer name (reuse the existing global profile when present)',
    '  3. Choose response language',
    '  4. Choose workspace target when child Git repos are detected',
    '  5. Preview write/reset operations',
    '  6. Confirm or cancel',
    '',
    'Workspace targeting:',
    '  In a parent workspace with child Git repos, init asks whether to initialize all child repos or one selected child.',
    '  spec-first init --all-repos -y     Initialize every child Git repo from a parent workspace.',
    '  spec-first init --repo <path> -y   Initialize one child repo from a parent workspace.',
    '  Parent workspace runs write only parent advisory summary assets; child repo truth stays in each child repo.',
    '',
    'Non-interactive usage:',
    '  Use -y/--yes to skip prompts. Without -y, init requires an interactive terminal and exits 2 in CI/non-TTY environments.',
    '  Explicit --claude/--codex/--kiro flags override the default host set.',
    '  Use --dry-run to preview writes without changing runtime assets.',
    '  Use --sync-user-language to opt in to user-level language sync; use --no-sync-user-language to disable it and remove spec-first user-language blocks from supported hosts.',
    '',
    '➡️ After successful init:',
    '  Claude: restart Claude Code. For lightweight work, start the matching /spec:* workflow; for enhanced readiness, run /spec:mcp-setup, then route by user intent.',
    '  Codex: restart Codex. For lightweight work, start the matching $spec-* workflow; for enhanced readiness, run $spec-mcp-setup, then route by user intent.',
    '  Kiro: restart Kiro. For lightweight work, invoke the generated Kiro Agent Skill; for enhanced readiness, run the generated spec-mcp-setup Agent Skill, then route by user intent.',
    '',
    '🔗 Repository:',
    '  https://github.com/sunrain520/spec-first',
  ].join('\n'));
}

function discoverChildGitRepos(workspaceRoot, maxDepth = 3) {
  const normalizedWorkspaceRoot = canonicalizeExistingPath(workspaceRoot);
  const candidates = [];
  const queue = [{ dir: normalizedWorkspaceRoot, depth: 0 }];
  const skipNames = new Set([
    '.agents',
    '.cache',
    '.claude',
    '.codex',
    '.kiro',
    '.direnv',
    '.git',
    '.spec-first',
    '.venv',
    '.worktrees',
    'coverage',
    'dist',
    'node_modules',
    'temp',
    'tmp',
    'vendor',
  ]);

  while (queue.length > 0) {
    const current = queue.shift();
    let entries = [];
    try {
      entries = fs.readdirSync(current.dir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .sort((left, right) => left.name.localeCompare(right.name));
    } catch (_error) {
      continue;
    }

    for (const entry of entries) {
      if (skipNames.has(entry.name)) continue;
      const childPath = path.join(current.dir, entry.name);
      if (hasGitMarker(childPath)) {
        addChildRepoCandidate(candidates, childPath, normalizedWorkspaceRoot);
        continue;
      }
      if (current.depth < maxDepth) {
        queue.push({ dir: childPath, depth: current.depth + 1 });
      }
    }
  }

  return candidates.sort((left, right) =>
    left.workspace_relative_path.localeCompare(right.workspace_relative_path)
  );
}

function addChildRepoCandidate(candidates, candidateRoot, workspaceRoot) {
  const gitRoot = canonicalizeExistingPath(candidateRoot);
  if (!isPathWithin(gitRoot, workspaceRoot)) return;
  if (candidates.some((candidate) => (
    gitRoot === candidate.git_root || isPathWithin(gitRoot, candidate.git_root)
  ))) {
    return;
  }

  const workspaceRelativePath = toWorkspaceRelativePath(gitRoot, workspaceRoot);
  candidates.push({
    repo_label: workspaceRelativePath,
    git_root: gitRoot,
    workspace_relative_path: workspaceRelativePath,
    relationship: 'child_git_repo',
  });
}

function findGitRoot(startPath) {
  let current = canonicalizeExistingPath(startPath);
  try {
    const stat = fs.statSync(current);
    if (!stat.isDirectory()) {
      current = path.dirname(current);
    }
  } catch (_error) {
    return '';
  }

  while (true) {
    if (hasGitMarker(current)) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return '';
    }
    current = parent;
  }
}

function hasGitMarker(dirPath) {
  return fs.existsSync(path.join(dirPath, '.git'));
}

function canonicalizeExistingPath(targetPath) {
  const resolved = path.resolve(targetPath);
  try {
    return fs.realpathSync.native(resolved);
  } catch (_error) {
    return resolved;
  }
}

function isPathWithin(childPath, parentPath) {
  const relative = path.relative(parentPath, childPath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function toWorkspaceRelativePath(childPath, workspaceRoot) {
  const relative = path.relative(workspaceRoot, childPath);
  return relative === '' ? '.' : relative.split(path.sep).join('/');
}

function writeJsonFileAtomic(filePath, payload) {
  // 复用共享 atomic-write(带 crypto 随机临时后缀与失败清理),不再内联弱版实现。
  writeFileAtomic(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

function validateContainedWorkspaceWritePath(workspaceRoot, filePath) {
  const rootReal = fs.realpathSync.native(path.resolve(workspaceRoot));
  const nearest = nearestExistingPath(filePath);
  const nearestReal = fs.realpathSync.native(nearest);
  if (!isPathWithin(nearestReal, rootReal)) {
    return {
      ok: false,
      reason_code: 'workspace-summary-symlink-escape',
    };
  }
  return { ok: true, reason_code: null };
}

function nearestExistingPath(targetPath) {
  let current = path.resolve(targetPath);
  while (true) {
    if (fs.existsSync(current)) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return current;
    }
    current = parent;
  }
}

function tryReadRawManagedState(projectRoot, adapter) {
  try {
    return readStateFileRaw(projectRoot, adapter);
  } catch (_error) {
    return null;
  }
}

function inspectCurrentRuntimeDrift(projectRoot, adapter) {
  const reasons = [];
  const installedAssets = inspectInstalledAssets(projectRoot, adapter);
  for (const key of ['commands', 'skills', 'agents', 'agentSupportFiles']) {
    const status = installedAssets[key] || {};
    if (Array.isArray(status.missing) && status.missing.length > 0) {
      reasons.push(`${key}_missing`);
    }
    if (Array.isArray(status.drifted) && status.drifted.length > 0) {
      reasons.push(`${key}_drifted`);
    }
  }

  const bootstrapStatus = inspectInstructionBootstrap(projectRoot, adapter);
  if (bootstrapStatus.status !== 'installed') {
    reasons.push(`bootstrap_${bootstrapStatus.status}`);
  }

  for (const check of adapter.inspectRuntimeFiles(projectRoot)) {
    if (check.level !== 'PASS') {
      reasons.push(`runtime_file_${String(check.name || 'unknown').replace(/[^a-z0-9]+/gi, '_').toLowerCase()}`);
    }
  }

  if (adapter.id === 'claude') {
    for (const settingsStatus of inspectManagedClaudeHooks(projectRoot)) {
      if (settingsStatus.status !== 'installed') {
        const eventName = String(settingsStatus.eventName || 'unknown')
          .replace(/[^a-z0-9]+/gi, '_')
          .toLowerCase();
        reasons.push(`claude_settings_${eventName}_${settingsStatus.status}`);
      }
    }
  }

  return {
    detected: reasons.length > 0,
    reasons: [...new Set(reasons)],
  };
}

function createRuntimeRollbackBackup({ projectRoot, plans = [] } = {}) {
  const pathKinds = new Map();

  for (const plan of plans) {
    if (!plan || !Array.isArray(plan.operations)) continue;
    for (const operation of plan.operations) {
      if (!operation || !operation.path) continue;
      if (!['remove_file', 'remove_dir', 'prune_command', 'write_file', 'update_file'].includes(operation.kind)) {
        continue;
      }

      const kinds = pathKinds.get(operation.path) || new Set();
      kinds.add(operation.kind);
      pathKinds.set(operation.path, kinds);
    }
  }

  const orderedPaths = [...pathKinds.keys()]
    .sort((left, right) => left.length - right.length || left.localeCompare(right));
  const selectedEntries = [];

  for (const relativePath of orderedPaths) {
    const kinds = pathKinds.get(relativePath);
    const absolutePath = path.join(projectRoot, relativePath);
    const stats = fs.existsSync(absolutePath) ? fs.lstatSync(absolutePath) : null;
    const isDirectory = kinds.has('remove_dir') || Boolean(stats && stats.isDirectory());

    if (selectedEntries.some((entry) => entry.isDirectory && isNestedPath(relativePath, entry.relativePath))) {
      continue;
    }

    selectedEntries.push({
      relativePath,
      absolutePath,
      isDirectory,
      existed: Boolean(stats),
      mode: stats ? (stats.mode & 0o777) : null,
    });
  }

  if (selectedEntries.length === 0) {
    return null;
  }

  const backupRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-init-backup-'));
  for (const entry of selectedEntries) {
    if (!entry.existed) continue;
    const backupPath = path.join(backupRoot, entry.relativePath);
    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    fs.cpSync(entry.absolutePath, backupPath, { recursive: entry.isDirectory });
  }

  return {
    backupRoot,
    entries: selectedEntries.map((entry) => ({
      relativePath: entry.relativePath,
      isDirectory: entry.isDirectory,
      existed: entry.existed,
      mode: entry.mode,
    })),
  };
}

function restoreRuntimeRollbackBackup(projectRoot, backup) {
  if (!backup || !backup.backupRoot || !Array.isArray(backup.entries)) {
    return false;
  }

  const restoreEntries = [...backup.entries]
    .sort((left, right) => right.relativePath.length - left.relativePath.length || right.relativePath.localeCompare(left.relativePath));

  for (const entry of restoreEntries) {
    const targetPath = path.join(projectRoot, entry.relativePath);
    fs.rmSync(targetPath, { recursive: true, force: true });
    if (!entry.existed) continue;

    const backupPath = path.join(backup.backupRoot, entry.relativePath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.cpSync(backupPath, targetPath, { recursive: entry.isDirectory });
    if (typeof entry.mode === 'number' && !entry.isDirectory) {
      fs.chmodSync(targetPath, entry.mode);
    }
  }

  return true;
}

function removeRuntimeRollbackBackup(backup) {
  if (!backup || !backup.backupRoot || !fs.existsSync(backup.backupRoot)) {
    return false;
  }

  fs.rmSync(backup.backupRoot, { recursive: true, force: true });
  return true;
}

function isNestedPath(childPath, parentPath) {
  return childPath === parentPath || childPath.startsWith(`${parentPath}/`);
}

function buildLegacyHardResetState({
  adapter,
  rawManagedState,
  runtimeCommands,
  bundledSkillNames,
  commandSkillNames,
  bundledAgentPaths,
  bundledAgentSupportFiles,
}) {
  const rawState = rawManagedState && typeof rawManagedState === 'object' ? rawManagedState : {};
  const legacyTrackedSkills = mergeStringArrays(rawState.skills, rawState.workflowSkills);

  return {
    commands: mergeStringArrays(
      rawState.commands,
      runtimeCommands.map((command) => command.filename),
    ),
    skills: adapter.workflowsRoot === adapter.skillsRoot
      ? mergeStringArrays(bundledSkillNames, legacyTrackedSkills)
      : mergeStringArrays(bundledSkillNames, rawState.skills),
    workflowSkills: adapter.workflowsRoot === adapter.skillsRoot
      ? []
      : mergeStringArrays(commandSkillNames, rawState.workflowSkills),
    agents: mergeStringArrays(rawState.agents, bundledAgentPaths),
    agentSupportFiles: mergeStringArrays(rawState.agentSupportFiles, bundledAgentSupportFiles),
  };
}

function mergeStringArrays(...values) {
  return [...new Set(values.flatMap((value) => (
    Array.isArray(value)
      ? value.filter((entry) => typeof entry === 'string' && entry.length > 0)
      : []
  )))].sort((a, b) => a.localeCompare(b));
}

const LEGACY_PROJECT_DEVELOPER_PATHS = [
  '.claude/spec-first/.developer',
  '.codex/spec-first/.developer',
];

function planLegacyDeveloperProfileCleanup(projectRoot) {
  const operations = [];
  for (const relativePath of LEGACY_PROJECT_DEVELOPER_PATHS) {
    const absolutePath = path.join(projectRoot, relativePath);
    if (fs.existsSync(absolutePath)) {
      operations.push({
        kind: 'remove_file',
        path: relativePath,
        reason: 'legacy_project_developer_profile',
      });
    }
  }
  return {
    operations,
    summary: summarizeOperationPlan(operations),
  };
}

function readLegacyProjectDeveloperFiles(projectRoot) {
  const records = [];
  for (const relativePath of LEGACY_PROJECT_DEVELOPER_PATHS) {
    const absolutePath = path.join(projectRoot, relativePath);
    const developer = readDeveloperFile(absolutePath);
    if (developer && developer.name) {
      records.push({ relativePath, developer });
    }
  }
  return records;
}

function resolveGlobalDeveloperWriteAction(developer, options = {}) {
  const globalPath = getGlobalDeveloperPath();
  const existing = readDeveloperFile(globalPath);
  if (!existing || !existing.name) {
    return {
      action: 'create',
      developer: preserveSyncUserLanguage(developer, existing),
      globalPath: normalizeOperationPathLike(GLOBAL_DEVELOPER_RELATIVE_DISPLAY),
    };
  }
  // 空列表视为"本次未表达 host 选择",不应抹掉既有记录(例如 dryRun、
  // 异常路径或编程式调用未传 platforms);此时沿用既有 hosts。
  const nextHosts = Array.isArray(developer.hosts) ? developer.hosts : [];
  const effectiveHosts = nextHosts.length > 0 ? nextHosts : existing.hosts;
  if (options.confirmedOverwrite || options.explicitName || options.explicitLang) {
    // profile 已存在(上方已排除 create),initialized_at 语义是"首次初始化时间",
    // re-install 改名/改语言不应刷新它;与下方 host-change 分支保持一致,只刷新
    // name/lang/version 与 hosts,保留既有 initialized_at。
    return {
      action: 'overwrite',
      developer: preserveSyncUserLanguage(
        { ...developer, initializedAt: existing.initializedAt, hosts: effectiveHosts },
        existing,
      ),
      globalPath: normalizeOperationPathLike(GLOBAL_DEVELOPER_RELATIVE_DISPLAY),
    };
  }
  // name/lang 未变是最常见的重装路径。此处若 host 选择变化仍需落盘,
  // 否则用户改动的 host 选择会被静默丢弃。仅更新 hosts,保留既有
  // name/lang/initialized_at/version,避免无谓抖动。
  // 此处用 nextHosts 而非 effectiveHosts:仅当本次有实际勾选才覆写,
  // 空选择走下方 preserve,不应借 fallback 误触发覆写。
  if (nextHosts.length > 0 && !sameHosts(existing.hosts, nextHosts)) {
    return {
      action: 'overwrite',
      developer: { ...existing, hosts: nextHosts },
      globalPath: normalizeOperationPathLike(GLOBAL_DEVELOPER_RELATIVE_DISPLAY),
    };
  }
  return {
    action: 'preserve',
    developer: existing,
    globalPath: normalizeOperationPathLike(GLOBAL_DEVELOPER_RELATIVE_DISPLAY),
  };
}

function preserveSyncUserLanguage(developer, existing) {
  if (
    existing &&
    typeof existing.syncUserLanguage === 'boolean' &&
    (!developer || typeof developer.syncUserLanguage !== 'boolean')
  ) {
    return {
      ...(developer || {}),
      syncUserLanguage: existing.syncUserLanguage,
    };
  }
  return developer;
}

// 比较两个 host 集合是否相同。内部各自排序,不依赖调用方传入已排序数组,
// 使比较对输入顺序鲁棒(集合语义,而非序列语义)。
function sameHosts(left, right) {
  const a = (Array.isArray(left) ? [...left] : []).sort((x, y) => x.localeCompare(y));
  const b = (Array.isArray(right) ? [...right] : []).sort((x, y) => x.localeCompare(y));
  if (a.length !== b.length) {
    return false;
  }
  return a.every((value, index) => value === b[index]);
}

function normalizeOperationPathLike(value) {
  return String(value || '').replace(/\\/g, '/');
}

const GLOBAL_DEVELOPER_RELATIVE_DISPLAY = path.join('~', '.spec-first', '.developer');

function findDuplicateClaudeAgentNames(agentPaths) {
  const seen = new Set();
  const duplicates = new Set();

  for (const agentPath of agentPaths) {
    const bareName = path.basename(agentPath, '.md');
    if (seen.has(bareName)) {
      duplicates.add(bareName);
      continue;
    }
    seen.add(bareName);
  }

  return [...duplicates].sort();
}

function buildInitWritePlan({
  projectRoot,
  adapter,
  developer,
  nextState,
  platform,
  assetPlan,
  runtimePlan,
  gitRootTopology = 'single-repo',
}) {
  const untrackPlan = buildInitUntrackPlan(projectRoot);
  const plan = mergeOperationPlans(
    assetPlan,
    runtimePlan || buildInitRuntimePreviewPlan(projectRoot, adapter),
    buildInitGitignorePlan(projectRoot),
    buildInitMetadataPlan({ projectRoot, adapter, developer, nextState, platform, gitRootTopology }),
    untrackPlan.plan,
  );
  return {
    plan,
    untrackDiagnostic: untrackPlan.diagnostic,
  };
}

function buildInitRuntimePreviewPlan(projectRoot, adapter) {
  return adapter.planRuntimeFilesSync(projectRoot);
}

function buildInitGitignorePlan(projectRoot) {
  const gitignorePath = path.join(projectRoot, '.gitignore');
  const existingGitignore = fs.existsSync(gitignorePath)
    ? fs.readFileSync(gitignorePath, 'utf8')
    : '';
  const gitignoreResult = applySpecFirstGitignoreBlock(existingGitignore);

  if (gitignoreResult.status === 'already-current') {
    return {
      operations: [],
      summary: summarizeOperationPlan([]),
    };
  }

  const operation = buildFileWriteOperation(
    projectRoot,
    gitignorePath,
    gitignoreResult.content,
    'managed_gitignore_policy',
  );
  operation.gitignoreStatus = gitignoreResult.status;

  return {
    operations: [operation],
    summary: summarizeOperationPlan([operation]),
  };
}

function buildInitUntrackPlan(projectRoot) {
  const diagnostic = planRuntimeUntrack({ projectRoot });
  const plan = {
    operations: diagnostic.operations,
    summary: summarizeOperationPlan(diagnostic.operations),
  };
  return {
    plan,
    diagnostic: {
      count: diagnostic.count,
      reason_code: diagnostic.reason_code,
      sample_paths: diagnostic.sample_paths,
      diagnostic: diagnostic.diagnostic,
    },
  };
}

function buildInitMetadataPlan({
  projectRoot,
  adapter,
  developer,
  nextState,
  platform,
  gitRootTopology = 'single-repo',
}) {
  const operations = [];
  const instructionPath = path.join(projectRoot, adapter.instructionFile);
  const existingInstruction = fs.existsSync(instructionPath)
    ? fs.readFileSync(instructionPath, 'utf8')
    : '';
  const instructionWithoutLegacyRuntimeTools = removeManagedRuntimeToolsBlock(existingInstruction);
  const instructionWithoutLegacyCodingGuidelines = removeManagedCodingGuidelinesBlock(
    instructionWithoutLegacyRuntimeTools,
  );
  const instructionWithLang = applyManagedBlock(
    instructionWithoutLegacyCodingGuidelines,
    buildManagedBlock(developer.lang),
  );
  const instructionWithBootstrap = applyManagedBootstrapBlock(
    instructionWithLang,
    buildBootstrapBlock(adapter, developer.lang),
  );
  operations.push(buildPlanFileOperation(
    projectRoot,
    adapter.instructionFile,
    instructionWithBootstrap,
    'managed_instruction_file',
  ));

  operations.push(buildPlanFileOperation(
    projectRoot,
    adapter.stateFile,
    `${JSON.stringify(nextState, null, 2)}\n`,
    'managed_state_file',
  ));

  const changelogPath = path.join(projectRoot, 'CHANGELOG.md');
  if (!fs.existsSync(changelogPath)) {
    const changelogAuthor = resolveChangelogAuthor(projectRoot, {
      platform,
    });
    operations.push(buildPlanFileOperation(
      projectRoot,
      'CHANGELOG.md',
      buildInitialChangelog(formatChangelogTimestamp(new Date()), changelogAuthor.name || developer.name, developer.version),
      'bootstrap_changelog',
    ));
  }

  if (platform === 'claude') {
    const rendered = renderManagedClaudeHooksUpsert(projectRoot);
    operations.push(buildPlanFileOperation(
      projectRoot,
      path.relative(projectRoot, getClaudeSettingsPath(projectRoot)),
      rendered.contents,
      'managed_claude_hook_matchers',
    ));
  }

  return {
    operations,
    summary: summarizeOperationPlan(operations),
  };
}

function buildPlanFileOperation(projectRoot, relativePath, contents, reason) {
  const absolutePath = path.join(projectRoot, relativePath);
  return buildFileWriteOperation(projectRoot, absolutePath, contents, reason);
}

function printInitDryRun({
  platform,
  plan,
  untrackDiagnostic,
  legacyStateDetected,
  destructiveResetReason = '',
  maxEntries = Infinity,
  showPathSamples = true,
  lang = 'en',
  useColor = false,
}) {
  const messages = getInitMessages(lang);
  console.log(messages.previewDryRunHeader(platform));
  if (legacyStateDetected) {
    console.log(messages.previewHardResetLegacy);
    console.log(messages.previewDestructiveReset);
  } else if (destructiveResetReason === 'current_runtime_drift') {
    console.log(messages.previewHardResetDrift);
    console.log(messages.previewDestructiveReset);
  }

  const pruneCount = plan.summary.prune_command || 0;
  const removeCount = (plan.summary.remove_file || 0) + (plan.summary.remove_dir || 0);
  const ensureCount = plan.summary.ensure_dir || 0;
  const writeCount = (plan.summary.write_file || 0) + (plan.summary.update_file || 0);

  console.log(messages.previewWouldRemove(formatPreviewCount(removeCount, BrandColors.remove, useColor)));
  if (pruneCount > 0) {
    console.log(messages.previewWouldPrune(
      formatPreviewCount(pruneCount, BrandColors.remove, useColor),
      previewListSuffix(showPathSamples, lang),
    ));
    if (showPathSamples) {
      printOperationPathSample(
        plan.operations.filter((entry) => entry.kind === 'prune_command'),
        maxEntries,
        { lang },
      );
    }
  }

  if (ensureCount > 0) {
    console.log(messages.previewWouldEnsureDir(
      formatPreviewCount(ensureCount, BrandColors.write, useColor),
      previewListSuffix(showPathSamples, lang),
    ));
    if (showPathSamples) {
      printOperationPathSample(
        plan.operations.filter((entry) => entry.kind === 'ensure_dir'),
        maxEntries,
        { lang },
      );
    }
  }

  if (writeCount > 0) {
    console.log(messages.previewWouldWrite(
      formatPreviewCount(writeCount, BrandColors.write, useColor),
      previewListSuffix(showPathSamples, lang),
    ));
    if (showPathSamples) {
      printOperationPathSample(
        plan.operations.filter((entry) => entry.kind === 'write_file' || entry.kind === 'update_file'),
        maxEntries,
        { lang },
      );
    }
  }
  printRuntimeUntrackDryRunSummary(untrackDiagnostic, { lang, useColor });
  console.log(messages.previewNoFilesChanged);
}

function formatPreviewCount(count, colorCode, useColor) {
  const text = String(count);
  return count > 0 ? colorize(text, colorCode, useColor) : text;
}

function previewListSuffix(showPathSamples, lang) {
  if (showPathSamples) {
    return ':';
  }
  return lang === 'zh' ? '。' : '.';
}

function printOperationPathSample(operations, maxEntries = Infinity, options = {}) {
  const messages = getInitMessages(options.lang || 'en');
  const limit = Number.isFinite(maxEntries) && maxEntries >= 0 ? Math.floor(maxEntries) : operations.length;
  for (const operation of operations.slice(0, limit)) {
    console.log(`  - ${operation.path}`);
  }
  const omitted = operations.length - Math.min(limit, operations.length);
  if (omitted > 0) {
    console.log(messages.previewOmittedPaths(omitted));
  }
}

function printRuntimeUntrackDryRunSummary(untrackDiagnostic = buildRuntimeUntrackSummary(), options = {}) {
  const lang = options.lang || 'en';
  const useColor = options.useColor === true;
  const messages = getInitMessages(lang);
  const summary = buildRuntimeUntrackSummary(untrackDiagnostic);
  if (summary.count > 0) {
    console.log(messages.previewWouldUntrack(formatPreviewCount(summary.count, BrandColors.untrack, useColor)));
    for (const samplePath of summary.sample_paths) {
      console.log(`  - ${samplePath}`);
    }
    return;
  }

  if (summary.reason_code === 'none-tracked') {
    console.log(messages.previewNoRuntimeUntrack);
    return;
  }

  console.log(messages.previewRuntimeUntrackCheck(summary.reason_code));
  if (summary.diagnostic) {
    console.log(messages.previewRuntimeUntrackDiagnostic(summary.diagnostic));
  }
}

function printRuntimeUntrackApplySummary(summary = buildRuntimeUntrackSummary(), messages = getInitMessages('zh')) {
  if (summary.count > 0) {
    console.log(messages.applyRuntimeUntracked(summary.count));
    return;
  }

  if (summary.reason_code === 'none-tracked') {
    console.log(messages.applyRuntimeUntrackNone);
    return;
  }

  console.log(messages.applyRuntimeUntrackSkipped(summary.reason_code));
}

function buildRuntimeUntrackSummary(untrackDiagnostic = {}, applyResult = null) {
  const plannedReason = untrackDiagnostic.reason_code || 'none-tracked';
  const applied = applyResult && applyResult.runtime_untrack ? applyResult.runtime_untrack : null;
  const count = applied && plannedReason === 'untracked-runtime'
    ? applied.applied_count
    : Number(untrackDiagnostic.count || 0);
  const reasonCode = applied && plannedReason === 'untracked-runtime'
    ? applied.reason_code
    : plannedReason;

  return {
    count,
    reason_code: reasonCode || 'none-tracked',
    sample_paths: Array.isArray(untrackDiagnostic.sample_paths) ? untrackDiagnostic.sample_paths : [],
    diagnostic: applied && applied.diagnostic ? applied.diagnostic : (untrackDiagnostic.diagnostic || ''),
  };
}

function buildProjectInitResult(exitCode, untrackDiagnostic = {}) {
  return {
    exit_code: exitCode,
    runtime_untrack: buildRuntimeUntrackSummary(untrackDiagnostic),
  };
}

function normalizeProjectInitResult(result) {
  if (typeof result === 'number') {
    return buildProjectInitResult(result);
  }
  if (result && typeof result === 'object') {
    return {
      exit_code: Number.isFinite(result.exit_code) ? result.exit_code : 1,
      runtime_untrack: buildRuntimeUntrackSummary(result.runtime_untrack),
    };
  }
  return buildProjectInitResult(1);
}

function getInitExitCode(result) {
  return normalizeProjectInitResult(result).exit_code;
}

module.exports = {
  applyInitPlan,
  buildInitPlan,
  buildInitWritePlan,
  discoverChildGitRepos,
  findGitRoot,
  printInitApplySuccess,
  printInitDryRun,
  printInitPreview,
  printWorkspaceInitApplySuccess,
  runInit,
};
