#!/usr/bin/env node
'use strict';

const {
  evidence,
  listSourceTextFiles,
  makeArtifact,
  parseCommonArgs,
  readText,
  readTextWithMetadata,
  relativeTo,
  sourceInputFromFiles,
  writeJsonOutput,
} = require('./lib/audit-utils');

function extractEngineeringQuality(options = {}) {
  const scan = listSourceTextFiles(options);
  const { repoRoot, files } = scan;
  // SUP-18 fix: 收集 candidates 和 degradedModes
  const results = files.map((filePath) => inspectEngineeringQuality(filePath, repoRoot));
  const candidates = results.flatMap((r) => r.candidates);
  const fileDegradedModes = results.flatMap((r) => r.degradedModes);

  return makeArtifact({
    schemaVersion: 'engineering-quality-contract.v1',
    artifactId: 'engineering-quality-contract',
    sourceInputs: [sourceInputFromFiles('code', files, repoRoot, scan)],
    body: {
      candidate_count: candidates.length,
      candidates,
      candidate_summary: summarizeCandidates(candidates),
      extraction_notes: [
        'Candidates are static signals for App engineering review. Scripts do not classify them as confirmed issues.',
      ],
      // SUP-18 fix: 合并扫描层和文件读取层的 degraded modes
      degraded_modes: [...scan.degraded_modes, ...fileDegradedModes],
    },
  });
}

function inspectEngineeringQuality(filePath, repoRoot) {
  const rel = relativeTo(repoRoot, filePath);
  // SUP-18 fix: 使用 readTextWithMetadata 获取截断信息
  const read = readTextWithMetadata(filePath);
  const text = read.text;
  const blocks = extractFunctionLikeBlocks(text);
  const candidates = [];
  const degradedModes = [];

  if (text.split(/\r?\n/).length > 500) {
    candidates.push(candidate('large_file', rel, 'File exceeds 500 lines and may hide mixed App responsibilities.'));
  }
  if (/catch\s*\([^)]*(Exception|Throwable)[^)]*\)\s*\{\s*\}/s.test(text)) {
    candidates.push(candidate('swallowed_exception', rel, 'Exception catch block appears empty.'));
  }
  if (/(catch\s*\([^)]*CancellationException[^)]*\)\s*\{[^}]*\})/s.test(text)) {
    const catches = text.match(/catch\s*\([^)]*CancellationException[^)]*\)\s*\{[^}]*\}/gs) || [];
    if (catches.some((block) => !/\bthrow\b|\bcancel\b/.test(block))) {
      candidates.push(candidate('cancellation_exception_not_rethrown', rel, 'CancellationException appears to be handled without rethrow or cancel signal in the catch block.'));
    }
  }
  if (/(Log\.(d|i|v)|println)\s*\([^)]*(password|token|secret|phone|email|身份证|密码)/i.test(text)) {
    candidates.push(candidate('sensitive_log_candidate', rel, 'Logging call appears near sensitive field names.'));
  }
  if (/(SharedPreferences|UserDefaults|DataStore|Keychain|Keystore)/.test(text) && /(password|token|secret|密码)/i.test(text)) {
    candidates.push(candidate('sensitive_local_storage_candidate', rel, 'Local storage usage appears near sensitive field names.'));
  }
  if (blocks.some((block) => /(for\s*\(|while\s*\()[\s\S]{0,400}(api|repository|remote|http|request|query|dao)\./i.test(block))) {
    candidates.push(candidate('loop_remote_or_db_call', rel, 'Loop appears to call remote or database dependency in the same function-like block.'));
  }
  if (blocks.some((block) => /(submit|confirm|pay|order|commit)/i.test(block)
    && !/(debounce|disabled|loading|idempot|duplicate|Mutex|throttle)/i.test(block))) {
    candidates.push(candidate('submit_without_duplicate_guard_signal', rel, 'Submit-like block lacks obvious debounce/loading/idempotency guard signal.'));
  }
  if (blocks.some((block) => /(withContext\(Dispatchers\.Main\)|MainScope|runBlocking)/.test(block)
    && /(Room|Sql|Database|Dao|FileInputStream|readBytes|writeBytes)/.test(block))) {
    candidates.push(candidate('main_thread_io_candidate', rel, 'Main dispatcher scope appears near IO or database APIs in the same function-like block.'));
  }
  if (blocks.some((block) => /(retry|while\s*\(true\)|repeat\()/i.test(block)
    && !/(timeout|backoff|delay|limit|max)/i.test(block))) {
    candidates.push(candidate('unbounded_retry_candidate', rel, 'Retry-like block lacks obvious timeout/backoff/limit signal.'));
  }
  if (/LaunchedEffect\s*\([^)]*\)[\s\S]{0,500}(api|repository|remote|http|request|load|fetch)\./i.test(text)) {
    candidates.push(candidate('compose_launched_effect_request_candidate', rel, 'Compose LaunchedEffect appears near a request/load call; key stability and repeated trigger risk need review.'));
  }
  if (/\.onAppear\s*\{[\s\S]{0,500}(api|repository|remote|http|request|load|fetch)\./i.test(text)) {
    candidates.push(candidate('swiftui_onappear_request_candidate', rel, 'SwiftUI onAppear appears near a request/load call; repeated exposure/request risk need review.'));
  }
  if (blocks.some((block) => /(WebSocket|Timer|poll|setInterval|Flow|collect)\b/i.test(block)
    && !/(onCleared|DisposableEffect|dispose|cancel|stop|Lifecycle|repeatOnLifecycle)/i.test(block))) {
    candidates.push(candidate('lifecycle_stream_not_stopped_candidate', rel, 'Long-lived stream, polling, or collection signal lacks obvious lifecycle stop/cancel handling.'));
  }
  if (/ViewModel/.test(text) && /\b(Activity|Context|UIViewController|ViewController)\b/.test(text)) {
    candidates.push(candidate('viewmodel_holds_ui_context_candidate', rel, 'ViewModel appears near Activity/Context/ViewController type names.'));
  }

  // SUP-18 fix: 如果文件被截断，添加 degraded mode
  if (read.truncated) {
    degradedModes.push({
      mode: 'source_truncated',
      reason: `File truncated at ${read.bytesRead} bytes (${read.maxBytes} limit); tail patterns not extracted`,
      file: rel,
      size_bytes: read.sizeBytes,
      bytes_read: read.bytesRead,
    });
  }

  return { candidates, degradedModes };
}

function extractFunctionLikeBlocks(text) {
  const blocks = [];
  const pattern = /\b(?:fun|func)\s+[A-Za-z_][A-Za-z0-9_]*[^{]*\{|\b(?:class|struct)\s+[A-Za-z_][A-Za-z0-9_]*[^{]*\{/g;
  let match = pattern.exec(text);
  while (match) {
    const start = match.index;
    blocks.push(text.slice(start, findBlockEnd(text, pattern.lastIndex - 1)).slice(0, 4000));
    match = pattern.exec(text);
  }
  return blocks.length > 0 ? blocks : [text.slice(0, 4000)];
}

function findBlockEnd(text, openIndex) {
  let depth = 0;
  for (let index = openIndex; index < text.length; index += 1) {
    if (text[index] === '{') depth += 1;
    if (text[index] === '}') {
      depth -= 1;
      if (depth === 0) return index + 1;
    }
  }
  return Math.min(text.length, openIndex + 4000);
}

function summarizeCandidates(candidates) {
  return candidates.reduce((summary, entry) => {
    summary[entry.type] = (summary[entry.type] || 0) + 1;
    return summary;
  }, {});
}

function candidate(type, file, summary) {
  return {
    type,
    file,
    summary,
    status: 'candidate',
    needs_semantic_review: true,
    evidence: [evidence('engineering_quality', file, summary)],
  };
}

if (require.main === module) {
  try {
    const options = parseCommonArgs(process.argv.slice(2));
    writeJsonOutput(extractEngineeringQuality(options), options.output, options);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  extractEngineeringQuality,
  inspectEngineeringQuality,
};
