import type { ToolDescriptor } from './tool-types.js';

export const TOOL_REGISTRY: readonly ToolDescriptor[] = [
  {
    id: 'serena',
    category: 'code',
    hosts: ['claude', 'codex', 'gemini', 'cursor'],
    requiredMcps: ['serena'],
    scenarios: ['code-analysis', 'symbol-navigation', 'reference-search'],
    fallback: ['shell-rg'],
  },
  {
    id: 'fetch',
    category: 'research',
    hosts: ['claude', 'codex', 'gemini', 'cursor'],
    requiredMcps: ['fetch'],
    scenarios: ['external-research', 'web-content-capture'],
    fallback: ['browser', 'manual-input'],
  },
  {
    id: 'context7',
    category: 'research',
    hosts: ['claude', 'codex', 'gemini', 'cursor'],
    requiredMcps: ['context7'],
    scenarios: ['official-docs', 'sdk-docs', 'spec-query'],
    fallback: ['browser', 'manual-official-docs'],
  },
  {
    id: 'playwright-mcp',
    category: 'browser',
    hosts: ['claude', 'codex', 'gemini', 'cursor'],
    requiredMcps: ['playwright-mcp'],
    scenarios: ['browser-verification', 'ui-review', 'form-check'],
    fallback: ['manual-template'],
  },
  {
    id: 'shell',
    category: 'runtime',
    hosts: ['claude', 'codex', 'generic', 'gemini', 'cursor'],
    scenarios: ['fallback', 'local-inspection'],
  },
  {
    id: 'viewer',
    category: 'runtime',
    hosts: ['claude', 'codex', 'generic'],
    scenarios: ['stage-visualization', 'status-inspection'],
  },
] as const;

export function listTools(): readonly ToolDescriptor[] {
  return TOOL_REGISTRY;
}

export function getToolDescriptor(toolId: string): ToolDescriptor | undefined {
  return TOOL_REGISTRY.find((tool) => tool.id === toolId);
}
