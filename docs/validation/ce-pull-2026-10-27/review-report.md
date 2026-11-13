# CE 153e605e..00d0a5bb 同步准入审查

本窗口已完成 Git 事实冻结，并完成一轮高影响差异的有界审查。**当前不具备整窗同步准入条件（Not ready）**：存在计划契约冲突、跨模型授权差异，以及旧对账工具不支持新窗口的问题。建议按语义分包吸收，不能直接覆盖本地 skills 或套用历史完成账本。

本报告是同步方案的 advisory 审查输入；引用的 Git 对象、计数、脚本退出码是 confirmed facts。没有实施同步，也没有认定 CE 本身存在下述全部缺陷：R01–R03 是将 CE 直接迁入 spec-first 时的兼容性风险。

## 目标、范围与证据上限

- 目标：固定上游窗口、识别同步阻碍与候选收益，给后续逐路径裁决提供可恢复入口。
- 非目标：本轮不修改被审产品源码、生成 runtime、调用外部模型、提交、推送或创建 PR。
- 上游只读：`/Users/kuang/xiaobu/compound-engineering-plugin`，`153e605e1622154a0d7da095fceed13edcb68bf7..00d0a5bbf1300b2138b65ce724b325dd4dff77ba`。
- 写入目标：`/Users/kuang/xiaobu/spec-first` 的本轮方案、验证材料和 CHANGELOG。
- spec-first 对照基线：`59cb4cb130a31bb1a2335add80d570b87a8b40d4`；开始时已有 4 个 dirty paths。原有清理记录保留；同步技术方案与 CHANGELOG 在本轮补充，不能描述为全部未改动。
- 审查方式：`spec-code-review` inline fallback，`dispatch_authorization_missing`；没有独立 persona、validator 或跨模型覆盖。整体语义审查状态为 `partial/degraded`，不能充当 merge-ready gate。

## 冻结事实

| 项目 | 结果 |
| --- | --- |
| CE package.json 版本 | 3.24.0 -> 3.33.1；这是 CE 包版本，不是 spec-first 版本 |
| 提交数 | 161 |
| 净 diff 记录 | 1,023：A 516、M 494、D 10、R 3 |
| 逐提交涉及的独立路径名 | 1,026，包含重命名旧、新路径；与净记录数口径不同 |
| 净 diff 两端路径集合外的提交路径 | 0；没有发现中间新增后删除、仅存在于提交历史的额外路径名 |
| 祖先关系 | base 是 head 的祖先 |
| 上游工作树 | 冻结及复核时 clean |

原始快照见 [window-snapshot.json](window-snapshot.json)，哈希语义勘误及复核见 [snapshot-supplement.json](snapshot-supplement.json)。`source_tree_sha256` 绑定的是 `git ls-tree -r HEAD` 输出，`inventory_sha256` 绑定文件名清单，均不是 dirty 工作内容快照。初次未保存 dirty 内容哈希，不能补写成历史证据。

[git-object-inventory.json](git-object-inventory.json) 逐条记录端点 Git blob OID、模式及重命名两端；[commit-path-coverage.json](commit-path-coverage.json) 保留全部提交的路径入口。两者只证明冻结与导航覆盖。原快照中的 `schema_version` 是本轮自描述标识，没有对应的项目正式 schema 校验结果。

## 需要先解决的同步问题

### R01 / P1：不能直接引入删除计划 readiness 字段的上游语义

**证据：** CE `73df4650` 的 `skills/ce-plan/references/plan-sections.md` patch 明确删除 `artifact_readiness` 并要求旧计划移除该字段，改为从正文判断可执行性。本地 `skills/spec-plan/references/plan-sections.md:32` 保留字段；`skills/spec-work/references/input-triage.md:34` 明确将 declared unified plan 缺少 readiness 视为非法，`:36` 还使用独立 lifecycle status。

**影响：** 若只同步上游 plan producer，本地 work consumer 会拒绝新计划；若顺带删除 consumer 检查，又会改变本地已建立的 plan/task/review 合同。

**处置：** 本窗口保留本地 `spec-unified-plan/v1` 的 readiness 与 lifecycle 语义，吸收正文充分性判断时继续验证元数据与内容一致。若未来要退役字段，单独做 producer、work、task、review、历史兼容及 consumer replay 的整体迁移，不能混入文案重写。

`autofix_class: manual`；`owner: downstream-resolver`；`requires_verification: true`。候选验证入口：`tests/unit/spec-plan-contracts.test.js`、`tests/unit/spec-plan-consumer-replay-contracts.test.js`。本轮未运行。

### R02 / P1：CE 的默认跨模型外发授权不能替换本地授权与身份回执

**证据：** CE head `skills/ce-code-review/references/cross-model-review.md:54` 将调用 skill 加告知视为授权，`:84` 明确不因用户未另行授权而跳过。该文件还引入统一 acpx transport 和 Antigravity 路线。本地 `skills/spec-code-review/references/cross-model-review.md:17–24` 要求真实 dispatch/数据外发/凭证授权，并在无可认证 provider producer 时保持 dormant，返回 `provider_serving_receipt_unverified`。

**影响：** 全文替换会改变数据接收方与凭证使用边界，并可能把未验证的 serving identity 提升为独立审查证据。安装 CLI、环境标记或配置偏好不能补足这些事实。该风险不表示外发已经发生。

**处置：** 保留本地 admission gates；候选仅限可独立移植的身份混淆防护、输入隔离、有界等待和失败归因。acpx、Antigravity、登录文件传递及 provider 激活另立 scope，明确 credential source、payload、receipt、cleanup 与真实宿主验证。不能为追平版本绕过当前 dormant 状态。

`autofix_class: manual`；`owner: downstream-resolver`；`requires_verification: true`。现有 worker-dispatch 合同测试只能证明对应确定性边界，不能替代真实 provider 身份证据。

### R03 / P2：上游删除 Kiro writer 不等于本地 Kiro 可以退役

**证据：** CE `7b867109` 删除 `src/targets/kiro.ts` 及其测试，并从 `src/utils/resolve-output.ts` 删除 Kiro 分支，提交说明为 dead writer。本地 `src/cli/adapters/platform-registry.js:89` 仍注册 Kiro，`src/cli/adapters/kiro.js:20` 有具体 adapter 与 managed runtime surface。

**影响：** 按上游删除清单迁移本地对应能力会破坏仍受支持的宿主，而不是清理同一段死代码。

**处置：** 保留本地 Kiro；对上游其他被删 helpers 分别检查本地 owner、调用与替代关系，不做目录同名删除。该条是已有直接证据支持的边界结论，尚未完成所有删除文件的消费者审查。

`autofix_class: manual`；`owner: downstream-resolver`；`requires_verification: true`。

### R04 / P1：正式对账 producer 仍绑定历史 517-path 窗口

**证据：** `scripts/check-ce-upstream-reconciliation.cjs:147` 固定历史 `FULL_WINDOW_FACTS`，`:1327` 默认消费该常量，prepare 分支 `:1387` 执行校验。新窗口实际执行退出 1：`full-window path count must be 517, got 1023.`，精确 argv、stderr 和产物检查见 [reconciliation-probe.json](reconciliation-probe.json)。

**影响：** 当前不能把新 raw inventory 冒充正式 adjudication input，也不能复用旧 P01–P33 包、schema closure 或历史通过状态。

**处置：** 后续实施先参数化新窗口事实和包集合，保留旧历史验证模式；测试应覆盖不同分母、rename/delete、缺项、重复项、端点漂移、hash 不匹配与旧窗口兼容。不要仅将常量从 517 改为 1023。随后重新生成 input/output，校验 join/hash/closure。本轮保留脚本原样，审查可继续直接回源。

`autofix_class: manual`；`owner: downstream-resolver`；`requires_verification: true`。现有验证入口为 `tests/unit/ce-upstream-reconciliation-v2.test.js`，需先审查再扩展。

## 候选吸收方向

这些是有直接阅读依据的建议，不是完成裁决或实施承诺。

| 编号 | 上游变化与证据 | 本地落点与建议 | 尚缺验证 |
| --- | --- | --- | --- |
| C01 | Review lite/focused/full，`depth-paths.md`；删除文件消费者检查，`diff-scope.md`；`237f0cda` 分段读取 staged diff；`finish-input.md` 拆分收尾上下文 | `spec-code-review` 按后果控制阅读深度、保留 coverage 与证据；优先移植有界 diff 阅读和删除后的存活消费者检查。finish leaf 只作长上下文优化候选，不默认增加多 agent | 完整 scope/mechanics 净 patch、本地 review-scope 消费者、删除测试覆盖与真实行为；上游该提交的字符串测试不能证明效果 |
| C02 | `033fa483` 对顺序依赖单元默认 inline，区分 transport commit 与 canonical commit | `spec-work/references/execution-strategy.md`；吸收顺序执行节省上下文及 Git index ownership，保留本地 dispatch/commit 独立授权 | 整窗 work 差异、dirty/index/恢复测试；不能把上游默认 parallel wave 当本轮派发授权 |
| C03 | Compound Packs：`pack-scaffold.md` 和 resolver 的接口头；配置合并、可选 Git source、缓存、规则发现 | 先评估现有 `spec-project-rules`、`spec-rule-miner`、`docs/solutions` 与 plan/review consumer，避免第二套知识权威。可先验证本地只读 pack 引用的价值 | resolver 实现、路径逃逸、远程读取授权、缓存 freshness、配置 consumer 与跨 skill 复制的一致性；当前未决定引入新目录/CLI |
| C04 | `ce-optimize` 增加真实失败 case、immutable eval/holdout、task/proposer model 分离、tick/remote/独立确认 | `spec-optimize` 已有 paired/ladder 语义（本地 measurement:100–111），先做差分，优先补评测有效性与 holdout；不要重造已有协议 | `decide.mjs` 到本地 `decide.cjs` 的具体差异；状态 schema、resume/budget、remote push 授权及反作弊回归。长期后台与 remote backend 暂不准入 |
| C05 | CLI `path.isAbsolute` 修复 Windows 输入；模型别名/sampling 参数更新；包入口调整 | 分别映射到本地 path adapter、模型配置及包合同；本地是 CommonJS CLI，不直接复制 CE Bun/TS/Jekyll 构建链 | 本地对应调用链与 Windows-native 回归；仅阅读上游 patch 不能证明本地有同一缺陷 |
| C06 | `bd8cc634` 将 PR purpose 外的真实发现留给后续 PR，保留 security/data-loss 的 needs-human 分流 | `spec-resolve-pr-feedback` 可吸收明确 scope 理由与 follow-up 清单；“reviewer 要求”仍须回到本地真实 owner 授权，不自动授权新增范围或外发回复 | 本地完整 rubric/full-mode 以及 PR scope/回复授权/恢复 fixture |

`ce-bakeoff`、`ce-noslop` 的既有产品待决状态，本轮不提升为已采纳；`ce-babysit-pr`、`ce-proof`、`ce-retune` 的既有排除边界不因上游有新提交自动解除。上述状态用于维持范围，并不代表这些包的新 patch 已逐项审查。`ce-setup` 若有适用收益，应归本地 `spec-runtime-setup` owner，不直接新增同义 public skill。

## 覆盖与未完成项

[review-coverage.json](review-coverage.json) 对 1,023 条净记录逐条标记状态。目前 19 条有明确的有界直接阅读证据，其余 1,004 条为 inventory-only；**完成全窗口逐路径裁决为 0 条**。完整 head 文件、单个提交 patch 和全窗口净 patch 分开记录，不互相冒充。完整读取 `237f0cda` 的三文件提交不等于审完其余 160 个提交。

此前批量 patch 输出存在截断，只按明确可见片段写结论。没有把 tests、fixtures、docs 或 hidden roots 整类排除：例如 `.agents/skills/ce-skill-work` 是 CE authoring source；315 条 `tests/skill-eval-cell` 变化需要判断是否包含独立需求、断言或实现语义。[package-queue.md](package-queue.md) 保存全量包入口，所有包仍需逐路径裁决。

未运行产品测试、fresh-source eval、runtime projection、doctor、外部 provider、PR/CI 或 field validation。本轮文档和冻结校验结果单独记录在 [verification.json](verification.json)。单模型源码阅读不构成独立验证。

## 后续最小落地顺序

1. 先保持 R01–R03 本地边界，完成 R04 producer 参数化设计与 focused regression；只允许事实生产者准备计数/hash，不让脚本按文件名决定采纳。
2. 按 review、work/PR、plan/知识、optimize、setup/host 的 owner 分包补齐净 patch 与提交差异审查。每条记录必须有 action、当前 source owner、consumer、测试入口与限制；未决保持未决，不填机械占位结论。
3. 对 Packs、remote optimize、新 provider/模型路线做独立产品与授权裁决；其余包不必等待这些可隔离项。
4. 将已裁决且依赖完整的包写成 implementation units；同步顺序为 canonical source、consumer/测试、必要文档、获授权的 runtime 生成。本文及原技术方案仍为 requirements-only。
5. 通过新窗口 schema/join/hash/closure 后再实施；实施验证与真实宿主/模型收益分别报告。冻结报告不能更新“最后已同步节点”，该节点仍保持 `153e605e`。

本轮可行动结论：R01 保留计划元数据合同，R02 保留外发与身份准入，R03 保留 Kiro，R04 修复新窗口 producer 的适用性。四项均为待执行建议；未修改被审源码，整窗语义审查与同步仍未完成。
