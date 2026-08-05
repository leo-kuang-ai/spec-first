'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { StringDecoder } = require('node:string_decoder');

const { writeFileAtomicIfAbsent } = require('../atomic-write');
const { validateAgainstSchema } = require('../../contracts/schema-validator');
const { resolveWorkflowArtifactDir } = require('../../verification/artifact-paths');
const {
  resolveTargetRepoRoot,
  validateOutputContainment,
  validateRepoRelativeField,
} = require('./target-repo');

const RUN_SUMMARY_SCHEMA_VERSION = 'verification-run-summary.v1';
const RUN_SUMMARY_SCHEMA_PATH = path.join(__dirname, '..', '..', '..', 'docs', 'contracts', 'verification', 'verification-run-summary.schema.json');
const DEFAULT_WORKFLOW = 'spec-work';
const ALLOWED_WORKFLOWS = new Set(['spec-work', 'spec-debug', 'spec-code-review']);
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,80}$/;
const ALLOWED_INPUT_FIELDS = new Set(['profile', 'checks']);
const ALLOWED_PROFILE_FIELDS = new Set(['source', 'name', 'path']);
const ALLOWED_CHECK_FIELDS = new Set([
  'id',
  'service',
  'command',
  'status',
  'exit_code',
  'ran',
  'required_tools',
  'missing_tools',
  'log_path',
  'reason_code',
  'redaction_status',
]);
const ALLOWED_STATUSES = new Set(['passed', 'failed', 'not-run', 'degraded']);
const ALLOWED_REDACTION_STATUSES = new Set(['redacted', 'none-required']);
const LOG_SCAN_CHUNK_BYTES = 64 * 1024;
const LOG_SCAN_OVERLAP_CHARS = 4 * 1024;
// URL credential/query 模式允许无界非空白前缀。跨 chunk 保留未闭合 URL 候选，
// 超出有界检查预算后 fail closed，不依赖固定 overlap 侥幸覆盖。
const LOG_SCAN_MAX_URL_CANDIDATE_CHARS = 64 * 1024;

let cachedSchema = null;

function runCli(argv) {
  const args = Array.isArray(argv) ? [...argv] : [];
  const subcommand = args[0];

  if (subcommand === 'record') {
    const parsed = parseRecordArgs(args.slice(1));
    if (parsed.errors.length > 0) {
      writeJson({ status: 'rejected', reason_code: 'invalid-arguments', errors: parsed.errors });
      return 2;
    }
    const result = writeVerificationRunSummary(parsed);
    writeJson(result.output);
    return result.exitCode;
  }

  if (subcommand === 'read') {
    const parsed = parseReadArgs(args.slice(1));
    if (parsed.errors.length > 0) {
      writeJson({ status: 'rejected', reason_code: 'invalid-arguments', errors: parsed.errors });
      return 2;
    }
    const result = readVerificationRunSummary(parsed);
    writeJson(result.output);
    return result.exitCode;
  }

  writeJson({
    status: 'rejected',
    reason_code: 'invalid-command',
    errors: ['Usage: verification-run-summary <record|read> ...'],
  });
  return 2;
}

function parseRecordArgs(args) {
  const parsed = {
    inputPath: '',
    runId: '',
    targetRepo: '',
    workflow: DEFAULT_WORKFLOW,
    errors: [],
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--json') continue;
    if (arg === '--input') {
      parsed.inputPath = args[index + 1] || '';
      index += 1;
      continue;
    }
    if (arg === '--run-id') {
      parsed.runId = args[index + 1] || '';
      index += 1;
      continue;
    }
    if (arg === '--target-repo') {
      parsed.targetRepo = args[index + 1] || '';
      index += 1;
      continue;
    }
    if (arg === '--workflow') {
      parsed.workflow = args[index + 1] || '';
      index += 1;
      continue;
    }
    parsed.errors.push(`unknown argument: ${arg}`);
  }
  if (!parsed.inputPath) parsed.errors.push('--input is required');
  if (!parsed.runId) parsed.errors.push('--run-id is required');
  if (!parsed.targetRepo) parsed.errors.push('--target-repo is required');
  return parsed;
}

function parseReadArgs(args) {
  const parsed = {
    targetRepo: '',
    runSummaryRef: '',
    errors: [],
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--json') continue;
    if (arg === '--target-repo') {
      parsed.targetRepo = args[index + 1] || '';
      index += 1;
      continue;
    }
    if (arg === '--run-summary-ref') {
      parsed.runSummaryRef = args[index + 1] || '';
      index += 1;
      continue;
    }
    parsed.errors.push(`unknown argument: ${arg}`);
  }
  if (!parsed.targetRepo) parsed.errors.push('--target-repo is required');
  if (!parsed.runSummaryRef) parsed.errors.push('--run-summary-ref is required');
  return parsed;
}

function writeVerificationRunSummary({ inputPath, runId, targetRepo, workflow = DEFAULT_WORKFLOW }) {
  const target = resolveTargetRepoRoot(targetRepo);
  if (!target.ok) {
    return notWritten('target-repo-not-found', target.errors);
  }
  const workflowName = normalizeWorkflow(workflow);
  if (!workflowName) {
    return rejected('invalid-workflow', [`workflow must be one of: ${Array.from(ALLOWED_WORKFLOWS).join(', ')}`]);
  }
  if (!isSafeId(runId)) {
    return rejected('invalid-run-id', ['run-id must be a stable safe identifier']);
  }

  let payload;
  try {
    payload = JSON.parse(fs.readFileSync(path.resolve(inputPath), 'utf8'));
  } catch (error) {
    return rejected('input-json-invalid', [error.message]);
  }

  const targetRepoRoot = target.root;
  const workspaceSlug = slugify(path.basename(targetRepoRoot));
  const runRoot = resolveRunRoot(targetRepoRoot, workflowName, workspaceSlug, runId);
  // repo-relative ref 是跨平台契约标识符,不是本地路径:读侧(readVerificationRunSummary)与
  // 下游 consumer 只接受 POSIX 正斜杠,所以 ref 用 path.posix.join,真实文件 IO 仍用 path.join。
  const summaryRef = path.posix.join('.spec-first', 'workflows', workflowName, workspaceSlug, runId, 'verification-run-summary.json');
  const absoluteSummaryPath = path.join(targetRepoRoot, summaryRef);
  const containment = validateOutputContainment(targetRepoRoot, absoluteSummaryPath);
  if (containment.errors.length > 0) {
    return rejected('run-summary-path-escape', containment.errors);
  }

  const validation = validateRunSummaryInput(payload, {
    targetRepoRoot,
    workflow: workflowName,
    workspaceSlug,
    runId,
  });
  if (validation.errors.length > 0) {
    return rejected(validation.reasonCode, validation.errors);
  }

  const summary = {
    schema_version: RUN_SUMMARY_SCHEMA_VERSION,
    generated_at: new Date().toISOString(),
    profile: payload.profile,
    checks: payload.checks,
  };
  const schemaValidation = validateRunSummary(summary);
  if (schemaValidation.errors.length > 0) {
    return rejected(schemaValidation.reasonCode || 'run-summary-schema-invalid', schemaValidation.errors);
  }

  try {
    fs.mkdirSync(runRoot, { recursive: true });
    const postMkdirContainment = validateOutputContainment(targetRepoRoot, absoluteSummaryPath);
    if (postMkdirContainment.errors.length > 0) {
      return rejected('run-summary-path-escape', postMkdirContainment.errors);
    }
    writeFileAtomicIfAbsent(absoluteSummaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  } catch (error) {
    if (error && error.code === 'EEXIST') {
      return notWritten('run-summary-already-exists', [`run summary already exists: ${summaryRef}`], { runSummaryRef: summaryRef });
    }
    return notWritten('run-summary-write-failed', [error.message], { runSummaryRef: summaryRef });
  }

  return {
    exitCode: 0,
    output: {
      status: 'written',
      reason_code: 'written',
      schema_version: RUN_SUMMARY_SCHEMA_VERSION,
      run_summary_ref: summaryRef,
      checks: summary.checks.map((check) => ({
        id: check.id,
        status: check.status,
        reason_code: check.reason_code,
      })),
    },
  };
}

function readVerificationRunSummary({ targetRepo, runSummaryRef }) {
  const target = resolveTargetRepoRoot(targetRepo);
  if (!target.ok) {
    return {
      exitCode: 1,
      output: {
        status: 'not-readable',
        reason_code: 'target-repo-not-found',
        run_summary_ref: runSummaryRef || null,
        errors: target.errors,
        summary: null,
      },
    };
  }

  const errors = [];
  validateRepoRelativeField(runSummaryRef, 'run_summary_ref', errors, { allowSpecFirstWorkflows: true });
  if (!String(runSummaryRef || '').endsWith('/verification-run-summary.json')) {
    errors.push('run_summary_ref must point at verification-run-summary.json');
  }
  if (errors.length > 0) {
    return {
      exitCode: 1,
      output: {
        status: 'not-readable',
        reason_code: 'run-summary-ref-invalid',
        run_summary_ref: runSummaryRef || null,
        errors,
        summary: null,
      },
    };
  }

  const absolutePath = path.join(target.root, runSummaryRef);
  const containment = validateOutputContainment(target.root, absolutePath);
  if (containment.errors.length > 0) {
    return {
      exitCode: 1,
      output: {
        status: 'not-readable',
        reason_code: 'run-summary-path-escape',
        run_summary_ref: runSummaryRef,
        errors: containment.errors,
        summary: null,
      },
    };
  }

  let summary;
  try {
    const stat = fs.lstatSync(absolutePath);
    if (stat.isSymbolicLink() || !stat.isFile()) {
      return {
        exitCode: 1,
        output: {
          status: 'not-readable',
          reason_code: 'run-summary-path-escape',
          run_summary_ref: runSummaryRef,
          errors: [`run summary ref is not a regular file: ${runSummaryRef}`],
          summary: null,
        },
      };
    }
    summary = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  } catch (error) {
    return {
      exitCode: 1,
      output: {
        status: 'not-readable',
        reason_code: error && error.code === 'ENOENT' ? 'run-summary-not-found' : 'run-summary-unreadable',
        run_summary_ref: runSummaryRef,
        errors: [error.message],
        summary: null,
      },
    };
  }

  const validation = validateRunSummary(summary);
  if (validation.errors.length > 0) {
    return {
      exitCode: 1,
      output: {
        status: 'not-readable',
        reason_code: validation.reasonCode || 'run-summary-schema-invalid',
        run_summary_ref: runSummaryRef,
        errors: validation.errors,
        summary: null,
      },
    };
  }

  return {
    exitCode: 0,
    output: {
      status: 'read',
      reason_code: 'read',
      schema_version: RUN_SUMMARY_SCHEMA_VERSION,
      run_summary_ref: runSummaryRef,
      summary,
    },
  };
}

function validateRunSummaryInput(payload, context) {
  const errors = [];
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { errors: ['payload must be a JSON object'], reasonCode: 'run-summary-input-invalid' };
  }
  validateObjectFields(payload, 'payload', ALLOWED_INPUT_FIELDS, errors);
  validateProfile(payload.profile, errors);
  if (!Array.isArray(payload.checks) || payload.checks.length === 0) {
    errors.push('checks must be a non-empty array');
  } else {
    payload.checks.forEach((check, index) => validateCheck(check, index, context, errors));
    validateUniqueCheckIds(payload.checks, errors);
  }

  return {
    errors,
    reasonCode: errors.length > 0 ? classifyErrors(errors) : null,
  };
}

function validateProfile(profile, errors) {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
    errors.push('profile must be an object');
    return;
  }
  validateObjectFields(profile, 'profile', ALLOWED_PROFILE_FIELDS, errors);
  if (!['explicit', 'local', 'inferred', 'missing'].includes(profile.source)) {
    errors.push('profile.source is invalid');
  }
  if (typeof profile.name !== 'string' || profile.name.trim() === '') {
    errors.push('profile.name must be a non-empty string');
  }
  if (profile.path !== null && profile.path !== undefined && typeof profile.path !== 'string') {
    errors.push('profile.path must be a string or null');
  }
}

function validateCheck(check, index, context, errors) {
  const pointer = `checks[${index}]`;
  if (!check || typeof check !== 'object' || Array.isArray(check)) {
    errors.push(`${pointer} must be an object`);
    return;
  }
  validateObjectFields(check, pointer, ALLOWED_CHECK_FIELDS, errors);
  for (const field of ['id', 'service', 'command', 'reason_code']) {
    if (typeof check[field] !== 'string' || check[field].trim() === '') {
      errors.push(`${pointer}.${field} must be a non-empty string`);
    }
  }
  if (!ALLOWED_STATUSES.has(check.status)) {
    errors.push(`${pointer}.status is invalid`);
  }
  if (typeof check.ran !== 'boolean') {
    errors.push(`${pointer}.ran must be a boolean`);
  }
  if (check.exit_code !== null && !Number.isInteger(check.exit_code)) {
    errors.push(`${pointer}.exit_code must be an integer or null`);
  }
  validateStringArray(check.required_tools, `${pointer}.required_tools`, errors);
  validateStringArray(check.missing_tools, `${pointer}.missing_tools`, errors);
  if (!ALLOWED_REDACTION_STATUSES.has(check.redaction_status)) {
    errors.push(`${pointer}.redaction_status is invalid`);
  }

  validateCheckStatusConsistency(check, pointer, errors);
  validateCheckLogPath(check, pointer, context, errors);
}

function validateCheckStatusConsistency(check, pointer, errors) {
  if (check.status === 'passed') {
    if (check.ran !== true) errors.push(`${pointer}.ran must be true when status is passed`);
    if (check.exit_code !== 0) errors.push(`${pointer}.exit_code must be 0 when status is passed`);
  }
  if (check.status === 'failed') {
    if (check.ran !== true) errors.push(`${pointer}.ran must be true when status is failed`);
    if (!Number.isInteger(check.exit_code) || check.exit_code === 0) {
      errors.push(`${pointer}.exit_code must be a non-zero integer when status is failed`);
    }
  }
  if (check.status === 'not-run') {
    if (check.ran !== false) errors.push(`${pointer}.ran must be false when status is not-run`);
    if (check.exit_code !== null) errors.push(`${pointer}.exit_code must be null when status is not-run`);
    if (check.reason_code === 'missing_dependency' && (!Array.isArray(check.missing_tools) || check.missing_tools.length === 0)) {
      errors.push(`${pointer}.missing_tools must be non-empty when reason_code is missing_dependency`);
    }
  }
  if (check.reason_code === 'schedulable') {
    if (check.status !== 'not-run') errors.push(`${pointer}.status must be not-run when reason_code is schedulable`);
    if (check.ran !== false) errors.push(`${pointer}.ran must be false when reason_code is schedulable`);
    if (check.exit_code !== null) errors.push(`${pointer}.exit_code must be null when reason_code is schedulable`);
    if (Array.isArray(check.missing_tools) && check.missing_tools.length > 0) {
      errors.push(`${pointer}.missing_tools must be empty when reason_code is schedulable`);
    }
  }
  const recordsMissingDependencies = (
    check.reason_code === 'missing_dependency'
    || (Array.isArray(check.missing_tools) && check.missing_tools.length > 0)
  );
  if (recordsMissingDependencies) {
    if (check.status !== 'not-run') errors.push(`${pointer}.status must be not-run when missing dependencies are recorded`);
    if (check.ran !== false) errors.push(`${pointer}.ran must be false when missing dependencies are recorded`);
    if (check.exit_code !== null) errors.push(`${pointer}.exit_code must be null when missing dependencies are recorded`);
    if (check.reason_code !== 'missing_dependency') {
      errors.push(`${pointer}.reason_code must be missing_dependency when missing dependencies are recorded`);
    }
    if (!Array.isArray(check.missing_tools) || check.missing_tools.length === 0) {
      errors.push(`${pointer}.missing_tools must be non-empty when missing dependencies are recorded`);
    }
  }
  if (Array.isArray(check.missing_tools) && check.missing_tools.length > 0 && check.reason_code !== 'missing_dependency') {
    errors.push(`${pointer}.reason_code must be missing_dependency when missing_tools is non-empty`);
  }
}

function validateCheckLogPath(check, pointer, context, errors) {
  if (check.ran === false && (check.log_path === null || check.log_path === undefined)) return;
  validateRepoRelativeField(check.log_path, `${pointer}.log_path`, errors, { allowSpecFirstWorkflows: true });
  if (typeof check.log_path !== 'string') return;

  const normalized = check.log_path.replace(/\\/g, '/');
  // context.workflow 缺省即 spec-work,与 parseRecordArgs 的 DEFAULT_WORKFLOW 对齐(向后兼容
  // 默认,非疏漏):内部写路径(writeVerificationRunSummary)总是显式传 workflow;只有直接调用
  // 导出的 validateRunSummaryInput 且省略 workflow 时才回退,此时按 spec-work 校验是有意契约。
  // 显式传入非法 workflow 才报错。
  const workflow = normalizeWorkflow(context.workflow || DEFAULT_WORKFLOW);
  if (!workflow) {
    errors.push(`${pointer}.log_path workflow must be one of: ${Array.from(ALLOWED_WORKFLOWS).join(', ')}`);
    return;
  }
  const expectedPrefix = `.spec-first/workflows/${workflow}/${context.workspaceSlug}/${context.runId}/logs/`;
  if (!normalized.startsWith(expectedPrefix)) {
    errors.push(`${pointer}.log_path must stay under ${expectedPrefix}`);
    return;
  }

  const absoluteLogPath = path.join(context.targetRepoRoot, normalized);
  const containment = validateOutputContainment(context.targetRepoRoot, absoluteLogPath);
  if (containment.errors.length > 0) {
    errors.push(...containment.errors.map((error) => `${pointer}.log_path ${error}`));
    return;
  }
  let stat;
  try {
    stat = fs.lstatSync(absoluteLogPath);
  } catch (error) {
    errors.push(`${pointer}.log_path cannot be inspected: ${error.message}`);
    return;
  }
  if (stat.isSymbolicLink() || !stat.isFile()) {
    errors.push(`${pointer}.log_path must be a regular file`);
    return;
  }
  // fail-closed:无条件扫描 log 内容,把 check 自报的 redaction_status=redacted
  // 从「信任」升级为「可验证」——即便声明已脱敏,残留 secret 仍拒绝写入。
  const secretScan = scanLogForSecretLikeContent(absoluteLogPath);
  if (!secretScan.ok) {
    if (secretScan.unreadable) {
      errors.push(`${pointer}.log_path cannot be inspected: ${secretScan.error}`);
      return;
    }
    errors.push(`${pointer}.log_path contains secret-like content: ${secretScan.reason_code}`);
  }
}

function validateRunSummary(summary) {
  const result = validateAgainstSchema(getRunSummarySchema(), summary);
  const errors = result.valid ? [] : [...result.errors];
  if (result.valid) validateUniqueCheckIds(summary.checks, errors);
  let reasonCode = null;
  if (errors.some((error) => error.startsWith('checks contains duplicate id:'))) {
    reasonCode = 'run-summary-duplicate-check-id';
  } else if (errors.length > 0) {
    reasonCode = 'run-summary-schema-invalid';
  }
  return {
    errors,
    reasonCode,
  };
}

function validateUniqueCheckIds(checks, errors) {
  const seen = new Set();
  for (const check of checks) {
    if (!check || typeof check.id !== 'string') continue;
    if (seen.has(check.id)) {
      errors.push(`checks contains duplicate id: ${check.id}`);
      continue;
    }
    seen.add(check.id);
  }
}

// fail-closed secret gate:全文扫描,不设静默截断上限。只看前 64KiB 会让「把 secret 放在
// 第 65537 字节」直接绕过 gate,而验证日志(npm test 输出等)超过 64KiB 是常态,所以这里选择
// 分块流式扫全文,而不是保留上限 + 标注截断——一个 fail-closed 的安全 gate 不能默认放行未读区域。
function scanLogForSecretLikeContent(absoluteLogPath) {
  let fd;
  try {
    fd = fs.openSync(absoluteLogPath, 'r');
  } catch (error) {
    return { ok: false, unreadable: true, reason_code: 'log-not-scannable', error: error.message };
  }
  try {
    const decoder = new StringDecoder('utf8');
    const buffer = Buffer.alloc(LOG_SCAN_CHUNK_BYTES);
    let carry = '';
    for (;;) {
      let bytesRead;
      try {
        bytesRead = fs.readSync(fd, buffer, 0, LOG_SCAN_CHUNK_BYTES, null);
      } catch (error) {
        return { ok: false, unreadable: true, reason_code: 'log-not-scannable', error: error.message };
      }
      if (bytesRead === 0) break;
      const text = carry + decoder.write(buffer.subarray(0, bytesRead));
      const hit = matchSecretLikeContent(text);
      if (hit) return { ok: false, reason_code: hit };
      const nextCarry = buildSecretScanCarry(text);
      if (!nextCarry.ok) return { ok: false, reason_code: nextCarry.reason_code };
      carry = nextCarry.carry;
    }
    const hit = matchSecretLikeContent(carry + decoder.end());
    if (hit) return { ok: false, reason_code: hit };
    return { ok: true, reason_code: 'no-secret-like-content' };
  } finally {
    try {
      fs.closeSync(fd);
    } catch (error) {
      // close 失败不得覆盖已判定的扫描结论,否则又会退回未捕获异常。
    }
  }
}

function buildSecretScanCarry(text) {
  const trailingTokenMatch = String(text || '').match(/\S+$/);
  if (!trailingTokenMatch) return { ok: true, carry: '' };
  const trailingToken = trailingTokenMatch[0];
  const lowerToken = trailingToken.toLowerCase();
  const httpIndex = Math.max(lowerToken.lastIndexOf('http://'), lowerToken.lastIndexOf('https://'));
  if (httpIndex >= 0) {
    const candidate = trailingToken.slice(httpIndex);
    if (candidate.length > LOG_SCAN_MAX_URL_CANDIDATE_CHARS) {
      return { ok: false, carry: '', reason_code: 'unterminated-secret-candidate' };
    }
    return { ok: true, carry: candidate };
  }
  return { ok: true, carry: trailingToken.slice(-LOG_SCAN_OVERLAP_CHARS) };
}

function matchSecretLikeContent(text) {
  if (/https?:\/\/[^/\s]+:[^@\s]+@/i.test(text)) return 'credential-bearing-url';
  if (/https?:\/\/\S*[?&](?:token|access_token|api_key|key|secret|password)=/i.test(text)) {
    return 'credential-query-parameter';
  }
  if (/(?:authorization|api[_-]?key|access[_-]?token|secret|password)\s*[:=]\s*[^<\s][^\s]*/i.test(text)) {
    return 'secret-like-value';
  }
  return null;
}

function resolveRunRoot(targetRepoRoot, workflow, workspaceSlug, runId) {
  const workspaceRoot = resolveWorkflowArtifactDir(targetRepoRoot, workflow, workspaceSlug);
  return path.join(workspaceRoot, runId);
}

function validateObjectFields(value, pointer, allowedFields, errors) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  for (const field of Object.keys(value)) {
    if (!allowedFields.has(field)) {
      errors.push(`${pointer}.${field} is not allowed`);
    }
  }
}

function validateStringArray(values, field, errors) {
  if (!Array.isArray(values)) {
    errors.push(`${field} must be an array`);
    return;
  }
  for (const value of values) {
    if (typeof value !== 'string' || value.trim() === '') {
      errors.push(`${field} entries must be non-empty strings`);
    }
  }
}

function getRunSummarySchema() {
  if (!cachedSchema) {
    cachedSchema = JSON.parse(fs.readFileSync(RUN_SUMMARY_SCHEMA_PATH, 'utf8'));
  }
  return cachedSchema;
}

function classifyErrors(errors) {
  if (errors.some((error) => error.startsWith('checks contains duplicate id:'))) return 'duplicate-check-id';
  if (errors.some((error) => /secret|credential/i.test(error))) return 'security-rejected';
  if (errors.some((error) => /path|repo-relative|runtime|log_path/.test(error))) return 'path-rejected';
  return 'schema-rejected';
}

function rejected(reasonCode, errors) {
  return {
    exitCode: 1,
    output: {
      status: 'rejected',
      reason_code: reasonCode,
      schema_version: RUN_SUMMARY_SCHEMA_VERSION,
      run_summary_ref: null,
      errors,
    },
  };
}

function notWritten(reasonCode, errors, extras = {}) {
  return {
    exitCode: 0,
    output: {
      status: 'not-written',
      reason_code: reasonCode,
      schema_version: RUN_SUMMARY_SCHEMA_VERSION,
      run_summary_ref: extras.runSummaryRef || null,
      errors,
    },
  };
}

function slugify(value) {
  return String(value || 'workspace')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'workspace';
}

function isSafeId(value) {
  return SAFE_ID_PATTERN.test(value || '');
}

function normalizeWorkflow(value) {
  const workflow = String(value || '').trim();
  return ALLOWED_WORKFLOWS.has(workflow) ? workflow : '';
}

// run summary 全量聚合的唯一真相源:对全部 check 取最严重状态。
// 所有 consumer(spec-work-run-artifact 写入、honest-closeout 校验)都复用此函数,
// 不各自实现聚合,避免对同一 run summary 给出矛盾结论。
function aggregateRunSummaryStatus(summary) {
  const statuses = (summary && Array.isArray(summary.checks) ? summary.checks : [])
    .map((check) => check.status);
  if (statuses.includes('failed')) return 'failed';
  if (statuses.includes('not-run')) return 'not-run';
  if (statuses.includes('degraded')) return 'degraded';
  if (statuses.length > 0 && statuses.every((status) => status === 'passed')) return 'passed';
  return 'degraded';
}

function writeJson(payload) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

module.exports = {
  ALLOWED_WORKFLOWS,
  DEFAULT_WORKFLOW,
  RUN_SUMMARY_SCHEMA_VERSION,
  aggregateRunSummaryStatus,
  readVerificationRunSummary,
  runCli,
  validateRunSummary,
  validateRunSummaryInput,
  writeVerificationRunSummary,
};
