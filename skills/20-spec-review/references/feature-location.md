# Feature 定位规则

> Spec-Review Skill 的 Feature 自动定位机制

---

## 定位优先级

### 1. 显式参数（最高优先级）

**触发**: 用户提供 featureId 参数

**示例**:
```
/spec-first:spec-review FSREQ-20260305-AUTH-001
```

**处理**: 直接使用该参数，跳过自动定位

---

### 2. 自动定位（默认）

**触发**: 无显式参数

**流程**:
```
1. 读取 .spec-first/current
2. 若文件存在且内容非空 → 使用该 Feature ID
3. 继续 P1
```

**示例**:
```
$ cat .spec-first/current
FSREQ-20260305-SPECOPT-001

→ 自动使用 FSREQ-20260305-SPECOPT-001
```

---

### 3. 交互式选择（降级）

**触发**: `.spec-first/current` 不存在或为空

**流程**:
```
1. 读取 specs/.feat-registry.md
2. 列出可用 Feature
3. 提示用户选择
```

**示例**:
```
未找到当前激活 Feature

可用 Feature:
1. FSREQ-20260305-AUTH-001 (01_specify)
2. FSREQ-20260305-REPORT-001 (02_design)

请选择 [1/2] 或输入 Feature ID:
```

---

## 错误处理

### current 文件不存在

**处理**: 降级到交互式

**消息**:
```
ℹ️  未找到 .spec-first/current

将列出可用 Feature 供选择。
```

---

### current 文件为空

**处理**: 降级到交互式

**消息**:
```
⚠️  .spec-first/current 为空

将列出可用 Feature 供选择。
```

---

### spec.md 不存在

**处理**: 报错并终止

**消息**:
```
❌ spec.md 不存在

Feature: FSREQ-20260305-AUTH-001
路径: specs/FSREQ-20260305-AUTH-001/spec.md

💡 解决方案:
运行 /spec-first:spec 生成需求规格
```

---

## 参考实现

### 02-catchup Skill

```markdown
| 优先级 | 信息源 | 包含内容 |
|--------|--------|----------|
| **P0** | `.spec-first/current` | 当前 Feature ID |
```

**流程**:
```
1. 读取 .spec-first/current → 获取 Feature ID
2. 读取 stage-state.json → 获取阶段
3. 加载上下文
```
