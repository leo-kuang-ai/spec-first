'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ZCODE_CONFIG_RELATIVE_PATH = '.zcode/config.json';
const ZCODE_SESSION_START_RELATIVE_PATH = '.zcode/hooks/session-start';
const ZCODE_HOOK_ACTIVATION_UNVERIFIED_REASON_CODE = 'zcode_activation_unverified';

// The ZCode config hook contract is `hooks: { enabled?, events: { <Event>: [{ matcher?, hooks: [...] }] } }`
// (Claude-compatible event names; configuration-file hooks additionally require
// `hooks.enabled: true`). spec-first injects exactly one managed SessionStart
// command hook and treats every other key/entry as user-owned.
const MANAGED_SESSION_START_COMMAND = `node ${ZCODE_SESSION_START_RELATIVE_PATH}`;
const MANAGED_SESSION_START_ENTRY = {
  hooks: [
    {
      type: 'command',
      command: MANAGED_SESSION_START_COMMAND,
    },
  ],
};

function getZcodeConfigPath(projectRoot) {
  return path.join(projectRoot, ZCODE_CONFIG_RELATIVE_PATH);
}

// Returns { filePath, existsAfter, contents } for the merged config, or
// { blocked: 'zcode_config_unreadable', filePath, message } when the existing
// config cannot be parsed — a corrupt user file is never overwritten.
function renderManagedZcodeConfig(projectRoot) {
  const filePath = getZcodeConfigPath(projectRoot);
  let existing = null;
  try {
    existing = readZcodeConfig(filePath);
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      existing = null;
    } else {
      return {
        blocked: 'zcode_config_unreadable',
        filePath,
        message: `.zcode/config.json is not readable JSON: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  const merged = mergeManagedSlice(existing);
  return {
    filePath,
    existsAfter: true,
    contents: `${JSON.stringify(merged, null, 2)}\n`,
    hooksDisabledByUser: merged.hooks && merged.hooks.enabled === false,
  };
}

function renderManagedZcodeConfigRemoval(projectRoot) {
  const filePath = getZcodeConfigPath(projectRoot);
  let settings;
  try {
    settings = readZcodeConfig(filePath);
  } catch {
    return null;
  }

  const { next, removedCount } = removeManagedSlice(settings);
  if (removedCount === 0) {
    return null;
  }

  if (Object.keys(next).length === 0) {
    return { filePath, existsAfter: false, contents: null };
  }

  return {
    filePath,
    existsAfter: true,
    contents: `${JSON.stringify(next, null, 2)}\n`,
  };
}

function inspectManagedZcodeConfig(projectRoot) {
  const filePath = getZcodeConfigPath(projectRoot);
  let settings;
  try {
    settings = readZcodeConfig(filePath);
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return [degradedStatus(
        'config file absent; run spec-first init --zcode to install the managed SessionStart hook',
        'zcode_config_absent',
      )];
    }
    return [{
      status: 'drifted',
      eventName: 'SessionStart',
      // A corrupt user-owned config is not spec-first runtime drift: a managed
      // hard reset cannot repair it, so flagging it as drift would loop init
      // through destructive resets that never converge. Doctor still surfaces
      // the WARNING; init emits its own zcode_config_write_skipped diagnostic.
      drift: false,
      degradedByDesign: false,
      reasonCode: 'zcode_config_unreadable',
      message: `.zcode/config.json cannot be inspected: ${error instanceof Error ? error.message : String(error)}`,
    }];  }

  if (hasManagedSessionStartEntry(settings)) {
    const enabled = settings.hooks && settings.hooks.enabled === true;
    if (enabled) {
      return [degradedStatus(
        'managed SessionStart entry is installed; activation on the ZCode client is not yet verified by a live session',
      )];
    }
    return [degradedStatus(
      'managed SessionStart entry is installed but hooks are disabled (hooks.enabled is not true); enable hooks or rerun init',
      'zcode_hooks_disabled',
    )];
  }

  return [degradedStatus(
    'managed SessionStart entry is missing; run spec-first init --zcode to restore it',
    'zcode_managed_entry_missing',
  )];
}

function mergeManagedSlice(existing) {
  const next = isPlainObject(existing) ? cloneJson(existing) : {};
  if (!isPlainObject(next.hooks)) {
    next.hooks = {};
  }

  // Ownership rule: an explicit user `enabled: false` wins and is surfaced as a
  // degraded warning by the caller; only an absent flag is set to true.
  if (next.hooks.enabled === undefined) {
    next.hooks.enabled = true;
  }

  if (!isPlainObject(next.hooks.events)) {
    next.hooks.events = {};
  }
  const sessionStart = Array.isArray(next.hooks.events.SessionStart)
    ? next.hooks.events.SessionStart
    : [];
  next.hooks.events.SessionStart = [
    ...stripManagedEntries(sessionStart),
    cloneJson(MANAGED_SESSION_START_ENTRY),
  ];
  return next;
}

function removeManagedSlice(settings) {
  const next = cloneJson(settings);
  const hooks = next.hooks;
  if (!isPlainObject(hooks) || !isPlainObject(hooks.events)) {
    return { next, removedCount: 0 };
  }

  const sessionStart = hooks.events.SessionStart;
  if (!Array.isArray(sessionStart)) {
    return { next, removedCount: 0 };
  }

  const remaining = stripManagedEntries(sessionStart);
  const removedCount = sessionStart.length - remaining.length;
  if (removedCount === 0) {
    return { next, removedCount };
  }

  if (remaining.length === 0) {
    delete hooks.events.SessionStart;
  } else {
    hooks.events.SessionStart = remaining;
  }
  if (Object.keys(hooks.events).length === 0) {
    delete hooks.events;
  }
  // Ownership: a leftover `hooks.enabled` cannot be attributed (a user-written
  // false is indistinguishable from the spec-first-written true), so it is
  // always preserved rather than deleted with the managed entry.
  if (isPlainObject(next.hooks) && Object.keys(next.hooks).length === 0) {
    delete next.hooks;
  }
  return { next, removedCount };
}

function stripManagedEntries(entries) {
  return entries.filter((entry) => !isManagedSessionStartEntry(entry));
}

function isManagedSessionStartEntry(entry) {
  return Boolean(
    entry
    && typeof entry === 'object'
    && !Array.isArray(entry)
    && Array.isArray(entry.hooks)
    && entry.hooks.some((hook) => hook
      && hook.type === 'command'
      && typeof hook.command === 'string'
      && hook.command.trim() === MANAGED_SESSION_START_COMMAND),
  );
}

function hasManagedSessionStartEntry(settings) {
  const hooks = settings && settings.hooks;
  const events = hooks && hooks.events;
  const sessionStart = events && events.SessionStart;
  return Array.isArray(sessionStart)
    && sessionStart.some((entry) => isManagedSessionStartEntry(entry));
}

function degradedStatus(detail, reasonCode = ZCODE_HOOK_ACTIVATION_UNVERIFIED_REASON_CODE) {
  return {
    status: 'degraded-by-design',
    eventName: 'SessionStart',
    // `drift: false` keeps the persistent degraded-by-design state out of
    // init's runtime-drift detection (same contract as the qoder degraded
    // statuses), so an unchanged install does not trigger a hard reset.
    drift: false,
    degradedByDesign: true,
    reasonCode,
    message: `managed ZCode SessionStart hook: ${detail}`,
  };
}

function readZcodeConfig(filePath) {
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!isPlainObject(parsed)) {
    throw new Error('ZCode config must be a JSON object');
  }
  return parsed;
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function isPlainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

module.exports = {
  MANAGED_SESSION_START_COMMAND,
  ZCODE_CONFIG_RELATIVE_PATH,
  ZCODE_HOOK_ACTIVATION_UNVERIFIED_REASON_CODE,
  ZCODE_SESSION_START_RELATIVE_PATH,
  inspectManagedZcodeConfig,
  renderManagedZcodeConfig,
  renderManagedZcodeConfigRemoval,
};
