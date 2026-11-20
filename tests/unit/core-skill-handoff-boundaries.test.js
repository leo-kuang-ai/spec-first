const fs = require('node:fs');
const path = require('node:path');

const read = (relative) => fs.readFileSync(path.join(__dirname, '../../skills', relative), 'utf8');

describe('核心工作流在决策位置保留交接边界', () => {
  test('PR 对齐既要求同一提交，也排除本地索引与工作树变化', () => {
    const scope = read('spec-code-review/references/scope.md').split('**PR scope mode.**')[1].split('**If a branch name')[0];
    expect(scope).toContain('git rev-parse HEAD');
    expect(scope).toContain('git status --porcelain=v1 --untracked-files=all');
    expect(scope).toContain('git merge-base <baseRefOid> <headRefOid>');
    expect(scope).not.toContain('when unpushed fixes exist, the local tree is canonical');
  });

  test('发布授权限制在实际发送给 goal 的目标里，而非只在上游说明里', () => {
    const objective = read('spec-plan/references/plan-handoff.md').split('Objective: *')[1].split('* Then select')[0];
    expect(objective).toContain('only when the user has explicit authorization for the corresponding action and scope');
    expect(objective).toContain('the release strategy in the plan is a recommendation, not authorization');
  });

  test('PRD 写入前按未决行为而非表内残项阻断', () => {
    const gate = read('spec-prd/SKILL.md').split('This gate adds only the write-in preconditions:')[1].split('\n')[0];
    expect(gate).toContain('When planners must still determine WHAT, acceptance, permissions, or scope for users, retain blocking; do not write `final-prd`.');
    expect(gate).toContain('The validation items for pure implementation of defined product behaviors should be retained and handed over.');
  });

  test('无独立审查不授权写入；仅明确要求本地修复时再交接', () => {
    const handoff = read('spec-code-review/references/scope.md').split('Authorized serial repair handover.')[1].split('\n')[0];
    expect(handoff).toContain('local repair');
    expect(handoff).toContain('mode:agent');
    expect(handoff).toContain('Only transfer directly verifiable mechanical P2/P3 evidence independently validated; items requiring independent verification, involving permissions or public contracts, or with insufficient evidence remain blocked.');
  });

  test('结果摘要承认聊天出口；实施阶段不接管调用方的计划状态', () => {
    expect(read('spec-brainstorm/SKILL.md').split('- **Outputs:**')[1].split('\n')[0]).toContain('no documents or stable numbering is required');
    expect(read('spec-work/SKILL.md')).toContain('Return-to-Caller returns only `plan_status_completion_candidate`');
  });
});
