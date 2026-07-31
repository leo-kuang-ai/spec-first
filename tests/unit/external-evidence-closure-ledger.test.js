const fs = require('fs');
const path = require('path');
const { getAdapter } = require('../../src/cli/adapters');
const { buildRuntimeCapabilityCatalog } = require('../../scripts/generate-runtime-capability-catalog');

const ROOT = path.resolve(__dirname, '../..');
const LEDGER_PATH = path.join(
  ROOT,
  'docs/validation/2026-07-30-external-evidence-closure-ledger.md',
);

const REQUIRED_FIELDS = [
  'track',
  'subclaim',
  'status',
  'current_claim',
  'claim_ceiling',
  'source_identity',
  'target_identity',
  'authorization_ref',
  'evidence_refs',
  'reason_code',
  'limitations',
  'owner',
  're_evaluate_when',
  'closure_path',
  'freshness',
  'invalidated_by',
  'cleanup',
  'rollback',
];

const VALID_STATUSES = new Set([
  'confirmed',
  'blocked-external-authorization',
  'degraded-by-design',
  'failed',
]);

function parseEntries(markdown) {
  return markdown
    .split(/^### (?=E\d+\b)/m)
    .slice(1)
    .map((section) => {
      const [heading, ...lines] = section.split('\n');
      const fields = {};
      for (const line of lines) {
        const match = line.match(/^- \*\*([a-z_]+):\*\*\s*(.+)$/);
        if (match) fields[match[1]] = match[2].trim();
      }
      return { heading: heading.trim(), fields };
    });
}

describe('external evidence closure ledger', () => {
  test('covers every planned track with complete, honest closeout fields', () => {
    const markdown = fs.readFileSync(LEDGER_PATH, 'utf8');
    const entries = parseEntries(markdown);

    expect(entries.length).toBeGreaterThanOrEqual(18);
    for (const entry of entries) {
      expect(entry.heading).toMatch(/^E\d+\s+—\s+/);
      for (const field of REQUIRED_FIELDS) {
        expect(entry.fields[field]).toBeDefined();
        expect(entry.fields[field]).not.toMatch(/^(?:TBD|TODO|unknown|none)$/i);
      }
      expect(VALID_STATUSES.has(entry.fields.status.replaceAll('`', ''))).toBe(true);
      if (entry.fields.status.replaceAll('`', '') === 'confirmed') {
        expect(entry.fields.evidence_refs).toMatch(/live|journey|receipt/i);
      }
    }

    const tracks = new Set(entries.map(({ fields }) => fields.track.replaceAll('`', '')));
    expect(tracks).toEqual(new Set([
      'proof-v3',
      'github-pr-watch',
      'optimize-measurement-only',
      'cursor',
      'opencode',
      'qoder',
      'kiro',
    ]));
  });

  test('does not persist common credential or authorization header shapes', () => {
    const markdown = fs.readFileSync(LEDGER_PATH, 'utf8');
    const forbidden = [
      /Authorization:\s*Bearer\s+\S+/i,
      /https?:\/\/[^\s/@:]+:[^\s/@]+@/i,
      /\bgh[opusr]_[A-Za-z0-9_]{20,}\b/,
      /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
      /\bsk-[A-Za-z0-9_-]{20,}\b/,
      /ownerSecret\s*[:=]\s*["']?[A-Za-z0-9_-]{12,}/i,
    ];

    for (const pattern of forbidden) {
      expect(markdown).not.toMatch(pattern);
    }
  });

  test('keeps host claims and the generated catalog below unverified field ceilings', () => {
    const opencode = getAdapter('opencode');
    expect(opencode.supportState).toBe('preview');
    expect(opencode.evidenceClaim).toBe('generated_runtime_preview');
    expect(opencode.testedVersions).toEqual([]);

    const catalogPath = path.join(ROOT, 'docs/catalog/runtime-capabilities.md');
    const catalog = fs.readFileSync(catalogPath, 'utf8');
    expect(catalog).toBe(buildRuntimeCapabilityCatalog());
    expect(catalog).toContain('| Cursor support status | generated_runtime_preview |');
    expect(catalog).toContain('| OpenCode evidence claim | generated_runtime_preview |');
  });
});
