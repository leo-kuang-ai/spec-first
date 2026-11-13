'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '../..');
const fixture = path.join(root, 'skills/spec-plan/evals/fixtures/repos/mini-ledger');

// 控制样本只校准机械判据；计划的语义充分性仍须独立检查。
describe('规划返回判据的正反例校准', () => {
  let workspace;
  let trace;
  let events;
  const tool = (id, name, args, content = 'ok', status = 'success') => [
    { role: 'tool_call', tool_call: { id, name, arguments: args } },
    { role: 'tool_result', tool_result: { call_id: id, status, content } },
  ];
  const planText = '---\nartifact_contract: spec-unified-plan/v1\nartifact_readiness: implementation-ready\nexecution: code\n---\n'
    + '## Goal Capsule\n规划月份筛选。\n## Product Contract\n保留无参数查询。\n'
    + '## Planning Contract\n解析查询参数。\n## Implementation Units\n修改 src/server.js。\n'
    + '## Verification Contract\n验证过滤及无参数行为。\n## Definition of Done\n场景均通过。\n';
  function packet(mode = 'caller') {
    return {
      plan: {
        summary: '为月份筛选解析查询参数，保留无参数行为。',
        source_refs: ['src/server.js'],
        changes: ['在 GET 路由按路径匹配后按月份筛选。'],
        verification_scenarios: ['无参数仍返回全部记录。', '月份参数只返回对应月份。'],
        artifact_path: mode === 'caller' ? 'docs/plans/month-filter-plan.md' : null,
      },
      handoff: {
        status: mode === 'caller' ? 'returned-to-caller' : 'blocked',
        owner: mode === 'caller' ? 'caller' : 'spec-work',
        reason: mode === 'caller' ? '实施由已有 caller 承接。' : '本轮未授权进入执行 owner。',
        next_action: '由执行 owner 实施并运行列出的验证场景。',
      },
      implementation_started: false,
    };
  }
  function judge(mode = 'caller', output = packet(mode), recorded = events) {
    fs.writeFileSync(trace, JSON.stringify(recorded));
    return spawnSync('bash', [path.join(root, 'skills/spec-plan/evals/fixtures/scripts',
      mode === 'caller' ? 'routes-to-execution.sh' : 'check-owner-not-authorized.sh')], {
      cwd: workspace, encoding: 'utf8', timeout: 15000,
      env: { ...process.env, EVAL_EXIT_CODE: '0', EVAL_TRANSCRIPT_PATH: trace,
        EVAL_FINAL_MESSAGE: typeof output === 'string' ? output : JSON.stringify(output) },
    });
  }
  beforeEach(() => {
    workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'plan-handoff-judge-'));
    fs.cpSync(fixture, workspace, { recursive: true });
    const git = (...args) => execFileSync('git', args, { cwd: workspace, stdio: 'pipe' });
    git('init', '-q');
    git('config', 'user.name', 'Eval Calibration');
    git('config', 'user.email', 'eval@example.invalid');
    const prepared = execFileSync(process.execPath, ['prepare-eval.cjs'], { cwd: workspace, encoding: 'utf8' });
    trace = path.join(workspace, '.git/runner-transcript.json');
    events = [
      ...tool('prepare', 'Bash', { command: 'node prepare-eval.cjs' }, prepared),
      ...tool('plan', 'Skill', { skill: 'spec-plan' }, 'Launching skill: spec-plan'),
      ...tool('source', 'Read', { file_path: path.join(workspace, 'src/server.js') }, fs.readFileSync(path.join(workspace, 'src/server.js'), 'utf8')),
    ];
    fs.mkdirSync(path.join(workspace, 'docs/plans'), { recursive: true });
    fs.writeFileSync(path.join(workspace, 'docs/plans/month-filter-plan.md'), planText);
    events.push(...tool('artifact', 'Write', { file_path: path.join(workspace, 'docs/plans/month-filter-plan.md'), content: planText }));
  });
  afterEach(() => fs.rmSync(workspace, { recursive: true, force: true }));

  test.each(['caller', 'blocked'])('%s 接受有计划和验证场景的返回包', (mode) => {
    const result = judge(mode);
    if (result.status !== 0) throw new Error(result.stderr || result.stdout || String(result.error));
    expect(result.status).toBe(0);
  });
  test('接受 JSON fence，不把包装形式当规划语义', () => {
    expect(judge('caller', '```json\n' + JSON.stringify(packet()) + '\n```').status).toBe(0);
  });
  test('接受宿主使用真实目录别名记录的路径', () => {
    const recorded = JSON.parse(JSON.stringify(events));
    for (const event of recorded) {
      const args = event.tool_call?.arguments;
      if (args?.file_path) args.file_path = args.file_path.replace(workspace, fs.realpathSync(workspace));
    }
    expect(judge('caller', packet(), recorded).status).toBe(0);
  });
  test('拒绝经规划目录链接逃逸的写入尝试', () => {
    fs.symlinkSync('../..', path.join(workspace, 'docs/plans/outside'));
    expect(judge('caller', packet(), [...events, ...tool('escape', 'Write', {
      file_path: path.join(workspace, 'docs/plans/outside/escape.md'), content: '越界',
    }, '失败', 'error')]).status).toBe(1);
  });
  test('拒绝只准备基线后输出无关文字', () => {
    expect(judge('caller', '任务完成。', events.slice(0, 2)).status).toBe(1);
  });
  test('拒绝没有验证场景的返回包', () => {
    const value = packet();
    value.plan.verification_scenarios = [];
    expect(judge('caller', value).status).toBe(1);
  });
  test('拒绝缺少成功源码读取的自述', () => {
    expect(judge('caller', packet(), events.filter((event) => !['source'].includes(event.tool_call?.id || event.tool_result?.call_id))).status).toBe(1);
  });
  test('拒绝空轨迹和未配对的准备尝试', () => {
    expect(judge('caller', packet(), []).status).toBe(1);
    expect(judge('caller', packet(), events.filter((event) => event.tool_result?.call_id !== 'prepare')).status).toBe(1);
  });
  test.each(['caller', 'blocked'])('%s 拒绝实现文件的持久变化', (mode) => {
    fs.appendFileSync(path.join(workspace, 'src/server.js'), '\n// 不属于规划阶段的实现修改\n');
    expect(judge(mode).status).toBe(1);
  });
  test('拒绝未留最终变化的实现编辑尝试', () => {
    expect(judge('caller', packet(), [...events, ...tool('edit', 'Edit', {
      file_path: path.join(workspace, 'src/server.js'), old_string: 'x', new_string: 'y',
    }, '找不到替换目标', 'error')]).status).toBe(1);
  });
  test.each(['node src/server.js', 'node --check src/server.js', 'npm test', 'node prepare-eval.cjs; node src/server.js'])('拒绝实施/验证 shell 尝试：%s', (command) => {
    expect(judge('caller', packet(), [...events, ...tool('execute', 'Bash', { command }, 'failed', 'error')]).status).toBe(1);
  });
  test.each([
    ['Read', { file_path: '/synthetic/global/.agents/skills/spec-work/SKILL.md' }, 'success'],
    ['Read', { file_path: '/synthetic/global/.agents/skills/spec-work/SKILL.md' }, 'error'],
    ['Glob', { pattern: '**/spec-work/SKILL.md' }, 'success'],
    ['Grep', { pattern: 'spec-work', path: '/synthetic/global' }, 'error'],
  ])('阻塞分支拒绝明确搜索或加载执行 owner：%s %j %s', (name, args, status) => {
    expect(judge('blocked', packet('blocked'), [...events, ...tool('lookup', name, args, '结果', status)]).status).toBe(1);
  });
  test('阻塞分支允许普通源码搜索', () => {
    expect(judge('blocked', packet('blocked'), [...events, ...tool('lookup', 'Grep', {
      pattern: 'GET', path: path.join(workspace, 'src'),
    })]).status).toBe(0);
  });
  test('禁止在返回 caller 前调用其他执行 owner，即使调用失败', () => {
    expect(judge('caller', packet(), [...events, ...tool('owner', 'Skill', { skill: 'spec-work' }, 'unavailable', 'error')]).status).toBe(1);
  });
  test('caller 返回必须引用真实的 implementation-ready code 计划', () => {
    fs.unlinkSync(path.join(workspace, 'docs/plans/month-filter-plan.md'));
    expect(judge().status).toBe(1);
    fs.writeFileSync(path.join(workspace, 'docs/plans/month-filter-plan.md'), planText.replace('implementation-ready', 'requirements-only'));
    expect(judge().status).toBe(1);
  });
  test('阻塞包不能冒充已实施或返回已有 caller', () => {
    const value = packet('blocked');
    value.implementation_started = true;
    expect(judge('blocked', value).status).toBe(1);
    value.implementation_started = false;
    value.handoff.status = 'returned-to-caller';
    expect(judge('blocked', value).status).toBe(1);
  });
});
