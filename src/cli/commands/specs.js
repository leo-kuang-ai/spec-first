'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { resolveWorkflowArtifactDir } = require('../../crg/artifact-paths');

const RUN_ID_PATTERN = /^\d{8}-\d{6}-[a-z0-9]{6,12}$/;
const SAFE_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;
const CONSUMER = 'spec-standards';
const PAYLOAD_SCHEMA_VERSION = 'standards-proposal-payload/v1';
const RUN_STATE_SCHEMA_VERSION = 'standards-run-state/v1';
const EVIDENCE_MODES = new Set(['crg-first', 'direct-only', 'mixed']);
const CONFIRMATION_STATUSES = new Set(['manual', 'confirmed', 'inferred', 'uncertain', 'conflict', 'rejected']);
const LIFECYCLE_STATUSES = new Set(['draft', 'active', 'deprecated', 'overridden']);
const SOURCES = new Set(['template', 'extracted', 'manual', 'imported', 'generated']);
const DEFAULT_REJECTED = 'No entries in this run.\n';
const SECRET_PATTERNS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\b(?:sk|ghp|github_pat|xox[baprs]|AKIA)[A-Za-z0-9_-]{12,}\b/,
  /\b(?:password|passwd|pwd|secret|token|api[_-]?key|credential)\b\s*[:=]\s*["']?[^\s"',}]{8,}/i,
  /[A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|KEY)[A-Z0-9_]*\s*=\s*[^\s]+/i,
];

function runSpecs(argv) {
  const args = [...argv];
  const subcommand = args.shift();

  if (!subcommand || subcommand === '--help' || subcommand === '-h') {
    printHelp();
    return 0;
  }

  try {
    if (subcommand === 'write-proposal') {
      const result = writeProposal(parseOptions(args));
      console.log(JSON.stringify(result, null, 2));
      return 0;
    }

    if (subcommand === 'init') {
      const result = initSpecs(parseOptions(args));
      console.log(JSON.stringify(result, null, 2));
      return 0;
    }

    if (subcommand === 'promote') {
      const result = promoteRun(parseOptions(args));
      console.log(JSON.stringify(result, null, 2));
      return 0;
    }

    if (subcommand === 'index') {
      const result = indexSpecs(parseOptions(args));
      console.log(JSON.stringify(result, null, 2));
      return 0;
    }

    if (subcommand === 'resolve') {
      const result = resolveSpecs(parseOptions(args));
      console.log(JSON.stringify(result, null, 2));
      return 0;
    }

    if (subcommand === 'check') {
      const result = checkSpecs(parseOptions(args));
      console.log(JSON.stringify(result, null, 2));
      return 0;
    }

    if (subcommand === 'refresh') {
      const result = refreshSpecs(parseOptions(args));
      console.log(JSON.stringify(result, null, 2));
      return 0;
    }

    if (subcommand === 'list') {
      const result = listSpecs(parseOptions(args));
      console.log(JSON.stringify(result, null, 2));
      return 0;
    }

    if (subcommand === 'validate') {
      const result = validateSpecs(parseOptions(args));
      console.log(JSON.stringify(result, null, 2));
      return result.valid ? 0 : 1;
    }

    if (subcommand === 'validate-run') {
      const result = validateRun(parseOptions(args));
      console.log(JSON.stringify(result, null, 2));
      return result.valid ? 0 : 1;
    }

    console.error(`Unknown specs subcommand: ${subcommand}`);
    printHelp(true);
    return 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

function printHelp(withErrorPrefix = false) {
  const lines = [
    '📚 spec-first specs — deterministic helpers for spec-standards proposals and promotion',
    '',
    'Usage:',
    '  spec-first specs init --target <repo>',
    '  spec-first specs write-proposal --run-id <run-id> --target <repo> --payload <proposal-payload.json>',
    '  spec-first specs validate-run --run-id <run-id> --target <repo>',
    '  spec-first specs promote --run-id <run-id> --target <repo> (--accept-all | --accept <drafts/a.md>[,--reject <drafts/b.md>] [--defer <drafts/c.md>])',
    '  spec-first specs index --target <repo>',
    '  spec-first specs resolve --target <repo> --task <description> [--files <comma-list>] [--consumer <workflow> --task-id <id>]',
    '  spec-first specs check --target <repo> (--changed [--base <ref>] | --files <comma-list>) [--task <description>]',
    '  spec-first specs refresh --target <repo> --index-only',
    '  spec-first specs refresh --target <repo> --changed [--base <ref> | --files <comma-list>] [--task <description>] [--run-id <id>]',
    '  spec-first specs list --target <repo> [--scope <scope>] [--source <source>]',
    '  spec-first specs validate --target <repo>',
    '',
    'Proposal artifacts are written under:',
    '  .spec-first/workflows/spec-standards/<target-slug>/<run-id>/',
    '',
    'Only promote writes formal standards under docs/specs/**, and it requires --accept-all.',
    'Resolve reads docs/specs/_index/** and writes optional consumer context; it is not a hard gate.',
    'Check writes docs/specs/reports/spec-check-report.{json,md}; it is review assistance, not a hard gate.',
    'Refresh --index-only rebuilds indexes; refresh --changed writes a proposal request without modifying standards.',
  ];

  const stream = withErrorPrefix ? console.error : console.log;
  stream(lines.join('\n'));
}

function parseOptions(args) {
  const options = {};

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg.startsWith('--')) {
      throw new Error(`Unexpected positional argument: ${arg}`);
    }

    const eqIndex = arg.indexOf('=');
    if (eqIndex !== -1) {
      options[arg.slice(2, eqIndex)] = arg.slice(eqIndex + 1);
      continue;
    }

    const key = arg.slice(2);
    const value = args[i + 1];
    if (!value || value.startsWith('--')) {
      options[key] = true;
      continue;
    }
    options[key] = value;
    i += 1;
  }

  return options;
}

function writeProposal(options) {
  const context = resolveCommandContext(options, { requirePayload: true });
  const payload = readJsonFile(context.payloadPath);
  const errors = validateProposalPayload(payload, context);

  if (errors.length > 0) {
    throw new Error(`Invalid standards proposal payload:\n- ${errors.join('\n- ')}`);
  }

  const runDir = context.runDir;
  if (fs.existsSync(runDir)) {
    throw new Error(`Proposal run already exists: ${runDir}`);
  }

  const baseDir = context.baseDir;
  fs.mkdirSync(baseDir, { recursive: true });
  const tmpDir = path.join(baseDir, `.tmp-${context.runId}-${process.pid}`);

  if (fs.existsSync(tmpDir)) {
    throw new Error(`Temporary proposal directory already exists: ${tmpDir}`);
  }

  const now = new Date().toISOString();
  const state = {
    schema_version: RUN_STATE_SCHEMA_VERSION,
    run_id: context.runId,
    target_slug: context.targetSlug,
    target_repo: context.targetRoot,
    consumer: CONSUMER,
    status: 'completed',
    evidence_mode: payload.evidence_mode,
    started_at: now,
    completed_at: now,
  };

  try {
    fs.mkdirSync(tmpDir, { recursive: true });
    writeJson(path.join(tmpDir, 'run-state.json'), state);
    writeText(path.join(tmpDir, 'preview.md'), payload.preview_markdown);
    writeJson(path.join(tmpDir, 'detected-profiles.json'), {
      schema_version: 'detected-profiles/v1',
      profiles: payload.detected_profiles,
    });
    writeJson(path.join(tmpDir, 'evidence-map.json'), payload.evidence_map);

    for (const draft of payload.drafts) {
      const draftPath = resolveRunLocalPath(tmpDir, draft.path, 'drafts');
      writeText(draftPath, draft.content);
    }

    writeText(
      path.join(tmpDir, 'rejected', 'inferred-rules.md'),
      payload.rejected?.inferred_rules_markdown || DEFAULT_REJECTED,
    );
    writeText(
      path.join(tmpDir, 'rejected', 'uncertain-rules.md'),
      payload.rejected?.uncertain_rules_markdown || DEFAULT_REJECTED,
    );
    writeText(
      path.join(tmpDir, 'rejected', 'conflicts.md'),
      payload.rejected?.conflicts_markdown || DEFAULT_REJECTED,
    );

    fs.renameSync(tmpDir, runDir);
  } catch (error) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    throw error;
  }

  return {
    ok: true,
    run_dir: path.relative(context.targetRoot, runDir),
    run_id: context.runId,
    target_slug: context.targetSlug,
  };
}

function validateRun(options) {
  const context = resolveCommandContext(options, { requirePayload: false });
  const errors = [];

  if (!fs.existsSync(context.runDir)) {
    return {
      valid: false,
      run_dir: path.relative(context.targetRoot, context.runDir),
      errors: [`run directory does not exist: ${context.runDir}`],
    };
  }

  const requiredFiles = [
    'run-state.json',
    'preview.md',
    'detected-profiles.json',
    'evidence-map.json',
    path.join('rejected', 'inferred-rules.md'),
    path.join('rejected', 'uncertain-rules.md'),
    path.join('rejected', 'conflicts.md'),
  ];

  for (const rel of requiredFiles) {
    const filePath = path.join(context.runDir, rel);
    if (!isRegularFileInside(context.runDir, filePath)) {
      errors.push(`missing required file: ${rel}`);
    }
  }

  const state = readJsonIfPresent(path.join(context.runDir, 'run-state.json'), errors, 'run-state.json');
  if (state) {
    validateRunState(state, context, errors);
  }

  const detected = readJsonIfPresent(
    path.join(context.runDir, 'detected-profiles.json'),
    errors,
    'detected-profiles.json',
  );
  if (detected) {
    validateDetectedProfilesEnvelope(detected, errors);
  }

  const evidenceMap = readJsonIfPresent(path.join(context.runDir, 'evidence-map.json'), errors, 'evidence-map.json');
  if (evidenceMap) {
    validateEvidenceMap(evidenceMap, context, errors);
  }

  const draftFiles = listMarkdownFiles(path.join(context.runDir, 'drafts'));
  if (draftFiles.length === 0) {
    errors.push('drafts must contain at least one markdown file');
  }

  for (const filePath of draftFiles) {
    const rel = path.relative(context.runDir, filePath);
    if (!isRegularFileInside(context.runDir, filePath) || !rel.startsWith(`drafts${path.sep}`)) {
      errors.push(`draft path escapes run dir: ${rel}`);
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    validateDraftFrontmatter(content, rel, errors);
    if (containsSecretLikeValue(content)) {
      errors.push(`redaction risk in ${rel}`);
    }
  }

  for (const rel of requiredFiles.filter((entry) => entry.endsWith('.md'))) {
    const filePath = path.join(context.runDir, rel);
    if (fs.existsSync(filePath) && containsSecretLikeValue(fs.readFileSync(filePath, 'utf8'))) {
      errors.push(`redaction risk in ${rel}`);
    }
  }

  if (evidenceMap && containsSecretLikeValue(JSON.stringify(evidenceMap))) {
    errors.push('redaction risk in evidence-map.json');
  }

  return {
    valid: errors.length === 0,
    run_dir: path.relative(context.targetRoot, context.runDir),
    run_id: context.runId,
    target_slug: context.targetSlug,
    errors,
  };
}

function initSpecs(options) {
  const targetRoot = resolveTargetRoot(options);
  const specsRoot = path.join(targetRoot, 'docs', 'specs');
  const dirs = [
    '_index',
    'common',
    'frontend',
    'backend',
    'mobile',
    'desktop',
    'custom',
    'guides',
    'evidence',
    'reports',
  ];

  fs.mkdirSync(specsRoot, { recursive: true });
  for (const dir of dirs) {
    fs.mkdirSync(path.join(specsRoot, dir), { recursive: true });
  }

  const readmePath = path.join(specsRoot, 'README.md');
  const specPath = path.join(specsRoot, 'SPEC.md');
  writeFileIfAbsent(readmePath, [
    '# Project Standards',
    '',
    '`docs/specs/**` is the formal source for project standards.',
    '',
    '- `custom/**` contains manual standards and has highest priority.',
    '- `_index/**` is generated and can be rebuilt with `spec-first specs index`.',
    '- Proposal runs under `.spec-first/workflows/spec-standards/**` are not formal until promoted.',
    '',
  ].join('\n'));
  writeFileIfAbsent(specPath, [
    '# Standards Loading Contract',
    '',
    '1. Do not read all `docs/specs/**` by default.',
    '2. Read `_index/specs-index.json` first.',
    '3. Load matched standards by task, files, profile, and keywords.',
    '4. Treat `custom/**` and `source=manual` as highest priority.',
    '',
  ].join('\n'));

  return {
    ok: true,
    specs_root: path.relative(targetRoot, specsRoot),
    created_dirs: dirs.map((dir) => path.posix.join('docs/specs', dir)),
  };
}

function promoteRun(options) {
  const acceptAll = options['accept-all'] === true || options['accept-all'] === 'true';
  const acceptedDrafts = new Set(parseDraftDecisionList(options.accept));
  const rejectedDrafts = new Set(parseDraftDecisionList(options.reject));
  const deferredDrafts = new Set(parseDraftDecisionList(options.defer));

  if (!acceptAll && acceptedDrafts.size === 0 && rejectedDrafts.size === 0 && deferredDrafts.size === 0) {
    throw new Error('promote requires --accept-all or at least one of --accept/--reject/--defer. Review preview.md and drafts before confirming.');
  }

  const context = resolveCommandContext(options, { requirePayload: false });
  const validation = validateRun(options);
  if (!validation.valid) {
    throw new Error(`Cannot promote invalid proposal run:\n- ${validation.errors.join('\n- ')}`);
  }

  initSpecs({ target: context.targetRoot });
  const draftFiles = listMarkdownFiles(path.join(context.runDir, 'drafts'));
  const availableDrafts = new Set(draftFiles.map((draftPath) => {
    const draftRel = path.relative(path.join(context.runDir, 'drafts'), draftPath).split(path.sep).join('/');
    return path.posix.join('drafts', draftRel);
  }));
  for (const selected of [...acceptedDrafts, ...rejectedDrafts, ...deferredDrafts]) {
    if (!availableDrafts.has(selected)) {
      throw new Error(`Selected draft does not exist in run: ${selected}`);
    }
  }

  const promoted = [];
  const skipped = [];

  for (const draftPath of draftFiles) {
    const draftRel = path.relative(path.join(context.runDir, 'drafts'), draftPath).split(path.sep).join('/');
    const decisionRel = path.posix.join('drafts', draftRel);
    if (!acceptAll) {
      if (rejectedDrafts.has(decisionRel)) {
        skipped.push({ path: decisionRel, reason: 'rejected_by_user' });
        continue;
      }
      if (deferredDrafts.has(decisionRel)) {
        skipped.push({ path: decisionRel, reason: 'deferred_by_user' });
        continue;
      }
      if (!acceptedDrafts.has(decisionRel)) {
        skipped.push({ path: decisionRel, reason: 'not_selected' });
        continue;
      }
    }

    const destRel = path.posix.join('docs/specs', draftRel);
    const destPath = path.join(context.targetRoot, ...destRel.split('/'));
    const content = promoteDraftContent(fs.readFileSync(draftPath, 'utf8'));
    const frontmatter = parseFrontmatter(content);

    if (!frontmatter) {
      skipped.push({ path: destRel, reason: 'missing_frontmatter' });
      continue;
    }

    if (frontmatter.confirmation_status !== 'confirmed' && frontmatter.confirmation_status !== 'manual') {
      skipped.push({ path: destRel, reason: 'not_confirmed_after_promote_transform' });
      continue;
    }

    if (fs.existsSync(destPath)) {
      const existing = fs.readFileSync(destPath, 'utf8');
      const existingFrontmatter = parseFrontmatter(existing);
      const isManual = destRel.startsWith('docs/specs/custom/')
        || !existingFrontmatter
        || existingFrontmatter.source === 'manual'
        || existingFrontmatter.confirmation_status === 'manual';
      if (isManual) {
        throw new Error(`Refusing to overwrite manual/custom standard: ${destRel}`);
      }
      throw new Error(`Refusing to overwrite existing standard without an explicit merge path: ${destRel}`);
    }

    writeText(destPath, content);
    promoted.push(destRel);
  }

  const indexResult = indexSpecs({ target: context.targetRoot });
  const reportPath = path.join(context.runDir, 'promote-report.json');
  const report = {
    schema_version: 'standards-promote-report/v1',
    run_id: context.runId,
    target_slug: context.targetSlug,
    promoted,
    skipped,
    index: indexResult,
    promoted_at: new Date().toISOString(),
  };
  writeJson(reportPath, report);

  return {
    ok: true,
    run_id: context.runId,
    promoted,
    skipped,
    promote_report: path.relative(context.targetRoot, reportPath),
    index: indexResult,
  };
}

function indexSpecs(options) {
  const targetRoot = resolveTargetRoot(options);
  const specsRoot = path.join(targetRoot, 'docs', 'specs');
  if (!fs.existsSync(specsRoot)) {
    throw new Error(`docs/specs does not exist. Run spec-first specs init --target ${targetRoot}`);
  }

  const sourceFiles = listMarkdownFiles(specsRoot)
    .filter((filePath) => !isExcludedSpecMarkdown(specsRoot, filePath));
  const indexed = sourceFiles.map((filePath) => buildSpecIndexEntry(targetRoot, specsRoot, filePath));
  const sourceFileHashes = sourceFiles.map((filePath) => ({
    path: toPosix(path.relative(targetRoot, filePath)),
    sha256: sha256(fs.readFileSync(filePath)),
  }));
  const sourceSpecsHash = sha256(JSON.stringify(sourceFileHashes));
  const generatedAt = new Date().toISOString();
  const generationId = generatedAt.replace(/[-:.TZ]/g, '').slice(0, 14);
  const detectedProfiles = unique(indexed.flatMap((entry) => entry.profiles || []).filter((entry) => entry !== 'all'));

  const indexDir = path.join(specsRoot, '_index');
  fs.mkdirSync(indexDir, { recursive: true });

  const specsIndex = {
    version: '1.0.0',
    generated_at: generatedAt,
    project_profiles: detectedProfiles,
    metadata: {
      index_generation_id: generationId,
      source_specs_hash: sourceSpecsHash,
      source_files: sourceFileHashes,
      excluded_globs: [
        'docs/specs/_index/**',
        'docs/specs/evidence/**',
        'docs/specs/reports/**',
      ],
    },
    specs: indexed,
  };
  const rulesMap = {
    version: '1.0.0',
    generated_at: generatedAt,
    metadata: specsIndex.metadata,
    rules: indexed.flatMap((entry) => entry.rules),
    dependencies: {},
  };
  const profiles = {
    version: '1.0.0',
    generated_at: generatedAt,
    detected_profiles: detectedProfiles.map((id) => ({
      id,
      confidence: 'medium',
      evidence: indexed
        .filter((entry) => (entry.profiles || []).includes(id))
        .map((entry) => entry.path),
    })),
  };
  const lastScan = {
    version: '1.0.0',
    generated_at: generatedAt,
    source_specs_hash: sourceSpecsHash,
    source_files: sourceFileHashes,
    freshness: 'fresh',
  };

  writeJson(path.join(indexDir, 'specs-index.json'), specsIndex);
  writeJson(path.join(indexDir, 'rules-map.json'), rulesMap);
  writeJson(path.join(indexDir, 'profiles.json'), profiles);
  writeJson(path.join(indexDir, 'last-scan.json'), lastScan);
  writeText(path.join(indexDir, 'specs-index.md'), renderSpecsIndexMarkdown(indexed));

  return {
    ok: true,
    specs_count: indexed.length,
    rules_count: rulesMap.rules.length,
    source_specs_hash: sourceSpecsHash,
    index_dir: 'docs/specs/_index',
  };
}

function resolveSpecs(options) {
  const targetRoot = resolveTargetRoot(options);
  const task = typeof options.task === 'string' ? options.task.trim() : '';
  if (!task) {
    throw new Error('Missing required --task');
  }

  const tokenBudget = Number.isInteger(Number(options['token-budget']))
    ? Number(options['token-budget'])
    : 12000;
  const taskId = options['task-id'] && typeof options['task-id'] === 'string'
    ? safeTaskSlug(options['task-id'])
    : safeTaskSlug(task).slice(0, 48);
  const files = parseCsv(options.files);
  const specsIndexPath = path.join(targetRoot, 'docs', 'specs', '_index', 'specs-index.json');
  const rulesMapPath = path.join(targetRoot, 'docs', 'specs', '_index', 'rules-map.json');

  if (!fs.existsSync(specsIndexPath)) {
    throw new Error(`Missing specs index: ${path.relative(targetRoot, specsIndexPath)}. Run spec-first specs index --target ${targetRoot}`);
  }

  const specsIndex = readJsonFile(specsIndexPath);
  const rulesMap = fs.existsSync(rulesMapPath)
    ? readJsonFile(rulesMapPath)
    : { rules: [], dependencies: {} };
  const taskTokens = tokenize(`${task} ${files.join(' ')}`);
  const scored = (specsIndex.specs || []).map((spec) => scoreSpecForTask(spec, {
    task,
    taskTokens,
    files,
  }));
  const sorted = scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.priority || 0) - (a.priority || 0);
  });

  const loadFull = [];
  const loadSummary = [];
  const loadReference = [];
  const excluded = [];
  let estimatedTokens = 0;

  for (const item of sorted) {
    const base = {
      path: item.path,
      reason: item.reason,
      priority: item.priority,
      score: item.score,
    };

    if (item.path_match || (item.custom_override && item.score > 0) || (!item.scope_common && item.score >= 80)) {
      const cost = item.token_estimate || 0;
      if (estimatedTokens + cost <= tokenBudget) {
        loadFull.push(base);
        estimatedTokens += cost;
      } else {
        loadSummary.push({ ...base, reason: `${item.reason}; token budget uses summary` });
        estimatedTokens += summaryTokenEstimate(item);
      }
      continue;
    }

    if (item.score >= 35 || item.scope_common) {
      loadSummary.push(base);
      estimatedTokens += summaryTokenEstimate(item);
      continue;
    }

    if (item.score > 0 || item.priority >= 80) {
      loadReference.push(base);
      continue;
    }

    excluded.push({
      path: item.path,
      reason: 'No task, file, keyword, scope, or manual-priority match',
    });
  }

  const dependencySummaries = addDependencySummaries({
    loadFull,
    loadSummary,
    rulesMap,
    indexedByPath: new Map(scored.map((entry) => [entry.path, entry])),
  });
  estimatedTokens += dependencySummaries.addedTokenEstimate;

  const result = {
    version: '1.0.0',
    task_id: taskId,
    task,
    task_type: inferTaskType(taskTokens, files),
    files,
    profiles: specsIndex.project_profiles || [],
    token_budget: tokenBudget,
    estimated_tokens: estimatedTokens,
    load_full: loadFull,
    load_summary: loadSummary,
    load_reference: loadReference,
    excluded,
    metadata: {
      source_index: 'docs/specs/_index/specs-index.json',
      source_specs_hash: specsIndex.metadata?.source_specs_hash || null,
      generated_at: new Date().toISOString(),
      hard_gate: false,
    },
  };

  if (options.consumer) {
    writeResolveContext({
      targetRoot,
      consumer: String(options.consumer),
      taskId,
      result,
    });
  }

  return result;
}

function checkSpecs(options) {
  const targetRoot = resolveTargetRoot(options);
  const files = resolveCheckFiles(targetRoot, options);
  const task = typeof options.task === 'string' && options.task.trim()
    ? options.task.trim()
    : 'check changed files against project standards';
  const taskId = options['task-id'] && typeof options['task-id'] === 'string'
    ? safeTaskSlug(options['task-id'])
    : safeTaskSlug(task).slice(0, 48);

  const resolveResult = resolveSpecs({
    target: targetRoot,
    task,
    files: files.join(','),
    consumer: 'spec-check',
    'task-id': taskId,
  });
  const specsIndexPath = path.join(targetRoot, 'docs', 'specs', '_index', 'specs-index.json');
  const rulesMapPath = path.join(targetRoot, 'docs', 'specs', '_index', 'rules-map.json');
  const specsIndex = readJsonFile(specsIndexPath);
  const rulesMap = fs.existsSync(rulesMapPath)
    ? readJsonFile(rulesMapPath)
    : { rules: [] };
  const indexedByPath = new Map((specsIndex.specs || []).map((entry) => [entry.path, entry]));
  const rulesBySpecPath = groupRulesBySpecPath(rulesMap.rules || []);
  const loaded = [
    ...resolveResult.load_full.map((entry) => ({ ...entry, load_mode: 'full' })),
    ...resolveResult.load_summary.map((entry) => ({ ...entry, load_mode: 'summary' })),
  ];
  const standards = loaded.map((entry) => {
    const indexed = indexedByPath.get(entry.path) || {};
    const rules = rulesBySpecPath.get(entry.path) || indexed.rules || [];
    return {
      path: entry.path,
      load_mode: entry.load_mode,
      reason: entry.reason,
      source: indexed.source || 'unknown',
      confirmation_status: indexed.confirmation_status || 'unknown',
      severity: indexed.severity || 'medium',
      priority: indexed.priority || entry.priority || 0,
      enforcement: classifyCheckEnforcement(indexed),
      rules: rules.map((rule) => ({
        id: rule.id,
        title: rule.title,
        severity: rule.severity || indexed.severity || 'medium',
        confidence: rule.confidence || indexed.confidence || 'medium',
        check_methods: rule.check_methods || ['llm_review_standard'],
      })),
    };
  });
  const reviewItems = standards.flatMap((standard) => {
    if (standard.rules.length === 0) {
      return [{
        type: 'standard',
        standard_path: standard.path,
        rule_id: null,
        title: `Review ${standard.path}`,
        severity: standard.severity,
        enforcement: standard.enforcement,
        status: 'needs_llm_review',
      }];
    }
    return standard.rules.map((rule) => ({
      type: 'rule',
      standard_path: standard.path,
      rule_id: rule.id,
      title: rule.title,
      severity: rule.severity,
      enforcement: standard.enforcement,
      status: 'needs_llm_review',
    }));
  });
  const blockingSuggestionCount = reviewItems
    .filter((item) => item.enforcement === 'blocking_suggestion').length;
  const warningCount = reviewItems
    .filter((item) => item.enforcement === 'warning' || item.enforcement === 'warning_or_blocking_suggestion').length;
  const humanConfirmationCount = reviewItems
    .filter((item) => item.enforcement === 'human_confirmation').length;
  const generatedAt = new Date().toISOString();
  const report = {
    schema_version: 'standards-check-report/v1',
    generated_at: generatedAt,
    target_slug: deriveTargetSlug(targetRoot),
    task_id: taskId,
    task,
    changed_files: files,
    status: blockingSuggestionCount > 0 || warningCount > 0 || humanConfirmationCount > 0 ? 'needs_review' : 'pass',
    hard_gate: false,
    resolve_result: resolveResult,
    summary: {
      loaded_standards: standards.length,
      review_items: reviewItems.length,
      blocking_suggestions: blockingSuggestionCount,
      warnings: warningCount,
      human_confirmations: humanConfirmationCount,
    },
    standards,
    review_items: reviewItems,
  };
  const reportsDir = path.join(targetRoot, 'docs', 'specs', 'reports');
  const jsonPath = path.join(reportsDir, 'spec-check-report.json');
  const markdownPath = path.join(reportsDir, 'spec-check-report.md');
  writeJson(jsonPath, report);
  writeText(markdownPath, renderSpecCheckReportMarkdown(report));

  return {
    ok: true,
    status: report.status,
    hard_gate: false,
    changed_files: files,
    loaded_standards: standards.length,
    review_items: reviewItems.length,
    blocking_suggestions: blockingSuggestionCount,
    warnings: warningCount,
    human_confirmations: humanConfirmationCount,
    report_json: path.relative(targetRoot, jsonPath),
    report_markdown: path.relative(targetRoot, markdownPath),
    resolve_context: path.join('.spec-first', 'workflows', 'spec-check', taskId),
  };
}

function refreshSpecs(options) {
  const indexOnly = options['index-only'] === true || options['index-only'] === 'true';
  const changed = options.changed === true || options.changed === 'true' || Boolean(options.files);
  if (indexOnly && changed) {
    throw new Error('refresh accepts either --index-only or --changed/--files, not both');
  }
  if (changed) {
    return refreshChangedSpecs(options);
  }
  if (!indexOnly) {
    throw new Error('refresh requires --index-only or --changed/--files');
  }

  const targetRoot = resolveTargetRoot(options);
  const specsRoot = path.join(targetRoot, 'docs', 'specs');
  if (!fs.existsSync(specsRoot)) {
    throw new Error(`docs/specs does not exist. Run spec-first specs init --target ${targetRoot}`);
  }

  const beforeHashes = snapshotSpecMarkdownHashes(targetRoot, specsRoot);
  const indexResult = indexSpecs({ target: targetRoot });
  const afterHashes = snapshotSpecMarkdownHashes(targetRoot, specsRoot);
  const modifiedStandards = diffSpecMarkdownHashes(beforeHashes, afterHashes);
  const generatedAt = new Date().toISOString();
  const report = {
    schema_version: 'standards-refresh-report/v1',
    generated_at: generatedAt,
    target_slug: deriveTargetSlug(targetRoot),
    mode: 'index-only',
    hard_gate: false,
    updated_indexes: [
      'docs/specs/_index/specs-index.json',
      'docs/specs/_index/rules-map.json',
      'docs/specs/_index/profiles.json',
      'docs/specs/_index/last-scan.json',
      'docs/specs/_index/specs-index.md',
    ],
    modified_standards: modifiedStandards,
    manual_overwrites: [],
    index: indexResult,
  };
  const reportsDir = path.join(specsRoot, 'reports');
  const jsonPath = path.join(reportsDir, 'spec-refresh-report.json');
  const markdownPath = path.join(reportsDir, 'spec-refresh-report.md');
  writeJson(jsonPath, report);
  writeText(markdownPath, renderSpecRefreshReportMarkdown(report));

  return {
    ok: true,
    mode: 'index-only',
    hard_gate: false,
    updated_indexes: report.updated_indexes,
    modified_standards: modifiedStandards,
    manual_overwrites: [],
    report_json: path.relative(targetRoot, jsonPath),
    report_markdown: path.relative(targetRoot, markdownPath),
    index: indexResult,
  };
}

function diffSpecMarkdownHashes(beforeHashes, afterHashes) {
  const modifiedStandards = [];
  for (const [filePath, beforeHash] of beforeHashes.entries()) {
    if (!afterHashes.has(filePath)) {
      modifiedStandards.push({ path: filePath, change: 'deleted' });
    } else if (afterHashes.get(filePath) !== beforeHash) {
      modifiedStandards.push({ path: filePath, change: 'modified' });
    }
  }
  for (const filePath of afterHashes.keys()) {
    if (!beforeHashes.has(filePath)) {
      modifiedStandards.push({ path: filePath, change: 'created' });
    }
  }
  return modifiedStandards;
}

function refreshChangedSpecs(options) {
  const targetRoot = resolveTargetRoot(options);
  const specsRoot = path.join(targetRoot, 'docs', 'specs');
  if (!fs.existsSync(specsRoot)) {
    throw new Error(`docs/specs does not exist. Run spec-first specs init --target ${targetRoot}`);
  }

  const files = resolveCheckFiles(targetRoot, {
    ...options,
    changed: options.changed === true || options.changed === 'true',
  });
  if (files.length === 0) {
    throw new Error('refresh --changed found no changed files');
  }

  const task = typeof options.task === 'string' && options.task.trim()
    ? options.task.trim()
    : 'refresh standards proposal for changed files';
  const runId = options['run-id'] && typeof options['run-id'] === 'string'
    ? options['run-id']
    : generateRunId();
  if (!RUN_ID_PATTERN.test(runId)) {
    throw new Error(`Invalid --run-id "${runId}". Expected YYYYMMDD-HHMMSS-<6-12 lower alnum>.`);
  }

  const beforeHashes = snapshotSpecMarkdownHashes(targetRoot, specsRoot);
  const resolveResult = resolveSpecs({
    target: targetRoot,
    task,
    files: files.join(','),
  });
  const afterHashes = snapshotSpecMarkdownHashes(targetRoot, specsRoot);
  const modifiedStandards = diffSpecMarkdownHashes(beforeHashes, afterHashes);
  const targetSlug = deriveTargetSlug(targetRoot);
  const baseDir = resolveWorkflowArtifactDir(targetRoot, 'spec-standards-refresh', targetSlug);
  const runDir = path.join(baseDir, runId);
  if (fs.existsSync(runDir)) {
    throw new Error(`Refresh run already exists: ${runDir}`);
  }

  const generatedAt = new Date().toISOString();
  const request = {
    schema_version: 'standards-refresh-proposal-request/v1',
    generated_at: generatedAt,
    target_slug: targetSlug,
    run_id: runId,
    mode: 'changed',
    hard_gate: false,
    task,
    changed_files: files,
    base: options.base || null,
    source_index: 'docs/specs/_index/specs-index.json',
    resolve_result: resolveResult,
    proposal_instruction: [
      'Use this request as input for $spec-standards.',
      'Generate a proposal payload/run if changed files reveal durable standards updates.',
      'Do not modify docs/specs/** directly from refresh --changed.',
      'Human promote remains required before any standard changes become formal.',
    ],
  };
  writeJson(path.join(runDir, 'refresh-request.json'), request);
  writeText(path.join(runDir, 'preview.md'), renderRefreshChangedPreview(request));
  writeJsonl(path.join(runDir, 'check.jsonl'), [
    ...resolveResult.load_full.map((entry) => ({ file: entry.path, mode: 'full', reason: entry.reason })),
    ...resolveResult.load_summary.map((entry) => ({ file: entry.path, mode: 'summary', reason: entry.reason })),
  ]);

  const report = {
    schema_version: 'standards-refresh-report/v1',
    generated_at: generatedAt,
    target_slug: targetSlug,
    mode: 'changed',
    hard_gate: false,
    changed_files: files,
    proposal_request: path.relative(targetRoot, path.join(runDir, 'refresh-request.json')),
    modified_standards: modifiedStandards,
    manual_overwrites: [],
    resolve_summary: {
      load_full: resolveResult.load_full.length,
      load_summary: resolveResult.load_summary.length,
      load_reference: resolveResult.load_reference.length,
      excluded: resolveResult.excluded.length,
    },
  };
  const reportsDir = path.join(specsRoot, 'reports');
  const jsonPath = path.join(reportsDir, 'spec-refresh-report.json');
  const markdownPath = path.join(reportsDir, 'spec-refresh-report.md');
  writeJson(jsonPath, report);
  writeText(markdownPath, renderSpecRefreshReportMarkdown(report));

  return {
    ok: true,
    mode: 'changed',
    hard_gate: false,
    changed_files: files,
    proposal_request: report.proposal_request,
    report_json: path.relative(targetRoot, jsonPath),
    report_markdown: path.relative(targetRoot, markdownPath),
    modified_standards: modifiedStandards,
    manual_overwrites: [],
    resolve_summary: report.resolve_summary,
  };
}

function generateRunId() {
  const now = new Date();
  const yyyy = String(now.getUTCFullYear()).padStart(4, '0');
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const hh = String(now.getUTCHours()).padStart(2, '0');
  const mi = String(now.getUTCMinutes()).padStart(2, '0');
  const ss = String(now.getUTCSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}-${hh}${mi}${ss}-${crypto.randomBytes(4).toString('hex')}`;
}

function listSpecs(options) {
  const targetRoot = resolveTargetRoot(options);
  const specsIndexPath = path.join(targetRoot, 'docs', 'specs', '_index', 'specs-index.json');
  if (!fs.existsSync(specsIndexPath)) {
    throw new Error(`Missing specs index: ${path.relative(targetRoot, specsIndexPath)}. Run spec-first specs index --target ${targetRoot}`);
  }

  const specsIndex = readJsonFile(specsIndexPath);
  const scopeFilter = typeof options.scope === 'string' ? options.scope : null;
  const sourceFilter = typeof options.source === 'string' ? options.source : null;
  const specs = (specsIndex.specs || []).filter((entry) => {
    if (scopeFilter && !(entry.scope || []).includes(scopeFilter) && !(entry.scope || []).includes('all')) return false;
    if (sourceFilter && entry.source !== sourceFilter) return false;
    return true;
  });

  return {
    ok: true,
    source_index: 'docs/specs/_index/specs-index.json',
    filters: {
      scope: scopeFilter,
      source: sourceFilter,
    },
    count: specs.length,
    specs: specs.map((entry) => ({
      id: entry.id,
      path: entry.path,
      title: entry.title,
      source: entry.source,
      confirmation_status: entry.confirmation_status,
      lifecycle_status: entry.lifecycle_status,
      scope: entry.scope,
      priority: entry.priority,
      severity: entry.severity,
      rules_count: entry.rules_count,
    })),
  };
}

function validateSpecs(options) {
  const targetRoot = resolveTargetRoot(options);
  const specsRoot = path.join(targetRoot, 'docs', 'specs');
  if (!fs.existsSync(specsRoot)) {
    throw new Error(`docs/specs does not exist. Run spec-first specs init --target ${targetRoot}`);
  }

  const errors = [];
  const warnings = [];
  const sourceFiles = listMarkdownFiles(specsRoot)
    .filter((filePath) => !isExcludedSpecMarkdown(specsRoot, filePath));

  for (const filePath of sourceFiles) {
    const rel = toPosix(path.relative(targetRoot, filePath));
    const relFromSpecs = toPosix(path.relative(specsRoot, filePath));
    if (relFromSpecs === 'README.md' || relFromSpecs === 'SPEC.md') continue;

    const content = fs.readFileSync(filePath, 'utf8');
    const frontmatter = parseMarkdownFrontmatter(content);
    if (!frontmatter) {
      warnings.push(`${rel} has no frontmatter; index will infer metadata`);
      continue;
    }
    validateFormalSpecFrontmatter(frontmatter, rel, errors);
  }

  const specsIndexPath = path.join(specsRoot, '_index', 'specs-index.json');
  if (!fs.existsSync(specsIndexPath)) {
    warnings.push('docs/specs/_index/specs-index.json is missing; run spec-first specs index');
  }

  return {
    valid: errors.length === 0,
    checked_files: sourceFiles.length,
    errors,
    warnings,
  };
}

function resolveCommandContext(options, { requirePayload }) {
  const runId = options['run-id'];
  const target = options.target;
  const payloadPath = options.payload ? path.resolve(options.payload) : null;

  if (!runId) throw new Error('Missing required --run-id');
  if (!RUN_ID_PATTERN.test(runId)) {
    throw new Error(`Invalid --run-id "${runId}". Expected YYYYMMDD-HHMMSS-<6-12 lower alnum>.`);
  }
  if (!target) throw new Error('Missing required --target');
  if (requirePayload && !payloadPath) throw new Error('Missing required --payload');

  const targetRoot = path.resolve(target);
  const targetSlug = deriveTargetSlug(targetRoot);
  const baseDir = resolveWorkflowArtifactDir(targetRoot, CONSUMER, targetSlug);

  return {
    runId,
    targetRoot,
    targetSlug,
    baseDir,
    runDir: path.join(baseDir, runId),
    payloadPath,
  };
}

function resolveTargetRoot(options) {
  if (!options.target || typeof options.target !== 'string') {
    throw new Error('Missing required --target');
  }
  return path.resolve(options.target);
}

function deriveTargetSlug(targetRoot) {
  const basename = path.basename(targetRoot).toLowerCase();
  const slug = basename
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (!slug || !SAFE_SLUG_PATTERN.test(slug)) {
    throw new Error(`Cannot derive safe target slug from ${targetRoot}`);
  }

  return slug;
}

function validateProposalPayload(payload, context) {
  const errors = [];
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return ['payload must be a JSON object'];
  }

  requireConst(payload.schema_version, PAYLOAD_SCHEMA_VERSION, 'schema_version', errors);
  requireConst(payload.run_id, context.runId, 'run_id', errors);
  requireConst(payload.target_slug, context.targetSlug, 'target_slug', errors);
  requireConst(path.resolve(payload.target_repo || ''), context.targetRoot, 'target_repo', errors);
  requireConst(payload.consumer, CONSUMER, 'consumer', errors);

  if (!EVIDENCE_MODES.has(payload.evidence_mode)) {
    errors.push('evidence_mode must be crg-first, direct-only, or mixed');
  }

  if (typeof payload.preview_markdown !== 'string' || payload.preview_markdown.length === 0) {
    errors.push('preview_markdown must be a non-empty string');
  }

  if (!Array.isArray(payload.detected_profiles)) {
    errors.push('detected_profiles must be an array');
  } else {
    payload.detected_profiles.forEach((profile, index) => validateDetectedProfile(profile, `detected_profiles[${index}]`, errors));
  }

  if (!payload.evidence_map || typeof payload.evidence_map !== 'object' || Array.isArray(payload.evidence_map)) {
    errors.push('evidence_map must be an object');
  } else {
    validateEvidenceMap(payload.evidence_map, context, errors);
  }

  if (!Array.isArray(payload.drafts) || payload.drafts.length === 0) {
    errors.push('drafts must contain at least one draft');
  } else {
    payload.drafts.forEach((draft, index) => validateDraft(draft, index, errors));
  }

  if (payload.rejected && typeof payload.rejected !== 'object') {
    errors.push('rejected must be an object when present');
  }

  if (containsSecretLikeValue(JSON.stringify(payload))) {
    errors.push('payload contains secret-like value; redact before write-proposal');
  }

  return errors;
}

function validateDraft(draft, index, errors) {
  const prefix = `drafts[${index}]`;
  if (!draft || typeof draft !== 'object' || Array.isArray(draft)) {
    errors.push(`${prefix} must be an object`);
    return;
  }

  for (const field of ['path', 'content', 'source', 'confirmation_status', 'lifecycle_status']) {
    if (typeof draft[field] !== 'string' || draft[field].length === 0) {
      errors.push(`${prefix}.${field} must be a non-empty string`);
    }
  }

  if (typeof draft.path === 'string') {
    validateRunLocalDraftPath(draft.path, `${prefix}.path`, errors);
  }

  if (!SOURCES.has(draft.source)) {
    errors.push(`${prefix}.source has invalid value`);
  }
  if (!CONFIRMATION_STATUSES.has(draft.confirmation_status)) {
    errors.push(`${prefix}.confirmation_status has invalid value`);
  }
  if (!LIFECYCLE_STATUSES.has(draft.lifecycle_status)) {
    errors.push(`${prefix}.lifecycle_status has invalid value`);
  }

  if (typeof draft.content === 'string') {
    const frontmatter = parseFrontmatter(draft.content);
    if (!frontmatter) {
      errors.push(`${prefix}.content must start with markdown frontmatter`);
    } else {
      for (const field of ['source', 'confirmation_status', 'lifecycle_status']) {
        if (frontmatter[field] !== draft[field]) {
          errors.push(`${prefix}.content frontmatter ${field} must match draft metadata`);
        }
      }
      if (typeof frontmatter.spec_id !== 'string' || frontmatter.spec_id.length === 0) {
        errors.push(`${prefix}.content frontmatter must include spec_id`);
      }
    }
  }
}

function validateRunLocalDraftPath(value, fieldName, errors) {
  if (path.isAbsolute(value)) {
    errors.push(`${fieldName} must be run-local, not absolute`);
    return;
  }

  const normalized = path.posix.normalize(value.replace(/\\/g, '/'));
  if (normalized.startsWith('../') || normalized === '..' || !normalized.startsWith('drafts/')) {
    errors.push(`${fieldName} must stay under drafts/`);
  }
  if (!normalized.endsWith('.md')) {
    errors.push(`${fieldName} must point to a markdown file`);
  }
}

function validateRunState(state, context, errors) {
  requireConst(state.schema_version, RUN_STATE_SCHEMA_VERSION, 'run-state.schema_version', errors);
  requireConst(state.run_id, context.runId, 'run-state.run_id', errors);
  requireConst(state.target_slug, context.targetSlug, 'run-state.target_slug', errors);
  requireConst(path.resolve(state.target_repo || ''), context.targetRoot, 'run-state.target_repo', errors);
  requireConst(state.consumer, CONSUMER, 'run-state.consumer', errors);
  if (!['running', 'completed', 'failed'].includes(state.status)) {
    errors.push('run-state.status must be running, completed, or failed');
  }
}

function validateDetectedProfilesEnvelope(envelope, errors) {
  requireConst(envelope.schema_version, 'detected-profiles/v1', 'detected-profiles.schema_version', errors);
  if (!Array.isArray(envelope.profiles)) {
    errors.push('detected-profiles.profiles must be an array');
    return;
  }
  envelope.profiles.forEach((profile, index) => validateDetectedProfile(profile, `detected-profiles.profiles[${index}]`, errors));
}

function validateDetectedProfile(profile, prefix, errors) {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
    errors.push(`${prefix} must be an object`);
    return;
  }
  if (typeof profile.id !== 'string' || profile.id.length === 0) {
    errors.push(`${prefix}.id must be a non-empty string`);
  }
  if (!Array.isArray(profile.scope)) {
    errors.push(`${prefix}.scope must be an array`);
  }
  if (!['low', 'medium', 'high'].includes(profile.confidence)) {
    errors.push(`${prefix}.confidence must be low, medium, or high`);
  }
  if (!Array.isArray(profile.evidence)) {
    errors.push(`${prefix}.evidence must be an array`);
  }
  if (!Array.isArray(profile.limitations)) {
    errors.push(`${prefix}.limitations must be an array`);
  }
}

function validateEvidenceMap(evidenceMap, context, errors) {
  requireConst(evidenceMap.version, 1, 'evidence_map.version', errors);
  requireConst(evidenceMap.run_id, context.runId, 'evidence_map.run_id', errors);
  requireConst(evidenceMap.target_slug, context.targetSlug, 'evidence_map.target_slug', errors);
  requireConst(evidenceMap.consumer, CONSUMER, 'evidence_map.consumer', errors);
  if (!EVIDENCE_MODES.has(evidenceMap.evidence_mode)) {
    errors.push('evidence_map.evidence_mode must be crg-first, direct-only, or mixed');
  }
  if (!Array.isArray(evidenceMap.drafts)) {
    errors.push('evidence_map.drafts must be an array');
  }
}

function validateDraftFrontmatter(content, rel, errors) {
  const frontmatter = parseFrontmatter(content);
  if (!frontmatter) {
    errors.push(`${rel} must start with markdown frontmatter`);
    return;
  }

  if (!frontmatter.spec_id) errors.push(`${rel} frontmatter must include spec_id`);
  if (!SOURCES.has(frontmatter.source)) errors.push(`${rel} frontmatter source has invalid value`);
  if (!CONFIRMATION_STATUSES.has(frontmatter.confirmation_status)) {
    errors.push(`${rel} frontmatter confirmation_status has invalid value`);
  }
  if (!LIFECYCLE_STATUSES.has(frontmatter.lifecycle_status)) {
    errors.push(`${rel} frontmatter lifecycle_status has invalid value`);
  }
}

function validateFormalSpecFrontmatter(frontmatter, rel, errors) {
  if (!frontmatter.spec_id) errors.push(`${rel} frontmatter must include spec_id`);
  if (!frontmatter.title) errors.push(`${rel} frontmatter must include title`);
  if (!SOURCES.has(frontmatter.source)) errors.push(`${rel} frontmatter source has invalid value`);
  if (!CONFIRMATION_STATUSES.has(frontmatter.confirmation_status)) {
    errors.push(`${rel} frontmatter confirmation_status has invalid value`);
  }
  if (!LIFECYCLE_STATUSES.has(frontmatter.lifecycle_status)) {
    errors.push(`${rel} frontmatter lifecycle_status has invalid value`);
  }
  if (!Number.isInteger(Number(frontmatter.priority)) || Number(frontmatter.priority) < 0 || Number(frontmatter.priority) > 100) {
    errors.push(`${rel} frontmatter priority must be an integer from 0 to 100`);
  }
  if (frontmatter.severity && !['info', 'low', 'medium', 'high', 'critical'].includes(frontmatter.severity)) {
    errors.push(`${rel} frontmatter severity has invalid value`);
  }
  if (frontmatter.confidence && !['low', 'medium', 'high'].includes(frontmatter.confidence)) {
    errors.push(`${rel} frontmatter confidence has invalid value`);
  }
}

function parseFrontmatter(content) {
  if (typeof content !== 'string' || !content.startsWith('---\n')) {
    return null;
  }
  const end = content.indexOf('\n---', 4);
  if (end === -1) return null;
  const raw = content.slice(4, end);
  const data = {};

  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    const value = match[2].trim().replace(/^['"]|['"]$/g, '');
    data[match[1]] = value;
  }

  return data;
}

function parseFrontmatterBlock(content) {
  if (typeof content !== 'string' || !content.startsWith('---\n')) {
    return null;
  }
  const end = content.indexOf('\n---', 4);
  if (end === -1) return null;
  return content.slice(4, end);
}

function parseMarkdownFrontmatter(content) {
  const raw = parseFrontmatterBlock(content);
  if (!raw) return null;

  const data = {};
  let currentKey = null;
  for (const line of raw.split(/\r?\n/)) {
    const listMatch = line.match(/^\s+-\s*(.*)$/);
    if (listMatch && currentKey) {
      if (!Array.isArray(data[currentKey])) data[currentKey] = [];
      data[currentKey].push(unquote(listMatch[1].trim()));
      continue;
    }

    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) {
      currentKey = null;
      continue;
    }

    currentKey = match[1];
    const value = match[2].trim();
    if (value === '') {
      data[currentKey] = [];
    } else if (/^\d+$/.test(value)) {
      data[currentKey] = Number(value);
      currentKey = null;
    } else if (value.startsWith('[') && value.endsWith(']')) {
      data[currentKey] = value
        .slice(1, -1)
        .split(',')
        .map((entry) => unquote(entry.trim()))
        .filter(Boolean);
      currentKey = null;
    } else {
      data[currentKey] = unquote(value);
      currentKey = null;
    }
  }

  return data;
}

function unquote(value) {
  return value.replace(/^['"]|['"]$/g, '');
}

function promoteDraftContent(content) {
  const frontmatter = parseMarkdownFrontmatter(content);
  if (!frontmatter) return content;

  const replacements = {
    confirmation_status: frontmatter.confirmation_status === 'manual' ? 'manual' : 'confirmed',
    lifecycle_status: 'active',
  };
  let next = content;
  for (const [key, value] of Object.entries(replacements)) {
    const pattern = new RegExp(`^${key}:\\s*.*$`, 'm');
    if (pattern.test(next)) {
      next = next.replace(pattern, `${key}: ${value}`);
    } else {
      next = next.replace('---\n', `---\n${key}: ${value}\n`);
    }
  }

  return next;
}

function isExcludedSpecMarkdown(specsRoot, filePath) {
  const rel = toPosix(path.relative(specsRoot, filePath));
  return rel.startsWith('_index/')
    || rel.startsWith('evidence/')
    || rel.startsWith('reports/');
}

function buildSpecIndexEntry(targetRoot, specsRoot, filePath) {
  const relFromSpecs = toPosix(path.relative(specsRoot, filePath));
  const repoRel = toPosix(path.relative(targetRoot, filePath));
  const content = fs.readFileSync(filePath, 'utf8');
  const frontmatter = parseMarkdownFrontmatter(content);
  const inferred = inferSpecMetadata(relFromSpecs, frontmatter);
  const rules = extractRules(content).map((rule) => ({
    ...rule,
    spec_id: inferred.id,
    spec_path: repoRel,
    source: inferred.source,
    confirmation_status: inferred.confirmation_status,
    lifecycle_status: inferred.lifecycle_status,
    level: inferred.level,
    scope: inferred.scope,
    categories: inferred.categories,
    applies_to_paths: inferred.applies_to_paths,
    keywords: inferred.keywords,
    priority: inferred.priority,
    severity: inferred.severity,
    confidence: inferred.confidence,
    check_methods: ['llm_review_standard'],
  }));

  return {
    id: inferred.id,
    path: repoRel,
    title: inferred.title,
    source: inferred.source,
    level: inferred.level,
    scope: inferred.scope,
    profiles: inferred.profiles,
    categories: inferred.categories,
    keywords: inferred.keywords,
    applies_to_paths: inferred.applies_to_paths,
    priority: inferred.priority,
    severity: inferred.severity,
    confidence: inferred.confidence,
    confirmation_status: inferred.confirmation_status,
    lifecycle_status: inferred.lifecycle_status,
    custom_override: repoRel.startsWith('docs/specs/custom/'),
    metadata_inferred: !frontmatter,
    summary_available: /##\s+Summary for Agent/i.test(content),
    rules_count: rules.length,
    token_estimate: estimateTokens(content),
    rules,
  };
}

function inferSpecMetadata(relFromSpecs, frontmatter) {
  const parsed = path.posix.parse(relFromSpecs);
  const parts = relFromSpecs.split('/');
  const scopeFromPath = parts.length > 1 ? parts[0] : 'common';
  const title = frontmatter?.title || titleFromFilename(parsed.name);
  const id = frontmatter?.spec_id || `${scopeFromPath}-${parsed.name}`.replace(/[^a-zA-Z0-9_-]+/g, '-').toLowerCase();
  const isCustom = scopeFromPath === 'custom';
  const source = frontmatter?.source || 'manual';

  return {
    id,
    title,
    source,
    confirmation_status: frontmatter?.confirmation_status || 'manual',
    lifecycle_status: frontmatter?.lifecycle_status || 'active',
    level: frontmatter?.level || (isCustom ? 'L4' : 'L3'),
    scope: normalizeStringArray(frontmatter?.scope, [scopeFromPath === 'custom' ? 'all' : scopeFromPath]),
    profiles: normalizeStringArray(frontmatter?.profiles, ['all']),
    categories: normalizeStringArray(frontmatter?.categories, [parsed.name]),
    keywords: normalizeStringArray(frontmatter?.keywords, [parsed.name, scopeFromPath]),
    applies_to_paths: normalizeStringArray(frontmatter?.applies_to_paths, ['**/*']),
    priority: normalizePriority(frontmatter?.priority, isCustom ? 100 : 85),
    severity: normalizeEnum(frontmatter?.severity, ['info', 'low', 'medium', 'high', 'critical'], 'medium'),
    confidence: normalizeEnum(frontmatter?.confidence, ['low', 'medium', 'high'], frontmatter ? 'medium' : 'low'),
  };
}

function scoreSpecForTask(spec, context) {
  const scoreParts = [];
  const appliesToPaths = spec.applies_to_paths || [];
  const pathMatch = appliesToPaths
    .filter((pattern) => !isBroadGlob(pattern))
    .some((pattern) => context.files.some((file) => globMatches(pattern, file)));
  if (pathMatch) scoreParts.push({ score: 70, reason: 'changed files match applies_to_paths' });

  const keywordMatches = (spec.keywords || [])
    .filter((keyword) => context.taskTokens.has(String(keyword).toLowerCase()));
  if (keywordMatches.length > 0) {
    scoreParts.push({
      score: Math.min(50, 18 + keywordMatches.length * 8),
      reason: `task matches keywords: ${keywordMatches.slice(0, 5).join(', ')}`,
    });
  }

  const categoryMatches = (spec.categories || [])
    .filter((category) => context.taskTokens.has(String(category).toLowerCase()));
  if (categoryMatches.length > 0) {
    scoreParts.push({
      score: Math.min(35, 15 + categoryMatches.length * 6),
      reason: `task matches categories: ${categoryMatches.slice(0, 5).join(', ')}`,
    });
  }

  const scopeMatches = (spec.scope || [])
    .filter((scope) => context.taskTokens.has(String(scope).toLowerCase()));
  if (scopeMatches.length > 0) {
    scoreParts.push({
      score: 20,
      reason: `task matches scope: ${scopeMatches.slice(0, 5).join(', ')}`,
    });
  }

  const isManual = spec.source === 'manual'
    || spec.confirmation_status === 'manual'
    || spec.custom_override === true;
  if (isManual && (pathMatch || keywordMatches.length > 0 || categoryMatches.length > 0 || scopeMatches.length > 0)) {
    scoreParts.push({ score: 30, reason: 'manual/custom priority boost' });
  }

  const scopeCommon = (spec.scope || []).includes('common') || spec.path === 'docs/specs/SPEC.md';
  if (scopeCommon) {
    scoreParts.push({ score: 25, reason: 'common standards summary is generally relevant' });
  }

  const score = scoreParts.reduce((sum, part) => sum + part.score, 0);
  return {
    ...spec,
    score,
    path_match: pathMatch,
    is_manual: isManual,
    custom_override: spec.custom_override === true,
    scope_common: scopeCommon,
    reason: scoreParts.length > 0
      ? scoreParts.map((part) => part.reason).join('; ')
      : 'No direct match',
  };
}

function isBroadGlob(pattern) {
  const normalized = toPosix(pattern).trim();
  return normalized === '**/*' || normalized === '**' || normalized === '*';
}

function addDependencySummaries({ loadFull, loadSummary, rulesMap, indexedByPath }) {
  const loadedPaths = new Set([...loadFull, ...loadSummary].map((entry) => entry.path));
  let addedTokenEstimate = 0;
  const dependencies = rulesMap.dependencies || {};

  for (const entry of [...loadFull]) {
    for (const dep of dependencies[entry.path] || []) {
      if (loadedPaths.has(dep)) continue;
      const indexed = indexedByPath.get(dep);
      loadSummary.push({
        path: dep,
        reason: `dependency of ${entry.path}`,
        priority: indexed?.priority || 50,
        score: indexed?.score || 0,
      });
      loadedPaths.add(dep);
      addedTokenEstimate += indexed ? summaryTokenEstimate(indexed) : 200;
    }
  }

  return { addedTokenEstimate };
}

function writeResolveContext({ targetRoot, consumer, taskId, result }) {
  const safeConsumer = safeTaskSlug(consumer);
  const artifactDir = resolveWorkflowArtifactDir(targetRoot, safeConsumer, taskId);
  fs.mkdirSync(artifactDir, { recursive: true });
  writeJson(path.join(artifactDir, 'resolve-result.json'), result);
  writeJsonl(path.join(artifactDir, 'implement.jsonl'), [
    ...result.load_full.map((entry) => ({ file: entry.path, mode: 'full', reason: entry.reason })),
    ...result.load_summary.map((entry) => ({ file: entry.path, mode: 'summary', reason: entry.reason })),
  ]);
  writeJsonl(path.join(artifactDir, 'check.jsonl'), [
    ...result.load_full.map((entry) => ({ file: entry.path, mode: 'full', reason: entry.reason })),
    ...result.load_summary.map((entry) => ({ file: entry.path, mode: 'summary', reason: entry.reason })),
  ]);
}

function resolveCheckFiles(targetRoot, options) {
  if (options.files && options.files !== true) {
    return parseCsv(options.files);
  }
  if (options.changed === true || options.changed === 'true') {
    return getGitChangedFiles(targetRoot, options.base || 'HEAD');
  }
  throw new Error('specs check requires --changed or --files <comma-list>');
}

function getGitChangedFiles(targetRoot, base) {
  try {
    const output = execFileSync('git', ['-C', targetRoot, 'diff', '--name-only', String(base), '--'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return output
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map(toPosix);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to resolve changed files from git diff ${base}: ${message}`);
  }
}

function groupRulesBySpecPath(rules) {
  const grouped = new Map();
  for (const rule of rules) {
    if (!rule.spec_path) continue;
    if (!grouped.has(rule.spec_path)) grouped.set(rule.spec_path, []);
    grouped.get(rule.spec_path).push(rule);
  }
  return grouped;
}

function classifyCheckEnforcement(spec) {
  const source = spec.source || 'unknown';
  const confirmation = spec.confirmation_status || 'unknown';
  const severity = spec.severity || 'medium';
  const isManual = source === 'manual'
    || source === 'imported'
    || confirmation === 'manual'
    || spec.custom_override === true;

  if (confirmation === 'uncertain' || confirmation === 'conflict') return 'human_confirmation';
  if (isManual && (severity === 'critical' || severity === 'high')) return 'blocking_suggestion';
  if (source === 'extracted' && confirmation === 'confirmed') return 'warning_or_blocking_suggestion';
  if (confirmation === 'inferred') return 'warning';
  return 'advisory';
}

function renderSpecCheckReportMarkdown(report) {
  const lines = [
    '# Spec Check Report',
    '',
    '## Summary',
    '',
    `- Status: ${report.status}`,
    `- Hard gate: ${report.hard_gate}`,
    `- Changed files: ${report.changed_files.length}`,
    `- Loaded standards: ${report.summary.loaded_standards}`,
    `- Review items: ${report.summary.review_items}`,
    `- Blocking suggestions: ${report.summary.blocking_suggestions}`,
    `- Warnings: ${report.summary.warnings}`,
    `- Human confirmations: ${report.summary.human_confirmations}`,
    '',
    'This report is review assistance, not an automatic gate. The LLM/reviewer must inspect loaded standards and diff evidence before reporting a violation.',
    '',
    '## Changed Files',
    '',
  ];

  if (report.changed_files.length === 0) {
    lines.push('- None');
  } else {
    for (const file of report.changed_files) lines.push(`- \`${file}\``);
  }

  lines.push('', '## Loaded Standards', '');
  if (report.standards.length === 0) {
    lines.push('- None');
  } else {
    for (const standard of report.standards) {
      lines.push(`- \`${standard.path}\` (${standard.load_mode}, ${standard.enforcement}, ${standard.severity})`);
    }
  }

  lines.push('', '## Review Items', '');
  if (report.review_items.length === 0) {
    lines.push('- None');
  } else {
    for (const item of report.review_items) {
      const rule = item.rule_id ? `${item.rule_id} ` : '';
      lines.push(`- [${item.enforcement}] ${rule}${item.title} — \`${item.standard_path}\``);
    }
  }

  lines.push('');
  return lines.join('\n');
}

function snapshotSpecMarkdownHashes(targetRoot, specsRoot) {
  const hashes = new Map();
  for (const filePath of listMarkdownFiles(specsRoot)) {
    if (isExcludedSpecMarkdown(specsRoot, filePath)) continue;
    const rel = toPosix(path.relative(targetRoot, filePath));
    hashes.set(rel, sha256(fs.readFileSync(filePath)));
  }
  return hashes;
}

function renderSpecRefreshReportMarkdown(report) {
  if (report.mode === 'changed') {
    return renderSpecRefreshChangedReportMarkdown(report);
  }

  const lines = [
    '# Spec Refresh Report',
    '',
    '## Summary',
    '',
    `- Mode: ${report.mode}`,
    `- Hard gate: ${report.hard_gate}`,
    `- Specs indexed: ${report.index.specs_count}`,
    `- Rules indexed: ${report.index.rules_count}`,
    `- Source specs hash: ${report.index.source_specs_hash}`,
    `- Modified standards: ${report.modified_standards.length}`,
    `- Manual overwrites: ${report.manual_overwrites.length}`,
    '',
    'This index-only refresh rebuilds machine-readable indexes and does not modify standards markdown.',
    '',
    '## Updated Indexes',
    '',
  ];

  for (const filePath of report.updated_indexes) {
    lines.push(`- \`${filePath}\``);
  }

  lines.push('', '## Modified Standards', '');
  if (report.modified_standards.length === 0) {
    lines.push('- None');
  } else {
    for (const item of report.modified_standards) {
      lines.push(`- ${item.change}: \`${item.path}\``);
    }
  }

  lines.push('');
  return lines.join('\n');
}

function renderSpecRefreshChangedReportMarkdown(report) {
  const lines = [
    '# Spec Refresh Report',
    '',
    '## Summary',
    '',
    `- Mode: ${report.mode}`,
    `- Hard gate: ${report.hard_gate}`,
    `- Proposal request: \`${report.proposal_request}\``,
    `- Loaded full standards: ${report.resolve_summary.load_full}`,
    `- Loaded summary standards: ${report.resolve_summary.load_summary}`,
    `- Reference standards: ${report.resolve_summary.load_reference}`,
    `- Excluded standards: ${report.resolve_summary.excluded}`,
    `- Modified standards: ${report.modified_standards.length}`,
    `- Manual overwrites: ${report.manual_overwrites.length}`,
    '',
    'This changed refresh only prepares a proposal request. It does not modify standards markdown; human promote is still required before any durable standards change.',
    '',
    '## Changed Files',
    '',
  ];

  for (const file of report.changed_files) {
    lines.push(`- \`${file}\``);
  }

  lines.push('', '## Modified Standards', '');
  if (report.modified_standards.length === 0) {
    lines.push('- None');
  } else {
    for (const item of report.modified_standards) {
      lines.push(`- ${item.change}: \`${item.path}\``);
    }
  }

  lines.push('');
  return lines.join('\n');
}

function renderRefreshChangedPreview(request) {
  const lines = [
    '# Standards Refresh Proposal Request',
    '',
    '## Summary',
    '',
    `- Mode: ${request.mode}`,
    `- Run ID: ${request.run_id}`,
    `- Target slug: ${request.target_slug}`,
    `- Hard gate: ${request.hard_gate}`,
    `- Task: ${request.task}`,
    '',
    'This run is a proposal request for `$spec-standards`. It must not be treated as a formal standards update until a proposal is generated, reviewed, and promoted by a human.',
    '',
    '## Changed Files',
    '',
  ];

  for (const file of request.changed_files) {
    lines.push(`- \`${file}\``);
  }

  lines.push('', '## Resolved Standards', '');
  const full = request.resolve_result.load_full || [];
  const summary = request.resolve_result.load_summary || [];
  if (full.length === 0 && summary.length === 0) {
    lines.push('- None');
  } else {
    for (const entry of full) {
      lines.push(`- full: \`${entry.path}\` — ${entry.reason}`);
    }
    for (const entry of summary) {
      lines.push(`- summary: \`${entry.path}\` — ${entry.reason}`);
    }
  }

  lines.push('', '## Proposal Instruction', '');
  for (const item of request.proposal_instruction) {
    lines.push(`- ${item}`);
  }

  lines.push('');
  return lines.join('\n');
}

function writeJsonl(filePath, rows) {
  writeText(filePath, `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`);
}

function extractRules(content) {
  const rules = [];
  const pattern = /^###\s+(RULE-[A-Z0-9_-]+)\s+(.+)$/gm;
  let match;
  while ((match = pattern.exec(content)) !== null) {
    rules.push({
      id: match[1],
      title: match[2].trim(),
    });
  }
  return rules;
}

function tokenize(text) {
  return new Set(String(text)
    .toLowerCase()
    .split(/[^a-z0-9_\u4e00-\u9fff]+/u)
    .filter((token) => token.length >= 2));
}

function parseCsv(value) {
  if (!value || value === true) return [];
  return String(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map(toPosix);
}

function parseDraftDecisionList(value) {
  return parseCsv(value).map((entry) => {
    const normalized = path.posix.normalize(entry);
    if (normalized.startsWith('../') || normalized === '..' || path.isAbsolute(normalized)) {
      throw new Error(`Invalid draft decision path: ${entry}`);
    }
    const withPrefix = normalized.startsWith('drafts/')
      ? normalized
      : path.posix.join('drafts', normalized);
    if (!withPrefix.endsWith('.md')) {
      throw new Error(`Draft decision path must point to markdown: ${entry}`);
    }
    return withPrefix;
  });
}

function globMatches(pattern, filePath) {
  const normalizedPattern = toPosix(pattern);
  const normalizedFile = toPosix(filePath);
  if (normalizedPattern === '**/*') return true;
  const escaped = normalizedPattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '\u0000')
    .replace(/\*/g, '[^/]*')
    .replace(/\u0000/g, '.*');
  return new RegExp(`^${escaped}$`).test(normalizedFile);
}

function summaryTokenEstimate(item) {
  return Math.min(300, Math.max(80, Math.ceil((item.token_estimate || 400) / 4)));
}

function inferTaskType(taskTokens, files) {
  if (files.some((file) => /test|spec/i.test(file)) || taskTokens.has('test') || taskTokens.has('测试')) {
    return 'test_addition';
  }
  if (taskTokens.has('api') || taskTokens.has('接口') || files.some((file) => /controller|handler|route/i.test(file))) {
    return 'backend_api_development';
  }
  if (taskTokens.has('component') || taskTokens.has('组件') || files.some((file) => /src\/(components|views|pages)\//i.test(file))) {
    return 'frontend_component_development';
  }
  if (taskTokens.has('refactor') || taskTokens.has('重构')) return 'refactor';
  if (taskTokens.has('bug') || taskTokens.has('fix') || taskTokens.has('修复')) return 'bugfix';
  return 'general_development';
}

function safeTaskSlug(value) {
  const slug = String(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || 'standards-task';
}

function normalizeStringArray(value, fallback) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string' && value.length > 0) return [value];
  return fallback;
}

function normalizePriority(value, fallback) {
  const number = typeof value === 'number' ? value : Number(value);
  if (Number.isInteger(number) && number >= 0 && number <= 100) return number;
  return fallback;
}

function normalizeEnum(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function titleFromFilename(name) {
  return name
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function estimateTokens(content) {
  return Math.ceil(content.length / 4);
}

function renderSpecsIndexMarkdown(indexed) {
  const lines = [
    '# Specs Index',
    '',
    '| ID | Path | Source | Priority | Rules |',
    '| --- | --- | --- | ---: | ---: |',
  ];
  for (const entry of indexed) {
    lines.push(`| ${entry.id} | ${entry.path} | ${entry.source} | ${entry.priority} | ${entry.rules_count} |`);
  }
  lines.push('');
  return lines.join('\n');
}

function resolveRunLocalPath(runDir, relativePath, expectedTopDir) {
  validateRunLocalDraftPath(relativePath, 'draft.path', []);
  const normalized = path.posix.normalize(relativePath.replace(/\\/g, '/'));
  if (!normalized.startsWith(`${expectedTopDir}/`)) {
    throw new Error(`Path must stay under ${expectedTopDir}/: ${relativePath}`);
  }
  const fullPath = path.join(runDir, ...normalized.split('/'));
  const relative = path.relative(runDir, fullPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Path escapes run directory: ${relativePath}`);
  }
  return fullPath;
}

function requireConst(actual, expected, field, errors) {
  if (actual !== expected) {
    errors.push(`${field} must be ${JSON.stringify(expected)}`);
  }
}

function containsSecretLikeValue(text) {
  return SECRET_PATTERNS.some((pattern) => pattern.test(text));
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readJsonIfPresent(filePath, errors, rel) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return readJsonFile(filePath);
  } catch (error) {
    errors.push(`${rel} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

function writeJson(filePath, value) {
  writeText(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function writeFileIfAbsent(filePath, content) {
  if (fs.existsSync(filePath)) return false;
  writeText(filePath, content);
  return true;
}

function isRegularFileInside(root, filePath) {
  const relative = path.relative(root, filePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return false;
  if (!fs.existsSync(filePath)) return false;
  const stat = fs.lstatSync(filePath);
  return stat.isFile() && !stat.isSymbolicLink();
}

function listMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const next = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listMarkdownFiles(next));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(next);
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function unique(values) {
  return [...new Set(values)];
}

module.exports = {
  runSpecs,
  initSpecs,
  promoteRun,
  indexSpecs,
  resolveSpecs,
  checkSpecs,
  refreshSpecs,
  listSpecs,
  validateSpecs,
  writeProposal,
  validateRun,
  validateProposalPayload,
  deriveTargetSlug,
};
