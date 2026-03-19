import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { bootstrapFirstRuntime } from '../../src/core/skill-runtime/first-bootstrap.js';
import { incrementalUpdateRuntimeAssets } from '../../src/core/skill-runtime/first-incremental-update.js';
import { readFirstApiContracts, readFirstConventions, readFirstCriticalFlows, readFirstEntryGuide, readFirstRuntimeIndex, readFirstRuntimeSummary, readFirstStructureOverview } from '../../src/core/skill-runtime/first-runtime-store.js';
import { seedFirstRuntimeOutputs } from '../helpers/first-runtime-fixture.js';

const TMP = join(import.meta.dirname, '../fixtures/.tmp-first-incremental-update');
const FEATURE_ID = 'FSREQ-20260318-FIRST-UPD-001';

function initRepo(): void {
  execSync('git -c core.hooksPath=/dev/null init', { cwd: TMP, stdio: 'ignore' });
  execSync('git config user.email "dev@example.com"', { cwd: TMP, stdio: 'ignore' });
  execSync('git config user.name "Dev"', { cwd: TMP, stdio: 'ignore' });
}

beforeEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });
  writeFileSync(
    join(TMP, 'package.json'),
    JSON.stringify({ name: 'first-incremental-fixture', version: '1.0.0' }, null, 2),
    'utf-8'
  );
  initRepo();
  seedFirstRuntimeOutputs(TMP, 'first-incremental-fixture');
  bootstrapFirstRuntime(TMP);
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('first-incremental-update', () => {
  it('merges structural changes into runtime truth and refreshes affected docs', () => {
    const result = incrementalUpdateRuntimeAssets(TMP, FEATURE_ID, [
      {
        type: 'module',
        action: 'add',
        target: 'Billing Core',
        evidence: `specs/${FEATURE_ID}/design.md#L10`,
        featureId: FEATURE_ID,
      },
      {
        type: 'api',
        action: 'add',
        target: 'POST /billing/invoices',
        evidence: `specs/${FEATURE_ID}/design.md#L18`,
        featureId: FEATURE_ID,
      },
      {
        type: 'flow',
        action: 'add',
        target: 'Invoice Settlement Flow',
        evidence: `specs/${FEATURE_ID}/design.md#L24`,
        featureId: FEATURE_ID,
      },
      {
        type: 'convention',
        action: 'add',
        target: 'All billing writes require audit trail',
        evidence: `specs/${FEATURE_ID}/retro.md#L8`,
        featureId: FEATURE_ID,
      },
      {
        type: 'risk',
        action: 'add',
        target: 'Invoice replay can duplicate settlement',
        evidence: `specs/${FEATURE_ID}/retro.md#L4`,
        featureId: FEATURE_ID,
      },
    ]);

    expect(result.updatedRuntimeAssets).toEqual(
      expect.arrayContaining([
        'summary.json',
        'structure-overview.json',
        'api-contracts.json',
        'critical-flows.json',
        'entry-guide.json',
        'conventions.json',
      ])
    );
    expect(result.docsOutputs).toContain('docs/first/summary.md');
    expect(result.docsOutputs).toContain('docs/first/api-docs.md');

    const summary = readFirstRuntimeSummary(TMP);
    expect(summary?.modules).toContain('Billing Core');
    expect(summary?.apiSurface).toContain('POST /billing/invoices');
    expect(summary?.risks).toContain('Invoice replay can duplicate settlement');

    const structureOverview = readFirstStructureOverview(TMP);
    expect(structureOverview?.modules.some((item) => item.name === 'Billing Core')).toBe(true);

    const apiContracts = readFirstApiContracts(TMP);
    expect(
      apiContracts?.interfaces.some(
        (item) => item.method === 'POST' && item.path === '/billing/invoices'
      )
    ).toBe(true);

    const flows = readFirstCriticalFlows(TMP);
    expect(flows?.some((item) => item.name === 'Invoice Settlement Flow')).toBe(true);

    const entryGuide = readFirstEntryGuide(TMP);
    expect(entryGuide?.some((item) => item.taskCategory.includes('invoice-settlement-flow'))).toBe(
      true
    );

    const conventions = readFirstConventions(TMP);
    expect(conventions?.projectRules.observedPatterns).toContain(
      'All billing writes require audit trail'
    );

    const index = readFirstRuntimeIndex(TMP);
    expect(index?.summary.healthy).toBe(true);
    expect(index?.docsProjection['docs/first/api-docs.md']?.healthy).toBe(true);
    expect(readFileSync(join(TMP, 'docs', 'first', 'api-docs.md'), 'utf-8')).toContain(
      'billing/invoices'
    );
  });
});
