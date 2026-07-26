'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const {
  GENERATED_RUNTIME_PREFIXES,
  GENERATED_RUNTIME_ROOTS,
} = require('./helpers/target-repo');
const { isSecretDeniedPath } = require('./helpers/secret-deny-patterns');
const {
  parseFrontmatterScalarOccurrences,
  parseFrontmatterScalars,
  splitMarkdownFrontmatter,
} = require('./helpers/markdown-frontmatter');

const CANONICALIZATION_VERSION = 'source-plan-body-v1';
const TASK_PACK_SCHEMA_VERSION = 'task-pack/v1';

// Frozen because these sets are exported; consumers read them (e.g. the parity
// contract test) and must not mutate the module-level singleton.
const REQUIRED_TASK_FIELDS = Object.freeze([
  'task_id',
  'dependencies',
  'files',
  'goal',
  'test_focus',
  'done_signal',
  'wave',
  'stop_if',
]);

const ALLOWED_TASK_FIELDS = new Set([
  ...REQUIRED_TASK_FIELDS,
  'source_unit',
  'requirement_refs',
  'context_refs',
  'entry_hint',
  'parallelizable',
  'expected_side_effects',
  'risk_note',
  'notes',
  'review_gate',
  'review_focus',
  'handoff_owner',
  'target_repo',
  // 语义姿态证据元数据：CLI 只验证字段形状，不判断语义充分性
  'semantic_posture_evidence',
  'dispatch_authorization_evidence',
]);
// Object.freeze does not block Set.add/delete, so null out the mutators to keep
// the exported allow-list immutable. .has()/iteration remain available.
ALLOWED_TASK_FIELDS.add = undefined;
ALLOWED_TASK_FIELDS.delete = undefined;
ALLOWED_TASK_FIELDS.clear = undefined;
Object.freeze(ALLOWED_TASK_FIELDS);

const ALLOWED_REVIEW_GATES = new Set(['optional', 'required']);

const WINDOWS_RESERVED_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;
const WINDOWS_ILLEGAL_SEGMENT_CHARS = /[<>:"|]/;
const CONTROL_CHARS = /[\x00-\x1f]/;
const GENERATED_RUNTIME_MIRROR_PREFIXES = GENERATED_RUNTIME_PREFIXES;
const GENERATED_RUNTIME_MIRROR_ROOTS = new Set(GENERATED_RUNTIME_ROOTS);

function readMarkdownFile(filePath, codePrefix) {
  if (!filePath || !fs.existsSync(filePath)) {
    return {
      text: null,
      error: {
        code: `${codePrefix}-missing`,
        message: `${codePrefix} file is missing.`,
      },
    };
  }

  try {
    return {
      text: fs.readFileSync(filePath, 'utf8'),
      error: null,
    };
  } catch (error) {
    return {
      text: null,
      error: {
        code: `${codePrefix}-unreadable`,
        message: error.message,
      },
    };
  }
}

function computeSourcePlanHash(planPath) {
  const { text, error } = readMarkdownFile(planPath, 'source-plan');
  if (error) {
    return {
      ok: false,
      error,
    };
  }

  const split = splitMarkdownFrontmatter(text);
  if (split.error) {
    return {
      ok: false,
      error: {
        code: 'source-plan-frontmatter-invalid',
        message: split.error.message,
      },
    };
  }

  const hash = crypto.createHash('sha256').update(split.body, 'utf8').digest('hex');
  return {
    ok: true,
    hash: `sha256:${hash}`,
    canonicalization_version: CANONICALIZATION_VERSION,
    removed_frontmatter: split.removedFrontmatter,
    canonical_body_bytes: Buffer.byteLength(split.body, 'utf8'),
  };
}

function parseTaskPackContract(markdown) {
  const heading = /^##\s+Task Pack Contract\s*$/m.exec(markdown);
  if (!heading) {
    return {
      contract: null,
      error: {
        code: 'task-pack-contract-missing',
        message: 'Task Pack Contract section is missing.',
      },
    };
  }

  const sectionStart = heading.index + heading[0].length;
  const rest = markdown.slice(sectionStart);
  const nextHeading = /^##\s+/m.exec(rest);
  const section = nextHeading ? rest.slice(0, nextHeading.index) : rest;
  const fences = [...section.matchAll(/```json\s*([\s\S]*?)\s*```/g)];

  if (fences.length !== 1) {
    return {
      contract: null,
      error: {
        code: fences.length === 0 ? 'task-pack-contract-json-missing' : 'task-pack-contract-json-ambiguous',
        message: 'Task Pack Contract must contain exactly one fenced json block.',
      },
    };
  }

  try {
    return {
      contract: JSON.parse(fences[0][1]),
      error: null,
    };
  } catch (error) {
    return {
      contract: null,
      error: {
        code: 'task-pack-contract-json-invalid',
        message: error.message,
      },
    };
  }
}

function isInsidePath(parentPath, childPath) {
  const relative = path.relative(parentPath, childPath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function realpath(value) {
  const resolver = fs.realpathSync.native || fs.realpathSync;
  return resolver(value);
}

function realpathIfExists(value) {
  return fs.existsSync(value) ? realpath(value) : path.resolve(value);
}

function isConcreteRepoRelativeFile(filePath) {
  if (typeof filePath !== 'string' || filePath.trim() === '') return false;
  if (filePath.includes('\\')) return false;
  if (path.isAbsolute(filePath)) return false;
  if (filePath.includes('...')) return false;
  if (/[*?[\]{}]/.test(filePath)) return false;
  if (filePath.endsWith('/')) return false;
  const segments = filePath.split('/');
  if (segments.some((segment) => segment === '..' || segment === '' || segment === '.')) return false;
  if (segments.some((segment) => (
    segment !== segment.trim() ||
    /[. ]$/.test(segment) ||
    WINDOWS_RESERVED_NAMES.test(segment) ||
    WINDOWS_ILLEGAL_SEGMENT_CHARS.test(segment) ||
    CONTROL_CHARS.test(segment)
  ))) {
    return false;
  }
  const normalized = path.normalize(filePath);
  if (normalized === '.' || normalized.startsWith('..')) return false;
  return true;
}

function isGeneratedRuntimeMirrorPath(filePath) {
  if (typeof filePath !== 'string') return false;
  const normalized = filePath.replace(/\\/g, '/');
  return GENERATED_RUNTIME_MIRROR_ROOTS.has(normalized)
    || GENERATED_RUNTIME_MIRROR_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

function isSafeRepoRelativeScope(value) {
  if (value === '.') return true;
  return isConcreteRepoRelativeFile(value);
}

function isSafeExpectedSideEffectPattern(pattern) {
  if (typeof pattern !== 'string' || pattern.trim() === '') return false;
  if (pattern !== pattern.trim()) return false;
  if (pattern.includes('\\')) return false;
  if (path.isAbsolute(pattern)) return false;
  if (isGeneratedRuntimeMirrorPath(pattern)) return false;
  if (isSecretDeniedPath(pattern)) return false;
  if (pattern.includes('**')) return false;
  if (pattern.includes('...')) return false;
  if (pattern.endsWith('/')) return false;
  const segments = pattern.split('/');
  if (segments.some((segment) => segment === '..' || segment === '' || segment === '.')) return false;
  if (segments.some((segment) => (
    segment !== segment.trim() ||
    /[. ]$/.test(segment) ||
    WINDOWS_RESERVED_NAMES.test(segment.replace(/[*?]/g, 'x')) ||
    WINDOWS_ILLEGAL_SEGMENT_CHARS.test(segment) ||
    CONTROL_CHARS.test(segment)
  ))) {
    return false;
  }
  const normalized = path.normalize(pattern);
  if (normalized === '.' || normalized.startsWith('..')) return false;
  return true;
}

function addFinding(target, code, message, details = {}) {
  target.push({
    code,
    message,
    ...details,
  });
}

function isTaskObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function validateStringArray(value, field, task, errors) {
  if (value === undefined || value === null) return;
  if (!Array.isArray(value)) {
    addFinding(errors, `task-pack-task-${field.replace(/_/g, '-')}-invalid`, `Task '${task.task_id || '<unknown>'}' '${field}' must be an array.`, {
      task_id: task.task_id || null,
      field,
    });
    return;
  }
  for (const item of value) {
    if (!isNonEmptyString(item)) {
      addFinding(errors, `task-pack-task-${field.replace(/_/g, '-')}-item-invalid`, `Task '${task.task_id || '<unknown>'}' '${field}' entries must be non-empty strings.`, {
        task_id: task.task_id || null,
        field,
        value: item,
      });
    }
  }
}

function validateExpectedSideEffects(task, errors) {
  const value = task.expected_side_effects;
  if (value === undefined || value === null) return;
  if (!Array.isArray(value)) {
    addFinding(errors, 'task-pack-task-expected-side-effects-invalid', `Task '${task.task_id || '<unknown>'}' 'expected_side_effects' must be an array.`, {
      task_id: task.task_id || null,
      field: 'expected_side_effects',
    });
    return;
  }
  for (const item of value) {
    if (!isSafeExpectedSideEffectPattern(item)) {
      addFinding(errors, 'task-pack-task-expected-side-effect-invalid', `Task '${task.task_id || '<unknown>'}' expected_side_effects entries must be repo-relative exact paths or bounded globs without **.`, {
        task_id: task.task_id || null,
        field: 'expected_side_effects',
        value: item,
      });
    }
  }
}

function validateOptionalStringFields(task, fields, errors) {
  for (const field of fields) {
    const value = task[field];
    if (value === undefined || value === null || value === '') continue;
    if (!isNonEmptyString(value)) {
      addFinding(errors, `task-pack-task-${field.replace(/_/g, '-')}-invalid`, `Task '${task.task_id || '<unknown>'}' '${field}' must be a non-empty string when provided.`, {
        task_id: task.task_id || null,
        field,
      });
    }
  }
}

function deriveValidity(errors, validation) {
  if (errors.length === 0) return 'valid';
  if (validation.spec_id === 'mismatch') return 'wrong-chain';
  if (validation.source_plan_hash === 'mismatch') return 'stale';
  if (
    validation.source_plan_hash === 'unavailable' ||
    validation.hash_tool === 'unavailable' ||
    errors.some((error) => error.code === 'source-plan-frontmatter-invalid')
  ) {
    return 'unverifiable';
  }
  return 'invalid';
}

function deriveReasonCode(validity, errors) {
  if (validity === 'valid') return 'task_pack_validated';
  if (validity === 'wrong-chain') return 'wrong_chain';
  if (validity === 'stale') return 'stale_hash';
  if (validity === 'unverifiable') return 'unverifiable_hash';
  // invalid: inspect first deterministic error code for a more specific reason
  const first = errors[0] && errors[0].code;
  if (first === 'task-pack-source-plan-file-missing' || first === 'task-pack-source-plan-missing') return 'source_plan_missing';
  if (first && first.includes('contract')) return 'invalid_contract';
  return 'invalid_contract';
}

function validateTaskPack(taskPackPath, options = {}) {
  const repoRoot = realpathIfExists(path.resolve(options.repoRoot || process.cwd()));
  const taskPackCandidate = path.isAbsolute(taskPackPath || '')
    ? path.resolve(taskPackPath || '')
    : path.resolve(repoRoot, taskPackPath || '');
  const resolvedTaskPackPath = realpathIfExists(taskPackCandidate);
  const errors = [];
  const limitations = [];
  const validation = {
    spec_id: 'not_checked',
    source_plan_hash: 'not_checked',
    hash_tool: 'available',
    source_plan_path: 'not_checked',
    task_pack_contract: 'not_checked',
  };

  const result = {
    schema_version: 'task-pack-validation/v1',
    identity_basis: 'source-plan-path+body-hash',
    task_pack_path: resolvedTaskPackPath,
    artifact_root: repoRoot,
    repo_root: repoRoot,
    task_pack_validity: 'invalid',
    deterministic_handoff: false,
    validity_scope: 'identity-freshness-structure-only',
    source_plan: {
      path: null,
      absolute_path: null,
    },
    task_pack: {
      metadata: {},
      contract: null,
      execution_focus: [],
    },
    validation,
    errors,
    limitations,
  };

  if (!fs.existsSync(taskPackCandidate) && !isInsidePath(repoRoot, taskPackCandidate)) {
    addFinding(errors, 'task-pack-file-outside-artifact-root', 'Task pack path must resolve inside artifact root.');
    result.task_pack_validity = deriveValidity(errors, validation);
    result.reason_code = deriveReasonCode(result.task_pack_validity, errors);
    return result;
  }
  if (fs.existsSync(taskPackCandidate) && !isInsidePath(repoRoot, resolvedTaskPackPath)) {
    addFinding(errors, 'task-pack-file-symlink-escape', 'Task pack symlink must resolve inside artifact root.');
    result.task_pack_validity = deriveValidity(errors, validation);
    result.reason_code = deriveReasonCode(result.task_pack_validity, errors);
    return result;
  }

  const taskPackRead = readMarkdownFile(resolvedTaskPackPath, 'task-pack');
  if (taskPackRead.error) {
    addFinding(errors, taskPackRead.error.code, taskPackRead.error.message);
    result.task_pack_validity = deriveValidity(errors, validation);
    result.reason_code = deriveReasonCode(result.task_pack_validity, errors);
    return result;
  }

  const split = splitMarkdownFrontmatter(taskPackRead.text);
  if (split.error) {
    addFinding(errors, 'task-pack-frontmatter-invalid', split.error.message);
  }

  const metadata = parseFrontmatterScalars(split.frontmatter);
  const sourcePlanOccurrences = parseFrontmatterScalarOccurrences(split.frontmatter)
    .filter((occurrence) => occurrence.key === 'source_plan');
  result.task_pack.metadata = metadata;

  const requiredMetadata = {
    type: 'task-pack',
    generated_by: 'spec-write-tasks',
    status: 'derived',
    mode: 'derived',
  };
  for (const [field, expectedValue] of Object.entries(requiredMetadata)) {
    if (metadata[field] !== expectedValue) {
      addFinding(errors, `task-pack-${field}-invalid`, `Task pack frontmatter field '${field}' must be '${expectedValue}'.`, {
        field,
      });
    }
  }

  if (sourcePlanOccurrences.length > 1) {
    validation.source_plan_path = 'invalid';
    addFinding(errors, 'task-pack-source-plan-duplicate', 'Task pack source_plan must occur exactly once.');
  } else if (!metadata.source_plan) {
    validation.source_plan_path = 'missing';
    addFinding(errors, 'task-pack-source-plan-missing', 'Task pack is missing source_plan.');
  } else if (!isConcreteRepoRelativeFile(metadata.source_plan)) {
    validation.source_plan_path = 'invalid';
    addFinding(errors, 'task-pack-source-plan-invalid', 'source_plan must be a concrete repo-relative POSIX file path.');
  } else {
    const sourcePlanPath = path.resolve(repoRoot, metadata.source_plan);
    result.source_plan.path = metadata.source_plan;
    result.source_plan.absolute_path = sourcePlanPath;
    if (!isInsidePath(repoRoot, sourcePlanPath)) {
      validation.source_plan_path = 'invalid';
      addFinding(errors, 'task-pack-source-plan-outside-repo', 'source_plan must resolve inside repo root.');
    } else if (!fs.existsSync(sourcePlanPath)) {
      validation.source_plan_path = 'missing';
      addFinding(errors, 'task-pack-source-plan-file-missing', 'source_plan file does not exist.');
    } else {
      const sourcePlanRealPath = realpath(sourcePlanPath);
      if (!isInsidePath(repoRoot, sourcePlanRealPath)) {
        validation.source_plan_path = 'invalid';
        addFinding(errors, 'task-pack-source-plan-symlink-escape', 'source_plan symlink must resolve inside artifact root.');
      } else {
        result.source_plan.absolute_path = sourcePlanRealPath;
        validation.source_plan_path = 'resolved';
      }
    }
  }

  if (!metadata.source_plan_hash) {
    validation.source_plan_hash = 'missing';
    addFinding(errors, 'task-pack-missing-source-plan-hash', 'Task pack is missing source_plan_hash.');
  } else if (!/^sha256:[a-f0-9]{64}$/.test(metadata.source_plan_hash)) {
    validation.source_plan_hash = 'invalid';
    addFinding(errors, 'task-pack-source-plan-hash-invalid', 'source_plan_hash must be sha256:<64-hex>.');
  }

  if (validation.source_plan_path === 'resolved') {
    const sourcePlanRead = readMarkdownFile(result.source_plan.absolute_path, 'source-plan');
    if (sourcePlanRead.error) {
      validation.source_plan_path = 'missing';
      addFinding(errors, sourcePlanRead.error.code, sourcePlanRead.error.message);
    } else {
      const sourcePlanSplit = splitMarkdownFrontmatter(sourcePlanRead.text);
      if (sourcePlanSplit.error) {
        validation.source_plan_hash = 'unavailable';
        addFinding(errors, 'source-plan-frontmatter-invalid', sourcePlanSplit.error.message);
      } else {
        const sourcePlanMetadata = parseFrontmatterScalars(sourcePlanSplit.frontmatter);
        if (metadata.spec_id && sourcePlanMetadata.spec_id && metadata.spec_id !== sourcePlanMetadata.spec_id) {
          validation.spec_id = 'mismatch';
          addFinding(errors, 'task-pack-wrong-chain', 'Task pack spec_id does not match source plan spec_id.');
        } else if (metadata.spec_id && sourcePlanMetadata.spec_id) {
          validation.spec_id = 'matched';
        } else {
          validation.spec_id = 'missing';
          addFinding(
            limitations,
            'task-pack-spec-id-trace-missing',
            'spec_id compatibility trace is missing on the task pack, source plan, or both; source_plan path and hash remain the executable identity.',
            {
              task_pack_spec_id: metadata.spec_id ? 'present' : 'missing',
              source_plan_spec_id: sourcePlanMetadata.spec_id ? 'present' : 'missing',
            },
          );
        }

        const hashResult = computeSourcePlanHash(result.source_plan.absolute_path);
        if (!hashResult.ok) {
          validation.source_plan_hash = 'unavailable';
          addFinding(errors, hashResult.error.code, hashResult.error.message);
        } else if (metadata.source_plan_hash && /^sha256:[a-f0-9]{64}$/.test(metadata.source_plan_hash)) {
          if (metadata.source_plan_hash === hashResult.hash) {
            validation.source_plan_hash = 'matched';
          } else {
            validation.source_plan_hash = 'mismatch';
            addFinding(errors, 'task-pack-stale', 'Task pack source_plan_hash does not match current source plan hash.', {
              expected_hash: hashResult.hash,
              actual_hash: metadata.source_plan_hash,
            });
          }
        }
      }
    }
  }

  const parsedContract = parseTaskPackContract(taskPackRead.text);
  if (parsedContract.error) {
    validation.task_pack_contract = 'invalid';
    addFinding(errors, parsedContract.error.code, parsedContract.error.message);
  } else {
    result.task_pack.contract = parsedContract.contract;
    const errorCountBeforeContractValidation = errors.length;
    validateTaskPackContract(parsedContract.contract, repoRoot, errors, limitations);
    validation.task_pack_contract = errors.length === errorCountBeforeContractValidation ? 'valid' : 'invalid';
  }

  if (result.task_pack.contract && Array.isArray(result.task_pack.contract.tasks)) {
    result.task_pack.execution_focus = result.task_pack.contract.tasks.filter(isTaskObject).map((task) => ({
      task_id: task.task_id,
      source_unit: task.source_unit || null,
      goal: task.goal || null,
      files: Array.isArray(task.files) ? task.files : [],
      wave: task.wave,
      dependencies: Array.isArray(task.dependencies) ? task.dependencies : [],
      test_focus: task.test_focus || null,
      done_signal: task.done_signal || null,
      stop_if: task.stop_if || null,
      review_gate: task.review_gate || null,
      review_focus: task.review_focus || null,
      target_repo: task.target_repo || null,
      expected_side_effects: Array.isArray(task.expected_side_effects) ? task.expected_side_effects : [],
    }));
  }

  result.task_pack_validity = deriveValidity(errors, validation);
  result.reason_code = deriveReasonCode(result.task_pack_validity, errors);
  result.deterministic_handoff = result.task_pack_validity === 'valid';
  return result;
}

function validateTaskPackContract(contract, repoRoot, errors, limitations) {
  if (!contract || typeof contract !== 'object') {
    addFinding(errors, 'task-pack-contract-invalid', 'Task Pack Contract must be a JSON object.');
    return;
  }
  if (contract.schema_version !== TASK_PACK_SCHEMA_VERSION) {
    addFinding(errors, 'task-pack-contract-schema-version-invalid', `Task Pack Contract schema_version must be ${TASK_PACK_SCHEMA_VERSION}.`);
  }
  if (!Array.isArray(contract.tasks)) {
    addFinding(errors, 'task-pack-contract-tasks-invalid', 'Task Pack Contract tasks must be an array.');
    return;
  }
  if (contract.tasks.length === 0) {
    addFinding(errors, 'task-pack-contract-tasks-empty', 'Task Pack Contract tasks must include at least one task.');
  }
  if (!Array.isArray(contract.execution_waves)) {
    addFinding(errors, 'task-pack-contract-execution-waves-invalid', 'Task Pack Contract execution_waves must be an array.');
    return;
  }
  if (contract.execution_waves.length === 0) {
    addFinding(errors, 'task-pack-contract-execution-waves-empty', 'Task Pack Contract execution_waves must include at least one wave.');
  }

  const taskIds = new Set();
  const taskWaves = new Map();
  const waveIds = new Set();
  const waveOrder = new Map();
  const waveTasks = new Map();
  const taskWaveAppearances = new Map();
  const validTasks = [];

  for (const [index, wave] of contract.execution_waves.entries()) {
    if (!wave || typeof wave !== 'object') {
      addFinding(errors, 'task-pack-wave-invalid', 'Each execution wave must be an object.');
      continue;
    }
    if (wave.wave === undefined || wave.wave === null || wave.wave === '') {
      addFinding(errors, 'task-pack-wave-missing-id', 'Execution wave is missing wave id.');
      continue;
    }
    if (!['string', 'number'].includes(typeof wave.wave)) {
      addFinding(errors, 'task-pack-wave-id-invalid', 'Execution wave id must be a string or number.', { wave: wave.wave });
      continue;
    }
    const waveKey = String(wave.wave);
    if (waveIds.has(waveKey)) {
      addFinding(errors, 'task-pack-wave-duplicate', `Duplicate execution wave '${waveKey}'.`, { wave: wave.wave });
    }
    waveIds.add(waveKey);
    waveOrder.set(waveKey, index);
    if (!Array.isArray(wave.tasks)) {
      addFinding(errors, 'task-pack-wave-tasks-invalid', 'Execution wave tasks must be an array.', { wave: wave.wave });
      continue;
    }
    waveTasks.set(waveKey, wave.tasks);
  }

  for (const task of contract.tasks) {
    if (!isTaskObject(task)) {
      addFinding(errors, 'task-pack-task-invalid', 'Each task must be an object.');
      continue;
    }
    validTasks.push(task);

    for (const key of Object.keys(task)) {
      if (!ALLOWED_TASK_FIELDS.has(key)) {
        addFinding(limitations, 'task-pack-task-unknown-field', `Task '${task.task_id || '<unknown>'}' has unknown field '${key}'.`, {
          task_id: task.task_id || null,
          field: key,
        });
      }
    }

    for (const field of ['task_id', 'goal', 'test_focus', 'done_signal', 'stop_if']) {
      if (task[field] !== undefined && task[field] !== null && task[field] !== '' && !isNonEmptyString(task[field])) {
        addFinding(errors, `task-pack-task-${field.replace(/_/g, '-')}-invalid`, `Task '${task.task_id || '<unknown>'}' '${field}' must be a non-empty string.`, {
          task_id: task.task_id || null,
          field,
        });
      }
    }

    validateOptionalStringFields(task, [
      'source_unit',
      'entry_hint',
      'risk_note',
      'notes',
      'handoff_owner',
    ], errors);

    if (task.target_repo !== undefined && task.target_repo !== null && task.target_repo !== '') {
      if (!isNonEmptyString(task.target_repo)) {
        addFinding(errors, 'task-pack-task-target-repo-invalid', `Task '${task.task_id || '<unknown>'}' 'target_repo' must be a non-empty string.`, {
          task_id: task.task_id || null,
          field: 'target_repo',
        });
      } else if (!isSafeRepoRelativeScope(task.target_repo) || isGeneratedRuntimeMirrorPath(task.target_repo) || isSecretDeniedPath(task.target_repo)) {
        addFinding(errors, 'task-pack-task-target-repo-invalid', `Task '${task.task_id || '<unknown>'}' 'target_repo' must be a safe repo-relative scope.`, {
          task_id: task.task_id || null,
          field: 'target_repo',
          value: task.target_repo,
        });
      }
    }

    if (task.review_gate !== undefined && !ALLOWED_REVIEW_GATES.has(task.review_gate)) {
      addFinding(errors, 'task-pack-task-review-gate-invalid', `Task '${task.task_id || '<unknown>'}' 'review_gate' must be 'optional' or 'required' when provided.`, {
        task_id: task.task_id || null,
        field: 'review_gate',
      });
    }

    validateOptionalStringFields(task, ['review_focus'], errors);

    if (task.parallelizable !== undefined && typeof task.parallelizable !== 'boolean') {
      addFinding(errors, 'task-pack-task-parallelizable-invalid', `Task '${task.task_id || '<unknown>'}' 'parallelizable' must be a boolean when provided.`, {
        task_id: task.task_id || null,
        field: 'parallelizable',
      });
    }

    // 证据元数据字段：CLI 只验证形状（必须为对象），不判断语义充分性
    for (const evidenceField of ['semantic_posture_evidence', 'dispatch_authorization_evidence']) {
      const value = task[evidenceField];
      if (value !== undefined && value !== null) {
        if (typeof value !== 'object' || Array.isArray(value)) {
          addFinding(errors, `task-pack-task-${evidenceField.replace(/_/g, '-')}-invalid`,
            `Task '${task.task_id || '<unknown>'}' '${evidenceField}' must be an object when provided.`, {
              task_id: task.task_id || null,
              field: evidenceField,
            });
        }
      }
    }

    for (const field of REQUIRED_TASK_FIELDS) {
      if (task[field] === undefined || task[field] === null || task[field] === '') {
        addFinding(errors, `task-pack-task-missing-${field.replace(/_/g, '-')}`, `Task '${task.task_id || '<unknown>'}' is missing '${field}'.`, {
          task_id: task.task_id || null,
          field,
        });
      }
    }

    if (!task.source_unit && (!Array.isArray(task.requirement_refs) || task.requirement_refs.length === 0)) {
      addFinding(errors, 'task-pack-task-missing-source-anchor', `Task '${task.task_id || '<unknown>'}' must include source_unit or requirement_refs.`, {
        task_id: task.task_id || null,
      });
    }

    if (isNonEmptyString(task.task_id)) {
      if (taskIds.has(task.task_id)) {
        addFinding(errors, 'task-pack-task-id-duplicate', `Duplicate task_id '${task.task_id}'.`, { task_id: task.task_id });
      }
      taskIds.add(task.task_id);
      taskWaves.set(task.task_id, String(task.wave));
    }

    if (task.wave !== undefined && task.wave !== null && task.wave !== '') {
      const waveType = typeof task.wave;
      if (!['string', 'number'].includes(waveType)) {
        addFinding(errors, 'task-pack-task-wave-invalid', `Task '${task.task_id || '<unknown>'}' wave must be a string or number.`, {
          task_id: task.task_id || null,
          wave: task.wave,
        });
      }
    }

    if (!Array.isArray(task.dependencies)) {
      addFinding(errors, 'task-pack-task-dependencies-invalid', `Task '${task.task_id || '<unknown>'}' dependencies must be an array.`, {
        task_id: task.task_id || null,
      });
    } else {
      validateStringArray(task.dependencies, 'dependencies', task, errors);
    }

    if (!Array.isArray(task.files)) {
      addFinding(errors, 'task-pack-task-files-invalid', `Task '${task.task_id || '<unknown>'}' files must be an array.`, {
        task_id: task.task_id || null,
      });
    } else if (task.files.length === 0) {
      addFinding(errors, 'task-pack-task-files-empty', `Task '${task.task_id || '<unknown>'}' files must include at least one concrete repo-relative file path.`, {
        task_id: task.task_id || null,
      });
    } else {
      const seenFiles = new Set();
      for (const filePath of task.files) {
        if (!isConcreteRepoRelativeFile(filePath)) {
          addFinding(errors, 'task-pack-task-file-not-concrete', `Task '${task.task_id || '<unknown>'}' has non-concrete repo-relative file path.`, {
            task_id: task.task_id || null,
            file: filePath,
          });
          continue;
        }
        if (isGeneratedRuntimeMirrorPath(filePath)) {
          addFinding(errors, 'task-pack-task-file-generated-runtime', `Task '${task.task_id || '<unknown>'}' file points at a generated runtime mirror path.`, {
            task_id: task.task_id || null,
            file: filePath,
          });
        }
        if (isSecretDeniedPath(filePath)) {
          addFinding(errors, 'task-pack-task-file-secret-denied', `Task '${task.task_id || '<unknown>'}' file points at a secret-denied path.`, {
            task_id: task.task_id || null,
            file: filePath,
          });
        }
        const absolute = path.resolve(repoRoot, filePath);
        if (!isInsidePath(repoRoot, absolute)) {
          addFinding(errors, 'task-pack-task-file-outside-repo', `Task '${task.task_id || '<unknown>'}' file resolves outside repo root.`, {
            task_id: task.task_id || null,
            file: filePath,
          });
        }
        if (fs.existsSync(absolute) && fs.statSync(absolute).isDirectory()) {
          addFinding(errors, 'task-pack-task-file-is-directory', `Task '${task.task_id || '<unknown>'}' file path points to a directory.`, {
            task_id: task.task_id || null,
            file: filePath,
          });
        }
        if (seenFiles.has(filePath)) {
          addFinding(errors, 'task-pack-task-file-duplicate', `Task '${task.task_id || '<unknown>'}' lists duplicate file '${filePath}'.`, {
            task_id: task.task_id || null,
            file: filePath,
          });
        }
        seenFiles.add(filePath);
      }
    }

    validateStringArray(task.requirement_refs, 'requirement_refs', task, errors);
    validateStringArray(task.context_refs, 'context_refs', task, errors);
    validateExpectedSideEffects(task, errors);

    if (task.wave !== undefined && !waveIds.has(String(task.wave))) {
      addFinding(errors, 'task-pack-task-wave-missing', `Task '${task.task_id || '<unknown>'}' references a wave that is not declared.`, {
        task_id: task.task_id || null,
        wave: task.wave,
      });
    }
  }

  for (const task of validTasks) {
    if (!Array.isArray(task.dependencies)) continue;
    for (const dependency of task.dependencies) {
      if (!isNonEmptyString(dependency)) continue;
      if (!taskIds.has(dependency)) {
        addFinding(errors, 'task-pack-task-dependency-missing', `Task '${task.task_id || '<unknown>'}' depends on unknown task '${dependency}'.`, {
          task_id: task.task_id || null,
          dependency,
        });
        continue;
      }
      const taskWave = taskWaves.get(task.task_id);
      const dependencyWave = taskWaves.get(dependency);
      if (
        taskWave !== undefined &&
        dependencyWave !== undefined &&
        waveOrder.has(taskWave) &&
        waveOrder.has(dependencyWave) &&
        waveOrder.get(dependencyWave) >= waveOrder.get(taskWave)
      ) {
        addFinding(errors, 'task-pack-task-dependency-wave-invalid', `Task '${task.task_id || '<unknown>'}' depends on '${dependency}' in the same or a later wave.`, {
          task_id: task.task_id || null,
          dependency,
          task_wave: task.wave,
          dependency_wave: dependencyWave,
        });
      }
    }
  }

  for (const [wave, taskList] of waveTasks.entries()) {
    const seenWaveTasks = new Set();
    for (const taskId of taskList) {
      if (!isNonEmptyString(taskId)) {
        addFinding(errors, 'task-pack-wave-task-id-invalid', `Wave '${wave}' task entries must be non-empty strings.`, {
          wave,
          task_id: taskId,
        });
        continue;
      }
      if (seenWaveTasks.has(taskId)) {
        addFinding(errors, 'task-pack-wave-task-duplicate', `Wave '${wave}' lists duplicate task '${taskId}'.`, {
          wave,
          task_id: taskId,
        });
      }
      seenWaveTasks.add(taskId);
      if (!taskWaveAppearances.has(taskId)) taskWaveAppearances.set(taskId, []);
      taskWaveAppearances.get(taskId).push(wave);
      if (!taskIds.has(taskId)) {
        addFinding(errors, 'task-pack-wave-task-missing', `Wave '${wave}' references unknown task '${taskId}'.`, {
          wave,
          task_id: taskId,
        });
      }
    }
  }

  for (const [taskId, waves] of taskWaveAppearances.entries()) {
    const uniqueWaves = [...new Set(waves)];
    if (uniqueWaves.length > 1) {
      addFinding(errors, 'task-pack-wave-task-multiple-waves', `Task '${taskId}' is listed in multiple execution waves.`, {
        task_id: taskId,
        waves: uniqueWaves,
      });
    }
    const declaredWave = taskWaves.get(taskId);
    for (const wave of uniqueWaves) {
      if (declaredWave !== undefined && wave !== declaredWave) {
        addFinding(errors, 'task-pack-task-wave-list-mismatch', `Task '${taskId}' is listed in wave '${wave}' but declares wave '${declaredWave}'.`, {
          task_id: taskId,
          listed_wave: wave,
          declared_wave: declaredWave,
        });
      }
    }
  }

  for (const [taskId, wave] of taskWaves.entries()) {
    const declaredWaveTasks = waveTasks.get(wave);
    if (Array.isArray(declaredWaveTasks) && !declaredWaveTasks.includes(taskId)) {
      addFinding(errors, 'task-pack-task-wave-not-listed', `Task '${taskId}' declares wave '${wave}' but is not listed in that execution wave.`, {
        wave,
        task_id: taskId,
      });
    }
  }

  const tasksByWave = new Map();
  for (const task of validTasks) {
    const waveKey = String(task.wave);
    if (!tasksByWave.has(waveKey)) tasksByWave.set(waveKey, []);
    tasksByWave.get(waveKey).push(task);
  }

  for (const [wave, tasks] of tasksByWave.entries()) {
    const fileOwners = new Map();
    for (const task of tasks) {
      if (!Array.isArray(task.files)) continue;
      for (const filePath of task.files) {
        if (!isConcreteRepoRelativeFile(filePath)) continue;
        if (!fileOwners.has(filePath)) {
          fileOwners.set(filePath, task.task_id);
          continue;
        }
        addFinding(errors, 'task-pack-same-wave-file-overlap', `Tasks '${fileOwners.get(filePath)}' and '${task.task_id}' share file '${filePath}' in wave '${wave}'.`, {
          wave,
          file: filePath,
          task_ids: [fileOwners.get(filePath), task.task_id],
        });
      }
    }
  }
}

module.exports = {
  CANONICALIZATION_VERSION,
  TASK_PACK_SCHEMA_VERSION,
  REQUIRED_TASK_FIELDS,
  ALLOWED_TASK_FIELDS,
  computeSourcePlanHash,
  parseFrontmatterScalars,
  splitMarkdownFrontmatter,
  validateTaskPack,
};
