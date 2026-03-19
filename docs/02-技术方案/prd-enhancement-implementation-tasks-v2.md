# PRD 增强功能实施任务清单（Claude API 方案）

> **版本**: v2.0.0
> **日期**: 2026-03-05
> **状态**: 待执行
> **参考**: prd-enhancement-final-plan.md
> **变更**: 采用 Claude API 直接解析方案，工期从 16 天缩短到 2 天

---

## 1. 项目概览

### 1.1 目标

实现多格式需求输入支持，解决以下核心问题：
1. ✅ PRD 不规范（当前 8/10 → 目标 10/10）
2. ❌ 格式多样（当前 2/10 → 目标 10/10）**← 核心痛点**
3. ✅ 澄清效率低（当前 9/10 → 目标 10/10）

### 1.2 方案变更

**原方案**（v1.0）：
- 自建解析器（mammoth/xlsx/pdf-parse）
- 单独处理图片（Vision API）
- 工期：16 天

**新方案**（v2.0）⭐：
- 直接用 Claude API 解析整个文件
- 自动处理文档中的图片
- 工期：**2 天**

### 1.3 核心优势

| 维度 | 原方案 | 新方案 | 提升 |
|------|--------|--------|------|
| 工期 | 16 天 | 2 天 | **87.5% ↓** |
| 代码量 | ~1000 行 | ~100 行 | **90% ↓** |
| 依赖库 | 3 个 | 1 个 | **67% ↓** |
| 维护成本 | 高 | 低 | **显著降低** |
| 效果 | 良好 | 优秀 | **更好** |

---

## 2. 架构设计

### 2.1 极简架构

```
src/core/requirement-ingest/
├── types.ts           # 类型定义（50 行）
└── pipeline.ts        # Claude API 调用（100 行）

src/cli/commands/
└── prd.ts            # CLI 命令（50 行）
```

**删除的模块**（不再需要）：
- ❌ parsers/（md/txt/docx/xlsx/pdf 解析器）
- ❌ normalizer.ts（归一化器）
- ❌ image-extractor.ts（图片提取器）

### 2.2 CLI 命令

```bash
# 基本用法
spec-first prd ingest <featureId> --input <file>

# 示例
spec-first prd ingest FSREQ-20260305-FEAT-001 --input requirements.pdf
spec-first prd ingest FSREQ-20260305-FEAT-001 --input requirements.docx
spec-first prd ingest FSREQ-20260305-FEAT-001 --input screenshot.png

# 选项
--input <path>     # 输入文件（支持 pdf/docx/png/jpg）
--force            # 强制覆盖已有文件
```

### 2.3 产物定义

**raw-requirement.md**（唯一产物）：
```yaml
---
feature_id: "FSREQ-20260305-FEAT-001"
source_type: "pdf"
source_paths: ["requirements.pdf"]
generated_at: "2026-03-05T10:00:00Z"
---

## 1. 原始需求摘录
[Claude 提取的完整内容摘要]

## 2. 结构化要点
- 业务目标: ...
- 功能边界: ...
- 约束条件: ...
- 成功标准: ...

## 3. 待澄清项（自动标注）
- [NEEDS CLARIFICATION][BOUNDARY] 用户数量上限？
- [NEEDS CLARIFICATION][TERM] "实时"的定义是什么？
```

---

## 3. 实施任务清单

**总工期**: 2 天

---

### TASK-001: 类型定义 [0.25d]

**文件**: `src/core/requirement-ingest/types.ts`

```typescript
export type SourceType = 'pdf' | 'docx' | 'png' | 'jpg' | 'jpeg' | 'txt' | 'md';

export interface IngestOptions {
  featureId: string;
  projectRoot: string;
  inputPath: string;
  force?: boolean;
}

export interface IngestResult {
  rawRequirementPath: string;
  summary: {
    success: boolean;
    error?: string;
  };
}
```

**验收标准**:
- [ ] 类型定义完整
- [ ] 通过 `npm run typecheck`

---

### TASK-002: Claude API 集成 [0.75d]

**文件**: `src/core/requirement-ingest/pipeline.ts`

**核心实现**:
```typescript
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { writeMarkdown, exists } from '../../shared/fs-utils.js';
import type { IngestOptions, IngestResult } from './types.js';

const EXTRACTION_PROMPT = `请分析这份需求文档，提取以下信息：

## 1. 原始需求摘录
[完整内容摘要，保留关键细节]

## 2. 结构化要点
- 业务目标: 
- 功能边界: 
- 约束条件: 
- 成功标准: 

## 3. 待澄清项（自动标注）
[格式：[NEEDS CLARIFICATION][类型] 问题描述]
[类型可选：BOUNDARY/TERM/SEMANTIC/ERROR/PRIORITY/DEPENDENCY]

请用 Markdown 格式输出。`;

export async function ingestRequirement(opts: IngestOptions): Promise<IngestResult> {
  const featureDir = join(opts.projectRoot, 'specs', opts.featureId);
  const rawReqPath = join(featureDir, 'raw-requirement.md');
  
  // 检查是否已存在
  if (exists(rawReqPath) && !opts.force) {
    throw new Error('raw-requirement.md already exists, use --force to overwrite');
  }
  
  try {
    // 读取文件
    const buffer = readFileSync(opts.inputPath);
    const base64 = buffer.toString('base64');
    const mediaType = getMediaType(opts.inputPath);
    
    // 调用 Claude API
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64,
            },
          },
          {
            type: 'text',
            text: EXTRACTION_PROMPT,
          },
        ],
      }],
    });
    
    // 提取响应
    const content = message.content[0];
    const extractedText = content.type === 'text' ? content.text : '';
    
    // 生成产物
    const output = generateRawRequirementMd({
      featureId: opts.featureId,
      sourceType: getSourceType(opts.inputPath),
      sourcePath: opts.inputPath,
      content: extractedText,
    });
    
    writeMarkdown(rawReqPath, output);
    
    return {
      rawRequirementPath: rawReqPath,
      summary: { success: true },
    };
  } catch (error) {
    return {
      rawRequirementPath: rawReqPath,
      summary: { success: false, error: String(error) },
    };
  }
}

function getMediaType(path: string): string {
  if (path.endsWith('.pdf')) return 'application/pdf';
  if (path.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
  return 'text/plain';
}

function getSourceType(path: string): string {
  return path.split('.').pop()?.toLowerCase() || 'unknown';
}

function generateRawRequirementMd(params: {
  featureId: string;
  sourceType: string;
  sourcePath: string;
  content: string;
}): string {
  return `---
feature_id: "${params.featureId}"
source_type: "${params.sourceType}"
source_paths: ["${params.sourcePath}"]
generated_at: "${new Date().toISOString()}"
---

${params.content}
`;
}
```

**验收标准**:
- [ ] 支持 pdf/docx/png/jpg 格式
- [ ] 正确调用 Claude API
- [ ] 生成符合契约的 raw-requirement.md
- [ ] 错误处理完善

---

### TASK-003: CLI 命令实现 [0.5d]

**文件**: `src/cli/commands/prd.ts`

```typescript
import { ingestRequirement } from '../../core/requirement-ingest/pipeline.js';

export async function prdCommand(args: {
  subcommand: string;
  featureId?: string;
  input?: string;
  force?: boolean;
  projectRoot: string;
}): Promise<void> {
  if (args.subcommand !== 'ingest') {
    console.error('Unknown subcommand. Usage: spec-first prd ingest <featureId> --input <file>');
    process.exit(1);
  }
  
  if (!args.featureId || !args.input) {
    console.error('Missing required arguments: featureId and --input');
    process.exit(1);
  }
  
  console.log(`📄 Ingesting requirement from: ${args.input}`);
  
  const result = await ingestRequirement({
    featureId: args.featureId,
    projectRoot: args.projectRoot,
    inputPath: args.input,
    force: args.force,
  });
  
  if (result.summary.success) {
    console.log(`✅ Generated: ${result.rawRequirementPath}`);
  } else {
    console.error(`❌ Failed: ${result.summary.error}`);
    process.exit(1);
  }
}
```

**注册命令**（`src/cli/index.ts`）:
```typescript
import { prdCommand } from './commands/prd.js';

// 在 main() 中添加
if (command === 'prd') {
  await prdCommand({
    subcommand: argv._[1] as string,
    featureId: argv._[2] as string,
    input: argv.input as string,
    force: argv.force as boolean,
    projectRoot,
  });
  return;
}
```

**验收标准**:
- [ ] 命令可执行
- [ ] 参数解析正确
- [ ] 输出友好

---

### TASK-004: 错误处理与重试 [0.25d]

**文件**: `src/core/requirement-ingest/pipeline.ts`

**增强点**:
```typescript
// 复用现有重试逻辑
import { retryWithBackoff } from '../ai-orchestrator/retry-controller.js';

export async function ingestRequirement(opts: IngestOptions): Promise<IngestResult> {
  // ... 前置检查
  
  try {
    // 带重试的 API 调用
    const message = await retryWithBackoff(
      () => callClaudeAPI(opts),
      { maxRetries: 3, backoffMs: 2000 },
      (error) => isRetryable(error)
    );
    
    // ... 后续处理
  } catch (error) {
    // 降级提示
    console.error('❌ Parse failed. Please paste content manually or check file format.');
    return { rawRequirementPath, summary: { success: false, error: String(error) } };
  }
}

function isRetryable(error: unknown): boolean {
  const msg = String(error).toLowerCase();
  return msg.includes('timeout') || msg.includes('rate limit') || msg.includes('network');
}
```

**验收标准**:
- [ ] 网络错误自动重试
- [ ] 失败时提供降级提示
- [ ] 错误信息清晰

---

### TASK-005: 测试 [0.25d]

**测试文件**: `tests/integration/prd-ingest.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ingestRequirement } from '../../src/core/requirement-ingest/pipeline.js';
import { join } from 'node:path';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';

describe('prd ingest', () => {
  const testRoot = join(__dirname, '../fixtures/prd-ingest-test');
  const featureId = 'TEST-001';
  
  beforeEach(() => {
    mkdirSync(join(testRoot, 'specs', featureId), { recursive: true });
  });
  
  afterEach(() => {
    rmSync(testRoot, { recursive: true, force: true });
  });
  
  it('should ingest pdf file', async () => {
    const result = await ingestRequirement({
      featureId,
      projectRoot: testRoot,
      inputPath: join(__dirname, '../fixtures/sample.pdf'),
    });
    
    expect(result.summary.success).toBe(true);
    expect(result.rawRequirementPath).toContain('raw-requirement.md');
  });
  
  it('should handle missing API key', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    
    const result = await ingestRequirement({
      featureId,
      projectRoot: testRoot,
      inputPath: join(__dirname, '../fixtures/sample.pdf'),
    });
    
    expect(result.summary.success).toBe(false);
    expect(result.summary.error).toContain('API key');
  });
});
```

**验收标准**:
- [ ] 集成测试通过
- [ ] 覆盖正常和异常场景

---

## 4. 验收标准（DoD）

### 4.1 功能完整性

- [ ] 支持 pdf/docx/png/jpg 四种格式
- [ ] 生成符合契约的 raw-requirement.md
- [ ] CLI 命令可正常执行
- [ ] 自动识别文档中的图片内容

### 4.2 质量标准

- [ ] 单元测试覆盖率 >= 75%
- [ ] 集成测试通过
- [ ] 类型检查通过 `npm run typecheck`
- [ ] Lint 检查通过 `npm run lint`

### 4.3 稳定性标准

- [ ] API 调用失败可重试（最多 3 次）
- [ ] 失败时提供降级提示
- [ ] 错误信息清晰可追溯

### 4.4 文档标准

- [ ] CHANGELOG.md 已更新
- [ ] prd-enhancement-final-plan.md 已更新（标记为已实现）
- [ ] 用户使用文档已补充

---

## 5. 实施计划

### 5.1 时间线（2 天）

```
Day 1:
  上午: TASK-001 + TASK-002（类型定义 + Claude API 集成）
  下午: TASK-003（CLI 命令实现）
  
Day 2:
  上午: TASK-004（错误处理与重试）
  下午: TASK-005（测试）+ 文档更新
```

### 5.2 检查点

**Day 1 EOD**:
- [ ] Claude API 调用正常工作
- [ ] CLI 命令可执行
- [ ] 至少支持 pdf 格式

**Day 2 EOD**:
- [ ] 所有格式支持完成
- [ ] 测试通过
- [ ] 文档更新完成

---

## 6. 风险管理

### 6.1 技术风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|---------|
| Claude API 不稳定 | 高 | 低 | 重试机制 + 降级提示 |
| API 成本过高 | 中 | 低 | 每文档约 $0.01-0.05，可接受 |
| 不支持某些格式 | 中 | 低 | 提示用户转换格式 |
| API key 泄露 | 高 | 低 | 使用环境变量，不提交代码 |

### 6.2 应急预案

**场景 1**: Claude API 不可用
- 措施：提示用户手工粘贴内容到 raw-requirement.md

**场景 2**: 解析效果不理想
- 措施：优化 EXTRACTION_PROMPT，增加示例

**场景 3**: 成本超预期
- 措施：增加本地缓存，避免重复解析

---

## 7. 附录

### 7.1 依赖库

| 库 | 版本 | 用途 | 许可证 |
|----|------|------|--------|
| @anthropic-ai/sdk | ^0.20.0 | Claude API 调用 | MIT |

**安装**:
```bash
npm install @anthropic-ai/sdk
```

### 7.2 环境变量

```bash
# .env
ANTHROPIC_API_KEY=sk-ant-xxx
```

### 7.3 使用示例

**场景 1: 解析 PDF 需求文档**
```bash
spec-first prd ingest FSREQ-20260305-FEAT-001 --input requirements.pdf
```

**场景 2: 解析 Word 文档**
```bash
spec-first prd ingest FSREQ-20260305-FEAT-001 --input requirements.docx
```

**场景 3: 解析需求截图**
```bash
spec-first prd ingest FSREQ-20260305-FEAT-001 --input screenshot.png
```

**场景 4: 强制覆盖已有文件**
```bash
spec-first prd ingest FSREQ-20260305-FEAT-001 --input requirements.pdf --force
```

### 7.4 故障排查

**问题 1**: API key 未设置
```
Error: ANTHROPIC_API_KEY not found
```
解决：设置环境变量 `export ANTHROPIC_API_KEY=sk-ant-xxx`

**问题 2**: 文件格式不支持
```
Error: Unsupported file format
```
解决：转换为 pdf/docx/png/jpg 格式

**问题 3**: API 调用超时
```
Error: Request timeout
```
解决：检查网络连接，自动重试 3 次

---

## 8. 成本分析

### 8.1 API 成本估算

**Claude 3.5 Sonnet 定价**:
- 输入：$3 / 1M tokens
- 输出：$15 / 1M tokens

**典型文档成本**:
| 文档类型 | 大小 | 输入 tokens | 输出 tokens | 成本 |
|---------|------|------------|------------|------|
| PDF (10页) | 2MB | ~8K | ~2K | $0.05 |
| Word (5页) | 500KB | ~4K | ~2K | $0.04 |
| 截图 | 200KB | ~2K | ~1K | $0.02 |

**月度成本估算**（假设 100 个需求/月）:
- 100 文档 × $0.04 = **$4/月**

### 8.2 ROI 分析

**人工成本对比**:
- 人工整理需求：30 分钟/文档 × 100 文档 = 50 小时/月
- 自动化处理：1 分钟/文档 × 100 文档 = 1.67 小时/月
- **节省时间**：48.33 小时/月

**成本收益**:
- API 成本：$4/月
- 人力节省：48 小时 × $50/小时 = $2400/月
- **ROI**: 600:1

---

## 9. 总结

### 9.1 方案对比

| 维度 | v1.0 原方案 | v2.0 Claude 方案 | 提升 |
|------|------------|-----------------|------|
| **工期** | 16 天 | 2 天 | **87.5% ↓** |
| **代码量** | ~1000 行 | ~150 行 | **85% ↓** |
| **依赖库** | 3 个 | 1 个 | **67% ↓** |
| **维护成本** | 高 | 极低 | **显著降低** |
| **格式支持** | 5 种 | 4 种 | 略少但够用 |
| **图片识别** | 需单独处理 | 自动识别 | **更简单** |
| **效果** | 良好 | 优秀 | **更好** |
| **成本** | 开发成本高 | API $4/月 | **极低** |

### 9.2 交付物清单

**代码模块**:
- [ ] `src/core/requirement-ingest/types.ts`
- [ ] `src/core/requirement-ingest/pipeline.ts`
- [ ] `src/cli/commands/prd.ts`

**测试文件**:
- [ ] `tests/integration/prd-ingest.test.ts`

**文档**:
- [ ] CHANGELOG.md 更新
- [ ] prd-enhancement-final-plan.md 更新
- [ ] 用户使用文档

### 9.3 成功指标

**功能指标**:
- 格式支持度：2/10 → 10/10（支持 4 种主流格式）
- 解析成功率：>= 95%（Claude 能力保证）
- 图片识别准确率：>= 90%

**效率指标**:
- PRD 生成时间：< 60 秒/文档
- 人工时间节省：> 95%
- 月度成本：< $10

### 9.4 后续优化方向

**短期（1 月内）**:
- 增加本地缓存（避免重复解析）
- 优化 prompt（提升提取质量）
- 增加更多文件格式支持

**中期（3 月内）**:
- 集成到 spec-first:spec 流程（Phase 0.1）
- 增加批量处理能力
- 增加解析质量评分

**长期（6 月内）**:
- 基于历史数据优化 prompt
- 增加需求模板库
- 自动生成 PRD 初稿

---

## 10. 参考文档

- [prd-enhancement-final-plan.md](./prd-enhancement-final-plan.md) - 原技术方案
- [prd-enhancement-implementation-tasks.md.backup](./prd-enhancement-implementation-tasks.md.backup) - v1.0 任务清单（备份）
- [CLAUDE.md](../../CLAUDE.md) - 项目规范
- [Anthropic API 文档](https://docs.anthropic.com/claude/reference/messages_post)

---

**文档版本**: v2.0.0
**最后更新**: 2026-03-05
**维护者**: 开发团队
**变更说明**: 采用 Claude API 直接解析方案，大幅简化实现

