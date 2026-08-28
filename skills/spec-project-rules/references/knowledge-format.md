# Knowledge Format

写入前读取本参考。目标是让 `docs/architecture/` 成为架构边界知识的 canonical 真相源，让 `AGENTS.md` / `CLAUDE.md` 只负责引用，并避免破坏用户已有内容或 generated runtime mirrors。

## 目录结构与文件职责

默认目标目录 `docs/architecture/`（用户显式指定其他目录时跟随用户，但结构不变）：

| 文件 | 职责 |
| --- | --- |
| `index.md` | 最小骨架：freshness（`generated_at` 与 `source_commit`）、一行导读（workspace-map 各端职责 → dependency-rules 依赖方向 → reuse-contracts shared 复用 → coding-rules 高价值约定）、已知局限汇总 |
| `workspace-map.md` | 一端一节：目录、技术栈、职责边界、"不该放什么"反例（带 source refs） |
| `dependency-rules.md` | 依赖方向规则表：结构化行，未来导出确定性执法配置的扩展位 |
| `reuse-contracts.md` | shared 层暴露面、预期消费端、复用边界、重复信号、非目标 |
| `coding-rules.md` | 高价值隐式约定（hidden associations、anti-patterns、封装强制），小集合 |
| `modules/<module>.md` | 分层装载启用时的模块级规则（单模块 scope 条目）；未启用时不存在 |

## 分层装载（大 monorepo 模块级规则）

对齐 Claude / Codex / Trae 的嵌套入口装载机制（子目录 CLAUDE.md / AGENTS.md / `.trae/rules/` 在宿主工作于该目录时自动加载）。

启用条件（满足其一）：模块/端数量 > 20；用户点名要求某模块的规则；两阶段执行的第二批及以后。默认单层五文件对小仓库足够，不为空内容建模块文件。

- 模块级知识文件：`docs/architecture/modules/<module>.md`，frontmatter 同五文件（`scope` 填该模块名），managed marker 同名复用；条目沿用统一小节模板，规则 id 在该文件内独立分配、前缀不变。
- 模块目录入口 pointer：`<module>/AGENTS.md` 与 `<module>/CLAUDE.md`（不存在则新建），marker 块追加一句模块规则 pointer（含规则 id 引用要求），指向 `docs/architecture/modules/<module>.md`。
- 下沉判据：条目 `scope` 为单一模块/包 → 下沉该模块文件；workspace 通用 → 留在五文件。同一规则不得两处重复；迁移时从 workspace 文件移除并在 preview 说明。
- 合并规则：模块文件与模块入口 pointer 复用全部既有合并规则（marker 内替换、外部内容不动、其他 skill 的 marker 块视为外部内容并存）。

## Frontmatter 与 Managed Block

每个文件使用 YAML frontmatter + HTML markers：

```markdown
---
schema: docs-architecture/v1
scope: <端范围或 workspace-wide>
generated_at: <ISO 日期>
source_commit: <目标仓库 git HEAD 短 hash>
---
<!-- spec-project-rules-start -->
（managed 内容）
<!-- spec-project-rules-end -->
```

- frontmatter 必须保持文件第一段；markers 放在 frontmatter 后。旧版产物无 `schema` 字段时按 v0 处理，升级为 v1 前先询问迁移方式。
- markers 外的用户内容不动；无 markers 时追加 managed block。
- update 模式刷新 frontmatter 的 `generated_at` / `source_commit` 仅在内容有实质变化时进行。

## 证据标注

每条边界/规则必须携带：

- `grade: confirmed | inferred`——confirmed 需明文规范（README/ADR/guide）支撑并引用位置；inferred 必须附 source refs。
- 证据类型：存在性证据（支撑"必须/总是如此"类规则）至少 2 个文件支撑；缺失性证据（支撑"禁止/无此依赖"类规则）记录可复现的检索式与命中数，如 `rg "from 'apps/app'" apps/admin-console` 0 命中，不适用 2 文件门槛。
- 适用范围：`scope: workspace | <端名> | <包名>`。
- 例外：`exceptions:` 列表或行内说明；历史例外用收窄措辞。
- 状态：默认 `status: active`；update 模式中失效的条目改标 `status: stale` 并附原因与反证 refs，不直接删除。

写入前（bootstrap 与 update 相同）对将写入的正文做敏感信息检查：密钥、内部 URL、私有包名、账号、生产路径、安全实现细节只用于判断，不进入知识库。

## 条目模板与规则 id

依赖规则使用表格行，字段固定，作为未来导出 dependency-cruiser / eslint-boundaries 等执法配置的扩展位（当前版本只写 markdown，不生成执法配置）：

```markdown
| 规则 id | from | to | 允许方向 | grade | source refs | 例外 | status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DEP-001 | app | shared/api | 允许引入 | inferred | `apps/app/src/x.ts`, `apps/app/src/y.ts` | 无 | active |
| DEP-002 | admin | app | 禁止引入 | inferred | `rg "from 'apps/app'" apps/admin-console` 0 命中 | 旧页面 `admin/legacy/**` 为历史例外 | active |
```

`DEP-002` 的 source refs 是缺失性证据的标准写法：记录可复现检索式与命中数，不写"无证据"这类不可复现的表述；标 stale 时改 status 列并在例外列或行内附原因与反证 refs。

workspace-map / reuse-contracts / coding-rules 的条目使用统一小节模板：

```markdown
### OWN-001 <一句话结论>
- grade: confirmed | inferred
- scope: <端名/包名/workspace>
- source_refs: `<path>`, `<path>`（缺失性证据写检索式与命中数）
- exceptions: 无 | <说明>
- status: active | stale（附原因与反证 refs）
```

`REUSE-` 与 `RULE-` 条目沿用同一模板，仅替换标题前缀与结论内容。

规则 id 前缀按文件固定：`DEP-`（依赖方向）、`OWN-`（归属，写在 workspace-map.md）、`REUSE-`（复用，写在 reuse-contracts.md）、`RULE-`（编码约定，写在 coding-rules.md）。id 沿用既有编号不重排；新增条目取该文件当前最大编号递增；失效条目保留原 id 只改 status，不复用已占用编号。

## 入口 Pointer

- `AGENTS.md`：默认写 pointer 到 `docs/architecture/index.md`，用 markers 包住。使用一句目标项目语言的说明，例如"本项目架构与边界知识库在 `docs/architecture/`，跨端改动、依赖方向、shared 层复用前必须先查 `workspace-map.md` 与 `dependency-rules.md`；涉及上述边界的改动须在回复或 PR 说明中引用对应规则 id（如 DEP-005）。"规则 id 引用让知识库消费成为可观测信号，不做弱化删减。
- `CLAUDE.md`：默认写 pointer，优先使用宿主支持的 native import，例如 `@docs/architecture/index.md`；不确定时用一句目标项目语言的说明。
- pointer 一律使用 repo-root-relative 路径，不写绝对路径。
- 只写 pointer，不把知识库全文内联进入口文件。

## 合并规则

- 目录或文件不存在：创建父目录与文件，写 frontmatter + managed block 或 pointer。
- markers 存在：只替换 markers 中间内容，保留文件其他部分。
- candidate 内容与现有 managed block 无实质变化且 pointer 已正确：不写任何文件，closeout 记录 `refresh_noop`、采样范围和限制。
- 有变化时：preview 展示各文件差异；确认后只替换 marker 中间内容，不因排序、时间戳或同义措辞重写无变化文件。
- markers 不存在且已有内容明显无关：追加 managed block，不删除用户内容。
- markers 不存在但内容像旧版梳理输出：停止并询问"迁移为 managed block 还是追加"，避免重复堆叠；"像旧版梳理输出"仅指无 marker 且指向 `docs/architecture/` 的本 skill 旧产物。
- markers 不配对或畸形：停止并询问，不猜测替换范围。
- 入口文件（AGENTS.md/CLAUDE.md）含其他 skill 的 managed block（不同 marker 名）：视为外部内容不动，只追加/更新本 skill 的 marker block，并在 preview 中说明将与既有 pointer 并存。
- 目标仓库存在 `docs/ai/project-rules.md`（`spec-rule-miner` 产物）或其他规则文件时：不合并、不改写；允许为冲突与重复检测只读该文件，发现的疑似重复或冲突在 preview 中列出交用户裁决；未读取时在 limitations 声明"未做冲突检测"。

## 禁止目标

Generated runtime 与 spec-first managed runtime state 不是写入目标：`.claude/`、`.codex/`、`.agents/skills/`、`.cursor/skills/`、`.cursor/spec-first/`、`.kiro/skills/`、`.kiro/agents/`、`.kiro/spec-first/`、`.qoder/skills/`、`.qoder/agents/`、`.qoder/spec-first/`、`.kiro/steering/**`。

`.cursor/rules/**` 与 `.qoder/rules/**` 不属于本 skill 默认目标；用户点名时也只写 pointer，不内联知识库。`docs/architecture/` 是普通 source 文档，不属于 generated runtime mirror。
