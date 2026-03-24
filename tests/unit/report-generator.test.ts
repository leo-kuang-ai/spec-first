import { describe, expect, it } from 'vitest';
import { renderIntegrationReport } from '../../src/core/skill-integration/generators/report-generator.js';

describe('renderIntegrationReport', () => {
  it('renders the required report sections', () => {
    const report = renderIntegrationReport({
      requestedName: 'frontend-design',
      finalName: 'frontend-design',
      mode: 'report-only',
      profile: {
        name: 'frontend-design',
        description: 'Frontend UI and UX design guidance',
        sourcePath: '/tmp/frontend-design',
        commands: ['/spec-first:frontend-design'],
        frontmatter: { name: 'frontend-design' },
        concepts: [],
        practices: [],
        caveats: [],
        examples: [],
        tools: [],
        keywords: ['frontend', 'design'],
        suggestedCategory: 'frontend',
        primaryStage: 'design',
        relatedStages: ['code'],
        parserWarnings: [],
      },
      targetConfig: {
        category: 'frontend',
        primaryStage: 'design',
        relatedStages: ['code'],
        guidelineDir: 'docs/guides/frontend',
        examplesDir: 'docs/examples/skills',
        draftSkillDir: 'skills-draft',
        allowDraftSkill: true,
      },
      conflicts: [],
      fileWrites: [
        {
          path: 'docs/reports/skill-integrations/2026-03-25-frontend-design.md',
          kind: 'report',
          overwrite: false,
          content: '# report',
        },
      ],
      reviewFocus: ['review report quality'],
    });

    expect(report).toContain('Source');
    expect(report).toContain('Skill summary');
    expect(report).toContain('Category/stage');
    expect(report).toContain('Conflicts');
    expect(report).toContain('Review checklist');
    expect(report).toContain('Recommendation');
  });
});

