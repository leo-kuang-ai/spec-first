#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { coerce, gt, inc } from 'semver';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');

const requested = (process.argv[2] ?? 'auto').toLowerCase();
const explicitBumps = new Set(['major', 'minor', 'patch']);

function fail(message, details = '') {
  console.error(`FAIL: ${message}`);
  if (details) {
    console.error(details.trimEnd());
  }
  process.exit(1);
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    shell: false,
  });

  if (result.error) {
    fail(`${command} ${args.join(' ')} 运行失败`, String(result.error));
  }
  if (result.status !== 0) {
    fail(
      `${command} ${args.join(' ')} 退出码 ${result.status ?? 'null'}`,
      [result.stdout, result.stderr].filter(Boolean).join('\n')
    );
  }

  return result.stdout.trim();
}

function getLastTag() {
  const output = run('git', ['tag', '--sort=-v:refname']);
  const tags = output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return tags[0];
}

function normalizeVersion(version) {
  const raw = version.startsWith('v') ? version.slice(1) : version;
  const parsed = coerce(raw);

  if (!parsed) {
    fail(`无法解析版本号: ${version}`);
  }

  return parsed.version;
}

function getBaseVersion() {
  const packageVersion = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')).version;
  const lastTag = getLastTag();

  if (!lastTag) {
    return normalizeVersion(packageVersion);
  }

  const normalizedPackageVersion = normalizeVersion(packageVersion);
  const normalizedTagVersion = normalizeVersion(lastTag);

  return gt(normalizedTagVersion, normalizedPackageVersion)
    ? normalizedTagVersion
    : normalizedPackageVersion;
}

function detectBump() {
  const lastTag = getLastTag();
  const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';
  const output = run('git', ['log', range, '--format=%B%n---COMMIT---']);

  if (/(^|\n)BREAKING CHANGE:/i.test(output) || /\w+!:/m.test(output)) {
    return 'major';
  }
  if (/(^|\n)feat(\([^)]+\))?:/m.test(output)) {
    return 'minor';
  }
  return 'patch';
}

const bump = explicitBumps.has(requested) ? requested : requested === 'auto' ? detectBump() : undefined;

if (!bump) {
  fail(`未知版本升级类型: ${requested}`, '仅支持 auto / major / minor / patch');
}

const packageJsonPath = join(repoRoot, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const before = getBaseVersion();
const after = inc(before, bump);

if (!after) {
  fail(`无法计算新版本号: ${before} + ${bump}`);
}

packageJson.version = after;
writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

console.log(`✓ 版本已更新: ${before} -> ${after} (${bump})`);
