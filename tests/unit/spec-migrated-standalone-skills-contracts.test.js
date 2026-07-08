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

const MIGRATED_SKILLS = [
  'spec-explain',
  'spec-pov',
  'spec-product-pulse',
  'spec-promote',
  'spec-riffrec-feedback-analysis',
  'spec-simplify-code',
  'spec-strategy',
];

const EXPECTED_ARGUMENT_HINTS = {
  'spec-explain': "[a concept, a diff ref, an idea, or 'what happened this week?'] — or invoke bare to be asked",
  'spec-pov': '[the external thing to judge, plus any links] — or invoke bare mid-session for a second opinion',
  'spec-product-pulse': "[lookback window, e.g. '24h', '7d', '1h'; default 24h]",
  'spec-promote': "[optional: what shipped and/or channels, e.g. 'a tweet thread and a LinkedIn post']",
  'spec-simplify-code': '[blank to simplify current branch changes, or describe what to simplify]',
  'spec-strategy': "[optional: section to revisit, e.g. 'metrics' or 'approach']",
};

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

function migratedSkillFiles() {
  return MIGRATED_SKILLS.flatMap((skillName) =>
    walkFiles(path.join(REPO_ROOT, 'skills', skillName)),
  );
}

describe('migrated CE standalone skills', () => {
  test('use spec-prefixed source names and English skill content', () => {
    for (const skillName of MIGRATED_SKILLS) {
      const skill = read(`skills/${skillName}/SKILL.md`);
      const frontmatter = skill.slice(0, skill.indexOf('\n---', 4));

      expect(skill).toContain(`name: ${skillName}`);
      expect(frontmatter).toContain(`name: ${skillName}`);
      expect(frontmatter).toContain('description:');
      if (Object.hasOwn(EXPECTED_ARGUMENT_HINTS, skillName)) {
        expect(frontmatter).toContain(
          `argument-hint: ${JSON.stringify(EXPECTED_ARGUMENT_HINTS[skillName])}`,
        );
      } else {
        expect(frontmatter).not.toMatch(/^argument-hint:/m);
      }
      expect(frontmatter).not.toMatch(/^allowed-tools:/m);
      expect(frontmatter).not.toMatch(/^disable-model-invocation:/m);
      expect(skill).not.toMatch(/[\u4E00-\u9FFF]/);
    }
  });

  test('rewrites CE-specific skill names, paths, and feedback format references', () => {
    const migratedContent = migratedSkillFiles()
      .map((absolutePath) => fs.readFileSync(absolutePath, 'utf8'))
      .join('\n');

    expect(migratedContent).not.toMatch(
      /\bce-(explain|pov|product-pulse|promote|riffrec-feedback-analysis|simplify-code|strategy|brainstorm|ideate|plan|debug|compound|work|polish|proof)\b/,
    );
    expect(migratedContent).not.toContain('/ce-');
    expect(migratedContent).not.toContain('compound-engineering');
    expect(migratedContent).not.toContain('Compound Engineering');
    expect(migratedContent).not.toContain('.compound-engineering');
    expect(migratedContent).not.toContain('unified CE local config');
    expect(migratedContent).not.toContain('compound-engineering-feedback-format.md');
    expect(fs.existsSync(path.join(
      REPO_ROOT,
      'skills',
      'spec-riffrec-feedback-analysis',
      'references',
      'spec-first-feedback-format.md',
    ))).toBe(true);
  });

  test('registers every migrated skill as a dual-host standalone skill', () => {
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
});
