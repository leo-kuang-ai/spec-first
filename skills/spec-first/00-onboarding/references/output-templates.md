# Onboarding 输出模板

## 欢迎信息模板

```markdown
🎉 欢迎使用 Spec-First！

我会通过 3 个简单问题帮你找到最适合的学习路径。

---
```

## 路径推荐模板

```markdown
✨ 为你推荐以下学习路径

{数据来源标注}
📌 场景：{角色} + {任务类型} + {项目规模}
⏱️  预计时间：{预计时间}

---

## 🚀 你的学习路径

{步骤列表}

---

💡 **提示**：
- 每步完成后运行 `/spec-first:status` 查看进度
- 遇到问题运行 `/spec-first:doctor` 诊断环境
- 查看详细文档：`docs/用户文档/quick-start.md`

🎯 **下一步**：复制上面第一个命令开始吧！
```

## 步骤模板

```markdown
### Step {N}: {步骤名称} ({预计时间})
```bash
{命令}
```
**目标**：{目标说明}
**为什么需要**：{原因说明}
**可跳过条件**：{跳过条件}
```

## 数据来源标注

### 正常模式
```markdown
📊 数据来源：基于项目分析（summary / entry-guide）
```

### 降级模式
```markdown
⚠️ 数据来源：通用推荐（无 first 资产，建议先运行 /spec-first:first）
```

## 角色定制推荐

### 开发者
```markdown
📖 **建议先阅读**：
- `docs/first/codebase-overview.md` - 代码结构概览
- `docs/first/architecture.md` - 架构设计
- 开发入口：{入口文件}
```

### 产品经理
```markdown
📖 **建议先阅读**：
- `docs/first/domain-model.md` - 业务领域模型
- `docs/first/api-docs.md` - API 接口规范
- 业务流程：{核心流程}
```

### 测试工程师
```markdown
📖 **建议先阅读**：
- `docs/first/api-docs.md` - API 接口规范
- 测试策略：{测试方法}
- 验收标准：{标准说明}
```

### 架构师
```markdown
📖 **建议先阅读**：
- `docs/first/architecture.md` - 架构设计
- `docs/first/call-graph.md` - 调用链分析
- 技术决策：{关键决策}
```

## 保存文档模板

```markdown
# {角色}学习路径

> **生成时间**: {timestamp}
> **场景标识**: {role}_{task}_{size}

## 📋 场景信息

- **角色**: {角色中文名}
- **任务类型**: {任务类型中文名}
- **项目规模**: {规模中文名}
- **预计时间**: {预计时间}

## 🚀 推荐学习路径

{完整的 Skill 序列}

## 💡 使用提示

- 每步完成后运行 `/spec-first:status` 查看进度
- 遇到问题运行 `/spec-first:doctor` 诊断环境
- 查看详细文档：`docs/用户文档/quick-start.md`

---

*本文档由 Spec-First Onboarding 自动生成*
```

## 错误提示模板

### first 资产不存在
```markdown
⚠️ 未检测到项目分析数据

建议先运行：
```bash
/spec-first:first
```

这将生成项目认知文档，帮助我提供更精准的推荐。

是否继续使用通用推荐？
```

### 文档保存失败
```markdown
⚠️ 无法保存学习路径文档

原因：{错误原因}

学习路径已输出到终端，请手动保存。
```

### 无匹配场景
```markdown
ℹ️ 未找到精确匹配的场景

使用通用学习路径：first → init → spec
```
