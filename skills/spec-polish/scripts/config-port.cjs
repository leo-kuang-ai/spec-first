'use strict';

const fs = require('node:fs');
const source = fs.readFileSync(process.argv[2], 'utf8');
// Tokenize without evaluating config. Comments and string/template bodies cannot
// supply a port key; ambiguous literals fall through to the next source.
const tokens = source.match(/\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|[A-Za-z_$][\w$]*|\d+(?:\.\d+)?|[^\s]/g) || [];
const clean = tokens.filter((t) => !t.startsWith('//') && !t.startsWith('/*'));
const ports = [];
for (let i = 1; i + 3 < clean.length; i++) {
  if (!['{', ','].includes(clean[i - 1]) || !['port', '"port"', "'port'"].includes(clean[i])) continue;
  if (clean[i + 1] !== ':' || !/^[0-9]{1,5}$/.test(clean[i + 2]) || ![',', '}'].includes(clean[i + 3])) continue;
  const port = Number(clean[i + 2]);
  if (port > 0 && port <= 65535) ports.push(port);
}
if (new Set(ports).size === 1) process.stdout.write(String(ports[0]));
