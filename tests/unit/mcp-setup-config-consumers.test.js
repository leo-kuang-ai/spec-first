'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { getSupportedPlatforms } = require('../../src/cli/adapters');
const { PLATFORM_REGISTRY } = require('../../src/cli/adapters/platform-registry');
const {
  currentProviderHost,
  projectSkillCandidates,
} = require('../../skills/spec-mcp-setup/scripts/provider-readiness-renderer.cjs');

const repoRoot = path.resolve(__dirname, '../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('spec-mcp-setup active config consumers', () => {
  test('documents every active Product Pulse scheduling key', () => {
    const template = read('skills/spec-mcp-setup/references/config-template.yaml');
    const pulse = read('skills/spec-product-pulse/SKILL.md');

    expect(pulse).toContain('pulse_schedule');
    expect(template).toContain('# pulse_schedule: manual');
    expect(template).toContain('daily | weekly | manual | ask-again-after-3-runs');
  });

  test('classifies ideate_output as active while plan and brainstorm remain reserved', () => {
    const setup = read('skills/spec-mcp-setup/SKILL.md');
    const template = read('skills/spec-mcp-setup/references/config-template.yaml');
    const ideate = read('skills/spec-ideate/SKILL.md');

    expect(ideate).toContain('active (non-commented)** `ideate_output:`');
    expect(setup).toContain('`ideate_output` is active');
    expect(setup).toContain('`plan_output` and `brainstorm_output` are reserved future hints');
    expect(template).toContain('# ideate_output: html     # active: md | html');
    expect(template).toContain('# plan_output: html       # reserved: md | html');
    expect(template).toContain('# brainstorm_output: html # reserved: md | html');
  });
});

describe('spec-mcp-setup provider host routing', () => {
  test('accepts every supported platform without falling back to Codex', () => {
    for (const platform of getSupportedPlatforms()) {
      expect(currentProviderHost({ SPEC_FIRST_PROVIDER_HOST: platform })).toBe(platform);
    }
    expect(currentProviderHost({ SPEC_FIRST_PROVIDER_HOST: 'unknown' })).toBe('codex');
  });

  test('uses each platform registry skill root for project provider detection', () => {
    for (const platform of getSupportedPlatforms()) {
      const candidates = projectSkillCandidates('/repo', 'graphify', platform)
        .map((candidate) => candidate.replaceAll('\\', '/'));
      const skillsRoot = PLATFORM_REGISTRY[platform].surfaces.skillsRoot.path;
      expect(candidates).toContain(`/repo/${skillsRoot}graphify/SKILL.md`);
    }
  });

  test('keeps Bash and PowerShell Graphify platform allowlists aligned', () => {
    const shell = read('skills/spec-mcp-setup/scripts/install-helpers.sh');
    const powershell = read('skills/spec-mcp-setup/scripts/install-helpers.ps1');
    const platforms = getSupportedPlatforms();

    expect(shell).toContain(`${platforms.join('|')}) printf '%s'`);
    expect(powershell).toContain(`@('${platforms.join("', '")}') -contains $hostValue`);
  });
});
