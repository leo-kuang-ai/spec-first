# Spec-First Integrate-Skill Technical Design

**Date:** 2026-03-25
**Related:** [2026-03-25-spec-first-integrate-skill-design.md](/Users/kuang/xiaobu/spec-first/docs/01-需求文档/逐个skill优化/integrate/2026-03-25-spec-first-integrate-skill-design.md)
**Scope:** `spec-first integrate-skill` CLI, `spec-first:integrate-skill` skill facade, external skill parser, target mapper, generator pipeline, reviewable outputs

## 1. Technical Goal

为 `spec-first` 新增一条完整、可测试、可审查的外部 skill 集成链路：

```text
external skill source
  -> source resolver
  -> parser
  -> classifier
  -> conflict detector
  -> integration planner
  -> generators
  -> report + guideline + examples + draft skill
```

该链路必须满足：

1. CLI 可单独运行，不依赖宿主 skill
2. skill facade 只做交互，不承担业务逻辑
3. 生成结果全部落盘，可被 git diff 审查
4. 默认安全，优先 `report-only` / `guideline-only`
5. 与现有 `skill render`、`update`、宿主命令注册链路不冲突

## 2. Primary Use Cases

### Use Case A: 借鉴外部前端方法论

输入：

```bash
spec-first integrate-skill frontend-design --source /Users/kuang/.agents/skills/frontend-ui-ux-engineer
```

期望：

- 自动识别为 `frontend`
- 输出 guideline 和 examples
- 生成 integration report
- 如内容适合产品化，则生成 `skills-draft/frontend-design/`
- 若未显式传入 `--source`，则先按外部 skill roots 解析，再回退到明确报错，不允许盲猜

### Use Case B: 只做研究归档

输入：

```bash
spec-first integrate-skill mcp-builder --report-only
```

期望：

- 只生成 report
- 不写 guideline
- 不写 draft

### Use Case C: 与现有能力重叠

输入：

```bash
spec-first integrate-skill webapp-testing
```

期望：

- 检测与 `verify` / `review` / `code` 或测试相关文档是否重叠
- 若高重叠，降级为 report-only 或 guideline-only
- 明确给出“不要生成独立 skill”的建议

## 3. High-Level Architecture

```text
src/cli/commands/integrate-skill.ts
  -> src/core/skill-integration/service.ts
      -> source-resolver.ts
      -> external-skill-parser.ts
      -> category-mapper.ts
      -> conflict-detector.ts
      -> integration-planner.ts
      -> generators/
         -> report-generator.ts
         -> guideline-generator.ts
         -> examples-generator.ts
         -> skill-draft-generator.ts
      -> fs-writer.ts
      -> result-formatter.ts
```

原则：

- `service.ts` 是编排层
- `planner` 生成“打算写什么”
- `generators` 只负责把 plan 的某一部分渲染成文本
- `fs-writer` 统一处理落盘和 dry-run

## 4. CLI Contract

### 4.1 Command Signature

建议新增：

```bash
spec-first integrate-skill <skill-name> \
  [--source <path>] \
  [--target <guideline|draft|both>] \
  [--category <frontend|backend|testing|documentation|workflow|generic>] \
  [--stage <first|onboarding|spec|design|research|task|code|review|verify|orchestrate|status|doctor|sync|feature|none>] \
  [--report-only] \
  [--dry-run] \
  [--rename <new-name>] \
  [--yes]
```

### 4.2 CLI Parse Result

```ts
export interface IntegrateSkillOptions {
  skillName: string;
  source?: string;
  target?: 'guideline' | 'draft' | 'both';
  category?: IntegrationCategory;
  stage?: IntegrationStage;
  reportOnly?: boolean;
  dryRun?: boolean;
  rename?: string;
  yes?: boolean;
}
```

### 4.3 Exit Codes

建议遵循现有 `ExitCode` 语义，补充以下业务约定：

- `SUCCESS`: 生成成功
- `VALIDATION_ERROR`: 参数错误 / 来源不存在 / stage/category 非法
- `RUNTIME_ERROR`: 模板写入失败 / 文件系统失败
- `CONFLICT_BLOCKED`: 名称冲突或职责冲突，且未显式覆盖

如果不希望新增枚举，也可保持返回 `VALIDATION_ERROR`，同时在 stderr 中输出：

- `INTEGRATE_SKILL_CONFLICT`
- `INTEGRATE_SKILL_SOURCE_NOT_FOUND`
- `INTEGRATE_SKILL_UNSUPPORTED`

## 5. Core Types

### 5.1 Skill Source Profile

```ts
export interface ExternalSkillSource {
  requestedName: string;
  resolvedName: string;
  sourcePath: string;
  sourceType: 'local-directory' | 'local-file';
  skillMdPath: string;
  referencesDir?: string;
  templatesDir?: string;
  scriptsDir?: string;
}
```

### 5.2 Parsed Skill Profile

```ts
export interface ExternalSkillProfile {
  name: string;
  description?: string;
  sourcePath: string;
  commands: string[];
  frontmatter: Record<string, string>;
  concepts: string[];
  practices: string[];
  caveats: string[];
  examples: ExternalExampleFile[];
  tools: string[];
  keywords: string[];
  suggestedCategory: IntegrationCategory;
  primaryStage: IntegrationStage;
  relatedStages: IntegrationStage[];
  parserWarnings: string[];
}

export interface ExternalExampleFile {
  path: string;
  kind: 'code' | 'config' | 'doc' | 'template' | 'unknown';
  language?: string;
}
```

### 5.3 Integration Target Model

```ts
export type IntegrationCategory =
  | 'frontend'
  | 'backend'
  | 'testing'
  | 'documentation'
  | 'workflow'
  | 'generic';

export type IntegrationStage =
  | 'first'
  | 'onboarding'
  | 'spec'
  | 'design'
  | 'research'
  | 'task'
  | 'code'
  | 'review'
  | 'verify'
  | 'orchestrate'
  | 'status'
  | 'doctor'
  | 'sync'
  | 'feature'
  | 'none';

export interface IntegrationTargetConfig {
  category: IntegrationCategory;
  primaryStage: IntegrationStage;
  relatedStages: IntegrationStage[];
  guidelineDir: string;
  examplesDir: string;
  draftSkillDir: string;
  allowDraftSkill: boolean;
}
```

### 5.4 Conflict Model

```ts
export interface SkillConflict {
  type:
    | 'name-conflict'
    | 'stage-conflict'
    | 'capability-overlap'
    | 'tech-stack-mismatch'
    | 'source-invalid';
  severity: 'info' | 'warning' | 'error';
  message: string;
  relatedPaths: string[];
  recommendedAction: 'report-only' | 'rename' | 'guideline-only' | 'block';
}
```

### 5.5 Integration Plan

```ts
export interface IntegrationPlan {
  requestedName: string;
  finalName: string;
  profile: ExternalSkillProfile;
  targetConfig: IntegrationTargetConfig;
  mode: 'report-only' | 'guideline-only' | 'draft-only' | 'full';
  conflicts: SkillConflict[];
  fileWrites: PlannedFileWrite[];
  reviewFocus: string[];
}

export interface PlannedFileWrite {
  path: string;
  kind: 'report' | 'guideline' | 'example' | 'draft-skill' | 'draft-reference';
  overwrite: boolean;
  content: string;
}
```

## 6. Filesystem Layout

### 6.1 New Source Files

建议新增：

- [src/cli/commands/integrate-skill.ts](/Users/kuang/xiaobu/spec-first/src/cli/commands/integrate-skill.ts)
- [src/core/skill-integration/service.ts](/Users/kuang/xiaobu/spec-first/src/core/skill-integration/service.ts)
- [src/core/skill-integration/source-resolver.ts](/Users/kuang/xiaobu/spec-first/src/core/skill-integration/source-resolver.ts)
- [src/core/skill-integration/external-skill-parser.ts](/Users/kuang/xiaobu/spec-first/src/core/skill-integration/external-skill-parser.ts)
- [src/core/skill-integration/category-mapper.ts](/Users/kuang/xiaobu/spec-first/src/core/skill-integration/category-mapper.ts)
- [src/core/skill-integration/conflict-detector.ts](/Users/kuang/xiaobu/spec-first/src/core/skill-integration/conflict-detector.ts)
- [src/core/skill-integration/integration-planner.ts](/Users/kuang/xiaobu/spec-first/src/core/skill-integration/integration-planner.ts)
- [src/core/skill-integration/fs-writer.ts](/Users/kuang/xiaobu/spec-first/src/core/skill-integration/fs-writer.ts)
- [src/core/skill-integration/result-formatter.ts](/Users/kuang/xiaobu/spec-first/src/core/skill-integration/result-formatter.ts)
- [src/core/skill-integration/generators/report-generator.ts](/Users/kuang/xiaobu/spec-first/src/core/skill-integration/generators/report-generator.ts)
- [src/core/skill-integration/generators/guideline-generator.ts](/Users/kuang/xiaobu/spec-first/src/core/skill-integration/generators/guideline-generator.ts)
- [src/core/skill-integration/generators/examples-generator.ts](/Users/kuang/xiaobu/spec-first/src/core/skill-integration/generators/examples-generator.ts)
- [src/core/skill-integration/generators/skill-draft-generator.ts](/Users/kuang/xiaobu/spec-first/src/core/skill-integration/generators/skill-draft-generator.ts)

### 6.2 New Templates

- [templates/skill-integration/targets.yaml](/Users/kuang/xiaobu/spec-first/templates/skill-integration/targets.yaml)
- [templates/skill-integration/report.md.hbs](/Users/kuang/xiaobu/spec-first/templates/skill-integration/report.md.hbs)
- [templates/skill-integration/guideline.md.hbs](/Users/kuang/xiaobu/spec-first/templates/skill-integration/guideline.md.hbs)
- [templates/skill-integration/example-readme.md.hbs](/Users/kuang/xiaobu/spec-first/templates/skill-integration/example-readme.md.hbs)
- [templates/skill-integration/skill-draft.md.hbs](/Users/kuang/xiaobu/spec-first/templates/skill-integration/skill-draft.md.hbs)

### 6.3 New Runtime Outputs

- `docs/reports/skill-integrations/YYYY-MM-DD-<skill-name>.md`
- `docs/guides/<category>/<skill-name>.md`
- `docs/examples/skills/<skill-name>/README.md`
- `docs/examples/skills/<skill-name>/*.template`
- `skills-draft/<skill-name>/SKILL.md`
- `skills-draft/<skill-name>/references/*`

## 7. Module Responsibilities

### 7.1 `source-resolver.ts`

职责：

1. 解析 `--source`
2. 支持本地目录和本地 `SKILL.md`
3. 识别 `references/`、`scripts/`、`templates/`
4. 统一返回 `ExternalSkillSource`

解析顺序：

1. 显式 `--source`
2. 当前工作目录下的同名目录
3. 约定的外部 skill roots 中的同名目录，按优先级尝试：
   - `~/.agents/skills`
   - `~/.codex/skills` 中非 spec-first catalog 的候选项
4. 失败则报 `SOURCE_NOT_FOUND`

首版不做：

- GitHub repo 拉取
- 网络安装

source 失败契约：

- 默认阻断，不写任何文件
- resolver 必须区分“source 不存在”和“source 存在但结构无效”

### 7.2 `external-skill-parser.ts`

职责：

1. 读取 `SKILL.md`
2. 解析 frontmatter
3. 识别 command 行
4. 从正文提炼：
   - core concepts
   - best practices
   - caveats
   - referenced files
5. 探测示例文件

解析策略：

- frontmatter 优先
- 正文标题和 bullets 次之
- 若结构不规范，也应尽量返回“低置信度 profile + warnings”

### 7.3 `category-mapper.ts`

职责：

根据关键词、commands、example 文件类型判断：

- `category`
- `primaryStage`
- `relatedStages`

分类建议规则：

| Signal | Category |
| --- | --- |
| `react`, `ui`, `layout`, `css`, `component` | `frontend` |
| `api`, `server`, `mcp`, `db`, `endpoint` | `backend` |
| `test`, `e2e`, `assert`, `playwright` | `testing` |
| `doc`, `markdown`, `writing`, `authoring` | `documentation` |
| `workflow`, `plan`, `review`, `orchestrate` | `workflow` |

若多个类别命中：

- 按分值排序
- 若差值过小，输出 warning，并允许用户用 `--category` 覆盖

### 7.4 `conflict-detector.ts`

职责：

检查 4 类冲突：

1. 名称冲突
2. stage 冲突
3. 能力重叠
4. 技术栈明显不兼容

数据来源：

- `skills/*/SKILL.md`
- `skills/AGENTS.md`
- 现有 docs/guides 路径

最小判定逻辑：

- 若 `skills/<name>` 已存在：`name-conflict`
- 若 profile 目标 stage 与现有强绑定 stage skill 高度重合：`capability-overlap`
- 若要求的技术栈与本仓库 stack 明显不符：`tech-stack-mismatch`

### 7.5 `integration-planner.ts`

职责：

把 profile、target config、冲突结果合并成 `IntegrationPlan`。

决策规则：

1. `--report-only` 强制 `mode=report-only`
2. 有 `error` 级冲突且无覆盖参数时：
   - 默认 block
3. 有高重叠但无重名：
   - 默认 `guideline-only` 或 `report-only`
4. 只有轻量 warning：
   - 可生成 `full`

### 7.6 `generators/*`

各 generator 只接受 plan，不自己做业务决策。

#### `report-generator.ts`

输出：

- 来源 skill 概览
- 分类结果
- 冲突
- 生成清单
- 建议下一步

#### `guideline-generator.ts`

输出：

- `docs/guides/<category>/<skill-name>.md`

内容结构建议：

1. Overview
2. When to use
3. Project adaptation
4. Recommended workflow
5. Caveats
6. Related spec-first skills
7. Reference examples

#### `examples-generator.ts`

输出：

- `README.md`
- 从来源 skill 中筛选出的模板文件

规则：

- 源代码文件全部转成 `.template`
- 非代码文档保留 `.md`
- 不复制可执行脚本

#### `skill-draft-generator.ts`

输出：

- `skills-draft/<name>/SKILL.md`
- `skills-draft/<name>/references/*`

首版规则：

- 只生成 draft
- 不写 `skills/<name>`
- 不接入宿主命令注册

### 7.7 `fs-writer.ts`

职责：

统一处理：

- 目录创建
- 覆盖策略
- dry-run
- 写入结果汇总

接口建议：

```ts
export interface FileWriteResult {
  path: string;
  kind: PlannedFileWrite['kind'];
  status: 'written' | 'skipped' | 'previewed';
}

export function applyIntegrationPlan(
  plan: IntegrationPlan,
  options: { dryRun?: boolean }
): FileWriteResult[]
```

## 8. Template Contract

### 8.1 `targets.yaml`

建议结构：

```yaml
categories:
  frontend:
    primary_stage: design
    related_stages: [code]
    guideline_dir: docs/guides/frontend
    examples_dir: docs/examples/skills
    draft_skill_dir: skills-draft
    allow_draft_skill: true
  backend:
    primary_stage: design
    related_stages: [code]
    guideline_dir: docs/guides/backend
    examples_dir: docs/examples/skills
    draft_skill_dir: skills-draft
    allow_draft_skill: true
  testing:
    primary_stage: verify
    related_stages: [review, code]
    guideline_dir: docs/guides/testing
    examples_dir: docs/examples/skills
    draft_skill_dir: skills-draft
    allow_draft_skill: true
  documentation:
    primary_stage: spec
    related_stages: [design]
    guideline_dir: docs/guides/documentation
    examples_dir: docs/examples/skills
    draft_skill_dir: skills-draft
    allow_draft_skill: false
  workflow:
    primary_stage: orchestrate
    related_stages: [feature, sync, status]
    guideline_dir: docs/guides/workflow
    examples_dir: docs/examples/skills
    draft_skill_dir: skills-draft
    allow_draft_skill: false
  generic:
    primary_stage: none
    related_stages: []
    guideline_dir: docs/guides/integrations
    examples_dir: docs/examples/skills
    draft_skill_dir: skills-draft
    allow_draft_skill: false
```

### 8.2 `report.md.hbs`

必须包含：

1. Source
2. Skill summary
3. Category/stage
4. Compatibility
5. Conflicts
6. Generated files
7. Review checklist
8. Recommendation

### 8.3 `skill-draft.md.hbs`

必须明确：

- 这是 draft，不是正式 skill
- 该 draft 源自外部 skill 集成
- 哪些部分是直接转译，哪些是本项目适配

## 9. Skill Facade Design

新增：

- [skills/integrate-skill/SKILL.md](/Users/kuang/xiaobu/spec-first/skills/integrate-skill/SKILL.md)

建议内容：

```text
# Skill: integrate-skill

- Command: /spec-first:integrate-skill [skillName]

流程：
1. 解析用户想集成的 skill
2. 预览将生成的资产类型
3. 调用 spec-first integrate-skill
4. 返回 integration report 路径与 review focus
```

skill 门面限制：

- 不直接大段复制外部 skill 内容
- 不自己写目标文件
- 必须依赖 CLI 子命令
- 门面只负责把 `skillName` 解析成可用 source，若无法定位到唯一 source，则返回可操作错误并提示用户补 `--source`

## 10. CLI Registration Changes

需要修改：

- [src/cli/index.ts](/Users/kuang/xiaobu/spec-first/src/cli/index.ts)

新增注册：

```ts
registerCommand('integrate-skill', '外部 skill 集成到 spec-first 治理资产', handleIntegrateSkill, {
  requiresConfirmation: true,
});
```

如果未来要给宿主生成 `/spec-first:integrate-skill`，则还需要更新：

- [src/shared/skill-commands.ts](/Users/kuang/xiaobu/spec-first/src/shared/skill-commands.ts)

但首版如果只是新增 `skills/integrate-skill`，现有扫描机制应能自动发现。

## 11. Example Execution Trace

### 输入

```bash
spec-first integrate-skill frontend-design \
  --source /Users/kuang/.agents/skills/frontend-ui-ux-engineer \
  --target both \
  --yes
```

### 执行流

```text
parse args
  -> resolve source
  -> parse profile
  -> infer category=frontend
  -> infer stage=design
  -> detect conflicts
  -> build integration plan
  -> generate report
  -> generate guideline
  -> generate examples
  -> generate draft skill
  -> write files
  -> print summary
```

### 输出

```text
Integration Result: SUCCESS
Skill: frontend-design
Category: frontend
Recommended Stage: design
Mode: full

Generated:
- docs/reports/skill-integrations/2026-03-25-frontend-design.md
- docs/guides/frontend/frontend-design.md
- docs/examples/skills/frontend-design/README.md
- skills-draft/frontend-design/SKILL.md

Review Focus:
- 与现有 design/code skill 的边界是否清晰
- draft 中是否混入宿主特定命令
```

## 12. Error Handling

### 12.1 Source Not Found

输出：

```text
INTEGRATE_SKILL_SOURCE_NOT_FOUND: <name>
```

行为：

- 返回非 0
- 不写任何文件

### 12.2 Name Conflict

输出：

```text
INTEGRATE_SKILL_CONFLICT: skill name already exists
```

行为：

- 提示使用 `--rename`
- 默认阻断

### 12.3 Unsupported Skill Shape

例如来源目录没有 `SKILL.md`。

行为：

- 直接阻断
- 不写任何文件

建议：

- 首版统一阻断，避免垃圾产物和空报告歧义

## 13. Testing Plan

### 13.1 Unit Tests

新增：

- [tests/unit/source-resolver.test.ts](/Users/kuang/xiaobu/spec-first/tests/unit/source-resolver.test.ts)
- [tests/unit/external-skill-parser.test.ts](/Users/kuang/xiaobu/spec-first/tests/unit/external-skill-parser.test.ts)
- [tests/unit/category-mapper.test.ts](/Users/kuang/xiaobu/spec-first/tests/unit/category-mapper.test.ts)
- [tests/unit/conflict-detector.test.ts](/Users/kuang/xiaobu/spec-first/tests/unit/conflict-detector.test.ts)
- [tests/unit/integration-planner.test.ts](/Users/kuang/xiaobu/spec-first/tests/unit/integration-planner.test.ts)
- [tests/unit/integrate-skill.test.ts](/Users/kuang/xiaobu/spec-first/tests/unit/integrate-skill.test.ts)

覆盖点：

1. source resolver 能解析显式 `--source`
2. source resolver 能按约定 roots 命中真实外部 skill
3. source resolver 找不到时返回 `SOURCE_NOT_FOUND`
4. frontmatter 正常解析
5. frontmatter 缺失降级
6. frontend/backend/testing 分类
7. stage 推断
8. 重名冲突
9. overlap 降级
10. `--report-only`
11. `--dry-run`
12. `--rename`

### 13.2 Fixtures

建议新增：

- `tests/fixtures/external-skills/frontend-design/`
- `tests/fixtures/external-skills/mcp-builder/`
- `tests/fixtures/external-skills/webapp-testing/`
- `tests/fixtures/external-skills/broken-skill/`

### 13.3 Integration Tests

执行层覆盖：

1. CLI 从 fixture 目录读取 skill
2. 写出 report
3. 写出 guideline
4. 写出 `.template` 示例文件
5. `dry-run` 不落盘

## 14. Rollout Phases

### Phase 1: Report-Only MVP

交付：

- CLI
- source resolver
- parser
- category mapper
- conflict detector
- report generator

不做：

- guideline writer
- examples writer
- draft skill writer

成功标准：

- 能稳定输出 integration report

### Phase 2: Guideline + Examples

交付：

- target config
- guideline generator
- examples generator

成功标准：

- `frontend-design` / `mcp-builder` 可生成 reviewable docs/examples

### Phase 3: Draft Skill

交付：

- skill-draft generator
- overlap 审查增强

成功标准：

- 高质量外部 skill 可以被转成 `skills-draft/*`

## 15. Draft Promotion Gate

任意 `skills-draft/*` 晋升为正式 `skills/*` 前，至少满足：

1. 通过名称冲突检查
2. 已补齐 frontmatter、command、references 结构
3. 已通过 skill catalog / governance 测试
4. 已明确属于：
   - 新正式 skill
   - 或已有 skill 的增强，不应晋升为独立 skill

promotion 必须由独立命令承接，不属于 `integrate-skill` 首版写入范围。

## 16. Compatibility Notes

与现有系统的关系：

1. 不替代 `skill render`
2. 不改 `update` 的同步逻辑
3. 不直接修改 `skills/AGENTS.md`
4. 不自动把 draft 注册到宿主
5. `skills-draft/` 仅作审查中间态；若要晋升为正式 skill，必须显式复制到 `skills/<name>` 并同步 `skills/README.md` / 相关治理测试

这五点很重要，因为首版只是“吸收能力”，不是“立即发布能力”。

## 17. Implementation Recommendation

建议按下面顺序做：

1. `source-resolver`
2. `external-skill-parser`
3. `category-mapper`
4. `conflict-detector`
5. `report-generator`
6. CLI 接线
7. `guideline-generator`
8. `examples-generator`
9. `skill-draft-generator`

原因：

- 先把解析与判断层做稳
- 再接写入层
- 最后才碰 draft skill 生成

## 18. Final Recommendation

最稳妥的技术路径是：

1. 把 `integrate-skill` 做成新的 CLI 原子命令
2. 让 `/spec-first:integrate-skill` 只作为门面
3. 先交付 report-only MVP
4. 再扩展到 guideline/examples
5. 最后再支持 `skills-draft`

这样既保留了 Trellis 的“技能知识内化”价值，又不会把 `spec-first` 变成一个直接复制外部技能的工具。
