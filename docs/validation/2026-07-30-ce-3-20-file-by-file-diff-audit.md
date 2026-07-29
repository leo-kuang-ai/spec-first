---
title: "CE 3.20.0 逐文件原始 Diff 审计"
date: "2026-07-30"
artifact_type: "confirmed-diff-audit"
target_repo: "spec-first"
upstream_repo: "compound-engineering-plugin"
upstream_range: "7f86be9d02679adeb93951587dee40de42c5bf82..1fac0442ee16996913dd0843a063ac279d2c32f4"
---

# CE 3.20.0 逐文件原始 Diff 审计

## 结论

本报告对固定 Git 区间内全部 422 个路径逐条读取原始 diff，并对 A/M/D、行变化、完整文件结构、契约关键词、函数/状态/flag 做独立记录。目录级裁决不能替代下列文件记录；每条路径只出现一次。上游 diff 是事实来源，spec-first 当前 canonical source、contracts 与 tests 决定吸收方式。

- 覆盖：422/422。核心实施目标为 215 个 `skills/**` 文件、19 个 CLI/转换/安装 Runtime 文件和 3 个支撑文件；另有 185 个上游文档、tests/fixtures、插件元数据与发布支撑文件逐条作为设计或验证证据审计。
- 权威区间：`7f86be9d02679adeb93951587dee40de42c5bf82..1fac0442ee16996913dd0843a063ac279d2c32f4`。
- 审计方法：每个 exact path 读取 `git diff --unified=0`；A/M 读取目标 revision 全文件，D 读取基线 revision 全文件；Markdown 扫描完整标题层级，代码扫描完整函数/类型/状态/flag；再按 spec-first owner 做语义裁决。
- 边界：不把 CE provider 闭列表、中央 controller、`docs_root`、generic `/tmp` continuity 或 generated runtime mirror 提升为 spec-first source。

## 逐文件账本

### F001. `.compound-engineering/config.local.example.yaml`
- **原始 diff：** `M`，`+70/-11`，实际变更行 81。
- **实际变化：** 配置示例从 Claude/Fable 布尔开关扩为 docs_root、模型提升、cross-model peer、PR babysit 与 work engine 偏好；其中仅安全诊断主题可映射，CE 产品键不照搬。
- **spec-first owner / 裁决：** .spec-first/config.local.example.yaml + runtime setup facts；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** schema/解析 round-trip、invalid/unknown/retired 值负例和 downstream consumer。

### F002. `.gitattributes`
- **原始 diff：** `A`，`+10/-0`，实际变更行 10。
- **实际变化：** 新增 bundled shell/Python/无扩展名可执行脚本的 LF 规则，避免 Windows CRLF 破坏 shebang 与解析。
- **spec-first owner / 裁决：** .gitattributes + package tests；`直接同步不变量`。
- **理由与验证面：** `git check-attr eol`、package tarball 行尾与 Windows smoke。

### F003. `.opencode/plugins/compound-engineering.js`
- **原始 diff：** `M`，`+57/-0`，实际变更行 57。
- **实际变化：** OpenCode 插件新增仅解析文件头 frontmatter 的 Skill 命令发现和注册，保留既有命令不覆盖。
- **spec-first owner / 裁决：** src/cli/adapters/opencode.js + plugin manifest/init；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** current adapter/converter/ownership 单测、collision/no-follow、所有实际 supported hosts 回归。

### F004. `package.json`
- **原始 diff：** `M`，`+4/-3`，实际变更行 7。
- **实际变化：** 调整并行测试/严格插件校验并增加 codex:dev 入口；spec-first 只消费本计划真实需要的测试和打包项。
- **spec-first owner / 裁决：** package/test/build owner；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** test script existence、package inventory、build dry-run；不引入 orphan `codex:dev`。

### F005. `scripts/codex-dev.ts`
- **原始 diff：** `A`，`+8/-0`，实际变更行 8。
- **实际变化：** 新增 Codex 本地开发薄入口，转调 src/dev/codex-dev.ts；spec-first 明确不采纳产品专用切换脚本。
- **spec-first owner / 裁决：** 不采纳；现有开发安装路径；`明确不采纳`。
- **理由与验证面：** package scripts、build inventory和本地源码安装路径；确认不新增orphan `codex:dev`入口，也不把开发切换脚本打入产品包。

### F006. `skills/ce-babysit-pr/SKILL.md`
- **原始 diff：** `A`，`+247/-0`，实际变更行 247。
- **实际变化：** ce-babysit-pr 的入口/工作流契约按该文件原始 diff 独立校准；标题变化=# Babysit a PR / ## Non-negotiable boundaries / ## Security / ## The core principle / ## Prerequisites / ## Step 1: Confirm GitHub, resolve the PR, pick an execution mode；新增条款摘录=“description: "Babysits or watches an open GitHub PR until merge-ready, continuously reacting to review comments, CI failures, and routine base movement…”、“argument-hint: "[PR number, URL, or blank for current branch's PR] [watch/checkpoint] [duration]"”。
- **spec-first owner / 裁决：** spec-lfg + spec-commit-push-pr；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F007. `skills/ce-babysit-pr/references/watch-loop.md`
- **原始 diff：** `A`，`+186/-0`，实际变更行 186。
- **实际变化：** ce-babysit-pr 的reference contract按该文件原始 diff 独立校准；标题变化=# Watch loop — scheduling, state, dedup, edge cases / ## How the watch sustains itself / ## Cadence (the watch interval) / ## Pipeline mode bound ('mode:pipeline') / ## Non-convergence (trigger → route → park → re-open) / ## On-disk state contract；新增条款摘录=“- **'pr-snapshot watch'** is that detector — same fetch→diff on an interval, **no agent tokens**, prints one 'BABYSIT_WAKE {reason,url,...}' line *only* on…”、“- At the fixed deadline, the final refresh preserves 'terminal' and already-settled 'merge-ready' stops; 'max-runtime' outranks every non-terminal…”。
- **spec-first owner / 裁决：** spec-lfg + spec-commit-push-pr；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F008. `skills/ce-babysit-pr/scripts/pr-snapshot`
- **原始 diff：** `A`，`+2195/-0`，实际变更行 2195。
- **实际变化：** 新增 PR snapshot/watch/mark 状态机，覆盖 head/base、review 生命周期、CI trajectory、chain、active-time budget 和 generation lock。
- **spec-first owner / 裁决：** spec-lfg + spec-commit-push-pr；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** 脚本语法、退出码/错误证据、路径含空格、LF、私有 scratch 与 focused fixture。

### F009. `skills/ce-brainstorm/SKILL.md`
- **原始 diff：** `M`，`+85/-22`，实际变更行 107。
- **实际变化：** ce-brainstorm 的入口/工作流契约按该文件原始 diff 独立校准；标题变化=## Artifact Root / #### 0.4 Surface the Workflow Spine；新增条款摘录=“Brainstorming helps answer **WHAT** to build through collaborative dialogue. It precedes 'ce-plan', which enriches the same unified plan artifact with **HOW**…”、“The durable output of this workflow is a **requirements-only unified plan**. In other workflows this might be called a lightweight PRD or feature brief. In…”；删除条款摘录=“Brainstorming helps answer **WHAT** to build through collaborative dialogue. It precedes '/ce-plan', which enriches the same unified plan artifact with **HOW**…”、“The durable output of this workflow is a **requirements-only unified plan**. In other workflows this might be called a lightweight PRD or feature brief. In…”。
- **spec-first owner / 裁决：** spec-brainstorm；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F010. `skills/ce-brainstorm/references/agents/repo-profiler.md`
- **原始 diff：** `D`，`+0/-31`，实际变更行 31。
- **实际变化：** 删除仅为 cache miss 服务的 repo-profiler persona；当前仓库画像回到当轮 research/orientation。
- **spec-first owner / 裁决：** spec-brainstorm；`直接同步删除`。
- **理由与验证面：** 双 worktree/branch 新鲜度、无 cache I/O、仍有 current-source grounding。

### F011. `skills/ce-brainstorm/references/brainstorm-sections.md`
- **原始 diff：** `M`，`+96/-13`，实际变更行 109。
- **实际变化：** ce-brainstorm 的reference contract按该文件原始 diff 独立校准；标题变化=## Ready for Planning Check；新增条款摘录=“downstream artifacts ('ce-plan', the commit message, '<root>/solutions/')”、“**One owner per rule; cite, don't restate.** A normative rule — a gate, cap,”；删除条款摘录=“downstream artifacts ('ce-plan', the commit message, 'docs/solutions/')”、“parenthetical, or a requirement specifying two outcomes, fails the test — split”。
- **spec-first owner / 裁决：** spec-brainstorm；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F012. `skills/ce-brainstorm/references/handoff.md`
- **原始 diff：** `M`，`+11/-7`，实际变更行 18。
- **实际变化：** ce-brainstorm 的reference contract按该文件原始 diff 独立校准；新增条款摘录=“Planning and shipping will use this artifact as the definition of what to build. # omit line if no artifact was created”、“The override sentence is load-bearing, not padding: the planning options are hidden while 'Resolve Before Planning' is non-empty, so without it the user is…”；删除条款摘录=“('/tmp/compound-engineering/ce-brainstorm/<run-id>/grounding.md') — it gives”。
- **spec-first owner / 裁决：** spec-brainstorm；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F013. `skills/ce-brainstorm/references/html-rendering.md`
- **原始 diff：** `M`，`+12/-3`，实际变更行 15。
- **实际变化：** ce-brainstorm 的reference contract按该文件原始 diff 独立校准；新增条款摘录=“'session-settled:' annotation renders as visible text in the card —”、“never an attribute or hidden markup — stem preserved verbatim so”。
- **spec-first owner / 裁决：** spec-brainstorm；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F014. `skills/ce-brainstorm/references/markdown-rendering.md`
- **原始 diff：** `M`，`+10/-4`，实际变更行 14。
- **实际变化：** ce-brainstorm 的reference contract按该文件原始 diff 独立校准；新增条款摘录=“existing numbered ones. A 'session-settled:' annotation renders as part”。
- **spec-first owner / 裁决：** spec-brainstorm；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F015. `skills/ce-brainstorm/references/reasoning-elevation.md`
- **原始 diff：** `M`，`+90/-40`，实际变更行 130。
- **实际变化：** ce-brainstorm 的reference contract按该文件原始 diff 独立校准；标题变化=# Model Elevation / ## Activation resolution (runs on every harness) / ## Adapter selection / ## Read-only posture and brief handoff / ## Off-host dispatch (Claude CLI route) / ## Recovery (R13, R14, R21)；新增条款摘录=“Elevation dispatches the one reasoning-heaviest step to a **user-chosen model**, so a user on a cheaper session model still gets a high-reasoning result…”、“The elevated steps: **ce-plan** — interpret research findings and author the plan, folded into one interpret-then-author call. **ce-brainstorm** — generate…”；删除条款摘录=“This reference is loaded ONLY after a positive Claude Code host check (the gate below). It carries the entire elevation engine; the calling 'SKILL.md' holds…”、“Elevation dispatches the reasoning-heavy authoring/interpretation step to a higher-reasoning model (in Claude Code, **Fable**) via a subagent, so a user on a…”。
- **spec-first owner / 裁决：** spec-brainstorm；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F016. `skills/ce-brainstorm/references/repo-profile-cache.md`
- **原始 diff：** `D`，`+0/-63`，实际变更行 63。
- **实际变化：** 删除共享 repo profile cache 协议、key/freshness/degradation 说明，避免缓存继续成为 Skill 输入契约。
- **spec-first owner / 裁决：** spec-brainstorm；`直接同步删除`。
- **理由与验证面：** 双 worktree/branch 新鲜度、无 cache I/O、仍有 current-source grounding。

### F017. `skills/ce-brainstorm/references/settled-decisions.md`
- **原始 diff：** `A`，`+45/-0`，实际变更行 45。
- **实际变化：** ce-brainstorm 的reference contract按该文件原始 diff 独立校准；标题变化=# Session-Settled Decisions / ## The settlement test / ## Provenance classes / ## The annotation / ## Capture rules / ## Brief entries (pipeline input)；新增条款摘录=“Protocol and schema for carrying decisions the user already made in the invoking conversation, so this skill augments them instead of re-litigating them. This…”、“- **Directive** — the user asserted a choice no one examined (e.g., a cold "build it with X"). Not settled. It receives exactly one in-pipeline challenge,…”。
- **spec-first owner / 裁决：** spec-brainstorm；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F018. `skills/ce-brainstorm/references/synthesis-summary.md`
- **原始 diff：** `M`，`+15/-4`，实际变更行 19。
- **实际变化：** ce-brainstorm 的reference contract按该文件原始 diff 独立校准；新增条款摘录=“A session-settled decision (per 'references/settled-decisions.md') is **Stated with provenance** — record it in the Stated bucket with its class, rejected…”、“Session-settled decisions render as 'Carrying forward:' lines — one line each, placed before Call outs (where Call outs would sit when none survive): 'Carrying…”；删除条款摘录=“Then the confirmation: *"Confirm and I'll write the requirements-only plan next, drawing on our dialogue and this synthesis. Or tell me what to change."* The…”。
- **spec-first owner / 裁决：** spec-brainstorm；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F019. `skills/ce-brainstorm/references/universal-brainstorming.md`
- **原始 diff：** `M`，`+2/-2`，实际变更行 4。
- **实际变化：** 小型定点修改；新增条款摘录=“'<root>/plans/' from this route. If the user wants a durable next artifact, hand”、“- **Create a plan** → hand off to 'ce-plan' with the decided goal and constraints; let 'ce-plan' choose the universal/knowledge-work artifact shape, not the software…”；删除条款摘录=“'docs/plans/' from this route. If the user wants a durable next artifact, hand”、“- **Create a plan** → hand off to '/ce-plan' with the decided goal a”；完整 diff 已逐行核对。
- **spec-first owner / 裁决：** spec-brainstorm；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F020. `skills/ce-brainstorm/references/verdict-routing.md`
- **原始 diff：** `M`，`+6/-6`，实际变更行 12。
- **实际变化：** 小型定点修改；新增条款摘录=“Name 'ce-pov' by what it does for the user (it gives you a project-grounded verdict on the candidate), never as internal machinery — not 'a sibling workflow,' not…”、“On accept, **invoke the 'ce-pov' skill** — the same way the Phase 4 handof”；完整 diff 已逐行核对。
- **spec-first owner / 裁决：** spec-brainstorm；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F021. `skills/ce-brainstorm/references/visual-probes.md`
- **原始 diff：** `M`，`+18/-6`，实际变更行 24。
- **实际变化：** ce-brainstorm 的reference contract按该文件原始 diff 独立校准；新增条款摘录=“SCRATCH_ROOT="/tmp/compound-engineering-$(id -u)";”、“if [ -L "$SCRATCH_ROOT" ]; then echo "unsafe scratch root symlink: $SCRATCH_ROOT" >&2; exit 1; fi;”；删除条款摘录=“node "$SKILL_DIR/scripts/visual-probe-server.js" start --root /tmp/compound-engineering/ce-brainstorm-visual/<run-id>”、“node "$SKILL_DIR/scripts/visual-probe-server.js" status --root /tmp/compound-engineering/ce-brainstorm-visual/<run-id>”。
- **spec-first owner / 裁决：** spec-brainstorm；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F022. `skills/ce-brainstorm/scripts/elevation-dispatch.sh`
- **原始 diff：** `A`，`+274/-0`，实际变更行 274。
- **实际变化：** 新增 plan/brainstorm 高推理步骤的模型提升 adapter，记录 requested/actual model 并在 route/receipt 失败时回退当前会话。
- **spec-first owner / 裁决：** spec-brainstorm；`明确不采纳（首波）`。
- **理由与验证面：** 脚本语法、退出码/错误证据、路径含空格、LF、私有 scratch 与 focused fixture。

### F023. `skills/ce-brainstorm/scripts/peer-job-runner.py`
- **原始 diff：** `A`，`+1844/-0`，实际变更行 1844。
- **实际变化：** 新增 detached peer supervisor 的 start/status/wait/result/reap 全生命周期，含私有目录、owner、timeout、size cap、进程树终止和 Windows 等价路径。
- **spec-first owner / 裁决：** spec-brainstorm；`明确不采纳（首波）`。
- **理由与验证面：** start/status/wait/result/reap、owner/symlink、timeout/size cap、Windows、byte parity 或 orphan-negative。

### F024. `skills/ce-brainstorm/scripts/repo-profile-cache.py`
- **原始 diff：** `D`，`+0/-418`，实际变更行 418。
- **实际变化：** 删除跨 run/worktree 的 repo profile cache 实现，grounding 改由当轮 current source 直接取得。
- **spec-first owner / 裁决：** spec-brainstorm；`直接同步删除`。
- **理由与验证面：** 双 worktree/branch 新鲜度、无 cache I/O、仍有 current-source grounding。

### F025. `skills/ce-code-review/SKILL.md`
- **原始 diff：** `M`，`+127/-409`，实际变更行 536。
- **实际变化：** ce-code-review 的入口/工作流契约按该文件原始 diff 独立校准；标题变化=## Artifact Root / ## Execution spine / ## Task Visibility / ### Stage 2c: Keep grounding review-specific / ### Stage 3d: Bind the adversarial route and final roster / ### Stage 4: Dispatch and collect reviewers；新增条款摘录=“description: "Structured code review for bugs, regressions, tests, and standards. Use before PRs or when asked for review; report-only by default, with…”、“argument-hint: "[mode:agent] [apply:local] [blank to review current branch, or provide PR link]"”；删除条款摘录=“description: "Structured code review for bugs, regressions, tests, and standards. Use before PRs or when asked for review; interactive mode can fix locally,…”、“argument-hint: "[mode:agent] [blank to review current branch, or provide PR link]"”。
- **spec-first owner / 裁决：** spec-code-review；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F026. `skills/ce-code-review/references/action-class-rubric.md`
- **原始 diff：** `M`，`+1/-1`，实际变更行 2。
- **实际变化：** 小型定点修改；删除条款摘录=“'autofix_class' describes the **intrinsic shape** of follow-up work — it is signal, **not an apply gate or permission**. In 'mode:agent' the caller interprets findings…”；完整 diff 已逐行核对。
- **spec-first owner / 裁决：** spec-code-review；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F027. `skills/ce-code-review/references/agents/repo-profiler.md`
- **原始 diff：** `D`，`+0/-31`，实际变更行 31。
- **实际变化：** 删除仅为 cache miss 服务的 repo-profiler persona；当前仓库画像回到当轮 research/orientation。
- **spec-first owner / 裁决：** spec-code-review；`直接同步删除`。
- **理由与验证面：** 双 worktree/branch 新鲜度、无 cache I/O、仍有 current-source grounding。

### F028. `skills/ce-code-review/references/cross-model-eval.md`
- **原始 diff：** `A`，`+75/-0`，实际变更行 75。
- **实际变化：** ce-code-review 的reference contract按该文件原始 diff 独立校准；标题变化=# Cross-Model Adversarial Pass — Skill-Creator Eval Spec / ## Eval cases / ## Pass criteria；新增条款摘录=“This is the load-bearing behavioral eval for ce-code-review's cross-model”、“adversarial pass. Deterministic route tests cover the worker; these cases cover”。
- **spec-first owner / 裁决：** spec-code-review；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F029. `skills/ce-code-review/references/cross-model-review.md`
- **原始 diff：** `M`，`+127/-34`，实际变更行 161。
- **实际变化：** ce-code-review 的reference contract按该文件原始 diff 独立校准；标题变化=## Step 1 — Attest host identity, then sanction one fixed route / ## Step 2 — Provider model + reasoning tier (owned by the script) / ## Step 3 — Announce / ## Step 4 — Start the detached peer job before local dispatch / ## Step 5 — Fold into Stage 5 / ## Trust boundary (maintainers)；新增条款摘录=“Runs the **adversarial** review through one separately routed model target in a read-only process. The peer gets the **same**…”、“This pass is **adversarial-only**. No other persona gets a cross-model twin, and there is no whole-diff generalist peer. Cost stays gated on the existing Stage…”；删除条款摘录=“Runs the adversarial review through a **different model family than the host**, in a separate read-only process, so its findings are independent of the…”、“All the invocation detail (composing the prompt from the persona, read-only flags, per-peer timeouts, capturing schema-shaped JSON) lives in the bundled script…”。
- **spec-first owner / 裁决：** spec-code-review；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F030. `skills/ce-code-review/references/diff-scope.md`
- **原始 diff：** `M`，`+13/-1`，实际变更行 14。
- **实际变化：** 新增 tool-adaptive 证据检索层级（symbol-aware → AST → text），并要求 exhaustive claim 在 grep-only/动态分发边界下降级；pre-existing 判断补短 provenance。
- **spec-first owner / 裁决：** spec-code-review；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F031. `skills/ce-code-review/references/dispatch-reviewers.md`
- **原始 diff：** `A`，`+111/-0`，实际变更行 111。
- **实际变化：** ce-code-review 的reference contract按该文件原始 diff 独立校准；标题变化=### Stage 4: Spawn sub-agents / #### Inline fast pass (emit before the reviewer queue) / #### Model tiering / #### Run ID / #### Spawning / #### Cross-model adversarial pass；新增条款摘录=“To surface findings in seconds, **immediately before the first foreground reviewer dispatch** the orchestrator does a quick first-principles scan of the diff…”、“Scan only for **high-signal, obvious** issues a careful first read catches: data/SQL safety, injection (shell/SQL/LLM-output trust boundary), broken control…”。
- **spec-first owner / 裁决：** spec-code-review；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F032. `skills/ce-code-review/references/findings-schema.json`
- **原始 diff：** `M`，`+1/-37`，实际变更行 38。
- **实际变化：** ce-code-review 的reference contract按该文件原始 diff 独立校准；新增条款摘录=“"description": "Code-grounded evidence: snippets, line references, or pattern descriptions. At least 1 item. For any finding at confidence anchor 75 or 100,…”；删除条款摘录=“"description": "Code-grounded evidence: snippets, line references, or pattern descriptions. At least 1 item. For any finding at confidence anchor 75 or 100,…”、“"description": "Confidence is one of 5 discrete anchors (0, 25, 50, 75, 100), each tied to a behavioral criterion the reviewer can honestly self-apply. Float…”。
- **spec-first owner / 裁决：** spec-code-review；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** schema/解析 round-trip、invalid/unknown/retired 值负例和 downstream consumer。

### F033. `skills/ce-code-review/references/finish-review.md`
- **原始 diff：** `A`，`+194/-0`，实际变更行 194。
- **实际变化：** ce-code-review 的reference contract按该文件原始 diff 独立校准；标题变化=### Stage 5: Merge findings / ### Stage 5b: Validation pass (optional quality gate) / ### Stage 5c: Act on findings (explicit local apply only) / ### Stage 6: Synthesize and present / ### JSON output format ('mode:agent' only) / ## Quality Gates；新增条款摘录=“Convert multiple reviewer compact JSON returns into one deduplicated, confidence-gated finding set. Use 'scripts/findings-mechanics.py' from this skill's…”、“Write the compact reviewer returns as a JSON array, then run the command below exactly. Do not inspect the helper source or run its '--help'; its contract is…”。
- **spec-first owner / 裁决：** spec-code-review；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F034. `skills/ce-code-review/references/persona-catalog.md`
- **原始 diff：** `M`，`+23/-20`，实际变更行 43。
- **实际变化：** ce-code-review 的reference contract按该文件原始 diff 独立校准；标题变化=## Core and standards gate / ## Generic conditional / ## Always-on (4 structured personas + 2 local prompt assets)；新增条款摘录=“Correctness is spawned on every multi-agent review. Project-standards is spawned only when Stage 3b finds at least one applicable standards file, or when…”、“/---------/-------/-------/”；删除条款摘录=“13 reviewer personas organized into always-on, cross-cutting conditional, and stack-specific conditional layers, plus CE-specific local prompt assets. The…”、“Spawned on every review regardless of diff content.”。
- **spec-first owner / 裁决：** spec-code-review；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F035. `skills/ce-code-review/references/personas/adversarial-reviewer.md`
- **原始 diff：** `M`，`+2/-0`，实际变更行 2。
- **实际变化：** 小型定点修改；新增条款摘录=“**Large-diff recovery:** If the diff is too large to consume safely or arrives as a selectively readable artifact, do not reconstruct or load it wholesale. Follow the…”；完整 diff 已逐行核对。
- **spec-first owner / 裁决：** spec-code-review；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F036. `skills/ce-code-review/references/personas/learnings-researcher.md`
- **原始 diff：** `M`，`+15/-15`，实际变更行 30。
- **实际变化：** ce-code-review 的persona contract按该文件原始 diff 独立校准；新增条款摘录=“The '<root>/solutions/' directory contains documented learnings with YAML frontmatter. When there may be hundreds of files, use this efficient strategy that…”、“> **Grep/Glob fallback:** If 'Grep' or 'Glob' aren't in your runtime schema, fall back to 'Bash' (e.g., 'rg -li', 'find') against '<root>/solutions/' with the…”；删除条款摘录=“The 'docs/solutions/' directory contains documented learnings with YAML frontmatter. When there may be hundreds of files, use this efficient strategy that…”、“> **Grep/Glob fallback:** If 'Grep' or 'Glob' aren't in your runtime schema, fall back to 'Bash' (e.g., 'rg -li', 'find') against 'docs/solutions/' with the…”。
- **spec-first owner / 裁决：** spec-code-review；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F037. `skills/ce-code-review/references/personas/project-standards-reviewer.md`
- **原始 diff：** `M`，`+1/-1`，实际变更行 2。
- **实际变化：** 小型定点修改；新增条款摘录=“- **Protected artifact violations** -- findings, suggestions, or instructions that recommend deleting or gitignoring files in paths the standards designate as protected…”；删除条款摘录=“- **Protected artifact violations** -- findings, suggestions, or instructions that recommend deleting or gitignoring files in paths the standards designate as protected…”；完整 diff 已逐行核对。
- **spec-first owner / 裁决：** spec-code-review；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F038. `skills/ce-code-review/references/personas/testing-reviewer.md`
- **原始 diff：** `M`，`+1/-1`，实际变更行 2。
- **实际变化：** 把会改变 runtime/error 行为的配置变更纳入“行为变化无测试”检查，仅排除不改 runtime 的 metadata/config。
- **spec-first owner / 裁决：** spec-code-review；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F039. `skills/ce-code-review/references/repo-profile-cache.md`
- **原始 diff：** `D`，`+0/-63`，实际变更行 63。
- **实际变化：** 删除共享 repo profile cache 协议、key/freshness/degradation 说明，避免缓存继续成为 Skill 输入契约。
- **spec-first owner / 裁决：** spec-code-review；`直接同步删除`。
- **理由与验证面：** 双 worktree/branch 新鲜度、无 cache I/O、仍有 current-source grounding。

### F040. `skills/ce-code-review/references/review-output-template.md`
- **原始 diff：** `M`，`+11/-9`，实际变更行 20。
- **实际变化：** ce-code-review 的reference contract按该文件原始 diff 独立校准；标题变化=### Applied (explicit local apply; safe, verified) / ### Applied (safe, verified)；新增条款摘录=“Detail lines for Pre-existing and history-dependent P0/P1 findings may include the same short provenance string the artifact 'evidence' carries (e.g.…”、“- **Applied section (explicit local apply only)** -- when Stage 5c was authorized and applied fixes, list them first, before the severity tables, as '# / File…”；删除条款摘录=“- **Applied section (default mode only)** -- when the review applied fixes (Stage 5c), list them first, before the severity tables, as '# / File / Fix /…”、“When 'mode:agent' is active, **do not** emit the markdown table report above. Emit **one parseable JSON object** as the primary response and write the same…”。
- **spec-first owner / 裁决：** spec-code-review；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F041. `skills/ce-code-review/references/subagent-template.md`
- **原始 diff：** `M`，`+6/-4`，实际变更行 10。
- **实际变化：** 小型定点修改；新增条款摘录=“- **'25' — Somewhat confident.** Might be a real issue but could also be a false positive; you could not verify from the diff and surrounding code alone. **Do not emit —…”；完整 diff 已逐行核对。
- **spec-first owner / 裁决：** spec-code-review；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F042. `skills/ce-code-review/references/validator-batch-template.md`
- **原始 diff：** `A`，`+36/-0`，实际变更行 36。
- **实际变化：** 新增独立 validator 批处理模板：正常上限 8，但所有 surviving P0/P1 必须一次覆盖；逐 finding 返回完整 JSON verdict。
- **spec-first owner / 裁决：** spec-code-review；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F043. `skills/ce-code-review/references/validator-template.md`
- **原始 diff：** `M`，`+2/-2`，实际变更行 4。
- **实际变化：** 单 finding validator 增加 reviewed-tree/remote-head provenance 规则，历史证据缺失只降低理由置信而不机械否决。
- **spec-first owner / 裁决：** spec-code-review；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F044. `skills/ce-code-review/scripts/cross-model-adversarial-review.sh`
- **原始 diff：** `M`，`+768/-144`，实际变更行 912。
- **实际变化：** 跨模型审查 adapter 增加 provider/model/effort receipt、allowlist、空 diff、过大结果恢复和 scoped failure fallback。
- **spec-first owner / 裁决：** spec-code-review；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** 脚本语法、退出码/错误证据、路径含空格、LF、私有 scratch 与 focused fixture。

### F045. `skills/ce-code-review/scripts/findings-mechanics.py`
- **原始 diff：** `A`，`+252/-0`，实际变更行 252。
- **实际变化：** 新增 findings schema、精确 fingerprint 去重、reviewer 合并、稳定排序与低置信度机械处理；不做语义等价裁决。
- **spec-first owner / 裁决：** spec-code-review；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** 脚本语法、退出码/错误证据、路径含空格、LF、私有 scratch 与 focused fixture。

### F046. `skills/ce-code-review/scripts/peer-job-runner.py`
- **原始 diff：** `A`，`+1844/-0`，实际变更行 1844。
- **实际变化：** 新增 detached peer supervisor 的 start/status/wait/result/reap 全生命周期，含私有目录、owner、timeout、size cap、进程树终止和 Windows 等价路径。
- **spec-first owner / 裁决：** spec-code-review；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** start/status/wait/result/reap、owner/symlink、timeout/size cap、Windows、byte parity 或 orphan-negative。

### F047. `skills/ce-code-review/scripts/repo-profile-cache.py`
- **原始 diff：** `D`，`+0/-418`，实际变更行 418。
- **实际变化：** 删除跨 run/worktree 的 repo profile cache 实现，grounding 改由当轮 current source 直接取得。
- **spec-first owner / 裁决：** spec-code-review；`直接同步删除`。
- **理由与验证面：** 双 worktree/branch 新鲜度、无 cache I/O、仍有 current-source grounding。

### F048. `skills/ce-code-review/scripts/review-scope.py`
- **原始 diff：** `A`，`+202/-0`，实际变更行 202。
- **实际变化：** 新增确定性 review scope helper：endpoint、merge-base、可执行行数、path signals、lite eligibility，未知时 fail closed。
- **spec-first owner / 裁决：** spec-code-review；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** 脚本语法、退出码/错误证据、路径含空格、LF、私有 scratch 与 focused fixture。

### F049. `skills/ce-commit-push-pr/SKILL.md`
- **原始 diff：** `M`，`+44/-32`，实际变更行 76。
- **实际变化：** ce-commit-push-pr 的入口/工作流契约按该文件原始 diff 独立校准；标题变化=## Artifact Root / ### Context fallback；新增条款摘录=“argument-hint: "[PR ref] [mode:pipeline] [archive:on/off] [branding:on/off] [babysit:off/continuous/checkpoint]"”、“- **Description update** — user wants to refresh/rewrite an existing PR's description with no commit/push intent. Determine PR presence with the same rule used…”；删除条款摘录=“argument-hint: "[PR ref] [mode:pipeline] [archive:on/off]"”、“- **Description update** — user wants to refresh/rewrite an existing PR's description with no commit/push intent. If no open PR, report and stop. Otherwise run…”。
- **spec-first owner / 裁决：** spec-commit-push-pr；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F050. `skills/ce-commit-push-pr/references/pr-description-writing.md`
- **原始 diff：** `M`，`+25/-16`，实际变更行 41。
- **实际变化：** ce-commit-push-pr 的reference contract按该文件原始 diff 独立校准；标题变化=## Project PR-body contract / ## Step D: Generic Compound Engineering branding / ## Step D: Badge；新增条款摘录=“Before composing, resolve PR-body requirements from the project's active instructions and conventions already in context, then check the standard repository…”、“Before composing anything, build a compact internal **scope map** from the **complete oneline commit list and final three-dot diff**. Use the oneline subjects…”；删除条款摘录=“Before sizing, name the change's **material claims** — what became possible, what was fixed, what risk changed, what design decision the reviewer must assess —…”、“**Archival hook:** when the skill's Step 5 confirms the apply and 'pr_teaching_archive' is on (full workflow only), the teaching content is also written to…”。
- **spec-first owner / 裁决：** spec-commit-push-pr；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F051. `skills/ce-commit/SKILL.md`
- **原始 diff：** `M`，`+13/-30`，实际变更行 43。
- **实际变化：** ce-commit 的入口/工作流契约按该文件原始 diff 独立校准；标题变化=### Context fallback；新增条款摘录=“Gather the working-tree context by running each command below as its **own** shell tool call — a single argv-style invocation (just the program and its…”、“/ --- / --- / --- /”；删除条款摘录=“**On platforms other than Claude Code**, skip to the "Context fallback" section below and run the command there to gather context.”、“!'git branch --show-current'”。
- **spec-first owner / 裁决：** spec-commit；`直接同步`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F052. `skills/ce-compound-refresh/SKILL.md`
- **原始 diff：** `M`，`+35/-21`，实际变更行 56。
- **实际变化：** ce-compound-refresh 的入口/工作流契约按该文件原始 diff 独立校准；标题变化=## Artifact Root；新增条款摘录=“description: Refresh the repo's captured learnings against the current codebase. Use when auditing stale, overlapping, superseded, or drifted learnings; avoid…”、“If invoked specifically to create or bootstrap 'CONCEPTS.md' (e.g., "create a CONCEPTS.md", "build the concept map", "set up shared vocabulary"), the intent is…”；删除条款摘录=“description: Refresh docs/solutions learnings against the current codebase. Use when auditing stale, overlapping, superseded, or drifted learnings; avoid…”、“Check if '$ARGUMENTS' contains 'mode:headless'. If present, strip it from arguments (use the remainder as a scope hint) and run in **headless mode**.”。
- **spec-first owner / 裁决：** spec-compound-refresh；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F053. `skills/ce-compound-refresh/assets/resolution-template.md`
- **原始 diff：** `M`，`+2/-2`，实际变更行 4。
- **实际变化：** 模板 category 提示从固定 docs/solutions 改为已解析 root 下的 solutions 子目录；spec-first 固定 docs/solutions，不采纳全局 root。
- **spec-first owner / 裁决：** spec-compound-refresh；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F054. `skills/ce-compound-refresh/references/concepts-vocabulary.md`
- **原始 diff：** `M`，`+1/-1`，实际变更行 2。
- **实际变化：** CONCEPTS vocabulary 的学习引用从固定 docs/solutions 改为 <root>/solutions；spec-first 保持当前固定 owner。
- **spec-first owner / 裁决：** spec-compound-refresh；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F055. `skills/ce-compound-refresh/references/per-action-flows.md`
- **原始 diff：** `M`，`+13/-6`，实际变更行 19。
- **实际变化：** ce-compound-refresh 的reference contract按该文件原始 diff 独立校准；新增条款摘录=“3. **Validate parser-safety of the new learning's frontmatter** to catch silent-corruption issues the prose rules miss: malformed '---' delimiter lines,…”、“if [ -f "$SKILL_DIR/scripts/validate-frontmatter.py" ]; then”；删除条款摘录=“3. **Validate parser-safety of the new learning's frontmatter** to catch silent-corruption issues the prose rules miss: malformed '---' delimiter lines,…”、“if [ -n "${CLAUDE_SKILL_DIR}" ] && [ -f "${CLAUDE_SKILL_DIR}/scripts/validate-frontmatter.py" ]; then”。
- **spec-first owner / 裁决：** spec-compound-refresh；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F056. `skills/ce-compound-refresh/references/schema.yaml`
- **原始 diff：** `M`，`+1/-1`，实际变更行 2。
- **实际变化：** 小型定点修改；新增条款摘录=“# Treat this as the canonical frontmatter contract for compounded learnings.”；删除条款摘录=“# Treat this as the canonical frontmatter contract for docs/solutions/.”；完整 diff 已逐行核对。
- **spec-first owner / 裁决：** spec-compound-refresh；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** schema/解析 round-trip、invalid/unknown/retired 值负例和 downstream consumer。

### F057. `skills/ce-compound-refresh/references/yaml-schema.md`
- **原始 diff：** `M`，`+18/-18`，实际变更行 36。
- **实际变化：** ce-compound-refresh 的reference contract按该文件原始 diff 独立校准；新增条款摘录=“'schema.yaml' in this directory is the canonical contract for '<root>/solutions/' frontmatter written by 'ce-compound'.”；删除条款摘录=“'schema.yaml' in this directory is the canonical contract for 'docs/solutions/' frontmatter written by 'ce-compound'.”。
- **spec-first owner / 裁决：** spec-compound-refresh；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F058. `skills/ce-compound-refresh/scripts/validate-doc-claims.py`
- **原始 diff：** `M`，`+35/-2`，实际变更行 37。
- **实际变化：** claim validator 跳过 fenced/inline code 中的 {{...}} 示例，仍拦截正文未填占位符。
- **spec-first owner / 裁决：** spec-compound-refresh；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** 脚本语法、退出码/错误证据、路径含空格、LF、私有 scratch 与 focused fixture。

### F059. `skills/ce-compound-refresh/scripts/validate-frontmatter.py`
- **原始 diff：** `M`，`+1/-1`，实际变更行 2。
- **实际变化：** frontmatter validator 校准 Python/路径/UTF-8 调用，schema 判断保持原 owner。
- **spec-first owner / 裁决：** spec-compound-refresh；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** 脚本语法、退出码/错误证据、路径含空格、LF、私有 scratch 与 focused fixture。

### F060. `skills/ce-compound/SKILL.md`
- **原始 diff：** `M`，`+153/-110`，实际变更行 263。
- **实际变化：** ce-compound 的入口/工作流契约按该文件原始 diff 独立校准；标题变化=## Session context / ## Artifact Root / #### 4. **Session History** (internal flow after launching the parallel block — automatic in Full mode, including headless) / ## Pre-resolved context / #### 4. **Session History** (internal flow after launching the parallel block — automatic in Full mode)；新增条款摘录=“argument-hint: "[optional: brief context] [mode:headless] [depth:lightweight/full]"”、“Captures problem solutions while context is fresh, creating structured documentation in '<root>/solutions/' with YAML frontmatter for searchability and future…”；删除条款摘录=“argument-hint: "[optional: brief context] [mode:headless] "”、“Captures problem solutions while context is fresh, creating structured documentation in 'docs/solutions/' with YAML frontmatter for searchability and future…”。
- **spec-first owner / 裁决：** spec-compound；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F061. `skills/ce-compound/assets/resolution-template.md`
- **原始 diff：** `M`，`+2/-2`，实际变更行 4。
- **实际变化：** 模板 category 提示从固定 docs/solutions 改为已解析 root 下的 solutions 子目录；spec-first 固定 docs/solutions，不采纳全局 root。
- **spec-first owner / 裁决：** spec-compound；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F062. `skills/ce-compound/references/agents/repo-profiler.md`
- **原始 diff：** `D`，`+0/-31`，实际变更行 31。
- **实际变化：** 删除仅为 cache miss 服务的 repo-profiler persona；当前仓库画像回到当轮 research/orientation。
- **spec-first owner / 裁决：** spec-compound；`直接同步删除`。
- **理由与验证面：** 双 worktree/branch 新鲜度、无 cache I/O、仍有 current-source grounding。

### F063. `skills/ce-compound/references/concepts-vocabulary.md`
- **原始 diff：** `M`，`+1/-1`，实际变更行 2。
- **实际变化：** CONCEPTS vocabulary 的学习引用从固定 docs/solutions 改为 <root>/solutions；spec-first 保持当前固定 owner。
- **spec-first owner / 裁决：** spec-compound；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F064. `skills/ce-compound/references/repo-profile-cache.md`
- **原始 diff：** `D`，`+0/-63`，实际变更行 63。
- **实际变化：** 删除共享 repo profile cache 协议、key/freshness/degradation 说明，避免缓存继续成为 Skill 输入契约。
- **spec-first owner / 裁决：** spec-compound；`直接同步删除`。
- **理由与验证面：** 双 worktree/branch 新鲜度、无 cache I/O、仍有 current-source grounding。

### F065. `skills/ce-compound/references/schema.yaml`
- **原始 diff：** `M`，`+1/-1`，实际变更行 2。
- **实际变化：** 小型定点修改；新增条款摘录=“# Treat this as the canonical frontmatter contract for compounded learnings.”；删除条款摘录=“# Treat this as the canonical frontmatter contract for docs/solutions/.”；完整 diff 已逐行核对。
- **spec-first owner / 裁决：** spec-compound；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** schema/解析 round-trip、invalid/unknown/retired 值负例和 downstream consumer。

### F066. `skills/ce-compound/references/yaml-schema.md`
- **原始 diff：** `M`，`+18/-18`，实际变更行 36。
- **实际变化：** ce-compound 的reference contract按该文件原始 diff 独立校准；新增条款摘录=“'schema.yaml' in this directory is the canonical contract for '<root>/solutions/' frontmatter written by 'ce-compound'.”；删除条款摘录=“'schema.yaml' in this directory is the canonical contract for 'docs/solutions/' frontmatter written by 'ce-compound'.”。
- **spec-first owner / 裁决：** spec-compound；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F067. `skills/ce-compound/scripts/repo-profile-cache.py`
- **原始 diff：** `D`，`+0/-418`，实际变更行 418。
- **实际变化：** 删除跨 run/worktree 的 repo profile cache 实现，grounding 改由当轮 current source 直接取得。
- **spec-first owner / 裁决：** spec-compound；`直接同步删除`。
- **理由与验证面：** 双 worktree/branch 新鲜度、无 cache I/O、仍有 current-source grounding。

### F068. `skills/ce-compound/scripts/session-history/extract-errors.py`
- **原始 diff：** `M`，`+6/-1`，实际变更行 7。
- **实际变化：** session-history extractor 显式按 UTF-8 读写，避免非 UTF locale 下中文记录失败。
- **spec-first owner / 裁决：** spec-compound；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** 脚本语法、退出码/错误证据、路径含空格、LF、私有 scratch 与 focused fixture。

### F069. `skills/ce-compound/scripts/session-history/extract-metadata.py`
- **原始 diff：** `M`，`+2/-2`，实际变更行 4。
- **实际变化：** session-history extractor 显式按 UTF-8 读写，避免非 UTF locale 下中文记录失败。
- **spec-first owner / 裁决：** spec-compound；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** 脚本语法、退出码/错误证据、路径含空格、LF、私有 scratch 与 focused fixture。

### F070. `skills/ce-compound/scripts/session-history/extract-skeleton.py`
- **原始 diff：** `M`，`+6/-1`，实际变更行 7。
- **实际变化：** session-history extractor 显式按 UTF-8 读写，避免非 UTF locale 下中文记录失败。
- **spec-first owner / 裁决：** spec-compound；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** 脚本语法、退出码/错误证据、路径含空格、LF、私有 scratch 与 focused fixture。

### F071. `skills/ce-compound/scripts/validate-doc-claims.py`
- **原始 diff：** `M`，`+35/-2`，实际变更行 37。
- **实际变化：** claim validator 跳过 fenced/inline code 中的 {{...}} 示例，仍拦截正文未填占位符。
- **spec-first owner / 裁决：** spec-compound；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** 脚本语法、退出码/错误证据、路径含空格、LF、私有 scratch 与 focused fixture。

### F072. `skills/ce-compound/scripts/validate-frontmatter.py`
- **原始 diff：** `M`，`+1/-1`，实际变更行 2。
- **实际变化：** frontmatter validator 校准 Python/路径/UTF-8 调用，schema 判断保持原 owner。
- **spec-first owner / 裁决：** spec-compound；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** 脚本语法、退出码/错误证据、路径含空格、LF、私有 scratch 与 focused fixture。

### F073. `skills/ce-debug/SKILL.md`
- **原始 diff：** `M`，`+37/-22`，实际变更行 59。
- **实际变化：** ce-debug 的入口/工作流契约按该文件原始 diff 独立校准；标题变化=## Mode / ## Artifact Root；新增条款摘录=“The **bug description** is the input this skill was invoked with — the failure to diagnose, present in the current prompt or conversation, whether the user…”、“**'mode:pipeline'** (set by an orchestrator such as 'ce-babysit-pr' or 'lfg'): run fully non-interactively. Strip the 'mode:pipeline' token from…”；删除条款摘录=“<bug_description> #$ARGUMENTS </bug_description>”、“- GitHub ('#123', 'org/repo#123', github.com URL): Parse the issue reference from '<bug_description>' and fetch with 'gh issue view <number> --json…”。
- **spec-first owner / 裁决：** spec-debug；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F074. `skills/ce-debug/references/agents/repo-profiler.md`
- **原始 diff：** `D`，`+0/-31`，实际变更行 31。
- **实际变化：** 删除仅为 cache miss 服务的 repo-profiler persona；当前仓库画像回到当轮 research/orientation。
- **spec-first owner / 裁决：** spec-debug；`直接同步删除`。
- **理由与验证面：** 双 worktree/branch 新鲜度、无 cache I/O、仍有 current-source grounding。

### F075. `skills/ce-debug/references/pipeline-mode.md`
- **原始 diff：** `A`，`+60/-0`，实际变更行 60。
- **实际变化：** ce-debug 的reference contract按该文件原始 diff 独立校准；标题变化=# ce-debug — pipeline mode (non-interactive) / ## Authority: you act under the orchestrator's inherited scope / ## Non-interactive overrides (per phase) / ## The fix-authority boundary: convergent vs divergent / ### Emergent trade-offs (when the caller passes a 'trajectory') / ## Surfacing a deferred (divergent / needs-human) item；新增条款摘录=“Loaded when 'ce-debug' is invoked with 'mode:pipeline' by an orchestrator ('ce-babysit-pr', 'lfg'). The skill runs to completion without ever asking the user…”、“Being invoked by an orchestrator is **not** itself authorization. You mutate under the **inherited** scope the orchestrator holds from the user: **actions** =…”。
- **spec-first owner / 裁决：** spec-debug；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F076. `skills/ce-debug/references/repo-profile-cache.md`
- **原始 diff：** `D`，`+0/-63`，实际变更行 63。
- **实际变化：** 删除共享 repo profile cache 协议、key/freshness/degradation 说明，避免缓存继续成为 Skill 输入契约。
- **spec-first owner / 裁决：** spec-debug；`直接同步删除`。
- **理由与验证面：** 双 worktree/branch 新鲜度、无 cache I/O、仍有 current-source grounding。

### F077. `skills/ce-debug/scripts/repo-profile-cache.py`
- **原始 diff：** `D`，`+0/-418`，实际变更行 418。
- **实际变化：** 删除跨 run/worktree 的 repo profile cache 实现，grounding 改由当轮 current source 直接取得。
- **spec-first owner / 裁决：** spec-debug；`直接同步删除`。
- **理由与验证面：** 双 worktree/branch 新鲜度、无 cache I/O、仍有 current-source grounding。

### F078. `skills/ce-doc-review/SKILL.md`
- **原始 diff：** `M`，`+33/-16`，实际变更行 49。
- **实际变化：** ce-doc-review 的入口/工作流契约按该文件原始 diff 独立校准；标题变化=## Artifact Root / ### Cross-Model Judgment Pass；新增条款摘录=“Check the invocation arguments for 'mode:headless'. Arguments may contain a document path, 'mode:headless', or both. Tokens starting with 'mode:' are flags,…”、“**Headless mode** changes the interaction model, not the classification boundaries. Apply the same judgment about which tier each finding belongs in. Only the…”；删除条款摘录=“**Headless mode** changes the interaction model, not the classification boundaries. ce-doc-review still applies the same judgment about which tier each finding…”、“Skill("ce-doc-review", "mode:headless docs/plans/my-plan.md")”。
- **spec-first owner / 裁决：** spec-doc-review；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F079. `skills/ce-doc-review/references/bulk-preview.md`
- **原始 diff：** `M`，`+23/-5`，实际变更行 28。
- **实际变化：** ce-doc-review 的reference contract按该文件原始 diff 独立校准；标题变化=## Withdrawal revalidation (before composing the plan)；新增条款摘录=“Route each such finding to the 'Withdrawing (N):' bucket instead. A staged-Apply-triggered withdrawal remains provisional here too: if that Apply is in this…”、“[P0] Requirements Trace — Renumber R4 (the auth-token requirement) to match unit reference”；删除条款摘录=“After the preview body is rendered, ask the user using the platform's blocking question tool ('AskUserQuestion' in Claude Code, 'request_user_input' in Codex,…”。
- **spec-first owner / 裁决：** spec-doc-review；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F080. `skills/ce-doc-review/references/cross-model-eval.md`
- **原始 diff：** `A`，`+143/-0`，实际变更行 143。
- **实际变化：** ce-doc-review 的reference contract按该文件原始 diff 独立校准；标题变化=# Cross-Model Judgment Pass — Skill-Creator Eval Spec / ## Eval cases / ## Pass criteria；新增条款摘录=“This is the eval-case specification for the cross-model judgment pass. It is the”、“session start, so behavioral wiring must be validated through the 'skill-creator'”。
- **spec-first owner / 裁决：** spec-doc-review；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F081. `skills/ce-doc-review/references/cross-model-review.md`
- **原始 diff：** `A`，`+138/-0`，实际变更行 138。
- **实际变化：** ce-doc-review 的reference contract按该文件原始 diff 独立校准；标题变化=# Cross-Model Judgment Pass / ## Gate — run only when this holds / ## Step 1 — Attest host identity, then sanction one fixed route / ## Step 2 — Provider model + reasoning tier (owned by the script) / ## Step 3 — Announce / ## Step 4 — Run the bundled script (one call per activated trio lens, in parallel with the persona reviewers)；新增条款摘录=“Runs ce-doc-review's **conditional judgment lenses** through one separately routed model target in read-only, least-privilege processes. Each peer gets the…”、“The trio is the three **conditional** judgment lenses whose output diverges most across model families: 'adversarial-document-reviewer',…”。
- **spec-first owner / 裁决：** spec-doc-review；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F082. `skills/ce-doc-review/references/open-questions-defer.md`
- **原始 diff：** `M`，`+5/-3`，实际变更行 8。
- **实际变化：** 小型定点修改；新增条款摘录=“**Render '{title}' and '{why_it_matters}' under the shared rendering floor** ('references/rendering-floor.md'). This entry is persisted for a later reader who no longer…”；完整 diff 已逐行核对。
- **spec-first owner / 裁决：** spec-doc-review；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F083. `skills/ce-doc-review/references/personas/adversarial-document-reviewer.md`
- **原始 diff：** `M`，`+2/-1`，实际变更行 3。
- **实际变化：** 小型定点修改；新增条款摘录=“Read these slots in your prompt's '<review-context>' block:”、“- 'Settled decisions:' — session-settled Key Technical Decisions, or 'none'. When Section 3 stress-testing or Section 5 alternative-blindness targets a listed decision,…”；删除条款摘录=“Read two slots”；完整 diff 已逐行核对。
- **spec-first owner / 裁决：** spec-doc-review；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F084. `skills/ce-doc-review/references/personas/product-lens-reviewer.md`
- **原始 diff：** `M`，`+2/-1`，实际变更行 3。
- **实际变化：** 小型定点修改；新增条款摘录=“Read these slots in your prompt's '<review-context>' block:”、“- 'Settled decisions:' — session-settled Key Technical Decisions, or 'none'. When Section 3 (Implementation alternatives) targets a listed decision, apply the…”；删除条款摘录=“Read two slots in your prompt's '<r”；完整 diff 已逐行核对。
- **spec-first owner / 裁决：** spec-doc-review；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F085. `skills/ce-doc-review/references/personas/whole-doc-reviewer.md`
- **原始 diff：** `A`，`+25/-0`，实际变更行 25。
- **实际变化：** ce-doc-review 的persona contract按该文件原始 diff 独立校准；标题变化=# Whole-Document Cross-Model Reviewer / ## What you cover / ## Document type / Origin / ## Calibration / ## Output；新增条款摘录=“You are an independent, strong generalist reviewing this **entire document** on a different model than the host. The focused lenses (adversarial, product,…”、“- **Cross-section problems** — a decision in one section contradicted or undermined by another; a requirement with no implementation unit; an implementation…”。
- **spec-first owner / 裁决：** spec-doc-review；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F086. `skills/ce-doc-review/references/rendering-floor.md`
- **原始 diff：** `A`，`+95/-0`，实际变更行 95。
- **实际变化：** ce-doc-review 的reference contract按该文件原始 diff 独立校准；标题变化=# Shared Rendering Floor / ## Decision-first field order / ## Opaque-token policy (domain-agnostic, by function) / ## Code-span and block budget / ## The one invariant, restated；新增条款摘录=“batch report table ('references/review-output-template.md'), the headless envelope”、“depth, and every distinct consequence, qualification, or required action.”。
- **spec-first owner / 裁决：** spec-doc-review；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F087. `skills/ce-doc-review/references/review-output-template.md`
- **原始 diff：** `M`，`+2/-1`，实际变更行 3。
- **实际变化：** 示例路径改用 artifact root，并新增 self-contained rendering floor：Issue 先写后果、opaque ID 首次释义、机制符号翻译成角色。
- **spec-first owner / 裁决：** spec-doc-review；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F088. `skills/ce-doc-review/references/subagent-template.md`
- **原始 diff：** `M`，`+3/-0`，实际变更行 3。
- **实际变化：** 小型定点修改；新增条款摘录=“- **Settlement-annotation removal** — '(session-settled: ...)' parentheticals on Key Technical Decision entries are decision provenance, not prose clutter. Never flag…”、“- 'Settled decisions:' lists the document's 'session-settled:'-labeled Key Technical Decisions or Product Contract Key Decisions (name, class, rejected alternative), or…”；完整 diff 已逐行核对。
- **spec-first owner / 裁决：** spec-doc-review；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F089. `skills/ce-doc-review/references/synthesis-and-presentation.md`
- **原始 diff：** `M`，`+56/-22`，实际变更行 78。
- **实际变化：** ce-doc-review 的reference contract按该文件原始 diff 独立校准；新增条款摘录=“**Cross-model twin exception.** When a '<reviewer-name>-<provider>' return has top-level 'independence_verified: true', match it against its in-process twin…”、“**Cross-model returns count as independent personas here only when the return's top-level 'independence_verified' is 'true'.** A return with 'false' or a…”；删除条款摘录=“**Compact rendering for FYI observations, residual concerns, and deferred questions (high-count mode).** When the combined count of these three buckets is 5 or…”、“These are pipeline artifacts and must not be flagged for removal.”。
- **spec-first owner / 裁决：** spec-doc-review；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F090. `skills/ce-doc-review/references/walkthrough.md`
- **原始 diff：** `M`，`+30/-6`，实际变更行 36。
- **实际变化：** ce-doc-review 的reference contract按该文件原始 diff 独立校准；标题变化=## Withdrawing findings the user's earlier answers resolved；新增条款摘录=“- **Opaque identifiers** — any token the user would have to open the document or the code to understand carries a short plain-language handle on its first…”、“- **First sentence states the consequence, and contains no identifier at all.** What goes wrong, for whom. A reader who skimmed the document once must be able…”。
- **spec-first owner / 裁决：** spec-doc-review；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F091. `skills/ce-doc-review/scripts/cross-model-doc-review.sh`
- **原始 diff：** `A`，`+845/-0`，实际变更行 845。
- **实际变化：** 新增文档审查跨模型 adapter，按 persona 隔离输入、校验 schema 并保留 report-only 边界。
- **spec-first owner / 裁决：** spec-doc-review；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** 脚本语法、退出码/错误证据、路径含空格、LF、私有 scratch 与 focused fixture。

### F092. `skills/ce-doc-review/scripts/peer-job-runner.py`
- **原始 diff：** `A`，`+1844/-0`，实际变更行 1844。
- **实际变化：** 新增 detached peer supervisor 的 start/status/wait/result/reap 全生命周期，含私有目录、owner、timeout、size cap、进程树终止和 Windows 等价路径。
- **spec-first owner / 裁决：** spec-doc-review；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** start/status/wait/result/reap、owner/symlink、timeout/size cap、Windows、byte parity 或 orphan-negative。

### F093. `skills/ce-dogfood/SKILL.md`
- **原始 diff：** `M`，`+22/-8`，实际变更行 30。
- **实际变化：** ce-dogfood 的入口/工作流契约按该文件原始 diff 独立校准；标题变化=## Artifact Root；新增条款摘录=“**User-runnable invocation rendering.** In prerequisite failures, default to '/ce-setup' and '/ce-dogfood <original arguments>'; use '$ce-setup' and…”、“If not installed, stop and tell the user to install 'agent-browser': print the rendered 'ce-setup' invocation for the current install command, followed by the…”；删除条款摘录=“If not installed, stop and tell the user to install 'agent-browser' (run '/ce-setup' to print the current install command), then re-run this skill — this…”、“Parse '$ARGUMENTS': a PR number, a branch name, or blank (use current branch). Strip '--port PORT' if present.”。
- **spec-first owner / 裁决：** spec-dogfood；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F094. `skills/ce-dogfood/references/dogfood-report-template.md`
- **原始 diff：** `M`，`+1/-1`，实际变更行 2。
- **实际变化：** 小型定点修改；新增条款摘录=“> Diff-scoped browser QA of '<branch>' vs the trunk. Generated by 'ce-dogfood' on <YYYY-MM-DD>.”；删除条款摘录=“> Diff-scoped browser QA of '<branch>' vs the trunk. Generated by '/ce-dogfood' on <YYYY-MM-DD>.”；完整 diff 已逐行核对。
- **spec-first owner / 裁决：** spec-dogfood；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F095. `skills/ce-explain/SKILL.md`
- **原始 diff：** `M`，`+50/-28`，实际变更行 78。
- **实际变化：** ce-explain 的入口/工作流契约按该文件原始 diff 独立校准；标题变化=## Artifact Root / ### Phase 5: Exercises (only when Quiz me was selected) / ### Phase 5: Exercises (when warranted)；新增条款摘录=“description: "Create a durable, visual teaching artifact — plus an optional check-in (predict-then-reveal for diffs, corrected exercises) that makes it stick —…”、“**On request — rendered for another reader.** When the user asks for a version someone else will read ("write this for my team", "this is going into the design…”；删除条款摘录=“<explain_request> #$ARGUMENTS </explain_request>”、“*(If '$ARGUMENTS' above appears as a literal token rather than the user's words — it was not substituted on this host — use the user's actual request from the…”。
- **spec-first owner / 裁决：** spec-explain；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F096. `skills/ce-explain/references/agents/repo-profiler.md`
- **原始 diff：** `D`，`+0/-31`，实际变更行 31。
- **实际变化：** 删除仅为 cache miss 服务的 repo-profiler persona；当前仓库画像回到当轮 research/orientation。
- **spec-first owner / 裁决：** spec-explain；`直接同步删除`。
- **理由与验证面：** 双 worktree/branch 新鲜度、无 cache I/O、仍有 current-source grounding。

### F097. `skills/ce-explain/references/agents/work-recap-scout.md`
- **原始 diff：** `M`，`+1/-1`，实际变更行 2。
- **实际变化：** work recap 的 plan/solution 发现从固定 docs 路径改为解析后的 root，同时保留 docs/brainstorms 兼容例外。
- **spec-first owner / 裁决：** spec-explain；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F098. `skills/ce-explain/references/check-in.md`
- **原始 diff：** `M`，`+13/-0`，实际变更行 13。
- **实际变化：** check-in 改为用户目的优先，并固定“只要解释（推荐）/测验我”两选项；预测和练习仅在显式 Quiz me 后执行。
- **spec-first owner / 裁决：** spec-explain；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F099. `skills/ce-explain/references/destinations.md`
- **原始 diff：** `M`，`+11/-8`，实际变更行 19。
- **实际变化：** ce-explain 的reference contract按该文件原始 diff 独立校准；标题变化=## Claude Artifact / ## Publish publicly to ht-ml.app / ## Artifact surface；新增条款摘录=“Offered for HTML output when the session is Claude Code and its Artifact tool is present. Give the tool the canonical '$RUN_DIR/explainer.html', follow its…”、“This is the preferred HTML publisher when the Claude Artifact adapter is not selected. ht-ml.app accepts the complete standalone HTML document and works…”；删除条款摘录=“Offered when an artifact-publishing tool is present in the session's toolset.”、“Artifact surfaces wrap published content in their own document skeleton (doctype, head, body) and enforce a CSP that blocks requests to external hosts.…”。
- **spec-first owner / 裁决：** spec-explain；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F100. `skills/ce-explain/references/explainer-html.md`
- **原始 diff：** `M`，`+13/-1`，实际变更行 14。
- **实际变化：** ce-explain 的reference contract按该文件原始 diff 独立校准；标题变化=## Voice — personal by default, adapted on request；新增条款摘录=“- **All metadata appears as visible text — single source of truth.** The visible '<h1>' is the title. A visible header '<dl>' uses the exact field labels…”、“- **No second person.** The subject goes to third person when a name is available — recap mode's commit authors, or a name the user supplied — and impersonal…”；删除条款摘录=“- **All metadata appears as visible text — single source of truth.** A visible header block carries: title, date, input shape (concept / diff / idea / recap),…”。
- **spec-first owner / 裁决：** spec-explain；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F101. `skills/ce-explain/references/explainer-markdown.md`
- **原始 diff：** `M`，`+13/-1`，实际变更行 14。
- **实际变化：** ce-explain 的reference contract按该文件原始 diff 独立校准；标题变化=## Voice — personal by default, adapted on request；新增条款摘录=“- **YAML frontmatter carries the metadata:** 'title', 'date', 'input_shape' (concept / diff / idea / recap), 'subject', 'unverified: true' when Phase 2 fell…”、“- **No second person.** The subject goes to third person when a name is available — recap mode's commit authors, or a name the user supplied — and impersonal…”；删除条款摘录=“- **YAML frontmatter carries the metadata:** 'title', 'date', 'input_shape' (concept / diff / idea / recap), 'subject', and 'unverified: true' when Phase 2…”。
- **spec-first owner / 裁决：** spec-explain；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F102. `skills/ce-explain/references/intake.md`
- **原始 diff：** `M`，`+26/-5`，实际变更行 31。
- **实际变化：** ce-explain 的reference contract按该文件原始 diff 独立校准；标题变化=## Audience resolution；新增条款摘录=“Classify the request into exactly one input shape — concept, diff, idea, or work-recap window — before any grounding runs, and resolve its audience. Parse by…”、“Tokens exist so automation and chained calls can force a decision. Plain language is the ordinary way a person invokes this skill and is not a lesser path —…”；删除条款摘录=“Classify the request into exactly one input shape — concept, diff, idea, or work-recap window — before any grounding runs. Parse by reasoning over the user's…”、“- An unrecognized '<word>:<word>' token (including conventional-commit prefixes like 'feat:' appearing inside a topic) is not a flag — it passes through…”。
- **spec-first owner / 裁决：** spec-explain；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F103. `skills/ce-explain/references/repo-profile-cache.md`
- **原始 diff：** `D`，`+0/-63`，实际变更行 63。
- **实际变化：** 删除共享 repo profile cache 协议、key/freshness/degradation 说明，避免缓存继续成为 Skill 输入契约。
- **spec-first owner / 裁决：** spec-explain；`直接同步删除`。
- **理由与验证面：** 双 worktree/branch 新鲜度、无 cache I/O、仍有 current-source grounding。

### F104. `skills/ce-explain/scripts/repo-profile-cache.py`
- **原始 diff：** `D`，`+0/-418`，实际变更行 418。
- **实际变化：** 删除跨 run/worktree 的 repo profile cache 实现，grounding 改由当轮 current source 直接取得。
- **spec-first owner / 裁决：** spec-explain；`直接同步删除`。
- **理由与验证面：** 双 worktree/branch 新鲜度、无 cache I/O、仍有 current-source grounding。

### F105. `skills/ce-handoff/SKILL.md`
- **原始 diff：** `A`，`+136/-0`，实际变更行 136。
- **实际变化：** ce-handoff 的入口/工作流契约按该文件原始 diff 独立校准；标题变化=# Handoff / ## Route the invocation / ## Create / ### Outcome / ### Build the handoff / ### Default managed storage；新增条款摘录=“description: Create a session handoff for another agent, or resume, find, and read any user-selected continuity source. Use when work or conversation must…”、“argument-hint: "[create [focus] / resume [source or keywords]]"”。
- **spec-first owner / 裁决：** 现有 artifact/session contracts；`明确不采纳`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F106. `skills/ce-ideate/SKILL.md`
- **原始 diff：** `M`，`+53/-48`，实际变更行 101。
- **实际变化：** ce-ideate 的入口/工作流契约按该文件原始 diff 独立校准；标题变化=## Artifact Root；新增条款摘录=“This workflow produces a ranked ideation artifact — written to '<root>/ideation/' when present, else a CE temp path (see Phase 4). It does **not** produce…”、“This skill writes ideation artifacts under '<root>/ideation/' in repo mode and reads learnings under '<root>/solutions/'. Resolve '<root>' (per the block…”；删除条款摘录=“This workflow produces a ranked ideation artifact — written to 'docs/ideation/' when present, else a CE temp path (see Phase 4). It does **not** produce…”、“<focus_hint> #$ARGUMENTS </focus_hint>”。
- **spec-first owner / 裁决：** spec-ideate；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F107. `skills/ce-ideate/references/agents/issue-intelligence-analyst.md`
- **原始 diff：** `M`，`+93/-127`，实际变更行 220。
- **实际变化：** ce-ideate 的agent prompt按该文件原始 diff 独立校准；标题变化=## The goal for this lens / ## Tracker access — capability probe (both modes) / ## Two-axis state model (both modes) / ## Open and recently-closed, read together / ## Modes / ### SCAN mode；新增条款摘录=“You are an expert issue intelligence analyst specializing in extracting strategic signal from noisy issue trackers. Your mission is to transform raw issues —…”、“Surface the **highest-leverage systemic classes** of issues in the tracker — the patterns where a focused investment resolves a whole category of bugs or pain…”；删除条款摘录=“Verify each condition in order. If any fails, return a clear message explaining what is missing and stop.”、“1. **Git repository** — confirm the current directory is a git repo using 'git rev-parse --is-inside-work-tree'”。
- **spec-first owner / 裁决：** spec-ideate；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F108. `skills/ce-ideate/references/agents/learnings-researcher.md`
- **原始 diff：** `M`，`+15/-15`，实际变更行 30。
- **实际变化：** ce-ideate 的agent prompt按该文件原始 diff 独立校准；新增条款摘录=“The '<root>/solutions/' directory contains documented learnings with YAML frontmatter. When there may be hundreds of files, use this efficient strategy that…”、“> **Grep/Glob fallback:** If 'Grep' or 'Glob' aren't in your runtime schema, fall back to 'Bash' (e.g., 'rg -li', 'find') against '<root>/solutions/' with the…”；删除条款摘录=“The 'docs/solutions/' directory contains documented learnings with YAML frontmatter. When there may be hundreds of files, use this efficient strategy that…”、“> **Grep/Glob fallback:** If 'Grep' or 'Glob' aren't in your runtime schema, fall back to 'Bash' (e.g., 'rg -li', 'find') against 'docs/solutions/' with the…”。
- **spec-first owner / 裁决：** spec-ideate；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F109. `skills/ce-ideate/references/agents/repo-profiler.md`
- **原始 diff：** `D`，`+0/-31`，实际变更行 31。
- **实际变化：** 删除仅为 cache miss 服务的 repo-profiler persona；当前仓库画像回到当轮 research/orientation。
- **spec-first owner / 裁决：** spec-ideate；`直接同步删除`。
- **理由与验证面：** 双 worktree/branch 新鲜度、无 cache I/O、仍有 current-source grounding。

### F110. `skills/ce-ideate/references/divergent-ideation.md`
- **原始 diff：** `M`，`+1/-1`，实际变更行 2。
- **实际变化：** 小型定点修改；新增条款摘录=“**Issue-tracker mode override (repo mode only).** When issue-tracker intent is active and themes were returned by the issue intelligence agent: the **highest-leverage…”；完整 diff 已逐行核对。
- **spec-first owner / 裁决：** spec-ideate；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F111. `skills/ce-ideate/references/html-rendering.md`
- **原始 diff：** `M`，`+12/-3`，实际变更行 15。
- **实际变化：** ce-ideate 的reference contract按该文件原始 diff 独立校准；新增条款摘录=“'session-settled:' annotation renders as visible text in the card —”、“never an attribute or hidden markup — stem preserved verbatim so”。
- **spec-first owner / 裁决：** spec-ideate；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F112. `skills/ce-ideate/references/markdown-rendering.md`
- **原始 diff：** `M`，`+10/-4`，实际变更行 14。
- **实际变化：** ce-ideate 的reference contract按该文件原始 diff 独立校准；新增条款摘录=“existing numbered ones. A 'session-settled:' annotation renders as part”。
- **spec-first owner / 裁决：** spec-ideate；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F113. `skills/ce-ideate/references/post-ideation-workflow.md`
- **原始 diff：** `M`，`+5/-5`，实际变更行 10。
- **实际变化：** 小型定点修改；新增条款摘录=“- **Otherwise (no repo, or elsewhere with no '<root>/ideation/'):** write into the run's CE temp area — the '<scratch-dir>' resolved in Phase 1…”；完整 diff 已逐行核对。
- **spec-first owner / 裁决：** spec-ideate；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F114. `skills/ce-ideate/references/repo-profile-cache.md`
- **原始 diff：** `D`，`+0/-63`，实际变更行 63。
- **实际变化：** 删除共享 repo profile cache 协议、key/freshness/degradation 说明，避免缓存继续成为 Skill 输入契约。
- **spec-first owner / 裁决：** spec-ideate；`直接同步删除`。
- **理由与验证面：** 双 worktree/branch 新鲜度、无 cache I/O、仍有 current-source grounding。

### F115. `skills/ce-ideate/references/universal-ideation.md`
- **原始 diff：** `M`，`+2/-2`，实际变更行 4。
- **实际变化：** 小型定点修改；新增条款摘录=“Phase 1 elsewhere-mode grounding runs before this reference takes over — user-context synthesis and web-research feed the facilitation below. Learnings-researcher is…”；完整 diff 已逐行核对。
- **spec-first owner / 裁决：** spec-ideate；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F116. `skills/ce-ideate/references/web-research-cache.md`
- **原始 diff：** `M`，`+3/-2`，实际变更行 5。
- **实际变化：** 小型定点修改；新增条款摘录=“Files live under '<scratch-dir>/web-research-cache.json', where '<scratch-dir>' is '<scratch-root>/ce-ideate/<run-id>', resolved once in SKILL.md Phase 1.”、“SCRATCH_DIR='<absolute scratch-dir resolved in Phase 1>'”；删除条款摘录=“Files live under '<scratch-dir>/web-research-cache.json', where '<scratch-dir>' is '/tmp/compound-engineering/ce-ideate/<run-id>', resolved once in SKILL.md Phase 1.”、“SCRATCH_ROOT='/tmp/compound-engineerin”；完整 diff 已逐行核对。
- **spec-first owner / 裁决：** spec-ideate；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F117. `skills/ce-ideate/scripts/repo-profile-cache.py`
- **原始 diff：** `D`，`+0/-418`，实际变更行 418。
- **实际变化：** 删除跨 run/worktree 的 repo profile cache 实现，grounding 改由当轮 current source 直接取得。
- **spec-first owner / 裁决：** spec-ideate；`直接同步删除`。
- **理由与验证面：** 双 worktree/branch 新鲜度、无 cache I/O、仍有 current-source grounding。

### F118. `skills/ce-optimize/SKILL.md`
- **原始 diff：** `M`，`+23/-18`，实际变更行 41。
- **实际变化：** ce-optimize 的入口/工作流契约按该文件原始 diff 独立校准；标题变化=## Artifact Root；新增条款摘录=“This skill reads learnings under '<root>/solutions/'. Resolve '<root>' when you first compose a '<root>/' path (per the block below), never before you need it.…”、“**Resolve the CE artifact root '<root>' before composing any artifact path.**”；删除条款摘录=“<optimization_input> #$ARGUMENTS </optimization_input>”、“Optionally read 'references/agents/repo-research-analyst.md' and dispatch a generic subagent seeded with that local prompt for deeper codebase analysis if the…”。
- **spec-first owner / 裁决：** spec-optimize；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F119. `skills/ce-optimize/references/agents/learnings-researcher.md`
- **原始 diff：** `M`，`+15/-15`，实际变更行 30。
- **实际变化：** ce-optimize 的agent prompt按该文件原始 diff 独立校准；新增条款摘录=“The '<root>/solutions/' directory contains documented learnings with YAML frontmatter. When there may be hundreds of files, use this efficient strategy that…”、“> **Grep/Glob fallback:** If 'Grep' or 'Glob' aren't in your runtime schema, fall back to 'Bash' (e.g., 'rg -li', 'find') against '<root>/solutions/' with the…”；删除条款摘录=“The 'docs/solutions/' directory contains documented learnings with YAML frontmatter. When there may be hundreds of files, use this efficient strategy that…”、“> **Grep/Glob fallback:** If 'Grep' or 'Glob' aren't in your runtime schema, fall back to 'Bash' (e.g., 'rg -li', 'find') against 'docs/solutions/' with the…”。
- **spec-first owner / 裁决：** spec-optimize；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F120. `skills/ce-optimize/references/agents/repo-profiler.md`
- **原始 diff：** `D`，`+0/-31`，实际变更行 31。
- **实际变化：** 删除仅为 cache miss 服务的 repo-profiler persona；当前仓库画像回到当轮 research/orientation。
- **spec-first owner / 裁决：** spec-optimize；`直接同步删除`。
- **理由与验证面：** 双 worktree/branch 新鲜度、无 cache I/O、仍有 current-source grounding。

### F121. `skills/ce-optimize/references/agents/repo-research-analyst.md`
- **原始 diff：** `M`，`+4/-3`，实际变更行 7。
- **实际变化：** 小型定点修改；新增条款摘录=“Run Phase 0 only when 'technology' is requested or when the invocation has no 'Scope:' prefix.”；完整 diff 已逐行核对。
- **spec-first owner / 裁决：** spec-optimize；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F122. `skills/ce-optimize/references/repo-profile-cache.md`
- **原始 diff：** `D`，`+0/-63`，实际变更行 63。
- **实际变化：** 删除共享 repo profile cache 协议、key/freshness/degradation 说明，避免缓存继续成为 Skill 输入契约。
- **spec-first owner / 裁决：** spec-optimize；`直接同步删除`。
- **理由与验证面：** 双 worktree/branch 新鲜度、无 cache I/O、仍有 current-source grounding。

### F123. `skills/ce-optimize/scripts/measure.sh`
- **原始 diff：** `M`，`+10/-3`，实际变更行 13。
- **实际变化：** shell 测量脚本从硬编码 python3 改为可执行探测，并加强参数引用、退出码和清理。
- **spec-first owner / 裁决：** spec-optimize；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** 脚本语法、退出码/错误证据、路径含空格、LF、私有 scratch 与 focused fixture。

### F124. `skills/ce-optimize/scripts/parallel-probe.sh`
- **原始 diff：** `M`，`+13/-6`，实际变更行 19。
- **实际变化：** shell 测量脚本从硬编码 python3 改为可执行探测，并加强参数引用、退出码和清理。
- **spec-first owner / 裁决：** spec-optimize；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** 脚本语法、退出码/错误证据、路径含空格、LF、私有 scratch 与 focused fixture。

### F125. `skills/ce-optimize/scripts/repo-profile-cache.py`
- **原始 diff：** `D`，`+0/-418`，实际变更行 418。
- **实际变化：** 删除跨 run/worktree 的 repo profile cache 实现，grounding 改由当轮 current source 直接取得。
- **spec-first owner / 裁决：** spec-optimize；`直接同步删除`。
- **理由与验证面：** 双 worktree/branch 新鲜度、无 cache I/O、仍有 current-source grounding。

### F126. `skills/ce-plan/SKILL.md`
- **原始 diff：** `M`，`+75/-54`，实际变更行 129。
- **实际变化：** ce-plan 的入口/工作流契约按该文件原始 diff 独立校准；标题变化=## Artifact Root / ## Task Visibility；新增条款摘录=“The **feature description** is the input this skill was invoked with — what to plan, present in the current prompt or conversation, whether the user provided…”、“This skill writes plans under '<root>/plans/' and reads learnings under '<root>/solutions/'. Resolve '<root>' when you first compose a '<root>/' path (per the…”；删除条款摘录=“<feature_description> #$ARGUMENTS </feature_description>”、“!'git rev-parse --show-toplevel'”。
- **spec-first owner / 裁决：** spec-plan；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F127. `skills/ce-plan/references/agents/git-history-analyzer.md`
- **原始 diff：** `M`，`+1/-1`，实际变更行 2。
- **实际变化：** 历史分析器把受保护 plan/solution 路径改为 <root>/plans 与 <root>/solutions；spec-first 不采纳全局 root。
- **spec-first owner / 裁决：** spec-plan；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F128. `skills/ce-plan/references/agents/learnings-researcher.md`
- **原始 diff：** `M`，`+15/-15`，实际变更行 30。
- **实际变化：** ce-plan 的agent prompt按该文件原始 diff 独立校准；新增条款摘录=“The '<root>/solutions/' directory contains documented learnings with YAML frontmatter. When there may be hundreds of files, use this efficient strategy that…”、“> **Grep/Glob fallback:** If 'Grep' or 'Glob' aren't in your runtime schema, fall back to 'Bash' (e.g., 'rg -li', 'find') against '<root>/solutions/' with the…”；删除条款摘录=“The 'docs/solutions/' directory contains documented learnings with YAML frontmatter. When there may be hundreds of files, use this efficient strategy that…”、“> **Grep/Glob fallback:** If 'Grep' or 'Glob' aren't in your runtime schema, fall back to 'Bash' (e.g., 'rg -li', 'find') against 'docs/solutions/' with the…”。
- **spec-first owner / 裁决：** spec-plan；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F129. `skills/ce-plan/references/agents/repo-profiler.md`
- **原始 diff：** `D`，`+0/-31`，实际变更行 31。
- **实际变化：** 删除仅为 cache miss 服务的 repo-profiler persona；当前仓库画像回到当轮 research/orientation。
- **spec-first owner / 裁决：** spec-plan；`直接同步删除`。
- **理由与验证面：** 双 worktree/branch 新鲜度、无 cache I/O、仍有 current-source grounding。

### F130. `skills/ce-plan/references/agents/repo-research-analyst.md`
- **原始 diff：** `M`，`+4/-3`，实际变更行 7。
- **实际变化：** 小型定点修改；新增条款摘录=“Run Phase 0 only when 'technology' is requested or when the invocation has no 'Scope:' prefix.”；完整 diff 已逐行核对。
- **spec-first owner / 裁决：** spec-plan；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F131. `skills/ce-plan/references/approach-altitude.md`
- **原始 diff：** `M`，`+3/-3`，实际变更行 6。
- **实际变化：** 小型定点修改；新增条款摘录=“**Save for later.** Persist the approach-plan to '<root>/plans/' so it survives. If the deliverable is non-code, write the marker ('execution: knowledge-work', see…”；完整 diff 已逐行核对。
- **spec-first owner / 裁决：** spec-plan；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F132. `skills/ce-plan/references/deepening-workflow.md`
- **原始 diff：** `M`，`+8/-1`，实际变更行 9。
- **实际变化：** 小型定点修改；新增条款摘录=“Findings against 'session-settled:'-labeled KTDs are presented like any other — suppressing them is pipeline/auto-mode behavior only, never interactive. A user-accepted…”、“**Session-settled KTD stability.** Deepening may append rationale or a conflict call-out to a 'session-settled:'-labeled Key Technical Decisi”；完整 diff 已逐行核对。
- **spec-first owner / 裁决：** spec-plan；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F133. `skills/ce-plan/references/html-rendering.md`
- **原始 diff：** `M`，`+12/-3`，实际变更行 15。
- **实际变化：** ce-plan 的reference contract按该文件原始 diff 独立校准；新增条款摘录=“'session-settled:' annotation renders as visible text in the card —”、“never an attribute or hidden markup — stem preserved verbatim so”。
- **spec-first owner / 裁决：** spec-plan；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F134. `skills/ce-plan/references/markdown-rendering.md`
- **原始 diff：** `M`，`+10/-4`，实际变更行 14。
- **实际变化：** ce-plan 的reference contract按该文件原始 diff 独立校准；新增条款摘录=“existing numbered ones. A 'session-settled:' annotation renders as part”。
- **spec-first owner / 裁决：** spec-plan；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F135. `skills/ce-plan/references/plan-handoff.md`
- **原始 diff：** `M`，`+26/-14`，实际变更行 40。
- **实际变化：** ce-plan 的reference contract按该文件原始 diff 独立校准；新增条款摘录=“**When 'OUTPUT_FORMAT=md':** Invoke the 'ce-doc-review' skill with arguments 'mode:headless <plan-path>' using the host's normal skill-invocation mechanism. Do…”、“If 'ce-doc-review' cannot be invoked, capture a synthetic envelope and proceed to Final Checks:”；删除条款摘录=“**When 'OUTPUT_FORMAT=md':** Run the 'ce-doc-review' skill with 'mode:headless' on the plan file. Pass 'mode:headless <plan-path>' as the skill arguments. When…”、“**Pipeline mode:** Pipeline runs (LFG or any 'disable-model-invocation' context) force 'OUTPUT_FORMAT=md' at Phase 0.0, so the format gate above never selects…”。
- **spec-first owner / 裁决：** spec-plan；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F136. `skills/ce-plan/references/plan-sections.md`
- **原始 diff：** `M`，`+61/-9`，实际变更行 70。
- **实际变化：** ce-plan 的reference contract按该文件原始 diff 独立校准；新增条款摘录=“requirement, qualification, and test scenario. A Summary is a handful of”、“**One owner per rule; cite, don't restate.** A normative rule — a gate, cap,”。
- **spec-first owner / 裁决：** spec-plan；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F137. `skills/ce-plan/references/reasoning-elevation.md`
- **原始 diff：** `M`，`+90/-40`，实际变更行 130。
- **实际变化：** ce-plan 的reference contract按该文件原始 diff 独立校准；标题变化=# Model Elevation / ## Activation resolution (runs on every harness) / ## Adapter selection / ## Read-only posture and brief handoff / ## Off-host dispatch (Claude CLI route) / ## Recovery (R13, R14, R21)；新增条款摘录=“Elevation dispatches the one reasoning-heaviest step to a **user-chosen model**, so a user on a cheaper session model still gets a high-reasoning result…”、“The elevated steps: **ce-plan** — interpret research findings and author the plan, folded into one interpret-then-author call. **ce-brainstorm** — generate…”；删除条款摘录=“This reference is loaded ONLY after a positive Claude Code host check (the gate below). It carries the entire elevation engine; the calling 'SKILL.md' holds…”、“Elevation dispatches the reasoning-heavy authoring/interpretation step to a higher-reasoning model (in Claude Code, **Fable**) via a subagent, so a user on a…”。
- **spec-first owner / 裁决：** spec-plan；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F138. `skills/ce-plan/references/repo-profile-cache.md`
- **原始 diff：** `D`，`+0/-63`，实际变更行 63。
- **实际变化：** 删除共享 repo profile cache 协议、key/freshness/degradation 说明，避免缓存继续成为 Skill 输入契约。
- **spec-first owner / 裁决：** spec-plan；`直接同步删除`。
- **理由与验证面：** 双 worktree/branch 新鲜度、无 cache I/O、仍有 current-source grounding。

### F139. `skills/ce-plan/references/settled-decisions.md`
- **原始 diff：** `A`，`+45/-0`，实际变更行 45。
- **实际变化：** ce-plan 的reference contract按该文件原始 diff 独立校准；标题变化=# Session-Settled Decisions / ## The settlement test / ## Provenance classes / ## The annotation / ## Capture rules / ## Brief entries (pipeline input)；新增条款摘录=“Protocol and schema for carrying decisions the user already made in the invoking conversation, so this skill augments them instead of re-litigating them. This…”、“- **Directive** — the user asserted a choice no one examined (e.g., a cold "build it with X"). Not settled. It receives exactly one in-pipeline challenge,…”。
- **spec-first owner / 裁决：** spec-plan；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F140. `skills/ce-plan/references/synthesis-summary.md`
- **原始 diff：** `M`，`+14/-4`，实际变更行 18。
- **实际变化：** ce-plan 的reference contract按该文件原始 diff 独立校准；新增条款摘录=“Session-settled decisions are **Stated with provenance**, never Inferred — the user's conversation acts anchor them by definition. Carry each into the Stated…”、“- **Session-settled decisions render as 'Carrying forward:' lines, never call-outs.** One line each — decision, class, and what it was chosen over — placed…”；删除条款摘录=“**Counter-warning for rich-context invocations.** When the inference source is *not* just Phase 0.4 bootstrap — e.g., a prior in-conversation validation agent,…”。
- **spec-first owner / 裁决：** spec-plan；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F141. `skills/ce-plan/references/universal-planning.md`
- **原始 diff：** `M`，`+5/-5`，实际变更行 10。
- **实际变化：** 小型定点修改；新增条款摘录=“- **Pipeline mode?** If invoked from 'lfg' or any 'disable-model-invocation' context: tell the user this is a non-software task, 'lfg' requires the software-only…”；完整 diff 已逐行核对。
- **spec-first owner / 裁决：** spec-plan；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F142. `skills/ce-plan/scripts/elevation-dispatch.sh`
- **原始 diff：** `A`，`+274/-0`，实际变更行 274。
- **实际变化：** 新增 plan/brainstorm 高推理步骤的模型提升 adapter，记录 requested/actual model 并在 route/receipt 失败时回退当前会话。
- **spec-first owner / 裁决：** spec-plan；`明确不采纳（首波）`。
- **理由与验证面：** 脚本语法、退出码/错误证据、路径含空格、LF、私有 scratch 与 focused fixture。

### F143. `skills/ce-plan/scripts/peer-job-runner.py`
- **原始 diff：** `A`，`+1844/-0`，实际变更行 1844。
- **实际变化：** 新增 detached peer supervisor 的 start/status/wait/result/reap 全生命周期，含私有目录、owner、timeout、size cap、进程树终止和 Windows 等价路径。
- **spec-first owner / 裁决：** spec-plan；`明确不采纳（首波）`。
- **理由与验证面：** start/status/wait/result/reap、owner/symlink、timeout/size cap、Windows、byte parity 或 orphan-negative。

### F144. `skills/ce-plan/scripts/repo-profile-cache.py`
- **原始 diff：** `D`，`+0/-418`，实际变更行 418。
- **实际变化：** 删除跨 run/worktree 的 repo profile cache 实现，grounding 改由当轮 current source 直接取得。
- **spec-first owner / 裁决：** spec-plan；`直接同步删除`。
- **理由与验证面：** 双 worktree/branch 新鲜度、无 cache I/O、仍有 current-source grounding。

### F145. `skills/ce-polish/SKILL.md`
- **原始 diff：** `M`，`+4/-4`，实际变更行 8。
- **实际变化：** 所有内联 SKILL_DIR 赋值补分号，抵抗宿主把多行 shell 压平后变量赋值与下一命令粘连。
- **spec-first owner / 裁决：** spec-polish；`直接同步`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F146. `skills/ce-pov/SKILL.md`
- **原始 diff：** `M`，`+67/-44`，实际变更行 111。
- **实际变化：** ce-pov 的入口/工作流契约按该文件原始 diff 独立校准；标题变化=## User-facing communication / ## Artifact Root / ### Phase 1: Ground (dispatch scouts by default; bounded inline reads when facts are pre-located) / ### Phase 2: Verify Grounding / ### Phase 3: Point of View / ### Phase 1: Ground (dispatch scouts, never inline)；新增条款摘录=“description: "Give a decisive, project-grounded point of view in the subject's own shape: a graded verdict on an external-adoption question, a holistic take on…”、“argument-hint: "[adoption question, document, or supplied approaches] [compare/cross-check with peers or oracle] — or invoke bare mid-session"”；删除条款摘录=“argument-hint: "[the external thing to judge, plus any links] — or invoke bare mid-session for a second opinion"”、“<pov_request> #$ARGUMENTS </pov_request>”。
- **spec-first owner / 裁决：** spec-pov；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F147. `skills/ce-pov/references/agents/pov-peer.md`
- **原始 diff：** `A`，`+37/-0`，实际变更行 37。
- **实际变化：** ce-pov 的agent prompt按该文件原始 diff 独立校准；标题变化=# Peer point-of-view brief；新增条款摘录=“Run your own external check when the available web-only capability can verify a”、“load-bearing claim. Use public subject-level terms only. Never place repository-derived”。
- **spec-first owner / 裁决：** spec-pov；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F148. `skills/ce-pov/references/agents/precedent-activity-scout.md`
- **原始 diff：** `M`，`+2/-2`，实际变更行 4。
- **实际变化：** 小型定点修改；新增条款摘录=“1. **Precedent** — has the team already evaluated, adopted, or *rejected* this? Prior decisions live in closed issues, in PR descriptions and review threads (especially a…”、“1. **Always read the local d”；完整 diff 已逐行核对。
- **spec-first owner / 裁决：** spec-pov；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F149. `skills/ce-pov/references/agents/project-grounding-scout.md`
- **原始 diff：** `M`，`+1/-1`，实际变更行 2。
- **实际变化：** 小型定点修改；新增条款摘录=“- **Prior decision** — a quick scan of '<root>/solutions/', ADRs, and design docs for an existing decision on this candidate or the job it does (a past adopt / reject /…”；完整 diff 已逐行核对。
- **spec-first owner / 裁决：** spec-pov；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F150. `skills/ce-pov/references/agents/repo-profiler.md`
- **原始 diff：** `D`，`+0/-31`，实际变更行 31。
- **实际变化：** 删除仅为 cache miss 服务的 repo-profiler persona；当前仓库画像回到当轮 research/orientation。
- **spec-first owner / 裁决：** spec-pov；`直接同步删除`。
- **理由与验证面：** 双 worktree/branch 新鲜度、无 cache I/O、仍有 current-source grounding。

### F151. `skills/ce-pov/references/boundaries.md`
- **原始 diff：** `M`，`+4/-2`，实际变更行 6。
- **实际变化：** 小型定点修改；新增条款摘录=“'ce-pov' takes a **supplied subject** and judges it **against this project**, producing a **decisive position** — not options, not requirements, not implementation, not a…”、“/ A holistic take on a supplied document ('what do you think”；完整 diff 已逐行核对。
- **spec-first owner / 裁决：** spec-pov；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F152. `skills/ce-pov/references/cross-model-panel.md`
- **原始 diff：** `A`，`+401/-0`，实际变更行 401。
- **实际变化：** ce-pov 的reference contract按该文件原始 diff 独立校准；标题变化=# Cross-Model POV Panel / ## 1. Resolve the subject, host, and participants / ## 2. Normalize scope and freeze repository identity / ## 3. Resolve and announce one fixed route / ## 4. Dispatch, wait, reap, and collect / ## 5. Detect dissent, verify claims, and reconcile；新增条款摘录=“cross-checks, never substitutes or votes. The panel is read-only and”、“- **harness/intermediary route** — the CLI or intermediary that runs it;”。
- **spec-first owner / 裁决：** spec-pov；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F153. `skills/ce-pov/references/intake.md`
- **原始 diff：** `M`，`+5/-0`，实际变更行 5。
- **实际变化：** 小型定点修改；新增条款摘录=“- **A document path** → read its headings to learn its purpose and shape; do not review it for findings yet.”、“- **Document-take** — what is the holistic take on this document: its strengths, risks, and bottom line, rather than a findings review?”；完整 diff 已逐行核对。
- **spec-first owner / 裁决：** spec-pov；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F154. `skills/ce-pov/references/invocation.md`
- **原始 diff：** `M`，`+12/-7`，实际变更行 19。
- **实际变化：** ce-pov 的reference contract按该文件原始 diff 独立校准；新增条款摘录=“If the conversation says "we have 40 call-sites on X," the project-grounding scout — or the host's own bounded read, when the sites are already located — must…”、“Short references are intentional: "on the approach," "these options," or "the three options presented" resolve from the active conversation when one referent…”；删除条款摘录=“If the conversation says "we have 40 call-sites on X," the project-grounding scout must confirm that against the codebase before it counts. **Warm adds no…”。
- **spec-first owner / 裁决：** spec-pov；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F155. `skills/ce-pov/references/method.md`
- **原始 diff：** `M`，`+39/-9`，实际变更行 48。
- **实际变化：** ce-pov 的reference contract按该文件原始 diff 独立校准；标题变化=# Method and Point-of-View Contract / ## The grounding gate / ### External-adoption questions: the two-floor Invalid-Verdict gate / ### Documents and approach sets: explicit blocker returns / ## External-adoption verdict contract / ## Document-take contract；新增条款摘录=“Load this before reasoning about the POV (SKILL.md Phase 2). It defines the Verify and POV steps, the two cross-cutting properties, the grounding gate, and the…”、“3. **Verify** (Phase 2) — apply the grounding gate below to the grounded evidence (scout dossiers and bounded inline-read observations).”；删除条款摘录=“Load this before reasoning about the verdict (SKILL.md Phase 2). It defines the Verify and Verdict steps, the two cross-cutting properties, the two-floor gate,…”、“3. **Verify** (Phase 2) — apply the two-floor gate below to the scout dossiers.”。
- **spec-first owner / 裁决：** spec-pov；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F156. `skills/ce-pov/references/pov-schema.json`
- **原始 diff：** `A`，`+52/-0`，实际变更行 52。
- **实际变化：** ce-pov 的reference contract按该文件原始 diff 独立校准；新增条款摘录=“"$schema": "http://json-schema.org/draft-07/schema#",”、“"title": "Cross-model point of view",”。
- **spec-first owner / 裁决：** spec-pov；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** schema/解析 round-trip、invalid/unknown/retired 值负例和 downstream consumer。

### F157. `skills/ce-pov/references/repo-profile-cache.md`
- **原始 diff：** `D`，`+0/-63`，实际变更行 63。
- **实际变化：** 删除共享 repo profile cache 协议、key/freshness/degradation 说明，避免缓存继续成为 Skill 输入契约。
- **spec-first owner / 裁决：** spec-pov；`直接同步删除`。
- **理由与验证面：** 双 worktree/branch 新鲜度、无 cache I/O、仍有 current-source grounding。

### F158. `skills/ce-pov/scripts/cross-model-pov.sh`
- **原始 diff：** `A`，`+743/-0`，实际变更行 743。
- **实际变化：** 新增 POV cross-model panel adapter，保留独立意见、provider/model receipt、egress 与失败隔离。
- **spec-first owner / 裁决：** spec-pov；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** 脚本语法、退出码/错误证据、路径含空格、LF、私有 scratch 与 focused fixture。

### F159. `skills/ce-pov/scripts/peer-job-runner.py`
- **原始 diff：** `A`，`+1844/-0`，实际变更行 1844。
- **实际变化：** 新增 detached peer supervisor 的 start/status/wait/result/reap 全生命周期，含私有目录、owner、timeout、size cap、进程树终止和 Windows 等价路径。
- **spec-first owner / 裁决：** spec-pov；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** start/status/wait/result/reap、owner/symlink、timeout/size cap、Windows、byte parity 或 orphan-negative。

### F160. `skills/ce-pov/scripts/repo-profile-cache.py`
- **原始 diff：** `D`，`+0/-418`，实际变更行 418。
- **实际变化：** 删除跨 run/worktree 的 repo profile cache 实现，grounding 改由当轮 current source 直接取得。
- **spec-first owner / 裁决：** spec-pov；`直接同步删除`。
- **理由与验证面：** 双 worktree/branch 新鲜度、无 cache I/O、仍有 current-source grounding。

### F161. `skills/ce-product-pulse/SKILL.md`
- **原始 diff：** `M`，`+18/-9`，实际变更行 27。
- **实际变化：** ce-product-pulse 的入口/工作流契约按该文件原始 diff 独立校准；标题变化=## Artifact Root；新增条款摘录=“This skill writes pulse reports under '<root>/pulse-reports/'. Resolve '<root>' when you first compose a '<root>/' path (per the block below), never before you…”、“**Resolve the CE artifact root '<root>' before composing any artifact path.**”；删除条款摘录=“<lookback> #$ARGUMENTS </lookback>”、“!'git rev-parse --show-toplevel'”。
- **spec-first owner / 裁决：** spec-product-pulse；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F162. `skills/ce-product-pulse/references/report-template.md`
- **原始 diff：** `M`，`+1/-1`，实际变更行 2。
- **实际变化：** 报告 footer 的保存位置从 docs/pulse-reports 改为 <root>/pulse-reports；spec-first 保持该 Skill 自有固定输出契约。
- **spec-first owner / 裁决：** spec-product-pulse；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F163. `skills/ce-proof/SKILL.md`
- **原始 diff：** `M`，`+188/-258`，实际变更行 446。
- **实际变化：** ce-proof 的入口/工作流契约按该文件原始 diff 独立校准；标题变化=## Credentials / ## Web API / # -> { ok, revision, title, markdown, comments[], suggestions[], mutationReady? } / ### Edit Strategy / ### Presence / ### Title；新增条款摘录=“Proof is a collaborative document editor for humans and agents. This skill uses the **hosted web API** at 'https://www.proofeditor.ai' (HTTP/'Bash'). If typed…”、“Do not silently replace repo-tracked project docs with Proof links. Do not put secrets, credentials, API keys, private tokens, or sensitive personal data in…”；删除条款摘录=“Proof is a collaborative document editor for humans and agents. It supports two modes:”、“2. **Local Bridge** - Drive the macOS Proof app via localhost:9847”。
- **spec-first owner / 裁决：** spec-proof；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F164. `skills/ce-resolve-pr-feedback/SKILL.md`
- **原始 diff：** `M`，`+16/-2`，实际变更行 18。
- **实际变化：** ce-resolve-pr-feedback 的入口/工作流契约按该文件原始 diff 独立校准；标题变化=## Platform；新增条款摘录=“**Escalations never block.** 'needs-human' is the escalation channel: the thread is left open with a natural reply, and the structured 'decision_context' is…”、“**'mode:pipeline'** (set by an orchestrator like 'ce-babysit-pr' or 'lfg'): behave exactly as above, with three specifics. (1) Never call the blocking-question…”。
- **spec-first owner / 裁决：** spec-resolve-pr-feedback；`直接同步`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F165. `skills/ce-resolve-pr-feedback/references/agents/pr-comment-resolver.md`
- **原始 diff：** `M`，`+5/-2`，实际变更行 7。
- **实际变化：** 小型定点修改；新增条款摘录=“2. **Implement the fix.** Keep it focused -- address the feedback, don't refactor the neighborhood. If the suggested approach would work but a clearly better one exists,…”；完整 diff 已逐行核对。
- **spec-first owner / 裁决：** spec-resolve-pr-feedback；`直接同步`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F166. `skills/ce-resolve-pr-feedback/references/evaluation-rubric.md`
- **原始 diff：** `M`，`+6/-0`，实际变更行 6。
- **实际变化：** 小型定点修改；新增条款摘录=“1. **Positive evidence of intent** -- a concrete artifact showing the current behavior is a choice, not an accident: a comment/docstring stating it, a test asserting it,…”；完整 diff 已逐行核对。
- **spec-first owner / 裁决：** spec-resolve-pr-feedback；`直接同步`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F167. `skills/ce-resolve-pr-feedback/references/full-mode.md`
- **原始 diff：** `M`，`+62/-57`，实际变更行 119。
- **实际变化：** ce-resolve-pr-feedback 的reference contract按该文件原始 diff 独立校准；标题变化=# SKILL_DIR = the absolute directory you loaded the ce-resolve-pr-feedback SKILL.md from. / # The Bash tool's CWD is the user's project, not the skill dir, and shell state does not / # persist between Bash calls — set SKILL_DIR in each block below that runs a bundled script. / # Extract numeric comment ID from the comment URL (e.g. discussion_r2589700 → 2589700)；新增条款摘录=“Read this reference when Mode Detection (in SKILL.md) routes to **Full Mode** — no argument given, a PR number was provided, or a whole-PR URL ('.../pull/N'…”、“**GitHub Enterprise host.** The bundled 'gh api graphql' scripts hit 'gh''s default host unless told otherwise, so on a GHE PR they would wrongly target…”；删除条款摘录=“Read this reference when Mode Detection (in SKILL.md) routes to **Full Mode** — no argument given, or a PR number was provided. Full mode processes all…”、“echo "ce-resolve-pr-feedback bundled scripts not found under $SCRIPT_DIR; use the fallback gh commands below." >&2”。
- **spec-first owner / 裁决：** spec-resolve-pr-feedback；`直接同步`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F168. `skills/ce-resolve-pr-feedback/references/targeted-mode.md`
- **原始 diff：** `M`，`+17/-16`，实际变更行 33。
- **实际变化：** targeted mode 增加 GitHub Enterprise GH_HOST 传播、bundled script 绝对路径和 pending review 预检，防止回复落错 host 或被未提交 review 吞掉。
- **spec-first owner / 裁决：** spec-resolve-pr-feedback；`直接同步`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F169. `skills/ce-resolve-pr-feedback/scripts/get-pr-comments`
- **原始 diff：** `M`，`+45/-37`，实际变更行 82。
- **实际变化：** GraphQL 大响应改为私有临时文件流式处理，并修复首元素 index 0 命中。
- **spec-first owner / 裁决：** spec-resolve-pr-feedback；`直接同步`。
- **理由与验证面：** 脚本语法、退出码/错误证据、路径含空格、LF、私有 scratch 与 focused fixture。

### F170. `skills/ce-resolve-pr-feedback/scripts/get-thread-for-comment`
- **原始 diff：** `M`，`+8/-5`，实际变更行 13。
- **实际变化：** 修正 comment-thread 定位、首元素与错误处理。
- **spec-first owner / 裁决：** spec-resolve-pr-feedback；`直接同步`。
- **理由与验证面：** 脚本语法、退出码/错误证据、路径含空格、LF、私有 scratch 与 focused fixture。

### F171. `skills/ce-resolve-pr-feedback/scripts/reply-to-pr-thread`
- **原始 diff：** `M`，`+12/-0`，实际变更行 12。
- **实际变化：** 改用真实多行 Markdown payload，并保护 pending review 场景。
- **spec-first owner / 裁决：** spec-resolve-pr-feedback；`直接同步`。
- **理由与验证面：** 脚本语法、退出码/错误证据、路径含空格、LF、私有 scratch 与 focused fixture。

### F172. `skills/ce-retune/SKILL.md`
- **原始 diff：** `A`，`+97/-0`，实际变更行 97。
- **实际变化：** ce-retune 的入口/工作流契约按该文件原始 diff 独立校准；标题变化=# Retune a Corpus for a New Model / ## Phase 0: the measurement gate — check this first / ## Phase 1: mine the archive before spending a run / ## Phase 2: establish the noise floor before any claim / ## Phase 3: audit the corpus, adversarially / ## Phase 4: cut in surgical passes；新增条款摘录=“description: "Retune a skill corpus for a new model, measurement-first: mine the run archive for a baseline, establish a noise floor, audit the corpus…”、“disable-model-invocation: true”。
- **spec-first owner / 裁决：** spec-write-skill + spec-optimize；`等价能力已存在`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F173. `skills/ce-retune/references/baseline-mining.md`
- **原始 diff：** `A`，`+122/-0`，实际变更行 122。
- **实际变化：** ce-retune 的reference contract按该文件原始 diff 独立校准；标题变化=# Phase 1: mine the archive / ## What the archive must contain / ## Build the phase-marker map first / ## Extract one row per run / ## Derived metrics / ## Outcome taxonomy；新增条款摘录=“Zero model cost. Everything here reads files that already exist on disk. Do not run the harness in this phase — Phase 2 owns the first paid runs…”、“Find the archive by asking the harness where it writes run output, or by locating the directory it appends to after a run. Do not assume a schema; read one run…”。
- **spec-first owner / 裁决：** spec-write-skill + spec-optimize；`等价能力已存在`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F174. `skills/ce-retune/references/corpus-audit.md`
- **原始 diff：** `A`，`+119/-0`，实际变更行 119。
- **实际变化：** ce-retune 的reference contract按该文件原始 diff 独立校准；标题变化=# Phase 3: Adversarial Corpus Audit / ## Dispatch shape / ## Finding schema / ## Classes worth hunting / ## Defender rulings / ## Protocol regardless of model tier；新增条款摘录=“**Wave 1 — proposers.** One agent per corpus unit. Give it the unit's **full directory**, not just its entry file: conditionally-loaded reference files are…”、“**Wave 2 — defenders.** One agent per unit, given that unit's directory *and* its proposal set, with the opposite job: find a reason each targeted line exists.…”。
- **spec-first owner / 裁决：** spec-write-skill + spec-optimize；`等价能力已存在`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F175. `skills/ce-retune/references/cut-passes.md`
- **原始 diff：** `A`，`+108/-0`，实际变更行 108。
- **实际变化：** ce-retune 的reference contract按该文件原始 diff 独立校准；标题变化=# Cut Passes (Phase 4) / ## The pass loop / ## Ownership: one problem per agent, disjoint files / ## Isolation: separate worktrees or disjoint paths in one tree / ## The shared-asset trap / ## Author the contract before a parallel rewrite；新增条款摘录=“2. Write the **ownership manifest**: unit -> owning agent -> exact paths. Shared assets get a single named owner (below).”、“4. Dispatch one agent per unit through whatever sub-agent primitive the platform provides, each prompt carrying: the class, the contract path if any, its own…”。
- **spec-first owner / 裁决：** spec-write-skill + spec-optimize；`等价能力已存在`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F176. `skills/ce-retune/references/halt-taxonomy.md`
- **原始 diff：** `A`，`+119/-0`，实际变更行 119。
- **实际变化：** ce-retune 的reference contract按该文件原始 diff 独立校准；标题变化=# Halt Taxonomy / ## The mechanism / ## 1. Waits on helpers the runtime already terminated / ## 2. Hand-off across a same-model seam / ## 3. A step ending with no instruction to advance / ## 4. Completion defined without a successor；新增条款摘录=“When a workflow "phase" is invoked by loading its instructions into the **same conversation** — a skill load, an include, a prose route to "the review phase" —…”、“**The diagnostic that settles which seams are real.** In the run archive, find one session id whose trace contains *both* phase-invocation calls (skill loads,…”。
- **spec-first owner / 裁决：** spec-write-skill + spec-optimize；`等价能力已存在`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F177. `skills/ce-retune/references/noise-floor.md`
- **原始 diff：** `A`，`+131/-0`，实际变更行 131。
- **实际变化：** ce-retune 的reference contract按该文件原始 diff 独立校准；标题变化=# Noise Floor and the Registered Bar / ## What the A/A run buys / ## Setup / ## Interleave, never batch / ## Provenance per row / ## Statistics that survive small n；新增条款摘录=“Two builds of the corpus at the same commit, run under one harness on one task, produce a distribution rather than a result. That distribution is the floor:…”、“Required capability: a harness that can point a run at a specific source checkout of the corpus (Phase 0's build selector) and writes a per-run artifact you…”。
- **spec-first owner / 裁决：** spec-write-skill + spec-optimize；`等价能力已存在`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F178. `skills/ce-retune/references/workflow-shapes.md`
- **原始 diff：** `A`，`+71/-0`，实际变更行 71。
- **实际变化：** ce-retune 的reference contract按该文件原始 diff 独立校准；标题变化=# Workflow Shapes / ## The shapes / ## Per phase / ## Cross-cutting rules；新增条款摘录=“- **A dispatch primitive** that launches an independent agent with its own context window and returns a result to the orchestrator (in one host it is a…”、“/---/---/---/---/”。
- **spec-first owner / 裁决：** spec-write-skill + spec-optimize；`等价能力已存在`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F179. `skills/ce-riffrec-feedback-analysis/SKILL.md`
- **原始 diff：** `M`，`+1/-1`，实际变更行 2。
- **实际变化：** SKILL_DIR 赋值补分号，避免 shell flatten；analyzer 输入/隐私/输出语义不变。
- **spec-first owner / 裁决：** spec-riffrec-feedback-analysis；`直接同步`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F180. `skills/ce-riffrec-feedback-analysis/references/compound-engineering-feedback-format.md`
- **原始 diff：** `M`，`+1/-1`，实际变更行 2。
- **实际变化：** handoff 文案从 Claude slash command 改为 host-neutral 的 Skill invocation。
- **spec-first owner / 裁决：** spec-riffrec-feedback-analysis；`直接同步`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F181. `skills/ce-riffrec-feedback-analysis/references/extensive-analysis.md`
- **原始 diff：** `M`，`+2/-2`，实际变更行 4。
- **实际变化：** SKILL_DIR 赋值补分号，且 durable requirements 输出不再硬编码 docs/plans。
- **spec-first owner / 裁决：** spec-riffrec-feedback-analysis；`直接同步`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F182. `skills/ce-riffrec-feedback-analysis/references/quick-bug-report.md`
- **原始 diff：** `M`，`+1/-1`，实际变更行 2。
- **实际变化：** quick path 的 SKILL_DIR 赋值补分号，继续使用私有临时目录且不自动写 repo。
- **spec-first owner / 裁决：** spec-riffrec-feedback-analysis；`直接同步`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F183. `skills/ce-riffrec-feedback-analysis/scripts/analyze_riffrec_zip.py`
- **原始 diff：** `M`，`+2/-2`，实际变更行 4。
- **实际变化：** 校准脚本路径/Python 调用与 LF 兼容，业务分析逻辑不扩张；两份 Skill-local analyzer 必须维持 parity。
- **spec-first owner / 裁决：** spec-riffrec-feedback-analysis；`直接同步`。
- **理由与验证面：** 脚本语法、退出码/错误证据、路径含空格、LF、私有 scratch 与 focused fixture。

### F184. `skills/ce-setup/SKILL.md`
- **原始 diff：** `M`，`+29/-9`，实际变更行 38。
- **实际变化：** ce-setup 的入口/工作流契约按该文件原始 diff 独立校准；标题变化=## Artifact Root Resolution / ### Step 6a: Repair Invalid CE Work Preferences / ### Step 6b: Repair Invalid 'docs_root'；新增条款摘录=“Every Compound Engineering skill that writes or reads an artifact directory ('solutions', 'plans', 'ideation', and the other CE-owned trees) resolves its root…”、“**Resolve the CE artifact root '<root>' before composing any artifact path.**”；删除条款摘录=“bash "$SKILL_DIR/scripts/check-health" --version VERSION”。
- **spec-first owner / 裁决：** spec-runtime-setup + CLI config owners；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F185. `skills/ce-setup/references/config-template.yaml`
- **原始 diff：** `M`，`+70/-11`，实际变更行 81。
- **实际变化：** ce-setup 的reference contract按该文件原始 diff 独立校准；标题变化=# All settings are optional. Invalid values fall through to defaults / # (except docs_root -- see below, which fails closed on an unusable value). / # --- Artifact root --- / # Relocate every CE-written artifact folder (solutions, plans, ideation, / # explainers, residual-review-findings, pulse-reports, dogfood-reports, / # feedback-sweep, personas) under one repo-relative root. Unset -> 'docs',。
- **spec-first owner / 裁决：** spec-runtime-setup + CLI config owners；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** schema/解析 round-trip、invalid/unknown/retired 值负例和 downstream consumer。

### F186. `skills/ce-setup/scripts/check-health`
- **原始 diff：** `M`，`+360/-0`，实际变更行 360。
- **实际变化：** 健康检查新增窄 YAML 解析、docs_root 安全、retired key 和 work-engine preference 诊断；spec-first 映射到 Node registry/facts，不复制 shell parser。
- **spec-first owner / 裁决：** spec-runtime-setup + CLI config owners；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** 脚本语法、退出码/错误证据、路径含空格、LF、私有 scratch 与 focused fixture。

### F187. `skills/ce-simplify-code/SKILL.md`
- **原始 diff：** `M`，`+6/-0`，实际变更行 6。
- **实际变化：** 小型定点修改；新增条款摘录=“**Preflight — skip a no-yield scope before spending reviewers.** The three reviewers hunt for reuse, quality, and efficiency issues in *code*. If the resolved scope…”；完整 diff 已逐行核对。
- **spec-first owner / 裁决：** spec-simplify-code；`直接同步`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F188. `skills/ce-simplify-code/references/personas/code-quality-reviewer.md`
- **原始 diff：** `M`，`+1/-1`，实际变更行 2。
- **实际变化：** 重复代码审查先判断能否依赖现有 truth/platform guarantee 直接消除，再考虑抽象；要求保留转换语义并用测试证明 exact equivalence。
- **spec-first owner / 裁决：** spec-simplify-code；`直接同步`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F189. `skills/ce-simplify-code/references/personas/code-reuse-reviewer.md`
- **原始 diff：** `M`，`+1/-0`，实际变更行 1。
- **实际变化：** 小型定点修改；新增条款摘录=“5. **Flag diff code that hand-maintains a guarantee the platform, framework, or downstream layer already provides.** Existing functionality includes verified…”；完整 diff 已逐行核对。
- **spec-first owner / 裁决：** spec-simplify-code；`直接同步`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F190. `skills/ce-strategy/SKILL.md`
- **原始 diff：** `M`，`+1/-1`，实际变更行 2。
- **实际变化：** 小型定点修改；新增条款摘录=“The **focus hint** is any optional argument this skill was invoked with — present in the current prompt or conversation, whether the user gave it directly or a calling…”；删除条款摘录=“<focus_hint> #$ARGUMENTS </focus_hint>”；完整 diff 已逐行核对。
- **spec-first owner / 裁决：** spec-strategy；`直接同步`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F191. `skills/ce-sweep/SKILL.md`
- **原始 diff：** `M`，`+40/-14`，实际变更行 54。
- **实际变化：** ce-sweep 的入口/工作流契约按该文件原始 diff 独立校准；标题变化=## Artifact Root；新增条款摘录=“description: "Sweep configured feedback sources (Slack, GitHub Issues; email experimental) for new items: acknowledge at source, analyze recordings, verify…”、“'ce-sweep' sweeps every configured feedback source for items posted since the last run: it acknowledges each at its source, analyzes any attached recordings,…”；删除条款摘录=“description: "Sweep configured feedback sources (Slack, GitHub Issues; email experimental) for new items: acknowledge at source, analyze recordings, verify…”、“'ce-sweep' sweeps every configured feedback source for items posted since the last run: it acknowledges each at its source, analyzes any attached recordings,…”。
- **spec-first owner / 裁决：** spec-sweep；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F192. `skills/ce-sweep/references/agents/media-analyzer.md`
- **原始 diff：** `M`，`+3/-2`，实际变更行 5。
- **实际变化：** 小型定点修改；新增条款摘录=“PY='$(for c in python3 python py; do command -v '$c' >/dev/null 2>&1 && '$c' -c '' >/dev/null 2>&1 && { echo '$c'; break; }; done)'; [ -n '$PY' ] // { echo 'no working…”、“'$PY' '$SKILL_DIR/scripts/analyze_riffrec_zip.py' <media_path> --output-dir <scratch_dir>”；删除条款摘录=“python3 '$SKILL_DIR/scripts/analyze_riffrec_zip.py' <media_path> --output-dir <scratch_dir>”；完整 diff 已逐行核对。
- **spec-first owner / 裁决：** spec-sweep；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F193. `skills/ce-sweep/references/interview.md`
- **原始 diff：** `M`，`+27/-11`，实际变更行 38。
- **实际变化：** ce-sweep 的reference contract按该文件原始 diff 独立校准；新增条款摘录=“**User-runnable invocation rendering.** Whenever this interview prints or registers a 'ce-sweep' invocation, default to '/ce-sweep' (plus any arguments); use…”、“- **Committed to the repo** (recommended when multiple agents or machines share branches — one source of truth everyone reads and writes). Sets…”；删除条款摘录=“- **Machine-local under '/tmp'** (solo setups; keeps sweep bookkeeping out of the repo, no commit noise). Sets 'sweep_state_path' to…”、“**Ask:** "Do you have an existing feedback state file to import — for example a prior dogfood tracker like 'docs/dogfood-reports/cora-v2-alpha-feedback-state.ym…”。
- **spec-first owner / 裁决：** spec-sweep；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F194. `skills/ce-sweep/references/plan-template.md`
- **原始 diff：** `M`，`+2/-2`，实际变更行 4。
- **实际变化：** 小型定点修改；新增条款摘录=“- **Rotation check (before any write).** If '<root>/plans/feedback-sweep-plan.md' exists and its frontmatter is NOT both 'product_contract_source: ce-sweep' and…”；删除条款摘录=“- **Rotation check (before an”；完整 diff 已逐行核对。
- **spec-first owner / 裁决：** spec-sweep；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F195. `skills/ce-sweep/scripts/analyze_riffrec_zip.py`
- **原始 diff：** `M`，`+2/-2`，实际变更行 4。
- **实际变化：** 校准脚本路径/Python 调用与 LF 兼容，业务分析逻辑不扩张；两份 Skill-local analyzer 必须维持 parity。
- **spec-first owner / 裁决：** spec-sweep；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** 脚本语法、退出码/错误证据、路径含空格、LF、私有 scratch 与 focused fixture。

### F196. `skills/ce-sweep/scripts/sweep-state.py`
- **原始 diff：** `M`，`+1/-1`，实际变更行 2。
- **实际变化：** 状态脚本做兼容性校准，保持 resume/损坏状态处理与原子写入边界。
- **spec-first owner / 裁决：** spec-sweep；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** 脚本语法、退出码/错误证据、路径含空格、LF、私有 scratch 与 focused fixture。

### F197. `skills/ce-test-browser/SKILL.md`
- **原始 diff：** `M`，`+37/-94`，实际变更行 131。
- **实际变化：** ce-test-browser 的入口/工作流契约按该文件原始 diff 独立校准；标题变化=## Browser Driver Policy / ## Workflow / ### 1. Select the Browser Driver / ### 6. Set Browser Visibility and Verify the Root / ## Driver Reference / ## Use 'agent-browser' Only；新增条款摘录=“Run end-to-end browser tests on pages affected by a PR or branch using the best approved browser driver available in the active harness.”、“- **Manual (default):** the user controls the dev server. When the fallback driver is 'agent-browser', ask whether to run headed or headless.”；删除条款摘录=“Run end-to-end browser tests on pages affected by a PR or branch changes using the 'agent-browser' CLI.”、“- **Pipeline ('mode:pipeline'):** invoked by LFG or another automated runner. The run is unattended — never block on a question. Read…”。
- **spec-first owner / 裁决：** spec-test-browser + spec-lfg；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F198. `skills/ce-test-browser/references/agent-browser-driver.md`
- **原始 diff：** `A`，`+47/-0`，实际变更行 47。
- **实际变化：** ce-test-browser 的reference contract按该文件原始 diff 独立校准；标题变化=# 'agent-browser' Fallback Driver / ## Bootstrap / ## Commands Used by This Skill / # Navigate and inspect / # Interact using refs from the latest snapshot / # Capture evidence；新增条款摘录=“Read this file only after the main skill selects 'agent-browser' because no qualifying host-native integrated browser is available.”、“Verify the direct CLI is installed:”。
- **spec-first owner / 裁决：** spec-test-browser + spec-lfg；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F199. `skills/ce-test-browser/references/pipeline-orchestration.md`
- **原始 diff：** `M`，`+7/-4`，实际变更行 11。
- **实际变化：** 小型定点修改；新增条款摘录=“Read and follow this file only when invoked with 'mode:pipeline' (LFG or another automated runner). It overrides visibility prompts, free-port selection, and dev-server…”、“- When a host-native integrated browser is selected, keep its normal integrated surface visible and non-blocking so the user can w”；完整 diff 已逐行核对。
- **spec-first owner / 裁决：** spec-test-browser + spec-lfg；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F200. `skills/ce-work/SKILL.md`
- **原始 diff：** `M`，`+98/-112`，实际变更行 210。
- **实际变化：** ce-work 的入口/工作流契约按该文件原始 diff 独立校准；标题变化=## Outcome / ## Artifact Root / ## Introduction；新增条款摘录=“argument-hint: "[Plan path, work description, or recovery request with run id; blank uses latest] / [mode:return-to-caller…”、“- **Next consumer:** In standalone use, the shipping workflow takes the verified change through review and delivery. In Return-to-Caller Mode, the invoking…”；删除条款摘录=“argument-hint: "[Plan doc path or description of work. Blank to auto use latest plan doc]"”、“<input_document> #$ARGUMENTS </input_document>”。
- **spec-first owner / 裁决：** spec-work + spec-worktree；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F201. `skills/ce-work/references/agents/implementation-worker.md`
- **原始 diff：** `A`，`+16/-0`，实际变更行 16。
- **实际变化：** ce-work 的agent prompt按该文件原始 diff 独立校准；标题变化=# External Implementation Worker；新增条款摘录=“Implement exactly the supplied implementation unit in the supplied workspace. The unit packet is your complete authority boundary. The caller, unit packet, and…”、“Your final response must be one JSON object matching the supplied schema, with no code fence or surrounding prose. Use:”。
- **spec-first owner / 裁决：** spec-work + spec-worktree；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F202. `skills/ce-work/references/cross-model-execution.md`
- **原始 diff：** `A`，`+128/-0`，实际变更行 128。
- **实际变化：** ce-work 的reference contract按该文件原始 diff 独立校准；标题变化=# Cross-Model Execution Contract / ## Resolve one requested route / ## Apply preference or requirement strength / ## Sanction before egress / ## Bound worker authority / ## Preserve route and lifecycle receipts；新增条款摘录=“Load this reference only after the cross-model engine is selected or recovery of an existing external run is activated. It defines the fixed-route, authority,…”、“Use only these targets: 'codex', 'claude', 'grok', 'cursor', and 'composer'. Keep five identity facts separate in every disclosure and receipt: target,…”。
- **spec-first owner / 裁决：** spec-work + spec-worktree；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F203. `skills/ce-work/references/cross-model-work-eval.md`
- **原始 diff：** `A`，`+103/-0`，实际变更行 103。
- **实际变化：** ce-work 的reference contract按该文件原始 diff 独立校准；标题变化=# Cross-Model CE Work Behavioral Eval / ## Method / ## Required response fields / ## Fixture pack / ## Coverage roll-up；新增条款摘录=“Use this evaluator-owned pack after a material change to CE Work's cross-model”、“execution contract. It is not a runtime reference and must not be injected into”。
- **spec-first owner / 裁决：** spec-work + spec-worktree；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F204. `skills/ce-work/references/execution-engines.md`
- **原始 diff：** `M`，`+78/-3`，实际变更行 81。
- **实际变化：** ce-work 的reference contract按该文件原始 diff 独立校准；标题变化=## Resolve cross-model routing before the capability probe / ### Typed caller binding / ### Target and identity vocabulary / ### Per-checkout configuration / ### Cross-model execution；新增条款摘录=“'ce-work' has four implementation engines: inline/subagent, goal-mode, dynamic-workflow, and cross-model execution. The engine decides *how* implementation…”、“Engine selection applies only to code execution. Knowledge-work keeps its carve-out. Legacy plans and bare code prompts may select cross-model execution, but…”；删除条款摘录=“'ce-work' can implement an implementation-ready unified plan with one of three engines. The engine is chosen once, after Phase 0 classifies the plan as…”。
- **spec-first owner / 裁决：** spec-work + spec-worktree；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F205. `skills/ce-work/references/implementation-loop.md`
- **原始 diff：** `A`，`+73/-0`，实际变更行 73。
- **实际变化：** ce-work 的reference contract按该文件原始 diff 独立校准；标题变化=# Implementation Loop；新增条款摘录=“When the selected engine is cross-model execution, this loop still owns unit ordering, evidence selection, actual-scope inspection, authoritative verification,…”、“- **If the unit's work is already present and matches the plan's intent** (files exist with the expected capability, or the unit's 'Verification' criteria are…”。
- **spec-first owner / 裁决：** spec-work + spec-worktree；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F206. `skills/ce-work/references/implementation-result-schema.json`
- **原始 diff：** `A`，`+52/-0`，实际变更行 52。
- **实际变化：** ce-work 的reference contract按该文件原始 diff 独立校准；新增条款摘录=“"$schema": "https://json-schema.org/draft/2020-12/schema",”、“"required": [”。
- **spec-first owner / 裁决：** spec-work + spec-worktree；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** schema/解析 round-trip、invalid/unknown/retired 值负例和 downstream consumer。

### F207. `skills/ce-work/references/review-findings-followup.md`
- **原始 diff：** `M`，`+3/-3`，实际变更行 6。
- **实际变化：** 小型定点修改；新增条款摘录=“'ce-code-review' is invoked here with 'mode:agent', so it is **review-only** in this context — it reports findings and writes artifacts and does not mutate the checkout,…”、“- Run artifact dir: '<artifact-path>/' ('review.json', per-reviewer JSON for 'why_it_matters')”；完整 diff 已逐行核对。
- **spec-first owner / 裁决：** spec-work + spec-worktree；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F208. `skills/ce-work/references/shipping-workflow.md`
- **原始 diff：** `M`，`+12/-8`，实际变更行 20。
- **实际变化：** ce-work 的reference contract按该文件原始 diff 独立校准；新增条款摘录=“Before code review, invoke **'ce-simplify-code'** when the diff has enough substantive code to benefit (default: **>=30 substantive changed code lines** —…”、“After code review and review-findings followup, inspect the **Actionable Findings** summary (or read the absolute '<artifact-path>' returned by…”；删除条款摘录=“Before code review, invoke **'ce-simplify-code'** when the diff is non-mechanical and large enough to benefit (default: **>=30 changed lines**). Skip when the…”、“After code review and review-findings followup, inspect the **Actionable Findings** summary (or read the run artifact at…”。
- **spec-first owner / 裁决：** spec-work + spec-worktree；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F209. `skills/ce-work/references/tracker-defer.md`
- **原始 diff：** `M`，`+3/-2`，实际变更行 5。
- **实际变化：** 小型定点修改；新增条款摘录=“- Plain-English problem statement — reads the persona-produced 'why_it_matters' from the contributing reviewer's artifact file at '<artifact-path>/{reviewer}.json', using…”；完整 diff 已逐行核对。
- **spec-first owner / 裁决：** spec-work + spec-worktree；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F210. `skills/ce-work/scripts/cross-model-work.sh`
- **原始 diff：** `A`，`+909/-0`，实际变更行 909。
- **实际变化：** 新增外部 implementation engine adapter，在 controller 授权 workspace 内单写 lane 执行并返回结构化结果；spec-first 仅吸收 receipt 不变量。
- **spec-first owner / 裁决：** spec-work + spec-worktree；`按边界吸收不复制`。
- **理由与验证面：** 脚本语法、退出码/错误证据、路径含空格、LF、私有 scratch 与 focused fixture。

### F211. `skills/ce-work/scripts/peer-job-runner.py`
- **原始 diff：** `A`，`+1844/-0`，实际变更行 1844。
- **实际变化：** 新增 detached peer supervisor 的 start/status/wait/result/reap 全生命周期，含私有目录、owner、timeout、size cap、进程树终止和 Windows 等价路径。
- **spec-first owner / 裁决：** spec-work + spec-worktree；`按边界吸收不复制`。
- **理由与验证面：** start/status/wait/result/reap、owner/symlink、timeout/size cap、Windows、byte parity 或 orphan-negative。

### F212. `skills/ce-work/scripts/unit-workspace.py`
- **原始 diff：** `A`，`+215/-0`，实际变更行 215。
- **实际变化：** 新增 CE Work controller CLI 入口；spec-first 不复制中央控制器，拆回现有 spec-work/spec-worktree owner。
- **spec-first owner / 裁决：** spec-work + spec-worktree；`按边界吸收不复制`。
- **理由与验证面：** 脚本语法、退出码/错误证据、路径含空格、LF、私有 scratch 与 focused fixture。

### F213. `skills/ce-work/scripts/unit_workspace_integration.py`
- **原始 diff：** `A`，`+668/-0`，实际变更行 668。
- **实际变化：** 新增 integration lock、依赖/wave/path/shared-contract collision 预检和 apply/verify/commit 状态。
- **spec-first owner / 裁决：** spec-work + spec-worktree；`按边界吸收不复制`。
- **理由与验证面：** 脚本语法、退出码/错误证据、路径含空格、LF、私有 scratch 与 focused fixture。

### F214. `skills/ce-work/scripts/unit_workspace_jobs.py`
- **原始 diff：** `A`，`+1160/-0`，实际变更行 1160。
- **实际变化：** 新增 unit prepare、detached job binding、终态/result/process evidence 管理。
- **spec-first owner / 裁决：** spec-work + spec-worktree；`按边界吸收不复制`。
- **理由与验证面：** 脚本语法、退出码/错误证据、路径含空格、LF、私有 scratch 与 focused fixture。

### F215. `skills/ce-work/scripts/unit_workspace_lifecycle.py`
- **原始 diff：** `A`，`+989/-0`，实际变更行 989。
- **实际变化：** 新增 status/resume/fallback/reap/cleanup/recovery-blocker 生命周期。
- **spec-first owner / 裁决：** spec-work + spec-worktree；`按边界吸收不复制`。
- **理由与验证面：** 脚本语法、退出码/错误证据、路径含空格、LF、私有 scratch 与 focused fixture。

### F216. `skills/ce-work/scripts/unit_workspace_state.py`
- **原始 diff：** `A`，`+982/-0`，实际变更行 982。
- **实际变化：** 新增 run/unit identity、授权、egress、checkpoint 与私有状态持久化。
- **spec-first owner / 裁决：** spec-work + spec-worktree；`按边界吸收不复制`。
- **理由与验证面：** 脚本语法、退出码/错误证据、路径含空格、LF、私有 scratch 与 focused fixture。

### F217. `skills/ce-work/scripts/unit_workspace_transaction.py`
- **原始 diff：** `A`，`+954/-0`，实际变更行 954。
- **实际变化：** 新增 integrate/run-wide verification/ignored artifact snapshot/rollback 恢复事务。
- **spec-first owner / 裁决：** spec-work + spec-worktree；`按边界吸收不复制`。
- **理由与验证面：** 脚本语法、退出码/错误证据、路径含空格、LF、私有 scratch 与 focused fixture。

### F218. `skills/lfg/SKILL.md`
- **原始 diff：** `M`，`+81/-69`，实际变更行 150。
- **实际变化：** lfg 的入口/工作流契约按该文件原始 diff 独立校准；标题变化=## Task Visibility / ## Artifact Root / ## Per-stage routing carriers；新增条款摘录=“description: "Run the full autonomous shipping pipeline end-to-end, hands-off with no check-ins: plan, implement, review and fix, commit, push a branch, open a…”、“argument-hint: "[feature description; optionally assign planning and/or implementation to a model or harness]"”；删除条款摘录=“description: Run the full hands-off engineering pipeline from planning through a green PR.”、“disable-model-invocation: true”。
- **spec-first owner / 裁决：** spec-lfg；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F219. `skills/lfg/references/next-work-handoff.md`
- **原始 diff：** `A`，`+96/-0`，实际变更行 96。
- **实际变化：** 新增 LFG 结束后的“下一独立区域”推荐，并在用户接受后通过 ce-handoff 创建 fresh brainstorm continuity；该文件依赖本计划明确拒绝的 generic handoff，故单文件不采纳。
- **spec-first owner / 裁决：** existing artifact/session contracts；`明确不采纳`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F220. `skills/lfg/references/tracker-defer.md`
- **原始 diff：** `M`，`+3/-2`，实际变更行 5。
- **实际变化：** 小型定点修改；新增条款摘录=“- Plain-English problem statement — reads the persona-produced 'why_it_matters' from the contributing reviewer's artifact file at '<artifact-path>/{reviewer}.json', using…”；完整 diff 已逐行核对。
- **spec-first owner / 裁决：** spec-lfg；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** source contract test + fresh-source eval；未授权 peer/外发时零副作用，generated runtime 仅通过 init 投射。

### F221. `src/commands/convert.ts`
- **原始 diff：** `M`，`+3/-3`，实际变更行 6。
- **实际变化：** Codex target 完成后不再创建/写入 Claude compatibility tool map，改为仅清理历史 managed block。
- **spec-first owner / 裁决：** src/cli current adapter/helper owner；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** current adapter/converter/ownership 单测、collision/no-follow、所有实际 supported hosts 回归。

### F222. `src/commands/install.ts`
- **原始 diff：** `M`，`+3/-3`，实际变更行 6。
- **实际变化：** Codex install 完成后不再 upsert Claude compatibility tool map，改为只剥离历史 managed block。
- **spec-first owner / 裁决：** src/cli current adapter/helper owner；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** current adapter/converter/ownership 单测、collision/no-follow、所有实际 supported hosts 回归。

### F223. `src/converters/claude-to-copilot.ts`
- **原始 diff：** `M`，`+2/-7`，实际变更行 9。
- **实际变化：** slash-command 转换改用共享 path-aware helper，避免把 /etc/hosts、/tmp/x 等路径误写成 command。
- **spec-first owner / 裁决：** src/cli current adapter/helper owner；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** current adapter/converter/ownership 单测、collision/no-follow、所有实际 supported hosts 回归。

### F224. `src/converters/claude-to-droid.ts`
- **原始 diff：** `M`，`+4/-9`，实际变更行 13。
- **实际变化：** slash-command 转换改用共享 helper；tool 推断使用单词边界，并把 AskUserQuestion 正确映射为 AskUser。
- **spec-first owner / 裁决：** src/cli current adapter/helper owner；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** current adapter/converter/ownership 单测、collision/no-follow、所有实际 supported hosts 回归。

### F225. `src/converters/claude-to-kiro.ts`
- **原始 diff：** `M`，`+21/-5`，实际变更行 26。
- **实际变化：** Kiro command 转换增加 reserved-root、后续斜杠和 backtick 判断，避免 POSIX/Windows 绝对路径被改写成 Skill invocation。
- **spec-first owner / 裁决：** src/cli current adapter/helper owner；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** current adapter/converter/ownership 单测、collision/no-follow、所有实际 supported hosts 回归。

### F226. `src/converters/claude-to-pi.ts`
- **原始 diff：** `M`，`+2/-7`，实际变更行 9。
- **实际变化：** Pi slash-command 转换改用共享 path-aware helper，统一 command/path 判别。
- **spec-first owner / 裁决：** src/cli current adapter/helper owner；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** current adapter/converter/ownership 单测、collision/no-follow、所有实际 supported hosts 回归。

### F227. `src/dev/codex-dev.ts`
- **原始 diff：** `A`，`+700/-0`，实际变更行 700。
- **实际变化：** 新增 local/refresh/status/remote/remove 本地插件切换器，含 checkout provenance、symlink/collision、plugin id 和 inventory 校验；spec-first 不复制。
- **spec-first owner / 裁决：** src/cli current adapter/helper owner；`明确不采纳`。
- **理由与验证面：** current adapter/converter/ownership 单测、collision/no-follow、所有实际 supported hosts 回归。

### F228. `src/release/metadata.ts`
- **原始 diff：** `M`，`+6/-2`，实际变更行 8。
- **实际变化：** Codex marketplace metadata 增加 co-located plugin 必须使用 local source 的校验，避免 /plugins preview 丢失 skills/hooks/apps/MCP。
- **spec-first owner / 裁决：** src/cli current adapter/helper owner；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** current adapter/converter/ownership 单测、collision/no-follow、所有实际 supported hosts 回归。

### F229. `src/targets/codex.ts`
- **原始 diff：** `M`，`+50/-17`，实际变更行 67。
- **实际变化：** CLI/转换/安装 owner 调整；全量 diff 标记为 private-scratch、managed-path-safety，函数结构扫描 134 个符号。
- **spec-first owner / 裁决：** src/cli current adapter/helper owner；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** current adapter/converter/ownership 单测、collision/no-follow、所有实际 supported hosts 回归。

### F230. `src/targets/managed-artifacts.ts`
- **原始 diff：** `M`，`+65/-0`，实际变更行 65。
- **实际变化：** 新增 nearest-existing ancestor 与 realpath containment，阻止 managed store 经祖先 symlink 逃逸。
- **spec-first owner / 裁决：** src/cli current adapter/helper owner；`直接同步不变量`。
- **理由与验证面：** current adapter/converter/ownership 单测、collision/no-follow、所有实际 supported hosts 回归。

### F231. `src/targets/opencode.ts`
- **原始 diff：** `M`，`+31/-4`，实际变更行 35。
- **实际变化：** CLI/转换/安装 owner 调整；全量 diff 标记为 private-scratch、managed-path-safety，函数结构扫描 48 个符号。
- **spec-first owner / 裁决：** src/cli current adapter/helper owner；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** current adapter/converter/ownership 单测、collision/no-follow、所有实际 supported hosts 回归。

### F232. `src/targets/pi.ts`
- **原始 diff：** `M`，`+49/-18`，实际变更行 67。
- **实际变化：** CLI/转换/安装 owner 调整；全量 diff 标记为 private-scratch、managed-path-safety，函数结构扫描 94 个符号。
- **spec-first owner / 裁决：** src/cli current adapter/helper owner；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** current adapter/converter/ownership 单测、collision/no-follow、所有实际 supported hosts 回归。

### F233. `src/utils/codex-agents.ts`
- **原始 diff：** `M`，`+35/-43`，实际变更行 78。
- **实际变化：** 把 ensure/upsert 改为 strip-only：AGENTS.md 不存在时不创建，只剩 managed block 时删除空文件，其余用户内容保持。
- **spec-first owner / 裁决：** src/cli current adapter/helper owner；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** current adapter/converter/ownership 单测、collision/no-follow、所有实际 supported hosts 回归。

### F234. `src/utils/codex-content.ts`
- **原始 diff：** `M`，`+3/-1`，实际变更行 4。
- **实际变化：** Codex 内容转换复用统一 reserved path root 判别，替代本地硬编码列表。
- **spec-first owner / 裁决：** src/cli current adapter/helper owner；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** current adapter/converter/ownership 单测、collision/no-follow、所有实际 supported hosts 回归。

### F235. `src/utils/frontmatter.ts`
- **原始 diff：** `M`，`+13/-1`，实际变更行 14。
- **实际变化：** YAML bare scalar 对 null/bool/number/date-like 值强制 quote，避免 round-trip 类型漂移。
- **spec-first owner / 裁决：** src/cli current adapter/helper owner；`直接同步不变量`。
- **理由与验证面：** current adapter/converter/ownership 单测、collision/no-follow、所有实际 supported hosts 回归。

### F236. `src/utils/legacy-cleanup.ts`
- **原始 diff：** `M`，`+5/-0`，实际变更行 5。
- **实际变化：** legacy cleanup registry 补充新版 ce-work 描述 fingerprint，使升级能清理旧 wrapper，又不放宽到模糊删除。
- **spec-first owner / 裁决：** src/cli current adapter/helper owner；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** current adapter/converter/ownership 单测、collision/no-follow、所有实际 supported hosts 回归。

### F237. `src/utils/slash-command.ts`
- **原始 diff：** `A`，`+42/-0`，实际变更行 42。
- **实际变化：** 新增 slash command 与 POSIX/Windows 绝对路径、reserved root 的统一判别 helper。
- **spec-first owner / 裁决：** src/cli current adapter/helper owner；`按 spec-first 边界改造后吸收`。
- **理由与验证面：** current adapter/converter/ownership 单测、collision/no-follow、所有实际 supported hosts 回归。

## 上游证据、测试与发行支撑账本（185 个）

以下记录补齐固定 Git 区间中不属于 237 个实施目标面的其余文件。它们不是可跳过的“背景材料”：上游计划与解决方案用于核对设计动机，Skill 文档用于核对用户可见行为，tests/fixtures 用于提取可移植验证意图，插件与发布元数据用于核对安装和分发边界。每个文件仍独立记录，不用目录继承裁决。

### F238. `.agents/plugins/marketplace.json`
- **原始 diff：** `M`，`+2/-2`，实际变更行 4。
- **实际变化：** 更新 JSON/manifest 文件；完整读取 21 行，本次变更键包括“source”、“url”、“path”。
- **spec-first owner / 裁决：** src/cli/plugin-manifest.js + adapters + package governance；`按当前 plugin/runtime model 校准，不直接复制`。
- **理由与验证面：** plugin manifest、converter、package inventory 与当前 supported-host tests；collision/ownership/legacy cleanup 保持 fail closed。

### F239. `.claude-plugin/plugin.json`
- **原始 diff：** `M`，`+1/-1`，实际变更行 2。
- **实际变化：** 更新 JSON/manifest 文件；完整读取 21 行，本次变更键包括“version”。
- **spec-first owner / 裁决：** src/cli/plugin-manifest.js + adapters + package governance；`按当前 plugin/runtime model 校准，不直接复制`。
- **理由与验证面：** plugin manifest、converter、package inventory 与当前 supported-host tests；collision/ownership/legacy cleanup 保持 fail closed。

### F240. `.cline/INSTALL.md`
- **原始 diff：** `M`，`+2/-2`，实际变更行 4。
- **实际变化：** 更新上游 Markdown 文档《Installing Compound Engineering for Cline》；定点条款摘录=“Skills marked 'disable-model-invocation: true' (for example 'ce-dogfood', 'ce-polish', 'ce-setup') are **not**…”、“'--include-manual' links manual-only skills so '/ce-polish' and similar commands work, with a warning that…”、“Skills marked 'disable-model-invocation: true' (for example 'lfg', 'ce-dogfood', 'ce-polish') are **not**…”。
- **spec-first owner / 裁决：** README/docs + Cline/support posture；`文档证据输入，不扩展未支持宿主`。
- **理由与验证面：** 用户可见命令、宿主支持范围、安装路径与当前 source/CLI smoke 一致。

### F241. `.codex-plugin/plugin.json`
- **原始 diff：** `M`，`+1/-1`，实际变更行 2。
- **实际变化：** 更新 JSON/manifest 文件；完整读取 46 行，本次变更键包括“version”。
- **spec-first owner / 裁决：** src/cli/plugin-manifest.js + adapters + package governance；`按当前 plugin/runtime model 校准，不直接复制`。
- **理由与验证面：** plugin manifest、converter、package inventory 与当前 supported-host tests；collision/ownership/legacy cleanup 保持 fail closed。

### F242. `.cursor-plugin/plugin.json`
- **原始 diff：** `M`，`+1/-1`，实际变更行 2。
- **实际变化：** 更新 JSON/manifest 文件；完整读取 26 行，本次变更键包括“version”。
- **spec-first owner / 裁决：** src/cli/plugin-manifest.js + adapters + package governance；`按当前 plugin/runtime model 校准，不直接复制`。
- **理由与验证面：** plugin manifest、converter、package inventory 与当前 supported-host tests；collision/ownership/legacy cleanup 保持 fail closed。

### F243. `.devin-plugin/plugin.json`
- **原始 diff：** `M`，`+1/-1`，实际变更行 2。
- **实际变化：** 更新 JSON/manifest 文件；完整读取 21 行，本次变更键包括“version”。
- **spec-first owner / 裁决：** src/cli/plugin-manifest.js + adapters + package governance；`按当前 plugin/runtime model 校准，不直接复制`。
- **理由与验证面：** plugin manifest、converter、package inventory 与当前 supported-host tests；collision/ownership/legacy cleanup 保持 fail closed。

### F244. `.github/.release-please-manifest.json`
- **原始 diff：** `M`，`+1/-1`，实际变更行 2。
- **实际变化：** 更新 JSON/manifest 文件；完整读取 6 行，本次变更键包括“.”。
- **spec-first owner / 裁决：** package/test/release governance；`按当前发布与 CI owner 选择性吸收`。
- **理由与验证面：** package scripts、CI/release metadata 与 build dry-run；不把上游发布流程机械移植为本仓 gate。

### F245. `.github/pull_request_template.md`
- **原始 diff：** `A`，`+24/-0`，实际变更行 24。
- **实际变化：** 新增上游 Markdown 文档；完整读取 25 行，标题结构包括“Security Disclosure”、“Agent Disclosure”。
- **spec-first owner / 裁决：** package/test/release governance；`按当前发布与 CI owner 选择性吸收`。
- **理由与验证面：** package scripts、CI/release metadata 与 build dry-run；不把上游发布流程机械移植为本仓 gate。

### F246. `.github/release-please-config.json`
- **原始 diff：** `M`，`+1/-1`，实际变更行 2。
- **实际变化：** 更新 JSON/manifest 文件；完整读取 119 行，本次变更键包括“commit-search-depth”。
- **spec-first owner / 裁决：** package/test/release governance；`按当前发布与 CI owner 选择性吸收`。
- **理由与验证面：** package scripts、CI/release metadata 与 build dry-run；不把上游发布流程机械移植为本仓 gate。

### F247. `.github/workflows/ci.yml`
- **原始 diff：** `M`，`+54/-14`，实际变更行 68。
- **实际变化：** 更新源码/脚本文件；完整读取 121 行，函数/类型/状态结构包括无可枚举命名符号。
- **spec-first owner / 裁决：** package/test/release governance；`按当前发布与 CI owner 选择性吸收`。
- **理由与验证面：** package scripts、CI/release metadata 与 build dry-run；不把上游发布流程机械移植为本仓 gate。

### F248. `.grok-plugin/plugin.json`
- **原始 diff：** `M`，`+1/-1`，实际变更行 2。
- **实际变化：** 更新 JSON/manifest 文件；完整读取 22 行，本次变更键包括“version”。
- **spec-first owner / 裁决：** src/cli/plugin-manifest.js + adapters + package governance；`按当前 plugin/runtime model 校准，不直接复制`。
- **理由与验证面：** plugin manifest、converter、package inventory 与当前 supported-host tests；collision/ownership/legacy cleanup 保持 fail closed。

### F249. `.kimi-plugin/plugin.json`
- **原始 diff：** `M`，`+1/-1`，实际变更行 2。
- **实际变化：** 更新 JSON/manifest 文件；完整读取 26 行，本次变更键包括“version”。
- **spec-first owner / 裁决：** src/cli/plugin-manifest.js + adapters + package governance；`按当前 plugin/runtime model 校准，不直接复制`。
- **理由与验证面：** plugin manifest、converter、package inventory 与当前 supported-host tests；collision/ownership/legacy cleanup 保持 fail closed。

### F250. `AGENTS.md`
- **原始 diff：** `M`，`+103/-49`，实际变更行 152。
- **实际变化：** 更新上游宿主治理入口《Agent Instructions》；新增/调整标题=“Codex Local Plugin Development”、“Cross-Model Skill Authoring”、“Skill Prose Admission Rules”、“User-Facing Skill Invocations”；删除/替换标题=“Writing Skill Instructions”、“Inline the Trigger, Not the Content”、“Extract Conditional and Late-Sequence Blocks”。
- **spec-first owner / 裁决：** CLAUDE.md/AGENTS.md managed source + instruction sync；`对照治理原则，不覆盖当前角色契约`。
- **理由与验证面：** instruction source 同步、managed block 生成校验和角色契约冲突检查。

### F251. `CLAUDE.md`
- **原始 diff：** `T`，`+1/-1`，实际变更行 2。
- **实际变化：** 更新上游宿主治理入口；定点条款摘录=“AGENTS.md”、“@AGENTS.md”。
- **spec-first owner / 裁决：** CLAUDE.md/AGENTS.md managed source + instruction sync；`对照治理原则，不覆盖当前角色契约`。
- **理由与验证面：** instruction source 同步、managed block 生成校验和角色契约冲突检查。

### F252. `CONCEPTS.md`
- **原始 diff：** `M`，`+26/-1`，实际变更行 27。
- **实际变化：** 更新上游概念词表《Concepts》；新增/调整标题=“Session handoff”、“Detached job”、“Cross-model pass”、“Model identity receipt”。
- **spec-first owner / 裁决：** CONCEPTS.md knowledge owner；`候选词汇，需 current-source 与 consumer 证明后提升`。
- **理由与验证面：** 术语定义回链 current source、至少一个真实 consumer 和失效条件；未经 promotion 不写入 durable vocabulary。

### F253. `README.md`
- **原始 diff：** `M`，`+149/-88`，实际变更行 237。
- **实际变化：** 更新上游 README《Compound Engineering》；新增/调整标题=“Install”、“Claude Code”、“Cursor”、“Codex App”；删除/替换标题=“Install”、“Claude Code”、“Cursor”。
- **spec-first owner / 裁决：** README.md + README.zh-CN.md + docs；`用户可见行为落地后同步`。
- **理由与验证面：** 用户可见命令、宿主支持范围、安装路径与当前 source/CLI smoke 一致。

### F254. `docs/plans/2026-06-29-001-feat-shared-repo-grounding-cache-plan.md`
- **原始 diff：** `M`，`+2/-0`，实际变更行 2。
- **实际变化：** 更新上游计划证据《Shared Repo-Grounding Profile Cache - Plan》；定点条款摘录=“> **Retired:** The implemented cache was removed after a direct behavioral comparison showed lean…”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + 本计划 Evidence and Limitations；`证据输入，不直接同步`。
- **理由与验证面：** 回链对应 source 与 tests；历史计划、benchmark 或完成状态只作 advisory evidence，不作为当前 outcome 证据。

### F255. `docs/plans/2026-07-09-001-fix-ce-test-browser-native-driver-plan.md`
- **原始 diff：** `A`，`+95/-0`，实际变更行 95。
- **实际变化：** 新增上游计划证据《Native Browser Driver Selection Implementation Plan》；完整读取 96 行，标题结构包括“Native Browser Driver Selection Implementation Plan”、“Global Constraints”、“Task 1: Pin the browser-driver policy”、“Task 2: Align user-facing documentation”、“Task 3: Verify and compound the learning”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + 本计划 Evidence and Limitations；`证据输入，不直接同步`。
- **理由与验证面：** 回链对应 source 与 tests；历史计划、benchmark 或完成状态只作 advisory evidence，不作为当前 outcome 证据。

### F256. `docs/plans/2026-07-09-003-feat-doc-review-cross-model-plan.md`
- **原始 diff：** `A`，`+351/-0`，实际变更行 351。
- **实际变化：** 新增上游计划证据《Cross-Model Adversarial Review for ce-doc-review - Plan》；完整读取 352 行，标题结构包括“Cross-Model Adversarial Review for ce-doc-review - Plan”、“Goal Capsule”、“Product Contract”、“Summary”、“Problem Frame”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + 本计划 Evidence and Limitations；`证据输入，不直接同步`。
- **理由与验证面：** 回链对应 source 与 tests；历史计划、benchmark 或完成状态只作 advisory evidence，不作为当前 outcome 证据。

### F257. `docs/plans/2026-07-11-001-feat-babysit-self-initiating-loop-plan.md`
- **原始 diff：** `A`，`+210/-0`，实际变更行 210。
- **实际变化：** 新增上游计划证据《feat: ce-babysit-pr self-sustaining in-session watch loop + delegation-contract fix》；完整读取 211 行，标题结构包括“feat: ce-babysit-pr self-sustaining in-session watch loop + delegation-contract fix”、“Summary”、“Problem Frame”、“Requirements”、“Key Technical Decisions”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + 本计划 Evidence and Limitations；`证据输入，不直接同步`。
- **理由与验证面：** 回链对应 source 与 tests；历史计划、benchmark 或完成状态只作 advisory evidence，不作为当前 outcome 证据。

### F258. `docs/plans/2026-07-13-001-feat-code-review-line-provenance-plan.md`
- **原始 diff：** `A`，`+158/-0`，实际变更行 158。
- **实际变化：** 新增上游计划证据《feat: Surface load-bearing line provenance in ce-code-review findings》；完整读取 159 行，标题结构包括“feat: Surface load-bearing line provenance in ce-code-review findings”、“Goal Capsule”、“Product Contract”、“Summary”、“Problem Frame”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + 本计划 Evidence and Limitations；`证据输入，不直接同步`。
- **理由与验证面：** 回链对应 source 与 tests；历史计划、benchmark 或完成状态只作 advisory evidence，不作为当前 outcome 证据。

### F259. `docs/plans/2026-07-13-001-fix-ce-proof-v3-owner-lifecycle-plan.md`
- **原始 diff：** `A`，`+251/-0`，实际变更行 251。
- **实际变化：** 新增上游计划证据《fix: Migrate ce-proof to Proof v3 and owner credential lifecycle》；完整读取 252 行，标题结构包括“fix: Migrate ce-proof to Proof v3 and owner credential lifecycle”、“Goal Capsule”、“Product Contract”、“Summary”、“Requirements”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + 本计划 Evidence and Limitations；`证据输入，不直接同步`。
- **理由与验证面：** 回链对应 source 与 tests；历史计划、benchmark 或完成状态只作 advisory evidence，不作为当前 outcome 证据。

### F260. `docs/plans/2026-07-13-002-feat-code-review-cross-model-provider-port-plan.md`
- **原始 diff：** `A`，`+246/-0`，实际变更行 246。
- **实际变化：** 新增上游计划证据《feat: Port doc-review cross-model provider mechanics to ce-code-review adversarial pass》；完整读取 247 行，标题结构包括“feat: Port doc-review cross-model provider mechanics to ce-code-review adversarial pass”、“Goal Capsule”、“Product Contract”、“Summary”、“Problem Frame”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + 本计划 Evidence and Limitations；`证据输入，不直接同步`。
- **理由与验证面：** 回链对应 source 与 tests；历史计划、benchmark 或完成状态只作 advisory evidence，不作为当前 outcome 证据。

### F261. `docs/plans/2026-07-14-001-feat-session-settled-decisions-plan.md`
- **原始 diff：** `A`，`+315/-0`，实际变更行 315。
- **实际变化：** 新增上游计划证据《Session-Settled Decision Provenance - Plan》；完整读取 316 行，标题结构包括“Session-Settled Decision Provenance - Plan”、“Goal Capsule”、“Product Contract”、“Summary”、“Problem Frame”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + 本计划 Evidence and Limitations；`证据输入，不直接同步`。
- **理由与验证面：** 回链对应 source 与 tests；历史计划、benchmark 或完成状态只作 advisory evidence，不作为当前 outcome 证据。

### F262. `docs/plans/2026-07-14-001-fix-detached-peer-job-lifecycle-plan.md`
- **原始 diff：** `A`，`+238/-0`，实际变更行 238。
- **实际变化：** 新增上游计划证据《Detached Peer Job Lifecycle for Cross-Model Review - Plan》；完整读取 239 行，标题结构包括“Detached Peer Job Lifecycle for Cross-Model Review - Plan”、“Goal Capsule”、“Product Contract”、“Summary”、“Problem Frame”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + 本计划 Evidence and Limitations；`证据输入，不直接同步`。
- **理由与验证面：** 回链对应 source 与 tests；历史计划、benchmark 或完成状态只作 advisory evidence，不作为当前 outcome 证据。

### F263. `docs/plans/2026-07-14-002-feat-ce-pov-cross-model-panel-plan.md`
- **原始 diff：** `A`，`+355/-0`，实际变更行 355。
- **实际变化：** 新增上游计划证据《ce-pov Cross-Model Panel - Plan》；完整读取 356 行，标题结构包括“ce-pov Cross-Model Panel - Plan”、“Goal Capsule”、“Product Contract”、“Summary”、“Problem Frame”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + 本计划 Evidence and Limitations；`证据输入，不直接同步`。
- **理由与验证面：** 回链对应 source 与 tests；历史计划、benchmark 或完成状态只作 advisory evidence，不作为当前 outcome 证据。

### F264. `docs/plans/2026-07-15-001-docs-readme-install-first-plan.md`
- **原始 diff：** `A`，`+216/-0`，实际变更行 216。
- **实际变化：** 新增上游计划证据《README Install-First Reorder - Plan》；完整读取 217 行，标题结构包括“README Install-First Reorder - Plan”、“Goal Capsule”、“Product Contract”、“Summary”、“Problem Frame”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + 本计划 Evidence and Limitations；`证据输入，不直接同步`。
- **理由与验证面：** 回链对应 source 与 tests；历史计划、benchmark 或完成状态只作 advisory evidence，不作为当前 outcome 证据。

### F265. `docs/plans/2026-07-15-002-feat-ce-work-cross-model-execution-plan.md`
- **原始 diff：** `A`，`+526/-0`，实际变更行 526。
- **实际变化：** 新增上游计划证据《CE Work Cross-Model Execution - Plan》；完整读取 527 行，标题结构包括“CE Work Cross-Model Execution - Plan”、“Goal Capsule”、“Product Contract”、“Summary”、“Problem Frame”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + 本计划 Evidence and Limitations；`证据输入，不直接同步`。
- **理由与验证面：** 回链对应 source 与 tests；历史计划、benchmark 或完成状态只作 advisory evidence，不作为当前 outcome 证据。

### F266. `docs/plans/2026-07-16-001-feat-ce-handoff-session-continuity-plan.md`
- **原始 diff：** `A`，`+273/-0`，实际变更行 273。
- **实际变化：** 新增上游计划证据《ce-handoff Session Continuity - Plan》；完整读取 274 行，标题结构包括“ce-handoff Session Continuity - Plan”、“Goal Capsule”、“Product Contract”、“Summary”、“Problem Frame”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + 本计划 Evidence and Limitations；`证据输入，不直接同步`。
- **理由与验证面：** 回链对应 source 与 tests；历史计划、benchmark 或完成状态只作 advisory evidence，不作为当前 outcome 证据。

### F267. `docs/plans/2026-07-17-001-eval-cross-model-peer-model-config.md`
- **原始 diff：** `A`，`+431/-0`，实际变更行 431。
- **实际变化：** 新增上游计划证据《Eval: is 'gpt-5.6-terra' (high) a non-inferior, cheaper, faster Codex peer than 'gpt-5.6-sol'?》；完整读取 432 行，标题结构包括“Eval: is 'gpt-5.6-terra' (high) a non-inferior, cheaper, faster Codex peer than 'gpt-5.6-sol'?”、“The question”、“Baseline reconciliation (read first)”、“Design principles”、“Arms”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + 本计划 Evidence and Limitations；`证据输入，不直接同步`。
- **理由与验证面：** 回链对应 source 与 tests；历史计划、benchmark 或完成状态只作 advisory evidence，不作为当前 outcome 证据。

### F268. `docs/plans/2026-07-18-001-fix-babysit-moving-base-plan.md`
- **原始 diff：** `A`，`+295/-0`，实际变更行 295。
- **实际变化：** 新增上游计划证据《Babysit Moving-Base Recovery - Plan》；完整读取 296 行，标题结构包括“Babysit Moving-Base Recovery - Plan”、“Goal Capsule”、“Product Contract”、“Summary”、“Problem Frame”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + 本计划 Evidence and Limitations；`证据输入，不直接同步`。
- **理由与验证面：** 回链对应 source 与 tests；历史计划、benchmark 或完成状态只作 advisory evidence，不作为当前 outcome 证据。

### F269. `docs/plans/2026-07-18-adversarial-peer-benchmark-report.md`
- **原始 diff：** `A`，`+117/-0`，实际变更行 117。
- **实际变化：** 新增上游计划证据《Adversarial-Review Peer — Model & Reasoning-Tier Benchmark》；完整读取 118 行，标题结构包括“Adversarial-Review Peer — Model & Reasoning-Tier Benchmark”、“Recommendation”、“Results (real bug-fix corpus, blind judge)”、“What the numbers say”、“Supporting evidence (seeded corpora, earlier phases)”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + 本计划 Evidence and Limitations；`证据输入，不直接同步`。
- **理由与验证面：** 回链对应 source 与 tests；历史计划、benchmark 或完成状态只作 advisory evidence，不作为当前 outcome 证据。

### F270. `docs/plans/2026-07-20-001-feat-cross-harness-model-elevation-plan.md`
- **原始 diff：** `A`，`+381/-0`，实际变更行 381。
- **实际变化：** 新增上游计划证据《Cross-Harness Model Elevation for Planning Skills - Plan》；完整读取 382 行，标题结构包括“Cross-Harness Model Elevation for Planning Skills - Plan”、“Goal Capsule”、“Product Contract”、“Summary”、“Problem Frame”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + 本计划 Evidence and Limitations；`证据输入，不直接同步`。
- **理由与验证面：** 回链对应 source 与 tests；历史计划、benchmark 或完成状态只作 advisory evidence，不作为当前 outcome 证据。

### F271. `docs/plans/2026-07-20-001-feat-cross-tracker-issue-ideation-plan.md`
- **原始 diff：** `A`，`+244/-0`，实际变更行 244。
- **实际变化：** 新增上游计划证据《Cross-Tracker Issue Ideation - Plan》；完整读取 245 行，标题结构包括“Cross-Tracker Issue Ideation - Plan”、“Goal Capsule”、“Product Contract”、“Summary”、“Problem Frame”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + 本计划 Evidence and Limitations；`证据输入，不直接同步`。
- **理由与验证面：** 回链对应 source 与 tests；历史计划、benchmark 或完成状态只作 advisory evidence，不作为当前 outcome 证据。

### F272. `docs/plans/2026-07-21-001-fix-babysit-budget-active-watch-time-plan.md`
- **原始 diff：** `A`，`+225/-0`，实际变更行 225。
- **实际变化：** 新增上游计划证据《Babysit Budget as Active Watch Time - Plan》；完整读取 226 行，标题结构包括“Babysit Budget as Active Watch Time - Plan”、“Goal Capsule”、“Product Contract”、“Summary”、“Problem Frame”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + 本计划 Evidence and Limitations；`证据输入，不直接同步`。
- **理由与验证面：** 回链对应 source 与 tests；历史计划、benchmark 或完成状态只作 advisory evidence，不作为当前 outcome 证据。

### F273. `docs/plans/2026-07-21-001-fix-ce-pov-oracle-panel-prompting-plan.md`
- **原始 diff：** `A`，`+239/-0`，实际变更行 239。
- **实际变化：** 新增上游计划证据《ce-pov Oracle Panel Prompting and Disclosure - Plan》；完整读取 240 行，标题结构包括“ce-pov Oracle Panel Prompting and Disclosure - Plan”、“Goal Capsule”、“Product Contract”、“Summary”、“Problem Frame”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + 本计划 Evidence and Limitations；`证据输入，不直接同步`。
- **理由与验证面：** 回链对应 source 与 tests；历史计划、benchmark 或完成状态只作 advisory evidence，不作为当前 outcome 证据。

### F274. `docs/plans/2026-07-22-001-feat-configurable-docs-root-plan.md`
- **原始 diff：** `A`，`+463/-0`，实际变更行 463。
- **实际变化：** 新增上游计划证据《Configurable Docs Root for CE Artifacts - Plan》；完整读取 464 行，标题结构包括“Configurable Docs Root for CE Artifacts - Plan”、“Goal Capsule”、“Product Contract”、“Summary”、“Problem Frame”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + 本计划 Evidence and Limitations；`证据输入，不直接同步`。
- **理由与验证面：** 回链对应 source 与 tests；历史计划、benchmark 或完成状态只作 advisory evidence，不作为当前 outcome 证据。

### F275. `docs/plans/2026-07-23-001-feat-peer-job-runner-windows-native-plan.md`
- **原始 diff：** `A`，`+212/-0`，实际变更行 212。
- **实际变化：** 新增上游计划证据《Native Windows Peer Job Runner - Plan》；完整读取 213 行，标题结构包括“Native Windows Peer Job Runner - Plan”、“Goal Capsule”、“Resume Contract (read this first on Windows)”、“Product Contract”、“Summary”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + 本计划 Evidence and Limitations；`证据输入，不直接同步`。
- **理由与验证面：** 回链对应 source 与 tests；历史计划、benchmark 或完成状态只作 advisory evidence，不作为当前 outcome 证据。

### F276. `docs/plans/babysit-non-convergence-detection.md`
- **原始 diff：** `A`，`+89/-0`，实际变更行 89。
- **实际变化：** 新增上游计划证据《Design note: non-convergence detection in the babysit pipeline loop》；完整读取 90 行，标题结构包括“Design note: non-convergence detection in the babysit pipeline loop”、“The problem”、“Core principle”、“Architecture: facts upstream, judgment in leaves”、“Correction to an earlier draft: babysit keeps a compact trajectory (there *is* modest new machinery)”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + 本计划 Evidence and Limitations；`证据输入，不直接同步`。
- **理由与验证面：** 回链对应 source 与 tests；历史计划、benchmark 或完成状态只作 advisory evidence，不作为当前 outcome 证据。

### F277. `docs/plans/pipeline-mode-contract-and-lfg-babysit-consolidation.md`
- **原始 diff：** `A`，`+115/-0`，实际变更行 115。
- **实际变化：** 新增上游计划证据《Plan: shared pipeline-mode contract + 'lfg' ↔ 'ce-babysit-pr' consolidation》；完整读取 116 行，标题结构包括“Plan: shared pipeline-mode contract + 'lfg' ↔ 'ce-babysit-pr' consolidation”、“The core principle (unchanged)”、“The shared pipeline-mode contract”、“The residual channel — consolidated (DECIDED)”、“The run-report comment”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + 本计划 Evidence and Limitations；`证据输入，不直接同步`。
- **理由与验证面：** 回链对应 source 与 tests；历史计划、benchmark 或完成状态只作 advisory evidence，不作为当前 outcome 证据。

### F278. `docs/skills/README.md`
- **原始 diff：** `M`，`+12/-5`，实际变更行 17。
- **实际变化：** 更新上游 Skill 用户文档《Skill Documentation》；定点条款摘录=“Checkout-local defaults shared across skills are documented in [Compound Engineering…”、“Artifact paths shown throughout these pages ('docs/plans/', 'docs/solutions/', 'docs/ideation/', and the rest)…”、“/ ['/ce-pov'](./ce-pov.md) / Form a decisive, project-grounded POV as an adoption verdict, holistic document…”。
- **spec-first owner / 裁决：** README/docs + runtime/config owner；`按当前产品边界重写后吸收`。
- **理由与验证面：** 核对 canonical Skill、README/docs 与 source contract；行为语义需要 fresh-source eval，generated runtime 只经 init 投射。

### F279. `docs/skills/ce-babysit-pr.md`
- **原始 diff：** `A`，`+191/-0`，实际变更行 191。
- **实际变化：** 新增上游 Skill 用户文档《'ce-babysit-pr'》；完整读取 192 行，标题结构包括“'ce-babysit-pr'”、“TL;DR”、“Example invocations”、“Watch the pull request for the current branch until it is ready or blocked”、“Watch a specific pull request by number or URL”。
- **spec-first owner / 裁决：** spec-lfg + spec-commit-push-pr + README/docs；`按当前 Skill 边界重写后吸收`。
- **理由与验证面：** 核对 canonical Skill、README/docs 与 source contract；行为语义需要 fresh-source eval，generated runtime 只经 init 投射。

### F280. `docs/skills/ce-brainstorm.md`
- **原始 diff：** `M`，`+40/-4`，实际变更行 44。
- **实际变化：** 更新上游 Skill 用户文档《'ce-brainstorm'》；新增/调整标题=“Example invocations”、“Shape an ambitious feature or project before committing to a plan”、“Turn a rough feature idea into a requirements artifact”、“Explore a problem without prescribing the solution up front”；删除/替换标题=“11. Grounding and verification ride inside your think-time”、“Fable elevation (Claude Code only)”。
- **spec-first owner / 裁决：** spec-brainstorm + README/docs；`按当前 Skill 边界重写后吸收`。
- **理由与验证面：** 核对 canonical Skill、README/docs 与 source contract；行为语义需要 fresh-source eval，generated runtime 只经 init 投射。

### F281. `docs/skills/ce-code-review.md`
- **原始 diff：** `M`，`+67/-26`，实际变更行 93。
- **实际变化：** 更新上游 Skill 用户文档《'ce-code-review'》；新增/调整标题=“Example invocations”、“Deep-review the current branch; relevant plan and session context are discovered automatically”、“Review a specific PR without checking it out”、“Review the current branch and fix verified findings in this checkout”；删除/替换标题=“3. Two modes — human view and machine handoff”。
- **spec-first owner / 裁决：** spec-code-review + README/docs；`按当前 Skill 边界重写后吸收`。
- **理由与验证面：** 核对 canonical Skill、README/docs 与 source contract；行为语义需要 fresh-source eval，generated runtime 只经 init 投射。

### F282. `docs/skills/ce-commit-push-pr.md`
- **原始 diff：** `M`，`+29/-5`，实际变更行 34。
- **实际变化：** 更新上游 Skill 用户文档《'ce-commit-push-pr'》；新增/调整标题=“Example invocations”、“Commit current work, push the branch, and open a PR”、“Draft a PR description without applying it”、“Rewrite the current PR description with a specific emphasis”。
- **spec-first owner / 裁决：** spec-commit-push-pr + README/docs；`按当前 Skill 边界重写后吸收`。
- **理由与验证面：** 核对 canonical Skill、README/docs 与 source contract；行为语义需要 fresh-source eval，generated runtime 只经 init 投射。

### F283. `docs/skills/ce-compound-refresh.md`
- **原始 diff：** `M`，`+29/-9`，实际变更行 38。
- **实际变化：** 更新上游 Skill 用户文档《'ce-compound-refresh'》；新增/调整标题=“Example invocations”、“Refresh learnings related to one module or topic”、“Review one known learning or pattern document”、“Sweep the full learning set when a narrow scope is not available”；删除/替换标题=“2. Two modes — Interactive default, Autofix on 'mode:autofix'”。
- **spec-first owner / 裁决：** spec-compound-refresh + README/docs；`按当前 Skill 边界重写后吸收`。
- **理由与验证面：** 核对 canonical Skill、README/docs 与 source contract；行为语义需要 fresh-source eval，generated runtime 只经 init 投射。

### F284. `docs/skills/ce-compound.md`
- **原始 diff：** `M`，`+56/-8`，实际变更行 64。
- **实际变化：** 更新上游 Skill 用户文档《'ce-compound'》；新增/调整标题=“Example invocations”、“Capture the verified solution from the current conversation”、“Focus capture when the session contains several solved problems”、“Capture unattended when invoked from automation or standing instructions”。
- **spec-first owner / 裁决：** spec-compound + README/docs；`按当前 Skill 边界重写后吸收`。
- **理由与验证面：** 核对 canonical Skill、README/docs 与 source contract；行为语义需要 fresh-source eval，generated runtime 只经 init 投射。

### F285. `docs/skills/ce-debug.md`
- **原始 diff：** `M`，`+22/-1`，实际变更行 23。
- **实际变化：** 更新上游 Skill 用户文档《'ce-debug'》；新增/调整标题=“Example invocations”、“Start from a failing test”、“Start from an issue or ticket and include its full discussion”、“Start from observed behavior when no ticket exists”。
- **spec-first owner / 裁决：** spec-debug + README/docs；`按当前 Skill 边界重写后吸收`。
- **理由与验证面：** 核对 canonical Skill、README/docs 与 source contract；行为语义需要 fresh-source eval，generated runtime 只经 init 投射。

### F286. `docs/skills/ce-doc-review.md`
- **原始 diff：** `M`，`+36/-1`，实际变更行 37。
- **实际变化：** 更新上游 Skill 用户文档《'ce-doc-review'》；新增/调整标题=“Example invocations”、“Review a specific requirements or plan document interactively”、“Let the skill find the most recent planning document”、“9. Cross-model judgment pass”。
- **spec-first owner / 裁决：** spec-doc-review + README/docs；`按当前 Skill 边界重写后吸收`。
- **理由与验证面：** 核对 canonical Skill、README/docs 与 source contract；行为语义需要 fresh-source eval，generated runtime 只经 init 投射。

### F287. `docs/skills/ce-dogfood.md`
- **原始 diff：** `M`，`+19/-1`，实际变更行 20。
- **实际变化：** 更新上游 Skill 用户文档《'ce-dogfood'》；新增/调整标题=“Example invocations”、“Dogfood the diff on the current feature branch”、“Dogfood a specific pull request or branch”、“Reuse a dev server already running on a custom port”。
- **spec-first owner / 裁决：** spec-dogfood + README/docs；`按当前 Skill 边界重写后吸收`。
- **理由与验证面：** 核对 canonical Skill、README/docs 与 source contract；行为语义需要 fresh-source eval，generated runtime 只经 init 投射。

### F288. `docs/skills/ce-explain.md`
- **原始 diff：** `M`，`+114/-32`，实际变更行 146。
- **实际变化：** 更新上游 Skill 用户文档《'ce-explain'》；新增/调整标题=“Example invocations”、“The shortest path to a report: name a window and stop. No syntax to learn.”、“'since last Monday' is not the since: flag — it has no colon, so it stays as”、“request text and gets classified as a recap by shape, with the window read”；删除/替换标题=“What Makes It Novel”、“Quick Example”。
- **spec-first owner / 裁决：** spec-explain + README/docs；`按当前 Skill 边界重写后吸收`。
- **理由与验证面：** 核对 canonical Skill、README/docs 与 source contract；行为语义需要 fresh-source eval，generated runtime 只经 init 投射。

### F289. `docs/skills/ce-handoff.md`
- **原始 diff：** `A`，`+165/-0`，实际变更行 165。
- **实际变化：** 新增上游 Skill 用户文档《'ce-handoff'》；完整读取 166 行，标题结构包括“'ce-handoff'”、“TL;DR”、“Example invocations”、“End the current session and create a handoff in managed temporary storage”、“Create a handoff with a specific focus for the receiving agent”。
- **spec-first owner / 裁决：** workflow-specific handoff owners + using-spec-first（generic handoff不采纳） + README/docs；`按当前 Skill 边界重写后吸收`。
- **理由与验证面：** 核对 canonical Skill、README/docs 与 source contract；行为语义需要 fresh-source eval，generated runtime 只经 init 投射。

### F290. `docs/skills/ce-ideate.md`
- **原始 diff：** `M`，`+35/-3`，实际变更行 38。
- **实际变化：** 更新上游 Skill 用户文档《'ce-ideate'》；新增/调整标题=“Example invocations”、“Generate grounded product or codebase opportunities”、“Focus ideation on a specific product surface”、“Find solution opportunities across patterns in open GitHub issues”。
- **spec-first owner / 裁决：** spec-ideate + README/docs；`按当前 Skill 边界重写后吸收`。
- **理由与验证面：** 核对 canonical Skill、README/docs 与 source contract；行为语义需要 fresh-source eval，generated runtime 只经 init 投射。

### F291. `docs/skills/ce-optimize.md`
- **原始 diff：** `M`，`+21/-1`，实际变更行 22。
- **实际变化：** 更新上游 Skill 用户文档《'ce-optimize'》；新增/调整标题=“Example invocations”、“Start from a plain-language outcome and build the measurement spec together”、“Optimize a qualitative result with an LLM-as-judge rubric”、“Run from an existing, reviewable optimization specification”。
- **spec-first owner / 裁决：** spec-optimize + README/docs；`按当前 Skill 边界重写后吸收`。
- **理由与验证面：** 核对 canonical Skill、README/docs 与 source contract；行为语义需要 fresh-source eval，generated runtime 只经 init 投射。

### F292. `docs/skills/ce-plan.md`
- **原始 diff：** `M`，`+46/-3`，实际变更行 49。
- **实际变化：** 更新上游 Skill 用户文档《'ce-plan'》；新增/调整标题=“Example invocations”、“Plan from the current conversation, including a completed ce-brainstorm”、“Enrich a requirements-only brainstorm artifact into an implementation-ready plan”、“Plan directly from an issue or PRD”；删除/替换标题=“Fable elevation (Claude Code only)”。
- **spec-first owner / 裁决：** spec-plan + README/docs；`按当前 Skill 边界重写后吸收`。
- **理由与验证面：** 核对 canonical Skill、README/docs 与 source contract；行为语义需要 fresh-source eval，generated runtime 只经 init 投射。

### F293. `docs/skills/ce-pov.md`
- **原始 diff：** `M`，`+94/-29`，实际变更行 123。
- **实际变化：** 更新上游 Skill 用户文档《'ce-pov'》；新增/调整标题=“Example invocations”、“Decide whether an external tool fits this project”、“Get a holistic bottom line on a document”、“Use ce-doc-review instead when you want issue-by-issue findings”；删除/替换标题=“1. Dual-grounding as two absolute floors”、“7. A fixed, graded verdict vocabulary”、“8. Reasoned, tier-gated follow-up”。
- **spec-first owner / 裁决：** spec-pov + README/docs；`按当前 Skill 边界重写后吸收`。
- **理由与验证面：** 核对 canonical Skill、README/docs 与 source contract；行为语义需要 fresh-source eval，generated runtime 只经 init 投射。

### F294. `docs/skills/ce-product-pulse.md`
- **原始 diff：** `M`，`+22/-2`，实际变更行 24。
- **实际变化：** 更新上游 Skill 用户文档《'ce-product-pulse'》；新增/调整标题=“Example invocations”、“Use the configured default window, or 24 hours when none is configured”、“Review a weekly window”、“Run a narrow launch check while still respecting ingestion delay”。
- **spec-first owner / 裁决：** spec-product-pulse + README/docs；`按当前 Skill 边界重写后吸收`。
- **理由与验证面：** 核对 canonical Skill、README/docs 与 source contract；行为语义需要 fresh-source eval，generated runtime 只经 init 投射。

### F295. `docs/skills/ce-promote.md`
- **原始 diff：** `M`，`+22/-0`，实际变更行 22。
- **实际变化：** 更新上游 Skill 用户文档《'ce-promote'》；新增/调整标题=“Example invocations”、“Derive what shipped from the current project and draft the default channels”、“Supply the shipped value when the repository context is not enough”、“Ask for several alternatives on one channel”。
- **spec-first owner / 裁决：** spec-promote + README/docs；`按当前 Skill 边界重写后吸收`。
- **理由与验证面：** 核对 canonical Skill、README/docs 与 source contract；行为语义需要 fresh-source eval，generated runtime 只经 init 投射。

### F296. `docs/skills/ce-proof.md`
- **原始 diff：** `M`，`+67/-108`，实际变更行 175。
- **实际变化：** 更新上游 Skill 用户文档《'ce-proof'》；新增/调整标题=“Example invocations”、“Publish a local Markdown document and keep the file canonical”、“Read or collaborate on an existing Proof document”、“Publish the Markdown file that was just edited”；删除/替换标题=“1. Web API + Local Bridge — both supported, same identity model”、“3. Mutation discipline — token chaining + verify-before-retry”、“4. Two endpoint shapes — '/ops' and '/edit/v2'”。
- **spec-first owner / 裁决：** spec-proof + README/docs；`按当前 Skill 边界重写后吸收`。
- **理由与验证面：** 核对 canonical Skill、README/docs 与 source contract；行为语义需要 fresh-source eval，generated runtime 只经 init 投射。

### F297. `docs/skills/ce-resolve-pr-feedback.md`
- **原始 diff：** `M`，`+17/-0`，实际变更行 17。
- **实际变化：** 更新上游 Skill 用户文档《'ce-resolve-pr-feedback'》；新增/调整标题=“Example invocations”、“Resolve all new actionable feedback on the current branch's PR”、“Resolve all new actionable feedback on a specific PR”、“Address only one review thread and leave every other thread untouched”。
- **spec-first owner / 裁决：** spec-resolve-pr-feedback + README/docs；`按当前 Skill 边界重写后吸收`。
- **理由与验证面：** 核对 canonical Skill、README/docs 与 source contract；行为语义需要 fresh-source eval，generated runtime 只经 init 投射。

### F298. `docs/skills/ce-retune.md`
- **原始 diff：** `A`，`+100/-0`，实际变更行 100。
- **实际变化：** 新增上游 Skill 用户文档《'ce-retune'》；完整读取 101 行，标题结构包括“'ce-retune'”、“TL;DR”、“Example invocations”、“Start from the symptom”、“Name the target and the bar up front”。
- **spec-first owner / 裁决：** spec-write-skill + spec-optimize + README/docs；`按当前 Skill 边界重写后吸收`。
- **理由与验证面：** 核对 canonical Skill、README/docs 与 source contract；行为语义需要 fresh-source eval，generated runtime 只经 init 投射。

### F299. `docs/skills/ce-riffrec-feedback-analysis.md`
- **原始 diff：** `M`，`+19/-0`，实际变更行 19。
- **实际变化：** 更新上游 Skill 用户文档《'ce-riffrec-feedback-analysis'》；新增/调整标题=“Example invocations”、“Analyze a complete Riffrec capture bundle”、“Analyze video, audio, or written feedback through the same router”、“Get capture setup help when no recording exists yet”。
- **spec-first owner / 裁决：** spec-riffrec-feedback-analysis + README/docs；`按当前 Skill 边界重写后吸收`。
- **理由与验证面：** 核对 canonical Skill、README/docs 与 source contract；行为语义需要 fresh-source eval，generated runtime 只经 init 投射。

### F300. `docs/skills/ce-setup.md`
- **原始 diff：** `M`，`+5/-1`，实际变更行 6。
- **实际变化：** 更新上游 Skill 用户文档《'ce-setup'》；定点条款摘录=“See [Compound Engineering configuration](./configuration.md) for the complete option reference and how local…”、“- Reports the resolved artifact root and which config layer supplied it, and flags an unusable 'docs_root'…”、“- ['/ce-test-browser'](./ce-test-browser.md) — uses 'agent-browser' when no capable host-native browser is…”。
- **spec-first owner / 裁决：** spec-runtime-setup + README/docs；`按当前 Skill 边界重写后吸收`。
- **理由与验证面：** 核对 canonical Skill、README/docs 与 source contract；行为语义需要 fresh-source eval，generated runtime 只经 init 投射。

### F301. `docs/skills/ce-simplify-code.md`
- **原始 diff：** `M`，`+66/-5`，实际变更行 71。
- **实际变化：** 更新上游 Skill 用户文档《'ce-simplify-code'》；新增/调整标题=“Example invocations”、“Simplify the current branch diff before review or PR creation”、“Limit the pass to one file”、“Describe a conversational scope when paths alone are not expressive enough”。
- **spec-first owner / 裁决：** spec-simplify-code + README/docs；`按当前 Skill 边界重写后吸收`。
- **理由与验证面：** 核对 canonical Skill、README/docs 与 source contract；行为语义需要 fresh-source eval，generated runtime 只经 init 投射。

### F302. `docs/skills/ce-strategy.md`
- **原始 diff：** `M`，`+20/-0`，实际变更行 20。
- **实际变化：** 更新上游 Skill 用户文档《'ce-strategy'》；新增/调整标题=“Example invocations”、“Create STRATEGY.md through the full interview when none exists”、“Revisit one section without reopening the entire strategy”、“Focus a section update on a specific question”。
- **spec-first owner / 裁决：** spec-strategy + README/docs；`按当前 Skill 边界重写后吸收`。
- **理由与验证面：** 核对 canonical Skill、README/docs 与 source contract；行为语义需要 fresh-source eval，generated runtime 只经 init 投射。

### F303. `docs/skills/ce-sweep.md`
- **原始 diff：** `M`，`+21/-11`，实际变更行 32。
- **实际变化：** 更新上游 Skill 用户文档《'/ce-sweep' — Recurring Feedback Sweep》；新增/调整标题=“Example invocations”、“First run: configure sources, approvals, state location, and scheduling”、“Later runs: fetch, acknowledge, analyze, verify, and reconcile the plan”、“Scheduled or unattended run: defer ambiguous decisions into the plan”；删除/替换标题=“Quick Example”。
- **spec-first owner / 裁决：** spec-sweep + README/docs；`按当前 Skill 边界重写后吸收`。
- **理由与验证面：** 核对 canonical Skill、README/docs 与 source contract；行为语义需要 fresh-source eval，generated runtime 只经 init 投射。

### F304. `docs/skills/ce-test-browser.md`
- **原始 diff：** `M`，`+49/-31`，实际变更行 80。
- **实际变化：** 更新上游 Skill 用户文档《'ce-test-browser'》；新增/调整标题=“Example invocations”、“Test routes affected by the current branch; the user owns the dev server”、“Derive routes from a PR or branch already checked out locally; test its running server”、“Connect manual mode to an existing server on a custom port”；删除/替换标题=“1. 'agent-browser' exclusively”、“5. Headed vs headless choice”。
- **spec-first owner / 裁决：** spec-test-browser + README/docs；`按当前 Skill 边界重写后吸收`。
- **理由与验证面：** 核对 canonical Skill、README/docs 与 source contract；行为语义需要 fresh-source eval，generated runtime 只经 init 投射。

### F305. `docs/skills/ce-test-xcode.md`
- **原始 diff：** `M`，`+1/-1`，实际变更行 2。
- **实际变化：** 更新上游 Skill 用户文档《'ce-test-xcode'》；定点条款摘录=“- ['ce-test-browser'](./ce-test-browser.md) — sibling skill for web-app testing via a host-native browser or…”。
- **spec-first owner / 裁决：** spec-test-xcode + README/docs；`按当前 Skill 边界重写后吸收`。
- **理由与验证面：** 核对 canonical Skill、README/docs 与 source contract；行为语义需要 fresh-source eval，generated runtime 只经 init 投射。

### F306. `docs/skills/ce-work.md`
- **原始 diff：** `M`，`+110/-17`，实际变更行 127。
- **实际变化：** 更新上游 Skill 用户文档《'ce-work'》；新增/调整标题=“Example invocations”、“Execute a specific implementation-ready plan and own the shipping tail”、“Implement a clear small or medium task without writing a plan first”、“Resume the latest eligible plan in docs/plans”；删除/替换标题=“3. Worktree-isolated parallelism — explicit conflicts, not silent data loss”、“6. Tiered code review with explicit residual handling”。
- **spec-first owner / 裁决：** spec-work + README/docs；`按当前 Skill 边界重写后吸收`。
- **理由与验证面：** 核对 canonical Skill、README/docs 与 source contract；行为语义需要 fresh-source eval，generated runtime 只经 init 投射。

### F307. `docs/skills/ce-worktree.md`
- **原始 diff：** `M`，`+17/-0`，实际变更行 17。
- **实际变化：** 更新上游 Skill 用户文档《'ce-worktree'》；新增/调整标题=“Example invocations”、“Start fresh work in isolation; existing isolation is detected first”、“Isolate an existing branch rather than creating a new one”、“Isolate a pull request without disturbing the current checkout”。
- **spec-first owner / 裁决：** spec-worktree + README/docs；`按当前 Skill 边界重写后吸收`。
- **理由与验证面：** 核对 canonical Skill、README/docs 与 source contract；行为语义需要 fresh-source eval，generated runtime 只经 init 投射。

### F308. `docs/skills/configuration.md`
- **原始 diff：** `A`，`+76/-0`，实际变更行 76。
- **实际变化：** 新增上游 Skill 用户文档《Compound Engineering configuration》；完整读取 77 行，标题结构包括“Compound Engineering configuration”、“Artifact root”、“How config relates to instructions”、“Options”、“Implementation routing”。
- **spec-first owner / 裁决：** README/docs + runtime/config owner；`按当前产品边界重写后吸收`。
- **理由与验证面：** 核对 canonical Skill、README/docs 与 source contract；行为语义需要 fresh-source eval，generated runtime 只经 init 投射。

### F309. `docs/skills/lfg.md`
- **原始 diff：** `M`，`+70/-3`，实际变更行 73。
- **实际变化：** 更新上游 Skill 用户文档《'lfg'》；新增/调整标题=“Example invocations”、“Most common: settle an ambitious feature's requirements, then ship from that context”、“Same handoff, but author the plan on a specific model (implementation stays native)”、“Ship a clear, already-well-bounded software task directly”。
- **spec-first owner / 裁决：** spec-lfg + README/docs；`按当前 Skill 边界重写后吸收`。
- **理由与验证面：** 核对 canonical Skill、README/docs 与 source contract；行为语义需要 fresh-source eval，generated runtime 只经 init 投射。

### F310. `docs/solutions/architecture-patterns/host-native-browser-driver-selection.md`
- **原始 diff：** `A`，`+78/-0`，实际变更行 78。
- **实际变化：** 新增上游解决方案知识《Separate host-native browser capabilities from portable fallbacks》；完整读取 79 行，标题结构包括“Separate host-native browser capabilities from portable fallbacks”、“Context”、“Guidance”、“Why This Matters”、“When to Apply”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + docs/solutions knowledge-promotion gate；`候选经验，当前 source 验证后选择性吸收`。
- **理由与验证面：** 按 knowledge-promotion gate 验证 provenance、current-source 适用性、真实 consumer 与 invalidation condition。

### F311. `docs/solutions/architecture-patterns/posix-process-supervision-on-native-windows.md`
- **原始 diff：** `A`，`+201/-0`，实际变更行 201。
- **实际变化：** 新增上游解决方案知识《Porting POSIX process supervision to native Windows: the primitives that fail silently》；完整读取 202 行，标题结构包括“Porting POSIX process supervision to native Windows: the primitives that fail silently”、“Context”、“Guidance”、“1. Process-tree teardown: 'killpg' has no direct analog”、“2. 'os.open' is text mode on Windows — silent corruption”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + docs/solutions knowledge-promotion gate；`候选经验，当前 source 验证后选择性吸收`。
- **理由与验证面：** 按 knowledge-promotion gate 验证 provenance、current-source 适用性、真实 consumer 与 invalidation condition。

### F312. `docs/solutions/best-practices/cache-invalidation-input-set-completeness.md`
- **原始 diff：** `M`，`+4/-2`，实际变更行 6。
- **实际变化：** 更新上游解决方案知识《A correctness cache needs a COMPLETE, schema-derived invalidation input set》；定点条款摘录=“We cached a question-agnostic 'project profile' (stack, deps, license, conventions, topology) keyed by git…”、“The repo-orientation profile was later removed entirely after behavioral evaluation showed that lean…”、“- AGENTS.md 'Lean Repo Grounding'”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + docs/solutions knowledge-promotion gate；`候选经验，当前 source 验证后选择性吸收`。
- **理由与验证面：** 按 knowledge-promotion gate 验证 provenance、current-source 适用性、真实 consumer 与 invalidation condition。

### F313. `docs/solutions/best-practices/predictable-tmp-cache-ownership-check.md`
- **原始 diff：** `M`，`+4/-2`，实际变更行 6。
- **实际变化：** 更新上游解决方案知识《A predictable-path cache in shared /tmp is a prompt-injection vector — ownership-check reads》；新增/调整标题=“Vulnerable: gates check authenticity-irrelevant facts (inputs_digest/schema/cleanliness),”；删除/替换标题=“Vulnerable: gates check authenticity-irrelevant facts (head_sha/schema/cleanliness),”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + docs/solutions knowledge-promotion gate；`候选经验，当前 source 验证后选择性吸收`。
- **理由与验证面：** 按 knowledge-promotion gate 验证 provenance、current-source 适用性、真实 consumer 与 invalidation condition。

### F314. `docs/solutions/conventions/resolve-python-interpreter-not-python3.md`
- **原始 diff：** `A`，`+121/-0`，实际变更行 121。
- **实际变化：** 新增上游解决方案知识《Resolve the Python interpreter by probing execution — never hardcode 'python3' in agent-facing prose》；完整读取 122 行，标题结构包括“Resolve the Python interpreter by probing execution — never hardcode 'python3' in agent-facing prose”、“Context”、“Guidance”、“Why This Matters”、“When to Apply”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + docs/solutions knowledge-promotion gate；`候选经验，当前 source 验证后选择性吸收`。
- **理由与验证面：** 按 knowledge-promotion gate 验证 provenance、current-source 适用性、真实 consumer 与 invalidation condition。

### F315. `docs/solutions/developer-experience/codex-local-skill-development-workflow.md`
- **原始 diff：** `A`，`+176/-0`，实际变更行 176。
- **实际变化：** 新增上游解决方案知识《Codex local skill development from any worktree》；完整读取 177 行，标题结构包括“Codex local skill development from any worktree”、“Context”、“Guidance”、“Why This Matters”、“When to Apply”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + docs/solutions knowledge-promotion gate；`候选经验，当前 source 验证后选择性吸收`。
- **理由与验证面：** 按 knowledge-promotion gate 验证 provenance、current-source 适用性、真实 consumer 与 invalidation condition。

### F316. `docs/solutions/developer-experience/idle-bound-test-suite-parallel-workers.md`
- **原始 diff：** `A`，`+100/-0`，实际变更行 100。
- **实际变化：** 新增上游解决方案知识《CI test suite was idle-bound, not CPU-bound — parallel workers cut it 54%》；完整读取 101 行，标题结构包括“CI test suite was idle-bound, not CPU-bound — parallel workers cut it 54%”、“Problem”、“Symptoms”、“What Didn't Work”、“Solution”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + docs/solutions knowledge-promotion gate；`候选经验，当前 source 验证后选择性吸收`。
- **理由与验证面：** 按 knowledge-promotion gate 验证 provenance、current-source 适用性、真实 consumer 与 invalidation condition。

### F317. `docs/solutions/developer-experience/windows-crlf-checkout-breaks-newline-anchored-tests.md`
- **原始 diff：** `A`，`+115/-0`，实际变更行 115。
- **实际变化：** 新增上游解决方案知识《A Windows CRLF checkout fails newline-anchored tests — diagnose it before you 'fix' the source》；完整读取 116 行，标题结构包括“A Windows CRLF checkout fails newline-anchored tests — diagnose it before you 'fix' the source”、“Context”、“Guidance”、“Why This Matters”、“When to Apply”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + docs/solutions knowledge-promotion gate；`候选经验，当前 source 验证后选择性吸收`。
- **理由与验证面：** 按 knowledge-promotion gate 验证 provenance、current-source 适用性、真实 consumer 与 invalidation condition。

### F318. `docs/solutions/integration-issues/portable-structured-output-schemas-across-model-clis.md`
- **原始 diff：** `A`，`+77/-0`，实际变更行 77。
- **实际变化：** 新增上游解决方案知识《Keep structured-output schemas portable across model CLIs》；完整读取 78 行，标题结构包括“Keep structured-output schemas portable across model CLIs”、“Problem”、“Symptoms”、“What Didn't Work”、“Solution”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + docs/solutions knowledge-promotion gate；`候选经验，当前 source 验证后选择性吸收`。
- **理由与验证面：** 按 knowledge-promotion gate 验证 provenance、current-source 适用性、真实 consumer 与 invalidation condition。

### F319. `docs/solutions/integrations/cross-platform-model-field-normalization.md`
- **原始 diff：** `M`，`+7/-5`，实际变更行 12。
- **实际变化：** 更新上游解决方案知识《Cross-platform model field normalization for target converters》；定点条款摘录=“// (illustrative current values; src/utils/model.ts holds the live map,”、“// bumped per generation — e.g. sonnet moved 4-6 -> 5, opus 4-6 -> 4-8)”、“sonnet: 'claude-sonnet-5',”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + docs/solutions knowledge-promotion gate；`候选经验，当前 source 验证后选择性吸收`。
- **理由与验证面：** 按 knowledge-promotion gate 验证 provenance、current-source 适用性、真实 consumer 与 invalidation condition。

### F320. `docs/solutions/skill-design/anti-poll-scope-and-async-subagent-dispatch.md`
- **原始 diff：** `A`，`+98/-0`，实际变更行 98。
- **实际变化：** 新增上游解决方案知识《Scope anti-poll discipline to detached CLI delegates, and write subagent-dispatch concurrency to the least-capable async primitive》；完整读取 99 行，标题结构包括“Scope anti-poll discipline to detached CLI delegates, and write subagent-dispatch concurrency to the…”、“Context”、“Guidance”、“1. Scope the anti-poll ban to detached delegates, not harness-managed subagents”、“2. Write subagent-concurrency rules to the least-capable async primitive”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + docs/solutions knowledge-promotion gate；`候选经验，当前 source 验证后选择性吸收`。
- **理由与验证面：** 按 knowledge-promotion gate 验证 provenance、current-source 适用性、真实 consumer 与 invalidation condition。

### F321. `docs/solutions/skill-design/arguments-token-is-claude-only-in-skill-bodies.md`
- **原始 diff：** `M`，`+28/-4`，实际变更行 32。
- **实际变化：** 更新上游解决方案知识《$ARGUMENTS is reliably substituted inside SKILL.md only on Claude Code — reason over the user's prompt instead》；定点条款摘录=“last_updated: 2026-07-12”、“**'$ARGUMENTS' substitution inside a SKILL.md body is only confirmed on Claude Code.** Per each platform's own…”、“- **Input injection** ('<feature_description> #$ARGUMENTS </feature_description>'). On Claude this is *how*…”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + docs/solutions knowledge-promotion gate；`候选经验，当前 source 验证后选择性吸收`。
- **理由与验证面：** 按 knowledge-promotion gate 验证 provenance、current-source 适用性、真实 consumer 与 invalidation condition。

### F322. `docs/solutions/skill-design/authoring-auto-invoke-standing-instructions.md`
- **原始 diff：** `A`，`+84/-0`，实际变更行 84。
- **实际变化：** 新增上游解决方案知识《Authoring 'Make It Automatic' auto-invoke guidance for CE skills》；完整读取 85 行，标题结构包括“Authoring 'Make It Automatic' auto-invoke guidance for CE skills”、“Context”、“Guidance”、“1. Two layers, different jobs — duplicate the no-yield boundary, keep cost policy in the caller”、“2. Anchor timing to a completion boundary, not per-edit”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + docs/solutions knowledge-promotion gate；`候选经验，当前 source 验证后选择性吸收`。
- **理由与验证面：** 按 knowledge-promotion gate 验证 provenance、current-source 适用性、真实 consumer 与 invalidation condition。

### F323. `docs/solutions/skill-design/benchmark-review-peer-model-and-reasoning-tier.md`
- **原始 diff：** `A`，`+191/-0`，实际变更行 191。
- **实际变化：** 新增上游解决方案知识《Benchmark a cross-model review peer's model and reasoning tier with reversed real bugs and a detection-vs-assertion judge》；完整读取 192 行，标题结构包括“Benchmark a cross-model review peer's model and reasoning tier with reversed real bugs and a…”、“Context”、“Guidance”、“Why This Matters”、“When to Apply”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + docs/solutions knowledge-promotion gate；`候选经验，当前 source 验证后选择性吸收`。
- **理由与验证面：** 按 knowledge-promotion gate 验证 provenance、current-source 适用性、真实 consumer 与 invalidation condition。

### F324. `docs/solutions/skill-design/bundled-script-path-resolution-across-harnesses.md`
- **原始 diff：** `M`，`+1/-1`，实际变更行 2。
- **实际变化：** 更新上游解决方案知识《Reference bundled skill files by tier: relative for reads, SKILL_DIR anchor for executed scripts》；定点条款摘录=“'AGENTS.md' > 'Platform-Specific Variables in Skills' codifies this three-tier model as the repo's authoring…”、“'AGENTS.md' > 'Platform-Specific Variables in Skills' codifies this three-tier model as the repo's authoring…”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + docs/solutions knowledge-promotion gate；`候选经验，当前 source 验证后选择性吸收`。
- **理由与验证面：** 按 knowledge-promotion gate 验证 provenance、current-source 适用性、真实 consumer 与 invalidation condition。

### F325. `docs/solutions/skill-design/cli-output-buffering-for-progress-detection.md`
- **原始 diff：** `A`，`+138/-0`，实际变更行 138。
- **实际变化：** 新增上游解决方案知识《Headless output buffering differs across agent CLIs, breaking stdout-growth progress detection》；完整读取 139 行，标题结构包括“Headless output buffering differs across agent CLIs, breaking stdout-growth progress detection”、“Context”、“Guidance”、“Why This Matters”、“When to Apply”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + docs/solutions knowledge-promotion gate；`候选经验，当前 source 验证后选择性吸收`。
- **理由与验证面：** 按 knowledge-promotion gate 验证 provenance、current-source 适用性、真实 consumer 与 invalidation condition。

### F326. `docs/solutions/skill-design/cross-harness-cross-model-tool-invocation.md`
- **原始 diff：** `A`，`+105/-0`，实际变更行 105。
- **实际变化：** 新增上游解决方案知识；完整读取 106 行，标题结构包括“Context”、“Guidance”、“Why This Matters”、“When to Apply”、“Examples”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + docs/solutions knowledge-promotion gate；`候选经验，当前 source 验证后选择性吸收`。
- **理由与验证面：** 按 knowledge-promotion gate 验证 provenance、current-source 适用性、真实 consumer 与 invalidation condition。

### F327. `docs/solutions/skill-design/cross-skill-shared-cache-primitive.md`
- **原始 diff：** `M`，`+29/-40`，实际变更行 69。
- **实际变化：** 更新上游解决方案知识《Retiring a shared cache that does not beat lean fresh grounding》；新增/调整标题=“Retiring a shared cache that does not beat lean fresh grounding”、“Decision”、“Evidence”、“General lesson”；删除/替换标题=“Building a shared cached primitive across self-contained skills”、“Guidance”、“Why This Matters”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + docs/solutions knowledge-promotion gate；`候选经验，当前 source 验证后选择性吸收`。
- **理由与验证面：** 按 knowledge-promotion gate 验证 provenance、current-source 适用性、真实 consumer 与 invalidation condition。

### F328. `docs/solutions/skill-design/detached-job-lifecycle-for-delegated-work.md`
- **原始 diff：** `A`，`+128/-0`，实际变更行 128。
- **实际变化：** 新增上游解决方案知识《Detached Job Lifecycle for Delegated Work That Must Outlive a Harness Tool Call》；完整读取 129 行，标题结构包括“Detached Job Lifecycle for Delegated Work That Must Outlive a Harness Tool Call”、“Context”、“Guidance”、“Why This Matters”、“When to Apply”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + docs/solutions knowledge-promotion gate；`候选经验，当前 source 验证后选择性吸收`。
- **理由与验证面：** 按 knowledge-promotion gate 验证 provenance、current-source 适用性、真实 consumer 与 invalidation condition。

### F329. `docs/solutions/skill-design/dispatch-script-failure-degrade-outcome-not-boundary.md`
- **原始 diff：** `A`，`+87/-0`，实际变更行 87。
- **实际变化：** 新增上游解决方案知识《When a deterministic dispatch script fails, degrade the outcome — never weaken the boundary the script enforced》；完整读取 88 行，标题结构包括“When a deterministic dispatch script fails, degrade the outcome — never weaken the boundary the script…”、“Context”、“Guidance”、“Why This Matters”、“When to Apply”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + docs/solutions knowledge-promotion gate；`候选经验，当前 source 验证后选择性吸收`。
- **理由与验证面：** 按 knowledge-promotion gate 验证 provenance、current-source 适用性、真实 consumer 与 invalidation condition。

### F330. `docs/solutions/skill-design/git-workflow-skills-need-explicit-state-machines.md`
- **原始 diff：** `M`，`+16/-15`，实际变更行 31。
- **实际变化：** 更新上游解决方案知识《Git workflow skills need explicit state machines for branch, push, and PR state》；新增/调整标题=“4. Detect an existing PR with 'gh pr list', and read its exit status as state”；删除/替换标题=“4. Prefer current-branch 'gh pr view' semantics over bare branch-name search”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + docs/solutions knowledge-promotion gate；`候选经验，当前 source 验证后选择性吸收`。
- **理由与验证面：** 按 knowledge-promotion gate 验证 provenance、current-source 适用性、真实 consumer 与 invalidation condition。

### F331. `docs/solutions/skill-design/multi-surface-output-needs-a-shared-rendering-floor.md`
- **原始 diff：** `A`，`+133/-0`，实际变更行 133。
- **实际变化：** 新增上游解决方案知识《Multi-surface skill output needs a shared, parity-tested rendering floor》；完整读取 134 行，标题结构包括“Multi-surface skill output needs a shared, parity-tested rendering floor”、“Context”、“Guidance”、“Why This Matters”、“When to Apply”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + docs/solutions knowledge-promotion gate；`候选经验，当前 source 验证后选择性吸收`。
- **理由与验证面：** 按 knowledge-promotion gate 验证 provenance、current-source 适用性、真实 consumer 与 invalidation condition。

### F332. `docs/solutions/skill-design/no-load-time-pre-resolution-for-fallible-context.md`
- **原始 diff：** `A`，`+116/-0`，实际变更行 116。
- **实际变化：** 新增上游解决方案知识《Don't pre-resolve fallible context with Claude-only '!' load-time commands — gather it at runtime as shell-neutral argv calls》；完整读取 117 行，标题结构包括“Don't pre-resolve fallible context with Claude-only '!' load-time commands — gather it at runtime as…”、“Context”、“Guidance”、“Why This Matters”、“When to Apply”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + docs/solutions knowledge-promotion gate；`候选经验，当前 source 验证后选择性吸收`。
- **理由与验证面：** 按 knowledge-promotion gate 验证 provenance、current-source 适用性、真实 consumer 与 invalidation condition。

### F333. `docs/solutions/skill-design/portable-agent-skill-authoring.md`
- **原始 diff：** `A`，`+440/-0`，实际变更行 440。
- **实际变化：** 新增上游解决方案知识《Portable Agent Skill Authoring》；完整读取 441 行，标题结构包括“Portable Agent Skill Authoring”、“Author in this order”、“Every instruction must earn its cost”、“The portability problem”、“Your model is not a neutral author”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + docs/solutions knowledge-promotion gate；`候选经验，当前 source 验证后选择性吸收`。
- **理由与验证面：** 按 knowledge-promotion gate 验证 provenance、current-source 适用性、真实 consumer 与 invalidation condition。

### F334. `docs/solutions/skill-design/requested-vs-verified-model-identity.md`
- **原始 diff：** `A`，`+98/-0`，实际变更行 98。
- **实际变化：** 新增上游解决方案知识《Requested-vs-Verified Model Identity: Treat 'Which Model Ran' as a Claim That Needs a Receipt》；完整读取 99 行，标题结构包括“Requested-vs-Verified Model Identity: Treat 'Which Model Ran' as a Claim That Needs a Receipt”、“Context”、“Guidance”、“Why This Matters”、“When to Apply”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + docs/solutions knowledge-promotion gate；`候选经验，当前 source 验证后选择性吸收`。
- **理由与验证面：** 按 knowledge-promotion gate 验证 provenance、current-source 适用性、真实 consumer 与 invalidation condition。

### F335. `docs/solutions/skill-design/validate-skill-prose-behavior-with-cross-host-evals.md`
- **原始 diff：** `A`，`+79/-0`，实际变更行 79。
- **实际变化：** 新增上游解决方案知识《Validate skill-prose behavior with cross-host evals》；完整读取 80 行，标题结构包括“Validate skill-prose behavior with cross-host evals”、“Context”、“Guidance”、“Why This Matters”、“When to Apply”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + docs/solutions knowledge-promotion gate；`候选经验，当前 source 验证后选择性吸收`。
- **理由与验证面：** 按 knowledge-promotion gate 验证 provenance、current-source 适用性、真实 consumer 与 invalidation condition。

### F336. `docs/solutions/skill-design/watch-loops-need-a-blocked-external-terminal-state.md`
- **原始 diff：** `A`，`+95/-0`，实际变更行 95。
- **实际变化：** 新增上游解决方案知识；完整读取 96 行，标题结构包括“Context”、“Guidance”、“Why This Matters”、“When to Apply”、“Examples”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + docs/solutions knowledge-promotion gate；`候选经验，当前 source 验证后选择性吸收`。
- **理由与验证面：** 按 knowledge-promotion gate 验证 provenance、current-source 适用性、真实 consumer 与 invalidation condition。

### F337. `docs/solutions/workflow/reviewing-byte-duplicated-shared-assets.md`
- **原始 diff：** `A`，`+117/-0`，实际变更行 117。
- **实际变化：** 新增上游解决方案知识《Reviewing a byte-duplicated shared asset: scope to the canonical copy or get 6x the findings》；完整读取 118 行，标题结构包括“Reviewing a byte-duplicated shared asset: scope to the canonical copy or get 6x the findings”、“Context”、“Guidance”、“1. Scope every reviewer to the canonical copy, explicitly”、“2. Pre-empt the 'extract a shared module' recommendation”。
- **spec-first owner / 裁决：** 对应 Skill/CLI owner + docs/solutions knowledge-promotion gate；`候选经验，当前 source 验证后选择性吸收`。
- **理由与验证面：** 按 knowledge-promotion gate 验证 provenance、current-source 适用性、真实 consumer 与 invalidation condition。

### F338. `docs/specs/claude-code.md`
- **原始 diff：** `D`，`+0/-67`，实际变更行 67。
- **实际变化：** 删除上游宿主规格《Claude Code Plugin Spec》；基线文件共 68 行，原标题结构包括“Claude Code Plugin Spec”、“Primary sources”、“Plugin layout and file locations”、“Manifest schema ('.claude-plugin/plugin.json')”、“Commands (slash commands)”。
- **spec-first owner / 裁决：** src/cli adapters/converters + runtime capability docs；`按当前 supported-platform contract 校准`。
- **理由与验证面：** adapter/converter/loader contract 与当前 supported-platform matrix；无 live journey 不声明宿主能力 confirmed。

### F339. `docs/specs/cline.md`
- **原始 diff：** `M`，`+1/-1`，实际变更行 2。
- **实际变化：** 更新上游宿主规格《Cline Spec (Skills and CLI Plugins)》；定点条款摘录=“Manual-only skills (for example 'ce-polish', 'ce-setup') require the opt-in flag:”、“Manual-only skills (for example 'lfg', 'ce-polish') require the opt-in flag:”。
- **spec-first owner / 裁决：** src/cli adapters/converters + runtime capability docs；`按当前 supported-platform contract 校准`。
- **理由与验证面：** adapter/converter/loader contract 与当前 supported-platform matrix；无 live journey 不声明宿主能力 confirmed。

### F340. `docs/specs/codex.md`
- **原始 diff：** `D`，`+0/-80`，实际变更行 80。
- **实际变化：** 删除上游宿主规格《Codex Spec (Config, Prompts, Skills, Subagents, MCP)》；基线文件共 81 行，原标题结构包括“Codex Spec (Config, Prompts, Skills, Subagents, MCP)”、“Primary sources”、“Config location and precedence”、“Profiles and providers”、“Custom prompts (slash commands)”。
- **spec-first owner / 裁决：** src/cli adapters/converters + runtime capability docs；`按当前 supported-platform contract 校准`。
- **理由与验证面：** adapter/converter/loader contract 与当前 supported-platform matrix；无 live journey 不声明宿主能力 confirmed。

### F341. `plugin.json`
- **原始 diff：** `M`，`+1/-1`，实际变更行 2。
- **实际变化：** 更新 JSON/manifest 文件；完整读取 7 行，本次变更键包括“version”。
- **spec-first owner / 裁决：** src/cli/plugin-manifest.js + adapters + package governance；`按当前 plugin/runtime model 校准，不直接复制`。
- **理由与验证面：** plugin manifest、converter、package inventory 与当前 supported-host tests；collision/ownership/legacy cleanup 保持 fail closed。

### F342. `tests/bundled-script-line-endings.test.ts`
- **原始 diff：** `A`，`+64/-0`，实际变更行 64。
- **实际变化：** 新增测试文件；完整读取 65 行，覆盖主题包括“/”、“\n”、“bundled script line endings (#1251)”、“every bundled bash/python script resolves to eol=lf”、“\0”。
- **spec-first owner / 裁决：** tests + 当前对应 Skill/CLI owner；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F343. `tests/ce-babysit-pr-contract.test.ts`
- **原始 diff：** `A`，`+521/-0`，实际变更行 521。
- **实际变化：** 新增测试文件；完整读取 522 行，覆盖主题包括“ce-babysit-pr cross-skill contract parity”、“ce-debug pipeline return-status enum agrees between producer and babysit consumer”、“pr-snapshot emits exactly the canonical trajectory field set”、“the delegated-mutation exclusion boundary is stated at all three ends of the chain”、“every trajectory field cited in consumer prose is one pr-snapshot actually emits”。
- **spec-first owner / 裁决：** spec-lfg + spec-commit-push-pr tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F344. `tests/ce-babysit-pr-snapshot.test.ts`
- **原始 diff：** `A`，`+2876/-0`，实际变更行 2876。
- **实际变化：** 新增测试文件；完整读取 2877 行，覆盖主题包括“\n”、“ce-babysit-pr pr-snapshot engine”、“branch currency: complete remote base identity creates one stable normal-base observation”、“branch currency: an old state file gains safe defaults without consuming the unseen item”、“branch currency: UNKNOWN mergeability re-polls without creating or consuming an item”。
- **spec-first owner / 裁决：** spec-lfg + spec-commit-push-pr tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F345. `tests/ce-code-review-mechanics.test.ts`
- **原始 diff：** `A`，`+628/-0`，实际变更行 628。
- **实际变化：** 新增测试文件；完整读取 629 行，覆盖主题包括“ce-code-review deterministic mechanics”、“scope helper counts executable changes and fails closed on uncounted files”、“scope helper emits UNKNOWN-equivalent state for an invalid endpoint”、“scope helper resolves the learnings corpus under a configured docs_root”、“scope helper treats an absolute or escaping docs_root as no corpus, not a crash”。
- **spec-first owner / 裁决：** spec-code-review/spec-doc-review/spec-pov/spec-work 对应 contract tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F346. `tests/ce-sweep-analyzer-parity.test.ts`
- **原始 diff：** `M`，`+1/-1`，实际变更行 2。
- **实际变化：** 更新测试文件；完整读取 86 行，覆盖主题包括“analyze_riffrec_zip safe_extract zip-slip guard”、“rejects a member that resolves to a sibling of the destination”、“analyze_riffrec_zip shared-asset parity”、“${asset} exists in every consumer and is byte-identical”。
- **spec-first owner / 裁决：** spec-sweep + spec-riffrec-feedback-analysis tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F347. `tests/ce-test-browser-driver-policy.test.ts`
- **原始 diff：** `A`，`+70/-0`，实际变更行 70。
- **实际变化：** 新增测试文件；完整读取 71 行，覆盖主题包括“ce-test-browser browser-driver policy”、“prefers a capable host-native browser and falls back to agent-browser”、“distinguishes host-native APIs from prohibited standalone substitutes”、“keeps the agent-browser fallback operational and version-matched”、“pipeline mode changes orchestration without forcing a driver or hiding it”。
- **spec-first owner / 裁决：** spec-test-browser tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F348. `tests/claude-parser.test.ts`
- **原始 diff：** `M`，`+36/-7`，实际变更行 43。
- **实际变化：** 更新测试文件；完整读取 249 行，覆盖主题包括“repository tree exposes only the root Claude plugin manifest”。
- **spec-first owner / 裁决：** tests + 当前对应 Skill/CLI owner；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F349. `tests/cli.test.ts`
- **原始 diff：** `M`，`+67/-29`，实际变更行 96。
- **实际变化：** 更新测试文件；完整读取 2019 行，覆盖主题包括“install --to codex strips a legacy Compound Codex tool map from AGENTS.md”。
- **spec-first owner / 裁决：** src/cli adapter/converter/plugin/init tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F350. `tests/cline-install-skills.test.ts`
- **原始 diff：** `M`，`+5/-5`，实际变更行 10。
- **实际变化：** 更新测试文件；完整读取 118 行，覆盖主题包括“cline install-skills.sh”、“does not remove unrelated manual-only skill symlinks”、“does not overwrite an existing user-managed symlink for an invocable skill”、“removes stale CE-owned manual-only symlinks on default install”。
- **spec-first owner / 裁决：** src/cli adapter/converter/plugin/init tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F351. `tests/codex-agents.test.ts`
- **原始 diff：** `M`，`+74/-35`，实际变更行 109。
- **实际变化：** 更新测试文件；完整读取 104 行，覆盖主题包括“removeCodexAgentsToolMapBlock”、“returns content unchanged when sentinels are absent”、“strips only the managed sentinel block”、“returns empty string when the file is only the managed block”、“stripCodexAgentsToolMap”。
- **spec-first owner / 裁决：** src/cli adapter/converter/plugin/init tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F352. `tests/codex-dev.test.ts`
- **原始 diff：** `A`，`+669/-0`，实际变更行 669。
- **实际变化：** 新增测试文件；完整读取 670 行，覆盖主题包括“@”、“Codex local development context”、“uses the invoking linked worktree and reports provenance and dirty files”、“rejects a repository that is not Compound Engineering”、“Codex local skill collection”。
- **spec-first owner / 裁决：** src/cli adapter/converter/plugin/init tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F353. `tests/codex-writer.test.ts`
- **原始 diff：** `M`，`+59/-0`，实际变更行 59。
- **实际变化：** 更新测试文件；完整读取 1726 行，覆盖主题包括“writeCodexBundle guards against ancestor-symlink traversal”。
- **spec-first owner / 裁决：** src/cli adapter/converter/plugin/init tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F354. `tests/commit-push-pr-contract.test.ts`
- **原始 diff：** `M`，`+115/-6`，实际变更行 121。
- **实际变化：** 更新测试文件；完整读取 216 行，覆盖主题包括“reconciles the complete branch scope before composition”、“repository PR-body contracts set structure without replacing editorial guidance”、“adds generic Compound Engineering branding only on an explicit signal”、“babysit handoff is default-on with off-switches and drivable fork PRs”、“config template and example keep branding out of ambient configuration”。
- **spec-first owner / 裁决：** tests + 当前对应 Skill/CLI owner；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F355. `tests/converter.test.ts`
- **原始 diff：** `M`，`+6/-2`，实际变更行 8。
- **实际变化：** 更新测试文件；完整读取 686 行，覆盖主题包括“convertClaudeToOpenCode”、“current compound-engineering output is skills only, no standalone agents, with one command stub per skill”、“skills generate slash-command stubs with description and argument-hint frontmatter”、“no command name is emitted more than once”、“explicit command foo:bar blocks skill stub foo/bar from being emitted”。
- **spec-first owner / 裁决：** src/cli adapter/converter/plugin/init tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F356. `tests/cross-model-receipt-parity.test.ts`
- **原始 diff：** `A`，`+45/-0`，实际变更行 45。
- **实际变化：** 新增测试文件；完整读取 46 行，覆盖主题包括“\n”、“cross-model receipt-kernel parity”、“the model-identity receipt block is byte-identical in all scripts”。
- **spec-first owner / 裁决：** spec-code-review/spec-doc-review/spec-pov/spec-work 对应 contract tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F357. `tests/cross-model-recover-findings-parity.test.ts`
- **原始 diff：** `A`，`+45/-0`，实际变更行 45。
- **实际变化：** 新增测试文件；完整读取 46 行，覆盖主题包括“\n”、“cross-model recover_findings_json parity”、“the recover_findings_json extractor is byte-identical in both scripts”。
- **spec-first owner / 裁决：** spec-code-review/spec-doc-review/spec-pov/spec-work 对应 contract tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F358. `tests/doc-claims-validator.test.ts`
- **原始 diff：** `M`，`+92/-5`，实际变更行 97。
- **实际变化：** 更新测试文件；完整读取 416 行，覆盖主题包括“does not flag {{...}} inside an inline code span”、“does not flag {{...}} inside a fenced code block”、“still flags a bare {{...}} scaffold leaked into prose”、“keeps a nested shorter fence inside a longer one masked”、“keeps a same-length info-string fence line as block content”。
- **spec-first owner / 裁决：** spec-compound + spec-compound-refresh tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F359. `tests/docs-root-literals.test.ts`
- **原始 diff：** `A`，`+92/-0`，实际变更行 92。
- **实际变化：** 新增测试文件；完整读取 93 行，覆盖主题包括“docs-root literal-path guard”、“no skill composes a hardcoded docs/<subdir> artifact path outside a comment”、“\n”、“the guard actually fires on a non-comment literal”。
- **spec-first owner / 裁决：** tests + 当前对应 Skill/CLI owner；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F360. `tests/docs-root-rule-parity.test.ts`
- **原始 diff：** `A`，`+88/-0`，实际变更行 88。
- **实际变化：** 新增测试文件；完整读取 89 行，覆盖主题包括“docs-root rule shared-asset parity”、“the fixture defines a single delimited block”、“every consumer skill contains the canonical block verbatim”、“the canonical block pins its load-bearing clauses”。
- **spec-first owner / 裁决：** tests + 当前对应 Skill/CLI owner；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F361. `tests/droid-converter.test.ts`
- **原始 diff：** `M`，`+71/-0`，实际变更行 71。
- **实际变化：** 更新测试文件；完整读取 430 行，覆盖主题包括“does not infer tools from incidental substrings in agent prose”、“still infers tools from whole-word references”、“maps AskUserQuestion by its real tool name, not the bare word”。
- **spec-first owner / 裁决：** src/cli adapter/converter/plugin/init tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F362. `tests/fixtures/custom-paths/claude-plugin/plugin.json`
- **原始 diff：** `R100`，`+0/-0`，实际变更行 0。
- **实际变化：** 更新测试 fixture；完整读取 9 行，变更围绕 plugin.json 的结构/输入样例。
- **spec-first owner / 裁决：** src/cli adapter/converter/plugin/init tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F363. `tests/fixtures/docs-root-rule.md`
- **原始 diff：** `A`，`+7/-0`，实际变更行 7。
- **实际变化：** 新增测试 fixture；完整读取 8 行，变更围绕 docs-root-rule.md 的结构/输入样例。
- **spec-first owner / 裁决：** tests + 当前对应 Skill/CLI owner；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F364. `tests/fixtures/invalid-command-path/claude-plugin/plugin.json`
- **原始 diff：** `R100`，`+0/-0`，实际变更行 0。
- **实际变化：** 更新测试 fixture；完整读取 6 行，变更围绕 plugin.json 的结构/输入样例。
- **spec-first owner / 裁决：** src/cli adapter/converter/plugin/init tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F365. `tests/fixtures/invalid-hooks-path/claude-plugin/plugin.json`
- **原始 diff：** `R100`，`+0/-0`，实际变更行 0。
- **实际变化：** 更新测试 fixture；完整读取 6 行，变更围绕 plugin.json 的结构/输入样例。
- **spec-first owner / 裁决：** src/cli adapter/converter/plugin/init tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F366. `tests/fixtures/invalid-mcp-path/claude-plugin/plugin.json`
- **原始 diff：** `R100`，`+0/-0`，实际变更行 0。
- **实际变化：** 更新测试 fixture；完整读取 6 行，变更围绕 plugin.json 的结构/输入样例。
- **spec-first owner / 裁决：** src/cli adapter/converter/plugin/init tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F367. `tests/fixtures/mcp-file/claude-plugin/plugin.json`
- **原始 diff：** `R100`，`+0/-0`，实际变更行 0。
- **实际变化：** 更新测试 fixture；完整读取 6 行，变更围绕 plugin.json 的结构/输入样例。
- **spec-first owner / 裁决：** src/cli adapter/converter/plugin/init tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F368. `tests/fixtures/peer-job-runner-unit.py`
- **原始 diff：** `A`，`+432/-0`，实际变更行 432。
- **实际变化：** 新增测试 fixture；完整读取 433 行，变更围绕 peer-job-runner-unit.py 的结构/输入样例。
- **spec-first owner / 裁决：** spec-code-review/spec-doc-review/spec-pov/spec-work 对应 contract tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F369. `tests/fixtures/peer-job-runner-windows-smoke.py`
- **原始 diff：** `A`，`+394/-0`，实际变更行 394。
- **实际变化：** 新增测试 fixture；完整读取 395 行，变更围绕 peer-job-runner-windows-smoke.py 的结构/输入样例。
- **spec-first owner / 裁决：** spec-code-review/spec-doc-review/spec-pov/spec-work 对应 contract tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F370. `tests/fixtures/sample-plugin/claude-plugin/plugin.json`
- **原始 diff：** `R100`，`+0/-0`，实际变更行 0。
- **实际变化：** 更新测试 fixture；完整读取 31 行，变更围绕 plugin.json 的结构/输入样例。
- **spec-first owner / 裁决：** src/cli adapter/converter/plugin/init tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F371. `tests/frontmatter.test.ts`
- **原始 diff：** `M`，`+16/-0`，实际变更行 16。
- **实际变化：** 更新测试文件；完整读取 203 行，覆盖主题包括“formatFrontmatter quotes reserved scalar strings so they keep their type”、“formatFrontmatter leaves strings YAML reads back as themselves unquoted”。
- **spec-first owner / 裁决：** src/cli adapter/converter/plugin/init tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F372. `tests/gpt-5-6-skill-migration.test.ts`
- **原始 diff：** `M`，`+3/-1`，实际变更行 4。
- **实际变化：** 更新测试文件；完整读取 72 行，覆盖主题包括“GPT-5.6 skill migration”、“keeps runtime prompt assets free of provider-specific GPT-5.6 variants”、“removes the obsolete Codex mini/mid-tier label”、“does not treat Codex task wording as a model override”、“does not reference the retired Codex work-delegation config”。
- **spec-first owner / 裁决：** tests + 当前对应 Skill/CLI owner；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F373. `tests/helpers/claude-plugin-fixture.ts`
- **原始 diff：** `A`，`+32/-0`，实际变更行 32。
- **实际变化：** 新增测试文件；完整读取 33 行，变更围绕 claude-plugin-fixture.ts 的结构/输入样例。
- **spec-first owner / 裁决：** src/cli adapter/converter/plugin/init tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F374. `tests/kiro-converter.test.ts`
- **原始 diff：** `M`，`+43/-0`，实际变更行 43。
- **实际变化：** 更新测试文件；完整读取 487 行，覆盖主题包括“does not transform absolute filesystem paths as slash commands”、“preserves absolute paths whose root is outside the allowlist”、“transforms slash commands terminated by sentence punctuation”、“transforms a backticked command followed by a colon without leaving a stray backtick”、“preserves a backticked absolute path whose root is outside the allowlist”。
- **spec-first owner / 裁决：** src/cli adapter/converter/plugin/init tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F375. `tests/legacy-cleanup.test.ts`
- **原始 diff：** `M`，`+15/-3`，实际变更行 18。
- **实际变化：** 更新测试文件；完整读取 870 行，覆盖主题包括“cleanupStaleSkillDirs”、“removes known stale skill directories”、“preserves non-stale directories”、“removes ce-review and ce-document-review (renamed skills)”、“removes promoted-from-beta skill dirs via their last-shipped beta description (ce-dogfood-beta,…”。
- **spec-first owner / 裁决：** src/cli adapter/converter/plugin/init tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F376. `tests/opencode-plugin-commands.test.ts`
- **原始 diff：** `A`，`+101/-0`，实际变更行 101。
- **实际变化：** 新增测试文件；完整读取 102 行，覆盖主题包括“opencode plugin skill commands”、“registers a command for every user-invocable skill”、“each command carries a $ARGUMENTS template and the skill description”、“commands use only keys the opencode config schema allows”、“does not clobber a user-defined command of the same name”。
- **spec-first owner / 裁决：** src/cli adapter/converter/plugin/init tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F377. `tests/opencode-writer.test.ts`
- **原始 diff：** `M`，`+37/-0`，实际变更行 37。
- **实际变化：** 更新测试文件；完整读取 1041 行，覆盖主题包括“writeOpenCodeBundle guards against ancestor-symlink traversal”。
- **spec-first owner / 裁决：** src/cli adapter/converter/plugin/init tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F378. `tests/peer-job-runner-parity.test.ts`
- **原始 diff：** `A`，`+61/-0`，实际变更行 61。
- **实际变化：** 新增测试文件；完整读取 62 行，覆盖主题包括“peer-job-runner shared-asset parity”、“${asset} exists in every consumer and is byte-identical”、“peer-worker heartbeat lifecycle is identical and exits with its parent”。
- **spec-first owner / 裁决：** spec-code-review/spec-doc-review/spec-pov/spec-work 对应 contract tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F379. `tests/pi-converter.test.ts`
- **原始 diff：** `M`，`+6/-2`，实际变更行 8。
- **实际变化：** 更新测试文件；完整读取 234 行，覆盖主题包括“convertClaudeToPi”、“converts commands, skills, agents, and MCP servers without shipping a Pi extension”、“omits mcporterConfig when the plugin declares no MCP servers”、“transforms Task calls, slash commands, and todo tool references; preserves AskUserQuestion”、“transforms current Claude Code Task* task-tracking primitives to platform-generic text”。
- **spec-first owner / 裁决：** src/cli adapter/converter/plugin/init tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F380. `tests/pi-writer.test.ts`
- **原始 diff：** `M`，`+37/-0`，实际变更行 37。
- **实际变化：** 更新测试文件；完整读取 865 行，覆盖主题包括“writePiBundle guards against ancestor-symlink traversal”。
- **spec-first owner / 裁决：** src/cli adapter/converter/plugin/init tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F381. `tests/pipeline-review-contract.test.ts`
- **原始 diff：** `M`，`+125/-20`，实际变更行 145。
- **实际变化：** 更新测试文件；完整读取 874 行，覆盖主题包括“cross-model execution receipt seam parity (ce-work <-> lfg)”、“lfg requires every route receipt exposed by ce-work”、“lfg keeps the binding out of plan and review inputs”、“explicit Compound Engineering branding provenance”、“CE-owned shipping callers pass branding:on”。
- **spec-first owner / 裁决：** tests + 当前对应 Skill/CLI owner；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F382. `tests/plugin-path.test.ts`
- **原始 diff：** `M`，`+6/-2`，实际变更行 8。
- **实际变化：** 更新测试文件；完整读取 298 行，覆盖主题包括“plugin-path”、“clones a branch to a stable cache path”、“sanitizes branch names with slashes into stable directory names”、“updates existing checkout on re-run”、“fails with a clear error for a nonexistent branch”。
- **spec-first owner / 裁决：** src/cli adapter/converter/plugin/init tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F383. `tests/pov-skill-contract.test.ts`
- **原始 diff：** `A`，`+359/-0`，实际变更行 359。
- **实际变化：** 新增测试文件；完整读取 360 行，覆盖主题包括“ce-pov subject-shape contract”、“the activation contract names all three POV shapes and avoids generic repo profiling”、“licenses bounded inline grounding while keeping the prior-decision scan mandatory”、“semantic cross-model requests activate without the oracle shorthand”、“---”。
- **spec-first owner / 裁决：** tests + 当前对应 Skill/CLI owner；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F384. `tests/real-plugin-conversion.test.ts`
- **原始 diff：** `M`，`+6/-4`，实际变更行 10。
- **实际变化：** 更新测试文件；完整读取 408 行，覆盖主题包括“real-plugin conversion drift: ${pluginName}”、“converts to every implemented target”、“opencode output matches the source inventory”、“codex output matches the source inventory”、“pi output matches the source inventory”。
- **spec-first owner / 裁决：** src/cli adapter/converter/plugin/init tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F385. `tests/reasoning-elevation-parity.test.ts`
- **原始 diff：** `M`，`+8/-9`，实际变更行 17。
- **实际变化：** 更新测试文件；完整读取 43 行，覆盖主题包括“no consumer SKILL.md reintroduces the retired model name”。
- **spec-first owner / 裁决：** spec-code-review/spec-doc-review/spec-pov/spec-work 对应 contract tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F386. `tests/release-metadata.test.ts`
- **原始 diff：** `M`，`+55/-34`，实际变更行 89。
- **实际变化：** 更新测试文件；完整读取 806 行，覆盖主题包括“reports a materialized (non-local) Codex marketplace source as a structural error”、“accepts a co-located local Codex marketplace source”。
- **spec-first owner / 裁决：** src/cli adapter/converter/plugin/init tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F387. `tests/repo-profile-cache-parity.test.ts`
- **原始 diff：** `D`，`+0/-44`，实际变更行 44。
- **实际变化：** 删除测试文件；完整读取 45 行，覆盖主题包括“repo-profile-cache shared-asset parity”、“${asset} exists in every consumer and is byte-identical”。
- **spec-first owner / 裁决：** 九个 cache consumer 的删除/新鲜度回归 tests；`删除语义映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F388. `tests/repo-profile-cache.test.ts`
- **原始 diff：** `D`，`+0/-309`，实际变更行 309。
- **实际变化：** 删除测试文件；完整读取 310 行，覆盖主题包括“repo-profile-cache helper”、“fresh repo with no entry → MISS + a cache path under /tmp”、“\n”、“put then get (clean tree) → HIT with the stored profile”、“dirty NON-input file (untracked source) stays HIT”。
- **spec-first owner / 裁决：** 九个 cache consumer 的删除/新鲜度回归 tests；`删除语义映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F389. `tests/repo-research-analyst-contract.test.ts`
- **原始 diff：** `A`，`+32/-0`，实际变更行 32。
- **实际变化：** 新增测试文件；完整读取 33 行，覆盖主题包括“repo research runs Phase 0 only when in scope”、“ce-plan collects versions only when materially relevant”。
- **spec-first owner / 裁决：** tests + 当前对应 Skill/CLI owner；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F390. `tests/resolve-pr-feedback-pagination.test.ts`
- **原始 diff：** `M`，`+221/-1`，实际变更行 222。
- **实际变化：** 更新测试文件；完整读取 290 行，覆盖主题包括“get-pr-comments leaves external identity classification to agent judgment”、“get-thread-for-comment emits the matched thread context from a slurpfile”、“get-pr-comments merges slurpfile pages without --argjson”。
- **spec-first owner / 裁决：** spec-resolve-pr-feedback tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F391. `tests/review-skill-contract.test.ts`
- **原始 diff：** `M`，`+525/-127`，实际变更行 652。
- **实际变化：** 更新测试文件；完整读取 1257 行，覆盖主题包括“hydrates compact reviewer returns before final output”、“keeps extension keywords out of draft-07 cross-model schemas”、“subagent template and schema require load-bearing line provenance in evidence”、“Stage 4 concurrent-batch dispatch preserves cap-safety and determinism”、“Stage 5c requires explicit local-apply authority and mode:agent is always report-only”。
- **spec-first owner / 裁决：** spec-code-review/spec-doc-review/spec-pov/spec-work 对应 contract tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F392. `tests/scratch-root-contract.test.ts`
- **原始 diff：** `A`，`+134/-0`，实际变更行 134。
- **实际变化：** 新增测试文件；完整读取 135 行，覆盖主题包括“owner-scoped scratch root”、“runtime assets use the uid-scoped root, not the legacy shared root”、“every shell root assignment enforces private ownership without helper copies”、“the shell guard creates mode 0700 and rejects a symlink”、“peer runner defaults to the effective-uid root”。
- **spec-first owner / 裁决：** tests + 当前对应 Skill/CLI owner；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F393. `tests/session-history-scripts.test.ts`
- **原始 diff：** `M`，`+115/-1`，实际变更行 116。
- **实际变化：** 更新测试文件；完整读取 1897 行，覆盖主题包括“UTF-8 session content under a non-UTF-8 locale (#1258)”、“extract-metadata.py reads a UTF-8 session file without crashing”、“extract-skeleton.py --output round-trips UTF-8 content without crashing”、“extract-errors.py --output round-trips UTF-8 content without crashing”。
- **spec-first owner / 裁决：** spec-compound + spec-compound-refresh tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F394. `tests/settled-decisions-parity.test.ts`
- **原始 diff：** `A`，`+42/-0`，实际变更行 42。
- **实际变化：** 新增测试文件；完整读取 43 行，覆盖主题包括“settled-decisions shared-asset parity”、“${asset} exists in every consumer and is byte-identical”、“the shared reference pins the closed two-class enum”。
- **spec-first owner / 裁决：** spec-brainstorm + spec-plan + spec-ideate tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F395. `tests/skill-conventions.test.ts`
- **原始 diff：** `M`，`+125/-9`，实际变更行 134。
- **实际变化：** 更新测试文件；完整读取 1343 行，覆盖主题包括“user-facing skill invocation authoring contract”、“authoring guidance separates semantic routing from host-rendered user copy”、“README explains Codex invocation syntax without rewriting the built-in goal command”、“\n”、“python interpreter resolution (no bare python3 invocations)”。
- **spec-first owner / 裁决：** tests + 当前对应 Skill/CLI owner；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F396. `tests/skill-shell-safety.test.ts`
- **原始 diff：** `M`，`+204/-436`，实际变更行 640。
- **实际变化：** 更新测试文件；完整读取 303 行，覆盖主题包括“ignores a”、“skills contain no”、“no skill file uses”、“no skill pre-resolves a command that would abort skill load”、“\”。
- **spec-first owner / 裁决：** tests + 当前对应 Skill/CLI owner；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F397. `tests/skills/ce-brainstorm-aggregation-check.test.ts`
- **原始 diff：** `A`，`+93/-0`，实际变更行 93。
- **实际变化：** 新增测试文件；完整读取 94 行，覆盖主题包括“ce-brainstorm integration scope check”、“treats named sources as coverage before splitting implementation work”、“narrows multi-outcome requests to one coherent work unit without creating a parent roadmap”、“preserves the broader relationship in plain language with bullets before diagrams”、“gives the relationship section a format-specific semantic role independent of its heading”。
- **spec-first owner / 裁决：** tests + 当前对应 Skill/CLI owner；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F398. `tests/skills/ce-code-review-cross-model-routes.test.ts`
- **原始 diff：** `A`，`+909/-0`，实际变更行 909。
- **实际变化：** 新增测试文件；完整读取 910 行，覆盖主题包括“cross-model-adversarial-review route safety”、“EXIT cleanup removes private prompt, log, and raw-output scratch”、“every route carries read-only / no-prompt / least-privilege flags and no NEVER-use flag”、“live dispatch without a host-sanctioned fixed route fails closed”、“live dispatch runs a sanctioned target later than the discovery cap”。
- **spec-first owner / 裁决：** spec-code-review/spec-doc-review/spec-pov/spec-work 对应 contract tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F399. `tests/skills/ce-compound-headless-depth.test.ts`
- **原始 diff：** `A`，`+146/-0`，实际变更行 146。
- **实际变化：** 新增测试文件；完整读取 147 行，覆盖主题包括“ce-compound non-interactive depth contract”、“advertises explicit lightweight and full headless invocations”、“keeps existing headless calls backward compatible”、“routes explicit lightweight depth without prompts or subagents”、“rejects unknown or conflicting depth flags instead of guessing”。
- **spec-first owner / 裁决：** spec-compound + spec-compound-refresh tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F400. `tests/skills/ce-doc-review-cross-model-routes.test.ts`
- **原始 diff：** `A`，`+873/-0`，实际变更行 873。
- **实际变化：** 新增测试文件；完整读取 874 行，覆盖主题包括“cross-model-doc-review route safety (R17)”、“EXIT cleanup removes prompt logs, raw output, and the private peer workspace”、“every route carries read-only / no-prompt / least-privilege flags and no NEVER-use flag”、“live dispatch without a host-sanctioned fixed route fails closed”、“live dispatch runs a sanctioned target later than the discovery cap”。
- **spec-first owner / 裁决：** spec-code-review/spec-doc-review/spec-pov/spec-work 对应 contract tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F401. `tests/skills/ce-doc-review-rendering-floor.test.ts`
- **原始 diff：** `A`，`+95/-0`，实际变更行 95。
- **实际变化：** 新增测试文件；完整读取 96 行，覆盖主题包括“ce-doc-review shared rendering floor”、“floor pins the decision-first field order”、“floor pins all three opaque-token classes, not document IDs alone”、“floor pins the anchor budget and the identifier-free-consequence invariant”、“floor carries no YAML frontmatter (reference doc, not an agent def)”。
- **spec-first owner / 裁决：** tests + 当前对应 Skill/CLI owner；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F402. `tests/skills/ce-explain-routing.test.ts`
- **原始 diff：** `M`，`+263/-11`，实际变更行 274。
- **实际变化：** 更新测试文件；完整读取 399 行，覆盖主题包括“check-in makes the explainer the recommended first choice”、“only the exact Quiz me choice enables prediction and exercises”、“recap evidence is dispatched directly without a main-agent pre-scan”、“Claude Artifact owns its adaptation and ht-ml requires post-warning confirmation”、“HTML output pins stable metadata and preserves baseline constraints”。
- **spec-first owner / 裁决：** tests + 当前对应 Skill/CLI owner；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F403. `tests/skills/ce-handoff-contract.test.ts`
- **原始 diff：** `A`，`+156/-0`，实际变更行 156。
- **实际变化：** 新增测试文件；完整读取 157 行，覆盖主题包括“ce-handoff portable runtime contract”、“frontmatter activates one skill for create and resume intent”、“routes bare invocation to create and supports explicit or natural intent”、“defines the managed store and immutable v1 frontmatter”、“serializes managed frontmatter strings with JSON-compatible YAML quoting”。
- **spec-first owner / 裁决：** tests + 当前对应 Skill/CLI owner；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F404. `tests/skills/ce-plan-handoff-routing.test.ts`
- **原始 diff：** `M`，`+167/-25`，实际变更行 192。
- **实际变化：** 更新测试文件；完整读取 526 行，覆盖主题包括“Start”、“plan-handoff.md routing for Start”、“mandatory document review uses the host skill mechanism without a Task stand-in”、“cross-skill routes use one generic invocation contract across skill-capable hosts”、“related handoff surfaces do not teach Claude-shaped skill calls”。
- **spec-first owner / 裁决：** tests + 当前对应 Skill/CLI owner；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F405. `tests/skills/ce-pov-cross-model-routes.test.ts`
- **原始 diff：** `A`，`+483/-0`，实际变更行 483。
- **实际变化：** 新增测试文件；完整读取 484 行，覆盖主题包括“ce-pov cross-model route safety”、“all routes preserve read/write/exec denial and avoid never-use flags”、“codex”、“claude”、“grok-cli”。
- **spec-first owner / 裁决：** spec-code-review/spec-doc-review/spec-pov/spec-work 对应 contract tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F406. `tests/skills/ce-proof-contract.test.ts`
- **原始 diff：** `A`，`+73/-0`，实际变更行 73。
- **实际变化：** 新增测试文件；完整读取 74 行，覆盖主题包括“ce-proof v3 + owner lifecycle contract”、“skill teaches Proof v3 read/edit surfaces”、“create workflow persists ownerSecret separately from accessToken”、“skill documents delete and claim/revocation”、“skill warns that content wipe does not scrub comments”。
- **spec-first owner / 裁决：** spec-proof tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F407. `tests/skills/ce-resolve-pr-feedback-reply-newlines.test.ts`
- **原始 diff：** `A`，`+85/-0`，实际变更行 85。
- **实际变化：** 新增测试文件；完整读取 86 行，覆盖主题包括“ce-resolve-pr-feedback reply bodies keep real newlines”、“the reply example feeds a quoted heredoc, not echo”、“the reply example is multiline Markdown: a quote line, a blank line, then a paragraph”、“<<”、“\nEOF”。
- **spec-first owner / 裁决：** spec-resolve-pr-feedback tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F408. `tests/skills/ce-resolve-pr-feedback-script-dir.test.ts`
- **原始 diff：** `M`，`+27/-26`，实际变更行 53。
- **实际变化：** 更新测试文件；完整读取 36 行，覆盖主题包括“${file}: each bundled-script block resolves the skill dir via a flatten-safe SKILL_DIR anchor”、“\n”。
- **spec-first owner / 裁决：** spec-resolve-pr-feedback tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F409. `tests/skills/ce-setup-check-health.test.ts`
- **原始 diff：** `M`，`+493/-0`，实际变更行 493。
- **实际变化：** 更新测试文件；完整读取 609 行，覆盖主题包括“documents every setup-template option in the centralized config reference”、“advertises model-elevation keys and not the retired fable keys”、“routes retired and malformed dormant engine settings into preference repair”、“documents the cross-model configuration and lifecycle without overstating worktree isolation”、“warns on an active retired fable key and names its replacement”。
- **spec-first owner / 裁决：** tests + 当前对应 Skill/CLI owner；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F410. `tests/skills/ce-work-cross-model-integration.test.ts`
- **原始 diff：** `A`，`+1187/-0`，实际变更行 1187。
- **实际变化：** 新增测试文件；完整读取 1188 行，覆盖主题包括“\n”、“ce-work serial cross-model transaction”、“scope expansion remains a successful detached result for host inspection”、“structured receipts redact secrets before JSON encoding”、“missing fixed-route CLI records an authoritative unavailable receipt for fallback disclosure”。
- **spec-first owner / 裁决：** spec-code-review/spec-doc-review/spec-pov/spec-work 对应 contract tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F411. `tests/skills/ce-work-cross-model-routes.test.ts`
- **原始 diff：** `A`，`+883/-0`，实际变更行 883。
- **实际变化：** 新增测试文件；完整读取 884 行，覆盖主题包括“\n”、“ce-work fixed write routes”、“production argv uses the qualified noninteractive write posture”、“codex”、“claude”。
- **spec-first owner / 裁决：** spec-code-review/spec-doc-review/spec-pov/spec-work 对应 contract tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F412. `tests/skills/ce-work-outcome-spine.test.ts`
- **原始 diff：** `A`，`+600/-0`，实际变更行 600。
- **实际变化：** 新增测试文件；完整读取 601 行，覆盖主题包括“ce-work native characterization”、“opens with result, next consumer, done condition, and host-owned canonical integration”、“classifies caller mode, legacy aliases, bare prompts, and plans before execution”、“activates direct recovery before ordinary input classification”、“keeps the existing native engines and synchronous inline path”。
- **spec-first owner / 裁决：** spec-work + spec-worktree tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F413. `tests/skills/ce-work-unit-workspace.test.ts`
- **原始 diff：** `A`，`+4516/-0`，实际变更行 4516。
- **实际变化：** 新增测试文件；完整读取 4517 行，覆盖主题包括“\n”、“ce-work unit workspace controller”、“ignores inherited Git repository-selection and index variables”、“unit and plan-wide verification ignore inherited Git local environment”、“derives the CE Work runs root from the generic peer root when needed”。
- **spec-first owner / 裁决：** spec-work + spec-worktree tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F414. `tests/skills/cross-model-peer-budget.test.ts`
- **原始 diff：** `A`，`+216/-0`，实际变更行 216。
- **实际变化：** 新增测试文件；完整读取 217 行，覆盖主题包括“cross-model peer budget”、“the idle cap is the liveness guard, so it fires before the hard backstop”、“ce-code-review and ce-doc-review keep identical caps (kernel parity)”、“a route without output-idle detection never gets the raised backstop”、“run_timeout_cmd applies the unguarded cap, not the raised one”。
- **spec-first owner / 裁决：** spec-code-review/spec-doc-review/spec-pov/spec-work 对应 contract tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F415. `tests/skills/elevation-dispatch.test.ts`
- **原始 diff：** `A`，`+301/-0`，实际变更行 301。
- **实际变化：** 新增测试文件；完整读取 302 行，覆盖主题包括“elevation-dispatch worker”、“both skill copies are byte-identical”、“emits a streaming, read-only claude argv”、“\0”、“a matching receipt yields a matched envelope with the output”。
- **spec-first owner / 裁决：** tests + 当前对应 Skill/CLI owner；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F416. `tests/skills/fenced-blocks.ts`
- **原始 diff：** `A`，`+27/-0`，实际变更行 27。
- **实际变化：** 新增测试文件；完整读取 28 行，覆盖主题包括“\n”。
- **spec-first owner / 裁决：** tests + 当前对应 Skill/CLI owner；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F417. `tests/skills/flatten-safety.test.ts`
- **原始 diff：** `A`，`+77/-0`，实际变更行 77。
- **实际变化：** 新增测试文件；完整读取 78 行，覆盖主题包括“\n”、“skills bash blocks are flatten-safe”、“every”。
- **spec-first owner / 裁决：** tests + 当前对应 Skill/CLI owner；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F418. `tests/skills/peer-job-runner.test.ts`
- **原始 diff：** `A`，`+696/-0`，实际变更行 696。
- **实际变化：** 新增测试文件；完整读取 697 行，覆盖主题包括“peer-job-runner lifecycle”、“ce-work”、“explicit non-ce-work lookup ignores a stale ce-work root”、“happy path: start -> done; result emits artifact; every call sub-2s”、“repairs an existing owner-owned root that is not private”。
- **spec-first owner / 裁决：** spec-code-review/spec-doc-review/spec-pov/spec-work 对应 contract tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F419. `tests/skills/task-visibility-contract.test.ts`
- **原始 diff：** `A`，`+45/-0`，实际变更行 45。
- **实际变化：** 新增测试文件；完整读取 46 行，覆盖主题包括“task visibility contract”、“material workflow skills own a portable task surface”、“brainstorm ends on its substantive outcome rather than a handoff task”、“ce-work uses goal-first unit names without redundant ordinal counts”、“code review surfaces only a cross-model pass that actually started”。
- **spec-first owner / 裁决：** tests + 当前对应 Skill/CLI owner；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F420. `tests/skills/unified-plan-artifact-contract.test.ts`
- **原始 diff：** `M`，`+447/-12`，实际变更行 459。
- **实际变化：** 更新测试文件；完整读取 809 行，覆盖主题包括“brainstorm self-reviews the written artifact before its handoff”、“brainstorm handoff explains that downstream work consumes the written artifact”、“lfg offers an opt-in fresh-session handoff for separately planned future work”、“lfg carries per-stage routing carriers at each stage seam”、“lfg”。
- **spec-first owner / 裁决：** tests + 当前对应 Skill/CLI owner；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F421. `tests/skills/user-facing-skill-invocation-rendering.test.ts`
- **原始 diff：** `A`，`+137/-0`，实际变更行 137。
- **实际变化：** 新增测试文件；完整读取 138 行，覆盖主题包括“user-facing skill invocation rendering”、“rendering rules sit at the output sections that consume them”、“agent-to-agent routes use semantic skill names instead of user command syntax”、“Codex goal remains a built-in exception, not a converted skill invocation”。
- **spec-first owner / 裁决：** tests + 当前对应 Skill/CLI owner；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

### F422. `tests/slash-command.test.ts`
- **原始 diff：** `A`，`+49/-0`，实际变更行 49。
- **实际变化：** 新增测试文件；完整读取 50 行，覆盖主题包括“isReservedPathRoot”、“matches every reserved single-segment path root”、“does not match real command names”、“transformSlashCommands”、“hands the matched command name to the formatter”。
- **spec-first owner / 裁决：** src/cli adapter/converter/plugin/init tests；`验证意图映射后吸收`。
- **理由与验证面：** 逐条映射新增/修改/删除断言到当前 owner tests；保留负例、失败回执和 claim ceiling，不复制 CE provider 假设。

## 完整性断言

- 记录数必须为 422；F001-F422 连续且每个路径唯一。
- 全区间分类必须为 237 个实施目标文件（215 Skill Runtime + 19 CLI/转换/安装 Runtime + 3 支撑文件）+ 185 个上游证据/测试/发行支撑文件。
- 29 个 CE Skill、47 个上游脚本、81 个 tests/fixtures、24 个上游计划、32 个 Skill 用户文档、28 个解决方案知识文件均必须精确匹配 Git 原始清单。
- 任何记录不得使用目录级简写或抽样结论代替独立路径证据。
- 技术方案中的 29 个 CE Skill、35 个 spec-first Skill、47 个脚本和 19+3 个 Runtime/支撑文件必须能回链到本账本；185 个证据文件必须能回链到计划的决策、风险或验证面。
