'use strict';

const fs = require('node:fs');
const { getSupportedPlatforms } = require('../../src/cli/adapters');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function section(source, heading) {
  const start = source.indexOf(heading);
  if (start < 0) return '';
  const rest = source.slice(start + heading.length);
  const next = rest.search(/\n## /);
  return next < 0 ? rest : rest.slice(0, next);
}

describe('Skill-flow 剩余 P2 关闭合同', () => {
  test('SF-14 将 app-audit code-review 字段限定为休眠兼容而非 active edge', () => {
    const skill = read('skills/spec-app-consistency-audit/SKILL.md');
    const modeContract = read('skills/spec-app-consistency-audit/references/mode-output-contract.md');
    const mergeScript = read('skills/spec-app-consistency-audit/scripts/merge-contracts.js');
    const consumers = section(skill, '### Downstream Consumers');

    expect(consumers).not.toBe('');
    expect(consumers).not.toContain('`spec-code-review`');
    expect(skill).toContain('休眠兼容字段');
    expect(modeContract).toContain('当前没有受治理的');
    expect(mergeScript).toContain("consumers: ['report-writer']");
  });

  test('SF-15 只列出真正读取 optimization artifact 的 consumer', () => {
    const skill = read('skills/spec-optimize/SKILL.md');

    expect(section(skill, '### Downstream Consumers')).not.toContain('`spec-work`');
  });

  test('SF-16 session historian 只拥有 caller 提供的 scratch artifact return', () => {
    const caller = read('skills/spec-compound/SKILL.md');
    const prompt = read('skills/spec-compound/references/agents/session-historian.md');

    expect(caller).toContain('`output_path: /tmp/spec-first/spec-compound/{run_id}/session-history.md`');
    expect(prompt).toContain('/tmp/spec-first/spec-compound/{run_id}/session-history.md');
    expect(prompt).toContain('caller 提供的 run-local scratch path');
    expect(prompt).toContain('不得写 tracked/product files');
    expect(prompt).toContain('只返回 artifact path');
    expect(prompt).toContain('inline 返回完整 prose');
    expect(prompt).toContain('native file-write tool 写唯一的 `output_path`');
    expect(prompt).not.toContain('Never write any files');
  });

  test('SF-17 worktree 只声明已确认的 public caller', () => {
    const skill = read('skills/spec-worktree/SKILL.md');
    const callers = section(skill, '## Integration');

    expect(callers).toContain('当前已确认的 caller 只有 `spec-dogfood`');
    expect(callers).not.toContain('`spec-work` and `spec-code-review` offer this skill');
  });

  test('SF-19 Figma worker 返回 authority-bounded evidence packet', () => {
    const prompt = read('skills/spec-work/references/agents/figma-design-sync.md');

    expect(prompt).toContain('changed_paths');
    expect(prompt).toContain('verification_evidence');
    expect(prompt).toContain('remaining_differences_or_blockers');
    expect(prompt).toContain('不得 stage、commit、push、创建或更新 PR');
    expect(prompt).toContain('不得修改 lifecycle status');
    expect(prompt).toContain('不得把 generated runtime mirror 当作 source 编辑');
    expect(prompt).toContain('只有修复已应用并完成验证后才能确认完成');
  });

  test('SF-20 code review 在 NO-CACHE 与 helper failure 时 fresh derive 且不持久化', () => {
    const skill = read('skills/spec-code-review/SKILL.md');
    const cacheSection = section(skill, '### Stage 2c: Resolve the shared project profile (cache)');

    expect(cacheSection).toMatch(/`NO-CACHE`[\s\S]*fresh derive profile/i);
    expect(cacheSection).toMatch(/helper invocation 失败[\s\S]*fresh derive/i);
    expect(cacheSection).toMatch(/`NO-CACHE`[\s\S]*跳过 `put`/i);
    expect(cacheSection).not.toContain('skip the cache entirely — do not derive a profile');
  });

  test('SF-21 maintainability 不能用 P1 anchor-50 绕过 synthesis', () => {
    const prompt = read('skills/spec-code-review/references/personas/maintainability-reviewer.md');

    expect(prompt).toContain('Anchor 50 — suppress');
    expect(prompt).toContain('提升为 anchor 75');
    expect(prompt).not.toContain('suppress unless severity is P1');
  });

  test('SF-22 Riffrec analyzer projection 与 canonical owner 保持 byte-identical', () => {
    const ownerPath = 'skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py';
    const projectionPath = 'skills/spec-sweep/scripts/analyze_riffrec_zip.py';
    const owner = fs.readFileSync(ownerPath);
    const projection = fs.readFileSync(projectionPath);

    expect(projection).toEqual(owner);
    expect(owner.toString('utf8')).toContain('Canonical owner：spec-riffrec-feedback-analysis');
    expect(owner.toString('utf8')).toContain('Package-local projection：spec-sweep');
  });

  test('SF-23 仅通过显式 user-owned entrypoint 暴露两个原 orphan helper', () => {
    const governance = JSON.parse(read('src/cli/contracts/dual-host-governance/skills-governance.json'));
    const routeMap = read('skills/using-spec-first/references/public-route-map.md');
    const resolver = read('skills/spec-resolve-pr-feedback/SKILL.md');
    const xcode = read('skills/spec-test-xcode/SKILL.md');

    for (const skillName of ['spec-resolve-pr-feedback', 'spec-test-xcode']) {
      const record = governance.skills.find((entry) => entry.skill_name === skillName);
      expect(record.entry_surface).toBe('standalone_skill');
      expect(Object.keys(record.host_delivery)).toEqual(getSupportedPlatforms());
      expect(Object.values(record.host_delivery)).toEqual(
        getSupportedPlatforms().map(() => 'skill'),
      );
      expect(routeMap).toContain(`\`${skillName}\``);
    }

    expect(resolver).toMatch(/^disable-model-invocation:\s*true$/m);
    expect(resolver).toMatch(/^  - Edit$/m);
    expect(resolver).toMatch(/^  - Agent$/m);
    for (const authority of [
      'local_fix_authorization',
      'commit_authorization',
      'push_authorization',
      'reply_authorization',
      'thread_resolution_authorization',
    ]) {
      expect(resolver).toContain(authority);
    }
    expect(resolver).toContain('workflow invocation 不授权这些副作用');
    expect(xcode).toMatch(/^disable-model-invocation:\s*true$/m);
    expect(xcode).not.toContain('## Integration with spec-code-review');
  });
});
