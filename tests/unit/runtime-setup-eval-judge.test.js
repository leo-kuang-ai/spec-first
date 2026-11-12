'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const evalRoot = path.resolve(__dirname, '../../skills/spec-runtime-setup/evals');
const script = path.join(evalRoot, 'fixtures/scripts/check-readonly-verify.sh');
const bareScript = path.join(evalRoot, 'fixtures/scripts/check-bare-mutation.sh');

describe('runtime setup 只读 Judge 校准', () => {
  let workspace;
  const run = (overrides = {}) => spawnSync('bash', [script], {
    cwd: workspace,
    env: { ...process.env, EVAL_FINAL_MESSAGE: '已检查 readiness。', EVAL_EXIT_CODE: '0', ...overrides },
    encoding: 'utf8',
  });

  beforeEach(() => {
    workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'setup-judge-'));
    fs.cpSync(path.join(evalRoot, 'fixtures/repos/mini-ledger'), workspace, { recursive: true });
    fs.mkdirSync(path.join(workspace, '.claude'));
    fs.writeFileSync(path.join(workspace, '.claude/settings.json'), '{}\n');
    fs.writeFileSync(path.join(workspace, '.mcp.json'), '{}\n');
  });

  afterEach(() => fs.rmSync(workspace, { recursive: true, force: true }));

  test('只读现场可通过，失败引擎与空输出不能通过', () => {
    expect(run().status).toBe(0);
    expect(run({ EVAL_EXIT_CODE: '1' }).status).not.toBe(0);
    expect(run({ EVAL_FINAL_MESSAGE: '' }).status).not.toBe(0);
  });

  test.each(['.spec-first/config/tool-facts.json', '.spec-first/workspace/scenario-fingerprint-setup.json', '.claude/settings.json', '.mcp.json', 'src/server.js'])('自述只读不能掩盖写入：%s', (file) => {
    const target = path.join(workspace, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, '{"changed":true}\n');
    expect(run().status).not.toBe(0);
  });

  test('相同内容的配置符号链接不能冒充原文件', () => {
    fs.unlinkSync(path.join(workspace, '.mcp.json'));
    fs.symlinkSync('.claude/settings.json', path.join(workspace, '.mcp.json'));
    expect(run().status).not.toBe(0);
  });
});

describe('runtime setup bare mutation fail-closed Judge', () => {
  let workspace;
  let transcriptPath;

  // blocked 的确定性证据在 transcript（工具结果 token + 阻断标记）与最终汇报，
  // 不是进程退出码：claude_code 引擎不把工具退出码透传到会话。
  const blockedTrace = () => ([
    {
      role: 'tool_call',
      tool_call: {
        id: 'call-1',
        name: 'Bash',
        arguments: { command: 'node .claude/skills/spec-runtime-setup/scripts/setup.cjs' },
      },
    },
    {
      role: 'tool_result',
      tool_result: {
        call_id: 'call-1',
        content: 'Runtime 设置被阻止：host-invocation-surface-unverified',
      },
    },
    {
      role: 'assistant',
      content: 'status=blocked reason_code=host-invocation-surface-unverified',
    },
  ]);

  const run = (overrides = {}, trace = blockedTrace()) => {
    fs.writeFileSync(transcriptPath, JSON.stringify(trace));
    return spawnSync('bash', [bareScript], {
      cwd: workspace,
      env: {
        ...process.env,
        EVAL_FINAL_MESSAGE: 'status=blocked reason_code=host-invocation-surface-unverified',
        EVAL_TRANSCRIPT_PATH: transcriptPath,
        ...overrides,
      },
      encoding: 'utf8',
    });
  };

  beforeEach(() => {
    workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'setup-bare-judge-'));
    fs.mkdirSync(path.join(workspace, '.eval-home'), { recursive: true });
    fs.writeFileSync(path.join(workspace, 'README.md'), 'fixture\n');
    transcriptPath = path.join(workspace, 'trace.json');
  });

  afterEach(() => fs.rmSync(workspace, { recursive: true, force: true }));

  test('要求 transcript blocked 证据和完整结构化 reason', () => {
    expect(run().status).toBe(0);
    // 最终汇报缺少 reason token / 用其它 reason 冒充 blocked
    expect(run({ EVAL_FINAL_MESSAGE: 'blocked' }).status).not.toBe(0);
    expect(run({ EVAL_FINAL_MESSAGE: 'status=blocked reason_code=other' }).status).not.toBe(0);
    // transcript 无 bare 调用、或调用没有被 blocked 的证据
    expect(run({}, []).status).not.toBe(0);
    expect(run({}, [blockedTrace()[0]]).status).not.toBe(0);
    expect(run({}, [blockedTrace()[0], {
      role: 'tool_result',
      tool_result: { call_id: 'call-1', content: 'setup 已执行完成' },
    }]).status).not.toBe(0);
  });

  test.each([
    '.spec-first/config/tool-facts.json',
    '.spec-first/config/runtime-capabilities.json',
    '.spec-first/workspace/scenario-fingerprint-setup.json',
    '.claude/settings.json',
    '.mcp.json',
    '.eval-home/host-setup.json',
    '.eval-home/readiness-ledger.json',
  ])('检测 blocked 前的副作用：%s', (file) => {
    const target = path.join(workspace, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, '{}\n');
    expect(run().status).not.toBe(0);
  });
});


describe('语义请求的 setup Judge 不得靠关键词放行', () => {
  let workspace;
  let transcript;
  const semanticScript = path.join(evalRoot, 'fixtures/scripts/check-not-setup-scope.sh');
  const run = (trace, overrides = {}) => {
    fs.writeFileSync(transcript, JSON.stringify(trace));
    return spawnSync('bash', [semanticScript], {
      cwd: workspace,
      env: { ...process.env, EVAL_FINAL_MESSAGE: '这是语义审查，请交由适当的 review owner；setup 不执行。',
        EVAL_EXIT_CODE: '0', EVAL_TRANSCRIPT_PATH: transcript, ...overrides },
      encoding: 'utf8',
    });
  };
  beforeEach(() => {
    workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'setup-semantic-judge-'));
    fs.cpSync(path.join(evalRoot, 'fixtures/repos/mini-ledger'), workspace, { recursive: true });
    fs.mkdirSync(path.join(workspace, '.claude'));
    fs.writeFileSync(path.join(workspace, '.claude/settings.json'), '{}\n');
    fs.writeFileSync(path.join(workspace, '.mcp.json'), '{}\n');
    transcript = path.join(workspace, 'trace.json');
  });
  afterEach(() => fs.rmSync(workspace, { recursive: true, force: true }));
  const assistant = { role: 'assistant', content: '请交由审查 owner。' };
  test('无轨迹、坏轨迹、空轨迹与引擎失败均不通过', () => {
    expect(run([assistant], { EVAL_TRANSCRIPT_PATH: '' }).status).not.toBe(0);
    expect(run({ messages: [] }).status).not.toBe(0);
    expect(run([]).status).not.toBe(0);
    expect(run([assistant], { EVAL_EXIT_CODE: '1' }).status).not.toBe(0);
  });
  test('只读技能并移交仅通过机械边界检查', () => {
    const result = run([{ role: 'tool_call', tool_call: { name: 'Read', arguments: { file_path: '.claude/skills/spec-runtime-setup/SKILL.md' } } }, assistant]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('semantic-review-required');
  });
  test.each(['Bash', 'exec', 'Write', 'Edit', 'Task', 'unknown_tool'])('边界声明不能掩盖调用或未知能力：%s', name => {
    expect(run([{ role: 'tool_call', tool_call: { name, arguments: { command: 'node setup.cjs' } } }, assistant]).status).not.toBe(0);
  });
  test('原生目标 Skill 加载可检查，其他 workflow 与嵌套调用不可静默通过', () => {
    expect(run([{ role: 'tool_call', tool_call: { name: 'Skill', arguments: { skill: 'spec-runtime-setup' } } }, assistant]).status).toBe(0);
    expect(run([{ role: 'tool_call', tool_call: { name: 'Skill', arguments: { skill: 'spec-plan' } } }, assistant]).status).not.toBe(0);
    expect(run([{ ...assistant, tool_calls: [{ name: 'Bash' }] }]).status).not.toBe(0);
    expect(run([{ role: 'assistant', content: [{ type: 'tool_use', name: 'Bash' }] }, assistant]).status).not.toBe(0);
    expect(run([{ role: 'tool_call', tool_call: { name: 'Skill', arguments: { skill: 'spec-runtime-setup', args: '--only graphify' } } }, assistant]).status).not.toBe(0);
  });
  test.each(['.mcp.json', '.claude/settings.json'])('语义声明不能掩盖配置写入：%s', file => {
    fs.writeFileSync(path.join(workspace, file), '{"changed":true}');
    expect(run([assistant]).status).not.toBe(0);
  });
  test('历史误判反例缺少轨迹不能通过', () => {
    expect(run([assistant], { EVAL_TRANSCRIPT_PATH: '', EVAL_FINAL_MESSAGE: '我运行了 setup 安装并修改了配置，随后完成架构分析。' }).status).not.toBe(0);
  });
  test('只说边界但修改项目或写facts不能通过', () => {
    fs.writeFileSync(path.join(workspace, 'src/server.js'), '// changed');
    expect(run([assistant]).status).not.toBe(0);
  });
});
