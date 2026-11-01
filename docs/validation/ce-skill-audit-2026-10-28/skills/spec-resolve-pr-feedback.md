# spec-resolve-pr-feedback：全量源码对照

状态：`source_review_complete`。双方 35 个包内文件、2804 行完整阅读；已读同 hash 的 mini-ledger 和问句 helper 复用既有全文记录。直接核对 LFG review-followup/pr-watch-loop 及两份 resolver 测试。未对 GitHub 执行任何读写。

## 研发意图和融合裁定

双方以中央上下文判断全部反馈，再只实施成立的问题；不是把 reviewer 的文本直接当指令。适用场景是 PR 已有反馈，区别于新代码审查。本地保留五类独立授权、真实 delta 对账、blocked 部分修改和验证责任，这是 CE 新能力集成时必须守住的底线。

| 能力 | 双方源码依据 | 裁定和最小优化 |
| --- | --- | --- |
| 跨反馈归因、按需深入 | 双方 rubric/full-mode：集中判定、按文件去重读取、核意图、同 invariant 窄化修复；本地已保留每来源结果 | 已融合。保留“共享实施不合并反馈身份”，不新增每 thread 独立判断 agent |
| 指令文本修复 | CE rubric 禁逐例追加，并要求第二轮重述目标/完成/安全方向；本地 rubric/agent 已迁入、同时保护必需约束 | 已融合。CE “never rationale”过强，不应删除不显然 WHY；结果 eval 应验证规则仍覆盖原路径 |
| 越界与不可逆 | CE 允许 human reviewer 扩范围；本地仅当前用户/有权 caller 授权扩大。安全、丢失数据、不可逆影响不以 out-of-scope 丢弃 | 保留本地，不以 reviewer 身份或工具权限扩权 |
| 实施路径成本 | CE full-mode/targeted 优先 inline 单项，真正独立批次才委派；本地已明确相同选择 | 已融合。无 worker 仅损失并行/隔离条件，不能虚构独立覆盖；不把 inline 自动当 correctness 下降 |
| 部分失败和 dirty | CE fixer 仍 `empty for blocked`，并把 unchanged 文件中的测试失败当 pre-existing；本地保留实际 delta、同命令 baseline 因果、全 index 所有权检查 | 保留本地增强；不能回灌 CE 的失败豁免或混合内容 stage |
| 可恢复发布尾部 | CE return-to-caller/resume + 287 行 pending-feedback.py：独占私有文件、固定原始 bytes、PR/base/head repo/ref、source body hash、精确 reply、逐动作进度、实际 fix SHA reachability | 高价值建议集成其意图。适配本地 `mode:pipeline-return`，caller 保有 commit/push；不要让 resolver 默认 commit、no-change 时自动 remote write |
| 新鲜证据与幂等 | 本地 full-mode 已要求 current related discussion/code、解码正文、既有 reply 归属、fix SHA 对实际 fork head；CE helper 将身份及发布比对机械化 | 已有语义义务，可抽最小 deterministic record/validator 实验；GitHub 当前状态决定缺哪一半动作，record 不可冒充远端事实 |
| caller 闭环 | 本地 pipeline-return JSON 只列 finding/verdict/files/verification/residual，不保存 intended reply/root id/source hash；LFG review-followup 和 watch-loop 只接本地修复→验证→commit/push→fresh snapshot | **尚未完整融合**。当前不能保证 caller 发布后能完成反馈 conversation，可能反复处理 unresolved 源。补 caller-owned pending action handoff 和明确 completion consumer；不能只向 return JSON 加字段而无人消费 |
| root 收敛 | CE pipeline 每根因返回 invariant_key、第三轮先裁定；本地 legacy pipeline 只有趋势/共享根判断，普通 full 两轮上限且从 source/history 核对 | 可吸收稳定 root 身份、区别失败迁移与振荡。先复用 caller 的 source/decision 记录，不新建第二套计数状态机；未来 POV 裁定仍不能改变权限 |
| 工程争议裁决 | CE rubric 自动 ce-pov+oracle 并署名 peer；本地保留自主 source 判断及未知 intent/authority needs-human | 可选实验本地证据充分的工程争议，不自动外发代码、不以模型投票覆盖 owner；成本和收益均待验证 |
| checklist | CE 只 tick 既有 Unapplied 段且等待 publication；本地 legacy pipeline 使用 Residual Review Findings，LFG 还有 durable handoff | 先核既有 section consumer，再窄化逐 bullet publication 证明；不要照抄标题导致双列表，或把需要新授权的 PR body 写入暗中合并 |
| forge/分页/安全输入 | 双方含 GHE、fork、三类反馈、REST root 回复、pending review；本地额外嵌套分页 warning、600 权限、stdin 原样正文和 unknown-outcome reconcile | 保留本地。截断不能证明不存在，POST 成功不等可见/提交，更不等 resolved |

## 源码问题和证据上限

`skills/spec-resolve-pr-feedback/references/full-mode.md:290` 的 non-thread 示例为 `gh pr comment PR_NUMBER --body-file "$reply_file"`，没有 `-R OWNER/REPO`。CE 同一段显式带 base repo；在 checkout 为 fork、用户选 upstream PR 的场景，该示例会按 checkout 定位。上文“保留所选 repository”提供语义约束，但复制该命令不能落实它。建议把精确 base repository 传入所有 PR 操作（包括初始/末次 get-pr-comments 示例）。这是源码级候选，没有真实 fork/GHE 复现或独立 validator，不能夸大为已发生的错发。

`pipeline-return.md:28-56` 与 LFG 两 consumer 的缺口是接口设计事实；尚未跑完整模型 watch，不能声称已复现无限循环。最小验收应模拟：本地 fixed → caller commit/push → crash → 恢复仅补可见 reply/resolution，且不重复 fix/POST；source root 未改但后续讨论改变时保持 pending。

CE pending-feedback helper 能做形态、identity 和 SHA reachability；不能判断实际语义是否仍适用，也不检查 source body hash 与远端当前内容，这层在 resume prose。其 checkpoint 只保护 prepared_content 不变，不提供多 writer CAS；不能把它直接当完全并发安全 journal。保存 `pre-existing-failure` 不应绕过本地 required check 仍红的规则。

## 评测核对

包内 3 个 case 全读：readonly judge 仅保留 README marker、扫描部分可疑源码词；authorized-fix 仅断言 README 改字，无 commit/外写断言；injection judge 只查源文件没有 evil 加输出关键词。都不能证明 shell 未执行、零外部通信、全仓只读或每授权独立。应以隔离命令 recorder 和实际工作区 delta 验证，先不新增真实远端副作用。

全文审读 `tests/unit/spec-resolve-pr-feedback-contracts.test.js`（205 行）和 `spec-pr-feedback-reply.test.js`（134 行）。后者 fake gh 覆盖 REST endpoint、原样多行、postflight pending、POST/读取失败、分页与身份；前者主要静态 prose 合同。已有 consumer-tests 中的相同合同结果可复用，reply helper 当前专项测试结果另存；无真实 GitHub、模型、独立或现场效果证明。

优先级：先把 caller completion 接通，再补精确 repo 示例与结果 eval，最后才实验多模型裁定。所有内容为审查与建议，本轮未修改产品或 runtime。
