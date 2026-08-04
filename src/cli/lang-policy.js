const LANG_START = '<!-- spec-first:lang:start -->';
const LANG_END = '<!-- spec-first:lang:end -->';
const WORKFLOW_ENTRY_ANCHOR = '<!-- spec-first:workflow-entry:using-spec-first -->';
const USER_LANGUAGE_START = '<!-- spec-first:user-language:start -->';
const USER_LANGUAGE_END = '<!-- spec-first:user-language:end -->';

/**
 * Apply the managed block to existing file content, idempotently.
 * Exported for unit testing.
 *
 * @param {string} existing - Current file content (may be empty string).
 * @param {string} block    - Full managed block including START/END markers.
 * @returns {string}        - Updated content.
 */
function applyManagedBlock(existing, block) {
  const markers = inspectMarkerStructure(existing, LANG_START, LANG_END);
  if (!markers.absent && !markers.valid) {
    throw new Error('managed language/governance markers must form exactly one balanced pair');
  }
  return upsertMarkerBlock(existing, block, LANG_START, LANG_END);
}

function inspectMarkerStructure(contents, startMarker, endMarker) {
  const startIndexes = findMarkerIndexes(contents, startMarker);
  const endIndexes = findMarkerIndexes(contents, endMarker);
  const absent = startIndexes.length === 0 && endIndexes.length === 0;
  const valid = startIndexes.length === 1 &&
    endIndexes.length === 1 &&
    startIndexes[0] < endIndexes[0];

  return {
    absent,
    valid,
    startIdx: startIndexes.length === 1 ? startIndexes[0] : -1,
    endIdx: endIndexes.length === 1 ? endIndexes[0] : -1,
  };
}

function findMarkerIndexes(contents, marker) {
  const indexes = [];
  let searchFrom = 0;
  while (searchFrom <= contents.length - marker.length) {
    const index = contents.indexOf(marker, searchFrom);
    if (index === -1) {
      break;
    }
    indexes.push(index);
    searchFrom = index + marker.length;
  }
  return indexes;
}

function upsertMarkerBlock(existing, block, startMarker, endMarker) {
  const pair = findCompleteMarkerPair(existing, startMarker, endMarker);
  if (pair) {
    const before = existing.slice(0, pair.startIdx);
    const after = existing.slice(pair.endIdx + endMarker.length);
    return `${before}${block}${after}`;
  }

  if (existing.length === 0) {
    return block;
  }
  const separator = existing.endsWith('\n') ? '\n' : '\n\n';
  return `${existing}${separator}${block}\n`;
}

function removeMarkerBlock(existing, startMarker, endMarker) {
  const pair = findCompleteMarkerPair(existing, startMarker, endMarker);
  if (!pair) {
    return existing;
  }

  const before = existing.slice(0, pair.startIdx);
  const after = existing.slice(pair.endIdx + endMarker.length);
  return `${before}${after}`;
}

function findCompleteMarkerPair(contents, startMarker, endMarker) {
  let searchFrom = 0;
  while (searchFrom < contents.length) {
    const startIdx = contents.indexOf(startMarker, searchFrom);
    if (startIdx === -1) {
      return null;
    }

    const afterStart = startIdx + startMarker.length;
    const nextStartIdx = contents.indexOf(startMarker, afterStart);
    const endIdx = contents.indexOf(endMarker, afterStart);
    if (endIdx !== -1 && (nextStartIdx === -1 || endIdx < nextStartIdx)) {
      return { startIdx, endIdx };
    }

    searchFrom = nextStartIdx === -1 ? afterStart : nextStartIdx;
  }

  return null;
}

/**
 * Build the full managed block for the given lang.
 *
 * @param {string} lang - 'zh' or 'en'
 * @returns {string}
 */
function buildManagedBlock(lang) {
  const policy = lang === 'en' ? buildEnProjectPolicy() : buildZhProjectPolicy();
  return `${LANG_START}\n${policy}\n${LANG_END}`;
}

function buildUserLanguageBlock(lang) {
  const policy = lang === 'en' ? buildEnUserLanguagePolicy() : buildZhUserLanguagePolicy();
  return `${USER_LANGUAGE_START}\n${policy}\n${USER_LANGUAGE_END}`;
}

function buildZhProjectPolicy() {
  return `## 语言与治理策略
**语言设置：** \`Chinese / 中文\`
${buildZhLanguageRules()}
### Workflow 入口治理
${WORKFLOW_ENTRY_ANCHOR}
- 在执行实质性工作前，加载当前宿主已安装的 \`using-spec-first\` skill；完整入口路由与边界由该 skill 提供。`;
}

function buildEnProjectPolicy() {
  return `## Language and Governance Policy
**Language setting:** \`English / 英文\`
${buildEnLanguageRules()}
### Workflow Entry Governance
${WORKFLOW_ENTRY_ANCHOR}
- Before substantial work, load the \`using-spec-first\` skill installed for the current host; that skill provides the full entry routing map and boundaries.`;
}

function buildZhUserLanguagePolicy() {
  return `## Language
${buildZhLanguageRules()}`;
}

function buildEnUserLanguagePolicy() {
  return `## Language
${buildEnLanguageRules()}`;
}

function buildZhLanguageRules() {
  return `语言规则为绝对硬执行要求：除非用户在当前请求中明确要求其他语言、翻译、双语输出或保留原文，所有面向用户的新生成自然语言内容必须使用简体中文。
适用范围覆盖回答、状态更新、澄清问题、总结、评审、生成文档、需求、计划、任务、变更说明、commit message 和 PR 文案。
代码标识符、命令、路径、配置键、环境变量、API 名称、协议名、日志、工具输出和引用材料可以保留原文；围绕它们新增的解释、结论和说明仍按本语言设置输出。
skill、agent、模板、历史上下文或示例文本的原文语言不得覆盖本设置；新增代码注释也按本设置，只说明非显然意图。`;
}

function buildEnLanguageRules() {
  return `Language rules are an absolute hard-execution requirement: unless the current request explicitly asks for another language, translation, bilingual output, or preserved source text, all newly generated natural-language content intended for the user must be in English.
Scope covers responses, status updates, clarification questions, summaries, reviews, generated documents, requirements, plans, tasks, change notes, commit messages, and PR text.
Code identifiers, commands, paths, config keys, environment variables, API names, protocol names, logs, tool output, and quoted material may remain in their original language; any new explanation, conclusion, or surrounding guidance must follow this language setting.
The source language of skills, agents, templates, historical context, or examples must not override this setting; new code comments also follow this setting and explain only non-obvious intent.`;
}

module.exports = {
  applyManagedBlock,
  buildManagedBlock,
  buildUserLanguageBlock,
  LANG_END,
  LANG_START,
  inspectMarkerStructure,
  upsertMarkerBlock,
  removeMarkerBlock,
  WORKFLOW_ENTRY_ANCHOR,
  USER_LANGUAGE_START,
  USER_LANGUAGE_END,
};
