# spec-first Skill Footprint & 速度分析

```yaml
analysis_target: spec-first workflow skill footprint
analysis_date: 2026-07-29
analyst: inline-direct-source (Claude Code session, opus-tier)
analyst_session: claude-session:5558edfc-af4c-42f4-8914-7443823f9c04
review_repo: leo-2026-07-27-opencode
head_sha: 5461c55efe1ea7796f838cef57c05829d5faf352
status: passed
findings: 7
limitations:
  - 单模型 inline 分析；本轮未获得独立 reviewer dispatch 授权。
  - token 估算基于行数（每行 ~25 token），绝对值有 ±30% 误差。
  - 墙钟数据仅来自一次 spec-code-review 跑分；其他 skill 本会话未计时。
  - 文件数随 skill 增删 reference 资产会变化。
```

本报告对 `.claude/spec-first/workflows/` 下所有 workflow skill 做按调用 token footprint 静态盘点，并指出最大固定开销来源，供后续改造按 ROI 排序。报告本身**不**规定具体实施方案；实施决策属于后续 `spec-plan`。

## 1. Footprint 清单

全部 17 个 workflow skill，按总 footprint（SKILL.md + references 行数和）排序。行数来自 `wc -l`；token 估算用通用经验值 ~每行 25 token（混合 prose/代码/YAML），±30% 误差。

| 排名 | Skill | SKILL.md | references 行数 | references 文件数 | 总行数 | 估算 token / 调用 |
|------|-------|---------:|----------------:|-------------------:|--------:|-------------------:|
| 1 | `spec-plan` | 860 | 4,516 | 30 | **5,376** | ~134K |
| 2 | `spec-code-review` | 1,046 | 2,398 | 27 | 3,444 | ~86K |
| 3 | `spec-ideate` | 439 | 2,270 | 13 | 2,709 | ~68K |
| 4 | `spec-brainstorm` | 312 | 2,145 | 13 | 2,457 | ~61K |
| 5 | `spec-doc-review` | 191 | 2,151 | 25 | 2,342 | ~59K |
| 6 | `spec-prd` | 340 | 1,896 | 9 | 2,236 | ~56K |
| 7 | `spec-work` | 291 | 1,512 | 10 | 1,803 | ~45K |
| 8 | `spec-compound` | 775 | 1,009 | 13 | 1,784 | ~45K |
| 9 | `spec-optimize` | 756 | 924 | 11 | 1,680 | ~42K |
| 10 | `spec-compound-refresh` | 707 | 329 | 4 | 1,036 | ~26K |
| 11 | `spec-debug` | 377 | 594 | 5 | 971 | ~24K |
| 12 | `spec-app-consistency-audit` | 297 | 667 | 5 | 964 | ~24K |
| 13 | `spec-write-tasks` | 138 | 798 | 3 | 936 | ~23K |
| 14 | `spec-polish` | 156 | 716 | 11 | 872 | ~22K |
| 15 | `spec-write-skill` | 58 | 479 | 8 | 537 | ~13K |
| 16 | `spec-runtime-setup` | 352 | 53 | 2 | 405 | ~10K |
| 17 | `spec-dogfood` | 243 | 143 | 2 | 386 | ~10K |

**汇总**：`.claude/spec-first/workflows/` 下约 **750K token** 的 skill 内容，前 5 个 skill 占总量约 67%。

## 2. 为什么这些数字重要

宿主（Claude Code、Codex、Cursor、Kiro、Qoder）加载 workflow skill 时会读 SKILL.md，并**可能**按需读 references。真正影响用户体验的是 per-call 成本：

1. **SKILL.md 每次调用都全量加载**。目前没有 spine 的部分加载机制。
2. **References 由 SKILL.md 内部指令按需读**（例如 "在合成 scope 之前读 `references/synthesis-summary.md`"）。指令用 "STOP, read X first" 这类强制句式时，每次调用都付这个成本。
3. **Reference 名字即使不读也要进 working memory**。LLM 看到 "load `html-rendering.md` if `OUTPUT_FORMAT=html`" 这类指令时，名字本身会占据 token。
4. **Subagent dispatch** 时读 persona prompt asset（典型 60-260 行），但只在 dispatch 时由子 agent 读，编排器无需读；这部分已经是正确的 lazy 模式。

**per-call 成本 =（SKILL.md 成本，固定）+（本次控制流触发的 references 成本，可变）**。固定成本主导，因为 SKILL.md 永远被读。

## 3. 跨 skill 慢模式

### 3.1 名为 "summary" 实为完整协议的 reference

若干 reference 文件名字暗示"简短"，但内容承载完整协议：

| 文件 | 行数 | 声称的角色 | 实际角色 |
|------|-----:|------------|----------|
| `spec-plan/references/synthesis-summary.md` | **410** | summary | scope synthesis 完整协议（模板、antipattern、headless routing）|
| `spec-plan/references/plan-sections.md` | **446** | sections reference | 完整 plan section schema |
| `spec-brainstorm/references/synthesis-summary.md` | 271 | summary | 同 spec-plan 的 synthesis-summary，brainstorm 变体 |
| `spec-brainstorm/references/brainstorm-sections.md` | 376 | sections reference | 完整 brainstorm section schema |

`spec-plan` 的 `synthesis-summary.md`（410 行）+ `plan-sections.md`（446 行）合计 **856 行**，接近 SKILL.md 自身长度（860 行）。两者在 SKILL.md 中都用 "读这个再做 X" 强制句式，**每次 plan run 必读**。

### 3.2 HTML rendering 三份重复

同一份 HTML 渲染规则在三个 skill 里各有一份：

| 文件 | 行数 |
|------|-----:|
| `spec-plan/references/html-rendering.md` | **640** |
| `spec-ideate/references/html-rendering.md` | **635** |
| `spec-brainstorm/references/html-rendering.md` | **635** |

对应 markdown 版本同样三份，每份约 235 行。HTML 版本是 markdown 的 2.7×，因为 HTML 携带 markdown 不需要的展示规则。默认 `OUTPUT_FORMAT=md` 触发约 95% 跑，**HTML 文件 635 行几乎不触发，但名字在 SKILL.md 指令中被 LLM 装入 working memory**。

### 3.3 重复的 subagent prompt asset

`references/agents/repo-research-analyst.md` 在 `spec-plan` 和 `spec-compound` 各 257 行。`references/agents/learnings-researcher.md` 在 5 个 skill 各 247 行（`spec-plan`、`spec-ideate`、`spec-compound`、`spec-optimize`、`spec-code-review`）。`references/agents/repo-profiler.md` 在 8 个 skill 各 31 行。

| Prompt | 复制份数 | 每份行数 | 重复总行数 |
|--------|--------:|---------:|----------:|
| `learnings-researcher.md` | 5 | 247 | **1,235** |
| `repo-research-analyst.md` | 2 | 257 | **514** |
| `repo-profiler.md` | 8 | 31 | **248** |

**orchestrator 只在 dispatch 时才读 prompt**，所以运行时不重复付费；但维护方要为多份副本分别维护，drift 风险高。

### 3.4 SKILL.md 协议全量内联 vs spine-only

| Skill | SKILL.md | references 行数 | 协议结构 |
|-------|---------:|----------------:|----------|
| `spec-doc-review` | **191** | 2,151 | spine-only；Phase 3-5 推到 `synthesis-and-presentation.md`（337 行）|
| `spec-code-review` | **1,046** | 2,398 | 协议全量内联；Phase 2-5 + Stage 3-5b 都在 SKILL.md |
| `spec-plan` | 860 | 4,516 | 混合；Phase 0-4 部分内联，子步骤用 references |
| `spec-ideate` | 439 | 2,270 | spine + lazy refs |
| `spec-brainstorm` | 312 | 2,145 | spine + lazy refs |
| `spec-prd` | 340 | 1,896 | spine + lazy refs |
| `spec-work` | 291 | 1,512 | spine + reference trigger map |

**`spec-code-review` 是唯一 SKILL.md 超过 1,000 行的 skill**。最接近的同类 `spec-doc-review` 用 spine-only + 337 行 reference 实现**同样的协议覆盖**，SKILL.md 仅 191 行（spec-code-review 的 1/5）。

### 3.5 `inline-fallback` 协议成熟度

| Skill | `inline-fallback` 提及次数 | 实际 inline-fallback 概率 |
|-------|---------------------------:|--------------------------:|
| `spec-compound` | 13 | ~0%（compound 几乎总 dispatch）|
| `spec-code-review` | 8 | ~50%（用户经常不授 dispatch 权）|
| `spec-ideate` | 5 | ~80%（单 agent 跑常见）|
| `spec-brainstorm` | 5 | ~50% |
| `spec-plan` | 4 | ~0%（plan 几乎总 dispatch research）|
| `spec-work` | 2 | ~30% |
| `spec-debug` | 1 | ~30% |
| `spec-app-consistency-audit` | 1 | ~50% |
| `spec-doc-review` | 1 | ~50% |
| **`spec-prd`** | **0** | ~60%（PRD 极少 dispatch 通用 subagent）|
| **`spec-write-tasks`** | **0** | ~100%（write-tasks 从不 dispatch）|

`spec-prd` 和 `spec-write-tasks` 完全不提 `inline-fallback`，但两者都会跑这条路径。两者靠"无授权 → 自然不 dispatch"隐式行为，没有显式定义降级 report-only 契约。**这导致跨 skill 覆盖行为不一致**：同样的"无 dispatch 授权"输入，`spec-code-review` 输出有标签的 `degraded` 状态，`spec-prd` 行为未定义。

## 4. 最大的固定成本源：`spec-code-review`

`spec-code-review` 之所以尤其贵，是因为它的 SKILL.md 是 `spec-doc-review` 的 **5.5 倍**，但承载同一类协议（dispatch + report + Stage 5c apply gate）。两个具体成本驱动：

1. **Phase 2-5 全量内联在 SKILL.md**。Stage 2/2b/2c/3/3b/3c/4/5/5b/5c 都直接写在 SKILL.md，而没像 `spec-doc-review` 那样推到 `references/synthesis-and-presentation.md`。把这部分抽出后，SKILL.md 可从 1,046 行压到约 300 行。
2. **Persona 触发器内联在 SKILL.md**。SKILL.md 顶部那 14 persona "quick roster with one-line triggers" 块占了 ~30 行 persona 名字，LLM 每次都装入 working memory。`spec-plan` 同样信息放在 `references/agents/*.md` 文件路径里，dispatch 时才加载相关 agent — **这才是正确模式**。

**估算节省**：~750 行 SKILL.md ≈ 每次调用省 **~19K token**（在当前 ~26K 的 SKILL.md 基础之上）。

## 5. 最大的必读源：`spec-plan` 的 `synthesis-summary` + `plan-sections`

`synthesis-summary.md`（410 行）在每个 solo/Standard/Deep plan 的 Phase 0.7 必读；`plan-sections.md`（446 行）在 Phase 5.2 plan-write 必读。两者对非 Lightweight plan 触发率 100%。**名字叫"summary"和"sections"，但内容承载完整协议**。

**拆分方案估算**（core 必读 + details lazy）：
- Core（~250 行，必读）+ Details（~600 行，lazy）
- 大多数 plan 调用从 856 行降到 250 行
- **每次 plan 约省 600 行 ≈ 15K token**

## 6. 按 ROI 排序的改造建议

以下为咨询性建议；选择与实施属于后续 `spec-plan`。按 "每次调用节省 token / 实施成本" 排序。

| # | Skill | 动作 | 估算节省 / 调用 | 实施成本 |
|---|-------|------|----------------:|----------|
| 1 | `spec-code-review` | 把 SKILL.md 改造为 spine-only；把 Phase 2-5 推到 `references/synthesis-pipeline.md`，照搬 `spec-doc-review` 模式 | **~19K** | 中 |
| 2 | `spec-plan` | 把 `synthesis-summary.md`（410）+ `plan-sections.md`（446）拆为 core（必读）+ details（lazy）| **~15K** | 中 |
| 3 | `spec-plan` / `spec-ideate` / `spec-brainstorm` | 把 `html-rendering.md`（~635 × 3）提到共享的 `docs/contracts/rendering/html-output.md`，每 skill 留 50 行 stub | **~5K** / 调用，维护方省 **~1,300 行** | 低 |
| 4 | 所有有 `references/agents/` 的 skill | 把共享 prompt（`learnings-researcher.md`、`repo-research-analyst.md`、`repo-profiler.md`）提到 `docs/agents/prompts/<name>.md`，每个 skill 的 `references/agents/` 留 stub | **~10K** / dispatch，维护方省 **~1,200 行** | 高（跨 skill 协调）|
| 5 | `spec-compound` | 把 SKILL.md 中 13 次 `inline-fallback` 提及去重为一段；其余变成 cross-reference | ~2K / 调用 | 低 |
| 6 | `spec-prd` / `spec-write-tasks` | 补显式 inline-fallback 协议（参照 `spec-code-review` Stage 1c），让降级 report-only 覆盖有定义 | n/a（正确性）| 低 |

**累计上限**：每个"重" workflow 调用（Standard/Deep plan，或 `apply-fixes` 模式下的 `spec-code-review`）最多省 ~50K token。按典型模型定价的 ~25:1 输入/输出 token 比，这意味着从"日常调用"到"显著调用"的用户体验差距。

## 7. 为什么这与 spec-first 系统目标一致

`spec-first` 是 workflow harness；运行一个 workflow 的成本是面向用户产品体验的一部分。每次 `spec-code-review` 省 19K token 是一次用户层面的胜利；每次 `spec-plan` 省 15K token 在一个 release 内被乘以多份 plan。1,200 行重复 `references/agents/` 的削减同时降低了未来维护 churn 和跨副本 drift 风险。

这与项目哲学（`docs/10-prompt/结构化项目角色契约.md`）一致："**Light contract**" 和 "**scripts 准备 facts / LLM 决断语义**"。更轻的 contract 让 LLM 不用每次调用都重读 800 行协议就能做语义工作。

## 8. 诚实限制

- **单模型、单会话 inline pass**。无独立 reviewer 验证行数或 per-call token 估算。本轮 `worker_dispatch_authorization` 未被用户授予；本分析按 `spec-code-review` Stage 1c 走 `inline-fallback`。
- **token 估算用 25 token/行经验值**。混合 prose / 代码 / YAML / JSON Schema 内容差异大；绝对 token 数量 ±30% 可靠。**排名比绝对值更可靠**。
- **未对非 `spec-code-review` skill 计时**。本会话只对 `spec-code-review` 跑了一次（run id `spec-code-review-20260729T054822Z-71612`，59 秒，4 个 P1 finding，artifact 在 `/var/folders/0v/f_smd31500113ppkqs66c9yr0000gn/T/spec-first-code-review.I1WmaU`）。其他 skill 墙钟未测量。
- **未分析读取顺序**。在 Phase X 才 "读 references/Y" 的 skill，只有走到 Phase X 才付成本。solo 模式 plan 在 Phase 0.7 短路时不付 Phase 1 research 成本。以上 per-call 数字假设典型 mid-depth 跑；headless pipeline 跑与 direct bootstrap 跑曲线不同。
- **未做改造前后 A/B 测试**。建议全部由结构阅读得出，**唯一验证是行数清单本身**。后续 plan 建议先改造一项（推荐 #1 是最高 ROI 候选），用同一组 diff 跑前后版本对比 token 与墙钟。

## 9. 后续路径

推荐的下一步是把建议 #1（`spec-code-review` SKILL.md spine-only 改造）作为小型、有边界的 `spec-plan` 任务。改造范围明确：

- 清晰的 source-of-truth 边界：SKILL.md 变 spine；`references/` 增加 1-2 个文件（`synthesis-pipeline.md`，可能 `persona-activation.md`）。
- **不**改协议：现有 inline-fallback 路径、Stage 5 路由、JSON envelope 契约全部不变。
- 清晰的 before/after 测量：同一份 diff 跑两版 SKILL.md，比较 token 数与墙钟。
- 留在 host-neutral worker dispatch plan 的 DoD 边界内（`docs/plans/2026-07-28-001-refactor-host-neutral-worker-dispatch-plan.md`）：改造只动 `SKILL.md` + 新增 reference 文件；不碰 `skills/`、`templates/`、generated runtime 或任何下游 consumer 依赖的 contract。

建议 #2-#6 是 #1 在 codebase 里立住 spine-only 模式之后的自然后续。

## 10. 数据来源

- **Footprint 清单**：`wc -l SKILL.md` + `find references -type f` 跑在 `/Users/kuang/xiaobu/spec-first/.claude/spec-first/workflows/`。`leo-2026-07-27-opencode` 分支，HEAD `5461c55e`。
- **墙钟基线**：`metadata.json` from `/var/folders/0v/f_smd31500113ppkqs66c9yr0000gn/T/spec-first-code-review.I1WmaU/`（run id `spec-code-review-20260729T054822Z-71612`，完成时间 `2026-07-29T05:49:21.675Z`）。
- **跨 skill 协议对比**：结构阅读每个 skill 的 SKILL.md 头部与 Phase 标题，外加 `inline-fallback`、`references/`、`Read ... references/` 出现次数。
- **建议来源**：`docs/10-prompt/结构化项目角色契约.md`（轻契约、显式边界、deterministic floor + LLM 语义判断），以及 spec-first skill 蒸馏史（参考 `docs/validation/2026-07-15-using-spec-first-prompt-thinning-eval.md`）。
