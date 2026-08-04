'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { validateFixture } = require('../../skills/spec-prd/evals/run-evals');
const { buildReport, parseStructure } = require('../../skills/spec-prd/scripts/check-prd-artifact');

const repoRoot = path.resolve(__dirname, '../..');
const fixturePath = path.join(repoRoot, 'skills/spec-prd/evals/examples.json');
const runnerPath = path.join(repoRoot, 'skills/spec-prd/evals/run-evals.js');
const contractResetProtocolPath = path.join(repoRoot, 'skills/spec-prd/evals/contract-reset-protocol.md');
const contractResetCasesPath = path.join(repoRoot, 'skills/spec-prd/evals/contract-reset-cases.json');

function requirementTraceFixture(acceptanceLines) {
  return [
    '---',
    'artifact_kind: prd-requirements',
    'status: draft',
    'write_mode: checkpoint-prd',
    'can_enter_spec_plan: no',
    '---',
    '## Requirements',
    '| id | requirement | priority |',
    '| --- | --- | --- |',
    '| R-01 | 保存有效配置 | P0 |',
    '| R-02 | 拒绝无效配置 | P0 |',
    '',
    '## Acceptance Examples',
    ...acceptanceLines,
    '',
    '## Scope Boundaries',
    '不包含部署流程。',
    '',
  ].join('\n');
}

describe('spec-prd eval fixture contract', () => {
  test('the checked-in fixture passes deterministic topology validation', () => {
    const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
    const report = validateFixture(fixture, fixturePath);
    expect(report.status).toBe('passed');
    expect(report.invalid_cases).toEqual([]);
    expect(report.case_count).toBeGreaterThan(0);
  });

  test('the source-only eval runner resolves its colocated default fixture', () => {
    const result = spawnSync(process.execPath, [runnerPath, '--json'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(JSON.parse(result.stdout)).toMatchObject({
      status: 'passed',
      fixture: fixturePath,
      reason_code: 'eval_fixture_passed',
    });
  });

  test('Contract Reset eval assets keep deterministic facts separate from semantic Gate A judgment', () => {
    const protocol = fs.readFileSync(contractResetProtocolPath, 'utf8');
    const cases = JSON.parse(fs.readFileSync(contractResetCasesPath, 'utf8'));
    expect(protocol).toContain('没有可证明的硬隔离时不调用模型');
    expect(protocol).toContain('脚本可报告 `awaiting-semantic-review`，但不能自行写“Gate A passed”');
    expect(protocol).toContain('Replay 证明协议可重放，不替代原 run grade');
    expect(cases.run_contract.primary_decision_rule).toContain('at least two');
  });
});

describe('spec-prd requirement acceptance trace contract', () => {
  test.each(['docs/prds/forbidden.md', '/workspace/docs/prds/forbidden.md'])(
    'blocks the forbidden PRD output root for %s',
    (target) => {
      const report = buildReport(target, requirementTraceFixture([]));

      expect(report.findings).toEqual(expect.arrayContaining([
        expect.objectContaining({ reason_code: 'forbidden_prds_path', path: target }),
      ]));
    },
  );

  test.each([
    [
      '游离说明文字',
      [
        '| id | requirement refs | example |',
        '| --- | --- | --- |',
        '| AE-01 | R-01 | 保存后返回成功 |',
        '',
        'Known gap: R-02 has no acceptance example.',
      ],
    ],
    [
      '无效 AE 表格行',
      [
        '| id | requirement refs | example |',
        '| --- | --- | --- |',
        '| AE-01 | R-01 | 保存后返回成功 |',
        '| AE-02 | R-02 | - |',
      ],
    ],
  ])('%s 中的 R 引用不能冒充有效 trace', (_label, acceptanceLines) => {
    const structure = parseStructure(
      'docs/brainstorms/trace-requirements.md',
      requirementTraceFixture(acceptanceLines),
    );

    expect(structure.validAcceptanceExampleIdsInSection).toEqual(['AE-01']);
    expect(structure.requirementsWithoutAcceptanceTrace).toEqual(['R-02']);
  });

  test('有效 AE 表格行与 Given/When/Then block 都能建立 Requirement trace', () => {
    const structure = parseStructure(
      'docs/brainstorms/trace-requirements.md',
      requirementTraceFixture([
        '| id | requirement refs | example |',
        '| --- | --- | --- |',
        '| AE-01 | R-01 | 保存后返回成功 |',
        '',
        '### AE-02',
        'Requirement: R-02',
        'Given 配置无效',
        'When 用户提交配置',
        'Then 系统拒绝保存并返回原因',
      ]),
    );

    expect(structure.validAcceptanceExampleIdsInSection).toEqual(['AE-01', 'AE-02']);
    expect(structure.requirementsWithoutAcceptanceTrace).toEqual([]);
  });

  test('Given/When/Then block 之后的游离 R 说明不能被计入该 AE trace', () => {
    const structure = parseStructure(
      'docs/brainstorms/trace-requirements.md',
      requirementTraceFixture([
        '### AE-01',
        'Requirement: R-01',
        'Given 用户已进入配置页',
        'When 用户保存有效配置',
        'Then 系统返回成功',
        '',
        'Known gap: R-02 still has no acceptance example.',
      ]),
    );

    expect(structure.validAcceptanceExampleIdsInSection).toEqual(['AE-01']);
    expect(structure.requirementsWithoutAcceptanceTrace).toEqual(['R-02']);
  });
});
