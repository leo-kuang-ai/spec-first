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
const PLAN_HANDOFF_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-plan',
  'references',
  'plan-handoff.md',
);
const SYNTHESIS_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-plan',
  'references',
  'synthesis-summary.md',
);
const VISUAL_COMMUNICATION_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-plan',
  'references',
  'visual-communication.md',
);
const UNIVERSAL_PLANNING_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-plan',
  'references',
  'universal-planning.md',
);

describe('spec-plan context orientation contract', () => {
  test('uses direct repo context and preserves LLM decision boundary', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');
    expect(text).toContain('Context Orientation Anchor');
    expect(text).toContain('current user request or requirement');
    expect(text).toContain('package manifests and command registries');
    expect(text).toContain('nearby implementation files');
    expect(text).toContain('nearby tests');
    expect(text).toContain('External tools may prioritize inspection, but they do not define scope authority');
    expect(text).toContain('The LLM still chooses the candidate change surface');
    expect(text).toContain('explicit repo context and source-plan constraints');
    expect(text).toContain('target_repo');
    expect(text).toContain('workspace-graph-targets.v1');
    expect(text).toContain('GitNexus-first evidence');
    expect(text).toContain('bounded candidate repos');
    expect(text).toContain('dirty-uncertain');
    expect(text).toContain('do not let scripts or graph facts choose semantically between child repos');
    expect(text).toContain('A cross-repo plan must name `target_repo` per implementation unit');
    expect(text).toContain('ECC Governance Facts (Optional, Advisory)');
    expect(text).toContain('scripts/prepare-ecc-workflow-pilot-brief.js --workflow spec-plan');
    expect(text).toContain('candidate facts, not selected research agents');
    expect(text).toContain('Optional-pack `eligible` is not activation');
    expect(text).toContain('Pilot failure is never a planning failure and never justifies skipping Phase 1 research');
    expect(text).not.toContain('spec-first ' + 'crg hook');
    expect(text).not.toContain('$spec-' + 'graph' + '-bootstrap');
    expect(text).not.toContain('/spec:' + 'graph' + '-bootstrap');
    expect(text).not.toContain('stage0-context');
    expect(text).not.toContain('selected_assets');
  });

  test('consumes canonical graph readiness facts without making them a planning gate', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('.spec-first/graph/graph-facts.json');
    expect(text).toContain('.spec-first/impact/bootstrap-impact-capabilities.json');
    expect((text.match(/## Graph Readiness/g) || []).length).toBeGreaterThanOrEqual(2);
    expect(text).toContain(
      'status: primary | degraded-fallback | stale | blocked | setup-not-ready | unavailable',
    );
    for (const field of [
      '- source_revision:',
      '- current_revision:',
      '- stale:',
      '- primary_providers:',
      '- degraded_providers:',
      '- fallback_capabilities:',
      '- runtime_mcp_evidence:',
      '- confidence:',
      '- limitations:',
    ]) {
      expect(text).toContain(field);
    }
    expect(text).toContain('status: unavailable');
    expect(text).toContain('try live MCP evidence');
    expect(text).toContain('successful response as session-local evidence');
    expect(text).toContain('runtime_mcp_evidence: partial-definitions-only');
    expect(text).toContain('definitions only as local file/symbol pointers');
    expect(text).toContain('does not change compiled `query_ready`');
    expect(text).toContain('successful, partial, or failed live MCP evidence');
    expect(text).toContain('bounded direct repo reads');
    expect(text).toContain('graph readiness is evidence context, not a planning gate');
    expect(text).toContain('Do not expand this into context selection, impact analysis, review evidence');
  });

  test('planning research dispatch is host-neutral with explicit inline fallback', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('Planning research agents are read-only.');
    expect(text).toContain('A direct plan workflow invocation authorizes this documented research phase when host capability exists');
    expect(text).toContain('do not ask for a second subagent confirmation');
    expect(text).toContain('including `spawn_agent` where provided');
    expect(text).toContain('Do not downgrade solely because the host is Codex.');
    expect(text).toContain('run the same research sequentially in the current agent');
    expect(text).toContain('applying it inline as an explicit fallback');
    expect(text).toContain('Plan generation must still complete when research dispatch is unavailable');
    expect(text).toContain('Dispatch these read-only research agents in parallel when available');
    expect(text).toContain('`spec-repo-research-analyst`');
    expect(text).toContain('`spec-learnings-researcher`');
    expect(text).toContain('`spec-best-practices-researcher`');
    expect(text).toContain('`spec-framework-docs-researcher`');
    expect(text).toContain('`spec-spec-flow-analyzer`');
    expect(text).not.toContain('Task spec-repo-research-analyst');
    expect(text).not.toContain('Task spec-learnings-researcher');
    expect(text).not.toContain('Task spec-best-practices-researcher');
    expect(text).not.toContain('Task spec-framework-docs-researcher');
    expect(text).not.toContain('Task spec-spec-flow-analyzer');
    expect(text).not.toContain('`Task` / `Agent` on Claude Code, or `spawn_agent` on Codex');
  });

  test('deepening research fallback distinguishes sequential dispatch from inline current-agent fallback', () => {
    const text = fs.readFileSync(DEEPENING_PATH, 'utf8');

    expect(text).toContain('supports dispatch but not parallel dispatch');
    expect(text).toContain('run the same selected agents sequentially through the host dispatch primitive');
    expect(text).toContain('If dispatch is unavailable, explicitly disabled, or unsafe');
    expect(text).toContain('perform the selected research sequentially in the current agent');
    expect(text).toContain('dispatch_fallback: inline-current-agent');
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

  test('handoff work entrypoint remains host-neutral', () => {
    const text = fs.readFileSync(PLAN_HANDOFF_PATH, 'utf8');
    const skill = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('current host\'s work entrypoint');
    expect(text).toContain('`Start work`, `Compile task pack`, or `Create Issue`');
    expect(text).toContain('Invoke the current host\'s work entrypoint');
    expect(text).toContain('<absolute path to plan>');
    expect(skill).toContain('Act on the user\'s selection');
    expect(skill).toContain('routed action has executed or been explicitly declined');
    expect(text).not.toContain('`Start /spec:work`, `Compile task pack`, or `Create Issue`');
    expect(skill).toContain('**Start work** (recommended)');
    expect(skill).toContain('current host\'s work entrypoint');
    expect(skill).not.toContain('**Start `/spec:work`** (recommended)');
    expect(text).not.toContain('/spec:work <plan-path>` on Claude Code');
    expect(text).not.toContain('$spec-work <plan-path>` on Codex');
    expect(text).not.toContain('/spec:work <task-pack-path>` on Claude Code');
    expect(text).not.toContain('$spec-work <task-pack-path>` on Codex');
    expect(text).not.toContain('`/spec:work` on Claude Code, `$spec-work` on Codex');
  });

  test('plan synthesis checkpoints and template naming are in place', () => {
    const skill = fs.readFileSync(SKILL_PATH, 'utf8');
    const synthesis = fs.readFileSync(SYNTHESIS_PATH, 'utf8');
    const deepening = fs.readFileSync(DEEPENING_PATH, 'utf8');
    const visual = fs.readFileSync(VISUAL_COMMUNICATION_PATH, 'utf8');

    expect(skill).toContain('#### 0.7 Solo-Mode Scope Summary');
    expect(skill).toContain('#### 5.1.5 Brainstorm-Sourced Scope Summary');
    expect(skill).toContain('read `references/synthesis-summary.md`');
    expect(skill).toContain('## Summary');
    expect(skill).toContain('## Requirements');
    expect(skill).toContain('treat `## Overview` as the legacy name');
    expect(skill).toContain('legacy `## Requirements Trace`');
    expect(skill).toContain('## Assumptions');
    expect(skill).toContain('Include only for unconfirmed inferred bets');
    expect(skill).toContain('Keep these out of Key Technical Decisions and Implementation Units');
    const template = skill.split('#### 4.2 Core Plan Template')[1];
    expect(template.indexOf('## Requirements')).toBeLessThan(template.indexOf('## Assumptions'));
    expect(template.indexOf('## Assumptions')).toBeLessThan(template.indexOf('## Scope Boundaries'));
    expect(synthesis).toContain('Solo variant (Phase 0.7)');
    expect(synthesis).toContain('Brainstorm-sourced variant (Phase 5.1.5)');
    expect(synthesis).toContain('## Assumptions');
    expect(deepening).toContain('**Requirements**');
    expect(deepening).toContain('Requirements / Open Questions classification');
    expect(visual).toContain('Summary or Problem Frame');
    expect([skill, synthesis].join('\n')).not.toContain('STRATEGY.md');
    expect([skill, synthesis].join('\n')).not.toContain('/ce-');
  });

  test('universal planning avoids slash-only handoff wording', () => {
    const text = fs.readFileSync(UNIVERSAL_PLANNING_PATH, 'utf8');

    expect(text).toContain('current host\'s plan entrypoint');
    expect(text).toContain('software work entrypoint');
    expect(text).toContain('The user invoked the plan workflow');
    expect(text).not.toContain('Use `/spec:plan` directly');
    expect(text).not.toContain('The user invoked `/spec:plan`');
    expect(text).not.toContain('Do not offer `/spec:work`');
    expect(text).not.toContain('/spec:plan` on Claude Code');
    expect(text).not.toContain('$spec-plan` on Codex');
    expect(text).not.toContain('/spec:work` on Claude Code');
    expect(text).not.toContain('$spec-work` on Codex');
  });
});
