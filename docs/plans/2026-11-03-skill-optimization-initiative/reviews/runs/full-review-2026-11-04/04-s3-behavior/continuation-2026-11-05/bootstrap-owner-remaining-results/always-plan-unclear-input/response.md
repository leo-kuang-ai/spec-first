规划完成。交付状态如下：

## 交付摘要

**计划已写入**：`/private/var/folders/0v/f_smd31500113ppkqs66c9yr0000gn/T/skill-up-2981040813/docs/plans/2026-11-07-001-feat-miniledger-usability-plan.md`（`spec-unified-plan/v1`，`artifact_readiness: implementation-ready`，`execution: code`，Standard 深度）

**计划范围**（5 个单元，U1→U5）：
- U1 `POST /entries` 校验 + 默认值 + 201 回显，坏输入 400 不再崩进程（含 `node:test` 测试基架与 `require.main` 可测性改造）
- U2 `category` 字段（trim + 小写归一，缺省 `other`）
- U3 `GET /summary`（总额/笔数/按分类降序明细）
- U4 `GET /entries?category=` 过滤
- U5 README 与行为同步（修正“五个字段”等过时描述）

零新依赖，单文件 extend，不落盘、不做 UI（均列入 Deferred，附失效条件）。

**置信检查**：通过，无需加深（全部依据来自已全文读入的源码与 README，Node v22.22.3 已实测核实）。

**文档审查（降级）**：`review_source: producer-self-review`，`review_status: degraded`，`reason_code: spec_doc_review_capability_unavailable`（本宿主未安装 spec-doc-review，Skill 列表与技能目录均已确认），`mutation_policy: markdown-write`。仅完成 producer 自审，**独立审查未运行**；自审应用 1 处修正（U1 回显字段与 U2 的时序歧义），无遗留待决项；独立审查才可能发现的语义问题数量未知。

## 实施交接：阻塞

你的原始请求是执行型的（“帮我搞点事情”），但按 spec-plan 合同，规划产出者不能自行转入编码——而本宿主**未安装 spec-work**（项目与全局技能目录均无，也无其他宿主的可用 canonical 源），本会话不存在可返回的执行 caller，也没有可用的原生 goal 接口。因此**实施未开始**，计划保留待交接。

恢复路径（任选其一，说一声即可）：
1. **明确指示我在本会话直接按计划实施**——你的新指令即授权，我会从 U1 开始做完整验证；
2. 安装与 spec-plan 同源的 spec-work，我再以它接管计划执行。

约束遵守情况：仅 `prepare-eval.cjs` 产生了基线 commit，未做任何任务 commit；实现代码、实现测试均未触碰。
