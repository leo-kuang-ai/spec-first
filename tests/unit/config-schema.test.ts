import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  DEFAULT_SPEC_FIRST_CONFIG,
  getConfigValue,
  loadConfig,
  renderDefaultConfigYaml,
  resetConfigCache,
} from '../../src/shared/config-schema.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-config');
const SPEC_DIR = join(TMP, '.spec-first');

beforeEach(() => {
  mkdirSync(SPEC_DIR, { recursive: true });
  resetConfigCache();
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  resetConfigCache();
});

describe('loadConfig', () => {
  it('should return defaults when config.yaml missing', () => {
    const cfg = loadConfig(TMP);
    expect(cfg.catchup.trigger).toBe('prompt');
    expect(cfg.context.token_budget).toBe(16000);
    expect(cfg.runtime.max_iterations).toBe(5);
    expect(cfg.gate.pilot_mode).toBe(false);
  });

  it('should merge user values with defaults', () => {
    writeFileSync(join(SPEC_DIR, 'config.yaml'), 'gate:\n  pilot_mode: false\n', 'utf-8');
    const cfg = loadConfig(TMP);
    expect(cfg.gate.pilot_mode).toBe(false);
    expect(cfg.catchup.trigger).toBe('prompt');
  });

  it('should reject out-of-range token_budget', () => {
    writeFileSync(join(SPEC_DIR, 'config.yaml'), 'context:\n  token_budget: 100\n', 'utf-8');
    expect(() => loadConfig(TMP)).toThrow('token_budget must be 8000-64000');
  });

  it('should reject out-of-range runtime.max_iterations', () => {
    writeFileSync(join(SPEC_DIR, 'config.yaml'), 'runtime:\n  max_iterations: 100\n', 'utf-8');
    expect(() => loadConfig(TMP)).toThrow('runtime.max_iterations must be 1-20');
  });
});

describe('getConfigValue', () => {
  it('should return typed config section', () => {
    const cfg = loadConfig(TMP);
    const gate = getConfigValue(cfg, 'gate');
    expect(gate.pilot_mode).toBe(false);
  });
});

describe('renderDefaultConfigYaml', () => {
  it('should render yaml from shared defaults', () => {
    const rendered = renderDefaultConfigYaml();
    expect(rendered).toContain('pilot_mode: false');
    expect(rendered).toContain(`token_budget: ${DEFAULT_SPEC_FIRST_CONFIG.context.token_budget}`);
    expect(rendered).toContain(`trigger: ${DEFAULT_SPEC_FIRST_CONFIG.catchup.trigger}`);
  });
});
