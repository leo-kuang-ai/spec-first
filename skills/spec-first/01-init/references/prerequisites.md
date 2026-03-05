# 前置检查规则

> Init Skill 的前置检查清单与错误提示

---

## 00-first 检查（强制）

### 检查清单

**必须存在的目录**:
- `docs/first/`

**必须存在的索引**:
- `docs/first/.index.yaml`

**quick 核心产物**（至少包含）:
- `docs/first/tech-stack.md`
- `docs/first/codebase-overview.md`
- `docs/first/domain-model.md`
- `docs/first/api-docs.md`

### 检查逻辑

```
1. 检查 docs/first/ 目录是否存在
   ├─ 否 → 提示执行 /spec-first:first
   └─ 是 → 继续

2. 检查 docs/first/.index.yaml 是否存在
   ├─ 否 → 提示执行 /spec-first:first
   └─ 是 → 继续

3. 检查 quick 核心产物是否完整
   ├─ 缺失任一文件 → 提示执行 /spec-first:first
   └─ 全部存在 → 通过
```

### 错误提示模板

**缺失 docs/first/ 目录**:
```
❌ 前置检查失败: 缺失项目认知文档

未找到 docs/first/ 目录。

💡 解决方案:
运行 /spec-first:first 生成项目认知文档

这将生成:
- tech-stack.md (技术栈)
- codebase-overview.md (代码结构)
- domain-model.md (业务模型)
- api-docs.md (API 文档)
```

**缺失核心产物**:
```
❌ 前置检查失败: 项目认知文档不完整

缺失以下文件:
- docs/first/tech-stack.md
- docs/first/domain-model.md

💡 解决方案:
运行 /spec-first:first 补充缺失文档
```

---

## 项目初始化文件检查

### 检查项（用于提示）

**目录检查**:
- `.spec-first/` - 项目配置目录
- `.spec-first/layer2/` - 平台模板目录
- `.spec-first/meta/` - 元数据目录

**文件检查**:
- `.spec-first/meta/config.yaml` - 项目配置
- `.spec-first/layer2/*.yaml` - 平台模板文件

### 检查逻辑

```
1. 检查 .spec-first/ 目录
   ├─ 不存在 → 提示"首次初始化"
   └─ 存在 → 继续

2. 检查 .spec-first/layer2/ 目录
   ├─ 不存在或为空 → 错误：必须先创建平台 YAML
   └─ 存在且有文件 → 继续

3. 检查 .spec-first/meta/config.yaml
   ├─ 不存在 → 提示"将自动创建"
   └─ 存在 → 提示"已存在"
```

### 错误提示模板

**缺失 layer2 目录**:
```
❌ 初始化失败: 缺失平台模板配置

未找到 .spec-first/layer2/ 目录或目录为空。

💡 解决方案:
1. 创建目录: mkdir -p .spec-first/layer2
2. 添加平台模板文件，例如:
   - h5.yaml (H5 前端)
   - java-backend.yaml (Java 后端)
   - ios.yaml (iOS 客户端)

3. 重新运行 /spec-first:init
```

**layer2 目录为空**:
```
❌ 初始化失败: 无可用平台模板

.spec-first/layer2/ 目录存在但为空。

💡 解决方案:
在 .spec-first/layer2/ 中添加至少一个平台模板文件。

示例:
- h5.yaml
- java-backend.yaml
- react-native.yaml
```

---

## 提示信息模板

### 首次初始化提示

```
ℹ️  检测到首次初始化

将自动创建以下文件:
- .spec-first/meta/config.yaml
- .claude/settings.json
- specs/.feat-registry.md
```

### 已有配置提示

```
ℹ️  检测到已有配置

已存在:
- .spec-first/meta/config.yaml
- .claude/settings.json

将复用现有配置。
```
