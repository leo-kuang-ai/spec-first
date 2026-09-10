# Per-Action Flows

Read this reference after classification and before preparing any mutation.
Read `references/publication.md` for private candidates, validation, target
identity, freshness checks, and durable writes. These flows prepare changes;
only publication applies them. A failed prerequisite never permits dependent
deletion. Keep prior content until the entire dependent action is verified.

## Keep Flow

No file edit. Report why the learning remains useful and accurate, including
any verification gap or independently supported rule the implementation violates.

## Update Flow

Prepare a private candidate only when the solution remains substantively correct:
renamed paths or modules, refreshed links, meaningful metadata corrections, or
implementation notes after a move. Cosmetic-only edits remain no-write Keep.
A changed substantive recommendation requires Replace, subject to the
descriptive-drift/implementation-conflict rule in `references/classify.md`.
Worth-based shortening is a separate Update variant under `references/worth-audit.md`.

For a relocation, apply `classify.md`'s four-condition gate. Prepare the candidate
for the confirmed existing category, reconcile frontmatter, and map every
in-repo inbound link, including catalog rows. Rebase outgoing relative links
against the final destination; the candidate's scratch location is irrelevant.
Publish and verify the destination and citation changes before deleting the
source. Do not use a move that stages files without commit authority.

## Consolidate Flow

The orchestrator prepares consolidation directly; the docs have already been
read and a focused merge does not need another worker. For each topic cluster:

1. Choose the canonical target using accuracy, scope, and retrieval value.
2. Extract unique content from every subsumed doc, including independently
   valuable incident evidence, rejected alternatives, and unverifiable but
   plausible claims. Do not discard a claim merely because code cannot witness it.
3. Integrate that content into a private canonical candidate. A material rewrite
   re-evaluates all classification fields under v2 and includes grounded
   `source_refs` and a concrete `invalidation_condition`.
4. Prepare each citation to point at the surviving content. The canonical doc
   must have exactly one catalog row if the cluster was catalogued; subsumed
   docs have none. If only a subsumed doc had a row, repoint it rather than
   deleting the only entry. If both had rows, merge useful descriptions and
   remove the duplicate. Rebase copied outgoing relative links as needed.
5. Validate through `references/publication.md`, including the mechanical
   promotion gate on the canonical candidate and the claims check at its final
   path. The orchestrator judges evidence credibility and invalidation adequacy.
6. Publish the canonical and citation candidates, verify their actual targets,
   then delete subsumed paths. A failed validation or reference update leaves
   dependent deletions pending and the action incomplete.

Process larger overlapping clusters pairwise when that reduces context, but
base the next merge on the latest verified candidate or published content.
Keep independent sub-problems separate when they retain retrieval value.

## Split Flow

Split only when each fragment has independent retrieval value and a maintainer
would be materially hindered by keeping the subjects together. Length alone is
not a reason. Splits are always recommend-only in non-interactive mode.

1. Resolve authorized fragment boundaries and final paths. Read `references/schema.yaml`,
   `references/yaml-schema.md`, and `assets/resolution-template.md` for every successor.
2. Prepare successors in private scratch, with the shared context each needs to
   stand alone, v2 classification, `source_refs`, and `invalidation_condition`.
3. Map each citation to the successor that contains its referenced content;
   citations spanning fragments may need more than one link. Preserve anchors
   or rewrite them to the actual new heading. Replace the original catalog row
   with appropriate successor rows without duplicating existing entries.
4. Validate every successor and citation candidate under `references/publication.md`,
   including outgoing relative links resolved from their final destinations.
5. Publish and verify all dependencies before removing the original. If a
   successor keeps the original path, replace its contents and never enqueue
   that surviving path for deletion. Partial success is not a completed split.

## Replace Flow

Process replacements sequentially. An authorized read-only worker may draft one
successor for context isolation; otherwise draft inline. Workers return text
or a private scratch reference, never write tracked targets, stage, commit,
or delete. The orchestrator is the sole publisher.

Read `references/schema.yaml`, `references/yaml-schema.md`, and
`assets/resolution-template.md`; pass their relevant contents, the old learning,
the current evidence, and the final target to a worker or use them inline.
Do not invent classification or section structure from memory. Re-evaluate all
classification fields under v2 and include grounded `source_refs` and a concrete
`invalidation_condition` in the private successor candidate.

- **Same-path Replace:** publish new contents at the original path after
  validation and freshness checks; never enqueue that path for deletion.
  Preserve cited anchors or repair their inbound citations if headings change.
- **Different-path Replace:** prepare all inbound citations and catalog rows
  to resolve to the verified successor, including the content/anchor they cite.
  Rebase outgoing relative links. Only after successor and citation publication
  and verification may the old path be deleted. The old path is not an implicit
  redirect, and a `supersedes` field does not repair readers' links.

Both paths use `references/publication.md` for parser-safety, promotion and
claims checks, semantic approval, and publication. Insufficient evidence for
a successor permits a stale annotation only if drift is independently supported;
otherwise retain the original and report a verification gap. Stale annotations
are private candidates too, not immediate frontmatter writes.

## Delete Flow

Use `references/classify.md`'s full evidence gate. A worth-based deletion instead
uses the explicitly selected `references/worth-audit.md` recovery evidence and
its citation/authority limits; do not mislabel it as accuracy-based auto-Delete.

Search the repo's markdown for inbound citations and read their context.
Prepare mechanical removal only for unambiguously decorative links, and remove
the deleted doc's catalog row. A late substantive or unclear citation stops
the deletion and returns to classification; uncertainty alone cannot authorize
a stale annotation or deletion. `references/publication.md` rechecks the
original and citing files, verifies published cleanup, and only then deletes.
