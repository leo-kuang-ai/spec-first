'use strict';

const fs = require('node:fs');
const path = require('node:path');

const phaseFiles = ['interaction-rules.md', 'output-mode.md', 'phase-0.md', 'dialogue.md', 'approaches.md', 'plan-write.md'];

function readBrainstormContract() {
  const root = path.resolve(__dirname, '../../skills/spec-brainstorm');
  return ['SKILL.md', ...phaseFiles.map(file => `references/${file}`)]
    .map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
}

module.exports = { readBrainstormContract, phaseFiles };
