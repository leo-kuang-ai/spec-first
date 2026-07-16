'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { getAdapter, getSupportedPlatforms } = require('../../src/cli/adapters');
const plugin = require('../../src/cli/plugin');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const EVAL_ROOT = path.join(REPO_ROOT, 'skills/spec-plan/evals');
const MANIFEST_PATH = path.join(EVAL_ROOT, 'consumer-replay-cases.json');
const WORK_SKILL = fs.readFileSync(path.join(REPO_ROOT, 'skills/spec-work/SKILL.md'), 'utf8');
const PLAN_SKILL = fs.readFileSync(path.join(REPO_ROOT, 'skills/spec-plan/SKILL.md'), 'utf8');
const PLAN_HANDOFF = fs.readFileSync(
  path.join(REPO_ROOT, 'skills/spec-plan/references/plan-handoff.md'),
  'utf8',
);
const EXECUTION_ENGINES = fs.readFileSync(
  path.join(REPO_ROOT, 'skills/spec-work/references/execution-engines.md'),
  'utf8',
);
const REQUIRED_PRODUCT_IDS = ['A1', 'A2', 'R1', 'R2', 'R3', 'F1', 'F2', 'AE1', 'AE2'];
const IMPLEMENTATION_SECTIONS = [
  'goal-capsule',
  'product-contract',
  'planning-contract',
  'implementation-units',
  'verification-contract',
  'definition-of-done',
];
const SECTION_ID_BY_TITLE = new Map([
  ['Goal Capsule', 'goal-capsule'],
  ['Product Contract', 'product-contract'],
  ['Planning Contract', 'planning-contract'],
  ['Implementation Units', 'implementation-units'],
  ['Verification Contract', 'verification-contract'],
  ['Definition of Done', 'definition-of-done'],
]);
const SECTION_TITLE_BY_ID = new Map(
  [...SECTION_ID_BY_TITLE].map(([title, id]) => [id, title]),
);

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
  return [...contents.matchAll(/^## (.+)$/gm)]
    .map((match) => SECTION_ID_BY_TITLE.get(match[1]))
    .filter(Boolean);
}

function htmlSections(contents) {
  return [...contents.matchAll(/<section id="([a-z-]+)"/g)].map((match) => match[1]);
}

function sectionContents(contents, format, sectionId) {
  if (format === 'markdown') {
    const title = SECTION_TITLE_BY_ID.get(sectionId);
    const marker = `## ${title}\n`;
    const start = contents.indexOf(marker);
    if (start === -1) return '';
    const remainder = contents.slice(start + marker.length);
    const next = remainder.search(/^## /m);
    return next === -1 ? remainder : remainder.slice(0, next);
  }
  const match = contents.match(new RegExp(`<section id="${sectionId}">([\\s\\S]*?)</section>`));
  return match ? match[1] : '';
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
      expect(entry.mutation_policy).toBe(
        entry.format === 'markdown' ? 'markdown-write' : 'report-only',
      );
      expect(entry.handoff_eligibility).toBe(entry.readiness === 'implementation-ready');
      expect(entry.expected_route).toBe({
        'spec-plan': {
          'requirements-only': 'enrich-in-place',
          'implementation-ready': 'review-and-handoff',
        },
        'spec-work': {
          'requirements-only': 'spec-plan-enrichment',
          'implementation-ready': 'execute-section-map',
        },
        'goal-handoff': {
          'requirements-only': 'not-eligible',
          'implementation-ready': 'emit-thin-objective',
        },
      }[entry.consumer][entry.readiness]);
    }
  });

  test('pre-registers an authorization-aware fresh-source replay protocol', () => {
    expect(manifest.fresh_source_protocol).toMatchObject({
      authorization_required: true,
      not_run_reason_code: 'dispatch_authorization_missing',
      checklist: 'docs/contracts/workflows/fresh-source-eval-checklist.md',
    });
    expect(manifest.fresh_source_protocol.claim_levels).toEqual([
      'mechanical source contract',
      'fresh-source semantic judgment',
      'host invocation/loader observation',
      'field outcome',
    ]);
    expect(manifest.fresh_source_protocol.mandatory_case_ids).toEqual(
      manifest.cases.map((entry) => entry.id),
    );
    expect(manifest.fresh_source_protocol.oracles).toEqual(expect.arrayContaining([
      'artifact classification',
      'consumer route',
      'stable section selection',
      'mutation policy',
      'thin objective deletion test',
    ]));
  });

  test('replays fixture classification, readiness gates, and stable section selection', () => {
    const routeAnchors = {
      'enrich-in-place': [PLAN_SKILL, 'update that file in place'],
      'review-and-handoff': [PLAN_HANDOFF, 'Document Review'],
      'spec-plan-enrichment': [WORK_SKILL, 'Offer the exact `spec-plan <plan-path>` handoff'],
      'execute-section-map': [WORK_SKILL, 'Build a section map'],
      'not-eligible': [PLAN_HANDOFF, 'implementation-ready code plans'],
      'emit-thin-objective': [PLAN_HANDOFF, 'Build a **thin** implementation objective'],
    };

    for (const entry of manifest.cases) {
      const contents = read(entry.fixture);
      const metadata = entry.format === 'markdown'
        ? markdownMetadata(contents)
        : htmlMetadata(contents);
      const sections = entry.format === 'markdown'
        ? markdownSections(contents)
        : htmlSections(contents);

      expect(metadata.artifact_readiness).toBe(entry.readiness);
      expect(metadata.execution).toBe(entry.execution);
      expect(sections).toEqual(expect.arrayContaining(entry.required_sections));
      for (const forbidden of entry.forbidden_sections) {
        expect(sections).not.toContain(forbidden);
      }

      const [source, anchor] = routeAnchors[entry.expected_route];
      expect(source).toContain(anchor);
    }

    expect(WORK_SKILL).toContain('Progress-like values (`active`, `in_progress`, `completed`, `done`) are invalid readiness values');
    expect(WORK_SKILL).toMatch(/execution: knowledge-work.*non-code carve-out/is);
    expect(WORK_SKILL).toContain('Superseded sibling');
  });

  test('maps long Markdown and HTML plans before reading the material composition decision', () => {
    for (const [fixture, format, minimumBytes] of [
      ['fixtures/consumer-replay/implementation-ready.md', 'markdown', 3000],
      ['fixtures/consumer-replay/implementation-ready.html', 'html', 5000],
    ]) {
      const contents = read(fixture);
      expect(Buffer.byteLength(contents, 'utf8')).toBeGreaterThan(minimumBytes);
      const planning = sectionContents(contents, format, 'planning-contract');
      expect(planning).toContain('compose / thin-glue');
      expect(planning).toContain('notification policy');
      expect(planning).toContain('subscription state');
    }

    expect(WORK_SKILL).toMatch(/short plan.*read in full/is);
    expect(WORK_SKILL).toMatch(/long implementation-ready plan.*Build a section map/is);
    expect(WORK_SKILL).toMatch(/HTML.*anchor ids/is);
    expect(WORK_SKILL).toMatch(/active U-ID.*referenced R\/F\/AE\/KTD/is);
  });

  test('keeps goal objectives thin and plan-agnostic by deletion test', () => {
    const enginePrompt = EXECUTION_ENGINES.match(
      /Copyable goal-mode prompt[\s\S]*?```text\n([\s\S]*?)\n```/,
    );
    expect(enginePrompt).not.toBeNull();
    const objective = enginePrompt[1];
    expect(objective).toContain('<plan-path>');
    expect(objective).toContain('Goal Capsule');
    expect(objective).toContain('Definition of Done');
    expect(objective).toContain('Verification Contract');
    expect(PLAN_HANDOFF).toContain('Deletion test');
    for (const copiedDetail of [
      'notification preference',
      'compose / thin-glue',
      'R1',
      'U1',
      'npx jest',
      'fixtures/consumer-replay',
    ]) {
      expect(objective).not.toContain(copiedDetail);
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
