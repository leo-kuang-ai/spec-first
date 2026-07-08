'use strict';

const fs = require('node:fs');
const path = require('node:path');

const TEMPLATE_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-mcp-setup',
  'references',
  'config-template.yaml',
);
const PROJECT_EXAMPLE_PATH = path.join(
  __dirname,
  '..',
  '..',
  '.spec-first',
  'config.local.example.yaml',
);
const CHECK_HEALTH_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-mcp-setup',
  'scripts',
  'check-health',
);
const VERIFY_TOOLS_SH_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-mcp-setup',
  'scripts',
  'verify-tools.sh',
);
const VERIFY_TOOLS_PS1_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-mcp-setup',
  'scripts',
  'verify-tools.ps1',
);
const SKILL_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-mcp-setup',
  'SKILL.md',
);

function markdownSection(content, heading) {
  const lines = content.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === heading);
  if (start === -1) {
    throw new Error(`Missing section: ${heading}`);
  }
  const end = lines.findIndex((line, index) => index > start && /^##\s+/.test(line));
  return lines.slice(start, end === -1 ? lines.length : end).join('\n');
}

describe('spec-mcp-setup config template contract', () => {
  test('runtime setup posture keeps deterministic facts separate from conventions', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');
    const setupDoesNot = markdownSection(text, '## Boundaries').split('Setup does not:')[1];

    expect(text).toContain('Setup Posture And Project Conventions');
    expect(text).toContain('Claude Code, Codex, Kiro, Qoder, or Cursor');
    expect(text).toContain('Generated runtime mirrors under `.claude/`, `.codex/`, `.cursor/skills/`, `.cursor/spec-first/`, `.kiro/`, `.qoder/`, and `.agents/skills/` are not source');
    expect(text).toContain('Kiro MCP config to workspace `.kiro/settings/mcp.json` by default');
    expect(text).toContain('~/.kiro/settings/mcp.json` only after explicit user-scope opt-in');
    expect(text).toContain('Qoder MCP config to local `.qoder/settings.local.json` by default');
    expect(text).toContain('~/.qoder/settings.json` only after explicit user-scope opt-in');
    expect(text).toContain('Cursor MCP config to project `.cursor/mcp.json` by default');
    expect(text).toContain('~/.cursor/mcp.json` only after explicit user-scope opt-in');
    expect(text).toContain('fail closed without an explicit canonical `MCP_SETUP_HOST=claude|codex|kiro|qoder|cursor`');
    expect(text).toContain('Explore -> Present -> Decide -> Write');
    expect(text).toContain('local-only overrides');
    expect(text).toContain('verification_profile_path');
    expect(text).toContain('feedback_sources` and `sweep_*`, read and written by `spec-sweep`');
    expect(text).toContain('pulse_*`, read and written by `spec-product-pulse`');
    expect(text).toContain('spec_promote_spiral_optout`, read and written by `spec-promote`');
    expect(text).toContain('work_delegate_*`, exposed for downstream execution workflows');
    expect(text).toContain('plan_skip_scoping_confirm`, exposed for downstream planning workflows');
    expect(text).toContain('Document rendering keys (`plan_output`, `brainstorm_output`, `ideate_output`) are reserved future hints');
    expect(text).toContain('it must not auto-delegate, skip scoping confirmation, or change host model/runtime behavior merely because a key exists');
    expect(text).toContain('Missing local config is not a blocker');
    expect(text).toContain('deterministic existence facts only');
    expect(text).toContain('Setup must not judge whether terminology is correct');
    expect(setupDoesNot).toContain('treat `.spec-first/config.local.yaml` as team-shared workflow policy');
    expect(setupDoesNot).toContain('decide issue/PR category, state, scope, accept/reject status, or implementation truth');
  });

  test('runtime setup documents a spec-first three-stage setup flow', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('## Three-Stage Setup Flow');
    expect(text).toContain('### Stage 1: Diagnose Target And Readiness');
    expect(text).toContain('### Stage 2: Apply Authorized Setup Actions');
    expect(text).toContain('### Stage 3: Summarize Facts And Next Action');
    expect(text).toContain('Project-local config actions never install providers or edit host config');
    expect(text).toContain('Host/provider actions never migrate local config keys');
    expect(text).toContain('Do not collapse these boundaries into a single "setup complete" statement');
  });

  test('local execution override documents the current verification profile consumer', () => {
    const text = fs.readFileSync(TEMPLATE_PATH, 'utf8');

    expect(text).toContain('This file is a local-only override');
    expect(text).toContain('# --- Local execution overrides ---');
    expect(text).toContain('Current supported consumer: src/verification/profile-loader.js reads this');
    expect(text).toContain('# verification_profile_path: .spec-first/verification-profile.local.json');
    expect(text).not.toMatch(/^verification_profile_path:/m);
  });

  test('active local config consumers are discoverable but remain commented by default', () => {
    const text = fs.readFileSync(TEMPLATE_PATH, 'utf8');

    expect(text).toContain('# --- Feedback sweep ---');
    expect(text).toContain('Active consumer: spec-sweep reads these keys');
    expect(text).toContain('# feedback_sources:');
    expect(text).toContain('# sweep_state_path: docs/feedback-sweep/state.yml');
    expect(text).toContain('# sweep_ack_cap: 25');
    expect(text).toContain('# sweep_lease_ttl_minutes: 60');
    expect(text).toContain('# sweep_shared_branch: false');
    expect(text).toContain('# --- Product pulse ---');
    expect(text).toContain('Active consumer: spec-product-pulse reads these keys');
    expect(text).toContain('# pulse_product_name: "Product name"');
    expect(text).toContain('# pulse_lookback_default: 24h');
    expect(text).toContain('# pulse_metric_sources: "retention_d7=posthog,nps=delighted"');
    expect(text).toContain('# --- Promotion helpers ---');
    expect(text).toContain('Active consumer: spec-promote reads an uncommented top-level');
    expect(text).toContain('# spec_promote_spiral_optout: true');

    for (const key of [
      'feedback_sources',
      'sweep_state_path',
      'sweep_ack_cap',
      'sweep_lease_ttl_minutes',
      'sweep_shared_branch',
      'pulse_product_name',
      'pulse_lookback_default',
      'pulse_primary_event',
      'pulse_metric_sources',
      'spec_promote_spiral_optout',
    ]) {
      expect(text).not.toMatch(new RegExp(`^${key}:`, 'm'));
    }
  });

  test('document rendering hints stay inactive and spec-first scoped', () => {
    const text = fs.readFileSync(TEMPLATE_PATH, 'utf8');

    expect(text).toContain('Copy to .spec-first/config.local.yaml in your project root.');
    expect(text).toContain('# --- Document rendering ---');
    expect(text).toContain('Current spec-first workflows write markdown canonical artifacts.');
    expect(text).toContain('reserved future hints only');
    expect(text).toContain('optional sidecar');
    expect(text).toContain('focused HTML consumer tests');
    expect(text).toContain('# plan_output: html');
    expect(text).toContain('# brainstorm_output: html');
    expect(text).toContain('# ideate_output: html');
    expect(text).toContain('# --- Work delegation ---');
    expect(text).toContain('Integrated local config surface for downstream execution workflows');
    expect(text).toContain('# work_delegate: codex');
    expect(text).toContain('# work_delegate_consent: true');
    expect(text).toContain('# work_delegate_sandbox: yolo');
    expect(text).toContain('# work_delegate_decision: auto');
    expect(text).toContain('# work_delegate_model: gpt-5.4');
    expect(text).toContain('# work_delegate_effort: high');
    expect(text).toContain('# --- Planning confirmation ---');
    expect(text).toContain('Integrated local config surface for downstream planning workflows');
    expect(text).toContain('# plan_skip_scoping_confirm: true');
    expect(text).not.toMatch(/^plan_output:/m);
    expect(text).not.toMatch(/^brainstorm_output:/m);
    expect(text).not.toMatch(/^ideate_output:/m);
    expect(text).not.toMatch(/^work_delegate_/m);
    expect(text).not.toMatch(/^plan_skip_scoping_confirm:/m);
    expect(text).not.toContain('.compound-engineering');
    expect(text).not.toMatch(/\bce-[a-z]/);
    expect(text).not.toContain('exclusive format');
  });

  test('team-shared workflow policy is excluded from local config', () => {
    const text = fs.readFileSync(TEMPLATE_PATH, 'utf8');

    expect(text).toContain('Do not store team-shared tracker policy');
    expect(text).toContain('label vocabulary');
    expect(text).toContain('external PR');
    expect(text).toContain('rejected-scope decisions');
    expect(text).toContain('source-tracked project docs');
    expect(text).not.toMatch(/^tracker_policy:/m);
    expect(text).not.toMatch(/^label_mapping:/m);
    expect(text).not.toMatch(/^external_pr_discovery:/m);
  });

  test('local config example mirrors the source template when present', () => {
    const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
    const projectExample = fs.existsSync(PROJECT_EXAMPLE_PATH)
      ? fs.readFileSync(PROJECT_EXAMPLE_PATH, 'utf8')
      : template;

    expect(projectExample).toBe(template);
  });

  test('check-health treats local config as optional and reports example repair action', () => {
    const text = fs.readFileSync(CHECK_HEALTH_PATH, 'utf8');

    expect(text).toContain('Optional local config not created (.spec-first/config.local.yaml)');
    expect(text).not.toContain('warn "Local config missing (.spec-first/config.local.yaml)"');
    expect(text).toContain('Example config outdated (.spec-first/config.local.example.yaml)');
    expect(text).toContain('bootstrap-project-config.sh\\" --repo \\"$repo_root\\" --refresh-example');
  });

  test('verify status block reports project local config facts on bash and PowerShell paths', () => {
    const bash = fs.readFileSync(VERIFY_TOOLS_SH_PATH, 'utf8');
    const ps1 = fs.readFileSync(VERIFY_TOOLS_PS1_PATH, 'utf8');

    for (const text of [bash, ps1]) {
      expect(text).toContain('project-local-config-status.v1');
      expect(text).toContain('Project local config');
      expect(text).toContain('example config');
      expect(text).toContain('local config gitignore');
      expect(text).toContain('legacy markdown config');
      expect(text).toContain('legacy local config');
      expect(text).toContain('do not migrate old path automatically');
    }
  });
});
