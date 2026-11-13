'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ZCODE_CONFIG_RELATIVE_PATH = '.zcode/config.json';
const ZCODE_SESSION_START_RELATIVE_PATH = '.zcode/hooks/session-start';
const ZCODE_HOOK_ACTIVATION_UNVERIFIED_REASON_CODE = 'zcode_activation_unverified';

// ZCode config hook 契约为 `hooks: { enabled?, events: { <Event>: [{ matcher?, hooks: [...] }] } }`
// （Claude 兼容的事件名；config-file hooks 还要求 `hooks.enabled: true`）。
// spec-first 只注入一个受管 SessionStart command hook，其余键/条目一律视为用户所有。
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

// 返回合并后 config 的 { filePath, existsAfter, contents }；既有 config 无法解析时
// 返回 { blocked: 'zcode_config_unreadable', filePath, message }——损坏的用户文件
// 永不被覆盖。
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
      // 用户自有的损坏 config 不属于 spec-first runtime drift：受管 hard reset
      // 修不了它，标为 drift 会让 init 在永不收敛的破坏性 reset 里循环。doctor
      // 仍呈现 WARNING；init 自带 zcode_config_write_skipped 诊断。
      drift: false,
      degradedByDesign: false,
      reasonCode: 'zcode_config_unreadable',
      message: `.zcode/config.json cannot be inspected: ${error instanceof Error ? error.message : String(error)}`,
    }];  }

  if (hasManagedSessionStartEntry(settings)) {
    const enabled = settings.hooks && settings.hooks.enabled === true;
    if (enabled) {
      // 2026-09-05 真机激活验证：ZCode 客户端在会话启动时执行了受管
      // SessionStart hook 并注入其 additionalContext
      // （docs/validation/2026-09-05-zcode-sessionstart-activation-eval.md）。
      return [{
        status: 'installed',
        eventName: 'SessionStart',
        drift: false,
        degradedByDesign: false,
        message: 'managed SessionStart entry is installed; session activation verified in a live ZCode session',
      }];
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

  // 所有权规则：用户显式 `enabled: false` 优先并由调用方以降级 WARNING 呈现；
  // 只有缺失的 flag 才会被置 true。
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
  // 所有权：残留的 `hooks.enabled` 无法归因（用户写的 false 与 spec-first 写的
  // true 不可区分），因此总是保留、不随受管条目一起删除。
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
    // `drift: false` 使常驻的 degraded-by-design 状态不进入 init 的 runtime-drift
    // 检测（与 qoder 降级状态同契约），未变更的安装不会触发 hard reset。
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
