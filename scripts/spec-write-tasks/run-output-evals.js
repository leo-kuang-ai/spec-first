#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const {
  computeSourcePlanHash,
  parseFrontmatterScalars,
  splitMarkdownFrontmatter,
  validateTaskPack,
} = require('../../src/cli/task-pack');

const DEFAULT_CASES = 'skills/spec-write-tasks/evals/output-quality-cases.json';
const DEFAULT_OUTPUT_DIR = 'docs/validation/spec-write-tasks';
const ADJUDICATED_STATUSES = new Set(['model-adjudicated', 'human-adjudicated']);

function parseArgs(argv) {
  const args = {
    repoRoot: process.cwd(),
    casesPath: DEFAULT_CASES,
    outputDir: DEFAULT_OUTPUT_DIR,
    recordedOutputDir: null,
    rawArgs: argv.slice(),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--repo') {
      args.repoRoot = argv[++index];
    } else if (arg === '--cases') {
      args.casesPath = argv[++index];
    } else if (arg === '--output-dir') {
      args.outputDir = argv[++index];
    } else if (arg === '--recorded-output-dir') {
      args.recordedOutputDir = argv[++index];
    } else if (arg === '--help') {
      args.help = true;
    } else {
      throw new Error(`unexpected argument: ${arg}`);
    }
  }

  args.repoRoot = path.resolve(args.repoRoot);
  args.casesPath = path.resolve(args.repoRoot, args.casesPath);
  args.outputDir = path.resolve(args.repoRoot, args.outputDir);
  args.recordedOutputDir = args.recordedOutputDir
    ? path.resolve(args.repoRoot, args.recordedOutputDir)
    : null;
  return args;
}

function usage() {
  return [
    'Usage: node scripts/spec-write-tasks/run-output-evals.js [--repo .] [--cases PATH] [--output-dir PATH] [--recorded-output-dir PATH]',
    '',
    'Runs deterministic assertions from output-quality-cases.json and writes scorecard reports.',
  ].join('\n');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function repoRelative(repoRoot, filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join('/');
}

function resolveRepoPath(repoRoot, repoRelativePath) {
  return path.resolve(repoRoot, repoRelativePath);
}

function hashFile(filePath) {
  const hash = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
  return `sha256:${hash}`;
}

function gitRevision(repoRoot) {
  const proc = spawnSync('git', ['rev-parse', '--short', 'HEAD'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  return proc.status === 0 ? proc.stdout.trim() : 'unknown';
}

function isInsidePath(parentPath, childPath) {
  const relative = path.relative(parentPath, childPath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function stableArg(repoRoot, arg) {
  if (typeof arg !== 'string' || arg === '') return arg;
  if (path.isAbsolute(arg)) {
    const resolved = path.resolve(arg);
    if (isInsidePath(repoRoot, resolved)) return repoRelative(repoRoot, resolved);
    return '<external-path>';
  }
  return arg.split(path.sep).join('/');
}

function commandString(repoRoot, rawArgs = []) {
  return ['node', 'scripts/spec-write-tasks/run-output-evals.js', ...rawArgs.map((arg) => stableArg(repoRoot, arg))].join(' ');
}

function parseTaskPackContract(markdown) {
  const heading = /^##\s+Task Pack Contract\s*$/m.exec(markdown);
  if (!heading) return null;
  const sectionStart = heading.index + heading[0].length;
  const rest = markdown.slice(sectionStart);
  const nextHeading = /^##\s+/m.exec(rest);
  const section = nextHeading ? rest.slice(0, nextHeading.index) : rest;
  const fence = section.match(/```json\s*([\s\S]*?)\s*```/);
  return fence ? JSON.parse(fence[1]) : null;
}

function assertionPass(id, assertion) {
  return {
    id,
    kind: assertion.kind,
    target_file: assertion.target_file || null,
    status: 'passed',
  };
}

function assertionFail(id, assertion, message) {
  return {
    id,
    kind: assertion.kind,
    target_file: assertion.target_file || null,
    status: 'failed',
    message,
  };
}

function runAssertion(assertion, repoRoot) {
  const id = assertion.id || '<missing-id>';
  if (!assertion.kind) return assertionFail(id, assertion, 'missing assertion kind');
  const targetPath = assertion.target_file ? resolveRepoPath(repoRoot, assertion.target_file) : null;

  if (targetPath && !fs.existsSync(targetPath)) {
    return assertionFail(id, assertion, `target file missing: ${assertion.target_file}`);
  }

  if (assertion.kind === 'file_contains') {
    const content = fs.readFileSync(targetPath, 'utf8');
    return content.includes(assertion.expected)
      ? assertionPass(id, assertion)
      : assertionFail(id, assertion, `expected content not found: ${assertion.expected}`);
  }

  if (assertion.kind === 'file_not_contains') {
    const content = fs.readFileSync(targetPath, 'utf8');
    return !content.includes(assertion.expected)
      ? assertionPass(id, assertion)
      : assertionFail(id, assertion, `forbidden content found: ${assertion.expected}`);
  }

  if (assertion.kind === 'frontmatter_equals') {
    const split = splitMarkdownFrontmatter(fs.readFileSync(targetPath, 'utf8'));
    if (split.error) return assertionFail(id, assertion, split.error.message);
    const frontmatter = parseFrontmatterScalars(split.frontmatter);
    return frontmatter[assertion.field] === assertion.expected
      ? assertionPass(id, assertion)
      : assertionFail(id, assertion, `frontmatter ${assertion.field} expected ${assertion.expected}, got ${frontmatter[assertion.field]}`);
  }

  if (assertion.kind === 'task_pack_validation') {
    const validation = validateTaskPack(targetPath, { repoRoot });
    const expectedValidity = assertion.expected && assertion.expected.task_pack_validity;
    const expectedHandoff = assertion.expected && assertion.expected.deterministic_handoff;
    if (expectedValidity && validation.task_pack_validity !== expectedValidity) {
      return assertionFail(id, assertion, `task_pack_validity expected ${expectedValidity}, got ${validation.task_pack_validity}`);
    }
    if (typeof expectedHandoff === 'boolean' && validation.deterministic_handoff !== expectedHandoff) {
      return assertionFail(id, assertion, `deterministic_handoff expected ${expectedHandoff}, got ${validation.deterministic_handoff}`);
    }
    return assertionPass(id, assertion);
  }

  if (assertion.kind === 'task_contract_every_task_has_fields') {
    const contract = parseTaskPackContract(fs.readFileSync(targetPath, 'utf8'));
    if (!contract || !Array.isArray(contract.tasks)) {
      return assertionFail(id, assertion, 'Task Pack Contract tasks missing');
    }
    const fields = assertion.fields || [];
    const missing = [];
    for (const task of contract.tasks) {
      for (const field of fields) {
        const value = task[field];
        if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
          missing.push(`${task.task_id || '<unknown>'}.${field}`);
        }
      }
    }
    return missing.length === 0
      ? assertionPass(id, assertion)
      : assertionFail(id, assertion, `missing fields: ${missing.join(', ')}`);
  }

  if (assertion.kind === 'task_contract_any_task_has_review_gate') {
    const contract = parseTaskPackContract(fs.readFileSync(targetPath, 'utf8'));
    if (!contract || !Array.isArray(contract.tasks)) {
      return assertionFail(id, assertion, 'Task Pack Contract tasks missing');
    }
    const gate = assertion.expected || 'required';
    return contract.tasks.some((task) => task.review_gate === gate)
      ? assertionPass(id, assertion)
      : assertionFail(id, assertion, `no task has review_gate: ${gate}`);
  }

  if (assertion.kind === 'task_contract_no_generated_runtime_files') {
    const contract = parseTaskPackContract(fs.readFileSync(targetPath, 'utf8'));
    if (!contract || !Array.isArray(contract.tasks)) {
      return assertionFail(id, assertion, 'Task Pack Contract tasks missing');
    }
    const bad = [];
    for (const task of contract.tasks) {
      for (const filePath of task.files || []) {
        if (filePath.startsWith('.claude/') || filePath.startsWith('.codex/') || filePath.startsWith('.agents/skills/')) {
          bad.push(`${task.task_id || '<unknown>'}:${filePath}`);
        }
      }
    }
    return bad.length === 0
      ? assertionPass(id, assertion)
      : assertionFail(id, assertion, `generated runtime files present: ${bad.join(', ')}`);
  }

  return assertionFail(id, assertion, `unknown assertion kind: ${assertion.kind}`);
}

function loadRecordedOutputs(repoRoot, recordedDir) {
  if (!fs.existsSync(recordedDir)) return [];
  return fs.readdirSync(recordedDir)
    .filter((entry) => entry.endsWith('.adjudication.json'))
    .map((entry) => {
      const filePath = path.join(recordedDir, entry);
      const record = readJson(filePath);
      const outputPath = resolveRepoPath(repoRoot, record.recorded_output);
      const actualHash = fs.existsSync(outputPath) ? hashFile(outputPath) : null;
      const sourcePlanPath = record.source_plan ? resolveRepoPath(repoRoot, record.source_plan) : null;
      const sourceHashResult = sourcePlanPath ? computeSourcePlanHash(sourcePlanPath) : null;
      const sourcePlanHashActual = sourceHashResult && sourceHashResult.ok ? sourceHashResult.hash : null;
      let sourcePlanHashStatus = 'missing';
      if (record.source_plan_hash && sourcePlanHashActual) {
        sourcePlanHashStatus = record.source_plan_hash === sourcePlanHashActual ? 'matched' : 'mismatch';
      } else if (record.source_plan_hash && sourceHashResult && !sourceHashResult.ok) {
        sourcePlanHashStatus = 'unavailable';
      }
      return {
        ...record,
        adjudication_file: repoRelative(repoRoot, filePath),
        output_hash_actual: actualHash,
        hash_status: actualHash === record.output_hash ? 'matched' : 'mismatch',
        source_plan_hash_actual: sourcePlanHashActual,
        source_plan_hash_status: sourcePlanHashStatus,
      };
    });
}

function runOutputEvals(options = {}) {
  const repoRoot = path.resolve(options.repoRoot || process.cwd());
  const casesPath = path.resolve(repoRoot, options.casesPath || DEFAULT_CASES);
  const outputDir = path.resolve(repoRoot, options.outputDir || DEFAULT_OUTPUT_DIR);
  const recordedOutputDir = options.recordedOutputDir
    ? path.resolve(repoRoot, options.recordedOutputDir)
    : null;
  const payload = readJson(casesPath);
  const generatedAt = new Date().toISOString();
  const cases = [];
  const structuralErrors = [];

  for (const evalCase of payload.cases || []) {
    const inputFiles = evalCase.input_files || [];
    const missingInputs = inputFiles
      .map((entry) => entry.path)
      .filter((filePath) => !fs.existsSync(resolveRepoPath(repoRoot, filePath)));
    for (const missing of missingInputs) {
      structuralErrors.push({ case_id: evalCase.id, reason_code: 'input_file_missing', path: missing });
    }

    const assertionResults = (evalCase.deterministic_assertions || [])
      .map((assertion) => runAssertion(assertion, repoRoot));
    const failedAssertions = assertionResults.filter((result) => result.status !== 'passed');
    const missingEvidence = evalCase.missing_evidence || [];
    const evidenceModes = new Set(['fixture-backed']);
    if (missingEvidence.length > 0) evidenceModes.add('missing-evidence');

    cases.push({
      id: evalCase.id,
      input_files: inputFiles,
      baseline_risks: evalCase.baseline_risks || [],
      with_skill_expectations: evalCase.with_skill_expectations || [],
      expected_outcome: evalCase.expected_outcome || null,
      deterministic_assertions: {
        total: assertionResults.length,
        passed: assertionResults.filter((result) => result.status === 'passed').length,
        failed: failedAssertions.length,
        results: assertionResults,
      },
      objective_assertions_count: (evalCase.objective_assertions || []).length,
      evidence_status: evalCase.evidence_status || 'unknown',
      evidence_modes: [...evidenceModes],
      missing_evidence: missingEvidence,
    });
  }

  const recordedOutputs = recordedOutputDir ? loadRecordedOutputs(repoRoot, recordedOutputDir) : [];
  for (const record of recordedOutputs) {
    if (record.hash_status !== 'matched') {
      structuralErrors.push({
        case_id: record.id,
        reason_code: 'recorded_output_hash_mismatch',
        expected_hash: record.output_hash,
        actual_hash: record.output_hash_actual,
      });
    }
    if (record.source_plan_hash_status !== 'matched') {
      structuralErrors.push({
        case_id: record.id,
        reason_code: record.source_plan_hash_status === 'mismatch'
          ? 'recorded_output_source_plan_hash_mismatch'
          : 'recorded_output_source_plan_hash_unavailable',
        expected_hash: record.source_plan_hash,
        actual_hash: record.source_plan_hash_actual,
      });
    }
    const adjudicationStatus = record.adjudication && record.adjudication.status;
    if (!ADJUDICATED_STATUSES.has(adjudicationStatus)) {
      structuralErrors.push({
        case_id: record.id,
        reason_code: 'recorded_output_adjudication_not_complete',
        adjudication_status: adjudicationStatus || 'missing',
      });
    }
  }

  const allAssertionResults = cases.flatMap((entry) => entry.deterministic_assertions.results);
  const failedAssertions = allAssertionResults.filter((result) => result.status !== 'passed');
  const scorecard = {
    schema_version: 'spec-first.spec-write-tasks-output-quality-scorecard.v1',
    generated_at: generatedAt,
    command: options.command || commandString(repoRoot, options.rawArgs || []),
    rerun_command: 'node scripts/spec-write-tasks/run-output-evals.js',
    source_revision: gitRevision(repoRoot),
    source_cases: repoRelative(repoRoot, casesPath),
    recorded_output_dir: recordedOutputDir ? repoRelative(repoRoot, recordedOutputDir) : null,
    rollback_boundary: '重新生成 docs/validation/spec-write-tasks/output_quality_scorecard.{json,md}；不要 patch generated runtime mirrors。',
    owner: 'spec-first maintainers',
    review_cadence: '在有意义的 spec-write-tasks behavior、packaging、eval 或 handoff contract 变更前重跑。',
    output_contract: '执行 deterministic assertions；仅在显式传入 --recorded-output-dir 时校验 recorded output 的 source/output hashes。semantic quality 不成为 hard validator gate。',
    score_is_signal_not_gate: true,
    evidence_modes: ['fixture-backed', 'recorded-fixture', 'model-executed', 'model-adjudicated', 'human-adjudicated', 'missing-evidence'],
    summary: {
      case_count: cases.length,
      deterministic_assertions: allAssertionResults.length,
      deterministic_passed: allAssertionResults.length - failedAssertions.length,
      deterministic_failed: failedAssertions.length,
      structural_errors: structuralErrors.length,
      recorded_outputs: recordedOutputs.length,
      adjudicated_outputs: recordedOutputs.filter((record) => ADJUDICATED_STATUSES.has(record.adjudication && record.adjudication.status)).length,
      pending_or_unknown_adjudications: recordedOutputs.filter((record) => !ADJUDICATED_STATUSES.has(record.adjudication && record.adjudication.status)).length,
    },
    recorded_outputs: recordedOutputs,
    cases,
    structural_errors: structuralErrors,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  const jsonPath = path.join(outputDir, 'output_quality_scorecard.json');
  const mdPath = path.join(outputDir, 'output_quality_scorecard.md');
  fs.writeFileSync(jsonPath, `${JSON.stringify(scorecard, null, 2)}\n`, 'utf8');
  fs.writeFileSync(mdPath, renderMarkdown(scorecard), 'utf8');

  return {
    ok: structuralErrors.length === 0 && failedAssertions.length === 0,
    scorecard,
    jsonPath,
    mdPath,
  };
}

function renderMarkdown(scorecard) {
  const evidenceLabel = (value) => ({
    'model execution evidence': '模型执行证据',
    'human adjudication': '人工裁决',
    'provider telemetry': 'provider telemetry 证据',
  }[value] || value);
  const lines = [
    '# spec-write-tasks 输出质量评分卡',
    '',
    `- generated_at: ${scorecard.generated_at}`,
    `- command: \`${scorecard.command}\``,
    `- rerun_command: \`${scorecard.rerun_command}\``,
    `- source_revision: \`${scorecard.source_revision}\``,
    `- owner: ${scorecard.owner}`,
    `- review_cadence: ${scorecard.review_cadence}`,
    `- output_contract: ${scorecard.output_contract}`,
    `- score_is_signal_not_gate: ${scorecard.score_is_signal_not_gate}`,
    `- rollback_boundary: ${scorecard.rollback_boundary}`,
    '',
    '## 摘要',
    '',
    `- cases: ${scorecard.summary.case_count}`,
    `- deterministic_assertions: ${scorecard.summary.deterministic_passed}/${scorecard.summary.deterministic_assertions} 通过`,
    `- structural_errors: ${scorecard.summary.structural_errors}`,
    `- recorded_outputs: ${scorecard.summary.recorded_outputs}`,
    `- adjudicated_outputs: ${scorecard.summary.adjudicated_outputs}`,
    `- pending_or_unknown_adjudications: ${scorecard.summary.pending_or_unknown_adjudications}`,
    '',
    '## 用例',
    '',
    '| 用例 | Deterministic | Evidence | 预期记录 | 缺失证据项数 |',
    '| --- | --- | --- | --- | --- |',
  ];

  for (const entry of scorecard.cases) {
    lines.push(`| ${entry.id} | ${entry.deterministic_assertions.passed}/${entry.deterministic_assertions.total} | ${entry.evidence_modes.join(', ')} | ${entry.expected_outcome ? '已记录' : '未记录'} | ${(entry.missing_evidence || []).length} |`);
  }

  lines.push('', '## 记录输出', '');
  if (scorecard.recorded_outputs.length === 0) {
    lines.push('- 无');
  } else {
    for (const record of scorecard.recorded_outputs) {
      lines.push(`- ${record.id}: ${record.adjudication && record.adjudication.status ? record.adjudication.status : 'unknown'}; hash_status=${record.hash_status}; source_plan_hash_status=${record.source_plan_hash_status}; output=${record.recorded_output}`);
    }
  }

  lines.push('', '## 缺失证据', '');
  const missing = new Set(scorecard.cases.flatMap((entry) => entry.missing_evidence || []));
  if (missing.size === 0) {
    lines.push('- 无');
  } else {
    for (const item of [...missing].sort()) lines.push(`- ${evidenceLabel(item)}`);
  }

  return `${lines.join('\n')}\n`;
}

if (require.main === module) {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (args.help) {
      console.log(usage());
      process.exit(0);
    }
    const result = runOutputEvals(args);
    console.log(JSON.stringify({
      ok: result.ok,
      json: repoRelative(args.repoRoot, result.jsonPath),
      markdown: repoRelative(args.repoRoot, result.mdPath),
      deterministic_failed: result.scorecard.summary.deterministic_failed,
      structural_errors: result.scorecard.summary.structural_errors,
    }, null, 2));
    process.exit(result.ok ? 0 : 1);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = {
  runOutputEvals,
  runAssertion,
};
