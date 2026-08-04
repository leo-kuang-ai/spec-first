'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { buildFinalizeReceipt } = require('../../skills/spec-prd/scripts/finalize-prd-artifact');

function readyIntentPrd() {
  return [
    '---',
    'artifact_kind: prd-requirements',
    'spec_id: phase1-exit-safety',
    'title: Phase 1 Exit Safety',
    'date: 2026-07-11',
    'status: draft',
    '---',
    '# Phase 1 Exit Safety',
    '',
    '## Summary',
    '',
    '已有系统需要一个可验证的 PRD 出口。',
    '',
    '## Change Delta',
    '',
    '| item | current | target | evidence |',
    '| --- | --- | --- | --- |',
    '| closeout | implicit | fail-closed | confirmed-source |',
    '',
    '## Requirements',
    '',
    '| id | priority | requirement | rationale/source |',
    '| --- | --- | --- | --- |',
    '| R-01 | P0 | ready claim 必须有 current receipt | checker source |',
    '',
    '## Acceptance Examples',
    '',
    '| id | covers | example |',
    '| --- | --- | --- |',
    '| AE-01 | R-01 | Given receipt 缺失 When closeout Then 阻断 |',
    '',
    '## Scope Boundaries',
    '',
    'In scope: deterministic exit safety。',
    '',
    '## Evidence And Assumptions',
    '',
    '| claim | tag | source |',
    '| --- | --- | --- |',
    '| checker 可读取显式结构 | confirmed-source | check-prd-artifact.js |',
    '',
    '## Outstanding Questions',
    '',
    '| id | question | PRD write target | owner_status | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended_default/deferred_reason |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    '',
    '## Readiness Self-Check',
    '',
    'write_mode: final-prd',
    'clarification_evidence: source-proven-no-ask',
    'preflight_sweep_closure: closed',
    'decision_card_highest_risk_gap: ready receipt 状态迁移',
    'decision_card_next_action: final-prd',
    'decision_card_why_no_invention: R-01 与 AE-01 已明确 closeout 行为',
    'can_enter_spec_plan: yes',
    '',
  ].join('\n');
}

function removeSection(text, heading) {
  const lines = text.split('\n');
  const start = lines.findIndex((line) => line === `## ${heading}`);
  if (start === -1) return text;
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (lines[index].startsWith('## ')) {
      end = index;
      break;
    }
  }
  return [...lines.slice(0, start), ...lines.slice(end)].join('\n');
}

describe('spec-prd Phase 1 exit safety', () => {
  test('composed generic and output contracts expose one canonical Outstanding Questions schema', () => {
    const templateDir = 'skills/spec-prd/assets/templates';
    const templates = fs.readdirSync(templateDir)
      .filter((entry) => entry.endsWith('.md'))
      .map((entry) => fs.readFileSync(path.join(templateDir, entry), 'utf8'))
      .join('\n');
    const outputContract = fs.readFileSync('skills/spec-prd/references/prd-output-template.md', 'utf8');
    const canonicalHeadings = `${templates}\n${outputContract}`
      .match(/^## Outstanding Questions(?:\s|\[|$)/gm) || [];

    expect(canonicalHeadings).toHaveLength(1);
    expect(templates).not.toMatch(/^## .*Outstanding Questions/gm);
  });

  test.each(['Summary', 'Requirements', 'Acceptance Examples'])(
    'ready intent cannot finalize without the %s core section',
    (section) => {
      const receipt = buildFinalizeReceipt(
        'docs/brainstorms/phase1-exit-safety-requirements.md',
        removeSection(readyIntentPrd(), section),
        [],
        { checkOnly: true },
      );

      expect(receipt.can_finalize).toBe(false);
      expect(receipt.should_block_closeout).toBe(true);
      expect(receipt.blocking_reason_codes).toContain('core_section_missing');
    },
  );

  test('draft frontmatter plus final intent cannot close out without a current receipt', () => {
    const receipt = buildFinalizeReceipt(
      'docs/brainstorms/phase1-exit-safety-requirements.md',
      readyIntentPrd(),
      [],
      { checkOnly: true },
    );

    expect(receipt.can_finalize).toBe(false);
    expect(receipt.should_block_closeout).toBe(true);
    expect(receipt.blocking_reason_codes).toContain('ready_receipt_absent');
  });

  test('checkpoint may preserve an incomplete core without claiming ready', () => {
    const checkpoint = removeSection(
      readyIntentPrd()
        .replace('write_mode: final-prd', 'write_mode: checkpoint-prd')
        .replace('decision_card_next_action: final-prd', 'decision_card_next_action: checkpoint-prd')
        .replace('can_enter_spec_plan: yes', 'can_enter_spec_plan: no'),
      'Requirements',
    );
    const receipt = buildFinalizeReceipt(
      'docs/brainstorms/phase1-exit-safety-requirements.md',
      checkpoint,
      [],
      { checkOnly: true },
    );

    expect(receipt.can_finalize).toBe(false);
    expect(receipt.can_closeout).toBe(true);
    expect(receipt.should_block_closeout).toBe(false);
    expect(receipt.blocking_reason_codes).toContain('finalize_required');
    expect(receipt.blocking_reason_codes).not.toContain('core_section_missing');
  });

  test('ready intent requires substantive Requirement and Acceptance Example rows', () => {
    const emptyRequirements = readyIntentPrd().replace(
      '| R-01 | P0 | ready claim 必须有 current receipt | checker source |',
      '',
    );
    const emptyAcceptance = readyIntentPrd().replace(
      '| AE-01 | R-01 | Given receipt 缺失 When closeout Then 阻断 |',
      '',
    );

    const requirementsReceipt = buildFinalizeReceipt(
      'docs/brainstorms/phase1-exit-safety-requirements.md',
      emptyRequirements,
      [],
      { checkOnly: true },
    );
    const acceptanceReceipt = buildFinalizeReceipt(
      'docs/brainstorms/phase1-exit-safety-requirements.md',
      emptyAcceptance,
      [],
      { checkOnly: true },
    );

    expect(requirementsReceipt.blocking_reason_codes).toContain('requirements_row_missing');
    expect(acceptanceReceipt.blocking_reason_codes).toContain('acceptance_example_row_missing');
  });

  test('ready intent requires every valid Requirement row to trace to Acceptance Examples', () => {
    const text = readyIntentPrd().replace(
      '| R-01 | P0 | ready claim 必须有 current receipt | checker source |',
      '| R-02 | P0 | ready claim 必须有 current receipt | checker source |',
    );
    const receipt = buildFinalizeReceipt(
      'docs/brainstorms/phase1-exit-safety-requirements.md',
      text,
      [],
      { checkOnly: true },
    );

    expect(receipt.blocking_reason_codes).toContain('requirement_acceptance_trace_missing');
  });

  test('localized core heading remains legal when it carries the canonical section id', () => {
    const text = readyIntentPrd().replace(
      '## Summary',
      '<!-- prd:section=summary -->\n## 需求概述',
    );
    const receipt = buildFinalizeReceipt(
      'docs/brainstorms/phase1-exit-safety-requirements.md',
      text,
      [],
      { checkOnly: true },
    );

    expect(receipt.blocking_reason_codes).not.toContain('core_section_missing');
  });

  test('validate contract is report-only and never falls through to rewritten PRD output', () => {
    const outputContract = fs.readFileSync('skills/spec-prd/references/prd-output-template.md', 'utf8');
    const validateStart = outputContract.indexOf('For validate mode');
    const validateEnd = outputContract.indexOf('For refine mode', validateStart);
    const validateContract = outputContract.slice(validateStart, validateEnd);

    expect(validateStart).toBeGreaterThanOrEqual(0);
    expect(validateEnd).toBeGreaterThan(validateStart);
    expect(validateContract).toContain('report-only');
    expect(validateContract).not.toContain('produce the final rewritten PRD');
  });
});
