# spec-first PRD 增强方案（终版 v2.1 - 已修复）

> **版本**: v2.1.0-final
> **日期**: 2026-03-05
> **状态**: 已修复审查问题，待实施

---

## 📋 执行摘要

### 核心问题
- 产品需求文档不规范（缺失边界、术语不清）
- 需求格式多样（Word/Excel/PDF/截图）
- 澄清效率低（开放式问题多）

### 解决方案
融合 dev-planner、Trellis、superpowers 最佳实践，重构 Phase 0 流程。

---

## 🎯 核心设计原则

| 原则 | 说明 | 来源 |
|------|------|------|
| Task-first | 立即创建 Feature | Trellis |
| Action-before-asking | 能推导的不问 | Trellis |
| 选项优先 | 检查清单代替开放式问题 | dev-planner |
| 一问一答 | 每次只问一个问题 | Trellis + superpowers |
| 质量驱动 | C-PRD ≥ 70% 才能进入下一阶段 | spec-first |

---

## 🔄 Phase 0 完整流程

### 流程图

```
Phase 0.0: Feature 快速初始化
    ↓
Phase 0.1: 需求输入（Word/Excel/PDF/MD/TXT）
    ↓
Phase 0.1.5: 图片需求提取（可选，10+ 张批量处理）
    ↓
Phase 0.2: 质量扫描 + 自动上下文
    ↓
Phase 0.3: PRD 初稿生成
    ↓
Phase 0.4: PRD 自检（C-PRD 评分）
    ↓
    决策点: C-PRD >= 70%?
    ├─ Yes → Phase 0.6
    └─ No  → Phase 0.5

Phase 0.5: PRD 补全对话（条件执行）
    ↓
Phase 0.6: PRD 最终确认（分段验证）
    ↓
<HARD-GATE>
- C-PRD ≥ 70%
- 用户已确认
- 无 [NEEDS CLARIFICATION]
```

---

## 📐 详细设计

### Phase 0.0: Feature 快速初始化

**工作量**: 0.5 天

**目标**: 立即创建 Feature，避免需求收集过程中信息丢失

**执行步骤**:
```bash
# 1. 生成临时 Feature ID
FEATURE_ID="FSREQ-$(date +%Y%m%d)-TEMP-$(uuidgen | cut -d'-' -f1)"

# 2. 创建目录结构
mkdir -p specs/$FEATURE_ID

# 3. 初始化 findings.md（修复：使用双引号 heredoc 允许变量展开）
cat > specs/$FEATURE_ID/findings.md << EOF
---
session_start: $(date -Iseconds)
phase: "0.0"
status: "in_progress"
---

## Phase 0.0: Feature 快速初始化

会话开始时间: $(date)
临时 Feature ID: $FEATURE_ID
EOF
```

**交付物**:
- `specs/{featureId}/` 目录
- `specs/{featureId}/findings.md`

---

### Phase 0.1: 需求输入

**工作量**: 1 天

**目标**: 支持多格式需求输入

**交互流程**:
```
[AI] 请提供产品需求：

A. 直接输入需求文本
B. Markdown 文件 (.md)
C. Word 文档 (.docx)
D. Excel 表格 (.xlsx)
E. PDF 文档 (.pdf)
F. 纯文本文件 (.txt)

选择方式 (A-F):
```

**格式解析器**:

| 格式 | 解析库 | 优先级 |
|------|--------|--------|
| .md | 直接读取 | P0 |
| .txt | 直接读取 | P0 |
| .docx | mammoth | P1 |
| .xlsx | xlsx | P1 |
| .pdf | pdf-parse | P2 |

**交付物**:
- `specs/{featureId}/raw-requirement.md`
- `findings.md` 更新（输入方式、长度、时间戳）

---

### Phase 0.1.5: 图片需求提取（可选）

**工作量**: 2 天

**目标**: 从截图中提取需求标注（支持 10+ 张批量处理）

**执行流程**:
1. 扫描文档中的图片引用
2. Vision API 提取标注（并发处理 3 张/批次）
3. 分类：功能/交互/异常/UI
4. 进度显示：`[3/15] 登录流程图 ✅ 提取 5 个需求点`

**交付物**:
- `specs/{featureId}/image-requirements.md`
- `specs/{featureId}/screenshots/` 截图副本

---

### Phase 0.2: 质量扫描 + 自动上下文

**工作量**: 1 天

**目标**: 评估需求完整度，自动收集项目上下文

**扫描维度**:

| 维度 | 检查项 | 权重 | 评分规则 |
|------|--------|------|---------|
| 目标清晰度 | 业务目标/用户价值 | 30% | 包含"目标/为了/解决" +15 |
| 功能边界 | 核心功能/范围 | 25% | 包含"功能/需求" +10，"不包括" +15 |
| 约束条件 | 技术/时间/资源约束 | 20% | 包含"性能/时间" +10 |
| 成功标准 | 可衡量指标 | 15% | 包含"指标/KPI" +15 |
| 术语定义 | 已定义术语 | 10% | 已定义术语数 × 2，最多 10 分 |

**复杂度判定**（修复：统一使用 C-PRD 评分）:

| C-PRD 评分 | 复杂度 | 执行深度 |
|-----------|--------|---------|
| ≥70 | Trivial/Simple | Phase 0.3 → 0.4 → 0.6（跳过 0.5） |
| <70 | Moderate/Complex | Phase 0.3 → 0.4 → 0.5（补全对话） |

**交付物**:
- `findings.md` 更新（质量评分、复杂度、上下文）

---

### Phase 0.3: PRD 初稿生成

**工作量**: 0.5 天

**目标**: 基于原始需求 + 上下文生成 PRD 初稿

**执行步骤**:
1. 读取 `raw-requirement.md` + `image-requirements.md`
2. 读取 `findings.md` 中的上下文信息
3. 判定场景：greenfield / iteration
4. 生成 PRD 初稿

**交付物**:
- `specs/{featureId}/prd.md`（初稿）

---

### Phase 0.4: PRD 自检

**工作量**: 0.5 天

**目标**: 运行 C-PRD 评分算法，决定是否需要补全对话

**执行步骤**:
1. 运行 C-PRD 评分算法
2. 检查章节完整性
3. 反模式检测：避免"太简单不需要 PRD"

**决策逻辑**（修复：统一使用 C-PRD 评分）:
```typescript
if (cPrdScore >= 70) {
  // 跳过 Phase 0.5，直接进入 Phase 0.6
  nextPhase = '0.6';
} else {
  // 执行 Phase 0.5 补全对话
  nextPhase = '0.5';
}
```

**交付物**:
- C-PRD 评分结果
- `findings.md` 更新（评分详情）

---

### Phase 0.5: PRD 补全对话（条件执行）

**工作量**: 2 天

**目标**: 通过结构化对话补全缺失需求

**三道问题门禁**:

```typescript
// Gate 1: 可推导性检查
function canDerive(question: string): boolean {
  // 能从代码/文档/配置推导？
  // 能从同类产品参考？
  return false; // 不能推导才继续
}

// Gate 2: 问题类型分类
enum QuestionType {
  Blocking,    // 阻断：无法继续
  Preference,  // 偏好：多个可行方案
  Derivable,   // 可推导：不应该问
}

// Gate 3: 问题价值评估
function isHighValue(question: string): boolean {
  // 会改变 FR/AC/NFR？
  return true; // 高价值才问
}
```

**一问一答流程**:
```
轮次 1:
[AI] 问题 1/3：账户体系
     产品文档未提及账户需求，请确认：
     A. 不需要登录
     B. 手机号+验证码登录
     C. 第三方登录（微信/支付宝）
     D. AI 推荐（基于同类产品）

[用户] C

[AI] ✅ 已记录：第三方登录（微信/支付宝）
     正在更新 prd.md...

轮次 2:
[AI] 问题 2/3：数据可见性
     ...
```

**补全检查清单**:
```markdown
## PRD 补全检查清单

【账户体系】
□ 不需要登录        □ 仅手机号登录        □ 第三方登录
□ 需要多角色权限    □ 管理员/普通用户两级

【数据边界】
□ 数据仅自己可见    □ 部门内共享          □ 全局可见
□ 需要数据导出      □ 需要数据导入

【异常处理】
□ 网络超时自动重试  □ 提示用户手动重试

【合规要求】
□ 无特殊要求       □ 需要操作日志        □ 需要数据审计
```

**交付物**:
- `prd.md` 更新（补全内容）
- `findings.md` 记录补全过程

---

### Phase 0.6: PRD 最终确认

**工作量**: 0.5 天

**目标**: 分段验证 PRD，确保用户理解

**分段确认流程**:
```
[AI] PRD 已完成，现在逐段确认：

━━━━━━━━━━━━━━━━━━━━━━
第 1/5 段：业务目标
━━━━━━━━━━━━━━━━━━━━━━
目标：开发用户管理系统
价值：提升管理效率，降低人工成本

这部分看起来正确吗？(Y/n/修改)

[用户] Y

━━━━━━━━━━━━━━━━━━━━━━
第 2/5 段：功能需求（FR）
━━━━━━━━━━━━━━━━━━━━━━
FR-AUTH-001: 用户登录
FR-AUTH-002: 权限管理
FR-DATA-001: 数据导出

这部分看起来正确吗？(Y/n/修改)
```

**交付物**:
- `prd.md` 最终版
- `findings.md` 记录确认过程

---

## 🔧 技术实现

### 依赖包

```json
{
  "dependencies": {
    "mammoth": "^1.6.0",
    "xlsx": "^0.18.5",
    "pdf-parse": "^1.1.1"
  }
}
```

### 核心接口

```typescript
// 统一需求对象
interface Requirement {
  text: string;
  images?: string[];
  tables?: Table[];
  sections?: Section[];
  metadata?: Record<string, any>;
}

// 质量评分
interface QualityScore {
  objective: number;    // 0-30
  boundary: number;     // 0-25
  constraint: number;   // 0-20
  metric: number;       // 0-15
  terminology: number;  // 0-10
  total: number;        // 0-100
}

// 复杂度
enum Complexity {
  Trivial = "trivial",
  Simple = "simple",
  Moderate = "moderate",
  Complex = "complex",
}
```

---

## 🚀 实施路径

### 阶段划分

| 阶段 | 任务 | 工作量 | 优先级 | 交付物 |
|------|------|--------|--------|--------|
| **P0** | Phase 0.0 快速初始化 | 0.5 天 | 🔴 | Feature 目录 + findings.md |
| **P0** | Phase 0.1 基础输入（MD/TXT） | 1 天 | 🔴 | raw-requirement.md |
| **P0** | Phase 0.2 质量扫描 | 1 天 | 🔴 | 质量评分器 |
| **P0** | Phase 0.3 PRD 初稿生成 | 0.5 天 | 🔴 | prd.md（初稿） |
| **P0** | Phase 0.4 PRD 自检 | 0.5 天 | 🔴 | C-PRD 评分 |
| **P1** | Phase 0.5 补全对话 | 2 天 | 🟡 | 门禁 + 一问一答 |
| **P1** | Phase 0.6 最终确认 | 0.5 天 | 🟡 | prd.md（最终版） |
| **P1** | Word/Excel 解析器 | 2 天 | 🟡 | 多格式支持 |
| **P2** | Phase 0.1.5 图片提取 | 2 天 | 🟢 | Vision API 集成 |
| **P2** | PDF 解析器 | 1 天 | 🟢 | PDF 支持 |

### P0 最小可用版本（3.5 天）

**范围**:
- Phase 0.0: Feature 快速初始化
- Phase 0.1: 支持 MD/TXT/用户输入
- Phase 0.2: 质量扫描 + 复杂度判定
- Phase 0.3: PRD 初稿生成
- Phase 0.4: PRD 自检（C-PRD 评分）

**不包含**:
- Word/Excel/PDF 解析（P1/P2）
- 图片需求提取（P2）
- PRD 补全对话（P1）

**验收标准**:
- [ ] 支持 3 种输入方式
- [ ] 质量评分准确率 ≥80%
- [ ] 复杂度判定准确率 ≥85%
- [ ] C-PRD 评分算法正确
- [ ] 单元测试覆盖率 ≥80%

---

## 📊 借鉴来源对比

### 四者特性对比

| 维度 | dev-planner | Trellis | superpowers | spec-first |
|------|-------------|---------|-------------|-----------|
| **目标用户** | 技术小白 | 专业开发者 | 专业开发者 | 专业开发者 |
| **核心理念** | 零术语、选项优先 | Action-before-asking | Design-before-code | 质量驱动 |
| **输入方式** | 8 步选项对话 | 交互式问答 | 交互式问答 | 多格式文档 |
| **问题策略** | AI 兜底 | Question Gate | One at a time | 三道门禁 |
| **验证方式** | 最终确认 | 分步更新 PRD | Incremental validation | 分段确认 |
| **门禁机制** | 无 | 无 | HARD-GATE | HARD-GATE + C-PRD |

### 融合策略

```
dev-planner          Trellis           superpowers        spec-first
    ↓                   ↓                   ↓                 ↓
选项优先          Task-first         HARD-GATE          质量评分
AI 兜底           Question Gate      分段验证           追溯矩阵
多格式输入        Auto-Context       反模式警告         阶段状态机
                  Research-first
                       ↓
                  融合后的方案
                       ↓
              Phase 0.0-0.6 完整流程
```

---

## 💡 使用示例

### 场景 1：Excel 需求表格

```bash
$ spec-first spec

[AI] Phase 0.0: 正在初始化 Feature...
✅ Feature ID: FSREQ-20260305-USER-001

[AI] Phase 0.1: 请提供需求文档路径：
> docs/product/用户系统需求.xlsx

[AI] 正在解析 Excel...
✅ 发现 2 个工作表：功能需求（15 行）、非功能需求（5 行）

[AI] Phase 0.2: 正在扫描需求质量...
━━━━━━━━━━━━━
质量评分：78/100 (良好)
复杂度：Simple
━━━━━━━━━━━━━

[AI] Phase 0.3: 正在生成 PRD 初稿...
✅ prd.md 已生成

[AI] Phase 0.4: PRD 自检...
✅ C-PRD: 75% (通过)

[AI] Phase 0.6: 最终确认...
━━━━━━━━━━━━━━━━
第 1/5 段：业务目标
━━━━━━━━━━━━━━━━
...

[用户] 全部确认

✅ PRD 已完成，可以进入 02_design
```

---

### 场景 2：Word 文档 + 截图

```bash
$ spec-first spec

[AI] Phase 0.1: 请提供需求文档路径：
> docs/PRD-用户系统v2.docx

[AI] 正在解析 Word 文档...
✅ 已读取 2,345 字
✅ 提取 6 张嵌入图片

[AI] Phase 0.1.5: 是否分析图片内容？(Y/n)
> Y

[AI] 正在分析图片...
[1/6] 登录流程图 ✅ 提取 5 个需求点
[2/6] 用户列表界面 ✅ 提取 8 个需求点
...

[AI] Phase 0.2: 质量扫描...
━━━━━━━━━━━━━
质量评分：65/100 (中等)
复杂度：Moderate
→ 需要 Phase 0.5 补全对话
━━━━━━━━━━━━━

[AI] Phase 0.3: 正在生成 PRD 初稿...
✅ prd.md 已生成

[AI] Phase 0.4: PRD 自检...
⚠️  C-PRD: 62% (未通过)

[AI] Phase 0.5: PRD 补全对话
问题 1/3：账户体系
A. 不需要登录
B. 手机号+验证码
C. 第三方登录
D. AI 推荐

[用户] D

[AI] ✅ AI 推荐：第三方登录（同类产品 85% 采用）
已更新 prd.md
```

---

## ⚠️ 风险与约束

### 技术风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|---------|
| Vision API 成本 | 中 | 高 | 仅在用户确认后调用 |
| 图片识别准确率 | 中 | 中 | 人工确认机制 |
| Excel 表格识别 | 低 | 中 | 提供手动修正 |
| PDF 解析复杂度 | 中 | 低 | P2 优先级，可延后 |

### 约束条件

- Vision API 需要网络连接
- 图片格式：PNG/JPG/JPEG（≤5MB）
- Word 版本：.docx（不支持 .doc）
- Excel 版本：.xlsx（不支持 .xls）

---

## ✅ 成功标准

### 功能完整性

- [ ] 支持 6 种需求输入方式（文本/MD/TXT/Word/Excel/PDF）
- [ ] 需求质量评分准确率 ≥80%
- [ ] 图片需求提取召回率 ≥70%
- [ ] PRD 补全对话覆盖 4 大类检查清单
- [ ] HARD-GATE 机制正常工作
- [ ] C-PRD 评分算法准确

### 用户体验

- [ ] 需求输入流程 ≤3 步
- [ ] 质量扫描响应时间 ≤5 秒
- [ ] 图片分析进度可见
- [ ] 支持中断和恢复

### 代码质量

- [ ] 单元测试覆盖率 ≥80%
- [ ] 集成测试覆盖核心流程
- [ ] 文档完整（使用指南 + API 文档）
- [ ] 符合 spec-first 代码规范

---

## 📝 总结

### 核心价值

1. **降低门槛** - 产品文档格式不限，自动转换标准 PRD
2. **提升效率** - 自动提取表格/图片，减少手工录入
3. **保证质量** - 质量扫描 + 补全对话 + HARD-GATE
4. **最佳实践** - 融合 4 个项目的优秀设计

### 关键创新

- ✅ **Task-first**（Trellis）- 立即创建 Feature
- ✅ **Action-before-asking**（Trellis）- 自动收集上下文
- ✅ **Question Gate**（Trellis）- 三道门禁过滤
- ✅ **选项优先**（dev-planner）- 检查清单代替开放式问题
- ✅ **HARD-GATE**（superpowers）- 强制质量门禁
- ✅ **多格式支持**（创新）- 适配产品文档现状

### 修复清单

- ✅ **Phase 流程完整** - 补充 Phase 0.3/0.4 详细设计和工作量
- ✅ **门禁逻辑统一** - 统一使用 C-PRD ≥ 70% 作为唯一决策依据
- ✅ **变量展开修复** - 使用双引号 heredoc 允许 `$(date)` 和 `$FEATURE_ID` 展开
- ✅ **术语评分修正** - 改为奖励"已定义术语"而非"未定义术语"
- ✅ **包名统一** - 统一使用 `xlsx` 包名

---

## 📚 参考资料

- [dev-planner-skill](https://github.com/cat9999aaa/dev-planner-skill)
- [Trellis brainstorm](/Users/kuang/xiaobu/Trellis/.claude/commands/trellis/brainstorm.md)
- [superpowers brainstorming](/Users/kuang/xiaobu/superpowers/skills/brainstorming/SKILL.md)
- [spec-first 现有流程](../skills/spec-first/03-spec/SKILL.md)

---

## 📅 变更历史

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v2.1.0 | 2026-03-05 | 修复审查发现的 5 个问题 |
| v2.0.0 | 2026-03-05 | 融合四者最佳实践，完整方案设计 |
| v1.3.0 | 2026-03-05 | 新增 superpowers 借鉴 |
| v1.2.0 | 2026-03-05 | 新增 Trellis 借鉴 |
| v1.1.0 | 2026-03-05 | 新增多格式支持 |
| v1.0.0 | 2026-03-05 | 初始版本 |

---

**文档状态**: ✅ 终版完成（已修复所有审查问题）
**下一步**: 开始 P0 阶段实施（Phase 0.0 + 0.1 + 0.2 + 0.3 + 0.4）
