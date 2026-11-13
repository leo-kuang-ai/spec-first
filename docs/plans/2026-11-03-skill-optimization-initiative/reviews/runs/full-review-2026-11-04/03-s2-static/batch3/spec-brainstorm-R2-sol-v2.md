# spec-brainstorm 评审（R2）

## 逐项裁决表

本表仅裁决 `structure_contract`：检查当前磁盘文本中的承诺、内部一致性和消费者衔接，不代表模型实际遵守或运行收益。已完整读取入口、入口及其引用链指向的相关 references、消费者清单所列全部 15 个测试文件，以及 eval 配置引用的 7 个用例和对应判定脚本、仓库 fixture。未执行测试或行为评测；文档中的语义检查不作为已硬强制的 gate。

表中 `R/` 代表 `skills/spec-brainstorm/references/`，`E/` 代表 `skills/spec-brainstorm/evals/`。

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/spec-brainstorm/SKILL.md:13`；`R/phase-0.md:48`；`R/product-pressure-test.md:44` | 有轻量短路径、清晰需求跳过探索、按相关性选择场景等约束，不强制所有任务承担完整流程。 |
| D02 | pass | `R/dialogue.md:7`；`R/dialogue.md:25`；`R/brainstorm-sections.md:84` | 明确区分来源事实、产品决定和规划 HOW，并把需求充分性留给语义判断，而非字段计数。 |
| D03 | pass | `R/plan-write.md:12`；`R/brainstorm-sections.md:84`；`R/approaches.md:49` | 写后检查、负载事实核实、失败修复与未通过时的声明上限明确，且没有冒充机械 readiness 分类器。 |
| D04 | pass | `R/handoff.md:75`；`skills/spec-plan/references/intake.md:58`；`skills/spec-doc-review/references/document-intake.md:26` | 需求产物由规划原地丰富、Product Contract 字节保留，审查消费者也正确识别 requirements-only。 |
| D05 | fail | `R/synthesis-summary.md:11`；`R/blindspot-pass.md:22`；`R/plan-write.md:20` | “不存在非交互模式”与 headless 时“采用默认假设继续”的指令没有清楚划分恢复与执行边界。 |
| D06 | pass | `skills/spec-brainstorm/SKILL.md:27`；`R/model-tiers.md:3`；`R/approaches.md:3` | 模型选择、隔离、并发和 dispatch 能力分别核对；不支持时继承或 inline，并保留覆盖限制。 |
| D07 | pass | `R/synthesis-summary.md:56`；`R/settled-decisions.md:3`；`R/plan-write.md:24` | 能定位维护依据和回归消费者；知识升级候选要求来源、真实消费者及失效条件，不自动写入长期知识。 |
| D08 | pass | `skills/spec-brainstorm/SKILL.md:56`；`R/output-mode.md:19`；`R/dialogue.md:19`；`R/settled-decisions.md:38` | 入口按阶段加载、渲染延后、检索有预算，且要求复用已定决定与必要原文证据。 |
| B01 | fail | `skills/spec-brainstorm/SKILL.md:3`；`R/phase-0.md:18`；`R/phase-0.md:24` | 描述排除 debugging，但实际 intake 把 debug 请求纳入软件路径、错误消息纳入直接回答，没有对应的明确 debug 出口。 |
| B02 | pass | `skills/spec-brainstorm/SKILL.md:19`；`R/brainstorm-sections.md:288`；`R/universal-brainstorming.md:5` | 输入、软件产物 metadata/readiness、非软件例外及消费者的静态约定基本一致；未将 core/08 的拟议 YAML 当现行要求。 |
| B03 | fail | `R/handoff.md:28`；`R/handoff.md:31`；`R/interaction-rules.md:9`；`docs/methodology/结构化项目角色契约.md:50` | 对“继续推进”的处理允许将真实产品阻塞转为假设或 Deferred，却没有要求核实产品决定权限与具体决定。 |
| B04 | fail | `E/cases/verdict-routes-to-pov.yaml:11`；`E/cases/r2-verdict-graphql.yaml:8`；`E/eval.yaml:3` | 两个活跃 eval 明确要求读取 `.claude/skills/` 定义，非隔离配置又未在此绑定其与当前 source 的身份。 |
| B05 | pass | `R/model-tiers.md:3`；`R/dialogue.md:15`；`R/plan-write.md:16`；`R/phase-0.md:9` | 有启动失败降级、避免重复 worker、当前树重新定位、文件排他创建和无 scratch 恢复约定。 |
| B06 | pass | `R/brainstorm-sections.md:86`；`R/plan-write.md:12`；`R/handoff.md:155` | 就需求工作职责而言，完成检查面向实际文件，暂停与阻塞必须披露，不把保存草稿等同于 ready。 |
| X01 | pass | `R/phase-0.md:60`；`R/interaction-rules.md:10`；`R/brainstorm-sections.md:391`；`R/plan-write.md:16` | 对复杂需求保留共同结果与真实依赖，避免按来源机械拆分；实施编排和集成顺序合理留给规划。 |
| X02 | pass | `R/dialogue.md:27`；`R/approaches.md:24`；`R/plan-write.md:24`；`skills/spec-plan/references/intake.md:159` | 技术决策主题允许必要探索，迁移实现留给规划，ADR 仅产候选，接口演化有下游 owning reference。 |
| X03 | fail | `R/product-pressure-test.md:46`；`R/handoff.md:31`；`skills/spec-plan/references/intake.md:135` | 风险场景会进入需求，但真实产品阻塞存在被泛化“继续”降级的出口，与下游明确的权限及阻塞保护不对称。 |
| X04 | pass | `R/phase-0.md:9`；`R/brainstorm-sections.md:262`；`R/plan-write.md:20`；`R/handoff.md:5` | 跨会话恢复保留决定、来源版本、限制、失效条件和下一问题，且明确 inline 自检不等于独立验证。 |

## Findings

### F1 · P1：泛化“继续推进”可以清空真实产品阻塞

- **位置：** `skills/spec-brainstorm/references/handoff.md:28-33`。
- **关联证据：** `skills/spec-brainstorm/references/interaction-rules.md:9`；`skills/spec-plan/references/intake.md:128-147`。
- **触发条件：** 产品行为或风险接受尚未决定，当前用户只是代执行者、明确不拥有相应决定权限，却要求“不要再问，继续”。
- **静态事实：** handoff 允许在用户明确希望继续时，把每个阻塞转换为决定、假设或 `Deferred to Planning`；转换后，原本依赖 `Resolve Before Planning` 非空而隐藏的规划、LFG 选项可以重新出现。该分支没有要求用户提供或确认具体产品决定，也没有排除用户已声明无权决定的情况。
- **后果：** 决定权限缺失可能被包装成普通假设或规划问题，从而形成虚假的需求闭合。下游 `spec-plan` 虽有更严格保护，但上游可能已消去其最明确的阻塞信号。
- **最小修复建议：** 在此分支补充：只把真正 planning-owned HOW 转为 Deferred；改变行为、范围、成功标准或风险接受的 WHAT，必须由有权限的当前用户提供或确认具体决定，否则保留 blocker。泛化续跑授权不能替代该决定。
- **建议复验：** 增加“无产品权限的代执行者要求直接继续”的负例，检查 blocker 仍在、未宣称 ready、未开放依赖该决定的自动交付。

### F2 · P2：活跃 eval 将 generated runtime 指定为被测定义

- **位置：** `skills/spec-brainstorm/evals/cases/verdict-routes-to-pov.yaml:11`；`skills/spec-brainstorm/evals/cases/r2-verdict-graphql.yaml:8`。
- **关联证据：** `skills/spec-brainstorm/evals/eval.yaml:3-8`。
- **静态事实：** 两个用例明确要求完整读取 `.claude/skills/spec-brainstorm/SKILL.md` 并作为工作指令，而配置声明 `environment.type: none`。这些文件没有同时声明 source/runtime 身份核对或缺失时的明确处置。
- **后果：** 按这些用例文本执行时，可能读取旧 runtime 或不可见路径；结果不能稳定归属于本次冻结的 source。配置中的 `local_path: .` 也没有消除 prompt 中另一条定义加载路径。
- **最小修复建议：** 普通 fresh-source eval 统一使用 runner 绑定的当前 source；若保留 runtime 加载测试，则单独标为投射测试，显式绑定生成来源和身份，不能混作 source 行为证据。
- **建议复验：** 在 runtime 缺失、runtime 陈旧而 source 已变更两种条件下，确认用例不会静默测试其他版本。

### F3 · P2：入口负例与实际 intake 的 debug 处理不一致

- **位置：** `skills/spec-brainstorm/references/phase-0.md:18-24`。
- **关联证据：** `skills/spec-brainstorm/SKILL.md:3`；`skills/spec-brainstorm/references/synthesis-summary.md:243-248`。
- **静态事实：** 入口描述明确排除 debugging；域分类却把“asks to … debug … software”列作继续软件流程的信号，把 error message 列作直接回答。现有 `spec-debug` 出口只在用户主动表示想换 workflow 时出现，没有解决 intake 自身遇到明确修复请求的情况。
- **后果：** 带有明确修复意图的混合输入可能进入产品访谈，或被当作普通错误问答结束，入口职责边界不能仅由 description 保证。
- **最小修复建议：** 在域分类前后增加一个窄分支，区分“解释错误含义”与“诊断或修复失败”；后者明确移交 `spec-debug`，不在这里接管修复。保留对缺陷相关产品策略进行探索的合法场景。
- **建议复验：** 对照“解释这个报错”“修复这个回归”“讨论失败时应呈现什么产品行为”三个输入，分别验证直接解释、debug 路由与正常 brainstorm。

### F4 · P2：非交互不支持与 headless 继续指令存在静态冲突

- **位置：** `skills/spec-brainstorm/references/synthesis-summary.md:11`；`skills/spec-brainstorm/references/blindspot-pass.md:22`。
- **关联证据：** `skills/spec-brainstorm/references/plan-write.md:20`。
- **静态事实：** synthesis 明确规定没有非交互模式，自动 workflow 不应调用本 Skill；blindspot 却要求 pipeline/headless 时用默认假设继续。plan-write 另有运行中变为 headless 时保存恢复产物的合理分支，但未说明它与前述“继续”的区别。
- **后果：** 执行者无法一致判断：无同步用户时应拒绝进入、仅持久化恢复点，还是继续需求探索并生成假设。
- **最小修复建议：** 明确区分“不支持以 headless 模式启动探索”与“交互运行中失去用户后的安全暂停”；将 blindspot 的 headless 分支约束为后者，不替代未决产品决定。
- **建议复验：** 分别检查 headless 初始调用、交互中断、WHAT 已闭合且已有写入授权三种情况。

## 主责深挖面发现

### B01—B04

- **入口职责：主线清楚，debug 负例仍有缺口。**  
  `skills/spec-brainstorm/SKILL.md:11-17` 将职责定位为 WHAT，明确不实现、不裁决外部候选；`references/verdict-routing.md:5-22` 的三要素判断、接受后实际调用及拒绝后不重复推销都成立。应保持这些边界，仅补 F3 的窄入口分支。

- **输入输出：统一需求产物与消费者能够对上。**  
  `references/brainstorm-sections.md:23-55` 定义 requirements-only 骨架；`skills/spec-plan/references/intake.md:58-66` 原地丰富并保留 WHAT；`skills/spec-doc-review/references/document-intake.md:26` 不因缺少实施章节误报不完整。core/08 中的 FR 数量、边界数量与拟议 YAML 未被这里采纳，不能据此制造缺陷。**保持现状成立。**

- **授权信任：dispatch、Slack 和 landing 分离较完整，产品权限需补齐。**  
  `SKILL.md:40` 不把调用 workflow 当作 worker 授权；`references/agents/slack-researcher.md:25`、`:113-121` 分离访问能力、数据使用范围与不可信消息；`references/handoff.md:62` 明示 LFG 的 push/PR、限定 reviewer 委派并排除项目服务启动授权。F1 是另一条权限轴，不能由上述保护替代。

- **source/runtime：执行侧保持中立，评测侧加载身份不一致。**  
  `references/settled-decisions.md:3` 能定位共享 source、同步命令和回归测试；`tests/unit/spec-brainstorm-clarification-contracts.test.js:105-129` 有遍历受支持宿主的投射断言。F2 发生在活跃 eval 的定义加载路径，不是要求本轮刷新 runtime，也不是已经观察到 runtime drift。

### X01—X04

- **X01：复杂需求不等于强行新增编排。**  
  `references/phase-0.md:60` 按独立用户价值与验收边界确定结果，`references/brainstorm-sections.md:391` 保留真实依赖关系。共享写面由 `references/plan-write.md:16` 的排他创建和更新前身份复查约束。实施任务粒度、集成顺序归规划所有，**保持现状成立**。

- **X02：技术主题的必要细节不等于提前实施。**  
  `references/dialogue.md:27` 允许技术或架构决策本身成为探索主题，`references/plan-write.md:24-26` 禁止直接写 ADR，仅生成合格候选；下游 `skills/spec-plan/references/intake.md:159` 接管接口演化细化。**保持现状成立**，不建议额外增加 brainstorm schema。

- **X03：风险场景落点已有，阻塞退出需与之匹配。**  
  `references/product-pressure-test.md:44-48` 已覆盖权限、状态、失败、负向验收和跨上下文，并要求落到需求、假设或问题。缺陷不是未提供部署能力，而是 F1 使某些风险决定可以过早从阻塞变为假设。

- **X04：跨会话与知识升级边界较完整。**  
  `references/brainstorm-sections.md:262-269` 要求 durable source、版本、限制、失效条件及下一问题；`references/phase-0.md:9` 要求恢复时重查陈旧引用；`references/approaches.md:51` 区分独立 verifier 与作者 inline 自检；`references/plan-write.md:26` 只记录知识升级候选。**保持现状成立。**

## 未读文件

| 路径或范围 | 理由 | 未覆盖后果 |
|---|---|---|
| `/Users/kuang/.codex/AGENTS.md` | 已尝试读取，工具返回尚未获得权限；未绕过权限重试。 | 无法核对该文件中的额外全局约束；不能声称已遵循其未展示内容。 |
| `skills/spec-brainstorm/` 中未被入口、references、测试 helper 或 `evals/eval.yaml` 引用的其他文件（若有） | 目录枚举命令未获执行许可；已读完可达引用链，但不能证明目录清单穷尽。 | 可能遗漏孤立资产或未登记用例；本报告不声称完成目录级资产清点。 |
| `src/cli/plugin-sync.js:241` 至文件末尾 | 此文件为补充追溯，不在用户提供的消费者文件清单中；本轮读取了前 240 行及相关消费者测试。 | 未完整审计通用投射实现，不对全部宿主转换代码给出实现正确性结论。 |
| 其他宿主 adapter 实现及实际 generated runtime 文件 | 本轮以当前 source 静态合同为对象；没有执行投射或 runtime drift 检查。 | 不证明实际安装副本、缓存定义或全部宿主行为与 source 一致。 |

消费者清单所列 15 个文件均已完整读取，无清单内未读文件。HEAD 与 clean 状态采用会话提供的 `5b59293b` 快照，未获得新的 Git 命令验证结果。全程未修改文件、未调用其他评审者，也未把测试源码中的断言视为本轮测试通过。

## 结论一句话

**按本轮静态合同范围，spec-brainstorm 的需求建模、按需上下文与规划衔接总体成立，但产品阻塞授权、debug 入口、eval 来源身份及 headless 边界存在可定位缺口，当前不宜判为通过。**
