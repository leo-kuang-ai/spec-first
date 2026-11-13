# docs/methodology 说明

本目录保存历史 prompt / skill / agent 快照（用于研究、对照、翻译留档），以及当前有效基线和专项方法论。

## 目录结构

```text
docs/methodology/
  结构化项目角色契约.md        ★ 当前基线:顶层方法论与演化判断基线（稳定路径，迁移须同步消费者）
  项目负责人工作契约.md        ★ 当前角色基线:持续演进、专家协作、证据标准与交付责任
  AI-Coding-Harness演化方法论.md ★ 当前基线:面向能力演化的精练判断方法
  系统性项目审查方法.md        ★ 当前基线:系统性项目审查方法论
  skill-prompt-设计与优化方法论-v2.md ★ 当前基线(spec-first canonical):skill prompt 设计与优化方法论(含 spec-first 适配层:init 投射/source-runtime/spec-* 入口/task-pack handoff;版本演进见 CHANGELOG)
  spec-first-skill-prompt压缩优化组合方法论.md ◇ 专项 companion:期望成本×内容分级×多 agent 拓扑×伪优化识别×partial-landing×证据晋级
  Ponytail思想指导spec-first-Skill优化.md ◇ 专项 companion:最小充分机制、复杂度控制、Skill 映射与非补偿式评估门禁
  GPT-5.6提示工程方法论.md        ◇ 外部 provider companion:面向 GPT-5.6 的结果契约、既有 Skill 分层适配、工具/授权边界与评测驱动迁移方法
  当前分支与远程master-Skill能力审计提示词.md ◇ report-only 操作提示词:冻结远程 master 基线并逐 Skill 审计能力、方法论、边界与证据，不自动修复
  CE与spec-first-Skill核对与选择性吸收方法论.md ◇ 专项 companion:按当前项目定位比较上游能力、修复契约漂移、验证共享消费者与终审反例
  skill-prompt-设计与优化方法论-通用版.md ☆ host/项目中立提取版:同一方法论的通用内核(剥离 spec-first 专属;供其他项目复用,适配层留空待填)
  history/
    review-methods/             系统性项目审查方法 的前身谱系(历史审查/审计 prompt)
      全面项目审查.md  项目审查.md  审查agent.md  审查skill.md  审查token.md
    role-governance/         结构化项目角色契约 的前身谱系(历史角色/治理/自我进化 prompt)
      项目角色.md  项目owner角色.md  项目治理.md  项目治理-agent.md  自我进化.md
```

归类主轴是**生命周期**(当前基线 vs 历史快照);历史快照副轴是**基线谱系**——每个历史子文件夹是某个当前基线的前身,而非任意主题分桶。

## 使用边界

- 顶层四份基线（`结构化项目角色契约.md`、`AI-Coding-Harness演化方法论.md`、`系统性项目审查方法.md`、`skill-prompt-设计与优化方法论-v2.md`）是当前有效基线,不是历史快照,但也都不是具体 runtime behavior contract。`AI-Coding-Harness演化方法论.md` 提炼能力演化的判断顺序；`skill-prompt-设计与优化方法论-v2.md` 是唯一 canonical 的 skill prompt 设计与优化 playbook。三份方法论文档与角色契约冲突时,均让位于角色契约。
- [项目负责人工作契约](./项目负责人工作契约.md)规定持续演进的职责、协作与证据边界，从属于角色契约；其现状表有明确观测时点，具体批次见所链接的周期计划。契约、计划和索引须在获授权的提交中一并核对可达性，本文档不独立授予委派或外部动作权限。
- `spec-first-skill-prompt压缩优化组合方法论.md` 是 canonical v2 的专项 companion，负责 expected/aggregate 成本、内容 criticality、reference 可达性、multi-agent fan-out、上下文切片、validator policy、伪优化识别、partial-landing 与 quality/cost 证据晋级；它不取代 canonical，不定义 runtime behavior，与 canonical 或角色契约冲突时让位于上位文档。
- `GPT-5.6提示工程方法论.md` 是基于 OpenAI 当前开发者文档的外部 provider companion，说明 GPT-5.6 的 prompt 契约、模型配置/Skill source/generated runtime/可选能力分层、既有 Skill 的基线评测与外科式适配、工具/审批边界和迁移方法；它不定义 spec-first runtime contract，不取代 canonical 或角色契约，外部 API/model 事实应回源到链接的官方文档复核。
- `当前分支与远程master-Skill能力审计提示词.md` 是 report-only 操作提示词，用于冻结 `origin/master` SHA、建立逐 Skill 能力账本并输出可追溯审计 finding；它不授权实现修复，不是新的方法论 canonical，也不改变任何 Skill runtime contract。
- [CE 与 spec-first Skill 核对与选择性吸收方法论](./CE与spec-first-Skill核对与选择性吸收方法论.md) 是基于 compound 对比与修复提炼的专项 companion，提供行为链核对、差异裁决、共享契约修复、终审用例与可复用提示词；从属于角色契约及 canonical v2，不定义新的 runtime contract。
- `history/` 下内容**不是**运行时 source-of-truth,可能落后于当前 `skills/`、`agents/`、`templates/claude/commands/spec/`;与当前运行时行为冲突时,以仓库根目录下的 source-of-truth 为准。
- **历史迁移：** 2026-06-15 时文件从当时的 `docs/10-prompt/` 顶层迁入其 `历史快照/` 子目录；2026-10-31 再统一为当前 `docs/methodology/history/`。冻结历史文档保留原路径，不重写当时事实；按 [命名迁移记录](../archive/migrations/2026-10-31-docs-naming.md) 追溯。
- `结构化项目角色契约.md` 是稳定基线路径，当前入口由 `CLAUDE.md`、派生的 `AGENTS.md` 和 `tests/unit/project-role-contract.test.js` 共同核对。未来迁移必须同步真实消费者，不建立第二份 canonical 正文。

## 当前规范优先级

1. `docs/methodology/结构化项目角色契约.md`：顶层方法论与演化判断基线
1a. `docs/methodology/项目负责人工作契约.md`：项目负责人角色的持续演进、协作、证据与交付基线；不得与角色契约冲突。
2. `docs/methodology/AI-Coding-Harness演化方法论.md`：AI Coding Harness 能力演化判断方法（冲突时让位于角色契约）
3. `docs/methodology/系统性项目审查方法.md`：系统性项目审查方法论基线（冲突时让位于角色契约）
3b. `docs/methodology/skill-prompt-设计与优化方法论-v2.md`：skill prompt 设计与优化方法论基线（唯一 canonical；版本演进见 CHANGELOG；与审查方法平级，冲突时让位于角色契约）。前身 v1 已合并进本文件并删除。
3c. `docs/methodology/spec-first-skill-prompt压缩优化组合方法论.md`：skill prompt 压缩与 multi-agent token 拓扑专项方法；从属于 3b，不提升为第二 canonical。
3d. `docs/methodology/GPT-5.6提示工程方法论.md`：基于当前 OpenAI 官方资料的 GPT-5.6 提示、既有 Skill 适配和迁移专项 companion；不提升为第二 canonical，外部事实以官方当前文档为准。
3e. `docs/methodology/Ponytail思想指导spec-first-Skill优化.md`：最小充分机制、复杂度控制、Skill 映射与非补偿式评估专项 companion；从属于角色契约与 3b，不提升为第二 canonical。
4. `skills/`：当前 skill 合同
5. `skills/*/references/agents/` / `skills/*/references/personas/`：当前 skill-local prompt assets（顶层 `agents/` 已退役）
6. `templates/claude/commands/spec/`：Claude 命令模板
7. [用户手册：产物目录](../user-guide/10-产物目录.md)：当前产物目录与 source/runtime 边界说明
8. `CLAUDE.md` / `AGENTS.md`：宿主侧治理与语言规则

## 何时需要更新本目录

- 顶层基线:按其各自的修订纪律更新(角色契约见其「修订纪律」)。
- `history/`:只在需要同步历史快照、维护翻译版本或做版本对照时更新;常规功能开发、路径迁移和运行时契约变更不要求同步修改。

## 目录维护与备份

- [返回文档总入口](../README.md)。当前基线路径保持稳定；专项方法从属于其声明的上位基线。
- 既有 `.backup-*`、`.bak2` 已原样迁入 [方法论备份](../archive/backups/methodology/README.md)，不作为当前规则。
- 旧路径与内容 hash 见 [2026-10-31 迁移记录](../archive/migrations/2026-10-31-docs-organization.md)。
