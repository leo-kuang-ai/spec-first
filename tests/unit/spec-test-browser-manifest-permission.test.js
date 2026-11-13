'use strict';

// 回归测试：SUP-09 - 浏览器 manifest 拒绝越界路径前已修改外部文件权限
// 证据：docs/validation/2026-11-09-harness-full-code-deep-review.md:156-163
//
// 修复要点：inspectPrivateFile 和 inspectPrivateDirectory 在执行 hardening（chmod）
// 之前先完成所有检查，调用者在 containment 检查通过后才执行 hardening

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { runPreparedContext } = require('../../skills/spec-test-browser/scripts/agent-browser-run-context.cjs');

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sup09-'));
}

describe('Browser manifest permission modification — SUP-09', () => {
  test('拒绝越界 test_plan_path 时不修改外部文件权限', () => {
    const root = tmpDir();

    try {
      const runDir = path.join(root, 'run');
      const outsideDir = path.join(root, 'outside');
      fs.mkdirSync(runDir, { recursive: true });
      fs.mkdirSync(outsideDir, { recursive: true });

      // 创建外部文件，设置为 0644
      const outsideFile = path.join(outsideDir, 'external-plan.json');
      fs.writeFileSync(outsideFile, '{}', { mode: 0o644 });
      const originalStat = fs.statSync(outsideFile);
      const originalMode = originalStat.mode & 0o777;

      // 创建一个合法的 prepare 结果，然后修改 manifest 的 test_plan_path 指向外部
      const manifestPath = path.join(runDir, 'manifest.json');
      const testPlan = {
        target_origin: 'http://example.com',
        steps: [],
      };
      const testPlanPath = path.join(runDir, 'plan.json');
      fs.writeFileSync(testPlanPath, JSON.stringify(testPlan), { mode: 0o600 });

      const manifest = {
        schema_version: 'spec-test-browser-run-context/v1',
        run_dir: runDir,
        test_plan_path: outsideFile, // 篡改：指向边界外
        test_plan_sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        config_path: path.join(runDir, 'config.json'),
        action_policy_path: path.join(runDir, 'policy.json'),
        raw_dir: path.join(runDir, 'raw'),
        screenshot_dir: path.join(runDir, 'screenshots'),
        target_origin: 'http://example.com',
      };
      fs.writeFileSync(manifestPath, JSON.stringify(manifest), { mode: 0o600 });

      // 创建其他必需的边界内文件
      fs.writeFileSync(path.join(runDir, 'config.json'), '{}', { mode: 0o600 });
      fs.writeFileSync(path.join(runDir, 'policy.json'), '{}', { mode: 0o600 });
      fs.mkdirSync(path.join(runDir, 'raw'), { mode: 0o700 });
      fs.mkdirSync(path.join(runDir, 'screenshots'), { mode: 0o700 });

      // SUP-09 修复前：外部文件权限会被改为 0600
      // SUP-09 修复后：应该拒绝 manifest 且外部文件权限不变
      const result = runPreparedContext({
        manifestPath,
        probe: () => ({ execution_readiness: 'not_ready', reason_code: 'test-skip-probe' })
      });

      // 由于 manifest 的 test_plan_path 指向边界外，应该在 readPreparedManifest 阶段被拒绝
      expect(result.status).toBe('not_run');
      expect(result.reason_code).toBe('private-run-file-untrusted');

      // 验证外部文件权限未被修改
      const afterStat = fs.statSync(outsideFile);
      const afterMode = afterStat.mode & 0o777;
      expect(afterMode).toBe(originalMode);

    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('合法边界内 manifest 仍然可以正常工作', () => {
    const root = tmpDir();

    try {
      const runDir = path.join(root, 'run');
      fs.mkdirSync(runDir, { recursive: true });

      // 所有文件都在边界内
      const testPlanPath = path.join(runDir, 'plan.json');
      const configPath = path.join(runDir, 'config.json');
      const policyPath = path.join(runDir, 'policy.json');

      const testPlan = {
        target_origin: 'http://example.com',
        steps: [],
      };

      const manifest = {
        schema_version: 'spec-test-browser-run-context/v1',
        run_dir: runDir,
        test_plan_path: testPlanPath,
        config_path: configPath,
        action_policy_path: policyPath,
        raw_dir: path.join(runDir, 'raw'),
        screenshot_dir: path.join(runDir, 'screenshots'),
        test_plan_sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        target_origin: 'http://example.com',
      };

      const manifestPath = path.join(runDir, 'manifest.json');
      fs.writeFileSync(manifestPath, JSON.stringify(manifest), { mode: 0o600 });
      fs.writeFileSync(testPlanPath, JSON.stringify(testPlan), { mode: 0o600 });
      fs.writeFileSync(configPath, '{}', { mode: 0o600 });
      fs.writeFileSync(policyPath, '{}', { mode: 0o600 });
      fs.mkdirSync(path.join(runDir, 'raw'), { mode: 0o700 });
      fs.mkdirSync(path.join(runDir, 'screenshots'), { mode: 0o700 });

      // 边界内的合法 manifest 应该成功（不应该在 containment 阶段失败）
      const result = runPreparedContext({
        manifestPath,
        probe: () => ({ execution_readiness: 'not_ready', reason_code: 'test-skip-probe' })
      });

      // 可能因为 probe 返回 not_ready，但不应该是 containment 错误
      if (result.status === 'not_run') {
        expect(result.reason_code).not.toBe('private-run-file-untrusted');
        expect(result.reason_code).not.toBe('private-run-directory-untrusted');
      }

    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('拒绝越界 raw_dir 时不修改外部目录权限', () => {
    const root = tmpDir();

    try {
      const runDir = path.join(root, 'run');
      const outsideDir = path.join(root, 'outside-raw');
      fs.mkdirSync(runDir, { recursive: true });
      fs.mkdirSync(outsideDir, { mode: 0o755 });

      const originalStat = fs.statSync(outsideDir);
      const originalMode = originalStat.mode & 0o777;

      const testPlan = {
        target_origin: 'http://example.com',
        steps: [],
      };

      const manifest = {
        schema_version: 'spec-test-browser-run-context/v1',
        run_dir: runDir,
        test_plan_path: path.join(runDir, 'plan.json'),
        config_path: path.join(runDir, 'config.json'),
        action_policy_path: path.join(runDir, 'policy.json'),
        raw_dir: outsideDir, // 指向边界外
        screenshot_dir: path.join(runDir, 'screenshots'),
        test_plan_sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        target_origin: 'http://example.com',
      };

      const manifestPath = path.join(runDir, 'manifest.json');
      fs.writeFileSync(manifestPath, JSON.stringify(manifest), { mode: 0o600 });
      fs.writeFileSync(path.join(runDir, 'plan.json'), JSON.stringify(testPlan), { mode: 0o600 });
      fs.writeFileSync(path.join(runDir, 'config.json'), '{}', { mode: 0o600 });
      fs.writeFileSync(path.join(runDir, 'policy.json'), '{}', { mode: 0o600 });
      fs.mkdirSync(path.join(runDir, 'screenshots'), { mode: 0o700 });

      const result = runPreparedContext({
        manifestPath,
        probe: () => ({ execution_readiness: 'not_ready', reason_code: 'test-skip-probe' })
      });

      expect(result.status).toBe('not_run');
      expect(result.reason_code).toBe('private-run-directory-untrusted');

      // 验证外部目录权限未被修改
      const afterStat = fs.statSync(outsideDir);
      const afterMode = afterStat.mode & 0o777;
      expect(afterMode).toBe(originalMode);

    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
