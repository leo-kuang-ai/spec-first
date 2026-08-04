
'use strict';

const pkg = require('../../../package.json');
const { getAdapter } = require('../adapters');
const {
  applyUserLanguageSyncPlan,
  buildUserLanguageSyncPlan,
} = require('../user-language-sync');
const {
  PromptCancelled,
  checkbox,
  confirm,
  requireTty,
  select,
  textInput,
} = require('../prompts');
const { detectColorSupport } = require('../brand');
const { getInitMessages } = require('../init-i18n');
const {
  defaultInitPlatforms,
  parseInitArgs,
} = require('./init-args');
const {
  buildNonInteractiveDeveloperIdentityError,
  collectInitInput,
  collectNonInteractiveExplicitTarget,
  resolveDeveloperDefaults,
  resolveNonInteractiveDeveloperDefaultsRoot,
  resolveUserLanguageSyncProjectRoot,
} = require('./init-input');
const {
  buildInitPlan,
  buildInitWritePlan,
} = require('./init-plan');
const {
  applyGlobalDeveloperProfileWrite,
  applyProjectInitPlan,
} = require('./init-apply');
const { resolveEffectiveGlobalDeveloperWrite } = require('./init-developer');
const {
  applyWorkspaceInitPlan,
  discoverChildGitRepos,
  findGitRoot,
  persistWorkspaceUserLanguageSyncSummaries,
} = require('./init-workspace');
const {
  collectInitErrors,
  printInitDiagnostics,
} = require('./init-diagnostics');
const {
  printHelp,
  printInitApplySummaries,
  printInitApplySuccess,
  printInitBrandBanner,
  printInitDryRun,
  printInitNextStepsForPlatforms,
  printInitPreview,
  printInitPreviews,
  printWorkspaceInitApplySuccess,
  resolveInitBannerRoot,
} = require('./init-output');

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
    console.error('Usage: spec-first init [--claude] [--codex] [--cursor] [--kiro] [--qoder] [--opencode] [-y] [--all-repos|--repo <path>] [-u <name>] [--lang <zh|en>] [--sync-user-language|--no-sync-user-language]');
    return 2;
  }

  if (!parsed.yes) {
    const tty = promptApi.requireTty();
    if (!tty.ok) {
      console.error('spec-first init requires an interactive terminal unless `-y/--yes` is used with defaults or explicit host flags.');
      console.error('spec-first init 需要交互式终端；如需跳过引导，请使用 `-y/--yes` 并按需指定 `--claude` / `--codex` / `--cursor` / `--kiro` / `--qoder` / `--opencode`。');
      return 2;
    }
  }

  if (parsed.yes && parsed.platforms.length === 0 && defaultInitPlatforms().length === 0) {
    console.error('spec-first init -y requires at least one default host runtime.');
    return 2;
  }

  const workspaceRoot = process.cwd();
  const explicitTarget = collectNonInteractiveExplicitTarget(workspaceRoot, parsed);
  if (explicitTarget && explicitTarget.error) {
    console.error(explicitTarget.error);
    return 2;
  }
  const defaultsRoot = resolveNonInteractiveDeveloperDefaultsRoot(workspaceRoot, parsed, explicitTarget);
  const defaults = resolveDeveloperDefaults(defaultsRoot);
  const defaultLang = parsed.lang || defaults.lang;
  const nonInteractiveIdentityError = buildNonInteractiveDeveloperIdentityError(parsed, defaults, defaultLang);
  if (nonInteractiveIdentityError) {
    console.error(nonInteractiveIdentityError);
    return 2;
  }
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
      explicitTarget,
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
    printInitDiagnostics(plans, { lang: interactiveInput.lang });
    const errors = plans.flatMap((plan) => collectInitErrors(plan));
    if (errors.length > 0) {
      for (const error of errors) {
        console.error(error.message || String(error));
      }
      return 1;
    }
    const effectiveGlobalDeveloperWrite = resolveEffectiveGlobalDeveloperWrite(plans);
    const previewOptions = {
      lang: interactiveInput.lang,
      useColor,
      userLanguageSyncPlan,
      effectiveGlobalDeveloperWrite,
    };

    if (parsed.dryRun) {
      printInitPreviews(plans, { ...previewOptions, view: 'detailed' });
      return 0;
    }

    if (!parsed.yes) {
      const activeMessages = getInitMessages(interactiveInput.lang);
      printInitPreviews(plans, { ...previewOptions, view: 'summary' });
      const confirmed = await promptApi.confirm(activeMessages.confirmApply, { default: true });
      if (!confirmed) {
        console.log(activeMessages.cancelled);
        return 0;
      }
    }

    const globalDeveloperWriteResult = applyGlobalDeveloperProfileWrite(
      effectiveGlobalDeveloperWrite,
    );
    const applyContext = {
      globalDeveloperWriteHandled: true,
      effectiveGlobalDeveloperWrite,
      globalDeveloperWriteResult,
    };
    const results = [];
    for (const plan of plans) {
      const result = applyInitPlan(
        plan.mode === 'all-repos' ? plan.workspaceRoot : plan.projectRoot,
        plan,
        applyContext,
      );
      results.push(result);
    }

    const userLanguageSyncResult = applyUserLanguageSyncPlan(userLanguageSyncPlan);
    const summaryUpdateFailures = persistWorkspaceUserLanguageSyncSummaries(plans, results, userLanguageSyncResult);
    printInitApplySummaries(plans, results, {
      lang: interactiveInput.lang,
      globalDeveloperWriteResult,
      userLanguageSyncResult,
    });
    for (const failure of summaryUpdateFailures) {
      console.error(`Error: could not update workspace init summary with user-language sync result (${failure.reason_code}).`);
    }

    const exitCode = results.some((result) => result.exit_code !== 0)
      || userLanguageSyncResult.exit_code !== 0
      || summaryUpdateFailures.length > 0
      ? 1
      : 0;

    const childProjectionPending = plans.some((plan) => (
      plan.mode !== 'all-repos' && plan.gitRootTopology === 'multi-repo-workspace'
    ));
    if (
      exitCode === 0
      && !childProjectionPending
      && (plans.length > 1 || plans[0].mode !== 'all-repos')
    ) {
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

function buildInitPlans(input) {
  return input.platforms.map((platform) => buildInitPlan({
    ...input,
    platformCount: input.platforms.length,
    platform,
    adapter: getAdapter(platform),
  }));
}

function applyInitPlan(projectRoot, plan, context = {}) {
  if (!plan || typeof plan !== 'object') {
    throw new Error('applyInitPlan requires an init plan object.');
  }

  if (plan.mode === 'all-repos') {
    return applyWorkspaceInitPlan(projectRoot || plan.workspaceRoot, plan, context);
  }

  return applyProjectInitPlan(projectRoot || plan.projectRoot, plan, context);
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
