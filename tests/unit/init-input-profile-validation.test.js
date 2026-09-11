'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

describe('init developer profile reuse', () => {
  afterEach(() => {
    jest.dontMock('../../src/cli/developer');
    jest.resetModules();
  });

  test('does not reuse a profile with an unsupported language', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-init-profile-'));
    const profilePath = path.join(root, '.developer');
    jest.resetModules();
    jest.doMock('../../src/cli/developer', () => ({
      ...jest.requireActual('../../src/cli/developer'),
      getGlobalDeveloperPath: () => profilePath,
      readDeveloperFile: () => ({ name: 'legacy-user', lang: 'fr' }),
      readGitUserName: () => '',
    }));

    const { collectInitInput } = require('../../src/cli/commands/init-input');
    const promptApi = {
      requireTty: () => ({ ok: true }),
      checkbox: async () => ['codex'],
      select: jest.fn(async () => 'en'),
      textInput: jest.fn(async () => 'new-user'),
      confirm: jest.fn(async () => true),
    };

    const result = await collectInitInput({
      workspaceRoot: root,
      promptApi,
      parsed: {
        platforms: ['codex'],
        yes: false,
        name: '',
        lang: '',
        repo: '',
        allRepos: false,
      },
      defaults: { name: 'legacy-user', lang: 'zh' },
      defaultLang: 'zh',
    });

    expect(result).toEqual(expect.objectContaining({ name: 'new-user', lang: 'en' }));
    expect(promptApi.select).toHaveBeenCalled();
    expect(promptApi.confirm.mock.calls.flat().join('\n')).not.toContain('Reuse it?');
  });
});
