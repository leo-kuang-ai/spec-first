'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { finalizePrd } = require('../../skills/spec-prd/scripts/finalize-prd-artifact');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

describe('spec-prd validate report-only mode', () => {
  test('front controller locks validate to report-only before evidence gathering', () => {
    const skill = read('skills/spec-prd/SKILL.md');

    expect(skill).toContain('intent=validate locks mutation_posture=report-only');
    expect(skill).toContain('validate never writes or rewrites the PRD, never runs finalize in write mode, and never refreshes runtime');
    expect(skill).toContain('validate and fix');
    expect(skill).toContain('reclassify the confirmed follow-up as `refine`');
  });

  test('output and readiness contracts keep validate separate from refine rewrite/finalize', () => {
    const output = read('skills/spec-prd/references/prd-output-template.md');
    const readiness = read('skills/spec-prd/references/prd-readiness-lens.md');
    const validateStart = output.indexOf('For validate mode');
    const validateEnd = output.indexOf('For refine mode', validateStart);
    const validateContract = output.slice(validateStart, validateEnd);

    expect(validateStart).toBeGreaterThanOrEqual(0);
    expect(validateEnd).toBeGreaterThan(validateStart);
    expect(validateContract).toContain('report-only');
    expect(validateContract).toContain('`--check-only`');
    expect(validateContract).not.toContain('rewritten PRD');
    expect(readiness).toContain('Validate-mode exception: use `--check-only` and receipt verification only');
    expect(readiness).toContain('A validate run never invokes the write-mode finalizer');
  });

  test('validate design-source branch forbids screenshot or provider JSON materialization', () => {
    const design = read('skills/spec-prd/references/design-source-evidence.md');

    expect(design).toContain('Validate report-only boundary');
    expect(design).toContain('do not persist or materialize screenshots, exports, or provider JSON');
    expect(design).toContain('record the remote URL as a sanitized ref with degraded/unread consequence');
  });

  test('check-only validation leaves artifact bytes, mtime, receipt, and workspace unchanged', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-prd-validate-mode-'));
    const prdPath = path.join(projectRoot, 'docs', 'brainstorms', 'validate-requirements.md');
    const content = [
      '---',
      'artifact_kind: prd-requirements',
      'status: draft',
      '---',
      '# Validate Fixture',
      '',
      'Figma: https://www.figma.com/file/example/Validate?node-id=1-2',
      '',
      '## Summary',
      '',
      '只读验证。',
      '',
    ].join('\n');
    try {
      write(prdPath, content);
      const before = {
        bytes: fs.readFileSync(prdPath),
        mtimeMs: fs.statSync(prdPath).mtimeMs,
        files: fs.readdirSync(path.dirname(prdPath)).sort(),
      };

      const report = finalizePrd(prdPath, [], { checkOnly: true });

      const after = {
        bytes: fs.readFileSync(prdPath),
        mtimeMs: fs.statSync(prdPath).mtimeMs,
        files: fs.readdirSync(path.dirname(prdPath)).sort(),
      };
      expect(report.wrote_ready_receipt).toBeUndefined();
      expect(after.bytes.equals(before.bytes)).toBe(true);
      expect(after.mtimeMs).toBe(before.mtimeMs);
      expect(after.files).toEqual(before.files);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('eval fixture covers validate-only, Figma degraded, and explicit refine re-entry', () => {
    const cases = new Map(JSON.parse(read('skills/spec-prd/evals/examples.json')).cases
      .map((entry) => [entry.id, entry]));

    expect(cases.get('validate-report-only-existing-prd')).toBeDefined();
    expect(cases.get('validate-figma-degraded-no-materialization')).toBeDefined();
    expect(cases.get('validate-and-fix-reenters-refine')).toBeDefined();
    expect(cases.get('codex-degraded-producer-finalize').intent).toBe('refine');
  });
});
