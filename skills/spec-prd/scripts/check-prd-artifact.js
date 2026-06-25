#!/usr/bin/env node
'use strict';

// 确定性 PRD artifact 检查:只报告 Markdown 结构、frontmatter、trace、占位符等
// script-owned facts。是否构成 readiness blocker 由 PRD readiness lens 语义裁决。

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CORE_SECTIONS = [
  'Summary',
  'Change Delta',
  'Requirements',
  'Acceptance Examples',
  'Scope Boundaries',
  'Evidence And Assumptions',
];

const EVIDENCE_TAGS = [
  'confirmed-source',
  'user-stated',
  'source-candidate',
  'external-research',
  'assumption',
];

const BLOCKING_REASON_CODES = new Set([
  'core_section_missing',
  'write_mode_undeclared',
  'clarification_evidence_undeclared',
  'clarification_trace_absent',
  'can_enter_spec_plan_undeclared',
  'preflight_sweep_closure_absent',
  'design_source_inventory_undeclared',
  'design_source_coverage_undeclared',
  'design_sources_read_undeclared',
  'design_sources_unread_undeclared',
  'design_source_unaccounted',
  'input_refs_unavailable',
  'prd_readiness_declarations_evaded',
  'ready_receipt_absent',
  'ready_receipt_stale',
  'finalize_required',
]);

const MACHINE_READY_FIELDS = new Set([
  'status',
  'readiness_verified_by',
  'readiness_verified_at',
  'readiness_checker_schema',
  'readiness_finding_count',
  'readiness_blocking_count',
  'readiness_prd_hash',
  'readiness_inputs_hash',
]);

function parseArgs(argv) {
  const args = { target: null, inputs: [], error: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--inputs') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) {
        args.error = 'missing value for --inputs';
        break;
      }
      args.inputs.push(...value.split(',').map((entry) => entry.trim()).filter(Boolean));
      i += 1;
    } else if (arg.startsWith('--')) {
      args.error = `unknown option: ${arg}`;
      break;
    } else if (!args.target) {
      args.target = arg;
    } else {
      // 只接受单个位置参数:多余的目标路径会被静默丢弃,反而让错误调用
      // 对非预期输入返回一份"自信报告",与兄弟脚本 check-glossary-drift.js 的
      // error+exit-2 行为对齐,把坏调用变成确定性的 exit_code fact。
      args.error = `unexpected extra argument: ${arg}`;
      break;
    }
  }
  return args;
}

function splitLines(text) {
  return text.split(/\r?\n/);
}

function sha256(text) {
  return `sha256:${crypto.createHash('sha256').update(text).digest('hex')}`;
}

function parseFrontmatter(lines) {
  if (lines[0] !== '---') {
    return { present: false, fields: {}, startLine: null, endLine: null };
  }

  const endIndex = lines.findIndex((line, index) => index > 0 && line === '---');
  if (endIndex === -1) {
    return { present: false, fields: {}, startLine: 1, endLine: null };
  }

  const fields = {};
  for (let i = 1; i < endIndex; i += 1) {
    const match = lines[i].match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (match) {
      fields[match[1]] = match[2].replace(/^["']|["']$/g, '').trim();
    }
  }

  return {
    present: true,
    fields,
    startLine: 1,
    endLine: endIndex + 1,
  };
}

function normalizeForReceipt(text) {
  const lines = splitLines(text);
  const frontmatter = parseFrontmatter(lines);
  if (!frontmatter.present || !frontmatter.endLine) {
    return text.trim();
  }

  const keptFrontmatter = ['---'];
  for (let i = 1; i < frontmatter.endLine - 1; i += 1) {
    const match = lines[i].match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (match && MACHINE_READY_FIELDS.has(match[1])) {
      continue;
    }
    keptFrontmatter.push(lines[i]);
  }
  keptFrontmatter.push('---');

  return [
    ...keptFrontmatter,
    ...lines.slice(frontmatter.endLine),
  ].join('\n').trim();
}

function computeInputsHash(inputPaths) {
  if (!Array.isArray(inputPaths) || inputPaths.length === 0) {
    return sha256('');
  }

  const entries = inputPaths.map((inputPath) => {
    const resolved = path.resolve(inputPath);
    try {
      return `${inputPath}\n${sha256(fs.readFileSync(resolved, 'utf8'))}`;
    } catch (err) {
      return `${inputPath}\nmissing`;
    }
  });
  return sha256(entries.join('\n'));
}

function parseHeadings(lines) {
  const headings = [];
  lines.forEach((line, index) => {
    const match = line.match(/^(#{2,6})\s+(.+?)\s*$/);
    if (!match) return;
    headings.push({
      level: match[1].length,
      title: match[2].trim(),
      line: index + 1,
    });
  });
  return headings;
}

// 去掉标题前导的序号/标点装饰("一、""(1)""1." 与残留 # 空白),
// 用于在保留英文锚点的前提下识别本地化标题。
function stripHeadingDecoration(title) {
  return title
    .replace(/^[#\s]*/, '')
    .replace(/^[（(]?\s*(?:[0-9]+|[一二三四五六七八九十百零]+)\s*[)）.、．:：]\s*/u, '')
    .trim();
}

// 标题命中 canonical core section 的规则:精确相等,或去装饰后以英文锚点开头
// 且锚点后是非字母数字边界。这样 `## Summary(文档概要)`、`## 一、Summary 概要`
// 命中 Summary,而 `## Non-Functional Requirements` 不会被误判为 Requirements。
function matchHeadingTitle(headingTitle, wantedTitle) {
  if (headingTitle === wantedTitle) return true;
  const stripped = stripHeadingDecoration(headingTitle);
  if (stripped === wantedTitle) return true;
  const lowerStripped = stripped.toLowerCase();
  const lowerWanted = wantedTitle.toLowerCase();
  if (lowerStripped.startsWith(lowerWanted)) {
    const rest = stripped.slice(wantedTitle.length);
    if (rest === '' || /^[^A-Za-z0-9]/.test(rest)) return true;
  }
  return false;
}

function sectionRange(lines, headings, title) {
  const heading = headings.find((entry) => matchHeadingTitle(entry.title, title));
  if (!heading) return null;
  const startIndex = heading.line - 1;
  const next = headings.find((entry) => (
    entry.line > heading.line && entry.level <= heading.level
  ));
  const endIndex = next ? next.line - 2 : lines.length - 1;
  return {
    title,
    line: heading.line,
    text: lines.slice(startIndex + 1, endIndex + 1).join('\n'),
  };
}

function uniqueMatches(text, regex) {
  const values = new Set();
  for (const match of text.matchAll(regex)) {
    values.add(match[1]);
  }
  return [...values].sort();
}

function lineNumbersFor(lines, regex) {
  const matches = [];
  lines.forEach((line, index) => {
    if (regex.test(line)) {
      matches.push(index + 1);
    }
  });
  return matches;
}

function hasConcreteValueAfterColon(line) {
  const idx = line.indexOf(':');
  if (idx === -1) return false;
  const value = line.slice(idx + 1).trim();
  return Boolean(value) && !/^<.*>$/.test(value) && !/^n\/?a$/i.test(value);
}

function isTableSeparator(cells) {
  return cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
}

function tableRows(text) {
  const rows = [];
  splitLines(text).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return;
    const cells = trimmed.slice(1, -1).split('|').map((cell) => cell.trim());
    if (isTableSeparator(cells)) return;
    rows.push(cells);
  });
  return rows.slice(1);
}

function countSectionRows(lines, headings, title) {
  const section = sectionRange(lines, headings, title);
  return section ? tableRows(section.text).length : 0;
}

function sectionPresent(lines, headings, title) {
  return Boolean(sectionRange(lines, headings, title));
}

function stripFencedCode(text) {
  return text.replace(/```[\s\S]*?```/g, '');
}

function hasValidDeclaration(text, fieldPattern, values) {
  return Boolean(extractDeclarationValue(text, fieldPattern, values));
}

function extractDeclarationValue(text, fieldPattern, values) {
  const body = stripFencedCode(text);
  const valuePattern = values.map((value) => value.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|');
  const regex = new RegExp(`^\\s*(?:[-*]\\s*)?${fieldPattern}\\s*:\\s*(${valuePattern})\\s*$`, 'im');
  const match = body.match(regex);
  return match ? match[1].trim() : null;
}

function hasConcreteFieldBlock(text, fieldPattern) {
  const lines = splitLines(stripFencedCode(text));
  const fieldRegex = new RegExp(`^\\s*(?:[-*]\\s*)?${fieldPattern}\\s*:\\s*(.*)$`, 'i');
  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(fieldRegex);
    if (!match) continue;
    const inlineValue = match[1].trim();
    if (inlineValue && !/^<.*>$/.test(inlineValue) && !/^n\/?a$/i.test(inlineValue)) {
      return true;
    }
    for (let j = i + 1; j < lines.length; j += 1) {
      const line = lines[j];
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (/^#{1,6}\s+/.test(trimmed)) break;
      if (/^\s*[-*]\s+\S/.test(line)) {
        return !/^[-*]\s*<.*>$/.test(trimmed);
      }
      if (/^[A-Za-z_][A-Za-z0-9_-]*\s*:/.test(trimmed)) break;
      if (!/^<.*>$/.test(trimmed) && !/^n\/?a$/i.test(trimmed)) {
        return true;
      }
    }
  }
  return false;
}

function detectDesignSourceRefs(text) {
  const body = stripFencedCode(text);
  return /figma\.com|figma\s+(?:node|file)|figma\s+\d+-\d+|node-id=|design-source|design_source_inventory|design_sources_|Design\s*\/\s*UX Evidence Hook/i.test(body);
}

function scanInputDesignRefs(inputPaths) {
  const inputRefsUsed = [];
  let inputDesignRefsPresent = false;
  let inputScanDegraded = false;

  inputPaths.forEach((inputPath) => {
    const pathDesignSignal = /figma|design|设计稿/i.test(inputPath);
    try {
      const text = fs.readFileSync(path.resolve(inputPath), 'utf8');
      inputRefsUsed.push(inputPath);
      if (pathDesignSignal || detectDesignSourceRefs(text)) {
        inputDesignRefsPresent = true;
      }
    } catch (err) {
      inputScanDegraded = true;
      if (pathDesignSignal) {
        inputDesignRefsPresent = true;
      }
    }
  });

  return {
    input_refs_used: inputRefsUsed,
    input_design_refs_present: inputDesignRefsPresent,
    input_scan_degraded: inputScanDegraded,
  };
}

function detectDesignSourceInventory(text) {
  return /^\s*(?:[-*]\s*)?design_source_inventory\s*:/im.test(stripFencedCode(text));
}

function detectDesignSourceCoverage(text) {
  const body = stripFencedCode(text);
  return splitLines(body).some((line) => {
    if (!/^\s*(?:[-*]\s*)?design_source_coverage\s*:/i.test(line)) return false;
    if (!hasConcreteValueAfterColon(line)) return false;
    const value = line.slice(line.indexOf(':') + 1);
    return /\b(read|unread|status|degraded)\b/i.test(value);
  });
}

function detectDesignSourcesRead(text) {
  return hasConcreteFieldBlock(text, 'design_sources_read');
}

function detectDesignSourcesUnread(text) {
  return hasConcreteFieldBlock(text, 'design_sources_unread');
}

function countAssumptionRows(lines, headings) {
  const section = sectionRange(lines, headings, 'Evidence And Assumptions');
  if (!section) return 0;
  return tableRows(section.text).filter((cells) => (
    cells.some((cell) => cell.toLowerCase() === 'assumption')
  )).length;
}

function priorityDistribution(lines, headings) {
  const section = sectionRange(lines, headings, 'Requirements');
  const distribution = {};
  if (!section) return distribution;
  tableRows(section.text).forEach((cells) => {
    const requirementId = cells[0] || '';
    const priority = cells[1] || '';
    if (!/\bR-\d{2,}\b/.test(requirementId) || !priority) return;
    distribution[priority] = (distribution[priority] || 0) + 1;
  });
  return distribution;
}

function detectFeatureSliceGaps(lines, headings) {
  const section = sectionRange(lines, headings, 'Feature Slices');
  if (!section) return [];

  const sectionLines = splitLines(section.text);
  const starts = [];
  sectionLines.forEach((line, index) => {
    if (/^\s*feature_id\s*:/i.test(line)) {
      starts.push(index);
    }
  });

  return starts.flatMap((start, idx) => {
    const end = idx + 1 < starts.length ? starts[idx + 1] : sectionLines.length;
    const block = sectionLines.slice(start, end);
    const absoluteLine = section.line + start + 1;
    const acceptanceLine = block.find((line) => /^\s*acceptance_refs\s*:/i.test(line));
    const hasAcceptanceRefs = acceptanceLine && hasConcreteValueAfterColon(acceptanceLine);
    const hasTraceGap = block.some((line) => /trace gap|trace_gap|缺口|未覆盖/i.test(line));
    if (hasAcceptanceRefs || hasTraceGap) return [];
    return [{
      reason_code: 'feature_slice_missing_acceptance_trace',
      line: absoluteLine,
    }];
  });
}

function buildReport(target, text, options = {}) {
  const inputPaths = Array.isArray(options.inputs) ? options.inputs : [];
  const inputScan = scanInputDesignRefs(inputPaths);
  const prdHash = sha256(normalizeForReceipt(text));
  const inputsHash = computeInputsHash(inputPaths);
  const normalizedTarget = target.split(path.sep).join('/');
  const lines = splitLines(text);
  const frontmatter = parseFrontmatter(lines);
  const headings = parseHeadings(lines);
  const missingCoreSections = CORE_SECTIONS.filter((section) => (
    !headings.some((heading) => matchHeadingTitle(heading.title, section))
  ));
  const requirementIds = uniqueMatches(text, /\b(R-\d{2,})\b/g);
  const acceptanceIds = uniqueMatches(text, /\b(AE-\d{2,})\b/g);
  const nfrIds = uniqueMatches(text, /\b(NFR-\d{2,})\b/g);
  const acceptanceSection = sectionRange(lines, headings, 'Acceptance Examples');
  const acceptanceText = acceptanceSection ? acceptanceSection.text : '';
  const uncoveredRequirements = requirementIds.filter((id) => (
    !new RegExp(`\\b${id}\\b`).test(acceptanceText)
  ));
  const evidenceTagHits = EVIDENCE_TAGS.filter((tag) => text.includes(tag));
  const placeholderLines = lineNumbersFor(lines, /<[^>\n]+>|\bTODO\b|\bTBD\b|\bpending-tooling\b/i);
  const featureSliceGaps = detectFeatureSliceGaps(lines, headings);
  const priorities = priorityDistribution(lines, headings);
  const assumptionRowCount = countAssumptionRows(lines, headings);
  const outstandingQuestionsPresent = sectionPresent(lines, headings, 'Outstanding Questions');
  const planningRecheckPresent = sectionPresent(lines, headings, 'Planning Recheck');
  const outstandingQuestionCount = countSectionRows(lines, headings, 'Outstanding Questions');
  const planningRecheckCount = countSectionRows(lines, headings, 'Planning Recheck');
  const writeModeValue = extractDeclarationValue(text, 'write_mode', [
    'ask-owner-first',
    'checkpoint-prd',
    'final-prd',
    'route-out',
    'not-run',
  ]);
  const writeModeDeclaredValid = Boolean(writeModeValue);
  const clarificationEvidenceValue = extractDeclarationValue(text, 'clarification_evidence', [
    'asked-owner',
    'source-proven-no-ask',
    'headless-degraded-logged',
    'skipped',
  ]);
  const clarificationEvidenceDeclaredValid = Boolean(clarificationEvidenceValue);
  const clarificationEvidenceSubstantive = clarificationEvidenceDeclaredValid
    && clarificationEvidenceValue !== 'skipped';
  const canEnterSpecPlanValue = extractDeclarationValue(text, 'can_enter_spec[-_]?plan', [
    'yes',
    'no',
  ]);
  const canEnterSpecPlanDeclaredValid = Boolean(canEnterSpecPlanValue);
  const preflightSweepClosureValue = extractDeclarationValue(text, 'preflight_sweep_closure', [
    'closed',
    'degraded',
    'blocked',
    'missing',
  ]);
  const preflightSweepClosureDeclaredValid = Boolean(preflightSweepClosureValue);
  const designSourceRefsPresent = detectDesignSourceRefs(text);
  const designSourceInventoryDeclared = detectDesignSourceInventory(text);
  const designSourceCoverageDeclared = detectDesignSourceCoverage(text);
  const designSourcesReadPresent = detectDesignSourcesRead(text);
  const designSourcesUnreadPresent = detectDesignSourcesUnread(text);
  const needsReadinessDeclarations = frontmatter.fields.artifact_kind === 'prd-requirements'
    || /\bready-for-planning\b/i.test(text);
  const prdShaped = missingCoreSections.length === 0 && requirementIds.length > 0;
  const writeModeIsFinalPrd = writeModeValue === 'final-prd';
  const claimsReady = frontmatter.fields.status === 'ready-for-planning'
    || writeModeIsFinalPrd
    || canEnterSpecPlanValue === 'yes';
  const readyReceiptPresent = frontmatter.fields.readiness_verified_by === 'check-prd-artifact.js'
    && frontmatter.fields.readiness_checker_schema === 'spec-prd-artifact-check.v1'
    && Boolean(frontmatter.fields.readiness_prd_hash)
    && Boolean(frontmatter.fields.readiness_inputs_hash);
  const readyReceiptCurrent = readyReceiptPresent
    && frontmatter.fields.readiness_prd_hash === prdHash
    && frontmatter.fields.readiness_inputs_hash === inputsHash;

  const findings = [];
  if (!frontmatter.present) {
    findings.push({ reason_code: 'frontmatter_missing', line: 1 });
  }
  if (frontmatter.present && frontmatter.fields.artifact_kind !== 'prd-requirements') {
    findings.push({
      reason_code: 'artifact_kind_missing_or_wrong',
      expected: 'prd-requirements',
      actual: frontmatter.fields.artifact_kind || null,
      line: frontmatter.startLine,
    });
  }
  if (/^docs\/prds\//.test(normalizedTarget) || normalizedTarget.includes('/docs/prds/')) {
    findings.push({ reason_code: 'forbidden_prds_path', path: normalizedTarget });
  }
  missingCoreSections.forEach((section) => {
    findings.push({ reason_code: 'core_section_missing', section });
  });
  uncoveredRequirements.forEach((requirement_id) => {
    findings.push({ reason_code: 'requirement_without_acceptance_ref', requirement_id });
  });
  placeholderLines.forEach((line) => {
    findings.push({ reason_code: 'placeholder_or_todo_present', line });
  });
  featureSliceGaps.forEach((finding) => findings.push(finding));
  if (needsReadinessDeclarations && !writeModeDeclaredValid) {
    findings.push({ reason_code: 'write_mode_undeclared' });
  }
  if (needsReadinessDeclarations && !clarificationEvidenceDeclaredValid) {
    findings.push({ reason_code: 'clarification_evidence_undeclared' });
  }
  if (needsReadinessDeclarations && writeModeIsFinalPrd && !clarificationEvidenceSubstantive) {
    findings.push({ reason_code: 'clarification_trace_absent' });
  }
  if (needsReadinessDeclarations && !canEnterSpecPlanDeclaredValid) {
    findings.push({ reason_code: 'can_enter_spec_plan_undeclared' });
  }
  if (prdShaped && !needsReadinessDeclarations) {
    findings.push({ reason_code: 'prd_readiness_declarations_evaded' });
  }
  if ((prdShaped || writeModeIsFinalPrd || needsReadinessDeclarations) && !preflightSweepClosureDeclaredValid) {
    findings.push({ reason_code: 'preflight_sweep_closure_absent' });
  }
  if (designSourceRefsPresent && !designSourceInventoryDeclared) {
    findings.push({ reason_code: 'design_source_inventory_undeclared' });
  }
  if (designSourceRefsPresent && !designSourceCoverageDeclared) {
    findings.push({ reason_code: 'design_source_coverage_undeclared' });
  }
  if (designSourceRefsPresent && !designSourcesReadPresent) {
    findings.push({ reason_code: 'design_sources_read_undeclared' });
  }
  if (designSourceRefsPresent && !designSourcesUnreadPresent) {
    findings.push({ reason_code: 'design_sources_unread_undeclared' });
  }
  if (inputScan.input_design_refs_present && !designSourceInventoryDeclared) {
    findings.push({ reason_code: 'design_source_unaccounted' });
  }
  if (inputPaths.length > 0 && inputScan.input_refs_used.length === 0) {
    findings.push({ reason_code: 'input_refs_unavailable' });
  }
  if (inputScan.input_scan_degraded) {
    findings.push({ reason_code: 'input_scan_degraded' });
  }
  if (claimsReady && !readyReceiptPresent) {
    findings.push({ reason_code: 'ready_receipt_absent' });
  } else if (claimsReady && !readyReceiptCurrent) {
    findings.push({ reason_code: 'ready_receipt_stale' });
  }

  const blockingReasons = [...new Set(
    findings
      .map((finding) => finding.reason_code)
      .filter((reasonCode) => BLOCKING_REASON_CODES.has(reasonCode)),
  )].sort();

  return {
    schema_version: 'spec-prd-artifact-check.v1',
    target,
    status: 'checked',
    facts: {
      frontmatter_present: frontmatter.present,
      artifact_kind: frontmatter.fields.artifact_kind || null,
      core_sections_present: CORE_SECTIONS.filter((section) => !missingCoreSections.includes(section)),
      core_sections_missing: missingCoreSections,
      requirement_ids: requirementIds,
      acceptance_ids: acceptanceIds,
      nfr_ids: nfrIds,
      uncovered_requirements: uncoveredRequirements,
      evidence_tags_present: evidenceTagHits,
      priority_distribution: priorities,
      nfr_count: nfrIds.length,
      assumption_row_count: assumptionRowCount,
      outstanding_question_count: outstandingQuestionCount,
      outstanding_questions_present: outstandingQuestionsPresent,
      outstanding_questions_count: outstandingQuestionCount,
      planning_recheck_present: planningRecheckPresent,
      planning_recheck_count: planningRecheckCount,
      write_mode_declared_valid: writeModeDeclaredValid,
      write_mode: writeModeValue,
      clarification_evidence_declared_valid: clarificationEvidenceDeclaredValid,
      clarification_evidence: clarificationEvidenceValue,
      clarification_trace_present: clarificationEvidenceSubstantive,
      can_enter_spec_plan_declared_valid: canEnterSpecPlanDeclaredValid,
      can_enter_spec_plan: canEnterSpecPlanValue,
      preflight_sweep_closure: preflightSweepClosureValue,
      preflight_sweep_closure_declared_valid: preflightSweepClosureDeclaredValid,
      ready_claim_present: claimsReady,
      ready_receipt_present: readyReceiptPresent,
      ready_receipt_current: readyReceiptCurrent,
      ready_receipt_prd_hash: prdHash,
      ready_receipt_inputs_hash: inputsHash,
      blocking_reason_codes: blockingReasons,
      blocking_finding_count: blockingReasons.length,
      design_source_refs_present: designSourceRefsPresent,
      design_source_inventory_declared: designSourceInventoryDeclared,
      design_source_coverage_declared: designSourceCoverageDeclared,
      design_sources_read_present: designSourcesReadPresent,
      design_sources_unread_present: designSourcesUnreadPresent,
      placeholder_line_count: placeholderLines.length,
      feature_slice_trace_gap_count: featureSliceGaps.length,
      input_scan_attempted: inputPaths.length > 0,
      input_refs_used: inputScan.input_refs_used,
      input_design_refs_present: inputScan.input_design_refs_present,
      input_scan_degraded: inputScan.input_scan_degraded,
    },
    findings,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.error || !args.target) {
    if (args.error) {
      process.stderr.write(`${args.error}\n`);
    }
    process.stderr.write('usage: check-prd-artifact.js <target-prd-path> [--inputs <input-path>[,<input-path>...]]...\n');
    process.exit(2);
  }

  let targetText;
  try {
    targetText = fs.readFileSync(path.resolve(args.target), 'utf8');
  } catch (err) {
    process.stderr.write(`cannot read target: ${args.target}\n`);
    process.exit(2);
  }

  process.stdout.write(JSON.stringify(buildReport(args.target, targetText, { inputs: args.inputs }), null, 2) + '\n');
}

if (require.main === module) {
  main();
}

module.exports = {
  BLOCKING_REASON_CODES,
  buildReport,
  computeInputsHash,
  normalizeForReceipt,
  sha256,
};
