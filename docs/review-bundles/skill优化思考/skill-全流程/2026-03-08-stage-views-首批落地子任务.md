# 2026-03-08 stage-views 首批落地子任务

## 1. 这份清单的定位

这份文档定义的是**全流程方案的首批开工波次**。

首批波次不追求“一次把所有消费节点都接完”，而是追求：

- 先完成 producer 分层维护能力
- 先让入口 / 编排节点理解背景状态
- 为主链接入打下稳定基础

所以首批波次包含两层：

1. `00-first` 完成 runtime 真源层 + docs 投影视图层
2. `00-onboarding / 01-init / 13-orchestrate` 完成第一批接入

---

## 2. 为什么首批不直接改主链

如果第一波同时改：

- `00-first`
- `00-onboarding`
- `01-init`
- `03-spec`
- `04-design`
- `07-code`
- `12-verify`
- `13-orchestrate`
- `14-status`
- `15-doctor`
- `21-analyze`

问题会立刻变成：

1. 无法快速判断是 producer 问题还是 consumer 问题
2. 一旦测试失败，很难分辨是 stage view 生成错误还是消费口径错误
3. 方案收口慢，落地节奏失控

因此最合理的第一波不是“先接主链”，而是：

> **先让 producer 分层能力成型，再让入口 / 编排节点知道如何使用这套背景机制。**

---

## 3. 首批波次范围

## A. producer 分层能力完成

依赖文档：

- `docs/review-bundles/skill优化思考/first-skill/2026-03-08-first-skill-一次切换实施清单.md`

完成标志：

- runtime 真源层已建立
- `docs/first/` 已明确为投影视图层
- `loadStageView(projectRoot, stage)` 已可用
- 默认支持增量更新

## B. `00-onboarding` 接入角色化降级

建议修改：

- `skills/spec-first/00-onboarding/SKILL.md`
- `skills/spec-first/00-onboarding/references/scenario-mapping.md`
- 新增 `tests/unit/onboarding-skill-docs.test.ts`

完成标志：

- 有 `role-views` 时优先走角色化入口
- 无 `first` 资产时明确进入降级模式

## C. `01-init` 接入背景状态识别

建议修改：

- `skills/spec-first/01-init/SKILL.md`
- `skills/spec-first/01-init/references/output-format.md`
- `skills/spec-first/01-init/references/interaction-guide.md`
- `tests/unit/init.test.ts`

完成标志：

- `init` 能检测 runtime `first` 资产存在性
- `init` 输出 `background_input_status`

## D. `13-orchestrate` 接入依赖强度与降级编排

建议修改：

- `skills/spec-first/13-orchestrate/SKILL.md`
- `skills/spec-first/13-orchestrate/references/orchestration-rules.md`
- `skills/spec-first/13-orchestrate/references/skill-mapping.md`
- `tests/unit/orchestrate-args-parser.test.ts`

完成标志：

- orchestrate 能识别 `full / degraded / blind`
- orchestrate 能对 `L1 / L2 / L3` 给出路径建议

---

## 4. 不在首批波次内的内容

以下内容全部放到下一波：

- `03-spec` 接入 `spec-view`
- `04-design` 接入 `design-view`
- `07-code` 接入 `code-view`
- `12-verify` 接入 `verify-view`
- `14-status` 接入背景状态展示
- `15-doctor` 接入背景诊断
- `21-analyze` 接入背景质量分析

原因不是这些不重要，而是它们应该建立在“producer 已稳定、入口已识别背景状态”的前提上。

---

## 5. 首批任务顺序

### Task A1：完成 producer 分层能力

文件范围：

- `src/core/skill-runtime/first-*.ts`
- `skills/spec-first/00-first/`
- `docs/first/`
- `tests/unit/first-*.test.ts`

完成标准：

- runtime 真源层建立完成
- docs 投影视图层建立完成
- `stage-views` 可被读取

### Task A2：让 `00-onboarding` 感知 role view 与降级

文件范围：

- `skills/spec-first/00-onboarding/SKILL.md`
- `skills/spec-first/00-onboarding/references/scenario-mapping.md`
- `tests/unit/onboarding-skill-docs.test.ts`

完成标准：

- `00-onboarding` 能区分“有 role view”与“无 first 资产”两种入口

### Task A3：让 `01-init` 输出背景状态

文件范围：

- `skills/spec-first/01-init/SKILL.md`
- `skills/spec-first/01-init/references/output-format.md`
- `skills/spec-first/01-init/references/interaction-guide.md`
- `tests/unit/init.test.ts`

完成标准：

- `init` 能把背景状态带入 feature 初始化结果

### Task A4：让 `13-orchestrate` 理解依赖强度

文件范围：

- `skills/spec-first/13-orchestrate/SKILL.md`
- `skills/spec-first/13-orchestrate/references/orchestration-rules.md`
- `skills/spec-first/13-orchestrate/references/skill-mapping.md`
- `tests/unit/orchestrate-args-parser.test.ts`

完成标准：

- `orchestrate` 能在 `full / degraded / blind` 下给出不同路径建议
- `orchestrate` 能理解 `L1 / L2 / L3`

---

## 6. 首批波次完成定义

首批波次完成，需要同时满足：

1. producer 分层能力完成
2. `00-onboarding` 已接入角色化降级
3. `01-init` 已输出背景状态
4. `13-orchestrate` 已接入依赖强度编排

一句话：

> 第一波的完成标志，不是主链已经全面消费 stage views，而是“背景真源已经生成、docs 投影已经稳定、入口已经能识别、编排已经能调度”。
