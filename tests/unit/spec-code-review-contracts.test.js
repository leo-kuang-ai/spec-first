'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { getAdapter } = require('../../src/cli/adapters');

const SKILL_PATH = path.join(__dirname, '..', '..', 'skills', 'spec-code-review', 'SKILL.md');

function renderWorkflowSkill(platform) {
  const adapter = getAdapter(platform);
  return adapter.transformSkillContent(fs.readFileSync(SKILL_PATH, 'utf8'), {
    skillName: 'spec-code-review',
    isWorkflowSkill: true,
  });
}

describe('spec-code-review frontmatter trigger contract', () => {
  test('description distinguishes code review from docs, work, planning, and shipping', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');
    const frontmatter = text.match(/^---\n([\s\S]*?)\n---/)[1];

    expect(frontmatter).toContain('code diffs, PRs, or branch implementation changes');
    expect(frontmatter).toContain('requirements/plan/task-pack document review');
    expect(frontmatter).toContain('implementation execution');
    expect(frontmatter).toContain('planning unresolved work');
    expect(frontmatter).toContain('commit/push/PR creation');
  });
});

describe('spec-code-review context orientation contract', () => {
  test('starts from diff evidence and keeps findings reviewer-owned', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');
    expect(text).toContain('Context Orientation Anchor');
    expect(text).toContain('diff scope');
    expect(text).toContain('plan/task/work artifacts when present');
    expect(text).toContain('already-loaded host/project instructions');
    expect(text).toContain('not automatic re-read targets for every review run');
    expect(text).toContain('Stage 3b is the narrow project-standards persona exception');
    expect(text).toContain('nearby implementation files');
    expect(text).toContain('nearby tests');
    expect(text).toContain('Use direct diff reads, source reads, `rg`, ast-grep, package/test facts, logs, and user-provided artifacts');
    expect(text).toContain('If a claimed impact surface cannot be confirmed from bounded direct evidence');
    expect(text).toContain('record it as residual risk or a test candidate');
    expect(text).toContain('External tools may prioritize inspection, but they do not define scope authority or replace reviewer judgment');
    expect(text).toContain('group changed files by Git repo');
    expect(text).toContain('risk assessments scoped to the repo that owns the file');
    expect(text).toContain('direct evidence per child repo');
    expect(text).toContain('direct evidence targets instead of external-tool calls');
    expect(text).toContain('not external-tool output alone');
    expect(text).toContain('Autofix review must not edit a child repo unless that repo is explicit');
    expect(text).toContain('risk assessments scoped to the repo that owns the file');
    expect(text).toContain('Discover project standards paths');
    expect(text).toContain('find all `**/CLAUDE.md` and `**/AGENTS.md` in the repo');
    expect(text).toContain('If `docs/contracts/team-standards.md` exists, include that contract and `docs/standards/index.md` in the path list');
    expect(text).toContain('select only `trust=confirmed,lifecycle_state=active`, scope-matched rule files from `docs/standards/**`');
    expect(text).toContain('must not receive or read the full standards corpus by default');
    expect(text).toContain('Pass the resulting path list to the `project-standards` persona inside a `<standards-paths>` block');
    expect(text).not.toContain('docs/examples/standards-glue-consumption-examples.md');
    expect(text).not.toContain('.spec-first/standards/');
    expect(text).not.toContain('<standards-baseline-paths>');
    expect(text).not.toContain('stage0-context');
    expect(text).not.toContain('selected_assets');
  });

  test('consumes domain context before findings without fixed ADR directory mandates', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('Domain Language And Decision Ledger');
    expect(text).toContain('consume existing context before asking questions or raising gaps that repo/docs can answer');
    expect(text).toContain('already-loaded project standards and host instructions, `docs/contracts/`, existing brainstorms/plans/solutions');
    expect(text).toContain('Read `AGENTS.md` / `CLAUDE.md` source only under the Host Instruction Reuse Policy or the Stage 3b project-standards persona exception');
    expect(text).toContain('repo-local glossary or ADR-like artifacts that actually exist');
    expect(text).toContain('Do not require a fixed `CONTEXT.md`, `docs/adr/`, or glossary directory.');
    expect(text).toContain('record the limitation in Coverage as advisory context rather than blocking the review');
    expect(text).toContain('`question`, `recommended_answer`, `source_tag`, `chosen_answer`, `consequence`, and `deferred_reason`');
    expect(text).toContain('`confirmed`, `advisory`, `session-local`, `stale`, or `user`');
    expect(text).toContain('hard to reverse, would be surprising without context, and reflects a real tradeoff');
    expect(text).not.toContain('must use `CONTEXT.md`');
    expect(text).not.toContain('must use `docs/adr/`');
  });

  test('review checks feedback loops without forcing TDD ritual on docs-only changes', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('Feedback Loop Review Boundary');
    expect(text).toContain('When reviewing behavior-bearing changes, check whether the work established and reran a feedback loop appropriate to the change');
    expect(text).toContain('failing or characterization tests, CLI invocation, HTTP/browser script, trace replay, throwaway harness, property/fuzz loop');
    expect(text).toContain('Findings should name the missing observable risk, not demand TDD ritual by default');
    expect(text).toContain('For docs-only and config-only changes, docs contract checks, schema/help/render checks, generated catalog diff checks, or diff-shape review can be sufficient verification');
    expect(text).toContain('Do not flag "no test-first loop" when the change has no behavior-bearing code');
  });

  test('stage 6 closeout uses structured verification evidence when validation is claimed', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('verification-run-summary.v1');
    expect(text).toContain('honest-closeout.v1');
    expect(text).toContain('instead of a freeform "tests passed" claim');
    expect(text).toContain('mark the closeout `degraded`');
  });
});

describe('spec-code-review compound recommendation contract', () => {
  test('final report can recommend compound only as advisory learning capture', () => {
    const skill = fs.readFileSync(SKILL_PATH, 'utf8');
    const template = fs.readFileSync(
      path.join(__dirname, '..', '..', 'skills', 'spec-code-review', 'references', 'review-output-template.md'),
      'utf8',
    );

    expect(skill).toContain('Learning Capture Recommendation');
    expect(skill).toContain('new reusable lesson worth capturing');
    expect(skill).toContain('advisory only');
    expect(skill).toContain('not a finding');
    expect(skill).toContain('not residual actionable work');
    expect(skill).toContain('not a verdict input');
    expect(skill).toContain('not an autofix item');
    expect(skill).toContain('not a merge gate');
    expect(skill).toContain('Skip silently');
    expect(skill).toContain('mechanical fixes');
    expect(skill).toContain('one-off docs edits');
    expect(skill).toContain('formatting-only changes');
    expect(skill).toContain('cannot be stated in one sentence');
    expect(skill).toContain('Offer neutrally');
    expect(skill).toContain('repeated finding pattern');
    expect(skill).toContain('reusable review heuristic');
    expect(skill).toContain('Lean into the offer');
    expect(skill).toContain('pattern appears in 3+ places');
    expect(skill).toContain('current host\'s compound entrypoint with brief context');
    expect(skill).toContain('In report-only, autofix, and headless modes, ask no questions');
    expect(skill).toContain('include at most one advisory line');
    expect(skill).toContain('Do not automatically run `spec-compound`');
    expect(skill).toContain('do not write `docs/solutions/`');
    expect(skill).toContain('do not file tickets');
    expect(skill).toContain('do not add extra prompts because of this checklist');
    expect(skill).toContain('recommend `spec-compound-refresh` only with a narrow scope hint');
    expect(skill).toContain('Learning Capture Recommendation:');
    expect(template).toContain('### Learning Capture Recommendation');
    expect(template).toContain('current host\'s compound entrypoint with brief context');
    expect(template).toContain('include only when the current review produced a new reusable lesson');
    expect(skill).not.toContain('$spec-compound-auto');
    expect(skill).not.toContain('/spec:compound-auto');
    expect(skill).not.toContain('spec-first compound-auto');
  });
});

describe('spec-code-review CE sync contracts', () => {
  test('quick review only short-circuits to a real host built-in', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('Quick Review Short-Circuit');
    expect(text).toContain('Use a real built-in only');
    expect(text).toContain('No invented fallback');
    expect(text).toContain('Codex currently has no universal slash-command review primitive');
    expect(text).toContain('quick intent falls through to the full pipeline');
  });

  test('requirements completeness reads current and legacy implementation unit formats', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('Recognize both current heading-style units (`### U1. [Name]`)');
    expect(text).toContain('legacy list-item units (`- U1. **[Name]**`)');
    expect(text).toContain('Store the extracted requirements list, implementation unit IDs/titles, and `plan_source`');
  });

  test('interactive findings tables escape literal pipe characters', () => {
    const skill = fs.readFileSync(SKILL_PATH, 'utf8');
    const template = fs.readFileSync(
      path.join(__dirname, '..', '..', 'skills', 'spec-code-review', 'references', 'review-output-template.md'),
      'utf8',
    );

    for (const text of [skill, template]) {
      expect(text).toContain('Escape every literal pipe');
      expect(text).toContain('`\\|`');
      expect(text).toContain('TypeScript union types');
    }
  });

  test('uses OS temp run artifacts and best-judgment routing without bulk preview', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');
    const bulkPreview = fs.readFileSync(
      path.join(__dirname, '..', '..', 'skills', 'spec-code-review', 'references', 'bulk-preview.md'),
      'utf8',
    );
    const walkthrough = fs.readFileSync(
      path.join(__dirname, '..', '..', 'skills', 'spec-code-review', 'references', 'walkthrough.md'),
      'utf8',
    );

    expect(text).toContain('`<review-artifact-dir>/` is a session/orchestrator handoff');
    expect(text).toContain('Resolve it under the current OS temp directory');
    expect(text).toContain('`os.tmpdir()` / `$TMPDIR` / `%TEMP%`');
    expect(text).toContain('Do not hardcode `/tmp`');
    expect(text).toContain('include the concrete path in every `Artifact:` line or structured return');
    expect(text).toContain('session/orchestrator handoff, not repo-local durable truth');
    expect(text).toContain('Do not promise it will be committed or retained.');
    expect(text).toContain('docs/residual-review-findings/<branch-or-head-sha>.md');
    expect(text).toContain('do not durable-store the full per-reviewer JSON bundle by default');
    expect(text).not.toContain('.spec-first/workflows/spec:code-review');
    expect(text).toContain('Auto-resolve with best judgment — apply per-finding fixes the agent can defend, surface the rest');
    expect(text).toContain('No Stage 5b validator pre-pass. No bulk-preview approval gate.');
    expect(text).toContain('post-run failure-handling question');
    expect(text).toContain('no issue tracker is configured for this checkout');
    expect(text).not.toContain('tracker sink');
    expect(text).not.toContain('/tmp/spec-first/spec-code-review/<run-id>');

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
    expect(template).toContain('do not force a decision');
  });

  test('leaf reviewers may propose finding-scoped structural fixes but not speculative refactors', () => {
    const skill = fs.readFileSync(SKILL_PATH, 'utf8');
    const template = fs.readFileSync(
      path.join(__dirname, '..', '..', 'skills', 'spec-code-review', 'references', 'subagent-template.md'),
      'utf8',
    );

    expect(skill).toContain('must not propose unrelated or speculative refactors');
    expect(skill).toContain('may propose the smallest finding-scoped structural fix');
    expect(skill).toContain('mechanical helper extraction');
    expect(template).toContain('Helper extraction is `safe_auto` when the duplication is identical');
    expect(template).toContain('Pair `manual` with a concrete `suggested_fix` whenever you can defend one');
    expect(skill).not.toContain('or propose refactors. Artifact persistence');
  });

  test('pre-existing findings are routed independently from confidence zero', () => {
    const schema = fs.readFileSync(
      path.join(__dirname, '..', '..', 'skills', 'spec-code-review', 'references', 'findings-schema.json'),
      'utf8',
    );
    const template = fs.readFileSync(
      path.join(__dirname, '..', '..', 'skills', 'spec-code-review', 'references', 'subagent-template.md'),
      'utf8',
    );
    const diffScope = fs.readFileSync(
      path.join(__dirname, '..', '..', 'skills', 'spec-code-review', 'references', 'diff-scope.md'),
      'utf8',
    );

    expect(schema).toContain('False positive or non-finding -- do not report');
    expect(schema).toContain('Pre-existing status is represented separately by the `pre_existing` boolean');
    expect(schema).toContain('Pre-existing findings are routed separately and do not count toward the review verdict.');
    expect(template).toContain('Pre-existing status is represented separately by `pre_existing: true`');
    expect(diffScope).toContain('Mark these as `"pre_existing": true` in your output.');
    expect(schema).not.toContain('False positive or pre-existing -- do not report');
    expect(schema).not.toContain('or a pre-existing issue this PR did not introduce');
  });

  test('merge validation keeps current full schema detail fields while allowing explicit legacy degradation', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');
    const schema = fs.readFileSync(
      path.join(__dirname, '..', '..', 'skills', 'spec-code-review', 'references', 'findings-schema.json'),
      'utf8',
    );

    expect(schema).toContain('"why_it_matters"');
    expect(schema).toContain('"evidence"');
    expect(text).toContain('Per-finding required for current full reviewer returns');
    expect(text).toContain('why_it_matters, evidence, confidence');
    expect(text).toContain('Legacy/compact degraded returns');
    expect(text).toContain('Headless output, tracker externalization');
    expect(text).toContain('must not claim full-schema validation');
    expect(text).toContain('Validate current reviewer returns against the full schema');
  });

  test('cross-reviewer agreement does not promote interpretive findings to certainty', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('promote the merged finding by one anchor step up to the high-confidence tier');
    expect(text).toContain('`50 -> 75`, `75 -> 75`, `100 -> 100`');
    expect(text).toContain('does not by itself satisfy the `100` anchor');
    expect(text).toContain('Promote to `100` only when the merged direct evidence independently meets that bar');
    expect(text).not.toContain('`50 -> 75`, `75 -> 100`, `100 -> 100`');
  });

  test('maintainability reviewer targets structural simplification without gaining write access', () => {
    const reviewer = fs.readFileSync(
      path.join(__dirname, '..', '..', 'agents', 'spec-maintainability-reviewer.agent.md'),
      'utf8',
    );

    expect(reviewer).toContain('structural quality, complexity deletion');
    expect(reviewer).toContain('catch changes that make the codebase harder to change, delete, or reason about');
    expect(reviewer).toContain('delete complexity');
    expect(reviewer).toContain('Structural simplification (highest priority)');
    expect(reviewer).toContain('Complexity moved, not removed');
    expect(reviewer).toContain('Code-judo misses');
    expect(reviewer).toContain('Spaghetti growth');
    expect(reviewer).toContain('File-size regression');
    expect(reviewer).toContain('1000 lines');
    expect(reviewer).toContain('Wrong layer / leaked logic');
    expect(reviewer).toContain('Thin wrappers');
    expect(reviewer).toContain('new `any`, `@ts-ignore`, unchecked `as` casts, `unknown as Foo`');
    expect(reviewer).toContain('Ad-hoc object shapes');
    expect(reviewer).toContain('P1');
    expect(reviewer).toContain('P2');
    expect(reviewer).toContain('P3');
    expect(reviewer).toContain('Structural findings need a **concrete reframe** in `suggested_fix`');
    expect(reviewer).toContain('explicit `any` or `@ts-ignore` in new code');
    expect(reviewer).toContain('new wrapper with no added behavior');
    expect(reviewer).toContain('suppress unless severity is P1');
    expect(reviewer).toContain('Philosophy without a concrete structural fix');
    expect(reviewer).toContain('"reviewer": "maintainability"');
    expect(reviewer).toContain('tools: Read, Grep, Glob, Bash');
    expect(reviewer).not.toContain('tools: Read, Grep, Glob, Bash, Write');
    expect(reviewer).not.toContain('ce-maintainability');
  });

  test('data-migrations reviewer adds verification rubric without absorbing schema drift', () => {
    const reviewer = fs.readFileSync(
      path.join(__dirname, '..', '..', 'agents', 'spec-data-migrations-reviewer.agent.md'),
      'utf8',
    );
    const catalog = fs.readFileSync(
      path.join(__dirname, '..', '..', 'skills', 'spec-code-review', 'references', 'persona-catalog.md'),
      'utf8',
    );
    const skill = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(reviewer).toContain('deploy-window safety, rollback risk, and verification plans');
    expect(reviewer).toContain('Never trust fixtures as proof of production shape');
    expect(reviewer).toContain('Migration safety');
    expect(reviewer).toContain('Verification and observability');
    expect(reviewer).toContain('Read-only SQL to prove correctness after deploy');
    expect(reviewer).toContain('Rollback or feature-flag guardrails for risky paths');
    expect(reviewer).toContain('Flag missing verification for risky transforms as **P2** `manual`');
    expect(reviewer).toContain('concrete verification shape in `suggested_fix`');
    expect(reviewer).toContain('verifiable swapped mapping');
    expect(reviewer).toContain('concrete orphaned reference');
    expect(reviewer).toContain('Schema drift is still owned by `spec-schema-drift-detector`');
    expect(reviewer).toContain('Do not replace it');
    expect(reviewer).toContain('"reviewer": "data-migrations"');
    expect(reviewer).toContain('tools: Read, Grep, Glob, Bash');
    expect(reviewer).not.toContain('tools: Read, Grep, Glob, Bash, Write');
    expect(reviewer).not.toContain('"reviewer": "data-migration"');
    expect(reviewer).not.toContain('ce-data-migration');
    expect(catalog).toContain('Migration files, schema dumps (`db/schema.rb`, `structure.sql`), backfill scripts, or data transformations -- not model/query-only changes without migration artifacts');
    expect(catalog).toContain('Do not trigger migration-only agents for model/query-only changes without migration artifacts');
    expect(catalog).toContain('Do not spawn these agents for model/query-only changes without migration artifacts');
    expect(skill).toContain('Migration files, schema dumps (`db/schema.rb`, `structure.sql`), backfill scripts, or data transformations -- not model/query-only changes without migration artifacts');
    expect(skill).toContain('Do not trigger migration-only agents for model/query-only changes without migration artifacts');
    expect(skill).toContain('Select when diff includes migration artifacts');
    expect(catalog).toContain('`spec-schema-drift-detector` | Cross-references schema.rb changes against included migrations to catch unrelated drift');
    expect(skill).toContain('For spec-schema-drift-detector specifically, pass the resolved review base branch explicitly so it never assumes `main`');
  });

  test('project-standards reviewer enforces only confirmed team standards with source evidence', () => {
    const reviewer = fs.readFileSync(
      path.join(__dirname, '..', '..', 'agents', 'spec-project-standards-reviewer.agent.md'),
      'utf8',
    );
    const catalog = fs.readFileSync(
      path.join(__dirname, '..', '..', 'skills', 'spec-code-review', 'references', 'persona-catalog.md'),
      'utf8',
    );

    expect(reviewer).toContain('docs/contracts/team-standards.md');
    expect(reviewer).toContain('docs/standards/index.md');
    expect(reviewer).toContain('trust=confirmed');
    expect(reviewer).toContain('lifecycle_state=active');
    expect(reviewer).toContain('matching scope');
    expect(reviewer).toContain('Suppress `observed`, `suggested`, `imported`, `conflict`, `confirmed-draft`');
    expect(reviewer).toContain('Do not scan the full `docs/standards/**` tree');
    expect(reviewer).toContain('Every finding must include');
    expect(reviewer).toContain('specific line(s) in the diff');
    expect(catalog).toContain('confirmed `docs/standards/**` rule cards');
  });

  test('tracker defer references keep the tracker confidence tuple consistent', () => {
    const files = [
      path.join(__dirname, '..', '..', 'skills', 'spec-code-review', 'references', 'tracker-defer.md'),
      path.join(__dirname, '..', '..', 'skills', 'spec-work', 'references', 'tracker-defer.md'),
    ];

    for (const filePath of files) {
      const text = fs.readFileSync(filePath, 'utf8');

      expect(text).toContain('{ tracker_name, confidence, named_sink_available, any_sink_available }');
      expect(text).toContain('Primary sources are already-loaded project guidance plus precise tracker lookups');
      expect(text).toContain('Check already-loaded project guidance for tracker references');
      expect(text).toContain('perform a precise lookup for tracker references');
      expect(text).toContain('avoid full-file reads unless the exact lookup is inconclusive and Defer execution is imminent');
      expect(text).toContain('confidence = high');
      expect(text).toContain('confidence = low');
      expect(text).not.toContain('Primary sources: `CLAUDE.md` and `AGENTS.md`');
      expect(text).not.toContain('Read `CLAUDE.md` / `AGENTS.md` for tracker references');
      expect(text).not.toContain('confidence-first');
      expect(text).not.toContain('tracker_confidence');
    }
  });

  test('all tracker defer references use emitted review artifact paths instead of hardcoded temp roots', () => {
    const files = [
      path.join(__dirname, '..', '..', 'skills', 'spec-code-review', 'references', 'tracker-defer.md'),
      path.join(__dirname, '..', '..', 'skills', 'spec-work', 'references', 'tracker-defer.md'),
    ];

    for (const filePath of files) {
      const text = fs.readFileSync(filePath, 'utf8');

      expect(text).toContain('<artifact-path>/<reviewer>.json');
      expect(text).toContain('Do not hardcode `/tmp`');
      expect(text).toContain('review workflow\'s returned artifact path is the authority');
      expect(text).not.toContain('/tmp/spec-first/spec-code-review/<run-id>');
    }
  });

  test('tracker defer durable tickets do not rely on session artifacts as continuation truth', () => {
    const text = fs.readFileSync(
      path.join(__dirname, '..', '..', 'skills', 'spec-code-review', 'references', 'tracker-defer.md'),
      'utf8',
    );

    expect(text).toContain('Include enough inline evidence for the ticket to remain understandable without opening the session artifact.');
    expect(text).toContain('preserve the title, one-sentence problem statement, suggested fix when present, at least one compact evidence item');
    expect(text).toContain('Do not rely on a session-scoped spec-code-review run artifact as the only continuation target');
    expect(text).toContain('never as the durable source of truth');
    expect(text).not.toContain('continued in spec-code-review run artifact');
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

  test('model tiering avoids hard-coded non-Claude model names', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('use only a host-provided stable alias or omit the model parameter');
    expect(text).toContain('do not invent a model name from memory');
    expect(text).toContain('on other platforms use a host-provided cheap stable alias or omit the model parameter');
    expect(text).not.toContain('gpt-5.4-mini');
    expect(text).not.toContain('gpt-5.4-nano');
  });

  test('runtime readiness preflight prevents multiplying broken MCP startup across reviewers', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');
    const claudeRuntime = renderWorkflowSkill('claude');
    const codexRuntime = renderWorkflowSkill('codex');

    for (const content of [text, claudeRuntime, codexRuntime]) {
      expect(content).toContain('Runtime readiness preflight');
      expect(content).toContain('spec-mcp-setup');
      expect(content).toContain('detect-tools.sh');
      expect(content).toContain('host_config_status: ready | fallback-active | registry-args-drift | not-required');
      expect(content).toContain('acceptable-but-degraded');
      expect(content).toContain('do not treat it as unsafe by itself');
      expect(content).toContain('host_config_status: action-required | precedence-blocked');
      expect(content).toContain('not safe for multi-persona dispatch');
      expect(content).toContain('runtime boundary issue');
      expect(content).toContain('Record it once in Coverage');
      expect(content).toContain('Missing optional external-tool evidence does not by itself disable reviewer dispatch');
      expect(content).toContain('When a required MCP server is not host-config-ready before dispatch');
      expect(content).toContain('do not spawn reviewer agents');
      expect(content).toContain('single_agent_report_only_fallback: true');
      expect(content).toContain('runtime readiness preflight unavailable');
      expect(content).toContain('MCP startup incomplete');
      expect(content).toContain('fallback is mode-aware');
      expect(content).toContain('Review failed (headless mode). Reason: required MCP runtime not ready');
      expect(content).toContain('Mutating review requires safe reviewer/fixer dispatch capability');
    }

    expect(text).toContain('bash skills/spec-mcp-setup/scripts/detect-tools.sh');
    expect(claudeRuntime).toContain('bash .claude/spec-first/workflows/spec-mcp-setup/scripts/detect-tools.sh');
    expect(codexRuntime).toContain('bash .agents/skills/spec-mcp-setup/scripts/detect-tools.sh');
    expect(codexRuntime).toContain('| Claude runtime | `bash .claude/spec-first/workflows/spec-mcp-setup/scripts/detect-tools.sh` |');
    expect(codexRuntime).not.toContain('| Claude runtime | `bash .agents/skills/spec-mcp-setup/scripts/detect-tools.sh` |');
  });

  test('trivial PR skip pre-check does not bypass dispatch authorization', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');
    const skipRuleStart = text.indexOf('**Trivial-PR judgment**');
    const skipRuleEnd = text.indexOf('When any skip rule fires', skipRuleStart);
    const skipRule = text.slice(skipRuleStart, skipRuleEnd);

    expect(skipRule).toContain('make a conservative inline orchestrator judgment');
    expect(skipRule).toContain('Do not call `Agent`, `Task`, `spawn_agent`, or an equivalent dispatch primitive');
    expect(skipRule).toContain('Stage 4 dispatch gate');
    expect(skipRule).not.toContain('spawn a lightweight sub-agent');
  });

  test('preflight consumes plan and work direct evidence once and reports Coverage posture', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');
    const template = fs.readFileSync(
      path.join(__dirname, '..', '..', 'skills', 'spec-code-review', 'references', 'review-output-template.md'),
      'utf8',
    );

    expect(text).toContain('If a `plan:` argument or Stage 2b discovery found a plan, inspect its source refs, direct evidence notes, limitations, and repo scope.');
    expect(text).toContain('spec-work run artifact path / `run_id`');
    expect(text).toContain('spec-first internal spec-work-run-artifact read --target-repo <repo>');
    expect(text).toContain('do not directly scan `.spec-first/workflows/spec-work/**`');
    expect(text).toContain('artifact `plan_path` / `source_refs` reasonably match');
    expect(text).toContain('reader returns not-found/not-readable');
    expect(text).toContain('scope mismatches');
    expect(text).toContain('do not inject the artifact evidence into reviewer prompts');
    expect(text).toContain('Carry the consolidated direct evidence posture to Stage 6 Coverage.');
    expect(text).toContain('Do not ask each persona reviewer to repeat the same setup preflight.');
    expect(template).toContain('Coverage section');
    expect(template).toContain('direct evidence posture');
  });

  test('records direct evidence targets for broad or impact-sensitive diffs', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('When the diff is broad or impact-sensitive, Stage 3 records direct evidence targets instead of external-tool calls:');
    expect(text).toContain('Route handler / public API diff -> inspect handler source, callers/consumers found by `rg`');
    expect(text).toContain('Response shape / consumer access diff -> inspect the route response source, consumer property reads');
    expect(text).toContain('Shared symbol / helper diff -> inspect direct imports/callers found by `rg` or ast-grep');
    expect(text).toContain('MCP/RPC tool definition diff -> inspect the tool definition, handler, descriptions');
    expect(text).toContain('Workspace multi-repo diff -> resolve direct evidence per child repo');
    expect(text).toContain('Do not raise a finding solely from a name match');
    expect(text).toContain('confirmed by diff/source/test/contract/log evidence');
  });

  test('phase A boundary graph and test-gap contracts have stable report fields', () => {
    const skill = fs.readFileSync(SKILL_PATH, 'utf8');
    const diffScope = fs.readFileSync(
      path.join(__dirname, '..', '..', 'skills', 'spec-code-review', 'references', 'diff-scope.md'),
      'utf8',
    );
    const template = fs.readFileSync(
      path.join(__dirname, '..', '..', 'skills', 'spec-code-review', 'references', 'review-output-template.md'),
      'utf8',
    );
    const subagentTemplate = fs.readFileSync(
      path.join(__dirname, '..', '..', 'skills', 'spec-code-review', 'references', 'subagent-template.md'),
      'utf8',
    );
    const walkthrough = fs.readFileSync(
      path.join(__dirname, '..', '..', 'skills', 'spec-code-review', 'references', 'walkthrough.md'),
      'utf8',
    );
    const catalog = fs.readFileSync(
      path.join(__dirname, '..', '..', 'skills', 'spec-code-review', 'references', 'persona-catalog.md'),
      'utf8',
    );

    for (const field of [
      'scope_boundary',
      'authorized_scope_source',
      'scope_boundary_evidence',
      'graph_assist',
      'graph_reason_code',
      'expansion_budget',
      'provider_untrusted.summaries[]',
      'changed_symbols',
      'changed_entrypoints',
      'changed_contracts',
      'symbol_mapping_status',
      'impact_chain_candidates',
      'blast_radius_candidates',
      'caller_callee_paths',
      'affected_test_candidates',
      'tests_for_query_result',
      'missing_test_confirmation',
      'review_priority_candidates',
      'test_gaps',
    ]) {
      expect(skill).toContain(field);
      expect(template).toContain(field);
    }

    expect(skill).toContain('`scope_boundary`: `clean | concern | violation | unknown`');
    expect(skill).toContain('`authorized_scope_source`: `explicit-touch-set | declared-files-only | inferred-plan | diff-only | unknown`');
    expect(skill).toContain('Use `clean` only when an explicit touch set, declared files, or plan requirements directly cover the changed files and behavior.');
    expect(skill).toContain('A diff-only inference is never enough for `clean`.');
    expect(skill).toContain('Implementer reports, PR prose, commit messages, or work closeouts are claim sources only.');
    expect(skill).toContain('Minimum derived labels are `scope_creep`, `unauthorized_file_change`, `unverifiable_claim`, and `missing_verification`.');
    expect(skill).toContain('High-confidence scope-boundary findings must remain in the primary finding set');
    expect(skill).toContain('Stage 5 synthesis derives `finding_type`');
    expect(skill).toContain('finding_type: <derived labels present in this report, or none>');

    expect(skill).toContain('Graph-Assisted Impact Review is a bounded advisory lens');
    expect(skill).toContain('`graph_assist`: `used | fallback | not_applicable`');
    expect(skill).toContain('`graph_reason_code`: `candidate_results | provider_missing | readiness_unknown | stale | call_failed | disabled_or_unsafe | markdown_only_diff | no_candidates`');
    expect(skill).toContain('`expansion_budget`: minimal-first budget used for candidate expansion');
    expect(skill).toContain('`graph_assist: used` requires `graph_reason_code: candidate_results` plus at least one of `changed_symbols`, `caller_callee_paths`, or `affected_test_candidates`');
    expect(skill).toContain('`no_candidates` proves only that the provider path ran.');
    expect(skill).toContain('Use minimal-first expansion: start with at most 5 high-impact symbols or entrypoints.');
    expect(skill).toContain('Ordinary docs-only/prose-only diffs can use `graph_assist: not_applicable`');
    expect(skill).toContain('source-runtime instruction prose such as `skills/**`, workflow contracts, templates, runtime projection source, or CLI/workflow harness docs remains impact-sensitive');
    expect(skill).toContain('do not read raw project-graph artifact JSON');
    expect(skill).toContain('`symbol_mapping_status`: `mapped | degraded | not_applicable`');
    expect(skill).toContain('`tests_for_query_result`, `missing_test_confirmation`, and `test_gaps`');
    expect(skill).toContain('Keep `test_gaps` as a first-class Coverage signal');
    expect(skill).toContain('wrapped in `<boundary-context>`');
    expect(skill).toContain('wrapped in `<graph-impact-context>`');
    expect(skill).toContain('Validator failure (timeout, dispatch error, malformed JSON) -> keep the finding');
    expect(skill).toContain('Do not treat infrastructure failure as counter-evidence.');

    expect(diffScope).toContain('### Boundary (authorized scope)');
    expect(diffScope).toContain('Use the resolved `BASE:`, `FILES:`, and `DIFF:` markers passed by the parent orchestrator.');
    expect(diffScope).toContain('Do not recompute the diff range');
    expect(diffScope).toContain('If an explicit touch set or declared file list exists');
    expect(diffScope).toContain('scope_boundary: unknown');
    expect(diffScope).toContain('Implementer summaries, commit messages, or PR prose are claims to verify, not proof.');

    expect(subagentTemplate).toContain('Treat Graph-Assisted Impact Review and code-graph/project-graph output as `provider_untrusted` candidate context only.');
    expect(subagentTemplate).toContain('<boundary-context>');
    expect(subagentTemplate).toContain('{boundary_context}');
    expect(subagentTemplate).toContain('<graph-impact-context>');
    expect(subagentTemplate).toContain('{graph_impact_context}');
    expect(subagentTemplate).toContain('a finding must cite confirming diff/source/test/log/contract evidence');
    expect(subagentTemplate).toContain('populate top-level `testing_gaps`');
    expect(walkthrough).toContain('Stage 6 stable boundary/graph fields');
    expect(walkthrough).toContain('scope_boundary');
    expect(walkthrough).toContain('graph_assist');
    expect(walkthrough).toContain('missing_test_confirmation');

    expect(catalog).toContain('Diff Boundary Review, Graph-Assisted Impact Review, and first-class test gaps do not add a new persona in Phase A.');
    expect(catalog).toContain('Boundary/graph escalation');
  });

  test('phase A eval fixtures and adoption readout cover R-30 floor without overclaiming', () => {
    const examplesPath = path.join(
      __dirname,
      '..',
      '..',
      'skills',
      'spec-code-review',
      'evals',
      'examples.json',
    );
    const examples = JSON.parse(fs.readFileSync(examplesPath, 'utf8'));
    const cases = new Map(examples.cases.map((fixture) => [fixture.id, fixture]));
    const readoutPath = path.join(
      __dirname,
      '..',
      '..',
      'docs',
      'validation',
      'spec-code-review',
      'phase-a-boundary-graph-readout.md',
    );
    const readout = fs.readFileSync(readoutPath, 'utf8');

    for (const id of [
      'phase-a-scope-violation-with-explicit-touch-set',
      'phase-a-graph-candidate-rejected-with-test-gap',
      'phase-a-graph-provider-fallback-with-degraded-symbol-mapping',
      'phase-a-clean-diff-noise-floor',
    ]) {
      expect(cases.has(id)).toBe(true);
      const fixture = cases.get(id);
      expect(fixture).toHaveProperty('diff_or_input');
      expect(fixture).toHaveProperty('expected_scope_boundary');
      expect(fixture).toHaveProperty('authorized_scope_source');
      expect(fixture).toHaveProperty('must_find');
      expect(fixture).toHaveProperty('must_not_find');
      expect(fixture).toHaveProperty('expected_coverage_signals');
      expect(fixture).toHaveProperty('expected_graph_assist');
      expect(fixture).toHaveProperty('expected_reason_code');
      expect(fixture).toHaveProperty('expected_symbol_mapping');
      expect(fixture).toHaveProperty('expected_test_gaps');
      expect(fixture).toHaveProperty('expected_review_priority_candidates');
      expect(fixture).toHaveProperty('expected_expansion_budget');
      expect(fixture).toHaveProperty('limitations');
    }

    expect(cases.get('phase-a-scope-violation-with-explicit-touch-set').expected_scope_boundary).toBe('violation');
    expect(cases.get('phase-a-scope-violation-with-explicit-touch-set').provider_readiness).toBe('unknown');
    expect(cases.get('phase-a-scope-violation-with-explicit-touch-set').expected_graph_assist).toBe('fallback');
    expect(cases.get('phase-a-scope-violation-with-explicit-touch-set').expected_reason_code).toBe('readiness_unknown');
    expect(cases.get('phase-a-graph-candidate-rejected-with-test-gap').expected_graph_assist).toBe('used');
    expect(cases.get('phase-a-graph-candidate-rejected-with-test-gap').expected_reason_code).toBe('candidate_results');
    expect(cases.get('phase-a-graph-candidate-rejected-with-test-gap').expected_symbol_mapping).toContain('changed_symbols');
    expect(cases.get('phase-a-graph-candidate-rejected-with-test-gap').expected_review_priority_candidates.length).toBeGreaterThan(0);
    expect(cases.get('phase-a-graph-candidate-rejected-with-test-gap').expected_expansion_budget).toBe('max_5_high_impact_symbols');
    expect(cases.get('phase-a-graph-provider-fallback-with-degraded-symbol-mapping').expected_graph_assist).toBe('fallback');
    expect(cases.get('phase-a-graph-provider-fallback-with-degraded-symbol-mapping').provider_readiness).toBe('unknown');
    expect(cases.get('phase-a-graph-provider-fallback-with-degraded-symbol-mapping').expected_symbol_mapping).toContain('symbol_mapping_status=degraded');
    expect(cases.get('phase-a-graph-provider-fallback-with-degraded-symbol-mapping').must_not_find).toContain('graph_assist=used');
    expect(cases.get('phase-a-clean-diff-noise-floor').must_not_find).toContain('graph_assist=used');

    expect(readout).toContain('scope_boundary: violation');
    expect(readout).toContain('scope_boundary: unknown');
    expect(readout).toContain('graph_assist: fallback');
    expect(readout).toContain('graph_assist: used');
    expect(readout).toContain('provider_untrusted.summaries[]');
    expect(readout).toContain('test_gaps');
    expect(readout).toContain('pilot limitation');
    expect(readout).toContain('does not prove durable graph impact capability');
  });

  test('changelog path references to untracked artifacts stay boundary concerns', () => {
    const skill = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(skill).toContain('When `CHANGELOG.md`, release notes, review docs, or validation docs add repo-relative path references');
    expect(skill).toContain('referenced artifacts that are claimed as shipped are in `FILES:` / tracked diff');
    expect(skill).toContain('already tracked by `git ls-files -- <path>`');
    expect(skill).toContain('exists only in `UNTRACKED:`');
    expect(skill).toContain('`scope_boundary: concern`');
    expect(skill).toContain('`finding_type: untracked_referenced_artifact`');
    expect(skill).toContain('Changelog/release-note path reference check');
    expect(skill).toContain('If `CHANGELOG.md` or a release-note/validation doc is in `FILES:`');
    expect(skill).toContain('Compare to `FILES:`, `git ls-files -- <path>`, and `UNTRACKED:`');
    expect(skill).toContain('untracked-referenced-artifact:<path>');
    expect(skill).toContain('workflow-local and does not require a findings-schema change');
    expect(skill).toContain('do not stage the artifact');
  });

  test('phase A fixture graph combinations stay semantically consistent', () => {
    const examples = JSON.parse(fs.readFileSync(
      path.join(__dirname, '..', '..', 'skills', 'spec-code-review', 'evals', 'examples.json'),
      'utf8',
    ));
    const phaseACases = examples.cases.filter((fixture) => fixture.coverage_tags.includes('phase-a-floor'));

    for (const fixture of phaseACases) {
      if (fixture.expected_graph_assist === 'used') {
        expect(fixture.expected_reason_code).toBe('candidate_results');
        const candidateSignals = [
          ...(fixture.expected_symbol_mapping || []),
          ...(fixture.expected_coverage_signals || []),
        ].join(' ');
        expect(candidateSignals).toMatch(/changed_symbols|caller_callee_paths|affected_test_candidates/);
        expect(fixture.expected_expansion_budget).toBe('max_5_high_impact_symbols');
      }

      if (fixture.expected_graph_assist === 'fallback') {
        expect(fixture.expected_reason_code).not.toBe('candidate_results');
        expect(fixture.limitations.length).toBeGreaterThan(0);
        expect(['unknown', 'missing', undefined]).toContain(fixture.provider_readiness);
      }

      if (fixture.expected_graph_assist === 'not_applicable') {
        expect(fixture.expected_reason_code).toBe('markdown_only_diff');
        expect(fixture.expected_expansion_budget).toBe('not_applicable');
      }
    }
  });

  test('Codex reviewer dispatch avoids fork_context and agent_type parameter conflicts', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');
    const codexRuntime = renderWorkflowSkill('codex');

    for (const content of [text, codexRuntime]) {
      expect(content).toContain('Codex `spawn_agent` parameter hygiene');
      expect(content).toContain('Codex reviewer prompts are self-contained');
      expect(content).toContain('pass the persona, diff-scope rules, output schema, PR metadata, intent, file list, diff, and standards paths');
      expect(content).toContain('Dispatch one reviewer per `spawn_agent` call');
      expect(content).toContain('do not bundle multiple reviewer personas into one sub-agent prompt');
      expect(content).toContain('prefer the default sub-agent type and omit `agent_type`');
      expect(content).toContain('specialized by the prompt, not by a generic explorer/worker role');
      expect(content).toContain('omit `fork_context`');
      expect(content).toContain('do not combine `fork_context: true` with `agent_type`');
      expect(content).toContain('If a runtime requires `fork_context: true`');
      expect(content).toContain('omit `agent_type` and still include the full self-contained review context');
      expect(content).toContain('correct the parameters once and retry through the bounded scheduler');
      expect(content).toContain('not a reviewer failure');
    }
  });

  test('workflow progress updates do not expose private reasoning scratchpads', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('Progress Reporting Boundary');
    expect(text).toContain('User-visible progress updates are operational evidence, not a reasoning scratchpad.');
    expect(text).toContain('Do not expose private deliberation, tentative inner monologue, or first-person reasoning');
    expect(text).toContain('"I\'m thinking"');
    expect(text).toContain('"I need to consider"');
    expect(text).toContain('"I think"');
    expect(text).toContain('state the verified limitation and the next check');
    expect(text).toContain('Use the repository language policy from the active `CLAUDE.md` / `AGENTS.md` `spec-first:lang` block for new prose');
    expect(text).not.toContain('Use the session language for new prose');
  });

  test('resolve-base script lives under scripts and runtime calls use the trusted skill path', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');
    const claudeRuntime = renderWorkflowSkill('claude');
    const codexRuntime = renderWorkflowSkill('codex');
    const scriptPath = path.join(
      __dirname,
      '..',
      '..',
      'skills',
      'spec-code-review',
      'scripts',
      'resolve-base.sh',
    );
    const legacyPath = path.join(
      __dirname,
      '..',
      '..',
      'skills',
      'spec-code-review',
      'references',
      'resolve-base.sh',
    );
    const script = fs.readFileSync(scriptPath, 'utf8');

    expect(fs.existsSync(scriptPath)).toBe(true);
    expect(fs.existsSync(legacyPath)).toBe(false);
    expect(text).toContain('skills/spec-code-review/scripts/resolve-base.sh');
    expect(text).not.toContain('bash scripts/resolve-base.sh');
    expect(text).not.toContain('references/resolve-base.sh');
    expect(claudeRuntime).toContain('.claude/spec-first/workflows/spec-code-review/scripts/resolve-base.sh');
    expect(codexRuntime).toContain('.agents/skills/spec-code-review/scripts/resolve-base.sh');
    expect(claudeRuntime).not.toContain('bash scripts/resolve-base.sh');
    expect(codexRuntime).not.toContain('bash scripts/resolve-base.sh');
    expect(script).toContain('Usage from source: bash skills/spec-code-review/scripts/resolve-base.sh');
    expect(script).toContain('Runtime adapters rewrite that source path');
    expect(script).toContain('gh pr view --json baseRefName,url --jq');
    expect(script).not.toContain('jq -r');
  });

  test('previous-comments reviewer is gated by actual prior feedback', () => {
    const skill = fs.readFileSync(SKILL_PATH, 'utf8');
    const catalog = fs.readFileSync(
      path.join(__dirname, '..', '..', 'skills', 'spec-code-review', 'references', 'persona-catalog.md'),
      'utf8',
    );

    expect(skill).toContain('hasPriorComments');
    expect(skill).toContain('approval-state submissions with empty bodies');
    expect(skill).toContain('previous-comments` is PR-only AND comment-gated');
    expect(skill).toContain('approval-only reviews with empty bodies');
    expect(catalog).toContain('PR-only AND comment-gated');
    expect(catalog).toContain('hasPriorComments');
  });

  test('scale-aware reviewer preflight allows low-risk minimum reviewer sets', () => {
    const skill = fs.readFileSync(SKILL_PATH, 'utf8');
    const catalog = fs.readFileSync(
      path.join(__dirname, '..', '..', 'skills', 'spec-code-review', 'references', 'persona-catalog.md'),
      'utf8',
    );

    for (const text of [skill, catalog]) {
      expect(text).toContain('scale-aware reviewer preflight');
      expect(text).toContain('minimum set');
      expect(text).toContain('sensitive');
      expect(text).toContain('prior');
      expect(text).toContain('explicit plan');
      expect(text).not.toContain('Spawned on every review regardless of diff content.');
      expect(text).not.toContain('a small config change triggers 0 conditionals = 6 reviewers');
    }

    expect(skill).toContain('`changed_file_count <= 2`');
    expect(skill).toContain('`untracked_excluded_count == 0`');
    expect(skill).toContain('`sensitive_diff == false`');
    expect(skill).toContain('`plan_explicit == false`');
    expect(skill).toContain('`docs_only == true`');
    expect(skill).toContain('`simple_config_only == true`');
    expect(skill).toContain('`non_test_non_generated_non_lock_line_count <= 25`');
    expect(skill).toContain('Progressive disclosure boundary: low-risk docs-only, simple config, and tiny executable diffs may use a minimum reviewer set');
    expect(skill).toContain('high-risk workflow, contract, release, source/runtime boundary, external-tool evidence, security, or cross-module changes must use the full default core plus applicable conditional reviewers');
    expect(skill).toContain('avoid unbounded fan-out on small diffs without hiding risk');
    expect(skill).toContain('| `docs_only` | `spec-project-standards-reviewer`, `spec-maintainability-reviewer` |');
    expect(skill).toContain('| `simple_config_only` | `spec-correctness-reviewer`, `spec-testing-reviewer`, `spec-project-standards-reviewer` |');
    expect(skill).toContain('| tiny executable diff | `spec-correctness-reviewer`, `spec-testing-reviewer`, `spec-maintainability-reviewer` |');
    expect(skill).toContain('`mode:headless` and `mode:report-only` keep their structured output contracts');
    expect(skill).toContain('`mode:autofix` may use the minimum set only for `docs_only` or `simple_config_only`');
    expect(skill).toContain('Record the preflight facts, selected core tier (`minimum` or `full`), and reason in Coverage');
    expect(skill).toContain('If the facts are missing, ambiguous, or contradicted by the diff, choose the full default core.');

    expect(catalog).toContain('Default Core');
    expect(catalog).toContain('Low-risk tiny diffs may use a minimum core of 2-3 reviewers');
    expect(catalog).toContain('Announce the team');
    expect(catalog).toContain('selected core tier');
  });

  test('retains CLI readiness reviewers as a spec-first product boundary', () => {
    const skill = fs.readFileSync(SKILL_PATH, 'utf8');
    const catalog = fs.readFileSync(
      path.join(__dirname, '..', '..', 'skills', 'spec-code-review', 'references', 'persona-catalog.md'),
      'utf8',
    );
    const cliAgentReadiness = fs.readFileSync(
      path.join(__dirname, '..', '..', 'agents', 'spec-cli-agent-readiness-reviewer.agent.md'),
      'utf8',
    );
    const cliReadiness = fs.readFileSync(
      path.join(__dirname, '..', '..', 'agents', 'spec-cli-readiness-reviewer.agent.md'),
      'utf8',
    );

    expect(skill).toContain('CLI readiness boundary');
    expect(skill).toContain('Keep `spec-cli-readiness-reviewer` as the conditional reviewer for CLI-facing diffs');
    expect(skill).toContain('This project is itself a CLI/workflow harness');
    expect(skill).toContain('not a replacement for the structured JSON persona');
    expect(skill).not.toContain('U9 divergence note');
    expect(skill).not.toContain('CE `06a7cee0` removed its CLI readiness reviewers');
    expect(catalog).toContain('CLI readiness boundary');
    expect(catalog).toContain('this repository ships a CLI/workflow harness');
    expect(catalog).not.toContain('CE removed its CLI readiness reviewers');
    expect(catalog).toContain('These Spec-First conditional agents provide specialized analysis');
    expect(catalog).not.toContain('CE-native agents');
    expect(catalog).toContain('| `cli-readiness` | `spec-cli-readiness-reviewer` |');
    expect(cliReadiness).toContain('"reviewer": "cli-readiness"');
    expect(cliReadiness).toContain('Return your findings as JSON matching the findings schema');
    expect(cliAgentReadiness).toContain('source code**, **plans**, and **specs**');
    expect(cliAgentReadiness).toContain('CLI Agent-Readiness Review');
  });

  test('finding numbers are stable across severity and residual sections', () => {
    const skill = fs.readFileSync(SKILL_PATH, 'utf8');
    const template = fs.readFileSync(
      path.join(
        __dirname,
        '..',
        '..',
        'skills',
        'spec-code-review',
        'references',
        'review-output-template.md',
      ),
      'utf8',
    );

    expect(skill).toContain('Sort and number');
    expect(skill).toContain('assign monotonically increasing `#` values across the full primary finding set');
    expect(skill).toContain('reuse the same stable `#`');
    expect(skill).toContain('Finding numbers come from the stable assignment in Stage 5');
    expect(template).toContain('Stable sequential finding numbers');
    expect(template).toContain('| 3 | `export_service.rb:91`');
  });

  test('reviewer and validator dispatch are bounded instead of treating capacity as failure', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('Bounded parallel dispatch');
    expect(text).toContain('Respect the current harness\'s active-subagent limit');
    expect(text).toContain('active-agent/thread/concurrency-limit spawn errors as backpressure');
    expect(text).toContain('Start with at most 4 active reviewer agents');
    expect(text).toContain('Do not launch every selected reviewer in one burst');
    expect(text).toContain('A generic `Agent spawn failed` with one or more active reviewers is presumed capacity/backpressure first');
    expect(text).toContain('Wait for any active reviewer to complete');
    expect(text).toContain('retry the same queued reviewer once');
    expect(text).toContain('A spawn failure that includes `MCP startup incomplete`, `MCP startup failed`, or a required MCP server name');
    expect(text).toContain('Stop launching new reviewers');
    expect(text).toContain('collect any already-started reviewers that can complete');
    expect(text).toContain('apply remaining persona lenses inline through the single-agent report-only fallback');
    expect(text).toContain('Only mark a queued reviewer as failed after the bounded retry path rules out capacity/backpressure');
    expect(text).toContain('Spawn validators with bounded parallelism');
    expect(text).toContain('bounded queueing rules in Stage 4');
    expect(text).toContain('supports reviewer dispatch but not parallel sub-agents');
    expect(text).toContain('dispatch reviewers sequentially through the same Stage 4 scheduler');
    expect(text).toContain('If the platform has no dispatch primitive, or dispatch is explicitly disabled or unsafe, use the Stage 4 single-agent report-only fallback');
  });

  test('validator budget cap skips validation without dropping surviving findings', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('dispatch validators only for the highest-severity 15');
    expect(text).toContain('Do not drop the remainder.');
    expect(text).toContain('validation_skipped/over_budget');
    expect(text).toContain('carry it unchanged into the next phase');
    expect(text).toContain('The cap limits validator fan-out only');
    expect(text).toContain('must not erase already-surviving findings from headless, autofix, ticket, or final-report outputs');
    expect(text).toContain('over-budget validation skips');
    expect(text).toContain('Validator over-budget skips');
    expect(text).not.toContain('Drop the remainder and record the over-budget count');
    expect(text).not.toContain('Validator over-budget drops');
  });

  test('code-review dispatch is analysis-only and mutation is mode-bound', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('Reviewers are analysis agents, not implementation workers.');
    expect(text).toContain('Dispatch is bounded to the resolved diff scope, selected reviewer personas, advisory facts, and output schema.');
    expect(text).toContain('Do not create hidden implement/check agents from code review.');
    expect(text).toContain('Mutation is allowed only through documented `safe_auto` / selected Apply paths in the chosen mode');
    expect(text).toContain('report-only fallback, unsafe runtime, or missing dispatch capability must not edit source, generated runtime mirrors, or workflow artifacts.');
    expect(text).not.toContain('fallback may edit source');
    expect(text).not.toContain('hidden implement/check lifecycle');
  });

  test('code-review leaf reviewers remain read-only while artifacts are parent-owned', () => {
    const reviewers = [
      'spec-adversarial-reviewer',
      'spec-api-contract-reviewer',
      'spec-correctness-reviewer',
      'spec-data-migrations-reviewer',
      'spec-dhh-rails-reviewer',
      'spec-julik-frontend-races-reviewer',
      'spec-kieran-python-reviewer',
      'spec-kieran-rails-reviewer',
      'spec-kieran-typescript-reviewer',
      'spec-maintainability-reviewer',
      'spec-performance-reviewer',
      'spec-previous-comments-reviewer',
      'spec-project-standards-reviewer',
      'spec-reliability-reviewer',
      'spec-security-reviewer',
      'spec-swift-ios-reviewer',
      'spec-testing-reviewer',
    ];

    for (const reviewer of reviewers) {
      const text = fs.readFileSync(
        path.join(__dirname, '..', '..', 'agents', `${reviewer}.agent.md`),
        'utf8',
      );
      expect(text).toContain('tools: Read, Grep, Glob, Bash');
      expect(text).not.toContain('tools: Read, Grep, Glob, Bash, Write');
    }

    for (const reviewer of ['spec-cli-agent-readiness-reviewer', 'spec-cli-readiness-reviewer']) {
      const text = fs.readFileSync(
        path.join(__dirname, '..', '..', 'agents', `${reviewer}.agent.md`),
        'utf8',
      );
      expect(text).toContain('tools: Read, Grep, Glob, Bash');
      expect(text).not.toContain('tools: Read, Grep, Glob, Bash, Write');
    }

    const template = fs.readFileSync(
      path.join(
        __dirname,
        '..',
        '..',
        'skills',
        'spec-code-review',
        'references',
        'subagent-template.md',
      ),
      'utf8',
    );
    expect(template).toContain('Do not write files.');
    expect(template).toContain('the orchestrator writes your returned JSON itself');
    expect(template).toContain('reviewer agents read-only');
    expect(template).toContain('You are operationally read-only.');
    expect(template).not.toContain('This is the ONE write operation you are permitted to make');

    const skill = fs.readFileSync(SKILL_PATH, 'utf8');
    expect(skill).toContain('Do not ask leaf reviewers to write files directly.');
    expect(skill).toContain('const reviewArtifactDir = path.join(os.tmpdir(), \'spec-first\', \'spec-code-review\', runId);');
    expect(skill).toContain('the orchestrator may write that JSON to `<review-artifact-dir>/{reviewer_name}.json`');
    expect(skill).toContain('Artifact persistence is parent/orchestrator-owned');
  });

  test('supports single-agent report-only fallback when reviewer dispatch is unavailable or unsafe', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('When dispatch is unavailable, explicitly disabled, or unsafe, falls back to a single-agent report-only review instead of bypassing host boundaries.');
    expect(text).toContain('Dispatch capability gate');
    expect(text).toContain('Dispatch capability is part of the runtime boundary, not a reviewer-selection preference.');
    expect(text).toContain('the current tool contract controls dispatch permission');
    expect(text).toContain('A workflow entrypoint by itself is not enough to call `spawn_agent`');
    expect(text).toContain('require an explicit user request for subagents/parallel agents/delegated review');
    expect(text).toContain('parent-orchestrator delegation whose visible parent request or handoff evidence carries that permission');
    expect(text).toContain('visible delegation includes reviewer-dispatch permission');
    expect(text).toContain('Codex may expose reviewer dispatch through `spawn_agent`');
    expect(text).toContain('only when both the host capability and the current permission boundary allow it');
    expect(text).toContain('Do not downgrade solely because the host is Codex when the permission boundary is satisfied.');
    expect(text).toContain('set `single_agent_report_only_fallback: true`');
    expect(text).toContain('Treat the effective mode as report-only');
    expect(text).toContain('Do not create `<review-artifact-dir>/` and do not write reviewer artifacts.');
    expect(text).toContain('Skip Stage 5b validator dispatch and all fixer paths.');
    expect(text).toContain('single-agent report-only fallback: reviewer dispatch unavailable, explicitly disabled, or unsafe');
    expect(text).toContain('| single-agent report-only fallback | No -- dispatch is unavailable, explicitly disabled, or unsafe | n/a |');
    expect(text).not.toContain('Codex-specific rule: do not call `spawn_agent` merely because this skill mentions reviewer personas.');
    expect(text).not.toContain('Codex should inline reviewer personas');
    expect(text).not.toContain('explicit user authorization');
  });
});
