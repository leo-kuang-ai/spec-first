---
name: spec-strategy
description: "Create or update STRATEGY.md. Use when starting a product, changing direction or roadmap, or when spec-ideate, spec-brainstorm, or spec-plan need upstream product grounding."
argument-hint: "[optional: section to revisit, e.g. 'metrics' or 'approach']"
---

# Product Strategy

Note: Use the current date from the active host context. Use this when weighting external sources and dating artifacts.

`spec-strategy` writes and maintains its owned sections in the shared `STRATEGY.md` project document - a short, durable anchor document that captures what the product is, who it serves, how it succeeds, and where the team is investing. It lives at the repo root as a canonical, well-known file (peer of `README.md`). Downstream skills (`spec-ideate`, `spec-brainstorm`, `spec-plan`) read it as grounding when it exists.

The document is short and structured on purpose. Good answers to a handful of sharp questions produce a better strategy than any amount of prose. This skill asks those questions, pushes back on weak answers, and writes the doc.

## Boundaries

- Strategy is an anchor, not a plan; features, schedules, and implementation plans belong to their owning workflows.
- The repository grounds questions but never fills in the user's answers.
- 保留既有文档的形状和意义，只更新目标章节。带 `author-approved` 标记的章节和用户不拥有的文档不修改，报告冲突或在已获授权的独立文件中引用它；编辑既有文件前必须读取 `references/update-run.md`。
- Keep the document short and leave room for future changes.

## Interaction Method

Default to the platform's blocking question tool: `AskUserQuestion` in Claude Code (call `ToolSearch` with `select:AskUserQuestion` first if its schema isn't loaded), `request_user_input` in Codex. Fall back to numbered options in chat only when no blocking tool exists in the harness or the call errors (e.g., Codex edit modes) — not because a schema load is required. Never silently skip the question.

Ask one question at a time. Prefer free-form responses for the substantive sections (problem, approach, persona); reserve single-select for routing decisions (which section to revisit). Each option label must be self-contained.

## Grounding

开始 Phase 0、建立 repo model 之前必须读取 `references/grounding.md`。它定义来源、近期活动与产品意图的区别、空仓库路径，以及首个问题之前的有据摘要。

## Focus Hint

用户或上游 caller 传入的参数都是可选 focus hint：章节名或范围。按意义将 `positioning`/`approach` 对应 Our approach、`users`/`who it's for` 对应 Who it's for、`boundaries` 对应 Not working on；不因此重命名文档。没有 focus 时由文件状态决定路径。

## Core Principles

1. **Anchor, not plan.** Strategy is what the product is and why. Features belong in `spec-brainstorm`; schedules belong in the issue tracker. Do not let either creep into the doc. When declining such creep, name the destination explicitly (`spec-brainstorm` for features, the issue tracker for schedules) — a bare refusal or a generic "put it elsewhere" leaves the owner without a route.
2. **Rigor in the questions, not the headings.** The section headers are plain English. The interview questions enforce strategy discipline.
3. **Short is a feature.** The template is constrained. Adding sections costs more than it looks like. Push back on expansion.
4. **Durable across runs.** This skill is rerunnable. On a second run it updates in place, preserves what is working, and only challenges sections that look stale or weak.

## Execution Flow

### Phase 0: Route by File State

Read `STRATEGY.md` using the native file-read tool.

- **File does not exist** -> First run. Go to Phase 1.
- **File exists and argument names a specific section** -> Targeted update. Go to Phase 2.
- **File exists, no argument** -> Phase 2；由 update reference 在漂移摘要之后确定目标章节。

Announce the path in one line: "Strategy doc not found - let's write it." or "Found existing strategy - let's review and update."

### Phase 1: First-Run Interview

Read `references/interview.md`. This load is non-optional - the pushback rules, anti-pattern examples, and quality bar for each section live there. Improvising from memory produces a passive transcription instead of a strategy doc.

按以下顺序访谈；最终文档仍使用本地模板的章节顺序：

1. Target problem
2. Our approach
3. Who it's for
4. Key metrics
5. Tracks
6. Stress test（访谈检查，不生成新章节）
7. Not working on（新建 house-format 文档必填）
8. Milestones (optional)
9. Marketing (optional)

For each section, ask the opening question, apply the pushback rules, and capture the final answer in the user's own language. Do not skip the pushback step - it is the core of the skill. Two rounds of pushback per section maximum; capture what the user has given after that and note the section is worth revisiting on the next run.

前五项、stress test 和 Not working on 已有答案后，读取 `references/strategy-template.md`，按模板既有标题与顺序写草稿，展示并给一次编辑机会；当前明确授权覆盖草稿写入时可直接完成，不把可选反馈变成等待门。用户两轮后仍无法明确的部分照实记录并提示复访，不编造答案或阻塞整个访谈。

### Phase 2: Update Run

在摘要、漂移检查或提问之前，必须读取 `references/update-run.md`。它拥有文档形状、作者保护、漂移候选、目标选择和日期更新边界；未读不得编辑既有文件。所选章节的问题与最多两轮追问仍由 `references/interview.md` 提供。

### Phase 3: Downstream Handoff

After writing, note in one line where the file lives and that `spec-ideate`, `spec-brainstorm`, and `spec-plan` will pick it up as grounding on their next run.

If no downstream skill has run yet on this repo, suggest `spec-ideate` or `spec-brainstorm` skills as a next step.

## What This Skill Does Not Do

- Does not update the issue tracker or reconcile in-flight work. Strategy is the doc; execution lives elsewhere.
- Does not prioritize the backlog. Prioritization is a separate workflow.
- Does not write product requirements or implementation plans - those are `spec-brainstorm` and `spec-plan`.
- Does not compute metric values. It records which metrics matter and where they live, not what they read today.

## Learn More

The "Target problem / Our approach / Tracks" structure is informed by Richard Rumelt's *Good Strategy Bad Strategy* - specifically his kernel of diagnosis, guiding policy, and coherent action. The interview questions in `references/interview.md` are designed to push past the patterns he calls "bad strategy": fluff, goals dressed up as strategy, and feature lists in place of a guiding choice. The book is the recommended follow-up reading if the distinction between a slogan and a strategy is not yet sharp.
