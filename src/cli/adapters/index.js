const ClaudeAdapter = require('./claude');
const CodexAdapter = require('./codex');
const CursorAdapter = require('./cursor');
const KiroAdapter = require('./kiro');
const QoderAdapter = require('./qoder');
const OpenCodeAdapter = require('./opencode');
const { PLATFORM_REGISTRY } = require('./platform-registry');

const adapters = {
  claude: new ClaudeAdapter(),
  codex: new CodexAdapter(),
  cursor: new CursorAdapter(),
  kiro: new KiroAdapter(),
  qoder: new QoderAdapter(),
  opencode: new OpenCodeAdapter(),
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
 * Get the human-facing display name declared by the platform registry.
 * Registry-driven so adding a host cannot leave a second hardcoded name list stale.
 * @param {string} platformId - Platform identifier
 * @returns {string} Display name, falling back to the raw platform ID
 */
function getPlatformDisplayName(platformId) {
  const entry = PLATFORM_REGISTRY[platformId];
  return (entry && entry.displayName) || platformId;
}

/**
 * Hosts whose sessions can invoke `spec-first startup-reminder`: exactly the
 * platforms whose registry capabilities declare a session-start hook (confirmed
 * or degraded). Derived, not duplicated, so a new host opts in via the registry.
 * @returns {string[]} Array of platform IDs
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
