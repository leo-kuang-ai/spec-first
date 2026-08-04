#!/usr/bin/env node
'use strict';

// 确定性 PRD artifact 检查:只报告 Markdown 结构、frontmatter、trace、占位符等
// script-owned facts。是否构成 readiness blocker 由 PRD readiness lens 语义裁决。

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// reason-code 分类法(BLOCKING 阻断码 + closure/receipt/checkpoint 子集分类器)的单一真相源。
// 本脚本与 finalize-prd-artifact.js 共同消费 ./lib/reason-codes,消除分类法双归属漂移。
const {
  BLOCKING_REASON_CODES,
  isClosureBlocker,
} = require('./lib/reason-codes');

const MAX_INPUT_SCAN_BYTES = 5 * 1024 * 1024;
// inputs 数量软上限:超过不阻塞(避免误杀合法多源),只 emit advisory finding input_scan_input_count_capped
// 提示 agent 减少 inputs 或提 timeout 预算(配合 prd-readiness-guard 5000ms 超时分支)。
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

// 004:Outstanding Questions 表的 header-aware 解析。只认下面这张冻结的最小别名表;
// 扩展别名必须先加 fixture。canonical key -> 允许的 header 文本(小写匹配)。
const OQ_HEADER_ALIASES = {
  id: ['id', '编号'],
  question: ['question', '问题'],
  prd_write_target: ['prd_write_target', 'prd write target', 'write target', 'prd写入目标', '需求写入目标', '写入目标'],
  owner_status: ['owner_status', 'owner status', 'owner状态', '澄清状态'],
  blocks_planning: ['blocks_planning', 'blocks planning?', 'blocks planning', '是否阻塞规划', '阻塞规划'],
  closure_disposition: ['closure_disposition', 'disposition', 'closure disposition', '闭合方式', '闭合依据'],
  planning_would_invent_what: ['planning_would_invent_what', 'planning would invent what?', 'planning would invent what', '是否会发明what', '会否发明what'],
  closure_state: ['closure_state', 'closure state', '闭合状态'],
  recommended_default: ['recommended_default', 'recommended default', 'deferred_reason', 'deferred reason', '推荐默认', '延后原因', '默认/延后原因'],
};

const TRACE_HEADER_ALIASES = {
  question: ['question', 'decision', '问题', '决策'],
  owner_answer: ['owner_answer', 'owner answer', 'owner_answer/source', 'owner回答', '回答/来源'],
  chosen_answer: ['chosen_answer', 'chosen answer', '采纳答案', '最终答案'],
  prd_write_target: ['prd_write_target', 'prd write target', 'write target', 'prd写入目标', '需求写入目标', '写入目标'],
  consequence: ['consequence', 'readiness consequence', '影响', '后果'],
  closure_state: ['closure_state', 'closure state', '闭合状态'],
};

// 合法 closure disposition(剃刀的唯一出口)。源类需要形似引用证据,owner 类需要 trace row。
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

// how-pushdown 误分类词表(冻结契约,扩展须加 fixture):命中且 claims-ready 即三重合取矛盾。
const WHAT_TOUCHING_KEYWORDS = [
  'interface', '接口', 'availability', '可用性', 'permission', '权限',
  'scope', '范围', 'source-of-truth', '数据权威', 'fallback', '降级',
  'analytics', '埋点', '指标',
];

// source 类 disposition 的证据 cell 须形似可核查引用:URL / 带扩展名的文件路径 / file:line /
// 多段路径 / 锚点 id。按 whitespace 切 token 后逐个判,避免散文里的 `and/or`、`input/output`、
// `n/a` 这类带斜杠词被误判为 ref(那是上一轮 source-ref-shape fix 想堵的廉价伪造)。
function looksLikeCheckableRef(text) {
  if (!text) return false;
  const tokens = String(text).trim().split(/\s+/).filter(Boolean);
  return tokens.some((tok) => {
    if (/^https?:\/\/\S+/i.test(tok)) return true; // URL
    if (/[\w-]+\.[a-z0-9]+(?::\d+)?$/i.test(tok)) return true; // file.ext 或 file.ext:line
    if (/^#[\w-]+$/.test(tok)) return true; // 锚点 id
    // 多段路径(>=2 个斜杠,如 src/cli/foo);单斜杠的散文词(and/or)不算
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
    // 004:只用可读且在项目根内的输入计算 hash;失败输入由 degraded findings 表达。
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

// 004:把 Markdown 表按表头别名解析成 {key: value} 行。返回 { headerMap, rows }。
// headerMap: canonical key -> 列下标;rows: 每行是 canonical key -> cell 文本。
// 未识别的表头被忽略;识别不到任何 canonical 列时 headerMap 为空。
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

// 空值归一:none/无/空/n-a/[]/占位 都视为空。
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

// 一条 Owner Decision Trace 行是否有效:chosen_answer + write target + consequence 三非空。
function isValidTraceRow(row) {
  return !isEmptyish(row.chosen_answer) && !isEmptyish(row.prd_write_target) && !isEmptyish(row.consequence);
}

// F-L1 逐行绑定:一条 owner-* OQ 是否能绑定到一条可核验 trace 行。
// 仅两条信号(均为 artifact 内部引用一致性,非会话事件):
// (a) question-match:normalize 后 exact 相等(trim+collapse+lowercase,非 substring);
// (b) id-reference:oq.id 非空且作为 bounded token 出现在 trace 任一可识别 cell(防 OQ-2 误配 OQ-20)。
// 硬性不做 write-target-token-overlap:Requirements/Acceptance Examples 等泛目标会让一行重盖无限 OQ,
// 是全局开关的软重生。语义严格限定为「这条 OQ 是否指向一条真实 trace 行」,不证明 owner 真实决策。
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

// 解析 Owner Decision Trace:返回带 chosen_answer + write target 的非空 row 数。
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

// 004:Outstanding Questions 的剃刀分析。claimsReady 决定矛盾类是否升级为 blocker。
// 返回 facts + 触发的 reason_codes(blocker 与 advisory 混在一起,由调用方按 BLOCKING set 过滤)。
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

  // closure contract 是否齐备:必须能识别到 blocks_planning / closure_disposition / closure_state
  const hasClosureContract = ['blocks_planning', 'closure_disposition', 'closure_state']
    .every((k) => k in headerMap);
  facts.outstanding_question_closure_contract_present = hasClosureContract;
  if (rows.length > 0 && !hasClosureContract && claimsReady) {
    reasonCodes.add('outstanding_question_closure_undeclared');
  }

  // 004 修补(bullet-OQ 旁路):OQ 段以非表格形式(bullet / 编号 / 裸 OQ 编号)列出未决
  // 问题时,parseHeaderedTable 得到 0 行,会整段绕过下面的逐行剃刀,使 load-bearing OQ
  // 标「非阻塞」散文即可混入 ready。这本身就是「claims-ready 却携带未声明 closure 的
  // 未决问题」——与逐行剃刀同类的确定性矛盾(段有未决问题内容 + 自称 ready + 无 closure
  // 表),非 ceremony-presence 检查。复用 outstanding_question_closure_undeclared,不新增
  // BLOCKING code。只在 claims-ready 时升级 blocker;draft / checkpoint 不触发。
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

    // 缺必填声明
    if (hasClosureContract && (blocks === null || isEmptyish(row.closure_disposition))) {
      facts.outstanding_question_missing_closure_count += 1;
    }
    // 显式 blocking / 会发明 WHAT / 未闭合
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

    // 剃刀:非阻塞 open OQ 必须带合法 disposition + 证据
    if (isNonBlocking) {
      let dispositionOk = LEGAL_DISPOSITIONS.has(disposition);
      if (dispositionOk && SOURCE_DISPOSITIONS.has(disposition)) {
        // 源类需要形似引用证据(write target / recommended_default 任一形似 ref,或 trace 命中)
        const refCandidate = `${row.prd_write_target || ''} ${row.recommended_default || ''}`;
        dispositionOk = looksLikeCheckableRef(refCandidate);
      }
      if (dispositionOk && OWNER_DISPOSITIONS.has(disposition)) {
        // F-L1:owner 类需要一条【可核验绑定该 OQ】的有效 trace 行,而非任意一条全局有效行。
        dispositionOk = ownerTrace.rows.some((tr) => isValidTraceRow(tr) && traceRowBindsOq(tr, row));
      }
      if (!dispositionOk) {
        facts.open_oq_without_owner_closure_count += 1;
        if (claimsReady) reasonCodes.add('open_oq_without_owner_closure');
      }
      // how-pushdown 残余旋钮:命中 WHAT 词表
      if (disposition === 'implementation-only-how-pushdown' && hitsWhat) {
        if (claimsReady) {
          facts.how_pushdown_touches_what_count += 1;
          reasonCodes.add('how_pushdown_touches_what');
        } else {
          facts.possible_misclassified_how_pushdown_count += 1;
        }
      }
    }
  });

  // asked-owner / answered|capped 依赖 owner answer 时必须有 trace
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
  // 比 hasConcreteFieldBlock 更严格:只接受 none/n/a 标记或 YAML 列表声明,
  // 拒绝散文字符串(如"Figma 画布未直接读取")——散文被误判为"已声明"会掩盖 read_undeclared。
  const lines = splitLines(stripFencedCode(text));
  const fieldRegex = /^\s*(?:[-*]\s*)?design_sources_read\s*:\s*(.*)$/i;
  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(fieldRegex);
    if (!match) continue;
    const inline = match[1].trim();
    if (/^none$|^n\/a$/i.test(inline)) return true; // none/n/a 是合法的"无"声明
    if (inline) continue; // 行内有散文值 → 不算合法声明,继续找下一行
    // 无行内值 → 查下一个非空行是否是列表项
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

// 004:design_sources_unread 经空值归一后是否仍非空(none/无/空 不算)。
function designUnreadNonEmpty(text) {
  const lines = splitLines(stripFencedCode(text));
  const fieldRegex = /^\s*(?:[-*]\s*)?design_sources_unread\s*:\s*(.*)$/i;
  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(fieldRegex);
    if (!match) continue;
    const inline = match[1].trim();
    if (inline) return !isEmptyish(inline);
    // 多行 list 形式:看下一非空行是否为实质 list item
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

// 004:design_source_coverage 是否声明 partial/degraded。
function designCoveragePartial(text) {
  const body = stripFencedCode(text);
  return splitLines(body).some((line) => {
    if (!/^\s*(?:[-*]\s*)?design_source_coverage\s*:/i.test(line)) return false;
    return /\b(partial|degraded)\b/i.test(line) || /visual-read\s*=\s*partial/i.test(line);
  });
}

// 004:owner 是否明确接受了 degraded/unread design 风险。
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

// 阶段一:纯文本解析。接受 target 字符串 + text 字符串,不做任何 I/O,
// 返回后续阶段所需的全部文本派生结构体。
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
  // Decision Card 三要素(write_mode 复用既有字段,这里只持久化对话独有的三要素):
  // highest_risk_gap / next_action / why_no_invention。把 Phase 1 中间产物从"对话语义"
  // 外化为"artifact 可验证事实",防模型压缩 Phase 1 直接到 Write(R12 天花板内可推一步)。
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

// 阶段二:I/O + facts 计算。接受 parseStructure 结果 + inputs 数组,
// 执行 I/O(input 扫描、hash 计算)和 OQ 分析,返回 { facts, oqAnalysis }。
// facts 含 ready_claim_present 等 policy 派生布尔,供 gateReadyClaims/deriveFindings 消费。
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
  const readyReceiptCurrent = structure.readyReceiptPresent
    && structure.frontmatter.fields.readiness_prd_hash === structure.prdHash
    && structure.frontmatter.fields.readiness_inputs_hash === inputsHash;
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
    ready_receipt_prd_hash: structure.prdHash,
    ready_receipt_inputs_hash: inputsHash,
    // blocking_reason_codes / blocking_finding_count:由 buildReport 在 findings 收集后填入
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

// claimsReady-gated findings(阶段三的子段):仅在 artifact 自称 ready 时检查的
// 矛盾类 blocker。由 deriveFindings 调用,不直接从 buildReport 调用。
// 读 facts.ready_claim_present 作为闸;claimsReady=false 时直接返回 []。
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
  // checkpoint 自称 ready 是矛盾
  if (facts.write_mode === 'checkpoint-prd') {
    findings.push({ reason_code: 'checkpoint_claims_ready' });
  }
  // preflight_sweep_closure=closed 却仍有 closure blocker = 自相矛盾。
  // 子集定义在 ./lib/reason-codes(单一真相源),防漂移。
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

// 阶段三:findings 构建。接受 facts + structure + oqAnalysis + inputPaths,
// 返回完整 findings 数组。claimsReady-gated 部分委托给 gateReadyClaims。
function deriveFindings(facts, structure, oqAnalysis, inputPaths) {
  const findings = [];
  // 基础结构 findings
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
  // readiness 声明 findings
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
  // Decision Card 三要素:Phase 1 中间产物持久化为 artifact 可验证字段。
  // 触发条件收窄到 ready 门槛(claimsReady 或 final-prd):checkpoint 允许还在 grill 中,
  // Decision Card 可能未完全成型,不强制;只有声称 ready/final 时才要求已落地,
  // 防模型压缩 Phase 1 直接到 Write 后直接 ready(把 Decision Card 留在对话里不可验证)。
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
  // inputs 数量软上限(advisory,非 BLOCKING——守 KTD14,不阻塞合法多源)。
  if (inputPaths.length > MAX_INPUT_COUNT) {
    findings.push({ reason_code: 'input_scan_input_count_capped', count: inputPaths.length, limit: MAX_INPUT_COUNT });
  }
  // claimsReady-gated findings(委托给 gateReadyClaims)
  findings.push(...gateReadyClaims(facts, oqAnalysis));
  return findings.map(enrichFinding);
}

// buildReport:三阶段的薄外壳。维持与历史版本相同的公开接口和返回形状。
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
    // --stdin: 从 stdin 读 PRD 内容,target 作为虚拟路径(用于 forbidden_prds_path 等路径校验)。
    // 写前 dry-run: 模型在正式 Write 前先 pipe draft,一次性拿到全部 findings,避免"写→Stop hook 拦→修一个→再拦"循环。
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
  // 三阶段函数:供 in-process 单测直接调用,不影响 buildReport 编排。
  parseStructure,
  computeFacts,
  deriveFindings,
  gateReadyClaims,
  // 基础纯函数:供 in-process 单测直测 edge case。
  parseHeaderedTable,
  looksLikeCheckableRef,
  traceRowBindsOq,
  isEmptyish,
  matchHeadingTitle,
  stripHeadingDecoration,
  analyzeOutstandingQuestions,
};
