'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { buildReport } = require('../../skills/spec-prd/scripts/check-prd-artifact');
const { finalizePrd } = require('../../skills/spec-prd/scripts/finalize-prd-artifact');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spec-prd-finalize-'));
}

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function validReadyIntentPrd(extraFrontmatter = '') {
  return `---
artifact_kind: prd-requirements
spec_id: finalize-fixture
title: Finalize Fixture
date: 2026-06-25
${extraFrontmatter}---

# Finalize Fixture

## Summary

一个用于验证 producer-local finalize 的 PRD。

## Change Delta

replace 当前入口。

## Requirements

| ID | Priority | Requirement |
|---|---|---|
| R-10 | P0 | 展示新页面 |

## Acceptance Examples

| ID | Covers | Example |
|---|---|---|
| AE-10 | R-10 | 打开入口后展示新页面 |

## Scope Boundaries

In scope: 新页面。

## Evidence And Assumptions

| Type | Item | Evidence |
|---|---|---|
| confirmed-source | 当前入口存在 | source |

## Readiness Self-Check

- write_mode: final-prd
- clarification_evidence: asked-owner
- can_enter_spec_plan: yes
- preflight_sweep_closure: closed
`;
}

describe('spec-prd producer-local finalize', () => {
  test('checker flags ready self-declaration without a current receipt', () => {
    const report = buildReport('docs/brainstorms/finalize-fixture-requirements.md', validReadyIntentPrd('status: ready-for-planning\n'));

    expect(report.facts.ready_claim_present).toBe(true);
    expect(report.facts.ready_receipt_present).toBe(false);
    expect(report.facts.blocking_reason_codes).toContain('ready_receipt_absent');
  });

  test('finalize check-only blocks frontmatter ready self-declaration without receipt', () => {
    const tempDir = makeTempDir();
    const prdPath = path.join(tempDir, 'docs', 'brainstorms', 'self-ready-requirements.md');

    try {
      write(prdPath, validReadyIntentPrd('status: ready-for-planning\n'));

      const receipt = finalizePrd(prdPath, [], { checkOnly: true });

      expect(receipt.can_finalize).toBe(false);
      expect(receipt.blocking_reason_codes).toContain('ready_receipt_absent');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('finalize refuses PRDs with producer blocking findings', () => {
    const tempDir = makeTempDir();
    const prdPath = path.join(tempDir, 'docs', 'brainstorms', 'bad-requirements.md');

    try {
      write(prdPath, `---
artifact_kind: prd-requirements
spec_id: bad
title: Bad
date: 2026-06-25
---

# Bad

## Summary

缺少核心 section 和 readiness 声明。
`);

      const receipt = finalizePrd(prdPath, [], { checkOnly: true });

      expect(receipt.can_finalize).toBe(false);
      expect(receipt.blocking_reason_codes).toEqual(expect.arrayContaining([
        'core_section_missing',
        'write_mode_undeclared',
        'can_enter_spec_plan_undeclared',
      ]));
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('finalize writes a machine-owned ready receipt when deterministic blockers are absent', () => {
    const tempDir = makeTempDir();
    const prdPath = path.join(tempDir, 'docs', 'brainstorms', 'ready-requirements.md');

    try {
      write(prdPath, validReadyIntentPrd());

      const receipt = finalizePrd(prdPath, []);
      const finalized = fs.readFileSync(prdPath, 'utf8');
      const report = buildReport(prdPath, finalized);

      expect(receipt.can_finalize).toBe(true);
      expect(receipt.status).toBe('finalized');
      expect(finalized).toContain('status: ready-for-planning');
      expect(finalized).toContain('readiness_verified_by: check-prd-artifact.js');
      expect(finalized).toContain('readiness_checker_schema: spec-prd-artifact-check.v1');
      expect(report.facts.ready_receipt_present).toBe(true);
      expect(report.facts.ready_receipt_current).toBe(true);
      expect(report.facts.blocking_reason_codes).toEqual([]);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
