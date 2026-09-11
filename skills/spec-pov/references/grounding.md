# Grounding the POV

For an authorized scout dispatch, correct a pre-launch argument rejection once without changing scope or required capabilities. Capacity-limited work stays queued until a slot frees; repeated zero capacity uses the bounded inline fallback. Other launch failures gather the same bounded evidence inline and lower the stated confidence where lost independent evidence matters. Once a scout launches, collect its outcome before retrying; do not duplicate unresolved work.

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

Resolve current project orientation for this run before candidate research: stack, dependency/license surface, conventions, structure, git identity, and dirty state. Carry direct source refs and do not reuse orientation across branches or worktrees. If git or a required source cannot be read, record the concrete degraded fact and narrow the project-floor claim.

For Tier 1, combine project grounding with the mandatory prior-decision scan (`docs/solutions/`, local ADRs, and design docs) and a bounded external-evidence pass; skip only the standalone precedent lens because the project lens performs that scan. For Tier 2/3, use project-grounding, precedent/activity, and external-evidence lenses when authorized. Local precedent reads always run, including in non-git projects; tracker, PR, and web portions degrade when unavailable. The project lens must verify a current call-site or concrete fit point; a cached dependency name is only a lead.

Load `references/agents/project-grounding-scout.md`, `references/agents/precedent-activity-scout.md`, and `references/agents/external-evidence-researcher.md` for the corresponding lenses, whether run inline or through authorized scouts. Include user-supplied links in the external research brief. Tier 2 uses the researcher's standard budget and preference for corroboration. Tier 3 needs a wider source search, a larger read budget, and two independent sources supporting every load-bearing external claim. A single-source claim cannot anchor a Tier 3 verdict; record the missing corroboration and return Hold under the external floor.

Capability gating is two-level: file-based project and local-precedent reads always run; tracker, PR, and web portions are optional. A missing surface lowers the claim or trips the external floor; it never becomes invented evidence. Read dossiers on demand and keep raw notes in the private scratch directory. Populate separate provenance buckets: *observed-project-facts* and *verified-external-facts* count as grounding; *conversation-claims* and *unconfirmed-assumptions* do not count until rechecked against authoritative source evidence. Provider output remains advisory until its cited source is re-read.
