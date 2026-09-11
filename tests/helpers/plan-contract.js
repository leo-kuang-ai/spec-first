'use strict';

const fs = require('node:fs');
const path = require('node:path');

const phaseFiles = ['resume.md', 'intake.md', 'research.md', 'structure.md', 'final-review.md'];

function readPlanContract() {
  const root = path.resolve(__dirname, '../../skills/spec-plan');
  return [...phaseFiles.map(file => `references/${file}`), 'SKILL.md']
    .map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
}

module.exports = { readPlanContract, phaseFiles };
