'use strict';

const fs = require('node:fs');
const path = require('node:path');

const {
  normalizeFixtureFile,
  validateNormalizedCases,
} = require('../../skills/spec-skill-audit/scripts/eval-fixture-normalizer');

const REPO_ROOT = path.join(__dirname, '..', '..');
const SKILL_PATH = path.join(REPO_ROOT, 'skills', 'spec-brainstorm', 'SKILL.md');
const FIXTURE_PATH = path.join(REPO_ROOT, 'skills', 'spec-brainstorm', 'evals', 'routing-cases.json');

const REQUIRED_ROUTE_OUT_REASON_CODES = [
  'idea_generation',
  'brownfield_prd',
  'clear_plan_request',
  'execution_ready',
  'debug_request',
  'doc_review',
  'direct_cleanup',
  'missing_feature_description',
  'insufficient_evidence',
];

const REQUIRED_NEGATIVE_ROUTES = {
  idea_generation: 'spec-ideate',
  brownfield_prd: 'spec-prd',
  clear_plan_request: 'spec-plan',
  execution_ready: 'spec-work',
  debug_request: 'spec-debug',
  doc_review: 'spec-doc-review',
  direct_cleanup: 'direct',
};

function routeOutReasonCodes(skill) {
  const match = skill.match(/reason_code:\s*([^\n]+)/);
  if (!match) return [];
  return [...match[1].matchAll(/\b([a-z_]+)\b/g)].map((entry) => entry[1]);
}

describe('spec-brainstorm routing boundary contract', () => {
  test('frontmatter and entry contract narrow brainstorm to selected WHAT discovery', () => {
    const skill = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(skill).toContain('Discover WHAT for a selected feature/problem before PRD or planning');
    expect(skill).toContain('success criteria, or handoff context remain unresolved');
    expect(skill).toContain('clear HOW planning/task compilation');
    expect(skill).toContain('generated runtime mirror fixes');
    expect(skill).toContain('Do not use for open-ended idea generation');
    expect(skill).toContain('brownfield PRD authoring/refinement/validation');
    expect(skill).toContain('clear implementation planning');
    expect(skill).toContain('single-document cleanup/summarization');
    expect(skill).toContain('## Near-Neighbor Exit Cues');
    expect(skill).toContain('## Route-Out Shape');
    expect(skill).toContain('chat-consumable shape for the user or parent entry router');
    expect(skill).toContain('not a schema-validated artifact');
    expect(skill).toContain('`evals/routing-cases.json` records positive WHAT-discovery triggers');
    expect(skill).toContain('not a deterministic router or semantic proof');
    expect(skill).not.toContain('even if they don\'t explicitly ask to brainstorm');
    expect(skill).not.toContain('seems unsure about scope or direction');
  });

  test('route-out reason codes are complete and fixture negative cases stay in lockstep', () => {
    const skill = fs.readFileSync(SKILL_PATH, 'utf8');
    const skillReasonCodes = routeOutReasonCodes(skill);
    const normalized = normalizeFixtureFile({
      repoRoot: REPO_ROOT,
      filePath: path.relative(REPO_ROOT, FIXTURE_PATH),
    });
    const errors = validateNormalizedCases(normalized, { repoRoot: REPO_ROOT });
    const positiveCases = normalized.filter((entry) => entry.extensions.expected_route === 'spec-brainstorm');
    const negativeCases = normalized.filter((entry) => entry.extensions.reason_code);

    expect(errors).toEqual([]);
    expect(skillReasonCodes).toEqual(REQUIRED_ROUTE_OUT_REASON_CODES);
    expect(positiveCases.length).toBeGreaterThanOrEqual(3);
    expect(negativeCases.length).toBeGreaterThanOrEqual(7);
    expect(positiveCases.every((entry) => entry.extensions.reason_code === undefined)).toBe(true);

    for (const [reasonCode, expectedRoute] of Object.entries(REQUIRED_NEGATIVE_ROUTES)) {
      expect(negativeCases).toContainEqual(expect.objectContaining({
        extensions: expect.objectContaining({
          reason_code: reasonCode,
          expected_route: expectedRoute,
        }),
      }));
      expect(skillReasonCodes).toContain(reasonCode);
    }
  });
});
