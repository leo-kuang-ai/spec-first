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

### 文档关联索引

**原则**:
- 文档关联由 `document-links.yaml` 记录
- 关联校验优先于手工维护
- 不在 CLI 中维护矩阵状态值

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

### 2. 查看文档关联

```bash
spec-first docs links show <featureId>
```

**参数**:
- `<featureId>`: Feature ID

**用途**:
- 查看当前 feature 的文档引用关系
- 输出 `document-links.yaml` 的可读视图

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
- document-links.yaml 中的引用可解析
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

2. **查看文档关联**（如需要）
   ```bash
   spec-first docs links show <featureId>
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
