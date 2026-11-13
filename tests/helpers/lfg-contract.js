'use strict';

const fs = require('node:fs');
const path = require('node:path');

const phaseFiles = ['plan-brief.md', 'work-return.md', 'review-followup.md', 'stage-routing.md', 'shipping-tail.md', 'task-visibility.md'];

function readLfgContract() {
  const root = path.resolve(__dirname, '../../skills/spec-lfg');
  return ['SKILL.md', ...phaseFiles.map(file => `references/${file}`)]
    .map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
}

module.exports = { readLfgContract, phaseFiles };
