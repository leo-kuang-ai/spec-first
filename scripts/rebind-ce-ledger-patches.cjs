#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const reconciliation = require('./check-ce-upstream-reconciliation.cjs');

function parseArgs(argv) {
  const args = { ledger: null, patchDir: null };
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--ledger') args.ledger = argv[++i];
    else if (token === '--patch-dir') args.patchDir = argv[++i];
    else throw new Error(`unknown argument: ${token}`);
  }
  if (!args.ledger || !args.patchDir) throw new Error('--ledger and --patch-dir are required');
  return args;
}

function assertRegularFile(filePath) {
  const stat = fs.statSync(filePath);
  if (!stat.isFile()) throw new Error(`expected regular file: ${filePath}`);
}

function main() {
  const args = parseArgs(process.argv);
  const ledgerPath = path.resolve(args.ledger);
  const patchDir = path.resolve(args.patchDir);
  assertRegularFile(ledgerPath);
  if (!fs.statSync(patchDir).isDirectory()) throw new Error(`expected directory: ${patchDir}`);

  const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
  const baseHash = reconciliation.ledgerHash(ledger);
  const snapshot = ledger.target_source_snapshot;
  const files = fs.readdirSync(patchDir).filter((name) => name.endsWith('.json')).sort();
  if (files.length === 0) throw new Error(`no patch files found: ${patchDir}`);

  for (const name of files) {
    const filePath = path.join(patchDir, name);
    assertRegularFile(filePath);
    const patch = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const originalChanges = JSON.stringify((patch.affected_paths || []).map((item) => item.changes));
    patch.base_ledger_sha256 = baseHash;
    patch.base_target_source_snapshot = snapshot;
    patch.result_target_source_snapshot = snapshot;
    if (originalChanges !== JSON.stringify((patch.affected_paths || []).map((item) => item.changes))) {
      throw new Error(`semantic patch changes mutated: ${name}`);
    }
    fs.writeFileSync(filePath, `${JSON.stringify(patch, null, 2)}\n`);
  }

  process.stdout.write(JSON.stringify({ patch_count: files.length, base_ledger_sha256: baseHash, target_source_snapshot: snapshot }, null, 2) + '\n');
}

if (require.main === module) main();
