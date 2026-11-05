'use strict';

// fixture-state.cjs 是被 build-outcome-judges.cjs 拼接进生成脚本的共享头（无
// module.exports）。此测试用「完整源码 + 追加导出」的临时文件加载法做函数级
// 正反例锚定，覆盖 A16/A17/A20 修复的边界语义；端到端校准见五套 judge 单测。
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const sourcePath = path.resolve(__dirname, '../../scripts/evals/fixture-state.cjs');
const modulePath = path.join(os.tmpdir(), `fixture-state-test-${process.pid}.cjs`);
fs.writeFileSync(modulePath, `${fs.readFileSync(sourcePath, 'utf8')}\nmodule.exports = {
  fencedBlocks, parseFinalMessage, finalObject, transcriptCalls, commandOf,
  topLevelSegments, internalArgs, firstJsonObject, outputObject, checkCloseout,
};\n`);
const api = require(modulePath);

afterAll(() => fs.rmSync(modulePath, { force: true }));

const call = (command) => ({ arguments: { command }, result: { status: 'success' } });

describe('topLevelSegments composition-suffix boundary (A16)', () => {
  test('single plain command stays one segment', () => {
    expect(api.topLevelSegments('spec-first internal verification-run-summary record --json'))
      .toEqual([['spec-first', 'internal', 'verification-run-summary', 'record', '--json']]);
  });

  test('benign capture tail splits into a second segment', () => {
    // 引号剥离不在本层：topLevelSegments 保留引号，internalArgs 负责去引号。
    expect(api.topLevelSegments('spec-first internal x record; echo "exit=$?"'))
      .toEqual([['spec-first', 'internal', 'x', 'record'], ['echo', '"exit=$?"']]);
  });

  test('semicolon inside quotes does not split', () => {
    expect(api.topLevelSegments('echo "a;b" && spec-first internal x y')).toEqual([
      ['echo', '"a;b"'],
      ['spec-first', 'internal', 'x', 'y'],
    ]);
  });

  test('single | is not a segment boundary and survives as a token', () => {
    expect(api.topLevelSegments('spec-first internal x y | tee out')[0])
      .toEqual(['spec-first', 'internal', 'x', 'y', '|', 'tee', 'out']);
  });

  test('command substitution with inner semicolents splits at the bare semicolon', () => {
    // 扫描器不认 $()：在裸 `;` 处分段。安全方向——首段 `echo $(ls` 不匹配
    // spec-first 身份，internalArgs 返回 null，不会被误判为合法 producer。
    expect(api.topLevelSegments('echo $(ls; pwd) && spec-first internal x y')).toEqual([
      ['echo', '$(ls'],
      ['pwd)'],
      ['spec-first', 'internal', 'x', 'y'],
    ]);
  });
});

describe('internalArgs first-segment identity matching (A16)', () => {
  test('plain producer call returns trailing args', () => {
    expect(api.internalArgs(call('spec-first internal x record --input a.json'), 'x', 'record'))
      .toEqual(['--input', 'a.json']);
  });

  test('node <repo>/bin/spec-first.js form is recognised', () => {
    expect(api.internalArgs(call('node /repo/bin/spec-first.js internal x record --k v'), 'x', 'record'))
      .toEqual(['--k', 'v']);
  });

  test('capture tail does not hide a successful producer call', () => {
    expect(api.internalArgs(call('spec-first internal x record; echo "exit=$?"'), 'x', 'record'))
      .toEqual([]);
  });

  test('unquoted variable capture tail is tolerated too', () => {
    expect(api.internalArgs(call('spec-first internal x record; echo exit=$?'), 'x', 'record'))
      .toEqual([]);
  });

  test('|| fallback tail that could fake producer output is rejected', () => {
    expect(api.internalArgs(call(
      '/missing/spec-first internal x validate --input c.json || printf \'{"overall":"verified"}\'',
    ), 'x', 'validate')).toBeNull();
  });

  test('literal-output tail after semicolon is rejected', () => {
    expect(api.internalArgs(call('spec-first internal x record; echo \'{"ref":"fake"}\''), 'x', 'record'))
      .toBeNull();
  });

  test('&& tail is rejected (no benign case observed)', () => {
    expect(api.internalArgs(call('spec-first internal x record && echo done'), 'x', 'record'))
      .toBeNull();
  });

  test('2>&1 suffix is tolerated', () => {
    expect(api.internalArgs(call('spec-first internal x record 2>&1'), 'x', 'record'))
      .toEqual([]);
  });

  test('pipe in the first segment is still rejected', () => {
    expect(api.internalArgs(call('spec-first internal x record | tee out'), 'x', 'record'))
      .toBeNull();
  });

  test('output redirection in the first segment is still rejected', () => {
    expect(api.internalArgs(call('spec-first internal x record > out.json'), 'x', 'record'))
      .toBeNull();
  });

  test('cd prefix keeps the call unrecognised (identity matched on first segment only)', () => {
    expect(api.internalArgs(call('cd /tmp && spec-first internal x record'), 'x', 'record'))
      .toBeNull();
  });

  test('non spec-first command is rejected', () => {
    expect(api.internalArgs(call('ls -la'), 'x', 'record')).toBeNull();
  });
});

describe('firstJsonObject balanced extraction (A16)', () => {
  test('extracts the object from surrounding noise', () => {
    expect(api.firstJsonObject('noise\n{"a":1}\nexit=0')).toEqual({ a: 1 });
  });

  test('braces inside strings do not affect depth', () => {
    expect(api.firstJsonObject('{"s":"a}b{c"} tail')).toEqual({ s: 'a}b{c' });
  });

  test('escaped quotes inside strings are honoured', () => {
    expect(api.firstJsonObject('{"s":"a\\"b{"}')).toEqual({ s: 'a"b{' });
  });

  test('returns null without an opening brace', () => {
    expect(api.firstJsonObject('plain text only')).toBeNull();
  });

  test('returns null on an unbalanced object', () => {
    expect(api.firstJsonObject('{"a":1')).toBeNull();
  });

  test('returns null when the balanced slice is not valid JSON', () => {
    expect(api.firstJsonObject('{"a":}')).toBeNull();
  });
});

describe('fencedBlocks line-anchored pairing (A20)', () => {
  test('single json fence yields its content', () => {
    expect(api.fencedBlocks('```json\n{"a":1}\n```')).toEqual(['{"a":1}']);
  });

  test('a yaml block does not swallow the following json block opener', () => {
    const text = 'intro\n```yaml\nstatus: partial\n```\nmid\n```json\n{"a":1}\n```';
    expect(api.fencedBlocks(text)).toEqual(['status: partial', '{"a":1}']);
  });

  test('an unclosed fence is dropped, not half-emitted', () => {
    expect(api.fencedBlocks('```json\n{"a":1}')).toEqual([]);
  });

  test('indented fence-like lines are content, not delimiters', () => {
    expect(api.fencedBlocks('```\n  ```inner\nx\n```')).toEqual(['  ```inner\nx']);
  });

  test('a bare fence line inside block content closes early (known limit)', () => {
    // 块内容里的裸 ``` 行会被当作闭栏；栏外行（b）不进任何块，第三个
    // fence 开栏后未闭合被丢弃。锚定现状以防回归时悄然变化。
    expect(api.fencedBlocks('```\na\n```\nb\n```')).toEqual(['a']);
  });
});

describe('message-level parsers use the shared fence extractor', () => {
  const setMessage = (text) => { process.env.EVAL_FINAL_MESSAGE = text; };

  test('parseFinalMessage prefers the whole message when it is JSON', () => {
    setMessage('{"a":1}');
    expect(api.parseFinalMessage()).toEqual({ a: 1 });
  });

  test('parseFinalMessage takes the last parseable block after a yaml block', () => {
    setMessage('here you go\n```yaml\nstatus: partial\n```\n```json\n{"a":1}\n```');
    expect(api.parseFinalMessage()).toEqual({ a: 1 });
  });

  test('parseFinalMessage skips a malformed last block', () => {
    setMessage('```json\n{"a":1}\n```\n```json\n{broken}\n```');
    expect(api.parseFinalMessage()).toEqual({ a: 1 });
  });

  test('finalObject skips array blocks and returns the only object', () => {
    setMessage('[1,2]\n```json\n[3]\n```\n```json\n{"a":1}\n```');
    expect(api.finalObject()).toEqual({ a: 1 });
  });

  test('finalObject takes the LAST object when a draft precedes the final block', () => {
    setMessage('draft:\n```json\n{"value":1200}\n```\nfinal:\n```json\n{"value":9999}\n```');
    expect(api.finalObject()).toEqual({ value: 9999 });
  });

  test('finalObject throws when no candidate parses to an object', () => {
    setMessage('no objects anywhere');
    expect(() => api.finalObject()).toThrow('Expected the requested JSON return envelope');
  });

  afterAll(() => { delete process.env.EVAL_FINAL_MESSAGE; });
});

describe('outputObject unwraps tails on both direct and stdout paths', () => {
  test('plain JSON string content parses', () => {
    expect(api.outputObject({ result: { content: '{"a":1}' } })).toEqual({ a: 1 });
  });

  test('content block arrays join text parts', () => {
    expect(api.outputObject({
      result: { content: [{ type: 'text', text: '{"a":' }, { type: 'text', text: '1}' }] },
    })).toEqual({ a: 1 });
  });

  test('exit-code tail line on direct content is tolerated', () => {
    expect(api.outputObject({ result: { content: '{"a":1}\nexit=0' } })).toEqual({ a: 1 });
  });

  test('exit-code tail line inside stdout is tolerated', () => {
    expect(api.outputObject({ result: { content: { stdout: '{"a":1}\nexit=0' } } })).toEqual({ a: 1 });
  });

  test('non-JSON text without an object returns null', () => {
    expect(api.outputObject({ result: { content: 'ls output only' } })).toBeNull();
  });
});

describe('commandOf accepts the three call shapes', () => {
  test('command, cmd, and argv forms', () => {
    expect(api.commandOf({ arguments: { command: 'a b' } })).toBe('a b');
    expect(api.commandOf({ arguments: { cmd: 'c d' } })).toBe('c d');
    expect(api.commandOf({ arguments: { argv: ['e', 'f'] } })).toBe('e f');
    expect(api.commandOf({ arguments: {} })).toBe('');
  });
});
