#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const MANIFEST_VERSION = 'spec-test-browser-run-context/v1';
const AGENT_BROWSER_COMMAND = 'agent-browser';
const REQUIRED_HELP_MARKERS = [
  'open <url>',
  'snapshot',
  'get <what>',
  'console',
  'network <action>',
  'vitals [url]',
  'set <setting> [value]',
  'viewport <w> <h>',
  'screenshot [path]',
  'close',
  '--session <name>',
  '--namespace <name>',
  '--config <path>',
  '--content-boundaries',
  '--max-output <chars>',
  '--allowed-domains <list>',
  '--action-policy <path>',
  '--screenshot-dir <path>',
  '--json',
];
const ALLOWED_ACTIONS = new Set([
  'open',
  'snapshot',
  'get',
  'console',
  'network-metadata',
  'vitals',
  'viewport',
  'a11y',
  'screenshot-private',
  'click',
  'fill',
  'type',
  'press',
  'select',
]);
const NAVIGATION_OR_INTERACTION_ACTIONS = new Set([
  'open',
  'click',
  'fill',
  'type',
  'press',
  'select',
]);
const PAGE_CONTEXT_ACTIONS = new Set([
  'snapshot',
  'get',
  'console',
  'network-metadata',
  'a11y',
  'screenshot-private',
  'click',
  'fill',
  'type',
  'press',
  'select',
]);
const LOCATOR_ACTIONS = new Set(['click', 'fill', 'type', 'select']);
const SYNTHETIC_ACTIONS = new Set(['fill', 'type', 'select']);
const LOCATOR_KINDS = new Set(['ref', 'role', 'label', 'testid', 'text']);
const SYNTHETIC_VALUE_KINDS = new Set(['email', 'name', 'search', 'numeric', 'option']);
const PRESS_KEYS = new Set(['Enter', 'Tab', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);
const GET_PROPERTIES = new Set(['text', 'value', 'title', 'url', 'count']);
const VIEWPORT_PRESETS = {
  desktop: [1440, 900],
  mobile: [390, 844],
};
const AMBIENT_ENV_KEYS = new Set([
  'HTTP_PROXY',
  'HTTPS_PROXY',
  'ALL_PROXY',
  'NO_PROXY',
]);

function sha256(value) {
  return `sha256:${crypto.createHash('sha256').update(value).digest('hex')}`;
}

function defaultRunner(command, args, options = {}) {
  const invocation = resolveRunnerInvocation(command, args, options);
  if (!invocation.ok) {
    return {
      status: null,
      stdout: '',
      stderr: '',
      error: new Error(invocation.reason_code),
    };
  }
  return spawnSync(invocation.command, invocation.args, {
    cwd: options.cwd,
    env: options.env,
    encoding: 'utf8',
    shell: false,
    timeout: options.timeout || 30000,
    windowsHide: true,
  });
}

function resolveRunnerInvocation(command, args, options = {}) {
  const platform = options.platform || process.platform;
  if (platform !== 'win32' || !isAgentBrowserCommand(command)) {
    return { ok: true, command, args };
  }
  const executable = resolveWindowsAgentBrowserExecutable(command, options);
  return executable
    ? { ok: true, command: executable, args }
    : { ok: false, reason_code: 'agent-browser-native-executable-unavailable' };
}

function resolveWindowsAgentBrowserExecutable(command, options = {}) {
  const env = options.env || process.env;
  const effectiveArch = (options.arch || process.arch) === 'arm64' ? 'x64' : (options.arch || process.arch);
  const binaryName = `agent-browser-win32-${effectiveArch}.exe`;
  const candidates = [];
  if (typeof command === 'string' && command.toLowerCase().endsWith('.exe')) candidates.push(command);
  if (typeof command === 'string' && (path.isAbsolute(command) || command.includes('/') || command.includes('\\'))) {
    const commandDir = path.dirname(command);
    candidates.push(
      path.join(commandDir, 'agent-browser.exe'),
      path.join(commandDir, 'node_modules', 'agent-browser', 'bin', binaryName),
      path.resolve(commandDir, '..', 'agent-browser', 'bin', binaryName),
    );
  }
  const pathValue = env.PATH || env.Path || env.path || '';
  for (const entry of pathValue.split(path.delimiter).filter(Boolean)) {
    const directory = entry.replace(/^"|"$/g, '');
    candidates.push(
      path.join(directory, 'agent-browser.exe'),
      path.join(directory, 'node_modules', 'agent-browser', 'bin', binaryName),
      path.resolve(directory, '..', 'agent-browser', 'bin', binaryName),
    );
  }
  for (const candidate of candidates) {
    try {
      if (fs.statSync(candidate).isFile()) return fs.realpathSync.native(candidate);
    } catch (_error) {
      // 继续检查下一个无 shell native binary 候选。
    }
  }
  return null;
}

function isAgentBrowserCommand(command) {
  if (typeof command !== 'string') return false;
  return ['agent-browser', 'agent-browser.cmd', 'agent-browser.exe']
    .includes(path.basename(command).toLowerCase());
}

function buildCapabilities(options = {}) {
  return {
    required_flags: options.requiredFlags === true,
    exact_origin_advertised: options.exactOriginAdvertised === true,
    exact_origin_confirmed: false,
    exact_origin_evidence: options.exactOriginEvidence || 'none',
    profile_state_with_allowlist: false,
  };
}

function buildBlockedProbe(options = {}) {
  return {
    status: options.status || 'not_supported',
    execution_readiness: 'blocked',
    reason_code: options.reasonCode || 'agent-browser-unavailable',
    conformance_status: 'not_run',
    repair_scope: options.repairScope || 'dependency',
    next_action: options.nextAction || '',
    version: options.version || null,
    capabilities: options.capabilities || buildCapabilities(),
    missing: options.missing || [],
  };
}

function probeAgentBrowser(options = {}) {
  const runner = options.runner || defaultRunner;
  const command = options.command || AGENT_BROWSER_COMMAND;
  const versionResult = runner(command, ['--version'], {
    cwd: options.cwd || process.cwd(),
    env: buildCleanEnv(options.env || process.env),
    timeout: 10000,
  });
  if (!processSucceeded(versionResult)) {
    return buildBlockedProbe({
      reasonCode: 'agent-browser-unavailable',
      repairScope: 'dependency',
      nextAction: '安装或修复 agent-browser CLI 后重新运行 probe。',
      missing: ['agent-browser'],
    });
  }

  const helpResult = runner(command, ['--help'], {
    cwd: options.cwd || process.cwd(),
    env: buildCleanEnv(options.env || process.env),
    timeout: 10000,
  });
  if (!processSucceeded(helpResult)) {
    return buildBlockedProbe({
      reasonCode: 'agent-browser-help-unavailable',
      repairScope: 'provider',
      nextAction: '检查当前 agent-browser release 为何无法返回 CLI help；未恢复前保持 browser execution blocked。',
      version: parseVersion(versionResult.stdout),
      missing: ['--help'],
    });
  }

  const help = String(helpResult.stdout || '');
  const version = parseVersion(versionResult.stdout);
  const missing = REQUIRED_HELP_MARKERS
    .filter((marker) => !help.includes(marker))
    .map((marker) => marker.startsWith('--') ? marker.split(/\s+/, 1)[0] : marker);
  const exactOriginAdvertised = /(?:^|[^A-Za-z0-9_-])--exact-origin(?=$|[^A-Za-z0-9_-])/m.test(help);
  if (missing.length > 0) {
    return buildBlockedProbe({
      reasonCode: 'required-agent-browser-capability-missing',
      repairScope: 'provider',
      nextAction: '采用包含所有 required CLI markers 的 agent-browser release；不要绕过 wrapper gate。',
      version,
      missing,
    });
  }

  if (!exactOriginAdvertised) {
    return buildBlockedProbe({
      status: 'available',
      reasonCode: 'exact-origin-capability-unavailable',
      repairScope: 'provider',
      nextAction: '等待或采用支持 request-time exact-origin 的 agent-browser release 或经批准受控 fork；不要用 --allowed-domains 替代。',
      version,
      capabilities: buildCapabilities({ requiredFlags: true }),
      missing: ['request-time exact-origin'],
    });
  }

  return buildBlockedProbe({
    status: 'available',
    reasonCode: 'exact-origin-conformance-required',
    repairScope: 'spec-first',
    nextAction: '实现并通过 Spec-First controlled exact-origin conformance 后才能放行；当前保持 browser execution blocked。',
    version,
    capabilities: buildCapabilities({
      requiredFlags: true,
      exactOriginAdvertised: true,
      exactOriginEvidence: 'help-marker',
    }),
    missing: ['spec-first controlled exact-origin conformance'],
  });
}

function parseVersion(output) {
  const match = String(output || '').match(/agent-browser\s+([0-9]+(?:\.[0-9]+){1,3})/i);
  return match ? match[1] : null;
}

function validateTestPlan(testPlan) {
  if (!isPlainObject(testPlan)) return invalid('test-plan-invalid');
  const topLevel = validateKeys(testPlan, ['target_origin', 'routes', 'steps']);
  if (!topLevel.ok) return topLevel;

  const targetOrigin = parseExactOrigin(testPlan.target_origin);
  if (!targetOrigin) return invalid('test-plan-target-origin-invalid');
  if (!Array.isArray(testPlan.routes) || testPlan.routes.length === 0) {
    return invalid('test-plan-routes-invalid');
  }

  const routes = [];
  const seenRoutes = new Set();
  for (const route of testPlan.routes) {
    const normalized = validateRoute(route, targetOrigin.origin);
    if (!normalized || seenRoutes.has(normalized)) return invalid('test-plan-route-invalid');
    seenRoutes.add(normalized);
    routes.push(normalized);
  }

  if (!Array.isArray(testPlan.steps) || testPlan.steps.length === 0) {
    return invalid('test-plan-steps-invalid');
  }

  for (let index = 0; index < testPlan.steps.length; index += 1) {
    const result = validateStep(testPlan.steps[index], routes);
    if (!result.ok) return { ...result, step_index: index };
  }
  const firstOpenIndex = testPlan.steps.findIndex((step) => step.action === 'open');
  if (firstOpenIndex < 0) return invalid('test-plan-open-required');
  for (let index = 0; index < firstOpenIndex; index += 1) {
    if (PAGE_CONTEXT_ACTIONS.has(testPlan.steps[index].action)) {
      return { ...invalid('test-plan-page-context-before-open'), step_index: index };
    }
  }

  return {
    ok: true,
    target_origin: targetOrigin.origin,
    allowed_domain: targetOrigin.hostname,
    routes,
    steps: testPlan.steps,
  };
}

function validateStep(step, routes) {
  if (!isPlainObject(step) || typeof step.action !== 'string') return invalid('test-plan-step-invalid');
  if (!ALLOWED_ACTIONS.has(step.action)) return invalid('test-plan-action-not-allowed');
  for (const forbidden of ['argv', 'url', 'value', 'literal', 'credential', 'credentials', 'password', 'username', 'script']) {
    if (Object.prototype.hasOwnProperty.call(step, forbidden)) {
      return invalid('test-plan-caller-literal-forbidden');
    }
  }

  if (step.action === 'open') {
    const keys = validateKeys(step, ['action', 'route']);
    if (!keys.ok) return keys;
    return routes.includes(step.route) ? { ok: true } : invalid('test-plan-route-not-allowed');
  }

  if (LOCATOR_ACTIONS.has(step.action)) {
    const allowedKeys = SYNTHETIC_ACTIONS.has(step.action)
      ? ['action', 'locator', 'synthetic_value']
      : ['action', 'locator'];
    const keys = validateKeys(step, allowedKeys);
    if (!keys.ok) return keys;
    const locator = validateLocator(step.locator);
    if (!locator.ok) return locator;
    if (SYNTHETIC_ACTIONS.has(step.action) && !SYNTHETIC_VALUE_KINDS.has(step.synthetic_value)) {
      return invalid('test-plan-synthetic-value-invalid');
    }
    return { ok: true };
  }

  if (step.action === 'press') {
    const keys = validateKeys(step, ['action', 'key']);
    if (!keys.ok) return keys;
    return PRESS_KEYS.has(step.key) ? { ok: true } : invalid('test-plan-key-not-allowed');
  }

  if (step.action === 'snapshot' || step.action === 'a11y') {
    const keys = validateKeys(step, ['action', 'interactive']);
    if (!keys.ok) return keys;
    return step.interactive === undefined || typeof step.interactive === 'boolean'
      ? { ok: true }
      : invalid('test-plan-step-invalid');
  }

  if (step.action === 'get') {
    const keys = validateKeys(step, ['action', 'property', 'locator']);
    if (!keys.ok) return keys;
    if (!GET_PROPERTIES.has(step.property)) return invalid('test-plan-get-property-invalid');
    if (['title', 'url'].includes(step.property)) {
      return step.locator === undefined ? { ok: true } : invalid('test-plan-locator-invalid');
    }
    if (!isPlainObject(step.locator) || step.locator.kind !== 'ref') {
      return invalid('test-plan-get-locator-not-supported');
    }
    return validateLocator(step.locator);
  }

  if (step.action === 'vitals') {
    const keys = validateKeys(step, ['action', 'route']);
    if (!keys.ok) return keys;
    return routes.includes(step.route) ? { ok: true } : invalid('test-plan-route-not-allowed');
  }

  if (step.action === 'viewport') {
    const keys = validateKeys(step, ['action', 'preset']);
    if (!keys.ok) return keys;
    return Object.prototype.hasOwnProperty.call(VIEWPORT_PRESETS, step.preset)
      ? { ok: true }
      : invalid('test-plan-viewport-invalid');
  }

  if (step.action === 'screenshot-private') {
    const keys = validateKeys(step, ['action', 'name', 'full']);
    if (!keys.ok) return keys;
    if (typeof step.name !== 'string' || !/^[a-z0-9][a-z0-9._-]{0,79}$/i.test(step.name)) {
      return invalid('test-plan-screenshot-name-invalid');
    }
    return step.full === undefined || typeof step.full === 'boolean'
      ? { ok: true }
      : invalid('test-plan-step-invalid');
  }

  const keys = validateKeys(step, ['action']);
  return keys.ok ? { ok: true } : keys;
}

function validateLocator(locator) {
  if (!isPlainObject(locator)) return invalid('test-plan-locator-invalid');
  const keys = validateKeys(locator, ['kind', 'value']);
  if (!keys.ok || !LOCATOR_KINDS.has(locator.kind) || typeof locator.value !== 'string') {
    return invalid('test-plan-locator-invalid');
  }
  if (locator.kind === 'ref') {
    return /^@e[1-9][0-9]*$/.test(locator.value)
      ? { ok: true }
      : invalid('test-plan-locator-invalid');
  }
  if (locator.value.length < 1 || locator.value.length > 200 || /[\r\n\0]/.test(locator.value)) {
    return invalid('test-plan-locator-invalid');
  }
  return { ok: true };
}

function validateKeys(value, allowedKeys) {
  const allowed = new Set(allowedKeys);
  const unexpected = Object.keys(value).filter((key) => !allowed.has(key));
  return unexpected.length === 0
    ? { ok: true }
    : { ok: false, reason_code: 'test-plan-field-not-allowed', fields: unexpected };
}

function parseExactOrigin(value) {
  if (typeof value !== 'string') return null;
  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    if (parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) return null;
    if (value !== parsed.origin) return null;
    if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(parsed.hostname.toLowerCase())) return null;
    return parsed;
  } catch (_error) {
    return null;
  }
}

function validateRoute(value, origin) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return null;
  if (value.includes('?') || value.includes('#') || value.includes('\\') || value.includes('\0')) return null;
  try {
    const parsed = new URL(value, origin);
    if (parsed.origin !== origin || parsed.search || parsed.hash || parsed.pathname !== value) return null;
    return parsed.pathname;
  } catch (_error) {
    return null;
  }
}

function prepareRunContext(options = {}) {
  const validation = validateTestPlan(options.testPlan);
  if (!validation.ok) return { status: 'not_run', ...validation };
  if (typeof options.runDir !== 'string' || options.runDir.trim() === '') {
    return { status: 'not_run', reason_code: 'private-run-directory-required' };
  }

  const runner = options.runner || defaultRunner;
  const privateDir = ensurePrivateDirectory(options.runDir, {
    runner,
    env: options.env || process.env,
    platform: options.platform || process.platform,
  });
  if (!privateDir.ok) return { status: 'not_run', reason_code: privateDir.reason_code };

  const runDir = privateDir.path;
  const rawDir = path.join(runDir, 'raw');
  const screenshotDir = path.join(runDir, 'screenshots');
  for (const directory of [rawDir, screenshotDir]) {
    const result = ensurePrivateDirectory(directory, {
      runner,
      env: options.env || process.env,
      platform: options.platform || process.platform,
    });
    if (!result.ok) return rollbackPreparedRunDirectory(runDir, result.reason_code, options);
  }

  const token = crypto.randomBytes(8).toString('hex');
  const session = `spec-test-browser-${token}`;
  const namespace = `spec-test-browser-${token}`;
  const syntheticSeed = token;
  const testPlanPath = path.join(runDir, 'test-plan.json');
  const configPath = path.join(runDir, 'agent-browser-config.json');
  const actionPolicyPath = path.join(runDir, 'action-policy.json');
  const manifestPath = path.join(runDir, 'run-context.json');

  try {
    const testPlanText = writePrivateJson(testPlanPath, options.testPlan, options);
    writePrivateJson(configPath, {}, options);
    writePrivateJson(actionPolicyPath, {
      default: 'deny',
      allow: [
        'open',
        'snapshot',
        'get',
        'console',
        'network',
        'vitals',
        'set',
        'screenshot',
        'click',
        'fill',
        'type',
        'press',
        'select',
        'find',
        'close',
      ],
    }, options);

    const manifest = {
      schema_version: MANIFEST_VERSION,
      status: 'prepared',
      run_dir: runDir,
      raw_dir: rawDir,
      screenshot_dir: screenshotDir,
      test_plan_path: testPlanPath,
      test_plan_sha256: sha256(testPlanText),
      config_path: configPath,
      action_policy_path: actionPolicyPath,
      target_origin: validation.target_origin,
      allowed_domain: validation.allowed_domain,
      session,
      namespace,
      synthetic_seed: syntheticSeed,
      exact_origin_capability: 'unconfirmed',
      profile_state_login: 'not_supported',
    };
    writePrivateJson(manifestPath, manifest, options);

    return {
      status: 'prepared',
      reason_code: null,
      run_dir: runDir,
      raw_dir: rawDir,
      screenshot_dir: screenshotDir,
      test_plan_path: testPlanPath,
      test_plan_sha256: manifest.test_plan_sha256,
      config_path: configPath,
      action_policy_path: actionPolicyPath,
      manifest_path: manifestPath,
      target_origin: manifest.target_origin,
      session,
      namespace,
    };
  } catch (error) {
    return rollbackPreparedRunDirectory(
      runDir,
      error.reason_code || 'private-run-file-write-failed',
      options,
    );
  }
}

function rollbackPreparedRunDirectory(runDir, originalReasonCode, options = {}) {
  const rmSync = options.rmSync || fs.rmSync;
  try {
    rmSync(runDir, { recursive: true, force: true });
    return {
      status: 'not_run',
      reason_code: originalReasonCode,
      rollback_status: 'completed',
    };
  } catch (_error) {
    return {
      status: 'not_run',
      reason_code: 'private-run-rollback-failed',
      original_reason_code: originalReasonCode,
      rollback_status: 'failed',
      run_dir: runDir,
    };
  }
}

function runPreparedContext(options = {}) {
  const manifestResult = readPreparedManifest(options.manifestPath, options);
  if (!manifestResult.ok) {
    return { status: 'not_run', reason_code: manifestResult.reason_code, action_process_calls: 0 };
  }
  const manifest = manifestResult.manifest;
  const initialPlan = readAndVerifyTestPlan(manifest);
  if (!initialPlan.ok) {
    return { status: 'not_run', reason_code: initialPlan.reason_code, action_process_calls: 0 };
  }

  const runner = options.runner || defaultRunner;
  const command = options.command || AGENT_BROWSER_COMMAND;
  const cwd = options.cwd || process.cwd();
  const env = options.env || process.env;
  const probeRunner = typeof options.probe === 'function' ? options.probe : probeAgentBrowser;
  const probe = probeRunner({ runner, command, cwd, env });
  if (probe.execution_readiness !== 'ready' || probe.capabilities.exact_origin_confirmed !== true) {
    return {
      status: 'not_supported',
      reason_code: probe.reason_code || 'exact-origin-capability-unavailable',
      action_process_calls: 0,
      blocked_actions: initialPlan.plan.steps
        .filter((step) => NAVIGATION_OR_INTERACTION_ACTIONS.has(step.action))
        .map((step) => step.action),
    };
  }

  const cleanEnv = buildCleanEnv(env);
  const steps = [];
  let actionProcessCalls = 0;

  for (let index = 0; index < initialPlan.plan.steps.length; index += 1) {
    const currentPlan = readAndVerifyTestPlan(manifest);
    if (!currentPlan.ok) {
      return {
        status: 'not_run',
        reason_code: currentPlan.reason_code,
        action_process_calls: actionProcessCalls,
        steps,
      };
    }

    const step = currentPlan.plan.steps[index];
    const actionArgs = buildActionArgs(step, manifest);
    if (!actionArgs.ok) {
      return {
        status: 'not_run',
        reason_code: actionArgs.reason_code,
        action_process_calls: actionProcessCalls,
        steps,
      };
    }

    const rawPath = path.join(manifest.raw_dir, `step-${String(index + 1).padStart(3, '0')}.json`);
    let rawReservation;
    try {
      rawReservation = reservePrivateJson(rawPath, options);
    } catch (error) {
      return {
        status: 'not_run',
        reason_code: error.reason_code || 'private-raw-output-write-failed',
        action_process_calls: actionProcessCalls,
        steps,
      };
    }

    const args = [...buildGlobalArgs(manifest), ...actionArgs.args];
    let result;
    try {
      result = runner(command, args, {
        cwd,
        env: cleanEnv,
        timeout: options.timeout || 30000,
      });
      actionProcessCalls += 1;
    } catch (_error) {
      discardPrivateJson(rawReservation);
      return {
        status: 'not_run',
        reason_code: 'agent-browser-action-failed',
        action_process_calls: actionProcessCalls,
        steps,
      };
    }

    try {
      writeReservedPrivateJson(rawReservation, {
        action: step.action,
        exit_code: normalizeExitCode(result),
        stdout: String(result && result.stdout || ''),
        stderr: String(result && result.stderr || ''),
        error: result && result.error ? String(result.error.message || result.error) : null,
      }, options);
    } catch (error) {
      return {
        status: 'not_run',
        reason_code: error.reason_code || 'private-raw-output-write-failed',
        action_process_calls: actionProcessCalls,
        steps,
      };
    }

    steps.push({
      index,
      action: step.action,
      status: processSucceeded(result) ? 'passed' : 'failed',
      exit_code: normalizeExitCode(result),
      raw_output_path: rawPath,
    });
    if (!processSucceeded(result)) {
      return {
        status: 'not_run',
        reason_code: 'agent-browser-action-failed',
        action_process_calls: actionProcessCalls,
        steps,
      };
    }
  }

  return {
    status: 'completed',
    reason_code: null,
    action_process_calls: actionProcessCalls,
    steps,
  };
}

function cleanupRunContext(options = {}) {
  const manifestResult = readPreparedManifest(options.manifestPath, options);
  if (!manifestResult.ok) return { status: 'not_run', reason_code: manifestResult.reason_code };
  const manifest = manifestResult.manifest;
  const runner = options.runner || defaultRunner;
  let result;
  try {
    result = runner(options.command || AGENT_BROWSER_COMMAND, [
      '--session', manifest.session,
      '--namespace', manifest.namespace,
      '--config', manifest.config_path,
      '--json',
      'close',
    ], {
      cwd: options.cwd || process.cwd(),
      env: buildCleanEnv(options.env || process.env),
      timeout: options.timeout || 30000,
    });
  } catch (error) {
    result = { status: null, stdout: '', stderr: '', error };
  }
  if (processSucceeded(result)) {
    return { status: 'completed', reason_code: null };
  }
  const rawPath = path.join(
    manifest.raw_dir,
    `cleanup-${crypto.randomBytes(4).toString('hex')}.json`,
  );
  let reservation;
  try {
    const reserveCleanupDiagnostic = options.reservePrivateJson || reservePrivateJson;
    reservation = reserveCleanupDiagnostic(rawPath, options);
    writeReservedPrivateJson(reservation, {
      exit_code: normalizeExitCode(result),
      stdout: String(result && result.stdout || ''),
      stderr: String(result && result.stderr || ''),
      error: result && result.error ? String(result.error.message || result.error) : null,
    });
  } catch (error) {
    return {
      status: 'not_run',
      reason_code: 'agent-browser-cleanup-failed',
      exit_code: normalizeExitCode(result),
      diagnostic_status: 'unavailable',
      diagnostic_reason_code: error.reason_code || 'private-raw-output-write-failed',
    };
  }
  return {
    status: 'not_run',
    reason_code: 'agent-browser-cleanup-failed',
    exit_code: normalizeExitCode(result),
    raw_output_path: rawPath,
  };
}

function buildGlobalArgs(manifest) {
  return [
    '--session', manifest.session,
    '--namespace', manifest.namespace,
    '--config', manifest.config_path,
    '--content-boundaries',
    '--max-output', '20000',
    '--allowed-domains', manifest.allowed_domain,
    '--exact-origin', manifest.target_origin,
    '--action-policy', manifest.action_policy_path,
    '--screenshot-dir', manifest.screenshot_dir,
    '--json',
  ];
}

function buildActionArgs(step, manifest) {
  if (step.action === 'open') return { ok: true, args: ['open', `${manifest.target_origin}${step.route === '/' ? '' : step.route}`] };
  if (step.action === 'snapshot') return { ok: true, args: ['snapshot', ...(step.interactive ? ['-i'] : [])] };
  if (step.action === 'a11y') return { ok: true, args: ['snapshot', ...(step.interactive === false ? [] : ['-i'])] };
  if (step.action === 'console') return { ok: true, args: ['console'] };
  if (step.action === 'network-metadata') return { ok: true, args: ['network', 'requests'] };
  if (step.action === 'vitals') return { ok: true, args: ['vitals', `${manifest.target_origin}${step.route === '/' ? '' : step.route}`] };
  if (step.action === 'viewport') {
    const [width, height] = VIEWPORT_PRESETS[step.preset];
    return { ok: true, args: ['set', 'viewport', String(width), String(height)] };
  }
  if (step.action === 'screenshot-private') {
    const screenshotPath = path.join(manifest.screenshot_dir, `${step.name}.png`);
    return { ok: true, args: ['screenshot', ...(step.full ? ['--full'] : []), screenshotPath] };
  }
  if (step.action === 'press') return { ok: true, args: ['press', step.key] };
  if (step.action === 'get') {
    return { ok: true, args: ['get', step.property, ...(step.locator ? [step.locator.value] : [])] };
  }
  if (LOCATOR_ACTIONS.has(step.action)) {
    const synthetic = SYNTHETIC_ACTIONS.has(step.action)
      ? generateSyntheticValue(step.synthetic_value, manifest.synthetic_seed)
      : null;
    if (step.locator.kind === 'ref') {
      return {
        ok: true,
        args: [step.action, step.locator.value, ...(synthetic === null ? [] : [synthetic])],
      };
    }
    return {
      ok: true,
      args: ['find', step.locator.kind, step.locator.value, step.action, ...(synthetic === null ? [] : [synthetic])],
    };
  }
  return { ok: false, reason_code: 'test-plan-action-not-allowed' };
}

function generateSyntheticValue(kind, seed) {
  const suffix = String(seed || '').slice(0, 12) || 'synthetic';
  if (kind === 'email') return `spec-first+${suffix}@example.test`;
  if (kind === 'name') return `Spec First ${suffix}`;
  if (kind === 'search') return `spec-first-${suffix}`;
  if (kind === 'numeric') return '42';
  if (kind === 'option') return `spec-first-option-${suffix}`;
  return '';
}

function readPreparedManifest(manifestPath, options = {}) {
  if (typeof manifestPath !== 'string' || manifestPath.trim() === '') {
    return { ok: false, reason_code: 'run-context-manifest-required' };
  }
  const manifestFile = inspectPrivateFile(manifestPath, options);
  if (!manifestFile.ok) return manifestFile;
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestFile.path, 'utf8'));
  } catch (_error) {
    return { ok: false, reason_code: 'run-context-manifest-invalid' };
  }
  if (!isPlainObject(manifest) || manifest.schema_version !== MANIFEST_VERSION) {
    return { ok: false, reason_code: 'run-context-manifest-invalid' };
  }
  const runDir = inspectPrivateDirectory(manifest.run_dir, options);
  if (!runDir.ok || path.dirname(manifestFile.path) !== runDir.path) {
    return { ok: false, reason_code: 'private-run-directory-untrusted' };
  }
  for (const filePath of [manifest.test_plan_path, manifest.config_path, manifest.action_policy_path]) {
    const inspected = inspectPrivateFile(filePath, options);
    if (!inspected.ok || !isInside(runDir.path, inspected.path)) {
      return { ok: false, reason_code: 'private-run-file-untrusted' };
    }
  }
  for (const dirPath of [manifest.raw_dir, manifest.screenshot_dir]) {
    const inspected = inspectPrivateDirectory(dirPath, options);
    if (!inspected.ok || !isInside(runDir.path, inspected.path)) {
      return { ok: false, reason_code: 'private-run-directory-untrusted' };
    }
  }
  return { ok: true, manifest, path: manifestFile.path };
}

function readAndVerifyTestPlan(manifest) {
  let text;
  try {
    text = fs.readFileSync(manifest.test_plan_path, 'utf8');
  } catch (_error) {
    return { ok: false, reason_code: 'test-plan-unreadable' };
  }
  if (sha256(text) !== manifest.test_plan_sha256) {
    return { ok: false, reason_code: 'test-plan-hash-mismatch' };
  }
  let plan;
  try {
    plan = JSON.parse(text);
  } catch (_error) {
    return { ok: false, reason_code: 'test-plan-invalid' };
  }
  const validation = validateTestPlan(plan);
  if (!validation.ok || validation.target_origin !== manifest.target_origin) {
    return { ok: false, reason_code: validation.reason_code || 'test-plan-invalid' };
  }
  return { ok: true, plan };
}

function ensurePrivateDirectory(dirPath, options = {}) {
  const resolved = path.resolve(dirPath);
  try {
    if (fs.existsSync(resolved)) {
      const existing = fs.lstatSync(resolved);
      if (existing.isSymbolicLink() || !existing.isDirectory()) {
        return { ok: false, reason_code: 'private-run-directory-untrusted' };
      }
      return { ok: false, reason_code: 'private-run-directory-must-be-new' };
    }
    const parent = path.dirname(resolved);
    if (!fs.existsSync(parent) || fs.lstatSync(parent).isSymbolicLink()) {
      return { ok: false, reason_code: 'private-run-directory-parent-untrusted' };
    }
    fs.mkdirSync(resolved, { mode: 0o700 });
    const hardened = hardenPath(resolved, true, options);
    if (!hardened.ok) {
      fs.rmSync(resolved, { recursive: true, force: true });
      return hardened;
    }
    return { ok: true, path: fs.realpathSync.native(resolved) };
  } catch (_error) {
    return { ok: false, reason_code: 'private-run-directory-untrusted' };
  }
}

function inspectPrivateDirectory(dirPath, options = {}) {
  if (typeof dirPath !== 'string' || !fs.existsSync(dirPath)) {
    return { ok: false, reason_code: 'private-run-directory-untrusted' };
  }
  try {
    const entry = fs.lstatSync(dirPath);
    if (entry.isSymbolicLink() || !entry.isDirectory()) {
      return { ok: false, reason_code: 'private-run-directory-untrusted' };
    }
    const hardened = hardenPath(dirPath, true, options);
    return hardened.ok
      ? { ok: true, path: fs.realpathSync.native(dirPath) }
      : hardened;
  } catch (_error) {
    return { ok: false, reason_code: 'private-run-directory-untrusted' };
  }
}

function inspectPrivateFile(filePath, options = {}) {
  if (typeof filePath !== 'string' || !fs.existsSync(filePath)) {
    return { ok: false, reason_code: 'private-run-file-untrusted' };
  }
  try {
    const entry = fs.lstatSync(filePath);
    if (entry.isSymbolicLink() || !entry.isFile()) {
      return { ok: false, reason_code: 'private-run-file-untrusted' };
    }
    const hardened = hardenPath(filePath, false, options);
    return hardened.ok
      ? { ok: true, path: fs.realpathSync.native(filePath) }
      : hardened;
  } catch (_error) {
    return { ok: false, reason_code: 'private-run-file-untrusted' };
  }
}

function hardenPath(targetPath, directory, options = {}) {
  const platform = options.platform || process.platform;
  if (platform === 'win32') {
    const runner = options.runner || defaultRunner;
    const identity = os.userInfo().username;
    if (!identity) return { ok: false, reason_code: 'private-path-owner-unavailable' };
    const grant = directory ? `${identity}:(OI)(CI)F` : `${identity}:F`;
    const result = runner('icacls', [targetPath, '/inheritance:r', '/grant:r', grant], {
      cwd: path.dirname(targetPath),
      env: options.env || process.env,
      timeout: 10000,
    });
    return processSucceeded(result)
      ? { ok: true }
      : { ok: false, reason_code: 'private-path-permission-hardening-failed' };
  }

  try {
    fs.chmodSync(targetPath, directory ? 0o700 : 0o600);
    const stat = fs.statSync(targetPath);
    if (typeof process.getuid === 'function' && stat.uid !== process.getuid()) {
      return { ok: false, reason_code: 'private-path-owner-mismatch' };
    }
    const expected = directory ? 0o700 : 0o600;
    return (stat.mode & 0o777) === expected
      ? { ok: true }
      : { ok: false, reason_code: 'private-path-permission-hardening-failed' };
  } catch (_error) {
    return { ok: false, reason_code: 'private-path-permission-hardening-failed' };
  }
}

function writePrivateJson(filePath, value, options = {}) {
  const reservation = reservePrivateJson(filePath, options);
  return writeReservedPrivateJson(reservation, value);
}

function reservePrivateJson(filePath, options = {}) {
  const parent = inspectPrivateDirectory(path.dirname(filePath), options);
  if (!parent.ok) {
    const error = new Error(parent.reason_code);
    error.reason_code = parent.reason_code;
    throw error;
  }
  const resolved = path.resolve(filePath);
  if (!isInside(parent.path, resolved)) {
    const error = new Error('private-run-file-collision');
    error.reason_code = 'private-run-file-collision';
    throw error;
  }
  let descriptor;
  try {
    descriptor = fs.openSync(resolved, 'wx', 0o600);
  } catch (cause) {
    const error = new Error(cause && cause.code === 'EEXIST'
      ? 'private-run-file-collision'
      : 'private-run-file-write-failed');
    error.reason_code = error.message;
    throw error;
  }
  const hardened = hardenPath(resolved, false, options);
  if (!hardened.ok) {
    fs.closeSync(descriptor);
    fs.rmSync(resolved, { force: true });
    const error = new Error(hardened.reason_code);
    error.reason_code = hardened.reason_code;
    throw error;
  }
  return { descriptor, path: resolved };
}

function writeReservedPrivateJson(reservation, value) {
  let text;
  try {
    text = `${JSON.stringify(value, null, 2)}\n`;
    fs.writeFileSync(reservation.descriptor, text, 'utf8');
    fs.fsyncSync(reservation.descriptor);
  } catch (_error) {
    discardPrivateJson(reservation);
    const error = new Error('private-run-file-write-failed');
    error.reason_code = 'private-run-file-write-failed';
    throw error;
  }
  fs.closeSync(reservation.descriptor);
  return text;
}

function discardPrivateJson(reservation) {
  let ok = true;
  try {
    fs.closeSync(reservation.descriptor);
  } catch (_error) {
    // 子进程或写入失败后的尽力清理。
    ok = false;
  }
  try {
    fs.rmSync(reservation.path, { force: true });
  } catch (_error) {
    ok = false;
  }
  return { ok };
}

function buildCleanEnv(env) {
  const clean = {};
  for (const [key, value] of Object.entries(env || {})) {
    const upper = key.toUpperCase();
    if (upper.startsWith('AGENT_BROWSER_') || AMBIENT_ENV_KEYS.has(upper)) continue;
    clean[key] = value;
  }
  return clean;
}

function processSucceeded(result) {
  return Boolean(result) && !result.error && result.status === 0;
}

function normalizeExitCode(result) {
  return result && Number.isInteger(result.status) ? result.status : 1;
}

function isInside(parent, child) {
  const relative = path.relative(path.resolve(parent), path.resolve(child));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function invalid(reasonCode) {
  return { ok: false, reason_code: reasonCode };
}

function parseCliArgs(argv) {
  const command = argv[0] || '';
  const options = {};
  for (let index = 1; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--plan') options.planPath = argv[++index];
    else if (arg === '--run-dir') options.runDir = argv[++index];
    else if (arg === '--manifest') options.manifestPath = argv[++index];
    else return { ok: false, reason_code: 'argument-not-supported' };
  }
  return { ok: true, command, options };
}

function main(argv = process.argv.slice(2)) {
  const parsed = parseCliArgs(argv);
  if (!parsed.ok) {
    process.stdout.write(`${JSON.stringify({ status: 'not_run', reason_code: parsed.reason_code })}\n`);
    return 1;
  }
  let result;
  if (parsed.command === 'probe') {
    result = probeAgentBrowser();
  } else if (parsed.command === 'prepare') {
    if (!parsed.options.planPath || !parsed.options.runDir) {
      result = { status: 'not_run', reason_code: 'prepare-arguments-required' };
    } else {
      try {
        const testPlan = JSON.parse(fs.readFileSync(parsed.options.planPath, 'utf8'));
        result = prepareRunContext({ testPlan, runDir: parsed.options.runDir });
      } catch (_error) {
        result = { status: 'not_run', reason_code: 'test-plan-unreadable' };
      }
    }
  } else if (parsed.command === 'run') {
    result = runPreparedContext({ manifestPath: parsed.options.manifestPath });
  } else if (parsed.command === 'cleanup') {
    result = cleanupRunContext({ manifestPath: parsed.options.manifestPath });
  } else {
    result = { status: 'not_run', reason_code: 'command-not-supported' };
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return ['prepared', 'available', 'completed', 'not_supported'].includes(result.status) ? 0 : 1;
}

if (require.main === module) process.exitCode = main();

module.exports = {
  ALLOWED_ACTIONS,
  buildCleanEnv,
  cleanupRunContext,
  main,
  prepareRunContext,
  probeAgentBrowser,
  resolveRunnerInvocation,
  resolveWindowsAgentBrowserExecutable,
  runPreparedContext,
  validateTestPlan,
};
