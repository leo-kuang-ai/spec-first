import { ClaudeAdapter } from './claude-adapter.js';
import { CodexAdapter } from './codex-adapter.js';
import { CursorAdapter } from './cursor-adapter.js';
import { GeminiAdapter } from './gemini-adapter.js';
import type { HostAdapter, HostAdapterStatus } from './types.js';

const DEFAULT_ADAPTERS: HostAdapter[] = [
  new ClaudeAdapter(),
  new CodexAdapter(),
  new GeminiAdapter(),
  new CursorAdapter(),
];

export function listHostAdapters(): HostAdapter[] {
  return DEFAULT_ADAPTERS;
}

export function getHostAdapter(id: HostAdapter['id']): HostAdapter | undefined {
  return DEFAULT_ADAPTERS.find((adapter) => adapter.id === id);
}

export function resolveHostAdapterStatuses(
  ids?: readonly HostAdapter['id'][]
): HostAdapterStatus[] {
  return DEFAULT_ADAPTERS
    .filter((adapter) => !ids || ids.includes(adapter.id))
    .map((adapter) => {
      const detected = adapter.detect();
      return {
        id: adapter.id,
        detected,
        capabilities: adapter.capabilities(),
        summary: adapter.summary(),
        maturity: adapter.maturity(),
        remediation: adapter.remediation(detected),
        baselineState: adapter.baselineState(),
        missingBaseline: adapter.missingBaseline(),
      };
    });
}
