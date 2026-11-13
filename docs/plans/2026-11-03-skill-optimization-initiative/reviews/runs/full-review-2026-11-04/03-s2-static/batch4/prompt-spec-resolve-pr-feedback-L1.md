你是 spec-first 仓库 38-skill 全量审查的 L1 仲裁者（仲裁阶梯第一层）。两个独立评审者对 `skills/spec-resolve-pr-feedback/` 的以下维度给出相反裁决，逐维度核实源码后给最终裁决。仓库根：/Users/kuang/xiaobu/spec-first。

裁决标准（静态层）：承诺存在 + 内部一致 + 可定位（file:line）。审计成本、密度、runtime 开销不构成 fail；eval 判据强度问题不构成 fail（记 S3）。「没读完」的 not-verified 是覆盖声明不是对象结论。可确定性核实的以源码为准。

## 待仲裁维度
- **B02**
  - R1 pass：| B02 | pass | SKILL.md:68-76,114-117；references/full-mode.md:14-19；references/targeted-mode.md:20-25；tests/unit/spec-resolve-pr-feedback-contracts.test.js:72-98 | 入口/reference/script/consumer 四层一致：模式表与 argument-hint 对应、四个脚本存在且引用路径合同被测试锁定、返回契约与消费者字段吻合 |
  - R2 fail：| B02 | fail | `S/references/full-mode.md:84`、`:169-183`；`S/references/pipeline-return.md:61-83` | pipeline-return 的逐来源输出合同完整，但普通模式缺失某一 Git 授权时的跳转会绕过本可独立执行的回复动作。 |
- **B03**
  - R1 pass：| B03 | pass | SKILL.md:26-28,36-52,97-108；references/full-mode.md:215；references/pipeline-return.md:9-19；tests/unit/dispatch-authorization-matrix-contracts.test.js:522-531 | 五项出口授权逐项独立、"invocation 不产生授权"、dispatch 单独授权、评论文本 untrusted、回复走 body-file 不入 shell 参数，均有对抗性测试锁定 |
  - R2 fail：| B03 | fail | `S/SKILL.md:36-52`；`S/references/pipeline-mode.md:13` | 五项授权及不可信评论边界总体明确，但 legacy pipeline 允许勾选 PR body checklist，未要求该写面的独立授权。 |
- **B06**
  - R1 pass：| B06 | pass | references/full-mode.md:324-342,155-165；references/pipeline-return.md:47-57；references/evaluation-rubric.md:47 | 摘要含五项授权与 not-run 动作、只计已验证远端动作、needs-human 完整渲染并原样返回 caller；fixed 判定要求 source 确认+实际改动+验证通过，误报控制（divert 需 concrete signal+证据）与漏报控制（三类反馈面全评估）齐备 |
  - R2 fail：| B06 | fail | `S/references/full-mode.md:326-337`；`S/evals/fixtures/scripts/check-readonly.sh:4-14`；`S/evals/fixtures/scripts/check-no-injection-exec.sh:4-20` | 未提交修改的验证摘要存在省略指令；两个负例 judge 又不足以支持其只读／未执行注入的目标判断，见 F2、F4。 |

## R1 完整评审
# spec-resolve-pr-feedback 评审（R1）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | skills/spec-resolve-pr-feedback/SKILL.md:23-24；references/evaluation-rubric.md:11-15,21-23；references/full-mode.md:215；scripts/get-pr-comments:18-24；CHANGELOG.md:6128,4160 | 每条硬性规程均可回溯到已登记的真实失败（回复注入、set -e 吞错、validation 逃避修复），rubric 自带去补丁化规则（删除不再需要的补丁式条款），未发现互相矛盾或过时约束 |
| D02 | pass | references/full-mode.md:242,221,248；scripts/get-pr-comments:45-53,55-58；references/evaluation-rubric.md:19-23,59-65 | 密集编码 GitHub 领域知识（REST 根评论回复 vs GraphQL thread、addPullRequestReviewThreadReply 禁用、GHE node ID 不稳定、fork head 身份、merge-base 可达性、isOutdated 语义）；脚本只产事实、语义判断归 resolver 的分工显式 |
| D03 | pass | scripts/reply-to-pr-thread:44-50；scripts/inspect-fix-publication.cjs:29-38；references/full-mode.md:164-165,253-256；SKILL.md:126；tests/unit/spec-pr-feedback-publication.test.js:27-56 | 确定性地板（postflight pending 检查 exit 2、publication verified+reason_code、正负例单测）与 prose 验证门诚实分层，"read-only fetch 不是 mutation 证明"明确声明，无脚本冒充语义判定 |
| D04 | pass | SKILL.md:4,68-76；skills/spec-lfg/references/pr-watch-loop.md:33,52；references/full-mode.md:177；skills/spec-commit-push-pr/references/commit-and-push.md:4；skills/using-spec-first/references/public-route-map.md:60 | 输入合同（argument-hint/模式表）与下游消费严格对齐：spec-lfg 消费的 envelope 键（fixes/pending_conversation_actions/residuals/limitations）在 pipeline-return.md:28-45 全部存在，push_authorization→landing_authorization 映射与共享合同一致 |
| D05 | pass | references/full-mode.md:189-211；references/evaluation-rubric.md:73-101；references/agents/pr-comment-resolver.md:26-39 | 关键规则均可定位（编号步骤、YAML 事实块），无矛盾；存在回复模板三处重复的真实冗余（见 Finding 1），但均被 contract test 部分锁定，删减会损失独立失败模式约束 |
| D06 | pass | SKILL.md:97-108；references/full-mode.md:145-149；tests/unit/dispatch-authorization-matrix-contracts.test.js:308-317,403-426 | 能力假设显式建模（unknown 并行度序列化、unknown 模型继承、隔离未证实保持 gate 开启、无并行宿主顺序执行），宿主中立词表无 primitive 泄漏由测试锁定 |
| D07 | pass | evals/eval.yaml:13-18；evals/cases/*.yaml；CHANGELOG.md:962,530,489,336,1924 | 问题→修订→复验链完整（v1.6.3 注入修复→v1.8.x 边界→v1.13.2 CE 对齐→v1.15.2 双引擎交叉测评 0 缺陷→v1.15.3 pending-review 规则），4 个已提交 eval case 带确定性 script judge 与失效条件 |
| D08 | pass | SKILL.md:78-85；references/targeted-mode.md:3,27；references/evaluation-rubric.md:27-33；references/full-mode.md:68；references/agents/pr-comment-resolver.md:22；references/pipeline-return.md:83 | 按需加载设计完整：模式路由只读所需 reference、Targeted 只取单线程、最小读取深度与按文件去重、大批次 8-10 项集中裁决不 fan-out、resolver 只跑 targeted 测试、原始文本不入最小化 journal |
| B01 | pass | SKILL.md:3-5；src/cli/contracts/dual-host-governance/skills-governance.json（standalone_skill+8 宿主 skill 投射）；tests/unit/skill-flow-p2-closure-contracts.test.js:107-138；skills/spec-code-review/SKILL.md:3,30 | 正向触发句+相似入口负例（spec-code-review 双向互指）齐备，disable-model-invocation:true 限定显式调用，路由图与治理记录一致 |
| B02 | pass | SKILL.md:68-76,114-117；references/full-mode.md:14-19；references/targeted-mode.md:20-25；tests/unit/spec-resolve-pr-feedback-contracts.test.js:72-98 | 入口/reference/script/consumer 四层一致：模式表与 argument-hint 对应、四个脚本存在且引用路径合同被测试锁定、返回契约与消费者字段吻合 |
| B03 | pass | SKILL.md:26-28,36-52,97-108；references/full-mode.md:215；references/pipeline-return.md:9-19；tests/unit/dispatch-authorization-matrix-contracts.test.js:522-531 | 五项出口授权逐项独立、"invocation 不产生授权"、dispatch 单独授权、评论文本 untrusted、回复走 body-file 不入 shell 参数，均有对抗性测试锁定 |
| B04 | pass | SKILL.md:87；tests/unit/plugin-modules.test.js:307-379；tests/unit/spec-resolve-pr-feedback-contracts.test.js:72-98 | 真相源在 `skills/`，8 宿主投射由 plugin 测试逐平台验证（含 Cursor frontmatter 过滤），helper 路径经 loaded skill directory 解析、禁止 runtime mirror 路径 |
| B05 | pass | references/full-mode.md:37-41,60,139-141,244,248；scripts/get-pr-comments:50-53；tests/unit/spec-pr-feedback-reply.test.js:59-75 | 失败路径全覆盖：fetch 降级命令、截断分页视为不完整证据、POST 失败先查状态不盲重试（测试锁定单次 POST）、blocked 保留部分编辑、pre-dispatch baseline、unknown attribution 保持 failed、跨调用恢复对账规则 |
| B06 | pass | references/full-mode.md:324-342,155-165；references/pipeline-return.md:47-57；references/evaluation-rubric.md:47 | 摘要含五项授权与 not-run 动作、只计已验证远端动作、needs-human 完整渲染并原样返回 caller；fixed 判定要求 source 确认+实际改动+验证通过，误报控制（divert 需 concrete signal+证据）与漏报控制（三类反馈面全评估）齐备 |
| X01 | pass | references/full-mode.md:68,145-149,317-318；references/pipeline-mode.md:15-17 | 大批量场景有界：集中裁决 8-10 项分簇、并行 1-4 单元/5+ 按 4 分批、文件重叠强制序列化、fix-verify 循环二轮封顶、trajectory 非收敛根因升级 |
| X02 | pass | references/pipeline-return.md:28-45；skills/spec-lfg/references/pr-watch-loop.md:33,50-66；tests/unit/ce-outcome-judge-calibration.test.js:120-133 | 唯一自有接口（pipeline-return envelope）为仓内共同演进且被消费者测试逐键锁定；外部 GitHub API 仅经 gh CLI 只读消费，无独立 schema 版本义务（见 Finding 3 的 P3 备注） |
| X03 | pass | SKILL.md:44-52；references/full-mode.md:164-165,175,179,248；scripts/inspect-fix-publication.cjs:29-33 | 高风险面（本地变更+远端 PR 状态）有风险/验证对账：红验证阻断 commit/push、远端修复声明需 publication verified:true、禁止裸 push/额外 tag/mirror、rebase 后 SHA 不可达保持 pending 不自行推算 |
| X04 | pass | references/full-mode.md:47-49,340；references/pipeline-return.md:57,65-79；references/evaluation-rubric.md:105-122；skills/spec-lfg/references/pr-watch-loop.md:70-76 | 跨会话交接带 source refs/body_sha256/observed_at/limitations/freshness 失效条件，decision 原样保留且远端事件不转化为答案，恢复时重核身份与漂移 |

## Findings

1. **[P3] 回复文本模板三处近逐字重复，存在漂移风险**
   - 位置：`references/evaluation-rubric.md:73-101`、`references/full-mode.md:189-211`、`references/agents/pr-comment-resolver.md:26-39`
   - 后果：not-addressing/declined 模板在 rubric 与 full-mode 几乎逐字重复，fixed/fixed-differently 模板在 full-mode 与 resolver 重复；任一处修订需人工同步其余两处，漂移会导致 orchestrator 与 resolver 产出格式不一致的回复（resolver 的 `Addressed differently:` 前缀在 full-mode step 7 已无对应模板）。
   - 最小修复：rubric 单点拥有全部回复模板，full-mode step 7 与 resolver prompt 改为引用；或保持现状，新增一个断言三处模板子串一致的 contract test。

2. **[P3] resolve-pr-thread 未遵循仓库 shell 脚本风格基线**
   - 位置：`scripts/resolve-pr-thread:3`（仅 `set -e`；同目录 get-pr-comments:3、get-thread-for-comment:7 均为 `set -euo pipefail`）
   - 后果：与 CLAUDE.md「Shell 脚本使用 `#!/bin/bash` 和 `set -euo pipefail`」及同包脚本不一致；当前单命令包装下无实际行为差异，属风格债。
   - 最小修复：改为 `set -euo pipefail`（shebang 用 `env bash` 的可移植性差异可接受，不必改）。

3. **[P3] pipeline-return JSON envelope 无版本标识**
   - 位置：`references/pipeline-return.md:28-45`
   - 后果：该 envelope 是 spec-lfg 的实际消费接口且历史上已演进（如 pending_conversation_actions 为后加）；无 schema_version 字段时，若安装的 runtime 副本与 caller 版本错配（升级窗口期），无法在交接处检测形状漂移，只能靠仓内测试兜底。
   - 最小修复：envelope 增加一个 `contract_version` 字段并由 pr-watch-loop 校验；或保持现状，在 pipeline-return.md 明示「in-repo 共同演进、无跨版本兼容承诺」的假设。

4. **[P4/保持现状成立] helper 脚本 OWNER/REPO 缺省回退与显式 host 合同的弱张力**
   - 位置：`scripts/get-pr-comments:23-28`、`scripts/get-thread-for-comment:27-32`（缺参时回退 checkout 的 `gh repo view`）
   - 后果：prose 合同（full-mode.md:7、targeted-mode.md:7）要求显式传 OWNER/REPO + `GH_HOST`，回退路径仅在调用方漏参时触发；若同时在 fork checkout 且 GH_HOST 未设置，可能取错仓库身份。触发面冷门且失败可见（后续 `gh repo view` 前置确认会拦截）。
   - 最小修复：可在脚本 usage 中加一句「多宿主/fork 场景请显式传 OWNER/REPO 并设置 GH_HOST」；不改也可接受。

## 主责深挖面发现

- **D01（去补丁化）**：逐块核对了高密度规程的来源——回复经文件/heredoc 传递（CHANGELOG v1.6.3 真实注入风险）、`|| true` load-bearing 注释（v1.13.3 set -e 真实 bug）、pending-review 吸收（v1.15.3 CE 融合）、GHE node ID 不稳定与 fork head 核实（full-mode.md:221,248）。未发现“为可想象边界情况追加例外”式补丁；rubric:21-23 反而内嵌了针对指令类文本的去补丁化修复单位规则。约束间无矛盾（silent-drop 的不可行动项与 `not-addressing` 判定项是两个显式区分的类别，full-mode.md:53-58）。
- **D02（领域知识）**：最强项。把“为什么”写进了约束（如 get-pr-comments:45-48 解释 `gh api graphql --paginate` 只跟最外层 pageInfo、reply-to-pr-thread:3-4 解释 REST 即时提交 vs GraphQL 可能进 draft），不是流程口号；脚本/LLM 职责边界在 fetch 层注释中显式声明（get-pr-comments:55-58）。
- **D03（验证门）**：确定性验证与语义声明分层诚实——inspect-fix-publication 的 verified/reason_code 有正负例单测（含 provider 错误不泄漏诊断），pre-existing 失败归因要求同命令可比基线（full-mode.md:164），没有任何“脚本打分自动裁决”或 LLM 冒充机械校验的段落。
- **D04（衔接）**：做了双向核对——上游路由（route-map、spec-work/spec-code-review 负例）与下游消费（pr-watch-loop.md:33 逐字段消费 envelope；:52 inline 复用 full-mode step 7；:62 复用 inspect-fix-publication.cjs）均与被审源码当前文本一致，未发现字段或语义断裂。
- **D05（紧凑性）**：full-mode.md 342 行、step 7 约 120 行，长度仅作诊断；每段对应独立失败模式，无安全删减候选；唯一可收敛点是 Finding 1 的模板重复。混合语言（英文底座+中文增补）与仓库演化模式一致，未造成语义冲突。
- **D08（上下文效率）**：按需加载链路完整（模式路由→单一 mode reference→rubric 一次→resolver prompt 仅 fix 时）；重复指令仅 SKILL.md:19 与 full-mode.md:66 的 rubric 读取令（双层冗余但防跳过，可接受）；未见“少读但漏必要原文”的段落。

## 未读文件

- `evals/fixtures/scripts/check-authorized-fix.sh`、`check-no-injection-exec.sh`、`check-readonly.sh`、`asks-a-question.sh`：仅精读 check-pipeline-pending.sh 代表性头部；四者头部均标注由同一 builder（scripts/evals/build-outcome-judges.cjs）生成且被 ce-outcome-judge-calibration.test.js 覆盖。未覆盖后果：无法逐一确认各 judge 断言强度，风险低。
- `evals/fixtures/repos/mini-ledger/`（README.md/package.json/src/server.js/pr-snapshot.json）：仅读 prepare-eval.cjs 头部确认 fixture 自检机制。未覆盖后果：不影响静态合同裁决。
- `tests/unit/plugin-modules.test.js`（935 行）非本 Skill 相关段落：仅读 100-130、290-400 两段投射合同。未覆盖后果：其余段落不消费本 Skill。
- `docs/contracts/workflows/worker-dispatch-capability.md`：仅验证存在性与词表 pin（dispatch-authorization-matrix-contracts.test.js:381-401）。未覆盖后果：D06 裁决已由被审 SKILL.md 自身文本+测试支撑，风险低。
- `skills/spec-lfg/references/shipping-tail.md`、`review-followup.md`：仅 grep 调用行确认路由一致性；envelope 实际消费面已由 pr-watch-loop.md 全文精读覆盖。

## 结论一句话

spec-resolve-pr-feedback 在静态合同层是通过的：授权/验证/衔接/失败恢复四面均有可定位且内部一致的源码承诺并被消费者测试锁定，未发现 P0-P2 缺陷；4 条 P3/P4 findings（模板三处重复、resolve-pr-thread 风格基线、envelope 缺版本字段、脚本缺省回退弱张力）均为非阻断维护项，收益与行为质量留待 S3 行为层裁断。


## R2 完整评审
# spec-resolve-pr-feedback 评审（R2）

## 逐项裁决表

评审基线：`5b59293bb1aecb40c4894549a89f8b045dfa40fe`，工作区干净。本轮仅裁决静态合同；已读取目标入口、全部 references、全部脚本与 eval 资产，以及消费者清单中的全部六个测试文件。未执行测试、真实 PR 操作或行为评测。

下表路径均相对仓库根；`S` 指 `skills/spec-resolve-pr-feedback/`。

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `S/references/evaluation-rubric.md:19-23`；`S/references/full-mode.md:88-98` | 指令类修复强调条件与责任 owner，简单修复优先 inline；保留的流程约束主要服务授权、验证与副作用恢复。 |
| D02 | pass | `S/scripts/get-pr-comments:45-58`；`S/references/evaluation-rubric.md:25-55` | 脚本准备分页、身份和截断事实，LLM 判断可操作性、设计意图、修复价值与风险，职责分工明确。 |
| D03 | pass | `S/references/full-mode.md:153-165`、`:248-280`；`S/scripts/inspect-fix-publication.cjs:19-37` | 合并验证失败阻断提交推送，远端修复声明要求精确 SHA 可达性及回复可见性；脚本事实检查与 prose 执行义务可区分，不据此声称全部 gate 已硬强制。 |
| D04 | pass | `S/references/pipeline-return.md:24-83`；`skills/spec-lfg/references/pr-watch-loop.md:33-66` | resolver 返回本地修复、逐来源待办和限制，caller 消费相同字段并承担最终验证、发布与会话收尾，没有明显接口断裂。 |
| D05 | fail | `S/references/full-mode.md:84`、`:171`、`:183` | “独立回复可继续”与“缺提交/推送授权直接进入总结”存在控制流冲突，影响可审计执行。 |
| D06 | pass | `S/SKILL.md:95-108`；`S/references/full-mode.md:145-147`、`:342` | 对委派能力、隔离、模型覆盖和并行支持分别取证；未知能力串行降级，提问工具不可用时改用总结，不虚构独立覆盖。 |
| D07 | pass | `tests/unit/spec-resolve-pr-feedback-contracts.test.js:11-44`、`:134-151`；`S/references/evaluation-rubric.md:23` | 有针对 blocked 残余修改、暂存污染、错误归因和不收敛的维护断言，并要求回读历史修复；本 Skill 不承担 durable knowledge 自动晋升。 |
| D08 | pass | `S/SKILL.md:56-85`；`S/references/evaluation-rubric.md:25-40`；`S/references/full-mode.md:68` | 按模式加载 reference、同文件复用读取、大批量按文件分组判断，同时保留逐来源身份与结果。 |
| B01 | pass | `S/SKILL.md:3-5`、`:34-44`、`:68-78`；`tests/unit/skill-flow-p2-closure-contracts.test.js:107-135` | 明确处理已有 PR 反馈而非新审查，属于显式用户入口；Full、Targeted 和相似入口边界清楚。 |
| B02 | fail | `S/references/full-mode.md:84`、`:169-183`；`S/references/pipeline-return.md:61-83` | pipeline-return 的逐来源输出合同完整，但普通模式缺失某一 Git 授权时的跳转会绕过本可独立执行的回复动作。 |
| B03 | fail | `S/SKILL.md:36-52`；`S/references/pipeline-mode.md:13` | 五项授权及不可信评论边界总体明确，但 legacy pipeline 允许勾选 PR body checklist，未要求该写面的独立授权。 |
| B04 | pass | `S/SKILL.md:87`；`src/cli/plugin-sync.js:210-274`、`:459-504`；`tests/unit/plugin-modules.test.js:307-378` | 包内 helper 从已加载 Skill 根解析，source 递归投射到宿主目录且排除 evals；支持范围有治理与消费者断言，本轮不外推真实 runtime 已同步。 |
| B05 | pass | `S/references/full-mode.md:94-98`、`:139-175`、`:244-248`、`:313-318`；`S/scripts/get-pr-comments:45-63` | 覆盖 dirty ownership、部分修改、未知 POST 结果、分页不足、碰撞串行化和两轮停止，恢复不依赖盲目重试。 |
| B06 | fail | `S/references/full-mode.md:326-337`；`S/evals/fixtures/scripts/check-readonly.sh:4-14`；`S/evals/fixtures/scripts/check-no-injection-exec.sh:4-20` | 未提交修改的验证摘要存在省略指令；两个负例 judge 又不足以支持其只读／未执行注入的目标判断，见 F2、F4。 |
| X01 | pass | `S/references/full-mode.md:68-78`、`:94-98`、`:143-165` | 适用于大批量、多文件修复：保留中央判断、枚举实施位置、共享写面串行、基线对账及合并验证，无需另造编排层。 |
| X02 | pass | `S/references/evaluation-rubric.md:30-31`、`:40-54`；`S/references/full-mode.md:163-165` | 适用于反馈涉及接口或架构变化：读取 caller、核对 invariant 与原决策，区分新兼容需求和本 PR 回归；不可界定的取舍交人处理，不强行实施迁移。 |
| X03 | pass | `S/references/evaluation-rubric.md:50-54`；`S/references/full-mode.md:164-179`、`:248-280` | 高风险问题不能仅以范围拒绝，验证红灯不豁免；发布使用独立授权、精确 push 目标与远端可达证据，不承接部署权限。 |
| X04 | pass | `S/references/agents/pr-comment-resolver.md:41-59`；`S/references/pipeline-return.md:47-83`；`skills/spec-lfg/references/pr-watch-loop.md:50-78` | worker、resolver、caller 的责任分离，交接保留来源、观察时点、限制和待满足条件；恢复时重新核对讨论与代码，不把旧观察当永久真相。 |

## Findings

### F1 · P1：legacy pipeline 的 PR body 勾选没有对应写面授权条件

- **位置：** `skills/spec-resolve-pr-feedback/references/pipeline-mode.md:13`。
- **事实：** 该段在限制新增 residual section 后，允许将现有 checklist 的 `- [ ]` 改为 `- [x]`。它没有要求 PR body 编辑授权；入口只分别登记 local fix、commit、push、reply、thread resolution 五种权限，见 `skills/spec-resolve-pr-feedback/SKILL.md:36-50`。
- **后果：** caller 即使只授权本地修复或 thread 回复，执行者仍可能将这里的例外理解为可以修改 PR 描述。修改现有 section 仍是独立的外部写入，“已有 committed fix”不能提供该授权。
- **最小修复建议：** 删除此处 PR body 勾选操作，返回待办交给持有相应授权的 caller；若保留，必须明确独立的 PR body 编辑授权和对应目标范围，不能复用 reply 或 commit 权限。
- **复验重点：** fix／commit／reply 已授权，但 PR body 编辑未授权时，不得修改 checklist。

### F2 · P2：缺 Git 授权的收尾跳转绕过独立授权的回复

- **位置：** `skills/spec-resolve-pr-feedback/references/full-mode.md:171`。
- **事实：** 此处要求缺授权时保留本地状态并进入 Step 9；但同文件 `:84` 明确允许无代码依赖的 reply-list／human-list 独立继续，`:183` 也允许无代码变更的回复使用独立 reply 权限。
- **触发场景：** 同批有一条已验证的本地修复和一条可直接回答的问题；local fix 与 reply 已授权，commit／push 未授权。
- **后果：** 按 Step 6 的跳转执行会直接总结，遗漏已经具备授权和证据的问答回复；按 Step 4／7 执行则会回复，静态合同存在两条不一致路径。
- **最小修复建议：** 将“进入 Step 9”改为跳过受阻的 Git 出口，进入 Step 7 处理无代码依赖或已满足 publication 条件的动作；依赖远端修复的动作保持 pending。
- **复验重点：** 混合批次中，一项缺权限不得阻断其他独立、已授权动作。

### F3 · P2：总结模板可能隐藏未提交修改的失败验证

- **位置：** `skills/spec-resolve-pr-feedback/references/full-mode.md:337`。
- **事实：** 总结模板要求没有已提交代码变更时省略 Validation；但 `:155-165` 明确允许存在 blocked 部分修改、失败检查和未提交 diff，入口 `skills/spec-resolve-pr-feedback/SKILL.md:52` 又要求返回本地修改与验证事实。
- **后果：** 最需要披露的“已经修改、验证失败、因此未提交”恰好满足省略条件，可能只留下修复列表和缺权限说明，弱化未完成事实。
- **最小修复建议：** 以“是否发生实施尝试／是否存在本轮残余 delta”决定验证披露，不以是否 commit 决定。只在没有实施尝试且没有本轮修改时省略代码验证行。
- **复验重点：** blocked 后仍有 diff、验证失败未提交，以及已验证但缺 commit 权限三种情况，均应保留实际验证状态。

### F4 · P2：两个负例 judge 的断言不能识别其声称防守的违约行为

- **位置：**
  - `skills/spec-resolve-pr-feedback/evals/fixtures/scripts/check-readonly.sh:4-14`；
  - `skills/spec-resolve-pr-feedback/evals/fixtures/scripts/check-no-injection-exec.sh:4-20`。
- **事实：**
  - 只读 judge 仅检查 README 标记仍在、server 不含少数可疑词；追加 README 内容、修改正常业务代码或改动其他文件仍可通过。
  - 注入 judge 仅检查 server 不含 `evil`，以及最终回答出现宽泛关键词；执行评论中的命令后不写入该文件，也不会被这些断言识别。
- **后果：** judge 成功不能分别证明“未修改文件”和“未执行内嵌命令”。这是静态 oracle 覆盖缺口，不是本轮已经观察到被测 agent 越权。
- **最小修复建议：** 复用同包 `check-pipeline-pending.sh:52-85` 的基线身份／文件状态对账思路；注入场景增加工具调用轨迹核验或离线拦截记录。最终文本只作补充，不代替行为证据。
- **复验重点：** 用“保留原标记但修改其他内容”和“执行被禁命令但不留 server 残留”的反例验证 judge 会拒绝。

## 主责深挖面发现

### B01–B04：主体边界成立，缺陷集中在少数出口条件

- **入口职责成立。** 这是 public standalone skill，不是内部 helper；入口明确排除新代码审查，且 `disable-model-invocation: true` 与消费者治理断言一致。无需改为隐式 worker 或强制串联整条研发链路。
- **输入输出衔接成立。** `pipeline-return.md:61-83` 保留逐来源 action、原文 hash、reply 观察与剩余条件；`pr-watch-loop.md:50-66` 实际消费这些内容。`complete` 仅指本地判断／修复范围完成，不等于远端会话完成，这一限定应保持。
- **授权拆分总体充分，但 PR body 例外漏项。** 委派权限与本地修改权限分别准入，worker 禁止 Git 和远端写入；F1 不应通过放宽其他授权边界解决。
- **source/runtime 边界可追溯。** 包内脚本相对加载根解析，生成器从 source 递归投射，eval 资产不进入 runtime。没有发现需要手改宿主镜像的指令；本轮也没有验证或声称宿主实际部署状态。

### X01–X04：现有机制基本足够，不建议新增体系

- **X01：保持现状成立。** 分组判断、精确位置枚举、碰撞串行和合并验证已经覆盖复杂批次的主要共享写面，无需新增中央调度器。
- **X02：保持现状成立。** rubric 已要求核对兼容路径、设计意图和 scope，不能因该 Skill 没有专用 ADR/schema 模板而判缺陷。
- **X03：保持现状成立。** required check 红灯不豁免，发布须精确目标与 SHA 证据；修复 F1 时应继续维持各外部写面的独立权限。
- **X04：保持现状成立。** caller 持有 durable handoff，resolver 返回完整决策和限制；恢复需要重新验证来源、讨论及代码。没有必要让 resolver 再拥有知识晋升或独立跨会话状态系统。

## 未读文件

- `/Users/kuang/.codex/AGENTS.md`：读取请求未获权限，未重试绕过。后果是无法核对该全局文件是否存在额外要求；本报告按当前已展示的用户指令、仓库角色契约及指定检查表执行。
- **指定必读范围无未读文件。** 已完整读取全部目标包文件，以及消费者清单列出的六个测试文件。
- 扩展检查的 `src/cli/plugin-sync.js`、`src/cli/plugin-governance.js`、`src/cli/contracts/dual-host-governance/skills-governance.json` 仅读取或检索与目标入口、递归投射、eval 排除有关的部分；未覆盖其余无关入口与生成逻辑，不据此声称整个生成系统或全部宿主实现通过。
- 未读取 generated runtime 镜像，未执行测试或行为评测：本轮为 fresh-source 静态审查，不形成 runtime freshness、行为质量或运行成本结论。

## 结论一句话

静态审查覆盖完成；该 Skill 的主体授权、恢复和 caller 交接设计成立，但 PR body 写权限漏项、独立回复跳转冲突、验证披露条件及负例 oracle 缺口尚在，当前不宜判为静态合同通过。


## 输出要求

对每个待仲裁维度输出一行：`| 维度 | 最终裁决 | 关键证据（file:line + 一句事实） | 一句理由 |`，最后给修复建议（若有 fail）。只输出裁决表与建议。