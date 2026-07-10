'use strict';

const fs = require('node:fs');
const path = require('node:path');

const skillsRoot = path.resolve(__dirname, '../../skills');

function findNamedFiles(root, name, found = []) {
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) findNamedFiles(fullPath, name, found);
    if (entry.isFile() && entry.name === name) found.push(fullPath);
  }
  return found.sort();
}

describe('repo profile cache copies', () => {
  test.each([
    'repo-profile-cache.md',
    'repo-profile-cache.py',
    'repo-profiler.md',
  ])('%s copies remain byte-identical', (name) => {
    const files = findNamedFiles(skillsRoot, name);
    expect(files.length).toBeGreaterThan(1);
    const baseline = fs.readFileSync(files[0]);
    for (const file of files.slice(1)) {
      expect(fs.readFileSync(file).equals(baseline)).toBe(true);
    }
  });
});
