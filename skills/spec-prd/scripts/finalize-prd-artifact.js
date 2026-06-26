#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const {
  buildReport,
} = require('./check-prd-artifact');

const RECEIPT_ONLY_REASONS = new Set([
  'ready_receipt_absent',
  'ready_receipt_stale',
]);

// checkpoint closeout 额外豁免:input-side 核算信号只在 PRD 声称 ready 时才需确证;
// 一个还没 ready 的 checkpoint 允许 input 扫描降级(仍在 grill 未读全 inputs)。
const CHECKPOINT_INPUT_SCAN_EXEMPT = new Set([
  'input_scan_degraded',
  'input_refs_unavailable',
]);

function parseArgs(argv) {
  const args = { target: null, inputs: [], checkOnly: false, error: null };
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
    } else if (arg === '--check-only') {
      args.checkOnly = true;
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

function buildFinalizeReceipt(target, text, inputs) {
  const initialReport = buildReport(target, text, { inputs });
  const facts = initialReport.facts;
  const readyStatusClaimPresent = frontmatterHasReadyStatus(text);
  const nonReceiptBlockingReasons = facts.blocking_reason_codes.filter((reasonCode) => (
    !RECEIPT_ONLY_REASONS.has(reasonCode)
  ));
  const receiptBlockingReasons = facts.blocking_reason_codes.filter((reasonCode) => (
    reasonCode === 'ready_receipt_stale'
      || (readyStatusClaimPresent && reasonCode === 'ready_receipt_absent')
  ));
  const readyIntentPresent = facts.write_mode === 'final-prd' && facts.can_enter_spec_plan === 'yes';
  const missingReadyIntentReasons = readyIntentPresent ? [] : ['finalize_required'];
  const blockingReasons = [...new Set([
    ...nonReceiptBlockingReasons,
    ...receiptBlockingReasons,
    ...missingReadyIntentReasons,
  ])].sort();

  // 004:把 closeout 许可与 ready finalization 拆开。合法 checkpoint(write_mode=checkpoint-prd
  // + can_enter_spec_plan: no + 不自称 ready)是一个合法的 non-ready 出口:can_finalize=false
  // 但 should_block_closeout=false。只有真正的 ready 矛盾才阻断 closeout。`finalize_required`
  // 与 receipt-only 原因本身不阻断 checkpoint closeout——它们只意味着"还没 ready",而非"非法"。
  const isValidCheckpoint = facts.write_mode === 'checkpoint-prd'
    && facts.can_enter_spec_plan === 'no'
    && facts.ready_claim_present !== true;
  const closeoutBlockingReasons = isValidCheckpoint
    ? blockingReasons.filter((reasonCode) => (
      reasonCode !== 'finalize_required'
      && !RECEIPT_ONLY_REASONS.has(reasonCode)
      && !CHECKPOINT_INPUT_SCAN_EXEMPT.has(reasonCode)
    ))
    : blockingReasons;
  const shouldBlockCloseout = closeoutBlockingReasons.length > 0;

  return {
    schema_version: 'spec-prd-finalize.v1',
    target,
    status: blockingReasons.length === 0
      ? 'finalizable'
      : (isValidCheckpoint && !shouldBlockCloseout ? 'checkpoint-closeout' : 'blocked'),
    can_finalize: blockingReasons.length === 0,
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
  const receipt = buildFinalizeReceipt(target, text, inputs);

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
  if (args.error || !args.target) {
    if (args.error) {
      process.stderr.write(`${args.error}\n`);
    }
    process.stderr.write('usage: finalize-prd-artifact.js <target-prd-path> [--inputs <input-path>[,<input-path>...]] [--check-only]\n');
    process.exit(2);
  }

  let receipt;
  try {
    receipt = finalizePrd(args.target, args.inputs, { checkOnly: args.checkOnly });
  } catch (err) {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(2);
  }

  process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
  // 004:exit code 由 should_block_closeout 驱动,而非 can_finalize。合法 checkpoint(non-ready
  // 但允许 closeout)exit 0;只有 ready 矛盾 exit 1。Stop hook 只消费 exit code,不解析 JSON。
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
