# using-spec-first 测评

| 项 | 值 |
|---|---|
| Skill | `using-spec-first` |
| 级别 | S(standalone) |
| 分组 | 入口与路由 |
| Source 路径 | `skills/using-spec-first/`(SKILL.md + 2 references) |
| 测评日期 | 2026-08-30 |
| Source 基线 | commit `4f209572`(测评后含本文件记录的 dim4 改进) |
| 测评方法 | 交叉:skill-up CLI 真实引擎实测(claude_code engine)+ darwin-skill 9 维 rubric 结构评估 + paired ×3 judge |

## 测评方式

- [x] skill-up 真实引擎实测(5 cases,`evals/eval.yaml`,claude_code iteration-2/3/4 + **codex 双引擎交叉 iteration-6 全量 5/5**,transcript 存 workspace)
- [x] darwin 9 维 rubric 结构评估(主 agent 评结构维度;dim8 消费 skill-up 实测结果)
- [x] darwin 红灯扫描(runtime 中立性 grep)——通过,无命中
- [x] paired ×3 独立 judge 盲评(改进轮 keep/revert 裁决)
- [ ] fresh-source subagent eval(以 skill-up 实测等价覆盖:真实引擎 + 磁盘源注入,已达成同等证据强度)

## 场景用例(skill-up cases)

| # | 类型 | 场景 | 预期 | 判定(iteration-3) |
|---|---|---|---|---|
| 1 | 正例 | 测试全挂 + stack trace + 回归信号 | 选择 `spec-debug`,不选 plan/work,不链式 | ✅ PASS |
| 2 | 正例 | 模糊想法(范围/用户/成功标准未定) | 选择 `spec-brainstorm`,不选 plan/ideate | ✅ PASS |
| 3 | 正例 | 已初始化仓库"第一个功能没想好"的推荐类请求 | 推荐 `spec-ideate`,recommendation-only 不直接 Entering | ✅ PASS |
| 4 | 反例 | 轻量一次性 how-to(Markdown 语法) | Direct Lane 直答,无 Entering、无推荐模板 | ✅ PASS |
| 5 | 边界 | 崩溃 + 后续简化诉求的复合意图 | 失败优先选 `spec-debug`,不自动链式 simplify | ✅ PASS |

自动断言 5/5;iteration-2 人工核对 transcript 亦确认 5/5 语义正确(断言当时 1P/4F,系 eval 断言缺陷,见下)。

**双引擎交叉(2026-08-31 补测)**:codex engine 配额恢复后全量重跑,iteration-6 **5/5 PASS**(改进后版本)。两套引擎(claude_code / codex,不同模型)对改进版 skill 路由行为一致,鲁棒性证据闭环。附注:iteration-6 中 case 5 出现一条 engine 内部 `cat` 沙箱 skill 路径失败的无害 ERROR,case 判定不受影响,如实记录。

## 实测行为质量观察(iteration-2/3 transcript)

- 路由全部正确,且输出包含完整的 announce(`Entering <entry>: <reason>`)或三字段推荐模板(`Recommended entrypoint / Reason / Next action`),模板词按用户语言本地化(中文变体)——符合 "Use the repository's configured user language"。
- **诚实降级**:沙箱为空目录、`spec-*` workflow 未安装时,skill 未伪造宣告,而是按 recommend-and-wait 降级 + 向用户核对环境事实(空目录、1/35 安装)+ 给出选项。这是 conditional-routing-boundaries 中 "routing match never authorizes init" 与 advisory-facts 纪律的正确执行。
- **失败优先与单入口**:复合意图(崩溃 + 简化)正确进入 spec-debug 并显式拒绝自动串联 spec-simplify-code("应在崩溃修复落地、diff 验证之后再进入")。

## darwin 9 维评分(基线)

| # | 维度 | 得分 | 权重分 | 要点 |
|---|---|---|---|---|
| 1 | Frontmatter 质量 | 9 | 6.3 | 做什么+何时用+反例齐全;无显式触发词列表 |
| 2 | 工作流清晰度 | 8 | 9.6 | 结构清楚但无编号步骤(见"收束说明") |
| 3 | 失败模式编码 | 8.5 | 10.2 | Direct Lane 扩张→重路由、fail-closed 清单强;references 缺失 fallback 未编码 |
| 4 | 检查点设计 | 6 | 3.6 | 两个真实检查点(低置信最多一问、推荐后等待)无显性标记 |
| 5 | 可执行具体性 | 9 | 16.2 | 模板逐字、白/黑名单逐条;"low confidence" 无可操作判据 |
| 6 | 资源整合度 | 10 | 4.0 | 两个 references 正确且带读取前置条件 |
| 7 | 整体架构 | 9 | 10.8 | 紧凑分层,无冗余无 AI 腔 |
| 8 | 实测表现 | 9.5 | 21.85 | 5/5 语义正确;宣告 vs 推荐形态随环境自适应(非缺陷,保守扣) |
| 9 | 反例与黑名单 | 10 | 6.0 | description/Direct Lane/exit boundaries 三层反例 |
| | **总分** | | **88.6 / 100** | 结构 66.7/77 + 实测 21.85/23 |

## 证据

- skill-up 工件:`skills/using-spec-first-workspace/iteration-{2,3,4}/`(result.json、grading.json、transcript;该路径被 .gitignore 覆盖,不入库)
- eval 源:`skills/using-spec-first/evals/`(eval.yaml + 5 cases)
- darwin 循环日志:`docs/validation/skill-evals/results.tsv`
- paired judge:3 个独立 subagent 盲评(材料 /tmp/usf-version-{A,B}.md,A=改进版)

## 首轮 eval 断言缺陷记录(属 eval 设计,不属 skill)

1. 空沙箱必然触发 recommend-and-wait 降级,断言硬编码 "Entering" → 误判 FAIL;修正为锚定入口名 + 排除项,宣告/推荐中英变体均合法。
2. 模板词合法本地化(中文"推荐入口点/原因/下一步行动"),断言只认英文模板词 → 修正。
3. case 4 使用了不存在的 judge 规则 `output_not_contains`(被判 unknown_rule)→ 删除,改用 expect.must_not_contain + 正向断言。
4. codex engine 全部 429 限流不可用 → 切换 claude_code engine(本机登录态)。

修正原则:保留全部路由不变量断言(正确入口、错误入口排除、单入口不链式、Direct Lane 排除),仅修环境盲区与语言假设,未弱化断言。

## 自我进化(darwin Phase 2)

- 诊断:最大加权短板 dim4(2.4,与 dim2 并列;HL-3 相关簇)。
- 改动(单维度 dim4,最小 diff 两处,语义零变化):
  1. `At low confidence, ask at most one route-changing question.` → `**Checkpoint — ask:** ... then stop and wait for the answer before routing further.`
  2. `Enter the recommendation only after the user asks to continue.` → `**Checkpoint — wait:** after any recommendation, stop and yield; enter ... only after the user asks to continue.`
- Paired ×3 judge(盲评 A/B):**3-0 better(1 clear + 2 slight)→ keep**。judge 共识:显性标记使两处暂停点可被 LLM 扫描识别,且 B 无任何维度占优。
- 回归:改进后 eval 重跑 5/5 保持(iteration-4,见 results.tsv)。
- 收束说明:下一短板 dim2(无编号步骤)判定为**不修**——SKILL.md 明文 "It is a semantic map, not a rigid state machine",编号化线性流程与该 skill 的设计哲学冲突,属 rubric 通用标准与 skill 语义的合理偏离。按 HL-4 见好就收,循环收束。

## 结论

- Verdict:**通过**(基线 88.6/100;行为实测 5/5;改进轮 keep 后结构短板 dim4 已修复)
- 发现:
  1. (已修)检查点显性化——dim4 6→9(估计),paired 3-0 keep。
  2. (观察)references 文件缺失时的 fallback 未编码——低概率场景,记录为观察项,重估条件:出现真实宿主 references 加载失败案例。
  3. (观察)"low confidence" 无可操作判据——属本仓库 "LLM semantic judgment above deterministic floor" 哲学的有意设计,不改为硬规则。
- 后续动作:无必改项;eval cases 已沉淀为该 skill 的回归资产,后续 source 变更可 `skill-up run` 回归。
