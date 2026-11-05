# 修复台账（优化阶段）

审查证据指向主仓 source；修复均发生在主仓工作区（非冻结 worktree）。每条记录发现来源→修复内容→验证。冻结基线 5b59293b；修复后文件与冻结 SHA 的偏离属预期（优化阶段产物）。

## 批次1（主链路 6 Skill）——静态层收敛 + P2 全清

| FIX | 内容 | 来源 | commit |
|---|---|---|---|
| 001 | spec-plan description `runtime-maintenance` 裸引用 → 路由标签 + `spec-first init` 落点 | S1 R1 dissent B01 + L1 | e847db2b |
| 002 | Interaction Rule 5(a) 悬空/错精度 ×6（spec-plan 3 → Interaction Method 实节；spec-brainstorm 3 → Rule 5） | L1 D05 + 修复时扩查 | e847db2b |
| 003 | spec-prd D05 复述密度：SKILL.md:198 四元组复述撤除、:275 五句语义复写压缩为指针 | 批次1 多数 fail（脚本核实 relentless ×24/6 文件） | 392b3e97 |
| 004 | spec-prd P3×2：profile 枚举选取锚点（KTD6 意图）+ can_enter_spec-plan 连字符 ×9 归一 | R1 #1/#2 | c7af5fc6 |
| 005 | spec-write-tasks 假护栏复活：parity 测试按 git 历史原样恢复（e9fe0769 删除未迁移）+ P3×2（Input Paths 双词汇、envelope 补字段） | 批次1 X02 R1 fail（git 考古） | 50505eb2 |
| 006 | spec-work P1：run.json 状态初始化断链——append-only 契约圈定为 durable run.json 存在后 | R2-v2 六 fail 共因（主会话代码+prose+git 三重核实） | 2e6be876 |
| 007 | commit-push-pr：DU-3 悬空 ×2 → Description Update workflow、归档 Step 7 指路改 apply-and-handoff、:132 残留句删除 | R2 F2/R3 | 2e6be876 |
| 008 | spec-work P3×9：trivial 路由矛盾、shipping Step6 无 PR 出口、simplify 双口径、重复段、enforcement 措辞、judge 校准链注记、fingerprint 隐式前置、tracker 接缝句、receipt 重估条件 | R1 F1-F5 + R3 #1/#2/#3/#5 | c8a0dd1c |
| 009 | compound-refresh 模板 argument-hint 撤除已弃用 mode:autofix 宣传 | 批次2 R1 B02 fail（确定性核实） | c8a0dd1c |
| 010 | commit-push-pr 重写保留清单补 Known Residuals / Post-Deploy Monitoring 段（跨 skill 合同缝） | R1 F1 | 66d85053 |

## 批次2（收敛后追加）

| FIX | 内容 | 来源 | commit |
|---|---|---|---|
| 011 | spec-runtime-setup D05：provider-readiness 字段合同提取为 `references/provider-readiness.md`（指明 repo canonical docs/contracts/provider-readiness.md），SKILL.md:54 压缩为决策规则+指针（2106→1209 字符） | 批次2 D05 多数 fail（R2+R3，可定位密度） | 本批 |
| 012 | Python 运行时护栏全仓统一 `>= (3, 10)`：12 脚本 ×2 处（payload 用 `int \| None`/`list[str]` 运行时求值无 future-import，真下限 3.10；原护栏只验 major==3 会过检后崩）+ 契约测试断言锁定 | spec-compound R2-v2 B05 fail（确定性核实） | 本批 |
| 013 | 批次2 P3 ×4：project-rules eval README engine 口径（codex→claude_code）；extract-deps exit-2 路径 verify 不适用披露；doc-review modes.md:25 示例弃用别名 mode:headless→non-interactive；runtime-setup :153 历史日期撤出合同叙述 | R1/R2/R3 各 findings | 本批 |
| 014 | spec-debug SKILL.md:92 跨仓 issue 抓取补 `--repo <org/repo>` 指引（原指令 bare number 解析当前仓，`org/repo#123` 会抓错仓） | spec-debug R2-v3 B02 sub-claim（确定性核实） | 本批 |

## 批次3（K=2 分歧裁决后追加）

| FIX | 内容 | 来源 | commit |
|---|---|---|---|
| 015 | spec-write-skill validator：skill root 含 symlink 段时 inventory 停摆（原仅 push error 仍读穿）+ SKILL.md 检查短路（独立 rootSymlinkHalted 标志，不误伤 budget 停摆）| R2 D03/B03 + L1 确认（代码核实） | 本批 |
| 016 | spec-write-skill GENERATED_RUNTIME_PREFIXES + project-profiles.md 补 `.opencode/`（src/cli/adapters/opencode.js:49 实存的 runtime 面，排除表遗漏） | R2 B04（代码核实） | 本批 |
| 017 | spec-polish 三修：resolve-port.sh puma/Procfile 探针交换（对齐 dev-server-rails.md 级联与 foreman 运行时语义）；detect-project-type.sh 多匹配分支 astro 前置优先（兑现 dev-server-astro.md:57 声称）；run.md 补首编前 dirty-overlap 拦截 | R1+R2 双 D05（独立证据均证实）+ R2 B05 | 本批 |
| 018 | spec-brainstorm phase-0.md 入口补 debug carve-out（修复意图请求入口分流 spec-debug；软件信号中的 debug 仅覆盖方案探索）——消除与 description 排除 debugging 的入口矛盾 | R2 B01（对读核实） | 本批 |
| 019 | spec-ideate issue-intelligence-analyst.md:90 聚簇启发式措辞软化（0 开放 issue = likely solved for theme-formation，携带 :76 认知谨慎） | R2 D02（对读核实） | 本批 |
| 020 | spec-optimize SKILL.md:107 校准模式双口径消歧（invocation token `mode:measurement-only` vs spec 字段 `calibration.mode`） | R2 B02（schema 核实） | 本批 |
| 021 | spec-app-consistency-audit SKILL.md:294 ecc-source-lock 消费者修正（merge-contracts.js 全文 0 处 ecc；实际消费者仅 prompts/orchestrator.md） | R1 B02 F1（grep 核实） | 本批 |
| 022 | spec-write-skill preview 写集 seam：would_change 增 supporting:true 授权支撑路径（root 边界/snapshot/write-set/dirty-overlap/receipt 全保留，仅豁免 canonical containment）+ prose 合同 + 3 测试 | L1 仲裁采纳（D04/B02/X02） | 41d14648 |

## 留观（不修，判「保持现状成立」或降级）

- spec-prd：checkpoint-as-escape 双 register（:208 规则 vs :219 恢复表）——不同服务面；references 中 agent prompt 载荷的 relentless——payload 非合同复述；R1 #5（disposition 列位文档化）、#6（legacy origin 口径）低频 P3 待后续
- spec-work：R3 #5 的脚本级 check-ignore 前置（prose 口径已落）；B05 tracker-defer 重试区分 sub-claim 未复核
- commit-push-pr：R1 F5 fix/feat 4 处重复（当前一致）、R2 D03 强制器披露口径、eval 覆盖类（R2 F3/R3 B05）→ S3 补测清单
- ~~spec-debug：R3 B05（workflow 中断恢复机制缺失）待 R2 备份重跑收敛后裁决~~ → 已裁决（收敛报告）：运行级隔离完备，workflow 级 resume 为设计取舍，证据链即状态；claim_limitations 枚举 + 回归资产漂移 → S3
- spec-runtime-setup：R1 F1/F2（入口命名句、bare 语义复述，当前一致）+ F3（supported-mcp-tools.md 未挂接入口读路径）+ F4（codegraph 双表面登记口径）+ :165-171 长段密度——留观待后续批次
- spec-project-rules：R3-F2 subagent 并行写面冲突纪律（被未声明支持兜住）；R1#3 措辞 vs 采样（payload 已披露）；R3-F3/F4 已披露局限（staged 盲区、untracked churn）
- spec-doc-review：R1 F1/F2（dispatch tier 重复、SKILL:74 冗余）、R3 #1（JSON finding 粒度）、#2（peer-job-runner 100KB，parity 锁定现状可辩护）
- spec-compound：R2 B03 dissent 不成立（gh 同租户检索）；B06/D07 eval 资产 → S3
- spec-debug：B05 workflow 级中断恢复（设计取舍）；R2 D07 conversation-checks 过限 → S3

## 验证记录

- 每批修复后窄验证：spec-prd 14 套 179/179、write-tasks 44/44、compound 系 105/105、spec-work/commit-push-pr 65/65、lint:skill-entrypoints 518 文件全绿
- runtime mirror 再生（spec-first init）留待全部优化完成后统一执行

## 批次4/5 + audit/autoresearch 收敛波（L1 仲裁后追加）

| FIX | 内容 | 来源 | commit |
|---|---|---|---|
| 023 | spec-explain destinations.md Phase 编号 ×2 归一（6→4） | L1 D05 | db177fec |
| 024 | spec-pov external-evidence-researcher 外发最小化边界（公开主题词 only） | L1 | db177fec |
| 025 | spec-rule-miner 规则块适用与失效边界段合同（SKILL 步骤5 + write-targets 块组成） | L1 | db177fec |
| 026 | spec-promote check-spiral-auth 认证信号冲突检测（unverified/spiral-auth-signals-conflicting + 2 负例） | L1 | db177fec |
| 027 | spec-strategy 数量例外 ×3 + 定向更新语义 + eval 顺序许可 | L1 | db177fec |
| 028 | spec-handoff degraded judge 正负语义（诚实降级必在/编造完成态必拒） | L1 | db177fec |
| 029 | using-spec-first 输出枚举登记两个特殊结果（footprint 5790≤5800 压缩） | L1/B02 | db177fec |
| 030 | spec-resolve-pr-feedback 缺授权出口跳过受阻项 + 勾选例外删除 + Validation 披露改口径 | L1 | db177fec |
| 031 | spec-simplify-code diff 并集 + Bounded dispatch/worker 写边界 + 重试有界化 | L1 | db177fec |
| 032 | spec-product-pulse 时长四值合同 + 同分钟唯一后缀 + 状态规范化 permission-denied | L1 | db177fec |
| 033 | spec-prototype webserver 三态生命周期 + 默认页一级子目录发现 | L1 | db177fec |
| 034 | spec-riffrec analyzer safe_write_text 写隔离 + source_sha256/analysis_batch_id + Python>=3.10 披露（spec-sweep byte-identical 投射同步） | L1 + X02 预修 FIX-012 | fdd433df |
| 035 | spec-test-browser 恢复载荷透传 + pending-receipt.json 预落盘（ETIMEDOUT 可定位） | L1 ×3 | fdd433df |
| 036 | autoresearch 编排器路由信号严格类型化 + 单遍边界/互斥旗标/run 独占 + 手稿交接规范化 | L1 | b8f7383f |
| 037 | spec-app-consistency-audit L1 九项（冲突降级/opt-in/stub 标记/写边界逃逸检测/参数透传/report 全域 coverage/Figma 统一） | L1 ×9 | b8f7383f |
| 038 | spec-commit 共享 reference 双缺口：D04 消费范围限定（豁免 branch-creation 流程冲突）+ B04 安装态路径解析措辞 | R1 fail×R2 nv，确定性证实 | caa21272 |
| 039 | spec-runtime-setup eval judge 基建 ×2（全角括号 set -u unbound / dirname 跨脚本引用不可达→内联） | S3 复核发现 | caa21272 |
| 040 | spec-debug diagnose-then-choice-gate：prompt 补 prepare 指令 + constraints（judge 依赖 baseline receipt） | S3 D 类归因 A | 本波 |
| 041 | ce-u28 builder 自然语言精确串匹配 ×2 放宽为 token 匹配（handoff review issue / research remaining_fact） | S3 D 类归因 A | 本波 |
| 042 | spec-handoff ordinary-continuation prompt 补只读边界（fixture 只读，续作输出即回复） | S3 D 类归因 A | 本波 |
| 043 | ce-u28 attempt 判定收敛到调用意图（工具名+执行类命令文本；不再扫 Read 路径）| S3 verify 重跑 | 本波 |
| 044 | knowledge-publication visit + compound checkTree 补跳根 `.claude`（引擎 skill 挂载面） | S3 verify 重跑 | 本波 |
| 045 | fixture-state parseFinalMessage 整串失败回退 last-fenced block（prose+fence 输出） | S3 verify 重跑 | 本波 |
| 046 | compound source_refs 白名单补 README.md（synthetic-fixture 裁决依据） | S3 verify 重跑 | 本波 |
| 047 | runtime-setup check-not-setup-scope Bash 全禁→只读命令白名单解析器（15 边界单测） | S3 D 类归因 A | 本波 |
| 048 | runtime-setup bare-invocation 超时 600→1200s 提档 | S3 verify 重跑 | 本波 |
| 049 | ce-u28 pulse 枚举期望 'ok'→'confirmed-value'（对齐 SKILL.md:71 词表）+ 校准样本同步 | S3 D 类归因 A | 本波 |
| 050 | spec-riffrec analyzer.md 补机器可读输出合同（confirmed_requirements/coverage/source_manifest_visibility 标量枚举） | S3 D 类归因 A | 本波 |
| 051 | spec-work prose ×3：lifecycle 授权边界（SKILL.md）/ CLI producer 点名+禁手写（return-to-caller.md:44）/ 逐字命令规则（shipping-workflow.md:157） | S3 D 类归因 B | 本波 |
| 052 | spec-promote channel 机器 id 合同 + compound-refresh status 三值机器 token 合同（modes.md） | S3 verify3 | 本波 |
| 053 | spec-doc-review modes.md 失败串「整条 final message」边界澄清 | S3 D 类归因 B | 本波 |
| 054 | fixture-state.cjs internalArgs 组合尾巴隐形修复：topLevelSegments 引号感知顶层分段（`;`/`&&`/`||`），仅首段匹配调用身份，段内仍禁管道/重定向（`2>&1` 豁免）——`; echo "exit=$?"` 尾巴不再使成功 producer 调用隐形 | S3 bverify A16 | 本波 |
| 055 | fixture-state.cjs outputObject 增 firstJsonObject 平衡 JSON 对象提取——producer stdout 混入 `exit=0` 尾巴行时仍可提取 run_summary_ref/overall | S3 bverify A16 | 本波 |
| 056 | fixture-state.cjs checkCloseout claims 覆盖改并集（每条 check 至少被一条 passed validation claim 引用）——对齐 honest-closeout CLI 合同（子集合法、防 cherry-pick 由 aggregate 聚合门承担） | S3 bverify A17 | 本波 |
| 057 | spec-doc-review modes.md:21 verbatim 条款补「never markdown-escaped」（`<path>` 不得写 `\<path\>`）+ rtc-envelope case 超时 600→1200 | S3 bverify | 本波 |
| 058 | plan/always-plan judge 词汇代理升级：output_contains「规划」→ check-always-plan-only.sh fixture 行为断言（src/测试零改动、docs 合法）+ prompt 补 prepare 指令 + constraints | S3 eval-iteration A18 | 本波 |
| 059 | spec-debug SKILL.md:108 prior-attempt 合同对齐 judge：报告 prior attempts 而内容未知时先问再查、终报必带未答问题（原「ask before repeating」字面允许先自行调查） | S3 eval-iteration A19 | 本波 |
| 060 | fixture-state.cjs fence 提取器行锚定配对 fencedBlocks（```yaml 等非 json 信息串的闭栏不再被误当开栏吞掉 ```json 块）；parseFinalMessage 取最后可解析块、finalObject 取首个可解析对象 | S3 eval-iteration A20 | 本波 |
| 061 | ce-u28 pulse artifact_path 归一化（A21）：引擎临时根下模型上报绝对路径属正常形态，judge 剥前缀比对；原始串含 .. 一律拒绝；两侧 realpathSync 对称解析后 containment 按真实路径判定（macOS /var→/private/var symlink 场景实测）+ 校准样本改绝对路径锚定 | 二审 live 重跑暴露（REPLAY 未覆盖新响应形态） | 本波 |
| 062 | codex 对抗性二审三项收紧：internalArgs 组合尾巴白名单（仅 `; echo <变量捕获>` 形态放行，`\|\|`/`&&` 后缀与字面输出尾巴全拒——堵 `producer \|\| printf fake` 伪造向量）；finalObject 反向遍历取最后对象（与 parseFinalMessage 末块口径统一，堵草稿块误取）；A21 realpath 加固并入 061 | codex 二审 P1×2+P2（evidence/probes/codex-second-review-judge-fixes.txt） | 本波 |
| 063 | 二审静态复评（定向 diff 复评 5 skill × 各自 FIX 面，ai-qianxing2/gpt-6.1-sol 独立评审，产物 second-review-static/）修复 ×4：spec-debug SKILL.md:108 prior-attempt 段结构化（786 字符连续散文拆保序列表，A19 语义逐字保留）；spec-doc-review modes.md:21 失败串独占表述精确化（headless-missing-path/missing-document 独占整条；flag-conflict=前缀+token 名，消除与「附 token 名」的字面互斥）；spec-work return-to-caller.md:44 hand-author 范围精确化（禁手写 run-summary 产物与 verdict；组装 producer input 是规定动作——原字面误禁 claims input 组装）；spec-write-skill authoring-workbench.md:35 supporting 段结构化（2736 字符拆列表）。复评 7 项中 3 项裁决不成立（shipping 密度非修复新引入 ×1、复评 prompt 归因错误 ×2） | 二审第 5 项（ai-qianxing2 复评发现，逐项确定性核实后采纳 4） | 本波 |
| 064 | B-open 消化第一波（4/4 全违约三例深挖，A22–A25）：**A22** fixture-state checkCloseout null-ref 前置守卫（record 未完成时 envelope 诚实留 null，assert.match(null) TypeError→可读断言，方向不变）；**A23** shipping-workflow.md:157 补 500 字符 command 上限合同（schema 实锚 verification-run-summary.schema.json:47；长验证命令物化为脚本文件记录短调用、被拒后以更短等价真实验证命令重跑而非保留失败收尾）+ :188 envelope 字段形态（honest_closeout_verdict 为 token 字符串非 validator 原始对象、ref null 须 limitations 记录——token 枚举原只在 R2C reference 承载）；**A24** pipeline-return.md Return Contract 补 status 三值语义（complete/partial/blocked 适用条件；caller 侧授权缺失≠blocked，记 pending_conversation_actions 返回 complete/partial）+ builder limitations 断言 Array.includes 精确元素→some 子串匹配（prose 数组无 token 词表，A11/A12 先例）；**A25** check-bare-mutation.sh 重写：claude_code 引擎会话级 EVAL_EXIT_CODE 恒为 0（工具退出码不透传，实测锚定），EVAL_EXIT_CODE==2 结构性不可满足——blocked 语义改三层承载（transcript 中 bare 调用真实被 host-invocation-surface-unverified 阻断 + 最终汇报 token + 零副作用含 .claude/spec-first surface 伪造检测）。四模型异构归因：closeout-order（zhipu 逐字违约真 B + kiro 未调 producer 真 B + hst-2 塞对象藏 A + aiq 撞 500 上限藏 A）、pipeline-pending（kiro/hst-2 自创 envelope 真 B + aiq blocked 藏 A + zhipu limitations 子串藏 A）、bare-invocation（judge 结构缺陷 + kiro 把阻断当障碍绕过〔复制 surface+init〕真 B） | B-open 消化（矩阵归因分层后复查合同表述） | 本波 |
| 065 | B-open 消化第二波（A26）：**pulse/unconfigured** —— disable-model-invocation 拒绝变体跨模型证实（zhipu/hst-2/aiq 读 frontmatter flag 拒绝执行、kiro 遵循；其余 8 个同 flag skill 无此现象，pulse 的 argument-hint+短 description 更像纯用户命令为文本性诱因）→ spec-product-pulse SKILL.md 开头补 flag 语义澄清一句（仅阻止模型自主触发；用户消息显式指名时读源执行）→ zhipu live PASS（Phase 1 访谈+编号选项回退）；**compound/false-causal** —— kiro/aiq 将被裁决对象 candidate.md 列入 source_refs 被白名单拒 → build-outcome-judges 白名单补 candidate.md（与 README.md「直接支撑裁决」同理；核心证据三文件强制项防偷懒， widening 不可博弈）→ zhipu live PASS（引用纯证据四文件） | B-open 消化第二波（3/4 与 1/4 违约层逐例深挖） | 本波 |
| 066 | 合同表述复查波（用户指令，对 FIX-064 自查+独立评审双路复查）：确定性自查 2 项 + aiq 评审 Q1–Q5（evidence/input-packs/contract-wording-recheck-wave1.txt → probes/aiq-contract-wording-recheck-wave1.txt）。**采纳 5**——① pipeline-return.md status 语义段重写：删与 :20-22 矛盾的 pending-review blocked 例证；pending_review 非 null 本身不定 status；blocked=无法继续 vs partial=未完成但可推进/待 caller 决策、residuals 非空不单独决定两者；缺 caller 侧权限本身≠blocked 记 pending_conversation_actions（typed residual 收窄为 per-decision，对齐 evaluation-rubric.md:100-126）；真阻断本地工作时 blocked 并具名。② shipping-workflow.md:157 补重试降级出口（重试仍被拒/需新授权/工具不可用→null ref + claim_limitations 显式记录，record 失败≠验证失败/通过）。③ :188 honest_closeout_verdict 补 null 出口（validate 无有效结果时 null+limitations，不猜 token；overall_reason_code=validate 机器字段原值）。④ return-to-caller.md:46 null escape 同步对齐。⑤ check-bare-mutation.sh 轻加固：bare 过滤补 c.cmd.includes('node')（堵 printf 冒充）、blocked 判定 token+/blocked/i 双匹配、`find\|grep -q`→`[[ -n "$(find …)" ]]`（pipefail SIGPIPE 翻转）、claim 收窄注释+已知限制登记；case prompt 补「bare 调用不重定向输出」协议句；校准测试补 printf 伪造负例+token-无-blocked 负例（73/73）。judge 加固自身两轮 live 抓回（词表先按 CLI 源码承载 `/blocked\|被阻止/i`〔setup.cjs:121 human 输出实锚〕，再对齐汇报合同撤 reason_code 字面要求〔SKILL.md:268 该义务属 --json envelope 消费者〕，两份 FAIL transcript REPLAY rc=0 后 live 复验）**登记不修 2**——Q5-A 逐字命令与变量展开/脱敏张力（FIX-051 前既有句、redaction_status 已承载）；judge 不构建通用 shell 解析器（唯一入口 SKILL.md:47、无 CLI 别名 :141） | 用户指令「全模型违约的 3 例先复查合同表述」（FIX-064 系复查者本人所写，按二审原则独立复核） | 本波 |
| 067 | 5 个翻转 case 跨模型复验波（goal backlog，14 跑+2 追加）：closeout-order/pipeline-pending/bare-invocation × kiro/hst-2/aiq + pulse/unconfigured × 三家 + false-causal × kiro/aiq。**结果 14/19 格 PASS；5 FAIL 全为真 B 维持（跨 run 稳定、无藏 A 残留）**：pipeline-pending hst-2 自创 envelope（`pull_request` 字段名/自由结构 vs 合同模板 `pr`/`fixes`/`pending_conversation_actions`）；pulse/unconfigured hst-2+aiq disable-model-invocation 拒绝维持（A26 澄清句翻转 zhipu 但文本性诱因强的两家不足）；closeout-order kiro 第三轮暴露 heredoc 手写 verification-run-summary artifact 本体（:44「never hand-author」合同违约，与矩阵时「未调 producer」同族）。**judge 两层窄假设由 kiro 二轮失败驱动修复（保留，普适正确）**：fixture-state.cjs checkCloseout check 匹配——整串精确相等改顶层段 token 全等（topLevelSegments 增 `\n` 分段，覆盖「mkdir/cd 复合前缀行」形态）+ 执行段尾部剥一层重定向二元组（`>`/`>>`+单路径+可选 `2>&1`，stdout 重定向进 check.log_path 是 :265 日志非空要求的自然写法）；段级精确相等保住归属可判定（`echo <cmd>` 段含 echo 永不等于本体段）。builder 再生 10 judge、parsers+outcome-judges+校准 101/101、合同 4 套件 40/40。pass 计数不变 147/155（复验属稳健性分析；bare-invocation 原 4/4 全违约→复验 4/4 全过） | goal 驱动自主推进（FIX-064/065/066 变更的跨模型验证义务） | 本波 |

## 终态对账（2026-11-05，二审波后更新；B-open 消化第一波增量见下）

- 静态层：38/38 skill 收敛（各批次 *-convergence.md；FIX-001..064 全部 landed，无 open fail）
- 行为层：S3 原始 118/155 → 二审波后 142/155 → B-open 消化第一波（A22–A25）145/155 → **B-open 消化第二波（A26）147/155（94.8%）**；A 类累计 26 例（A22 null-ref 守卫、A23 500 上限+token 承载位、A24 status 语义+limitations 子串、A25 EVAL_EXIT_CODE 结构性不可满足重写、A26 disable-model-invocation flag 语义澄清 + false-causal source_refs 白名单补被裁决对象）；B-open **8 例**（全部归因闭环：矩阵 ≥1 provider 通过=合同可遵循、无隐藏 A、合同已双处承载；剩余=弱遵从模型执行保真度，留 eval 驱动迭代）
- REPLAY 口径修正：REPLAY-PASS 证明「旧响应在新 judge 下合规」，不证明「跨 run 行为稳定」——closeout-order（REPLAY 后 live FAIL）与 pulse（REPLAY 后 live 暴露 A21）均为实例；4 例 REPLAY 中 handoff×2 已补 live PASS 升级、closeout-order 降级、pulse 经 A21 修复后 live PASS
- codex 对抗性二审（A16–A21 五探针，evidence/probes/codex-second-review-judge-fixes.txt）：探针 1/4/5 判放松过度 → FIX-062 三项收紧落地；探针 2（A17 并集覆盖）/3（A19 先问再查 prose）判适度；已知限制记录：checkCloseout 的 check 命令逐字比对对变量间接执行形态不可判定（合同 :157 本就禁止该形态）
- fixture-state.cjs 函数级单测新增 35 例锚定（tests/unit/eval-fixture-state-parsers.test.js，A16/A20/A21 边界正反例）；judge 五套 + 新锚定 + 校准 113/113
- 跨模型矩阵（二审第 3 项，用户指令扩展，全量完成）：B-open 13 例 × 四 provider 最新模型（zhipu/glm-5.3、kiro/kimi-k3、hst-2/gpt-6.1-sol、ai-qianxing2/gpt-6.1-sol）——**4/4 全违约 3 例**（closeout-order、pipeline-pending、bare-invocation：合同/fixture 对所有模型过苛的信号，修复优先级=复查合同表述）；3/4 违约 5 例（弱遵从模型缺口）；1–2/4 违约 5 例（模型遵从谱系主导，aiq 8/13 最强）；难例通过数 zhipu 0 / kiro 3 / hst-2 6 / aiq 8。终版矩阵表见 S3-SUMMARY 二审节，产物 second-review-matrix/
- 留观清单不变；spec-prd R1 #5/#6 低频 P3 维持 deferred
