#!/bin/bash

# Measurement Runner
# Runs a measurement command, captures JSON output, and handles timeouts.
# The orchestrating agent (not this script) evaluates gates and handles
# stability repeats.
#
# Usage: measure.sh <command> <timeout_seconds> [working_directory] [KEY=VALUE ...]
#
# Arguments:
#   command          - Shell command to run (e.g., "python evaluate.py")
#   timeout_seconds  - Maximum seconds before killing the command
#   working_directory - Directory to run the command in (default: .)
#   KEY=VALUE        - Optional environment variables to set before running
#
# Output:
#   stdout: Raw JSON output from the measurement command
#   stderr: Passed through from the measurement command
#   exit code: Same as the command; 124 for timeout, 125 plus the runner marker
#              when SPEC_OPTIMIZE_CENSOR_AFTER fires before the hard timeout.

set -euo pipefail

resolve_python() {
  local candidate
  for candidate in python3 python; do
    if command -v "$candidate" >/dev/null 2>&1 && "$candidate" -c 'import sys; raise SystemExit(0 if sys.version_info.major == 3 else 1)' >/dev/null 2>&1; then
      PYTHON_CMD=("$candidate")
      return 0
    fi
  done
  if command -v py >/dev/null 2>&1 && py -3 -c 'import sys; raise SystemExit(0 if sys.version_info.major == 3 else 1)' >/dev/null 2>&1; then
    PYTHON_CMD=(py -3)
    return 0
  fi
  return 1
}

# Parse arguments
COMMAND="${1:?Error: command argument required}"
TIMEOUT="${2:?Error: timeout_seconds argument required}"
shift 2

WORKDIR="."
if [[ $# -gt 0 ]] && [[ "$1" != *=* ]]; then
  WORKDIR="$1"
  shift
fi

# Set any KEY=VALUE environment variables
for arg in "$@"; do
  if [[ "$arg" == *=* ]]; then
    export "$arg"
  fi
done

# Change to working directory
cd "$WORKDIR" || {
  echo "Error: cannot cd to $WORKDIR" >&2
  exit 1
}

run_timed_command() {
  local timeout_bin="$1"
  if [[ -n "$CENSOR_STATUS_FILE" ]]; then
    "$timeout_bin" -k 5 "$TIMEOUT" bash -c 'bash -c "$1"; printf "%s\n" "$?" > "$2"; exit 0' _ "$COMMAND" "$CENSOR_STATUS_FILE"
    return
  fi
  "$timeout_bin" -k 5 "$TIMEOUT" bash -c "$COMMAND"
}

run_with_timeout() {
  if command -v timeout >/dev/null 2>&1; then
    run_timed_command timeout
    return
  fi

  if command -v gtimeout >/dev/null 2>&1; then
    run_timed_command gtimeout
    return
  fi

  if resolve_python; then
    "${PYTHON_CMD[@]}" - "$TIMEOUT" "$COMMAND" "$CENSOR_STATUS_FILE" <<'PY'
import os
import signal
import subprocess
import sys

timeout_seconds = float(sys.argv[1])
command = sys.argv[2]
status_file = sys.argv[3]
proc = subprocess.Popen(["bash", "-c", command], start_new_session=True)

try:
    status = proc.wait(timeout=timeout_seconds)
    status = 128 - status if status < 0 else status
    if status_file:
        with open(status_file, "w", encoding="utf-8") as handle:
            handle.write(f"{status}\n")
        sys.exit(0)
    sys.exit(status)
except subprocess.TimeoutExpired:
    try:
        os.killpg(proc.pid, signal.SIGTERM)
    except ProcessLookupError:
        pass
    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        try:
            os.killpg(proc.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
        proc.wait()
    sys.exit(124)
PY
    return
  fi

  echo "Error: no timeout implementation available (tried timeout, gtimeout, python3, python, py -3)" >&2
  exit 1
}

# The owner must establish futility for every required objective before setting
# this bound. A command's own 124/125 exit is not a runner censor event.
CENSOR_AFTER="${SPEC_OPTIMIZE_CENSOR_AFTER:-}"
CENSOR_STATUS_FILE=""
if [[ -n "$CENSOR_AFTER" ]]; then
  if ! awk -v a="$CENSOR_AFTER" -v t="$TIMEOUT" 'BEGIN { exit !(a ~ /^[0-9]+(\.[0-9]+)?$/ && a+0 > 0 && a+0 < t+0) }'; then
    echo "Error: SPEC_OPTIMIZE_CENSOR_AFTER must be positive and below timeout_seconds" >&2
    exit 1
  fi
  TIMEOUT="$CENSOR_AFTER"
  CENSOR_STATUS_FILE=$(mktemp "${TMPDIR:-/tmp}/spec-optimize-censor-XXXXXX")
  trap 'rm -f "$CENSOR_STATUS_FILE"' EXIT
fi

set +e
run_with_timeout
status=$?
set -e
if [[ -n "$CENSOR_STATUS_FILE" ]]; then
  if [[ -s "$CENSOR_STATUS_FILE" ]]; then
    status=$(<"$CENSOR_STATUS_FILE")
  elif [[ $status -eq 124 ]]; then
    echo "SPEC_OPTIMIZE_CENSORED: measurement censored after ${CENSOR_AFTER}s (noncompetitive bound)" >&2
    exit 125
  fi
fi
exit "$status"
