const fs = require('node:fs');
const path = require('node:path');
const pkg = require('../../package.json');
const { runClean } = require('./commands/clean');
const { runDoctor } = require('./commands/doctor');
const { runInit } = require('./commands/init');
const { runSpecs } = require('./commands/specs');
const { runTasks } = require('./commands/tasks');
const { maybeShowVersionReminder } = require('./version-reminder');

async function runCli(argv) {
  const args = [...argv];
  const cmd = args[0];

  if (!cmd || cmd === '--help' || cmd === '-h') {
    printHelp();
    return Promise.resolve(0);
  }

  if (cmd === '--version' || cmd === '-v') {
    printVersion();
    return Promise.resolve(0);
  }

  if (cmd === 'doctor' || cmd === 'init' || cmd === 'clean') {
    await maybeShowVersionReminder({
      packageName: pkg.name,
      currentVersion: pkg.version,
    });
  }

  if (cmd === 'doctor') {
    return Promise.resolve(runDoctor(args.slice(1)));
  }

  if (cmd === 'init') {
    return Promise.resolve(runInit(args.slice(1)));
  }

  if (cmd === 'clean') {
    return Promise.resolve(runClean(args.slice(1)));
  }

  if (cmd === 'tasks') {
    return Promise.resolve(runTasks(args.slice(1)));
  }

  if (cmd === 'specs') {
    return Promise.resolve(runSpecs(args.slice(1)));
  }

  console.error(`Unknown command: ${cmd}`);
  printHelp(true);
  return Promise.resolve(1);
}

function printHelp(withErrorPrefix = false) {
  const lines = [
    '🚀 spec-first — Manage spec-first workflow assets for Claude and Codex',
    '',
    '📘 Usage:',
    '  spec-first <command> [options]',
    '',
    '🧩 Commands:',
    '  doctor                 Check environment, plugin manifest, and managed runtime assets',
    '  init (--claude|--codex)  Install platform-specific workflows, skills, agents, and developer profile',
    '  clean (--claude|--codex) Remove spec-first managed assets from the current project',
    '  tasks <subcommand>      Hash and validate derived task packs',
    '  specs <subcommand>      Deterministic helpers for spec-standards proposal artifacts',
    '  crg <subcommand>       Query the local code graph (run `spec-first crg --help`)',
    '',
    '🪝 Installed workflow entrypoints (after `spec-first init`):',
    '  Claude Code: /spec:graph-bootstrap',
    '               /spec:standards',
    '  Codex:      $spec-graph-bootstrap',
    '              $spec-standards',
    '  These are host runtime entrypoints, not root `spec-first` subcommands.',
    '',
    '⚙️  Global options:',
    '  -h, --help             Show help',
    '  -v, --version          Show version',
    '',
    '🔗 Repository:',
    '  https://github.com/sunrain520/spec-first',
  ];

  if (withErrorPrefix) {
    console.error(lines.join('\n'));
    return;
  }

  console.log(lines.join('\n'));
}

function printVersion() {
  const pkgPath = path.join(__dirname, '..', '..', 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   Spec-First v${pkg.version}                                    ║
║   AI 辅助工程框架 — Claude Code & Codex                    ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

  快速上手:

    1. 健康检查
       $ spec-first doctor

    2. 初始化项目
       $ spec-first init --claude    # 或 --codex

    3. 如需查看 package CLI 命令面
       $ spec-first --help

    4. 重启宿主 CLI，使 Claude 的 /spec:* 或 Codex 的 $spec-* 入口生效

    5. 在对话中使用当前宿主对应入口开始工作流

       例如: /spec:graph-bootstrap 或 $spec-graph-bootstrap
       注意: 这些是宿主 workflow 入口，不是 \`spec-first graph-bootstrap\` 包级子命令

  了解更多:
    https://github.com/sunrain520/spec-first
`);
}

module.exports = {
  runCli,
};
