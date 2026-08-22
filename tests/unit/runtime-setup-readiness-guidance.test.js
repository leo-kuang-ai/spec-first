'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const skillPath = path.join(repoRoot, 'skills', 'spec-runtime-setup', 'SKILL.md');

describe('Runtime Setup readiness handoff guidance', () => {
  test('shows the first-task template only after full readiness succeeds', () => {
    const skill = fs.readFileSync(skillPath, 'utf8');
    const handoff = skill.split('### Readiness Handoff')[1] || '';

    expect(handoff).toContain('请基于当前项目处理这个任务：<描述你的需求或问题>。');
    expect(handoff).toContain('Please handle this task based on the current project: <describe your requirement or problem>.');
    expect(handoff).toContain('最多 3 行非空输出');
    expect(handoff).toContain('only when the full setup outcome is ready');
  });

  test('keeps every non-ready outcome in the repair and rerun loop', () => {
    const skill = fs.readFileSync(skillPath, 'utf8');
    const handoff = skill.split('### Readiness Handoff')[1] || '';

    expect(handoff).toContain('action-required、degraded、failed');
    expect(handoff).toContain('不得展示上述首次任务模板');
    expect(handoff).toContain('执行报告的 next action 后重新运行 `spec-runtime-setup`');
    expect(handoff).toContain('direct source evidence fallback');
    expect(handoff).toContain('不得把完整 setup 报告为 ready');
    expect(handoff).toContain('不得把 `spec-first doctor` 或额外 `--verify-only` 作为正常 ready 路径的第二道验证');
  });
});
