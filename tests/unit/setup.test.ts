import { describe, expect, it, vi } from 'vitest';
import { handleSetup } from '../../src/cli/commands/setup.js';
import { ExitCode } from '../../src/shared/types.js';

describe('handleSetup', () => {
  it('should print deprecation warning and delegate to update --help', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const code = await handleSetup(['--help']);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('废弃'));
    expect(code).toBe(ExitCode.SUCCESS);
    warnSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('should strip --global but preserve other flags when forwarding', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    // --global is filtered out, --help is preserved → enters update help
    const code = await handleSetup(['--global', '--help']);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('废弃'));
    expect(code).toBe(ExitCode.SUCCESS);
    warnSpy.mockRestore();
    logSpy.mockRestore();
  });
});
