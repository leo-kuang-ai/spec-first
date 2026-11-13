'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '../..');
const setupScript = path.join(repoRoot, 'skills/spec-runtime-setup/scripts/setup.cjs');

// 证明边界(2026-09-13 重写,解决 lane finding DR-026/DR-027):
// (1) 加载 runtime-setup 顶层模块树(setup.cjs require 链)不注册吞掉 SIGINT 的
//     handler——busy 持有中的子进程收到 SIGINT 按内核默认处置终止(signal=SIGINT);
// (2) 中断后 home/work 两个候选位置均无 status:complete 的 state.json(缺席即通过形态);
// (3) 同一 home/work 下真实进入工作流路径的 bare 诊断(setup.cjs --check,非 --help
//     提前返回)完整跑完并退出 0——中断未留下阻断重入的残留。
// 历史说明:旧版经 node -e 注入 busy runner 触发 runSetup mutation,但该调用形态已被
// generated-runtime-projection preflight 正当阻断(runner 0 次调用,子进程即刻退出),
// busy 前提失效且 close 监听注册过迟导致必然挂起。"被中断的真实 mutation 恢复/lease
// 修复/子进程树回收"仍是未验证缺口(docs/validation runtime-setup P123),本测试不声称。
test('加载 runtime-setup 模块树不吞 SIGINT,中断后 bare 诊断可完整重入', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-runtime-setup-sigint-'));
  const home = path.join(root, 'home');
  const work = path.join(root, 'work');
  fs.mkdirSync(home, { recursive: true });
  fs.mkdirSync(work, { recursive: true });
  try {
    const child = spawn(process.execPath, [
      '-e',
      `require(${JSON.stringify(setupScript)}); const end = Date.now() + 30000; while (Date.now() < end) {}`,
    ], { cwd: repoRoot, env: { ...process.env, HOME: home, MCP_SETUP_HOST: 'codex' }, stdio: ['ignore', 'pipe', 'pipe'] });
    // 监听器必须在 spawn 后立即注册:子进程若先于 kill 退出,迟注册会永久挂起。
    const firstOutcome = new Promise((resolve) => child.once('close', (code, signal) => resolve({ code, signal })));
    await new Promise((resolve) => setTimeout(resolve, 150));
    if (child.exitCode === null && !child.killed) child.kill('SIGINT');
    const first = await firstOutcome;
    expect(first.signal).toBe('SIGINT');

    const stateCandidates = [
      path.join(home, '.codex/spec-first/state.json'),
      path.join(work, '.codex/spec-first/state.json'),
    ];
    for (const statePath of stateCandidates) {
      if (!fs.existsSync(statePath)) continue;
      const raw = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      expect(raw.status).not.toBe('complete');
    }

    // 真实重入:bare 诊断进入完整工作流路径(注册表加载/快照/诊断),非 --help。
    const rerun = spawn(process.execPath, [setupScript, '--check'], {
      cwd: work,
      env: { ...process.env, HOME: home, MCP_SETUP_HOST: 'codex' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const rerunOutcome = new Promise((resolve) => rerun.once('close', (code, signal) => resolve({ code, signal })));
    const second = await rerunOutcome;
    expect(second.code).toBe(0);
    expect(second.signal).toBeNull();
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}, 40000);
