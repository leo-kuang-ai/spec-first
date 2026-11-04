#!/bin/bash
# 只验证机械边界；语义移交是否充分由独立审查判断。
set -euo pipefail
# 与 check-readonly-verify.sh --scope-only 等价的内联哨兵检查；judge 会把单个
# 脚本复制到隔离临时目录执行，兄弟脚本不可达，因此不能跨脚本引用。
# 哨兵清单与 check-readonly-verify.sh 保持同步（两处均为单文件 fixture）。
node <<'NODE'
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
assert.equal(process.env.EVAL_EXIT_CODE, '0', '缺少成功的引擎退出证据');
assert.ok(process.env.EVAL_FINAL_MESSAGE?.trim(), '最终输出为空');
const expected = {
  'README.md': '4aac9f15131207d5e35f3d146e5e0998a26039d49c6ba87432a40e0697a71855',
  'package.json': '03422077e4a5f51c61b08600a3a997da8efeb5928a78950be69d37fa5c5ded2b',
  'src/server.js': 'ff9d96855c23af77404d023eaa9d29fdc2cbea765b31a0ec8d5f9bbaba54cf34',
};
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
NODE
node <<'NODE'
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
assert.ok(process.env.EVAL_TRANSCRIPT_PATH, '缺少 runner 轨迹，不能确认调用边界');
const trace = JSON.parse(fs.readFileSync(process.env.EVAL_TRANSCRIPT_PATH, 'utf8'));
assert.ok(Array.isArray(trace) && trace.length > 0, '空或不支持的轨迹');
assert.ok(trace.some(entry => entry.role === 'assistant' && typeof entry.content === 'string' && entry.content.trim()), '缺少助手输出证据');
for (const entry of trace) {
  assert.ok(entry && typeof entry === 'object' && !Array.isArray(entry), '不支持的轨迹事件');
  assert.ok(entry.content === undefined || typeof entry.content === 'string', '不支持的原生 content 事件，需人工核验');
  assert.ok(['system', 'user', 'assistant', 'tool_call', 'tool_result'].includes(entry.role), '未知轨迹角色，需人工核验');
  // 只接受 runner 标准化的独立 tool_call，嵌套/原生事件不得静默漏检。
  assert.ok(!entry.tool_calls && !entry.function_call, '不支持的嵌套调用轨迹');
  if (entry.role !== 'tool_call') {
    assert.ok(!entry.tool_call, '调用未按 runner 协议标记');
    continue;
  }
  const call = entry.tool_call;
  assert.ok(call && typeof call.name === 'string', '缺少工具身份');
  // 这是本维护用例的保守准入，不是运行时授权器或通用shell解析器。
  // 纯只读巡检命令（git log/status/diff/show、ls、du、cat、head、tail、wc、
  // find、grep、rg、file、stat、pwd）按白名单放行；setup 执行、脚本解释器、
  // 写入与网络仍一律拒绝，复合/未知样本继续交人工核验。
  const readOnlyBash = (command) => {
    if (/[$(`]/.test(command)) return false;
    // 只允许 stderr 重定向（2>&1、2>/dev/null、&>/dev/null）；其余重定向视为写入。
    if (/(^|[^>])>{1,2}\s*(?!&1\b|\/dev\/null\b)\S/.test(command)) return false;
    const gitMutating = ['add', 'commit', 'push', 'pull', 'checkout', 'reset', 'clean', 'stash', 'apply', 'merge', 'rebase', 'rm', 'mv', 'tag', 'branch', 'worktree', 'config', 'clone', 'fetch', 'init', 'restore', 'switch', 'update-index'];
    return command.split(/;|&&|\|\|/).every((segment) => {
      const tokens = segment.trim().split(/\s+/).filter(Boolean);
      if (!tokens.length) return true;
      const head = tokens[0];
      if (head === 'git') {
        if (tokens.some((token) => gitMutating.includes(token))) return false;
        const sub = tokens.slice(1).find((token) => !/^--?[\w.-]+$/.test(token) && !/=.+$/.test(token));
        return ['log', 'status', 'diff', 'show', 'ls-files', 'rev-parse', 'grep', 'blame', 'shortlog', 'describe'].includes(sub);
      }
      return ['ls', 'du', 'cat', 'head', 'tail', 'wc', 'find', 'grep', 'rg', 'file', 'stat', 'pwd', 'echo'].includes(head);
    });
  };
  if (call.name === 'Skill') {
    const args = typeof call.arguments === 'string' ? JSON.parse(call.arguments) : call.arguments;
    assert.equal(args?.skill, 'spec-runtime-setup', '调用其他workflow需要独立审查');
    assert.deepEqual(Object.keys(args), ['skill'], '带额外参数的 Skill 调用不能认定仅加载');
    continue;
  }
  if (call.name === 'Bash' || call.name === 'bash') {
    const args = typeof call.arguments === 'string' ? JSON.parse(call.arguments) : call.arguments;
    assert.ok(readOnlyBash(String(args?.command ?? args ?? '')), 'Bash 调用含非白名单只读命令，机械边界未通过');
    continue;
  }
  assert.ok(['Read', 'read_file', 'Glob', 'Grep'].includes(call.name), '执行/写入/派发或未知工具，机械边界未通过');
}
console.log('mechanical-boundary-only: semantic-review-required；不证明语义移交正确或全局无副作用');
NODE
