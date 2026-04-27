'use strict';

const fs = require('node:fs');
const path = require('node:path');

const SKILL_PATH = path.join(__dirname, '..', '..', 'skills', 'spec-plan', 'SKILL.md');
const REQUIREMENTS_CAPTURE_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-brainstorm',
  'references',
  'requirements-capture.md',
);
const DEEPENING_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-plan',
  'references',
  'deepening-workflow.md',
);

describe('spec-plan CRG hook contract', () => {
  test('uses a thin before-plan CRG anchor and preserves LLM decision boundary', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');
    expect(text).toContain('spec-first crg hook before-plan');
    expect(text).toContain('spec-first crg workspace context');
    expect(text).toContain('LLM/user choose the child repo boundary');
    expect(text).toContain('decompose it into explicit sequential repo-local plans/runs');
    expect(text).toContain('LLM still selects the candidate change surface');
    expect(text).toContain('direct repo reads');
    expect(text).not.toContain('stage0-context');
    expect(text).not.toContain('selected_assets');
  });
});

describe('spec-plan standards resolve contract', () => {
  test('uses indexed standards as optional planning input without full-loading or hard gates', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('Standards Resolve Context (Optional)');
    expect(text).toContain('docs/specs/_index/specs-index.json');
    expect(text).toContain('spec-first specs resolve --target=<repo> --task="<planning context summary>" --consumer spec-plan --task-id=<plan-or-spec-id>');
    expect(text).toContain('Do not read all of `docs/specs/**`');
    expect(text).toContain('Treat `metadata.hard_gate=false` as binding');
    expect(text).toContain('spec-first specs index --target=<repo>');
    expect(text).toContain('Do not block planning');
  });
});

describe('spec_id planning contract', () => {
  test('requirements capture creates a local spec chain identity without a registry', () => {
    const text = fs.readFileSync(REQUIREMENTS_CAPTURE_PATH, 'utf8');

    expect(text).toContain('spec_id: YYYY-MM-DD-NNN-<kebab-case-topic>');
    expect(text).toContain('docs/brainstorms/YYYY-MM-DD-NNN-<slug>-requirements.md');
    expect(text).toContain('Ignore legacy non-sequenced files when choosing the next number');
    expect(text).toContain('not a central registry');
    expect(text).toContain('frontmatter is the machine-readable contract');
  });

  test('plan inherits spec_id, handles legacy origins, and preserves chain boundaries', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('Preserve it exactly in the plan frontmatter');
    expect(text).toContain('Generate a new plan-local `spec_id`');
    expect(text).toContain('origin identity was not inherited');
    expect(text).toContain('scan `docs/brainstorms/`, `docs/plans/`, and `docs/tasks/` frontmatter');
    expect(text).toContain('If the same `spec_id` already exists');
    expect(text).toContain('alternative implementation plans, independent delivery chains, or abandon-and-replace work');
    expect(text).toContain('spec_id: YYYY-MM-DD-NNN-<slug>');
    expect(text).toContain('origin: docs/brainstorms/YYYY-MM-DD-NNN-<slug>-requirements.md');
  });

  test('deepening preserves spec_id rather than creating a new chain', () => {
    const text = fs.readFileSync(DEEPENING_PATH, 'utf8');

    expect(text).toContain('deepening strengthens the same plan and must preserve it');
    expect(text).toContain('Preserve the existing `spec_id` frontmatter value');
    expect(text).toContain('Use a new `spec_id` only when deliberately creating a new spec chain outside the deepening path');
  });
});
