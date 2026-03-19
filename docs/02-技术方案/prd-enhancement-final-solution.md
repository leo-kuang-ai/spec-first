# PRD 增强功能实施方案（零代码方案）

> **版本**: v3.0.1 - 零代码方案
> **日期**: 2026-03-06
> **状态**: 立即可用（已落地到 spec-first:spec）
> **工期**: 0 天（无需开发）

---

## 1. 方案演进

| 版本 | 方案 | 工期 | 代码量 | 状态 |
|------|------|------|--------|------|
| v1.0 | 自建解析器 | 16 天 | ~1000 行 | ❌ 已废弃 |
| v2.0 | Claude API 集成 | 2 天 | ~150 行 | ❌ 已废弃 |
| v3.0 | 零代码方案 | **0 天** | **0 行** | ✅ **推荐** |

---

## 2. 核心思路

**直接在 Claude Code 对话中解析需求文档，无需开发任何代码。**

### 工作流程

```
用户上传文件（PDF/Word/图片）
    ↓
使用优化的 Prompt
    ↓
Claude 直接输出结构化需求
    ↓
保存为 raw-requirement.md
    ↓
继续 spec-first:spec 流程
```

---

## 3. 使用方法

### 3.1 基本用法

**Step 1**: 在 Claude Code 中上传需求文档
- 拖拽文件到对话框
- 或点击附件按钮上传

**Step 2**: 发送 Prompt
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
- [NEEDS CLARIFICATION][类型] 问题？候选 A/B/C

输出 Markdown 格式。
```

**Step 3**: 保存输出
```bash
# 复制 Claude 的输出，保存为
specs/FSREQ-20260305-FEAT-001/raw-requirement.md
```

### 3.2 完整 Prompt（推荐）

见 `docs/用户文档/prd-file-parsing-guide.md`

### 3.3 最小治理 SOP（建议执行）

1. 上传前先做敏感信息检查（账号、密钥、个人隐私）；必要时打码或抽取片段。
2. 产出必须保存到 `specs/{featureId}/raw-requirement.md`，并保留来源文件名。
3. 基于 `raw-requirement.md` 生成 `prd.md` 后，执行 `spec-first validate all <featureId>`。
4. 若校验失败，回到 Prompt 修正并重跑，直到通过。

---

## 4. 集成到 spec-first:spec

### 4.1 Phase 0.3 已落地（As-Is）

`skills/spec-first/03-spec/SKILL.md` 的 Phase 0.3 已包含以下流程：

```markdown
#### Phase 0.3: PRD 生成

**执行方式**（二选一）:

**方式 A: 用户已有需求文档** ⭐ 推荐
1. 提示用户上传文件（PDF/Word/图片）
2. 使用 PRD 提取 prompt（见 references/prd-extraction-prompt.md）
3. 将输出保存为 raw-requirement.md
4. 基于 raw-requirement.md 生成 prd.md

**方式 B: 用户口述需求**
1. 通过对话收集需求
2. 直接生成 prd.md
```

### 4.2 AI 执行逻辑

```
IF 用户提到"有文档"或"有截图":
    提示: "请上传需求文档（PDF/Word/图片），我将帮您提取结构化需求。"
    等待用户上传
    使用 PRD 提取 prompt 解析
    保存为 raw-requirement.md
    基于 raw-requirement.md 生成 prd.md
ELSE:
    通过对话收集需求
    直接生成 prd.md
```

---

## 5. 优势对比

| 维度 | v1.0 自建 | v2.0 API | v3.0 零代码 |
|------|----------|---------|------------|
| 工期 | 16 天 | 2 天 | **0 天** ✅ |
| 代码量 | 1000 行 | 150 行 | **0 行** ✅ |
| 维护成本 | 高 | 中 | **无** ✅ |
| 灵活性 | 低 | 中 | **极高** ✅ |
| 立即可用 | ❌ | ❌ | **✅** |
| 效果 | 良好 | 优秀 | **优秀** ✅ |

---

## 6. 实施步骤

### 立即可用（0 天）

**Step 1**: 创建 Prompt 模板文件
- ✅ 已完成：`skills/spec-first/03-spec/references/prd-extraction-prompt.md`
- ✅ 已完成：`docs/用户文档/prd-file-parsing-guide.md`

**Step 2**: 更新 spec-first:spec SKILL.md
- ✅ 已完成：在 Phase 0.3 增加文件上传选项
- ✅ 已完成：引用 `references/prd-extraction-prompt.md`

**Step 3**: 用户使用
- 执行 `spec-first:spec` 时，AI 提示上传文件
- 用户上传 → AI 解析 → 保存结果

---

## 7. 成本分析

| 方案 | 开发成本 | 运行成本 | 维护成本 | 总成本 |
|------|---------|---------|---------|--------|
| v1.0 | 16 人天 | $0 | 高 | **极高** |
| v2.0 | 2 人天 | $4/月 | 中 | **中** |
| v3.0 | **0 人天** | **$0** | **无** | **零** ✅ |

---

## 8. 总结

### 8.1 最终方案

**采用 v3.0 零代码方案**，理由：
1. ✅ 无需开发，立即可用
2. ✅ 零维护成本
3. ✅ 效果优秀（Claude 能力）
4. ✅ 灵活性极高（可随时调整 prompt）
5. ✅ 用户体验好（直接在对话中完成）

### 8.2 交付物

- ✅ `skills/spec-first/03-spec/references/prd-extraction-prompt.md`
- ✅ `docs/用户文档/prd-file-parsing-guide.md`
- ✅ `skills/spec-first/03-spec/SKILL.md` Phase 0.3 已更新

### 8.3 后续优化

**短期**：
- 优化 prompt 模板（基于用户反馈）
- 增加更多示例

**中期**：
- 收集常见需求模式
- 建立 prompt 库

---

**文档版本**: v3.0.1
**最后更新**: 2026-03-06
**状态**: 立即可用
**结论**: 无需开发任何代码，直接使用 Claude Code 解析需求文档
