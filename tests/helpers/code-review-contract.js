'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../skills/spec-code-review');
const phaseFiles = [
  'modes-and-output.md',
  'scope.md',
  'intent-and-plan.md',
  'select-and-route.md',
  'dispatch-reviewers.md',
  'finish-review.md',
  'action-class-rubric.md',
];

function readCodeReviewContract() {
  return [
    fs.readFileSync(path.join(root, 'SKILL.md'), 'utf8'),
    ...phaseFiles.map(file => fs.readFileSync(path.join(root, 'references', file), 'utf8')),
  ].join('\n');
}

module.exports = { readCodeReviewContract, phaseFiles };
