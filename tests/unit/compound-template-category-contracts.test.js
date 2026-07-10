'use strict';

const fs = require('node:fs');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function extractKnowledgeProblemTypes(schema) {
  const knowledgeBlock = schema.match(/\n  knowledge:\n[\s\S]*?\n# --- Fields required by BOTH tracks/);
  if (!knowledgeBlock) throw new Error('knowledge track block not found');

  const problemTypesBlock = knowledgeBlock[0].match(/\n    problem_types:\n((?:      - [^\n]+\n?)+)/);
  if (!problemTypesBlock) throw new Error('knowledge problem_types block not found');

  return problemTypesBlock[1]
    .trim()
    .split('\n')
    .map((line) => line.replace(/^\s*-\s*/, '').trim());
}

function extractKnowledgeTemplateTypes(template) {
  const match = template.match(/## Knowledge Track Template\n\nUse for: ([^\n]+)/);
  if (!match) throw new Error('knowledge template Use for line not found');
  return [...match[1].matchAll(/`([^`]+)`/g)].map((entry) => entry[1]);
}

describe('compound Knowledge Track template categories', () => {
  test.each([
    ['spec-compound', 'skills/spec-compound'],
    ['spec-compound-refresh', 'skills/spec-compound-refresh'],
  ])('%s template stays aligned with the canonical knowledge problem types', (_name, skillDir) => {
    const schemaTypes = extractKnowledgeProblemTypes(read(`${skillDir}/references/schema.yaml`));
    const templateTypes = extractKnowledgeTemplateTypes(read(`${skillDir}/assets/resolution-template.md`));

    expect(templateTypes).toEqual(schemaTypes);
    expect(templateTypes).toEqual([
      'best_practice',
      'documentation_gap',
      'workflow_issue',
      'developer_experience',
      'architecture_pattern',
      'design_pattern',
      'tooling_decision',
      'convention',
    ]);
  });
});
