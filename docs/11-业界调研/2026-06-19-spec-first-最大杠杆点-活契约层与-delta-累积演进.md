# spec-first 最大杠杆点分析：当前最缺什么，做哪一项收益最大

> **分析对象**：spec-first（sunrain520）
> **分析方法**：源码级针对性验证——读 spec_id traceability、review-closure-traceability、code-review 对照基准、plan governance-boundaries、contract-drift-guard 技术方案，确认缺口的真实机制与杠杆效应。
> **结论先行**：spec-first 当前最缺的是**"被开发系统的行为真相单源"（single source of behavioral truth）**。做这一项（引入活契约 + Delta 累积演进机制）能带来**乘数级**的工程治理提升——因为它同时抬高了 review、verification、compound、51 个 agent 的对照基准。这不是锦上添花，而是补齐治理体系的"根"。

## 0. 结论

spec-first 的工程治理已经很强：honest closeout 防 cherry-pick、51 个专业 agent、compound 的 structured promotion gate、spec_id 横向链路追溯、review-closure 回链防静默断链、contract-drift-guard 守护工具自身诚实。

但它有一个**结构性盲区**：

> **spec-first 治理了"工作怎么做"（过程治理），却没治理"系统现在是什么样"（状态治理）。所有 review/verification 的意义都依赖于"系统应该是什么样"这个基准——而这个基准在 spec-first 里是空的、每次都要从最新 plan 里临时推断。**

源码证据链：

- spec-id-traceability.md：spec_id 是**横向**链路标识（requirements→plan→tasks→code 同一次工作），不是纵向状态累积
- review-closure-traceability.md：referenced_reviews 是 review finding→plan 的**横向回链**，治理单位仍是"一次 plan"
- governance-boundaries.md L7：**"docs and prior plans remain advisory"**——历史 plan 只是建议，无权威地位
- spec-code-review/SKILL.md L23：review 输入是 "current branch diff...plan/task/work artifacts"，对照基准是**本次 diff + 本次 plan**
- contract-drift-guard/技术方案.md：契约概念仅用于**"工具自身能力声明"**，完全没有"被开发系统行为"维度

**最大杠杆项**：引入**活契约层（Living Contract Layer）+ Delta 累积演进机制**——让"系统当前应如何运作"成为仓库内累积的、权威的、可对照的行为真相。

为什么是它而非其他候选？因为它是**乘数项**：它不新增一个独立能力，而是同时抬高了所有现有治理能力的对照基准。后面会逐一推演这个乘数效应。

## 1. 诊断：spec-first 治理体系的"根"是悬空的

### 1.1 过程治理 vs 状态治理

工程治理有两个维度：

| 维度 | 治理什么 | spec-first 现状 |
| --- | --- | --- |
| **过程治理** | 工作怎么做：plan 是否合理、work 是否按 plan、review 是否充分、verification 是否真实 | **强**——spec-plan governance、code-review 三维度、honest closeout、51 agent |
| **状态治理** | 系统现在是什么样：当前行为契约是什么、这次变更改了契约的哪部分、契约是否被遵守 | **缺失**——无活契约、无 delta、无累积合并 |

spec-first 的过程治理是顶级的。但过程治理的**意义**依赖于状态治理提供的基准：

- code-review 对照"本次 plan"——但本次 plan 描述的是"这次要做什么"，不是"系统当前完整行为"。reviewer 无法判断"这个改动是否破坏了某个未在本 plan 范围内的既有行为"。
- verification 跑测试——但测试的"应该是什么"来自哪里？来自本次 plan 的 acceptance。系统其他部分的既定行为没有权威记录，无法验证"改动是否无意破坏了它们"。
- compound 沉淀 learnings——但 learnings 是离散的"怎么解决问题"，不是"系统行为状态演进"。下次会话要理解"auth 模块现在完整行为"，得拼凑历史 plan。

**根悬空了**：所有过程治理都对照一个"临时的、本次的、非累积的"基准，没有一个"累积的、权威的、系统级的"行为真相作为根。

### 1.2 源码级证据：追溯是横向的，不是纵向的

spec-first 有两套追溯机制，都是**横向的**（同一次工作内部）：

**spec_id（横向链路）**——spec-id-traceability.md：

```
requirements(spec_id) → plan(继承 spec_id) → tasks(继承 spec_id + source_plan_hash) → code
```

这是"同一次工作"的身份证。它让 LLM 能 join 同一次工作的 artifacts，但**不回答"系统现在应该怎么运作"**。spec-first 自己声明（L5）："It is not a workflow state, approval marker, progress database, freshness check, or central registry key."

**referenced_reviews（横向回链）**——review-closure-traceability.md：

```
review finding ← plan(referenced_reviews: addresses_findings)
```

这是"这次 plan 承接了哪些 review finding"的回链，防"静默断链"（META-closure-break）。治理单位仍是**"一次 plan"**。

**关键缺口**：没有任何机制做**纵向累积**——即"系统行为随时间演进"的记录。每次 plan 都从"当前 request + 现有 plans（advisory）"出发，prior plans 没有权威地位（governance-boundaries.md L7 明确 "advisory"）。

### 1.3 源码级证据：契约概念只用于"工具自身"，未用于"被开发系统"

contract-drift-guard/技术方案.md 揭示了 spec-first 对"契约"的当前理解：

> 它要解决的是……**角色契约/治理文档声称某能力或入口存在时，代码侧必须有可验证承载**。

这里的"契约"是 docs/10-prompt/结构化项目角色契约.md §2——**spec-first 这个工具自己的能力声明表**（Context Harness / Evaluation Harness / Governance Harness 等层的能力词）。contract-drift-guard 守护的是"spec-first 诚不诚实"（声称的能力有没有源码实现）。

**完全没有**"被开发系统的行为契约"这个维度。spec-first 治理了工具自身的诚实，却没治理被开发系统的行为真相。

### 1.4 后果：治理黑洞

没有行为真相单源，产生三个治理黑洞：

**黑洞 1：review 的"回归破坏"盲区**
code-review 对照"本次 diff + 本次 plan"。但本次 plan 只描述本次改动范围。如果改动无意破坏了 plan 范围外的既有行为，reviewer **没有权威记录可对照**——它不知道"系统原本应该怎样"，只能看 diff 和本次 plan。回归 bug 就从这里漏出。

**黑洞 2：verification 的"测了但没测对"问题**
honest closeout 能保证"你声称 passed 的测试是真的跑了且通过了"。但如果测试的"应该是什么"只来自本次 plan，那它只能验证"本次需求实现了"，**无法验证"系统其他既有行为没被破坏"**——因为没有那些行为的权威记录来派生回归测试。

**黑洞 3：compound 的知识闭环在契约层断裂**
compound 沉淀"怎么解决问题"的 learnings。但一个完整的知识闭环应该是：learnings（经验）+ 契约演进（系统行为变了什么）。spec-first 只闭环了前者，后者每次都从零推断。下次会话要理解系统现状，得读 N 个历史 plan 拼凑。

## 2. 最大杠杆项：活契约层 + Delta 累积演进机制

### 2.1 它是什么

引入一个**纵向累积的行为真相层**：

```
docs/contracts/<domain>/spec.md   ← 系统当前应如何运作的活契约（累积、权威）
```

每次需求变更不再只产出独立 requirements 文档，而是产出**契约 Delta**（只描述"改了什么"）：

```
## ADDED Requirements
### Requirement: 会话过期
The system MUST expire sessions after 30 minutes of inactivity.
#### Scenario: 空闲超时
- GIVEN an authenticated session
- WHEN 30 minutes pass without activity
- THEN the session is invalidated

## MODIFIED Requirements
### Requirement: 登录认证
(Previously: 仅邮箱密码)
The system MUST support email/password AND OAuth login.

## REMOVED Requirements
### Requirement: 记住我
**Reason**: 被 OAuth 替代。
```

变更完成后，Delta **原子合并**进主契约（ADDED 追加 / MODIFIED 替换 / REMOVED 删除），主契约成为系统行为的**累积真相**。

### 2.2 为什么是最大杠杆（乘数效应）

这一项不是新增一个独立能力，而是**同时抬高所有现有治理能力的对照基准**。逐一推演：

| 现有治理能力 | 当前对照基准 | 引入活契约后 | 提升性质 |
| --- | --- | --- | --- |
| **code-review（51 agent）** | 本次 diff + 本次 plan | 本次 diff + **系统活契约** | 从"本次需求实现了吗"→"本次需求实现了吗 **且 没破坏既有行为吗**" |
| **honest closeout** | 本次 verification-run-summary | 本次 run-summary + **契约派生的回归检查** | 从"声称的测试真跑了"→"声称的测试真跑了 **且 覆盖了契约要求**" |
| **compound** | 沉淀 learnings | 沉淀 learnings + **合并契约演进** | 知识闭环从"经验层"补齐到"契约层" |
| **spec_id 追溯** | 横向（同次工作） | 横向 + **纵向（契约累积）** | 从"一次工作的身份证"→"系统行为演进的可追溯历史" |
| **referenced_reviews** | finding→plan 回链 | finding→plan + **finding→契约影响** | 从"这次 plan 承接了哪些 finding"→"这些 finding 影响了哪些契约行为" |
| **spec-plan** | 从 request + advisory prior plans | 从 request + **权威活契约** | 从"prior plans 是建议"→"活契约是权威基准，plan 必须对照它" |

**乘数机制**：活契约给每个现有能力提供了一个之前不存在的"根基准"。review 不再只对照临时 plan，而是对照累积的系统真相——回归破坏盲区被填上。verification 不再只跑本次需求测试，而是跑契约派生的回归测试——"测了但没测对"问题被填上。compound 不再只闭环经验，而是闭环契约演进——知识闭环完整了。

**这就是为什么它是最大杠杆**：其他候选项（schema 驱动、规范语法、verify 维度）都是**加法项**（新增一个独立能力），而活契约是**乘法项**（放大所有现有能力的效能）。

### 2.3 为什么不是其他候选项

| 候选 | 价值 | 为什么不是最大杠杆 |
| --- | --- | --- |
| Schema 驱动工作流 | 可声明化、可定制、可社区分发 | **加法项**：提升可定制性，但不改变治理基准。没有活契约，schema 定义的 workflow 仍对照临时 plan |
| RFC 2119 + GIVEN-WHEN-THEN | 规范表达可测试、可机器判读 | **使能项**：它是活契约的"语法层"，没有活契约这个"载体"，语法无处安放。应作为活契约的配套，而非独立最高优先级 |
| Verify 三维度 | 对照 artifact 的一致性校验 | **依赖项**：verify 要对照 artifact，但若 artifact（契约）不存在，verify 只能对照 plan。先有契约，verify 才有真基准 |
| 并行冲突检测 | 多任务契约冲突 | **衍生项**：没有契约就没有冲突检测对象 |
| 渐进严格度 | 按风险分级流程 | **流程项**：调节流程重量，不改变治理基准 |

**关系链**：活契约（根）→ 规范语法（活契约的表达层）→ verify（对照活契约校验）→ 冲突检测（多任务改活契约）。活契约是这条链的地基，其他都建在其上。先做地基，其他自然有了着力点。

### 2.4 与 spec-first trust model 的契合（源码级）

这是关键：活契约机制**完美契合** spec-first 的 "Scripts prepare, LLM decides" 信任模型，而非破坏它。

源码级分工（参考 OpenSpec 的 specs-apply.ts 实现，可移植到 spec-first 的 JS CLI）：

| 环节 | 归属 | 实现方式 | 契合点 |
| --- | --- | --- | --- |
| Delta 语法判断（这段是 ADDED 还是 MODIFIED？影响哪个契约？） | **LLM decides** | skill instruction 引导 | 语义判断归 LLM |
| Delta 合并（ADDED 追加/MODIFIED 替换/REMOVED 删除） | **Scripts prepare** | CLI 确定性操作 | 机器事实归脚本 |
| 跨段冲突检测（MODIFIED ∩ REMOVED） | **Scripts prepare** | CLI 比对作用域 | 机器事实归脚本 |
| 合并结果诚实收尾 | **Scripts prepare + honest closeout** | 走现有 honest-closeout.js 降级机制 | 复用已有护城河 |
| 契约派生回归检查 | **Scripts prepare** | 从契约 scenario 生成 verification check | 机器事实归脚本 |

**不破坏反而强化**：Delta 合并是确定性操作（纯函数式），交给脚本——符合 "scripts prepare"。Delta 的语义分类交给 LLM——符合 "LLM decides"。合并冲突时走 honest closeout 降级（degraded/unsupported）——复用已有护城河。这不是引入异质机制，而是把 spec-first 的信任模型**延伸到契约层**。

## 3. 落地设计（源码级可操作）

### 3.1 最小切片：先建活契约载体 + Delta 合并引擎

**Phase 1 目标**：让 spec-first 拥有"系统行为真相单源"，且 Delta 合并走 trust model。

**新增目录**：

```
docs/contracts/<domain>/spec.md   # 活契约（累积，权威）
```

与现有 docs/brainstorms/（一次性 requirements）、docs/plans/（一次性 plan）并存。brainstorm 仍用于探索，但"升格为契约"时产出 Delta。

**Delta 合并引擎**（移植 OpenSpec specs-apply.ts 逻辑到 spec-first JS CLI）：

核心函数（参考 OpenSpec 源码，可移植）：

```
parseDeltaSpec(content) → {added, modified, removed, renamed}
buildUpdatedSpec(delta, mainSpec) → {rebuilt, counts}
  - 合并顺序: RENAMED → REMOVED → MODIFIED → ADDED
  - 跨段冲突检测: MODIFIED∩REMOVED, MODIFIED∩ADDED, ADDED∩REMOVED
  - 新 spec 只允许 ADDED
validateMergedSpec(rebuilt) → {valid, issues}  # 复用 honest-closeout 的 schema 校验
writeUpdatedSpec(target, rebuilt)  # 原子写，任一失败回滚
```

**新增 CLI 命令**（对齐 spec-first 的 "scripts prepare"）：

```
spec-first contracts merge <change>   # 确定性合并，输出 contract-sync-summary
spec-first contracts validate          # 校验契约 + delta 格式
spec-first contracts show <domain>     # 查看某领域当前契约
```

**新增 skill 入口**：

```
spec-sync   # 或扩展 compound：合并契约 + 沉淀 learnings 的统一收尾
```

### 3.2 Phase 2：打通乘数效应（让现有治理对照活契约）

Phase 1 建好载体后，Phase 2 让现有能力对照活契约，激活乘数效应：

**code-review 升级**：

- review 输入增加 contracts/<domain>/spec.md（受影响领域）
- 51 个 agent 增加"回归破坏"检查维度：本次 diff 是否破坏了契约中**本次 plan 范围外**的 requirement/scenario
- 对照基准从"本次 plan"→"活契约"，填上回归破坏盲区

**verification 升级**：

- 契约 scenario 自动派生回归 check，写入 spec-first.verification.json
- honest closeout 增加 contract_coverage claim 类型：声称"覆盖了受影响契约的所有 MUST"
- 复用防 cherry-pick：contract_coverage 的 passed 必须反映全部受影响 MUST 的聚合真相

**compound 升级**：

- compound 收尾时执行契约合并（spec-sync）
- 合并冲突走 honest closeout 降级（degraded/unsupported），不强行合并
- 知识闭环补齐契约层

**spec_id 升级**：

- spec_id 仍管横向链路；新增 contract_version 管纵向累积
- plan frontmatter 增加 affects_contracts: [auth, payments]，声明本次工作影响哪些活契约

### 3.3 Phase 3：规范语法 + 治理深化

**规范语法**（活契约的表达层）：

- 活契约强制 RFC 2119（MUST/SHALL/SHOULD/MAY）+ GIVEN/WHEN/THEN scenario
- 4 个 # 的 scenario 格式约束（参考 OpenSpec schema.yaml）
- 契约 validate 校验语法

**契约漂移守护**（扩展现有 contract-drift-guard）：

- 现有 guard 守护"工具能力声明诚实"
- 扩展 guard 守护"代码实现 vs 活契约"：活契约的每个 MUST 是否有对应实现+测试
- 未覆盖项标记 degraded（honest closeout），不假装覆盖

## 4. 预期收益量化

| 维度 | 当前 | 引入活契约后 | 提升机制 |
| --- | --- | --- | --- |
| **回归破坏检出率** | 依赖 reviewer 经验，盲区大 | 契约派生回归检查，盲区小 | review 对照活契约而非临时 plan |
| **verification 有效性** | 验证"本次需求实现" | 验证"本次需求实现 + 既有行为未破坏" | 契约 scenario 派生回归 check |
| **知识闭环完整度** | 经验层闭环（learnings） | 经验层 + 契约层双闭环 | compound 合并契约演进 |
| **新会话上下文成本** | 读 N 个历史 plan 拼凑系统现状 | 读活契约（单一权威） | 纵向累积替代横向拼凑 |
| **review 判断质量** | 对照临时 plan | 对照累积真相 | 51 agent 有了权威基准 |
| **跨会话一致性** | prior plans advisory，每次重推断 | 活契约权威，直接对照 | 状态治理替代过程推断 |

**一句话**：当前 spec-first 的治理是"强过程、弱状态"。引入活契约把"状态治理"补上，让所有"过程治理"能力都有一个累积的、权威的根基准——这是从"优秀"到"完整"的关键一跃。

## 5. 风险与边界

### 5.1 不应做什么

- **不要把活契约变成刚性状态机**：spec-first 明确"入口不是刚性状态机"（02-核心概念.md）。活契约的合并是 fluid action，不强制阶段。Delta 可跳过、可补写。
- **不要让活契约取代 brainstorm/plan**：brainstorm 仍用于探索（自由格式），plan 仍用于实现决策。活契约只在"升格为契约"时强制结构化语法。
- **不要破坏 trust model**：合并用脚本、判断用 LLM、冲突用 honest closeout 降级。绝不让 LLM 直接写主契约（合并是确定性操作，归脚本）。
- **不要强制 greenfield**：支持 retrofit（第一遍从现有代码逆向工程描述性契约 → 第二遍人工转规范性），参考 OpenSpec 的 brownfield 策略。

### 5.2 诚实承认的局限

- **高度视觉/动画工作**不适配 GIVEN/WHEN/THEN——活契约覆盖行为层，不覆盖审美层。保留 visual regression suite。
- **研究阶段代码**：spec-after（从有效代码提取契约）比 spec-first（先写契约再探索）更现实。探索阶段不强制契约。
- **retrofit 非免费**：第一遍产生描述性契约（代码做什么），需第二遍人工转规范性契约（应做什么）。

## 6. 结论

spec-first 当前最缺的是**"被开发系统的行为真相单源"**。

它的过程治理（plan/work/review/compound/verification/51 agent）是顶级的，但所有过程治理的**意义**都依赖于"系统应该是什么样"这个基准——而这个基准在 spec-first 里是悬空的、每次从临时 plan 推断的。源码证实：spec_id 是横向链路（非纵向累积），prior plans 是 advisory（非权威），契约概念只用于工具自身（非被开发系统）。

**做"活契约层 + Delta 累积演进机制"这一项，能带来最大工程治理提升**，因为它是**乘数项**而非加法项：它不新增独立能力，而是同时抬高 review、verification、compound、51 agent 的对照基准——填上回归破坏盲区、补齐知识闭环、给所有治理一个累积权威的根。

而且它完美契合 spec-first 的 trust model：Delta 合并归脚本（确定性操作）、语义分类归 LLM、冲突降级归 honest closeout（复用护城河）。这不是引入异质机制，而是把 "Scripts prepare, LLM decides" 延伸到契约层。

其他借鉴（schema 驱动、规范语法、verify 维度、冲突检测）都是建在活契约这个地基之上的上层建筑。先做地基，其他自然有着力点。先做上层建筑，则没有根——workflow 再可声明、语法再规范，对照的仍是临时 plan，治理黑洞依旧。

**优先级判断**：活契约是 P0 且唯一最高优先级。规范语法是它的配套（P1，紧随其后）。其余是衍生（P2+）。

## 附录：源码证据索引

| 证据 | 文件 | 关键行 | 说明 |
| --- | --- | --- | --- |
| spec_id 是横向非纵向 | docs/contracts/workflows/spec-id-traceability.md | L5 "not a workflow state, progress database" | 链路追溯，非状态累积 |
| prior plans 是 advisory | skills/spec-plan/references/governance-boundaries.md | L7 "docs and prior plans remain advisory" | 历史计划无权威地位 |
| review 对照本次 plan | skills/spec-code-review/SKILL.md | L23 "plan/task/work artifacts" | 对照基准是临时的 |
| 契约概念仅限工具自身 | docs/01-需求分析/15.contract-drift-guard/技术方案.md | L21 "角色契约声称能力" | 无被开发系统行为维度 |
| Delta 合并可确定性 | OpenSpec src/core/specs-apply.ts | L244 合并顺序, L163-193 冲突检测 | 可移植到 spec-first CLI |
| honest closeout 可扩展 | src/cli/helpers/honest-closeout.js | L213-220 防 cherry-pick | 契约覆盖 claim 可复用此机制 |
| compound 可承载契约合并 | skills/spec-compound/SKILL.md | L93-97 promotion gate | structured promotion 已有 source_refs |
