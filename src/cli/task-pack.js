'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const CANONICALIZATION_VERSION = 'source-plan-body-v1';
const TASK_PACK_SCHEMA_VERSION = 'task-pack/v1';

const REQUIRED_TASK_FIELDS = [
  'task_id',
  'dependencies',
  'files',
  'goal',
  'test_focus',
  'done_signal',
  'wave',
  'stop_if',
];

const ALLOWED_TASK_FIELDS = new Set([
  ...REQUIRED_TASK_FIELDS,
  'source_unit',
  'requirement_refs',
  'context_refs',
  'entry_hint',
  'parallelizable',
  'risk_note',
  'notes',
  'review_focus',
  'handoff_owner',
  'target_repo',
]);

function normalizeNewlines(text) {
  return String(text).replace(/\r\n?/g, '\n');
}

function splitMarkdownFrontmatter(content) {
  const normalized = normalizeNewlines(content);
  const lines = normalized.split('\n');

  if (lines[0] !== '---') {
    return {
      frontmatter: '',
      body: normalized,
      removedFrontmatter: false,
      error: null,
    };
  }

  const closingIndex = lines.findIndex((line, index) => index > 0 && line === '---');
  if (closingIndex === -1) {
    return {
      frontmatter: '',
      body: '',
      removedFrontmatter: false,
      error: {
        code: 'frontmatter-invalid',
        message: 'Frontmatter starts with --- but has no closing --- line.',
      },
    };
  }

  return {
    frontmatter: lines.slice(1, closingIndex).join('\n'),
    body: lines.slice(closingIndex + 1).join('\n'),
    removedFrontmatter: true,
    error: null,
  };
}

function stripQuotes(value) {
  const trimmed = String(value || '').trim();
  return trimmed.replace(/^["']|["']$/g, '');
}

function parseFrontmatterScalars(frontmatter) {
  const metadata = {};
  for (const line of String(frontmatter || '').split('\n')) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    metadata[match[1]] = stripQuotes(match[2]);
  }
  return metadata;
}

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

function isConcreteRepoRelativeFile(filePath) {
  if (typeof filePath !== 'string' || filePath.trim() === '') return false;
  if (filePath.includes('\\')) return false;
  if (path.isAbsolute(filePath)) return false;
  if (filePath.includes('...')) return false;
  if (/[*?[\]{}]/.test(filePath)) return false;
  if (filePath.endsWith('/')) return false;
  const segments = filePath.split('/');
  if (segments.some((segment) => segment === '..' || segment === '' || segment === '.')) return false;
  const normalized = path.normalize(filePath);
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

function validateTaskPack(taskPackPath, options = {}) {
  const repoRoot = path.resolve(options.repoRoot || process.cwd());
  const resolvedTaskPackPath = path.resolve(taskPackPath || '');
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
    task_pack_path: resolvedTaskPackPath,
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

  const taskPackRead = readMarkdownFile(resolvedTaskPackPath, 'task-pack');
  if (taskPackRead.error) {
    addFinding(errors, taskPackRead.error.code, taskPackRead.error.message);
    result.task_pack_validity = deriveValidity(errors, validation);
    return result;
  }

  const split = splitMarkdownFrontmatter(taskPackRead.text);
  if (split.error) {
    addFinding(errors, 'task-pack-frontmatter-invalid', split.error.message);
  }

  const metadata = parseFrontmatterScalars(split.frontmatter);
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

  if (!metadata.spec_id) {
    validation.spec_id = 'missing';
    addFinding(errors, 'task-pack-missing-spec-id', 'Task pack is missing spec_id.');
  }

  if (!metadata.source_plan) {
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
      validation.source_plan_path = 'resolved';
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
        if (!sourcePlanMetadata.spec_id) {
          validation.spec_id = metadata.spec_id ? 'missing' : validation.spec_id;
          addFinding(errors, 'source-plan-missing-spec-id', 'Source plan is missing spec_id.');
        } else if (metadata.spec_id && metadata.spec_id !== sourcePlanMetadata.spec_id) {
          validation.spec_id = 'mismatch';
          addFinding(errors, 'task-pack-wrong-chain', 'Task pack spec_id does not match source plan spec_id.');
        } else if (metadata.spec_id) {
          validation.spec_id = 'matched';
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
    }));
  }

  result.task_pack_validity = deriveValidity(errors, validation);
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
      'review_focus',
      'handoff_owner',
      'target_repo',
    ], errors);

    if (task.parallelizable !== undefined && typeof task.parallelizable !== 'boolean') {
      addFinding(errors, 'task-pack-task-parallelizable-invalid', `Task '${task.task_id || '<unknown>'}' 'parallelizable' must be a boolean when provided.`, {
        task_id: task.task_id || null,
        field: 'parallelizable',
      });
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
  computeSourcePlanHash,
  parseFrontmatterScalars,
  splitMarkdownFrontmatter,
  validateTaskPack,
};
