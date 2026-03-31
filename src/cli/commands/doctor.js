const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { inspectInstalledAssets, listBundledCommands, loadPluginManifest } = require('../plugin');
const { readDeveloperFile, getProjectDeveloperPath } = require('../developer');
const { readState } = require('../state');
const { getAdapter, getSupportedPlatforms } = require('../adapters');

function runDoctor(argv) {
  const args = [...argv];
  const parsed = parseDoctorArgs(args);

  if (parsed.help) {
    printHelp();
    return 0;
  }

  if (parsed.unknown.length > 0) {
    console.error('Usage: spec-first doctor [--claude|--codex]');
    return 1;
  }

  const projectRoot = process.cwd();

  // 确定要检查的平台
  let platforms = [];
  if (parsed.claude) platforms.push('claude');
  if (parsed.codex) platforms.push('codex');

  // 无参数时自动检测
  if (platforms.length === 0) {
    platforms = detectPlatforms(projectRoot);
  }

  if (platforms.length === 0) {
    console.log('No spec-first platform detected in this project.');
    console.log('Run `spec-first init --claude` or `spec-first init --codex` to initialize.');
    return 0;
  }

  // 通用检查
  const commonChecks = [
    checkNodeVersion(),
    checkGit(),
    checkPluginManifest(),
  ];

  for (const check of commonChecks) {
    const label = check.level.toUpperCase().padEnd(7);
    console.log(`${label} ${check.name}: ${check.message}`);
    if (check.fix) {
      console.log(`         Fix: ${check.fix}`);
    }
  }

  // 平台特定检查
  let hasError = commonChecks.some((check) => check.level === 'ERROR');

  for (const platform of platforms) {
    console.log(`\n=== ${platform.toUpperCase()} Platform ===`);
    const adapter = getAdapter(platform);
    const runtimeChecks = adapter.inspectRuntimeFiles(projectRoot);
    const platformChecks = [
      checkPlatformCli(platform),
      checkProjectDeveloper(projectRoot, adapter),
      checkManagedState(projectRoot, adapter),
      ...runtimeChecks,
    ];
    if (adapter.hasCommands) {
      platformChecks.push(checkGeneratedCommands(projectRoot, adapter));
    }
    platformChecks.push(
      checkInstalledSkills(projectRoot, adapter),
      checkInstalledAgents(projectRoot, adapter),
    );

    for (const check of platformChecks) {
      const label = check.level.toUpperCase().padEnd(7);
      console.log(`${label} ${check.name}: ${check.message}`);
      if (check.fix) {
        console.log(`         Fix: ${check.fix}`);
      }
    }

    if (platformChecks.some((check) => check.level === 'ERROR')) {
      hasError = true;
    }
  }

  return hasError ? 1 : 0;
}

function checkNodeVersion() {
  const version = process.version;
  const major = Number.parseInt(version.slice(1).split('.')[0], 10);
  if (Number.isFinite(major) && major >= 20) {
    return { level: 'PASS', name: 'Node.js', message: version };
  }

  return {
    level: 'ERROR',
    name: 'Node.js',
    message: version,
    fix: 'Install Node.js 20 or newer.',
  };
}

function checkGit() {
  const result = spawnSync('git', ['--version'], { encoding: 'utf8' });
  if (result.status === 0) {
    return {
      level: 'PASS',
      name: 'Git',
      message: result.stdout.trim(),
    };
  }

  return {
    level: 'ERROR',
    name: 'Git',
    message: 'not found',
    fix: 'Install Git and ensure it is on PATH.',
  };
}

function checkPlatformCli(platform) {
  const command = platform === 'codex' ? 'codex' : 'claude';
  const displayName = platform === 'codex' ? 'Codex' : 'Claude Code';
  // Note: Codex CLI may not be available yet - this is expected during MVP phase
  const result = spawnSync(command, ['--version'], { encoding: 'utf8' });
  if (result.status === 0) {
    return {
      level: 'PASS',
      name: displayName,
      message: result.stdout.trim() || 'available',
    };
  }

  if (result.error && result.error.code === 'ENOENT') {
    return {
      level: 'WARNING',
      name: displayName,
      message: 'not found on PATH',
      fix: `Install ${displayName} CLI and restart your shell.`,
    };
  }

  return {
    level: 'WARNING',
    name: displayName,
    message: 'could not verify version',
    fix: `Run \`${command} --version\` manually to confirm the CLI works.`,
  };
}

function checkGeneratedCommands(projectRoot, adapter) {
  let commandStatus;
  try {
    commandStatus = inspectInstalledAssets(projectRoot, adapter).commands;
  } catch (error) {
    return {
      level: 'ERROR',
      name: `${adapter.commandRoot}`,
      message: error instanceof Error ? error.message : String(error),
      fix: 'Reinstall the spec-first package so bundled command templates are available.',
    };
  }

  if (!fs.existsSync(commandStatus.targetRoot)) {
    return {
      level: 'WARNING',
      name: `${adapter.commandRoot}`,
      message: 'missing',
      fix: `Run \`spec-first init --${adapter.id}\` in this project.`,
    };
  }

  if (commandStatus.missing.length === 0) {
    return {
      level: 'PASS',
      name: `${adapter.commandRoot}`,
      message: `found ${commandStatus.entries.length} command file(s)`,
    };
  }

  return {
    level: 'WARNING',
    name: `${adapter.commandRoot}`,
    message: `missing ${commandStatus.missing.map((entry) => entry.filename).join(', ')}`,
    fix: `Run \`spec-first init --${adapter.id}\` to regenerate the missing files.`,
  };
}

function checkInstalledSkills(projectRoot, adapter) {
  let skillStatus;
  try {
    skillStatus = inspectInstalledAssets(projectRoot, adapter).skills;
  } catch (error) {
    return {
      level: 'ERROR',
      name: `${adapter.skillsRoot}`,
      message: error instanceof Error ? error.message : String(error),
      fix: 'Reinstall the spec-first package so bundled skills are available.',
    };
  }

  if (!fs.existsSync(skillStatus.targetRoot)) {
    return {
      level: 'WARNING',
      name: `${adapter.skillsRoot}`,
      message: 'missing',
      fix: `Run \`spec-first init --${adapter.id}\` in this project to install bundled skills.`,
    };
  }

  if (skillStatus.missing.length === 0) {
    return {
      level: 'PASS',
      name: `${adapter.skillsRoot}`,
      message: `found ${skillStatus.entries.length} skill directory(ies)`,
    };
  }

  return {
    level: 'WARNING',
    name: `${adapter.skillsRoot}`,
    message: `out of sync (${skillStatus.entries.length - skillStatus.missing.length}/${skillStatus.entries.length} installed)`,
    fix: `Run \`spec-first init --${adapter.id}\` in this project to resync bundled skills.`,
  };
}

function checkInstalledAgents(projectRoot, adapter) {
  let agentStatus;
  try {
    agentStatus = inspectInstalledAssets(projectRoot, adapter).agents;
  } catch (error) {
    return {
      level: 'ERROR',
      name: `${adapter.agentsRoot}`,
      message: error instanceof Error ? error.message : String(error),
      fix: 'Reinstall the spec-first package so bundled agents are available.',
    };
  }

  if (!fs.existsSync(agentStatus.targetRoot)) {
    return {
      level: 'WARNING',
      name: `${adapter.agentsRoot}`,
      message: 'missing',
      fix: `Run \`spec-first init --${adapter.id}\` in this project to install bundled agents.`,
    };
  }

  if (agentStatus.missing.length === 0) {
    return {
      level: 'PASS',
      name: `${adapter.agentsRoot}`,
      message: `found ${agentStatus.entries.length} agent file(s)`,
    };
  }

  return {
    level: 'WARNING',
    name: `${adapter.agentsRoot}`,
    message: `out of sync (${agentStatus.entries.length - agentStatus.missing.length}/${agentStatus.entries.length} installed)`,
    fix: `Run \`spec-first init --${adapter.id}\` in this project to resync bundled agents.`,
  };
}

function checkPluginManifest() {
  try {
    const manifest = loadPluginManifest();
    const commandCount = listBundledCommands().length;
    return {
      level: 'PASS',
      name: '.claude-plugin/plugin.json',
      message: `${manifest.name}@${manifest.version} with ${commandCount} command definition(s)`,
    };
  } catch (error) {
    return {
      level: 'ERROR',
      name: '.claude-plugin/plugin.json',
      message: error instanceof Error ? error.message : String(error),
      fix: 'Restore the bundled plugin manifest and reinstall the package.',
    };
  }
}

function checkProjectDeveloper(projectRoot, adapter) {
  const developerPath = getProjectDeveloperPath(projectRoot, adapter);
  if (!fs.existsSync(developerPath)) {
    return {
      level: 'WARNING',
      name: `${adapter.developerFile}`,
      message: 'missing',
      fix: `Run \`spec-first init --${adapter.id}\` in this project to write the project developer profile.`,
    };
  }

  const developer = readDeveloperFile(developerPath);
  if (!developer) {
    return {
      level: 'ERROR',
      name: `${adapter.developerFile}`,
      message: 'invalid or empty',
      fix: `Run \`spec-first init --${adapter.id} -u <name> --lang <zh|en>\` to regenerate the project developer profile.`,
    };
  }

  const packageVersion = require('../../../package.json').version;
  if (
    typeof developer.name !== 'string' ||
    developer.name.length === 0 ||
    typeof developer.lang !== 'string' ||
    (developer.lang !== 'zh' && developer.lang !== 'en') ||
    typeof developer.initializedAt !== 'string' ||
    developer.initializedAt.length === 0 ||
    typeof developer.version !== 'string' ||
    developer.version.length === 0
  ) {
    return {
      level: 'ERROR',
      name: `${adapter.developerFile}`,
      message: 'invalid or incomplete',
      fix: `Run \`spec-first init --${adapter.id} -u <name> --lang <zh|en>\` to regenerate the project developer profile.`,
    };
  }

  if (developer.version !== packageVersion) {
    return {
      level: 'WARNING',
      name: `${adapter.developerFile}`,
      message: `recorded ${developer.version}, bundled ${packageVersion}`,
      fix: `Run \`spec-first init --${adapter.id}\` in this project to refresh the project developer profile after upgrading.`,
    };
  }

  return {
    level: 'PASS',
    name: `${adapter.developerFile}`,
    message: `${developer.name} (${developer.lang}) ${developer.version}`,
  };
}

function checkManagedState(projectRoot, adapter) {
  const statePath = path.join(projectRoot, adapter.stateFile);
  if (!fs.existsSync(statePath)) {
    return {
      level: 'WARNING',
      name: `${adapter.stateFile}`,
      message: 'missing',
      fix: `Run \`spec-first init --${adapter.id}\` in this project to record managed assets.`,
    };
  }

  try {
    const state = readState(projectRoot, adapter);
    const manifest = loadPluginManifest();
    if (!state || !state.manifestVersion) {
      return {
        level: 'WARNING',
        name: `${adapter.stateFile}`,
        message: 'invalid or empty',
        fix: `Run \`spec-first init --${adapter.id}\` in this project to regenerate the managed asset state.`,
      };
    }

    if (state.manifestVersion !== manifest.version) {
      return {
        level: 'WARNING',
        name: `${adapter.stateFile}`,
        message: `recorded ${state.manifestVersion}, bundled ${manifest.version}`,
        fix: `Run \`spec-first init --${adapter.id}\` in this project to resync managed assets after upgrading.`,
      };
    }

    return {
      level: 'PASS',
      name: `${adapter.stateFile}`,
      message: `recorded ${state.commands.length} commands, ${state.skills.length} skills, ${state.agents.length} agents`,
    };
  } catch (error) {
    return {
      level: 'WARNING',
      name: `${adapter.stateFile}`,
      message: error instanceof Error ? error.message : String(error),
      fix: `Run \`spec-first init --${adapter.id}\` in this project to regenerate the managed asset state.`,
    };
  }
}

function printHelp() {
  console.log('Usage: spec-first doctor [--claude|--codex]');
}

function detectPlatforms(projectRoot) {
  return getSupportedPlatforms().filter(platform => {
    const adapter = getAdapter(platform);
    return fs.existsSync(path.join(projectRoot, adapter.runtimeRoot));
  });
}

function parseDoctorArgs(argv) {
  const parsed = {
    help: false,
    claude: false,
    codex: false,
    unknown: [],
  };

  for (const arg of argv) {
    if (arg === '-h' || arg === '--help') {
      parsed.help = true;
    } else if (arg === '--claude') {
      parsed.claude = true;
    } else if (arg === '--codex') {
      parsed.codex = true;
    } else {
      parsed.unknown.push(arg);
    }
  }

  return parsed;
}

module.exports = {
  runDoctor,
};
