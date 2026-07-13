'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  resolveContainedProjectPath,
  classifyGraphFreshness,
} = require('../../skills/spec-mcp-setup/scripts/lib/workspace-graph-scope.cjs');

function mkWorkspace() {
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-scope-')));
}

describe('resolveContainedProjectPath — CR6 containment (advisory)', () => {
  test('a child path inside the workspace resolves', () => {
    const ws = mkWorkspace();
    fs.mkdirSync(path.join(ws, '工程3'), { recursive: true });
    const result = resolveContainedProjectPath(ws, '工程3');
    expect(result.ok).toBe(true);
    expect(result.project_path).toBe(path.join(ws, '工程3'));
    expect(result.enforcement).toBe('advisory');
  });

  test('a projectPath pointing at another requirement folder is rejected', () => {
    const parent = mkWorkspace();
    const wsA = path.join(parent, '需求A');
    const wsB = path.join(parent, '需求B');
    fs.mkdirSync(path.join(wsB, '工程3'), { recursive: true });
    fs.mkdirSync(wsA, { recursive: true });
    const result = resolveContainedProjectPath(wsA, path.join(wsB, '工程3'));
    expect(result.ok).toBe(false);
    expect(result.reason_code).toBe('project-path-outside-workspace');
  });

  test('a .. traversal escaping the workspace is rejected', () => {
    const ws = mkWorkspace();
    const result = resolveContainedProjectPath(ws, '../elsewhere');
    expect(result.ok).toBe(false);
    expect(result.reason_code).toBe('project-path-outside-workspace');
  });

  test('missing projectPath is reported, not guessed', () => {
    const ws = mkWorkspace();
    expect(resolveContainedProjectPath(ws, '').ok).toBe(false);
    expect(resolveContainedProjectPath(ws, null).reason_code).toBe('project-path-missing');
  });
});

describe('classifyGraphFreshness — empty results carry no negative authority (CR12)', () => {
  test('no results never becomes "absence"', () => {
    const fact = classifyGraphFreshness({
      scope_id: '工程3',
      scope_kind: 'child',
      provider: 'codegraph',
      freshness: 'partial',
      hasResults: false,
    });
    expect(fact.negative_authority).toBe(false);
    expect(fact.empty_meaning).toBe('no-results-not-absence');
    expect(fact.trust).toBe('provider_untrusted');
  });

  test('unknown freshness is preserved; invalid values fall back to unknown', () => {
    expect(classifyGraphFreshness({ freshness: 'bogus' }).freshness).toBe('unknown');
    expect(classifyGraphFreshness({ freshness: 'stale' }).freshness).toBe('stale');
  });

  test('limitations are carried through', () => {
    const fact = classifyGraphFreshness({
      scope_kind: 'workspace',
      provider: 'graphify',
      limitations: ['pending-file: 工程3/x.ts'],
    });
    expect(fact.limitations).toEqual(['pending-file: 工程3/x.ts']);
  });
});
