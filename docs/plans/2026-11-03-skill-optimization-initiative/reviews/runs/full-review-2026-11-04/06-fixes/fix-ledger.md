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

## 终态对账（2026-11-05，D 类归因收口后更新）

- 静态层：38/38 skill 收敛（各批次 *-convergence.md；FIX-001..053 全部 landed，无 open fail）
- 行为层：S3 原始 118/155 → 归因后确认 133/155（提档 4 PASS + A 类修复重验 11 PASS）；A 类 15 例全部修复（11 例重跑翻转 + 3 例 REPLAY-PASS + riffrec 1 例合同承载），B 类 open 17 例留 eval 迭代 backlog（合同均已承载；含 verify 收口新归因 bare-invocation fail-closed 与 false-causal 脚手架过度引用）
- judge 单测：ce-u28/knowledge-publication/eval-fixture-contracts 37/37；runtime-setup 白名单解析器 15/15
- 留观清单不变；spec-prd R1 #5/#6 低频 P3 维持 deferred
