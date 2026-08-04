#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { isDeepStrictEqual } = require('node:util');

const {
  validateRunDirectory,
} = require('./run-evals');
const {
  RETAINED_EVIDENCE_FILE_CONTRACTS,
  RUN_AUDIT_TOP_LEVEL_CONTRACTS,
} = require('./lib/contract-reset-contract');
const {
  assertAllowedFields,
  assertExactRelativePath,
  assertNoSensitiveContent,
  assertNoSensitiveJson,
  computeTreeHash,
  createRootContext,
  decodeUtf8Strict,
  ensurePrivateDir,
  isWithinRoot,
  listTreeFiles,
  opaqueNamespaceId,
  parseJsonBytes,
  pathsOverlap,
  resolveConfinedPath,
  writePrivateFile,
} = require('./lib/contract-reset-safety');

const TRANSFORMATION_VERSION = 'contract-reset-blind-transform/v1';
const RETAINED_SCHEMA_VERSION = 'contract-reset-retained-evidence/v1';
const RAW_CLEANUP_ALLOWLIST_VERSION = 'contract-reset-raw-cleanup-allowlist/v1';
const MACHINE_IDENTITY_FIELDS = new Set([
  'producer',
  'producer_version',
  'arm',
  'arm_label',
  'session_id',
  'namespace_id',
  'repeat',
  'order_position',
  'run_id',
  'attempt_id',
  'source_path',
  'source_tree_hash',
  'model_visible_manifest_hash',
  'artifact_path',
  'state_identity',
  'status',
  'artifact_readiness',
  'product_contract_readiness',
  'workflow_outcome',
  'readiness_verified_by',
  'readiness_verified_at',
  'readiness_checker_schema',
  'readiness_finding_count',
  'readiness_blocking_count',
  'readiness_prd_hash',
  'readiness_inputs_hash',
]);
const NATIVE_OUTPUT_FIELDS = new Set([
  'schema_version',
  'case_id',
  'arm',
  'repeat',
  'session_id',
  'order_position',
  'namespace_id',
  'source_tree_hash',
  'model_visible_manifest_hash',
  'artifact_path',
  'event_log_path',
  'grading_notes_path',
  'output_hashes',
  'pii_attestation',
  'raw_cleanup_paths',
]);
const OUTPUT_HASH_FIELDS = new Set(['artifact', 'event_log', 'grading_notes']);
const PII_ATTESTATION_FIELDS = new Set(['status', 'reviewer']);
const MODEL_VISIBLE_FIELDS = new Set([
  'schema_version',
  'artifact_type',
  'case_id',
  'intent',
  'authority_profile',
  'review_focus',
  'session_id',
  'repeat',
  'order_position',
  'invocation_profile',
  'source',
  'inputs',
  'limitations',
]);
const MODEL_VISIBLE_SOURCE_FIELDS = new Set(['root', 'tree_hash', 'files']);
const MODEL_VISIBLE_INPUT_FIELDS = new Set(['path', 'sha256', 'bytes']);
const EVENT_LOG_FIELDS = new Set(['schema_version', 'events']);
const EVENT_FIELDS = new Set(['type', 'id', 'material', 'outcome', 'reason_code']);
const GRADING_NOTES_FIELDS = new Set([
  'schema_version',
  'planning_invention',
  'interaction_waste',
  'core_product_quality',
  'material_effect',
  'reason_codes',
  'limitations',
]);
const RAW_CLEANUP_ALLOWLIST = new Map([
  ['provider.log', 'file'],
  ['transcript.txt', 'file'],
  ['sensitive-payload.json', 'file'],
  ['temp-workspace', 'directory'],
]);

function sha256(value) {
  return `sha256:${crypto.createHash('sha256').update(value).digest('hex')}`;
}

function removePartialOutput(tempDir, outDir) {
  fs.rmSync(tempDir, { recursive: true, force: true });
  fs.rmSync(outDir, { recursive: true, force: true });
}

function splitFrontmatter(text) {
  const first = text.match(/^---(\r?\n)/);
  if (!first) return { frontmatter: null, body: text, newline: '\n' };
  const newline = first[1];
  const delimiter = `${newline}---${newline}`;
  const end = text.indexOf(delimiter, first[0].length);
  if (end === -1) return { frontmatter: null, body: text, newline };
  return {
    frontmatter: text.slice(first[0].length, end),
    body: text.slice(end + delimiter.length),
    newline,
  };
}

function frontmatterKey(line) {
  const match = line.match(/^(?:(["'])([A-Za-z0-9_-]+)\1|([A-Za-z0-9_-]+))[\t ]*:/);
  return match ? (match[2] || match[3]).toLowerCase() : null;
}

function buildBlindPacket(artifactText) {
  const parsed = splitFrontmatter(artifactText);
  if (parsed.frontmatter === null) {
    return {
      packet: artifactText,
      body: artifactText,
      stripped_fields: [],
      body_byte_preserved: true,
    };
  }
  const strippedFields = [];
  const keptLines = parsed.frontmatter.split(parsed.newline).filter((line) => {
    const key = frontmatterKey(line);
    if (!key || !MACHINE_IDENTITY_FIELDS.has(key)) return true;
    strippedFields.push(key);
    return false;
  });
  const packet = [
    '---',
    keptLines.join(parsed.newline),
    '---',
    parsed.body,
  ].join(parsed.newline);
  const packetBody = splitFrontmatter(packet).body;
  return {
    packet,
    body: parsed.body,
    stripped_fields: strippedFields,
    body_byte_preserved: Buffer.from(packetBody, 'utf8').equals(Buffer.from(parsed.body, 'utf8')),
  };
}

function assertNonEmptyString(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} must be a non-empty string`);
  }
}

function assertPositiveInteger(value, label) {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${label} must be a positive integer`);
  }
}

function assertExactValue(actual, expected, label) {
  if (!isDeepStrictEqual(actual, expected)) {
    throw new Error(`${label} does not match frozen provenance`);
  }
}

function validatePiiAttestation(value) {
  assertAllowedFields(value, PII_ATTESTATION_FIELDS, 'PII attestation');
  if (value.status !== 'passed') {
    const error = new Error('semantic PII attestation must be passed before durable evidence write');
    error.reason_code = 'pii_attestation_missing';
    throw error;
  }
  if (typeof value.reviewer !== 'string'
    || !/^[A-Za-z0-9][A-Za-z0-9._:@/-]{0,127}$/.test(value.reviewer)) {
    throw new Error('PII attestation reviewer must be a short identifier');
  }
  const retained = { status: 'passed', reviewer: value.reviewer };
  assertNoSensitiveJson('PII attestation', retained);
  assertNoSensitiveContent('PII attestation', JSON.stringify(retained));
  return retained;
}

function validateNativeOutput(native) {
  assertAllowedFields(native, NATIVE_OUTPUT_FIELDS, 'native output manifest');
  if (native.schema_version !== 'contract-reset-native-output/v1') {
    throw new Error('native output schema_version must be contract-reset-native-output/v1');
  }
  for (const field of [
    'case_id',
    'arm',
    'session_id',
    'namespace_id',
    'source_tree_hash',
    'model_visible_manifest_hash',
    'artifact_path',
    'event_log_path',
    'grading_notes_path',
  ]) {
    assertNonEmptyString(native[field], `native output ${field}`);
  }
  assertPositiveInteger(native.repeat, 'native output repeat');
  assertPositiveInteger(native.order_position, 'native output order_position');
  if (!/^ns-[a-f0-9]{20}$/.test(native.namespace_id)) {
    throw new Error('native output namespace_id is invalid');
  }
  assertAllowedFields(native.output_hashes, OUTPUT_HASH_FIELDS, 'native output hashes');
  for (const field of OUTPUT_HASH_FIELDS) {
    if (!/^sha256:[a-f0-9]{64}$/.test(native.output_hashes[field] || '')) {
      throw new Error(`native output ${field} hash is invalid`);
    }
  }
  if (!Array.isArray(native.raw_cleanup_paths)) {
    throw new Error('native output raw_cleanup_paths must be an array');
  }
  return validatePiiAttestation(native.pii_attestation);
}

function validateEventLog(bytes) {
  const value = parseJsonBytes('event log', bytes);
  assertAllowedFields(value, EVENT_LOG_FIELDS, 'event log');
  if (value.schema_version !== 'contract-reset-event-log/v1') {
    throw new Error('event log schema_version must be contract-reset-event-log/v1');
  }
  if (!Array.isArray(value.events)) throw new Error('event log events must be an array');
  value.events.forEach((event, index) => {
    assertAllowedFields(event, EVENT_FIELDS, `event log entry ${index}`);
    assertNonEmptyString(event.type, `event log entry ${index} type`);
    assertNonEmptyString(event.id, `event log entry ${index} id`);
    if (event.material !== undefined && typeof event.material !== 'boolean') {
      throw new Error(`event log entry ${index} material must be boolean`);
    }
  });
  return value;
}

function validateGradingNotes(bytes) {
  const value = parseJsonBytes('grading notes', bytes);
  assertAllowedFields(value, GRADING_NOTES_FIELDS, 'grading notes');
  if (value.schema_version !== 'contract-reset-grading-notes/v1') {
    throw new Error('grading notes schema_version must be contract-reset-grading-notes/v1');
  }
  if (!Number.isFinite(value.planning_invention) || !Number.isFinite(value.interaction_waste)) {
    throw new Error('grading notes numeric rubric fields are required');
  }
  assertNonEmptyString(value.core_product_quality, 'grading notes core_product_quality');
  return value;
}

function validateModelVisibleManifest(options) {
  const {
    runContext,
    sourceManifest,
    native,
    namespaceRoot,
    sourceTreeHash,
  } = options;
  const modelVisibleManifestPath = resolveConfinedPath(
    runContext,
    path.join(namespaceRoot, 'model-visible-manifest.json'),
    'model-visible manifest',
  );
  const modelVisibleManifestBytes = fs.readFileSync(modelVisibleManifestPath);
  const modelVisible = parseJsonBytes('model-visible manifest', modelVisibleManifestBytes);
  assertAllowedFields(modelVisible, MODEL_VISIBLE_FIELDS, 'model-visible manifest');
  if (modelVisible.schema_version !== 'contract-reset-model-visible-manifest/v1') {
    throw new Error('model-visible manifest schema_version is invalid');
  }
  if (modelVisible.artifact_type !== 'generated') {
    throw new Error('model-visible manifest artifact_type must be generated');
  }
  assertExactValue(modelVisible.case_id, native.case_id, 'model-visible case_id');
  assertExactValue(modelVisible.session_id, native.session_id, 'model-visible session_id');
  assertExactValue(modelVisible.repeat, native.repeat, 'model-visible repeat');
  assertExactValue(modelVisible.order_position, native.order_position, 'model-visible order_position');
  assertExactValue(
    modelVisible.invocation_profile,
    sourceManifest.invocation_profile,
    'model-visible invocation_profile',
  );
  assertAllowedFields(modelVisible.source, MODEL_VISIBLE_SOURCE_FIELDS, 'model-visible source');
  if (modelVisible.source.root !== 'source') {
    throw new Error('model-visible source root must be source');
  }
  assertExactValue(modelVisible.source.tree_hash, sourceTreeHash, 'model-visible source tree hash');
  const declaredSourcePaths = (sourceManifest.source_files || []).map((entry) => (
    assertExactRelativePath(entry.path, 'source manifest source file')
  ));
  assertExactValue(modelVisible.source.files, declaredSourcePaths, 'model-visible source files');
  const sourceRoot = resolveConfinedPath(
    runContext,
    path.join(namespaceRoot, 'source'),
    'namespace source root',
    { allowDirectory: true },
  );
  const actualSourcePaths = listTreeFiles(sourceRoot);
  const declaredSourcePathSet = new Set(declaredSourcePaths);
  const undeclaredSourcePath = actualSourcePaths.find((entry) => !declaredSourcePathSet.has(entry));
  if (undeclaredSourcePath) {
    throw new Error(`namespace source contains undeclared file: ${undeclaredSourcePath}`);
  }
  const actualTreeHash = computeTreeHash(sourceRoot, actualSourcePaths);
  assertExactValue(actualTreeHash, sourceTreeHash, 'namespace source tree hash');

  if (!Array.isArray(modelVisible.inputs)) throw new Error('model-visible inputs must be an array');
  const inputPaths = [];
  for (const [index, input] of modelVisible.inputs.entries()) {
    assertAllowedFields(input, MODEL_VISIBLE_INPUT_FIELDS, `model-visible input ${index}`);
    const inputPath = assertExactRelativePath(input.path, `model-visible input ${index} path`);
    if (!inputPath.startsWith('inputs/')) {
      throw new Error(`model-visible input ${index} must stay under inputs/`);
    }
    const absoluteInput = resolveConfinedPath(runContext, path.join(namespaceRoot, inputPath), `model-visible input ${index}`);
    const bytes = fs.readFileSync(absoluteInput);
    assertExactValue(input.sha256, sha256(bytes), `model-visible input ${index} hash`);
    assertExactValue(input.bytes, bytes.length, `model-visible input ${index} bytes`);
    inputPaths.push(inputPath);
  }
  const inputsRoot = resolveConfinedPath(
    runContext,
    path.join(namespaceRoot, 'inputs'),
    'namespace inputs root',
    { allowDirectory: true },
  );
  const actualInputPaths = listTreeFiles(inputsRoot).map((entry) => `inputs/${entry}`);
  assertExactValue(actualInputPaths, [...inputPaths].sort(), 'namespace input files');

  const actualModelVisibleHash = sha256(modelVisibleManifestBytes);
  assertExactValue(
    native.model_visible_manifest_hash,
    actualModelVisibleHash,
    'model-visible manifest hash',
  );
  return {
    modelVisibleManifestPath,
    modelVisibleManifestHash: actualModelVisibleHash,
    sourceRoot,
    inputsRoot,
  };
}

function validateProvenance(options) {
  const {
    runContext,
    native,
    nativeManifestPath,
  } = options;
  const sourceManifestPath = resolveConfinedPath(
    runContext,
    'source-manifest.json',
    'source manifest',
  );
  const sourceManifestBytes = fs.readFileSync(sourceManifestPath);
  const sourceManifest = parseJsonBytes('source manifest', sourceManifestBytes);
  if (sourceManifest.schema_version !== 'contract-reset-source-manifest/v1') {
    throw new Error('source manifest schema_version must be contract-reset-source-manifest/v1');
  }
  const sessions = Array.isArray(sourceManifest.sessions) ? sourceManifest.sessions : [];
  const matchingSessions = sessions.filter((entry) => (
    entry
    && entry.case_id === native.case_id
    && entry.arm === native.arm
    && Number(entry.repeat) === native.repeat
    && entry.session_id === native.session_id
    && Number(entry.order_position) === native.order_position
  ));
  if (matchingSessions.length !== 1) {
    throw new Error('native output does not match exactly one frozen session/arm provenance row');
  }
  const armContract = sourceManifest.arms && sourceManifest.arms[native.arm];
  if (!armContract || typeof armContract.tree_hash !== 'string') {
    throw new Error(`source manifest arm provenance is missing: ${native.arm}`);
  }
  assertExactValue(native.source_tree_hash, armContract.tree_hash, 'native output source tree hash');
  const expectedNamespaceId = opaqueNamespaceId(native.session_id);
  assertExactValue(native.namespace_id, expectedNamespaceId, 'native output namespace_id');
  const namespaceRoot = resolveConfinedPath(
    runContext,
    path.join('namespaces', native.namespace_id),
    'namespace root',
    { allowDirectory: true },
  );
  const modelVisibleFacts = validateModelVisibleManifest({
    runContext,
    sourceManifest,
    native,
    namespaceRoot,
    sourceTreeHash: armContract.tree_hash,
  });
  const outputRoot = resolveConfinedPath(
    runContext,
    path.join(namespaceRoot, 'output'),
    'namespace output root',
    { allowDirectory: true },
  );
  const expectedPaths = {
    artifactPath: path.join(outputRoot, 'product-contract.md'),
    eventLogPath: path.join(outputRoot, 'events.json'),
    gradingNotesPath: path.join(outputRoot, 'grading-notes.json'),
    nativeManifestPath: path.join(outputRoot, 'native-output.json'),
  };
  for (const [field, expectedPath] of Object.entries(expectedPaths)) {
    const actualPath = field === 'artifactPath'
      ? resolveConfinedPath(runContext, native.artifact_path, 'native artifact')
      : field === 'eventLogPath'
        ? resolveConfinedPath(runContext, native.event_log_path, 'event log')
        : field === 'gradingNotesPath'
          ? resolveConfinedPath(runContext, native.grading_notes_path, 'grading notes')
          : nativeManifestPath;
    if (path.resolve(actualPath) !== path.resolve(expectedPath)) {
      throw new Error(`${field} output path does not match namespace provenance`);
    }
  }
  return {
    sourceManifest,
    sourceManifestPath,
    sourceManifestHash: sha256(sourceManifestBytes),
    frozenSession: matchingSessions[0],
    namespaceRoot,
    outputRoot,
    ...modelVisibleFacts,
    ...expectedPaths,
  };
}

function resolveCandidatePath(runContext, filePath, label) {
  if (typeof filePath !== 'string' || !filePath.trim()) {
    throw new Error(`${label} must be a non-empty string`);
  }
  const absolute = path.isAbsolute(filePath)
    ? path.resolve(filePath)
    : path.resolve(runContext.absolute, filePath);
  if (!isWithinRoot(absolute, runContext.absolute)) {
    throw new Error(`${label} escapes the run root: ${filePath}`);
  }
  return absolute;
}

function validateCleanupPaths(options) {
  const {
    runContext,
    cleanupPaths,
    outDir,
    provenance,
  } = options;
  if (!Array.isArray(cleanupPaths)) throw new Error('raw cleanup paths must be an array');
  const rawRoot = path.join(provenance.outputRoot, 'raw');
  if (fs.existsSync(rawRoot)) {
    resolveConfinedPath(runContext, rawRoot, 'raw cleanup root', { allowDirectory: true });
  }
  const protectedPaths = [
    outDir,
    provenance.sourceManifestPath,
    provenance.modelVisibleManifestPath,
    provenance.sourceRoot,
    provenance.inputsRoot,
    provenance.artifactPath,
    provenance.eventLogPath,
    provenance.gradingNotesPath,
    provenance.nativeManifestPath,
  ];
  const seen = new Set();
  return cleanupPaths.map((cleanupPath) => {
    const candidate = resolveCandidatePath(runContext, cleanupPath, 'raw cleanup path');
    if (path.resolve(candidate) === path.resolve(runContext.absolute)) {
      throw new Error('raw cleanup path must not be the run root');
    }
    const protectedPath = protectedPaths.find((entry) => pathsOverlap(candidate, entry));
    if (protectedPath) {
      throw new Error(`raw cleanup path overlaps protected or durable evidence path: ${cleanupPath}`);
    }
    const relative = path.relative(rawRoot, candidate).split(path.sep).join('/');
    const allowedType = RAW_CLEANUP_ALLOWLIST.get(relative);
    if (!allowedType) {
      throw new Error(`raw cleanup path is not in ${RAW_CLEANUP_ALLOWLIST_VERSION}: ${cleanupPath}`);
    }
    const absolute = resolveConfinedPath(
      runContext,
      candidate,
      'raw cleanup path',
      { allowDirectory: allowedType === 'directory' },
    );
    const stat = fs.lstatSync(absolute);
    if ((allowedType === 'file' && !stat.isFile())
      || (allowedType === 'directory' && !stat.isDirectory())) {
      throw new Error(`raw cleanup path type does not match allowlist: ${cleanupPath}`);
    }
    if (seen.has(absolute)) throw new Error(`duplicate raw cleanup path: ${cleanupPath}`);
    seen.add(absolute);
    return absolute;
  });
}

function validateOutputHashes(native, paths) {
  const bytes = {
    artifact: fs.readFileSync(paths.artifactPath),
    event_log: fs.readFileSync(paths.eventLogPath),
    grading_notes: fs.readFileSync(paths.gradingNotesPath),
  };
  for (const [key, value] of Object.entries(bytes)) {
    assertExactValue(native.output_hashes[key], sha256(value), `${key} output hash`);
  }
  return bytes;
}

function prepareEvidence(options) {
  const runContext = createRootContext(options.runRoot, 'run root');
  const nativeManifestPath = resolveConfinedPath(
    runContext,
    options.nativeManifestPath,
    'native output manifest',
  );
  const outDir = resolveConfinedPath(
    runContext,
    options.outDir,
    'durable evidence output',
    { mustExist: false },
  );
  if (path.resolve(outDir) === path.resolve(runContext.absolute)) {
    throw new Error('durable evidence output must not be the run root');
  }
  if (fs.existsSync(outDir)) {
    throw new Error(`durable evidence output already exists: ${outDir}`);
  }

  const nativeManifestBytes = fs.readFileSync(nativeManifestPath);
  const native = parseJsonBytes('native output manifest', nativeManifestBytes);
  const piiAttestation = validateNativeOutput(native);
  const provenance = validateProvenance({ runContext, native, nativeManifestPath });
  const outputBytes = validateOutputHashes(native, provenance);
  const artifactText = decodeUtf8Strict('native artifact', outputBytes.artifact);
  assertNoSensitiveContent('native artifact', artifactText);
  validateEventLog(outputBytes.event_log);
  validateGradingNotes(outputBytes.grading_notes);
  const cleanupPaths = validateCleanupPaths({
    runContext,
    cleanupPaths: native.raw_cleanup_paths,
    outDir,
    provenance,
  });

  const transformed = buildBlindPacket(artifactText);
  if (!transformed.body_byte_preserved) {
    throw new Error('blind transformation changed human-facing body bytes');
  }
  const packetBytes = Buffer.from(transformed.packet, 'utf8');
  assertNoSensitiveContent('blind packet', packetBytes);

  const tempDir = resolveConfinedPath(
    runContext,
    path.join(
      path.dirname(outDir),
      `.${path.basename(outDir)}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`,
    ),
    'durable evidence temporary output',
    { mustExist: false },
  );
  try {
    ensurePrivateDir(tempDir);
    const retained = {
      schema_version: RETAINED_SCHEMA_VERSION,
      artifact_type: 'generated',
      transformation_version: TRANSFORMATION_VERSION,
      producer: 'prepare-contract-reset-evidence.js',
      case_id: native.case_id,
      arm: native.arm,
      repeat: native.repeat,
      session_id: native.session_id,
      order_position: native.order_position,
      body_byte_preserved: transformed.body_byte_preserved,
      stripped_machine_identity_fields: [...new Set(transformed.stripped_fields)].sort(),
      pii_attestation: piiAttestation,
      provenance: {
        source_manifest: {
          path: path.relative(runContext.absolute, provenance.sourceManifestPath).split(path.sep).join('/'),
          sha256: provenance.sourceManifestHash,
          run_id: provenance.sourceManifest.run_id,
          attempt_id: provenance.sourceManifest.attempt_id || null,
          parent_revision: provenance.sourceManifest.parent_revision || null,
        },
        frozen_session: {
          case_id: provenance.frozenSession.case_id,
          arm: provenance.frozenSession.arm,
          repeat: Number(provenance.frozenSession.repeat),
          session_id: provenance.frozenSession.session_id,
          order_position: Number(provenance.frozenSession.order_position),
        },
        namespace: {
          namespace_id: native.namespace_id,
          source_tree_hash: native.source_tree_hash,
          model_visible_manifest_path: path.relative(
            runContext.absolute,
            provenance.modelVisibleManifestPath,
          ).split(path.sep).join('/'),
          model_visible_manifest_hash: provenance.modelVisibleManifestHash,
        },
      },
      hashes: {
        native_output_manifest: sha256(nativeManifestBytes),
        native_artifact: sha256(outputBytes.artifact),
        blind_packet: sha256(packetBytes),
        human_body: sha256(Buffer.from(transformed.body, 'utf8')),
        event_log: sha256(outputBytes.event_log),
        grading_notes: sha256(outputBytes.grading_notes),
      },
      retained_files: {
        sanitized_product_contract: 'sanitized-product-contract.md',
        blind_packet: 'blind-packet.md',
        event_log: 'events.json',
        grading_notes: 'grading-notes.json',
      },
      raw_cleanup_allowlist_version: RAW_CLEANUP_ALLOWLIST_VERSION,
      limitations: [
        'PII adequacy is evaluator-attested rather than script-classified.',
        'This producer confirms deterministic stripping, provenance, and hashes, not semantic product quality.',
      ],
    };
    const retainedManifestBytes = Buffer.from(`${JSON.stringify(retained, null, 2)}\n`, 'utf8');
    assertNoSensitiveJson('retained evidence manifest', retained);
    assertNoSensitiveContent('retained evidence manifest', retainedManifestBytes);
    writePrivateFile(path.join(tempDir, 'sanitized-product-contract.md'), outputBytes.artifact);
    writePrivateFile(path.join(tempDir, 'blind-packet.md'), packetBytes);
    writePrivateFile(path.join(tempDir, 'events.json'), outputBytes.event_log);
    writePrivateFile(path.join(tempDir, 'grading-notes.json'), outputBytes.grading_notes);
    writePrivateFile(path.join(tempDir, 'retained-evidence-manifest.json'), retainedManifestBytes);
    resolveConfinedPath(runContext, tempDir, 'durable evidence temporary output', { allowDirectory: true });
    resolveConfinedPath(runContext, outDir, 'durable evidence output', { mustExist: false });
    fs.renameSync(tempDir, outDir);
    fs.chmodSync(outDir, 0o700);

    if (options.cleanup === true) {
      const revalidatedCleanupPaths = validateCleanupPaths({
        runContext,
        cleanupPaths: native.raw_cleanup_paths,
        outDir,
        provenance,
      });
      for (const cleanupPath of revalidatedCleanupPaths) {
        fs.rmSync(cleanupPath, { recursive: true, force: true });
      }
    }
    return {
      schema_version: 'contract-reset-evidence-preparation/v1',
      artifact_type: 'generated',
      status: 'prepared',
      out_dir: outDir,
      manifest_path: path.join(outDir, 'retained-evidence-manifest.json'),
      hashes: retained.hashes,
      raw_cleanup_count: options.cleanup === true ? cleanupPaths.length : 0,
    };
  } catch (error) {
    removePartialOutput(tempDir, outDir);
    throw error;
  }
}

function prepareRunAudit(options) {
  const runContext = createRootContext(options.runRoot, 'run root');
  const outDir = resolveConfinedPath(
    runContext,
    options.outDir,
    'run audit output',
    { mustExist: false },
  );
  if (path.resolve(outDir) === path.resolve(runContext.absolute)) {
    throw new Error('run audit output must not be the run root');
  }
  if (fs.existsSync(outDir)) throw new Error(`run audit output already exists: ${outDir}`);
  const cleanupRelativePaths = ['namespaces', 'control', '.prepare'];
  if (options.cleanup === true) {
    const overlap = cleanupRelativePaths.find((relativePath) => (
      pathsOverlap(outDir, path.join(runContext.absolute, relativePath))
    ));
    if (overlap) throw new Error(`run audit output overlaps cleanup path: ${overlap}`);
  }
  const validation = validateRunDirectory(runContext.absolute, { repoRoot: options.repoRoot });
  if (validation.status !== 'passed') {
    throw new Error(`run directory validation failed: ${validation.reason_codes.join(',')}`);
  }
  const retainedByName = new Map();
  const retainArtifact = (name, artifactType, expectedHash = null) => {
    const relativePath = assertExactRelativePath(name, 'run audit artifact path');
    if (retainedByName.has(relativePath)) {
      throw new Error(`duplicate run audit artifact path: ${relativePath}`);
    }
    const sourcePath = resolveConfinedPath(runContext, relativePath, `run audit ${relativePath}`);
    const bytes = fs.readFileSync(sourcePath);
    decodeUtf8Strict(`run audit ${relativePath}`, bytes);
    assertNoSensitiveContent(`run audit ${relativePath}`, bytes);
    const contentHash = sha256(bytes);
    if (expectedHash !== null
      && (!/^sha256:[a-f0-9]{64}$/.test(expectedHash) || expectedHash !== contentHash)) {
      throw new Error(`run audit ${relativePath} does not match its retained hash`);
    }
    let resolvedArtifactType = artifactType;
    let document = null;
    if (relativePath.endsWith('.json')) {
      document = parseJsonBytes(`run audit ${relativePath}`, bytes);
      resolvedArtifactType = resolvedArtifactType || document.artifact_type;
      if (!['advisory', 'confirmed', 'generated', 'degraded'].includes(resolvedArtifactType)) {
        throw new Error(`run audit ${relativePath} is missing a valid artifact_type`);
      }
      if (artifactType !== null
        && document.artifact_type !== undefined
        && document.artifact_type !== artifactType) {
        throw new Error(`run audit ${relativePath} artifact_type does not match its contract`);
      }
    }
    const entry = {
      name: relativePath,
      bytes,
      sha256: contentHash,
      artifactType: resolvedArtifactType,
      document,
    };
    retainedByName.set(relativePath, entry);
    return entry;
  };
  for (const contract of RUN_AUDIT_TOP_LEVEL_CONTRACTS) {
    retainArtifact(contract.name, contract.artifactType);
  }
  const runFactsEntry = retainedByName.get('run-facts.json');
  for (const completed of runFactsEntry.document.completed_sessions || []) {
    const reference = completed && completed.retained_evidence;
    if (!reference || typeof reference !== 'object') {
      throw new Error('completed session is missing retained evidence');
    }
    const retainedManifestEntry = retainArtifact(reference.path, 'generated', reference.sha256);
    const retainedManifest = retainedManifestEntry.document;
    if (!retainedManifest
      || retainedManifest.schema_version !== RETAINED_SCHEMA_VERSION
      || !retainedManifest.retained_files
      || typeof retainedManifest.retained_files !== 'object'
      || Array.isArray(retainedManifest.retained_files)
      || !retainedManifest.hashes
      || typeof retainedManifest.hashes !== 'object'
      || Array.isArray(retainedManifest.hashes)) {
      throw new Error(`run audit ${retainedManifestEntry.name} retained evidence contract is invalid`);
    }
    const manifestDirectory = path.posix.dirname(retainedManifestEntry.name);
    for (const [fileKey, contract] of Object.entries(RETAINED_EVIDENCE_FILE_CONTRACTS)) {
      const retainedFile = assertExactRelativePath(
        retainedManifest.retained_files[fileKey],
        `retained evidence ${fileKey}`,
      );
      const retainedPath = manifestDirectory === '.'
        ? retainedFile
        : path.posix.join(manifestDirectory, retainedFile);
      retainArtifact(retainedPath, contract.artifactType, retainedManifest.hashes[contract.hashKey]);
    }
  }
  const retained = [...retainedByName.values()];
  const tempDir = resolveConfinedPath(
    runContext,
    path.join(
      path.dirname(outDir),
      `.${path.basename(outDir)}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`,
    ),
    'run audit temporary output',
    { mustExist: false },
  );
  try {
    ensurePrivateDir(tempDir);
    for (const entry of retained) {
      writePrivateFile(path.join(tempDir, entry.name), entry.bytes);
    }
    const sourceManifest = retainedByName.get('source-manifest.json').document;
    const auditManifest = {
      schema_version: 'contract-reset-run-audit/v1',
      artifact_type: 'generated',
      producer: 'prepare-contract-reset-evidence.js',
      source_run_id: sourceManifest.run_id,
      deterministic_validation: {
        status: validation.status,
        gate_a_status: validation.gate_a_status,
        reason_codes: validation.reason_codes,
      },
      retained_files: Object.fromEntries(retained.map((entry) => [entry.name, {
        sha256: entry.sha256,
        artifact_type: entry.artifactType,
      }])),
      limitations: [
        'No semantic Gate A outcome is inferred from this deterministic export.',
        'Absent model outputs remain absent rather than being replaced by replay or aggregate scores.',
      ],
    };
    const auditManifestBytes = Buffer.from(`${JSON.stringify(auditManifest, null, 2)}\n`, 'utf8');
    assertNoSensitiveJson('run audit manifest', auditManifest);
    assertNoSensitiveContent('run audit manifest', auditManifestBytes);
    writePrivateFile(path.join(tempDir, 'run-audit-manifest.json'), auditManifestBytes);
    resolveConfinedPath(runContext, tempDir, 'run audit temporary output', { allowDirectory: true });
    resolveConfinedPath(runContext, outDir, 'run audit output', { mustExist: false });
    fs.renameSync(tempDir, outDir);
    fs.chmodSync(outDir, 0o700);
    if (options.cleanup === true) {
      for (const relativePath of cleanupRelativePaths) {
        const cleanupPath = path.join(runContext.absolute, relativePath);
        let safeCleanupPath;
        try {
          safeCleanupPath = resolveConfinedPath(
            runContext,
            cleanupPath,
            `run audit cleanup ${relativePath}`,
            { allowDirectory: true },
          );
        } catch (error) {
          if (error && (error.reason_code === 'path_missing' || error.code === 'ENOENT')) continue;
          throw error;
        }
        if (pathsOverlap(safeCleanupPath, outDir)) {
          throw new Error(`run audit cleanup overlaps durable output: ${relativePath}`);
        }
        fs.rmSync(safeCleanupPath, { recursive: true, force: true });
      }
    }
    return {
      schema_version: 'contract-reset-run-audit-preparation/v1',
      artifact_type: 'generated',
      status: 'prepared',
      out_dir: outDir,
      gate_a_status: validation.gate_a_status,
      reason_codes: validation.reason_codes,
      retained_file_count: retained.length + 1,
    };
  } catch (error) {
    removePartialOutput(tempDir, outDir);
    throw error;
  }
}

function parseArgs(argv) {
  const args = { cleanup: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--run-audit') args.runAudit = true;
    else if (arg === '--cleanup') args.cleanup = true;
    else if (arg === '--json') args.json = true;
    else if (arg.startsWith('--')) {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) return { error: `missing value for ${arg}` };
      args[arg.slice(2).replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase())] = value;
      index += 1;
    } else return { error: `unknown argument: ${arg}` };
  }
  return args;
}

function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.error || !args.runRoot || !args.outDir || (!args.runAudit && !args.nativeOutput)) {
    process.stderr.write(`${args.error || 'required: --run-root --out-dir and either --run-audit or --native-output'}\n`);
    return 2;
  }
  try {
    const report = args.runAudit
      ? prepareRunAudit({
        runRoot: args.runRoot,
        outDir: args.outDir,
        repoRoot: args.repoRoot,
        cleanup: args.cleanup,
      })
      : prepareEvidence({
        runRoot: args.runRoot,
        nativeManifestPath: args.nativeOutput,
        outDir: args.outDir,
        cleanup: args.cleanup,
      });
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return 0;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    return 2;
  }
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  main,
  prepareEvidence,
  prepareRunAudit,
};
