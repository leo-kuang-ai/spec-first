# 前置条件检查

> Init Skill 执行前必须满足的条件

---

## 00-first runtime 真源要求

**必须存在的目录**:
- `.spec-first/runtime/first/`

**必须存在的索引**:
- `.spec-first/runtime/first/index.json`

**必须存在的 runtime 真源文件**:
- `.spec-first/runtime/first/summary.json`
- `.spec-first/runtime/first/role-views.json`
- `.spec-first/runtime/first/stage-views.json`

**说明**:
- `docs/first/` 是投影视图层，可缺失或滞后
- readiness 只看 runtime 真源，不依赖任何 legacy YAML 索引

### 检查逻辑

```
1. 检查 .spec-first/runtime/first/ 目录是否存在
   ├─ 否 → 提示执行 /spec-first:first
   └─ 是 → 继续

2. 检查 index.json / summary.json / role-views.json / stage-views.json 是否存在
   ├─ 缺失任一文件 → 提示执行 /spec-first:first
   └─ 全部存在 → 通过 readiness
```

### 错误提示模板

```
❌ 前置检查失败: 缺失 00-first runtime 真源

缺失以下文件:
- .spec-first/runtime/first/index.json
- .spec-first/runtime/first/stage-views.json

💡 解决方案:
运行 /spec-first:first 重新生成 runtime 真源
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
