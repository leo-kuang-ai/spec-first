#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

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

function startStageViewer(cwd) {
  const bootstrapPath = path.join(cwd, 'scripts', 'stage-viewer', 'bootstrap.js');
  if (!fs.existsSync(bootstrapPath)) return null;

  const result = spawnSync(
    process.execPath,
    [bootstrapPath, '--source', 'claude', '--open', '--print-url'],
    {
      cwd,
      encoding: 'utf8',
      env: {
        ...process.env,
        SPEC_FIRST_VIEWER_AUTO_OPEN: process.env.SPEC_FIRST_VIEWER_AUTO_OPEN ?? '1',
      },
    },
  );

  if (result.error) return null;
  const url = String(result.stdout ?? '').trim();
  return url.startsWith('http://') || url.startsWith('https://') ? url : null;
}

function main() {
  readHookInput();

  const cwd = process.cwd();
  const specsDir = path.join(cwd, 'specs');
  const featureCount = countFeatureStates(specsDir);
  const viewerUrl = startStageViewer(cwd);

  console.error('[Spec-First][SessionStart] Ready.');
  console.error(
    `[Spec-First][SessionStart] Detected ${featureCount} feature(s) with stage state under ./specs`,
  );
  if (viewerUrl) {
    console.error(`[Spec-First][SessionStart] Viewer: auto-start at ${viewerUrl}`);
  } else {
    console.error('[Spec-First][SessionStart] Viewer: skipped (not a spec-first project or bootstrap unavailable).');
  }
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
