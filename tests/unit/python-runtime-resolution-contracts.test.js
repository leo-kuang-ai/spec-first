'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '../..');
const wrapperPaths = [
  'skills/spec-code-review/scripts/run-python.sh',
  'skills/spec-compound/scripts/run-python.sh',
  'skills/spec-compound-refresh/scripts/run-python.sh',
  'skills/spec-riffrec-feedback-analysis/scripts/run-python.sh',
  'skills/spec-sweep/scripts/run-python.sh',
];
const resolverScripts = [
  ...wrapperPaths,
  'skills/spec-optimize/scripts/measure.sh',
  'skills/spec-optimize/scripts/parallel-probe.sh',
  'skills/spec-code-review/scripts/cross-model-adversarial-review.sh',
];

describe('portable Python runtime resolution', () => {
  test('skill-local wrappers stay byte-identical', () => {
    const owner = fs.readFileSync(path.join(repoRoot, wrapperPaths[0]));
    for (const relativePath of wrapperPaths.slice(1)) {
      expect(fs.readFileSync(path.join(repoRoot, relativePath))).toEqual(owner);
    }
  });

  test.each(resolverScripts)('%s probes python3, python, then py -3 by execution', (relativePath) => {
    const source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    expect(source).toMatch(/for candidate in python3 python/);
    expect(source).toMatch(/"\$candidate" -c 'import sys/);
    expect(source).toMatch(/command -v py[\s\S]*py -3 -c 'import sys/);
    expect(source.indexOf('python3 python')).toBeLessThan(source.indexOf('command -v py'));
  });

  test('rejects a command stub and falls through to runnable python', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-python-resolution-'));
    const binDir = path.join(tempDir, 'bin');
    fs.mkdirSync(binDir);
    writeExecutable(path.join(binDir, 'python3'), '#!/bin/bash\nexit 9\n');
    writeExecutable(path.join(binDir, 'python'), `#!/bin/bash\nexec ${findPython3()} "$@"\n`);
    const target = path.join(tempDir, 'target.py');
    fs.writeFileSync(target, 'print("portable-python-ok")\n');

    const result = spawnSync('bash', [path.join(repoRoot, wrapperPaths[0]), target], {
      env: { ...process.env, PATH: `${binDir}:/usr/bin:/bin` },
      encoding: 'utf8',
    });
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe('portable-python-ok');
  });

  test('fails honestly when every visible candidate is a non-runnable stub', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-python-missing-'));
    const binDir = path.join(tempDir, 'bin');
    fs.mkdirSync(binDir);
    for (const name of ['python3', 'python', 'py']) {
      writeExecutable(path.join(binDir, name), '#!/bin/bash\nexit 9\n');
    }
    const target = path.join(tempDir, 'target.py');
    fs.writeFileSync(target, 'print("must-not-run")\n');

    const result = spawnSync('bash', [path.join(repoRoot, wrapperPaths[0]), target], {
      env: { ...process.env, PATH: `${binDir}:/usr/bin:/bin` },
      encoding: 'utf8',
    });
    expect(result.status).toBe(127);
    expect(result.stdout).toBe('');
    expect(result.stderr).toContain('no runnable Python 3 interpreter found');
  });
});

function writeExecutable(filePath, content) {
  fs.writeFileSync(filePath, content, { mode: 0o755 });
}

function findPython3() {
  const result = spawnSync('/usr/bin/env', ['python3', '-c', 'import sys; print(sys.executable)'], {
    encoding: 'utf8',
  });
  if (result.status !== 0) throw new Error('测试环境缺少 Python 3。');
  return result.stdout.trim();
}
