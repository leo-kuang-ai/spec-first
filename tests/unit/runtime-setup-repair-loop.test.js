'use strict';

const { runBoundedRepairLoop, MAX_REPAIR_ATTEMPTS } = require('../../skills/spec-runtime-setup/scripts/lib/repair-loop.cjs');

describe('runtime setup bounded repair loop', () => {
  test('reprobes after an allowed repair and records evidence', () => {
    const result = runBoundedRepairLoop({
      initial: { ready: false, reason_code: 'stale-index' },
      repairFor: (reason) => reason === 'stale-index' ? 'refresh' : null,
      apply: () => ({ ok: true, exit_code: 0 }),
      verify: () => ({ ready: true }),
    });
    expect(result.status).toBe('ready');
    expect(result.attempts[0]).toMatchObject({ attempt: 1, action: 'refresh', post_probe: 'verified' });
  });

  test('stops on repeated reason code and never loops indefinitely', () => {
    const result = runBoundedRepairLoop({
      initial: { ready: false, reason_code: 'broken' },
      repairFor: () => 'retry',
      apply: () => ({ ok: true, exit_code: 1 }),
      verify: () => ({ ready: false, reason_code: 'broken' }),
    });
    expect(result.status).toBe('action-required');
    expect(result.attempts).toHaveLength(1);
    expect(MAX_REPAIR_ATTEMPTS).toBe(2);
  });
});
