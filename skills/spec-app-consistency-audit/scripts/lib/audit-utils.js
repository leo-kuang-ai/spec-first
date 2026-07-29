'use strict';

const { spawnSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const TEXT_FILE_PATTERN = /\.(kt|kts|java|swift|m|mm|xml|json|ya?ml|gradle|properties|txt|md|strings)$/i;
const APP_AUDIT_METADATA_HOSTS = Object.freeze([
  'unknown',
  'claude',
  'codex',
  'cursor',
  'kiro',
  'qoder',
  'opencode',
]);
const GENERATED_OR_CONTROL_ROOTS = Object.freeze([
  '.agents',
  '.claude',
  '.codex',
  '.cursor',
  '.git',
  '.kiro',
  '.opencode',
  '.qoder',
  '.spec-first',
]);
const GENERATED_OR_CONTROL_ROOT_SET = new Set(GENERATED_OR_CONTROL_ROOTS);
const SKIPPED_DIRS = new Set([
  ...GENERATED_OR_CONTROL_ROOTS,
  '.gradle',
  '.idea',
  '.next',
  'DerivedData',
  'Pods',
  'build',
  'dist',
  'node_modules',
  'out',
  'target',
]);
const APP_AUDIT_MODES = new Set(['default', 'headless', 'report-only']);
const ISSUE_SYNTHESIS_STATUSES = new Set(['not_run', 'llm_provided', 'fixture_provided']);
const GIT_REF_PATTERN = /^[A-Za-z0-9._/@{}^~+-]+$/;
const DEFAULT_MAX_SOURCE_HASH_BYTES = 1024 * 1024;
const DEFAULT_MAX_SKIPPED_LARGE_FILES = 50;

function makeArtifact(options) {
  return {
    schema_version: options.schemaVersion,
    artifact_id: options.artifactId,
    generated_at: new Date().toISOString(),
    source_inputs: options.sourceInputs && options.sourceInputs.length > 0
      ? options.sourceInputs
      : [unavailableSourceInput('unknown', 'unavailable', 'input_missing')],
    consumers: options.consumers || ['expert-agents', 'evidence-auditor', 'report-writer'],
    contract_status: options.contractStatus || 'candidate',
    data_sensitivity: options.dataSensitivity || 'internal',
    ...(options.body || {}),
  };
}

function sourceInputFromFile(type, filePath, repoRoot) {
  const absolutePath = path.resolve(filePath);
  return {
    type,
    path: repoRoot ? sourceInputPath(repoRoot, absolutePath, type) : `<${type}:input-path-redacted>`,
    source_hash: hashFile(absolutePath),
    freshness: 'current-worktree',
  };
}

function sourceInputFromFiles(type, files, repoRoot, options = {}) {
  const skippedLargeFiles = Array.isArray(options.skippedLargeFiles) ? options.skippedLargeFiles : [];
  const skippedLargeFileCount = Number.isFinite(options.skippedLargeFileCount)
    ? options.skippedLargeFileCount
    : skippedLargeFiles.length;
  if (options.truncated || skippedLargeFileCount > 0) {
    return {
      type,
      path: options.sourceRoot && repoRoot ? sourceInputPath(repoRoot, options.sourceRoot, 'source') : (repoRoot ? '.' : 'multiple-files'),
      source_hash_unavailable_reason: options.truncated ? 'file_scan_truncated' : 'large_file_skipped',
      freshness: 'partial-worktree',
      file_count: files.length,
      max_files: options.maxFiles || files.length,
      skipped_file_count: skippedLargeFileCount,
      skipped_large_files: skippedLargeFiles.slice(0, DEFAULT_MAX_SKIPPED_LARGE_FILES),
    };
  }
  const fileInputs = files
    .map((filePath) => {
      const relativePath = repoRoot ? publicPath(repoRoot, filePath, 'outside-repo-file') : '<file-path-redacted>';
      return `${relativePath}\0${safeHashFile(filePath)}`;
    })
    .sort();
  return {
    type,
    path: options.sourceRoot && repoRoot ? sourceInputPath(repoRoot, options.sourceRoot, 'source') : (repoRoot ? '.' : 'multiple-files'),
    source_hash: hashText(fileInputs.join('\n')),
    freshness: 'current-worktree',
  };
}

function sourceInputPath(repoRoot, filePath, type = 'input') {
  const visiblePath = publicPath(repoRoot, filePath, `${type}-outside-repo`);
  if (isGeneratedOrControlPath(visiblePath)) {
    return redactedSourceInputPath(type, visiblePath);
  }
  return visiblePath;
}

function isGeneratedOrControlPath(value) {
  const normalized = toPosix(value).replace(/^\.\/+/, '');
  if (!normalized || normalized === '.') return false;
  return GENERATED_OR_CONTROL_ROOT_SET.has(normalized.split('/')[0]);
}

function redactedSourceInputPath(type, pathValue) {
  const label = String(type || 'input')
    .toLowerCase()
    .replace(/[^a-z0-9._:-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'input';
  return `<${label}:${hashText(pathValue).slice(7, 19)}>`;
}

function unavailableSourceInput(type, inputPath, reason) {
  return {
    type,
    path: String(inputPath || type),
    source_hash_unavailable_reason: reason,
    freshness: 'unavailable',
  };
}

function listTextFiles(root, options = {}) {
  return listTextFilesWithMetadata(root, options).files;
}

function listTextFilesWithMetadata(root, options = {}) {
  const absoluteRoot = path.resolve(root || '.');
  const maxFiles = normalizePositiveInteger(options.maxFiles, 2000, 'maxFiles');
  const maxFileBytes = normalizePositiveInteger(options.maxFileBytes, DEFAULT_MAX_SOURCE_HASH_BYTES, 'maxFileBytes');
  const maxSkippedLargeFiles = normalizePositiveInteger(options.maxSkippedLargeFiles, DEFAULT_MAX_SKIPPED_LARGE_FILES, 'maxSkippedLargeFiles');
  const files = [];
  const skippedLargeFiles = [];
  let skippedLargeFileCount = 0;
  let scannedTextLikeFileCount = 0;
  const stack = [absoluteRoot];
  let truncated = false;

  while (stack.length > 0 && scannedTextLikeFileCount < maxFiles) {
    const current = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true })
        .sort((left, right) => left.name.localeCompare(right.name));
    } catch (_error) {
      continue;
    }

    const childDirs = [];
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!SKIPPED_DIRS.has(entry.name)) childDirs.push(fullPath);
        continue;
      }
      if (entry.isFile() && TEXT_FILE_PATTERN.test(entry.name)) {
        scannedTextLikeFileCount += 1;
        let stat = null;
        try {
          stat = fs.statSync(fullPath);
        } catch (_error) {
          continue;
        }
        if (stat.size > maxFileBytes) {
          skippedLargeFileCount += 1;
          if (skippedLargeFiles.length < maxSkippedLargeFiles) {
            skippedLargeFiles.push({
              path: toPosix(path.relative(absoluteRoot, fullPath)),
              size_bytes: stat.size,
              reason: 'file_too_large_for_source_hash',
            });
          }
          if (scannedTextLikeFileCount >= maxFiles) {
            truncated = true;
            break;
          }
          continue;
        }
        files.push(fullPath);
        if (scannedTextLikeFileCount >= maxFiles) {
          truncated = true;
          break;
        }
      }
    }
    stack.push(...childDirs.reverse());
  }

  return {
    files: files.sort((left, right) => left.localeCompare(right)),
    maxFiles,
    maxFileBytes,
    truncated,
    skippedLargeFiles,
    skippedLargeFileCount,
    scannedTextLikeFileCount,
  };
}

function listSourceTextFiles(options = {}) {
  const source = resolveBoundedSourceRoot(options);
  const scan = listTextFilesWithMetadata(source.sourceRoot, {
    maxFiles: options.maxFiles === undefined ? 2000 : options.maxFiles,
    maxFileBytes: options.maxFileBytes === undefined
      ? (options.maxSourceHashBytes === undefined ? DEFAULT_MAX_SOURCE_HASH_BYTES : options.maxSourceHashBytes)
      : options.maxFileBytes,
  });
  const degradedModes = [];
  if (scan.truncated) {
    degradedModes.push(degradedMode(
      'source_scan_truncated',
      'warning',
      'Source scan reached max file limit; source hash is intentionally unavailable.',
      null,
    ));
  }
  if (scan.skippedLargeFileCount > 0) {
    degradedModes.push(degradedMode(
      'source_large_files_skipped',
      'warning',
      'Large text-like files were skipped from source hashing to keep static audit bounded.',
      null,
    ));
  }
  return {
    ...source,
    ...scan,
    degraded_modes: degradedModes,
  };
}

function normalizePositiveInteger(value, defaultValue, field) {
  if (value === undefined || value === null) return defaultValue;
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${field} must be a positive integer`);
  }
  return value;
}

function readTextWithMetadata(filePath, maxBytes = 128 * 1024) {
  const stat = fs.statSync(filePath);
  const bytesToRead = Math.min(maxBytes, stat.size);
  if (bytesToRead <= 0) {
    return {
      filePath,
      text: '',
      truncated: stat.size > 0,
      maxBytes,
      sizeBytes: stat.size,
      bytesRead: 0,
    };
  }
  const buffer = Buffer.alloc(bytesToRead);
  const fd = fs.openSync(filePath, 'r');
  try {
    const bytesRead = fs.readSync(fd, buffer, 0, bytesToRead, 0);
    return {
      filePath,
      text: buffer.slice(0, bytesRead).toString('utf8'),
      truncated: stat.size > bytesRead,
      maxBytes,
      sizeBytes: stat.size,
      bytesRead,
    };
  } finally {
    fs.closeSync(fd);
  }
}

function readText(filePath, maxBytes = 128 * 1024) {
  return readTextWithMetadata(filePath, maxBytes).text;
}

function partialReadDegradedModes(reads, repoRoot, options = {}) {
  const code = options.code || 'semantic_extraction_partial';
  const summary = options.summary || 'Source file exceeded semantic extraction read limit; static contract facts may be incomplete.';
  return (reads || [])
    .filter((entry) => entry && entry.truncated)
    .map((entry) => ({
      code,
      severity: 'warning',
      summary: `${summary} Read ${entry.bytesRead} of ${entry.sizeBytes} bytes.`,
      path: repoRoot ? publicPath(repoRoot, entry.filePath, 'outside-repo-file') : toPosix(entry.filePath),
    }));
}

function includedUntrackedSourceFiles(repoRoot, sourceFiles, untrackedFiles) {
  const root = path.resolve(repoRoot || '.');
  const included = new Set((sourceFiles || [])
    .map((filePath) => publicPath(root, filePath, 'outside-repo-file'))
    .filter((filePath) => typeof filePath === 'string' && !filePath.startsWith('<')));
  return unique((untrackedFiles || [])
    .map(toPosix)
    .filter((filePath) => included.has(filePath)))
    .sort((left, right) => left.localeCompare(right));
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf8'));
}

function readArtifact(filePath) {
  return readJson(filePath);
}

function assertCanWrite(options = {}, targetPath, artifactKind = 'artifact') {
  if (options.mode === 'report-only' && targetPath) {
    throw new Error(`mode:report-only forbids --output and run artifact writes (${artifactKind}).`);
  }
  return targetPath;
}

function writeJsonOutput(result, outputPath, options = {}) {
  const json = `${JSON.stringify(result, null, 2)}\n`;
  if (outputPath) {
    assertCanWrite(options, outputPath, 'json');
    const absolutePath = resolveOutputPath(outputPath, options);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, json);
  } else {
    process.stdout.write(json);
  }
}

function writeTextOutput(text, outputPath, options = {}) {
  if (outputPath) {
    assertCanWrite(options, outputPath, 'text');
    const absolutePath = resolveOutputPath(outputPath, options);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, text);
  } else {
    process.stdout.write(text);
  }
}

function resolveOutputPath(outputPath, options = {}) {
  if (path.isAbsolute(String(outputPath))) return path.resolve(outputPath);
  const repoRoot = resolveRepoRoot(options);
  return resolvePathAgainstRoot(repoRoot, outputPath);
}

function redactForArtifactText(value, options = {}) {
  const maxLength = options.maxLength || 500;
  let text = String(value || '');
  text = redactUrls(text);
  text = text
    .replace(/\bAuthorization\s*[:=]\s*(?:Bearer\s+)?[^\s"'`]+/gi, '<redacted-secret>')
    .replace(/\bBearer\s+[^\s"'`]+/gi, '<redacted-secret>')
    .replace(/\bCookie\s*[:=]\s*[^\r\n]+/gi, '<redacted-secret>')
    .replace(/\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|client[_-]?secret|token|secret|password|passwd|session(?:id)?|jwt)\s*[:=]\s*[^\s&"'`]+/gi, '<redacted-secret>')
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length > maxLength) return `${text.slice(0, Math.max(0, maxLength - 16)).trimEnd()}... [truncated]`;
  return text;
}

function redactUrls(text) {
  return String(text || '').replace(/https?:\/\/[^\s"'<>]+/gi, (raw) => {
    try {
      // URL host/path 也可能泄漏内部产品、Figma、工单或客户上下文。
      new URL(raw);
      return '<redacted-url>';
    } catch (_error) {
      return '<redacted-url>';
    }
  });
}

function sanitizeFigmaReference(value, kind = 'reference') {
  if (!value) return null;
  const raw = String(value);
  const fullHash = hashText(raw);
  const hash = fullHash.slice(7, 19);
  const result = {
    reference_provided: true,
    reference_kind: kind,
    reference_hash: fullHash,
    path: `figma-${kind}:${hash}`,
  };
  try {
    const parsed = new URL(raw);
    result.reference_type = 'url';
    result.reference_host = parsed.host;
    result.has_query = parsed.search.length > 0;
  } catch (_error) {
    result.reference_type = 'opaque';
  }
  return result;
}

function buildFigmaReference(options = {}) {
  if (options.figmaRef) return sanitizeFigmaReference(options.figmaRef, 'ref');
  if (options.figmaNode) return sanitizeFigmaReference(options.figmaNode, 'node');
  if (options.figmaFile) return sanitizeFigmaReference(options.figmaFile, 'file');
  return null;
}

function buildAppAuditInputExpectations(options = {}) {
  const expected = new Set(options.expectedInputs || []);
  return {
    source: 'required:available',
    prd: `${expected.has('prd') ? 'expected' : 'opportunistic'}:${options.prd ? 'available' : 'missing'}`,
    figma_context: `${expected.has('figma_context') ? 'expected' : 'opportunistic'}:${options.figmaContext ? 'available' : 'missing'}`,
    tech_plan: `${expected.has('tech_plan') ? 'expected' : 'not_applicable'}:${options.techPlan ? 'available' : 'not_provided'}`,
    task_doc: `${expected.has('task_doc') ? 'expected' : 'not_applicable'}:${options.taskDoc ? 'available' : 'not_provided'}`,
  };
}

function buildAppAuditCoverageCapabilities(options = {}) {
  return {
    code_static: 'available',
    product_consistency: options.prd ? 'available' : 'unavailable',
    design_consistency: options.figmaContext ? 'available' : (buildFigmaReference(options) ? 'degraded' : 'unavailable'),
    architecture_static: 'available',
    architecture_intent_conformance: options.techPlan ? 'available' : 'unavailable',
    task_fidelity: options.taskDoc ? 'available' : 'unavailable',
    runtime_verification: 'deferred',
    industry: options.confirmedIndustry ? 'confirmed_profile' : (options.industry ? 'advisory_only' : 'unavailable'),
  };
}

function buildAppAuditVerdictScope(options = {}) {
  if (options.prd && options.figmaContext) return 'full_app_consistency_audit';
  if (options.prd || options.figmaContext) return 'product_design_consistency_audit';
  return 'source_only_app_static_audit';
}

function evidence(source, filePath, summary, extra = {}) {
  return {
    source,
    file: filePath ? toPosix(filePath) : null,
    summary,
    ...extra,
  };
}

function unique(values) {
  return [...new Set(values.filter((value) => value !== undefined && value !== null && String(value).length > 0))];
}

function slugify(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return normalized || 'item';
}

function normalizeName(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '');
}

function classifyStates(text) {
  const lower = String(text || '').toLowerCase();
  const states = [];
  const checks = [
    ['loading', /loading|submitting|progress|加载|提交中/],
    ['empty', /empty|no data|空态|暂无/],
    ['error', /error|failed|failure|异常|错误|失败/],
    ['success', /success|done|complete|成功|完成/],
    ['disabled', /disabled|disable|不可用|禁用/],
    ['offline', /offline|network|weak|断网|弱网/],
    ['permission_denied', /permission|denied|unauthorized|权限|拒绝/],
    ['retry', /retry|重试/],
  ];
  for (const [state, pattern] of checks) {
    if (pattern.test(lower)) states.push(state);
  }
  return unique(states);
}

function classifyEventKind(eventName) {
  const lower = String(eventName || '').toLowerCase();
  if (/page|view|screen|曝光/.test(lower)) return 'page_view';
  if (/click|tap|press|select/.test(lower)) return 'click';
  if (/submit|confirm|commit|pay|order/.test(lower)) return 'submit';
  if (/success|complete|done/.test(lower)) return 'success';
  if (/fail|error|reject|cancel/.test(lower)) return 'failed';
  if (/exposure|impression|show/.test(lower)) return 'exposure';
  return 'custom';
}

function parseCommonArgs(argv) {
  const options = {
    mode: 'default',
    depth: 'default',
    fromCodeReview: false,
    expectedInputs: [],
  };
  const modeTokens = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const token = parseCanonicalToken(arg);
    if (token) {
      applyCanonicalToken(options, token, modeTokens);
    } else if (arg === '--mode') {
      const mode = argv[++index];
      setMode(options, mode, modeTokens);
    } else if (arg === '--source') options.source = argv[++index];
    else if (arg === '--repo-root') options.repoRoot = argv[++index];
    else if (arg === '--base') options.base = argv[++index];
    else if (arg === '--prd') options.prd = argv[++index];
    else if (arg === '--figma-context') options.figmaContext = argv[++index];
    else if (arg === '--figma-ref') options.figmaRef = argv[++index];
    else if (arg === '--product-contract') options.productContract = argv[++index];
    else if (arg === '--figma-contract') options.figmaContract = argv[++index];
    else if (arg === '--figma-node') options.figmaNode = argv[++index];
    else if (arg === '--figma-file') options.figmaFile = argv[++index];
    else if (arg === '--redaction') options.redaction = argv[++index];
    else if (arg === '--platform') options.platform = argv[++index];
    else if (arg === '--code-contract') options.codeContract = argv[++index];
    else if (arg === '--architecture-contract') options.architectureContract = argv[++index];
    else if (arg === '--analytics-contract') options.analyticsContract = argv[++index];
    else if (arg === '--i18n-contract') options.i18nContract = argv[++index];
    else if (arg === '--industry-profile') options.industryProfile = argv[++index];
    else if (arg === '--pilot-validation') options.pilotValidation = argv[++index];
    else if (arg === '--preflight') options.preflight = argv[++index];
    else if (arg === '--industry') options.industry = argv[++index];
    else if (arg === '--tech-plan') options.techPlan = argv[++index];
    else if (arg === '--task-doc') options.taskDoc = argv[++index];
    else if (arg === '--run-id') options.runId = argv[++index];
    else if (arg === '--run-dir') options.runDir = argv[++index];
    else if (arg === '--artifacts-dir') options.artifactsDir = argv[++index];
    else if (arg === '--host') options.host = argv[++index];
    else if (arg === '--status') options.status = argv[++index];
    else if (arg === '--metadata') options.metadata = argv[++index];
    else if (arg === '--report') options.report = argv[++index];
    else if (arg === '--reason-code') options.reasonCode = argv[++index];
    else if (arg === '--message') options.message = argv[++index];
    else if (arg === '--expected-input') {
      options.expectedInputs = options.expectedInputs || [];
      options.expectedInputs.push(argv[++index]);
    } else if (arg === '--from-code-review') options.fromCodeReview = true;
    else if (arg === '--deep') options.depth = 'deep';
    else if (arg === '--confirmed-industry') options.confirmedIndustry = argv[++index];
    else if (arg === '--allow-outside') {
      options.allowOutside = options.allowOutside || [];
      options.allowOutside.push(argv[++index]);
    } else if (arg === '--max-files') options.maxFiles = Number(argv[++index]);
    else if (arg === '--max-scan-files') options.maxScanFiles = Number(argv[++index]);
    else if (arg === '--prd-max-bytes') options.prdMaxBytes = Number(argv[++index]);
    else if (arg === '--artifacts') {
      options.artifacts = options.artifacts || [];
      options.artifacts.push(argv[++index]);
    } else if (arg === '--issue') {
      options.issues = options.issues || [];
      options.issues.push(argv[++index]);
    } else if (arg === '--issues-artifact') options.issuesArtifact = true;
    else if (arg === '--issue-synthesis-status') options.issueSynthesisStatus = argv[++index];
    else if (arg === '--output') options.output = argv[++index];
    else if (!arg.startsWith('--') && !options.source) options.source = arg;
  }
  finalizeModeOptions(options, modeTokens);
  return options;
}

function parseCanonicalToken(arg) {
  const match = String(arg || '').match(/^([a-z][a-z-]*):(.*)$/);
  if (!match) return null;
  const key = match[1];
  const value = match[2];
  const known = new Set([
    'mode',
    'base',
    'source',
    'prd',
    'figma-context',
    'figma-ref',
    'industry',
    'tech-plan',
    'task-doc',
    'depth',
    'from',
    'expected-input',
    'run-id',
    'run-dir',
    'issue-synthesis-status',
  ]);
  return known.has(key) ? { key, value } : null;
}

function applyCanonicalToken(options, token, modeTokens) {
  switch (token.key) {
    case 'mode':
      setMode(options, token.value, modeTokens);
      break;
    case 'base':
      options.base = token.value;
      break;
    case 'source':
      options.source = token.value;
      break;
    case 'prd':
      options.prd = token.value;
      break;
    case 'figma-context':
      options.figmaContext = token.value;
      break;
    case 'figma-ref':
      options.figmaRef = token.value;
      break;
    case 'industry':
      options.industry = token.value;
      break;
    case 'tech-plan':
      options.techPlan = token.value;
      break;
    case 'task-doc':
      options.taskDoc = token.value;
      break;
    case 'depth':
      options.depth = token.value || 'default';
      break;
    case 'from':
      options.fromCodeReview = token.value === 'code-review';
      options.from = token.value;
      break;
    case 'expected-input':
      options.expectedInputs = options.expectedInputs || [];
      options.expectedInputs.push(token.value);
      break;
    case 'run-id':
      options.runId = token.value;
      break;
    case 'run-dir':
      options.runDir = token.value;
      break;
    case 'issue-synthesis-status':
      options.issueSynthesisStatus = token.value;
      break;
    default:
      break;
  }
}

function setMode(options, mode, modeTokens) {
  if (!APP_AUDIT_MODES.has(mode)) {
    throw new Error(`Invalid app-audit mode: ${mode}`);
  }
  options.mode = mode;
  modeTokens.push(mode);
}

function finalizeModeOptions(options, modeTokens) {
  if (new Set(modeTokens).size > 1 || modeTokens.length > 1) {
    throw new Error(`conflicting mode flags: ${modeTokens.join(', ')}`);
  }
  if (options.depth && !['default', 'deep'].includes(options.depth)) {
    throw new Error(`Invalid app-audit depth: ${options.depth}`);
  }
  if (options.issueSynthesisStatus && !ISSUE_SYNTHESIS_STATUSES.has(options.issueSynthesisStatus)) {
    throw new Error(`Invalid issue_synthesis_status: ${options.issueSynthesisStatus}`);
  }
  if (options.mode === 'report-only' && options.output) {
    throw new Error('mode:report-only forbids --output and run artifact writes.');
  }
  if ((options.mode === 'headless' || options.mode === 'report-only') && options.figmaRef && !options.figmaContext) {
    options.degraded_modes = options.degraded_modes || [];
    options.degraded_modes.push(degradedMode(
      'input_figma_reference_only',
      'warning',
      'Figma reference was provided without materialized context; non-interactive modes do not fetch remote Figma data.',
      null,
    ));
  }
}

function createRunId(date = new Date()) {
  return `${date.toISOString().replace(/[-:]/g, '').replace(/\..+$/, '').replace('T', '-')}-${crypto.randomBytes(4).toString('hex')}`;
}

function resolveRunDir(options = {}) {
  if (options.mode === 'report-only') return null;
  const repoRoot = resolveRepoRoot(options);
  const runId = options.runId || createRunId();
  const runDir = options.runDir
    ? resolvePathAgainstRoot(repoRoot, options.runDir)
    : path.join(repoRoot, '.spec-first', 'app-audit', 'runs', runId);
  return {
    runId,
    runDir,
    relativeRunDir: publicPath(repoRoot, runDir, 'run-outside-repo'),
  };
}

function relativeTo(root, filePath) {
  return publicPath(path.resolve(root || '.'), path.resolve(filePath), 'outside-repo-file');
}

function hashFile(filePath) {
  return hashText(fs.readFileSync(filePath));
}

function safeHashFile(filePath) {
  try {
    return hashFile(filePath);
  } catch (error) {
    return `unreadable:${error.code || 'read_failed'}`;
  }
}

function hashText(value) {
  return `sha256:${crypto.createHash('sha256').update(value).digest('hex')}`;
}

function collectGitDiffFacts(repoRoot, options = {}) {
  const cwd = path.resolve(repoRoot || '.');
  const untrackedFiles = gitLines(cwd, ['ls-files', '--others', '--exclude-standard'])
    .map(toPosix)
    .filter(Boolean);
  if (options.base) {
    const resolvedBase = resolveGitCommit(cwd, options.base);
    const mergeBase = resolveMergeBase(cwd, resolvedBase) || resolvedBase;
    const diffResult = gitResult(cwd, ['diff', '--no-ext-diff', '--no-textconv', '-U0', mergeBase, '--']);
    const namesResult = gitResult(cwd, ['diff', '--no-ext-diff', '--no-textconv', '--name-only', mergeBase, '--']);
    if (diffResult.status !== 0 || namesResult.status !== 0) {
      throw new Error(`scope_base_unresolved: unable to diff against ${options.base}.`);
    }
    const diff = diffResult.stdout;
    return {
      kind: 'git_diff',
      base_ref: options.base,
      resolved_base_sha: resolvedBase,
      effective_base_sha: mergeBase,
      changedFiles: namesResult.stdout.split(/\r?\n/).map(toPosix).filter(Boolean),
      diffText: diff,
      diffHash: hashText(diff),
      untrackedFiles,
    };
  }
  if (isGitRepo(cwd)) {
    const diff = [
      gitText(cwd, ['diff', '--no-ext-diff', '--no-textconv', '-U0', '--']),
      gitText(cwd, ['diff', '--cached', '--no-ext-diff', '--no-textconv', '-U0', '--']),
    ].join('\n');
    const changedFiles = unique([
      ...gitLines(cwd, ['diff', '--no-ext-diff', '--no-textconv', '--name-only', '--']),
      ...gitLines(cwd, ['diff', '--cached', '--no-ext-diff', '--no-textconv', '--name-only', '--']),
    ].map(toPosix));
    return {
      kind: 'working_tree',
      base_ref: '',
      resolved_base_sha: '',
      effective_base_sha: '',
      changedFiles,
      diffText: diff,
      diffHash: hashText(diff),
      untrackedFiles,
    };
  }
  return {
    kind: 'source_snapshot',
    base_ref: '',
    resolved_base_sha: '',
    effective_base_sha: '',
    changedFiles: [],
    diffText: '',
    diffHash: 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
    untrackedFiles: [],
  };
}

function resolveGitCommit(cwd, ref) {
  validateGitBaseRef(ref);
  if (!isGitRepo(cwd)) {
    throw new Error('scope_base_unresolved: base:<ref> requires a git worktree.');
  }
  const result = gitResult(cwd, ['rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`]);
  if (result.status !== 0) {
    throw new Error(`scope_base_unresolved: unable to resolve base ref ${ref}.`);
  }
  return result.stdout.trim();
}

function validateGitBaseRef(ref) {
  const value = String(ref || '');
  if (!value) throw new Error('scope_base_unresolved: base:<ref> is empty.');
  if (value.length > 200 || value.startsWith('-') || value.includes('://') || /[\s\u0000-\u001f\u007f]/.test(value) || !GIT_REF_PATTERN.test(value)) {
    throw new Error('scope_base_unresolved: unsafe base ref.');
  }
}

function resolveMergeBase(cwd, baseSha) {
  const result = gitResult(cwd, ['merge-base', 'HEAD', baseSha]);
  return result.status === 0 ? result.stdout.trim() : '';
}

function isGitRepo(cwd) {
  return spawnSync('git', ['rev-parse', '--is-inside-work-tree'], { cwd, encoding: 'utf8' }).status === 0;
}

function gitLines(cwd, args) {
  return gitText(cwd, args).split(/\r?\n/).filter(Boolean);
}

function gitText(cwd, args) {
  const result = gitResult(cwd, args);
  return result.status === 0 ? result.stdout : '';
}

function gitResult(cwd, args) {
  return spawnSync('git', args, { cwd, encoding: 'utf8' });
}

function resolveRepoRoot(options = {}) {
  const explicitRepoRoot = options.repoRoot ? path.resolve(options.repoRoot) : null;
  const sourcePath = options.source ? String(options.source) : null;
  const sourceIsAbsolute = sourcePath ? path.isAbsolute(sourcePath) : false;
  const candidate = explicitRepoRoot
    || (sourceIsAbsolute ? path.resolve(sourcePath) : process.cwd());
  const existingCandidate = existingDirectoryFor(candidate);
  const gitTopLevel = discoverGitTopLevel(existingCandidate);
  return fs.existsSync(gitTopLevel || existingCandidate)
    ? fs.realpathSync(gitTopLevel || existingCandidate)
    : path.resolve(gitTopLevel || existingCandidate);
}

function resolvePathAgainstRoot(root, maybePath) {
  const value = String(maybePath || '.');
  return path.isAbsolute(value) ? path.resolve(value) : path.resolve(root, value);
}

function discoverGitTopLevel(startPath) {
  const cwd = existingDirectoryFor(startPath);
  if (!fs.existsSync(cwd)) return '';
  const result = gitResult(cwd, ['rev-parse', '--show-toplevel']);
  if (result.status !== 0) return '';
  const topLevel = result.stdout.trim();
  return topLevel && fs.existsSync(topLevel) ? fs.realpathSync(topLevel) : topLevel;
}

function existingDirectoryFor(inputPath) {
  let current = path.resolve(inputPath || '.');
  if (fs.existsSync(current) && fs.statSync(current).isFile()) current = path.dirname(current);
  while (!fs.existsSync(current)) {
    const parent = path.dirname(current);
    if (parent === current) return current;
    current = parent;
  }
  if (!fs.statSync(current).isDirectory()) return path.dirname(current);
  return current;
}

function resolveBoundedInputPath(options) {
  const repoRoot = fs.existsSync(path.resolve(options.repoRoot || '.'))
    ? fs.realpathSync(path.resolve(options.repoRoot || '.'))
    : path.resolve(options.repoRoot || '.');
  const requested = resolvePathAgainstRoot(repoRoot, options.inputPath || '.');
  const result = {
    ok: false,
    kind: options.kind,
    path: requested,
    realpath: null,
    reason_code: null,
    reason: null,
  };

  if (!fs.existsSync(requested)) {
    result.reason_code = `${options.kind}_missing`;
    result.reason = `${options.kind} path does not exist.`;
    return result;
  }

  const stat = fs.statSync(requested);
  if (options.expected === 'file' && !stat.isFile()) {
    result.reason_code = `${options.kind}_not_file`;
    result.reason = `${options.kind} path is not a file.`;
    return result;
  }
  if (options.expected === 'directory' && !stat.isDirectory()) {
    result.reason_code = `${options.kind}_not_directory`;
    result.reason = `${options.kind} path is not a directory.`;
    return result;
  }

  const allowOutside = normalizeAllowOutside(repoRoot, options.allowOutside || []);
  const requestedLocation = resolvePathLocation(requested);
  const realpath = fs.realpathSync(requested);
  result.realpath = realpath;
  const requestedInside = isInsideOrSame(repoRoot, requestedLocation);
  const realInside = isInsideOrSame(repoRoot, realpath);
  const outsideAllowed = allowOutside.some((allowedRoot) => isInsideOrSame(allowedRoot, realpath));

  if (requestedInside && !realInside && !outsideAllowed) {
    result.reason_code = 'symlink_escape';
    result.reason = `${options.kind} resolves outside repo root through a symlink.`;
    return result;
  }
  if (!realInside && !outsideAllowed) {
    result.reason_code = 'path_outside_repo';
    result.reason = `${options.kind} path is outside repo root and not allowlisted.`;
    return result;
  }
  if (options.maxBytes && stat.size > options.maxBytes) {
    result.reason_code = 'file_too_large';
    result.reason = `${options.kind} file exceeds max size ${options.maxBytes} bytes.`;
    return result;
  }

  result.ok = true;
  result.reason_code = '';
  result.reason = '';
  return result;
}

function resolveBoundedSourceRoot(options = {}) {
  const repoRoot = resolveRepoRoot(options);
  const resolution = resolveBoundedInputPath({
    repoRoot,
    inputPath: options.source || '.',
    kind: 'source',
    expected: 'directory',
    allowOutside: options.allowOutside || options.allowOutsidePaths || [],
  });
  if (!resolution.ok) {
    throw new Error(`source rejected: ${resolution.reason}`);
  }
  const relativeSourceRoot = publicPath(repoRoot, resolution.realpath, 'source-outside-repo');
  if (isGeneratedOrControlPath(relativeSourceRoot)) {
    throw new Error(`source rejected: generated/control runtime path is not auditable product source (${relativeSourceRoot}).`);
  }
  return {
    repoRoot,
    sourceRoot: resolution.realpath,
  };
}

function publicPath(repoRoot, filePath, label = 'outside-repo') {
  if (!filePath) return null;
  const absolutePath = path.resolve(repoRoot || '.', String(filePath));
  const root = path.resolve(repoRoot || '.');
  if (isInsideOrSame(root, absolutePath)) return toPosix(path.relative(root, absolutePath)) || '.';
  return `<${label}:${hashText(absolutePath).slice(7, 19)}>`;
}

function degradedMode(code, severity, summary, filePath) {
  return {
    code,
    severity,
    summary,
    path: filePath ? toPosix(filePath) : null,
  };
}

function normalizeAllowOutside(repoRoot, values) {
  return []
    .concat(values || [])
    .filter(Boolean)
    .map((entry) => path.resolve(repoRoot, String(entry)))
    .filter((entry) => fs.existsSync(entry))
    .map((entry) => fs.realpathSync(entry));
}

function isInsideOrSame(parentPath, childPath) {
  const relative = path.relative(parentPath, childPath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function resolvePathLocation(filePath) {
  const parent = path.dirname(filePath);
  if (!fs.existsSync(parent)) return filePath;
  return path.join(fs.realpathSync(parent), path.basename(filePath));
}

function toPosix(value) {
  return String(value || '').replace(/\\/g, '/');
}

module.exports = {
  APP_AUDIT_METADATA_HOSTS,
  DEFAULT_MAX_SOURCE_HASH_BYTES,
  DEFAULT_MAX_SKIPPED_LARGE_FILES,
  GENERATED_OR_CONTROL_ROOTS,
  ISSUE_SYNTHESIS_STATUSES,
  assertCanWrite,
  buildFigmaReference,
  buildAppAuditCoverageCapabilities,
  buildAppAuditInputExpectations,
  buildAppAuditVerdictScope,
  classifyEventKind,
  classifyStates,
  collectGitDiffFacts,
  createRunId,
  evidence,
  hashFile,
  hashText,
  listSourceTextFiles,
  listTextFiles,
  listTextFilesWithMetadata,
  makeArtifact,
  normalizeName,
  partialReadDegradedModes,
  parseCommonArgs,
  parseCanonicalToken,
  publicPath,
  redactForArtifactText,
  readArtifact,
  readJson,
  readText,
  readTextWithMetadata,
  relativeTo,
  resolveBoundedInputPath,
  resolveBoundedSourceRoot,
  resolveGitCommit,
  resolveOutputPath,
  resolvePathAgainstRoot,
  resolveRepoRoot,
  slugify,
  sourceInputFromFile,
  sourceInputFromFiles,
  sourceInputPath,
  toPosix,
  unavailableSourceInput,
  unique,
  includedUntrackedSourceFiles,
  isGeneratedOrControlPath,
  writeJsonOutput,
  writeTextOutput,
  resolveRunDir,
};
