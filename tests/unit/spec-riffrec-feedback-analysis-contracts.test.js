'use strict';

const fs = require('node:fs');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

describe('spec-riffrec-feedback-analysis artifact path contracts', () => {
  test('拥有 analyzer canonical owner，Sweep 保持 byte-identical package-local projection', () => {
    const owner = fs.readFileSync(
      'skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py',
    );
    const projection = fs.readFileSync('skills/spec-sweep/scripts/analyze_riffrec_zip.py');

    expect(projection).toEqual(owner);
    expect(owner.toString('utf8')).toContain('Canonical owner：spec-riffrec-feedback-analysis');
    expect(owner.toString('utf8')).toContain('Package-local projection：spec-sweep');
  });

  test('keeps evidence artifacts separate from spec-brainstorm durable output', () => {
    const skill = read('skills/spec-riffrec-feedback-analysis/SKILL.md');
    const extensive = read('skills/spec-riffrec-feedback-analysis/references/extensive-analysis.md');
    const analyzer = read('skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py');

    expect(skill).toContain('docs/brainstorms/riffrec-feedback/');
    expect(skill).toContain('documented evidence/kickoff-artifact exception');
    expect(extensive).toContain('durable requirements-only unified plan under `docs/plans/`');
    expect(analyzer).toContain('durable spec-brainstorm outputs live in docs/plans/.');
    expect(analyzer).toContain('durable unified plan under docs/plans/.');

    expect(extensive).not.toMatch(/durable[^\n]*docs\/brainstorms\//i);
    expect(analyzer).not.toMatch(/durable[^\n]*docs\/brainstorms\//i);
  });

  test('preserves the current spec-brainstorm handoff identity', () => {
    const extensive = read('skills/spec-riffrec-feedback-analysis/references/extensive-analysis.md');
    const analyzer = read('skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py');

    expect(extensive).toContain('load the `spec-brainstorm` skill');
    expect(analyzer).toContain('Brainstorm handoff: spec-brainstorm');
    expect(extensive).not.toContain('ce-brainstorm');
    expect(analyzer).not.toContain('ce-brainstorm');
  });

  test('keeps credentials out of argv and enforces zip resource budgets', () => {
    const analyzer = read('skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py');

    expect(analyzer).toContain('"--config"');
    expect(analyzer).toContain('input=curl_config');
    expect(analyzer).not.toContain('f"Authorization: Bearer {api_key}"');
    for (const budget of [
      'MAX_ZIP_MEMBERS',
      'MAX_ZIP_MEMBER_BYTES',
      'MAX_ZIP_TOTAL_BYTES',
      'MAX_ZIP_COMPRESSION_RATIO',
      'member_written',
      'streamed_total',
    ]) {
      expect(analyzer).toContain(budget);
    }
    expect(analyzer).toContain('shutil.rmtree(staging, ignore_errors=True)');
  });
});
