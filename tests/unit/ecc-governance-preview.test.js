'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  DEFAULT_OUTPUT_DIR,
  buildAll,
  buildCommandIdeaMatrix,
  buildCurrentAgentInventory,
  buildEccAgentOverlapMatrix,
  buildRubricExtractionMatrix,
  writeAll,
} = require('../../scripts/generate-ecc-governance-preview');

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function createFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ecc-governance-preview-'));
  const agentsDir = path.join(root, 'repo', 'agents');
  const eccRoot = path.join(root, 'everything-claude-code');

  writeFile(path.join(agentsDir, 'spec-correctness-reviewer.agent.md'), [
    '---',
    'name: spec-correctness-reviewer',
    'description: Correctness reviewer',
    'tools: Read, Grep',
    '---',
    '# Correctness',
    'Return findings as JSON matching the findings schema.',
  ].join('\n'));
  writeFile(path.join(agentsDir, 'spec-kieran-typescript-reviewer.agent.md'), [
    '---',
    'name: spec-kieran-typescript-reviewer',
    'description: TypeScript reviewer',
    'tools: Read, Grep',
    '---',
    '# TypeScript',
  ].join('\n'));
  writeFile(path.join(agentsDir, 'spec-dhh-rails-reviewer.agent.md'), [
    '---',
    'name: spec-dhh-rails-reviewer',
    'description: Rails style profile',
    'tools: Read',
    '---',
    '# Rails',
  ].join('\n'));

  writeFile(path.join(eccRoot, 'agents', 'code-reviewer.md'), [
    '---',
    'name: code-reviewer',
    'description: Code reviewer',
    '---',
    '# Code Reviewer',
  ].join('\n'));
  writeFile(path.join(eccRoot, 'agents', 'seo-specialist.md'), [
    '---',
    'name: seo-specialist',
    'description: SEO specialist',
    '---',
    '# SEO',
  ].join('\n'));

  writeFile(path.join(eccRoot, 'skills', 'security-review', 'SKILL.md'), [
    '---',
    'name: security-review',
    'description: Security review',
    '---',
    '# Security Review',
  ].join('\n'));
  writeFile(path.join(eccRoot, 'skills', 'healthcare-phi-compliance', 'SKILL.md'), [
    '---',
    'name: healthcare-phi-compliance',
    'description: Healthcare compliance',
    '---',
    '# Healthcare',
  ].join('\n'));

  writeFile(path.join(eccRoot, 'commands', 'code-review.md'), '# Code Review\n');
  writeFile(path.join(eccRoot, 'commands', 'jira.md'), '# Jira\n');
  writeFile(path.join(eccRoot, 'commands', 'python-review.md'), '# Python Review\n');

  return { root, agentsDir, eccRoot };
}

describe('ECC governance preview generator', () => {
  test('builds inventory, overlap, rubric, and command preview facts without runtime delivery', () => {
    const fixture = createFixture();
    const options = { agentsDir: fixture.agentsDir, eccRoot: fixture.eccRoot };

    const inventory = buildCurrentAgentInventory(options);
    const overlap = buildEccAgentOverlapMatrix(options);
    const rubric = buildRubricExtractionMatrix(options);
    const commands = buildCommandIdeaMatrix(options);
    const all = buildAll(options);

    expect(inventory.agent_count).toBe(3);
    expect(inventory.agents.find((agent) => agent.id === 'spec-kieran-typescript-reviewer').classification).toMatchObject({
      canonical_id: 'typescript-expert',
      integration_action: 'rename_generic',
      overlap_status: 'partial_match',
    });
    expect(inventory.agents.find((agent) => agent.id === 'spec-dhh-rails-reviewer').classification).toMatchObject({
      canonical_id: 'rails-style-profile-dhh',
      integration_action: 'optional_profile',
      overlap_status: 'style_profile',
    });

    expect(overlap.ecc_agent_count).toBe(2);
    expect(overlap.entries.find((entry) => entry.ecc_agent === 'code-reviewer')).toMatchObject({
      overlap_status: 'direct_match',
      integration_action: 'enhance_existing',
    });
    expect(overlap.entries.find((entry) => entry.ecc_agent === 'seo-specialist')).toMatchObject({
      integration_action: 'reference_only',
      priority: 'P3',
    });

    expect(rubric.entries.find((entry) => entry.ecc_skill === 'security-review')).toMatchObject({
      loaded_from: 'provider_source',
      freshness: 'current_source_read',
      runtime_cached: false,
    });
    expect(rubric.entries.find((entry) => entry.ecc_skill === 'healthcare-phi-compliance')).toMatchObject({
      adoption_action: 'rejected',
      quality_node: 'Excluded Domain Reference',
    });

    expect(commands.entries.map((entry) => entry.adoption_action).sort()).toEqual([
      'enhance_existing_workflow',
      'reference_only',
      'rejected',
    ]);
    expect(commands.forbidden_outputs).toEqual(expect.arrayContaining(['/ecc:*', '$ecc-*']));
    expect(all['agent-registry.json'].runtime_delivery).toBe('none_in_v1');
    expect(all['router-candidate-policy.json'].router_output_schema).not.toHaveProperty('selected_agents');
  });

  test('fails fast when required source directories are missing', () => {
    const fixture = createFixture();
    const missingRoot = path.join(fixture.root, 'missing-ecc-source');

    expect(() => buildEccAgentOverlapMatrix({
      agentsDir: fixture.agentsDir,
      eccRoot: missingRoot,
    })).toThrow(/ECC agents directory not found/);
  });

  test('fails fast when source agent ids are duplicated', () => {
    const fixture = createFixture();
    writeFile(path.join(fixture.agentsDir, 'spec-duplicate-correctness.agent.md'), [
      '---',
      'name: spec-correctness-reviewer',
      'description: Duplicate correctness reviewer',
      '---',
      '# Duplicate',
    ].join('\n'));

    expect(() => buildCurrentAgentInventory({
      agentsDir: fixture.agentsDir,
      eccRoot: fixture.eccRoot,
    })).toThrow(/agent ids must be unique: spec-correctness-reviewer/);
  });

  test('writes the complete G0-G6.5 preview artifact set', () => {
    const fixture = createFixture();
    const outputDir = path.join(fixture.root, 'generated');
    const { artifacts } = writeAll({
      agentsDir: fixture.agentsDir,
      eccRoot: fixture.eccRoot,
      outputDir,
    });

    [
      'current-agent-inventory.json',
      'ecc-agent-overlap-matrix.json',
      'ecc-rubric-extraction-matrix.json',
      'ecc-command-idea-matrix.json',
      'agent-packs.json',
      'agent-registry.json',
      'router-candidate-policy.json',
      'context-pack.schema.json',
      'finding-compatibility-policy.json',
      'synthesis-policy.json',
      'capability-host-compatibility.md',
      'capability-runtime-merge-policy.md',
      'completion-audit.md',
    ].forEach((fileName) => {
      expect(fs.existsSync(path.join(outputDir, fileName))).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(artifacts, fileName)).toBe(true);
    });

    const audit = JSON.parse(fs.readFileSync(path.join(outputDir, 'completion-audit.json'), 'utf8'));
    expect(audit.review_round_count).toBe(50);
    expect(audit.review_rounds).toHaveLength(50);
    expect(audit.prompt_to_artifact_checklist.map((entry) => entry.requirement)).toContain('G6.5 host compatibility + runtime merge policy preview');
  });

  test('checked-in generated preview artifacts keep runtime and router boundaries explicit', () => {
    [
      'current-agent-inventory.json',
      'ecc-agent-overlap-matrix.json',
      'ecc-rubric-extraction-matrix.json',
      'ecc-command-idea-matrix.json',
      'agent-packs.json',
      'agent-registry.json',
      'router-candidate-policy.json',
      'context-pack.schema.json',
      'finding-compatibility-policy.json',
      'synthesis-policy.json',
      'quality-gates.json',
      'node-quality-pilot-scenarios.json',
      'completion-audit.json',
    ].forEach((fileName) => {
      expect(fs.existsSync(path.join(DEFAULT_OUTPUT_DIR, fileName))).toBe(true);
    });

    const registry = JSON.parse(fs.readFileSync(path.join(DEFAULT_OUTPUT_DIR, 'agent-registry.json'), 'utf8'));
    const router = JSON.parse(fs.readFileSync(path.join(DEFAULT_OUTPUT_DIR, 'router-candidate-policy.json'), 'utf8'));
    const commands = JSON.parse(fs.readFileSync(path.join(DEFAULT_OUTPUT_DIR, 'ecc-command-idea-matrix.json'), 'utf8'));
    const audit = JSON.parse(fs.readFileSync(path.join(DEFAULT_OUTPUT_DIR, 'completion-audit.json'), 'utf8'));

    expect(registry.runtime_delivery).toBe('none_in_v1');
    expect(registry.stale_policy).toBe('source_wins_registry_is_preview_snapshot');
    expect(router.router_output_schema).not.toHaveProperty('selected_agents');
    expect(router.forbidden_fields).toContain('selected_agents');
    expect(commands.forbidden_outputs).toEqual(expect.arrayContaining([
      '/ecc:*',
      '$ecc-*',
      'templates/commands/ecc-*',
      'runtime command registry entry',
    ]));
    expect(audit.review_round_count).toBe(50);
    expect(audit.review_rounds).toHaveLength(50);
  });
});
