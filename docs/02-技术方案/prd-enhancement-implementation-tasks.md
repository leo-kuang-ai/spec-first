# PRD 增强功能实施任务清单

> **版本**: v1.0.0
> **日期**: 2026-03-05
> **状态**: 待执行
> **参考**: prd-enhancement-final-plan.md

---

## 1. 项目概览

### 1.1 目标

实现多格式需求输入支持，解决以下核心问题：
1. ✅ PRD 不规范（当前 8/10 → 目标 10/10）
2. ❌ 格式多样（当前 2/10 → 目标 10/10）**← 核心痛点**
3. ✅ 澄清效率低（当前 9/10 → 目标 10/10）

### 1.2 实施策略

采用分阶段交付（M1-M4），优先解决格式多样性问题：

| Milestone | 交付内容 | 工期 | 优先级 |
|-----------|---------|------|--------|
| M1 | md/txt 解析管道 | 2 天 | P0 |
| M2 | docx/xlsx/pdf 解析 | 5 天 | P0 |
| M3 | Vision 图片提取 | 3 天 | P1 |
| M4 | 配置化与稳定性 | 3 天 | P1 |

**总工期**: 13 天（开发）+ 3 天（测试）= 16 天

---

## 2. 架构设计

### 2.1 模块划分

```
src/core/requirement-ingest/
├── types.ts                    # 类型定义
├── pipeline.ts                 # 编排层
├── normalizer.ts               # 归一化器
├── image-extractor.ts          # Vision 提取
└── parsers/
    ├── md-parser.ts            # Markdown 解析
    ├── txt-parser.ts           # 纯文本解析
    ├── docx-parser.ts          # Word 解析
    ├── xlsx-parser.ts          # Excel 解析
    └── pdf-parser.ts           # PDF 解析
```

### 2.2 CLI 命令

```bash
# 新增命令
spec-first prd ingest <featureId> [options]

# 选项
--input <path>          # 输入文件路径（支持 md/txt/docx/xlsx/pdf）
--input-text <text>     # 直接输入文本
--vision <strategy>     # 图片提取策略：all/sample/skip（默认 auto）
--force                 # 强制覆盖已有 raw-requirement.md
```

### 2.3 产物定义

**raw-requirement.md**（必产物）：
```yaml
---
feature_id: "FSREQ-20260305-FEAT-001"
source_type: "docx"
source_paths: ["requirements.docx"]
parser_summary:
  total: 1
  success: 1
  failed: 0
generated_at: "2026-03-05T10:00:00Z"
---

## 1. 原始需求摘录
[解析后的原始内容]

## 2. 结构化要点
- 业务目标: ...
- 功能边界: ...
- 约束条件: ...

## 3. 待澄清项（自动标注）
- [NEEDS CLARIFICATION][BOUNDARY] 用户数量上限？
```

**image-requirements.md**（可选产物）：
```yaml
---
vision_model: "gpt-4-vision"
strategy: "sample"
image_count_total: 15
image_count_processed: 5
generated_at: "2026-03-05T10:05:00Z"
---

## 图片需求提取

### IMG-001
- 位置: requirements.docx, page 3
- 提取结论: 用户登录流程图，包含 OAuth 认证步骤
- 置信度: 0.92
- 状态: SUCCESS

### IMG-002
- 位置: requirements.docx, page 5
- 提取结论: 数据库 ER 图
- 置信度: 0.88
- 状态: SUCCESS
```

---

## 3. Milestone 1: 基础管道（M1）

### 3.1 目标

建立需求输入管道基础架构，支持 md/txt 格式。

**工期**: 2 天 | **优先级**: P0

### 3.2 任务清单

#### TASK-M1-001: 类型定义 [0.5d]

**文件**: `src/core/requirement-ingest/types.ts`

**核心类型**:
```typescript
export type SourceType = 'text' | 'md' | 'docx' | 'xlsx' | 'pdf' | 'mixed';
export type VisionStrategy = 'all' | 'sample' | 'skip';

export interface RequirementBlock {
  type: 'heading' | 'paragraph' | 'list' | 'table' | 'code';
  content: string;
  metadata?: Record<string, unknown>;
}

export interface ParseResult {
  success: boolean;
  blocks: RequirementBlock[];
  error?: string;
}

export interface IngestOptions {
  featureId: string;
  projectRoot: string;
  inputPath?: string;
  inputText?: string;
  visionStrategy?: VisionStrategy;
  force?: boolean;
}
```

**验收标准**:
- [ ] 类型定义完整
- [ ] 通过 `npm run typecheck`

---

#### TASK-M1-002: Markdown 解析器 [0.5d]

**文件**: `src/core/requirement-ingest/parsers/md-parser.ts`

**实现要点**:
- 解析标题（#）、段落、列表（- / *）
- 返回 RequirementBlock 数组
- 处理空输入不崩溃

**验收标准**:
- [ ] 单元测试覆盖率 >= 80%
- [ ] 处理边界情况（空文件、损坏格式）

---

#### TASK-M1-003: 纯文本解析器 [0.25d]

**文件**: `src/core/requirement-ingest/parsers/txt-parser.ts`

**实现要点**:
- 按段落分割（\n\n）
- 每段作为一个 paragraph block

**验收标准**:
- [ ] 单元测试覆盖率 >= 80%

---

#### TASK-M1-004: 归一化器 [0.5d]

**文件**: `src/core/requirement-ingest/normalizer.ts`

**功能**:
1. 提取结构化要点（列表项）
2. 自动识别待澄清项（包含 ?/待定/TBD/TODO）
3. 生成原始内容摘录

**验收标准**:
- [ ] 正确提取要点
- [ ] 自动标注待澄清项
- [ ] 单元测试覆盖率 >= 80%

---

#### TASK-M1-005: 管道编排层 [0.25d]

**文件**: `src/core/requirement-ingest/pipeline.ts`

**功能**:
- 路由到对应 parser（md/txt）
- 调用 normalizer
- 生成 raw-requirement.md
- 写入 findings.md 审计记录

**验收标准**:
- [ ] 支持 --input 和 --input-text
- [ ] 生成符合契约的 raw-requirement.md
- [ ] 集成测试通过

---

## 4. Milestone 2: 多格式解析（M2）

### 4.1 目标

支持 Word/Excel/PDF 格式解析，覆盖主流需求文档格式。

**工期**: 5 天 | **优先级**: P0

### 4.2 依赖安装

```bash
npm install mammoth xlsx pdf-parse
npm install -D @types/pdf-parse
```

### 4.3 任务清单

#### TASK-M2-001: Word 解析器 [1.5d]

**文件**: `src/core/requirement-ingest/parsers/docx-parser.ts`

**依赖**: `mammoth`

**实现要点**:
```typescript
import mammoth from 'mammoth';
import type { ParseResult } from '../types.js';

export async function parseDocx(filePath: string): Promise<ParseResult> {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    const blocks = result.value.split('\n\n')
      .filter(Boolean)
      .map(para => ({ type: 'paragraph' as const, content: para.trim() }));
    return { success: true, blocks };
  } catch (error) {
    return { success: false, blocks: [], error: String(error) };
  }
}
```

**验收标准**:
- [ ] 正确提取文本内容
- [ ] 处理损坏文件返回错误
- [ ] 单元测试覆盖率 >= 75%

---

#### TASK-M2-002: Excel 解析器 [1.5d]

**文件**: `src/core/requirement-ingest/parsers/xlsx-parser.ts`

**依赖**: `xlsx`

**实现要点**:
- 读取所有 sheet
- 每个 sheet 作为一个 table block
- 提取单元格文本

**验收标准**:
- [ ] 支持多 sheet 解析
- [ ] 正确提取表格数据
- [ ] 单元测试覆盖率 >= 75%

---

#### TASK-M2-003: PDF 解析器 [1.5d]

**文件**: `src/core/requirement-ingest/parsers/pdf-parser.ts`

**依赖**: `pdf-parse`

**实现要点**:
- 提取文本内容
- 按页分割（可选）
- 处理加密 PDF 返回错误

**验收标准**:
- [ ] 正确提取文本
- [ ] 处理加密/损坏文件
- [ ] 单元测试覆盖率 >= 75%

---

#### TASK-M2-004: 管道集成 [0.5d]

**文件**: `src/core/requirement-ingest/pipeline.ts`

**修改点**:
- 增加文件类型检测（扩展名 + MIME）
- 路由到对应 parser（docx/xlsx/pdf）
- 处理异步解析

**验收标准**:
- [ ] 自动识别文件类型
- [ ] 集成测试通过

---

## 5. Milestone 3: Vision 图片提取（M3）

### 5.1 目标

支持图片需求提取，使用 Vision API 识别图片内容。

**工期**: 3 天 | **优先级**: P1

### 5.2 任务清单

#### TASK-M3-001: Vision 提取器 [1.5d]

**文件**: `src/core/requirement-ingest/image-extractor.ts`

**实现要点**:
- 调用 Vision API（OpenAI gpt-4-vision 或 Anthropic Claude）
- 指数退避重试（最多 3 次）
- 生成 image-requirements.md

**核心逻辑**:
```typescript
export async function extractImages(opts: {
  featureId: string;
  projectRoot: string;
  imagePaths: string[];
  strategy: VisionStrategy;
}): Promise<ImageExtractionResult> {
  const { strategy, imagePaths } = opts;
  
  // 策略判定
  if (strategy === 'skip' || imagePaths.length === 0) {
    return { processed: 0, total: imagePaths.length, results: [] };
  }
  
  const toProcess = strategy === 'sample' 
    ? imagePaths.slice(0, Math.min(5, imagePaths.length))
    : imagePaths;
  
  const results = [];
  for (const imgPath of toProcess) {
    const result = await extractSingleImage(imgPath);
    results.push(result);
  }
  
  return { processed: results.length, total: imagePaths.length, results };
}
```

**验收标准**:
- [ ] 支持 all/sample/skip 策略
- [ ] 重试机制正常工作
- [ ] 失败不阻断主流程

---

#### TASK-M3-002: 用户确认机制 [0.5d]

**文件**: `src/core/requirement-ingest/pipeline.ts`

**实现要点**:
- 检测输入是否包含图片
- <=10 张：提示用户确认（默认 all）
- >10 张：强制用户选择 all/sample/skip
- 未确认则跳过

**验收标准**:
- [ ] 正确触发确认流程
- [ ] 用户拒绝时跳过 Vision

---

#### TASK-M3-003: 产物生成 [0.5d]

**文件**: `src/core/requirement-ingest/image-extractor.ts`

**功能**:
- 生成 image-requirements.md
- 记录每张图片的提取结果
- 包含失败清单

**验收标准**:
- [ ] 产物符合契约格式
- [ ] 包含完整元信息

---

#### TASK-M3-004: 集成测试 [0.5d]

**测试场景**:
- 无图片输入 → 跳过 Vision
- 有图片 + 用户确认 → 执行提取
- 有图片 + 用户拒绝 → 跳过
- Vision 失败 → 记录失败但不阻断

**验收标准**:
- [ ] 所有场景测试通过

---

## 6. Milestone 4: 配置化与稳定性（M4）

### 6.1 目标

完善配置项、错误处理、测试覆盖，达到生产级稳定性。

**工期**: 3 天 | **优先级**: P1

### 6.2 任务清单

#### TASK-M4-001: 配置项设计 [1d]

**文件**: `src/shared/config-schema.ts`

**新增配置段**:
```typescript
export interface RequirementIngestConfig {
  enabled_formats: Array<'md' | 'txt' | 'docx' | 'xlsx' | 'pdf'>;
  parser_retry_max: number;
  vision_retry_max: number;
  vision_backoff_ms: number;
  image_extract_threshold: number;
  image_extract_default_strategy: VisionStrategy;
  exclude_globs: string[];
}

// 添加到 SpecFirstConfig
export interface SpecFirstConfig {
  // ... 现有字段
  requirement_ingest?: RequirementIngestConfig;
}

// 默认配置
const DEFAULT_REQUIREMENT_INGEST: RequirementIngestConfig = {
  enabled_formats: ['md', 'txt', 'docx', 'xlsx', 'pdf'],
  parser_retry_max: 2,
  vision_retry_max: 3,
  vision_backoff_ms: 2000,
  image_extract_threshold: 10,
  image_extract_default_strategy: 'sample',
  exclude_globs: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
};
```

**验收标准**:
- [ ] 配置项完整
- [ ] 范围校验（与 auto_orchestrate 一致）
- [ ] 默认值可直接运行

---

#### TASK-M4-002: 错误处理与降级 [1d]

**文件**: `src/core/requirement-ingest/error-handler.ts`

**实现要点**:
- 错误分类：permanent / temporary / unknown
- 重试逻辑：复用 `retry-controller.ts`
- 降级策略：解析失败 → 提示手工粘贴

**核心逻辑**:
```typescript
import { retryWithBackoff } from '../ai-orchestrator/retry-controller.js';

export async function parseWithRetry(
  parser: () => Promise<ParseResult>,
  maxRetries: number
): Promise<ParseResult> {
  return retryWithBackoff(
    parser,
    { maxRetries, backoffMs: 1000 },
    (error) => classifyError(error) === 'temporary'
  );
}

function classifyError(error: unknown): 'permanent' | 'temporary' | 'unknown' {
  const msg = String(error).toLowerCase();
  if (msg.includes('not found') || msg.includes('permission')) return 'permanent';
  if (msg.includes('timeout') || msg.includes('network')) return 'temporary';
  return 'unknown';
}
```

**验收标准**:
- [ ] 重试逻辑正常工作
- [ ] 降级路径可用
- [ ] 单元测试覆盖率 >= 80%

---

#### TASK-M4-003: CLI 命令实现 [0.5d]

**文件**: `src/cli/commands/prd.ts`

**命令定义**:
```typescript
import { ingestRequirement } from '../../core/requirement-ingest/pipeline.js';

export async function prdIngestCommand(args: {
  featureId: string;
  input?: string;
  inputText?: string;
  vision?: string;
  force?: boolean;
  projectRoot: string;
}): Promise<void> {
  const result = await ingestRequirement({
    featureId: args.featureId,
    projectRoot: args.projectRoot,
    inputPath: args.input,
    inputText: args.inputText,
    visionStrategy: (args.vision as VisionStrategy) || 'auto',
    force: args.force || false,
  });
  
  console.log(`✅ Generated: ${result.rawRequirementPath}`);
  if (result.imageRequirementPath) {
    console.log(`✅ Generated: ${result.imageRequirementPath}`);
  }
  console.log(`📊 Summary: ${result.summary.successCount}/${result.summary.totalSources} succeeded`);
}
```

**注册命令** (`src/cli/index.ts`):
```typescript
import { prdIngestCommand } from './commands/prd.js';

// 在 registerCommands() 中添加
registerCommand('prd', 'PRD management commands', async (argv) => {
  const subcommand = argv._[1];
  if (subcommand === 'ingest') {
    await prdIngestCommand({ ... });
  }
});
```

**验收标准**:
- [ ] 命令可执行
- [ ] 参数解析正确
- [ ] 输出友好

---

#### TASK-M4-004: 回归测试 [0.5d]

**测试文件**: `tests/integration/prd-ingest.test.ts`

**测试场景**:
- md/txt/docx/xlsx/pdf 各格式解析
- 解析失败降级
- Vision 提取（mock API）
- 配置项生效

**验收标准**:
- [ ] 集成测试覆盖率 >= 80%
- [ ] E2E 测试通过

---

## 7. 测试策略

### 7.1 单元测试

**目标覆盖率**: >= 75%（与项目标准一致）

**测试文件结构**:
```
tests/unit/
├── requirement-ingest/
│   ├── md-parser.test.ts
│   ├── txt-parser.test.ts
│   ├── docx-parser.test.ts
│   ├── xlsx-parser.test.ts
│   ├── pdf-parser.test.ts
│   ├── normalizer.test.ts
│   ├── image-extractor.test.ts
│   └── error-handler.test.ts
```

**关键测试场景**:
- 正常输入 → 正确解析
- 空输入 → 返回空结果
- 损坏文件 → 返回错误
- 边界情况 → 不崩溃

---

### 7.2 集成测试

**测试文件**: `tests/integration/prd-ingest.test.ts`

**测试场景**:
```typescript
describe('prd ingest command', () => {
  it('should parse markdown file', async () => {
    const result = await ingestRequirement({
      featureId: 'TEST-001',
      projectRoot: testRoot,
      inputPath: 'fixtures/requirements.md',
    });
    expect(result.summary.successCount).toBe(1);
    expect(exists(result.rawRequirementPath)).toBe(true);
  });

  it('should parse docx file', async () => { ... });
  
  it('should handle parse failure gracefully', async () => { ... });
  
  it('should extract images when enabled', async () => { ... });
});
```

---

### 7.3 E2E 测试

**测试文件**: `tests/e2e/prd-phase0.test.ts`

**测试场景**:
- 从原始需求到 prd.md 的 Phase 0 闭环
- Vision 失败但主流程继续推进
- 配置项生效验证

---

## 8. 验收标准（DoD）

### 8.1 功能完整性

- [ ] 支持 md/txt/docx/xlsx/pdf 五种格式
- [ ] 生成符合契约的 raw-requirement.md
- [ ] 生成 image-requirements.md（有图片时）
- [ ] CLI 命令可正常执行
- [ ] 配置项可生效

### 8.2 质量标准

- [ ] 单元测试覆盖率 >= 75%
- [ ] 集成测试覆盖率 >= 80%
- [ ] E2E 测试通过
- [ ] 所有测试通过 `npm test`
- [ ] 类型检查通过 `npm run typecheck`
- [ ] Lint 检查通过 `npm run lint`

### 8.3 稳定性标准

- [ ] 解析失败可重试
- [ ] 解析失败可降级（提示手工粘贴）
- [ ] Vision 失败不阻断主流程
- [ ] 错误信息清晰可追溯
- [ ] findings.md 记录完整审计日志

### 8.4 文档标准

- [ ] CHANGELOG.md 已更新
- [ ] prd-enhancement-final-plan.md 第 8.1 章已更新（M1+M2 移到 As-Is）
- [ ] README 或用户文档已补充使用说明

---

## 9. 实施计划

### 9.1 时间线（16 天）

```
Week 1 (Day 1-5):
  Day 1-2: M1 基础管道
  Day 3-5: M2 多格式解析（docx/xlsx）
  
Week 2 (Day 6-10):
  Day 6-7: M2 多格式解析（pdf + 集成）
  Day 8-10: M3 Vision 图片提取
  
Week 3 (Day 11-16):
  Day 11-13: M4 配置化与稳定性
  Day 14-16: 回归测试 + 文档更新
```

### 9.2 里程碑检查点

**M1 完成检查点**（Day 2）:
- [ ] md/txt 解析正常工作
- [ ] raw-requirement.md 可生成
- [ ] 单元测试通过

**M2 完成检查点**（Day 7）:
- [ ] docx/xlsx/pdf 解析正常工作
- [ ] 集成测试通过
- [ ] 错误处理可用

**M3 完成检查点**（Day 10）:
- [ ] Vision 提取可用
- [ ] 用户确认机制正常
- [ ] image-requirements.md 可生成

**M4 完成检查点**（Day 13）:
- [ ] 配置项生效
- [ ] CLI 命令可用
- [ ] 所有测试通过

---

## 10. 风险管理

### 10.1 技术风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|---------|
| mammoth/xlsx/pdf-parse 库不稳定 | 高 | 中 | 充分测试 + 降级到手工粘贴 |
| Vision API 成本过高 | 中 | 中 | 默认 sample 策略 + 用户确认 |
| 解析复杂格式失败率高 | 中 | 高 | 重试机制 + 降级路径 |
| 依赖库体积过大 | 低 | 低 | 按需加载（dynamic import） |

### 10.2 进度风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|---------|
| M2 解析器开发超期 | 高 | 中 | 优先 docx，pdf 可延后 |
| Vision API 集成复杂 | 中 | 中 | M3 可独立交付，不阻断 M1+M2 |
| 测试覆盖不足 | 中 | 低 | 预留 3 天测试时间 |

### 10.3 应急预案

**场景 1**: M2 开发超期 2 天
- 措施：先交付 M1+docx，xlsx/pdf 延后到 M2.1

**场景 2**: Vision API 不可用
- 措施：跳过 M3，先交付 M1+M2，M3 作为独立迭代

**场景 3**: 测试覆盖率不达标
- 措施：延长 1-2 天补充测试用例

---

## 11. 附录

### 11.1 依赖库选型

| 库 | 版本 | 用途 | 许可证 | 备注 |
|----|------|------|--------|------|
| mammoth | ^1.6.0 | Word 解析 | BSD-2-Clause | 稳定，社区活跃 |
| xlsx | ^0.18.5 | Excel 解析 | Apache-2.0 | 功能完整 |
| pdf-parse | ^1.1.1 | PDF 解析 | MIT | 轻量级 |

### 11.2 配置示例

**`.spec-first/meta/config.yaml`**:
```yaml
requirement_ingest:
  enabled_formats: ['md', 'txt', 'docx', 'xlsx', 'pdf']
  parser_retry_max: 2
  vision_retry_max: 3
  vision_backoff_ms: 2000
  image_extract_threshold: 10
  image_extract_default_strategy: 'sample'
  exclude_globs:
    - '**/node_modules/**'
    - '**/dist/**'
    - '**/.git/**'
```

### 11.3 使用示例

**场景 1: 解析 Word 文档**
```bash
spec-first prd ingest FSREQ-20260305-FEAT-001 --input requirements.docx
```

**场景 2: 直接输入文本**
```bash
spec-first prd ingest FSREQ-20260305-FEAT-001 --input-text "用户需要登录功能..."
```

**场景 3: 解析带图片的文档**
```bash
spec-first prd ingest FSREQ-20260305-FEAT-001 --input requirements.pdf --vision all
```

### 11.4 故障排查

**问题 1**: 解析 docx 失败
- 检查文件是否损坏
- 尝试用 Word 打开并另存为
- 查看 findings.md 中的错误日志

**问题 2**: Vision API 超时
- 检查网络连接
- 减少图片数量（使用 sample 策略）
- 查看重试日志

**问题 3**: raw-requirement.md 已存在
- 使用 `--force` 强制覆盖
- 或手动删除后重新执行

---

## 12. 总结

### 12.1 交付物清单

**代码模块**:
- [ ] `src/core/requirement-ingest/` 完整模块
- [ ] `src/cli/commands/prd.ts` CLI 命令
- [ ] `src/shared/config-schema.ts` 配置扩展

**测试文件**:
- [ ] `tests/unit/requirement-ingest/` 单元测试
- [ ] `tests/integration/prd-ingest.test.ts` 集成测试
- [ ] `tests/e2e/prd-phase0.test.ts` E2E 测试

**文档**:
- [ ] CHANGELOG.md 更新
- [ ] prd-enhancement-final-plan.md 更新（As-Is 章节）
- [ ] 用户使用文档

### 12.2 成功指标

**功能指标**:
- 格式支持度：2/10 → 10/10（支持 5 种格式）
- 解析成功率：>= 90%（正常文件）
- Vision 提取成功率：>= 80%（正常图片）

**质量指标**:
- 单元测试覆盖率：>= 75%
- 集成测试覆盖率：>= 80%
- 所有测试通过率：100%

**效率指标**:
- PRD 生成时间：< 30 秒（不含 Vision）
- Vision 提取时间：< 5 秒/张图片
- 降级响应时间：< 3 秒

### 12.3 后续优化方向

**短期（1-2 月）**:
- 增加术语表自动生成
- 增加边界值自动识别
- 增加澄清模板库

**中期（3-6 月）**:
- 支持更多格式（Notion/Confluence）
- 优化 Vision 成本（本地 OCR）
- 增加批量处理能力

**长期（6-12 月）**:
- AI 辅助需求结构化
- 历史需求相似度匹配
- 自动生成 PRD 初稿

---

## 13. 参考文档

- [prd-enhancement-final-plan.md](./prd-enhancement-final-plan.md) - 技术方案
- [CLAUDE.md](../../CLAUDE.md) - 项目规范
- [spec-first/03-spec/SKILL.md](../../skills/spec-first/03-spec/SKILL.md) - Spec 流程

---

**文档版本**: v1.0.0
**最后更新**: 2026-03-05
**维护者**: 开发团队

