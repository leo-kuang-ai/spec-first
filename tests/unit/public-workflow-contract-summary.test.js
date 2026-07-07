'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const GOVERNANCE_PATH = path.join(
  ROOT,
  'src',
  'cli',
  'contracts',
  'dual-host-governance',
  'skills-governance.json',
);
const REQUIRED_STANDALONE_SUMMARIES = ['using-spec-first'];

function publicWorkflowSkills() {
  const governance = JSON.parse(fs.readFileSync(GOVERNANCE_PATH, 'utf8'));
  return governance.skills
    .filter((skill) => skill.entry_surface === 'workflow_command')
    .map((skill) => skill.skill_name)
    .sort((a, b) => a.localeCompare(b));
}

describe('public workflow contract summary', () => {
  test('all public workflow skills and required standalone entry skills expose a compact I/O and failure summary near the entrypoint', () => {
    for (const workflow of [...publicWorkflowSkills(), ...REQUIRED_STANDALONE_SUMMARIES]) {
      const skillPath = path.join(ROOT, 'skills', workflow, 'SKILL.md');
      const text = fs.readFileSync(skillPath, 'utf8');
      const firstHundredTwentyLines = text.split(/\r?\n/).slice(0, 120).join('\n');

      expect(firstHundredTwentyLines).toMatch(/## (Workflow )?Contract Summary/);
      for (const field of [
        'When To Use',
        'When Not To Use',
        'Inputs',
        'Outputs',
        'Artifacts',
        'Failure Modes',
        'Workflow',
        'Downstream Consumers',
      ]) {
        expect(firstHundredTwentyLines.toLowerCase()).toContain(field.toLowerCase());
      }
    }
  });

  test('summaries preserve source/runtime and script/LLM boundaries', () => {
    const usingSpecFirst = fs.readFileSync(path.join(ROOT, 'skills', 'using-spec-first', 'SKILL.md'), 'utf8');
    const plan = fs.readFileSync(path.join(ROOT, 'skills', 'spec-plan', 'SKILL.md'), 'utf8');
    const writeTasks = fs.readFileSync(path.join(ROOT, 'skills', 'spec-write-tasks', 'SKILL.md'), 'utf8');
    const work = fs.readFileSync(path.join(ROOT, 'skills', 'spec-work', 'SKILL.md'), 'utf8');

    expect(usingSpecFirst).toContain('Core boundary: scripts and CLI commands enforce deterministic invariants when mechanically decidable and prepare deterministic facts; the LLM decides the workflow recommendation above that fact floor.');
    expect(plan).toContain('setup/runtime facts stay advisory');
    expect(plan).toContain('implementation-dependent questions are deferred to `spec-work`');
    expect(writeTasks).toContain('Task packs are derived execution indexes and never replace the source plan.');
    expect(work).toContain('planned spec-work run JSON schema is not current runtime truth');
    expect(work).toContain('hand-editing generated runtime mirrors as source fixes');
  });

  test('Phase 2 batch-1 summaries preserve workflow boundaries', () => {
    const brainstorm = fs.readFileSync(path.join(ROOT, 'skills', 'spec-brainstorm', 'SKILL.md'), 'utf8');
    const debug = fs.readFileSync(path.join(ROOT, 'skills', 'spec-debug', 'SKILL.md'), 'utf8');
    const setup = fs.readFileSync(path.join(ROOT, 'skills', 'spec-mcp-setup', 'SKILL.md'), 'utf8');

    expect(brainstorm).toContain('planning would otherwise invent WHAT to build');
    expect(debug).toContain('root cause must be established before changing code');
    expect(setup).toContain('Setup must not make semantic code-understanding judgments');
    expect(setup).toContain('Project setup facts');
  });

  test('Phase 3 batch-2 summaries preserve workflow-specific boundaries', () => {
    const appAudit = fs.readFileSync(path.join(ROOT, 'skills', 'spec-app-consistency-audit', 'SKILL.md'), 'utf8');
    const compound = fs.readFileSync(path.join(ROOT, 'skills', 'spec-compound', 'SKILL.md'), 'utf8');
    const compoundRefresh = fs.readFileSync(path.join(ROOT, 'skills', 'spec-compound-refresh', 'SKILL.md'), 'utf8');
    const ideate = fs.readFileSync(path.join(ROOT, 'skills', 'spec-ideate', 'SKILL.md'), 'utf8');
    const optimize = fs.readFileSync(path.join(ROOT, 'skills', 'spec-optimize', 'SKILL.md'), 'utf8');
    const polish = fs.readFileSync(path.join(ROOT, 'skills', 'spec-polish', 'SKILL.md'), 'utf8');
    const releaseNotes = fs.readFileSync(path.join(ROOT, 'skills', 'spec-release-notes', 'SKILL.md'), 'utf8');
    const sessions = fs.readFileSync(path.join(ROOT, 'skills', 'spec-sessions', 'SKILL.md'), 'utf8');
    const skillAudit = fs.readFileSync(path.join(ROOT, 'skills', 'spec-skill-audit', 'SKILL.md'), 'utf8');
    const slack = fs.readFileSync(path.join(ROOT, 'skills', 'spec-slack-research', 'SKILL.md'), 'utf8');

    expect(appAudit).toContain('static-first consistency audit');
    expect(compound).toContain('One durable solution document');
    expect(compoundRefresh).toContain('refresh report plus scoped edits under `docs/solutions/`');
    expect(ideate).toContain('ranked ideation artifact in `docs/ideation/`');
    expect(optimize).toContain('measurement scaffold and experiment log');
    expect(polish).toContain('inspect the feature in browser');
    expect(releaseNotes).toContain('version-cited release summary');
    expect(sessions).toContain('distilled replay references');
    expect(skillAudit).toContain('deterministic release/governance guard results');
    expect(slack).toContain('interpreted Slack research digest');
  });
});
