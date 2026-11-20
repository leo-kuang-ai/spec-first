const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });
const tracked = new Set(git('ls-files', '-z', '--', 'skills').split('\0').filter(Boolean));
const files = [];
function walk(directory) {
  for (const name of fs.readdirSync(directory).sort()) {
    const file = path.join(directory, name);
    const stat = fs.lstatSync(file);
    if (stat.isDirectory()) {
      walk(file);
      continue;
    }
    const bytes = stat.isSymbolicLink() ? Buffer.from(fs.readlinkSync(file)) : fs.readFileSync(file);
    files.push({ file, kind: stat.isSymbolicLink() ? 'link' : 'file', tracked: tracked.has(file), bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') });
  }
}
walk('skills');
const disk = new Set(files.map(entry => entry.file));
const snapshot = { head: git('rev-parse', 'HEAD').trim(), missing: [...tracked].filter(file => !disk.has(file)), files };
const data = JSON.stringify(snapshot, null, 2) + '\n';
const target = path.join(__dirname, 'source-baseline.json');
if (process.argv.includes('--check')) {
  if (data !== fs.readFileSync(target, 'utf8')) throw new Error('当前文件与冻结基线不同');
} else {
  fs.writeFileSync(target, data, { flag: 'wx' });
}
const counts = {};
for (const entry of files) {
  const owner = entry.file.split('/')[1];
  counts[owner] = (counts[owner] || 0) + 1;
}
console.log(JSON.stringify({ total: files.length, tracked: tracked.size, missing: snapshot.missing.length, counts }));
