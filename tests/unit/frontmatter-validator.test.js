'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const SCRIPT_PATHS = [
  path.join(__dirname, '..', '..', 'skills', 'spec-compound', 'scripts', 'validate-frontmatter.py'),
  path.join(__dirname, '..', '..', 'skills', 'spec-compound-refresh', 'scripts', 'validate-frontmatter.py'),
];

function writeDoc(dir, body) {
  const docPath = path.join(dir, `doc-${Math.random().toString(16).slice(2)}.md`);
  fs.writeFileSync(docPath, body);
  return docPath;
}

function runValidator(scriptPath, docPath) {
  return spawnSync('python3', [scriptPath, docPath], { encoding: 'utf8' });
}

describe.each(SCRIPT_PATHS)('frontmatter parser-safety validator %s', (scriptPath) => {
  let dir;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-frontmatter-'));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  test('requires exact opening and closing delimiter lines', () => {
    const badClose = writeDoc(dir, `---
title: Example
----

# Example
`);

    const result = runValidator(scriptPath, badClose);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('frontmatter not closed');
  });

  test('rejects unquoted silent-corruption scalar values', () => {
    const commentTruncation = writeDoc(dir, `---
title: Fix auth # regression
problem_type: workflow_issue
---

# Example
`);
    const mappingConfusion = writeDoc(dir, `---
title: Fix: auth regression
problem_type: workflow_issue
---

# Example
`);

    const commentResult = runValidator(scriptPath, commentTruncation);
    const mappingResult = runValidator(scriptPath, mappingConfusion);

    expect(commentResult.status).toBe(1);
    expect(commentResult.stderr).toContain("contains ' #'");
    expect(mappingResult.status).toBe(1);
    expect(mappingResult.stderr).toContain("contains ': '");
  });

  test('allows quoted scalars and does not enforce schema required fields or enums', () => {
    const valid = writeDoc(dir, `---
title: "Fix auth # regression: parser-safe"
problem_type: not_a_real_enum
---

# Example
`);

    const result = runValidator(scriptPath, valid);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK:');
  });
});

// WIN-P1-02 回归:验证器必须显式以 UTF-8 读取。Windows 非 UTF-8 系统 locale 下,Python
// 默认编码会误读或对含中文 frontmatter 抛 UnicodeDecodeError。这里通过强制 C locale 并关闭
// Python 的 UTF-8 mode 强制(PYTHONUTF8=0 / PYTHONCOERCECLOCALE=0)来复现该 locale 条件;
// 若脚本退回默认编码,读取会失败,本 test 即报警。
describe.each(SCRIPT_PATHS)('frontmatter validator reads UTF-8 explicitly %s', (scriptPath) => {
  let dir;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-frontmatter-utf8-'));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  test('validates Chinese frontmatter under a non-UTF-8 locale', () => {
    const chineseDoc = writeDoc(dir, `---
title: "修复中文标题：parser-safe"
problem_type: workflow_issue
---

# 示例中文文档
`);

    const result = spawnSync('python3', [scriptPath, chineseDoc], {
      encoding: 'utf8',
      env: {
        ...process.env,
        LC_ALL: 'C',
        LANG: 'C',
        PYTHONUTF8: '0',
        PYTHONCOERCECLOCALE: '0',
      },
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK:');
  });
});

// 防拷贝漂移:validate-frontmatter.py 在 spec-compound 与 spec-compound-refresh 各有一份
// 有意副本(skill 投影机制只带各自目录的 scripts/,无法跨 skill 引用)。两份必须逐字一致;
// 改一处时此 test 强制同步另一处,把隐性漂移风险转为显式守护。彻底去重需改投影机制,
// 对一个稳定的纯 stdlib 脚本属过度工程,故按 80/20 选 test 守护而非共享资产机制。
describe('validate-frontmatter.py intentional copies stay in sync', () => {
  test('both skill copies are byte-identical', () => {
    const contents = SCRIPT_PATHS.map((scriptPath) => fs.readFileSync(scriptPath, 'utf8'));
    expect(contents[0]).toBe(contents[1]);
  });
});
