'use strict';

const fs = require('node:fs');
const crypto = require('node:crypto');

const contractPath = 'docs/contracts/workflows/requirements-clarification.md';
const gatePath = 'docs/validation/spec-prd/2026-07-11-spec-prd-contract-reset-gate-a.md';

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

describe('requirements clarification workflow contract', () => {
  test('keeps clarification producer-owned without a new public workflow or artifact', () => {
    const contract = read(contractPath);

    expect(contract).toContain('当前拥有 Product Contract 或 PRD 的 producer 能力');
    expect(contract).toContain('它不是公开 workflow、共享执行器、状态机或第三种 handoff artifact');
    expect(contract).toContain('0→1: spec-ideate → spec-brainstorm → spec-plan');
    expect(contract).toContain('1→10: spec-brainstorm → spec-plan');
    expect(contract).toContain('10→100: spec-prd → spec-plan');
    expect(contract).not.toContain('spec-requirements-clarification` command');
  });

  test('separates deterministic facts, semantic judgment, and sole-user confirmation', () => {
    const contract = read(contractPath);

    expect(contract).toContain('唯一人类产品确认人');
    expect(contract).toContain('创建第二个人类确认人或替代当前用户决策');
    expect(contract).toContain('Scripts/tools');
    expect(contract).toContain('LLM/agent producer');
    expect(contract).toContain('不得联系第二确认人，也不得代替用户签字确认');
    expect(contract).toContain('每轮只向当前用户询问一个最高影响的独立产品问题');
  });

  test('requires source-first questions and durable pause-resume state', () => {
    const contract = read(contractPath);

    expect(contract).toContain('source_attempt: not-applicable');
    expect(contract).toContain('planning 否则会发明的 load-bearing WHAT');
    expect(contract).toContain('`/tmp` dossier、transcript、cache、provider output 与 helper status 只属于加速或 advisory 材料');
    expect(contract).toContain('下一个最高影响问题及其 write target');
    expect(contract).toContain('不得伪造当前用户 closure');
  });

  test('lands only material scenarios in existing Product Contract destinations', () => {
    const contract = read(contractPath);

    expect(contract).toContain('happy path、role/permission、state transition、failure/degraded behavior、negative acceptance 与 cross-context handoff');
    expect(contract).toContain('Acceptance Example、Resolve Before Planning / Outstanding Question、显式 assumption 或 Non-Goal');
    expect(contract).toContain('script 不构造 Cartesian-product checklist，也不裁决适用性');
  });

  test('keeps project language and ADR promotion candidate-only', () => {
    const contract = read(contractPath);

    expect(contract).toContain('不创建或修改项目级 glossary/context/ADR artifact');
    expect(contract).toContain('显式的 “not written by this workflow” 声明');
    expect(contract).toContain('hard to reverse、surprising without context、real tradeoff');
    expect(contract).toContain('缺少项目 topology 不得阻塞 planning');
  });

  test('anchors the current PRD and Gate A no-promotion baseline', () => {
    const contract = read(contractPath);
    const gate = read(gatePath);
    const gateHash = crypto.createHash('sha256').update(gate).digest('hex');

    expect(contract).toContain('analysis_profile=contract-reset-lite');
    expect(contract).toContain('legacy PRD artifact topology');
    expect(contract).toContain('validate 保持 report-only');
    expect(contract).toContain('consumer `--verify-receipt` 诊断保持 optional read-only');
    expect(contract).toContain(gatePath);
    expect(contract).toContain('`inconclusive` 且不 promotion');
    expect(gate).toContain('**Decision:** `inconclusive`');
    expect(gateHash).toBe('dfb7d21b4798cede53f82554d9bf112794e1b346336c01eaa202d761c9d5bfb8');
  });
});
