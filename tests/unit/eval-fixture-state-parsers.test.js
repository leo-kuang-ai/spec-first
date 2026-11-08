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
  readCloseoutClaims,
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

  test('newline is a segment boundary like a semicolon (compound preparation prefix)', () => {
    // 模型常在一个 Bash 调用里先 mkdir 再执行本体；换行分段后 check 本体成为独立段，
    // checkCloseout 的段级 token 全等匹配可以命中它（跨模型复验 kiro 藏 A 实例）。
    expect(api.topLevelSegments('mkdir -p d/log\nnode c.cjs 2>&1 | tee d/log/x.log; echo "exit:$?"')).toEqual([
      ['mkdir', '-p', 'd/log'],
      ['node', 'c.cjs', '2>&1', '|', 'tee', 'd/log/x.log'],
      ['echo', '"exit:$?"'],
    ]);
  });

  test('check-redirect tail stays inside the segment as tokens (strip happens in checkCloseout)', () => {
    // stdout 重定向进 check.log_path 是合同鼓励的证据保存（:130/:132 只要求存在 redacted log）；
    // 分层：本层保留 `>` token，checkCloseout 的 stripRedirect 剥离后比对本体。
    expect(api.topLevelSegments('grep -n "Known limitations" README.md > d/log/x.log 2>&1'))
      .toEqual([['grep', '-n', '"Known limitations"', 'README.md', '>', 'd/log/x.log', '2>&1']]);
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

describe('checkCloseout null-ref guard (A22)', () => {
  test('envelope with null verification_run_summary_ref throws a readable AssertionError, not TypeError', () => {
    expect(() => api.checkCloseout({ verification_run_summary_ref: null }))
      .toThrow(/record producer never completed/);
  });

  test('empty-string ref fails the same guard', () => {
    expect(() => api.checkCloseout({ verification_run_summary_ref: '' }))
      .toThrow(/record producer never completed/);
  });
});

describe('readCloseoutClaims temp-root acceptance (large-requirement live round 1)', () => {
  const path = require('node:path');
  const os = require('node:os');

  test('repo-relative input stays the default path (flag off)', () => {
    const repoFile = path.resolve(__dirname, '../..', 'package.json');
    expect(api.readCloseoutClaims(repoFile, false).toString()).toContain('"name"');
  });

  test('tmpdir input is rejected without the flag and accepted with it', () => {
    const file = path.join(fs.realpathSync(os.tmpdir()), `fixture-state-claims-${process.pid}.json`);
    fs.writeFileSync(file, '{"claims":[]}', 'utf8');
    try {
      expect(() => api.readCloseoutClaims(file, false)).toThrow();
      expect(JSON.parse(api.readCloseoutClaims(file, true).toString())).toEqual({ claims: [] });
    } finally {
      fs.rmSync(file, { force: true });
    }
  });

  test('tmp symlink escaping to a non-tmp target is rejected even with the flag', () => {
    const dir = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'fixture-state-escape-'));
    const link = path.join(dir, 'escape.json');
    const target = path.join(dir, 'target.json');
    fs.writeFileSync(target, '{"claims":[]}', 'utf8');
    // 指向 tmp 之外的真实文件：/etc/hosts 在 macOS/Linux 都存在且 realpath 不落在 tmpRoot。
    fs.symlinkSync('/etc/hosts', link);
    try {
      expect(() => api.readCloseoutClaims(link, true)).toThrow(/outside fixture repo and tmpdir/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('checkCloseout log and check-command contract anchors (large-requirement live rounds 2-4)', () => {
  // 集成校准：直接驱动完整 checkCloseout（复用文件顶部的临时模块加载法）。
  // 合同 :132 只要求存在 redacted log（regular() 缺文件即抛），静默形态
  // （absence grep / ! git grep / test 断言 / bash -c 复合）的空日志合法；
  // 防伪由登记命令的段级全等匹配承担（echo 伪造段剥后仍含自身 token）。
  // 登记串按 :157 逐字记实际执行形态：尾部 `echo …$?…` 退出码捕获段被剥
  // （与 internalArgs 对 producer 的既有容忍一致），剩余须单段。
  const REF = '.spec-first/workflows/spec-work/ws/run-1/verification-run-summary.json';
  const LOG_DIR = '.spec-first/workflows/spec-work/ws/run-1/logs';

  const buildRepo = (checks) => {
    const dir = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'closeout-carve-'));
    fs.mkdirSync(path.join(dir, LOG_DIR), { recursive: true });
    const summaryChecks = [];
    const messages = [];
    let id = 0;
    for (const check of checks) {
      id += 1;
      const logRel = `${LOG_DIR}/${check.id}.log`;
      fs.writeFileSync(path.join(dir, logRel), check.log, 'utf8');
      summaryChecks.push({ id: check.id, status: 'passed', ran: true, exit_code: 0,
        log_path: logRel, command: check.command });
      // 段级匹配预期形态：实际执行可带 stdout 重定向进 log（尾部二元组被剥），
      // 登记 command 为本体；absence 形态 exec 与登记同串直接全等。
      const execCommand = check.exec || check.command;
      messages.push({ role: 'tool_call', tool_call: { id: `c${id}`, name: 'Bash', arguments: { command: execCommand } } });
      messages.push({ role: 'tool_result', tool_result: { call_id: `c${id}`, status: 'success', output: check.log } });
    }
    fs.writeFileSync(path.join(dir, REF), JSON.stringify({
      schema_version: 'verification-run-summary.v1', checks: summaryChecks }), 'utf8');
    const claimsRel = 'closeout-claims.json';
    fs.writeFileSync(path.join(dir, claimsRel), JSON.stringify({
      run_summary_ref: REF,
      claims: [{ claim_type: 'validation', asserted_status: 'passed',
        evidence_refs: summaryChecks.map((c) => `verification-run-summary:${c.id}`) }] }), 'utf8');
    id += 1;
    messages.push({ role: 'tool_call', tool_call: { id: `c${id}`, name: 'Bash',
      arguments: { command: 'spec-first internal verification-run-summary record --json --input /dev/stdin' } } });
    messages.push({ role: 'tool_result', tool_result: { call_id: `c${id}`, status: 'success',
      content: JSON.stringify({ run_summary_ref: REF }) } });
    const validateId = `c${id + 1}`;
    messages.push({ role: 'tool_call', tool_call: { id: validateId, name: 'Bash',
      arguments: { command: `spec-first internal honest-closeout validate --json --input ${claimsRel}` } } });
    messages.push({ role: 'tool_result', tool_result: { call_id: validateId, status: 'success',
      content: JSON.stringify({ overall: 'verified' }) } });
    const transcript = path.join(dir, 'transcript.json');
    fs.writeFileSync(transcript, JSON.stringify(messages), 'utf8');
    const envelope = { verification_run_summary_ref: REF,
      honest_closeout_verdict: 'verified', claim_limitations: [] };
    return { dir, transcript, envelope };
  };

  const runCloseout = (repo) => {
    const cwd = process.cwd();
    process.chdir(repo.dir);
    process.env.EVAL_TRANSCRIPT_PATH = repo.transcript;
    try {
      api.checkCloseout(repo.envelope);
      return null;
    } catch (error) {
      return error.message;
    } finally {
      process.chdir(cwd);
      delete process.env.EVAL_TRANSCRIPT_PATH;
    }
  };

  test('silent-form checks with empty logs are legal; positive check keeps segment match', () => {
    // round-2/3 live 实测形态：`[ -z "$(…| tee log)" ]` 空日志、`! git grep` 零输出、
    // 正例 grep 非空日志——三者都合法，段级匹配各自成立。
    const repo = buildRepo([
      { id: 'old-absent', command: '! git grep -n "Known rough edges" -- .', log: '' },
      { id: 'phrase-present',
        command: 'grep -n "Known limitations" README.md',
        exec: `grep -n "Known limitations" README.md > ${LOG_DIR}/phrase-present.log 2>&1`,
        log: 'README.md:3:Known limitations' },
    ]);
    try {
      expect(runCloseout(repo)).toBeNull();
    } finally {
      fs.rmSync(repo.dir, { recursive: true, force: true });
    }
  });

  test('missing log file is rejected (contract :132 existence)', () => {
    const repo = buildRepo([
      { id: 'phrase-present', command: 'grep -n "Known limitations" README.md', log: 'present' },
    ]);
    fs.rmSync(path.join(repo.dir, `${LOG_DIR}/phrase-present.log`));
    try {
      expect(runCloseout(repo)).toMatch(/phrase-present\.log|ENOENT|no such file/i);
    } finally {
      fs.rmSync(repo.dir, { recursive: true, force: true });
    }
  });

  test('absence-form carve-out does not relax the executed-segment forgery guard', () => {
    const repo = buildRepo([
      { id: 'old-absent', command: '! grep -rn "Known rough edges" README.md', log: '' },
    ]);
    // summary 里登记的 command 从未真实执行：改写 transcript 里的执行段。
    const transcript = JSON.parse(fs.readFileSync(repo.transcript, 'utf8'));
    transcript[0].tool_call.arguments.command = 'echo not-the-registered-check';
    fs.writeFileSync(repo.transcript, JSON.stringify(transcript), 'utf8');
    try {
      expect(runCloseout(repo)).toMatch(/No successful check before summary/);
    } finally {
      fs.rmSync(repo.dir, { recursive: true, force: true });
    }
  });

  test('registered expanded-redirect form matches variable-prefixed exec compound line (contract :157)', () => {
    // round-3 live 实测形态：exec 以 `RUN_ROOT="…" && <check> > "$RUN_ROOT/logs/x.log" 2>&1; echo …`
    // 复合行执行，登记按合同 :157 记「前缀变量展开后的最终形态」。两侧对称剥尾部
    // 重定向二元组后 token 全等（变量路径 token 只出现在被剥掉的二元组里）。
    const repo = buildRepo([
      { id: 'readme-diff-scope',
        command: `git diff -- README.md > ${LOG_DIR}/readme-diff-scope.log 2>&1`,
        exec: `RUN_ROOT=".spec-first/workflows/spec-work/ws/run-1" && git diff -- README.md > "$RUN_ROOT/logs/readme-diff-scope.log" 2>&1; echo "exit=$?"; cat "$RUN_ROOT/logs/readme-diff-scope.log"`,
        log: '- Known limitations: demo' },
    ]);
    try {
      expect(runCloseout(repo)).toBeNull();
    } finally {
      fs.rmSync(repo.dir, { recursive: true, force: true });
    }
  });

  test('echo exit-code capture tail is stripped before the single-command requirement (round-4 form)', () => {
    // round-4 live 实测形态：absence 检查以 bash -c 包装（grep 无命中 exit 1 由
    // test 转 0），退出码经 `; echo "exit_code=$?" >> log` 追加进日志。逐字登记后
    // 是两个顶层段：剥掉尾部 echo 捕获段，剩余单段通过归属匹配。
    const logRel = `${LOG_DIR}/old-phrase-absent.log`;
    const repo = buildRepo([
      { id: 'old-phrase-absent-tracked',
        command: `bash -c 'git grep -n "Known rough edges" -- .; test $? -eq 1' > ${logRel} 2>&1; echo "exit_code=$?" >> ${logRel}`,
        log: 'exit_code=0' },
    ]);
    try {
      expect(runCloseout(repo)).toBeNull();
    } finally {
      fs.rmSync(repo.dir, { recursive: true, force: true });
    }
  });
});
