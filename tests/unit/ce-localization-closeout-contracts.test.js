'use strict';

const producer = require('../../scripts/check-ce-localization-review.cjs');

describe('CE localization closeout artifacts', () => {
  test('validates the complete canonical topology against the current source snapshot', () => {
    const deterministic = producer.buildArtifacts();
    const closeout = producer.loadCloseoutArtifacts();
    const result = producer.validateCloseoutArtifacts(closeout, deterministic);

    expect(result).toEqual({ valid: true, errors: [] });
    expect(closeout.scenarios.scenarios).toHaveLength(37);
    expect(closeout.scenarios.path_coverage).toHaveLength(
      deterministic.inventory.package_path_count
        + deterministic.coverage.coverage_summary.direct_support_relation_count,
    );
    expect(closeout.baselines).toHaveLength(deterministic.inventory.skill_count);
    expect(closeout.ledger.entries).toHaveLength(523);
    expect(closeout.fieldProtocol.overall_status).toBe('not-run');
    expect(closeout.fieldTaskPairs.overall_status).toBe('not-run');
    expect(closeout.fieldResults.overall_status).toBe('not-run');
    expect(closeout.knowledgePromotion.overall_status).toBe('not-run');
  });

  test('rejects a semantic artifact that drifts from the deterministic inventory', () => {
    const deterministic = producer.buildArtifacts();
    const closeout = producer.loadCloseoutArtifacts();
    closeout.scenarios.scenarios[0].skill_id = 'not-a-current-skill';

    expect(producer.validateCloseoutArtifacts(closeout, deterministic)).toMatchObject({
      valid: false,
      errors: expect.arrayContaining([expect.stringContaining('not-a-current-skill')]),
    });
  });

  test('rejects path hash drift and knowledge promotion without field evidence', () => {
    const deterministic = producer.buildArtifacts();
    const closeout = producer.loadCloseoutArtifacts();
    closeout.scenarios.path_coverage[0].source_sha256 = '0'.repeat(64);
    closeout.knowledgePromotion.overall_status = 'promoted';

    expect(producer.validateCloseoutArtifacts(closeout, deterministic)).toMatchObject({
      valid: false,
      errors: expect.arrayContaining([
        expect.stringContaining('source hash mismatch'),
        expect.stringContaining('field not-run cannot produce promoted knowledge'),
      ]),
    });
  });

  test('rejects stale Round 3 source receipts even when top-level counts match', () => {
    const deterministic = producer.buildArtifacts();
    const closeout = producer.loadCloseoutArtifacts();
    closeout.reviews.round3Openai.skill_reviews[0].source_read_receipts[0].sha256 = '0'.repeat(64);

    expect(producer.validateCloseoutArtifacts(closeout, deterministic)).toMatchObject({
      valid: false,
      errors: expect.arrayContaining([expect.stringContaining('source receipt facts are stale')]),
    });
  });
});
