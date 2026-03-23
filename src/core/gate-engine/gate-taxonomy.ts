/**
 * Gate taxonomy shared constants.
 * Keep the canonical naming in one place so tests and future refactors do not drift.
 */

export const GATE_LAYER_NAMES = [
  'precondition',
  'stage-gate',
  'hard-gate',
  'release-gate',
] as const;

export type GateLayerName = (typeof GATE_LAYER_NAMES)[number];

export const CONFIRM_POLICY_NAME = 'confirm-policy' as const;

export const GATE_OUTPUT_NAMES = [...GATE_LAYER_NAMES, CONFIRM_POLICY_NAME] as const;

export type GateOutputName = (typeof GATE_OUTPUT_NAMES)[number];

export const GATE_STATUS_VALUES = ['PASS', 'PASS_WITH_WAIVER', 'FAIL'] as const;

export type GateStatusValue = (typeof GATE_STATUS_VALUES)[number];

export function isGateLayerName(value: string): value is GateLayerName {
  return (GATE_LAYER_NAMES as readonly string[]).includes(value);
}
