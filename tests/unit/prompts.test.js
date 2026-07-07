'use strict';

const { PassThrough } = require('node:stream');

const {
  PromptCancelled,
  checkbox,
  confirm,
  requireTty,
  select,
  textInput,
} = require('../../src/cli/prompts');

function createPromptStreams() {
  const input = new PassThrough();
  const output = new PassThrough();
  const chunks = [];
  input.isTTY = true;
  output.isTTY = true;
  input.setRawMode = jest.fn();
  output.on('data', (chunk) => {
    chunks.push(Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk));
  });
  return {
    input,
    output,
    readOutput: () => chunks.join(''),
  };
}

describe('prompt primitives', () => {
  test('requireTty rejects non-TTY stdin', () => {
    const input = new PassThrough();
    const output = new PassThrough();
    output.isTTY = true;

    expect(requireTty({ input, output })).toEqual({
      ok: false,
      reason: 'no-stdin-tty',
    });
  });

  test('select supports arrow navigation and enter', async () => {
    const { input, output, readOutput } = createPromptStreams();
    const result = select('Platform?', ['A', 'B', 'C'], { input, output });

    input.write('\x1b[B');
    input.write('\x1b[B');
    input.write('\r');

    await expect(result).resolves.toBe('C');
    expect(input.setRawMode).toHaveBeenCalledWith(true);
    expect(input.setRawMode).toHaveBeenCalledWith(false);
    expect(readOutput()).not.toContain('\x1b[2J\x1b[H');
    expect(readOutput()).toContain('\x1b[4A\r\x1b[J');
  });

  test('select supports Windows and alternate arrow key sequences', async () => {
    const first = createPromptStreams();
    const explicitResult = select('Workspace?', ['Parent', 'All repos'], {
      input: first.input,
      output: first.output,
      requireExplicit: true,
    });

    first.input.write('\x1b[0B');
    first.input.write('\r');

    await expect(explicitResult).resolves.toBe('Parent');

    const second = createPromptStreams();
    const alternateResult = select('Workspace?', ['Parent', 'All repos'], {
      input: second.input,
      output: second.output,
      requireExplicit: true,
    });

    second.input.write('\x1bOB');
    second.input.write('\x1bOA');
    second.input.write('\r');

    await expect(alternateResult).resolves.toBe('All repos');

    const third = createPromptStreams();
    const legacyResult = select('Workspace?', ['Parent', 'All repos'], {
      input: third.input,
      output: third.output,
      requireExplicit: true,
    });

    third.input.write('\x00P');
    third.input.write('\r');

    await expect(legacyResult).resolves.toBe('Parent');
  });

  test('select clamps an invalid default index', async () => {
    const { input, output } = createPromptStreams();
    const result = select('Platform?', ['A', 'B'], { input, output, defaultIndex: 99 });

    input.write('\r');

    await expect(result).resolves.toBe('A');
  });

  test('select renders optional hint and clears the extra line', async () => {
    const { input, output, readOutput } = createPromptStreams();
    const result = select('Platform?', ['A', 'B'], { input, output, hint: '↑↓ move · Enter confirm' });

    input.write('\x1b[B');
    input.write('\r');

    await expect(result).resolves.toBe('B');
    expect(readOutput()).toContain('↑↓ move · Enter confirm');
    expect(readOutput()).toContain('\x1b[4A\r\x1b[J');
  });

  test('checkbox supports toggling multiple values without full-screen redraw', async () => {
    const { input, output, readOutput } = createPromptStreams();
    const result = checkbox('Platforms?', [
      { label: 'A', value: 'a', checked: true },
      { label: 'B', value: 'b', checked: false },
      { label: 'C', value: 'c', checked: false },
    ], { input, output, minSelected: 1 });

    input.write('\x1b[B');
    input.write(' ');
    input.write('\r');

    await expect(result).resolves.toEqual(['a', 'b']);
    expect(readOutput()).toContain('[x] A');
    expect(readOutput()).toContain('[x] B');
    expect(readOutput()).not.toContain('\x1b[2J\x1b[H');
    expect(readOutput()).toContain('\x1b[4A\r\x1b[J');
  });

  test('checkbox shows minSelected error and resolves after the user fixes it', async () => {
    const { input, output, readOutput } = createPromptStreams();
    const result = checkbox('Platforms?', [
      { label: 'A', value: 'a', checked: false },
      { label: 'B', value: 'b', checked: false },
    ], {
      input,
      output,
      minSelected: 1,
      onMinError: (count) => `Pick ${count} option.`,
    });

    input.write('\r');
    await new Promise((resolve) => setImmediate(resolve));
    expect(readOutput()).toContain('! Pick 1 option.');

    input.write(' ');
    input.write('\r');

    await expect(result).resolves.toEqual(['a']);
  });

  test('checkbox clears minSelected error after navigation', async () => {
    const { input, output, readOutput } = createPromptStreams();
    const result = checkbox('Platforms?', ['A', 'B'], {
      input,
      output,
      minSelected: 1,
      onMinError: () => 'Pick one.',
    });

    input.write('\r');
    await new Promise((resolve) => setImmediate(resolve));
    input.write('\x1b[B');
    await new Promise((resolve) => setImmediate(resolve));

    const afterErrorClear = readOutput().split('\x1b[4A\r\x1b[J').pop();
    expect(afterErrorClear).not.toContain('Pick one.');

    input.write(' ');
    input.write('\r');
    await expect(result).resolves.toEqual(['B']);
  });

  test('checkbox allows zero selections when minSelected is zero', async () => {
    const { input, output } = createPromptStreams();
    const result = checkbox('Platforms?', ['A', 'B'], { input, output, minSelected: 0 });

    input.write('\r');

    await expect(result).resolves.toEqual([]);
  });

  test('checkbox renders hint and accounts for hint plus error lines', async () => {
    const { input, output, readOutput } = createPromptStreams();
    const result = checkbox('Platforms?', ['A', 'B'], {
      input,
      output,
      hint: 'Space toggle · Enter confirm',
      minSelected: 1,
      onMinError: () => 'Pick one.',
    });

    input.write('\r');
    await new Promise((resolve) => setImmediate(resolve));
    input.write(' ');
    input.write('\r');

    await expect(result).resolves.toEqual(['A']);
    expect(readOutput()).toContain('Space toggle · Enter confirm');
    expect(readOutput()).toContain('\x1b[5A\r\x1b[J');
  });

  test('prompt input handles coalesced key sequences in order', async () => {
    const { input, output } = createPromptStreams();
    const result = checkbox('Platforms?', [
      { label: 'A', value: 'a', checked: true },
      { label: 'B', value: 'b', checked: true },
    ], { input, output, minSelected: 1 });

    input.write(' \x1b[B\r');

    await expect(result).resolves.toEqual(['b']);
  });

  test('textInput accepts default value on enter and typed value otherwise', async () => {
    const first = createPromptStreams();
    const defaultResult = textInput('Name?', { input: first.input, output: first.output, default: 'kuang' });
    first.input.write('\r');
    await expect(defaultResult).resolves.toBe('kuang');

    const second = createPromptStreams();
    const typedResult = textInput('Name?', { input: second.input, output: second.output, default: 'kuang' });
    second.input.write('leo\n');
    await expect(typedResult).resolves.toBe('leo');
  });

  test('confirm handles default, yes, and no values', async () => {
    const first = createPromptStreams();
    const defaultResult = confirm('Apply?', { input: first.input, output: first.output, default: true });
    first.input.write('\r');
    await expect(defaultResult).resolves.toBe(true);

    const second = createPromptStreams();
    const noResult = confirm('Apply?', { input: second.input, output: second.output, default: true });
    second.input.write('n');
    await expect(noResult).resolves.toBe(false);

    const third = createPromptStreams();
    const yesResult = confirm('Apply?', { input: third.input, output: third.output, default: false });
    third.input.write('y');
    await expect(yesResult).resolves.toBe(true);
  });

  test('confirm treats Windows and VT enter key sequences as enter', async () => {
    const first = createPromptStreams();
    const csiTildeResult = confirm('Apply?', { input: first.input, output: first.output, default: true });
    first.input.write('\x1b[13~');
    await expect(csiTildeResult).resolves.toBe(true);

    const second = createPromptStreams();
    const csiUResult = confirm('Apply?', { input: second.input, output: second.output, default: true });
    second.input.write('\x1b[13;0u');
    await expect(csiUResult).resolves.toBe(true);

    const third = createPromptStreams();
    const ss3Result = confirm('Apply?', { input: third.input, output: third.output, default: true });
    third.input.write('\x1bOM');
    await expect(ss3Result).resolves.toBe(true);
  });

  test('Ctrl+C cancels and restores raw mode', async () => {
    const { input, output } = createPromptStreams();
    const result = select('Platform?', ['A', 'B'], { input, output });

    input.write('\x03');

    await expect(result).rejects.toBeInstanceOf(PromptCancelled);
    expect(input.setRawMode).toHaveBeenLastCalledWith(false);
  });

  test('stdin EOF cancels and restores raw mode', async () => {
    const { input, output } = createPromptStreams();
    const result = textInput('Name?', { input, output, default: 'kuang' });

    input.end();

    await expect(result).rejects.toBeInstanceOf(PromptCancelled);
    expect(input.setRawMode).toHaveBeenLastCalledWith(false);
  });

  test('SIGTERM cleanup restores raw mode', async () => {
    const { input, output } = createPromptStreams();
    const result = confirm('Apply?', { input, output });

    process.emit('SIGTERM');

    await expect(result).rejects.toBeInstanceOf(PromptCancelled);
    expect(input.setRawMode).toHaveBeenLastCalledWith(false);
  });

  test('SIGHUP cleanup restores raw mode', async () => {
    const { input, output } = createPromptStreams();
    const result = confirm('Apply?', { input, output });

    process.emit('SIGHUP');

    await expect(result).rejects.toBeInstanceOf(PromptCancelled);
    expect(input.setRawMode).toHaveBeenLastCalledWith(false);
  });

  test('successful prompt pauses stdin after resuming it', async () => {
    const { input, output } = createPromptStreams();
    const resumeSpy = jest.spyOn(input, 'resume');
    const pauseSpy = jest.spyOn(input, 'pause');
    const result = confirm('Apply?', { input, output });

    input.write('\r');

    await expect(result).resolves.toBe(true);
    expect(resumeSpy).toHaveBeenCalled();
    expect(pauseSpy).toHaveBeenCalled();
  });
});
