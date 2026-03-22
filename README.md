# Spec-First

**AI-Powered Development Workflow - The Spec-First Approach**

Spec-First is a powerful AI-assisted development toolkit that transforms Claude Code into a virtual engineering team. Through structured workflows and automated tools, it helps developers achieve 10-100x productivity improvements.

## 🎯 Core Philosophy

**Spec First, Code Second** - Through deep thinking and systematic planning, ensure every line of code aligns with product goals.

**A Complete Workflow**:
```
Product Idea → Deep Planning → Engineering Design → Implementation → Testing → Release
```

**Productivity Gains**:
- 🚀 **10-100x Efficiency** - One person's output equals a team of 20
- 🎯 **Structured Process** - Complete workflow from planning to deployment
- ✅ **Quality Assurance** - Automated code review, testing, and deployment verification
- 💰 **Open Source & Free** - MIT license, completely free

**Who This Is For**:
- **Founders and CEOs** - Especially technical founders who still want to ship products fast
- **First-time Claude Code users** - Structured roles instead of blank prompts
- **Tech leads and staff engineers** - Bring rigorous review, QA, and release automation to every PR

---

## ⚡ 10-Minute Quick Start

### 1. Install Spec-First (30 seconds)

```bash
git clone https://github.com/your-org/spec-first.git ~/.claude/skills/spec-first
cd ~/.claude/skills/spec-first
./setup
```

### 2. Run Your First Skill

Open Claude Code and type:

```
/office-hours
```

Describe the product or feature you want to build.

### 3. Experience the Complete Workflow

```bash
/plan-ceo-review       # CEO-mode review
/plan-eng-review       # Engineering planning
# ... implement code ...
/review                # Code review
/qa                    # QA testing
/ship                  # Create PR
/land-and-deploy       # Merge and deploy
```

**Expected Result**: First useful run in under 5 minutes with a complete design document and implementation plan.

---

## 📦 Installation Guide

### System Requirements

| Software | Version | Purpose |
|----------|---------|---------|
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | Latest | Runtime environment |
| [Git](https://git-scm.com/) | 2.0+ | Version control |
| [Bun](https://bun.sh/) | 1.0+ | JavaScript runtime |
| [Node.js](https://nodejs.org/) | 18+ | Windows only |

### Method 1: Global Installation (Recommended)

In Claude Code, simply say:

```
Install spec-first
```

Or manually execute:

```bash
git clone https://github.com/your-org/spec-first.git ~/.claude/skills/spec-first
cd ~/.claude/skills/spec-first
./setup
```

### Method 2: Project-Local Installation

Add Spec-First to your project so teammates automatically get it:

```bash
cp -Rf ~/.claude/skills/spec-first .claude/skills/spec-first
rm -rf .claude/skills/spec-first/.git
cd .claude/skills/spec-first
./setup
```

Commit to version control:

```bash
git add .claude/skills/spec-first
git commit -m "Add spec-first to project"
git push
```

### Method 3: Multi-Platform Support (Codex, Gemini CLI, Cursor)

```bash
git clone https://github.com/your-org/spec-first.git ~/.codex/skills/spec-first
cd ~/.codex/skills/spec-first
./setup --host codex
```

Or auto-detect:

```bash
git clone https://github.com/your-org/spec-first.git ~/spec-first-temp
cd ~/spec-first-temp
./setup --host auto
```

This installs to `~/.claude/skills/spec-first` and/or `~/.codex/skills/spec-first` depending on what's available. All 25+ skills work across all supported agents.

---

## 🎬 See It Work

```
You:    I want to build a daily briefing app for my calendar.
You:    /office-hours
Claude: [asks about the pain — specific examples, not hypotheticals]

You:    Multiple Google calendars, events with stale info, wrong locations.
        Prep takes forever and the results aren't good enough...

Claude: I'm going to push back on the framing. You said "daily briefing
        app." But what you actually described is a personal chief of
        staff AI.
        [extracts 5 capabilities you didn't realize you were describing]
        [challenges 4 premises — you agree, disagree, or adjust]
        [generates 3 implementation approaches with effort estimates]
        RECOMMENDATION: Ship the narrowest wedge tomorrow, learn from
        real usage. The full vision is a 3-month project — start with
        the daily briefing that actually works.
        [writes design doc → feeds into downstream skills automatically]

You:    /plan-ceo-review
        [reads the design doc, challenges scope, runs 10-section review]

You:    /plan-eng-review
        [ASCII diagrams for data flow, state machines, error paths]
        [test matrix, failure modes, security concerns]

You:    Approve plan. Exit plan mode.
        [writes 2,400 lines across 11 files. ~8 minutes.]

You:    /review
        [AUTO-FIXED] 2 issues. [ASK] Race condition → you approve fix.

You:    /qa https://staging.myapp.com
        [opens real browser, clicks through flows, finds and fixes a bug]

You:    /ship
        Tests: 42 → 51 (+9 new). PR: github.com/you/app/pull/42
```

You said "daily briefing app." The agent said "you're building a chief of staff AI" — because it listened to your pain, not your feature request. Then it challenged your premises, generated three approaches, recommended the narrowest wedge, and wrote a design doc that fed into every downstream skill. Eight commands. That is not a copilot. That is a team.

---

## 🛠️ Skills Overview

### 📋 Product Planning Skills

| Skill | Role | What It Does |
|-------|------|--------------|
| `/office-hours` | **YC Office Hours** | Start here. Six forcing questions that reframe your product before you write code. Pushes back on your framing, challenges premises, generates implementation alternatives. Design doc feeds into every downstream skill. |
| `/plan-ceo-review` | **CEO / Founder** | Rethink the problem. Find the 10-star product hiding inside the request. Four modes: Expansion, Selective Expansion, Hold Scope, Reduction. |
| `/plan-eng-review` | **Eng Manager** | Lock in architecture, data flow, diagrams, edge cases, and tests. Forces hidden assumptions into the open. |
| `/plan-design-review` | **Senior Designer** | Rates each design dimension 0-10, explains what a 10 looks like, then edits the plan to get there. AI Slop detection. Interactive — one AskUserQuestion per design choice. |
| `/design-consultation` | **Design Partner** | Build a complete design system from scratch. Knows the landscape, proposes creative risks, generates realistic product mockups. Design at the heart of all other phases. |

### 💻 Development Skills

| Skill | Role | What It Does |
|-------|------|--------------|
| `/review` | **Staff Engineer** | Find the bugs that pass CI but blow up in production. Auto-fixes the obvious ones. Flags completeness gaps. |
| `/investigate` | **Debugger** | Systematic root-cause debugging. Iron Law: no fixes without investigation. Traces data flow, tests hypotheses, stops after 3 failed fixes. |
| `/codex` | **Second Opinion** | Independent code review from OpenAI Codex CLI. Three modes: review (pass/fail gate), adversarial challenge, and open consultation. Cross-model analysis when both `/review` and `/codex` have run. |

### 🧪 Testing Skills

| Skill | Role | What It Does |
|-------|------|--------------|
| `/qa` | **QA Lead** | Test your app, find bugs, fix them with atomic commits, re-verify. Auto-generates regression tests for every fix. |
| `/qa-only` | **QA Reporter** | Same methodology as /qa but report only. Use when you want a pure bug report without code changes. |
| `/canary` | **SRE** | Post-deploy monitoring loop. Watches for console errors, performance regressions, and page failures. Periodic screenshots and anomaly detection. |
| `/benchmark` | **Performance Engineer** | Baseline page load times, Core Web Vitals, and resource sizes. Compare before/after on every PR. Catch bundle size regressions before they ship. |

### 🚀 Deployment Skills

| Skill | Role | What It Does |
|-------|------|--------------|
| `/ship` | **Release Engineer** | Sync main, run tests, audit coverage, push, open PR. Bootstraps test frameworks if you don't have one. One command. |
| `/land-and-deploy` | **Release Engineer** | Merge the PR, wait for CI and deploy, verify production health. Takes over after `/ship`. One command from "approved" to "verified in production." |
| `/setup-deploy` | **Deploy Configurator** | One-time setup for `/land-and-deploy`. Detects your platform, production URL, and deploy commands. |

### 🎨 Design Skills

| Skill | Role | What It Does |
|-------|------|--------------|
| `/design-review` | **Designer Who Codes** | Same audit as /plan-design-review, then fixes what it finds. Atomic commits, before/after screenshots. |

### 🔒 Safety Skills

| Skill | What It Does |
|-------|-------------|
| `/careful` | **Safety Guardrails** — warns before destructive commands (rm -rf, DROP TABLE, force-push). Say "be careful" to activate. Override any warning. |
| `/freeze` | **Edit Lock** — restrict file edits to one directory. Prevents accidental changes outside scope while debugging. |
| `/guard` | **Full Safety** — `/careful` + `/freeze` in one command. Maximum safety for prod work. |
| `/unfreeze` | **Unlock** — remove the `/freeze` boundary. |

### 🔧 Utility Skills

| Skill | What It Does |
|-------|-------------|
| `/browse` | **QA Engineer** — Give the agent eyes. Real Chromium browser, real clicks, real screenshots. ~100ms per command. |
| `/setup-browser-cookies` | **Session Manager** — Import cookies from your real browser (Chrome, Arc, Brave, Edge) into the headless session. Test authenticated pages. |
| `/document-release` | **Technical Writer** — Update all project docs to match what you just shipped. Catches stale READMEs automatically. |
| `/retro` | **Eng Manager** — Team-aware weekly retro. Per-person breakdowns, shipping streaks, test health trends, growth opportunities. |
| `/spec-first-upgrade` | **Self-Updater** — upgrade spec-first to latest. Detects global vs vendored install, syncs both, shows what changed. |

---

## 💡 Key Features

### 1. `/office-hours` Reframes Your Product

You say "daily briefing app." It listens to your actual pain, pushes back on the framing, tells you you're really building a personal chief of staff AI, challenges your premises, and generates three implementation approaches with effort estimates. The design doc it writes feeds directly into `/plan-ceo-review` and `/plan-eng-review` — so every downstream skill starts with real clarity instead of a vague feature request.

### 2. Design Is at the Heart

`/design-consultation` doesn't just pick fonts. It researches what's out there in your space, proposes safe choices AND creative risks, generates realistic mockups of your actual product, and writes `DESIGN.md` — and then `/design-review` and `/plan-eng-review` read what you chose. Design decisions flow through the whole system.

### 3. `/qa` Was a Massive Unlock

It let me go from 6 to 12 parallel workers. Claude Code saying *"I SEE THE ISSUE"* and then actually fixing it, generating a regression test, and verifying the fix — that changed how I work. The agent has eyes now.

### 4. Smart Review Routing

Just like at a well-run startup: CEO doesn't have to look at infra bug fixes, design review isn't needed for backend changes. spec-first tracks what reviews are run, figures out what's appropriate, and just does the smart thing. The Review Readiness Dashboard tells you where you stand before you ship.

### 5. Test Everything

`/ship` bootstraps test frameworks from scratch if your project doesn't have one. Every `/ship` run produces a coverage audit. Every `/qa` bug fix generates a regression test. 100% test coverage is the goal — tests make vibe coding safe instead of yolo coding.

### 6. Ship to Production in One Command

`/land-and-deploy` picks up where `/ship` left off — merges your PR, waits for CI and deploy, then runs canary verification on your production URL. Auto-detects Fly.io, Render, Vercel, Netlify, Heroku, or GitHub Actions. If something breaks, it offers a revert. Pair with `/canary` for extended post-deploy monitoring and `/benchmark` to catch performance regressions before they ship.

### 7. Browser Handoff When the AI Gets Stuck

Hit a CAPTCHA, auth wall, or MFA prompt? `$B handoff` opens a visible Chrome at the exact same page with all your cookies and tabs intact. Solve the problem, tell Claude you're done, `$B resume` picks up right where it left off. The agent even suggests it automatically after 3 consecutive failures.

### 8. Multi-AI Second Opinion

`/codex` gets an independent review from OpenAI's Codex CLI — a completely different AI looking at the same diff. Three modes: code review with a pass/fail gate, adversarial challenge that actively tries to break your code, and open consultation with session continuity. When both `/review` (Claude) and `/codex` (OpenAI) have reviewed the same branch, you get a cross-model analysis showing which findings overlap and which are unique to each.

### 9. Safety Guardrails on Demand

Say "be careful" and `/careful` warns before any destructive command — rm -rf, DROP TABLE, force-push, git reset --hard. `/freeze` locks edits to one directory while debugging so Claude can't accidentally "fix" unrelated code. `/guard` activates both. `/investigate` auto-freezes to the module being investigated.

---

## 📊 Workflow

### Standard Development Process

```
Product Idea
   ↓
/office-hours (1-2 hours)
   ↓
/plan-ceo-review (30-60 minutes)
   ↓
/plan-eng-review (30-60 minutes)
   ↓
Implement Code (hours to days)
   ↓
/review (15-30 minutes)
   ↓
/qa (30-60 minutes)
   ↓
/ship (15-30 minutes)
   ↓
/land-and-deploy (15-30 minutes)
   ↓
/canary (30 minutes monitoring)
```

### Bug Fix Process

```
Find Issue
   ↓
/freeze (limit scope)
   ↓
/investigate (root cause analysis)
   ↓
Implement Fix
   ↓
/review (code review)
   ↓
/qa (verification)
   ↓
/ship (release)
```

---

## 📚 Complete Documentation

### User Manual

| Document | Content |
|----------|---------|
| [Quick Start](docs/用户手册/01-快速开始.md) | 10-minute guide |
| [Installation Guide](docs/用户手册/02-安装指南.md) | Detailed installation steps |
| [Skills List](docs/用户手册/04-技能列表.md) | All skills detailed |
| [Workflow](docs/用户手册/05-工作流程.md) | Recommended development process |
| [Configuration Guide](docs/用户手册/06-配置指南.md) | Customization options |
| [Best Practices](docs/用户手册/07-最佳实践.md) | Efficiency tips |
| [FAQ](docs/用户手册/08-常见问题.md) | 28 common questions |
| [Troubleshooting](docs/用户手册/09-故障排除.md) | Problem diagnosis |

### Developer Documentation

| Document | Content |
|----------|---------|
| [Custom Skills](docs/用户手册/10-自定义技能.md) | Create your own skills |
| [Contributing Guide](docs/用户手册/11-贡献指南.md) | How to contribute code |
| [Changelog](docs/用户手册/12-更新日志.md) | Version update history |
| [Architecture](ARCHITECTURE.md) | Design decisions and system internals |
| [Builder Ethos](ETHOS.md) | Builder philosophy: Boil the Lake, Search Before Building |

---

## 🔒 Privacy & Telemetry

Spec-First includes **opt-in** usage telemetry to help improve the project:

- **Default is off.** Nothing is sent anywhere unless you explicitly say yes.
- **On first run,** spec-first asks if you want to share anonymous usage data. You can say no.
- **What's sent (if you opt in):** skill name, duration, success/fail, spec-first version, OS. That's it.
- **What's never sent:** code, file paths, repo names, branch names, prompts, or any user-generated content.
- **Change anytime:** `spec-first-config set telemetry off` disables everything instantly.

Data is stored securely with row-level security policies restricting access to insert-only.

**Local analytics are always available.** Run `spec-first-analytics` to see your personal usage dashboard from the local JSONL file — no remote data needed.

---

## 🛠️ Troubleshooting

### Skill not showing up?

```bash
cd ~/.claude/skills/spec-first
./setup
```

### `/browse` fails?

```bash
cd ~/.claude/skills/spec-first
bun install
bun run build
```

### Stale install?

Run `/spec-first-upgrade` — or set `auto_upgrade: true` in `~/.spec-first/config.yaml`

### Windows users

Spec-First works on Windows 11 via Git Bash or WSL. Node.js is required in addition to Bun — Bun has a known bug with Playwright's pipe transport on Windows ([bun#4253](https://github.com/oven-sh/bun/issues/4253)). The browse server automatically falls back to Node.js. Make sure both `bun` and `node` are on your PATH.

### Claude says it can't see the skills?

Make sure your project's `CLAUDE.md` has a spec-first section. Add this:

```
## Spec-First Skills

Use /browse from spec-first for all web browsing. Never use mcp__claude-in-chrome__* tools.
Available skills: /office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review,
/design-consultation, /review, /ship, /browse, /qa, /qa-only, /design-review,
/setup-browser-cookies, /setup-deploy, /retro, /investigate, /document-release,
/codex, /careful, /freeze, /guard, /unfreeze, /spec-first-upgrade.
```

---

## 📄 License

MIT License. Free forever. Go build something.

---

## 🆘 Get Help

- **GitHub Issues**: [Submit Issue](https://github.com/your-org/spec-first/issues)
- **User Manual**: [Complete Docs](docs/用户手册/README.md)
- **Community**: Join the discussion

---

## 🎉 Acknowledgments

Spec-First's design philosophy is inspired by Y Combinator office hours, modern software engineering best practices, and cutting-edge exploration of AI-assisted development.

Special thanks to all contributors and early adopters whose feedback helped shape this tool.

---

**Start Your Spec-First Journey**: [Quick Start →](docs/用户手册/01-快速开始.md)

**中文版**: [README-CN.md](README-CN.md)

**Current Version**: v1.3.1.1 | **Last Updated**: 2026-03-22
