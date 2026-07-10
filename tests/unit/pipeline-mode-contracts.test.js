'use strict';

const fs = require('node:fs');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

describe('pipeline mode contracts', () => {
  test('spec-commit-push-pr defines mode:pipeline as non-interactive', () => {
    const skill = read('skills/spec-commit-push-pr/SKILL.md');

    expect(skill).toContain('argument-hint: "[PR ref] [mode:pipeline] [archive:on|off]"');
    expect(skill).toMatch(/\*\*`mode:pipeline` modifier:\*\*[\s\S]*orchestrated callers such as `spec-lfg`/);
    expect(skill).toMatch(/\*\*`mode:pipeline` modifier:\*\*[\s\S]*suppress every blocking ask/);
    expect(skill).toMatch(/\*\*`mode:pipeline` modifier:\*\*[\s\S]*existing-PR rewrite question defaults to \*\*not rewriting\*\*/);
  });

  test('spec-test-browser keeps pipeline mode unattended through human verification and failures', () => {
    const skill = read('skills/spec-test-browser/SKILL.md');
    const pipelineReference = read('skills/spec-test-browser/references/pipeline-orchestration.md');

    expect(skill).toContain('argument-hint: "[PR number, branch name, \'current\', --port PORT, or mode:pipeline]"');
    expect(pipelineReference).toContain('human verification pauses');
    expect(pipelineReference).toContain('failure-handling prompts');
    expect(skill).toMatch(/Human Verification \(When Required\)[\s\S]*\*\*Pipeline mode:\*\* do not pause; log each such flow as `Skip` with the reason and continue/);
    expect(skill).toMatch(/Handle Failures[\s\S]*\*\*pipeline mode:\*\* do not ask how to proceed; capture the error screenshot and repro steps, log the failure, and continue/);
  });
});
