---
name: "spec:normalize-requirements-docs"
version: 1.0.0
description: |
  当用户提供 Markdown、PDF、DOCX 或图片格式的需求源文档，并希望在保留原始结构、
  图片证据和未确认问题的前提下，将其忠实转换为 Markdown 时使用。
user-invocable: true
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - AskUserQuestion
---

# Skill: normalize-requirements-docs

- Command: `/spec:normalize-requirements-docs`
- P0: 将需求源文档忠实转换为 Markdown

## Scope

这个 skill 是一个文档转写 skill，不是需求分析工作流。

它会做：
- 把源文档转换成 Markdown
- 尽量保留原始结构、顺序和含义
- 在单一输出文件里保留原始文件层级和章节层级
- 当图片、截图、流程图承载原始内容时，把它们转成文字说明
- 对不清晰内容做明确标注，不猜测

它**不会**做：
- 把文档重写成 PRD
- 用摘要替代正文
- 编造缺失业务规则
- 在未明确要求时翻译成另一种语言
- 把输出变成 plan 或 review 工作流

## 支持的输入格式

v1 优先支持：
- Markdown：`.md`
- PDF：`.pdf`
- DOCX：`.docx`
- 图片：`.png`、`.jpg`、`.jpeg`、`.webp`

输入可以是：
- 单个文件
- 多个文件
- 一个包含源文档的目录

如果输入包含多个文件，把它们当成一个 source bundle 处理，并保留文件级来源信息。

## 模板和示例

**模板位置：**
- `normalize-requirements-docs/templates/normalized-source.md`

**示例位置：**
- `normalize-requirements-docs/templates/examples/hk-us-brokerage-normalized-source.example.md`

示例展示了：
- 多文件包（MD + PDF + DOCX + 图片）
- 中文输出
- 带标注的图像处理
- 澄清项处理

## 输出面

只写一个文件：
- `docs/requirements/{date}-{topic}-normalized-source-v{n}.md`

这个文件是唯一的持久化产物。

### 输出命名规则

`{date}` 是标准化产物生成日期，格式固定为 `YYYY-MM-DD`。

`{topic}` 来自主文档主题，或者用户明确提供的主题。

`{n}` 是标准化产物版本号，从 `1` 开始。

规则：
- `{date}` 使用本次标准化输出日期，不用源文档创建日期
- `{topic}` 支持中文命名
- 保持简短、稳定、可读
- 只移除明显不安全的文件名字符，例如 `/`、`\\`、`:`、`*`、`?`、`"`、`<`、`>`、`|`
- 优先使用文档本身的自然标题，不要为了统一而强行改成英文 slug
- 同一 topic 在同一天首次正式产出时使用 `v1`
- 只有同一 topic、同一天再次生成新的正式产物时，才递增为 `v2`、`v3`
- 如果同一日期、同一 topic 的文件已存在，就继续寻找下一个可用版本号，禁止覆盖已有正式产物

示例：
- `docs/requirements/2026-03-28-退款流程-normalized-source-v1.md`
- `docs/requirements/2026-03-28-商家入驻-normalized-source-v1.md`
- `docs/requirements/2026-03-28-checkout-refund-normalized-source-v2.md`

### 输出结构

输出文件**必须遵循原文档结构**：

1. **YAML front matter** - 元数据（主题、日期、语言等）
2. **原文档内容** - 完全按源文档结构
   - 保留所有原始章节标题和编号
   - 保留标题深度层级
   - 图片在原文位置内联处理
3. **附录：待确认项** - 在末尾，仅当有不清楚项时

**不要**强加固定模板结构（如"转写后的 Markdown 正文"、"图片/图表说明"等）。
输出应该看起来是原文档转换成 Markdown，而不是重新组织。

## Core Rules

## Core Rules

1. **保真第一**
   - 先保留源文档真正写了什么，再做结构映射。
   - 不要悄悄改写产品含义。

2. **做结构映射，不做语义重写**
   - 标题、段落、列表、表格、注释都应映射成 Markdown。
   - 尽量保留原始顺序和层级。
   - **保留原始章节编号**（如"一、"、"3.1"、"3.11"）完全按源文档
   - **保留原始标题深度** - 不要扁平化或改变嵌套层级
   - 根据源文档中的实际深度映射到合适的 Markdown 层级（H1-H6）

3. **视觉证据属于原文内容**
   - 当截图、标注图、流程图承载需求内容时，必须把其可见信息转成文字说明。
   - 不要漏掉标签、数值、状态和标记变化。
   - 只要图片承载需求含义，就把它当作一手源材料，而不是装饰附件。
   - **图片必须在原文位置内联处理** - 不要把所有图片汇总到最后

4. **不清晰就记录，不要猜**
   - 如果内容模糊、冲突、缺失或无法可靠读取，写入 `Clarifications`。
   - 不要编造缺失文本、规则、阈值或流程步骤。
   - 不要在 `Converted Markdown Content` 中出现 `未明确`、`无法确认`、`可能`、`疑似`、`大概率` 一类不确定表达。
   - 不要在 `Notes` 中出现不确定表达。
   - 所有不确定内容只能进入 `Clarifications` 或 `Visual-only implications`。
   - 不要在图片说明正文里写“引用位置不明确”“需确认对应模块”这类未解决的图片上下文说明。

5. **默认跟随源文档语言输出**
   - 除非用户明确要求翻译，否则标准化 Markdown 正文要跟随源文档主语言。

## Required Behavior

### 源文档语言识别规则

转换前，识别主语言：

**判断依据：**
- 主文档语言
- 多数标题语言
- 截图中的 UI 标签语言
- 重复出现的业务术语

**决策流程：**
1. 如果单一清晰语言 → 用该语言输出
2. 如果混合但主文档清晰 → 用主文档语言
3. 如果不确定 → 询问用户使用哪种语言

**输出规则：**
- 标准化 Markdown 跟随主源语言
- 为保真，保留原始字段名或术语原文
- 除非用户明确要求，否则不翻译

在元数据中记录语言识别依据。

### 行业提示规则

只有当源文档自己已经明确体现业务领域时，才把行业提示写入可选元数据。

这是次级信息，只用于在源文档已经明确行业时保留术语精度。
它不能改变转写正文的结构、措辞或确定性等级。
如果源文档没有明确体现行业，就完全省略这组元数据。

常见领域包括：
- 证券
- 银行
- 信贷 / 借贷
- 支付
- 保险
- 财富管理
- 合规 / 风控

如果行业不明确：
- 标记为 uncertain
- 使用中性的产品语言
- 不要把行业常识写成原文事实

### 图片与图表规则

对每个有意义的图片或图表：

**始终填写：**
- 源锚点（必需格式：`path | locator | optional-sub-locator`）
- 可见文本 / OCR（当可读时）
- Notes（仅限有据可依的观察）

**按需添加：**
- ASCII 布局（当 UI 结构或流程图承载需求含义时）
- 图像角色（当它增加有用的清晰度时）
- 当前 vs 目标状态（仅有明确的前后对比证据时）
- 变更点（仅当源显示实际变更时）
- 仅视觉推断（仅当图像暗示文本未说明的内容时）

**处理流程：**
1. 通过 OCR 提取可读文本
2. 在 Notes 中记录直接可见内容
3. 如果流程/结构会丢失，添加 ASCII 图
4. 单独标记推断内容为仅视觉推断
5. 将不可读/模糊项移至 Clarifications

**Notes 规则：**
- 仅用于直接可见、有据可依的观察
- 不要放入不可读细节、不确定性或问题
- 将未解决项移至 Clarifications

**装饰性图像：**
- 标注为装饰性，无需进一步分析

如果图片模糊、裁切或歧义：
- 不要猜测
- 在 Clarifications 中记录问题及源锚点

### Clarifications 规则

`Clarifications` 应记录以下问题：
- 标签看不清
- 多份文档互相矛盾
- 页码或上下文缺失
- 图不完整
- OCR 低置信度
- 数值无法可靠读取

如果没有待确认问题，也保留该章节，并写 `None`。

### Source anchor 格式规则

所有锚点统一使用这一格式：
- `relative/path/to/file.ext | locator | optional-sub-locator`

规则：
- 第一段永远是相对源文件路径
- 第二段是主定位信息，例如标题名、页码、页面名
- 第三段只在确实能提高精度时使用，例如子章节名、figure id、image id
- 保持顺序稳定，不要混用 `>` 和自由描述

示例：
- `broker-prd/01-overview.md | Product Scope`
- `broker-prd/02-onboarding.pdf | p.3 | Account Opening Entry`
- `broker-prd/images/order-ticket.png | image | Order Ticket Screen`

## Workflow

### Step 0: 前置检查

开始转换前，验证：
- 源文件可访问
- 输出目录存在或可创建
- 必需工具可用（PDF 提取、图像读取）

分类：
- 如果所有前置条件满足 → 继续 Step 1
- 如果源文件缺失或不可访问 → 停止并返回 `NEEDS_CONTEXT`
- 如果必需工具不可用 → 停止并返回 `BLOCKED`
- 如果部分工具不可用 → 进入降级模式（见降级模式章节）

### Step 1: 清点并决策

识别：
- 所有输入文件和类型
- 粗略体量信号（页数、章节数、图片数）
- 源语言信号
- 行业信号（仅当明显时）

确定输出文件名：
- 用今天的标准化日期作为 `{date}`
- 优先使用主源文档标题作为 `{topic}`
- 否则使用用户提供的主题
- 再否则从最有代表性的文件名推导
- 默认 `{n}` 为 `1`，除非同一 topic 同一天已存在文件

决策点：
- 如果单个清晰文件 OR 清晰文件包且语言/主题明显 → 直接进入 Step 2
- 如果存在歧义触发器 → 进入确认模式（见 Step 1.5）

歧义触发器：
- 多文件主题冲突
- 混合语言且无明确主文档
- 输出路径不存在且用户偏好不明

如果没有可用源文件，停止并返回 `NEEDS_CONTEXT`。

### Step 1.5: 确认模式（仅在需要时）

仅当 Step 1 的歧义触发器存在时，才进入确认模式。

提出最少问题来解决：
- 哪个文件是主文档？（如果主题冲突）
- 输出应使用什么语言？（如果混合语言不明确）
- 输出应写到哪里？（如果路径缺失且不明确）

如果答案从上下文明显可知，不要询问。

### Step 2: 创建输出骨架并提取内容

从 `normalize-requirements-docs/templates/normalized-source.md` 创建输出文件。

替换占位符为输出语言对应内容，然后填写元数据：
- topic、output file、output date、output version
- source language、output language、language detection basis
- 可选行业提示（仅当源文档明确体现时）

按格式处理每个文件：
- Markdown：直接读取
- PDF：提取文本并识别视觉材料
- DOCX：提取文本并识别视觉材料
- Image：视觉分析

如果环境无法读取必需文件类型，进入降级模式或停止并返回 `BLOCKED`。

### Step 3: 转换并保留内容

对每个源文件，按顺序：

**转换结构为 Markdown：**
- 标题、段落、列表、表格、引用
- 保留原始顺序和嵌套
- 保留输出中的文件层级

**处理图像：**
对每个有意义的图像：
1. **提取**：OCR 可见文本
2. **观察**：在 `Notes` 中记录直接可见内容
3. **结构**：如果 UI 结构或流程图承载需求含义，添加 ASCII 布局
4. **推断**：单独标记仅视觉推断（仅当图像显示文本未说明的内容时）
5. **澄清**：将不可读/模糊项移至 `Clarifications`

始终填写：
- 源锚点
- 可见文本 / OCR（当可读时）
- Notes（仅限有根据的观察）

可选字段（仅在适用时使用）：
- ASCII 布局（用于流程、图表、UI 结构）
- 图像角色（当它增加有用的清晰度时）
- 当前 vs 目标状态（仅有明确的前后对比证据时）
- 变更点（仅当源显示实际变更时）
- 仅视觉推断（仅当图像暗示文本未说明的内容时）

装饰性图像：标注为装饰性，无需进一步分析。

**记录澄清项：**
当内容不清晰、矛盾、截断或低置信度时：
- 添加到 `Clarifications` 表
- 包含精确的源锚点
- 说明为何不清晰及影响

**规则：**
- 不要压缩细节
- 不要在 `Converted Markdown Content` 或 `Notes` 中放置不确定性
- 将所有未解决项移至 `Clarifications`

把源内容转成 Markdown 结构：
- headings
- paragraphs
- bullet lists
- numbered lists
- tables
- quoted notes / callouts（如果原文存在）

必须保留：
- 原始顺序
- 原始章节嵌套
- 原始相对文件层级，放入 `Converted Markdown Content`

不要用摘要替代正文。
不要把未解决问题或低置信度判断写进 `Converted Markdown Content`。
这些内容必须移入 `Clarifications`。

### Step 4: 自检并完成

完成前验证：
- [ ] 输出语言与源语言匹配（除非用户要求翻译）
- [ ] 原始层级可在 `Converted Markdown Content` 中恢复
- [ ] 不是压缩简写（细节已保留）
- [ ] 有意义的图像证据已保留
- [ ] 截图已转为明确文字说明
- [ ] 没有静默丢弃主要源内容
- [ ] 不清晰项已捕获，未猜测
- [ ] `Notes` 仅包含有据可依的可见观察
- [ ] 输出文件中无完成状态章节

最小验收不变量：
- [ ] 每个源文件在输出中有归宿
- [ ] 每张有意义图像有说明或明确标为装饰性
- [ ] `Converted Markdown Content` 不含不确定表达
- [ ] 每个澄清项包含有效源锚点
- [ ] 输出文件不含完成状态章节

如果任何检查失败，完成前修订。

## 降级模式

当工具部分不可用时，以降低能力继续：

**PDF 提取不可用：**
- 跳过 PDF 文件
- 在 `Clarifications` 中记录：”PDF 提取不可用 - 文件已跳过”
- 继续处理其他格式
- 输出 `DONE_WITH_CONCERNS`

**图像读取不可用：**
- 在 `Clarifications` 中记录文件名和问题
- 继续处理其他图像
- 输出 `DONE_WITH_CONCERNS`

**部分文件失败：**
- 处理成功的文件
- 在 `Clarifications` 中列出失败文件
- 输出 `DONE_WITH_CONCERNS`

降级模式允许部分成功而非完全失败。

## Output Sections

最终文件只包含以下语义章节：
- topic
- document metadata
- source manifest
- converted Markdown content
- image / diagram notes
- clarifications

章节标题必须使用输出语言，不要保留固定英文标题。

## Completion Status Protocol

使用以下之一：
- `DONE`
- `DONE_WITH_CONCERNS`
- `NEEDS_CONTEXT`
- `BLOCKED`

### `DONE`
- Markdown 转换完成
- 结构和视觉证据已保留
- 无阻塞使用的未解决问题

### `DONE_WITH_CONCERNS`
- Markdown 转换可用
- 存在少量非阻塞歧义（已在 `Clarifications` 中记录）
- 或使用了降级模式（部分文件已跳过）

### `NEEDS_CONTEXT`
- 源不完整、歧义或部分不可读
- 但转换可部分进行
- 缺失信息已在 `Clarifications` 中指明

### `BLOCKED`
- 必需文件类型无法读取
- 或环境无法访问源文件
- 或所有工具不可用（无降级模式可能）

## Final Response Format

始终以这些内容结尾：
- completion status
- 一段简短说明，概括这次转换了什么 source bundle
- 明确列出待确认问题或阻塞项
- 写出的确切文件
