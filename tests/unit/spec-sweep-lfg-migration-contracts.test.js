'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..', '..');
const GOVERNANCE_PATH = path.join(
  REPO_ROOT,
  'src',
  'cli',
  'contracts',
  'dual-host-governance',
  'skills-governance.json',
);

const MIGRATED_SKILLS = ['spec-lfg', 'spec-sweep'];

function read(relativePath) {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');
}

function walkFiles(rootDir) {
  const entries = [];
  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const absolutePath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      entries.push(...walkFiles(absolutePath));
    } else if (entry.isFile()) {
      entries.push(absolutePath);
    }
  }
  return entries;
}

describe('spec-sweep and spec-lfg migration contracts', () => {
  test('use spec-prefixed source names', () => {
    for (const skillName of MIGRATED_SKILLS) {
      const skill = read(`skills/${skillName}/SKILL.md`);
      const frontmatter = skill.slice(0, skill.indexOf('\n---', 4));

      expect(frontmatter).toContain(`name: ${skillName}`);
      expect(frontmatter).toContain('description:');
    }
  });

  test('register as dual-host standalone skills', () => {
    const governance = JSON.parse(fs.readFileSync(GOVERNANCE_PATH, 'utf8'));

    for (const skillName of MIGRATED_SKILLS) {
      const record = governance.skills.find((candidate) =>
        candidate.skill_name === skillName,
      );

      expect(record).toEqual({
        skill_name: skillName,
        entry_surface: 'standalone_skill',
        command_name: null,
        host_scope: 'dual_host',
        owner_host: null,
        host_delivery: {
          claude: 'skill',
          codex: 'skill',
          cursor: 'skill',
          kiro: 'skill',
          qoder: 'skill',
        },
      });
    }
  });

  test('rewrites CE names, paths, and command handoffs', () => {
    const content = MIGRATED_SKILLS
      .flatMap((skillName) => walkFiles(path.join(REPO_ROOT, 'skills', skillName)))
      .map((absolutePath) => fs.readFileSync(absolutePath, 'utf8'))
      .join('\n');

    expect(content).not.toContain('name: lfg');
    expect(content).not.toContain('name: ce-sweep');
    expect(content).not.toMatch(/\bce-(plan|work|code-review|simplify-code|test-browser|commit-push-pr|sweep|brainstorm)\b/);
    expect(content).not.toContain('/ce-');
    expect(content).not.toContain('/lfg');
    expect(content).not.toContain('compound-engineering');
    expect(content).not.toContain('Compound Engineering');
    expect(content).not.toContain('.compound-engineering');
    expect(content).not.toContain('/tmp/compound-engineering');
    expect(content).not.toContain('ce-unified-plan/v1');
    expect(content).not.toContain('spec-spec-lfg');
  });

  test('keeps bundled references and scripts self-contained', () => {
    const expectedFiles = [
      'skills/spec-lfg/references/review-followup.md',
      'skills/spec-lfg/references/tracker-defer.md',
      'skills/spec-sweep/references/agents/media-analyzer.md',
      'skills/spec-sweep/references/interview.md',
      'skills/spec-sweep/references/model-tiers.md',
      'skills/spec-sweep/references/plan-template.md',
      'skills/spec-sweep/references/sources/email.md',
      'skills/spec-sweep/references/sources/github-issues.md',
      'skills/spec-sweep/references/sources/slack.md',
      'skills/spec-sweep/references/state-schema.md',
      'skills/spec-sweep/references/subagent-template.md',
      'skills/spec-sweep/scripts/analyze_riffrec_zip.py',
      'skills/spec-sweep/scripts/sweep-state.py',
    ];

    for (const relativePath of expectedFiles) {
      expect(fs.existsSync(path.join(REPO_ROOT, relativePath))).toBe(true);
    }
  });

  test('uses current spec-first sweep setup and brainstorm paths', () => {
    const interview = read('skills/spec-sweep/references/interview.md');
    const analyzer = read('skills/spec-sweep/scripts/analyze_riffrec_zip.py');
    const skill = read('skills/spec-sweep/SKILL.md');

    expect(interview).toContain('<repo-root>/.spec-first/config.local.yaml');
    expect(interview).toContain('work_delegate_*');
    expect(interview).toContain('installed `schedule` helper');
    expect(interview).toContain('spec-sweep mode:headless');

    expect(analyzer).toContain('spec-first-friendly markdown artifacts');
    expect(analyzer).toContain('durable spec-brainstorm outputs live in docs/plans/');
    expect(analyzer).toContain('spec-first requirements document');
    expect(analyzer).toContain('durable unified plan under docs/plans/');
    expect(analyzer).not.toContain('CE-friendly');
    expect(analyzer).not.toContain('CE requirements document');

    expect(skill).toContain('docs/plans/feedback-sweep-plan.md');
    expect(skill).toContain('spec-lfg docs/plans/feedback-sweep-plan.md');
  });

  test('preserves lfg pipeline handoffs and concept trailer contract', () => {
    const skill = read('skills/spec-lfg/SKILL.md');
    const trackerDefer = read('skills/spec-lfg/references/tracker-defer.md');

    expect(skill).toContain('Invoke the `spec-commit-push-pr` skill with `mode:pipeline`.');
    expect(skill).toContain('non-interactively, per the mode token');
    expect(skill).toContain('New concepts:');
    expect(skill).toContain(
      'New concept introduced: <name> — run spec-explain <name> to go deeper.',
    );
    expect(trackerDefer).toContain('autonomous callers (e.g., `spec-lfg`)');
    expect(trackerDefer).toContain('autonomous callers like `spec-lfg`');
  });
});
