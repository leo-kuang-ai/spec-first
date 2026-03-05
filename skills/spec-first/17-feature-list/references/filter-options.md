# 过滤选项

> Feature-List Skill 的过滤与筛选规则

---

## 基础过滤

### 按阶段过滤

**命令格式**:
```bash
spec-first feature list --stage={stage}
```

**支持的阶段**:
- `init` - 初始化
- `specify` - 需求规格
- `design` - 技术设计
- `plan` - 任务拆解
- `implement` - 代码实现
- `verify` - 验证测试
- `wrap_up` - 归档复盘
- `release` - 发布上线
- `done` - 已完成
- `cancelled` - 已取消

**示例**:
```bash
# 列出所有处于代码实现阶段的 Feature
spec-first feature list --stage=implement

# 列出所有已完成的 Feature
spec-first feature list --stage=done
```

---

### 按状态过滤

**命令格式**:
```bash
spec-first feature list --status={status}
```

**支持的状态**:
- `active` - 活跃（00-07 阶段）
- `terminal` - 终态（08-09 阶段）
- `done` - 已完成（08）
- `cancelled` - 已取消（09）

**示例**:
```bash
# 列出所有活跃的 Feature
spec-first feature list --status=active

# 列出所有终态的 Feature
spec-first feature list --status=terminal
```

---

### 按日期过滤

**命令格式**:
```bash
spec-first feature list --since={date}
spec-first feature list --until={date}
spec-first feature list --date-range={start}..{end}
```

**日期格式**: `YYYY-MM-DD`

**示例**:
```bash
# 列出 2026-03-01 之后创建的 Feature
spec-first feature list --since=2026-03-01

# 列出 2026-03-05 之前创建的 Feature
spec-first feature list --until=2026-03-05

# 列出指定日期范围内的 Feature
spec-first feature list --date-range=2026-03-01..2026-03-05
```

---

## 组合过滤

**多条件 AND**:
```bash
# 列出处于代码实现阶段且在 3 月创建的 Feature
spec-first feature list --stage=implement --since=2026-03-01
```

**多条件 OR**:
```bash
# 列出已完成或已取消的 Feature
spec-first feature list --status=done,cancelled
```

---

## 排序选项

**命令格式**:
```bash
spec-first feature list --sort={field} --order={asc|desc}
```

**支持的排序字段**:
- `id` - Feature ID
- `created` - 创建时间
- `updated` - 更新时间
- `stage` - 阶段
- `title` - 标题

**排序方向**:
- `asc` - 升序
- `desc` - 降序（默认）

**示例**:
```bash
# 按创建时间升序
spec-first feature list --sort=created --order=asc

# 按阶段排序
spec-first feature list --sort=stage
```

---

## 输出格式选项

**命令格式**:
```bash
spec-first feature list --format={format}
```

**支持的格式**:
- `table` - 表格（默认）
- `compact` - 紧凑列表
- `json` - JSON 格式
- `csv` - CSV 格式

**示例**:
```bash
# 紧凑格式
spec-first feature list --format=compact

# JSON 格式（用于脚本）
spec-first feature list --format=json
```

---

## 分组选项

**命令格式**:
```bash
spec-first feature list --group-by={field}
```

**支持的分组字段**:
- `status` - 按状态分组
- `stage` - 按阶段分组
- `date` - 按日期分组

**示例**:
```bash
# 按状态分组
spec-first feature list --group-by=status

# 按阶段分组
spec-first feature list --group-by=stage
```

---

## 限制数量

**命令格式**:
```bash
spec-first feature list --limit={n}
```

**示例**:
```bash
# 只显示最近 5 个 Feature
spec-first feature list --limit=5
```

---

## 搜索选项

**命令格式**:
```bash
spec-first feature list --search={keyword}
```

**搜索范围**:
- Feature ID
- 标题
- 描述

**示例**:
```bash
# 搜索包含 "优化" 的 Feature
spec-first feature list --search=优化

# 搜索特定 ID 模式
spec-first feature list --search=FEAT-202603
```

---

## 完整示例

```bash
# 列出 3 月份处于活跃状态的 Feature，按更新时间排序，只显示前 10 个
spec-first feature list \
  --since=2026-03-01 \
  --status=active \
  --sort=updated \
  --order=desc \
  --limit=10

# 搜索包含 "API" 的已完成 Feature，以紧凑格式输出
spec-first feature list \
  --search=API \
  --status=done \
  --format=compact
```
