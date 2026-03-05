---
name: onboarding
description: 新手引导 - 交互式场景识别与学习路径推荐
version: 1.0.0
user-invocable: true
---

# 00-onboarding — 新手引导

> **版本**: v1.0.0 | **类型**: Utility | **状态**: Active

---

## 执行流程

### Phase 0: 欢迎与说明

**输出格式**：
```
🎉 欢迎使用 Spec-First！

我会通过 3 个简单问题帮你找到最适合的学习路径。

---
```

---

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

**查询映射表**：
- 读取 `references/scenario-mapping.md`
- 匹配对应场景的推荐路径

**输出格式**：
```
✨ 为你推荐以下学习路径

📌 场景：开发者 + 新功能 + 小型项目
⏱️  预计时间：30-60 分钟（不含编码）

---

## 🚀 你的学习路径

### Step 1: 项目快速认知 (5 分钟)
```bash
/spec-first:first
```
**目标**：了解项目技术栈、架构、代码结构

### Step 2: 初始化 Feature (2 分钟)
```bash
/spec-first:init
```
**目标**：创建 Feature 工作区

### Step 3: 编写需求规格 (10 分钟)
```bash
/spec-first:spec
```
**目标**：生成 PRD 和 spec.md

### Step 4: 技术设计 (8 分钟)
```bash
/spec-first:design
```
**目标**：生成 design.md

### Step 5: 代码实现 (按需)
```bash
/spec-first:code
```
**目标**：实现功能代码

### Step 6: 阶段验收 (5 分钟)
```bash
/spec-first:verify
```
**目标**：确保通过 Gate 检查

---

💡 **提示**：
- 每步完成后运行 `/spec-first:status` 查看进度
- 遇到问题运行 `/spec-first:doctor` 诊断环境
- 查看详细文档：`docs/quick-start.md`

🎯 **下一步**：复制上面第一个命令开始吧！
```

---

### Phase 3: 保存学习路径

**自动保存**：按角色生成文件并保存到 `docs/onboarding/` 目录

**角色到文件名映射**：
- 开发者 → `docs/onboarding/开发者学习路径.md`
- 产品经理 → `docs/onboarding/产品经理学习路径.md`
- 测试工程师 → `docs/onboarding/测试工程师学习路径.md`
- 架构师 → `docs/onboarding/架构师学习路径.md`
- 自定义角色 → `docs/onboarding/{自定义角色名}学习路径.md`

**文件名处理规则**：
- 自定义角色直接使用用户输入的中文名称
- 示例：用户输入"运维工程师" → `运维工程师学习路径.md`
- 示例：用户输入"技术经理" → `技术经理学习路径.md`

**文档内容结构**：
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

{完整的 Skill 序列，与 Phase 2 输出格式一致}

## 💡 使用提示

- 每步完成后运行 `/spec-first:status` 查看进度
- 遇到问题运行 `/spec-first:doctor` 诊断环境
- 查看详细文档：`docs/quick-start.md`

---

*本文档由 Spec-First Onboarding 自动生成*
```

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

- 用户跳过问题 → 使用默认场景（开发者 + 新功能 + 小型）
- 无匹配场景 → 推荐通用路径（first → init → spec）
