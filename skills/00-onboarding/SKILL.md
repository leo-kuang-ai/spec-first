---
name: "spec-first:onboarding"
description: "Use when a new user needs guided onboarding, scenario-based learning paths, or first-step recommendations for adopting spec-first in the current project."
version: 1.5.0
user-invocable: true
---

# 00-onboarding — 新手引导

> **版本**: v1.5.0 | **类型**: Utility | **状态**: Active

---

## 输入上下文

执行此 skill 时，从 `.spec-first/runtime/first/` 加载以下产物：

| 产物 | 优先级 | 用途 |
|------|--------|------|
| `summary` | 可选 | 项目概览，理解技术栈和模块划分 |

> **缺失处理**: 如果必需产物不存在，提示用户先执行 `/spec-first:first`


## 执行流程

- Command: `/spec-first:onboarding`

**重要**：本 Skill 的所有用户交互必须使用 `AskUserQuestion` 工具，禁止使用文本提示让用户输入数字或文字。

### Phase 0: 前置检查与欢迎

**前置检查**：
1. 检测 `docs/onboarding/` 目录下是否存在学习路径文档（*.md）
2. 检测 `.spec-first/runtime/first/summary.json` 与 `entry-guide.json` 是否存在

---

**场景 A：已完成 onboarding（存在学习路径文档）**

**立即调用 `AskUserQuestion` 工具**（不要输出文本提示）：

```
header: "已完成"
question: "检测到你已经完成了 onboarding，上次生成的学习路径已保存到 docs/onboarding/ 目录。你想要？"
multiSelect: false
options:
  - label: "查看上次的学习路径"
    description: "读取并显示已保存的文档"
  - label: "重新生成学习路径"
    description: "重新进行场景识别"
  - label: "退出"
    description: "结束 onboarding"
```

**处理逻辑**：
- 选择"查看上次的学习路径" → 读取 `docs/onboarding/*.md` 并输出内容，然后结束
- 选择"重新生成学习路径" → 继续 Phase 0.5
- 选择"退出" → 直接结束

---

**场景 B：首次使用（无学习路径文档）**

输出欢迎信息：
```
🎉 欢迎使用 Spec-First！

我会帮你找到最适合的学习路径。
```

继续 Phase 0.5

---

### Phase 0.5: 引导模式选择

**使用 `AskUserQuestion` 工具收集用户选择**：

**场景 A：无 first 项目认知资产（降级模式）**

**Q0: 检测到你还没有运行过项目分析**

提示：建议先执行 `/spec-first:first` 了解项目结构（约 3-5 分钟），这样能提供更精准的推荐。

选项：
- 现在就去分析项目（推荐） - 执行 first 后获得个性化推荐
- 第一次使用，给我最简路径 - 跳过分析，3 步快速开始
- 我想自定义学习路径 - 跳过分析，完整场景识别

**处理逻辑**：
- 选择"现在就去分析项目" → 执行 `/spec-first:first`，完成后重新进入 onboarding
- 选择"第一次使用" → 跳过 Phase 1，输出快速路径（Phase 2.8-快速模式）
- 选择"自定义" → 进入 Phase 1 完整场景识别（降级模式）

**场景 B：有 first 项目认知资产（正常模式）**

**Q0: 你的使用经验？**

选项：
- 第一次使用，给我最简路径（推荐） - 3 步快速开始
- 我想自定义学习路径 - 完整场景识别

**处理逻辑**：
- 选择"第一次使用" → 跳过 Phase 1，输出快速路径（Phase 2.8-快速模式）
- 选择"自定义" → 进入 Phase 1 完整场景识别（正常模式）

**项目认知数据使用策略**：
- 正常模式：根据项目摘要与入口建议调整推荐内容，标注 `📊 数据来源：基于项目分析（summary / entry-guide）`
- 降级模式：使用通用推荐，标注 `💡 数据来源：通用推荐`

---

### Phase 1: 场景识别（交互式）

**一次性收集 3 个问题**（使用 `AskUserQuestion` 工具）：

**Q1: 你的主要角色是？**

选项：
- 开发者 - 编写和维护代码
- 产品经理 - 定义需求和规划功能
- 测试工程师 - 编写测试和质量保障
- 架构师 - 设计系统架构和技术方案

**注意**：用户可以选择"Other"自定义角色（如：运维工程师、技术经理）

**Q2: 你想做什么？**

选项：
- 开发新功能 - 从零开始实现新特性
- 修复 Bug - 定位和解决现有问题
- 重构代码 - 优化现有代码结构
- 学习 Spec-First - 了解工作流和最佳实践

**Q3: 项目规模？**

选项：
- 小型 - 1-2 人团队
- 中型 - 3-10 人团队
- 大型 - 10+ 人团队

---

### Phase 2: 路径推荐

**基于用户选择生成场景标识**：
- 格式：`{role}_{task}_{size}`
- 示例：`developer_new_feature_small`

**查询映射表**：
- 读取 `references/scenario-mapping.md` 匹配场景
- 返回对应的推荐路径

---

### Phase 2.5: 参数确认

**仅在完整模式下执行**（快速模式跳过此步骤）

**输出确认信息**：
```
📋 请确认你的选择：

- 角色：开发者
- 任务：开发新功能
- 规模：小型
- 场景：developer_new_feature_small
- 预计时间：30-60 分钟

是否继续？
```

使用 `AskUserQuestion` 工具：

选项：
- 确认，生成学习路径
- 修改选择

**处理逻辑**：
- 选择"确认" → 进入 Phase 2.8 输出路径
- 选择"修改" → 返回 Phase 1 重新选择

---

### Phase 2.8: 输出学习路径

**输出格式（快速模式 - 来自 Phase 0.5）**：
```
✨ 为你推荐快速开始路径

💡 数据来源：通用推荐（适合首次使用）
⏱️  预计时间：15-20 分钟

---

## 🚀 快速开始（3 步）

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

---

💡 **提示**：
- 每步完成后运行 `/spec-first:status` 查看进度
- 遇到问题运行 `/spec-first:doctor` 诊断环境

🎯 **下一步**：复制上面第一个命令开始吧！
```

**输出格式（完整模式 - 来自 Phase 1）**：
```
✨ 为你推荐以下学习路径

📊 数据来源：基于项目分析（summary / entry-guide）
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
- 查看详细文档：`docs/用户文档/quick-start.md`

🎯 **下一步**：复制上面第一个命令开始吧！
```

---

### Phase 3: 保存学习路径

**自动保存**：按角色生成文件并保存到 `docs/onboarding/` 目录

**角色到文件名映射**：
- 开发者 → `开发者学习路径.md`
- 产品经理 → `产品经理学习路径.md`
- 测试工程师 → `测试工程师学习路径.md`
- 架构师 → `架构师学习路径.md`
- 自定义角色 → `{自定义角色名}学习路径.md`

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
- 查看详细文档：`docs/用户文档/quick-start.md`

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
- 无 first 项目认知资产 → 提示"建议先运行 /spec-first:first 了解项目结构"
