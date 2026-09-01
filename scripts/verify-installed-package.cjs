#!/usr/bin/env node
'use strict';

// 安装后环境的完整包验证：npm pack 真实 tarball → 隔离 prefix 全局安装 →
// 在安装产物上执行宿主生命周期与三加固功能面断言。
// 与 CI 的 npm-install-matrix-smoke.cjs（pack→install→--help）互补：
// files 白名单漏文件只有安装环境才能暴露（repo 内测试有全部文件）。
//
// phase: all(默认) | package | lifecycle | negative | heal
// 多轮测评用法：轮1 package+lifecycle；轮2 negative+幂等；轮3 heal（drift→detect→自愈）。

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { runNpmChecked } = require('./lib/npm-cli.cjs');

const repoRoot = path.resolve(__dirname, '..');
const CHECKS = [];

function pass(id, detail) {
  CHECKS.push(id);
  console.log(`  ✓ ${id}${detail ? `: ${detail}` : ''}`);
}

function fail(id, detail) {
  console.error(`  ✗ ${id}: ${detail}`);
  console.error(`FAIL: 用例 ${id} 未通过（已通过 ${CHECKS.length} 项）`);
  process.exitCode = 1;
  throw new Error(`verification-case-failed:${id}`);
}

function assert(id, condition, detail) {
  if (condition) {
    pass(id, detail);
    return;
  }
  fail(id, detail);
}

// HOME 隔离：init 会写全局 developer profile（os.homedir() 下）；不隔离会
// 污染执行验证的机器的真实 profile（name/hosts 被改写）。main() 创建隔离
// home 后，所有经 run() 的子进程统一继承。
let isolatedHomeDir = null;

function run(command, args, options = {}) {
  const env = { ...(options.env || process.env) };
  if (isolatedHomeDir) {
    env.HOME = isolatedHomeDir;
  }
  return spawnSync(command, args, {
    cwd: options.cwd,
    encoding: 'utf8',
    env,
    stdio: options.stdio || 'pipe',
    windowsHide: true,
  });
}

function runOk(id, command, args, options = {}) {
  const result = run(command, args, options);
  assert(
    id,
    !result.error && result.status === 0,
    `exit=${result.status} ${String(result.stderr || result.error || '').split('\n')[0].slice(0, 160)}`,
  );
  return result;
}

function createGitRepo(dir) {
  fs.mkdirSync(dir, { recursive: true });
  run('git', ['init', '-q'], { cwd: dir });
  run('git', ['symbolic-ref', 'HEAD', 'refs/heads/main'], { cwd: dir });
  run('git', ['config', 'user.name', 'Package Verify'], { cwd: dir });
  run('git', ['config', 'user.email', 'verify@example.com'], { cwd: dir });
  // 隔离宿主全局 hooks / excludesfile（避免 commit 触发生成 graphify-out 等噪声）。
  const disabledHooks = path.join(dir, '.githooks-disabled');
  fs.mkdirSync(disabledHooks, { recursive: true });
  run('git', ['config', 'core.hooksPath', disabledHooks], { cwd: dir });
  run('git', ['config', 'core.excludesfile', path.join(dir, '.gitignore-nonexistent')], { cwd: dir });
  fs.writeFileSync(path.join(dir, 'README.md'), '# verify fixture\n');
  run('git', ['add', '.'], { cwd: dir });
  run('git', ['commit', '-q', '-m', 'fixture'], { cwd: dir });
  return dir;
}

function verifyPackageArtifacts(tempRoot) {
  console.log('\n▸ Phase: package（tarball 完整性与安装）');
  const packDir = path.join(tempRoot, 'pack');
  fs.mkdirSync(packDir, { recursive: true });
  const pack = runNpmChecked(['pack', '--json', '--pack-destination', packDir], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const payload = JSON.parse(String(pack.stdout || ''));
  const packResult = Array.isArray(payload) ? payload[0] : null;
  assert('V1-pack-tarball', packResult && typeof packResult.filename === 'string', packResult && packResult.filename);
  const tarball = path.join(packDir, packResult.filename);

  const listing = run('tar', ['-tf', tarball]);
  const entries = String(listing.stdout || '');
  // files 白名单关键面：bin/src/skills/templates/contracts + 本轮新增的 release-git 模块。
  for (const required of [
    'package/bin/spec-first.js',
    'package/src/cli/index.js',
    'package/skills/spec-runtime-setup/SKILL.md',
    'package/templates/',
    'package/scripts/lib/release-git.cjs',
    'package/docs/contracts/ai-coding-harness.md',
  ]) {
    assert(`V2-tarball-contains:${required.split('/').pop()}`, entries.includes(required), required);
  }

  const prefix = path.join(tempRoot, 'prefix');
  runNpmChecked(['install', '--global', '--prefix', prefix, tarball], { cwd: repoRoot, stdio: 'inherit' });
  pass('V3-global-install', prefix);

  const globalRoot = String(runNpmChecked(['root', '--global', '--prefix', prefix], {
    cwd: repoRoot,
    encoding: 'utf8',
  }).stdout || '').trim();
  const installedRoot = path.join(globalRoot, 'spec-first');
  const cli = path.join(installedRoot, 'bin', 'spec-first.js');
  assert('V4a-installed-cli-exists', fs.existsSync(cli), cli);

  const versionOut = run(process.execPath, [cli, '--version']);
  assert(
    'V4b-installed-version',
    versionOut.status === 0 && String(versionOut.stdout).includes(packResult.version),
    packResult.version,
  );

  // require 可达性：files 白名单缺模块时（脚本在包内但 lib 不在）此处崩溃。
  const requireCheck = run(process.execPath, ['-e', "require('./scripts/lib/release-git.cjs'); console.log('ok')"], {
    cwd: installedRoot,
  });
  assert('V5-require-release-git', requireCheck.status === 0, String(requireCheck.stdout).trim());
  return { cli, installedRoot };
}

function verifyLifecycle(cli, tempRoot) {
  console.log('\n▸ Phase: lifecycle（安装环境的宿主生命周期）');
  const repo = createGitRepo(path.join(tempRoot, 'repo'));

  const initCodex = run(process.execPath, [cli, 'init', '--codex', '-y', '-u', 'tester', '--lang', 'zh'], { cwd: repo });
  assert('V6-init-codex', initCodex.status === 0, String(initCodex.stdout).split('\n')[0]);
  for (const required of [
    path.join('.codex', 'spec-first', 'state.json'),
    // codex 是 skill-only 发现（adapter hasCommands=false），投射面在 .agents/skills/。
    path.join('.agents', 'skills', 'spec-runtime-setup'),
    'AGENTS.md',
    'CHANGELOG.md',
  ]) {
    assert(`V6a-asset:${path.basename(required)}`, fs.existsSync(path.join(repo, required)), required);
  }
  const state = JSON.parse(fs.readFileSync(path.join(repo, '.codex', 'spec-first', 'state.json'), 'utf8'));
  assert('V6b-state-platform', state.platform === 'codex', state.platform);

  const doctorCodex = run(process.execPath, [cli, 'doctor', '--codex', '--json'], { cwd: repo });
  let doctorOk = false;
  try {
    // has_error 只在为 true 时写入报告；干净状态为缺失/null。
    doctorOk = JSON.parse(String(doctorCodex.stdout)).has_error !== true;
  } catch (_) { doctorOk = false; }
  assert('V7-doctor-codex-clean', doctorCodex.status === 0 && doctorOk, 'has_error!=true');

  // 幂等刷新：常规路径（备份→成功→清理）不应留下临时残留。
  const reinit = run(process.execPath, [cli, 'init', '--codex', '-y', '-u', 'tester', '--lang', 'zh'], { cwd: repo });
  const tmpResidue = fs.readdirSync(repo).filter((name) => name.includes('.tmp'));
  assert('V12-reinit-idempotent', reinit.status === 0 && tmpResidue.length === 0, `residue=${tmpResidue.length}`);

  const initClaude = run(process.execPath, [cli, 'init', '--claude', '-y', '-u', 'tester', '--lang', 'zh'], { cwd: repo });
  assert('V13-init-claude', initClaude.status === 0, String(initClaude.stdout).split('\n')[0]);
  assert('V13a-claude-runtime', fs.existsSync(path.join(repo, '.claude', 'spec-first', 'state.json')), '.claude state');
  // claude 是 command-backed 宿主：当前投射为扁平式 .claude/commands/spec-*.md。
  assert('V13c-claude-commands', fs.existsSync(path.join(repo, '.claude', 'commands', 'spec-plan.md')), '.claude/commands/spec-plan.md');
  assert('V13b-claude-instruction', fs.existsSync(path.join(repo, 'CLAUDE.md')), 'CLAUDE.md');

  const doctorBoth = run(process.execPath, [cli, 'doctor', '--claude', '--codex', '--json'], { cwd: repo });
  let bothPlatforms = null;
  try { bothPlatforms = JSON.parse(String(doctorBoth.stdout)).platforms; } catch (_) { /* asserted below */ }
  assert(
    'V15-doctor-both-hosts',
    doctorBoth.status === 0 && Array.isArray(bothPlatforms) && bothPlatforms.includes('claude') && bothPlatforms.includes('codex'),
    String(bothPlatforms),
  );

  // dry-run 输出使用小写 platform id；语言跟随 fixture profile（zh）。
  const cleanDry = run(process.execPath, [cli, 'clean', '--claude', '--dry-run'], { cwd: repo });
  assert(
    'V16a-clean-dry-run',
    cleanDry.status === 0 && String(cleanDry.stdout).includes('演练') && String(cleanDry.stdout).includes('未修改任何文件'),
    'zh dry-run + no changes',
  );

  const cleanClaude = run(process.execPath, [cli, 'clean', '--claude'], { cwd: repo });
  assert(
    'V16b-clean-claude',
    cleanClaude.status === 0
      && !fs.existsSync(path.join(repo, '.claude', 'spec-first'))
      && String(cleanClaude.stdout).includes('Claude Code'),
    'claude runtime removed + registry displayName',
  );
  // codex 仍在：AGENTS.md 的受管内容必须被共享消费者逻辑保留。
  const agentsMd = fs.readFileSync(path.join(repo, 'AGENTS.md'), 'utf8');
  assert('V16c-shared-instruction-kept', agentsMd.includes('spec-first'), 'AGENTS.md preserved for codex');

  const cleanCodex = run(process.execPath, [cli, 'clean', '--codex'], { cwd: repo });
  assert('V11-clean-codex', cleanCodex.status === 0 && !fs.existsSync(path.join(repo, '.codex', 'spec-first')), 'codex runtime removed');

  const doctorEmpty = run(process.execPath, [cli, 'doctor'], { cwd: repo });
  assert(
    'V17-doctor-empty-after-clean',
    doctorEmpty.status === 0 && String(doctorEmpty.stdout).includes('No spec-first platform detected'),
    'clean slate',
  );
  return repo;
}

function verifyNegative(cli, tempRoot) {
  console.log('\n▸ Phase: negative（用法错误与 registry 派生拒绝面）');
  const repo = createGitRepo(path.join(tempRoot, 'repo-neg'));

  for (const [id, args, expectExit] of [
    ['N2-init-bogus-flag', ['init', '--bogus'], 2],
    ['N3-doctor-bogus-flag', ['doctor', '--bogus'], 2],
    ['N4-clean-bogus-flag', ['clean', '--bogus'], 2],
    // registry 派生集合：kiro 无 sessionStart hook → 必须被 startup-reminder 拒绝。
    ['N5-startup-reminder-rejects-kiro', ['startup-reminder', '--kiro'], 2],
  ]) {
    const result = run(process.execPath, [cli, ...args], { cwd: repo });
    assert(id, result.status === expectExit, `exit=${result.status} (expect ${expectExit})`);
  }

  const qoder = run(process.execPath, [cli, 'startup-reminder', '--qoder', '--reset'], { cwd: repo });
  assert('N6-startup-reminder-accepts-qoder', qoder.status === 0, 'derived host accepted');

  runOk('N7-init-codex-setup', process.execPath, [cli, 'init', '--codex', '-y', '-u', 'tester', '--lang', 'zh'], { cwd: repo });
  const dual = run(process.execPath, [cli, 'clean', '--codex', '--claude'], { cwd: repo });
  assert('N8-clean-rejects-dual-host', dual.status === 2, 'exit=2');
}

function verifyHeal(cli, tempRoot) {
  console.log('\n▸ Phase: heal（state 损坏 → doctor 检出 → init 自愈）');
  const repo = createGitRepo(path.join(tempRoot, 'repo-heal'));
  runOk('H1-init-baseline', process.execPath, [cli, 'init', '--codex', '-y', '-u', 'tester', '--lang', 'zh'], { cwd: repo });

  fs.writeFileSync(path.join(repo, '.codex', 'spec-first', 'state.json'), '{ broken json');
  const doctorBroken = run(process.execPath, [cli, 'doctor', '--codex', '--json'], { cwd: repo });
  // doctor 把坏 state 判为 WARNING（action-required）而非 ERROR；断言存在非 PASS 检查。
  let brokenFlagged = false;
  try {
    const report = JSON.parse(String(doctorBroken.stdout));
    const checks = [...(report.common_checks || []), ...((report.platform_checks || {}).codex || [])];
    brokenFlagged = checks.some((check) => check.level !== 'PASS' && String(check.name || '').includes('state.json'));
  } catch (_) { brokenFlagged = false; }
  assert('H2-doctor-detects-broken-state', brokenFlagged, 'state.json flagged non-PASS');

  const heal = run(process.execPath, [cli, 'init', '--codex', '-y', '-u', 'tester', '--lang', 'zh'], { cwd: repo });
  assert('H3-init-heals-broken-state', heal.status === 0, String(heal.stdout).split('\n')[0]);

  const doctorHealed = run(process.execPath, [cli, 'doctor', '--codex', '--json'], { cwd: repo });
  let healed = false;
  try { healed = JSON.parse(String(doctorHealed.stdout)).has_error !== true; } catch (_) { healed = false; }
  assert('H4-doctor-clean-after-heal', doctorHealed.status === 0 && healed, 'has_error!=true');
}


// 六宿主生命周期矩阵：每宿主 init → 宿主特有 surface 断言 → doctor → clean。
// surface 锚点来自 platform-registry 声明与实测投射（claude 扁平 commands、
// codex skill-only 等），多轮测评已校准。
const HOST_SURFACES = {
  claude: {
    stateFile: path.join('.claude', 'spec-first', 'state.json'),
    proof: path.join('.claude', 'commands', 'spec-plan.md'),
  },
  codex: {
    stateFile: path.join('.codex', 'spec-first', 'state.json'),
    proof: path.join('.agents', 'skills', 'spec-runtime-setup'),
  },
  cursor: {
    stateFile: path.join('.cursor', 'spec-first', 'state.json'),
    proof: path.join('.cursor', 'skills', 'spec-runtime-setup'),
  },
  kiro: {
    stateFile: path.join('.kiro', 'spec-first', 'state.json'),
    proof: path.join('.kiro', 'skills', 'spec-runtime-setup'),
  },
  qoder: {
    stateFile: path.join('.qoder', 'spec-first', 'state.json'),
    proof: path.join('.qoder', 'skills', 'spec-runtime-setup'),
  },
  opencode: {
    stateFile: path.join('.opencode', 'spec-first', 'state.json'),
    proof: path.join('.opencode', 'skills', 'spec-runtime-setup'),
  },
};

function verifyMultiHost(cli, tempRoot) {
  console.log('\n▸ Phase: multihost（六宿主逐一生命周期 + 全宿主组合）');
  const allHosts = Object.keys(HOST_SURFACES);

  // 逐宿主：独立 repo，init → doctor → clean 全闭环。
  for (const host of allHosts) {
    const repo = createGitRepo(path.join(tempRoot, `repo-${host}`));
    const surface = HOST_SURFACES[host];
    runOk(`MH1-init-${host}`, process.execPath, [cli, 'init', `--${host}`, '-y', '-u', 'tester', '--lang', 'zh'], { cwd: repo });
    assert(`MH2-state-${host}`, fs.existsSync(path.join(repo, surface.stateFile)), surface.stateFile);
    assert(`MH3-surface-${host}`, fs.existsSync(path.join(repo, surface.proof)), surface.proof);
    const state = JSON.parse(fs.readFileSync(path.join(repo, surface.stateFile), 'utf8'));
    assert(`MH4-platform-${host}`, state.platform === host, state.platform);
    const doctor = run(process.execPath, [cli, 'doctor', `--${host}`, '--json'], { cwd: repo });
    let ok = false;
    try { ok = JSON.parse(String(doctor.stdout)).has_error !== true; } catch (_) { ok = false; }
    assert(`MH5-doctor-${host}`, doctor.status === 0 && ok, 'has_error!=true');
    const clean = run(process.execPath, [cli, 'clean', `--${host}`], { cwd: repo });
    assert(
      `MH6-clean-${host}`,
      clean.status === 0 && !fs.existsSync(path.join(repo, surface.stateFile)),
      'managed state removed',
    );
  }

  // 全宿主组合：同一 repo 六宿主共存 → 共享 instruction 的消费者递减 → 最终清空。
  const shared = createGitRepo(path.join(tempRoot, 'repo-all-hosts'));
  const initAll = run(process.execPath, [cli, 'init', ...allHosts.map((host) => `--${host}`), '-y', '-u', 'tester', '--lang', 'zh'], { cwd: shared });
  assert('MH7-init-all-hosts', initAll.status === 0, String(initAll.stdout).split('\n')[0]);
  for (const host of allHosts) {
    assert(`MH7a-coexist-${host}`, fs.existsSync(path.join(shared, HOST_SURFACES[host].stateFile)), HOST_SURFACES[host].stateFile);
  }
  // 共享 instruction：claude 拥有 CLAUDE.md，codex 拥有 AGENTS.md；六宿主共存时两者都在。
  assert('MH7b-claude-md', fs.existsSync(path.join(shared, 'CLAUDE.md')), 'CLAUDE.md');
  assert('MH7c-agents-md', fs.existsSync(path.join(shared, 'AGENTS.md')), 'AGENTS.md');

  const doctorAll = run(process.execPath, [cli, 'doctor', '--json'], { cwd: shared });
  let autoPlatforms = null;
  try { autoPlatforms = JSON.parse(String(doctorAll.stdout)).platforms; } catch (_) { /* asserted below */ }
  assert(
    'MH8-doctor-auto-detects-all',
    doctorAll.status === 0 && Array.isArray(autoPlatforms) && autoPlatforms.length === allHosts.length,
    `platforms=${autoPlatforms && autoPlatforms.length}`,
  );

  // 逐宿主 clean：codex 被清掉之前，AGENTS.md 必须保留（claude 共享消费者语义见 clean.js）。
  for (const host of allHosts) {
    runOk(`MH9-clean-${host}`, process.execPath, [cli, 'clean', `--${host}`], { cwd: shared });
  }
  for (const host of allHosts) {
    assert(`MH9a-removed-${host}`, !fs.existsSync(path.join(shared, HOST_SURFACES[host].stateFile)), host);
  }
}

function writeSummary(tempRoot, phase, packageVersion) {
  const outputDir = process.env.SPEC_FIRST_SMOKE_ARTIFACT_DIR;
  if (!outputDir) return;
  fs.mkdirSync(path.resolve(outputDir), { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'installed-package-verification.json'), `${JSON.stringify({
    schema_version: 'installed-package-verification.v1',
    status: process.exitCode === 0 ? 'passed' : 'failed',
    phase,
    os: process.platform,
    node: process.version,
    package: `spec-first@${packageVersion}`,
    checks: CHECKS,
  }, null, 2)}\n`);
}

function main() {
  const phase = (process.argv[2] || 'all').replace(/^--/, '');
  const validPhases = new Set(['all', 'package', 'lifecycle', 'negative', 'heal', 'multihost']);
  if (!validPhases.has(phase)) {
    console.error(`用法：node scripts/verify-installed-package.cjs [--]all|package|lifecycle|negative|heal|multihost`);
    process.exitCode = 2;
    return;
  }

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-verify-pkg-'));
  isolatedHomeDir = path.join(tempRoot, 'home');
  fs.mkdirSync(isolatedHomeDir, { recursive: true });
  const packageVersion = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8')).version;
  console.log('══════════════════════════════════════');
  console.log('  安装后环境包验证（真实 pack + 隔离安装）');
  console.log(`  phase=${phase} version=${packageVersion}`);
  console.log('══════════════════════════════════════');

  try {
    let cli = null;
    if (phase === 'all' || phase === 'package') {
      cli = verifyPackageArtifacts(tempRoot).cli;
    }
    if (phase === 'lifecycle' || phase === 'negative' || phase === 'heal' || phase === 'multihost') {
      // 独立 phase 复用同一 tarball 安装：轻量重装而非重 pack。
      const quick = verifyPackageArtifacts(tempRoot);
      cli = quick.cli;
    }
    if (phase === 'all' || phase === 'lifecycle') verifyLifecycle(cli, tempRoot);
    if (phase === 'all' || phase === 'negative') verifyNegative(cli, tempRoot);
    if (phase === 'all' || phase === 'heal') verifyHeal(cli, tempRoot);
    if (phase === 'all' || phase === 'multihost') verifyMultiHost(cli, tempRoot);

    console.log(`\n✓ 验证通过：${CHECKS.length} 项 (${CHECKS.join(', ')})`);
    writeSummary(tempRoot, phase, packageVersion);
  } catch (error) {
    if (!String(error.message || '').startsWith('verification-case-failed')) {
      console.error(`FAIL: ${error.message}`);
      process.exitCode = 1;
    }
    writeSummary(tempRoot, phase, packageVersion);
  } finally {
    if (process.env.SPEC_FIRST_VERIFY_KEEP === '1') {
      console.log(`(SPEC_FIRST_VERIFY_KEEP=1 现场保留: ${tempRoot})`);
    } else {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = { createGitRepo, main };
