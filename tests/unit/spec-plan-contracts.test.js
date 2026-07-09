'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ClaudeAdapter = require('../../src/cli/adapters/claude');
const CodexAdapter = require('../../src/cli/adapters/codex');
const { planBundledAssetSync } = require('../../src/cli/plugin');

const REPO_ROOT = path.join(__dirname, '..', '..');
const CE_PLAN_ROOT = '/Users/kuang/xiaobu/compound-engineering-plugin/skills/ce-plan';
const SPEC_PLAN_ROOT = path.join(REPO_ROOT, 'skills', 'spec-plan');
const SKILL_PATH = path.join(SPEC_PLAN_ROOT, 'SKILL.md');

function read(relativePath) {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');
}

function listFiles(root) {
  const files = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === '__pycache__') {
          continue;
        }
        walk(absolute);
      } else {
        files.push(path.relative(root, absolute).split(path.sep).join('/'));
      }
    }
  }
  walk(root);
  return files.sort();
}

function plannedRuntimeContent(adapter, targetPath) {
  const projectRoot = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'spec-plan-contract-'));
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

describe('spec-plan CE-first migration contract', () => {
  test('keeps the spec-plan source file set aligned with CE ce-plan', () => {
    const ceFiles = listFiles(CE_PLAN_ROOT);
    const specFiles = listFiles(SPEC_PLAN_ROOT);

    expect(specFiles).toEqual(ceFiles);
    expect(specFiles).toContain('SKILL.md');
    expect(specFiles).toContain('references/plan-sections.md');
    expect(specFiles).toContain('references/plan-handoff.md');
    expect(specFiles).toContain('references/approach-altitude.md');
    expect(specFiles).toContain('references/agents/repo-research-analyst.md');
    expect(specFiles).toContain('scripts/repo-profile-cache.py');
    expect(specFiles).not.toContain('evals/examples.json');
    expect(specFiles).not.toContain('references/planning-flow.md');
    expect(specFiles).not.toContain('references/governance-boundaries.md');
    expect(specFiles).not.toContain('references/enterprise-plan-review.md');
    expect(specFiles).not.toContain('references/reuse-analysis.md');
  });

  test('projects CE entrypoints, paths, and artifact contract into spec-first names', () => {
    const allSource = listFiles(SPEC_PLAN_ROOT)
      .map((file) => fs.readFileSync(path.join(SPEC_PLAN_ROOT, file), 'utf8'))
      .join('\n');
    const skill = read('skills/spec-plan/SKILL.md');
    const sections = read('skills/spec-plan/references/plan-sections.md');
    const handoff = read('skills/spec-plan/references/plan-handoff.md');

    expect(skill).toContain('name: spec-plan');
    expect(skill).toContain('prefer spec-brainstorm for exploratory framing');
    expect(skill).toContain('`spec-brainstorm` defines **WHAT**');
    expect(skill).toContain('`spec-plan` enriches that same artifact');
    expect(skill).toContain('`spec-work` executes implementation-ready plans');
    expect(skill).toContain('<repo-root>/.spec-first/config.local.yaml');
    expect(skill).toContain('artifact_contract: spec-unified-plan/v1');
    expect(skill).toContain('product_contract_source: spec-brainstorm');
    expect(skill).toContain('product_contract_source: spec-plan-bootstrap');
    expect(sections).toContain('`artifact_contract: spec-unified-plan/v1`');
    expect(sections).toContain('`spec-plan` writes the canonical spec-first plan artifact');
    expect(sections).toContain('`spec-brainstorm`, `spec-plan-bootstrap`, `legacy-requirements`');
    expect(handoff).toContain('Run the `spec-doc-review` skill with `mode:headless`');
    expect(handoff).toContain('Start `/spec-work`');
    expect(handoff).toContain('Open in browser');
    expect(handoff).toContain('Load the `spec-proof` skill to publish the plan');
    expect(handoff).toContain('identity: `ai:spec-first` / `Spec-First`');

    expect(allSource).not.toMatch(/\bce-[a-z]/);
    expect(allSource).not.toMatch(/\/ce-[a-z]/);
    expect(allSource).not.toContain('ce-unified-plan/v1');
    expect(allSource).not.toContain('.compound-engineering');
    expect(allSource).not.toContain('/tmp/compound-engineering');
    expect(allSource).not.toContain('Compound Engineering');
    expect(allSource).not.toContain('CLAUDE_SKILL_DIR');
  });

  test('preserves CE planning behavior that downstream workflows rely on', () => {
    const skill = read('skills/spec-plan/SKILL.md');
    const approach = read('skills/spec-plan/references/approach-altitude.md');
    const deepening = read('skills/spec-plan/references/deepening-workflow.md');
    const synthesis = read('skills/spec-plan/references/synthesis-summary.md');
    const universal = read('skills/spec-plan/references/universal-planning.md');

    expect(skill).toContain('Every normal interactive `spec-plan` branch that produces a plan artifact or checkpoint is incomplete until its owning handoff question is presented');
    expect(skill).toContain('A requirements-only unified plan is not a resume target');
    expect(skill).toContain('#### 0.1a Recognize Approach-Altitude Requests');
    expect(skill).toContain('#### 0.1b Classify Task Domain');
    expect(skill).toContain('### Phase 5: Final Review, Write File, and Handoff');
    expect(approach).toContain('produce a grounded **approach-plan**');
    expect(approach).toContain('routes to `spec-work`\'s carve-out');
    expect(deepening).toContain('This file contains the confidence-check execution path');
    expect(deepening).toContain('read `references/agents/<name>.md` and seed a generic subagent');
    expect(synthesis).toContain('Solo variant');
    expect(synthesis).toContain('Brainstorm-sourced variant');
    expect(synthesis).toContain('Headless mode');
    expect(universal).toContain('This file is loaded when spec-plan detects a non-software task');
    expect(universal).toContain('Universal-planning outputs are not software implementation plans');
  });

  test('keeps repo-profile cache deterministic and anchored to the loaded skill directory', () => {
    const skill = read('skills/spec-plan/SKILL.md');
    const reference = read('skills/spec-plan/references/repo-profile-cache.md');
    const script = read('skills/spec-plan/scripts/repo-profile-cache.py');

    expect(skill).toContain('Set `SKILL_DIR` to this skill\'s directory and run the helper');
    expect(skill).toContain('python3 "$SKILL_DIR/scripts/repo-profile-cache.py" get');
    expect(reference).toContain('/tmp/spec-first/repo-profile/<root-sha>/<head-sha>.json');
    expect(reference).toContain('SKILL_DIR="<absolute path of this skill\'s directory>"');
    expect(script).toContain('CACHE_ROOT = "/tmp/spec-first/repo-profile"');
    expect(script).toContain('degrades to NO-CACHE/MISS and exits 0');
  });

  test('runtime projection preserves skill-local relative reference paths', () => {
    const claudeSkill = plannedRuntimeContent(
      new ClaudeAdapter(),
      '.claude/spec-first/workflows/spec-plan/SKILL.md',
    );
    const codexSkill = plannedRuntimeContent(
      new CodexAdapter(),
      '.agents/skills/spec-plan/SKILL.md',
    );

    expect(claudeSkill).toContain('read `references/markdown-rendering.md`');
    expect(claudeSkill).toContain('read `references/html-rendering.md`');
    expect(claudeSkill).not.toContain('read `skills/spec-plan/references/markdown-rendering.md`');
    expect(codexSkill).toContain('read `references/markdown-rendering.md`');
    expect(codexSkill).toContain('read `references/html-rendering.md`');
    expect(codexSkill).not.toContain('read `skills/spec-plan/references/markdown-rendering.md`');
  });
});
