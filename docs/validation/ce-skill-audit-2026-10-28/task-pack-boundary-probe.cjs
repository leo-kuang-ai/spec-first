'use strict';

// 只创建私有临时夹具并调用当前磁盘校验器，不执行任务或写入被审源码。
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { computeSourcePlanHash, validateTaskPack } = require('../../../src/cli/task-pack');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'ce-task-pack-boundary-'));
try {
  const root = path.join(temporary, 'repo');
  const outside = path.join(temporary, 'outside');
  fs.mkdirSync(path.join(root, 'docs/plans'), { recursive: true });
  fs.mkdirSync(outside);
  fs.writeFileSync(path.join(outside, 'external.js'), 'module.exports = 1;\n');
  fs.symlinkSync(outside, path.join(root, 'linked'), 'dir');
  const plan = path.join(root, 'docs/plans/source.md');
  fs.writeFileSync(plan, '---\nstatus: active\n---\n# Source plan\n');
  const hash = computeSourcePlanHash(plan).hash;
  const observations = [];
  for (const file of ['src/example.js', 'linked/external.js', 'linked/new.js', '.opencode/skills/example/SKILL.md', '.claude/skills/example/SKILL.md', '.git/config']) {
    const contract = {
      schema_version: 'task-pack/v1',
      tasks: [{ task_id: 'T1', source_unit: 'U1', dependencies: [], files: [file], goal: 'Change scoped behavior', test_focus: 'Focused behavior', done_signal: 'Focused verification passes', wave: 1, stop_if: 'Scope changes' }],
      execution_waves: [{ wave: 1, tasks: ['T1'] }],
    };
    const pack = path.join(root, 'task-pack.md');
    fs.writeFileSync(pack, `---\ntype: task-pack\ngenerated_by: spec-write-tasks\nstatus: derived\nmode: derived\nsource_plan: docs/plans/source.md\nsource_plan_hash: ${hash}\n---\n## Task Pack Contract\n\n\`\`\`json\n${JSON.stringify(contract)}\n\`\`\`\n`);
    const result = validateTaskPack(pack, { repoRoot: root });
    observations.push({ file, deterministic_handoff: result.deterministic_handoff, validity: result.task_pack_validity, errors: result.errors.map((e) => e.code) });
  }
  process.stdout.write(`${JSON.stringify({ boundary: 'validator-only; no workflow execution or external writes', observations }, null, 2)}\n`);
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
