# PRD 文件解析指南（零代码方案）

> **适用场景**: 用户有 PDF/Word/图片格式的需求文档
> **实施方式**: 直接在 Claude Code 对话中解析，无需开发

---

## 使用流程

### Step 1: 上传文件

在 Claude Code 对话中，直接拖拽或上传需求文档：
- PDF 文档
- Word 文档（.docx）
- 需求截图（.png/.jpg）
- 手绘草图

### Step 2: 使用 Prompt

复制以下 prompt 发送：

```
请分析这份需求文档，按以下格式输出：

## 1. 原始需求摘录
[完整内容，保留关键细节]

## 2. 结构化要点
- 业务目标:
- 功能边界:
- 约束条件:
- 成功标准:

## 3. 待澄清项
- [NEEDS CLARIFICATION][类型] 问题？候选答案 A/B/C

输出 Markdown 格式。
```

### Step 3: 保存结果

将 Claude 的输出保存为：
```
specs/{featureId}/raw-requirement.md
```

---

## 集成到 spec-first:spec

在 **Phase 0.3: PRD 生成** 中，增加文件上传选项：

```markdown
### Phase 0.3: PRD 生成

**执行选项**:

选项 A: 用户已有需求文档（推荐）
1. 提示用户上传文件（PDF/Word/图片）
2. 使用 PRD 提取 prompt 解析
3. 将输出保存为 raw-requirement.md
4. 基于 raw-requirement.md 生成 prd.md

选项 B: 用户口述需求
1. 通过对话收集需求
2. 直接生成 prd.md
```

---

## Prompt 模板（完整版）

```
请分析这份需求文档，提取结构化信息：

## 1. 原始需求摘录
[完整内容摘要，包括：
- 背景与问题
- 目标用户
- 核心功能
- 数据流程
- 图片内容描述（如有）]

## 2. 结构化要点

### 业务目标
- 问题陈述:
- 目标用户:
- 使用场景:
- 预期收益:

### 功能边界
- 范围内:
- 范围外:

### 约束条件
- 技术约束:
- 业务约束:

### 成功标准
- [可量化指标]

## 3. 待澄清项
- [NEEDS CLARIFICATION][BOUNDARY] 问题？候选 A/B/C
- [NEEDS CLARIFICATION][TERM] 术语定义？

类型: BOUNDARY/TERM/SEMANTIC/ERROR/PRIORITY/DEPENDENCY

## 4. 关键实体
- 实体 1: 定义
- 实体 2: 定义

输出 Markdown 格式，保留原文关键细节。
```

---

## 优势

✅ **零开发成本** - 无需写代码
✅ **立即可用** - 今天就能用
✅ **效果优秀** - Claude 理解能力强
✅ **灵活性高** - 可随时调整 prompt
✅ **成本极低** - 按需使用

---

## 实施建议

**立即执行**:
1. 将此文档放入 `skills/spec-first/03-spec/references/`
2. 在 spec-first:spec SKILL.md 的 Phase 0.3 中引用
3. 用户执行 spec 时，AI 提示上传文件选项

**无需开发任何代码！**
