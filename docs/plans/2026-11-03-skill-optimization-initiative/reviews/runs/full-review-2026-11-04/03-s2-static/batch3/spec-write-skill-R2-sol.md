# spec-write-skill 评审（R2）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/spec-write-skill/references/behavior-contract-design.md:7`；`skills/spec-write-skill/references/authoring-workbench.md:7` | 以可观察行为增量约束 prose，并允许非承重修订走短路径，没有将所有任务强制展开为完整设计流程。 |
| D02 | pass | `skills/spec-write-skill/references/authoring-method.md:74`；`skills/spec-write-skill/SKILL.md:41` | package 资源归属、迁移 disposition 和反模式有明确领域判据，机械事实与 LLM 语义判断分工清楚。 |
| D03 | fail | `skills/spec-write-skill/references/delivery-gates.md:17`；`skills/spec-write-skill/scripts/validate-skill.cjs:172`；`skills/spec-write-skill/scripts/validate-skill.cjs:224` | validator 承诺 no-follow，但发现根路径 symlink 后仍解析真实路径并继续读取，错误结果不能补救已经发生的越界检查。 |
| D04 | fail | `skills/spec-write-skill/SKILL.md:59`；`skills/spec-write-skill/scripts/validate-authoring-preview.cjs:144` | 交付要求同步 tests/docs/Changelog，而 preview consumer 禁止声明 Skill canonical root 之外的文件，合法完整交付无法绑定同一写集。 |
| D05 | pass | `skills/spec-write-skill/SKILL.md:25`；`skills/spec-write-skill/SKILL.md:45`；`skills/spec-write-skill/references/authoring-workbench.md:13` | 分支、出口和条件读取可定位，复杂 map/topology 仅在改变决策时展开；不以篇幅本身判缺陷。 |
| D06 | pass | `skills/spec-write-skill/references/evaluation-design.md:18`；`skills/spec-write-skill/references/target-profiles.md:36` | 明确区分模型配置、source 适配、runtime 投射和能力验证；无模型调用授权或宿主证据时降级，不外推跨模型效果。 |
| D07 | pass | `skills/spec-write-skill/references/optimization-and-lifecycle.md:7`；`skills/spec-write-skill/references/evaluation-design.md:16` | feedback 先保持 observation，进入 regression 需要脱敏复现、预期确认与写授权，并保留 baseline、失效条件及不可推广状态。 |
| D08 | pass | `skills/spec-write-skill/SKILL.md:27`；`skills/spec-write-skill/references/authoring-method.md:55`；`skills/spec-write-skill/references/evaluation-design.md:30` | 先按 disposition 选择必要资料，inventory 不回传全部正文，读取证据按实际决策依赖要求，不机械追求少读。 |
| B01 | pass | `skills/spec-write-skill/SKILL.md:3`；`skills/spec-write-skill/SKILL.md:31`；`skills/spec-write-skill/evals/trigger-cases.json:55` | authoring/readiness、audit-only、纯安装及 runtime maintenance 的职责分支明确，近邻分支要求路由后停止。 |
| B02 | fail | `skills/spec-write-skill/references/authoring-workbench.md:35`；`skills/spec-write-skill/references/delivery-gates.md:82`；`tests/unit/spec-write-skill-authoring-preview.test.js:122` | semantic envelope 所需完整 changed surfaces 与脚本接受的单 package 写集不一致，且测试固化了这一限制。 |
| B03 | fail | `skills/spec-write-skill/SKILL.md:33`；`skills/spec-write-skill/scripts/validate-skill.cjs:172`；`skills/spec-write-skill/scripts/validate-skill.cjs:353` | 只读不升级 apply 的文案成立，但被信任 validator 对含 symlink 的目标根没有在读取前停止，违反外部 package 的 no-follow 信任边界。 |
| B04 | fail | `skills/spec-write-skill/scripts/validate-authoring-preview.cjs:9`；`src/cli/adapters/opencode.js:49`；`skills/spec-write-skill/references/project-profiles.md:24` | source-first 原则清楚，但确定性 runtime 路径排除表遗漏实际存在的 OpenCode generated Skill root。 |
| B05 | fail | `skills/spec-write-skill/references/authoring-workbench.md:44`；`skills/spec-write-skill/scripts/validate-skill.cjs:174`；`skills/spec-write-skill/scripts/validate-skill.cjs:180` | partial failure、dirty overlap 和能力缺失有停止规则，但路径安全错误只累计 finding、不阻断后续检查，隔离失败路径未闭合。 |
| B06 | fail | `skills/spec-write-skill/references/evaluation-design.md:32`；`skills/spec-write-skill/evals/fixtures/scripts/check-mirror-refused.sh:8` | 交付合同要求根据可观察动作和产物判定，而自带 mirror 行为用例仅以最终文本关键词判通过，无法排除实际修改镜像的反例。 |
| X01 | pass | `skills/spec-write-skill/references/authoring-workbench.md:13`；`skills/spec-write-skill/references/authoring-workbench.md:19`；`skills/spec-write-skill/references/evaluation-design.md:13` | 多 owner/consumer、复杂资源调整和长时 loop 有按需分解、ArchitectureFit、checkpoint/recovery 评测要求，不强造编排体系。 |
| X02 | fail | `skills/spec-write-skill/SKILL.md:23`；`skills/spec-write-skill/references/authoring-method.md:104`；`skills/spec-write-skill/scripts/validate-authoring-preview.cjs:144` | 版本与迁移保留规则存在，但涉及 contract/consumer/governance 联动的合法修订被 package-only 写集限制阻断。 |
| X03 | fail | `skills/spec-write-skill/references/delivery-gates.md:37`；`skills/spec-write-skill/scripts/validate-skill.cjs:224`；`skills/spec-write-skill/scripts/validate-skill.cjs:360` | 外部未知 package 是本 Skill 明确覆盖的高风险分支，而它依赖的 validator 未兑现根路径 no-follow；不是因为本轮未运行行为测试判失败。 |
| X04 | pass | `skills/spec-write-skill/references/optimization-and-lifecycle.md:7`；`skills/spec-write-skill/references/authoring-workbench.md:35`；`skills/spec-write-skill/references/evaluation-design.md:28` | 交接保留 source snapshot、scope、owner limitations 与 invalidation；fresh-source、独立 reader 和模型自述的证据边界明确。 |

以上裁决仅针对 `structure_contract`。源码版本为 `5b59293bb1aecb40c4894549a89f8b045dfa40fe`，工作树检查为空；未运行测试、模型评测或 runtime 投射，未修改文件。测试文件用于核对当前断言，不作为本轮测试通过证据。`core/08` 未为本 Skill 定义专属输出 schema，其主链路拟议 YAML、计数门槛和自动语义裁决不直接套用。

## Findings

### F1 · P1：完整 source 交付与 preview 写集边界互相冲突

- **位置：** `skills/spec-write-skill/scripts/validate-authoring-preview.cjs:144`、`:187`。
- **事实：** 所有声明路径及 snapshot 文件都必须位于 `canonical_source_root` 内；但 `skills/spec-write-skill/SKILL.md:59` 和 `references/delivery-gates.md:82-86` 要求同步必要 tests/docs/Changelog，新增入口还涉及治理记录。
- **后果：** 以 `skills/example-skill` 为 canonical root 时，`tests/...`、根 `CHANGELOG.md`、治理 JSON 无法进入通过验证的同一写集；只修改 package 又不能完成项目交付义务。任意扩大 canonical root 还会破坏其“Skill source root”的身份及 canonical `SKILL.md` snapshot 语义。
- **消费者证据：** `tests/unit/spec-write-skill-authoring-preview.test.js:122-140` 明确断言 root 外文件失败，当前测试没有覆盖合法的跨 source surface 修订。
- **最小修复建议：** 保留单 repo、单 Skill owner，另外显式声明获授权的 supporting source paths；让 preview/snapshot/receipt 对这些精确路径统一绑定，而不是放宽整个 repo。补充“Skill + test + Changelog”正例和未授权相邻路径负例。

### F2 · P1：validator 对不安全目标根报错后仍继续读取

- **位置：** `skills/spec-write-skill/scripts/validate-skill.cjs:172-175`、`:180-189`、`:224-240`、`:353-360`。
- **事实：** 检出 root/ancestor symlink 或目标位于 authorized root 之外时，只追加 finding；随后仍调用 `realpathSync`，对解析后的目录执行 inventory，并单独读取 `SKILL.md`。直接 symlink root 虽跳过 walk，仍会进入该 `SKILL.md` 读取路径。
- **后果：** 外部 package 的链接根可以导致检查器读取链接目的地；授权范围检查也变成“读完再报告不合法”。最终 `fail` 并不撤销已发生的读取，违反 `SKILL.md:33` 的 no-follow 合同。
- **消费者证据：** `tests/unit/spec-write-skill-validator.test.js:266-289` 只断言结果为 fail，没有断言零 inventory/零目标读取。相邻 inspector 已有提前返回实现：`scripts/lib/package-inspection.cjs:131-134`。
- **最小修复建议：** root symlink、祖先 symlink、containment 失败或无法确认时，在任何目标内容读取前终止；补充读取 spy，断言不调用目标 `readdir`/文件读取，而不只是断言退出状态。

### F3 · P2：generated-runtime 确定性排除表遗漏 OpenCode

- **位置：** `skills/spec-write-skill/scripts/validate-authoring-preview.cjs:9`、`:141`。
- **事实：** 排除表仅包含六组历史路径；实际 adapter 将 `.opencode/skills` 声明为 generated Skill/workflow root，见 `src/cli/adapters/opencode.js:49-55`。项目 profile 的 runtime 列表也仍停留在同样六组路径，见 `references/project-profiles.md:24`。
- **后果：** 即使其他 manifest、scope、snapshot 均合法，preview 也不会因目标位于 `.opencode/skills/...` 而报 `generated_runtime_path_forbidden`；source/runtime 边界只剩上游 LLM owner 判断兜底。这里不能声称脚本已覆盖当前项目的完整 runtime 边界。
- **最小修复建议：** 由项目 profile 提供当前受管理的 runtime 路径事实，并补上 OpenCode 负例；同步核对其余当前宿主。不要为了修路径检查引入 provider 行为判断。

### F4 · P2：mirror 拒绝用例可将实际写镜像的输出判为通过

- **位置：** `skills/spec-write-skill/evals/fixtures/scripts/check-mirror-refused.sh:8-11`；`skills/spec-write-skill/evals/cases/mirror-patch-refused.yaml:24-27`。
- **事实：** judge 只检查最终消息是否同时包含 source 指示词和任一“拒绝”候选词；后者包括 `runtime`、`mirror`、`init`，并不要求真实拒绝，也不检查文件变化或工具动作。
- **后果：** 类似“已修改 runtime mirror，后续可同步 source skills/”的错误交付同样满足判据；尝试写入后再声称拒绝也无法被检出。这是判据的静态假阳性，不是本轮推断出的实际行为失败。
- **最小修复建议：** 将拒绝语义判定与动作证据分开：核对目标镜像未修改、无禁止写入尝试，并要求正确 source/runtime 后续指引；只有最终文本时明确降格为文本冒烟检查，不作为边界行为通过证据。

## 主责深挖面发现

### B01–B04

- **B01：保持现状成立。** `SKILL.md:31-35` 将近邻路由、owner blocker、validate-only 和 apply 分开，`authoring-method.md:20` 进一步禁止近邻分支继续 inventory/validator。不能因为它提供 authoring 方法就将普通只读质量审查强行纳入。
- **B02：核心问题是写集合同，而不是输出字段不足。** `layer_result` 与五轴 readiness 在入口、references、fixture 和 contract tests 中有对应；F1 则使“完整 source patch”无法被当前 preview consumer 接受。
- **B03：授权 prose 值得保留，工具读取出口需要修正。** `SKILL.md:39-40` 不重复索取已覆盖授权，也不把 package 内 validator 当可信工具；`authoring-method.md:53` 禁止 validate-only 升级 apply。F2 是这些承诺在确定性读取路径上的具体断裂。
- **B04：source-first 原则成立，路径清单不足。** runtime 重建、catalog 生成和 maintainer-only evals 的边界明确；F3 不意味着所有宿主投射都错误，只证明 OpenCode runtime 未进入该脚本的拒绝范围。

### X01–X04

- **X01：保持现状成立。** `authoring-workbench.md:19` 优先判断独立证据方向、合并能力和协调成本，不按 agent 数建立固定 roster；长任务的 checkpoint/recovery 进入相应 eval family，不要求本 Skill 变成通用执行引擎。
- **X02：迁移判据可保留，但联动交付受阻。** `authoring-method.md:104-111` 对未知 sidecar 默认保留或人工裁决，避免清理式删除；真正阻断是 F1，尤其影响修改输出合同后同步 consumer/tests/governance 的场景。
- **X03：风险加严不是缺失，风险实现有漏洞。** `delivery-gates.md:29-42` 已覆盖外部包、高权限、外发和可分发 payload；应修 F2 的入口读取短路，不能继续增加安全口号代替。
- **X04：保持现状成立。** `optimization-and-lifecycle.md:7-9` 保留 handoff 所需 source、baseline、budget、stop、rollback 与 invalidation；无法复现的反馈不晋升 regression，失败产物也不自动成为 durable knowledge。

## 未读文件

- **本次指定必读范围无未读文件：** 已读完整 `SKILL.md`、全部八份 references、四份 runtime scripts/lib、全部 package 内 eval/fixture 资产、target sidecar、检查表、合同基线及消费者清单列出的十一份测试文件。
- `/Users/kuang/.codex/AGENTS.md`：读取权限未获批准，未尝试绕过；无法核对该全局文件是否还有额外约束。
- `src/cli/plugin-sync.js`、`src/cli/plugin-governance.js`、`src/cli/state.js` 及其递归依赖：未展开读取，属于消费者测试进一步引用的投射/应用实现；因此不声称当前全部宿主的实际投射与写入行为已验证。
- `src/cli/adapters/opencode.js:91` 之后及其余宿主 adapter 实现：仅为确认 F3 有界读取 OpenCode 路径声明；不对其余宿主是否存在同类遗漏或完整兼容性作结论。
- `docs/validation/2026-07-12-spec-write-skill-promotion/**` 等历史评测原始证据：未读取，不以旧 promotion 测试或历史通过状态证明当前行为质量、成本或收益。

## 结论一句话

本轮静态审查完成全部 18 项裁决；该 Skill 的职责、授权与评测分层设计总体清楚，但完整写集无法交付、validator 未兑现 no-follow、OpenCode runtime 排除遗漏及拒绝用例假阳性四项问题使其当前静态合同不能判为通过。
