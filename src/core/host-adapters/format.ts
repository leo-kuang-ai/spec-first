import type { HostAdapterStatus } from './types.js';

function formatMissingBaseline(status: HostAdapterStatus): string {
  return status.missingBaseline.length > 0 ? ` missing=${status.missingBaseline.join('+')}` : '';
}

function formatCapabilityLabels(status: HostAdapterStatus): string {
  const capability = status.capabilities;
  return [
    capability?.supportsSkills ? 'skills' : undefined,
    capability?.supportsMcp ? 'mcp' : undefined,
    capability?.supportsHooks ? 'hooks' : undefined,
    capability?.supportsSessionStart ? 'session' : undefined,
    capability?.supportsViewer ? 'viewer' : undefined,
    capability?.supportsBrowser ? 'browser' : undefined,
  ]
    .filter(Boolean)
    .join(', ');
}

export function formatHostUpdateSummary(status: HostAdapterStatus): string {
  const missingBaseline = formatMissingBaseline(status);
  return `${status.id}: ${status.detected ? 'detected' : 'planned'} baseline=${status.baselineState}${missingBaseline} | ${status.summary}`;
}

export function formatHostUpdateRemediation(status: HostAdapterStatus): string | undefined {
  if (status.detected && status.baselineState === 'ready') return undefined;
  return status.remediation;
}

export function formatHostDoctorMessage(status: HostAdapterStatus): string {
  const enabled = formatCapabilityLabels(status);
  const isExperimental = status.maturity === 'experimental';
  const missingBaseline = formatMissingBaseline(status);

  if (status.detected) {
    return `${enabled || 'limited'} | ${status.summary}${missingBaseline}${isExperimental ? ' | experimental' : ''}`;
  }

  return enabled ? `${enabled} | ${status.summary}` : `planned | ${status.summary}`;
}
