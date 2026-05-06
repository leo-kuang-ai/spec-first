'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { validateAgainstSchema } = require('../../src/contracts/schema-validator');

const REPO_ROOT = path.join(__dirname, '..', '..');
const CONTRACT_DIR = path.join(REPO_ROOT, 'src', 'cli', 'contracts', 'agent-registry');
const GENERATED_DIR = path.join(REPO_ROOT, 'docs', '02-架构设计', 'ECC集成', 'generated');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function uniqueValues(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

describe('ECC agent registry contracts', () => {
  test('V2 source schemas validate the checked-in governance preview artifacts', () => {
    [
      ['agent-registry.schema.json', 'agent-registry.json'],
      ['agent-packs.schema.json', 'agent-packs.json'],
      ['routing-policy.schema.json', 'router-candidate-policy.json'],
      ['finding.schema.json', 'finding-compatibility-policy.json'],
    ].forEach(([schemaName, artifactName]) => {
      const schema = readJson(path.join(CONTRACT_DIR, schemaName));
      const artifact = readJson(path.join(GENERATED_DIR, artifactName));

      expect(validateAgainstSchema(schema, artifact).errors).toEqual([]);
    });
  });

  test('registry and packs stay internally consistent without becoming runtime delivery', () => {
    const registry = readJson(path.join(GENERATED_DIR, 'agent-registry.json'));
    const packs = readJson(path.join(GENERATED_DIR, 'agent-packs.json'));
    const registryEntries = registry.entries;
    const packEntries = packs.packs;
    const registryIds = registryEntries.map((entry) => entry.id);
    const packIds = packEntries.map((pack) => pack.id);

    expect(registry.entry_count).toBe(registryEntries.length);
    expect(packs.pack_count).toBe(packEntries.length);
    expect(uniqueValues(registryIds)).toHaveLength(registryIds.length);
    expect(uniqueValues(packIds)).toHaveLength(packIds.length);
    expect(registry.runtime_delivery).toBe('none_in_v1');
    expect(packEntries.every((pack) => pack.runtime_delivery === 'none_in_v1')).toBe(true);

    for (const entry of registryEntries) {
      expect(fs.existsSync(path.join(REPO_ROOT, entry.source_file))).toBe(true);
      expect(entry.forbidden_actions).toEqual(expect.arrayContaining([
        'write_files',
        'modify_repo_profile',
        'change_workflow_state',
        'generate_runtime_asset',
      ]));

      for (const packId of entry.packs) {
        expect(packIds).toContain(packId);
      }

      if (entry.packs.length > 0) {
        expect(entry.pack).toBe(entry.packs[0]);
        expect(entry.no_pack_reason).toBeNull();
      } else {
        expect(entry.pack).toBeNull();
        expect(entry.no_pack_reason).toEqual(expect.any(String));
      }
    }

    for (const pack of packEntries) {
      for (const agentId of pack.agents) {
        expect(registryIds).toContain(agentId);
      }
    }
  });

  test('router and finding contracts preserve Skill ownership boundaries', () => {
    const router = readJson(path.join(GENERATED_DIR, 'router-candidate-policy.json'));
    const finding = readJson(path.join(GENERATED_DIR, 'finding-compatibility-policy.json'));

    expect(router.owner_boundary).toBe('scripts_prepare_candidate_facts_llm_skill_decides');
    expect(router.router_output_schema).toHaveProperty('candidate_agents');
    expect(router.router_output_schema).not.toHaveProperty('selected_agents');
    expect(router.forbidden_fields).toEqual(expect.arrayContaining([
      'selected_agents',
      'final_verdict',
      'confirmed_standards_write',
    ]));

    expect(finding.boundary).toBe('workflow_native_schema_wins');
    expect(finding.finding_core_fields).toEqual(expect.arrayContaining([
      'severity',
      'confidence',
      'evidence',
      'not_reviewed',
    ]));
    expect(finding.preserve_native_fields).toEqual(expect.arrayContaining([
      'autofix_class',
      'owner',
      'deferred_questions',
    ]));
  });

  test('non-R&D ECC domains remain excluded from capability packs', () => {
    const packs = readJson(path.join(GENERATED_DIR, 'agent-packs.json'));
    const packedAgentText = packs.packs
      .flatMap((pack) => pack.agents)
      .join('\n');

    expect(packs.excluded_domain_references).toEqual(expect.arrayContaining([
      'business operations',
      'media/growth',
      'finance',
      'logistics',
      'healthcare',
      'web3',
    ]));
    expect(packedAgentText).not.toMatch(/seo|media|healthcare|web3|logistics|finance/i);
  });
});
