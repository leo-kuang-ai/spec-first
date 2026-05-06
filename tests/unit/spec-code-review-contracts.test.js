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

describe('spec-code-review context orientation contract', () => {
  test('starts from diff evidence and keeps findings reviewer-owned', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');
    expect(text).toContain('Context Orientation Anchor');
    expect(text).toContain('diff scope');
    expect(text).toContain('plan/task/work artifacts when present');
    expect(text).toContain('nearby implementation files');
    expect(text).toContain('nearby tests');
    expect(text).toContain('prefer live MCP evidence for concrete review questions');
    expect(text).toContain('fall back to bounded direct repo reads');
    expect(text).toContain('they do not update compiled `query_ready`');
    expect(text).toContain('definitions-only evidence');
    expect(text).toContain('local file/symbol pointers');
    expect(text).toContain('External tools may prioritize inspection, but they do not define scope authority or replace reviewer judgment');
    expect(text).toContain('group changed files by Git repo');
    expect(text).toContain('Resolve graph readiness, diff context, impact evidence, and test suggestions per child repo');
    expect(text).toContain('workspace-graph-targets.v1');
    expect(text).toContain('GitNexus-first evidence for bounded candidate repos');
    expect(text).toContain('degraded-fallback or definitions-only limitations');
    expect(text).toContain('autofix review must not edit a child repo unless that repo is explicit');
    expect(text).toContain('risk assessments must remain scoped to the repo that owns the file');
    expect(text).toContain('ECC governance pilot facts (optional, advisory)');
    expect(text).toContain('scripts/prepare-ecc-code-review-pilot-brief.js');
    expect(text).toContain('candidate facts, not `selected_agents`');
    expect(text).toContain('Optional-pack `eligible` is not activation');
    expect(text).toContain('Pilot failure is never a review failure and never justifies skipping Stage 3');
    expect(text).not.toContain('spec-first ' + 'crg hook');
    expect(text).not.toContain('$spec-' + 'graph' + '-bootstrap');
    expect(text).not.toContain('/spec:' + 'graph' + '-bootstrap');
    expect(text).not.toContain('stage0-context');
    expect(text).not.toContain('selected_assets');
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

  test('model tiering avoids hard-coded non-Claude model names', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('use only a host-provided stable alias or omit the model parameter');
    expect(text).toContain('do not invent a model name from memory');
    expect(text).toContain('on other platforms use a host-provided cheap stable alias or omit the model parameter');
    expect(text).not.toContain('gpt-5.4-mini');
    expect(text).not.toContain('gpt-5.4-nano');
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
    expect(text).toContain('Spawn validators with bounded parallelism');
    expect(text).toContain('bounded queueing rules in Stage 4');
    expect(text).toContain('supports reviewer dispatch but not parallel sub-agents');
    expect(text).toContain('dispatch reviewers sequentially through the same Stage 4 scheduler');
    expect(text).toContain('If the platform has no dispatch primitive, or dispatch is explicitly disabled or unsafe, use the Stage 4 single-agent report-only fallback');
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
    expect(skill).toContain('the orchestrator may write that JSON to `/tmp/spec-first/spec-code-review/{run_id}/{reviewer_name}.json`');
    expect(skill).toContain('Artifact persistence is parent/orchestrator-owned');
  });

  test('supports single-agent report-only fallback when reviewer dispatch is unavailable or unsafe', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('When dispatch is unavailable, explicitly disabled, or unsafe, falls back to a single-agent report-only review instead of bypassing host boundaries.');
    expect(text).toContain('Dispatch capability gate');
    expect(text).toContain('Dispatch capability is part of the runtime boundary, not a reviewer-selection preference.');
    expect(text).toContain('current host\'s code-review workflow entrypoint');
    expect(text).toContain('authorizes this documented reviewer phase; do not ask for a second "use subagents" confirmation');
    expect(text).toContain('Codex supports reviewer dispatch through `spawn_agent`.');
    expect(text).toContain('Do not downgrade solely because the host is Codex.');
    expect(text).toContain('Do not call `spawn_agent` solely because a profile exists');
    expect(text).toContain('workflow\'s documented reviewer phase and host capability select it');
    expect(text).toContain('set `single_agent_report_only_fallback: true`');
    expect(text).toContain('Treat the effective mode as report-only');
    expect(text).toContain('Do not create `/tmp/spec-first/spec-code-review/<run-id>/` and do not write reviewer artifacts.');
    expect(text).toContain('Skip Stage 5b validator dispatch and all fixer paths.');
    expect(text).toContain('single-agent report-only fallback: reviewer dispatch unavailable, explicitly disabled, or unsafe');
    expect(text).toContain('| single-agent report-only fallback | No -- dispatch is unavailable, explicitly disabled, or unsafe | n/a |');
    expect(text).not.toContain('Codex-specific rule: do not call `spawn_agent` merely because this skill mentions reviewer personas.');
    expect(text).not.toContain('Codex should inline reviewer personas');
    expect(text).not.toContain('explicit user authorization');
  });
});
