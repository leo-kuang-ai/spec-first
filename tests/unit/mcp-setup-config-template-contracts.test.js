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
    expect(text).toContain('Claude Code, Codex, Kiro, or Qoder');
    expect(text).toContain('Generated runtime mirrors under `.claude/`, `.codex/`, `.kiro/`, `.qoder/`, and `.agents/skills/` are not source');
    expect(text).toContain('Kiro MCP config to workspace `.kiro/settings/mcp.json` by default');
    expect(text).toContain('~/.kiro/settings/mcp.json` only after explicit user-scope opt-in');
    expect(text).toContain('Qoder MCP config to local `.qoder/settings.local.json` by default');
    expect(text).toContain('~/.qoder/settings.json` only after explicit user-scope opt-in');
    expect(text).toContain('Explore -> Present -> Decide -> Write');
    expect(text).toContain('local-only overrides');
    expect(text).toContain('verification_profile_path');
    expect(text).toContain('Document output/provider keys in the template are reserved future hints');
    expect(text).toContain('Missing local config is not a blocker');
    expect(text).toContain('deterministic existence facts only');
    expect(text).toContain('Setup must not judge whether terminology is correct');
    expect(setupDoesNot).toContain('treat `.spec-first/config.local.yaml` as team-shared workflow policy');
    expect(setupDoesNot).toContain('decide issue/PR category, state, scope, accept/reject status, or implementation truth');
  });

  test('local execution override documents the current verification profile consumer', () => {
    const text = fs.readFileSync(TEMPLATE_PATH, 'utf8');

    expect(text).toContain('This file is a local-only override');
    expect(text).toContain('# --- Local execution overrides ---');
    expect(text).toContain('Current supported consumer: src/verification/profile-loader.js reads this');
    expect(text).toContain('# verification_profile_path: .spec-first/verification-profile.local.json');
    expect(text).not.toMatch(/^verification_profile_path:/m);
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
    expect(text).not.toMatch(/^plan_output:/m);
    expect(text).not.toMatch(/^brainstorm_output:/m);
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
});
