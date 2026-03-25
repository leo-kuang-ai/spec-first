# Feature 归档报告: FSREQ-19700101-LEGACY-BASELINE

## 零、核心理念（break-loop）

> 调试的价值不在于修复这个 bug，而在于让这类 bug 不再重复发生。

- 战术层：把 baseline 的证据链、任务计划和验证结果收口成单一真源
- 战略层：把宿主安装态、外部边界与仓库证据统一纳入基线，而不是只看仓库代码
- 哲学层：任何阶段推进都必须有可落盘证据，不能依赖会话记忆

## 一、交付物清单

| 产物 | 路径 | 状态 |
|------|------|------|
| prd.md | `specs/FSREQ-19700101-LEGACY-BASELINE/prd.md` | ✅ |
| spec.md | `specs/FSREQ-19700101-LEGACY-BASELINE/spec.md` | ✅ |
| design.md | `specs/FSREQ-19700101-LEGACY-BASELINE/design.md` | ✅ |
| task_plan.md | `specs/FSREQ-19700101-LEGACY-BASELINE/task_plan.md` | ✅ |
| findings.md | `specs/FSREQ-19700101-LEGACY-BASELINE/findings.md` | ✅ |
| document-links.yaml | `specs/FSREQ-19700101-LEGACY-BASELINE/document-links.yaml` | ✅ |
| verify.md | `specs/FSREQ-19700101-LEGACY-BASELINE/verify.md` | ✅ |
| wrap_up.md | `specs/FSREQ-19700101-LEGACY-BASELINE/wrap_up.md` | ✅ |

## 二、覆盖率报告

| 覆盖维度 | 指标 | 值 |
|---------|------|-----|
| C3: Task Coverage | FR → TASK | 4/4 |
| C4: Test Coverage (FR) | FR → TC | 0/0（本基线不产出代码测试件） |
| C6: Impl Coverage | TASK 实现率 | 4/4（任务已收口） |
| C8: Task Compliance | TASK 合规率 | 4/4 |
| C9: TC Compliance | TC 合规率 | 3/3（格式校验 / 追溯链解析 / doctor） |

## 三、5 维度失败分析

### 3.1 根因分类

| ID | 类别 | 具体描述 |
|----|------|---------|
| 1 | 工具链缺口 | 当前 CLI 未暴露 `spec-first gate check` 与 `spec-first docs links validate` 子命令，无法输出官方门禁结果 |
| 2 | 运行态缺口 | `.spec-first/runtime/first/` 仍缺少 summary 等必需背景资产，导致部分 skill 只能降级执行 |
| 3 | 证据链缺口 | 需要将 `findings.md` 纳入文档关联索引并持续刷新，避免文档包只停留在 spec/design/task |

### 3.2 修复失败分析

| 尝试 | 失败原因 |
|------|----------|
| 1 | 直接执行 `spec-first gate check`，但当前 CLI 不支持该子命令 |
| 2 | 直接执行 `spec-first docs links validate`，但当前 CLI 不支持该子命令 |
| 3 | 仅依赖状态页判断，通过本地验证补回证据，避免让阶段推进建立在“看起来正常”上 |

### 3.3 预防机制

| 优先级 | 类型 | 具体行动 | 状态 |
|--------|------|----------|------|
| P0 | 规范/清单 | 更新 `templates/docs/document-links.yaml.hbs`，默认纳入 `findings.md` | TODO |
| P0 | 验证闭环 | 增加 `document-links` 本地解析测试，锁定引用完整性 | TODO |
| P1 | 工具链 | 补齐或恢复 `gate check` / `docs links validate` 的 CLI 能力 | TODO |

### 3.4 系统性扩展

- Similar Issues: 之前的阶段推进依赖会话记忆、未落盘证据的风险
- Design Flaw: 文档关联索引默认模板未覆盖 `findings.md`
- Process Flaw: 阶段推进时需要显式验证工具链可用性，不能把缺失命令当成“可忽略”

### 3.5 知识捕获

- [ ] 更新 `.spec-first/constitution.md`（全局原则）
- [ ] 更新 `specs/FSREQ-19700101-LEGACY-BASELINE/constitution.md`（特例覆盖）
- [ ] 更新 `references/*.md`
- [ ] 创建 Issue/Feature 工单

## 四、Immediate Actions（分析后立即行动）

| 优先级 | 文件路径 | 具体动作 | 责任人 | 状态 |
|--------|----------|----------|--------|------|
| P0 | `templates/docs/document-links.yaml.hbs` | 把 `findings.md` 纳入默认文档关联模板 | DEV | TODO |
| P0 | `tests/unit/document-links-validation.test.ts` | 新增 document-links 结构与引用完整性测试 | QA | TODO |
| P1 | `src/cli/commands/docs-links.ts` | 补齐或恢复 `docs links validate/show` 的 CLI 行为 | DEV | TODO |

要求：
- 至少 3 条可执行动作，且每条包含具体文件路径与动作
- 至少 1 条动作是规范/清单更新
- 至少 1 条动作是验证闭环

## 五、Gate 历史摘要

| Gate | 时间 | 结果 | 豁免 |
|------|------|------|------|
| 01_specify | 2026-03-25 | PASS | - |
| 02_design | 2026-03-25 | PASS | - |
| 03_plan | 2026-03-25 | PASS | - |
| 04_implement | 2026-03-25 | PASS | - |
| 05_verify | 2026-03-24T23:37:24Z | PASS_WITH_WAIVER | CLI 缺少 gate/docs 子命令 |

## 六、经验教训

### 做得好的

- 将宿主安装态、技能目录和外部边界纳入正式基线，避免只看仓库代码
- 任务计划最终收敛为 4 个可执行任务，且每个任务都有明确证据路径
- 通过 `findings.md` 持续落盘，保证中断后可恢复

### 需改进的

- 需要把 `document-links.yaml` 模板与当前基线包要求同步，否则 `findings.md` 会成为半独立文档
- 当前 CLI 的 `gate/docs links` 命令缺失，验证阶段需要显式工具链守卫
- `runtime 真源` 缺失时，`spec-first:first` 只能降级执行，不应被误读为完整分析基线

### 下次避免的

- 避免在没有落盘证据时推进阶段
- 避免把“状态页看起来正常”当作“门禁已通过”
- 避免只更新 feature 文档而不同步验证与归档产物
