#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

function readHookInput() {
  try {
    const raw = fs.readFileSync(0, 'utf8').trim();
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function countFeatureStates(specsDir) {
  if (!fs.existsSync(specsDir)) return 0;

  let count = 0;
  const entries = fs.readdirSync(specsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const stageFile = path.join(specsDir, entry.name, 'stage-state.json');
    if (fs.existsSync(stageFile)) count += 1;
  }
  return count;
}

function main() {
  readHookInput();

  const cwd = process.cwd();
  const specsDir = path.join(cwd, 'specs');
  const featureCount = countFeatureStates(specsDir);

  console.error('[Spec-First][SessionStart] Ready.');
  console.error(
    `[Spec-First][SessionStart] Detected ${featureCount} feature(s) with stage state under ./specs`,
  );
  console.error(
    '[Spec-First][SessionStart] Suggested next step: /plan <featureId> "<task>" or spec-first stage current <featureId>',
  );
}

try {
  main();
  process.exit(0);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[Spec-First][SessionStart] Non-blocking error: ${message}`);
  process.exit(0);
}
