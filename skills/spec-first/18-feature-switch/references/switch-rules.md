# 切换规则

> Feature-Switch Skill 的 Feature ID 解析与切换规则

---

## Feature ID 解析规则

### 1. 精确匹配

**输入**: 完整的 Feature ID

**示例**:
```bash
spec-first feature switch FEAT-20260305-001
```

**规则**:
- 直接匹配完整 ID
- 大小写敏感
- 优先级最高

---

### 2. 前缀匹配

**输入**: Feature ID 前缀

**示例**:
```bash
# 匹配 FEAT-20260305-001
spec-first feature switch FEAT-20260305

# 匹配 FEAT-20260305-001
spec-first feature switch FEAT-2026
```

**规则**:
- 匹配以输入开头的 Feature ID
- 如有多个匹配，提示用户选择
- 优先级：中

---

### 3. 模糊匹配

**输入**: 部分关键字

**示例**:
```bash
# 匹配包含 "001" 的 Feature
spec-first feature switch 001

# 匹配包含 "0305" 的 Feature
spec-first feature switch 0305
```

**规则**:
- 匹配包含关键字的 Feature ID
- 如有多个匹配，按更新时间排序
- 优先级：低

---

### 4. 相对引用

**输入**: 相对位置

**示例**:
```bash
# 切换到上一个 Feature
spec-first feature switch prev

# 切换到下一个 Feature
spec-first feature switch next

# 切换到最新的 Feature
spec-first feature switch latest
```

**支持的相对引用**:
- `prev` / `previous` - 上一个
- `next` - 下一个
- `latest` / `last` - 最新的
- `first` - 最早的

---

## 多匹配处理

### 场景：多个 Feature 匹配

**示例输入**:
```bash
spec-first feature switch 001
```

**匹配结果**:
- FEAT-20260305-001
- FEAT-20260304-001
- FEAT-20260303-001

**处理流程**:
1. 展示所有匹配项
2. 提示用户选择
3. 等待用户确认

**输出格式**:
```
⚠️  找到 3 个匹配的 Feature

1. FEAT-20260305-001 | Skill 优化 | 💻 代码实现 | 2026-03-05
2. FEAT-20260304-001 | 文档补充 | ✔️ 已完成 | 2026-03-04
3. FEAT-20260303-001 | API 重构 | 📝 需求规格 | 2026-03-03

请选择要切换的 Feature [1-3]:
```

---

## 切换前检查

### 1. 未提交变更检查

**检查项**: Git 工作区状态

**规则**:
- 如有未提交变更，警告用户
- 提示是否继续切换

**警告消息**:
```
⚠️  检测到未提交的变更

当前 Feature: FEAT-20260305-001
未提交文件: 5 个

是否继续切换？[y/N]
```

---

### 2. 目标 Feature 存在性检查

**检查项**: 目标 Feature 是否存在

**规则**:
- 如不存在，报错并退出
- 提示可用的 Feature 列表

**错误消息**:
```
❌ Feature 不存在: FEAT-20260399-999

可用的 Feature:
- FEAT-20260305-001
- FEAT-20260304-002
- FEAT-20260303-003

提示: 使用 /spec-first:feature-list 查看所有 Feature
```

---

## 切换后操作

### 1. 更新 current 文件

**文件路径**: `.spec-first/current`

**内容格式**:
```
FEAT-20260305-001
```

**操作**:
- 覆盖写入目标 Feature ID
- 确保文件以换行符结尾

---

### 2. 验证切换结果

**验证步骤**:
1. 读取 `.spec-first/current`
2. 确认内容为目标 Feature ID
3. 查询目标 Feature 的当前阶段

---

### 3. 输出切换结果

**成功消息**:
```
✅ 已切换到: FEAT-20260305-001

Feature: Skill 优化
阶段: 💻 代码实现 (04_implement)
更新时间: 2026-03-05

💡 提示: 使用 /spec-first:status 查看详细状态
```

---

## 错误处理

### 无匹配 Feature

**错误消息**:
```
❌ 未找到匹配的 Feature: {input}

提示:
- 检查 Feature ID 是否正确
- 使用 /spec-first:feature-list 查看所有 Feature
- 使用完整的 Feature ID 进行切换
```

---

### 文件写入失败

**错误消息**:
```
❌ 切换失败: 无法写入 .spec-first/current

错误详情: {error_message}

建议操作:
- 检查 .spec-first/ 目录权限
- 确保磁盘空间充足
```

---

## 快捷操作

### 交互式选择

**命令**:
```bash
# 不带参数，进入交互式选择
spec-first feature switch
```

**流程**:
1. 展示所有 Feature 列表
2. 用户输入序号或 ID
3. 确认并切换

---

### 最近使用列表

**功能**: 记录最近切换的 Feature

**存储**: `.spec-first/recent-features`

**格式**:
```
FEAT-20260305-001
FEAT-20260304-002
FEAT-20260303-003
```

**用途**: 快速切换到最近使用的 Feature
