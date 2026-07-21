'use strict';

const fs = require('node:fs');
const path = require('node:path');

const skill = fs.readFileSync(path.resolve(__dirname, '../../skills/spec-plan/SKILL.md'), 'utf8');
const sections = fs.readFileSync(
  path.resolve(__dirname, '../../skills/spec-plan/references/plan-sections.md'),
  'utf8',
);
const handoff = fs.readFileSync(
  path.resolve(__dirname, '../../skills/spec-plan/references/plan-handoff.md'),
  'utf8',
);
const universal = fs.readFileSync(
  path.resolve(__dirname, '../../skills/spec-plan/references/universal-planning.md'),
  'utf8',
);

describe('spec-plan current contracts', () => {
  test('enriches requirements-only unified plans in place', () => {
    expect(skill).toContain('planning should enrich it in place');
    expect(skill).toContain('artifact_readiness: implementation-ready');
    expect(skill).toContain('execution: code');
    expect(skill).toContain('preserve one existing canonical `status`');
    expect(skill).toContain('add `status: active` when it is missing');
    expect(skill).toContain('never turn `completed`, `partially-shipped`, or `superseded` back into `active`');
    expect(skill).toContain('does not add a non-`active` execution intake gate');
    expect(sections).toContain('Duplicate, malformed, or non-canonical status');
  });

  test('writes active only for Markdown software unified plans', () => {
    expect(skill).toContain('only when `OUTPUT_FORMAT=md`');
    expect(skill).toContain('status: active');
    expect(sections).toContain('status is independent of `artifact_readiness`');
    expect(sections).toContain('HTML plans do not carry `status`');
    expect(sections).toMatch(/knowledge-work,\s+universal-planning, answer-seeking, and approach-plan outputs do not carry\s+`status`/);
  });

  test('consumes legacy brainstorm requirements without migration', () => {
    expect(skill).toContain('docs/brainstorms/*-requirements.{md,html}');
    expect(skill).toContain('These remain readable historical inputs; do not migrate or rewrite them.');
    expect(skill).toContain('create a new unified plan in `docs/plans/`');
  });

  test('keeps execution and progress ownership in spec-work', () => {
    expect(skill).toContain('Plans do not carry per-unit progress state');
    expect(skill).toContain('Start `/spec-work`');
    expect(skill).toContain('`spec-work` owns engine selection and the tail');
  });

  test('hands lifecycle completion to the execution tail without making the plan a task tracker', () => {
    expect(handoff).toContain('active → completed');
    expect(handoff).toContain('shipping-tail owner');
    expect(handoff).toContain('before terminal goal completion');
    expect(handoff).toContain('Return-to-Caller');
  });

  test('discovers only current durable requirement origins without narrowing direct entry', () => {
    expect(skill).toContain('exactly two durable origin shapes');
    expect(skill).toContain('product_contract_source: spec-brainstorm');
    expect(skill).toContain('docs/brainstorms/*-requirements.{md,html}');
    expect(skill).toContain('product_contract_source: spec-plan-bootstrap');
    expect(skill).toContain('Do not add a future `product_contract_source: spec-prd` unified origin');
  });

  test('treats age as discovery hint and rechecks durable evidence', () => {
    const relevanceCriteria = skill.match(
      /\*\*Relevance criteria:\*\*[\s\S]*?(?=\n\nCreation within the last 30 days)/,
    );

    expect(relevanceCriteria).not.toBeNull();
    expect(relevanceCriteria[0]).toContain('semantically matches the feature description');
    expect(relevanceCriteria[0]).toContain('cover the same user problem or scope');
    expect(relevanceCriteria[0]).not.toMatch(/30 days|created within|timestamp|age/i);
    expect(skill).toContain('only raises a candidate\'s discovery and ordering priority');
    expect(skill).toContain('Age is never required for relevance or freshness');
    expect(skill).toContain('an older source that still matches the topic and user problem remains eligible');
    expect(skill).toContain('source refs, snapshots/versions, limitations, and invalidation conditions');
    expect(skill).toMatch(/re-read changed source refs/i);
  });

  test('preserves producer blockers and current-user accepted-risk control', () => {
    expect(skill).toContain('checkpoint-prd');
    expect(skill).toContain('can_enter_spec_plan: no');
    expect(skill).toContain('return to the upstream producer by default');
    expect(skill).toContain('direct bootstrap returns to the current user');
    expect(skill).toContain('accepted risk');
    expect(skill).toContain('Do not silently ignore');
  });

  test('does not launder direct-bootstrap WHAT into confirmed product fact', () => {
    expect(skill).toContain('For every load-bearing WHAT used by direct bootstrap');
    expect(skill).toContain('not directly stated by the current user or confirmed by current source');
    expect(skill).toContain('planning-time assumption');
    expect(skill).toContain('never presented as producer-confirmed fact');
    expect(skill).toContain('return it to the current user as a product decision or keep it as a named blocker');
    expect(skill).toContain('bounded bootstrap is not permission to decide it silently');
  });

  test('materializes Proof-only universal plans and publishes the saved file for Save plus Proof', () => {
    expect(universal).toContain('spec-first/spec-plan/<run-id>/');
    expect(universal).toMatch(
      /Publish to Proof[\s\S]*?write the complete plan[\s\S]*?existing local Markdown path[\s\S]*?load `spec-proof`/i,
    );
    expect(universal).toContain('publish that exact saved Markdown file');
    expect(universal).toMatch(/Proof publish fails[\s\S]*?local Markdown path/i);
  });
});
