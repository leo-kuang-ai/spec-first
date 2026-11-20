#!/usr/bin/env node
'use strict';

// Deterministic PRD artifact check: reports only Markdown structure, frontmatter, trace, placeholders, etc.
// script-owned facts。Whether it constitutes a readiness blocker is semantically decided by the PRD readiness lens.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// reason-code classification method (BLOCKING blocking code + closure/receipt/checkpoint subset classifier) with a single source of truth.
// This script, in conjunction with finalize-prd-artifact.js, consumes ./lib/reason-codes to eliminate classification code double-assignment drift.
const {
  BLOCKING_REASON_CODES,
  isClosureBlocker,
} = require('./lib/reason-codes');

const MAX_INPUT_SCAN_BYTES = 5 * 1024 * 1024;
// inputs number soft upper limit: exceed without blocking (avoiding false kill of legitimate multi-source), only emit advisory finding input_scan_input_count_capped
// Prompt the agent to reduce input volume or increase timeout budget (in coordination with prd-readiness-guard 5000ms timeout branch).
const MAX_INPUT_COUNT = 32;

const CORE_SECTIONS = [
  'Summary',
  'Change Delta',
  'Requirements',
  'Acceptance Examples',
  'Scope Boundaries',
  'Evidence And Assumptions',
];

const SECTION_ID_BY_TITLE = {
  Summary: 'summary',
  'Change Delta': 'change_delta',
  Requirements: 'requirements',
  'Acceptance Examples': 'acceptance_examples',
  'Scope Boundaries': 'scope_boundaries',
  'Evidence And Assumptions': 'evidence_assumptions',
  'Outstanding Questions': 'outstanding_questions',
  'Owner Decision Trace': 'owner_decision_trace',
  'Readiness Self-Check': 'readiness_self_check',
  'Design Source Coverage': 'design_source_coverage',
  'Planning Recheck': 'planning_recheck',
  'Feature Slices': 'feature_slices',
};

const TITLE_BY_SECTION_ID = Object.fromEntries(
  Object.entries(SECTION_ID_BY_TITLE).map(([title, sectionId]) => [sectionId, title]),
);
const KNOWN_SECTION_IDS = new Set(Object.values(SECTION_ID_BY_TITLE));
const MACHINE_SECTION_IDS = new Set([
  'outstanding_questions',
  'owner_decision_trace',
  'readiness_self_check',
  'design_source_coverage',
]);

const EVIDENCE_TAGS = [
  'confirmed-source',
  'user-stated',
  'source-candidate',
  'external-research',
  'assumption',
];

// 004: Header-aware parsing of the Outstanding Questions table. Only recognizes the following frozen minimum alias table;
// An expanded alias must first be prefixed with fixture. canonical key -> allowed header text (case-insensitive match).
const OQ_HEADER_ALIASES = {
  id: ['id', '编号'],
  question: ['question', '问题'],
  prd_write_target: ['prd_write_target', 'prd write target', 'write target', 'prd写入目标', '需求写入目标', '写入目标'],
  owner_status: ['owner_status', 'owner status', 'owner状态', '澄清状态'],
  blocks_planning: ['blocks_planning', 'blocks planning?', 'blocks planning', '是否阻塞规划', '阻塞规划'],
  closure_disposition: ['closure_disposition', 'disposition', 'closure disposition', '闭合方式', '闭合依据'],
  planning_would_invent_what: ['planning_would_invent_what', 'planning would invent what?', 'planning would invent what', '是否会发明what', '会否发明what'],
  closure_state: ['closure_state', 'closure state', '闭合状态'],
  recommended_default: ['recommended_default', 'recommended_default/deferred_reason', 'recommended default', 'deferred_reason', 'deferred reason', '推荐默认', '延后原因', '默认/延后原因'],
};

const TRACE_HEADER_ALIASES = {
  question: ['question', 'decision', '问题', '决策'],
  owner_answer: ['owner_answer', 'owner answer', 'owner_answer/source', 'owner回答', '回答/来源'],
  chosen_answer: ['chosen_answer', 'chosen answer', '采纳答案', '最终答案'],
  prd_write_target: ['prd_write_target', 'prd write target', 'write target', 'prd写入目标', '需求写入目标', '写入目标'],
  consequence: ['consequence', 'readiness consequence', '影响', '后果'],
  closure_state: ['closure_state', 'closure state', '闭合状态'],
};

// Legal closure disposition (The only exit for Razor's closure). The source class requires a reference-like evidence, and the owner class requires trace row.
const LEGAL_DISPOSITIONS = new Set([
  'source-resolved',
  'owner-answered',
  'owner-capped',
  'owner-accepted-assumption',
  'source-backed-non-what-assumption',
  'implementation-only-how-pushdown',
]);
const SOURCE_DISPOSITIONS = new Set(['source-resolved', 'source-backed-non-what-assumption']);
const OWNER_DISPOSITIONS = new Set(['owner-answered', 'owner-capped', 'owner-accepted-assumption']);

// Vocabulary hits are advisory navigation, never proof of a WHAT/HOW contradiction.
const WHAT_TOUCHING_KEYWORDS = [
  'interface', '接口', 'availability', '可用性', 'permission', '权限',
  'scope', '范围', 'source-of-truth', '数据权威', 'fallback', '降级',
  'analytics', '埋点', '指标',
];

// source class disposition evidence cell must resemble verifiable references: URL / file path with extension / file:line /
// Multiple path segments / anchor point IDs. Split by whitespace to tokenize and judge one by one, avoiding cases like `and/or` or `input/output` in prose.
// `n/a` entries with slashes are incorrectly classified as ref (something the previous round's source-ref-shape fix attempted to block as a cheap forgery).
function looksLikeCheckableRef(text) {
  if (!text) return false;
  const tokens = String(text).trim().split(/\s+/).filter(Boolean);
  return tokens.some((tok) => {
    if (/^https?:\/\/\S+/i.test(tok)) return true; // URL
    if (/[\w-]+\.[a-z0-9]+(?::\d+)?$/i.test(tok)) return true; // file.ext or file.ext:line
    if (/^#[\w-]+$/.test(tok)) return true; // Anchor ID
    // Multiple paths (>=2 slashes, e.g. src/cli/foo); single slashes for poetic terms (and/or) do not count
    if ((tok.match(/\//g) || []).length >= 2) return true;
    return false;
  });
}

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
  const args = {
    target: null,
    inputs: [],
    inputsFromFrontmatter: false,
    stdin: false,
    help: false,
    error: null,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      args.help = true;
      return args;
    } else if (arg === '--stdin') {
      args.stdin = true;
    } else if (arg === '--inputs') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) {
        args.error = 'missing value for --inputs';
        break;
      }
      args.inputs.push(...value.split(',').map((entry) => entry.trim()).filter(Boolean));
      i += 1;
    } else if (arg === '--inputs-from-frontmatter') {
      args.inputsFromFrontmatter = true;
    } else if (arg.startsWith('--')) {
      args.error = `unknown option: ${arg}`;
      break;
    } else if (!args.target) {
      args.target = arg;
    } else {
      // Accepts only a single positional parameter: additional target paths will be silently discarded, and erroneous calls will be rejected.
      // Return a "confident report" for unexpected inputs, similar to the sibling script check-glossary-drift.js
      // error+exit-2 behavior aligned, treat bad calls as deterministic exit_code facts.
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

function extractSourceInputsFromFrontmatterText(text) {
  const lines = splitLines(text);
  if (lines[0] !== '---') {
    return { present: false, field: null, inputs: [] };
  }

  const fmEnd = lines.findIndex((line, index) => index > 0 && line === '---');
  if (fmEnd === -1) {
    return { present: false, field: null, inputs: [] };
  }

  const fmLines = lines.slice(1, fmEnd);
  const start = fmLines.findIndex((line) => /^(source_inputs|prd_input):\s*$/.test(line));
  if (start === -1) {
    return { present: false, field: null, inputs: [] };
  }

  const fieldMatch = fmLines[start].match(/^(source_inputs|prd_input):\s*$/);
  const inputs = [];
  for (let i = start + 1; i < fmLines.length; i += 1) {
    const line = fmLines[i];
    if (/^[A-Za-z0-9_-]+:\s*/.test(line)) {
      break;
    }
    const match = line.match(/^\s*-\s+(.+?)\s*$/)
      || line.match(/^\s*path:\s+(.+?)\s*$/);
    if (!match) continue;
    const value = match[1]
      .replace(/^path:\s*/, '')
      .replace(/^["']|["']$/g, '')
      .trim();
    if (value) {
      inputs.push(value);
    }
  }

  return { present: true, field: fieldMatch[1], inputs };
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

function findProjectRootFromTarget(target) {
  const resolvedTarget = path.resolve(target);
  const parts = resolvedTarget.split(path.sep);
  for (let idx = parts.length - 2; idx >= 0; idx -= 1) {
    if (parts[idx] === 'docs' && ['brainstorms', 'prds'].includes(parts[idx + 1])) {
      const rootParts = parts.slice(0, idx);
      return rootParts.length === 0 ? path.sep : rootParts.join(path.sep) || path.sep;
    }
  }
  return path.dirname(resolvedTarget);
}

function realpathOrResolved(filePath) {
  try {
    return fs.realpathSync.native(filePath);
  } catch (err) {
    return path.resolve(filePath);
  }
}

function isWithinRoot(candidatePath, rootPath) {
  const relative = path.relative(rootPath, candidatePath);
  return relative === '' || (relative && !relative.startsWith('..') && !path.isAbsolute(relative));
}

function resolveInputFile(inputPath, projectRoot) {
  const root = realpathOrResolved(projectRoot);
  const candidates = path.isAbsolute(inputPath)
    ? [path.resolve(inputPath)]
    : [path.resolve(projectRoot, inputPath), path.resolve(inputPath)];
  const resolved = candidates.find((candidate) => fs.existsSync(candidate)) || candidates[0];
  const pathDesignSignal = /figma|design|设计稿/i.test(inputPath);

  let real;
  let stats;
  try {
    real = fs.realpathSync.native(resolved);
    stats = fs.statSync(real);
  } catch (err) {
    return {
      status: 'missing',
      resolved,
      pathDesignSignal,
      reason: 'missing_or_unreadable',
    };
  }

  if (!isWithinRoot(real, root)) {
    return {
      status: 'rejected',
      resolved,
      real,
      pathDesignSignal,
      reason: 'outside_project_root',
    };
  }

  if (!stats.isFile()) {
    return {
      status: 'rejected',
      resolved,
      real,
      pathDesignSignal,
      reason: 'not_regular_file',
    };
  }

  if (stats.size > MAX_INPUT_SCAN_BYTES) {
    return {
      status: 'rejected',
      resolved,
      real,
      pathDesignSignal,
      reason: 'input_too_large',
    };
  }

  return {
    status: 'ok',
    resolved,
    real,
    pathDesignSignal,
  };
}

function computeInputsHash(inputPaths, options = {}) {
  if (!Array.isArray(inputPaths) || inputPaths.length === 0) {
    return sha256('');
  }
  const projectRoot = options.projectRoot ? path.resolve(options.projectRoot) : process.cwd();

  const entries = inputPaths.map((inputPath) => {
    const input = resolveInputFile(inputPath, projectRoot);
    // 004: Compute hash using only readable and input files located within the project root; failed inputs are expressed through degraded findings.
    if (input.status !== 'ok') {
      return null;
    }
    return `${input.resolved}\n${sha256(fs.readFileSync(input.real, 'utf8'))}`;
  }).filter(Boolean);
  return sha256(entries.join('\n'));
}

function parseHeadings(lines) {
  const headings = [];
  const orphanSectionIds = [];
  let pendingSection = null;
  lines.forEach((line, index) => {
    const sectionMatch = line.match(/^\s*<!--\s*prd:section=([a-z0-9_-]+)\s*-->\s*$/i);
    if (sectionMatch) {
      if (pendingSection) {
        orphanSectionIds.push(pendingSection);
      }
      pendingSection = {
        sectionId: sectionMatch[1].toLowerCase(),
        line: index + 1,
      };
      return;
    }

    const match = line.match(/^(#{2,6})\s+(.+?)\s*$/);
    if (!match) {
      if (pendingSection && line.trim() !== '') {
        orphanSectionIds.push(pendingSection);
        pendingSection = null;
      }
      return;
    }
    headings.push({
      level: match[1].length,
      title: match[2].trim(),
      line: index + 1,
      sectionId: pendingSection ? pendingSection.sectionId : null,
      sectionIdLine: pendingSection ? pendingSection.line : null,
    });
    pendingSection = null;
  });
  if (pendingSection) {
    orphanSectionIds.push(pendingSection);
  }
  headings.orphanSectionIds = orphanSectionIds;
  return headings;
}

function isSectionIdComment(line) {
  return /^\s*<!--\s*prd:section=[a-z0-9_-]+\s*-->\s*$/i.test(line);
}

// Remove leading sequence/punctuation decoration before titles ("一、""(1)""1." and residual # blanks)
// Used to identify localized titles while retaining English anchor points.
function stripHeadingDecoration(title) {
  return title
    .replace(/^[#\s]*/, '')
    .replace(/^[（(]?\s*(?:[0-9]+|[一二三四五六七八九十百零]+)\s*[)）.、．:：]\s*/u, '')
    .trim();
}

// Title matches canonical core section rules: exact equality, or after dedecoration starts with an English anchor point
// And after the anchor is a non-alphanumeric boundary. Thus `## Summary (Document Overview)`, `## 1. Summary Overview`
// Hit Summary, while `## Non-Functional Requirements` will not be misjudged as Requirements.
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

function canonicalTitleForHeading(headingTitle) {
  return Object.keys(SECTION_ID_BY_TITLE).find((title) => matchHeadingTitle(headingTitle, title)) || null;
}

function sectionIdentityMismatchForHeading(heading) {
  if (!heading.sectionId || !KNOWN_SECTION_IDS.has(heading.sectionId)) return null;
  const actualTitle = canonicalTitleForHeading(heading.title);
  if (!actualTitle) return null;
  const actualSectionId = SECTION_ID_BY_TITLE[actualTitle];
  if (actualSectionId === heading.sectionId) return null;
  return {
    section_id: heading.sectionId,
    expected_title: TITLE_BY_SECTION_ID[heading.sectionId] || null,
    actual_section_id: actualSectionId,
    actual_title: actualTitle,
    title: heading.title,
    line: heading.line,
    section_id_line: heading.sectionIdLine,
  };
}

function matchSectionIdentity(heading, wantedTitle) {
  if (matchHeadingTitle(heading.title, wantedTitle)) return true;
  const wantedSectionId = SECTION_ID_BY_TITLE[wantedTitle];
  if (!wantedSectionId || heading.sectionId !== wantedSectionId) return false;
  return !sectionIdentityMismatchForHeading(heading);
}

function sectionRange(lines, headings, title) {
  const heading = headings.find((entry) => matchSectionIdentity(entry, title));
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

// 004: Parse each row of a Markdown table into {key: value} format based on the header aliases. Returns { headerMap, rows }.
// headerMap: canonical key -> column index; rows: each row is canonical key -> cell text.
// Unknown headers are ignored; headerMap is empty when no canonical columns are identified.
function parseHeaderedTable(text, aliasTable) {
  const rawLines = splitLines(text).filter((line) => {
    const t = line.trim();
    return t.startsWith('|') && t.endsWith('|');
  });
  if (rawLines.length === 0) return { headerMap: {}, rows: [] };

  const toCells = (line) => line.trim().slice(1, -1).split('|').map((c) => c.trim());
  const headerCells = toCells(rawLines[0]);
  const headerMap = {};
  headerCells.forEach((cell, index) => {
    const norm = cell.toLowerCase().trim();
    for (const [key, aliases] of Object.entries(aliasTable)) {
      if (aliases.includes(norm)) {
        if (!(key in headerMap)) headerMap[key] = index;
        break;
      }
    }
  });

  const rows = [];
  for (let i = 1; i < rawLines.length; i += 1) {
    const cells = toCells(rawLines[i]);
    if (isTableSeparator(cells)) continue;
    const row = {};
    for (const [key, idx] of Object.entries(headerMap)) {
      row[key] = (cells[idx] || '').trim();
    }
    rows.push(row);
  }
  return { headerMap, rows };
}

function normalizeBool(value) {
  const v = String(value || '').toLowerCase().trim();
  if (['yes', 'true', 'y', '是'].includes(v)) return true;
  if (['no', 'false', 'n', '否'].includes(v)) return false;
  return null;
}

// Null normalization: none/none/empty/n-a/[]/placeholder are all considered as empty.
function isEmptyish(value) {
  const v = String(value || '').toLowerCase().trim();
  if (!v) return true;
  return ['none', 'no', '无', '空', 'n/a', 'na', 'not-needed', 'not applicable', '[]', '-'].includes(v)
    || /^<.*>$/.test(v);
}

function validRequirementIds(sectionText) {
  const ids = new Set();
  tableRows(sectionText).forEach((cells) => {
    const id = String(cells[0] || '').trim().toUpperCase();
    if (!/^R-\d{2,}$/.test(id)) return;
    const hasSubstantiveCell = cells.slice(1).some((cell) => (
      !isEmptyish(cell) && !/^P[0-3]$/i.test(cell)
    ));
    if (hasSubstantiveCell) ids.add(id);
  });
  return [...ids].sort();
}

function validAcceptanceExamples(sectionText) {
  const ids = new Set();
  const requirementIds = new Set();
  tableRows(sectionText).forEach((cells) => {
    const id = String(cells[0] || '').trim().toUpperCase();
    const rowText = cells.slice(1).join(' ');
    if (/^AE-\d{2,}$/.test(id) && /\bR-\d{2,}\b/i.test(rowText)) {
      const substantive = rowText
        .replace(/\b(?:AE|R)-\d{2,}\b/gi, '')
        .replace(/\bP[0-3]\b/gi, '')
        .trim();
      if (!isEmptyish(substantive)) {
        ids.add(id);
        uniqueMatches(rowText, /\b(R-\d{2,})\b/gi).forEach((requirementId) => {
          requirementIds.add(requirementId.toUpperCase());
        });
      }
    }
  });

  const lines = splitLines(sectionText);
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/\b(AE-\d{2,})\b/i);
    if (!match) continue;
    let end = lines.length;
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      if (/\bAE-\d{2,}\b/i.test(lines[cursor])) {
        end = cursor;
        break;
      }
    }
    const blockLines = lines.slice(index, end);
    const block = blockLines.join('\n');
    const givenIndex = blockLines.findIndex((line) => /^\s*Given\b/i.test(line));
    const traceDeclaration = givenIndex === -1
      ? ''
      : blockLines.slice(0, givenIndex).join('\n');
    if (/\bR-\d{2,}\b/i.test(traceDeclaration)
      && /(?:^|\n)\s*Given\b/i.test(block)
      && /(?:^|\n)\s*When\b/i.test(block)
      && /(?:^|\n)\s*Then\b/i.test(block)) {
      ids.add(match[1].toUpperCase());
      uniqueMatches(traceDeclaration, /\b(R-\d{2,})\b/gi).forEach((requirementId) => {
        requirementIds.add(requirementId.toUpperCase());
      });
    }
  }
  return {
    ids: [...ids].sort(),
    requirementIds: [...requirementIds].sort(),
  };
}

// Whether an Owner Decision Trace row is valid: chosen_answer + write target + consequence are all non-empty.
function isValidTraceRow(row) {
  return !isEmptyish(row.chosen_answer) && !isEmptyish(row.prd_write_target) && !isEmptyish(row.consequence);
}

// F-L1 Row Binding: Can one owner-* OQ be bound to one verifiable trace row?
// Only two signals (both artifact internal consistency, not session events):
// (a) question-match: normalize followed by exact equality (trim + collapse + lowercase; not substring);
// (b) id-reference: oq.id is not null and appears as a bounded token in any identifiable cell of the trace (to prevent misassignment of OQ-2 to OQ-20).
// Strictly disallowing write-target-token-overlap: Requirements/Acceptance Examples etc. will cause infinite OQ coverage on a single line.
// Soft resurrection of the global switch. The semantic is strictly limited to "Does this OQ point to a real trace record?" and does not verify the owner's actual decision.
function traceRowBindsOq(traceRow, oqRow) {
  const normalize = (s) => String(s || '').trim().replace(/\s+/g, ' ').toLowerCase();
  const oqQuestion = normalize(oqRow.question);
  if (oqQuestion && normalize(traceRow.question) === oqQuestion) {
    return true;
  }
  const oqId = String(oqRow.id || '').trim();
  const idMatch = oqId.match(/OQ-?0*(\d+)/i);
  if (idMatch) {
    const n = idMatch[1];
    const tokenRegex = new RegExp(`(^|[^\\w-])OQ-?0*${n}(?![0-9])`, 'i');
    const cells = `${traceRow.question || ''} ${traceRow.chosen_answer || ''} ${traceRow.prd_write_target || ''} ${traceRow.consequence || ''}`;
    if (tokenRegex.test(cells)) {
      return true;
    }
  }
  return false;
}

// Parse Owner Decision Trace: return the number of non-empty rows containing chosen_answer + write target.
function parseOwnerDecisionTrace(lines, headings) {
  const section = sectionRange(lines, headings, 'Owner Decision Trace');
  if (!section) return { present: false, validRows: 0, rows: [] };
  const { headerMap, rows } = parseHeaderedTable(section.text, TRACE_HEADER_ALIASES);
  if (Object.keys(headerMap).length === 0) return { present: true, validRows: 0, rows: [] };
  const validRows = rows.filter(isValidTraceRow);
  return { present: true, validRows: validRows.length, rows };
}

function ownerDecisionTraceNeededByOutstandingQuestions(lines, headings) {
  const section = sectionRange(lines, headings, 'Outstanding Questions');
  if (!section) return false;
  const { rows } = parseHeaderedTable(section.text, OQ_HEADER_ALIASES);
  return rows.some((row) => (
    OWNER_DISPOSITIONS.has(String(row.closure_disposition || '').toLowerCase().trim())
    || ['answered', 'capped'].includes(String(row.owner_status || '').toLowerCase().trim())
  ));
}

// 004: Razor analysis of Outstanding QuestionsclaimsReady determines whether a contradiction type is escalated to a blocker.
// Return facts + triggered reason_codes (blocker and advisory mixed together, filtered by caller's BLOCKING set).
function analyzeOutstandingQuestions(lines, headings, options) {
  const claimsReady = Boolean(options.claimsReady);
  const ownerTrace = parseOwnerDecisionTrace(lines, headings);
  const facts = {
    outstanding_question_closure_contract_present: false,
    outstanding_question_rows: 0,
    outstanding_question_missing_closure_count: 0,
    blocking_outstanding_question_count: 0,
    planning_invention_question_count: 0,
    unclosed_owner_question_count: 0,
    open_oq_without_owner_closure_count: 0,
    how_pushdown_touches_what_count: 0,
    possible_misclassified_how_pushdown_count: 0,
    owner_decision_trace_present: ownerTrace.present && ownerTrace.validRows > 0,
  };
  const reasonCodes = new Set();

  const section = sectionRange(lines, headings, 'Outstanding Questions');
  if (!section) {
    return { facts, reasonCodes: [...reasonCodes] };
  }
  const { headerMap, rows } = parseHeaderedTable(section.text, OQ_HEADER_ALIASES);
  facts.outstanding_question_rows = rows.length;

  // Is the closure contract complete: must be able to identify blocks_planning / closure_disposition / closure_state
  const hasClosureContract = ['blocks_planning', 'closure_disposition', 'closure_state']
    .every((k) => k in headerMap);
  facts.outstanding_question_closure_contract_present = hasClosureContract;
  if (rows.length > 0 && !hasClosureContract && claimsReady) {
    reasonCodes.add('outstanding_question_closure_undeclared');
  }

  // 004 Repair (bullet-OQ detour): List unresolved items in the OQ section in non-table format (bullet / numbering / bare OQ number)
  // When parseHeaderedTable returns 0 rows, it bypasses the following line-by-line razor, causing the load-bearing OQ to skip entirely.
  // Marking "non-blocking" allows the piece to be mixed into ready. This is inherently "claims-ready yet carries an undeclared closure"
  // 'Open Issues' —— Deterministic contradictions similar to the Occam's Razor principle (section contains issue content + claims readiness + no closure)
  // Table), non-ceremony-presence check. Reuse outstanding_question_closure_undeclared, do not add a new one
  // BLOCKING code。Upgrade blocker only when claims-ready; draft/checkpoint does not trigger.
  if (rows.length === 0 && claimsReady) {
    const nonTableOpenQuestions = splitLines(section.text).some((line) => {
      const t = line.trim();
      if (!t) return false;
      const isListItemOrOqId = /^([-*+]|\d+\.)\s+/.test(t) || /\bOQ[-\s]?\d/i.test(t);
      if (!isListItemOrOqId) return false;
      const body = t.replace(/^([-*+]|\d+\.)\s+/, '');
      return !isEmptyish(body);
    });
    if (nonTableOpenQuestions) {
      reasonCodes.add('outstanding_question_closure_undeclared');
    }
  }

  rows.forEach((row) => {
    const blocks = normalizeBool(row.blocks_planning);
    const invents = normalizeBool(row.planning_would_invent_what);
    const closure = String(row.closure_state || '').toLowerCase().trim();
    const disposition = String(row.closure_disposition || '').toLowerCase().trim();
    const isNonBlocking = blocks === false || closure === 'closed';
    const text = `${row.question || ''} ${row.prd_write_target || ''}`.toLowerCase();
    const hitsWhat = WHAT_TOUCHING_KEYWORDS.some((kw) => text.includes(kw));

    // Missing required statement
    if (hasClosureContract && (blocks === null || isEmptyish(row.closure_disposition))) {
      facts.outstanding_question_missing_closure_count += 1;
    }
    // Explicit blocking / Will invent WHAT / Unclosed
    if (blocks === true) {
      facts.blocking_outstanding_question_count += 1;
      if (claimsReady) reasonCodes.add('blocking_outstanding_question_present');
    }
    if (invents === true) {
      facts.planning_invention_question_count += 1;
      if (claimsReady) reasonCodes.add('planning_invention_question_present');
    }
    if (['unclosed', 'blocker', 'unknown', 'headless-degraded'].includes(closure)) {
      facts.unclosed_owner_question_count += 1;
      if (claimsReady) reasonCodes.add('unclosed_owner_question_present');
    }

    // Scissors: Non-blocking open OQ must carry valid disposition + evidence
    if (isNonBlocking) {
      let dispositionOk = LEGAL_DISPOSITIONS.has(disposition);
      if (dispositionOk && SOURCE_DISPOSITIONS.has(disposition)) {
        // The source class needs to resemble a reference evidence (write target / recommended_default, either resembling ref, or trace match).
        const refCandidate = `${row.prd_write_target || ''} ${row.recommended_default || ''}`;
        dispositionOk = looksLikeCheckableRef(refCandidate);
      }
      if (dispositionOk && OWNER_DISPOSITIONS.has(disposition)) {
        // F-L1: The owner class requires a valid trace row that can be verified and bound to the OQ, not any arbitrary globally valid row.
        dispositionOk = ownerTrace.rows.some((tr) => isValidTraceRow(tr) && traceRowBindsOq(tr, row));
      }
      if (!dispositionOk) {
        facts.open_oq_without_owner_closure_count += 1;
        if (claimsReady) reasonCodes.add('open_oq_without_owner_closure');
      }
      if (disposition === 'implementation-only-how-pushdown') {
        if (hitsWhat) facts.possible_misclassified_how_pushdown_count += 1;
        // Only explicit contradictory declarations support a deterministic blocker.
        if (claimsReady && invents === true) {
          facts.how_pushdown_touches_what_count += 1;
          reasonCodes.add('how_pushdown_touches_what');
        }
      }
    }
  });

  // asked-owner / answered|capped depends on owner answer when trace must be present
  const needTrace = options.clarificationAskedOwner
    || rows.some((r) => ['answered', 'capped'].includes(String(r.owner_status || '').toLowerCase().trim()));
  if (needTrace && !(ownerTrace.present && ownerTrace.validRows > 0)) {
    if (claimsReady) reasonCodes.add('owner_decision_trace_required_but_absent');
  }

  return { facts, reasonCodes: [...reasonCodes] };
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
  return extractDeclarationValues(text, fieldPattern, values)[0] || null;
}

function extractDeclarationValues(text, fieldPattern, values) {
  const body = stripFencedCode(text);
  const valuePattern = values.map((value) => value.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|');
  const regex = new RegExp(`^\\s*(?:[-*]\\s*)?${fieldPattern}\\s*:\\s*(${valuePattern})\\s*$`, 'gim');
  return [...body.matchAll(regex)].map((match) => match[1].trim());
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

function scanInputDesignRefs(inputPaths, projectRoot) {
  const inputRefsUsed = [];
  let inputDesignRefsPresent = false;
  let inputScanDegraded = false;

  inputPaths.forEach((inputPath) => {
    const input = resolveInputFile(inputPath, projectRoot);
    if (input.status === 'ok') {
      const text = fs.readFileSync(input.real, 'utf8');
      inputRefsUsed.push(inputPath);
      if (input.pathDesignSignal || detectDesignSourceRefs(text)) {
        inputDesignRefsPresent = true;
      }
      return;
    }
    inputScanDegraded = true;
    if (input.pathDesignSignal) {
      inputDesignRefsPresent = true;
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
  // more strict than hasConcreteFieldBlock: accepts only none/n/a annotations or YAML list declarations
  // Rejects prose strings (e.g., "Figma canvas not directly read") — prose misclassified as "declared" will mask read_undeclared.
  const lines = splitLines(stripFencedCode(text));
  const fieldRegex = /^\s*(?:[-*]\s*)?design_sources_read\s*:\s*(.*)$/i;
  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(fieldRegex);
    if (!match) continue;
    const inline = match[1].trim();
    if (/^none$|^n\/a$/i.test(inline)) return true; // An explicit none/n/a is valid.
    if (inline) continue; // Inline prose is not a declaration; keep scanning.
    // No inline value → Check the next non-empty row to see if it is a list item
    for (let j = i + 1; j < lines.length; j += 1) {
      const trimmed = lines[j].trim();
      if (!trimmed) continue;
      if (/^#{1,6}\s+/.test(trimmed)) break;
      if (/^\s*-\s+\S/.test(lines[j])) return true;
      if (/^[A-Za-z_][A-Za-z0-9_-]*\s*:/.test(trimmed)) break;
      break;
    }
  }
  return false;
}

function detectDesignSourcesUnread(text) {
  return hasConcreteFieldBlock(text, 'design_sources_unread');
}

// 004:design_sources_unread Whether still non-empty after null normalization (none/none/empty not counted)
function designUnreadNonEmpty(text) {
  const lines = splitLines(stripFencedCode(text));
  const fieldRegex = /^\s*(?:[-*]\s*)?design_sources_unread\s*:\s*(.*)$/i;
  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(fieldRegex);
    if (!match) continue;
    const inline = match[1].trim();
    if (inline) return !isEmptyish(inline);
    // Multi-line list format: check if the next non-empty line is a genuine list item
    for (let j = i + 1; j < lines.length; j += 1) {
      const t = lines[j].trim();
      if (!t) continue;
      if (/^#{1,6}\s/.test(t)) break;
      if (/^[A-Za-z_][\w-]*\s*:/.test(t)) break;
      if (/^[-*]\s+\S/.test(t)) return !isEmptyish(t.replace(/^[-*]\s+/, ''));
      break;
    }
    return false;
  }
  return false;
}

// 004: design_source_coverage – has partial/degraded been declared?
function designCoveragePartial(text) {
  const body = stripFencedCode(text);
  return splitLines(body).some((line) => {
    if (!/^\s*(?:[-*]\s*)?design_source_coverage\s*:/i.test(line)) return false;
    return /\b(partial|degraded)\b/i.test(line) || /visual-read\s*=\s*partial/i.test(line);
  });
}

// 004: Has the owner explicitly accepted the risks associated with a degraded/unread design?
function designDegradedOwnerAccepted(text) {
  const body = stripFencedCode(text);
  const lines = splitLines(body);
  const hasTraceAcceptance = ownerTraceHasDesignDegradedAcceptance(lines);
  return hasTraceAcceptance || lines.some((line, index) => {
    if (!/(design_degraded_owner_acceptance|owner\s*acceptance|设计降级owner接受|owner接受降级)/i.test(line)) return false;
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) return false;
    const value = line.slice(colonIndex + 1);
    return designAcceptanceBoolTrue(value)
      && (hasDesignAcceptanceReference(line) || designDegradedOwnerAcceptanceRefNear(lines, index));
  });
}

function designAcceptanceBoolTrue(value) {
  return normalizeBool(value) === true || /^\s*(?:true|yes)\b/i.test(String(value || ''));
}

function designDegradedOwnerAcceptanceRefNear(lines, index) {
  const start = Math.max(0, index - 2);
  const end = Math.min(lines.length - 1, index + 2);
  for (let i = start; i <= end; i += 1) {
    if (i === index) continue;
    const line = lines[i];
    if (!/^\s*(?:[-*]\s*)?design_degraded_owner_acceptance_ref\s*:/i.test(line)) continue;
    if (hasDesignAcceptanceReference(line.slice(line.indexOf(':') + 1))) return true;
  }
  return false;
}

function hasDesignAcceptanceReference(text) {
  const value = String(text || '');
  return looksLikeCheckableRef(value) || /\b(?:OQ|D)-\d+\b/i.test(value);
}

function ownerTraceHasDesignDegradedAcceptance(lines) {
  const headings = parseHeadings(lines);
  const ownerTrace = parseOwnerDecisionTrace(lines, headings);
  return ownerTrace.rows.some((traceRow) => {
    if (!isValidTraceRow(traceRow)) return false;
    if (String(traceRow.closure_state || '').toLowerCase().trim() !== 'closed') return false;
    const row = [
      traceRow.question,
      traceRow.owner_answer,
      traceRow.chosen_answer,
      traceRow.prd_write_target,
      traceRow.consequence,
      traceRow.closure_state,
    ].join(' ');
    if (!/(design|figma|degraded|unread|设计|降级|未读)/i.test(row)) return false;
    if (/(reject|rejected|not accept|拒绝|不接受|未接受)/i.test(row)) return false;
    if (!hasDesignAcceptanceReference(row)) return false;
    return /\b(?:accept|accepted|accepts|relax|relaxed)\b|接受|同意|放宽/i.test(row);
  });
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

// Phase 1: Pure text parsing. Accept target string + text string, perform no I/O.
// Return the complete text derivation structures required for the subsequent stage.
function parseStructure(target, text) {
  const normalizedTarget = target.split(path.sep).join('/');
  const prdHash = sha256(normalizeForReceipt(text));
  const lines = splitLines(text);
  const frontmatter = parseFrontmatter(lines);
  const headings = parseHeadings(lines);
  const orphanSectionIds = headings.orphanSectionIds || [];
  const sectionIdCounts = {};
  const unknownSectionIds = [];
  const sectionIdTitleMismatches = [];
  headings.forEach((heading) => {
    if (!heading.sectionId) return;
    sectionIdCounts[heading.sectionId] = (sectionIdCounts[heading.sectionId] || 0) + 1;
    if (!KNOWN_SECTION_IDS.has(heading.sectionId)) {
      unknownSectionIds.push({ section_id: heading.sectionId, line: heading.sectionIdLine });
    }
    const mismatch = sectionIdentityMismatchForHeading(heading);
    if (mismatch) {
      sectionIdTitleMismatches.push(mismatch);
    }
  });
  const duplicateSectionIds = Object.entries(sectionIdCounts)
    .filter(([, count]) => count > 1)
    .map(([sectionId]) => sectionId)
    .sort();
  const duplicateMachineSectionIds = duplicateSectionIds
    .filter((sectionId) => MACHINE_SECTION_IDS.has(sectionId));
  const missingCoreSections = CORE_SECTIONS.filter((section) => (
    !sectionRange(lines, headings, section)
  ));
  const requirementsSection = sectionRange(lines, headings, 'Requirements');
  const requirementIds = uniqueMatches(text, /\b(R-\d{2,})\b/g);
  const validRequirementRowIds = requirementsSection
    ? validRequirementIds(requirementsSection.text)
    : [];
  const acceptanceIds = uniqueMatches(text, /\b(AE-\d{2,})\b/g);
  const nfrIds = uniqueMatches(text, /\b(NFR-\d{2,})\b/g);
  const acceptanceSection = sectionRange(lines, headings, 'Acceptance Examples');
  const validAcceptanceCoverage = acceptanceSection
    ? validAcceptanceExamples(acceptanceSection.text)
    : { ids: [], requirementIds: [] };
  const validAcceptanceExampleIdsInSection = validAcceptanceCoverage.ids;
  const acceptanceRequirementIds = new Set(validAcceptanceCoverage.requirementIds);
  const requirementsWithoutAcceptanceTrace = validRequirementRowIds.filter((id) => (
    !acceptanceRequirementIds.has(id)
  ));
  const uncoveredRequirements = requirementIds.filter((id) => (
    !acceptanceRequirementIds.has(id)
  ));
  const evidenceTagHits = EVIDENCE_TAGS.filter((tag) => text.includes(tag));
  const placeholderLines = lineNumbersFor(lines, /<[^>\n]+>|\bTODO\b|\bTBD\b|\bpending-tooling\b/i)
    .filter((lineNumber) => !isSectionIdComment(lines[lineNumber - 1]));
  const featureSliceGaps = detectFeatureSliceGaps(lines, headings);
  const priorities = priorityDistribution(lines, headings);
  const assumptionRowCount = countAssumptionRows(lines, headings);
  const outstandingQuestionsPresent = sectionPresent(lines, headings, 'Outstanding Questions');
  const planningRecheckPresent = sectionPresent(lines, headings, 'Planning Recheck');
  const outstandingQuestionCount = countSectionRows(lines, headings, 'Outstanding Questions');
  const planningRecheckCount = countSectionRows(lines, headings, 'Planning Recheck');
  const writeModeValues = extractDeclarationValues(text, 'write_mode', [
    'ask-owner-first', 'checkpoint-prd', 'final-prd', 'route-out', 'not-run',
  ]);
  const writeModeValue = writeModeValues[0] || null;
  const writeModeDeclaredValid = Boolean(writeModeValue);
  const clarificationEvidenceValue = extractDeclarationValue(text, 'clarification_evidence', [
    'asked-owner', 'source-proven-no-ask', 'headless-degraded-logged', 'skipped',
  ]);
  const clarificationEvidenceDeclaredValid = Boolean(clarificationEvidenceValue);
  const clarificationEvidenceSubstantive = clarificationEvidenceDeclaredValid
    && clarificationEvidenceValue !== 'skipped';
  const canEnterSpecPlanValue = extractDeclarationValue(text, 'can_enter_spec[-_]?plan', ['yes', 'no']);
  const canEnterSpecPlanDeclaredValid = Boolean(canEnterSpecPlanValue);
  const preflightSweepClosureValue = extractDeclarationValue(text, 'preflight_sweep_closure', [
    'closed', 'degraded', 'blocked', 'missing',
  ]);
  const preflightSweepClosureDeclaredValid = Boolean(preflightSweepClosureValue);
  // Decision Card Three Essentials (write_mode reuses existing fields; here only persists the three essentials unique to the conversation):
  // highest_risk_gap / next_action / why_no_invention。The intermediate product from "dialogue semantics" in Phase 1
  // Externalized as "artifact verifiable facts", prevent model compression Phase 1 from directly reaching Write (R12 ceiling within one step).
  const decisionCardHighestRiskGap = hasConcreteFieldBlock(text, 'decision_card_highest_risk_gap');
  const decisionCardNextActions = extractDeclarationValues(text, 'decision_card_next_action', [
    'ask-owner-first', 'checkpoint-prd', 'final-prd', 'route-out',
  ]);
  const decisionCardNextAction = decisionCardNextActions[0] || null;
  const decisionCardPathMismatch = new Set(writeModeValues).size > 1
    || new Set(decisionCardNextActions).size > 1
    || (writeModeDeclaredValid
      && Boolean(decisionCardNextAction)
      && writeModeValue !== decisionCardNextAction);
  const decisionCardWhyNoInvention = hasConcreteFieldBlock(text, 'decision_card_why_no_invention');
  const decisionCardPresent = decisionCardHighestRiskGap
    && Boolean(decisionCardNextAction)
    && decisionCardWhyNoInvention;
  const designSourceRefsPresent = detectDesignSourceRefs(text);
  const designSourceInventoryDeclared = detectDesignSourceInventory(text);
  const designSourceCoverageDeclared = detectDesignSourceCoverage(text);
  const designSourcesReadPresent = detectDesignSourcesRead(text);
  const designSourcesUnreadPresent = detectDesignSourcesUnread(text);
  const needsReadinessDeclarations = frontmatter.fields.artifact_kind === 'prd-requirements'
    || /\bready-for-planning\b/i.test(text);
  const requirementsPathShaped = /(?:^|\/)[^/]*requirements\.md$/i.test(normalizedTarget);
  const partialPrdStructure = missingCoreSections.length < CORE_SECTIONS.length;
  const prdShaped = requirementIds.length > 0 && (
    frontmatter.fields.artifact_kind === 'prd-requirements'
    || acceptanceIds.length > 0
    || requirementsPathShaped
    || partialPrdStructure
  );
  const writeModeIsFinalPrd = writeModeValue === 'final-prd';
  const writeModeIsCheckpoint = writeModeValue === 'checkpoint-prd';
  const claimsReady = frontmatter.fields.status === 'ready-for-planning'
    || writeModeIsFinalPrd
    || canEnterSpecPlanValue === 'yes';
  const readyReceiptPresent = frontmatter.fields.readiness_verified_by === 'check-prd-artifact.js'
    && frontmatter.fields.readiness_checker_schema === 'spec-prd-artifact-check.v1'
    && Boolean(frontmatter.fields.readiness_prd_hash)
    && Boolean(frontmatter.fields.readiness_inputs_hash);
  const designUnread = designUnreadNonEmpty(text);
  const designPartial = designCoveragePartial(text);
  const designAccepted = designDegradedOwnerAccepted(text);
  const ownerDecisionTraceNeeded = clarificationEvidenceValue === 'asked-owner'
    || ownerDecisionTraceNeededByOutstandingQuestions(lines, headings);
  const machineSectionIdentityMissing = [];
  if (claimsReady) {
    if (!sectionRange(lines, headings, 'Readiness Self-Check')) {
      machineSectionIdentityMissing.push('readiness_self_check');
    }
    if (!sectionRange(lines, headings, 'Outstanding Questions')) {
      machineSectionIdentityMissing.push('outstanding_questions');
    }
    if (ownerDecisionTraceNeeded && !sectionRange(lines, headings, 'Owner Decision Trace')) {
      machineSectionIdentityMissing.push('owner_decision_trace');
    }
    if (designSourceRefsPresent && !sectionRange(lines, headings, 'Design Source Coverage')) {
      machineSectionIdentityMissing.push('design_source_coverage');
    }
    duplicateMachineSectionIds.forEach((sectionId) => {
      if (!machineSectionIdentityMissing.includes(sectionId)) {
        machineSectionIdentityMissing.push(sectionId);
      }
    });
    sectionIdTitleMismatches.forEach((entry) => {
      [entry.section_id, entry.actual_section_id].forEach((sectionId) => {
        if (MACHINE_SECTION_IDS.has(sectionId) && !machineSectionIdentityMissing.includes(sectionId)) {
          machineSectionIdentityMissing.push(sectionId);
        }
      });
    });
  }
  return {
    target, normalizedTarget, prdHash, lines, frontmatter, headings,
    unknownSectionIds, duplicateSectionIds, duplicateMachineSectionIds, orphanSectionIds,
    sectionIdTitleMismatches,
    missingCoreSections, requirementIds, validRequirementRowIds,
    acceptanceIds, validAcceptanceExampleIdsInSection, requirementsWithoutAcceptanceTrace,
    nfrIds, uncoveredRequirements,
    evidenceTagHits, placeholderLines, featureSliceGaps, priorities, assumptionRowCount,
    outstandingQuestionsPresent, planningRecheckPresent, outstandingQuestionCount, planningRecheckCount,
    writeModeValue, writeModeValues, writeModeDeclaredValid, clarificationEvidenceValue,
    clarificationEvidenceDeclaredValid, clarificationEvidenceSubstantive,
    canEnterSpecPlanValue, canEnterSpecPlanDeclaredValid,
    preflightSweepClosureValue, preflightSweepClosureDeclaredValid,
    decisionCardHighestRiskGap, decisionCardNextAction, decisionCardNextActions,
    decisionCardWhyNoInvention, decisionCardPresent, decisionCardPathMismatch,
    designSourceRefsPresent, designSourceInventoryDeclared, designSourceCoverageDeclared,
    designSourcesReadPresent, designSourcesUnreadPresent,
    needsReadinessDeclarations, prdShaped, writeModeIsFinalPrd, writeModeIsCheckpoint,
    claimsReady, readyReceiptPresent, designUnread, designPartial, designAccepted,
    machineSectionIdentityMissing,
  };
}

// Phase II: I/O + facts computation. Accepts the result of parseStructure plus an inputs array,
// Perform I/O (input scanning, hash computation) and OQ analysis, returning { facts, oqAnalysis }.
// facts contain derived boolean values such as ready_claim_present, etc., for consumption by gateReadyClaims/deriveFindings.
function computeFacts(structure, inputPaths, options) {
  const projectRoot = options.projectRoot || findProjectRootFromTarget(structure.target);
  const frontmatterInputs = structure.frontmatterInputs || { present: false, field: null, inputs: [] };
  const inputsFromFrontmatterRequested = options.inputsFromFrontmatter === true;
  const inputsArgumentCount = Array.isArray(options.originalInputs)
    ? options.originalInputs.length
    : inputPaths.length;
  const frontmatterInputCount = frontmatterInputs.inputs.length;
  const sourceInputsPresent = frontmatterInputs.present;
  const inputsFromFrontmatterUsedCount = inputsFromFrontmatterRequested && inputsArgumentCount === 0
    ? frontmatterInputCount
    : 0;
  const inputScan = scanInputDesignRefs(inputPaths, projectRoot);
  const inputsHash = computeInputsHash(inputPaths, { projectRoot });
  const readyReceiptPrdCurrent = structure.readyReceiptPresent
    && structure.frontmatter.fields.readiness_prd_hash === structure.prdHash;
  const readyReceiptInputsCurrent = structure.readyReceiptPresent
    && structure.frontmatter.fields.readiness_inputs_hash === inputsHash;
  const readyReceiptCurrent = readyReceiptPrdCurrent && readyReceiptInputsCurrent;
  const oqAnalysis = analyzeOutstandingQuestions(structure.lines, structure.headings, {
    claimsReady: structure.claimsReady,
    clarificationAskedOwner: structure.clarificationEvidenceValue === 'asked-owner',
  });
  const facts = {
    frontmatter_present: structure.frontmatter.present,
    artifact_kind: structure.frontmatter.fields.artifact_kind || null,
    core_sections_present: CORE_SECTIONS.filter((s) => !structure.missingCoreSections.includes(s)),
    core_sections_missing: structure.missingCoreSections,
    requirement_ids: structure.requirementIds,
    valid_requirement_row_ids: structure.validRequirementRowIds,
    valid_requirement_row_count: structure.validRequirementRowIds.length,
    acceptance_ids: structure.acceptanceIds,
    valid_acceptance_example_ids: structure.validAcceptanceExampleIdsInSection,
    valid_acceptance_example_count: structure.validAcceptanceExampleIdsInSection.length,
    requirements_without_acceptance_trace: structure.requirementsWithoutAcceptanceTrace,
    nfr_ids: structure.nfrIds,
    uncovered_requirements: structure.uncoveredRequirements,
    evidence_tags_present: structure.evidenceTagHits,
    priority_distribution: structure.priorities,
    nfr_count: structure.nfrIds.length,
    assumption_row_count: structure.assumptionRowCount,
    outstanding_question_count: structure.outstandingQuestionCount,
    outstanding_questions_present: structure.outstandingQuestionsPresent,
    outstanding_questions_count: structure.outstandingQuestionCount,
    planning_recheck_present: structure.planningRecheckPresent,
    planning_recheck_count: structure.planningRecheckCount,
    write_mode_declared_valid: structure.writeModeDeclaredValid,
    write_mode: structure.writeModeValue,
    clarification_evidence_declared_valid: structure.clarificationEvidenceDeclaredValid,
    clarification_evidence: structure.clarificationEvidenceValue,
    clarification_trace_present: structure.clarificationEvidenceSubstantive,
    can_enter_spec_plan_declared_valid: structure.canEnterSpecPlanDeclaredValid,
    can_enter_spec_plan: structure.canEnterSpecPlanValue,
    preflight_sweep_closure: structure.preflightSweepClosureValue,
    preflight_sweep_closure_declared_valid: structure.preflightSweepClosureDeclaredValid,
    decision_card_present: structure.decisionCardPresent,
    decision_card_highest_risk_gap_present: structure.decisionCardHighestRiskGap,
    decision_card_next_action: structure.decisionCardNextAction,
    decision_card_why_no_invention_present: structure.decisionCardWhyNoInvention,
    ready_claim_present: structure.claimsReady,
    ready_receipt_present: structure.readyReceiptPresent,
    ready_receipt_current: readyReceiptCurrent,
    ready_receipt_prd_current: readyReceiptPrdCurrent,
    ready_receipt_inputs_current: readyReceiptInputsCurrent,
    ready_receipt_prd_hash: structure.prdHash,
    ready_receipt_inputs_hash: inputsHash,
    // blocking_reason_codes / blocking_finding_count: filled in by buildReport after findings are collected
    design_source_refs_present: structure.designSourceRefsPresent,
    design_source_inventory_declared: structure.designSourceInventoryDeclared,
    design_source_coverage_declared: structure.designSourceCoverageDeclared,
    design_sources_read_present: structure.designSourcesReadPresent,
    design_sources_unread_present: structure.designSourcesUnreadPresent,
    design_sources_unread_non_empty: structure.designUnread,
    design_coverage_partial: structure.designPartial,
    design_degraded_owner_accepted: structure.designAccepted,
    outstanding_question_closure_contract_present: oqAnalysis.facts.outstanding_question_closure_contract_present,
    outstanding_question_rows: oqAnalysis.facts.outstanding_question_rows,
    outstanding_question_missing_closure_count: oqAnalysis.facts.outstanding_question_missing_closure_count,
    blocking_outstanding_question_count: oqAnalysis.facts.blocking_outstanding_question_count,
    planning_invention_question_count: oqAnalysis.facts.planning_invention_question_count,
    unclosed_owner_question_count: oqAnalysis.facts.unclosed_owner_question_count,
    open_oq_without_owner_closure_count: oqAnalysis.facts.open_oq_without_owner_closure_count,
    how_pushdown_touches_what_count: oqAnalysis.facts.how_pushdown_touches_what_count,
    possible_misclassified_how_pushdown_count: oqAnalysis.facts.possible_misclassified_how_pushdown_count,
    owner_decision_trace_present: oqAnalysis.facts.owner_decision_trace_present,
    placeholder_line_count: structure.placeholderLines.length,
    feature_slice_trace_gap_count: structure.featureSliceGaps.length,
    source_inputs_present: sourceInputsPresent,
    source_inputs_field: frontmatterInputs.field,
    frontmatter_source_input_count: frontmatterInputCount,
    inputs_argument_count: inputsArgumentCount,
    effective_input_count: inputPaths.length,
    inputs_from_frontmatter_requested: inputsFromFrontmatterRequested,
    inputs_from_frontmatter_used_count: inputsFromFrontmatterUsedCount,
    input_scan_attempted: inputPaths.length > 0,
    input_scan_status: inputPaths.length > 0
      ? (inputsFromFrontmatterUsedCount > 0 ? 'frontmatter_inputs' : 'cli_inputs')
      : (sourceInputsPresent ? 'no_inputs_argument' : 'no_inputs_declared'),
    receipt_stale_possible_due_to_missing_inputs: sourceInputsPresent && inputsArgumentCount === 0
      && !inputsFromFrontmatterRequested,
    input_scan_hint: sourceInputsPresent && inputsArgumentCount === 0 && !inputsFromFrontmatterRequested
      ? 'Pass --inputs from source_inputs/prd_input or use --inputs-from-frontmatter.'
      : null,
    input_refs_used: inputScan.input_refs_used,
    input_design_refs_present: inputScan.input_design_refs_present,
    input_scan_degraded: inputScan.input_scan_degraded,
  };
  return { facts, oqAnalysis };
}

// claimsReady-gated findings (sub-phase of Phase III): verified only when the artifact declares itself ready
// Contradiction type blocker. Called by deriveFindings, not directly by buildReport.
// Read facts.ready_claim_present as a gate; directly return [] when claimsReady is false.
function gateReadyClaims(facts, oqAnalysis) {
  if (!facts.ready_claim_present) return [];
  const findings = [];
  facts.core_sections_missing.forEach((section) => {
    findings.push({ reason_code: 'core_section_missing', section });
  });
  if (!facts.core_sections_missing.includes('Requirements')
    && facts.valid_requirement_row_count === 0) {
    findings.push({ reason_code: 'requirements_row_missing', section: 'Requirements' });
  }
  if (!facts.core_sections_missing.includes('Acceptance Examples')
    && facts.valid_acceptance_example_count === 0) {
    findings.push({ reason_code: 'acceptance_example_row_missing', section: 'Acceptance Examples' });
  }
  facts.requirements_without_acceptance_trace.forEach((requirement_id) => {
    findings.push({
      reason_code: 'requirement_acceptance_trace_missing',
      section: 'Acceptance Examples',
      requirement_id,
    });
  });
  if (facts.preflight_sweep_closure === 'blocked') {
    findings.push({ reason_code: 'preflight_sweep_closure_blocked' });
  }
  if (!facts.ready_receipt_present) {
    findings.push({ reason_code: 'ready_receipt_absent' });
  } else if (!facts.ready_receipt_current) {
    findings.push({ reason_code: 'ready_receipt_stale' });
  }
  oqAnalysis.reasonCodes.forEach((reason_code) => findings.push({ reason_code }));
  if (facts.design_sources_unread_non_empty && !facts.design_degraded_owner_accepted) {
    findings.push({ reason_code: 'design_unread_without_owner_acceptance' });
  }
  if (facts.design_coverage_partial && !facts.design_degraded_owner_accepted) {
    findings.push({ reason_code: 'design_partial_coverage_unaccepted' });
  }
  // A checkpoint calling itself "ready" is contradictory.
  if (facts.write_mode === 'checkpoint-prd') {
    findings.push({ reason_code: 'checkpoint_claims_ready' });
  }
  // preflight_sweep_closure=closed yet still has closure blocker = self-contradictory.
  // Subset defined in ./lib/reason-codes (single source of truth), anti-drift.
  const closureBlockerPresent = findings.some((f) => isClosureBlocker(f.reason_code));
  if (facts.preflight_sweep_closure === 'closed' && closureBlockerPresent) {
    findings.push({ reason_code: 'preflight_closure_contradicted' });
  }
  return findings;
}

const REMEDIATION_BY_REASON_CODE = {
  decision_card_undeclared: {
    expected_shape: 'Readiness Self-Check includes decision_card_highest_risk_gap, decision_card_next_action, and decision_card_why_no_invention before a ready/final claim.',
    remediation_hint: 'Add the missing Decision Card fields, or keep write_mode as checkpoint-prd with can_enter_spec_plan: no until the highest-risk gap is explicit.',
  },
  decision_card_path_mismatch: {
    expected_shape: 'decision_card_next_action 与已声明的 write_mode 路径完全一致。',
    remediation_hint: '选择唯一写入路径，并在 closeout 前对齐 write_mode 与 decision_card_next_action。',
  },
  open_oq_without_owner_closure: {
    expected_shape: 'Each non-blocking open OQ has a legal closure_disposition with checkable source evidence or a matching Owner Decision Trace row.',
    remediation_hint: 'Add a matching Owner Decision Trace row for the OQ id/question, add a checkable source reference for source-resolved closure, or keep the PRD as checkpoint-prd.',
  },
  owner_decision_trace_required_but_absent: {
    expected_shape: 'asked-owner or owner-* OQ closure is backed by an Owner Decision Trace section with a non-empty chosen answer, write target, and consequence.',
    remediation_hint: 'Add Owner Decision Trace rows that bind to the relevant OQ ids/questions, or change the closure disposition/evidence to a source-backed non-owner path.',
  },
  design_source_coverage_undeclared: {
    expected_shape: 'Design Source Coverage declares design_source_coverage with a machine keyword such as read, unread, partial, or degraded.',
    remediation_hint: 'Add Design Source Coverage with design_source_inventory, design_source_coverage, design_sources_read, and design_sources_unread fields.',
  },
  design_sources_unread_undeclared: {
    expected_shape: 'Design Source Coverage explicitly declares design_sources_unread as none/n/a or as a concrete list with reasons.',
    remediation_hint: 'Add design_sources_unread: none when all design inputs were read, or list unread/degraded sources and their readiness consequence.',
  },
  design_partial_coverage_unaccepted: {
    expected_shape: 'Partial/degraded design coverage is accepted by owner evidence before a ready/final claim.',
    remediation_hint: 'Add an Owner Decision Trace row or design_degraded_owner_acceptance_ref showing owner acceptance, or keep the artifact as checkpoint-prd.',
  },
  ready_receipt_stale: {
    expected_shape: 'readiness_prd_hash and readiness_inputs_hash match the current PRD body and current effective inputs.',
    remediation_hint: 'Rerun finalize with the same effective inputs used to create the PRD, or use --inputs-from-frontmatter when source_inputs/prd_input is present.',
  },
  input_refs_unavailable: {
    expected_shape: 'At least one supplied input path is readable, inside the project root, and scanned by the checker.',
    remediation_hint: 'Pass readable repo-local paths through --inputs, fix missing/out-of-root paths, or use --inputs-from-frontmatter when source_inputs/prd_input is present.',
  },
};

function enrichFinding(finding) {
  const remediation = REMEDIATION_BY_REASON_CODE[finding.reason_code];
  return remediation ? { ...finding, ...remediation } : finding;
}

// Phase three: findings construction. Accept facts + structure + oqAnalysis + inputPaths
// Return the complete findings array. claimsReady-gated portion delegated to gateReadyClaims.
function deriveFindings(facts, structure, oqAnalysis, inputPaths) {
  const findings = [];
  // Basic structure findings
  if (!structure.frontmatter.present) {
    findings.push({ reason_code: 'frontmatter_missing', line: 1 });
  }
  if (structure.frontmatter.present && structure.frontmatter.fields.artifact_kind !== 'prd-requirements') {
    findings.push({
      reason_code: 'artifact_kind_missing_or_wrong',
      expected: 'prd-requirements',
      actual: structure.frontmatter.fields.artifact_kind || null,
      line: structure.frontmatter.startLine,
    });
  }
  if (/(?:^|\/)docs\/prds\//.test(structure.normalizedTarget)) {
    findings.push({ reason_code: 'forbidden_prds_path', path: structure.normalizedTarget });
  }
  structure.missingCoreSections.forEach((section) => {
    findings.push({ reason_code: 'template_structure_hint', section });
  });
  structure.uncoveredRequirements.forEach((requirement_id) => {
    findings.push({ reason_code: 'requirement_without_acceptance_ref', requirement_id });
  });
  structure.placeholderLines.forEach((line) => {
    findings.push({ reason_code: 'placeholder_or_todo_present', line });
  });
  structure.featureSliceGaps.forEach((finding) => findings.push(finding));
  structure.unknownSectionIds.forEach((entry) => {
    findings.push({ reason_code: 'section_id_unknown', section_id: entry.section_id, line: entry.line });
  });
  structure.duplicateSectionIds.forEach((sectionId) => {
    if (MACHINE_SECTION_IDS.has(sectionId)) return;
    findings.push({ reason_code: 'section_id_duplicate', section: sectionId });
  });
  structure.orphanSectionIds.forEach((entry) => {
    findings.push({ reason_code: 'section_id_orphaned', section: entry.sectionId, line: entry.line });
  });
  structure.sectionIdTitleMismatches.forEach((entry) => {
    findings.push({
      reason_code: 'section_id_title_mismatch',
      section: entry.section_id,
      actual_section: entry.actual_section_id,
      expected_title: entry.expected_title,
      actual_title: entry.actual_title,
      title: entry.title,
      line: entry.line,
      section_id_line: entry.section_id_line,
    });
  });
  structure.machineSectionIdentityMissing.forEach((sectionId) => {
    findings.push({ reason_code: 'machine_section_identity_missing', section: sectionId });
  });
  // readiness declaration findings
  if (structure.needsReadinessDeclarations && !structure.writeModeDeclaredValid) {
    findings.push({ reason_code: 'write_mode_undeclared' });
  }
  if (structure.needsReadinessDeclarations && !structure.clarificationEvidenceDeclaredValid) {
    findings.push({ reason_code: 'clarification_evidence_undeclared' });
  }
  if (structure.needsReadinessDeclarations && structure.writeModeIsFinalPrd
    && !structure.clarificationEvidenceSubstantive) {
    findings.push({ reason_code: 'clarification_trace_absent' });
  }
  if (structure.needsReadinessDeclarations && !structure.canEnterSpecPlanDeclaredValid) {
    findings.push({ reason_code: 'can_enter_spec_plan_undeclared' });
  }
  if (structure.prdShaped && !structure.needsReadinessDeclarations) {
    findings.push({ reason_code: 'prd_readiness_declarations_evaded' });
  }
  if ((structure.prdShaped || structure.writeModeIsFinalPrd || structure.needsReadinessDeclarations)
    && !structure.preflightSweepClosureDeclaredValid) {
    findings.push({ reason_code: 'preflight_sweep_closure_absent' });
  }
  // Decision Card Three Essentials: Phase 1 - Persistent intermediate products as artifacts with verifiable fields.
  // Trigger condition narrowed to ready threshold (claimsReady or final-prd): checkpoint allows to remain in grill.
  // Decision Card may not be fully finalized; not mandatory. Landing is only required when declared ready/final.
  // Anti-model compression Phase 1 directly proceeds to Write and immediately becomes ready (leaves the Decision Card in the conversation, unverifiable).
  if ((structure.claimsReady || structure.writeModeIsFinalPrd)
    && !structure.decisionCardPresent) {
    findings.push({ reason_code: 'decision_card_undeclared' });
  }
  if (structure.decisionCardPathMismatch) {
    findings.push({
      reason_code: 'decision_card_path_mismatch',
      write_mode: structure.writeModeValue,
      write_mode_values: [...new Set(structure.writeModeValues)],
      decision_card_next_action: structure.decisionCardNextAction,
      decision_card_next_action_values: [...new Set(structure.decisionCardNextActions)],
    });
  }
  // design source findings
  if (structure.designSourceRefsPresent && !structure.designSourceInventoryDeclared) {
    findings.push({ reason_code: 'design_source_inventory_undeclared' });
  }
  if (structure.designSourceRefsPresent && !structure.designSourceCoverageDeclared) {
    findings.push({ reason_code: 'design_source_coverage_undeclared' });
  }
  if (structure.designSourceRefsPresent && !structure.designSourcesReadPresent) {
    findings.push({ reason_code: 'design_sources_read_undeclared' });
  }
  if (structure.designSourceRefsPresent && !structure.designSourcesUnreadPresent) {
    findings.push({ reason_code: 'design_sources_unread_undeclared' });
  }
  if (facts.input_design_refs_present && !structure.designSourceInventoryDeclared) {
    findings.push({ reason_code: 'design_source_unaccounted' });
  }
  // input scan findings
  if (inputPaths.length > 0 && facts.input_refs_used.length === 0) {
    findings.push({ reason_code: 'input_refs_unavailable' });
  }
  if (facts.input_scan_degraded) {
    findings.push({ reason_code: 'input_scan_degraded' });
  }
  // inputs quantity soft upper limit (advisory, non-BLOCKING —— guard KTD14, does not block valid multi-source).
  if (inputPaths.length > MAX_INPUT_COUNT) {
    findings.push({ reason_code: 'input_scan_input_count_capped', count: inputPaths.length, limit: MAX_INPUT_COUNT });
  }
  // claimsReady-gated findings (assigned to gateReadyClaims)
  findings.push(...gateReadyClaims(facts, oqAnalysis));
  return findings.map(enrichFinding);
}

// buildReport: Three-stage thin shell. Maintain the same public interface and return shape as in previous versions.
function buildReport(target, text, options = {}) {
  const structure = parseStructure(target, text);
  structure.frontmatterInputs = extractSourceInputsFromFrontmatterText(text);
  const suppliedInputs = Array.isArray(options.inputs) ? options.inputs : [];
  const originalInputs = Array.isArray(options.originalInputs) ? options.originalInputs : suppliedInputs;
  const inputPaths = options.inputsFromFrontmatter === true && originalInputs.length === 0
    ? (suppliedInputs.length > 0 ? suppliedInputs : structure.frontmatterInputs.inputs)
    : suppliedInputs;
  const reportOptions = {
    ...options,
    originalInputs,
  };
  const { facts, oqAnalysis } = computeFacts(structure, inputPaths, reportOptions);
  const findings = deriveFindings(facts, structure, oqAnalysis, inputPaths);
  const blockingReasons = [...new Set(
    findings.map((f) => f.reason_code).filter((c) => BLOCKING_REASON_CODES.has(c)),
  )].sort();
  facts.blocking_reason_codes = blockingReasons;
  facts.blocking_finding_count = blockingReasons.length;
  return {
    schema_version: 'spec-prd-artifact-check.v1',
    target,
    status: 'checked',
    facts,
    findings,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write('check-prd-artifact.js — produce deterministic readiness facts for a PRD artifact.\n');
    process.stdout.write('usage: check-prd-artifact.js <target-prd-path> [--inputs <input-path>[,<input-path>...]]... [--inputs-from-frontmatter] [--stdin]\n');
    process.stdout.write('  --inputs-from-frontmatter  use source_inputs/prd_input frontmatter paths when no --inputs are supplied.\n');
    process.stdout.write('  --stdin                    read PRD content from stdin instead of <target-prd-path> file (target path still required as a virtual path for path-based checks). Enables write-before-dry-run: pipe a draft through this to see ALL findings at once before the durable Write.\n');
    process.stdout.write('  emits facts JSON on stdout; exit 0 regardless of findings (failures surface as facts.blocking_reason_codes).\n');
    process.exit(0);
  }
  if (args.error || !args.target) {
    if (args.error) {
      process.stderr.write(`${args.error}\n`);
    }
    process.stderr.write('usage: check-prd-artifact.js <target-prd-path> [--inputs <input-path>[,<input-path>...]]... [--inputs-from-frontmatter] [--stdin]\n');
    process.exit(2);
  }

  const emitReport = (targetText) => {
    const report = buildReport(args.target, targetText, {
      inputs: args.inputs,
      inputsFromFrontmatter: args.inputsFromFrontmatter,
    });
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  };

  if (args.stdin) {
    // --stdin: Read PRD content from stdin, target serves as a virtual path (for path validation purposes such as in forbidden_prds_path).
    // Write before dry-run: The model pipes a draft prior to formal writing, capturing all findings in one go, to avoid the cycle of "write → stop hook blocks → revise → blocked again".
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => { emitReport(data); });
    return;
  }

  let targetText;
  try {
    targetText = fs.readFileSync(path.resolve(args.target), 'utf8');
  } catch (err) {
    process.stderr.write(`cannot read target: ${args.target}\n`);
    process.exit(2);
  }

  emitReport(targetText);
}

if (require.main === module) {
  main();
}

module.exports = {
  BLOCKING_REASON_CODES,
  LEGAL_DISPOSITIONS,
  OQ_HEADER_ALIASES,
  TRACE_HEADER_ALIASES,
  WHAT_TOUCHING_KEYWORDS,
  buildReport,
  computeInputsHash,
  extractSourceInputsFromFrontmatterText,
  normalizeForReceipt,
  sha256,
  // Three-stage function: Supply in-process unit tests for direct invocation, without affecting buildReport compilation.
  parseStructure,
  computeFacts,
  deriveFindings,
  gateReadyClaims,
  // Base pure functions: For in-process unit testing and testing edge cases.
  parseHeaderedTable,
  looksLikeCheckableRef,
  traceRowBindsOq,
  isEmptyish,
  matchHeadingTitle,
  stripHeadingDecoration,
  analyzeOutstandingQuestions,
};
