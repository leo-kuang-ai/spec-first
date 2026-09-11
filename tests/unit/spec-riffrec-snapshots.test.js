'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const script = path.resolve(__dirname, '../../skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py');
let root;
let capture;
let output;
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'riffrec-snapshot-'));
  capture = path.join(root, 'capture');
  output = path.join(root, 'output');
  fs.mkdirSync(capture);
  fs.writeFileSync(path.join(capture, 'session.json'), JSON.stringify({ duration_seconds: 8 }));
  fs.writeFileSync(path.join(capture, 'events.json'), JSON.stringify([{ type: 'click', timestamp: 3 }]));
});
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

function run(source = capture, destination = output) {
  return spawnSync('python3', [script, source, '--output-dir', destination, '--no-transcribe'], {
    cwd: root, encoding: 'utf8', timeout: 15000,
  });
}
function seedOldEvidence() {
  for (const directory of ['raw', 'frames']) {
    fs.mkdirSync(path.join(output, directory), { recursive: true });
    fs.writeFileSync(path.join(output, directory, 'old.png'), 'old');
  }
}

test('unpacked capture preserves synchronized events and replaces old raw and frames', () => {
  seedOldEvidence();
  const result = run();
  expect({ status: result.status, stderr: result.stderr }).toEqual({ status: 0, stderr: '' });
  const analysis = JSON.parse(fs.readFileSync(path.join(output, 'analysis.json'), 'utf8'));
  expect(analysis.source_kind).toBe('riffrec_directory');
  expect(analysis.session.duration_seconds).toBe(8);
  expect(analysis.event_counts.click).toBe(1);
  expect(analysis.transcription_egress_receipt.provider_request_sent).toBe(false);
  expect(fs.readdirSync(path.join(output, 'raw')).sort()).toEqual(['events.json', 'session.json']);
  expect(fs.readdirSync(path.join(output, 'frames'))).toEqual([]);
  expect(fs.readdirSync(output).some(name => name.startsWith('.'))).toBe(false);
});

test('rerun with notes removes previous capture media and screenshots', () => {
  seedOldEvidence();
  const notes = path.join(root, 'feedback.md');
  fs.writeFileSync(notes, 'The coupon button should show an error.');
  expect(run(notes).status).toBe(0);
  expect(fs.readdirSync(path.join(output, 'raw'))).toEqual(['feedback.md']);
  expect(fs.readdirSync(path.join(output, 'frames'))).toEqual([]);
});

test('invalid directory and symlink entries fail without replacing prior evidence', () => {
  seedOldEvidence();
  fs.unlinkSync(path.join(capture, 'events.json'));
  expect(run().status).toBe(2);
  fs.writeFileSync(path.join(capture, 'events.json'), '[]');
  fs.symlinkSync(path.join(output, 'raw', 'old.png'), path.join(capture, 'linked.png'));
  expect(run().status).toBe(2);
  expect(fs.readFileSync(path.join(output, 'raw', 'old.png'), 'utf8')).toBe('old');
  expect(fs.readdirSync(output).sort()).toEqual(['frames', 'raw']);
});

test('overlapping source and destination are rejected before any output mutation', () => {
  expect(run(capture, root).status).toBe(2);
  expect(run(capture, path.join(capture, 'output')).status).toBe(2);
  expect(fs.readdirSync(capture).sort()).toEqual(['events.json', 'session.json']);
});

test.each(['raw', 'frames'])('symlink in existing %s snapshot prevents replacement', directory => {
  seedOldEvidence();
  fs.symlinkSync(path.join(capture, 'session.json'), path.join(output, directory, 'linked'));
  expect(run().status).toBe(2);
  expect(fs.readFileSync(path.join(output, 'raw', 'old.png'), 'utf8')).toBe('old');
  expect(fs.readFileSync(path.join(capture, 'session.json'), 'utf8')).toContain('duration_seconds');
});
