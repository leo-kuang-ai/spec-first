'use strict';

// Drift detection for agent/persona templates replicated across multiple skills.
//
// Background: 11 template families (25 files, ~3536 lines) were identified in the
// Phase 1A duplicate-elimination audit. Precise measurement revealed three tiers:
//   - Tier A (8 families): single-line variant, shared skeleton
//   - Tier B (2 families): single-line variant + localized semantic enhancement
//   - Tier C (1 family): multi-hunk rewrite, different invocation contracts
//
// This test prevents silent drift without introducing parameterized template machinery.
// See docs/solutions/architecture-patterns/agent-persona-template-drift-detection-2026-08-21.md
// for full design rationale.

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

// Tier A: 8 families with exactly one variant line each.
// Test strategy: exclude the known variant line (matched by regex), hash the skeleton,
// assert all copies within a family share the same skeleton hash.
const TIER_A_FAMILIES = {
  'slack-researcher.md': [
    'skills/spec-brainstorm/references/agents',
    'skills/spec-ideate/references/agents',
    'skills/spec-plan/references/agents',
  ],
  'learnings-researcher.md': [
    'skills/spec-code-review/references/personas',
    'skills/spec-ideate/references/agents',
    'skills/spec-optimize/references/agents',
    'skills/spec-plan/references/agents',
  ],
  'repo-research-analyst.md': [
    'skills/spec-optimize/references/agents',
    'skills/spec-plan/references/agents',
  ],
  'data-integrity-guardian.md': [
    'skills/spec-compound/references/agents',
    'skills/spec-plan/references/agents',
  ],
  'framework-docs-researcher.md': [
    'skills/spec-compound/references/agents',
    'skills/spec-plan/references/agents',
  ],
  'performance-oracle.md': [
    'skills/spec-compound/references/agents',
    'skills/spec-plan/references/agents',
  ],
  'security-sentinel.md': [
    'skills/spec-compound/references/agents',
    'skills/spec-plan/references/agents',
  ],
  'web-researcher.md': [
    'skills/spec-ideate/references/agents',
    'skills/spec-plan/references/agents',
  ],
};

// Tier B/C: 3 families whose variants carry real semantic divergence (localized
// enhancements or completely different invocation contracts). Test strategy: freeze
// full-file SHA-256 for each copy, force human confirmation on any change.
const TIER_BC_FAMILIES = {
  'best-practices-researcher.md': {
    'skills/spec-compound/references/agents': 'be205f2e10c5e153bd5db293e3e41885414d0e75c62a8026b5857bee983c9852',
    'skills/spec-plan/references/agents': '79dceea93c937dcbefd4d9c785d667f3ca03c4c79df8068959c5281b04276af0',
  },
  'pattern-recognition-specialist.md': {
    'skills/spec-compound/references/agents': '0d73822ccea06dd3e9a25e9e21e1908377cb9c5364b678b940fefef7f84c9580',
    'skills/spec-plan/references/agents': 'b6315cb0deec7c85346b88d3b30b9547feb36e1a8c058b4248f91e9c326b6ddb',
  },
  'deployment-verification-agent.md': {
    'skills/spec-code-review/references/personas': '04d8a5e5dad6c84955ab841aa2e2362f58a6b1f2111e88caaa4ca96ca2b65e8a',
    'skills/spec-plan/references/agents': 'e90eaab26736715c6ae4eaebf3aa05331f1c371b2dbb546ff057643377d07ea6',
  },
};

// The variant line in Tier A files: the "For X invocations, convert ... into Y" sentence
// under "## Invocation Contract". This pattern reliably identifies it without hardcoding
// line numbers, so the test survives file edits that insert/remove lines elsewhere.
const VARIANT_LINE_PATTERN = /^For .*invocations?,/;

function computeSkeletonHash(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const skeleton = lines.filter((line) => !VARIANT_LINE_PATTERN.test(line)).join('\n');
  return crypto.createHash('sha256').update(skeleton, 'utf8').digest('hex');
}

function computeFullHash(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

describe('agent/persona template drift detection', () => {
  describe('Tier A: shared skeleton with single-line variant', () => {
    test.each(Object.keys(TIER_A_FAMILIES))(
      '%s: all copies share the same skeleton after excluding the variant line',
      (templateName) => {
        const dirs = TIER_A_FAMILIES[templateName];
        const skeletonHashes = dirs.map((dir) => {
          const filePath = path.join(dir, templateName);
          return { dir, hash: computeSkeletonHash(filePath) };
        });

        const uniqueHashes = new Set(skeletonHashes.map((entry) => entry.hash));

        expect(uniqueHashes.size).toBe(1);
        // Additional sanity: each file should have exactly one variant line
        for (const dir of dirs) {
          const filePath = path.join(dir, templateName);
          const content = fs.readFileSync(filePath, 'utf8');
          const variantLineCount = content.split('\n').filter((line) => VARIANT_LINE_PATTERN.test(line)).length;
          expect(variantLineCount).toBe(1);
        }
      },
    );
  });

  describe('Tier B/C: frozen full-file hashes (semantic divergence)', () => {
    test.each(Object.keys(TIER_BC_FAMILIES))(
      '%s: each copy matches its frozen SHA-256',
      (templateName) => {
        const expectedHashes = TIER_BC_FAMILIES[templateName];
        for (const [dir, expectedHash] of Object.entries(expectedHashes)) {
          const filePath = path.join(dir, templateName);
          const actualHash = computeFullHash(filePath);
          expect(actualHash).toBe(expectedHash);
        }
      },
    );
  });
});
