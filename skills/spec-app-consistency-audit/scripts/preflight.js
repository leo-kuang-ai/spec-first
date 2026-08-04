#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const {
  DEFAULT_MAX_SOURCE_HASH_BYTES,
  DEFAULT_MAX_SKIPPED_LARGE_FILES,
  GENERATED_OR_CONTROL_ROOTS,
  buildFigmaReference,
  parseCommonArgs,
  resolvePathAgainstRoot,
  resolveRepoRoot,
  sourceInputPath,
  writeJsonOutput,
} = require('./lib/audit-utils');

const DEFAULT_PRD_MAX_BYTES = 5 * 1024 * 1024;
const DEFAULT_MAX_SCAN_FILES = 2000;
// Generated/control roots must be skipped, otherwise preflight hashes artifacts this very run
// writes under .spec-first and source_hash can never reproduce across runs.
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

function runPreflight(options = {}) {
  if (options.mode === 'headless' && !options.base) {
    throw new Error('scope_headless_missing_base: mode:headless requires base:<ref> for deterministic preflight scope.');
  }
  const repoRoot = resolveExistingDirectory(resolveRepoRoot(options), 'repo-root');
  const allowOutside = normalizeAllowOutside(repoRoot, options.allowOutside || options.allowOutsidePaths || []);
  const degradedModes = [...(Array.isArray(options.degraded_modes) ? options.degraded_modes : [])];
  const sourceResolution = resolveInputPath({
    repoRoot,
    inputPath: options.source || '.',
    kind: 'source',
    expected: 'directory',
    allowOutside,
  });

  if (!sourceResolution.ok) {
    degradedModes.push(degraded('source_unreadable', 'error', sourceResolution.reason, sourceResolution.path));
  }

  const prdResolution = options.prd
    ? resolveInputPath({
      repoRoot,
      inputPath: options.prd,
      kind: 'prd',
      expected: 'file',
      maxBytes: options.prdMaxBytes || DEFAULT_PRD_MAX_BYTES,
      allowOutside,
    })
    : { ok: false, reason_code: 'prd_missing', reason: 'PRD input was not provided.' };

  if (!prdResolution.ok) {
    degradedModes.push(degraded(prdResolution.reason_code || 'prd_missing', 'warning', prdResolution.reason, prdResolution.path));
  }

  const figmaResolution = options.figmaContext
    ? resolveInputPath({
      repoRoot,
      inputPath: options.figmaContext,
      kind: 'figma',
      expected: 'file',
      allowOutside,
    })
    : null;
  const hasFigmaReference = Boolean(options.figmaRef || options.figmaNode || options.figmaFile);
  const figmaReference = buildFigmaReference(options);
  const hasFigmaMaterializedContext = Boolean(figmaResolution && figmaResolution.ok);
  const hasFigmaContext = hasFigmaMaterializedContext;
  const figmaContextMode = hasFigmaMaterializedContext
    ? 'materialized_json'
    : (hasFigmaReference ? 'mcp_reference_only' : 'none');
  if (figmaResolution && !figmaResolution.ok) {
    degradedModes.push(degraded(figmaResolution.reason_code || 'figma_unreadable', 'warning', figmaResolution.reason, figmaResolution.path));
  }
  if (!hasFigmaMaterializedContext) {
    degradedModes.push(degraded('figma_missing', 'warning', 'Figma context was not provided.', null));
  }
  if (hasFigmaReference && !hasFigmaMaterializedContext) {
    degradedModes.push(degraded(
      'figma_materialized_context_missing',
      'warning',
      'Figma node/file reference was provided, but no materialized Figma context JSON was available for extraction.',
      null,
    ));
  }
  if (!prdResolution.ok && !hasFigmaContext) {
    degradedModes.push(degraded(
      'prd_and_figma_missing',
      'warning',
      'PRD and Figma are both missing; product/design consistency conclusions must stay out of scope.',
      null,
    ));
  }

  const scanRoot = sourceResolution.ok ? sourceResolution.realpath : repoRoot;
  const scan = scanSourceTree(scanRoot, {
    maxFiles: options.maxScanFiles || DEFAULT_MAX_SCAN_FILES,
    maxHashBytes: options.maxFileBytes || options.maxSourceHashBytes || DEFAULT_MAX_SOURCE_HASH_BYTES,
  });
  for (const mode of buildStructureDegradedModes(scan)) degradedModes.push(mode);

  const sourceInputs = [];
  if (sourceResolution.ok) {
    sourceInputs.push({
      type: 'code',
      path: sourceInputPath(repoRoot, scanRoot, 'source'),
      ...(scan.source_hash_unavailable_reason
        ? { source_hash_unavailable_reason: scan.source_hash_unavailable_reason, freshness: 'partial-worktree' }
        : { source_hash: scan.source_hash, freshness: 'current-worktree' }),
    });
  } else {
    sourceInputs.push({
      type: 'code',
      path: sourceInputPath(repoRoot, sourceResolution.path || options.source || '.', 'source'),
      source_hash_unavailable_reason: sourceResolution.reason_code || 'source_unreadable',
      freshness: 'unavailable',
    });
  }

  if (prdResolution.ok) {
    sourceInputs.push({
      type: 'prd',
      path: sourceInputPath(repoRoot, prdResolution.realpath, 'prd'),
      source_hash: hashFile(prdResolution.realpath),
      freshness: 'current-worktree',
    });
  } else if (options.prd) {
    sourceInputs.push({
      type: 'prd',
      path: sourceInputPath(repoRoot, options.prd, 'prd'),
      source_hash_unavailable_reason: prdResolution.reason_code || 'unreadable',
      freshness: 'unavailable',
    });
  }

  if (figmaResolution && figmaResolution.ok) {
    sourceInputs.push({
      type: 'figma',
      path: sourceInputPath(repoRoot, figmaResolution.realpath, 'figma'),
      source_hash: hashFile(figmaResolution.realpath),
      freshness: 'current-worktree',
    });
  } else if (options.figmaContext) {
    sourceInputs.push({
      type: 'figma',
      path: sourceInputPath(repoRoot, options.figmaContext, 'figma'),
      source_hash_unavailable_reason: figmaResolution.reason_code || 'unreadable',
      freshness: 'unavailable',
    });
  } else if (hasFigmaReference) {
    sourceInputs.push({
      type: 'figma',
      path: figmaReference ? figmaReference.path : 'figma-reference',
      source_hash_unavailable_reason: 'external_mcp_context',
      freshness: 'session-context',
    });
  }

  return {
    schema_version: 'spec-app-consistency-audit-preflight.v1',
    artifact_id: 'preflight',
    generated_at: new Date().toISOString(),
    source_inputs: sourceInputs,
    consumers: ['expert-agents', 'evidence-auditor', 'report-writer'],
    contract_status: 'candidate',
    data_sensitivity: 'internal',
    repo_root: '.',
    project_type: detectProjectType(scan),
    platforms: detectPlatforms(scan, options.platform),
    architecture_candidates: detectArchitectureCandidates(scan),
    has_prd: prdResolution.ok,
    has_figma_context: hasFigmaContext,
    has_figma_reference: hasFigmaReference,
    has_figma_materialized_context: hasFigmaMaterializedContext,
    figma_context_mode: figmaContextMode,
    has_analytics: scan.signals.analytics,
    has_i18n: scan.signals.i18n,
    has_component_system: scan.signals.componentSystem,
    has_modular_structure: scan.signals.modularStructure,
    has_testability_signals: scan.signals.testability,
    has_local_cache_or_storage: scan.signals.localCacheOrStorage,
    has_security_sensitive_surfaces: scan.signals.securitySensitiveSurfaces,
    has_navigation_or_routes: scan.signals.navigationOrRoutes,
    has_viewmodel_state_or_usecase: scan.signals.viewmodelStateOrUsecase,
    default_runtime_mode: 'static_only',
    requires_device_by_default: false,
    degraded_modes: degradedModes,
    inputs: {
      source: publicResolution(sourceResolution, repoRoot),
      prd: publicResolution(prdResolution, repoRoot),
      figma: {
        provided: hasFigmaContext,
        reference_provided: hasFigmaReference,
        reference_kind: figmaReference ? figmaReference.reference_kind : null,
        reference_hash: figmaReference ? figmaReference.reference_hash : null,
        reference_type: figmaReference ? figmaReference.reference_type : null,
        reference_host: figmaReference ? figmaReference.reference_host || null : null,
        has_query: figmaReference ? Boolean(figmaReference.has_query) : false,
        materialized_context_provided: hasFigmaMaterializedContext,
        context_mode: figmaContextMode,
        context: options.figmaContext ? publicPath(repoRoot, options.figmaContext, 'figma-outside-repo') : null,
      },
    },
    scan_summary: {
      scanned_files: scan.scanned_files,
      scan_truncated: scan.scan_truncated,
      skipped_directories: scan.skipped_directories,
      skipped_large_files: scan.skipped_large_files,
      skipped_large_file_count: scan.skipped_large_file_count,
    },
  };
}

function resolveExistingDirectory(value, label) {
  const resolved = path.resolve(String(value || '.'));
  if (!fs.existsSync(resolved)) {
    throw new Error(`${label} does not exist: ${resolved}`);
  }
  if (!fs.statSync(resolved).isDirectory()) {
    throw new Error(`${label} is not a directory: ${resolved}`);
  }
  return fs.realpathSync(resolved);
}

function normalizeAllowOutside(repoRoot, values) {
  return []
    .concat(values || [])
    .filter(Boolean)
    .map((entry) => path.resolve(repoRoot, String(entry)))
    .filter((entry) => fs.existsSync(entry))
    .map((entry) => fs.realpathSync(entry));
}

function resolveInputPath(options) {
  const repoRoot = options.repoRoot;
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

  const requestedLocation = resolvePathLocation(requested);
  const realpath = fs.realpathSync(requested);
  result.realpath = realpath;
  const requestedInside = isInsideOrSame(repoRoot, requestedLocation);
  const realInside = isInsideOrSame(repoRoot, realpath);
  const outsideAllowed = options.allowOutside.some((allowedRoot) => isInsideOrSame(allowedRoot, realpath));

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

function scanSourceTree(root, options = {}) {
  const files = [];
  const skipped = new Set();
  const skippedLargeFiles = [];
  const maxSkippedLargeFiles = options.maxSkippedLargeFiles || DEFAULT_MAX_SKIPPED_LARGE_FILES;
  let skippedLargeFileCount = 0;
  const stack = [root];
  let truncated = false;

  while (stack.length > 0) {
    const current = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch (_error) {
      continue;
    }

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (SKIPPED_DIRS.has(entry.name)) {
          skipped.add(toPosix(path.relative(root, fullPath)));
          continue;
        }
        stack.push(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      let stat = null;
      try {
        stat = fs.statSync(fullPath);
      } catch (_error) {
        continue;
      }
      if (isTextLike(fullPath) && stat.size > (options.maxHashBytes || DEFAULT_MAX_SOURCE_HASH_BYTES)) {
        skippedLargeFileCount += 1;
        if (skippedLargeFiles.length < maxSkippedLargeFiles) {
          skippedLargeFiles.push({
            path: toPosix(path.relative(root, fullPath)),
            size_bytes: stat.size,
            reason: 'file_too_large_for_source_hash',
          });
        }
      }
      files.push(fullPath);
      if (files.length >= options.maxFiles) {
        truncated = true;
        stack.length = 0;
        break;
      }
    }
  }

  const relFiles = files.map((filePath) => toPosix(path.relative(root, filePath))).sort();
  const signalText = relFiles.join('\n').toLowerCase();
  const contentSignals = scanContentSignals(files);
  return {
    files: relFiles,
    scanned_files: relFiles.length,
    scan_truncated: truncated,
    skipped_directories: [...skipped].sort(),
    skipped_large_files: skippedLargeFiles.sort((left, right) => left.path.localeCompare(right.path)),
    skipped_large_file_count: skippedLargeFileCount,
    source_hash: (truncated || skippedLargeFileCount > 0) ? null : hashFileList(root, files),
    source_hash_unavailable_reason: truncated
      ? 'file_scan_truncated'
      : (skippedLargeFileCount > 0 ? 'large_file_skipped' : null),
    signals: {
      commonMain: relFiles.some((file) => file.includes('commonMain/')),
      androidMain: relFiles.some((file) => file.includes('androidMain/')),
      iosMain: relFiles.some((file) => file.includes('iosMain/')),
      androidApp: /(^|\/)(androidmanifest\.xml|build\.gradle|build\.gradle\.kts)/im.test(signalText),
      iosApp: /(^|\/)(project\.pbxproj|package\.swift|\.xcodeproj\/)/im.test(signalText),
      gradle: /(^|\/)(settings\.gradle|settings\.gradle\.kts|build\.gradle|build\.gradle\.kts)$/im.test(signalText),
      analytics: /analytics|eventtracker|telemetry|tracking|trackevent/.test(signalText) || contentSignals.analytics,
      i18n: /strings\.xml|localizable\.strings|(^|\/)(i18n|l10n|locale|locales)(\/|$)|values-[a-z]/.test(signalText),
      componentSystem: /design-system|designsystem|components|ui-components|uikit/.test(signalText),
      modularStructure: /settings\.gradle|settings\.gradle\.kts/.test(signalText) || relFiles.filter((file) => /build\.gradle/.test(file)).length > 1,
      testability: /(^|\/)(test|androidtest|iostest|mock|mocks|fake|fakes|di)(\/|$)/.test(signalText),
      localCacheOrStorage: /cache|database|datastore|room|sqldelight|storage|keychain|keystore/.test(signalText) || contentSignals.storage,
      securitySensitiveSurfaces: /webview|deeplink|deep-link|permission|keychain|keystore/.test(signalText) || contentSignals.security,
      navigationOrRoutes: /navigation|navigator|navgraph|route|router|deeplink|coordinator/.test(signalText) || contentSignals.routes,
      viewmodelStateOrUsecase: /viewmodel|uistate|uievent|usecase|interactor/.test(signalText) || contentSignals.state,
    },
  };
}

function scanContentSignals(files) {
  const result = {
    analytics: false,
    routes: false,
    security: false,
    state: false,
    storage: false,
  };
  for (const filePath of files.slice(0, 500)) {
    if (!isTextLike(filePath)) continue;
    try {
      if (fs.statSync(filePath).size > DEFAULT_MAX_SOURCE_HASH_BYTES) continue;
    } catch (_error) {
      continue;
    }
    let text = '';
    try {
      text = fs.readFileSync(filePath, 'utf8').slice(0, 65536).toLowerCase();
    } catch (_error) {
      continue;
    }
    result.analytics = result.analytics || /track\(|analytics|event/.test(text);
    result.routes = result.routes || /navcontroller|navigate\(|deeplink|route/.test(text);
    result.security = result.security || /webview|permission|keychain|keystore|biometric/.test(text);
    result.state = result.state || /viewmodel|uistate|uievent|usecase/.test(text);
    result.storage = result.storage || /roomdatabase|sqldelight|datastore|sharedpreferences|cache/.test(text);
  }
  return result;
}

function buildStructureDegradedModes(scan) {
  const modes = [];
  if (scan.scan_truncated) {
    modes.push(degraded('source_scan_truncated', 'warning', 'Source scan reached max file limit.', null));
  }
  if (!scan.signals.commonMain) modes.push(degraded('kmp_common_main_missing', 'info', 'commonMain source set not found.', null));
  if (!scan.signals.androidMain) modes.push(degraded('android_main_missing', 'info', 'androidMain source set not found.', null));
  if (!scan.signals.iosMain) modes.push(degraded('ios_main_missing', 'info', 'iosMain source set not found.', null));
  if (!scan.signals.analytics) modes.push(degraded('analytics_system_missing', 'warning', 'Analytics module or calls not found.', null));
  if (!scan.signals.i18n) modes.push(degraded('i18n_system_missing', 'warning', 'I18n resources not found.', null));
  if (scan.skipped_large_file_count > 0) {
    modes.push(degraded('source_large_files_skipped', 'warning', 'Large files were skipped from source hashing to keep preflight bounded.', null));
  }
  return modes;
}

function detectProjectType(scan) {
  if (scan.signals.commonMain && (scan.signals.androidMain || scan.signals.iosMain)) return 'kmp_mobile_app';
  if (scan.signals.androidApp) return 'android_app';
  if (scan.signals.iosApp) return 'ios_app';
  return 'mobile_app_candidate';
}

function detectPlatforms(scan, requested) {
  if (requested === 'both') return ['android', 'ios'];
  if (requested === 'android') return ['android'];
  if (requested === 'ios') return ['ios'];
  const platforms = [];
  if (scan.signals.androidMain || scan.signals.androidApp) platforms.push('android');
  if (scan.signals.iosMain || scan.signals.iosApp) platforms.push('ios');
  return platforms;
}

function detectArchitectureCandidates(scan) {
  const candidates = [];
  if (scan.signals.commonMain) candidates.push('kmp');
  if (scan.files.some((file) => /(^|\/)(domain|data|presentation|usecase|usecases)(\/|$)/i.test(file))) {
    candidates.push('clean-architecture');
  }
  if (scan.signals.viewmodelStateOrUsecase) candidates.push('mvvm');
  return candidates;
}

function degraded(code, severity, summary, filePath) {
  return {
    code,
    severity,
    summary,
    path: filePath ? toPosix(filePath) : null,
  };
}

function publicResolution(resolution, repoRoot) {
  if (!resolution || (!resolution.path && !resolution.realpath)) {
    return { ok: false, reason_code: 'missing', reason: 'Input missing.' };
  }
  return {
    ok: Boolean(resolution.ok),
    path: resolution.path ? publicPath(repoRoot, resolution.path, `${resolution.kind || 'input'}-outside-repo`) : null,
    realpath: resolution.realpath ? publicPath(repoRoot, resolution.realpath, `${resolution.kind || 'input'}-outside-repo`) : null,
    reason_code: resolution.reason_code || '',
    reason: resolution.reason || '',
  };
}

function publicPath(repoRoot, filePath, label) {
  if (!filePath) return null;
  const absolutePath = path.resolve(repoRoot, String(filePath));
  if (isInsideOrSame(repoRoot, absolutePath)) return toPosix(path.relative(repoRoot, absolutePath)) || '.';
  return `<${label}:${hashText(absolutePath).slice(7, 19)}>`;
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

function hashFile(filePath) {
  return hashText(fs.readFileSync(filePath));
}

function hashFileList(root, files) {
  const inputs = files
    .map((filePath) => `${toPosix(path.relative(root, filePath))}\0${safeHashFile(filePath)}`)
    .sort();
  return hashText(inputs.join('\n'));
}

function safeHashFile(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (!isTextLike(filePath)) return `binary_asset:size=${stat.size}`;
    if (stat.size > DEFAULT_MAX_SOURCE_HASH_BYTES) return `large_file_skipped:size=${stat.size}`;
    return hashFile(filePath);
  } catch (error) {
    return `unreadable:${error.code || 'read_failed'}`;
  }
}

function hashText(value) {
  return `sha256:${crypto.createHash('sha256').update(value).digest('hex')}`;
}

function isTextLike(filePath) {
  return /\.(kt|kts|java|swift|m|mm|xml|json|ya?ml|gradle|properties|txt|md)$/i.test(filePath);
}

function toPosix(value) {
  return String(value || '').replace(/\\/g, '/');
}

function parseArgs(argv) {
  return parseCommonArgs(argv);
}

if (require.main === module) {
  let options = {};
  try {
    options = parseArgs(process.argv.slice(2));
    const result = runPreflight(options);
    writeJsonOutput(result, options.output, options);
  } catch (error) {
    if (options.mode === 'headless' && /^scope_/.test(error.message)) {
      const { renderHeadlessFailureEnvelope } = require('./render-headless-envelope');
      process.stdout.write(renderHeadlessFailureEnvelope({
        reasonCode: error.message.split(':')[0],
        message: error.message,
        runId: options.runId,
      }));
    } else {
      process.stderr.write(`${error.message}\n`);
    }
    process.exitCode = 1;
  }
}

module.exports = {
  DEFAULT_PRD_MAX_BYTES,
  resolvePathLocation,
  resolveInputPath,
  runPreflight,
  scanSourceTree,
};
