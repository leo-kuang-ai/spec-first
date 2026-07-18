#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

function fail(message) {
  process.stderr.write(`source-plan-file-hash: ${message}\n`);
  process.exitCode = 1;
}

function isContained(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative !== ''
    && relative !== '..'
    && !relative.startsWith(`..${path.sep}`)
    && !path.isAbsolute(relative);
}

function main(args = process.argv.slice(2)) {
  if (args.length !== 1) {
    fail('expected exactly one repo-relative source-plan path');
    return;
  }

  const input = args[0];
  if (!input || input.includes('\0') || input.includes('\\')
    || path.isAbsolute(input) || path.win32.isAbsolute(input)) {
    fail('source-plan path must be a repo-relative POSIX path');
    return;
  }

  let root;
  try {
    root = fs.realpathSync(process.cwd());
  } catch (error) {
    fail(`artifact root is unreadable: ${error.message}`);
    return;
  }

  const candidate = path.resolve(root, input);
  if (!isContained(root, candidate)) {
    fail('source-plan path resolves outside the artifact root');
    return;
  }

  let stat;
  try {
    stat = fs.lstatSync(candidate);
  } catch (error) {
    fail(`source-plan file is unavailable: ${error.message}`);
    return;
  }

  if (!stat.isFile()) {
    fail('source-plan path must resolve to a regular file');
    return;
  }

  let realCandidate;
  try {
    realCandidate = fs.realpathSync(candidate);
  } catch (error) {
    fail(`source-plan file is unreadable: ${error.message}`);
    return;
  }

  if (!isContained(root, realCandidate)) {
    fail('source-plan file resolves outside the artifact root');
    return;
  }

  let bytes;
  try {
    bytes = fs.readFileSync(realCandidate);
  } catch (error) {
    fail(`source-plan file is unreadable: ${error.message}`);
    return;
  }

  const hash = crypto.createHash('sha256').update(bytes).digest('hex');
  process.stdout.write(`sha256:${hash}\n`);
}

if (require.main === module) main();

module.exports = {
  isContained,
  main,
};
