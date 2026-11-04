# spec-work 评审（R2）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/spec-work/references/feedback-and-tests.md:65–94`；`skills/spec-work/references/implementation-quality.md:108–121` | 约束围绕可观察行为、测试替身失真、证据保护和过度抽象等具体失败，允许非行为修改使用明确例外，没有把统一 TDD 仪式强加给所有任务。 |
| D02 | pass | `skills/spec-work/references/implementation-quality.md:44–80`；`skills/spec-work/references/work-intake-and-task-pack.md:79–104` | 提供 canonical owner、thin-glue、复用取舍等工程知识，并把 hash/schema 事实与语义适配判断分开。 |
| D03 | pass | `skills/spec-work/references/shipping-workflow.md:30–40,130–168`；`tests/unit/spec-work-shipping-contracts.test.js:33–47,70–100` | 必需证明对账、最终修改后复验、summary→closeout 顺序及声明上限明确，且没有把转录校验冒充执行或语义完整性证明。 |
| D04 | fail | `skills/spec-work/references/shipping-workflow.md:56–58,170–186`；`src/cli/helpers/spec-work-run-artifact.js:595–597,700–731` | 新运行在最终 closeout 前必须写恢复状态，但状态 helper 又要求 closeout 才产生的有效 `run.json`，前后阶段存在初始化断链。 |
| D05 | fail | `skills/spec-work/SKILL.md:32–51`；`skills/spec-work/references/shipping-workflow.md:58,170–186` | 按需加载与 owner 索引成立，但恢复状态和最终 artifact 的身份、创建时机不一致，关键路径无法仅凭现有规则无矛盾地执行。 |
| D06 | pass | `skills/spec-work/references/execution-strategy.md:89–165`；`skills/spec-work/references/execution-engines.md:29–39`；`tests/unit/dispatch-authorization-matrix-contracts.test.js:307–426` | 源码按实际授权、可调用能力和隔离事实选择委派，支持 inline 降级；没有把模型名、宿主名或 profile 标记当作执行能力证明。 |
| D07 | pass | `skills/spec-work/evals/examples.json:22–55,124–139`；`tests/unit/spec-work-outcome-judges.test.js:116–169` | 已把漂移、伪 closeout、缺失执行轨迹、陈旧指纹等具体失败转成维护用反例；本裁决仅确认维护机制存在，不声称经验收益已兑现。 |
| D08 | pass | `skills/spec-work/SKILL.md:32–51`；`skills/spec-work/references/work-intake.md:40–42`；`skills/spec-work/references/work-intake-and-task-pack.md:104,134–151` | 长计划使用 section map 和任务上下文，同时保留决策与完整任务对象，未把压缩视图当作无损输入。 |
| B01 | pass | `skills/spec-work/SKILL.md:3,19–28,113–117`；`skills/spec-work/references/input-triage.md:22–50` | 实施入口、debug 等负例、metadata-first 路由和 Return-to-Caller 职责均可定位，没有强制所有请求走完整链路。 |
| B02 | fail | `skills/spec-work/references/execution-strategy.md:173–179`；`skills/spec-work/references/shipping-workflow.md:58,170–186`；`src/cli/helpers/spec-work-run-artifact.js:287–325,700–731` | `run.json` 同时被描述为初始运行身份和最终验证 artifact，而当前 producer/reader 只支持后者，reference 与实际消费者前提不一致。 |
| B03 | pass | `skills/spec-work/references/execution-strategy.md:99–115,147–165,194–211`；`skills/spec-work/references/tracker-defer.md:43`；`skills/spec-work/references/agents/figma-design-sync.md:7–11` | 委派、worker 写面、Git、凭据、外部建单与视觉取证均有独立边界；执行模式和材料内容不自动扩大授权。 |
| B04 | pass | `skills/spec-work/references/execution-strategy.md:33–48`；`tests/unit/plugin-modules.test.js:823–934`；`tests/unit/target-repo-containment.test.js:20–33,86–126` | source/runtime 边界明确，投射检查遍历注册宿主，helper 使用 package-local 路径；个别“五宿主”旧文案不足以证明实际投射缺失。 |
| B05 | fail | `skills/spec-work/references/shipping-workflow.md:58`；`src/cli/helpers/spec-work-run-artifact.js:700–731`；`skills/spec-work/references/tracker-defer.md:132–159` | 除恢复初始化断链外，建单失败后的重试和跨 sink 回退未先区分“确定未创建”与“已创建但响应未知”，存在重复外部副作用路径。 |
| B06 | pass | `skills/spec-work/references/shipping-workflow.md:72–118,130–202`；`skills/spec-work/references/return-to-caller.md:31–66` | 审查强度、修复归属、严重残余、最终验证、生命周期及未完成披露均有明确合同；caller 返回不冒充完整 shipping。 |
| X01 | fail | `skills/spec-work/references/work-intake-and-task-pack.md:112–175`；`skills/spec-work/references/execution-strategy.md:119–182`；`skills/spec-work/references/shipping-workflow.md:58` | 分解、依赖和共享写面处理充分，但长任务所依赖的 append-only 恢复记录缺少新运行可达的初始化路径。 |
| X02 | pass | `skills/spec-work/references/implementation-quality.md:55–102`；`skills/spec-work/references/feedback-and-tests.md:100–130`；`skills/spec-work/references/execution-strategy.md:62–64` | 跨模块合同、公共边界与架构偏离有消费者检查和回到计划 owner 的路径，不把实现中的新发现自动升级为架构授权。 |
| X03 | pass | `skills/spec-work/references/feedback-and-tests.md:52–73,122–150`；`skills/spec-work/references/shipping-workflow.md:72–104,204–212` | 风险优先验证、真实 integration seam、严重风险阻断及部署后验证计划均有覆盖，部署和落地没有被实施授权隐含包含。 |
| X04 | fail | `skills/spec-work/references/return-to-caller.md:31–66`；`skills/spec-work/references/agents/figma-design-sync.md:15–49`；`skills/spec-work/references/execution-strategy.md:173–180` | 协作 packet、freshness 与 knowledge-work 分支存在，但跨中断恢复的持久状态在新运行中无法按规定时序建立。 |

## Findings

### F1｜P1：恢复状态依赖最终 closeout artifact，新运行无法按合同初始化

**位置**

- `skills/spec-work/references/shipping-workflow.md:56–58`
- `skills/spec-work/references/shipping-workflow.md:170–186`
- `skills/spec-work/references/execution-strategy.md:173–179`
- `src/cli/helpers/spec-work-run-artifact.js:595–597,700–731`

**触发与后果**

新运行进入 shipping，尚未执行 simplify、review followup 或最终验证：

1. shipping 要求在每个 mutation/verification transaction 前写入 `started`，并保持 generation-0 `run.json` 不可变。
2. `state-write` 首先调用 `readSpecWorkRunState`；后者必须读取并校验已有 `run.json`，文件不存在即返回 `artifact-unreadable`。
3. 当前 workflow 直到最终验证、summary、honest-closeout 之后，才条件式调用 producer 创建 `run.json`；未命中 trigger 时甚至不创建。
4. producer 本身还校验 run-summary 引用，不能把现有最终产物无条件提前当作初始身份使用。

因此，正常新运行无法先建立要求的恢复记录：严格执行会在首次 transaction 前阻塞；绕过则没有承诺的中断恢复证据。现有状态测试通过预置 `run.json` 覆盖恢复行为，不能补上新运行的初始化路径。

**最小修复建议**

先明确并分离两种身份：

- 若恢复仅支持**已有 closeout artifact 的后续运行**，限定 state contract 的适用条件，删除对所有新运行 transaction 的无条件要求，并明确首次运行恢复能力的限制。
- 若必须支持**首次运行中的恢复**，提供轻量、独立的初始化身份合同及明确调用时点，让最终验证 artifact 引用它；不要提前伪造最终验证结果，也不要覆盖 immutable `run.json`。

同步增加一个从空 run root 开始的链路用例：初始化 → `started` → terminal snapshot → 最终 summary/closeout。

**归因范围：** reference 合同与 helper 前提的集成缺陷；不是模型未遵守指令，也不是因为本轮没有运行测试。

### F2｜P2：建单结果未知时直接重试或切换 sink，可能产生重复工单

**位置**

- `skills/spec-work/references/tracker-defer.md:132–146`
- `skills/spec-work/references/tracker-defer.md:159`

**触发与后果**

创建请求已在服务端成功，但客户端收到 5xx、连接中断或其他无法确认结果的失败：

- 非交互路径要求自动进入下一个 sink。
- 交互路径提供直接重试。
- GitHub 路径还要求首次失败后改为无 label 创建。

这些规则没有先查询原请求是否已产生工单。因而同一 finding 可能在原 tracker 与 fallback tracker 各建一次，或在 GitHub 中重复创建；最终回执也可能只记录后一张工单。

**最小修复建议**

区分确定性拒绝与未知结果：

- 明确的 label 不存在、输入校验拒绝等，可修正后重试。
- 超时、连接中断、无法确定创建结果的服务端失败，先用稳定 finding 标识或请求关联信息查询原 sink。
- 无法核实则返回 `creation-outcome-unknown`，保留 pending 状态；不得自动再建或切换 sink。
- 对外返回所有已确认创建的工单引用，避免隐藏部分成功。

该修复应保持现有外发授权边界，不以“已有建单授权”代替重复副作用判断。

## 主责深挖面发现

### B01–B04：入口、合同、授权与宿主

- **实际路径成立：** mode 解析 → metadata-first 分类 → task pack 或直接 plan intake → workspace/执行策略 → 单元实现与局部验证 → standalone shipping 或 caller 返回。`execution: knowledge-work` 单独进入非代码生产，不强行套用分支、测试和 PR 流程。
- **合同基线按采纳状态使用：** `core/08-skill-contract-protocol.md` 中拟议 YAML、字段数量与自动检查示例没有被直接提升为现行强制合同；当前 owning source 才决定实际执行义务。
- **授权设计保持现状成立：** dispatch authorization、实际能力、隔离强度、Git 写权限和 landing 分开判断。缺少 mutation worker 的宿主强制能力时走 inline，而不是把 prose 禁令称为 sandbox。
- **source/runtime 设计保持现状成立：** canonical source、package-local helper 和注册宿主投射可追溯。静态投射合同不等于宿主 loader 已观察成功，本报告不作后者声明。
- **主要合同缺口：** F1 不是字段不齐，而是生产者与消费者对同一 artifact 的时间语义不同。

### X01–X04：复杂任务、演化、高风险与协作

- **复杂执行的有效设计：** task-pack drift、metadata/readiness 重查、依赖阻断、有限 review 轮次、共享目录争用及 actual-tree integration 均有明确处理。
- **架构变化保持现状成立：** reuse/extend/compose/new 是语义判断框架；thin-glue 不拥有参与方领域真相，实质架构偏离回到 plan owner，而非由实现者静默扩展范围。
- **高风险出口保持现状成立：** headless 不自动接受严重风险；未执行的必需验证不能因记录 residual 或 summary 合法而变成通过。
- **协作证据保持现状成立：** Return-to-Caller 明确交出本地验证事实而非 PR/CI 完成声明；Figma 比较要求同 origin/route、viewport/state 和新鲜截图，修改后旧截图失效。
- **恢复与外部副作用仍需修正：** F1 影响长任务和中断恢复；F2 影响 tracker 的部分成功与未知结果处置。两者均应修在 source owner，不应靠 runtime mirror 补丁规避。

## 未读文件

已完成入口、全部 references（含 `non-code-execution.md` 与 Figma agent）、检查表、合同基线、清单所列 **29 个消费者**及两份 package-local 脚本的读取。以下为未展开的可选 eval 资产，不计作已验证。

下面路径均相对于 `skills/spec-work/`，每项单独列出。

### 未展开的 eval case

**理由：** 本轮审查静态合同及消费者链路，未运行行为 eval；已读取 eval manifest、examples 和 outcome-judge 校准测试。  
**未覆盖后果：** 不确认各 case 的 prompt、断言、超时与实际场景完全匹配，不声称行为回归通过。

- `evals/cases/return-to-caller-envelope.yaml`
- `evals/cases/trivial-bare-prompt-executes.yaml`
- `evals/cases/open-ended-routes-debug.yaml`
- `evals/cases/non-active-rejects.yaml`
- `evals/cases/r2-reverse-mismatch.yaml`
- `evals/cases/r2-open-ended-500.yaml`
- `evals/cases/requirements-only-stops.yaml`
- `evals/cases/drifted-pack-rejects.yaml`
- `evals/cases/standalone-closeout-order.yaml`
- `evals/cases/no-commit-auth-stays-uncommitted.yaml`

### 未展开的 judge 实现

**理由：** 已读直接消费者中的正反例校准源码，未进一步审计 judge 实现。  
**未覆盖后果：** 不确认 judge parser、命令识别及证据关联不存在绕过或误判。

- `evals/fixtures/scripts/check-readme-fixed.sh`
- `evals/fixtures/scripts/check-r2-reverse-mismatch.sh`
- `evals/fixtures/scripts/check-uncommitted-handback.sh`
- `evals/fixtures/scripts/check-no-implementation.sh`
- `evals/fixtures/scripts/check-closeout-order.sh`
- `evals/fixtures/scripts/check-return-to-caller.sh`

### 未展开的 fixture 内容

**理由：** 没有执行 fixture 或行为回放；这些文件不是本轮已确认两项缺陷的判定依据。  
**未覆盖后果：** 不确认 fixture 的准备过程、服务行为、计划状态与 case 预期完全一致。

- `evals/fixtures/repos/drifted-pack/prepare-eval.cjs`
- `evals/fixtures/repos/drifted-pack/README.md`
- `evals/fixtures/repos/drifted-pack/package.json`
- `evals/fixtures/repos/drifted-pack/src/server.js`
- `evals/fixtures/repos/drifted-pack/docs/plans/2026-09-01-001-feat-month-filter-tasks.md`
- `evals/fixtures/repos/reqonly-plan/prepare-eval.cjs`
- `evals/fixtures/repos/reqonly-plan/README.md`
- `evals/fixtures/repos/reqonly-plan/package.json`
- `evals/fixtures/repos/reqonly-plan/src/server.js`
- `evals/fixtures/repos/reqonly-plan/docs/plans/2026-09-01-001-feat-month-filter-plan.md`
- `evals/fixtures/repos/done-plan/prepare-eval.cjs`
- `evals/fixtures/repos/done-plan/README.md`
- `evals/fixtures/repos/done-plan/package.json`
- `evals/fixtures/repos/done-plan/src/server.js`
- `evals/fixtures/repos/done-plan/docs/plans/2026-09-01-001-feat-month-filter-plan.md`
- `evals/fixtures/repos/mini-ledger-guarded2/prepare-eval.cjs`
- `evals/fixtures/repos/mini-ledger-guarded2/README.md`
- `evals/fixtures/repos/mini-ledger-guarded2/package.json`
- `evals/fixtures/repos/mini-ledger-guarded2/src/server.js`
- `evals/fixtures/repos/mini-ledger-guarded2/docs/plans/2026-09-01-001-feat-month-filter-plan.md`

**其他读取与验证限制：**

- `/Users/kuang/.codex/AGENTS.md`：读取未获权限，未绕过；无法核对其中未提供的附加规则。
- `src/cli/helpers/spec-work-run-artifact.js`：仅展开 artifact 创建、状态读写及相关前提，不声称完成该大型 helper 的全文件审计。
- 本轮只做静态源码审查，未运行 Jest、eval 或宿主 loader 验证；未修改文件、提交、推送或刷新 runtime。表中 `pass` 仅表示相应静态承诺存在、内部一致且可定位，不表示运行表现或真实研发收益已验证。
- 多项 `fail` 共同引用 F1，是同一根因的不同受影响检查面，不应统计为多个独立缺陷。

## 结论一句话

**spec-work 的入口、授权、source/runtime 和验证声明边界总体成立，但首次运行的恢复状态初始化断链及建单未知结果下的重复副作用风险需要修复，当前不宜判定静态合同整体通过。**
