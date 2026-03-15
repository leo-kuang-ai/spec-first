import type { HostPaths } from '../../shared/host-paths.js';
import type { HostCapability } from '../tool-integration/capability-matrix.js';
import type { HostId } from '../tool-integration/tool-types.js';

export type HostAdapterMaturity = 'stable' | 'experimental';
export type HostBaselineState = 'ready' | 'partial' | 'unknown';
export type HostBaselinePart = 'skills' | 'mcp';

export interface HostAdapter {
  id: HostId;
  detect(paths?: HostPaths): boolean;
  capabilities(paths?: HostPaths): HostCapability | undefined;
  summary(paths?: HostPaths): string;
  maturity(): HostAdapterMaturity;
  remediation(detected: boolean, paths?: HostPaths): string;
  baselineState(paths?: HostPaths): HostBaselineState;
  missingBaseline(paths?: HostPaths): HostBaselinePart[];
}

export interface HostAdapterStatus {
  id: HostId;
  detected: boolean;
  capabilities?: HostCapability;
  summary: string;
  maturity: HostAdapterMaturity;
  remediation: string;
  baselineState: HostBaselineState;
  missingBaseline: HostBaselinePart[];
}
