'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const wrapper = require('../../skills/spec-test-browser/scripts/agent-browser-run-context.cjs');
const skillSource = fs.readFileSync(
  path.resolve(__dirname, '../../skills/spec-test-browser/SKILL.md'),
  'utf8',
);
const pipelineSource = fs.readFileSync(
  path.resolve(__dirname, '../../skills/spec-test-browser/references/pipeline-orchestration.md'),
  'utf8',
);
const lfgSource = fs.readFileSync(
  path.resolve(__dirname, '../../skills/spec-lfg/SKILL.md'),
  'utf8',
);
const testSuiteSource = fs.readFileSync(
  path.resolve(__dirname, '../../scripts/run-test-suite.cjs'),
  'utf8',
);
const CONFIRMED_BINARY_IDENTITY = wrapper.resolveBinaryIdentity(process.execPath);

const tempRoots = [];

afterEach(() => {
  for (const root of tempRoots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

function tempRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-test-browser-contract-'));
  tempRoots.push(root);
  return root;
}

function testPlan(steps = [
  { action: 'open', route: '/settings' },
  { action: 'snapshot', interactive: true },
]) {
  return {
    target_origin: 'http://127.0.0.1:4173',
    routes: ['/', '/settings'],
    steps,
  };
}

function stepForUnavailableExactOrigin(action) {
  if (action === 'open') return { action, route: '/settings' };
  if (action === 'press') return { action, key: 'Enter' };
  if (['fill', 'type', 'select'].includes(action)) {
    return {
      action,
      locator: { kind: 'ref', value: '@e1' },
      synthetic_value: action === 'select' ? 'option' : 'email',
    };
  }
  return { action, locator: { kind: 'ref', value: '@e1' } };
}

function pageContextStep(action) {
  if (action === 'get') return { action, property: 'title' };
  if (action === 'press') return { action, key: 'Enter' };
  if (['fill', 'type', 'select'].includes(action)) {
    return {
      action,
      locator: { kind: 'ref', value: '@e1' },
      synthetic_value: action === 'select' ? 'option' : 'email',
    };
  }
  if (action === 'screenshot-private') return { action, name: 'page-context', full: false };
  if (action === 'a11y') return { action, interactive: true };
  if (action === 'click') return { action, locator: { kind: 'ref', value: '@e1' } };
  return { action };
}

function helpText(options = {}) {
  const exactOrigin = options.exactOrigin
    ? `\n  ${options.exactOriginMarker || '--exact-origin <origin>'}`
    : '';
  return [
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
    exactOrigin,
  ].join('\n');
}

function probeRunner(options = {}) {
  const help = options.help || helpText({
    exactOrigin: options.exactOrigin === true,
    exactOriginMarker: options.exactOriginMarker,
  });
  return (_command, args) => {
    if (Array.isArray(options.calls)) options.calls.push([...args]);
    if (args.includes('--version')) {
      return { status: 0, stdout: 'agent-browser 0.31.1\n', stderr: '', error: null };
    }
    return { status: 0, stdout: help, stderr: '', error: null };
  };
}

function actionCalls(calls) {
  return calls.filter((call) => (
    !call.args.includes('--version')
    && !call.args.includes('--help')
  ));
}

function browserRunner(calls, options = {}) {
  const help = helpText({ exactOrigin: options.exactOrigin === true });
  return (command, args, runnerOptions) => {
    calls.push({ command, args, options: runnerOptions });
    if (args.includes('--version')) {
      return { status: 0, stdout: 'agent-browser 0.31.1\n', stderr: '', error: null };
    }
    if (args.includes('--help')) {
      return { status: 0, stdout: help, stderr: '', error: null };
    }
    if (typeof options.onAction === 'function') options.onAction({ command, args, options: runnerOptions });
    return { status: 0, stdout: options.stdout || '', stderr: '', error: null };
  };
}

function confirmedConformanceProbe() {
  return {
    status: 'available',
    execution_readiness: 'ready',
    reason_code: null,
    conformance_status: 'passed',
    repair_scope: 'none',
    next_action: '',
    binary_identity: CONFIRMED_BINARY_IDENTITY,
    capabilities: {
      required_flags: true,
      exact_origin_advertised: true,
      exact_origin_confirmed: true,
      exact_origin_evidence: 'spec-first-conformance',
      profile_state_with_allowlist: false,
    },
    missing: [],
  };
}

function binaryIdentity(sha = 'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa') {
  return {
    path: '/opt/spec-first/agent-browser',
    sha256: sha,
    size: 1024,
  };
}

function passedConformance(identity = binaryIdentity()) {
  return {
    status: 0,
    stdout: JSON.stringify({
      schema_version: 'agent-browser-exact-origin-conformance/v1',
      status: 'passed',
      binary_identity: identity,
      positive_control: { status: 'passed' },
      blocked_origin_total_hits: 0,
      cases: [
        'initial-open-and-frame',
        'same-origin-redirect',
        'cross-origin-redirect',
        'same-origin-link',
        'cross-origin-link',
        'cross-origin-form',
        'cross-origin-script',
        'cross-origin-popup',
        'cross-origin-direct-open',
      ].map((name) => ({ name, status: 'passed' })),
    }),
    stderr: '',
    error: null,
  };
}

function failedConformance() {
  return {
    status: 1,
    stdout: JSON.stringify({ status: 'failed' }),
    stderr: '',
    error: null,
  };
}

function prepare(plan = testPlan()) {
  const root = tempRoot();
  const runDir = path.join(root, 'run');
  const result = wrapper.prepareRunContext({ testPlan: plan, runDir });
  expect(result.status).toBe('prepared');
  return result;
}

test('probe reports blocked readiness when exact-origin is absent and does not upgrade domain allowlisting', () => {
  const result = wrapper.probeAgentBrowser({ runner: probeRunner() });

  expect(result.status).toBe('available');
  expect(result.execution_readiness).toBe('blocked');
  expect(result.version).toBe('0.31.1');
  expect(result.capabilities.required_flags).toBe(true);
  expect(result.capabilities.exact_origin_advertised).toBe(false);
  expect(result.capabilities.exact_origin_confirmed).toBe(false);
  expect(result.capabilities.exact_origin_evidence).toBe('none');
  expect(result.reason_code).toBe('exact-origin-capability-unavailable');
  expect(result.conformance_status).toBe('not_run');
  expect(result.repair_scope).toBe('provider');
  expect(result.next_action).toContain('request-time exact-origin');

  const missing = wrapper.probeAgentBrowser({ runner: probeRunner({ help: 'open <url>\n--session <name>' }) });
  expect(missing.status).toBe('not_supported');
  expect(missing.reason_code).toBe('required-agent-browser-capability-missing');
  expect(missing.missing).toContain('--allowed-domains');
});

test('probe does not treat a help marker as proof of request-time enforcement', () => {
  const calls = [];
  const result = wrapper.probeAgentBrowser({
    runner: probeRunner({ exactOrigin: true, calls }),
    binaryIdentityResolver: () => binaryIdentity(),
    conformanceRunner: () => ({
      status: 1,
      stdout: JSON.stringify({ status: 'failed' }),
      stderr: '',
      error: null,
    }),
  });

  expect(result).toMatchObject({
    status: 'available',
    execution_readiness: 'blocked',
    reason_code: 'exact-origin-conformance-failed',
    conformance_status: 'failed',
    repair_scope: 'spec-first',
  });
  expect(result.capabilities).toMatchObject({
    exact_origin_advertised: true,
    exact_origin_confirmed: false,
    exact_origin_evidence: 'help-marker',
  });
  expect(calls).toEqual([['--version'], ['--help']]);
});

test('probe becomes ready only after controlled conformance passes for the resolved binary identity', () => {
  const identity = binaryIdentity();
  const result = wrapper.probeAgentBrowser({
    runner: probeRunner({ exactOrigin: true }),
    binaryIdentityResolver: () => identity,
    conformanceRunner: () => passedConformance(identity),
  });

  expect(result).toMatchObject({
    status: 'available',
    execution_readiness: 'ready',
    reason_code: null,
    conformance_status: 'passed',
    repair_scope: 'none',
    binary_identity: identity,
    capabilities: {
      exact_origin_advertised: true,
      exact_origin_confirmed: true,
      exact_origin_evidence: 'spec-first-conformance',
    },
  });
});

test('probe rejects false-green conformance when the positive control did not pass', () => {
  const identity = binaryIdentity();
  const conformance = passedConformance(identity);
  const payload = JSON.parse(conformance.stdout);
  payload.positive_control.status = 'failed';
  conformance.stdout = JSON.stringify(payload);

  const result = wrapper.probeAgentBrowser({
    runner: probeRunner({ exactOrigin: true }),
    binaryIdentityResolver: () => identity,
    conformanceRunner: () => conformance,
  });

  expect(result).toMatchObject({
    execution_readiness: 'blocked',
    reason_code: 'exact-origin-conformance-invalid',
    conformance_status: 'failed',
  });
  expect(result.capabilities.exact_origin_confirmed).toBe(false);
});

test.each([
  ['throws', () => { throw new Error('spawn failed'); }, 'exact-origin-conformance-error'],
  ['times out', () => ({ status: null, stdout: '', stderr: '', error: Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' }) }), 'exact-origin-conformance-timeout'],
  ['returns malformed JSON', () => ({ status: 0, stdout: '{', stderr: '', error: null }), 'exact-origin-conformance-invalid'],
])('probe fails closed when controlled conformance %s', (_label, conformanceRunner, reasonCode) => {
  const result = wrapper.probeAgentBrowser({
    runner: probeRunner({ exactOrigin: true }),
    binaryIdentityResolver: () => binaryIdentity(),
    conformanceRunner,
  });

  expect(result).toMatchObject({
    execution_readiness: 'blocked',
    reason_code: reasonCode,
    conformance_status: 'failed',
  });
  expect(result.capabilities.exact_origin_confirmed).toBe(false);
});

test('probe reruns conformance when the resolved binary identity changes', () => {
  const identities = [
    binaryIdentity('sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
    binaryIdentity('sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'),
  ];
  const observed = [];
  let identityIndex = 0;

  const options = {
    runner: probeRunner({ exactOrigin: true }),
    binaryIdentityResolver: () => identities[identityIndex],
    conformanceRunner: ({ binaryIdentity: identity }) => {
      observed.push(identity.sha256);
      return passedConformance(identity);
    },
  };

  expect(wrapper.probeAgentBrowser(options).execution_readiness).toBe('ready');
  identityIndex = 1;
  expect(wrapper.probeAgentBrowser(options).execution_readiness).toBe('ready');
  expect(observed).toEqual([identities[0].sha256, identities[1].sha256]);
});

test.each([
  '--exact-origin <URL>',
  '--exact-origin=<origin>',
  '--exact-origin',
])('probe recognizes the exact-origin flag token independent of help metavar shape: %s', (marker) => {
  const result = wrapper.probeAgentBrowser({
    runner: probeRunner({ exactOrigin: true, exactOriginMarker: marker }),
    binaryIdentityResolver: () => binaryIdentity(),
    conformanceRunner: failedConformance,
  });

  expect(result).toMatchObject({
    execution_readiness: 'blocked',
    reason_code: 'exact-origin-conformance-failed',
    conformance_status: 'failed',
    repair_scope: 'spec-first',
  });
  expect(result.capabilities.exact_origin_advertised).toBe(true);
  expect(result.capabilities.exact_origin_confirmed).toBe(false);
});

test('probe ignores provider or caller capability claims and never invokes a capabilities command', () => {
  const calls = [];
  const result = wrapper.probeAgentBrowser({
    runner: probeRunner({ exactOrigin: true, calls }),
    providerCapabilities: {
      schema_version: 'agent-browser-capabilities/v1',
      capabilities: { exact_origin: { status: 'enforced' } },
    },
    exactOriginConfirmed: true,
    binaryIdentityResolver: () => binaryIdentity(),
    conformanceRunner: failedConformance,
  });

  expect(result).toMatchObject({
    status: 'available',
    execution_readiness: 'blocked',
    reason_code: 'exact-origin-conformance-failed',
    conformance_status: 'failed',
  });
  expect(result.capabilities).toMatchObject({
    exact_origin_advertised: true,
    exact_origin_confirmed: false,
    exact_origin_evidence: 'help-marker',
  });
  expect(calls).toEqual([['--version'], ['--help']]);
});

test('workflow keeps a caller-owned server boundary around the unique browser wrapper', () => {
  expect(skillSource).toContain('scripts/agent-browser-run-context.cjs');
  expect(skillSource).toContain('node "$SKILL_DIR/scripts/agent-browser-run-context.cjs" probe');
  expect(skillSource).toContain('execution_readiness: ready');
  expect(skillSource).not.toContain('`capabilities --json`');
  expect(skillSource).toContain('Spec-First controlled conformance');
  expect(skillSource).toContain('当前已加载的 `spec-test-browser/SKILL.md` 所在目录解析 `SKILL_DIR`');
  expect(skillSource).not.toContain('node skills/spec-test-browser/scripts/agent-browser-run-context.cjs');
  expect(skillSource).toContain('所有 browser subprocess 只能由唯一 wrapper');
  expect(skillSource).toContain('caller-owned server');
  expect(skillSource).toContain('第一个 browser `open`');
  expect(skillSource).toContain('browser-mutation-authorization-required');
  expect(skillSource).not.toContain('dev-server-run-context.cjs');
  expect(skillSource).not.toContain('browser_runtime_profile_path');
  expect(skillSource).not.toContain('--server-command-approved');
  expect(skillSource).not.toContain('server-runtime-worktree-drift');
  expect(skillSource).toContain('已有目录一律 `not_run`');
  expect(skillSource).toContain('调用方传入的 capability 声明不能代替该 probe');
  expect(skillSource).not.toMatch(/^agent-browser\s/m);
  expect(pipelineSource).toContain('caller-owned server');
  expect(pipelineSource).toContain('target-origin-missing');
  expect(pipelineSource).toContain('browser-mutation-authorization-required');
  expect(pipelineSource).toContain('node "$SKILL_DIR/scripts/agent-browser-run-context.cjs" probe');
  expect(pipelineSource).not.toContain('Project-Local Runtime Authorization');
  expect(pipelineSource).not.toContain('dev-server-run-context.cjs');
});

test('retires managed-server and runtime-profile surfaces without a compatibility layer', () => {
  for (const relativePath of [
    'skills/spec-test-browser/scripts/dev-server-run-context.cjs',
    'skills/spec-test-browser/references/browser-runtime-profile.schema.json',
    'skills/spec-test-browser/references/browser-runtime-profile.example.json',
    'tests/unit/spec-test-browser-dev-server-context.test.js',
    'tests/unit/spec-test-browser-runtime-profile.test.js',
    'tests/integration/spec-test-browser-runtime.integration.test.js',
  ]) {
    expect(fs.existsSync(path.resolve(__dirname, '../..', relativePath))).toBe(false);
  }

  expect(testSuiteSource).not.toContain('spec-test-browser-runtime.integration.test.js');
  expect(testSuiteSource).not.toContain('dev-server-run-context.cjs');
});

test('parses an explicit target-origin override before resolving browser scope', () => {
  expect(lfgSource).toContain('mode:pipeline target-origin:<origin>');
  expect(skillSource).toContain('[target-origin:<origin>]');
  expect(skillSource).toContain('whitespace-delimited exact token `target-origin:<origin>`');
  expect(skillSource).toMatch(/先把这个 modifier 从 scope selector 中剥离，再解析 PR\/branch\/`current`/);
  expect(skillSource).toMatch(/空值、重复 token、多个 `target-origin:\*` token[\s\S]*`target-origin-invalid`/);
  expect(skillSource).toMatch(/credential、非根 path、query、fragment/);
  expect(skillSource).toContain('不得静默选择第一个、规范化或把非法 token 当 branch');
  expect(skillSource).toContain('loud convention');
  expect(skillSource).toContain('resolved scalar');
  expect(skillSource).toContain('不得从 redirect、page content、ambient browser state、free-port scan');
});

test('validates loopback origins, first-open ordering, routes, actions, locators, and synthetic values', () => {
  expect(wrapper.validateTestPlan(testPlan()).ok).toBe(true);
  expect(wrapper.validateTestPlan({ ...testPlan(), target_origin: 'http://localhost:4173' }).ok).toBe(true);
  expect(wrapper.validateTestPlan({ ...testPlan(), target_origin: 'http://[::1]:4173' }).ok).toBe(true);
  expect(wrapper.validateTestPlan({ ...testPlan(), target_origin: 'https://example.com' }).reason_code)
    .toBe('test-plan-target-origin-invalid');
  expect(wrapper.validateTestPlan({
    ...testPlan(),
    target_origin: 'http://127.0.0.1:4173/path',
  }).reason_code).toBe('test-plan-target-origin-invalid');
  expect(wrapper.validateTestPlan({
    ...testPlan(),
    routes: ['/settings?admin=true'],
  }).reason_code).toBe('test-plan-route-invalid');
  expect(wrapper.validateTestPlan(testPlan([{ action: 'eval', script: 'alert(1)' }])).reason_code)
    .toBe('test-plan-action-not-allowed');
  expect(wrapper.validateTestPlan(testPlan([{
    action: 'fill',
    locator: { kind: 'ref', value: '@e1' },
    value: 'literal-secret',
  }])).reason_code).toBe('test-plan-caller-literal-forbidden');
  expect(wrapper.validateTestPlan(testPlan([{
    action: 'get',
    property: 'text',
    locator: { kind: 'label', value: 'Status' },
  }])).reason_code).toBe('test-plan-get-locator-not-supported');
  expect(wrapper.validateTestPlan(testPlan([{ action: 'snapshot' }])).reason_code)
    .toBe('test-plan-open-required');
  expect(wrapper.validateTestPlan(testPlan([
    { action: 'snapshot' },
    { action: 'open', route: '/settings' },
  ])).reason_code).toBe('test-plan-page-context-before-open');
  expect(wrapper.validateTestPlan(testPlan([
    { action: 'click', locator: { kind: 'ref', value: '@e1' } },
    { action: 'open', route: '/settings' },
  ])).reason_code).toBe('test-plan-page-context-before-open');

  for (const action of [
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
  ]) {
    expect(wrapper.validateTestPlan(testPlan([
      pageContextStep(action),
      { action: 'open', route: '/settings' },
    ]))).toMatchObject({
      ok: false,
      reason_code: 'test-plan-page-context-before-open',
      step_index: 0,
    });
  }
});

test('prepare writes only owner-private run files and pins the internal test-plan hash', () => {
  const prepared = prepare(testPlan([
    { action: 'open', route: '/settings' },
    {
      action: 'fill',
      locator: { kind: 'label', value: 'Email' },
      synthetic_value: 'email',
    },
  ]));

  expect(prepared.test_plan_sha256).toMatch(/^sha256:[a-f0-9]{64}$/);
  expect(fs.existsSync(prepared.manifest_path)).toBe(true);
  expect(fs.existsSync(prepared.action_policy_path)).toBe(true);
  expect(fs.existsSync(prepared.config_path)).toBe(true);
  const actionPolicy = JSON.parse(fs.readFileSync(prepared.action_policy_path, 'utf8'));
  expect(actionPolicy.default).toBe('deny');
  expect(actionPolicy.allow).toEqual(expect.arrayContaining(['launch', 'navigate']));
  expect(actionPolicy.allow).toContain('find');
  expect(prepared.session).toMatch(/^sfb-[a-f0-9]{16}$/);
  expect(prepared.namespace).toMatch(/^sfb-[a-f0-9]{16}$/);
  if (process.platform !== 'win32') {
    expect(fs.statSync(prepared.run_dir).mode & 0o777).toBe(0o700);
    for (const filePath of [
      prepared.manifest_path,
      prepared.test_plan_path,
      prepared.action_policy_path,
      prepared.config_path,
    ]) {
      expect(fs.statSync(filePath).mode & 0o777).toBe(0o600);
    }
  }
});

test('returns not_run without writing files when the requested run directory is a symlink', () => {
  const root = tempRoot();
  const target = path.join(root, 'target');
  const link = path.join(root, 'run-link');
  fs.mkdirSync(target);
  fs.symlinkSync(target, link);

  const result = wrapper.prepareRunContext({ testPlan: testPlan(), runDir: link });

  expect(result.status).toBe('not_run');
  expect(result.reason_code).toBe('private-run-directory-untrusted');
  expect(fs.readdirSync(target)).toEqual([]);
});

test('requires a newly created private run directory', () => {
  const root = tempRoot();
  const runDir = path.join(root, 'existing-run');
  fs.mkdirSync(runDir);

  const result = wrapper.prepareRunContext({ testPlan: testPlan(), runDir });

  expect(result).toMatchObject({
    status: 'not_run',
    reason_code: 'private-run-directory-must-be-new',
  });
  expect(fs.readdirSync(runDir)).toEqual([]);
});

test('uses the process identity rather than USERNAME when hardening Windows paths', () => {
  const root = tempRoot();
  const calls = [];
  const result = wrapper.prepareRunContext({
    testPlan: testPlan(),
    runDir: path.join(root, 'run'),
    platform: 'win32',
    env: { USERNAME: 'spoofed-user' },
    runner: (command, args, options) => {
      calls.push({ command, args, options });
      return { status: 0, stdout: '', stderr: '', error: null };
    },
  });

  expect(result.status).toBe('prepared');
  const grants = calls
    .filter((call) => call.command === 'icacls')
    .map((call) => call.args[call.args.indexOf('/grant:r') + 1]);
  expect(grants.length).toBeGreaterThan(0);
  expect(grants.every((grant) => grant.includes(os.userInfo().username))).toBe(true);
  expect(grants.some((grant) => grant.includes('spoofed-user'))).toBe(false);
});

test('resolves the Windows agent-browser native binary without invoking a cmd shim', () => {
  const root = tempRoot();
  const binDir = path.join(root, 'node_modules', '.bin');
  const nativeBinary = path.join(
    root,
    'node_modules',
    'agent-browser',
    'bin',
    'agent-browser-win32-x64.exe',
  );
  fs.mkdirSync(binDir, { recursive: true });
  fs.mkdirSync(path.dirname(nativeBinary), { recursive: true });
  fs.writeFileSync(nativeBinary, 'native-binary-placeholder');

  const invocation = wrapper.resolveRunnerInvocation('agent-browser.cmd', ['--version'], {
    platform: 'win32',
    arch: 'x64',
    env: { PATH: binDir },
  });

  expect(invocation).toEqual({
    ok: true,
    command: fs.realpathSync.native(nativeBinary),
    args: ['--version'],
  });
  expect(invocation.command).toMatch(/agent-browser-win32-x64\.exe$/);
});

test('fails closed when the Windows native agent-browser executable is unavailable', () => {
  const invocation = wrapper.resolveRunnerInvocation('agent-browser.cmd', ['--version'], {
    platform: 'win32',
    arch: 'x64',
    env: { PATH: tempRoot() },
  });

  expect(invocation).toEqual({
    ok: false,
    reason_code: 'agent-browser-native-executable-unavailable',
  });
});

test('rolls back a newly created run directory when private subdirectory setup fails', () => {
  const root = tempRoot();
  const runDir = path.join(root, 'run');
  let hardeningCalls = 0;

  const result = wrapper.prepareRunContext({
    testPlan: testPlan(),
    runDir,
    platform: 'win32',
    runner: () => {
      hardeningCalls += 1;
      return { status: hardeningCalls === 2 ? 1 : 0, stdout: '', stderr: '', error: null };
    },
  });

  expect(result).toMatchObject({
    status: 'not_run',
    reason_code: 'private-path-permission-hardening-failed',
    rollback_status: 'completed',
  });
  expect(fs.existsSync(runDir)).toBe(false);
});

test('preserves the original setup failure when run-directory rollback also fails', () => {
  const root = tempRoot();
  const runDir = path.join(root, 'run');
  let hardeningCalls = 0;
  const result = wrapper.prepareRunContext({
    testPlan: testPlan(),
    runDir,
    platform: 'win32',
    runner: () => {
      hardeningCalls += 1;
      return { status: hardeningCalls === 2 ? 1 : 0, stdout: '', stderr: '', error: null };
    },
    rmSync: () => {
      throw new Error('rollback blocked');
    },
  });

  expect(result).toMatchObject({
    status: 'not_run',
    reason_code: 'private-run-rollback-failed',
    original_reason_code: 'private-path-permission-hardening-failed',
    rollback_status: 'failed',
    run_dir: fs.realpathSync.native(runDir),
  });
});

test.each(['open', 'click', 'fill', 'type', 'press', 'select'])(
  'launches zero %s subprocesses when exact-origin is unavailable',
  (action) => {
    const step = stepForUnavailableExactOrigin(action);
    const prepared = prepare(testPlan(action === 'open'
      ? [step]
      : [{ action: 'open', route: '/settings' }, step]));
    const calls = [];

    const result = wrapper.runPreparedContext({
      manifestPath: prepared.manifest_path,
      runner: browserRunner(calls),
    });

    expect(result.status).toBe('not_supported');
    expect(result.reason_code).toBe('exact-origin-capability-unavailable');
    expect(result.action_process_calls).toBe(0);
    expect(actionCalls(calls)).toEqual([]);
  },
);

test('launches zero browser actions when exact-origin is advertised but its enforcement contract is unavailable', () => {
  const prepared = prepare(testPlan([{ action: 'open', route: '/settings' }]));
  const calls = [];

  const result = wrapper.runPreparedContext({
    manifestPath: prepared.manifest_path,
    runner: browserRunner(calls, { exactOrigin: true }),
    binaryIdentityResolver: () => binaryIdentity(),
    conformanceRunner: failedConformance,
  });

  expect(result).toMatchObject({
    status: 'not_supported',
    reason_code: 'exact-origin-conformance-failed',
    action_process_calls: 0,
  });
  expect(actionCalls(calls)).toEqual([]);
});

test('launches zero browser actions when the conformed binary identity changes before execution', () => {
  const prepared = prepare(testPlan([{ action: 'open', route: '/settings' }]));
  const calls = [];
  const result = wrapper.runPreparedContext({
    manifestPath: prepared.manifest_path,
    runner: browserRunner(calls),
    probe: confirmedConformanceProbe,
    binaryIdentityResolver: () => binaryIdentity(),
  });

  expect(result).toMatchObject({
    status: 'not_supported',
    reason_code: 'agent-browser-binary-identity-changed',
    action_process_calls: 0,
  });
  expect(actionCalls(calls)).toEqual([]);
});

test('does not trust a caller-supplied exact-origin capability claim', () => {
  const prepared = prepare(testPlan([{ action: 'open', route: '/settings' }]));
  const calls = [];

  const result = wrapper.runPreparedContext({
    manifestPath: prepared.manifest_path,
    exactOriginCapability: {
      confirmed: true,
      origin: 'http://127.0.0.1:4173',
      source: 'caller-claim',
    },
    runner: browserRunner(calls),
  });

  expect(result).toMatchObject({
    status: 'not_supported',
    reason_code: 'exact-origin-capability-unavailable',
    action_process_calls: 0,
  });
  expect(actionCalls(calls)).toEqual([]);
});

test('does not expose the in-process confirmed probe seam through CLI arguments', () => {
  const output = [];
  const writeSpy = jest.spyOn(process.stdout, 'write').mockImplementation((value) => {
    output.push(String(value));
    return true;
  });
  try {
    expect(wrapper.main(['run', '--probe', 'ready'])).toBe(1);
  } finally {
    writeSpy.mockRestore();
  }
  expect(output.join('')).toContain('argument-not-supported');
});

test('detects test-plan replacement before the first action and launches no subprocess', () => {
  const prepared = prepare();
  fs.appendFileSync(prepared.test_plan_path, '\n');
  const calls = [];

  const result = wrapper.runPreparedContext({
    manifestPath: prepared.manifest_path,
    runner: browserRunner(calls),
    probe: confirmedConformanceProbe,
  });

  expect(result.status).toBe('not_run');
  expect(result.reason_code).toBe('test-plan-hash-mismatch');
  expect(result.action_process_calls).toBe(0);
  expect(calls).toEqual([]);
});

test('rechecks the test-plan hash before every action and stops later subprocesses on drift', () => {
  const prepared = prepare(testPlan([
    { action: 'open', route: '/settings' },
    { action: 'snapshot', interactive: true },
    { action: 'console' },
  ]));
  const calls = [];

  const result = wrapper.runPreparedContext({
    manifestPath: prepared.manifest_path,
    runner: browserRunner(calls, {
      stdout: 'UNTRUSTED PAGE OUTPUT',
      onAction: () => fs.appendFileSync(prepared.test_plan_path, '\n'),
    }),
    probe: confirmedConformanceProbe,
  });

  expect(result.status).toBe('not_run');
  expect(result.reason_code).toBe('test-plan-hash-mismatch');
  expect(result.action_process_calls).toBe(1);
  expect(actionCalls(calls)).toHaveLength(1);
  expect(JSON.stringify(result)).not.toContain('UNTRUSTED PAGE OUTPUT');
});

test('reserves each private raw-output file before launching the corresponding action', () => {
  const prepared = prepare(testPlan([{ action: 'open', route: '/settings' }]));
  fs.writeFileSync(path.join(prepared.raw_dir, 'step-001.json'), '{}\n', { mode: 0o600 });
  const calls = [];

  const result = wrapper.runPreparedContext({
    manifestPath: prepared.manifest_path,
    runner: browserRunner(calls),
    probe: confirmedConformanceProbe,
  });

  expect(result.status).toBe('not_run');
  expect(result.reason_code).toBe('private-run-file-collision');
  expect(result.action_process_calls).toBe(0);
  expect(actionCalls(calls)).toEqual([]);
});

test('builds allowlisted argv, synthetic values, sanitized env, and private raw-output paths', () => {
  const prepared = prepare(testPlan([
    { action: 'open', route: '/settings' },
    { action: 'fill', locator: { kind: 'label', value: 'Email' }, synthetic_value: 'email' },
    { action: 'screenshot-private', name: 'settings-form' },
  ]));
  const calls = [];

  const result = wrapper.runPreparedContext({
    manifestPath: prepared.manifest_path,
    runner: browserRunner(calls, {
      stdout: 'RAW SECRET-LIKE PAGE DATA',
    }),
    probe: confirmedConformanceProbe,
    env: {
      ...process.env,
      AGENT_BROWSER_PROFILE: 'Default',
      AGENT_BROWSER_STATE: '/tmp/state.json',
      AGENT_BROWSER_PROVIDER: 'cloud',
      HTTPS_PROXY: 'http://proxy.invalid',
    },
  });

  expect(result.status).toBe('completed');
  expect(result.action_process_calls).toBe(3);
  expect(JSON.stringify(result)).not.toContain('RAW SECRET-LIKE PAGE DATA');
  const executedCalls = actionCalls(calls);
  for (const call of executedCalls) {
    expect(call.command).toBe(CONFIRMED_BINARY_IDENTITY.path);
    expect(call.args).toEqual(expect.arrayContaining([
      '--session',
      '--namespace',
      '--config',
      '--content-boundaries',
      '--allowed-domains',
      '--exact-origin',
      '--action-policy',
      '--screenshot-dir',
      '--json',
    ]));
    expect(call.args).not.toEqual(expect.arrayContaining(['--profile', '--state', '--restore', '--auto-connect']));
    expect(call.options.env.AGENT_BROWSER_PROFILE).toBeUndefined();
    expect(call.options.env.AGENT_BROWSER_STATE).toBeUndefined();
    expect(call.options.env.AGENT_BROWSER_PROVIDER).toBeUndefined();
    expect(call.options.env.HTTPS_PROXY).toBeUndefined();
  }
  const allowedDomainIndex = executedCalls[0].args.indexOf('--allowed-domains');
  const exactOriginIndex = executedCalls[0].args.indexOf('--exact-origin');
  expect(executedCalls[0].args[allowedDomainIndex + 1]).toBe('127.0.0.1');
  expect(executedCalls[0].args[exactOriginIndex + 1]).toBe('http://127.0.0.1:4173');
  expect(executedCalls[0].args).toContain('http://127.0.0.1:4173/settings');
  expect(executedCalls[1].args.some((arg) => /@example\.test$/.test(arg))).toBe(true);
  expect(result.steps.every((step) => step.raw_output_path.startsWith(prepared.run_dir))).toBe(true);
});

test('stops after a failed first open and keeps later page actions private', () => {
  const prepared = prepare(testPlan([
    { action: 'open', route: '/settings' },
    { action: 'snapshot', interactive: true },
    { action: 'console' },
  ]));
  const calls = [];
  const runner = browserRunner(calls);

  const result = wrapper.runPreparedContext({
    manifestPath: prepared.manifest_path,
    probe: confirmedConformanceProbe,
    runner: (command, args, options) => {
      const probed = runner(command, args, options);
      if (!args.includes('--version') && !args.includes('--help')) {
        return { status: 7, stdout: 'PRIVATE FAILURE OUTPUT', stderr: 'failed', error: null };
      }
      return probed;
    },
  });

  expect(result).toMatchObject({
    status: 'not_run',
    reason_code: 'agent-browser-action-failed',
    action_process_calls: 1,
  });
  expect(result.steps).toHaveLength(1);
  expect(result.steps[0]).toMatchObject({ status: 'failed', exit_code: 7 });
  expect(JSON.stringify(result)).not.toContain('PRIVATE FAILURE OUTPUT');
  expect(actionCalls(calls)).toHaveLength(1);
  const raw = JSON.parse(fs.readFileSync(result.steps[0].raw_output_path, 'utf8'));
  expect(raw.stdout).toBe('PRIVATE FAILURE OUTPUT');
});

test('discards a reserved raw file when the action runner throws', () => {
  const prepared = prepare(testPlan([{ action: 'open', route: '/settings' }]));
  const calls = [];
  const runner = browserRunner(calls);

  const result = wrapper.runPreparedContext({
    manifestPath: prepared.manifest_path,
    probe: confirmedConformanceProbe,
    runner: (command, args, options) => {
      const probed = runner(command, args, options);
      if (!args.includes('--version') && !args.includes('--help')) {
        throw new Error('spawn failed');
      }
      return probed;
    },
  });

  expect(result).toMatchObject({
    status: 'not_run',
    reason_code: 'agent-browser-action-failed',
    action_process_calls: 0,
  });
  expect(fs.readdirSync(prepared.raw_dir)).toEqual([]);
});

test('cleanup closes only the prepared isolated session', () => {
  const prepared = prepare();
  const calls = [];

  const result = wrapper.cleanupRunContext({
    manifestPath: prepared.manifest_path,
    runner: (command, args, options) => {
      calls.push({ command, args, options });
      return { status: 0, stdout: '', stderr: '', error: null };
    },
  });

  expect(result.status).toBe('completed');
  expect(calls).toHaveLength(1);
  expect(calls[0].args).toEqual(expect.arrayContaining(['--session', '--namespace', 'close']));
  expect(calls[0].args).not.toContain('--all');
});

test('cleanup failure keeps diagnostics private and returns a bounded evidence ref', () => {
  const prepared = prepare();

  const result = wrapper.cleanupRunContext({
    manifestPath: prepared.manifest_path,
    runner: () => ({
      status: 9,
      stdout: 'PRIVATE CLEANUP OUTPUT',
      stderr: 'close failed',
      error: null,
    }),
  });

  expect(result).toMatchObject({
    status: 'not_run',
    reason_code: 'agent-browser-cleanup-failed',
    exit_code: 9,
  });
  expect(result.raw_output_path.startsWith(prepared.raw_dir)).toBe(true);
  expect(JSON.stringify(result)).not.toContain('PRIVATE CLEANUP OUTPUT');
  const raw = JSON.parse(fs.readFileSync(result.raw_output_path, 'utf8'));
  expect(raw.stdout).toBe('PRIVATE CLEANUP OUTPUT');
});

test('cleanup still attempts the close command when private diagnostics are unavailable', () => {
  const prepared = prepare();
  const calls = [];

  const result = wrapper.cleanupRunContext({
    manifestPath: prepared.manifest_path,
    runner: (command, args) => {
      calls.push({ command, args });
      return { status: 8, stdout: 'PRIVATE CLEANUP OUTPUT', stderr: 'close failed', error: null };
    },
    reservePrivateJson: () => {
      const error = new Error('private-path-permission-hardening-failed');
      error.reason_code = 'private-path-permission-hardening-failed';
      throw error;
    },
  });

  expect(calls.some((call) => call.args.includes('close'))).toBe(true);
  expect(result).toMatchObject({
    status: 'not_run',
    reason_code: 'agent-browser-cleanup-failed',
    exit_code: 8,
    diagnostic_status: 'unavailable',
    diagnostic_reason_code: 'private-path-permission-hardening-failed',
  });
  expect(JSON.stringify(result)).not.toContain('PRIVATE CLEANUP OUTPUT');
});

test('cleanup runner exceptions stay private and return a structured blocker', () => {
  const prepared = prepare();

  const result = wrapper.cleanupRunContext({
    manifestPath: prepared.manifest_path,
    runner: () => {
      throw new Error('PRIVATE CLEANUP EXCEPTION');
    },
  });

  expect(result).toMatchObject({
    status: 'not_run',
    reason_code: 'agent-browser-cleanup-failed',
    exit_code: 1,
  });
  expect(JSON.stringify(result)).not.toContain('PRIVATE CLEANUP EXCEPTION');
  const raw = JSON.parse(fs.readFileSync(result.raw_output_path, 'utf8'));
  expect(raw.error).toBe('PRIVATE CLEANUP EXCEPTION');
});

test('workflow contract preserves browser cleanup blockers without server ownership', () => {
  expect(skillSource).toContain('Browser cleanup');
  expect(skillSource).toContain('cleanup failure');
  expect(skillSource).not.toContain('Server cleanup');
  expect(skillSource).not.toContain('managed server');
});

test('source-only capability cases cover browser policy and caller-owned server boundaries', () => {
  const cases = JSON.parse(fs.readFileSync(
    path.resolve(__dirname, '../../skills/spec-test-browser/evals/capability-cases.json'),
    'utf8',
  )).cases;

  expect(cases.filter((entry) => entry.kind === 'positive')).toHaveLength(3);
  expect(cases.filter((entry) => entry.kind === 'negative-owner')).toHaveLength(5);
  expect(cases.map((entry) => entry.id)).toEqual(expect.arrayContaining([
    'provider-self-report-does-not-confirm-exact-origin',
    'controlled-conformance-binds-current-binary',
    'caller-owned-origin-never-starts-a-project-command',
    'destructive-browser-effect-requires-current-authorization',
  ]));
});
