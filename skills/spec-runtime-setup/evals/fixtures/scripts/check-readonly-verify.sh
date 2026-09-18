#!/bin/bash
# 仅用于 --check 的有界文件副作用检查；不证明宿主外部路径或瞬时写入未发生。
set -euo pipefail
node <<'NODE'
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const expected = {
  "README.md": "4aac9f15131207d5e35f3d146e5e0998a26039d49c6ba87432a40e0697a71855",
  "package.json": "03422077e4a5f51c61b08600a3a997da8efeb5928a78950be69d37fa5c5ded2b",
  "src/server.js": "ff9d96855c23af77404d023eaa9d29fdc2cbea765b31a0ec8d5f9bbaba54cf34"
};
assert.equal(process.env.EVAL_EXIT_CODE, '0', '缺少成功的引擎退出证据');
assert.ok(process.env.EVAL_FINAL_MESSAGE?.trim(), '最终输出为空');
for (const [file, hash] of Object.entries(expected)) {
  assert.ok(fs.lstatSync(file).isFile(), `${file} 必须保持普通文件`);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'), hash, `${file} 内容发生变化`);
}
for (const file of ['.claude/settings.json', '.mcp.json']) {
  assert.ok(fs.lstatSync(file).isFile(), `${file} 必须保持普通文件`);
  assert.equal(fs.readFileSync(file, 'utf8'), '{}\n', `${file} 配置哨兵发生变化`);
}
for (const dir of ['.spec-first/config', '.spec-first/workspace']) {
  assert.ok(!fs.existsSync(dir) && !fs.lstatSync(dir, { throwIfNoEntry: false }), `${dir} 不应由 --check 创建`);
}
assert.match(process.env.EVAL_FINAL_MESSAGE, /readiness|就绪|检查|verify|status|状态|provider|host/i);
console.log('PASS: 夹具字节与配置哨兵保持，setup facts 未产生；不证明全局无副作用');
NODE
