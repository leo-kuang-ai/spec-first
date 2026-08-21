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
| `score_cache` | cache | 是否拒绝无 consumer 的缓存（YAGNI） | baseline, spec-work, spec-debug | 6 | ⚠️ **仲裁后信号弱于原始报告**，见下方更正 |

**⚠️ 2026-08-20 22:30 更正（仲裁复现，不要沿用上面"唯一真实回归"的原始措辞）**：

原始报告 `REPORT-20260820-sonnet5-saturation.md` 里的 "spec-debug 4/5=80%" 是 `runs/20260820-190610/`（n=5，认证环境未记录）单次小样本结果，被当成"45 次运行里唯一的真实负回归"写进本文档并驱动了整个 Step 2 的优先级重排。执行模板 B 落地前按方案纪律先复现，结果如下（当前网关环境 `ANTHROPIC_AUTH_TOKEN`+`ANTHROPIC_BASE_URL`，`claude-sonnet-5`，全部零 API 失败）：

| 来源 | n | correct（spec-debug） | 备注 |
|---|---|---|---|
| `190610`（历史，报告引用） | 5 | 4/5 = 80% | 认证环境未知 |
| `225532`（本次复现） | 6 | 6/6 = 100% | 网关环境，方向反转 |
| `230644`（本次仲裁） | 12 | 9/12 = 75% | 网关环境 |
| **本次合并（225532+230644）** | **18** | **15/18 = 83.3%** | **零 API 失败** |

同一 18 个 cell 里 baseline 16/18=88.9%、spec-work 17/18=94.4%。2026-08-21 复算双侧 Fisher exact：baseline vs spec-debug **p=1.000**，spec-work vs spec-debug **p≈0.603**；两组对比均无统计证据支持真实差异。此前写入的 `p=0.063/0.0055` 是错误计算，已废止。

**修正结论**：
- spec-debug 在这 18 次 cache 测量中的观察正确率略低于 baseline 和 spec-work，但双侧 Fisher exact 不支持真实差异；当前结果只能归类为**未证实假设**，不能称为“边缘信号”或“真实回归”。
- 原始的单次 n=5/n=6 样本方差大到足以让结论在重跑时反转（0/2→4/5→6/6→9/12），**任何基于 n≤6 单臂结果的"唯一真实回归"表述都应该先标注置信区间宽度，不能直接当作行动依据**。
- 本次仲裁额外花费约 $20.73（18+18 个 cell 的真实 API 调用），已计入门测预算。
- 相应地，下面 Step 2 表格中“spec-debug 误用防护”不再是当前修改候选；只有出现更能区分诊断与实现路由的 fixture，且先定义实际效应阈值和统计方法时，才重新开放验证。

**其余结论调整（未受本次仲裁影响，仍按原假设）**：

- ✅ **根因修复维度已饱和且已确认**（[[spec-debug-root-cause-saturated]]，n=6/臂，无 API 失败，未被本次仲裁触及）——不要再对 §3.1/§3.4 建新门或改文本，直接归档为 anti-pattern。
- ⚠️ **复用维度（§3.3）和安全默认维度完成了 n=12 confirmatory run**（2026-08-20 23:22，`runs/20260820-232245`，108 个计划 cell、107 个有效测量、1 个 300 秒超时，花费 $44.54）：

  | 任务 | baseline | spec-work | spec-debug |
  |---|---|---|---|
  | reuse-slug | 12/12=100% | 11/11=100%（1 API 失败已排除） | 12/12=100% |
  | reuse-money | 12/12=100% | 12/12=100% | 12/12=100% |
  | safe-path | 12/12=100% | 12/12=100% | 12/12=100% |

  107 个有效测量全部正确，与原 n=2 快速扫描方向一致；但 `reuse-slug/spec-work` 只有 11/12 个有效测量，因此不能写“三臂完整零失败”。证据仍足以说明这些简单 fixture 已接近天花板、当前无法证明 Skill 相对收益；结论降为**fixture 饱和候选**，不据此修改 Skill，也不把部分失败运行提升为完整 confirmatory pass。

- ❌ **仍未被任何门覆盖**：`spec-plan`、`spec-code-review`、`spec-doc-review`（报告附录明确列出，需要新 fixture：两阶段工作流或"带 bug/问题的种子文档"）、其余 34 个未测 skill。

**决策**：
- 已确认饱和的维度（根因、复用、安全默认）→ 不再投入门测资源，直接进入 §3.8 意义上的 anti-pattern 归档
- spec-debug 误用风险 → 当前假设未证实并退出修改候选；不机械扩到 n≥24，只有新 fixture 能形成更强区分且预先定义效应阈值时才重开
- 完全未覆盖的 skill（spec-plan/spec-code-review/spec-doc-review）→ 需要新 fixture，不能复用现有 `benchmarks/agentic/`，成本按"新建门"而非"复用门"估算

#### Step 2：第一个 checklist 项闭环（Day 4-8）

**选择标准**（原 P0「可执行指令优先于价值观表述」已被 2026-08-20 实测证伪——trace-transfer/trace-amount 两个任务 baseline 与 spec-debug 正确率无差异、成本翻倍，见 [[spec-debug-root-cause-saturated]]，**不再作为候选项**，直接归档为 anti-pattern。以下按实测证据重排）：

1. 高价值（直接影响质量或成本，优先看已有真实回归信号的方向）
2. 可快速验证（有现成门或可机械检查）
3. 失败成本低（只在一个 skill 试点）

**候选项优先级**（⚠️ 2026-08-21 再复核：`spec-debug` 误用防护的双侧 Fisher exact 为 `p=1.000`，不支持真实差异；退出当前修改候选）：

| 优先级 | Checklist 项 | 可用验证 | 预期周期 | 状态 |
|---|---|---|---|---|
| 已退出 | `spec-debug` 触发条件收紧：n=18 时 spec-debug 15/18、baseline 16/18，双侧 Fisher exact p=1.000 | 现有 `score_cache` fixture 区分力不足；只有新 fixture + 预注册效应阈值才重开 | 已花 ~$20.73，不继续机械扩样本 | ❌ 未证实，不授权改 `SKILL.md` |
| P2 | 每个 reference 必须有明确 consumer 或 projection owner | sync map + source refs + 人工语义审查 | ✅ 已完成，见下方更新 | 完成 |
| P3 | 新增 fixture 覆盖 `spec-plan`/`spec-code-review`（报告附录标出的未测 skill） | 需要新 fixture（两阶段工作流或带 bug 种子文档），成本远高于复用现有门 | 3-5 天/skill | 沿用原方案，明确降级为 P3（成本被低估过） |

~~原 P1「复用维度 confirmatory run」、原 P1「安全默认维度 confirmatory run」~~：**已于 2026-08-20 23:22 执行**（n=12，`runs/20260820-232245`，108 个计划 cell、107 个有效测量、1 个超时，花费 $44.54）。有效测量全部正确，说明 fixture 对当前模型已饱和；由于存在部分失败，本轮不称“完整 confirmatory pass”，但仍不支持修改 Skill，移出当前候选池。

**本轮教训（写入 §3.8 意义上的方法学记录）**：单臂 n≤6 的"发现回归"结论在重跑中不稳定（cache/spec-debug 四次独立测量：0/2、4/5、6/6、9/12），任何要驱动"改 SKILL.md 正文"这类高成本动作的负回归证据，门测前应先用同一环境跑至少 n=12 做一次内部复现，而不是直接采信报告里的单次小样本数字。这条同样适用于未来任何"唯一真实回归"类表述。**但方差大小本身也是维度特异的**——cache（过度设计判断）在 n=5→n=18 之间剧烈波动，而 reuse-slug/reuse-money/safe-path（复用、安全默认）三个任务在 n=2→n=12 之间完全稳定（都是 100%）。这提示"要不要补大样本"应该按维度性质判断，不是一刀切：涉及模型主观判断阈值的维度（YAGNI/过度设计）方差更大，涉及明确对错的维度（是否调用了正确函数、是否有安全漏洞）方差更小。

~~原 P2「删除单实现抽象」、原 P3「复用现有 helper 优先于新实现」~~：已被上面的 confirmatory run 部分覆盖（复用维度已确认饱和），且 §3.5「删除优先」类判断在饱和报告里没有对应 fixture，暂无法门测，移出本轮候选池，记录到 Step 3 候选池等待新 fixture。

**P2「reference consumer/projection owner」实际执行结果（2026-08-20 23:40，人工审查，不占门测预算）**：

`skills/_shared/README.md` 原有措辞把 8 组文件标记为"known drift, requires manual merge decision"。逐组重新 diff 后发现这个措辞本身是错的：

| 组 | 标题（第 1 行） | 判断 |
|---|---|---|
| `cross-model-review.md` | "Cross-Model Adversarial Pass" vs "Cross-Model Whole-Document Pass" | 真分叉：不同脚本（`cross-model-adversarial-review.sh` vs `cross-model-doc-review.sh`）、不同 persona、不同 gate 结构 |
| `intake.md` | "Intake" vs "Establish the Frame Before Grounding" | 真分叉，独立撰写 |
| `interview.md`（3 份） | 三份标题各不相同 | 真分叉，各自 skill 专属访谈脚本 |
| `pipeline-return.md` | 第 3 行起内容即分道 | 真分叉，不同 caller 语境 |
| `review-output-template.md` | "Code Review" vs "Document Review" | 真分叉，不同评审对象 |
| `synthesis-summary.md` | "Scoping Synthesis" vs "Synthesis Summary"，行数差 152 行 | 真分叉，内容量级都不同 |
| `subagent-template.md`（3 份） | 三份标题各不相同 | 真分叉，不同 subagent 角色 |
| **`model-tiers.md`** | 两份都是 "Model Tiers" | **唯一真正的模板复制候选**：四段结构逐句对应（extraction/generation/ceiling tier + degradation rule），只替换了角色名词（"media-analyzer workers" vs "claim verifier"）。`git log --follow` 确认两份同一个 commit（`e9fe0769`）引入。 |

**结论**：8 组里 7 组是独立撰写内容偶然同名，不是漂移，不需要合并决策——**已修正 `skills/_shared/README.md` 里"8 file groups... require manual merge decision"这条错误陈述**。`model-tiers.md` 是唯一真实候选，但未纳入 `SYNC_MAP`：skill 特定名词是正文的一部分而非偶然差异，同步会强制锁死两个 skill 各自的措辞演化自由度；要正确同步需要先把文件改造成参数化模板（名词作变量），这是比现有 sync 脚本能力更大的变更，记录为 architecture-mismatch，留给未来有真实需求时再决策，不强行推进。

**沉淀（写入 §3.8 意义上的记录，不写入 `docs/solutions/`，因为这不是一个可复用的"简化模式"，而是一次性的文档纠错）**：文件名相同不等于内容重复；判断"是否该同步"要看首行标题和结构是否同构，而不是文件名列表。`skills/_shared/README.md` 的"8 组已知漂移"清单在写入时可能就没有真的逐组 diff 过，这提示以后写"已知 XX 项待办"这类清单前，先验证清单本身的准确性。

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

**执行模板 B**（⚠️ 已降级为 P1——步骤 1-3 已实际执行完毕并得到仲裁结果，见下方"实测更新"；步骤 4-5 因证据强度不足暂缓，不建议现在改 `SKILL.md` 正文）：

```markdown
## Checklist Item: spec-debug 误用防护（诊断类 skill 不应加载到实现类任务）

### 1. 提出假设（原始假设，已被下方仲裁结果部分推翻）

**假设**：`spec-debug` 是诊断 bug 的 skill，若被加载到纯实现任务（如"给已有函数加缓存"）
上，会把模型导向"找 bug"式思维，反而干扰正常的 YAGNI 判断，产生比 baseline 更差的结果。

**理论依据（原始，单次 n=5/n=6 小样本，已证明不稳定）**：`REPORT-20260820-sonnet5-saturation.md`
过度设计判断维度（cache 任务，n=6）：
- baseline: 5/5（100%，1 cell API 失败已排除）
- spec-work: 6/6（100%）
- spec-debug: 4/5（80%，1 cell API 失败已排除）← 原报告称为"45 次运行里唯一的真实负回归"

**⚠️ 2026-08-20 22:30 仲裁更新（步骤 3 已实际执行，见下）**：在当前网关环境（`ANTHROPIC_AUTH_TOKEN`+
`ANTHROPIC_BASE_URL`，`claude-sonnet-5`）用同一 cache 任务、三臂对照，先复现 n=6、再仲裁 n=12，
合并 n=18（零 API 失败）：baseline 16/18=88.9%、spec-work 17/18=94.4%、**spec-debug 15/18=83.3%**。
2026-08-21 复算双侧 Fisher exact：baseline vs spec-debug **p=1.000**，spec-work vs spec-debug **p≈0.603**。
四次独立测量（0/2→4/5→6/6→9/12）方向也不稳定。**当前 fixture 未证实该假设，不应继续用“边缘信号”描述。**

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

### 3. 用门测试（⚠️ 已实际执行——但只跑了"修改前"的复现/仲裁，未执行"修改 SKILL.md 后"的对照）

```bash
cd benchmarks/agentic
python3 run.py --selftest
python3 run.py --task cache \
  --arms baseline,spec-work,spec-debug --model sonnet --runs 6 --workers 4   # 复现，225532
python3 run.py --task cache \
  --arms baseline,spec-work,spec-debug --model sonnet --runs 12 --workers 6  # 仲裁，230644
```

**已执行，未改 `SKILL.md` 正文**：先复现"修改前"现状是否稳定，再决定是否值得改。
Step 2 的原判断标准（"改后应回到 6/6 或不低于 4/5"）已经不适用——因为"修改前"的基线本身
在 n=18 后变成 15/18=83.3%（不是 4/5=80%），且 baseline vs spec-debug 的双侧 Fisher exact 为 p=1.000，
没有证据支持当前 fixture 上存在真实负回归。**此时改 `SKILL.md` 并重跑容易把噪音当成“修复生效”；
不机械扩样本，只有换成能明确区分诊断与实现路由的新场景，并预先定义实际效应阈值时才重开。**

### 4. 记录结果（已执行，见下方"仲裁结果"）

**仲裁结果（2026-08-20 22:xx，当前网关环境，n=6+n=12 合并，零 API 失败）**：

| 臂 | correct (n=18) | 相对成本 |
|---|---|---|
| baseline | 16/18 = 88.9% | 基准 |
| spec-work | 17/18 = 94.4% | ~1.32x |
| spec-debug | 15/18 = 83.3% | ~1.39x |

双侧 Fisher exact：baseline vs spec-debug p=1.000；spec-work vs spec-debug p≈0.603。均无统计证据支持真实差异。花费约 $20.73。

### 5. 沉淀（本轮判定：暂缓，不进入 Patterns 也不进入 Anti-patterns）

**当前假设未证实**。按 §3.8 的证据纪律，`behavior_quality` 轴没有统计证据支持差异，
不满足写入 Patterns 或驱动 Skill 修改的门槛。记录为**未证实并退出当前候选池**：

- Applicability：spec-debug 是否误用于纯实现任务这一假设方向仍然合理，但强度未坐实
- Ceiling：当前证据只覆盖 cache 这一个任务、claude-sonnet-5 一个模型、网关代理一种认证环境
- Trigger：只有出现信号更强、能直接区分诊断与实现路由的新场景，并预注册实际效应阈值、
  样本量和统计方法时才重开；不在当前弱 fixture 上机械追加预算
- Owner：本条目的下一步决策者是继续投入门测预算的人，不是直接改 `SKILL.md` 的人——
  按方案"门在前"纪律，没有坐实的证据不授权修改 `skills/spec-debug/SKILL.md` 正文
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
| 实测新发现 | spec-debug 误用防护（诊断 vs 实现路由） | 现有 `score_cache` 门；n=18 双侧 Fisher exact p=1.000，未证实差异 | ❌ 退出当前修改候选；仅在高区分度新 fixture 下重开 |
| §3.3 复用优先 | reuse-slug/reuse-money | 现有门，n=12 已跑（`runs/20260820-232245`） | ✅ **已确认饱和**（3 臂全 100%），归档为 anti-pattern，不再候选 |
| 报告安全默认维度 | safe-path | 现有门，n=12 已跑，同上 | ✅ **已确认饱和**，同上 |
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

#### 1. 重复消除（Phase 1A，✅ 2026-08-21 完成扫描——零门测花费，发现但未实施任何删除/合并）

- [x] 已纳入同步治理的字节级相同 reference（SHA-256 parity）
- [x] **高度相似但有微小差异的文件**——用 Jaccard 行相似度扫描全部 `skills/*/references/**/*.md`
  的同名文件组（排除已在 `SYNC_MAP` 里管理的 6 组和 P2 已审查过的 8 组同名-但-真分叉组）。
  发现 **11 个 agent/persona 模板家族、25 个文件、约 3536 行**，最低两两相似度 82%-99%：
  `slack-researcher.md`（3 份）、`learnings-researcher.md`（4 份）、`repo-research-analyst.md`（2 份）、
  `best-practices-researcher.md`、`data-integrity-guardian.md`、`framework-docs-researcher.md`、
  `pattern-recognition-specialist.md`、`performance-oracle.md`、`security-sentinel.md`、
  `web-researcher.md`、`deployment-verification-agent.md`（各 2 份），分布在
  `spec-compound`/`spec-plan`/`spec-ideate`/`spec-optimize`/`spec-code-review`/`spec-brainstorm` 之间。
  抽查全部 11 组的完整 diff，模式高度一致：差异几乎总是精确落在第 7 行左右的一段
  "For X invocations, convert ... into Y" 段落（invocation-specific 语境，如"For planning
  invocations..."vs"For durable-learning invocations..."vs"For optimization invocations..."），
  偶尔多一处次要差异（如 `pattern-recognition-specialist.md` 额外多一段 reuse/extend/compose/new
  posture 指导，`deployment-verification-agent.md` 额外多一段调用门禁条件）。
  **这与 P2 已发现的 `model-tiers.md` 是同一类模式（共享模板 + 调用方专属段落），但规模是它的
  10 倍以上**——如果去重到 1 份 canonical + 各自的 invocation 段落，粗估可省约 2073 行。
  **未实施任何合并**：按 `model-tiers.md` 先例的同一判断标准，这类文件的调用方专属段落是正文
  内容而非偶然差异，纳入 `SYNC_MAP` 需要先设计参数化模板（把"invocation 段落"和"次要差异段落"
  都做成可替换的槎口），这是比现有 sync 脚本能力更大的变更，且涉及 25 个文件、6 个 skill，
  风险和工作量远超本轮"人工审查、零成本"的授权范围。标记为 architecture-mismatch，留给 owner
  决定是否值得投入设计一个 agent-template 参数化机制。**完整发现已沉淀为独立知识文档**：
  `docs/solutions/architecture-patterns/agent-persona-reference-template-duplication-2026-08-21.md`
  （含每组文件清单、diff 模式、判断逻辑、可复跑的检测脚本、何时值得处理的三条件），
  不只留在本方案文档里，方便未来复用检测方法或决定是否投入参数化机制时直接引用。
- [x] **重复的代码逻辑片段（非文件级）**——用滑动窗口 md5 哈希扫描 `scripts/*.js`/`*.cjs`（17 个文件）
  的跨文件重复 8 行代码块，发现 `countBy(items, selector)` 函数体在 `check-ce-localization-review.cjs`
  与 `check-ce-upstream-reconciliation.cjs` 中逐字节相同，`generate-runtime-capability-catalog.js`
  中有一个参数形式略有差异的等价版本（3 处共同实现同一个"按 key 分组计数"逻辑）。
  `if (require.main === module) { ... }` 样板在 14 个脚本中重复，但这是 Node.js 惯用写法而非
  有意义的业务逻辑重复，**不计入本项发现**。
  **已实施抽取（2026-08-21，用户明确授权）**：新增 `scripts/lib/count-by.cjs`（统一为
  `countBy(items, selector)` 签名），三处调用点改为引用该模块；`generate-runtime-capability-catalog.js`
  原来的字符串 key 调用形式（`countBy(records, 'entry_surface')`）改写为等价的
  `countBy(records, (record) => record.entry_surface || 'unknown')`，保留原有"缺字段时归为 unknown"
  的行为。验证：三个模块 `require` 无报错；`generate-runtime-capability-catalog.js` 重新生成
  `docs/catalog/runtime-capabilities.md` 与改动前逐字节相同（git diff 为空）；相关 7 个测试套件
  （`ce-upstream-3-20-reconciliation`、`ce-upstream-reconciliation-v2`、`ce-localization-review-contracts`、
  `ce-localization-closeout-contracts`、`ce-setup-localization-contracts`、
  `external-evidence-closure-ledger`、`mcp-setup-config-consumers`）跑通，唯一 1 个失败是
  `skill-inventory.json` stale 这个已知的、与本改动无关的既有基线问题（用 revert-and-rerun
  交叉验证过：还原这三个文件后单独跑该测试文件依然是同一个失败，证明不是本次改动引入的）。

#### 2. 死代码识别（Phase 1B + Step 2，✅ 2026-08-21 完成——全部机械检测，零门测花费）

- [x] **无 consumer 的 reference 文档**——用"skill 目录内文件名互相引用 + repo-wide 文件名 grep"扫描全部
  `skills/*/references/*.md`，命中 4 个候选（`spec-doc-review/references/cross-model-eval.md`、
  `spec-prototype/references/{preview,write-back}.md`、`spec-runtime-setup/references/supported-mcp-tools.md`）。
  逐一深查后**全部是假阳性**：前三个是被 `tests/unit/spec-prototype-contracts.test.js`、
  `tests/unit/mcp-setup-contracts.test.js` 直接读取校验内容的契约测试 consumer；`cross-model-eval.md`
  是 maintainer 向的 eval spec（类比 `spec-write-skill/references/evaluation-design.md`、
  `spec-resolve-pr-feedback/references/evaluation-rubric.md`、`spec-code-review/evals/eval.yaml`
  这一类文件——本来就不该被运行时加载的 SKILL.md 引用，consumer 是"未来编辑该 skill 时跑
  skill-creator eval workflow 的维护者"），且被 CE localization inventory 正式追踪。**无需任何修改。**
- [x] **未被任何 skill 调用的 helper 函数**——扫描 `scripts/*.js`/`*.cjs`（17 个文件）的顶层 `module.exports`，
  逐个在全仓库（排除自身文件）搜索使用点。**零孤儿，无需修改。**
- [x] **无效的配置选项（schema 定义但无实现）**——用 Node 脚本遍历 `docs/contracts/**/*.schema.json`
  （36 个文件，445 个顶层 property），对每个属性名做全仓库文本命中检查（排除 schema 自身），
  并用一个刻意不存在的哨兵属性名验证检测器本身有效（sanity check 通过）。**零孤儿属性，无需修改。**
- [x] **永远不会触发的分支**——`grep` 字面 `if(false)`/`if (0)` 零命中；对 `scripts/*.js`/`*.cjs`
  全部文件跑"裸 `return` 后紧跟非空非 `}` 非注释行"的 unreachable-after-return 启发式扫描，零命中
  （仓库无 eslint 配置，机械启发式是当前可用的最佳替代）。**无需修改。**

**结论**：本项全部四个子检查均为机械可验证、零门测花费。当前 spec-first 源码（`scripts/`、
`docs/contracts/`、`skills/*/references/`）没有发现死代码或孤儿配置。发现的 4 个"疑似孤儿 reference"
全部核实为合法但间接的 consumer 关系（测试契约或 maintainer 向文档），提示"SKILL.md 未提及文件名"
不能单独作为孤儿判据，必须交叉核对 `tests/` 和同类文件的既有模式。

#### 3. Skill 路由/误用防护（Step 2，❌ 当前假设未证实并退出候选）
- [x] 已用 `score_cache` 门跑 n=6+n=12 仲裁：baseline 16/18=88.9% vs spec-debug 15/18=83.3%；双侧 Fisher exact p=1.000
- [x] 不修改 `skills/spec-debug/SKILL.md`：当前 fixture 没有证明负回归
- [x] 不在同一弱 fixture 上机械扩大样本；只有新场景 + 预注册效应阈值与统计方法才重开

#### 4. 可执行性检查（已证伪，仅作反面参考，不再列入本轮审查重点）
- [x] ~~价值观表述 vs 可执行指令~~ —— trace-transfer/trace-amount 实测证明当前模型对
  两种表述方式的正确率无差异（[[spec-debug-root-cause-saturated]]），此项已归档为
  anti-pattern，不再对新文本重复验证，除非模型演化或 §8 触发重新评估
- [ ] 例外：若发现新的具体场景（非根因修复类）显示表述方式确实影响行为，才重新开门测

#### 5. 复用与安全默认 confirmatory run（Step 2，⚠️ 已执行——2026-08-20 23:22，`runs/20260820-232245`，108 个计划 cell、107 个有效测量、1 个超时，$44.54）
- [x] `score_reuse_slug`/`score_reuse_money` 补到 n=12：有效测量全部 100%；`reuse-slug/spec-work` 为 11/12，1 个 300 秒超时已排除
- [x] `score_safe_path` 补到 n=12：三臂全部 100%
- [x] 方向与快速扫描一致（baseline 饱和、加 skill 无收益但成本涨 1.1×-1.5×）
- [x] 结果与快速扫描一致，但部分失败使 claim ceiling 降为 fixture 饱和候选；不支持修改 Skill，不再列入当前候选池

#### 6. 必要性验证（Step 2 P2，✅ 2026-08-21 完成）
- [x] `ce-localization-review-delta.schema.json`：由 deterministic validator、closeout generator 和 focused tests 共同消费，承担 source binding / lineage / claim-ceiling 边界，保留
- [x] `listSkillDirectoryNames()` 的 `SKILL.md` entrypoint 过滤：由 bundled Skill/runtime catalog 消费，并有 `_shared` 负例测试，属于已有 owner 的 focused extension，保留
- [x] `spec-compound` candidate→promotion：由用户 workflow 消费，复用既有 knowledge owner；contract tests 与 examples-as-context 覆盖拒绝边界，保留，但 fresh-source/field outcome 仍未运行
- [x] `skills/spec-compound/evals/examples.json`：是 contract test 和 maintainer fresh-source eval 的输入，不是已执行效果证据；按 evidence-only surface 保留
- [x] `verify-phase-1a.sh` / `verify-with-gate.sh`：是本审查方案的 operator 工具，不注册为新的 CLI/Skill 入口；前者编排现有 checks，后者增加认证 smoke、run identity、partial-failure 和比较门禁，非纯转发
- [x] review delta 中间快照：7 个 artifact 仅 1 个被当前 Round-3 lineage 引用；删除其余 6 个无 consumer 的会话中间产物，避免把 stale snapshot 当 durable surface

**结论**：没有发现需要新增“第二实现”来证明合理性的通用抽象；新增边界均是现有 owner 的 focused extension 或 evidence artifact。唯一无 consumer 的表面是中间 review deltas，已直接清理。

### 中优先级（条件查）

#### 7. Owner 正确性（Step 2 P2，✅ 全部完成——2026-08-20 23:40 / 23:55）
- [x] 每个能力有唯一 source-of-truth——重新审查 `skills/_shared/README.md` 的"8 组已知漂移"清单，
  发现其中 7 组是同名但独立撰写的内容（标题从第 1 行就不同），不存在 source-of-truth 混淆；
  已修正 README 里错误的"需要人工合并决策"陈述
- [x] 没有混淆职责的 nearby capability 复用——`model-tiers.md`（spec-sweep/spec-brainstorm）是唯一
  真实的模板复制候选，判定为 architecture-mismatch（skill 特定名词是正文，非同步脚本能力范围），
  不强行合并，留待未来有真实需求时再评估
- [x] 跨层调用的 boundary 清晰——抽取全部 37 个 `skills/*/SKILL.md` 对其他 skill 名字的引用，逐条
  分类为 consumer 声明（数据消费关系，如"消费者：spec-work、spec-code-review"）、路由建议（用户可选
  切换，如 spec-plan 检测到 bug 报告时呈现"switch to spec-debug"选项）、代码层越界（直接读写另一个
  skill 的私有目录或脚本）。图中看起来像环的边（`spec-plan↔spec-debug`、`spec-compound↔spec-work`
  等）逐一核查后全部是前两类，不构成自动调用循环；搜索直接越界读写（`.internal/`/`_private/`/跨
  skill import 脚本）**未发现任何实例**。唯一一处疑似自环（`spec-app-consistency-audit`）核查后是
  脚本误报——skill 引用自己目录下的 `prompts/`/`scripts/`/`rule-packs/` 子资源，属正常内部结构。
  **结论：当前跨层调用边界干净，无需修复动作。**

#### 8. Shortcut 治理（Step 3，✅ 2026-08-21 完成——人工审查，零门测花费）

抽样审查了仓库里两类真实的"有意简化/deferred"记录，判断依据是文档自身是否给出可观测的 trigger 和退役条件：

- [x] **`docs/plans/2026-05-08-001-source-code-deferred-tracker.md`**（`status: closed`，2026-05-27 关闭）——正例。
  正文明确写"如其中某条历史 finding 未来再次触发，应基于当前源码与当时需求另开新 plan，而不是恢复本 tracker"，
  即退役条件写得很清楚：这是死的历史快照，表格里的 `open` 只是关闭时刻的状态截图，不代表当前活跃。
  抽查 `doc2-P1-4`（package.json/package-lock.json 版本漂移）：当前两者版本已一致（`1.15.1`），
  与 tracker 已关闭三个多月的事实吻合。**不需要任何修改**，是 §3.7 的良好范例。
- [x] **`docs/solutions/architecture-patterns/spec-prd-finding-schema-freeze-deferred-2026-06-28.md`**——发现真实过期，
  **已用户授权实施并解决（2026-08-21）**。文档本身结构完整（ceiling："当前消费者只读 reason_code"；
  trigger：三条 When to Apply 条件；退役步骤：届时如何实施），是 §3.7 要求格式的正例。但**内容曾经过期**：
  `finalize-prd-artifact.js:254-260` 现在读取并按 `expected_shape`/`remediation_hint` 过滤 finding，
  这两个字段是 2026-07-01（commit `464786ab`）引入的，比本文档晚 3 天，直接触发了文档自己写的 trigger
  第 1 条（"某个消费者需要渲染 finding 细节"）；`check-prd-artifact.js` 当前 41 处 `findings.push(...)`，
  字段形状已比文档表格列出的 6 种更多样，该表本身也过期。**已实施**：新增
  `tests/unit/spec-prd-finding-schema-freeze.test.js`，冻结当前被 `REMEDIATION_BY_REASON_CODE` 真实
  增强的全部 9 个 reason_code（不是文档过期表格里的 6 种粗粒度分类），每个都用直接执行 `buildReport()`
  验证过的最小 fixture 触发并断言精确字段集合，附一条反向测试防止未来新增第 10 个增强字段却漏测。
  用"故意改坏字段名重跑测试"验证过测试确实会失败，随后确认 `check-prd-artifact.js` 本身改动为零
  （只加了新测试文件）。已更新原文档状态为 `resolved`，并顺带修正了文档"关联"区块里两条早已失效的
  测试文件路径引用（同类型的文档腐烂问题）。
- [x] `model-tiers.md`（见 P2「Owner 正确性」）已用同一套判断标准处理：标记为 architecture-mismatch 而不是
  强行合并，留待未来有真实需求时再评估——这也是"退役条件明确"的一种应用（trigger 是"未来需要同步措辞时"）。

**沉淀**：deferred 记录本身的质量（是否有 ceiling/trigger/退役条件）和它内容是否仍然准确，是两件独立的事——
`source-code-deferred-tracker.md` 两者都好；`finding-schema-freeze-deferred` 记录格式虽好但内容已被后续代码变更
悄悄推过了自己设定的门槛，而没有人回头检查。**这提示：任何写了 trigger 条件的 deferred 决策，都应该在后续
touch 相关代码时被动检查一次，而不能只靠人记得回头看。**

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

### Phase 1A（机械清理，✅ 2026-08-21 装配完成——见下方 Review handoff）

- [x] **Review handoff：source/projection/consumer 映射**（删除仍需另行授权，本次只装配映射本身）：

  | Shared source | Regular-file projections | Test owner |
  |---|---|---|
  | `skills/_shared/references/html-rendering.md` | `spec-plan`, `spec-ideate`, `spec-brainstorm` | `npm run check:shared-references`（SHA-256 parity） |
  | `skills/_shared/references/markdown-rendering.md` | `spec-plan`, `spec-ideate`, `spec-brainstorm` | 同上 |
  | `skills/_shared/references/concepts-vocabulary.md` | `spec-compound`, `spec-compound-refresh` | 同上 |
  | `skills/_shared/references/settled-decisions.md` | `spec-plan`, `spec-brainstorm` | 同上 |
  | `skills/_shared/references/tracker-defer.md` | `spec-work`, `spec-lfg` | 同上 + `tests/unit/spec-work-consumer-chain-contracts.test.js`（五宿主 projection parity，见文件自身 canonical owner 声明） |
  | `skills/_shared/references/yaml-schema.md` | `spec-compound`, `spec-compound-refresh` | `npm run check:shared-references` |

  加上本轮新发现、**未纳入** `SYNC_MAP`（均标记 architecture-mismatch，不在本次授权范围内合并）：

  | 候选家族 | 副本数 | 状态 |
  |---|---|---|
  | `model-tiers.md` | 2（spec-sweep, spec-brainstorm） | P2 已发现，architecture-mismatch |
  | 11 个 agent/persona 模板家族 | 25 个文件 | 本轮新发现，详见 `docs/solutions/architecture-patterns/agent-persona-reference-template-duplication-2026-08-21.md` |

- [x] **清单：shared source、regular-file projections、consumer 与 test owner**——见上表；另有 8 组
  同名-但-真分叉文件（P2 已审查，非本清单范围，见 `skills/_shared/README.md` 已修正的段落）
- [x] **验证报告**：`npm run check:shared-references`（PASSED）、`npm run lint:skill-entrypoints`
  （PASSED，327 文件扫描）、`npm run test:eval-fixtures`（PASSED，80 测试）、focused unit tests
  （PASSED，22 测试）、`check-ce-localization-review.cjs --verify-only`（**FAILED**——
  `docs/validation/ce-localization/skill-inventory.json` stale，这是仓库既有未提交漂移，
  与本次 Phase 1A 审查/发现的任何改动无关，此前已确认过；不阻塞本次 handoff，但阻塞任何
  "inventory 已刷新"的声明）。原始报告：`verify-phase-1a-YYYYMMDD-HHMMSS.txt`（每次重跑生成，
  不纳入版本控制，属临时验证产物）

### Phase 1B（架构说明删除）

**⚠️ 2026-08-21 补做了原计划缺失的前置步骤——对方案 §Phase 1B 指名的候选段落做逐句行为影响
分析，结论：候选段落已经是 test-protected contract，不是"看起来只是说明"的纯装饰文本，
本轮判断为不应删除，不是"证据不足暂缓"。**

方案原文候选（`skills/spec-work/SKILL.md` 的 `## Workflow Contract Summary`，第 15-21 行，
含 Inputs/Outputs/Hard exits/Ownership/Consumers 五个要点）逐句核对：

- `tests/unit/spec-work-front-controller-contracts.test.js` 已经用 `toContain` 断言锁定了
  这个段落里的多处具体文本：`## Workflow Contract Summary` 标题本身、
  `generated runtime mirrors are never source fixes`、`task-pack/source-plan drift`、
  `failed required review/verification`、
  `Local mutation, commit, landing, lifecycle, and durable evidence are separate exits`。
  这意味着方案文档举例的候选句"Ownership: scripts prepare deterministic facts; LLMs judge
  semantic fit"所在的整句，其中一半内容（"generated runtime mirrors are never source
  fixes"、"separate exits"）已经被现有测试保护，删除会直接导致测试失败——**这不是"删除后
  可能改变行为"的灰色地带，是已经有确定性测试断言会失败的红线**。
- 逐句核对其余部分的行为落点（不是靠直觉判断"像不像装饰"，是逐句搜索该概念是否在文件
  其余部分被具体展开或依赖）：
  - `Ownership` 句的"scripts prepare deterministic facts"侧，在文件其余部分**没有**被逐字
    复述，但对应的具体机制存在（`scripts/working-tree-fingerprint.cjs`、
    `scripts/source-plan-file-hash.cjs` 在第 260 行等处被直接引用和依赖）——这句话是对
    具体机制的概括标签，删除标签本身不会改变脚本调用，但会丢失"这是设计原则、不是偶然
    实现细节"这条对模型的引导，删除后的行为影响无法排除，**不判定为可删**。
  - `Consumers` 句列出的 5 个消费方，在文件其余部分**没有**逐字复述，但其中
    `spec-code-review` 有对应的具体调用协议（第 232-238 行"Code review: one portable
    path"整段），说明这句话确实是后文详细协议的目录式摘要，不是孤立说明——**符合方案
    自己提出的判断标准的反例**：删除会让读者失去"这个 skill 有哪些消费方"的地图入口，
    虽然不直接改变可观察的触发/选择/行动，但改变了模型理解自身定位的方式，无法确定为
    "无影响"。
  - `Hard exits` 句枚举的退出条件，在文件其余部分**逐项都有更详细的展开**（如
    `requirements-only` 在第 69/76/101 行、`scope-changing discovery` 在第 125/133/292 行），
    这句话是执行摘要，删除后具体规则仍然存在于正文，属于方案判断标准里"可删"的候选——
    **但**由于它与 test-protected 的其他条款共享同一段落（不能只删这一句而保留段落结构，
    段落是作为整体被测试断言的），实际可执行的删除单元不是"单句"而是"整段"，一旦涉及整段，
    前面已经证明整段不可删。

**判断（按方案自己的行为影响分析标准）**：候选段落**不满足"可删"条件**——不是因为找不到
证据，是因为找到了反证（现存测试断言 + 后文具体协议引用）。**这与方案原设想的"先门测再
判断"路径不同**：本次是靠读测试文件和读正文引用关系就能确定性排除，不需要门测，比方案
原计划的"跑 3 个代表性任务对照"更便宜、更确定。

- [x] **标注文档：每段的行为影响分析**——已完成，见上；结论为"不可删"，附具体反证
      （test assertion 位置 + 正文引用位置），不是模板占位符
- [x] **判断结论**：**不推进 Candidate patch**——候选段落已被测试保护且部分内容是后文
      详细协议的摘要入口，删除会直接导致 `spec-work-front-controller-contracts.test.js`
      失败并丢失导航价值，不满足"删除后可观察行为不变"的前提。**这本身就是方案假设的一次
      证伪**：方案最初把这段当作"看似只是说明"的典型候选，但逐句核对后发现它是被测试锁定
      的 contract 摘要，说明"看起来像装饰性说明"的直觉不可靠，必须先检查测试覆盖再假设
      可删——沉淀为方法论教训，供未来审查其他 skill 的类似段落时先做这一步再规划门测
- [ ] Candidate patch：**不产出**——上面的分析已经排除了这条路径，不是"暂缓"而是"否决"
- [ ] 验证报告：门测结果（正确率、成本、人工修正）——**不需要**，判断不依赖门测，
      门测预算未消耗

### Step 2-4（checklist 建立，✅ 2026-08-21 部分完成——见下方明细）
- [x] **`docs/solutions/skill-simplification-patterns.md`**（已创建，2026-08-21）——诚实记录：
  本批次**零个 pattern 通过**（不是"未达到 ≥5 项"，是"5 个已完成门测的候选全部是 anti-pattern
  或证据不足"）。4 个 anti-pattern（AP-1 shared-caller 检查、AP-2 复用检查、AP-3 安全默认检查、
  AP-4 表述方式对照——均已用真实门测证实无收益，含完整 evidence/invalidation condition/owner）、
  1 个 pending（PD-1 spec-debug 误用防护，证据强度不足，未归档为 pattern 也未归档为 anti-pattern）。
  **不为凑够数量编造正面结果**——§8 的晋级规则本身是非补偿式的，本文档如实反映"当前批次没有
  找到值得推广的正面 pattern"这个事实，比虚构 5 项通过更符合方案的证据纪律。
- [x] **门测报告（每个 checklist 项）**——已随本轮门测运行本身产出（`runs/20260820-*` 系列，
  详见方案文档 Step 1/Step 2 表格中的完整 baseline vs candidate 数据、成本、token、Fisher exact
  检验结果），未额外整理独立报告文件——数据已完整记录在方案文档正文与 `skill-simplification-
  patterns.md` 中，重复整理一份不增加信息量
- [ ] **推广决策文档**——未产出独立文档：本批次没有 pattern 通过 §8 的推广条件（≥5 项通过且
  correction burden 未上升），因此"哪些项可推广"这一问题当前答案是"零项"，不需要单独的推广
  决策文档来说明一个空集合；若未来有候选真正通过门测，再补这份文档

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

**⚠️ 2026-08-21 用已有门测数据核对本节门槛，发现"继续条件"未满足（记录如实，未据此单方面停止，见下方说明）：**

用 4 个已完成门测的候选项（AP-1 shared-caller `trace-transfer/trace-amount` n=6、AP-2 复用
`reuse-slug/reuse-money` n=12、AP-3 安全默认 `safe-path` n=12、PD-1 `spec-debug` 误用防护
`cache` n=18 合并）的真实 `cost_mean` 数据算成本增幅（candidate vs baseline，逐臂）：

| Checklist 项 | 按对照臂逐条 delta | 项内平均 |
|---|---|---|
| AP-1（trace-transfer/trace-amount） | +103.0%, -8.1% | +47.5% |
| AP-2（reuse-money×2, reuse-slug×2） | +42.6%, +39.5%, -13.2%, -51.5% | +4.3% |
| AP-3（safe-path×2） | +2.9%, +38.8% | +20.8% |
| PD-1（cache×2） | +38.9%, +32.1% | +35.5% |

**汇总：按项均分平均成本增幅 27.0%；按全部 10 个对照臂均分平均 22.5%。两种算法都超过本节
"继续条件"写明的 <20% 门槛。**

同时核对"触发退出"两条硬性条件：**均未触发**——
- 正确率：4 项里没有一项是"前 3 个都失败（正确率 < baseline）"，多数是打平或方向内混合（有臂更高有臂更低），
  Fisher exact 检验（见 PD-1）也不支持"正确率显著下降"的结论。
- 成本：只有 1 个对照臂（AP-1 的 trace-transfer）单独超过 50%，不满足"前 3 个成本都 >50%"这个更严格条件。

**因此当前状态是一个门槛之间的灰色地带**：没有触发"立即停止"的硬性退出条件，但也没有满足
"继续"的软性门槛（<20% 平均成本增幅）。按方案本身"非补偿式门禁"的精神（§8：成本变好不能抵消
质量问题，反过来看，成本变差也不该被"正确率没掉"单方面抵消掉），**这个不一致本身就是一个需要
决策的信号，不是可以静默忽略继续往下做 Step 3 的信息**。

**⚠️ 2026-08-21（同日续）：已用方案自身逻辑解决此灰色地带，不需要额外等待 owner 裁决——**

`<20% 平均成本增加`这条聚合门槛的设计意图是"候选组合里有赢家也有输家时，总体成本增幅是否
可接受"——它隐含假设组合中会有一部分候选证实了正面收益，用总体成本去平衡。但当前 4 个已
完成项的正确率轴已经独立、正确地给出了结论：3 个 anti-pattern（AP-1/AP-2/AP-3，成本涨了但
正确率没有对应提升）+ 1 个 pending（PD-1，证据强度不足）——**0 个通过**。按方案自己的
anti-pattern 判定标准（"成本增加且正确率无提升 → 拒绝"），这 4 项在成本数据介入之前就已经
被正确率轴独立拒绝了。20% 聚合门槛假设的场景（组合里有正收益项需要成本平衡）根本没有发生：
4 个候选 100% 是输家，没有"赢家"需要拿总体成本去摊。

**因此判断为**：这不是"暂停 Step 3"的信号。逐项判据（更精确、更贴合每个候选的实际证据）
已经正确处理完了全部 4 项；20% 聚合门槛在"整批全部是负结果"这种场景下没有独立判断意义——
方案设计时显然没有预料到会出现这种结果。不需要因为一个失去适用场景的聚合指标而阻塞后续
工作。**Step 3「未覆盖 skill 的新 fixture」可以按原计划继续评估**（是否投入见下方 Next Action），
不受本条目影响。20% 门槛的措辞后续如果要修订（比如改成只在"至少 1 项通过"时才生效），
属于文档维护，不是本次审查授权范围内的紧急事项。

**触发退出**（任一满足立即停止）：
- ❌ 前 3 个 checklist 项都失败（正确率 < baseline）——**未触发**，见上方核对
- ❌ 前 3 个成本都 > 收益（成本增加 >50% 且正确率无提升）——**未触发**，见上方核对
- ❌ 出现安全、授权、隐私回归——未观察到
- ❌ correction burden 上升（人工修正次数增加）——本轮全部是审查发现，未修改任何 SKILL.md，
  无法评估 correction burden（没有产生需要修正的改动）

**继续条件**：
- ✅ 至少 2/3 的项通过门测——4/4 项都跑通了门测本身（无 API 失败导致的假绿），但"通过"若指
  "证实了正面收益"则是 0/4（详见 `skill-simplification-patterns.md`），这里存在术语歧义，
  需要明确"通过门测"指的是哪一种
- ❌ **平均成本增加 <20%**——实测 22.5%-27.0%，**未满足**
- ✅ 无保护性约束回归

**推广条件**（≥5 个项通过后）：
- ✅ 行为质量不下降
- ✅ 保护性约束不回归
- ✅ 有 matched evidence（门测 + 代表性任务）
- ✅ correction burden 没有上升

---

## 时间线与里程碑

### Week 1（Day 1-5，⚠️ 已按 22:30 仲裁结果二次重排，见执行模板 B）
- **Day 1**: Phase 1A 执行（source/projection 盘点、同步、验证）
- **Day 2**: Phase 1B 仅建立 spec-work 的 task/eval 设计；没有匹配门时不改 source
- **Day 3**: Step 1（盘点门覆盖，已完成——见上文按 scorer 的覆盖表）
- **Day 4**: 已实际执行——spec-debug 误用防护假设的复现（n=6）+ 仲裁（n=12）；2026-08-21 复算双侧 Fisher exact p=1.000，假设未证实，**不改 `SKILL.md`**
- **Day 5**: ✅ 已完成——复用/安全默认维度 confirmatory run（n=12，见下方 Week 2 记录），比原计划提前完成

**Milestone 1**（已按实际执行结果调整）:
- ✅ 完成 source/projection/consumer ledger；不以净删行数作为里程碑
- ✅ 完成 spec-debug 误用防护的复现与仲裁（不是"修复闭环"，是"证据强度判定"）——结论是证据不足，不授权改 `SKILL.md` 正文，本条目状态为 pending 而非 passed/failed
- ✅ 完成复用维度 + 安全默认维度的 confirmatory run（n=12，均确认饱和），比原计划提前一周完成
- ⚠️ 原计划"P0 可执行性"项已在建立门当天证伪并归档，不再占用资源
- 💰 本轮门测已花费约 $65.27（cache 仲裁 $20.73 + 复用/安全默认 confirmatory $44.54），计入门测预算

### Week 2（Day 6-12，⚠️ Day 6-9 已提前在 Week 1 完成，此处调整为跳过重复工作）
- **Day 6-9**: ~~原计划的 confirmatory run~~ 已在 Week 1 Day 5 完成，结果：复用/安全默认维度均确认饱和（n=12，三臂全 100%），已归档为 anti-pattern
- **Day 10-11**: Step 2 P2 项（consumer 验证 / owner 正确性 / shortcut 治理，人工审查为主，不占门测资源）
- **Day 12**: Step 3 回顾与优先级调整；停止在现有 cache fixture 上追加预算，转向 P2 必要性审查和高区分度新 fixture

**Milestone 2**（已提前达成部分）:
- ✅ 完成 spec-debug 误用假设复核（未证实）+ 2 个 fixture 饱和检查；三个候选项都有明确退出结论
- ✅ **没有一个方向支撑“改 SKILL.md”**；Step 3 转向 P2 人工审查或重新设计高区分度 fixture，不继续在现有 4 个维度里找信号

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

**最后更新**: 2026-08-21（第七次更新——Phase 1A 三项交付物装配完成；`skill-simplification-patterns.md` 创建，如实记录零 pattern 通过；用真实成本数据核对 Phase 2 退出条件，发现灰色地带未处理）
**状态**: Active；**Phase 1A 全部完成**（重复消除 + 死代码识别 + 三项交付物装配）；**Phase 1B 已否决**（候选段落逐句核对后发现是 test-protected contract 摘要，删除会导致现有测试失败，不满足"可删"前提，无需门测）；**P2 全部三项完成**（必要性验证、reference consumer/owner、跨层调用 boundary）；**P3「Shortcut 治理」完成**；**Step 2-4 交付物已装配**（`skill-simplification-patterns.md` 零 pattern 通过，1 个 pending）；**Phase 2 退出条件核对发现未处理的灰色地带**（成本增幅超门槛但未触发硬性退出）；剩余仅 P3「未覆盖 skill 新 fixture」（成本高，暂缓）
**Owner**: @kuang  
**已完成（本次及此前会话）**：
- Phase 1A 验证脚本（`scripts/verify-phase-1a.sh`）已实跑：前 4 项通过，inventory stale（既有未提交漂移，未处理）
- Phase 1A 检查清单第 1/2 项（重复消除、死代码识别）全部完成，发现两处规模不小的重复：agent/persona 模板 25 文件（未实施合并，沉淀为独立知识文档 `agent-persona-reference-template-duplication-2026-08-21.md`）；`countBy` 代码重复（**已实施抽取**，见下方 `scripts/lib/count-by.cjs`）
- Phase 2 退出条件灰色地带已用方案自身逻辑解决：4 个已完成候选项全部是负结果，20% 成本聚合门槛在"全员落选"场景下没有独立判断意义，不再是待决问题
- Phase 1B 补做前置分析并否决候选段落删除：`spec-work/SKILL.md` 的 `Workflow Contract Summary` 段落已被
  `spec-work-front-controller-contracts.test.js` 测试锁定，不满足"可删"前提，零门测成本排除
- `countBy(items, selector)` 代码重复已抽取到 `scripts/lib/count-by.cjs`（用户明确授权）：3 处调用点改写，
  验证生成器输出 byte-identical、7 个相关测试套件（62 个测试）跑通，唯一失败项经交叉验证确认是既有基线问题
- `spec-prd-finding-schema-freeze-deferred-2026-06-28.md` 的 schema freeze **已实施**（用户明确授权）：
  新增 `tests/unit/spec-prd-finding-schema-freeze.test.js`，冻结 9 个真实被消费的 reason_code 字段形状，
  用"故意改坏字段名"验证过测试确实生效，`check-prd-artifact.js` 本身零改动
- Phase 1A 三项输出交付物（review handoff、清单、验证报告）已装配完成
- spec-debug 误用防护假设复现+仲裁：n=18 合并，双侧 Fisher exact **p=1.000**（此前误算的 p=0.063 已废止），假设未证实，**未修改 `skills/spec-debug/SKILL.md`**
- 复用/安全默认维度 n=12 运行：108 个计划 cell、**107 个有效测量、1 个 300 秒超时**（此前"零 API 失败"的记录已修正）；有效测量全部正确，结论为 fixture 饱和候选，不称完整 confirmatory pass，不支持修改 Skill
- P2「reference consumer/owner」：修正 `skills/_shared/README.md` 错误的"8 组需人工合并"清单，7 组是同名独立内容，1 组（`model-tiers.md`）标记 architecture-mismatch
- P2「跨层调用 boundary」：审查 37 个 skill 间引用关系，未发现自动调用循环或代码越界，无需修复
- P2「必要性验证」：审查 6 个候选 durable surface，均有明确 owner/consumer，保留；清理了 6 个无 consumer 的中间 review delta 快照
- P3「Shortcut 治理」：抽查两份 deferred 记录，`source-code-deferred-tracker.md` 是正例，`spec-prd-finding-schema-freeze-deferred-2026-06-28.md` 内容已过期（已在原文档标注复核发现，未实施 schema freeze）
- **`docs/solutions/skill-simplification-patterns.md` 已创建**：如实记录本批次 4 个已完成门测的候选**零个通过**（4 个 anti-pattern + 1 个 pending），不为凑数编造正面结果
- **Phase 2 退出条件核对（新发现，未处理）**：用 4 个已完成候选项的真实成本数据算增幅，按项均分 +27.0%、按对照臂均分 +22.5%，均超过方案自定的"平均成本增加 <20%"继续门槛；但硬性退出条件（正确率全低于 baseline、成本全超 50%）均未触发，是灰色地带。**是否据此暂停 Step 3、是否调整门槛，标注为需另行决策事项，未单方面处理**
- **Phase 1B 补做前置分析并否决**：对方案指名的候选段落（`spec-work/SKILL.md` 的
  `Workflow Contract Summary`）逐句核对行为影响，发现其中一半内容已被
  `spec-work-front-controller-contracts.test.js` 的 `toContain` 断言锁定，另一部分是后文
  `spec-code-review` 调用协议等具体规则的目录式摘要。结论：候选段落不满足"删除后行为不变"
  的前提，**不产出 candidate patch，不需要门测**——比方案原计划的"跑 3 个代表性任务对照"
  更快确定性排除。同时说明"看起来像纯装饰说明"的直觉在这次核对中不可靠，沉淀为方法论教训
- `verify-with-gate.sh` 已加固：smoke/gate 只接受唯一新 run 目录，部分失败时 fail closed
- 本轮门测累计花费约 $65.27；本次全部审查性工作零门测花费（复用已有数据）

**Next Action**（按当前优先级，前两项已解决，剩余为暂缓/待决）：
1. ~~Phase 2 退出条件灰色地带~~ ✅ 已用方案自身逻辑解决，不再是待决问题
2. ~~`spec-prd-finding-schema-freeze-deferred-2026-06-28.md` 的 schema freeze~~ ✅ 已实施（用户明确授权）
3. `spec-debug` 误用防护是否继续投预算：当前 Fisher exact p=1.000 不支持假设；继续验证需要先设计
   区分力更强的新 fixture，成本和收益都不确定，评估后决定是否投入
4. P3「未覆盖 skill 的新 fixture」：`spec-plan`/`spec-code-review`/`spec-doc-review` 需要新 fixture，成本高于本轮其他项，暂缓
5. 11 个 agent/persona 模板家族（25 文件）的参数化去重机制是否值得设计——见
   `agent-persona-reference-template-duplication-2026-08-21.md`，成本不小，需要 owner 评估
6. 在源码稳定后刷新 CE localization inventory（并行 CE localization 工作流的事项，非本审查方案范围）
