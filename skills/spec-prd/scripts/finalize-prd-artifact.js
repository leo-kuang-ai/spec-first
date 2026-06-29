#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const {
  buildReport,
} = require('./check-prd-artifact');

// reason-code 分类法(receipt-only / checkpoint-input-scan-exempt 子集 + 分类器)的
// 单一真相源在 ./lib/reason-codes,与 check-prd-artifact.js 共同消费,消除双归属漂移。
const {
  isReceiptOnly,
  isCheckpointInputScanExempt,
} = require('./lib/reason-codes');

function parseArgs(argv) {
  const args = { target: null, inputs: [], checkOnly: false, refreshInputsHash: false, help: false, error: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      args.help = true;
      return args;
    } else if (arg === '--inputs') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) {
        args.error = 'missing value for --inputs';
        break;
      }
      args.inputs.push(...value.split(',').map((entry) => entry.trim()).filter(Boolean));
      i += 1;
    } else if (arg === '--check-only') {
      args.checkOnly = true;
    } else if (arg === '--refresh-inputs-hash') {
      args.refreshInputsHash = true;
    } else if (arg.startsWith('--')) {
      args.error = `unknown option: ${arg}`;
      break;
    } else if (!args.target) {
      args.target = arg;
    } else {
      args.error = `unexpected extra argument: ${arg}`;
      break;
    }
  }
  return args;
}

function splitLines(text) {
  return text.split(/\r?\n/);
}

function parseFrontmatterBounds(lines) {
  if (lines[0] !== '---') {
    return null;
  }
  const endIndex = lines.findIndex((line, index) => index > 0 && line === '---');
  if (endIndex === -1) {
    return null;
  }
  return { startIndex: 0, endIndex };
}

function frontmatterHasReadyStatus(text) {
  const lines = splitLines(text);
  const bounds = parseFrontmatterBounds(lines);
  if (!bounds) {
    return false;
  }
  return lines
    .slice(bounds.startIndex + 1, bounds.endIndex)
    .some((line) => /^status:\s*ready-for-planning\s*$/i.test(line.trim()));
}

function upsertFrontmatterFields(text, fields) {
  const lines = splitLines(text);
  const bounds = parseFrontmatterBounds(lines);
  if (!bounds) {
    throw new Error('frontmatter_missing');
  }

  const fieldNames = new Set(Object.keys(fields));
  const nextFrontmatter = ['---'];
  const seen = new Set();

  for (let i = 1; i < bounds.endIndex; i += 1) {
    const match = lines[i].match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match || !fieldNames.has(match[1])) {
      nextFrontmatter.push(lines[i]);
      continue;
    }
    nextFrontmatter.push(`${match[1]}: ${fields[match[1]]}`);
    seen.add(match[1]);
  }

  for (const [key, value] of Object.entries(fields)) {
    if (!seen.has(key)) {
      nextFrontmatter.push(`${key}: ${value}`);
    }
  }
  nextFrontmatter.push('---');

  return [
    ...nextFrontmatter,
    ...lines.slice(bounds.endIndex + 1),
  ].join('\n');
}

function buildFinalizeReceipt(target, text, inputs, options = {}) {
  const initialReport = buildReport(target, text, { inputs });
  const facts = initialReport.facts;
  const readyStatusClaimPresent = frontmatterHasReadyStatus(text);
  const nonReceiptBlockingReasons = facts.blocking_reason_codes.filter((reasonCode) => (
    !isReceiptOnly(reasonCode)
  ));
  // ready_receipt_absent 在写入模式不阻断 finalize(写入即补 receipt),但 check-only 预览时保留阻断
  // (声称 ready 却没 receipt 是矛盾态,预览应警告)。这避免循环依赖:模型写 status: ready-for-planning
  // 后跑 finalize 写入,旧逻辑因 ready_receipt_absent 进 blockingReasons → can_finalize=false → 永远写不了 receipt。
  const receiptBlockingReasons = facts.blocking_reason_codes.filter((reasonCode) => (
    reasonCode === 'ready_receipt_stale'
    || (options.checkOnly === true && readyStatusClaimPresent && reasonCode === 'ready_receipt_absent')
  ));
  const readyIntentPresent = facts.write_mode === 'final-prd' && facts.can_enter_spec_plan === 'yes';
  const missingReadyIntentReasons = readyIntentPresent ? [] : ['finalize_required'];
  const missingDesignInputScanReasons = readyIntentPresent
    && facts.design_source_refs_present === true
    && facts.input_scan_attempted === false
    ? ['input_refs_unavailable']
    : [];
  const blockingReasons = [...new Set([
    ...nonReceiptBlockingReasons,
    ...receiptBlockingReasons,
    ...missingReadyIntentReasons,
    ...missingDesignInputScanReasons,
  ])].sort();

  // --refresh-inputs-hash: 当 PRD 内容未变但 inputs 文件被修改导致 ready_receipt_stale 时，
  // 允许只刷新 inputs hash。条件: 唯一阻断码是 ready_receipt_stale(无结构问题)。
  const canRefreshInputsHash = options.refreshInputsHash === true
    && blockingReasons.length === 1
    && blockingReasons[0] === 'ready_receipt_stale';

  // 004:把 closeout 许可与 ready finalization 拆开。合法 checkpoint(write_mode=checkpoint-prd
  // + can_enter_spec_plan: no + 不自称 ready)是一个合法的 non-ready 出口:can_finalize=false
  // 但 should_block_closeout=false。只有真正的 ready 矛盾才阻断 closeout。`finalize_required`
  // 与 receipt-only 原因本身不阻断 checkpoint closeout——它们只意味着"还没 ready",而非"非法"。
  //
  // closeout 豁免只覆盖 checkpoint-prd,不覆盖 ask-owner-first / route-out —— 这是 intended:
  // ask-owner-first 是进行中的 grill 状态(SKILL.md:133 "keep grilling the highest-risk branch,
  // not ask one question then stop"),不是 closeout 出口;route-out 是写前 route,不产出 PRD。
  // 模型若要结束一个 ask-owner-first 运行,应先转 checkpoint-prd 保上下文,再 closeout。
  // 这避免把"还在问"误当"可以收口"。
  const isValidCheckpoint = facts.write_mode === 'checkpoint-prd'
    && facts.can_enter_spec_plan === 'no'
    && facts.ready_claim_present !== true;
  const closeoutBlockingReasons = isValidCheckpoint
    ? blockingReasons.filter((reasonCode) => (
      reasonCode !== 'finalize_required'
      && !isReceiptOnly(reasonCode)
      && !isCheckpointInputScanExempt(reasonCode)
    ))
    : (canRefreshInputsHash
      ? blockingReasons.filter((reasonCode) => reasonCode !== 'ready_receipt_stale')
      : blockingReasons);
  const shouldBlockCloseout = closeoutBlockingReasons.length > 0;

  return {
    schema_version: 'spec-prd-finalize.v1',
    target,
    status: blockingReasons.length === 0 || canRefreshInputsHash
      ? 'finalizable'
      : (isValidCheckpoint && !shouldBlockCloseout ? 'checkpoint-closeout' : 'blocked'),
    can_finalize: blockingReasons.length === 0 || canRefreshInputsHash,
    can_closeout: !shouldBlockCloseout,
    should_block_closeout: shouldBlockCloseout,
    blocking_reason_codes: blockingReasons,
    closeout_blocking_reason_codes: closeoutBlockingReasons,
    checker: {
      schema_version: initialReport.schema_version,
      finding_count: initialReport.findings.length,
      blocking_finding_count: blockingReasons.length,
      reason_codes: [...new Set(initialReport.findings.map((finding) => finding.reason_code))].sort(),
      prd_hash: facts.ready_receipt_prd_hash,
      inputs_hash: facts.ready_receipt_inputs_hash,
    },
  };
}

function finalizePrd(target, inputs, options = {}) {
  const targetPath = path.resolve(target);
  const text = fs.readFileSync(targetPath, 'utf8');
  const receipt = buildFinalizeReceipt(target, text, inputs, { refreshInputsHash: options.refreshInputsHash, checkOnly: options.checkOnly });

  if (!receipt.can_finalize || options.checkOnly) {
    return receipt;
  }

  const nextText = upsertFrontmatterFields(text, {
    status: 'ready-for-planning',
    readiness_verified_by: 'check-prd-artifact.js',
    readiness_verified_at: new Date().toISOString(),
    readiness_checker_schema: receipt.checker.schema_version,
    readiness_finding_count: String(receipt.checker.finding_count),
    readiness_blocking_count: '0',
    readiness_prd_hash: receipt.checker.prd_hash,
    readiness_inputs_hash: receipt.checker.inputs_hash,
  });

  fs.writeFileSync(targetPath, nextText.endsWith('\n') ? nextText : `${nextText}\n`, 'utf8');
  return {
    ...receipt,
    status: 'finalized',
    wrote_ready_receipt: true,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write('finalize-prd-artifact.js — write or check a machine-owned ready receipt for a PRD artifact.\n');
    process.stdout.write('usage: finalize-prd-artifact.js <target-prd-path> [--inputs <input-path>[,<input-path>...]]... [--check-only] [--refresh-inputs-hash]\n');
    process.stdout.write('  --check-only           preview the receipt without writing; exit 0 = closeout allowed, 1 = should_block_closeout, 2 = usage error.\n');
    process.stdout.write('  --refresh-inputs-hash  allow re-finalizing when only ready_receipt_stale blocks (PRD unchanged, inputs file modified).\n');
    process.exit(0);
  }
  if (args.error || !args.target) {
    if (args.error) {
      process.stderr.write(`${args.error}\n`);
    }
    process.stderr.write('usage: finalize-prd-artifact.js <target-prd-path> [--inputs <input-path>[,<input-path>...]] [--check-only]\n');
    process.exit(2);
  }

  let receipt;
  try {
    receipt = finalizePrd(args.target, args.inputs, { checkOnly: args.checkOnly, refreshInputsHash: args.refreshInputsHash });
  } catch (err) {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(2);
  }

  process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
  // 004:exit code 由 should_block_closeout 驱动,而非 can_finalize。
  // exit 0 = closeout 放行(含合法 checkpoint);exit 1 = should_block_closeout(ready 矛盾),
  //   此时 stdout JSON 必须保留 —— prd-readiness-guard 解析 blocking_reason_codes 拼 block 文案;
  // exit 2 = usage/runtime 错误(stderr)。Stop hook 同时消费 exit code 与 stdout JSON。
  process.exit(receipt.should_block_closeout ? 1 : 0);
}

if (require.main === module) {
  main();
}

module.exports = {
  buildFinalizeReceipt,
  finalizePrd,
  upsertFrontmatterFields,
};
