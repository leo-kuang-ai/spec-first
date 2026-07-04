# using-spec-first bootstrap baseline 与压缩判定

> 日期：2026-07-05
> Producer：Codex `spec-work`
> Authority level：degraded semantic review gate
> Freshness：current worktree source reads and generated proxy stats
> Source plan：`docs/plans/2026-07-04-using-spec-first-init-guidance-optimization.md`

## 范围

本 artifact 覆盖计划 Step 0：在压缩 `CLAUDE.md` / `AGENTS.md` managed bootstrap 前，先验证 L0-only 与 L1-routed 的治理边界、收益信号和 no-go 条件。

它不是 deterministic eval runner 输出。当前没有独立可复跑 runner；判定来自当前 source direct reads、生成器 proxy stats、eval fixture 扩展和语义审查。下游不得把本文件当作硬 gate 证明。

## 输入版本

- `src/cli/instruction-bootstrap.js`
- `skills/using-spec-first/SKILL.md`
- `skills/using-spec-first/evals/routing-cases.json`
- `skills/using-spec-first/evals/routing-discipline-cases.json`
- `tests/unit/instruction-bootstrap.test.js`
- `tests/unit/context-governance-contracts.test.js`
- `tests/unit/using-spec-first-contracts.test.js`
- `docs/contracts/context-governance.md`
- `docs/10-prompt/结构化项目角色契约.md`

## Proxy Stats

压缩前 confirmed stats（实施前生成器输出）：

| host | lang | bullets | lines | chars |
| --- | --- | ---: | ---: | ---: |
| claude | zh | 14 | 19 | 2848 |
| claude | en | 14 | 19 | 4729 |
| codex | zh | 16 | 20 | 3292 |
| codex | en | 16 | 20 | 5405 |
| cursor | zh | 14 | 19 | 2887 |
| cursor | en | 14 | 19 | 4782 |
| qoder | zh | 14 | 19 | 2868 |
| qoder | en | 14 | 19 | 4782 |

压缩后 proxy stats（实施后生成器输出）：

| host | lang | bullets | lines | chars | positive L0 workflow ids |
| --- | --- | ---: | ---: | ---: | --- |
| claude | zh | 14 | 19 | 2462 | `mcp-setup`, `debug`, `code-review`, `doc-review`, `brainstorm`, `prd`, `plan`, `work` |
| claude | en | 14 | 19 | 4319 | same |
| codex | zh | 16 | 20 | 2906 | same plus anti-pattern text contains `spec-using-spec-first`, excluded from workflow id counting |
| codex | en | 16 | 20 | 4995 | same plus anti-pattern text contains `spec-using-spec-first`, excluded from workflow id counting |
| cursor | zh | 14 | 19 | 2501 | same plus anti-pattern text contains `spec-using-spec-first`, excluded from workflow id counting |
| cursor | en | 14 | 19 | 4372 | same plus anti-pattern text contains `spec-using-spec-first`, excluded from workflow id counting |
| qoder | zh | 14 | 19 | 2482 | same |
| qoder | en | 14 | 19 | 4372 | same |

体积收益信号：常驻块不再展示 `ideate` / `optimize` / `compound` / `compound-refresh` 等完整入口菜单，也不再逐字列出 generated mirror denylist 长路径。chars 下降约 386-410（非 Codex/English）与 386（Codex zh）到 410（Codex en）级别；不声称精确 token 节省。

## L0-Only Case Results

| case_id | expected | actual | verdict | evidence | limitations |
| --- | --- | --- | --- | --- | --- |
| route-vs-direct-lightweight | 轻量事实、当前上下文解释、窄查询、用户单文档摘要不触发 workflow | bootstrap 与 description 明确列出这些 direct 场景 | pass | `instruction-bootstrap.js`, `SKILL.md`, `routing-cases.json` | semantic review only |
| correct-repo-before-write | 父级多仓写入/测试/changelog/commit 前要求 `target_repo` | L0 保留 `target_repo` 短锚点 | pass | `instruction-bootstrap.js` | 未跑多仓行为 runner |
| generated-mirror-default-exclusion | 默认不读 generated mirrors，长路径列表由 contract owner 承载 | L0 保留 `.spec-first/audits/**`、`.spec-first/governance/**`、generated mirrors 和 `context-governance.md` 指针 | pass | `instruction-bootstrap.js`, `context-governance-contracts.test.js` | 未验证所有 host runtime loader |
| language-precedence | 会话惯性不得覆盖 `spec-first:lang` | L0 保留 language block precedence | pass | `instruction-bootstrap.js`, `AGENTS.md` instruction context | semantic review only |
| external-issue-pr | issue/PR 不是专用 workflow，不执行 reporter command as confirmed truth | L0 保留外部 issue/PR 输入边界 | pass | `instruction-bootstrap.js`, `SKILL.md` | semantic review only |
| role-contract-pointer | 架构/prompt/workflow/contract/source-runtime 判断前读取角色契约 | L0 保留短指针 | pass | `instruction-bootstrap.js`, `docs/10-prompt/结构化项目角色契约.md` | semantic review only |
| internal-helper-not-public | 不暴露 internal-only helpers | L0 保留 `git-worktree` anti-pattern | pass | `instruction-bootstrap.js`, `routing-discipline-cases.json` | semantic review only |

## L1-Routed Case Results

| case_id | expected | actual | verdict | evidence | limitations |
| --- | --- | --- | --- | --- | --- |
| full-route-map-available | 完整 Route Map 留在 SKILL 层，包括 non-L0 workflow | pass | `SKILL.md` Route Map 仍包含 `spec-ideate`, `spec-optimize`, `spec-compound`, `spec-write-tasks` 等 | `using-spec-first` runtime transform 未在本 artifact 中执行 |
| guide-mode-single-recommendation | “不知道下一步”给单一推荐、理由、动作，不启动 workflow | pass | `SKILL.md` User Next-Step Guide Mode 与新增 eval cases | semantic review only |
| codex-dispatch-boundary | Codex public workflow admission 不自动授权 `spawn_agent` | pass | `SKILL.md`, Codex bootstrap codex-only 行，existing/new tests | 未实际 dispatch subagent |
| external-input-routing | issue/PR 按失败/WHAT/review/work 意图路由 | pass | `SKILL.md` External Issue / PR Inputs 与 L0 短锚点 | semantic review only |

## Sink / Drop Falsification Matrix

| item | failure hypothesis without skill loaded | replacement L0 anchor | rollback cost | decision |
| --- | --- | --- | --- | --- |
| 完整入口枚举 | 用户看到完整菜单后误以为所有 entrypoint 都应常驻或按关键词选择 | 保留 setup/debug/review/definition/plan-work 最小锚点，并指向 SKILL 完整 map | 低：恢复一行生成器 prose 与测试 allowlist | sink |
| generated mirror 长路径列表 | agent 默认扫 `.claude/**` / `.codex/**` 等 generated runtime | 保留 `.spec-first/audits/**`、`.spec-first/governance/**`、generated mirrors、`context-governance.md` owner 指针 | 中：可恢复长列表，但会重新增加上下文税 | sink |
| `ideate` / `optimize` / `compound` L0 identifier | 低频入口在未加载 SKILL 时不可见 | WHAT 不清、计划/执行和完整 map 指针覆盖高频判定；低频入口由 L1 Route Map 负责 | 低：allowlist 加回对应 ids | sink |
| 角色契约短指针 | 架构/source-runtime 判断被误判轻量而绕过角色契约 | 保留短指针 | 高：绕过仓库强制基线 | keep |
| 外部 issue/PR 边界 | agent 造专用 workflow/tracker 状态或执行 reporter command | 保留短锚点 | 中 | keep |

## Go / No-Go

结论：go，执行受控压缩。

理由：

- L0-only P0/P1 governance case 均有短锚点保留，未把角色契约、语言、target_repo、external issue/PR、generated mirror exclusion 下沉到只有 SKILL 加载后才可见的位置。
- L1-routed 完整 Route Map 仍由 `SKILL.md` 承载，bootstrap 测试改为 L0 allowlist，不再把完整菜单复制到常驻块。
- 用户/agent 行为改善信号明确：常驻块减少低频入口菜单和长路径枚举，init 后默认可见内容更集中；“不知道下一步”类问题由 guide-mode eval 覆盖，不再靠 bootstrap 菜单兜底。

## 必须保持的成功判据

- `buildBootstrapBlock` 的 positive workflow ids 必须是 L0 allowlist 子集，不得重新复制完整 Route Map。
- `docs/contracts/context-governance.md` 继续拥有完整 runtime exclusion denylist。
- `CLAUDE.md` / `AGENTS.md` checked-in managed blocks 必须由 `spec-first init` 同步生成。
- 相关 Jest contracts 与 `git diff --check` 必须通过。
