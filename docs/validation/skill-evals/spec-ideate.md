# spec-ideate 测评

| 项 | 值 |
|---|---|
| Skill | `spec-ideate` |
| 级别 | W(workflow_command,`/spec:ideate`) |
| 分组 | 需求与规划 |
| Source 路径 | `skills/spec-ideate/`(SKILL.md 441→442 行 + 8 references + agents/ 4) |
| 测评日期 | 2026-08-31 |
| Source 基线 | `wt@4f209572`(测评后含本文件记录的 refine-vs-generate 改进) |
| 测评方法 | 交叉:skill-up 双引擎实测(claude_code + codex,8 个 iteration)+ darwin 9 维 rubric + paired ×3 judge |

## 测评方式

- [x] skill-up 双引擎实测(5 cases,claude_code iteration-1~7 + codex iteration-6/8,transcript 存 workspace)
- [x] darwin 9 维 rubric 结构评估(主 agent 评结构维度;dim8 消费实测)
- [x] darwin 红灯扫描——通过,无命中
- [x] paired ×3 独立 judge 盲评(改进轮 3-0 better 全 clear → keep)
- [x] runtime 镜像同步(bin/spec-first.js init,MIRROR-SYNCED)

## 场景用例(skill-up cases)

| # | 类型 | 场景 | 预期 | 终验(claude_code iter-7) | 终验(codex iter-8) |
|---|---|---|---|---|---|
| 1 | 正例 | 裸词"给我一些改进建议"(无主题) | Subject gate 提问,不产出 | ✅ | ✅ |
| 2 | 边界 | 用户已有想法,要求打磨成需求 | 停止并指向 `spec-brainstorm`,不代行 | ✅ | ✅ |
| 3 | 正例 | 咖啡店命名(非软件主题) | 情境宣告用平实语言,不泄漏内部模式标签;先索要背景 | ✅ | ✅* |
| 4 | 正例 | mini-ledger 仓库内"提升留存"(repo fixture e2e) | grounding→发散→批判→排序,artifact 写入 `docs/ideation/` 默认 html | ✅ | ✅ |
| 5 | 边界 | 无仓库 + "随便给我惊喜方向" | surprise-me 确定性路由,先索要素材(无素材干净结束) | ✅ | ✅ |

*codex iter-8 中 case 3 自动断言 FAIL 系索取动词长尾("请先用一句话介绍…"的"介绍"不在词表),transcript 人工核验行为正确;词表已补(介绍/说明/提供),历史输出本地复验 PASS。

## 实测行为质量观察(transcript 人工核验)

- **e2e case 高质量完成**:mini-ledger fixture 上完成 grounding→六框架发散→批判淘汰→排序,artifact 落盘 `docs/ideation/`(html),输出提及路径与格式。
- **gate 降级执行精确**:无阻塞提问工具时按 SKILL.md 降级为编号选项(三选项含 Surprise me 与取消),两引擎多轮一致。
- **成本透明与授权纪律**:输出主动声明"未授权派发子代理→内联串行执行 N 个角色"、外部研究 opt-in 提示,与 Dispatch Authorization Boundary 合同一致。
- **唯一真行为失败(已修复)**:iteration-3 中 case 2 同 prompt 直接代行 brainstorm 流程(问收敛问题、宣告写 `docs/plans/`)而非指向 spec-brainstorm——约束仅存于 frontmatter description 与深处硬出口,441 行主文件扫描权重不足。

## 真实缺陷与修复(自我进化,darwin Phase 2)

- **诊断**:dim3 输入侧拒绝分支缺失,fuzz 证据 = case 2 三轮两对一错(行为不稳定)。
- **改动**(单维度 dim3,最小 diff 1 段):Phase 0 开头新增 **Refine-vs-generate check (run before anything else in this phase)**——用户持既有想法要求 refine/converge/scope/转需求时,停止并指向 `spec-brainstorm`,禁止在本 workflow 内跑 brainstorm 式提问或需求收敛。
- **Paired ×3 judge 盲评:3-0 better(全 clear)→ keep**。judge 共识:条件/动作/禁止项三要素齐全、位置在最靠前执行入口、与 frontmatter 及硬出口构成"泛化声明+入口实例"而非冲突。
- **回归验证**:改进后 case 2 在 claude_code 全量(iter-4/5/7)+ 稳定性加跑 ×2 + codex(iter-6/8)共 7 轮全部通过。

## eval 断言长尾记录(属 eval,不属 skill;逐轮收敛 3→2→1→0)

1. 问号形态:中文全角 `U+FF1F` + 陈述式/礼貌祈使式索要("丢一个过来我就开挖"/"请先用一句话介绍")——`grep '[??]'` 在 BSD grep/ugrep 下多字节字符类失灵,改 python 码点级判定 + 索取动词词表逐步收敛(问号变体 / URL·链接·素材·材料·粘贴 / 描述·告诉我·补充·介绍·说明·提供)。
2. 反向断言过严:gate case 输出**提及** `docs/ideation`(Phase 0.1 如实汇报"无该目录")被 `must_not_contain` 误杀——改 `files_not_exist`(锚定真产出而非提及)。
3. 超时噪声:gate case 默认 300s 偶发超时(iter-5),提至 480s。
4. 启示:gate 类"向用户索要输入"的合法形态空间是开放自然语言,自动断言只能抽样覆盖;词表收敛 + `files_not_exist` 锚定产出 + 人工 transcript 核验三层组合是当前最优解。

## darwin 9 维评分

| # | 维度 | 基线 | 改进后 | 要点 |
|---|---|---|---|---|
| 1 | Frontmatter | 9(6.3) | 9(6.3) | description 含触发与边界;有 argument-hint |
| 2 | 工作流清晰度 | 9(10.8) | 9(10.8) | Phase 0-5 + 0.0-0.6 编号完整;主文件 441 行信息密度高 |
| 3 | 失败模式编码 | 9(10.8) | 9.5(11.4) | warn-and-proceed/fallback 极全;输入侧拒绝分支改进后补齐 |
| 4 | 检查点设计 | 6.5(3.9) | 6.5(3.9) | blocking tool 合同显式但无显性视觉标记(观察项) |
| 5 | 可执行具体性 | 9.5(17.1) | 9.5(17.1) | dispatch prompt 逐字模板、预算与数量数字化 |
| 6 | 资源整合度 | 10(4.0) | 10(4.0) | 8+4 references 全可达,加载时机合同化;渲染契约由 sync-shared-references.js 受管同步 |
| 7 | 整体架构 | 9(10.8) | 9(10.8) | 主文件编排+references 承载细节,两段 non-optional load 合同 |
| 8 | 实测表现 | 8.5(19.55) | 9(20.7) | 改进前 case2 不稳定;改进后双引擎 7 轮全过,唯余断言词表长尾 |
| 9 | 反例与黑名单 | 10(6.0) | 10(6.0) | 硬出口/never 清单/内部标签禁泄漏 |
| | **总分** | **89.3** | **91.0** | |

## 证据

- skill-up 工件:`skills/spec-ideate-workspace/iteration-{1..8}/`(.gitignore 覆盖)
- eval 源:`skills/spec-ideate/evals/`(eval.yaml + 5 cases + mini-ledger fixture + asks-a-question.sh)
- paired judge:3 个独立 subagent 盲评(/tmp/si-version-{A,B}.md,A=改进版)
- 循环日志:`docs/validation/skill-evals/results.tsv`

## 结论

- Verdict:**通过**(基线 89.3 → 改进后 91.0;改进后双引擎终验 claude_code 5/5、codex 4/5 且唯一 FAIL 为断言词表长尾人工核验正确)
- 发现:
  1. (已修)输入侧 refine-vs-generate 拒绝分支缺失——fuzz 证据驱动,paired 3-0 keep,7 轮回归全过。
  2. (观察)dim4 检查点无显性视觉标记——与 using-spec-first 轮同型;该 skill 提问合同(blocking tool + never silently skip)语义已强,标记化收益边际低于上轮,暂不修,重估条件:出现"该问不问"的真实行为失败。
  3. (沉淀)gate 类自然语言索取形态的自动断言天花板——三层组合方案已沉淀进本文件与 _template.md 体系。
- 后续动作:无必改项;evals 为回归资产,source 变更后 `skill-up run evals/eval.yaml` 双引擎回归。
