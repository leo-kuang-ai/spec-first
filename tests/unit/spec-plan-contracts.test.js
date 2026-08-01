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
const evidence = fs.readFileSync(
  path.resolve(__dirname, '../../skills/spec-plan/references/planning-evidence-boundaries.md'),
  'utf8',
);
const synthesis = fs.readFileSync(
  path.resolve(__dirname, '../../skills/spec-plan/references/synthesis-summary.md'),
  'utf8',
);

function sectionBetween(source, start, end) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);

  if (startIndex === -1 || endIndex === -1) return '';
  return source.slice(startIndex, endIndex);
}

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

  test('requirements-only enrichment keeps the upstream Product Contract byte-identical', () => {
    const sourceIntake = sectionBetween(
      skill,
      '#### 0.3 Use the Product Contract as Primary Input',
      '#### 0.4 Planning Bootstrap',
    );

    expect(sourceIntake).toContain('treat the existing Product Contract region as read-only');
    expect(sourceIntake).toContain('`<!-- PRODUCT_CONTRACT_START -->`');
    expect(sourceIntake).toContain('`<!-- PRODUCT_CONTRACT_END -->`');
    expect(sourceIntake).toContain('byte-for-byte unchanged');
    expect(sourceIntake).toContain('Do not add, delete, reorder, reformat, renumber, or normalize');
    expect(sourceIntake).toContain('`Product Contract unchanged (byte-preserved upstream source slice)`');
    expect(sourceIntake).toContain('return the requested product change to the owning producer');
    expect(sourceIntake).not.toContain('either "Product Contract unchanged" or "changed:');

    expect(synthesis).toContain('For brainstorm-sourced requirements-only enrichment');
    expect(synthesis).toContain('leave Stated content in the existing Product Contract');
    expect(synthesis).toContain('Planning Contract `### Implementation Scope Boundaries`');
    expect(synthesis).toContain('never route the stage-2 summary back into the Product Contract');

    expect(sections).toContain('byte-preserved upstream source slice');
    expect(sections).toContain('Planning Contract `### Implementation Scope Boundaries`');
    expect(handoff).toContain('verify that the captured Product Contract region is byte-identical');
    expect(handoff).toContain('block completion and restore the upstream region');
  });

  test('writes active only for Markdown software unified plans', () => {
    expect(skill).toContain('Only when `OUTPUT_FORMAT=md`');
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

  test('进入 resume 或 deepen fast path 前先读取 artifact readiness', () => {
    const resume = sectionBetween(
      skill,
      '#### 0.1 Resume Existing Plan Work When Appropriate',
      '#### 0.1a Recognize Approach-Altitude Requests',
    );

    expect(resume).toContain('Read the target artifact metadata and major-section outline');
    expect(resume).toContain('before committing to a resume or deepen route');
    expect(resume).toContain('artifact_readiness: requirements-only');
    expect(resume).toContain('can_enter_spec_plan: no');
    expect(resume).toContain('Implementation Units');
    expect(resume).toContain('must not enter the Phase 5.3 deepening fast path');
    expect(resume).toContain('A user\'s use of `deepen`');
    expect(resume).toContain('cannot override this eligibility gate');
    expect(skill).toContain('entering planning evaluation does not promise an `implementation-ready` output');
    expect(skill).toContain('A blocked checkpoint or producer handoff is a valid outcome');
    expect(skill).toContain('generate Implementation Units or an implementation handoff');
  });

  test('区分产品决策权限、任务方向与 headless assumptions', () => {
    const blockers = sectionBetween(
      skill,
      '#### 0.5 Classify Outstanding Questions Before Planning',
      '#### 0.6 Assess Plan Depth',
    );

    expect(blockers).toContain('Product Contract decision authority');
    expect(blockers).toContain('explicitly states that they are not the Product Owner');
    expect(blockers).toContain('option 2 is unavailable');
    for (const nonAuthoritySignal of [
      '"Decide it yourself',
      '"don\'t ask',
      '`confirm:auto`',
      'headless',
      'pipeline',
    ]) {
      expect(blockers).toContain(nonAuthoritySignal);
    }
    expect(blockers).toContain('do not create or transfer WHAT decision authority');
    expect(blockers).toContain('Keep the artifact unchanged');
    expect(blockers).toContain('return to the owning producer');
    expect(blockers).toContain('fail closed');

    expect(evidence).toContain('task-direction authority');
    expect(evidence).toContain('Product Contract decision authority');
    expect(evidence).toContain('Asking the model to invent a product decision is not a confirmed decision');
    expect(evidence).toContain('an explicit authority disclaimer takes precedence over a general task instruction');

    expect(synthesis).toContain('only after Phase 0.5 has cleared every true product blocker');
    expect(synthesis).toContain('`Resolve Before Planning`');
    expect(synthesis).toContain('`can_enter_spec_plan: no`');
    expect(synthesis).toContain('must not enter `### Assumptions`');
    expect(synthesis).toContain('product behavior, scope, or success criteria');
    expect(skill.match(/If Phase 0\.5 has not cleared every true product blocker/g)).toHaveLength(2);
    expect(skill).toContain('blocked checkpoint / producer handoff must not rewrite the canonical artifact');
  });

  test('does not launder direct-bootstrap WHAT into confirmed product fact', () => {
    expect(skill).toContain('For every load-bearing WHAT used by direct bootstrap');
    expect(skill).toContain('not directly stated by the current user or confirmed by current source');
    expect(skill).toContain('planning-time assumption');
    expect(skill).toContain('never presented as producer-confirmed fact');
    expect(skill).toContain('return it to the current user as a product decision or keep it as a named blocker');
    expect(skill).toContain('bounded bootstrap is not permission to decide it silently');
  });

  test('keeps universal planning local after retiring Proof publication', () => {
    expect(universal).toContain('**Save to disk**');
    expect(universal).toContain('Current working directory');
    expect(universal).not.toContain('Publish to Proof');
    expect(universal).not.toContain('spec-proof');
    expect(handoff).toContain('**Open in browser**');
  });
});
