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
| 022 | spec-write-skill preview 写集 seam（D04/B02/X02：交付/迁移必然触及 repo 级文件，preview 声明路径锁 canonical root 内）——L1 建议 authorized supporting paths，排队实施 | L1 仲裁采纳 | 待实施 |

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
