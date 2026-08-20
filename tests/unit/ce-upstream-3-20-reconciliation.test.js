'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const checker = require('../../scripts/check-ce-upstream-reconciliation.cjs');

describe('CE 3.20 reconciliation deterministic floor', () => {
  test('legacy ledger verification does not rewrite or require a current inventory snapshot', () => {
    expect(checker.main(['--verify-legacy'])).toBe(0);
  });

  test('fails closed when an upstream path is not independently audited', () => {
    const audit = new Map([
      ['known.md', {
        audit_id: 'F001',
        spec_first_owner: 'docs',
        verdict: '证据使用',
        test_owner: 'docs contract',
      }],
    ]);
    expect(() => checker.buildLedger([
      { status: 'M', path: 'known.md' },
      { status: 'A', path: 'missing.md' },
    ], audit)).toThrow('未在逐文件审计分类');
  });

  test('fails closed on duplicate name-status paths', () => {
    const audit = new Map([
      ['known.md', {
        audit_id: 'F001',
        spec_first_owner: 'docs',
        verdict: '证据使用',
        test_owner: 'docs contract',
      }],
    ]);
    expect(() => checker.buildLedger([
      { status: 'M', path: 'known.md' },
      { status: 'M', path: 'known.md' },
    ], audit)).toThrow('路径重复');
  });

  test('live refresh requires an explicit CE repository', () => {
    expect(() => checker.main(['--refresh'])).toThrow('--refresh 必须同时提供 --ce-repo');
  });

  test('name-status parser preserves rename provenance', () => {
    expect(checker.parseNameStatus('R100\told.md\tnew.md\n')).toEqual([
      { status: 'R100', old_path: 'old.md', path: 'new.md' },
    ]);
  });
});
