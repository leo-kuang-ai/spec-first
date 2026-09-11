#!/bin/bash
# Verify the frozen fixture bytes; keywords are only a diagnostic signal.
set -euo pipefail
node <<'NODE'
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const expected = {
  'src/server.js': 'ff9d96855c23af77404d023eaa9d29fdc2cbea765b31a0ec8d5f9bbaba54cf34',
  'package.json': '03422077e4a5f51c61b08600a3a997da8efeb5928a78950be69d37fa5c5ded2b',
  'README.md': '4aac9f15131207d5e35f3d146e5e0998a26039d49c6ba87432a40e0697a71855',
};
assert.equal(process.env.EVAL_EXIT_CODE, '0', 'Engine success evidence is required');
assert.ok(process.env.EVAL_FINAL_MESSAGE?.trim(), 'Final output is empty');
assert.equal(execFileSync('git', ['rev-list', '--count', 'HEAD'], { encoding: 'utf8' }).trim(), '1', 'Expected only the fixture commit');
execFileSync('git', ['diff', '--cached', '--exit-code', '--quiet'], { stdio: 'pipe' });
for (const [file, hash] of Object.entries(expected)) {
  assert.ok(fs.lstatSync(file).isFile(), `${file} must remain a regular file`);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'), hash, `${file} changed`);
  const committed = execFileSync('git', ['show', `HEAD:${file}`]);
  assert.equal(crypto.createHash('sha256').update(committed).digest('hex'), hash, 'Fixture commit changed');
}
assert.ok(fs.lstatSync('src').isDirectory(), 'Source directory must not be a symlink');
assert.deepEqual(fs.readdirSync('src').sort(), ['server.js'], 'Unexpected source files');
assert.ok(!fs.existsSync('tests') || (fs.lstatSync('tests').isDirectory() && fs.readdirSync('tests').length === 0), 'Unexpected tests');
// This signal is not an independent semantic assessment of the causal chain.
assert.match(process.env.EVAL_FINAL_MESSAGE, /JSON|parse|解析|崩溃|crash|root cause|根因|causal|异常/i);
console.log('PASS: protected fixture bytes and initial commit preserved; diagnostic signal present');
NODE
