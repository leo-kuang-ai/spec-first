import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const CONTRACT = join(import.meta.dirname, '../../skills/shared/orchestration-governance-contract.md');

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('orchestration governance contract', () => {
  it('should define the shared governance contract for plan and orchestrate', () => {
    expect(existsSync(CONTRACT)).toBe(true);
    const contract = read(CONTRACT);

    expect(contract).toContain('11-plan');
    expect(contract).toContain('13-orchestrate');
    expect(contract).toContain('dependency_strength');
    expect(contract).toContain('risk_category');
    expect(contract).toContain('risk_signals');
    expect(contract).toContain('recommended_action');
  });

  it('should document canonical enums and naming layers', () => {
    const contract = read(CONTRACT);

    expect(contract).toContain('dependencyStrength');
    expect(contract).toContain('riskCategory');
    expect(contract).toContain('riskSignals');
    expect(contract).toContain('background_status');
    expect(contract).toContain('L1');
    expect(contract).toContain('L2');
    expect(contract).toContain('L3');
    expect(contract).toContain('formal-design-review');
    expect(contract).toContain('high-risk-implementation');
    expect(contract).toContain('pre-release-verification');
    expect(contract).toContain('backfill-first');
    expect(contract).toContain('review-risk');
    expect(contract).toContain('proceed');
  });
});
