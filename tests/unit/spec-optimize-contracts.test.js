'use strict';

const fs = require('node:fs');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

describe('spec-optimize contracts', () => {
  test('uses validation_rules as the full optimization spec validation source of truth', () => {
    const skill = read('skills/spec-optimize/SKILL.md');
    const schema = read('skills/spec-optimize/references/optimize-spec-schema.yaml');

    expect(schema).toContain('validation_rules:');
    expect(schema).toContain('If parallel.exclusive_resources is non-empty');
    expect(schema).toContain('If metric.judge.singleton_sample > 0');
    expect(schema).toContain('stopping must have at least one non-default criterion or use defaults');

    expect(skill).toMatch(/Validate the spec against \*\*every\*\* rule in the `validation_rules` section/);
    expect(skill).toContain('single source of truth');
    expect(skill).toContain('do not rely on a remembered subset');
    expect(skill).toContain('exclusive-resource serial execution');
    expect(skill).toContain('singleton-rubric requirements');
    expect(skill).toContain('stopping criteria');
  });

  test('preserves CE optimization-loop dispatch and wrap-up safeguards', () => {
    const skill = read('skills/spec-optimize/SKILL.md');
    const repoResearcher = read('skills/spec-optimize/references/agents/repo-research-analyst.md');
    const judgePrompt = read('skills/spec-optimize/references/judge-prompt-template.md');

    expect(skill).toContain('judge sub-agents using the same bounded dispatch as Phase 3.2');
    expect(skill).toContain('treat a capacity error as backpressure');
    expect(skill).toContain('These judge sub-agents are a separate budget from the experiment worktrees.');
    expect(skill).toContain('**Mechanical-apply bar:** apply any finding with a concrete `suggested_fix`');
    expect(skill).toContain('Do not commit or push from this step');
    expect(skill).toContain('spec-code-review');
    expect(skill).toContain('spec-compound');

    expect(repoResearcher).toContain('Return only findings that change the plan');
    expect(judgePrompt).toContain('High confidence (4-5) means you are very sure. Low confidence (1-2) means the item is borderline.');
    expect(judgePrompt).not.toContain('confidence-first');
  });
});
