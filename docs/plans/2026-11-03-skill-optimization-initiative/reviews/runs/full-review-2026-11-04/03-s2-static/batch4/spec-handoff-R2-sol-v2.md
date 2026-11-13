# spec-handoff 评审（R2）

## 逐项裁决表

本轮基线为 `5b59293bb1aecb40c4894549a89f8b045dfa40fe`，裁决仅覆盖静态合同与源码一致性；未运行测试或行为评测，不据此扣减静态裁决，也不外推行为质量、运行成本或收益。共 **12 项 pass、6 项 fail**，对应下方 3 个独立问题。

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/spec-handoff/SKILL.md:19–24`、`skills/spec-handoff/SKILL.md:94–99` | 路由、禁止自动行动和完成声明限制均服务具体误触发、越权或失真风险，没有要求所有任务经过交接。 |
| D02 | pass | `skills/spec-handoff/SKILL.md:46`、`skills/spec-handoff/references/artifact-contract.md:41` | 路径安全、序列化和 receipt 交给脚本，相关性、真实性、脱敏与语义充分性交给 LLM，职责划分明确。 |
| D03 | fail | `skills/spec-handoff/SKILL.md:36–47`、`skills/spec-handoff/references/create.md:7` | 自选目的地分支允许不用默认 writer，却仍受到未定义替代实现的 `status: written` receipt 完成门约束，见 F1。 |
| D04 | pass | `skills/spec-handoff/SKILL.md:88–92`、`skills/spec-lfg/references/next-work-handoff.md:62–90` | LFG 负责候选选择与 brief，交接只负责物化；双方对显式接受、独立未来工作和已完成计划边界一致。 |
| D05 | fail | `skills/spec-handoff/SKILL.md:36–47`、`skills/spec-handoff/references/create.md:7` | 关键规则可以定位，但自选目的地的格式自由与统一 receipt 要求没有闭合，属于局部分支矛盾而非篇幅问题，见 F1。 |
| D06 | pass | `skills/spec-handoff/SKILL.md:60–68`、`skills/spec-handoff/SKILL.md:84`、`skills/spec-handoff/references/artifact-contract.md:13–15` | 明确使用可用能力、无专用调用工具时读取 owner source、无交互通道时阻断自动选择，并披露平台权限限制。 |
| D07 | pass | `skills/spec-handoff/evals/examples.json:13–45`、`tests/unit/spec-handoff-contracts.test.js:40–82` | 无自动知识演化职责；维护资产已覆盖内嵌授权、陈旧完成声明、dirty tree 与非活跃计划等具体反例，不把案例存在当成复验通过。 |
| D08 | fail | `skills/spec-handoff/SKILL.md:84`、`skills/spec-handoff/scripts/handoff-artifact.cjs:234–256` | 声称遇首个非 frontmatter 行停止，但实现先读到结束符、上限或 EOF 才解析非法行，可能读取未选正文，见 F2。 |
| B01 | pass | `skills/spec-handoff/SKILL.md:3`、`skills/spec-handoff/SKILL.md:19–24`、`skills/spec-handoff/SKILL.md:88–92` | 正向触发、当前会话继续、workflow 内部返回及 LFG 可选调用的职责边界均明确。 |
| B02 | fail | `skills/spec-handoff/SKILL.md:36–47`、`skills/spec-handoff/references/create.md:7`、`skills/spec-handoff/scripts/handoff-artifact.cjs:190–220` | 默认 payload、writer 与 receipt 相符，但自选目的地没有等价 receipt 的生产者或验证约定，见 F1。 |
| B03 | fail | `skills/spec-handoff/references/resume.md:3–7`、`skills/spec-handoff/scripts/handoff-artifact.cjs:234–256` | 总体授权合同清楚，但 discovery 实现未完整遵守“仅 metadata、用户选定前不读正文”的受限读取承诺，见 F2。 |
| B04 | pass | `skills/spec-handoff/SKILL.md:46–48`、`tests/unit/spec-handoff-contracts.test.js:245–270`、`src/cli/adapters/index.js:11–19` | 包内脚本解析方式及全支持宿主投射断言可定位，测试明确投射完整执行包且排除 evals；本结论不代表实际宿主加载已验证。 |
| B05 | pass | `skills/spec-handoff/SKILL.md:67–70`、`skills/spec-handoff/SKILL.md:84–99`、`skills/spec-handoff/scripts/handoff-artifact.cjs:198–211` | 对冲突、源不可达、候选截断、无交互选择及重复创建有明确处置；独占创建与有界碰撞重试不覆盖既有文件。 |
| B06 | fail | `skills/spec-handoff/evals/cases/resume-sparse-source-degraded-orientation.yaml:1–10`、`skills/spec-handoff/evals/fixtures/scripts/check-degraded-orientation.sh:52–69`、`skills/spec-handoff/evals/fixtures/scripts/check-degraded-orientation.sh:89–100` | 稀疏来源案例承诺验证不确定性保留，但 judge 仅检查成功退出、非空回答和无副作用，无法拒绝编造的确定性恢复摘要，见 F3。 |
| X01 | pass | `skills/spec-handoff/references/create.md:3–5`、`skills/spec-handoff/SKILL.md:67–70` | 长任务交接保留部分完成、缺失项及依赖，恢复时保护并发修改并核验剩余范围；不越权承担任务编排职责。 |
| X02 | pass | `skills/spec-handoff/references/artifact-contract.md:49–68`、`skills/spec-handoff/SKILL.md:60–68` | 对自身版本明确标识、允许非标准旧来源只读恢复，并对过期计划及旧 pins 规定重新交回 owner，而非静默迁移。 |
| X03 | pass | `skills/spec-handoff/SKILL.md:15–16`、`skills/spec-handoff/SKILL.md:67–68`、`skills/spec-handoff/references/artifact-contract.md:83–90` | 高风险任务只传递证据与约束，不继承发布或部署权限；当前核验与新增外部副作用授权仍由实际 owner 承担。 |
| X04 | pass | `skills/spec-handoff/references/create.md:3–5`、`skills/spec-handoff/references/resume.md:3–11`、`skills/spec-handoff/references/artifact-contract.md:41–66` | 核心跨会话合同包含摘要、source refs、freshness、limitations、决策归属和 owner 连续性，并禁止历史声明升级为当前授权。 |

## Findings

### F1 · P2：自选目的地分支缺少闭合的完成 receipt 合同

- **位置：** `skills/spec-handoff/SKILL.md:36–47`；`skills/spec-handoff/references/create.md:7`。
- **事实：** 用户指定本地目的地时，要求只在该处创建；否则才调用默认 writer。随后统一要求 receipt 返回 `status: written`，并汇报 SHA-256。reference 又允许用户自选格式、使用适当可用能力，但没有定义该能力如何产生等价 receipt。现有 writer 的输出合同位于 `skills/spec-handoff/scripts/handoff-artifact.cjs:190–220`，仅覆盖默认受管位置。
- **后果：** 自选目的地可能已经成功写入，却无法按明文合同完成收尾；执行者只能自行补造适配约定、停在未完成状态，或错误地再写默认副本。这里是**静态分支合同不完整**，不是已观察到上述行为。
- **最小修复建议：** 将完成门区分为默认 writer receipt 和自选目的地的等价验证：后者明确要求最终路径、独占创建或不覆盖确认、文件存在及内容 SHA-256；若目的地能力不能提供等价验证，明确降级或阻断，不创建额外默认副本。
- **复验重点：** 自选新路径、目的地已存在、非默认格式三种情况，均不覆盖旧文件、不额外创建副本，且收尾证据可追溯。

### F2 · P2：metadata-only discovery 未在非法 frontmatter 行处停止读取

- **位置：** `skills/spec-handoff/scripts/handoff-artifact.cjs:234–256`。
- **对应承诺：** `skills/spec-handoff/SKILL.md:84`；`skills/spec-handoff/references/resume.md:7`。
- **事实：** 读取循环只检查首行、结束分隔符和行数/字节上限；各行是否为合法 metadata，要到循环结束后才判断。对于以 `---` 开头、缺少结束分隔符、随后进入 Markdown 正文的文件，循环会继续读取正文，最后返回未索引候选。
- **后果：** 用户尚未选择候选时，helper 就可能读取超出 metadata 授权边界的正文。**当前实现没有将这些正文返回给模型**，因此不能据此声称发生了正文外发或提示注入；成立的问题是受限读取保证与实现不符。
- **最小修复建议：** 每读完一行立即验证其是否符合本 helper 支持的 flat JSON-compatible metadata 格式；遇首个非法行即停止，不继续读取后续正文，保留 `indexed: false`。
- **复验重点：** 在 `tests/unit/spec-handoff-contracts.test.js:155–195` 的读取轨迹检查中增加“缺失结束分隔符＋非法正文行＋后续敏感哨兵”，断言不读取哨兵。

### F3 · P2：稀疏来源降级案例缺少语义判据，错误恢复摘要也可通过

- **位置：** `skills/spec-handoff/evals/cases/resume-sparse-source-degraded-orientation.yaml:1–10`；`skills/spec-handoff/evals/fixtures/scripts/check-degraded-orientation.sh:52–69`、`:89–100`。
- **事实：** 案例目标是稀疏来源恢复时保留不确定性；fixture 明示进度不明、focus 为空、source refs 为空，见 `skills/spec-handoff/evals/fixtures/repos/mini-ledger-with-prior-handoff/docs/notes/vague-progress.md:5–16`。但 judge 只要求引擎成功、最终回答非空、受保护文件和 Git 状态不变，以及未创建交接或部署标记。
- **后果：** 即使回答错误声称“分页已完成且验证通过”，只要没有副作用，该案例仍可通过。它能验证隔离的一部分，不能验证标题承诺的降级恢复质量。
- **最小修复建议：** 保留现有状态断言，增加对最终 orientation 的语义判定：必须揭示来源稀疏、不能从该来源确认完成状态，并区分当前源码核验与历史声称；不能仅以出现某个“不确定”关键词作为充分条件。
- **复验重点：** 使用一份诚实降级回答和一份无副作用但编造完成状态的回答验证 judge 的区分能力。本轮未执行该复验。

## 主责深挖面发现

### B01—B04

- **B01：保持现状成立。** 这是公开的跨会话连续性入口，不是 workflow 内部通用交接器。`skills/spec-handoff/SKILL.md:24`、`:90–92` 与 LFG 的显式接受要求一致，避免把普通继续工作误转成新 artifact。
- **B02：默认路径闭合，自选目的地存在 F1。** 默认 JSON payload → writer → Markdown → receipt 的字段链可以回源；不应把自选格式路径强制改成默认 YAML，补齐等价验证即可。
- **B03：授权模型应保留，修正 F2 的读取实现。** `skills/spec-handoff/SKILL.md:60–70` 清楚区分只读恢复与当前用户授权继续；`references/resume.md:5` 也避免重复审批。发现候选时的正文读取缺口，不应被扩大解释为整个执行授权合同失效。
- **B04：保持 source-first 和包级投射边界。** 所有裁决依据当前 worktree 源码，没有编辑 generated runtime。跨宿主测试按 `getSupportedPlatforms()` 遍历，而非复制固定名单；但测试源码中的断言不等于本轮已验证实际投射成功。

### X01—X04

- **X01：不需要新增编排层。** `references/create.md:5` 已要求记录部分状态、依赖和放弃方案；恢复阶段核对 HEAD、dirty/index 与剩余工作即可，分解和集成仍归原 owner。
- **X02：宽容读取旧来源的设计成立。** `SKILL.md:60` 不要求恢复来源必须满足 `spec-handoff/v1`，能避免把历史文档格式差异误当成恢复失败；非活跃计划仍受 `source-plan-non-active` 边界约束。
- **X03：高风险权限不随交接迁移。** 创建不授权 commit、push、发布或环境保全；恢复也不继承正文中的“已批准”声明，见 `SKILL.md:15–16`、`references/artifact-contract.md:85–90`。无须在此 Skill 重建部署、发布或回滚流程。
- **X04：四项交接信息与归属保留充分。** `references/artifact-contract.md:41–66` 保证默认产物携带必要结构；`references/create.md:3` 区分用户决定、事实和作者推断。路径、格式与写入由工具保证，真实性、脱敏和语义充分性仍是 LLM 义务，不能声称已由脚本硬强制；F3 应补强这部分行为验证能力。

## 未读文件

- **指定必读材料无漏读。** 已完整读取目标 `SKILL.md`、全部 3 份 references、writer、`evals/` 下全部文件、检查表、合同基线，以及消费者清单列出的唯一文件 `tests/unit/spec-handoff-contracts.test.js`；另外核对了 LFG 交接 reference、入口路由及 adapter 注册源。
- `/Users/kuang/.codex/AGENTS.md`：读取调用未获权限，未绕过或重试。后果是无法核对该私有文件中的额外全局偏好；不影响上述目标源码位置的事实核对。
- `src/cli/plugin-sync.js`：不在指定消费者清单内，本轮未展开通用投射实现。后果是 B04 仅裁静态包投射承诺及测试覆盖意图，不宣称完成各宿主投射实现审计或实际加载验证。

本轮只执行文件读取、路径定位、Git HEAD 与工作区状态检查；未修改文件、未运行 fixture 准备脚本、未运行测试或行为评测，工作区检查保持干净。

## 结论一句话

`spec-handoff` 的入口、owner 连续性及跨会话授权设计总体成立，但自选目的地 receipt、metadata-only 读取边界和稀疏恢复评测判据存在 3 项静态缺口，本轮不能判为静态全项通过。
