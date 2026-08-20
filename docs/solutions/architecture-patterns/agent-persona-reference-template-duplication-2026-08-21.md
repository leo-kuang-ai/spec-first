---
title: agent/persona reference 跨 skill 模板重复（发现，未处置）
date: 2026-08-21
category: docs/solutions/architecture-patterns
module: skills/_shared
problem_type: architecture_pattern
component: development_workflow
severity: medium
status: open
applies_when:
  - "判断某个 `references/agents/*.md` 或 `references/personas/*.md` 是否该纳入 `skills/_shared/` 同步治理"
  - "新增一个跨多个 skill 复用的 sub-agent/persona 说明文件前"
  - "评估要不要给 `scripts/sync-shared-references.js` 增加参数化模板能力"
tags: [reference-duplication, agent-template, persona-template, sync-shared-references, architecture-mismatch, deferred]
---

# agent/persona reference 跨 skill 模板重复（发现，未处置）

## Context

`docs/10-prompt/spec-first代码审查方案.md` Phase 1A 检查清单第 1 项「重复消除」在 2026-08-21 用 Jaccard 行相似度扫描全部 `skills/*/references/**/*.md` 的同名文件组，发现除已被 `scripts/sync-shared-references.js` 的 `SYNC_MAP` 管理的 6 组（`html-rendering.md` 等，字节级相同）之外，还有 **11 个 agent/persona 模板家族、25 个文件、约 3536 行**，两两相似度 82%-99%：

| 文件名 | 副本数 | 所在 skill |
|---|---|---|
| `slack-researcher.md` | 3 | spec-brainstorm, spec-ideate, spec-plan |
| `learnings-researcher.md` | 4 | spec-code-review, spec-ideate, spec-optimize, spec-plan |
| `repo-research-analyst.md` | 2 | spec-optimize, spec-plan |
| `best-practices-researcher.md` | 2 | spec-compound, spec-plan |
| `data-integrity-guardian.md` | 2 | spec-compound, spec-plan |
| `framework-docs-researcher.md` | 2 | spec-compound, spec-plan |
| `pattern-recognition-specialist.md` | 2 | spec-compound, spec-plan |
| `performance-oracle.md` | 2 | spec-compound, spec-plan |
| `security-sentinel.md` | 2 | spec-compound, spec-plan |
| `web-researcher.md` | 2 | spec-ideate, spec-plan |
| `deployment-verification-agent.md`（`spec-code-review` 侧文件名为 `personas/`，其余为 `agents/`） | 2 | spec-code-review, spec-plan |

这与同一轮审查在 P2「Owner 正确性」里发现的 `model-tiers.md`（spec-sweep/spec-brainstorm，2 份，同一 commit `e9fe0769` 引入）是同一类模式，但规模大了一个量级——`model-tiers.md` 当时被判定为 architecture-mismatch、不强行合并；这次的 11 组沿用同一判断逻辑，但因为规模和影响面明显更大，单独沉淀成文档供 owner 后续决策，不在审查方案的正文里一笔带过。

## Guidance

### 1. 这 11 组的差异形状高度一致，且与偶然同名文件（真分叉）不同

抽查全部 11 组的完整 `diff`，模式几乎不变：差异精确落在文件第 7 行左右一段"invocation-specific"段落——同一个 agent persona，被不同 skill 用不同的调用语境改写第一段：

```text
learnings-researcher.md (spec-code-review 版本)：
For code-review invocations, search the full learning corpus described
below, then convert relevant findings into review context: known risks
against this diff, modules or patterns that failed before, ...

learnings-researcher.md (spec-ideate 版本)：
For ideation invocations, search the full learning corpus described
below, then convert relevant findings into idea-generation inputs:
previous attempts, reusable constraints, product or engineering pain
points, ...
```

其余段落（agent 的角色定义、能力边界、输出格式、"何时不该被调用"等）逐字相同。少数几组（`pattern-recognition-specialist.md`、`deployment-verification-agent.md`）还多一处次要差异——通常是调用方特有的一段额外指导（如 `spec-plan` 版本的 `pattern-recognition-specialist.md` 多了一段 `reuse/extend/compose/new` posture 指导）。

这与 P2 已审查过的另外 8 组"同名但独立撰写"文件（如 `cross-model-review.md`：标题从第 1 行就不同，是不同脚本背后的不同机制）**性质完全不同**——那 8 组是真分叉，不该合并；这 11 组是**同一份模板的参数化副本**，只是参数（调用语境）被直接写进正文，而不是抽成变量。

### 2. 判断"该不该纳入 `SYNC_MAP`"的标准，不是相似度，是差异段落是否"正文内容"还是"偶然噪音"

`SYNC_MAP` 现有的 6 组（`html-rendering.md` 等）是字节级 100% 相同——同步脚本只需要做 SHA-256 parity 检查，不需要理解内容语义。

这 11 组不满足这个前提：调用语境段落是**正文内容**，删掉它文件就不完整（agent 不知道该往哪个方向转换研究结果）。要把它们纳入同步治理，必须先把"共享骨架"和"调用方专属段落"拆成模板 + 变量两层，例如：

```text
skills/_shared/references/agents/learnings-researcher.template.md
  {{invocation_context_paragraph}}   <- 由调用 skill 提供
  <剩余共享正文>

skills/spec-code-review/references/personas/learnings-researcher.md  (生成产物)
skills/spec-ideate/references/agents/learnings-researcher.md          (生成产物)
skills/spec-optimize/references/agents/learnings-researcher.md        (生成产物)
skills/spec-plan/references/agents/learnings-researcher.md            (生成产物)
```

这是比现有 `sync-shared-references.js`（纯字节级 diff/copy）大得多的变更：需要设计模板语法、每个 skill 提供的变量来源（写在哪、谁维护）、以及"生成产物"和"skill 自主维护的正文"之间的边界判断。`model-tiers.md` 已经确认了同样的判断——2 份文件就足以判定为 architecture-mismatch；这次 11 组、25 个文件的规模只是让这个判断的收益更明显，但**没有改变判断本身需要先设计参数化机制这一前提**。

### 3. 在没有参数化机制之前，不要用手动同步或强行合并处理

对这类文件，以下两种"看起来更懒"的处理方式都应避免：

- **手动同步共享段落，保留调用语境段落**：脆弱，容易漏改；且没有测试保护，drift 会无声发生（这正是 `skills/_shared/README.md` 此前把这类文件误判为"需要人工合并的漂移"的根源——手动同步的心智模型天然会把这类文件也当作候选）。
- **删掉某几份、只留一份、让其他 skill 引用它**：违反 `skills/_shared/README.md` §Why Not Symlinks or Cross-Skill Paths 已经确立的边界——skill 需要能独立分发（`skills-lock.json` 支持外部 skill 单独安装），跨 skill 相对路径引用会在单独分发时断裂。

### 4. 何时值得投入设计参数化机制

只有满足以下条件时，才值得把"文本级同步"升级为"模板+变量"机制：

1. 这 11 组（或类似的未来新增组）里，共享骨架部分确实需要频繁修订（如 agent 能力定义变化、输出格式统一调整）；
2. 手动维护已经产生过至少一次真实 drift 事故（分析该 agent 的某个能力描述在一份副本里更新了，另一份没跟上，导致行为不一致）；
3. 有明确的 owner 愿意维护这个模板机制本身（模板语法、变量校验、生成脚本都需要长期维护）。

在这三个条件都不成立之前，**当前状态（25 个文件手动独立维护）是可以接受的**——不理想，但没有证据显示它正在制造真实的功能性问题。这是 §3.8 意义上的"结构诊断"，不是"已证明的收益缺口"。

## Why This Matters

- 这次发现印证了 §3.5「删除优先」和 §3.3「复用优先」两条 Ponytail 原则在实践中的边界：**看到高相似度不能直接跳到"应该合并"**，必须先确认差异部分是偶然噪音还是正文内容。11 组里如果不核查 diff 内容，很容易被"3536 行、25 个文件"的规模数字误导，直接建议删除/合并，而实际上每份文件的调用语境段落都在真实履行职责。
- 这也是"零门测花费的人工审查能发现真实架构问题"的一个例子——不需要跑模型，只需要系统性 diff + 抽样验证，就能定位一类此前完全没被 `skills/_shared/README.md` 追踪的重复。
- 同时也是"不擅自实施"边界的示范：发现规模不小的重复后，正确动作是记录清楚判断依据、量化影响、给出何时该处理的条件，而不是因为"顺手就能改"而直接动手——这类改动涉及 6 个 skill、25 个文件，且需要先设计模板机制，风险和工作量远超"人工审查"这个动作本身被授权的范围。

## When to Apply

- 新增一个会被多个 skill 复用的 agent/persona reference 文件时，先检查 `skills/*/references/{agents,personas}/` 下是否已有同名或高相似度文件，避免制造第 12 组。
- 修改本文档列出的任意一组文件时，记得同步检查其他副本是否也该跟进（当前无自动化保护，drift 检测依赖人工重跑本文档描述的扫描方法）。
- 决定是否要给 `scripts/sync-shared-references.js` 增加参数化模板能力时，先确认上面"3. 何时值得投入"的三个条件是否成立。
- 下一轮代码审查复跑本类扫描时，直接复用本文档列出的检测方法（Jaccard 行相似度 + 抽样 diff），不用重新设计。

## Examples

检测方法（可复跑，零 API 花费）：

```javascript
// 对 skills/*/references/**/*.md 按 basename 分组，
// 组内两两算 Jaccard 行相似度（trim 后的非空行集合交集/并集），
// min pairwise similarity > 0.7 视为候选模板家族。
// 完整脚本见 spec-first代码审查方案.md Phase 1A 检查清单第 1 项的审查记录。
```

判断流程：

```text
发现同名文件组
  -> 读首行标题，标题不同 -> 大概率真分叉，逐份读 diff 确认
  -> 标题相同 -> 读完整 diff
     -> 差异集中在 1-2 段、其余逐字相同 -> 模板家族候选
        -> 差异段落是"调用语境"这类正文内容 -> architecture-mismatch，
           需要参数化机制才能安全同步，记录发现，不擅自合并
        -> 差异段落是可以安全统一的措辞/格式问题 -> 可以走 SYNC_MAP 常规流程
```

## Related

- `skills/_shared/README.md` — 现有 `SYNC_MAP` 管理的 6 组字节级相同 reference，及本次审查修正过的"8 组已知漂移"清单（那 8 组是真分叉，不是本文档描述的模板家族）
- `scripts/sync-shared-references.js` — 当前只支持字节级 SHA-256 parity 同步，不支持参数化模板
- `docs/10-prompt/spec-first代码审查方案.md` Phase 1A 检查清单第 1 项、P2「Owner 正确性」（`model-tiers.md` 的同类先例判断）
- `docs/solutions/architecture-patterns/rebar-structure-skill-simplification-pattern-2026-06-04.md` — "先找承重轴，不先删文件"的通用方法论，本文档第 2 节的判断逻辑与其"边界迁到哪了"的检验方式一致
- `docs/solutions/architecture-patterns/npm-skill-template-ownership.md` — 判断资产该放 skill 还是共享层的相邻方法论
