import { detectHostPaths, type HostPaths } from '../../shared/host-paths.js';
import type { HostId } from './tool-types.js';

export interface HostCapability {
  host: HostId;
  supportsSkills: boolean;
  supportsMcp: boolean;
  supportsHooks: boolean;
  supportsSessionStart: boolean;
  supportsViewer: boolean;
  supportsBrowser: boolean;
  supportsProjectScopedConfig: boolean;
}

const BASE_CAPABILITY_MATRIX: readonly HostCapability[] = [
  {
    host: 'claude',
    supportsSkills: true,
    supportsMcp: true,
    supportsHooks: true,
    supportsSessionStart: true,
    supportsViewer: true,
    supportsBrowser: true,
    supportsProjectScopedConfig: true,
  },
  {
    host: 'codex',
    supportsSkills: true,
    supportsMcp: true,
    supportsHooks: false,
    supportsSessionStart: false,
    supportsViewer: false,
    supportsBrowser: true,
    supportsProjectScopedConfig: false,
  },
  {
    host: 'generic',
    supportsSkills: true,
    supportsMcp: false,
    supportsHooks: false,
    supportsSessionStart: false,
    supportsViewer: false,
    supportsBrowser: false,
    supportsProjectScopedConfig: false,
  },
  {
    host: 'gemini',
    supportsSkills: true,
    supportsMcp: true,
    supportsHooks: false,
    supportsSessionStart: false,
    supportsViewer: false,
    supportsBrowser: true,
    supportsProjectScopedConfig: false,
  },
  {
    host: 'cursor',
    supportsSkills: true,
    supportsMcp: true,
    supportsHooks: false,
    supportsSessionStart: false,
    supportsViewer: false,
    supportsBrowser: true,
    supportsProjectScopedConfig: false,
  },
] as const;

function applyPathOverrides(entry: HostCapability, paths: HostPaths): HostCapability {
  switch (entry.host) {
    case 'claude':
      return { ...entry, supportsSkills: Boolean(paths.claudeCommandsDir) };
    case 'codex':
      return { ...entry, supportsSkills: Boolean(paths.codexSkillsDir) };
    case 'gemini':
      return {
        ...entry,
        supportsSkills: Boolean(paths.geminiHomeDir),
        supportsMcp: Boolean(paths.geminiConfigDir),
      };
    case 'cursor':
      return {
        ...entry,
        supportsSkills: Boolean(paths.cursorHomeDir),
        supportsMcp: Boolean(paths.cursorConfigDir),
      };
    default:
      return entry;
  }
}

export function getCapabilityMatrix(paths: HostPaths = detectHostPaths()): HostCapability[] {
  return BASE_CAPABILITY_MATRIX.map((entry) => applyPathOverrides(entry, paths));
}

export function getHostCapability(
  host: HostId,
  paths: HostPaths = detectHostPaths()
): HostCapability | undefined {
  const entry = BASE_CAPABILITY_MATRIX.find((candidate) => candidate.host === host);
  return entry ? applyPathOverrides(entry, paths) : undefined;
}
