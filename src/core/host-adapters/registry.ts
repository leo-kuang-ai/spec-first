import { detectHostPaths } from '../../shared/host-paths.js';
import { ClaudeAdapter } from './claude-adapter.js';
import { CodexAdapter } from './codex-adapter.js';
import { CursorAdapter } from './cursor-adapter.js';
import { GeminiAdapter } from './gemini-adapter.js';
import type { HostAdapter, HostAdapterStatus } from './types.js';

const DEFAULT_ADAPTERS: readonly HostAdapter[] = [
  new ClaudeAdapter(),
  new CodexAdapter(),
  new GeminiAdapter(),
  new CursorAdapter(),
];

export function listHostAdapters(): HostAdapter[] {
  return [...DEFAULT_ADAPTERS];
}

export function getHostAdapter(id: HostAdapter['id']): HostAdapter | undefined {
  return DEFAULT_ADAPTERS.find((adapter) => adapter.id === id);
}

export function resolveHostAdapterStatuses(
  ids?: readonly HostAdapter['id'][]
): HostAdapterStatus[] {
  const paths = detectHostPaths();
  return DEFAULT_ADAPTERS.filter((adapter) => !ids || ids.includes(adapter.id)).map((adapter) => {
    const detected = adapter.detect(paths);
    return {
      id: adapter.id,
      detected,
      capabilities: adapter.capabilities(paths),
      summary: adapter.summary(paths),
      maturity: adapter.maturity(),
      remediation: adapter.remediation(detected, paths),
      baselineState: adapter.baselineState(paths),
      missingBaseline: adapter.missingBaseline(paths),
    };
  });
}
