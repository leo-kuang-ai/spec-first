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
const EXTERNAL_LOCAL_PATH_PATTERN = /(?:\/Users\/|\/home\/|\/private\/var\/|[A-Za-z]:\\Users\\)/;
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

describe('spec-compound frontmatter trigger contract', () => {
  test('description follows CE-first compound capture trigger', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');
    const frontmatter = text.match(/^---\n([\s\S]*?)\n---/)[1];

    expect(frontmatter).toContain('Document a recently solved problem or durable project vocabulary');
    expect(frontmatter).toContain('docs/solutions/');
    expect(frontmatter).toContain('CONCEPTS.md');
    expect(frontmatter).toContain('capturing a learning after work');
    expect(frontmatter).toContain('argument-hint');
    expect(frontmatter).toContain('mode:headless');
    expect(frontmatter).not.toContain('ce-compound');
  });

  test('compound-refresh description limits refresh to existing solution docs', () => {
    const text = fs.readFileSync(COMPOUND_REFRESH_SKILL_PATH, 'utf8');
    const frontmatter = text.match(/^---\n([\s\S]*?)\n---/)[1];

    expect(frontmatter).toContain('Refresh docs/solutions learnings against the current codebase');
    expect(frontmatter).toContain('stale, overlapping, superseded, or drifted learnings');
    expect(frontmatter).toContain('avoid general refactor, debugging, or code review unless docs/solutions is explicit');
    expect(frontmatter).toContain('argument-hint');
    expect(frontmatter).toContain('mode:autofix');
  });
});

describe('spec-compound host entrypoint contract', () => {
  test('usage and follow-up guidance use spec-first entrypoint wording', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('spec-compound [brief context]');
    expect(text).toContain('spec-compound mode:headless');
    expect(text).toContain('spec-compound-refresh');
    expect(text).not.toContain('Use /spec:compound [context]');
    expect(text).not.toContain('re-run /spec:compound in a fresh session');
    expect(text).not.toContain('- `/spec:plan` - Planning workflow');
    expect(text).not.toContain('/spec:compound` on Claude Code');
    expect(text).not.toContain('$spec-compound` on Codex');
    expect(text).not.toContain('/spec:plan` on Claude Code');
    expect(text).not.toContain('$spec-plan` on Codex');
  });

  test('compound captures CONCEPTS.md vocabulary through CE-first seeding rules', () => {
    const skill = fs.readFileSync(SKILL_PATH, 'utf8');
    const reference = fs.readFileSync(COMPOUND_CONCEPTS_REFERENCE_PATH, 'utf8');

    expect(skill).toContain('references/concepts-vocabulary.md');
    expect(skill).toContain('### Phase 2.4: Vocabulary Capture');
    expect(skill).toContain('If it does not exist and at least one qualifying term surfaced, create it');
    expect(skill).toContain('Seed the learning\'s area at creation');
    expect(skill).toContain('A repo-wide concept map is `spec-compound-refresh`\'s bootstrap path');
    expect(skill).toContain('Shared domain vocabulary for this project');
    expect(skill).toContain('CONCEPTS.md: <scanned, no qualifying terms | created with N entries');
    expect(skill).toContain('The primary deliverable is ONE file');
    expect(skill).not.toContain('ce-compound');

    expect(reference).toContain('How terms enter: accretion and seeding');
    expect(reference).toContain('Seed goal');
    expect(reference).toContain('Scope of a seed');
    expect(reference).toContain('A **scoped run**');
    expect(reference).toContain('A **repo-wide bootstrap**');
    expect(reference).toContain('The file stands on its own');
    expect(reference).not.toContain('ce-compound');
    expect(reference).not.toContain('Compound Engineering');
  });

  test('compound keeps CE-first runtime artifacts and validators without spec-only domain-model assets', () => {
    const skill = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(skill).toContain('/tmp/spec-first/spec-compound/<run-id>/');
    expect(skill).toContain('references/grounding-validation.md');
    expect(skill).toContain('scripts/validate-frontmatter.py');
    expect(skill).toContain('scripts/validate-doc-claims.py');
    expect(skill).toContain('Mechanical claims check');
    expect(fs.existsSync(COMPOUND_DOMAIN_MODEL_REFERENCE_PATH)).toBe(false);
    expect(fs.existsSync(COMPOUND_EVAL_EXAMPLES_PATH)).toBe(false);
    expect(skill).not.toContain('references/domain-model-capture.md');
  });

  test('compound-refresh keeps CE refresh lifecycle with minimal spec-first projection', () => {
    const skill = fs.readFileSync(COMPOUND_REFRESH_SKILL_PATH, 'utf8');
    const reference = fs.readFileSync(COMPOUND_REFRESH_CONCEPTS_REFERENCE_PATH, 'utf8');

    expect(skill).toContain('mode:autofix');
    expect(skill).not.toContain('mode:headless');
    expect(skill).toContain('references/concepts-vocabulary.md');
    expect(skill).toContain('## CONCEPTS.md bootstrap requests');
    expect(skill).toContain('**Vocabulary**');
    expect(skill).toContain('## Phase 4.5: Vocabulary Capture');
    expect(skill).toContain('First, read `references/concepts-vocabulary.md`');
    expect(skill).toContain('If `CONCEPTS.md` does not exist');
    expect(skill).toContain('bootstrap it — and seed, don\'t write a single term');
    expect(skill).toContain('CONCEPTS.md: <scanned, no qualifying terms | created with N entries (M seeded) | updated');
    expect(skill).toContain('If `CONCEPTS.md` exists at repo root, run a parallel discoverability check for it');
    expect(skill).not.toContain('ce-compound-refresh');
    expect(skill).not.toContain('ce-compound');
    expect(skill).not.toContain('legacy_unstructured_advisory');
    expect(skill).not.toContain('Structured Promotion Gate');

    expect(reference).toContain('How terms enter: accretion and seeding');
    expect(reference).toContain('Seed goal');
    expect(reference).toContain('Scope of a seed');
    expect(reference).toContain('A **repo-wide bootstrap**');
    expect(reference).toContain('a refresh narrowed to an area');
    expect(reference).not.toMatch(EXTERNAL_LOCAL_PATH_PATTERN);
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

    expect(skill).toContain('Read `references/per-action-flows.md` and follow the matching section');
    expect(skill).toContain('validate frontmatter and cited claims');
    expect(skill).toContain('final inbound-link check');
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
    expect(reference).toContain('python3 "$SKILL_DIR/scripts/validate-frontmatter.py" <new-learning-path>');
    expect(reference).toContain('python3 "$SKILL_DIR/scripts/validate-doc-claims.py" <new-learning-path>');
    expect(reference).toContain('Before unlinking the file, run a final inbound-link check');
  });

  test('Claude command projection points compound-refresh action flow reference at the workflow runtime copy', () => {
    const command = plannedRuntimeContent(new ClaudeAdapter(), '.claude/commands/spec-compound-refresh.md');

    expect(command).toContain('spec-compound-refresh');
    expect(command).toContain('Read `references/per-action-flows.md` and follow the matching section');
    expect(command).not.toContain('Load `skills/spec-compound-refresh/references/per-action-flows.md`');
  });

  test('validator invocation carries a loud-convention degraded mode (no silent skip when script cannot run)', () => {
    const skill = fs.readFileSync(SKILL_PATH, 'utf8');
    const reference = fs.readFileSync(COMPOUND_REFRESH_PER_ACTION_FLOWS_PATH, 'utf8');

    expect(skill).toContain('SKILL_DIR="<absolute path of the directory containing the SKILL.md you just read>"');
    expect(skill).toContain('python3 "$SKILL_DIR/scripts/validate-frontmatter.py" <output-path>');
    expect(skill).not.toContain('Run `python3 scripts/validate-frontmatter.py <output-path>`');

    expect(reference).toContain('SKILL_DIR="<absolute path of the directory containing the spec-compound-refresh SKILL.md you read>"');
    expect(reference).toContain('python3 "$SKILL_DIR/scripts/validate-frontmatter.py" <new-learning-path>');

    expect(skill).toContain('Bundled validate-frontmatter.py not resolvable on this platform');
    expect(skill).toContain('applying the parser-safety checklist manually');
    expect(skill).toContain('never silently skip');
    expect(reference).toContain('validator unavailable: <reason>');
    expect(reference).toContain('do not silently skip');
    expect(reference).toContain('manually verify the same scope the script covers');
    expect(reference).toContain('Keep the manual check to exactly these three');
  });

  test('compound uses migrated skill-local agents and scripts', () => {
    const skill = fs.readFileSync(SKILL_PATH, 'utf8');
    const localAgents = [
      'best-practices-researcher.md',
      'data-integrity-guardian.md',
      'framework-docs-researcher.md',
      'pattern-recognition-specialist.md',
      'performance-oracle.md',
      'repo-profiler.md',
      'security-sentinel.md',
      'session-historian.md',
    ];
    const sessionScripts = [
      'discover-sessions.sh',
      'extract-errors.py',
      'extract-metadata.py',
      'extract-skeleton.py',
    ];

    expect(skill).toContain('references/repo-profile-cache.md');
    expect(skill).toContain('python3 "$SKILL_DIR/scripts/repo-profile-cache.py" get');
    expect(skill).toContain('references/agents/repo-profiler.md');
    expect(skill).toContain('`docs/solutions/` enumeration is NEVER cached');
    expect(skill).toContain('session discovery, branch/keyword filtering, scan-window selection');
    expect(skill).toContain('using `scripts/session-history/`');
    expect(skill).toContain('Do not dispatch a standalone agent by type/name.');
    expect(skill).toContain('bash "$SKILL_DIR/scripts/session-history/discover-sessions.sh"');
    expect(skill).toContain('xargs -0 python3 "$SKILL_DIR/scripts/session-history/extract-metadata.py"');
    expect(skill).toContain('SCRATCH=$(mktemp -d -t spec-compound-sessions-XXXXXX)');
    expect(skill).toContain('extract-skeleton.py');
    expect(skill).toContain('extract-errors.py');
    expect(skill).toContain('generic subagents seeded with local prompt assets from `references/agents/`');
    expect(skill).toContain('Do not dispatch standalone agents by type/name.');
    expect(skill).not.toContain('${CLAUDE_SKILL_DIR}');

    for (const file of localAgents) {
      const relativePath = `references/agents/${file}`;
      const fullPath = path.join(__dirname, '..', '..', 'skills', 'spec-compound', relativePath);
      const text = fs.readFileSync(fullPath, 'utf8');

      expect(fs.existsSync(fullPath)).toBe(true);
      expect(skill).toContain(relativePath);
      expect(text).not.toMatch(/^---\n/);
    }

    for (const file of sessionScripts) {
      const fullPath = path.join(
        __dirname,
        '..',
        '..',
        'skills',
        'spec-compound',
        'scripts',
        'session-history',
        file,
      );
      expect(fs.existsSync(fullPath)).toBe(true);
    }
  });

  test('compound and refresh templates stay CE-aligned without structured recall fields', () => {
    const compoundTemplate = fs.readFileSync(COMPOUND_RESOLUTION_TEMPLATE_PATH, 'utf8');
    const refreshTemplate = fs.readFileSync(COMPOUND_REFRESH_RESOLUTION_TEMPLATE_PATH, 'utf8');
    const sectionBetween = (text, start, end) => {
      const startIndex = text.indexOf(start);
      expect(startIndex).toBeGreaterThanOrEqual(0);
      const endIndex = end ? text.indexOf(end, startIndex + start.length) : -1;
      return endIndex === -1 ? text.slice(startIndex) : text.slice(startIndex, endIndex);
    };

    for (const block of [
      sectionBetween(compoundTemplate, '## Bug Track Template', '## Knowledge Track Template'),
      sectionBetween(compoundTemplate, '## Knowledge Track Template'),
      sectionBetween(refreshTemplate, '## Bug Track Template', '## Knowledge Track Template'),
      sectionBetween(refreshTemplate, '## Knowledge Track Template'),
    ]) {
      for (const field of [
        'domain:',
        'pattern:',
        'rejected_alternatives:',
        'applicable_versions:',
        'invalidation_condition:',
        'source_refs:',
      ]) {
        expect(block).not.toContain(field);
      }
      expect(block).toContain('tags: [keyword-one, keyword-two]');
    }

    expect(compoundTemplate).toEqual(refreshTemplate);
  });

  test('compound and refresh support files stay CE-aligned without structured recall fields', () => {
    const compoundSchema = fs.readFileSync(COMPOUND_SCHEMA_PATH, 'utf8');
    const compoundYamlSchema = fs.readFileSync(COMPOUND_YAML_SCHEMA_PATH, 'utf8');
    const refreshSchema = fs.readFileSync(COMPOUND_REFRESH_SCHEMA_PATH, 'utf8');
    const refreshYamlSchema = fs.readFileSync(COMPOUND_REFRESH_YAML_SCHEMA_PATH, 'utf8');

    for (const text of [compoundSchema, compoundYamlSchema, refreshSchema, refreshYamlSchema]) {
      expect(text).not.toContain('new_promote_required_fields');
      expect(text).not.toContain('legacy_unstructured_advisory');
      expect(text).not.toContain('invalidation_condition');
      expect(text).not.toContain('source_refs');
      expect(text).toContain('symptoms');
      expect(text).toContain('related_components');
    }

    expect(compoundSchema).toEqual(refreshSchema);
    expect(refreshYamlSchema).toContain('see plugin\n`AGENTS.md`');
    expect(compoundYamlSchema.replace('see root', 'see plugin')).toEqual(refreshYamlSchema);
  });

  test('compound and compound-refresh schema copies remain aligned after CE-first projection', () => {
    expect(fs.readFileSync(COMPOUND_REFRESH_SCHEMA_PATH, 'utf8'))
      .toEqual(fs.readFileSync(COMPOUND_SCHEMA_PATH, 'utf8'));
    expect(fs.readFileSync(COMPOUND_REFRESH_YAML_SCHEMA_PATH, 'utf8'))
      .toEqual(fs.readFileSync(COMPOUND_YAML_SCHEMA_PATH, 'utf8').replace('see root', 'see plugin'));
  });
});
