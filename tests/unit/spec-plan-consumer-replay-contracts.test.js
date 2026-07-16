'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { getAdapter, getSupportedPlatforms } = require('../../src/cli/adapters');
const plugin = require('../../src/cli/plugin');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const EVAL_ROOT = path.join(REPO_ROOT, 'skills/spec-plan/evals');
const MANIFEST_PATH = path.join(EVAL_ROOT, 'consumer-replay-cases.json');
const REQUIRED_PRODUCT_IDS = ['A1', 'A2', 'R1', 'R2', 'R3', 'F1', 'F2', 'AE1', 'AE2'];
const IMPLEMENTATION_SECTIONS = [
  'goal-capsule',
  'product-contract',
  'planning-contract',
  'implementation-units',
  'verification-contract',
  'definition-of-done',
];

function read(relativePath) {
  return fs.readFileSync(path.join(EVAL_ROOT, relativePath), 'utf8');
}

function readManifest() {
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
}

function markdownMetadata(contents) {
  const frontmatter = contents.match(/^---\n([\s\S]*?)\n---\n/);
  if (!frontmatter) throw new Error('missing Markdown frontmatter');
  return Object.fromEntries(frontmatter[1].split('\n').map((line) => {
    const separator = line.indexOf(':');
    if (separator === -1) return [line.trim(), ''];
    return [
      line.slice(0, separator).trim(),
      line.slice(separator + 1).trim().replace(/^"|"$/g, ''),
    ];
  }));
}

function htmlMetadata(contents) {
  const metadata = {};
  for (const key of ['artifact_contract', 'artifact_readiness', 'product_contract_source', 'execution']) {
    const match = contents.match(new RegExp(`<dt>${key}</dt>\\s*<dd>([^<]+)</dd>`));
    if (!match) throw new Error(`missing visible HTML metadata: ${key}`);
    metadata[key] = match[1].trim();
  }
  return metadata;
}

function productIds(contents) {
  return [...new Set(contents.match(/\b(?:A|R|F|AE)\d+\b/g) || [])].sort();
}

function markdownSections(contents) {
  const headingToId = new Map([
    ['Goal Capsule', 'goal-capsule'],
    ['Product Contract', 'product-contract'],
    ['Planning Contract', 'planning-contract'],
    ['Implementation Units', 'implementation-units'],
    ['Verification Contract', 'verification-contract'],
    ['Definition of Done', 'definition-of-done'],
  ]);
  return [...contents.matchAll(/^## (.+)$/gm)]
    .map((match) => headingToId.get(match[1]))
    .filter(Boolean);
}

function htmlSections(contents) {
  return [...contents.matchAll(/<section id="([a-z-]+)"/g)].map((match) => match[1]);
}

describe('spec-plan unified-plan consumer replay fixtures', () => {
  const manifest = readManifest();

  test('defines a source-owned manifest with complete consumer coverage', () => {
    expect(manifest.schema_version).toBe('spec-first.spec-plan-consumer-replay-cases.v1');
    expect(manifest.skill).toBe('spec-plan');
    expect(manifest.source_ref_authority).toBe('source');
    expect(manifest.source_refs).toEqual(expect.arrayContaining([
      'skills/spec-plan/SKILL.md',
      'skills/spec-plan/references/plan-sections.md',
      'skills/spec-plan/references/plan-handoff.md',
      'skills/spec-work/SKILL.md',
    ]));

    const ids = manifest.cases.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(manifest.cases).toHaveLength(12);

    for (const fixture of [
      'fixtures/consumer-replay/requirements-only.md',
      'fixtures/consumer-replay/implementation-ready.md',
      'fixtures/consumer-replay/requirements-only.html',
      'fixtures/consumer-replay/implementation-ready.html',
    ]) {
      const cases = manifest.cases.filter((entry) => entry.fixture === fixture);
      expect(cases.map((entry) => entry.consumer).sort()).toEqual([
        'goal-handoff',
        'spec-plan',
        'spec-work',
      ]);
      expect(fs.existsSync(path.join(EVAL_ROOT, fixture))).toBe(true);
    }

    for (const entry of manifest.cases) {
      expect(['markdown', 'html']).toContain(entry.format);
      expect(['requirements-only', 'implementation-ready']).toContain(entry.readiness);
      expect(entry.execution).toBe('code');
      expect(entry.coverage_tags).toEqual(expect.arrayContaining(['consumer-replay']));
      expect(entry.required_sections.length).toBeGreaterThan(0);
      expect(entry.missing_evidence).toEqual(expect.arrayContaining([
        'fresh-source semantic judgment',
        'host invocation/loader observation',
        'field outcome',
      ]));
      expect(entry.evidence_level).toBe('mechanical source contract');
      expect(entry.product_contract_ids.slice().sort()).toEqual(REQUIRED_PRODUCT_IDS.slice().sort());
      expect(['markdown-write', 'report-only']).toContain(entry.mutation_policy);
      expect(typeof entry.handoff_eligibility).toBe('boolean');
    }
  });

  test.each([
    ['fixtures/consumer-replay/requirements-only.md', 'markdown', 'requirements-only'],
    ['fixtures/consumer-replay/implementation-ready.md', 'markdown', 'implementation-ready'],
    ['fixtures/consumer-replay/requirements-only.html', 'html', 'requirements-only'],
    ['fixtures/consumer-replay/implementation-ready.html', 'html', 'implementation-ready'],
  ])('%s carries valid metadata and readiness-shaped sections', (fixture, format, readiness) => {
    const contents = read(fixture);
    const metadata = format === 'markdown' ? markdownMetadata(contents) : htmlMetadata(contents);
    const sections = format === 'markdown' ? markdownSections(contents) : htmlSections(contents);

    expect(metadata).toMatchObject({
      artifact_contract: 'spec-unified-plan/v1',
      artifact_readiness: readiness,
      product_contract_source: 'spec-plan-consumer-replay-fixture',
      execution: 'code',
    });
    expect(productIds(contents)).toEqual(expect.arrayContaining(REQUIRED_PRODUCT_IDS));
    expect(sections).toEqual(expect.arrayContaining(['goal-capsule', 'product-contract']));

    if (readiness === 'requirements-only') {
      expect(sections).not.toEqual(expect.arrayContaining([
        'planning-contract',
        'implementation-units',
        'verification-contract',
        'definition-of-done',
      ]));
    } else {
      expect(sections).toEqual(expect.arrayContaining(IMPLEMENTATION_SECTIONS));
      expect(contents).toContain('U1. Compose notification delivery');
      expect(contents).toContain('compose / thin-glue');
      expect(contents).toContain('contract translation');
      expect(contents).toContain('sequencing/orchestration');
      expect(contents).toContain('failure/degradation routing');
      expect(contents).toContain('observability/evidence aggregation');
      expect(contents).toContain('notification policy');
      expect(contents).toContain('subscription state');
    }
  });

  test('keeps Product Contract IDs and semantics aligned across readiness and formats', () => {
    const fixtures = [
      read('fixtures/consumer-replay/requirements-only.md'),
      read('fixtures/consumer-replay/implementation-ready.md'),
      read('fixtures/consumer-replay/requirements-only.html'),
      read('fixtures/consumer-replay/implementation-ready.html'),
    ];

    for (const contents of fixtures) {
      expect(productIds(contents)).toEqual(expect.arrayContaining(REQUIRED_PRODUCT_IDS));
      for (const semanticAnchor of [
        'notification preference',
        'duplicate delivery',
        'delivery evidence',
        'existing event intake',
      ]) {
        expect(contents).toContain(semanticAnchor);
      }
    }
  });

  test('keeps consumer replay fixtures out of every generated host projection', () => {
    for (const platform of getSupportedPlatforms()) {
      const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), `spec-plan-consumer-replay-${platform}-`));
      try {
        const adapter = getAdapter(platform);
        const { plan } = plugin.planBundledAssetSync(projectRoot, adapter);
        const operationPaths = plan.operations.map((operation) => operation.path);
        expect(operationPaths.some((operationPath) =>
          operationPath.includes('/spec-plan/evals/')
        )).toBe(false);
      } finally {
        fs.rmSync(projectRoot, { recursive: true, force: true });
      }
    }
  });
});
