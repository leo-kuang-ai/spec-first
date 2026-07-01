'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ClaudeAdapter = require('../../src/cli/adapters/claude');
const { planBundledAssetSync } = require('../../src/cli/plugin');

const SKILL_PATH = path.join(__dirname, '..', '..', 'skills', 'spec-compound', 'SKILL.md');
const COMPOUND_REFRESH_SKILL_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-compound-refresh',
  'SKILL.md',
);
const COMPOUND_REFRESH_PER_ACTION_FLOWS_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-compound-refresh',
  'references',
  'per-action-flows.md',
);
const COMPOUND_CONCEPTS_REFERENCE_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-compound',
  'references',
  'concepts-vocabulary.md',
);
const COMPOUND_DOMAIN_MODEL_REFERENCE_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-compound',
  'references',
  'domain-model-capture.md',
);
const COMPOUND_REFRESH_CONCEPTS_REFERENCE_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-compound-refresh',
  'references',
  'concepts-vocabulary.md',
);
const COMPOUND_RESOLUTION_TEMPLATE_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-compound',
  'assets',
  'resolution-template.md',
);
const COMPOUND_REFRESH_RESOLUTION_TEMPLATE_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-compound-refresh',
  'assets',
  'resolution-template.md',
);
const COMPOUND_SCHEMA_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-compound',
  'references',
  'schema.yaml',
);
const COMPOUND_REFRESH_SCHEMA_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-compound-refresh',
  'references',
  'schema.yaml',
);
const COMPOUND_YAML_SCHEMA_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-compound',
  'references',
  'yaml-schema.md',
);
const COMPOUND_EVAL_EXAMPLES_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-compound',
  'evals',
  'examples.json',
);
const COMPOUND_REFRESH_YAML_SCHEMA_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-compound-refresh',
  'references',
  'yaml-schema.md',
);

function plannedRuntimeContent(adapter, targetPath) {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-compound-runtime-'));

  try {
    const { plan } = planBundledAssetSync(projectRoot, adapter);
    const operation = plan.operations.find((entry) => entry.path === targetPath);
    if (!operation) {
      throw new Error(`Missing planned runtime operation for ${targetPath}`);
    }
    return operation.contents;
  } finally {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  }
}

describe('spec-compound host entrypoint contract', () => {
  test('usage and follow-up guidance use current-host entrypoint wording', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('current host\'s compound entrypoint');
    expect(text).toContain('current host\'s compound entrypoint with brief context');
    expect(text).toContain('current host\'s compound entrypoint');
    expect(text).not.toContain('Use /spec:compound [context]');
    expect(text).not.toContain('re-run /spec:compound in a fresh session');
    expect(text).not.toContain('- `/spec:plan` - Planning workflow');
    expect(text).not.toContain('/spec:compound` on Claude Code');
    expect(text).not.toContain('$spec-compound` on Codex');
    expect(text).not.toContain('/spec:plan` on Claude Code');
    expect(text).not.toContain('$spec-plan` on Codex');
  });

  test('compound and refresh use distilled replay refs without creating a replay index', () => {
    const compound = fs.readFileSync(SKILL_PATH, 'utf8');
    const refresh = fs.readFileSync(COMPOUND_REFRESH_SKILL_PATH, 'utf8');

    for (const text of [compound, refresh]) {
      expect(text).toContain('Distilled Replay References');
      expect(text).toContain('prefer distilled replay refs over');
      expect(text).toContain('the accepted or rejected');
      expect(text).toContain('evidence path');
      expect(text).toContain('must not become workflow status');
      expect(text).toContain('Do not build a durable replay index');
      expect(text).toContain('full transcripts, raw tool output');
    }

    expect(compound).toContain('the reusable lesson delta and evidence paths');
    expect(compound).toContain('external-tool or broad impact evidence');
    expect(compound).toContain('source-confirmed by changed source, tests, logs, contracts, or review findings');
    expect(refresh).toContain('External-tool/session evidence can focus which files or relationships to inspect');
    expect(refresh).toContain('raw external-tool output and raw diff hunks');
    expect(refresh).toContain('the specific refresh implication');
  });

  test('compound maintains CONCEPTS.md only as existing advisory vocabulary', () => {
    const skill = fs.readFileSync(SKILL_PATH, 'utf8');
    const reference = fs.readFileSync(COMPOUND_CONCEPTS_REFERENCE_PATH, 'utf8');

    expect(skill).toContain('references/concepts-vocabulary.md');
    expect(skill).toContain('### Phase 2.4: Domain Model And Vocabulary Capture');
    expect(skill).toContain('If `CONCEPTS.md` exists, read `references/concepts-vocabulary.md`');
    expect(skill).toContain('If `CONCEPTS.md` does not exist, do not create or bootstrap it from `spec-compound`');
    expect(skill).toContain('CONCEPTS.md: not present; no vocabulary maintenance applied');
    expect(skill).toContain('CONCEPTS.md: <updated — N added/refined | scanned, no qualifying terms | not present; no vocabulary maintenance applied>');
    expect(skill).toContain('the primary output remains one `docs/solutions/` learning document');
    expect(skill).toContain('Domain model and vocabulary capture is advisory maintenance');
    expect(skill).toContain('Do not run a repo-wide concept sweep');
    expect(skill).toContain('CONCEPTS.md: <updated');
    expect(skill).toContain('One primary solution doc is written; optional maintenance writes');
    expect(skill).toContain('If this compound run added or refined entries in an existing repo-root `CONCEPTS.md`');
    expect(skill).toContain('when the Phase 2.4 result was only `scanned, no qualifying terms`');
    expect(skill).toContain('do not create instruction-file churn for a no-op vocabulary scan');
    expect(skill).not.toContain('One file written.');
    expect(skill).not.toContain('mode:headless');
    expect(skill).not.toContain('ce-compound');

    expect(reference).toContain('repo-local advisory vocabulary');
    expect(reference).toContain('not a PRD, ADR, workflow contract, product roadmap, setup requirement, or source-of-truth override');
    expect(reference).toContain('vocabulary maintenance is update-only');
    expect(reference).toContain('do not create or bootstrap it during learning capture');
    expect(reference).toContain('A downstream project does not need this file for `spec-first` to work');
    expect(reference).toContain('This reference owns only `CONCEPTS.md` inclusion and refinement');
    expect(reference).toContain('Broader domain-model signals');
    expect(reference).toContain('Do not run a repo-wide concept sweep from compound');
    expect(reference).not.toContain('ce-compound');
    expect(reference).not.toContain('Compound Engineering');
  });

  test('compound adapts domain modeling without default context or ADR writes', () => {
    const skill = fs.readFileSync(SKILL_PATH, 'utf8');
    const reference = fs.readFileSync(COMPOUND_DOMAIN_MODEL_REFERENCE_PATH, 'utf8');
    const combined = `${skill}\n${reference}`;

    expect(skill).toContain('references/domain-model-capture.md');
    expect(skill).toContain('glossary challenge, fuzzy term sharpening, scenario stress, and code cross-reference');
    expect(skill).toContain('Do not create, bootstrap, or edit `CONTEXT.md`, `CONTEXT-MAP.md`, or `docs/adr/**`');
    expect(skill).toContain('hard to reverse, surprising without context, and real tradeoff');
    expect(skill).toContain('Context and ADR outputs are preview-only candidates');
    const outputSections = [
      '**Lightweight output:**',
      '## Success Output',
      '**Alternate output (when updating an existing doc due to high overlap):**',
    ];
    for (const sectionAnchor of outputSections) {
      const sectionStart = skill.indexOf(sectionAnchor);
      expect(sectionStart).toBeGreaterThanOrEqual(0);
      const nextFence = skill.indexOf('```', sectionStart);
      expect(nextFence).toBeGreaterThan(sectionStart);
      const closingFence = skill.indexOf('```', nextFence + 3);
      expect(closingFence).toBeGreaterThan(nextFence);
      const section = skill.slice(nextFence, closingFence);
      expect(section).toContain('Domain model capture: <scanned, no qualifying signals | folded into learning | context/ADR preview candidates reported>');
      expect(section).toContain('CONCEPTS.md: <updated — N added/refined | scanned, no qualifying terms | not present; no vocabulary maintenance applied>');
      expect(section).toContain('Context/ADR candidates: <none | preview only — path/reason/evidence>');
      expect(section).toMatch(/Domain model capture:[\s\S]*CONCEPTS\.md:[\s\S]*Context\/ADR candidates:/);
    }

    expect(reference).toContain('package-local and self-contained');
    expect(reference).toContain('do not depend on external local skill paths');
    expect(reference).toContain('do not expose a `domain-modeling` entrypoint from compound');
    expect(reference).toContain('Glossary challenge');
    expect(reference).toContain('Fuzzy term sharpening');
    expect(reference).toContain('Scenario stress');
    expect(reference).toContain('Code cross-reference');
    expect(reference).toContain('Solution doc first');
    expect(reference).toContain('Existing `CONCEPTS.md` update-only');
    expect(reference).toContain('Existing context topology as advisory evidence only');
    expect(reference).toContain('ADR candidate only');
    expect(reference).toContain('Ordinary compound runs must not write `docs/adr/**`');
    expect(reference).toContain('Do not capture:');
    expect(reference).toContain('timeout, retry, refactor');
    expect(reference).toContain('Terms already present in `CONCEPTS.md` when the solved lesson adds no durable precision');
    expect(reference).toContain('Domain model capture: <scanned, no qualifying signals');
    expect(reference).not.toContain('/Users/kuang/xiaobu/skills');

    expect(combined).not.toContain('Update CONTEXT.md inline');
    expect(combined).not.toContain('Create files lazily');
    const permissiveText = combined
      .split('\n')
      .filter((line) => !/\b(?:do not|must not|not create|not edit|not write|preview-only|only when|unless)\b/i.test(line))
      .join('\n');
    for (const forbiddenPattern of [
      /\bcreate\s+(?:a\s+)?(?:root\s+)?`?CONTEXT\.md`?/i,
      /\bbootstrap\s+`?CONTEXT\.md`?/i,
      /\bcreate\s+`?CONTEXT-MAP\.md`?/i,
      /\bCreate\s+docs\/adr\b/,
      /\bwrite\s+`?docs\/adr\/\*\*`?/i,
      /\bwrite\s+(?:an?\s+)?ADR\b/i,
      /mode:autofix[\s\S]{0,160}\bedit\s+(?:instruction files|context files|ADR files)/i,
      /If\s+`CONCEPTS\.md`\s+exists\s+at\s+repo\s+root,\s+run\s+a\s+parallel\s+discoverability\s+check\s+for\s+it/i,
    ]) {
      expect(permissiveText).not.toMatch(forbiddenPattern);
    }
  });

  test('compound eval fixtures preserve domain-model capture boundary cases', () => {
    const payload = JSON.parse(fs.readFileSync(COMPOUND_EVAL_EXAMPLES_PATH, 'utf8'));
    const casesById = new Map(payload.cases.map((entry) => [entry.id, entry]));

    const expectedCases = [
      {
        id: 'domain-term-existing-concepts-update-only',
        tags: ['domain-model-capture', 'vocabulary', 'knowledge-promotion'],
        expected: ['one docs/solutions learning first', 'existing CONCEPTS.md entry only'],
      },
      {
        id: 'general-engineering-term-not-captured',
        tags: ['boundary', 'vocabulary', 'domain-model-capture'],
        expected: ['Do not add mainstream engineering terms', 'CONCEPTS.md'],
      },
      {
        id: 'routine-decision-no-adr',
        tags: ['boundary', 'adr', 'domain-model-capture'],
        expected: ['Do not create or recommend an ADR', 'real tradeoff'],
      },
      {
        id: 'missing-context-no-bootstrap',
        tags: ['boundary', 'context-topology', 'domain-model-capture'],
        expected: ['Do not bootstrap CONTEXT.md or CONTEXT-MAP.md', 'CONCEPTS.md only if it already exists'],
      },
      {
        id: 'overbroad-vocabulary-capture',
        tags: ['boundary', 'vocabulary', 'domain-model-capture'],
        expected: ['only the project-specific term', 'general engineering words uncaptured'],
      },
    ];

    for (const expectedCase of expectedCases) {
      const fixture = casesById.get(expectedCase.id);
      expect(fixture).toBeTruthy();
      for (const tag of expectedCase.tags) {
        expect(fixture.coverage_tags).toContain(tag);
      }
      for (const expectedText of expectedCase.expected) {
        expect(fixture.expected_outcome).toContain(expectedText);
      }
    }
  });

  test('compound-refresh keeps autofix mode and scopes advisory vocabulary maintenance', () => {
    const skill = fs.readFileSync(COMPOUND_REFRESH_SKILL_PATH, 'utf8');
    const reference = fs.readFileSync(COMPOUND_REFRESH_CONCEPTS_REFERENCE_PATH, 'utf8');

    expect(skill).toContain('mode:autofix');
    expect(skill).not.toContain('mode:headless');
    expect(skill).toContain('references/concepts-vocabulary.md');
    expect(skill).toContain('**Vocabulary and domain signals**');
    expect(skill).toContain('## Phase 4.5: Vocabulary And Domain Drift Capture');
    expect(skill).toContain('First, read `references/concepts-vocabulary.md`');
    expect(skill).toContain('If `CONCEPTS.md` does not exist, do not create or bootstrap it from an ordinary refresh');
    expect(skill).toContain('CONCEPTS.md: not present; no vocabulary maintenance applied');
    expect(skill).toContain('must not turn `CONCEPTS.md` into a PRD, ADR, workflow contract, source-of-truth override, setup requirement, or mandatory downstream project file');
    expect(skill).toContain('CONCEPTS.md: <not present; no vocabulary maintenance applied | scanned, no qualifying terms | updated');
    expect(skill).toContain('Domain/context/ADR recommendations: <none | report-only');
    expect(skill).toContain('Existing `CONTEXT.md`, `CONTEXT-MAP.md`, and `docs/adr/**` surfaces are report-only in refresh');
    expect(skill).toContain('It must not run the full `spec-compound` Domain Model Capture workflow');
    expect(skill).toContain('If this refresh added, refined, or scrubbed entries in an existing repo-root `CONCEPTS.md`');
    expect(skill).toContain('when Phase 4.5 only scanned with no qualifying terms');
    expect(skill).toContain('do not create instruction-file churn for a no-op vocabulary scan');
    expect(skill).toContain('In `mode:autofix`, include a discoverability recommendation in the report rather than editing instruction files');
    expect(skill).not.toContain('If `CONCEPTS.md` exists at repo root, run a parallel discoverability check for it');
    expect(skill).not.toContain('ce-compound-refresh');

    expect(reference).toContain('vocabulary maintenance is scoped and advisory');
    expect(reference).toContain('do not create or bootstrap it as part of an ordinary refresh');
    expect(reference).toContain('Refresh collects vocabulary and domain-signal drift');
    expect(reference).toContain('it does not rerun the full `spec-compound` Domain Model Capture workflow');
    expect(reference).toContain('recommend an explicit separately scoped vocabulary bootstrap');
    expect(reference).toContain('Do not turn a focused refresh into a repo-wide vocabulary sweep');
    expect(reference).toContain('Do not create or edit `CONTEXT.md`, `CONTEXT-MAP.md`, or `docs/adr/**` from refresh');
    expect(reference).toContain('If this refresh added, refined, or scrubbed entries in `CONCEPTS.md`');
    expect(reference).toContain('skip discoverability maintenance to avoid instruction-file churn');
    expect(reference).toContain('In `mode:autofix`, report a discoverability recommendation only');
    expect(reference).not.toContain('/Users/kuang/xiaobu/skills');
    expect(reference).not.toContain('ce-compound-refresh');
    expect(reference).not.toContain('mode:headless');
  });

  test('compound-refresh checks inbound links before deleting solution docs', () => {
    const text = [
      fs.readFileSync(COMPOUND_REFRESH_SKILL_PATH, 'utf8'),
      fs.readFileSync(COMPOUND_REFRESH_PER_ACTION_FLOWS_PATH, 'utf8'),
    ].join('\n');

    expect(text).toContain('Delete when the code is gone, and only after checking for inbound links');
    expect(text).toContain('Inbound links inform classification, not cleanup');
    expect(text).toContain('decorative');
    expect(text).toContain('substantive');
    expect(text).toContain('Search the filename slug (without `.md`)');
    expect(text).toContain('Auto-delete only when all three hold');
    expect(text).toContain('Inbound links are absent or unambiguously decorative');
    expect(text).toContain('Before unlinking the file, run a final inbound-link check');
    expect(text).not.toContain('Auto-delete only when both the implementation AND the problem domain are gone');
  });

  test('compound-refresh routes action execution to per-action reference without inline flow bloat', () => {
    const skill = fs.readFileSync(COMPOUND_REFRESH_SKILL_PATH, 'utf8');
    const reference = fs.readFileSync(COMPOUND_REFRESH_PER_ACTION_FLOWS_PATH, 'utf8');

    expect(skill).toContain('Load `skills/spec-compound-refresh/references/per-action-flows.md`');
    expect(skill).toContain('Replace still runs `python3 scripts/validate-frontmatter.py <new-learning-path>`');
    expect(skill).toContain('Delete still performs the final inbound-link check');
    expect(skill).not.toContain('### Keep Flow');
    expect(skill).not.toContain('### Update Flow');
    expect(skill).not.toContain('### Consolidate Flow');
    expect(skill).not.toContain('### Replace Flow');
    expect(skill).not.toContain('### Delete Flow');

    expect(reference).toContain('## Keep Flow');
    expect(reference).toContain('## Update Flow');
    expect(reference).toContain('## Consolidate Flow');
    expect(reference).toContain('## Replace Flow');
    expect(reference).toContain('## Delete Flow');
    expect(reference).toContain('python3 scripts/validate-frontmatter.py <new-learning-path>');
    expect(reference).toContain('Before unlinking the file, run a final inbound-link check');
  });

  test('Claude command projection points compound-refresh action flow reference at the workflow runtime copy', () => {
    const command = plannedRuntimeContent(new ClaudeAdapter(), '.claude/commands/spec/compound-refresh.md');

    expect(command).toContain('Load `.claude/spec-first/workflows/spec-compound-refresh/references/per-action-flows.md`');
    expect(command).not.toContain('Load `references/per-action-flows.md`');
    expect(command).not.toContain('Load `skills/spec-compound-refresh/references/per-action-flows.md`');
  });

  test('validator invocation carries a loud-convention degraded mode (no silent skip when script cannot run)', () => {
    const skill = fs.readFileSync(SKILL_PATH, 'utf8');
    const reference = fs.readFileSync(COMPOUND_REFRESH_PER_ACTION_FLOWS_PATH, 'utf8');

    for (const text of [skill, reference]) {
      expect(text).toContain('validator unavailable: <reason>');
      expect(text).toContain('do not silently skip');
      expect(text).toContain('manually verify the same scope the script covers');
      // The manual fallback must stay scoped to the script's exact three checks.
      expect(text).toContain('Keep the manual check to exactly these three');
    }
  });

  test('compound and refresh templates include structured recall promotion fields', () => {
    const templates = [
      fs.readFileSync(COMPOUND_RESOLUTION_TEMPLATE_PATH, 'utf8'),
      fs.readFileSync(COMPOUND_REFRESH_RESOLUTION_TEMPLATE_PATH, 'utf8'),
    ];
    const sectionBetween = (text, start, end) => {
      const startIndex = text.indexOf(start);
      expect(startIndex).toBeGreaterThanOrEqual(0);
      const endIndex = end ? text.indexOf(end, startIndex + start.length) : -1;
      return endIndex === -1 ? text.slice(startIndex) : text.slice(startIndex, endIndex);
    };

    for (const text of templates) {
      const bugTemplate = sectionBetween(text, '## Bug Track Template', '## Knowledge Track Template');
      const knowledgeTemplate = sectionBetween(text, '## Knowledge Track Template');

      for (const block of [bugTemplate, knowledgeTemplate]) {
        for (const field of [
          'domain:',
          'pattern:',
          'rejected_alternatives:',
          'applicable_versions:',
          'invalidation_condition:',
          'source_refs:',
        ]) {
          expect(block).toContain(field);
        }
        expect(block).toContain('rejected_alternatives, applicable_versions, source_refs');
        expect(block).toContain('- [repo-relative source, test, doc, or review path]');
      }
    }
  });

  test('compound-refresh support files stay aligned with structured promotion schema', () => {
    const schemaTexts = [
      fs.readFileSync(COMPOUND_SCHEMA_PATH, 'utf8'),
      fs.readFileSync(COMPOUND_REFRESH_SCHEMA_PATH, 'utf8'),
    ];
    const yamlSchemaTexts = [
      fs.readFileSync(COMPOUND_YAML_SCHEMA_PATH, 'utf8'),
      fs.readFileSync(COMPOUND_REFRESH_YAML_SCHEMA_PATH, 'utf8'),
    ];

    for (const text of schemaTexts) {
      expect(text).toContain('new_promote_required_fields');
      expect(text).toContain('legacy_unstructured_advisory');
      expect(text).toContain('New promoted solution docs must include invalidation_condition and source_refs');
      expect(text).toContain('Existing docs missing the structured recall fields remain legacy_unstructured_advisory');
      expect(text).toContain('rejected_alternatives, applicable_versions, source_refs');
    }

    for (const text of yamlSchemaTexts) {
      expect(text).toContain('New Promote Required Fields');
      expect(text).toContain('legacy_unstructured_advisory');
      expect(text).toContain('rejected_alternatives`, `applicable_versions`');
      expect(text).toContain('source_refs`, or any future array field');
    }
  });

  test('compound and compound-refresh keep byte-identical schema copies (no silent drift)', () => {
    // 两个 skill 各自持有一份 schema.yaml / yaml-schema.md 副本,靠手工同步。
    // 字节相等断言守住单边改动导致的跨 skill 合同漂移。
    expect(fs.readFileSync(COMPOUND_REFRESH_SCHEMA_PATH, 'utf8'))
      .toEqual(fs.readFileSync(COMPOUND_SCHEMA_PATH, 'utf8'));
    expect(fs.readFileSync(COMPOUND_REFRESH_YAML_SCHEMA_PATH, 'utf8'))
      .toEqual(fs.readFileSync(COMPOUND_YAML_SCHEMA_PATH, 'utf8'));
  });
});
