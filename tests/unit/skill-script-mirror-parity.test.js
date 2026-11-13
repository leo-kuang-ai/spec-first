'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');
const skillsRoot = path.join(repoRoot, 'skills');

// 跨 skill 同名镜像脚本的字节一致性由自动发现锁定，替代逐族手工枚举路径的
// parity 断言（peer-job-runner ×3 / validate-doc-claims ×2 / analyze_riffrec ×2
// 此前分散在各自测试中；run-python ×5 / working-tree-fingerprint ×2 /
// validate-frontmatter ×2 在本测试之前完全没有锁）。新增镜像（第四个消费
// skill 复制 runner、新 skill 复制 run-python.sh）自动纳入，漏改任一副本
// 立即失败；同名但有意不同内容的脚本必须进入 ALLOWLIST 并给出理由。
//
// 发现范围限定 skills/<skill>/scripts/**（含 lib/ 子目录）；evals/fixtures
// 是测试夹具而非运行时镜像，不参与分组。
const ALLOWLIST = {
  // basename: '原因（为何同名但允许内容不同）'
};

// 已知必须被发现的镜像族：防止 glob 失效导致空发现下的空转通过。
const KNOWN_FAMILIES = [
  'peer-job-runner.py',
  'run-python.sh',
  'validate-doc-claims.py',
  'analyze_riffrec_zip.py',
  'working-tree-fingerprint.cjs',
  'validate-frontmatter.py',
];

function discoverMirrorGroups() {
  const byBasename = new Map();
  for (const skill of fs.readdirSync(skillsRoot)) {
    const scriptsRoot = path.join(skillsRoot, skill, 'scripts');
    if (!fs.statSync(path.join(skillsRoot, skill)).isDirectory()) continue;
    if (!fs.existsSync(scriptsRoot)) continue;
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === '__pycache__') continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
          continue;
        }
        if (!entry.isFile() || entry.name.endsWith('.pyc')) continue;
        const group = byBasename.get(entry.name) || [];
        group.push(path.relative(repoRoot, full));
        byBasename.set(entry.name, group);
      }
    };
    walk(scriptsRoot);
  }
  const groups = [];
  for (const [basename, copies] of byBasename) {
    const skills = new Set(copies.map((copy) => copy.split(path.sep)[1]));
    if (skills.size > 1) groups.push({ basename, copies: copies.sort() });
  }
  return groups.sort((a, b) => a.basename.localeCompare(b.basename));
}

describe('skill script mirror parity (auto-discovered)', () => {
  const groups = discoverMirrorGroups();

  test('mirror discovery finds every known family (guards against silent empty discovery)', () => {
    const found = new Set(groups.map((group) => group.basename));
    const missing = KNOWN_FAMILIES.filter((name) => !found.has(name) && !ALLOWLIST[name]);
    expect(missing).toEqual([]);
    expect(groups.length).toBeGreaterThanOrEqual(KNOWN_FAMILIES.length - Object.keys(ALLOWLIST).length);
  });

  test.each(groups.filter((group) => !ALLOWLIST[group.basename]).map((group) => [group.basename, group.copies]))(
    'mirror family %s stays byte-identical across skills',
    (basename, copies) => {
      const sources = copies.map((copy) => fs.readFileSync(path.join(repoRoot, copy)));
      for (let index = 1; index < sources.length; index += 1) {
        expect(sources[index].equals(sources[0])).toBe(true);
      }
    },
  );

  test('allowlisted families must still exist (no stale allowlist entries)', () => {
    const found = new Set(groups.map((group) => group.basename));
    const stale = Object.keys(ALLOWLIST).filter((name) => !found.has(name));
    expect(stale).toEqual([]);
  });
});
