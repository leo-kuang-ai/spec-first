'use strict';

const {
  RUNTIME_TOOLS_END,
  RUNTIME_TOOLS_START,
  removeManagedRuntimeToolsBlock,
} = require('../../src/cli/runtime-tools-index');

function managedRuntimeToolsBlock() {
  return [
    RUNTIME_TOOLS_START,
    '## Runtime Tools',
    '',
    '- `spec-mcp-setup` manages required MCP servers and helper tooling.',
    '- Runtime facts are setup evidence, not source authority.',
    '',
    RUNTIME_TOOLS_END,
  ].join('\n');
}

describe('runtime tools instruction cleanup', () => {
  const retiredProvider = ['Git', 'Nexus'].join('');

  test('exports marker constants and cleanup helper', () => {
    const runtimeToolsIndex = require('../../src/cli/runtime-tools-index');

    expect(runtimeToolsIndex).toEqual({
      RUNTIME_TOOLS_END,
      RUNTIME_TOOLS_START,
      removeManagedRuntimeToolsBlock,
    });
  });

  test('removes the managed marker block and preserves surrounding content', () => {
    const content = [
      '# Header',
      '',
      managedRuntimeToolsBlock(),
      '',
      '## Next',
      '',
    ].join('\n');

    const updated = removeManagedRuntimeToolsBlock(content);

    expect(updated).toContain('# Header');
    expect(updated).toContain('## Next');
    expect(updated).not.toContain(RUNTIME_TOOLS_START);
    expect(updated).not.toContain(RUNTIME_TOOLS_END);
  });

  test('repairs partial managed start marker by removing retired section body', () => {
    const corrupted = [
      '# Header',
      '',
      RUNTIME_TOOLS_START,
      '## Runtime Code Intelligence Tools',
      '',
      `- 局部规则要求改 symbol 前做 ${retiredProvider} impact。`,
      '- 若 CLI 不可用，会记录为工具不可用。',
      '',
      '## Next',
      '',
      '- Keep this next section.',
    ].join('\n');

    const updated = removeManagedRuntimeToolsBlock(corrupted);

    expect(updated).toContain('# Header');
    expect(updated).toContain('## Next');
    expect(updated).toContain('Keep this next section.');
    expect(updated).not.toContain(RUNTIME_TOOLS_START);
    expect(updated).not.toContain('Runtime Code Intelligence Tools');
    expect(updated).not.toContain(retiredProvider);
  });

  test('repairs dangling managed start marker at end of file by removing retired tail', () => {
    const corrupted = [
      '# Header',
      '',
      RUNTIME_TOOLS_START,
      '## Runtime Code Intelligence Tools',
      '',
      `- ${retiredProvider} impact is retired.`,
      '',
    ].join('\n');

    const updated = removeManagedRuntimeToolsBlock(corrupted);

    expect(updated).toContain('# Header');
    expect(updated).not.toContain(RUNTIME_TOOLS_START);
    expect(updated).not.toContain(retiredProvider);
  });

  test('strips an orphaned end marker', () => {
    const corrupted = [
      '# Header',
      '',
      RUNTIME_TOOLS_END,
      '',
      '## Runtime Tools',
    ].join('\n');

    const updated = removeManagedRuntimeToolsBlock(corrupted);

    expect(updated).toContain('# Header');
    expect(updated).toContain('## Runtime Tools');
    expect(updated).not.toContain(RUNTIME_TOOLS_END);
  });

  test('leaves files without managed runtime tools unchanged except newline normalization', () => {
    const content = [
      '# Header',
      '',
      '## Runtime Tools',
      '',
      '- User-authored section.',
      '',
    ].join('\n');

    expect(removeManagedRuntimeToolsBlock(content)).toBe(content);
  });
});
