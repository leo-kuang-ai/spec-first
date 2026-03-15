import { getHostCapability } from './capability-matrix.js';
import { getToolDescriptor } from './tool-registry.js';
import type { HostId } from './tool-types.js';

export type ToolScenario =
  | 'code-analysis'
  | 'external-research'
  | 'browser-verification'
  | 'host-diagnostics';

export interface ToolSelectionResult {
  primary: string[];
  fallback: string[];
}

export function selectToolsForScenario(host: HostId, scenario: ToolScenario): ToolSelectionResult {
  const capability = getHostCapability(host);
  if (!capability) return { primary: [], fallback: ['shell'] };

  switch (scenario) {
    case 'code-analysis':
      return { primary: ['serena'], fallback: ['shell-rg'] };
    case 'external-research':
      return {
        primary: ['fetch', 'context7'].filter((tool) => isToolSupported(host, tool)),
        fallback: ['browser', 'manual-official-docs'],
      };
    case 'browser-verification':
      return {
        primary: capability.supportsBrowser ? ['playwright-mcp'] : [],
        fallback: ['manual-template'],
      };
    case 'host-diagnostics':
      return { primary: ['shell'], fallback: [] };
  }
}

function isToolSupported(host: HostId, toolId: string): boolean {
  const descriptor = getToolDescriptor(toolId);
  return Boolean(descriptor?.hosts.includes(host));
}
