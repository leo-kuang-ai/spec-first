import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Handlebars from 'handlebars';

const TPL_ROOT = join(import.meta.dirname, '../../templates');

function compile(relPath: string) {
  const src = readFileSync(join(TPL_ROOT, relPath), 'utf-8');
  return Handlebars.compile(src);
}

const BASE_CTX = {
  featureId: 'FSREQ-20260211-AUTH-001',
  title: 'User Auth',
  mode: 'N',
  size: 'M',
  platforms: ['app', 'h5'],
  timestamp: '2026-02-11T00:00:00Z',
  author: 'Leo',
};

describe('init templates', () => {
  it('stage-state.json.hbs should render valid JSON', () => {
    const tpl = compile('init/stage-state.json.hbs');
    const out = tpl(BASE_CTX);
    const parsed = JSON.parse(out);
    expect(parsed.featureId).toBe('FSREQ-20260211-AUTH-001');
    expect(parsed.currentStage).toBe('00_init');
    expect(parsed.platforms).toEqual(['app', 'h5']);
    expect(parsed.terminal).toBe(false);
  });

  it('constitution.md.hbs should render markdown with feature info', () => {
    const tpl = compile('init/constitution.md.hbs');
    const out = tpl(BASE_CTX);
    expect(out).toContain('FSREQ-20260211-AUTH-001');
    expect(out).toContain('User Auth');
    expect(out).toContain('Leo');
    expect(out).toContain('规范先行');
    expect(out).toContain('Version');
    expect(out).toContain('Ratified');
    expect(out).toContain('Amendment History');
  });
});

describe('matrix templates', () => {
  const matrixCtx = {
    ...BASE_CTX,
    rows: [
      { id: 'FR-AUTH-001', type: 'FR', title: 'Login', status: 'Planned', upstream: '', downstream: 'DS-AUTH-001' },
      { id: 'DS-AUTH-001', type: 'DS', title: 'Design', status: 'Planned', upstream: 'FR-AUTH-001', downstream: '' },
    ],
  };

  it('traceability-matrix.md.hbs should render markdown table', () => {
    const tpl = compile('matrix/traceability-matrix.md.hbs');
    const out = tpl(matrixCtx);
    expect(out).toContain('FR-AUTH-001');
    expect(out).toContain('| ID |');
  });

  it('traceability-matrix.yaml.hbs should render YAML', () => {
    const tpl = compile('matrix/traceability-matrix.yaml.hbs');
    const out = tpl(matrixCtx);
    expect(out).toContain('featureId:');
    expect(out).toContain('FR-AUTH-001');
  });
});

describe('gate template', () => {
  it('gate-report.md.hbs should render gate result', () => {
    const tpl = compile('gate/gate-report.md.hbs');
    const out = tpl({
      ...BASE_CTX,
      stage: '01_specify',
      nextStage: '02_design',
      result: 'PASS',
      conditions: [
        { description: 'FR coverage ≥ 80%', type: 'auto', passed: 'PASS', message: '85%' },
      ],
      suggestions: ['Consider adding NFR items'],
    });
    expect(out).toContain('PASS');
    expect(out).toContain('FR coverage');
    expect(out).toContain('Consider adding');
  });
});

describe('review template', () => {
  it('review-report.md.hbs should render review report', () => {
    const tpl = compile('review/review-report.md.hbs');
    const out = tpl({
      ...BASE_CTX,
      reviewer: 'Leo',
      branch: 'feature/auth',
      fileCount: 5,
      additions: 120,
      deletions: 30,
      issueCount: 1,
      issues: [
        { file: 'auth.ts', line: 42, severity: 'WARNING', description: 'Missing null check', suggestion: 'Add guard' },
      ],
      conclusion: 'Approved with minor comments',
    });
    expect(out).toContain('auth.ts');
    expect(out).toContain('Approved');
  });
});

describe('metrics template', () => {
  it('health-report.md.hbs should render health metrics', () => {
    const tpl = compile('metrics/health-report.md.hbs');
    const out = tpl({
      ...BASE_CTX,
      score: 85,
      metrics: [
        { name: 'C1-FR覆盖率', current: '90%', target: '80%', status: 'PASS' },
        { name: 'C2-DS覆盖率', current: '70%', target: '80%', status: 'FAIL' },
      ],
      bottlenecks: [{ metric: 'C2', description: 'DS coverage below target' }],
      recommendations: ['Add missing design specs'],
    });
    expect(out).toContain('85 / 100');
    expect(out).toContain('C1-FR覆盖率');
    expect(out).toContain('DS coverage below');
  });
});

describe('release templates', () => {
  it('release-note.md.hbs should render version and changes', () => {
    const tpl = compile('release/release-note.md.hbs');
    const out = tpl({
      ...BASE_CTX,
      version: '1.0.0',
      summary: 'Initial release of auth module',
      modules: ['auth', 'user'],
      changes: [
        { type: 'feat', description: 'Add login API', id: 'FR-AUTH-001' },
        { type: 'fix', description: 'Fix token refresh' },
      ],
      knownIssues: ['Rate limiting not implemented'],
    });
    expect(out).toContain('1.0.0');
    expect(out).toContain('Initial release');
    expect(out).toContain('FR-AUTH-001');
    expect(out).toContain('Rate limiting');
  });

  it('smoke-test-report.md.hbs should render test results', () => {
    const tpl = compile('release/smoke-test-report.md.hbs');
    const out = tpl({
      ...BASE_CTX,
      version: '1.0.0',
      result: 'PASS',
      tests: [
        { name: 'Login API', passed: 'PASS', duration: '120ms', note: '' },
        { name: 'Token refresh', passed: 'FAIL', duration: '350ms', note: 'Timeout' },
      ],
      totalTests: 2,
      passedTests: 1,
      failedTests: 1,
      passRate: 50,
    });
    expect(out).toContain('Login API');
    expect(out).toContain('50%');
    expect(out).toContain('Timeout');
  });
});
