'use strict';

// 合成场景只验证漏修可观测性，不代表模型执行了新指令。
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-debug-s10-'));
const git = (...args) => {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
};
const write = (name, content) => fs.writeFileSync(path.join(root, name), content);
const source = (name, fixed) => `exports.${name} = invoice => ${(fixed ? '(invoice.lines ?? [])' : 'invoice.lines')}.reduce((sum, item) => sum + item.price * item.qty, 0)${name === 'tax' ? ' * 0.1' : ''};\n`;
const probe = (name) => {
  const expected = name === 'tax' ? 1 : 10;
  const script = `const assert=require('node:assert/strict');const fn=require('./${name}.js').${name};assert.equal(fn({lines:[{price:5,qty:2}]}),${expected});assert.equal(fn({}),0);`;
  return spawnSync(process.execPath, ['-e', script], { cwd: root, encoding: 'utf8' });
};
try {
  git('init', '-q');
  git('config', 'user.email', 'fixture@example.invalid');
  git('config', 'user.name', 'Fixture');
  for (const name of ['total', 'tax']) write(`${name}.js`, source(name, false));
  git('add', '--', 'total.js', 'tax.js');
  git('-c', 'core.hooksPath=/dev/null', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'baseline');
  console.log('baseline', git('rev-parse', 'HEAD'));
  for (const name of ['total', 'tax']) {
    const result = probe(name);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /undefined.*reduce/);
  }
  console.log('RED: 两处相同输入触发缺失lines的reduce异常');
  write('total.js', source('total', true));
  assert.equal(probe('total').status, 0);
  assert.notEqual(probe('tax').status, 0);
  console.log('PARTIAL: 原入口通过，唯一同根位置tax仍失败');
  write('tax.js', source('tax', true));
  for (const name of ['total', 'tax']) assert.equal(probe(name).status, 0);
  console.log('GREEN: 两处缺失输入及正常计算均通过；仅证明合成fixture的覆盖判据');
} finally { fs.rmSync(root, { recursive: true, force: true }); }
