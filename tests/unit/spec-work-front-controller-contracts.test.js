'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');
const skillPath = path.join(repoRoot, 'skills/spec-work/SKILL.md');
const referencesRoot = path.join(repoRoot, 'skills/spec-work/references');

const runtimeReferences = [
  'work-intake-and-task-pack.md',
  'non-code-execution.md',
  'execution-strategy.md',
  'execution-engines.md',
  'feedback-and-tests.md',
  'implementation-quality.md',
  'shipping-workflow.md',
  'review-findings-followup.md',
  'tracker-defer.md',
];

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function section(markdown, heading) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (start < 0) return '';
  const end = lines.findIndex((line, index) => index > start && /^##\s+/.test(line));
  return lines.slice(start + 1, end < 0 ? lines.length : end).join('\n').trim();
}

describe('spec-work front controller and reference reachability', () => {
  const skill = read(skillPath);

  test('keeps a compact contract spine with direct P0 anchors', () => {
    expect(skill).toContain('## Workflow Contract Summary');
    expect(skill).toContain('## Reference Trigger Map');
    expect(skill).toContain('target_repo');
    expect(skill).toContain('generated runtime mirrors are never source fixes');
    expect(skill).toContain('task-pack/source-plan drift');
    expect(skill).toContain('failed required review/verification');
    expect(skill).toContain('Local mutation, commit, landing, lifecycle, and durable evidence are separate exits');

    const stat = fs.statSync(skillPath);
    const lines = skill.split(/\r?\n/).length;
    expect(lines).toBeLessThan(462);
    expect(stat.size).toBeLessThan(49968);
  });

  test.each(runtimeReferences)('%s has one-level owner, non-owner, trigger, and fallback contracts', (fileName) => {
    const markdown = read(path.join(referencesRoot, fileName));
    for (const heading of ['Owned', 'Not Owned', 'Trigger', 'Fallback']) {
      expect(section(markdown, heading)).not.toBe('');
    }
  });

  test('reference map uses real one-level markdown links for every runtime owner', () => {
    for (const fileName of runtimeReferences) {
      const target = `references/${fileName}`;
      expect(skill).toContain(`](${target})`);
      expect(fs.existsSync(path.join(repoRoot, 'skills/spec-work', target))).toBe(true);
      expect(fileName.split('/')).toHaveLength(1);
    }
  });

  test('unread fallbacks preserve conservative behavior', () => {
    const intake = read(path.join(referencesRoot, 'work-intake-and-task-pack.md'));
    const strategy = read(path.join(referencesRoot, 'execution-strategy.md'));
    const feedback = read(path.join(referencesRoot, 'feedback-and-tests.md'));
    const quality = read(path.join(referencesRoot, 'implementation-quality.md'));
    const shipping = read(path.join(referencesRoot, 'shipping-workflow.md'));

    expect(section(intake, 'Fallback')).toMatch(/stop before creating or continuing execution tasks/i);
    expect(section(strategy, 'Fallback')).toMatch(/run inline/i);
    expect(section(strategy, 'Fallback')).toMatch(/do not push.*do not open a PR/is);
    expect(section(feedback, 'Fallback')).toMatch(/最窄已知检查.*claim ceiling/is);
    expect(section(quality, 'Fallback')).toMatch(/不输出架构矩阵/is);
    expect(section(shipping, 'Fallback')).toMatch(/do not claim completion.*commit.*push.*open a PR/is);
  });

  test('source-only evals carry trigger and non-trigger routing cases', () => {
    const examples = JSON.parse(read(path.join(repoRoot, 'skills/spec-work/evals/examples.json')));
    const ids = new Set(examples.cases.map((entry) => entry.id));
    for (const id of [
      'valid-task-pack-intake',
      'direct-plan-does-not-trigger-task-pack-intake',
      'trivial-non-trigger',
      'knowledge-work-code-references-not-triggered',
      'shipping-not-triggered-mid-execution',
      'tracker-defer-not-triggered-without-choice',
      'non-default-engine-not-triggered-without-capability',
    ]) expect(ids).toContain(id);
  });
});
