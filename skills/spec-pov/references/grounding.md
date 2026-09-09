# Grounding the POV

Read before project or precedent grounding. This reference owns the execution detail removed from the entry body.

Dispatch is tiered by task shape, never hardcoded to a model name:

- **Extraction tier** — project-grounding and precedent/activity scouts perform search-and-quote work. Use a cheaper capable model only when the host proves a model override; otherwise inherit.
- **Generation tier** — the external-evidence researcher retrieves sources and checks entailment. Use a balanced mid-tier only when the host proves an override; otherwise inherit.
- **Ceiling tier** — the POV reasoning itself stays in the main conversation; no scout decides the verdict.

When worker dispatch is unavailable or not authorized, run the same lenses serially with bounded inline reads and record the degraded coverage. Never claim fresh independent scout coverage for inline work.

Create one owner-only scratch directory for the run and reuse it for all scout notes:

```bash
umask 077
SCRATCH_DIR="$(mktemp -d "${TMPDIR:-/tmp}/spec-first-pov.XXXXXX")"
[ -d "$SCRATCH_DIR" ] && [ ! -L "$SCRATCH_DIR" ] || { echo 'private scratch creation failed' >&2; exit 1; }
chmod 700 "$SCRATCH_DIR"
echo "$SCRATCH_DIR"
```

Every scout payload carries the framed subject, intent, incumbent, reversibility tier, and exact scratch path. Do not dispatch a generic prompt that leaves the candidate or repository scope implicit.

For Tier 1, combine project grounding with the prior-decision scan and run a bounded external-evidence pass. For Tier 2/3, use the project-grounding, precedent/activity, and external-evidence lenses when authorized; local precedent reads always run, while tracker, PR, and web portions degrade when their surfaces are unavailable. The project scout must verify a current call-site or concrete fit point; a cached dependency name is only a lead.

Populate separate provenance buckets: *observed-project-facts* and *verified-external-facts* count as grounding; *conversation-claims* and *unconfirmed-assumptions* do not count until rechecked against authoritative source evidence. Provider output remains advisory until its cited source is re-read. Missing capability lowers the claim instead of inventing evidence.

Resolve current project orientation for this run before candidate research: stack, dependency/license surface, conventions, structure, git identity, and dirty state. Carry direct source refs and do not reuse orientation across branches or worktrees. If git or a required source cannot be read, record the concrete degraded fact and narrow the project-floor claim.

For Tier 1, combine project grounding with the mandatory prior-decision scan (`<root>/solutions/`, ADRs, and design docs) and a bounded external-evidence pass; skip only the standalone precedent lens because the project lens performs that scan. For Tier 2/3, use project-grounding, precedent/activity, and external-evidence lenses when authorized. Local precedent reads always run; tracker, PR, and web portions degrade when unavailable. The project lens must verify a current call-site or concrete fit point; a cached dependency name is only a lead.

Capability gating is two-level: file-based project and local-precedent reads always run; tracker, PR, and web portions are optional. A missing surface lowers the claim or trips the external floor; it never becomes invented evidence. Read dossiers on demand, keep raw notes in the private scratch directory, and keep *observed-project-facts* / *verified-external-facts* separate from *conversation-claims* / *unconfirmed-assumptions*.
