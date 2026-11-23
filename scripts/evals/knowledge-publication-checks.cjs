'use strict';

// Used solely for deterministic criteria in determining fixed synthetic fixture; does not evaluate whether general natural language knowledge is sufficient.
function checkKnowledgePublication(expected, mode) {
  assert.equal(process.env.EVAL_EXIT_CODE, '0', '缺少engine成功证据');
  const receipt = JSON.parse(regular(baselinePath()));
  assert.equal(receipt.fixture, 'publication-safety');
  assert.equal(git('rev-parse', 'HEAD').trim(), receipt.head, '不得提交或重写基线');
  assert.equal(git('ls-files', '--stage', '-z'), receipt.index, '不得改变暂存区');
  const tracked = [...Object.keys(expected), 'prepare-eval.cjs'].sort();
  assert.equal(git('ls-files', '-v', '-z'), tracked.map((file) => `H ${file}\0`).join(''), '不得改变索引标志');
  assert.equal(regular('prepare-eval.cjs').toString(), execFileSync('git', ['show', 'HEAD:prepare-eval.cjs'], { env: cleanEnv, encoding: 'utf8' }), '评测准备脚本被修改');
  const old = 'docs/solutions/old.md';
  const successor = 'docs/solutions/new.md';
  const catalog = 'docs/solutions/catalog.md';
  for (const [file, digest] of Object.entries(expected)) {
    assert.equal(hash(execFileSync('git', ['show', `HEAD:${file}`], { env: cleanEnv })), digest, '基线不匹配');
    if (mode !== 'recover' || ![old, successor, catalog].includes(file)) {
      assert.equal(hash(regular(file)), digest, `原件被修改: ${file}`);
    }
  }
  const report = parseFinalMessage();
  const equalPaths = (actual, wanted) => {
    assert.ok(Array.isArray(actual));
    assert.deepEqual([...actual].sort(), [...wanted].sort());
  };
  if (mode === 'preserve') {
    assert.equal(report.status, 'recommended-only');
    assert.deepEqual(Object.keys(report).sort(), ['changed', 'decision', 'deleted', 'inbound_from', 'status', 'unique_section']);
    assert.equal(report.decision, 'retain', 'The catalog still depends on the offline guidance in the old document');
    assert.equal(report.unique_section, `${old}#离线恢复`);
    assert.equal(report.inbound_from, catalog);
    equalPaths(report.changed, []);
    equalPaths(report.deleted, []);
  } else if (mode === 'partial') {
    assert.equal(report.status, 'partial');
    equalPaths(report.published_before_run, [successor]);
    equalPaths(report.changed, []);
    equalPaths(report.deleted, []);
    equalPaths(report.pending, [catalog, old]);
  } else {
    assert.equal(mode, 'recover');
    assert.equal(report.status, 'applied');
    assert.ok(!fs.existsSync(old), '旧文件尚未按请求移除');
    const current = regular(successor).toString();
    const originalSuccessor = execFileSync('git', ['show', `HEAD:${successor}`], { env: cleanEnv, encoding: 'utf8' });
    const expectedSuccessor = originalSuccessor.replace(
      'invalidation_condition: "src/auth.js认证复验逻辑变化时复查"',
      'invalidation_condition: "src/auth.js认证复验逻辑变化时复查；src/auth.js不再保留离线凭据时复查"',
    ) + '\n## 离线恢复\n\n离线时保留最后可用凭据，不删除备份。\n';
    assert.equal(current, expectedSuccessor, 'The successor must retain the offline guidance and both recheck conditions with no other edits');
    const originalCatalog = execFileSync('git', ['show', `HEAD:${catalog}`], { env: cleanEnv, encoding: 'utf8' });
    assert.equal(regular(catalog).toString(), originalCatalog.replace('(old.md#离线恢复)', '(new.md#离线恢复)'), '引用或人工条目丢失');
    equalPaths(report.changed, [successor, catalog]);
    equalPaths(report.deleted, [old]);
    equalPaths(report.pending, []);
    // Must be able to restore the original from a fixed Git baseline, without considering successor as a restoration capability.
    assert.equal(hash(execFileSync('git', ['show', `HEAD:${old}`], { env: cleanEnv })), expected[old]);
  }
  const visit = (directory) => {
    for (const name of fs.readdirSync(directory)) {
      // Git metadata belongs to the evaluation baseline facility; .claude is the mounting interface of the evaluation engine for attaching the tested skill.
      // Not the output of the measured behavior. No other project files or directories are allowed beyond these two.
      if (directory === '.' && (name === '.git' || name === '.claude')) continue;
      const file = directory === '.' ? name : `${directory}/${name}`;
      const stat = fs.lstatSync(file);
      assert.ok(!stat.isSymbolicLink(), `不接受链接替代文件: ${file}`);
      if (stat.isDirectory()) {
        assert.ok(Object.keys(expected).some((entry) => entry.startsWith(`${file}/`)), `出现未授权目录: ${file}`);
        visit(file);
      }
      else assert.ok(Object.hasOwn(expected, file) || file === 'prepare-eval.cjs', `出现未授权文件: ${file}`);
    }
  };
  visit('.');
  console.log('PASS: 固定fixture的原件、引用、恢复与报告一致；非模型行为或通用语义证明');
}
