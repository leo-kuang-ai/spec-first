'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..', '..');
const sweepState = path.join(repoRoot, 'skills/spec-sweep/scripts/sweep-state.py');

function tempDir() {
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-sweep-legacy-import-')));
}

function runSweepState(cwd, args) {
  const result = spawnSync('python3', [sweepState, ...args], { cwd, encoding: 'utf8' });
  return {
    ok: result.status === 0,
    stdout: String(result.stdout || ''),
    stderr: String(result.stderr || ''),
  };
}

function readState(cwd, stateFile) {
  const probe = `
import importlib.util, json, sys
spec = importlib.util.spec_from_file_location('sweep_state', ${JSON.stringify(sweepState)})
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
status, data = module.load_state(${JSON.stringify(stateFile)})
print(json.dumps({'status': status, 'data': data}))
`;
  const result = spawnSync('python3', ['-c', probe], { cwd, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`state probe failed: ${result.stderr}`);
  return JSON.parse(result.stdout);
}

function itemKey(source, itemId) {
  return `${source}:${itemId}`;
}

// The items keyspace is namespaced by source (`<source>:<id>`). The legacy import wrote bare ids,
// so imported items landed under a key no consumer ever queries: an already-closed legacy item
// resurfaced as new on the next sweep, and bare ids could collide across sources.
describe('spec-sweep legacy item import keying', () => {
  test('imports a legacy item under the canonical composite key and applies source_map', () => {
    const cwd = tempDir();
    fs.writeFileSync(path.join(cwd, 'legacy.json'), JSON.stringify({
      channels: { C42: { last_processed_ts: '1700000000.000100' } },
      items: { '1234.5678': { channel: 'C42', status: 'closed', title: 'already handled' } },
    }), 'utf8');

    const result = runSweepState(cwd, [
      'import-legacy',
      '--state', 'state.json',
      '--file', 'legacy.json',
      '--source-map', JSON.stringify({ C42: 'slack-alpha' }),
    ]);

    expect(result.ok).toBe(true);
    expect(JSON.parse(result.stdout.split('\n').filter(Boolean).pop())).toMatchObject({
      cursors_imported: 1,
      items_imported: 1,
      items_skipped_unsourced: 0,
    });

    const { data } = readState(cwd, 'state.json');
    const canonicalKey = itemKey('slack-alpha', '1234.5678');

    // The cursor import already maps C42 -> slack-alpha; the item must land on the same source.
    expect(Object.keys(data.items)).toEqual([canonicalKey]);
    expect(data.items[canonicalKey]).toMatchObject({
      source: 'slack-alpha',
      id: '1234.5678',
      status: 'closed',
    });
    expect(data.items['1234.5678']).toBeUndefined();
    expect(Object.keys(data.sources)).toContain('slack-alpha');
  });

  test('keeps same-id items from different sources separate', () => {
    const cwd = tempDir();
    fs.writeFileSync(path.join(cwd, 'legacy.json'), JSON.stringify({
      items: [
        { id: '100', source: 'alpha', status: 'closed' },
        { id: '100', source: 'beta', status: 'open' },
      ],
    }), 'utf8');

    expect(runSweepState(cwd, [
      'import-legacy', '--state', 'state.json', '--file', 'legacy.json',
    ]).ok).toBe(true);

    const { data } = readState(cwd, 'state.json');

    expect(data.items[itemKey('alpha', '100')]).toMatchObject({ status: 'closed' });
    expect(data.items[itemKey('beta', '100')]).toMatchObject({ status: 'open' });
  });

  test('reports rather than silently drops a legacy item that carries no source', () => {
    const cwd = tempDir();
    fs.writeFileSync(path.join(cwd, 'legacy.json'), JSON.stringify({
      items: [{ id: '999', status: 'closed' }],
    }), 'utf8');

    const result = runSweepState(cwd, [
      'import-legacy', '--state', 'state.json', '--file', 'legacy.json',
    ]);

    expect(result.ok).toBe(true);
    expect(JSON.parse(result.stdout.split('\n').filter(Boolean).pop())).toMatchObject({
      items_imported: 0,
      items_skipped_unsourced: 1,
    });
  });
});
