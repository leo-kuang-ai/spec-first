# docs/10-prompt 说明

本目录保存历史 prompt / skill / agent 快照（用于研究、对照、翻译留档），以及四份**当前有效基线**。

## 目录结构

```text
docs/10-prompt/
  结构化项目角色契约.md        ★ 当前基线:顶层方法论与演化判断基线(测试钉死,勿移动)
  AI-Coding-Harness演化方法论.md ★ 当前基线:面向能力演化的精练判断方法
  系统性项目审查方法.md        ★ 当前基线:系统性项目审查方法论
  skill-prompt-设计与优化方法论-v2.md ★ 当前基线(spec-first canonical):skill prompt 设计与优化方法论(含 spec-first 适配层:init 投射/source-runtime/spec-* 入口/task-pack handoff;版本演进见 CHANGELOG)
  skill-prompt-设计与优化方法论-通用版.md ☆ host/项目中立提取版:同一方法论的通用内核(剥离 spec-first 专属;供其他项目复用,适配层留空待填)
  历史快照/
    审查方法-历史/             系统性项目审查方法 的前身谱系(历史审查/审计 prompt)
      全面项目审查.md  项目审查.md  审查agent.md  审查skill.md  审查token.md
    角色治理演化-历史/         结构化项目角色契约 的前身谱系(历史角色/治理/自我进化 prompt)
      项目角色.md  项目owner角色.md  项目治理.md  项目治理-agent.md  自我进化.md
```

归类主轴是**生命周期**(当前基线 vs 历史快照);历史快照副轴是**基线谱系**——每个历史子文件夹是某个当前基线的前身,而非任意主题分桶。

## 使用边界

- 顶层四份基线（`结构化项目角色契约.md`、`AI-Coding-Harness演化方法论.md`、`系统性项目审查方法.md`、`skill-prompt-设计与优化方法论-v2.md`）是当前有效基线,不是历史快照,但也都不是具体 runtime behavior contract。`AI-Coding-Harness演化方法论.md` 提炼能力演化的判断顺序；`skill-prompt-设计与优化方法论-v2.md` 是唯一 canonical 的 skill prompt 设计与优化 playbook。三份方法论文档与角色契约冲突时,均让位于角色契约。
- `历史快照/` 下内容**不是**运行时 source-of-truth,可能落后于当前 `skills/`、`agents/`、`templates/claude/commands/spec/`;与当前运行时行为冲突时,以仓库根目录下的 source-of-truth 为准。
- **重组说明(2026-06-15):** 历史快照文件由本目录顶层迁入 `历史快照/` 子目录。CHANGELOG、已完成/取代的 dated plans、历史 review/validation 等**冻结历史文档**中对旧路径(`docs/10-prompt/<文件>.md`)的引用**未回改**——历史记录按惯例不重写,这些旧路径指向迁移前状态,属预期。当前 live 引用(skill / contract / 本 docs 索引)已更新到新路径。
- `结构化项目角色契约.md` 被 4 个测试 + `CLAUDE.md`/`AGENTS.md`/`src/cli` 等 100+ 处引用并由 `contract-drift-guard` 钉死路径,**不可移动**。

## 当前规范优先级

1. `docs/10-prompt/结构化项目角色契约.md`：顶层方法论与演化判断基线
2. `docs/10-prompt/AI-Coding-Harness演化方法论.md`：AI Coding Harness 能力演化判断方法（冲突时让位于角色契约）
3. `docs/10-prompt/系统性项目审查方法.md`：系统性项目审查方法论基线（冲突时让位于角色契约）
3b. `docs/10-prompt/skill-prompt-设计与优化方法论-v2.md`：skill prompt 设计与优化方法论基线（唯一 canonical；版本演进见 CHANGELOG；与审查方法平级，冲突时让位于角色契约）。前身 v1 已合并进本文件并删除。
4. `skills/`：当前 skill 合同
5. `agents/`：当前 agent 合同
6. `templates/claude/commands/spec/`：Claude 命令模板
7. `docs/02-架构设计/02-目录结构.md`：当前目录结构与运行态布局说明
8. `CLAUDE.md` / `AGENTS.md`：宿主侧治理与语言规则

## 何时需要更新本目录

- 顶层基线:按其各自的修订纪律更新(角色契约见其「修订纪律」)。
- `历史快照/`:只在需要同步历史快照、维护翻译版本或做版本对照时更新;常规功能开发、路径迁移和运行时契约变更不要求同步修改。
