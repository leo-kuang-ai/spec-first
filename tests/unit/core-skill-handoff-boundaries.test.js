const fs = require('node:fs');
const path = require('node:path');

const read = (relative) => fs.readFileSync(path.join(__dirname, '../../skills', relative), 'utf8');

describe('核心工作流在决策位置保留交接边界', () => {
  test('PR 对齐既要求同一提交，也排除本地索引与工作树变化', () => {
    const scope = read('spec-code-review/references/scope.md').split('**PR scope mode.**')[1].split('**If a branch name')[0];
    expect(scope).toContain('`git rev-parse HEAD` 与本次取得的 `headRefOid` 完全相同');
    expect(scope).toContain('git status --porcelain=v1 --untracked-files=all');
    expect(scope).toContain('git merge-base <baseRefOid> <headRefOid>');
    expect(scope).not.toContain('when unpushed fixes exist, the local tree is canonical');
  });

  test('发布授权限制在实际发送给 goal 的目标里，而非只在上游说明里', () => {
    const objective = read('spec-plan/references/plan-handoff.md').split('The objective: *')[1].split('* Then select')[0];
    expect(objective).toContain('仅在用户对相应动作和范围有明确授权时');
    expect(objective).toContain('计划中的发布策略是交付建议，不是授权');
  });

  test('PRD 写入前按未决行为而非表内残项阻断', () => {
    const gate = read('spec-prd/SKILL.md').split('This gate adds only the write-in preconditions:')[1].split('\n')[0];
    expect(gate).toContain('WHAT、验收、权限或范围');
    expect(gate).toContain('纯实现复核项应保留并交接');
  });

  test('无独立审查不授权写入；仅明确要求本地修复时再交接', () => {
    const handoff = read('spec-code-review/references/scope.md').split('**已授权的串行修复交接。**')[1].split('\n')[0];
    expect(handoff).toContain('用户明确要求本地修复');
    expect(handoff).toContain('`mode:agent`、只读请求和远端范围不触发修复');
    expect(handoff).toContain('需独立验证');
  });

  test('结果摘要承认聊天出口；实施阶段不接管调用方的计划状态', () => {
    expect(read('spec-brainstorm/SKILL.md').split('- **Outputs:**')[1].split('\n')[0]).toContain('不要求文件或稳定编号');
    expect(read('spec-work/SKILL.md')).toContain('Return-to-Caller 只返回 `plan_status_completion_candidate`');
  });
});
