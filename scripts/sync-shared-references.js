#!/usr/bin/env node
/**
 * Sync shared references to per-skill copies for self-contained distribution.
 *
 * Usage:
 *   node scripts/sync-shared-references.js [--check]
 *
 * --check: verify copies match source (exit 1 if drift detected), don't write
 *
 * Shared references live in skills/_shared/references/*.md and are copied to
 * individual skills' references/ dirs. Each skill remains self-contained for
 * independent distribution (skills-lock.json), but maintenance happens in one place.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const REPO_ROOT = path.resolve(__dirname, '..');
const SHARED_DIR = path.join(REPO_ROOT, 'skills', '_shared', 'references');

// Map: shared source -> per-skill copies
const SYNC_MAP = {
  'html-rendering.md': [
    'skills/spec-plan/references/html-rendering.md',
    'skills/spec-ideate/references/html-rendering.md',
    'skills/spec-brainstorm/references/html-rendering.md',
  ],
  'markdown-rendering.md': [
    'skills/spec-plan/references/markdown-rendering.md',
    'skills/spec-ideate/references/markdown-rendering.md',
    'skills/spec-brainstorm/references/markdown-rendering.md',
  ],
  'concepts-vocabulary.md': [
    'skills/spec-compound/references/concepts-vocabulary.md',
    'skills/spec-compound-refresh/references/concepts-vocabulary.md',
  ],
  'settled-decisions.md': [
    'skills/spec-plan/references/settled-decisions.md',
    'skills/spec-brainstorm/references/settled-decisions.md',
  ],
  'tracker-defer.md': [
    'skills/spec-work/references/tracker-defer.md',
    'skills/spec-lfg/references/tracker-defer.md',
  ],
  'yaml-schema.md': [
    'skills/spec-compound/references/yaml-schema.md',
    'skills/spec-compound-refresh/references/yaml-schema.md',
  ],
};

function sha256(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

function main() {
  const checkOnly = process.argv.includes('--check');
  let driftDetected = false;

  for (const [sharedName, targets] of Object.entries(SYNC_MAP)) {
    const sourcePath = path.join(SHARED_DIR, sharedName);
    if (!fs.existsSync(sourcePath)) {
      console.error(`Missing shared source: ${sourcePath}`);
      process.exit(1);
    }

    const sourceContent = fs.readFileSync(sourcePath, 'utf8');
    const sourceHash = sha256(sourceContent);

    for (const relTarget of targets) {
      const targetPath = path.join(REPO_ROOT, relTarget);

      if (!fs.existsSync(targetPath)) {
        if (checkOnly) {
          console.error(`Missing copy: ${relTarget}`);
          driftDetected = true;
          continue;
        }
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      } else {
        const targetContent = fs.readFileSync(targetPath, 'utf8');
        const targetHash = sha256(targetContent);
        if (targetHash === sourceHash) {
          console.log(`OK   ${relTarget}`);
          continue;
        }
        if (checkOnly) {
          console.error(`DRIFT ${relTarget} (expected ${sourceHash.slice(0, 8)}, got ${targetHash.slice(0, 8)})`);
          driftDetected = true;
          continue;
        }
      }

      fs.writeFileSync(targetPath, sourceContent, 'utf8');
      console.log(`SYNC ${relTarget} <- _shared/${sharedName}`);
    }
  }

  if (checkOnly && driftDetected) {
    console.error('\nDrift detected. Run without --check to sync.');
    process.exit(1);
  }

  if (!checkOnly) {
    console.log('\nAll shared references synced.');
  }
}

main();
