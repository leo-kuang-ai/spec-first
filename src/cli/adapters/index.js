const ClaudeAdapter = require('./claude');
const CodexAdapter = require('./codex');
const KiroAdapter = require('./kiro');

const adapters = {
  claude: new ClaudeAdapter(),
  codex: new CodexAdapter(),
  kiro: new KiroAdapter(),
};

/**
 * Get platform adapter by ID
 * @param {string} platformId - Platform identifier ('claude', 'codex', or 'kiro')
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

module.exports = {
  getAdapter,
  getSupportedPlatforms,
};
