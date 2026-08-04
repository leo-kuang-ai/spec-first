'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const PACKAGE_ROOTS = [
  'skills/spec-compound',
  'skills/spec-compound-refresh',
];

const SHARED_PROMOTION_FILES = [
  'references/schema.yaml',
  'references/yaml-schema.md',
  'assets/resolution-template.md',
  'scripts/validate-frontmatter.py',
];

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function solutionDoc(extraFrontmatter = '') {
  return `---
title: Promotion contract fixture
date: 2026-07-20
category: docs/solutions/workflow-issues
module: spec-first
problem_type: workflow_issue
component: development_workflow
severity: medium
${extraFrontmatter}---

# Promotion contract fixture
`;
}

function runValidator(packageRoot, text, promotion = true) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'compound-promotion-'));
  const docPath = path.join(tempRoot, 'learning.md');
  fs.writeFileSync(docPath, text);
  try {
    const args = [path.join(packageRoot, 'scripts/validate-frontmatter.py')];
    if (promotion) args.push('--promotion');
    args.push(docPath);
    return spawnSync('python3', args, { encoding: 'utf8' });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

function markdownSection(text, heading, nextHeading) {
  const start = text.indexOf(heading);
  const end = nextHeading ? text.indexOf(nextHeading, start + heading.length) : text.length;
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return text.slice(start, end);
}

describe('compound knowledge-promotion contract', () => {
  test.each(PACKAGE_ROOTS)('%s schema and template require provenance plus invalidation for promotion', (packageRoot) => {
    const schema = read(`${packageRoot}/references/schema.yaml`);
    const yamlGuide = read(`${packageRoot}/references/yaml-schema.md`);
    const template = read(`${packageRoot}/assets/resolution-template.md`);

    expect(schema).toContain('promotion_required_fields:');
    expect(schema).toMatch(/promotion_required_fields:[\s\S]*source_refs:[\s\S]*min_items: 1/);
    expect(schema).toMatch(/promotion_required_fields:[\s\S]*invalidation_condition:/);
    expect(yamlGuide).toContain('## Promotion Exit Fields');
    expect(yamlGuide).toContain('new or materially rewritten learning');
    expect(template.match(/^source_refs:$/gm)).toHaveLength(2);
    expect(template.match(/^invalidation_condition:/gm)).toHaveLength(2);
  });

  test('compound and refresh workflows invoke the same promotion validation mode', () => {
    const compound = read('skills/spec-compound/SKILL.md');
    const refresh = read('skills/spec-compound-refresh/references/per-action-flows.md');

    const compoundFull = markdownSection(compound, '### Phase 2: Assembly & Write', '### Phase 2.4:');
    const compoundLightweight = markdownSection(compound, '### Lightweight Mode', '## What It Captures');
    const refreshConsolidate = markdownSection(refresh, '## Consolidate Flow', '## Replace Flow');
    const refreshReplace = markdownSection(refresh, '## Replace Flow', '## Delete Flow');

    for (const section of [compoundFull, compoundLightweight]) {
      expect(section).toContain('validate-frontmatter.py" --promotion <output-path>');
      expect(section).toContain('source_refs');
      expect(section).toContain('invalidation_condition');
    }
    expect(refreshConsolidate).toContain('validate-frontmatter.py" --promotion <canonical-learning-path>');
    expect(refreshConsolidate).toContain('source_refs');
    expect(refreshConsolidate).toContain('invalidation_condition');
    expect(refreshConsolidate.indexOf('validate-frontmatter.py" --promotion <canonical-learning-path>'))
      .toBeLessThan(refreshConsolidate.indexOf('Delete the subsumed doc only after'));
    expect(refreshReplace).toContain('validate-frontmatter.py" --promotion <new-learning-path>');
    expect(refreshReplace).toContain('source_refs');
    expect(refreshReplace).toContain('invalidation_condition');
  });

  test('knowledge harness describes the deterministic floor without claiming semantic automation', () => {
    const harness = read('docs/contracts/knowledge/knowledge-harness.md');

    expect(harness).toContain('validate-frontmatter.py --promotion');
    expect(harness).toContain('只机械检查字段存在、顶层类型形态、非空与重复键');
    expect(harness).toContain('引用是否可信、是否足以回源，以及失效条件是否语义充分，仍由 LLM / human 判断');
    expect(harness).not.toContain('prose / LLM-enforced，非 machine-validated');
    expect(harness).not.toContain('最小回填 `domain`、`pattern`');
  });

  test.each(SHARED_PROMOTION_FILES)('compound and refresh %s stay byte-identical', (relativePath) => {
    expect(read(`skills/spec-compound/${relativePath}`))
      .toBe(read(`skills/spec-compound-refresh/${relativePath}`));
  });

  test.each(PACKAGE_ROOTS)('%s promotion validator accepts complete provenance and invalidation', (packageRoot) => {
    const result = runValidator(packageRoot, solutionDoc(
      'source_refs:\n  - "skills/spec-compound/SKILL.md"\n'
      + 'invalidation_condition: >\n  Re-check when the promotion contract changes.\n',
    ));

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK:');
  });

  test.each(PACKAGE_ROOTS)('%s promotion validator rejects missing provenance', (packageRoot) => {
    const result = runValidator(packageRoot, solutionDoc(
      'invalidation_condition: "Re-check when the promotion contract changes."\n',
    ));

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("promotion requires non-empty top-level 'source_refs' array");
  });

  test.each(PACKAGE_ROOTS)('%s promotion validator rejects missing invalidation condition', (packageRoot) => {
    const result = runValidator(packageRoot, solutionDoc(
      'source_refs:\n  - "skills/spec-compound/SKILL.md"\n',
    ));

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("promotion requires non-empty top-level 'invalidation_condition'");
  });

  test.each([
    ['empty flow source_refs', 'source_refs: []\ninvalidation_condition: "Re-check on contract change."\n', 'source_refs'],
    ['empty block source_refs', 'source_refs:\ninvalidation_condition: "Re-check on contract change."\n', 'source_refs'],
    ['blank source_refs item', 'source_refs:\n  - ""\ninvalidation_condition: "Re-check on contract change."\n', 'source_refs'],
    ['escaped-blank source_refs item', 'source_refs:\n  - "\\n"\ninvalidation_condition: "Re-check on contract change."\n', 'source_refs'],
    ['scalar source_refs', 'source_refs: "skills/spec-compound/SKILL.md"\ninvalidation_condition: "Re-check on contract change."\n', 'source_refs'],
    ['mapping-shaped source_refs item', 'source_refs:\n  - owner: docs-team\ninvalidation_condition: "Re-check on contract change."\n', 'source_refs'],
    ['non-string source_refs item', 'source_refs:\n  - 0x10\ninvalidation_condition: "Re-check on contract change."\n', 'source_refs'],
    ['binary source_refs item', 'source_refs:\n  - 0b1010\ninvalidation_condition: "Re-check on contract change."\n', 'source_refs'],
    ['date source_refs item', 'source_refs:\n  - 2026-07-20\ninvalidation_condition: "Re-check on contract change."\n', 'source_refs'],
    ['YAML 1.1 boolean source_refs item', 'source_refs:\n  - yes\ninvalidation_condition: "Re-check on contract change."\n', 'source_refs'],
    ['YAML 1.1 sexagesimal source_refs item', 'source_refs:\n  - 1:20\ninvalidation_condition: "Re-check on contract change."\n', 'source_refs'],
    ['empty quoted invalidation', 'source_refs:\n  - "skills/spec-compound/SKILL.md"\ninvalidation_condition: ""\n', 'invalidation_condition'],
    ['escaped-blank invalidation', 'source_refs:\n  - "skills/spec-compound/SKILL.md"\ninvalidation_condition: "\\u0020"\n', 'invalidation_condition'],
    ['empty block invalidation', 'source_refs:\n  - "skills/spec-compound/SKILL.md"\ninvalidation_condition: >\n', 'invalidation_condition'],
    ['mapping invalidation', 'source_refs:\n  - "skills/spec-compound/SKILL.md"\ninvalidation_condition: {}\n', 'invalidation_condition'],
    ['non-string invalidation', 'source_refs:\n  - "skills/spec-compound/SKILL.md"\ninvalidation_condition: .nan\n', 'invalidation_condition'],
    [
      'duplicate source_refs',
      'source_refs:\n  - "skills/spec-compound/SKILL.md"\nsource_refs:\n  - "docs/solutions/example.md"\ninvalidation_condition: "Re-check on contract change."\n',
      'source_refs',
    ],
    [
      'duplicate source_refs with whitespace before the colon',
      'source_refs:\n  - "skills/spec-compound/SKILL.md"\nsource_refs : []\ninvalidation_condition: "Re-check on contract change."\n',
      'source_refs',
    ],
    [
      'duplicate source_refs with a quoted key',
      'source_refs:\n  - "skills/spec-compound/SKILL.md"\n"source_refs": []\ninvalidation_condition: "Re-check on contract change."\n',
      'source_refs',
    ],
    [
      'duplicate source_refs with an escaped quoted key',
      'source_refs:\n  - "skills/spec-compound/SKILL.md"\n"source\\x5frefs": []\ninvalidation_condition: "Re-check on contract change."\n',
      'source_refs',
    ],
    [
      'duplicate invalidation condition',
      'source_refs:\n  - "skills/spec-compound/SKILL.md"\ninvalidation_condition: "Re-check on contract change."\ninvalidation_condition: "Second condition."\n',
      'invalidation_condition',
    ],
  ])('promotion validator rejects %s', (_name, extraFrontmatter, field) => {
    for (const packageRoot of PACKAGE_ROOTS) {
      const result = runValidator(packageRoot, solutionDoc(extraFrontmatter));

      expect(result.status).toBe(1);
      expect(result.stderr).toContain(`promotion requires non-empty top-level '${field}'`);
    }
  });

  test.each(PACKAGE_ROOTS)('%s promotion validator accepts a non-empty flow source_refs array', (packageRoot) => {
    const result = runValidator(packageRoot, solutionDoc(
      'source_refs: ["skills/spec-compound/SKILL.md", "docs/solutions/example.md"]\n'
      + 'invalidation_condition: "Re-check when the promotion contract changes."\n',
    ));

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK:');
  });

  test.each(PACKAGE_ROOTS)('%s promotion validator accepts existing plain-string field shapes', (packageRoot) => {
    const result = runValidator(packageRoot, solutionDoc(
      'source_refs:\n  - docs/plans/example.md\n'
      + 'invalidation_condition: Re-check when the referenced plan contract changes.\n',
    ));

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK:');
  });

  test.each(PACKAGE_ROOTS)('%s default parser-safety mode remains compatible with legacy docs', (packageRoot) => {
    const result = runValidator(packageRoot, solutionDoc(), false);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK:');
  });
});
