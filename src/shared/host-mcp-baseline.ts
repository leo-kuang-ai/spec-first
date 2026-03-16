import { existsSync, readFileSync } from 'node:fs';
import { REQUIRED_MCP_SERVERS } from '../config/bootstrap-manifest.js';

function collectMcpServers(
  root: Record<string, unknown>,
  keys: readonly string[]
): Record<string, unknown> {
  const collected: Record<string, unknown> = {};

  for (const key of keys) {
    const value = root[key];
    if (typeof value !== 'object' || !value || Array.isArray(value)) continue;
    Object.assign(collected, value as Record<string, unknown>);
  }

  return collected;
}

export function hasRequiredJsonMcpBaseline(filePath: string, keys: readonly string[]): boolean {
  if (!existsSync(filePath)) return false;

  try {
    const raw = readFileSync(filePath, 'utf-8').trim();
    if (!raw) return false;
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || !parsed || Array.isArray(parsed)) return false;

    const mcpServers = collectMcpServers(parsed as Record<string, unknown>, keys);
    return REQUIRED_MCP_SERVERS.every((entry) => entry.name in mcpServers);
  } catch {
    return false;
  }
}

export function hasRequiredClaudeMcpBaseline(filePaths: readonly string[]): boolean {
  return filePaths.some((filePath) => hasRequiredJsonMcpBaseline(filePath, ['mcpServers']));
}

export function hasRequiredCodexMcpBaseline(filePath: string): boolean {
  if (!existsSync(filePath)) return false;

  try {
    const raw = readFileSync(filePath, 'utf-8');
    return REQUIRED_MCP_SERVERS.every((entry) => raw.includes(`[mcp_servers.${entry.name}]`));
  } catch {
    return false;
  }
}
