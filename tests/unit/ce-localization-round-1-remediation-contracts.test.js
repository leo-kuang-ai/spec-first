'use strict';

const fs = require('node:fs');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

describe('CE localization Round 1 owner remediation contracts', () => {
  test('runtime setup distinguishes read-only modes from facts-only verification writes', () => {
    const skill = read('skills/spec-runtime-setup/SKILL.md');

    expect(skill).toContain('`--check` and `--plan` are read-only');
    expect(skill).toContain('`--verify-only` is a facts-only mutation mode');
    expect(skill).toContain('write setup-owned facts, scenario fingerprints, and ledgers only');
    expect(skill).toContain('must not install providers, edit host config, bootstrap project config, or refresh generated runtime');
  });

  test('commit keeps branch mutation authority separate from commit authority', () => {
    const skill = read('skills/spec-commit/SKILL.md');

    expect(skill).toContain('branch_mutation_authorization: authorized | missing');
    expect(skill).toContain('commit authorization does not imply branch mutation authorization');
    expect(skill).toContain('branch_mutation_authorization_missing');
    expect(skill).not.toContain('automatically create a feature branch before staging or committing');
  });

  test('dogfood reuses the browser owner and blocks unapproved durable effects', () => {
    const skill = read('skills/spec-dogfood/SKILL.md');

    expect(skill).toContain('browser_effect_authorization: authorized | missing');
    expect(skill).toContain('read-only | ephemeral-local | durable-local | external | unknown');
    expect(skill).toContain('Invoke `spec-test-browser` with `mode:pipeline`');
    expect(skill).toContain('browser_effect_authorization_missing');
    expect(skill).not.toContain('agent-browser click @e1');
    expect(skill).not.toContain('agent-browser fill @e2');
  });

  test('ideate keeps external research opt-in throughout the dispatch path', () => {
    const skill = read('skills/spec-ideate/SKILL.md');
    const universal = read('skills/spec-ideate/references/universal-ideation.md');

    expect(skill).toContain('external_research_authorization: authorized | missing');
    expect(skill).toContain('external_research_authorization_missing');
    expect(skill).toContain('missing authority removes the web-research role regardless of mode or depth');
    expect(skill).toContain('dispatch authority never substitutes for research authority');
    expect(skill).not.toContain('Web research** (always-on');
    expect(skill).not.toContain('Always-on for both modes');
    expect(skill).not.toContain('web-research by default');
    expect(universal).not.toContain('web-research by default');
    expect(universal).toContain('missing external research authority still removes the web role');
  });

  test('sweep keeps committed state as explicit topology and repo-local state as the default', () => {
    const skill = read('skills/spec-sweep/SKILL.md');
    const interview = read('skills/spec-sweep/references/interview.md');

    expect(skill).toContain('default `.spec-first/workflows/spec-sweep/<repo-slug>/state.yml`');
    expect(skill).toContain('never staged or committed');
    expect(interview).toContain('Committed to the repo** (explicit opt-in');
    expect(interview).toContain('Repo-local durable state** (default)');
    expect(interview).toContain('this topology is never selected merely because the repo is writable or the run is scheduled');
    expect(interview).not.toContain('Committed to the repo** (recommended');
  });

  test('LFG does not infer tracker filing authority from delivery authorization', () => {
    const skill = read('skills/spec-lfg/SKILL.md');
    const tracker = read('skills/spec-lfg/references/tracker-defer.md');

    expect(skill).toContain('tracker_deferral_authorization: authorized | missing');
    expect(skill).toContain('tracker_deferral_authorization_missing');
    expect(skill).toContain('do not invoke an external tracker sink');
    expect(tracker).toContain('Non-interactive mode still requires explicit tracker deferral authorization');
  });

  test('optimize authorizes the exact measurement execution before the first command', () => {
    const skill = read('skills/spec-optimize/SKILL.md');
    const authorizationIndex = skill.indexOf('measurement_execution_authorization: authorized | missing');
    const firstMeasureIndex = skill.indexOf('bash "$SKILL_DIR/scripts/measure.sh"');

    expect(authorizationIndex).toBeGreaterThan(0);
    expect(firstMeasureIndex).toBeGreaterThan(authorizationIndex);
    expect(skill).toContain('measurement_execution_authorization_missing');
    expect(skill).toContain('strategy digest is derived, reconstructable state');
    expect(skill).toContain('experiment log remains the canonical resume and audit source');
  });

  test('product pulse preserves per-source state instead of collapsing it to no data', () => {
    const skill = read('skills/spec-product-pulse/SKILL.md');
    const template = read('skills/spec-product-pulse/references/report-template.md');
    const states = [
      'confirmed-value',
      'confirmed-zero',
      'not-configured',
      'unavailable',
      'permission-denied',
      'partial',
      'not-run',
    ];

    for (const state of states) {
      expect(skill).toContain(state);
      expect(template).toContain(state);
    }
    expect(template).toContain('reason_code');
    expect(template).toContain('freshness');
  });

  test('Xcode URL fallback rejects unsafe schemes and gates non-loopback targets', () => {
    const skill = read('skills/spec-test-xcode/SKILL.md');

    expect(skill).toContain('url_open_authorization: authorized | missing');
    expect(skill).toContain('url_open_authorization_missing');
    expect(skill).toContain('file:`, `data:`, and `javascript:`');
    expect(skill).toContain('loopback HTTP(S)');
  });

  test('promote requires provider egress intent and never inspects secret-like legacy output', () => {
    const skill = read('skills/spec-promote/SKILL.md');
    const spiral = read('skills/spec-promote/references/spiral-cli.md');

    expect(skill).toContain('provider_egress_authorization: authorized | missing');
    expect(skill).toContain('provider_egress_authorization_missing');
    expect(skill).toContain('promotion output is draft-only');
    expect(skill).toContain('local preference exception');
    expect(skill).not.toContain('spiral_sk_');
    expect(spiral).not.toContain('spiral_sk_');
    expect(skill).toContain('scripts/check-spiral-auth.cjs');
    expect(spiral).toContain('captures and discards raw provider stdout/stderr');
    expect(skill).toContain('provider_attempt: attempted');
    expect(skill).not.toContain('silently fall back to Path B');
  });

  test('spec-work limits the no-edit claim to its mode:agent invocation', () => {
    const skill = read('skills/spec-work/SKILL.md');

    expect(skill).toContain("spec-work's `mode:agent` invocation is report-only");
    expect(skill).not.toContain('`spec-code-review` is review-only. It returns findings');
  });

  test('spec-write-tasks has an explicit Claude command metadata template', () => {
    const templatePath = 'templates/claude/commands/spec/write-tasks.md';

    expect(fs.existsSync(templatePath)).toBe(true);
    const template = read(templatePath);
    expect(template).toContain('description:');
    expect(template).toContain('skills/spec-write-tasks/SKILL.md');
  });
});
