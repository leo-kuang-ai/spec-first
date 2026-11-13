#!/usr/bin/env python3
"""
Analyze a product feedback source.

Supported sources: Riffrec zip or unpacked capture, standalone video, audio, and
meeting notes text/markdown. The script extracts transcript, high-signal
video frames when available, and spec-first-friendly markdown artifacts.

Canonical owner：spec-riffrec-feedback-analysis。
Package-local projection：spec-sweep 保留 byte-identical copy，因为 host runtime
package 不能导入另一个 skill 的 private script path。
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import stat
import subprocess
import sys
import tempfile
import zipfile
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath
from typing import Any


COMPLAINT_CUES = (
    "weird",
    "doesn't work",
    "does not work",
    "dont work",
    "don't work",
    "can't",
    "cannot",
    "broken",
    "bug",
    "problem",
    "confusing",
    "should",
    "wrong",
    "stuck",
    "failed",
)

NOISY_NETWORK_PATTERNS = (
    "/mini-profiler-resources/",
    "__vite_ping",
    "/rails/action_cable",
)

VIDEO_EXTENSIONS = {".webm", ".mp4", ".mov", ".m4v", ".mkv", ".avi"}
AUDIO_EXTENSIONS = {".webm", ".mp3", ".mp4", ".mpeg", ".mpga", ".m4a", ".wav", ".ogg", ".flac"}
NOTES_EXTENSIONS = {".txt", ".md", ".markdown", ".text"}
RIFFREC_DIRECTORY_MARKERS = {"session.json", "events.json"}
MAX_ZIP_MEMBERS = 512
MAX_ZIP_MEMBER_BYTES = 1024 * 1024 * 1024
MAX_ZIP_TOTAL_BYTES = 2 * 1024 * 1024 * 1024
MAX_ZIP_COMPRESSION_RATIO = 200
ZIP_COPY_CHUNK_BYTES = 1024 * 1024


class SourceInputError(ValueError):
    pass


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Analyze a product feedback source")
    parser.add_argument("source_path", type=Path, help="Path to a Riffrec zip or unpacked capture directory, video, audio, or notes")
    parser.add_argument(
        "--output-dir",
        type=Path,
        help="Directory for extracted evidence/kickoff artifacts. Defaults to docs/brainstorms/riffrec-feedback/<source-stem> when available; durable spec-brainstorm outputs live in docs/plans/.",
    )
    parser.add_argument("--topic", help="Kebab-case topic for requirements-kickoff frontmatter")
    parser.add_argument(
        "--model",
        default=os.environ.get("RIFFREC_TRANSCRIBE_MODEL", "gpt-4o-mini-transcribe"),
        help="OpenAI transcription model to use when OPENAI_API_KEY is set",
    )
    transcription = parser.add_mutually_exclusive_group()
    transcription.add_argument(
        "--transcribe",
        dest="transcribe",
        action="store_true",
        help="Explicitly authorize sending media to the OpenAI audio transcription provider",
    )
    transcription.add_argument(
        "--no-transcribe",
        dest="transcribe",
        action="store_false",
        help="Keep media local and skip third-party transcription (default)",
    )
    parser.set_defaults(transcribe=False)
    parser.add_argument("--max-moments", type=int, default=12, help="Maximum screenshots to extract")
    args = parser.parse_args()
    if args.max_moments < 0:
        parser.error("--max-moments must be nonnegative")
    return args


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", value.strip().lower()).strip("-")
    return re.sub(r"-{2,}", "-", slug) or "riffrec-feedback"


def read_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text())
    except (json.JSONDecodeError, OSError, UnicodeDecodeError):
        return default


def safe_extract(zip_path: Path, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    staging = Path(tempfile.mkdtemp(prefix=f".{dest.name}-extract-", dir=dest.parent))
    try:
        with zipfile.ZipFile(zip_path) as archive:
            members = archive.infolist()
            if len(members) > MAX_ZIP_MEMBERS:
                raise RuntimeError(f"Zip member budget exceeded: {len(members)} > {MAX_ZIP_MEMBERS}")

            declared_total = 0
            normalized_names: set[str] = set()
            for member in members:
                normalized = PurePosixPath(member.filename.replace("\\", "/"))
                if normalized.is_absolute() or not normalized.parts or ".." in normalized.parts:
                    raise RuntimeError(f"Unsafe zip member path: {member.filename}")
                normalized_name = normalized.as_posix().rstrip("/")
                if not normalized_name or normalized_name in normalized_names:
                    raise RuntimeError(f"Duplicate or empty zip member path: {member.filename}")
                normalized_names.add(normalized_name)
                if member.file_size > MAX_ZIP_MEMBER_BYTES:
                    raise RuntimeError(
                        f"Zip member size budget exceeded: {member.filename} ({member.file_size} bytes)"
                    )
                declared_total += member.file_size
                if declared_total > MAX_ZIP_TOTAL_BYTES:
                    raise RuntimeError(f"Zip total size budget exceeded: {declared_total} bytes")
                if member.file_size > 0:
                    ratio = member.file_size / max(member.compress_size, 1)
                    if ratio > MAX_ZIP_COMPRESSION_RATIO:
                        raise RuntimeError(
                            f"Zip compression ratio budget exceeded: {member.filename} ({ratio:.1f})"
                        )

            streamed_total = 0
            for member in members:
                normalized = PurePosixPath(member.filename.replace("\\", "/"))
                resolved = staging.joinpath(*normalized.parts)
                if member.is_dir():
                    resolved.mkdir(parents=True, exist_ok=True)
                    continue
                resolved.parent.mkdir(parents=True, exist_ok=True)
                member_written = 0
                with archive.open(member) as source, resolved.open("wb") as target:
                    while True:
                        chunk = source.read(ZIP_COPY_CHUNK_BYTES)
                        if not chunk:
                            break
                        member_written += len(chunk)
                        streamed_total += len(chunk)
                        if member_written > MAX_ZIP_MEMBER_BYTES:
                            raise RuntimeError(f"Zip member stream budget exceeded: {member.filename}")
                        if streamed_total > MAX_ZIP_TOTAL_BYTES:
                            raise RuntimeError("Zip total stream budget exceeded")
                        target.write(chunk)
                if member_written != member.file_size:
                    raise RuntimeError(
                        f"Zip member size mismatch: {member.filename} ({member_written} != {member.file_size})"
                    )

        promote_snapshot(staging, dest)
    except Exception:
        shutil.rmtree(staging, ignore_errors=True)
        raise


def validate_snapshot_destination(destination: Path) -> None:
    if destination.is_symlink() or (destination.exists() and not destination.is_dir()):
        raise SourceInputError(f"Output must be a non-symlink directory: {destination}")
    if destination.exists():
        for entry in destination.rglob("*"):
            if entry.is_symlink() or not (entry.is_dir() or entry.is_file()):
                raise SourceInputError(f"Output contains an unsafe entry: {entry}")


def promote_snapshot(staging: Path, destination: Path) -> None:
    validate_snapshot_destination(destination)
    previous = staging.with_name(staging.name + ".previous")
    if previous.exists() or previous.is_symlink():
        raise SourceInputError(f"Snapshot backup already exists: {previous}")
    had_previous = destination.exists()
    if had_previous:
        os.replace(destination, previous)
    try:
        os.replace(staging, destination)
    except BaseException:
        if had_previous:
            os.replace(previous, destination)
        raise
    if had_previous:
        shutil.rmtree(previous)


def safe_copy_capture_directory(source_dir: Path, destination: Path) -> None:
    entries = sorted(source_dir.rglob("*"))
    for entry in entries:
        if entry.is_symlink() or not (entry.is_dir() or entry.is_file()):
            raise SourceInputError(f"Unpacked capture contains an unsafe entry: {entry}")
        if not entry.resolve().is_relative_to(source_dir.resolve()):
            raise SourceInputError(f"Unpacked capture entry escapes source: {entry}")
    for entry in entries:
        target = destination / entry.relative_to(source_dir)
        if entry.is_dir():
            target.mkdir(parents=True, exist_ok=True)
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(entry, target)
    if any(not (destination / marker).is_file() for marker in RIFFREC_DIRECTORY_MARKERS):
        raise SourceInputError("Unpacked capture changed during normalization; missing session.json or events.json")


def default_output_dir(zip_path: Path) -> Path:
    cwd = Path.cwd()
    stem = slugify(zip_path.stem)
    if (cwd / "docs" / "brainstorms").is_dir():
        return cwd / "docs" / "brainstorms" / "riffrec-feedback" / stem
    return cwd / "riffrec-feedback" / stem


def classify_source(source_path: Path) -> str:
    if source_path.is_symlink():
        raise SourceInputError(f"Source must not be a symlink: {source_path}")
    if source_path.is_dir():
        missing = sorted(marker for marker in RIFFREC_DIRECTORY_MARKERS if not (source_path / marker).is_file())
        if missing:
            raise SourceInputError(f"Unpacked Riffrec capture is missing: {', '.join(missing)}")
        return "riffrec_directory"
    if not source_path.is_file():
        raise SourceInputError(f"Unsupported source path type: {source_path}")
    if zipfile.is_zipfile(source_path):
        return "riffrec_zip"
    suffix = source_path.suffix.lower()
    if suffix in NOTES_EXTENSIONS:
        return "meeting_notes"
    if suffix in VIDEO_EXTENSIONS and suffix in AUDIO_EXTENSIONS:
        return "video" if has_video_stream(source_path) else "audio"
    if suffix in VIDEO_EXTENSIONS:
        return "video"
    if suffix in AUDIO_EXTENSIONS:
        return "audio"
    return "unknown"


def ffprobe_duration(path: Path) -> float:
    if not path.exists() or not shutil.which("ffprobe"):
        return 0.0
    command = [
        "ffprobe",
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        str(path),
    ]
    try:
        result = subprocess.run(command, capture_output=True, text=True, timeout=30)
    except subprocess.TimeoutExpired:
        return 0.0
    if result.returncode != 0:
        return 0.0
    try:
        return float(result.stdout.strip())
    except ValueError:
        return 0.0


def has_video_stream(path: Path) -> bool:
    if not path.exists() or not shutil.which("ffprobe"):
        return path.suffix.lower() in VIDEO_EXTENSIONS
    command = [
        "ffprobe",
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=codec_type",
        "-of",
        "csv=p=0",
        str(path),
    ]
    try:
        result = subprocess.run(command, capture_output=True, text=True, timeout=30)
    except subprocess.TimeoutExpired:
        return False
    return result.returncode == 0 and "video" in result.stdout


def read_notes(path: Path) -> dict[str, Any]:
    text = path.read_text(encoding="utf-8", errors="replace")
    return {"status": "ok", "text": text.strip(), "source": "meeting_notes"}


def populate_source_snapshot(source_path: Path, raw_dir: Path, source_kind: str) -> dict[str, Any]:
    raw_dir.mkdir(parents=True, exist_ok=True)

    if source_kind in {"riffrec_zip", "riffrec_directory"}:
        if source_kind == "riffrec_zip":
            safe_extract(source_path, raw_dir)
        else:
            safe_copy_capture_directory(source_path, raw_dir)
        session_payload = read_json(raw_dir / "session.json", {})
        session = session_payload if isinstance(session_payload, dict) else {}
        events_payload = read_json(raw_dir / "events.json", {})
        if isinstance(events_payload, list):
            events = events_payload
        elif isinstance(events_payload, dict):
            events = events_payload.get("events", [])
        else:
            events = []
        if not isinstance(events, list):
            events = []
        try:
            duration = float(session.get("duration_seconds") or (
                events_payload.get("duration_seconds") if isinstance(events_payload, dict) else 0
            ) or 0)
        except (TypeError, ValueError):
            duration = 0.0
        return {
            "source_kind": source_kind,
            "session": session,
            "events": events,
            "duration": duration,
            "recording_path": raw_dir / "recording.webm",
            "transcription_path": raw_dir / "voice.webm",
            "notes_transcript": None,
        }

    copied_path = raw_dir / source_path.name
    if source_path.resolve() != copied_path.resolve():
        shutil.copy2(source_path, copied_path)

    session = {
        "url": "unknown",
        "started_at": "unknown",
        "duration_seconds": 0,
        "source_file": str(source_path),
        "source_kind": source_kind,
    }

    if source_kind == "meeting_notes":
        notes_transcript = read_notes(copied_path)
        return {
            "source_kind": source_kind,
            "session": session,
            "events": [],
            "duration": 0.0,
            "recording_path": None,
            "transcription_path": None,
            "notes_transcript": notes_transcript,
        }

    duration = ffprobe_duration(copied_path)
    session["duration_seconds"] = round(duration, 3) if duration else 0
    recording_path = copied_path if has_video_stream(copied_path) else None
    transcription_path = copied_path if source_kind in {"video", "audio", "unknown"} else None
    return {
        "source_kind": source_kind,
        "session": session,
        "events": [],
        "duration": duration,
        "recording_path": recording_path,
        "transcription_path": transcription_path,
        "notes_transcript": None,
    }


def prepare_source(source_path: Path, raw_dir: Path) -> dict[str, Any]:
    source_kind = classify_source(source_path)
    validate_snapshot_destination(raw_dir)
    raw_dir.parent.mkdir(parents=True, exist_ok=True)
    staging = Path(tempfile.mkdtemp(prefix=f".{raw_dir.name}.staging-", dir=raw_dir.parent))
    try:
        source = populate_source_snapshot(source_path, staging, source_kind)
        promote_snapshot(staging, raw_dir)
    except BaseException:
        if staging.exists() and not staging.is_symlink():
            shutil.rmtree(staging, ignore_errors=True)
        raise
    for key in ("recording_path", "transcription_path"):
        if source[key] is not None:
            source[key] = raw_dir / source[key].relative_to(staging)
    return source


def repo_relative(path: Path, base: Path) -> str:
    try:
        return str(path.resolve().relative_to(base.resolve()))
    except ValueError:
        return str(path)


def display_path(path: Path, repo_root: Path) -> str:
    relative = repo_relative(path, repo_root)
    return relative if not relative.startswith("/") else str(path)


def format_time(seconds: float | int | None) -> str:
    if seconds is None:
        return "n/a"
    seconds_float = float(seconds)
    minutes = int(seconds_float // 60)
    rest = seconds_float - minutes * 60
    return f"{minutes:02d}:{rest:05.2f}"


def event_time(event: dict[str, Any]) -> float:
    try:
        return float(event.get("t", 0))
    except (TypeError, ValueError):
        return 0.0


def event_label(event: dict[str, Any]) -> str:
    event_type = event.get("type", "event")
    if event_type == "click":
        element = event.get("element") or {}
        text = compact_text(element.get("text") or "")
        element_id = element.get("id")
        tag = element.get("tag") or "element"
        if element_id:
            return f"click {tag}#{element_id} {text}".strip()
        return f"click {tag} {text}".strip()
    if event_type == "network_request":
        return f"{event.get('method', 'GET')} {event.get('url', '')} -> {event.get('status')}"
    return compact_text(json.dumps(event, sort_keys=True))


def compact_text(text: str, limit: int = 120) -> str:
    compacted = re.sub(r"\s+", " ", str(text)).strip()
    if len(compacted) <= limit:
        return compacted
    return compacted[: limit - 1].rstrip() + "..."


def network_is_noise(event: dict[str, Any]) -> bool:
    url = str(event.get("url") or "")
    return any(pattern in url for pattern in NOISY_NETWORK_PATTERNS)


def transcript_has_complaint(transcript: str) -> bool:
    lowered = transcript.lower()
    return any(cue in lowered for cue in COMPLAINT_CUES)


def transcribe_media(
    media_path: Path | None,
    model: str,
    egress_authorization: str = "missing",
) -> dict[str, Any]:
    receipt = {
        "transcription_egress_authorization": egress_authorization,
        "provider": "openai-audio-transcriptions",
        "provider_request_sent": False,
    }
    if egress_authorization != "explicit-cli-flag":
        return {
            **receipt,
            "status": "skipped",
            "text": "",
            "reason": "Transcription egress was not explicitly authorized. Re-run with --transcribe.",
        }
    if not media_path or not media_path.exists():
        return {**receipt, "status": "missing", "text": ""}
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return {
            **receipt,
            "status": "skipped",
            "text": "",
            "reason": "OPENAI_API_KEY is not set. Re-run with the key available to transcribe the media file.",
        }
    if not shutil.which("curl"):
        return {**receipt, "status": "skipped", "text": "", "reason": "curl is not installed"}
    if "\r" in api_key or "\n" in api_key:
        return {**receipt, "status": "failed", "text": "", "reason": "OPENAI_API_KEY contains invalid line breaks"}

    escaped_api_key = api_key.replace("\\", "\\\\").replace('"', '\\"')
    curl_config = f'header = "Authorization: Bearer {escaped_api_key}"\n'

    command = [
        "curl",
        "--config",
        "-",
        "-sS",
        "https://api.openai.com/v1/audio/transcriptions",
        "-F",
        f"file=@{media_path}",
        "-F",
        f"model={model}",
        "-F",
        "response_format=json",
    ]
    try:
        result = subprocess.run(command, input=curl_config, capture_output=True, text=True, timeout=180)
    except subprocess.TimeoutExpired:
        return {**receipt, "provider_request_sent": True, "status": "failed", "text": "", "reason": "transcription request timed out"}

    receipt["provider_request_sent"] = True

    if result.returncode != 0:
        return {
            **receipt,
            "status": "failed",
            "text": "",
            "reason": compact_text(result.stderr or result.stdout, 500),
        }

    try:
        payload = json.loads(result.stdout)
    except json.JSONDecodeError:
        return {**receipt, "status": "failed", "text": "", "reason": compact_text(result.stdout, 500)}

    if not isinstance(payload, dict):
        return {**receipt, "status": "failed", "text": "", "reason": "transcription response must be a JSON object"}

    if "error" in payload:
        return {**receipt, "status": "failed", "text": "", "reason": compact_text(json.dumps(payload["error"]), 500)}

    text = payload.get("text")
    if not isinstance(text, str):
        return {**receipt, "status": "failed", "text": "", "reason": "transcription response is missing string text"}
    return {**receipt, "status": "ok", "text": text, "raw": payload}


def should_retry_transcription_in_chunks(transcript: dict[str, Any]) -> bool:
    reason = str(transcript.get("reason") or "")
    return transcript.get("status") == "failed" and (
        "input_too_large" in reason or "too large" in reason.lower() or "maximum context" in reason.lower()
    )


def transcribe_media_chunks(
    media_path: Path | None,
    model: str,
    chunks_dir: Path,
    duration: float,
    egress_authorization: str = "missing",
    chunk_seconds: int = 420,
) -> dict[str, Any]:
    if egress_authorization != "explicit-cli-flag":
        return transcribe_media(media_path, model, egress_authorization)
    if not media_path or not media_path.exists():
        return {
            "status": "missing",
            "text": "",
            "transcription_egress_authorization": egress_authorization,
            "provider": "openai-audio-transcriptions",
            "provider_request_sent": False,
        }
    if not shutil.which("ffmpeg"):
        return {
            "status": "failed",
            "text": "",
            "reason": "ffmpeg is not installed; cannot chunk media",
            "transcription_egress_authorization": egress_authorization,
            "provider": "openai-audio-transcriptions",
            "provider_request_sent": False,
        }
    if not duration or duration <= 0:
        return {
            "status": "failed",
            "text": "",
            "reason": "media duration is unavailable; refusing partial chunk transcription",
            "degraded": True,
            "transcription_egress_authorization": egress_authorization,
            "provider": "openai-audio-transcriptions",
            "provider_request_sent": False,
        }

    chunks_dir.mkdir(parents=True, exist_ok=True)
    chunk_count = max(1, int((duration or chunk_seconds) // chunk_seconds) + (1 if duration % chunk_seconds else 0))
    transcripts: list[str] = []
    chunk_results: list[dict[str, Any]] = []

    for index in range(chunk_count):
        start = index * chunk_seconds
        if duration and start >= duration:
            break
        chunk_path = chunks_dir / f"audio-chunk-{index + 1:03d}-{start}s.mp3"
        extract_command = [
            "ffmpeg",
            "-y",
            "-ss",
            str(start),
            "-t",
            str(chunk_seconds),
            "-i",
            str(media_path),
            "-vn",
            "-ac",
            "1",
            "-ar",
            "16000",
            "-b:a",
            "64k",
            str(chunk_path),
        ]
        try:
            extract = subprocess.run(extract_command, capture_output=True, text=True, timeout=180)
        except subprocess.TimeoutExpired:
            chunk_results.append({
                "chunk": index + 1,
                "start_seconds": start,
                "status": "failed",
                "reason": "ffmpeg chunk extraction timed out",
            })
            continue
        if extract.returncode != 0 or not chunk_path.exists():
            chunk_results.append(
                {
                    "chunk": index + 1,
                    "start_seconds": start,
                    "status": "failed",
                    "reason": compact_text(extract.stderr or extract.stdout, 500),
                }
            )
            continue

        chunk_transcript = transcribe_media(chunk_path, model, egress_authorization)
        chunk_results.append(
            {
                "chunk": index + 1,
                "start_seconds": start,
                "path": str(chunk_path),
                "status": chunk_transcript.get("status"),
                "reason": chunk_transcript.get("reason"),
                "provider_request_sent": chunk_transcript.get("provider_request_sent", False),
            }
        )
        if chunk_transcript.get("text"):
            transcripts.append(f"[{format_time(start)}]\n{chunk_transcript['text'].strip()}")

    covered = []
    missing = []
    for chunk in chunk_results:
        chunk["end_seconds"] = min(chunk["start_seconds"] + chunk_seconds, duration)
        interval = {"start_seconds": chunk["start_seconds"], "end_seconds": chunk["end_seconds"]}
        (covered if chunk["status"] == "ok" else missing).append(interval)
    status = "ok" if not missing else ("partial" if covered else "failed")
    return {
        "status": status,
        "text": "\n\n".join(transcripts),
        "degraded": bool(missing),
        "transcription_egress_authorization": egress_authorization,
        "provider": "openai-audio-transcriptions",
        "provider_request_sent": any(chunk.get("provider_request_sent") is True for chunk in chunk_results),
        "reason": "One or more chunks are unavailable" if missing else None,
        "source": "chunked_media",
        "chunk_seconds": chunk_seconds,
        "covered_intervals": covered,
        "missing_intervals": missing,
        "chunks": chunk_results,
    }


def transcribe_with_fallback(media_path: Path | None, model: str, chunks_dir: Path, duration: float) -> dict[str, Any]:
    initial = transcribe_media(media_path, model, "explicit-cli-flag")
    results = [initial]
    if should_retry_transcription_in_chunks(initial):
        results.append(transcribe_media_chunks(media_path, model, chunks_dir, duration, "explicit-cli-flag"))
    # A fallback cannot erase a previous request attempt. Keep compact receipts,
    # not duplicate raw provider payloads or transcript bodies.
    final = dict(results[-1])
    fields = ("status", "reason", "provider", "transcription_egress_authorization", "provider_request_sent", "covered_intervals", "missing_intervals", "chunks")
    final["attempts"] = [{key: result[key] for key in fields if key in result} for result in results]
    final["provider_request_sent"] = any(result.get("provider_request_sent") is True for result in results)
    if final.get("status") != "ok" and "missing_intervals" not in final and duration > 0:
        final.update(covered_intervals=[], missing_intervals=[{"start_seconds": 0, "end_seconds": duration}], degraded=True)
    return final


def transcript_coverage_note(transcript: dict[str, Any]) -> str:
    return (f"Transcript status: {transcript.get('status', 'unknown')}. "
            f"Missing intervals (seconds): {json.dumps(transcript.get('missing_intervals', 'unknown'))}. "
            "Unavailable intervals cannot support absence-of-problem claims.")


def select_moments(
    events: list[dict[str, Any]],
    transcript: str,
    duration: float,
    max_moments: int | None,
) -> list[dict[str, Any]]:
    if max_moments == 0:
        return []
    candidates: list[dict[str, Any]] = []
    clicks_by_target: defaultdict[str, list[dict[str, Any]]] = defaultdict(list)
    has_complaint = transcript_has_complaint(transcript)

    for event in events:
        event_type = event.get("type")
        t = event_time(event)
        if event_type == "click":
            element = event.get("element") or {}
            key = element.get("id") or element.get("selector") or element.get("text") or "unknown"
            clicks_by_target[str(key)].append(event)
            reason = "click event"
            if has_complaint and duration and t >= duration * 0.55:
                reason = "late-session click near complaint transcript"
            candidates.append({"t": t, "reason": reason, "events": [event]})
        elif event_type == "network_request":
            status = event.get("status")
            try:
                failed = int(status) >= 400
            except (TypeError, ValueError):
                failed = False
            if failed and not network_is_noise(event):
                candidates.append({"t": t, "reason": f"failed network request ({status})", "events": [event]})
        elif event_type in {"console_error", "error", "exception"}:
            candidates.append({"t": t, "reason": f"{event_type} event", "events": [event]})

    for grouped in clicks_by_target.values():
        if len(grouped) >= 2:
            first = grouped[0]
            last = grouped[-1]
            if event_time(last) - event_time(first) <= 8:
                candidates.append(
                    {
                        "t": event_time(last),
                        "reason": "repeated clicks on the same target",
                        "events": grouped[:4],
                    }
                )

    if has_complaint and duration and not candidates:
        for fraction in (0.35, 0.55, 0.75, 0.9):
            candidates.append({"t": max(0.0, duration * fraction), "reason": "representative frame for complaint transcript", "events": []})

    if duration and not candidates:
        fractions = (0.1, 0.3, 0.5, 0.7, 0.9)
        for fraction in fractions[:len(fractions) if max_moments is None else max(0, min(max_moments, len(fractions)))]:
            candidates.append({"t": max(0.0, duration * fraction), "reason": "representative video frame", "events": []})

    candidates.sort(key=lambda item: (item["t"], item["reason"]))
    deduped: list[dict[str, Any]] = []
    for candidate in candidates:
        if candidate["t"] < 0:
            continue
        if any(abs(candidate["t"] - existing["t"]) < 0.45 and candidate["reason"] == existing["reason"] for existing in deduped):
            continue
        deduped.append(candidate)
        if max_moments is not None and len(deduped) >= max_moments:
            break

    for index, moment in enumerate(deduped, start=1):
        moment["id"] = f"M{index}"
    return deduped


def populate_frames(recording_path: Path | None, frames_dir: Path, moments: list[dict[str, Any]]) -> None:
    frames_dir.mkdir(parents=True, exist_ok=True)
    if not recording_path or not recording_path.exists():
        for moment in moments:
            moment["screenshot"] = None
            moment["screenshot_status"] = "no video source"
        return
    if not shutil.which("ffmpeg"):
        for moment in moments:
            moment["screenshot"] = None
            moment["screenshot_status"] = "ffmpeg not installed"
        return

    for moment in moments:
        safe_reason = slugify(moment["reason"])[:48]
        frame_path = frames_dir / f"{moment['id'].lower()}-{moment['t']:.2f}s-{safe_reason}.png"
        command = [
            "ffmpeg",
            "-y",
            "-ss",
            f"{max(0.0, float(moment['t'])):.3f}",
            "-i",
            str(recording_path),
            "-frames:v",
            "1",
            "-q:v",
            "2",
            str(frame_path),
        ]
        try:
            result = subprocess.run(command, capture_output=True, text=True, timeout=60)
        except subprocess.TimeoutExpired:
            frame_path.unlink(missing_ok=True)
            moment["screenshot"] = None
            moment["screenshot_status"] = "ffmpeg frame extraction timed out"
            continue
        if result.returncode == 0 and frame_path.exists():
            moment["screenshot"] = str(frame_path)
            moment["screenshot_status"] = "ok"
        else:
            frame_path.unlink(missing_ok=True)
            moment["screenshot"] = None
            moment["screenshot_status"] = compact_text(result.stderr or result.stdout, 300)


def extract_frames(recording_path: Path | None, frames_dir: Path, moments: list[dict[str, Any]]) -> None:
    validate_snapshot_destination(frames_dir)
    frames_dir.parent.mkdir(parents=True, exist_ok=True)
    staging = Path(tempfile.mkdtemp(prefix=f".{frames_dir.name}.staging-", dir=frames_dir.parent))
    try:
        populate_frames(recording_path, staging, moments)
        promote_snapshot(staging, frames_dir)
    except BaseException:
        if staging.exists() and not staging.is_symlink():
            shutil.rmtree(staging, ignore_errors=True)
        raise
    for moment in moments:
        if moment.get("screenshot"):
            moment["screenshot"] = str(frames_dir / Path(moment["screenshot"]).relative_to(staging))


def event_counts(events: list[dict[str, Any]]) -> dict[str, int]:
    return dict(Counter(str(event.get("type", "unknown")) for event in events))


def summarize_candidate_findings(moments: list[dict[str, Any]], transcript: str) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    complaint_moments = [moment for moment in moments if "complaint" in moment.get("reason", "")]
    repeated_clicks = [moment for moment in moments if "repeated clicks" in moment.get("reason", "")]
    failed_requests = [moment for moment in moments if "failed network" in moment.get("reason", "")]

    if transcript_has_complaint(transcript):
        evidence_ids = [moment["id"] for moment in complaint_moments] or [moment["id"] for moment in moments[-3:]]
        findings.append(
            {
                "id": "F1",
                "title": "User reported a control that felt weird or unclickable",
                "severity": "P2",
                "observed": "Transcript or notes contain a complaint cue. Review linked moments when available and use the text to identify the affected product behavior.",
                "expected": "The affected product behavior should either work as presented or clearly explain why it is unavailable.",
                "evidence": evidence_ids,
                "confidence": "Medium until screenshots are reviewed",
            }
        )

    if repeated_clicks:
        findings.append(
            {
                "id": f"F{len(findings) + 1}",
                "title": "Repeated interaction may indicate missing feedback or a dead control",
                "severity": "P2",
                "observed": "The same target was clicked more than once within a short interval.",
                "expected": "Repeated clicks should not be needed; the UI should respond once or show a clear disabled/error state.",
                "evidence": [moment["id"] for moment in repeated_clicks],
                "confidence": "Medium",
            }
        )

    if failed_requests:
        findings.append(
            {
                "id": f"F{len(findings) + 1}",
                "title": "User-visible flow coincided with failed network requests",
                "severity": "P2",
                "observed": "One or more non-noisy network requests returned a failure status.",
                "expected": "Failures should be handled with durable user feedback and recoverable behavior.",
                "evidence": [moment["id"] for moment in failed_requests],
                "confidence": "High for request failure, medium for user impact until screenshots are reviewed",
            }
        )

    console_errors = [moment for moment in moments if moment.get("reason") in {"console_error event", "error event", "exception event"}]
    if console_errors:
        findings.append({
            "id": f"F{len(findings) + 1}",
            "title": "Console or exception events were recorded",
            "severity": "Unassessed",
            "observed": "The event log contains console_error, error, or exception events; user impact is unconfirmed.",
            "expected": "Review the raw event and surrounding behavior before proposing a product requirement.",
            "evidence": [moment["id"] for moment in console_errors],
            "confidence": "Confirmed event presence; product impact unknown",
        })
    return findings


def markdown_link(path: str | None, output_dir: Path, repo_root: Path) -> str:
    if not path:
        return "n/a"
    path_obj = Path(path)
    if path_obj.exists():
        return repo_relative(path_obj, repo_root)
    return path


def safe_write_text(path: Path, text: str) -> None:
    """Write text without following a pre-existing symlink or special file at the target.

    A pre-existing non-regular file (e.g., a symlink planted at a report path) is
    rejected instead of being written through; the payload lands via a fresh
    temporary file in the same directory and an atomic directory-entry replace.
    """

    if path.exists() or path.is_symlink():
        if not stat.S_ISREG(path.lstat().st_mode):
            raise SystemExit(f"refusing to write report through non-regular file: {path}")
    fd, tmp_name = tempfile.mkstemp(dir=str(path.parent), prefix=f".{path.name}.", suffix=".tmp")
    tmp_path = Path(tmp_name)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            handle.write(text)
        os.replace(tmp_path, path)
    except BaseException:
        tmp_path.unlink(missing_ok=True)
        raise


def write_analysis_md(
    output_path: Path,
    source_path: Path,
    source_kind: str,
    session: dict[str, Any],
    events: list[dict[str, Any]],
    transcript: dict[str, Any],
    moments: list[dict[str, Any]],
    findings: list[dict[str, Any]],
    repo_root: Path,
    event_moments: list[dict[str, Any]] | None = None,
) -> None:
    lines: list[str] = []
    lines.append("# Product Feedback Analysis")
    lines.append("")
    lines.append("## Source")
    lines.append("")
    lines.append(f"- Source: `{source_path}`")
    lines.append(f"- Source kind: `{source_kind}`")
    lines.append(f"- URL: `{session.get('url', 'unknown')}`")
    lines.append(f"- Started: `{session.get('started_at', 'unknown')}`")
    lines.append(f"- Duration: `{session.get('duration_seconds', 'unknown')}` seconds")
    lines.append(f"- Browser: `{session.get('browser', 'unknown')}`")
    lines.append(f"- Event counts: `{event_counts(events)}`")
    lines.append("")
    lines.append("## Transcript")
    lines.append("")
    lines.append(transcript_coverage_note(transcript))
    lines.append("")
    if transcript.get("text"):
        lines.append(transcript["text"].strip())
    else:
        lines.append(f"_Transcript unavailable: {transcript.get('reason') or transcript.get('status', 'unknown')}._")
    lines.append("")
    lines.append("## Selected Moments")
    lines.append("")
    if moments:
        lines.append("| ID | Time | Why selected | Screenshot | Event evidence |")
        lines.append("|---|---:|---|---|---|")
        for moment in moments:
            screenshot = markdown_link(moment.get("screenshot"), output_path.parent, repo_root)
            evidence = "<br>".join(compact_text(event_label(event), 140) for event in moment.get("events", [])) or "n/a"
            lines.append(
                f"| {moment['id']} | {format_time(moment['t'])} | {moment['reason']} | `{screenshot}` | {evidence} |"
            )
    else:
        lines.append("_No video moments available for this source._")
    lines.append("")
    lines.append("## Event Facts Beyond the Screenshot Budget")
    lines.append("")
    selected_ids = {moment["id"] for moment in moments}
    for moment in event_moments or []:
        if moment["id"] not in selected_ids:
            labels = "; ".join(event_label(event) for event in moment.get("events", []))
            lines.append(f"- {moment['id']} at {format_time(moment['t'])}: {moment['reason']}. {labels}. Screenshot not selected.")
    lines.append("The screenshot limit does not limit event-log analysis. Automated candidates do not establish product impact or an exhaustive review.")
    lines.append("")
    lines.append("## Candidate Findings")
    lines.append("")
    if not findings:
        lines.append("No candidate finding was produced by the automated checks. Product impact remains unassessed; this is not evidence of no problems.")
    for finding in findings:
        lines.append(f"### {finding['id']}. {finding['title']}")
        lines.append("")
        lines.append(f"- **Severity:** {finding['severity']}")
        lines.append(f"- **Observed:** {finding['observed']}")
        lines.append(f"- **Expected:** {finding['expected']}")
        lines.append(f"- **Evidence:** {', '.join(finding['evidence'])}")
        lines.append(f"- **Confidence:** {finding['confidence']}")
        lines.append("")
    lines.append("## Human Review Checklist")
    lines.append("")
    lines.append("- Open each selected screenshot and name the exact visible control or state.")
    lines.append("- Tie transcript language to the closest click or visible UI state.")
    lines.append("- Promote only confirmed product problems into requirements.")
    lines.append("- Use repo-relative screenshot paths when moving evidence into a spec-first requirements document.")
    safe_write_text(output_path, "\n".join(lines) + "\n")


def write_requirements_kickoff(
    output_path: Path,
    topic: str,
    session: dict[str, Any],
    findings: list[dict[str, Any]],
    moments: list[dict[str, Any]],
    repo_root: Path,
) -> None:
    title = topic.replace("-", " ").title()
    date = datetime.now(timezone.utc).date().isoformat()
    primary_evidence = ", ".join(finding["id"] for finding in findings)
    screenshot_refs = []
    for moment in moments:
        if moment.get("screenshot"):
            screenshot_refs.append(f"{moment['id']}: `{markdown_link(moment['screenshot'], output_path.parent, repo_root)}`")
    evidence_text = "; ".join(screenshot_refs[:6]) or "See analysis.md selected moments."
    source_materials = markdown_link(str(output_path.parent / "source-materials.md"), output_path.parent, repo_root)
    analysis_path = markdown_link(str(output_path.parent / "analysis.md"), output_path.parent, repo_root)
    problem_analysis_path = markdown_link(str(output_path.parent / "problem-analysis.md"), output_path.parent, repo_root)
    review_prompt_path = markdown_link(str(output_path.parent / "review-prompt.md"), output_path.parent, repo_root)

    lines = [
        "---",
        f"date: {date}",
        f"topic: {topic}",
        "---",
        "",
        f"# {title}",
        "",
        "## Problem Frame",
        "",
        f"A product feedback source for `{session.get('url', 'the product surface')}` is available for assessment. Product friction is not yet confirmed. The raw source has been converted into transcript, selected moments when video is available, screenshots when frames can be extracted, and candidate findings so the team can decide what product behavior should change before planning implementation.",
        "",
        "Source materials for brainstorm:",
        f"- Source materials manifest: `{source_materials}`",
        f"- Analysis: `{analysis_path}`",
        f"- Problem analysis: `{problem_analysis_path}`",
        f"- Review prompt with transcript and frames: `{review_prompt_path}`",
        "",
        "---",
        "",
        "## Actors",
        "",
        "- A1. User: Operates the product in the recorded session and verbalizes friction.",
        "- A2. Product surface: The UI and backend behavior visible in the recording.",
        "- A3. Brainstorm agent: Uses the evidence bundle to confirm, correct, and group requirements before planning.",
        "",
        "---",
        "",
        "## Key Flows",
        "",
        "- F1. Evidence-backed feedback triage",
        "  - **Trigger:** A feedback bundle, video, audio file, or meeting notes file is available.",
        "  - **Actors:** A1, A2, A3",
        "  - **Steps:** Extract or copy the source, transcribe media or read notes, select high-signal moments when video exists, inspect screenshots when available, confirm problems, and write requirements with supporting evidence.",
        "  - **Outcome:** Confirmed product problems are represented as requirements with transcript support and screenshot support when visual evidence exists.",
        "  - **Covered by:** R1, R2 (evidence handling only)",
        "",
        "---",
        "",
        "## Requirements",
        "",
        "**Evidence handling**",
        "- R1. Each confirmed product problem must cite supporting transcript, notes, or moment evidence from the source, including timestamp and screenshot when video is available.",
        "- R2. Transcript claims must be tied to the closest visible interaction or explicitly marked as untimed verbal context.",
        "",
        "**Product requirements from this session**",
    ]

    lines.append("No confirmed product requirements. Candidate findings require source review and owner confirmation before promotion.")
    for finding in findings:
        lines.append(f"- Candidate {finding['id']}: {finding['title']}. Confirm impact and expected behavior before drafting a requirement.")

    lines.extend(
        [
            "",
            "---",
            "",
            "## Acceptance Examples",
            "",
            "- AE1. **Covers R1, R2.** Given a feedback source with voice, video, or notes, when the analysis is complete, each promoted issue includes source evidence rather than prose-only claims.",
            "- Product acceptance examples are pending confirmed requirements; do not invent a control or expected behavior from this scaffold.",
            "",
            "---",
            "",
            "## Success Criteria",
            "",
            "- A human reviewer can understand what went wrong without rewatching the entire recording.",
            "- `spec-brainstorm` can confirm requirements from linked source evidence before any planning begins.",
            "",
            "---",
            "",
            "## Scope Boundaries",
            "",
            "- The analyzer output is evidence and requirements kickoff material, not final implementation design.",
            "- Automatically detected findings remain candidates until screenshots are inspected.",
            "- Development-only noise, such as profiler requests, should not become product requirements unless it affects the user experience.",
            "",
            "---",
            "",
            "## Key Decisions",
            "",
            "- Evidence first: Requirements should cite moments and screenshots before moving to planning.",
            "- Brainstorm before plan: Use `spec-brainstorm` to refine product behavior when the recording reveals ambiguity.",
            "",
            "---",
            "",
            "## Dependencies / Assumptions",
            "",
            f"- Source session URL: `{session.get('url', 'unknown')}`.",
            f"- Source materials manifest: `{source_materials}`.",
            f"- Candidate findings: {primary_evidence}.",
            f"- Screenshot evidence: {evidence_text}.",
            "",
            "---",
            "",
            "## Outstanding Questions",
            "",
            "### Resolve Before Planning",
            "",
            "- Which candidate findings are real product problems after screenshot review?",
            "- For each promoted finding, what should the user experience be instead?",
            "",
            "### Deferred to Planning",
            "",
            "- [Technical] Which code paths own the confirmed product behavior?",
            "- [Technical] What regression tests should lock the behavior once fixed?",
            "",
            "---",
            "",
            "## Next Steps",
            "",
            "-> Resume `spec-brainstorm` to confirm candidate findings and promote only confirmed product-specific requirements.",
        ]
    )
    safe_write_text(output_path, "\n".join(lines) + "\n")


def write_source_materials(
    output_path: Path,
    source_path: Path,
    source_kind: str,
    session: dict[str, Any],
    transcript: dict[str, Any],
    moments: list[dict[str, Any]],
    raw_dir: Path,
    frames_dir: Path,
    repo_root: Path,
) -> None:
    def link(path: Path) -> str:
        return markdown_link(str(path), output_path.parent, repo_root)

    raw_files = sorted(path for path in raw_dir.rglob("*") if path.is_file())
    frame_files = sorted(path for path in frames_dir.rglob("*.png") if path.is_file())
    chunk_files = sorted((raw_dir / "transcription_chunks").glob("*")) if (raw_dir / "transcription_chunks").is_dir() else []

    copied_source = next((path for path in raw_files if path.name == source_path.name), None)
    if not copied_source:
        copied_source = raw_dir / "recording.webm" if (raw_dir / "recording.webm").exists() else None

    lines = [
        "# Source Materials",
        "",
        "Use this manifest during brainstorm so requirements can be traced back to the raw feedback evidence.",
        "",
        "## Original Source",
        "",
        f"- Source kind: `{source_kind}`",
        f"- Original path: `{source_path}`",
        f"- Local raw copy: `{link(copied_source) if copied_source else 'n/a'}`",
        "- Commit policy: raw media, audio chunks, zip contents, session dumps, and extracted screenshots are local-only by default; commit generated Markdown/JSON/manifests when useful for brainstorm/planning traceability.",
        f"- Session URL: `{session.get('url', 'unknown')}`",
        f"- Duration: `{session.get('duration_seconds', 'unknown')}` seconds",
        "",
        "## Analysis Artifacts",
        "",
        f"- Analysis summary: `{link(output_path.parent / 'analysis.md')}`",
        f"- Problem statements: `{link(output_path.parent / 'problem-analysis.md')}`",
        f"- Review prompt: `{link(output_path.parent / 'review-prompt.md')}`",
        f"- Requirements kickoff: `{link(output_path.parent / 'requirements-kickoff.md')}`",
        f"- Structured JSON: `{link(output_path.parent / 'analysis.json')}`",
        "",
        "## Transcript",
        "",
        f"- Transcript status: `{transcript.get('status', 'unknown')}`",
        f"- Transcript source: `{transcript.get('source', source_kind)}`",
        f"- Transcript text lives in: `{link(output_path.parent / 'analysis.md')}` and `{link(output_path.parent / 'review-prompt.md')}`",
    ]

    if chunk_files:
        lines.append("- Transcription chunks:")
        lines.append(f"  - retained locally in `{link(raw_dir / 'transcription_chunks')}`; not commit-safe by default.")

    lines.extend(["", "## Local-Only Frames", ""])
    lines.append("Extracted screenshots are retained locally for agent inspection and should not be committed by default.")
    lines.append("")
    if moments:
        lines.append("| Moment | Time | Screenshot | Why selected |")
        lines.append("|---|---:|---|---|")
        for moment in moments:
            screenshot = moment.get("screenshot")
            lines.append(
                f"| {moment['id']} | {format_time(moment['t'])} | `{markdown_link(screenshot, output_path.parent, repo_root)}` | {moment['reason']} |"
            )
    else:
        lines.append("_No video frames were available for this source._")

    if frame_files:
        lines.extend(["", "All frame files:"])
        for frame in frame_files:
            lines.append(f"- `{link(frame)}`")

    lines.extend(["", "## Local Raw Files", ""])
    lines.append("Raw files are intentionally local-only by default. Do not commit these unless the user explicitly asks and privacy/security is acceptable.")
    lines.append("")
    for raw_file in raw_files[:50]:
        lines.append(f"- `{link(raw_file)}`")
    if len(raw_files) > 50:
        lines.append(f"- ... {len(raw_files) - 50} more files")

    safe_write_text(output_path, "\n".join(lines) + "\n")


def write_problem_analysis(
    output_path: Path,
    transcript: dict[str, Any],
    moments: list[dict[str, Any]],
    findings: list[dict[str, Any]],
    repo_root: Path,
) -> None:
    complaint_text = transcript.get("text") or ""
    lines = [
        "<analysis>",
        transcript_coverage_note(transcript),
        "Read analysis.md for full event facts beyond the screenshot budget.",
        "## 1. Visual/UI Problems",
        "",
    ]
    if moments:
        lines.extend(
            [
                "1. Review required: inspect the extracted frames and replace this scaffold with precise visual observations. Include location, UI element type, issue description, and frame reference.",
                "",
            ]
        )
    else:
        lines.extend(["1. No video frames were available for this source.", ""])

    lines.extend(["## 2. Functional Problems", ""])

    for index, finding in enumerate(findings, start=1):
        evidence = ", ".join(finding.get("evidence", [])) or "n/a"
        lines.append(
            f"{index}. {finding['title']}: {finding['observed']} Evidence: {evidence}. Context from discussion: {compact_text(complaint_text, 220) or 'n/a'}"
        )
    if not findings:
        lines.append("1. No functional problems were detected automatically; inspect transcript and frames manually.")

    lines.extend(
        [
            "",
            "## 3. Requirements",
            "",
            "1. Convert confirmed problems into requirements after evidence review. State what capability or behavior is needed and why, without prescribing implementation.",
            "",
            "## 4. Usability/UX Problems",
            "",
        ]
    )

    for index, moment in enumerate(moments, start=1):
        screenshot = markdown_link(moment.get("screenshot"), output_path.parent, repo_root)
        lines.append(
            f"{index}. Moment {moment['id']} at {format_time(moment['t'])}: Review `{screenshot}` for UX friction related to `{moment['reason']}`."
        )
    if not moments:
        lines.append("1. Review the transcript or notes for workflow friction, confusion, and unmet expectations.")

    lines.append("</analysis>")
    safe_write_text(output_path, "\n".join(lines) + "\n")


def write_review_prompt(
    output_path: Path,
    transcript: dict[str, Any],
    moments: list[dict[str, Any]],
    repo_root: Path,
) -> None:
    frame_lines: list[str] = []
    for moment in moments:
        screenshot = markdown_link(moment.get("screenshot"), output_path.parent, repo_root)
        event_summary = "; ".join(event_label(event) for event in moment.get("events", [])) or "no event metadata"
        frame_lines.append(
            f"- {moment['id']} ({format_time(moment['t'])}, {moment['reason']}): `{screenshot}`. Events: {event_summary}"
        )
    if not frame_lines:
        frame_lines.append("- No video frames are available for this source. Analyze transcript or meeting notes only.")

    lines = [
        "You will be analyzing a product feedback session by examining video frames and a discussion transcript. Your goal is to identify problems, requirements, and feedback points that need to be addressed - focusing on clear problem statements rather than solutions.",
        "",
        "Here are the frames extracted from the video:",
        "",
        "<video_frames>",
        *frame_lines,
        "</video_frames>",
        "",
        "Here is the transcript of the discussion that occurred during the feedback session:",
        "",
        transcript_coverage_note(transcript),
        "Read analysis.md for full event facts beyond the screenshot budget; do not infer absence from selected frames.",
        "<discussion_transcript>",
        transcript.get("text") or f"[Transcript unavailable: {transcript.get('reason') or transcript.get('status', 'unknown')}]",
        "</discussion_transcript>",
        "",
        "Your task is to carefully analyze both the visual content and the discussion to extract actionable problem statements. Follow these guidelines:",
        "",
        "**Visual Analysis Requirements:**",
        "- Examine each frame carefully for UI/UX issues, bugs, design inconsistencies, or usability problems",
        "- Be extremely precise about what you observe: specify exact locations (e.g., \"top-right corner,\" \"navigation bar,\" \"third item in the list\")",
        "- Identify specific UI elements by type (button, input field, dropdown, modal, etc.)",
        "- Note visual problems like misalignment, poor contrast, truncated text, overlapping elements, broken layouts, etc.",
        "",
        "**Discussion Analysis Requirements:**",
        "- Extract feedback points, feature requests, and problems mentioned in the conversation",
        "- Identify requirements that are stated or implied",
        "- Note any pain points or frustrations expressed by participants",
        "- Connect visual observations with relevant discussion points when applicable",
        "",
        "**Problem Statement Guidelines:**",
        "- Focus on describing WHAT the problem is, not HOW to fix it",
        "- Be specific and actionable - avoid vague statements",
        "- Each problem should be clear enough that a developer or designer can understand what needs to be addressed",
        "- Include context about where the problem occurs and why it matters",
        "",
        "Structure your final output as follows:",
        "",
        "1. **Visual/UI Problems**: Issues observed directly in the interface",
        "2. **Functional Problems**: Issues related to behavior, workflow, or functionality mentioned in discussion",
        "3. **Requirements**: New features or capabilities requested",
        "4. **Usability/UX Problems**: Issues related to user experience, confusion, or workflow friction",
        "",
        "Format each problem as a clear, numbered item within its category.",
        "",
        "Your final output should contain only the analysis section with clearly categorized, numbered problem statements. Do not include scratchpad notes.",
    ]
    safe_write_text(output_path, "\n".join(lines) + "\n")


def main() -> int:
    args = parse_args()
    source_path = args.source_path.expanduser().absolute()
    if not source_path.exists():
        print(f"Source file not found: {source_path}", file=sys.stderr)
        return 1

    output_dir = (args.output_dir or default_output_dir(source_path)).expanduser().resolve()
    try:
        classify_source(source_path)
        resolved_source = source_path.resolve()
        if resolved_source.is_relative_to(output_dir) or (
            source_path.is_dir() and output_dir.is_relative_to(resolved_source)
        ):
            raise SourceInputError("Source and output must not contain one another")
        validate_snapshot_destination(output_dir / "raw")
        validate_snapshot_destination(output_dir / "frames")
    except SourceInputError as error:
        print(f"Invalid source or output: {error}", file=sys.stderr)
        return 2
    output_dir.mkdir(parents=True, exist_ok=True)
    raw_dir = output_dir / "raw"
    frames_dir = output_dir / "frames"
    try:
        source = prepare_source(source_path, raw_dir)
    except SourceInputError as error:
        print(f"Invalid source: {error}", file=sys.stderr)
        return 2
    source_kind = source["source_kind"]
    session = source["session"]
    events = source["events"]
    duration = source["duration"]

    if source["notes_transcript"]:
        transcript = {
            **source["notes_transcript"],
            "transcription_egress_authorization": "not-applicable-local-notes",
            "provider": None,
            "provider_request_sent": False,
        }
    elif not args.transcribe:
        transcript = {
            "status": "skipped",
            "text": "",
            "reason": "Transcription egress was not authorized; use --transcribe to opt in.",
            "transcription_egress_authorization": "missing",
            "provider": "openai-audio-transcriptions",
            "provider_request_sent": False,
        }
    else:
        transcript = transcribe_with_fallback(source["transcription_path"], args.model, raw_dir / "transcription_chunks", duration)

    event_moments = select_moments(events, transcript.get("text", ""), duration, None)
    moments = event_moments[:args.max_moments]
    if not moments and source["recording_path"]:
        fallback_times = [0.5, 2.0, 5.0, 10.0, 15.0]
        moments = [
            {"id": f"M{index}", "t": timestamp, "reason": "representative video frame", "events": []}
            for index, timestamp in enumerate(fallback_times[: args.max_moments], start=1)
        ]
    try:
        extract_frames(source["recording_path"], frames_dir, moments)
    except SourceInputError as error:
        print(f"Invalid output: {error}", file=sys.stderr)
        return 2
    findings = summarize_candidate_findings(event_moments, transcript.get("text", ""))

    topic = slugify(args.topic or source_path.stem)
    repo_root = Path.cwd()
    analysis_md = output_dir / "analysis.md"
    problem_analysis_md = output_dir / "problem-analysis.md"
    review_prompt_md = output_dir / "review-prompt.md"
    source_materials_md = output_dir / "source-materials.md"
    kickoff_md = output_dir / "requirements-kickoff.md"
    write_analysis_md(analysis_md, source_path, source_kind, session, events, transcript, moments, findings, repo_root, event_moments)
    write_problem_analysis(problem_analysis_md, transcript, moments, findings, repo_root)
    write_review_prompt(review_prompt_md, transcript, moments, repo_root)
    write_source_materials(source_materials_md, source_path, source_kind, session, transcript, moments, raw_dir, frames_dir, repo_root)
    write_requirements_kickoff(kickoff_md, topic, session, findings, moments, repo_root)

    def source_digest(path: Path) -> str:
        hasher = hashlib.sha256()
        if path.is_file():
            hasher.update(path.read_bytes())
        else:
            for item in sorted(path.rglob("*")):
                hasher.update(str(item.relative_to(path)).encode("utf-8"))
                if item.is_file():
                    hasher.update(item.read_bytes())
        return hasher.hexdigest()

    batch_id = f"{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}-{os.urandom(4).hex()}"
    structured = {
        "source": str(source_path),
        "source_kind": source_kind,
        "source_sha256": source_digest(source_path),
        "analysis_batch_id": batch_id,
        "output_dir": str(output_dir),
        "session": session,
        "event_counts": event_counts(events),
        "transcript": transcript,
        "transcription_egress_receipt": {
            "transcription_egress_authorization": transcript.get("transcription_egress_authorization"),
            "provider": transcript.get("provider"),
            "provider_request_sent": transcript.get("provider_request_sent", False),
            "attempts": transcript.get("attempts", []),
        },
        "moments": moments,
        "event_moments": event_moments,
        "candidate_findings": findings,
        "artifacts": {
            "analysis_md": str(analysis_md),
            "problem_analysis_md": str(problem_analysis_md),
            "review_prompt_md": str(review_prompt_md),
            "source_materials_md": str(source_materials_md),
            "requirements_kickoff_md": str(kickoff_md),
            "frames_dir": str(frames_dir),
            "raw_dir": str(raw_dir),
        },
    }
    safe_write_text(output_dir / "analysis.json", json.dumps(structured, indent=2, sort_keys=True) + "\n")

    print(f"Analysis written to: {analysis_md}")
    print(f"Problem analysis scaffold written to: {problem_analysis_md}")
    print(f"Review prompt written to: {review_prompt_md}")
    print(f"Source materials manifest written to: {source_materials_md}")
    print(f"Requirements kickoff written to: {kickoff_md}")
    print(f"Frames written to: {frames_dir}")
    print("")
    print("Analysis complete. Ready-to-brainstorm handoff only.")
    print(f"Source materials: {display_path(source_materials_md, repo_root)}")
    print(f"Problem statements: {display_path(problem_analysis_md, repo_root)}")
    print(f"Brainstorm handoff: spec-brainstorm {display_path(kickoff_md, repo_root)}")
    print("Brainstorm should first confirm whether the captured requirements are complete and correctly grouped, then write the durable unified plan under docs/plans/.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
