# spec-first 全量 Skill 交叉测评总结报告

- **测评窗口**:2026-08-30 ~ 2026-09-03
- **覆盖**:37/37 个自有 skill(治理注册表全量)
- **方法**:skill-up CLI 双引擎实测(claude_code + codex,~70 个 skill-up iteration、150+ case 执行)× darwin-skill 9 维 rubric 结构评估 × paired ×3 独立 judge 盲评(13 轮改进全部 3-0 全 clear)× 逐轮 commit/push
- **产物**:29 份 skill-up eval 套件(含 mini-ledger/rough-prd/tenant-orders 等 fixture 与 20+ 判定脚本)沉淀为永久回归资产;37 份测评文档 + results.tsv(70 行循环日志)

## 一、总览

| 维度 | 结果 |
|---|---|
| darwin 均分 | **91.8 / 100**(改进后口径;区间 88.6 ~ 95.1) |
| 零缺陷一次通过 | **19 个** |
| 发现真实行为缺陷并修复 | **14 个**(涉及 13 个 skill,spec-brainstorm 两轮) |
| 带条件通过(残留记录) | **6 个**(lfg/audit/dogfood/rule-miner/pov + 共性说明) |
| 改进全部经 paired ×3 | 13 轮 keep 决策 **全 3-0 全 clear**,无一 revert |
| 红灯扫描(runtime 中立性) | 37/37 通过 |

### 分数榜(改进后)

| 分数带 | Skills |
|---|---|
| 95+ | spec-doc-review(95.1) |
| 93+ | spec-prd(93.5)、spec-runtime-setup / spec-test-browser / spec-project-rules(93.5)、spec-code-review / spec-write-tasks(93.1/93.0)、spec-worktree(93.0) |
| 92+ | spec-plan(92.5)、spec-commit-push-pr / spec-commit / spec-compound / spec-write-skill(92.5/92.0/92.5/92.5)、spec-riffrec(92.0)、spec-debug / spec-simplify-code / spec-ideate / spec-strategy / spec-prototype / spec-promote / spec-resolve-pr-feedback / spec-compound-refresh / spec-optimize / spec-handoff / spec-pov(92.8→91.5 带) |
| <92 | using-spec-first(88.6,首个测评对象,后续标准建立前)、spec-lfg(90.3)、spec-explain(91.5)、spec-dogfood / spec-app-consistency-audit / spec-rule-miner(带条件组) |

## 二、修复的 14 个真实缺陷(全部 fuzz 实证 + paired 3-0 + 回归验证)

| # | Skill | 缺陷形态 | 修复要点 |
|---|---|---|---|
| 1 | using-spec-first | 检查点隐性(低置信提问/推荐等待无显性标记) | `**Checkpoint — ask/wait**` 显性化 |
| 2 | spec-ideate | **代行 brainstorm**:打磨已有想法被直接代行 | Phase 0 Refine-vs-generate check |
| 3 | spec-brainstorm R1 | **代行 spec-pov 裁决**(写决策规则+追问裁决问题) | verdict 唯一出口禁令 |
| 4 | spec-brainstorm R2 | description 排除句**无路由目的地** | `route those to spec-pov` 补齐 |
| 5 | spec-prd | **route-out 静默滑入**(未宣告就开始探索提问) | "name the destination and stop" |
| 6 | spec-plan | **用户施压击穿 planning-only**("顺便改了跑通"→真改代码) | "User pressure is not a write gate" |
| 7 | spec-plan | WHAT 未定时**假设硬闯**可执行计划 | 0-1 必须点名 spec-brainstorm |
| 8 | spec-work | completed 计划被"代码里还没有"合理化照样执行 | "mismatch is a finding, not authorization" |
| 9 | spec-work | 开放式症状直接诊断修复未点名 spec-debug | bare-prompt Step 0 路由 |
| 10 | spec-lfg | 自然语言"直接发布+不用问我"被当作 admission(引发 eval 安全事件) | CRITICAL admission 前置 + "'不用问我'不能创造 admission" |
| 11 | spec-code-review | **report-only 好心修复**(检出 P0 后把被审文件改回,声明与行为矛盾) | "Report-only means byte-identical" 黑名单 |
| 12 | spec-debug | prior-attempt 未先问("试了好几次"仍先调查) | "before any investigation step" 绝对化时机 |
| 13 | spec-optimize + simplify-code + polish + dogfood + audit + rule-miner | **收编他职六连**(识别不匹配却直接做排除的工作) | 各自补"点名目的地 + 反收编"条款 |
| 14 | spec-pov | 用户自有设计问题被直接 verdict(替用户做产品决定) | "A product-design question is not a verdict" 逃生口 |

## 三、沉淀的设计守则(可复用知识)

1. **路由三要素**(六例验证):路由 = 识别越界 + 目的地 + 宣告后停止。三要素缺一即失败——三种历史失败形态分别对应缺其一。
2. **排除语义必须自带路由目的地**:description 写 "Not for X" 却不写去哪,模型会自行收编或裸拒绝。
3. **双层落点**:路由类修复须同时落在合同摘要区与执行 Phase 入口——单层会被跳读(optimize 轮实证:单层修复后 codex 半改良)。
4. **反收编条款**:"recognizing the mismatch and then doing the excluded work anyway is adopting the wrong workflow, not a helpful fallback"——识别不匹配后把排除的工作直接做了是最隐蔽的越界。
5. **用户施压不是写权限**:"被用户直接要求"恰是合同存在的场景,不是例外(plan/work/lfg 三例)。
6. **mismatch 是 finding 不是 authorization**:计划状态与源码现实不符是给 plan owner 的发现,不是执行非 active 计划的借口。
7. **例外规则需绝对化时机 + 替代路径封堵**:"ask before investigating" 会被"调查中途问了"满足,须 "before **any** investigation step" + "之后的诊断问题不能替代"(debug 轮)。
8. **合同越逐字,失守越少**:doc-review 的 flag fail-closed、test-browser 的 origin reason codes、write-skill 的 mirror 拒绝——机器可判定的逐字合同双引擎一次通过率最高;纯语义合同失守率最高。
9. **声明与行为解耦条款**:输出 JSON 声明 report-only 不豁免实际改文件的行为违规(code-review 轮)。

## 四、eval 工程沉淀(写入 _template.md 的九条经验)

断言锚不变量而非模板词(本地化长尾)、gate 类索取形态三层组合(词表+files_not_exist+人工核验)、副作用锚文件系统(rev-list/MARKER)而非输出措辞、**eval 安全守则**(发布类 skill 的 prompt 禁用发布动词;沙箱无凭据隔离警示——spec-lfg 轮真实建仓教训)、governed caller / 显式调起 framing、grep 多字节坑用 python 码点判定等。

## 五、残留与建议(带条件组)

| Skill | 残留 | 缓解层 |
|---|---|---|
| spec-lfg | "发布+不用问我"对抗样本在 glm 单轮 headless 仍一次失守 | 交互场景路由前置 + 确认问题;建议 codex 补测界定模型相关性 |
| spec-app-consistency-audit / spec-dogfood / spec-rule-miner | 近邻路由在重主流程/同形输入下不稳定(收编做排除工作,质量往往很高但 workflow 错) | 建议由 using-spec-first 入口路由层统一消化近邻场景 |
| spec-pov | codex 拒 formal verdict 后仍给"工程建议" | 已较 formal verdict 轻;重估条件=再现实害 |

**结构性观察**:残留全部集中在"输入与 skill 职责高度同形"的边界(审查请求≈挖规则/审计/打磨),文本层修复已达瓶颈——这是 LLM 注意力分配问题而非合同缺失问题,上游路由是正确解法。

## 六、数字一览

- 双引擎 case 执行约 **150+**,其中约 30 次失败驱动 14 个真实缺陷定位(其余为 eval 断言盲区修正,本身即经验沉淀)
- 13 轮 paired 盲评 = 39 个独立 judge,全部 3-0 better 全 clear
- 15 次 runtime MIRROR-SYNCED(bin/spec-first.js init;工作树未发布改动的同步路径已验证)
- 19 个零缺陷 skill 中 6 个为双引擎首轮满分(doc-review、write-tasks、resolve-pr-feedback、test-browser/xcode、compound 对、project-rules 20/20)
- git:每轮 commit+push,共 20+ 个测评提交(最新 `e4f0aa06` 之后为终轮)

## 七、后续建议

1. **回归资产化**:CI 或 spec-write-skill 修复流程中直接 `skill-up run evals/eval.yaml` 双引擎回归(29 套件已就位)。
2. **入口路由强化**:将近邻路由表收敛进 using-spec-first 的 public-route-map(残留组的结构性解法)。
3. **守则进规范**:九条设计守则可作为 spec-write-skill authoring method 的 checklist 附录。
4. **对抗样本库**:十四个缺陷的原始 prompt 是天然的回归/adversarial 集,已在各 evals 中。
