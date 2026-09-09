---
title: "CE pull 129 提交同步执行口径"
type: refactor
status: active
date: 2026-09-09
sequence: 001
topic: ce-pull-129-commit-sync
execution: code
artifact_contract: spec-unified-plan/v1
artifact_readiness: implementation-ready
upstream_repo: /Users/kuang/xiaobu/compound-engineering-plugin
upstream_range: bbf995a4..153e605e
task_ledger: /Users/kuang/xiaobu/compound-engineering-plugin/docs/git-pull-commit-analysis-2026-09-09.md
---

# CE pull 129 提交同步执行口径

## 目标

以 CE 项目本次 `git pull` 产生的 129 个提交为唯一任务范围，逐提交检查真实 diff，将适用于 spec-first 的 Skill、脚本和行为机制融合到 spec-first 当前 canonical owner，完成逐项验证和可追踪收口。

## 范围与权威

- 任务清单唯一来源：`/Users/kuang/xiaobu/compound-engineering-plugin/docs/git-pull-commit-analysis-2026-09-09.md`。
- 执行范围：`bbf995a4..153e605e`，共 129 个提交。
- `docs/plans/2026-08-19-003-refactor-ce-post-3-20-full-window-sync-plan.md` 仅作为架构、边界、证据和验收约束，不扩大本次提交范围到其 168 提交、517 路径窗口。
- CE 源码和 Git 历史只读；唯一允许修改的 CE 文件是任务表，用于逐行回写核对状态及证据链接。实现、验证和逐项提交归 spec-first。
- 当前表格中的“优化核对进度状态”是任务进度账本；每项核对完成后回写为明确状态。

## 逐提交核对规则

对表格中的每条提交按顺序执行：

1. 读取真实 `git diff`、变更路径和统计，不只依据 commit message。
2. 分类为文档、测试、发布/元数据、Skill、脚本、CLI、配置或 runtime。
3. 文档、测试、发布和纯元数据改动默认作为上游证据，不机械同步；如其内容揭示了需要在 spec-first 中补齐的行为约束，再转化为对应 source/test 任务。
4. 对 Skill、脚本及行为相关改动，寻找 spec-first 的 canonical owner，并判断 `reuse`、`extend`、`compose`、`reference-only` 或产品排除。
5. CE 到 spec-first 的映射以 `ce-*` → `spec-*` 作为初始线索，最终以当前 source owner、职责边界和现有实现为准。

## 融合原则

- 优先复用、扩展和组合现有 owner；不因 CE 同名目录创建 duplicate public Skill。
- 不复制 CE generated runtime、宿主专属目录、中心 runner、plugin topology 或发布流程。
- required-read references 只作为 source 组织方式，不能机械复制 CE 目录结构。
- 脚本负责确定性事实、校验、状态、hash 和 receipt；LLM 负责语义充分性、owner fit、优先级和 review 判断。
- 只修改 spec-first canonical source，例如 `skills/`、`src/cli/`、contracts、scripts、tests 和必要文档。
- 不能把本地机制通过扩大为真实宿主、真实模型、真实 PR/CI、现场收益或已发布状态。

## 产品排除

以下 CE 能力不因上游存在而在 spec-first 中新增对应 public Skill：

- `ce-babysit-pr` → 不创建 `spec-babysit-pr`。
- `ce-proof` → 不创建 `spec-proof`。
- `ce-retune` → 不创建 `spec-retune`。
- `ce-setup` → 不创建 `spec-setup`；仅按需吸收到 `spec-runtime-setup`、CLI、配置 contract 和 readiness consumer。
- 不自动引入 CE 的 OMP、Agent Plugins、新宿主或其他宿主专属产品面。

## 单项完成闭环

每完成一个需要同步的 Skill/脚本任务：

1. 确认当前 canonical owner 与变更边界。
2. 实施最小必要融合。
3. 增加或更新能够证明行为的 focused test；纯机械或无需同步项使用替代核对并记录原因。
4. 运行最窄适用代码检查，失败即修复并复跑。
5. 检查实际 changed set，排除无关文件和 generated runtime 修改。
6. 在 spec-first 创建一次只包含当前核对项的独立提交。
7. 回写 CE 任务表对应行的“优化核对进度状态”，至少标记为“已完成核对”；状态统一写为“已完成核对”，裁决类型和依据保存在逐项核对记录中；不得用笼统的“无需同步”替代结论。
8. 再进入下一条提交任务。

提交授权沿用当前会话对本次逐项同步的明确授权；不执行 push、PR、release 或其他外部 landing。

## 全局验收

全部任务完成后执行适用的：

- `npm run typecheck`
- `npm run lint:skill-entrypoints`
- 受影响 Skill/脚本的 focused tests
- 按影响面执行 `npm run test:unit`、`npm run test:smoke`、`npm run test:integration` 和 `npm run build`

最终报告必须区分：已实现、已验证、无需同步、证据不足、产品排除、degraded/not-run。任何失败或缺失证据都保持可见，不得用局部通过关闭整体任务。

## 非目标

- 不扩展到既有全量方案之外的其他 CE 提交或路径。
- 不机械复制 CE 文档和测试。
- 不手改 generated runtime mirror。
- 不执行外部 provider、GitHub PR/CI、浏览器/Xcode、生产发布或现场效果验证。

## 重执行修订：纠正此前完成声明

此前将大量提交批量标记为无需同步，缺少逐提交完整 diff、目标源码对应和验证证据，因此原“129/129 完成”声明撤回。任务必须重新逐项核对。

此前的 `5c465eae`、`8368dd57`、`8705df0a` 仅是待审查的已有改动，不是对应 CE 提交完整吸收的证明。重执行从第 1 行开始，前两行遗留完成状态也必须重新验证，不能直接跳过。特别检查新增 reference 是否存在、规则是否实际写入、是否遗漏 diff 中的其他行为，以及提交是否混入原有 dirty 内容。不得通过重写历史或丢弃用户修改修复这些问题。

用户已在原 session 授权按本方案继续执行，并于 2026-09-09 要求读取该 session 后继续完成。当前按既定范围执行，状态恢复为 active；这不表示用户已逐项验收。恢复审计发现任务表 97 行多余空列、97 份通用证据模板与不实完成声明，具体进展和未完成项见 [恢复审计](../validation/ce-pull-2026-09-09/recovery-audit.md)。不以原 session 的完成声明替代当前源码和验证证据。

## 核对粒度与增量判断

每个表格行是一个任务，按表格顺序串行完成。先列出该提交全部变化路径，再读取完整 patch；输出截断时分文件续读，不把 name-only、stat、提交标题或旧方案完成标记当作 diff 已读证明。

- 纯 `docs/`、测试、发布元数据的改动不移植；混合提交只排除这些路径，继续检查其 Skill 和脚本部分。
- `SKILL.md`、`references/*.md`、persona、agent prompt 和行为模板属于 Skill 源码，不能因为扩展名是 Markdown 就排除。
- 脚本、assets、配置及 CLI 变更按实际 consumer 判断。新文件、删除、重命名和调用点都需覆盖，不能只看入口。
- 从 diff 提取触发条件、前后行为、修复的问题、失败路径、输入输出及消费者变化；然后读取 spec-first 当前对应源码，判断真实差距。
- `ce-* → spec-*` 是导航线索。`ce-skill-work` 的历史映射为 `spec-write-skill`，`ce-setup` 为 `spec-runtime-setup` 与相关 CLI/config owner，`lfg` 为 `spec-lfg`；实施时重新确认 owner 是否仍有效。
- 已有部分能力时补齐差额；结构迁移时核对 required-read 时机和语义保留；后续提交可能再次调整同一规则，逐项解释变化，不倒灌整份最新文件。
- 旧同步窗口与本窗口重叠不构成跳过依据，必须用当前源码确认是否仍有等价实现。产品排除只适用于既有明确排除项，不能推导为其余全部无需同步。
- CE 新能力优先评估能否由当前 owner 吸收。没有同名 Skill 不等于不适用；确实需要新增产品面时记录待决策项，不能标完成。

## 每项必须留下的证据

在 spec-first 的 `docs/validation/ce-pull-2026-09-09/` 下按序号和 CE SHA 创建简短核对记录。记录本身服务可审查与逐项提交，不新增中心 runner 或复杂账本系统。

| 字段 | 必需内容 |
|---|---|
| 上游 | 完整 SHA、父提交、全部变更路径与实际读取的 patch 范围 |
| 行为增量 | 改前、改后、触发条件和失败路径；纯证据项明确注明 |
| 目标映射 | 当前 spec-first owner 和具体文件/段落或函数 |
| 裁决 | 已融合、部分适用且已融合、已有等价实现、纯文档/测试排除、产品排除；未决则保持未完成 |
| 理由 | 每个行为点如何对应目标源码，不能只写“已有边界” |
| 实施 | 本项修改路径，或无源码修改的直接证据 |
| 验证 | 实际命令、退出码、测试覆盖内容、语义审查与未运行限制 |
| 提交 | 当前项提交消息中的 CE SHA；表格回写提交短 SHA 和记录链接 |

没有源码变更的任务也单独提交其核对记录及必要 Changelog，以满足逐项提交要求，不制造空代码修改。证据记录不能预填未来提交 SHA；完成提交后将真实 SHA 写入表格。状态值保持“已完成核对”，必要时在表格增加独立的裁决/证据列。

## 提交安全与失败处理

每项开始记录 HEAD、staged、unstaged、untracked 状态，提交前检查暂存区逐行 diff。已有 dirty 文件只能暂存本任务拥有的 hunk，特别是 CHANGELOG；禁止整文件 add 混入无关改动。提交钩子失败时读取实际原因，不跳过检查、不把命令尝试记为成功。

只有该项所有适用行为都完成映射、实施或有据排除，必要验证通过且独立提交成功，才回写完成状态。证据不足、测试失败、缺引用文件或关键裁决未定时保持未完成，先解决本项问题再进入下一项。不得批量预填完成状态。

## 最终全面审查的完成条件

1. Git 固定窗口的提交集合与任务表 129 行一一对应，无漏项、重复或窗口扩大。
2. 每一行有可回源核对记录及独立提交，所有适用 Skill/脚本行为点有目标实现或明确排除依据。
3. 检查跨提交组合后的最终行为、references 可达性、producer/consumer 一致性、脚本失败语义和 source/runtime 边界。
4. 按风险运行 focused tests 和 fresh-source 语义检查。测试文件先发现再执行，不能编造路径；typecheck 或静态字符串测试不证明 Skill 行为充分性。
5. 执行上述仓库级检查并保留最终结果。已有失败必须通过隔离基线或等价证据归因，不能未经比较就宣布与本次无关；不得改历史 review receipt 的 hash 来伪造新的审查通过。
6. 全面审查发现的问题完成修复和相关复验。缺失或失败的必要证据保持整体未完成，不以表格全填满、三次提交或窄测试通过宣称目标完成。
