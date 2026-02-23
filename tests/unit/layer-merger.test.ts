import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { mergeLayerRules } from '../../src/core/process-engine/layer-merger.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-merger');
const L2_DIR = join(TMP, '.spec-first', 'layer2');

beforeEach(() => {
  mkdirSync(L2_DIR, { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

function writeYaml(platform: string, content: string): void {
  writeFileSync(join(L2_DIR, `${platform}.yaml`), content, 'utf-8');
}

describe('mergeLayerRules', () => {
  describe('Layer 0 baseline', () => {
    it('Mode N + Size S should produce lightest config', () => {
      const result = mergeLayerRules('N', 'S', [], TMP);
      expect(result.mode).toBe('N');
      expect(result.size).toBe('S');
      expect(result.gateConditions['01_specify']).toHaveLength(1);
      expect(result.deliverables['01_specify']).toHaveLength(1);
      expect(result.deliverables['01_specify'][0].name).toBe('spec.md');
    });
  });

  describe('Layer 1 Mode×Size', () => {
    it('Mode I should add impact-analysis and regression-report', () => {
      const result = mergeLayerRules('I', 'S', [], TMP);
      const specDel = result.deliverables['01_specify'];
      expect(specDel.some((d) => d.name === 'impact-analysis.md')).toBe(true);
      const verifyDel = result.deliverables['05_verify'];
      expect(verifyDel.some((d) => d.name === 'reports/regression-report.md')).toBe(true);
      const specGates = result.gateConditions['01_specify'];
      expect(specGates.some((g) => g.id === 'L1-MODE-I-001')).toBe(true);
    });

    it('Size M should add user-stories and data-model', () => {
      const result = mergeLayerRules('N', 'M', [], TMP);
      expect(result.deliverables['01_specify'].some((d) => d.name === 'user-stories.md')).toBe(true);
      expect(result.deliverables['02_design'].some((d) => d.name === 'data-model.md')).toBe(true);
    });

    it('Size L should add adr, risk-matrix, perf and security reports', () => {
      const result = mergeLayerRules('N', 'L', [], TMP);
      expect(result.deliverables['02_design'].some((d) => d.name === 'adr/')).toBe(true);
      expect(result.deliverables['03_plan'].some((d) => d.name === 'risk-matrix.md')).toBe(true);
      expect(result.deliverables['05_verify'].some((d) => d.name === 'reports/perf-report.md')).toBe(true);
    });
  });

  describe('Layer 2 platform YAML', () => {
    it('should AND-merge gate_conditions from platform', () => {
      writeYaml('h5', `
platform: h5
gate_conditions:
  04_implement:
    - id: L2-H5-IMPL-001
      description: "ESLint zero error"
      type: auto
`);
      const result = mergeLayerRules('N', 'S', ['h5'], TMP);
      const implGates = result.gateConditions['04_implement'];
      expect(implGates.length).toBeGreaterThan(1);
      expect(implGates.some((g) => g.id === 'L2-H5-IMPL-001')).toBe(true);
    });

    it('should dedup extra_deliverables', () => {
      writeYaml('h5', `
platform: h5
extra_deliverables:
  02_design:
    - name: responsive-spec.md
      required: true
`);
      const result = mergeLayerRules('N', 'S', ['h5'], TMP);
      const designDel = result.deliverables['02_design'];
      const count = designDel.filter((d) => d.name === 'responsive-spec.md').length;
      expect(count).toBe(1);
    });

    it('should accept string-style extra_deliverables and normalize required=false', () => {
      writeYaml('h5', `
platform: h5
extra_deliverables:
  02_design:
    - contracts/api-schema.yaml
`);
      const result = mergeLayerRules('N', 'S', ['h5'], TMP);
      const designDel = result.deliverables['02_design'];
      const found = designDel.find((d) => d.name === 'contracts/api-schema.yaml');
      expect(found).toBeDefined();
      expect(found?.required).toBe(false);
    });

    it('should take stricter threshold (higher_is_better)', () => {
      writeYaml('h5', `
platform: h5
quality_thresholds:
  code_coverage_min:
    value: 80
    direction: higher_is_better
`);
      writeYaml('backend', `
platform: backend
quality_thresholds:
  code_coverage_min:
    value: 90
    direction: higher_is_better
`);
      const result = mergeLayerRules('N', 'S', ['h5', 'backend'], TMP);
      expect(result.thresholds['code_coverage_min'].value).toBe(90);
    });

    it('should take stricter threshold (lower_is_better)', () => {
      writeYaml('h5', `
platform: h5
quality_thresholds:
  bundle_size_kb:
    value: 500
    direction: lower_is_better
`);
      writeYaml('backend', `
platform: backend
quality_thresholds:
  bundle_size_kb:
    value: 300
    direction: lower_is_better
`);
      const result = mergeLayerRules('N', 'S', ['h5', 'backend'], TMP);
      expect(result.thresholds['bundle_size_kb'].value).toBe(300);
    });

    it('should throw when platform YAML missing', () => {
      expect(() => mergeLayerRules('N', 'S', ['nonexistent'], TMP))
        .toThrow(/未找到平台 YAML/);
    });

    it('should infer direction from key name when missing', () => {
      writeYaml('h5', `
platform: h5
quality_thresholds:
  max_latency_ms:
    value: 200
`);
      const result = mergeLayerRules('N', 'S', ['h5'], TMP);
      expect(result.thresholds['max_latency_ms'].direction).toBe('lower_is_better');
    });

    it('should parse numeric strings with units in thresholds', () => {
      writeYaml('h5', `
platform: h5
quality_thresholds:
  bundle_size_main:
    value: 200kb
    direction: lower_is_better
  pass_rate:
    value: 99.5%
    direction: higher_is_better
`);
      const result = mergeLayerRules('N', 'S', ['h5'], TMP);
      expect(result.thresholds['bundle_size_main'].value).toBe(200);
      expect(result.thresholds['pass_rate'].value).toBe(99.5);
    });

    it('should throw when required platform field missing', () => {
      writeYaml('h5', `
gate_conditions:
  04_implement:
    - id: L2-H5-IMPL-001
      description: "ESLint zero error"
`);
      expect(() => mergeLayerRules('N', 'S', ['h5'], TMP))
        .toThrow(/platform.*必填/);
    });

    it('should throw when threshold direction is invalid', () => {
      writeYaml('h5', `
platform: h5
quality_thresholds:
  code_coverage_min:
    value: 90
    direction: upward
`);
      expect(() => mergeLayerRules('N', 'S', ['h5'], TMP))
        .toThrow(/direction 无效/);
    });
  });
});
