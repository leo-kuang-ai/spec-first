#!/bin/bash
# autoresearch regression scorer — deterministic verdict seam for regression.md.
#
# Usage: score-regression.sh verdict <results.tsv>
# TSV columns (per regression.md):
#   iteration timestamp dimension axis tier classification baseline candidate
#   delta regressed subscore severity status file_line description
# An optional leading comment line `# metric_direction: ...` is informational.
#
# Verdict math (regression.md "Verdict" section):
#   - Any HARD regressed=true with classification=eligible -> UNSTABLE (exit 1).
#   - Else stability_score = sum(weight * dim_subscore) renormalized over the
#     SCORE dims that ran (flakiness .30 / performance .30 / resource .20 /
#     visual .20); STABLE iff >= 95 (REG_THRESHOLD env override) (exit 0).
#   - Per-dim contribution table always printed; UNAVAILABLE canonical dims
#     are always listed, never silently passed.
set -euo pipefail

if [[ $# -lt 2 || "$1" != "verdict" ]]; then
  echo "usage: score-regression.sh verdict <results.tsv>" >&2
  exit 2
fi

exec python3 - "$2" <<'PYEOF'
import os
import sys

path = sys.argv[1]
WEIGHTS = {"flakiness": 0.30, "performance": 0.30, "resource": 0.20, "visual": 0.20}
THRESHOLD = float(os.environ.get("REG_THRESHOLD", "95"))
COLUMNS = ["iteration", "timestamp", "dimension", "axis", "tier", "classification",
           "baseline", "candidate", "delta", "regressed", "subscore", "severity",
           "status", "file_line", "description"]

rows = []
try:
    with open(path, "r", encoding="utf-8") as fh:
        for line in fh:
            line = line.rstrip("\n")
            if not line or line.startswith("#"):
                continue
            parts = line.split("\t")
            if len(parts) < len(COLUMNS):
                parts += [""] * (len(COLUMNS) - len(parts))
            rows.append(dict(zip(COLUMNS, parts)))
except Exception as exc:
    print(f"UNAVAILABLE\ncannot read results tsv: {exc}", file=sys.stderr)
    sys.exit(1)

def truthy(value):
    return value.strip().lower() in {"true", "1", "yes"}

blocking = [r for r in rows
            if truthy(r["regressed"])
            and r["tier"].strip().lower() == "hard"
            and r["classification"].strip().lower() == "eligible"]

per_dim = {}
for row in rows:
    dim = row["dimension"].strip()
    per_dim.setdefault(dim, []).append(row)

print("per-dim contributions:")
present, unavailable = [], []
for dim in WEIGHTS:
    dim_rows = per_dim.get(dim)
    if not dim_rows:
        unavailable.append(dim)
        print(f"  {dim}: UNAVAILABLE (weight {WEIGHTS[dim]:.2f} renormalized out)")
        continue
    scores = []
    for row in dim_rows:
        try:
            scores.append(float(row["subscore"]))
        except ValueError:
            pass
    if not scores:
        unavailable.append(dim)
        print(f"  {dim}: UNAVAILABLE (no parsable subscore)")
        continue
    dim_sub = sum(scores) / len(scores)
    present.append((dim, dim_sub, len(scores)))

if blocking:
    for row in blocking:
        print(f"  BLOCKING: {row['dimension']}/{row['axis']} {row['file_line'] or ''} {row['description'][:60]}")
    print("UNSTABLE")
    sys.exit(1)

if not present:
    print("BASELINE_UNAVAILABLE (no scored dimensions ran)")
    sys.exit(1)

weight_sum = sum(WEIGHTS[dim] for dim, _, _ in present)
score = sum(WEIGHTS[dim] * sub for dim, sub, _ in present) / weight_sum
for dim, sub, n in present:
    contribution = WEIGHTS[dim] * sub / weight_sum
    print(f"  {dim}: subscore {sub:.1f} over {n} cells -> contribution {contribution:.2f}")
if unavailable:
    print(f"UNAVAILABLE dims: {', '.join(unavailable)}")
print(f"stability_score = {score:.2f} (threshold {THRESHOLD})")
print("STABLE" if score >= THRESHOLD else "UNSTABLE")
sys.exit(0 if score >= THRESHOLD else 1)
PYEOF
