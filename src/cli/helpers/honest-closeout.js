'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { validateAgainstSchema } = require('../../contracts/schema-validator');
const { readVerificationRunSummary, aggregateRunSummaryStatus } = require('./verification-run-summary');
const {
  resolveTargetRepoRoot,
  validateOutputContainment,
  validateRepoRelativeField,
} = require('./target-repo');

const HONEST_CLOSEOUT_SCHEMA_VERSION = 'honest-closeout.v1';
const HONEST_CLOSEOUT_SCHEMA_PATH = path.join(__dirname, '..', '..', '..', 'docs', 'contracts', 'workflows', 'honest-closeout.schema.json');
const ALLOWED_INPUT_FIELDS = new Set(['run_summary_ref', 'claims']);
const ALLOWED_CLAIM_FIELDS = new Set(['claim_type', 'asserted_status', 'evidence_refs']);
const CLAIM_TYPES = new Set(['validation', 'impact_surface', 'review', 'knowledge_promotion']);

let cachedSchema = null;

function runCli(argv) {
  const args = Array.isArray(argv) ? [...argv] : [];
  const subcommand = args[0];

  if (['--help', '-h'].includes(subcommand)
    || (subcommand === 'validate' && ['--help', '-h'].includes(args[1]))) {
    writeJson({
      status: 'help',
      usage: 'spec-first internal honest-closeout validate --input <claims.json> --target-repo <repo> [--json]',
      input_fields: [...ALLOWED_INPUT_FIELDS],
      claim_fields: [...ALLOWED_CLAIM_FIELDS],
      claim_types: [...CLAIM_TYPES],
      notes: [
        'run_summary_ref 使用 verification-run-summary record 返回的仓库相对路径。',
        'validation 引用 verification-run-summary:<check-id>；其他 claim 使用目标仓库内的普通文件证据。',
        '示例只声明 not-run，不能证明验证通过；asserted_status 必须匹配实际证据。',
        '命令退出码 0 仅表示完成校验，必须读取 overall、overall_reason_code 与每项 verdict。',
      ],
      input_example: {
        run_summary_ref: '.spec-first/workflows/spec-debug/<workspace-slug>/<run-id>/verification-run-summary.json',
        claims: [{ claim_type: 'validation', asserted_status: 'not-run', evidence_refs: ['verification-run-summary:example-check'] }],
      },
    });
    return 0;
  }

  if (subcommand !== 'validate') {
    writeJson({
      status: 'rejected',
      reason_code: 'invalid-command',
      errors: ['Usage: honest-closeout validate --input <payload.json> --target-repo <repo> [--json]'],
    });
    return 2;
  }

  const parsed = parseArgs(args.slice(1));
  if (parsed.errors.length > 0) {
    writeJson({ status: 'rejected', reason_code: 'invalid-arguments', errors: parsed.errors });
    return 2;
  }

  const result = validateHonestCloseoutFromFile(parsed);
  writeJson(result.output);
  return result.exitCode;
}

function parseArgs(args) {
  const parsed = {
    inputPath: '',
    targetRepo: '',
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
    if (arg === '--target-repo') {
      parsed.targetRepo = args[index + 1] || '';
      index += 1;
      continue;
    }
    parsed.errors.push(`unknown argument: ${arg}`);
  }

  if (!parsed.inputPath) parsed.errors.push('--input is required');
  if (!parsed.targetRepo) parsed.errors.push('--target-repo is required');
  return parsed;
}

function validateHonestCloseoutFromFile({ inputPath, targetRepo }) {
  let payload;
  try {
    payload = JSON.parse(fs.readFileSync(path.resolve(inputPath), 'utf8'));
  } catch (error) {
    return rejected('input-json-invalid', [error.message]);
  }

  const target = resolveTargetRepoRoot(targetRepo);
  if (!target.ok) {
    return rejected('target-repo-not-found', target.errors);
  }
  const inputValidation = validateInput(payload);
  if (inputValidation.errors.length > 0) {
    return rejected(inputValidation.reasonCode, inputValidation.errors);
  }

  const output = validateHonestCloseout({ targetRepo, payload });
  const schemaValidation = validateHonestCloseoutOutput(output);
  if (schemaValidation.errors.length > 0) {
    return rejected('honest-closeout-schema-invalid', schemaValidation.errors);
  }

  return {
    exitCode: 0,
    output,
  };
}

function validateHonestCloseout({ targetRepo, payload }) {
  const target = resolveTargetRepoRoot(targetRepo);
  if (!target.ok) {
    return buildOutput([], 'unsupported', 'target-repo-not-found');
  }
  const inputValidation = validateInput(payload);
  if (inputValidation.errors.length > 0) {
    return buildOutput([], 'unsupported', inputValidation.reasonCode);
  }

  const runSummaryResult = payload.run_summary_ref
    ? readVerificationRunSummary({ targetRepo, runSummaryRef: payload.run_summary_ref })
    : null;
  const runSummary = runSummaryResult && runSummaryResult.exitCode === 0
    ? runSummaryResult.output.summary
    : null;
  const runSummaryReason = runSummaryResult && runSummaryResult.output
    ? runSummaryResult.output.reason_code
    : 'run-summary-not-provided';

  if (payload.claims.length === 0) {
    return buildOutput([], 'degraded', 'missing-structured-claims');
  }

  const claims = payload.claims.map((claim) => evaluateClaim(claim, {
    targetRepoRoot: target.root,
    runSummary,
    runSummaryReason,
  }));
  return buildOutput(claims, overallFromClaims(claims), overallReasonFromClaims(claims));
}

function validateInput(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { errors: ['payload must be a JSON object'], reasonCode: 'payload-invalid' };
  }
  validateObjectFields(payload, 'payload', ALLOWED_INPUT_FIELDS, errors);
  if (payload.run_summary_ref !== null && payload.run_summary_ref !== undefined && typeof payload.run_summary_ref !== 'string') {
    errors.push('run_summary_ref must be a string or null');
  }
  if (!Array.isArray(payload.claims)) {
    errors.push('claims must be an array');
  } else {
    payload.claims.forEach((claim, index) => validateClaimInput(claim, index, errors));
  }
  return {
    errors,
    reasonCode: errors.length > 0 ? 'payload-invalid' : null,
  };
}

function validateClaimInput(claim, index, errors) {
  const pointer = `claims[${index}]`;
  if (!claim || typeof claim !== 'object' || Array.isArray(claim)) {
    errors.push(`${pointer} must be an object`);
    return;
  }
  validateObjectFields(claim, pointer, ALLOWED_CLAIM_FIELDS, errors);
  if (!CLAIM_TYPES.has(claim.claim_type)) errors.push(`${pointer}.claim_type is invalid`);
  if (typeof claim.asserted_status !== 'string' || claim.asserted_status.trim() === '') {
    errors.push(`${pointer}.asserted_status must be a non-empty string`);
  }
  if (!Array.isArray(claim.evidence_refs)) {
    errors.push(`${pointer}.evidence_refs must be an array`);
  } else {
    claim.evidence_refs.forEach((ref, refIndex) => {
      if (typeof ref !== 'string' || ref.trim() === '') {
        errors.push(`${pointer}.evidence_refs[${refIndex}] must be a non-empty string`);
      }
    });
  }
}

function evaluateClaim(claim, context) {
  if (claim.evidence_refs.length === 0) {
    return withVerdict(claim, 'unsupported', 'missing-evidence-ref');
  }
  if (claim.claim_type === 'validation') return evaluateValidationClaim(claim, context);
  if (claim.claim_type === 'knowledge_promotion') return evaluateKnowledgeClaim(claim, context);
  if (claim.claim_type === 'impact_surface') return evaluateRepoPathClaim(claim, context, 'impact-surface-evidence-present');
  if (claim.claim_type === 'review') return evaluateRepoPathClaim(claim, context, 'review-evidence-present');
  return withVerdict(claim, 'unsupported', 'unknown-claim-type');
}

function evaluateValidationClaim(claim, context) {
  if (!context.runSummary) {
    return withVerdict(claim, 'unsupported', context.runSummaryReason || 'run-summary-not-readable');
  }
  const refs = claim.evidence_refs
    .filter((ref) => ref.startsWith('verification-run-summary:'))
    .map((ref) => ref.slice('verification-run-summary:'.length));
  if (refs.length === 0) {
    return withVerdict(claim, 'unsupported', 'missing-run-summary-check-ref');
  }
  if (refs.length !== claim.evidence_refs.length) {
    return withVerdict(claim, 'unsupported', 'missing-run-summary-check-ref');
  }
  const checksById = new Map(context.runSummary.checks.map((check) => [check.id, check]));
  const checks = [];
  for (const ref of refs) {
    const check = checksById.get(ref);
    if (!check) {
      return withVerdict(claim, 'unsupported', 'run-summary-check-not-found');
    }
    checks.push(check);
  }
  if (checks.some((check) => check.status !== claim.asserted_status)) {
    return withVerdict(claim, 'unsupported', 'evidence-status-mismatch');
  }
  if (claim.asserted_status === 'passed') {
    // 防 cherry-pick:passed 断言必须反映 run summary 全部 check 的聚合真相,
    // 不能只引用通过的子集而隐藏未覆盖的 not-run/failed/degraded check。
    // 复用 run-summary owner 的全量聚合逻辑,与 spec-work-run-artifact 写入侧一致。
    const aggregate = aggregateRunSummaryStatus(context.runSummary);
    if (aggregate !== 'passed') {
      return withVerdict(claim, 'degraded', 'run-summary-checks-uncovered');
    }
    if (checks.every((check) => check.status === 'passed' && check.ran === true && check.exit_code === 0)) {
      return withVerdict(claim, 'consistent', 'validation-evidence-consistent');
    }
    return withVerdict(claim, 'unsupported', 'evidence-status-mismatch');
  }
  return withVerdict(claim, 'degraded', 'validation-not-verified');
}

function evaluateKnowledgeClaim(claim, context) {
  const evidence = validateEvidenceRefs(claim, context, { allowSpecFirstWorkflows: false });
  if (!evidence.ok) return withVerdict(claim, 'unsupported', evidence.reasonCode);
  const invalid = claim.evidence_refs.find((ref) => !ref.startsWith('docs/solutions/'));
  if (invalid) {
    return withVerdict(claim, 'unsupported', 'knowledge-evidence-not-solution-doc');
  }
  const files = validateEvidenceFiles(claim.evidence_refs, context);
  if (!files.ok) return withVerdict(claim, 'unsupported', files.reasonCode);
  return withVerdict(claim, 'consistent', 'knowledge-evidence-consistent');
}

function evaluateRepoPathClaim(claim, context, successReason) {
  const evidence = validateEvidenceRefs(claim, context, { allowSpecFirstWorkflows: true });
  if (!evidence.ok) return withVerdict(claim, 'unsupported', evidence.reasonCode);
  const files = validateEvidenceFiles(claim.evidence_refs, context);
  if (!files.ok) return withVerdict(claim, 'unsupported', files.reasonCode);
  return withVerdict(claim, 'consistent', successReason);
}

function validateEvidenceRefs(claim, context, options) {
  const errors = [];
  claim.evidence_refs.forEach((ref) => {
    validateRepoRelativeField(ref, 'evidence_refs[]', errors, options);
  });
  if (errors.length > 0) {
    return { ok: false, reasonCode: 'evidence-ref-invalid' };
  }
  for (const ref of claim.evidence_refs) {
    const absolutePath = path.join(context.targetRepoRoot, ref);
    const containment = validateOutputContainment(context.targetRepoRoot, absolutePath);
    if (containment.errors.length > 0) {
      return { ok: false, reasonCode: 'evidence-ref-invalid' };
    }
  }
  return { ok: true, reasonCode: 'evidence-ref-valid' };
}

function validateEvidenceFiles(refs, context) {
  for (const ref of refs) {
    const absolutePath = path.join(context.targetRepoRoot, ref);
    let stat;
    try {
      stat = fs.lstatSync(absolutePath);
    } catch (error) {
      if (error && error.code === 'ENOENT') {
        return { ok: false, reasonCode: 'evidence-ref-not-found' };
      }
      return { ok: false, reasonCode: 'evidence-ref-invalid' };
    }
    if (stat.isSymbolicLink() || !stat.isFile()) {
      return { ok: false, reasonCode: 'evidence-ref-invalid' };
    }
    try {
      const realRepoRoot = fs.realpathSync(path.resolve(context.targetRepoRoot));
      const realEvidencePath = fs.realpathSync(absolutePath);
      const relative = path.relative(realRepoRoot, realEvidencePath);
      if (relative.startsWith('..') || path.isAbsolute(relative)) {
        return { ok: false, reasonCode: 'evidence-ref-invalid' };
      }
    } catch (_error) {
      return { ok: false, reasonCode: 'evidence-ref-invalid' };
    }
  }
  return { ok: true, reasonCode: 'evidence-file-valid' };
}

function withVerdict(claim, verdict, reasonCode) {
  return {
    claim_type: claim.claim_type,
    asserted_status: claim.asserted_status,
    evidence_refs: claim.evidence_refs,
    verdict,
    reason_code: reasonCode,
  };
}

function buildOutput(claims, overall, reasonCode) {
  return {
    schema_version: HONEST_CLOSEOUT_SCHEMA_VERSION,
    generated_at: new Date().toISOString(),
    overall,
    overall_reason_code: reasonCode,
    claims,
  };
}

function overallFromClaims(claims) {
  if (claims.some((claim) => claim.verdict === 'unsupported')) return 'unsupported';
  if (claims.some((claim) => claim.verdict === 'degraded')) return 'degraded';
  return 'verified';
}

function overallReasonFromClaims(claims) {
  if (claims.some((claim) => claim.verdict === 'unsupported')) return 'unsupported-claim';
  if (claims.some((claim) => claim.verdict === 'degraded')) return 'degraded-claim';
  return 'all-claims-consistent';
}

function validateHonestCloseoutOutput(output) {
  const result = validateAgainstSchema(getHonestCloseoutSchema(), output);
  return result.valid ? { errors: [] } : { errors: result.errors };
}

function validateObjectFields(value, pointer, allowedFields, errors) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  for (const field of Object.keys(value)) {
    if (!allowedFields.has(field)) {
      errors.push(`${pointer}.${field} is not allowed`);
    }
  }
}

function getHonestCloseoutSchema() {
  if (!cachedSchema) {
    cachedSchema = JSON.parse(fs.readFileSync(HONEST_CLOSEOUT_SCHEMA_PATH, 'utf8'));
  }
  return cachedSchema;
}

function rejected(reasonCode, errors) {
  return {
    exitCode: 1,
    output: {
      status: 'rejected',
      reason_code: reasonCode,
      errors,
    },
  };
}

function writeJson(payload) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

module.exports = {
  HONEST_CLOSEOUT_SCHEMA_VERSION,
  runCli,
  validateHonestCloseout,
  validateHonestCloseoutOutput,
};
