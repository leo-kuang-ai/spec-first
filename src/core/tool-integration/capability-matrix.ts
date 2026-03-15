import { detectHostPaths } from '../../shared/host-paths.js';
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

export function getCapabilityMatrix(): HostCapability[] {
  const paths = detectHostPaths();
  const matrix: HostCapability[] = [
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
  ];

  return matrix.map((entry) =>
    entry.host === 'claude'
      ? { ...entry, supportsSkills: Boolean(paths.claudeCommandsDir) }
      : entry.host === 'codex'
        ? { ...entry, supportsSkills: Boolean(paths.codexSkillsDir) }
        : entry.host === 'gemini'
          ? {
              ...entry,
              supportsSkills: Boolean(paths.geminiHomeDir),
              supportsMcp: Boolean(paths.geminiConfigDir),
            }
          : entry.host === 'cursor'
            ? {
                ...entry,
                supportsSkills: Boolean(paths.cursorHomeDir),
                supportsMcp: Boolean(paths.cursorConfigDir),
              }
        : entry
  );
}

export function getHostCapability(host: HostId): HostCapability | undefined {
  return getCapabilityMatrix().find((entry) => entry.host === host);
}
