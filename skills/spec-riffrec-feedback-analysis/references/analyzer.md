# Shared Analyzer

Read before quick or extensive analysis. Setup does not use the analyzer. Apply the entrypoint's Riffrec-only trigger, privacy, transcription egress, and dispatch boundaries.

Set `SKILL_DIR` to the absolute directory containing the loaded Skill in each independent call. The project's cwd is not the Skill's script directory. The bundled wrapper probes a runnable Python 3 interpreter in order: `python3`, `python`, then `py -3`; a name on PATH alone is insufficient.

Quick mode writes to a new temporary directory:

```bash
SKILL_DIR="<absolute directory containing spec-riffrec-feedback-analysis SKILL.md>"
bash "$SKILL_DIR/scripts/run-python.sh" "$SKILL_DIR/scripts/analyze_riffrec_zip.py" "/path/to/input" --no-transcribe --output-dir "$(mktemp -d -t riffrec-quick-XXXXXX)"
```

Extensive mode uses the script's default destination unless the user selected another directory:

```bash
SKILL_DIR="<absolute directory containing spec-riffrec-feedback-analysis SKILL.md>"
bash "$SKILL_DIR/scripts/run-python.sh" "$SKILL_DIR/scripts/analyze_riffrec_zip.py" "/path/to/input" --no-transcribe
```

Use `--output-dir` for an explicitly selected output location. The default is `docs/brainstorms/riffrec-feedback/<source-stem>` when `docs/brainstorms/` exists, otherwise `riffrec-feedback/<source-stem>`. Capture the printed paths; do not reconstruct output paths later.

Accepted inputs are a Riffrec ZIP, an unpacked capture directory containing `session.json` and `events.json`, or supported video/audio/notes explicitly identified as Riffrec feedback. Pass the directory rather than one media member to preserve synchronized events. Symlinks and special entries are rejected; source and output must not contain one another.

The analyzer replaces `raw/` and `frames/` snapshots so reruns cannot mix old media with new evidence. A run with no video or no ffmpeg still replaces the frames snapshot with an empty one and reports missing screenshots. Invalid input returns exit 2; stop dependent analysis and report the error. A failed snapshot promotion restores its prior destination. This is local snapshot recovery, not a transaction covering every final report.

Pass `--transcribe` instead of `--no-transcribe` only when `transcription_egress_authorization: authorized` covers this recording and provider transfer. Preserve the egress receipt. Ambient credentials do not grant consent. Do not commit raw media or frames without the entrypoint's explicit privacy authorization.
