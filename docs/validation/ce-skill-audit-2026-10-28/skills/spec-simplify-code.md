# spec-simplify-code ↔ ce-simplify-code 能力融合审查

状态：`source_review_complete`。双方全部 27 个包内文件与 24 个直接调用方、共享合同及评测文件已全文核对；本轮又以已完成的 debug/LFG/commit/handoff 审查及 CE implementation-loop 全文复核 proof-test 与 caller-owned 返回边界。本文是单模型源码融合裁定，不是全局审查完成、merge-ready、真实行为验证或实施记录。

## 意图与研发定位

双方核心目标相同：在实现之后、正式 review 之前，保持输出、错误、副作用与顺序，改善可理解性、复用与效率，不以删行数衡量收益。本地入口另有明确 bug 路由、用户授权后才派发、inline 降级与独立覆盖声明；CE 当前范围已扩展为按需审查测试和注释，并分离 standalone 报告与 pipeline 清理。

这不是“本地少了两个 persona，补齐即完成”的问题。本地 `spec-work` 已有更完整的 ownership、protected surface、验证证据与完成声明约束；可吸收的是 CE 在 simplify 边界内更具体的防退化规则和针对它们的评测方法。

本项 source-of-truth 为双方 `skills/*/` 与列明的调用方、合同和测试。没有修改被审 Skill、CLI、测试或 generated runtime。确定性脚本只用于核对文件 hash、记录覆盖和执行隔离的 judge 输入探针；融合充分性仍是语义判断。

## 能力对照与裁定

以下路径省略仓库绝对前缀：本地均相对于 `/Users/kuang/xiaobu/spec-first`，CE 均相对于 `/Users/kuang/xiaobu/compound-engineering-plugin`。完整逐文件路径、hash 和读取范围见本项文件表。

| 研发场景 / 能力 | CE 源码事实 | spec-first 事实与已有增强 | 缺口与裁定 | 最小融合点 / 成本 / 验证 |
| --- | --- | --- | --- | --- |
| 实现或修复后清理，不破坏用于证明改动的测试 | `skills/ce-simplify-code/SKILL.md:62` 保护 `proof-test:` 路径、session evidence 指向的测试及它们调用的 test-only code；不冻结生产实现。`ce-work/references/implementation-loop.md:91`、`shipping-workflow.md:17`、`lfg/references/review-followup.md:11` 与 `ce-debug/references/post-fix-handoff.md:15` 显式传入测试路径 | 本地 simplify 只有一般行为保持和不弱化测试要求（入口 67–82）；work 已有 proof/characterization 和 final proof reconciliation，但 `implementation-loop.md:58`、`shipping-workflow.md:66`、LFG followup 10–14、debug 287 没有传入并冻结证明用例的专门约定 | **建议集成，优先级高。** 重跑变绿不能独立排除“测试和实现一起被改弱”；保留既有验证依据有直接研发价值。当前未证明真实模型已经发生该错误 | 在现有调用处传已有证据中的路径，simplify 将其作为保护上下文而非新增可改 scope；未知哪些测试承担证明时，保守不删改本次新改测试。无需新 coordinator/schema。成本为几处 prose 与定向 eval；验证测试与 seam 字节保持、生产代码仍可等价重构、修改后复跑结果 |
| 清理无效、重复或过度 mock 的测试 | CE `test-value-reviewer.md:3–23` 给出 false-confidence、内部调用耦合、重复覆盖、test-only seam、源码清单镜像等 rubric；要求运行当前测试、读取源码/调用者/重叠测试，失败或无法运行的测试不准建议删除；独立契约、唯一公共/安全测试受保护 | 本地只有 reuse/quality/efficiency 三 lens。`spec-work/references/feedback-and-tests.md:75–94` 已有相当多测试质量与 false-green 原则；`implementation-quality.md:110–117` 已有 remove-now/protected 分类，但 standalone simplify 未接入明确的测试价值审查 | **建议按需集成，先报告。** 不再复制一套 work 测试哲学；补充的是 simplify 中的具体候选证明和去重处置。默认将每次 pass 变成五 reviewer 没有必要 | scope 含相关测试且任务允许时按需加载窄 rubric；必须先落地上一项保护。初期仅报告测试删改建议，实施授权已有时可适配，不强制再审批。验证“已有失败”“唯一协议测试”“重复实现断言”“proof test”四类及 remaining-test 证据；真实成本收益待实测 |
| “审查一下”与“直接简化”保持不同副作用 | CE 入口 11–14、54 与 `standalone-report.md:11,25` 分开 report/apply，并在后续 apply 时回读当前源码；显式 pipeline token 覆盖调用来源推断 | 本地入口 63–65 会聚合后直接修。项目角色契约与当前全局规则已区分只读审查、执行请求和已有授权持续有效；本地派发规则也不从 invocation 推导授权 | **吸收意图区分，保留本地授权设计。** 避免用户只要审查时误编辑；同时不能照搬 CE “未说无需确认就停”的更宽泛规则，否则会使明确的本地执行请求反复等待 | 轻量声明 report-only / apply，由用户意图及可见上游授权决定；mode 只选交互策略，不授予写、派发、commit 或 landing 权限。不建刚性状态机。验证只读请求零写、明确简化请求连续完成、caller-owned pass 返回 caller |
| 修复后清理不吞入用户已有 WIP | CE `post-fix-handoff.md:13–17` 固定 fix-owned scope、重叠文件跳过；入口 56 明确 scope 外只读，import/export 修改也不得突破命名边界 | 本地 debug 240–242、287 已保护 dirty overlap 和 fix-owned scope，simplify 15、21–32 也明确用户范围与 settled structure；本地 work 对 required verification、privacy、observability、compatibility 的保护更广 | **已有等价或更强实现，保留。** 可从 CE 吸收“为了修 import/export 也不能越出命名路径”的简洁表述；不复制新的 scope owner | 仅在 simplify 的编辑边界补一句澄清；caller 的 owner/dirty 检查保持原位。验证命名目录需改外部 importer 时跳过、内部仍可修，以及 deliberate duplication 不被误合并 |
| 删除依赖/平台已保证的重复逻辑，避免误改序列化或值转换 | CE `code-reuse-reviewer.md:5` 要求点名保证的 provider，仅删保证直接拥有的行为，保留 projection 前的值转换；serializer/coercion 替换须有覆盖相关值类型的直接比较；`code-quality-reviewer.md:5` 指出移除 guard 后新可达的分支不是死代码 | 本地 reuse 3–6 已覆盖 stdlib 等价性及 locale/serialization 边界，quality 11、13 对 unused 和抽象意图更详细；work ownership lens 已要求检查 source owner，但未把这些组合重构反例写入 simplify rubric | **建议窄化吸收。** 价值是降低多种“等价”优化叠加时的漏判；不需要照搬整套 CE 更短 persona | 在现有 reuse/quality lens 各追加具体反例，保留本地 dead-code 结构检索和不确定则跳过。用 null/undefined/日期/数值等实际支持的输入对照，以及 guard 移除后的可达分支验证；不新增泛化运行框架 |
| 清理迭代遗留名字与未发布兼容层 | CE `code-quality-reviewer.md:12–13` 检查对话/迭代词汇；仅在无部署、持久化、公开、外部、其他分支及 scope 外调用者且所有修改可收敛时删除未发布兼容层 | 本地 quality 1–15 未单列这两项；work `implementation-quality.md:28–51,110–117` 已有当前 owner 与 protected compatibility 规则，CLI/runtime 多宿主兼容是真实 consumer | **词汇规则可窄化集成；兼容层清理暂缓自动应用。** 不把“本次新建”误当“未被消费”，也不在本轮扩大成全仓兼容迁移 | 优先记录当前 scope 中难理解的临时词；兼容路径只作 source-backed 候选，明确 consumer inventory 及重新评估条件。代价主要在确认外部消费者，不适合默认每次执行 |
| 注释治理，保留源码难表达的知识 | CE `comment-reviewer.md:3–20` 默认删注释，保留 license、外部约束、公开 API、issue/spec 链接、工具指令及项目强制注释；对可执行约束提出 encode，pipeline 无法 reshape 时仍删解释自有代码的注释 | 本地 quality 10、13 保留 non-obvious WHY、隐藏约束及 workaround；work protected 还覆盖 observability、rollback、owner constraint。本地目标包含可失效知识与跨会话传递，不要求注释一律消失 | **保留本地设计，不采纳默认删除。** CE keep-list 对工具指令、生成标记、版权保护有可用细节；删除无法重构的非显然解释可能损害下一次维护。只读源码比较不能证明其净收益 | 在现有 quality lens 补工具可消费注释不能当 prose 删除。encode 只针对真实可机械断言且风险相称的约束，不为删除解释制造新测试。保留 WHY 的决定应与当前源码一致；不加第五星默认 reviewer |
| 跨宿主派发与 worker 生命周期 | CE `reviewer-dispatch.md:5–11` generic worker、backpressure、收集终态后释放由本次 review 拥有的 agent；入口 48–50 保留用户/项目指定模型优先 | 本地入口 36–61 已有显式授权、live capability、未知串行、模型继承、inline 覆盖诚实声明；共享 `worker-dispatch-capability.md:76–106` 更完整。未派发不声称独立 reviewers | **保留本地设计。** 不导入 CE 宿主名/primitive 映射；若后续真实宿主有 caller-owned release，可在既有生命周期边界补支持，无需建新 manager | 先确认真实工具能力与 owner 再释放，不发明 cleanup，也不把 completion 当释放容量。本轮未 dispatch、未执行 lifecycle/跨模型评测 |
| 评测是否抓住“声称保持、实际改坏” | CE `tests/skill-eval-cell/packs/ce-simplify-code-pruning.md:18,38–43,348–407` 比较工作区字节、proof test、旧失败用例、提交数及范围；另有 blind 报告评分。其 49–78 的成绩是 CE 文档声明，未在本轮重跑 | 本地 4 个 case 主要检查输出关键词、`JSON.parse`/`try` 文本。已隔离运行 6 个 judge 探针：删除目标文件仍通过两个 safety judge，保留 try 但移除金额校验仍通过，修改文档但说“无需简化”仍通过 no-yield judge；正常/裸 JSON.parse 对照按预期分别返回 0/1 | **建议优先吸收结果导向的评测方法。** 本地 `feedback-and-tests.md:93` 已要求 false-green 反证，本次确认现有 simplify judges 对它声称的保护不充分。不是已证明真实宿主会删文件或安全校验 | 校验目标存在、授权范围和 pre/post snapshot；用真实 HTTP 有效/无效 JSON、金额输入及数据结果证明行为；同时接纳合法 parse helper 重构。proof-tests 字节保持与 mutation scope 分开观察。CE grader 自身仍用 fixture marker/regex，不能作为通用语义 oracle；不复制其全部 419 行或沿用其通过率 |

## 最小可维护落地顺序（仅建议）

1. 先补结果导向 eval 和 proof-test 保护，明确 caller 传递及未知时的保守处理；两项相互支撑。
2. 将测试价值 rubric 作为条件式只读 lens 接入，复用 work 已有测试质量/证据规则；有足够行为证据后再评估默认执行范围。
3. 窄化补充平台保证、可达分支、词汇与工具注释规则；保留本地 protected/ownership 和意图授权策略。
4. 对新复杂度做 fresh-source/真实宿主和任务对照；若清理收益不抵阅读、运行与审查成本，保持可选或撤回。不得据目录齐全宣布融合成功。

不需要新增 workflow、中央 coordinator、测试裁决器、派发框架、runtime patch 或全仓删注释计划。以上尚未实施，不代表已获得后续产品写入授权。

## 运行事实与问题附录

- 运行证据：[simplify-judge-probes.json](../simplify-judge-probes.json)。仅在自动清理的临时目录复制 fixture 并调用当前 source judge，未运行产品服务或模型。
- `check-safety-preserved.sh:7` 与 `check-r2-safety-stays.sh:6` 在文件不存在时直接跳过保护条件；这是实际返回码事实。`check-no-yield-scope.sh:6–10` 只检查 message，不读取 workspace；其注释中的“不改文件”不是被脚本强制的事实。
- 这些是评测覆盖缺口，不能推成生产安全漏洞或真实模型失败；作为融合评测候选列入，未经过独立 validator，`validation_status: unresolved`，本轮 Actionable Findings 不含自动修复项。
- 已有测试批次的 6 suites / 74 tests、17 suites / 357 tests 不在本轮重复；它们不能证明新增候选的真实模型效果。本轮新增检查是上述 6 个 judge 输入探针，不是 6 个宿主行为 eval。
- 未执行 fresh-source 独立 reviewer、真实 host simplify、真实测试删改行为、CE pack 的 host runner 或多轮 apply 场景。未获独立派发授权，采用 inline；不声称 independent 或 merge-ready。

## 覆盖与整体边界

- 27 个包内文件：本地入口、3 persona、全部 eval/cases/fixtures/scripts；CE 入口、5 persona、dispatch、standalone-report，均全文审读；首次大输出中截断的 CE 入口 28–50 已单独重读。
- 24 个包外文件：包括双方 work/debug/LFG 的直接调用合同、本地 explain/compound 调用边界、共享 worker 合同、本地相关测试及 helper、CE pruning pack，逐文件全文读取并登记；本地 shipping 输出截断段 80–92、CE shipping 21–33 已重读。
- 本项直接调用、proof-test 和授权接口已收敛；各 caller 的完整 Skill 包仍独立计数，不以本项依赖阅读代替其全包审查。
- 上表9项能力比较与最小融合建议已定稿；实际收益、成本及全局优先级仍待真实任务验证与其余 Skill 审查。主表仅标本项源码审查完成。
