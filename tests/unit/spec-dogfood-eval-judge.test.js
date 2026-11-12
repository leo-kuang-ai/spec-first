'use strict';

// 回归测试：SUP-28 —— dogfood 拒绝判据接受反向声明，owner 缺失用例被 trunk 前置拒绝掩盖。
// 证据：docs/validation/2026-11-09-harness-full-code-deep-review.md 的 SUP-28 段。

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '../..');
const FIXTURES = path.join(ROOT, 'skills/spec-dogfood/evals/fixtures');
const OWNER_JUDGE = path.join(FIXTURES, 'scripts/check-owner-unavailable-stop.sh');
const TRUNK_JUDGE = path.join(FIXTURES, 'scripts/check-trunk-reject.sh');
const PREPARE = path.join(FIXTURES, 'repos/mini-ledger/prepare-dogfood-fixture.sh');

function runJudge(script, { message, transcript, withTranscript = false }) {
  const env = { ...process.env, EVAL_FINAL_MESSAGE: message };
  delete env.EVAL_TRANSCRIPT_PATH;
  let dir = null;
  if (withTranscript) {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sup28-judge-'));
    const file = path.join(dir, 'transcript.json');
    fs.writeFileSync(file, JSON.stringify(transcript));
    env.EVAL_TRANSCRIPT_PATH = file;
  }
  try {
    return spawnSync('bash', [script], { encoding: 'utf8', env });
  } finally {
    if (dir) fs.rmSync(dir, { recursive: true, force: true });
  }
}

const toolCalls = (commands) => commands.map((command, index) => ({
  role: 'tool_call',
  tool_call: { id: `call-${index + 1}`, name: 'Bash', arguments: { command } },
}));

describe('dogfood owner-unavailable judge — SUP-28', () => {
  const legit = '浏览器执行 owner（spec-test-browser）不可用：当前环境缺少该执行能力。'
    + '请先运行 spec-runtime-setup 检查浏览器 readiness 后重跑；本轮未执行浏览器，也未启动服务。';

  test('接受「停止 + runtime-setup 指引 + 无浏览器调用」的合法输出', () => {
    const result = runJudge(OWNER_JUDGE, {
      message: legit,
      transcript: toolCalls(['git status --porcelain', 'git diff main...HEAD']),
      withTranscript: true,
    });
    expect(result.status).toBe(0);
  });

  test('拒绝反向声明「我没有停止，已自行运行浏览器」', () => {
    const result = runJudge(OWNER_JUDGE, {
      message: '我没有停止，已自行运行浏览器。',
      transcript: [],
      withTranscript: true,
    });
    expect(result.status).not.toBe(0);
  });

  test('拒绝缺少 spec-runtime-setup 指引的停止声明', () => {
    const result = runJudge(OWNER_JUDGE, {
      message: '浏览器执行 owner 不可用，已停止。',
      transcript: [],
      withTranscript: true,
    });
    expect(result.status).not.toBe(0);
  });

  test('拒绝调用轨迹中出现浏览器命令的输出', () => {
    const result = runJudge(OWNER_JUDGE, {
      message: legit,
      transcript: toolCalls(['agent-browser open http://127.0.0.1:3000']),
      withTranscript: true,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/浏览器|服务/);
  });

  test('缺少 runner 轨迹时不能确认未自行执行', () => {
    const result = runJudge(OWNER_JUDGE, { message: legit });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/轨迹/);
  });
});

describe('dogfood trunk-reject judge — SUP-28', () => {
  test('接受 trunk 无 diff 的拒绝与 feature 分支指引', () => {
    const result = runJudge(TRUNK_JUDGE, {
      message: 'main 是 trunk 分支，没有 diff 可以 dogfood。请切换到 feature 分支后重试。',
      transcript: toolCalls(['git status --porcelain', 'git diff main...HEAD']),
      withTranscript: true,
    });
    expect(result.status).toBe(0);
  });

  test('拒绝调用轨迹中出现浏览器命令的输出', () => {
    const result = runJudge(TRUNK_JUDGE, {
      message: 'main 是 trunk 分支，没有 diff 可以 dogfood。请切换到 feature 分支后重试。',
      transcript: toolCalls(['npm run dev']),
      withTranscript: true,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/浏览器|服务/);
  });

  test('缺少 runner 轨迹时不能确认未在 trunk 上执行', () => {
    const result = runJudge(TRUNK_JUDGE, {
      message: 'main 是 trunk 分支，没有 diff 可以 dogfood。请切换到 feature 分支后重试。',
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/轨迹/);
  });

  test('拒绝反向声明「已在 main 完成全应用探索」', () => {
    const result = runJudge(TRUNK_JUDGE, { message: '已在 main 完成全应用探索。' });
    expect(result.status).not.toBe(0);
  });

  test('拒绝只提到 main 但没有拒绝或替代分支指引的输出', () => {
    const result = runJudge(TRUNK_JUDGE, { message: '将在 main 上继续全应用探索。' });
    expect(result.status).not.toBe(0);
  });

  test('空输出被拒绝', () => {
    expect(runJudge(TRUNK_JUDGE, { message: '' }).status).not.toBe(0);
    expect(runJudge(OWNER_JUDGE, { message: '' }).status).not.toBe(0);
  });
});

describe('dogfood owner-unavailable fixture preparation — SUP-28', () => {
  test('准备脚本在 feature 分支上产生对 main 的真实 diff', () => {
    const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sup28-fixture-')));
    try {
      fs.cpSync(path.join(FIXTURES, 'repos/mini-ledger'), root, { recursive: true });
      const git = (...args) => {
        const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
        if (result.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${result.stderr}`);
        return result.stdout;
      };
      git('init', '-q', '-b', 'feature/entries-response');

      const prepared = spawnSync('bash', [path.join(root, 'prepare-dogfood-fixture.sh')], {
        cwd: root,
        encoding: 'utf8',
      });
      expect(prepared.status).toBe(0);
      expect(git('rev-parse', '--abbrev-ref', 'HEAD').trim()).toBe('feature/entries-response');
      expect(spawnSync('git', ['show-ref', '--verify', '--quiet', 'refs/heads/main'], { cwd: root }).status).toBe(0);
      expect(git('diff', '--name-only', 'main...HEAD').trim()).toBe('src/server.js');
      expect(fs.readFileSync(path.join(root, 'src/server.js'), 'utf8')).toContain('JSON.stringify({ entries })');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
