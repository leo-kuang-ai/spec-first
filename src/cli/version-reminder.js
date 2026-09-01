const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { getAdapter, getPlatformDisplayName, getStartupReminderHosts } = require('./adapters');

const VERSION_REMINDER_ATTEMPT_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const STARTUP_REMINDER_COOLDOWN_MS = VERSION_REMINDER_ATTEMPT_COOLDOWN_MS;
const CLI_VERSION_REMINDER_SCOPE = 'cli.package';
const UNKNOWN_RUNTIME_VERSION = 'unknown-runtime-version';
const DEFAULT_VERSION_REMINDER_TIMEOUT_MS = 2000;
const REMINDER_ATTEMPT_LOCK_STALE_MS = 5 * 60 * 1000;
// 查询失败后的短重试窗口：弱网一次失败不应触发 24h 提醒盲区。
const REMINDER_FAILURE_RETRY_MS = 60 * 60 * 1000;
const VERSION_REMINDER_OPT_OUT_ENV = 'SPEC_FIRST_NO_UPDATE_NOTIFIER';
// startup 提醒只覆盖声明了 session-start hook 的宿主；集合与显示名都从
// platform registry 派生，避免与 adapters 的宿主清单脱节。
const STARTUP_HOST_LABELS = Object.freeze(
  Object.fromEntries(
    getStartupReminderHosts().map((host) => [host, getPlatformDisplayName(host)]),
  ),
);

// 默认网络超时；可经 SPEC_FIRST_VERSION_REMINDER_TIMEOUT_MS 覆盖(慢网调大、CI 调小)。
// 350ms 曾导致在常见网络下查询 registry.npmjs.org(实测约 630ms)每次静默超时,提醒形同虚设。
function resolveVersionReminderTimeoutMs() {
  const raw = process.env.SPEC_FIRST_VERSION_REMINDER_TIMEOUT_MS;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_VERSION_REMINDER_TIMEOUT_MS;
}

function shouldNotifyVersionReminder(currentVersion, latestVersion) {
  const comparison = compareVersions(currentVersion, latestVersion);
  return comparison !== null && comparison < 0;
}

function detectInstallChannels(options = {}) {
  // options.selfPath 供测试注入；生产取当前 bin 真实入口。
  // 统一按 POSIX 分隔符匹配（宿主在 Windows 上常以正斜杠字符串 spawn），
  // win32 下再做大小写归一（大小写不敏感文件系统上的目录名变体）。
  let selfPath = String(options.selfPath || process.argv[1] || '');
  if (process.platform === 'win32') {
    selfPath = selfPath.toLowerCase();
  }
  selfPath = selfPath.split(path.sep).join('/');
  const claudePlugin = selfPath.includes('/.claude/plugins/');
  return { npm: !claudePlugin, claudePlugin };
}

function formatUpgradeGuidance(channels) {
  const optOut = `or set ${VERSION_REMINDER_OPT_OUT_ENV}=1 to disable update checks`;
  if (channels && channels.claudePlugin) {
    return `Run \`claude plugin update\` to upgrade (installed as a Claude Code plugin); \`spec-first update\` manages a separate npm copy, ${optOut}.`;
  }
  return `Run \`spec-first update\` to upgrade, ${optOut}.`;
}

function formatVersionReminder({ packageName, currentVersion, latestVersion, channels }) {
  return [
    `Update available for ${packageName}: ${currentVersion} -> ${latestVersion}`,
    formatUpgradeGuidance(channels || detectInstallChannels()),
  ].join('\n');
}

async function maybeShowVersionReminder(options = {}) {
  const {
    packageName = '',
    currentVersion = '',
    output = process.stderr,
    timeoutMs = resolveVersionReminderTimeoutMs(),
    lookupLatestVersion = defaultLookupLatestVersion,
  } = options;
  const nowMs = Number.isFinite(options.nowMs) ? options.nowMs : Date.now();
  const cooldownMs = Number.isFinite(options.cooldownMs)
    ? options.cooldownMs
    : VERSION_REMINDER_ATTEMPT_COOLDOWN_MS;

  if (!packageName || !currentVersion) {
    return false;
  }

  if (shouldSkipCliVersionReminder(options)) {
    return false;
  }

  if (!claimCliVersionReminderAttempt({ nowMs, cooldownMs }, options)) {
    return false;
  }

  let latestVersion;
  try {
    latestVersion = await lookupLatestVersion(packageName, { timeoutMs });
  } catch {
    latestVersion = '';
  }
  // 仅语义合法的版本算查询成功；垃圾响应（注入/损坏）按失败走短重试窗口。
  const validLatest = Boolean(latestVersion) && parseVersion(latestVersion) !== null;
  markCliVersionReminderOutcome(validLatest, options);
  if (!validLatest || !shouldNotifyVersionReminder(currentVersion, latestVersion)) {
    return false;
  }

  const message = formatVersionReminder({
    packageName,
    currentVersion,
    latestVersion,
    channels: detectInstallChannels(options),
  });

  try {
    output.write(`${message}\n`);
  } catch {
    return false;
  }

  return true;
}

async function maybeShowStartupVersionReminder(options = {}) {
  const output = options.output || process.stdout;
  const reminder = await buildStartupVersionReminder(options);
  const messages = [];
  if (reminder && reminder.message) {
    messages.push(reminder.message);
  }

  if (messages.length === 0) {
    return false;
  }

  try {
    output.write(`${messages.join('\n')}\n`);
  } catch {
    return false;
  }

  if (reminder && reminder.message) {
    recordStartupReminderCooldown(reminder, options);
  }
  return true;
}

async function buildStartupVersionReminder(options = {}) {
  const host = normalizeHost(options.host);
  if (!host) {
    return null;
  }

  if (isVersionReminderOptedOut(options)) {
    return null;
  }

  const projectRoot = options.projectRoot || process.cwd();
  const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : resolveVersionReminderTimeoutMs();
  const packageName = options.packageName || 'spec-first';
  const nowMs = Number.isFinite(options.nowMs) ? options.nowMs : Date.now();
  const cooldownMs = Number.isFinite(options.cooldownMs)
    ? options.cooldownMs
    : STARTUP_REMINDER_COOLDOWN_MS;
  const lookupLatestVersion = options.lookupLatestVersion || defaultLookupStartupLatestVersion;
  const runtime = resolveCurrentRuntimeVersion({ host, projectRoot });

  if (!runtime.runtimeExists) {
    return null;
  }

  if (!claimStartupVersionReminderAttempt({ host, nowMs, cooldownMs }, options)) {
    return null;
  }

  let latestVersion = '';
  try {
    latestVersion = await lookupLatestVersion({ host, packageName, timeoutMs });
  } catch {
    latestVersion = '';
  }
  // 与 CLI 路径同一有效性判据：垃圾响应按失败走短重试窗口。
  const startupLookupValid = Boolean(latestVersion)
    && parseVersion(normalizeOverride(latestVersion)) !== null;
  markStartupReminderOutcome(host, startupLookupValid, options);
  if (!latestVersion) {
    return null;
  }

  latestVersion = normalizeOverride(latestVersion);
  if (!latestVersion || !parseVersion(latestVersion)) {
    return null;
  }

  const currentVersion = runtime.currentVersion;
  const currentKeyVersion = currentVersion || UNKNOWN_RUNTIME_VERSION;
  const reminderKey = buildStartupReminderKey({ host, currentVersion: currentKeyVersion, latestVersion });

  if (isStartupReminderCooldownActive({ host, key: reminderKey, nowMs, cooldownMs }, options)) {
    return null;
  }

  if (currentVersion && !shouldNotifyVersionReminder(currentVersion, latestVersion)) {
    return null;
  }

  return {
    host,
    projectRoot,
    key: reminderKey,
    currentVersion: currentKeyVersion,
    latestVersion,
    nowMs,
    message: formatStartupVersionReminder({
      host,
      currentVersion,
      latestVersion,
    }),
  };
}

function formatStartupVersionReminder({ host, currentVersion, latestVersion }) {
  const hostLabel = STARTUP_HOST_LABELS[host] || host;
  const statusLine = currentVersion
    ? `[spec-first] Update available for ${hostLabel} runtime: ${currentVersion} -> ${latestVersion}`
    : `[spec-first] ${hostLabel} runtime version is unknown; latest available spec-first is ${latestVersion}.`;

  return [
    statusLine,
    'Run `spec-first update` in your terminal to upgrade the spec-first CLI. This startup reminder itself is read-only and will not install, refresh runtime assets, or restart the host.',
  ].join('\n');
}

async function defaultLookupStartupLatestVersion({ packageName, timeoutMs }) {
  // 版本源统一为 npm registry：与安装源一致，避免 GitHub main 上的未发布
  // 版本对普通用户产生"更新提示却装不到"的噪音。GitHub 源保留为
  // lookupLatestGitHubPackageVersion，仅供显式调试调用。
  return defaultLookupLatestVersion(packageName, { timeoutMs });
}

async function lookupLatestGitHubPackageVersion(options = {}) {
  const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : resolveVersionReminderTimeoutMs();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch('https://raw.githubusercontent.com/sunrain520/spec-first/main/package.json', {
      headers: {
        accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return '';
    }

    const payload = await response.json().catch(() => null);
    return payload && typeof payload.version === 'string'
      ? payload.version.trim()
      : '';
  } catch {
    return '';
  } finally {
    clearTimeout(timeout);
  }
}

function resolveCurrentRuntimeVersion({ host, projectRoot }) {
  let adapter;
  try {
    adapter = getAdapter(host);
  } catch {
    return {
      runtimeExists: false,
      currentVersion: '',
    };
  }

  const statePath = path.join(projectRoot, adapter.stateFile);
  const runtimeExists = managedRuntimeExists(projectRoot, adapter);

  if (!fs.existsSync(statePath)) {
    return {
      runtimeExists,
      currentVersion: '',
    };
  }

  try {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    const manifestVersion = typeof state.manifestVersion === 'string'
      ? state.manifestVersion.trim()
      : '';
    return {
      runtimeExists: true,
      currentVersion: parseVersion(manifestVersion) ? manifestVersion : '',
    };
  } catch {
    return {
      runtimeExists: true,
      currentVersion: '',
    };
  }
}

function managedRuntimeExists(projectRoot, adapter) {
  const candidates = [
    adapter.stateFile,
    adapter.managedRoot,
  ];

  if (adapter.hasCommands) {
    candidates.push(
      path.join(adapter.commandRoot, 'runtime-setup.md'),
      path.join(adapter.skillsRoot, 'using-spec-first', 'SKILL.md'),
    );
  } else {
    candidates.push(
      path.join(adapter.workflowsRoot, 'spec-runtime-setup', 'SKILL.md'),
      path.join(adapter.skillsRoot, 'using-spec-first', 'SKILL.md'),
    );
  }

  return candidates.some((relativePath) => {
    if (typeof relativePath !== 'string' || relativePath.length === 0) {
      return false;
    }
    return fs.existsSync(path.join(projectRoot, relativePath));
  });
}

function isStartupReminderCooldownActive({ host, key, nowMs, cooldownMs }, options = {}) {
  const state = readStartupReminderState(host, options);
  const record = state.reminders[key];
  if (!record || typeof record.shownAt !== 'string') {
    return false;
  }

  const shownAtMs = Date.parse(record.shownAt);
  if (!Number.isFinite(shownAtMs)) {
    return false;
  }
  if (shownAtMs > nowMs) {
    return false;
  }

  return nowMs - shownAtMs < cooldownMs;
}

function claimStartupVersionReminderAttempt({ host, nowMs, cooldownMs }, options = {}) {
  return claimReminderAttempt({
    statePath: getStartupReminderStatePath(host, options),
    scope: buildStartupAttemptScope(host),
    nowMs,
    cooldownMs,
  });
}

function claimCliVersionReminderAttempt({ nowMs, cooldownMs }, options = {}) {
  return claimReminderAttempt({
    statePath: getCliVersionReminderStatePath(options),
    scope: CLI_VERSION_REMINDER_SCOPE,
    nowMs,
    cooldownMs,
  });
}

// 查询结果回写：成功消耗完整冷却窗口，失败只依赖短重试窗口。
// 回写失败静默（下次按 attemptedAt 走保守路径），不影响主命令。
function markCliVersionReminderOutcome(succeeded, options = {}) {
  markReminderOutcome(
    getCliVersionReminderStatePath(options),
    CLI_VERSION_REMINDER_SCOPE,
    succeeded,
    options,
  );
}

function markStartupReminderOutcome(host, succeeded, options = {}) {
  try {
    markReminderOutcome(
      getStartupReminderStatePath(host, options),
      buildStartupAttemptScope(host),
      succeeded,
      options,
    );
  } catch {
    // startup 提醒的结果回写失败不应让 hook 非零退出。
  }
}

function markReminderOutcome(statePath, scope, succeeded, options = {}) {
  const lockPath = getReminderAttemptLockPath(statePath, scope);
  const lockStatus = acquireReminderAttemptLock(lockPath);
  if (lockStatus !== 'acquired') {
    return;
  }
  const nowMs = Number.isFinite(options.nowMs) ? options.nowMs : Date.now();
  try {
    const state = readReminderStateFile(statePath);
    const previous = state.attempts[scope] || {};
    state.attempts[scope] = {
      scope,
      attemptedAt: previous.attemptedAt || new Date(nowMs).toISOString(),
      lastOutcome: succeeded ? 'success' : 'failed',
      lastOutcomeAt: new Date(nowMs).toISOString(),
    };
    writeReminderStateFile(statePath, state);
  } catch {
    // 结果回写失败不阻塞提醒输出。
  } finally {
    releaseReminderAttemptLock(lockPath);
  }
}

function claimReminderAttempt({ statePath, scope, nowMs, cooldownMs }) {
  const lockPath = getReminderAttemptLockPath(statePath, scope);
  const lockStatus = acquireReminderAttemptLock(lockPath);
  if (lockStatus === 'busy') {
    return false;
  }
  if (lockStatus === 'unavailable') {
    return true;
  }

  try {
    const state = readReminderStateFile(statePath);
    if (isReminderAttemptCooldownActive({ state, scope, nowMs, cooldownMs })) {
      return false;
    }
    recordReminderAttempt(state, { scope, nowMs });
    writeReminderStateFile(statePath, state);
    return true;
  } catch {
    return true;
  } finally {
    releaseReminderAttemptLock(lockPath);
  }
}

function acquireReminderAttemptLock(lockPath) {
  try {
    fs.mkdirSync(path.dirname(lockPath), { recursive: true });
    fs.mkdirSync(lockPath);
    return 'acquired';
  } catch (error) {
    if (!error || error.code !== 'EEXIST') {
      return 'unavailable';
    }
  }

  if (!isReminderAttemptLockStale(lockPath)) {
    return 'busy';
  }

  try {
    fs.rmSync(lockPath, { recursive: true, force: true });
    fs.mkdirSync(lockPath);
    return 'acquired';
  } catch {
    return 'busy';
  }
}

function isReminderAttemptLockStale(lockPath) {
  try {
    const stat = fs.statSync(lockPath);
    return Date.now() - stat.mtimeMs > REMINDER_ATTEMPT_LOCK_STALE_MS;
  } catch {
    return false;
  }
}

function releaseReminderAttemptLock(lockPath) {
  try {
    fs.rmSync(lockPath, { recursive: true, force: true });
  } catch {
    // lock 目录清理失败不应影响真实 CLI 命令。
  }
}

function isReminderAttemptCooldownActive({ state, scope, nowMs, cooldownMs }) {
  const record = state.attempts[scope];
  if (!record || typeof record.attemptedAt !== 'string') {
    return false;
  }

  const attemptedAtMs = Date.parse(record.attemptedAt);
  if (!Number.isFinite(attemptedAtMs)) {
    return false;
  }
  if (attemptedAtMs > nowMs) {
    return false;
  }

  // 上一次查询成功（或旧格式无结果字段）→ 完整冷却窗口；
  // 上一次查询失败 → 只锁短重试窗口，网络抖动不制造长时间盲区。
  // 基准取 max(attemptedAt, lastOutcomeAt)：claim 时刻必须锚定冷却起点，
  // 否则 A 进程 claim 后、outcome 回写前，B 进程会因旧成功窗口刚过期而
  // 重复 claim（互斥回归）；max 同时把伪造的未来 lastOutcomeAt 楔死风险
  // 与 attemptedAt 守卫对齐。
  const outcomeCooldownMs = record.lastOutcome === 'failed'
    ? REMINDER_FAILURE_RETRY_MS
    : cooldownMs;
  const outcomeAtMs = Date.parse(record.lastOutcomeAt);
  const referenceMs = record.lastOutcome === 'failed'
    ? attemptedAtMs
    : Math.max(attemptedAtMs, Number.isFinite(outcomeAtMs) ? outcomeAtMs : 0);
  if (referenceMs > nowMs) {
    return false;
  }
  return nowMs - referenceMs < outcomeCooldownMs;
}

function recordStartupReminderCooldown(reminder, options = {}) {
  try {
    const state = readStartupReminderState(reminder.host, options);
    state.reminders[reminder.key] = {
      host: reminder.host,
      currentVersion: reminder.currentVersion,
      latestVersion: reminder.latestVersion,
      shownAt: new Date(reminder.nowMs).toISOString(),
    };
    writeStartupReminderState(reminder.host, state, options);
  } catch {
    // Reminder output is more important than cache persistence.
  }
}

function recordReminderAttempt(state, { scope, nowMs }) {
  const previous = state.attempts[scope];
  state.attempts[scope] = {
    scope,
    attemptedAt: new Date(nowMs).toISOString(),
    // 保留上次结果：查询失败不应消耗 24h 成功冷却窗口。
    lastOutcome: previous && previous.lastOutcome,
    lastOutcomeAt: previous && previous.lastOutcomeAt,
  };
}

function shouldSkipCliVersionReminder(options = {}) {
  if (isVersionReminderOptedOut(options)) {
    return true;
  }
  if (isTruthyEnvValue(resolveEnvValue('CI', options))) {
    return true;
  }
  const env = options.env || process.env;
  // 测试与提权环境不查网络、不打提醒（对齐 update-notifier 基线）。
  // SUDO_UID 按存在性判断：sudo 子进程内其值可为 '0'，存在即提权标记。
  if (env && (env.NODE_ENV === 'test' || Object.prototype.hasOwnProperty.call(env, 'SUDO_UID'))) {
    return true;
  }

  const output = options.output || process.stderr;
  // Node streams report `undefined` when piped, not just `false`; network
  // version checks must stay out of every non-interactive invocation.
  return output && output.isTTY !== true;
}

function isVersionReminderOptedOut(options = {}) {
  return isTruthyEnvValue(resolveEnvValue(VERSION_REMINDER_OPT_OUT_ENV, options));
}

function resolveEnvValue(name, options = {}) {
  const env = options.env || process.env;
  return env && Object.prototype.hasOwnProperty.call(env, name)
    ? env[name]
    : undefined;
}

function isTruthyEnvValue(value) {
  if (typeof value !== 'string') {
    return Boolean(value);
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  return normalized !== '0' && normalized !== 'false' && normalized !== 'no' && normalized !== 'off';
}

function clearStartupVersionReminderCooldown(options = {}) {
  const host = normalizeHost(options.host);
  if (!host) {
    return false;
  }

  try {
    const statePath = getStartupReminderStatePath(host, options);
    fs.rmSync(statePath, { force: true });
    clearReminderAttemptLock(statePath, buildStartupAttemptScope(host));
    return true;
  } catch {
    return false;
  }
}

function clearCliVersionReminderCooldown(options = {}) {
  try {
    const statePath = getCliVersionReminderStatePath(options);
    fs.rmSync(statePath, { force: true });
    clearReminderAttemptLock(statePath, CLI_VERSION_REMINDER_SCOPE);
    return true;
  } catch {
    return false;
  }
}

function readStartupReminderState(host, options = {}) {
  return readReminderStateFile(getStartupReminderStatePath(host, options));
}

function writeStartupReminderState(host, state, options = {}) {
  const statePath = getStartupReminderStatePath(host, options);
  writeReminderStateFile(statePath, state);
}

function readReminderStateFile(statePath) {
  try {
    if (!fs.existsSync(statePath)) {
      return createEmptyReminderState();
    }
    const parsed = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    return normalizeReminderState(parsed);
  } catch {
    return createEmptyReminderState();
  }
}

function getReminderAttemptLockPath(statePath, scope) {
  return `${statePath}.${scope.replace(/[^a-zA-Z0-9._-]/g, '_')}.lock`;
}

function clearReminderAttemptLock(statePath, scope) {
  fs.rmSync(getReminderAttemptLockPath(statePath, scope), { recursive: true, force: true });
}

function normalizeReminderState(parsed) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return createEmptyReminderState();
  }
  const reminders = parsed.reminders && typeof parsed.reminders === 'object' && !Array.isArray(parsed.reminders)
    ? parsed.reminders
    : {};
  const attempts = parsed.attempts && typeof parsed.attempts === 'object' && !Array.isArray(parsed.attempts)
    ? parsed.attempts
    : {};
  return { reminders, attempts };
}

function createEmptyReminderState() {
  return {
    reminders: {},
    attempts: {},
  };
}

function writeReminderStateFile(statePath, state) {
  const tmpPath = `${statePath}.${process.pid}.${Date.now()}.tmp`;
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  try {
    fs.writeFileSync(tmpPath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
    fs.renameSync(tmpPath, statePath);
  } catch (error) {
    try {
      fs.rmSync(tmpPath, { force: true });
    } catch {
      // Best-effort cleanup only.
    }
    throw error;
  }
}

function getStartupReminderStatePath(host, options = {}) {
  const homeRoot = options.homeRoot
    || getDefaultHomeRoot();
  return path.join(homeRoot, `.${host}`, 'spec-first', 'startup-version-reminder.json');
}

function getCliVersionReminderStatePath(options = {}) {
  const homeRoot = options.homeRoot
    || getDefaultHomeRoot();
  return path.join(homeRoot, '.spec-first', 'version-reminder.json');
}

function getDefaultHomeRoot() {
  try {
    const userInfo = os.userInfo();
    if (userInfo && typeof userInfo.homedir === 'string' && userInfo.homedir.length > 0) {
      return userInfo.homedir;
    }
  } catch {
    // Fall back to Node's standard home resolution when userInfo is unavailable.
  }

  return os.homedir();
}

function buildStartupReminderKey({ host, currentVersion, latestVersion }) {
  return [host, currentVersion, latestVersion].join('|');
}

function buildStartupAttemptScope(host) {
  return `startup.${host}`;
}

function normalizeHost(host) {
  return Object.prototype.hasOwnProperty.call(STARTUP_HOST_LABELS, host) ? host : '';
}

async function defaultLookupLatestVersion(packageName, options = {}) {
  const override = normalizeOverride(process.env.SPEC_FIRST_VERSION_REMINDER_LATEST);
  if (override) {
    return override;
  }

  const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : resolveVersionReminderTimeoutMs();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      `https://registry.npmjs.org/${encodeURIComponent(packageName)}/latest`,
      {
        headers: {
          accept: 'application/json',
        },
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      return '';
    }

    const payload = await response.json().catch(() => null);
    return payload && typeof payload.version === 'string'
      ? payload.version.trim()
      : '';
  } catch {
    return '';
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeOverride(value) {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : '';
}

function compareVersions(left, right) {
  const parsedLeft = parseVersion(left);
  const parsedRight = parseVersion(right);

  if (!parsedLeft || !parsedRight) {
    return null;
  }

  const core = compareCore(parsedLeft, parsedRight);
  if (core !== 0) {
    return core;
  }

  return comparePrerelease(parsedLeft.prerelease, parsedRight.prerelease);
}

function compareCore(left, right) {
  if (left.major !== right.major) {
    return left.major < right.major ? -1 : 1;
  }

  if (left.minor !== right.minor) {
    return left.minor < right.minor ? -1 : 1;
  }

  if (left.patch !== right.patch) {
    return left.patch < right.patch ? -1 : 1;
  }

  return 0;
}

function comparePrerelease(left, right) {
  if (left.length === 0 && right.length === 0) {
    return 0;
  }

  if (left.length === 0) {
    return 1;
  }

  if (right.length === 0) {
    return -1;
  }

  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const leftPart = left[index];
    const rightPart = right[index];

    if (leftPart === undefined) {
      return -1;
    }

    if (rightPart === undefined) {
      return 1;
    }

    const leftNumeric = isNumericIdentifier(leftPart);
    const rightNumeric = isNumericIdentifier(rightPart);

    if (leftNumeric && rightNumeric) {
      const leftValue = Number(leftPart);
      const rightValue = Number(rightPart);
      if (leftValue !== rightValue) {
        return leftValue < rightValue ? -1 : 1;
      }
      continue;
    }

    if (leftNumeric && !rightNumeric) {
      return -1;
    }

    if (!leftNumeric && rightNumeric) {
      return 1;
    }

    if (leftPart !== rightPart) {
      return leftPart < rightPart ? -1 : 1;
    }
  }

  return 0;
}

function parseVersion(input) {
  if (typeof input !== 'string') {
    return null;
  }

  const normalized = input.trim().replace(/^v/, '');
  if (!normalized) {
    return null;
  }

  const [coreWithBuild] = normalized.split('+');
  const [core, prerelease = ''] = coreWithBuild.split('-', 2);
  const parts = core.split('.');
  if (parts.length !== 3) {
    return null;
  }

  const numericParts = parts.map((part) => {
    if (!/^(0|[1-9]\d*)$/.test(part)) {
      return null;
    }
    return Number(part);
  });

  if (numericParts.some((part) => part === null)) {
    return null;
  }

  const prereleaseParts = prerelease
    ? prerelease.split('.').filter((part) => part.length > 0)
    : [];

  return {
    major: numericParts[0],
    minor: numericParts[1],
    patch: numericParts[2],
    prerelease: prereleaseParts,
  };
}

function isNumericIdentifier(value) {
  return /^(0|[1-9]\d*)$/.test(value);
}

module.exports = {
  DEFAULT_VERSION_REMINDER_TIMEOUT_MS,
  buildStartupVersionReminder,
  clearCliVersionReminderCooldown,
  clearStartupVersionReminderCooldown,
  compareVersions,
  defaultLookupLatestVersion,
  detectInstallChannels,
  formatStartupVersionReminder,
  formatUpgradeGuidance,
  formatVersionReminder,
  isVersionReminderOptedOut,
  maybeShowVersionReminder,
  maybeShowStartupVersionReminder,
  parseVersion,
  resolveVersionReminderTimeoutMs,
  shouldSkipCliVersionReminder,
  shouldNotifyVersionReminder,
};
