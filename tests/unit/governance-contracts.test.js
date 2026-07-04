'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { validateAgainstSchema } = require('../../src/contracts/schema-validator');

const REPO_ROOT = path.join(__dirname, '..', '..');

function readSchema(name) {
  return JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'docs', 'contracts', 'governance', name), 'utf8'));
}

describe('governance contracts', () => {
  test('gate-lens-taxonomy validates seven canonical families and rejects unknown family', () => {
    const schema = readSchema('gate-lens-taxonomy.schema.json');
    const payload = {
      schema_version: 'gate-lens-taxonomy.v1',
      families: [
        { family: 'preflight', description: 'setup readiness' },
        { family: 'exploration', description: 'context discovery' },
        { family: 'planning', description: 'plan boundary' },
        { family: 'execution', description: 'implementation' },
        { family: 'verification', description: 'checks' },
        { family: 'review', description: 'review' },
        { family: 'summary', description: 'closeout' },
      ],
    };

    expect(validateAgainstSchema(schema, payload).errors).toEqual([]);
    expect(validateAgainstSchema(schema, {
      ...payload,
      families: [...payload.families.slice(0, 6), { family: 'resource', description: 'not a family' }],
    }).errors).toEqual(expect.arrayContaining([
      expect.stringContaining('not in enum'),
    ]));
  });

  test('rule-maturity schema allows reserved stages but source registers only a shadow producer helper', () => {
    const schema = readSchema('rule-maturity.schema.json');
    const payload = {
      schema_version: 'rule-maturity.v1',
      rule_id: 'resource-generated-output',
      stage: 'shadow',
      shadow_hits: [
        {
          observed_at: '2026-06-05T00:00:00.000Z',
          workflow: 'spec-work',
          evidence_ref: 'git-status:porcelain',
          reason_code: 'generated-runtime-path',
        },
      ],
      defect_evidence_refs: [],
      false_positive_refs: [],
      rollback: {
        available: true,
        notes: 'remove advisory producer consumption',
      },
      evidence_refs: ['git-status:porcelain'],
      reason_code: 'shadow-observation',
    };
    const internalSource = fs.readFileSync(path.join(REPO_ROOT, 'src', 'cli', 'commands', 'internal.js'), 'utf8');
    const helperSource = fs.readFileSync(path.join(REPO_ROOT, 'src', 'cli', 'helpers', 'rule-maturity.js'), 'utf8');

    expect(validateAgainstSchema(schema, payload).errors).toEqual([]);
    expect(validateAgainstSchema(schema, { ...payload, stage: 'required-evidence' }).errors).toEqual([]);
    expect(validateAgainstSchema(schema, { ...payload, stage: 'blocking' }).errors).toEqual([]);
    expect(internalSource).toContain("subcommand === 'rule-maturity'");
    expect(helperSource).not.toContain("'--stage'");
    expect(helperSource).not.toContain('"--stage"');
    expect(helperSource).not.toMatch(/\b(promote|approveRule|escalate)\s*\(/);
  });

  test('producers never emit reserved maturity stages or promotion logic', () => {
    const producers = ['task-governance-signals.js', 'resource-governance-lens.js']
      .map((name) => fs.readFileSync(path.join(REPO_ROOT, 'src', 'cli', 'helpers', name), 'utf8'));
    for (const source of producers) {
      expect(source).not.toMatch(/['"]required-evidence['"]/);
      expect(source).not.toMatch(/['"]blocking['"]/);
      expect(source).not.toMatch(/\b(promote|approveRule|escalate)\s*\(/);
    }
  });

  test('resource-governance-lens keeps generated runtime out of evidence_ref', () => {
    const schema = readSchema('resource-governance-lens.schema.json');
    const payload = {
      schema_version: 'resource-governance-lens.v1',
      generated_at: '2026-06-05T00:00:00.000Z',
      status: 'advisory',
      items: [
        {
          lens_family: 'summary',
          dimension: 'generated-output',
          severity: 'advisory',
          reason_code: 'generated-runtime-path',
          subject_path: '.claude/commands/spec-work.md',
          evidence_ref: 'git-status:porcelain',
        },
      ],
      reason_codes: ['resource-advisory-present'],
      policy: {
        maxGitFileSizeBytes: 5242880,
        rawLogMaxBytes: 524288,
        generatedRuntimePrefixes: ['.claude/', '.codex/', '.agents/skills/'],
        retainedRuntimeDirectories: ['tmp'],
      },
    };

    expect(validateAgainstSchema(schema, payload).errors).toEqual([]);

    // [CT-003] 缺 required reason_code 的 item 被 schema 拒绝(替换原先对内联字面量的恒真断言;
    // generated-runtime 不进 evidence_ref 的真实保护在 resource-governance-lens.test.js 的 producer 层)。
    const incompleteItem = { ...payload.items[0] };
    delete incompleteItem.reason_code;
    const missingReasonCode = { ...payload, items: [incompleteItem] };
    expect(validateAgainstSchema(schema, missingReasonCode).errors.length).toBeGreaterThan(0);
  });

  test('rule maturity workflow prose exposes candidates without automatic promotion', () => {
    const specPlan = [
      fs.readFileSync(path.join(REPO_ROOT, 'skills', 'spec-plan', 'SKILL.md'), 'utf8'),
      fs.readFileSync(path.join(REPO_ROOT, 'skills', 'spec-plan', 'references', 'planning-flow.md'), 'utf8'),
    ].join('\n');
    const codeReview = fs.readFileSync(path.join(REPO_ROOT, 'skills', 'spec-code-review', 'SKILL.md'), 'utf8');
    const outputTemplate = fs.readFileSync(path.join(REPO_ROOT, 'skills', 'spec-code-review', 'references', 'review-output-template.md'), 'utf8');
    const skillAudit = fs.readFileSync(path.join(REPO_ROOT, 'skills', 'spec-skill-audit', 'SKILL.md'), 'utf8');
    const contract = fs.readFileSync(path.join(REPO_ROOT, 'docs', 'contracts', 'governance', 'rule-maturity.md'), 'utf8');

    expect(specPlan).toContain('spec-first internal rule-maturity record --rule-id planning-depth-underclassified');
    expect(specPlan).toContain('this observation is not a planning gate and does not adjudicate or promote a rule');
    expect(codeReview).toContain('spec-first internal rule-maturity record --rule-id summary-generated-output-staged');
    expect(codeReview).toContain('Rule Maturity Candidates');
    expect(codeReview).toContain('similar_existing_rule_ids');
    expect(codeReview).toContain('Do not automatically adjudicate, promote, demote');
    expect(codeReview).toContain('never session-only summaries, raw lens stdout, `/tmp` files, or "see above"');
    expect(outputTemplate).toContain('### Rule Maturity Candidates');
    expect(skillAudit).toContain('rule-maturity-observations.json');
    expect(skillAudit).toContain('does not trigger human review, adjudication, or promotion');
    expect(contract).toContain('spec-first internal rule-maturity record');
    expect(contract).toContain('The local evidence store is `.spec-first/governance/rule-maturity.json`');
    expect(contract).toContain('spec-code-review` Stage 6');
    expect(contract).toContain('`spec-skill-audit`');
  });
});
