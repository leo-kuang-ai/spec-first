const fs = require('node:fs');
const path = require('node:path');
const { writeFileAtomic } = require('./atomic-write');

const SETTINGS_RELATIVE_PATH = '.claude/settings.json';
const SESSION_START_MATCHER = 'startup|resume|clear|compact';
const SPEC_PLAN_COMMAND_NAME = 'spec-plan';
const SESSION_START_COMMAND = '"$CLAUDE_PROJECT_DIR"/.claude/hooks/session-start';
const SPEC_PLAN_GUARD_COMMAND = '"$CLAUDE_PROJECT_DIR"/.claude/hooks/spec-plan-guard';
const PRD_PREWRITE_GUARD_COMMAND = '"$CLAUDE_PROJECT_DIR"/.claude/hooks/prd-prewrite-guard';
const PRD_READINESS_GUARD_COMMAND = '"$CLAUDE_PROJECT_DIR"/.claude/hooks/prd-readiness-guard';
const MANAGED_HOOK_PATH_PATTERN = /(^|[^A-Za-z0-9_])\.claude\/hooks\/(?:session-start|spec-plan-guard|prd-prewrite-guard|prd-readiness-guard)(\s|"|$)/;

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

function buildManagedSessionStartMatcher() {
  return {
    matcher: SESSION_START_MATCHER,
    hooks: [
      {
        type: 'command',
        command: SESSION_START_COMMAND,
      },
    ],
  };
}

function buildManagedSpecPlanGuardMatcher() {
  return {
    matcher: SPEC_PLAN_COMMAND_NAME,
    hooks: [
      {
        type: 'command',
        command: SPEC_PLAN_GUARD_COMMAND,
      },
    ],
  };
}

function buildManagedPrdPrewriteGuardMatcher() {
  return {
    matcher: 'Write|Edit|MultiEdit',
    hooks: [
      {
        type: 'command',
        command: PRD_PREWRITE_GUARD_COMMAND,
      },
    ],
  };
}

function buildManagedPrdReadinessGuardMatcher() {
  return {
    matcher: '.*',
    hooks: [
      {
        type: 'command',
        command: PRD_READINESS_GUARD_COMMAND,
      },
    ],
  };
}

// Loose substring match: used for drift DETECTION/inspection so a lightly-edited managed
// command is still recognized as ours and reported as drifted.
function isSpecFirstManagedHook(hook) {
  return !!hook &&
    typeof hook === 'object' &&
    hook.type === 'command' &&
    typeof hook.command === 'string' &&
    MANAGED_HOOK_PATH_PATTERN.test(hook.command);
}

// Tight match: used for REMOVAL only. The Claude managed commands are project-relative
// and stable, so exact-equality (or the command followed by extra args, e.g. spec-first's
// own "...session-start --debug" drift) is safe to remove and re-add. A user wrapper that
// merely references the managed path mid-command (e.g. "my-wrapper ...session-start && x")
// does not start with the managed command, so it is preserved instead of silently deleted.
function isManagedHookForRemoval(hook) {
  if (!hook || typeof hook !== 'object' || hook.type !== 'command' || typeof hook.command !== 'string') {
    return false;
  }
  return [SESSION_START_COMMAND, SPEC_PLAN_GUARD_COMMAND, PRD_PREWRITE_GUARD_COMMAND].some((command) => (
    hook.command === command || hook.command.startsWith(`${command} `)
  )) || [PRD_READINESS_GUARD_COMMAND].some((command) => (
    hook.command === command || hook.command.startsWith(`${command} `)
  ));
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
    matchers.push(definition.buildMatcher());
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

  const expected = definition.buildMatcher();
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
    Object.keys(actual).length === Object.keys(expected).length &&
    Object.keys(actual.hooks[0]).length === Object.keys(expected.hooks[0]).length;
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
