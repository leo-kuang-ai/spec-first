import { describe, expect, it } from 'vitest';
import { getToolDescriptor, listTools } from '../../src/core/tool-integration/tool-registry.js';
import { selectToolsForScenario } from '../../src/core/tool-integration/tool-selection.js';

describe('tool registry', () => {
  it('should expose context7 and fetch for external research workflow', () => {
    const tools = listTools().map((tool) => tool.id);
    expect(tools).toContain('fetch');
    expect(tools).toContain('context7');
  });

  it('should resolve official docs strategy as fetch + context7', () => {
    const result = selectToolsForScenario('claude', 'external-research');
    expect(result.primary).toEqual(['fetch', 'context7']);
  });

  it('should select tools per host and scenario compatibility', () => {
    expect(selectToolsForScenario('generic', 'code-analysis')).toEqual({
      primary: [],
      fallback: ['shell-rg'],
    });

    expect(selectToolsForScenario('codex', 'code-analysis')).toEqual({
      primary: ['serena'],
      fallback: ['shell-rg'],
    });

    expect(selectToolsForScenario('generic', 'external-research')).toEqual({
      primary: [],
      fallback: ['browser', 'manual-official-docs'],
    });
  });

  it('should return descriptor metadata for serena', () => {
    const descriptor = getToolDescriptor('serena');
    expect(descriptor?.category).toBe('code');
    expect(descriptor?.requiredMcps).toContain('serena');
  });
});
