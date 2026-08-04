const fs = require('node:fs');
const path = require('node:path');
const { writeFileAtomic } = require('./atomic-write');

const SETTINGS_RELATIVE_PATH = '.claude/settings.json';
const SESSION_START_MATCHER = 'startup|resume|clear|compact';
const SPEC_PLAN_COMMAND_NAME = 'spec-plan';

// Managed Claude hooks use exec form (command + args) instead of a bash shell command
// string. Claude Code runs shell form through Git Bash on Windows and falls back to
// PowerShell when Git Bash is absent — a bash-only string like
// `"$CLAUDE_PROJECT_DIR"/.claude/hooks/session-start` then fails (PowerShell reads
// `$CLAUDE_PROJECT_DIR` as an undefined variable and cannot execute an extensionless
// bash script). Exec form spawns `node` directly with no shell on any platform, so the
// managed hooks work on macOS, Linux, and Windows with or without Git Bash. The hook files
// are Node scripts (see templates/claude/hooks/*).
//
// The hook path in args is an ABSOLUTE path baked in at generation time
// (`path.join(projectRoot, '.claude/hooks/xxx')`), NOT a bare relative path and NOT
// `$CLAUDE_PROJECT_DIR/.claude/hooks/xxx`. In exec form there is no shell, and Claude Code
// does NOT variable-expand `$CLAUDE_PROJECT_DIR` inside args — only dedicated path
// placeholders like `$CLAUDE_PLUGIN_ROOT` are substituted, so a literal `$CLAUDE_PROJECT_DIR`
// token would reach node verbatim. A bare relative `.claude/hooks/xxx` previously assumed
// Claude Code always spawns the hook with cwd set to the project root; that assumption broke
// when Claude Code is launched from a subdirectory of the project (cwd becomes the launch
// directory, not the git root), which node then resolves the relative arg against ->
// MODULE_NOT_FOUND. An absolute path needs no cwd assumption and no shell expansion, so it
// resolves the same way regardless of where Claude Code was launched from. Each hook still
// reads its own project dir from `CLAUDE_PROJECT_DIR` env / stdin `cwd` / `process.cwd()` for
// its own logic — only the module-resolution path passed to `node` is now absolute. Moving or
// renaming the project directory after generation requires `spec-first init` to re-bake the
// path, same as any other generated-runtime asset.
const HOOK_INTERPRETER = 'node';
const SESSION_START_HOOK_PATH = '.claude/hooks/session-start';
const SPEC_PLAN_GUARD_HOOK_PATH = '.claude/hooks/spec-plan-guard';
const PRD_PREWRITE_GUARD_HOOK_PATH = '.claude/hooks/prd-prewrite-guard';
const PRD_READINESS_GUARD_HOOK_PATH = '.claude/hooks/prd-readiness-guard';

// Legacy bash shell-form commands from before the exec-form migration. Kept only so that
// detection/removal still recognizes and cleans a pre-migration managed hook on refresh.
const LEGACY_SESSION_START_COMMAND = '"$CLAUDE_PROJECT_DIR"/.claude/hooks/session-start';
const LEGACY_SPEC_PLAN_GUARD_COMMAND = '"$CLAUDE_PROJECT_DIR"/.claude/hooks/spec-plan-guard';
const LEGACY_PRD_PREWRITE_GUARD_COMMAND = '"$CLAUDE_PROJECT_DIR"/.claude/hooks/prd-prewrite-guard';
const LEGACY_PRD_READINESS_GUARD_COMMAND = '"$CLAUDE_PROJECT_DIR"/.claude/hooks/prd-readiness-guard';
const LEGACY_MANAGED_COMMANDS = [
  LEGACY_SESSION_START_COMMAND,
  LEGACY_SPEC_PLAN_GUARD_COMMAND,
  LEGACY_PRD_PREWRITE_GUARD_COMMAND,
  LEGACY_PRD_READINESS_GUARD_COMMAND,
];

// Preserved export name for backward compatibility with consumers/tests that referenced the
// session-start command constant. Now points at the exec-form hook path token.
const SESSION_START_COMMAND = SESSION_START_HOOK_PATH;
const SPEC_PLAN_GUARD_COMMAND = SPEC_PLAN_GUARD_HOOK_PATH;
const PRD_PREWRITE_GUARD_COMMAND = PRD_PREWRITE_GUARD_HOOK_PATH;
const PRD_READINESS_GUARD_COMMAND = PRD_READINESS_GUARD_HOOK_PATH;

const MANAGED_HOOK_PATH_PATTERN = /(^|[^A-Za-z0-9_])\.claude\/hooks\/(?:session-start|spec-plan-guard|prd-prewrite-guard|prd-readiness-guard)(\s|"|$)/;
// Current (relative) exec-form arg paths.
const MANAGED_HOOK_ARG_PATHS = [
  SESSION_START_HOOK_PATH,
  SPEC_PLAN_GUARD_HOOK_PATH,
  PRD_PREWRITE_GUARD_HOOK_PATH,
  PRD_READINESS_GUARD_HOOK_PATH,
];
// Legacy exec-form arg paths from the first exec-form migration, which incorrectly prefixed
// a literal `$CLAUDE_PROJECT_DIR/` (that Claude never expands). Removal must still recognize
// these so a refresh replaces the broken hook instead of leaving a duplicate alongside the
// corrected one.
const LEGACY_EXEC_FORM_ARG_PATHS = MANAGED_HOOK_ARG_PATHS.map((p) => `$CLAUDE_PROJECT_DIR/${p}`);
const REMOVABLE_EXEC_FORM_ARG_PATHS = new Set([
  ...MANAGED_HOOK_ARG_PATHS,
  ...LEGACY_EXEC_FORM_ARG_PATHS,
]);

// Current args are an absolute path baked in at generation time (see buildExecFormHook), so
// exact membership in REMOVABLE_EXEC_FORM_ARG_PATHS only catches the legacy relative/
// `$CLAUDE_PROJECT_DIR/`-prefixed forms. Detection/removal must also recognize an absolute
// path whose tail is one of the managed relative paths, regardless of which project root
// prefix it was baked with (e.g. a stale path left behind after the project directory moved).
// Backslashes are normalized so this matches Windows-style absolute paths too.
function argMatchesManagedHookPath(arg) {
  if (typeof arg !== 'string') {
    return false;
  }
  if (REMOVABLE_EXEC_FORM_ARG_PATHS.has(arg)) {
    return true;
  }
  const normalized = arg.replace(/\\/g, '/');
  return MANAGED_HOOK_ARG_PATHS.some((relativePath) => normalized.endsWith(`/${relativePath}`));
}

const MANAGED_HOOK_DEFINITIONS = [
  {
    eventName: 'SessionStart',
    displayName: 'SessionStart',
    buildMatcher: buildManagedSessionStartMatcher,
  },
  {
    eventName: 'UserPromptExpansion',
    displayName: 'UserPromptExpansion spec-plan guard',
    buildMatcher: buildManagedSpecPlanGuardMatcher,
  },
  {
    eventName: 'PreToolUse',
    displayName: 'PreToolUse PRD prewrite guard',
    buildMatcher: buildManagedPrdPrewriteGuardMatcher,
  },
  {
    eventName: 'Stop',
    displayName: 'Stop PRD readiness guard',
    buildMatcher: buildManagedPrdReadinessGuardMatcher,
  },
];

// Exec-form managed hook: `node <projectRoot>/.claude/hooks/<name>`. No shell runs, so this
// is Windows-safe with or without Git Bash. The single args element is an ABSOLUTE path
// (project-root-relative hookPath resolved against the projectRoot known at generation time),
// so module resolution does not depend on the cwd Claude Code happens to spawn the hook with.
// The hook still derives its own project dir from CLAUDE_PROJECT_DIR env / stdin `cwd` /
// process.cwd() for its own logic.
function buildExecFormHook(projectRoot, hookPath) {
  return {
    type: 'command',
    command: HOOK_INTERPRETER,
    args: [path.join(projectRoot, hookPath)],
  };
}

function buildManagedSessionStartMatcher(projectRoot) {
  return {
    matcher: SESSION_START_MATCHER,
    hooks: [buildExecFormHook(projectRoot, SESSION_START_HOOK_PATH)],
  };
}

function buildManagedSpecPlanGuardMatcher(projectRoot) {
  return {
    matcher: SPEC_PLAN_COMMAND_NAME,
    hooks: [buildExecFormHook(projectRoot, SPEC_PLAN_GUARD_HOOK_PATH)],
  };
}

function buildManagedPrdPrewriteGuardMatcher(projectRoot) {
  return {
    matcher: 'Write|Edit|MultiEdit',
    hooks: [buildExecFormHook(projectRoot, PRD_PREWRITE_GUARD_HOOK_PATH)],
  };
}

function buildManagedPrdReadinessGuardMatcher(projectRoot) {
  return {
    matcher: '.*',
    hooks: [buildExecFormHook(projectRoot, PRD_READINESS_GUARD_HOOK_PATH)],
  };
}

// True when any exec-form args element references a managed hook path. Exec form stores the
// hook path as a plain args string (not the command, which is the `node` interpreter), so
// detection/removal must scan args in addition to the legacy command string. Args are now an
// absolute path baked in with `path.join`, which uses `\` on Windows, so backslashes are
// normalized to `/` before testing against the forward-slash-only MANAGED_HOOK_PATH_PATTERN.
function execFormArgsReferenceManagedHook(hook) {
  return !!hook
    && Array.isArray(hook.args)
    && hook.args.some((arg) => (
      typeof arg === 'string' && MANAGED_HOOK_PATH_PATTERN.test(arg.replace(/\\/g, '/'))
    ));
}

// Loose substring match: used for drift DETECTION/inspection so a lightly-edited managed
// command is still recognized as ours and reported as drifted. Recognizes both the current
// exec form (node + args hook path) and the legacy bash shell-form command string.
function isSpecFirstManagedHook(hook) {
  if (!hook || typeof hook !== 'object' || hook.type !== 'command') {
    return false;
  }
  if (typeof hook.command === 'string' && MANAGED_HOOK_PATH_PATTERN.test(hook.command)) {
    return true;
  }
  return execFormArgsReferenceManagedHook(hook);
}

// Tight match: used for REMOVAL only. Removes both the current exec-form managed hooks
// (command === 'node' and an args element is exactly a managed hook path) and legacy
// shell-form managed commands (exact-equality or the command followed by extra args). A
// user wrapper that merely references the managed path mid-command does not match, so it is
// preserved instead of silently deleted.
function isManagedHookForRemoval(hook) {
  if (!hook || typeof hook !== 'object' || hook.type !== 'command') {
    return false;
  }

  // Exec form: node + args containing a managed hook path. Matches the current absolute
  // path form as well as the legacy relative and `$CLAUDE_PROJECT_DIR/`-prefixed paths so a
  // refresh replaces a broken legacy exec-form hook instead of leaving a duplicate.
  if (hook.command === HOOK_INTERPRETER && Array.isArray(hook.args)) {
    if (hook.args.some((arg) => argMatchesManagedHookPath(arg))) {
      return true;
    }
  }

  // Legacy shell form: the managed command string, optionally followed by extra args.
  if (typeof hook.command === 'string') {
    return LEGACY_MANAGED_COMMANDS.some((command) => (
      hook.command === command || hook.command.startsWith(`${command} `)
    ));
  }

  return false;
}

function upsertManagedClaudeHooks(projectRoot) {
  const rendered = renderManagedClaudeHooksUpsert(projectRoot);
  writeRenderedSettings(projectRoot, rendered);
  return true;
}

function renderManagedClaudeHooksUpsert(projectRoot) {
  const filePath = getClaudeSettingsPath(projectRoot);
  const settings = readSettingsFile(filePath);
  const next = removeManagedHookEntries(settings);

  if (!next.hooks || typeof next.hooks !== 'object' || Array.isArray(next.hooks)) {
    next.hooks = {};
  }

  for (const definition of MANAGED_HOOK_DEFINITIONS) {
    const matchers = Array.isArray(next.hooks[definition.eventName])
      ? [...next.hooks[definition.eventName]]
      : [];
    matchers.push(definition.buildMatcher(projectRoot));
    next.hooks[definition.eventName] = matchers;
  }

  return {
    filePath,
    existsAfter: true,
    contents: `${JSON.stringify(next, null, 2)}\n`,
  };
}

function upsertManagedSessionStartHook(projectRoot) {
  return upsertManagedClaudeHooks(projectRoot);
}

function renderManagedSessionStartHookUpsert(projectRoot) {
  return renderManagedClaudeHooksUpsert(projectRoot);
}

function validateClaudeSettingsFile(projectRoot) {
  readSettingsFile(getClaudeSettingsPath(projectRoot));
}

function removeManagedClaudeHooks(projectRoot) {
  const rendered = renderManagedClaudeHooksRemoval(projectRoot);
  if (!rendered) {
    return false;
  }

  writeRenderedSettings(projectRoot, rendered);
  return true;
}

function renderManagedClaudeHooksRemoval(projectRoot) {
  const filePath = getClaudeSettingsPath(projectRoot);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const settings = readSettingsFile(filePath);
  const next = removeManagedHookEntries(settings);

  if (Object.keys(next).length === 0) {
    return {
      filePath,
      existsAfter: false,
      contents: null,
    };
  }

  return {
    filePath,
    existsAfter: true,
    contents: `${JSON.stringify(next, null, 2)}\n`,
  };
}

function removeManagedSessionStartHook(projectRoot) {
  return removeManagedClaudeHooks(projectRoot);
}

function renderManagedSessionStartHookRemoval(projectRoot) {
  return renderManagedClaudeHooksRemoval(projectRoot);
}

function inspectManagedClaudeHooks(projectRoot) {
  return MANAGED_HOOK_DEFINITIONS.map((definition) => ({
    ...inspectManagedHookDefinition(projectRoot, definition),
    eventName: definition.eventName,
    displayName: definition.displayName,
  }));
}

function inspectManagedSessionStartHook(projectRoot) {
  return inspectManagedHookDefinition(projectRoot, MANAGED_HOOK_DEFINITIONS[0]);
}

function inspectManagedSpecPlanGuardHook(projectRoot) {
  return inspectManagedHookDefinition(projectRoot, MANAGED_HOOK_DEFINITIONS[1]);
}

function inspectManagedPrdPrewriteGuardHook(projectRoot) {
  return inspectManagedHookDefinition(projectRoot, MANAGED_HOOK_DEFINITIONS[2]);
}

function inspectManagedPrdReadinessGuardHook(projectRoot) {
  return inspectManagedHookDefinition(projectRoot, MANAGED_HOOK_DEFINITIONS[3]);
}

function inspectManagedHookDefinition(projectRoot, definition) {
  const filePath = getClaudeSettingsPath(projectRoot);
  if (!fs.existsSync(filePath)) {
    return {
      status: 'missing',
      message: 'settings file missing',
    };
  }

  let settings;
  try {
    settings = readSettingsFile(filePath);
  } catch (error) {
    return {
      status: 'partial',
      message: error instanceof Error ? error.message : String(error),
    };
  }

  if (!settings.hooks || typeof settings.hooks !== 'object' || Array.isArray(settings.hooks)) {
    return {
      status: 'missing',
      message: '`hooks` object missing',
    };
  }

  const matchers = settings.hooks[definition.eventName];
  if (!Array.isArray(matchers)) {
    return {
      status: 'missing',
      message: `\`hooks.${definition.eventName}\` array missing`,
    };
  }

  const expected = definition.buildMatcher(projectRoot);
  const managedMatchers = matchers.filter((matcher) => matcherContainsManagedHook(matcher));
  if (managedMatchers.length === 0) {
    return {
      status: 'missing',
      message: `managed ${definition.displayName} matcher missing`,
    };
  }

  if (managedMatchers.length !== 1) {
    return {
      status: 'drifted',
      message: `expected 1 managed ${definition.displayName} matcher, found ${managedMatchers.length}`,
    };
  }

  if (!isManagedMatcherEqual(managedMatchers[0], expected)) {
    return {
      status: 'drifted',
      message: `managed ${definition.displayName} matcher drifted from the bundled template`,
    };
  }

  return {
    status: 'installed',
    message: `managed ${definition.displayName} matcher present`,
  };
}

function getClaudeSettingsPath(projectRoot) {
  return path.join(projectRoot, SETTINGS_RELATIVE_PATH);
}

function readSettingsFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Claude settings must be a JSON object');
  }
  return parsed;
}

function writeSettingsFile(filePath, settings) {
  writeFileAtomic(filePath, `${JSON.stringify(settings, null, 2)}\n`);
}

function writeRenderedSettings(projectRoot, rendered) {
  if (!rendered) {
    return;
  }

  if (!rendered.existsAfter) {
    fs.rmSync(rendered.filePath, { force: true });
    removeEmptyParents(path.dirname(rendered.filePath), projectRoot);
    return;
  }

  writeFileAtomic(rendered.filePath, rendered.contents || '');
}

function removeManagedHookEntries(settings) {
  const next = cloneJson(settings);
  const hooksRoot = next.hooks;
  if (!hooksRoot || typeof hooksRoot !== 'object' || Array.isArray(hooksRoot)) {
    return next;
  }

  for (const eventName of Object.keys(hooksRoot)) {
    const matchers = hooksRoot[eventName];
    if (!Array.isArray(matchers)) {
      continue;
    }

    const remainingMatchers = [];
    for (const matcher of matchers) {
      if (!matcher || typeof matcher !== 'object' || Array.isArray(matcher) || !Array.isArray(matcher.hooks)) {
        remainingMatchers.push(matcher);
        continue;
      }

      const remainingHooks = matcher.hooks.filter((hook) => !isManagedHookForRemoval(hook));
      if (remainingHooks.length === 0) {
        continue;
      }

      if (remainingHooks.length === matcher.hooks.length) {
        remainingMatchers.push(matcher);
        continue;
      }

      remainingMatchers.push({
        ...matcher,
        hooks: remainingHooks,
      });
    }

    if (remainingMatchers.length > 0) {
      hooksRoot[eventName] = remainingMatchers;
    } else {
      delete hooksRoot[eventName];
    }
  }

  if (Object.keys(hooksRoot).length === 0) {
    delete next.hooks;
  }

  return next;
}

function matcherContainsManagedHook(matcher) {
  return !!matcher &&
    typeof matcher === 'object' &&
    !Array.isArray(matcher) &&
    Array.isArray(matcher.hooks) &&
    matcher.hooks.some((hook) => isSpecFirstManagedHook(hook));
}

function isManagedMatcherEqual(actual, expected) {
  return !!actual &&
    typeof actual === 'object' &&
    !Array.isArray(actual) &&
    actual.matcher === expected.matcher &&
    Array.isArray(actual.hooks) &&
    actual.hooks.length === 1 &&
    !!actual.hooks[0] &&
    typeof actual.hooks[0] === 'object' &&
    !Array.isArray(actual.hooks[0]) &&
    actual.hooks[0].type === expected.hooks[0].type &&
    actual.hooks[0].command === expected.hooks[0].command &&
    stringArraysEqual(actual.hooks[0].args, expected.hooks[0].args) &&
    Object.keys(actual).length === Object.keys(expected).length &&
    Object.keys(actual.hooks[0]).length === Object.keys(expected.hooks[0]).length;
}

function stringArraysEqual(actual, expected) {
  const actualArr = Array.isArray(actual) ? actual : [];
  const expectedArr = Array.isArray(expected) ? expected : [];
  return actualArr.length === expectedArr.length
    && actualArr.every((value, index) => value === expectedArr[index]);
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function removeEmptyParents(startPath, stopRoot) {
  let current = startPath;
  while (current.startsWith(stopRoot) && current !== stopRoot) {
    if (!fs.existsSync(current)) {
      current = path.dirname(current);
      continue;
    }

    if (fs.readdirSync(current).length > 0) {
      break;
    }

    fs.rmdirSync(current);
    current = path.dirname(current);
  }
}

module.exports = {
  SESSION_START_COMMAND,
  SESSION_START_MATCHER,
  SPEC_PLAN_COMMAND_NAME,
  SPEC_PLAN_GUARD_COMMAND,
  PRD_PREWRITE_GUARD_COMMAND,
  PRD_READINESS_GUARD_COMMAND,
  buildManagedPrdPrewriteGuardMatcher,
  buildManagedPrdReadinessGuardMatcher,
  buildManagedSessionStartMatcher,
  buildManagedSpecPlanGuardMatcher,
  getClaudeSettingsPath,
  inspectManagedClaudeHooks,
  inspectManagedPrdPrewriteGuardHook,
  inspectManagedPrdReadinessGuardHook,
  inspectManagedSessionStartHook,
  inspectManagedSpecPlanGuardHook,
  isSpecFirstManagedHook,
  removeManagedClaudeHooks,
  removeManagedSessionStartHook,
  renderManagedClaudeHooksRemoval,
  renderManagedClaudeHooksUpsert,
  renderManagedSessionStartHookRemoval,
  renderManagedSessionStartHookUpsert,
  upsertManagedClaudeHooks,
  upsertManagedSessionStartHook,
  validateClaudeSettingsFile,
};
