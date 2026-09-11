'use strict';

const fs = require('node:fs');
const path = require('node:path');

const phaseFiles = [
  'modes.md', 'research.md', 'session-history.md', 'assembly.md',
  'enhancement.md', 'promotion.md', 'refresh-and-discoverability.md',
  'lightweight.md', 'report.md',
];

function readCompoundContract() {
  const root = path.resolve(__dirname, '../../skills/spec-compound');
  return ['SKILL.md', ...phaseFiles.map(file => `references/${file}`)]
    .map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
}

module.exports = { readCompoundContract, phaseFiles };
