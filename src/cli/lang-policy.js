const fs = require('node:fs');
const path = require('node:path');
const { writeFileAtomic } = require('./atomic-write');

const LANG_START = '<!-- spec-first:lang:start -->';
const LANG_END = '<!-- spec-first:lang:end -->';
const USER_LANGUAGE_START = '<!-- spec-first:user-language:start -->';
const USER_LANGUAGE_END = '<!-- spec-first:user-language:end -->';

/**
 * Idempotently write the language and governance policy block into the repo-root
 * instruction file (CLAUDE.md for Claude, AGENTS.md for Codex).
 *
 * - File absent: create it with just the managed block.
 * - File exists, no markers: append the block at end.
 * - File exists, markers present: replace the block in place (preserves surrounding content).
 * - Corrupted state (START without END): treat as "no markers" and append.
 *
 * @param {string} projectRoot
 * @param {{ lang: string }} developer
 * @param {import('./adapters/base')} adapter
 */
function writeLangPolicy(projectRoot, developer, adapter) {
  const filePath = path.join(projectRoot, adapter.instructionFile);
  const block = buildManagedBlock(developer.lang);

  let existing = '';
  if (fs.existsSync(filePath)) {
    existing = fs.readFileSync(filePath, 'utf8');
  }

  const updated = applyManagedBlock(existing, block);

  writeFileAtomic(filePath, updated);

  console.log(`📋 Wrote language policy to ${adapter.instructionFile}`);
}

/**
 * Apply the managed block to existing file content, idempotently.
 * Exported for unit testing.
 *
 * @param {string} existing - Current file content (may be empty string).
 * @param {string} block    - Full managed block including START/END markers.
 * @returns {string}        - Updated content.
 */
function applyManagedBlock(existing, block) {
  return upsertMarkerBlock(existing, block, LANG_START, LANG_END);
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
- 本 block 同时提供 \`using-spec-first\` source pointer；完整入口路由与边界在 \`skills/using-spec-first/SKILL.md\`。
### Changelog
- 任何项目 source 变更都必须同步更新根目录 \`CHANGELOG.md\`，沿用仓库既有格式；用户可见变更追加 \`(user-visible)\`。
- 缺少 changelog 记录时拒绝生成 source 变更；\`作者\` 优先沿用全局 developer profile，其次使用 git 提交身份或留空，取不到不阻断变更。`;
}

function buildEnProjectPolicy() {
  return `## Language and Governance Policy
**Language setting:** \`English / 英文\`
${buildEnLanguageRules()}
### Workflow Entry Governance
- This block also provides the \`using-spec-first\` source pointer; the full entry routing map and boundaries live in \`skills/using-spec-first/SKILL.md\`.
### Changelog
- Any project source change must update the repo-root \`CHANGELOG.md\`, following the repository's existing format; append \`(user-visible)\` for user-visible changes.
- If the changelog entry is missing, refuse to generate the source change; \`author\` prefers the global developer profile, then the git commit identity or blank, and must not block the change.`;
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
  writeLangPolicy,
  applyManagedBlock,
  buildManagedBlock,
  buildUserLanguageBlock,
  LANG_END,
  LANG_START,
  upsertMarkerBlock,
  removeMarkerBlock,
  USER_LANGUAGE_START,
  USER_LANGUAGE_END,
};
