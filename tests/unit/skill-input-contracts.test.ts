import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  loadSkillInputContractsConfig,
  getSkillInputContract,
  shouldInjectInputContext,
  getAssetDescription,
  clearConfigCache,
  resolveSkillsRoot,
  type SkillInputContractsConfig,
} from '../../src/core/skill-runtime/skill-input-contracts.js';

const TEST_DIR = join(import.meta.dirname, '__test_skill_contracts__');
const CONFIG_PATH = join(TEST_DIR, 'skill-input-contracts.yaml');
const REPO_SKILLS_ROOT = join(import.meta.dirname, '../../skills');
const FLAT_SKILLS_ROOT = join(TEST_DIR, 'skills');

function createTestConfig(content: string): void {
  mkdirSync(TEST_DIR, { recursive: true });
  writeFileSync(CONFIG_PATH, content, 'utf-8');
}

function cleanup(): void {
  clearConfigCache();
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
}

describe('skill-input-contracts', () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  describe('loadSkillInputContractsConfig', () => {
    it('should return default config when file does not exist', () => {
      const config = loadSkillInputContractsConfig('/nonexistent/path');
      expect(config.auto_inject).toBe(true);
      expect(config.skip_injection).toContain('first');
      expect(config.skip_injection).toContain('init');
      expect(config.defaults.required).toContain('summary');
    });

    it('should load config from yaml file', () => {
      createTestConfig(`
auto_inject: false
skip_injection:
  - first
  - init
  - custom
defaults:
  required: [summary]
  recommended: []
  optional: []
descriptions:
  summary: 测试描述
skills:
  code:
    required: [summary]
    recommended: [conventions]
    optional: [api-contracts]
`);
      const config = loadSkillInputContractsConfig(TEST_DIR);
      expect(config.auto_inject).toBe(false);
      expect(config.skip_injection).toContain('custom');
      expect(config.descriptions['summary']).toBe('测试描述');
      expect(config.skills['code']).toBeDefined();
      expect(config.skills['code'].required).toContain('summary');
      expect(config.skills['code'].recommended).toContain('conventions');
    });

    it('should cache config after first load', () => {
      createTestConfig(`
auto_inject: true
skills:
  test:
    required: [a]
    recommended: []
    optional: []
`);
      const config1 = loadSkillInputContractsConfig(TEST_DIR);
      const config2 = loadSkillInputContractsConfig(TEST_DIR);
      expect(config1).toBe(config2);
    });

    it('should merge with defaults for partial config', () => {
      createTestConfig(`
skills:
  test:
    required: [x]
    recommended: []
    optional: []
`);
      const config = loadSkillInputContractsConfig(TEST_DIR);
      expect(config.auto_inject).toBe(true); // default
      expect(config.skip_injection).toContain('first'); // default
      expect(config.skills['test'].required).toContain('x');
    });
  });

  describe('resolveSkillsRoot', () => {
    it('should resolve the flat skills root', () => {
      expect(resolveSkillsRoot()).toBe(REPO_SKILLS_ROOT);
    });
  });

  describe('getSkillInputContract', () => {
    it('should return skill-specific config when defined', () => {
      createTestConfig(`
skills:
  code:
    required: [summary]
    recommended: [conventions]
    optional: [api-contracts]
`);
      const contract = getSkillInputContract('code', TEST_DIR);
      expect(contract.required).toContain('summary');
      expect(contract.recommended).toContain('conventions');
      expect(contract.optional).toContain('api-contracts');
    });

    it('should return defaults when skill not defined', () => {
      createTestConfig(`
defaults:
  required: [default-required]
  recommended: []
  optional: []
skills:
  other:
    required: [x]
    recommended: []
    optional: []
`);
      const contract = getSkillInputContract('undefined-skill', TEST_DIR);
      expect(contract.required).toContain('default-required');
    });

    it('should match the flat-root strategy for key skills', () => {
      mkdirSync(FLAT_SKILLS_ROOT, { recursive: true });
      writeFileSync(
        join(FLAT_SKILLS_ROOT, 'skill-input-contracts.yaml'),
        `
auto_inject: true
skip_injection:
  - first
  - init
defaults:
  required: [summary]
  recommended: []
  optional: []
skills:
  focus-requirements:
    required: [summary]
    recommended: [domain-model, critical-flows, conventions]
    optional: [entry-guide]
  feature:
    required: []
    recommended: []
    optional: [summary]
  archive:
    required: [summary]
    recommended: [structure-overview, domain-model]
    optional: []
  status:
    required: []
    recommended: [summary]
    optional: [critical-flows, structure-overview, domain-model]
  sync:
    required: []
    recommended: [summary]
    optional: [entry-guide, structure-overview, api-contracts]
`,
        'utf-8'
      );

      const focusRequirements = getSkillInputContract('focus-requirements', FLAT_SKILLS_ROOT);
      expect(focusRequirements).toEqual({
        required: ['summary'],
        recommended: ['domain-model', 'critical-flows', 'conventions'],
        optional: ['entry-guide'],
      });

      const feature = getSkillInputContract('feature', FLAT_SKILLS_ROOT);
      expect(feature).toEqual({
        required: [],
        recommended: [],
        optional: ['summary'],
      });

      const archive = getSkillInputContract('archive', FLAT_SKILLS_ROOT);
      expect(archive).toEqual({
        required: ['summary'],
        recommended: ['structure-overview', 'domain-model'],
        optional: [],
      });

      const status = getSkillInputContract('status', FLAT_SKILLS_ROOT);
      expect(status).toEqual({
        required: [],
        recommended: ['summary'],
        optional: ['critical-flows', 'structure-overview', 'domain-model'],
      });

      const sync = getSkillInputContract('sync', FLAT_SKILLS_ROOT);
      expect(sync).toEqual({
        required: [],
        recommended: ['summary'],
        optional: ['entry-guide', 'structure-overview', 'api-contracts'],
      });
    });
  });

  describe('shouldInjectInputContext', () => {
    it('should return false when auto_inject is false', () => {
      createTestConfig(`
auto_inject: false
skip_injection: []
`);
      expect(shouldInjectInputContext('code', TEST_DIR)).toBe(false);
    });

    it('should return false for skills in skip_injection list', () => {
      createTestConfig(`
auto_inject: true
skip_injection:
  - first
  - init
`);
      expect(shouldInjectInputContext('first', TEST_DIR)).toBe(false);
      expect(shouldInjectInputContext('init', TEST_DIR)).toBe(false);
      expect(shouldInjectInputContext('code', TEST_DIR)).toBe(true);
    });

    it('should return true for skills not in skip_injection', () => {
      createTestConfig(`
auto_inject: true
skip_injection:
  - first
`);
      expect(shouldInjectInputContext('code', TEST_DIR)).toBe(true);
      expect(shouldInjectInputContext('design', TEST_DIR)).toBe(true);
    });
  });

  describe('getAssetDescription', () => {
    it('should return description when defined', () => {
      createTestConfig(`
descriptions:
  summary: 项目概览
  conventions: 编码规范
`);
      expect(getAssetDescription('summary', TEST_DIR)).toBe('项目概览');
      expect(getAssetDescription('conventions', TEST_DIR)).toBe('编码规范');
    });

    it('should return asset name when description not defined', () => {
      createTestConfig(`
descriptions:
  summary: 项目概览
`);
      expect(getAssetDescription('undefined-asset', TEST_DIR)).toBe('undefined-asset');
    });
  });

  describe('clearConfigCache', () => {
    it('should clear cached config', () => {
      createTestConfig(`
auto_inject: true
`);
      const config1 = loadSkillInputContractsConfig(TEST_DIR);
      clearConfigCache();
      const config2 = loadSkillInputContractsConfig(TEST_DIR);
      expect(config1).not.toBe(config2);
    });
  });
});
