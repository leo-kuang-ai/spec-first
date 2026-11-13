'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const runnerPaths = [
  'spec-code-review',
  'spec-doc-review',
  'spec-pov',
].map((skill) => path.resolve(
  __dirname,
  `../../skills/${skill}/scripts/peer-job-runner.py`,
)).filter((p) => fs.existsSync(p));

if (runnerPaths.length === 0) {
  throw new Error('No peer-job-runner.py copies found for kill-set tests');
}

function resolvePython() {
  for (const command of ['python3', 'python']) {
    const result = spawnSync(command, ['--version'], { encoding: 'utf8' });
    if (!result.error && result.status === 0) return command;
  }
  throw new Error('Python runtime is required for peer-job-runner kill-set tests');
}

const python = resolvePython();

// 与 _pre_reuse_descendant_pids 的契约同构：
// - 截止判定只作用于直接子进程（predates_reuse 为 False 的直接子不入队）；
// - 入队子进程的整个子树无条件保留（后代不再过截止判定）；
// - skip_pid 在任何深度都不返回；
// - children 环不会死循环（keep 集合去重终止）。
const PROBE_SOURCE = [
  'import importlib.util, json, sys',
  'spec = importlib.util.spec_from_file_location("peer_job_runner", sys.argv[1])',
  'module = importlib.util.module_from_spec(spec)',
  'spec.loader.exec_module(module)',
  'pre_reuse = {10, 11, 20}',
  'children = {',
  '    1: [10, 11, 12, 20],',
  '    10: [101],',
  '    101: [1012],',
  '    20: [21],',
  '    12: [121],',
  '}',
  'def predates(pid):',
  '    return pid in pre_reuse',
  'result = {',
  '    "kept": sorted(module._pre_reuse_descendant_pids(1, children, predates)),',
  '    "skip": sorted(module._pre_reuse_descendant_pids(1, children, predates, skip_pid=20)),',
  '    "cycle": sorted(module._pre_reuse_descendant_pids(5, {5: [6], 6: [5, 7]}, lambda pid: True)),',
  '}',
  'print(json.dumps(result))',
].join('\n');

describe('peer-job-runner pre-reuse kill-set behavior', () => {
  test.each(runnerPaths.map((p) => [path.basename(path.dirname(path.dirname(p))), p]))(
    '%s copy keeps pre-reuse subtrees and excludes post-cutoff children',
    (_skill, runnerPath) => {
      const result = spawnSync(python, ['-c', PROBE_SOURCE, runnerPath], { encoding: 'utf8' });
      expect(result.status).toBe(0);
      const parsed = JSON.parse(result.stdout);
      // 12 是复用后新进程的子进程：截止排除；其子树 121 随之排除。
      // 10/11/20 为复用前直接子：保留；其全部后代（101/1012/21）不过截止判定、整树保留。
      expect(parsed.kept).toEqual([10, 11, 20, 21, 101, 1012]);
      // skip_pid=20：20 本身与其子树 21 均不返回。
      expect(parsed.skip).toEqual([10, 11, 101, 1012]);
      // children 环（5<->6）必须终止，不会死循环。
      expect(parsed.cycle).toEqual([5, 6, 7]);
    },
  );
});
