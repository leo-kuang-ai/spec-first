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

test('snapshot promotion restores the previous directory when rename fails', () => {
  const payload = runPython(String.raw`
import importlib.util
import json
import pathlib
import sys
import tempfile

spec = importlib.util.spec_from_file_location("riffrec_analyzer", sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

with tempfile.TemporaryDirectory() as root_value:
    root = pathlib.Path(root_value)
    destination = root / "raw"
    staging = root / ".raw.staging-test"
    destination.mkdir()
    staging.mkdir()
    (destination / "old").write_text("keep")
    (staging / "new").write_text("new")
    replace = module.os.replace
    def fail_promotion(source, target):
        if source == staging:
            raise OSError("injected rename failure")
        return replace(source, target)
    module.os.replace = fail_promotion
    try:
        module.promote_snapshot(staging, destination)
    except OSError as error:
        reason = str(error)
    print(json.dumps({
        "reason": reason,
        "old": (destination / "old").read_text(),
        "backup_exists": (root / ".raw.staging-test.previous").exists(),
    }))
`);
  expect(payload).toEqual({ reason: 'injected rename failure', old: 'keep', backup_exists: false });
});

test('missing ffmpeg and failed frame extraction cannot retain stale or partial screenshots', () => {
  const payload = runPython(String.raw`
import importlib.util
import json
import pathlib
import subprocess
import sys
import tempfile

spec = importlib.util.spec_from_file_location("riffrec_analyzer", sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
results = []
with tempfile.TemporaryDirectory() as root_value:
    root = pathlib.Path(root_value)
    media = root / "recording.webm"
    media.write_bytes(b"media")
    frames = root / "frames"
    for outcome in ("missing", "failed", "timeout", "ok"):
        frames.mkdir(exist_ok=True)
        (frames / "stale.png").write_bytes(b"old")
        module.shutil.which = lambda name: None if outcome == "missing" else "/fixture/ffmpeg"
        def fake_run(command, **kwargs):
            pathlib.Path(command[-1]).write_bytes(b"partial" if outcome != "ok" else b"complete")
            if outcome == "timeout":
                raise subprocess.TimeoutExpired(command, 60)
            return subprocess.CompletedProcess(command, 0 if outcome == "ok" else 1, "", "failed")
        module.subprocess.run = fake_run
        moments = [{"id": "M1", "t": 1.0, "reason": "click"}]
        module.extract_frames(media, frames, moments)
        results.append({
            "outcome": outcome,
            "files": [entry.name for entry in frames.iterdir()],
            "screenshot": bool(moments[0].get("screenshot")),
            "path_exists": pathlib.Path(moments[0]["screenshot"]).exists() if moments[0].get("screenshot") else False,
        })
print(json.dumps(results))
`);
  for (const result of payload.slice(0, 3)) {
    expect(result.files).toEqual([]);
    expect(result.screenshot).toBe(false);
  }
  expect(payload[3]).toMatchObject({ screenshot: true, path_exists: true });
  expect(payload[3].files).toEqual(['m1-1.00s-click.png']);
});

test('media transcription is opt-in even when a credential is present', () => {
  const payload = runPython(String.raw`
import importlib.util
import json
import sys

spec = importlib.util.spec_from_file_location("riffrec_analyzer", sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

original_argv = list(sys.argv)
try:
    sys.argv = ["analyze_riffrec_zip.py", "capture.webm"]
    default_args = module.parse_args()
    sys.argv = ["analyze_riffrec_zip.py", "capture.webm", "--transcribe"]
    explicit_args = module.parse_args()
finally:
    sys.argv = original_argv

print(json.dumps({
    "default_transcribe": getattr(default_args, "transcribe", None),
    "explicit_transcribe": getattr(explicit_args, "transcribe", None),
}))
`);

  expect(payload).toEqual({
    default_transcribe: false,
    explicit_transcribe: true,
  });
});

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
    result = module.transcribe_media(media, "gpt-4o-mini-transcribe", "explicit-cli-flag")

print(json.dumps({"result": result, **captured}))
`);

  expect(payload.result.status).toBe('ok');
  expect(payload.result.transcription_egress_authorization).toBe('explicit-cli-flag');
  expect(payload.result.provider).toBe('openai-audio-transcriptions');
  expect(payload.command).toEqual(expect.arrayContaining(['curl', '--config', '-']));
  expect(JSON.stringify(payload.command)).not.toContain('sk-test-secret-sentinel');
  expect(payload.input).toContain('Authorization: Bearer sk-test-secret-sentinel');
});

test('transcription function makes zero provider calls without the explicit authorization receipt', () => {
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

calls = []
def fake_run(command, **kwargs):
    calls.append(command)
    raise AssertionError("provider subprocess must not run")

module.subprocess.run = fake_run
module.shutil.which = lambda command: "/usr/bin/curl" if command == "curl" else None
os.environ["OPENAI_API_KEY"] = "sk-test-secret-sentinel"

with tempfile.TemporaryDirectory() as root:
    media = pathlib.Path(root) / "voice.webm"
    media.write_bytes(b"media")
    result = module.transcribe_media(media, "gpt-4o-mini-transcribe")

print(json.dumps({"result": result, "calls": calls}))
`);

  expect(payload.result).toMatchObject({
    status: 'skipped',
    transcription_egress_authorization: 'missing',
    provider: 'openai-audio-transcriptions',
    provider_request_sent: false,
  });
  expect(payload.calls).toEqual([]);
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
