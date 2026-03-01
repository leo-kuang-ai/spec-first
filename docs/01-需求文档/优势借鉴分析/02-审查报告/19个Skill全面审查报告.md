# Spec-First 19 个 Skill 全面审查报告

> **审查日期**: 2026-02-25 | **版本**: v1.0 | **审查方式**: 多 Agent 并行审查
> **审查范围**: skills/spec-first/ 下全部 19 个 SKILL.md
> **对照标准**: P0 落地清单（四篇整合 v1.2）+ Superpowers 反合理化设计

---

## 执行摘要

### 问题统计总览

| 严重程度 | 数量 | 占比 |
|----------|------|------|
| **Critical** | 4 | 11% |
| **High** | 8 | 22% |
| **Medium** | 14 | 39% |
| **Low** | 11 | 28% |
| **合计** | 37 | 100% |

### 核心发现

| 发现类别 | 状态 | 详情 |
|---------|------|------|
| **A5 Description Trap 巡检** | ✅ 全部通过 | 19 个 Skill 的 description 均符合"触发条件 only"规范 |
| **A2/A3/A4 反合理化守卫** | ❌ 未落地 | 3 个核心 Skill 缺失 P0 要求的约束段落 |
| **阶段-Skill 映射** | ⚠️ 有遗漏 | AGENTS.md 缺少 17-19 Feature 管理 Skill |
| **术语一致性** | ⚠️ 需改进 | AC ID 格式未统一 |
| **验收标准 SMART 性** | ⚠️ 部分缺失 | 缺少时限性（T）标准 |

### 关键结论

1. **P0 落地清单声称的"待落地"确实未落地**：尽管 P0 清单文档已完成，但 A2/A3/A4 三项约束内容均未实际追加到对应的 SKILL.md 文件中。

2. **当前 Skill 更偏"指令式"而非"约束式"**：Skill 告诉 AI 该做什么，但没有预防 AI 不做什么。这与 Superpowers 的反合理化设计理念存在本质差距。

3. **编排层与阶段 Skill 边界需澄清**：plan/orchestrate/verify 三个编排 Skill 的职责存在部分重叠，"按需"触发条件不够明确。

---

## 一、Description Trap 巡检结果（A5）

### 检查标准

description 字段只写触发条件（"定位...并..."），禁止写执行流程、策略摘要、捷径提示。

### 巡检结果：全部通过 ✅

| Skill | description 内容 | 判定 |
|-------|------------------|------|
| 01-init | "定位项目根目录并初始化 Feature 工作区" | PASS |
| 02-catchup | "定位当前 Feature 并恢复上下文" | PASS |
| 03-spec | "定位 Feature 并校验阶段为需求规格（01_specify）" | PASS |
| 04-design | "定位 Feature 并校验阶段为技术设计（02_design）" | PASS |
| 05-research | "定位 Feature 上下文并生成调研结论" | PASS |
| 06-task | "定位 Feature 并校验阶段为任务拆解（03_plan）" | PASS |
| 07-code | "定位进行中的 TASK 并执行代码实现" | PASS |
| 08-code-review | "定位变更范围并执行代码审查" | PASS |
| 09-test | "定位 Feature 并校验阶段为验证测试（05_verify）" | PASS |
| 10-archive | "定位 Feature 并校验阶段为归档复盘（06_wrap_up）" | PASS |
| 11-plan | "定位 Feature 并加载当前阶段计划" | PASS |
| 12-verify | "定位 Feature 并执行阶段验收校验" | PASS |
| 13-orchestrate | "定位 Feature 并加载当前状态执行编排" | PASS |
| 14-status | "定位当前 Feature 并输出状态概览" | PASS |
| 15-doctor | "定位项目与宿主配置并执行环境诊断" | PASS |
| 16-sync | "定位 Feature 并同步追踪矩阵与状态" | PASS |
| 17-feature-list | "列出当前项目全部 Feature" | PASS |
| 18-feature-switch | "切换当前 Feature 上下文（更新 .spec-first/current）" | PASS |
| 19-feature-current | "查看当前 Feature 与阶段信息" | PASS |

**结论**: A5 落地清单项目已完成，无需额外修正。

---

## 二、P0 落地清单对齐检查

### A2 — `/spec-first:code` 反合理化表 + Read/Write 决策矩阵

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 反合理化守卫段落 | ❌ **MISSING** | 未找到 `## 反合理化守卫` 段落 |
| Read/Write 决策矩阵 | ❌ **MISSING** | 未找到 `## 上下文持久化规则` 段落 |
| 系统化调试流程 | ❌ **MISSING** | 未找到 4 阶段调试流程 + 3 次失败规则 |

**严重程度**: **Critical**

**影响**: AI 可能跳过 code-review、TDD、根因分析等关键流程，导致代码质量失控。

---

### A3 — `/spec-first:verify` 证据铁律 + Common Failures 表

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 证据铁律段落 | ❌ **MISSING** | 未找到 `## 证据铁律` 段落 |
| Common Failures 表 | ❌ **MISSING** | 未找到 `## Common Failures 表` 段落 |
| 禁止无证据表述 | ❌ **MISSING** | 未定义禁止词汇列表 |

**严重程度**: **Critical**

**影响**: AI 可能声称阶段通过而不提供验证证据（"应该没问题"、"上一轮通过了"），导致 Gate 可信度不足。

---

### A4 — `/spec-first:spec` 反合理化表

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 反合理化守卫段落 | ❌ **MISSING** | 未找到 `## 反合理化守卫` 段落 |
| NEEDS CLARIFICATION 机制 | ❌ **MISSING** | 未定义歧义标记规则 |

**严重程度**: **Critical**

**影响**: AI 可能对模糊需求做假设而非主动提问，导致需求失真和过度实现。

---

## 三、阶段-Skill 映射审查

### 3.1 8+2 阶段与 Skill 映射总览

| 阶段 | 阶段名称 | 主 Skill | 辅助 Skill | 状态 |
|------|---------|----------|-----------|------|
| 00 | init | 01-init | — | ✅ |
| 01 | specify | 03-spec | — | ✅ |
| 02 | design | 04-design, 05-research | — | ✅ |
| 03 | plan | 06-task | — | ✅ |
| 04 | implement | 07-code, 08-code-review | — | ✅ |
| 05 | verify | 09-test | — | ✅ |
| 06 | wrap_up | 10-archive | — | ✅ |
| 07 | release | —（CLI only） | — | ⚠️ 设计决策 |
| 08 | done | —（终态） | — | ✅ |
| 09 | cancelled | —（终态） | — | ✅ |

### 3.2 AGENTS.md 映射表问题

**问题：辅助 Skill 列表不完整**

AGENTS.md 第 366-377 行的阶段-Skill 映射表中，辅助行缺少：

| 遗漏的 Skill | 说明 |
|-------------|------|
| 17-feature-list | Feature 列表 |
| 18-feature-switch | 切换 Feature |
| 19-feature-current | 当前 Feature |

**修正建议**：在 AGENTS.md 辅助行补充为：

```markdown
| 辅助 | 14-status, 15-doctor, 16-sync, 17-feature-list, 18-feature-switch, 19-feature-current | 状态查询 / 环境诊断 / 矩阵同步 / Feature 管理 |
```

---

## 四、术语一致性检查

### 4.1 阶段 ID 格式

| 位置 | 格式 | 状态 |
|------|------|------|
| 大部分 Skill | 下划线 `01_specify` | ✅ 统一 |
| 部分文档 | 连字符 `01-specify` | ⚠️ 不一致 |

**建议**: 统一使用下划线格式（`01_specify`），与当前 19 个 Skill 保持一致。

### 4.2 ID 命名规范

| 类型 | 格式 | 示例 | 一致性 |
|------|------|------|--------|
| Feature ID | `FSREQ-YYYYMMDD-ABBR-NNN` | `FSREQ-20260209-AUTH-001` | ✅ |
| FR ID | `FR-ABBR-NNN` | `FR-AUTH-001` | ✅ |
| DS ID | `DS-ABBR-NNN` | `DS-AUTH-001` | ✅ |
| TASK ID | `TASK-ABBR-NNN` | `TASK-AUTH-001` | ✅ |
| TC ID | `TC-{LEVEL}-ABBR-NNN` | `TC-IT-AUTH-001` | ✅ |
| AC ID | 未明确 | `AC-1` / `AC-AUTH-001-1` | ❌ **不一致** |

**建议**: 明确 AC ID 格式规范为 `AC-{FR-ABBR}-N`（如 `AC-AUTH-001-1`）或在 FR 上下文内简化为 `AC-N`。

---

## 五、AI 行为约束能力评估

### 5.1 约束强度总评

| Skill | 约束强度 | 核心问题 | P0 对齐状态 |
|-------|----------|----------|-------------|
| 01-init | 中 | 缺少幂等场景详细说明 | — |
| 02-catchup | 中 | 6 步恢复报告格式未详细说明 | — |
| 03-spec | **弱** | 无反合理化守卫、无歧义消解机制 | ❌ 未对齐 A4 |
| 04-design | 中 | P5 检查顺序和失败处理不明确 | — |
| 05-research | 弱 | 触发条件模糊、成功标准与确认策略冲突 | — |
| 06-task | 中 | Status 枚举值未说明 | — |
| 07-code | **弱** | 无反合理化守卫、无 Read/Write 矩阵、无调试流程 | ❌ 未对齐 A2 |
| 08-code-review | 中 | 有四维度框架但无两阶段审查、无反合理化守卫 | — |
| 09-test | 中 | level 缩写未解释 | — |
| 10-archive | 中 | 归档标准过于简单 | — |
| 11-plan | 弱 | 与 orchestrate 功能重叠、边界不清 | — |
| 12-verify | **弱** | 无证据铁律、无 Common Failures 表 | ❌ 未对齐 A3 |
| 13-orchestrate | 中 | 有调度协议但无批量检查点、无反合理化守卫 | — |
| 14-status | 强 | — | ✅ |
| 15-doctor | 中 | MCP 与其他 Skill 依赖未说明 | — |
| 16-sync | 中 | 审计日志描述不一致 | — |
| 17-feature-list | 中 | 输出格式未验证 | — |
| 18-feature-switch | 强 | — | ✅ |
| 19-feature-current | 中 | 两步定位顺序未明确 | — |

### 5.2 与 Superpowers 的差距

| Superpowers 机制 | 当前状态 | 差距 |
|-----------------|----------|------|
| 反合理化设计（Red Flags 表） | 3 个核心 Skill 完全缺失 | 需追加约 30 行表格 |
| 证据铁律（Iron Law） | verify skill 完全缺失 | 需追加约 15 行 |
| 两阶段审查（Compliance → Quality） | code-review 无分层审查 | 需追加约 20 行 |
| 批量检查点（Batch + Checkpoint） | orchestrate 无批次暂停机制 | 需追加约 15 行 |
| 系统化调试（4 阶段 + 3 次失败） | code skill 无调试流程 | 需追加约 20 行 |

---

## 六、详细问题清单

### Critical 级别（4 个）

| # | Skill | 问题描述 | 来源 |
|---|-------|----------|------|
| C1 | 07-code | 缺失 `## 反合理化守卫` 段落（A2 要求） | P0 落地清单 |
| C2 | 07-code | 缺失 `## 上下文持久化规则` 段落（A2 要求） | P0 落地清单 |
| C3 | 07-code | 缺失系统化调试流程（SP §7 要求） | Superpowers §7 |
| C4 | 12-verify | 缺失 `## 证据铁律` + `## Common Failures 表`（A3 要求） | P0 落地清单 |
| C5 | 03-spec | 缺失 `## 反合理化守卫` + NEEDS CLARIFICATION 机制（A4 要求） | P0 落地清单 |

### High 级别（8 个）

| # | Skill | 问题描述 |
|---|-------|----------|
| H1 | 07-code | P3 diff 预览格式和内容要求不明确 |
| H2 | 08-code-review | 审查清单路径 `references/` 来源未说明（项目根？specs？） |
| H3 | 12-verify | 成功标准"若所有条件满足"过于模糊，缺少量化条件 |
| H4 | 13-orchestrate | Skill 编号（03-spec）与阶段编号（01_specify）不一致，可能混淆 |
| H5 | 03-spec | 确认策略复杂（strict/auto/assisted）但未提供选择决策树 |
| H6 | 11-plan | 编排规则"根据当前阶段调度对应 Skill"与 orchestrate 功能重叠 |
| H7 | 08-code-review | 4 维度审查顺序未定义（SOLID/安全/性能/测试） |
| H8 | 13-orchestrate | 缺少批量检查点机制（Superpowers §3 要求） |

### Medium 级别（14 个）

| # | Skill | 问题描述 |
|---|-------|----------|
| M1 | 01-init | 参数约束正则允许 16 字符，但示例与边界相差较远 |
| M2 | 01-init | P5 分号用法导致歧义（hooks/AI hooks/Skill 命令状态） |
| M3 | 02-catchup | 6 步恢复报告具体内容未详细说明 |
| M4 | 04-design | P5 两项检查顺序和失败处理策略不明确 |
| M5 | 05-research | 成功标准与确认策略可能冲突 |
| M6 | 06-task | 示例表格包含 Owner 但执行阶段未说明 |
| M7 | 09-test | CLI 依赖 `--level <UT\|IT\|E2E\|ST>` 缩写未解释 |
| M8 | 10-archive | 归档标准"超 500 行"过于简单，可能误判 |
| M9 | 13-orchestrate | 缺少反合理化守卫（可能跳过检查点） |
| M10 | 16-sync | P5 描述与成功标准表述不一致 |
| M11 | 15-doctor | MCP 必检列表含 `playwright-mcp` 但未在其他 Skill 引用 |
| M12 | AGENTS.md | 辅助 Skill 列表缺少 17-19 |
| M13 | spec-first-v7.md | Skill ID 命名与实际目录不一致 |
| M14 | 08-code-review | 缺少两阶段审查协议（Superpowers §4） |

### Low 级别（11 个）

| # | Skill | 问题描述 |
|---|-------|----------|
| L1 | 01-init | 成功标准"幂等场景"描述过长 |
| L2 | 02-catchup | 触发条件"任意"但逻辑需先有 Feature |
| L3 | 03-spec | AC ID 格式与 FR ID 不统一 |
| L4 | 04-design | CLI 命令 `abbr` 参数说明缺失 |
| L5 | 05-research | P1 加载 constitution.md 修改是否回写不明确 |
| L6 | 06-task | Status 枚举值未说明 |
| L7 | 08-code-review | 缺少反合理化守卫 |
| L8 | 10-archive | P5 描述推进至 07_release 但成功标准未检查 |
| L9 | 14-status | CLI 依赖与 P0 定位逻辑重复 |
| L10 | 17-feature-list | 输出格式未验证 |
| L11 | 19-feature-current | 两步定位顺序未明确 |

---

## 七、需要追加的内容草案

### 7.1 `/spec-first:code` (07-code/SKILL.md) 追加内容

**位置**：在 `## 示例（P2 输出格式）` 之前追加

```markdown
## 反合理化守卫

当你产生以下念头时，立即停止并回到流程：

| AI 的借口 | 封堵 |
|-----------|------|
| "这个改动太小，不需要走 code-review" | 小改动也有回归风险，review 耗时 < 2 分钟 |
| "我已经手动检查过了" | 手动检查 ≠ 自动校验证据 |
| "先写完再补测试" | 事后测试证明不了什么，TDD 先行 |
| "这只是重构，不影响功能" | 重构不改行为 ≠ 重构不引入 bug |
| "快速修一下，之后再调查" | 快速修复掩盖根因，系统化调试更快 [SP §7] |
| "我看到问题了，让我直接修" | 看到症状 ≠ 理解根因 [SP §7] |
| "同时改多处，一起测试" | 无法隔离哪个改动有效，会引入新 bug [SP §7] |
| "再试一次修复"（已失败 2+ 次） | 3 次失败 = 架构问题，停止修复，质疑设计 [SP §7] |
| "我记得刚才看到的内容" | 上下文会被压缩，记忆不可靠，写入文件 |

## 上下文持久化规则

Context Window = RAM（易失、有限），Filesystem = Disk（持久、无限）。
任何重要的东西都写入磁盘。

| 场景 | 动作 | 原因 |
|------|------|------|
| 刚写完一个文件 | 不要读 | 内容还在上下文中 |
| 查看了图片/PDF/网页 | 立即写 findings.md | 多模态内容压缩时丢失 |
| 浏览器/MCP 返回数据 | 写入文件 | 外部数据不持久 |
| 开始新 TASK | 读 task_plan.md + findings.md | 重新定向上下文 |
| 发生错误 | 读相关文件 | 需要当前状态来修复 |
| 间隔后恢复 | 读所有运行态文件 | 恢复状态 |

压缩必须可恢复：即使丢弃了内容，也要保留 URL / 文件路径 / ID 指针。

## 调试流程（测试失败时）

铁律：NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST

| 阶段 | 关键活动 | 成功标准 |
|------|---------|---------|
| 1. 根因调查 | 读错误信息、复现、检查近期变更、追踪数据流 | 理解 WHAT 和 WHY |
| 2. 模式分析 | 找到工作的类似代码、对比差异 | 识别差异点 |
| 3. 假设验证 | 形成单一假设、最小化测试、一次只改一个变量 | 假设确认或新假设 |
| 4. 实现修复 | 创建失败测试、实现单一修复、验证 | Bug 解决、测试通过 |

硬规则：3 次修复失败 → 停止修复，质疑架构，向人类报告
```

---

### 7.2 `/spec-first:verify` (12-verify/SKILL.md) 追加内容

**位置**：在 `## 编排规则` 之前追加

```markdown
## 证据铁律

铁律：声称任何阶段通过前，必须提供新鲜的验证证据。

五步 Gate Function：
1. **IDENTIFY** — 什么命令能证明这个声明？
2. **RUN** — 执行完整命令（新鲜的、完整的）
3. **READ** — 完整输出，检查退出码，计数失败项
4. **VERIFY** — 输出是否确认了声明？
5. **ONLY THEN** — 发出声明

禁止使用的表述：
- "should pass" / "looks good" / "已完成" / "我检查过了"
- "应该没问题" / "上一轮通过了" / "差不多了"

## Common Failures 表

| 声明 | 需要的证据 | 不充分的证据 |
|------|-----------|-------------|
| Gate 通过 | `spec-first gate check <featureId>` 输出: PASS | "我检查过了"、"应该没问题" |
| 覆盖率达标 | `spec-first metrics coverage <featureId>` 输出: C1-C9 ≥ 阈值 | "所有 FR 都有对应 TASK" |
| 阶段可推进 | `spec-first gate check <featureId>` 输出 PASS + `spec-first matrix check <featureId>` 退出码 0 | "上一轮通过了" |
| TASK 完成 | 测试命令输出 + code-review 通过 | "代码写完了" |
| Feature 可归档 | `spec-first gate check <featureId>` + `spec-first matrix check <featureId>` + 归档产物证据 | "所有 TASK 都标记完成了" |

## 判定证据链要求

Gate 输出必须展示"判定证据链"：
- 失败条目映射到具体 ID
- 每个失败条目附带修复建议
```

---

### 7.3 `/spec-first:spec` (03-spec/SKILL.md) 追加内容

**位置**：在 `## 示例（P2 输出格式）` 之前追加

```markdown
## 反合理化守卫

当你产生以下念头时，立即停止并回到流程：

| AI 的借口 | 封堵 |
|-----------|------|
| "需求很清楚，不需要澄清" | 你认为清楚 ≠ 无歧义，检查 NEEDS CLARIFICATION 项 |
| "AC 用自然语言就够了" | 自然语言 AC 无法自动转化为测试用例 |
| "这个 NFR 不重要，先跳过" | 跳过 NFR = 埋下技术债，至少标记为 P2 |
| "用户没提到边界情况" | 用户不提 ≠ 不存在，主动识别是 spec 的职责 |
| "先写个大概，后面再细化" | 模糊的 spec 生成模糊的 design，越晚修正成本越高 |
| "这个需求和上次项目一样" | 上下文不同，假设一样 = 埋雷 |

## 歧义消解机制

当识别到以下歧义时，必须标记 `[NEEDS CLARIFICATION]`：

- 边界值不明确（如"大量用户"是多少？）
- 异常处理未定义（如"网络失败时怎么办？"）
- 优先级冲突（如"快速"vs"安全"）
- 多种可能理解（如"优化登录"是速度还是体验？）
- 依赖外部系统但接口未定义

标记格式：
```
[NEEDS CLARIFICATION] FR-AUTH-001: 短信有效期是多久？5 分钟还是 10 分钟？
```
```

---

### 7.4 `/spec-first:code-review` (08-code-review/SKILL.md) 追加内容

**位置**：在审查维度之前追加

```markdown
## 两阶段审查协议

审查分两轮，Stage 1 不通过不进入 Stage 2：

### Stage 1: 规格合规审查
- 独立读取实际代码（不信任实现者报告）
- 对照 spec.md + task_plan.md 的 AC，逐条校验：
  - 是否匹配规格？
  - 是否多做了？
  - 是否少做了？
- 不通过 → 返回 07-code 修复 → 重新审查

### Stage 2: 代码质量审查
仅在 Stage 1 通过后执行：
- SOLID 原则
- 安全性
- 性能
- 测试覆盖
```

---

### 7.5 `/spec-first:orchestrate` (13-orchestrate/SKILL.md) 追加内容

**位置**：在调度协议之后追加

```markdown
## 批量检查点机制

根据 Feature Size 设定批次策略：

| Size | 批次大小 | 暂停规则 |
|------|----------|----------|
| S | 2-3 个 TASK | 每 2-3 个 TASK 暂停报告 |
| M | 2 个 TASK | 每 2 个 TASK 暂停报告 |
| L | 1 个 TASK | 每个 TASK 暂停报告 |

每次暂停输出：
- 已完成 TASK 列表
- 验证结果
- 覆盖率变化
- 下一批次预览

## 阻塞处理规则

遇到以下情况立即停止，不猜测，不强行推进：
- 缺少依赖 → 停止，报告缺少什么
- 测试反复失败 → 停止，建议进入 systematic-debugging
- 指令不清 → 停止，请求澄清
```

---

## 八、改进建议优先级排序

### P0 立即修复（阻塞 P0 落地清单）

| 优先级 | 任务 | 涉及文件 | 预估工作量 |
|--------|------|----------|------------|
| P0-1 | 追加反合理化守卫 + 上下文持久化规则 + 调试流程 | 07-code/SKILL.md | 0.5 天 |
| P0-2 | 追加证据铁律 + Common Failures 表 | 12-verify/SKILL.md | 0.5 天 |
| P0-3 | 追加反合理化守卫 + 歧义消解机制 | 03-spec/SKILL.md | 0.5 天 |

### P1 短期修复（1 周内）

| 优先级 | 任务 | 涉及文件 | 预估工作量 |
|--------|------|----------|------------|
| P1-1 | 明确 code-review 清单路径来源 | 08-code-review/SKILL.md | 0.5h |
| P1-2 | 量化 verify 成功标准条件 | 12-verify/SKILL.md | 0.5h |
| P1-3 | 补充 spec 确认策略决策树 | 03-spec/SKILL.md | 1h |
| P1-4 | 更新 AGENTS.md 辅助 Skill 列表（补充 17-19） | AGENTS.md | 0.5h |
| P1-5 | 追加 code-review 两阶段审查协议 | 08-code-review/SKILL.md | 0.5h |
| P1-6 | 追加 orchestrate 批量检查点机制 | 13-orchestrate/SKILL.md | 0.5h |

### P2 中期优化（2 周内）

| 优先级 | 任务 | 涉及文件 | 预估工作量 |
|--------|------|----------|------------|
| P2-1 | 补充 catchup 6 步恢复报告详细格式 | 02-catchup/SKILL.md | 0.5h |
| P2-2 | 明确 design P5 检查顺序和失败处理 | 04-design/SKILL.md | 0.5h |
| P2-3 | 补充 test level 缩写说明 | 09-test/SKILL.md | 0.5h |
| P2-4 | 优化 archive 归档标准（行数 + 内容类型） | 10-archive/SKILL.md | 1h |
| P2-5 | 明确 plan 与 orchestrate 边界 | 11-plan/SKILL.md | 1h |
| P2-6 | 统一 AC ID 格式规范 | 全局 | 2h |

### P3 长期优化（1 月内）

| 优先级 | 任务 | 涉及文件 | 预估工作量 |
|--------|------|----------|------------|
| P3-1 | 补充 Skill 执行时限标准 | 全部 19 个 SKILL.md | 2h |
| P3-2 | 明确 research 触发条件 | 05-research/SKILL.md | 0.5h |
| P3-3 | 补充 doctor MCP 与其他 Skill 的依赖说明 | 15-doctor/SKILL.md | 0.5h |
| P3-4 | 对齐 spec-first-v7.md 中的 Skill ID 命名 | spec-first-v7.md | 1h |

---

## 九、验收标准

### P0 落地验收

| 行动项 | 验收标准 |
|--------|---------|
| P0-1 (code) | AI 遵循完整流程（code-review、TDD、根因分析后再修复），可通过抽查至少 5 次 code skill 执行记录验证 |
| P0-2 (verify) | AI 在声称 Gate 通过时必须贴出 `spec-first gate check` 的完整输出 |
| P0-3 (spec) | AI 主动标记 `[NEEDS CLARIFICATION]` 项并完成 AC 结构化，可通过抽查至少 5 次 spec skill 执行记录验证 |

### 整体质量验收

| 维度 | 目标 |
|------|------|
| Front Matter 规范性 | 19 个 Skill description 100% 符合"触发条件 only" |
| P0 对齐完成度 | A2/A3/A4 三项 100% 追加完成 |
| 术语一致性 | 阶段 ID、ID 命名规范 100% 统一 |
| 验收标准 SMART 性 | 全部 Skill 包含具体、可衡量的成功标准 |

---

## 十、总结

### 整体评估

| 维度 | 评分 | 说明 |
|------|------|------|
| Front Matter 规范性 | **优秀** | A5 Description Trap 全部通过 |
| 内容完整性 | **良好** | P0-P5 执行阶段完整，但缺少 P0 落地清单要求的约束段落 |
| P0 落地清单对齐 | **不足** | A2/A3/A4 三项 Critical 缺失 |
| 术语一致性 | **良好** | 阶段 ID 统一，AC ID 格式需明确 |
| 依赖关系 | **良好** | 依赖清晰，但部分"按需"触发条件模糊 |
| 验收标准 SMART 性 | **良好** | 大部分 SMART，缺少时限性 |

### 关键行动项

1. **立即执行 P0-1/P0-2/P0-3**: 追加反合理化守卫、证据铁律、上下文持久化规则（总计 1.5 天）
2. **短期完成 P1-1 至 P1-6**: 明确路径、量化条件、更新 AGENTS.md、追加两阶段审查和批量检查点（总计 3.5h）
3. **中期优化 P2-1 至 P2-6**: 补充详细格式、处理策略、术语统一（总计 5.5h）
4. **长期完善 P3-1 至 P3-4**: 时限标准、触发条件、依赖说明、命名对齐（总计 4h）

### 风险提示

- **P0 缺失风险**: 若不追加 A2/A3/A4 约束段落，AI 可能绕过流程、声称无证据的通过
- **术语不一致风险**: AC ID 格式未统一可能导致矩阵关联错误
- **依赖模糊风险**: "按需"触发的 Skill（research/code-review）可能导致执行不一致

---

> **报告状态**: 完成 | **下一步**: 执行 P0 落地清单 A2/A3/A4 追加任务
> **文档版本**: v1.0 | **日期**: 2026-02-25
