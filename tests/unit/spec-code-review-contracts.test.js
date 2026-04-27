'use strict';

const fs = require('node:fs');
const path = require('node:path');

const SKILL_PATH = path.join(__dirname, '..', '..', 'skills', 'spec-code-review', 'SKILL.md');

describe('spec-code-review CRG hook contract', () => {
  test('uses before-review CRG anchor and keeps findings reviewer-owned', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');
    expect(text).toContain('spec-first crg hook before-review --since=<base>');
    expect(text).toContain('spec-first crg hook before-review --work-run=<id>');
    expect(text).toContain('spec-first crg workspace context');
    expect(text).toContain('choose the child repo review boundary');
    expect(text).toContain('Multi-child reviews must be decomposed');
    expect(text).toContain('prioritize review, not to replace reviewer judgment');
    expect(text).not.toContain('stage0-context');
    expect(text).not.toContain('selected_assets');
  });
});

describe('spec-code-review standards resolve contract', () => {
  test('passes check.jsonl to project-standards without full-loading docs/specs or making a hard gate', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('spec-first specs resolve --target=<repo> --task="review current diff" --files="<changed files>" --consumer spec-code-review --task-id=<run-id>');
    expect(text).toContain('Pass the generated `check.jsonl` path and the `resolve-result.json` summary');
    expect(text).toContain('Do not read all of `docs/specs/**`');
    expect(text).toContain('Treat `metadata.hard_gate=false` as binding');
    expect(text).toContain('A `confidence-first 100` standards finding must quote or cite the specific loaded standard path/rule');
    expect(text).toContain('<resolved-standards-context>');
    expect(text).toContain('spec-first specs index --target=<repo>');
  });
});

describe('spec-code-review CE sync contracts', () => {
  test('uses tmp run artifacts and best-judgment routing without bulk preview', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');
    const bulkPreview = fs.readFileSync(
      path.join(__dirname, '..', '..', 'skills', 'spec-code-review', 'references', 'bulk-preview.md'),
      'utf8',
    );
    const walkthrough = fs.readFileSync(
      path.join(__dirname, '..', '..', 'skills', 'spec-code-review', 'references', 'walkthrough.md'),
      'utf8',
    );

    expect(text).toContain('/tmp/spec-first/spec-code-review/<run-id>/');
    expect(text).not.toContain('.spec-first/workflows/spec:code-review');
    expect(text).toContain('Auto-resolve with best judgment — apply per-finding fixes the agent can defend, surface the rest');
    expect(text).toContain('No Stage 5b validator pre-pass. No bulk-preview approval gate.');
    expect(text).toContain('post-run failure-handling question');
    expect(text).toContain('no issue tracker is configured for this checkout');
    expect(text).not.toContain('tracker sink');

    expect(bulkPreview).toContain('One call site');
    expect(bulkPreview).toContain('Routing option C (top-level File tickets)');
    expect(bulkPreview).toContain('Best-judgment fix paths do **not** use this preview.');
    expect(bulkPreview).not.toContain('Routing option B (top-level');

    expect(walkthrough).toContain('No `suggested_fix`:');
    expect(walkthrough).toContain('hide option A (`Apply the proposed fix`)');
    expect(walkthrough).toContain('Do not run Stage 5b and do not call `bulk-preview.md` for this path.');
    expect(walkthrough).toContain('There is no second dispatch in that branch.');
    expect(walkthrough).not.toContain('Auto-resolve with best judgment on the rest → Proceed');
    expect(walkthrough).not.toContain('Auto-resolve with best judgment on the rest → Cancel');
    expect(walkthrough).toContain('Walk-through bailed via `Auto-resolve with best judgment on the rest`');
    expect(walkthrough).not.toContain('Walk-through bailed via `Auto-resolve with best judgment on the rest → Proceed`');
  });

  test('schema and subagent template push reviewers to provide defensible suggested fixes', () => {
    const schema = fs.readFileSync(
      path.join(__dirname, '..', '..', 'skills', 'spec-code-review', 'references', 'findings-schema.json'),
      'utf8',
    );
    const template = fs.readFileSync(
      path.join(__dirname, '..', '..', 'skills', 'spec-code-review', 'references', 'subagent-template.md'),
      'utf8',
    );

    expect(schema).toContain('safe_auto = local mechanical fix');
    expect(schema).toContain('The wrong-side cost is symmetric');
    expect(schema).toContain('bias toward safe_auto when the rubric permits');
    expect(schema).toContain('no change to function signature, public-API/error contract, security posture, or permission model');
    expect(schema).toContain('helper extraction, naming/placement must follow mechanically');
    expect(schema).toContain('Propose one whenever any defensible code change is reachable');
    expect(schema).toContain('I need <specific input> to commit');
    expect(template).toContain('you can articulate the fix in one sentence');
    expect(template).toContain('Boundary cases that often feel risky but are still `safe_auto`');
    expect(template).toContain('A nil guard that turns a crash into a nil-return is `safe_auto`');
    expect(template).toContain('The "I need `<specific input>` before I can commit" framing is a soft punt');
    expect(template).toContain('Pair `manual` with a concrete `suggested_fix` whenever you can defend one');
    expect(template).toContain('Imperfect information is not grounds for omission');
  });

  test('tracker defer references keep the tracker confidence tuple consistent', () => {
    const files = [
      path.join(__dirname, '..', '..', 'skills', 'spec-code-review', 'references', 'tracker-defer.md'),
      path.join(__dirname, '..', '..', 'skills', 'spec-work', 'references', 'tracker-defer.md'),
      path.join(__dirname, '..', '..', 'skills', 'spec-work-beta', 'references', 'tracker-defer.md'),
      path.join(__dirname, '..', '..', 'skills', 'lfg', 'references', 'tracker-defer.md'),
    ];

    for (const filePath of files) {
      const text = fs.readFileSync(filePath, 'utf8');

      expect(text).toContain('{ tracker_name, confidence, named_sink_available, any_sink_available }');
      expect(text).toContain('confidence = high');
      expect(text).toContain('confidence = low');
      expect(text).not.toContain('confidence-first');
      expect(text).not.toContain('tracker_confidence');
    }
  });

  test('bulk preview remains option-C only after best-judgment migration', () => {
    const bulkPreview = fs.readFileSync(
      path.join(__dirname, '..', '..', 'skills', 'spec-code-review', 'references', 'bulk-preview.md'),
      'utf8',
    );

    expect(bulkPreview).toContain('One call site');
    expect(bulkPreview).toContain('Options (exactly two for routing option C)');
    expect(bulkPreview).not.toContain('in all three cases');
  });
});
