'use strict';

const fs = require('node:fs');
const path = require('node:path');

const SETTINGS_RELATIVE_PATH = '.qoder/settings.json';
const QODER_HOOK_ACTIVATION_UNVERIFIED_REASON_CODE = 'qoder_hook_activation_unverified';

const MANAGED_HOOK_DEFINITIONS = [
  {
    eventName: 'SessionStart',
    displayName: 'SessionStart',
    hookPath: '.qoder/hooks/session-start',
    templateName: 'session-start',
    reasonCode: QODER_HOOK_ACTIVATION_UNVERIFIED_REASON_CODE,
  },
  {
    eventName: 'PreToolUse',
    displayName: 'PreToolUse PRD prewrite guard',
    hookPath: '.qoder/hooks/prd-prewrite-guard',
    templateName: 'prd-prewrite-guard',
    reasonCode: QODER_HOOK_ACTIVATION_UNVERIFIED_REASON_CODE,
  },
  {
    eventName: 'Stop',
    displayName: 'Stop PRD readiness guard',
    hookPath: '.qoder/hooks/prd-readiness-guard',
    templateName: 'prd-readiness-guard',
    reasonCode: QODER_HOOK_ACTIVATION_UNVERIFIED_REASON_CODE,
  },
];
const MANAGED_HOOK_PATHS = new Set(MANAGED_HOOK_DEFINITIONS.map((definition) => definition.hookPath));
const MANAGED_HOOK_SHELL_COMMANDS = [...MANAGED_HOOK_PATHS].flatMap((hookPath) => [
  `node ${hookPath}`,
  `node ./${hookPath}`,
]);
const MANAGED_HOOK_EXEC_ARGS = new Set([...MANAGED_HOOK_PATHS].flatMap((hookPath) => [
  hookPath,
  `./${hookPath}`,
]));

function getQoderSettingsPath(projectRoot) {
  return path.join(projectRoot, SETTINGS_RELATIVE_PATH);
}

function renderManagedQoderHooksCleanup(projectRoot) {
  return renderManagedQoderHooksRemoval(projectRoot);
}

function renderManagedQoderHooksRemoval(projectRoot) {
  const filePath = getQoderSettingsPath(projectRoot);
  let settings;
  try {
    settings = readSettingsFile(filePath);
  } catch (error) {
    return null;
  }

  const { next, removedCount } = removeManagedHookEntries(settings);
  if (removedCount === 0) {
    return null;
  }

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

function inspectManagedQoderHooks(projectRoot) {
  const filePath = getQoderSettingsPath(projectRoot);
  let settings;
  try {
    settings = readSettingsFile(filePath);
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return MANAGED_HOOK_DEFINITIONS.map((definition) => degradedStatus(
        definition,
        'settings file absent; the qodercli 1.0.41 evidence baseline confirms the settings and command protocol, but authenticated event execution and shared IDE loader safety are not verified',
      ));
    }
    return MANAGED_HOOK_DEFINITIONS.map((definition) => ({
      status: 'drifted',
      eventName: definition.eventName,
      displayName: definition.displayName,
      drift: true,
      degradedByDesign: false,
      reasonCode: 'qoder_settings_unreadable',
      message: `managed ${definition.displayName} settings entry cannot be inspected because .qoder/settings.json is unreadable: ${error instanceof Error ? error.message : String(error)}`,
    }));
  }

  return MANAGED_HOOK_DEFINITIONS.map((definition) => {
    if (hasManagedMatcherForEvent(settings, definition.eventName)) {
      return {
        status: 'drifted',
        eventName: definition.eventName,
        displayName: definition.displayName,
        drift: true,
        degradedByDesign: false,
        reasonCode: 'qoder_unverified_hook_entry_present',
        message: `managed ${definition.displayName} settings entry is present before authenticated Qoder CLI execution and shared IDE loader safety are verified`,
      };
    }

    return degradedStatus(
      definition,
      'settings entry intentionally omitted until authenticated Qoder CLI execution and shared IDE loader safety are verified',
    );
  });
}

function isSpecFirstManagedQoderHook(hook) {
  return isManagedHookForRemoval(hook);
}

function isManagedHookForRemoval(hook) {
  if (!isCommandHook(hook)) {
    return false;
  }
  if (typeof hook.command === 'string') {
    if (MANAGED_HOOK_SHELL_COMMANDS.some((command) => (
      hook.command === command
    ))) {
      return true;
    }
  }
  return hook.command === 'node'
    && Array.isArray(hook.args)
    && hook.args.length === 1
    && typeof hook.args[0] === 'string'
    && MANAGED_HOOK_EXEC_ARGS.has(hook.args[0]);
}

function removeManagedHookEntries(settings) {
  const next = cloneJson(settings);
  const hooksRoot = next.hooks;
  let removedCount = 0;
  if (!hooksRoot || typeof hooksRoot !== 'object' || Array.isArray(hooksRoot)) {
    return { next, removedCount };
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
      removedCount += matcher.hooks.length - remainingHooks.length;
      if (remainingHooks.length === 0) {
        continue;
      }

      remainingMatchers.push(remainingHooks.length === matcher.hooks.length
        ? matcher
        : { ...matcher, hooks: remainingHooks });
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

  return { next, removedCount };
}

function hasManagedMatcherForEvent(settings, eventName) {
  const hooksRoot = settings && settings.hooks;
  if (!hooksRoot || typeof hooksRoot !== 'object' || Array.isArray(hooksRoot)) {
    return false;
  }
  const matchers = hooksRoot[eventName];
  if (!Array.isArray(matchers)) {
    return false;
  }
  return matchers.some((matcher) => (
    matcher
    && typeof matcher === 'object'
    && !Array.isArray(matcher)
    && Array.isArray(matcher.hooks)
    && matcher.hooks.some((hook) => isSpecFirstManagedQoderHook(hook))
  ));
}

function degradedStatus(definition, detail, reasonCode = definition.reasonCode) {
  return {
    status: 'degraded-by-design',
    eventName: definition.eventName,
    displayName: definition.displayName,
    drift: false,
    degradedByDesign: true,
    reasonCode,
    message: `managed ${definition.displayName} settings entry degraded by design: ${detail}`,
  };
}

function readSettingsFile(filePath) {
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Qoder settings must be a JSON object');
  }
  return parsed;
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function isCommandHook(hook) {
  return hook && typeof hook === 'object' && !Array.isArray(hook) && hook.type === 'command';
}

module.exports = {
  MANAGED_HOOK_DEFINITIONS,
  QODER_HOOK_ACTIVATION_UNVERIFIED_REASON_CODE,
  SETTINGS_RELATIVE_PATH,
  inspectManagedQoderHooks,
  renderManagedQoderHooksCleanup,
  renderManagedQoderHooksRemoval,
};
