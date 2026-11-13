'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

function materializeNpmPack(command, args) {
  if (command !== 'npm' || args[0] !== 'pack') return null;
  const spec = args[args.length - 1];
  const filename = spec.split('/').pop().replace('@', '-') + '.tgz';
  const bytes = fs.readFileSync(path.join(__dirname, filename));
  fs.writeFileSync(path.join(args[args.indexOf('--pack-destination') + 1], filename), bytes);
  const integrity = `sha512-${crypto.createHash('sha512').update(bytes).digest('base64')}`;
  return {
    command, args, argv: args, exit_code: 0, signal: null, timed_out: false, timeout: false, error: null, stderr: '',
    stdout: JSON.stringify([{ name: spec.slice(0, spec.lastIndexOf('@')), version: spec.slice(spec.lastIndexOf('@') + 1), filename, integrity }]),
  };
}

module.exports = { materializeNpmPack };
