# CLI 命令参考

本文档详细说明 spec skill 使用的 CLI 命令。

---

## CLI 硬约束（强制）

### ID 类型

**✅ 使用**:
- `FR` - 功能需求
- `DS` - 设计方案
- `TASK` - 任务
- `TC` - 测试用例
- `REQ` - 需求项（用于 PRD）

**❌ 禁止**:
- `REQ-PRD` - 不存在此类型，应使用 `REQ`

### Matrix 状态

**✅ 使用**:
- `Planned` - 已规划（默认）
- `Implemented` - 已实现
- `Verified` - 已验证
- `Accepted` - 已验收
- `Deferred` - 已延期
- `Cancelled` - 已取消
- `Exception` - 例外处理

**❌ 禁止**:
- `pending` - 应使用 `Planned`
- `InProgress` - 应使用 `Implemented`
- `Completed` - 应使用 `Implemented` 或 `Verified`
- `Blocked` - 应使用 `Deferred`

### 确认策略

- `matrix update` 必须添加 `--yes`（policy=strict）
- 串行执行 matrix 操作，避免并行失败级联

详见 `references/id-types-and-status.md`

---

## 核心命令

### 1. 生成 ID

```bash
spec-first id next FR <abbr> --feature <featureId>
spec-first id next REQ <abbr> --feature <featureId>
```

**参数**:
- `<abbr>`: Feature 缩写（如 AUTH, HOMEPAGE）
- `<featureId>`: Feature ID（如 FSREQ-20260309-AUTH-001）

**示例**:
```bash
spec-first id next FR AUTH --feature FSREQ-20260309-AUTH-001
# 输出: FR-AUTH-001
```

**错误处理**:
1. 检查 Feature 存在性
2. 检查 ABBR 格式（2-4 个大写字母）
3. 重试 1 次
4. 失败则标记 `[CLI_ERROR]` 并请求用户介入

---

### 2. 更新追溯矩阵

```bash
spec-first matrix update <featureId> <id> --title "<title>" --yes
spec-first matrix update <featureId> <id> --status <status> --yes
spec-first matrix update <featureId> <id> --upstream <ids> --yes
spec-first matrix update <featureId> <id> --downstream <ids> --yes
```

**参数**:
- `<featureId>`: Feature ID
- `<id>`: 追溯 ID（如 FR-AUTH-001）
- `--title`: 标题
- `--status`: 状态（Planned/Implemented/Verified/Accepted/Deferred/Cancelled/Exception）
- `--upstream`: 上游依赖 ID（逗号分隔）
- `--downstream`: 下游依赖 ID（逗号分隔）
- `--yes`: 强制确认（必需）

**示例**:
```bash
spec-first matrix update FSREQ-20260309-AUTH-001 FR-AUTH-001 \
  --title "用户登录功能" \
  --status Planned \
  --upstream REQ-AUTH-001,REQ-AUTH-002 \
  --yes
```

**错误处理**:
1. 检查 ID 冲突
2. 使用 `--force` 覆盖（如需要）
3. 重试 1 次
4. 失败则标记 `[CLI_ERROR]` 并请求用户介入

**网络超时处理**:
1. 等待 5 秒重试
2. 最多 3 次
3. 失败则标记 `[CLI_ERROR]` 并请求用户介入

**阻断规则**:
- 不得跳过注册
- 所有 FR 必须成功注册后才能执行 gate check

---

### 3. Gate Check

```bash
spec-first gate check <featureId>
```

**参数**:
- `<featureId>`: Feature ID

**检查项**:
- PRD 存在且 C-PRD ≥ 85%
- spec.md 存在且包含所有 FR/AC
- FR 已注册到追溯矩阵
- spec-review.md 存在（如需要）

**示例**:
```bash
spec-first gate check FSREQ-20260309-AUTH-001
```

**失败处理**:
- C-PRD < 85%: 返回 Phase 0.3 修正 PRD，重新执行 Phase 0.4-0.6
- 缺少文件: 补齐后重新执行 gate check
- FR 未注册: 执行注册后重新执行 gate check
- **不得跳过 gate check 进入下一阶段**

**通过后**:
- 记录 gate check 通过结果到 `findings.md`
- 提示用户："Gate check 通过，可进入 /spec-first:design 或由 /spec-first:orchestrate 执行阶段推进"
- `gate check` 本身只负责校验，不直接推进阶段；阶段推进由 `stage advance` / `orchestrate` 负责

---

### 4. 格式校验

```bash
spec-first validate format <featureId>
```

**参数**:
- `<featureId>`: Feature ID

**检查项**:
- PRD 章节格式（1. 业务目标/2. 功能需求/3. 非功能需求）
- ID 格式（无多余连字符）
- 文件路径完整性
- 必需字段（Feature ID）

**示例**:
```bash
spec-first validate format FSREQ-20260309-AUTH-001
```

**失败处理**:
- 校验失败时阻断
- 需修复后重新确认

---

## 命令执行顺序

在 Step 8 中，命令必须按以下顺序执行：

1. **生成 FR ID**（串行）
   ```bash
   spec-first id next FR <abbr> --feature <featureId>
   ```

2. **注册到矩阵**（串行，每个 FR 一次）
   ```bash
   spec-first matrix update <featureId> <id> --title "标题" --yes
   ```

3. **执行 Gate Check**（阻断门禁）
   ```bash
   spec-first gate check <featureId>
   ```

4. **格式校验**（自动执行）
   ```bash
   spec-first validate format <featureId>
   ```

**注意**: 步骤 1-2 必须全部成功后才能执行步骤 3。
