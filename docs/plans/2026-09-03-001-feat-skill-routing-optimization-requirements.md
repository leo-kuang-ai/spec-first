---
title: "spec-first skill 入口路由与边界优化需求（测评驱动）"
type: feature
status: draft
date: 2026-09-03
spec_id: 2026-09-03-skill-routing-optimization
sources:
  - "docs/validation/skill-evals/2026-09-02-entry-routing-and-static-audit.md（三引擎路由测评 + 静态体检 + §8 优化验收）"
  - "docs/validation/skill-evals/routing-audit-20260902/（22 用例 runner + 330 份原始输出）"
  - "docs/validation/skill-evals/results.tsv（三轮行为回归台账）"
  - "benchmarks/agentic/REPORT-20260820-sonnet5-saturation.md（行为门饱和基线）"
upstream_commits:
  - "01fad369（已落地的 P0/P1 第一批优化）"
---

> 本需求文档从 2026-09-02~03 的独立专项测评结论中提炼**尚未完成**的优化需求。已完成项仅作背景记录，不重复立项。
> 测评方法与全部数据见 `sources`；本文只回答"要做什么、为什么、怎么验收"。

## 1. 背景与问题定义

### 1.1 测评结论摘要（问题的事实基础）

三引擎（codex gpt-5.6-sol / claude 默认映射 glm-5.3 / claude-sonnet-5）× 22 条路由用例 × 3 重复，共 198+132 次真实会话调用：

| 失败形态 | 引擎 | Before | 根因 |
|---|---|---|---|
| F1 族内混淆（选错兄弟入口） | glm-5.3 | 90.9%（pr-feedback→work 0/3） | 注入锚点表相对 public-route-map 存在覆盖差 |
| F2 capability bypass（绕过 workflow 走 direct） | sonnet-5 | 71.2%（13 次→direct） | 判断式 Fast Path 标准在强模型处被宽解释 |
| F3 ideate/brainstorm 双向失守 | 两者方向相反 | 双 0/3 | definition 组无判别句，模型先验不可依赖 |
| F4 点名失效（fix-intent/lfg 稀释） | codex/sonnet 散发 | 2/3、2/3 | "需显式点名"入口在无锚点提示时被稀释 |

第一批优化（`01fad369`，已入库）已消解 F1/F2/F3 的主路径：glm-5.3 90.9%→95.5%、sonnet-5 71.2%→89.4%，定向误路由族全部清零。

### 1.2 残余问题（本需求要解决的）

1. **散发边界噪声**：验收后仍余 7 次散发误路由（各 1/3），集中在 optimize↔debug、work↔plan、compound 家族三处邻界。
2. **fix-intent 收编的顽固模式未被系统性解决**：R2 行为测评已证"文本层双层修复无效"，路由层硬规则只覆盖了带失败信号的子集；三引擎 `p-fixintent` 基线 2/3~3/3，仍非满分。
3. **行为回归无干净窗口**：18 用例三轮结果 8/18→0/10(隔离)→6/18，失败集逐轮漂移，网关降级期间任何判定都不可信。
4. **路由回归未资产化进 CI**：`run_routing.py` 是手工脚本，锚点/路由相关改动尚无自动回归门。

## 2. 需求清单

### R1 fix-intent 上游路由（P0，R2 遗留第一优先级）

- **问题**：用户请求包含修复动词（"修一下/fix/handle"）+ 缺陷对象时，模型在路由层判为 direct（绕过治理门），或在错误 skill 内直接执行修复（R2 收编模式）。锚点硬规则仅覆盖"失败信号存在"的子集；无报错输出、仅口头描述缺陷的场景未覆盖。
- **需求**：在 `using-spec-first` 的 Route Selection 前增加 fix-intent 识别前置检查：命中（修复动词 ∧ 缺陷对象）时强制路由 `spec-debug`，并输出一行依据。
- **实现位置**：`skills/using-spec-first/SKILL.md`（Route Selection 节）+ `references/public-route-map.md`（On-Ramps 节补显式条目）。
- **不做**：不在各下游 skill 内重复该检查（上游一次识别，下游只兜底）。
- **验收**：`p-fixintent` 用例三引擎 3/3；新增 3 条变体（无报错仅口头描述、中文口语"帮我看看"、英文 "handle this broken X"）双引擎全对；现有 22 用例无回归（尤其 D 组 12/12 保持）。
- **基线**：p-fixintent before = glm 3/3、codex 2/3、sonnet-5 2/3（错误形态均为 direct 绕过）。

### R2 邻界判别句补全（P1，散发噪声收尾）

- **问题**：三对邻界的散发误路由（各 1/3，非系统性）：
  - optimize↔debug：`n-optimize`（"800ms 压到 200ms 的可度量实验"）偶被判 spec-debug；
  - work↔plan：`p-work`（执行已定计划）偶被判 spec-plan；
  - compound 家族：`p-compound`（沉淀已验证经验）偶被判 spec-rule-miner / spec-promote。
- **需求**：在 `public-route-map.md` 对应节点补一句判别（不是修改 skill description，避免与"路由主责归路由器"的分层冲突）：
  - 量化指标驱动的实验→optimize；失败定位→debug（判别轴：目标是"度量改进"还是"根因"）；
  - 计划已定要执行→work；HOW 未定→plan（判别轴：settled 状态）；
  - 验证过的经验沉淀→compound；从代码挖惯例→rule-miner；上线宣传文案→promote。
- **验收**：上述 5 个用例双引擎 3/3；22 用例总准确率双引擎 ≥95%。
- **基线**：sonnet-5 after 验收中 7 次散发的具体分布见 `rescored-before-after.json`。

### R3 路由回归纳入 CI 门（P1，防退化）

- **问题**：锚点块（lang-policy.js）、route-map、description 的任何改动都可能引入新误路由，当前无自动防护。
- **需求**：
  - 将 `routing-audit-20260902/run_routing.py` 的 22 用例集提为仓库级回归资产（移入 `benchmarks/routing/` 或等效位置），支持 `--engines claude` 单引擎最低配置；
  - CI 提供降级模式：引擎不可用时标记 `skipped(env)` 而非 fail（网关不稳定是常态，见 §1.2-3）；
  - 触发条件：`lang-policy.js`、`skills/using-spec-first/**`、`skills/*/SKILL.md` 的 frontmatter description 变更时。
- **验收**：模拟一次 description 破坏性变更（如删掉 spec-debug 的 Not-for 句），CI 能在 D/P 组用例上捕获回退。

### R4 行为回归干净窗口重跑（P0 的收口条件，阻塞项为环境）

- **问题**：4 个 description 编辑 skill（debug/simplify-code/work/test-browser）的行为回归因网关降级无法得到可信判定（三轮 8/18→0/10→6/18，失败集漂移 + transcript 证实 skill 已进上下文）。
- **需求**：网关稳定窗口（预检连续 2 次 PONG + 首个用例通过）内重跑 18 用例；全绿则 4 处 description 从 keep 挂起转正，仍失败则按用例归因（此时才有可信数据）。
- **验收**：18/18 全绿，或对残余失败给出非环境归因的证据链（transcript + 复现 ≥2/3 稳定）。
- **命令**：见报告 §8.3；codex 引擎补跑（before 98.5%）在 GPT 通道恢复后一并执行。

### R5 "入口合规率"列入验证口径（P2，方法论沉淀）

- **问题**：8/20 行为门证明任务正确率已饱和（baseline 20/20），F2 证明"做对了但没走门"是正确率指标的天生盲区。
- **需求**：在 skill 变更验证口径（`spec-write-skill` 的 eval 指引或 validation 模板）中，把"入口合规率"（正确路由 + 不绕门）与任务正确率并列为一等指标；routing 用例集作为其标准量具。
- **验收**：`docs/validation/skill-evals/_template.md` 或 spec-write-skill 参考中加入该指标条目。

## 3. 非目标（明确不做）

- **不重跑行为门**（根因修复/代码复用等 4 维已饱和，预算转向路由回归）。
- **不给 37 个 skill 全量补 Not-for**（主路由职责归路由器；仅冲突面已闭环，全量是 token 成本无收益）。
- **不修改 spec-promote / spec-product-pulse**（`disable-model-invocation: true`，description 不承担路由职能）。
- **不在本轮做正文瘦身**（spec-plan 861 行等属既有 skill-prompt 精简工作流管辖，测评数据已作为其 before 基线）。

## 4. 优先级与依赖

| 需求 | 优先级 | 依赖 | 预估工作量 |
|---|---|---|---|
| R1 fix-intent 上游路由 | P0 | 无（文本 + 用例） | 0.5 天 + 评测 0.5 天 |
| R4 行为回归重跑 | P0 | **环境**（网关稳定窗口） | 0.5 天（等待为主） |
| R2 邻界判别句 | P1 | R1 完成后合并回归 | 0.5 天 |
| R3 路由回归 CI 化 | P1 | R2 用例集稳定 | 1 天 |
| R5 合规率口径 | P2 | R3（量具先资产化） | 0.5 天 |

## 5. 风险

1. **环境依赖**：R4 被 HST 网关限流/prompt 丢弃阻塞（09-02~03 实测三路径不可用）；GPT 通道恢复依赖 127.0.0.1:8080 本地代理重启或 cc-switch 切换。缓解：CI 降级模式（R3）+ 预检闸门已在 runner 中实现。
2. **判别句的过拟合**：R2 的判别句针对当前 22 用例，新增用例可能暴露新边界。缓解：把新边界当作用例集增长点而非补丁点（`skillci` 的自增长思路）。
3. **强模型 bypass 的残余风险**：F2 主路径已修，但"能力越强越不走门"是结构性张力，文本层无法根除。缓解：R3 的 CI 门 + R5 的口径沉淀，把监测常态化。
