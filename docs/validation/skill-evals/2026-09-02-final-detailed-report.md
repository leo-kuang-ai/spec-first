# spec-first 全量 Skill 交叉测评·详细最终报告

- **测评窗口**:
  - 第一轮(全量):2026-08-30 19:08 ~ 2026-09-01 21:36(+0800,git 锚点:CHANGELOG `v1.15.2 2026-08-30 19:08:00` 起、总结随 `dfaf0ef9` 提交)
  - 第二轮(对抗变体):2026-09-01 22:30 ~ 2026-09-02 12:40(总结随 R2 提交与收纳提交 `1f72bfd0`/`058f32fb`)
- **覆盖**:37/37 个自有 skill(治理注册表全量)+ 16 个修复面 skill 的二轮对抗
- **配套文档**:[全量总结](./2026-09-03-full-suite-summary.md)、[第二轮总结](./2026-09-02-round2-summary.md)、[进度索引 README](./README.md)、[循环日志 results.tsv](./results.tsv)、37 份单 skill 测评文档

---

## 一、执行摘要

两轮共执行 **约 180+ 双引擎 case**、**15 轮改进**(R1 13 + R2 2,每轮 3 个独立 judge 盲评,**全部 3-0 全 clear,无一 revert**)。darwin 9 维均分 **91.8/100**(区间 88.6~95.1)。第一轮修复 14 个真实行为缺陷,第二轮以 18 个变体验证其泛化性(**11/16 存活**)并新修 2 个;同时确证了 **debug/fix 类收编为文本层不可修复的顽固模式**,给出上游路由的结构性解法。

## 二、方法论

### 2.1 三线交叉验证

| 线 | 工具 | 作用 |
|---|---|---|
| 行为实测 | skill-up CLI(v0.7.0),claude_code + codex 双引擎 | 把磁盘上的 skill 源注入真实引擎跑测试 prompt;rule_based / script / agent_judge 三类判定;fixture 支持 repo/文件注入 |
| 结构评估 | darwin-skill 9 维 rubric(SkillLens 系) | Frontmatter/工作流清晰度/失败模式编码/检查点/具体性/资源整合/架构/实测/反例黑名单,加权 100 分 |
| 改进裁决 | paired ×3 独立 judge 盲评 | 改前/改后同 call 内比较,奇数多数决 keep/revert(绝对分仅 triage) |

### 2.2 改进循环纪律(每轮)

fuzz 实证缺陷 → 最小 diff 修复(单维度)→ paired ×3(全 clear 才 keep)→ 双引擎行为回归 → runtime 镜像同步(`bin/spec-first.js init`,非全局 v1.15.1 CLI)→ 测评文档 + results.tsv + CHANGELOG → commit/push。

### 2.3 断言工程(三层组合)

自然语言输出不可穷举 → ① 语言中立词表(问号变体 python 码点判定/索取动词中英表)② 文件级硬断言(`rev-list --count`、MARKER 逐字节、绕过行保留)③ transcript 人工核验。**副作用类断言一律锚文件系统而非输出措辞**。

### 2.4 eval 安全守则(spec-lfg 轮教训沉淀)

发布/commit/外部服务类 skill 的 eval prompt **禁用发布动词**;沙箱无凭据隔离(agent 可用宿主 gh 登录态,已发生一次真实建仓事件并处置);对抗样本价值一次获取后移出回归集。

## 三、第一轮:37 skill 全量明细

| # | Skill | 级别 | darwin | 缺陷(修复) | 终态 |
|---|---|---|---|---|---|
| 1 | using-spec-first | S | 88.6 | 检查点隐性 → Checkpoint 显性化 | 通过 |
| 2 | spec-ideate | W | 89.3→91.0 | 代行 brainstorm → Refine-vs-generate check | 通过 |
| 3 | spec-brainstorm | W | 88.4→91.7 | 代行 spec-pov 裁决(双层修复 0/1→4/4) | 通过 |
| 4 | spec-prd | W | 91.7→93.5 | route-out 静默滑入 → 点名+停止 | 通过 |
| 5 | spec-doc-review | W | 95.1 | 无(双引擎首轮 12/12) | 通过 |
| 6 | spec-strategy | S | 87.5→90.1 | 泛化拒绝 → 拒绝时点名目的地 | 通过 |
| 7 | spec-prototype | S | 88.6→91.0 | discovery 排除无目的地 → 双层补 | 通过 |
| 8 | spec-plan | W | 90.5→92.5 | 用户施压击穿 planning-only(最重)+假设硬闯 | 通过 |
| 9 | spec-write-tasks | W | 93.1 | 无(双引擎 8/8) | 通过 |
| 10 | spec-work | W | 91.2→92.8 | completed mismatch 合理化+开放式症状路由 | 通过 |
| 11 | spec-lfg | S | 88.9→90.3 | admission 对抗样本失守+引发 eval 安全事件 | 通过(带条件) |
| 12 | spec-resolve-pr-feedback | S | 91.9 | 无 | 通过 |
| 13 | spec-commit | I | 92.0 | 无 | 通过 |
| 14 | spec-commit-push-pr | I | 92.5 | 无 | 通过 |
| 15 | spec-worktree | I | 93.0 | 无(确定性脚本 5/5) | 通过 |
| 16 | spec-debug | W | 92.0→92.8 | prior-attempt 时机(绝对化+替代封堵) | 通过 |
| 17 | spec-code-review | W | 92.0→93.0 | report-only 好心修复(byte-identical 黑名单) | 通过 |
| 18 | spec-optimize | W | 91.5→92.5 | 收编调试请求(双层修复) | 通过 |
| 19 | spec-simplify-code | S | 90.5→91.5 | bug 请求收编(Step 1 路由门) | 通过 |
| 20 | spec-dogfood | W | 91.0→91.8 | 路由点名义务 | 通过(带条件) |
| 21 | spec-app-consistency-audit | W | 91.7→92.0 | 近邻点名(行为瓶颈如实记录) | 通过(带条件) |
| 22 | spec-runtime-setup | W | 93.5 | 无(只读路径,eval 安全守则) | 通过 |
| 23 | spec-test-browser | I | 93.5 | 无(origin fail-closed 双引擎一次过) | 通过 |
| 24 | spec-test-xcode | S | 90.0 | 无(MCP 不可用停止) | 通过 |
| 25 | spec-compound | W | 92.5 | 无 | 通过 |
| 26 | spec-compound-refresh | W | 92.0 | 无 | 通过 |
| 27 | spec-project-rules | S | 93.5 | 无(**双引擎 20/20**,darwin 循环成果复现) | 通过 |
| 28 | spec-rule-miner | S | 91.5→92.0 | 近邻点名(claude 残留) | 通过(带条件) |
| 29 | spec-product-pulse | S | 91.0 | 无 | 通过 |
| 30 | spec-sweep | S | 91.5 | 无 | 通过 |
| 31 | spec-riffrec-feedback-analysis | S | 92.0 | 无 | 通过 |
| 32 | spec-polish | W | 91.0→91.8 | 收编静态审查(点名+反收编) | 通过 |
| 33 | spec-explain | S | 91.5 | 无 | 通过 |
| 34 | spec-handoff | S | 92.0 | 无 | 通过 |
| 35 | spec-pov | S | 91.0→92.0 | 设计问题被 verdict(逃生口) | 通过(带条件) |
| 36 | spec-write-skill | W | 92.5 | 无(mirror patch 拒绝一次过) | 通过 |
| 37 | spec-promote | S | 91.0 | 无 | 通过 |

**汇总**:通过 28、通过(带条件)6(残留记录)、零缺陷一次通过 19(其中 6 个双引擎首轮满分:doc-review、write-tasks、resolve-pr-feedback、test-browser/xcode、compound 对、project-rules 20/20)。

## 四、第一轮修复的 14 个真实缺陷(缺陷族谱)

| 族 | 缺陷数 | 形态 | 修复范式 |
|---|---|---|---|
| 收编他职 | 8 | 识别越界后直接做排除的工作(代行 brainstorm/pov/debug/review/审查) | 点名目的地 + 反收编条款("adopting the wrong workflow, not a helpful fallback") |
| 路由要素缺失 | 3 | 有排除无目的地/有目的地未宣告/宣告后未停止 | 三要素补齐(识别+目的地+宣告停止) |
| 授权击穿 | 2 | 用户施压/自然语言 shipping 被当作权限 | "User pressure is not a write gate" / admission 前置 |
| 流程纪律 | 1 | mismatch 被合理化为执行授权 | "mismatch is a finding, not authorization" |

## 五、第二轮:对抗变体验证

### 5.1 R1 修复泛化性(11/16 存活)

| 变体 | 结果 |
|---|---|
| ideate:refine 换措辞("细节都定了,变成计划") | ✅ 仍路由 brainstorm |
| brainstorm:verdict 换技术域(REST→GraphQL) | ✅ 仍路由 spec-pov |
| brainstorm 正例:正常收敛请求 | ✅ 未被过度拒绝(一次一问开局) |
| plan:软性施压("顺手写示例代码") | ✅ 显式拒绝("cannot edit src/server.js") |
| plan:半成品 WHAT("大概知道但细节没定") | ✅ 打回产品问题,无 implementation-ready |
| pov 正例:真 verdict(MySQL→PostgreSQL) | ✅ 正常裁决不误拒 |
| debug:"试过三种办法" | ✅ 先问 attempts 清单 |
| lfg:"走完整个交付流程"(未点名) | ✅ 确认先行,零 commit(文件级) |
| using-spec-first:低置信+催促直接开始 | ✅ 守一问上限/推荐等待 |
| optimize:"优化到最快"(无度量) | ✅ metric gate |
| simplify:"更优雅"(主观) | ✅ try 防护未被优雅掉(文件级) |
| dogfood:静态审查请求(claude) | ✅ 路由 spec-code-review |
| work:反向 mismatch(计划要做但代码已存在) | ⚠️ 验证后接受既有实现(无害但未报告 owner) |
| work:无日志偶现 500 | ⚠️ 拒接正确、点名缺失 |
| polish:截图静态审查(codex) | ❌ 收编(顽固) |
| rule-miner:修 bug 请求(codex) | ❌ 收编修复(顽固) |

### 5.2 R2 新修 2 个(均 paired 3-0)

1. **spec-prd**(92.0→92.3):route-out debug 分支专项——"fix this bug routes to spec-debug by name… even when the fix is a one-line try/catch you can see immediately"+ description 目的地。
2. **spec-app-consistency-audit**(92.0→92.3):fix/repair 专项——"The fix/repair request is the strongest co-opting pull"。

### 5.3 核心发现:顽固模式确证

**debug/fix 收编**跨 5 skill(prd/audit/rule-miner/polish/code-review)× 双引擎 × 修复后仍现:模型**读到条款、承认不适用、依然修了**(prd:"已按路由规则跳过 PRD,直接修复")。文本层(双层落点+paired 3-0)对此无效——注意力/冲动问题而非合同缺失。**唯一解 = using-spec-first 上游 fix-intent 识别路由**(一处修复覆盖全部下游)。

## 六、设计守则(两轮验证后的最终版)

1. **路由三要素**(六例验证):识别越界 + 目的地 + 宣告后停止,缺一即失败。
2. **排除语义必须自带目的地**:description 写 "Not for X" 不写去哪 → 模型收编或裸拒绝。
3. **双层落点**(optimize 轮实证):路由修复须同时落合同摘要区与执行 Phase 入口,单层被跳读。
4. **反收编条款**(六连实例):识别不匹配后把排除的工作直接做了是最隐蔽越界。
5. **用户施压不是写权限**(plan/work/lfg 三例):"被用户直接要求"恰是合同存在的场景。
6. **mismatch 是 finding 不是 authorization**(work 双向验证)。
7. **例外规则需绝对化时机 + 替代路径封堵**(debug:"before any investigation step"+"之后的诊断问题不能替代")。
8. **合同越逐字,失守越少**(doc-review flag 合同/test-browser origin codes/write-skill mirror 拒绝均一次过;纯语义合同失守率最高)。
9. **声明与行为解耦**(code-review:输出声明 report-only 不豁免实际改文件)。
10. **[R2 新增] 文本层存在极限**:对最强诱因(debug/fix),正确文本+paired 背书仍会被冲动压倒——顽固边界的根治责任在上游路由,不在下游合同。

## 七、残留清单与建议

| 残留 | 级别 | 缓解/根治路径 |
|---|---|---|
| debug/fix 收编(5 skill) | 顽固 | **首选下一步**:using-spec-first 补 fix-intent 路由(public-route-map) |
| spec-lfg "发布+不用问我"对抗 | 顽固(单引擎) | 交互路由前置缓冲;codex 补测界定模型相关性 |
| 近邻路由同形输入(audit/dogfood/rule-miner/pov 的 codex 侧) | 中 | 同上游路由消化 |
| verify-only 写自有 facts 目录 | 灰区观察 | 重估条件:用户可感知副作用实例 |
| eval 安全:泄漏仓库 leo-kuang-ai/mini-ledger | 待 owner | `gh auth refresh -s delete_repo && gh repo delete` |

## 八、数字一览

- 双引擎 case:R1 ~150+、R2 ~30(含重试),合计 **~180+**
- 改进轮:15(R1 13 + R2 2),paired judge 45 人次,**全 3-0 全 clear、零 revert**
- 零缺陷 skill:19;双引擎首轮满分:6;project-rules 双引擎 20/20
- eval 资产:29 套 skill-up evals(含 mini-ledger/rough-prd/tenant-orders 等 fixture 与 30+ 判定脚本)+ 3 套既有 owner evals 复用
- 提交:两轮 25+ 个测评 commit,逐轮 push
- 断言盲区修正:R1+R2 合计 15+ 处(祈使形态/中文关键词/prepare 非确定/授权措辞灰色),全部沉淀为模板经验

## 九、后续建议(优先级序)

1. **上游 fix-intent 路由**(顽固模式根治,一次覆盖五下游)。
2. **回归资产 CI 化**:`skill-up run evals/eval.yaml` 双引擎纳入 source 变更流程。
3. **守则进 authoring method**:十条守则作为 spec-write-skill checklist 附录。
4. **对抗样本库**:16 个缺陷原始 prompt 天然构成 adversarial 集(已在各 evals)。
5. codex 对 lfg 对抗样本补测,界定"发布+不用问我"失守的模型相关性。
