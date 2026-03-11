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
   ├─ 不存在或为空 → 引导创建平台 YAML（见下方）
   └─ 存在且有文件 → 继续

3. 检查 .spec-first/meta/config.yaml
   ├─ 不存在 → 提示"将自动创建"
   └─ 存在 → 提示"已存在"
```

### 平台 YAML 创建流程

当 `.spec-first/layer2/` 不存在或为空时：

1. **询问项目类型**：
   ```
   ⚠️  检测到 .spec-first/layer2/ 目录不存在
       将在初始化过程中自动创建平台配置。

   请选择项目类型：
     1. Java 后端服务
     2. 前端应用（React/Vue）
     3. H5 移动端
     4. 其他（手动配置）

   请选择 [1-4]: _
   ```

2. **根据选择创建对应模板**（详见 [platform-yaml-template.md](platform-yaml-template.md)）

3. **关键约束**：
   - ⚠️ 第一个字段必须是 `platform:`（不是 `name:`）
   - 这是 CLI 校验的硬性要求，否则会报错：`"platform" 为必填`

4. **Windows 注意事项**：
   - 使用 UTF-8 编码
   - 使用 LF 换行符（不是 CRLF）
