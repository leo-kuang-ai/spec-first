const ClaudeAdapter = require('./claude');
const CodexAdapter = require('./codex');
const CursorAdapter = require('./cursor');
const KiroAdapter = require('./kiro');
const QoderAdapter = require('./qoder');
const OpenCodeAdapter = require('./opencode');
const ZcodeAdapter = require('./zcode');
const PiAdapter = require('./pi');
const { PLATFORM_REGISTRY } = require('./platform-registry');

const adapters = {
  claude: new ClaudeAdapter(),
  codex: new CodexAdapter(),
  cursor: new CursorAdapter(),
  kiro: new KiroAdapter(),
  qoder: new QoderAdapter(),
  opencode: new OpenCodeAdapter(),
  zcode: new ZcodeAdapter(),
  pi: new PiAdapter(),
};

/**
 * Get platform adapter by ID
 * @param {string} platformId - Platform identifier
 * @returns {PlatformAdapter} Platform adapter instance
 * @throws {Error} If platform is unknown
 */
function getAdapter(platformId) {
  const adapter = adapters[platformId];
  if (!adapter) {
    throw new Error(`Unknown platform: ${platformId}`);
  }
  return adapter;
}

/**
 * Get list of supported platforms
 * @returns {string[]} Array of platform IDs
 */
function getSupportedPlatforms() {
  return Object.keys(adapters);
}

/**
 * 取 registry 声明的宿主显示名。registry 派生，新增宿主不会留下第二份
 * 硬编码名单失同步。
 * @param {string} platformId - 平台标识
 * @returns {string} 显示名，缺失时回退原始平台 ID
 */
function getPlatformDisplayName(platformId) {
  const entry = PLATFORM_REGISTRY[platformId];
  return (entry && entry.displayName) || platformId;
}

/**
 * 会话可调用 `spec-first startup-reminder` 的宿主：恰为 registry capabilities
 * 声明了 session-start hook（confirmed 或 degraded）的平台。派生而非复制，
 * 新宿主经 registry 自动加入。
 * @returns {string[]} 平台 ID 数组
 */
function getStartupReminderHosts() {
  return getSupportedPlatforms().filter((platformId) => {
    const hooks = PLATFORM_REGISTRY[platformId]
      && PLATFORM_REGISTRY[platformId].capabilities
      && PLATFORM_REGISTRY[platformId].capabilities.hooks;
    return Boolean(hooks && hooks.sessionStart && hooks.sessionStart.status !== 'not-supported');
  });
}

module.exports = {
  getAdapter,
  getPlatformDisplayName,
  getStartupReminderHosts,
  getSupportedPlatforms,
};
