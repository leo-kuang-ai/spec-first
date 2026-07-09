'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..', '..');
const SKILL_ROOT = path.join(REPO_ROOT, 'skills', 'spec-doc-review');

const EXPECTED_FILES = [
  'SKILL.md',
  'references/bulk-preview.md',
  'references/findings-schema.json',
  'references/open-questions-defer.md',
  'references/personas/adversarial-document-reviewer.md',
  'references/personas/coherence-reviewer.md',
  'references/personas/design-lens-reviewer.md',
  'references/personas/feasibility-reviewer.md',
  'references/personas/product-lens-reviewer.md',
  'references/personas/scope-guardian-reviewer.md',
  'references/personas/security-lens-reviewer.md',
  'references/review-output-template.md',
  'references/subagent-template.md',
  'references/synthesis-and-presentation.md',
  'references/walkthrough.md',
];

function read(relativePath) {
  return fs.readFileSync(path.join(SKILL_ROOT, relativePath), 'utf8');
}

function listFiles(dir = SKILL_ROOT, prefix = '') {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.join(prefix, entry.name);
    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(absolutePath, relativePath);
    return relativePath;
  }).sort();
}

describe('spec-doc-review CE-first projection contract', () => {
  test('keeps the CE-derived file surface without legacy spec-only fixtures', () => {
    expect(listFiles()).toEqual(EXPECTED_FILES);
  });

  test('preserves CE document-review entrypoint, headless mode, and unified artifact classification', () => {
    const skill = read('SKILL.md');
    const frontmatter = skill.match(/^---\n([\s\S]*?)\n---/)[1];

    expect(frontmatter).toContain('name: spec-doc-review');
    expect(frontmatter).toContain('Review requirements, plans, or specs with role-specific lenses');
    expect(frontmatter).toContain('argument-hint: "[mode:headless] [path/to/document.md]"');

    expect(skill).toContain('mode:headless');
    expect(skill).toContain('Skill("spec-doc-review", "mode:headless docs/plans/my-plan.md")');
    expect(skill).toContain('artifact_contract: spec-unified-plan/v1');
    expect(skill).toContain('artifact_readiness: requirements-only');
    expect(skill).toContain('artifact_readiness: implementation-ready');
    expect(skill).toContain('product_contract_source: spec-brainstorm|spec-plan-bootstrap|legacy-requirements');
    expect(skill).toContain('HTML unified artifacts (`.html`) are read/reviewed in report-only mode');
  });

  test('preserves CE persona dispatch and local prompt asset contract', () => {
    const skill = read('SKILL.md');
    const subagentTemplate = read('references/subagent-template.md');

    expect(skill).toContain('Dispatch generic subagents using **bounded parallelism**');
    expect(skill).toContain('Agent` in Claude Code, `spawn_agent` in Codex');
    expect(skill).toContain('Do not dispatch standalone agents by type/name');
    expect(skill).toContain('Model tiering lives here, not in prompt assets');
    expect(skill).toContain('Selected reviewer prompt assets live under `references/personas/`');
    expect(skill).toContain('@./references/subagent-template.md');
    expect(skill).toContain('@./references/findings-schema.json');

    expect(subagentTemplate).toContain('Return ONLY valid JSON matching the findings schema below');
    expect(subagentTemplate).toContain('You are a leaf reviewer inside an already-running spec-first review workflow');
    expect(subagentTemplate).toContain('Document type: {document_type}');
    expect(subagentTemplate).toContain('Origin: {origin_path}');
    expect(subagentTemplate).toContain('product_contract_source:spec-brainstorm');
    expect(subagentTemplate).toContain('product_contract_source:spec-plan-bootstrap');
  });

  test('preserves CE synthesis, routing, and Open Questions mechanics', () => {
    const synthesis = read('references/synthesis-and-presentation.md');
    const walkthrough = read('references/walkthrough.md');
    const bulkPreview = read('references/bulk-preview.md');
    const openQuestions = read('references/open-questions-defer.md');
    const outputTemplate = read('references/review-output-template.md');

    expect(synthesis).toContain('Confidence Gate (Anchor-Based)');
    expect(synthesis).toContain('Same-Persona Premise Redundancy Collapse');
    expect(synthesis).toContain('Cross-Persona Agreement Promotion');
    expect(synthesis).toContain('Premise-Dependency Chain Linking');
    expect(synthesis).toContain('safe_auto');
    expect(synthesis).toContain('gated_auto');
    expect(synthesis).toContain('manual');
    expect(synthesis).toContain('unified-requirements');
    expect(synthesis).toContain('→ `spec-plan`');
    expect(synthesis).toContain('→ `spec-work`');

    expect(walkthrough).toContain('D. Auto-resolve with best judgment on the rest');
    expect(walkthrough).toContain('Acknowledge without applying');
    expect(walkthrough).toContain('Mirrors `spec-code-review`');
    expect(bulkPreview).toContain('Routing option B');
    expect(bulkPreview).toContain('Routing option C');
    expect(openQuestions).toContain('## Deferred / Open Questions');
    expect(outputTemplate).toContain('Use pipe-delimited markdown tables');
  });

  test('keeps reviewer personas as CE local assets with spec-first name projection only', () => {
    const personaFiles = EXPECTED_FILES.filter((file) => file.startsWith('references/personas/'));

    expect(personaFiles).toHaveLength(7);
    for (const file of personaFiles) {
      const text = read(file);
      expect(text).toContain('Document type');
      expect(text).toContain('Confidence calibration');
      expect(text).not.toContain('tools:');
      expect(text).not.toMatch(/^---/);
    }
  });

  test('removes old spec-only task-pack, eval, context-governance, and dispatch-auth contracts', () => {
    const combined = EXPECTED_FILES.map(read).join('\n');

    expect(combined).not.toContain('references/decision-primer.md');
    expect(combined).not.toContain('evals/examples.json');
    expect(combined).not.toContain('task-pack');
    expect(combined).not.toContain('dispatch_authorization_missing');
    expect(combined).not.toContain('Workflow Contract Summary');
    expect(combined).not.toContain('docs/contracts/context-governance.md');
    expect(combined).not.toContain('review-finding.v1');
    expect(combined).not.toContain('{codebase_facts}');

    expect(combined).not.toMatch(/ce-doc-review|ce-plan|ce-work|ce-code-review|ce-brainstorm|ce-unified-plan/);
    expect(combined).not.toMatch(/compound-engineering|\.compound-engineering|\/tmp\/compound-engineering/);
  });
});
