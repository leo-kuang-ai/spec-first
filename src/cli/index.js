const fs = require('node:fs');
const path = require('node:path');
const pkg = require('../../package.json');
const { detectColorSupport, renderFullArt } = require('./brand');
const { runClean } = require('./commands/clean');
const { runDoctor } = require('./commands/doctor');
const { runInit } = require('./commands/init');
const { runInternal } = require('./commands/internal');
const { runPlans } = require('./commands/plans');
const { runQuickstart } = require('./commands/quickstart');
const { runRepairWorktree } = require('./commands/repair-worktree');
const { runSession } = require('./commands/session');
const { runTasks } = require('./commands/tasks');
const { runUpdate } = require('./commands/update');
const {
  clearStartupVersionReminderCooldown,
  maybeShowStartupVersionReminder,
  maybeShowVersionReminder,
} = require('./version-reminder');

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

  if (cmd === 'startup-reminder') {
    return Promise.resolve(runStartupReminder(args.slice(1)));
  }

  if (shouldRunVersionReminder(cmd, args.slice(1))) {
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

  if (cmd === 'update') {
    return runUpdate(args.slice(1));
  }

  if (cmd === 'tasks') {
    return Promise.resolve(runTasks(args.slice(1)));
  }

  if (cmd === 'plans') {
    return Promise.resolve(runPlans(args.slice(1)));
  }

  if (cmd === 'quickstart') {
    return runQuickstart(args.slice(1));
  }

  if (cmd === 'repair-worktree') {
    return Promise.resolve(runRepairWorktree(args.slice(1)));
  }

  if (cmd === 'session') {
    return Promise.resolve(runSession(args.slice(1)));
  }

  if (cmd === 'internal') {
    return Promise.resolve(runInternal(args.slice(1)));
  }

  console.error(`Unknown command: ${cmd}`);
  console.error('Run `spec-first --help` to list available package CLI commands.');
  printHelp(true);
  return Promise.resolve(2);
}

function shouldRunVersionReminder(cmd, subcommandArgs) {
  if (cmd !== 'doctor' && cmd !== 'init' && cmd !== 'clean' && cmd !== 'update' && cmd !== 'quickstart') {
    return false;
  }
  return !subcommandArgs.some((arg) => arg === '-h' || arg === '--help');
}

async function runStartupReminder(args) {
  const parsed = parseStartupReminderArgs(args);
  if (parsed.error) {
    console.error(`startup-reminder: ${parsed.error}`);
    return 2;
  }

  if (parsed.reset) {
    clearStartupVersionReminderCooldown({ host: parsed.host });
    return 0;
  }

  await maybeShowStartupVersionReminder({
    host: parsed.host,
    packageName: pkg.name,
    output: process.stdout,
  });
  return 0;
}

function parseStartupReminderArgs(args) {
  const parsed = {
    host: '',
    reset: false,
    error: '',
  };

  const setHost = (host) => {
    if (host !== 'claude' && host !== 'codex' && host !== 'qoder') {
      parsed.error = `invalid host "${host}"`;
      return;
    }
    if (parsed.host) {
      parsed.error = 'exactly one host selector is allowed';
      return;
    }
    parsed.host = host;
  };

  for (const arg of args) {
    if (parsed.error) {
      break;
    }
    if (arg === '--claude') {
      setHost('claude');
      continue;
    }
    if (arg === '--codex') {
      setHost('codex');
      continue;
    }
    if (arg === '--qoder') {
      setHost('qoder');
      continue;
    }
    if (arg === '--reset') {
      parsed.reset = true;
      continue;
    }
    if (arg.startsWith('--host=')) {
      setHost(arg.slice('--host='.length));
      continue;
    }
    parsed.error = `unknown option "${arg}"`;
  }

  if (!parsed.error && !parsed.host) {
    parsed.error = 'missing host selector (--claude, --codex, or --qoder)';
  }

  return parsed;
}

function printHelp(withErrorPrefix = false) {
  const lines = [
    '🚀 spec-first — Manage spec-first workflow assets for Claude Code, Codex, Kiro, Qoder, Cursor preview, and OpenCode preview',
    '',
    '📘 Usage:',
    '  spec-first <command> [options]',
    '',
    '🧩 Commands:',
    '  doctor                 Check environment, runtime asset manifest, and managed runtime assets',
    '  quickstart [-y|--yes]  Detect Node/Git/host CLIs, then hand off to `init` (auto-selects host when exactly one is detected)',
    '  init [--claude] [--codex] [--cursor] [--kiro] [--qoder] [--opencode] [-y] [--all-repos|--repo <path>] Interactively install workflows, skills, agents, and developer profile',
    '  update                 Upgrade the spec-first CLI package and refresh runtime assets with `spec-first init`',
    '  clean (--claude|--codex|--cursor|--kiro|--qoder|--opencode) Remove host runtime managed assets; or clean --workspace-graph for per-requirement graph assets',
    '  repair-worktree        Preview broken worktree pointer repair guidance',
    '  tasks <subcommand>      Hash and validate derived task packs',
    '  plans <subcommand>      Read-only plan lifecycle audit (`plans audit`)',
    '  session <subcommand>    Opt-in multi-actor session advisory (register|list|heartbeat|unregister)',
    '',
    '🪝 Installed workflow entrypoints are provided by the host after `spec-first init`.',
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

  console.log(`${renderFullArt(pkg.version, { useColor: detectColorSupport() })}
  快速上手:

    1. 健康检查
       $ spec-first doctor

    2. 初始化项目
       $ spec-first init

    3. 如需查看 package CLI 命令面
       $ spec-first --help

    4. 重启宿主 CLI，使同名 spec-* workflow 入口生效

    5. 在对话中使用当前宿主对应入口开始工作流

       例如: spec-plan、spec-work、spec-code-review、spec-runtime-setup
       注意: 这些是宿主 workflow 入口，不是 package CLI 子命令
       Cursor/OpenCode 需要显式运行 spec-first init --cursor / --opencode，且当前 loader validation unavailable；它们只代表 generated-runtime preview。

  了解更多:
    https://github.com/sunrain520/spec-first
`);
}

module.exports = {
  printVersion,
  runCli,
};
