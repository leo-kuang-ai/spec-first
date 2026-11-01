'use strict';

// Drift detection for agent/persona templates replicated across multiple skills.
//
// Background: 11 template families (25 files, ~3536 lines) were identified in the
// Phase 1A duplicate-elimination audit. Precise measurement revealed three tiers:
//   - Tier A (7 families): single-line variant, shared skeleton
//   - Tier B (3 families): single-line variant + localized semantic enhancement
//   - Tier C (1 family): multi-hunk rewrite, different invocation contracts
//
// This test prevents silent drift without introducing parameterized template machinery.
// See docs/solutions/architecture-patterns/agent-persona-template-drift-detection-2026-08-21.md
// for full design rationale.

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

// Tier A: 7 families with exactly one variant line each.
// Test strategy: exclude the known variant line (matched by regex), hash the skeleton,
// assert all copies within a family share the same skeleton hash.
const TIER_A_FAMILIES = {
  'slack-researcher.md': [
    'skills/spec-brainstorm/references/agents',
    'skills/spec-ideate/references/agents',
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

// Tier B/C: 4 families whose variants carry real semantic divergence (localized
// enhancements or completely different invocation contracts). Test strategy: freeze
// full-file SHA-256 for each copy, require explicit source review on any change.
const TIER_BC_FAMILIES = {
  // Review has additional evidence applicability rules; preserve its intentional variant.
  'learnings-researcher.md': {
    'skills/spec-code-review/references/personas': 'db367e51a73c52018dbe852be65bf9313bf3db7f777c5c49c7fc36883e859ca3',
    'skills/spec-ideate/references/agents': '7c355f1163ef167efd7b724f7d52b4defde37fab3b774c648024a63013272085',
    'skills/spec-optimize/references/agents': 'd0161176aec31d84a307c9b4b528393c037a57445e76957d152e541de3b8c982',
    'skills/spec-plan/references/agents': 'fc6f523cc5c597c49e007b88de3dd0f465bfcef88f6f9fe7070032f1f2caf399',
  },
  'best-practices-researcher.md': {
    'skills/spec-compound/references/agents': '19c48a8741546888efae2bfd5798115eb5cdc1d2c4c098c9cd696017effef22c',
    'skills/spec-plan/references/agents': '85665097bdb450602808d875125bd80aae838a6231934bc0d0998ef0076ed80d',
  },
  'pattern-recognition-specialist.md': {
    'skills/spec-compound/references/agents': '0d73822ccea06dd3e9a25e9e21e1908377cb9c5364b678b940fefef7f84c9580',
    'skills/spec-plan/references/agents': 'b6315cb0deec7c85346b88d3b30b9547feb36e1a8c058b4248f91e9c326b6ddb',
  },
  'deployment-verification-agent.md': {
    'skills/spec-code-review/references/personas': 'a85fae19283d7cb82d2d4a34c5fd286d2bb10d5e632b1642be9d3757fef7ad23',
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
