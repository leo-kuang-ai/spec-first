# Spec-First Integrate-Skill Design

**Date:** 2026-03-25
**Scope:** `spec-first:integrate-skill` skill, `spec-first integrate-skill` CLI, external skill ingestion, guideline/example generation

## Goal

把 Trellis 的 `/trellis:integrate-skill <skill-name>` 思路内化到 `spec-first`，形成一个可审计、可回归、可复用的原生命令：

- 用户入口：`/spec-first:integrate-skill <skill-name>`
- 原子执行：`spec-first integrate-skill <skill-name> [options]`
- 输出结果：guideline 文档、集成报告、示例模板、索引更新

目标不是“把外部 skill 原文复制进来”，而是把外部 skill 的方法论转换成 `spec-first` 自己的治理资产：

1. 新增或更新 spec-first guideline 文档
2. 新增或更新可引用的 example/template
3. 新增或更新一个 spec-first 原生 skill 草案或适配说明
4. 生成可审查的 integration report

## Problem Statement

当前 `spec-first` 已具备：

- `skill render`
- `skill inject-context`
- user-level skill 同步与宿主命令注册
- 现有 skill catalog 的运行时装配

但仍缺一层“外部能力吸收”机制：

1. 没有把第三方 skill 转成 spec-first 资产的标准入口
2. 没有技能接入目标模型，无法判断应落到哪个 stage / 哪类 guideline / 哪个 examples 路径
3. 没有接入报告与审查清单，外部借鉴容易停留在一次性文档
4. 没有处理“只借方法论，不引入原命令形态”的边界
5. 没有统一的外部 skill 来源发现规则，用户只输入 skill name 时无法稳定定位真实 source

Trellis 的 `integrate-skill` 提供了一个可借鉴起点，但它默认目标是 `.trellis/spec/cli/{target}/doc.md`，与 `spec-first` 当前结构并不一致。

## Current State

当前仓库相关基线：

- CLI 入口在 [src/cli/index.ts](/Users/kuang/xiaobu/spec-first/src/cli/index.ts)
- `skill` 子命令在 [src/cli/commands/skill.ts](/Users/kuang/xiaobu/spec-first/src/cli/commands/skill.ts)
- 技能同步与宿主命令注册在 [src/shared/skill-commands.ts](/Users/kuang/xiaobu/spec-first/src/shared/skill-commands.ts)
- 现有 spec-first skills 在 `skills/*/SKILL.md`
- 正式实施设计文档通常沉淀为 `docs/plans/*.md`；本次需求分析和技术设计草案先放在 `docs/01-需求文档/逐个skill优化/integrate/`

当前不存在：

- `spec-first integrate-skill` CLI 子命令
- `spec-first:integrate-skill` skill
- 外部 skill 分类配置
- skill 集成输出模板
- skill 集成报告结构

## Design Principles

1. CLI 是真执行层
- skill 只做交互门面与流程约束
- 所有落盘动作必须可由 CLI 单独执行

2. 集成结果必须是 spec-first 原生资产
- 不能只保存外部 skill 原文
- 必须转译成 spec-first 能消费的文档、示例、元数据

3. 外部 skill 只是来源，不是真理源
- 最终真理源在本仓库生成的 guideline / templates / reports
- 不允许在运行时硬依赖外部仓库在线可用

4. 先文档化集成，再决定是否产品化为正式 skill
- 并非每个外部 skill 都值得变成正式 `skills/*`
- 允许先生成 `integration report + draft skill`

5. 必须支持审查与回滚
- 每次集成都要产出清晰的 touched files
- 可通过 git diff 做代码审查

## Options

### Option A: 纯文档集成

做法：

- 新增一个设计型 skill
- 读取外部 skill 后，只写 `docs/` 下的指南和报告
- 不生成 CLI 命令，不生成 spec-first 原生 skill 草案

优点：

- 侵入小
- 风险最低
- 实施快

缺点：

- 只能做知识沉淀，不能形成可调用能力
- 很快退化成“文档仓库”
- 无法和现有 `skill render` / 宿主注册链路闭环

结论：

- 适合一次性研究
- 不适合作为正式方案

### Option B: 直接生成正式 spec-first skill

做法：

- 输入外部 skill 名称
- 直接在 `skills/<name>/` 生成正式 `SKILL.md`、references、模板和宿主命令

优点：

- 结果最直接
- 一次命令就能变成正式能力

缺点：

- 风险太高
- 缺少审查缓冲层
- 很容易把质量一般的外部 skill 直接产品化
- 无法表达“仅吸收一部分策略”的中间态

结论：

- 不适合作为默认路径
- 只能作为后续增强能力

### Option C: 两阶段集成管线

做法：

第一阶段生成可审查中间产物：

- integration report
- guideline section
- examples/templates
- draft skill skeleton
- target mapping metadata

第二阶段由人工审查后决定：

- 保持为文档化能力
- 或升级为正式 `skills/*`

优点：

- 与 spec-first “先规范，后落地” 一致
- 有审查缓冲层
- 可以兼容高质量和低质量外部 skill
- 易于自动化测试

缺点：

- 比纯文档方案复杂
- 比直接生成正式 skill 多一步审查

结论：

- 推荐方案

## Recommended Solution

采用 Option C，新增一条“两阶段集成管线”。

### 1. 新增 CLI 原子命令

命令签名建议：

```bash
spec-first integrate-skill <skill-name> \
  [--source <path-or-id>] \
  [--target <guideline|draft|both>] \
  [--category <frontend|backend|testing|documentation|workflow|generic>] \
  [--stage <first|onboarding|spec|design|research|task|code|review|verify|orchestrate|status|doctor|sync|feature|none>] \
  [--dry-run] \
  [--report-only] \
  [--yes]
```

语义：

- `<skill-name>`: 目标外部 skill 名
- `--source`: 来源路径或来源标识；默认按本机已安装 skill 搜索
- `--target`: 只产出 guideline、只产出 draft skill、或两者都产出
- `--category`: 覆盖自动分类结果
- `--stage`: 覆盖自动主 stage 归属
- `--dry-run`: 只显示计划写入，不落盘
- `--report-only`: 只生成报告，不生成其他产物
- `--yes`: 跳过确认

### 2. 新增 skill 门面

新增：

- `skills/integrate-skill/SKILL.md`

对用户暴露：

```text
/spec-first:integrate-skill <skill-name>
```

职责：

- 读取外部 skill
- 解释将要落盘到哪些位置
- 调用 `spec-first integrate-skill ...`
- 输出 `Result / Generated Assets / Review Focus / Next Action`
- 若用户未显式提供 `--source`，门面只允许按约定的外部 skill roots 解析；解析失败时必须明确提示补充 source，而不是静默猜测

边界：

- skill 不直接拼接大段模板
- skill 不直接决定最终文件内容
- skill 必须调用 CLI

### 3. 引入“集成目标模型”

新增一个配置真理源，例如：

- `templates/skill-integration/targets.yaml`

定义：

- category 到 guideline 路径映射
- category 到 examples 路径映射
- category 到 primary / related stages 映射
- category 到是否允许生成正式 skill draft 的策略

建议分类：

| Category | 默认落点 | primary stage | related stages |
| --- | --- | --- | --- |
| `frontend` | `docs/guides/frontend/` | `design` | `code` |
| `backend` | `docs/guides/backend/` | `design` | `code` |
| `testing` | `docs/guides/testing/` | `verify` | `review`, `code` |
| `documentation` | `docs/guides/documentation/` | `spec` | `design` |
| `workflow` | `docs/guides/workflow/` | `orchestrate` | `feature`, `sync`, `status` |
| `generic` | `docs/guides/integrations/` | `none` | `none` |

约束：

- `skills-draft/` 只是审查中间态，不进入当前 skill discovery / host registration 链路
- 任何 draft 若要晋升为正式 `skills/*`，必须走独立的 promotion 步骤，并同步更新目录与治理测试
- 外部 source roots 必须排除 spec-first 自身 catalog / cache，避免把内置 skill 当外部 skill 再次集成

注意：

- `spec-first` 没有 Trellis 那种 `.trellis/spec/cli/{target}` 固定目录
- 必须先定义 spec-first 自己的 guideline 输出结构

### 4. 统一产物结构

每次集成至少生成以下产物之一：

```text
docs/guides/<category>/<skill-name>.md
docs/examples/skills/<skill-name>/README.md
docs/examples/skills/<skill-name>/*.template
docs/reports/skill-integrations/<date>-<skill-name>.md
skills-draft/<skill-name>/SKILL.md
skills-draft/<skill-name>/references/*
```

推荐默认模式：

- 一定生成 report
- 尽量生成 guideline
- 如外部 skill 明确可产品化，再生成 `skills-draft/`

原因：

- `skills-draft/` 比直接写入 `skills/` 安全
- 能让审查先发生，再决定是否晋升为正式 skill

### 5. 引入“适配报告”

每次执行生成：

- `docs/reports/skill-integrations/YYYY-MM-DD-<skill-name>.md`

报告至少包含：

1. 来源 skill 描述
2. 来源位置与版本信息
3. 分类结果
4. stage 建议
5. 生成文件清单
6. 与 spec-first 现有技能的重叠/冲突
7. 不兼容点
8. 建议是否升级为正式 skill

### 6. 冲突检测

集成前必须检查：

1. 是否与现有 skill 重名
2. 是否与现有 stage-bound skill 职责冲突
3. 是否只是已有 skill 的 references 内容，没必要单独生成 skill
4. 是否依赖本仓库不存在的技术栈

冲突策略：

- 重名但内容不同：阻断，要求显式 `--rename`
- 内容高度重叠：降级成 guideline append，不生成 skill draft
- 技术栈不兼容：允许生成 report，但默认 `report-only`

## Detailed Flow

```text
User
  -> /spec-first:integrate-skill frontend-design
  -> skill facade
      -> resolve external source
      -> summarize target mapping
      -> call CLI
          -> parse source skill
          -> classify category/stage
          -> run conflict detection
          -> generate integration plan
          -> write report
          -> write guideline/example/draft assets
      -> return review summary + next action
```

## Source Resolution

外部 skill 来源按优先级解析：

1. `--source` 显式路径
2. 已安装的本机 skill 目录
3. 当前工作区显式路径
4. 默认失败并返回可操作错误

首版不做网络拉取。

source 失败契约：

- 默认阻断，不写任何文件
- skill 门面与 CLI 保持同一失败语义，不允许一个阻断、一个降级

理由：

- 当前环境网络受限
- `spec-first` 应优先支持“本机已安装 skill 借鉴”
- 后续如需仓库拉取，可作为增强项追加

## External Skill Parsing Model

新增一个轻量解析器，从外部 skill 提取：

- frontmatter
- command 入口
- 核心目标
- 输入要求
- 输出要求
- references / templates / scripts 引用
- 技术栈关键词
- 风险关键词

输出内部对象，例如：

```ts
interface ExternalSkillProfile {
  name: string;
  sourcePath: string;
  description?: string;
  commands: string[];
  concepts: string[];
  practices: string[];
  filePatterns: string[];
  tools: string[];
  category: 'frontend' | 'backend' | 'testing' | 'documentation' | 'workflow' | 'generic';
  primaryStage: string | 'none';
  relatedStages: string[];
  conflicts: SkillConflict[];
}
```

## Draft Promotion Gate

`skills-draft/` 是受控中间态，不是长期堆放目录。任意 draft 晋升为正式 `skills/*` 前，至少满足：

1. 已通过名称冲突检查，且命名已最终确定
2. 已补齐 `SKILL.md` frontmatter、command、references 基本结构
3. 已通过 skill catalog / governance 测试
4. 已明确归类为：
   - 新正式 skill
   - 或已有 skill 的 guideline/reference 增强，不应晋升为独立 skill

promotion 不属于 `integrate-skill` 首版职责，必须由独立命令承接。

## File Layout Changes

首版建议新增：

- `src/cli/commands/integrate-skill.ts`
- `src/core/skill-integration/`
- `src/core/skill-integration/source-resolver.ts`
- `src/core/skill-integration/external-skill-parser.ts`
- `src/core/skill-integration/category-mapper.ts`
- `src/core/skill-integration/conflict-detector.ts`
- `src/core/skill-integration/generator.ts`
- `src/core/skill-integration/report-writer.ts`
- `templates/skill-integration/targets.yaml`
- `templates/skill-integration/guideline.md.hbs`
- `templates/skill-integration/report.md.hbs`
- `templates/skill-integration/skill-draft.md.hbs`
- `skills/integrate-skill/SKILL.md`
- `tests/unit/integrate-skill.test.ts`
- `tests/unit/external-skill-parser.test.ts`
- `tests/unit/skill-integration-generator.test.ts`

## Why Not Reuse `skill inject-context`

`skill inject-context` 解决的是：

- 给已有 spec-first skills 注入统一的输入上下文章节

`integrate-skill` 解决的是：

- 把外部能力转成 spec-first 新资产

两者关注点不同：

- 前者是“改已有 skill 文档”
- 后者是“生成新治理资产并做兼容映射”

可以共享模板基础设施，但不应该复用成同一命令。

## Output Contract

CLI 标准输出建议：

```text
Integration Result: SUCCESS | REPORT_ONLY | BLOCKED

Skill: <skill-name>
Category: <category>
Recommended Stage: <stage|none>
Target: <guideline|draft|both>

Generated:
- <file1>
- <file2>

Conflicts:
- <conflict>

Review Focus:
- <focus 1>
- <focus 2>

Next Action:
- review report/guideline/draft
- decide whether promotion is justified
```

## Verification Strategy

单元测试必须覆盖：

1. 外部 skill frontmatter 解析
2. 无 frontmatter 时的降级解析
3. category 自动分类
4. stage 推荐
5. 冲突检测
6. `--dry-run`
7. `--report-only`
8. draft 生成路径
9. guideline 生成路径

集成测试必须覆盖：

1. 从本地 fixture skill 生成 report
2. 生成 examples/template 文件
3. 同名冲突阻断
4. 与现有 `skill` 命令并存不冲突

人工回归建议场景：

1. `frontend-design`
2. `mcp-builder`
3. `webapp-testing`
4. 一个只有文档、没有代码模板的 skill

## Rollout Plan

### Phase 1: Report-Only MVP

交付：

- CLI 命令
- skill 门面
- source resolver
- parser
- report writer

边界：

- 只生成 integration report
- 不写 guideline
- 不写 draft skill

价值：

- 先验证分类、解析、冲突检测是否可靠

### Phase 2: Guideline + Examples

交付：

- guideline writer
- examples/template writer
- target mapping config

边界：

- 仍不直接生成正式 skill
- 允许生成 `skills-draft/`

### Phase 3: Draft-to-Formal Promotion

交付：

- `spec-first promote-skill-draft <name>`
- 把 `skills-draft/<name>` 晋升到 `skills/<name>`
- 自动补宿主命令与 catalog 校验

## Risks

### 1. 分类错误

例如 `frontend-design` 同时包含 workflow 和 frontend 内容。

控制：

- 允许 `--category` 手动覆盖
- 报告中必须展示自动分类依据

### 2. 过度产品化

把低质量外部 skill 直接转成正式能力。

控制：

- 默认只生成 report + guideline + draft
- 正式 skill 晋升必须单独命令

### 3. 目录结构漂移

如果 guideline 输出目录没有先定下来，集成结果会变成散乱文件。

控制：

- 先引入 `targets.yaml`
- 所有路径必须由配置映射，不允许在代码里散落硬编码

### 4. 与现有 skill 重叠

例如外部 skill 本质只是 `spec-first:design` 的一个子策略。

控制：

- 冲突检测时输出 `reuse-existing-skill` 建议
- 避免重复造 skill

## Non-Goals

- 首版不支持联网安装外部 skill
- 首版不自动修改 `skills/AGENTS.md` 的全局说明
- 首版不自动发布到用户级 `~/.spec-first/skills`
- 首版不自动创建宿主命令别名

这些都应在“draft 晋升为正式 skill”之后再做。

## Acceptance Criteria

1. 用户可以执行 `/spec-first:integrate-skill <skill-name>`
2. 底层存在 `spec-first integrate-skill <skill-name>`
3. 至少能对本地已存在的外部 skill 生成 integration report
4. 能基于配置把 skill 映射到目标 guideline/examples 路径
5. 检测到重名或高重叠时，能阻断或自动降级为 `report-only`
6. 所有生成内容都可被 git diff 审查
7. 单元测试和集成测试覆盖核心路径

## Recommendation Summary

最终建议：

1. 不做 Trellis 风格的“直接写某个 `doc.md`”简单移植
2. 采用 `CLI 原子命令 + skill 门面 + draft 审查层` 的两阶段模型
3. 先上线 `report-only MVP`
4. 验证 `frontend-design` 和 `mcp-builder` 两个真实样本后，再扩到 guideline/example 生成

这样做的原因很直接：

- 它符合 `spec-first` 的治理边界
- 不会把外部 skill 直接当成真理源
- 能先审查，再产品化
- 与现有 `skill render`、宿主注册、skills catalog 体系兼容
