# spec-doc-review 测评

| 项 | 值 |
|---|---|
| Skill | `spec-doc-review` |
| 级别 | W(workflow_command,`/spec:doc-review`) |
| 分组 | 需求与规划 |
| Source 路径 | `skills/spec-doc-review/`(SKILL.md 196 行 + 22 references + 8 personas + 自研 evals + scripts) |
| 测评日期 | 2026-09-01 |
| Source 基线 | `wt@4f209572`(无 source 改动——本轮零缺陷零修复) |
| 测评方法 | 交叉:skill-up 双引擎实测(claude_code + codex,各 6/6)+ darwin 9 维 rubric |

## 测评方式

- [x] skill-up 双引擎实测(6 cases;claude_code iteration-1 + codex iteration-2,**双双首轮全绿**)
- [x] darwin 9 维 rubric 结构评估
- [x] darwin 红灯扫描——通过
- [x] transcript 人工核验(cost-shape 合同逐字执行、诚实降级标注)
- 无 Phase 2 改进轮(未发现行为缺陷;runtime 无需同步)

## 场景用例(skill-up cases,置于 `evals/eval.yaml`,与既有自研 evals JSON 共存)

| # | 类型 | 场景 | 预期 | claude_code | codex |
|---|---|---|---|---|---|
| 1 | 合同 | 双 mutation token 冲突 | fail-closed `flag-conflict-or-unsupported` + 点名冲突 token,不读文档不派发 | ✅ | ✅ |
| 2 | 合同 | headless 无文档路径 | 固定错误消息 + 重调用指引,不派 personas | ✅ | ✅ |
| 3 | 关键 | 默认调用(无 mutation flag) | report-only 零写,MARKER 逐字节未动 | ✅ | ✅ |
| 4 | 关键 | 显式 apply-fixes + task-pack | 强制 report-only + `task-pack-derived-artifact`,MARKER 未动 | ✅ | ✅ |
| 5 | 关键 | 显式 apply-fixes + HTML | 强制 report-only + `html-artifact`,MARKER 未动 | ✅ | ✅ |
| 6 | 正例 | security 信号文档 + standard | cost-shape 行 + security-lens 第一优先选中 + 预算跳过标注 | ✅ | ✅ |

## 实测行为质量观察

- **cost-shape 行逐字符合合同**:`profile=standard N=3 personas=[coherence,feasibility,security] skipped_conditional=[adversarial:budget] doc_bytes=404 slices=full isolation=degraded_inherited`——security-lens 按第一优先正确选中,adversarial 因预算跳过并带原因,dispatch 授权缺失时 isolation 诚实标注 `degraded_inherited`(未虚报隔离)。
- **flag 冲突处理教科书级**:逐字错误 + Conflicting tokens 点名 + 正确重调用示例。
- **task-pack 诚实降级**:fixture 的 source_plan 缺失时 `task_pack_validity: invalid` + `review_status: incomplete` 如实报告,不伪造完成。
- 三种强制 report-only(默认/task-pack/HTML)MARKER 全部未动——mutation 权威三轴正交(delivery/output/格式均不得授予写权限)在双引擎上全部成立。

## darwin 9 维评分

| # | 维度 | 得分 | 权重分 | 要点 |
|---|---|---|---|---|
| 1 | Frontmatter | 8.5 | 5.95 | 中文 description + 详尽 argument-hint;无反例清单 |
| 2 | 工作流清晰度 | 9.5 | 11.4 | Phase 0-5 + flag 表 + mutation 七分支枚举 |
| 3 | 失败模式编码 | 10 | 12 | fail-closed 合同/missing-doc gate/backpressure/不完整覆盖禁 clean verdict |
| 4 | 检查点设计 | 9 | 5.4 | 双 STOP 标记 + Phase 5 terminal question |
| 5 | 可执行具体性 | 9.5 | 17.1 | 错误消息与 cost-shape 逐字 + 模板变量逐个定义 |
| 6 | 资源整合度 | 10 | 4.0 | 22 references 全部 STOP 条件加载 + @include |
| 7 | 整体架构 | 9.5 | 11.4 | mutation/delivery/output 三轴正交声明;dispatch 授权与 mutation 权威正交 |
| 8 | 实测表现 | 9.5 | 21.85 | 双引擎 12/12 首轮全绿(五 skill 首次) |
| 9 | 反例与黑名单 | 10 | 6.0 | Never 清单 + anti-waste + 预算不回扩 |
| | **总分** | | **95.1 / 100** | 五 skill 最高;零缺陷零修复 |

## 证据

- skill-up 工件:`skills/spec-doc-review-workspace/iteration-{1,2}`
- eval 源:`skills/spec-doc-review/evals/`(eval.yaml + 6 cases + 3 fixture repos + 3 marker 脚本)
- 循环日志:`docs/validation/skill-evals/results.tsv`

## 结论

- Verdict:**通过**(95.1/100,五 skill 最高;双引擎首轮 12/12 全绿;零修复)
- 发现:
  1. (正面)mutation 权威体系(默认零写/derived artifact 保护/格式强制/三轴正交)是五个 skill 中最强的出口治理实现,双引擎无一失守。
  2. (观察)dim1 description 无反例清单(8.5,最大加权短板 1.05)——鉴于实测零缺陷且路由由 using-spec-first 上游承担,判定不修;重估条件:出现与 doc-review 职责混淆的真实误触发。
  3. (沉淀)cost-shape advisory 行的逐字合同 + 诚实降级标注(isolation=degraded_inherited)是"响亮降级"模式的模范实现。
- 后续动作:无必改项;MARKER 校验三脚本与 fixture 模式已第三次复用,是 report-only 类 skill 的标准回归资产。
