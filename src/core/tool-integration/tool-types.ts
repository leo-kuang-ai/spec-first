export type ToolCategory = 'code' | 'research' | 'browser' | 'memory' | 'runtime';

export type HostId = 'claude' | 'codex' | 'generic' | 'gemini' | 'cursor';

export interface ToolDescriptor {
  id: string;
  category: ToolCategory;
  hosts: HostId[];
  requiredMcps?: string[];
  scenarios: string[];
  fallback?: string[];
}
