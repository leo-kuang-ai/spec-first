#!/bin/bash
# autoresearch orchestrator — deterministic seam.
#
# Ownership: goal classification, next-hop routing, units reporting, plateau
# detection, command safety screening (incl. anchored DB-URL allowlist),
# orchestrator-state validation, and the final run verdict. Routing semantics
# are documented in references/orchestrator-routing.md; this script is the
# authoritative implementation, the reference is documentation.
#
# Usage:
#   orchestrate.sh classify "<goal>"
#   orchestrate.sh next-hop <orchestrator-state.json>
#   orchestrate.sh units <orchestrator-state.json>
#   orchestrate.sh plateau <orchestrator-state.json>
#   orchestrate.sh screen-cmd "<shell command>"
#   orchestrate.sh verdict <orchestrator-state.json>
#   orchestrate.sh validate-state <orchestrator-state.json>
#   orchestrate.sh screen-state-predicate <orchestrator-state.json>
#
# Exit codes: 0 = allow/ok, 2 = refuse/invalid/usage, 1 = unexpected error.
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "usage: orchestrate.sh <classify|next-hop|units|plateau|screen-cmd|verdict|validate-state|screen-state-predicate> [args]" >&2
  exit 2
fi

cmd="$1"; shift

case "$cmd" in
  classify|next-hop|units|plateau|screen-cmd|verdict|validate-state|screen-state-predicate)
    exec python3 - "$cmd" "$@" <<'PYEOF'
import json
import re
import sys

cmd, args = sys.argv[1], sys.argv[2:]

# --- classify -------------------------------------------------------------

# (archetype, mode, keywords); rank = specificity precedence (lower first).
ARCHETYPES = [
    ("ship-ready", "loop", ["ship", "release", "deploy", "publish", "production-ready", "merge"]),
    ("fix-broken", "loop", ["fix", "broken", "failing", "error", "crash", "bug", "can't run", "tests fail"]),
    ("harden", "loop", ["security", "vulnerability", "audit", "owasp", "cve", "harden", "lock down"]),
    ("build-feature", "loop", ["build", "add", "implement", "create", "new feature", "acceptance test"]),
    ("optimize-metric", "loop", ["improve", "optimize", "increase", "reduce", "faster", "smaller", "coverage", "score"]),
    ("document", "dispatch", ["document", "wiki", "generate docs", "explain codebase", "write guide"]),
    ("what-to-build", "dispatch", ["what should i build", "ideas", "improvements", "prd", "roadmap"]),
    ("decide-design", "dispatch", ["which approach", "compare options", "design decision", "architecture choice"]),
    ("explore", "loop", ["understand", "explore", "investigate", "what does", "how does", "edge cases"]),
]

def cmd_classify(goal):
    text = goal.lower()
    hits = [(rank, name, mode) for rank, (name, mode, kws) in enumerate(ARCHETYPES)
            if any(kw in text for kw in kws)]
    if not hits:
        print("explore\tloop")
        print("candidates: (none matched; defaulting to explore — confirm archetype with the user)")
        return 0
    hits.sort()
    primary = hits[0]
    print(f"{primary[1]}\t{primary[2]}")
    if len(hits) > 1:
        names = [h[1] for h in hits[:2]]
        print(f"candidates: {', '.join(names)}")
    return 0

# --- state helpers ---------------------------------------------------------

def load_state(path):
    try:
        with open(path, "r", encoding="utf-8") as fh:
            return json.load(fh)
    except Exception as exc:
        print(f"invalid: cannot read state file: {exc}", file=sys.stderr)
        sys.exit(2)

def known_units(state):
    return [u for u in (state.get("units_remaining") or []) if u is not None]

def consecutive_unknown(state):
    count = 0
    for u in reversed(state.get("units_remaining") or []):
        if u is None:
            count += 1
        else:
            break
    return count

def is_plateau(state):
    window = int(state.get("plateau_window") or 5)
    known = known_units(state)
    if len(known) < window + 1:
        return False
    # Flat or worse over the window, oscillation that nets zero included.
    return (known[-1] - known[-1 - window]) >= 0

# --- next-hop --------------------------------------------------------------

def cmd_next_hop(state):
    lh = state.get("last_handoff") or {}
    if int(lh.get("errors") or 0) > 0:
        print("fix"); return 0
    if lh.get("verdict") == "UNSTABLE":
        print("regression"); return 0
    if lh.get("untested_gaps"):
        print("debug"); return 0
    # Unknown-units backstop: repeated unknown invalidates progress signals.
    if consecutive_unknown(state) >= 3:
        print("BLOCKED"); return 0
    if state.get("pending_verify"):
        print("verify"); return 0
    if state.get("predicate_met"):
        print("DONE"); return 0
    hop_log = state.get("hop_log") or []
    last = hop_log[-1] if hop_log else {}
    if last.get("outcome") in ("blocked", "failed") and not last.get("retry_route"):
        print("BLOCKED"); return 0
    if is_plateau(state):
        print("PLATEAU"); return 0
    pipeline = state.get("pipeline") or []
    pos = int(state.get("pipeline_pos") or 0)
    if pos < len(pipeline):
        print(pipeline[pos]); return 0
    if state.get("mode") == "loop":
        print("regression"); return 0
    print("DONE"); return 0

# --- units -----------------------------------------------------------------

def cmd_units(state):
    hist = state.get("units_remaining") or []
    known = known_units(state)
    cur = known[-1] if known else "unknown"
    delta = (known[-1] - known[-2]) if len(known) >= 2 else None
    print(f"units={cur} delta={delta} consecutive_unknown={consecutive_unknown(state)} history_len={len(hist)}")
    return 0

# --- plateau ---------------------------------------------------------------

def cmd_plateau(state):
    print("true" if is_plateau(state) else "false")
    return 0

# --- screen-cmd ------------------------------------------------------------

CMD_REFUSALS = [
    (re.compile(r"rm\s+(-[a-zA-Z]*[rf][a-zA-Z]*\s+)+/(\s|$)"), "rm -rf targets filesystem root"),
    (re.compile(r"rm\s+[^|;&]*\s~(/|\s|$)"), "rm targets home directory"),
    (re.compile(r"(curl|wget)\b[^|;&]*\|\s*(sudo\s+)?(ba|z|da)?sh(\s|$)"), "network download piped into a shell"),
    (re.compile(r"\bsudo\b"), "sudo privilege escalation"),
    (re.compile(r":\s*\(\)\s*\{.*\}\s*;\s*:"), "fork bomb"),
    (re.compile(r"git\s+push\b[^|;&]*--force"), "force push to shared remote"),
    (re.compile(r"chmod\s+-R\s+777\s+/"), "recursive 777 on filesystem root"),
    (re.compile(r"\bdd\b[^|;&]*of=/dev/(disk|sd|nvme|hd)"), "dd writes to a raw device"),
]

DB_URL = re.compile(
    r"\b(?:postgres|postgresql|mysql|mariadb|mongodb(?:\+srv)?|redis|amqp|jdbc:[a-z0-9]+)://[^\s\"']+",
    re.IGNORECASE,
)

RESERVED_SINGLE_LABEL_HOSTS = {"prod", "production", "database", "db"}

def db_url_allowed(url):
    body = url.split("://", 1)[1]
    authority = body.split("/", 1)[0]
    hostport = authority.rsplit("@", 1)[-1]
    host = hostport.split(":", 1)[0].strip("[]").lower()
    dbname = ""
    if "/" in body:
        dbname = body.split("/", 1)[1].split("?", 1)[0].split("#", 1)[0].strip()
    if host in {"localhost", "127.0.0.1", "::1"}:
        return True, f"host={host} is local"
    if "." not in host and host not in RESERVED_SINGLE_LABEL_HOSTS and host:
        return True, f"host={host} is a single-label container/service hostname"
    if dbname and (dbname.endswith("_test") or dbname.endswith("_ci")):
        return True, f"dbname={dbname} carries a test/ci suffix"
    return False, f"host={host} dbname={dbname or '(none)'} fails the anchored allowlist (exact localhost/127.0.0.1/::1 or single-label service hostname, or dbname *_test/*_ci suffix; bare substrings do not qualify)"

def screen_command(command):
    for pattern, reason in CMD_REFUSALS:
        if pattern.search(command):
            return f"refuse: {reason}"
    for match in DB_URL.finditer(command):
        allowed, detail = db_url_allowed(match.group(0))
        if not allowed:
            return f"refuse: DB URL {match.group(0)} — {detail}"
    return "allow"

def cmd_screen_cmd(command):
    result = screen_command(command)
    print(result)
    return 0 if result == "allow" else 2

# --- verdict ---------------------------------------------------------------

def cmd_verdict(state):
    hops = state.get("hop_log") or []
    outcomes = {}
    for hop in hops:
        outcome = hop.get("outcome") or "?"
        outcomes[outcome] = outcomes.get(outcome, 0) + 1
    known = known_units(state)
    first = known[0] if known else "?"
    last = known[-1] if known else "?"
    outcome_summary = " ".join(f"{k}={v}" for k, v in sorted(outcomes.items())) or "none"
    if state.get("stop_reason"):
        verdict = state["stop_reason"]
    elif state.get("predicate_met"):
        pipeline = state.get("pipeline") or []
        verdict = ("PENDING-SHIP-APPROVAL"
                   if state.get("terminal_choice") == "proceed-to-ship" and "ship" in pipeline
                   else "CONVERGED")
    elif is_plateau(state):
        verdict = "PLATEAU"
    elif int(state.get("cycle_count") or 0) >= int(state.get("max_cycles") or 50):
        verdict = "CEILING"
    else:
        verdict = "INCOMPLETE"
    print(verdict)
    print(f"cycles={state.get('cycle_count', 0)} units {first}->{last} hops: {outcome_summary}")
    return 0

# --- validate-state --------------------------------------------------------

VALID_MODES = {"loop", "dispatch"}
VALID_TERMINAL = {"stop-at-verified", "proceed-to-ship"}

def cmd_validate_state(state):
    issues = []
    for field in ("goal", "archetype", "mode"):
        if not isinstance(state.get(field), str) or not state.get(field):
            issues.append(f"{field}: required non-empty string")
    if state.get("mode") not in VALID_MODES:
        issues.append(f"mode: must be one of {sorted(VALID_MODES)}")
    if not isinstance(state.get("pipeline"), list) or not state.get("pipeline"):
        issues.append("pipeline: required non-empty array")
    if not isinstance(state.get("hop_log"), list):
        issues.append("hop_log: required array")
    if not isinstance(state.get("cycle_count"), int) or state.get("cycle_count", -1) < 0:
        issues.append("cycle_count: required non-negative integer")
    if state.get("mode") == "loop":
        predicate = state.get("predicate")
        if not isinstance(predicate, dict):
            issues.append("predicate: required object for loop mode")
        else:
            for field in ("command", "expected"):
                if not isinstance(predicate.get(field), str) or not predicate.get(field):
                    issues.append(f"predicate.{field}: required non-empty string")
        if state.get("terminal_choice") not in VALID_TERMINAL:
            issues.append(f"terminal_choice: must be one of {sorted(VALID_TERMINAL)} for loop mode")
        if not isinstance(state.get("units_remaining"), list):
            issues.append("units_remaining: required array for loop mode")
    if issues:
        print("invalid:")
        for issue in issues:
            print(f"  - {issue}")
        return 2
    print("valid")
    return 0

# --- screen-state-predicate ------------------------------------------------

def cmd_screen_state_predicate(state):
    predicate = state.get("predicate")
    if not isinstance(predicate, dict) or not predicate.get("command"):
        print("refuse: state has no pinned predicate command to screen")
        return 2
    result = screen_command(str(predicate["command"]))
    print(result)
    return 0 if result == "allow" else 2

# --- dispatch --------------------------------------------------------------

HANDLERS = {
    "classify": lambda: cmd_classify(args[0]) if args else (_ for _ in ()).throw(
        SystemExit("usage: orchestrate.sh classify \"<goal>\"")),
    "next-hop": lambda: cmd_next_hop(load_state(args[0])),
    "units": lambda: cmd_units(load_state(args[0])),
    "plateau": lambda: cmd_plateau(load_state(args[0])),
    "screen-cmd": lambda: cmd_screen_cmd(args[0]) if args else (_ for _ in ()).throw(
        SystemExit("usage: orchestrate.sh screen-cmd \"<command>\"")),
    "verdict": lambda: cmd_verdict(load_state(args[0])),
    "validate-state": lambda: cmd_validate_state(load_state(args[0])),
    "screen-state-predicate": lambda: cmd_screen_state_predicate(load_state(args[0])),
}

try:
    sys.exit(HANDLERS[cmd]())
except SystemExit:
    raise
except IndexError:
    print(f"usage: orchestrate.sh {cmd} <args>", file=sys.stderr)
    sys.exit(2)
PYEOF
    ;;
  *)
    echo "unknown subcommand: $cmd" >&2
    exit 2
    ;;
esac
