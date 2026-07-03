'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('parent artifact quarantine contract', () => {
  test('documents advisory schema and preview-first cleanup boundary', () => {
    const contract = read('docs/contracts/parent-artifact-quarantine.md');
    const artifactMap = read('docs/05-用户手册/04-workflows-artifacts-map.md');

    expect(contract).toContain('parent-artifact-quarantine.v1');
    expect(contract).toContain('authority_level');
    expect(contract).toContain('freshness');
    expect(contract).toContain('spec-first clean --workspace-orphans');
    expect(contract).toContain('spec-first clean --workspace-orphans --confirm');
    expect(contract).toContain('preview-first');
    expect(contract).toContain('foreign-absolute-path-stat-failed');
    expect(contract).toContain('parent-workspace-must-not-have-repo-local-setup-artifact');
    expect(contract).toContain('repo_root-mismatches-workspace-root');
    expect(artifactMap).toContain('parent-artifact-quarantine.json');
    expect(artifactMap).toContain('parent_workspace_pollution_count');
  });

  test('Bash and PowerShell verify-tools emit equivalent quarantine fields', () => {
    const bashSource = read('skills/spec-mcp-setup/scripts/verify-tools.sh');
    const powerShellSource = read('skills/spec-mcp-setup/scripts/verify-tools.ps1');
    const requiredTokens = [
      'parent-artifact-quarantine.v1',
      'multi-repo-workspace',
      'authority_level',
      'freshness',
      'spec-first clean --workspace-orphans',
      'LLM workflow degraded-evidence judgment',
      'parent-workspace-must-not-have-repo-local-setup-artifact',
      'foreign-absolute-path-stat-failed',
      'repo_root-mismatches-workspace-root',
      'parent_workspace_pollution_count',
    ];

    for (const token of requiredTokens) {
      expect(bashSource).toContain(token);
      expect(powerShellSource).toContain(token);
    }
    expect(bashSource).toContain('build_parent_artifact_quarantine_json');
    expect(powerShellSource).toContain('function New-ParentArtifactQuarantine');
  });

  test('clean CLI keeps workspace orphan cleanup separate from runtime cleanup', () => {
    const cleanSource = read('src/cli/commands/clean.js');

    expect(cleanSource).toContain('runWorkspaceOrphansClean');
    expect(cleanSource).toContain('--workspace-orphans cannot be combined with host flags');
    expect(cleanSource).toContain('Run `spec-first clean --workspace-orphans --confirm` to delete listed paths.');
    expect(cleanSource).toContain('isAllowedWorkspaceOrphanPath');
    expect(cleanSource).toContain('schema_version must be parent-artifact-quarantine.v1');
    expect(cleanSource).toContain('paths must be POSIX repo-relative paths');
  });
});
