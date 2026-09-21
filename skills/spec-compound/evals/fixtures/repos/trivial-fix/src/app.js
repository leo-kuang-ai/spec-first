// The fix renamed the misspelled key `entrypont` -> `entrypoint`.
// The mapping is a direct one-line read; nothing about the original
// investigation survives only in this comment.
module.exports = require('./config-loader.js').load(require('../package.json').entrypoint);
