'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..', '..');

function read(relativePath) {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');
}

describe('SCALE provider documentation contracts', () => {
  test('migrated SCALE reference docs leave current source-of-truth pointers', () => {
    const docsReadme = read('docs/README.md');
    const analysisReadme = read('docs/01-需求分析/README.md');
    const releaseNotes = read('docs/08-版本更新/2026-06-14-v1.10.0-release-notes.md');

    expect(docsReadme).toContain('../spec-first-doc/业界学习/');
    expect(docsReadme).toContain('external-reference');
    expect(docsReadme).toContain('只作启发和对照');
    expect(analysisReadme).toContain('spec-first-doc:业界学习/README.md');
    expect(analysisReadme).toContain('设计史料');
    expect(analysisReadme).toContain('`skills/` 与 `agents/`：当前运行时 source-of-truth');
    expect(analysisReadme).toContain('`CHANGELOG.md`：变更时间线与迁移记录');
    expect(releaseNotes).toContain('Runtime Setup');
    expect(releaseNotes).toContain('direct evidence workflow');
  });

  test('provider readiness and project graph consumption keep readiness and evidence trust separate', () => {
    const readiness = read('docs/contracts/provider-readiness.md');
    const consumption = read('docs/contracts/project-graph-consumption.md');
    const schema = read('docs/contracts/provider-readiness.schema.json');

    expect(readiness).toContain('`provider-readiness.v2` describes mechanical provider readiness');
    expect(readiness).toContain('not workflow truth and not confirmed context');
    expect(readiness).toContain('`readiness_status`: `fresh` / `stale` / `degraded` / `not-run` / `unknown`');
    expect(readiness).toContain('Do not write semantic trust fields such as `advisory`, `evidence_candidate`, or `confirmed_context`');
    expect(readiness).toContain('Provider self-reported `fresh` is not trusted as deterministic freshness');
    expect(readiness).toContain('Workflows may promote provider output only after direct source/test/log/contract/user evidence');

    expect(consumption).toContain('candidate evidence');
    expect(consumption).toContain('The output stays candidate-only');
    expect(consumption).toContain('conclusion-tier claims still require source/test/log/doc confirmation');
    expect(consumption).toContain('provider_untrusted.summaries[]');
    expect(consumption).toContain('direct_evidence_used.source_refs');
    expect(consumption).toContain('no skip-layer elevation');

    expect(schema).toContain('"readiness_status"');
    expect(schema).toContain('"fresh"');
    expect(schema).toContain('"stale"');
    expect(schema).toContain('"degraded"');
    expect(schema).toContain('"not-run"');
    expect(schema).toContain('"unknown"');
    expect(schema).not.toContain('"candidate_trust"');
    expect(schema).not.toContain('"confirmed_context"');
  });

  test('Runtime Setup locks CodeGraph MCP route and Graphify CLI route in current source', () => {
    const plan = read('docs/plans/2026-06-08-004-refactor-provider-native-runtime-setup-plan.md');
    const mcpTools = read('skills/spec-mcp-setup/mcp-tools.json');
    const providerTools = read('skills/spec-mcp-setup/provider-tools.json');

    expect(plan).toContain('skills/spec-mcp-setup/mcp-tools.json');
    expect(plan).toContain('skills/spec-mcp-setup/provider-tools.json');
    expect(plan).toContain('Provider readiness remains advisory');
    expect(plan).toContain('conclusion-level findings still need source/test/log/user evidence');
    expect(plan).toContain('CodeGraph installed/configured/initialized/indexed/status checked');
    expect(plan).toContain('Graphify installed/skill installed/graph generated/hook installed/query probe status');

    expect(mcpTools).toContain('"id": "codegraph"');
    expect(mcpTools).toContain('"external_dependencies"');
    expect(mcpTools).toContain('"package": "@colbymchenry/codegraph"');
    expect(mcpTools).toContain('"package": "@sentropic/graphify"');
    expect(mcpTools).toContain('"dependency_ref": "codegraph"');
    expect(mcpTools).toContain('"kind": "code-structure"');
    expect(mcpTools).toContain('"command": "codegraph"');
    expect(mcpTools).toContain('codegraph serve --mcp');
    expect(mcpTools).toContain('.codegraph/codegraph.db');

    expect(providerTools).toContain('"id": "graphify"');
    expect(providerTools).toContain('"kind": "project-graph"');
    expect(providerTools).toContain('"dependency_ref": "graphify"');
    expect(providerTools).not.toContain('"version_pin"');
    expect(providerTools).toContain('"install_route": "install-helpers"');
    expect(providerTools).toContain('graphify install --project --platform');
    expect(providerTools).toContain('graphify extract .');
    expect(providerTools).toContain('graphify update .');
    expect(providerTools).toContain('graphify hook install');
    expect(providerTools).toContain('"artifact_root": "graphify-out"');
  });
});
