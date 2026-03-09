---
name: onboarding
description: 新手引导 - 交互式场景识别与学习路径推荐
version: 1.3.0
user-invocable: true
changelog: |
  1.3.0: 交互体验优化 - 支持命令行参数（--role/--task/--size），CLI 参数检测与提示
  1.2.0: 文档结构优化 - 拆分输出模板到 references/output-templates.md，精简 SKILL.md
  1.1.0: 补充场景匹配算法、role-views 使用策略、完整错误处理矩阵
  1.0.0: 初始版本 - 3 问题交互式引导、场景推荐、学习路径保存
---

# 00-onboarding — 新手引导

> **版本**: v1.0.0 | **类型**: Utility | **状态**: Active

---

## 执行流程

- Command: `/spec-first:onboarding`
- 支持参数（可选）：`--role=<role> --task=<task> --size=<size>`

**参数说明**：
- `--role`: developer | pm | qa | architect | <自定义>
- `--task`: new_feature | fix_bug | refactor | learn
- `--size`: small | medium | large

**注意**：参数仅用于 AI 内部传递，CLI 不支持参数化启动

### Phase 0: 欢迎与说明

**输出格式**：
```
🎉 欢迎使用 Spec-First！

我会通过 3 个简单问题帮你找到最适合的学习路径。

---
```

---

### Phase 0.5: 背景输入检查

**role-views 数据使用策略**：

1. **检测 role-views**：
   - 读取 `.spec-first/runtime/first/role-views.json`
   - 检查文件是否存在且格式正确

2. **正常模式**（存在 role-views）：
   - 根据用户角色调整推荐内容：
     - **开发者**：突出 `codebase-overview.md`、`architecture.md`、开发入口
     - **产品经理**：突出 `domain-model.md`、`api-docs.md`、业务流程
     - **测试工程师**：突出 `api-docs.md`、测试策略、验收标准
     - **架构师**：突出 `architecture.md`、`call-graph.md`、技术决策
   - 在推荐路径中插入”建议先阅读”提示
   - 标注：`📊 数据来源：基于项目分析（role-views）`

3. **降级模式**（无 role-views）：
   - 使用通用推荐路径
   - 第一步强制推荐：`/spec-first:first`
   - 标注：`⚠️ 数据来源：通用推荐（无 first 资产，建议先运行 /spec-first:first）`

4. **错误处理**：
   - role-views.json 格式错误 → 降级模式 + 警告
   - 文件读取失败 → 降级模式

**注意**：onboarding 只负责入口裁剪，不生成 runtime 真源

### Phase 1: 场景识别（交互式）

使用 `AskUserQuestion` 工具收集用户信息：

**Q1: 你的主要角色是？**

选项：
- 开发者（写代码）
- 产品经理（写需求）
- 测试工程师（写测试）
- 架构师（做设计）

**注意**：用户可以选择"Other"自定义角色名称（如：运维工程师、技术经理等）

**Q2: 你想做什么？**

选项：
- 开发新功能
- 修复 Bug
- 重构代码
- 学习 Spec-First

**Q3: 项目规模？**

选项：
- 小型（1-2 人）
- 中型（3-10 人）
- 大型（10+ 人）

---

### Phase 2: 路径推荐

**基于用户选择生成场景标识**：
- 格式：`{role}_{task}_{size}`
- 示例：`developer_new_feature_small`

**场景匹配算法**：
1. **精确匹配**：`{role}_{task}_{size}` 完全匹配（如 `developer_new_feature_small`）
2. **部分通配**：`{role}_{task}_*` 匹配任意规模（如 `developer_fix_bug_*`）
3. **任务通配**：`*_{task}_*` 匹配任意角色（如 `*_learn_*`）
4. **默认场景**：无匹配时使用 `default`

**查询映射表**：
- 读取 `references/scenario-mapping.md`
- 按优先级顺序匹配场景
- 返回第一个匹配的推荐路径

**输出格式**：见 `references/output-templates.md`

**核心逻辑**：
1. 构建场景标识：`{role}_{task}_{size}`
2. 查询 scenario-mapping.md 匹配场景
3. 根据 role-views 定制推荐内容
4. 渲染输出模板
5. 保存到 `docs/onboarding/{角色}学习路径.md`

---

### Phase 3: 保存学习路径

**自动保存**：按角色生成文件并保存到 `docs/onboarding/` 目录

**角色到文件名映射**：
- 开发者 → `开发者学习路径.md`
- 产品经理 → `产品经理学习路径.md`
- 测试工程师 → `测试工程师学习路径.md`
- 架构师 → `架构师学习路径.md`
- 自定义角色 → `{自定义角色名}学习路径.md`

**文档内容结构**：见 `references/output-templates.md`

**更新策略**：
- 首次执行：创建对应角色的文档
- 再次执行：覆盖更新该角色的文档
- 不影响其他角色的文档

**输出提示**：
```
✅ 学习路径已保存到：docs/onboarding/{角色}学习路径.md
```

---

## 成功标准

- ✅ 用户完成 3 个问题回答
- ✅ 输出清晰的学习路径
- ✅ 显示首个 Skill 启动命令
- ✅ 用户理解下一步操作

---

## When to Use

使用此 Skill 当：
- 首次使用 Spec-First
- 不确定从哪个 Skill 开始
- 需要个性化学习路径推荐

**不要使用**当：
- 已熟悉 Spec-First 工作流
- 明确知道要用哪个 Skill

---

## CLI 依赖

无（纯引导 Skill）

---

## 错误处理

### 错误处理矩阵

| 错误场景 | 处理策略 | 用户提示 |
|---------|---------|---------|
| role-views.json 不存在 | 降级模式 | ⚠️ 无 first 资产，建议先运行 /spec-first:first |
| role-views.json 格式错误 | 降级模式 + 警告 | ⚠️ role-views 数据异常，使用通用推荐 |
| 无匹配场景 | 使用 default | ℹ️ 使用通用学习路径 |
| 文档保存失败 | 仅输出到终端 | ⚠️ 无法保存文档，请手动记录 |
| 用户跳过所有问题 | 使用默认配置 | ℹ️ 使用默认配置：开发者 + 新功能 + 小型 |
| docs/onboarding/ 目录不存在 | 自动创建 | - |
| 文件写入权限错误 | 降级到终端输出 | ⚠️ 无写入权限，路径已输出到终端 |

### 降级策略

1. **role-views 降级**：
   - 检测失败 → 使用通用路径
   - 格式错误 → 记录警告 + 通用路径
   - 读取超时 → 跳过 role-views

2. **文档保存降级**：
   - 目录创建失败 → 终端输出
   - 文件写入失败 → 终端输出
   - 权限错误 → 终端输出 + 提示

3. **场景匹配降级**：
   - 无精确匹配 → 尝试通配匹配
   - 无通配匹配 → 使用 default
   - default 缺失 → 使用内置最小路径
