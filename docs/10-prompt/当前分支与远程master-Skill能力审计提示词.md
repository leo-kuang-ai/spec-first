# 当前分支与远程 master 的 Skill 能力审计提示词（只审不修）

> 用途：对当前工作树与远程 `origin/master` 中的全部 source Skill 做逐项、语义级、证据约束的能力审计，识别能力、方法论、边界和验证机制是否在重构中丢失。
>
> 本提示词固定为 `report-only`。它允许读取远程基线、创建临时 detached worktree 和写入审计报告，但不授权修改 Skill、CLI、测试、runtime、README 或其他实现 source，也不授权 commit、push 或创建 PR。

## 可复制提示词

```text
请在仓库 `/Users/kuang/xiaobu/spec-first` 中，对当前分支与远程 `origin/master` 的全部 source Skill 进行逐项、深入、基于证据的能力审计。

这是一次 `spec-code-review depth:full base:origin/master` 的 report-only 请求。先加载 `using-spec-first` 和仓库治理要求，再执行审计。只审计、只输出报告，不自动修复，不修改 Skill、CLI、测试、runtime、README 或其他实现 source，不提交、不推送、不创建 PR。

## 核心目标

不是比较文件数量、文本长度或 diff 行数，而是回答：

1. 当前分支的每个 Skill 相比 `origin/master` 是否丢失了能力？
2. 是否丢失了方法论、决策原则、执行步骤、边界、fallback、验证机制或交付闭环？
3. 被删除的内容是合理精简、能力迁移，还是不可达的隐性退化？
4. 当前重构是否让 Skill 的能力、可信度、可执行性和可维护性整体不低于 master？
5. 如果存在退化，应如何以最小、架构一致的方式修复？本轮只给建议，不实施修复。

不得为了满足“重构有提升”而强行给出正面结论。无法证明时必须标记为 `uncertain`；确认退化时必须标记为 `regression`。没有修复与复验，不得把 finding 标记为已关闭。

## 一、冻结比较基线

开始前记录：

- 当前分支名、HEAD SHA
- `git status --short`
- 当前工作区中已有的修改和未跟踪文件
- remote 信息
- 当前时间
- `origin/master` 的最新 SHA
- 当前 HEAD 与 `origin/master` 的 merge base

执行要求：

1. 执行 `git fetch origin master`。
2. 如果 fetch 失败，不得把本地缓存的 master 描述成最新远程 master；必须记录证据限制。
3. 使用 fetch 后解析出的固定 SHA 作为整个审计周期的 master 基线，不要在中途漂移。
4. 创建临时 detached worktree，例如：
   - `AUDIT_TMP=$(mktemp -d /tmp/spec-first-skill-audit.XXXXXX)`
   - `git worktree add --detach "$AUDIT_TMP/master" <MASTER_SHA>`
5. 不切换、清理、stash 或覆盖当前工作区，不修改用户已有内容。
6. 当前版本默认指“当前工作树有效状态”，包括未提交的 Skill source 变更；同时把 HEAD 与 working-tree overlay 分开记录。
7. 最终报告中给出临时 worktree 路径，不要自动删除，便于复核。

## 二、审计范围与 source 边界

主要审计：

- 当前仓库 `skills/**`
- master 临时 worktree 中的 `skills/**`
- 与 Skill 行为直接相关的：
  - `SKILL.md`
  - `references/**`
  - `scripts/**`
  - `templates/**`
  - `examples/**`
  - tests
  - CLI、init、plugin、contract、routing 和 consumer 入口
  - README、docs、CHANGELOG 中的用户可见契约

禁止把以下 generated runtime mirror 当作 source：

- `.agents/skills/**`
- `.claude/**`
- `.codex/**`
- `.cursor/**`
- `.kiro/**`
- `.qoder/**`

若需确认跨文件调用者、投射关系或 consumer，优先使用 CodeGraph 做导航，再回到 source、test、log 或文档确认。CodeGraph/Graphify 只能作为 `provider_untrusted` advisory evidence，不能单独支撑能力保留、退化或完成结论。

## 三、先建立完整 Skill 清单

分别枚举 current 与 master 的 source Skill，形成四类清单：

1. 两边同名 Skill
2. current 新增 Skill
3. master 存在、current 删除的 Skill
4. 发生 rename、split、merge 或能力迁移的 Skill

不要看到 Skill 被删除就直接判定能力丢失。必须追踪它原有能力是否迁移到新的 owner、是否仍可通过公共入口触达、是否还有 consumer 和测试。

同时检查：

- 公共 Skill 数量和入口是否变化
- standalone、workflow、internal helper 的角色是否发生变化
- 路由是否仍然可达
- 是否出现“文件还在，但能力已无法触发”的有效能力丢失
- 是否出现重复 owner、无人负责的能力或 consumer 仍引用旧入口

文件级的 `name-status`、`stat`、`numstat` 和 rename 检测只用于确定阅读路线，不能直接作为能力结论。

## 四、逐 Skill 建立能力账本

对 master 中每个 Skill，先独立阅读并提炼能力，不要先用 current 的结构解释 master。

至少从以下维度提取能力：

1. 用户意图与适用场景
2. 触发条件、入口和参数
3. 输入及上下文准备
4. 核心执行流程
5. 方法论、判断原则和决策启发式
6. source-of-truth 与 generated runtime 边界
7. mutation、verification、handoff、knowledge promotion 等出口 gate
8. negative boundary、禁止事项和反误用规则
9. degraded mode、fallback、失败模式和 reason code
10. 输出 artifact、schema、证据与 claim ceiling
11. downstream consumer、跨 Skill handoff 和 ownership
12. 工具/provider 集成及其可信度边界
13. 测试、验证方法和 fresh-source eval
14. 用户效率、维护成本和上下文成本

为 master 能力分配稳定编号，例如：

- `MASTER-CAP-001`
- `MASTER-CAP-002`

然后逐项映射到 current：

- `preserved`
- `improved`
- `moved`
- `intentionally-retired`
- `regressed`
- `uncertain`

每项判断必须同时提供：

- master 的 `文件:行号`
- current 的 `文件:行号`
- 语义差异
- 用户或下游 consumer 影响
- 测试或验证证据
- 判断置信度
- 若为迁移，新的 owner 和入口
- 若为退役，退役理由、替代机制和 consumer 证据

## 五、重点识别方法论损失

不能只比较命令和功能。重点检查以下内容是否在重构中被静默删除或弱化：

- 原有决策框架和判断顺序
- anti-rationalization、反例和常见失败模式
- 确定性事实与 LLM 语义判断的职责划分
- source/runtime ownership
- preview-first、fail-closed、degraded-mode
- evidence、freshness、provenance、claim ceiling
- review、verification、handoff、knowledge 闭环
- dirty worktree、跨宿主、provider unavailable 等场景
- 原来可执行的步骤是否被改成了抽象口号
- 原来显式的边界是否变成依赖模型“自行理解”
- 引用拆分后是否仍然可发现、可加载、可执行

以下情况不能直接判定能力丢失：

- 重复内容被去重，但有明确、可达的权威引用
- 方法论迁移到更合理的 owner，且路由和 consumer 完整
- 脚本承担了确定性事实准备，Skill 保留语义判断
- 旧能力被明确退役，并有更好的替代能力和迁移证据
- 文本缩短但行为契约、边界和验证能力保持完整

以下情况应视为有效能力退化：

- 内容虽然存在，但公共入口无法触达
- 引用存在，但执行时不会加载
- gate 从可验证机制退化为沉默约定
- fallback 被删除，provider 不可用时流程失效
- 测试仍通过，但关键语义不再被测试
- 当前版本只有更漂亮的结构，没有等价的方法论或执行机制
- 将 master 的 confirmed contract 降成 advisory，却未显式说明
- 方法论被拆散后失去 owner、consumer 或完整执行顺序

## 六、评价标准

每个 Skill 给出以下结论之一：

- `Improved`：master 的有效能力全部保留，并有可证明的新能力或质量提升
- `Equivalent`：能力无退化，但没有足够证据证明净提升
- `Intentional simplification`：减少复杂度但没有损失有效能力
- `Regressed`：存在确认的能力、方法论、边界或验证退化
- `Uncertain`：证据不足，不能确认保持或提升
- `Added`：current 新增
- `Removed with migration`
- `Removed with capability loss`

“文件更多”“文字更长”“测试数量更多”“结构更新”本身都不能证明提升。

净提升至少要求：

1. master 的有效能力均有可追踪去向；
2. 没有未解决的 P0/P1 能力退化；
3. 新能力有明确 consumer、边界和验证；
4. 没有通过增加提示词复杂度换取不可维护的表面能力；
5. source、runtime、artifact、consumer ownership 更清晰或至少不退化。

## 七、只审不修边界

本轮不授权任何实现修复。即使发现明显退化，也只能：

1. 记录结构化 finding；
2. 提供 master/current 双向 source evidence；
3. 说明用户影响、consumer 影响和严重度；
4. 给出最小修复建议、建议 owner、预计写集和验证方案；
5. 将 finding 保持为 `open`，等待用户另行授权修复。

本轮禁止：

- 修改 `skills/**`、CLI、scripts、tests、README 或 runtime source
- 运行 `spec-first init` 生成或刷新 runtime
- 手改 generated runtime mirror
- 自动恢复 master 文件或批量同步目录
- 以审计报告存在为由宣称退化已修复
- commit、push、创建或更新 PR

审计过程可以执行只读命令和不会改写仓库的验证命令。若某项测试会生成、格式化或更新文件，先不要运行，并在报告中记录限制。

## 八、证据与验证要求

本轮验证重点是证明审计结论，而不是证明修复完成：

1. source 静态对照
2. Skill-local contract/test 覆盖情况检查
3. 相关 CLI、routing、init、projection consumer 检查
4. 必要时运行确定不会修改仓库的聚焦测试
5. 运行测试前后检查 `git status --short`，不得把新生成文件混入用户工作区
6. 最终运行 `git diff --check` 仅能证明当前文本 diff 基础质量，不能证明 Skill 语义正确

如果具备明确 reviewer dispatch 授权和可隔离上下文，可对高风险 finding 执行 fresh-source 只读复核；否则记录为 `not_run` 或 inline/degraded coverage，不得声称独立多 reviewer 覆盖。

区分以下证据层级：

- source 静态确认
- 聚焦测试确认
- integration/runtime projection 确认
- fresh-source 语义确认
- host/field outcome

低层证据不能冒充更高层结果。历史测试通过、transcript 中的“已完成”声明或 provider 图谱输出不能作为当前 outcome 证据。

## 九、输出产物

将审计报告写入新的独立目录，不修改既有审计结论。建议：

`docs/项目审查/<日期>-current-vs-master-skill-capability-audit/`

至少包含：

1. `README.md`
   - 当前分支、HEAD、master SHA、merge base
   - 当前 working-tree overlay
   - 总体结论
   - P0/P1 findings
   - 能否证明“重构后整体能力提升”
   - 证据上限和残余风险

2. `skill-capability-matrix.md`
   - 每个 Skill 的状态
   - master 能力数
   - preserved/improved/moved/regressed/uncertain 数量
   - 最终判定

3. `skills/<skill-name>.md`
   - master 能力账本
   - current 映射
   - 方法论差异
   - 双向证据引用
   - finding 和只读修复建议

4. `cross-skill-migrations.md`
   - rename/split/merge
   - 能力 owner 迁移
   - 路由和 consumer 可达性

5. `findings.md`
   - 按 P0-P3 排序
   - finding ID、状态、证据、反证、用户影响、建议 owner、建议写集、关闭条件和 invalidation condition

6. `verification.md`
   - 实际运行的命令
   - exit code
   - 通过/失败
   - 未运行项及原因
   - claim ceiling

写入这些审计文档和对应的 `CHANGELOG.md` 记录属于本次授权范围；不要借此修改实现 source。写报告前冻结初始比较文件集合，确保新生成的审计文档不会污染 current-vs-master Skill diff。

## 十、最终回复格式

最终回复必须 findings-first，明确给出：

- Skill 总数及分类
- 哪些 Skill 确认提升
- 哪些只是等价或合理精简
- 哪些确认发生退化
- 哪些证据不足
- 是否能基于现有证据证明 current 整体不低于并优于 master
- 审计报告路径
- 实际运行的只读验证
- 未解决风险和建议的下一步修复顺序

如果仍存在 `regression` 或 `uncertain`，不得使用“已确保全面提升”“完全无能力损失”等完成声明。本轮的正确终态是“审计完成并形成待处理 findings”，不是“能力问题已修复”。
```

## 使用说明

- 本提示词授权远程读取、临时 worktree 和审计文档写入，不授权实现修复。
- 如果后续决定修复，应以本轮 `findings.md` 为输入，另行发起明确的 review-and-fix 或 `spec-write-skill` / `spec-work` 请求。
- 对比期间始终以冻结的 `origin/master` SHA 为基准；报告完成后再由 Owner 决定是否删除临时 worktree。
