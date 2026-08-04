'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..', '..');

function runValidator(scriptPath, docPath) {
  return spawnSync('python3', [scriptPath, docPath], {
    cwd: repoRoot,
    env: {
      ...process.env,
      LC_ALL: 'C',
      LANG: 'C',
      PYTHONUTF8: '0',
      PYTHONCOERCECLOCALE: '0',
    },
    encoding: 'utf8',
  });
}

describe('frontmatter validators read UTF-8 documents under non-UTF-8 locale', () => {
  test.each([
    ['spec-compound', 'skills/spec-compound/scripts/validate-frontmatter.py'],
    ['spec-compound-refresh', 'skills/spec-compound-refresh/scripts/validate-frontmatter.py'],
  ])('%s validator accepts Chinese frontmatter under LC_ALL=C', (_name, relativeScriptPath) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'frontmatter-utf8-'));
    const docPath = path.join(dir, 'learning.md');
    fs.writeFileSync(docPath, [
      '---',
      'title: 中文标题',
      'category: best_practice',
      '---',
      '',
      '# 中文标题',
      '',
    ].join('\n'), 'utf8');

    const scriptPath = path.join(repoRoot, relativeScriptPath);
    const result = runValidator(scriptPath, docPath);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain(`OK: ${docPath}`);
    expect(result.stderr).toBe('');
  });
});
