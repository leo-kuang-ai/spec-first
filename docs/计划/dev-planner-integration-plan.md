# dev-planner-skill 与 spec-first 集成方案

> **版本**: v1.0.0
> **日期**: 2026-03-05
> **状态**: 设计阶段

---

## 背景与目标

### 问题陈述

当前 spec-first 面临的挑战：
- 产品需求文档不规范（缺失边界、术语不清、截图标注未提取）
- 需要开发人员手动将产品需求转换为标准 PRD
- 需求澄清过程依赖开放式问题，效率低

### 集成目标

从 dev-planner-skill 借鉴「需求澄清」设计模式，优化 spec-first 的 Phase 0（PRD 生成）阶段：

1. **支持多种需求输入方式**（手动输入/文档路径/截图）
2. **自动提取截图标注**（Vision API）
3. **结构化需求补全**（选项优先、一问一答）
4. **需求质量评分**（决定执行深度）

---

## 核心设计原则

| 原则 | 说明 |
|------|------|
| **向后兼容** | 不破坏现有 spec-first 流程 |
| **最小侵入** | 仅扩展 Phase 0，不修改后续阶段 |
| **选项优先** | 用检查清单代替开放式问题 |
| **AI 兜底** | 提供智能推荐，降低决策压力 |

---

## 架构设计

### Phase 0 流程扩展

```
Phase 0.1: 需求输入 ← 🆕 新增
    ↓  支持：文本/文档/截图
Phase 0.1.5: 图片需求提取 ← 🆕 新增
    ↓  Vision API 提取标注
Phase 0.2: 需求质量扫描 ← 🆕 新增
    ↓  评分 + 决定执行深度
Phase 0.3: PRD 初稿生成
    ↓  基于原始需求生成
Phase 0.4: PRD 自检
    ↓  C-PRD 评分
Phase 0.5: PRD 补全对话 ← 🆕 新增
    ↓  if C-PRD < 85%
Phase 0.6: PRD 最终确认
```

---

## 详细设计


### Phase 0.1: 需求输入

**目标**: 获取产品需求原始输入

#### 输入方式

```
请提供产品需求：

A. 直接粘贴需求文本
B. 提供需求文档路径（.md / .txt / .docx / .pdf）
C. 提供需求文档 + 截图目录
```

#### 输出

- `specs/{featureId}/raw-requirement.md` - 原始需求
- `findings.md` 记录输入元数据

---

### Phase 0.1.5: 图片需求提取

**目标**: 从截图中提取需求标注

#### 执行流程

1. **图片收集** - 扫描文档图片引用或截图目录
2. **Vision API 分析** - 提取文字标注和 UI 元素
3. **需求分类** - 按功能/交互/异常/UI 分类
4. **与文本需求合并** - 去重、补充、标记冲突

#### 输出

- `specs/{featureId}/image-requirements.md` - 图片需求
- `specs/{featureId}/screenshots/` - 截图副本

---

### Phase 0.2: 需求质量扫描

**目标**: 评估原始需求完整度

#### 扫描维度

| 维度 | 检查项 | 权重 |
|------|--------|------|
| 目标清晰度 | 业务目标/用户价值 | 30% |
| 功能边界 | 核心功能/范围 | 25% |
| 约束条件 | 技术/时间/资源约束 | 20% |
| 成功标准 | 可衡量指标 | 15% |
| 术语定义 | 未定义术语 | 10% |

#### 复杂度判定

| 质量评分 | 执行深度 | 说明 |
|---------|---------|------|
| ≥85 | Trivial | 需求清晰，轻量流程 |
| 70-84 | Simple | 需求较清晰，标准流程 |
| 50-69 | Moderate | 有歧义，需补全对话 |
| <50 | Complex | 缺失严重，深度补全 |

---

### Phase 0.5: PRD 补全对话

**目标**: 通过结构化对话补全缺失需求

#### 借鉴 dev-planner 的设计模式

##### 1. 选项优先

```markdown
## PRD 补全检查清单

【账户体系】
□ 不需要登录        □ 仅手机号登录        □ 第三方登录
□ 需要多角色权限    □ 管理员/普通用户两级

【数据边界】
□ 数据仅自己可见    □ 部门内共享          □ 全局可见

【异常处理】
□ 网络超时自动重试  □ 提示用户手动重试

【合规要求】
□ 无特殊要求       □ 需要操作日志        □ 需要数据审计
```

##### 2. 一问一答收敛

```
问题 1/3：账户体系
A. 不需要登录
B. 手机号+验证码登录
C. 第三方登录（微信/支付宝）

[产品选 C] → 已记录
```

##### 3. AI 兜底选项

```
问题：是否需要数据导出？
A. 需要
B. 不需要
C. AI 根据同类产品判断

[产品选 C]
→ AI 推荐：需要（同类产品 80% 包含）
```

---


## 技术实现

### Vision API 集成

```typescript
// 图片需求提取器
async function extractImageRequirements(imagePath: string): Promise<string> {
  const imageData = await fs.readFile(imagePath);
  const base64Image = imageData.toString('base64');
  
  const prompt = `
分析这张产品需求截图，提取以下信息：

1. 功能需求（用户可以做什么）
2. 交互流程（操作步骤）
3. 异常处理（错误提示/边界情况）
4. UI 元素（按钮/输入框/列表/标注）

输出格式：
- [功能] ...
- [交互] ...
- [异常] ...
- [UI] ...
`;

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: "image/png",
            data: base64Image,
          },
        },
        { type: "text", text: prompt }
      ],
    }],
  });
  
  return response.content[0].text;
}
```

### 需求质量扫描器

```typescript
// 需求质量评分
interface QualityScore {
  objective: number;    // 目标清晰度 0-30
  boundary: number;     // 功能边界 0-25
  constraint: number;   // 约束条件 0-20
  metric: number;       // 成功标准 0-15
  terminology: number;  // 术语定义 0-10
  total: number;        // 总分 0-100
}

function scanRequirementQuality(requirement: string): QualityScore {
  const score: QualityScore = {
    objective: 0,
    boundary: 0,
    constraint: 0,
    metric: 0,
    terminology: 0,
    total: 0,
  };
  
  // 目标清晰度检查
  if (/目标|目的|为了|解决/.test(requirement)) score.objective += 15;
  if (/用户|客户|业务/.test(requirement)) score.objective += 15;
  
  // 功能边界检查
  if (/功能|需求|支持/.test(requirement)) score.boundary += 10;
  if (/不包括|不支持|范围外/.test(requirement)) score.boundary += 15;
  
  // 约束条件检查
  if (/性能|响应时间|并发/.test(requirement)) score.constraint += 10;
  if (/时间|截止|里程碑/.test(requirement)) score.constraint += 10;
  
  // 成功标准检查
  if (/指标|KPI|成功标准/.test(requirement)) score.metric += 15;
  
  // 术语定义检查
  const terms = requirement.match(/[A-Z]{2,}/g) || [];
  score.terminology = Math.min(10, terms.length * 2);
  
  score.total = score.objective + score.boundary + score.constraint + 
                score.metric + score.terminology;
  
  return score;
}
```

---

## 文件结构

### 新增文件

```
skills/spec-first/03-spec/
├── SKILL.md                           # 修订 Phase 0
└── references/
    ├── requirement-input.md           # 🆕 需求输入指南
    ├── image-requirement-extractor.md # 🆕 图片需求提取器
    ├── requirement-scanner.md         # 🆕 需求质量扫描器
    ├── prd-completion-checklist.md    # 🆕 PRD 补全检查清单
    └── vision-prompt-template.md      # 🆕 Vision API 提示词模板
```

### 输出文件

```
specs/{featureId}/
├── raw-requirement.md        # 🆕 原始需求（文本）
├── image-requirements.md     # 🆕 图片需求
├── screenshots/              # 🆕 截图副本
│   ├── login-flow.png
│   └── user-list.png
├── prd.md                    # PRD（已有）
├── spec.md                   # Spec（已有）
└── findings.md               # 记录（已有，扩展）
```

---


## 实施路径

### 阶段划分

| 阶段 | 任务 | 优先级 | 工作量 | 交付物 |
|------|------|--------|--------|--------|
| **P0** | Phase 0.1 需求输入 | 🔴 高 | 1 天 | 支持文本/文档输入 |
| **P1** | Phase 0.2 需求质量扫描 | 🔴 高 | 1 天 | 质量评分器 |
| **P2** | Phase 0.1.5 图片需求提取 | 🟡 中 | 2 天 | Vision API 集成 |
| **P3** | Phase 0.5 PRD 补全对话 | 🟡 中 | 2 天 | 检查清单 + 一问一答 |
| **P4** | 文档模板 | 🟢 低 | 1 天 | 参考文档 |

### P0 最小可用版本（MVP）

**目标**: 支持基本需求输入和质量评估

**范围**:
- Phase 0.1: 支持文本输入和 Markdown 文件读取
- Phase 0.2: 基础质量扫描（5 个维度）
- 输出 `raw-requirement.md` 和质量评分

**不包含**:
- 图片需求提取（P2）
- PRD 补全对话（P3）

---

## 使用示例

### 场景 1：文本输入

```bash
$ spec-first spec

[AI] 请提供产品需求：
     A. 直接粘贴需求文本
     B. 提供文件路径

> A

[AI] 请粘贴需求（完成后输入 END）：

> 需要开发一个用户管理系统
> 支持用户注册、登录、权限管理
> 需要管理员后台
> END

✅ 已接收需求（共 45 字）

[AI] 正在扫描需求质量...
━━━━━━━━━━━━━
需求质量评分：58/100 (中等)
━━━━━━━━━━━━━

✅ 目标清晰度：20/30
⚠️  功能边界：10/25
❌ 约束条件：5/20
❌ 成功标准：3/15
✅ 术语定义：10/10

建议执行深度：Moderate
→ 需要 Phase 0.5 补全对话

继续生成 PRD 初稿...
```

### 场景 2：文档 + 截图

```bash
$ spec-first spec

[AI] 请提供需求文档路径：
> docs/product/user-system.md

✅ 已读取文档（共 1,234 字）

[AI] 检测到文档中包含 5 张截图，是否分析？(Y/n)
> Y

[AI] 正在分析截图...
━━━━━━━━━━━━━━━━━━━━━━━━
[1/5] login-flow.png
      ✅ 提取 8 个需求点（功能 3 / 交互 3 / 异常 2）

[2/5] user-list.png
      ✅ 提取 12 个需求点（功能 5 / 交互 4 / UI 3）

[3/5] permission-matrix.png
      ✅ 提取 6 个需求点（功能 4 / UI 2）
━━━━━━━━━━━━━

[AI] 正在合并需求...
✅ 文本需求: 23 项
✅ 图片需求: 26 项
⚠️  重复需求: 3 项（已去重）

━━━━━━━━━━━━━━━━
需求质量评分：78/100 (良好)
建议执行深度：Simple
━━━━━━━━━━━━━━━━

继续生成 PRD 初稿...
```

---

## 风险与约束

### 技术风险

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| Vision API 成本 | 中 | 仅在用户确认后调用，支持跳过 |
| 图片识别准确率 | 中 | 人工确认机制，标记不确定项 |
| 大文档处理性能 | 低 | 分段处理，显示进度 |

### 约束条件

- Vision API 需要网络连接
- 图片格式支持：PNG/JPG/JPEG（≤5MB）
- 文档格式支持：MD/TXT（PDF/DOCX 为 P2）

---

## 成功标准

### 功能完整性

- [ ] 支持 3 种需求输入方式（文本/文档/截图）
- [ ] 需求质量评分准确率 ≥80%
- [ ] 图片需求提取召回率 ≥70%
- [ ] PRD 补全对话覆盖 5 大类检查清单

### 用户体验

- [ ] 需求输入流程 ≤3 步
- [ ] 质量扫描响应时间 ≤5 秒
- [ ] 图片分析进度可见
- [ ] 支持中断和恢复

### 代码质量

- [ ] 单元测试覆盖率 ≥80%
- [ ] 集成测试覆盖核心流程
- [ ] 文档完整（使用指南 + API 文档）

---

## 附录

### 参考资料

- [dev-planner-skill 仓库](https://github.com/cat9999aaa/dev-planner-skill)
- [Claude Vision API 文档](https://docs.anthropic.com/claude/docs/vision)
- [spec-first 现有流程](../skills/spec-first/03-spec/SKILL.md)

### 变更历史

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v1.0.0 | 2026-03-05 | 初始版本，定义集成方案 |

---

**文档状态**: ✅ 已完成

**下一步**: 开始 P0 阶段实现（Phase 0.1 + 0.2）

---

## 补充：多格式需求输入支持

### 支持的输入格式

| 格式 | 扩展名 | 解析方式 | 优先级 |
|------|--------|---------|--------|
| Markdown | `.md` | 直接读取 | P0 |
| 纯文本 | `.txt` | 直接读取 | P0 |
| Word 文档 | `.docx` | mammoth.js | P1 |
| Excel 表格 | `.xlsx` | xlsx.js | P1 |
| PDF 文档 | `.pdf` | pdf-parse | P2 |
| 用户输入 | - | 交互式输入 | P0 |

### Phase 0.1 扩展：多格式输入

#### 输入方式选择

```
请提供产品需求：

A. 直接输入需求文本
B. Markdown 文件 (.md)
C. Word 文档 (.docx)
D. Excel 表格 (.xlsx)
E. PDF 文档 (.pdf)
F. 纯文本文件 (.txt)
```

---

### 格式解析器设计

#### 1. Markdown 解析器（P0）

```typescript
async function parseMarkdown(filePath: string): Promise<Requirement> {
  const content = await fs.readFile(filePath, 'utf-8');
  
  return {
    text: content,
    images: extractImagePaths(content),  // 提取 ![](path)
    sections: parseMarkdownSections(content),
    metadata: extractFrontMatter(content),
  };
}

function extractImagePaths(markdown: string): string[] {
  const regex = /!\[.*?\]\((.*?)\)/g;
  const matches = [...markdown.matchAll(regex)];
  return matches.map(m => m[1]);
}
```

#### 2. Word 文档解析器（P1）

```typescript
import mammoth from 'mammoth';

async function parseWord(filePath: string): Promise<Requirement> {
  const result = await mammoth.convertToMarkdown({ path: filePath });
  
  // 提取图片
  const images = await mammoth.extractRawText({ path: filePath });
  
  return {
    text: result.value,
    images: extractImagesFromWord(filePath),
    sections: parseMarkdownSections(result.value),
    warnings: result.messages,  // 解析警告
  };
}

async function extractImagesFromWord(filePath: string): Promise<string[]> {
  const result = await mammoth.convertToHtml({ path: filePath });
  const imgRegex = /<img[^>]+src="([^">]+)"/g;
  const matches = [...result.value.matchAll(imgRegex)];
  
  // 保存图片到临时目录
  const imagePaths: string[] = [];
  for (const match of matches) {
    const base64Data = match[1].split(',')[1];
    const imagePath = await saveBase64Image(base64Data);
    imagePaths.push(imagePath);
  }
  
  return imagePaths;
}
```

#### 3. Excel 表格解析器（P1）

```typescript
import XLSX from 'xlsx';

async function parseExcel(filePath: string): Promise<Requirement> {
  const workbook = XLSX.readFile(filePath);
  const sheets = workbook.SheetNames;
  
  let text = '';
  const tables: Table[] = [];
  
  for (const sheetName of sheets) {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    // 转换为 Markdown 表格
    const markdown = convertToMarkdownTable(data, sheetName);
    text += `\n## ${sheetName}\n\n${markdown}\n`;
    
    tables.push({
      name: sheetName,
      data: data,
      markdown: markdown,
    });
  }
  
  return {
    text,
    tables,
    sections: parseExcelSections(tables),
  };
}

function convertToMarkdownTable(data: any[][], sheetName: string): string {
  if (data.length === 0) return '';
  
  const headers = data[0];
  const rows = data.slice(1);
  
  let markdown = `| ${headers.join(' | ')} |\n`;
  markdown += `| ${headers.map(() => '---').join(' | ')} |\n`;
  
  for (const row of rows) {
    markdown += `| ${row.join(' | ')} |\n`;
  }
  
  return markdown;
}
```


#### Excel 特殊场景处理

##### 场景 1：需求列表表格

```
| 需求ID | 需求描述 | 优先级 | 状态 |
|--------|---------|--------|------|
| REQ-001 | 用户登录 | P0 | 待开发 |
| REQ-002 | 数据导出 | P1 | 待开发 |
```

**解析策略**：
- 识别「需求ID」「需求描述」列
- 自动生成 FR 列表
- 保留优先级和状态信息

##### 场景 2：功能矩阵表格

```
| 功能 | Web | iOS | Android | 备注 |
|------|-----|-----|---------|------|
| 登录 | ✓ | ✓ | ✓ | 支持第三方 |
| 导出 | ✓ | × | × | 仅 Web |
```

**解析策略**：
- 识别平台列（Web/iOS/Android）
- 提取跨平台需求差异
- 生成平台特定约束

##### 场景 3：用例表格

```
| 用例ID | 前置条件 | 操作步骤 | 预期结果 |
|--------|---------|---------|---------|
| UC-001 | 已登录 | 1. 点击导出<br>2. 选择格式 | 下载文件 |
```

**解析策略**：
- 识别用例结构
- 转换为 AC（验收标准）
- 保留步骤顺序

---

#### 4. PDF 文档解析器（P2）

```typescript
import pdf from 'pdf-parse';

async function parsePDF(filePath: string): Promise<Requirement> {
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdf(dataBuffer);
  
  return {
    text: data.text,
    pages: data.numpages,
    metadata: data.info,
    images: await extractPDFImages(filePath),
  };
}

// PDF 图片提取（需要 pdf-image 或 pdfjs-dist）
async function extractPDFImages(filePath: string): Promise<string[]> {
  // 使用 pdf-image 或 pdfjs-dist 提取图片
  // 保存到临时目录
  return [];  // 实现略
}
```

---


### 统一解析接口

```typescript
interface Requirement {
  text: string;              // 文本内容
  images?: string[];         // 图片路径列表
  tables?: Table[];          // 表格数据
  sections?: Section[];      // 章节结构
  metadata?: Record<string, any>;  // 元数据
  warnings?: string[];       // 解析警告
}

interface Table {
  name: string;              // 表格名称
  data: any[][];             // 原始数据
  markdown: string;          // Markdown 格式
}

interface Section {
  title: string;             // 章节标题
  level: number;             // 层级（1-6）
  content: string;           // 章节内容
}

// 统一入口
async function parseRequirement(input: string): Promise<Requirement> {
  // 判断输入类型
  if (!input.includes('/') && !input.includes('\\')) {
    // 直接文本输入
    return { text: input };
  }
  
  const ext = path.extname(input).toLowerCase();
  
  switch (ext) {
    case '.md':
      return parseMarkdown(input);
    case '.txt':
      return { text: await fs.readFile(input, 'utf-8') };
    case '.docx':
      return parseWord(input);
    case '.xlsx':
    case '.xls':
      return parseExcel(input);
    case '.pdf':
      return parsePDF(input);
    default:
      throw new Error(`不支持的文件格式: ${ext}`);
  }
}
```

---

### 使用示例

#### 示例 1：Excel 需求表格

```bash
$ spec-first spec

[AI] 请提供需求文档路径：
> docs/product/requirements.xlsx

[AI] 正在解析 Excel 文档...
✅ 发现 3 个工作表：
   - 功能需求（23 行）
   - 非功能需求（8 行）
   - 用例列表（15 行）

[AI] 正在转换为标准格式...

━━━━━━━━━━━━━━━━━━━━━━
工作表 1: 功能需求
━━━━━━━━━━━━━━━━━━━━━━
识别到需求列表格式：
- 列：需求ID | 需求描述 | 优先级 | 状态
- 共 23 条需求

自动生成 FR：
✅ FR-AUTH-001: 用户登录 (P0)
✅ FR-AUTH-002: 找回密码 (P1)
✅ FR-DATA-001: 数据导出 (P1)
...

━━━━━━━━━━━━━━━━━━━━━━
工作表 2: 非功能需求
━━━━━━━━━━━━━━━━━━━━━━
识别到 NFR：
- 性能：响应时间 < 200ms
- 安全：密码加密存储
- 可用性：99.9% SLA

━━━━━━━━━━━━━━━━━━━━━━

✅ 已保存到 raw-requirement.md

需求质量评分：82/100 (良好)
建议执行深度：Simple
```

#### 示例 2：Word 文档 + 截图

```bash
$ spec-first spec

[AI] 请提供需求文档路径：
> docs/product/PRD-用户系统v2.docx

[AI] 正在解析 Word 文档...
✅ 已读取文档（共 3,456 字）
✅ 提取 8 张嵌入图片

[AI] 是否分析图片内容？(Y/n)
> Y

[AI] 正在分析图片...
━━━━━━━━━━━━━━━━━━━━━━
[1/8] 图片1.png (登录流程图)
      ✅ 提取 6 个需求点

[2/8] 图片2.png (用户列表界面)
      ✅ 提取 9 个需求点
━━━━━━━━━━━━━━━━━━━━━━

✅ 文本需求: 34 项
✅ 图片需求: 28 项
⚠️  重复需求: 4 项（已去重）

需求质量评分：76/100 (良好)
```


#### 示例 3：PDF 文档

```bash
$ spec-first spec

[AI] 请提供需求文档路径：
> docs/product/需求说明书.pdf

[AI] 正在解析 PDF 文档...
✅ 已读取 12 页
⚠️  PDF 格式限制：表格可能无法完整识别

预览前 300 字：
━━━━━━━━━━━━━
一、项目背景
本项目旨在开发...
━━━━━━━━━━━━━

确认使用此文档？(Y/n) Y

需求质量评分：65/100 (中等)
建议执行深度：Moderate
→ 需要 Phase 0.5 补全对话
```

---

### 依赖包

```json
{
  "dependencies": {
    "mammoth": "^1.6.0",      // Word 文档解析
    "xlsx": "^0.18.5",         // Excel 表格解析
    "pdf-parse": "^1.1.1"      // PDF 文档解析
  }
}
```

### 安装命令

```bash
npm install mammoth xlsx pdf-parse
```

---

### 错误处理

```typescript
async function parseRequirementSafe(input: string): Promise<Requirement> {
  try {
    return await parseRequirement(input);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`文件不存在: ${input}`);
    }
    
    if (error.message.includes('不支持的文件格式')) {
      throw new Error(
        `不支持的文件格式。支持的格式：.md, .txt, .docx, .xlsx, .pdf`
      );
    }
    
    // 解析失败时提供降级方案
    console.warn(`解析失败，尝试纯文本读取: ${error.message}`);
    return {
      text: await fs.readFile(input, 'utf-8'),
      warnings: [`解析失败，已降级为纯文本: ${error.message}`],
    };
  }
}
```

---


### 更新后的实施路径

| 阶段 | 任务 | 格式支持 | 优先级 | 工作量 |
|------|------|---------|--------|--------|
| **P0** | 基础输入 | .md / .txt / 用户输入 | 🔴 高 | 1 天 |
| **P0** | 需求质量扫描 | 所有格式 | 🔴 高 | 1 天 |
| **P1** | Word 支持 | .docx | 🟡 中 | 1 天 |
| **P1** | Excel 支持 | .xlsx / .xls | 🟡 中 | 2 天 |
| **P2** | 图片需求提取 | 所有格式中的图片 | 🟡 中 | 2 天 |
| **P2** | PDF 支持 | .pdf | 🟢 低 | 1 天 |
| **P3** | PRD 补全对话 | - | 🟡 中 | 2 天 |

---

### 格式优先级说明

**P0（立即支持）**:
- Markdown (.md) - 开发者常用
- 纯文本 (.txt) - 最简单
- 用户输入 - 交互式

**P1（优先支持）**:
- Word (.docx) - 产品经理常用
- Excel (.xlsx) - 需求列表常用

**P2（按需支持）**:
- PDF (.pdf) - 只读文档，解析复杂

---

### 测试用例

```typescript
describe('Requirement Parser', () => {
  it('应该解析 Markdown 文件', async () => {
    const result = await parseRequirement('test.md');
    expect(result.text).toBeDefined();
    expect(result.images).toBeArray();
  });
  
  it('应该解析 Word 文档', async () => {
    const result = await parseRequirement('test.docx');
    expect(result.text).toBeDefined();
    expect(result.images).toBeArray();
  });
  
  it('应该解析 Excel 表格', async () => {
    const result = await parseRequirement('test.xlsx');
    expect(result.tables).toBeDefined();
    expect(result.tables.length).toBeGreaterThan(0);
  });
  
  it('应该识别需求列表表格', async () => {
    const result = await parseExcel('requirements.xlsx');
    const reqTable = result.tables.find(t => 
      t.name.includes('需求') || t.name.includes('功能')
    );
    expect(reqTable).toBeDefined();
  });
  
  it('应该处理不支持的格式', async () => {
    await expect(parseRequirement('test.ppt'))
      .rejects.toThrow('不支持的文件格式');
  });
});
```

---

### 总结

#### 核心改进

1. **多格式支持** - MD/TXT/DOCX/XLSX/PDF/用户输入
2. **智能解析** - 自动识别表格结构（需求列表/功能矩阵/用例）
3. **图片提取** - 从 Word/PDF 中提取嵌入图片
4. **统一接口** - 所有格式输出标准 Requirement 对象

#### 与 dev-planner 的差异

| 维度 | dev-planner | spec-first 集成方案 |
|------|-------------|-------------------|
| 目标用户 | 技术小白 | 专业开发者 |
| 输入方式 | 8 步选项对话 | 多格式文档 + 质量扫描 |
| 需求来源 | 用户口述 | 产品文档（可能不规范） |
| 输出 | 三份文档 | 标准 PRD + Spec |

#### 价值

- **降低门槛** - 产品文档格式不限，自动转换
- **提升效率** - 自动提取表格/图片，减少手工录入
- **保证质量** - 质量扫描 + 补全对话，确保 PRD 完整性

---

**文档版本**: v1.1.0 (新增多格式支持)
**更新日期**: 2026-03-05
**状态**: ✅ 设计完成，待实施


---

## 补充：借鉴 Trellis brainstorm skill

### Trellis brainstorm 核心设计

| 原则 | 说明 | 适用场景 |
|------|------|---------|
| **Task-first** | 立即创建任务，捕获想法 | 避免信息丢失 |
| **Action-before-asking** | 能推导的不问用户 | 减少低价值问题 |
| **One question per message** | 每次只问一个问题 | 避免信息过载 |
| **Research-first** | 技术选型前先调研 | 避免让用户发明选项 |
| **Diverge → Converge** | 先发散再收敛 | 考虑未来演进 |

---

### 可借鉴到 spec-first 的设计

#### 1. Step 0: Ensure Task Exists (ALWAYS)

**Trellis 做法**：
```markdown
## Step 0: Ensure Task Exists (ALWAYS)

Before any Q&A, ensure a task exists.
- Use a temporary working title
- Create/seed prd.md immediately with what you know
```

**spec-first 应用**：
```markdown
## Phase 0.0: Feature 快速初始化（新增）

在 Phase 0.1 需求输入之前，确保 Feature 已创建：

1. 如果用户未提供 featureId，自动生成临时 ID
2. 立即创建 Feature 目录结构
3. 初始化 findings.md 记录会话开始时间

目的：避免需求收集过程中信息丢失
```

#### 2. Auto-Context (DO THIS BEFORE ASKING)

**Trellis 做法**：
```markdown
## Step 1: Auto-Context

Before asking "what does the code look like?", gather context yourself:
- Identify likely modules/files impacted
- Locate existing patterns
- Check configs, scripts
- Note constraints
```

**spec-first 应用**：
已在 Phase 0.2（需求质量扫描）中实现，可增强：

```markdown
## Phase 0.2 增强：自动上下文收集

扫描前自动收集：
- 相关代码文件（基于关键词）
- 现有 API 接口
- 数据库表结构
- 第三方依赖

写入 findings.md：
- 受影响文件列表
- 现有模式/约定
- 技术约束
```


#### 3. Question Gate (高价值问题过滤)

**Trellis 做法**：
```markdown
## Step 3: Question Gate

Gate A — Can I derive this without the user?
→ Do not ask. Fetch it, summarize, update PRD.

Gate B — Is this a meta/lazy question?
→ Do not ask. Take action.

Gate C — What type of question is it?
→ Only ask Blocking or Preference.
```

**spec-first 应用**：
```markdown
## Phase 0.5 增强：问题门禁

在 PRD 补全对话前，每个问题必须通过三道门禁：

### Gate 1: 可推导性检查
- 能从代码/文档/配置推导？→ 不问，直接推导
- 能从同类产品参考？→ 不问，先调研

### Gate 2: 问题类型分类
- Blocking（阻断）：无法继续，必须问
- Preference（偏好）：多个可行方案，让产品选
- Derivable（可推导）：不应该问

### Gate 3: 问题价值评估
- 会改变 FR/AC/NFR？→ 高价值，可问
- 仅影响实现细节？→ 低价值，不问
```


#### 4. Expansion Sweep (发散思考)

**Trellis 做法**：
```markdown
## Step 5: Expansion Sweep (DIVERGE)

Expansion categories:
1. Future evolution - 1-3 个月后可能的演进
2. Related scenarios - 相关场景的一致性
3. Failure & edge cases - 失败/边界情况
```

**spec-first 应用**：
已在 spec skill 的 Step 5 实现，可对齐术语：

```markdown
## Step 5: Expansion Sweep（与 Trellis 对齐）

发散扫描三个维度：
1. **未来演进** - 预留扩展点
2. **相关场景** - 保持一致性
3. **失败边界** - 异常/边界处理

输出格式：
For this MVP, which would you like to include?
1. Current requirement only (minimal viable)
2. Add <X> (reserve for future extension)
3. Add <Y> (improve robustness)
```

#### 5. One Question Per Message

**Trellis 做法**：
```markdown
## Step 6: Q&A Loop

Rules:
- One question per message
- Prefer multiple-choice when possible
- After each answer: Update PRD immediately
```

**spec-first 应用**：
已在 Phase 0.5 实现，可增强：

```markdown
## Phase 0.5 增强：严格一问一答

每轮对话：
1. 只问 1 个问题
2. 提供 2-4 个选项（避免开放式）
3. 用户回答后立即更新 prd.md
4. 移除已回答问题，进入下一轮

禁止：
❌ "还有几个问题：1. ... 2. ... 3. ..."
✅ "问题 1/3：账户体系..."
```


#### 6. Research-first Mode

**Trellis 做法**：
```markdown
## Step 4: Research-first Mode (Mandatory for technical choices)

Trigger: 技术选型/最佳实践/推荐方案
Steps:
1. 识别 2-4 个可比工具/模式
2. 总结通用约定
3. 映射到项目约束
4. 产出 2-3 个可行方案
```

**spec-first 应用**：
已在 spec skill Step 4 实现，完全对齐 ✅

---

### 三者对比总结

| 维度 | dev-planner | Trellis brainstorm | spec-first 集成方案 |
|------|-------------|-------------------|-------------------|
| **目标用户** | 技术小白 | 专业开发者 | 专业开发者 |
| **需求来源** | 用户口述 | 用户描述任务 | 产品文档（可能不规范） |
| **输入方式** | 8 步选项对话 | 交互式问答 | 多格式文档 + 补全对话 |
| **核心原则** | 选项优先、AI 兜底 | Action-before-asking | 质量扫描 + 门禁过滤 |
| **问题策略** | 每题都有"AI 决定" | 一问一答、能推导不问 | 一问一答、三道门禁 |
| **发散收敛** | 功能清单多选 | Diverge → Converge | Expansion Sweep |
| **技术选型** | 2-3 套推荐方案 | Research-first | Research-first |
| **输出** | 三份文档 | PRD + ADR-lite | PRD + Spec + Design |

---

### 最佳实践融合

| 来源 | 设计 | 应用到 spec-first |
|------|------|------------------|
| **dev-planner** | 选项优先 | PRD 补全检查清单 |
| **dev-planner** | AI 兜底 | 每个问题提供"AI 推荐"选项 |
| **Trellis** | Task-first | Phase 0.0 快速初始化 |
| **Trellis** | Action-before-asking | Phase 0.2 自动上下文收集 |
| **Trellis** | Question Gate | Phase 0.5 三道门禁 |
| **Trellis** | One question per message | Phase 0.5 严格一问一答 |
| **Trellis** | Expansion Sweep | Step 5 发散扫描 |
| **Trellis** | Research-first | Step 4 技术调研 |

---


### 融合后的 Phase 0 完整流程

```
Phase 0.0: Feature 快速初始化 ← 🆕 借鉴 Trellis Task-first
    ↓  立即创建 Feature，避免信息丢失
Phase 0.1: 需求输入
    ↓  支持多格式（MD/Word/Excel/PDF/用户输入）
Phase 0.1.5: 图片需求提取
    ↓  Vision API 提取截图标注
Phase 0.2: 需求质量扫描 + 自动上下文收集 ← 🆕 借鉴 Trellis Auto-Context
    ↓  5 维度评分 + 自动收集代码/配置/依赖
Phase 0.3: PRD 初稿生成
    ↓  基于原始需求 + 上下文
Phase 0.4: PRD 自检
    ↓  C-PRD 评分
Phase 0.5: PRD 补全对话 ← 🆕 融合 dev-planner + Trellis
    ↓  三道门禁 + 一问一答 + 选项优先 + AI 兜底
Phase 0.6: PRD 最终确认
```

---

### 更新后的实施优先级

| 阶段 | 内容 | 借鉴来源 | 工作量 |
|------|------|---------|--------|
| **P0** | Phase 0.0 快速初始化 | Trellis | 0.5 天 |
| **P0** | Phase 0.1 多格式输入 | - | 1 天 |
| **P0** | Phase 0.2 质量扫描 + 自动上下文 | Trellis | 1.5 天 |
| **P1** | Phase 0.5 补全对话（门禁 + 一问一答） | Trellis + dev-planner | 2 天 |
| **P2** | Phase 0.1.5 图片提取 | - | 2 天 |
| **P3** | Word/Excel 解析器 | - | 2 天 |

---

### 关键改进点

1. **Task-first（Trellis）** - 立即创建 Feature，避免需求收集过程中信息丢失
2. **Action-before-asking（Trellis）** - 自动收集上下文，减少低价值问题
3. **Question Gate（Trellis）** - 三道门禁过滤，只问高价值问题
4. **选项优先（dev-planner）** - 检查清单代替开放式问题
5. **AI 兜底（dev-planner）** - 每个问题提供智能推荐

---

**文档版本**: v1.2.0 (融合 Trellis brainstorm)
**更新日期**: 2026-03-05
**状态**: ✅ 设计完成，待实施


---

## 补充：借鉴 superpowers brainstorming skill

### superpowers brainstorming 核心设计

| 原则 | 说明 | 强制性 |
|------|------|--------|
| **Design-before-code** | 任何实现前必须先设计 | HARD-GATE |
| **One question at a time** | 每次只问一个问题 | 强制 |
| **Multiple choice preferred** | 优先多选题 | 推荐 |
| **Propose 2-3 approaches** | 提供多个方案对比 | 强制 |
| **Incremental validation** | 分段验证设计 | 强制 |
| **YAGNI ruthlessly** | 无情删除不必要功能 | 原则 |

---

### 可借鉴到 spec-first 的设计

#### 1. HARD-GATE（硬门禁）

**superpowers 做法**：
```markdown
<HARD-GATE>
Do NOT invoke any implementation skill until you have 
presented a design and the user has approved it.
</HARD-GATE>
```

**spec-first 应用**：
```markdown
## Phase 0 → Phase 1 转换门禁

<HARD-GATE>
未完成以下检查，不得进入 01_specify → 02_design：
- [ ] PRD 已生成且 C-PRD ≥ 85%
- [ ] 用户已确认 PRD
- [ ] 所有 [NEEDS CLARIFICATION] 已解决
</HARD-GATE>
```


#### 2. Incremental Validation（分段验证）

**superpowers 做法**：
```markdown
Present design sections:
- Scale each section to its complexity
- Ask after each section whether it looks right
- Be ready to go back and clarify
```

**spec-first 应用**：
```markdown
## Phase 0.6 增强：分段确认

PRD 最终确认时，分段展示：

1. **业务目标** - 展示 → 确认
2. **功能需求（FR）** - 展示 → 确认
3. **验收标准（AC）** - 展示 → 确认
4. **非功能需求（NFR）** - 展示 → 确认
5. **范围外（OOS）** - 展示 → 确认

每段确认后再展示下一段，避免信息过载。
```

#### 3. Anti-Pattern: "Too Simple To Need Design"

**superpowers 做法**：
```markdown
Every project goes through this process.
"Simple" projects are where unexamined assumptions 
cause the most wasted work.
```

**spec-first 应用**：
```markdown
## 反模式警告

❌ "这个需求很简单，不需要 PRD"
✅ 简单需求更容易隐藏假设，必须走完 Phase 0

即使是 Trivial 复杂度，也必须：
- 生成 PRD（可以很短）
- 用户确认
- 通过 C-PRD 评分
```


#### 4. Checklist-driven Process

**superpowers 做法**：
```markdown
You MUST create a task for each of these items:
1. Explore project context
2. Ask clarifying questions
3. Propose 2-3 approaches
4. Present design
5. Write design doc
6. Transition to implementation
```

**spec-first 应用**：
已在 Phase 0 + Step 0-8 实现，完全对齐 ✅

---

### 四者最终对比

| 维度 | dev-planner | Trellis | superpowers | spec-first 集成 |
|------|-------------|---------|-------------|----------------|
| **目标用户** | 技术小白 | 专业开发者 | 专业开发者 | 专业开发者 |
| **核心原则** | 选项优先 | Action-before-asking | Design-before-code | 质量驱动 |
| **问题策略** | AI 兜底 | Question Gate | One at a time | 三道门禁 + 一问一答 |
| **方案对比** | 2-3 套推荐 | Research-first | 2-3 approaches | Research-first |
| **验证方式** | 最终确认 | 分步更新 PRD | Incremental validation | 分段确认 |
| **门禁机制** | 无 | 无 | HARD-GATE | HARD-GATE + C-PRD |


### 四者融合的最佳实践

```
┌─────────────────────────────────────────────────────────────┐
│                  spec-first Phase 0 融合方案                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Phase 0.0: Feature 快速初始化                               │
│  ← Trellis: Task-first                                      │
│                                                             │
│  Phase 0.1: 需求输入（多格式）                               │
│  ← dev-planner: 多种输入方式                                 │
│                                                             │
│  Phase 0.2: 质量扫描 + 自动上下文                            │
│  ← Trellis: Action-before-asking                            │
│                                                             │
│  Phase 0.3: PRD 初稿生成                                     │
│                                                             │
│  Phase 0.4: PRD 自检                                         │
│  ← superpowers: Anti-pattern 警告                           │
│                                                             │
│  Phase 0.5: PRD 补全对话                                     │
│  ← dev-planner: 选项优先 + AI 兜底                          │
│  ← Trellis: Question Gate + One question/msg               │
│  ← superpowers: Multiple choice preferred                  │
│                                                             │
│  Phase 0.6: PRD 最终确认                                     │
│  ← superpowers: Incremental validation                     │
│                                                             │
│  <HARD-GATE>                                                │
│  ← superpowers: Design-before-code                         │
│  ← spec-first: C-PRD ≥ 85%                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 核心改进汇总

| 改进点 | 来源 | 价值 |
|--------|------|------|
| 立即创建 Feature | Trellis | 避免信息丢失 |
| 自动收集上下文 | Trellis | 减少低价值问题 |
| 三道问题门禁 | Trellis | 只问高价值问题 |
| 严格一问一答 | Trellis + superpowers | 避免信息过载 |
| 选项优先 | dev-planner | 降低决策门槛 |
| AI 兜底推荐 | dev-planner | 减轻决策压力 |
| 分段确认 | superpowers | 渐进式验证 |
| HARD-GATE | superpowers | 强制质量门禁 |
| 多格式输入 | - | 适配产品文档 |

---

**文档版本**: v1.3.0 (融合 superpowers brainstorming)
**更新日期**: 2026-03-05
**状态**: ✅ 设计完成，待实施

---

## 下一步行动

1. **P0 实施**（3 天）
   - Phase 0.0: Feature 快速初始化
   - Phase 0.1: 多格式输入（MD/TXT/用户输入）
   - Phase 0.2: 质量扫描 + 自动上下文

2. **P1 实施**（4 天）
   - Phase 0.5: PRD 补全对话（门禁 + 一问一答）
   - Word/Excel 解析器

3. **P2 实施**（2 天）
   - Phase 0.1.5: 图片需求提取

