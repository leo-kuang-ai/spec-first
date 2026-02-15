import { describe, it, expect } from 'vitest';
import { Stage } from '../../src/shared/types.js';
import {
  assertTransitionAllowed,
  isTerminal,
  getNextStages,
  TransitionError,
} from '../../src/core/process-engine/stage-machine.js';

/** 合法的顺序转换链 */
const FORWARD_CHAIN: [Stage, Stage][] = [
  [Stage.INIT, Stage.SPECIFY],
  [Stage.SPECIFY, Stage.DESIGN],
  [Stage.DESIGN, Stage.PLAN],
  [Stage.PLAN, Stage.IMPLEMENT],
  [Stage.IMPLEMENT, Stage.VERIFY],
  [Stage.VERIFY, Stage.WRAP_UP],
  [Stage.WRAP_UP, Stage.RELEASE],
  [Stage.RELEASE, Stage.DONE],
];

/** 所有非终态阶段 */
const NON_TERMINAL: Stage[] = [
  Stage.INIT, Stage.SPECIFY, Stage.DESIGN, Stage.PLAN,
  Stage.IMPLEMENT, Stage.VERIFY, Stage.WRAP_UP, Stage.RELEASE,
];

describe('stage-machine', () => {
  describe('assertTransitionAllowed — forward chain', () => {
    it.each(FORWARD_CHAIN)('%s → %s should be allowed', (from, to) => {
      expect(() => assertTransitionAllowed(from, to)).not.toThrow();
    });
  });

  describe('assertTransitionAllowed — cancel from any non-terminal', () => {
    it.each(NON_TERMINAL)('%s → 09_cancelled should be allowed', (from) => {
      expect(() => assertTransitionAllowed(from, Stage.CANCELLED)).not.toThrow();
    });
  });

  describe('assertTransitionAllowed — illegal transitions', () => {
    it('should reject skipping stages (INIT → DESIGN)', () => {
      expect(() => assertTransitionAllowed(Stage.INIT, Stage.DESIGN))
        .toThrow(TransitionError);
    });

    it('should reject backward transition (DESIGN → SPECIFY)', () => {
      expect(() => assertTransitionAllowed(Stage.DESIGN, Stage.SPECIFY))
        .toThrow(TransitionError);
    });

    it('should reject transition from DONE', () => {
      expect(() => assertTransitionAllowed(Stage.DONE, Stage.INIT))
        .toThrow(/terminal/);
    });

    it('should reject transition from CANCELLED', () => {
      expect(() => assertTransitionAllowed(Stage.CANCELLED, Stage.INIT))
        .toThrow(/terminal/);
    });

    it('should reject DONE → CANCELLED', () => {
      expect(() => assertTransitionAllowed(Stage.DONE, Stage.CANCELLED))
        .toThrow(/terminal/);
    });
  });

  describe('isTerminal', () => {
    it('DONE is terminal', () => {
      expect(isTerminal(Stage.DONE)).toBe(true);
    });
    it('CANCELLED is terminal', () => {
      expect(isTerminal(Stage.CANCELLED)).toBe(true);
    });
    it('INIT is not terminal', () => {
      expect(isTerminal(Stage.INIT)).toBe(false);
    });
  });

  describe('getNextStages', () => {
    it('INIT can go to SPECIFY or CANCELLED', () => {
      const next = getNextStages(Stage.INIT);
      expect(next).toContain(Stage.SPECIFY);
      expect(next).toContain(Stage.CANCELLED);
      expect(next).toHaveLength(2);
    });
    it('DONE has no next stages', () => {
      expect(getNextStages(Stage.DONE)).toEqual([]);
    });
  });
});
