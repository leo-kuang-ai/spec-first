---
title: spec-first 代码审查方案
date: 2026-08-20
status: active
objectives: [A-immediate-cleanup, C-reusable-checklist]
---

# spec-first 代码审查方案

> 基于 Ponytail 思想，对 spec-first 项目的 36,166 行指令进行系统性审查和优化

## 当前审查结论（2026-08-20）

这份文档是审查方案，不是删除授权、提交授权或全局质量完成声明。当前源码核对得到以下边界：

| 面 | 当前结论 | 证据与上限 |
|---|---|---|
| 重复 reference | 已完成 6 个共享源与 16 个 package-local regular-file 副本的同步治理 | `skills/_shared/`、`scripts/sync-shared-references.js`、`npm run check:shared-references`；不证明可以删除 package-local 副本 |
| Skill 入口 | 当前 canonical Skill 为 36 个，package path 为 571 个 | `docs/validation/ce-localization/skill-inventory.json`；只证明路径/哈希覆盖 |
| 行为门 | 只覆盖 `spec-debug` 的根因修复 fixture，不是 36 个 Skill 的全局门 | `benchmarks/agentic/README.md`、`benchmarks/agentic/tasks.py`；不能外推现场价值 |
| 真实研发价值 | `runtime_cost`、`field_outcome`、adoption 与 knowledge promotion 尚未完成 | `docs/validation/ce-localization/field-validation/` 与第三轮报告 |

因此，Phase 1A 只允许维护同步关系和验证分发完整性；Phase 1B 及后续 checklist 必须逐项建立 matched baseline、行为质量、成本和 correction burden 证据后再推广。文件变短或 benchmark 通过都不能单独关闭 Skill 质量问题。

## 文档定位

本文档是基于 [`Ponytail思想指导spec-first-Skill优化.md`](./Ponytail思想指导spec-first-Skill优化.md) 的具体执行方案，服务于两个明确目标：

- **目标 A**：在不破坏独立分发的前提下，减少重复维护风险；删除、提交和提 PR 另需对应授权
- **目标 C**：建立可复用的审查 checklist 给未来 skill 开发用

## 核心原则

**风险隔离**：A 和 C 的风险模型完全不同，必须分离执行

| 维度 | 目标 A：机械清理 | 目标 C：checklist 建立 |
|---|---|---|
| 是否需要行为门 | 结构同步可确定性验证；语义删除仍需行为证据 | ✅ 必须（涉及语义判断） |
| 风险等级 | 极低 | 高 |
| 验证方式 | SHA-256 parity + package/entry contract tests | 模型运行 + 门测 |
| 可立即执行 | ✅ 是 | ❌ 否（需先建门） |
| 收益确定性 | 确定（省维护成本） | 不确定（需实测） |

**顺序纪律**（来自 §7 P0）：
> 若先改文本再建门，按 §8 就该降级。ponytail 的 8 处 SKILL.md 编辑全部 ≤ 现状、若干更差、全让输出膨胀，最终零 ship——这些编辑读起来都更严谨，唯一没被误判的原因是当时门已存在。**顺序必须门在前。**

## 执行路径

### 路径 1：机械清理（目标 A）

**时间线**：1-2 天  
**风险**：低到中（涉及 package projection 与 consumer 边界）  
**前置条件**：先确认共享源、package-local projection、consumer 和验证 owner；没有这些事实时只做 inventory，不做删除。

#### Phase 1A：字节级完全相同的文件（Day 1）

**范围**：已知重复 reference 的源/副本关系；不要把“字节相同”直接解释成“可删除”。
- `html-rendering.md`、`markdown-rendering.md`、`concepts-vocabulary.md`、`settled-decisions.md`、`tracker-defer.md`、`yaml-schema.md` 已由 `skills/_shared/references/` 维护源，package-local 副本由同步脚本生成。
- 其他相似或重复文件仍须逐组 diff、确认 consumer 和独立分发约束后再裁决；本方案不预先承诺删除。

**执行步骤**：

```bash
# 1. 先验证现有 shared-source -> package-local projection
cd /Users/kuang/xiaobu/spec-first
npm run check:shared-references

# 2. 对未纳入 SYNC_MAP 的重复组建立审查记录
# 记录 canonical source、每个 consumer、独立分发需要的 regular-file projection、
# 以及 source/test owner；没有完整记录时保持 evidence-only。

# 3. 只通过 canonical producer 同步
# 当前已纳入的组：
node scripts/sync-shared-references.js --check
# 发现 drift 时，先修改 skills/_shared/references/<name>.md，再在明确授权下运行：
# node scripts/sync-shared-references.js
# 禁止以 symlink 或 redirect 文档替代 package-local copy：插件打包、Skill validator
# 和多宿主 projection 都要求可独立读取的 regular file。

# 4. 验证 source/projection 与入口完整性
npm run check:shared-references
npm run lint:skill-entrypoints
npm run test:eval-fixtures
npx jest --runInBand tests/unit/requirements-rendering-parity.test.js tests/unit/plugin-modules.test.js
```

**验证标准**（deterministic，无需门）：
- ✅ shared source 与 package-local copy 的 SHA-256 parity 通过
- ✅ `npm run lint:skill-entrypoints` 通过
- ✅ `npm run test:eval-fixtures` 全过
- ✅ package/projection contract focused tests 通过

**commit message 模板**：
```
refactor: consolidate duplicate reference docs

- Maintain one shared source plus regular-file package projections
- Do not claim line savings until a package-compatible projection design is measured

Evidence: 
- `npm run check:shared-references`
- `npm run lint:skill-entrypoints`
- focused package/projection contract tests

Refs: docs/10-prompt/spec-first代码审查方案.md Phase 1A
```

**退出条件**：
- ✅ 如果 source/projection/contract 验证通过 → 生成 review handoff，提交/PR 仍需独立授权
- ⚠️ 如果发现"重复"实际有微小差异 → 人工 diff，判断是否为有意分叉
- ❌ 如果 package-local copy 缺失、变成 symlink 或 consumer 断裂 → 停止清理，回到 owning producer

#### Phase 1B：可安全删除的架构说明（Day 2）

**范围**：仅在 `spec-work/SKILL.md` 试点（文档 §7 P0.3 建议）

**判断标准**（来自本仓库的 Ponytail 指导文档与角色契约）：
> 审计任何 skill 文本时逐段问"这段改变了哪一项可观察行为（触发/选择/读取/行动/停止/验证/输出）？"答不出来的删掉。

**候选段落**（引自文档 §7 P0.3）：
- "Workflow Contract Summary" 中的纯架构说明
- 示例：`"Ownership: scripts prepare deterministic facts; LLMs judge semantic fit"`
- 判断：删除后 skill 的触发条件、输入、输出、验证方式都不变 → 可删

**执行步骤**：

```bash
# 1. 使用隔离实验工作区；不在当前 dirty checkout 创建或删除备份文件。
# 通过 spec-optimize 的实验工作区脚本或 caller 提供的 target_repo/worktree 执行。

# 2. 标记候选段落
cd skills/spec-work
# 人工阅读 SKILL.md，用注释标记每段的行为影响
# 示例标注格式：
#   <!-- behavior:trigger --> 影响何时触发
#   <!-- behavior:none --> 纯说明，不改变行为
#   <!-- behavior:verification --> 影响验证方式

# 3. 在隔离工作区生成 candidate patch；不要直接删除当前 checkout 的 source。

# 4. 验证
# 不要用 trace-transfer/trace-amount ——那是 spec-debug 的根因 fixture，已证伪归档
# （见 Step 1 覆盖表），且从未覆盖 spec-work。spec-work 目前唯一有 n=6 数据的门是
# cache（过度设计判断维度，spec-work 6/6），可作为"删文后正确率不下降"的验证之一，
# 但它测的是 YAGNI 判断，不是这里要删的 Workflow Contract Summary 段落本身。
cd ../../benchmarks/agentic
python3 run.py --selftest
python3 run.py --task cache \
  --arms baseline,spec-work --model sonnet --runs 6 --workers 1

# 上述门只能佐证"删文后 spec-work 在已知维度没有退步"，不能证明删除的段落本身
# 无行为影响。spec-work 仍需另建与 Workflow Contract Summary 语义匹配的 eval；
# 没有匹配任务时，删文验证保持 deferred，只能先做 Phase 1B 的手动 3 任务对照。

# 如果不被覆盖：手动跑 3 个代表性任务
# - 简单功能添加（如 add login button）
# - 跨文件修复（如 fix validation bug）
# - 架构变更（如 refactor auth flow）
```

**验证标准**：
- ✅ 对照任务的正确率不下降
- ✅ token/cost 不显著上升（±10% 内）
- ✅ 输出的 plan 或 implementation 仍符合 spec-work 的 contract

**如果验证通过（候选示例，不是当前已采用文本）**：
```
refactor(spec-work): remove non-behavioral architecture descriptions

- Remove "Ownership: ..." paragraph (no observable behavior change)
- Remove "Workflow Contract Summary" intro (duplicates canonical contract)
- Net: -180 lines from SKILL.md

Evidence:
- Manual task verification (n=3, mixed complexity)
- Correctness: 3/3 (same as baseline)
- Cost: $X.XX (within 10% of baseline)

Refs: docs/10-prompt/spec-first代码审查方案.md Phase 1B
```

**如果验证失败**：
- **停止推广**，不继续到其他 skill
- 将失败案例记录到 Phase 2 Step 3 的 Anti-patterns
- 说明：那些"看似只是说明"的段落实际通过某种机制改变了模型行为

---

### 路径 2：checklist 建立（目标 C）

**时间线**：1-2 周  
**风险**：高（涉及语义判断和行为变更）  
**前置条件**：`spec-debug` 根因 fixture 的 P0 行为门已建立；它不是全量 Skill 门。其他 Skill 必须先有与自身场景匹配的 task、judge 和 baseline。

#### Step 1：盘点现有门的覆盖范围（Day 3）

**已有门**（`benchmarks/agentic/tasks.py`，`REPORT-20260820-sonnet5-saturation.md` 已用它跑出 45 次有效运行）：

| Scorer | 任务 | 测什么 | 臂 | n | 状态 |
|---|---|---|---|---|---|
| `score_trace_transfer` | trace-transfer | 是否在共享 `_debit()` 处修根因 | baseline, spec-debug | 6 | ✅ 确认（已饱和） |
| `score_trace_amount` | trace-amount | 是否在共享 `parse_amount()` 处修根因 | baseline, spec-debug | 6 | ✅ 确认（已饱和） |
| `score_reuse_slug` | reuse-slug | 是否复用既有 `slugify()` | baseline, spec-work, spec-debug | 2 | ⚠️ 快速扫描，未 n=6 确认 |
| `score_reuse_money` | reuse-money | 是否复用既有 money 格式化 | — | 0 | ❌ fixture 存在但未运行 |
| `score_safe_path` | safe-path | 是否用 `abspath`+`startswith` 防路径遍历 | baseline, spec-work, spec-debug | 2 | ⚠️ 快速扫描，未 n=6 确认 |
| `score_cache` | cache | 是否拒绝无 consumer 的缓存（YAGNI） | baseline, spec-work, spec-debug | 6 | ✅ 确认——**唯一发现的真实回归**：spec-debug 用在实现任务上掉到 4/5（80%） |

**结论调整（基于实测，覆盖比 Step 1 原假设更广）**：

- ✅ **根因修复维度已饱和且已确认**（[[spec-debug-root-cause-saturated]]）——不要再对 §3.1/§3.4 建新门或改文本，直接归档为 anti-pattern。
- ⚠️ **复用维度（§3.3）和安全默认维度只有 n=2 快速扫描**，方向与根因维度一致（baseline 100%、加 skill 无收益但成本涨 1.8×-4.1×），但样本太小不能直接归档，需要 n=6 confirmatory run 才能定论。
- 🔴 **新发现、原候选池未覆盖的风险**：`spec-debug`（诊断 bug 的 skill）被误用在实现任务（cache）上时，正确率从 100% 掉到 80%——这是 45 次运行里唯一出现的**真实负回归**，而不只是成本开销。这说明"skill 路由/触发条件是否精确"比候选池里任何一条 Ponytail 原则的验证优先级更高，必须补进 Step 2/3。
- ❌ **仍未被任何门覆盖**：`spec-plan`、`spec-code-review`、`spec-doc-review`（报告附录明确列出，需要新 fixture：两阶段工作流或"带 bug/问题的种子文档"）、其余 34 个未测 skill。

**决策**：
- 已确认饱和的维度（根因）→ 不再投入门测资源，直接进入 §3.8 意义上的 anti-pattern 归档
- 只有 n=2 的维度（复用、安全默认）→ 先补 n=6 confirmatory run，再决定是否归档
- skill 误用风险 → 新增为 Step 2 的最高优先级候选项（见下表），因为它是唯一有实测负收益证据的方向
- 完全未覆盖的 skill（spec-plan/spec-code-review/spec-doc-review）→ 需要新 fixture，不能复用现有 `benchmarks/agentic/`，成本按"新建门"而非"复用门"估算

#### Step 2：第一个 checklist 项闭环（Day 4-8）

**选择标准**（原 P0「可执行指令优先于价值观表述」已被 2026-08-20 实测证伪——trace-transfer/trace-amount 两个任务 baseline 与 spec-debug 正确率无差异、成本翻倍，见 [[spec-debug-root-cause-saturated]]，**不再作为候选项**，直接归档为 anti-pattern。以下按实测证据重排）：

1. 高价值（直接影响质量或成本，优先看已有真实回归信号的方向）
2. 可快速验证（有现成门或可机械检查）
3. 失败成本低（只在一个 skill 试点）

**候选项优先级**（基于 `REPORT-20260820-sonnet5-saturation.md` 重排）：

| 优先级 | Checklist 项 | 可用验证 | 预期周期 | 状态 |
|---|---|---|---|---|
| P0 | `spec-debug` 触发条件收紧：诊断类 skill 不应加载到实现类任务（cache 任务上 spec-debug 4/5=80%，是 45 次运行里唯一的真实负回归） | 现有 `score_cache` 门，n=6 confirmatory（当前 6/6 baseline+work vs 4/5 spec-debug 已是 n=6，可直接用） | 1-2 天 | 🆕 新增，最高优先级 |
| P1 | 复用维度（§3.3）confirmatory run：`score_reuse_slug`/`score_reuse_money` 补到 n=6，确认 baseline 是否真的饱和 | 现有门，仅需追加 runs | 半天 | 🆕 补测，当前只有 n=2 |
| P1 | 安全默认维度 confirmatory run：`score_safe_path` 补到 n=6 | 现有门，仅需追加 runs | 半天 | 🆕 补测，当前只有 n=2 |
| P2 | 每个 reference 必须有明确 consumer 或 projection owner | sync map + source refs + 人工语义审查 | 1 天 | 沿用原方案 |
| P3 | 新增 fixture 覆盖 `spec-plan`/`spec-code-review`（报告附录标出的未测 skill） | 需要新 fixture（两阶段工作流或带 bug 种子文档），成本远高于复用现有门 | 3-5 天/skill | 沿用原方案，明确降级为 P3（成本被低估过） |

~~原 P2「删除单实现抽象」、原 P3「复用现有 helper 优先于新实现」~~：已被上面的 P1 confirmatory run 部分覆盖（复用维度），且 §3.5「删除优先」类判断在饱和报告里没有对应 fixture，暂无法门测，移出本轮候选池，记录到 Step 3 候选池等待新 fixture。

**执行模板 A**（已跑完的反例，示范"提出→试用→门测→归档为 anti-pattern"全流程；该项已从候选池移除，不要重跑）：

```markdown
## Checklist Item（已证伪，仅存档）: 可执行指令优先于价值观表述

### 1. 提出假设

**假设**：将 `spec-debug/SKILL.md` 中的价值观表述（"trace the full causal chain"）
替换为可执行指令（"grep every caller of the function you touch"），
会提升根因修复的正确率。

**理论依据**：ponytail benchmarks/results/2026-06-22-issue-245-217-comprehension.md
- "trace the flow end to end" → Opus 0/3
- "grep every caller of the function you touch" → Opus 6/6

### 2. 在一个 skill 上试用

**试点 skill**：`spec-debug`

**修改位置**：`skills/spec-debug/SKILL.md:9`

**修改前**：
```
Root cause analysis: tracing the full causal chain before proposing a fix
```

**修改后**：
```
Root cause analysis: before proposing a fix, grep every caller of the function 
you touch (`grep -rn "functionName" . --include="*.{py,js,ts,...}"`), check if 
they share the same failure condition, and fix at the shared entry point if possible.
```

### 3. 用门测试

```bash
cd benchmarks/agentic
python3 run.py --selftest
python3 run.py --task trace-transfer,trace-amount \
  --arms baseline,spec-debug --model sonnet --runs 6 --workers 1

# baseline 与 candidate 由 --arms 隔离；不要给 benchmark CLI 传不存在的
# --tasks/--n/--setting-sources/--plugin-dir 参数。运行结果写入
# benchmarks/agentic/runs/<timestamp>/，以该目录的 results.json/summary.json 为准。
```

### 4. 记录结果

**实测结果**（2026-08-20）：
- baseline: trace-transfer 5/5 @ $0.33/cell, trace-amount 6/6 @ $0.37/cell
- spec-debug: trace-transfer 6/6 @ $0.67/cell, trace-amount 6/6 @ $0.34/cell

**判断**：
- ❌ 正确率无差异（11 次真实运行两臂全对）
- ❌ 成本在 trace-transfer 上翻倍
- **结论**：此指令在根因维度无收益，不应列入 P1

### 5. 沉淀

**如果通过** → 写入 `docs/solutions/skill-simplification-patterns.md`

**如果失败** → 写入 Anti-patterns：

```markdown
## Anti-pattern: shared-caller 检查在根因维度（当前模型）

**Evidence:** spec-first benchmarks/agentic, Sonnet 5, n=6, 2026-08-20
- Baseline: 5/5 @ $0.33/cell (trace-transfer)
- With explicit instruction: 6/6 @ $0.67/cell (成本翻倍，正确率无差异)

**Why failed:** 当前 Sonnet 5 已内化"改函数前看谁调用它"，
显式指令反而增加 prompt 负担而无收益。

**Invalidation condition:** 
- 模型演化（如切换到更弱的模型）
- 更难的 fixture（如大型多层调用栈）
- 触发方式：门测显示正确率 < baseline

**Owner:** spec-debug 的根因维度

**Refs:** 
- `benchmarks/agentic/REPORT-20260820-sonnet5-saturation.md`
- `docs/10-prompt/Ponytail思想指导spec-first-Skill优化.md` §4.4、§8
```

**执行模板 B**（当前最高优先级候选项，尚未执行——按此模板做本轮第一个真正的闭环）：

```markdown
## Checklist Item: spec-debug 误用防护（诊断类 skill 不应加载到实现类任务）

### 1. 提出假设

**假设**：`spec-debug` 是诊断 bug 的 skill，若被加载到纯实现任务（如"给已有函数加缓存"）
上，会把模型导向"找 bug"式思维，反而干扰正常的 YAGNI 判断，产生比 baseline 更差的结果。

**理论依据**：`REPORT-20260820-sonnet5-saturation.md` 过度设计判断维度（cache 任务，n=6）：
- baseline: 5/5（100%，1 cell API 失败已排除）
- spec-work: 6/6（100%）
- **spec-debug: 4/5（80%，1 cell API 失败已排除）** ← 45 次运行里唯一的真实负回归

### 2. 在一个 skill 上试用

**试点 skill**：`spec-debug`

**修改方向**：不是改 SKILL.md 正文，而是检查/强化触发条件（route/trigger 层）——
明确 `spec-debug` 只在"存在 bug 报告或异常行为"时触发，不应用于"添加新能力/性能优化"
这类纯实现请求。若 spec-first 有 skill 路由层（如 `route` 字段或 dispatcher），在那里加限定；
若没有路由层，在 SKILL.md 开头加不可忽略的 scope 边界（"何时不使用本 skill"）。

**修改前**（假设，需先读 `skills/spec-debug/SKILL.md` 实际触发描述确认现状）：
缺少"何时不适用"的显式边界。

**修改后**（示意）：
```
This skill is for diagnosing reported bugs or unexpected behavior. Do NOT use it
for feature additions, performance optimization, or refactoring requests that have
no bug report — route those to spec-work or spec-simplify-code instead.
```

### 3. 用门测试

```bash
cd benchmarks/agentic
python3 run.py --selftest
python3 run.py --task cache \
  --arms baseline,spec-work,spec-debug --model sonnet --runs 6 --workers 1
```

**判断标准**：
- 修改后 spec-debug 在 cache 任务上的正确率应回到与 baseline/spec-work 相当（6/6 或至少不低于当前 4/5）
- 如果路由层修改后 spec-debug 根本不会被触发（因为任务不匹配 bug 报告特征）→ 说明问题应该在
  路由/调度层解决，不是 SKILL.md 正文；记录为 architecture-mismatch，退回 spec-plan 决策

### 4. 记录结果

（执行后填写：baseline/spec-work/spec-debug 三臂正确率、成本、结论）

### 5. 沉淀

**如果通过**（触发条件修复后 spec-debug 不再误用于实现任务）→ 写入
`docs/solutions/skill-simplification-patterns.md` 的 Patterns 部分，标注：
- Applicability：所有诊断类 skill 与实现类 skill 并存的路由场景
- Ceiling：仅覆盖"任务描述明显是实现/优化而非 bug"的情况，不覆盖歧义任务
- Trigger：新增诊断类 skill 时，必须先测试它是否会被误路由到实现任务
- Owner：spec-debug 的 scope 边界，以及项目的 skill 路由/调度机制

**如果失败**（触发条件难以精确区分，或路由层不支持这种限定）→ 记录为
architecture-mismatch，说明当前路由机制无法承载这类判断，需要在 `spec-plan` 层
重新设计路由决策，而不是在单个 SKILL.md 里打补丁。
```

**重复此流程**，每完成一个 checklist 项：
- 更新 `docs/solutions/skill-simplification-patterns.md`
- 记录通过的 pattern 和失败的 anti-pattern
- 调整下一个候选项的优先级

#### Step 3：迭代扩展（Day 9-14）

**目标**：完成 3-5 个 checklist 项的闭环

**候选池**（已按饱和报告重排，不再是 Ponytail §3 的直接映射——已确认饱和或已证伪的项标注状态，不再消耗门测资源）：

| 来源 | Checklist 项 | 验证方式 | 状态 |
|---|---|---|---|
| 实测新发现 | spec-debug 误用防护（诊断 vs 实现路由） | 现有 `score_cache` 门 | 🆕 P0，见执行模板 B |
| §3.3 复用优先 | reuse-slug/reuse-money confirmatory run（n=2→n=6） | 现有门，仅需追加 runs | 🆕 P1，补测中 |
| 报告安全默认维度 | safe-path confirmatory run（n=2→n=6） | 现有门，仅需追加 runs | 🆕 P1，补测中 |
| §3.2 必要性优先于可实现性 | 新增 durable surface 必须有真实 consumer | `grep -r` 或人工 | 沿用，P2 |
| §3.7 有意简化必须有 ceiling | shortcut 记录适用范围和 invalidation condition | 人工审查 | 沿用，P2 |
| §3.8 用证据判断收益 | 区分 structure/behavior/runtime/field 四类证据 | meta 检查（非门测，审查方案本身已示范） | 沿用，P2 |
| §3.1 先理解再简化 | 修改前必须 grep caller | 现有根因门 | ❌ **已证伪**（trace-transfer/amount 双双无差异），归档为 anti-pattern，不再候选 |
| §3.4 修共享根因 | 优先在 owning boundary 修一次 | 现有根因门 | ❌ **已证伪**，同上，归档为 anti-pattern |
| §3.5 删除优先 | 删除死代码、单实现抽象、薄 wrapper | 无对应 fixture | ⏸️ 搁置，需先设计新 fixture 才能进候选池 |
| §3.6 阶段边界简化 | 使用 remove-now/minimality-debt/protected 分类 | 无对应 fixture | ⏸️ 搁置，同上 |
| 报告附录 | spec-plan/spec-code-review/spec-doc-review 新 fixture | 需要两阶段工作流或带 bug 种子文档 | P3，成本高于本轮其他项，见 Step 2 表 |

**每完成 3 个闭环后回顾**：
- 哪类删除总是安全？→ 提升为"优先审查"类
- 哪类删除总是危险？→ 提升为"保护面"类
- 成本和收益的比例如何？→ 调整优先级
- **新增回顾项**：本轮饱和报告证明"模型已内化的维度"和"skill 路由精度"是两类不同的风险来源，
  前者过去被高估（多个 Ponytail 原则已证伪），后者过去完全没被候选池覆盖。下一轮候选池设计时，
  优先看"是否有实测负回归信号"，而不是"Ponytail 原则听起来是否合理"。

#### Step 4：推广决策（Week 3+）

**推广条件**（非补偿式门禁，来自 §8）：
```
结构通过
  且行为质量不下降
  且保护性约束不回归
  且相对收益有 matched evidence
  且 correction burden 没有上升
  -> 才能推广
```

**降级条件**（任一触发立即停止）：
- 只证明 Skill 文件更短，没有行为证据
- 只证明 benchmark 变好，没有代表性任务或现场证据
- 出现安全、授权、数据完整性、a11y、关键验证回归，或失败后仍生成 runtime mutation
- 复杂度下降但人工修正和返工增加
- 规则与现有 source owner、workflow 或 contract 冲突
- 没有真实 consumer，或规则已经被宿主/现有 Skill 覆盖

**推广路径**：
1. **如果 ≥5 个 checklist 项都通过门测且收益 > 成本**：
   - 将 patterns 写入 `docs/solutions/skill-simplification-patterns.md`
   - 在 `spec-compound` / `spec-compound-refresh` 中引用
   - 考虑提升为跨 skill 的 durable guidance

2. **如果混合结果**：
   - 只推广通过的项
   - 失败的记录为 anti-pattern
   - **不强制应用**，保持 advisory 性质

3. **如果前 3 个都失败或成本 > 收益**：
   - **停止 checklist 建立**
   - 说明当前不是优化的窗口期
   - 记录"何时重新评估"的触发条件（如模型演化、新门建立）

---

## 关注内容清单

### 高优先级（必查）

#### 1. 重复消除（Phase 1A）
- [x] 已纳入同步治理的字节级相同 reference（SHA-256 parity）
- [ ] 高度相似但有微小差异的文件（需人工 diff）
- [ ] 重复的代码逻辑片段（非文件级）

#### 2. 死代码识别（Phase 1B + Step 2）
- [ ] 无 consumer 的 reference 文档
- [ ] 未被任何 skill 调用的 helper 函数
- [ ] 无效的配置选项（schema 定义但无实现）
- [ ] 永远不会触发的分支（如 `if (false)`）

#### 3. Skill 路由/误用防护（Step 2 P0，🆕 最高优先级，唯一有实测负回归证据的方向）
- [ ] 诊断类 skill（spec-debug）的触发条件是否排除纯实现/优化请求
- [ ] 每个 skill 的 SKILL.md 是否有显式"何时不使用本 skill"边界
- [ ] 用 `score_cache` 门验证修复后 spec-debug 在实现任务上的正确率是否回到 baseline 水平
- [ ] 如果路由层无法承载这类判断 → 记录 architecture-mismatch，退回 `spec-plan`

#### 4. 可执行性检查（已证伪，仅作反面参考，不再列入本轮审查重点）
- [x] ~~价值观表述 vs 可执行指令~~ —— trace-transfer/trace-amount 实测证明当前模型对
  两种表述方式的正确率无差异（[[spec-debug-root-cause-saturated]]），此项已归档为
  anti-pattern，不再对新文本重复验证，除非模型演化或 §8 触发重新评估
- [ ] 例外：若发现新的具体场景（非根因修复类）显示表述方式确实影响行为，才重新开门测

#### 5. 复用与安全默认 confirmatory run（Step 2 P1，补测中）
- [ ] `score_reuse_slug`/`score_reuse_money` 从 n=2 补到 n=6
- [ ] `score_safe_path` 从 n=2 补到 n=6
- [ ] 确认方向是否与快速扫描一致（baseline 饱和、加 skill 无收益但成本涨 1.8×-4.1×）
- [ ] 如果 confirmatory run 结果与快速扫描一致 → 归档为 anti-pattern（类比根因维度）
- [ ] 如果出现差异 → 保留为候选，需要更大样本或更难 fixture

#### 6. 必要性验证（Step 2 P2）
- [ ] 每个新增 durable surface 有真实 consumer
- [ ] 每个抽象有 ≥2 个实现或明确的扩展计划
- [ ] 每个 wrapper 增加了 translation、sequencing、safety 或 evidence（不只是转发）

### 中优先级（条件查）

#### 7. Owner 正确性（Step 2 P2）
- [ ] 每个能力有唯一 source-of-truth
- [ ] 没有混淆职责的 nearby capability 复用
- [ ] 跨层调用的 boundary 清晰

#### 8. Shortcut 治理（Step 3）
- [ ] 有意简化必须记录 ceiling 和 trigger
- [ ] "以后再做"必须有可观测的触发条件
- [ ] 退役条件明确

#### 9. 未覆盖 skill 的新 fixture（Step 3 P3，成本高于其他项）
- [ ] `spec-plan`：需要两阶段工作流 fixture（plan → implement）
- [ ] `spec-code-review`：需要"带 bug 的代码"作为 seed
- [ ] `spec-doc-review`：需要"有问题的文档"作为 seed
- [ ] 其余 34 个未测 skill：先基于已测 4 个维度的饱和结论决策，只在观察到实际失效后补测

### 低优先级（选查）

#### 10. 措辞优化（仅在有门后）
- [ ] 命令式 > 描述式
- [ ] 具体 > 抽象
- [ ] 当下可验证 > 未来可能

#### 11. 结构优化（仅在有门后）
- [ ] contract 与 implementation 的分离
- [ ] reference 的层次与索引
- [ ] examples 的代表性

---

## 审查检查表

### 文件级检查

**对每个 `SKILL.md`**：

```markdown
## 文件：skills/<skill-name>/SKILL.md

### 基础信息
- [ ] 文件大小：_____ 行
- [ ] 最后修改：_____
- [ ] 是否有测试覆盖：Yes / No
- [ ] 是否被门覆盖：Yes / No / Partial

### 重复检查（Phase 1A）
- [ ] SHA-256 hash：_____
- [ ] 与哪些文件重复：_____
- [ ] 是否 canonical source：Yes / No
- [ ] 如果不是，canonical 在哪：_____

### 可执行性检查（Phase 1B）
逐段标注：
- [ ] Paragraph 1 (lines X-Y): behavior:trigger / behavior:none / ...
- [ ] Paragraph 2 (lines X-Y): behavior:verification / behavior:none / ...
- [ ] ...
- [ ] 可删除段落总数：_____
- [ ] 可删除行数：_____

### 必要性检查（Step 2）
- [ ] 列出所有新增 durable surface：_____
- [ ] 每个是否有真实 consumer：Yes / No / Unknown
- [ ] 无 consumer 的项：_____

### 复用检查（Step 2）
- [ ] 是否使用项目现有 helper：_____
- [ ] 是否可用 stdlib：_____
- [ ] 重复实现的功能：_____
```

### 段落级检查（用于 Phase 1B）

**对每段 prose**：

```markdown
## 段落：skills/<skill-name>/SKILL.md:L<start>-<end>

### 内容摘要
```
<首句或关键句>
```

### 行为影响分析
回答："删除此段后，哪一项可观察行为会改变？"

- [ ] 触发条件：_____ (如何改变)
- [ ] 选择逻辑：_____ (如何改变)
- [ ] 读取范围：_____ (如何改变)
- [ ] 行动序列：_____ (如何改变)
- [ ] 停止条件：_____ (如何改变)
- [ ] 验证方式：_____ (如何改变)
- [ ] 输出格式：_____ (如何改变)
- [ ] **无影响**：Yes / No

### 判断
- [ ] **可删除**：Yes / No
- [ ] **原因**：_____
- [ ] **如果删除，保留什么机制**：_____
```

---

## 验证流程

### Phase 1A 验证（机械清理）

```bash
#!/bin/bash
# verify-phase-1a.sh

set -e

echo "=== Phase 1A Verification ==="

# 1. source -> package-local projection parity
node scripts/sync-shared-references.js --check

# 2. 入口与 fixture 合同
npm run lint:skill-entrypoints
npm run test:eval-fixtures
npx jest --runInBand tests/unit/requirements-rendering-parity.test.js tests/unit/plugin-modules.test.js

# 3. 只记录 manifest/hash 与 package path 完整性，不把净删行数当收益
node scripts/check-ce-localization-review.cjs --verify-only

echo "=== Phase 1A Verification PASSED ==="
```

### Phase 1B / Step 2 验证（需要门）

```bash
#!/bin/bash
# verify-with-gate.sh

set -e

TASK_IDS=$1  # 必须是当前 harness 中存在的 task id；本轮 P0 用 cache（见执行模板 B），
             # 不要再默认 trace-transfer——根因维度已证伪归档，不应再消耗门测资源
ARMS=${2:-baseline,spec-work,spec-debug}  # cache 任务需要三臂对照才能看出 spec-debug 的负回归
N=${3:-6}
MODEL=${4:-sonnet}

echo "=== Verifying tasks=$TASK_IDS arms=$ARMS (n=$N, model=$MODEL) ==="

# 1. 先验证 instrument；失败 cell 不得计入正确率
echo "Running instrument selftest..."
cd benchmarks/agentic
python3 run.py --selftest

# 2. 运行 paired arms。当前 run.py 的真实参数是 --task/--arms/--model/--runs。
python3 run.py --task "$TASK_IDS" --arms "$ARMS" --model "$MODEL" --runs "$N" --workers 1

# 3. 从同一 timestamp 目录读取 results.json/summary.json，逐 task 比较
# correct/safe、API failed、token、duration、cost、tests 与人工 correction burden。
# 没有匹配 task 或出现 API failed 时，降级为未验证，不得写“通过”。
```

---

## 输出交付物

### Phase 1A（机械清理）
- [ ] Review handoff：source/projection/consumer 映射（删除需另行授权）
- [ ] 清单：shared source、regular-file projections、consumer 与 test owner
- [ ] 验证报告：`check:shared-references`、entry lint、focused tests、inventory 结果

### Phase 1B（架构说明删除）
- [ ] Candidate patch：spec-work 删除纯说明段落（只有匹配行为证据通过且另有变更授权时）
- [ ] 标注文档：每段的行为影响分析
- [ ] 验证报告：门测结果（正确率、成本、人工修正）

### Step 2-4（checklist 建立）
- [ ] `docs/solutions/skill-simplification-patterns.md`
  - 通过的 patterns（≥5 项）
  - 失败的 anti-patterns（含 evidence）
  - 每个 pattern 的 applicability、ceiling、trigger、owner
- [ ] 门测报告（每个 checklist 项）
  - baseline vs candidate 对照
  - 正确率、成本、token、人工修正
  - 代表性任务样本
- [ ] 推广决策文档
  - 哪些项可推广为 durable guidance
  - 哪些项保持 advisory
  - 哪些项需要重新评估

---

## 风险与退出条件

### Phase 1（机械清理）

**触发退出**：
- ❌ 如果"重复"文件实际有语义差异 → 人工判断是否有意分叉
- ❌ 如果删除、symlink 或 projection 试验导致 import/package 路径失效 → 停止并回到 owning producer
- ❌ 如果任一 focused contract 失败 → 保持 source 不变，分析失败原因

**继续条件**：
- ✅ 所有测试通过
- ✅ 无语义差异
- ✅ regular-file package projection、consumer 和 source/runtime boundary 均保持有效

### Phase 2（checklist 建立）

**触发退出**（任一满足立即停止）：
- ❌ 前 3 个 checklist 项都失败（正确率 < baseline）
- ❌ 前 3 个成本都 > 收益（成本增加 >50% 且正确率无提升）
- ❌ 出现安全、授权、隐私回归
- ❌ correction burden 上升（人工修正次数增加）

**继续条件**：
- ✅ 至少 2/3 的项通过门测
- ✅ 平均成本增加 <20%
- ✅ 无保护性约束回归

**推广条件**（≥5 个项通过后）：
- ✅ 行为质量不下降
- ✅ 保护性约束不回归
- ✅ 有 matched evidence（门测 + 代表性任务）
- ✅ correction burden 没有上升

---

## 时间线与里程碑

### Week 1（Day 1-5，已按 `REPORT-20260820-sonnet5-saturation.md` 重排）
- **Day 1**: Phase 1A 执行（source/projection 盘点、同步、验证）
- **Day 2**: Phase 1B 仅建立 spec-work 的 task/eval 设计；没有匹配门时不改 source
- **Day 3**: Step 1（盘点门覆盖，已完成——见上文按 scorer 的覆盖表）
- **Day 4-5**: Step 2 第一个 checklist 项 —— **P0：spec-debug 误用防护**（执行模板 B，用现有 `score_cache` 门，唯一有实测负回归证据的方向）

**Milestone 1**: 
- ✅ 完成 source/projection/consumer ledger；不以净删行数作为里程碑
- ✅ 完成 spec-debug 误用防护这一项的完整闭环（提出→路由层修改→`score_cache` 门测→沉淀 pattern 或 architecture-mismatch）
- ⚠️ 原计划"P0 可执行性"项已在建立门当天证伪并归档，不再占用 Day 4-5 资源

### Week 2（Day 6-12，重排后）
- **Day 6**: P1 confirmatory run —— `score_reuse_slug`/`score_reuse_money` 从 n=2 补到 n=6
- **Day 7**: P1 confirmatory run —— `score_safe_path` 从 n=2 补到 n=6
- **Day 8-9**: 根据 confirmatory run 结果决定：若与快速扫描方向一致 → 归档为 anti-pattern；若有差异 → 设计下一轮验证
- **Day 10-11**: Step 2 P2 项（consumer 验证 / owner 正确性 / shortcut 治理，人工审查为主，不占门测资源）
- **Day 12**: Step 3 回顾与优先级调整

**Milestone 2**:
- ✅ 完成 spec-debug 误用防护 + 2 个 confirmatory run（复用、安全默认）的闭环，累计 3 个
- ✅ 初步判断是否继续（基于通过率和成本，重点看 confirmatory run 是否推翻快速扫描的饱和结论）

### Week 3+（视 Milestone 2 决定）
- **If continue**: Step 2-3 继续（目标 5+ 项）
- **If stop**: Step 4 沉淀已验证的 patterns，记录退出原因
- **Week 4**: Step 4 推广决策（如果 ≥5 项通过）

**Final Milestone**:
- ✅ `docs/solutions/skill-simplification-patterns.md` 完成
- ✅ 推广决策文档完成
- ✅ 所有 patterns 都有 evidence + ceiling + trigger + owner

---

## 参考资料

### 权威文档
1. [Ponytail思想指导spec-first-Skill优化.md](./Ponytail思想指导spec-first-Skill优化.md) - 指导思想与原则
2. [结构化项目角色契约.md](./结构化项目角色契约.md) - 第一性原理与边界
3. [AI-Coding-Harness演化方法论.md](./AI-Coding-Harness演化方法论.md) - 能力演化判断顺序
4. [skill-prompt-设计与优化方法论-v2.md](./skill-prompt-设计与优化方法论-v2.md) - Skill Prompt 设计

### Memory 知识
- 上述 Memory 条目是背景线索，不是本仓库的完成证据；执行时必须回到当前 source、benchmark `results.json`、`summary.json` 和测试日志。

### 实测证据
- `ponytail/benchmarks/results/2026-06-22-issue-245-217-comprehension.md`
- `ponytail/benchmarks/results/2026-06-16-robustness-audit.md`
- `spec-first/benchmarks/agentic/` (2026-08-20)

---

## 维护纪律

- 本文档是可执行方案，不是静态指南
- 每个 Phase / Step 执行后更新状态（✅ / ⚠️ / ❌）
- 新发现的 anti-pattern 立即记录到 Phase 2 Step 3
- 门测结果必须记录完整上下文（模型、n、任务、成本）
- 推广决策必须有非补偿式门禁（§8）
- 如果与权威文档冲突，以权威文档为准

---

**最后更新**: 2026-08-20（已按 `REPORT-20260820-sonnet5-saturation.md` 重排 Step 2/3 候选池优先级）  
**状态**: Active；Phase 1A source/projection audit 已有 owner，Phase 1B/后续行为优化仍 deferred  
**Owner**: @kuang  
**Next Action**（按当前优先级，先做 1 再做 2）：
1. `npm run check:shared-references && npm run lint:skill-entrypoints && npm run test:eval-fixtures`（Phase 1A 验证，无需门）
2. 执行模板 B：`spec-debug` 误用防护——先读 `skills/spec-debug/SKILL.md` 现有触发条件描述，再跑
   `cd benchmarks/agentic && python3 run.py --selftest && python3 run.py --task cache --arms baseline,spec-work,spec-debug --model sonnet --runs 6 --workers 1`
   确认当前 4/5 的负回归可复现，再决定路由层修改方案（这是本轮唯一有实测负回归证据支撑的候选项，见 §Step 2）
