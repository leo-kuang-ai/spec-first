#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { runNpmChecked: runNpmCliChecked } = require('./lib/npm-cli.cjs');

const repoRoot = path.resolve(__dirname, '..');
const defaultWebsiteRepo = path.resolve(repoRoot, '..', 'spec-first-official-website');

function hasArg(name) {
  return process.argv.slice(2).includes(name);
}

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function skip(message) {
  console.log(`SKIP: ${message}`);
  process.exit(0);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function runNpmChecked(args, options) {
  try {
    runNpmCliChecked(args, {
      cwd: options.cwd,
      env: options.env,
      stdio: 'inherit',
    });
  } catch (error) {
    fail(error.message);
  }
}

function main() {
  const required = hasArg('--required') || process.env.SPEC_FIRST_WEBSITE_SYNC_REQUIRED === '1';
  const websiteRepo = path.resolve(process.env.SPEC_FIRST_WEBSITE_REPO || defaultWebsiteRepo);
  const websitePackageDir = path.join(websiteRepo, 'website');
  const packageJsonPath = path.join(websitePackageDir, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    const message = `official website repo not found at ${websiteRepo}; set SPEC_FIRST_WEBSITE_REPO to the checkout path`;
    if (required) fail(message);
    skip(message);
  }

  const pkg = readJson(packageJsonPath);
  const scripts = pkg.scripts || {};
  if (!scripts['facts:sync']) {
    fail(`website package missing facts:sync script: ${packageJsonPath}`);
  }
  if (!scripts['content:audit']) {
    fail(`website package missing content:audit script: ${packageJsonPath}`);
  }

  const syncScript = path.join(websitePackageDir, 'scripts', 'sync-spec-first-facts.js');
  const auditScript = path.join(websitePackageDir, 'scripts', 'audit-content-facts.js');
  for (const requiredPath of [syncScript, auditScript]) {
    if (!fs.existsSync(requiredPath)) {
      fail(`website sync script missing: ${requiredPath}`);
    }
  }

  runNpmChecked(['run', 'content:audit'], {
    cwd: websitePackageDir,
    env: {
      ...process.env,
      SPEC_FIRST_SOURCE_DIR: repoRoot,
    },
  });

  console.log(`website sync gate passed: ${websitePackageDir}`);
}

if (require.main === module) {
  main();
}
