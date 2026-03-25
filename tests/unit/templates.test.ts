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

describe('document-links template', () => {
const docLinksCtx = {
  ...BASE_CTX,
  documents: [
    { path: 'prd.md', kind: 'prd', stage: '01_specify', references: [] },
    { path: 'spec.md', kind: 'spec', stage: '01_specify', references: [] },
    { path: 'design.md', kind: 'design', stage: '02_design', references: ['spec.md'] },
    {
      path: 'findings.md',
      kind: 'findings',
      stage: '03_plan',
      references: ['prd.md', 'spec.md', 'design.md', 'task_plan.md'],
    },
    { path: 'task_plan.md', kind: 'task-plan', stage: '03_plan', references: ['spec.md', 'design.md'] },
  ],
};

  it('document-links.yaml.hbs should render YAML skeleton', () => {
    const tpl = compile('docs/document-links.yaml.hbs');
    const out = tpl(docLinksCtx);
    expect(out).toContain('version: 1');
    expect(out).toContain('featureId: FSREQ-20260211-AUTH-001');
    expect(out).toContain('prd.md');
    expect(out).toContain('findings.md');
    expect(out).toContain('task_plan.md');
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
        { name: 'C3-文档存在率', current: '90%', target: '100%', status: 'FAIL' },
        { name: 'C4-引用覆盖率', current: '85%', target: '80%', status: 'PASS' },
      ],
      bottlenecks: [{ metric: 'C3', description: 'Document existence below target' }],
      recommendations: ['Add missing document references'],
    });
    expect(out).toContain('85 / 100');
    expect(out).toContain('C3-文档存在率');
    expect(out).toContain('Document existence below');
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
