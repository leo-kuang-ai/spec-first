'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const MATRIX_PATH = path.join(ROOT, 'docs', 'contracts', 'workflows', 'scenario-capability-matrix.md');
const GOVERNANCE_PATH = path.join(
  ROOT,
  'src',
  'cli',
  'contracts',
  'dual-host-governance',
  'skills-governance.json',
);

const SCENARIO_CLASSES = [
  'clean-single-repo',
  'dirty-single-repo',
  'first-time-git-repo',
  'multi-repo-workspace',
  'multi-repo-dirty-workspace',
  'foreign-residual-workspace',
  'non-git-folder',
  'non-git-build-workspace',
];

const CAPABILITY_CLASSES = [
  'full',
  'bounded',
  'partial',
  'fallback-only',
  'blocked-action-required',
];

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function publicWorkflowSkills() {
  const governance = JSON.parse(fs.readFileSync(GOVERNANCE_PATH, 'utf8'));
  return governance.skills
    .filter((skill) => skill.entry_surface === 'workflow_command')
    .map((skill) => skill.skill_name)
    .sort((a, b) => a.localeCompare(b));
}

function matrixRows(text) {
  return text
    .split(/\r?\n/)
    .filter((line) => line.startsWith('| `'))
    .map((line) => line.trim());
}

function section(text, startHeading, endHeading) {
  const start = text.indexOf(startHeading);
  const end = text.indexOf(endHeading, start + startHeading.length);
  if (start === -1 || end === -1) {
    throw new Error(`Missing section boundaries: ${startHeading} -> ${endHeading}`);
  }
  return text.slice(start, end);
}

function tableCells(row) {
  return row
    .split('|')
    .slice(1, -1)
    .map((cell) => cell.trim());
}

describe('scenario capability matrix contract', () => {
  test('default matrix covers all provisional scenario and capability classes', () => {
    const matrix = read('docs/contracts/workflows/scenario-capability-matrix.md');
    const rows = matrixRows(section(matrix, '## Default Matrix', '## High-Risk Overrides'));

    expect(matrix).toContain('Scenario Capability Matrix');
    expect(matrix).toContain('Scripts prepare the fingerprint facts; LLM workflows decide');
    expect(matrix).toContain('This matrix is advisory. It is not a hard gate');
    expect(matrix).toContain('| Scenario class | Capability class | Required Evidence | Fallback path | LLM decision point |');

    for (const scenarioClass of SCENARIO_CLASSES) {
      expect(rows.some((row) => row.startsWith(`| \`${scenarioClass}\` |`))).toBe(true);
    }

    for (const capabilityClass of CAPABILITY_CLASSES) {
      expect(rows.some((row) => row.includes(`| \`${capabilityClass}\` |`))).toBe(true);
    }
  });

  test('matrix rows use the five-column contract and allowed capability classes', () => {
    const matrix = read('docs/contracts/workflows/scenario-capability-matrix.md');
    const rows = matrixRows(matrix);

    for (const row of rows) {
      const cells = tableCells(row);
      expect(cells).toHaveLength(5);
      expect(CAPABILITY_CLASSES).toContain(cells[1].replace(/`/g, ''));
    }
  });

  test('matrix stays aligned with developer scenario fingerprint provisional classes', () => {
    const fingerprintContract = read('docs/contracts/developer-scenario-fingerprint.md');
    const matrix = read('docs/contracts/workflows/scenario-capability-matrix.md');

    for (const scenarioClass of SCENARIO_CLASSES) {
      expect(fingerprintContract).toContain(`- \`${scenarioClass}\``);
      expect(matrix).toContain(`| \`${scenarioClass}\` |`);
    }
  });

  test('workflow skills that declare scenario capability posture cite the matrix contract', () => {
    for (const workflow of publicWorkflowSkills()) {
      const skill = read(path.join('skills', workflow, 'SKILL.md'));
      if (!skill.includes('## Scenario Capability')) continue;

      expect(skill).toContain('## Scenario Capability');
      expect(skill).toContain('docs/contracts/workflows/scenario-capability-matrix.md');

      if (!skill.includes('Overrides: high-risk')) {
        expect(skill).toContain('Follows `docs/contracts/workflows/scenario-capability-matrix.md` (default).');
        expect(skill).toContain('Overrides: none');
      }
    }
  });

  test('high-risk workflow overrides cover foreign residual and optional external-tool limitations', () => {
    for (const workflow of publicWorkflowSkills()) {
      const skill = read(path.join('skills', workflow, 'SKILL.md'));
      if (!skill.includes('Overrides: high-risk')) continue;

      expect(skill).toContain('Overrides: high-risk');
      expect(skill).toContain('`foreign-residual-workspace` -> `blocked-action-required`');
      expect(skill).toContain('optional external-tool evidence unavailable -> `fallback-only`');
      expect(skill).toContain('`non-git-build-workspace` coverage gaps -> `partial`');
    }
  });
});
