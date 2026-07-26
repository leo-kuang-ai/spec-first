'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..', '..');
const validateClaims = path.join(repoRoot, 'skills/spec-compound/scripts/validate-doc-claims.py');
const parallelProbe = path.join(repoRoot, 'skills/spec-optimize/scripts/parallel-probe.sh');
const riffrec = path.join(repoRoot, 'skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py');
const sweepRiffrec = path.join(repoRoot, 'skills/spec-sweep/scripts/analyze_riffrec_zip.py');

describe('remaining script failure-path defenses', () => {
  test('claim validation reads malformed UTF-8 documents without a decode crash', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-doc-claims-'));
    const doc = path.join(root, '中文.md');
    fs.writeFileSync(doc, Buffer.concat([Buffer.from('# 文档\n', 'utf8'), Buffer.from([0xff, 0xfe]) ]));
    try {
      const result = spawnSync('python3', [validateClaims, doc], { cwd: root, encoding: 'utf8' });
      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      expect(result.stdout).toContain('not a git repository');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test.each([
    ['vite --port 4310'],
    ['vite --port=4310'],
    ['PORT=4310 npm test'],
    ['curl http://localhost:4310/health'],
  ])('parallel probe recognizes hardcoded port form: %s', (measurementCommand) => {
    const result = spawnSync('bash', [parallelProbe, repoRoot, measurementCommand], { encoding: 'utf8' });
    expect(result.status).toBe(0);
    const report = JSON.parse(result.stdout);
    expect(report.blockers).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'port' })]));
  });

  test('parallel probe does not invent a port blocker when the command has no port', () => {
    const result = spawnSync('bash', [parallelProbe, repoRoot, 'npm test'], { encoding: 'utf8' });
    expect(result.status).toBe(0);
    const report = JSON.parse(result.stdout);
    expect(report.blockers).not.toEqual(expect.arrayContaining([expect.objectContaining({ type: 'port' })]));
  });

  test('Riffrec mirrors stay identical and degrade array payloads, unknown duration, and ffprobe timeout', () => {
    expect(fs.readFileSync(riffrec).equals(fs.readFileSync(sweepRiffrec))).toBe(true);
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-riffrec-'));
    const probe = `
import importlib.util, json, pathlib, subprocess, sys, zipfile
script, root = sys.argv[1:]
spec = importlib.util.spec_from_file_location('riffrec', script)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
root = pathlib.Path(root)
source = root / 'feedback.zip'
with zipfile.ZipFile(source, 'w') as archive:
    archive.writestr('session.json', '[]')
    archive.writestr('events.json', '[{"type":"click"}]')
prepared = module.prepare_source(source, root / 'raw')
media = root / 'sample.webm'
media.write_bytes(b'x')
module.shutil.which = lambda _name: 'tool'
chunk = module.transcribe_media_chunks(media, 'model', root / 'chunks', 0)
module.subprocess.run = lambda *args, **kwargs: (_ for _ in ()).throw(subprocess.TimeoutExpired('ffprobe', 30))
timeout_duration = module.ffprobe_duration(media)
print(json.dumps({'session': prepared['session'], 'events': prepared['events'], 'chunk': chunk, 'timeout_duration': timeout_duration}))
`;
    try {
      const result = spawnSync('python3', ['-c', probe, riffrec, root], { encoding: 'utf8' });
      expect(result.status).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.session).toEqual({});
      expect(output.events).toEqual([{ type: 'click' }]);
      expect(output.chunk).toMatchObject({ status: 'failed', degraded: true });
      expect(output.timeout_duration).toBe(0);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
