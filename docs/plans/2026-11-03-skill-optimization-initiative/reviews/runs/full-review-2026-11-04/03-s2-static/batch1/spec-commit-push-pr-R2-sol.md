# spec-commit-push-pr 评审（R2）

评审范围为冻结提交 `5b59293bb1aecb40c4894549a89f8b045dfa40fe` 的当前磁盘源码。已通读入口、全部 6 份 references、指定的 4 份消费者测试，以及相关 eval 配置和部分 fixture。只读审查，未执行提交、推送、PR 写入、测试或行为 eval；结束时 `git status --short` 无输出。

以下裁决限于 **structure_contract 静态层**。`pass` 表示承诺存在、内部一致且可定位，不证明模型实际遵守或真实交付成功。证据路径均相对仓库根目录。

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/spec-commit-push-pr/references/branch-creation.md:5-10`；`skills/spec-commit-push-pr/references/commit-and-push.md:14-34` | 分支新鲜度、提交归属、混合修改和中断恢复约束均对应具体失败模式，不能仅因模型能力提升而删除。 |
| D02 | pass | `skills/spec-commit-push-pr/references/context.md:18-35`；`skills/spec-commit-push-pr/references/pr-description-writing.md:145-151` | 编码了 fork 身份匹配、退出码及 tracker closing 语义等领域知识，事实由工具提供、叙事和适用性由模型判断。 |
| D03 | fail | `skills/spec-commit-push-pr/references/commit-and-push.md:58-69`；`docs/methodology/结构化项目角色契约.md:72-74` | 发布前验证义务明确，但未说明这些停止要求属于无运行时强制器的文案约定，缺少合同要求的强制能力披露，见 F1。 |
| D04 | pass | `skills/spec-lfg/references/shipping-tail.md:38-59`；`skills/spec-commit-push-pr/SKILL.md:111-128`；`tests/unit/pipeline-mode-contracts.test.js:49-61` | 上游显式传递授权与范围，helper 返回事实和未决事项，后续 watch、复验与最终完成仍归 LFG owner。 |
| D05 | fail | `skills/spec-commit-push-pr/SKILL.md:24-25`；`skills/spec-commit-push-pr/references/pr-description-writing.md:37,195` | reference 拆分总体清晰，但保留了不存在的 DU-3 和已迁移 ownership 的旧指路，见 F2。 |
| D06 | pass | `skills/spec-commit-push-pr/SKILL.md:18,28`；`skills/spec-commit-push-pr/references/pr-description-writing.md:75-99,167-171` | 不依赖指定模型能力，问答工具缺失、对象获取失败及证据不足均有降级或停止路径；不外推未经验证的多模型效果。 |
| D07 | pass | `skills/spec-commit-push-pr/references/branch-creation.md:5-10`；`tests/unit/spec-commit-push-pr-context-contracts.test.js:21-69,110-138` | 无经验自动晋升职责；现有安全规则具有失败依据及聚焦回归测试源码，当前测试运行结果另属未验证。 |
| D08 | pass | `skills/spec-commit-push-pr/SKILL.md:34-39,77-102`；`skills/spec-commit-push-pr/references/pr-description-writing.md:116-120,147,159-171` | 按阶段读取 reference，复用已知计划与证据，不主动搜集无关计划，并限制可选教学候选数量。 |
| B01 | pass | `skills/spec-commit-push-pr/SKILL.md:3-4,12-30`；`skills/spec-commit-push-pr/agents/openai.yaml:1-2` | 内部 helper 身份明确，区分描述草拟、描述更新和完整落地，禁止隐式调用，也不把 watch 或 merge 收入自身职责。 |
| B02 | pass | `skills/spec-commit-push-pr/SKILL.md:14-16,113-128`；`skills/spec-commit-push-pr/references/commit-and-push.md:73`；`skills/spec-commit-push-pr/references/pr-description-writing.md:211-219` | 授权、owned scope、实际发布事实和决策来源均有约定；不能以 core/08 的拟议 YAML 字段尚未逐项实现直接判失败。 |
| B03 | pass | `skills/spec-commit-push-pr/SKILL.md:14-16,28-30`；`skills/spec-commit-push-pr/references/compose.md:28-33`；`skills/spec-commit-push-pr/references/commit-and-push.md:60-73` | commit、landing、archive 分权，pipeline token 不授予权限，推送要求精确接收端，landing 不扩张为反馈回复或历史重写授权。 |
| B04 | not-verified | `skills/spec-commit-push-pr/agents/openai.yaml:1-2`；`skills/spec-commit-push-pr/SKILL.md:18`；`tests/unit/ce-upstream-skill-sync-contracts.test.js:29-49` | 源码声明了宿主适配与隐式调用限制，但本轮未追踪 runtime generator、各宿主投射或实际加载，不能确认投射保真与漂移状态。 |
| B05 | pass | `skills/spec-commit-push-pr/references/commit-and-push.md:21-34,66-73`；`skills/spec-commit-push-pr/references/branch-creation.md:54-70`；`skills/spec-commit-push-pr/references/apply-and-handoff.md:75-80` | dirty overlap、hook/index 漂移、提交结果未知、checkout 碰撞和 PR 写入未知均要求查状态、保留事实，不盲目重试。 |
| B06 | fail | `skills/spec-commit-push-pr/evals/cases/description-only-non-mutating.yaml:7-19`；`skills/spec-commit-push-pr/evals/fixtures/scripts/check-desc-only.sh:52-69,197-204` | 描述草拟 eval 只检查非空输出与部分无副作用事实，未核验描述或正确阻塞结果，无法识别未交付，见 F3。 |
| X01 | pass | `skills/spec-commit-push-pr/references/commit-and-push.md:8-34,48-54`；`skills/spec-commit-push-pr/references/pr-description-writing.md:116-120,223-243` | 适用复杂变更收尾：支持小量逻辑提交组、共享文件隔离和完整范围叙事，不越权承担需求分解或另造编排。 |
| X02 | pass | `skills/spec-commit-push-pr/references/pr-description-writing.md:227-243,329-336`；`skills/spec-commit-push-pr/references/commit-and-push.md:58` | 适用 API、架构或版本变更的落地表达：保留重大 claim、兼容/迁移证据及不确定性，版本触发标记需显式确认；不负责执行迁移。 |
| X03 | pass | `skills/spec-commit-push-pr/references/commit-and-push.md:58-69`；`skills/spec-commit-push-pr/references/apply-and-handoff.md:75-80`；`skills/spec-commit-push-pr/SKILL.md:126-128` | 高风险外部写入要求精确提交状态的发布证据与远端回读，不扩张为部署、合并或历史重写；强制能力披露缺口归 F1。 |
| X04 | pass | `skills/spec-commit-push-pr/SKILL.md:111-128`；`skills/spec-commit-push-pr/references/apply-and-handoff.md:82-95`；`skills/spec-lfg/references/shipping-tail.md:55-65` | 适用 helper→owner 协作交接：保留 SHA、授权来源、未决对象、私有引用与限制，由 caller 重新核验并负责最终关闭。 |

## Findings

### F1 · P2：发布验证约定未披露实际强制边界

- **位置：** `skills/spec-commit-push-pr/references/commit-and-push.md:58-69`。
- **事实：** 文案要求检查发布前置条件、验证精确提交状态，并在证据缺失时停止，但实际动作仍由模型直接调用 Git；入口及必读 references 没有说明这些停止义务未由专用运行时机制硬强制。
- **合同依据：** `docs/methodology/结构化项目角色契约.md:72-74` 要求没有可验证 blocking primitive 时声明为响亮约定，并说明未强制范围。
- **后果：** 消费者可能把“定义了 publishing gate”理解成“工具必然阻断未验证推送”。现有字符串断言不能证明这种强制能力。
- **最小修复建议：** 在共享 push contract 明确标注：发布证据选择与调用前停止属于 workflow 文案约定，当前没有专用运行时强制器；Git/宿主权限不证明语义前置条件已满足。无需为消除该文案缺口新建中心化执行引擎。
- **复验：** 检查入口和共享 contract 的强度表述一致，并增加对应静态断言；行为是否遵守仍需单独 eval。

### F2 · P3：流程拆分后残留失效指路

- **位置：**
  - `skills/spec-commit-push-pr/SKILL.md:24-25`；
  - `skills/spec-commit-push-pr/references/pr-description-writing.md:37,195`。
- **事实：** description-update 路径仍引用不存在的 `DU-3`；教学归档处称提交、推送转换和 frontmatter 位于 `SKILL.md` Step 7，而 Step 7 实际只指向 `references/apply-and-handoff.md`。
- **后果：** 按实际调用路径阅读时需要额外推断，降低 ownership 可定位性；后续维护容易在旧位置继续补规则。
- **最小修复建议：** 用现存的“Description Update workflow / Step 6”替换 `DU-3`，将归档实施规则直接指向 `references/apply-and-handoff.md`。不必恢复已删除的子步骤。
- **复验：** 核对所有流程标签和 ownership 指向均有现存目标。

### F3 · P2：描述草拟 eval 可把“未交付”判作成功

- **位置：**
  - `skills/spec-commit-push-pr/evals/cases/description-only-non-mutating.yaml:7-19`；
  - `skills/spec-commit-push-pr/evals/fixtures/scripts/check-desc-only.sh:52-69,197-204`。
- **事实：**
  - case 要求草拟 PR 描述；
  - judge 仅要求 engine 成功、最终消息非空、相关 Git/文件状态不变且未记录到特定远端写入；
  - 没有核验输出包含有依据的标题和正文，或准确报告无法构造描述的阻塞原因；
  - fixture preparation 只建立 baseline commit 并修改未提交的 README，而描述合同明确未提交改动不能当作已发布 PR 内容，见 `references/pr-description-writing.md:73,101-103`。
- **后果：** 在受检状态保持不变的情况下，一条无关的非空回复也可能通过 judge；同时，fixture 没有清楚建立有效描述范围，难以区分正确拒绝、无效输出和实际完成草拟。
- **最小修复建议：** 先固定 case 意图：若测成功草拟，准备有效 base/head 提交范围并检查关键描述事实；若测无范围或缺证据的诚实退出，则明确预期阻塞原因并核验输出。保留现有无副作用检查。
- **复验：** 增加至少一个“无关非空回复应失败”的 judge 负例，以及匹配 fixture 的正确产物正例。本轮未执行，不能声称已观察到实际误判。

## 主责深挖面发现

### B01–B04：边界总体成立，投射证据不能混同源码证据

- **入口与职责保持现状成立。** `user-invocable: false` 与 `allow_implicit_invocation: false` 相互配合；三种模式并不授权用户绕过 public owner。描述草拟不写 PR，描述更新需要 landing authority，完整落地不自带 merge/watch 职责。
- **实际调用链可对账。** LFG 在 `skills/spec-lfg/references/shipping-tail.md:38-51` 传递授权来源与范围，并在 `:55-65` 接管 watch、后续复验和未决事项；不是仅靠 helper 的自述推断消费者。
- **core/08 不机械套用。** 审查流程在 `docs/plans/2026-11-03-skill-optimization-initiative/process/REVIEW-EXECUTION-WORKFLOW.md:45,62` 明确拟议 YAML 不是默认现行合同。因此，没有仅凭缺少 `ReviewResultSchema`、`commit_info` 等字段登记缺陷。
- **信任边界保持现状成立。** 现有 PR 正文用于保留内容与构造描述，不独立提供授权；body 通过 literal file 传输，提交、推送、归档和反馈回复权限分离。见 `references/apply-and-handoff.md:60-79,95`。
- **宿主支持仍有证据缺口。** 本轮确认的是 source 声明，不是所有宿主最终投射结果。没有读取或修改 runtime mirror，也没有把 fresh-source 阅读当作自然入口加载验证。

### X01–X04：适用于“复杂变更的收尾”，不应扩建成完整交付平台

- **X01：** 多模块变更的必要能力是提交归属、共享文件隔离、范围完整性与恢复；当前已有针对性约定。需求分解、依赖编排仍属上游。
- **X02：** 当前合同要求表达重大决策、兼容/迁移证据和版本影响，而不是由该 helper 创建 ADR 或实施迁移。`BREAKING CHANGE` 的自动化后果有单独确认要求。
- **X03：** 发布前验证和精确远端目标是本 Skill 的实质安全边界；保留这些约束成立，但应修正 F1 的强度披露，不能以“有文案”宣称“有硬强制”。
- **X04：** `needs-human` 对象原样保留、私有反馈引用不外贴、局部落地不等于整体完成的设计成立。`watch_handoff` 是即时事实交接，不应被宣称为已验证的跨会话恢复机制。

## 未读文件

| 路径 | 理由 | 未覆盖后果 |
|---|---|---|
| `/Users/kuang/.codex/AGENTS.md` | 读取未获准；未重试绕过权限 | 无法确认其中是否另有适用的全局兼容指令。 |
| `skills/spec-commit-push-pr/evals/fixtures/repos/mini-ledger/README.md`、`package.json`、`src/server.js` | 本轮未执行 fixture，F3 可由 case、prepare 和 judge 合同直接定位 | 未核对 fixture 原始字节与 judge 中 hash 的一致性，不评价 fixture 可运行性。 |
| `skills/spec-commit-push-pr/evals/fixtures/scripts/check-landing-gate.sh:1-196` | 仅读取其最终调用段；未对其公共 helper 实现逐行复核 | 不对 landing-gate judge 的完整正确性或与另一 judge 的一致性作结论。 |
| `scripts/evals/build-outcome-judges.cjs` | 属于 eval judge 生成器，未继续展开 | F3 定位到当前生成产物；实施时仍需追踪 builder，不能直接手改生成脚本宣称 durable 修复。 |
| `src/cli/`、`templates/` 中的宿主投射实现 | 指定消费者清单没有列出具体 generator 文件，本轮未扩展为生成链审计 | B04 保留 `not-verified`，不能确认各宿主投射与 runtime drift。 |
| `.claude/`、`.codex/` 等 generated runtime mirrors | 本轮为冻结 source 静态盲评，不以 runtime 替代 source | 未验证自然入口、实际加载版本或多宿主运行效果。 |
| 指定消费者测试引用的其他非目标 Skill 源码 | 四份测试已通读，仅额外展开直接相关的 LFG shipping consumer | 不将这些测试对其他 Skill 的断言视为本轮已核验事实。 |

## 结论一句话

**该 Skill 的职责、授权、隔离和上游收尾衔接总体清晰，但静态层存在发布门强制能力披露、失效指路及描述 eval 判据三项缺口；宿主投射尚未验证，不能据本轮审查宣称整体通过或行为收益已证实。**
