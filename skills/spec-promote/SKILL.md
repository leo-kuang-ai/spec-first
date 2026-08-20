---
name: spec-promote
description: "Draft launch or promotion copy for a shipped feature."
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

If the user gave a free-form description of the feature, use it as the source of truth.

Otherwise, derive it from context (use what's available; don't block on any one source):

- **Merged/active PR** — `gh pr view --json title,body,url 2>/dev/null` (and `gh pr view` for the current branch). The title and body usually state the user-facing value.
- **The diff** — `git diff main...HEAD --stat` and skim notable changes to ground the claim in what actually changed.
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

First, detect Spiral's state with the Skill-owned bounded probe. Resolve `SKILL_DIR` from the `spec-promote/SKILL.md` you loaded; do not run `spiral auth status` directly because provider stdout/stderr may contain secret-like fields:

```bash
SKILL_DIR="<absolute path of the directory containing this SKILL.md>"
node "$SKILL_DIR/scripts/check-spiral-auth.cjs"
```

Classify into one of three states:

- **Unavailable** — `status: unavailable` → **Path 0** (install), then Path A if set up, else **Path B**.
- **Ready** — `status: ready` and `authenticated: true` → **Path A** (voice-matched).
- **Not ready / unverified** — every other allowlisted status → **Path 0** when interactive, else **Path B**. Treat non-JSON, timeout, non-zero, and malformed provider output as unverified without inspecting or surfacing the raw bytes.

Never let a Spiral failure, timeout, or odd output block or slow the skill — when in doubt, treat it as not-ready and continue.

### Path 0 — Offer Spiral setup (first run, declinable)

When Spiral isn't ready, offer to set it up **once** — unless the user previously opted out. The point is one proactive nudge, never a recurring one, and never a blocker: a decline always proceeds to Path B. **Any dismissal records the opt-out**, so a single first-run decline stops the offer for good in this repo — the user is never asked twice.

Read `references/spiral-cli.md` for the exact setup prompt (built with the platform's blocking-question tool), the connect/install steps, and how the opt-out is recorded so later runs skip this. In short:

- **Unauthed** → the agent runs `spiral login --json` (CLI >= 1.8.0; non-blocking, the API key never passes through the agent). On `status: already_authenticated` → use Path A. On `status: pending` → surface the `auth_url`, the user approves in their browser, then re-run the bounded auth probe after the user's confirmation; `status: ready` → Path A. Never have the user paste a key into chat. (Older CLI without agent login → suggest `npm i -g @every-env/spiral-cli@latest`, or have the user run `spiral login` themselves.) Escape hatch: "or the agent can just draft directly, without Spiral's personalization and humanization."
- **Absent** → guide the user to install + connect in one step via the pairing-code command from Settings → Connect an Agent.
- **Decline** → record the opt-out (best-effort) and go to Path B.

Skip Path 0 entirely — straight to Path B — when the opt-out is already recorded, or when running headless / non-interactive (no human to answer). If a human is present but no blocking-question tool is available, do **not** skip — fall back to a numbered list of the two options in chat and wait for a reply (per the Ask section of `references/spiral-cli.md`).

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
- **Do not post, publish, schedule, commit, or open a PR.** End by reminding the user the drafts are theirs to ship.
- If Path 0 recorded the local preference exception, disclose that local-only write once and keep it separate from the draft-output claim.

## Examples

**Single-channel variations — "3 tweet options":**
> User: `spec-promote 3 tweet options for the new one-click CSV export`
> → Summarize the value. Spiral path: `spiral write "3 tweet options for one-click CSV export" --instant --num-drafts 3 --json` (no cue words). No-Spiral path: write 3 distinct tweets directly. Present all three.

**Multi-channel set — "a campaign across X, LinkedIn, and email":**
> User: `spec-promote draft a launch across X, LinkedIn, and email`
> → Spiral path: `spiral write "announcing one-click CSV export — a launch across X, LinkedIn, and email" --instant --json` returns a set of drafts per channel (Spiral decides the count — often several), each carrying its `channel`. (`--num-drafts` ignored here.) No-Spiral path: draft one X post, one LinkedIn post, one email directly. Present every returned draft, grouped by channel.
