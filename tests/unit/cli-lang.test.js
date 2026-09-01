'use strict';

const {
  DEFAULT_CLI_LANG,
  resolveUserLanguage,
} = require('../../src/cli/cli-lang');

describe('resolveUserLanguage', () => {
  test('uses the global developer profile lang when valid', () => {
    expect(resolveUserLanguage({ readProfile: () => ({ lang: 'en' }) })).toBe('en');
    expect(resolveUserLanguage({ readProfile: () => ({ lang: 'zh' }) })).toBe('zh');
  });

  test('falls back to the default lang when the profile is missing or malformed', () => {
    expect(resolveUserLanguage({ readProfile: () => null })).toBe(DEFAULT_CLI_LANG);
    expect(resolveUserLanguage({ readProfile: () => ({ lang: 'fr' }) })).toBe(DEFAULT_CLI_LANG);
    expect(resolveUserLanguage({ readProfile: () => ({ name: 'n' }) })).toBe(DEFAULT_CLI_LANG);
  });

  test('profile read failures never propagate — language must not fail a command', () => {
    expect(resolveUserLanguage({ readProfile: () => { throw new Error('boom'); } }))
      .toBe(DEFAULT_CLI_LANG);
  });

  test('default lang is zh (repository language policy)', () => {
    expect(DEFAULT_CLI_LANG).toBe('zh');
  });
});
