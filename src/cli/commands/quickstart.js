'use strict';

const { getSupportedPlatforms } = require('../adapters');
const { checkGit, checkNodeVersion, checkPlatformCli } = require('./doctor');
const { runInit } = require('./init');
const { resolveUserLanguage } = require('../cli-lang');

// 用户旅程文案双语；探测行中的 check.name/message 来自 doctor 探测结果
//（技术事实，如 'Node.js'、'git version 2.40'），保留原文。
const QUICKSTART_MESSAGES = {
  zh: {
    checking: '正在检查环境...',
    fixThenRetry: '请先修复上述问题，然后重新运行 `spec-first quickstart`。',
    exactlyOneHost: (host) => `检测到唯一宿主：${host}。继续执行 \`spec-first init --${host}\`。`,
    noHostFallback: '未能在 PATH 上自动检测到宿主 CLI，回退到交互式 `spec-first init` 由你选择。',
    multiHostFallback: (count, hosts) => `检测到 ${count} 个宿主（${hosts}），回退到交互式 \`spec-first init\` 由你选择要初始化的宿主。`,
  },
  en: {
    checking: 'Checking your environment...',
    fixThenRetry: 'Fix the issue above, then run `spec-first quickstart` again.',
    exactlyOneHost: (host) => `Detected exactly one host: ${host}. Continuing with \`spec-first init --${host}\`.`,
    noHostFallback: 'Could not auto-detect a host CLI on PATH. Falling back to interactive `spec-first init` so you can pick one.',
    multiHostFallback: (count, hosts) => `Detected ${count} hosts (${hosts}). Falling back to interactive \`spec-first init\` so you can pick which to set up.`,
  },
};

// quickstart is thin glue over doctor's environment probes and init's existing
// apply path. It owns detection -> host selection -> handoff sequencing only;
// it must not re-implement host detection or runtime writes, and it must not
// simulate running a host-session workflow (spec-first is a separate CLI
// process from the host session and cannot invoke it).
async function runQuickstart(argv, promptOverrides = {}, deps = {}) {
  const args = [...argv];
  if (args.includes('-h') || args.includes('--help')) {
    printHelp();
    return 0;
  }

  const yes = args.includes('-y') || args.includes('--yes');
  const unknown = args.filter((arg) => arg !== '-y' && arg !== '--yes');
  if (unknown.length > 0) {
    console.error(`spec-first quickstart: unknown option ${unknown[0]}`);
    console.error('Usage: spec-first quickstart [-y|--yes]');
    return 2;
  }

  const messages = QUICKSTART_MESSAGES[
    (deps.resolveLang || resolveUserLanguage)() === 'en' ? 'en' : 'zh'
  ];

  console.log('🚀 spec-first quickstart');
  console.log('');
  console.log(messages.checking);

  const nodeCheck = checkNodeVersion();
  const gitCheck = checkGit();
  printProbeLine(nodeCheck);
  printProbeLine(gitCheck);

  if (nodeCheck.level === 'ERROR' || gitCheck.level === 'ERROR') {
    console.log('');
    console.log(messages.fixThenRetry);
    return 3;
  }

  const platforms = getSupportedPlatforms();
  // checkPlatformCli is synchronous (spawnSync internally), so this is
  // sequential execution despite the Promise.all wrapper. Keep the wrapper
  // for consistency with async signature, but note no actual concurrency.
  const hostChecks = await Promise.all(
    platforms.map((platform) => Promise.resolve(checkPlatformCli(platform))),
  );
  for (const check of hostChecks) {
    printProbeLine(check);
  }

  const detected = platforms.filter((_platform, index) => hostChecks[index].level === 'PASS');

  console.log('');

  if (detected.length === 1) {
    console.log(messages.exactlyOneHost(detected[0]));
    console.log('');
    return runInit(yes ? ['--' + detected[0], '-y'] : ['--' + detected[0]], promptOverrides);
  }

  if (detected.length === 0) {
    console.log(messages.noHostFallback);
  } else {
    console.log(messages.multiHostFallback(detected.length, detected.join(', ')));
  }
  console.log('');
  return runInit(yes ? ['-y'] : [], promptOverrides);
}

function printProbeLine(check) {
  const icon = check.level === 'PASS' ? '✓' : check.level === 'WARNING' ? '⚠' : '✗';
  console.log(`  ${icon} ${check.name}: ${check.message}`);
}

function printHelp() {
  console.log([
    '🚀 spec-first quickstart',
    '',
    '📘 Usage:',
    '  spec-first quickstart [-y|--yes]',
    '',
    'Detects Node.js, Git, and installed host CLIs, then hands off to `spec-first init`:',
    '  - Exactly one host detected  -> runs `spec-first init --<host>` directly.',
    '  - Zero or multiple detected  -> falls back to interactive `spec-first init` host selection.',
    '',
    'This command only wraps `doctor` probes and `init`\'s existing apply path. It does not run any',
    'host-session spec-* workflow itself — those run inside the host session after you restart it.',
    '',
    '🔗 Repository:',
    '  https://github.com/sunrain520/spec-first',
  ].join('\n'));
}

module.exports = {
  runQuickstart,
};
