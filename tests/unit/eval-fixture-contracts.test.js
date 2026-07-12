'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const repoRoot = path.resolve(__dirname, '../..');
const fixturePaths = [
  'skills/spec-prd/evals/examples.json',
  'skills/spec-write-skill/evals/trigger-cases.json',
  'skills/spec-write-tasks/evals/output-quality-cases.json',
];
const governanceReferenceDocs = [
  'docs/11-业界调研/README.md',
  'docs/11-业界调研/2026-06-21-spec-first-综合优先级建议-源码级深度解读.md',
  'docs/solutions/architecture-patterns/front-controller-triggered-references-gates-eval-regression-2026-07-01.md',
];
const clarificationBaselinePath =
  'docs/validation/requirements-clarification/2026-07-11-clarification-integration-baseline.md';
const clarificationCurrentSourcePath =
  'docs/validation/requirements-clarification/2026-07-11-clarification-integration-current-source-evaluation.md';
const clarificationReplayRoot =
  'docs/validation/requirements-clarification/2026-07-12-unit-replay';
const rubricDimensions = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7'];

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function rubricScores(block) {
  const source = block.scores || block;
  return Object.entries(source).reduce((scores, [key, value]) => {
    const match = key.match(/^M([1-7])(?:_|$)/);
    if (match && typeof value === 'number') {
      scores[`M${match[1]}`] = value;
    }
    return scores;
  }, {});
}

function rubricTotal(scores) {
  return Object.values(scores).reduce((total, score) => total + score, 0);
}

function normalizedScore(entry) {
  const beforeScores = rubricScores(entry.before);
  const afterScores = rubricScores(entry.after);
  const deltaScores = rubricScores(entry.delta_after_minus_before || entry.delta);
  for (const [label, scores] of [
    ['before', beforeScores],
    ['after', afterScores],
    ['delta', deltaScores],
  ]) {
    if (!rubricDimensions.every((dimension) => Object.hasOwn(scores, dimension))) {
      throw new Error(`${label} rubric dimensions mismatch`);
    }
  }
  const before = rubricTotal(beforeScores);
  const after = rubricTotal(afterScores);
  const delta = after - before;

  if (entry.before.total !== before) {
    throw new Error('before total mismatch');
  }
  if (entry.after.total !== after) {
    throw new Error('after total mismatch');
  }
  if ((entry.delta_after_minus_before || entry.delta).total !== delta) {
    throw new Error('delta total mismatch');
  }
  for (const dimension of Object.keys(beforeScores)) {
    if (deltaScores[dimension] !== afterScores[dimension] - beforeScores[dimension]) {
      throw new Error(`${dimension} delta mismatch`);
    }
  }

  return {
    before,
    after,
    delta,
  };
}

function assertBundleRecordIntegrity(record, beforeBundle, afterBundle) {
  if (record.before_bundle_sha256 !== beforeBundle.bundle_sha256) {
    throw new Error('before bundle hash mismatch');
  }
  if (record.after_bundle_sha256 !== afterBundle.bundle_sha256) {
    throw new Error('after bundle hash mismatch');
  }
}

function assertDirectionCounts(repeats, aggregate) {
  const counts = repeats.reduce((result, repeat) => {
    if (repeat.delta < 0) result.improved_repeats += 1;
    else if (repeat.delta > 0) result.regressed_repeats += 1;
    else result.tied_repeats += 1;
    return result;
  }, { improved_repeats: 0, tied_repeats: 0, regressed_repeats: 0 });

  if (counts.improved_repeats !== aggregate.improved_repeats
    || counts.tied_repeats !== aggregate.tied_repeats
    || counts.regressed_repeats !== aggregate.regressed_repeats) {
    throw new Error('repeat direction counts mismatch');
  }
}

function unresolvedFindingCount(findings, severity) {
  const closedStatuses = new Set([
    'resolved',
    'prevented',
    'non_regression',
    'limitation',
    'dependency_residual',
  ]);
  return findings.filter((finding) =>
    finding.severity === severity && !closedStatuses.has(finding.status)
  ).length;
}

describe('active eval fixture references', () => {
  test('requirements clarification replay rejects record hashes detached from bundles', () => {
    expect(() => assertBundleRecordIntegrity(
      {
        before_bundle_sha256: 'a'.repeat(64),
        after_bundle_sha256: 'b'.repeat(64),
      },
      { bundle_sha256: 'c'.repeat(64) },
      { bundle_sha256: 'b'.repeat(64) },
    )).toThrow('before bundle hash mismatch');
  });

  test('requirements clarification replay rejects self-reported score derivations', () => {
    const review = {
      before: {
        scores: { M1: 2, M2: 0, M3: 0, M4: 0, M5: 0, M6: 0, M7: 0 },
        total: 0,
      },
      after: {
        scores: { M1: 0, M2: 0, M3: 0, M4: 0, M5: 0, M6: 0, M7: 0 },
        total: 0,
      },
      delta_after_minus_before: {
        M1: -2,
        M2: 0,
        M3: 0,
        M4: 0,
        M5: 0,
        M6: 0,
        M7: 0,
        total: 0,
      },
    };

    expect(() => normalizedScore(review)).toThrow('before total mismatch');
    expect(() => assertDirectionCounts(
      [{ before: 2, after: 0, delta: -2 }],
      { improved_repeats: 0, tied_repeats: 1, regressed_repeats: 0 },
    )).toThrow('repeat direction counts mismatch');
    expect(unresolvedFindingCount([
      { severity: 'P1', status: 'resolved' },
      { severity: 'P1', status: 'unresolved' },
      { severity: 'P2', status: 'unresolved' },
    ], 'P1')).toBe(1);
  });

  test('requirements clarification baseline pre-registers auditable evaluation fields', () => {
    const contents = fs.readFileSync(path.join(repoRoot, clarificationBaselinePath), 'utf8');

    expect(contents).toContain('Fresh-source status: passed');
    expect(contents).toContain('Session cap: 36');
    expect(contents).toContain('## Source baseline');
    expect(contents).toContain('## 预注册 cases');
    expect(contents).toContain('## Rubric 与差异门');
    expect(contents).toContain('## Judge calibration');
    expect(contents).toContain('## Baseline execution record');
    expect(contents).toContain('Session total: 3 fresh reviewer sessions / 36');

    for (const caseId of ['C1', 'C2', 'C3', 'C4', 'C5', 'C6']) {
      expect(contents).toContain(`| ${caseId} |`);
    }

    for (const sourceRef of [
      'skills/spec-prd/SKILL.md',
      'skills/spec-prd/references/product-analysis-lite.md',
      'docs/validation/spec-prd/2026-07-11-spec-prd-contract-reset-gate-a.md',
      'skills/spec-brainstorm/SKILL.md',
      'skills/spec-brainstorm/references/visual-probes.md',
      'skills/spec-brainstorm/scripts/visual-probe-server.js',
      'skills/spec-plan/SKILL.md',
      'skills/spec-ideate/references/post-ideation-workflow.md',
    ]) {
      expect(contents).toContain(`\`${sourceRef}\``);
    }

    expect(contents).toContain('Countermetrics');
    expect(contents).toContain('Evaluator bundle hash');
    expect(contents).toContain('Limitations');
    expect(contents).toContain('Calibration status: passed');
    expect(contents).not.toContain('fresh_source_eval: passed');
  });

  test('requirements clarification current-source evaluation binds before/after evidence', () => {
    const contents = fs.readFileSync(path.join(repoRoot, clarificationCurrentSourcePath), 'utf8');

    expect(contents).toContain('Fresh-source status: passed');
    expect(contents).toContain('## Current source hashes');
    expect(contents).toContain('## Unit-exit results');
    expect(contents).toContain('Judge calibration: passed');
    expect(contents).toContain('Fresh reviewer sessions: 16 / 36 cap');
    expect(contents).toContain('Integrated C1/C2/C6 no-regression: passed');
    expect(contents).toContain('## Unit-exit sequence replay');
    expect(contents).toContain('pre/post 文件集合与 SHA-256');
    expect(contents).toContain('aggregate.json');
    expect(contents).toContain('mismatch 为 0');
    expect(contents).toContain('Field outcome: not_run');
    for (const unit of ['U2 / C1', 'U3 / C1-C3', 'U4 / C5', 'U5 / C4+C6', 'U6 / C6']) {
      expect(contents).toContain(unit);
    }
  });

  test('requirements clarification replay preserves unit provenance and counted reviewers', () => {
    const replayRoot = path.join(repoRoot, clarificationReplayRoot);
    const aggregate = readJson(path.join(replayRoot, 'aggregate.json'));
    const equivalence = readJson(path.join(replayRoot, 'final-equivalence.json'));
    const finalSourceManifest = readJson(path.join(replayRoot, 'final-source-manifest.json'));

    expect(aggregate.schema).toBe('requirements-clarification-unit-replay-aggregate/v1');
    expect(equivalence).toMatchObject({ checked: 34, mismatches: [] });
    expect(finalSourceManifest.files).toHaveLength(34);
    for (const entry of finalSourceManifest.files) {
      expect(fs.existsSync(path.join(repoRoot, entry.path))).toBe(entry.status === 'present');
      if (entry.status === 'present') {
        expect(sha256(fs.readFileSync(path.join(repoRoot, entry.path)))).toBe(entry.sha256);
      }
    }

    for (const unit of ['U2', 'U3', 'U4', 'U5', 'U6']) {
      const record = readJson(path.join(replayRoot, `${unit}-record.json`));
      const beforeBundle = readJson(path.join(replayRoot, `${unit}-before-bundle.json`));
      const afterSide = unit === 'U6' ? 'after-refined' : 'after';
      const afterBundle = readJson(path.join(replayRoot, `${unit}-${afterSide}-bundle.json`));
      expect(record.unit).toBe(unit);
      expect(record.paths.length).toBeGreaterThan(0);
      expect(() => assertBundleRecordIntegrity(record, beforeBundle, afterBundle)).not.toThrow();

      for (const patch of record.patches.filter((candidate) => candidate.path)) {
        const patchPath = path.join(replayRoot, patch.path);
        expect(patch.path).toMatch(/^patches\//);
        expect(fs.existsSync(patchPath)).toBe(true);
        expect(sha256(fs.readFileSync(patchPath))).toBe(patch.sha256);
      }

      for (const bundle of [beforeBundle, afterBundle]) {
        expect(sha256(JSON.stringify({ label: bundle.label, files: bundle.files })))
          .toBe(bundle.bundle_sha256);
        for (const file of bundle.files.filter((candidate) => candidate.status === 'present')) {
          expect(sha256(Buffer.from(file.content, 'utf8'))).toBe(file.sha256);
        }
      }
    }

    const countedReviewers = [
      'reviewer-A.json',
      'reviewer-B.json',
      'reviewer-G.json',
      'reviewer-U6-D.json',
      'reviewer-U6-E.json',
      'reviewer-U6-F.json',
    ];
    for (const reviewer of countedReviewers) {
      expect(() => readJson(path.join(replayRoot, reviewer))).not.toThrow();
      expect(aggregate.reviewer_files[reviewer].counted).toBe(true);
      expect(sha256(fs.readFileSync(path.join(replayRoot, reviewer))))
        .toBe(aggregate.reviewer_files[reviewer].sha256);
    }
    expect(aggregate.reviewer_files['reviewer-C.json'].counted).toBe(false);
    expect(aggregate.reviewer_files['reviewer-C.json'].rejection_reason).toContain(
      'Malformed repeat shape',
    );

    const reviewerA = readJson(path.join(replayRoot, 'reviewer-A.json')).case_reviews;
    const reviewerB = readJson(path.join(replayRoot, 'reviewer-B.json')).evaluations;
    const reviewerG = readJson(path.join(replayRoot, 'reviewer-G.json')).case_reviews;
    for (const key of ['U2_C1', 'U3_C1', 'U3_C2', 'U3_C3', 'U4_C5', 'U5_C4', 'U5_C6']) {
      const [unit, caseId] = key.split('_');
      const expected = [reviewerA, reviewerB, reviewerG].map((reviews) =>
        normalizedScore(reviews.find((entry) => entry.unit === unit && entry.case === caseId))
      );
      expect(aggregate.aggregated[key].repeats).toEqual(expected);
      expect(() => assertDirectionCounts(expected, aggregate.aggregated[key])).not.toThrow();
    }

    const reviewerD = readJson(path.join(replayRoot, 'reviewer-U6-D.json')).scores;
    const reviewerE = readJson(path.join(replayRoot, 'reviewer-U6-E.json')).scores;
    const reviewerF = readJson(path.join(replayRoot, 'reviewer-U6-F.json'));
    const expectedU6 = [reviewerD, reviewerE, reviewerF].map(normalizedScore);
    expect(aggregate.aggregated.U6_C6.repeats).toEqual(expectedU6);
    expect(() => assertDirectionCounts(expectedU6, aggregate.aggregated.U6_C6)).not.toThrow();

    const accounting = aggregate.session_accounting;
    expect(accounting.total_fresh_sessions).toBe(
      accounting.historical_baseline_and_reviews
      + accounting.replay_initial_persisted
      + accounting.u6_refinement_rechecks
      + accounting.replacement_for_malformed,
    );
    expect(accounting.total_fresh_sessions).toBeLessThanOrEqual(accounting.cap);

    const rawA = readJson(path.join(replayRoot, 'reviewer-A.json'));
    const rawB = readJson(path.join(replayRoot, 'reviewer-B.json'));
    const rawG = readJson(path.join(replayRoot, 'reviewer-G.json'));
    const rawD = readJson(path.join(replayRoot, 'reviewer-U6-D.json'));
    const rawE = readJson(path.join(replayRoot, 'reviewer-U6-E.json'));
    const rawF = readJson(path.join(replayRoot, 'reviewer-U6-F.json'));
    for (const review of [rawA, rawG, rawE, rawF]) {
      expect(review.severity_findings.P0).toEqual([]);
      expect(review.severity_findings.P1).toEqual([]);
    }
    expect(rawD.findings_by_priority.P0).toEqual([]);
    expect(rawD.findings_by_priority.P1.every((finding) => finding.state === 'fixed_in_after'))
      .toBe(true);
    expect(Object.values(rawB.overall.unit_decisions)).toEqual([
      'retain',
      'retain',
      'retain',
      'retain',
      'retain',
    ]);
    const rawBFindings = rawB.evaluations.flatMap((evaluation) => evaluation.findings);
    const unresolvedP0 = [rawA, rawG, rawE, rawF]
      .reduce((count, review) => count + review.severity_findings.P0.length, 0)
      + rawD.findings_by_priority.P0.filter((finding) => finding.state !== 'fixed_in_after').length
      + unresolvedFindingCount(rawBFindings, 'P0');
    const unresolvedP1 = [rawA, rawG, rawE, rawF]
      .reduce((count, review) => count + review.severity_findings.P1.length, 0)
      + rawD.findings_by_priority.P1.filter((finding) => finding.state !== 'fixed_in_after').length
      + unresolvedFindingCount(rawBFindings, 'P1');
    expect(aggregate.verdict).toMatchObject({
      P0: unresolvedP0,
      P1: unresolvedP1,
      field_outcome: 'not_run',
    });
  });

  test.each(fixturePaths)('%s has no missing current source references', (relativePath) => {
    const fixture = JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
    const refs = [
      ...(fixture.source_refs || []),
      ...(fixture.cases || []).flatMap((entry) => [
        ...(entry.source_refs || []),
        ...(entry.input_files || []).map((input) => input.path),
        ...(entry.deterministic_assertions || []).map((assertion) => assertion.target_file),
      ]),
    ];
    const currentRefs = refs.filter((ref) => typeof ref === 'string' && ref && !ref.includes('*'));
    expect(currentRefs.filter((ref) => !fs.existsSync(path.join(repoRoot, ref)))).toEqual([]);
  });

  test.each(governanceReferenceDocs)('%s points at the current source-only PRD governance note', (relativePath) => {
    const contents = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    expect(contents).toContain('skills/spec-prd/evals/evaluation-governance.md');
    expect(contents).not.toContain('skills/spec-prd/references/evaluation-governance.md');
    expect(fs.existsSync(path.join(
      repoRoot,
      'skills/spec-prd/evals/evaluation-governance.md',
    ))).toBe(true);
  });

  test('spec-prd degraded finalize fixture uses the loaded runtime skill root', () => {
    const fixture = JSON.parse(fs.readFileSync(path.join(
      repoRoot,
      'skills/spec-prd/evals/examples.json',
    ), 'utf8'));
    const finalizeCase = fixture.cases.find((entry) =>
      entry.id === 'codex-degraded-producer-finalize'
    );

    expect(finalizeCase).toBeDefined();
    expect(finalizeCase.input_shape).toContain(
      'producer-local finalize command from the loaded spec-prd skill root',
    );
    expect(finalizeCase.input_shape).not.toContain(
      'current-source producer finalize command',
    );
  });

  test('spec-write-skill route fixtures declare structural evidence and executable expectations', () => {
    const fixture = JSON.parse(fs.readFileSync(path.join(
      repoRoot,
      'skills/spec-write-skill/evals/trigger-cases.json',
    ), 'utf8'));

    expect(fixture.schema_version).toBe('spec-first.spec-write-skill-trigger-cases.v3');
    expect(fixture.evidence_scope).toBe('structural-only');
    expect(fixture).not.toHaveProperty('evidence_level');
    expect(fixture.cases).toHaveLength(8);
    expect(fixture.route_queries.length).toBeGreaterThanOrEqual(12);
    expect(fixture.route_queries.length).toBeLessThanOrEqual(16);
    expect(new Set(fixture.cases.map((entry) => entry.id)).size).toBe(fixture.cases.length);
    expect(new Set(fixture.route_queries.map((entry) => entry.id)).size)
      .toBe(fixture.route_queries.length);

    for (const entry of fixture.cases) {
      expect(typeof entry.expected_trigger).toBe('boolean');
      expect(entry.prompt).toEqual(expect.any(String));
      expect(entry.expected_base_operation === null || ['create', 'revise'].includes(entry.expected_base_operation)).toBe(true);
      expect(['apply', 'validate-only', 'not-entered']).toContain(entry.expected_effect);
      expect(['migrate', 'audit-remediation', 'none']).toContain(entry.expected_modifier);
      expect(entry.expected_layer_result).toEqual(expect.any(String));
      expect(entry.reason_code).toEqual(expect.any(String));
      expect(entry.forbidden_signals).toEqual(expect.any(Array));
      expect(entry.forbidden_signals.length).toBeGreaterThan(0);
    }

    for (const entry of fixture.route_queries) {
      expect(entry.query).toEqual(expect.any(String));
      expect(typeof entry.expected_trigger).toBe('boolean');
      expect(entry.expected_route).toEqual(expect.any(String));
      expect(entry.reason_code).toEqual(expect.any(String));
      expect(entry.forbidden_signals).toEqual(expect.any(Array));
    }

    expect([...new Set(fixture.route_queries.map((entry) => entry.expected_route))]).toEqual(
      expect.arrayContaining([
        'spec-write-skill',
        'bounded-source-review',
        'direct-answer',
        'skill-installer',
        'runtime-maintenance',
        'spec-debug',
      ]),
    );

    expect(fixture.cases).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'malicious-external-package',
        expected_effect: 'validate-only',
        expected_layer_result: 'trust-preflight-blocked',
      }),
      expect.objectContaining({
        id: 'portable-create-non-spec-first',
        expected_base_operation: 'create',
        expected_effect: 'apply',
        expected_layer_result: 'portable-core-only',
      }),
    ]));
  });
});
