'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const {
  assertContainedPath,
  ensureContainedDirectory,
  reasonError,
} = require('./path-safety.cjs');
const {
  commandSucceeded,
} = require('./process-runner.cjs');
const {
  renderJson,
} = require('./renderer.cjs');

function generateSetupScenarioFingerprint(context, repoRoot, bundle) {
  const outputPath = path.join(repoRoot, '.spec-first', 'workspace', 'scenario-fingerprint-setup.json');
  const toolFactsPath = path.join(repoRoot, '.spec-first', 'config', 'tool-facts.json');
  const runtimeCapabilitiesPath = path.join(repoRoot, '.spec-first', 'config', 'runtime-capabilities.json');
  try {
    assertContainedPath(repoRoot, outputPath, { reasonCode: 'artifact-output-symlink-escape' });
    const packageRoot = resolveSpecFirstPackageRoot(context, context.setupScriptDir);
    const helperPath = packageRoot
      ? path.join(packageRoot, 'src', 'cli', 'helpers', 'scenario-fingerprint.js')
      : null;
    if (helperPath && fs.existsSync(helperPath)) {
      const helper = require(helperPath);
      if (!helper || typeof helper.computeSetupLayer !== 'function') {
        return scenarioFingerprintFailure(
          'scenario-fingerprint-helper-invalid',
          `Scenario fingerprint helper 未导出 computeSetupLayer：${helperPath}`,
        );
      }
      const artifact = helper.computeSetupLayer({
        cwd: repoRoot,
        ledger: bundle.runtimeCapabilities,
        targetFacts: bundle.toolFacts,
      });
      writeScenarioFingerprintArtifact(repoRoot, outputPath, artifact);
      return scenarioFingerprintWritten(outputPath);
    }
    return generateScenarioFingerprintThroughCli(context, repoRoot, {
      outputPath,
      toolFactsPath,
      runtimeCapabilitiesPath,
      packageRoot,
    });
  } catch (error) {
    return scenarioFingerprintFailure(
      error.reason_code || 'scenario-fingerprint-generation-failed',
      error && error.message ? error.message : error,
    );
  }
}

function resolveSpecFirstPackageRoot(context, setupScriptDir) {
  const candidates = [
    path.resolve(context.skillRoot, '..', '..'),
  ];
  if (setupScriptDir) candidates.push(path.resolve(setupScriptDir, '..', '..', '..'));
  for (const candidate of [...new Set(candidates)]) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(candidate, 'package.json'), 'utf8'));
      if (packageJson.name === 'spec-first') return candidate;
    } catch (_error) {
      // 投影后的 runtime skill 可能不与已安装 package 相邻。
    }
  }
  return null;
}

function generateScenarioFingerprintThroughCli(context, repoRoot, options) {
  const args = [
    'internal',
    'compute-scenario-fingerprint',
    '--layer',
    'setup',
    '--ledger',
    options.runtimeCapabilitiesPath,
    '--target-facts',
    options.toolFactsPath,
    '--out',
    options.outputPath,
  ];
  let command = 'spec-first';
  let commandArgs = args;
  const explicitCli = context.env && context.env.SPEC_FIRST_CLI;
  const bundledCli = options.packageRoot && path.join(options.packageRoot, 'bin', 'spec-first.js');
  if (explicitCli) {
    if (String(explicitCli).endsWith('.js') && fs.existsSync(explicitCli)) {
      command = process.execPath;
      commandArgs = [path.resolve(explicitCli), ...args];
    } else command = explicitCli;
  } else if (bundledCli && fs.existsSync(bundledCli)) {
    command = process.execPath;
    commandArgs = [bundledCli, ...args];
  }
  const beforeHash = fileHash(options.outputPath);
  const result = context.runner(command, commandArgs, {
    cwd: repoRoot,
    timeoutMs: 30000,
    env: context.env,
  });
  if (!commandSucceeded(result)) {
    return scenarioFingerprintFailure(
      scenarioFingerprintCliReason(result),
      processDiagnostic(result),
    );
  }
  assertContainedPath(repoRoot, options.outputPath, { reasonCode: 'artifact-output-symlink-escape' });
  const afterHash = fileHash(options.outputPath);
  if (!afterHash || afterHash === beforeHash) {
    return scenarioFingerprintFailure(
      'scenario-fingerprint-artifact-not-updated',
      'Scenario fingerprint CLI 虽成功退出，但未提交新的 artifact。',
    );
  }
  const artifact = JSON.parse(fs.readFileSync(options.outputPath, 'utf8'));
  if (artifact.schema_version !== 'developer-scenario-fingerprint-setup.v1') {
    return scenarioFingerprintFailure(
      'scenario-fingerprint-artifact-invalid',
      `意外的 setup scenario fingerprint schema：${artifact.schema_version || 'missing'}`,
    );
  }
  return scenarioFingerprintWritten(options.outputPath);
}

function writeScenarioFingerprintArtifact(repoRoot, outputPath, artifact) {
  if (!artifact || artifact.schema_version !== 'developer-scenario-fingerprint-setup.v1') {
    throw reasonError('scenario-fingerprint-artifact-invalid', 'Setup scenario fingerprint schema 无效。');
  }
  const target = assertContainedPath(repoRoot, outputPath, {
    reasonCode: 'artifact-output-symlink-escape',
  });
  const directory = ensureContainedDirectory(repoRoot, path.dirname(target), {
    reasonCode: 'artifact-output-symlink-escape',
    mode: 0o700,
  });
  const tempPath = path.join(
    directory,
    `.scenario-fingerprint-setup.${process.pid}.${crypto.randomBytes(6).toString('hex')}.tmp`,
  );
  try {
    assertContainedPath(repoRoot, target, { reasonCode: 'artifact-output-symlink-escape' });
    assertContainedPath(repoRoot, tempPath, { reasonCode: 'artifact-output-symlink-escape' });
    fs.writeFileSync(tempPath, renderJson(artifact), {
      encoding: 'utf8',
      flag: 'wx',
      mode: 0o600,
    });
    assertContainedPath(repoRoot, directory, { reasonCode: 'artifact-output-symlink-escape' });
    assertContainedPath(repoRoot, target, { reasonCode: 'artifact-output-symlink-escape' });
    assertContainedPath(repoRoot, tempPath, { reasonCode: 'artifact-output-symlink-escape' });
    fs.renameSync(tempPath, target);
    fs.chmodSync(target, 0o600);
    assertContainedPath(repoRoot, target, { reasonCode: 'artifact-output-symlink-escape' });
    const committed = JSON.parse(fs.readFileSync(target, 'utf8'));
    if (committed.schema_version !== 'developer-scenario-fingerprint-setup.v1') {
      throw reasonError('scenario-fingerprint-artifact-invalid', '已提交的 scenario fingerprint schema 无效。');
    }
  } catch (error) {
    try { fs.rmSync(tempPath, { force: true }); } catch (_cleanupError) { /* 保留主错误 */ }
    if (!error.reason_code) error.reason_code = 'scenario-fingerprint-write-failed';
    throw error;
  }
}

function scenarioFingerprintWritten(outputPath) {
  return {
    status: 'written',
    schema_version: 'developer-scenario-fingerprint-setup.v1',
    path: path.resolve(outputPath),
    advisory: true,
  };
}

function scenarioFingerprintFailure(reasonCode, diagnostic, extra = {}) {
  return {
    status: 'failed',
    schema_version: 'developer-scenario-fingerprint-setup.v1',
    advisory: true,
    reason_code: reasonCode,
    diagnostic: limitedDiagnostic(diagnostic),
    ...extra,
  };
}

function scenarioFingerprintCliReason(result) {
  try {
    const parsed = JSON.parse(String(result && result.stdout ? result.stdout : ''));
    if (parsed && parsed.error && parsed.error.code) return parsed.error.code;
  } catch (_error) {
    // 回退到下方的 bounded process 结果。
  }
  return result && (result.timed_out || result.timeout)
    ? 'scenario-fingerprint-timeout'
    : 'scenario-fingerprint-cli-failed';
}

function processDiagnostic(result) {
  return [
    result && result.stdout,
    result && result.stderr,
    result && result.error && result.error.message,
  ].filter(Boolean).join('\n');
}

function limitedDiagnostic(value) {
  return String(value || '')
    .split(/\r?\n/)
    .slice(0, 6)
    .join('\n')
    .slice(0, 2000);
}

function fileHash(filePath) {
  try {
    return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
  } catch (_error) {
    return null;
  }
}

module.exports = {
  generateSetupScenarioFingerprint,
  scenarioFingerprintFailure,
};
