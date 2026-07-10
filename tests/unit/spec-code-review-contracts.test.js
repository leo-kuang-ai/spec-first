'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');
const skill = fs.readFileSync(path.join(repoRoot, 'skills/spec-code-review/SKILL.md'), 'utf8');
const deploymentPrompt = fs.readFileSync(
  path.join(repoRoot, 'skills/spec-code-review/references/personas/deployment-verification-agent.md'),
  'utf8',
);

describe('spec-code-review current contracts', () => {
  test('mode:agent is JSON report-only and never applies fixes', () => {
    expect(skill).toContain('**Report-only**: return **JSON**');
    expect(skill).toContain('In **`mode:agent`** it never mutates the tree');
    expect(skill).toContain('### Stage 5c: Act on findings (default mode only)');
    expect(skill).toContain('**Skip entirely in `mode:agent`**');
  });

  test('deployment verification requires executable evidence per item', () => {
    expect(deploymentPrompt).toContain(
      'Every checklist item must name the command or observable signal that proves the step succeeded.',
    );
  });

  test('prompt assets are skill-local', () => {
    expect(skill).toContain('Read the prompt file from `references/personas/`');
    expect(fs.existsSync(path.join(repoRoot, 'agents/spec-pr-comment-resolver.agent.md'))).toBe(false);
  });
});
