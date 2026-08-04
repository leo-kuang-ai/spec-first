'use strict';

const path = require('node:path');
const { spawnSync } = require('node:child_process');

const analyzerPath = path.resolve(
  __dirname,
  '../../skills/spec-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py',
);

function resolvePython() {
  for (const command of ['python3', 'python']) {
    const result = spawnSync(command, ['--version'], { encoding: 'utf8' });
    if (!result.error && result.status === 0) return command;
  }
  throw new Error('Python runtime is required for Riffrec analyzer safety tests');
}

const python = resolvePython();

function runPython(source) {
  const result = spawnSync(python, ['-c', source, analyzerPath], {
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `python exited ${result.status}`);
  }
  return JSON.parse(result.stdout);
}

test('transcription sends the API key through curl config stdin instead of argv', () => {
  const payload = runPython(String.raw`
import importlib.util
import json
import os
import pathlib
import sys
import tempfile

spec = importlib.util.spec_from_file_location("riffrec_analyzer", sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

captured = {}
class Result:
    returncode = 0
    stdout = '{"text":"ok"}'
    stderr = ''

def fake_run(command, **kwargs):
    captured["command"] = command
    captured["input"] = kwargs.get("input", "")
    return Result()

module.subprocess.run = fake_run
module.shutil.which = lambda command: "/usr/bin/curl" if command == "curl" else None
os.environ["OPENAI_API_KEY"] = "sk-test-secret-sentinel"

with tempfile.TemporaryDirectory() as root:
    media = pathlib.Path(root) / "voice.webm"
    media.write_bytes(b"media")
    result = module.transcribe_media(media, "gpt-4o-mini-transcribe")

print(json.dumps({"result": result, **captured}))
`);

  expect(payload.result.status).toBe('ok');
  expect(payload.command).toEqual(expect.arrayContaining(['curl', '--config', '-']));
  expect(JSON.stringify(payload.command)).not.toContain('sk-test-secret-sentinel');
  expect(payload.input).toContain('Authorization: Bearer sk-test-secret-sentinel');
});

test('zip budget failures preserve the previous destination and clean staging files', () => {
  const payload = runPython(String.raw`
import importlib.util
import json
import pathlib
import sys
import tempfile
import zipfile

spec = importlib.util.spec_from_file_location("riffrec_analyzer", sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

with tempfile.TemporaryDirectory() as root_value:
    root = pathlib.Path(root_value)
    archive_path = root / "capture.zip"
    destination = root / "raw"
    destination.mkdir()
    (destination / "sentinel.txt").write_text("keep")
    with zipfile.ZipFile(archive_path, "w") as archive:
        archive.writestr("one.txt", "one")
        archive.writestr("two.txt", "two")

    module.MAX_ZIP_MEMBERS = 1
    try:
        module.safe_extract(archive_path, destination)
        reason = "not-raised"
    except RuntimeError as error:
        reason = str(error)

    staging = sorted(path.name for path in root.iterdir() if path.name.startswith(".raw-extract-"))
    print(json.dumps({
        "reason": reason,
        "sentinel": (destination / "sentinel.txt").read_text(),
        "staging": staging,
    }))
`);

  expect(payload.reason).toContain('Zip member budget exceeded');
  expect(payload.sentinel).toBe('keep');
  expect(payload.staging).toEqual([]);
});

test('zip extraction enforces declared and streaming size and compression budgets', () => {
  const payload = runPython(String.raw`
import importlib.util
import json
import pathlib
import sys
import tempfile
import zipfile

spec = importlib.util.spec_from_file_location("riffrec_analyzer", sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

results = []
with tempfile.TemporaryDirectory() as root_value:
    root = pathlib.Path(root_value)

    size_zip = root / "size.zip"
    with zipfile.ZipFile(size_zip, "w", compression=zipfile.ZIP_STORED) as archive:
        archive.writestr("large.bin", b"12345")
    module.MAX_ZIP_MEMBER_BYTES = 4
    try:
        module.safe_extract(size_zip, root / "size-out")
        results.append("size:not-raised")
    except RuntimeError as error:
        results.append(str(error))

    ratio_zip = root / "ratio.zip"
    with zipfile.ZipFile(ratio_zip, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("compressed.bin", b"a" * 4096)
    module.MAX_ZIP_MEMBER_BYTES = 1024 * 1024
    module.MAX_ZIP_COMPRESSION_RATIO = 2
    try:
        module.safe_extract(ratio_zip, root / "ratio-out")
        results.append("ratio:not-raised")
    except RuntimeError as error:
        results.append(str(error))

print(json.dumps(results))
`);

  expect(payload[0]).toContain('Zip member size budget exceeded');
  expect(payload[1]).toContain('Zip compression ratio budget exceeded');
});
