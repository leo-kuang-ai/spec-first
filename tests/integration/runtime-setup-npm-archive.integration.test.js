'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { runCommandSync } = require('../../skills/spec-runtime-setup/scripts/lib/process-runner.cjs');
const { installBaselineTools } = require('../../skills/spec-runtime-setup/scripts/lib/installation-executor.cjs');
const { verifiedNpmInstall } = require('../../skills/spec-runtime-setup/scripts/lib/npm-warmup.cjs');

test('真实离线 npm 执行校验归档，项目及全局同名包和 bin 不能顶替', () => {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'npm-archive-real-')));
  try {
    const source = path.join(root, 'source');
    const target = path.join(root, 'target');
    const home = path.join(root, 'home');
    for (const dir of [source, target, home]) fs.mkdirSync(dir);
    const name = 'spec-first-warmup-fixture';
    const manifest = { name, version: '1.0.0', bin: { 'setup-fixture': 'bin.js' } };
    fs.writeFileSync(path.join(source, 'package.json'), JSON.stringify(manifest));
    fs.writeFileSync(path.join(source, 'bin.js'), '#!/usr/bin/env node\nconsole.log("VERIFIED_ARCHIVE_EXECUTED");\n');
    fs.chmodSync(path.join(source, 'bin.js'), 0o755);
    const localPackage = path.join(target, 'node_modules', name);
    const localBin = path.join(target, 'node_modules', '.bin');
    fs.mkdirSync(localPackage, { recursive: true });
    fs.mkdirSync(localBin, { recursive: true });
    fs.writeFileSync(path.join(target, 'package.json'), JSON.stringify({ name: 'collision-target', version: '1.0.0', dependencies: { [name]: '1.0.0' } }));
    fs.writeFileSync(path.join(localPackage, 'package.json'), JSON.stringify(manifest));
    fs.writeFileSync(path.join(localPackage, 'bin.js'), '#!/usr/bin/env node\nconsole.log("LOCAL_COLLISION_EXECUTED");\n');
    fs.writeFileSync(path.join(localBin, 'setup-fixture'), '#!/usr/bin/env node\nconsole.log("LOCAL_COLLISION_EXECUTED");\n');
    fs.chmodSync(path.join(localBin, 'setup-fixture'), 0o755);
    const prefix = path.join(root, 'global');
    const globalPackage = path.join(prefix, process.platform === 'win32' ? 'node_modules' : 'lib/node_modules', name);
    const globalBin = process.platform === 'win32' ? prefix : path.join(prefix, 'bin');
    fs.mkdirSync(globalPackage, { recursive: true });
    fs.mkdirSync(globalBin, { recursive: true });
    fs.writeFileSync(path.join(globalPackage, 'package.json'), JSON.stringify(manifest));
    fs.writeFileSync(path.join(globalPackage, 'bin.js'), '#!/usr/bin/env node\nconsole.log("GLOBAL_COLLISION_EXECUTED");\n');
    fs.writeFileSync(path.join(globalBin, 'setup-fixture'), '#!/usr/bin/env node\nconsole.log("GLOBAL_COLLISION_EXECUTED");\n');
    fs.chmodSync(path.join(globalBin, 'setup-fixture'), 0o755);
    const env = Object.fromEntries(['PATH', 'SystemRoot', 'ComSpec', 'TEMP', 'TMP', 'TMPDIR'].filter((key) => process.env[key]).map((key) => [key, process.env[key]]));
    Object.assign(env, { PATH: `${globalBin}${path.delimiter}${env.PATH}`, HOME: home, USERPROFILE: home, npm_config_prefix: prefix, npm_config_cache: path.join(root, 'npm-cache'), npm_config_offline: 'true', npm_config_audit: 'false', npm_config_fund: 'false' });
    const execute = (command, args, options) => runCommandSync(command, args, { ...options, inheritEnv: false, env: { ...env, ...(options.env || {}) }, timeoutMs: 30000 });
    const pack = execute('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', root, source], { cwd: root });
    expect(pack.exit_code).toBe(0);
    const packed = JSON.parse(pack.stdout)[0];
    const entry = { id: 'fixture', required: true, resolved_dependency: { package: name, version: '1.0.0', integrity: packed.integrity, source: 'npmjs' }, installation: { kind: 'warmup', command: 'npx', args: ['-y', `${name}@1.0.0`, '--help'] } };
    const launches = [];
    const context = { host: 'codex', platform: process.platform === 'win32' ? 'windows' : 'posix', env, effectiveRegistry: { tools: [entry] }, runner: (command, args, options) => {
      if (command === 'npm' && args[0] === 'pack') {
        fs.copyFileSync(path.join(root, packed.filename), path.join(args[args.indexOf('--pack-destination') + 1], packed.filename));
        return pack;
      }
      const result = execute(command, args, options);
      launches.push(result);
      return result;
    } };
    const result = installBaselineTools(context, target).get('fixture');
    expect(launches).toEqual([expect.objectContaining({ exit_code: 0, stdout: expect.stringContaining('VERIFIED_ARCHIVE_EXECUTED') })]);
    expect(result.status).toBe('ready');
    expect(launches.map((launch) => launch.stdout).join('\n')).toContain('VERIFIED_ARCHIVE_EXECUTED');
    expect(launches.map((launch) => launch.stdout).join('\n')).not.toMatch(/(?:LOCAL|GLOBAL)_COLLISION_EXECUTED/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}, 60000);

test('真实离线 npm 全局安装消费校验归档并替换隔离 prefix 内的旧包', () => {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'npm-install-archive-real-')));
  try {
    const source = path.join(root, 'source');
    const prefix = path.join(root, 'prefix');
    const home = path.join(root, 'home');
    for (const dir of [source, prefix, home]) fs.mkdirSync(dir);
    const name = 'spec-first-install-fixture';
    fs.writeFileSync(path.join(source, 'package.json'), JSON.stringify({ name, version: '1.0.0' }));
    fs.writeFileSync(path.join(source, 'marker.txt'), 'VERIFIED_ARCHIVE_INSTALLED');
    const installed = path.join(prefix, process.platform === 'win32' ? 'node_modules' : 'lib/node_modules', name);
    fs.mkdirSync(installed, { recursive: true });
    fs.writeFileSync(path.join(installed, 'package.json'), JSON.stringify({ name, version: '0.9.0' }));
    fs.writeFileSync(path.join(installed, 'marker.txt'), 'OLD_PACKAGE');
    const env = Object.fromEntries(['PATH', 'SystemRoot', 'ComSpec', 'TEMP', 'TMP', 'TMPDIR'].filter((key) => process.env[key]).map((key) => [key, process.env[key]]));
    Object.assign(env, { HOME: home, USERPROFILE: home, npm_config_prefix: prefix, npm_config_cache: path.join(root, 'cache'), npm_config_offline: 'true', npm_config_audit: 'false', npm_config_fund: 'false' });
    const execute = (command, args, options) => runCommandSync(command, args, { ...options, inheritEnv: false, env, timeoutMs: 30000 });
    const packed = execute('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', root, source], { cwd: root });
    expect(packed.exit_code).toBe(0);
    const metadata = JSON.parse(packed.stdout)[0];
    const result = verifiedNpmInstall({ context: { host: 'codex', platform: process.platform }, repoRoot: root,
      identity: { package: name, version: '1.0.0', integrity: metadata.integrity, source: 'local-fixture' },
      command: 'npm', args: ['install', '-g', `${name}@1.0.0`, '--no-audit', '--no-fund'],
      executeInstall: (command, args, options) => {
        if (args[0] === 'pack') {
          fs.copyFileSync(path.join(root, metadata.filename), path.join(args[args.indexOf('--pack-destination') + 1], metadata.filename));
          return packed;
        }
        return execute(command, args, options);
      },
    });
    expect(result).toMatchObject({ exit_code: 0, dependency_identity: { installer: 'npm-pack+npm-install', integrity_status: 'verified' } });
    expect(fs.readFileSync(path.join(installed, 'marker.txt'), 'utf8')).toBe('VERIFIED_ARCHIVE_INSTALLED');
    expect(JSON.parse(fs.readFileSync(path.join(installed, 'package.json'))).version).toBe('1.0.0');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}, 60000);
