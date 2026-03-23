import { describe, it, expect, vi } from 'vitest';
import { registerCommand, dispatch } from '../../src/cli/router.js';

describe('CLI Router', () => {
  it('should return SUCCESS for --help', async () => {
    const code = await dispatch(['--help']);
    expect(code).toBe(0);
  });

  it('should return SUCCESS for --version', async () => {
    const code = await dispatch(['--version']);
    expect(code).toBe(0);
  });

  it('should return SUCCESS for empty args', async () => {
    const code = await dispatch([]);
    expect(code).toBe(0);
  });

  it('should return VALIDATION_ERROR for unknown command', async () => {
    const code = await dispatch(['nonexistent']);
    expect(code).toBe(2);
  });

  it('should dispatch to registered handler', async () => {
    registerCommand('test-cmd', 'A test command', (args) => {
      expect(args).toEqual(['sub', '--flag']);
      return 0;
    });
    const code = await dispatch(['test-cmd', 'sub', '--flag']);
    expect(code).toBe(0);
  });

  it('should block mutating commands without confirmation under strict policy', async () => {
    const handler = vi.fn(() => 0);
    registerCommand('write-cmd', 'A mutating command', handler, { requiresConfirmation: true });

    const code = await dispatch(['write-cmd']);

    expect(code).toBe(2);
    expect(handler).not.toHaveBeenCalled();
  });

  it('should show validation error before confirmation requirement', async () => {
    const handler = vi.fn(() => 0);
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    registerCommand('write-cmd-invalid', 'A mutating command', handler, {
      requiresConfirmation: true,
      validateArgs: () => 'usage: write-cmd-invalid <id>',
    });

    try {
      const code = await dispatch(['write-cmd-invalid']);
      expect(code).toBe(2);
      expect(handler).not.toHaveBeenCalled();
      expect(errSpy).toHaveBeenCalledWith('usage: write-cmd-invalid <id>');
    } finally {
      errSpy.mockRestore();
    }
  });

  it('should allow mutating commands with --yes under strict policy', async () => {
    const handler = vi.fn(() => 0);
    registerCommand('write-cmd-confirmed', 'A mutating command', handler, { requiresConfirmation: true });

    const code = await dispatch(['write-cmd-confirmed', '--yes']);

    expect(code).toBe(0);
    expect(handler).toHaveBeenCalledWith([]);
  });

  it('should allow mutating commands without confirmation when policy is auto', async () => {
    const handler = vi.fn(() => 0);
    registerCommand('write-cmd-auto', 'A mutating command', handler, { requiresConfirmation: true });

    const code = await dispatch(['write-cmd-auto', '--mode', 'I', '--size', 'S']);

    expect(code).toBe(0);
    expect(handler).toHaveBeenCalledWith(['--mode', 'I', '--size', 'S']);
  });

  it('should report confirm-policy with the canonical label', async () => {
    const handler = vi.fn(() => 0);
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    registerCommand('write-cmd-confirm-policy', 'A mutating command', handler, {
      requiresConfirmation: true,
    });

    try {
      const code = await dispatch(['write-cmd-confirm-policy']);
      expect(code).toBe(2);
      expect(errSpy).toHaveBeenCalledWith(
        expect.stringContaining('confirm-policy=')
      );
    } finally {
      errSpy.mockRestore();
    }
  });

  it('should return UNKNOWN_ERROR when handler throws', async () => {
    registerCommand('fail-cmd', 'Will fail', () => {
      throw new Error('boom');
    });
    const code = await dispatch(['fail-cmd']);
    expect(code).toBe(5);
  });

});
