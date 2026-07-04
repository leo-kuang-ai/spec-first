# Skill Quality Vocabulary

本文件把 `writing-great-skills` 的思想改写成 spec-first 可执行的 skill 写作词表，供 `spec-write-skill` 和 `spec-skill-audit` 共享语义。目标不是复刻原文，也不是引入完整 SkillOps 平台，而是提升 skill 在不同 agent run 中的过程可预测性。

## Predictability

**Predictability** 指 agent 每次都走相同类型的过程，而不是产出完全相同的文字。好 skill 会把随机推理约束到稳定流程：何时触发、读什么、写什么、何时完成、何时交给别的 workflow。

下面的词按四个轴组织：**Invocation** 处理 skill 如何被触达，**Information Hierarchy** 处理内容放在哪里，**Steering** 处理运行中如何牵引 agent，**Pruning** 处理如何保持 skill 精简。failure mode 放在对应 remedy 旁边，避免把问题清单变成孤立术语表。

## Invocation

spec-first 先选择 entry surface，再写触发描述：

- `workflow_command`：公开 workflow，用户可见标识统一为 `spec-*`；host delivery 可以是 project command 或 skill，但必须有完整 I/O、artifacts、failure modes、downstream consumers。
- `standalone_skill`：用户或 agent 可直接加载的方法能力，不是 command-backed workflow；适合 authoring、task pack、standards governance 等横向方法。
- `internal_only`：只能由公开 workflow 或 agent 内部消费，不作为用户入口。

不要直接迁移外部 skill 的 invocation 假设。spec-first 的关键不是“是否有 description”，而是治理记录、host delivery、source/runtime 边界和触发描述是否一致。

### Description As Trigger Contract

frontmatter `description` 是触发合同，不是简介。它应该说明：

- 正向意图：用户什么时候需要这个 skill。
- 触发分支：不同输入路径是否真的不同。
- 负向边界：哪些近邻请求不该触发。
- 入口面：它是 public workflow、standalone skill 还是 internal helper。

删掉同义重复。一个分支只写一次；“create a skill”和“new skill authoring”如果指同一行为，就合并成一个触发。优先使用用户、docs、repo 中真实会出现的 leading words；不存在真实触发语境的词不应塞进 description。

### Failure Mode: Mis-trigger

`mis-trigger` 是 description 太宽、太像摘要或同义词堆叠，导致近邻请求误触发。修复顺序是先识别真实 branch，再为每个 branch 保留一个触发表达，最后补负向边界；不要用更长的描述掩盖 branch 不清。

### Failure Mode: Boundary Takeover

`boundary takeover` 是 skill 接管上游需求、下游实现、公开 workflow 或别的 owner 边界。修复方式是把 entry surface、near-neighbor route、handoff 条件写进 trigger 和 workflow，而不是在正文里泛泛提醒“不要越界”。

## Information Hierarchy

把内容按 agent 需要的即时性放置：

1. `SKILL.md` steps：所有分支都必须执行的顺序、边界和 completion criterion。
2. `SKILL.md` reference：短规则、关键定义、不可延迟的决策表。
3. `references/`：条件细节、长 rubric、示例、schema 说明、模式差异。
4. `scripts/`：容易写错、可重复、确定性的检查或生成。
5. `assets/`：输出中会复制/改造的模板或素材。
6. `evals/`：维护者验证样例；默认不是 runtime 必读依赖。

先列 branch，再决定每个 branch 需要哪些 steps、reference、scripts、assets 或 evals。所有路径都需要的动作留在 `SKILL.md`；只服务某个 branch 的细节下沉到 reference，并在 `SKILL.md` 写清楚何时读取。

### Context Pointer Wording

context pointer 是让 agent 读取下沉材料的触发语句。指针的 wording 比文件名更重要：如果 must-have reference 经常读不到，先 sharpen pointer wording，说明读取条件和使用场景；只有 wording 仍不可靠时，才把该材料拉回 `SKILL.md`。

### Co-location

同一概念的定义、规则和例外放在同一小节，避免 agent 读到半个规则。co-location 与 duplication 不同：前者把一个意思放完整，后者把同一个意思重复到多个 source of truth。

### Failure Mode: Sprawl

`sprawl` 是 `SKILL.md` 太长，即使每行都真实有用也会稀释注意力。修复方式是用 branch 许可 progressive disclosure：只给某个 branch 用的材料下沉，所有 branch 必走的步骤保留；不要为了“省 token”隐藏所有路径都必须使用的规则。

### Failure Mode: Package Leak

`package leak` 是 runtime 用户需要 README、历史计划、维护者 eval、repo-local validation docs 或未投影脚本才能运行 skill。修复方式是把 runtime 必读内容限制在 `SKILL.md`、被指向的 `references/`、必要 `scripts/` 和必要 `assets/`；`evals/` 默认只是维护者证据。

## Steering

Steering 是运行中让 agent 走稳定过程的杠杆。

### Branch

branch 是 skill 的不同调用路径。写 skill 时先列 branch：new-skill、revise-skill、migrate-skill、audit-remediation、package-readiness 等模式是否真的需要不同路径。没有不同路径的同义说法不算 branch。

### Leading Words

leading word 是能稳定牵引行为的高密度词，例如 `source-first`、`preview-first`、`single source of truth`、`completion criterion`。优先使用项目已有词，而不是发明新口号。弱词如“be careful / be thorough”通常是 no-op。

leading word 在 body 中牵引 execution，在 description 中牵引 invocation。它必须改变 agent 的判断或动作；如果只是让文案更响亮，就按 no-op 删除。

### Completion Criteria

每个高风险步骤都要有可检查完成条件。好的 completion criterion 同时满足：

- 清晰：agent 能判断 done / not done。
- 有要求：不是“看一下”，而是“每个新增 source skill 都有治理记录、runtime catalog、聚焦测试锚点和 changelog 判断”。
- 与风险匹配：读-only skill 可以轻；写文件、shell、runtime、handoff、delegation 要更硬。

completion criterion 有两个不同作用面：clarity 抵抗 premature completion，demand 驱动 legwork。只写“检查一下”通常只有动作名，没有完成条件。

### Legwork

legwork 是 agent 在一个步骤内完成的实际调查、比较、改写和验证工作。它不应被写成独立空步骤，而应由 completion criterion 的 demand、真实 source refs 和具体 output contract 驱动。

### Failure Mode: Premature Completion

`premature completion` 是 agent 因为看见后续步骤而过早结束当前步骤。修复顺序是先 sharpen 当前步骤的 completion criterion；只有 criterion 无法更具体且确实观察到 rush，才通过拆 sequence 或 handoff 隐藏后续步骤。

## Pruning

Pruning 保持 skill 瘦而可维护。

### Single Source Of Truth

每个意思只保留一个 source of truth。改变 skill 行为时应该改一个地方，而不是同步多处近似句。

### Relevance

relevance 判断一句话是否仍服务当前 recurring job、branch、boundary 或 verification。相关但不改变行为的句子仍可能是 no-op。

### Sentence-Level No-Op

逐句检查 no-op，而不是只按段落或行检查。对每个句子问：它是否改变 agent 的触发、读取、写入、判断、验证或 handoff？如果没有，优先删除整个句子，而不是润色成更漂亮的 no-op。

### Failure Mode: Duplication

`duplication` 是同一语义重复在多处。它会制造多真相源，也会把一个意思在注意力层级上抬得过高。修复方式是合并到 single source of truth；需要强调时重复 leading word，不重复完整解释。

### Failure Mode: Sediment

`sediment` 是历史层残留，通常来自“只加不删”。修复方式是按当前 recurring job 和 branch 重判 relevance；暂不可验证的想法进入 next-step candidate，不进 baseline。

### Failure Mode: No-Op

`no-op` 是模型默认会做、写出来不改变行为的句子。弱 leading word 也可能是 no-op；修复不是堆更多解释，而是换成能改变行为的项目词，或直接删除。

## Spec-First Closeout Checklist

- 新 skill 名称使用 kebab-case，并与 `name:`、目录名、治理记录一致。
- 新增 user-visible skill 更新 `skills-governance.json`，并重新生成 runtime catalog。
- 不为 standalone skill 发明 `spec-*` workflow 命令入口，也不恢复旧 `/spec:*` 或 `$spec-*` 拼写作为产品面。
- `SKILL.md` 指向所有 runtime 必读 references；维护者-only 资产明确标注。
- 变更包含 `CHANGELOG.md`、聚焦 contract tests、最窄验证命令和 generated runtime mirror 状态。
