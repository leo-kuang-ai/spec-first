'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..', '..');
const SKILL_ROOT = path.join(REPO_ROOT, 'skills', 'spec-brainstorm');

const EXPECTED_FILES = [
  'SKILL.md',
  'references/agents/repo-profiler.md',
  'references/agents/slack-researcher.md',
  'references/blindspot-pass.md',
  'references/brainstorm-sections.md',
  'references/handoff.md',
  'references/html-rendering.md',
  'references/markdown-rendering.md',
  'references/model-tiers.md',
  'references/product-pressure-test.md',
  'references/repo-profile-cache.md',
  'references/synthesis-summary.md',
  'references/universal-brainstorming.md',
  'references/verdict-routing.md',
  'references/visual-probes.md',
  'scripts/repo-profile-cache.py',
  'scripts/visual-probe-server.js',
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

describe('spec-brainstorm CE-first projection contract', () => {
  test('keeps the CE-derived file surface without legacy spec-only fixtures', () => {
    expect(listFiles()).toEqual(EXPECTED_FILES);
  });

  test('publishes requirements-only unified plan artifacts under docs/plans', () => {
    const skill = read('SKILL.md');
    const sections = read('references/brainstorm-sections.md');
    const markdown = read('references/markdown-rendering.md');
    const html = read('references/html-rendering.md');

    expect(skill).toContain('requirements-only unified plan');
    expect(skill).toContain('docs/plans/YYYY-MM-DD-NNN-<type>-<topic>-plan.<md|html>');
    expect(skill).toContain('artifact_contract: spec-unified-plan/v1');
    expect(skill).toContain('artifact_readiness: requirements-only');
    expect(skill).toContain('product_contract_source: spec-brainstorm');
    expect(skill).toContain('Historical `docs/brainstorms/*-requirements.{md,html}` files remain legacy inputs');
    expect(skill).toContain('new `spec-brainstorm` outputs do not write there');

    expect(sections).toContain('New `spec-brainstorm` outputs live under `docs/plans/`');
    expect(sections).toContain('Historical `docs/brainstorms/*-requirements.*` files remain valid legacy inputs');
    expect(sections).toContain('Do not migrate or rewrite them when creating new artifacts.');
    expect(markdown).toContain('Requirements-only artifacts omit the plan-only sections');
    expect(html).toContain('The HTML artifact is the *only* artifact the skill produces for that run');
  });

  test('uses exclusive output mode and spec-first config/runtime paths', () => {
    const combined = EXPECTED_FILES.map(read).join('\n');

    expect(combined).toContain('OUTPUT_FORMAT');
    expect(combined).toContain('output mode is **exclusive**');
    expect(combined).toContain('markdown OR HTML, never both');
    expect(combined).toContain('.spec-first/config.local.yaml');
    expect(combined).toContain('/tmp/spec-first/spec-brainstorm');
    expect(combined).toContain('/tmp/spec-first/repo-profile');
    expect(combined).toContain('SPEC_FIRST_VISUAL_PROBE_IDLE_TIMEOUT_MS');
    expect(combined).toContain('ai:spec-first');
    expect(combined).toContain('Spec-First');

    expect(combined).not.toMatch(/ce-brainstorm|ce-plan|ce-work|ce-doc-review|ce-pov|ce-proof|ce-explain/);
    expect(combined).not.toMatch(/ce-compound|ce-compound-refresh|ce-unified-plan/);
    expect(combined).not.toMatch(/compound-engineering|\.compound-engineering|\/tmp\/compound-engineering/);
    expect(combined).not.toContain('ai:compound-engineering');
    expect(combined).not.toContain('Compound Engineering');
  });

  test('preserves CE-first handoff and helper integration after projection', () => {
    const skill = read('SKILL.md');
    const handoff = read('references/handoff.md');
    const synthesis = read('references/synthesis-summary.md');
    const verdictRouting = read('references/verdict-routing.md');
    const visualServer = read('scripts/visual-probe-server.js');

    expect(skill).toContain('Brainstorming helps answer **WHAT**');
    expect(skill).toContain('precedes `spec-plan`');
    expect(skill).toContain('read `references/synthesis-summary.md`');
    expect(skill).toContain('read `references/brainstorm-sections.md`');
    expect(skill).toContain('read `references/handoff.md`');
    expect(handoff).toContain('Immediately load the `spec-plan` skill');
    expect(handoff).toContain('Load the `spec-doc-review` skill');
    expect(handoff).toContain('Load the `spec-proof` skill');
    expect(handoff).toContain('Recommended next step: `spec-plan <plan artifact path>`');
    expect(synthesis).toContain('planning agent does not invent WHAT');
    expect(verdictRouting).toContain('spec-pov');
    expect(visualServer).toContain('Spec-First Brainstorm Visual Probe');
  });
});
