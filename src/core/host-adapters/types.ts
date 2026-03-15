import type { HostCapability } from '../tool-integration/capability-matrix.js';
import type { HostId } from '../tool-integration/tool-types.js';

export type HostAdapterMaturity = 'stable' | 'experimental';
export type HostBaselineState = 'ready' | 'partial' | 'unknown';
export type HostBaselinePart = 'skills' | 'mcp';

export interface HostAdapter {
  id: HostId;
  detect(): boolean;
  capabilities(): HostCapability | undefined;
  summary(): string;
  maturity(): HostAdapterMaturity;
  remediation(detected: boolean): string;
  baselineState(): HostBaselineState;
  missingBaseline(): HostBaselinePart[];
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
