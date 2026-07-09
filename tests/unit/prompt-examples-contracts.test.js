'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..', '..');
const EXAMPLE_FILES = [
  ['spec-work', path.join(REPO_ROOT, 'skills', 'spec-work', 'evals', 'examples.json'), 'skills/spec-work/evals/examples.json'],
];
const PLACEHOLDER_PATTERN = /\b(?:TODO|TBD|foo|bar)\b|example 1/i;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

describe('prompt examples baseline contracts', () => {
  test.each(EXAMPLE_FILES)('%s examples file follows prompt-examples/v1 shape', (skill, filePath) => {
    expect(fs.existsSync(filePath)).toBe(true);
    const payload = readJson(filePath);

    expect(payload.schema_version).toBe('prompt-examples/v1');
    expect(payload.skill).toBe(skill);
    expect(Array.isArray(payload.examples)).toBe(true);
    expect(payload.examples.length).toBeGreaterThanOrEqual(4);
    expect(payload.examples.length).toBeLessThanOrEqual(6);

    const seenNames = new Set();
    for (const example of payload.examples) {
      expect(typeof example.name).toBe('string');
      expect(example.name.trim()).toBe(example.name);
      expect(example.name.length).toBeGreaterThan(0);
      expect(seenNames.has(example.name)).toBe(false);
      seenNames.add(example.name);

      for (const field of ['user_intent', 'expected_posture', 'boundary_note', 'source_note']) {
        expect(typeof example[field]).toBe('string');
        expect(example[field].trim().length).toBeGreaterThan(0);
      }

      for (const field of ['negative_signal', 'context_snippets']) {
        if (example[field] === undefined) continue;
        if (Array.isArray(example[field])) {
          expect(example[field].length).toBeGreaterThan(0);
          for (const item of example[field]) {
            expect(typeof item).toBe('string');
            expect(item.trim().length).toBeGreaterThan(0);
          }
        } else {
          expect(typeof example[field]).toBe('string');
          expect(example[field].trim().length).toBeGreaterThan(0);
        }
      }

      const serialized = JSON.stringify(example);
      expect(serialized).not.toMatch(PLACEHOLDER_PATTERN);
    }
  });

  test.each(EXAMPLE_FILES)('%s skill prompt references examples as context', (skill, _filePath, relativeExamplePath) => {
    const skillPrompt = fs.readFileSync(path.join(REPO_ROOT, 'skills', skill, 'SKILL.md'), 'utf8');

    expect(skillPrompt).toContain(relativeExamplePath);
    expect(skillPrompt).toContain('examples-as-context');
    expect(skillPrompt).toContain('not');
  });
});
