'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repo = path.resolve(__dirname, '../..');
const historicalReference = 'docs/methodology/spec-first代码审查方案.md';

function* instructionFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'evals') yield* instructionFiles(target);
    if (entry.isFile() && entry.name.endsWith('.md')) yield target;
  }
}

test('技能入口、引用和模板统一使用英文，引用真实源路径时保留原名', () => {
  const findings = [];
  expect(fs.statSync(path.join(repo, historicalReference)).isFile()).toBe(true);
  for (const file of instructionFiles(path.join(repo, 'skills'))) {
    const relative = path.relative(repo, file).split(path.sep).join('/');
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, index) => {
      const prose = relative === 'skills/_shared/README.md' ? line.replace(`\`${historicalReference}\``, '') : line;
      if (/\p{Script=Han}/u.test(prose)) findings.push(`${relative}:${index + 1}`);
    });
  }
  expect(findings).toEqual([]);
});
