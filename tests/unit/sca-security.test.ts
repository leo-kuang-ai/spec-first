/**
 * SCA + Security Severity 单元测试
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { analyzeArtifacts, getCriticalCountFromAnalysisReport, renderAnalysisReport, runSca } from '../../src/core/gate-engine/sca.js';
import { validateSecurity, parseSecurityReport } from '../../src/core/gate-engine/security.js';
import { Stage } from '../../src/shared/types.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-sca-security');
const FEAT = 'FSREQ-20260211-AUTH-001';

function writeDocumentLinks(content?: string) {
  writeFileSync(
    join(TMP, 'specs', FEAT, 'document-links.yaml'),
    content ?? `version: 1
featureId: ${FEAT}
documents:
  - path: spec.md
    kind: spec
    stage: 01_specify
    references: []
  - path: design.md
    kind: design
    stage: 02_design
    references: [spec.md]
  - path: task_plan.md
    kind: task-plan
    stage: 03_plan
    references: [spec.md, design.md]
  - path: reports/test-report.md
    kind: report
    stage: 05_verify
    references: [task_plan.md]
  - path: reports/security-scan.md
    kind: report
    stage: 05_verify
    references: [task_plan.md]
`,
    'utf-8'
  );
}

beforeEach(() => {
  mkdirSync(join(TMP, 'specs', FEAT, 'reports'), { recursive: true });
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('runSca', () => {
  it('should pass Specify when spec exists and links declare it', () => {
    writeFileSync(join(TMP, 'specs', FEAT, 'spec.md'), '# spec', 'utf-8');
    writeDocumentLinks();
    const result = runSca(FEAT, TMP, Stage.SPECIFY);
    expect(result.pass).toBe(true);
  });

  it('should fail Specify when spec is missing', () => {
    writeDocumentLinks();
    const result = runSca(FEAT, TMP, Stage.SPECIFY);
    expect(result.pass).toBe(false);
    expect(result.checks.some((c) => c.rule.includes('spec.md 存在'))).toBe(true);
  });

  it('should fail Design when design has no spec reference', () => {
    writeFileSync(join(TMP, 'specs', FEAT, 'spec.md'), '# spec', 'utf-8');
    writeFileSync(join(TMP, 'specs', FEAT, 'design.md'), '# design', 'utf-8');
    writeDocumentLinks();
    const result = runSca(FEAT, TMP, Stage.DESIGN);
    expect(result.pass).toBe(false);
  });

  it('should pass Design when design references spec', () => {
    writeFileSync(join(TMP, 'specs', FEAT, 'spec.md'), '# spec', 'utf-8');
    writeFileSync(join(TMP, 'specs', FEAT, 'design.md'), '# design\nspec.md', 'utf-8');
    writeDocumentLinks();
    const result = runSca(FEAT, TMP, Stage.DESIGN);
    expect(result.pass).toBe(true);
  });

  it('should fail Plan when task plan lacks design reference', () => {
    writeFileSync(join(TMP, 'specs', FEAT, 'spec.md'), '# spec', 'utf-8');
    writeFileSync(join(TMP, 'specs', FEAT, 'design.md'), '# design\nspec.md', 'utf-8');
    writeFileSync(join(TMP, 'specs', FEAT, 'task_plan.md'), '# tasks\nspec.md', 'utf-8');
    writeDocumentLinks();
    const result = runSca(FEAT, TMP, Stage.PLAN);
    expect(result.pass).toBe(false);
  });

  it('should pass Plan when task plan references spec and design', () => {
    writeFileSync(join(TMP, 'specs', FEAT, 'spec.md'), '# spec', 'utf-8');
    writeFileSync(join(TMP, 'specs', FEAT, 'design.md'), '# design\nspec.md', 'utf-8');
    writeFileSync(join(TMP, 'specs', FEAT, 'task_plan.md'), '# tasks\nspec.md\ndesign.md', 'utf-8');
    writeDocumentLinks();
    const result = runSca(FEAT, TMP, Stage.PLAN);
    expect(result.pass).toBe(true);
  });

  it('should fail Verify when reports are missing', () => {
    writeDocumentLinks();
    const result = runSca(FEAT, TMP, Stage.VERIFY);
    expect(result.pass).toBe(false);
  });

  it('should skip SCA for stages without rules', () => {
    const result = runSca(FEAT, TMP, Stage.INIT);
    expect(result.pass).toBe(true);
    expect(result.checks[0].rule).toContain('SKIP');
  });
});

describe('analyzeArtifacts', () => {
  it('should report CRITICAL when required artifact is missing', () => {
    writeDocumentLinks();
    const result = analyzeArtifacts(FEAT, TMP);
    expect(result.summary.CRITICAL).toBeGreaterThan(0);
    expect(result.findings.some((f) => f.type === 'ARTIFACT_MISSING')).toBe(true);
  });

  it('should render report and parse critical count', () => {
    writeFileSync(join(TMP, 'specs', FEAT, 'prd.md'), '# prd', 'utf-8');
    writeFileSync(join(TMP, 'specs', FEAT, 'spec.md'), '# spec', 'utf-8');
    writeFileSync(join(TMP, 'specs', FEAT, 'design.md'), '# design\nspec.md', 'utf-8');
    writeFileSync(join(TMP, 'specs', FEAT, 'task_plan.md'), '# tasks\nspec.md\ndesign.md', 'utf-8');
    writeDocumentLinks();

    const result = analyzeArtifacts(FEAT, TMP);
    const report = renderAnalysisReport(result);
    const critical = getCriticalCountFromAnalysisReport(report);
    expect(critical).toBe(result.summary.CRITICAL);
    expect(report).toContain('Analysis Report');
  });

  it('should not report DESIGN_REF_MISSING when design references spec', () => {
    writeFileSync(join(TMP, 'specs', FEAT, 'prd.md'), '# prd', 'utf-8');
    writeFileSync(join(TMP, 'specs', FEAT, 'spec.md'), '# spec', 'utf-8');
    writeFileSync(join(TMP, 'specs', FEAT, 'design.md'), '# design\nspec.md', 'utf-8');
    writeFileSync(join(TMP, 'specs', FEAT, 'task_plan.md'), '# tasks\nspec.md\ndesign.md', 'utf-8');
    writeDocumentLinks();

    const result = analyzeArtifacts(FEAT, TMP);
    expect(result.findings.some((f) => f.type === 'DESIGN_REF_MISSING')).toBe(false);
  });
});

describe('validateSecurity', () => {
  it('should pass with no findings', () => {
    const result = validateSecurity([]);
    expect(result.pass).toBe(true);
    expect(result.noCritical).toBe(true);
  });

  it('should FAIL with S1 finding (no waiver allowed)', () => {
    const result = validateSecurity([
      { id: 'SEC-001', severity: 'S1', title: 'RCE vulnerability' },
    ]);
    expect(result.pass).toBe(false);
    expect(result.summary.S1).toBe(1);
  });

  it('should FAIL with unwaived S2', () => {
    const result = validateSecurity([
      { id: 'SEC-002', severity: 'S2', title: 'XSS', waived: false },
    ]);
    expect(result.pass).toBe(false);
  });

  it('should PASS with waived S2', () => {
    const result = validateSecurity([
      { id: 'SEC-002', severity: 'S2', title: 'XSS', waived: true },
    ]);
    expect(result.pass).toBe(true);
  });

  it('should PASS with S3 and S4 only', () => {
    const result = validateSecurity([
      { id: 'SEC-003', severity: 'S3', title: 'Info disclosure' },
      { id: 'SEC-004', severity: 'S4', title: 'Suggestion' },
    ]);
    expect(result.pass).toBe(true);
    expect(result.summary.S3).toBe(1);
    expect(result.summary.S4).toBe(1);
  });

  it('should still FAIL if S1 exists even with waived S2', () => {
    const result = validateSecurity([
      { id: 'SEC-001', severity: 'S1', title: 'RCE' },
      { id: 'SEC-002', severity: 'S2', title: 'XSS', waived: true },
    ]);
    expect(result.pass).toBe(false);
  });
});

describe('parseSecurityReport', () => {
  it('should parse markdown table into findings', () => {
    const content =
      '| ID | Severity | Title | Waived |\n' +
      '|----|----------|-------|--------|\n' +
      '| SEC-001 | S1 | RCE | no |\n' +
      '| SEC-002 | S3 | Info | yes |\n';
    const findings = parseSecurityReport(content);
    expect(findings).toHaveLength(2);
    expect(findings[0].severity).toBe('S1');
    expect(findings[1].waived).toBe(true);
  });

  it('should return empty for empty content', () => {
    expect(parseSecurityReport('')).toEqual([]);
  });
});
