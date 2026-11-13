# spec-commit-push-pr 评审（R1）

**评审基线**：worktree 冻结于 5b59293b；已通读 `SKILL.md` 全文与 6 个 references 全文、`evals/`（eval.yaml、2 个 case、2 个 judge、prepare-eval.cjs、fixture 仓库）、`agents/openai.yaml`，以及消费者清单 4 个测试全文；交叉核对了 `spec-lfg/references/shipping-tail.md`、`spec-commit/SKILL.md`（前 80 行）、`spec-runtime-setup/SKILL.md` config 消费者清单、`skills-governance.json`、`tests/unit/ce-outcome-judge-calibration.test.js` 相关段。表中证据路径：skill 内文件省略 `skills/spec-commit-push-pr/` 前缀，其余为仓库相对路径。

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | branch-creation.md:5-10（两种失败模式驱动规则）、commit-and-push.md:71（mirror 标志 rationale）、git log 34b3224b/c66da291（S18/P-CPPR-1 从真实失败回源修订） | 约束普遍带失败模式依据且经问题→修订链演化，未发现过时或相互矛盾的去能力补丁 |
| D02 | pass | context.md:32-35（多 fork 同名分支不可取 index 0）、pr-description-writing.md:219（squashMergeAllowed≠必然 squash）、:79-84（refs/pull/N/head 回退） | 编码了大量真实 git/gh/GitHub 行为知识；脚本职责限于 git/gh 退出码与确定性探针，语义归 LLM，分工恰当 |
| D03 | pass | SKILL.md:14（授权停止点）、commit-and-push.md:58（发布门+release 对账披露）、apply-and-handoff.md:77-80（写后读回+未知先查再重试）、tests/unit/ce-outcome-judge-calibration.test.js:172-204（judge 正反例校准） | 必需验证明确、失败可见，无语义判断冒充机械判定；执行层是 prose 约定+eval judge+readiness 策略（runtime-setup-demand-policy.test.js:6-13），行为层本轮未运行 |
| D04 | fail | pr-description-writing.md:138/151/193/219（保留清单仅 Demo/引用/New concepts/贡献者）、:385（H 裁剪规则）、skills/spec-lfg/references/shipping-tail.md:16-19、skills/spec-work/references/shipping-workflow.md:101 | 上游写入 PR body 的 residual 决策记录在重写/描述更新路径无任何保留契约，可被静默丢弃（见 F1） |
| D05 | pass | SKILL.md:52-109（8 步流程）、apply-and-handoff.md:6-19（apply 路由）；重复点见 F5 | 指令清晰可定位、无矛盾；存在可收敛的多处重复（fix/feat 规则 4 处、证据分类 2 处），当前一致 |
| D06 | pass | SKILL.md:18（阻塞提问工具不可用时聊天回退）、branch-creation.md:74-91（fetch 失败显式承认+用户确认降级）、pr-description-writing.md:86-99（API-only 回退）、agents/openai.yaml（provider 投射） | 能力假设按宿主实际能力降级且诚实标注（未验证基线、API 回退、archive 跳过不阻断） |
| D07 | pass | git log 2ada13ac…c66da291（CE SHA 回源修订链）、evals/eval.yaml:14-16 + judge 校准测试（失效可检）、apply-and-handoff.md:43-45（explainer 知识带 frontmatter） | 问题→修订→复验链与回归锚（contract tests+evals）齐备，知识沉淀有失效面 |
| D08 | pass | SKILL.md:34/77/91/101（按步加载 reference）、pr-description-writing.md:3（"Loaded on demand… do not load earlier"）、:167（B2 候选上限 2 个 grep） | 按阶段渐进加载、探针有界、摘要不裁剪要求（Step A map 限 3-4 行）；仅 SKILL.md:132 尾部重读指令冗余 |
| B01 | pass | SKILL.md:4（user-invocable: false）、skills-governance.json:57-60（internal_only/dual_host）、SKILL.md:22-26（三模式+负例触发语）、using-spec-first 无该入口（grep 无命中） | 内部 helper 定位一致，入口层不暴露，相似入口（spec-commit 收尾 vs 本 skill 落地）职责互斥 |
| B02 | pass | tests/unit/pipeline-mode-contracts.test.js:13/28-36（argument-hint/config key/trailer 钉死）、SKILL.md:115-124（watch_handoff 显式 schema）、spec-work-lfg-recovery-contracts.test.js:38-56 | 入口/reference/consumer 字符串级对账有测试锚；缺口仅 config key 未入注册表（见 F2） |
| B03 | pass | SKILL.md:14-16（授权不因执行事实扩大）、compose.md:29-33（archive 授权独立）、apply-and-handoff.md:94-95（caller 内嵌材料不进 PR、不推导回复权）、context.md:50（不重复已授权意图） | commit/landing/branch/archive 四权分离，材料内嵌指令不扩权，不重复索取已有授权 |
| B04 | pass | skills/ 为唯一真相源；skills-governance.json:57-65（七宿主 internal 投射）、tests/unit/low-findings-cleanup-contracts.test.js:25-39（governance 记录与 SKILL 一致性测试）、judge 文件头注明由 scripts/evals/build-outcome-judges.cjs 生成 | 真相源清楚、投射合同可追溯且有测试；本轮 fresh-source 评审，本机 runtime mirror 新鲜度未核（非评审对象） |
| B05 | pass | branch-creation.md:59-63（碰撞保现场）、commit-and-push.md:27-34（中断/不确定提交先查再试、不重复）、apply-and-handoff.md:78-80（未知写结果先查避免重复建 PR）、tests/unit/spec-commit-push-pr-context-contracts.test.js:21-70（真实执行恢复代码块并断言快照相等） | 部分成功/未知副作用/重复执行/中断恢复覆盖极全，且恢复命令被单测实际执行验证 |
| B06 | pass | 修订链 git log（P-CPPR-1/S17/S18）、judge 校准负例（ce-outcome-judge-calibration.test.js:196-204 拒绝记录到的远端写）、commit-and-push.md:58（release_governance_status 缺口披露字段） | 交付与审查链可回源，误报/漏报有负例校准，未完成如实披露机制在（行为层本轮未运行） |
| X01 | pass | SKILL.md:52-109（分支→提交→推送→PR 渐进顺序）、commit-and-push.md:8-11（自然关注点分组+精确路径）、branch-creation.md:53-56（共享写面恢复基线） | 分解粒度、共享写面隔离与恢复顺序明确，未另造编排 |
| X02 | pass | pr-description-writing.md:37（#NN/pr:NN/URL 兼容）、:57（fork 无匹配 remote 不默认 origin）、:90（GHES 怪癖走 API）；自有接口被 pipeline-mode-contracts.test.js:13/28-36 钉死 | 外部接口方差处理充分，自有交接面变更有消费者测试约束 |
| X03 | pass | commit-and-push.md:58（pre-push 发布门）、:60（推送端点唯一性验证）、apply-and-handoff.md:77（写后读回）、SKILL.md:30/126-128（永不 merge/rebase/force-push） | 高风险外发动作有前置门、事后验证与显式越权禁止；eval judge 拒绝任何记录到的远端写 |
| X04 | pass | SKILL.md:111（needs-human 决策对象原样上交、不建决策库）、:115-128（fact-only watch_handoff）、apply-and-handoff.md:43-45/51-54（explainer 归档 frontmatter+确认发布后才链接）、context.md:27-30（变更前新鲜度复查） | 跨 workflow 交接带 source/freshness/limitations，决策保留原样，知识写入有验证与失效面 |

## Findings

**F1（P2 · D04）重写/描述更新路径可丢弃上游 residual 决策记录**
- 位置：`references/pr-description-writing.md:138`（仅保留 Demo/Screenshots）、`:151`（仅保留 related references）、`:193`（仅保留 New concepts）、`:219`（仅保留贡献者署名）、`:379-385`（Step H 裁剪规则可删任何非保留段落）
- 后果：spec-lfg 在 shipping-tail.md:16-19 将 `## Residual Review Findings` 直接写入 PR body 后才调用本 skill（shipping-tail.md:38）；spec-work（shipping-workflow.md:101）与 spec-debug（SKILL.md:293）都把 PR 描述的 Known Residuals 当作已接受风险的 durable sink（"findings must not live only in the transient session"）。pipeline 模式默认不重写（SKILL.md:28）保护了 lfg 主路径，但交互式重写被接受时（SKILL.md:71-73、apply-and-handoff.md:23-26）和 description-update 模式下，重組 body 无任何槽位保留该节，Step H 还可能主动裁掉它——评审者此后无法勾选这些决策项，durable 记录从选定的 sink 消失。
- 最小修复：在 Step B/B2/G 的保留清单中加入「governed caller 写入的 residual/known-residuals 节（按标题匹配）原样保留」，并在 Step H 裁剪规则中显式豁免；或在 apply 前对既有 body 的该类节做显式对账说明。

**F2（P3 · D04/B02）`pr_teaching_section`/`pr_teaching_archive` 未注册进本地 config 面**
- 位置：`references/compose.md:20-27`（读取 `<repo-root>/.spec-first/config.local.yaml` 的 active-key 语义）vs `skills/spec-runtime-setup/SKILL.md:126-135`（"Current active local config consumers" 清单无此二 key）、`.spec-first/config.local.example.yaml`（全文件无此二 key）
- 后果：config 面的 owner（runtime-setup）与真实 reader 脱节：用户无法从示例文件发现该开关，runtime-setup 的本地配置诊断不覆盖它，两处 active-key 语义可能漂移（runtime-setup 自己规定"没有真实 reader 的 key 不进入 config surface"，反向义务未履行）。
- 最小修复：在 runtime-setup 消费者清单与 example config（注释态）登记这两个 key，注明 reader 为 compose.md。

**F3（P3 · D03/D07）核心落地边界（commit 已授权、push 必须停）无 eval 场景**
- 位置：`evals/cases/no-landing-auth-stops-before-push.yaml:8`（prompt 自身即禁止 stage/commit/push）、`evals/fixtures/scripts/check-landing-gate.sh` 与 `check-desc-only.sh` 字节相同（diff 验证 IDENTICAL）
- 后果：两个已提交 case 的终态期望都是零变更，无法区分「skill 因自身 landing 门停住」与「模型服从 prompt 里的显式禁令」；commit 授权成立时本地提交应发生而推送不得发生的判别性场景（judge 应期望 HEAD 变化+零远端写）缺失，该门若回归为过早停止（不提交）现有 judge 检不出。
- 最小修复：补一个 commit_authorization: authorized + landing_authorization: missing 且 caller 不附加禁令的 case，judge 期望「新增 owned commit + transcript 无远端写」。

**F4（P3 · D02）可移植 skill 内嵌本仓专属示例**
- 位置：`references/commit-and-push.md:58`（"(in this repo, `npm run test:release:governance`)"）
- 后果：该 skill 经 `spec-first init` 投射到任意用户仓库；外仓运行时 "in this repo" 易被读成目标仓，模型可能尝试不存在的 npm script 或误报缺口（低概率低危害，主规则"从项目 active instructions 解析"仍在）。
- 最小修复：改写为"例如 spec-first 仓库自身的 …"或仅保留从项目指令解析的通用规则。

**F5（P3 · D05）多处可收敛的重复**
- 位置：fix/feat 倾向 4 处（SKILL.md:64-65、context.md:64-67、commit-and-push.md:48-51、pr-description-writing.md:331）；证据分类规则 2 处（compose.md:7-12 vs pr-description-writing.md:128-141）；compose.md:7 同句连写两遍（"Classify evidence by runtime purpose. Classify by runtime purpose, not extension:"）；SKILL.md:132 尾部重读指令与 SKILL.md:34 重复且悬挂在 Step 8 之后
- 后果：同步维护成本（当前各处一致，未产生矛盾）。
- 最小修复：为 fix/feat 与证据分类各指定单一规范出处，其余位置改为引用；删 compose.md:7 重复半句；将 SKILL.md:132 并入 Step 6 前置条件。

**F6（P3 · D03）门的强制层级未在 skill 内显式声明**
- 位置：SKILL.md:14（授权门）、commit-and-push.md:58（发布门）——均为 prose 约定，无"未 runtime 强制"的声明；无伪造已强制表述（未冒充机械判定）
- 后果：CLAUDE.md 要求缺强制能力时显式声明未强制及原因；当前依赖仓库层文档承载该声明，skill 自身读者可能高估门的强制性。
- 最小修复：在 SKILL.md 授权边界节加一句"以上门为响亮约定，由 evals 与 readiness 策略约束，非 runtime 强制"。

## 主责深挖面发现（D01-D05 + D08）

- **D01**：逐条约束均能回答"解决什么真实失败"：mirror 标志（commit-and-push.md:71，S18 修订回源）、`--no-overwrite-ignore`（branch-creation.md:59-63，被单测真实执行）、不传 `<owner>:<branch>` 给 `gh pr list`（context.md:20-22，防静默空结果）、B2 按 base ref 而非工作树 grep（pr-description-writing.md:159-167，防自我污染误判）。最接近"能力补丁"的是写作微规则（禁 em dash、禁 filler 词，pr-description-writing.md:254-259），但它们可审计、不与任何规则冲突，属可接受的项目风格校准，不建议删除。
- **D02**：领域知识密度高且可回源（多 fork 匹配、FETCH_HEAD 立即捕获、squash trailer 落位、`refs/pull/N/head` 回退、unborn 仓库判定 context.md:57-60）。职责分工上本 skill 不自建脚本包装，坚持逐 argv 调用直读退出码（context.md:4-6），事实归工具输出、判断归模型，边界干净。唯一瑕疵为 F4。
- **D03**：门清单=授权门（SKILL.md:14）→ 发布门+release 对账（commit-and-push.md:58）→ apply 前重解析+写后读回（apply-and-handoff.md:12-15/77-80）→ 归档门（apply-and-handoff.md:30-38，含 `git check-ignore` 逐路径探测）。执行层分级清晰：readiness 确定性阻断（gh 对本 workflow 为 baseline_blocking，runtime-setup-demand-policy.test.js:6-13）、eval judge 测试期强制、其余为响亮约定；正反例存在于 judge 校准测试。行为层通过与否本轮未运行，不据此降格（F3 是覆盖缺口而非承诺缺失）。
- **D04**：正向交接链完整且被测试钉死（lfg 授权四元组 shipping-tail.md:44-49 → SKILL.md:14 消费；trailer SKILL.md:130 → shipping-tail.md:53/78 消费；watch_handoff SKILL.md:115-124 → shipping-tail.md:55-59 消费；needs-human SKILL.md:111 → shipping-tail.md:63 消费）。断点即 F1：PR body 既是上游选定的 residual durable sink，本 skill 的重写契约却对它没有保留义务；另有 F2 的 config 注册缺口。
- **D05**：约 740 行指令未发现语义矛盾；模式间边界（description-only 跳过 Step 1 决策树的理由 SKILL.md:24、pipeline 保守默认 SKILL.md:28 与 apply-and-handoff.md:16-19 对齐）自洽。可审计性由 contract tests 钉字符串支撑。重复清单见 F5。
- **D08**：三种模式的实际读取集计算如下——description-only：context 探针+writing+compose（无需 commit/apply refs）；full：全部 6 refs 按 Step 门控加载；B2 概念判断上界 2 次 grep、Step A 工作笔记限 3-4 行、Step D 定尺寸、Step H 压缩，整体按需加载设计成熟。唯一反向浪费点是 SKILL.md:132 可能诱发对 context.md 的二次全文读取。

## 未读文件

| 路径 | 理由 | 未覆盖后果 |
|---|---|---|
| skills/spec-lfg/references/pr-watch-loop.md | watch 契约属消费者侧，本次只核对 handoff 事实链（shipping-tail.md 已全读） | watch_handoff 字段级消费方式未核；现有测试只查 'watch_handoff' 字符串（spec-work-lfg-recovery-contracts.test.js:39），字段漂移可能漏检 |
| skills/spec-work/references/shipping-workflow.md（仅 grep 命中行 101） | 只需验证 Known Residuals 交接句 | spec-work Phase 4 调用本 skill 的完整输入面未逐行核对 |
| skills/spec-commit/SKILL.md 第 80 行之后 | 共享 commit-and-push.md 的职责边界已核 | 其 U-ID/分组规则与 commit-and-push.md:53-54 `(U3)` 规则的一致性未完全核对 |
| scripts/evals/build-outcome-judges.cjs | judge 为生成物，按当前字节评审已足 | 两个 judge 字节相同是否为构建器预期设计未验证（F3 相关） |
| templates/ 与各宿主 runtime mirror | fresh-source 冻结评审，B04 依 governance 合同+测试判定 | 本机当前投射新鲜度/漂移未核（非本轮评审对象） |

## 结论一句话

结构与授权、失败恢复纪律成熟（17/18 项 pass），唯一成立的关键缺口在 D04：上游写入 PR body 的 residual 决策记录在重写/描述更新路径无保留契约（F1，P2），另有 config key 注册缺口、落地边界 eval 场景缺口等 5 项 P3 局部问题。
