'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..', '..');
const SKILL_PATH = path.join(REPO_ROOT, 'skills', 'spec-standards', 'SKILL.md');
const COMMAND_PATH = path.join(REPO_ROOT, 'templates', 'claude', 'commands', 'spec', 'standards.md');
const MANIFEST_PATH = path.join(REPO_ROOT, '.claude-plugin', 'plugin.json');
const GOVERNANCE_PATH = path.join(
  REPO_ROOT,
  'src',
  'cli',
  'contracts',
  'dual-host-governance',
  'skills-governance.json',
);
const SCHEMA_ROOT = path.join(REPO_ROOT, 'docs', 'contracts', 'specs');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function readJson(filePath) {
  return JSON.parse(read(filePath));
}

describe('spec-standards workflow contract', () => {
  test('source skill keeps MVP-A proposal-only and CRG-first boundaries', () => {
    const skill = read(SKILL_PATH);

    expect(skill).toContain('name: spec-standards');
    expect(skill).toContain('$spec-standards [target-repo-path]');
    expect(skill).toContain('/spec:standards');
    expect(skill).toContain('spec-first crg workflow-context --stage=plan --repo=<target> --task="generate project standards"');
    expect(skill).toContain('compatibility read mode');
    expect(skill).toContain('direct-only degraded mode');
    expect(skill).toContain('proposal payload, not files');
    expect(skill).toContain('docs/contracts/specs/standards-proposal-payload-v1.schema.json');
    expect(skill).toContain('spec-first specs write-proposal');
    expect(skill).toContain('spec-first specs validate-run');
    expect(skill).toContain('spec-first specs promote --run-id <run-id> --target <target-repo> --accept-all');
    expect(skill).toContain('--accept drafts/common/architecture.md');
    expect(skill).toContain('edit the draft markdown inside the proposal run first');
    expect(skill).toContain('promote` fails closed unless `--accept-all` or at least one of `--accept` / `--reject` / `--defer` is present');
    expect(skill).toContain('source=manual` files are never overwritten');
    expect(skill).toContain('spec-first specs index --target <target-repo>');
    expect(skill).toContain('spec-first specs check --target <target-repo> --changed --base <ref>');
    expect(skill).toContain('docs/specs/reports/spec-check-report.md');
    expect(skill).toContain('spec-first specs refresh --target <target-repo> --index-only');
    expect(skill).toContain('docs/specs/reports/spec-refresh-report.md');
    expect(skill).toContain('not modify `docs/specs/**/*.md` standards outside `_index/**` and `reports/**`');
    expect(skill).toContain('spec-first specs list --target <target-repo> --scope backend');
    expect(skill).toContain('spec-first specs validate --target <target-repo>');
    expect(skill).toContain('without changing files');
    expect(skill).toContain('It must set `hard_gate=false`');
    expect(skill).toContain('.spec-first/workflows/spec-standards/<target-slug>/<run-id>/');
    expect(skill).toContain('Formal `docs/specs/**` standards are written only when the user explicitly confirms promotion');
  });

  test('Claude command, plugin manifest, and governance expose standards as dual-host workflow', () => {
    const command = read(COMMAND_PATH);
    const manifest = readJson(MANIFEST_PATH);
    const governance = readJson(GOVERNANCE_PATH);

    expect(command).toContain('description: "Run the Spec-First standards proposal workflow"');
    expect(command).toContain('skills/spec-standards/SKILL.md');

    expect(manifest.commands).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'standards',
          filename: 'standards.md',
          skill: 'spec-standards',
        }),
      ]),
    );
    expect(manifest.skills).toContain('spec-standards');

    expect(governance.skills).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          skill_name: 'spec-standards',
          entry_surface: 'workflow_command',
          command_name: 'standards',
          host_scope: 'dual_host',
          host_delivery: {
            claude: 'command',
            codex: 'skill',
          },
        }),
      ]),
    );
  });

  test('MVP-A schema files exist for helper handoff and validate-run coverage', () => {
    for (const fileName of [
      'standards-proposal-payload-v1.schema.json',
      'standards-run-state-v1.schema.json',
      'detected-profiles-v1.schema.json',
      'evidence-map-v1.schema.json',
      'spec-frontmatter-v1.schema.json',
      'standards-refresh-proposal-request-v1.schema.json',
    ]) {
      expect(fs.existsSync(path.join(SCHEMA_ROOT, fileName))).toBe(true);
    }

    const payloadSchema = readJson(path.join(SCHEMA_ROOT, 'standards-proposal-payload-v1.schema.json'));
    const frontmatterSchema = readJson(path.join(SCHEMA_ROOT, 'spec-frontmatter-v1.schema.json'));
    const refreshRequestSchema = readJson(path.join(SCHEMA_ROOT, 'standards-refresh-proposal-request-v1.schema.json'));

    expect(payloadSchema.properties.consumer.const).toBe('spec-standards');
    expect(payloadSchema.properties.evidence_mode.enum).toEqual(['crg-first', 'direct-only', 'mixed']);
    expect(frontmatterSchema.properties.priority.type).toBe('integer');
    expect(frontmatterSchema.properties.severity.enum).toEqual(['info', 'low', 'medium', 'high', 'critical']);
    expect(frontmatterSchema.properties.confidence.enum).toEqual(['low', 'medium', 'high']);
    expect(refreshRequestSchema.properties.schema_version.const).toBe('standards-refresh-proposal-request/v1');
    expect(refreshRequestSchema.properties.mode.const).toBe('changed');
    expect(refreshRequestSchema.properties.hard_gate.const).toBe(false);
    expect(refreshRequestSchema.properties.source_index.const).toBe('docs/specs/_index/specs-index.json');
  });
});
