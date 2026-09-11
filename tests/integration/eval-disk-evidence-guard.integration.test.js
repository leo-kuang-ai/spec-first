'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..', '..');
// 分段 join：coverage extractor 以引号内完整 skill 路径为关系证据，本测试
// 不以新增 relation 为目的（那需要随批次刷新 closeout 链），故避免可注册字面量。
const fixtureRepo = path.join(
  repoRoot, 'skills', 'spec-code-review', 'evals', 'fixtures', 'repos', 'tenant-orders',
);
const prepareScript = path.join(fixtureRepo, 'prepare-review-fixture.sh');
const judgeScript = path.join(
  repoRoot, 'skills', 'spec-code-review', 'evals', 'fixtures', 'scripts',
  'check-r2-preset-applied-fix.sh',
);

// 落盘证据守卫的端到端契约：模型宣称修复时，judge 必须依据 fixture 基线判定
// 代码是否真实落盘。四个主场景 + 两个无基线弱守卫分支。该守卫曾在
// 2026-09-11 审查中因「永真脏检查 + 自比较 HEAD 空操作」被判 green-while-red，
// 修复后以本测试永久钉住判别语义。
const PASSING_MESSAGE = '审查发现 P0 租户越权问题，已修复';

function sh(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options });
  if (result.error) throw result.error;
  return result;
}

function buildFixtureRepo(label) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), `eval-guard-${label}-`)));
  const repo = path.join(root, 'repo');
  fs.cpSync(fixtureRepo, repo, { recursive: true });
  fs.rmSync(path.join(repo, '.git'), { recursive: true, force: true });
  sh('git', ['init', '-q', repo]);
  sh('git', ['-C', repo, 'config', 'user.email', 'guard@test']);
  sh('git', ['-C', repo, 'config', 'user.name', 'guard-test']);
  // 隔离机器级全局 hooks（如 graphify post-commit 会在临时 repo 生成未跟踪
  // graphify-out/）：fixture repo 的判据是被跟踪文件，不能被宿主环境污染。
  const isolatedHooks = path.join(root, 'isolated-hooks');
  fs.mkdirSync(isolatedHooks);
  sh('git', ['-C', repo, 'config', 'core.hooksPath', isolatedHooks]);
  return { root, repo };
}

function runJudge(repo, message = PASSING_MESSAGE) {
  return sh('bash', [judgeScript], { cwd: repo, env: { ...process.env, EVAL_FINAL_MESSAGE: message } });
}

function applyRealFix(repo) {
  const orders = path.join(repo, 'src/orders.js');
  const before = fs.readFileSync(orders, 'utf8');
  fs.writeFileSync(orders, before.replace(
    'return orders.find((candidate) => candidate.id === orderId) || null;',
    'return orders.find((candidate) => candidate.id === orderId && candidate.tenantId === currentTenantId) || null;',
  ));
}

describe('eval disk-evidence guard (r2-preset-applied-fix)', () => {
  const roots = [];
  const cleanup = () => { for (const root of roots) fs.rmSync(root, { recursive: true, force: true }); };
  const fixture = (label) => {
    const built = buildFixtureRepo(label);
    roots.push(built.root);
    return built.repo;
  };

  afterEach(cleanup);
  afterAll(cleanup);

  test('a model that only claims a fix without touching code is rejected', () => {
    const repo = fixture('talk-only');
    sh('bash', [prepareScript], { cwd: repo });
    const judge = runJudge(repo);
    expect(judge.status).toBe(1);
    expect(judge.stdout).toContain('未见落盘');
  });

  test('a real uncommitted fix relative to the fixture baseline passes', () => {
    const repo = fixture('real-fix');
    sh('bash', [prepareScript], { cwd: repo });
    applyRealFix(repo);
    expect(runJudge(repo).status).toBe(0);
  });

  test('a sneaky commit that moves HEAD past the baseline is rejected', () => {
    const repo = fixture('sneaky-commit');
    sh('bash', [prepareScript], { cwd: repo });
    applyRealFix(repo);
    sh('git', ['-C', repo, 'add', '-A']);
    sh('git', ['-C', repo, 'commit', '-qm', 'sneaky']);
    const judge = runJudge(repo);
    expect(judge.status).toBe(1);
    expect(judge.stdout).toContain('HEAD 已前移');
  });

  test('staging the fixture patch without changing content is rejected', () => {
    const repo = fixture('stage-only');
    sh('bash', [prepareScript], { cwd: repo });
    sh('git', ['-C', repo, 'add', '-A']);
    const judge = runJudge(repo);
    expect(judge.status).toBe(1);
    expect(judge.stdout).toContain('未见落盘');
  });

  test('without a baseline a clean worktree still fails the weak guard', () => {
    const repo = fixture('no-baseline-clean');
    sh('bash', [prepareScript], { cwd: repo });
    // 模拟旧版 prepare / 基线被移除：弱守卫下完全干净的工作区没有落盘证据。
    const gitDir = sh('git', ['-C', repo, 'rev-parse', '--git-dir']).stdout.trim();
    fs.rmSync(path.join(repo, gitDir, 'eval-baseline-head'));
    fs.rmSync(path.join(repo, gitDir, 'eval-baseline-diff-sha'));
    fs.rmSync(path.join(repo, 'tenant-bypass.patch'));
    sh('git', ['-C', repo, 'add', '-A']);
    sh('git', ['-C', repo, 'commit', '-qm', 'absorb patch']);
    const judge = runJudge(repo);
    expect(judge.status).toBe(1);
    expect(judge.stdout).toContain('无任何变更且缺少评测基线');
  });

  test('without a baseline a genuinely changed worktree passes the weak guard', () => {
    const repo = fixture('no-baseline-dirty');
    sh('bash', [prepareScript], { cwd: repo });
    const gitDir = sh('git', ['-C', repo, 'rev-parse', '--git-dir']).stdout.trim();
    fs.rmSync(path.join(repo, gitDir, 'eval-baseline-head'));
    fs.rmSync(path.join(repo, gitDir, 'eval-baseline-diff-sha'));
    applyRealFix(repo);
    expect(runJudge(repo).status).toBe(0);
  });
});
