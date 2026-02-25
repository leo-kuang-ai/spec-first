# Skill 需求文档审查报告（对齐 v5 规范）

> **审查日期**: 2026-02-09 | **审查对象**: skill-requirements-v1.md (v1.1)
> **对齐基准**: spec-first-v5.md（v5.0 final）
> **审查结论**: **不通过** — 发现 P0×6 + P1×7 + P2×4 = 17 项不对齐

---

## 一、评分总览

| 维度 | 评分 | 说明 |
|------|------|------|
| Gate 条件对齐 | 30/100 | Gate 命名、阈值、数量全部错误 |
| 覆盖率指标对齐 | 40/100 | 指标编号自造、阈值偏差大、缺失指标 |
| 交付物文件名对齐 | 35/100 | 14 个模板中 8 个文件名与 v5 不符 |
| Context Pack 对齐 | 45/100 | Schema 结构与 v5 原文严重偏离 |
| Session Catchup 对齐 | 55/100 | 步骤顺序错误、动态加载矩阵不符 |
| 阶段活动对齐 | 60/100 | 多个 Skill 的输出交付物与 v5 阶段定义不符 |
| SCA 检查点对齐 | 50/100 | v5 定义 5 个检查点，文档仅覆盖 3 个 |

---

## 二、P0 — 必须修复（6 项）

### P0-1: Gate 命名体系与 v5 完全不符

**skill-req 写法**：
```
Gate 1 — Design Ready（01_specify → 02_design）
Gate 2 — Code Ready（03_plan → 04_implement）
Gate 3 — Release Ready（05_verify → 06_wrap_up）
Gate 4 — Go Live（06_wrap_up → 07_release）
```

**v5 原文**（L2061-2069）：
v5 **没有** "Gate 1/2/3/4" 命名体系。v5 定义的是 **8 个阶段各自的 Exit Gate**，每个阶段都有独立的 Gate：

| 阶段 | v5 Gate 内容 | Gate Owner |
|------|-------------|------------|
| 00 Init | 目录就绪，Mode/Size/端已确认 | Tech Lead |
| 01 Specify | DoR Sign-off，无歧义标记，所有 FR/NFR 已分配 ID | Tech Lead |
| 02 Design | 设计评审 + Baseline Locking + API 覆盖率 = 100% | Tech Lead / Architect |
| 03 Plan | 任务评审 + Task 覆盖率 = 100% + Task 合规率 = 100% | Tech Lead |
| 04 Implement | Code CR + 代码覆盖率 ≥ 80% + PR 合规率 = 100% | Tech Lead / Peer |
| 05 Verify | UAT Sign-off + 安全无高危 + Test 覆盖率 = 100% + TC 合规率 = 100% | QA Lead + PM |
| 06 Wrap-up | 文档完整性 + 实现覆盖率 = 100% + 矩阵全 🎯 Accepted | Tech Lead |
| 07 Release | Smoke Test + 核心指标无异常 + 回滚方案就绪 | Tech Lead + Ops |

覆盖率指标中的 "★ Gate 1/2/3" 仅为简写引用：Gate 1 = 02 Design Exit Gate，Gate 2 = 03 Plan Exit Gate，Gate 3 = 05 Verify Exit Gate。**"Gate 4" 在 v5 中不存在**。

**影响范围**：SK-SYS-02 gate-check 的 4 道 Gate 定义、SK-CHK-01/02 的 Gate 引用、所有阶段生产类 Skill 的"满足的 Gate 条件"章节。

**修复方案**：将 Gate 体系改为 v5 的 8 阶段 Exit Gate 模型，删除 "Gate 4 Go Live" 自造概念。

---

### P0-2: 覆盖率阈值全部错误

**skill-req 写法 vs v5 原文对比**：

| 指标 | skill-req 阈值 | v5 原文阈值 | 偏差 |
|------|---------------|------------|------|
| Task 覆盖率 | ≥ 80% | **= 100%** | 降低 20% |
| Test 覆盖率(FR级) | ≥ 80% | **= 100%** | 降低 20% |
| Test 覆盖率(AC级) | ≥ 70% | **≥ 90%（M/L）** | 降低 20% |
| 孤儿项率 | ≤ 5% | **= 0%** | 放宽 5% |
| Task 合规率 | 未提及 | **= 100%** | 缺失 |
| TC 合规率 | 未提及 | **= 100%** | 缺失 |
| PR 合规率 | 未提及 | **= 100%** | 缺失 |
| 实现覆盖率 | 未提及 | **= 100%** | 缺失 |
| API 覆盖率 | 未提及 | **= 100%** | 缺失 |

v5 的覆盖率要求远比 skill-req 严格。skill-req 将 100% 降为 80%/70%，将 0% 放宽为 5%，且完全遗漏了 5 项指标。

**影响范围**：SK-CHK-02 coverage-gate 的全部条件定义、SK-04/SK-06/SK-07 的验收标准。

**修复方案**：全部阈值对齐 v5 原文；补充缺失的 5 项指标（Task 合规率、TC 合规率、PR 合规率、实现覆盖率、API 覆盖率）。

---

### P0-3: 覆盖率指标编号 C1-C9 为自造，v5 无此定义

**skill-req 写法**：使用 C1~C9 编号（如 "C1 任务覆盖率"、"C9 孤儿项率"）。

**v5 原文**：v5 将 9 项指标分为 3 类（5 正向覆盖 + 3 反向合规 + 1 综合），**不使用 C1-C9 编号**。

**影响范围**：SK-CHK-02、SK-04、SK-06、SK-07 中所有引用 C1/C2/C3/C9 的地方。

**修复方案**：删除 C1-C9 编号，改用 v5 原文的指标名称（如"Task 覆盖率"、"Test 覆盖率(FR级)"、"孤儿项率"）。

---

### P0-4: 交付物模板文件名与 v5 严重不符（8/14 错误）

**skill-req 模板清单 vs v5 文件命名规范对比**：

| skill-req 模板名 | v5 原文文件名 | 问题 |
|-----------------|-------------|------|
| `spec.md.hbs` | `spec.md` | ✅ 正确 |
| `clarify-log.md.hbs` | **无此文件** | ❌ v5 无 clarify-log，澄清记录在 spec.md 内 |
| `design.md.hbs` | `design.md` | ✅ 正确 |
| `api-contract.yaml.hbs` | **`contracts/*.yaml`** | ❌ v5 是目录+多文件，非单文件 |
| `research-note.md.hbs` | **`research.md`** | ❌ 文件名错误 |
| `task-plan-detail.md.hbs` | **`tasks.md`** | ❌ v5 用 tasks.md，非 task-plan-detail |
| `code-review-checklist.md.hbs` | **`checklist.md`** | ❌ v5 用 checklist.md（验证清单，非代码审查清单） |
| `test-plan.md.hbs` | **`tests/*.test.md`** | ❌ v5 是目录+多文件，非单文件 test-plan |
| `test-report.md.hbs` | **`reports/test-report.md`** | ❌ 路径错误，应在 reports/ 子目录 |
| `archive-checklist.md.hbs` | **无此文件** | ❌ v5 无此文件名，归档清单是内置逻辑 |
| `release-note.md.hbs` | **无此文件** | ❌ v5 无 release-note，有 `retro.md`（复盘报告） |
| `go-live-checklist.md.hbs` | **无此文件** | ❌ v5 无此文件 |

**v5 定义但 skill-req 遗漏的交付物**：

| v5 文件名 | 所属阶段 | 说明 |
|----------|---------|------|
| `data-model.md` | 02 Design | 数据模型 |
| `checklist.md` | 03 Plan | 验证清单 |
| `adr/NNN-*.adr.md` | 02 Design | 架构决策记录 |
| `reports/security-scan.md` | 05 Verify | 安全扫描报告 |
| `reports/uat-signoff.md` | 05 Verify | 验收签核记录 |
| `retro.md` | 06 Wrap-up | 复盘报告 |

**修复方案**：按 v5 文件命名规范（L2209-2229）重建全部模板清单。

---

### P0-5: Context Pack Schema 与 v5 原文结构严重偏离

**skill-req 自造的 Schema**：
```yaml
context_pack:
  feature_meta:
    feature_id: "AUTH"              # ❌ v5 用飞书需求ID格式
    stage_status: "in_progress"     # ❌ v5 无此字段
  artifacts:                        # ❌ v5 是 flat map，非 list
    - path: "specs/AUTH/spec.md"
      type: "spec"
      last_modified: "..."
  constitution:                     # ❌ v5 是路径字符串，非对象
    principles: [...]
  current_phase:                    # ❌ v5 是字符串，非对象
    stage: "02_design"
    pending_deliverables: [...]
    gate_conditions: [...]
```

**v5 原文 Schema**（L2447-2467）：
```yaml
context_pack:
  version: "1.0"
  feature_meta:
    id: "FSREQ-123456-user-auth"   # 飞书需求ID格式
    title: "用户认证模块"
    mode: N
    size: S
    platforms: [H5, Backend]        # 复数，列表
  artifacts:                        # flat map，key→path
    spec: "specs/FSREQ-.../spec.md"
    design: "specs/FSREQ-.../design.md"
    tasks: "specs/FSREQ-.../tasks.md"
    matrix: "specs/FSREQ-.../traceability-matrix.md"
    task_plan: "specs/FSREQ-.../task_plan.md"
    progress: "specs/FSREQ-.../stage-state.json"
    findings: "specs/FSREQ-.../findings.md"
  constitution: "constitution.md"   # 路径字符串
  current_phase: "04-implement"     # 字符串
  current_task: "TASK-AUTH-001"
```

**关键差异**：

| 字段 | skill-req | v5 原文 | 差异 |
|------|----------|--------|------|
| `feature_meta.id` | `"AUTH"` | `"FSREQ-123456-user-auth"` | 格式完全不同 |
| `feature_meta.platforms` | `platform: "github"` (单数) | `platforms: [H5, Backend]` (复数列表) | 字段名+类型错 |
| `artifacts` | 对象数组 `[{path, type, last_modified}]` | flat map `{spec: path, design: path, ...}` | 结构完全不同 |
| `constitution` | 对象 `{principles: [...]}` | 字符串 `"constitution.md"` | 类型错误 |
| `current_phase` | 对象 `{stage, pending_deliverables, gate_conditions}` | 字符串 `"04-implement"` | 类型错误 |
| `version` | 缺失 | `"1.0"` | 遗漏 |
| `feature_meta.title` | 缺失 | `"用户认证模块"` | 遗漏 |

**影响范围**：SK-SYS-01 context-pack 的整个 Schema 定义、所有 Skill 的输入字段描述。

**修复方案**：完全替换为 v5 原文 Schema，删除所有自造字段。

---

### P0-6: SCA 检查点数量错误（3 vs 5）

**skill-req 写法**：定义 3 个 SCA 检查点：
- `sca_design`（Gate 1）
- `sca_code`（Gate 3）
- `sca_test`（Gate 3）

**v5 原文**（L2109-2115）定义 **5 个** SCA 检查点：

| # | 触发时机 | 校验内容 |
|---|---------|---------|
| 1 | **Specify 完成后** | spec 内部一致性（AC 覆盖所有 FR、NFR 量化、FR 间无矛盾） |
| 2 | **Design 完成后** | spec ↔ design（每个 FR 有对应设计，API 覆盖需接口的 FR） |
| 3 | **Plan 完成后** | spec ↔ tasks（Task 覆盖率 = 100%，Task 合规率 = 100%） |
| 4 | **Implement 完成后** | spec ↔ code（PR 合规率 = 100%，API 实现与契约一致） |
| 5 | **Verify 完成后** | spec ↔ test results（Test 覆盖率 = 100%，所有 AC 有对应 TC 且通过） |

skill-req 遗漏了 #1（Specify 后 spec 内部一致性）和 #3（Plan 后 spec↔tasks），且命名不符。

**修复方案**：补全 5 个 SCA 检查点，命名对齐 v5（按阶段编号而非自造名称）。

---

## 三、P1 — 尽快修复（7 项）

### P1-1: Session Catchup 步骤顺序与 v5 UC-024 不符

**skill-req 写法**（SK-SYS-03 的 8 步恢复流程）：
```
Step 1: 读取 stage-state.json → 确定 current_stage
Step 2: 读取 constitution.md → 加载项目原则
Step 3: 读取 stage-state.json → 了解整体进度
Step 4: 读取 findings.md → 了解已知问题
Step 5: 按 current_stage 动态加载交付物
Step 6: 读取 task_plan.md → 定位当前任务
Step 7: 读取 traceability-matrix → 了解追踪状态
Step 8: 生成恢复摘要
```

**v5 原文**（UC-024，L1025-1070）的恢复顺序：
```
Step 1: 读取 task_plan.md → 定位当前任务（优先级最高）
Step 2: 读取 stage-state.json → 了解整体进度
Step 3: 读取 findings.md → 了解已知问题
Step 4: 读取 constitution.md → 加载项目原则
Step 5: 读取 spec.md → 需求上下文
Step 6: 按 current_phase 动态加载阶段交付物
Step 7: 读取 traceability-matrix → 追踪状态
Step 8: 生成恢复摘要 → 输出给用户确认
```

**关键差异**：
- v5 以 `task_plan.md` 为第一步（任务优先），skill-req 以 `stage-state.json` 为第一步（状态优先）
- v5 将 `constitution.md` 放在第 4 步，skill-req 放在第 2 步
- v5 第 5 步显式读取 `spec.md`，skill-req 无此步骤

**修复方案**：按 v5 UC-024 原文重排步骤顺序。

---

### P1-2: Session Catchup 动态加载矩阵文件名错误

**skill-req 动态加载矩阵**：

| current_stage | 必须加载 | 可选加载 |
|---------------|---------|---------|
| 01_specify | constitution.md | — |
| 02_design | spec.md | clarify-log.md |
| 03_plan | spec.md, design.md | api-contract.yaml |
| 04_implement | task_plan.md, design.md | spec.md |
| 05_verify | task_plan.md, spec.md | test-plan.md |
| 06_wrap_up | 全部已有交付物 | — |

**v5 原文差异**：
- `clarify-log.md` 在 v5 中不存在（澄清记录在 spec.md 内）
- `api-contract.yaml` 应为 `contracts/*.yaml`（目录+多文件）
- `test-plan.md` 应为 `tests/*.test.md`（目录+多文件）
- 04_implement 阶段应加载 `tasks.md`（v5 文件名），非 `task_plan.md`
- 缺少 `checklist.md`（03_plan 阶段产出的验证清单）

**修复方案**：按 v5 文件命名规范修正动态加载矩阵中的所有文件名。

---

### P1-3: SK-04 task-decompose 输出交付物与 v5 不符

**skill-req 写法**：
- 输出：`specs/<featureId>/task_plan.md`（运行态三文件之一）

**v5 原文**（03 Plan 阶段活动表）：
- 03 Plan 阶段的核心交付物是 **`tasks.md`**（任务拆解文档）+ **`checklist.md`**（验证清单）
- `task_plan.md` 是运行态三文件之一，由系统自动维护，**不是** 03 Plan 阶段的主交付物

**关键差异**：
- skill-req 将运行态文件 `task_plan.md` 当作阶段交付物，混淆了"阶段产出"与"运行态文件"
- 遗漏了 `checklist.md`（验证清单），这是 03 Plan 的必需交付物
- v5 的 `tasks.md` 是结构化任务定义文档，与运行态 `task_plan.md` 的职责不同

**修复方案**：SK-04 输出改为 `tasks.md` + `checklist.md`；`task_plan.md` 由 SK-SYS-04 runtime-files 自动从 `tasks.md` 同步生成。

---

### P1-4: SK-06 test-design 输出交付物与 v5 不符

**skill-req 写法**：
- 输出：`specs/<featureId>/test-plan.md` + `specs/<featureId>/test-report.md`

**v5 原文**（05 Verify 阶段活动表 + 文件命名规范 L2209-2229）：
- 测试用例文件：**`tests/*.test.md`**（目录+多文件，每个 FR 或模块一个测试文件）
- 测试报告：**`reports/test-report.md`**（在 `reports/` 子目录下）
- 安全扫描：**`reports/security-scan.md`**
- 验收签核：**`reports/uat-signoff.md`**

**关键差异**：
- v5 的测试用例是 `tests/` 目录下的多文件（`*.test.md`），非单一 `test-plan.md`
- v5 的测试报告在 `reports/` 子目录下，非根目录
- skill-req 遗漏了 `reports/security-scan.md` 和 `reports/uat-signoff.md`

**修复方案**：SK-06 输出改为 `tests/*.test.md` + `reports/test-report.md`；补充安全扫描和 UAT 签核交付物。

---

### P1-5: SK-07 archive 输出交付物与 v5 不符

**skill-req 写法**：
- 输出：`specs/<featureId>/archive-checklist.md` + `specs/<featureId>/release-note.md`

**v5 原文**（06 Wrap-up 阶段活动表）：
- 06 Wrap-up 的核心交付物是 **`retro.md`**（复盘报告），**不是** archive-checklist 或 release-note
- v5 的归档清单（19 项）是 **内置校验逻辑**，不是独立文件
- v5 无 `release-note.md` 概念，发布说明由 07 Release 阶段的 Smoke Test 流程覆盖
- 06 Wrap-up 还需确保：实现覆盖率 = 100%、矩阵全 🎯 Accepted、文档完整性

**关键差异**：
- `archive-checklist.md` 是自造文件名，v5 归档清单是 Gate 内置校验
- `release-note.md` 是自造文件名，v5 无此交付物
- 遗漏了 `retro.md`（复盘报告）这一 v5 明确定义的交付物

**修复方案**：SK-07 输出改为 `retro.md`；归档清单改为 Gate 内置校验逻辑（非独立文件）；删除 `release-note.md`。

---

### P1-6: 代理路由映射与 v5 原文不符

**skill-req 写法**（§2.1 映射关系）：

| v5 Agent | skill-req Skill | skill-req 输出 |
|----------|----------------|---------------|
| oracle | SK-01 spec-write | spec.md, clarify-log.md |
| sisyphus | SK-02 design-write | design.md, api-contract.yaml |
| librarian | SK-03 research | research-note.md |
| do | SK-04 task-decompose | task_plan.md |
| codeagent-wrapper | SK-05 code-trace | 无新文件 |
| 默认 Agent | SK-06 test-design | test-plan.md, test-report.md |
| document-writer | SK-07 archive | archive-checklist.md, release-note.md |

**v5 原文**（代理路由矩阵 L2422-2441）定义 **8 个** Agent：

| v5 Agent | v5 职责 | v5 输出 |
|----------|--------|--------|
| oracle | 需求编写 | spec.md |
| sisyphus | 技术设计 | design.md, data-model.md, contracts/*.yaml |
| librarian | 技术调研 | research.md（非 research-note.md） |
| do | 任务拆解 | tasks.md + checklist.md（非 task_plan.md） |
| codeagent-wrapper | 代码实现 | 代码文件 + PR |
| tester | 测试设计 | tests/*.test.md（非 test-plan.md） |
| document-writer | 文档归档 | retro.md + 更新 spec/design |
| **explore** | **代码探索** | **无（辅助型）** |

**关键差异**：
- skill-req 遗漏了 `explore` Agent（代码探索辅助）
- `librarian` 输出应为 `research.md`，非 `research-note.md`
- `do` 输出应为 `tasks.md` + `checklist.md`，非 `task_plan.md`
- `tester` 在 skill-req 中被写为"默认 Agent"，应明确为 `tester`
- `document-writer` 输出应为 `retro.md`，非 `archive-checklist.md` + `release-note.md`
- `sisyphus` 遗漏了 `data-model.md` 输出

**修复方案**：按 v5 代理路由矩阵修正全部 Agent 映射和输出交付物。

---

### P1-7: 04 Implement 和 07 Release 阶段缺少 Skill 覆盖

**skill-req 写法**：
- 04 Implement：SK-05 code-trace 仅做"追溯辅助"（展示上下文 + commit 校验），**不产出任何交付物**
- 07 Release：无对应 Skill，标注为"手动发布，CLI 辅助 checklist"

**v5 原文**：

04 Implement Exit Gate 要求：
- Code CR 通过
- 代码覆盖率 ≥ 80%
- **PR 合规率 = 100%**（每个 PR 必须关联 TASK ID）
- SCA #4 通过（spec ↔ code 一致性）

07 Release Exit Gate 要求：
- Smoke Test 通过
- 核心指标无异常
- 回滚方案就绪

**关键差异**：
- SK-05 code-trace 无法满足 04 Implement Exit Gate 的自动条件（PR 合规率校验、SCA #4 触发）
- 07 Release 完全无 Skill 覆盖，但 v5 定义了明确的 Exit Gate 条件
- skill-req 的 SK-CHK-01 sca-gate 仅覆盖 3 个 SCA 检查点，遗漏了 #4（Implement 后 spec↔code）

**修复方案**：
1. SK-05 增加 PR 合规率校验和 SCA #4 触发能力
2. 新增 SK-08 release-check（或扩展 SK-SYS-02 gate-check）覆盖 07 Release Exit Gate
3. SK-CHK-01 补充 SCA #4 检查点

---

## 四、P2 — 计划修复（4 项）

### P2-1: 运行态三文件并发策略与 v5 不符

**skill-req 写法**（SK-SYS-04 验收标准）：
```
并发写入安全（文件锁或原子写入）
```

**v5 原文**（L2492-2501）：
- 运行态三文件采用 **append-only + merge** 策略
- `findings.md`：仅追加，不修改已有条目
- `stage-state.json`：按阶段分区追加，同一阶段内覆盖写入
- `task_plan.md`：状态字段原子更新，其余字段 append-only
- 并发冲突解决：**最后写入者胜（Last Writer Wins）+ 冲突标记**

**关键差异**：skill-req 提出"文件锁或原子写入"是通用方案，v5 定义了更精细的 append-only + merge 策略。文件锁在 CLI 场景下过重，且不适用于多 Agent 并发。

**修复方案**：按 v5 原文实现 append-only + merge 策略，删除文件锁方案。

---

### P2-2: SK-02 design-write 遗漏 data-model.md 和 ADR 交付物

**skill-req 写法**：
- SK-02 输出：`design.md` + `api-contract.yaml`

**v5 原文**（02 Design 阶段活动表）：
- 02 Design 阶段的交付物包括：`design.md`、`contracts/*.yaml`、**`data-model.md`**、**`adr/NNN-*.adr.md`**
- `data-model.md` 是数据模型文档，M/L 规模项目必需
- `adr/` 目录存放架构决策记录，每个重大技术决策一个文件

**修复方案**：SK-02 输出补充 `data-model.md`（M/L 必需，S 可选）和 `adr/*.adr.md`（按需生成）。

---

### P2-3: Skill 全景图缺少 explore Agent 对应 Skill

**skill-req 写法**（§2.4 全景图）：
- 定义了 7 个阶段生产类 Skill（SK-01~07），分别对应 oracle、sisyphus、librarian、do、codeagent-wrapper、默认 Agent、document-writer
- 无 `explore` Agent 对应的 Skill

**v5 原文**（代理路由矩阵 L2422-2441）：
- v5 定义了 **8 个** Agent，其中 `explore` 是代码探索辅助 Agent
- `explore` 在 04 Implement 阶段辅助开发者理解代码结构，不产出交付物但提供上下文

**修复方案**：在 Skill 全景图中补充 `explore` Agent 的映射说明（可作为 SK-05 code-trace 的子能力，或独立为 SK-05b explore）。

---

### P2-4: Feature 目录命名格式与 v5 不符

**skill-req 写法**：
- 全文使用 `specs/<featureId>/` 路径，示例中 featureId 为简写如 `AUTH`
- Context Pack 中 `feature_id: "AUTH"`

**v5 原文**（目录结构 L2243-2286）：
- Feature 工作区路径为 `specs/FSREQ-123456-user-auth/`
- 采用 **飞书需求 ID 格式**：`FSREQ-<6位数字>-<slug>`
- 目录名即 Feature ID，全局唯一

**关键差异**：skill-req 使用简写 `AUTH` 作为 featureId，v5 使用飞书需求 ID 格式 `FSREQ-123456-user-auth`。这影响所有 Skill 的路径拼接逻辑和 ID 生成规则。

**修复方案**：featureId 格式对齐 v5 的飞书需求 ID 格式；所有路径示例更新为 `specs/FSREQ-xxx/` 格式。

---

## 五、修复优先级与影响分析

### 5.1 修复依赖关系

```text
P0-1 Gate 命名体系 ──┐
P0-2 覆盖率阈值 ─────┤
P0-3 指标编号 ────────┤── 影响全文，必须首先修复
P0-5 Context Pack ────┤
P0-6 SCA 检查点 ──────┘
         │
         ▼
P0-4 模板文件名 ──→ P1-3/P1-4/P1-5 各 Skill 输出交付物
         │
         ▼
P1-6 代理路由 ──→ P2-2 design 交付物 + P2-3 explore Agent
         │
         ▼
P1-7 阶段覆盖缺口 ──→ 可能需新增 Skill（SK-08）
```

### 5.2 影响范围汇总

| 问题编号 | 影响的 Skill | 影响的章节 | 修复工作量 |
|---------|------------|----------|----------|
| P0-1 | SK-SYS-02, SK-CHK-01/02, SK-01~07 | §2.5, §3.2~3.4 全部 | 大 — 全文 Gate 引用重写 |
| P0-2 | SK-CHK-02, SK-04, SK-06, SK-07 | §3.3, §3.4 | 中 — 阈值替换 + 补充 5 项指标 |
| P0-3 | SK-CHK-02, SK-04, SK-06, SK-07 | §3.3, §3.4 | 小 — 删除编号，改用名称 |
| P0-4 | SK-FIX-02, 所有阶段生产类 | §3.1, §3.4 | 大 — 重建模板清单 |
| P0-5 | SK-SYS-01, 所有 Skill 输入 | §3.2 | 大 — Schema 完全重写 |
| P0-6 | SK-CHK-01 | §3.3 | 中 — 补充 2 个检查点 |
| P1-1 | SK-SYS-03 | §3.2 | 小 — 步骤重排 |
| P1-2 | SK-SYS-03 | §3.2 | 小 — 文件名修正 |
| P1-3 | SK-04 | §3.4 | 中 — 输出交付物重定义 |
| P1-4 | SK-06 | §3.4 | 中 — 输出交付物重定义 |
| P1-5 | SK-07 | §3.4 | 中 — 输出交付物重定义 |
| P1-6 | §2.1 映射表 | §2.1 | 中 — 全表重写 |
| P1-7 | 新增 SK-08 或扩展 SK-05 | §2.4, §3.4 | 大 — 新增 Skill 定义 |
| P2-1 | SK-SYS-04 | §3.2 | 小 — 策略描述修正 |
| P2-2 | SK-02 | §3.4 | 小 — 补充交付物 |
| P2-3 | §2.4 全景图 | §2.4 | 小 — 补充映射 |
| P2-4 | 全文路径示例 | §3.2~3.4 | 中 — 全文 featureId 格式替换 |

### 5.3 整体评估

**文档质量**：skill-requirements-v1.md 在 Skill 架构设计、执行模型、依赖关系、分期策略等方面具备良好的结构化思维，15 个 Skill 的分类和职责划分合理。技术实现方案（§5）中的 BaseSkill 抽象基类、SkillRunner 调度器、CLI 命令设计等均可直接复用。

**核心问题**：文档在"对齐 v5 规范"这一核心目标上存在系统性偏差。6 项 P0 问题表明作者在编写时未逐条对照 v5 原文，而是基于对 v5 的记忆/理解进行了大量"合理推测"，导致 Gate 体系、覆盖率指标、文件命名、Context Pack Schema、SCA 检查点等关键定义与 v5 原文不符。

**根因分析**：
1. **Gate 简写误用** — v5 覆盖率章节中 "★ Gate 1/2/3" 的简写被误解为独立的 Gate 命名体系
2. **阈值降级** — 可能出于"务实"考虑将 100% 降为 80%/70%，但违反了 v5 的明确定义
3. **文件名臆造** — 未查阅 v5 文件命名规范表（L2209-2229），凭直觉命名
4. **Schema 自造** — Context Pack Schema 未从 v5 原文复制，而是自行设计了一套结构

### 5.4 修复建议

**建议方案：基于现有文档修复，而非重写。**

文档的架构设计（§2）和技术实现方案（§5）质量较高，可直接保留。修复工作集中在§3（Skill 详细定义）中与 v5 不对齐的具体数值和引用。

**修复步骤**：

1. **全局替换**（影响全文）：
   - Gate 命名：删除 "Gate 1/2/3/4"，改为 "XX 阶段 Exit Gate"
   - 覆盖率指标：删除 C1-C9 编号，改用 v5 原文名称
   - featureId 格式：`AUTH` → `FSREQ-123456-user-auth`
   - 文件名：按 v5 L2209-2229 逐一修正

2. **章节重写**（3 个章节）：
   - SK-SYS-01 context-pack：Schema 完全替换为 v5 原文
   - SK-SYS-02 gate-check：4 道 Gate → 8 阶段 Exit Gate
   - SK-CHK-01 sca-gate：3 个检查点 → 5 个检查点

3. **交付物修正**（4 个 Skill）：
   - SK-04：`task_plan.md` → `tasks.md` + `checklist.md`
   - SK-06：`test-plan.md` → `tests/*.test.md` + `reports/`
   - SK-07：`archive-checklist.md` + `release-note.md` → `retro.md`
   - SK-02：补充 `data-model.md` + `adr/*.adr.md`

4. **新增内容**：
   - 补充 SK-08 release-check 或扩展 SK-SYS-02 覆盖 07 Release
   - 补充 explore Agent 映射
   - 覆盖率阈值全部对齐 v5（100%/90%/0%）

---

## 六、结论

**审查结论：不通过。**

skill-requirements-v1.md 在 Skill 架构和技术方案层面设计合理，但在 v5 规范对齐层面存在 **6 项 P0 + 7 项 P1 + 4 项 P2 = 17 项不对齐**，其中 P0 级问题涉及 Gate 体系、覆盖率指标、文件命名、Context Pack Schema、SCA 检查点等核心定义，必须全部修复后方可进入技术方案设计阶段。

**建议**：修复全部 P0 + P1 后提交二审，P2 可在二审中同步修复。

---

> **审查完成** | 共识别 **17 项不对齐**（P0×6 + P1×7 + P2×4）| 建议修复后二审
