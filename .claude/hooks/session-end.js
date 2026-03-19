#!/usr/bin/env node

import fs from 'node:fs';

function readHookInput() {
  try {
    const raw = fs.readFileSync(0, 'utf8').trim();
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function main() {
  readHookInput();

  console.error('[Spec-First][SessionEnd] Session closed.');
  console.error(
    '[Spec-First][SessionEnd] Suggested close-out: /verify <featureId> full and spec-first metrics coverage <featureId>',
  );
  console.error(
    '[Spec-First][SessionEnd] If READY, run: spec-first stage advance <featureId>',
  );
}

try {
  main();
  process.exit(0);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[Spec-First][SessionEnd] Non-blocking error: ${message}`);
  process.exit(0);
}
