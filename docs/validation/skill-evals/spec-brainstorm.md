# spec-brainstorm 测评

| 项 | 值 |
|---|---|
| Skill | `spec-brainstorm` |
| 级别 | W(workflow_command,`/spec:brainstorm`) |
| 分组 | 需求与规划 |
| Source 路径 | `skills/spec-brainstorm/`(SKILL.md 308→310 行 + 12 references + agents/ 1) |
| 测评日期 | 2026-09-01 |
| Source 基线 | `wt@4f209572`(测评后含本文件记录的两处改进) |
| 测评方法 | 交叉:skill-up 双引擎实测(claude_code + codex,6 个 iteration)+ darwin 9 维 rubric + 两轮 paired ×3 judge |

## 测评方式

- [x] skill-up 双引擎实测(5 cases;claude_code iteration-1/2/4 + verdict 稳定性 ×5 + codex iteration-3/5)
- [x] darwin 9 维 rubric 结构评估
- [x] darwin 红灯扫描——通过
- [x] 两轮 paired ×3 独立 judge 盲评(均 3-0 better 全 clear → keep)
- [x] runtime 镜像同步(bin/spec-first.js init,MIRROR-SYNCED)

## 场景用例(skill-up cases)

| # | 类型 | 场景 | 预期 | 终验 |
|---|---|---|---|---|
| 1 | 正例 | 空 feature 描述调用 | 先问"想探索什么",不推进、不产计划 | ✅ |
| 2 | 边界 | "要不要把 ESLint 换成 Biome?帮我决定"(verdict 三要素齐备) | 0.1c gate:交互式 offer spec-pov handoff,不代行裁决 | ✅(修复后 4/4) |
| 3 | 边界 | "git rebase 和 merge 区别?"(Neither) | 直接回答,跳过全部 brainstorm 阶段 | ✅ |
| 4 | 正例 | "爸妈七十大寿庆典"(非软件) | 路由 universal-brainstorming,一次一问开局,不产软件计划 | ✅ |
| 5 | 正例 | 需求已清晰 + 明确要求落盘(mini-ledger fixture) | 简短处理;写入 `docs/plans/YYYY-MM-DD-NNN-*-plan.md` 命名合同 | ✅ |

## 真实缺陷与修复(两轮 Phase 2,均为"代行他职"型)

**缺陷(0/1)**:"要不要把 ESLint 换成 Biome"——模型正确识别请求不在 brainstorm 范围,却未 offer spec-pov,而是自创第三条路径:直接写 ESLint vs Biome 决策规则 + 追问两个裁决问题(代行 spec-pov 职责,输出中 spec-pov 出现 0 次)。

- **修复 1(0.1c 唯一出口禁令,dim3)**:新增 "**When the shape matches, the only exits are the offer or the workflow — never the verdict itself.**" 段——逐项禁止"写决策规则/权衡 fit/代问裁决问题",封死"even when you are confident"合理化路径,收尾 "An out-of-scope request is routed, not adopted."。paired 3-0 keep。效果:0/1 → 约 50%(仍偶发)。
- **修复 2(description 补路由目的地,dim1)**:失败轮输出**原文引用了 description 的排除句**再选择代行——证明模型读到了排除语义但那里没写"该给谁"。在排除句尾部加 "; route those verdict questions to spec-pov."。paired 3-0 keep。效果:50% → **4/4**(claude_code ×3 + codex ×1 全过,含教科书级 offer 输出:三要素判定→"这正是 spec-pov 的职责"→二选一询问)。

修复链证据:同一 case 从基线 0/1 → 单层修复 ~50% → 双层修复 4/4。**启示:LLM 的"识别越界"与"正确转出"是两个独立能力,排除语义必须自带路由目的地。**

## 实测行为质量观察

- clear-req case:文档真落盘,命名合同逐字符合(`2026-09-01-001-feat-entries-month-filter-plan.md`),Phase 4 handoff 菜单四选项正确;非法参数处理被正确标注为"延迟到规划"。
- 非 software 与 Neither 分类准确;空主题 gate 提问规范。
- codex 全量 iteration-3 **5/5 全绿**(含修复前即过的 4 case,交叉印证)。

## eval 断言记录(属 eval)

- clear-req 首断言锚 `requirements-only` 锚错位置——该字段写在 artifact frontmatter 而非聊天输出;改为锚 `docs/plans` + `-plan.md` 命名合同,字段核验转人工。
- gate 复用 spec-ideate 轮沉淀的 asks-a-question.sh(问号变体 + 索取动词词表),零新坑。

## darwin 9 维评分

| # | 维度 | 基线 | 改进后 | 要点 |
|---|---|---|---|---|
| 1 | Frontmatter | 9(6.3) | 9.5(6.65) | description 双反例;改进后排除句自带路由目的地 |
| 2 | 工作流清晰度 | 9(10.8) | 9(10.8) | Phase 0-4 + 0.0-0.1c 子步编号完整 |
| 3 | 失败模式编码 | 9(10.8) | 9.5(11.4) | 空 topic/Neither/fallback 全;verdict 唯一出口改进后补强 |
| 4 | 检查点设计 | 7(4.2) | 7(4.2) | Phase 2.5 已有显性 STOP 标记(优于前两个 skill) |
| 5 | 可执行具体性 | 9.5(17.1) | 9.5(17.1) | 输出模式 5 步/scout prompt 逐字/Interaction Rules 含正反例句 |
| 6 | 资源整合度 | 10(4.0) | 10(4.0) | 12 references 加载时机合同化 |
| 7 | 整体架构 | 9(10.8) | 9(10.8) | 与 ideate/plan 的三连分工句一致;unified plan 边界清晰 |
| 8 | 实测表现 | 8(18.4) | 9(20.7) | verdict 0/1→4/4;其余 4 case 双引擎稳定 |
| 9 | 反例与黑名单 | 10(6.0) | 10(6.0) | description 双反例/CONCEPTS.md 禁改/implementation 默认排除清单 |
| | **总分** | **88.4** | **91.7** | |

## 证据

- skill-up 工件:`skills/spec-brainstorm-workspace/iteration-{1..5}`(.gitignore 覆盖)
- eval 源:`skills/spec-brainstorm/evals/`(5 cases + mini-ledger fixture + asks-a-question.sh,复用 ideate 轮资产模式)
- paired judge:两轮各 3 个独立 subagent 盲评
- 循环日志:`docs/validation/skill-evals/results.tsv`

## 结论

- Verdict:**通过**(基线 88.4 → 改进后 91.7;verdict case 修复链 0/1 → 4/4;codex 全量 5/5;claude_code 全量终验其余 4 case 稳定通过)
- 发现:
  1. (已修,两层)verdict 请求代行裁决——0.1c 唯一出口禁令 + description 路由目的地,两轮 paired 各 3-0 keep。
  2. (沉淀)"识别越界"≠"正确转出"——排除语义必须自带目的地;该规律与 spec-ideate 轮的 refine-vs-generate 修复同构,已两度验证,建议作为后续所有入口边界 skill 的设计守则。
  3. (观察)dim4 检查点 7 分,Phase 2.5 有显性 STOP;全量标记化边际低,暂不修。
- 后续动作:无必改项;evals 为回归资产。
