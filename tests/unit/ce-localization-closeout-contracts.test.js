'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');

const producer = require('../../scripts/check-ce-localization-review.cjs');
const closeoutWriter = require('../../scripts/generate-ce-localization-closeout.cjs');

function semanticLensVerdicts() {
  return [
    {
      review_lens: 'openai-skill-engineering',
      review_status: 'complete',
      verdict: 'no-new-actionable-finding',
      notes: ['Current source was read and checked against the owning workflow contract.'],
      limitations: ['Inline fixture verdict is not independent provider evidence.'],
    },
    {
      review_lens: 'anthropic-skill-craft-safety',
      review_status: 'complete',
      verdict: 'no-new-actionable-finding',
      notes: ['Current source was read for safety, progressive disclosure, and failure-boundary regressions.'],
      limitations: ['Inline fixture verdict is not independent provider evidence.'],
    },
  ];
}

function currentFact(deterministic, skillId, sourcePath) {
  return [
    ...deterministic.coverage.package_files,
    ...deterministic.coverage.direct_support,
  ].find((entry) => entry.skill_id === skillId && entry.path === sourcePath);
}

function reviewDelta(deterministic, relationGaps) {
  const byPath = new Map();
  const retired = [];
  for (const gap of relationGaps) {
    if (gap.issue === 'retired') {
      retired.push({
        skill_id: gap.skill_id,
        path: gap.path,
        prior_sha256: gap.receipt.sha256,
        lens_verdicts: semanticLensVerdicts(),
      });
      continue;
    }
    const fact = gap.fact || currentFact(deterministic, gap.skill_id, gap.path);
    if (!byPath.has(gap.path)) byPath.set(gap.path, { fact, skillIds: new Set() });
    byPath.get(gap.path).skillIds.add(gap.skill_id);
  }
  return {
    schema_version: 'ce-localization-review-delta/v1',
    artifact_kind: 'source-bound-semantic-review-delta',
    review_run_id: 'ce-localization-review-delta-test',
    producer: 'unit-test role-simulated inline review',
    reviewed_at: '2026-08-20T00:00:00.000Z',
    source_binding: producer.reviewDeltaSourceBinding(deterministic),
    execution_context: {
      review_method: 'inline-same-context',
      independent: false,
      provider_identity: 'not-used',
      worker_context_isolation: 'degraded_inherited',
    },
    reviewed_paths: [...byPath.entries()].map(([sourcePath, entry]) => ({
      path: sourcePath,
      skill_ids: [...entry.skillIds].sort(),
      sha256: entry.fact.sha256,
      bytes: entry.fact.bytes,
      line_count: entry.fact.line_count,
      covered_line_ranges: [[1, entry.fact.line_count]],
      lens_verdicts: semanticLensVerdicts(),
    })),
    retired_relations: retired,
    findings: [],
    limitations: ['Unit fixture proves deterministic merge guards, not semantic review quality.'],
    claim_ceiling: 'Fixture-only source receipt merge validation.',
  };
}

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

  test('rejects a stale Round 3 lane finding summary', () => {
    const deterministic = producer.buildArtifacts();
    const closeout = producer.loadCloseoutArtifacts();
    closeout.reviews.round3Anthropic.finding_summary.open_count = 99;

    expect(producer.validateCloseoutArtifacts(closeout, deterministic)).toMatchObject({
      valid: false,
      errors: expect.arrayContaining([
        expect.stringContaining('review:round3Anthropic: finding_summary is stale'),
      ]),
    });
  });

  test('rejects a report that still carries a stale snapshot warning', () => {
    const deterministic = producer.buildArtifacts();
    const closeout = producer.loadCloseoutArtifacts();
    closeout.report = `> **当前快照失效**: old snapshot\n\n${closeout.report}`;

    expect(producer.validateCloseoutArtifacts(closeout, deterministic)).toMatchObject({
      valid: false,
      errors: expect.arrayContaining([
        expect.stringContaining('report: contains a stale snapshot warning'),
      ]),
    });
  });

  test('refreshes a stale snapshot warning that follows the report heading', () => {
    const deterministic = producer.buildArtifacts();
    const staleReport = '# CE localization review\n\n> **当前快照失效**: old snapshot\n\nBody';
    const currentNote = `> current binding\n\n`;
    const refreshed = closeoutWriter.replaceStaleSnapshotWarning(staleReport, currentNote);

    expect(refreshed).toContain(currentNote);
    expect(refreshed).not.toContain('当前快照失效');
  });

  test('requires a source-bound semantic delta before refreshing a stale review receipt', () => {
    const deterministic = producer.buildArtifacts();
    const closeout = producer.loadCloseoutArtifacts();
    const staleReview = closeout.reviews.round3Openai;
    const currentDelta = reviewDelta(
      deterministic,
      closeoutWriter.collectReviewGaps(staleReview, deterministic),
    );
    const review = closeoutWriter.mergeReviewDelta(staleReview, deterministic, currentDelta);
    const skillReview = review.skill_reviews.find((entry) => entry.skill_id === 'spec-compound');
    const receipt = skillReview.source_read_receipts.find((entry) => entry.path === 'skills/spec-compound/SKILL.md');
    const fact = deterministic.coverage.package_files.find((entry) => entry.path === receipt.path);
    receipt.sha256 = '0'.repeat(64);

    expect(() => closeoutWriter.mergeReviewDelta(review, deterministic))
      .toThrow('current receipt lacks a matching semantic delta');

    const delta = reviewDelta(
      deterministic,
      closeoutWriter.collectReviewGaps(review, deterministic),
    );
    const merged = closeoutWriter.mergeReviewDelta(review, deterministic, delta, {
      review_run_id: delta.review_run_id,
      artifact_ref: 'docs/validation/ce-localization/review/deltas/test.json',
      artifact_sha256: '1'.repeat(64),
      reviewed_at: delta.reviewed_at,
      ...delta.execution_context,
      claim_ceiling: delta.claim_ceiling,
    });
    const mergedReceipt = merged.skill_reviews
      .find((entry) => entry.skill_id === 'spec-compound')
      .source_read_receipts.find((entry) => entry.path === fact.path);

    expect(mergedReceipt).toMatchObject({
      sha256: fact.sha256,
      bytes: fact.bytes,
      line_count: fact.line_count,
      covered_line_ranges: [[1, fact.line_count]],
      read_status: 'full',
    });
    expect(merged.review_status).toBe('complete-with-incremental-review');
    expect(merged.review_deltas).toEqual(expect.arrayContaining([
      expect.objectContaining({ review_run_id: delta.review_run_id }),
    ]));
  });

  test('validates review-delta source binding and forbids inline independence claims', () => {
    const deterministic = producer.buildArtifacts();
    const fact = deterministic.coverage.package_files.find(
      (entry) => entry.path === 'skills/spec-compound/SKILL.md',
    );
    const delta = reviewDelta(deterministic, [{
      issue: 'stale',
      skill_id: 'spec-compound',
      path: fact.path,
      fact,
    }]);

    expect(producer.validateReviewDeltaArtifact(delta, deterministic))
      .toEqual({ valid: true, errors: [] });

    delta.source_binding.source_tree_hash = '0'.repeat(64);
    expect(producer.validateReviewDeltaArtifact(delta, deterministic)).toMatchObject({
      valid: false,
      errors: expect.arrayContaining([expect.stringContaining('source_binding does not match')]),
    });

    delta.source_binding = producer.reviewDeltaSourceBinding(deterministic);
    delta.execution_context = {
      review_method: 'independent-provider',
      independent: true,
      provider_identity: 'verified',
      worker_context_isolation: 'isolated',
    };
    expect(producer.validateReviewDeltaArtifact(delta, deterministic)).toMatchObject({
      valid: false,
      errors: expect.arrayContaining([
        expect.stringContaining('/execution_context/independent'),
      ]),
    });
  });

  test('prunes historical review deltas whose source binding is no longer current', () => {
    const deterministic = producer.buildArtifacts();
    const closeout = producer.loadCloseoutArtifacts();
    const review = JSON.parse(JSON.stringify(closeout.reviews.round3Openai));
    const sourceDelta = JSON.parse(fs.readFileSync(
      'docs/validation/ce-localization/review/deltas/2026-08-20-current-source-final-v2-inline-review.json',
      'utf8',
    ));
    sourceDelta.source_binding.source_tree_hash = '0'.repeat(64);
    const artifactRef = `docs/validation/ce-localization/review/deltas/.test-stale-${process.pid}.json`;
    const artifactBytes = Buffer.from(`${JSON.stringify(sourceDelta, null, 2)}\n`);
    fs.writeFileSync(artifactRef, artifactBytes);
    review.review_status = 'complete-with-incremental-review';
    review.coverage_status = 'complete-current-source-with-incremental-review';
    review.review_deltas = [{
      review_run_id: 'ce-localization-review-delta-2026-08-20-current-source-final-v2',
      artifact_ref: artifactRef,
      artifact_sha256: crypto.createHash('sha256').update(artifactBytes).digest('hex'),
    }];

    try {
      closeoutWriter.pruneReviewDeltaLineage(review, deterministic);

      expect(review).not.toHaveProperty('review_deltas');
      expect(review.review_status).toBe('complete-current-source');
      expect(review.coverage_status).toBe('complete-current-source');
    } finally {
      fs.rmSync(artifactRef, { force: true });
    }
  });

  test('rejects a reviewed Skill/path relation that is not in current coverage', () => {
    const deterministic = producer.buildArtifacts();
    const fact = currentFact(deterministic, 'spec-compound', 'skills/spec-compound/SKILL.md');
    const delta = reviewDelta(deterministic, [{
      issue: 'stale',
      skill_id: 'spec-compound',
      path: fact.path,
      fact,
    }]);
    delta.reviewed_paths[0].skill_ids = ['spec-compound-refresh'];

    expect(producer.validateReviewDeltaArtifact(delta, deterministic)).toMatchObject({
      valid: false,
      errors: expect.arrayContaining([
        expect.stringContaining(`spec-compound-refresh:${fact.path}`),
      ]),
    });
  });

  test('does not refresh an unreviewed Skill that shares the same source path', () => {
    const deterministic = producer.buildArtifacts();
    const closeout = producer.loadCloseoutArtifacts();
    const staleReview = closeout.reviews.round3Openai;
    const currentDelta = reviewDelta(
      deterministic,
      closeoutWriter.collectReviewGaps(staleReview, deterministic),
    );
    const review = closeoutWriter.mergeReviewDelta(staleReview, deterministic, currentDelta);
    const sharedPath = 'tests/unit/compound-promotion-contracts.test.js';
    const reviewedSkillId = 'spec-compound';
    const unreviewedSkillId = 'spec-compound-refresh';
    const fact = currentFact(deterministic, reviewedSkillId, sharedPath);

    for (const skillId of [reviewedSkillId, unreviewedSkillId]) {
      const receipt = review.skill_reviews
        .find((entry) => entry.skill_id === skillId)
        .source_read_receipts.find((entry) => entry.path === sharedPath);
      receipt.sha256 = '0'.repeat(64);
    }

    const delta = reviewDelta(deterministic, [{
      issue: 'stale',
      skill_id: reviewedSkillId,
      path: sharedPath,
      fact,
    }]);

    expect(producer.validateReviewDeltaArtifact(delta, deterministic))
      .toEqual({ valid: true, errors: [] });
    expect(() => closeoutWriter.mergeReviewDelta(review, deterministic, delta))
      .toThrow(`${unreviewedSkillId}:${sharedPath}`);
  });

  test('allows one Skill/path relation to stay current while another is explicitly retired', () => {
    const deterministic = producer.buildArtifacts();
    const fact = currentFact(deterministic, 'spec-compound', 'skills/spec-compound/SKILL.md');
    const delta = reviewDelta(deterministic, [{
      issue: 'stale',
      skill_id: 'spec-compound',
      path: fact.path,
      fact,
    }]);
    delta.retired_relations.push({
      skill_id: 'spec-compound-refresh',
      path: fact.path,
      prior_sha256: '1'.repeat(64),
      lens_verdicts: semanticLensVerdicts(),
    });

    expect(producer.validateReviewDeltaArtifact(delta, deterministic))
      .toEqual({ valid: true, errors: [] });
  });

  test('refuses to rebind stale upstream adjudication without an LLM-owned artifact update', () => {
    const deterministic = producer.buildArtifacts();
    const target = deterministic.inventory.source_snapshot;
    const input = { target_source_snapshot: target };
    const adjudication = {
      target_source_snapshot: target,
      input_artifact_sha256: producer.artifactSha256(input),
    };

    expect(closeoutWriter.assertCurrentUpstreamBinding(input, adjudication, deterministic))
      .toBe(adjudication);

    expect(() => closeoutWriter.assertCurrentUpstreamBinding(input, {
      ...adjudication,
      target_source_snapshot: { ...target, source_tree_hash: '0'.repeat(64) },
    }, deterministic)).toThrow('scripts cannot rebind an LLM adjudication');
  });
});
