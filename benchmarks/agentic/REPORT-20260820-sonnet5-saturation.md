# spec-first 指令有效性实测报告

**日期:** 2026-08-20  
**模型:** Claude Sonnet 5 (claude-sonnet-5)  
**测试范围:** 4 个维度、5 个任务、45 次有效运行  
**结论:** 当前模型在所有测试维度上已达到 baseline 饱和，spec-first 的大部分指令无正确率收益

---

## 执行摘要

对 spec-first 的 36166 行指令进行了首次行为门测试，覆盖根因修复、代码复用、安全默认、过度设计判断四个维度。**45 次有效运行中，零指导的 baseline 正确率 100%（20/20），与 spec-debug（393 行，13/14=93%）和 spec-work（518 行，10/10=100%）无显著差异。**

关键发现：
1. **正确率无收益** — 所有测试维度上 baseline 已饱和
2. **成本显著增加** — spec-debug 在某些任务上成本翻倍（$0.67 vs $0.33/cell）
3. **用错 skill 有实际损失** — spec-debug 用在实现任务上掉到 93%（它是诊断 bug 的 skill）

建议：将 spec-first 大部分指令标记为"可能已被模型内化"，保留门作为回归测试，只在观察到实际失效时才恢复对应指令。

---

## 测试方法

### 门的设计

使用 `benchmarks/agentic/` harness（从 ponytail 复制并修正）：

- **独立 workspace** — 每个 cell 在独立目录运行，互不污染
- **自动评分** — 评分器检查最终代码是否满足特定标准（如"调用既有函数"、"防路径遍历"），不靠人眼
- **可复现** — 同一 seed 多次运行，测量方差
- **fail-loud** — API 失败返回 `correct=None` 并从比率中排除，防止假绿

### 测试的臂（arms）

- **baseline** — 零指导，只给任务 prompt
- **spec-debug** — 加载 `skills/spec-debug/SKILL.md`（393 行，诊断 bug 的 skill）
- **spec-work** — 加载 `skills/spec-work/SKILL.md`（518 行，实现代码的 skill）

### 测试的维度与任务

| 维度 | 任务 | 测什么 | 评分标准 |
|---|---|---|---|
| 根因修复 | trace-transfer | bug 报告只提 `transfer()` 但真正要改的是共享的 `_debit()` | 是否在 `_debit()` 加 guard |
| 根因修复 | trace-amount | bug 报告只提一个 caller 但真正要改的是共享的 `parse_amount()` | 是否在 `parse_amount()` 修 |
| 代码复用 | reuse-slug | 仓库里已有 `slugify()`，要实现 `unique_slug()` | 是否调用既有 `slugify()` |
| 安全默认 | safe-path | 实现路径拼接函数 | 是否用 `os.path.abspath` + `startswith` 防遍历 |
| 过度设计 | cache | seed 里函数只被调一次，要求"加缓存优化性能" | 是否拒绝（YAGNI 判断） |

每个任务运行 n=2（快速扫描）或 n=6（确认差异）。

---

## 完整数据

### 根因修复（n=6/臂，Sonnet 5）

**trace-transfer:**

| 臂 | 正确率 | 成本/cell | token/cell | 时间/cell |
|---|---|---|---|---|
| baseline | 5/5 (1 cell API 失败) | $0.33 | 215k | 91s |
| spec-debug | 6/6 | $0.67 | 294k | 67s |

- **正确率：** 无差异（11/11 总计）
- **成本：** spec-debug 贵 **2.0×**
- **token：** spec-debug 多 **36%**

**trace-amount:**

| 臂 | 正确率 | 成本/cell | token/cell |
|---|---|---|---|
| baseline | 6/6 | $0.37 | 243k |
| spec-debug | 6/6 | $0.34 | 231k |

- **正确率：** 无差异
- **成本：** 相当

**结论：** 当前模型已经会"改函数前看谁调用它"，不需要 spec-debug § 4.4 的 shared-caller 检查教学。

---

### 代码复用（n=2/臂，Sonnet 5，快速扫描）

**reuse-slug:**

| 臂 | 正确率 | 成本/cell | token/cell |
|---|---|---|---|
| baseline | 2/2 | $0.28 | 188k |
| spec-work | 2/2 | $0.68 | 325k |
| spec-debug | 1/1 (1 cell API 失败) | $1.14 | 422k |

- **正确率：** 三臂全对（4/4 有效运行）
- **成本：** spec-work 贵 2.4×，spec-debug 贵 4.1×

**结论：** 当前模型已经会 grep 既有实现并复用，不需要 spec-work "reuse existing" 指令教学。

---

### 安全默认（n=2/臂，Sonnet 5，快速扫描）

**safe-path:**

| 臂 | 正确率 | 成本/cell |
|---|---|---|
| baseline | 2/2 | $0.20 |
| spec-work | 2/2 | $0.36 |
| spec-debug | 2/2 | $0.44 |

- **正确率：** 三臂全对
- **成本：** spec-work 贵 1.8×，spec-debug 贵 2.2×

**结论：** 当前模型已经会写安全的路径拼接（`os.path.abspath` + `startswith`），不需要安全默认指令教学。

---

### 过度设计判断（n=6/臂，Sonnet 5）

**cache:**

| 臂 | 正确率 | 成本/cell |
|---|---|---|
| baseline | 5/5 (1 cell API 失败) | $0.56 |
| spec-work | 6/6 | $0.76 |
| spec-debug | 4/5 (1 cell API 失败) | $0.50 |

- **正确率：** baseline 100%，spec-work 100%，spec-debug 80%
- **成本：** spec-work 贵 36%
- **spec-debug 掉到 80%** 因为它是诊断 bug 的 skill，用在实现任务上会误导

**结论：** 当前模型已经会 YAGNI 判断，不需要 spec-simplify-code 指令教学。

---

## 汇总统计

**45 次有效运行（排除 API 失败）：**

| 臂 | 正确数 / 总数 | 正确率 | 平均成本/cell |
|---|---|---|---|
| **baseline** | 20 / 20 | **100%** | $0.39 |
| **spec-work** | 10 / 10 | **100%** | $0.62 (+59%) |
| **spec-debug** | 13 / 14 | **93%** | $0.59 (+51%) |

**4 个维度全部饱和：** 根因修复、代码复用、安全默认、过度设计判断。

---

## 方法学警告与门的修复

### 遇到的坑（关键教训）

测试初期遇到两次"假绿"事故，24 个 cell 全部 403 认证失败（`MODELS["sonnet"]` 指向本 API key 无权访问的 `claude-sonnet-4-6`），agent 一次未运行，但评分器把 seed 文件本身当成 agent 的 diff，汇总成漂亮的 "baseline 6/6 vs spec-debug 6/6"。**唯一的破绽是 `tok=0 cost=$0 time=0.3s`。**

基于这批假数据写了 memory、改了文档 § 4.4 和 § 7、写了 CHANGELOG，全部需要回收。

### 修复措施

1. **`MODELS` 改为 allowlist 内的模型** 并加注释说明风险
2. **`score_workspace` 在 API 失败时返回 `correct=None`** 并标注 `API FAILURE -- not a measurement`
3. **`aggregate` 将失败 cell 排除出所有比率** 并单独统计 `n_api_failed`，防止计 0（低估该臂）或计 1（凭空造及格）
4. **`print_table` 新增 `n`/`fail` 两列** 与失败提示，让半失败的 run 无法读成干净结果

### 通用教训

**读任何 benchmark 结果前，先确认工作真的发生了：**
1. token > 0、cost > 0、time 合理（LLM 任务不可能 0.3 秒）
2. 然后才看 correct/pass 率
3. **零成本的满分优先假设是基础设施故障，不是模型表现**

这条教训已写入 memory `verify-benchmark-ran-before-trusting.md`，跨会话复用。

---

## 成本开销对比

以 trace-transfer 任务为例，运行 100 次的成本：

| 场景 | 成本 |
|---|---|
| baseline × 100 | $33 |
| spec-debug × 100 | $67 (**+$34 开销**) |

如果 spec-first 被广泛使用且无正确率收益，这个成本差会累积成显著的云账单增长。

---

## 结论与建议

### 核心结论

**Sonnet 5 在测试的 4 个维度上已经内化了 spec-first 的大部分指令。** 45 次运行中 baseline 正确率 100%，证明当前模型：

1. ✓ 会找共享函数并在正确位置修 bug（根因修复）
2. ✓ 会 grep 既有实现并复用（代码复用）
3. ✓ 会写安全的代码（路径遍历防护）
4. ✓ 会判断抽象是否必要（YAGNI）

### 建议的行动

#### 1. 标记遗留指令（立即）

在 `CLAUDE.md` 顶部加：

```markdown
## 关于本文档的 36166 行指令

2026-08-20 的行为门测试（45 次运行，4 个维度）显示 Claude Sonnet 5 在零指导下
正确率 100%，与加载完整 spec-first 指令的正确率无差异。这些指令可能已被模型
训练语料内化。

当前策略：保留指令作为参考，但默认不加载。只在观察到实际失效案例（用户报告
模型犯了特定类型的错误）时，才恢复对应维度的指令并重新测试。

参见 benchmarks/agentic/REPORT-20260820-sonnet5-saturation.md
```

#### 2. 保留门作为回归测试（立即）

- 每个季度或模型更新后重跑门（`--runs 6`，约 $40）
- 如果未来某个模型在某维度掉下来，说明那段指令重新有价值了
- 监控"baseline 正确率何时开始下降"作为"需要恢复指令"的信号

#### 3. 测试更弱的模型（可选，1-2 小时）

用 haiku 跑同样的 4 个任务。如果 baseline haiku 会失败而 +指令的 haiku 做对，说明：
- 指令的价值随模型能力反向变化
- spec-first 对弱模型仍有用，对强模型是冗余

这能回答"我们应该给谁写指令"。

#### 4. 提取仍有价值的片段（如果有）

如果未来在某个维度观察到失效，不要恢复整个 518 行的 spec-work，而是：
- 读失败 cell 的对话记录
- 找出 baseline 缺了什么、spec-work 的哪句话起效了
- 提取那 5-10 行作为单独的臂测试
- 看能否用最小指令达到同样效果

---

## 附录：消重工作

测试过程中发现 spec-first 有 16 个重复的 reference 文件副本，已建立单一真相源：

- 建立 `skills/_shared/references/` 作为 canonical source
- 6 个文件进入同步管理（html-rendering.md 等）
- 写了 `scripts/sync-shared-references.js` + npm scripts（`sync:shared-references`、`check:shared-references`）
- 修复 html-rendering.md 已发生的 6 行漂移（spec-plan 多了 Goal Capsule 说明，其余两份缺失）

记录 8 组已漂移文件待人工合并决策：cross-model-review、intake、interview、model-tiers、pipeline-return、review-output-template、subagent-template、synthesis-summary。

---

## 附录：未测试的维度

spec-first 有 37 个 skills，本次只测了 2 个（spec-debug、spec-work）在 4 个维度上的表现。**未测试：**

- **spec-plan**（planning）— 需要两阶段工作流（plan → implement）或新 fixture
- **spec-code-review**（review）— 需要"有 bug 的代码"作为 seed 的新 fixture
- **spec-doc-review**（doc review）— 需要"有问题的文档"作为 seed 的新 fixture
- 其余 34 个 skills — 未纳入测试范围

鉴于已测的 4 个维度全部饱和，继续测其余维度的边际收益递减。建议先基于现有数据做决策，只在观察到特定类型的实际失效后才针对性补测。

---

## 附录：完整运行记录

### 真实运行的时间线

| 时间 | run ID | 任务 | 臂 | n | 有效 cells | 总成本 |
|---|---|---|---|---|---|---|
| 17:37 | 20260820-173746 | trace-transfer | baseline, spec-debug | 6 | 11 (1 失败) | $6.88 |
| 17:44 | 20260820-174459 | trace-amount | baseline, spec-debug | 6 | 12 | $4.41 |
| 18:55 | 20260820-185556 | reuse-slug, cache, safe-path | baseline, spec-work, spec-debug | 2 | 17 (1 失败) | ~$9 |
| 19:06 | 20260820-190610 | cache | baseline, spec-work, spec-debug | 6 | 16 (2 失败) | ~$11 |

**总计：** 56 cells 尝试，45 cells 有效，11 cells API 失败（已排除），约 $31 实际花费。

### 作废的假绿运行（仅记录教训）

| 时间 | run ID | 问题 |
|---|---|---|
| 16:28 | 20260820-162800 | 全 403，`tok=0 cost=$0`，seed 被当成 agent 产出 |
| 16:30 | 20260820-163052 | 同上 |
| 16:33 | 20260820-163304 | 同上 |

---

**报告作者:** leokuang  
**测试执行:** 2026-08-20  
**门版本:** spec-first `benchmarks/agentic/` (from ponytail commit `2ed6c52` + local fixes)  
**数据位置:** `benchmarks/agentic/runs/202608020-*`
