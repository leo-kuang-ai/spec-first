'use strict';

const { getSupportedPlatforms } = require('../adapters');
const { checkGit, checkNodeVersion, checkPlatformCli } = require('./doctor');
const { runInit } = require('./init');

// quickstart is thin glue over doctor's environment probes and init's existing
// apply path. It owns detection -> host selection -> handoff sequencing only;
// it must not re-implement host detection or runtime writes, and it must not
// simulate running a host-session workflow (spec-first is a separate CLI
// process from the host session and cannot invoke it).
async function runQuickstart(argv, promptOverrides = {}) {
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

  console.log('🚀 spec-first quickstart');
  console.log('');
  console.log('Checking your environment...');

  const nodeCheck = checkNodeVersion();
  const gitCheck = checkGit();
  printProbeLine(nodeCheck);
  printProbeLine(gitCheck);

  if (nodeCheck.level === 'ERROR' || gitCheck.level === 'ERROR') {
    console.log('');
    console.log('Fix the issue above, then run `spec-first quickstart` again.');
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
    console.log(`Detected exactly one host: ${detected[0]}. Continuing with \`spec-first init --${detected[0]}\`.`);
    console.log('');
    return runInit(yes ? ['--' + detected[0], '-y'] : ['--' + detected[0]], promptOverrides);
  }

  if (detected.length === 0) {
    console.log('Could not auto-detect a host CLI on PATH. Falling back to interactive `spec-first init` so you can pick one.');
  } else {
    console.log(`Detected ${detected.length} hosts (${detected.join(', ')}). Falling back to interactive \`spec-first init\` so you can pick which to set up.`);
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
