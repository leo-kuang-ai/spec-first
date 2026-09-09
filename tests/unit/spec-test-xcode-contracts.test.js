'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');
const skill = fs.readFileSync(path.join(repoRoot, 'skills/spec-test-xcode/SKILL.md'), 'utf8');
// 报告字段由测试阶段消费；加载前生效的证据边界继续固定在入口。
const report = fs.readFileSync(path.join(repoRoot, 'skills/spec-test-xcode/references/test-and-report.md'), 'utf8');

describe('spec-test-xcode evidence contract', () => {
  test('returns bounded provider evidence with source identity and limitations', () => {
    for (const marker of [
      '**Provider:**',
      '**Target identity:**',
      '**Source binding:**',
      '**Evidence authority:**',
      '**Freshness:**',
      '**Limitations:**',
      '**Claim ceiling:**',
    ]) {
      expect(report).toContain(marker);
    }
    expect(skill).toMatch(/provider-confirmed.*actual tool calls.*returned results/is);
    expect(skill).toMatch(/recapture the revision.*fingerprint.*source-bound.*comparison matches/is);
    expect(skill).toMatch(/Before the first build.*source identity.*dirty-state\/fingerprint/is);
    expect(skill).toMatch(/MCP readiness.*only.*does not prove.*build.*launch.*screen/is);
    expect(skill).toMatch(/PARTIAL.*limitations.*must not become PASS/is);
    expect(skill).toMatch(/final tested actions.*recapture.*working-tree fingerprint.*pre-build identity/is);
    expect(skill).toMatch(/mismatch.*forbids.*source-bound.*PARTIAL/is);
  });

  test('keeps invocation user-owned and does not create a shared evidence artifact', () => {
    expect(skill).toContain('This skill is user-invoked only');
    expect(skill).toMatch(/do not create.*EVIDENCE\.md/is);
    expect(skill).toMatch(/run summary.*real canonical command identity/is);
  });
});
