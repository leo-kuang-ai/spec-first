'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  finalizePrd,
  verifyPrdReceipt,
} = require('../../skills/spec-prd/scripts/finalize-prd-artifact');
const { buildReport } = require('../../skills/spec-prd/scripts/check-prd-artifact');

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function finalIntentPrd() {
  return [
    '---',
    'artifact_kind: prd-requirements',
    'spec_id: finalize-transition',
    'title: Finalize Transition',
    'date: 2026-07-11',
    'status: draft',
    'source_inputs:',
    '  - source/input.md',
    '---',
    '# Finalize Transition',
    '',
    '## Summary',
    '',
    '已有系统需要可靠的 final intent 到 receipt 状态迁移。',
    '',
    '## Change Delta',
    '',
    '| item | current | target | evidence |',
    '| --- | --- | --- | --- |',
    '| receipt | absent | current | confirmed-source |',
    '',
    '## Requirements',
    '',
    '| id | priority | requirement | rationale/source |',
    '| --- | --- | --- | --- |',
    '| R-01 | P0 | final intent 只有 current receipt 后才能 closeout | checker source |',
    '',
    '## Acceptance Examples',
    '',
    '| id | covers | example |',
    '| --- | --- | --- |',
    '| AE-01 | R-01 | Given final intent When finalize Then verified receipt |',
    '',
    '## Scope Boundaries',
    '',
    'In scope: producer-local finalize。',
    '',
    '## Evidence And Assumptions',
    '',
    '| claim | tag | source |',
    '| --- | --- | --- |',
    '| receipt fields are machine-owned | confirmed-source | finalize-prd-artifact.js |',
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
    'decision_card_highest_risk_gap: receipt currentness',
    'decision_card_next_action: final-prd',
    'decision_card_why_no_invention: R-01 与 AE-01 已闭合',
    'can_enter_spec_plan: yes',
    '',
  ].join('\n');
}

describe('spec-prd final intent and receipt transition', () => {
  let projectRoot;
  let prdPath;
  let inputPath;

  beforeEach(() => {
    projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-prd-finalize-transition-'));
    prdPath = path.join(projectRoot, 'docs', 'brainstorms', 'transition-requirements.md');
    inputPath = path.join(projectRoot, 'source', 'input.md');
    write(prdPath, finalIntentPrd());
    write(inputPath, 'confirmed source input\n');
  });

  afterEach(() => {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  });

  test('check-only blocks final intent until the machine receipt exists', () => {
    const receipt = finalizePrd(prdPath, [inputPath], { checkOnly: true });

    expect(receipt.can_finalize).toBe(false);
    expect(receipt.can_closeout).toBe(false);
    expect(receipt.blocking_reason_codes).toContain('ready_receipt_absent');
  });

  test('write mode atomically creates a receipt that the read-only verifier accepts', () => {
    const finalized = finalizePrd(prdPath, [inputPath]);
    const text = fs.readFileSync(prdPath, 'utf8');
    const verified = verifyPrdReceipt(prdPath, [inputPath]);

    expect(finalized.status).toBe('finalized');
    expect(finalized.wrote_ready_receipt).toBe(true);
    expect(text).toMatch(/^status: ready-for-planning$/m);
    expect(text).toMatch(/^readiness_verified_by: check-prd-artifact\.js$/m);
    expect(verified.verified).toBe(true);
    expect(verified.reason_codes).toEqual([]);
    expect(fs.readdirSync(path.dirname(prdPath)).some((entry) => entry.endsWith('.tmp'))).toBe(false);
  });

  test.each(['artifact', 'input'])('%s mutation makes the receipt stale and blocks closeout', (mutation) => {
    finalizePrd(prdPath, [inputPath]);
    if (mutation === 'artifact') {
      fs.appendFileSync(prdPath, '\npost-finalize product change\n', 'utf8');
    } else {
      fs.appendFileSync(inputPath, 'changed input\n', 'utf8');
    }

    const preview = finalizePrd(prdPath, [inputPath], { checkOnly: true });
    const verified = verifyPrdReceipt(prdPath, [inputPath]);

    expect(preview.should_block_closeout).toBe(true);
    expect(preview.blocking_reason_codes).toContain('ready_receipt_stale');
    expect(verified.verified).toBe(false);
    expect(verified.reason_codes).toContain('ready_receipt_stale');
  });

  test.each(['body', 'body-and-input', 'metadata'])('input refresh cannot re-sign changed PRD %s', (mutation) => {
    finalizePrd(prdPath, [inputPath]);
    if (mutation === 'metadata') {
      write(prdPath, fs.readFileSync(prdPath, 'utf8').replace('title: Finalize Transition', 'title: Changed product intent'));
    } else {
      fs.appendFileSync(prdPath, '\nA new product requirement.\n');
    }
    if (mutation === 'body-and-input') fs.appendFileSync(inputPath, 'new evidence\n');
    const before = fs.readFileSync(prdPath);
    for (const checkOnly of [true, false]) {
      const result = finalizePrd(prdPath, [inputPath], { refreshInputsHash: true, checkOnly });
      expect(result.can_finalize).toBe(false);
      expect(result.should_block_closeout).toBe(true);
      expect(result.blocking_reason_codes).toContain('ready_receipt_stale');
      expect(fs.readFileSync(prdPath)).toEqual(before);
    }
    expect(verifyPrdReceipt(prdPath, [inputPath]).verified).toBe(false);
  });

  test('input-only refresh retains the PRD hash and restores a verified receipt', () => {
    const first = finalizePrd(prdPath, [inputPath]);
    fs.appendFileSync(inputPath, 'updated evidence\n');
    const before = fs.readFileSync(prdPath);
    const preview = finalizePrd(prdPath, [inputPath], { refreshInputsHash: true, checkOnly: true });
    expect(preview.can_finalize).toBe(true);
    expect(fs.readFileSync(prdPath)).toEqual(before);
    const refreshed = finalizePrd(prdPath, [inputPath], { refreshInputsHash: true });
    expect(refreshed.status).toBe('finalized');
    expect(refreshed.checker.prd_hash).toBe(first.checker.prd_hash);
    expect(refreshed.checker.inputs_hash).not.toBe(first.checker.inputs_hash);
    expect(verifyPrdReceipt(prdPath, [inputPath]).verified).toBe(true);
  });

  test('product words in implementation questions are advisory, while explicit WHAT conflicts block', () => {
    const marker = '## Readiness Self-Check';
    const question = '| OQ-01 | permission mock file naming | tests/permission.test.js | source-proven | no | implementation-only-how-pushdown | no | closed | Source: tests/permission.test.js |\n\n';
    const text = finalIntentPrd().replace(marker, question + marker);
    const report = buildReport(prdPath, text, { inputs: [inputPath] });
    expect(report.facts.possible_misclassified_how_pushdown_count).toBe(1);
    expect(report.facts.blocking_reason_codes).not.toContain('how_pushdown_touches_what');
    expect(report.facts.blocking_reason_codes).not.toContain('preflight_closure_contradicted');
    write(prdPath, text);
    expect(finalizePrd(prdPath, [inputPath]).status).toBe('finalized');

    const contradictory = text.replace('| no | closed | Source:', '| yes | closed | Source:');
    const conflict = buildReport(prdPath, contradictory, { inputs: [inputPath] });
    expect(conflict.facts.blocking_reason_codes).toContain('planning_invention_question_present');
    expect(conflict.facts.blocking_reason_codes).toContain('how_pushdown_touches_what');
  });
});
