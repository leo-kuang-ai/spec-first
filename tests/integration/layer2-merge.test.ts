import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { mergeLayerRules } from '../../src/core/process-engine/layer-merger.js';
import type { Mode, Size } from '../../shared/types.js';

const TMP_DIR = join(import.meta.dirname, '../fixtures/.tmp-layer2-merge');
const LAYER2_DIR = join(TMP_DIR, '.spec-first', 'layer2');

function setupFixtures() {
  mkdirSync(LAYER2_DIR, { recursive: true });

  // Platform A: Basic
  writeFileSync(join(LAYER2_DIR, 'platform-a.yaml'), `
platform: platform-a
gate_conditions:
  04_implement:
    - id: G-A-001
      description: Gate A
extra_deliverables:
  02_design:
    - name: design-a.md
      required: true
quality_thresholds:
  latency:
    value: 100
    direction: lower_is_better
  coverage:
    value: 80
    direction: higher_is_better
`);

  // Platform B: Complementary & Stricter
  writeFileSync(join(LAYER2_DIR, 'platform-b.yaml'), `
platform: platform-b
gate_conditions:
  04_implement:
    - id: G-B-001
      description: Gate B
extra_deliverables:
  02_design:
    - name: design-b.md
      required: true
quality_thresholds:
  latency:
    value: 50
    direction: lower_is_better
  coverage:
    value: 90
    direction: higher_is_better
`);

  // Platform C: Conflict Gate
  writeFileSync(join(LAYER2_DIR, 'platform-c.yaml'), `
platform: platform-c
gate_conditions:
  04_implement:
    - id: G-A-001
      description: Conflict with A
`);

  // Platform D: Implicit Direction
  writeFileSync(join(LAYER2_DIR, 'platform-d.yaml'), `
platform: platform-d
quality_thresholds:
  max_memory:
    value: 512
`);

  // Platform E: Unknown Direction
  writeFileSync(join(LAYER2_DIR, 'platform-e.yaml'), `
platform: platform-e
quality_thresholds:
  unknown_metric:
    value: 100
`);
}

beforeAll(() => setupFixtures());
afterAll(() => rmSync(TMP_DIR, { recursive: true, force: true }));

describe('Layer 2 Merge Integration', () => {
  const mode: Mode = 'N';
  const size: Size = 'M';

  it('should merge single platform correctly', () => {
    const rules = mergeLayerRules(mode, size, ['platform-a'], TMP_DIR);
    
    // Check Gates
    const gates = rules.gateConditions['04_implement'];
    expect(gates).toBeDefined();
    expect(gates.some(g => g.id === 'G-A-001')).toBe(true);

    // Check Deliverables
    const deliverables = rules.deliverables['02_design'];
    expect(deliverables).toBeDefined();
    expect(deliverables.some(d => d.name === 'design-a.md')).toBe(true);

    // Check Thresholds
    expect(rules.thresholds['latency'].value).toBe(100);
    expect(rules.thresholds['coverage'].value).toBe(80);
  });

  it('should merge multiple platforms with stricter thresholds', () => {
    const rules = mergeLayerRules(mode, size, ['platform-a', 'platform-b'], TMP_DIR);

    // Gates: AND superposition (both exist)
    const gates = rules.gateConditions['04_implement'];
    expect(gates.some(g => g.id === 'G-A-001')).toBe(true);
    expect(gates.some(g => g.id === 'G-B-001')).toBe(true);

    // Deliverables: Union
    const deliverables = rules.deliverables['02_design'];
    expect(deliverables.some(d => d.name === 'design-a.md')).toBe(true);
    expect(deliverables.some(d => d.name === 'design-b.md')).toBe(true);

    // Thresholds: Stricter wins
    // Latency (lower is better): min(100, 50) = 50
    expect(rules.thresholds['latency'].value).toBe(50);
    // Coverage (higher is better): max(80, 90) = 90
    expect(rules.thresholds['coverage'].value).toBe(90);
  });

  it('should detect gate ID conflicts', () => {
    expect(() => {
      mergeLayerRules(mode, size, ['platform-a', 'platform-c'], TMP_DIR);
    }).toThrow(/Gate ID 冲突/);
  });

  it('should infer direction for known metrics', () => {
    const rules = mergeLayerRules(mode, size, ['platform-d'], TMP_DIR);
    expect(rules.thresholds['max_memory'].direction).toBe('lower_is_better');
  });

  it('should throw error for unknown direction', () => {
    expect(() => {
      mergeLayerRules(mode, size, ['platform-e'], TMP_DIR);
    }).toThrow(/无法推断.*direction/);
  });
});
