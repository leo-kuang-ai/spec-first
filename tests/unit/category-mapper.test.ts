import { describe, expect, it } from 'vitest';
import { mapSkillCategory } from '../../src/core/skill-integration/category-mapper.js';

describe('mapSkillCategory', () => {
  it('maps frontend design signals to frontend/design/code', () => {
    const result = mapSkillCategory({
      name: 'frontend-design',
      commands: ['/spec-first:frontend-design'],
      keywords: ['frontend', 'ui', 'layout', 'component'],
      descriptions: ['Frontend UI and UX design guidance'],
    });

    expect(result.category).toBe('frontend');
    expect(result.primaryStage).toBe('design');
    expect(result.relatedStages).toEqual(['code']);
    expect(result.warnings).toEqual([]);
  });

  it('maps MCP builder signals to backend/design/code', () => {
    const result = mapSkillCategory({
      name: 'mcp-builder',
      commands: ['/spec-first:mcp-builder'],
      keywords: ['mcp', 'server', 'endpoint', 'tool'],
      descriptions: ['Model Context Protocol server and tool design'],
    });

    expect(result.category).toBe('backend');
    expect(result.primaryStage).toBe('design');
    expect(result.relatedStages).toEqual(['code']);
  });

  it('maps webapp testing signals to testing/verify', () => {
    const result = mapSkillCategory({
      name: 'webapp-testing',
      commands: ['/spec-first:webapp-testing'],
      keywords: ['testing', 'playwright', 'e2e', 'assert'],
      descriptions: ['Web application test automation'],
    });

    expect(result.category).toBe('testing');
    expect(result.primaryStage).toBe('verify');
    expect(result.relatedStages).toEqual(['review', 'code']);
  });

  it('emits warnings when category signals are ambiguous', () => {
    const result = mapSkillCategory({
      name: 'ambiguous-skill',
      commands: ['/spec-first:ambiguous-skill'],
      keywords: ['frontend', 'testing', 'workflow', 'review'],
      descriptions: ['Mixed signals skill'],
    });

    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

