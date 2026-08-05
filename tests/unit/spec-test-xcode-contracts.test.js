'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');
const skill = fs.readFileSync(path.join(repoRoot, 'skills/spec-test-xcode/SKILL.md'), 'utf8');

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
      expect(skill).toContain(marker);
    }
    expect(skill).toMatch(/provider-confirmed.*真实调用.*返回结果/is);
    expect(skill).toMatch(/source-bound.*revision.*fingerprint/is);
    expect(skill).toMatch(/第一次 build 前.*source identity.*dirty-state\/fingerprint/is);
    expect(skill).toMatch(/MCP readiness.*只证明.*不证明.*build.*launch.*screen/is);
    expect(skill).toMatch(/PARTIAL.*limitation.*不得.*PASS/is);
    expect(skill).toMatch(/final tested actions.*重新捕获.*pre-build identity.*working-tree fingerprint/is);
    expect(skill).toMatch(/comparison 不一致.*禁止.*source-bound.*PARTIAL/is);
  });

  test('keeps invocation user-owned and does not create a shared evidence artifact', () => {
    expect(skill).toContain('本 skill 仅由用户显式调用');
    expect(skill).toMatch(/不创建.*EVIDENCE\.md/is);
    expect(skill).toMatch(/存在真实 canonical command identity.*run summary/is);
  });
});
