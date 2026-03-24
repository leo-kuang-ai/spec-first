# Catchup Report Template

上下文恢复报告标准格式。

## 6 步报告结构

```markdown
# Context Recovery Report

生成时间: {timestamp}

---

## 1️⃣ Feature 基本信息

| 字段 | 值 |
|------|-----|
| **Feature ID** | {featureId} |
| **标题** | {title} |
| **当前阶段** | {stage} ({stage_name}) |
| **阶段状态** | {stage_status} (in_progress/completed) |
| **停留时间** | {duration} |
| **最后更新** | {last_updated} |

---

## 2️⃣ 任务进度

### 当前任务

| Task ID | 标题 | 状态 | Owner | 预计工期 |
|---------|------|------|-------|----------|
| {task_id} | {title} | in_progress | {owner} | {duration} |

**验收标准**:
- [ ] {acceptance_criterion_1}
- [ ] {acceptance_criterion_2}

### 任务统计

| 状态 | 数量 | 占比 |
|------|------|------|
| ✅ done | {count} | {percentage}% |
| 🔄 in_progress | {count} | {percentage}% |
| ⏸️ todo | {count} | {percentage}% |
| 🚫 blocked | {count} | {percentage}% |

**总任务数**: {total}
**完成率**: {completion_rate}%

---

## 3️⃣ 最近发现

从 `findings.md` 提取的最近 3-5 条关键发现：

### {timestamp_1}
{finding_1}

### {timestamp_2}
{finding_2}

### {timestamp_3}
{finding_3}

---

## 4️⃣ 文件完整性检查

| 文件 | 状态 | 最后更新 | 说明 |
|------|------|----------|------|
| spec.md | ✅ 存在 | {date} | 需求规格 |
| design.md | ✅ 存在 | {date} | 技术设计 |
| task_plan.md | ⚠️ 过期 | {date} (> 7 天) | 需要更新 |
| findings.md | ✅ 存在 | {date} | 发现记录 |
| document-links.yaml | ✅ 存在 | {date} | 文档关联索引 |

---

## 5️⃣ 风险识别

### 🔴 高风险 ({count})

{如无高风险，显示"无"}

{如有高风险，按以下格式列出：}
1. **{risk_title}** — {risk_description}
   - 影响: {impact}
   - 建议: {recommendation}

### 🟡 中风险 ({count})

{格式同上}

---

## 6️⃣ 建议下一步

基于当前状态，建议：

1. **{action_1}** — {description_1}
   - 命令: `{command_1}`
   - 预期: {expected_output_1}

2. **{action_2}** — {description_2}
   - 命令: `{command_2}`
   - 预期: {expected_output_2}

**最小可执行命令**: `{next_command}`
```

---

## 5-Question Reboot Test

### Q1: 当前 Feature 与阶段是什么？

```
✅ 已回答
Feature: {featureId} - {title}
阶段: {stage} ({stage_name})
状态: {stage_status}
```

或

```
❌ 无法回答
原因: {reason}
补齐方案: {solution}
```

### Q2: 当前 in_progress TASK 是什么？

```
✅ 已回答
TASK-{ID}: {title}
Owner: {owner}
预计工期: {duration}
验收标准:
- {criterion_1}
- {criterion_2}
```

或

```
⚠️ 无进行中任务
建议: 从 task_plan.md 选择下一个 planned 任务
候选任务:
- TASK-{ID}: {title}
```

### Q3: 上次中断前最后一个有效结论是什么？

```
✅ 已回答
时间: {timestamp}
结论: {conclusion}
证据: {evidence_path}
```

或

```
❌ 无法回答
原因: findings.md 为空或无最近记录
补齐方案: 执行 `/spec-first:status` 获取当前状态
```

### Q4: 当前最大阻塞是什么？

```
✅ 已识别
阻塞类型: {type}
描述: {description}
影响: {impact}
解除方案: {solution}
```

或

```
✅ 无阻塞
可继续工作
```

### Q5: 下一步最小可执行命令是什么？

```
✅ 已明确
命令: {command}
目的: {purpose}
预期输出: {expected_output}
```

---

## 示例：完整恢复报告

```markdown
# Context Recovery Report

生成时间: 2026-03-05T10:30:00Z

---

## 1️⃣ Feature 基本信息

| 字段 | 值 |
|------|-----|
| **Feature ID** | FSREQ-20260305-AUTH-001 |
| **标题** | 短信验证码登录 |
| **当前阶段** | 04_implement (代码实现) |
| **阶段状态** | in_progress |
| **停留时间** | 2 天 |
| **最后更新** | 2026-03-05T08:00:00Z |

---

## 2️⃣ 任务进度

### 当前任务

| Task ID | 标题 | 状态 | Owner | 预计工期 |
|---------|------|------|-------|----------|
| TASK-AUTH-003 | 验证码登录 API | in_progress | BE | 1d |

**验收标准**:
- [ ] API 可调用，返回 JWT token
- [ ] 正确处理验证码过期
- [ ] 单元测试覆盖率 > 80%

### 任务统计

| 状态 | 数量 | 占比 |
|------|------|------|
| ✅ done | 6 | 60% |
| 🔄 in_progress | 2 | 20% |
| ⏸️ todo | 2 | 20% |
| 🚫 blocked | 0 | 0% |

**总任务数**: 10
**完成率**: 60%

---

## 3️⃣ 最近发现

### 2026-03-05T08:00:00Z
完成 TASK-AUTH-002 (发送验证码 API)，测试通过，已提交代码。

### 2026-03-04T16:30:00Z
发现验证码过期时间需要从 5 分钟调整为 10 分钟，已更新 design.md。

### 2026-03-04T14:00:00Z
开始实现 TASK-AUTH-003，创建 `src/api/auth/login.ts`。

---

## 4️⃣ 文件完整性检查

| 文件 | 状态 | 最后更新 | 说明 |
|------|------|----------|------|
| spec.md | ✅ 存在 | 2026-03-01 | 需求规格 |
| design.md | ✅ 存在 | 2026-03-04 | 技术设计 |
| task_plan.md | ✅ 存在 | 2026-03-05 | 任务计划 |
| findings.md | ✅ 存在 | 2026-03-05 | 发现记录 |
| document-links.yaml | ✅ 存在 | 2026-03-05 | 文档关联索引 |

---

## 5️⃣ 风险识别

### 🔴 高风险 (0)
无

### 🟡 中风险 (1)
1. **任务进度略慢** — 预计剩余 1 天，可能延期 0.5 天
   - 影响: 轻微延期
   - 建议: 评估是否需要资源支持

---

## 6️⃣ 建议下一步

基于当前状态，建议：

1. **继续实现 TASK-AUTH-003** — 完成验证码登录 API
   - 命令: `/spec-first:code`
   - 预期: 实现 login 端点，通过单元测试

2. **验证实现** — 运行测试确保功能正确
   - 命令: `npm test src/api/auth/login.test.ts`
   - 预期: 所有测试通过

**最小可执行命令**: `/spec-first:code`
```

---

## 5-Question Reboot Test 回答

### Q1: 当前 Feature 与阶段是什么？

```
✅ 已回答
Feature: FSREQ-20260305-AUTH-001 - 短信验证码登录
阶段: 04_implement (代码实现)
状态: in_progress
```

### Q2: 当前 in_progress TASK 是什么？

```
✅ 已回答
TASK-AUTH-003: 验证码登录 API
Owner: BE
预计工期: 1d
验收标准:
- API 可调用，返回 JWT token
- 正确处理验证码过期
- 单元测试覆盖率 > 80%
```

### Q3: 上次中断前最后一个有效结论是什么？

```
✅ 已回答
时间: 2026-03-05T08:00:00Z
结论: 完成 TASK-AUTH-002 (发送验证码 API)，测试通过，已提交代码
证据: specs/FSREQ-20260305-AUTH-001/findings.md:45-50
```

### Q4: 当前最大阻塞是什么？

```
✅ 无阻塞
可继续工作
```

### Q5: 下一步最小可执行命令是什么？

```
✅ 已明确
命令: /spec-first:code
目的: 继续实现 TASK-AUTH-003 (验证码登录 API)
预期输出: 实现 login 端点，通过单元测试
```
