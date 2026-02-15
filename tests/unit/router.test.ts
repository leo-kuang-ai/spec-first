import { describe, it, expect, beforeEach } from 'vitest';
import { registerCommand, dispatch, getRegisteredCommands } from '../../src/cli/router.js';

describe('CLI Router', () => {
  it('should return SUCCESS for --help', async () => {
    const code = await dispatch(['--help']);
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

  it('should return UNKNOWN_ERROR when handler throws', async () => {
    registerCommand('fail-cmd', 'Will fail', () => {
      throw new Error('boom');
    });
    const code = await dispatch(['fail-cmd']);
    expect(code).toBe(5);
  });
});
