---
name: spec-promote
description: "Draft launch or promotion copy with availability claims grounded in the supplied delivery evidence."
disable-model-invocation: true
argument-hint: "[optional: what shipped and/or channels, e.g. 'a tweet thread and a LinkedIn post']"
---

# spec-promote

Turn a feature that just shipped into copy-pasteable, user-facing announcement copy — right inside the engineering workflow.

## Purpose

After you ship, the messaging shouldn't wait for a separate marketing pass. `spec-promote` figures out what shipped, picks the right channels, and drafts the copy. It is **spiral-agnostic by default**: with nothing installed it draws on a lite layer of editorial and social-media expertise to produce strong channel-specific copy. When the Spiral CLI (see `references/spiral-cli.md`) is present and authed, it uses Spiral so the drafts are voice-matched to your brand — a subtle enhancement, never a requirement.

**The promotion output is draft-only. It never posts, publishes, commits, or opens PRs.** Posting is a human action. The only durable local preference exception is the separately disclosed and authorized Spiral opt-out write described in Path 0; it is not promotion output and must remain local-only.

## Usage

```bash
spec-promote                                   # Derive what shipped from context, draft defaults
spec-promote [free-form description]           # You describe what shipped
spec-promote a tweet thread and a LinkedIn post   # Request specific channels
spec-promote 3 tweet options for the new export feature
```

## Phase 1 — Figure out what shipped

If the user gave a free-form description, preserve their intended value and attribute any unverified availability claim. Carry the caller's verified delivery state: implemented, merged, released, deployed, or unknown. An active/merged PR, commit, diff or Unreleased entry proves no deployment. Use “implemented” or “planned for release” when appropriate; never turn those artifacts into “live now” claims.

Resolve one target repository from the current request/caller and verify its root before reads. Use the confirmed PR/base identity or resolved upstream comparison; do not assume a `main` branch. If no Git root exists, draft from supplied material and skip repository/config reads.

When the description lacks detail, derive it from available context:

- **Merged/active PR** — `gh pr view <confirmed-pr> --repo <confirmed-owner/repo> --json title,body,url,baseRefName,headRefOid`. The title and body usually state the user-facing value.
- **The diff** — `git -C <confirmed-root> diff <confirmed-base>...HEAD --stat` and skim notable changes to ground the claim in what actually changed.
- **Changelog** — the top/`[Unreleased]` entry in `docs/changelog.md`, `CHANGELOG.md`, or similar.
- **Recent commits** — `git log --oneline -15` for the arc of the change.

Then write a 1–3 sentence summary of the **user-facing value** — what a user can now do that they couldn't before, and why they'd care. Describe the outcome, not the implementation. ("You can now export any report to CSV in one click" — not "Added a CsvSerializer and an export endpoint.")

If you can't confidently tell what shipped, ask the user one short question rather than guessing.

## Phase 2 — Pick channels

Default to a small, sensible set:

- **An X post or short thread** (lead with the value; thread only if the change warrants it)
- **A one-line changelog / release blurb**

Scale to what the change warrants and to what the user asked for. If they named channels ("LinkedIn", "email", "a blog intro", "a short demo script"), draft those instead of or in addition to the defaults. A small fix needs one or two short drafts; a flagship feature can justify a cross-channel set. Don't force a fixed template.

## Phase 3 — Draft the copy

If local drafting is requested, go directly to Path B with no provider probe or setup prompt. Otherwise, detect Spiral's state with the Skill-owned bounded probe. Resolve `SKILL_DIR` from the `spec-promote/SKILL.md` you loaded; do not run `spiral auth status` directly because provider stdout/stderr may contain secret-like fields:

```bash
SKILL_DIR="<absolute path of the directory containing this SKILL.md>"
node "$SKILL_DIR/scripts/check-spiral-auth.cjs"
```

Classify into one of three states:

- **Unavailable** — `status: unavailable` → **Path B**, with optional Path 0 after delivery.
- **Ready** — `status: ready` and `authenticated: true` → **Path A** (voice-matched).
- **Not ready / unverified** — every other allowlisted status → **Path B**, with optional Path 0 after delivery. Treat non-JSON, timeout, non-zero, and malformed provider output as unverified without inspecting or surfacing the raw bytes.

Never let a Spiral failure, timeout, or odd output block or slow the skill — when in doubt, treat it as not-ready and continue.

### Path 0 — Offer Spiral setup (first run, declinable)

When Spiral is not ready, complete the requested local drafts first. An optional setup offer may follow once if there is no recorded opt-out; it must not delay the deliverable. No response is not opt-in or opt-out. Enter setup only when requested, reading `references/spiral-cli.md` for installation, authentication and the separately disclosed local preference write. A plain request to draft locally grants no persistent-preference write.

### Path A — Spiral ready (voice-matched)

Use the Spiral CLI so drafts match the user's brand voice. **Read `references/spiral-cli.md` before composing the prompt** — multi-channel vs. single-channel-variations is phrasing-driven (channel keywords / cue words vs. `--num-drafts`) and getting it wrong silently returns the wrong number or shape of drafts. The exact phrasing rules live there; don't restate them from memory. Essentials:

Before sending feature context or promotion copy to Spiral, record `provider_egress_authorization: authorized | missing`. Authentication, installation, prior use, requested channels, and general drafting intent do not authorize a run-local content transfer. Display the provider, content categories being sent, persistence behavior, and local Path B alternative; proceed only when the current request or a new confirmation explicitly authorizes this transfer. Missing authority returns `provider_egress_authorization_missing` and uses Path B with zero `spiral write` calls.

- Always pass `--instant` and `--json`. Parse `drafts[]` (each carries its own `channel`) plus `session_id`.
- **Present every returned draft, grouped by `channel`.** Spiral decides how many drafts per channel — multi-channel runs often return several per channel — so never assume one-per-channel or drop extras.

If the authorized `spiral write` call errors or returns no usable drafts, fall back to Path B for the affected channels, but do not describe the run as local-only. Return a safe provider receipt with `provider_attempt: attempted`, `delivery_status: unknown`, an allowlisted `reason_code`, `persistence_status: possible-or-unknown`, and `fallback_used: true`. Never copy raw Spiral stdout/stderr, exception text, internal commentary, or secret-like fields into chat, logs, or durable artifacts.

### Path B — Direct drafting (lite editorial & social expertise)

No Spiral needed — draft strong copy directly using a compact layer of editorial and social-media fundamentals. (The Spiral path goes further: brand-voice matching, humanization, saved styles, and cross-channel campaign orchestration.)

**Editorial fundamentals** — every channel:
- Lead with the user-facing outcome: what someone can now do, not how it was built.
- One idea per piece. Cut windup, hedges, and throat-clearing.
- Be concrete and specific; show the value, don't assert it.
- Plain, active language. Strip AI tells — "thrilled/excited to announce," "game-changer," "in today's fast-paced world," "unlock/leverage/seamless," em-dash padding.
- Sanity check: read it as if saying it to one user. If a person wouldn't say it, rewrite it.

**Social fundamentals** — distributed channels:
- The first line is the hook and has to earn the next line (feeds truncate). No preamble.
- Match each channel's native shape and length; never reuse one draft verbatim across channels.
- One clear CTA where the channel supports it.
- Hashtags: 0–2, only where the channel expects them — never a wall of tags.

**Per channel:**
- **X** — value in the first line; ~1–3 tight lines. Thread only when there's more than one beat worth its own line.
- **Changelog / release blurb** — one declarative line naming the new capability. Plain, not promotional.
- **LinkedIn** — a short paragraph: human angle (why it matters), then the what. Warmer than X.
- **Email** — benefit-stating subject + 2–4 sentence body + one CTA.
- **Blog intro** — one strong opening paragraph framing the problem and the new capability; leave the deep-dive to the author.
- **Demo script** — 3–6 spoken beats: hook, problem, action, payoff.

**Drafts per channel:** one strong draft by default; produce more only when asked ("3 tweet options"), capped ~3.

## Phase 4 — Present the drafts

Show every draft as a clean, copy-pasteable block, labeled by channel. For each:

```
### X post
<the copy>
```

- If Spiral produced them, also surface the `session_id` and each draft's `url` so the user can open and tweak them in the Spiral web app.
- Offer to revise (tone, length, angle, more variations, another channel).
- **Do not post, publish, schedule, commit, or open a PR.** End by reminding the user the drafts are theirs to ship — say so explicitly (drafts only; publication is the user's move), not just by omission.
- When the run reports machine-checkable delivery facts, use these exact tokens: `delivery_status: implemented-not-released` and `provider_attempt: not-attempted` (hyphenated, no spaces or parentheticals) when work exists locally and no provider call was made — machines match these strings verbatim.
- If Path 0 recorded the local preference exception, disclose that local-only write once and keep it separate from the draft-output claim.

## Examples

**Single-channel variations — "3 tweet options":**
> User: `spec-promote 3 tweet options for the new one-click CSV export`
> → Summarize the value. Spiral path: `spiral write "3 tweet options for one-click CSV export" --instant --num-drafts 3 --json` (no cue words). No-Spiral path: write 3 distinct tweets directly. Present all three.

**Multi-channel set — "a campaign across X, LinkedIn, and email":**
> User: `spec-promote draft a launch across X, LinkedIn, and email`
> → Spiral path: `spiral write "announcing one-click CSV export — a launch across X, LinkedIn, and email" --instant --json` returns a set of drafts per channel (Spiral decides the count — often several), each carrying its `channel`. (`--num-drafts` ignored here.) No-Spiral path: draft one X post, one LinkedIn post, one email directly. Present every returned draft, grouped by channel.
