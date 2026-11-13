'use strict';

const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../skills/spec-ideate');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

describe('ideate phase ownership', () => {
  test('loads phase owners before decisions, including clear and atomic subjects', () => {
    const entry = read('SKILL.md');
    expect(entry).toContain('even when scope and format are already clear');
    expect(entry).toContain('before deciding whether the subject is atomic');
    expect(entry).toContain('Only Surprise me may skip this read');
    expect(entry).toContain('before critique, persistence, or handoff');
    for (const name of ['output-mode', 'scope-gates', 'grounding', 'decomposition',
      'divergent-ideation', 'post-ideation-workflow', 'universal-ideation']) {
      expect(entry).toContain(`references/${name}.md`);
      expect(read(`references/${name}.md`).length).toBeGreaterThan(100);
    }
    expect(read('references/scope-gates.md')).not.toContain('#### 0.0 Resolve Output Mode');
    expect(read('references/scope-gates.md')).not.toContain('### Phase 1.5:');
  });

  test('keeps one output/resume owner with runtime root resolution and pipeline precedence', () => {
    const output = read('references/output-mode.md');
    expect(output).toContain('at runtime with `git rev-parse --show-toplevel`');
    expect(output).not.toContain('!`');
    expect(output).toContain('active (non-commented)');
    expect(output).toContain('last 30 days');
    expect(output).toContain('skip the resume scan');
    expect(output).toContain('force `OUTPUT_FORMAT=md`');
    expect(output).toContain('leave the original in place');
    expect(output).toContain('Ignored unknown output:');
  });

  test('preserves resolved scaling, verified bases, and actual conditional cost', () => {
    const scope = read('references/scope-gates.md');
    expect(scope).toContain('`go deep` suppresses tactical scope entirely');
    expect(scope).toContain('3-4 ideas per frame; 2-3 verification reads per agent');
    expect(scope).toContain('never a memorized total');
    expect(scope).toContain('Quick/Standard universal generation has no ideation workers');
    expect(scope).not.toMatch(/Will dispatch ~\d+/);
    expect(read('references/decomposition.md')).toContain('Never retain more axes than scouts');
    expect(read('references/divergent-ideation.md')).toContain('per agent, not per frame');
    for (const file of ['post-ideation-workflow', 'universal-ideation']) {
      expect(read(`references/${file}.md`)).toMatch(/tell.*verifier[\s\S]*meeting-test/i);
    }
  });

  test('routes evidence before batching and carries staged issue coverage through consolidation', () => {
    const grounding = read('references/grounding.md');
    expect(grounding).toMatch(/Before either grounding batch[\s\S]*user-research-artifacts\.md/);
    expect(grounding).toContain('before any scoping question');
    expect(grounding).toContain('same saved scan');
    const issue = read('references/issue-intelligence.md');
    const analyst = read('references/agents/issue-intelligence-analyst.md');
    for (const stage of ['SCAN', 'CLUSTER']) {
      expect(issue).toContain(stage);
      expect(analyst).toContain(stage);
    }
    expect(issue).toContain('fewer than 5 eligible issues');
    expect(issue).toContain('do not refetch');
    expect(issue).toContain('fetched/eligible/analyzed/excluded/unknown-remainder');
    expect(issue).toContain('representative sample of everything');
    expect(analyst).toContain('Missing scan data returns `Issue analysis unavailable:`');
    expect(read('references/web-research-cache.md')).toContain('never inspect sibling run directories');
  });

  test('keeps English source and resolvable local reference pointers', () => {
    for (const file of walk(root)) {
      if (!file.endsWith('.md')) continue;
      const source = fs.readFileSync(file, 'utf8');
      if (file === path.join(root, 'SKILL.md')) expect(source).not.toMatch(/[\u3400-\u9fff]/u);
      for (const match of source.matchAll(/`(references\/[a-z0-9/-]+\.md)`/g)) {
        expect(fs.existsSync(path.join(root, match[1]))).toBe(true);
      }
    }
  });
});

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}
