export type InstallComponent = 'skills' | 'mcp' | 'hooks' | 'viewer';

export interface InstallPlan {
  baseline: InstallComponent[];
  optional: InstallComponent[];
}

const BASELINE_COMPONENTS: InstallComponent[] = ['skills', 'mcp'];
const OPTIONAL_COMPONENTS: InstallComponent[] = ['hooks', 'viewer'];

export function buildInstallPlan(requested?: InstallComponent[]): InstallPlan {
  const uniqueRequested = [...new Set(requested ?? [])];
  const optionalSelection = uniqueRequested.length > 0 ? uniqueRequested : OPTIONAL_COMPONENTS;

  return {
    baseline: BASELINE_COMPONENTS,
    optional: OPTIONAL_COMPONENTS.filter((component) => optionalSelection.includes(component)),
  };
}
