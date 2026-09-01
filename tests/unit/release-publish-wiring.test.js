'use strict';

// release-publish.cjs 是顶层立即执行脚本（不可 require），其接线行为通过
// 源码契约锁定：门禁时序、skip 语义、发布后固化守卫、失败回滚条件。
// git 门禁与固化模块自身的行为由 release-git-gate.test.js 的真实 git repo
// 用例覆盖；此处只防接线顺序回退（例如把门禁挪到版本写入之后）。

const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', '..', 'scripts', 'release-publish.cjs'),
  'utf8',
);

describe('release-publish wiring contract', () => {
  test('usage mentions the --skip-git-gate escape hatch', () => {
    const usageAt = source.indexOf('缺少版本参数');
    const usageSlice = source.slice(usageAt, usageAt + 400);
    expect(usageSlice).toContain('--skip-git-gate');
  });

  test('git gate runs before the target version is written to package.json', () => {
    const gateCall = source.indexOf('assertPublishableGitState({ cwd: repoRoot })');
    const versionWrite = source.indexOf('writePackageJson(nextPkg)');
    expect(gateCall).toBeGreaterThan(-1);
    expect(versionWrite).toBeGreaterThan(-1);
    // 脚本自己写入版本号会把工作区写脏；门禁必须发生在它之前。
    expect(gateCall).toBeLessThan(versionWrite);
  });

  test('gate failure exits before entering the publish try block', () => {
    const gateFail = source.indexOf('git 门禁未通过');
    const tryBlock = source.indexOf('try {');
    expect(gateFail).toBeGreaterThan(-1);
    expect(gateFail).toBeLessThan(tryBlock);
  });

  test('post-publish git recording only runs when the gate passed', () => {
    const recordCall = source.indexOf('recordReleaseCommitAndTag({ cwd: repoRoot');
    const guard = source.indexOf('if (gitGate && gitGate.ok)');
    expect(recordCall).toBeGreaterThan(-1);
    expect(guard).toBeGreaterThan(-1);
    expect(guard).toBeLessThan(recordCall);
    // --skip-git-gate 分支只输出手动命令，不调用记录器。
    const skipBranch = source.slice(source.indexOf('git 门禁已跳过'), source.indexOf('git 门禁已跳过') + 500);
    expect(skipBranch).not.toContain('recordReleaseCommitAndTag');
    expect(skipBranch).toContain('git commit -m "chore(release): v');
    expect(skipBranch).toContain('git tag v');
  });

  test('version rollback in finally keeps a successful publish on the new version', () => {
    const rollbackCondition = source.indexOf('dryRun || !publishSucceeded');
    expect(rollbackCondition).toBeGreaterThan(-1);
    // publish 成功后（publishSucceeded=true 且非 dry-run）不得回滚版本号，
    // 否则自动 commit 会固化回旧版本。
    const rollbackSlice = source.slice(rollbackCondition - 200, rollbackCondition + 200);
    expect(rollbackSlice).toContain('if (wroteTargetVersion');
  });
});
